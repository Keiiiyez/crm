"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import * as React from "react"
// 1. Definimos la interfaz para que TypeScript acepte la prop 'data'
interface SalesChartProps {
  data: any[];
}

export function SalesChart({ data }: SalesChartProps) {
  // 2. Procesamos los datos reales para agruparlos por mes
  // Si 'data' está vacío, creamos un estado inicial vacío pero con estructura
  const chartData = React.useMemo(() => {
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const grouped = months.map(m => ({ month: m, total: 0 }));

    data.forEach(sale => {
      // Intentamos obtener el mes de la fecha de creación (createdAt)
      const date = sale.createdAt ? new Date(sale.createdAt) : new Date();
      const monthIndex = date.getMonth();
      // Usamos precioCierre que es el campo real de tu base
      grouped[monthIndex].total += Number(sale.precioCierre) || 0;
    });

    return grouped;
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis 
          dataKey="month" 
          stroke="#94a3b8" 
          fontSize={10} 
          tickLine={false} 
          axisLine={false} 
          fontWeight="bold"
        />
        <YAxis 
          stroke="#94a3b8" 
          fontSize={10} 
          tickLine={false} 
          axisLine={false} 
          tickFormatter={(value) => `${value}€`} 
          fontWeight="bold"
        />
        <Tooltip
          cursor={{ fill: '#f8fafc' }}
          contentStyle={{ 
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: 'none',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            fontSize: '12px'
          }}
          itemStyle={{ color: '#0891b2', fontWeight: '800' }}
          labelStyle={{ color: '#64748b', marginBottom: '4px', fontWeight: 'bold' }}
          formatter={(value: number) => [`${value.toFixed(2)} €`, "Ventas"]}
        />
        {/* Usamos el color cian para las barras */}
        <Bar 
          dataKey="total" 
          fill="#0891b2" 
          radius={[6, 6, 0, 0]} 
          barSize={35}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}