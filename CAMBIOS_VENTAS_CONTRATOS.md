# ✅ CAMBIOS REALIZADOS - Captura de Asesor en Ventas y Generación Automática de Contratos

## 📋 Resumen
Se implementaron **3 mejoras críticas** para que el sistema CRM capture automáticamente quién hizo cada venta y genere contratos asociados:

### ✅ Cambio 1: Captura de Usuario en Formulario de Ventas
**Archivo:** `src/components/sales/sales-form.tsx`

**Cambios:**
- ✅ Agregado import: `import { useAuth } from "@/lib/auth-context"`
- ✅ Inicializado hook: `const { user } = useAuth()` dentro de `export function SalesForm()`
- ✅ Actualizado `onSubmit()` para capturar `user.id` y `user.nombre`
- ✅ Validación: Si no hay usuario autenticado, muestra error

**Cómo funciona:**
```typescript
// Antes: Solo enviaba datos de la venta
const onSubmit = async (values) => {
  await httpClient('/api2/sales', {
    body: JSON.stringify(values), // ❌ Faltaban usuario_id, usuario_nombre
  });
};

// Después: Incluye usuario autenticado
const onSubmit = async (values) => {
  const response = await httpClient('/api2/sales', {
    body: JSON.stringify({
      ...values,
      usuario_id: user.id,          // ✅ ID del asesor
      usuario_nombre: user.nombre   // ✅ Nombre del asesor
    }),
  });
};
```

---

### ✅ Cambio 2: API Protegida y Generación Automática de Contrato
**Archivo:** `src/app/api2/sales/route.ts`

**Cambios principales:**

1. **Protección con Permiso:**
   - ✅ POST handler ahora usa `requirePermission("create_sale", ...)`
   - ✅ GET handler ahora usa `requirePermission("view_sales", ...)`

2. **Generación Automática de Contrato:**
   ```typescript
   // Generar número único de contrato
   const numeroContrato = `CTR-${Date.now()}-${Math.random()...}`;
   
   // Crear en tabla contratos PRIMERO
   const contractResult = await connection.execute(
     `INSERT INTO contratos (...) VALUES (...)`,
     [clienteId, numeroContrato, operadorDestino, ...]
   );
   const contratoId = contractResult.insertId;
   
   // Luego crear la venta vinculada al contrato
   const saleResult = await connection.execute(
     `INSERT INTO sales (..., contrato_id) VALUES (..., ?)`,
     [..., contratoId]
   );
   ```

3. **Captura de Asesor en Base de Datos:**
   ```typescript
   // La tabla sales ahora guarda:
   INSERT INTO sales (
     ...,
     usuario_id,       // ID del asesor
     usuario_nombre,   // Nombre del asesor
     contrato_id       // Vinculación con contrato
   ) VALUES (...)
   ```

4. **SELECT actualizado para mostrar asesor:**
   ```typescript
   SELECT 
     ...,
     s.usuario_nombre as usuarioNombre,
     s.usuario_id as usuarioId,
     s.contrato_id as contratoId,
     ...
   FROM sales s
   ```

5. **Registro en Auditoría:**
   - ✅ Cada venta se registra en `auditoria_cambios`
   - ✅ Incluye referencia al número de contrato

---

### ✅ Cambio 3: Tabla de Ventas Muestra al Asesor
**Archivo:** `src/app/(app)/sales/page.tsx`

**Cambios:**
- ✅ Agregada columna "Asesor" entre "Cliente" y "Operadora" en el header
- ✅ Nueva celda que muestra `sale.usuarioNombre` con estilo púrpura
- ✅ Si no hay asesor, muestra "—"

**Visualización:**
```
┌─────────┬──────────┬─────────────┬────────────┬──────────┬──────────┬─────────┐
│ Fecha   │ Cliente  │ Asesor      │ Operadora  │ Estado   │ Importe  │ Detalles│
├─────────┼──────────┼─────────────┼────────────┼──────────┼──────────┼─────────┤
│23/01/25 │ Juan Gómez│ MARIA       │ MOVISTAR   │ Pendiente│ 45.00 €  │    ...  │
│22/01/25 │ Ana López │ CARLOS      │ VODAFONE   │ Tramitada│ 52.50 €  │    ...  │
└─────────┴──────────┴─────────────┴────────────┴──────────┴──────────┴─────────┘
```

---

## 📊 Cambios en Base de Datos

**Tabla `sales` - Nuevas Columnas Agregadas:**
```sql
ALTER TABLE sales ADD COLUMN usuario_id INT;
ALTER TABLE sales ADD COLUMN usuario_nombre VARCHAR(100);
ALTER TABLE sales ADD COLUMN contrato_id INT;
```

**Script Ejecutado:** `scripts/fix-sales-table.js`
- ✅ Verifica estructura actual de la tabla
- ✅ Agrega columnas faltantes automáticamente
- ✅ No sobreescribe datos existentes

---

## 🔗 Relaciones Establecidas

### Antes:
```
sales → clientes
(Venta perdida, no se sabe quién la hizo)
```

### Después:
```
sales ←→ contratos ←→ clientes
  ↓
usuario (a través de usuario_id)
```

---

## ✨ Flujo Completo de Registro de Venta

```
1. Asesor accede a /sales/new
      ↓
2. Rellena formulario de venta
   (Cliente, Operadora, Servicios, Precio)
      ↓
3. Envía formulario (incluye su usuario_id y usuario_nombre de localStorage)
      ↓
4. API POST /api2/sales recibe petición protegida
      ↓
5. Genera número de contrato único
      ↓
6. Crea registro en tabla 'contratos' con:
   - numero_contrato
   - datos de cliente y servicios
   - asesor_id y asesor_nombre
   - estado: PENDIENTE_TRAMITACION
      ↓
7. Crea registro en tabla 'sales' con:
   - todos los datos
   - usuario_id y usuario_nombre (EL ASESOR)
   - contrato_id (vinculación)
      ↓
8. Crea registros en 'sale_items' para cada servicio
      ↓
9. Registra en 'auditoria_cambios' con los detalles
      ↓
10. Responde con éxito (incluye numeroContrato y contratoId)
      ↓
11. Asesor ve "Venta registrada con éxito"
      ↓
12. Supervisores pueden ver la venta con nombre del asesor en tabla
      ↓
13. Contrato puede ser visible en /contracts
```

---

## 🔐 Permisos Requeridos

- **Crear venta:** Necesita permiso `create_sale`
  - ✅ ASESOR: Puede crear sus propias ventas
  - ✅ COORDINADOR: Puede crear ventas
  - ✅ GERENTE: Puede crear ventas
  - ✅ ADMIN: Acceso total

- **Ver ventas:** Necesita permiso `view_sales`
  - ✅ ASESOR: Ve sus propias ventas
  - ✅ COORDINADOR: Ve todas en su grupo
  - ✅ GERENTE: Ve todas
  - ✅ ADMIN: Acceso total

---

## 🧪 Cómo Probar

### 1. Registrar una venta:
```
1. Login en http://localhost:3000/login
2. Email: asesor@example.com | Contraseña: 123456
3. Ir a Ventas → Nueva Venta
4. Seleccionar cliente, operadora, servicios
5. Registrar venta
6. ✅ Debe mostrar: "Venta registrada con éxito"
```

### 2. Verificar que se capturó al asesor:
```
1. Ir a /sales
2. Ver tabla de ventas
3. ✅ Columna "Asesor" debe mostrar "ASESOR" (el nombre del usuario)
4. ✅ Cada venta registrada debe tener nombre del asesor
```

### 3. Verificar que se creó el contrato:
```
1. Ir a /contracts
2. ✅ Debe haber un contrato nuevo
3. ✅ Estado: PENDIENTE_TRAMITACION
4. ✅ Número único como CTR-1234567890-ABC123
5. ✅ Asesor mostrado como el que hizo la venta
```

### 4. Verificar auditoría:
```
-- En MySQL:
SELECT * FROM auditoria_cambios 
WHERE tabla_modificada = 'sales' 
ORDER BY fecha DESC LIMIT 5;

-- ✅ Debe mostrar registro de la nueva venta
```

---

## 🎯 Beneficios

✅ **Trazabilidad Completa:** Cada venta sabe quién la hizo
✅ **Auditoría Funcional:** Se registran todos los cambios
✅ **Vinculación Automática:** Contratos ligados a ventas automáticamente
✅ **Supervisión:** Los gerentes pueden ver qué vende cada asesor
✅ **Comisiones:** Base sólida para calcular comisiones por asesor
✅ **Seguridad:** Permisos granulares en API

---

## 📝 Notas Importantes

- La tabla `sales` se actualizó con 3 nuevas columnas
- Los datos históricos mantienen `usuario_id` y `usuario_nombre` como NULL
- Solo las ventas nuevas registradas después de este cambio tendrán asesor...
- Los contratos se generan automáticamente con estado PENDIENTE_TRAMITACION
- El número de contrato es único y basado en timestamp + random

---

## 🚀 Listo para usar

Todas las funcionalidades están integradas y funcionando. El servidor debe recargar automáticamente con los cambios en TypeScript.

**Próximas mejoras opcionales:**
- Panel de estadísticas de ventas por asesor
- Exportación de reportes de comisiones
- Notificaciones cuando se genera un contrato
- Dashboard del asesor con sus ventas
