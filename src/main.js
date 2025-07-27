// Railway-optimized version - no node-cron needed
const NotificationService = require("./services/notificationService");
const config = require("./config/environment");
const logger = require("./utils/logger");

/**
 * Aplicación principal para el sistema de recordatorios
 * Optimizada para Railway Cron - ejecución stateless
 */
class ReminderApp {
  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Punto de entrada principal
   */
  async main() {
    try {
      // Mostrar información de inicio
      this._showStartupInfo();

      // Parsear argumentos de línea de comandos
      const mode = this._parseArguments();

      // Ejecutar según el modo
      switch (mode) {
        case "once":
          await this._runOnce();
          break;
        case "test":
          await this._runTests();
          break;
        case "notifications":
          await this._runNotificationsOnly();
          break;
        case "reminders":
          await this._runRemindersOnly();
          break;
        case "diagnostic":
          await this._runDiagnostic();
          break;
        default:
          await this._runOnce(); // Default: ejecutar proceso completo
      }

      // Terminar proceso explícitamente para Railway
      process.exit(0);
    } catch (error) {
      logger.error("Error en aplicación principal:", error.message);
      process.exit(1);
    }
  }

  /**
   * Ejecuta una vez y termina (modo principal para Railway Cron)
   * @private
   */
  async _runOnce() {
    logger.info("🎯 Ejecutando proceso de recordatorios...");

    const stats = await this.notificationService.executeNotificationProcess();

    logger.success("✅ Ejecución completada exitosamente");
    logger.info(
      `📊 Resumen: ${stats.totalMessages} mensajes enviados a ${stats.uniqueUsers} usuarios`
    );

    return stats;
  }

  /**
   * Ejecuta solo notificaciones iniciales
   * @private
   */
  async _runNotificationsOnly() {
    logger.info("📮 Ejecutando solo notificaciones iniciales...");

    const stats = await this.notificationService.executeNotificationsOnly();

    logger.success(
      `✅ Notificaciones completadas: ${stats.notifications} enviadas`
    );
    return stats;
  }

  /**
   * Ejecuta solo recordatorios
   * @private
   */
  async _runRemindersOnly() {
    logger.info("⏰ Ejecutando solo recordatorios...");

    const stats = await this.notificationService.executeRemindersOnly();

    logger.success(
      `✅ Recordatorios completados: ${
        stats.reminders + stats.todayReminders
      } enviados`
    );
    return stats;
  }

  /**
   * Ejecuta pruebas de conectividad
   * @private
   */
  async _runTests() {
    logger.info("🧪 Probando conectividad...");

    const results = await this.notificationService.testConnectivity();

    if (results.googleSheets.success) {
      logger.success(
        `Google Sheets: ✅ Conectado (${results.googleSheets.recordCount} registros)`
      );
    } else {
      logger.error(`Google Sheets: ❌ ${results.googleSheets.error}`);
    }

    if (results.twilio.success) {
      logger.success(`Twilio: ✅ Conectado`);
    } else {
      logger.error(`Twilio: ❌ ${results.twilio.error}`);
    }

    return results;
  }

  /**
   * Muestra información de diagnóstico
   * @private
   */
  async _runDiagnostic() {
    logger.info("🔍 Obteniendo información de diagnóstico...");

    const info = await this.notificationService.getDiagnosticInfo();

    console.log("\n📋 INFORMACIÓN DE DIAGNÓSTICO:");
    console.log("==============================");
    console.log(JSON.stringify(info, null, 2));

    return info;
  }

  /**
   * Parsea argumentos de línea de comandos
   * @private
   */
  _parseArguments() {
    const args = process.argv.slice(2);

    if (args.includes("--test")) return "test";
    if (args.includes("--notifications")) return "notifications";
    if (args.includes("--reminders")) return "reminders";
    if (args.includes("--diagnostic")) return "diagnostic";

    // Modo por defecto: ejecutar proceso completo
    return "once";
  }

  /**
   * Muestra información de inicio
   * @private
   */
  _showStartupInfo() {
    console.log("🎤 Sistema de Recordatorios - Iglesia");
    logger.info(`📅 ${new Date().toLocaleDateString("es-ES")}`);
    logger.info(`🌐 ${process.env.NODE_ENV || "development"}`);
  }


}

/**
 * Ejecutar aplicación si es llamada directamente
 */
if (require.main === module) {
  const app = new ReminderApp();
  app.main().catch((error) => {
    logger.error("Error crítico:", error.message);
    process.exit(1);
  });
}

module.exports = ReminderApp;
