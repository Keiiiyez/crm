"use client"

import * as React from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

export function StatusPieChart({ data }: { data: any[] }) {
  const chartData = React.useMemo(() => {
    const counts = {
      Tramitada: { val: 0, color: "#10b981" },
      Pendiente: { val: 0, color: "#06b6d4" },
      Cancelada: { val: 0, color: "#ef4444" }
    };

    data.forEach(s => {
      const status = (s.status || "Pendiente") as keyof typeof counts;
      if (counts[status]) counts[status].val++;
    });

    return Object.entries(counts).map(([name, info]) => ({
      name, value: info.val, fill: info.color
    })).filter(d => d.value > 0);
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie 
          data={chartData} 
          innerRadius={60} 
          outerRadius={80} 
          paddingAngle={5} 
          dataKey="value"
        
          cornerRadius={6} 
          stroke="none"
        >
          {chartData.map((entry, i) => (
            <Cell 
              key={`cell-${i}`} 
              fill={entry.fill} 
             
            />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            borderRadius: '12px', 
            border: 'none', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
            fontSize: '11px' 
          }}
        />
        <Legend 
          verticalAlign="bottom" 
          wrapperStyle={{ 
            fontSize: '10px', 
            fontWeight: 'bold', 
            textTransform: 'uppercase', 
            paddingTop: '10px' 
          }} 
        />
      </PieChart>
    </ResponsiveContainer>
  )
}