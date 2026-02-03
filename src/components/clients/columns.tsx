"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown, Pencil, Trash2, Copy, Phone, MapPin } from "lucide-react"

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
    accessorKey: "name",  
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-4"
      >
        Nombre
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const client = row.original
      const name = client.name || "Sin Nombre"
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border">
            <AvatarImage src={client.avatarUrl} alt={name} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold leading-none mb-1">{name}</span>
            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded w-fit">
              {client.dni}
            </span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "operator", 
    header: "Operador",
    cell: ({ row }) => {
      const op = row.original.operator
      return op ? (
        <Badge variant="outline" className="font-normal border-blue-200 bg-blue-50 text-blue-700">
          {op}
        </Badge>
      ) : null
    }
  },
  {
    accessorKey: "email",
    header: "Contacto",
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <span className="text-sm truncate max-w-[150px] font-medium">{row.original.email}</span>
        <div className="flex items-center text-xs text-muted-foreground italic">
          <Phone className="mr-1 h-3 w-3" /> {row.original.phone}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "city",
    header: "Ubicación",
    cell: ({ row }) => (
      <div className="flex flex-col text-sm">
        <div className="flex items-center font-medium">
          <MapPin className="mr-1 h-3 w-3 text-muted-foreground" />
          <span>{row.original.city}</span>
        </div>
        <span className="text-xs text-muted-foreground ml-4">{row.original.province}</span>
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const client = row.original;

      const handleDelete = async () => {
        if (confirm(`¿Estás seguro de eliminar a ${client.name}?`)) {
          try {
            const res = await fetch(`/api/clients/${client.id}`, { method: 'DELETE' });
            if (res.ok) {
              toast.success("Cliente eliminado correctamente");
              if (onSuccess) onSuccess();
            } else {
              toast.error("No se pudo eliminar el registro");
            }
          } catch (error) {
            toast.error("Error de conexión");
          }
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px]">
            <DropdownMenuLabel>Opciones</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => {
              navigator.clipboard.writeText(client.id?.toString() || "");
              toast.success("ID copiado");
            }}>
              <Copy className="mr-2 h-4 w-4" /> Copiar ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(client)}>
              <Pencil className="mr-2 h-4 w-4" /> Editar datos
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive focus:bg-destructive/10 focus:text-destructive" 
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  }
]