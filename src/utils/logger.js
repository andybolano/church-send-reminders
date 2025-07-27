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

  processing(message, ...args) {
    if (this.level >= Logger.LEVELS.INFO) {
      console.log(`🔄 ${message}`, ...args);
    }
  }

  notification(message, ...args) {
    if (this.level >= Logger.LEVELS.INFO) {
      console.log(`📮 ${message}`, ...args);
    }
  }

  reminder(message, ...args) {
    if (this.level >= Logger.LEVELS.INFO) {
      console.log(`⏰ ${message}`, ...args);
    }
  }

  today(message, ...args) {
    if (this.level >= Logger.LEVELS.INFO) {
      console.log(`🎤 ${message}`, ...args);
    }
  }

  skip(message, ...args) {
    if (this.level >= Logger.LEVELS.INFO) {
      console.log(`⏭️  ${message}`, ...args);
    }
  }

  summary(message, ...args) {
    if (this.level >= Logger.LEVELS.INFO) {
      console.log(`📊 ${message}`, ...args);
    }
  }

  logStep(stepNumber, stepName) {
    this.processing(`PASO ${stepNumber}: ${stepName}`);
  }

  logUserProcessing(name, phone, status) {
    console.log(`\n👤 Procesando: ${name}`);
    console.log(`📱 Teléfono: ${phone}`);
    if (status) {
      console.log(`📮 Estado: ${status}`);
    }
  }

  logDateInfo(name, date, daysUntil) {
    console.log(
      `📅 ${name} - Fecha: ${date} (en ${Math.round(daysUntil)} días)`
    );
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
    console.log("\n" + "=".repeat(50));
    this.summary("RESUMEN DE EJECUCIÓN:");
    console.log("=".repeat(50));
    this.summary(`📋 Registros procesados: ${stats.processed}`);
    this.summary(`📮 Notificaciones iniciales: ${stats.notifications}`);
    this.summary(`⏰ Recordatorios enviados: ${stats.reminders}`);
    this.summary(`🎤 Recordatorios del día: ${stats.todayReminders}`);
    this.summary(`📤 Total mensajes: ${stats.totalMessages}`);
    this.summary(`👥 Usuarios únicos contactados: ${stats.uniqueUsers}`);
    console.log("=".repeat(50));
  }
}

// Instancia singleton del logger
const logger = new Logger(Logger.LEVELS.INFO);

module.exports = logger;
