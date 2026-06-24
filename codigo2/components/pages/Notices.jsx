import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Plus, Pencil, Trash2 } from 'lucide-react';
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
  general: 'Geral', maintenance: 'Manutenção', meeting: 'Reunião',
  event: 'Evento', rule: 'Regulamento', emergency: 'Emergência'
};

const emptyNotice = {
  title: '', content: '', category: 'general', priority: 'normal',
  expires_at: '', is_active: true
};

export default function Notices() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [form, setForm] = useState(emptyNotice);
  const queryClient = useQueryClient();

  const { data: notices = [], isLoading } = useQuery({
    queryKey: ['notices'],
    queryFn: () => base44.entities.Notice.list('-created_date', 100)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Notice.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notices'] }); closeDialog(); toast.success('Aviso publicado'); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Notice.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notices'] }); closeDialog(); toast.success('Aviso atualizado'); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notice.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['notices'] }); toast.success('Aviso removido'); }
  });

  const closeDialog = () => { setShowDialog(false); setEditingNotice(null); setForm(emptyNotice); };

  const handleEdit = (notice) => {
    setEditingNotice(notice);
    setForm({ ...emptyNotice, ...notice });
    setShowDialog(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingNotice) {
      updateMutation.mutate({ id: editingNotice.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const priorityIcons = {
    normal: '📋', important: '⚠️', urgent: '🚨'
  };

  return (
    <div>
      <PageHeader title="Avisos" description="Comunicados e informativos do condomínio">
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Aviso
        </Button>
      </PageHeader>

      {notices.length === 0 && !isLoading ? (
        <EmptyState icon={Megaphone} title="Nenhum aviso" description="Publique avisos e comunicados para os moradores" actionLabel="Novo Aviso" onAction={() => setShowDialog(true)} />
      ) : (
        <div className="space-y-4">
          {notices.map(notice => (
            <div key={notice.id} className="glass-card p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-lg">{priorityIcons[notice.priority] || '📋'}</span>
                    <h3 className="font-display font-semibold text-base">{notice.title}</h3>
                    <StatusBadge status={notice.priority} />
                    <StatusBadge status={notice.category} customLabel={categoryLabels[notice.category]} />
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{notice.content}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                    {notice.created_date && <span>Publicado em {format(new Date(notice.created_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>}
                    {notice.expires_at && <span>• Expira em {format(new Date(notice.expires_at), 'dd/MM/yyyy')}</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(notice)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(notice.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={(v) => { if (!v) closeDialog(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{editingNotice ? 'Editar Aviso' : 'Novo Aviso'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div><Label>Conteúdo *</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Categoria</Label>
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
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="important">Importante</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Data de Expiração</Label><Input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingNotice ? 'Salvar' : 'Publicar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}