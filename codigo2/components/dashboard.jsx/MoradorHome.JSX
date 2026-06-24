import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { Megaphone, CalendarDays, Package, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import StatusBadge from '@/components/shared/StatusBadge';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { cn } from '@/lib/utils';

const areaLabels = {
  party_room: 'Salão de Festas', bbq: 'Churrasqueira', pool: 'Piscina',
  gym: 'Academia', playground: 'Playground', meeting_room: 'Sala de Reunião', other: 'Outro'
};

const actionColors = {
  cyan: 'text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-400/20',
  blue: 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border-blue-400/20',
  amber: 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border-amber-400/20',
  purple: 'text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border-purple-400/20',
};

export default function MoradorHome() {
  const { user } = useAuth();
  useRealtimeSync('Notice', ['notices-morador']);
  useRealtimeSync('Delivery', ['deliveries-morador']);

  const { data: notices = [] } = useQuery({ queryKey: ['notices'], queryFn: () => base44.entities.Notice.list('-created_date', 3) });
  const { data: reservations = [] } = useQuery({ queryKey: ['reservations'], queryFn: () => base44.entities.Reservation.list('-created_date', 3) });
  const { data: deliveries = [] } = useQuery({ queryKey: ['deliveries'], queryFn: () => base44.entities.Delivery.list('-created_date', 3) });

  const quickActions = [
    { label: 'Reservar Área', icon: CalendarDays, path: '/reservations', color: 'cyan' },
    { label: 'Ver Avisos', icon: Megaphone, path: '/notices', color: 'blue' },
    { label: 'Ocorrência', icon: AlertTriangle, path: '/occurrences', color: 'amber' },
    { label: 'Entregas', icon: Package, path: '/deliveries', color: 'purple' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="glass-card p-6 glow-cyan">
        <h1 className="text-2xl font-bold font-display text-white">
          Olá, {user?.full_name?.split(' ')[0] || 'Morador'} 👋
        </h1>
        <p className="text-white/60 mt-1">Bem-vindo ao seu condomínio</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map(action => {
          const Icon = action.icon;
          return (
            <Link key={action.path} to={action.path}
              className={cn("glass-card glass-hover p-5 flex flex-col items-center text-center gap-3 border", actionColors[action.color])}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center">
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-white">{action.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Recent Notices */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-cyan-400" />
            <h2 className="font-display font-semibold text-sm text-white">Avisos Recentes</h2>
          </div>
          <Link to="/notices" className="text-xs text-cyan-400 hover:underline font-medium flex items-center gap-1">
            Ver todos <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-white/5">
          {notices.length === 0 ? (
            <p className="px-5 py-8 text-sm text-white/40 text-center">Nenhum aviso publicado</p>
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

      {/* Reservations + Deliveries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-cyan-400" />
              <h2 className="font-display font-semibold text-sm text-white">Minhas Reservas</h2>
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

        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-cyan-400" />
              <h2 className="font-display font-semibold text-sm text-white">Minhas Encomendas</h2>
            </div>
            <Link to="/deliveries" className="text-xs text-cyan-400 hover:underline font-medium">Ver todas</Link>
          </div>
          <div className="divide-y divide-white/5">
            {deliveries.length === 0 ? (
              <p className="px-5 py-8 text-sm text-white/40 text-center">Nenhuma encomenda</p>
            ) : deliveries.map(del => (
              <div key={del.id} className="px-5 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{del.recipient_name}</p>
                  <p className="text-xs text-white/50 mt-0.5">Unid. {del.unit_number}</p>
                </div>
                <StatusBadge status={del.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}