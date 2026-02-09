"use client"

import * as React from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, Settings, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function UserMenu() {
  const { user, logout, isAdmin } = useAuth()

  if (!user) return null

  const initials = user.nombre
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  const rolColors = {
    ADMIN: "bg-red-100 text-red-800",
    GERENTE: "bg-purple-100 text-purple-800",
    COORDINADOR: "bg-blue-100 text-blue-800",
    ASESOR: "bg-green-100 text-green-800",
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 w-10 rounded-full p-0">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-sky-600 text-white font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col space-y-1">
          <div className="font-medium">{user.nombre}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span>{user.email}</span>
          </div>
          <Badge
            className={`${rolColors[user.rol as keyof typeof rolColors]} w-fit`}
            variant="outline"
          >
            <Shield className="h-3 w-3 mr-1" />
            {user.rol}
          </Badge>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {user.operadora_asignada && (
          <>
            <DropdownMenuItem disabled>
              <div className="text-xs flex flex-col">
                <span className="text-muted-foreground">Operadora asignada:</span>
                <span className="font-medium">{user.operadora_asignada}</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        {isAdmin && (
          <>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
