"use client"

import * as React from "react"
import { 
  UserPlus, Shield, Loader2, Lock, CheckCircle2, 
  XCircle, Search, Users2Icon, AlertCircle, 
  ShieldCheck, ShieldAlert
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"

// Importaciones de tu lógica de sistema
import { httpClient } from "@/lib/http-client"
import { useAuth } from "@/lib/auth-context"
import { ProtectedAuditRoute } from "@/components/protected-audit-route" // <--- Mismo protector que Auditoría
import { UserRole, rolePermissions, roleDescriptions, hasPermission } from "@/lib/permissions"

export default function UsersManagementPage() {
  return (
    <ProtectedAuditRoute>
      <UsersContent />
    </ProtectedAuditRoute>
  )
}

function UsersContent() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [newUser, setNewUser] = React.useState({ nombre: "", password: "" })

  const loadData = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await httpClient("/api/users")
      if (res.ok) {
        const data = await res.json()
        setUsers(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      toast.error("Error al cargar la lista de usuarios")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  const handleUpdate = async (userId: number, field: string, value: any) => {
    try {
      const res = await httpClient("/api/users", {
        method: "PATCH",
        body: JSON.stringify({ userId, field, value }),
      })
      if (!res.ok) throw new Error()
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, [field === 'role' ? 'rol' : field]: value } : u))
      toast.success("Usuario actualizado correctamente")
    } catch (e) {
      toast.error("No se pudo realizar el cambio")
    }
  }

  const filteredUsers = users.filter(u => 
    u.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-12 space-y-8">
      {/* Header Estilo Auditoría */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-5">
          <div className="h-14 w-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
            <Users2Icon className="h-7 w-7 text-slate-800" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">
              Gestión <span className="text-slate-400 font-light">de</span> Personal
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-0.5">
              Control de acceso y jerarquía de usuarios
            </p>
          </div>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 h-12 shadow-lg transition-all hover:-translate-y-1">
              <UserPlus className="h-4 w-4 mr-2" /> Agregar Colaborador
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2rem] border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Nuevo Usuario</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Nombre de Acceso</label>
                <Input 
                  placeholder="Ej: jsmith" 
                  value={newUser.nombre} 
                  onChange={e => setNewUser({...newUser, nombre: e.target.value})} 
                  className="rounded-xl border-slate-100 bg-slate-50 h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Contraseña Temporal</label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={newUser.password} 
                  onChange={e => setNewUser({...newUser, password: e.target.value})} 
                  className="rounded-xl border-slate-100 bg-slate-50 h-12"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={async () => {
                const res = await httpClient("/api/users", { method: "POST", body: JSON.stringify(newUser) });
                if(res.ok) { 
                  setIsAddOpen(false); 
                  loadData(); 
                  toast.success("Cuenta creada exitosamente"); 
                }
              }} className="w-full bg-slate-900 h-12 rounded-xl font-bold uppercase text-xs tracking-widest">
                Crear Cuenta Oficial
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Buscador */}
      <Card className="border-none shadow-sm rounded-[2rem] bg-white max-w-[1600px] mx-auto">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por nombre de usuario..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 border-none bg-slate-50 rounded-2xl text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabla Estilo Auditoría */}
      <Card className="border-none shadow-sm rounded-[2rem] bg-white max-w-[1600px] mx-auto overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead className="h-14 px-8 text-[9px] font-black text-slate-400 uppercase tracking-widest">Usuario</TableHead>
                <TableHead className="h-14 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Estado</TableHead>
                <TableHead className="h-14 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Rol Asignado</TableHead>
                <TableHead className="h-14 px-8 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Privilegios</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="h-40 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-slate-200" /></TableCell></TableRow>
              ) : filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                  <TableCell className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white text-xs font-black">
                        {user.nombre.substring(0,2).toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-700 tracking-tight">{user.nombre}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <Select defaultValue={user.estado} onValueChange={(val) => handleUpdate(user.id, 'estado', val)}>
                      <SelectTrigger className={`mx-auto w-28 h-8 rounded-lg text-[9px] font-black uppercase border-none shadow-sm ${user.estado === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVO">ACTIVO</SelectItem>
                        <SelectItem value="INACTIVO">INACTIVO</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>

                  <TableCell className="text-center">
                    <Select defaultValue={user.rol} onValueChange={(val) => handleUpdate(user.id, 'role', val)}>
                      <SelectTrigger className="mx-auto w-32 h-8 rounded-lg text-[9px] font-black uppercase bg-slate-100 border-none shadow-sm text-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(rolePermissions).map(role => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  <TableCell className="px-8 text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" className="rounded-xl hover:bg-slate-100 text-slate-600 group">
                          <Shield className="h-4 w-4 mr-2 group-hover:text-slate-900 transition-colors" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Ver Matriz</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-[2.5rem] border-none max-w-md max-h-[85vh] overflow-y-auto shadow-2xl">
                        <DialogHeader className="items-center text-center">
                          <div className="p-4 bg-slate-50 rounded-3xl mb-4">
                            <ShieldCheck className="h-10 w-10 text-slate-900" />
                          </div>
                          <DialogTitle className="text-2xl font-black uppercase tracking-tighter">{user.nombre}</DialogTitle>
                          <Badge className="bg-slate-900 text-white border-none px-4 py-1 rounded-full text-[9px] tracking-[0.2em]">{user.rol}</Badge>
                          <p className="text-xs text-slate-400 italic mt-3 px-6">
                            "{roleDescriptions[user.rol as UserRole]?.description}"
                          </p>
                        </DialogHeader>

                        <div className="space-y-6 py-6">
                          <Button 
                            variant="outline" 
                            className="w-full justify-center rounded-2xl border-dashed border-slate-200 h-12 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 hover:border-slate-900 transition-all"
                            onClick={() => {
                              const p = prompt("Escriba la nueva contraseña:");
                              if(p) handleUpdate(user.id, 'password', p);
                            }}
                          >
                            <Lock className="h-4 w-4 mr-2 text-amber-500" /> Forzar Cambio de Clave
                          </Button>

                          <div className="space-y-3">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b pb-2">Matriz de Acceso Real-Time</p>
                            <div className="grid grid-cols-1 gap-2">
                              {rolePermissions["ADMIN"].map((perm) => {
                                const hasIt = rolePermissions[user.rol as UserRole]?.includes(perm);
                                return (
                                  <div key={perm} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${hasIt ? 'bg-slate-900 border-slate-900' : 'bg-slate-50 border-slate-100 opacity-40'}`}>
                                    <span className={`text-[10px] font-bold uppercase tracking-tight ${hasIt ? 'text-white' : 'text-slate-400'}`}>
                                      {perm.replace(/_/g, ' ')}
                                    </span>
                                    {hasIt ? (
                                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                    ) : (
                                      <XCircle className="h-4 w-4 text-slate-300" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}