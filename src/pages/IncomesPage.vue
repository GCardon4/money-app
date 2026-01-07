<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md">
      <!-- Header -->
      <div class="col-12">
        <div class="row ">
          <div class="text-h5 text-weight-bold">
            <q-icon name="trending_up" color="positive" dense /> Ingresos 
                <q-btn
                    color="positive"
                    icon="add"
                    dense
                    label="Nuevo Ingreso"
                    @click="showDialog = true"
                />
            </div>
          </div>

      </div>

      <!-- Estadísticas rápidas -->
      <div class="col-12 col-sm-6">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle2 text-grey-7">Total del Mes</div>
            <div class="text-h5 text-positive text-weight-bold">
              ${{ formatAmount(financeStore.currentMonthIncomes) }}
            </div>
            <div class="text-caption">
                Ingresos =
                {{ financeStore.incomes.length }}
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Lista de Ingresos -->
      <div class="col-12">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6 q-mb-md">Historial de Ingresos</div>
            
            <q-list separator v-if="financeStore.incomes.length > 0">
              <q-item v-for="income in financeStore.incomes" :key="income.id">

                <q-item-section>
                  <q-item-label>{{ income.description }}</q-item-label>
                  <q-item-label caption>
                    {{ getSourceName(income.source) }} • {{ income.pay_method }}
                  </q-item-label>
                  <q-item-label caption>
                    {{ formatDate(income.created_at) }}
                  </q-item-label>
                </q-item-section>

                <q-item-section side>
                  <q-item-label class="text-positive text-weight-bold">
                    ${{ formatAmount(income.amount) }}
                  </q-item-label>
                </q-item-section>

                <q-item-section side>
                  <div class="row q-gutter-xs">
                    <q-btn
                      flat
                      dense
                      round
                      icon="edit"
                      color="primary"
                      size="sm"
                      @click="editIncome(income)"
                    >
                      <q-tooltip>Editar</q-tooltip>
                    </q-btn>

                  </div>
                </q-item-section>
              </q-item>
            </q-list>

            <div v-else class="text-center text-grey-7 q-pa-md">
              No hay ingresos registrados
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Dialog para Agregar/Editar Ingreso -->
    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ editMode ? 'Editar' : 'Nuevo' }} Ingreso</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit.prevent="saveIncome">
            <q-input
              v-model.number="form.amount"
              type="number"
              label="Monto"
              prefix="$"
              outlined
              :rules="[val => !!val && val > 0 || 'Requerido']"
              class="q-mb-md"
              step="0.01"
            />

            <q-input
              v-model="form.description"
              label="Descripción"
              outlined
              :rules="[val => !!val || 'Requerido']"
              class="q-mb-md"
              maxlength="100"
            />

            <q-select
              v-model="form.source"
              :options="sourceOptions"
              option-value="id"
              option-label="name"
              emit-value
              map-options
              label="Fuente de Ingreso"
              outlined
              :rules="[val => !!val || 'Requerido']"
              class="q-mb-md"
              :loading="loadingSources"
            />

            <q-select
              v-model="form.pay_method"
              :options="payMethodOptions"
              label="Método de Pago"
              outlined
              :rules="[val => !!val || 'Requerido']"
              class="q-mb-md"
            />

            <div class="row q-gutter-sm justify-end">
              <q-btn
                flat
                label="Cancelar"
                color="grey"
                @click="closeDialog"
                :disable="loading"
              />
              <q-btn
                type="submit"
                label="Guardar"
                color="positive"
                :loading="loading"
                :disable="loading"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
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

// Estados
const showDialog = ref(false)
const editMode = ref(false)
const loading = ref(false)
const loadingSources = ref(false)
const sourceOptions = ref([])

// Opciones de método de pago
const payMethodOptions = ['Efectivo', 'Banco']

// Formulario
const form = ref({
  id: null,
  amount: null,
  description: '',
  source: null,
  pay_method: 'Efectivo'
})

// Formatea el monto con separador de miles
const formatAmount = (amount) => {
  const num = Math.round(Number(amount || 0))
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

// Formatea la fecha
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Obtiene el nombre de la fuente de ingreso
const getSourceName = (sourceId) => {
  const source = sourceOptions.value.find(s => s.id === sourceId)
  return source?.name || 'N/A'
}

// Carga las fuentes de ingreso desde Supabase
const loadSources = async () => {
  loadingSources.value = true
  try {
    const { data, error } = await supabase
      .from('source_incomes')
      .select('id, name')
      .order('name')

    if (error) throw error
    
    sourceOptions.value = data || []
    
    if (sourceOptions.value.length > 0 && !form.value.source) {
      form.value.source = sourceOptions.value[0].id
    }
  } catch (error) {
    console.error('Error al cargar fuentes:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al cargar fuentes de ingreso',
      position: 'top'
    })
  } finally {
    loadingSources.value = false
  }
}

// Guarda o actualiza un ingreso
const saveIncome = async () => {
  loading.value = true
  try {
    const incomeData = {
      user_id: authStore.user.id,
      amount: form.value.amount,
      description: form.value.description,
      source: form.value.source,
      pay_method: form.value.pay_method
    }

    let error

    if (editMode.value) {
      // Actualizar
      const result = await supabase
        .from('incomes')
        .update(incomeData)
        .eq('id', form.value.id)
      error = result.error
    } else {
      // Crear
      const result = await supabase
        .from('incomes')
        .insert([incomeData])
      error = result.error
    }

    if (error) throw error

    await financeStore.loadIncomes()

    $q.notify({
      type: 'positive',
      message: editMode.value ? 'Ingreso actualizado' : 'Ingreso agregado',
      position: 'top'
    })

    closeDialog()
  } catch (error) {
    console.error('Error al guardar ingreso:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al guardar el ingreso',
      position: 'top'
    })
  } finally {
    loading.value = false
  }
}

// Edita un ingreso existente
const editIncome = (income) => {
  editMode.value = true
  form.value = {
    id: income.id,
    amount: income.amount,
    description: income.description,
    source: income.source,
    pay_method: income.pay_method
  }
  showDialog.value = true
}


// Cierra el diálogo y resetea el formulario
const closeDialog = () => {
  showDialog.value = false
  editMode.value = false
  form.value = {
    id: null,
    amount: null,
    description: '',
    source: sourceOptions.value[0]?.id || null,
    pay_method: 'Efectivo'
  }
}

// Carga los datos al montar
onMounted(async () => {
  await loadSources()
  await financeStore.loadIncomes()
})
</script>
