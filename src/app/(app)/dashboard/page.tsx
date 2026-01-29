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
import { sales, clients, products } from "@/lib/data"
import { DollarSign, Users, Package, ShoppingCart } from "lucide-react"
import { SalesChart } from "@/components/sales-chart"

export default function DashboardPage() {
  const totalRevenue = sales.reduce((acc, sale) => sale.status === 'Completed' ? acc + sale.amount : acc, 0)

  const stats = [
    { title: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, description: "Total revenue from completed sales" },
    { title: "Sales", value: `+${sales.length}`, icon: ShoppingCart, description: "Total number of sales" },
    { title: "New Clients", value: `+${clients.length}`, icon: Users, description: "Total number of clients" },
    { title: "Products", value: `${products.length}`, icon: Package, description: "Total number of products" },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-body">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="font-headline">Sales Overview</CardTitle>
            <CardDescription>A chart showing sales per month.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <SalesChart />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-headline">Recent Sales</CardTitle>
            <CardDescription>
              You have {sales.length} sales in total.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sales.slice(0, 5).map((sale) => (
                    <TableRow key={sale.id}>
                        <TableCell>
                        <div className="font-medium">{sale.clientName}</div>
                        <div className="text-sm text-muted-foreground">{sale.operatorName}</div>
                        </TableCell>
                        <TableCell>{sale.productName}</TableCell>
                        <TableCell className="text-right">${sale.amount.toFixed(2)}</TableCell>
                        <TableCell>
                            <Badge variant={sale.status === 'Completed' ? 'default' : sale.status === 'Pending' ? 'secondary' : 'destructive'} className="text-xs" >
                                {sale.status}
                            </Badge>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
