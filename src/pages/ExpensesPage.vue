<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md">
      <!-- Header -->
      <div class="col-12">
        <div class="text-h4 q-mb-md">
          <q-icon name="trending_down" color="negative" /> Gastos
        </div>
      </div>

      <!-- Total del Mes -->
      <div class="col-12">
        <q-card flat bordered class="bg-negative text-white">
          <q-card-section>
            <div class="text-subtitle2">Total de Gastos del Mes</div>
            <div class="text-h4 text-weight-bold">
              ${{ formatAmount(financeStore.currentMonthExpenses) }}
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Lista de Gastos -->
      <div class="col-12">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6 q-mb-md title-incomes">Historial de Gastos</div>
            
            <ul v-if="financeStore.expenses.length > 0" class="expenses-list">
              <li 
                v-for="expense in financeStore.expenses" 
                :key="expense.id"
                class="expense-item"
              >
                
                
                <div class="row q-mb-xs items-center">
                    <div class="col-auto q-mr-sm">
                        <q-chip 
                            :color="getCategoryColor(expense.category)" 
                            text-color="white" 
                            dense
                            size="sm"
                        >
                            {{ getCategoryName(expense.category) }}
                        </q-chip>
                    </div>
                    <div class="col">{{ expense.description }}</div>
                    <div class="col-auto text-negative text-weight-bold">
                        ${{ formatAmount(expense.amount) }}
                    </div>
                </div>
                
                <div class="expense-meta text-grey-7 row">
                  {{ expense.type }} • {{ formatDate(expense.created_at) }}
                </div>
                
                
              </li>
            </ul>

            <div v-else class="text-center text-grey-7 q-pa-md">
              No hay gastos registrados
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useFinanceStore } from 'stores/financeStore'
import { supabase } from 'boot/supabase'

const financeStore = useFinanceStore()
const categoryOptions = ref([])

// Formatea el monto con separador de miles
const formatAmount = (amount) => {
  const num = Math.round(Number(amount || 0))
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

// Formatea la fecha
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Obtiene el nombre de la categoría
const getCategoryName = (categoryId) => {
  const category = categoryOptions.value.find(c => c.id === categoryId)
  return category?.name || 'Sin categoría'
}

// Obtiene el color de la categoría
const getCategoryColor = (categoryId) => {
  const colors = ['primary', 'secondary', 'accent', 'warning', 'info', 'purple', 'orange']
  const index = categoryId ? categoryId % colors.length : 0
  return colors[index]
}

// Carga las categorías desde Supabase
const loadCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('category_expenses')
      .select('id, name')
      .order('name')

    if (error) throw error
    categoryOptions.value = data || []
  } catch (error) {
    console.error('Error al cargar categorías:', error)
  }
}

// Carga los datos al montar
onMounted(async () => {
  await loadCategories()
  await financeStore.loadExpenses()
})
</script>