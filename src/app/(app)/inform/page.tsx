"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  Users, User, Calendar, Loader2, 
  BarChart3, FileSpreadsheet, TrendingUp 
} from "lucide-react";
import { format, getMonth, getYear } from "date-fns";
import { es } from "date-fns/locale";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

import { httpClient } from "@/lib/http-client";
import { ProtectedAuditRoute } from "@/components/protected-audit-route";

export default function ReportsPage() {
  return (
    <ProtectedAuditRoute>
      <ReportsContent />
    </ProtectedAuditRoute>
  );
}

function ReportsContent() {
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
      toast.error("Error al cargar la producción");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadReports(); }, [loadReports]);

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const date = new Date(sale.createdAt);
      return getMonth(date) === Number(selectedMonth) && getYear(date) === getYear(new Date());
    });
  }, [sales, selectedMonth]);

  const groupedData = useMemo(() => {
    const groups: any = {};
    filteredSales.forEach((sale) => {
      const coord = sale.coordinadorNombre || "SIN COORDINADOR";
      const asesor = sale.usuarioNombre || "Desconocido";
      if (!groups[coord]) groups[coord] = { total: 0, asesores: {} };
      if (!groups[coord].asesores[asesor]) groups[coord].asesores[asesor] = { total: 0, ventas: [] };
      const monto = Number(sale.precioCierre) || 0;
      groups[coord].total += monto;
      groups[coord].asesores[asesor].total += monto;
      groups[coord].asesores[asesor].ventas.push(sale);
    });
    return groups;
  }, [filteredSales]);

  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    const exportData: any[] = [];

    Object.entries(groupedData).forEach(([coordName, coordData]: any) => {
      exportData.push({ "EQUIPO": `>> EQUIPO: ${coordName.toUpperCase()} <<`, "IMPORTE": `TOTAL: ${coordData.total.toFixed(2)}€` });
      exportData.push({ "FECHA": "FECHA", "ASESOR": "ASESOR", "CLIENTE": "CLIENTE", "DNI": "DNI", "OPERADOR": "OPERADOR", "IMPORTE": "IMPORTE" });

      Object.entries(coordData.asesores).forEach(([asesorName, asesorData]: any) => {
        asesorData.ventas.forEach((v: any) => {
          exportData.push({
            "FECHA": format(new Date(v.createdAt), "dd/MM/yyyy"),
            "ASESOR": asesorName,
            "CLIENTE": v.clientName,
            "DNI": v.clienteDni,
            "OPERADOR": v.operadorDestino,
            "IMPORTE": `${v.precioCierre}€`
          });
        });
      });
      exportData.push({}); 
      exportData.push({}); 
    });

    const ws = XLSX.utils.json_to_sheet(exportData, { skipHeader: true });
    XLSX.utils.book_append_sheet(wb, ws, "Producción");
    XLSX.writeFile(wb, `Reporte_Produccion_${selectedMonth}.xlsx`);
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-white"><Loader2 className="animate-spin h-10 w-10 text-slate-900" /></div>;

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 lg:p-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-5">
          <div className="h-14 w-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
            <BarChart3 className="h-7 w-7 text-slate-800" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Informes <span className="text-slate-400 font-light">de</span> Producción</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-0.5">Rendimiento jerárquico por equipos</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-48 h-12 rounded-xl bg-white border-none shadow-sm font-black text-xs uppercase tracking-wider">
              <Calendar className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-2xl">
              {Array.from({ length: 12 }).map((_, i) => (
                <SelectItem key={i} value={String(i)} className="text-xs font-black uppercase tracking-tight">
                  {format(new Date(2026, i, 1), "MMMM", { locale: es })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleExport} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 px-6 shadow-lg font-black text-xs uppercase tracking-widest">
            <FileSpreadsheet className="h-4 w-4 mr-2" /> Exportar Data
          </Button>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="max-w-[1600px] mx-auto space-y-14">
        {Object.entries(groupedData).map(([coordName, coordData]: any) => (
          <div key={coordName} className="space-y-6">
            {/* Banner Coordinador */}
            <div className="flex items-center justify-between bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-slate-900 rounded-[1.2rem] flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Equipo {coordName}</h2>
                  <div className="flex gap-2 mt-1">
                    <Badge className="bg-emerald-500 text-white border-none text-[8px] font-black tracking-widest px-2 uppercase">Producción Activa</Badge>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Equipo</p>
                <span className="text-4xl font-black text-slate-900 tracking-tighter">{coordData.total.toFixed(2)}€</span>
              </div>
            </div>

            {/* Asesores */}
            <div className="grid gap-6 md:grid-cols-2">
              {Object.entries(coordData.asesores).map(([asesorName, asesorData]: any) => (
                <Card key={asesorName} className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white group hover:shadow-xl transition-all duration-300">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-50 py-5 px-8">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                          <User className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-tight">{asesorName}</CardTitle>
                      </div>
                      <Badge className="bg-slate-900 text-white border-none font-black text-[11px] px-4 py-1.5 rounded-full">
                        {asesorData.total.toFixed(2)}€
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-none">
                          <TableHead className="text-[9px] uppercase font-black text-slate-300 px-10 h-10">Cliente / Operador</TableHead>
                          <TableHead className="text-[9px] uppercase font-black text-slate-300 text-right px-10 h-10">Cierre</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {asesorData.ventas.map((v: any) => (
                          <TableRow key={v.id} className="hover:bg-slate-50/50 border-b border-slate-50 last:border-none">
                            <TableCell className="py-4 px-10">
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{v.clientName}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{v.operadorDestino}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-4 text-right px-10">
                              <span className="text-xs font-black text-slate-900 tracking-tight">{v.precioCierre}€</span>
                            </TableCell>
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

        {filteredSales.length === 0 && (
          <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 max-w-[1600px] mx-auto">
            <TrendingUp className="h-16 w-16 text-slate-100 mb-4" />
            <p className="text-xs font-black text-slate-300 uppercase tracking-[0.4em] text-center leading-loose">Sin métricas registradas</p>
          </div>
        )}
      </div>
    </div>
  );
}