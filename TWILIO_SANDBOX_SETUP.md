# 📱 Configuración Twilio Sandbox (WhatsApp)

## 🔧 Variables de entorno para modo sandbox

Añade estas variables a tu archivo `.env`:

```bash
# Configuración de Twilio
TW_SID=your_twilio_account_sid
TW_TOKEN=your_twilio_auth_token

# Configuración de Google Sheets
GOOGLE_SHEET_ID=tu_google_sheet_id
GOOGLE_SHEET_RANGE=A:E
GOOGLE_CREDENTIALS_PATH=./credentials.json

# Configuración de Templates (MODO SANDBOX)
USE_TWILIO_TEMPLATES=true
TWILIO_TEMPLATE_NOTIFICACION=HXb5b62575e6e4ff6129ad7c8efe1f983e
TWILIO_TEMPLATE_RECORDATORIO=HXb5b62575e6e4ff6129ad7c8efe1f983e
```

## 📋 ¿Qué hace cada variable?

- **USE_TWILIO_TEMPLATES=true**: Activa el modo sandbox (templates)
- **TWILIO_TEMPLATE_NOTIFICACION**: ID del template para notificaciones iniciales
- **TWILIO_TEMPLATE_RECORDATORIO**: ID del template para recordatorios

## 🔄 Diferencias entre modos:

### 🧪 Modo Sandbox (USE_TWILIO_TEMPLATES=true)

- ✅ **Funciona**: con templates pre-aprobados
- ✅ **Gratis**: para desarrollo y pruebas
- ❌ **Limitado**: solo números pre-registrados
- ❌ **Solo templates**: no texto libre

### 🚀 Modo Producción (USE_TWILIO_TEMPLATES=false)

- ✅ **Texto libre**: mensajes personalizados
- ✅ **Cualquier número**: sin restricciones
- ❌ **De pago**: necesita cuenta de producción
- ❌ **Aprobación**: requiere verificación de WhatsApp Business

## 🛠️ Configurar templates

### Obtener ID del template:

1. Ve a [Twilio Console](https://console.twilio.com/)
2. WhatsApp > Senders > Content Templates
3. Copia el Content SID (ej: `HXb5b62575e6e4ff6129ad7c8efe1f983e`)

### Template de ejemplo:

```
Hola {{1}}, te confirmamos que el {{2}} predicarás.
```

- `{{1}}` = Nombre del predicador
- `{{2}}` = Fecha de predicación

## 📱 Registrar tu número en sandbox

1. Ve a [Twilio Console > WhatsApp Sandbox](https://console.twilio.com/us1/develop/sms/settings/whatsapp-sandbox)
2. Envía el código al número sandbox (+1 415 523 8886)
3. Ejemplo: "join <tu-codigo-sandbox>"

## ✅ Probar configuración

```bash
npm run send
```

El script detectará automáticamente si usar templates o texto libre según `USE_TWILIO_TEMPLATES`.

## 🔄 Migrar a producción

Cuando estés listo para producción:

1. Cambia `USE_TWILIO_TEMPLATES=false` en `.env`
2. Configura tu número de WhatsApp Business verificado
3. El script enviará texto libre personalizado
