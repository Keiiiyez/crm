"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  filterInputPlaceholder: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filterInputPlaceholder,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full space-y-10 py-4">
      {/* HEADER CON SOMBRA PROFUNDA */}
      <div className="flex items-center gap-6 px-2">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-cyan-500 transition-colors z-10" />
          <Input
            id={`search-${filterInputPlaceholder}`}
            name={`search-${filterInputPlaceholder}`}
            placeholder={filterInputPlaceholder}
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="pl-11 h-14 bg-white border-none shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] rounded-2xl font-bold text-slate-600 focus-visible:ring-2 focus-visible:ring-cyan-500/20 transition-all placeholder:font-medium"
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-14 rounded-2xl border-none bg-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] px-6 font-black text-[10px] uppercase tracking-[0.15em] text-slate-500 hover:bg-slate-50 transition-all hover:-translate-y-0.5 active:translate-y-0">
              <SlidersHorizontal className="mr-2 h-4 w-4 opacity-50" /> Visualización
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-3 min-w-[180px] bg-white ring-1 ring-slate-100">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize font-bold text-[11px] rounded-xl mb-1 cursor-pointer py-2"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* TABLA FLOTANTE CON SOMBRA MULTICAPA */}
      <div className="relative rounded-[2.5rem] bg-white border border-slate-50 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08),0_10px_20px_-5px_rgba(0,0,0,0.04)] overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-slate-100 hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="px-10 h-20 font-black text-[10px] uppercase tracking-[0.25em] text-slate-400">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-slate-50 last:border-0 group transition-all duration-300 hover:bg-slate-50/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-10 py-6">
                      <div className="transition-all duration-300 group-hover:translate-x-1 group-hover:text-slate-900">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-48 text-center font-black text-slate-300 text-[10px] uppercase tracking-widest"
                >
                  No hay registros disponibles.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* FOOTER FLOTANTE */}
      <div className="flex items-center justify-between px-8 py-2">
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
          Total <span className="text-cyan-600 ml-1">{table.getFilteredRowModel().rows.length}</span> unidades
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-12 w-12 rounded-2xl bg-white shadow-md border border-slate-100 hover:shadow-lg hover:bg-white disabled:opacity-20 transition-all hover:-translate-y-0.5"
          >
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 font-black text-[11px] text-slate-500">
            {table.getState().pagination.pageIndex + 1}
          </div>
          <Button
            variant="ghost"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-12 w-12 rounded-2xl bg-white shadow-md border border-slate-100 hover:shadow-lg hover:bg-white disabled:opacity-20 transition-all hover:-translate-y-0.5"
          >
            <ChevronRight className="h-5 w-5 text-slate-600" />
          </Button>
        </div>
      </div>
    </div>
  )
}