"use client"

import * as React from "react"
import { DollarSign, Users, Package, ShoppingCart, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

import { SalesChart } from "@/components/sales-chart"
import type { Sale } from "@/lib/definitions"

export default function DashboardPage() {
  const [sales, setSales] = React.useState<Sale[]>([])
  const [metrics, setMetrics] = React.useState({ clients: 0, products: 0 })
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadDashboard() {
      try {
        const [sRes, cRes, pRes] = await Promise.all([
          fetch('/api2/sales'),
          fetch('/api/clients'),
          fetch('/api2/products')
        ])

        if (sRes.ok && cRes.ok && pRes.ok) {
          setSales(await sRes.json())
          const clients = await cRes.json()
          const products = await pRes.json()
          setMetrics({ clients: clients.length, products: products.length })
        }
      } catch (e) {
        toast.error("Error cargando datos")
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

  const revenue = sales.reduce((acc, s) => s.status === 'Completed' ? acc + Number(s.amount) : acc, 0)

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  )

  return (
    <div className="space-y-6 p-4">
      {/* Tarjetas de Estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Ingresos" value={`$${revenue.toFixed(2)}`} icon={<DollarSign />} desc="Ventas completadas" />
        <StatCard title="Clientes" value={`+${metrics.clients}`} icon={<Users />} desc="Total en base de datos" />
        <StatCard title="Ventas" value={`+${sales.length}`} icon={<ShoppingCart />} desc="Transacciones totales" />
        <StatCard title="Catálogo" value={`${metrics.products}`} icon={<Package />} desc="Productos activos" />
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        {/* Gráfico principal */}
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Rendimiento Comercial</CardTitle>
            <CardDescription>Visualización de ventas mensuales</CardDescription>
          </CardHeader>
          <CardContent>
            <SalesChart />
          </CardContent>
        </Card>

        {/* Tabla de ventas recientes */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Últimos Movimientos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente/Operador</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.slice(0, 6).map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <div className="font-medium text-sm">{sale.clientName}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">{sale.operatorName}</div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      ${Number(sale.amount).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, desc }: { title: string, value: string, icon: React.ReactNode, desc: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
        <div className="text-primary">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-[10px] text-muted-foreground mt-1">{desc}</p>
      </CardContent>
    </Card>
  )
}