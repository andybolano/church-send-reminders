const twilio = require("twilio");
const config = require("../config/environment");
const logger = require("../utils/logger");
const { MessageStrategyFactory } = require("../strategies/messageStrategies");

/**
 * Servicio para envío de mensajes vía Twilio WhatsApp
 * Utiliza Strategy Pattern para diferentes tipos de mensajes
 */
class MessageService {
  constructor() {
    this.client = null;
    this.strategyFactory = null;
    this._initializeClient();
    this._initializeStrategies();
  }

  /**
   * Inicializa el cliente de Twilio
   * @private
   */
  _initializeClient() {
    try {
      const twilioConfig = config.twilio;

      if (!twilioConfig.accountSid || !twilioConfig.authToken) {
        throw new Error("Credenciales de Twilio no configuradas");
      }

      this.client = twilio(twilioConfig.accountSid, twilioConfig.authToken);
      logger.debug("Cliente Twilio inicializado exitosamente");
    } catch (error) {
      logger.error("Error inicializando cliente Twilio:", error.message);
      throw new Error(`Error configurando Twilio: ${error.message}`);
    }
  }

  /**
   * Inicializa el factory de estrategias de mensajes
   * @private
   */
  _initializeStrategies() {
    const twilioConfig = config.twilio;
    this.strategyFactory = new MessageStrategyFactory(
      twilioConfig.useTemplates,
      twilioConfig.templates
    );

    logger.debug(
      `Estrategias de mensaje inicializadas - Modo: ${
        twilioConfig.useTemplates ? "Templates" : "Texto libre"
      }`
    );
  }

  /**
   * Envía un mensaje a un predicador usando la estrategia apropiada
   * @param {Predicador} predicador - Objeto predicador
   * @param {string} messageType - Tipo de mensaje ('notificacion', 'recordatorio', 'hoy')
   * @returns {Promise<Object>} Respuesta de Twilio
   */
  async sendMessage(predicador, messageType) {
    try {
      // Validar entrada
      if (!predicador || !predicador.telefono) {
        throw new Error("Predicador y teléfono son requeridos");
      }

      if (!messageType) {
        throw new Error("Tipo de mensaje es requerido");
      }

      // Obtener estrategia apropiada
      const strategy = this.strategyFactory.getStrategy(messageType);

      // Crear opciones del mensaje usando la estrategia
      const messageOptions = strategy.createMessageOptions(
        predicador,
        config.twilio.fromNumber
      );

      // Enviar mensaje
      const response = await this.client.messages.create(messageOptions);

      logger.logMessageSent(messageType, predicador.nombre, response.sid);

      return {
        success: true,
        sid: response.sid,
        messageType: messageType,
        to: predicador.getFormattedPhone(),
      };
    } catch (error) {
      logger.error(
        `Error enviando mensaje ${messageType} a ${predicador.nombre}:`,
        error.message
      );

      return {
        success: false,
        error: error.message,
        messageType: messageType,
        to: predicador.getFormattedPhone(),
      };
    }
  }

  /**
   * Envía notificación inicial
   * @param {Predicador} predicador
   * @returns {Promise<Object>}
   */
  async sendNotification(predicador) {
    return this.sendMessage(predicador, "notificacion");
  }

  /**
   * Envía recordatorio anticipado
   * @param {Predicador} predicador
   * @returns {Promise<Object>}
   */
  async sendReminder(predicador) {
    return this.sendMessage(predicador, "recordatorio");
  }

  /**
   * Envía mensaje del día
   * @param {Predicador} predicador
   * @returns {Promise<Object>}
   */
  async sendTodayMessage(predicador) {
    return this.sendMessage(predicador, "hoy");
  }

  /**
   * Envía múltiples mensajes de forma secuencial con manejo de errores
   * @param {Array} messages - Array de objetos {predicador, messageType}
   * @returns {Promise<Array>} Array de resultados
   */
  async sendBulkMessages(messages) {
    const results = [];

    for (const { predicador, messageType } of messages) {
      try {
        const result = await this.sendMessage(predicador, messageType);
        results.push(result);

        // Pequeña pausa entre mensajes para evitar rate limiting
        await this._delay(100);
      } catch (error) {
        logger.error(
          `Error en envío bulk para ${predicador.nombre}:`,
          error.message
        );
        results.push({
          success: false,
          error: error.message,
          messageType: messageType,
          to: predicador.getFormattedPhone(),
        });
      }
    }

    return results;
  }



  /**
   * Pausa la ejecución por un tiempo determinado
   * @private
   */
  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Valida la configuración del servicio
   */
  validateConfiguration() {
    const errors = [];
    const twilioConfig = config.twilio;

    if (!twilioConfig.accountSid) {
      errors.push("TW_SID no configurado");
    }

    if (!twilioConfig.authToken) {
      errors.push("TW_TOKEN no configurado");
    }

    if (twilioConfig.useTemplates) {
      if (!twilioConfig.templates.notification) {
        errors.push("TWILIO_TEMPLATE_NOTIFICACION no configurado");
      }
      if (!twilioConfig.templates.reminder) {
        errors.push("TWILIO_TEMPLATE_RECORDATORIO no configurado");
      }
      if (!twilioConfig.templates.today) {
        errors.push("TWILIO_TEMPLATE_RECORDATORIO_HOY no configurado");
      }
    }

    if (errors.length > 0) {
      throw new Error(`Configuración inválida: ${errors.join(", ")}`);
    }

    return true;
  }

  /**
   * Obtiene información de diagnóstico del servicio
   */
  getDiagnosticInfo() {
    const twilioConfig = config.twilio;

    return {
      configured: !!(twilioConfig.accountSid && twilioConfig.authToken),
      useTemplates: twilioConfig.useTemplates,
      fromNumber: twilioConfig.fromNumber,
      templates: {
        notification: twilioConfig.templates.notification,
        reminder: twilioConfig.templates.reminder,
        today: twilioConfig.templates.today,
      },
      accountSid: twilioConfig.accountSid
        ? `${twilioConfig.accountSid.substring(0, 8)}...`
        : "No configurado",
    };
  }

  /**
   * Prueba la conectividad con Twilio
   */
  async testConnection() {
    try {
      const account = await this.client.api
        .accounts(config.twilio.accountSid)
        .fetch();
      return {
        success: true,
        accountName: account.friendlyName,
        status: account.status,
      };
    } catch (error) {
      logger.error("Error probando conexión Twilio:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = MessageService;
