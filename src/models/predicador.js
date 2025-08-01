const DateFormatter = require("../utils/dateFormatter");
const config = require("../config/environment");

class Predicador {
  constructor(data, rowIndex) {
    this.rowIndex = rowIndex;
    this.nombre = this._extractField(data, ["Nombre", "nombre", "NOMBRE"]);
    this.telefono = this._extractField(data, [
      "Teléfono",
      "Telefono",
      "teléfono",
      "telefono",
      "TELEFONO",
    ]);
    this.fechaRaw = this._extractField(data, ["Fecha", "fecha", "FECHA"]);
    this.notificado = this._extractField(data, [
      "Notificado",
      "notificado",
      "NOTIFICADO",
    ]);
    this.recordado = this._extractField(data, [
      "Recordado",
      "recordado",
      "RECORDADO",
    ]);
    this.iglesia = this._extractField(data, ["Iglesia", "iglesia", "IGLESIA"]);

    this.fecha = DateFormatter.parseToLocalDate(this.fechaRaw, this.nombre);
    this.errors = this._validate();
  }

  /**
   * Extrae campo de datos usando múltiples posibles nombres
   * @private
   */
  _extractField(data, possibleNames) {
    for (const name of possibleNames) {
      if (data[name] !== undefined && data[name] !== null) {
        return data[name];
      }
    }
    return "";
  }

  /**
   * Valida los datos del predicador
   * @private
   */
  _validate() {
    const errors = [];

    if (!this.nombre) {
      errors.push("Nombre requerido");
    }

    if (!this.telefono) {
      errors.push("Teléfono requerido");
    }

    if (!this.fecha) {
      errors.push("Fecha inválida");
    }

    return errors;
  }

  /**
   * Verifica si el predicador es válido
   */
  isValid() {
    return this.errors.length === 0;
  }

  /**
   * Obtiene número de teléfono formateado para Colombia
   */
  getFormattedPhone() {
    return `+57${this.telefono}`;
  }

  /**
   * Verifica si ya fue notificado inicialmente
   */
  hasBeenNotified() {
    return (
      this.notificado &&
      this.notificado.toLowerCase() === config.business.yesMarker
    );
  }

  /**
   * Calcula días hasta la predicación
   */
  getDaysUntilPreaching() {
    if (!this.fecha) return null;

    const today = DateFormatter.today();
    return DateFormatter.daysDifference(this.fecha, today);
  }

  /**
   * Verifica si predica en el rango de días especificado
   */
  preachesInDays(minDays, maxDays) {
    const daysUntil = this.getDaysUntilPreaching();
    if (daysUntil === null) return false;

    return daysUntil >= minDays && daysUntil <= maxDays;
  }

  /**
   * Verifica si predica hoy
   */
  preachesToday() {
    const daysUntil = this.getDaysUntilPreaching();
    return daysUntil !== null && Math.round(daysUntil) === 0;
  }

  /**
   * Verifica si predica en los próximos días configurados
   */
  preachesSoon() {
    return this.preachesInDays(1, config.business.reminderDaysLimit);
  }

  /**
   * Calcula días desde el último recordatorio
   */
  getDaysSinceLastReminder() {
    if (!this.recordado) return null;

    try {
      const lastReminderDate = new Date(this.recordado);
      if (isNaN(lastReminderDate)) return null;

      const today = DateFormatter.today();
      return DateFormatter.daysDifference(today, lastReminderDate);
    } catch (error) {
      return null;
    }
  }

  /**
   * Verifica si puede recibir un nuevo recordatorio
   */
  canReceiveReminder() {
    const daysSinceLast = this.getDaysSinceLastReminder();

    // Si no hay recordatorio previo, puede recibir
    if (daysSinceLast === null) return true;

    // Si han pasado más días que el cooldown, puede recibir
    return daysSinceLast >= config.business.cooldownDays;
  }

  /**
   * Obtiene la fecha formateada para mensajes
   */
  getFormattedDate() {
    if (!this.fecha) return "Fecha inválida";
    return DateFormatter.toReadableSpanish(this.fecha);
  }

  /**
   * Obtiene información para logging
   */
  getLoggingInfo() {
    return {
      nombre: this.nombre,
      telefono: this.telefono,
      fecha: this.getFormattedDate(),
      daysUntil: this.getDaysUntilPreaching(),
      notificado: this.notificado,
      recordado: this.recordado,
    };
  }

  /**
   * Crea resumen del estado del predicador
   */
  getStatusSummary() {
    const info = this.getLoggingInfo();
    return {
      ...info,
      hasBeenNotified: this.hasBeenNotified(),
      preachesToday: this.preachesToday(),
      preachesSoon: this.preachesSoon(),
      canReceiveReminder: this.canReceiveReminder(),
      daysSinceLastReminder: this.getDaysSinceLastReminder(),
    };
  }

  /**
   * Convierte el objeto a representación string para debugging
   */
  toString() {
    return `Predicador(${this.nombre}, ${
      this.telefono
    }, ${this.getFormattedDate()})`;
  }

  /**
   * Crea un predicador desde datos raw validando la entrada
   * @static
   */
  static fromRawData(data, rowIndex) {
    return new Predicador(data, rowIndex);
  }

  /**
   * Crea múltiples predicadores desde array de datos
   * @static
   */
  static fromRawDataArray(dataArray) {
    return dataArray
      .map((data, index) => Predicador.fromRawData(data, index))
      .filter((predicador) => predicador.isValid());
  }
}

module.exports = Predicador;
