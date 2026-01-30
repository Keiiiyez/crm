"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { 
  Search, User, MapPin, CreditCard, 
  Phone, Mail, Zap, ChevronsUpDown 
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

import { OPERATOR_OPTIONS } from "@/lib/data" 
import type { Client } from "@/lib/definitions"

const SUGGESTED_OFFERS: Record<string, { pack: string; promo: string }> = {
  "Movistar": { pack: "Fibra 1Gb + Ilimitada", promo: "50% Dto. portabilidad 12 meses" },
  "Vodafone": { pack: "Fibra 600Mb + 2 Líneas", promo: "Regalo Disney+ 1 año" },
  "Orange": { pack: "Love Cine y Series", promo: "Precio cerrado 24 meses" },
  "Digi": { pack: "Fibra Smart 1Gb", promo: "Sin permanencia" },
}

const formSchema = z.object({
  clienteId: z.string().min(1, "Selecciona un cliente."),
  operadorDestino: z.string({ required_error: "Selecciona operador." }),
  precioCierre: z.coerce.number().min(0, "Mínimo 0"),
  historicoCliente: z.string().optional(),
  pack: z.string().optional(),
  promo: z.string().optional(),
})

export function SalesForm() {
  const [openSearch, setOpenSearch] = React.useState(false)
  const [clients, setClients] = React.useState<Client[]>([])
  const [selectedClient, setSelectedClient] = React.useState<Client | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      clienteId: "", 
      operadorDestino: "", 
      precioCierre: 0, 
      historicoCliente: "", 
      pack: "", 
      promo: "" 
    },
  })

  React.useEffect(() => {
    fetch('/api/clients')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setClients(data)
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [])

  const onSelectClient = (client: Client) => {
    setSelectedClient(client)
    
    const offer = SUGGESTED_OFFERS[client.operator || ""] || { pack: "", promo: "" }
    
    form.reset({
      clienteId: client.id,
      operadorDestino: "", 
      precioCierre: 0,
      historicoCliente: "",
      pack: offer.pack,
      promo: offer.promo,
    })
    
    setOpenSearch(false)
    toast.info(`Perfil de ${client.name} cargado`)
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (!response.ok) throw new Error("Error al guardar")

      toast.success("Venta registrada y operadora actualizada")

      setClients(prev => prev.map(c => 
        c.id === values.clienteId 
          ? { ...c, operator: values.operadorDestino } 
          : c
      ))

      setSelectedClient(null)
      form.reset()
    } catch (error) {
      toast.error("Hubo un problema al registrar la venta")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <Search className="text-primary h-5 w-5" />
              <div className="flex-1 w-full">
                <Popover open={openSearch} onOpenChange={setOpenSearch}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      {selectedClient ? `${selectedClient.name} (${selectedClient.dni})` : "Buscar Cliente por DNI o Nombre..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Escribe para buscar..." />
                      <CommandList>
                        <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                        {isLoading ? (
                          <div className="p-4 text-center text-sm">Cargando base de datos...</div>
                        ) : (
                          <CommandGroup>
                            {clients.map((c) => (
                              <CommandItem key={c.id} onSelect={() => onSelectClient(c)}>
                                <div className="flex flex-col">
                                  <span>{c.name} - {c.dni}</span>
                                  <span className="text-xs text-muted-foreground">{c.operator || "Sin operador"} | {c.province}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedClient && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {}
            <Card className="lg:col-span-1 border-l-4 border-l-primary h-fit">
              <CardHeader className="bg-muted/30">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" /> Datos de Identidad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {selectedClient.phone}</div>
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {selectedClient.email}</div>
                  <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-muted-foreground" /> {selectedClient.dni}</div>
                  <div className="flex items-start gap-2 border-t pt-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" /> 
                    <span>
                      {selectedClient.address}<br/>
                      <span className="font-semibold text-primary">{selectedClient.postalCode} {selectedClient.city} ({selectedClient.province})</span>
                    </span>
                  </div>
                </div>
                
                <div className="pt-3 border-t">
                  <p className="text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-wider">Compañía Actual</p>
                  <Badge className="text-sm px-3 py-1 bg-orange-100 text-orange-700 border-none hover:bg-orange-100">
                    {selectedClient.operator || "No registrada"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between bg-primary/[0.02]">
                  <CardTitle>Configurar Portabilidad</CardTitle>
                  <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">
                    <Zap className="h-3 w-3 mr-1 fill-green-600" /> Oferta Sugerida
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="pack" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Servicios contratados</FormLabel>
                        <FormControl><Input {...field} className="bg-primary/5 border-primary/20" /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="promo" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Promoción</FormLabel>
                        <FormControl><Input {...field} className="bg-primary/5 border-primary/20" /></FormControl>
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                    <FormField control={form.control} name="operadorDestino" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Operador de Destino</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar nuevo operador" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {}
                            {OPERATOR_OPTIONS
                              .filter(op => op !== selectedClient.operator)
                              .map(op => <SelectItem key={op} value={op}>{op}</SelectItem>)
                            }
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="precioCierre" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio Cierre Mensual (€)</FormLabel>
                        <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="historicoCliente" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observaciones</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Ej: El cliente solicita instalación por la tarde..." 
                        />
                      </FormControl>
                    </FormItem>
                  )} />

                  <Button type="submit" className="w-full h-12 text-lg shadow-lg shadow-primary/20">
                    Registrar Venta de {selectedClient.name}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </form>
    </Form>
  )
}