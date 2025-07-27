const Predicador = require("../models/predicador");
const GoogleSheetsService = require("./googleSheetsService");
const MessageService = require("./messageService");
const DateFormatter = require("../utils/dateFormatter");
const config = require("../config/environment");
const logger = require("../utils/logger");

/**
 * Servicio principal para manejo de notificaciones y recordatorios
 * Implementa la lógica de negocio principal del sistema
 */
class NotificationService {
  constructor() {
    this.googleSheetsService = new GoogleSheetsService();
    this.messageService = new MessageService();
    this.sentMessagesToday = new Set(); // Evita múltiples mensajes al mismo usuario
  }

  /**
   * Ejecuta el proceso completo de notificaciones
   * @returns {Promise<Object>} Estadísticas de la ejecución
   */
  async executeNotificationProcess() {
    logger.info("📧 Iniciando proceso de notificaciones y recordatorios...");
    logger.info(
      `🔧 Modo: ${
        config.twilio.useTemplates
          ? "Templates (Sandbox)"
          : "Texto libre (Producción)"
      }`
    );

    const stats = {
      processed: 0,
      notifications: 0,
      reminders: 0,
      todayReminders: 0,
      errors: 0,
      uniqueUsers: 0,
    };

    try {
      // Validar configuración
      this._validateConfiguration();

      // Leer datos de Google Sheets
      const rawData = await this.googleSheetsService.readSheetData();

      if (rawData.length === 0) {
        logger.warn("📭 No hay datos para procesar");
        return stats;
      }

      // Convertir a objetos Predicador
      const predicadores = Predicador.fromRawDataArray(rawData);
      stats.processed = predicadores.length;

      logger.info(`📝 Predicadores válidos: ${predicadores.length}`);
      logger.info(
        `📅 Fecha de hoy: ${DateFormatter.today().toLocaleDateString("es-ES")}`
      );

      // Ejecutar los 3 pasos del proceso
      await this._executeStep1(predicadores, stats);
      await this._executeStep2(predicadores, stats);
      await this._executeStep3(predicadores, stats);

      // Calcular estadísticas finales
      stats.totalMessages =
        stats.notifications + stats.reminders + stats.todayReminders;
      stats.uniqueUsers = this.sentMessagesToday.size;

      // Mostrar resumen final
      logger.logFinalSummary(stats);

      return stats;
    } catch (error) {
      logger.error(
        "Error ejecutando proceso de notificaciones:",
        error.message
      );
      stats.errors++;
      throw error;
    }
  }

  /**
   * PASO 1: Notificaciones iniciales
   * @private
   */
  async _executeStep1(predicadores, stats) {
    logger.logStep(1, "Enviando notificaciones iniciales...");

    for (const predicador of predicadores) {
      try {
        // Saltar si ya recibió mensaje hoy
        if (this.sentMessagesToday.has(predicador.telefono)) {
          logger.skip(
            `${predicador.nombre} - Ya recibió mensaje en esta ejecución`
          );
          continue;
        }

        // Verificar si necesita notificación inicial
        if (!predicador.hasBeenNotified()) {
          logger.logUserProcessing(
            predicador.nombre,
            predicador.telefono,
            `Notificado: "${predicador.notificado}"`
          );

          // Enviar notificación
          const result = await this.messageService.sendNotification(predicador);

          if (result.success) {
            // Marcar como notificado
            await this.googleSheetsService.markAsNotified(predicador.rowIndex);

            // Marcar fecha de recordatorio para cooldown
            await this.googleSheetsService.markReminderSent(
              predicador.rowIndex
            );

            // Agregar a lista de usuarios contactados hoy
            this.sentMessagesToday.add(predicador.telefono);
            stats.notifications++;
          } else {
            logger.error(
              `Error en notificación inicial para ${predicador.nombre}:`,
              result.error
            );
            stats.errors++;
          }
        } else {
          logger.info(`${predicador.nombre} - Ya notificado anteriormente`);
        }
      } catch (error) {
        logger.error(
          `Error procesando notificación inicial para ${predicador.nombre}:`,
          error.message
        );
        stats.errors++;
      }
    }
  }

  /**
   * PASO 2: Recordatorios anticipados (1-15 días)
   * @private
   */
  async _executeStep2(predicadores, stats) {
    logger.logStep(2, "Enviando recordatorios anticipados (1-15 días)...");

    for (const predicador of predicadores) {
      try {
        // Saltar si ya recibió mensaje hoy
        if (this.sentMessagesToday.has(predicador.telefono)) {
          logger.skip(
            `${predicador.nombre} - Ya recibió mensaje en esta ejecución`
          );
          continue;
        }

        // Verificar si predica pronto
        if (predicador.preachesSoon()) {
          const daysUntil = predicador.getDaysUntilPreaching();

          logger.logUserProcessing(
            predicador.nombre,
            predicador.telefono,
            `Predica en ${Math.round(daysUntil)} días`
          );

          // Verificar cooldown
          if (predicador.canReceiveReminder()) {
            // Enviar recordatorio
            const result = await this.messageService.sendReminder(predicador);

            if (result.success) {
              // Marcar fecha de recordatorio
              await this.googleSheetsService.markReminderSent(
                predicador.rowIndex
              );

              // Agregar a lista de usuarios contactados hoy
              this.sentMessagesToday.add(predicador.telefono);
              stats.reminders++;
            } else {
              logger.error(
                `Error en recordatorio para ${predicador.nombre}:`,
                result.error
              );
              stats.errors++;
            }
          } else {
            const daysSince = predicador.getDaysSinceLastReminder();
            logger.skip(
              `${predicador.nombre} - Cooldown activo (${Math.round(
                daysSince
              )} días desde último mensaje)`
            );
          }
        }
      } catch (error) {
        logger.error(
          `Error procesando recordatorio para ${predicador.nombre}:`,
          error.message
        );
        stats.errors++;
      }
    }
  }

  /**
   * PASO 3: Mensajes del día (predican HOY)
   * @private
   */
  async _executeStep3(predicadores, stats) {
    logger.logStep(3, "Enviando recordatorios del día (¡HOY predican!)...");

    for (const predicador of predicadores) {
      try {
        // Saltar si ya recibió mensaje hoy
        if (this.sentMessagesToday.has(predicador.telefono)) {
          logger.skip(
            `${predicador.nombre} - Ya recibió mensaje en esta ejecución`
          );
          continue;
        }

        // Verificar si predica hoy
        if (predicador.preachesToday()) {
          logger.today(
            `${predicador.nombre} predica HOY - Verificando último recordatorio...`
          );

          // Verificar cooldown (mínimo 1 día)
          const daysSince = predicador.getDaysSinceLastReminder();
          const canSend = daysSince === null || daysSince >= 1;

          if (canSend) {
            // Enviar mensaje del día
            const result = await this.messageService.sendTodayMessage(
              predicador
            );

            if (result.success) {
              // Marcar fecha de recordatorio
              await this.googleSheetsService.markReminderSent(
                predicador.rowIndex
              );

              // Agregar a lista de usuarios contactados hoy
              this.sentMessagesToday.add(predicador.telefono);
              stats.todayReminders++;
            } else {
              logger.error(
                `Error en mensaje del día para ${predicador.nombre}:`,
                result.error
              );
              stats.errors++;
            }
          } else {
            logger.skip(`${predicador.nombre} - Ya recibió mensaje hoy`);
          }
        }
      } catch (error) {
        logger.error(
          `Error procesando mensaje del día para ${predicador.nombre}:`,
          error.message
        );
        stats.errors++;
      }
    }
  }

  /**
   * Valida la configuración de todos los servicios
   * @private
   */
  _validateConfiguration() {
    try {
      this.googleSheetsService.validateConfiguration();
      this.messageService.validateConfiguration();
      config.validateRequiredEnvVars();

      logger.debug("✅ Configuración validada exitosamente");
    } catch (error) {
      logger.error("❌ Error en configuración:", error.message);
      throw error;
    }
  }

  /**
   * Obtiene información de diagnóstico de todos los servicios
   */
  async getDiagnosticInfo() {
    return {
      config: {
        business: config.business,
        environment: process.env.NODE_ENV || "development",
      },
      googleSheets: await this.googleSheetsService.getDiagnosticInfo(),
      messaging: this.messageService.getDiagnosticInfo(),
      currentDate: DateFormatter.today().toISOString().split("T")[0],
    };
  }

  /**
   * Prueba la conectividad de todos los servicios
   */
  async testConnectivity() {
    logger.info("🔧 Probando conectividad de servicios...");

    const results = {
      googleSheets: { success: false },
      twilio: { success: false },
    };

    try {
      // Probar Google Sheets
      const sheetData = await this.googleSheetsService.readSheetData();
      results.googleSheets = {
        success: true,
        recordCount: sheetData.length,
      };
      logger.success("Google Sheets: Conectado");
    } catch (error) {
      results.googleSheets = {
        success: false,
        error: error.message,
      };
      logger.error("Google Sheets: Error de conexión");
    }

    try {
      // Probar Twilio
      const twilioTest = await this.messageService.testConnection();
      results.twilio = twilioTest;

      if (twilioTest.success) {
        logger.success("Twilio: Conectado");
      } else {
        logger.error("Twilio: Error de conexión");
      }
    } catch (error) {
      results.twilio = {
        success: false,
        error: error.message,
      };
      logger.error("Twilio: Error de conexión");
    }

    return results;
  }

  /**
   * Ejecuta solo notificaciones iniciales (para testing)
   */
  async executeNotificationsOnly() {
    const stats = { processed: 0, notifications: 0, errors: 0 };

    try {
      const rawData = await this.googleSheetsService.readSheetData();
      const predicadores = Predicador.fromRawDataArray(rawData);
      stats.processed = predicadores.length;

      await this._executeStep1(predicadores, stats);

      return stats;
    } catch (error) {
      logger.error("Error ejecutando solo notificaciones:", error.message);
      throw error;
    }
  }

  /**
   * Ejecuta solo recordatorios (para testing)
   */
  async executeRemindersOnly() {
    const stats = { processed: 0, reminders: 0, todayReminders: 0, errors: 0 };

    try {
      const rawData = await this.googleSheetsService.readSheetData();
      const predicadores = Predicador.fromRawDataArray(rawData);
      stats.processed = predicadores.length;

      await this._executeStep2(predicadores, stats);
      await this._executeStep3(predicadores, stats);

      return stats;
    } catch (error) {
      logger.error("Error ejecutando solo recordatorios:", error.message);
      throw error;
    }
  }
}

module.exports = NotificationService;
