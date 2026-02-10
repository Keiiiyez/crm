"use client"

import * as React from "react"
import { 
  Calendar, Clock, User, Database, GitBranch, Filter, 
  ChevronLeft, ChevronRight, Eye, EyeOff, AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { httpClient } from "@/lib/http-client"
import { useAuth } from "@/lib/auth-context"
import { ProtectedAuditRoute } from "@/components/protected-audit-route"

interface AuditRecord {
  id: number
  usuario_id: string
  tabla_afectada: string
  tipo_operacion: "INSERT" | "UPDATE" | "DELETE"
  datos_anteriores: string | null
  datos_nuevos: string | null
  fecha_cambio: string
  descripcion: string
}

const TIPO_COLORES: Record<string, string> = {
  INSERT: "bg-green-100 text-green-800 border-green-300",
  UPDATE: "bg-blue-100 text-blue-800 border-blue-300",
  DELETE: "bg-red-100 text-red-800 border-red-300",
}

const TIPO_LABELS: Record<string, string> = {
  INSERT: "Creado",
  UPDATE: "Modificado",
  DELETE: "Eliminado",
}

export default function AuditPage() {
  return (
    <ProtectedAuditRoute>
      <AuditContent />
    </ProtectedAuditRoute>
  )
}

function AuditContent() {
  const { user } = useAuth()
  const [records, setRecords] = React.useState<AuditRecord[]>([])
  const [loading, setLoading] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [total, setTotal] = React.useState(0)
  const [pages, setPages] = React.useState(1)
  const [limit] = React.useState(50)

  // Filtros
  const [filterUsuario, setFilterUsuario] = React.useState("")
  const [filterTabla, setFilterTabla] = React.useState("")
  const [filterTipo, setFilterTipo] = React.useState("")
  const [usuarios, setUsuarios] = React.useState<string[]>([])
  const [tablas, setTablas] = React.useState<string[]>([])
  const [tipos, setTipos] = React.useState<string[]>([])

  // Detalle expandido
  const [expandedId, setExpandedId] = React.useState<number | null>(null)

  const loadAudit = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      if (filterUsuario) params.append("usuario", filterUsuario)
      if (filterTabla) params.append("tabla", filterTabla)
      if (filterTipo) params.append("tipo", filterTipo)

      const response = await httpClient(`/api/audit?${params}`)
      if (response.ok) {
        const result = await response.json()
        setRecords(result.data)
        setTotal(result.pagination.total)
        setPages(result.pagination.pages)
        setUsuarios(result.filters.usuarios)
        setTablas(result.filters.tablas)
        setTipos(result.filters.tipos)
      }
    } catch (error) {
      toast.error("Error al cargar auditoría")
    } finally {
      setLoading(false)
    }
  }, [page, limit, filterUsuario, filterTabla, filterTipo])

  React.useEffect(() => {
    setPage(1)
  }, [filterUsuario, filterTabla, filterTipo])

  React.useEffect(() => {
    loadAudit()
  }, [loadAudit])

  const handleResetFilters = () => {
    setFilterUsuario("")
    setFilterTabla("")
    setFilterTipo("")
    setPage(1)
  }

  const parseJSON = (str: string | null) => {
    if (!str) return null
    try {
      return JSON.parse(str)
    } catch {
      return str
    }
  }

  const formatDifference = (anterior: any, nuevo: any) => {
    if (typeof anterior === "object" && typeof nuevo === "object") {
      return (
        <div className="space-y-2">
          <div className="text-red-600 text-xs">
            <strong>Antes:</strong>
            <pre className="bg-red-50 p-2 rounded text-[10px] overflow-x-auto">
              {JSON.stringify(anterior, null, 2)}
            </pre>
          </div>
          <div className="text-green-600 text-xs">
            <strong>Después:</strong>
            <pre className="bg-green-50 p-2 rounded text-[10px] overflow-x-auto">
              {JSON.stringify(nuevo, null, 2)}
            </pre>
          </div>
        </div>
      )
    }
    return (
      <div className="text-xs space-y-1">
        {anterior && <div className="text-red-600"><strong>Antes:</strong> {String(anterior)}</div>}
        {nuevo && <div className="text-green-600"><strong>Después:</strong> {String(nuevo)}</div>}
      </div>
    )
  }

  const activeFilters = (filterUsuario ? 1 : 0) + (filterTabla ? 1 : 0) + (filterTipo ? 1 : 0)

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-5">
          <div className="h-14 w-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
            <AlertCircle className="h-7 w-7 text-slate-800" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">
              Auditoría <span className="text-slate-400 font-light">de</span> Cambios
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-0.5">
              Registro completo de movimientos del sistema
            </p>
          </div>
        </div>
        {total > 0 && (
          <div className="text-right">
            <p className="text-3xl font-black text-slate-900">{total.toLocaleString()}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cambios registrados</p>
          </div>
        )}
      </div>

      {/* Filtros */}
      <Card className="border-none shadow-sm rounded-[2rem] bg-white max-w-[1600px] mx-auto">
        <CardHeader className="p-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-slate-400" />
            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-widest">
              Filtros {activeFilters > 0 && <Badge className="ml-3 bg-blue-100 text-blue-700 border-none">{activeFilters}</Badge>}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Usuario</label>
              <Select value={filterUsuario} onValueChange={setFilterUsuario}>
                <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  {usuarios.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Tabla</label>
              <Select value={filterTabla} onValueChange={setFilterTabla}>
                <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  {tablas.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Tipo de Cambio</label>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  {tipos.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TIPO_LABELS[t] || t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {activeFilters > 0 && (
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  onClick={handleResetFilters}
                  className="h-10 text-slate-500 hover:text-slate-900 font-bold text-[10px] uppercase tracking-widest"
                >
                  Limpiar Filtros
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card className="border-none shadow-sm rounded-[2rem] bg-white max-w-[1600px] mx-auto overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 bg-slate-50/50 hover:bg-slate-50/50">
                <TableHead className="h-12 px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider font-bold w-12">
                  ID
                </TableHead>
                <TableHead className="h-12 px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" /> Usuario
                  </div>
                </TableHead>
                <TableHead className="h-12 px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" /> Tabla
                  </div>
                </TableHead>
                <TableHead className="h-12 px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4" /> Operación
                  </div>
                </TableHead>
                <TableHead className="h-12 px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                  Descripción
                </TableHead>
                <TableHead className="h-12 px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Fecha
                  </div>
                </TableHead>
                <TableHead className="h-12 px-6 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                  Detalles
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-20 text-center text-slate-400">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-20 text-center text-slate-400">
                    No hay registros de auditoría
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <React.Fragment key={record.id}>
                    <TableRow className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <TableCell className="px-6 py-3 text-xs font-mono text-slate-500">{record.id}</TableCell>
                      <TableCell className="px-6 py-3">
                        <div>
                          <div className="h-8 w-8 rounded-lg bg-sky-100 flex items-center justify-center text-[10px] font-black text-sky-600">
                            {record.usuario_id ? record.usuario_id.charAt(0).toUpperCase() : "?"}
                          </div>
                          <span className="font-bold text-xs text-slate-700">{record.usuario_id || "Desconocido"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-3">
                        <Badge variant="outline" className="font-mono text-[9px] bg-slate-50">
                          {record.tabla_afectada}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-3">
                        <Badge className={`text-[9px] font-black border ${TIPO_COLORES[record.tipo_operacion]}`}>
                          {TIPO_LABELS[record.tipo_operacion]}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-3 text-xs text-slate-600 max-w-xs truncate">
                        {record.descripcion || "—"}
                      </TableCell>
                      <TableCell className="px-6 py-3">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {format(new Date(record.fecha_cambio), "dd MMM HH:mm", { locale: es })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-3 text-center">
                        {(record.datos_anteriores || record.datos_nuevos) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setExpandedId(expandedId === record.id ? null : record.id)
                            }
                            className="h-8 w-8 text-slate-400 hover:text-slate-700"
                          >
                            {expandedId === record.id ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>

                    {expandedId === record.id && (record.datos_anteriores || record.datos_nuevos) && (
                      <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                        <TableCell colSpan={7} className="px-6 py-4">
                          {formatDifference(
                            parseJSON(record.datos_anteriores),
                            parseJSON(record.datos_nuevos)
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        {pages > 1 && !loading && (
          <div className="p-6 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500 font-bold">
              Página {page} de {pages} ({total} registros)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="h-8"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(pages, page + 1))}
                disabled={page === pages}
                className="h-8"
              >
                Siguiente <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
