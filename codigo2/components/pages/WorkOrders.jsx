import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Plus, Pencil, Trash2 } from 'lucide-react';
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

const typeLabels = { maintenance: 'Manutenção', repair: 'Reparo', cleaning: 'Limpeza', inspection: 'Inspeção', installation: 'Instalação', other: 'Outro' };
const statusLabels = { open: 'Aberta', assigned: 'Atribuída', in_progress: 'Em Andamento', completed: 'Concluída', cancelled: 'Cancelada' };
const statusColors = { open: 'bg-blue-500', assigned: 'bg-purple-500', in_progress: 'bg-amber-500', completed: 'bg-emerald-500', cancelled: 'bg-gray-400' };

const emptyForm = { title: '', description: '', type: 'maintenance', status: 'open', priority: 'medium', assigned_to: '', unit_number: '', estimated_cost: '', actual_cost: '', due_date: '', notes: '' };

export default function WorkOrders() {
  useRealtimeSync('WorkOrder', ['workorders']);
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [activeTab, setActiveTab] = useState('all');
  const queryClient = useQueryClient();

  const { data: workorders = [] } = useQuery({ queryKey: ['workorders'], queryFn: () => base44.entities.WorkOrder.list('-created_date', 100) });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkOrder.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['workorders'] }); closeDialog(); toast.success('Ordem de serviço criada'); }
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WorkOrder.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['workorders'] }); closeDialog(); toast.success('Ordem de serviço atualizada'); }
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WorkOrder.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['workorders'] }); toast.success('Ordem de serviço removida'); }
  });

  const closeDialog = () => { setShowDialog(false); setEditingItem(null); setForm(emptyForm); };
  const handleEdit = (item) => { setEditingItem(item); setForm({ ...emptyForm, ...item, estimated_cost: String(item.estimated_cost || ''), actual_cost: String(item.actual_cost || '') }); setShowDialog(true); };
  const handleSubmit = (e) => { e.preventDefault(); const data = { ...form, estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : undefined, actual_cost: form.actual_cost ? Number(form.actual_cost) : undefined }; if (editingItem) updateMutation.mutate({ id: editingItem.id, data }); else createMutation.mutate(data); };
  const handleStatusChange = (item, newStatus) => updateMutation.mutate({ id: item.id, data: { ...item, status: newStatus } });

  const filtered = activeTab === 'all' ? workorders : workorders.filter(w => w.status === activeTab);
  const counts = { open: 0, assigned: 0, in_progress: 0, completed: 0, cancelled: 0 };
  workorders.forEach(w => { if (counts[w.status] !== undefined) counts[w.status]++; });

  return (
    <div>
      <PageHeader title="Ordens de Serviço" description="Controle de serviços do condomínio">
        <Button onClick={() => setShowDialog(true)} className="gap-2"><Plus className="w-4 h-4" /> Nova OS</Button>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
        {Object.entries(statusLabels).map(([key, label]) => (
          <div key={key} className={cn("rounded-xl border p-3 flex items-center gap-2 cursor-pointer transition-all hover:shadow-md", activeTab === key ? 'ring-2 ring-primary ring-offset-1' : '', 'bg-card border-white/10')}
            onClick={() => setActiveTab(activeTab === key ? 'all' : key)}>
            <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", statusColors[key])} />
            <div><p className="text-lg font-bold leading-none">{counts[key]}</p><p className="text-[11px] text-muted-foreground mt-0.5">{label}</p></div>
          </div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">Todas ({workorders.length})</TabsTrigger>
          <TabsTrigger value="open">Abertas</TabsTrigger>
          <TabsTrigger value="in_progress">Em Andamento</TabsTrigger>
          <TabsTrigger value="completed">Concluídas</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Nenhuma ordem de serviço" description="Crie ordens de serviço para o condomínio" actionLabel="Nova OS" onAction={() => setShowDialog(true)} />
      ) : (
        <div className="space-y-3">
          {filtered.map(item => (
            <div key={item.id} className="glass-card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className={cn("w-1 self-stretch rounded-full shrink-0", statusColors[item.status] || 'bg-gray-400')} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-sm">{item.title}</h3>
                        <StatusBadge status={item.status} customLabel={statusLabels[item.status]} />
                        <StatusBadge status={item.priority} />
                      </div>
                      {item.description && <p className="text-xs text-muted-foreground mb-2">{item.description}</p>}
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span>{typeLabels[item.type] || item.type}</span>
                        {item.assigned_to && <span>👤 {item.assigned_to}</span>}
                        {item.unit_number && <span>🏠 Unid. {item.unit_number}</span>}
                        {item.due_date && <span>📅 {format(new Date(item.due_date), 'dd/MM/yyyy')}</span>}
                        {item.estimated_cost && <span>💰 Est: R$ {Number(item.estimated_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
                        {item.actual_cost && <span>✅ Real: R$ {Number(item.actual_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                  {item.status !== 'completed' && item.status !== 'cancelled' && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/10">
                      <span className="text-xs text-muted-foreground self-center">Mudar status:</span>
                      {item.status !== 'assigned' && <button onClick={() => handleStatusChange(item, 'assigned')} className="text-xs px-2 py-1 rounded-full bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100">Atribuir</button>}
                      {item.status !== 'in_progress' && <button onClick={() => handleStatusChange(item, 'in_progress')} className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100">Iniciar</button>}
                      <button onClick={() => handleStatusChange(item, 'completed')} className="text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100">Concluir</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={(v) => { if (!v) closeDialog(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">{editingItem ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Tipo *</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Prioridade</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Baixa</SelectItem><SelectItem value="medium">Média</SelectItem><SelectItem value="high">Alta</SelectItem><SelectItem value="urgent">Urgente</SelectItem></SelectContent>
                </Select></div>
              <div><Label>Responsável</Label><Input value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} placeholder="Empresa / pessoa" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Unidade</Label><Input value={form.unit_number} onChange={(e) => setForm({ ...form, unit_number: e.target.value })} placeholder="Ex: 101" /></div>
              <div><Label>Prazo</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Custo Estimado (R$)</Label><Input type="number" step="0.01" value={form.estimated_cost} onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })} /></div>
              <div><Label>Custo Real (R$)</Label><Input type="number" step="0.01" value={form.actual_cost} onChange={(e) => setForm({ ...form, actual_cost: e.target.value })} /></div>
            </div>
            <div><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{editingItem ? 'Salvar' : 'Criar'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}