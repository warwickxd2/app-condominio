import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wrench, Plus, Pencil, Trash2, CheckCircle2, Clock, Circle } from 'lucide-react';
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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const categoryLabels = {
  elevator: 'Elevador', electrical: 'Elétrica', hydraulic: 'Hidráulica',
  structural: 'Estrutural', painting: 'Pintura', garden: 'Jardinagem',
  pool: 'Piscina', security: 'Segurança', cleaning: 'Limpeza', other: 'Outro'
};

const statusConfig = {
  not_started: {
    label: 'Não Iniciada',
    color: 'bg-red-500',
    lightColor: 'bg-red-50 border-red-200',
    textColor: 'text-red-700',
    icon: Circle,
    dot: 'bg-red-500'
  },
  in_progress: {
    label: 'Em Andamento',
    color: 'bg-amber-500',
    lightColor: 'bg-amber-50 border-amber-200',
    textColor: 'text-amber-700',
    icon: Clock,
    dot: 'bg-amber-500'
  },
  done: {
    label: 'Concluída',
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-50 border-emerald-200',
    textColor: 'text-emerald-700',
    icon: CheckCircle2,
    dot: 'bg-emerald-500'
  }
};

const emptyForm = {
  title: '', description: '', category: 'other', status: 'not_started',
  priority: 'medium', responsible: '', start_date: '', end_date: '',
  cost: '', notes: '', completion_report: ''
};

export default function Maintenances() {
  const [showDialog, setShowDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [reportItem, setReportItem] = useState(null);
  const [reportText, setReportText] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [activeTab, setActiveTab] = useState('all');
  const queryClient = useQueryClient();

  const { data: maintenances = [], isLoading } = useQuery({
    queryKey: ['maintenances'],
    queryFn: () => base44.entities.Maintenance.list('-created_date', 100)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Maintenance.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['maintenances'] }); closeDialog(); toast.success('Manutenção criada'); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Maintenance.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['maintenances'] }); closeDialog(); setShowReportDialog(false); toast.success('Manutenção atualizada'); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Maintenance.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['maintenances'] }); toast.success('Manutenção removida'); }
  });

  const closeDialog = () => { setShowDialog(false); setEditingItem(null); setForm(emptyForm); };

  const handleEdit = (item) => {
    setEditingItem(item);
    setForm({ ...emptyForm, ...item, cost: String(item.cost || '') });
    setShowDialog(true);
  };

  const handleReport = (item) => {
    setReportItem(item);
    setReportText(item.completion_report || '');
    setShowReportDialog(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form, cost: form.cost ? Number(form.cost) : undefined };
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleSaveReport = () => {
    updateMutation.mutate({ id: reportItem.id, data: { ...reportItem, completion_report: reportText, status: 'done' } });
  };

  const handleStatusChange = (item, newStatus) => {
    updateMutation.mutate({ id: item.id, data: { ...item, status: newStatus } });
  };

  const filtered = activeTab === 'all' ? maintenances : maintenances.filter(m => m.status === activeTab);

  const counts = {
    not_started: maintenances.filter(m => m.status === 'not_started').length,
    in_progress: maintenances.filter(m => m.status === 'in_progress').length,
    done: maintenances.filter(m => m.status === 'done').length,
  };

  return (
    <div>
      <PageHeader title="Manutenções" description="Controle de manutenções do condomínio">
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Nova Manutenção
        </Button>
      </PageHeader>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {Object.entries(statusConfig).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div key={key} className={cn("rounded-xl border p-4 flex items-center gap-3 cursor-pointer transition-all hover:shadow-md", cfg.lightColor, activeTab === key && 'ring-2 ring-offset-1')}
              onClick={() => setActiveTab(activeTab === key ? 'all' : key)}>
              <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", cfg.dot)} />
              <div>
                <p className={cn("text-lg font-bold", cfg.textColor)}>{counts[key]}</p>
                <p className={cn("text-xs font-medium", cfg.textColor)}>{cfg.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">Todas ({maintenances.length})</TabsTrigger>
          <TabsTrigger value="not_started">Não Iniciadas</TabsTrigger>
          <TabsTrigger value="in_progress">Em Andamento</TabsTrigger>
          <TabsTrigger value="done">Concluídas</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 && !isLoading ? (
        <EmptyState icon={Wrench} title="Nenhuma manutenção" description="Registre manutenções do condomínio" actionLabel="Nova Manutenção" onAction={() => setShowDialog(true)} />
      ) : (
        <div className="space-y-3">
          {filtered.map(item => {
            const cfg = statusConfig[item.status] || statusConfig.not_started;
            const Icon = cfg.icon;
            return (
              <div key={item.id} className="glass-card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Status indicator bar */}
                  <div className={cn("w-1 self-stretch rounded-full shrink-0", cfg.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-sm">{item.title}</h3>
                          <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border", cfg.lightColor, cfg.textColor)}>
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                          <StatusBadge status={item.priority} />
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span>{categoryLabels[item.category] || item.category}</span>
                          {item.responsible && <span>👤 {item.responsible}</span>}
                          {item.start_date && <span>📅 Início: {format(new Date(item.start_date), 'dd/MM/yyyy')}</span>}
                          {item.end_date && <span>🏁 Fim: {format(new Date(item.end_date), 'dd/MM/yyyy')}</span>}
                          {item.cost && <span>💰 R$ {Number(item.cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>}
                        </div>
                        {item.completion_report && (
                          <div className="mt-2 pt-2 border-t border-white/10">
                            <p className="text-xs"><span className="font-medium text-emerald-700">✅ Relatório:</span> <span className="text-muted-foreground">{item.completion_report}</span></p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {item.status !== 'done' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => handleReport(item)}>
                            <CheckCircle2 className="w-3 h-3" /> Concluir
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>

                    {/* Quick status change */}
                    {item.status !== 'done' && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-white/10">
                        <span className="text-xs text-muted-foreground self-center">Alterar status:</span>
                        {item.status !== 'not_started' && (
                          <button onClick={() => handleStatusChange(item, 'not_started')}
                            className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors">
                            Não Iniciada
                          </button>
                        )}
                        {item.status !== 'in_progress' && (
                          <button onClick={() => handleStatusChange(item, 'in_progress')}
                            className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition-colors">
                            Em Andamento
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(v) => { if (!v) closeDialog(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editingItem ? 'Editar Manutenção' : 'Nova Manutenção'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Não Iniciada</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="done">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Prioridade</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Responsável</Label><Input value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} placeholder="Empresa / pessoa" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Data Início</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
              <div><Label>Data Fim</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>
            <div><Label>Custo Estimado (R$)</Label><Input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></div>
            <div><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingItem ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Completion Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={(v) => { if (!v) { setShowReportDialog(false); setReportItem(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Relatório de Conclusão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Descreva o que foi realizado em <span className="font-medium text-foreground">{reportItem?.title}</span>.</p>
            <div>
              <Label>Relatório *</Label>
              <Textarea value={reportText} onChange={(e) => setReportText(e.target.value)} rows={4} placeholder="Descreva o que foi feito, materiais utilizados, observações..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowReportDialog(false); setReportItem(null); }}>Cancelar</Button>
              <Button onClick={handleSaveReport} disabled={!reportText.trim() || updateMutation.isPending} className="gap-2">
                <CheckCircle2 className="w-4 h-4" /> Marcar como Concluída
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}