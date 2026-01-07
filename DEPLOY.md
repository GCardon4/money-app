# Money App - PWA

## Configuración para Despliegue en Netlify

### ✅ Checklist de Deployment

#### Configuración PWA
- ✅ Service Worker configurado (InjectManifest mode)
- ✅ Manifest.json con toda la metadata necesaria
- ✅ Estrategias de caché configuradas (NetworkFirst, CacheFirst, StaleWhileRevalidate)
- ✅ Notificaciones push implementadas
- ✅ Icons en todos los tamaños (128x128 a 512x512)
- ✅ Build configurado para modo PWA (`npm run build:pwa`)
- ✅ Directorio de publicación: `dist/pwa`
- ✅ HTTPS obligatorio para PWA (Netlify lo provee automáticamente)

#### Archivos de Netlify
- ✅ `netlify.toml` - Configuración principal de build y headers
- ✅ `public/_headers` - Headers HTTP para service worker y manifest
- ✅ `public/_redirects` - Redirecciones para SPA routing

#### Build Configuration
```toml
[build]
  command = "npm run build:pwa"
  publish = "dist/pwa"
  
[build.environment]
  NODE_VERSION = "20"
```

**IMPORTANTE:** 
- El comando `npm run build:pwa` ejecuta `quasar build -m pwa`
- PWA requiere HTTPS (Netlify lo provee automáticamente)
- El evento `beforeinstallprompt` solo se dispara en Chrome/Edge con HTTPS
- En desarrollo con `quasar dev -m pwa` funciona correctamente

### 🚀 Pasos para Deploy

1. **Conectar repositorio en Netlify**
   - Ir a https://app.netlify.com
   - Click en "Add new site" → "Import an existing project"
   - Conectar con Git (GitHub/GitLab/Bitbucket)

2. **Configuración automática**
   - Netlify detectará automáticamente `netlify.toml`
   - Build command: `npm run build`
   - Publish directory: `dist/spa`

3. **Variables de entorno** (si es necesario ocultar keys)
   - En Netlify Dashboard → Site settings → Environment variables
   - Agregar:
     - `SUPABASE_URL`
     - `SUPABASE_KEY`

4. **Deploy**
   - Click en "Deploy site"
   - Netlify ejecutará el build automáticamente

### 🔧 Configuraciones Aplicadas

#### Service Worker (InjectManifest)
- **NetworkFirst** para API de Supabase (24h caché)
- **CacheFirst** para imágenes (30 días)
- **StaleWhileRevalidate** para JS/CSS (7 días)
- Click handler para notificaciones push

#### Manifest PWA
- Display: standalone
- Theme color: #2f6e2b
- Orientación: portrait
- Start URL: /
- Scope: /
- Icons con purpose "any maskable"
- Permisos: notifications

#### Headers HTTP
- Service Worker con `Service-Worker-Allowed: /`
- Manifest con `Content-Type: application/manifest+json`
- Security headers (X-Frame-Options, X-Content-Type-Options)
- Cache inmutable para assets e icons

### 📱 Testing PWA

#### En Local
```bash
npm run build
npm run start
```
Verificar en: http://localhost:3000

#### En Producción (Netlify)
1. Chrome DevTools → Application → Manifest
2. Chrome DevTools → Application → Service Workers
3. Lighthouse audit (PWA score)
4. Test de instalación (botón "Instalar app")
5. Test de notificaciones

### 🔍 Troubleshooting

**Service Worker no se registra:**
- Verificar que el sitio esté en HTTPS (Netlify lo provee automáticamente)
- Check en DevTools → Application → Service Workers
- Verificar que `sw.js` sea accesible: `https://tu-dominio.netlify.app/sw.js`

**PWA no se puede instalar (banner no aparece):**
- Verificar manifest.json en DevTools → Application → Manifest
- Asegurar que todos los íconos existan en `/icons/`
- Verificar que display sea "standalone" en manifest
- **IMPORTANTE:** El banner solo aparece en Chrome/Edge con HTTPS
- En Safari iOS no hay banner (usar "Añadir a pantalla de inicio")
- Verificar en Console los logs: "✅ Evento beforeinstallprompt capturado!"

**Notificaciones no funcionan:**
- Verificar permisos de notificación en el navegador
- Check que el service worker esté activo
- Verificar en DevTools → Application → Notifications

**Build falla en Netlify:**
- Verificar que el comando sea `npm run build:pwa`
- Check logs de Netlify para ver errores específicos
- Verificar que Node version sea 20 en build.environment

### 📊 Performance

Configuración optimizada para:
- ⚡ Carga rápida (precaching de assets)
- 🌐 Funciona offline (service worker con caché)
- 📱 Instalable como app nativa
- 🔔 Notificaciones push activas
- 🔄 Updates automáticos del service worker

### 🎯 Próximos Pasos

1. Push to Git repository
2. Connect to Netlify
3. Deploy
4. Test PWA functionality
5. Share URL con usuarios
