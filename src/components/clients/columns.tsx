"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown, Pencil, Trash2, Copy } from "lucide-react"

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
import { toast } from "sonner"

import type { Client } from "@/lib/definitions"

export const columns = (onEdit: (client: Client) => void): ColumnDef<Client>[] => [
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
      >
        Nombre
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const client = row.original
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={client.avatarUrl} alt={client.name} />
            <AvatarFallback>{client.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{client.name}</div>
            <div className="text-xs text-muted-foreground">DNI: {client.dni}</div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "email",
    header: "Contacto",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span>{row.original.email}</span>
        <span className="text-xs text-muted-foreground">{row.original.phone}</span>
      </div>
    ),
  },
  {
    accessorKey: "city",
    header: "Ubicación",
    cell: ({ row }) => (
      <div className="flex flex-col text-sm">
        <span>{row.original.city}</span>
        <span className="text-xs text-muted-foreground">{row.original.province}</span>
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const client = row.original;

      const handleDelete = async () => {
        if (confirm(`¿Estás seguro de eliminar a ${client.name}? Esta acción no se puede deshacer.`)) {
          try {
            const res = await fetch(`/api/clients/${client.id}`, { 
              method: 'DELETE' 
            });
            
            if (res.ok) {
              toast.success("Cliente borrado de XAMPP");
              window.location.reload(); 
            } else {
              const errorData = await res.json();
              toast.error(`Error: ${errorData.error || "No se pudo eliminar"}`);
            }
          } catch (error) {
            toast.error("Error de conexión al intentar eliminar");
          }
        }
      };

      const copyId = () => {
        if (client.id) {
          navigator.clipboard.writeText(client.id.toString());
          toast.success("ID del cliente copiado");
        }
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem onClick={copyId}>
              <Copy className="mr-2 h-4 w-4" /> Copiar ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            
            {/* AQUÍ LLAMAMOS A LA FUNCIÓN onEdit QUE PASAMOS DESDE LA PÁGINA */}
            <DropdownMenuItem onClick={() => onEdit(client)}>
              <Pencil className="mr-2 h-4 w-4" /> Editar datos
            </DropdownMenuItem>
            
            <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-destructive-foreground" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" /> Eliminar cliente
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  }
]