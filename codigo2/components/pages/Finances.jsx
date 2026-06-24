import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, Plus, Pencil, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import StatCard from '@/components/dashboard/StatCard';
import { toast } from 'sonner';

const categoryLabels = {
  condo_fee: 'Taxa Condominial', water: 'Água', gas: 'Gás', maintenance: 'Manutenção',
  cleaning: 'Limpeza', security: 'Segurança', elevator: 'Elevador', garden: 'Jardinagem',
  salary: 'Salários', insurance: 'Seguro', other: 'Outro'
};

const emptyRecord = {
  type: 'income', category: 'condo_fee', description: '', amount: '',
  unit_number: '', due_date: '', payment_date: '', status: 'pending', reference_month: ''
};

export default function Finances() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form, setForm] = useState(emptyRecord);
  const [activeTab, setActiveTab] = useState('all');
  const queryClient = useQueryClient();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['finances'],
    queryFn: () => base44.entities.FinancialRecord.list('-created_date', 100)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FinancialRecord.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['finances'] }); closeDialog(); toast.success('Lançamento criado'); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FinancialRecord.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['finances'] }); closeDialog(); toast.success('Lançamento atualizado'); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FinancialRecord.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['finances'] }); toast.success('Lançamento removido'); }
  });

  const closeDialog = () => { setShowDialog(false); setEditingRecord(null); setForm(emptyRecord); };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setForm({ ...emptyRecord, ...record, amount: String(record.amount || '') });
    setShowDialog(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form, amount: Number(form.amount) };
    if (editingRecord) {
      updateMutation.mutate({ id: editingRecord.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filtered = activeTab === 'all' ? records : records.filter(r => r.type === activeTab);
  const totalIncome = records.filter(r => r.type === 'income').reduce((s, r) => s + (r.amount || 0), 0);
  const totalExpense = records.filter(r => r.type === 'expense').reduce((s, r) => s + (r.amount || 0), 0);
  const balance = totalIncome - totalExpense;

  return (
    <div>
      <PageHeader title="Financeiro" description="Controle de receitas e despesas">
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Novo Lançamento
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard title="Receitas" value={`R$ ${totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={TrendingUp} />
        <StatCard title="Despesas" value={`R$ ${totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={TrendingDown} />
        <StatCard title="Saldo" value={`R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={DollarSign} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="income">Receitas</TabsTrigger>
          <TabsTrigger value="expense">Despesas</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 && !isLoading ? (
        <EmptyState icon={DollarSign} title="Nenhum lançamento" description="Registre receitas e despesas do condomínio" actionLabel="Novo Lançamento" onAction={() => setShowDialog(true)} />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase">Tipo</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase">Categoria</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase">Descrição</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase">Unidade</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase">Valor</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase">Vencimento</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(record => (
                  <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${record.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {record.type === 'income' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {record.type === 'income' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">{categoryLabels[record.category] || record.category}</td>
                    <td className="px-4 py-3 text-xs">{record.description}</td>
                    <td className="px-4 py-3 text-xs">{record.unit_number || '-'}</td>
                    <td className="px-4 py-3 text-right font-medium">R$ {record.amount?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-xs">{record.due_date ? format(new Date(record.due_date), 'dd/MM/yyyy') : '-'}</td>
                    <td className="px-4 py-3"><StatusBadge status={record.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(record)}><Pencil className="w-3 h-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(record.id)}><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={(v) => { if (!v) closeDialog(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{editingRecord ? 'Editar Lançamento' : 'Novo Lançamento'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo *</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Receita</SelectItem>
                    <SelectItem value="expense">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            </div>
            <div><Label>Descrição</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor (R$) *</Label><Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
              <div><Label>Unidade</Label><Input value={form.unit_number} onChange={(e) => setForm({ ...form, unit_number: e.target.value })} placeholder="Ex: 101" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Vencimento</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
              <div><Label>Pagamento</Label><Input type="date" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="overdue">Vencido</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Mês Referência</Label><Input type="month" value={form.reference_month} onChange={(e) => setForm({ ...form, reference_month: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingRecord ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}