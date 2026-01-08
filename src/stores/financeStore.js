import { defineStore } from 'pinia'
import { supabase } from 'boot/supabase'
import { useAuthStore } from './authStore'
import { useSyncStore } from './syncStore'

export const useFinanceStore = defineStore('finance', {
  state: () => ({
    expenses: [],
    incomes: [],
    debts: [],
    commitments: [],
    loading: false
  }),

  getters: {
    // Calcula el total de gastos del mes actual
    currentMonthExpenses: (state) => {
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      
      return state.expenses
        .filter(expense => {
          const date = new Date(expense.created_at)
          return date >= firstDay && date <= lastDay
        })
        .reduce((sum, expense) => sum + Number(expense.amount), 0)
    },

    // Calcula el total de ingresos del mes actual
    currentMonthIncomes: (state) => {
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      
      return state.incomes
        .filter(income => {
          const date = new Date(income.created_at)
          return date >= firstDay && date <= lastDay
        })
        .reduce((sum, income) => sum + Number(income.amount), 0)
    },

    // Calcula el balance del mes actual
    currentMonthBalance: (state) => {
      return state.currentMonthIncomes - state.currentMonthExpenses
    },

    // Calcula el total de deudas pendientes
    totalDebts: (state) => {
      return state.debts
        .filter(debt => debt.status !== 'paid')
        .reduce((sum, debt) => sum + Number(debt.amount), 0)
    },

    // Calcula el total de compromisos activos mensuales
    totalMonthlyCommitments: (state) => {
      return state.commitments
        .filter(commitment => commitment.status)
        .reduce((sum, commitment) => sum + Number(commitment.amount), 0)
    },

    // Calcula cuánto se ha pagado de cada compromiso en el mes actual
    commitmentsProgress: (state) => {
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      // Filtra gastos del mes actual que tengan commitment_id
      const commitmentExpenses = state.expenses.filter(expense => {
        const date = new Date(expense.created_at)
        return date >= firstDay && date <= lastDay && expense.commitment_id
      })

      // Agrupa por commitment_id y suma los montos
      const progressMap = {}
      commitmentExpenses.forEach(expense => {
        const commitmentId = expense.commitment_id
        if (!progressMap[commitmentId]) {
          progressMap[commitmentId] = 0
        }
        progressMap[commitmentId] += Number(expense.amount)
      })

      return progressMap
    }
  },

  actions: {
    // Carga todos los gastos del usuario
    async loadExpenses() {
      const authStore = useAuthStore()
      const syncStore = useSyncStore()
      if (!authStore.user) return

      try {
        const { data, error } = await supabase
          .from('expenses')
          .select(`
            *,
            category_expenses (
              id,
              name
            )
          `)
          .eq('user_id', authStore.user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        this.expenses = data || []
        
        // Cachea los datos para uso offline
        await syncStore.cacheTableData('expenses', data)
      } catch (error) {
        console.error('Error cargando gastos:', error)
        
        // Si falla, intenta cargar desde caché
        const cached = await syncStore.getCachedTableData('expenses')
        if (cached) {
          console.log('📂 Cargando gastos desde caché')
          this.expenses = cached
        }
      }
    },

    // Carga todos los ingresos del usuario
    async loadIncomes() {
      const authStore = useAuthStore()
      const syncStore = useSyncStore()
      if (!authStore.user) return

      try {
        const { data, error } = await supabase
          .from('incomes')
          .select('*')
          .eq('user_id', authStore.user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        this.incomes = data || []
        
        // Cachea los datos para uso offline
        await syncStore.cacheTableData('incomes', data)
      } catch (error) {
        console.error('Error cargando ingresos:', error)
        
        // Si falla, intenta cargar desde caché
        const cached = await syncStore.getCachedTableData('incomes')
        if (cached) {
          console.log('📂 Cargando ingresos desde caché')
          this.incomes = cached
        }
      }
    },

    // Carga todas las deudas del usuario
    async loadDebts() {
      const authStore = useAuthStore()
      const syncStore = useSyncStore()
      if (!authStore.user) return

      try {
        const { data, error } = await supabase
          .from('debts')
          .select('*')
          .eq('user_id', authStore.user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        this.debts = data || []
        
        // Cachea los datos para uso offline
        await syncStore.cacheTableData('debts', data)
      } catch (error) {
        console.error('Error cargando deudas:', error)
        
        // Si falla, intenta cargar desde caché
        const cached = await syncStore.getCachedTableData('debts')
        if (cached) {
          console.log('📂 Cargando deudas desde caché')
          this.debts = cached
        }
      }
    },

    // Carga todos los compromisos del usuario
    async loadCommitments() {
      const authStore = useAuthStore()
      const syncStore = useSyncStore()
      if (!authStore.user) return

      try {
        const { data, error } = await supabase
          .from('commitments')
          .select('*')
          .eq('user_id', authStore.user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        this.commitments = data || []
        
        // Cachea los datos para uso offline
        await syncStore.cacheTableData('commitments', data)
      } catch (error) {
        console.error('Error cargando compromisos:', error)
        
        // Si falla, intenta cargar desde caché
        const cached = await syncStore.getCachedTableData('commitments')
        if (cached) {
          console.log('📂 Cargando compromisos desde caché')
          this.commitments = cached
        }
      }
    },

    // Carga todos los datos financieros
    async loadAllData() {
      this.loading = true
      try {
        await Promise.all([
          this.loadExpenses(),
          this.loadIncomes(),
          this.loadDebts(),
          this.loadCommitments()
        ])
      } finally {
        this.loading = false
      }
    },

    // Agrega un nuevo gasto
    addExpense(expense) {
      this.expenses.unshift(expense)
    },

    // Agrega un nuevo ingreso
    addIncome(income) {
      this.incomes.unshift(income)
    }
  }
})