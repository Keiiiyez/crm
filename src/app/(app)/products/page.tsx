"use client"

import * as React from "react"
import { 
  Plus, Trash2, Loader2, Wifi, Smartphone, 
  Briefcase, X, ListPlus, Tv, Check, FilterX, Layers,
  PlayCircle, Search, ChevronRight, Lock, Unlock, Edit3
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
import { cn } from "@/lib/utils"

const GB_OPTIONS = ["25GB", "50GB", "100GB", "150GB", "ILIMITADOS"]
const STREAMING_OPTIONS = [
  { id: 'netflix', name: 'Netflix', color: 'bg-red-600' },
  { id: 'disney', name: 'Disney+', color: 'bg-blue-800' },
  { id: 'prime', name: 'Prime Video', color: 'bg-sky-500' },
  { id: 'hbo', name: 'HBO Max', color: 'bg-indigo-600' },
  { id: 'dazn', name: 'DAZN', color: 'bg-zinc-900' },
]

const OPERATOR_THEMES: Record<string, { bg: string, text: string, border: string, shadow: string }> = {
  VODAFONE: { bg: "bg-[#E60000]", text: "text-white", border: "border-[#E60000]", shadow: "shadow-red-500/20" },
  ORANGE: { bg: "bg-[#FF7900]", text: "text-white", border: "border-[#FF7900]", shadow: "shadow-orange-500/20" },
  YOIGO: { bg: "bg-[#D119AE]", text: "text-white", border: "border-[#D119AE]", shadow: "shadow-purple-500/20" },
  DIGI: { bg: "bg-[#005ABF]", text: "text-white", border: "border-[#005ABF]", shadow: "shadow-blue-700/20" },
  MASMOVIL: { bg: "bg-[#FFD900]", text: "text-black", border: "border-[#FFD900]", shadow: "shadow-yellow-500/20" },
}

export default function ProductsPage() {
  const { user } = useAuth()
  const canCreateProduct = user?.rol ? hasPermission(user.rol, "create_product") : false
  
  const [products, setProducts] = React.useState<any[]>([])
  const [isSaving, setIsSaving] = React.useState(false)
  const [filterOperator, setFilterOperator] = React.useState<string | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")
  
  // Nuevo estado para controlar si el nombre es automático o manual
  const [isAutoName, setIsAutoName] = React.useState(true)
  
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
    setFilterOperator(form.operator)
  }, [form.operator])

  // Lógica de generación de nombre (ahora condicional)
  React.useEffect(() => {
    if (!isAutoName) return // Si está en manual, no hacemos nada aquí

    let parts = []
    switch(form.category) {
      case "FIBRA_SOLA":
        parts.push(form.fiber === "1" ? "FIBRA 1Gb" : `FIBRA ${form.fiber}Mb`)
        if (form.landline) parts.push("+ FIJO")
        break
      case "SOLO_MOVIL":
        parts.push(`MÓVIL ${form.mobile_main_gb}`)
        if (form.extra_lines.length > 0) parts.push(`+ ${form.extra_lines.length} ADIC.`)
        break
      case "SOLO_TV":
        parts.push(form.tv_package === "SIN TV" ? "PAQUETE TV" : form.tv_package)
        break
      case "COMBO":
        parts.push(form.fiber === "1" ? "1Gb" : `${form.fiber}MB`)
        parts.push(`+ ${form.mobile_main_gb}`)
        if (form.extra_lines.length > 0) parts.push(`+ ${form.extra_lines.length} LÍNEAS`)
        if (form.tv_package !== "SIN TV") parts.push("+ TV")
        break
    }
    if (Array.isArray(form.streaming_services)) {
        form.streaming_services.forEach(id => {
            const service = STREAMING_OPTIONS.find(s => s.id === id)
            if (service) parts.push(`+ ${service.name.toUpperCase()}`)
        })
    }
    setForm(prev => ({ ...prev, name: parts.join(" ").toUpperCase() }))
  }, [form.fiber, form.mobile_main_gb, form.extra_lines, form.tv_package, form.category, form.landline, form.streaming_services, isAutoName])

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
    const cleanData = { ...form, price: parseFloat(form.price) }
    try {
      const res = await httpClient('/api2/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanData),
      })
      if (res.ok) {
        toast.success("Producto guardado")
        setForm({ ...form, price: "", extra_lines: [], streaming_services: [], tv_package: "SIN TV" })
        setIsAutoName(true) // Resetear a auto tras guardar
        httpClientProducts()
      }
    } catch (error) { toast.error("Error") } finally { setIsSaving(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar permanentemente?")) return
    await httpClient(`/api2/products/${id}`, { method: 'DELETE' })
    httpClientProducts()
  }

  const filteredProducts = products.filter(p => {
    const matchesOp = !filterOperator || p.operator === filterOperator
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesOp && matchesSearch
  })

  return (
    <div className="p-4 lg:p-8 bg-slate-50/50 min-h-screen space-y-6 text-left">
      
      {/* HEADER COMPACTO CON BUSCADOR */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
            <Briefcase className="h-6 w-6 text-slate-800" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">REGISTRO <span className="text-slate-400 font-light">DE</span> SERVICIOS</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-0.5">Ingrese las tarifas de los servicios</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
          <div className="relative w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input 
              placeholder="Buscar tarifa..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 pl-9 text-[10px] font-bold border-none bg-transparent focus-visible:ring-0 uppercase" 
            />
          </div>
          <div className="h-4 w-[1px] bg-slate-100 mx-1" />
          <Button variant="ghost" size="sm" onClick={() => setFilterOperator(null)} className={cn("h-8 px-4 rounded-xl text-[9px] font-black uppercase transition-all", !filterOperator ? "bg-slate-900 text-white" : "text-slate-400 hover:bg-slate-50")}>TODOS</Button>
          {Object.keys(OPERATOR_THEMES).map(op => (
            <Button key={op} variant="ghost" size="sm" onClick={() => setFilterOperator(op)} className={cn("h-8 px-4 rounded-xl text-[9px] font-black uppercase transition-all", filterOperator === op ? `${OPERATOR_THEMES[op].bg} ${OPERATOR_THEMES[op].text} shadow-md` : "text-slate-400 hover:bg-slate-50")}>{op}</Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1600px] mx-auto">
        
        {/* BUILDER (COL 4) */}
        {canCreateProduct && (
          <Card className="lg:col-span-4 rounded-[2.5rem] border-none shadow-xl bg-white h-fit sticky top-6 overflow-hidden">
            <CardHeader className="p-6 pb-4 bg-slate-900 text-white">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-400" /> Configurar Oferta
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              <form onSubmit={handleAddProduct} className="space-y-5">
                
                {/* 1. OPERADORA */}
                <div className="grid grid-cols-3 gap-2">
                  {Object.keys(OPERATOR_THEMES).map(op => (
                    <button key={op} type="button" onClick={() => setForm({...form, operator: op})}
                      className={cn("rounded-xl h-11 font-black text-[9px] uppercase transition-all border-2",
                        form.operator === op ? `${OPERATOR_THEMES[op].bg} ${OPERATOR_THEMES[op].text} border-transparent shadow-lg scale-105` : "bg-slate-50 border-slate-100 text-slate-400")}>{op}</button>
                  ))}
                </div>

                {/* 2. CATEGORIA */}
                <ToggleGroup type="single" value={form.category} onValueChange={(v) => v && setForm({...form, category: v})} className="grid grid-cols-4 gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                  {["COMBO", "FIBRA_SOLA", "SOLO_MOVIL", "SOLO_TV"].map(cat => (
                    <ToggleGroupItem key={cat} value={cat} className="h-8 rounded-lg font-black text-[7px] data-[state=active]:bg-slate-900 data-[state=active]:text-white uppercase">{cat.replace('_', ' ')}</ToggleGroupItem>
                  ))}
                </ToggleGroup>

                {}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-1">
                    <Label className="text-[9px] font-black uppercase text-slate-400 italic">Nombre de la oferta</Label>
                    <button 
                      type="button" 
                      onClick={() => setIsAutoName(!isAutoName)}
                      className={cn(
                        "flex items-center gap-1 text-[8px] font-bold px-2 py-0.5 rounded-full transition-all",
                        isAutoName ? "bg-emerald-50 text-emerald-600" : "bg-orange-100 text-orange-700"
                      )}
                    >
                      {isAutoName ? <Lock className="h-2.5 w-2.5" /> : <Unlock className="h-2.5 w-2.5" />}
                      {isAutoName ? "AUTO" : "MANUAL"}
                    </button>
                  </div>
                  <div className="relative group">
                    <Input 
                      value={form.name} 
                      onChange={(e) => setForm({...form, name: e.target.value.toUpperCase()})}
                      readOnly={isAutoName}
                      placeholder="ESCRIBE UN NOMBRE..."
                      className={cn(
                        "bg-slate-50 border-none rounded-xl font-black h-11 text-[10px] shadow-inner uppercase transition-all pr-10",
                        !isAutoName ? "ring-2 ring-orange-200 text-slate-900 bg-white" : "text-slate-600"
                      )} 
                    />
                    {!isAutoName && <Edit3 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-orange-500 opacity-50" />}
                  </div>
                </div>

                {/* 4. DINAMICO */}
                <div className="space-y-3">
                  {(form.category.includes("FIBRA") || form.category === "COMBO") && (
                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
                      <div className="flex justify-between items-center">
                        <Label className="text-[10px] font-black uppercase text-slate-800 flex items-center gap-2"><Wifi className="h-3.5 w-3.5 text-blue-600" /> Fibra</Label>
                        <Switch checked={form.landline} onCheckedChange={(v) => setForm({...form, landline: v})} className="scale-75" />
                      </div>
                      <div className="flex gap-1.5">
                        {["300", "600", "1"].map(v => (
                          <button key={v} type="button" onClick={() => setForm({...form, fiber: v})}
                            className={cn("flex-1 py-2 rounded-lg text-[9px] font-black border-2 transition-all", 
                              form.fiber === v ? "bg-white border-blue-600 text-blue-600 shadow-sm" : "bg-transparent border-transparent text-slate-400")}>
                            {v === "1" ? "1GB" : `${v}M`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(form.category.includes("MOVIL") || form.category === "COMBO") && (
                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
                      <div className="flex justify-between items-center">
                        <Label className="text-[10px] font-black uppercase text-slate-800 flex items-center gap-2"><Smartphone className="h-3.5 w-3.5 text-purple-600" /> Móvil</Label>
                        <Button type="button" onClick={() => setForm({...form, extra_lines: [...form.extra_lines, {gb: "25GB", speed: "5G"}]})} 
                          className="h-6 text-[7px] bg-purple-600 text-white rounded-lg font-black px-2">+ LÍNEA</Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {GB_OPTIONS.map(gb => (
                          <button key={gb} type="button" onClick={() => setForm({...form, mobile_main_gb: gb})}
                            className={cn("px-2 py-1.5 rounded-lg text-[8px] font-black border-2 transition-all", 
                              form.mobile_main_gb === gb ? "bg-white border-purple-600 text-purple-600 shadow-sm" : "bg-transparent border-transparent text-slate-400")}>
                            {gb}
                          </button>
                        ))}
                      </div>
                      {form.extra_lines.map((line, idx) => (
                        <div key={idx} className="flex gap-2 p-2 bg-white rounded-xl items-center border border-slate-100 shadow-sm">
                          <Badge className="bg-purple-100 text-purple-700 text-[7px]">#{idx+1}</Badge>
                          <Select value={line.gb} onValueChange={(v) => {
                            const n = [...form.extra_lines]; n[idx].gb = v; setForm({...form, extra_lines: n})
                          }}>
                            <SelectTrigger className="h-7 border-none bg-slate-50 text-[9px] font-black"><SelectValue /></SelectTrigger>
                            <SelectContent className="text-[10px] font-black uppercase">{GB_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                          </Select>
                          <button type="button" onClick={() => setForm({...form, extra_lines: form.extra_lines.filter((_, i) => i !== idx)})} className="text-slate-300 hover:text-red-500"><X className="h-3.5 w-3.5"/></button>
                        </div>
                      ))}
                    </div>
                  )}

                  {(form.category === "COMBO" || form.category === "SOLO_TV") && (
                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3">
                      <Label className="text-[10px] font-black uppercase text-slate-800 flex items-center gap-2"><Tv className="h-3.5 w-3.5 text-orange-600"/> TV & OTT</Label>
                      <Select value={form.tv_package} onValueChange={(v) => setForm({...form, tv_package: v})}>
                        <SelectTrigger className="bg-white border-none h-9 text-[9px] font-black rounded-lg uppercase"><SelectValue /></SelectTrigger>
                        <SelectContent className="text-[10px] font-black uppercase">
                          {["SIN TV", "TV INICIAL", "TV TOTAL", "PACK CINE", "PACK DEPORTES"].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <div className="flex flex-wrap gap-1">
                        {STREAMING_OPTIONS.map(ott => (
                          <button key={ott.id} type="button" 
                            onClick={() => setForm(f => ({ ...f, streaming_services: f.streaming_services.includes(ott.id) ? f.streaming_services.filter(x => x !== ott.id) : [...f.streaming_services, ott.id] }))}
                            className={cn("px-2 py-1 rounded-lg text-[7px] font-black transition-all border-2", 
                              form.streaming_services.includes(ott.id) ? `${ott.color} border-transparent text-white shadow-md` : "bg-white border-slate-100 text-slate-400")}>{ott.name}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})}
                    className="bg-slate-900 border-none rounded-2xl font-black text-white h-16 text-3xl pl-8 shadow-xl tabular-nums" placeholder="0.00" required />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-emerald-400 font-black italic">€</span>
                </div>

                <Button type="submit" disabled={isSaving} className="w-full h-12 bg-emerald-500 hover:bg-slate-800 text-white font-black rounded-xl uppercase text-[10px] tracking-widest transition-all shadow-lg active:scale-95">
                  {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5 mr-2" />}
                  Publicar Tarifa
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* LISTADO (COL 8) */}
        <Card className={`${canCreateProduct ? "lg:col-span-8" : "lg:col-span-12"} rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden`}>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-none">
                  <TableHead className="text-[9px] font-black uppercase text-slate-400 h-12 pl-8">Oferta / Red</TableHead>
                  <TableHead className="text-[9px] font-black uppercase text-slate-400 h-12">Detalles del Servicio</TableHead>
                  <TableHead className="text-[9px] font-black uppercase text-slate-400 h-12 text-right pr-8">Precio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((p) => (
                  <TableRow key={p.id} className="border-b border-slate-50 group hover:bg-slate-50/40 transition-all duration-300">
                    <TableCell className="py-6 pl-8">
                      <div className="flex flex-col gap-2">
                        <span className="font-black text-slate-900 text-[11px] uppercase tracking-tighter group-hover:text-blue-600 transition-colors">{p.name}</span>
                        <Badge className={cn("text-[8px] font-black border-none px-3 py-1 rounded-lg uppercase tracking-widest w-fit",
                            OPERATOR_THEMES[p.operator]?.bg || "bg-slate-900",
                            OPERATOR_THEMES[p.operator]?.text || "text-white"
                        )}>{p.operator}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                         {p.fiber && <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[8px] font-black border border-blue-100"><Wifi className="h-2.5 w-2.5" /> {p.fiber === "1" ? "1GB" : `${p.fiber}M`}</div>}
                         {p.mobile_main_gb && <div className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-[8px] font-black border border-purple-100"><Smartphone className="h-2.5 w-2.5" /> {p.mobile_main_gb}</div>}
                         {Array.isArray(p.streaming_services) && p.streaming_services.map((ottId: string) => (
                            <div key={ottId} className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded text-[7px] font-black text-white uppercase", STREAMING_OPTIONS.find(o => o.id === ottId)?.color || "bg-slate-900")}>
                              <PlayCircle className="h-2.5 w-2.5" /> {ottId}
                            </div>
                         ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xl font-black text-slate-900 tracking-tighter tabular-nums">{Number(p.price).toFixed(2)}€</span>
                        {canCreateProduct && (
                          <button onClick={() => handleDelete(p.id)} className="text-slate-200 hover:text-rose-500 transition-colors"><Trash2 className="h-4 w-4"/></button>
                        )}
                      </div>
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