import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { sales } from "@/lib/data"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PlusCircle } from "lucide-react"

export default function SalesPage() {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="font-headline">Ventas</CardTitle>
                <CardDescription>Lista de todas las ventas</CardDescription>
            </div>
            <Button asChild size="sm" className="gap-1">
                <Link href="/sales/new">
                    <PlusCircle className="h-4 w-4" />
                    Nueva Venta
                </Link>
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Operador</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead>Estatus</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="font-medium">{sale.clientName}</TableCell>
                <TableCell>{sale.productName}</TableCell>
                <TableCell>{sale.operatorName}</TableCell>
                <TableCell>{sale.saleDate}</TableCell>
                <TableCell className="text-right">${sale.amount.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={sale.status === 'Completed' ? 'default' : sale.status === 'Pending' ? 'secondary' : 'destructive'} className="text-xs">
                    {sale.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
