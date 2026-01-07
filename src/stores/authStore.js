import { defineStore } from 'pinia'
import { supabase } from 'boot/supabase'
import { Notify } from 'quasar'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    profile: null,
    loading: false,
    session: null
  }),

  getters: {
    // Verifica si el usuario está autenticado
    isAuthenticated: (state) => !!state.user,
    // Obtiene los datos del usuario actual
    currentUser: (state) => state.user,
    // Obtiene el perfil del usuario
    userProfile: (state) => state.profile
  },

  actions: {
    // Inicializa la sesión del usuario
    async initializeAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          this.session = session
          this.user = session.user
          await this.loadUserProfile()
        }
        
        // Escucha cambios en la autenticación
        supabase.auth.onAuthStateChange(async (event, session) => {
          this.session = session
          this.user = session?.user || null
          
          if (session?.user) {
            await this.loadUserProfile()
          } else {
            this.profile = null
          }
        })
      } catch (error) {
        console.error('Error inicializando autenticación:', error)
      }
    },

    // Carga el perfil del usuario desde la base de datos
    async loadUserProfile() {
      if (!this.user) return

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', this.user.id)
          .single()

        if (error) throw error
        this.profile = data
      } catch (error) {
        console.error('Error cargando perfil:', error)
      }
    },

    // Inicia sesión con email y contraseña
    async login(email, password) {
      this.loading = true
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (error) throw error

        this.user = data.user
        this.session = data.session
        await this.loadUserProfile()

        Notify.create({
          type: 'positive',
          message: 'Inicio de sesión exitoso',
          position: 'top'
        })

        return { success: true, data }
      } catch (error) {
        console.error('Error en login:', error)
        Notify.create({
          type: 'negative',
          message: error.message || 'Error al iniciar sesión',
          position: 'top'
        })
        return { success: false, error }
      } finally {
        this.loading = false
      }
    },

    // Registra un nuevo usuario
    async register(email, password, userData = {}) {
      this.loading = true
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: userData
          }
        })

        if (error) throw error

        Notify.create({
          type: 'positive',
          message: 'Registro exitoso. Revisa tu email para confirmar tu cuenta.',
          position: 'top'
        })

        return { success: true, data }
      } catch (error) {
        console.error('Error en registro:', error)
        Notify.create({
          type: 'negative',
          message: error.message || 'Error al registrar usuario',
          position: 'top'
        })
        return { success: false, error }
      } finally {
        this.loading = false
      }
    },

    // Cierra la sesión del usuario
    async logout() {
      this.loading = true
      try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error

        this.user = null
        this.profile = null
        this.session = null

        Notify.create({
          type: 'info',
          message: 'Sesión cerrada correctamente',
          position: 'top'
        })

        return { success: true }
      } catch (error) {
        console.error('Error en logout:', error)
        Notify.create({
          type: 'negative',
          message: error.message || 'Error al cerrar sesión',
          position: 'top'
        })
        return { success: false, error }
      } finally {
        this.loading = false
      }
    }
  }
})
