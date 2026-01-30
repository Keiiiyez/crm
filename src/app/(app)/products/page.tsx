"use client"

import * as React from "react"
import { Plus, Trash2, Edit2, Loader2, Save } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Product {
  id: string
  name: string
  price: number | string // Aceptamos string porque MySQL lo devuelve así
}

export default function ProductsPage() {
  const [products, setProducts] = React.useState<Product[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  
  const [newName, setNewName] = React.useState("")
  const [newPrice, setNewPrice] = React.useState("")

  const fetchProducts = async () => {
    try {
      // Mantenemos tu ruta api2
      const res = await fetch('/api2/products')
      const data = await res.json()
      if (Array.isArray(data)) setProducts(data)
    } catch (error) {
      toast.error("Error al cargar servicios")
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchProducts()
  }, [])

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName || !newPrice) return
    
    setIsSaving(true)
    try {
      // Mantenemos tu ruta api2
      const res = await fetch('/api2/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, price: Number(newPrice) }),
      })

      if (res.ok) {
        toast.success("Servicio añadido")
        setNewName("")
        setNewPrice("")
        fetchProducts()
      }
    } catch (error) {
      toast.error("Error al guardar")
    } finally {
      setIsSaving(false)
    }
  }

  const deleteProduct = async (id: string) => {
    if (!confirm("¿Eliminar este servicio?")) return
    try {
      // Mantenemos tu ruta api2
      const res = await fetch(`/api2/products/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success("Servicio eliminado")
        fetchProducts()
      }
    } catch (error) {
      toast.error("No se pudo eliminar")
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-primary">Nuevo Servicio</CardTitle>
          <CardDescription>Define el nombre y el precio base del plan de telefonía.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddProduct} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="prod-name">Nombre del Plan</Label>
              <Input 
                id="prod-name"
                placeholder="Ej: Fibra 1Gb + Ilimitada" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>
            <div className="w-full md:w-32 space-y-2">
              <Label htmlFor="prod-price">Precio Base (€)</Label>
              <Input 
                id="prod-price"
                type="number" 
                step="0.01"
                placeholder="0.00"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Guardar Servicio
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Catálogo de Servicios</CardTitle>
          <CardDescription>Estos productos aparecerán en el formulario de ventas.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Nombre del Servicio</TableHead>
                <TableHead className="w-[150px]">Precio Base</TableHead>
                <TableHead className="w-[100px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                    No hay servicios registrados. Añade uno arriba.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell className="font-mono text-primary">
                      {/* EL FIX: Convertimos a Number antes de aplicar toFixed */}
                      {Number(product.price).toFixed(2)}€
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteProduct(product.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}