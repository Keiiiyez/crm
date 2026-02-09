"use client"

import * as React from "react"
import { 
  Search, Loader2, CheckCircle2, Clock, AlertCircle, 
  DollarSign, TrendingUp, Eye, FileDownload 
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
  DialogFooter,
} from "@/components/ui/dialog"
import { Input as FormInput } from "@/components/ui/input"
import { Button as FormButton } from "@/components/ui/button"

const ESTADO_PAGO_BADGES = {
  PENDIENTE: { color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  PAGADA: { color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 },
  DEDUCIDA: { color: "bg-blue-50 text-blue-700 border-blue-200", icon: CheckCircle2 },
  CANCELADA: { color: "bg-red-50 text-red-700 border-red-200", icon: AlertCircle },
}

export default function ComisionesPage() {
  const [comisiones, setComisiones] = React.useState<any[]>([])
  const [filteredComisiones, setFilteredComisiones] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [estadoPago, setEstadoPago] = React.useState<string>("all")
  const [selectedComision, setSelectedComision] = React.useState<any | null>(null)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = React.useState(false)
  const [paymentData, setPaymentData] = React.useState({
    estado_pago: "",
    fecha_pago: "",
    numero_transferencia: "",
  })

  const loadComisiones = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/comisiones")
      if (res.ok) {
        const data = await res.json()
        setComisiones(data)
      }
    } catch (error) {
      toast.error("Error al cargar comisiones")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadComisiones()
  }, [loadComisiones])

  React.useEffect(() => {
    let filtered = comisiones

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.cliente_nombre?.toLowerCase().includes(term) ||
          c.asesor_nombre?.toLowerCase().includes(term) ||
          c.numero_contrato?.toLowerCase().includes(term)
      )
    }

    if (estadoPago && estadoPago !== "all") {
      filtered = filtered.filter((c) => c.estado_pago === estadoPago)
    }

    setFilteredComisiones(filtered)
  }, [comisiones, searchTerm, estadoPago])

  const stats = React.useMemo(() => {
    const totalComisiones = comisiones.reduce((acc, c) => acc + (c.monto_comision || 0), 0)
    const pendiente = comisiones
      .filter((c) => c.estado_pago === "PENDIENTE")
      .reduce((acc, c) => acc + (c.monto_comision || 0), 0)
    const pagadas = comisiones
      .filter((c) => c.estado_pago === "PAGADA")
      .reduce((acc, c) => acc + (c.monto_comision || 0), 0)

    return { totalComisiones, pendiente, pagadas }
  }, [comisiones])

  const handleMarcarPaga = async () => {
    if (!selectedComision) return

    try {
      const res = await fetch(`/api/comisiones/${selectedComision.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...paymentData,
          usuario_nombre: "Sistema",
        }),
      })

      if (res.ok) {
        toast.success("Comisión marcada como pagada")
        loadComisiones()
        setIsPaymentOpen(false)
        setPaymentData({
          estado_pago: "",
          fecha_pago: "",
          numero_transferencia: "",
        })
      }
    } catch (error) {
      toast.error("Error al actualizar comisión")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Comisiones</h1>
          <p className="text-muted-foreground">Control y gestión de comisiones por ventas</p>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Comisiones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {stats.totalComisiones.toFixed(2)}€
              </div>
              <DollarSign className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pendiente de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-amber-600">
                {stats.pendiente.toFixed(2)}€
              </div>
              <Clock className="h-8 w-8 text-amber-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pagadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-green-600">
                {stats.pagadas.toFixed(2)}€
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Búsqueda y filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Búsqueda y Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[250px]">
              <Input
                placeholder="Buscar por cliente, asesor o contrato..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10"
              />
            </div>
            <Select value={estadoPago} onValueChange={setEstadoPago}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por estado..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.keys(ESTADO_PAGO_BADGES).map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    {estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de comisiones */}
      <div className="rounded-lg border">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredComisiones.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">No hay comisiones para mostrar</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Contrato</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Asesor</TableHead>
                <TableHead>Operadora</TableHead>
                <TableHead>Tipo Venta</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Comisión</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredComisiones.map((comision) => {
                const estadoBadge = ESTADO_PAGO_BADGES[comision.estado_pago as keyof typeof ESTADO_PAGO_BADGES]
                const IconEstado = estadoBadge?.icon || AlertCircle

                return (
                  <TableRow key={comision.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono font-bold text-xs">
                      {comision.numero_contrato || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{comision.cliente_nombre}</span>
                        <span className="text-xs text-muted-foreground">
                          {comision.cliente_dni}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{comision.asesor_nombre}</TableCell>
                    <TableCell className="text-sm">{comision.operadora}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {comision.tipo_venta}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold">
                      {comision.precio_venta.toFixed(2)}€
                    </TableCell>
                    <TableCell className="font-bold text-blue-600">
                      {comision.monto_comision.toFixed(2)}€
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${estadoBadge?.color} border`}
                        variant="outline"
                      >
                        <IconEstado className="h-3 w-3 mr-1" />
                        {comision.estado_pago}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedComision(comision)
                          setIsDetailOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {comision.estado_pago === "PENDIENTE" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedComision(comision)
                            setIsPaymentOpen(true)
                          }}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Modal de detalles */}
      {selectedComision && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalles de la Comisión</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground">Asesor</p>
                  <p className="font-medium">{selectedComision.asesor_nombre}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Operadora</p>
                  <p className="font-medium">{selectedComision.operadora}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tipo de Venta</p>
                  <p className="font-medium">{selectedComision.tipo_venta}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fecha de Venta</p>
                  <p className="font-medium">
                    {format(new Date(selectedComision.fecha_venta), "dd/MM/yyyy")}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between">
                  <span>Precio Venta:</span>
                  <span className="font-bold">{selectedComision.precio_venta.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between">
                  <span>Porcentaje:</span>
                  <span>{selectedComision.porcentaje_comision}%</span>
                </div>
                <div className="flex justify-between text-blue-600">
                  <span>Comisión Total:</span>
                  <span className="font-bold text-lg">{selectedComision.monto_comision.toFixed(2)}€</span>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between">
                  <span>Asesor recibe:</span>
                  <span className="font-bold">{selectedComision.comision_asesor?.toFixed(2) || 0}€</span>
                </div>
                {selectedComision.coordinador_nombre && (
                  <div className="flex justify-between">
                    <span>Coordinador ({selectedComision.coordinador_nombre}):</span>
                    <span className="font-bold">{selectedComision.comision_coordinador?.toFixed(2) || 0}€</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <p className="text-muted-foreground">Estado</p>
                <Badge className={ESTADO_PAGO_BADGES[selectedComision.estado_pago as keyof typeof ESTADO_PAGO_BADGES]?.color}>
                  {selectedComision.estado_pago}
                </Badge>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de marcar como pagada */}
      {selectedComision && (
        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Pago de Comisión</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Comisión: {selectedComision.monto_comision.toFixed(2)}€
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Estado de Pago</label>
                <Select
                  value={paymentData.estado_pago}
                  onValueChange={(val) =>
                    setPaymentData({ ...paymentData, estado_pago: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar estado..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAGADA">Pagada</SelectItem>
                    <SelectItem value="DEDUCIDA">Deducida</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Fecha de Pago</label>
                <FormInput
                  type="date"
                  value={paymentData.fecha_pago}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, fecha_pago: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Nº Transferencia/Referencia</label>
                <FormInput
                  placeholder="Ref. transferencia bancaria"
                  value={paymentData.numero_transferencia}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, numero_transferencia: e.target.value })
                  }
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleMarcarPaga} className="bg-sky-600 hover:bg-sky-700">
                  Registrar Pago
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
