// Utilidades para proteger APIs y componentes

import { NextRequest, NextResponse } from "next/server"
import type { UserRole } from "./permissions"
import { rolePermissions } from "./permissions"

// Obtener usuario del header (enviado desde el cliente)
export function getUserFromRequest(request: NextRequest): {
  id: number
  rol: UserRole
  nombre: string
} | null {
  const userHeader = request.headers.get("x-user-id")
  const roleHeader = request.headers.get("x-user-role")
  const nameHeader = request.headers.get("x-user-name")

  if (!userHeader || !roleHeader) return null

  return {
    id: parseInt(userHeader),
    rol: roleHeader as UserRole,
    nombre: nameHeader || "Unknown",
  }
}

// Middleware para proteger APIs
export function requireAuth(
  handler: (
    req: NextRequest,
    user: { id: number; rol: UserRole; nombre: string }
  ) => Promise<Response>
) {
  return async (req: NextRequest, context: any) => {
    try {
      const user = getUserFromRequest(req)

      if (!user) {
        return NextResponse.json(
          { error: "No autenticado" },
          { status: 401 }
        )
      }

      return await handler(req, user)
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || "Error interno" },
        { status: 500 }
      )
    }
  }
}

// Middleware para proteger APIs por rol
export function requireRole(
  allowedRoles: UserRole[],
  handler: (
    req: NextRequest,
    user: { id: number; rol: UserRole; nombre: string }
  ) => Promise<Response>
) {
  return async (req: NextRequest, context: any) => {
    try {
      const user = getUserFromRequest(req)

      if (!user) {
        return NextResponse.json(
          { error: "No autenticado" },
          { status: 401 }
        )
      }

      if (!allowedRoles.includes(user.rol)) {
        return NextResponse.json(
          {
            error: `Acceso denegado. Roles permitidos: ${allowedRoles.join(", ")}`,
          },
          { status: 403 }
        )
      }

      return await handler(req, user)
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || "Error interno" },
        { status: 500 }
      )
    }
  }
}

// Middleware para proteger APIs por permiso
import { Permission } from "./permissions"

export function requirePermission(
  permission: Permission,
  handler: (
    req: NextRequest,
    user: { id: number; rol: UserRole; nombre: string }
  ) => Promise<Response>
) {
  return async (req: NextRequest, context: any) => {
    try {
      const user = getUserFromRequest(req)

      if (!user) {
        return NextResponse.json(
          { error: "No autenticado" },
          { status: 401 }
        )
      }

      const userPermissions = rolePermissions[user.rol]
      if (!userPermissions.includes(permission)) {
        return NextResponse.json(
          {
            error: `Permiso denegado: ${permission}`,
          },
          { status: 403 }
        )
      }

      return await handler(req, user)
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || "Error interno" },
        { status: 500 }
      )
    }
  }
}
