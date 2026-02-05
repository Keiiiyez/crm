// components/operator-sales-pie-chart.tsx
"use client"

import * as React from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

interface OperatorSalesPieChartProps {
  data: any[];
}

// Paleta de colores profesional para identificar operadoras
const COLORS = [
  "#06b6d4", // Cian (Principal)
  "#8b5cf6", // Violeta
  "#f97316", // Naranja
  "#10b981", // Esmeralda
  "#3b82f6", // Azul
  "#f43f5e", // Rosa/Rojo
  "#eab308", // Amarillo
  "#6366f1", // Indigo
];

export function OperatorSalesPieChart({ data }: OperatorSalesPieChartProps) {
  // Procesamos los datos reales agrupando por operadora
  const pieChartData = React.useMemo(() => {
    const salesByOperator: { [key: string]: number } = {};

    data.forEach(sale => {
      // Usamos los campos reales de tu BD: operadorDestino y precioCierre
      const operator = sale.operadorDestino || "Otras";
      const amount = Number(sale.precioCierre) || 0;

      // Filtramos para que el gráfico solo muestre ingresos potenciales o reales (no cancelados)
      if (sale.status !== 'Cancelada') { 
        salesByOperator[operator] = (salesByOperator[operator] || 0) + amount;
      }
    });

    return Object.keys(salesByOperator).map((operator, index) => ({
      name: operator,
      value: parseFloat(salesByOperator[operator].toFixed(2)),
      color: COLORS[index % COLORS.length], 
    })).sort((a, b) => b.value - a.value); // Ordenar de mayor a menor venta
  }, [data]);

  // Estado vacío profesional
  if (pieChartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <div className="h-16 w-16 rounded-full border-4 border-dashed border-slate-100 animate-spin-slow" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 italic">
          Sin métricas de operador
        </p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={pieChartData}
          cx="40%" // Desplazado a la izquierda para dejar espacio a la leyenda
          cy="50%"
          innerRadius={60} // Efecto Donut para mayor elegancia
          outerRadius={90} 
          paddingAngle={5}
          dataKey="value"
          nameKey="name"
          stroke="none"
        >
          {pieChartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color} 
              className="hover:opacity-80 transition-opacity cursor-pointer"
            />
          ))}
        </Pie>
        
        <Tooltip
          contentStyle={{ 
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: 'none',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            fontSize: '11px',
            padding: '12px'
          }}
          itemStyle={{ fontWeight: '800' }}
          formatter={(value: number) => [`${value.toLocaleString('es-ES')} €`, "Ventas"]}
        />
        
        <Legend 
          layout="vertical" 
          verticalAlign="middle" 
          align="right"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ 
            fontSize: '10px', 
            fontWeight: 'bold', 
            color: '#64748b',
            paddingLeft: '20px',
            textTransform: 'uppercase'
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}