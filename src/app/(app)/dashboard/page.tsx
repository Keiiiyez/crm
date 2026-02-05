"use client"

import * as React from "react"
import { 
  DollarSign, Users, Package, ShoppingCart, Loader2, 
  TrendingUp, Clock, CheckCircle2, AlertCircle 
} from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

import { SalesChart } from "@/components/sales-chart"
import { StatusPieChart } from "@/components/status-pie-chart"
import { OperatorSalesPieChart } from "@/components/operator-sales-pie-chart"

export default function DashboardPage() {
  const [sales, setSales] = React.useState<any[]>([])
  const [metrics, setMetrics] = React.useState({ clients: 0, products: 0 })
  const [loading, setLoading] = React.useState(true)

  const loadData = React.useCallback(async () => {
    try {
      const [sRes, cRes, pRes] = await Promise.all([
        fetch('/api2/sales').then(res => res.json()),
        fetch('/api/clients').then(res => res.json()),
        fetch('/api2/products').then(res => res.json())
      ])
      setSales(Array.isArray(sRes) ? sRes : [])
      setMetrics({ clients: cRes.length || 0, products: pRes.length || 0 })
    } catch (e) {
      toast.error("Error al sincronizar datos")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { loadData() }, [loadData])

  const stats = React.useMemo(() => {
    const tramitadas = sales.filter(s => s.status === 'Tramitada')
    const pendientes = sales.filter(s => s.status === 'Pendiente')
    const canceladas = sales.filter(s => s.status === 'Cancelada')

    const ingresoReal = tramitadas.reduce((acc, s) => acc + (Number(s.precioCierre) || 0), 0)
    const ingresoPendiente = pendientes.reduce((acc, s) => acc + (Number(s.precioCierre) || 0), 0)
    const tasaExito = sales.length > 0 ? ((tramitadas.length / sales.length) * 100).toFixed(1) : "0"

    return { ingresoReal, ingresoPendiente, tasaExito, canceladas: canceladas.length }
  }, [sales])

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center bg-slate-50/30">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Analizando Operaciones</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-8 p-8 bg-slate-50/50 min-h-screen text-slate-900">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-cyan-500" /> DASHBOARD
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Gestión de Ventas y Rendimiento</p>
        </div>
        <Badge className="bg-white text-cyan-600 border-cyan-100 shadow-sm font-bold rounded-lg px-4 py-1 uppercase tracking-tighter">En linea</Badge>
      </div>

      {/* METRICAS PRINCIPALES */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Ingreso" value={`${stats.ingresoReal.toLocaleString('es-ES')} €`} icon={CheckCircle2} desc="Ventas finalizadas" color="text-emerald-500" />
        <StatCard title="Proceso" value={`${stats.ingresoPendiente.toLocaleString('es-ES')} €`} icon={Clock} desc="Ventas por tramitar" color="text-cyan-500" />
        <StatCard title="Efectividad" value={`${stats.tasaExito}%`} icon={TrendingUp} desc="Ratio de éxito" color="text-blue-500" />
        <StatCard title="Canceladas" value={stats.canceladas.toString()} icon={AlertCircle} desc="Ventas perdidas" color="text-red-500" />
      </div>

      <div className="grid gap-8 md:grid-cols-7">
        {/* GRÁFICO DE BARRAS PRINCIPAL */}
        <Card className="md:col-span-4 border-none shadow-2xl shadow-cyan-900/5 rounded-[2.5rem] bg-white">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-cyan-600">Evolución de Ingresos</CardTitle>
            <CardDescription className="text-[10px] font-bold text-slate-400">Volumen mensual de ventas tramitadas</CardDescription>
          </CardHeader>
          <CardContent className="p-8 h-[350px]">
            <SalesChart data={sales} />
          </CardContent>
        </Card>

        {/* GRÁFICO POR OPERADORAS */}
        <Card className="md:col-span-3 border-none shadow-2xl shadow-cyan-900/5 rounded-[2.5rem] bg-white">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-cyan-600">Ventas por operador</CardTitle>
            <CardDescription className="text-[10px] font-bold text-slate-400">Distribución de facturación activa</CardDescription>
          </CardHeader>
          <CardContent className="p-8 h-[350px]">
            <OperatorSalesPieChart data={sales} />
          </CardContent>
        </Card>

        {/* GRÁFICO POR ESTADOS */}
        <Card className="md:col-span-3 border-none shadow-2xl shadow-cyan-900/5 rounded-[2.5rem] bg-white">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Estado de Operaciones</CardTitle>
            <CardDescription className="text-[10px] font-bold text-slate-400">Porcentaje de éxito vs riesgo</CardDescription>
          </CardHeader>
          <CardContent className="p-8 h-[350px]">
            <StatusPieChart data={sales} />
          </CardContent>
        </Card>

        {/* TABLA DE ÚLTIMOS MOVIMIENTOS */}
        <Card className="md:col-span-4 border-none shadow-2xl shadow-cyan-900/5 rounded-[2.5rem] bg-white overflow-hidden">
          <CardHeader className="p-8 border-b border-slate-50">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">Historial</CardTitle>
          </CardHeader>
          <div className="overflow-auto max-h-[350px]">
            <Table>
              <TableBody>
                {sales.length > 0 ? sales.slice(0, 10).map((sale) => (
                  <TableRow key={sale.id} className="hover:bg-cyan-50/20 border-slate-50 transition-colors">
                    <TableCell className="py-4 px-8">
                      <div className="font-bold text-slate-700 text-xs truncate max-w-[140px]">{sale.clientName}</div>
                      <span className="text-[9px] text-cyan-600 uppercase font-black tracking-tighter">{sale.operadorDestino || 'N/A'}</span>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border-none ${
                        sale.status === 'Tramitada' ? 'bg-emerald-50 text-emerald-600' :
                        sale.status === 'Cancelada' ? 'bg-red-50 text-red-600' : 'bg-cyan-50 text-cyan-600'
                      }`}>
                        {sale.status || 'Pendiente'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 px-8 text-right font-black text-slate-900 text-xs">
                      {(Number(sale.precioCierre) || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-40 text-center text-[10px] font-black uppercase text-slate-300">
                      Sin datos disponibles
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, desc, color }: any) {
  return (
    <Card className="border-none shadow-xl shadow-cyan-900/5 rounded-[2rem] bg-white overflow-hidden group hover:scale-[1.02] transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 bg-slate-50 rounded-2xl ${color} group-hover:bg-cyan-600 group-hover:text-white transition-colors`}>
            <Icon size={18} />
          </div>
        </div>
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{title}</p>
        <h3 className="text-2xl font-black text-slate-800 tracking-tighter leading-none mt-1">{value}</h3>
        <p className="text-[9px] font-bold text-slate-400 mt-1.5 opacity-70">{desc}</p>
      </CardContent>
    </Card>
  )
}