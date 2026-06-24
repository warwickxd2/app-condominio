import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import { toast } from 'sonner';

const typeLabels = { apartment: 'Apartamento', house: 'Casa', commercial: 'Comercial' };

const emptyUnit = {
  number: '', block: '', type: 'apartment', owner_name: '', owner_email: '',
  owner_phone: '', resident_name: '', resident_phone: '', status: 'occupied', area_sqm: ''
};

export default function Units() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [form, setForm] = useState(emptyUnit);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: units = [], isLoading } = useQuery({ queryKey: ['units'], queryFn: () => base44.entities.Unit.list() });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Unit.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['units'] }); closeDialog(); toast.success('Unidade criada'); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Unit.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['units'] }); closeDialog(); toast.success('Unidade atualizada'); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Unit.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['units'] }); toast.success('Unidade removida'); }
  });

  const closeDialog = () => { setShowDialog(false); setEditingUnit(null); setForm(emptyUnit); };

  const handleEdit = (unit) => {
    setEditingUnit(unit);
    setForm({ ...emptyUnit, ...unit });
    setShowDialog(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...form, area_sqm: form.area_sqm ? Number(form.area_sqm) : undefined };
    if (editingUnit) {
      updateMutation.mutate({ id: editingUnit.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const filteredUnits = units.filter(u =>
    u.number?.toLowerCase().includes(search.toLowerCase()) ||
    u.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.block?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader title="Unidades" description="Gerencie as unidades do condomínio">
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Nova Unidade
        </Button>
      </PageHeader>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar unidade..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {filteredUnits.length === 0 && !isLoading ? (
        <EmptyState icon={Building2} title="Nenhuma unidade" description="Adicione a primeira unidade do condomínio" actionLabel="Nova Unidade" onAction={() => setShowDialog(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUnits.map(unit => (
            <div key={unit.id} className="glass-card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="font-display font-bold text-primary text-sm">{unit.number}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{typeLabels[unit.type] || 'Unidade'} {unit.number}</p>
                    {unit.block && <p className="text-xs text-muted-foreground">Bloco {unit.block}</p>}
                  </div>
                </div>
                <StatusBadge status={unit.status} />
              </div>
              {unit.owner_name && (
                <div className="text-xs text-muted-foreground space-y-0.5 mb-3">
                  <p><span className="font-medium text-foreground">Proprietário:</span> {unit.owner_name}</p>
                  {unit.owner_phone && <p>{unit.owner_phone}</p>}
                  {unit.resident_name && <p><span className="font-medium text-foreground">Morador:</span> {unit.resident_name}</p>}
                </div>
              )}
              <div className="flex gap-1.5 justify-end">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(unit)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(unit.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={(v) => { if (!v) closeDialog(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editingUnit ? 'Editar Unidade' : 'Nova Unidade'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Número *</Label><Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} required /></div>
              <div><Label>Bloco</Label><Input value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartamento</SelectItem>
                    <SelectItem value="house">Casa</SelectItem>
                    <SelectItem value="commercial">Comercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="occupied">Ocupada</SelectItem>
                    <SelectItem value="vacant">Vaga</SelectItem>
                    <SelectItem value="rented">Alugada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Área (m²)</Label><Input type="number" value={form.area_sqm} onChange={(e) => setForm({ ...form, area_sqm: e.target.value })} /></div>
            <div className="border-t pt-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Proprietário</p>
              <div className="space-y-3">
                <div><Label>Nome</Label><Input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Email</Label><Input type="email" value={form.owner_email} onChange={(e) => setForm({ ...form, owner_email: e.target.value })} /></div>
                  <div><Label>Telefone</Label><Input value={form.owner_phone} onChange={(e) => setForm({ ...form, owner_phone: e.target.value })} /></div>
                </div>
              </div>
            </div>
            <div className="border-t pt-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Morador</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Nome</Label><Input value={form.resident_name} onChange={(e) => setForm({ ...form, resident_name: e.target.value })} /></div>
                <div><Label>Telefone</Label><Input value={form.resident_phone} onChange={(e) => setForm({ ...form, resident_phone: e.target.value })} /></div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeDialog}>Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingUnit ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}