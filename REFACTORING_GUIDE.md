# 🚀 Sistema de Recordatorios - Refactorizado

## 📁 Nueva Estructura

```
src/
├── config/
│   └── environment.js       # Configuración centralizada y validación
├── services/
│   ├── googleSheetsService.js   # Repository Pattern para Google Sheets
│   ├── messageService.js        # Servicio de mensajería Twilio
│   └── notificationService.js   # Lógica de negocio principal
├── strategies/
│   └── messageStrategies.js     # Strategy Pattern para tipos de mensajes
├── models/
│   └── predicador.js            # Modelo de datos con validación
├── utils/
│   ├── dateFormatter.js         # Formateo de fechas y conversiones
│   └── logger.js               # Logging centralizado con emojis
└── main.js                     # Punto de entrada principal
```

## 🛠️ Comandos Disponibles

### **Ejecución Principal**

```bash
npm run send              # Ejecutar una vez (modo por defecto)
npm start                 # Alias para 'send'
npm run dev               # Alias para modo desarrollo
```

### **Modos Específicos**

```bash
npm run send:once         # Ejecutar una vez y terminar
npm run send:cron         # Iniciar cron job programado
npm run send:notifications # Solo notificaciones iniciales
npm run send:reminders    # Solo recordatorios
```

### **Diagnóstico y Testing**

```bash
npm test                  # Probar conectividad
npm run diagnostic        # Información completa del sistema
```

### **Compatibilidad**

```bash
npm run legacy            # Ejecutar código original (send_reminders.js)
```

## 📊 Características Mejoradas

### **1. Logging Inteligente**

```javascript
// Antes
console.log(`✅ [NOTIFICACIÓN INICIAL] ${nombre} – SID: ${msg.sid}`);

// Ahora
logger.logMessageSent("notificacion", nombre, msg.sid);
logger.logFinalSummary(stats);
```

### **2. Manejo de Errores Robusto**

```javascript
// Validación automática de configuración
this._validateConfiguration();

// Manejo de errores específicos por servicio
try {
  const result = await this.messageService.sendNotification(predicador);
} catch (error) {
  logger.error("Error específico:", error.message);
}
```

### **3. Formateo de Fechas Mejorado**

```javascript
// Antes
fecha.toLocaleDateString("es-ES");

// Ahora
DateFormatter.toReadableSpanish(fecha); // "Miércoles 8 de Junio"
DateFormatter.parseToLocalDate(fechaRaw, contexto); // Manejo robusto
```

### **4. Estrategias de Mensajes**

```javascript
// Extensible para nuevos tipos de mensajes
const strategy = this.strategyFactory.getStrategy("notificacion");
const messageOptions = strategy.createMessageOptions(predicador, fromNumber);
```

### **5. Modelo de Datos Rico**

```javascript
const predicador = new Predicador(rawData, rowIndex);

// Métodos de negocio integrados
predicador.preachesToday(); // true/false
predicador.canReceiveReminder(); // Con lógica de cooldown
predicador.getFormattedDate(); // "Miércoles 8 de Junio"
```

## 🔧 Configuración

### **Variables de Entorno** (`.env`)

```env
# Twilio
TW_SID=your_twilio_account_sid
TW_TOKEN=your_twilio_auth_token
USE_TWILIO_TEMPLATES=false

# Google Sheets
GOOGLE_SHEET_ID=your_google_sheet_id
GOOGLE_SHEET_RANGE=A:E
GOOGLE_CREDENTIALS_PATH=./credentials.json

# Templates (si USE_TWILIO_TEMPLATES=true)
TWILIO_TEMPLATE_NOTIFICACION=HX...
TWILIO_TEMPLATE_RECORDATORIO=HX...
```

### **Configuración de Negocio** (automática)

```javascript
{
  reminderDaysLimit: 15,      // Días para recordatorios anticipados
  cooldownDays: 7,            // Días mínimos entre mensajes
  yesMarker: 'sí',           // Marca para "notificado"
  cronSchedule: '0 8 * * 0,2,3,5,6'  // Dom, Mar, Mié, Vie, Sáb 8:00 AM
}
```

## 📈 Mejoras de Rendimiento

### **Antes vs Ahora**

| Aspecto               | Antes                      | Ahora                           |
| --------------------- | -------------------------- | ------------------------------- |
| **Archivos**          | 1 archivo, 700+ líneas     | 9 archivos, ~100-200 líneas c/u |
| **Responsabilidades** | Todo mezclado              | Separadas por dominio           |
| **Testing**           | Difícil de testear         | Servicios independientes        |
| **Extensibilidad**    | Modificar código existente | Agregar nuevas clases           |
| **Debugging**         | Logs básicos               | Logging estructurado            |
| **Configuración**     | Variables globales         | Configuración centralizada      |
| **Validación**        | Manual y básica            | Automática y robusta            |

## 🧪 Testing y Diagnóstico

### **Pruebas de Conectividad**

```bash
npm test
```

**Salida:**

```
📊 RESULTADOS DE CONECTIVIDAD:
================================
✅ Google Sheets: ✅ Conectado (2 registros)
✅ Twilio: ✅ Conectado (Account Name)
```

### **Información de Diagnóstico**

```bash
npm run diagnostic
```

**Salida:** JSON completo con configuración, estado de servicios, headers de Google Sheets, etc.

## 🚀 Extensibilidad

### **Agregar Nuevo Tipo de Mensaje**

```javascript
// 1. Crear nueva estrategia
class BirthdayStrategy extends MessageStrategy {
  createMessageOptions(predicador, fromNumber) {
    // Lógica específica del mensaje de cumpleaños
  }
}

// 2. Agregar al factory
getStrategy(type) {
  switch (type) {
    case 'birthday':
      return new BirthdayStrategy(this.useTemplates, this.templateConfig);
    // ... casos existentes
  }
}

// 3. Usar en el servicio
await this.messageService.sendMessage(predicador, 'birthday');
```

### **Agregar Nueva Fuente de Datos**

```javascript
// Implementar la misma interface que GoogleSheetsService
class ExcelService {
  async readSheetData() {
    /* implementación */
  }
  async updateCell(rowIndex, columnName, value) {
    /* implementación */
  }
  // ... otros métodos
}

// Inyectar en NotificationService
this.dataService = new ExcelService();
```

## 📝 Migración

### **Mantener Compatibilidad**

- ✅ El archivo original `send_reminders.js` se mantiene
- ✅ Comando `npm run legacy` ejecuta la versión anterior
- ✅ Los mismos scripts de `package.json` funcionan (apuntan a nueva estructura)
- ✅ Mismas variables de entorno

### **Beneficios Inmediatos**

- ✅ **0 downtime**: Cambio transparente
- ✅ **Logging mejorado**: Información más clara
- ✅ **Debugging fácil**: Errores más específicos
- ✅ **Nuevos comandos**: Testing, diagnóstico, ejecución parcial
- ✅ **Formato de fechas legible**: "Miércoles 8 de Junio"

## 🎯 Próximos Pasos

1. **Testing**: Agregar tests unitarios usando Jest
2. **CI/CD**: Configurar pipeline de despliegue
3. **Monitoring**: Métricas y alertas
4. **UI**: Dashboard web para visualización
5. **API**: Endpoints REST para integración

---

## 💡 Uso Recomendado

**Para desarrollo:**

```bash
npm run dev              # Ejecutar una vez para pruebas
npm test                 # Verificar conectividad
npm run diagnostic       # Ver configuración completa
```

**Para producción:**

```bash
npm run send:cron        # Cron job automático
```

**Para debugging:**

```bash
npm run send:notifications  # Solo notificaciones
npm run send:reminders     # Solo recordatorios
```

---

✨ **El código ahora es mantenible, extensible y sigue las mejores prácticas de la industria.**
