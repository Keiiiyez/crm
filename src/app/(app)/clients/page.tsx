"use client"

import * as React from "react"
import { 
  PlusCircle, 
  Loader2, 
  FileSpreadsheet, 
  AlertCircle, 
  User, 
  MapPin, 
  CreditCard, 
  Search, 
  X,
  Phone,
  Mail
} from "lucide-react"
import { toast } from "sonner"
import * as XLSX from "xlsx"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"

import { DataTable } from "@/components/data-table"
import { columns } from "@/components/clients/columns"
import { OPERATOR_OPTIONS } from "@/lib/data"
import type { Client } from "@/lib/definitions"

export default function ClientsPage() {
  const [data, setData] = React.useState<Client[]>([])
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [editingClient, setEditingClient] = React.useState<any | null>(null)
  const [operator, setOperator] = React.useState<string>("")
  const [ibanValue, setIbanValue] = React.useState("")
  const [pendingSale, setPendingSale] = React.useState<any>(null)

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      toast.error("Error al conectar con el servidor")
    }
  }

  React.useEffect(() => {
    fetchClients()
  }, [])

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        const findValueNextTo = (labels: string[]) => {
          for (let r = 0; r < rows.length; r++) {
            for (let c = 0; c < rows[r].length; c++) {
              const cellValue = String(rows[r][c] || "").toUpperCase();
              if (labels.some(label => cellValue.includes(label.toUpperCase()))) {
                return rows[r][c + 1] || rows[r][c + 2] || "";
              }
            }
          }
          return "";
        };

        const rawIban = String(findValueNextTo(["No. DE CUENTA", "IBAN"])).trim().replace(/\s/g, "");

        const excelData: any = {
          name: String(findValueNextTo(["DENOMINACION SOCIAL", "TITULAR", "NOMBRE"])).trim(),
          dni: String(findValueNextTo(["CIF / NIF", "NIF/NIE", "DNI"])).trim().toUpperCase(),
          email: String(findValueNextTo(["E-MAIL", "CORREO"])).trim().toLowerCase(),
          address: String(findValueNextTo(["DIRECCION", "DOMICILIO SOCIAL"])).trim(),
          city: String(findValueNextTo(["LOCALIDAD", "POBLACION"])).trim(),
          province: String(findValueNextTo(["PROVINCIA"])).trim(),
          postalCode: String(findValueNextTo(["CODIGO POSTAL", "C.P."])).trim(),
          phone: String(findValueNextTo(["TELEFONO DE CONTACTO", "MOVIL", "CONTACTO"])).trim(),
          iban: rawIban,
          operator: String(findValueNextTo(["OPERADOR", "COMPAÑÍA", "OPERADOR DONANTE"])).trim(),
          nationality: String(findValueNextTo(["NACIONALIDAD"])).trim(),
          birthDate: String(findValueNextTo(["FECHA NAC.", "FECHA DE NACIMIENTO"])).trim(),
          gender: String(findValueNextTo(["GENERO", "GÉNERO"])).trim(),
          bankName: String(findValueNextTo(["BANCO"])).trim(),
          observations: String(findValueNextTo(["OBSERVACIONES"])).trim()
        };

        const rawPrice = String(findValueNextTo(["TOTAL A PAGAR", "PROMOCION"]));
        const cleanPrice = rawPrice.replace(/[^\d,.]/g, '').replace(',', '.');
        const finalPrice = parseFloat(cleanPrice) || 0;
        
        setPendingSale({
          total: finalPrice,
          observations: excelData.observations,
          operator_destino: excelData.operator
        });

        if (!excelData.name && !excelData.dni) {
          throw new Error("No se pudo encontrar el Nombre o DNI.");
        }

        setEditingClient(excelData);
        setOperator(excelData.operator || "");
        setIbanValue(rawIban);
        setOpen(true);

        toast.success("Excel procesado con éxito");
      } catch (error: any) {
        toast.error(error.message || "Error al procesar el Excel");
      }
    };
    reader.readAsBinaryString(file);
    if (e.target) e.target.value = "";
  };

  const handleEdit = (client: any) => {
    setEditingClient(client)
    setOperator(client.operator || "") 
    setIbanValue(client.iban || "")
    setPendingSale(null) 
    setOpen(true)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const clientFields = Object.fromEntries(formData.entries());

    if (ibanValue.length !== 24) {
      return toast.error("El IBAN debe tener 24 caracteres");
    }

    setIsSubmitting(true);

    const finalPayload = {
      client: {
        ...clientFields,
        id: editingClient?.id || undefined, 
        operator: operator,
        iban: ibanValue,
      },
      sale: pendingSale && pendingSale.total > 0 ? pendingSale : null
    };

    const url = editingClient?.id ? `/api/clients/${editingClient.id}` : '/api/clients';
    const method = editingClient?.id ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload),
      });

      if (response.ok) {
        toast.success(editingClient?.id ? "Registro actualizado" : "Cliente guardado correctamente");
        setOpen(false);
        fetchClients(); 
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Error en el servidor");
      }
    } catch (error) {
      toast.error("Error al procesar la solicitud");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 p-8 bg-slate-50/50 min-h-screen text-slate-900">
      
      {/* CABECERA ESTILO DASHBOARD */}
      <div className="flex justify-between items-end px-2">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-800 flex items-center gap-3 uppercase">
            <User className="h-8 w-8 text-cyan-500" /> Cartera de Clientes
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Gestión avanzada de identidades y facturación bancaria</p>
        </div>

        <div className="flex gap-3">
          <input type="file" className="hidden" ref={fileInputRef} accept=".xlsx, .xls" onChange={handleImportExcel} />
          <Button 
            variant="outline" 
            className="h-12 border-none shadow-xl shadow-cyan-900/5 bg-white text-emerald-600 hover:bg-emerald-50 font-black text-[10px] uppercase rounded-2xl px-6 transition-all"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Importar Excel
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button 
                className="h-12 bg-slate-900 hover:bg-cyan-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl px-6 shadow-xl shadow-slate-200 transition-all border-none"
                onClick={() => { setEditingClient(null); setPendingSale(null); }}
              >
                 <PlusCircle className="h-4 w-4 mr-2" /> Nuevo Registro
              </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-[850px] p-0 rounded-[2.5rem] overflow-hidden border-none shadow-2xl">
              <form onSubmit={handleSubmit}>
                <div className="bg-slate-900 p-8 text-white relative">
                  <DialogHeader>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 mb-2">Expediente de Identidad</p>
                    <DialogTitle className="text-3xl font-black tracking-tighter uppercase">
                      {editingClient?.id ? `Editando: ${editingClient.name}` : "Registrar Nuevo Cliente"}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 font-bold text-xs uppercase mt-2">
                      {pendingSale ? `✨ Detectada venta automática de ${pendingSale.total}€` : "Verifique los datos antes de guardar el registro."}
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <div className="p-8 space-y-8 bg-white overflow-y-auto max-h-[70vh]">
                  {ibanValue && ibanValue.length !== 24 && (
                    <Alert className="bg-red-50 border-none rounded-2xl py-3 px-4">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <AlertDescription className="text-[10px] font-black uppercase text-red-600 ml-2">
                        IBAN Incorrecto: Faltan {24 - ibanValue.length} caracteres para alcanzar los 24 requeridos.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* COLUMNA 1: PERSONALES */}
                    <div className="space-y-4">
                      <h4 className="text-[9px] font-black text-cyan-600 uppercase tracking-widest flex items-center gap-2 border-b border-slate-50 pb-2">
                        <User size={12}/> Identidad Legal
                      </h4>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-[9px] font-black text-slate-400 uppercase ml-1">Titular</Label>
                          <Input name="name" defaultValue={editingClient?.name || ""} required className="bg-slate-50 border-none rounded-xl font-bold h-11" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] font-black text-slate-400 uppercase ml-1">DNI / NIE / CIF</Label>
                          <Input name="dni" defaultValue={editingClient?.dni || ""} required className="bg-slate-50 border-none rounded-xl font-mono uppercase font-black text-cyan-600 h-11" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[9px] font-black text-slate-400 uppercase ml-1">Nacionalidad</Label>
                            <Input name="nationality" defaultValue={editingClient?.nationality || ""} className="bg-slate-50 border-none rounded-xl text-xs font-bold h-11" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] font-black text-slate-400 uppercase ml-1">Género</Label>
                            <Input name="gender" defaultValue={editingClient?.gender || ""} className="bg-slate-50 border-none rounded-xl text-xs font-bold h-11" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* COLUMNA 2: CONTACTO */}
                    <div className="space-y-4">
                      <h4 className="text-[9px] font-black text-cyan-600 uppercase tracking-widest flex items-center gap-2 border-b border-slate-50 pb-2">
                        <MapPin size={12}/> Ubicación y Contacto
                      </h4>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-[9px] font-black text-slate-400 uppercase ml-1">Teléfono Principal</Label>
                          <Input name="phone" defaultValue={editingClient?.phone || ""} required className="bg-slate-50 border-none rounded-xl font-bold h-11" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] font-black text-slate-400 uppercase ml-1">E-mail</Label>
                          <Input name="email" type="email" defaultValue={editingClient?.email || ""} required className="bg-slate-50 border-none rounded-xl font-bold lowercase h-11" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] font-black text-slate-400 uppercase ml-1">Dirección Completa</Label>
                          <Input name="address" defaultValue={editingClient?.address || ""} required className="bg-slate-50 border-none rounded-xl text-[11px] font-bold h-11" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input name="city" placeholder="Ciudad" defaultValue={editingClient?.city || ""} className="bg-slate-50 border-none rounded-xl text-xs font-bold h-11" />
                          <Input name="postalCode" placeholder="C.P." defaultValue={editingClient?.postalCode || ""} className="bg-slate-50 border-none rounded-xl text-xs font-bold h-11" />
                        </div>
                      </div>
                    </div>

                    {/* COLUMNA 3: BANCO */}
                    <div className="space-y-4">
                      <h4 className="text-[9px] font-black text-cyan-600 uppercase tracking-widest flex items-center gap-2 border-b border-slate-50 pb-2">
                        <CreditCard size={12}/> Datos de Pago
                      </h4>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-[9px] font-black text-slate-400 uppercase ml-1">Operadora Actual</Label>
                          <Select value={operator} onValueChange={setOperator} required>
                            <SelectTrigger className="bg-slate-50 border-none rounded-xl font-black uppercase text-[10px] h-11 focus:ring-0"><SelectValue placeholder="SELECCIONAR..." /></SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                              {OPERATOR_OPTIONS.map(op => <SelectItem key={op} value={op} className="font-bold text-[10px]">{op}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] font-black text-slate-400 uppercase ml-1">IBAN (24 Caracteres)</Label>
                          <Input 
                            value={ibanValue} 
                            onChange={(e) => setIbanValue(e.target.value.replace(/\s/g, "").toUpperCase())}
                            required 
                            className="bg-cyan-50 border-none rounded-xl font-mono text-[10px] font-black text-cyan-700 h-11"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] font-black text-slate-400 uppercase ml-1">Observaciones</Label>
                          <Textarea name="observations" defaultValue={editingClient?.observations || ""} className="bg-slate-50 border-none rounded-xl h-24 text-[10px] font-bold resize-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="p-8 bg-slate-50 border-t border-slate-100">
                  <Button 
                    type="submit" 
                    className="w-full h-14 bg-slate-900 hover:bg-cyan-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-[0.2em] transition-all shadow-xl disabled:opacity-50" 
                    disabled={isSubmitting || (ibanValue.length > 0 && ibanValue.length !== 24)}
                  >
                    {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : editingClient?.id ? "Actualizar Expediente" : "Confirmar Alta de Cliente"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* TABLA REDONDEADA ESTILO DASHBOARD */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-cyan-900/5 border-none overflow-hidden">
        <div className="p-6">
          <DataTable 
            columns={columns(handleEdit)} 
            data={data} 
            filterInputPlaceholder="Filtrar por nombre o documento de identidad..." 
          />
        </div>
      </div>

      {/* RESUMEN DE CARTERA */}
      <div className="flex justify-center pb-10">
        <div className="bg-white px-8 py-3 rounded-full shadow-lg shadow-cyan-900/5 flex items-center gap-4 border border-slate-50">
          <div className="flex -space-x-2">
            {[1,2,3].map(i => (
              <div key={i} className="h-6 w-6 rounded-full bg-slate-200 border-2 border-white" />
            ))}
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Total en Cartera: <span className="text-cyan-600 text-sm ml-1">{data.length}</span>
          </p>
        </div>
      </div>
    </div>
  )
}