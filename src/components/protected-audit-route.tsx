"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { hasPermission } from "@/lib/permissions"
import { toast } from "sonner"

interface ProtectedAuditRouteProps {
  children: React.ReactNode
}

export function ProtectedAuditRoute({ children }: ProtectedAuditRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push("/login")
      return
    }

    if (!hasPermission(user.rol, "view_audit")) {
      toast.error("No tienes permiso para ver este componente")
      router.push("/dashboard")
      return
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin">
          <div className="h-12 w-12 border-4 border-slate-200 border-t-slate-900 rounded-full" />
        </div>
      </div>
    )
  }

  if (!user) return null

  if (!hasPermission(user.rol, "view_audit")) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Acceso Denegado</h1>
          <p className="text-slate-600">No tienes permisos para ver esta sección</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
