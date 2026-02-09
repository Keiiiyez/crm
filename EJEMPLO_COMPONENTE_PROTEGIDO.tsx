// EJEMPLO: Componente con permisos dinámicos
// Muestra diferentes opciones según el rol

"use client"

import * as React from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Users,
  Settings,
  BarChart3,
  Lock,
  Eye,
  Edit,
  Trash2,
  LogOut,
} from "lucide-react"

export function DashboardPages() {
  const { user, hasPermission, isAdmin, logout } = useAuth()

  if (!user) return null

  return (
    <div className="space-y-6">
      {/* Header con info de usuario */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Bienvenido {user.nombre}</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="h-8">{user.rol}</Badge>
          <Button variant="outline" size="sm" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </div>

      {/* Alert informativo */}
      <Alert>
        <AlertDescription>
          Tu rol tiene acceso a {Object.values(user).filter(v => typeof v === 'boolean').length} características.
          <br />
          Operadora asignada: {user.operadora_asignada || "Ninguna"}
        </AlertDescription>
      </Alert>

      {/* Grid de acciones según permisos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Ver Ventas */}
        {hasPermission("view_sales") && (
          <Card className="border-l-4 border-l-sky-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Ver Ventas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Acceso a historial de ventas
              </p>
              <Button variant="outline" className="w-full" size="sm">
                Ir a Ventas
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 2. Crear Venta */}
        {hasPermission("create_sale") && (
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Registrar Venta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Crear nueva venta / contrato
              </p>
              <Button className="w-full bg-green-600 hover:bg-green-700" size="sm">
                Nueva Venta
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 3. Gestionar Contratos */}
        {hasPermission("view_contracts") && (
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Contratos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Ver y gestionar contratos activos
              </p>
              <Button variant="outline" className="w-full" size="sm">
                Ver Contratos
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 4. Comisiones */}
        {hasPermission("view_commissions") && (
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💰 Comisiones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {hasPermission("edit_commission_payment")
                  ? "Gestionar pagos de comisiones"
                  : "Ver tus comisiones"}
              </p>
              <Button variant="outline" className="w-full" size="sm">
                Ver Comisiones
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 5. Gestionar Operadoras (solo GERENTE+) */}
        {hasPermission("create_operator_promo") && (
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📡 Promociones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Crear y editar promociones semanales
              </p>
              <Button variant="outline" className="w-full" size="sm">
                Gestionar Promociones
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 6. Auditoría (solo GERENTE+) */}
        {hasPermission("view_audit") && (
          <Card className="border-l-4 border-l-red-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Auditoría
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Ver historial de cambios en el sistema
              </p>
              <Button variant="outline" className="w-full" size="sm">
                Ver Auditoría
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 7. Gestión de Usuarios (solo ADMIN) */}
        {hasPermission("create_users") && (
          <Card className="border-l-4 border-l-red-600 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Crear y editar usuarios en el sistema
              </p>
              <Button variant="destructive" className="w-full" size="sm">
                Gestionar Usuarios
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 8. Configuración (solo ADMIN) */}
        {isAdmin && (
          <Card className="border-l-4 border-l-gray-600 bg-gray-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Configuración avanzada del sistema
              </p>
              <Button variant="outline" className="w-full" size="sm">
                Configuración
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabla de permisos del usuario */}
      <Card>
        <CardHeader>
          <CardTitle>Tus Permisos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {[
              "view_sales",
              "create_sale",
              "view_contracts",
              "view_commissions",
              "view_operators",
              "view_audit",
              "create_users",
            ].map((perm) => (
              <div
                key={perm}
                className={`flex items-center gap-2 p-2 rounded ${
                  hasPermission(perm as any)
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full ${
                    hasPermission(perm as any)
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                />
                <span>{perm.replace("_", " ").toUpperCase()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
