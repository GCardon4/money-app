<template>
  <div class="expense-form-container">
    <q-form @submit.prevent="handleSubmit" class="expense-form">
      <!-- Primera fila: Monto y Descripción -->
      <div class="row q-col-gutter-sm q-mb-sm">
        <div class="col-4 col-md-2">
          <q-input
            v-model.number="amount"
            type="number"
            placeholder="Monto"
            dense
            outlined
            :rules="[val => !!val && val > 0 || 'Requerido']"
            step="0.01"
            min="0"
            prefix="$"
            :disable="loading"
          />
        </div>
        
        <div class="col-8 col-md-10">
          <q-input
            v-model="description"
            placeholder="Descripción"
            dense
            outlined
            :rules="[val => !!val || 'Requerido']"
            maxlength="50"
            :disable="loading"
          />
        </div>
      </div>

      <!-- Segunda fila: Tipo, Categoría y Método de Pago -->
      <div class="row q-col-gutter-sm">
        <div class="col-4">
          <q-select
            v-model="type"
            :options="typeOptions"
            placeholder="Tipo"
            dense
            outlined
            :rules="[val => !!val || 'Requerido']"
            :disable="loading"
          />
        </div>
        
        <div class="col-4">
          <q-select
            v-model="categoryId"
            :options="categoryOptions"
            option-value="id"
            option-label="name"
            emit-value
            map-options
            placeholder="Categoría"
            dense
            outlined
            :rules="[val => !!val || 'Requerido']"
            :disable="loading || loadingCategories"
            :loading="loadingCategories"
          />
        </div>

        <div class="col-4">
          <q-select
            v-model="payMethod"
            :options="payMethodOptions"
            placeholder="Método"
            dense
            outlined
            :rules="[val => !!val || 'Requerido']"
            :disable="loading"
          />
        </div>
      </div>

      <!-- Botón Flotante -->
      <q-btn
        type="submit"
        fab
        icon="add"
        color="negative"
        class="floating-btn"
        :loading="loading"
        :disable="loading"
      >
        <q-tooltip>Agregar Gasto</q-tooltip>
      </q-btn>
      
    </q-form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { supabase } from 'boot/supabase'
import { useAuthStore } from 'stores/authStore'
import { useFinanceStore } from 'stores/financeStore'
import { useSyncStore } from 'stores/syncStore'

const $q = useQuasar()
const authStore = useAuthStore()
const financeStore = useFinanceStore()
const syncStore = useSyncStore()

// Estados del formulario
const amount = ref(null)
const description = ref('')
const categoryId = ref(null)
const type = ref('Variable')
const payMethod = ref('Efectivo')
const loading = ref(false)
const loadingCategories = ref(false)

// Opciones de categorías cargadas desde Supabase
const categoryOptions = ref([])

// Opciones de tipo de gasto
const typeOptions = ['Fijo', 'Variable']

// Opciones de método de pago
const payMethodOptions = ['Efectivo', 'Banco']

// Carga las categorías desde Supabase
const loadCategories = async () => {
  loadingCategories.value = true
  try {
    const { data, error } = await supabase
      .from('category_expenses')
      .select('id, name')
      .order('name')

    if (error) throw error
    
    categoryOptions.value = data || []
    
    // Selecciona la primera categoría por defecto si existe
    if (categoryOptions.value.length > 0 && !categoryId.value) {
      categoryId.value = categoryOptions.value[0].id
    }
  } catch (error) {
    console.error('Error al cargar categorías:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al cargar categorías',
      position: 'top'
    })
  } finally {
    loadingCategories.value = false
  }
}

// Guarda un nuevo gasto (con soporte offline)
const handleSubmit = async () => {
  if (!amount.value || !description.value || !categoryId.value || !type.value || !payMethod.value) return

  loading.value = true
  try {
    const expenseData = {
      amount: amount.value,
      description: description.value,
      category: categoryId.value,
      type: type.value,
      pay_method: payMethod.value
    }

    // Usar sincronización offline
    const result = await syncStore.executeOperation({
      type: 'insert',
      table: 'expenses',
      data: expenseData
    })

    if (result.offline) {
      // Agregar temporalmente a la lista local
      financeStore.addExpense({
        ...expenseData,
        id: result.tempId,
        user_id: authStore.user.id,
        created_at: new Date().toISOString(),
        _pending: true
      })

      $q.notify({
        type: 'warning',
        message: `Gasto guardado localmente (${syncStore.pendingCount} pendientes)`,
        icon: 'cloud_off',
        position: 'top',
        timeout: 3000
      })
    } else {
      // Recargar desde servidor
      await financeStore.loadExpenses()

      $q.notify({
        type: 'positive',
        message: 'Gasto agregado correctamente',
        position: 'top',
        timeout: 2000
      })
    }

    // Limpiar formulario
    amount.value = null
    description.value = ''
    payMethod.value = 'Efectivo'
    type.value = 'Variable'
  } catch (error) {
    console.error('Error al guardar gasto:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al guardar el gasto',
      position: 'top'
    })
  } finally {
    loading.value = false
  }
}

// Cargar categorías al montar el componente
onMounted(() => {
  loadCategories()
})
</script>
