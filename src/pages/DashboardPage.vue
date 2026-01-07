<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md">
      <!-- Bienvenida -->
      <div class="col-12">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h5 text-weight-bold">
              ¡Bienvenido, {{ userName }}! 👋
            </div>
            <div class="text-subtitle2 text-grey-7">
              Panel de Control de Finanzas
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Estadísticas rápidas -->
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="bg-positive text-white">
          <q-card-section>
            <div class="text-h6">Ingresos</div>
            <div class="text-h4 text-weight-bold">${{ formatAmount(financeStore.currentMonthIncomes) }}</div>
            <div class="text-caption">Este mes</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="bg-negative text-white">
          <q-card-section>
            <div class="text-h6">Gastos</div>
            <div class="text-h4 text-weight-bold">${{ formatAmount(financeStore.currentMonthExpenses) }}</div>
            <div class="text-caption">Este mes</div>
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

// Carga los datos al montar el componente
onMounted(() => {
  financeStore.loadAllData()
})
</script>
