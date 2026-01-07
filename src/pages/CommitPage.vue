<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md">
      <!-- Header -->
      <div class="col-12">

        <div class="row justify-between align-center">
          <div class="text-h5 text-weight-bold col-md-4">
            <q-icon name="event" color="positive" dense /> Compromisos 
          </div>

            <div class="col-md-6 text-right">
                <q-btn
                color="primary"
                icon="add"
                label="Nuevo "
                @click="showDialog = true"
            />
            </div>
          </div>
          
      </div>

      <!-- Estadísticas rápidas -->
      <div class="col-12 col-sm-6">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle2 text-grey-7">Total Mensual /
                <span class="text-right">
                     {{ activeCommitments.length }}
                </span>
            </div>
            <div class="text-h5 text-primary text-weight-bold">
              ${{ formatAmount(totalMonthly) }}
            </div>
          </q-card-section>
        </q-card>
      </div>


      <!-- Lista de Compromisos -->
      <div class="col-12">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6 q-mb-md title-incomes">Listado de Compromisos</div>
            
            <q-list separator v-if="financeStore.commitments.length > 0">
              <q-item 
                v-for="commitment in financeStore.commitments" 
                :key="commitment.id"
                clickable
                v-ripple
                @click="editCommitment(commitment)"
              >
                <q-item-section>
                  <q-item-label class="text-weight-bold">{{ commitment.name }}</q-item-label>
                  <q-item-label caption>
                    {{ commitment.description }}
                  </q-item-label>
                  <q-item-label caption>
                    Día {{ formatPayDate(commitment.pay_date) }}
                  </q-item-label>
                </q-item-section>

                <q-item-section side>
                  <div class="column items-end">
                    <q-item-label class="text-primary text-weight-bold">
                      ${{ formatAmount(commitment.amount) }}
                    </q-item-label>
                    <q-badge 
                      :color="commitment.status ? 'positive' : 'grey'" 
                      :label="commitment.status ? 'Activo' : 'Inactivo'"
                    />
                  </div>
                </q-item-section>
              </q-item>
            </q-list>

            <div v-else class="text-center text-grey-7 q-pa-md">
              No hay compromisos registrados
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Dialog para Agregar/Editar Compromiso -->
    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">{{ editMode ? 'Editar' : 'Nuevo' }} Compromiso</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-form @submit.prevent="saveCommitment">
            <q-input
              v-model="form.name"
              label="Nombre del Compromiso"
              outlined
              :rules="[val => !!val || 'Requerido']"
              class="q-mb-md"
              maxlength="50"
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

            <q-input
              v-model.number="form.amount"
              type="number"
              label="Monto Mensual"
              prefix="$"
              outlined
              :rules="[val => !!val && val > 0 || 'Requerido']"
              class="q-mb-md"
              step="0.01"
            />

            <q-input
              v-model.number="form.payment_day"
              type="number"
              label="Día de Pago"
              outlined
              :rules="[
                val => !!val || 'Requerido',
                val => val >= 1 && val <= 31 || 'Entre 1 y 31'
              ]"
              class="q-mb-md"
              min="1"
              max="31"
              hint="Día del mes para el pago (1-31)"
            />

            <q-toggle
              v-model="form.status"
              label="Activo"
              color="positive"
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
                color="primary"
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
import { ref, onMounted, computed } from 'vue'
import { useQuasar } from 'quasar'
import { supabase } from 'boot/supabase'
import { useAuthStore } from 'stores/authStore'
import { useFinanceStore } from 'stores/financeStore'
import { scheduleCommitmentNotifications } from 'src/utils/notifications'

const $q = useQuasar()
const authStore = useAuthStore()
const financeStore = useFinanceStore()

// Estados
const showDialog = ref(false)
const editMode = ref(false)
const loading = ref(false)

// Formulario
const form = ref({
  id: null,
  name: '',
  description: '',
  amount: null,
  payment_day: 1,
  status: true
})

// Compromisos activos
const activeCommitments = computed(() => {
  return financeStore.commitments.filter(c => c.status === true)
})

// Total mensual de compromisos activos
const totalMonthly = computed(() => {
  return activeCommitments.value.reduce((sum, c) => sum + Number(c.amount), 0)
})

// Formatea el monto con separador de miles
const formatAmount = (amount) => {
  const num = Math.round(Number(amount || 0))
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

// Formatea la fecha de pago para mostrar solo el día
const formatPayDate = (dateString) => {
  if (!dateString) return 'Sin fecha'
  // Extraer el día directamente del string de fecha (formato YYYY-MM-DD)
  const dateParts = dateString.split('T')[0].split('-')
  return parseInt(dateParts[2], 10)
}

// Guarda o actualiza un compromiso
const saveCommitment = async () => {
  loading.value = true
  try {
    // Construir fecha con el día especificado del mes actual
    const today = new Date()
    const payDate = new Date(today.getFullYear(), today.getMonth(), form.value.payment_day)
    
    const commitmentData = {
      user_id: authStore.user.id,
      name: form.value.name,
      description: form.value.description,
      amount: form.value.amount,
      pay_date: payDate.toISOString(),
      status: form.value.status
    }

    let error

    if (editMode.value) {
      // Actualizar
      const result = await supabase
        .from('commitments')
        .update(commitmentData)
        .eq('id', form.value.id)
      error = result.error
    } else {
      // Crear
      const result = await supabase
        .from('commitments')
        .insert([commitmentData])
      error = result.error
    }

    if (error) throw error

    await financeStore.loadCommitments()

    // Programar notificaciones para el compromiso
    if (form.value.status) {
      const commitmentData = {
        ...form.value,
        id: editMode.value ? form.value.id : null,
        pay_date: payDate.toISOString()
      }
      await scheduleCommitmentNotifications(commitmentData)
    }

    $q.notify({
      type: 'positive',
      message: editMode.value ? 'Compromiso actualizado' : 'Compromiso agregado',
      position: 'top'
    })

    closeDialog()
  } catch (error) {
    console.error('Error al guardar compromiso:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al guardar el compromiso',
      position: 'top'
    })
  } finally {
    loading.value = false
  }
}

// Edita un compromiso existente
const editCommitment = (commitment) => {
  editMode.value = true
  form.value = {
    id: commitment.id,
    name: commitment.name,
    description: commitment.description || '',
    amount: commitment.amount,
    payment_day: formatPayDate(commitment.pay_date),
    status: commitment.status
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
    description: '',
    amount: null,
    payment_day: 1,
    status: true
  }
}

// Carga los datos al montar
onMounted(async () => {
  await financeStore.loadCommitments()
})
</script>
