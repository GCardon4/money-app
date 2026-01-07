<template>
  <router-view />

  <!-- Banner de instalación de PWA -->
  <q-banner
    v-if="showInstallPrompt"
    class="bg-primary text-white q-py-md q-px-lg flex flex-center"
    style="position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999; border-top-left-radius: 8px; border-top-right-radius: 8px;"
  >
    <q-icon name="download_for_offline" size="md" class="q-mr-md" />
    <span class="text-weight-bold">¡Instala Money App!</span>
    <q-space />
    <q-btn flat label="Instalar" @click="installPWA" class="text-white q-ml-md" />
    <q-btn flat round icon="close" @click="dismissBanner" class="text-white q-ml-sm" />
  </q-banner>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/authStore'
import { scheduleAllCommitments, checkDailyNotifications } from 'src/utils/notifications'

defineOptions({
  name: 'App'
})

const $q = useQuasar()
const authStore = useAuthStore()

const deferredPrompt = ref(null)
const showInstallPrompt = ref(false)
const isStandalone = ref(false)

// Detecta si ya está instalado
const checkIfInstalled = () => {
  isStandalone.value = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone === true ||
                       document.referrer.includes('android-app://')
  return isStandalone.value
}

// Detecta el tipo de dispositivo/navegador
const detectDevice = () => {
  const ua = window.navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua)
  return { isIOS, isSafari }
}

// Función para disparar la instalación de la PWA
const installPWA = async () => {
  if (deferredPrompt.value) {
    console.log('Mostrando prompt de instalación...')
    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice
    console.log('Resultado de instalación:', outcome)

    if (outcome === 'accepted') {
      console.log('✅ Usuario aceptó la instalación')
      showInstallPrompt.value = false
    } else {
      console.log('❌ Usuario canceló la instalación')
      dismissBanner()
    }
    deferredPrompt.value = null
  } else {
    console.log('deferredPrompt no disponible - mostrando instrucciones manuales')
    showManualInstallDialog()
  }
}

// Rechazar/cerrar el banner
const dismissBanner = () => {
  showInstallPrompt.value = false
  localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  console.log('Banner de instalación cerrado por el usuario')
}

// Mostrar dialog con instrucciones manuales
const showManualInstallDialog = () => {
  const { isIOS } = detectDevice()
  
  let message = ''
  let icon = 'info'
  
  if (isIOS) {
    message = 'Para instalar en iOS:\n1. Toca el ícono de compartir (📤)\n2. Selecciona "Añadir a pantalla de inicio"\n3. Toca "Añadir"'
    icon = 'phone_iphone'
  } else {
    message = 'Para instalar:\n1. Toca el menú del navegador (⋮)\n2. Selecciona "Instalar app" o "Añadir a pantalla de inicio"\n3. Confirma la instalación'
    icon = 'get_app'
  }

  $q.dialog({
    title: 'Instalar Money App',
    message: message,
    icon: icon,
    html: true,
    color: 'primary',
    ok: {
      label: 'Entendido',
      color: 'primary'
    }
  })
}

onMounted(async () => {
  // Inicializa la autenticación con el store
  await authStore.initializeAuth()

  // Programa notificaciones si el usuario está autenticado
  if (authStore.user) {
    await scheduleAllCommitments(authStore.user.id)
    await checkDailyNotifications(authStore.user.id)
  }

  // Verificar si ya está instalado
  const alreadyInstalled = checkIfInstalled()
  console.log('PWA ya instalada:', alreadyInstalled)

  if (alreadyInstalled) {
    console.log('App corriendo en modo standalone (ya instalada)')
    return
  }

  // Lógica para detectar PWA instalable (Chrome, Edge, Android)
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('✅ Evento beforeinstallprompt capturado!')
    e.preventDefault()
    deferredPrompt.value = e
    showInstallPrompt.value = true
  })

  // Lógica para detectar cuando la PWA ya ha sido instalada
  window.addEventListener('appinstalled', () => {
    console.log('✅ PWA instalada con éxito')
    showInstallPrompt.value = false
    deferredPrompt.value = null
    $q.notify({ 
      type: 'positive', 
      message: '¡Money App instalada exitosamente!',
      icon: 'check_circle',
      position: 'top'
    })
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeinstallprompt', () => {})
  window.removeEventListener('appinstalled', () => {})
})
</script>