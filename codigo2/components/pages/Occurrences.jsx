import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import { toast } from 'sonner';

const categoryLabels = {
  complaint: 'Reclamação', maintenance: 'Manutenção', suggestion: 'Sugestão',
  noise: 'Barulho', parking: 'Estacionamento', security: 'Segurança', other: 'Outro'
};

const emptyOcc = {
  title: '', description: '', category: 'complaint', priority: 'medium',
  status: 'open', unit_number: '', reporter_name: '', resolution_notes: ''
};

export default function Occurrences() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingOcc, setEditingOcc] = useState(null);
  const [form, setForm] = useState(emptyOcc);
  const queryClient = useQueryClient();

  const { data: occurrences = [], isLoading } = useQuery({
    queryKey: ['occurrences'],
    queryFn: () => base44.entities.Occurrence.list('-created_date', 100)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Occurrence.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['occurrences'] }); closeDialog(); toast.success('Ocorrência registrada'); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Occurrence.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['occurrences'] }); closeDialog(); toast.success('Ocorrência atualizada'); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Occurrence.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['occurrences'] }); toast.success('Ocorrência removida'); }
  });

  const closeDialog = () => { setShowDialog(false); setEditingOcc(null); setForm(emptyOcc); };

  const handleEdit = (occ) => {
    setEditingOcc(occ);
    setForm({ ...emptyOcc, ...occ });
    setShowDialog(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingOcc) {
      updateMutation.mutate({ id: editingOcc.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <div>
      <PageHeader title="Ocorrências" description="Reclamações, manutenções e solicitações">
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Nova Ocorrência
        </Button>
      </PageHeader>

      {occurrences.length === 0 && !isLoading ? (
        <EmptyState icon={AlertTriangle} title="Nenhuma ocorrência" description="Registre reclamações e solicitações" actionLabel="Nova Ocorrência" onAction={() => setShowDialog(true)} />
      ) : (
        <div className="space-y-3">
          {occurrences.map(occ => (
            <div key={occ.id} className="glass-card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-sm">{occ.title}</h3>
                    <StatusBadge status={occ.status} />
                    <StatusBadge status={occ.priority} />
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{occ.description}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{categoryLabels[occ.category] || occ.category}</span>
                    {occ.unit_number && <span>Unid. {occ.unit_number}</span>}
                    {occ.reporter_name && <span>{occ.reporter_name}</span>}
                    {occ.created_date && <span>{format(new Date(occ.created_date), "dd MMM yyyy", { locale: ptBR })}</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(occ)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(occ.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
              {occ.resolution_notes && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Resolução:</span> {occ.resolution_notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={(v) => { if (!v) closeDialog(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editingOcc ? 'Editar Ocorrência' : 'Nova Ocorrência'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Aberta</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="resolved">Resolvida</SelectItem>
                    <SelectItem value="closed">Fechada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Unidade</Label><Input value={form.unit_number} onChange={(e) => setForm({ ...form, unit_number: e.target.value })} placeholder="Ex: 101" /></div>
            </div>
            <div><Label>Nome do Solicitante</Label><Input value={form.reporter_name} onChange={(e) => setForm({ ...form, reporter_name: e.target.value })} /></div>
            <div><Label>Notas de Resolução</Label><Textarea value={form.resolution_notes} onChange={(e) => setForm({ ...form, resolution_notes: e.target.value })} rows={2} /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingOcc ? 'Salvar' : 'Registrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}