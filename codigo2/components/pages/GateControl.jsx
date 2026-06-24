import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Plus, Trash2, LogIn, LogOut, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const statusLabels = { pending: 'Pendente', authorized: 'Autorizada', entered: 'Entrou', exited: 'Saiu', denied: 'Negada' };
const statusColors = { pending: 'bg-amber-500', authorized: 'bg-blue-500', entered: 'bg-emerald-500', exited: 'bg-gray-400', denied: 'bg-red-500' };

const emptyForm = { visitor_name: '', visitor_document: '', unit_number: '', purpose: '', vehicle_plate: '', authorized_by: '', notes: '' };

export default function GateControl() {
  useRealtimeSync('GateEntry', ['gateentries']);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [activeTab, setActiveTab] = useState('all');
  const queryClient = useQueryClient();

  const { data: entries = [] } = useQuery({ queryKey: ['gateentries'], queryFn: () => base44.entities.GateEntry.list('-created_date', 100) });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.GateEntry.create({ ...data, status: 'authorized' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gateentries'] }); setShowDialog(false); setForm(emptyForm); toast.success('Visitante registrado'); }
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.GateEntry.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gateentries'] }); toast.success('Atualizado'); }
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GateEntry.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gateentries'] }); toast.success('Registro removido'); }
  });

  const handleSubmit = (e) => { e.preventDefault(); createMutation.mutate(form); };
  const handleEntry = (item) => updateMutation.mutate({ id: item.id, data: { ...item, status: 'entered', entry_time: new Date().toISOString() } });
  const handleExit = (item) => updateMutation.mutate({ id: item.id, data: { ...item, status: 'exited', exit_time: new Date().toISOString() } });
  const handleDeny = (item) => updateMutation.mutate({ id: item.id, data: { ...item, status: 'denied' } });

  const filtered = activeTab === 'all' ? entries : entries.filter(e => e.status === activeTab);
  const counts = { pending: 0, authorized: 0, entered: 0, exited: 0, denied: 0 };
  entries.forEach(e => { if (counts[e.status] !== undefined) counts[e.status]++; });
  const insideCount = entries.filter(e => e.status === 'entered').length;

  return (
    <div>
      <PageHeader title="Portaria" description="Controle de acesso e visitantes">
        <Button onClick={() => setShowDialog(true)} className="gap-2"><Plus className="w-4 h-4" /> Registrar Visitante</Button>
      </PageHeader>

      {/* Live indicator */}
      <div className="flex items-center gap-2 mb-4 text-xs text-muted-foreground">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        Atualização em tempo real ativa
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="rounded-xl border border-white/10 bg-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center"><UserCheck className="w-5 h-5 text-emerald-600" /></div>
          <div><p className="text-lg font-bold leading-none">{insideCount}</p><p className="text-[11px] text-muted-foreground mt-0.5">No condomínio</p></div>
        </div>
        {['authorized', 'entered', 'exited'].map(key => (
          <div key={key} className={cn("rounded-xl border p-4 flex items-center gap-3 cursor-pointer transition-all hover:shadow-md bg-card border-white/10", activeTab === key && 'ring-2 ring-primary ring-offset-1')}
            onClick={() => setActiveTab(activeTab === key ? 'all' : key)}>
            <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", statusColors[key])} />
            <div><p className="text-lg font-bold leading-none">{counts[key]}</p><p className="text-[11px] text-muted-foreground mt-0.5">{statusLabels[key]}</p></div>
          </div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">Todos ({entries.length})</TabsTrigger>
          <TabsTrigger value="authorized">Autorizados</TabsTrigger>
          <TabsTrigger value="entered">No condomínio</TabsTrigger>
          <TabsTrigger value="exited">Saíram</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <EmptyState icon={Shield} title="Nenhum registro" description="Registre visitantes na portaria" actionLabel="Registrar Visitante" onAction={() => setShowDialog(true)} />
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <div key={item.id} className="glass-card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className={cn("w-1 self-stretch rounded-full shrink-0", statusColors[item.status] || 'bg-gray-400')} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-sm">{item.visitor_name}</h3>
                        <StatusBadge status={item.status} customLabel={statusLabels[item.status]} />
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>🏠 Unid. {item.unit_number}</span>
                        {item.visitor_document && <span>📄 {item.visitor_document}</span>}
                        {item.purpose && <span>📋 {item.purpose}</span>}
                        {item.vehicle_plate && <span className="font-mono">🚗 {item.vehicle_plate}</span>}
                        {item.authorized_by && <span>✅ Por: {item.authorized_by}</span>}
                      </div>
                      {item.entry_time && <p className="text-[11px] text-emerald-600 mt-1">Entrada: {format(new Date(item.entry_time), "dd/MM/yyyy 'às' HH:mm")}</p>}
                      {item.exit_time && <p className="text-[11px] text-gray-500 mt-0.5">Saída: {format(new Date(item.exit_time), "dd/MM/yyyy 'às' HH:mm")}</p>}
                      {item.notes && <p className="text-xs text-muted-foreground mt-1 italic">{item.notes}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {item.status === 'authorized' && (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleEntry(item)}>
                          <LogIn className="w-3 h-3" /> Registrar Entrada
                        </Button>
                      )}
                      {item.status === 'entered' && (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-gray-600 border-gray-200 hover:bg-gray-50" onClick={() => handleExit(item)}>
                          <LogOut className="w-3 h-3" /> Registrar Saída
                        </Button>
                      )}
                      {(item.status === 'pending' || item.status === 'authorized') && (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDeny(item)}>
                          <UserX className="w-3 h-3" /> Negar
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={(v) => setShowDialog(v)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">Registrar Visitante</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Nome do Visitante *</Label><Input value={form.visitor_name} onChange={(e) => setForm({ ...form, visitor_name: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Unidade *</Label><Input value={form.unit_number} onChange={(e) => setForm({ ...form, unit_number: e.target.value })} placeholder="Ex: 101" required /></div>
              <div><Label>Documento</Label><Input value={form.visitor_document} onChange={(e) => setForm({ ...form, visitor_document: e.target.value })} placeholder="RG/CPF" /></div>
            </div>
            <div><Label>Motivo da visita</Label><Input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="Ex: Visita, serviço, entrega..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Placa do veículo</Label><Input value={form.vehicle_plate} onChange={(e) => setForm({ ...form, vehicle_plate: e.target.value })} className="font-mono uppercase" /></div>
              <div><Label>Autorizado por</Label><Input value={form.authorized_by} onChange={(e) => setForm({ ...form, authorized_by: e.target.value })} placeholder="Morador/Porteiro" /></div>
            </div>
            <div><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending}>Registrar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}