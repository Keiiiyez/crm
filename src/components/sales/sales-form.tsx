"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from "zod"
import { 
  Search, ChevronsUpDown, Plus, Trash2, Phone, MapPin, CreditCard, Mail, 
  User, Globe, FileText, CheckCircle2, Receipt, Info, Building2, Landmark, 
  Calendar, UserCircle 
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

const OPERATOR_OPTIONS = ["Movistar", "Vodafone", "Orange", "Yoigo", "Digi", "MásMóvil"]

const formSchema = z.object({
  clienteId: z.string().min(1, "Selecciona un cliente."),
  operadorDestino: z.string().min(1, "Selecciona operador."),
  servicios: z.array(z.object({
    nombre: z.string().min(1, "Requerido"),
    precioBase: z.coerce.number().min(0.01, "Precio mínimo 0.01")
  })).min(1, "Añade al menos un servicio"),
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
          fetch('/api/clients'),
          fetch('/api2/products')
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
  }, [])

  const watchServicios = form.watch("servicios");
  
  const currentTotal = React.useMemo(() => {
    const subtotal = watchServicios.reduce((acc, curr) => acc + (Number(curr.precioBase) || 0), 0);
    const prov = (selectedClient?.province || "").toLowerCase();
    let taxRate = 0.21;
    if (prov.includes("canarias") || prov.includes("palmas") || prov.includes("tenerife")) taxRate = 0.07;
    else if (prov.includes("ceuta") || prov.includes("melilla")) taxRate = 0.005;
    return Number((subtotal * (1 + taxRate)).toFixed(2));
  }, [watchServicios, selectedClient]);

  React.useEffect(() => {
    form.setValue("precioCierre", currentTotal);
  }, [currentTotal, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await fetch('/api2/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
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
        
        {}
        <Card className="border border-sky-100 rounded-[2rem] shadow-sm">
          <CardContent className="pt-6">
            <Popover open={openSearch} onOpenChange={setOpenSearch}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between h-14 text-lg border-sky-100 rounded-2xl hover:bg-sky-50 transition-all">
                  <div className="flex items-center gap-3 text-sky-900">
                    <Search className="h-5 w-5 text-sky-300" />
                    {selectedClient ? (
                      <span className="font-bold">{selectedClient.name} <span className="text-sky-400 font-normal ml-2">[{selectedClient.dni}]</span></span>
                    ) : (
                      <span className="text-slate-400 text-base">Buscar cliente por DNI o Nombre...</span>
                    )}
                  </div>
                  <ChevronsUpDown className="h-5 w-5 text-sky-200" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-50 border border-sky-100 rounded-2xl overflow-hidden shadow-xl">
                <Command>
                  <CommandInput placeholder="Escribe para filtrar..." className="h-12" />
                  <CommandList>
                    <CommandEmpty>No hay resultados.</CommandEmpty>
                    <CommandGroup>
                      {clients.map((c) => (
                        <CommandItem key={c.id} onSelect={() => {
                          setSelectedClient(c);
                          form.setValue("clienteId", c.id.toString());
                          setOpenSearch(false);
                        }}>
                          <User className="mr-2 h-4 w-4 text-sky-400" />
                          <div className="flex flex-col">
                            <span className="font-bold text-sky-900">{c.name}</span>
                            <span className="text-xs text-sky-400">{c.dni}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        {selectedClient && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            
            {}
            <Card className="border border-sky-100 rounded-[2.5rem] shadow-sm bg-white overflow-hidden">
              <div className="bg-sky-50/50 px-8 py-4 border-b border-sky-100 flex justify-between items-center">
                <h3 className="text-sm font-bold text-sky-800 uppercase flex items-center gap-2">
                  <UserCircle className="h-5 w-5 text-sky-500" /> Información Detallada del Cliente
                </h3>
                <Button variant="ghost" size="sm" className="text-sky-400 hover:text-red-500 hover:bg-red-50 rounded-full" onClick={() => setSelectedClient(null)}>
                  Cambiar Cliente
                </Button>
              </div>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <InfoItem icon={<User />} label="Nombre" value={selectedClient.name} />
                  <InfoItem icon={<CreditCard />} label="DNI / NIE" value={selectedClient.dni} />
                  <InfoItem icon={<Phone />} label="Teléfono" value={selectedClient.phone} />
                  <InfoItem icon={<Mail />} label="Email" value={selectedClient.email} />
                  <InfoItem icon={<MapPin />} label="Dirección" value={selectedClient.address} />
                  <InfoItem icon={<Globe />} label="Provincia" value={`${selectedClient.city}, ${selectedClient.province}`} />
                  <InfoItem icon={<Landmark />} label="IBAN" value={selectedClient.iban} />
                  <InfoItem icon={<Calendar />} label="F. Nacimiento" value={selectedClient.birthDate} />
                  <InfoItem icon={<Globe />} label="Nacionalidad" value={selectedClient.nationality} />
                  <InfoItem icon={<Building2 />} label="Operador Actual" value={selectedClient.operator} />
                  <InfoItem icon={<UserCircle />} label="Género" value={selectedClient.gender} />
                  <InfoItem icon={<Landmark />} label="Entidad Bancaria" value={selectedClient.bankName} />
                </div>
              </CardContent>
            </Card>

            {}
            <Card className="border border-sky-100 rounded-[2.5rem] shadow-sm bg-white overflow-hidden">
              <div className="p-8 pb-0 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 uppercase text-sm tracking-widest">
                  <Receipt className="h-5 w-5 text-sky-400" /> Configuración de Venta
                </h3>
                <Button type="button" onClick={() => append({ nombre: "", precioBase: 0 })} className="bg-sky-50 text-sky-600 hover:bg-sky-100 border border-sky-100 rounded-xl px-6">
                  <Plus className="h-4 w-4 mr-1" /> Añadir Servicio
                </Button>
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
                            <SelectValue placeholder="Seleccionar del catálogo..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableProducts.map(p => (
                              <SelectItem key={p.id} value={p.id.toString()}>{p.name} ({p.price}€)</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input {...form.register(`servicios.${index}.nombre`)} className="bg-white border-slate-200 rounded-xl h-11" placeholder="Descripción..." />
                      </div>
                      
                      <div className="col-span-9 md:col-span-3 space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase text-right mr-1">Base</p>
                        <div className="relative">
                          <Input type="number" step="0.01" {...form.register(`servicios.${index}.precioBase`)} className="bg-white border-slate-200 rounded-xl h-11 font-bold text-right pr-8" />
                          <span className="absolute right-3 top-3 text-slate-400 text-xs text-muted-foreground italic">€</span>
                        </div>
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
                        <FormLabel className="text-xs font-bold text-sky-700 uppercase ml-1">Operador Receptor</FormLabel>
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
                      <FormLabel className="text-xs font-bold text-sky-700 uppercase ml-1">Observaciones</FormLabel>
                      <Textarea {...form.register("observaciones")} className="border-sky-50 rounded-xl min-h-[100px] bg-white" placeholder="Notas adicionales de la venta..." />
                    </div>
                  </div>

                  {}
                  <div className="flex flex-col gap-4">
                    <div className="bg-sky-50/80 border border-sky-100 p-8 rounded-[2.5rem] flex justify-between items-center">
                      <div>
                        <p className="text-xs font-bold uppercase text-sky-400 tracking-widest mb-2">Total Presupuestado</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-6xl font-black text-sky-950 tracking-tighter">{currentTotal}</span>
                          <span className="text-2xl font-bold text-sky-500">€</span>
                        </div>
                        <p className="text-[10px] text-sky-400 mt-2 font-medium">IVA/Impuestos calculados según provincia</p>
                      </div>
                      <div className="h-20 w-20 bg-white rounded-[1.5rem] flex items-center justify-center shadow-sm border border-sky-50">
                         <CheckCircle2 className="h-10 w-10 text-sky-500" />
                      </div>
                    </div>
                    
                    <Button type="submit" className="w-full h-16 text-lg font-bold rounded-2xl bg-sky-600 hover:bg-sky-700 shadow-xl shadow-sky-200 transition-all hover:scale-[1.01] active:scale-[0.98]">
                      REGISTRAR VENTA
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </form>
    </Form>
  )
}