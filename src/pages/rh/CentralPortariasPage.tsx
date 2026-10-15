import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  LayoutGrid,
  Table as TableIcon,
  Filter,
  Search,
  BarChart3,
} from 'lucide-react';

import { ModuleLayout } from '@/components/layout';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import {
  PortariaKanban,
  PortariaTable,
  RegistrarPublicacaoDialog,
  RegistrarAssinaturaDialog,
} from '@/components/portarias';
import { NovaPortariaSimplificada } from '@/components/portarias/NovaPortariaSimplificada';
import { RelatorioPortariasDialog } from '@/components/portarias/RelatorioPortariasDialog';
import { VisualizarPortariaDialog } from '@/components/portarias/VisualizarPortariaDialog';
import { CentralRelatoriosDialog } from '@/components/relatorios/CentralRelatoriosDialog';
import { usePortarias, useDeletePortaria } from '@/hooks/usePortarias';
import { StatusPortaria, STATUS_PORTARIA_LABELS, Portaria } from '@/types/portaria';
import { toast } from 'sonner';
import { abrirArquivoPortaria } from '@/lib/portarias/arquivoPortaria';

export default function CentralPortariasPage() {
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [novaPortariaOpen, setNovaPortariaOpen] = useState(false);
  const [editPortariaOpen, setEditPortariaOpen] = useState(false);
  const [relatorioOpen, setRelatorioOpen] = useState(false);
  const [centralRelatoriosOpen, setCentralRelatoriosOpen] = useState(false);
  const [publicacaoDialogOpen, setPublicacaoDialogOpen] = useState(false);
  const [assinaturaDialogOpen, setAssinaturaDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [selectedPortaria, setSelectedPortaria] = useState<Portaria | null>(null);
  const [filters, setFilters] = useState<{
    status?: StatusPortaria;
    busca?: string;
    ano?: number;
  }>({
    ano: new Date().getFullYear(),
  });

  const { data: portarias = [], isLoading, refetch } = usePortarias(filters);

  // ?id=<uuid> (link vindo de /rh/portarias/pendencias) abre a portaria direto.
  const [searchParams, setSearchParams] = useSearchParams();
  const idParam = searchParams.get('id');
  useEffect(() => {
    if (!idParam || isLoading) return;
    const alvo = portarias.find((p) => p.id === idParam);
    if (alvo) {
      setSelectedPortaria(alvo);
      setViewDialogOpen(true);
    } else {
      toast.error('Portaria não encontrada nos filtros atuais.');
    }
    setSearchParams((prev) => { prev.delete('id'); return prev; }, { replace: true });
  }, [idParam, isLoading, portarias, setSearchParams]);
  const deletePortaria = useDeletePortaria();

  const handleView = (portaria: Portaria) => {
    setSelectedPortaria(portaria);
    setViewDialogOpen(true);
  };

  const handleRegistrarPublicacao = (portaria: Portaria) => {
    setSelectedPortaria(portaria);
    setPublicacaoDialogOpen(true);
  };

  const handleEdit = (portaria: Portaria) => {
    setSelectedPortaria(portaria);
    setEditPortariaOpen(true);
  };

  const handleDeleteRequest = (portaria: Portaria) => {
    setSelectedPortaria(portaria);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedPortaria) return;
    
    try {
      await deletePortaria.mutateAsync(selectedPortaria.id);
      setDeleteDialogOpen(false);
      setSelectedPortaria(null);
      refetch();
    } catch {
      // Error already handled by hook
    }
  };

  const handleRegistrarAssinatura = (portaria: Portaria) => {
    setSelectedPortaria(portaria);
    setAssinaturaDialogOpen(true);
  };

  // O texto da portaria é do SEI: aqui só se abre o PDF anexado (assinado ou publicado), quando houver
  const handleAbrirArquivo = (portaria: Portaria) => {
    // Bucket privado: abre por URL assinada; erro (ex.: sem permissão) vira toast
    abrirArquivoPortaria(portaria.arquivo_assinado_url || portaria.arquivo_url).catch((erro: unknown) => {
      toast.error(erro instanceof Error ? erro.message : 'Não foi possível abrir o arquivo.');
    });
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <ModuleLayout module="gabinete">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Central de Portarias</h1>
            <p className="text-muted-foreground">
              Acompanhe as portarias feitas no SEI: processo, número, assinatura e publicação no DOE
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setCentralRelatoriosOpen(true)}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Central Relatórios
            </Button>
            <Button onClick={() => setNovaPortariaOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Portaria
            </Button>
          </div>
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
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
            onAbrirArquivo={handleAbrirArquivo}
            onRegistrarAssinatura={handleRegistrarAssinatura}
            onRegistrarPublicacao={handleRegistrarPublicacao}
          />
        ) : (
          <PortariaTable
            portarias={portarias}
            isLoading={isLoading}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
            onAbrirArquivo={handleAbrirArquivo}
            onRegistrarPublicacao={handleRegistrarPublicacao}
            onRegistrarAssinatura={handleRegistrarAssinatura}
          />
        )}
      </div>

      {/* Dialogs */}
      <NovaPortariaSimplificada
        open={novaPortariaOpen}
        onOpenChange={setNovaPortariaOpen}
        onSuccess={() => refetch()}
      />

      {/* Dialog Editar Portaria */}
      <NovaPortariaSimplificada
        open={editPortariaOpen}
        onOpenChange={setEditPortariaOpen}
        onSuccess={() => refetch()}
        mode="edit"
        portariaId={selectedPortaria?.id}
        initialPortaria={selectedPortaria}
      />

      <CentralRelatoriosDialog
        open={centralRelatoriosOpen}
        onOpenChange={setCentralRelatoriosOpen}
      />

      <RegistrarPublicacaoDialog
        open={publicacaoDialogOpen}
        onOpenChange={setPublicacaoDialogOpen}
        portaria={selectedPortaria}
        onSuccess={() => refetch()}
      />

      {/* Dialog Confirmar Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a portaria{' '}
              <strong>nº {selectedPortaria?.numero}</strong>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Visualizar */}
      <VisualizarPortariaDialog
        portaria={selectedPortaria}
        open={viewDialogOpen}
        onOpenChange={(open) => {
          setViewDialogOpen(open);
          if (!open) setSelectedPortaria(null);
        }}
        onEditar={handleEdit}
      />

      {/* Dialog Registrar Assinatura */}
      <RegistrarAssinaturaDialog
        open={assinaturaDialogOpen}
        onOpenChange={setAssinaturaDialogOpen}
        portaria={selectedPortaria}
        onSuccess={() => refetch()}
      />
    </ModuleLayout>
  );
}
