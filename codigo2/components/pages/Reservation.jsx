import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
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

const areaLabels = {
  party_room: 'Salão de Festas', bbq: 'Churrasqueira', pool: 'Piscina',
  gym: 'Academia', playground: 'Playground', meeting_room: 'Sala de Reunião', other: 'Outro'
};

const areaIcons = {
  party_room: '🎉', bbq: '🔥', pool: '🏊', gym: '💪', playground: '🎠', meeting_room: '📋', other: '📌'
};

const emptyRes = {
  area: 'party_room', date: '', start_time: '', end_time: '',
  unit_number: '', resident_name: '', purpose: '', status: 'pending', notes: ''
};

export default function Reservations() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingRes, setEditingRes] = useState(null);
  const [form, setForm] = useState(emptyRes);
  const queryClient = useQueryClient();

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['reservations'],
    queryFn: () => base44.entities.Reservation.list('-date', 100)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Reservation.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['reservations'] }); closeDialog(); toast.success('Reserva criada'); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Reservation.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['reservations'] }); closeDialog(); toast.success('Reserva atualizada'); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Reservation.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['reservations'] }); toast.success('Reserva removida'); }
  });

  const closeDialog = () => { setShowDialog(false); setEditingRes(null); setForm(emptyRes); };

  const handleEdit = (res) => {
    setEditingRes(res);
    setForm({ ...emptyRes, ...res });
    setShowDialog(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingRes) {
      updateMutation.mutate({ id: editingRes.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleStatusChange = (res, newStatus) => {
    updateMutation.mutate({ id: res.id, data: { ...res, status: newStatus } });
  };

  return (
    <div>
      <PageHeader title="Reservas" description="Agendamento de áreas comuns">
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Nova Reserva
        </Button>
      </PageHeader>

      {reservations.length === 0 && !isLoading ? (
        <EmptyState icon={CalendarDays} title="Nenhuma reserva" description="Agende o uso de áreas comuns" actionLabel="Nova Reserva" onAction={() => setShowDialog(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reservations.map(res => (
            <div key={res.id} className="glass-card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-xl">
                    {areaIcons[res.area] || '📌'}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{areaLabels[res.area] || res.area}</p>
                    <p className="text-xs text-muted-foreground">
                      {res.date && format(new Date(res.date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <StatusBadge status={res.status} />
              </div>
              <div className="text-xs text-muted-foreground space-y-1 mb-3">
                <p><span className="font-medium text-foreground">Horário:</span> {res.start_time} - {res.end_time}</p>
                <p><span className="font-medium text-foreground">Morador:</span> {res.resident_name} (Unid. {res.unit_number})</p>
                {res.purpose && <p><span className="font-medium text-foreground">Finalidade:</span> {res.purpose}</p>}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                {res.status === 'pending' && (
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleStatusChange(res, 'approved')}>
                      <Check className="w-3 h-3" /> Aprovar
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleStatusChange(res, 'rejected')}>
                      <X className="w-3 h-3" /> Rejeitar
                    </Button>
                  </div>
                )}
                {res.status !== 'pending' && <div />}
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(res)}><Pencil className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(res.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={(v) => { if (!v) closeDialog(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{editingRes ? 'Editar Reserva' : 'Nova Reserva'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Área *</Label>
              <Select value={form.area} onValueChange={(v) => setForm({ ...form, area: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(areaLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Data *</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
              <div><Label>Início</Label><Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></div>
              <div><Label>Término</Label><Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Unidade *</Label><Input value={form.unit_number} onChange={(e) => setForm({ ...form, unit_number: e.target.value })} required placeholder="Ex: 101" /></div>
              <div><Label>Morador *</Label><Input value={form.resident_name} onChange={(e) => setForm({ ...form, resident_name: e.target.value })} required /></div>
            </div>
            <div><Label>Finalidade</Label><Input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="Ex: Aniversário" /></div>
            <div><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingRes ? 'Salvar' : 'Reservar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}