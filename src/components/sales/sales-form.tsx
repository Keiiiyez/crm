"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { OPERATOR_OPTIONS } from "@/lib/data"


const formSchema = z.object({
  cliente: z.string().min(2, "Client name is required."),
  dni: z.string().min(9, "DNI is required."),
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
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cliente: "",
      dni: "",
      correo: "",
      tlfContacto: "",
      direccion: "",
      localidad: "",
      provincia: "",
      codPostal: "",
      precioCierre: 0,
      estado: "",
      historicoCliente: "",
      ofrecimientoComercial: "",
      pack: "",
      promo: "",
      docAdicEnCrm: false,
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
    // Here you would typically send the data to your server
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Client Information</CardTitle>
                <CardDescription>Enter the details of the client for this sale.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="cliente" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Name</FormLabel>
                    <FormControl><Input placeholder="Full Name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="dni" render={({ field }) => (
                  <FormItem>
                    <FormLabel>DNI / NIF</FormLabel>
                    <FormControl><Input placeholder="12345678A" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="correo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="email@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="tlfContacto" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Phone</FormLabel>
                    <FormControl><Input type="tel" placeholder="600112233" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="direccion" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address</FormLabel>
                    <FormControl><Input placeholder="Calle Falsa 123" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="localidad" render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl><Input placeholder="Madrid" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="provincia" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Province</FormLabel>
                    <FormControl><Input placeholder="Madrid" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="codPostal" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <FormControl><Input placeholder="28001" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Sale Details</CardTitle>
                <CardDescription>Additional information about the commercial offer.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField control={form.control} name="historicoCliente" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client History</FormLabel>
                    <FormControl><Textarea placeholder="Notes about the client's history..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="ofrecimientoComercial" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commercial Offer</FormLabel>
                    <FormControl><Textarea placeholder="Details of the commercial offer made..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="pack" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Pack</FormLabel>
                        <FormControl><Input placeholder="e.g., Fibra + Móvil" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )} />
                    <FormField control={form.control} name="promo" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Promo</FormLabel>
                        <FormControl><Input placeholder="e.g., 50% discount 3 months" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )} />
                </div>
              </CardContent>
            </Card>

          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Activation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="operador"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Operator</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select an operator" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {OPERATOR_OPTIONS.map(op => <SelectItem key={op} value={op}>{op}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="precioCierre"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Closing Price</FormLabel>
                        <FormControl><Input type="number" placeholder="29.99" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="fchaAct"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Activation Date</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP")
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="estado"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Status</FormLabel>
                        <FormControl><Input placeholder="e.g., Active" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                  control={form.control}
                  name="docAdicEnCrm"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Additional documentation in CRM
                        </FormLabel>
                        <FormDescription>
                          Check if there is additional documentation attached.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Button type="submit" className="w-full">Create Sale</Button>
          </div>
        </div>
      </form>
    </Form>
  )
}
