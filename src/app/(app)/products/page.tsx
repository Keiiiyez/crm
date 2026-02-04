"use client"

import * as React from "react"
import { Plus, Trash2, Loader2, Save, Euro } from "lucide-react" // Añadido 'Save'
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
  price: number
}

export default function ProductsPage() {
  const [products, setProducts] = React.useState<Product[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  
  const [newName, setNewName] = React.useState("")
  const [newPrice, setNewPrice] = React.useState("")

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api2/products')
      const data = await res.json()
      if (res.ok) {
        setProducts(Array.isArray(data) ? data : [])
      } else {
        throw new Error(data.error || "Error al cargar")
      }
    } catch (error) {
      toast.error("Error al conectar con la base de datos")
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
      const res = await fetch('/api2/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newName, 
          price: parseFloat(newPrice) 
        }),
      })

      const result = await res.json()

      if (res.ok) {
        toast.success("Servicio añadido correctamente")
        setNewName("")
        setNewPrice("")
        fetchProducts()
      } else {
        toast.error(result.error || "Error al guardar el producto")
      }
    } catch (error) {
      toast.error("Error de red al intentar guardar")
    } finally {
      setIsSaving(false)
    }
  }

  const deleteProduct = async (id: string) => {
    if (!confirm("¿Eliminar este servicio?")) return
    try {
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
    <div className="p-6 space-y-6">
      <Card className="border-indigo-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-indigo-700">Nuevo Servicio</CardTitle>
          <CardDescription>Configura los planes que estarán disponibles para la venta.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddProduct} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2 text-left">
              <Label htmlFor="prod-name">Nombre del Plan</Label>
              <Input 
                id="prod-name"
                placeholder="Ej: Fibra 1Gb + Ilimitada" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>
            <div className="w-full md:w-32 space-y-2 text-left">
              <Label htmlFor="prod-price">Precio (€)</Label>
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
            <Button type="submit" disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Guardar Servicio
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 text-left">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Servicio</TableHead>
                <TableHead className="w-[150px]">Precio Base</TableHead>
                <TableHead className="w-[100px] text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={3} className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-500" /></TableCell></TableRow>
              ) : products.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center py-10 text-muted-foreground">No hay servicios.</TableCell></TableRow>
              ) : (
                products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium uppercase">{product.name}</TableCell>
                    <TableCell className="font-bold text-indigo-600">{Number(product.price).toFixed(2)}€</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => deleteProduct(product.id)} className="text-red-500 hover:bg-red-50">
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