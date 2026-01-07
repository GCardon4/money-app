<template>
  <div class="expense-form-container">
    <q-form @submit.prevent="handleSubmit" class="expense-form">
      <div class="form-row">
        <!-- Campo de Monto -->
        <q-input
          v-model.number="amount"
          type="number"
          placeholder="Monto"
          dense
          outlined
          class="form-input amount-input"
          :rules="[val => !!val && val > 0 || 'Requerido']"
          step="0.01"
          min="0"
          prefix="$"
          :disable="loading"
        />

        <!-- Campo de Descripción -->
        <q-input
          v-model="description"
          placeholder="Descripción"
          dense
          outlined
          class="form-input description-input"
          :rules="[val => !!val || 'Requerido']"
          maxlength="50"
          :disable="loading"
        />

        <!-- Selector de Categoría -->
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
          class="form-input category-select"
          :rules="[val => !!val || 'Requerido']"
          :disable="loading || loadingCategories"
          :loading="loadingCategories"
        />

        <!-- Selector de Tipo -->
        <q-select
          v-model="type"
          :options="typeOptions"
          placeholder="Tipo"
          dense
          outlined
          class="form-input type-select"
          :rules="[val => !!val || 'Requerido']"
          :disable="loading"
        />

        <!-- Botón de Agregar -->
        <q-btn
          type="submit"
          icon="add"
          color="negative"
          dense
          unelevated
          class="add-btn align-right"
          :loading="loading"
          :disable="loading"
        >
          <q-tooltip>Agregar Gasto</q-tooltip>
        </q-btn>
      </div>
    </q-form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { supabase } from 'boot/supabase'
import { useAuthStore } from 'stores/authStore'
import { useFinanceStore } from 'stores/financeStore'

const $q = useQuasar()
const authStore = useAuthStore()
const financeStore = useFinanceStore()

// Estados del formulario
const amount = ref(null)
const description = ref('')
const categoryId = ref(null)
const type = ref('Variable')
const loading = ref(false)
const loadingCategories = ref(false)

// Opciones de categorías cargadas desde Supabase
const categoryOptions = ref([])

// Opciones de tipo de gasto
const typeOptions = ['Fijo', 'Variable']

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

// Guarda un nuevo gasto en Supabase
const handleSubmit = async () => {
  if (!amount.value || !description.value || !categoryId.value || !type.value) return

  loading.value = true
  try {
    const { error } = await supabase
      .from('expenses')
      .insert([
        {
          user_id: authStore.user.id,
          amount: amount.value,
          description: description.value,
          category: categoryId.value,
          type: type.value
        }
      ])

    if (error) throw error

    // Recargar los gastos para actualizar el dashboard
    await financeStore.loadExpenses()

    $q.notify({
      type: 'positive',
      message: 'Gasto agregado correctamente',
      position: 'top',
      timeout: 2000
    })

    // Limpiar formulario
    amount.value = null
    description.value = ''
    type.value = 'Variable'
    // Mantener la categoría seleccionada
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

<style scoped lang="scss">
.expense-form-container {
  background: white;
  padding: 8px 12px;
  border-top: 1px solid #e0e0e0;
}

.expense-form {
  max-width: 1200px;
  margin: 0 auto;
}

.form-row {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 6px;
  }
}

.form-input {
  flex: 1;
  min-width: 80px;
}

.amount-input {
  max-width: 120px;

  @media (max-width: 768px) {
    max-width: 100px;
  }
}

.description-input {
  flex: 2;
  min-width: 150px;
}

.category-select {
  max-width: 150px;

  @media (max-width: 768px) {
    max-width: 120px;
  }
}

.type-select {
  max-width: 120px;

  @media (max-width: 768px) {
    max-width: 100px;
  }
}

.add-btn {
  min-width: 45px;
  height: 40px;
}
</style>