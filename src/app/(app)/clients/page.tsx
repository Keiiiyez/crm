"use client"

import * as React from "react"
import { 
  PlusCircle, 
  Loader2, 
  FileSpreadsheet, 
  AlertCircle, 
  User, 
  CreditCard, 
  Fingerprint,
  Building2,
  CheckCircle2,
  XCircle,
  Search,
  ChevronRight
} from "lucide-react"
import { toast } from "sonner"
import * as XLSX from "xlsx"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import { DataTable } from "@/components/data-table"
import { columns } from "@/components/clients/columns"
import type { Client } from "@/lib/definitions"
import { httpClient } from "@/lib/http-client"
import { validateSpanishID, validateIBAN, formatIBAN } from "@/lib/validators"

export default function ClientsPage() {
  const [data, setData] = React.useState<Client[]>([])
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [editingClient, setEditingClient] = React.useState<any | null>(null)
  
  const [operator, setOperator] = React.useState<string>("")
  const [ibanValue, setIbanValue] = React.useState("")
  const [dniValue, setDniValue] = React.useState("")
  const [pendingSale, setPendingSale] = React.useState<any>(null)
  const [detectedBank, setDetectedBank] = React.useState<string>("")

  const [validationErrors, setValidationErrors] = React.useState({
    dni: false,
    iban: false
  })

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const httpClients = async () => {
    try {
      const response = await httpClient('/api/clients')
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      toast.error("Error al conectar con el servidor")
    }
  }

  React.useEffect(() => {
    httpClients()
  }, [])

  const handleDniChange = (val: string) => {
    let upper = val.toUpperCase().trim();
    if (upper.length === 8 && /[A-Z]$/.test(upper)) {
      upper = "0" + upper;
    }
    setDniValue(upper);
    if (upper.length >= 9) {
      const isValid = validateSpanishID(upper);
      setValidationErrors(prev => ({ ...prev, dni: !isValid }));
    } else {
      setValidationErrors(prev => ({ ...prev, dni: false }));
    }
  };

  const handleIbanChange = (val: string) => {
    const formatted = formatIBAN(val);
    setIbanValue(formatted);
    const cleanIban = formatted.replace(/\s/g, '');
    if (cleanIban.length >= 15) {
      const result = validateIBAN(cleanIban);
      setValidationErrors(prev => ({ ...prev, iban: !result.isValid }));
      if (result.isValid && result.bankName) {
        setDetectedBank(result.bankName);
      } else {
        setDetectedBank("");
      }
    } else {
      setValidationErrors(prev => ({ ...prev, iban: false }));
      setDetectedBank("");
    }
  };

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

        const rawIban = String(findValueNextTo(["No. DE CUENTA", "IBAN", "Nº cuenta"])) || "";
        const rawDni = String(findValueNextTo(["CIF / NIF", "NIF/NIE", "DNI"])).trim().toUpperCase();
        
        // Intento de parsear nombre completo desde Excel a campos separados
        const rawFullName = String(findValueNextTo(["TITULAR", "NOMBRE"])).trim();
        const nameParts = rawFullName.split(" ");

        const excelData: any = {
          firstName: nameParts[0] || "",
          lastName1: nameParts[1] || "",
          lastName2: nameParts.slice(2).join(" ") || "",
          dni: rawDni,
          email: String(findValueNextTo(["E-MAIL", "CORREO"])).trim().toLowerCase(),
          phone: String(findValueNextTo(["TELEFONO", "MOVIL"])).trim(),
          iban: rawIban,
          operator: String(findValueNextTo(["OPERADOR", "COMPAÑÍA"])).trim(),
          nationality: String(findValueNextTo(["NACIONALIDAD"])).trim(),
          bankName: String(findValueNextTo(["BANCO"])).trim(),
          observations: String(findValueNextTo(["OBSERVACIONES"])).trim()
        };

        setPendingSale({
          total: parseFloat(String(findValueNextTo(["TOTAL A PAGAR", "PROMOCION"])).replace(/[^\d,.]/g, '').replace(',', '.')) || 0,
          operator_destino: excelData.operator
        });

        setEditingClient(excelData);
        setOperator(excelData.operator || "");
        handleDniChange(rawDni); 
        handleIbanChange(rawIban); 
        setOpen(true);
        toast.success("Excel procesado: Distribuye los apellidos si es necesario");
      } catch (error: any) {
        toast.error("Error al procesar el archivo Excel");
      }
    };
    reader.readAsBinaryString(file);
    if (e.target) e.target.value = "";
  };

  const handleEdit = (client: any) => {
    // Al editar, si no tenemos los campos separados, intentamos separar el 'name'
    const nameParts = (client.name || "").split(" ");
    setEditingClient({
        ...client,
        firstName: client.firstName || nameParts[0] || "",
        lastName1: client.lastName1 || nameParts[1] || "",
        lastName2: client.lastName2 || nameParts.slice(2).join(" ") || ""
    })
    setOperator(client.operator || "") 
    handleDniChange(client.dni || "")
    handleIbanChange(client.iban || "")
    setPendingSale(null) 
    setOpen(true)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validationErrors.dni || validationErrors.iban) {
      return toast.error("Por favor, corrija los datos inválidos");
    }

    const formData = new FormData(event.currentTarget);
    const fields = Object.fromEntries(formData.entries());

    setIsSubmitting(true);

    // Construcción del nombre completo para el sistema
    const fullName = `${fields.firstName} ${fields.lastName1} ${fields.lastName2 || ""}`.trim().toUpperCase();

    const finalPayload = {
      client: {
        ...fields,
        name: fullName, // Mantenemos compatibilidad con el campo 'name'
        dni: dniValue,
        iban: ibanValue.replace(/\s/g, ""),
        bankName: detectedBank || (fields.bankName as string),
        id: editingClient?.id || undefined, 
        operator: operator || editingClient?.operator || ""
      },
      sale: pendingSale && pendingSale.total > 0 ? pendingSale : null
    };

    try {
      const url = editingClient?.id ? `/api/clients/${editingClient.id}` : '/api/clients';
      const response = await httpClient(url, {
        method: editingClient?.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload),
      });

      if (response.ok) {
        toast.success("Operación completada");
        setOpen(false);
        httpClients(); 
      }
    } catch (error) {
      toast.error("Error en la solicitud");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-12 space-y-10 text-left">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-5">
          <div className="h-14 w-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
            <User className="h-7 w-7 text-slate-800" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">
              Lista <span className="text-slate-400 font-light">de</span> Clientes
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-0.5">Gestión de identidades</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input type="file" className="hidden" ref={fileInputRef} accept=".xlsx, .xls" onChange={handleImportExcel} />
          <Button variant="ghost" className="h-12 text-slate-500 font-black text-[10px] uppercase tracking-widest px-6" onClick={() => fileInputRef.current?.click()}>
            <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-500" /> Importar Excel
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="h-14 bg-slate-900 hover:bg-cyan-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl px-8 shadow-xl transition-all" onClick={() => { setEditingClient(null); setPendingSale(null); setOperator(""); setIbanValue(""); setDniValue(""); setDetectedBank(""); }}>
                 <PlusCircle className="h-4 w-4 mr-2" /> Nuevo Registro
              </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-[900px] p-0 rounded-[2.5rem] overflow-hidden border-none shadow-2xl">
              <form onSubmit={handleSubmit}>
                <div className="bg-slate-900 p-10 text-white relative">
                  <DialogHeader>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 mb-2">Ficha de Identidad</p>
                    <DialogTitle className="text-4xl font-black tracking-tighter uppercase italic">
                      {editingClient?.id ? "Actualizar Datos" : "Registrar Cliente"}
                    </DialogTitle>
                    {pendingSale && (
                      <Badge className="mt-4 bg-cyan-500 text-slate-900 font-black">VENTA DETECTADA: {pendingSale.total}€</Badge>
                    )}
                  </DialogHeader>
                </div>

                <div className="p-10 space-y-10 bg-white overflow-y-auto max-h-[70vh]">
                  {(validationErrors.dni || validationErrors.iban) && (
                    <Alert className="bg-red-50 border-none rounded-2xl py-4 flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                      <AlertDescription className="text-[11px] font-black uppercase text-red-600">
                        Atención: Verifique el DNI o el IBAN. No superan la validación matemática.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    
                    {/* COLUMNA 1: DATOS PERSONALES SEPARADOS */}
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-cyan-600 uppercase tracking-widest flex items-center gap-2 border-b pb-3"><Fingerprint size={14}/> Datos Personales</h4>
                      <div className="space-y-4">
                        
                        <div className="space-y-1">
                          <Label className="text-[10px] font-black text-slate-400 uppercase">Nombre</Label>
                          <Input name="firstName" defaultValue={editingClient?.firstName || ""} required placeholder="Ej: Juan Antonio" className="bg-slate-50 border-none rounded-2xl font-bold h-12" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black text-slate-400 uppercase">Primer Apellido</Label>
                                <Input name="lastName1" defaultValue={editingClient?.lastName1 || ""} required placeholder="" className="bg-slate-50 border-none rounded-2xl font-bold h-12" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black text-slate-400 uppercase">Segundo Apellido (Opcional)</Label>
                                <Input name="lastName2" defaultValue={editingClient?.lastName2 || ""} placeholder="" className="bg-slate-50 border-none rounded-2xl font-bold h-12" />
                            </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px] font-black text-slate-400 uppercase">DNI / NIE / CIF</Label>
                          <div className="relative">
                            <Input value={dniValue} onChange={(e) => handleDniChange(e.target.value)} required className={cn("bg-slate-50 border-2 rounded-2xl font-mono font-black h-12 uppercase", validationErrors.dni ? "border-red-200 text-red-600" : "border-transparent text-cyan-600")} />
                            {dniValue.length >= 9 && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {validationErrors.dni ? <XCircle className="text-red-500 h-5 w-5" /> : <CheckCircle2 className="text-emerald-500 h-5 w-5" />}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-[9px] font-bold text-slate-400 uppercase">Móvil</Label>
                            <Input name="phone" defaultValue={editingClient?.phone || ""} required className="bg-slate-50 border-none rounded-2xl font-bold h-12" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] font-bold text-slate-400 uppercase">Email</Label>
                            <Input name="email" type="email" defaultValue={editingClient?.email || ""} required className="bg-slate-50 border-none rounded-2xl font-bold h-12" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* COLUMNA 2: FACTURACIÓN */}
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-cyan-600 uppercase tracking-widest flex items-center gap-2 border-b pb-3"><CreditCard size={14}/> Datos Bancarios</h4>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-black text-slate-400 uppercase">IBAN</Label>
                          <div className="relative">
                            <Input value={ibanValue} onChange={(e) => handleIbanChange(e.target.value)} required className={cn("bg-cyan-50 border-2 rounded-2xl font-mono text-[11px] font-black h-12", validationErrors.iban ? "border-red-200 text-red-600" : "border-transparent text-cyan-700")} />
                            {ibanValue.replace(/\s/g, '').length >= 15 && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                {validationErrors.iban ? <XCircle className="text-red-500 h-5 w-5" /> : <CheckCircle2 className="text-emerald-500 h-5 w-5" />}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-black text-slate-400 uppercase">Entidad Detectada</Label>
                          <div className="relative">
                            <Input name="bankName" value={detectedBank || (editingClient?.bankName || "")} onChange={(e) => setDetectedBank(e.target.value)} className="bg-slate-50 border-none rounded-2xl font-bold h-12 pl-10" />
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-black text-slate-400 uppercase">Observaciones Internas</Label>
                          <Textarea name="observations" defaultValue={editingClient?.observations || ""} className="bg-slate-50 border-none rounded-2xl h-32 text-[11px] font-bold resize-none" />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                <DialogFooter className="p-10 bg-slate-50 border-t border-slate-100">
                  <Button type="submit" className="w-full h-16 bg-slate-900 hover:bg-cyan-600 text-white font-black rounded-3xl uppercase text-xs tracking-[0.2em] transition-all disabled:opacity-50" disabled={isSubmitting || validationErrors.dni || validationErrors.iban}>
                    {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : "Finalizar y Guardar Registro"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto">
        <DataTable columns={columns(handleEdit, httpClients)} data={data} filterInputPlaceholder="Filtrar por nombre, DNI o banco..." />
      </div>
    </div>
  )
}