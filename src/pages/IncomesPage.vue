<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md">
        
      <!-- Header -->
      <div class="col-12">

        <div class="row justify-between align-center">
          <div class="text-h5 text-weight-bold col-md-4">
            <q-icon name="trending_up" color="positive" dense /> Ingresos 
          </div>

            <div class="col-md-6 text-right">
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
            <div class="text-h6 text-weight-bold q-mb-md title-incomes">Historial de Ingresos</div>
            
            <q-list separator v-if="financeStore.incomes.length > 0">
              <q-item 
                v-for="income in financeStore.incomes" 
                :key="income.id"
                clickable
                v-ripple
                @click="editIncome(income)"
                class="income-item"
              >
                <q-item-section>
                  <div class="row justify-between q-mb-xs">
                    <div class="text-h6">{{ income.name }}</div>
                    <div class="text-positive text-weight-bold text-h6 text-right">
                        ${{ formatAmount(income.amount) }}
                    </div>
                  </div>
                  <q-item-label caption class="text-grey-7">
                    {{ formatDate(income.created_at) }}
                  </q-item-label>
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
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">{{ editMode ? 'Editar' : 'Nuevo' }} Ingreso</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit.prevent="saveIncome">
            <q-input
              v-model="form.name"
              label="Nombre del Cliente"
              outlined
              :rules="[val => !!val || 'Requerido']"
              class="q-mb-md"
              maxlength="100"
            />

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
              type="textarea"
              rows="2"
              class="q-mb-md"
              maxlength="200"
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

// Formulario
const form = ref({
  id: null,
  name: '',
  amount: null,
  description: '',
  source: null
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
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
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
      name: form.value.name,
      amount: form.value.amount,
      description: form.value.description,
      source: form.value.source
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
    name: income.name,
    amount: income.amount,
    description: income.description,
    source: income.source
  }
  showDialog.value = true
}


// Cierra el diálogo y resetea el formulario
const closeDialog = () => {
  showDialog.value = false
  editMode.value = false
  form.value = {
    id: null,
    name: '',
    amount: null,
    description: '',
    source: sourceOptions.value[0]?.id || null
  }
}

// Carga los datos al montar
onMounted(async () => {
  await loadSources()
  await financeStore.loadIncomes()
})
</script>
