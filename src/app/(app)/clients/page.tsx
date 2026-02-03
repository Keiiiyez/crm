"use client"

import * as React from "react"
import { PlusCircle, Loader2, FileSpreadsheet, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import * as XLSX from "xlsx"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
          bankName: String(findValueNextTo(["CAIXA", "BANCO"])).trim() || "Detectado",
          observations: String(findValueNextTo(["OBSERVACIONES"])).trim()
        };

        // --- MEJORA: Limpieza de precio para que NO se guarde como 0 ---
        const rawPrice = String(findValueNextTo(["TOTAL A PAGAR", "PROMOCION"]));
        // Quitamos "€", espacios y cambiamos coma por punto
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

        toast.success("Excel procesado. Precio detectado: " + finalPrice + "€");
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
    setPendingSale(null) // Si editamos, reseteamos venta pendiente para no duplicar
    setOpen(true)
  }

  const onOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setEditingClient(null)
      setOperator("")
      setIbanValue("")
      setPendingSale(null)
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const clientFields = Object.fromEntries(formData.entries());

    if ((clientFields.dni as string).length < 8) {
      return toast.error("El documento de identidad es demasiado corto");
    }

    if (ibanValue.length !== 24) {
      return toast.error("El IBAN debe tener exactamente 24 caracteres");
    }

    setIsSubmitting(true);

    // --- MEJORA: Solo enviamos 'sale' si realmente viene de un Excel ---
    // Si pendingSale existe y tiene un total > 0, lo enviamos. Si no, enviamos null.
    const finalPayload = {
      client: {
        ...clientFields,
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
      }
    } catch (error) {
      toast.error("Error al procesar la solicitud");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="font-headline text-2xl tracking-tight text-primary">Clientes</CardTitle>
            <CardDescription>Gestión de identidades y datos de facturación.</CardDescription>
          </div>
          
          <div className="flex gap-2">
            <input type="file" className="hidden" ref={fileInputRef} accept=".xlsx, .xls" onChange={handleImportExcel} />
            <Button variant="outline" size="sm" className="gap-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50" onClick={() => fileInputRef.current?.click()}>
              <FileSpreadsheet className="h-4 w-4" /> Importar Excel
            </Button>

            <Dialog open={open} onOpenChange={onOpenChange}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2" onClick={() => setPendingSale(null)}>
                   <PlusCircle className="h-4 w-4" /> Nuevo Registro
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[750px]">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>{editingClient?.id ? `Editando: ${editingClient.name}` : "Datos del Cliente"}</DialogTitle>
                    <DialogDescription>
                        {pendingSale ? "Se generará una venta automática de " + pendingSale.total + "€" : "Registro manual de cliente."}
                    </DialogDescription>
                  </DialogHeader>

                  {ibanValue && ibanValue.length !== 24 && (
                    <Alert variant="destructive" className="py-2 mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        IBAN incompleto: tiene {ibanValue.length} de 24 caracteres.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid gap-4 py-4 grid-cols-3">
                    {/* COLUMNA 1: IDENTIDAD */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label htmlFor="name">Nombre Titular</Label>
                            <Input id="name" name="name" defaultValue={editingClient?.name || ""} required />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="dni">DNI / NIE</Label>
                            <Input id="dni" name="dni" defaultValue={editingClient?.dni || ""} required className="uppercase font-mono" />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="nationality">Nacionalidad</Label>
                            <Input id="nationality" name="nationality" defaultValue={editingClient?.nationality || ""} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="birthDate">F. Nacimiento</Label>
                            <Input id="birthDate" name="birthDate" defaultValue={editingClient?.birthDate || ""} placeholder="DD/MM/AAAA" />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="gender">Género</Label>
                            <Input id="gender" name="gender" defaultValue={editingClient?.gender || ""} />
                        </div>
                    </div>

                    {/* COLUMNA 2: CONTACTO Y UBICACIÓN */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label htmlFor="phone">Teléfono</Label>
                            <Input id="phone" name="phone" defaultValue={editingClient?.phone || ""} required />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" defaultValue={editingClient?.email || ""} required />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="address">Dirección</Label>
                            <Input id="address" name="address" defaultValue={editingClient?.address || ""} required />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label htmlFor="city">Ciudad</Label>
                                <Input id="city" name="city" defaultValue={editingClient?.city || ""} required />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="postalCode">C.P.</Label>
                                <Input id="postalCode" name="postalCode" defaultValue={editingClient?.postalCode || ""} required maxLength={5} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="province">Provincia</Label>
                            <Input id="province" name="province" defaultValue={editingClient?.province || ""} required />
                        </div>
                    </div>

                    {/* COLUMNA 3: BANCO Y VENTA */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label>Operadora</Label>
                            <Select value={operator} onValueChange={setOperator} required>
                                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                <SelectContent>
                                    {OPERATOR_OPTIONS.map(op => <SelectItem key={op} value={op}>{op}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="bankName">Banco</Label>
                            <Input id="bankName" name="bankName" defaultValue={editingClient?.bankName || ""} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="IBAN">IBAN</Label>
                            <Input 
                                id="IBAN" 
                                name="IBAN" 
                                value={ibanValue} 
                                onChange={(e) => setIbanValue(e.target.value.replace(/\s/g, ""))}
                                required 
                                className="font-mono text-xs"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>Observaciones {pendingSale ? "(Venta)" : "(Cliente)"}</Label>
                            <Textarea 
                                name="observations" 
                                className="h-[100px] text-xs" 
                                defaultValue={editingClient?.observations || ""} 
                            />
                        </div>
                    </div>
                  </div>

                  <DialogFooter className="bg-slate-50 p-4 -mx-6 -mb-6 border-t">
                    <Button type="submit" className="w-full" disabled={isSubmitting || (ibanValue.length > 0 && ibanValue.length !== 24)}>
                      {isSubmitting && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                      {editingClient?.id ? "Actualizar Registro" : pendingSale ? "Confirmar e Importar Venta" : "Registrar Cliente Manual"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns(handleEdit)} data={data} filterInputPlaceholder="Buscar cliente por DNI o Nombre..." />
      </CardContent>
    </Card>
  )
}