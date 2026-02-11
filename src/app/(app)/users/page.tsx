"use client";

import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Shield, UserCircle, Search, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner"; // O la librería de notificaciones que uses

export default function UsersManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch("/api/users");
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch (e) {
        toast.error("Error al cargar los usuarios");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Lógica de actualización real
  const handleUpdate = async (userId: number, field: string, value: any) => {
    setUpdatingId(`${userId}-${field}`);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, field, value }),
      });

      if (!res.ok) throw new Error();

      // Actualizar estado local
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, [field]: value } : u));
      toast.success("Cambio guardado correctamente");
    } catch (e) {
      toast.error("No se pudo guardar el cambio");
    } finally {
      setUpdatingId(null);
    }
  };

  // Filtros combinados
  const coordinadoresDisponibles = users.filter(u => u.role === 'coordinador' || u.role === 'admin');
  
  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex h-screen flex-col items-center justify-center gap-2">
      <Loader2 className="animate-spin h-10 w-10 text-cyan-600" />
      <p className="text-slate-500 animate-pulse">Cargando base de datos...</p>
    </div>
  );

  return (
    <div className="p-6 space-y-6 bg-slate-50/30 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestión de Personal</h1>
          <p className="text-slate-500">Define la estructura jerárquica y roles del equipo.</p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700 rounded-2xl px-6 shadow-lg shadow-cyan-100 transition-all hover:scale-105">
          <UserPlus className="h-4 w-4 mr-2" /> Invitar Usuario
        </Button>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/50 bg-white rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-slate-50 bg-white/50 backdrop-blur-md">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por nombre o correo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-2xl border-slate-200 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="font-bold text-slate-600 py-4 px-6">Identidad</TableHead>
                <TableHead className="font-bold text-slate-600">Nivel de Acceso</TableHead>
                <TableHead className="font-bold text-slate-600">Superior Directo</TableHead>
                <TableHead className="font-bold text-slate-600 text-right px-6">Configuración</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="px-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center border border-white shadow-sm">
                        <UserCircle className="h-6 w-6 text-slate-500" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{user.name}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Select 
                        defaultValue={user.role} 
                        onValueChange={(val) => handleUpdate(user.id, 'role', val)}
                        disabled={updatingId === `${user.id}-role`}
                      >
                        <SelectTrigger className="w-36 h-9 rounded-xl border-slate-200 capitalize font-medium">
                          {updatingId === `${user.id}-role` ? <Loader2 className="h-3 w-3 animate-spin" /> : <SelectValue />}
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="coordinador">Coordinador</SelectItem>
                          <SelectItem value="asesor">Asesor Comercial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.role === 'asesor' ? (
                      <Select 
                        defaultValue={String(user.coordinador_id || "null")}
                        onValueChange={(val) => handleUpdate(user.id, 'coordinador_id', val)}
                        disabled={updatingId === `${user.id}-coordinador_id`}
                      >
                        <SelectTrigger className="w-52 h-9 rounded-xl border-slate-200">
                           {updatingId === `${user.id}-coordinador_id` ? <Loader2 className="h-3 w-3 animate-spin" /> : <SelectValue placeholder="Sin superior asignado" />}
                        </SelectTrigger>
                        <SelectContent className="rounded-xl shadow-xl">
                          <SelectItem value="null" className="text-slate-400 italic">Ninguno (Independiente)</SelectItem>
                          {coordinadoresDisponibles.map(c => (
                            <SelectItem key={c.id} value={String(c.id)} className="font-medium">
                              {c.name} <span className="text-[10px] opacity-50 ml-1">({c.role})</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="secondary" className="bg-slate-100 text-slate-400 border-none font-normal px-3 py-1">
                        Perfil Directivo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <Button variant="ghost" size="sm" className="rounded-xl hover:bg-cyan-50 text-cyan-700 font-semibold group">
                      <Shield className="h-4 w-4 mr-1.5 transition-transform group-hover:rotate-12" /> 
                      Permisos
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredUsers.length === 0 && (
            <div className="p-20 text-center text-slate-400 italic">
              No se encontraron usuarios que coincidan con la búsqueda.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}