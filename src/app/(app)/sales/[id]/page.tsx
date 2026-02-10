"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Printer, BadgeCheck } from "lucide-react"
import { httpClient } from "@/lib/http-client"

export default function SaleDetail() {
  const params = useParams()
  const router = useRouter()
  const [sale, setSale] = React.useState<any>(null)

  React.useEffect(() => {
    httpClient(`/api2/sales/${params.id}`)
      .then(res => res.json())
      .then(data => setSale(data))
  }, [params.id])

  if (!sale) return <div className="p-10 text-center">Cargando detalles de la venta...</div>

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Volver al listado
      </Button>

      <Card className="border-sky-100 rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-sky-50 border-b border-sky-100 flex flex-row justify-between items-center">
          <div>
            <CardTitle className="text-sky-950">Contrato #{sale.id}</CardTitle>
            <p className="text-sky-600 text-sm font-medium">Estado: En tramitación</p>
          </div>
          <Button variant="outline" className="rounded-xl gap-2 bg-white">
            <Printer className="h-4 w-4" /> Imprimir PDF
          </Button>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
            {}
            <div className="grid grid-cols-2 gap-8">
                <div>
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Titular</h4>
                    <p className="font-bold text-slate-800 text-lg">{sale.clientName}</p>
                    <p className="text-slate-500">{sale.clienteDni}</p>
                </div>
                <div className="text-right">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Importe Total</h4>
                    <p className="font-black text-sky-600 text-3xl">{sale.precioCierre}€</p>
                </div>
            </div>
            {}
        </CardContent>
      </Card>
    </div>
  )
}