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
import { ref, onMounted, onBeforeUnmount } from 'vue' // Importa ref, onBeforeUnmount
import { useRouter } from 'vue-router'
import { supabase } from 'boot/supabase'
import { useQuasar } from 'quasar'; // Importa useQuasar para notificaciones


defineOptions({
  name: 'App'
});

const router = useRouter();
const $q = useQuasar(); // Instancia de Quasar para notificaciones

const deferredPrompt = ref(null); // Guarda el evento 'beforeinstallprompt'
const showInstallPrompt = ref(false); // Controla la visibilidad del banner

onMounted(() => {
  // Lógica de autenticación de Supabase (ya existente)
  supabase.auth.onAuthStateChange((event, session) => {
    if (!session) {
      // Solo redirige si no estamos ya en la página de login
      if (router.currentRoute.value.name !== 'login') {
        router.push({ name: 'login' });
      }
    }
    // Puedes añadir lógica para 'SIGNED_IN' si necesitas hacer algo específico al iniciar sesión.
    // else if (event === 'SIGNED_IN' && router.currentRoute.value.name === 'login') {
    //   router.push({ name: 'home' });
    // }
  });

  // Lógica para detectar PWA instalable
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // Evita que el navegador muestre su propio banner de instalación
    deferredPrompt.value = e; // Guarda el evento para usarlo más tarde
    showInstallPrompt.value = true; // Muestra tu banner personalizado
    console.log('Evento beforeinstallprompt detectado. PWA es instalable.');
  });

  // Lógica para detectar cuando la PWA ya ha sido instalada
  window.addEventListener('appinstalled', () => {
    showInstallPrompt.value = false; // Oculta el banner si ya se instaló
    deferredPrompt.value = null; // Limpia el evento
    console.log('PWA instalada con éxito.');
    $q.notify({ type: 'positive', message: '¡App-Stock se ha instalado en tu dispositivo!' });
  });
});

onBeforeUnmount(() => {
  // Limpia los event listeners al desmontar el componente para evitar fugas de memoria
  window.removeEventListener('beforeinstallprompt', () => {});
  window.removeEventListener('appinstalled', () => {});
});

// Función para disparar la instalación de la PWA
const installPWA = async () => {
  if (deferredPrompt.value) {
    deferredPrompt.value.prompt(); // Muestra el diálogo de instalación del navegador
    const { outcome } = await deferredPrompt.value.userChoice; // Espera la respuesta del usuario

    if (outcome === 'accepted') {
      console.log('Usuario aceptó la instalación de la PWA.');
      // El evento 'appinstalled' se encargará de ocultar el banner y notificar
    } else {
      console.log('Usuario canceló la instalación de la PWA.');
      showInstallPrompt.value = false; // Oculta el banner si el usuario cancela
    }
    deferredPrompt.value = null; // El prompt solo se puede usar una vez
  } else {
    console.log('PWA no instalable o prompt ya fue disparado/usado.');
    // Si no hay prompt diferido, el usuario ya instaló o el navegador no lo soporta.
    // Para iOS, se debe guiar al usuario a "Añadir a pantalla de inicio".
    $q.notify({
      type: 'info',
      message: 'Usa la opción "Añadir a pantalla de inicio" de tu navegador para instalar.',
      position: 'top',
      timeout: 3000
    });
  }
};
</script>
