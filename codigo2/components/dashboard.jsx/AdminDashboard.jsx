import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Building2, DollarSign, AlertTriangle, Megaphone, CalendarDays, TrendingUp, Wrench, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import GlassStatCard from '@/components/dashboard/GlassStatCard';
import StatusBadge from '@/components/shared/StatusBadge';
import ExpenseChart from '@/components/dashboard/ExpenseChart';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

const categoryLabels = {
  complaint: 'Reclamação', maintenance: 'Manutenção', suggestion: 'Sugestão',
  noise: 'Barulho', parking: 'Estacionamento', security: 'Segurança', other: 'Outro',
  general: 'Geral', meeting: 'Reunião', event: 'Evento', rule: 'Regulamento', emergency: 'Emergência'
};
const areaLabels = {
  party_room: 'Salão de Festas', bbq: 'Churrasqueira', pool: 'Piscina',
  gym: 'Academia', playground: 'Playground', meeting_room: 'Sala de Reunião', other: 'Outro'
};

export default function AdminDashboard() {
  useRealtimeSync('Maintenance', ['maintenances-dashboard']);
  useRealtimeSync('Occurrence', ['occurrences-dashboard']);

  const { data: units = [] } = useQuery({ queryKey: ['units'], queryFn: () => base44.entities.Unit.list() });
  const { data: finances = [] } = useQuery({ queryKey: ['finances'], queryFn: () => base44.entities.FinancialRecord.list('-created_date', 50) });
  const { data: occurrences = [] } = useQuery({ queryKey: ['occurrences'], queryFn: () => base44.entities.Occurrence.list('-created_date', 5) });
  const { data: notices = [] } = useQuery({ queryKey: ['notices'], queryFn: () => base44.entities.Notice.list('-created_date', 3) });
  const { data: reservations = [] } = useQuery({ queryKey: ['reservations'], queryFn: () => base44.entities.Reservation.list('-created_date', 5) });
  const { data: maintenances = [] } = useQuery({ queryKey: ['maintenances'], queryFn: () => base44.entities.Maintenance.list('-created_date', 5) });

  const totalIncome = finances.filter(f => f.type === 'income').reduce((s, f) => s + (f.amount || 0), 0);
  const totalExpense = finances.filter(f => f.type === 'expense').reduce((s, f) => s + (f.amount || 0), 0);
  const openOccurrences = occurrences.filter(o => o.status === 'open' || o.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-white">Painel Administrativo</h1>
        <p className="text-white/50 mt-1">Visão geral do condomínio</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassStatCard title="Unidades" value={units.length} icon={Building2} subtitle={`${units.filter(u => u.status === 'occupied').length} ocupadas`} accent="cyan" />
        <GlassStatCard title="Receitas" value={`R$ ${totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={TrendingUp} accent="emerald" />
        <GlassStatCard title="Despesas" value={`R$ ${totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={DollarSign} accent="amber" />
        <GlassStatCard title="Ocorrências Abertas" value={openOccurrences} icon={AlertTriangle} accent="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Chart */}
        <div className="glass-card lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-cyan-400" />
              <h2 className="font-display font-semibold text-sm text-white">Despesas por Categoria</h2>
            </div>
            <Link to="/finances" className="text-xs text-cyan-400 hover:underline font-medium">Ver financeiro</Link>
          </div>
          <div className="px-4 py-4">
            <ExpenseChart finances={finances} />
          </div>
        </div>

        {/* Maintenances */}
        <div className="glass-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-cyan-400" />
              <h2 className="font-display font-semibold text-sm text-white">Manutenções</h2>
            </div>
            <Link to="/maintenances" className="text-xs text-cyan-400 hover:underline font-medium">Ver todas</Link>
          </div>
          <div className="px-5 py-4 flex gap-4">
            <div className="flex-1 text-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-red-400">{maintenances.filter(m => m.status === 'not_started').length}</p>
              <p className="text-[11px] text-white/40">Não Iniciadas</p>
            </div>
            <div className="flex-1 text-center">
              <div className="w-3 h-3 rounded-full bg-amber-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-amber-400">{maintenances.filter(m => m.status === 'in_progress').length}</p>
              <p className="text-[11px] text-white/40">Em Andamento</p>
            </div>
            <div className="flex-1 text-center">
              <div className="w-3 h-3 rounded-full bg-emerald-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-emerald-400">{maintenances.filter(m => m.status === 'done').length}</p>
              <p className="text-[11px] text-white/40">Concluídas</p>
            </div>
          </div>
        </div>

        {/* Notices */}
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-cyan-400" />
              <h2 className="font-display font-semibold text-sm text-white">Últimos Avisos</h2>
            </div>
            <Link to="/notices" className="text-xs text-cyan-400 hover:underline font-medium">Ver todos</Link>
          </div>
          <div className="divide-y divide-white/5">
            {notices.length === 0 ? (
              <p className="px-5 py-8 text-sm text-white/40 text-center">Nenhum aviso</p>
            ) : notices.map(notice => (
              <div key={notice.id} className="px-5 py-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-white">{notice.title}</p>
                    <p className="text-xs text-white/50 mt-0.5 line-clamp-1">{notice.content}</p>
                  </div>
                  <StatusBadge status={notice.priority} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Occurrences */}
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-cyan-400" />
              <h2 className="font-display font-semibold text-sm text-white">Ocorrências</h2>
            </div>
            <Link to="/occurrences" className="text-xs text-cyan-400 hover:underline font-medium">Ver todas</Link>
          </div>
          <div className="divide-y divide-white/5">
            {occurrences.length === 0 ? (
              <p className="px-5 py-8 text-sm text-white/40 text-center">Nenhuma ocorrência</p>
            ) : occurrences.map(occ => (
              <div key={occ.id} className="px-5 py-3.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-white">{occ.title}</p>
                    <p className="text-xs text-white/50 mt-0.5">{categoryLabels[occ.category] || occ.category}</p>
                  </div>
                  <StatusBadge status={occ.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reservations */}
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-cyan-400" />
              <h2 className="font-display font-semibold text-sm text-white">Próximas Reservas</h2>
            </div>
            <Link to="/reservations" className="text-xs text-cyan-400 hover:underline font-medium">Ver todas</Link>
          </div>
          <div className="divide-y divide-white/5">
            {reservations.length === 0 ? (
              <p className="px-5 py-8 text-sm text-white/40 text-center">Nenhuma reserva</p>
            ) : reservations.map(res => (
              <div key={res.id} className="px-5 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{areaLabels[res.area] || res.area}</p>
                  <p className="text-xs text-white/50 mt-0.5">{res.date && format(new Date(res.date), 'dd/MM/yyyy')} • {res.start_time}</p>
                </div>
                <StatusBadge status={res.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}