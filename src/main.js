const cron = require("node-cron");
const NotificationService = require("./services/notificationService");
const config = require("./config/environment");
const logger = require("./utils/logger");

/**
 * Aplicación principal para el sistema de recordatorios
 * Maneja diferentes modos de ejecución: cron, once, test
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
        case "cron":
          await this._startCronJob();
          break;
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
          this._showUsage();
      }
    } catch (error) {
      logger.error("Error en aplicación principal:", error.message);
      process.exit(1);
    }
  }

  /**
   * Inicia el cron job
   * @private
   */
  async _startCronJob() {
    logger.info("⏰ Iniciando cron job...");
    logger.info(`📅 Programación: ${config.business.cronSchedule}`);
    logger.info("   Dom, Mar, Mié, Vie, Sáb a las 8:00 AM");

    // Validar expresión cron
    if (!cron.validate(config.business.cronSchedule)) {
      throw new Error(
        `Expresión cron inválida: ${config.business.cronSchedule}`
      );
    }

    // Iniciar cron job
    cron.schedule(
      config.business.cronSchedule,
      async () => {
        logger.info("\n🔔 Cron job ejecutándose...");
        try {
          await this.notificationService.executeNotificationProcess();
          logger.success("✅ Cron job completado exitosamente");
        } catch (error) {
          logger.error("❌ Error en cron job:", error.message);
        }
      },
      {
        scheduled: true,
        timezone: "America/Bogota", // Zona horaria Colombia
      }
    );

    logger.success("🚀 Cron job iniciado exitosamente");
    logger.info("⏳ Esperando próxima ejecución programada...");

    // Mantener el proceso activo
    process.on("SIGINT", () => {
      logger.info("\n🛑 Deteniendo cron job...");
      process.exit(0);
    });
  }

  /**
   * Ejecuta una vez y termina
   * @private
   */
  async _runOnce() {
    logger.info("🎯 Ejecutando una vez...");

    const stats = await this.notificationService.executeNotificationProcess();

    logger.success("✅ Ejecución completada");
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
    logger.info("🧪 Ejecutando pruebas de conectividad...");

    const results = await this.notificationService.testConnectivity();

    console.log("\n📊 RESULTADOS DE CONECTIVIDAD:");
    console.log("================================");

    if (results.googleSheets.success) {
      logger.success(
        `Google Sheets: ✅ Conectado (${results.googleSheets.recordCount} registros)`
      );
    } else {
      logger.error(`Google Sheets: ❌ Error - ${results.googleSheets.error}`);
    }

    if (results.twilio.success) {
      logger.success(`Twilio: ✅ Conectado (${results.twilio.accountName})`);
    } else {
      logger.error(`Twilio: ❌ Error - ${results.twilio.error}`);
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

    if (args.includes("--cron")) return "cron";
    if (args.includes("--once")) return "once";
    if (args.includes("--test")) return "test";
    if (args.includes("--notifications")) return "notifications";
    if (args.includes("--reminders")) return "reminders";
    if (args.includes("--diagnostic")) return "diagnostic";

    // Modo por defecto
    return "once";
  }

  /**
   * Muestra información de inicio
   * @private
   */
  _showStartupInfo() {
    console.log("\n" + "=".repeat(60));
    console.log("🎤 SISTEMA DE RECORDATORIOS PARA PREDICADORES");
    console.log("=".repeat(60));
    logger.info(`📅 Fecha actual: ${new Date().toLocaleDateString("es-ES")}`);
    logger.info(
      `🔧 Modo Twilio: ${
        config.twilio.useTemplates
          ? "Sandbox (Templates)"
          : "Producción (Texto libre)"
      }`
    );
    logger.info(
      `📊 Límite recordatorios: ${config.business.reminderDaysLimit} días`
    );
    logger.info(`⏱️  Cooldown: ${config.business.cooldownDays} días`);
    console.log("=".repeat(60));
  }

  /**
   * Muestra información de uso
   * @private
   */
  _showUsage() {
    console.log("\n📖 USO:");
    console.log("--------");
    console.log("node src/main.js [opción]");
    console.log("");
    console.log("OPCIONES:");
    console.log("  --once         Ejecutar una vez y terminar (por defecto)");
    console.log("  --cron         Iniciar cron job programado");
    console.log("  --test         Probar conectividad de servicios");
    console.log("  --notifications Solo enviar notificaciones iniciales");
    console.log("  --reminders    Solo enviar recordatorios");
    console.log("  --diagnostic   Mostrar información de diagnóstico");
    console.log("");
    console.log("EJEMPLOS:");
    console.log("  npm run send          # Ejecutar una vez");
    console.log("  npm run send:cron     # Iniciar cron job");
    console.log("  npm run test          # Probar conectividad");
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
