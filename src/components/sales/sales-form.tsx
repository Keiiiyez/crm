"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { CalendarIcon, Check, ChevronsUpDown, Search } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"


import { clients, OPERATOR_OPTIONS } from "@/lib/data"

const formSchema = z.object({
  cliente: z.string().min(2, "Client name is required."),
  dni: z.string().min(8, "DNI is required."),
  correo: z.string().email("Invalid email address."),
  tlfContacto: z.string().min(9, "Contact phone is required."),
  direccion: z.string().min(5, "Address is required."),
  localidad: z.string().min(2, "City is required."),
  provincia: z.string().min(2, "Province is required."),
  codPostal: z.string().min(5, "Postal code is required."),
  operador: z.string({ required_error: "Please select an operator." }),
  precioCierre: z.coerce.number().min(0, "Price must be a positive number."),
  fchaAct: z.date({ required_error: "Activation date is required." }),
  estado: z.string().min(2, "Status is required."),
  historicoCliente: z.string().optional(),
  ofrecimientoComercial: z.string().optional(),
  pack: z.string().optional(),
  promo: z.string().optional(),
  docAdicEnCrm: z.boolean().default(false).optional(),
})

export function SalesForm() {
  const [openSearch, setOpenSearch] = React.useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cliente: "", dni: "", correo: "", tlfContacto: "",
      direccion: "", localidad: "", provincia: "", codPostal: "",
      precioCierre: 0, estado: "", historicoCliente: "",
      ofrecimientoComercial: "", pack: "", promo: "", docAdicEnCrm: false,
    },
  })


  const onSelectClient = (clientId: string) => {
    const selected = clients.find((c) => c.id === clientId)
    if (selected) {
      form.setValue("cliente", selected.name)
      form.setValue("dni", selected.dni)
      form.setValue("correo", selected.email)
      form.setValue("tlfContacto", selected.phone)
      form.setValue("direccion", selected.address)
      form.setValue("localidad", selected.city)
      form.setValue("provincia", selected.province)
      form.setValue("codPostal", selected.postalCode)
      setOpenSearch(false)
    }
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("Venta Creada:", values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        {/* BUSCADOR DE CLIENTES EXISTENTES */}
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Search className="text-primary h-5 w-5" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-2">Buscador rápido de clientes (Nombre o DNI)</p>
                <Popover open={openSearch} onOpenChange={setOpenSearch}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between bg-background">
                      Seleccionar cliente existente...
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar por nombre o DNI..." />
                      <CommandList>
                        <CommandEmpty>No se encontró el cliente.</CommandEmpty>
                        <CommandGroup>
                          {clients.map((client) => (
                            <CommandItem
                              key={client.id}
                              value={`${client.name} ${client.dni}`}
                              onSelect={() => onSelectClient(client.id)}
                            >
                              <Check className={cn("mr-2 h-4 w-4", form.getValues("dni") === client.dni ? "opacity-100" : "opacity-0")} />
                              <div className="flex flex-col">
                                <span>{client.name}</span>
                                <span className="text-xs text-muted-foreground">{client.dni}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Datos del Cliente</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Los campos de cliente ahora se auto-rellenan al buscar */}
                <FormField control={form.control} name="cliente" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="dni" render={({ field }) => (
                  <FormItem>
                    <FormLabel>DNI</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                {/* Resto de los campos igual que antes */}
                <FormField control={form.control} name="correo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                 <FormField control={form.control} name="tlfContacto" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="direccion" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Dirección</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                {/* ... localidad, provincia, codPostal ... */}
              </CardContent>
            </Card>

            {/* SECCIÓN DETALLES VENTA */}
            <Card>
              <CardHeader><CardTitle>Detalles de la Oferta</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <FormField control={form.control} name="historicoCliente" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Histórico</FormLabel>
                    <FormControl><Textarea {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                   <FormField control={form.control} name="pack" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pack</FormLabel>
                      <FormControl><Input placeholder="Fibra + 2 Líneas" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="promo" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Promoción</FormLabel>
                      <FormControl><Input placeholder="Dto. 12 meses" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
             {/* SECCIÓN ACTIVACIÓN */}
             <Card>
              <CardHeader><CardTitle>Activación</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <FormField control={form.control} name="operador" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operador</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {OPERATOR_OPTIONS.map(op => <SelectItem key={op} value={op}>{op}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <FormField control={form.control} name="precioCierre" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio Cierre</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="submit" className="w-full">Registrar Venta</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  )
}