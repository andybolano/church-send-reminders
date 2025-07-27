# 🚀 Deployment en Railway

## 💰 **Beneficios de Costo Railway vs node-cron**

| Enfoque             | Memoria 24/7          | Costo Mensual | Eficiencia |
| ------------------- | --------------------- | ------------- | ---------- |
| **❌ node-cron**    | 512MB constante       | ~$20-40/mes   | Baja       |
| **✅ Railway Cron** | 0MB entre ejecuciones | ~$2-5/mes     | Alta       |

## 📋 **Configuración de Variables de Entorno**

En Railway dashboard → Variables → añadir:

```env
# Twilio Configuration
TW_SID=your_twilio_account_sid
TW_TOKEN=your_twilio_auth_token
USE_TWILIO_TEMPLATES=false

# Google Sheets Configuration
GOOGLE_SHEET_ID=your_google_sheet_id
GOOGLE_SHEET_RANGE=A:E
GOOGLE_CREDENTIALS_PATH=./credentials.json

# Optional: Templates for Sandbox
TWILIO_TEMPLATE_NOTIFICACION=your_template_sid
TWILIO_TEMPLATE_RECORDATORIO=your_template_sid

# Railway Environment
NODE_ENV=production
```

## 🔐 **Google Credentials Setup**

### Método 1: Variable de entorno (Recomendado)

```bash
# En Railway Variables, crear:
GOOGLE_SERVICE_ACCOUNT_KEY='{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}'
```

### Método 2: Base64 (Alternativo)

```bash
# Codificar credentials.json en base64
cat credentials.json | base64

# En Railway Variables:
GOOGLE_CREDENTIALS_BASE64=ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsC...
```

## ⏰ **Configuración de Railway Cron**

### 1. En Railway Dashboard:

- Ir a tu proyecto
- Pestaña **"Cron Jobs"**
- Crear nuevo Cron Job

### 2. Configuración del Cron:

```json
{
  "name": "church-reminders",
  "command": "npm start",
  "schedule": "0 8 * * 0,2,3,5,6",
  "timezone": "America/Bogota"
}
```

### 3. Explicación del Schedule:

```
0 8 * * 0,2,3,5,6
│ │ │ │ └─────────── Días: 0=Dom, 2=Mar, 3=Mié, 5=Vie, 6=Sáb
│ │ │ └───────────── Mes: * (todos)
│ │ └─────────────── Día del mes: * (todos)
│ └───────────────── Hora: 8 (8:00 AM)
└─────────────────── Minuto: 0
```

## 🚀 **Deployment Steps**

### 1. **Preparar Repositorio**

```bash
# Verificar que no hay dependencias innecesarias
npm install  # Instala sin node-cron

# Probar localmente
npm start
npm test
```

### 2. **Conectar a Railway**

- Crear cuenta en [railway.app](https://railway.app)
- Conectar repositorio GitHub
- Railway detectará automáticamente Node.js

### 3. **Configurar Variables**

- Variables → Add Variable
- Copiar todas las variables de tu `.env` local

### 4. **Configurar Google Credentials**

```bash
# Opción A: Subir como variable de entorno
GOOGLE_SERVICE_ACCOUNT_KEY='{ ... todo el JSON ... }'

# Opción B: Modificar código para usar variable
# (ver sección de código más abajo)
```

### 5. **Deploy**

- Railway deployará automáticamente
- Verificar logs en Railway dashboard

### 6. **Configurar Cron Job**

- Cron Jobs → New Cron Job
- Comando: `npm start`
- Schedule: `0 8 * * 0,2,3,5,6`
- Timezone: `America/Bogota`

## 🔧 **Configuración Avanzada**

### **Manejo de Google Credentials en Railway**

Si usas variables de entorno para credentials, modifica `src/services/googleSheetsService.js`:

```javascript
async _setupAuth() {
  try {
    let credentials;

    // Railway: usar variable de entorno
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    }
    // Local: usar archivo
    else {
      credentials = JSON.parse(fs.readFileSync(config.googleSheets.credentialsPath));
    }

    this.auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    // ... resto del código
  } catch (error) {
    logger.error('Error configurando autenticación Google Sheets:', error.message);
    throw new Error(`Error de autenticación: ${error.message}`);
  }
}
```

### **Verificación de Deployment**

```bash
# Comando de prueba en Railway
npm test

# Salida esperada:
📊 RESULTADOS DE CONECTIVIDAD:
================================
✅ Google Sheets: ✅ Conectado (X registros)
✅ Twilio: ✅ Conectado (Account Name)
```

## 📊 **Monitoring y Logs**

### **Ver Logs en Railway**

- Dashboard → Deploy Logs
- Filtrar por fecha/hora de ejecución del cron

### **Logs Esperados**

```
🎤 SISTEMA DE RECORDATORIOS PARA PREDICADORES
🚀 OPTIMIZADO PARA RAILWAY DEPLOYMENT
====================================
📅 Fecha actual: XX/XX/XXXX
🔧 Modo Twilio: Producción (Texto libre)
📊 Límite recordatorios: 15 días
⏱️ Cooldown: 7 días
🌐 Entorno: production
====================================
```

## 🔍 **Troubleshooting**

### **Error: Google Sheets Auth**

```bash
# Verificar que la variable existe
echo $GOOGLE_SERVICE_ACCOUNT_KEY

# Verificar formato JSON válido
node -e "JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)"
```

### **Error: Twilio Connection**

```bash
# Probar conectividad
npm test

# Verificar variables
echo $TW_SID
echo $TW_TOKEN
```

### **Cron No Ejecuta**

- Verificar timezone en Railway Cron
- Verificar formato de schedule
- Revisar logs de deployment

## 💡 **Optimizaciones de Costos**

### **1. Resource Limits**

```json
{
  "deploy": {
    "memoryLimit": "256MB",
    "cpuLimit": "0.5"
  }
}
```

### **2. Health Checks** (Opcional)

```javascript
// En src/main.js, agregar endpoint de health
const express = require("express");
const app = express();

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(process.env.PORT || 3000);
```

## 📈 **Estimated Costs**

| Componente          | Frecuencia                | Duración    | Costo Mensual |
| ------------------- | ------------------------- | ----------- | ------------- |
| **Cron Executions** | 5 días/semana × 4 semanas | ~30 seg c/u | ~$1-2         |
| **Storage**         | Persistente               | -           | ~$0.50        |
| **Network**         | API calls                 | Mínimo      | ~$0.25        |
| **TOTAL**           | -                         | -           | **~$2-3/mes** |

vs. node-cron manteniendo proceso activo: **~$20-40/mes**

## ✅ **Checklist de Deployment**

- [ ] Variables de entorno configuradas
- [ ] Google credentials funcionando
- [ ] Twilio conectividad verificada
- [ ] Railway Cron job creado
- [ ] Schedule correcto (Dom, Mar, Mié, Vie, Sáb 8:00 AM)
- [ ] Timezone: America/Bogota
- [ ] Logs funcionando correctamente
- [ ] Prueba manual exitosa

---

¡Tu sistema ahora está optimizado para Railway y te ahorrará ~90% en costos! 🎉
