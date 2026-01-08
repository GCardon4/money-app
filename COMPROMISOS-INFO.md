# Sistema de Compromisos y Metas Mensuales

## 📋 Descripción

Sistema para vincular gastos con compromisos mensuales y visualizar el progreso de pago mensual.

## 🎯 Funcionalidades Implementadas

### 1. **Dashboard - Meta de Compromisos**
- Barra de progreso visual mostrando el porcentaje completado
- Muestra: `$Pagado / $Total de Compromisos`
- Lista de compromisos activos con su progreso individual
- Indicador verde cuando se alcanza el 100%

### 2. **ExpensesForm - Vinculación de Gastos**
- Nuevo campo **opcional**: "¿Asociar a un compromiso?"
- Dropdown con compromisos activos mostrando:
  - Nombre del compromiso
  - Monto total
  - Día de pago
- El campo es **opcional** (clearable)

### 3. **FinanceStore - Getters Nuevos**
- `totalMonthlyCommitments`: Suma de todos los compromisos activos
- `commitmentsProgress`: Objeto con `{commitment_id: monto_pagado}`
- `commitmentsCompletionPercentage`: Porcentaje total (0-100)

## 🔄 Flujo de Uso

### Paso 1: Crear Compromisos
1. Ir a `/commitments`
2. Crear compromisos mensuales (ej: "Arriendo", "Internet", "Luz")
3. Definir monto y día de pago
4. Marcar como **Activo**

### Paso 2: Registrar Gastos Asociados
1. Ir a `/expenses`
2. Agregar gasto normal (monto, descripción, categoría)
3. **Seleccionar compromiso** en el dropdown (si aplica)
4. El gasto queda vinculado al compromiso

### Paso 3: Ver Progreso en Dashboard
1. Ir a `/dashboard`
2. Ver card **"Meta de Compromisos del Mes"**
3. Barra de progreso muestra:
   - Verde si >= 100%
   - Azul si < 100%
4. Lista detallada por compromiso:
   - Monto pagado / Monto total
   - Barra de progreso individual

## 🗄️ Cambios en Base de Datos

### ✅ Implementado en Supabase

Columna `commitment_id` agregada a tabla `expenses`:

```sql
ALTER TABLE expenses 
ADD COLUMN commitment_id int8 REFERENCES commitments(id) ON DELETE SET NULL;

CREATE INDEX idx_expenses_commitment_id ON expenses(commitment_id);
```

**Tipo de dato:** `int8` (bigint) con llave foránea a `commitments(id)`

## 💡 Ejemplos de Uso

### Ejemplo 1: Arriendo
- **Compromiso**: "Arriendo" - $500.000 - Día 5
- **Gastos asociados**:
  - 5 Enero: $250.000 (Anticipo)
  - 10 Enero: $250.000 (Saldo)
- **Dashboard**: Muestra 100% completado

### Ejemplo 2: Luz
- **Compromiso**: "Luz" - $50.000 - Día 15
- **Gastos asociados**:
  - 14 Enero: $50.000
- **Dashboard**: Muestra 100% completado

### Ejemplo 3: Internet (Parcial)
- **Compromiso**: "Internet" - $40.000 - Día 20
- **Gastos asociados**:
  - 12 Enero: $20.000
- **Dashboard**: Muestra 50% completado

## 🎨 Características Visuales

- **Barra de progreso grande** en Dashboard
- **Badge de porcentaje** con colores:
  - Verde (>= 100%): Meta cumplida
  - Azul (< 100%): En progreso
- **Lista detallada** con mini barras:
  - Naranja: < 100%
  - Verde: 100%
- **Formato de montos**: Separador de miles con punto

## 🔧 Archivos Modificados

1. **src/stores/financeStore.js**
   - Nuevos getters para cálculos de compromisos
   - Query con JOIN a `category_expenses`

2. **src/pages/DashboardPage.vue**
   - Card de meta de compromisos
   - Computed properties para progreso

3. **src/components/ExpensesForm.vue**
   - Selector de compromiso opcional
   - Campo `commitment_id` en datos guardados

## 📊 Lógica de Cálculo

### Total Pagado
```javascript
Suma de expenses donde:
- created_at está en el mes actual
- commitment_id no es null
- Agrupado por commitment_id
```

### Porcentaje
```javascript
(Total Pagado / Total Compromisos Activos) * 100
```

### Progreso Individual
```javascript
Para cada compromiso:
(Gastos vinculados / Monto del compromiso) * 100
```

## ⚠️ Consideraciones

1. **Gastos sin compromiso**: Funcionan normalmente, solo no afectan la meta
2. **Compromisos inactivos**: No se cuentan en el total mensual
3. **Cálculo mensual**: Solo considera gastos del mes actual
4. **Sobrepago**: Si pagas más del compromiso, muestra máximo 100%
5. **Sin compromisos**: Muestra mensaje "No hay compromisos activos"

## 🚀 Próximas Mejoras Sugeridas

- [ ] Filtrar gastos por compromiso en ExpensesPage
- [ ] Alertas cuando faltan N días para compromiso sin pagar
- [ ] Gráfico histórico de cumplimiento mensual
- [ ] Sugerencia de monto a pagar según días restantes
- [ ] Predicción de fecha de pago completo
