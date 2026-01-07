<template>
  <div class="flex flex-center bg-gradient">
    <q-card class="login-card q-pa-md" flat bordered>
      <q-card-section class="text-center">
        <div class="text-h4 text-weight-bold text-primary q-mb-xs">
          Money App
        </div>
        <div class="text-subtitle2 text-grey-7">
          Control de tus finanzas personales
        </div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="handleLogin" class="q-gutter-md">
          <!-- Campo de Email -->
          <q-input
            v-model="email"
            label="Correo electrónico"
            type="email"
            outlined
            :rules="[
              val => !!val || 'El email es requerido',
              val => /.+@.+\..+/.test(val) || 'Email inválido'
            ]"
            lazy-rules
            :disable="authStore.loading"
          >
            <template v-slot:prepend>
              <q-icon name="email" />
            </template>
          </q-input>

          <!-- Campo de Contraseña -->
          <q-input
            v-model="password"
            label="Contraseña"
            :type="showPassword ? 'text' : 'password'"
            outlined
            :rules="[
              val => !!val || 'La contraseña es requerida',
              val => val.length >= 6 || 'Mínimo 6 caracteres'
            ]"
            lazy-rules
            :disable="authStore.loading"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
            <template v-slot:append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>

          <!-- Botón de Login -->
          <q-btn
            type="submit"
            label="Iniciar Sesión"
            color="primary"
            class="full-width"
            size="lg"
            :loading="authStore.loading"
            :disable="authStore.loading"
          />

          <!-- Enlace a Registro -->
          <div class="text-center q-mt-md">
            <span class="text-grey-7">¿No tienes cuenta?</span>
            <q-btn
              flat
              dense
              color="primary"
              label="Regístrate"
              @click="goToRegister"
              :disable="authStore.loading"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

// Estados del formulario
const email = ref('')
const password = ref('')
const showPassword = ref(false)

// Maneja el envío del formulario de login
const handleLogin = async () => {
  const result = await authStore.login(email.value, password.value)
  
  if (result.success) {
    router.push('/dashboard')
  }
}

// Navega a la página de registro
const goToRegister = () => {
  router.push('/register')
}
</script>