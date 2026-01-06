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
- Companies (companies) / Empresas
- Roles (roles) / Roles creados = Admin, Manager, User, Bodega, Caja
- Products (products) / Productos con nombre, sku, costo y stock
- Sales (sales) / Ventas de productos registradas por usuarios Caja
  * id: BIGINT (autoincremento) - Primary Key
  * user_id: UUID - Referencia a profiles(id)
  * transaction_id: UUID - Referencia a transactions(id)
  * company_id, cashes_id, product_id: BIGINT
- Suppliers (suppliers) / Proveedores de productos por empresa
- Cash Registers (cash_registers) / Cajas registradoras
- Transactions (transactions) / Transacciones/Carritos de venta
  * id: UUID - Primary Key
  * user_id: UUID - Usuario que creó la transacción

### Funcionalidades Principales

- **Gestión de de Ingresos** con CRUD completo
- **Gestión de de Egresos** con CRUD completo
- **Estadísticas Mensuales** Egresos, Ingresos, Ganancias
- **Gestión de Deudas** con CRUD completo



### Funcionalidades Especificas

- **Usuario Admin (role_id: 1)**
	-- Crea usuarios con todos los roles
	-- Limita creación de empresas en los usuarios manager
	-- Listado de TODAS las Empresas del sistema
	-- Listado de TODOS los usuarios del sistema
	-- Ve listado de lotes por empresas
	-- Panel administrativo completo



###  Módulos Implementados

1. **Autenticación** - Login
2. **Gestión de Usuarios** - CRUD de usuarios que crea el admin
3. **Gestión de Empresas** - CRUD de Empresas por admin y managers
4. **Gestión de Productos** - CRUD de productos por empresa
5. **Gestión de Bodega** - Ingreso de productos con audio y escaneo de códigos
6. **Gestión de Ventas** - Registro y seguimiento de ventas por usuarios Caja
7. **Análisis Manager** - Vista detallada de empresas con productos, ventas, costos y análisis mensual

##  Stack Tecnológico

- **Frontend**: Vue 3 + Quasar Framework
- **Backend**: Supabase (Auth, PostgreSQL, Storage)
- **Base de Datos Local**: IndexedDB
- **PWA**: Workbox (configurado)