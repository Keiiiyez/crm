"use client"

import * as React from "react"
import { PlusCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { DataTable } from "@/components/data-table"
import { columns } from "@/components/clients/columns"
import type { Client } from "@/lib/definitions"

export default function ClientsPage() {
  const [data, setData] = React.useState<Client[]>([])
  const [open, setOpen] = React.useState(false)
  const [editingClient, setEditingClient] = React.useState<Client | null>(null)

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
    setOpen(true)
  }

  const onOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) setEditingClient(null)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const clientData = Object.fromEntries(formData.entries());

    const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
    const method = editingClient ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData),
      });

      if (response.ok) {
        toast.success(editingClient ? "Cliente actualizado" : "Cliente guardado");
        setOpen(false);
        setEditingClient(null);
        fetchClients(); 
      } else {
        toast.error("Error en la operación");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="font-headline text-2xl">Clientes</CardTitle>
            <CardDescription>
              Gestiona tu base de datos centralizada en XAMPP.
            </CardDescription>
          </div>
          
          <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <PlusCircle className="h-4 w-4" />
                Nuevo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingClient ? `Editando: ${editingClient.name}` : "Registro Completo de Cliente"}
                  </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre Completo</Label>
                    <Input id="name" name="name" defaultValue={editingClient?.name || ""} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dni">DNI / NIF</Label>
                    <Input id="dni" name="dni" defaultValue={editingClient?.dni || ""} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" defaultValue={editingClient?.email || ""} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input id="phone" name="phone" defaultValue={editingClient?.phone || ""} required />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="address">Dirección</Label>
                    <Input id="address" name="address" defaultValue={editingClient?.address || ""} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Ciudad</Label>
                    <Input id="city" name="city" defaultValue={editingClient?.city || ""} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="province">Provincia</Label>
                    <Input id="province" name="province" defaultValue={editingClient?.province || ""} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">CP</Label>
                    <Input id="postalCode" name="postalCode" defaultValue={editingClient?.postalCode || ""} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="IBAN">IBAN</Label>
                    <Input id="IBAN" name="IBAN" defaultValue={editingClient?.IBAN || ""} />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit" className="w-full">
                    {editingClient ? "Actualizar Cliente" : "Guardar Cliente"}
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
          filterInputPlaceholder="Filtrar por nombre o DNI..." 
        />
      </CardContent>
    </Card>
  )
} 