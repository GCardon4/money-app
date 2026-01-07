<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md">
      <!-- Header -->
      <div class="col-12">
        <div class="row items-center justify-between">
          <div class="text-h4">
            <q-icon name="event" color="primary" /> Compromisos Mensuales
          </div>
          <q-btn
            color="primary"
            icon="add"
            label="Nuevo Compromiso"
            @click="showDialog = true"
          />
        </div>
      </div>

      <!-- Estadísticas rápidas -->
      <div class="col-12 col-sm-6">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle2 text-grey-7">Total Mensual</div>
            <div class="text-h5 text-primary text-weight-bold">
              ${{ formatAmount(totalMonthly) }}
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle2 text-grey-7">Compromisos Activos</div>
            <div class="text-h5 text-primary text-weight-bold">
              {{ activeCommitments.length }}
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Lista de Compromisos -->
      <div class="col-12">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-h6 q-mb-md">Listado de Compromisos</div>
            
            <q-list separator v-if="financeStore.commitments.length > 0">
              <q-item v-for="commitment in financeStore.commitments" :key="commitment.id">
                <q-item-section avatar>
                  <q-avatar 
                    :color="commitment.status === 'active' ? 'primary' : 'grey'" 
                    text-color="white" 
                    icon="event"
                  />
                </q-item-section>

                <q-item-section>
                  <q-item-label>{{ commitment.name }}</q-item-label>
                  <q-item-label caption>
                    {{ commitment.description }}
                  </q-item-label>
                  <q-item-label caption>
                    Día {{ commitment.payment_day }} • {{ commitment.pay_method }}
                  </q-item-label>
                </q-item-section>

                <q-item-section side>
                  <div class="column items-end">
                    <q-item-label class="text-primary text-weight-bold">
                      ${{ formatAmount(commitment.amount) }}
                    </q-item-label>
                    <q-badge 
                      :color="commitment.status === 'active' ? 'positive' : 'grey'" 
                      :label="commitment.status === 'active' ? 'Activo' : 'Inactivo'"
                    />
                  </div>
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
                      @click="editCommitment(commitment)"
                    >
                      <q-tooltip>Editar</q-tooltip>
                    </q-btn>
                    <q-btn
                      flat
                      dense
                      round
                      :icon="commitment.status === 'active' ? 'pause' : 'play_arrow'"
                      :color="commitment.status === 'active' ? 'warning' : 'positive'"
                      size="sm"
                      @click="toggleStatus(commitment)"
                    >
                      <q-tooltip>{{ commitment.status === 'active' ? 'Desactivar' : 'Activar' }}</q-tooltip>
                    </q-btn>
                    <q-btn
                      flat
                      dense
                      round
                      icon="delete"
                      color="negative"
                      size="sm"
                      @click="confirmDelete(commitment)"
                    >
                      <q-tooltip>Eliminar</q-tooltip>
                    </q-btn>
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
      <q-card style="min-width: 400px">
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
              hint="Día del mes (1-31)"
            />

            <q-select
              v-model="form.pay_method"
              :options="payMethodOptions"
              label="Método de Pago"
              outlined
              :rules="[val => !!val || 'Requerido']"
              class="q-mb-md"
            />

            <q-toggle
              v-model="form.status"
              label="Activo"
              color="positive"
              true-value="active"
              false-value="inactive"
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

const $q = useQuasar()
const authStore = useAuthStore()
const financeStore = useFinanceStore()

// Estados
const showDialog = ref(false)
const editMode = ref(false)
const loading = ref(false)

// Opciones de método de pago
const payMethodOptions = ['Efectivo', 'Banco']

// Formulario
const form = ref({
  id: null,
  name: '',
  description: '',
  amount: null,
  payment_day: 1,
  pay_method: 'Banco',
  status: 'active'
})

// Compromisos activos
const activeCommitments = computed(() => {
  return financeStore.commitments.filter(c => c.status === 'active')
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

// Guarda o actualiza un compromiso
const saveCommitment = async () => {
  loading.value = true
  try {
    const commitmentData = {
      user_id: authStore.user.id,
      name: form.value.name,
      description: form.value.description,
      amount: form.value.amount,
      payment_day: form.value.payment_day,
      pay_method: form.value.pay_method,
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
    payment_day: commitment.payment_day,
    pay_method: commitment.pay_method,
    status: commitment.status
  }
  showDialog.value = true
}

// Alterna el estado activo/inactivo
const toggleStatus = async (commitment) => {
  try {
    const newStatus = commitment.status === 'active' ? 'inactive' : 'active'
    
    const { error } = await supabase
      .from('commitments')
      .update({ status: newStatus })
      .eq('id', commitment.id)

    if (error) throw error

    await financeStore.loadCommitments()

    $q.notify({
      type: 'info',
      message: `Compromiso ${newStatus === 'active' ? 'activado' : 'desactivado'}`,
      position: 'top'
    })
  } catch (error) {
    console.error('Error al cambiar estado:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al cambiar el estado',
      position: 'top'
    })
  }
}

// Confirma la eliminación de un compromiso
const confirmDelete = (commitment) => {
  $q.dialog({
    title: 'Confirmar',
    message: '¿Estás seguro de eliminar este compromiso?',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await deleteCommitment(commitment.id)
  })
}

// Elimina un compromiso
const deleteCommitment = async (id) => {
  try {
    const { error } = await supabase
      .from('commitments')
      .delete()
      .eq('id', id)

    if (error) throw error

    await financeStore.loadCommitments()

    $q.notify({
      type: 'positive',
      message: 'Compromiso eliminado',
      position: 'top'
    })
  } catch (error) {
    console.error('Error al eliminar compromiso:', error)
    $q.notify({
      type: 'negative',
      message: 'Error al eliminar el compromiso',
      position: 'top'
    })
  }
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
    pay_method: 'Banco',
    status: 'active'
  }
}

// Carga los datos al montar
onMounted(async () => {
  await financeStore.loadCommitments()
})
</script>
