"use client"

import * as React from "react"
import { 
  Plus, Trash2, Loader2, Wifi, Smartphone, 
  Briefcase, X
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

export default function ProductsPage() {
  const [products, setProducts] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  
  const [form, setForm] = React.useState({
    category: "COMBO",
    name: "",
    price: "",
    operator: "VODAFONE",
    type: "PORTABILIDAD",
    fiber: "600", 
    landline: true, 
    mobile_main_gb: "ILIMITADOS",
    mobile_main_speed: "5G",
  })

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api2/products')
      const result = await res.json()
      if (res.ok) setProducts(Array.isArray(result) ? result : [])
    } catch (error) { toast.error("Error al cargar catálogo") } finally { setIsLoading(false) }
  }

  React.useEffect(() => { fetchProducts() }, [])

  React.useEffect(() => {
    let suggestedName = ""
    if (form.category === "COMBO") suggestedName = `Pack ${form.fiber}Mb + ${form.mobile_main_gb}`
    if (form.category === "FIBRA_SOLA") suggestedName = `Solo Fibra ${form.fiber}Mb`
    if (form.category === "MOVIL_SOLO") suggestedName = `Línea Móvil ${form.mobile_main_gb}`
    setForm(prev => ({ ...prev, name: suggestedName }))
  }, [form.category, form.fiber, form.mobile_main_gb])

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const res = await fetch('/api2/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, price: parseFloat(form.price) }),
      })
      if (res.ok) {
        toast.success("Producto registrado")
        setForm({ ...form, price: "" })
        fetchProducts()
      }
    } catch (error) { toast.error("Error al guardar") } finally { setIsSaving(false) }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("¿Eliminar este producto del catálogo?")) return
    try {
      const res = await fetch(`/api2/products?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success("Producto eliminado")
        fetchProducts()
      }
    } catch (error) { toast.error("No se pudo eliminar") }
  }

  return (
    <div className="space-y-8 p-8 bg-slate-50/50 min-h-screen">
      <div className="flex justify-between items-end px-4 text-left">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 flex items-center gap-3 uppercase">
            <Briefcase className="h-8 w-8 text-cyan-500" /> Añadir servicios
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Configura y añade servicios al catálogo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
        
        {/* PANEL CONFIGURADOR */}
        <Card className="lg:col-span-5 rounded-[2.5rem] border-none shadow-2xl shadow-cyan-900/5 bg-white overflow-hidden h-fit">
          <CardHeader className="p-8 pb-4 bg-slate-900 text-white">
            <CardTitle className="text-xl font-black uppercase tracking-tighter">Constructor</CardTitle>
          </CardHeader>

          <CardContent className="p-8 space-y-6">
            <form onSubmit={handleAddProduct} className="space-y-6">
              
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Tipo de Activo</Label>
                <ToggleGroup type="single" value={form.category} onValueChange={(v) => v && setForm({...form, category: v})} className="justify-start gap-2">
                  <ToggleGroupItem value="COMBO" className="rounded-xl flex-1 font-black text-[9px] uppercase border-none bg-slate-100 data-[state=active]:bg-cyan-500 data-[state=active]:text-white transition-all">Combo</ToggleGroupItem>
                  <ToggleGroupItem value="FIBRA_SOLA" className="rounded-xl flex-1 font-black text-[9px] uppercase border-none bg-slate-100 data-[state=active]:bg-indigo-500 data-[state=active]:text-white transition-all">Solo Fibra</ToggleGroupItem>
                  <ToggleGroupItem value="MOVIL_SOLO" className="rounded-xl flex-1 font-black text-[9px] uppercase border-none bg-slate-100 data-[state=active]:bg-emerald-500 data-[state=active]:text-white transition-all">Móvil</ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Operadora</Label>
                  <Select value={form.operator} onValueChange={(v) => setForm({...form, operator: v})}>
                    <SelectTrigger className="bg-slate-50 border-none rounded-xl font-bold h-10 text-[10px] uppercase shadow-inner">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      {["VODAFONE", "MOVISTAR", "ORANGE", "DIGI", "MASMOVIL"].map(op => (
                        <SelectItem key={op} value={op} className="text-[10px] font-bold">{op}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Modalidad</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({...form, type: v})}>
                    <SelectTrigger className="bg-slate-50 border-none rounded-xl font-bold h-10 text-[10px] uppercase shadow-inner">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      {["PORTABILIDAD", "ALTA NUEVA", "MIGRACIÓN"].map(t => (
                        <SelectItem key={t} value={t} className="text-[10px] font-bold">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Nombre de la Oferta</Label>
                <Input 
                  value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                  className="bg-slate-50 border-none rounded-xl font-bold h-11 text-xs shadow-inner"
                />
              </div>

              {(form.category === "COMBO" || form.category === "FIBRA_SOLA") && (
                <div className="p-4 bg-slate-50 rounded-2xl space-y-3 border border-slate-100 shadow-sm animate-in fade-in slide-in-from-top-1">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] font-black uppercase text-slate-600 flex items-center gap-2">
                      <Wifi className="h-3 w-3 text-cyan-500" /> Fibra
                    </Label>
                    {form.category === "COMBO" && (
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black text-slate-400 uppercase">Fijo</span>
                        <Switch checked={form.landline} onCheckedChange={(v) => setForm({...form, landline: v})} />
                      </div>
                    )}
                  </div>
                  <ToggleGroup type="single" value={form.fiber} onValueChange={(v) => v && setForm({...form, fiber: v})} className="justify-start gap-2">
                    {["300", "600", "1000"].map(v => (
                      <ToggleGroupItem key={v} value={v} className="flex-1 rounded-xl bg-white border border-slate-200 font-black text-[10px] data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-600">
                        {v} MB
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              )}

              {(form.category === "COMBO" || form.category === "MOVIL_SOLO") && (
                <div className="p-4 bg-cyan-50/30 rounded-2xl space-y-3 border border-cyan-100 shadow-sm animate-in fade-in slide-in-from-top-1">
                  <Label className="text-[10px] font-black uppercase text-cyan-600 flex items-center gap-2">
                    <Smartphone className="h-3 w-3" /> Móvil
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      placeholder="GB" 
                      value={form.mobile_main_gb} onChange={(e) => setForm({...form, mobile_main_gb: e.target.value.toUpperCase()})}
                      className="bg-white border-none rounded-xl font-bold h-10 text-xs shadow-sm"
                    />
                    <Select value={form.mobile_main_speed} onValueChange={(v) => setForm({...form, mobile_main_speed: v})}>
                      <SelectTrigger className="bg-white border-none rounded-xl font-bold h-10 text-[10px] shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-2xl">
                        {["4G", "5G"].map(v => <SelectItem key={v} value={v} className="text-[10px] font-bold">{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Precio Mensual (€)</Label>
                <div className="relative mt-2">
                  <Input 
                    type="number" step="0.01" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})}
                    className="bg-cyan-500 border-none rounded-xl font-black text-white h-14 text-2xl pl-6 placeholder:text-cyan-200 shadow-lg"
                    placeholder="0.00" required
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-white/50 font-black">EUR</span>
                </div>
              </div>

              <Button type="submit" disabled={isSaving} className="w-full h-14 bg-slate-900 hover:bg-cyan-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-slate-200">
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlusCircle className="h-5 w-5 mr-2" />}
                Publicar Oferta
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* TABLA DE PRODUCTOS */}
        <Card className="lg:col-span-7 rounded-[2.5rem] border-none shadow-2xl shadow-cyan-900/5 bg-white overflow-hidden">
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-[10px] font-black uppercase text-slate-400">Producto</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400">Especificaciones</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 text-right">Precio</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-all group">
                    <TableCell className="py-6">
                      <div className="flex flex-col gap-2">
                        <span className="font-black text-slate-800 text-xs uppercase tracking-tighter leading-none">{p.name}</span>
                        <div className="flex gap-1.5">
                          <Badge className="bg-slate-900 text-white text-[7px] font-black px-1.5 py-0 rounded border-none">{p.operator}</Badge>
                          <Badge className="bg-slate-100 text-slate-500 text-[7px] font-black px-1.5 py-0 border-none">
                            {p.category?.replace('_', ' ') || 'GENERAL'}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        {(p.category === 'COMBO' || p.category === 'FIBRA_SOLA') && (
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-600 uppercase">
                            <Wifi className="h-3 w-3 text-cyan-500" /> {p.fiber}MB 
                            {p.landline && <span className="text-emerald-500 text-[8px] bg-emerald-50 px-1 rounded ml-1">FIJO</span>}
                          </div>
                        )}
                        {(p.category === 'COMBO' || p.category === 'MOVIL_SOLO') && (
                          <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-600 uppercase">
                            <Smartphone className="h-3 w-3 text-cyan-500" /> {p.mobile_main_gb} {p.mobile_main_speed}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-xl font-black text-slate-800 tracking-tighter">{Number(p.price).toFixed(2)}</span>
                          <span className="text-[10px] font-black text-cyan-500 uppercase">€</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteProduct(p.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all rounded-full h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

function PlusCircle(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M8 12h8" /><path d="M12 8v8" />
    </svg>
  )
}