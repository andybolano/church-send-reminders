const DateFormatter = require("../utils/dateFormatter");

/**
 * Estrategia base para mensajes
 * @abstract
 */
class MessageStrategy {
  constructor(useTemplates, templateConfig) {
    this.useTemplates = useTemplates;
    this.templateConfig = templateConfig;
  }

  /**
   * Crea las opciones del mensaje
   * @abstract
   */
  createMessageOptions(predicador, fromNumber) {
    throw new Error("Método createMessageOptions debe ser implementado");
  }

  /**
   * Obtiene el tipo de mensaje para logging
   * @abstract
   */
  getMessageType() {
    throw new Error("Método getMessageType debe ser implementado");
  }
}

/**
 * Estrategia para notificación inicial
 */
class NotificationStrategy extends MessageStrategy {
  createMessageOptions(predicador, fromNumber) {
    const messageOptions = {
      from: fromNumber,
      to: `whatsapp:${predicador.getFormattedPhone()}`,
    };

    if (this.useTemplates) {
      messageOptions.contentSid = this.templateConfig.notification;
      messageOptions.contentVariables = JSON.stringify({
        1: predicador.nombre,
        2: predicador.getFormattedDate(),
      });
    } else {
      messageOptions.body = `Hola ${
        predicador.nombre
      }, te confirmamos que el ${predicador.getFormattedDate()} predicarás. ¡Que Dios te bendiga en tu preparación!`;
    }

    return messageOptions;
  }

  getMessageType() {
    return "notificacion";
  }
}

/**
 * Estrategia para recordatorio anticipado
 */
class ReminderStrategy extends MessageStrategy {
  createMessageOptions(predicador, fromNumber) {
    const messageOptions = {
      from: fromNumber,
      to: `whatsapp:${predicador.getFormattedPhone()}`,
    };

    if (this.useTemplates) {
      messageOptions.contentSid = this.templateConfig.reminder;
      messageOptions.contentVariables = JSON.stringify({
        1: predicador.nombre,
        2: predicador.getFormattedDate(),
      });
    } else {
      messageOptions.body = `Hola ${
        predicador.nombre
      }, te recordamos que próximamente (${predicador.getFormattedDate()}) predicarás. ¡Prepárate en oración!`;
    }

    return messageOptions;
  }

  getMessageType() {
    return "recordatorio";
  }
}

/**
 * Estrategia para mensaje del día
 */
class TodayStrategy extends MessageStrategy {
  createMessageOptions(predicador, fromNumber) {
    const messageOptions = {
      from: fromNumber,
      to: `whatsapp:${predicador.getFormattedPhone()}`,
    };

    if (this.useTemplates) {
      messageOptions.contentSid = this.templateConfig.reminder;
      messageOptions.contentVariables = JSON.stringify({
        1: predicador.nombre,
        2: "HOY",
      });
    } else {
      messageOptions.body = `¡Hola ${predicador.nombre}! 🎤 HOY es tu día de predicación. ¡Que Dios te use poderosamente y bendiga tu mensaje! 🙏`;
    }

    return messageOptions;
  }

  getMessageType() {
    return "hoy";
  }
}

/**
 * Factory para crear estrategias de mensajes
 */
class MessageStrategyFactory {
  constructor(useTemplates, templateConfig) {
    this.useTemplates = useTemplates;
    this.templateConfig = templateConfig;
  }

  /**
   * Crea estrategia de notificación inicial
   */
  createNotificationStrategy() {
    return new NotificationStrategy(this.useTemplates, this.templateConfig);
  }

  /**
   * Crea estrategia de recordatorio
   */
  createReminderStrategy() {
    return new ReminderStrategy(this.useTemplates, this.templateConfig);
  }

  /**
   * Crea estrategia de mensaje del día
   */
  createTodayStrategy() {
    return new TodayStrategy(this.useTemplates, this.templateConfig);
  }

  /**
   * Obtiene estrategia por tipo
   */
  getStrategy(type) {
    switch (type) {
      case "notificacion":
        return this.createNotificationStrategy();
      case "recordatorio":
        return this.createReminderStrategy();
      case "hoy":
        return this.createTodayStrategy();
      default:
        throw new Error(`Tipo de mensaje no soportado: ${type}`);
    }
  }
}

module.exports = {
  MessageStrategy,
  NotificationStrategy,
  ReminderStrategy,
  TodayStrategy,
  MessageStrategyFactory,
};
