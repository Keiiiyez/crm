"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import type { UserRole } from "@/lib/permissions"
import { hasPermission, type Permission } from "@/lib/permissions"
import { httpClient } from "./http-client"

export interface User {
  id: number
  nombre: string
  email: string
  rol: UserRole
  operadora_asignada?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  hasPermission: (permission: Permission) => boolean
  isAdmin: boolean
  isGestor: boolean
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(true)
  const router = useRouter()

  // Cargar usuario al montar
  React.useEffect(() => {
    const stored = localStorage.getItem("crm_user")
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch (error) {
        localStorage.removeItem("crm_user")
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const res = await httpClient("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) throw new Error("Credenciales inválidas")

      const user = await res.json()
      localStorage.setItem("crm_user", JSON.stringify(user))
      setUser(user)
      router.push("/dashboard")
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem("crm_user")
    setUser(null)
    router.push("/login")
  }

  const checkPermission = (permission: Permission) => {
    if (!user) return false
    return hasPermission(user.rol, permission)
  }

  const value = {
    user,
    loading,
    login,
    logout,
    hasPermission: checkPermission,
    isAdmin: user?.rol === "ADMIN",
    isGestor: user?.rol === "ASESOR" || user?.rol === "COORDINADOR",
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de AuthProvider")
  }
  return context
}

// Hook para verificar permisos y redirigir
export function useRequirePermission(permission: Permission) {
  const { user, hasPermission } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (user && !hasPermission(permission)) {
      router.push("/unauthorized")
    }
  }, [user, hasPermission, permission, router])

  return user && hasPermission(permission)
}
