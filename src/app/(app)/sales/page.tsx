"use client"

import * as React from "react"
import { 
  Search, Printer, History, Calendar as CalendarIcon, 
  User, ShieldCheck, X, FileText, MapPin, Phone, Mail, CreditCard,
  CheckCircle2, XCircle, Clock, ChevronLeft, ChevronRight, Euro, Hash,
  Zap, Tv, Smartphone
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { httpClient } from "@/lib/http-client"
import { generateExpedientePDF } from "@/lib/pdf-generator"

const STATUS_OPTIONS = [
  { value: "Pendiente", label: "Pendiente", color: "bg-amber-50 text-amber-600 border-amber-100", icon: Clock },
  { value: "Tramitada", label: "Tramitada", color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: CheckCircle2 },
  { value: "Cancelada", label: "Cancelada", color: "bg-rose-50 text-rose-600 border-rose-100", icon: XCircle },
]

export default function SalesHistoryPage() {
  const [sales, setSales] = React.useState<any[]>([])
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined)
  const [selectedSale, setSelectedSale] = React.useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false)

  const downloadExpedientePDF = async (sale: any) => {
    setIsGeneratingPDF(true);
    try {
      // Usar lo que ya tenemos del merge en loadData
      // No necesitamos llamar a la API si ya tiene clientFull
      await generateExpedientePDF(sale, null);
      toast.success('PDF descargado');
    } catch (e) {
      console.error('PDF Error:', e);
      toast.error('Error al generar PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const loadData = React.useCallback(async () => {
    try {
      const [resS, resC] = await Promise.all([
        httpClient('/api2/sales').then(r => r.json()),
        httpClient('/api/clients').then(r => r.json())
      ]);
      
      console.log('=== SALES DATA ===');
      console.log('Sales from API:', resS);
      if (resS && resS.length > 0) {
        console.log('First sale object keys:', Object.keys(resS[0]));
        console.log('First sale full object:', resS[0]);
      }
      
      console.log('=== CLIENTS DATA ===');
      console.log('Clients from API:', resC);
      if (resC && resC.length > 0) {
        console.log('First client object:', resC[0]);
      }
      
      const salesArray = Array.isArray(resS) ? resS : [];
      const clientsArray = Array.isArray(resC) ? resC : [];
      
      const mergedSales = salesArray.map((sale: any) => {
        console.log(`Sale ${sale.id} - looking for cliente match with ID:`, sale.cliente_id, 'or clienteId:', sale.clienteId);
        const matchingId = sale.cliente_id || sale.clienteId;
        const clientData = clientsArray.find((c: any) => c.id.toString() === matchingId?.toString());
        console.log(`Result for sale ${sale.id}:`, clientData);
        return { 
          ...sale, 
          clientFull: clientData,
          dni: clientData?.dni || sale.clienteDni, 
          dateObj: new Date(sale.fecha || Date.now()) 
        };
      });
      setSales(mergedSales);
    } catch (e) { 
      console.error('Error loading data:', e);
      toast.error("Error al cargar el historial") 
    }
  }, []);

  React.useEffect(() => { loadData() }, [loadData])

  const updateSaleStatus = async (saleId: number, newStatus: string) => {
    setIsUpdating(true);
    try {
      const sale = sales.find(s => s.id === saleId);
      const res = await httpClient(`/api2/sales/${saleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error();

      if (newStatus === "Tramitada" && sale?.cliente_id) {
        await httpClient(`/api/clients/${sale.cliente_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operator: sale.operador_destino })
        });
        toast.success("Ficha del cliente actualizada");
      }

      toast.success(`Estado: ${newStatus}`);
      loadData();
    } catch (e) {
      toast.error("Error al actualizar");
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredSales = React.useMemo(() => {
    return sales.filter(sale => {
      const matchesText = 
        sale.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.dni?.includes(searchTerm);
      const matchesDate = !selectedDate ? true : 
        format(sale.dateObj, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
      return matchesText && matchesDate;
    });
  }, [sales, searchTerm, selectedDate]);

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-10 space-y-8 selection:bg-cyan-100 selection:text-cyan-900">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-4 group cursor-default">
          <div className="h-12 w-12 bg-white rounded-xl shadow-[0_8px_20px_-10px_rgba(0,0,0,0.1)] flex items-center justify-center transition-all duration-500 group-hover:rotate-[360deg]">
            <History className="h-6 w-6 text-slate-800 transition-colors group-hover:text-cyan-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
              Historial <span className="text-slate-400 font-normal">Ventas</span>
            </h1>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-0.5">Registro de operaciones</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-white px-4 py-1.5 rounded-lg border-none shadow-sm text-[9px] font-bold uppercase tracking-widest text-cyan-600 animate-pulse">
            {filteredSales.length} Operaciones
        </Badge>
      </div>

      {/* CONTROLES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-[1400px] mx-auto">
        <div className="md:col-span-3 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-cyan-500 transition-all z-10" />
          <Input 
            placeholder="Buscar por cliente o DNI..." 
            className="h-12 pl-12 border-none shadow-[0_15px_30px_-15px_rgba(0,0,0,0.05)] rounded-xl bg-white font-semibold text-slate-600 placeholder:font-medium text-xs transition-all focus:scale-[1.01]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-12 justify-start font-bold border-none shadow-[0_15px_30px_-15px_rgba(0,0,0,0.05)] rounded-xl bg-white px-6 uppercase text-[9px] tracking-widest transition-all hover:translate-y-[-2px]">
              <CalendarIcon className="mr-3 h-4 w-4 text-cyan-500" />
              {selectedDate ? format(selectedDate, "PPP", { locale: es }) : "Filtrar por Fecha"}
            </Button>
          </PopoverTrigger>
         <PopoverContent 
  className="w-[310px] p-4 border-none shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-3xl bg-white" 
  align="end"
  sideOffset={10}
>
  <Calendar 
    mode="single" 
    selected={selectedDate} 
    onSelect={setSelectedDate} 
    locale={es} 
  />
</PopoverContent>
        </Popover>
      </div>

      {/* TABLA */}
      <div className="max-w-[1400px] mx-auto relative rounded-[2rem] bg-white border border-slate-50 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.08)] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/40 border-b border-slate-100">
            <tr className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400/80">
              <th className="px-8 py-6">Fecha</th>
              <th className="px-8 py-6">Cliente</th>
              <th className="px-8 py-6">Asesor</th>
              <th className="px-8 py-6">Operadora</th>
              <th className="px-8 py-6 text-center">Estado</th>
              <th className="px-8 py-6 text-right">Importe</th>
              <th className="px-8 py-6 text-center">Detalles</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredSales.map((sale: any) => (
              <tr key={sale.id} className="group hover:bg-slate-50/30 transition-all duration-300">
                <td className="px-8 py-4 text-slate-400 font-mono text-[13px] tracking-tighter">
                    {format(sale.dateObj, 'dd/MM/yyyy')}
                </td>
                <td className="px-8 py-4 uppercase font-bold text-slate-700 text-[13px] tracking-tight group-hover:translate-x-1 transition-transform">
                    {sale.clientName}
                </td>
                <td className="px-8 py-4">
                    <span className="text-purple-600 font-bold uppercase text-[9px] tracking-widest bg-purple-50/40 px-2 py-1 rounded-md">
                        {sale.usuarioNombre || "—"}
                    </span>
                </td>
                <td className="px-8 py-4">
                    <span className="text-cyan-600 font-bold uppercase text-[9px] tracking-widest bg-cyan-50/40 px-2 py-1 rounded-md">
                        {sale.operador_destino || sale.operadorDestino}
                    </span>
                </td>
                <td className="px-8 py-4 text-center">
                    <div className="flex justify-center">
                        <Select 
                          disabled={isUpdating}
                          value={sale.status} 
                          onValueChange={(val) => updateSaleStatus(sale.id, val)}
                        >
                          <SelectTrigger className={cn(
                            "h-8 w-32 border-none font-bold text-[8.5px] uppercase rounded-lg shadow-sm transition-all",
                            STATUS_OPTIONS.find(opt => opt.value === sale.status)?.color
                          )}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-none shadow-2xl font-bold text-[9px] uppercase p-2">
                            {STATUS_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value} className="rounded-lg mb-1 last:mb-0">
                                <div className="flex items-center gap-2">
                                  <opt.icon size={12} className="opacity-70" />
                                  {opt.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    </div>
                </td>
                <td className="px-8 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 font-bold text-slate-900 text-[13px] group-hover:text-cyan-600 transition-colors">
                        {Number(sale.precio_cierre || sale.precioCierre).toFixed(2)} <span className="text-[10px] text-slate-300 font-normal">€</span>
                    </div>
                </td>
                <td className="px-8 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <Button 
                          variant="ghost" 
                          onClick={() => { setSelectedSale(sale); setIsModalOpen(true); }} 
                          className="h-10 w-10 p-0 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-lg hover:scale-105 transition-all text-slate-300 hover:text-cyan-600"
                          title="Ver detalles"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          disabled={isGeneratingPDF}
                          onClick={async () => {
                            await downloadExpedientePDF(sale);
                          }} 
                          className="h-10 w-10 p-0 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-lg hover:scale-105 transition-all text-slate-300 hover:text-emerald-600 disabled:opacity-50"
                          title="Descargar PDF"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL EXPEDIENTE COMPLETO */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl p-0 rounded-[2rem] overflow-hidden border-none shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="bg-slate-900 p-8 text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <ShieldCheck size={120} />
            </div>
            <div className="flex justify-between items-start relative z-10">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Expediente de Venta Oficial</p>
                <DialogTitle className="text-3xl font-bold tracking-tight uppercase">
                  REF-{selectedSale?.id?.toString().padStart(6, '0')}
                </DialogTitle>
                <div className="flex items-center gap-3 mt-2">
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-none text-[8px] uppercase font-bold px-3 py-1">Documento Digitalizado</Badge>
                    <div className="flex items-center gap-2 text-slate-400 font-bold text-[9px] uppercase tracking-widest">
                        <Clock size={12} /> {selectedSale && format(selectedSale.dateObj, "PPP 'a las' HH:mm", { locale: es })}
                    </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => window.print()} className="h-10 w-10 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all">
                    <Printer className="h-4 w-4" />
                </Button>
                <Button onClick={() => setIsModalOpen(false)} className="h-10 w-10 rounded-xl bg-white/10 hover:bg-rose-500 text-white transition-all">
                    <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="p-10 space-y-8 bg-white overflow-y-auto max-h-[80vh]">
            
            {/* SECCIÓN 1: DATOS PERSONALES */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <User className="text-cyan-600" size={16}/>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Información del Titular</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Nombre Completo</p>
                  <p className="text-sm font-bold uppercase text-slate-700">{selectedSale?.clientName || selectedSale?.clientFull?.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">DNI / NIE</p>
                  <p className="text-sm font-bold text-cyan-700 font-mono">{selectedSale?.clientFull?.dni || selectedSale?.dni}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Teléfono</p>
                  <p className="text-sm font-bold text-slate-700">{selectedSale?.clientFull?.phone || "No disponible"}</p>
                </div>
                <div className="md:col-span-3 space-y-1 pt-2 border-t border-slate-200/50">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Correo Electrónico</p>
                  <p className="text-sm font-bold text-slate-600 lowercase">{selectedSale?.clientFull?.email || "Sin email registrado"}</p>
                </div>
              </div>
            </section>

            {/* SECCIÓN 2: UBICACIÓN */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <MapPin className="text-cyan-600" size={16}/>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Punto de Suministro</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/30 p-6 rounded-2xl border border-dashed border-slate-200">
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Dirección</p>
                  <p className="text-sm font-medium text-slate-600">
                    {selectedSale?.clientFull?.address || "No especificada"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">C. Postal</p>
                        <p className="text-sm font-bold text-slate-600">{selectedSale?.clientFull?.postalCode}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Localidad</p>
                        <p className="text-sm font-bold text-slate-600">{selectedSale?.clientFull?.city}</p>
                    </div>
                </div>
              </div>
            </section>

           {/* SECCIÓN 3: DETALLE DEL CONTRATO */}
<section className="space-y-4">
  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
    <Hash className="text-cyan-600" size={16}/>
    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Detalle del Contrato</h3>
  </div>
  <div className="grid gap-4">
    {selectedSale?.servicios?.map((s: any, i: number) => {
      // Parsear JSONs que vienen de la tabla products
      const parseSafe = (data: any) => {
        if (!data) return [];
        if (typeof data === 'string') {
          try { return JSON.parse(data); } catch { return []; }
        }
        return data;
      };

      const streaming = parseSafe(s.streaming_services);
      const extras = parseSafe(s.extra_lines);

      return (
        <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3">
              <span className="h-6 w-6 bg-slate-900 text-white rounded text-[10px] flex items-center justify-center font-bold">{i + 1}</span>
              <span className="font-bold text-slate-700 text-[11px] uppercase">{s.nombre}</span>
            </div>
            <span className="font-bold text-slate-900 text-sm">{Number(s.precioBase).toFixed(2)} €</span>
          </div>
          
          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-slate-100">
            {s.fiber && (
              <div className="space-y-1">
                <p className="text-[8px] font-bold text-slate-400 uppercase">Fibra</p>
                <p className="text-xs font-bold text-slate-600">{s.fiber} MB</p>
              </div>
            )}
            {s.mobile_main_gb && (
              <div className="space-y-1">
                <p className="text-[8px] font-bold text-slate-400 uppercase">Móvil</p>
                <p className="text-xs font-bold text-slate-600">{s.mobile_main_gb}</p>
              </div>
            )}
            {s.tv_package && (
              <div className="space-y-1">
                <p className="text-[8px] font-bold text-slate-400 uppercase">Televisión</p>
                <p className="text-xs font-bold text-slate-600">{s.tv_package}</p>
              </div>
            )}
            
            {/* Servicios Streaming */}
            {streaming.length > 0 && (
              <div className="col-span-2 space-y-1">
                <p className="text-[8px] font-bold text-slate-400 uppercase">Streaming Incluido</p>
                <div className="flex gap-1">
                  {streaming.map((st: string) => (
                    <span key={st} className="text-[9px] font-bold text-white bg-slate-800 px-2 py-0.5 rounded uppercase">{st}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    })}
  </div>
</section>

            {/* FOOTER MODAL */}
            <div className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-900 rounded-[1.5rem] p-6 text-white flex items-center justify-between">
                        <div>
                            <p className="text-[9px] font-bold uppercase opacity-40 tracking-widest mb-1">Operadora Destino</p>
                            <p className="text-xl font-bold text-cyan-400 uppercase tracking-tighter">{selectedSale?.operador_destino || selectedSale?.operadorDestino}</p>
                        </div>
                        <ShieldCheck className="opacity-20" size={40} />
                    </div>
                    <div className="bg-cyan-600 rounded-[1.5rem] p-6 text-white flex items-center justify-between shadow-xl shadow-cyan-600/20">
                        <div>
                            <p className="text-[9px] font-bold uppercase opacity-60 tracking-widest mb-1">Importe Cierre</p>
                            <div className="text-3xl font-bold tracking-tighter">
                                {Number(selectedSale?.precio_cierre || selectedSale?.precioCierre).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                            </div>
                        </div>
                        <CreditCard className="opacity-30" size={40} />
                    </div>
                </div>

                <div className="flex gap-4 mt-8">
                    <Button 
                        disabled={isGeneratingPDF}
                        onClick={async () => {
                          await downloadExpedientePDF(selectedSale);
                        }} 
                        className="flex-1 h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Printer className="h-4 w-4" />
                      Descargar PDF
                    </Button>
                    <Button 
                        onClick={() => setIsModalOpen(false)} 
                        className="flex-1 h-14 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-900 font-bold rounded-2xl uppercase text-[10px] tracking-widest transition-all"
                    >
                      Cerrar Expediente
                    </Button>
                </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}