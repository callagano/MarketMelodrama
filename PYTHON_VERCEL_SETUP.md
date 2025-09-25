# Configurazione Python per Vercel - Market Melodrama

## 🐍 **Configurazione Python Completata**

### **File Creati/Modificati:**

1. **`scripts/setup-python.sh`** - Script di setup per l'ambiente Python
2. **`package.json`** - Aggiornato con script di build Python
3. **`vercel.json`** - Configurazione Vercel con timeout estesi
4. **`requirements.txt`** - Dipendenze Python principali
5. **`runtime.txt`** - Specifica versione Python per Vercel
6. **`.vercelignore`** - Esclude file non necessari dal deployment
7. **`src/app/api/fear-greed-update/route.ts`** - API route aggiornata con auto-setup

### **Come Funziona:**

#### **1. Build Process**
```bash
npm run build
```
- Esegue `setup-python.sh`
- Crea virtual environment Python
- Installa dipendenze
- Compila Next.js

#### **2. Runtime API**
L'API route ora:
- ✅ Verifica se il virtual environment esiste
- ✅ Lo crea automaticamente se mancante
- ✅ Installa dipendenze se necessario
- ✅ Esegue lo script Python

#### **3. Configurazione Vercel**
- **Timeout**: 300 secondi per le funzioni Python
- **Runtime**: Python 3.11
- **Build Command**: `npm run build`
- **Cron**: Ogni giorno alle 4:00 UTC

### **Test Locale:**
```bash
# Setup Python
npm run setup-python

# Test API
curl -X POST http://localhost:3000/api/fear-greed-update

# Test Scheduler
curl -X POST http://localhost:3000/api/scheduler
```

### **Deployment Vercel:**
1. **Push su GitHub**
2. **Vercel rileva automaticamente** le modifiche
3. **Build process** esegue setup Python
4. **Cron job** funziona automaticamente

### **Monitoraggio:**
- **Log Vercel**: Dashboard → Functions → Logs
- **Status API**: `GET /api/scheduler/status`
- **Test Manuale**: `POST /api/fear-greed-update`

### **Risoluzione Problemi:**

#### **Se Python non funziona su Vercel:**
1. Controlla i log in Vercel Dashboard
2. Verifica che `runtime.txt` specifichi Python 3.11
3. Controlla che `requirements.txt` sia nella root
4. Verifica i timeout in `vercel.json`

#### **Se le dipendenze non si installano:**
1. Controlla `scripts/setup-python.sh`
2. Verifica i permessi del file
3. Controlla i log di build

### **File di Configurazione:**

#### **vercel.json**
```json
{
  "crons": [{"path": "/api/scheduler", "schedule": "0 4 * * *"}],
  "functions": {
    "src/app/api/fear-greed-update/route.ts": {"maxDuration": 300},
    "src/app/api/scheduler/route.ts": {"maxDuration": 300}
  },
  "buildCommand": "npm run build"
}
```

#### **package.json**
```json
{
  "scripts": {
    "build": "npm run setup-python && next build",
    "setup-python": "bash scripts/setup-python.sh"
  }
}
```

### **✅ Risultato:**
- **Python funziona** automaticamente su Vercel
- **Dipendenze installate** durante il build
- **Virtual environment** creato automaticamente
- **Cron job** esegue ogni giorno alle 6:00 AM GMT+2
- **Sistema robusto** con auto-recovery

## 🚀 **Pronto per il Deployment!**
