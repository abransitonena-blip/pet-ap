# 📦 Guía de Deploy

## 🌐 Vercel (Frontend)

### Opción 1: GitHub Integration
1. Ve a https://vercel.com/new
2. Importa tu repositorio de GitHub
3. Selecciona Vite como framework
4. ¡Listo! Deploy automático en cada push

### Opción 2: CLI
```bash
npm i -g vercel
vercel
```

**Variables de Entorno:**
```
VITE_API_URL=https://tu-backend.onrender.com
```

---

## 🔧 Render.com (Backend)

1. Crea cuenta en https://render.com
2. Click en "New" → "Web Service"
3. Conecta tu repositorio GitHub
4. Configura:
   - **Build Command**: `npm install`
   - **Start Command**: `npm run server`
   - **Port**: 5000
   - **Environment**: Node

**Variables de Entorno:**
```
NODE_ENV=production
PORT=5000
```

---

## 🔥 Firebase (Base de Datos - Opcional)

### Setup
```bash
npm install firebase
```

### Crear Proyecto
1. https://console.firebase.google.com
2. Crear nuevo proyecto
3. Habilitar Firestore
4. Copiar credenciales

### Archivo `.env.local`
```
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
```

---

## ✅ Checklist Pre-Deploy

- [ ] `npm run build` sin errores
- [ ] Variables de entorno configuradas
- [ ] Repositorio público en GitHub
- [ ] README.md actualizado
- [ ] .gitignore configurado
- [ ] CORS habilitado en backend

---

## 🔗 URLs Finales

Una vez desplegado:

- **Frontend**: `https://tu-proyecto.vercel.app`
- **Backend**: `https://tu-proyecto.onrender.com`
- **API**: `https://tu-proyecto.onrender.com/api/walkers`

---

## 🐛 Troubleshooting

### CORS Error
En `server/index.js`:
```javascript
const corsOptions = {
  origin: 'https://tu-proyecto.vercel.app',
  credentials: true
}
app.use(cors(corsOptions))
```

### Build Error
```bash
# Limpiar cache
rm -rf node_modules
rm package-lock.json
npm install
npm run build
```

### Cold Start en Render
Primer request puede tardar 50 segundos. Es normal.

---

## 🚀 Update Automático

Vercel y Render actualizan automáticamente con cada push a GitHub.

¡Disfruta tu app en producción! 🎉
