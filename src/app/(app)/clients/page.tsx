"use client"

import * as React from "react"
import { PlusCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { DataTable } from "@/components/data-table"
import { columns } from "@/components/clients/columns"
import { OPERATOR_OPTIONS } from "@/lib/data"
import type { Client } from "@/lib/definitions"

export default function ClientsPage() {
  const [data, setData] = React.useState<Client[]>([])
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [editingClient, setEditingClient] = React.useState<Client | null>(null)
  const [operator, setOperator] = React.useState<string>("")

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

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setOperator(client.operator || "") 
    setOpen(true)
  }

  const onOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setEditingClient(null)
      setOperator("")
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const clientData = Object.fromEntries(formData.entries());

    // Validación básica de longitud antes de enviar
    if ((clientData.dni as string).length < 8) {
      return toast.error("El documento de identidad es demasiado corto");
    }

    if ((clientData.IBAN as string).length < 24) {
      return toast.error("El IBAN debe tener 24 caracteres (formato España)");
    }

    setIsSubmitting(true);

    const finalPayload = {
      ...clientData,
      operator: operator,
      iban: clientData.IBAN, 
      IBAN: clientData.IBAN 
    };

    const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
    const method = editingClient ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload),
      });

      if (response.ok) {
        toast.success(editingClient ? "Cliente actualizado" : "Cliente registrado");
        setOpen(false);
        fetchClients(); 
      } else {
        toast.error("Error en el servidor al guardar");
      }
    } catch (error) {
      toast.error("Fallo de red o servidor offline");
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
          
          <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <PlusCircle className="h-4 w-4" /> Nuevo Registro
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingClient ? `Editando: ${editingClient.name}` : "Nuevo Cliente"}
                  </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre Completo</Label>
                    <Input id="name" name="name" placeholder="Ej: Juan Pérez García" defaultValue={editingClient?.name || ""} required maxLength={80} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dni">DNI / NIE / CIF</Label>
                    <Input id="dni" name="dni" placeholder="Ej: 12345678Z o Y1234567X" defaultValue={editingClient?.dni || ""} required maxLength={15} className="uppercase font-mono" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input id="email" name="email" type="email" placeholder="nombre@correo.com" defaultValue={editingClient?.email || ""} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" name="phone" type="tel" placeholder="Ej: 600123456" defaultValue={editingClient?.phone || ""} required maxLength={9} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Operadora Actual</Label>
                    <Select value={operator} onValueChange={setOperator} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATOR_OPTIONS.map(op => (
                          <SelectItem key={op} value={op}>{op}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="address">Dirección de Instalación</Label>
                    <Input id="address" name="address" placeholder="Ej: Calle Mayor 10, 1º Izq" defaultValue={editingClient?.address || ""} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Localidad</Label>
                    <Input id="city" name="city" placeholder="Ej: Barcelona" defaultValue={editingClient?.city || ""} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="province">Provincia</Label>
                    <Input id="province" name="province" placeholder="Ej: Barcelona" defaultValue={editingClient?.province || ""} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">C.P.</Label>
                    <Input id="postalCode" name="postalCode" placeholder="08001" defaultValue={editingClient?.postalCode || ""} required maxLength={5} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="IBAN">IBAN (Cuenta)</Label>
                    <Input id="IBAN" name="IBAN" placeholder="ES210000..." defaultValue={editingClient?.iban || ""} required maxLength={24} className="font-mono" />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                    {editingClient ? "Actualizar Registro" : "Registrar Cliente"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable 
          columns={columns(handleEdit)} 
          data={data} 
          filterInputPlaceholder="Buscar por nombre, documento o ciudad..." 
        />
      </CardContent>
    </Card>
  )
}