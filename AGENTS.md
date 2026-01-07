#Descripción del Proyecto
Aplicación personal para el control y análisis de movimientos financieros, centralizando, organizando y visualizando de forma clara los ingresos, egresos, gastos, deudas y compromisos mensuales, permitiendo una mejor toma de decisiones financieras.


#Agents Rules
-   Cada función nueva debe incluir una línea de comentario encima en Español.
-   Todas las variables y funciones deben escribirse en camelCase
-   No uses snake_case
-   Trabajar todas las acciones y getters con stores, en la carpeta store
-   Folder /stores, se cargan los nuevos stores creados

## Características Implementadas



### Tablas Supabase
- Profiles (profiles) / Usuarios y Perfiles
- Incomes (incomes) / Ingresos
- Expenses (expenses) / Egresos y Gastos diarios
- Debts (debts) / Administra y crea las deudas
- Commitments (commitments) / Gastos Mensuales

### Funcionalidades Principales

- **Gestión de de Ingresos** con CRUD completo
- **Gestión de de Egresos** con CRUD completo
- **Estadísticas Mensuales** Egresos, Ingresos, Ganancias
- **Gestión de Deudas** con CRUD completo



### Funcionalidades Especificas

- **Usuario
	-- Crea Ingresos Diarios
	-- Crea Egresos Diarios
	-- Crea y administra Deudas
	-- Visualiza en el Home las estadísticas mensuales



###  Módulos Implementados

1. **Autenticación** - Login
2. **Estadísticas Mensuales** Egresos, Ingresos, Ganancias
3. **Gestión de de Ingresos** con CRUD completo
4. **Gestión de de Egresos** con CRUD completo
5. **Gestión de Deudas** con CRUD completo


##  Stack Tecnológico

- **Frontend**: Vue 3 + Quasar Framework
- **Backend**: Supabase (Auth, PostgreSQL, Storage)
- **Base de Datos Local**: IndexedDB
- **PWA**: Workbox (configurado)