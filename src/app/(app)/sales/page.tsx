"use client"

import * as React from "react"
import { 
  Search, Printer, History, Calendar as CalendarIcon, 
  User, ShieldCheck, X, FileText, MapPin, Phone, Mail, CreditCard,
  CheckCircle2, XCircle, Clock
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

  const updateSaleStatus = async (saleId: number, newStatus: string) => {
    setIsUpdating(true);
    try {
      const sale = sales.find(s => s.id === saleId);
      
      // 1. Actualizar Status de la Venta
      const res = await fetch(`/api2/sales/${saleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!res.ok) throw new Error();

      // 2. Si es TRAMITADA, actualizar operadora en la ficha del cliente
      if (newStatus === "Tramitada" && sale?.clienteId) {
        await fetch(`/api/clients/${sale.clienteId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operator: sale.operadorDestino })
        });
        toast.success("Ficha del cliente actualizada");
      }

      toast.success(`Estado: ${newStatus}`);
      loadData(); // Recargar datos
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
        sale.clienteDni?.includes(searchTerm);
      const matchesDate = !selectedDate ? true : 
        format(sale.dateObj, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
      return matchesText && matchesDate;
    });
  }, [sales, searchTerm, selectedDate]);

  return (
    <div className="space-y-8 p-8 bg-slate-50/50 min-h-screen text-slate-900">
      
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 flex items-center gap-3">
            <History className="h-8 w-8 text-cyan-500" /> Ventas
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Historial y estados.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative group">
          <Search className="absolute left-4 top-4 h-5 w-5 text-cyan-500" />
          <Input 
            placeholder="Buscar cliente o DNI..." 
            className="h-14 pl-12 border-none shadow-xl rounded-2xl bg-white font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-14 justify-start font-bold border-none shadow-xl rounded-2xl bg-white px-6">
              <CalendarIcon className="mr-2 h-5 w-5 text-cyan-500" />
              {selectedDate ? format(selectedDate, "PPP", { locale: es }) : "Fecha"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-2xl">
            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} locale={es} />
          </PopoverContent>
        </Popover>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl border-none overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 text-[9px] font-black uppercase text-slate-400">
            <tr>
              <th className="px-8 py-5">Fecha</th>
              <th className="px-8 py-5">Cliente</th>
              <th className="px-8 py-5">Operadora</th>
              <th className="px-8 py-5 text-center">Estado</th>
              <th className="px-8 py-5 text-right">Importe</th>
              <th className="px-8 py-5 text-center">Ver</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredSales.map((sale: any) => (
              <tr key={sale.id} className="hover:bg-cyan-50/10 transition-colors font-bold text-xs text-slate-700">
                <td className="px-8 py-6">{format(sale.dateObj, 'dd/MM/yyyy')}</td>
                <td className="px-8 py-6 uppercase">{sale.clientName}</td>
                <td className="px-8 py-6 text-cyan-600 font-black uppercase">{sale.operadorDestino}</td>
                <td className="px-8 py-6">
                   <div className="flex justify-center">
                    <Select 
                      disabled={isUpdating}
                      value={sale.status} 
                      onValueChange={(val) => updateSaleStatus(sale.id, val)}
                    >
                      <SelectTrigger className={cn(
                        "h-8 w-32 border-none font-black text-[9px] uppercase rounded-full shadow-sm",
                        STATUS_OPTIONS.find(opt => opt.value === sale.status)?.color
                      )}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-none font-black text-[10px] uppercase">
                        {STATUS_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl p-0 rounded-[2.5rem] overflow-hidden border-none shadow-2xl">
          <div className="bg-slate-900 p-8 text-white relative">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">Contrato generado</p>
                <DialogTitle className="text-3xl font-black tracking-tighter uppercase italic">
                  ID: #{selectedSale?.id?.toString().padStart(5, '0')}
                </DialogTitle>
              </div>
              <div className="flex gap-2">
                <Select 
                    value={selectedSale?.status} 
                    onValueChange={(val) => updateSaleStatus(selectedSale.id, val)}
                >
                    <SelectTrigger className={cn("h-10 w-36 border-none font-black text-[10px] uppercase rounded-xl", 
                        STATUS_OPTIONS.find(opt => opt.value === selectedSale?.status)?.color)}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="font-black uppercase">
                        {STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Button variant="ghost" onClick={() => window.print()} className="text-white hover:bg-white/10 rounded-xl border border-white/20">
                    <Printer className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="p-10 space-y-10 bg-white overflow-y-auto max-h-[70vh]">
            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-cyan-600 uppercase tracking-widest border-b pb-2">Datos del Cliente</h3>
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Nombre</p>
                  <p className="text-sm font-black uppercase">{selectedSale?.clientName}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">DNI</p>
                  <p className="text-sm font-black uppercase">{selectedSale?.clienteDni}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase">Dirección</p>
                  <p className="text-sm font-black">{selectedSale?.clientFull?.address || "No registrada"}</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-cyan-600 uppercase tracking-widest border-b pb-2">Servicios contratados</h3>
              <div className="space-y-2">
                {selectedSale?.servicios?.map((s: any, i: number) => (
                    <div key={i} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                        <span className="font-bold text-slate-700">{s.nombre}</span>
                        <span className="font-black text-slate-900">{Number(s.precioBase).toFixed(2)} €</span>
                    </div>
                ))}
              </div>
            </section>

            <div className="flex gap-4">
              <div className="flex-1 bg-slate-900 rounded-3xl p-6 text-white text-center">
                <p className="text-[9px] font-black uppercase opacity-50">Operadora</p>
                <p className="text-xl font-black text-cyan-400 uppercase">{selectedSale?.operadorDestino}</p>
              </div>
              <div className="flex-1 bg-cyan-600 rounded-3xl p-6 text-white text-center">
                <p className="text-[9px] font-black uppercase opacity-80">Total</p>
                <div className="text-3xl font-black">{Number(selectedSale?.precioCierre).toLocaleString('es-ES')} €</div>
              </div>
            </div>

            <Button onClick={() => setIsModalOpen(false)} className="w-full h-14 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black rounded-2xl uppercase text-[10px]">
              Cerrar Expediente
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}