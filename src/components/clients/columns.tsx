"use client"

import { ColumnDef } from "@tanstack/react-table"
import { 
  MoreHorizontal, 
  ArrowUpDown, 
  Pencil, 
  Trash2, 
  Copy, 
  Phone, 
  MapPin, 
  Mail, 
  UserCircle2,
  Globe2,
  Building2
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
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

import type { Client } from "@/lib/definitions"

export const columns = (
  onEdit: (client: Client) => void, 
  onSuccess?: () => void 
): ColumnDef<Client>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="rounded-lg border-slate-300 data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900 transition-colors"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)} // CORREGIDO AQUÍ
        aria-label="Select row"
        className="rounded-lg border-slate-300 data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900 transition-colors"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",  
    header: ({ column }) => (
      <div 
        className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 cursor-pointer hover:text-cyan-500 transition-colors flex items-center gap-2"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Cliente <ArrowUpDown className="h-3 w-3" />
      </div>
    ),
    cell: ({ row }) => {
      const client = row.original
      return (
        <div className="flex items-center gap-4 group">
          <div className="relative">
            <Avatar className="h-11 w-11 border-[3px] border-white shadow-sm group-hover:shadow-md transition-shadow">
              <AvatarImage src={client.avatarUrl} alt={client.name} />
              <AvatarFallback className="bg-slate-100 text-slate-500 text-[10px] font-black">
                {client.name?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-slate-800 text-[13px] tracking-tight uppercase leading-tight">
              {client.name}
            </span>
            <div className="flex items-center gap-1.5 mt-1">
               <span className="text-[9px] font-bold text-slate-400 font-mono tracking-tighter">
                {client.dni}
               </span>
               <span className="h-1 w-1 rounded-full bg-slate-200" />
               <span className="text-[9px] font-black text-cyan-600 uppercase tracking-tighter">
                {client.nationality || "Española"}
               </span>
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "operator", 
    header: () => <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Servicio</span>,
    cell: ({ row }) => {
      const op = row.original.operator
      return (
        <div className="flex flex-col gap-1">
            <Badge className="w-fit bg-slate-900 text-white text-[9px] font-black px-2.5 py-0.5 rounded-lg border-none shadow-sm hover:bg-slate-800 transition-colors uppercase">
                {op || "Pendiente"}
            </Badge>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest px-1">
                Operador Activo
            </span>
        </div>
      )
    }
  },
  {
    accessorKey: "email",
    header: () => <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Contacto Directo</span>,
    cell: ({ row }) => (
      <div className="space-y-1.5">
        <div className="flex items-center text-slate-700 font-bold text-xs tracking-tight group cursor-pointer hover:text-cyan-600 transition-colors">
          <div className="p-1.5 rounded-lg bg-slate-100 mr-2 group-hover:bg-cyan-50">
            <Mail className="h-3 w-3 text-slate-400 group-hover:text-cyan-500" />
          </div>
          {row.original.email}
        </div>
        <div className="flex items-center text-[10px] text-slate-500 font-black tracking-[0.05em] group cursor-pointer hover:text-emerald-600 transition-colors">
          <div className="p-1.5 rounded-lg bg-slate-100 mr-2 group-hover:bg-emerald-50">
            <Phone className="h-3 w-3 text-slate-400 group-hover:text-emerald-500" />
          </div>
          {row.original.phone}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "city",
    header: () => <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Ubicación</span>,
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-xl bg-cyan-50 flex items-center justify-center">
            <MapPin className="h-4 w-4 text-cyan-600" />
        </div>
        <div className="flex flex-col text-xs">
            <span className="font-black text-slate-700 uppercase tracking-tight">{row.original.city}</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">
                {row.original.province}
            </span>
        </div>
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const client = row.original;

      const handleDelete = async () => {
        if (confirm(`¿Eliminar expediente de ${client.name}?`)) {
          try {
            const res = await fetch(`/api/clients/${client.id}`, { method: 'DELETE' });
            if (res.ok) {
              toast.success("Expediente eliminado");
              if (onSuccess) onSuccess();
            }
          } catch (error) {
            toast.error("Error al eliminar");
          }
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 w-10 p-0 rounded-2xl hover:bg-white hover:shadow-md border-transparent hover:border-slate-100 border transition-all">
              <MoreHorizontal className="h-5 w-5 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px] p-2 rounded-[1.5rem] border-none shadow-2xl ring-1 ring-black/5 bg-white/95 backdrop-blur-md">
            <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-4 py-3">
                Gestión Administrativa
            </DropdownMenuLabel>
            <DropdownMenuItem 
                className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 gap-3 focus:bg-slate-100 focus:text-slate-900 cursor-pointer transition-colors"
                onClick={() => {
                    navigator.clipboard.writeText(client.iban || "");
                    toast.success("IBAN copiado");
                }}
            >
              <Building2 className="h-4 w-4 opacity-70" /> Copiar IBAN
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-100 my-1 mx-2" />
            <DropdownMenuItem 
                className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 gap-3 focus:bg-cyan-50 focus:text-cyan-600 cursor-pointer transition-colors"
                onClick={() => onEdit(client)}
            >
              <Pencil className="h-4 w-4 opacity-70" /> Editar Ficha
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="rounded-xl px-4 py-2.5 text-xs font-bold text-red-600 gap-3 focus:bg-red-50 focus:text-red-600 cursor-pointer transition-colors" 
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 opacity-70" /> Borrar Registro
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  }
]