"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  Download, Users, User, Calendar, Loader2, 
  BarChart3, FileSpreadsheet, TrendingUp 
} from "lucide-react";
import { format, getMonth, getYear } from "date-fns";
import { es } from "date-fns/locale";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

// Lógica de protección y contexto
import { httpClient } from "@/lib/http-client";
import { useAuth } from "@/lib/auth-context";
import { ProtectedAuditRoute } from "@/components/protected-audit-route";

export default function ReportsPage() {
  return (
    <ProtectedAuditRoute>
      <ReportsContent />
    </ProtectedAuditRoute>
  );
}

function ReportsContent() {
  const { user } = useAuth();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(String(getMonth(new Date())));

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await httpClient("/api/ventas-reporte");
      if (res.ok) {
        const data = await res.json();
        setSales(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      toast.error("Error al generar el reporte de producción");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // 1. FILTRADO POR MES
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const date = new Date(sale.createdAt);
      return getMonth(date) === Number(selectedMonth) && getYear(date) === getYear(new Date());
    });
  }, [sales, selectedMonth]);

  // 2. AGRUPACIÓN JERÁRQUICA (Coordinador -> Asesor)
  const groupedData = useMemo(() => {
    const groups: any = {};
    filteredSales.forEach((sale) => {
      const coord = sale.coordinadorNombre || "Ventas Sin Coordinador";
      const asesor = sale.usuarioNombre || "Desconocido";

      if (!groups[coord]) groups[coord] = { total: 0, asesores: {} };
      if (!groups[coord].asesores[asesor]) groups[coord].asesores[asesor] = { total: 0, ventas: [] };

      groups[coord].total += Number(sale.precioCierre);
      groups[coord].asesores[asesor].total += Number(sale.precioCierre);
      groups[coord].asesores[asesor].ventas.push(sale);
    });
    return groups;
  }, [filteredSales]);

  // 3. EXPORTAR EXCEL ESTRUCTURADO
  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    const exportData: any[] = [];

    Object.entries(groupedData).forEach(([coord, data]: any) => {
      exportData.push({ Coordinador: `EQUIPO: ${coord}`, Total: `${data.total.toFixed(2)}€` });
      Object.entries(data.asesores).forEach(([asesor, aData]: any) => {
        aData.ventas.forEach((v: any) => {
          exportData.push({
            Coordinador: coord,
            Asesor: asesor,
            Cliente: v.clientName,
            DNI: v.clienteDni,
            Operador: v.operadorDestino,
            Importe: v.precioCierre,
            Fecha: format(new Date(v.createdAt), "dd/MM/yyyy")
          });
        });
      });
      exportData.push({}); 
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Producción");
    XLSX.writeFile(wb, `Reporte_Produccion_${format(new Date(2024, Number(selectedMonth)), "MMMM")}.xlsx`);
    toast.success("Excel generado correctamente");
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-slate-900" /></div>;

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-12 space-y-8">
      {/* Header Estilo Auditoría/Usuarios */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-5">
          <div className="h-14 w-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
            <BarChart3 className="h-7 w-7 text-slate-800" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">
              Informes <span className="text-slate-400 font-light">de</span> Producción
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-0.5">
              Rendimiento jerárquico por equipos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48 h-12 rounded-xl bg-white border-none shadow-sm font-bold text-xs uppercase tracking-wider">
              <Calendar className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Seleccionar Mes" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-2xl">
              {Array.from({ length: 12 }).map((_, i) => (
                <SelectItem key={i} value={String(i)} className="text-xs font-bold uppercase">
                  {format(new Date(2024, i, 1), "MMMM", { locale: es })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={handleExport} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 px-6 shadow-lg transition-all hover:-translate-y-1">
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Exportar Data
          </Button>
        </div>
      </div>

      {/* RENDERIZADO DE EQUIPOS */}
      <div className="max-w-[1600px] mx-auto space-y-10">
        {Object.entries(groupedData).map(([coordName, coordData]: any) => (
          <div key={coordName} className="space-y-6">
            <div className="flex items-center justify-between bg-white/50 p-4 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-tighter">Equipo {coordName}</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Coordinación Activa</p>
                </div>
              </div>
              <div className="text-right">
                <span className="block text-xl font-black text-slate-900">{coordData.total.toFixed(2)}€</span>
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Producción Bruta</span>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
              {Object.entries(coordData.asesores).map(([asesorName, asesorData]: any) => (
                <Card key={asesorName} className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white group hover:shadow-xl transition-all duration-300">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-50 py-4 px-8">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-white shadow-sm flex items-center justify-center border border-slate-100">
                          <User className="h-4 w-4 text-slate-600" />
                        </div>
                        <CardTitle className="text-xs font-black text-slate-700 uppercase tracking-tight">{asesorName}</CardTitle>
                      </div>
                      <Badge className="bg-slate-900 text-white border-none font-bold text-[10px] px-3">
                        {asesorData.total.toFixed(2)}€
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-none">
                          <TableHead className="text-[9px] uppercase font-black text-slate-400 px-8">Cliente</TableHead>
                          <TableHead className="text-[9px] uppercase font-black text-slate-400 text-center">Operador</TableHead>
                          <TableHead className="text-[9px] uppercase font-black text-slate-400 text-right px-8">Cierre</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {asesorData.ventas.map((v: any) => (
                          <TableRow key={v.id} className="hover:bg-slate-50/30 border-b border-slate-50 last:border-none">
                            <TableCell className="py-3 px-8 text-xs font-bold text-slate-600">{v.clientName}</TableCell>
                            <TableCell className="py-3 text-center">
                              <Badge variant="outline" className="text-[8px] font-black uppercase border-slate-200 text-slate-400">
                                {v.operadorDestino}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3 text-right px-8 text-xs font-black text-slate-900">{v.precioCierre}€</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredSales.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 max-w-[1600px] mx-auto">
          <TrendingUp className="h-12 w-12 text-slate-200 mb-4" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest text-center">
            Sin métricas de producción para <br /> {format(new Date(2024, Number(selectedMonth)), "MMMM", { locale: es })}
          </p>
        </div>
      )}
    </div>
  );
}