import { defineStore } from 'pinia'
import { supabase } from 'boot/supabase'
import { useAuthStore } from './authStore'

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
    }
  },

  actions: {
    // Carga todos los gastos del usuario
    async loadExpenses() {
      const authStore = useAuthStore()
      if (!authStore.user) return

      try {
        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .eq('user_id', authStore.user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        this.expenses = data || []
      } catch (error) {
        console.error('Error cargando gastos:', error)
      }
    },

    // Carga todos los ingresos del usuario
    async loadIncomes() {
      const authStore = useAuthStore()
      if (!authStore.user) return

      try {
        const { data, error } = await supabase
          .from('incomes')
          .select('*')
          .eq('user_id', authStore.user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        this.incomes = data || []
      } catch (error) {
        console.error('Error cargando ingresos:', error)
      }
    },

    // Carga todas las deudas del usuario
    async loadDebts() {
      const authStore = useAuthStore()
      if (!authStore.user) return

      try {
        const { data, error } = await supabase
          .from('debts')
          .select('*')
          .eq('user_id', authStore.user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        this.debts = data || []
      } catch (error) {
        console.error('Error cargando deudas:', error)
      }
    },

    // Carga todos los compromisos del usuario
    async loadCommitments() {
      const authStore = useAuthStore()
      if (!authStore.user) return

      try {
        const { data, error } = await supabase
          .from('commitments')
          .select('*')
          .eq('user_id', authStore.user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        this.commitments = data || []
      } catch (error) {
        console.error('Error cargando compromisos:', error)
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