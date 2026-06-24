import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusStyles = {
  // Financial
  pending: { label: 'Pendente', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  paid: { label: 'Pago', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  overdue: { label: 'Vencido', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  cancelled: { label: 'Cancelado', className: 'bg-white/5 text-white/40 border-white/10' },
  // Occurrences
  open: { label: 'Aberta', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  in_progress: { label: 'Em Andamento', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  resolved: { label: 'Resolvida', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  closed: { label: 'Fechada', className: 'bg-white/5 text-white/40 border-white/10' },
  // Reservations
  approved: { label: 'Aprovada', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  rejected: { label: 'Rejeitada', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  // Units
  occupied: { label: 'Ocupada', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  vacant: { label: 'Vaga', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  rented: { label: 'Alugada', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  // Priority
  low: { label: 'Baixa', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  medium: { label: 'Média', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  high: { label: 'Alta', className: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  urgent: { label: 'Urgente', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  // Notices
  normal: { label: 'Normal', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  important: { label: 'Importante', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  // Work Orders
  open_os: { label: 'Aberta', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  assigned: { label: 'Atribuída', className: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  completed: { label: 'Concluída', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  // Deliveries
  received: { label: 'Recebida', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  picked_up: { label: 'Retirada', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  returned: { label: 'Devolvida', className: 'bg-white/5 text-white/40 border-white/10' },
  // Gate Entries
  authorized: { label: 'Autorizada', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  entered: { label: 'Entrou', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  exited: { label: 'Saiu', className: 'bg-white/5 text-white/40 border-white/10' },
  denied: { label: 'Negada', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

export default function StatusBadge({ status, customLabel }) {
  const config = statusStyles[status] || { label: status, className: 'bg-white/5 text-white/40 border-white/10' };

  return (
    <Badge variant="outline" className={cn("text-[11px] font-medium border", config.className)}>
      {customLabel || config.label}
    </Badge>
  );
}