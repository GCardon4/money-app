# Checklist Pre-Deployment PWA

## ✅ Antes de hacer Push a Netlify

### 1. Build Local
```bash
npm run build:pwa
```
- [ ] Build exitoso sin errores
- [ ] Carpeta `dist/pwa` generada correctamente
- [ ] Archivo `dist/pwa/sw.js` existe
- [ ] Archivo `dist/pwa/manifest.json` existe
- [ ] Carpeta `dist/pwa/icons/` contiene todos los íconos

### 2. Test Local del Build
```bash
npm start
```
Abrir: http://localhost:3000

- [ ] App carga correctamente
- [ ] Console muestra: "✅ Service worker is active"
- [ ] Console muestra: "✅ Service worker has been registered"
- [ ] DevTools → Application → Service Workers muestra sw.js activo
- [ ] DevTools → Application → Manifest muestra datos correctos

### 3. Test del Banner de Instalación (Chrome/Edge)
En http://localhost:3000:
- [ ] Console muestra: "✅ Evento beforeinstallprompt capturado!"
- [ ] Banner de instalación aparece en la parte inferior
- [ ] Click en "Instalar" funciona
- [ ] Click en "X" cierra el banner

### 4. Verificar Archivos de Configuración

**package.json:**
```json
"build:pwa": "quasar build -m pwa"
```
- [ ] Script build:pwa configurado

**netlify.toml:**
```toml
[build]
  command = "npm run build:pwa"
  publish = "dist/pwa"
```
- [ ] Comando correcto
- [ ] Directorio de publicación correcto
- [ ] Headers para sw.js y manifest.json configurados

### 5. Push a Git
```bash
git add .
git commit -m "feat: PWA lista para deployment"
git push origin main
```

## 🚀 Después del Deploy en Netlify

### 1. Verificar Build en Netlify
- [ ] Build exitoso (sin errores)
- [ ] Log muestra: "Build mode............. pwa"
- [ ] Duración del build razonable

### 2. Test en Producción
Abrir tu URL de Netlify: https://tu-app.netlify.app

**DevTools → Console:**
- [ ] "✅ Service worker is active"
- [ ] "✅ Service worker has been registered"
- [ ] No hay errores en rojo

**DevTools → Application → Service Workers:**
- [ ] Service worker activo y corriendo
- [ ] Estado: "activated and is running"
- [ ] Source: sw.js

**DevTools → Application → Manifest:**
- [ ] name: "Money App - Control Finanzas"
- [ ] start_url: "/"
- [ ] display: "standalone"
- [ ] icons: todos los tamaños visibles

### 3. Test de Instalación

**Chrome/Edge (Desktop o Android):**
- [ ] Aparece icono de instalación en la barra de direcciones
- [ ] Banner de instalación aparece en la app
- [ ] Click en "Instalar" → Prompt nativo del navegador
- [ ] App se instala correctamente
- [ ] App aparece en aplicaciones del sistema
- [ ] App se abre en ventana standalone (sin barra del navegador)

**Safari iOS:**
- [ ] Abrir menú Safari → "Añadir a pantalla de inicio"
- [ ] App se agrega al home screen
- [ ] Al abrir funciona en modo standalone

### 4. Test de Funcionalidad PWA

**Offline:**
- [ ] Cerrar conexión a internet
- [ ] Recargar la app
- [ ] App funciona (muestra contenido cacheado)
- [ ] Console: "📵 No internet connection found. App is running in offline mode."

**Notificaciones:**
- [ ] Crear un compromiso con fecha próxima
- [ ] Verificar que se programen notificaciones (console logs)
- [ ] (Si aplica) Test de notificación 8, 5, 3 días antes

### 5. Test Multi-Navegador

**Chrome Desktop:**
- [ ] PWA instalable
- [ ] Service worker activo
- [ ] Funciona offline

**Chrome Android:**
- [ ] PWA instalable
- [ ] Banner de instalación aparece
- [ ] Funciona como app nativa

**Safari iOS:**
- [ ] "Añadir a pantalla de inicio" funciona
- [ ] App abre en modo standalone

**Edge:**
- [ ] PWA instalable
- [ ] Service worker activo

## 🐛 Problemas Comunes

### Banner no aparece en producción
- Verificar que sea HTTPS (Netlify lo provee)
- Verificar en Console si hay evento "beforeinstallprompt"
- Limpiar caché del navegador y recargar
- Verificar que no esté ya instalada

### Service Worker no se registra
- Verificar que sw.js sea accesible: https://tu-app.netlify.app/sw.js
- Verificar headers en Network tab
- Verificar que sea HTTPS

### App no funciona offline
- Verificar que service worker esté activo
- Verificar estrategias de caché en custom-service-worker.js
- Revisar DevTools → Application → Cache Storage

## ✅ Deploy Exitoso cuando:
- [x] Build sin errores en Netlify
- [x] Service worker activo en producción
- [x] Manifest.json accesible y correcto
- [x] App instalable en Chrome/Edge
- [x] App funciona offline
- [x] Banner de instalación aparece
- [x] Notificaciones programadas correctamente
