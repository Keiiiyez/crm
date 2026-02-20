"use client"

import * as React from "react"
import { 
  Gift, Trash2, Plus, Calendar, Tag, Layers, 
  ArrowRight, Sparkles, Clock, Percent 
} from "lucide-react"
import { toast } from "sonner"
import { httpClient } from "@/lib/http-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export default function PromotionsPage() {
  const [products, setProducts] = React.useState([])
  const [promotions, setPromotions] = React.useState([])
  const [isSaving, setIsSaving] = React.useState(false)
  
  const [form, setForm] = React.useState({
    nombre: "",
    producto_id: "",
    descuento_precio: "",
    fecha_fin: ""
  })

  const loadData = async () => {
    try {
      const [pRes, promRes] = await Promise.all([
        httpClient('/api2/products'),
        httpClient('/api/promotions')
      ])
      setProducts(await pRes.json())
      setPromotions(await promRes.json())
    } catch (e) { toast.error("Error al cargar datos") }
  }

  React.useEffect(() => { loadData() }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.producto_id) return toast.error("Selecciona un producto")
    setIsSaving(true)
    
    try {
      const res = await httpClient('/api/promotions', {
        method: 'POST',
        body: JSON.stringify(form)
      })
      if (res.ok) {
        toast.success("¡Promoción activada con éxito!")
        setForm({ nombre: "", producto_id: "", descuento_precio: "", fecha_fin: "" })
        loadData()
      }
    } catch (e) { toast.error("Error al guardar") } finally { setIsSaving(false) }
  }

  return (
    <div className="p-4 lg:p-8 bg-slate-50/50 min-h-screen space-y-8 text-left font-sans">
      
      {/* HEADER AL ESTILO DE TU CRM */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-white rounded-[1.5rem] shadow-sm border border-slate-100 flex items-center justify-center">
            <Gift className="h-7 w-7 text-rose-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">
             PROMOS <span className="text-slate-300 font-light">VIGENTES</span> 
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-0.5">Gestión de ofertas temporales y BTS</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1400px] mx-auto">
        
        {/* BUILDER DE PROMOS (IZQUIERDA) */}
        <Card className="lg:col-span-4 rounded-[2.5rem] border-none shadow-2xl bg-white h-fit overflow-hidden">
          <CardHeader className="p-8 bg-slate-900 text-white">
            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-rose-400" /> Configurar Descuento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <form onSubmit={handleSave} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nombre de la Campaña</label>
                <Input 
                  placeholder="EJ: BACK TO SCHOOL 2024" 
                  value={form.nombre}
                  onChange={e => setForm({...form, nombre: e.target.value.toUpperCase()})}
                  className="bg-slate-50 border-none h-12 rounded-xl font-bold text-xs uppercase"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Paquete a Aplicar</label>
                <Select value={form.producto_id} onValueChange={v => setForm({...form, producto_id: v})}>
                  <SelectTrigger className="bg-slate-50 border-none h-12 rounded-xl font-bold text-xs uppercase">
                    <SelectValue placeholder="SELECCIONAR PRODUCTO" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p: any) => (
                      <SelectItem key={p.id} value={p.id.toString()} className="text-[10px] font-bold uppercase">
                        {p.operator} - {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Descuento (€)</label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      placeholder="0.00"
                      value={form.descuento_precio}
                      onChange={e => setForm({...form, descuento_precio: e.target.value})}
                      className="bg-slate-50 border-none h-12 rounded-xl font-black text-rose-600"
                    />
                    <Tag className="absolute right-3 top-3.5 h-4 w-4 text-slate-300" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Vence el</label>
                  <Input 
                    type="date" 
                    value={form.fecha_fin}
                    onChange={e => setForm({...form, fecha_fin: e.target.value})}
                    className="bg-slate-50 border-none h-12 rounded-xl font-bold text-xs"
                  />
                </div>
              </div>

              <Button disabled={isSaving} className="w-full h-14 bg-rose-500 hover:bg-slate-900 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest transition-all shadow-lg active:scale-95 mt-4">
                {isSaving ? "Guardando..." : "Activar Oferta Ahora"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* LISTADO DE PROMOS ACTIVAS (DERECHA) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {promotions.map((prom: any) => (
              <Card key={prom.id} className="rounded-[2rem] border-none shadow-xl bg-white group hover:scale-[1.02] transition-all duration-300">
                <CardContent className="p-0">
                  <div className="p-6 border-b border-slate-50 flex justify-between items-start">
                    <div>
                      <Badge className="bg-rose-50 text-rose-600 border-none text-[8px] font-black px-2 py-0.5 mb-2 uppercase">Campaña Activa</Badge>
                      <h3 className="text-lg font-black text-slate-900 leading-tight uppercase tracking-tighter">{prom.nombre}</h3>
                      <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase italic">{prom.producto_nombre}</p>
                    </div>
                    <div className="h-10 w-10 bg-slate-50 rounded-full flex items-center justify-center text-rose-500">
                      <Percent className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="p-6 flex justify-between items-center bg-slate-50/30">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 uppercase">Ahorro Directo</span>
                      <span className="text-2xl font-black text-rose-600">-{Number(prom.descuento_precio).toFixed(2)}€</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] font-black text-slate-400 uppercase flex items-center gap-1"><Clock className="h-2 w-2"/> Expira</span>
                      <span className="text-[10px] font-black text-slate-700">{prom.fecha_fin || "SIN LÍMITE"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {promotions.length === 0 && (
              <div className="col-span-2 py-20 text-center border-2 border-dashed rounded-[3rem] border-slate-200">
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No hay promociones activas en este momento</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}