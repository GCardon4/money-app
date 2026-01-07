<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md">
      <!-- Bienvenida -->
      <div class="col-12">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6 text-weight-bold">
              ¡Hola, {{ userName }}!
            </div>
            <div class="text-subtitle2 text-grey-7">
              Panel de Control de Finanzas
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Estadísticas rápidas -->
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="bg-positive text-white cursor-pointer" @click="$router.push('/incomes')">
          <q-card-section>
            <div class="text-h6">Ingresos</div>
            <div class="text-h4 text-weight-bold">${{ formatAmount(financeStore.currentMonthIncomes) }}</div>
            <div class="text-caption">Este mes - Ver detalle</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="bg-negative text-white cursor-pointer" @click="$router.push('/expenses')">
          <q-card-section>
            <div class="text-h6">Gastos</div>
            <div class="text-h4 text-weight-bold">${{ formatAmount(financeStore.currentMonthExpenses) }}</div>
            <div class="text-caption">Este mes - Ver detalle</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="bg-primary text-white">
          <q-card-section>
            <div class="text-h6">Balance</div>
            <div class="text-h4 text-weight-bold">${{ formatAmount(financeStore.currentMonthBalance) }}</div>
            <div class="text-caption">Este mes</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="bg-warning text-white">
          <q-card-section>
            <div class="text-h6">Deudas</div>
            <div class="text-h4 text-weight-bold">${{ formatAmount(financeStore.totalDebts) }}</div>
            <div class="text-caption">Total pendiente</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Acciones rápidas -->
      <div class="col-12">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6 q-mb-md">Acciones Rápidas</div>
            <div class="row q-col-gutter-sm">
              <div class="col-6 col-sm-3">
                <q-btn
                  unelevated
                  color="positive"
                  icon="add"
                  label="Ingreso"
                  class="full-width"
                  @click="$router.push('/incomes')"
                />
              </div>
              <div class="col-6 col-sm-3">
                <q-btn
                  unelevated
                  color="negative"
                  icon="remove"
                  label="Gasto"
                  class="full-width"
                  @click="$router.push('/expenses')"
                />
              </div>
              <div class="col-6 col-sm-3">
                <q-btn
                  unelevated
                  color="warning"
                  icon="credit_card"
                  label="Deuda"
                  class="full-width"
                  @click="$router.push('/debts')"
                />
              </div>
              <div class="col-6 col-sm-3">
                <q-btn
                  unelevated
                  color="primary"
                  icon="event"
                  label="Compromisos"
                  class="full-width"
                  @click="$router.push('/commitments')"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Gastos por Categorías -->
      <div class="col-12">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6 q-mb-md">Gastos Mes / Categoría</div>
            
            <div v-if="expensesByCategory.length === 0" class="text-center text-grey-6 q-py-md">
              <q-icon name="inbox" size="48px" class="q-mb-sm" />
              <div>No hay gastos este mes</div>
            </div>

            <q-list v-else separator>
              <q-item v-for="category in expensesByCategory" :key="category.name" class="q-py-md">
                <q-item-section>
                  <q-item-label class="text-weight-bold">{{ category.name }}</q-item-label>
                  <q-item-label caption>{{ category.count }} {{ category.count === 1 ? 'gasto' : 'gastos' }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-item-label class="text-h6 text-weight-bold text-negative">
                    ${{ formatAmount(category.total) }}
                  </q-item-label>
                  <q-item-label caption class="text-right">
                    {{ category.percentage }}%
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useAuthStore } from 'stores/authStore'
import { useFinanceStore } from 'stores/financeStore'

const authStore = useAuthStore()
const financeStore = useFinanceStore()

// Obtiene el nombre del usuario o email
const userName = computed(() => {
  if (authStore.profile?.full_name) {
    return authStore.profile.full_name
  }
  return authStore.user?.email?.split('@')[0] || 'Usuario'
})

// Formatea el monto con separador de miles (punto) sin decimales
const formatAmount = (amount) => {
  const num = Math.round(Number(amount || 0))
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

// Calcula gastos agrupados por categoría del mes actual
const expensesByCategory = computed(() => {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  // Filtra gastos del mes actual
  const currentMonthExpenses = financeStore.expenses.filter(expense => {
    const date = new Date(expense.created_at)
    return date >= firstDay && date <= lastDay
  })

  // Agrupa por categoría
  const categoryMap = {}
  currentMonthExpenses.forEach(expense => {
    const categoryName = expense.category_expenses?.name || 'Sin Categoría'
    
    if (!categoryMap[categoryName]) {
      categoryMap[categoryName] = {
        name: categoryName,
        total: 0,
        count: 0,
        color: getCategoryColor(categoryName)
      }
    }
    categoryMap[categoryName].total += Number(expense.amount)
    categoryMap[categoryName].count += 1
  })

  // Convierte a array y ordena por total descendente
  const categories = Object.values(categoryMap)
  categories.sort((a, b) => b.total - a.total)

  // Calcula porcentajes
  const totalExpenses = financeStore.currentMonthExpenses
  categories.forEach(category => {
    category.percentage = totalExpenses > 0 
      ? ((category.total / totalExpenses) * 100).toFixed(1)
      : 0
  })

  return categories
})

// Asigna colores a las categorías
const getCategoryColor = (categoryName) => {
  const colors = {
    'Alimentación': 'orange',
    'Transporte': 'blue',
    'Salud': 'red',
    'Educación': 'purple',
    'Entretenimiento': 'pink',
    'Servicios': 'teal',
    'Vivienda': 'brown',
    'Ropa': 'indigo',
    'Otros': 'grey'
  }
  return colors[categoryName] || 'primary'
}

// Carga los datos al montar el componente
onMounted(() => {
  financeStore.loadAllData()
})
</script>
