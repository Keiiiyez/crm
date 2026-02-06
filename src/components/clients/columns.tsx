"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Pencil, Trash2, FileText, MapPin, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import type { Client } from "@/lib/definitions"

export const columns = (onEdit: (client: Client) => void, onSuccess?: () => void): ColumnDef<Client>[] => [
  {
    accessorKey: "name",  
    header: ({ column }) => (
      <div 
        className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 cursor-pointer hover:text-slate-900 transition-colors flex items-center gap-2 pb-2"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Cliente <ArrowUpDown className="h-3 w-3" />
      </div>
    ),
    cell: ({ row }) => {
      const client = row.original
      return (
        <div className="py-3">
          <div className="font-black text-slate-800 text-[14px] uppercase tracking-tighter leading-none mb-1">
            {client.name}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 font-mono tracking-widest">{client.dni}</span>
            <span className="h-1 w-1 rounded-full bg-cyan-500/30" />
            <span className="text-[10px] font-black text-cyan-600/80 uppercase">
                {client.nationality || "ESPAÑOLA"}
            </span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "operator", 
    header: () => <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 pb-2 block">Operadora</span>,
    cell: ({ row }) => {
      const op = (row.original.operator || "PENDIENTE").toUpperCase();
      const colors: any = { VODAFONE: "text-blue-500", ORANGE: "text-orange-500", DIGI: "text-cyan-500", MOVISTAR: "text-emerald-500" };
      return (
        <span className={`text-[11px] font-black tracking-widest ${colors[op] || "text-slate-400"}`}>
          {op}
        </span>
      )
    }
  },
  {
    accessorKey: "contact",
    header: () => <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 pb-2 block">Contacto</span>,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-[12px] font-bold text-slate-600 lowercase mb-0.5">{row.original.email}</span>
        <span className="text-[10px] font-black text-slate-400 tracking-widest">{row.original.phone}</span>
      </div>
    ),
  },
  {
    accessorKey: "location",
    header: () => <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 pb-2 block">Ubicación</span>,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
        </div>
        <div className="flex flex-col">
          <span className="text-[12px] font-black text-slate-700 uppercase tracking-tight">
            {row.original.city}
          </span>
          <span className="text-[9px] text-slate-400 font-bold uppercase">
            {row.original.province}
          </span>
        </div>
      </div>
    ),
  },
  {
    id: "actions",
    header: () => <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 text-center block pb-2">Acciones</span>,
    cell: ({ row }) => {
      const client = row.original;
      return (
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 w-10 p-0 text-slate-300 hover:text-slate-900 transition-all rounded-xl hover:bg-white hover:shadow-sm">
                <FileText className="h-5 w-5 opacity-40 hover:opacity-100" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px] rounded-3xl shadow-2xl border-none p-2 bg-white ring-1 ring-slate-100">
              <DropdownMenuLabel className="text-[9px] uppercase font-black text-slate-400 px-3 py-2 tracking-widest">Opciones</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit(client)} className="text-[11px] font-bold gap-3 rounded-2xl py-3 cursor-pointer">
                <Pencil className="h-4 w-4 opacity-50" /> Editar Ficha
              </DropdownMenuItem>
              <DropdownMenuSeparator className="opacity-50" />
              <DropdownMenuItem className="text-[11px] font-bold text-red-500 gap-3 rounded-2xl py-3 cursor-pointer focus:bg-red-50 focus:text-red-600">
                <Trash2 className="h-4 w-4 opacity-50" /> Borrar Registro
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  }
]