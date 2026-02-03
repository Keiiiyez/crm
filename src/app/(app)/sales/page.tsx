"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getPaginationRowModel,
} from "@tanstack/react-table"
import { 
  MoreHorizontal, ArrowUpDown, Trash2, 
  Copy, PlusCircle, RefreshCw, 
  Loader2, Calendar, ChevronDown, CheckCircle2, 
  Clock, AlertTriangle, Download 
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import Link from "next/link"

const STATUS_CONFIG: Record<string, { label: string, class: string, icon: any }> = {
  "Pending": { 
    label: "Pendiente", 
    class: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100", 
    icon: Clock 
  },
  "In Progress": { 
    label: "En Proceso", 
    class: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100", 
    icon: RefreshCw 
  },
  "Completed": { 
    label: "Completada", 
    class: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100", 
    icon: CheckCircle2 
  },
  "Cancelled": { 
    label: "Cancelada", 
    class: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100", 
    icon: AlertTriangle 
  }
}

export default function SalesPage() {
  const [data, setData] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [rowSelection, setRowSelection] = React.useState({})

  const fetchSales = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api2/sales")
      if (!res.ok) throw new Error();
      const result = await res.json()
      setData(Array.isArray(result) ? result : [])
    } catch (error) {
      toast.error("Error al cargar ventas")
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (saleId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api2/sales/${saleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) throw new Error();
      
      setData(prev => prev.map(sale => 
        sale.id === saleId ? { ...sale, status: newStatus } : sale
      ));
      
      toast.success(`Estado: ${newStatus}`);
    } catch (error) {
      toast.error("Error al actualizar la base de datos");
    }
  }

  const columns: ColumnDef<any>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "clientName",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="-ml-4">
          Cliente
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex flex-col py-1">
          <span className="font-semibold text-slate-900">{row.original.clientName}</span>
          <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded w-fit uppercase">
            ID: {row.original.id}
          </span>
        </div>
      )
    },
    {
      accessorKey: "operadorDestino",
      header: "Operador",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-normal border-blue-200 bg-blue-50 text-blue-700">
          {row.original.operadorDestino}
        </Badge>
      )
    },
    {
      accessorKey: "precioCierre",
      header: () => <div className="text-right">Importe</div>,
      cell: ({ row }) => (
        <div className="text-right font-bold text-blue-900 px-2">
          {Number(row.original.precioCierre).toFixed(2)}€
        </div>
      )
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => {
        const currentStatus = row.original.status || "Pending"
        const config = STATUS_CONFIG[currentStatus] || STATUS_CONFIG["Pending"]
        const Icon = config.icon

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className={`h-7 px-3 gap-2 font-bold rounded-full border ${config.class}`}>
                <Icon className="h-3 w-3" />
                {config.label}
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">Actualizar Estado</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                <DropdownMenuItem key={key} onClick={() => handleStatusUpdate(row.original.id, key)} className="gap-2">
                  <val.icon className="h-3.5 w-3.5" /> {val.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuLabel>Opciones</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => {
              navigator.clipboard.writeText(row.original.id);
              toast.success("ID copiado");
            }}>
              <Copy className="mr-2 h-4 w-4" /> Copiar ID
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="mr-2 h-4 w-4" /> Ver Contrato
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:bg-destructive/10">
              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: setRowSelection,
    state: { sorting, rowSelection },
  })

  React.useEffect(() => { fetchSales() }, [])

  return (
    <div className="space-y-4">
      <Card className="shadow-md border border-slate-200">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-black">Historial de Ventas</CardTitle>
              <CardDescription>Gestión de contratos y estados comerciales</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchSales} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Link href="/sales/new">
                  <PlusCircle className="h-4 w-4 mr-1" /> Nueva Venta
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="text-xs font-bold uppercase tracking-wider text-slate-500 py-3 px-4">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      <div className="flex justify-center items-center gap-2 italic text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" /> Cargando base de datos...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="transition-colors hover:bg-slate-50/50">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-3 px-4">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground italic">
                      No se encontraron registros de ventas.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* CONTADOR DE FILAS SELECCIONADAS Y PAGINACIÓN */}
          <div className="flex items-center justify-between space-x-2 py-4 px-2">
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} de{" "}
              {table.getFilteredRowModel().rows.length} venta(s) seleccionada(s).
            </div>
            
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}