<template>
  <q-banner
    v-if="syncStore.pendingCount > 0 || !syncStore.isOnline"
    :class="syncStore.isOnline ? 'bg-warning' : 'bg-negative'"
    class="text-white q-pa-sm"
    style="position: fixed; top: 0; left: 0; right: 0; z-index: 9000;"
  >
    <template v-slot:avatar>
      <q-icon 
        :name="syncStore.isOnline ? 'sync' : 'cloud_off'" 
        :class="{ 'rotating': syncStore.isSyncing }"
      />
    </template>

    <div class="row items-center">
      <div class="col">
        <span v-if="!syncStore.isOnline">
          Sin conexión - Modo offline
        </span>
        <span v-else-if="syncStore.isSyncing">
          Sincronizando {{ syncStore.pendingCount }} operaciones...
        </span>
        <span v-else>
          {{ syncStore.pendingCount }} operaciones pendientes
        </span>
      </div>
      
      <!-- Botón de recarga cuando está offline -->
      <q-btn
        v-if="!syncStore.isOnline && !checkingConnection"
        flat
        dense
        round
        icon="refresh"
        @click="recheckConnection"
        class="text-white"
      >
        <q-tooltip>Verificar conexión</q-tooltip>
      </q-btn>

      <!-- Spinner cuando está verificando -->
      <q-spinner-dots
        v-if="checkingConnection"
        color="white"
        size="24px"
      />
      
      <!-- Botón de sincronización cuando está online -->
      <q-btn
        v-if="syncStore.isOnline && !syncStore.isSyncing"
        flat
        dense
        round
        icon="sync"
        @click="syncStore.forceSyncNow"
        class="text-white"
      >
        <q-tooltip>Sincronizar ahora</q-tooltip>
      </q-btn>
    </div>
  </q-banner>
</template>

<script setup>
import { ref } from 'vue'
import { useSyncStore } from 'stores/syncStore'
import { useQuasar } from 'quasar'

const syncStore = useSyncStore()
const $q = useQuasar()
const checkingConnection = ref(false)

// Verifica la conexión manualmente
const recheckConnection = async () => {
  checkingConnection.value = true
  
  try {
    await syncStore.recheckConnection()
    
    if (syncStore.isOnline) {
      $q.notify({
        type: 'positive',
        message: 'Conexión restablecida',
        icon: 'wifi',
        position: 'top',
        timeout: 2000
      })
    } else {
      $q.notify({
        type: 'warning',
        message: 'Aún sin conexión',
        icon: 'wifi_off',
        position: 'top',
        timeout: 2000
      })
    }
  } catch (error) {
    console.error('Error verificando conexión:', error)
  } finally {
    setTimeout(() => {
      checkingConnection.value = false
    }, 500)
  }
}
</script>

<style scoped>
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.rotating {
  animation: rotate 2s linear infinite;
}
</style>
