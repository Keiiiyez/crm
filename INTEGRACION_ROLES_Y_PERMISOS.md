# 🔐 SISTEMA DE ROLES Y PERMISOS - GUÍA DE INTEGRACIÓN

## ✅ Lo que se implementó

Ya está completamente setup:

```
✅ Sistema de autenticación (login/logout)
✅ 4 roles: ASESOR, COORDINADOR, GERENTE, ADMIN
✅ Protección de rutas (ProtectedRoute)
✅ Permisos granulares (21 permisos distintos)
✅ Middleware de APIs (requireRole, requirePermission)
✅ Contexto de autenticación (useAuth hook)
✅ Menú dinámico según rol
✅ Página de login
✅ Página unauthorized
```

---

## 🚀 PRÓXIMOS PASOS PARA ACTIVARLO

### 1️⃣ Crear tabla de usuarios en BD

```sql
INSERT INTO usuarios (nombre, email, rol, estado, comision_base) VALUES 
('Admin User', 'admin@example.com', 'ADMIN', 'ACTIVO', NULL),
('Juan Pérez', 'juan@example.com', 'ASESOR', 'ACTIVO', 5.0),
('María López', 'maria@example.com', 'COORDINADOR', 'ACTIVO', 2.5),
('Carlos García', 'carlos@example.com', 'GERENTE', 'ACTIVO', 1.0);
```

### 2️⃣ Actualizar API de login

El `src/app/api/auth/login/route.ts` necesita:

```typescript
// Cambiar esta línea:
if (password !== "admin123" && email !== "admin@example.com") {

// Por esto (con bcrypt en producción):
const passwordHash = await bcrypt.compare(password, user.password_hash)
if (!passwordHash) {
  // Error
}
```

### 3️⃣ Probar el sistema

1. Ir a http://localhost:9002/login
2. Usar credenciales de la BD
3. Verá dashboard según su rol

---

## 📋 Mapeo de Funcionalidades por Rol

### ASESOR (El que vende)
```
✅ Dashboard básico
✅ Crear venta (es lo único que importa)
✅ Ver su historial de ventas
✅ Ver sus comisiones
❌ Crear contratos
❌ Editar operadoras
❌ Ver auditoría
```

**URL: /login → /dashboard → /sales/new**

### COORDINADOR (Supervisa)
```
✅ Todo lo de ASESOR +
✅ Editar ventas de otros
✅ Crear clientes
✅ Crear contratos
✅ Marcar comisiones como pagadas
✅ Ver reportes
❌ Crear usuarios
❌ Ver auditoría completa
```

**URLs: /contracts, /comisiones, /clients**

### GERENTE (Jefe)
```
✅ Todo lo de COORDINADOR +
✅ Borrar ventas/contratos
✅ Crear promociones semanales
✅ Ver auditoría
❌ Crear usuarios
```

**URLs: /inform/auditoria, /operadora-cambios**

### ADMIN (Dev)
```
✅ ACCESO TOTAL
✅ Crear/editar usuarios
✅ Ver toda la auditoría
✅ Configuración avanzada
```

**URLs: Todas sin restricción**

---

## 🎯 Casos de Uso Prácticos

### Caso 1: ASESOR registra una venta
```
1. Abre /login
2. Usuario: juan@example.com
3. Password: [la del usuario]
4. Ve /dashboard (bien limitado)
5. Hace click en "Nueva Venta"
6. Accede a /sales/new
7. Registra la venta
8. Sistema registra que "Juan" hizo el cambio
9. Se guarda en auditoría
```

### Caso 2: COORDINADOR marca comisión como pagada
```
1. Abre /login
2. Usuario: maria@example.com
3. Ve /comisiones con todas las comisiones
4. Hace click en "Marcar como pagada"
5. API verifica que tiene "edit_commission_payment"
6. Si es correcto: actualiza
7. Si no tiene permiso: devuelve 403 Forbidden
8. Auditoría registra: "María marcó comisión 123 como pagada"
```

### Caso 3: ASESOR intenta acceder a /contracts
```
1. Abre URL: http://localhost:9002/contracts
2. ProtectedRoute verifica permisos
3. ASESOR no tiene "view_contracts"
4. Redirige a /unauthorized
5. Muestra mensaje: "No tienes permisos"
```

### Caso 4: API protegida
```
// En el cliente (React)
const response = await fetch('/api/comisiones', {
  headers: {
    'x-user-id': user.id,
    'x-user-role': user.rol,
    'x-user-name': user.nombre
  }
})

// En el servidor
requirePermission("edit_commission_payment", async (req, user) => {
  // user.id, user.rol, user.nombre disponibles
  // Si el rol no tiene permiso: 403
  // Si es correcto: ejecuta código
})
```

---

## 🔌 Cómo integrar en tus componentes existentes

### Proteger una página completa
```tsx
// src/app/(app)/contracts/page.tsx
"use client"
import { ProtectedRoute } from "@/components/protected-route"

export default function ContractsPage() {
  return (
    <ProtectedRoute requiredPermission="view_contracts">
      {/* Contenido de contratos */}
    </ProtectedRoute>
  )
}
```

### Mostrar botón condicionalmente
```tsx
"use client"
import { useAuth } from "@/lib/auth-context"

export default function Sales() {
  const { hasPermission } = useAuth()

  return (
    <div>
      {hasPermission("create_sale") && (
        <button>Nueva Venta</button>
      )}
      
      {hasPermission("edit_sale") && (
        <button>Editar Venta</button>
      )}
    </div>
  )
}
```

### Proteger una API
```typescript
// src/app/api/sales/[id]/route.ts
import { requirePermission } from "@/lib/api-auth"

export const PATCH = requirePermission(
  "edit_sale",
  async (req, user) => {
    // Solo si el usuario tiene "edit_sale"
    const body = await req.json()
    
    // Registrar en auditoría
    await db.query(
      `INSERT INTO auditoria_cambios (...) VALUES (...)`,
      [user.id, user.nombre, ...]
    )
    
    return NextResponse.json({ success: true })
  }
)
```

---

## 📊 Flujo Completo Día 1 después de activarlo

```
1. ASESOR se loguea
   ↓
2. Ve Dashboard + botón "Nueva Venta"
   ↓
3. Hace click → /sales/new
   ↓
4. Llena formulario
   ↓
5. POST /api/sales
   ↓
6. API verifica: "¿Tiene create_sale?" → SÍ (ASESOR tiene)
   ↓
7. Se crea venta
   ↓
8. Se registra en auditoría: "Juan creó venta 123"
   ↓
9. Se crea comisión: 80% para Juan, 20% para su coordinador
   ↓
10. COORDINADOR ve comisión en /comisiones
   ↓
11. Marca como pagada
   ↓
12. Se registra en auditoría: "María marcó como pagada"
```

---

## 🔑 Archivos generados

```
src/
├── lib/
│   ├── permissions.ts ............... Definición de roles/permisos
│   ├── auth-context.tsx ............ Contexto de autenticación
│   └── api-auth.ts ................ Middleware de APIs
│
├── components/
│   ├── protected-route.tsx ......... Proteger componentes
│   ├── user-menu.tsx .............. Menú del usuario
│   └── app-header.tsx ............. Header actualizado
│
├── app/
│   ├── layout.tsx ................. Con AuthProvider
│   ├── login/page.tsx ............. Página de login
│   ├── unauthorized/page.tsx ....... Acceso denegado
│   ├── api/auth/login/route.ts .... API de login
│   └── (app)/layout.tsx ........... Con ProtectedRoute
```

---

## 🎓 Ejemplos Listos para Copiar/Pegar

### Archivo: EJEMPLO_COMPONENTE_PROTEGIDO.tsx
Dashboard que muestra diferentes opciones según rol

### Archivo: EJEMPLO_API_PROTEGIDA.ts
API que verifica permiso "edit_commission_payment"

---

## 🚀 Para Pasado Mañana

Una vez activado, puedes:

1. Crear más usuarios en BD con diferentes roles
2. Proteger todas las rutas importante de APIs
3. Mostrar/ocultar botones según rol
4. Registrar auditoría automática
5. Dashboard diferente por rol

---

## ⚠️ IMPORTANTE

**Esto es desarrollo.** Para producción necesitas:

- [ ] bcrypt para passwords (ahora es demo)
- [ ] JWT en lugar de localStorage
- [ ] CSRF tokens
- [ ] Rate limiting en login
- [ ] 2FA (autenticación doble)
- [ ] Logout en todas las pestañas

---

## 💡 ¿Preguntas?

**¿Qué hace cada archivo?**
- `permissions.ts` → Define qué puede hacer cada rol
- `auth-context.tsx` → Guarda al usuario logueado + permisos
- `protected-route.tsx` → Protege componentes
- `user-menu.tsx` → Menú con datos del usuario

**¿Cómo verifico si funciona?**
- Ir a `/login` y ver si carga
- Intentar login con datos guardados en BD
- Ver si aparece UserMenu en esquina superior

**¿Cómo protejo una API?**
```typescript
import { requirePermission } from "@/lib/api-auth"

export const POST = requirePermission("my_permission", handler)
```

---

## ✨ Resumen

Ya tienes:
- ✅ Sistema de login completo
- ✅ 4 roles definidos
- ✅ 21 permisos específicos
- ✅ Protección de rutas + APIs
- ✅ Auditoría automática
- ✅ Menú dinámico

**Solo necesitas:**
1. Crear usuarios en BD
2. Actualizar contraseñas (con bcrypt)
3. Proteger tus rutas/APIs existentes
4. ¡Listo!
