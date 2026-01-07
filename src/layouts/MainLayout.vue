<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          <q-icon name="account_balance_wallet" color="white" /> Money App
        </q-toolbar-title>

        <q-btn
          flat
          dense
          round
          icon="logout"
          @click="handleLogout"
        >
          <q-tooltip>Cerrar Sesión</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
    >
      <q-list>
        <q-item-label header class="text-grey-8">
          Navegación
        </q-item-label>

        <q-item
          clickable
          v-ripple
          :to="{ name: 'dashboard' }"
          exact
        >
          <q-item-section avatar>
            <q-icon name="dashboard" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Dashboard</q-item-label>
          </q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          :to="{ name: 'incomes' }"
        >
          <q-item-section avatar>
            <q-icon name="trending_up" color="positive" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Ingresos</q-item-label>
          </q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          :to="{ name: 'expenses' }"
        >
          <q-item-section avatar>
            <q-icon name="trending_down" color="negative" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Gastos</q-item-label>
          </q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          :to="{ name: 'debts' }"
        >
          <q-item-section avatar>
            <q-icon name="credit_card" color="warning" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Deudas</q-item-label>
          </q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          :to="{ name: 'commitments' }"
        >
          <q-item-section avatar>
            <q-icon name="event" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Compromisos</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator class="q-my-md" />

        <q-item-label header class="text-grey-8">
          Usuario
        </q-item-label>

        <q-item>
          <q-item-section avatar>
            <q-avatar color="primary" text-color="white" icon="person" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ userEmail }}</q-item-label>
            <q-item-label caption>{{ userName }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <!-- Footer con formulario de gastos rápidos -->
    <q-footer elevated class="bg-white text-dark">
      <ExpensesForm />
    </q-footer>
  </q-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'stores/authStore'
import ExpensesForm from 'components/ExpensesForm.vue'

const router = useRouter()
const authStore = useAuthStore()

const leftDrawerOpen = ref(false)

// Alternar el drawer
const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

// Obtiene el email del usuario
const userEmail = computed(() => {
  return authStore.user?.email || ''
})

// Obtiene el nombre del usuario
const userName = computed(() => {
  if (authStore.profile?.full_name) {
    return authStore.profile.full_name
  }
  return 'Usuario'
})

// Maneja el cierre de sesión
const handleLogout = async () => {
  const result = await authStore.logout()
  if (result.success) {
    router.push('/login')
  }
}
</script>
