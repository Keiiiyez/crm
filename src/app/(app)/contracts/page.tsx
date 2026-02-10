"use client"

import * as React from "react"
import { httpClient } from "@/lib/http-client"
import { 
  Plus, Search, Loader2, CheckCircle2, AlertCircle, Clock, 
  XCircle, Eye, Edit, Trash2, FileText 
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const ESTADO_BADGES = {
  PENDIENTE_TRAMITACION: { color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: Clock },
  EN_TRAMITACION: { color: "bg-blue-50 text-blue-700 border-blue-200", icon: AlertCircle },
  ACTIVO: { color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 },
  PROXIMO_VENCER: { color: "bg-orange-50 text-orange-700 border-orange-200", icon: AlertCircle },
  CANCELADO: { color: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
  CANCELADO_OPERADORA: { color: "bg-red-100 text-red-800 border-red-300", icon: XCircle },
  RENOVADO: { color: "bg-purple-50 text-purple-700 border-purple-200", icon: CheckCircle2 },
}

export default function ContractosPage() {
  const [contratos, setContratos] = React.useState<any[]>([])
  const [filteredContratos, setFilteredContratos] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [estadoFiltro, setEstadoFiltro] = React.useState<string>("all")
  const [selectedContrato, setSelectedContrato] = React.useState<any | null>(null)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)

  const loadContratos = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await httpClient("/api/contratos")
      if (res.ok) {
        const data = await res.json()
        setContratos(data)
      } else if (res.status === 403) {
        toast.error("No tienes permiso para ver contratos")
      } else {
        toast.error("Error al cargar contratos")
      }
    } catch (error) {
      toast.error("Error al cargar contratos")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadContratos()
  }, [loadContratos])

  React.useEffect(() => {
    let filtered = contratos

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.numero_contrato.toLowerCase().includes(term) ||
          c.cliente_nombre?.toLowerCase().includes(term) ||
          c.cliente_dni?.toLowerCase().includes(term)
      )
    }

    if (estadoFiltro && estadoFiltro !== "all") {
      filtered = filtered.filter((c) => c.estado === estadoFiltro)
    }

    setFilteredContratos(filtered)
  }, [contratos, searchTerm, estadoFiltro])

  const handleCambiarEstado = async (contratoId: number, nuevoEstado: string) => {
    try {
      const res = await httpClient(`/api/contratos/${contratoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: nuevoEstado,
          asesor_nombre: "Sistema",
          razon_cambio: `Cambio de estado a ${nuevoEstado}`,
        }),
      })

      if (res.ok) {
        toast.success("Contrato actualizado")
        loadContratos()
        setIsDetailOpen(false)
      }
    } catch (error) {
      toast.error("Error al actualizar contrato")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Contratos</h1>
          <p className="text-muted-foreground">
            Total: {contratos.length} contratos
          </p>
        </div>
        <Button className="bg-sky-600 hover:bg-sky-700">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Contrato
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Búsqueda y Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[250px]">
              <Input
                placeholder="Buscar por nº contrato, cliente o DNI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10"
              />
            </div>
            <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por estado..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.keys(ESTADO_BADGES).map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    {estado.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredContratos.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">No hay contratos para mostrar</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Contrato</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Operadora</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContratos.map((contrato) => {
                const estadoBadge = ESTADO_BADGES[contrato.estado as keyof typeof ESTADO_BADGES]
                const IconEstado = estadoBadge?.icon || AlertCircle

                return (
                  <TableRow key={contrato.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono font-bold">
                      {contrato.numero_contrato}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{contrato.cliente_nombre}</span>
                        <span className="text-xs text-muted-foreground">
                          {contrato.cliente_dni}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{contrato.operadora_destino}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {contrato.tipo_contrato}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${estadoBadge?.color} border`}
                        variant="outline"
                      >
                        <IconEstado className="h-3 w-3 mr-1" />
                        {contrato.estado.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(contrato.fecha_inicio), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="font-bold">
                      {contrato.precio_total.toFixed(2)}€
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedContrato(contrato)
                          setIsDetailOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {selectedContrato && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalles del Contrato</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Información del Contrato */}
              <div className="space-y-2">
                <h3 className="font-bold text-lg">Información General</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nº Contrato</p>
                    <p className="font-mono font-bold">{selectedContrato.numero_contrato}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Estado</p>
                    <Badge className={ESTADO_BADGES[selectedContrato.estado as keyof typeof ESTADO_BADGES]?.color}>
                      {selectedContrato.estado}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tipo</p>
                    <p>{selectedContrato.tipo_contrato}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Operadora</p>
                    <p>{selectedContrato.operadora_destino}</p>
                  </div>
                </div>
              </div>

              {/* Cliente */}
              <div className="space-y-2">
                <h3 className="font-bold text-lg">Cliente</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nombre</p>
                    <p>{selectedContrato.cliente_nombre}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">DNI</p>
                    <p>{selectedContrato.cliente_dni}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Teléfono</p>
                    <p>{selectedContrato.cliente_phone}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="text-xs break-all">{selectedContrato.cliente_email}</p>
                  </div>
                </div>
              </div>

              {/* Fechas */}
              <div className="space-y-2">
                <h3 className="font-bold text-lg">Fechas</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Fecha Inicio</p>
                    <p>{format(new Date(selectedContrato.fecha_inicio), "dd/MM/yyyy")}</p>
                  </div>
                  {selectedContrato.fecha_renovacion && (
                    <div>
                      <p className="text-muted-foreground">Renovación</p>
                      <p>{format(new Date(selectedContrato.fecha_renovacion), "dd/MM/yyyy")}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Servicios */}
              <div className="space-y-2">
                <h3 className="font-bold text-lg">Servicios</h3>
                {Array.isArray(selectedContrato.servicios) && selectedContrato.servicios.length > 0 ? (
                  <ul className="space-y-1 text-sm">
                    {selectedContrato.servicios.map((s: any, idx: number) => (
                      <li key={idx} className="flex justify-between">
                        <span>{s.nombre}</span>
                        <span className="font-bold">{s.precio}€</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">Sin servicios registrados</p>
                )}
              </div>

              {/* Cambiar Estado */}
              <div className="space-y-3 border-t pt-4">
                <h3 className="font-bold">Cambiar Estado</h3>
                <div className="flex gap-2 flex-wrap">
                  {Object.keys(ESTADO_BADGES).map((estado) => (
                    <Button
                      key={estado}
                      variant={selectedContrato.estado === estado ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleCambiarEstado(selectedContrato.id, estado)}
                    >
                      {estado.replace(/_/g, " ")}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
