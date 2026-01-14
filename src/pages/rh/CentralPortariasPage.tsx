import { useState } from 'react';
import { Plus, LayoutGrid, Table as TableIcon, Filter, Search } from 'lucide-react';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PortariaForm,
  PortariaKanban,
  PortariaTable,
  RegistrarPublicacaoDialog,
} from '@/components/portarias';
import { usePortarias } from '@/hooks/usePortarias';
import { StatusPortaria, STATUS_PORTARIA_LABELS, Portaria } from '@/types/portaria';

export default function CentralPortariasPage() {
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [formOpen, setFormOpen] = useState(false);
  const [publicacaoDialogOpen, setPublicacaoDialogOpen] = useState(false);
  const [selectedPortaria, setSelectedPortaria] = useState<Portaria | null>(null);
  const [filters, setFilters] = useState<{
    status?: StatusPortaria;
    busca?: string;
    ano?: number;
  }>({
    ano: new Date().getFullYear(),
  });

  const { data: portarias = [], isLoading, refetch } = usePortarias(filters);

  const handleView = (portaria: Portaria) => {
    setSelectedPortaria(portaria);
    // TODO: Open detail dialog
  };

  const handleRegistrarPublicacao = (portaria: Portaria) => {
    setSelectedPortaria(portaria);
    setPublicacaoDialogOpen(true);
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
    </AdminLayout>
  );
}
