"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ArrowLeft } from "lucide-react"

export default function UnauthorizedPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-lg bg-red-600 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Acceso Denegado</CardTitle>
          <p className="text-center text-sm text-muted-foreground">
            No tienes permisos para acceder a esta página.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-slate-100 p-4 rounded-lg">
            <p className="text-sm text-slate-600">
              <strong>Razón:</strong> Tu rol no cuenta con los permisos necesarios
              para acceder a este recurso.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">
              Soluciones:
            </p>
            <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
              <li>Verifica tu rol en el sistema</li>
              <li>Solicita permisos superiores a un administrador</li>
              <li>Contacta a soporte técnico si crees que es un error</li>
            </ul>
          </div>

          <Button
            onClick={() => router.back()}
            className="w-full"
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a la página anterior
          </Button>

          <Button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-sky-600 hover:bg-sky-700"
          >
            Ir al Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
