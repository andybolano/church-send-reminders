const { google } = require("googleapis");
const fs = require("fs");
const config = require("../config/environment");
const logger = require("../utils/logger");

/**
 * Servicio para manejo de Google Sheets
 * Implementa Repository Pattern para abstracción de datos
 */
class GoogleSheetsService {
  constructor() {
    this.sheets = null;
    this.auth = null;
  }

  /**
   * Configura la autenticación con Google Sheets
   * Compatible con Railway (variables de entorno) y local (archivo)
   * @private
   */
  async _setupAuth() {
    try {
      let credentials;

      // Railway: usar variable de entorno (prioridad)
      if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        logger.debug("Usando credenciales de variable de entorno (Railway)");
        credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      }
      // Railway: alternativo con Base64
      else if (process.env.GOOGLE_CREDENTIALS_BASE64) {
        logger.debug("Usando credenciales Base64 (Railway)");
        const decoded = Buffer.from(
          process.env.GOOGLE_CREDENTIALS_BASE64,
          "base64"
        ).toString();
        credentials = JSON.parse(decoded);
      }
      // Local: usar archivo
      else if (fs.existsSync(config.googleSheets.credentialsPath)) {
        logger.debug("Usando archivo de credenciales (Local)");
        credentials = JSON.parse(
          fs.readFileSync(config.googleSheets.credentialsPath)
        );
      } else {
        throw new Error(
          "No se encontraron credenciales de Google. Configura GOOGLE_SERVICE_ACCOUNT_KEY o credentials.json"
        );
      }

      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });

      const authClient = await this.auth.getClient();
      this.sheets = google.sheets({ version: "v4", auth: authClient });

      logger.debug(
        "✅ Autenticación con Google Sheets configurada exitosamente"
      );
      logger.debug(
        `🔧 Método: ${
          process.env.GOOGLE_SERVICE_ACCOUNT_KEY
            ? "Variable de entorno"
            : "Archivo local"
        }`
      );
    } catch (error) {
      logger.error(
        "❌ Error configurando autenticación Google Sheets:",
        error.message
      );
      throw new Error(`Error de autenticación: ${error.message}`);
    }
  }

  /**
   * Asegura que la autenticación esté configurada
   * @private
   */
  async _ensureAuth() {
    if (!this.sheets) {
      await this._setupAuth();
    }
  }

  /**
   * Lee datos del Google Sheet
   * @returns {Promise<Array>} Array de objetos con los datos del sheet
   */
  async readSheetData() {
    await this._ensureAuth();

    try {
      logger.debug(
        `Leyendo datos de Sheet ID: ${config.googleSheets.sheetId}, Rango: ${config.googleSheets.range}`
      );

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: config.googleSheets.sheetId,
        range: config.googleSheets.range,
      });

      const rows = response.data.values;

      if (!rows || rows.length === 0) {
        logger.warn("No se encontraron datos en el Google Sheet");
        return [];
      }

      // Convertir array de arrays a array de objetos
      const headers = rows[0];
      const dataRows = rows.slice(1);

      const data = dataRows.map((row) => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] || "";
        });
        return obj;
      });

      logger.info(`✅ Datos leídos exitosamente: ${data.length} registros`);
      logger.debug(`Columnas detectadas: ${headers.join(", ")}`);

      return data;
    } catch (error) {
      logger.error("Error leyendo Google Sheet:", error.message);
      throw new Error(`Error leyendo datos: ${error.message}`);
    }
  }

  /**
   * Actualiza una celda específica en el Google Sheet
   * @param {number} rowIndex - Índice de la fila (0-based)
   * @param {string} columnName - Nombre de la columna
   * @param {string} value - Valor a escribir
   */
  async updateCell(rowIndex, columnName, value) {
    await this._ensureAuth();

    try {
      // Primero obtenemos los headers para encontrar el índice de la columna
      const headers = await this._getHeaders();
      const columnIndex = this._findColumnIndex(headers, columnName);

      if (columnIndex === -1) {
        throw new Error(`Columna "${columnName}" no encontrada`);
      }

      // Convertir índices a notación A1
      const columnLetter = this._getColumnLetter(columnIndex);
      const cellRange = `${columnLetter}${rowIndex + 2}`; // +2 porque row 1 son headers y rowIndex es 0-based

      logger.debug(`Actualizando celda ${cellRange} con valor: ${value}`);

      const updateResponse = await this.sheets.spreadsheets.values.update({
        spreadsheetId: config.googleSheets.sheetId,
        range: cellRange,
        valueInputOption: "RAW",
        requestBody: {
          values: [[value]],
        },
      });

      logger.info(`✅ Celda ${cellRange} actualizada exitosamente`);
      logger.debug(
        `Respuesta de Google: ${updateResponse.data.updatedCells} celdas actualizadas`
      );

      return true;
    } catch (error) {
      logger.error(
        `Error actualizando celda (fila ${
          rowIndex + 2
        }, columna ${columnName}):`,
        error.message
      );
      throw new Error(`Error actualizando celda: ${error.message}`);
    }
  }

  /**
   * Obtiene los headers del sheet
   * @private
   */
  async _getHeaders() {
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: config.googleSheets.sheetId,
      range: "A1:Z1", // Asumiendo que no hay más de 26 columnas
    });

    return response.data.values ? response.data.values[0] : [];
  }

  /**
   * Encuentra el índice de una columna por nombre (case-insensitive)
   * @private
   */
  _findColumnIndex(headers, columnName) {
    const searchName = columnName.toLowerCase();

    // Buscar coincidencias exactas primero
    let index = headers.findIndex(
      (header) => header.toLowerCase() === searchName
    );

    // Si no encuentra coincidencia exacta, buscar por inclusión
    if (index === -1) {
      index = headers.findIndex(
        (header) =>
          header.toLowerCase().includes(searchName) ||
          searchName.includes(header.toLowerCase())
      );
    }

    return index;
  }

  /**
   * Convierte índice numérico a letra de columna (A, B, C, ...)
   * @private
   */
  _getColumnLetter(index) {
    let letter = "";
    while (index >= 0) {
      letter = String.fromCharCode(65 + (index % 26)) + letter;
      index = Math.floor(index / 26) - 1;
    }
    return letter;
  }

  /**
   * Actualiza la columna "Notificado" para un predicador
   */
  async markAsNotified(rowIndex, value = config.business.yesMarker) {
    return this.updateCell(rowIndex, "notificado", value);
  }

  /**
   * Actualiza la columna "Recordado" con la fecha actual
   */
  async markReminderSent(
    rowIndex,
    date = new Date().toISOString().split("T")[0]
  ) {
    return this.updateCell(rowIndex, "recordado", date);
  }

  /**
   * Valida la configuración del servicio
   */
  validateConfiguration() {
    const errors = [];

    if (!config.googleSheets.sheetId) {
      errors.push("GOOGLE_SHEET_ID no configurado");
    }

    if (!fs.existsSync(config.googleSheets.credentialsPath)) {
      errors.push(
        `Archivo de credenciales no encontrado: ${config.googleSheets.credentialsPath}`
      );
    }

    if (errors.length > 0) {
      throw new Error(`Configuración inválida: ${errors.join(", ")}`);
    }

    return true;
  }

  /**
   * Obtiene información de diagnóstico del servicio
   */
  async getDiagnosticInfo() {
    try {
      await this._ensureAuth();
      const headers = await this._getHeaders();

      return {
        configured: true,
        sheetId: config.googleSheets.sheetId,
        range: config.googleSheets.range,
        credentialsPath: config.googleSheets.credentialsPath,
        headers: headers,
        columnsCount: headers.length,
      };
    } catch (error) {
      return {
        configured: false,
        error: error.message,
      };
    }
  }
}

module.exports = GoogleSheetsService;
