"use client"

import * as React from "react"
import { 
  Plus, Trash2, Loader2, Wifi, Smartphone, 
  Briefcase, X, ListPlus, Tv, Check
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { httpClient } from "@/lib/http-client"
import { useAuth } from "@/lib/auth-context"
import { hasPermission } from "@/lib/permissions"

const GB_OPTIONS = ["25GB", "50GB", "100GB", "150GB", "ILIMITADOS"]
const STREAMING_OPTIONS = [
  { id: 'netflix', name: 'Netflix' },
  { id: 'disney', name: 'Disney+' },
  { id: 'prime', name: 'Prime Video' },
  { id: 'hbo', name: 'HBO Max' },
  { id: 'dazn', name: 'DAZN' },
]

export default function ProductsPage() {
  const { user } = useAuth()
  const canCreateProduct = user?.rol ? hasPermission(user.rol, "create_product") : false
  
  const [products, setProducts] = React.useState<any[]>([])
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
    extra_lines: [] as { gb: string, speed: string }[],
    tv_package: "SIN TV",
    streaming_services: [] as string[]
  })

 
  React.useEffect(() => {
    let parts = []
    if (form.category === "FIBRA_SOLA") {
      parts.push(form.fiber === "1" ? "FIBRA 1Gb" : `FIBRA ${form.fiber}Mb`   )
    } else {
      if (form.category === "COMBO") parts.push(form.fiber === "1" ? "1Gb FIBRA" : `${form.fiber}MB FIBRA`)
      parts.push(`${form.mobile_main_gb}`)
      if (form.extra_lines.length > 0) parts.push(`+ ${form.extra_lines.length} ADICIONALES`)
    }
    if (form.tv_package !== "SIN TV") parts.push("+ TV")
    
    setForm(prev => ({ ...prev, name: parts.join(" ").toUpperCase() }))
  }, [form.fiber, form.mobile_main_gb, form.extra_lines, form.tv_package, form.category])



  const httpClientProducts = async () => {
    try {
      const res = await httpClient('/api2/products')
      const data = await res.json()
      if (res.ok) setProducts(data)
    } catch (error) { toast.error("Error al cargar productos") }
  }

  React.useEffect(() => { httpClientProducts() }, [])

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const res = await httpClient('/api2/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, price: parseFloat(form.price) }),
      })
      if (res.ok) {
        toast.success("Producto guardado")
        setForm({ ...form, price: "", extra_lines: [], streaming_services: [], tv_package: "SIN TV" })
        httpClientProducts()
      }
    } catch (error) { toast.error("Error") } finally { setIsSaving(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Borrar?")) return
    await httpClient(`/api2/products/${id}`, { method: 'DELETE' })
    httpClientProducts()
  }

  return (
    <div className="space-y-8 p-8 bg-slate-50/50 min-h-screen text-left">
      <div className="px-4">
        <h1 className="text-3xl font-black tracking-tighter text-slate-800 flex items-center gap-3 uppercase">
          <Briefcase className="h-8 w-8 text-cyan-500" /> Agregar servicios al catálogo
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {canCreateProduct && (
        <Card className="lg:col-span-5 rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden h-fit">
          <CardHeader className="p-8 pb-4 bg-slate-900 text-white">
            <CardTitle className="text-xl font-black uppercase tracking-tighter">Añade nuevos servicios + </CardTitle>
          </CardHeader>

          <CardContent className="p-8 space-y-6">
            <form onSubmit={handleAddProduct} className="space-y-6">
              
              {}
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Operadora</Label>
                <ToggleGroup 
                  type="single" 
                  value={form.operator} 
                  onValueChange={(v) => v && setForm({...form, operator: v})} 
                  className="justify-start flex-wrap gap-2"
                >
                  {["VODAFONE", "ORANGE", "MOVISTAR", "DIGI", "MASMOVIL"].map(op => (
                    <ToggleGroupItem 
                      key={op} value={op} 
                      className="rounded-xl px-4 h-9 font-black text-[9px] border-none bg-slate-100 data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all shadow-sm"
                    >
                      {op}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              {}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase text-slate-400">Tipo de Activo</Label>
                  <ToggleGroup type="single" value={form.category} onValueChange={(v) => v && setForm({...form, category: v})} className="justify-start gap-1">
                    <ToggleGroupItem value="COMBO" className="rounded-lg flex-1 font-black text-[8px] bg-slate-100 data-[state=active]:bg-cyan-500 data-[state=active]:text-white">COMBO</ToggleGroupItem>
                    <ToggleGroupItem value="FIBRA_SOLA" className="rounded-lg flex-1 font-black text-[8px] bg-slate-100 data-[state=active]:bg-indigo-500 data-[state=active]:text-white">FIBRA</ToggleGroupItem>
                  </ToggleGroup>
                </div>

                <div className="space-y-1">
                  <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Modalidad</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({...form, type: v})}>
                    <SelectTrigger className="bg-slate-50 border-none rounded-xl font-bold h-10 text-[10px] uppercase shadow-inner">
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none font-bold text-[10px]">
                      <SelectItem value="PORTABILIDAD">PORTABILIDAD</SelectItem>
                      <SelectItem value="ALTA NUEVA">ALTA NUEVA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {}
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400">Nombre del Pack (Editable)</Label>
                <Input 
                  value={form.name} onChange={(e) => setForm({...form, name: e.target.value.toUpperCase()})}
                  className="bg-slate-50 border-none rounded-xl font-black h-11 text-xs shadow-inner text-cyan-600 uppercase"
                />
              </div>

              {}
              {(form.category === "COMBO" || form.category === "FIBRA_SOLA") && (
                <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] font-black uppercase text-slate-600 flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-cyan-500" /> Fibra
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-black text-slate-400 uppercase">Fijo</span>
                      <Switch checked={form.landline} onCheckedChange={(v) => setForm({...form, landline: v})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {["300", "600", "1"].map(v => (
                      <button key={v} type="button" onClick={() => setForm({...form, fiber: v})}
                        className={`py-2 rounded-xl text-[10px] font-black transition-all border-2 ${form.fiber === v ? "bg-white border-cyan-500 text-cyan-600 shadow-sm" : "bg-transparent border-transparent text-slate-400"}`}>
                        {v === "1" ? "1Gb" : `${v}Mb`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {}
              {(form.category === "COMBO" || form.category === "MOVIL_SOLO") && (
                <div className="p-5 bg-cyan-50/30 rounded-[2rem] border border-cyan-100 space-y-4">
                  <Label className="text-[10px] font-black uppercase text-cyan-600 flex items-center gap-2">
                    <Smartphone className="h-4 w-4" /> Móvil Principal
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {GB_OPTIONS.map(gb => (
                      <button key={gb} type="button" onClick={() => setForm({...form, mobile_main_gb: gb})}
                        className={`py-2 rounded-xl text-[9px] font-black border-2 transition-all ${form.mobile_main_gb === gb ? "bg-cyan-500 border-cyan-500 text-white" : "bg-white border-slate-100 text-slate-400"}`}>
                        {gb}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {}
              {form.category === "COMBO" && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-2">
                    <Label className="text-[9px] font-black uppercase text-slate-400">Adicionales</Label>
                    <Button type="button" onClick={() => setForm({...form, extra_lines: [...form.extra_lines, {gb: "25GB", speed: "5G"}]})} className="h-6 text-[8px] bg-slate-900 text-white rounded-lg px-3">
                      + AÑADIR MÓVIL
                    </Button>
                  </div>
                  {form.extra_lines.map((line, idx) => (
                    <div key={idx} className="flex gap-2 p-2 bg-slate-100 rounded-xl items-center animate-in slide-in-from-left-1">
                      <Select value={line.gb} onValueChange={(v) => {
                        const newLines = [...form.extra_lines]; newLines[idx].gb = v; setForm({...form, extra_lines: newLines})
                      }}>
                        <SelectTrigger className="h-8 border-none bg-white text-[10px] font-bold shadow-sm flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>{GB_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                      </Select>
                      <button type="button" onClick={() => setForm({...form, extra_lines: form.extra_lines.filter((_, i) => i !== idx)})} className="text-slate-400 hover:text-red-500 px-1">
                        <X className="h-4 w-4"/>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {}
              <div className="p-5 bg-indigo-50/50 rounded-[2rem] border border-indigo-100 space-y-4">
                <Label className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-2"><Tv className="h-4 w-4"/> Televisión y Streaming</Label>
                <Select value={form.tv_package} onValueChange={(v) => setForm({...form, tv_package: v})}>
                  <SelectTrigger className="bg-white border-none h-10 text-[10px] font-bold rounded-xl shadow-sm"><SelectValue /></SelectTrigger>
                  <SelectContent className="text-[10px] font-bold">
                    <SelectItem value="SIN TV">SIN TELEVISIÓN</SelectItem>
                    <SelectItem value="TV INICIAL">TV INICIAL (80+ CANALES)</SelectItem>
                    <SelectItem value="TV TOTAL">TV TOTAL (140+ CANALES)</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2">
                  {STREAMING_OPTIONS.map(ott => (
                    <button key={ott.id} type="button" 
                      onClick={() => setForm(f => ({ ...f, streaming_services: f.streaming_services.includes(ott.id) ? f.streaming_services.filter(x => x !== ott.id) : [...f.streaming_services, ott.id] }))}
                      className={`px-3 py-1.5 rounded-lg text-[8px] font-black transition-all border-2 ${form.streaming_services.includes(ott.id) ? "bg-slate-900 border-slate-900 text-white shadow-md" : "bg-white border-slate-100 text-slate-400"}`}>
                      {ott.name}
                    </button>
                  ))}
                </div>
              </div>

              {}
              <div className="relative pt-4">
                <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})}
                  className="bg-cyan-500 border-none rounded-2xl font-black text-white h-16 text-3xl pl-8 shadow-xl" placeholder="0.00" required />
                <span className="absolute right-8 top-1/2 translate-y-[-10%] text-white/40 font-black italic">€/MES</span>
              </div>

              <Button type="submit" disabled={isSaving} className="w-full h-14 bg-slate-900 hover:bg-cyan-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest transition-all">
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <ListPlus className="h-5 w-5 mr-2" />}
                Publicar en Catálogo
              </Button>
            </form>
          </CardContent>
        </Card>
        )}

        {}
        <Card className={`${canCreateProduct ? "lg:col-span-7" : "lg:col-span-12"} rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden`}>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-[10px] font-black uppercase text-slate-400">Oferta</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400">Detalles</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 text-right">Precio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id} className="border-b border-slate-50 group hover:bg-slate-50/50 transition-all">
                    <TableCell className="py-6">
                      <div className="flex flex-col gap-2">
                        <span className="font-black text-slate-800 text-xs uppercase tracking-tighter leading-none">{p.name}</span>
                        <div className="flex gap-1.5">
                          <Badge className="bg-slate-900 text-white text-[7px] font-black border-none px-2">{p.operator}</Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex gap-2">
                           {p.fiber && <Badge variant="outline" className="text-[8px] border-cyan-100 text-cyan-600 font-black tracking-tight">{p.fiber}MB</Badge>}
                           {p.mobile_main_gb && <Badge variant="outline" className="text-[8px] border-slate-100 text-slate-700 font-black tracking-tight">{p.mobile_main_gb}</Badge>}
                        </div>
                        {p.tv_package !== "SIN TV" && <span className="text-[8px] font-black text-indigo-500 uppercase flex items-center gap-1"><Tv className="h-2.5 w-2.5"/> {p.tv_package}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-xl font-black text-slate-800 tracking-tighter">{Number(p.price).toFixed(2)}€</span>
                      {canCreateProduct && (
                        <button onClick={() => handleDelete(p.id)} className="ml-4 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all">
                          <Trash2 className="h-4 w-4"/>
                        </button>
                      )}
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