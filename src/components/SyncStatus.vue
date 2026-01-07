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
      
      <q-btn
        v-if="syncStore.isOnline && !syncStore.isSyncing"
        flat
        dense
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
import { useSyncStore } from 'stores/syncStore'

const syncStore = useSyncStore()
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
