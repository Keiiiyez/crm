"use client"

import * as React from "react"
import { 
  Search, Printer, History, Calendar as CalendarIcon, 
  User, ShieldCheck, X, FileText, MapPin, Phone, Mail,
  CheckCircle2, XCircle, Clock, Trash2, MessageSquare, 
  ClipboardList, Gift, Wifi, Tv, Smartphone, Tag
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
import { Textarea } from "@/components/ui/textarea"
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

const SERVICE_STATUS = [
  { value: "pendiente", label: "Pendiente", color: "text-amber-500 bg-amber-500/10", icon: Clock },
  { value: "activo", label: "Activo", color: "text-emerald-500 bg-emerald-500/10", icon: CheckCircle2 },
  { value: "cancelado", label: "Cancelado", color: "text-rose-500 bg-rose-500/10", icon: XCircle },
]

export default function SalesHistoryPage() {
  const [sales, setSales] = React.useState<any[]>([])
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined)
  const [selectedSale, setSelectedSale] = React.useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false)

  const [tempNotes, setTempNotes] = React.useState("")
  const [tempChecklist, setTempChecklist] = React.useState<any>({})
  const [currentUser] = React.useState({ role: 'admin' });

  const downloadExpedientePDF = async (sale: any) => {
    setIsGeneratingPDF(true);
    try {
      await generateExpedientePDF(sale, null);
      toast.success('PDF descargado correctamente');
    } catch (e) {
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
      
      const salesArray = Array.isArray(resS) ? resS : [];
      const clientsArray = Array.isArray(resC) ? resC : [];
      
      const mergedSales = salesArray.map((sale: any) => {
        const matchingId = sale.cliente_id || sale.clienteId;
        const clientData = clientsArray.find((c: any) => c.id.toString() === matchingId?.toString());
        return { 
          ...sale, 
          clientFull: clientData,
          dni: clientData?.dni || sale.clienteDni, 
          dateObj: new Date(sale.createdAt || Date.now()) 
        };
      });
      setSales(mergedSales);
    } catch (e) { 
      toast.error("Error al cargar el historial") 
    }
  }, []);

  React.useEffect(() => { loadData() }, [loadData])

  React.useEffect(() => {
    if (selectedSale) {
      setTempNotes(selectedSale.gestion_notas || "")
      setTempChecklist(selectedSale.gestion_checklist || {})
    }
  }, [selectedSale])

  const saveGestion = async (updatedData: any) => {
    if (!selectedSale) return;
    try {
      await httpClient(`/api2/sales/${selectedSale.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      loadData();
    } catch (e) {
      toast.error("Error al sincronizar gestión");
    }
  };

  const updateSaleStatus = async (saleId: number, newStatus: string) => {
    setIsUpdating(true);
    try {
      const sale = sales.find(s => s.id === saleId);
      await httpClient(`/api2/sales/${saleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (newStatus === "Tramitada" && sale?.cliente_id) {
        await httpClient(`/api/clients/${sale.cliente_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operator: sale.operador_destino || sale.operadorDestino })
        });
      }
      toast.success(`Venta ${newStatus}`);
      loadData();
    } catch (e) {
      toast.error("Error al actualizar");
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteSale = async (saleId: number) => {
    if (!confirm("¿Eliminar venta permanentemente?")) return;
    try {
      const res = await httpClient(`/api2/sales/${saleId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success("Venta eliminada");
        loadData();
      }
    } catch (e) {
      toast.error("Error al eliminar");
    }
  };

  const filteredSales = React.useMemo(() => {
    return sales.filter(sale => {
      const name = (sale.clientName || sale.clientFull?.name || "").toLowerCase();
      const dni = (sale.dni || "").toLowerCase();
      const matchesText = name.includes(searchTerm.toLowerCase()) || dni.includes(searchTerm.toLowerCase());
      const matchesDate = !selectedDate ? true : 
        format(sale.dateObj, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
      return matchesText && matchesDate;
    });
  }, [sales, searchTerm, selectedDate]);

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-10 space-y-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-4 group">
          <div className="h-12 w-12 bg-white rounded-xl shadow-sm flex items-center justify-center transition-all duration-500 group-hover:rotate-[360deg]">
            <History className="h-6 w-6 text-slate-800" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
              Historial <span className="text-slate-400 font-normal">Ventas</span>
            </h1>
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-0.5">Gestión de operaciones</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-white px-4 py-1.5 rounded-lg border-none shadow-sm text-[9px] font-bold uppercase tracking-widest text-cyan-600">
            {filteredSales.length} Operaciones
        </Badge>
      </div>

      {/* FILTROS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-[1400px] mx-auto">
        <div className="md:col-span-3 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Buscar por cliente o DNI..." 
            className="h-12 pl-12 border-none shadow-sm rounded-xl bg-white font-semibold text-slate-600 text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-12 justify-start font-bold border-none shadow-sm rounded-xl bg-white px-6 uppercase text-[9px] tracking-widest">
              <CalendarIcon className="mr-3 h-4 w-4 text-cyan-500" />
              {selectedDate ? format(selectedDate, "PPP", { locale: es }) : "Filtrar por Fecha"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-2xl bg-white" align="end">
            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} locale={es} />
          </PopoverContent>
        </Popover>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="max-w-[1400px] mx-auto rounded-[2rem] bg-white border border-slate-50 shadow-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/40 border-b border-slate-100">
            <tr className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400/80">
              <th className="px-8 py-6">Fecha</th>
              <th className="px-8 py-6">Cliente</th>
              <th className="px-8 py-6">Asesor</th>
              <th className="px-8 py-6">Operadora</th>
              <th className="px-8 py-6 text-center">Estado</th>
              <th className="px-8 py-6 text-right">Importe</th>
              <th className="px-8 py-6 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredSales.map((sale: any) => (
              <tr key={sale.id} className="group hover:bg-slate-50/30 transition-all duration-300">
                <td className="px-8 py-4 text-slate-400 font-mono text-[13px]">
                    {format(sale.dateObj, 'dd/MM/yyyy')}
                </td>
                <td className="px-8 py-4 uppercase font-bold text-slate-700 text-[13px]">
                    {sale.clientName || sale.clientFull?.name}
                </td>
                <td className="px-8 py-4">
                    <span className="text-purple-600 font-bold uppercase text-[9px] tracking-widest bg-purple-50/40 px-2 py-1 rounded-md">
                        {sale.usuarioNombre || "—"}
                    </span>
                </td>
                <td className="px-8 py-4">
                    <span className="text-cyan-600 font-bold uppercase text-[9px] tracking-widest bg-cyan-50/40 px-2 py-1 rounded-md">
                        {sale.operadorDestino || sale.operador_destino}
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
                            "h-8 w-32 border-none font-bold text-[8.5px] uppercase rounded-lg shadow-sm",
                            STATUS_OPTIONS.find(opt => opt.value === sale.status)?.color
                          )}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-none shadow-2xl font-bold text-[9px] uppercase p-2">
                            {STATUS_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value} className="rounded-lg mb-1">
                                <div className="flex items-center gap-2">
                                  <opt.icon size={12} />
                                  {opt.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                    </div>
                </td>
                <td className="px-8 py-4 text-right font-bold text-slate-900 text-[13px]">
                    {Number(sale.precioCierre).toFixed(2)}€
                </td>
                <td className="px-8 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                        <Button 
                          variant="ghost" 
                          onClick={() => { setSelectedSale(sale); setIsModalOpen(true); }} 
                          className="h-9 w-9 p-0 rounded-lg border border-slate-100 shadow-sm text-slate-400 hover:text-cyan-600"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        {currentUser.role === 'admin' && (
                          <Button 
                            variant="ghost" 
                            onClick={() => deleteSale(sale.id)} 
                            className="h-9 w-9 p-0 rounded-lg border border-slate-100 shadow-sm text-slate-300 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL EXPEDIENTE COMPLETO */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-5xl p-0 rounded-[2.5rem] overflow-hidden border-none shadow-2xl">
          <div className="bg-slate-900 p-8 text-white flex justify-between items-center relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <ShieldCheck size={120} />
            </div>
            <div className="relative z-10 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">Expediente de Venta</p>
              <DialogTitle className="text-3xl font-black uppercase tracking-tighter">
                REF-{selectedSale?.id?.toString().padStart(6, '0')}
              </DialogTitle>
              <div className="flex items-center gap-3 mt-1">
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-none text-[8px] uppercase font-bold">Documento Activo</Badge>
                  <span className="text-slate-400 font-bold text-[9px] uppercase tracking-widest flex items-center gap-1">
                    <Clock size={12} /> {selectedSale && format(selectedSale.dateObj, "PPP", { locale: es })}
                  </span>
              </div>
            </div>
            <div className="flex gap-2 relative z-10">
              <Button onClick={() => window.print()} variant="ghost" className="h-10 w-10 rounded-xl bg-white/10 text-white"><Printer size={18}/></Button>
              <Button onClick={() => setIsModalOpen(false)} className="h-10 w-10 rounded-xl bg-white/10 hover:bg-rose-500 text-white"><X size={18}/></Button>
            </div>
          </div>
          
          <div className="p-10 space-y-8 bg-white overflow-y-auto max-h-[80vh]">
            
            {/* PANEL DE GESTIÓN DINÁMICO */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              <div className="lg:col-span-2 bg-slate-50 p-8 rounded-[2rem] border border-slate-100 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <ClipboardList size={16} className="text-cyan-600"/> Estados de Activación por Servicio
                  </h3>
                  <Badge className="bg-white text-slate-500 border-slate-200 text-[9px] uppercase px-3">{selectedSale?.servicios?.length || 0} Servicios</Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedSale?.servicios?.map((servicio: any, idx: number) => {
                    const serviceId = `srv_${idx}`;
                    const currentStatus = tempChecklist[serviceId] || "pendiente";
                    const statusTheme = SERVICE_STATUS.find(s => s.value === currentStatus);

                    return (
                      <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="h-7 w-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                                {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-black text-slate-800 uppercase truncate">{servicio.nombre}</p>
                            </div>
                        </div>

                        <Select 
                          value={currentStatus} 
                          onValueChange={(val) => {
                            const newCheck = { ...tempChecklist, [serviceId]: val };
                            setTempChecklist(newCheck);
                            saveGestion({ gestion_checklist: newCheck });
                          }}
                        >
                          <SelectTrigger className={cn("h-8 border-none font-black text-[8px] uppercase rounded-lg", statusTheme?.color)}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-none shadow-2xl rounded-xl">
                            {SERVICE_STATUS.map(st => (
                              <SelectItem key={st.value} value={st.value} className="text-[9px] font-bold uppercase">
                                <div className="flex items-center gap-2"><st.icon size={12} /> {st.label}</div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-900 p-8 rounded-[2rem] text-white flex flex-col justify-between shadow-xl">
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase text-cyan-400 tracking-widest flex items-center gap-2">
                        <MessageSquare size={16}/> Notas de Seguimiento
                    </h3>
                    <Textarea 
                        value={tempNotes}
                        onChange={(e) => setTempNotes(e.target.value)}
                        placeholder="Escribe incidencias aquí..."
                        className="bg-white/5 border-none text-[11px] h-32 resize-none rounded-2xl placeholder:text-slate-500 focus-visible:ring-cyan-500"
                    />
                    <Button 
                        onClick={() => { saveGestion({ gestion_notas: tempNotes }); toast.success("Nota guardada"); }}
                        className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-black uppercase text-[10px] h-10 rounded-xl"
                    >
                        Guardar Comentario
                    </Button>
                </div>
                <div className="pt-6 border-t border-white/10 mt-6">
                    <p className="text-[9px] font-bold uppercase text-slate-500">Asesor Responsable</p>
                    <p className="text-sm font-black text-white uppercase mt-1">{selectedSale?.usuarioNombre || "Sin asignar"}</p>
                </div>
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* DATOS DEL CLIENTE Y UBICACIÓN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <User className="text-cyan-600" size={16}/>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Información Titular</h3>
                </div>
                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 grid gap-3">
                  <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-400 uppercase">Nombre</span><span className="text-sm font-bold uppercase text-slate-700">{selectedSale?.clientFull?.name}</span></div>
                  <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-400 uppercase">DNI</span><span className="text-sm font-bold text-cyan-700 font-mono">{selectedSale?.clientFull?.dni}</span></div>
                  <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-400 uppercase">Teléfono</span><span className="text-sm font-bold text-slate-700">{selectedSale?.clientFull?.phone}</span></div>
                  <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-400 uppercase">Email</span><span className="text-[11px] font-bold text-slate-500 lowercase">{selectedSale?.clientFull?.email}</span></div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <MapPin className="text-cyan-600" size={16}/>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Punto de Suministro</h3>
                </div>
                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-4">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Dirección Completa</p>
                        <p className="text-sm font-medium text-slate-700 mt-1">{selectedSale?.clientFull?.address}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase">C. Postal</p><p className="text-sm font-bold text-slate-700">{selectedSale?.clientFull?.postalCode}</p></div>
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase">Localidad</p><p className="text-sm font-bold text-slate-700">{selectedSale?.clientFull?.city}</p></div>
                    </div>
                </div>
              </section>
            </div>

            {/* PROMOCIÓN Y OBSERVACIONES */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Tag className="text-cyan-600" size={16}/>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Promoción y Observaciones</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedSale?.promocionNombre ? (
                      <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl">
                        <p className="text-[11px] font-black text-emerald-700 uppercase flex items-center gap-2"><Gift size={16}/> {selectedSale.promocionNombre}</p>
                        <p className="text-[11px] text-emerald-600/80 mt-2 italic">{selectedSale.promocionDetalles}</p>
                      </div>
                    ) : <div className="p-5 bg-slate-50 border border-slate-200 border-dashed rounded-2xl text-center text-[10px] font-bold text-slate-400 uppercase">Sin promoción</div>}
                    
                    <div className="p-5 bg-amber-50/50 border border-amber-100 rounded-2xl">
                        <p className="text-[10px] font-black text-amber-600 uppercase mb-1">Nota original del asesor</p>
                        <p className="text-xs text-slate-600 italic">"{selectedSale?.observaciones || 'Sin observaciones'}"</p>
                    </div>
                </div>
            </section>

            {/* ACCIONES FINALES */}
            <div className="flex gap-4 pt-6">
                <Button 
                    disabled={isGeneratingPDF}
                    onClick={() => downloadExpedientePDF(selectedSale)} 
                    className="flex-1 h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                >
                  <Printer className="h-4 w-4" /> {isGeneratingPDF ? "Generando..." : "Descargar Expediente PDF"}
                </Button>
                <Button 
                    onClick={() => setIsModalOpen(false)} 
                    className="flex-1 h-14 bg-slate-900 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest"
                >
                  Cerrar Vista
                </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}