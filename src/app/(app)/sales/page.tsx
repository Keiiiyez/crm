"use client"

import * as React from "react"
import { 
  Search, Printer, History, Calendar as CalendarIcon, 
  User, ShieldCheck, X, FileText, MapPin, 
  CheckCircle2, XCircle, Clock, Trash2, MessageSquare, 
  ClipboardList, Gift, Wifi, Tv, Smartphone, Tag, Euro, ChevronRight
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

// --- CONFIGURACIÓN DE ESTADOS Y SUB-ESTADOS ---

const STATUS_CONFIG: Record<string, { label: string, color: string, icon: any, subStatuses: string[] }> = {
  "PTE COMERCIAL": { 
    label: "Pte Comercial", 
    color: "bg-amber-50 text-amber-600 border-amber-100", 
    icon: Clock,
    subStatuses: ["FALTAN DATOS", "DESISTE", "KO FIANZA"]
  },
  "TRAMITADA": { 
    label: "Tramitada", 
    color: "bg-emerald-50 text-emerald-600 border-emerald-100", 
    icon: CheckCircle2,
    subStatuses: ["PTE CARGA", "INCIDENCIA", "PLANIFICADA"]
  },
  "CANCELADA": { 
    label: "Cancelada", 
    color: "bg-rose-50 text-rose-600 border-rose-100", 
    icon: XCircle,
    subStatuses: ["KO SCORING", "CONTRAOFERTA", "PERMANENCIA", "KO TECNICO"]
  },
  "ACT PARCIAL": { 
    label: "Act Parcial", 
    color: "bg-blue-50 text-blue-600 border-blue-100", 
    icon: ClipboardList,
    subStatuses: [] 
  },
  "PTE FIRMA": { 
    label: "Pte Firma", 
    color: "bg-purple-50 text-purple-600 border-purple-100", 
    icon: FileText,
    subStatuses: [] 
  }
}

const SERVICE_STATUS = [
  { value: "pendiente", label: "Pendiente", color: "text-amber-600 bg-amber-50 border-amber-200", icon: Clock },
  { value: "activo", label: "Activo", color: "text-emerald-600 bg-emerald-50 border-emerald-200", icon: CheckCircle2 },
  { value: "cancelado", label: "Cancelado", color: "text-rose-600 bg-rose-50 border-rose-200", icon: XCircle },
]

export default function SalesHistoryPage() {
  const [sales, setSales] = React.useState<any[]>([])
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined)
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  
  const [selectedSale, setSelectedSale] = React.useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = React.useState(false)

  const [tempNotes, setTempNotes] = React.useState("")
  const [tempChecklist, setTempChecklist] = React.useState<any>({})
  const [currentUser] = React.useState({ role: 'admin' });

  // --- LÓGICA DE DATOS ---

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
    } catch (e) { toast.error("Error al cargar el historial") }
  }, []);

  React.useEffect(() => { loadData() }, [loadData])

  React.useEffect(() => {
    if (selectedSale) {
      setTempNotes(selectedSale.gestion_notes || selectedSale.gestion_notas || "")
      setTempChecklist(selectedSale.gestion_checklist || {})
    }
  }, [selectedSale])

  // --- ACCIONES ---

  const saveGestion = async (updatedData: any) => {
    if (!selectedSale) return;
    try {
      await httpClient(`/api2/sales/${selectedSale.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      setSales(prev => prev.map(s => s.id === selectedSale.id ? { ...s, ...updatedData } : s));
      setSelectedSale((prev: any) => ({ ...prev, ...updatedData }));
    } catch (e) { toast.error("Error al sincronizar") }
  };

  const updateSaleField = async (saleId: number, field: string, value: string) => {
    setIsUpdating(true);
    try {
      await httpClient(`/api2/sales/${saleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
      setSales(prev => prev.map(s => s.id === saleId ? { ...s, [field]: value } : s));
      if (selectedSale?.id === saleId) setSelectedSale((prev: any) => ({ ...prev, [field]: value }));
      toast.success("Estado actualizado");
    } catch (e) { toast.error("Error al actualizar") }
    finally { setIsUpdating(false) }
  };

  const deleteSale = async (saleId: number) => {
    if (!confirm("¿Eliminar venta permanentemente?")) return;
    try {
      await httpClient(`/api2/sales/${saleId}`, { method: 'DELETE' });
      toast.success("Venta eliminada");
      loadData();
    } catch (e) { toast.error("Error al eliminar") }
  };

  const downloadExpedientePDF = async (sale: any) => {
    setIsGeneratingPDF(true);
    try {
      await generateExpedientePDF(sale, null);
      toast.success('Documento generado');
    } catch (e) { toast.error('Error PDF') }
    finally { setIsGeneratingPDF(false) }
  };

  const filteredSales = React.useMemo(() => {
    return sales.filter(sale => {
      const name = (sale.clientName || sale.clientFull?.name || "").toLowerCase();
      const dni = (sale.dni || "").toLowerCase();
      const matchesText = name.includes(searchTerm.toLowerCase()) || dni.includes(searchTerm.toLowerCase());
      const matchesDate = !selectedDate ? true : format(sale.dateObj, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
      const matchesStatus = statusFilter === "all" ? true : sale.status === statusFilter;
      return matchesText && matchesDate && matchesStatus;
    });
  }, [sales, searchTerm, selectedDate, statusFilter]);

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-10 space-y-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-4 group">
          <div className="h-14 w-14 bg-white rounded-2xl shadow-sm flex items-center justify-center">
            <History className="h-7 w-7 text-slate-800" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase">Historial <span className="text-slate-400 font-light">de Ventas</span></h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-1">Control de Activaciones Centralizado</p>
          </div>
        </div>
        <Badge variant="outline" className="bg-white px-5 py-2 rounded-xl border-none shadow-sm text-[10px] font-black uppercase tracking-widest text-cyan-600">
            {filteredSales.length} Operaciones
        </Badge>
      </div>

      {/* FILTROS INTEGRADOS */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 max-w-[1400px] mx-auto">
        <div className="md:col-span-3 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Buscar por cliente, DNI o referencia..." 
            className="h-14 pl-12 border-none shadow-sm rounded-2xl bg-white font-semibold text-sm"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-14 bg-white border-none rounded-2xl shadow-sm font-bold uppercase text-[10px] tracking-widest">
            <SelectValue placeholder="Filtrar Estado" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-none shadow-2xl">
            <SelectItem value="all" className="font-black text-[10px] uppercase">TODOS LOS ESTADOS</SelectItem>
            {Object.keys(STATUS_CONFIG).map(key => (
              <SelectItem key={key} value={key} className="font-black text-[10px] uppercase">{key}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-14 font-bold border-none shadow-sm rounded-2xl bg-white px-6 uppercase text-[10px]">
              <CalendarIcon className="mr-3 h-5 w-5 text-cyan-500" />
              {selectedDate ? format(selectedDate, "dd/MM/yy") : "Fecha"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-none rounded-3xl overflow-hidden" align="end">
            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} locale={es} />
          </PopoverContent>
        </Popover>
      </div>

      {/* TABLA DE OPERACIONES */}
      <div className="max-w-[1400px] mx-auto rounded-[2.5rem] bg-white border border-slate-100 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b">
                <th className="px-8 py-7">Fecha Operación</th>
                <th className="px-8 py-7">Cliente / Titular</th>
                <th className="px-8 py-7 text-center">Estado Venta</th>
                <th className="px-8 py-7 text-center">Sub-Estado</th>
                <th className="px-8 py-7 text-right">Cierre (€)</th>
                <th className="px-8 py-7 text-center">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredSales.map((sale: any) => (
                <tr key={sale.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                      <p className="text-slate-900 font-bold text-sm">{format(sale.dateObj, 'dd MMM yyyy', { locale: es })}</p>
                      <p className="text-[10px] font-mono text-slate-400 uppercase">{format(sale.dateObj, 'HH:mm')} hrs</p>
                  </td>
                  <td className="px-8 py-5">
                      <p className="uppercase font-black text-slate-700 text-sm">{sale.clientName || sale.clientFull?.name}</p>
                      <p className="text-[10px] font-bold text-cyan-600/60 font-mono">{sale.dni || "Sin DNI"}</p>
                  </td>
                  <td className="px-8 py-5">
                      <div className="flex justify-center">
                        <Select disabled={isUpdating} value={sale.status} onValueChange={(val) => updateSaleField(sale.id, 'status', val)}>
                          <SelectTrigger className={cn("h-9 w-40 border-none font-black text-[9px] uppercase rounded-xl shadow-sm", STATUS_CONFIG[sale.status]?.color)}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-none shadow-2xl font-bold text-[10px] uppercase">
                            {Object.keys(STATUS_CONFIG).map(key => (
                              <SelectItem key={key} value={key} className="rounded-xl mb-1">{key}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-center">
                      <Select 
                        disabled={!STATUS_CONFIG[sale.status]?.subStatuses.length}
                        value={sale.sub_status || ""} 
                        onValueChange={(val) => updateSaleField(sale.id, 'sub_status', val)}
                      >
                        <SelectTrigger className="h-9 w-40 text-[9px] font-black uppercase rounded-xl bg-slate-50 border-slate-200">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl font-bold text-[10px] uppercase">
                          {STATUS_CONFIG[sale.status]?.subStatuses.map(sub => (
                            <SelectItem key={sub} value={sub} className="rounded-xl mb-1">{sub}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right font-black text-slate-900 text-base">{Number(sale.precioCierre).toFixed(2)}€</td>
                  <td className="px-8 py-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                          <Button onClick={() => { setSelectedSale(sale); setIsModalOpen(true); }} className="h-10 w-10 rounded-xl bg-slate-900 text-white shadow-lg"><FileText size={18} /></Button>
                          {currentUser.role === 'admin' && <Button variant="ghost" onClick={() => deleteSale(sale.id)} className="h-10 w-10 text-slate-300 hover:text-rose-600 hover:bg-rose-50"><Trash2 size={18} /></Button>}
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL EXPEDIENTE COMPLETO */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-6xl p-0 rounded-[3rem] overflow-hidden border-none shadow-2xl bg-slate-50">
          
          {/* HEADER MODAL */}
          <div className="bg-slate-900 p-10 text-white flex justify-between items-center relative">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><ShieldCheck size={200} /></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-cyan-500 text-slate-900 border-none text-[9px] font-black uppercase px-3">EXPEDIENTE DIGITAL</Badge>
                <span className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] flex items-center gap-2"><Clock size={14} /> {selectedSale && format(selectedSale.dateObj, "PPP", { locale: es })}</span>
              </div>
              <DialogTitle className="text-4xl font-black uppercase tracking-tighter">REF-{selectedSale?.id?.toString().padStart(6, '0')}</DialogTitle>
            </div>
            <div className="flex gap-3 relative z-10">
              <Button onClick={() => window.print()} variant="ghost" className="h-12 w-12 rounded-2xl bg-white/10 text-white"><Printer size={20}/></Button>
              <Button onClick={() => setIsModalOpen(false)} className="h-12 w-12 rounded-2xl bg-white/10 hover:bg-rose-500 text-white"><X size={20}/></Button>
            </div>
          </div>
          
          <div className="p-10 space-y-8 overflow-y-auto max-h-[75vh]">
            
            {/* APARTADO: IMPORTE TOTAL (NUEVO REQUERIMIENTO) */}
            <div className="bg-white p-8 rounded-[2.5rem] border-2 border-cyan-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-5">
                    <div className="h-16 w-16 bg-cyan-50 rounded-2xl flex items-center justify-center text-cyan-600"><Euro size={32}/></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Importe Total del Contrato</p>
                        <p className="text-4xl font-black text-slate-900">{Number(selectedSale?.precioCierre).toFixed(2)} €</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Badge className={cn("h-12 px-6 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2", STATUS_CONFIG[selectedSale?.status]?.color)}>
                        {selectedSale?.status} {selectedSale?.sub_status && <><ChevronRight size={12}/> {selectedSale.sub_status}</>}
                    </Badge>
                </div>
            </div>

            {/* ACTIVACIONES POR SERVICIO */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-[12px] font-black uppercase text-slate-800 tracking-widest flex items-center gap-2 border-b pb-4"><ClipboardList size={18} className="text-cyan-600"/> Estados de Activación</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedSale?.servicios?.map((servicio: any, idx: number) => {
                    const serviceId = `srv_${idx}`;
                    const currentStatus = tempChecklist[serviceId] || "pendiente";
                    const statusTheme = SERVICE_STATUS.find(s => s.value === currentStatus);
                    return (
                      <div key={idx} className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/60 transition-all">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-10 w-10 rounded-xl bg-slate-900 text-cyan-400 flex items-center justify-center shadow-lg">
                                {servicio.nombre.toLowerCase().includes('móvil') ? <Smartphone size={18}/> : servicio.nombre.toLowerCase().includes('fibra') ? <Wifi size={18}/> : <Tag size={18}/>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-black text-slate-800 uppercase truncate leading-none mb-1">{servicio.nombre}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase">Línea de Servicio {idx + 1}</p>
                            </div>
                        </div>
                        <Select value={currentStatus} onValueChange={(val) => {
                            const newCheck = { ...tempChecklist, [serviceId]: val };
                            setTempChecklist(newCheck);
                            saveGestion({ gestion_checklist: newCheck });
                          }}>
                          <SelectTrigger className={cn("h-10 border-2 font-black text-[9px] uppercase rounded-xl", statusTheme?.color)}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-none shadow-2xl rounded-2xl">{SERVICE_STATUS.map(st => (<SelectItem key={st.value} value={st.value} className="text-[10px] font-black uppercase py-3"><div className="flex items-center gap-3"><st.icon size={14} /> {st.label}</div></SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PANEL NOTAS */}
              <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col shadow-xl">
                <h3 className="text-[11px] font-black uppercase text-cyan-400 flex items-center gap-2 mb-6"><MessageSquare size={18}/> Notas Seguimiento</h3>
                <Textarea value={tempNotes} onChange={(e) => setTempNotes(e.target.value)} placeholder="Registrar incidencia..." className="bg-white/5 border-none text-xs h-48 resize-none rounded-2xl mb-4" />
                <Button onClick={() => { saveGestion({ gestion_notas: tempNotes }); toast.success("Nota guardada"); }} className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-black uppercase text-[10px] h-12 rounded-xl">Guardar Comentario</Button>
                <div className="pt-8 border-t border-white/10 mt-8 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center font-black text-slate-900 text-xs">{selectedSale?.usuarioNombre?.substring(0,2).toUpperCase() || "AS"}</div>
                    <div><p className="text-[9px] font-bold uppercase text-slate-500">Asesor</p><p className="text-sm font-black text-white uppercase">{selectedSale?.usuarioNombre || "Sin asignar"}</p></div>
                </div>
              </div>
            </div>

            {/* INFORMACIÓN CLIENTE Y SUMINISTRO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-50 pb-4"><div className="p-2 bg-cyan-50 rounded-lg text-cyan-600"><User size={20}/></div><h3 className="text-sm font-black text-slate-800 uppercase">Información del Titular</h3></div>
                <div className="space-y-4">
                  <DataRow label="Nombre Completo" value={selectedSale?.clientFull?.name} bold />
                  <DataRow label="DNI / NIE" value={selectedSale?.clientFull?.dni} isMono color="text-cyan-700" />
                  <DataRow label="Teléfono Contacto" value={selectedSale?.clientFull?.phone} />
                  <DataRow label="Correo Electrónico" value={selectedSale?.clientFull?.email} isLower />
                </div>
              </section>
              <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-50 pb-4"><div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><MapPin size={20}/></div><h3 className="text-sm font-black text-slate-800 uppercase">Punto de Suministro</h3></div>
                <div className="space-y-4">
                  <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Dirección de Instalación</p><p className="text-sm font-bold text-slate-700">{selectedSale?.clientFull?.address}</p></div>
                  <div className="grid grid-cols-2 gap-6 pt-2"><DataRow label="C. Postal" value={selectedSale?.clientFull?.postalCode} /><DataRow label="Localidad" value={selectedSale?.clientFull?.city} /></div>
                </div>
              </section>
            </div>

            {/* PROMOCIÓN */}
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-50 pb-4 mb-6"><div className="p-2 bg-amber-50 rounded-lg text-amber-600"><Tag size={20}/></div><h3 className="text-sm font-black text-slate-800 uppercase">Detalles de la Oferta</h3></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {selectedSale?.promocionNombre ? (
                    <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-3xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 text-emerald-200"><Gift size={40}/></div>
                      <p className="text-[11px] font-black text-emerald-700 uppercase mb-2">Promoción Aplicada</p>
                      <p className="text-base font-black text-emerald-900 uppercase">{selectedSale.promocionNombre}</p>
                      <p className="text-[11px] text-emerald-600/80 mt-2 font-medium">{selectedSale.promocionDetalles}</p>
                    </div>
                  ) : <div className="p-8 border-2 border-dashed border-slate-100 rounded-3xl flex items-center justify-center text-[10px] font-black text-slate-300 uppercase">Sin promoción</div>}
                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-3 flex items-center gap-2"><MessageSquare size={14}/> Observaciones de Venta</p>
                      <p className="text-xs text-slate-600 italic leading-relaxed">"{selectedSale?.observaciones || 'Sin observaciones adicionales.'}"</p>
                  </div>
                </div>
            </section>

            {/* BOTONES ACCIÓN */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Button disabled={isGeneratingPDF} onClick={() => downloadExpedientePDF(selectedSale)} className="flex-1 h-16 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl uppercase text-xs tracking-[0.1em] flex items-center justify-center gap-3 shadow-xl">
                  <Printer size={20} /> {isGeneratingPDF ? "Generando..." : "Descargar Expediente PDF"}
                </Button>
                <Button onClick={() => setIsModalOpen(false)} className="flex-1 h-16 bg-slate-900 text-white font-black rounded-2xl uppercase text-xs hover:bg-slate-800">Finalizar Revisión</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DataRow({ label, value, isMono = false, isLower = false, color = "text-slate-700", bold = false }: any) {
  return (
    <div className="flex justify-between items-center border-b border-slate-50 pb-2 last:border-0">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{label}</span>
      <span className={cn("text-[13px] tracking-tight", bold ? "font-black" : "font-bold", isMono ? "font-mono" : "", isLower ? "lowercase" : "uppercase", color)}>
        {value || "—"}
      </span>
    </div>
  )
}