# 🐕 PetAp - Paseo de Perros Cuautitlán Izcalli

App minimalista de paseo de perros especializada en Cuautitlán Izcalli. Una experiencia memorable para dueños de perros y paseadores profesionales.

## ✨ Características

- 🗺️ **Mapa Interactivo** - Localiza paseadores en tiempo real
- 👥 **Perfil de Paseadores** - Calificaciones, precios y experiencia
- 📱 **Diseño Minimalista** - Interfaz limpia y responsiva
- ⭐ **Sistema de Calificaciones** - Elige al mejor paseador
- 🌍 **Optimizado para Cuautitlán** - Rutas y paseadores locales

## 🚀 Inicio Rápido

### Requisitos
- Node.js 16+
- npm o yarn

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/abransitonena-blip/pet-ap.git
cd pet-ap

# Instalar dependencias
npm install
```

### Desarrollo Local

```bash
# Terminal 1 - Frontend (Vite)
npm run dev
# http://localhost:3000

# Terminal 2 - Backend (Express)
npm run server
# http://localhost:5000
```

## 📦 Deploy Gratuito

### Frontend - Vercel

```bash
npm run build
# Conectar a Vercel:
# https://vercel.com/new
```

### Backend - Render.com

1. Crea cuenta en https://render.com
2. Nuevo Web Service desde este repo
3. Comando: `npm run server`
4. Puerto: 5000

### Base de Datos - Firebase

Opcional: Configura Firebase para persistencia de datos

```bash
npm install firebase
```

## 📁 Estructura del Proyecto

```
pet-ap/
├── src/
│   ├── components/
│   │   ├─�� Header.jsx
│   │   ├── Map.jsx
│   │   ├── WalkerCard.jsx
│   │   └── *.css
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── server/
│   └── index.js
├── public/
├── index.html
├── package.json
└── vite.config.js
```

## 🎨 Tecnologías

- **Frontend**: React 18 + Vite
- **Mapas**: Leaflet + React Leaflet
- **Backend**: Express.js
- **Deploy**: Vercel + Render
- **Estilos**: CSS3 Vanilla

## 📍 Información de Cuautitlán Izcalli

- **Coordenadas**: 25.7699° N, 99.2432° O
- **Zonas Principales**: Centro, Norte, Sur, Oriente
- **Parques Populares**: Parque Central, Bosques de Cuautitlán

## 📱 Responsive

✅ Mobile First
✅ Tablet Optimizado
✅ Desktop Full Experience

## 🤝 Contribuir

Este proyecto es de código abierto. Siéntete libre de forking, crear issues y enviar PRs.

## 📝 Licencia

MIT - Libre para uso personal y comercial

## 🎉 ¡Disfruta!

Perfecto para dueños de perros en Cuautitlán Izcalli. ¡Reserva un paseo hoy! 🐕
