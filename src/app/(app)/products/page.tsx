"use client"

import * as React from "react"
import { 
  Plus, Trash2, Loader2, Wifi, Smartphone, 
  Briefcase, X, ListPlus, Tv, Check, FilterX
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
  { id: 'netflix', name: 'Netflix' },
  { id: 'disney', name: 'Disney+' },
  { id: 'prime', name: 'Prime Video' },
  { id: 'hbo', name: 'HBO Max' },
  { id: 'dazn', name: 'DAZN' },
]

// Diccionario de colores por operadora
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

  // Sincronizar filtro con la selección del formulario
  React.useEffect(() => {
    setFilterOperator(form.operator)
  }, [form.operator])

  React.useEffect(() => {
    let parts = []
    if (form.category === "FIBRA_SOLA") {
      parts.push(form.fiber === "1" ? "FIBRA 1Gb" : `FIBRA ${form.fiber}Mb`)
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

  const filteredProducts = products.filter(p => !filterOperator || p.operator === filterOperator)

  return (
    <div className="space-y-8 p-8 bg-slate-50/50 min-h-screen text-left">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 px-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 flex items-center gap-3 uppercase">
            <Briefcase className="h-8 w-8 text-cyan-500" /> Catálogo de Servicios
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gestión de ofertas y tarifas</p>
        </div>
        
        {/* Filtro Rápido en la cabecera */}
        <div className="flex flex-col gap-2">
           <Label className="text-[9px] font-black uppercase text-slate-400 ml-1 italic text-right">Filtrar vista por:</Label>
           <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 gap-1">
             <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setFilterOperator(null)}
                className={cn("h-8 rounded-xl text-[9px] font-black uppercase tracking-tight", !filterOperator ? "bg-slate-900 text-white" : "text-slate-400")}
             >
               Todos
             </Button>
             {Object.keys(OPERATOR_THEMES).map(op => (
               <Button 
                key={op}
                variant="ghost" 
                size="sm"
                onClick={() => setFilterOperator(op)}
                className={cn(
                  "h-8 rounded-xl text-[9px] font-black uppercase tracking-tight transition-all",
                  filterOperator === op ? `${OPERATOR_THEMES[op].bg} ${OPERATOR_THEMES[op].text} shadow-lg ${OPERATOR_THEMES[op].shadow}` : "text-slate-400"
                )}
               >
                 {op}
               </Button>
             ))}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {canCreateProduct && (
        <Card className="lg:col-span-5 rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden h-fit">
          <CardHeader className="p-8 pb-4 bg-slate-900 text-white">
            <CardTitle className="text-xl font-black uppercase tracking-tighter">Configurar Nueva Oferta</CardTitle>
          </CardHeader>

          <CardContent className="p-8 space-y-6">
            <form onSubmit={handleAddProduct} className="space-y-6">
              
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">Paso 1: Selecciona Operadora</Label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.keys(OPERATOR_THEMES).map(op => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => setForm({...form, operator: op})}
                      className={cn(
                        "rounded-xl h-12 font-black text-[9px] uppercase transition-all flex items-center justify-center border-2",
                        form.operator === op 
                          ? `${OPERATOR_THEMES[op].bg} ${OPERATOR_THEMES[op].text} ${OPERATOR_THEMES[op].border} shadow-lg ${OPERATOR_THEMES[op].shadow}` 
                          : "bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100"
                      )}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Tipo de Activo</Label>
                  <ToggleGroup type="single" value={form.category} onValueChange={(v) => v && setForm({...form, category: v})} className="justify-start gap-1">
                    <ToggleGroupItem value="COMBO" className="rounded-lg flex-1 font-black text-[8px] bg-slate-100 data-[state=active]:bg-cyan-500 data-[state=active]:text-white">COMBO</ToggleGroupItem>
                    <ToggleGroupItem value="FIBRA_SOLA" className="rounded-lg flex-1 font-black text-[8px] bg-slate-100 data-[state=active]:bg-indigo-500 data-[state=active]:text-white">FIBRA</ToggleGroupItem>
                  </ToggleGroup>
                </div>

                <div className="space-y-1">
                  <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Modalidad</Label>
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

              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Nombre del Pack (Autogenerado)</Label>
                <Input 
                  value={form.name} onChange={(e) => setForm({...form, name: e.target.value.toUpperCase()})}
                  className="bg-slate-50 border-none rounded-xl font-black h-11 text-xs shadow-inner text-cyan-600 uppercase"
                />
              </div>

              {(form.category === "COMBO" || form.category === "FIBRA_SOLA") && (
                <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] font-black uppercase text-slate-600 flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-cyan-500" /> Fibra Óptica
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

              {(form.category === "COMBO") && (
                <div className="p-5 bg-cyan-50/30 rounded-[2rem] border border-cyan-100 space-y-4 shadow-sm">
                  <Label className="text-[10px] font-black uppercase text-cyan-600 flex items-center gap-2">
                    <Smartphone className="h-4 w-4" /> Móvil Principal
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {GB_OPTIONS.map(gb => (
                      <button key={gb} type="button" onClick={() => setForm({...form, mobile_main_gb: gb})}
                        className={`py-2 rounded-xl text-[9px] font-black border-2 transition-all ${form.mobile_main_gb === gb ? "bg-cyan-500 border-cyan-500 text-white shadow-md shadow-cyan-500/20" : "bg-white border-slate-100 text-slate-400"}`}>
                        {gb}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {form.category === "COMBO" && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-2">
                    <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest italic">Líneas Adicionales</Label>
                    <Button type="button" onClick={() => setForm({...form, extra_lines: [...form.extra_lines, {gb: "25GB", speed: "5G"}]})} className="h-6 text-[8px] bg-slate-900 text-white rounded-lg px-3 hover:bg-cyan-600 transition-colors">
                      + AÑADIR MÓVIL
                    </Button>
                  </div>
                  {form.extra_lines.map((line, idx) => (
                    <div key={idx} className="flex gap-2 p-2 bg-slate-100 rounded-xl items-center animate-in slide-in-from-left-1 duration-300">
                      <Select value={line.gb} onValueChange={(v) => {
                        const newLines = [...form.extra_lines]; newLines[idx].gb = v; setForm({...form, extra_lines: newLines})
                      }}>
                        <SelectTrigger className="h-8 border-none bg-white text-[10px] font-bold shadow-sm flex-1 rounded-lg tracking-tighter"><SelectValue /></SelectTrigger>
                        <SelectContent className="font-bold text-[10px]">{GB_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                      </Select>
                      <button type="button" onClick={() => setForm({...form, extra_lines: form.extra_lines.filter((_, i) => i !== idx)})} className="text-slate-400 hover:text-red-500 px-1 transition-colors">
                        <X className="h-4 w-4"/>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-5 bg-indigo-50/50 rounded-[2rem] border border-indigo-100 space-y-4 shadow-sm">
                <Label className="text-[10px] font-black uppercase text-indigo-600 flex items-center gap-2"><Tv className="h-4 w-4"/> Televisión y Streaming</Label>
                <Select value={form.tv_package} onValueChange={(v) => setForm({...form, tv_package: v})}>
                  <SelectTrigger className="bg-white border-none h-10 text-[10px] font-bold rounded-xl shadow-sm tracking-tight"><SelectValue /></SelectTrigger>
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

              <div className="relative pt-4">
                <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})}
                  className="bg-slate-900 border-none rounded-2xl font-black text-white h-16 text-4xl pl-8 shadow-xl focus:bg-cyan-600 transition-colors" placeholder="0.00" required />
                <span className="absolute right-8 top-1/2 translate-y-[-10%] text-white/20 font-black italic text-xl">€/MES</span>
              </div>

              <Button type="submit" disabled={isSaving} className="w-full h-14 bg-cyan-500 hover:bg-slate-900 text-white font-black rounded-2xl uppercase text-[10px] tracking-[0.2em] transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98]">
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <ListPlus className="h-5 w-5 mr-2" />}
                Añadir al Catálogo
              </Button>
            </form>
          </CardContent>
        </Card>
        )}

        {/* TABLA DE PRODUCTOS */}
        <Card className={`${canCreateProduct ? "lg:col-span-7" : "lg:col-span-12"} rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden`}>
          <CardHeader className="p-8 pb-2 border-b border-slate-50 flex flex-row justify-between items-center">
             <div className="space-y-1">
                <CardTitle className="text-xl font-black uppercase tracking-tighter">Servicios Disponibles</CardTitle>
                <div className="flex items-center gap-2">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{filteredProducts.length} Ofertas Listadas</span>
                </div>
             </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-none hover:bg-transparent bg-slate-50/50">
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 py-6 pl-8">Producto / Operadora</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400">Configuración</TableHead>
                  <TableHead className="text-[10px] font-black uppercase text-slate-400 text-right pr-8">Precio Mensual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-64 text-center">
                       <div className="flex flex-col items-center gap-2 opacity-20">
                          <FilterX className="h-12 w-12" />
                          <p className="font-black uppercase text-xs tracking-widest">No hay ofertas para esta selección</p>
                       </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((p) => (
                    <TableRow key={p.id} className="border-b border-slate-50 group hover:bg-slate-50/30 transition-all duration-300">
                      <TableCell className="py-6 pl-8">
                        <div className="flex flex-col gap-3">
                          <span className="font-black text-slate-800 text-xs uppercase tracking-tighter leading-none group-hover:text-cyan-600 transition-colors">
                            {p.name}
                          </span>
                          <div className="flex items-center">
                            {/* Badge de operadora con color real de marca */}
                            <Badge className={cn(
                              "text-[8px] font-black border-none px-3 py-1 rounded-lg uppercase tracking-widest shadow-sm",
                              OPERATOR_THEMES[p.operator]?.bg || "bg-slate-900",
                              OPERATOR_THEMES[p.operator]?.text || "text-white"
                            )}>
                              {p.operator}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap gap-1.5">
                             {p.fiber && (
                               <div className="flex items-center gap-1 bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-md border border-cyan-100">
                                 <Wifi className="h-2.5 w-2.5" />
                                 <span className="text-[9px] font-black uppercase italic">{p.fiber}MB</span>
                               </div>
                             )}
                             {p.mobile_main_gb && (
                               <div className="flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                                 <Smartphone className="h-2.5 w-2.5" />
                                 <span className="text-[9px] font-black uppercase italic">{p.mobile_main_gb}</span>
                               </div>
                             )}
                          </div>
                          {p.tv_package !== "SIN TV" && (
                             <div className="flex items-center gap-1.5 text-indigo-600">
                                <Tv className="h-3 w-3" />
                                <span className="text-[8px] font-black uppercase tracking-tight">{p.tv_package}</span>
                             </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex flex-col items-end">
                          <span className="text-2xl font-black text-slate-900 tracking-tighter tabular-nums">
                            {Number(p.price).toFixed(2)}<span className="text-sm ml-0.5 opacity-30">€</span>
                          </span>
                          {canCreateProduct && (
                            <button 
                              onClick={() => handleDelete(p.id)} 
                              className="mt-2 text-slate-300 hover:text-rose-500 transition-all transform hover:scale-110 active:scale-90"
                            >
                              <Trash2 className="h-4 w-4"/>
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}