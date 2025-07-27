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
      fromNumber: "whatsapp:+14155238886",
      useTemplates: process.env.USE_TWILIO_TEMPLATES === "true",
      templates: {
        notification: process.env.TWILIO_TEMPLATE_NOTIFICACION,
        reminder: process.env.TWILIO_TEMPLATE_RECORDATORIO,
      },
    };
  }

  // Google Sheets Configuration
  get googleSheets() {
    return {
      sheetId: process.env.GOOGLE_SHEET_ID,
      range: process.env.GOOGLE_SHEET_RANGE || "A:E",
      credentialsPath:
        process.env.GOOGLE_CREDENTIALS_PATH || "./credentials.json",
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
  }
}

module.exports = new EnvironmentConfig();
