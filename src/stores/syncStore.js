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
  const setupConnectionListeners = async () => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Detecta cuando la app vuelve a estar visible (PWA)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Listener de Capacitor para Android/iOS (solo si está disponible)
    // @ts-ignore - Capacitor solo disponible en apps nativas
    if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) {
      try {
        // Solo importa en runtime, no en build time
        import('@capacitor/app').then(({ App }) => {
          App.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
              console.log('▶️ App activa - verificando conexión...')
              recheckConnection()
            }
          })
          console.log('✅ Capacitor App listener registrado')
        }).catch(() => {
          console.log('ℹ️ Error al cargar Capacitor App plugin')
        })
      } catch {
        console.log('ℹ️ Error al cargar Capacitor')
      }
    }
    
    // Verifica conexión cada 30 segundos
    setInterval(checkConnection, 30000)
  }

  const handleVisibilityChange = async () => {
    if (!document.hidden) {
      console.log('👁️ App visible - verificando conexión...')
      await recheckConnection()
    }
  }

  const recheckConnection = async () => {
    console.log('🔍 Verificando estado de conexión...')
    
    // Primera verificación con navigator.onLine
    if (!navigator.onLine) {
      console.log('📴 navigator.onLine = false')
      isOnline.value = false
      return
    }
    
    // Verificación real con ping a Supabase
    const hasConnection = await checkRealConnection()
    const previousState = isOnline.value
    isOnline.value = hasConnection
    
    if (hasConnection) {
      console.log('✅ Conexión verificada y activa')
      // Si cambiamos de offline a online, sincronizar
      if (!previousState && pendingCount.value > 0) {
        console.log('🔄 Sincronizando operaciones pendientes...')
        await syncPendingOperations()
      }
    } else {
      console.log('📴 Sin conexión a Supabase')
    }
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

  // Verifica si realmente hay conexión haciendo un ping rápido a Supabase
  const checkRealConnection = async () => {
    try {
      // Timeout de 5 segundos para la verificación
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      )
      
      const checkPromise = supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .maybeSingle()
      
      const { error } = await Promise.race([checkPromise, timeout])
      
      return !error || error.code !== 'PGRST301'
    } catch (error) {
      console.log('⚠️ Verificación de conexión falló:', error.message)
      return false
    }
  }

  // Ejecuta una operación con manejo de offline
  const executeOperation = async (operation) => {
    // Primera verificación rápida con navigator.onLine
    if (!navigator.onLine) {
      console.log('📴 Modo offline detectado - agregando a cola:', operation.type)
      await addToSyncQueue(operation)
      await updatePendingCount()
      return { success: true, offline: true, tempId: `temp_${Date.now()}` }
    }

    // Intentar ejecutar la operación
    try {
      const result = await performOperation(operation)
      return { success: true, data: result }
    } catch (error) {
      console.error('❌ Error en operación:', error.message)
      
      // Si es error de timeout o red, agregar a cola
      if (error.message === 'Timeout' || error.message === 'Failed to fetch' || !navigator.onLine) {
        console.log('📴 Error de conexión - agregando a cola')
        await addToSyncQueue(operation)
        await updatePendingCount()
        isOnline.value = false // Marcar como offline
        return { success: true, offline: true, tempId: `temp_${Date.now()}` }
      }
      
      // Si es otro tipo de error, lanzarlo
      throw error
    }
  }

  // Ejecuta la operación real en Supabase con timeout
  const performOperation = async (operation) => {
    const { type, table, data, id } = operation
    const authStore = useAuthStore()

    // Timeout de 10 segundos
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 10000)
    )

    let result

    switch (type) {
      case 'insert': {
        const insertData = { ...data, user_id: authStore.user.id }
        const operationPromise = supabase
          .from(table)
          .insert(insertData)
          .select()
          .single()
        
        const { data: inserted, error: insertError } = await Promise.race([operationPromise, timeout])
        
        if (insertError) throw insertError
        result = inserted
        break
      }

      case 'update': {
        const operationPromise = supabase
          .from(table)
          .update(data)
          .eq('id', id)
          .select()
          .single()
        
        const { data: updated, error: updateError } = await Promise.race([operationPromise, timeout])
        
        if (updateError) throw updateError
        result = updated
        break
      }

      case 'delete': {
        const operationPromise = supabase
          .from(table)
          .delete()
          .eq('id', id)
        
        const { error: deleteError } = await Promise.race([operationPromise, timeout])
        
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
    forceSyncNow,
    recheckConnection
  }
})
