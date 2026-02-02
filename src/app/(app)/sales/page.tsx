"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusCircle, Loader2, RefreshCw, AlertCircle } from "lucide-react"

export default function SalesPage() {
  const [salesList, setSalesList] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchSales = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api2/sales')
      if (!res.ok) throw new Error(`Error del servidor: ${res.status}`)
      
      const data = await res.json()
      setSalesList(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message || "Error al conectar con la API")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchSales()
  }, [])

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle className="text-2xl font-black">Historial de Ventas</CardTitle>
                <CardDescription>Visualiza las ventas registradas en CRM</CardDescription>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={fetchSales} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                <Button asChild size="sm" className="gap-1 bg-blue-600 hover:bg-blue-700">
                    <Link href="/sales/new">
                        <PlusCircle className="h-4 w-4" />
                        Nueva Venta
                    </Link>
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4 flex items-center gap-2 border border-red-100">
                <AlertCircle className="h-5 w-5" />
                <p>Ocurrió un error: {error}. Asegúrate de que XAMPP y MySQL estén activos.</p>
            </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 text-muted-foreground italic">
            <Loader2 className="h-10 w-10 animate-spin mb-2" /> 
            Consultando base de datos...
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Servicios Contratados</TableHead>
                  <TableHead>Operador Destino</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Precio Cierre</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                      No hay ventas registradas en el sistema.
                    </TableCell>
                  </TableRow>
                ) : (
                  salesList.map((sale) => (
                    <TableRow key={sale.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                            <span className="font-bold">{sale.clientName || 'Cliente desconocido'}</span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {sale.clienteId}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                          <div className="flex flex-wrap gap-1">
                              {sale.servicios?.map((s: any, i: number) => (
                                  <Badge key={i} variant="secondary" className="text-[10px] font-normal">
                                      {s.nombre}
                                  </Badge>
                              ))}
                          </div>
                      </TableCell>
                      <TableCell className="font-medium text-blue-600">
                        {sale.operadorDestino}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                          {new Date(sale.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right font-black text-blue-900">
                          {sale.precioCierre}€
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          Completada
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}