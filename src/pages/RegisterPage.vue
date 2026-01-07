<template>
  <div class="flex flex-center bg-gradient">
    <q-card class="register-card q-pa-md" flat bordered>
      <q-card-section class="text-center">
        <div class="text-h4 text-weight-bold text-primary q-mb-xs">
          Crear Cuenta
        </div>
        <div class="text-subtitle2 text-grey-7">
          Únete a Money App
        </div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="handleRegister" class="q-gutter-md">
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

          <!-- Campo de Confirmar Contraseña -->
          <q-input
            v-model="confirmPassword"
            label="Confirmar contraseña"
            :type="showConfirmPassword ? 'text' : 'password'"
            outlined
            :rules="[
              val => !!val || 'Confirma tu contraseña',
              val => val === password || 'Las contraseñas no coinciden'
            ]"
            lazy-rules
            :disable="authStore.loading"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
            <template v-slot:append>
              <q-icon
                :name="showConfirmPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showConfirmPassword = !showConfirmPassword"
              />
            </template>
          </q-input>

          <!-- Botón de Registro -->
          <q-btn
            type="submit"
            label="Registrarse"
            color="primary"
            class="full-width"
            size="lg"
            :loading="authStore.loading"
            :disable="authStore.loading"
          />

          <!-- Enlace a Login -->
          <div class="text-center q-mt-md">
            <span class="text-grey-7">¿Ya tienes cuenta?</span>
            <q-btn
              flat
              dense
              color="primary"
              label="Inicia Sesión"
              @click="goToLogin"
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
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// Maneja el envío del formulario de registro
const handleRegister = async () => {
  if (password.value !== confirmPassword.value) {
    return
  }

  const result = await authStore.register(email.value, password.value)
  
  if (result.success) {
    // Después del registro exitoso, redirige al login
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  }
}

// Navega a la página de login
const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped lang="scss">
.bg-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.register-card {
  width: 100%;
  max-width: 450px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

@media (max-width: 600px) {
  .register-card {
    margin: 16px;
  }
}
</style>
