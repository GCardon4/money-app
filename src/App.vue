<template>
  <router-view />


  <!-- Banner de instalación de PWA -->
  <q-banner
    v-if="showInstallPrompt"
    class="bg-primary text-white q-py-md q-px-lg flex flex-center"
    style="position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999; border-top-left-radius: 8px; border-top-right-radius: 8px;"
  >
    <q-icon name="download_for_offline" size="md" class="q-mr-md" />
    <span class="text-weight-bold">¡Instala Personal Money App!</span>
    <q-space />
    <q-btn flat label="Instalar" @click="installPWA" class="text-white q-ml-md" />
    <q-btn flat round icon="close" @click="showInstallPrompt = false" class="text-white q-ml-sm" />
  </q-banner>

</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/authStore'

defineOptions({
  name: 'App'
});


const $q = useQuasar()
const authStore = useAuthStore()

const deferredPrompt = ref(null)
const showInstallPrompt = ref(false)

onMounted(async () => {
  // Inicializa la autenticación con el store
  await authStore.initializeAuth()

  // Lógica para detectar PWA instalable
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt.value = e
    showInstallPrompt.value = true
    console.log('Evento beforeinstallprompt detectado. PWA es instalable.')
  })

  // Lógica para detectar cuando la PWA ya ha sido instalada
  window.addEventListener('appinstalled', () => {
    showInstallPrompt.value = false
    deferredPrompt.value = null
    console.log('PWA instalada con éxito.')
    $q.notify({ type: 'positive', message: '¡Money App se ha instalado en tu dispositivo!' })
  })
})

onBeforeUnmount(() => {
  // Limpia los event listeners al desmontar el componente
  window.removeEventListener('beforeinstallprompt', () => {})
  window.removeEventListener('appinstalled', () => {})
})

// Función para disparar la instalación de la PWA
const installPWA = async () => {
  if (deferredPrompt.value) {
    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice

    if (outcome === 'accepted') {
      console.log('Usuario aceptó la instalación de la PWA.')
    } else {
      console.log('Usuario canceló la instalación de la PWA.')
      showInstallPrompt.value = false
    }
    deferredPrompt.value = null
  } else {
    console.log('PWA no instalable o prompt ya fue disparado/usado.')
    $q.notify({
      type: 'info',
      message: 'Usa la opción "Añadir a pantalla de inicio" de tu navegador para instalar.',
      position: 'top',
      timeout: 3000
    })
  }
}
</script>
