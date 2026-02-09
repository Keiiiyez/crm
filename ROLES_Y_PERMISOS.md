# 🔐 SISTEMA DE ROLES Y PERMISOS - Guía de Uso

## 📋 Estructura de Roles

```
ASESOR (Nivel 1)
├── Ver dashboard básico
├── Registrar ventas
├── Ver su propio historial
└── Ver sus comisiones

COORDINADOR (Nivel 2)
├── Todo lo de ASESOR +
├── Ver/editar todas las ventas
├── Crear/editar clientes
├── Crear contratos
├── Marcar comisiones como pagadas
└── Ver reportes básicos

GERENTE (Nivel 3)
├── Todo lo de COORDINADOR +
├── Eliminar ventas/contratos
├── Crear promociones de operadoras
├── Ver auditoría
└── Acceso casi total

ADMIN (Nivel 4)
└── Acceso TOTAL al sistema
   ├── Crear/editar usuarios
   ├── Acceso a toda la auditoría
   └── Configuración completa
```

---

## 🔧 Cómo Implementar

### 1️⃣ **Proteger un Componente** (Cliente)

```tsx
"use client"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/lib/auth-context"

export default function AdminOnly() {
  const { isAdmin } = useAuth()

  return (
    <ProtectedRoute requiredPermission="create_users">
      {/* Solo ADMIN puede ver esto */}
      <div>Panel de administración</div>
    </ProtectedRoute>
  )
}
```

### 2️⃣ **Dentro de un Componente** (Cliente)

```tsx
"use client"
import { useAuth } from "@/lib/auth-context"

export default function Dashboard() {
  const { user, hasPermission, isAdmin, isGestor } = useAuth()

  return (
    <div>
      <h1>Hola {user?.nombre}</h1>

      {/* Solo si tiene permiso específico */}
      {hasPermission("create_contract") && (
        <button>Crear Contrato</button>
      )}

      {/* Solo para admins */}
      {isAdmin && (
        <button>Crear Usuario</button>
      )}

      {/* Solo para asesores/coordinadores */}
      {isGestor && (
        <button>Registrar Venta</button>
      )}

      {/* Mostrar rol */}
      <p>Tu rol: {user?.rol}</p>
    </div>
  )
}
```

### 3️⃣ **Proteger una API** (Servidor)

**Opción A: Por rol**
```typescript
// src/app/api/usuarios/route.ts
import { requireRole } from "@/lib/api-auth"
import { NextRequest } from "next/server"

export const POST = requireRole(
  ["ADMIN"],  // Solo ADMIN puede crear usuarios
  async (req, user) => {
    // Solo ejecuta si el usuario es ADMIN
    const body = await req.json()
    // crear usuario...
    return NextResponse.json({ success: true })
  }
)
```

**Opción B: Por permiso específico**
```typescript
// src/app/api/comisiones/[id]/route.ts
import { requirePermission } from "@/lib/api-auth"
import { NextRequest } from "next/server"

export const PATCH = requirePermission(
  "edit_commission_payment",  // Solo quien pueda pagar comisiones
  async (req, user) => {
    // resolver descuento...
    return NextResponse.json({ success: true })
  }
)
```

### 4️⃣ **Menú dinámico según rol**

```tsx
"use client"
import { useAuth } from "@/lib/auth-context"
import { UserMenu } from "@/components/user-menu"

export default function AppHeader() {
  const { user, isAdmin } = useAuth()

  return (
    <header className="flex justify-between items-center">
      <div>CRM</div>

      {/* Menú solo para admins */}
      {isAdmin && (
        <nav>
          <a href="/admin/usuarios">Usuarios</a>
          <a href="/admin/auditoria">Auditoría</a>
        </nav>
      )}

      {/* Menú del usuario en esquina */}
      <UserMenu />
    </header>
  )
}
```

---

## 📍 Flujo de Autenticación

```
1. Usuario accede a /login
   ↓
2. Ingresa email + password
   ↓
3. Se llama POST /api/auth/login
   ↓
4. Se valida contra BD (tabla usuarios)
   ↓
5. Se devuelve usuario con su rol
   ↓
6. Se guarda en localStorage (AuthContext)
   ↓
7. useAuth() devuelve usuario + permisos
   ↓
8. Componentes se renderean según permisos
   ↓
9. APIs verifican rol antes de ejecutar
```

---

## 🎯 Casos de Uso Típicos

### ASESOR (El que vende)
```
✅ Puede:
  - Ver dashboard con sus números
  - Registrar nueva venta
  - Ver sus comisiones pendientes
  - Ver su historial de ventas

❌ NO puede:
  - Editar ventas de otros
  - Crear contratos
  - Ver auditoría
  - Crear usuarios
```

### COORDINADOR (Supervisa)
```
✅ Puede:
  - Ver dashboard general
  - Editar ventas + contratos
  - Crear promotiones semanales
  - Marcar comisiones como pagadas
  - Ver reportes

❌ NO puede:
  - Crear usuarios
  - Ver auditoría completa
  - Borrar datos
```

### GERENTE (Jefe)
```
✅ Puede:
  - Todo lo anterior
  - Borrar ventas/contratos
  - Ver auditoría
  - Dashboard ejecutivo

❌ NO puede:
  - Crear usuarios
```

### ADMIN (Dev/Sysadmin)
```
✅ Puede:
  - TODO SIN EXCEPCIONES
  - Crear/editar usuarios
  - Ver toda la auditoría
  - Acceder a configuración
```

---

## 🔌 Integración con APIs

### Desde el cliente (React)

```tsx
const response = await fetch('/api/comisiones', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': user.id.toString(),
    'x-user-role': user.rol,
    'x-user-name': user.nombre,
  },
  body: JSON.stringify(data)
})
```

### Desde el servidor (API)

```typescript
import { getUserFromRequest, requirePermission } from "@/lib/api-auth"

export const POST = requirePermission(
  "create_commission",
  async (req, user) => {
    // user.id, user.rol, user.nombre disponibles
    // user es garantizado por requirePermission
    
    const body = await req.json()
    
    // Registrar en auditoría con el usuario que hizo la acción
    await db.query(
      `INSERT INTO auditoria_cambios (usuario_id, usuario_nombre, ...)
       VALUES (?, ?, ...)`,
      [user.id, user.nombre, ...]
    )
    
    return NextResponse.json({ success: true })
  }
)
```

---

## ⚠️ Notas Importantes

1. **Passwords**: Actualmente es demo. Implementar bcrypt en producción
2. **Headers**: El middleware verifica headers x-user-id, x-user-role
3. **LocalStorage**: Seguro para desarrollo, en producción usar cookies + JWT
4. **Permisos**: Ver `src/lib/permissions.ts` para la lista completa

---

## 🚀 Próximos Pasos

- [ ] Integrar con JWT en lugar de localStorage
- [ ] Implementar bcrypt para passwords
- [ ] Dashboard por rol (diferente para asesor vs admin)
- [ ] Sistema de 2FA (autenticación doble)
- [ ] Tokens de refresh

