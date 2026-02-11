"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Users, User, Calendar, Loader2 } from "lucide-react";
import { format, getMonth, getYear } from "date-fns";
import { es } from "date-fns/locale";
import * as XLSX from "xlsx";

export default function ReportsPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(String(getMonth(new Date())));

  useEffect(() => {
    fetch("/api/ventas-reporte") // Usa la ruta que creamos
      .then((res) => res.json())
      .then((data) => {
        setSales(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
      exportData.push({ Coordinador: `EQUIPO: ${coord}`, Total: `${data.total}€` });
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
      exportData.push({}); // Fila vacía de separación
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Reporte Mensual");
    XLSX.writeFile(wb, `Informe_${selectedMonth}_${getYear(new Date())}.xlsx`);
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      {/* HEADER Y FILTROS */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Informes de Producción</h1>
          <p className="text-slate-500 text-sm">Desglose por equipos y asesores</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-40 rounded-xl">
              <Calendar className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }).map((_, i) => (
                <SelectItem key={i} value={String(i)}>
                  {format(new Date(2024, i, 1), "MMMM", { locale: es })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md">
            <Download className="h-4 w-4 mr-2" /> Excel
          </Button>
        </div>
      </div>

      {/* RENDERIZADO DE EQUIPOS */}
      {Object.entries(groupedData).map(([coordName, coordData]: any) => (
        <div key={coordName} className="space-y-4">
          <div className="flex items-center gap-2 ml-2">
            <Users className="h-5 w-5 text-cyan-600" />
            <h2 className="text-lg font-bold text-slate-700">Coordinador: {coordName}</h2>
            <span className="bg-cyan-100 text-cyan-700 px-3 py-0.5 rounded-full text-sm font-bold ml-auto">
              Total Equipo: {coordData.total.toFixed(2)}€
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {Object.entries(coordData.asesores).map(([asesorName, asesorData]: any) => (
              <Card key={asesorName} className="border-none shadow-sm rounded-2xl overflow-hidden bg-white border border-slate-100">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400" />
                      <CardTitle className="text-sm font-bold text-slate-600">{asesorName}</CardTitle>
                    </div>
                    <span className="text-sm font-black text-slate-800">{asesorData.total.toFixed(2)}€</span>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-[10px] uppercase font-bold">Cliente</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold text-center">Operador</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {asesorData.ventas.map((v: any) => (
                        <TableRow key={v.id} className="hover:bg-slate-50/30">
                          <TableCell className="py-2 text-xs font-medium">{v.clientName}</TableCell>
                          <TableCell className="py-2 text-center">
                            <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-bold uppercase">{v.operadorDestino}</span>
                          </TableCell>
                          <TableCell className="py-2 text-right text-xs font-bold">{v.precioCierre}€</TableCell>
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
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
          <p className="text-slate-400">No hay ventas registradas en este mes.</p>
        </div>
      )}
    </div>
  );
}