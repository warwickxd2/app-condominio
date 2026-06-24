import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

const categoryLabels = {
  condo_fee: 'Taxa Cond.', water: 'Água', gas: 'Gás', maintenance: 'Manutenção',
  cleaning: 'Limpeza', security: 'Segurança', elevator: 'Elevador', garden: 'Jardinagem',
  salary: 'Salários', insurance: 'Seguro', other: 'Outro'
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-lg px-3 py-2 shadow-lg text-xs">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: R$ {p.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ExpenseChart({ finances }) {
  // Group by category
  const expensesByCategory = {};
  finances.filter(f => f.type === 'expense').forEach(f => {
    const cat = categoryLabels[f.category] || f.category;
    expensesByCategory[cat] = (expensesByCategory[cat] || 0) + (f.amount || 0);
  });

  const data = Object.entries(expensesByCategory)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        Nenhuma despesa registrada
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
        <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" name="Despesa" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}