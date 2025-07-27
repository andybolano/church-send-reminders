# 📊 Configuración de Google Sheets

## 🔧 Variables de entorno necesarias

Añade estas variables a tu archivo `.env`:

```bash
# Configuración de Twilio (ya existentes)
TW_SID=tu_twilio_account_sid
TW_TOKEN=tu_twilio_auth_token

# Configuración de Google Sheets (NUEVAS)
GOOGLE_SHEET_ID=1abc123def456ghi789jkl
GOOGLE_SHEET_RANGE=A:E
GOOGLE_CREDENTIALS_PATH=./credentials.json
```

## 🔑 Obtener credenciales de Google

### Paso 1: Crear proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita la API de Google Sheets:
   - Ve a "APIs & Services" > "Library"
   - Busca "Google Sheets API"
   - Haz clic en "Enable"

### Paso 2: Crear Service Account

1. Ve a "APIs & Services" > "Credentials"
2. Clic en "Create Credentials" > "Service Account"
3. Llena el formulario:
   - Nombre: `send-reminders-bot`
   - ID: se genera automáticamente
   - Descripción: `Bot para envío de recordatorios`
4. Clic en "Create and Continue"
5. Skip "Grant access" (opcional)
6. Clic en "Done"

### Paso 3: Descargar credenciales

1. En la lista de Service Accounts, clic en el que acabas de crear
2. Ve a la pestaña "Keys"
3. Clic en "Add Key" > "Create new key"
4. Selecciona "JSON"
5. Se descargará un archivo JSON
6. Renómbralo a `credentials.json` y ponlo en la carpeta del proyecto

### Paso 4: Compartir Google Sheet

1. Abre tu Google Sheet
2. Clic en "Share" (Compartir)
3. Añade el email del Service Account (está en el archivo credentials.json)
4. Dale permisos de "Editor"

### Paso 5: Obtener ID de la hoja

En la URL de tu Google Sheet:

```
https://docs.google.com/spreadsheets/d/1abc123def456ghi789jkl/edit
```

El ID es: `1abc123def456ghi789jkl`

## 📋 Estructura de la hoja

Tu Google Sheet debe tener estas columnas (en la primera fila):

| Nombre         | Teléfono     | Fecha      | Notificado | Recordado |
| -------------- | ------------ | ---------- | ---------- | --------- |
| Juan Pérez     | 573001234567 | 2025-08-09 |            |           |
| María González | 573009876543 | 2025-08-23 |            |           |

### 📝 Explicación de las columnas:

- **Nombre**: Nombre del predicador
- **Teléfono**: Número con código de país (ej: 573001234567)
- **Fecha**: Fecha de predicación (formato: YYYY-MM-DD)
- **Notificado**: Se marca como "sí" cuando se envía la notificación inicial
- **Recordado**: Se marca como "sí" cuando se envía el recordatorio (14 días antes)

### 🔄 Flujo de trabajo:

1. **PASO 1 - Notificación inicial**: Envía confirmación a todos donde "Notificado" esté vacío
2. **PASO 2 - Recordatorios anticipados**: Envía a quienes predican en los próximos 15 días (máximo 1 cada 7 días)
3. **PASO 3 - Recordatorio del día**: Envía mensaje especial a quienes predican HOY
4. **Evita spam**: Respeta intervalos mínimos entre mensajes y guarda fechas en "Recordado"

### 📱 Tipos de mensaje:

- **Notificación inicial**: "Hola [Nombre], te confirmamos que el [Fecha] predicarás. ¡Que Dios te bendiga en tu preparación!"
- **Recordatorio anticipado**: "Hola [Nombre], te recordamos que próximamente ([Fecha]) predicarás. ¡Prepárate en oración!"
- **Recordatorio del día**: "¡Hola [Nombre]! 🎤 HOY es tu día de predicación. ¡Que Dios te use poderosamente y bendiga tu mensaje! 🙏"

### 📅 Cronograma de ejecución:

El script se ejecuta automáticamente:

- **Domingos** a las 8:00 AM
- **Martes** a las 8:00 AM
- **Miércoles** a las 8:00 AM
- **Viernes** a las 8:00 AM
- **Sábados** a las 8:00 AM

### 📊 ¿Cuántos mensajes recibe cada predicador?

- **Mínimo**: 1 mensaje (solo notificación inicial)
- **Máximo**: 4 mensajes (inicial + 2 recordatorios + mensaje del día)
- **Promedio**: 2-3 mensajes por predicador
- **Frecuencia**: Máximo 1 cada 7 días (excepto el mensaje del día)
- **Ventana activa**: Recordatorios solo en los últimos 15 días

## ✅ Verificar configuración

Ejecuta el script para probar:

```bash
npm run send
```
