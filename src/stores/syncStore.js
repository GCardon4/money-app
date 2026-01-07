import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from 'boot/supabase'
import { 
  addToSyncQueue, 
  getPendingSyncOperations, 
  removeFromSyncQueue,
  updateSyncOperationStatus,
  countPendingOperations,
  saveCachedData,
  getCachedData
} from 'src/utils/indexedDB'
import { useAuthStore } from './authStore'

export const useSyncStore = defineStore('sync', () => {
  const isOnline = ref(navigator.onLine)
  const isSyncing = ref(false)
  const pendingCount = ref(0)
  const lastSyncTime = ref(null)

  // Detecta cambios en el estado de conexión
  const setupConnectionListeners = () => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Verifica conexión cada 30 segundos
    setInterval(checkConnection, 30000)
  }

  const handleOnline = async () => {
    console.log('🟢 Conexión detectada - verificando...')
    isOnline.value = true
    
    // Esperar 2 segundos para asegurar que la conexión sea estable
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Verificar que realmente haya conexión
    const hasRealConnection = await checkRealConnection()
    if (hasRealConnection) {
      console.log('✅ Conexión verificada - iniciando sincronización')
      await syncPendingOperations()
    } else {
      console.log('⚠️ Conexión no verificada - esperando...')
      isOnline.value = false
    }
  }

  const handleOffline = () => {
    console.log('🔴 Sin conexión a internet')
    isOnline.value = false
  }

  const checkConnection = async () => {
    const wasOnline = isOnline.value
    const navigatorOnline = navigator.onLine
    
    // Si el navegador dice que está online, verificar realmente
    if (navigatorOnline) {
      const realConnection = await checkRealConnection()
      isOnline.value = realConnection
    } else {
      isOnline.value = false
    }
    
    // Si recuperamos conexión, sincronizar
    if (!wasOnline && isOnline.value) {
      console.log('🔄 Conexión recuperada - sincronizando...')
      await syncPendingOperations()
    }
  }

  // Verifica si realmente hay conexión haciendo un ping a Supabase
  const checkRealConnection = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .maybeSingle()
      
      return !error || error.code !== 'PGRST301'
    } catch (error) {
      console.log('⚠️ Verificación de conexión falló:', error.message)
      return false
    }
  }

  // Ejecuta una operación con manejo de offline
  const executeOperation = async (operation) => {
    if (!isOnline.value) {
      console.log('📴 Modo offline - agregando a cola:', operation.type)
      await addToSyncQueue(operation)
      await updatePendingCount()
      return { success: true, offline: true, tempId: `temp_${Date.now()}` }
    }

    try {
      const result = await performOperation(operation)
      return { success: true, data: result }
    } catch (error) {
      console.error('❌ Error en operación, agregando a cola:', error)
      await addToSyncQueue(operation)
      await updatePendingCount()
      return { success: true, offline: true, tempId: `temp_${Date.now()}` }
    }
  }

  // Ejecuta la operación real en Supabase
  const performOperation = async (operation) => {
    const { type, table, data, id } = operation
    const authStore = useAuthStore()

    let result

    switch (type) {
      case 'insert': {
        const insertData = { ...data, user_id: authStore.user.id }
        const { data: inserted, error: insertError } = await supabase
          .from(table)
          .insert(insertData)
          .select()
          .single()
        
        if (insertError) throw insertError
        result = inserted
        break
      }

      case 'update': {
        const { data: updated, error: updateError } = await supabase
          .from(table)
          .update(data)
          .eq('id', id)
          .select()
          .single()
        
        if (updateError) throw updateError
        result = updated
        break
      }

      case 'delete': {
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .eq('id', id)
        
        if (deleteError) throw deleteError
        result = { id }
        break
      }

      default:
        throw new Error(`Tipo de operación desconocido: ${type}`)
    }

    return result
  }

  // Sincroniza todas las operaciones pendientes
  const syncPendingOperations = async () => {
    if (isSyncing.value) {
      console.log('⏳ Sincronización ya en progreso, ignorando...')
      return
    }
    
    if (!isOnline.value) {
      console.log('📴 Sin conexión, sincronización cancelada')
      return
    }

    isSyncing.value = true
    console.log('🔄 Iniciando sincronización...')

    try {
      const operations = await getPendingSyncOperations()
      console.log(`📊 ${operations.length} operaciones pendientes`)

      if (operations.length === 0) {
        console.log('✅ No hay operaciones pendientes')
        isSyncing.value = false
        return
      }

      let successCount = 0
      let errorCount = 0

      for (const operation of operations) {
        try {
          // Verificar conexión antes de cada operación
          if (!navigator.onLine) {
            console.log('⚠️ Conexión perdida durante sincronización')
            isOnline.value = false
            break
          }

          await performOperation(operation)
          await removeFromSyncQueue(operation.id)
          successCount++
          console.log('✅ Operación sincronizada:', operation.type, operation.table)
          
          // Pequeña pausa entre operaciones
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (error) {
          errorCount++
          console.error('❌ Error sincronizando operación:', error.message)
          
          // Si es error de red, detener sincronización
          if (error.message.includes('fetch') || error.message.includes('network')) {
            console.log('🔴 Error de red detectado - deteniendo sincronización')
            isOnline.value = false
            break
          }
          
          await updateSyncOperationStatus(operation.id, 'error', error.message)
          
          // Si tiene más de 3 intentos, marcar como fallida
          if (operation.retries >= 3) {
            console.warn('⚠️ Operación fallida después de 3 intentos:', operation)
            await removeFromSyncQueue(operation.id)
          }
        }
      }

      await updatePendingCount()
      lastSyncTime.value = new Date()
      
      if (successCount > 0) {
        console.log(`✅ Sincronización completada: ${successCount} exitosas, ${errorCount} fallidas`)
      }
    } catch (error) {
      console.error('❌ Error en sincronización:', error)
    } finally {
      isSyncing.value = false
    }
  }

  // Actualiza el contador de operaciones pendientes
  const updatePendingCount = async () => {
    pendingCount.value = await countPendingOperations()
  }

  // Cachea datos para uso offline
  const cacheTableData = async (table, data) => {
    await saveCachedData(table, data)
    console.log(`💾 Datos cacheados para ${table}`)
  }

  // Obtiene datos cacheados
  const getCachedTableData = async (table) => {
    return await getCachedData(table)
  }

  // Fuerza sincronización manual
  const forceSyncNow = async () => {
    if (isOnline.value) {
      await syncPendingOperations()
      return true
    }
    return false
  }

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncTime,
    setupConnectionListeners,
    executeOperation,
    syncPendingOperations,
    updatePendingCount,
    cacheTableData,
    getCachedTableData,
    forceSyncNow
  }
})
