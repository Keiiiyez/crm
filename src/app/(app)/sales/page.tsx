"use client"

import * as React from "react"
import { 
  Search, Printer, History, Calendar as CalendarIcon, 
  User, ShieldCheck, X, FileText, MapPin, Phone, Mail, CreditCard,
  RefreshCw, CheckCircle2, XCircle, Clock
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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

const STATUS_OPTIONS = [
  { value: "Pendiente", label: "Pendiente", color: "bg-cyan-50 text-cyan-600", icon: Clock },
  { value: "Tramitada", label: "Tramitada", color: "bg-emerald-50 text-emerald-600", icon: CheckCircle2 },
  { value: "Cancelada", label: "Cancelada", color: "bg-red-50 text-red-600", icon: XCircle },
]

export default function SalesHistoryPage() {
  const [sales, setSales] = React.useState<any[]>([])
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined)
  const [selectedSale, setSelectedSale] = React.useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [isUpdating, setIsUpdating] = React.useState(false)

  const loadData = React.useCallback(async () => {
    try {
      const [resS, resC] = await Promise.all([
        fetch('/api2/sales').then(r => r.json()),
        fetch('/api/clients').then(r => r.json())
      ]);
      
      const mergedSales = (resS || []).map((sale: any) => {
        const clientData = (resC || []).find((c: any) => c.id.toString() === sale.clienteId?.toString());
        return { 
          ...sale, 
          clientFull: clientData,
          dateObj: new Date(sale.createdAt || Date.now()) 
        };
      });
      setSales(mergedSales);
    } catch (e) { 
      toast.error("Error al cargar el historial") 
    }
  }, []);

  React.useEffect(() => { loadData() }, [loadData])

  // FUNCIÓN PARA ACTUALIZAR STATUS
  const updateSaleStatus = async (saleId: number, newStatus: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api2/sales/${saleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error();

      toast.success(`Estado actualizado a ${newStatus}`);
      
      // Actualizar estado local
      setSales(prev => prev.map(s => s.id === saleId ? { ...s, status: newStatus } : s));
      if (selectedSale?.id === saleId) {
        setSelectedSale((prev: any) => ({ ...prev, status: newStatus }));
      }
    } catch (e) {
      toast.error("No se pudo actualizar el estado");
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredSales = React.useMemo(() => {
    return sales.filter(sale => {
      const matchesText = 
        sale.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.clienteDni?.includes(searchTerm);
      const matchesDate = !selectedDate ? true : 
        format(sale.dateObj, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
      return matchesText && matchesDate;
    });
  }, [sales, searchTerm, selectedDate]);

  return (
    <div className="space-y-8 p-8 bg-slate-50/50 min-h-screen text-slate-900">
      
      {/* CABECERA */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 flex items-center gap-3">
            <History className="h-8 w-8 text-cyan-500" /> Ventas
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Historial de ventas registradas.</p>
        </div>
      </div>

      {/* FILTROS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative group">
          <Search className="absolute left-4 top-4 h-5 w-5 text-cyan-500" />
          <Input 
            placeholder="Buscar por cliente o DNI..." 
            className="h-14 pl-12 border-none shadow-xl shadow-cyan-900/5 rounded-2xl bg-white font-bold text-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-14 justify-start font-bold border-none shadow-xl shadow-cyan-900/5 rounded-2xl bg-white px-6">
              <CalendarIcon className="mr-2 h-5 w-5 text-cyan-500" />
              {selectedDate ? format(selectedDate, "PPP", { locale: es }) : "Filtrar por fecha"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-2xl">
            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} locale={es} />
          </PopoverContent>
        </Popover>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-cyan-900/5 border-none overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 text-[9px] font-black uppercase text-slate-400">
            <tr>
              <th className="px-8 py-5">Fecha</th>
              <th className="px-8 py-5">Cliente</th>
              <th className="px-8 py-5">Operadora</th>
              <th className="px-8 py-5 text-center">Estado / Acción</th>
              <th className="px-8 py-5 text-right">Importe</th>
              <th className="px-8 py-5 text-center">Ver</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredSales.map((sale: any) => (
              <tr key={sale.id} className="hover:bg-cyan-50/20 transition-colors group font-bold text-xs text-slate-700">
                <td className="px-8 py-6">{format(sale.dateObj, 'dd/MM/yyyy')}</td>
                <td className="px-8 py-6">
                    <div>{sale.clientName}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{sale.clienteDni}</div>
                </td>
                <td className="px-8 py-6 text-cyan-600 font-black uppercase">{sale.operadorDestino}</td>
                <td className="px-8 py-6">
                  <div className="flex justify-center">
                    <Select 
                      disabled={isUpdating}
                      value={sale.status} 
                      onValueChange={(val) => updateSaleStatus(sale.id, val)}
                    >
                      <SelectTrigger className={cn(
                        "h-8 w-32 border-none font-black text-[9px] uppercase rounded-full shadow-sm transition-all px-3",
                        STATUS_OPTIONS.find(opt => opt.value === sale.status)?.color
                      )}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-2xl font-black text-[10px] uppercase">
                        {STATUS_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value} className="focus:bg-slate-100">
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
                <td className="px-8 py-6 text-right font-black text-slate-900">{sale.precioCierre} €</td>
                <td className="px-8 py-6 text-center">
                    <Button variant="ghost" onClick={() => { setSelectedSale(sale); setIsModalOpen(true); }} className="h-9 w-9 p-0 rounded-xl">
                      <FileText className="h-4 w-4 text-slate-400" />
                    </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DETALLE COMPLETO */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl p-0 rounded-[2.5rem] overflow-hidden border-none shadow-2xl scale-95 md:scale-100">
          {/* Header del Expediente */}
          <div className="bg-slate-900 p-8 text-white relative">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">Expediente de Venta Oficial</p>
                <DialogTitle className="text-3xl font-black tracking-tighter uppercase">ID CONTRATO: #{selectedSale?.id?.toString().padStart(5, '0')}</DialogTitle>
                <p className="text-xs font-bold text-slate-400">Generado el {selectedSale?.dateObj && format(selectedSale.dateObj, "PPP", { locale: es })}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => window.print()} className="text-white hover:bg-white/10 rounded-xl border border-white/20 px-4">
                  <Printer className="h-4 w-4 mr-2" /> IMPRIMIR
                </Button>
              </div>
            </div>

            {/* Selector de Estado dentro del Modal */}
            <div className="mt-6 flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10 w-fit">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Estado Actual:</p>
              <Select 
                value={selectedSale?.status} 
                onValueChange={(val) => updateSaleStatus(selectedSale.id, val)}
              >
                <SelectTrigger className={cn(
                  "h-9 w-40 border-none font-black text-[10px] uppercase rounded-xl shadow-lg transition-all",
                  STATUS_OPTIONS.find(opt => opt.value === selectedSale?.status)?.color
                )}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none font-black uppercase">
                  {STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="p-10 space-y-10 bg-white overflow-y-auto max-h-[70vh]">
            {/* BLOQUE 1: DATOS COMPLETOS DEL CLIENTE */}
            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-cyan-600 uppercase tracking-widest border-b border-cyan-50 pb-2">Información del Titular</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1"><User size={10}/> Nombre Completo</p>
                  <p className="text-sm font-black text-slate-800">{selectedSale?.clientName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1"><ShieldCheck size={10}/> Documento (DNI/NIE)</p>
                  <p className="text-sm font-black text-slate-800">{selectedSale?.clienteDni}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1"><Phone size={10}/> Teléfono de Contacto</p>
                  <p className="text-sm font-black text-slate-800">{selectedSale?.clientFull?.phone || "No registrado"}</p>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1"><Mail size={10}/> Correo Electrónico</p>
                  <p className="text-sm font-black text-slate-800">{selectedSale?.clientFull?.email || "No registrado"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1"><MapPin size={10}/> Provincia</p>
                  <p className="text-sm font-black text-slate-800">{selectedSale?.clientFull?.province || "No registrado"}</p>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1"><MapPin size={10}/> Dirección</p>
                  <p className="text-sm font-black text-slate-800">{selectedSale?.clientFull?.address || "No registrada"}</p>
                </div>
                <div className="space-y-1 md:col-span-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1"><CreditCard size={10}/> IBAN</p>
                  <p className="text-xs font-mono font-black text-cyan-600 bg-cyan-50 px-2 py-1 rounded-md">
                    {selectedSale?.clientFull?.iban || "Pendiente"}
                  </p>
                </div>
              </div>
            </section>

            {/* BLOQUE 2: SERVICIOS */}
            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-cyan-600 uppercase tracking-widest border-b border-cyan-50 pb-2">Servicios y Tarifas</h3>
              <div className="border border-slate-100 rounded-3xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400">
                    <tr>
                      <th className="px-6 py-3">Concepto / Producto</th>
                      <th className="px-6 py-3 text-right">Precio Base</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {selectedSale?.servicios?.map((s: any, i: number) => (
                      <tr key={i}>
                        <td className="px-6 py-4 font-bold text-slate-700">{s.nombre}</td>
                        <td className="px-6 py-4 text-right font-black text-slate-900">{Number(s.precioBase).toFixed(2)} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* BLOQUE 3: TOTALES */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch">
              <div className="flex-1 bg-slate-900 rounded-3xl p-6 text-white">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-1">Operadora Destino</p>
                <p className="text-2xl font-black uppercase text-cyan-400">{selectedSale?.operadorDestino}</p>
              </div>
              <div className="flex-1 bg-cyan-600 rounded-3xl p-6 text-white shadow-xl shadow-cyan-600/20">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-80 mb-1">Importe Total Cierre</p>
                <div className="text-4xl font-black">{Number(selectedSale?.precioCierre).toLocaleString('es-ES')} €</div>
              </div>
            </div>

            <Button onClick={() => setIsModalOpen(false)} className="w-full h-14 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black rounded-2xl uppercase text-[10px] tracking-widest">
              Cerrar Vista Previa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}