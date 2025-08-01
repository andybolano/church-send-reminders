const dotenv = require("dotenv");
dotenv.config();

class EnvironmentConfig {
  constructor() {
    this.validateRequiredEnvVars();
  }

  // Twilio Configuration
  get twilio() {
    return {
      accountSid: process.env.TW_SID,
      authToken: process.env.TW_TOKEN,
      fromNumber: process.env.TW_FROM,
      useTemplates: process.env.USE_TWILIO_TEMPLATES === "true",
      templates: {
        notification: process.env.TWILIO_TEMPLATE_NOTIFICACION,
        reminder: process.env.TWILIO_TEMPLATE_RECORDATORIO,
        today: process.env.TWILIO_TEMPLATE_RECORDATORIO_HOY,
      },
    };
  }

  // Google Sheets Configuration
  get googleSheets() {
    return {
      sheetId: process.env.GOOGLE_SHEET_ID,
      range: process.env.GOOGLE_SHEET_RANGE || "A:E",
    };
  }

  // Business Logic Configuration
  get business() {
    return {
      reminderDaysLimit: 15,
      cooldownDays: 7,
      yesMarker: "sí",
    };
  }

  validateRequiredEnvVars() {
    const required = ["TW_SID", "TW_TOKEN", "GOOGLE_SHEET_ID"];

    const missing = required.filter((envVar) => !process.env[envVar]);

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(", ")}`
      );
    }

    // Validar que al menos una variable de credenciales de Google esté presente
    const hasGoogleCredentials =
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY ||
      process.env.GOOGLE_CREDENTIALS_BASE64;

    if (!hasGoogleCredentials) {
      throw new Error(
        "Missing Google credentials: Set either GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_CREDENTIALS_BASE64"
      );
    }
  }
}

module.exports = new EnvironmentConfig();
