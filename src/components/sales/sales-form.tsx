"use client"

import * as React from "react"
import { useAuth } from "@/lib/auth-context"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from "zod"
import { 
  Search, ChevronsUpDown, Plus, Trash2, Phone, MapPin, CreditCard, Mail, 
  User, Globe, FileText, CheckCircle2, Receipt, Info, Building2, Landmark, 
  Calendar, UserCircle, Calculator, Fingerprint 
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
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
    precioBase: z.coerce.number().min(0.01, "Precio mínimo 0.01")
  })).min(0, "Añade al menos un servicio"),
  precioCierre: z.number(),
  observaciones: z.string().optional(),
})

function InfoItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="space-y-1.5 p-3 rounded-2xl border border-sky-50 bg-sky-50/30">
      <div className="flex items-center gap-2 text-sky-500">
        {React.isValidElement(icon) && React.cloneElement(icon as React.ReactElement<any>, { 
          className: "h-4 w-4 shrink-0" 
        })}
        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">{label}</span>
      </div>
      <p className="text-sm font-semibold text-slate-700 truncate pl-6">{value || "—"}</p>
    </div>
  )
}

export function SalesForm() {
  const { user } = useAuth()
  const [openSearch, setOpenSearch] = React.useState(false)
  const [clients, setClients] = React.useState<any[]>([])
  const [availableProducts, setAvailableProducts] = React.useState<any[]>([])
  const [selectedClient, setSelectedClient] = React.useState<any | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      clienteId: "", 
      operadorDestino: "", 
      servicios: [], 
      precioCierre: 0, 
      observaciones: "" 
    },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "servicios" })

  React.useEffect(() => {
    async function loadData() {
      try {
        const [resClients, resProducts] = await Promise.all([
          httpClient('/api/clients'),
          httpClient('/api2/products')
        ]);
        const cData = await resClients.json();
        const pData = await resProducts.json();
        setClients(Array.isArray(cData) ? cData : []);
        setAvailableProducts(Array.isArray(pData) ? pData : []);
      } catch (error) {
        toast.error("Error al cargar datos");
      }
    }
    loadData();

    // Para ASESOR y COORDINADOR, agregar un servicio vacío por defecto
    if (user?.rol === "ASESOR" || user?.rol === "COORDINADOR") {
      if (fields.length === 0) {
        append({ nombre: "", precioBase: 0 });
      }
    }
  }, [user?.rol, fields.length, append])

  const watchServicios = form.watch("servicios");
  
  const fiscalCalculation = React.useMemo(() => {
    const subtotal = watchServicios.reduce((acc, curr) => acc + (Number(curr.precioBase) || 0), 0);
    const prov = (selectedClient?.province || "").toLowerCase().trim();
    
    let taxRate = 0.21;
    let taxName = "IVA";

    if (prov.includes("canarias") || prov.includes("palmas") || prov.includes("tenerife")) {
      taxRate = 0.07;
      taxName = "IGIC";
    } else if (prov.includes("ceuta") || prov.includes("melilla")) {
      taxRate = 0.04;
      taxName = "IPSI";
    }

    const taxAmount = subtotal * taxRate;
    const total = Number((subtotal + taxAmount).toFixed(2));

    return { subtotal, taxAmount, total, taxName, taxPercentage: taxRate * 100 };
  }, [watchServicios, selectedClient]);

  React.useEffect(() => {
    form.setValue("precioCierre", fiscalCalculation.total);
  }, [fiscalCalculation.total, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast.error("Debes estar autenticado para registrar ventas");
      return;
    }

    try {
      const response = await httpClient('/api2/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          usuario_id: user.id,
          usuario_nombre: user.nombre
        }),
      });
      if (!response.ok) throw new Error();
      toast.success("Venta registrada con éxito");
      form.reset();
      setSelectedClient(null);
    } catch (error) {
      toast.error("Error al registrar la venta");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-6">
        
        {/* BUSCADOR DE CLIENTE - DISEÑO FORMAL Y LIMPIO */}
<div className="relative max-w-4xl mx-auto pt-4 pb-8 animate-in fade-in slide-in-from-top-4 duration-700">
  <Popover open={openSearch} onOpenChange={setOpenSearch}>
    <PopoverTrigger asChild>
      <Button 
        variant="outline" 
        className={`
          w-full justify-between h-20 px-8 rounded-[2rem] transition-all duration-500 border-none
          shadow-[0_15px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]
          ${selectedClient ? "bg-white ring-1 ring-slate-200" : "bg-white hover:bg-slate-50"}
        `}
      >
        <div className="flex items-center gap-5 text-left">
          {selectedClient ? (
            <>
              {/* Avatar más sobrio */}
              <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 shrink-0">
                <User className="h-6 w-6 text-slate-600" />
              </div>
              <div className="flex flex-col">
                <p className="text-[11px] font-medium uppercase tracking-wider text-sky-600 mb-0.5">Cliente Seleccionado</p>
                <h3 className="text-lg font-bold text-slate-800 leading-none">
                  {selectedClient.name}
                </h3>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Fingerprint className="h-3 w-3" /> {selectedClient.dni}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              {}
              <div className="h-11 w-11 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                <Search className="h-5 w-5" strokeWidth={2} />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold text-slate-700 tracking-tight">Buscar Cliente</span>
                <span className="text-sm text-slate-400 font-normal">Introduce nombre o DNI del titular</span>
              </div>
            </>
          )}
        </div>
        
        <div className="h-10 w-10 rounded-full flex items-center justify-center bg-slate-50 text-slate-300">
          <ChevronsUpDown className="h-4 w-4" />
        </div>
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
                      <CommandItem key={c.id} onSelect={() => { setSelectedClient(c); form.setValue("clienteId", c.id.toString()); setOpenSearch(false); }} className="flex items-center gap-4 p-4 mb-2 rounded-[1.5rem] cursor-pointer aria-selected:bg-slate-900 aria-selected:text-white transition-all">
                        <div className="h-11 w-11 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 group-aria-selected:text-white">
                          {c.name.charAt(0)}
                        </div>
                        <div className="flex flex-col flex-1">
                          <span className="font-black text-sm uppercase tracking-tight">{c.name}</span>
                          <span className="text-[10px] font-bold opacity-50">{c.dni}</span>
                        </div>
                        <CheckCircle2 className="h-5 w-5 opacity-0 group-aria-selected:opacity-100 text-sky-400" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {selectedClient && (
          <Card className="border border-sky-100 rounded-[2.5rem] shadow-sm bg-white overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-sky-50/50 px-8 py-4 border-b border-sky-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-sky-800 uppercase flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-sky-500" /> Información Detallada
              </h3>
              <Button variant="ghost" size="sm" className="text-sky-400 hover:text-red-500 rounded-full" onClick={() => { setSelectedClient(null); form.setValue("clienteId", ""); }}>
                Cambiar Cliente
              </Button>
            </div>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <InfoItem icon={<User />} label="Nombre" value={selectedClient?.name} />
                <InfoItem icon={<CreditCard />} label="DNI / NIE" value={selectedClient?.dni} />
                <InfoItem icon={<Phone />} label="Teléfono" value={selectedClient?.phone} />
                <InfoItem icon={<Mail />} label="Email" value={selectedClient?.email} />
                {user?.rol !== "ASESOR" && (
                  <>
                    <InfoItem icon={<MapPin />} label="Dirección" value={selectedClient?.address} />
                    <InfoItem icon={<Globe />} label="Ubicación" value={`${selectedClient?.city || ""}, ${selectedClient?.province || ""}`} />
                    <InfoItem icon={<Landmark />} label="IBAN" value={selectedClient?.iban} />
                    <InfoItem icon={<Building2 />} label="Operador" value={selectedClient?.operator} />
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* CONFIGURACIÓN DE VENTA */}
        <Card className="border border-sky-100 rounded-[2.5rem] shadow-sm bg-white overflow-hidden">
          <div className="p-8 pb-0 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 uppercase text-sm tracking-widest">
              <Receipt className="h-5 w-5 text-sky-400" /> Configuración de Venta
            </h3>
            {user?.rol !== "ASESOR" && user?.rol !== "COORDINADOR" && (
              <Button type="button" onClick={() => append({ nombre: "", precioBase: 0 })} className="bg-sky-50 text-sky-600 hover:bg-sky-100 rounded-xl px-6">
                <Plus className="h-4 w-4 mr-1" /> Añadir Servicio
              </Button>
            )}
          </div>

          <CardContent className="p-8 space-y-6">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-4 items-end bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <div className="col-span-12 md:col-span-8 space-y-3">
                    <p className="text-[10px] font-bold text-sky-600 uppercase ml-1">Producto / Servicio</p>
                    <Select onValueChange={(val) => {
                      const p = availableProducts.find(x => x.id.toString() === val);
                      if(p) {
                        form.setValue(`servicios.${index}.nombre`, p.name);
                        form.setValue(`servicios.${index}.precioBase`, Number(p.price));
                      }
                    }}>
                      <SelectTrigger className="bg-white border-sky-50 rounded-xl h-11">
                        <SelectValue placeholder="Catálogo..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProducts.map(p => (
                          <SelectItem key={p.id} value={p.id.toString()}>{p.name} ({p.price}€)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input {...form.register(`servicios.${index}.nombre`)} className="bg-white rounded-xl h-11" placeholder="Descripción..." />
                  </div>
                  <div className="col-span-9 md:col-span-3 space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase text-right">Base (€)</p>
                    <Input type="number" step="0.01" {...form.register(`servicios.${index}.precioBase`)} className="bg-white rounded-xl h-11 text-right font-bold" />
                  </div>
                  <div className="col-span-3 md:col-span-1 flex justify-center pb-1">
                    <Button variant="ghost" size="icon" onClick={() => remove(index)} className="text-slate-300 hover:text-red-500 rounded-full">
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
              <div className="space-y-5">
                <FormField control={form.control} name="operadorDestino" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold text-sky-700 uppercase">Operador Destino</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 border-sky-100 bg-white rounded-xl"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {OPERATOR_OPTIONS.map(op => <SelectItem key={op} value={op}>{op}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <div className="space-y-2">
                  <FormLabel className="text-xs font-bold text-sky-700 uppercase">Observaciones</FormLabel>
                  <Textarea {...form.register("observaciones")} className="border-sky-50 rounded-xl min-h-[100px]" placeholder="Notas..." />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10"><Calculator size={80} /></div>
                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-center text-slate-400">
                      <span className="text-[10px] font-black uppercase tracking-widest">Base Imponible</span>
                      <span className="font-mono">{fiscalCalculation.subtotal.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between items-center text-sky-400">
                      <span className="text-[10px] font-black uppercase tracking-widest">{fiscalCalculation.taxName} ({fiscalCalculation.taxPercentage}%)</span>
                      <span className="font-mono">+{fiscalCalculation.taxAmount.toFixed(2)} €</span>
                    </div>
                    <div className="pt-4 border-t border-slate-800 flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Total Final</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-5xl font-black text-white tracking-tighter">{fiscalCalculation.total.toFixed(2)}</span>
                          <span className="text-xl font-bold text-sky-500">€</span>
                        </div>
                      </div>
                      <Badge className="bg-sky-500 text-white border-none text-[9px] font-black px-3 py-1 mb-2">
                        {selectedClient?.province?.toUpperCase() || "GENERAL"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button type="submit" className="w-full h-16 text-lg font-bold rounded-2xl bg-sky-600 hover:bg-sky-700 shadow-xl transition-all">
                  REGISTRAR VENTA
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  )
}