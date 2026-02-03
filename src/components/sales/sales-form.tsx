"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from "zod"
import { 
  Search, ChevronsUpDown, Plus, Trash2, 
  Phone, MapPin, CreditCard, Mail, 
  User, Globe, FileText, CheckCircle2,
  Receipt, Info, Building2
} from "lucide-react"

import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"

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
      toast.success("Venta procesada");
      form.reset();
      setSelectedClient(null);
    } catch (error) {
      toast.error("Error al registrar");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8">
        
        {/* BUSCADOR ESTILO LIMPIO */}
        <Card className="border-sky-100 shadow-sm overflow-visible bg-white">
          <CardContent className="pt-6">
            <Popover open={openSearch} onOpenChange={setOpenSearch}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between h-14 text-lg border-sky-200 hover:bg-sky-50 transition-colors">
                  <div className="flex items-center gap-3 text-sky-900">
                    <Search className="h-5 w-5 text-sky-400" />
                    {selectedClient ? (
                      <span className="font-semibold">{selectedClient.name} <span className="text-sky-400 font-normal ml-2">({selectedClient.dni})</span></span>
                    ) : (
                      <span className="text-sky-300 font-light italic">Buscar cliente por nombre o DNI...</span>
                    )}
                  </div>
                  <ChevronsUpDown className="h-5 w-5 text-sky-300" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-50 border-sky-100">
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
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            
            {/* IZQUIERDA: FICHA TÉCNICA COMPLETA (AZUL/BLANCO) */}
            <div className="xl:col-span-4 space-y-6">
              <Card className="border-sky-200 shadow-lg rounded-2xl overflow-hidden bg-white">
                <CardHeader className="bg-sky-600 text-white py-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                      <Info className="h-4 w-4" /> Ficha del Titular
                    </CardTitle>
                    <Badge className="bg-white text-sky-600 border-none font-bold">Activo</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold text-sky-900">{selectedClient.name}</h3>
                    <div className="flex items-center gap-2 text-sky-500 font-mono font-semibold">
                      <CreditCard className="h-4 w-4" /> {selectedClient.dni}
                    </div>
                  </div>
                  
                  <Separator className="bg-sky-100" />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-sky-400 uppercase">Teléfono</p>
                      <p className="text-sm font-semibold text-sky-800">{selectedClient.phone || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-sky-400 uppercase">Email</p>
                      <p className="text-sm font-semibold text-sky-800 truncate">{selectedClient.email || "-"}</p>
                    </div>
                  </div>

                  <div className="space-y-4 bg-sky-50 p-4 rounded-xl border border-sky-100">
                    <div className="flex gap-2">
                      <MapPin className="h-4 w-4 text-sky-600 shrink-0" />
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-sky-400 uppercase leading-none">Dirección de Suministro</p>
                        <p className="text-xs text-sky-800 font-medium">
                          {selectedClient.address}<br/>
                          {selectedClient.postalCode} - {selectedClient.city}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Globe className="h-4 w-4 text-sky-600" />
                      <p className="text-xs font-bold text-sky-900 uppercase tracking-tight">{selectedClient.province}</p>
                    </div>
                  </div>

                  <Button variant="ghost" className="w-full text-xs text-sky-400 hover:text-sky-600" onClick={() => setSelectedClient(null)}>
                    Anular y volver a buscar
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* DERECHA: CONFIGURACIÓN DE VENTA */}
            <div className="xl:col-span-8 space-y-6">
              <Card className="border-sky-200 shadow-xl rounded-2xl bg-white">
                <CardHeader className="flex flex-row items-center justify-between border-b border-sky-50 py-5 px-8">
                  <CardTitle className="text-lg font-bold text-sky-900 flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-sky-500" /> Servicios a Contratar
                  </CardTitle>
                  <Button type="button" size="sm" onClick={() => append({ nombre: "", precioBase: 0 })} className="bg-sky-50 text-sky-600 hover:bg-sky-100 border-sky-200">
                    <Plus className="h-4 w-4 mr-1" /> Añadir Línea
                  </Button>
                </CardHeader>

                <CardContent className="p-8 space-y-8">
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-12 gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="col-span-12 md:col-span-8 space-y-3">
                          <p className="text-[10px] font-bold text-sky-600 uppercase ml-1">Catálogo / Nombre</p>
                          <Select onValueChange={(val) => {
                            const p = availableProducts.find(x => x.id.toString() === val);
                            if(p) {
                              form.setValue(`servicios.${index}.nombre`, p.name);
                              form.setValue(`servicios.${index}.precioBase`, Number(p.price));
                            }
                          }}>
                            <SelectTrigger className="bg-white border-sky-100 h-10">
                              <SelectValue placeholder="Seleccionar producto..." />
                            </SelectTrigger>
                            <SelectContent>
                              {availableProducts.map(p => (
                                <SelectItem key={p.id} value={p.id.toString()}>{p.name} ({p.price}€)</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input {...form.register(`servicios.${index}.nombre`)} className="bg-white border-slate-200 h-10" placeholder="Descripción..." />
                        </div>
                        
                        <div className="col-span-9 md:col-span-3 space-y-2 text-right">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Base</p>
                          <Input type="number" step="0.01" {...form.register(`servicios.${index}.precioBase`)} className="bg-white border-slate-200 h-10 font-bold text-right" />
                        </div>

                        <div className="col-span-3 md:col-span-1 flex justify-center pb-1">
                          <Button variant="ghost" size="icon" onClick={() => remove(index)} className="text-slate-300 hover:text-red-500">
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                    <div className="space-y-5">
                      <FormField control={form.control} name="operadorDestino" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-bold text-sky-700 uppercase">Operador Receptor</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-12 border-sky-200 bg-white"><SelectValue placeholder="..." /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {OPERATOR_OPTIONS.map(op => <SelectItem key={op} value={op}>{op}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                      <div className="space-y-2">
                        <FormLabel className="text-xs font-bold text-sky-700 uppercase">Notas</FormLabel>
                        <Textarea {...form.register("observaciones")} className="border-sky-100 min-h-[80px]" placeholder="..." />
                      </div>
                    </div>

                    <div className="bg-sky-900 text-white p-8 rounded-3xl flex flex-col items-end shadow-xl border-t-4 border-sky-400">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-sky-300">Total Presupuestado</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-bold tracking-tighter">{currentTotal}</span>
                        <span className="text-xl font-medium">€</span>
                      </div>
                      <p className="text-[10px] text-sky-400 mt-2 italic">IVA inc. según provincia</p>
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-16 text-xl font-bold rounded-2xl bg-sky-600 hover:bg-sky-700 text-white shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-3">
                    REGISTRAR VENTA POR {currentTotal}€
                    <FileText className="h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </form>
    </Form>
  )
}