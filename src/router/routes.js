const routes = [
  // Ruta de Login (sin layout)
  {
    path: '/login',
    component: () => import('pages/LoginPage.vue'),
  },

  // Ruta de Registro (sin layout)
  {
    path: '/register',
    component: () => import('pages/RegisterPage.vue'),
  },

  // Rutas protegidas con MainLayout
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { 
        path: '', 
        redirect: '/dashboard' 
      },
      { 
        path: 'dashboard', 
        name: 'dashboard',
        component: () => import('pages/DashboardPage.vue') 
      },
      { 
        path: 'incomes', 
        name: 'incomes',
        component: () => import('pages/IncomesPage.vue') 
      },
      { 
        path: 'expenses', 
        name: 'expenses',
        component: () => import('pages/ExpensesPage.vue') 
      },
      { 
        path: 'debts', 
        name: 'debts',
        component: () => import('pages/DebtsPage.vue') 
      },
      { 
        path: 'commitments', 
        name: 'commitments',
        component: () => import('pages/CommitPage.vue') 
      }
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
