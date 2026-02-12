"use client"

import * as React from "react"
import { useAuth } from "@/lib/auth-context"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from "zod"
import { 
  Search, ChevronsUpDown, Plus, Trash2, Phone, MapPin, CreditCard, Mail, 
  User, Globe, CheckCircle2, Receipt, Building2, Landmark, 
  UserCircle, Calculator, Fingerprint, Box, Wifi, Smartphone, Tv, Gift, Edit3
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { httpClient } from "@/lib/http-client"

const OPERATOR_OPTIONS = ["Movistar", "Vodafone", "Orange", "Yoigo", "Digi", "MásMóvil"]

const formSchema = z.object({
  clienteId: z.string().min(1, "Selecciona un cliente."),
  operadorDestino: z.string().min(1, "Selecciona operador."),
  servicios: z.array(z.object({
    nombre: z.string().min(1, "Requerido"),
    precioBase: z.coerce.number().min(0, "Mínimo 0"),
    detalles: z.string().optional()
  })).min(0),
  precioCierre: z.number(),
  observaciones: z.string().optional(),
})

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="space-y-1.5 p-3 rounded-2xl border border-sky-50 bg-sky-50/30">
      <div className="flex items-center gap-2 text-sky-500">
        {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<any>, { className: "h-4 w-4 shrink-0" })}
        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">{label}</span>
      </div>
      <p className="text-sm font-semibold text-slate-700 truncate pl-6">{value || "—"}</p>
    </div>
  )
}

const renderDesgloseTags = (name: string) => {
  const parts = name.split('+').map(p => p.trim());
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {parts.map((part, i) => {
        let icon = <CheckCircle2 size={10} />;
        const p = part.toLowerCase();
        if (p.includes('mb') || p.includes('fibra')) icon = <Wifi size={10} />;
        if (p.includes('gb') || p.includes('ilim') || p.includes('movil')) icon = <Smartphone size={10} />;
        if (p.includes('tv') || p.includes('video') || p.includes('serié')) icon = <Tv size={10} />;
        return (
          <Badge key={i} variant="secondary" className="bg-white/10 text-[9px] text-white border-none py-0.5 px-2 flex items-center gap-1 font-medium whitespace-nowrap">
            {icon} {part}
          </Badge>
        );
      })}
    </div>
  );
};

export function SalesForm() {
  const { user } = useAuth()
  const [openSearch, setOpenSearch] = React.useState(false)
  const [clients, setClients] = React.useState<any[]>([])
  const [availableProducts, setAvailableProducts] = React.useState<any[]>([])
  const [selectedClient, setSelectedClient] = React.useState<any | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { clienteId: "", operadorDestino: "", servicios: [], precioCierre: 0, observaciones: "" },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "servicios" })

  React.useEffect(() => {
    async function loadClients() {
      try {
        const res = await httpClient('/api/clients');
        const data = await res.json();
        setClients(Array.isArray(data) ? data : []);
      } catch (e) { toast.error("Error al cargar clientes"); }
    }
    loadClients();
  }, []);

  const operadorDestino = form.watch("operadorDestino");

  React.useEffect(() => {
    async function loadProducts() {
      if (!operadorDestino) { setAvailableProducts([]); return; }
      try {
        const res = await httpClient(`/api2/products?operator=${encodeURIComponent(operadorDestino)}`);
        const data = await res.json();
        setAvailableProducts(Array.isArray(data) ? data : []);
      } catch (e) { toast.error("Error catálogo"); }
    }
    loadProducts();
  }, [operadorDestino]);

  const catalog = React.useMemo(() => {
    return {
      combos: availableProducts.filter(p => p.name.includes('+')),
      connectivity: availableProducts.filter(p => (p.name.toLowerCase().includes('mb') || p.name.toLowerCase().includes('gb') || p.name.toLowerCase().includes('ilim')) && !p.name.includes('+')),
      extras: availableProducts.filter(p => (p.name.toLowerCase().includes('tv') || p.name.toLowerCase().includes('netflix') || p.name.toLowerCase().includes('prime') || p.name.toLowerCase().includes('video')) && !p.name.includes('+'))
    };
  }, [availableProducts]);

  const watchServicios = form.watch("servicios");
  const fiscal = React.useMemo(() => {
    const subtotal = watchServicios.reduce((acc, curr) => acc + (Number(curr.precioBase) || 0), 0);
    const prov = (selectedClient?.province || "").toLowerCase().trim();
    let rate = 0.21, name = "IVA";
    if (prov.includes("canarias") || prov.includes("palmas") || prov.includes("tenerife")) { rate = 0.07; name = "IGIC"; }
    else if (prov.includes("ceuta") || prov.includes("melilla")) { rate = 0.04; name = "IPSI"; }
    return { subtotal, tax: subtotal * rate, total: subtotal + (subtotal * rate), name, pct: rate * 100 };
  }, [watchServicios, selectedClient]);

  React.useEffect(() => { form.setValue("precioCierre", fiscal.total); }, [fiscal.total, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const res = await httpClient('/api2/sales', {
        method: 'POST',
        body: JSON.stringify({ ...values, usuario_id: user?.id, usuario_nombre: user?.nombre }),
      });
      if (res.ok) { toast.success("Venta registrada"); form.reset(); setSelectedClient(null); }
    } catch (e) { toast.error("Error al registrar"); }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-6">
        
        {/* BUSCADOR DE CLIENTE - ORIGINAL */}
        <div className="relative max-w-4xl mx-auto pt-4 pb-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <Popover open={openSearch} onOpenChange={setOpenSearch}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className={`w-full justify-between h-20 px-8 rounded-[2rem] border-none shadow-[0_15px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all duration-500 ${selectedClient ? "bg-white ring-1 ring-slate-200" : "bg-white hover:bg-slate-50"}`}
              >
                <div className="flex items-center gap-5 text-left">
                  {selectedClient ? (
                    <>
                      <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0"><User className="h-6 w-6 text-slate-600" /></div>
                      <div className="flex flex-col">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-sky-600 mb-0.5">Cliente Seleccionado</p>
                        <h3 className="text-lg font-bold text-slate-800 leading-none">{selectedClient.name}</h3>
                        <div className="flex items-center gap-3 mt-1.5"><span className="text-xs text-slate-500 flex items-center gap-1"><Fingerprint className="h-3 w-3" /> {selectedClient.dni}</span></div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h-11 w-11 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100"><Search className="h-5 w-5" /></div>
                      <div className="flex flex-col"><span className="text-lg font-semibold text-slate-700 tracking-tight">Buscar Cliente</span><span className="text-sm text-slate-400 font-normal">Introduce nombre o DNI del titular</span></div>
                    </>
                  )}
                </div>
                <div className="h-10 w-10 rounded-full flex items-center justify-center bg-slate-50 text-slate-300"><ChevronsUpDown className="h-4 w-4" /></div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-50 border-none rounded-[2.5rem] shadow-[0_30px_90px_rgba(0,0,0,0.15)] mt-4 overflow-hidden animate-in zoom-in-95">
              <Command>
                <div className="flex items-center border-b border-slate-50 px-6 bg-slate-50/30">
                  <Search className="h-5 w-5 text-slate-400 shrink-0" />
                  <CommandInput placeholder="Buscar por DNI o Nombre..." className="h-16 border-none focus:ring-0 text-base font-bold" />
                </div>
                <CommandList className="max-h-[400px] p-2">
                  <CommandEmpty className="py-12 text-center text-xs font-black text-slate-400 uppercase">No hay resultados</CommandEmpty>
                  <CommandGroup heading="Clientes Disponibles">
                    {clients.map((c) => (
                      <CommandItem key={c.id} onSelect={() => { setSelectedClient(c); form.setValue("clienteId", c.id.toString()); setOpenSearch(false); }} className="flex items-center gap-4 p-4 mb-2 rounded-[1.5rem] cursor-pointer aria-selected:bg-slate-900 aria-selected:text-white transition-all group">
                        <div className="h-11 w-11 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 group-aria-selected:text-slate-900">{c.name.charAt(0)}</div>
                        <div className="flex flex-col flex-1"><span className="font-black text-sm uppercase tracking-tight">{c.name}</span><span className="text-[10px] font-bold opacity-50">{c.dni}</span></div>
                        <CheckCircle2 className="h-5 w-5 opacity-0 group-aria-selected:opacity-100 text-sky-400" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* DATOS CLIENTE */}
        {selectedClient && (
          <Card className="border border-sky-100 rounded-[2.5rem] shadow-sm bg-white overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-sky-50/50 px-8 py-4 border-b border-sky-100 flex justify-between items-center text-sm font-bold text-sky-800 uppercase"><span className="flex items-center gap-2"><UserCircle className="h-5 w-5" /> Ficha del Titular</span><Button variant="ghost" size="sm" className="text-sky-400 hover:text-red-500 rounded-full h-8 text-[10px] font-bold" onClick={() => { setSelectedClient(null); form.setValue("clienteId", ""); }}>CAMBIAR CLIENTE</Button></div>
            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <InfoItem icon={<User />} label="Nombre" value={selectedClient.name} />
                <InfoItem icon={<CreditCard />} label="DNI" value={selectedClient.dni} />
                <InfoItem icon={<Phone />} label="Teléfono" value={selectedClient.phone} />
                <InfoItem icon={<Mail />} label="Email" value={selectedClient.email} />
                <InfoItem icon={<MapPin />} label="Dirección" value={selectedClient.address} />
                <InfoItem icon={<Globe />} label="Ubicación" value={`${selectedClient.city}, ${selectedClient.province}`} />
                <InfoItem icon={<Landmark />} label="IBAN" value={selectedClient.iban} />
                <InfoItem icon={<Building2 />} label="Origen" value={selectedClient.operator} />
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* CATÁLOGO IZQUIERDO - DISEÑO MANTENIDO SIN BRILLOS */}
          <Card className="lg:col-span-4 border-none rounded-[2.5rem] shadow-xl bg-[#0f172a] text-white overflow-hidden h-fit sticky top-8">
            <div className="p-8 pb-4 space-y-6">
              <h3 className="text-sky-400 font-black text-xs uppercase tracking-widest flex items-center gap-2"><Box size={16} /> Catálogo de Operadora</h3>
              <FormField control={form.control} name="operadorDestino" render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl h-12"><SelectValue placeholder="Elegir Operadora..." /></SelectTrigger></FormControl>
                  <SelectContent>{OPERATOR_OPTIONS.map(op => <SelectItem key={op} value={op}>{op}</SelectItem>)}</SelectContent>
                </Select>
              )} />

              <div className="space-y-8 pt-4 border-t border-white/5">
                {catalog.combos.length > 0 && (
                  <div className="space-y-3">
                    <span className="flex items-center gap-2 font-bold text-[10px] uppercase text-amber-400"><Gift size={14}/> Combos Convergentes</span>
                    <div className="grid grid-cols-1 gap-3">
                      {catalog.combos.map(p => (
                        <button key={p.id} type="button" onClick={() => append({ nombre: p.name, precioBase: Number(p.price) })} className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 hover:border-amber-500 transition-all text-left">
                          <div className="flex justify-between items-start mb-1"><span className="text-[9px] font-black text-amber-500 uppercase">Ahorro Pack</span><span className="font-black text-sm text-white">{p.price}€</span></div>
                          <p className="text-xs font-bold text-slate-100 leading-tight">{p.name.split('+')[0]}</p>
                          {renderDesgloseTags(p.name)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {catalog.connectivity.length > 0 && (
                  <div className="space-y-3">
                    <span className="flex items-center gap-2 font-bold text-[10px] uppercase text-sky-400"><Wifi size={14}/> Fibra y Móvil</span>
                    <div className="grid grid-cols-2 gap-2">
                      {catalog.connectivity.map(p => (
                        <button key={p.id} type="button" onClick={() => append({ nombre: p.name, precioBase: Number(p.price) })} className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-sky-500 transition-all text-left group">
                          <p className="text-[10px] font-bold truncate text-slate-300 group-hover:text-white">{p.name}</p>
                          <p className="text-[11px] font-black text-sky-400">{p.price}€</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {catalog.extras.length > 0 && (
                  <div className="space-y-3">
                    <span className="flex items-center gap-2 font-bold text-[10px] uppercase text-purple-400"><Tv size={14}/> TV y Streaming</span>
                    <div className="grid grid-cols-1 gap-2">
                      {catalog.extras.map(p => (
                        <button key={p.id} type="button" onClick={() => append({ nombre: p.name, precioBase: Number(p.price) })} className="p-3 flex justify-between items-center rounded-xl bg-white/5 border border-white/10 hover:border-purple-500 transition-all text-[11px] font-bold group">
                          <span className="text-slate-300 group-hover:text-white">{p.name}</span><span className="text-purple-400">{p.price}€</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {!operadorDestino && <div className="p-10 text-center text-white/20 text-xs italic">Selecciona operador para ver productos</div>}
          </Card>

          {/* DERECHA - RESUMEN */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="border border-slate-100 rounded-[2.5rem] shadow-sm bg-white overflow-hidden">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center"><h3 className="font-bold text-slate-800 flex items-center gap-2 uppercase text-sm"><Receipt className="h-5 w-5 text-sky-500" /> Resumen del Expediente</h3><Button type="button" variant="outline" onClick={() => append({ nombre: "", precioBase: 0 })} className="rounded-full px-6 border-sky-100 text-sky-600 hover:bg-sky-50 font-bold text-xs">+ LÍNEA MANUAL</Button></div>
              <CardContent className="p-8 space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100 flex items-center gap-4 animate-in slide-in-from-right-4">
                    <div className="flex-1 grid grid-cols-12 gap-4">
                      <div className="md:col-span-8 space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase ml-1">Producto</label><Input {...form.register(`servicios.${index}.nombre`)} className="bg-white border-none shadow-sm rounded-xl h-11 font-bold" /></div>
                      <div className="md:col-span-4 space-y-1"><label className="text-[9px] font-black text-slate-400 uppercase text-right mr-1">Precio (€)</label><Input type="number" step="0.01" {...form.register(`servicios.${index}.precioBase`)} className="bg-white border-none shadow-sm rounded-xl h-11 text-right font-black text-sky-600" /></div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => remove(index)} className="text-slate-300 hover:text-red-500 rounded-full h-11 w-11"><Trash2 size={20} /></Button>
                  </div>
                ))}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
                  <div className="space-y-2"><FormLabel className="text-xs font-bold text-slate-400 uppercase">Observaciones</FormLabel><Textarea {...form.register("observaciones")} className="border-slate-100 rounded-2xl min-h-[120px] bg-slate-50/50" /></div>
                  <div className="flex flex-col gap-4">
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl">
                      <div className="space-y-3">
                        <div className="flex justify-between text-slate-400 text-[10px] font-black uppercase"><span>Subtotal</span><span>{fiscal.subtotal.toFixed(2)} €</span></div>
                        <div className="flex justify-between text-sky-400 text-[10px] font-black uppercase"><span>{fiscal.name} ({fiscal.pct}%)</span><span>+ {fiscal.tax.toFixed(2)} €</span></div>
                        <div className="pt-4 border-t border-slate-800"><p className="text-[10px] font-black uppercase text-slate-500 mb-1">Total Mensual</p><div className="flex items-baseline gap-1"><span className="text-5xl font-black text-white tracking-tighter">{fiscal.total.toFixed(2)}</span><span className="text-xl font-bold text-sky-500">€</span></div></div>
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-16 text-lg font-bold rounded-2xl bg-sky-600 hover:bg-sky-700 shadow-xl transition-all uppercase tracking-widest">REGISTRAR VENTA</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  )
}