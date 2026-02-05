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
  Mail,
  Fingerprint,
  Globe,
  Briefcase
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
      
      {/* CABECERA DASHBOARD */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-2">
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
            className="h-14 border-none shadow-xl shadow-cyan-900/5 bg-white text-emerald-600 hover:bg-emerald-50 font-black text-[10px] uppercase rounded-2xl px-6 transition-all"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileSpreadsheet className="h-5 w-5 mr-2" /> Importar Excel
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button 
                className="h-14 bg-slate-900 hover:bg-cyan-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl px-8 shadow-xl shadow-slate-200 transition-all border-none"
                onClick={() => { setEditingClient(null); setPendingSale(null); }}
              >
                 <PlusCircle className="h-5 w-5 mr-2" /> Nuevo Registro
              </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-[900px] p-0 rounded-[2.5rem] overflow-hidden border-none shadow-2xl">
              <form onSubmit={handleSubmit}>
                <div className="bg-slate-900 p-10 text-white relative">
                  <DialogHeader>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 mb-2">Expediente de Identidad</p>
                    <DialogTitle className="text-4xl font-black tracking-tighter uppercase">
                      {editingClient?.id ? `Editando: ${editingClient.name}` : "Registrar Nuevo Cliente"}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 font-bold text-xs uppercase mt-3 flex items-center gap-2">
                      {pendingSale ? (
                        <span className="bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/20">
                          ✨ Venta automática detectada: {pendingSale.total}€
                        </span>
                      ) : "Verifique la integridad de los datos legales antes de procesar."}
                    </DialogDescription>
                  </DialogHeader>
                </div>

                <div className="p-10 space-y-10 bg-white overflow-y-auto max-h-[65vh]">
                  {ibanValue && ibanValue.length !== 24 && (
                    <Alert className="bg-red-50 border-none rounded-2xl py-4 px-6 flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                      <AlertDescription className="text-[11px] font-black uppercase text-red-600">
                        IBAN Incorrecto: Faltan {24 - ibanValue.length} caracteres para validar el estándar SEPA.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {/* COLUMNA 1: IDENTIDAD */}
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-cyan-600 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
                        <Fingerprint size={14}/> Identidad Legal
                      </h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nombre Completo / Razón Social</Label>
                          <Input name="name" defaultValue={editingClient?.name || ""} required className="bg-slate-50 border-none rounded-2xl font-bold h-12 focus:ring-2 ring-cyan-500/20" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-400 uppercase ml-1">DNI / NIE / CIF</Label>
                          <Input name="dni" defaultValue={editingClient?.dni || ""} required className="bg-slate-50 border-none rounded-2xl font-mono uppercase font-black text-cyan-600 h-12 focus:ring-2 ring-cyan-500/20" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nacionalidad</Label>
                            <Input name="nationality" defaultValue={editingClient?.nationality || ""} className="bg-slate-50 border-none rounded-2xl text-xs font-bold h-12" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase ml-1">Género</Label>
                            <Input name="gender" defaultValue={editingClient?.gender || ""} className="bg-slate-50 border-none rounded-2xl text-xs font-bold h-12" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* COLUMNA 2: LOCALIZACIÓN */}
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-cyan-600 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
                        <MapPin size={14}/> Ubicación y Contacto
                      </h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-400 uppercase ml-1">Teléfono Móvil</Label>
                          <Input name="phone" defaultValue={editingClient?.phone || ""} required className="bg-slate-50 border-none rounded-2xl font-bold h-12" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-400 uppercase ml-1">E-mail Corporativo</Label>
                          <Input name="email" type="email" defaultValue={editingClient?.email || ""} required className="bg-slate-50 border-none rounded-2xl font-bold lowercase h-12" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-400 uppercase ml-1">Dirección Fiscal</Label>
                          <Input name="address" defaultValue={editingClient?.address || ""} required className="bg-slate-50 border-none rounded-2xl text-[11px] font-bold h-12" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Input name="city" placeholder="Población" defaultValue={editingClient?.city || ""} className="bg-slate-50 border-none rounded-2xl text-xs font-bold h-12" />
                          <Input name="postalCode" placeholder="C.P." defaultValue={editingClient?.postalCode || ""} className="bg-slate-50 border-none rounded-2xl text-xs font-bold h-12" />
                        </div>
                      </div>
                    </div>

                    {/* COLUMNA 3: FINANZAS */}
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-cyan-600 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
                        <CreditCard size={14}/> Datos Bancarios
                      </h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-400 uppercase ml-1">Operadora Origen</Label>
                          <Select value={operator} onValueChange={setOperator} required>
                            <SelectTrigger className="bg-slate-50 border-none rounded-2xl font-black uppercase text-[10px] h-12 focus:ring-0">
                                <SelectValue placeholder="SELECCIONAR..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-3xl border-none shadow-2xl p-2">
                              {OPERATOR_OPTIONS.map(op => <SelectItem key={op} value={op} className="font-bold text-[10px] rounded-xl">{op}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-400 uppercase ml-1">Número de Cuenta (IBAN)</Label>
                          <Input 
                            value={ibanValue} 
                            onChange={(e) => setIbanValue(e.target.value.replace(/\s/g, "").toUpperCase())}
                            required 
                            className="bg-cyan-50 border-none rounded-2xl font-mono text-[11px] font-black text-cyan-700 h-12"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black text-slate-400 uppercase ml-1">Notas del Expediente</Label>
                          <Textarea name="observations" defaultValue={editingClient?.observations || ""} className="bg-slate-50 border-none rounded-2xl h-28 text-[11px] font-bold resize-none p-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="p-10 bg-slate-50 border-t border-slate-100">
                  <Button 
                    type="submit" 
                    className="w-full h-16 bg-slate-900 hover:bg-cyan-600 text-white font-black rounded-[1.5rem] uppercase text-xs tracking-[0.2em] transition-all shadow-2xl disabled:opacity-50" 
                    disabled={isSubmitting || (ibanValue.length > 0 && ibanValue.length !== 24)}
                  >
                    {isSubmitting ? <Loader2 className="animate-spin mr-3 h-5 w-5" /> : editingClient?.id ? "Actualizar Registro" : "Confirmar Alta en Cartera"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* CONTENEDOR DE TABLA */}
      <div className="bg-white rounded-[3rem] shadow-2xl shadow-cyan-900/5 border-none overflow-hidden p-4">
        <DataTable 
          columns={columns(handleEdit)} 
          data={data} 
          filterInputPlaceholder="Filtrar por nombre o documento..." 
        />
      </div>

      {/* FOOTER STATS */}
      <div className="flex justify-center pb-12">
        <div className="bg-white px-10 py-4 rounded-full shadow-xl shadow-cyan-900/5 flex items-center gap-6 border border-slate-50">
          <div className="flex -space-x-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-8 w-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
                 <User size={12} className="text-slate-300"/>
              </div>
            ))}
          </div>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
            Total Clientes Activos: <span className="text-cyan-600 text-lg ml-2">{data.length}</span>
          </p>
        </div>
      </div>
    </div>
  )
}