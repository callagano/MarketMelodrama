# Market Melodrama - Sistema di Scheduling Coordinato

## 📋 Panoramica

Il sistema di scheduling di Market Melodrama è stato ottimizzato per coordinare tutti gli aggiornamenti automatici dei dati in modo efficiente e senza conflitti.

## 🕐 Scheduling Attuale

### **Cron Job Principale**
- **Endpoint**: `/api/scheduler`
- **Orario**: Ogni giorno alle 4:00 UTC (6:00 AM GMT+2)
- **Cron Expression**: `0 4 * * *`

### **Task Coordinati**

#### 1. **Market Data Refresh** (Sempre attivo)
- **Endpoint**: `/api/cron`
- **Descrizione**: Aggiorna dati di mercato generali
- **Dati aggiornati**:
  - Trending stocks (`/api/trending-stocks`)
  - IPO Calendar (`/api/ipo-calendar`)
  - Economic Calendar (`/api/economic-calendar`)
- **Frequenza**: Ogni giorno

#### 2. **Fear & Greed Index Update** (Solo giorni feriali)
- **Endpoint**: `/api/fear-greed-update`
- **Descrizione**: Aggiorna dati del Fear & Greed Index
- **Frequenza**: Lunedì-Venerdì (salta weekend)
- **Motivo**: I mercati sono chiusi nei weekend

## 🔄 Flusso di Esecuzione

```
4:00 UTC (6:00 AM GMT+2)
├── Controlla se è weekend
├── Se LUN-VEN:
│   ├── Esegui Market Data Refresh
│   └── Esegui Fear & Greed Index Update
└── Se SAB-DOM:
    └── Esegui solo Market Data Refresh
```

## 📊 Monitoraggio

### **Status Endpoint**
```bash
GET /api/scheduler/status
```

**Risposta:**
```json
{
  "success": true,
  "currentTime": {
    "utc": "2025-01-15T07:00:00.000Z",
    "dayOfWeek": 3,
    "dayName": "Wednesday",
    "isWeekend": false
  },
  "tasks": [
    {
      "name": "Market Data Refresh",
      "status": "active",
      "nextRun": "2025-01-15T07:00:00.000Z"
    },
    {
      "name": "Fear & Greed Index Update", 
      "status": "active",
      "nextRun": "2025-01-15T07:00:00.000Z"
    }
  ]
}
```

### **Log di Esecuzione**
```bash
GET /api/scheduler
```

## 🛠️ Configurazione

### **Vercel Cron Jobs**
```json
{
  "crons": [
    {
      "path": "/api/scheduler",
      "schedule": "0 4 * * *"
    }
  ]
}
```

### **Variabili d'Ambiente**
- `NEXT_PUBLIC_BASE_URL`: URL base dell'applicazione
- `VERCEL_ENV`: Ambiente di deployment (production/development)

## 🔧 Manutenzione

### **Test Manuale**
```bash
# Testa il scheduler
curl -X POST https://your-domain.vercel.app/api/scheduler

# Controlla lo status
curl https://your-domain.vercel.app/api/scheduler/status
```

### **Debug**
1. **Log Vercel**: Controlla i log delle funzioni in Vercel Dashboard
2. **Console**: I log vengono stampati nella console
3. **Status API**: Usa `/api/scheduler/status` per monitorare

## ⚠️ Gestione Errori

### **Errori Comuni**
1. **Timeout**: Task che impiegano più di 5 minuti
2. **Network**: Problemi di connessione alle API esterne
3. **Weekend**: Task che non dovrebbero eseguirsi nei weekend

### **Recovery**
- **Retry automatico**: I task falliti vengono loggati
- **Fallback**: Se un task fallisce, gli altri continuano
- **Monitoring**: Status endpoint per identificare problemi

## 📈 Benefici del Sistema Coordinato

1. **Efficienza**: Un solo cron job invece di multipli
2. **Coordinamento**: Gestione centralizzata degli orari
3. **Monitoraggio**: Visibilità completa dello stato
4. **Flessibilità**: Facile aggiungere nuovi task
5. **Affidabilità**: Gestione errori migliorata

## 🚀 Aggiungere Nuovi Task

Per aggiungere un nuovo task schedulato:

1. **Aggiungi l'endpoint** in `SCHEDULED_TASKS`
2. **Configura la logica** di esecuzione
3. **Testa** con `/api/scheduler/status`
4. **Monitora** l'esecuzione

```typescript
const SCHEDULED_TASKS: ScheduledTask[] = [
  // ... task esistenti
  {
    name: 'Nuovo Task',
    endpoint: '/api/nuovo-task',
    schedule: '0 7 * * *',
    description: 'Descrizione del nuovo task'
  }
];
```
