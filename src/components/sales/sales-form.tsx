"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from "zod"
import { 
  Search, ChevronsUpDown, Plus, Trash2, 
  Phone, MapPin, CreditCard, MessageSquare, Mail, Download, Hash, CheckCircle2, 
  User, Globe, Navigation, AlertCircle
} from "lucide-react"

import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
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
    precioBase: z.coerce.number()
  })).min(1, "Añade al menos un servicio"),
  precioCierre: z.any(),
  observaciones: z.string().optional(),
})

export function SalesForm() {
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
    Promise.all([
      fetch('/api/clients').then(res => res.json()),
      fetch('/api2/products').then(res => res.json())
    ]).then(([c, p]) => {
      setClients(Array.isArray(c) ? c : []);
      setAvailableProducts(Array.isArray(p) ? p : []);
    }).catch(() => toast.error("Error de red"));
  }, [])

  
  const watchServicios = form.watch("servicios");
  
  const currentTotal = React.useMemo(() => {
    const subtotal = watchServicios.reduce((acc, curr) => acc + (Number(curr.precioBase) || 0), 0);
    const province = selectedClient?.province || "";
    const p = province.toLowerCase();
    let taxRate = 0.21;
    if (p.includes("canarias") || p.includes("palmas") || p.includes("tenerife")) taxRate = 0.07;
    else if (p.includes("ceuta") || p.includes("melilla")) taxRate = 0.005;

    return Number((subtotal * (1 + taxRate)).toFixed(2));
  }, [watchServicios, selectedClient]);

  
  React.useEffect(() => {
    form.setValue("precioCierre", currentTotal);
  }, [currentTotal, form]);

  const generatePDF = (data: any, client: any, total: number) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("CONTRATO DE VENTA", 105, 20, { align: "center" });
    autoTable(doc, {
      startY: 30,
      head: [['INFORMACIÓN DEL TITULAR', '']],
      body: [
        ['Nombre Completo', client.name],
        ['DNI/NIE', client.dni],
        ['Email', client.email || "-"],
        ['Teléfono', client.phone || "-"],
        ['Dirección', client.address],
        ['CP y Ciudad', `${client.postalCode} - ${client.city}`],
        ['Provincia', client.province],
      ],
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59] }
    });
  
    const finalY = (doc as any).lastAutoTable.finalY || 100;
    autoTable(doc, {
      startY: finalY + 10,
      head: [['SERVICIO', 'P. BASE']],
      body: data.servicios.map((s: any) => [s.nombre, `${Number(s.precioBase).toFixed(2)}€`]),
      foot: [['TOTAL FINAL (IVA INC.)', `${total.toFixed(2)}€`]],
      footStyles: { fillColor: [5, 150, 105], fontStyle: 'bold' }
    });
    doc.save(`Venta_${client.dni}.pdf`);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (currentTotal <= 0) {
      toast.error("El precio total debe ser mayor a 0€");
      return;
    }

    try {
      const res = await fetch('/api2/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, precioCierre: currentTotal }),
      });

      if (!res.ok) throw new Error();

      generatePDF(values, selectedClient, currentTotal); 
      toast.success("Venta guardada correctamente");
      form.reset();
      setSelectedClient(null);
    } catch (e) {
      toast.error("Error al guardar la venta");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-[1400px] mx-auto p-4 md:p-8">
        
        {}
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="pt-6">
            <Popover open={openSearch} onOpenChange={setOpenSearch}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between bg-white h-14 text-lg border-2 hover:border-primary/50">
                  <div className="flex items-center gap-3">
                    <Search className="h-5 w-5 text-muted-foreground" />
                    {selectedClient ? (
                      <span className="font-bold text-primary">{selectedClient.name} <span className="text-muted-foreground font-normal ml-2">({selectedClient.dni})</span></span>
                    ) : (
                      <span className="text-muted-foreground">Buscar cliente...</span>
                    )}
                  </div>
                  <ChevronsUpDown className="h-5 w-5 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command>
                  <CommandInput placeholder="Nombre o documento..." className="h-12" />
                  <CommandList>
                    <CommandEmpty>No hay resultados.</CommandEmpty>
                    {clients.map((c) => (
                      <CommandItem key={c.id} onSelect={() => {
                        setSelectedClient(c);
                        form.setValue("clienteId", c.id.toString());
                        setOpenSearch(false);
                      }} className="p-3 cursor-pointer">
                        <User className="mr-2 h-4 w-4 opacity-60" />
                        <div className="flex flex-col">
                          <span className="font-bold">{c.name}</span>
                          <span className="text-xs text-muted-foreground">{c.dni}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        {selectedClient && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4">
            
            {}
            <div className="xl:col-span-4 space-y-6">
              <Card className="overflow-hidden border-2 border-primary/10 shadow-xl">
                <CardHeader className="bg-slate-900 text-white py-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                      <User className="h-4 w-4 text-emerald-400" /> Datos del Titular
                    </CardTitle>
                    <Badge className="bg-emerald-500">Activo</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 gap-1">
                      <h3 className="text-2xl font-black text-slate-800">{selectedClient.name}</h3>
                      <div className="flex items-center gap-2 text-primary font-mono font-bold">
                        <CreditCard className="h-4 w-4" /> {selectedClient.dni}
                      </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> Teléfono</label>
                        <p className="text-sm font-bold">{selectedClient.phone || "-"}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> Email</label>
                        <p className="text-sm font-bold break-all">{selectedClient.email || "-"}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Dirección</label>
                        <p className="text-sm font-medium">{selectedClient.address}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1"><Navigation className="h-3 w-3" /> Código Postal / Ciudad</label>
                          <p className="text-sm font-bold">{selectedClient.postalCode} - {selectedClient.city}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1"><Globe className="h-3 w-3" /> Provincia</label>
                          <Badge variant="secondary" className="font-bold">{selectedClient.province}</Badge>
                        </div>
                      </div>
                    </div>
                  <Button variant="ghost" className="w-full text-xs text-destructive mt-4" onClick={() => setSelectedClient(null)}>Cambiar de cliente</Button>
                </CardContent>
              </Card>
            </div>

            {}
            <div className="xl:col-span-8 space-y-6">
              <Card className="shadow-xl border-t-4 border-t-primary">
                <CardHeader className="flex flex-row items-center justify-between py-5 border-b">
                  <CardTitle className="text-lg font-black">Servicios a Contratar</CardTitle>
                  <Button type="button" size="sm" onClick={() => append({ nombre: "", precioBase: 0 })}>
                    <Plus className="h-4 w-4 mr-1" /> Añadir
                  </Button>
                </CardHeader>
                <CardContent className="pt-6 space-y-8">
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-12 gap-4 items-end bg-slate-50/50 p-4 rounded-xl border">
                      <div className="col-span-12 md:col-span-8 space-y-2">
                        <FormLabel className="text-[10px] font-black uppercase">Producto</FormLabel>
                        <Select onValueChange={(val) => {
                          const p = availableProducts.find(x => x.id.toString() === val);
                          if(p) {
                            form.setValue(`servicios.${index}.nombre`, p.name);
                            form.setValue(`servicios.${index}.precioBase`, Number(p.price));
                          }
                        }}>
                          <SelectTrigger className="bg-white border-2"><SelectValue placeholder="Catálogo..." /></SelectTrigger>
                          <SelectContent>
                            {availableProducts.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name} ({p.price}€)</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Input {...form.register(`servicios.${index}.nombre`)} className="bg-white border-2 font-bold" />
                      </div>
                      <div className="col-span-10 md:col-span-3">
                        <FormLabel className="text-[10px] font-black uppercase">Precio (€)</FormLabel>
                        <Input type="number" {...form.register(`servicios.${index}.precioBase`)} className="bg-white border-2 font-black text-right" />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <Button variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive h-11 w-11"><Trash2 className="h-5 w-5" /></Button>
                      </div>
                    </div>
                  ))}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <FormField control={form.control} name="operadorDestino" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-black text-xs uppercase">Operador</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger className="h-14 border-2 font-bold"><SelectValue placeholder="Elegir..." /></SelectTrigger></FormControl>
                            <SelectContent>{OPERATOR_OPTIONS.map(op => <SelectItem key={op} value={op}>{op}</SelectItem>)}</SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                      <Textarea {...form.register("observaciones")} placeholder="Observaciones..." className="border-2 min-h-[100px]" />
                    </div>

                    <div className="flex flex-col justify-end">
                      <div className="bg-slate-900 text-white p-8 rounded-3xl flex flex-col items-end shadow-2xl border-b-8 border-emerald-500">
                        <span className="text-xs font-black uppercase text-emerald-400">Importe Final</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-7xl font-black">{currentTotal}</span>
                          <span className="text-2xl font-bold text-emerald-400">€</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-20 text-2xl font-black rounded-2xl bg-emerald-600 hover:bg-emerald-700 shadow-xl transition-all">
                    REGISTRAR VENTA POR {currentTotal}€
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