class Logger {
  static LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
  };

  constructor(level = Logger.LEVELS.INFO) {
    this.level = level;
  }

  error(message, ...args) {
    if (this.level >= Logger.LEVELS.ERROR) {
      console.error(`❌ ${message}`, ...args);
    }
  }

  warn(message, ...args) {
    if (this.level >= Logger.LEVELS.WARN) {
      console.warn(`⚠️  ${message}`, ...args);
    }
  }

  info(message, ...args) {
    if (this.level >= Logger.LEVELS.INFO) {
      console.log(`ℹ️  ${message}`, ...args);
    }
  }

  debug(message, ...args) {
    if (this.level >= Logger.LEVELS.DEBUG) {
      console.log(`🔍 ${message}`, ...args);
    }
  }

  success(message, ...args) {
    if (this.level >= Logger.LEVELS.INFO) {
      console.log(`✅ ${message}`, ...args);
    }
  }

  summary(message, ...args) {
    if (this.level >= Logger.LEVELS.INFO) {
      console.log(`📊 ${message}`, ...args);
    }
  }

  logStep(stepNumber, stepName) {
    this.info(`PASO ${stepNumber}: ${stepName}`);
  }

  logMessageSent(type, name, sid) {
    const typeMap = {
      notificacion: "📮 NOTIFICACIÓN INICIAL",
      recordatorio: "⏰ RECORDATORIO",
      hoy: "🎤 HOY PREDICA",
    };

    this.success(
      `[${typeMap[type] || type.toUpperCase()}] ${name} – SID: ${sid}`
    );
  }

  logUpdateResult(name, field, value) {
    this.info(`💾 ${name} - ${field} actualizado a: ${value}`);
  }

  logFinalSummary(stats) {
    this.info(
      `📊 Procesados: ${stats.processed} | Mensajes: ${stats.totalMessages} | Usuarios: ${stats.uniqueUsers}`
    );
    if (stats.notifications > 0)
      this.info(`📮 Notificaciones: ${stats.notifications}`);
    if (stats.reminders > 0) this.info(`⏰ Recordatorios: ${stats.reminders}`);
    if (stats.todayReminders > 0)
      this.info(`🎤 Día actual: ${stats.todayReminders}`);
  }
}

// Instancia singleton del logger
const logger = new Logger(Logger.LEVELS.INFO);

module.exports = logger;
