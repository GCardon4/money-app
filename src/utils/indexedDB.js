// Configuración de IndexedDB para almacenamiento offline
const DB_NAME = 'MoneyAppDB'
const DB_VERSION = 1

// Abre la base de datos
export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      // Store para operaciones pendientes de sincronización
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true })
        syncStore.createIndex('timestamp', 'timestamp', { unique: false })
        syncStore.createIndex('type', 'type', { unique: false })
        syncStore.createIndex('status', 'status', { unique: false })
      }

      // Store para datos cacheados (expenses, incomes, commitments, debts)
      if (!db.objectStoreNames.contains('cachedData')) {
        const cacheStore = db.createObjectStore('cachedData', { keyPath: 'key' })
        cacheStore.createIndex('table', 'table', { unique: false })
      }
    }
  })
}

// Guarda datos en caché local
export async function saveCachedData(table, data) {
  const db = await openDB()
  const tx = db.transaction('cachedData', 'readwrite')
  const store = tx.objectStore('cachedData')
  
  await store.put({
    key: table,
    table: table,
    data: data,
    timestamp: Date.now()
  })
  
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// Obtiene datos cacheados
export async function getCachedData(table) {
  const db = await openDB()
  const tx = db.transaction('cachedData', 'readonly')
  const store = tx.objectStore('cachedData')
  
  return new Promise((resolve, reject) => {
    const request = store.get(table)
    request.onsuccess = () => {
      const result = request.result
      resolve(result ? result.data : null)
    }
    request.onerror = () => reject(request.error)
  })
}

// Agrega operación a la cola de sincronización
export async function addToSyncQueue(operation) {
  const db = await openDB()
  const tx = db.transaction('syncQueue', 'readwrite')
  const store = tx.objectStore('syncQueue')
  
  const queueItem = {
    ...operation,
    timestamp: Date.now(),
    status: 'pending',
    retries: 0
  }
  
  await store.add(queueItem)
  
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      console.log('📝 Operación agregada a la cola de sincronización:', operation.type)
      resolve()
    }
    tx.onerror = () => reject(tx.error)
  })
}

// Obtiene todas las operaciones pendientes
export async function getPendingSyncOperations() {
  const db = await openDB()
  const tx = db.transaction('syncQueue', 'readonly')
  const store = tx.objectStore('syncQueue')
  const index = store.index('status')
  
  return new Promise((resolve, reject) => {
    const request = index.getAll('pending')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Elimina operación de la cola
export async function removeFromSyncQueue(id) {
  const db = await openDB()
  const tx = db.transaction('syncQueue', 'readwrite')
  const store = tx.objectStore('syncQueue')
  
  await store.delete(id)
  
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// Actualiza el estado de una operación
export async function updateSyncOperationStatus(id, status, error = null) {
  const db = await openDB()
  const tx = db.transaction('syncQueue', 'readwrite')
  const store = tx.objectStore('syncQueue')
  
  return new Promise((resolve, reject) => {
    const getRequest = store.get(id)
    
    getRequest.onsuccess = () => {
      const operation = getRequest.result
      if (operation) {
        operation.status = status
        operation.lastAttempt = Date.now()
        operation.retries = (operation.retries || 0) + 1
        if (error) operation.error = error
        
        const putRequest = store.put(operation)
        putRequest.onsuccess = () => resolve()
        putRequest.onerror = () => reject(putRequest.error)
      } else {
        resolve()
      }
    }
    
    getRequest.onerror = () => reject(getRequest.error)
  })
}

// Cuenta operaciones pendientes
export async function countPendingOperations() {
  const db = await openDB()
  const tx = db.transaction('syncQueue', 'readonly')
  const store = tx.objectStore('syncQueue')
  const index = store.index('status')
  
  return new Promise((resolve, reject) => {
    const request = index.count('pending')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
