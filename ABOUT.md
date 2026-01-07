# App de Contabilidad Personal

Aplicación personal para el control y análisis de movimientos financieros, desarrollada con **Quasar Framework (Vue 3)** en el frontend y **Supabase** como backend (Base de datos, autenticación y almacenamiento).

El objetivo de esta app es centralizar, organizar y visualizar de forma clara los **ingresos, egresos, gastos, deudas y compromisos mensuales**, permitiendo una mejor toma de decisiones financieras.

---

## 1. Objetivo del Proyecto

Crear una aplicación financiera personal que permita:

* Registrar todos los movimientos financieros.
* Clasificar ingresos y egresos por categorías.
* Controlar deudas y compromisos recurrentes.
* Visualizar el estado financiero mediante métricas y gráficos.
* Acceder desde web y dispositivos móviles (PWA).

---

## 2. Tecnologías

### Frontend

* **Quasar Framework** (Vue 3)
* Vue Router
* Pinia (gestión de estado)
* PWA (instalable como app móvil)
* Chart.js o ECharts (visualización de datos)

### Backend

* **Supabase**

  * Auth (Email/Password)
  * PostgreSQL
  * Row Level Security (RLS)
  * Supabase Storage (opcional)

---

## 3. Módulos Principales

### 3.1 Autenticación

* Inicio de sesión
* Recuperación de contraseña
* Protección de rutas

Cada usuario solo puede ver y gestionar su propia información financiera.

---

### 3.2 Ingresos

Registro de todas las entradas de dinero.

**Campos sugeridos:**

* Fecha
* Monto
* Fuente (salario, negocio, extra, etc.)
* Categoría
* Descripción

---

### 3.3 Egresos / Gastos

Control detallado de salidas de dinero.

**Campos sugeridos:**

* Fecha
* Monto
* Categoría (alimentación, transporte, servicios, etc.)
* Método de pago
* Tipo (gasto fijo / gasto variable)
* Descripción

---

### 3.4 Deudas

Gestión de deudas activas y pagadas.

**Campos sugeridos:**

* Acreedor
* Monto total
* Monto pendiente
* Fecha de inicio
* Fecha límite
* Estado (activa / pagada)
* Observaciones

---

### 3.5 Compromisos Mensuales

Pagos recurrentes y obligaciones fijas.

**Campos sugeridos:**

* Nombre del compromiso
* Monto
* Frecuencia (mensual, trimestral, anual)
* Fecha de pago
* Estado (pendiente / pagado)

---

### 3.6 Resumen Financiero (Dashboard)

Vista general del estado financiero:

* Balance total
* Total ingresos vs egresos
* Gastos por categoría
* Deudas pendientes
* Compromisos próximos

Gráficos recomendados:

* Barras
* Pastel
* Línea de tiempo

---

## 4. Estructura del Proyecto (Quasar)

```
/src
 ├── assets
 ├── boot
 ├── components
 │   └── ExpensesForm.vue
 ├── layouts
 │   └── MainLayout.vue
 ├── pages
 │   ├── LoginPage.vue
 │   ├── RegisterPage.vue
 │   ├── DashboardPage.vue
 │   ├── IncomesPage.vue
 │   ├── ExpensesPage.vue
 │   ├── DebtsPage.vue
 │   └── CommitPage.vue
 ├── router
 ├── stores
 │   ├── authStore.js
 │   ├── financeStore.js
 └── services
     └── supabase.js
```

---

## 5. Base de Datos (Supabase)

### Tablas Principales

#### users (Auth)

Gestionado por Supabase Auth.

#### profiles

* id (uuid)
* full_name
* email
* created_at

#### incomes

* id
* user_id
* created_at
* amount
* source
* category
* pay_method
* description

#### expenses

* id
* user_id
* created_at
* amount
* category
* type
* description

#### debts

* id
* user_id
* creditor
* total_amount
* outstanding_amount
* status
* description

#### commitments

* id
* user_id
* name
* amount
* frecuency
* pay_date
* status


#### source_incomes

* id
* created_at
* name


#### category_expenses

* id
* created_at
* name

---

## 6. Seguridad

* Row Level Security (RLS) habilitado
* Cada tabla filtrada por `user_id`
* Acceso solo a datos propios

---

## 7. Funcionalidades Futuras

* Exportar datos a Excel / PDF
* Presupuestos mensuales
* Alertas de pagos próximos
* Notificaciones push (PWA)
* Modo oscuro
* Multi-moneda

---

## 8. Instalación

```bash
npm run dev
```

Configurar Supabase:

* Crear proyecto
* Copiar `SUPABASE_URL` y `SUPABASE_ANON_KEY`
* Configurar en archivo `supabase.js`

---

## 9. Licencia

Proyecto de uso personal. Adaptable para futuras versiones comerciales.

---

## 10. Autor

Gustavo Cardona
Desarrollado como proyecto personal para el control financiero y aprendizaje continuo con Quasar y Supabase.
