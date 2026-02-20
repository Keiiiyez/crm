"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { 
  Search, Loader2, CheckCircle2, Clock, AlertCircle, 
  DollarSign, Eye, Paperclip, FileUp
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"

const ESTADO_PAGO_BADGES = {
  PENDIENTE: { color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  PAGADA: { color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 },
  DEDUCIDA: { color: "bg-blue-50 text-blue-700 border-blue-200", icon: CheckCircle2 },
  CANCELADA: { color: "bg-red-50 text-red-700 border-red-200", icon: AlertCircle },
}

export default function ComisionesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  // Estados de datos
  const [comisiones, setComisiones] = React.useState<any[]>([])
  const [filteredComisiones, setFilteredComisiones] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  
  // Estados de UI
  const [searchTerm, setSearchTerm] = React.useState("")
  const [estadoPago, setEstadoPago] = React.useState<string>("all")
  const [selectedComision, setSelectedComision] = React.useState<any | null>(null)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [isPaymentOpen, setIsPaymentOpen] = React.useState(false)

  // Estados del Formulario de Pago
  const [paymentFile, setPaymentFile] = React.useState<File | null>(null)
  const [paymentData, setPaymentData] = React.useState({
    estado_pago: "",
    fecha_pago: format(new Date(), "yyyy-MM-dd"), // Fecha de hoy por defecto
    numero_transferencia: "",
  })

  // 1. Verificación de Seguridad
  React.useEffect(() => {
    if (!authLoading && user?.rol !== "ADMIN") {
      router.push("/unauthorized")
    }
  }, [user, authLoading, router])

  // 2. Carga de datos
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

  // 3. Filtros
  React.useEffect(() => {
    let filtered = comisiones
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(c => 
        c.cliente_nombre?.toLowerCase().includes(term) ||
        c.asesor_nombre?.toLowerCase().includes(term) ||
        c.numero_contrato?.toLowerCase().includes(term)
      )
    }
    if (estadoPago !== "all") {
      filtered = filtered.filter(c => c.estado_pago === estadoPago)
    }
    setFilteredComisiones(filtered)
  }, [comisiones, searchTerm, estadoPago])

  // 4. Estadísticas
  const stats = React.useMemo(() => {
    const total = comisiones.reduce((acc, c) => acc + (c.monto_comision || 0), 0)
    const pendiente = comisiones.filter(c => c.estado_pago === "PENDIENTE").reduce((acc, c) => acc + (c.monto_comision || 0), 0)
    const pagadas = comisiones.filter(c => c.estado_pago === "PAGADA").reduce((acc, c) => acc + (c.monto_comision || 0), 0)
    return { total, pendiente, pagadas }
  }, [comisiones])

  // 5. ACCIÓN: Registrar Pago con Archivo
  const handleMarcarPaga = async () => {
    if (!selectedComision) return
    if (!paymentData.estado_pago) return toast.error("Selecciona un estado de pago")

    const loadingToast = toast.loading("Registrando pago y subiendo archivo...")

    try {
      const formData = new FormData()
      formData.append("estado_pago", paymentData.estado_pago)
      formData.append("fecha_pago", paymentData.fecha_pago)
      formData.append("numero_transferencia", paymentData.numero_transferencia)
      if (paymentFile) formData.append("comprobante", paymentFile)

      const res = await fetch(`/api/comisiones/${selectedComision.id}`, {
        method: "PATCH",
        body: formData, // Enviamos como FormData, no JSON
      })

      if (res.ok) {
        toast.success("Pago registrado correctamente", { id: loadingToast })
        setIsPaymentOpen(false)
        setPaymentFile(null)
        loadComisiones()
      } else {
        throw new Error()
      }
    } catch (error) {
      toast.error("Error al procesar el pago", { id: loadingToast })
    }
  }

  if (authLoading || user?.rol !== "ADMIN") {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Comisiones de Agentes</h1>
          <p className="text-muted-foreground">Gestión financiera y justificantes de pago</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total" value={stats.total} icon={<DollarSign className="text-blue-500" />} />
        <StatCard title="Pendiente" value={stats.pendiente} icon={<Clock className="text-amber-500" />} color="text-amber-600" />
        <StatCard title="Pagadas" value={stats.pagadas} icon={<CheckCircle2 className="text-green-500" />} color="text-green-600" />
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <Input 
              className="flex-1 min-w-[300px]" 
              placeholder="Buscar contrato, cliente o asesor..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={estadoPago} onValueChange={setEstadoPago}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.keys(ESTADO_PAGO_BADGES).map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contrato</TableHead>
              <TableHead>Asesor/Cliente</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredComisiones.map((c) => {
              const BadgeConfig = ESTADO_PAGO_BADGES[c.estado_pago as keyof typeof ESTADO_PAGO_BADGES] || ESTADO_PAGO_BADGES.PENDIENTE
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs font-bold">{c.numero_contrato}</TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{c.asesor_nombre}</div>
                    <div className="text-xs text-muted-foreground">{c.cliente_nombre}</div>
                  </TableCell>
                  <TableCell className="font-bold text-blue-600">{c.monto_comision.toFixed(2)}€</TableCell>
                  <TableCell>
                    <Badge className={`${BadgeConfig.color} border`}>
                      <BadgeConfig.icon className="h-3 w-3 mr-1" />
                      {c.estado_pago}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {c.comprobante_url && (
                       <Button variant="outline" size="sm" onClick={() => window.open(c.comprobante_url)}>
                         <Paperclip className="h-4 w-4" />
                       </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedComision(c); setIsDetailOpen(true); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {c.estado_pago === "PENDIENTE" && (
                      <Button variant="default" size="sm" className="bg-emerald-600" onClick={() => { setSelectedComision(c); setIsPaymentOpen(true); }}>
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* MODAL PAGO */}
      <Dialog open={isPaymentOpen} onOpenChange={(open) => { setIsPaymentOpen(open); if(!open) setPaymentFile(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Pago</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Estado</label>
              <Select onValueChange={(v) => setPaymentData({...paymentData, estado_pago: v})}>
                <SelectTrigger><SelectValue placeholder="Seleccione estado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAGADA">Pagada (Transferencia)</SelectItem>
                  <SelectItem value="DEDUCIDA">Deducida (Ajuste)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Referencia / Nº Transf.</label>
              <Input onChange={(e) => setPaymentData({...paymentData, numero_transferencia: e.target.value})} />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Adjuntar Comprobante (Opcional)</label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  accept="image/*,.pdf"
                  onChange={(e) => setPaymentFile(e.target.files?.[0] || null)}
                />
                <FileUp className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">
                  {paymentFile ? paymentFile.name : "Haga clic o arrastre un archivo (PDF, PNG, JPG)"}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentOpen(false)}>Cancelar</Button>
            <Button onClick={handleMarcarPaga}>Confirmar Pago</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({ title, value, icon, color = "" }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color}`}>{value.toFixed(2)}€</div>
      </CardContent>
    </Card>
  )
}