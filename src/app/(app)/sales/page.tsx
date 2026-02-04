"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from "zod"
import { 
  Search, Trash2, User, Eye, Clock, Printer, FileText, 
  MapPin, Phone, Mail, CreditCard, ChevronsUpDown, CheckCircle2, AlertCircle
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const formSchema = z.object({
  clienteId: z.string().min(1),
  operadorDestino: z.string().min(1),
  status: z.enum(["Pendiente", "Tramitada", "Cancelada"]).default("Pendiente"),
  servicios: z.array(z.object({
    nombre: z.string().min(1),
    precioBase: z.coerce.number()
  })),
  precioCierre: z.number(),
  observaciones: z.string().optional(),
})

export default function SalesPage() {
  const [openSearch, setOpenSearch] = React.useState(false)
  const [clients, setClients] = React.useState<any[]>([])
  const [availableProducts, setAvailableProducts] = React.useState<any[]>([])
  const [sales, setSales] = React.useState<any[]>([])
  const [selectedClient, setSelectedClient] = React.useState<any | null>(null)
  const [selectedSale, setSelectedSale] = React.useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = React.useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { clienteId: "", operadorDestino: "", status: "Pendiente", servicios: [], precioCierre: 0 },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "servicios" })

  const loadData = React.useCallback(async () => {
    try {
      const [resC, resP, resS] = await Promise.all([
        fetch('/api/clients').then(r => r.json()),
        fetch('/api2/products').then(r => r.json()),
        fetch('/api2/sales').then(r => r.json())
      ]);
      
      setClients(resC || []);
      setAvailableProducts(resP || []);
      
      // Jalar datos del cliente dentro de cada venta (Data Merging)
      const mergedSales = (resS || []).map((sale: any) => {
        const clientData = (resC || []).find((c: any) => c.id.toString() === sale.clienteId?.toString());
        return { ...sale, clientFull: clientData };
      });
      setSales(mergedSales);
    } catch (e) { toast.error("Error de sincronización") }
  }, []);

  React.useEffect(() => { loadData() }, [loadData])

  const watchServicios = form.watch("servicios");
  const totalConImpuestos = React.useMemo(() => {
    const subtotal = watchServicios.reduce((acc, curr) => acc + (Number(curr.precioBase) || 0), 0);
    const prov = (selectedClient?.province || "").toLowerCase();
    let taxRate = 0.21;
    if (prov.includes("canarias")) taxRate = 0.07;
    return Number((subtotal * (1 + taxRate)).toFixed(2));
  }, [watchServicios, selectedClient]);

  React.useEffect(() => { form.setValue("precioCierre", totalConImpuestos) }, [totalConImpuestos, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const res = await fetch('/api2/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        toast.success("Venta registrada");
        form.reset();
        setSelectedClient(null);
        loadData();
      }
    } catch (e) { toast.error("Error al guardar") }
  };

  const updateStatus = async (saleId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api2/sales/${saleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success("Estado actualizado");
        loadData();
        if (selectedSale?.id === saleId) setSelectedSale({...selectedSale, status: newStatus});
      }
    } catch (e) { toast.error("No se pudo cambiar el estado") }
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4 space-y-6 bg-slate-50/50 min-h-screen text-slate-900">
      
      {/* BUSCADOR COMPACTO */}
      <section className="max-w-2xl mx-auto">
        <Popover open={openSearch} onOpenChange={setOpenSearch}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between h-10 border-cyan-100 rounded-xl bg-white shadow-sm">
              <div className="flex items-center gap-2 text-xs">
                <Search className="h-4 w-4 text-cyan-500" />
                {selectedClient ? <span className="font-bold">{selectedClient.name} — {selectedClient.dni}</span> : "Seleccionar cliente..."}
              </div>
              <ChevronsUpDown className="h-4 w-4 text-slate-300" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
            <Command>
              <CommandInput placeholder="Nombre o DNI..." className="h-9 text-xs" />
              <CommandList>
                <CommandGroup>
                  {clients.map((c) => (
                    <CommandItem key={c.id} onSelect={() => { setSelectedClient(c); form.setValue("clienteId", c.id.toString()); setOpenSearch(false); }} className="text-xs">
                      {c.name} ({c.dni})
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </section>

      {selectedClient && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 animate-in fade-in duration-300">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border border-cyan-100 rounded-2xl bg-white text-[11px]">
              <div><p className="font-black text-cyan-500 uppercase">Titular</p><p className="font-bold">{selectedClient.name}</p></div>
              <div><p className="font-black text-cyan-500 uppercase">DNI</p><p className="font-bold">{selectedClient.dni}</p></div>
              <div><p className="font-black text-cyan-500 uppercase">Provincia</p><p className="font-bold">{selectedClient.province}</p></div>
              <div className="flex justify-end"><Button variant="ghost" size="sm" onClick={() => setSelectedClient(null)} className="h-7 text-red-400 font-bold">X</Button></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-[10px] font-black uppercase text-slate-400">Líneas</h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => append({ nombre: "", precioBase: 0 })} className="h-7 text-[10px]">+ AÑADIR</Button>
                </div>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2 items-center bg-white p-2 border rounded-xl">
                    <Select onValueChange={(val) => {
                      const p = availableProducts.find(x => x.id.toString() === val);
                      if(p) { form.setValue(`servicios.${index}.nombre`, p.name); form.setValue(`servicios.${index}.precioBase`, p.price); }
                    }}>
                      <SelectTrigger className="h-8 w-40 text-[11px] bg-slate-50 border-none"><SelectValue placeholder="Producto..." /></SelectTrigger>
                      <SelectContent>{availableProducts.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input {...form.register(`servicios.${index}.nombre`)} className="h-8 text-[11px] border-none bg-slate-50" />
                    <Input type="number" {...form.register(`servicios.${index}.precioBase`)} className="w-20 h-8 text-[11px] text-right font-bold bg-slate-50 border-none" />
                    <Button variant="ghost" size="icon" onClick={() => remove(index)} className="h-8 w-8 text-slate-300"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-cyan-50 shadow-sm space-y-4">
                <FormField control={form.control} name="operadorDestino" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase text-slate-400">Receptor</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Compañía..." /></SelectTrigger></FormControl>
                      <SelectContent>{["Movistar", "Vodafone", "Orange", "Digi", "Yoigo"].map(op => <SelectItem key={op} value={op}>{op}</SelectItem>)}</SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <div className="flex justify-between items-end border-t pt-4">
                  <span className="text-[10px] font-black text-cyan-500 uppercase">Cierre</span>
                  <span className="text-2xl font-black">{totalConImpuestos} €</span>
                </div>
                <Button type="submit" className="w-full h-10 bg-cyan-600 hover:bg-cyan-700 text-white font-black text-[10px] rounded-xl uppercase tracking-widest">Registrar Venta</Button>
              </div>
            </div>
          </form>
        </Form>
      )}

      {/* TABLA COMPACTA */}
      <section className="bg-white border rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-[11px] text-left">
          <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 border-b">
            <tr>
              <th className="p-3">Cliente</th>
              <th className="p-3">Operador</th>
              <th className="p-3">Estado</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sales.map((sale: any) => (
              <tr key={sale.id} className="hover:bg-cyan-50/20 transition-colors">
                <td className="p-3 font-bold">{sale.clientName} <span className="block font-normal text-[9px] text-slate-400 italic">{sale.clienteDni}</span></td>
                <td className="p-3 font-medium text-cyan-700">{sale.operadorDestino}</td>
                <td className="p-3">
                  <Select defaultValue={sale.status} onValueChange={(val) => updateStatus(sale.id, val)}>
                    <SelectTrigger className="h-6 w-24 text-[9px] font-bold border-none bg-slate-100 uppercase">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pendiente" className="text-[10px]">Pendiente</SelectItem>
                      <SelectItem value="Tramitada" className="text-[10px]">Tramitada</SelectItem>
                      <SelectItem value="Cancelada" className="text-[10px]">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-3 text-right font-black">{sale.precioCierre} €</td>
                <td className="p-3 text-center">
                  <Button variant="outline" size="sm" onClick={() => { setSelectedSale(sale); setIsModalOpen(true); }} className="h-7 text-[9px] font-bold px-3">VER</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* MODAL AJUSTADO (CON DATOS COMPLETOS) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl p-0 rounded-2xl overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-slate-900 text-white flex flex-row justify-between items-center">
            <div className="space-y-1">
              <DialogTitle className="text-lg font-black uppercase tracking-tight italic">Expediente #{selectedSale?.id}</DialogTitle>
              <Badge className={selectedSale?.status === "Tramitada" ? "bg-green-500" : "bg-cyan-500"}>{selectedSale?.status}</Badge>
            </div>
            <Printer onClick={() => window.print()} className="h-5 w-5 text-slate-400 cursor-pointer hover:text-white" />
          </DialogHeader>
          
          <div className="p-8 space-y-8 bg-white">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 border-b pb-6">
              <div><p className="text-[9px] text-cyan-600 font-black uppercase tracking-widest">Titular</p><p className="font-bold text-slate-800">{selectedSale?.clientName}</p></div>
              <div><p className="text-[9px] text-cyan-600 font-black uppercase tracking-widest">DNI</p><p className="font-bold text-slate-800">{selectedSale?.clienteDni}</p></div>
              <div><p className="text-[9px] text-cyan-600 font-black uppercase tracking-widest">Teléfono</p><p className="font-bold text-slate-800">{selectedSale?.clientFull?.phone || "—"}</p></div>
              <div><p className="text-[9px] text-cyan-600 font-black uppercase tracking-widest">IBAN</p><p className="font-mono font-bold text-xs text-cyan-600 bg-cyan-50 px-2 py-1 rounded">{selectedSale?.clientFull?.iban || "—"}</p></div>
              <div className="col-span-2"><p className="text-[9px] text-cyan-600 font-black uppercase tracking-widest">Dirección</p><p className="font-bold text-xs">{selectedSale?.clientFull?.address}, {selectedSale?.clientFull?.province}</p></div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Resumen de Servicios</h4>
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-[11px]">
                  <tbody className="divide-y italic font-medium">
                    {selectedSale?.servicios?.map((s: any, i: number) => (
                      <tr key={i}><td className="p-3 text-slate-600">{s.nombre}</td><td className="p-3 text-right font-black">{s.precioBase} €</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center bg-cyan-50/50 p-6 rounded-2xl border border-cyan-100">
               <div><p className="text-[9px] text-cyan-500 font-black uppercase">Operador</p><p className="text-xl font-black italic">{selectedSale?.operadorDestino}</p></div>
               <div className="text-right"><p className="text-[9px] text-cyan-500 font-black uppercase">Importe Final</p><p className="text-4xl font-black">{selectedSale?.precioCierre} €</p></div>
            </div>
            
            <div className="flex gap-2">
                <Button onClick={() => setIsModalOpen(false)} className="flex-1 h-10 bg-slate-900 text-white font-black rounded-xl uppercase text-[10px]">Cerrar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}