import { useState } from 'react';
import { Plus, LayoutGrid, Table as TableIcon, Filter, Search } from 'lucide-react';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  PortariaForm,
  PortariaKanban,
  PortariaTable,
  RegistrarPublicacaoDialog,
} from '@/components/portarias';
import { usePortarias, useRegistrarAssinatura } from '@/hooks/usePortarias';
import { StatusPortaria, STATUS_PORTARIA_LABELS, Portaria } from '@/types/portaria';
import { toast } from 'sonner';

export default function CentralPortariasPage() {
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [formOpen, setFormOpen] = useState(false);
  const [publicacaoDialogOpen, setPublicacaoDialogOpen] = useState(false);
  const [assinaturaDialogOpen, setAssinaturaDialogOpen] = useState(false);
  const [selectedPortaria, setSelectedPortaria] = useState<Portaria | null>(null);
  const [assinaturaData, setAssinaturaData] = useState({
    assinado_por: '',
    data_assinatura: new Date().toISOString().split('T')[0],
  });
  const [filters, setFilters] = useState<{
    status?: StatusPortaria;
    busca?: string;
    ano?: number;
  }>({
    ano: new Date().getFullYear(),
  });

  const { data: portarias = [], isLoading, refetch } = usePortarias(filters);
  const registrarAssinatura = useRegistrarAssinatura();

  const handleView = (portaria: Portaria) => {
    setSelectedPortaria(portaria);
    // TODO: Open detail dialog
  };

  const handleRegistrarPublicacao = (portaria: Portaria) => {
    setSelectedPortaria(portaria);
    setPublicacaoDialogOpen(true);
  };

  const handleRegistrarAssinatura = (portaria: Portaria) => {
    setSelectedPortaria(portaria);
    setAssinaturaData({
      assinado_por: '',
      data_assinatura: new Date().toISOString().split('T')[0],
    });
    setAssinaturaDialogOpen(true);
  };

  const handleConfirmarAssinatura = async () => {
    if (!selectedPortaria || !assinaturaData.assinado_por) return;
    
    try {
      await registrarAssinatura.mutateAsync({
        id: selectedPortaria.id,
        assinado_por: assinaturaData.assinado_por,
        data_assinatura: assinaturaData.data_assinatura,
      });
      setAssinaturaDialogOpen(false);
      setSelectedPortaria(null);
      toast.success('Assinatura registrada com sucesso!');
      refetch();
    } catch (err) {
      toast.error('Erro ao registrar assinatura');
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Central de Portarias</h1>
            <p className="text-muted-foreground">
              Gerencie todas as portarias de pessoal em um só lugar
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Portaria
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, título..."
              className="pl-9"
              value={filters.busca || ''}
              onChange={(e) =>
                setFilters((f) => ({ ...f, busca: e.target.value || undefined }))
              }
            />
          </div>

          <Select
            value={filters.status || 'all'}
            onValueChange={(value) =>
              setFilters((f) => ({
                ...f,
                status: value === 'all' ? undefined : (value as StatusPortaria),
              }))
            }
          >
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              {Object.entries(STATUS_PORTARIA_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={String(filters.ano || currentYear)}
            onValueChange={(value) =>
              setFilters((f) => ({ ...f, ano: parseInt(value) }))
            }
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant={view === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('kanban')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setView('table')}
            >
              <TableIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {view === 'kanban' ? (
          <PortariaKanban
            portarias={portarias}
            isLoading={isLoading}
            onView={handleView}
          />
        ) : (
          <PortariaTable
            portarias={portarias}
            isLoading={isLoading}
            onView={handleView}
            onRegistrarPublicacao={handleRegistrarPublicacao}
            onRegistrarAssinatura={handleRegistrarAssinatura}
          />
        )}
      </div>

      {/* Dialogs */}
      <PortariaForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={() => refetch()}
      />

      <RegistrarPublicacaoDialog
        open={publicacaoDialogOpen}
        onOpenChange={setPublicacaoDialogOpen}
        portaria={selectedPortaria}
        onSuccess={() => refetch()}
      />

      {/* Dialog Registrar Assinatura */}
      <Dialog open={assinaturaDialogOpen} onOpenChange={setAssinaturaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Assinatura</DialogTitle>
            <DialogDescription>
              Portaria nº {selectedPortaria?.numero}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="assinado_por">Assinado por</Label>
              <Input
                id="assinado_por"
                placeholder="Nome do signatário"
                value={assinaturaData.assinado_por}
                onChange={(e) => setAssinaturaData(prev => ({ ...prev, assinado_por: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_assinatura">Data da Assinatura</Label>
              <Input
                id="data_assinatura"
                type="date"
                value={assinaturaData.data_assinatura}
                onChange={(e) => setAssinaturaData(prev => ({ ...prev, data_assinatura: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssinaturaDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmarAssinatura}
              disabled={!assinaturaData.assinado_por || registrarAssinatura.isPending}
            >
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
