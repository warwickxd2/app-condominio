import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, Trash2, PackageCheck, PackageX } from 'lucide-react';
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

const carrierLabels = { correios: 'Correios', sedex: 'Sedex', jadlog: 'Jadlog', dhl: 'DHL', amazon: 'Amazon', direct: 'Entrega Direta', other: 'Outro' };
const statusLabels = { received: 'Recebida', picked_up: 'Retirada', returned: 'Devolvida' };
const statusColors = { received: 'bg-blue-500', picked_up: 'bg-emerald-500', returned: 'bg-gray-400' };

const emptyForm = { recipient_name: '', unit_number: '', carrier: 'correios', tracking_code: '', received_by: '', notes: '' };

export default function Deliveries() {
  useRealtimeSync('Delivery', ['deliveries']);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [activeTab, setActiveTab] = useState('all');
  const queryClient = useQueryClient();

  const { data: deliveries = [] } = useQuery({ queryKey: ['deliveries'], queryFn: () => base44.entities.Delivery.list('-created_date', 100) });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Delivery.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['deliveries'] }); setShowDialog(false); setForm(emptyForm); toast.success('Entrega registrada'); }
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Delivery.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['deliveries'] }); toast.success('Entrega atualizada'); }
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Delivery.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['deliveries'] }); toast.success('Entrega removida'); }
  });

  const handleSubmit = (e) => { e.preventDefault(); createMutation.mutate(form); };
  const handleStatusChange = (item, newStatus) => updateMutation.mutate({ id: item.id, data: { ...item, status: newStatus } });

  const filtered = activeTab === 'all' ? deliveries : deliveries.filter(d => d.status === activeTab);
  const counts = { received: 0, picked_up: 0, returned: 0 };
  deliveries.forEach(d => { if (counts[d.status] !== undefined) counts[d.status]++; });

  return (
    <div>
      <PageHeader title="Sistema de Entregas" description="Controle de encomendas na portaria">
        <Button onClick={() => setShowDialog(true)} className="gap-2"><Plus className="w-4 h-4" /> Registrar Entrega</Button>
      </PageHeader>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {Object.entries(statusLabels).map(([key, label]) => (
          <div key={key} className={cn("rounded-xl border p-4 flex items-center gap-3 cursor-pointer transition-all hover:shadow-md bg-card border-white/10", activeTab === key && 'ring-2 ring-primary ring-offset-1')}
            onClick={() => setActiveTab(activeTab === key ? 'all' : key)}>
            <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", statusColors[key])} />
            <div><p className="text-lg font-bold leading-none">{counts[key]}</p><p className="text-[11px] text-muted-foreground mt-0.5">{label}</p></div>
          </div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">Todas ({deliveries.length})</TabsTrigger>
          <TabsTrigger value="received">Recebidas</TabsTrigger>
          <TabsTrigger value="picked_up">Retiradas</TabsTrigger>
          <TabsTrigger value="returned">Devolvidas</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <EmptyState icon={Package} title="Nenhuma entrega" description="Registre encomendas recebidas na portaria" actionLabel="Registrar Entrega" onAction={() => setShowDialog(true)} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="glass-card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", item.status === 'received' ? 'bg-blue-50' : item.status === 'picked_up' ? 'bg-emerald-50' : 'bg-gray-50')}>
                    <Package className={cn("w-4 h-4", item.status === 'received' ? 'text-blue-600' : item.status === 'picked_up' ? 'text-emerald-600' : 'text-gray-500')} />
                  </div>
                  <StatusBadge status={item.status} customLabel={statusLabels[item.status]} />
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
              <h3 className="font-semibold text-sm">{item.recipient_name}</h3>
              <p className="text-xs text-muted-foreground mb-2">Unid. {item.unit_number} • {carrierLabels[item.carrier] || item.carrier}</p>
              {item.tracking_code && <p className="text-xs text-muted-foreground mb-2 font-mono">📦 {item.tracking_code}</p>}
              {item.received_by && <p className="text-xs text-muted-foreground">Recebido por: {item.received_by}</p>}
              {item.notes && <p className="text-xs text-muted-foreground mt-1 italic">{item.notes}</p>}
              <p className="text-[11px] text-muted-foreground mt-2">{item.created_date && format(new Date(item.created_date), "dd/MM/yyyy 'às' HH:mm")}</p>
              {item.status === 'received' && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-white/10">
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleStatusChange(item, 'picked_up')}>
                    <PackageCheck className="w-3 h-3" /> Retirada
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-gray-600 border-gray-200 hover:bg-gray-50" onClick={() => handleStatusChange(item, 'returned')}>
                    <PackageX className="w-3 h-3" /> Devolver
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={(v) => setShowDialog(v)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">Registrar Entrega</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Destinatário *</Label><Input value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} required /></div>
            <div><Label>Unidade *</Label><Input value={form.unit_number} onChange={(e) => setForm({ ...form, unit_number: e.target.value })} placeholder="Ex: 101" required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Transportadora</Label>
                <Select value={form.carrier} onValueChange={(v) => setForm({ ...form, carrier: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(carrierLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label>Recebido por</Label><Input value={form.received_by} onChange={(e) => setForm({ ...form, received_by: e.target.value })} placeholder="Porteiro" /></div>
            </div>
            <div><Label>Código de Rastreio</Label><Input value={form.tracking_code} onChange={(e) => setForm({ ...form, tracking_code: e.target.value })} className="font-mono" /></div>
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