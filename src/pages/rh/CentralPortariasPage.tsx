import { useMemo, useState } from 'react';
import {
  Plus,
  LayoutGrid,
  Table as TableIcon,
  Filter,
  Search,
  Download,
} from 'lucide-react';

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
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

import {
  PortariaKanban,
  PortariaTable,
  RegistrarPublicacaoDialog,
} from '@/components/portarias';
import { NovaPortariaUnificada } from '@/components/portarias/NovaPortariaUnificada';
import { supabase } from '@/integrations/supabase/client';
import { usePortarias, useRegistrarAssinatura, useDeletePortaria } from '@/hooks/usePortarias';
import { StatusPortaria, STATUS_PORTARIA_LABELS, Portaria } from '@/types/portaria';
import { toast } from 'sonner';
import { buildPortariaPdfDoc, savePortariaPdf } from '@/lib/portariaPdf';

function htmlToText(html?: string | null) {
  if (!html) return '';
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return (doc.body.textContent || '').trim();
  } catch {
    return html;
  }
}

export default function CentralPortariasPage() {
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [novaPortariaOpen, setNovaPortariaOpen] = useState(false);
  const [editPortariaOpen, setEditPortariaOpen] = useState(false);
  const [publicacaoDialogOpen, setPublicacaoDialogOpen] = useState(false);
  const [assinaturaDialogOpen, setAssinaturaDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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
  const deletePortaria = useDeletePortaria();

  const selectedPortariaText = useMemo(() => {
    return htmlToText(selectedPortaria?.conteudo_html);
  }, [selectedPortaria?.conteudo_html]);

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
    } catch {
      toast.error('Erro ao registrar assinatura');
    }
  };

  const handleGeneratePdf = async (portaria: Portaria) => {
    try {
      // Se já tiver um arquivo anexado/assinado, abre direto
      if (portaria.arquivo_assinado_url) {
        window.open(portaria.arquivo_assinado_url, '_blank');
        return;
      }
      if (portaria.arquivo_url) {
        window.open(portaria.arquivo_url, '_blank');
        return;
      }

      const servidorId = portaria.servidores_ids?.[0];
      if (!servidorId) {
        toast.error('Esta portaria não tem servidor vinculado (servidores_ids).');
        return;
      }

      if (!['nomeacao', 'exoneracao', 'designacao'].includes(String(portaria.categoria))) {
        toast.error('PDF disponível apenas para Nomeação/Exoneração (por enquanto).');
        return;
      }

      setIsGeneratingPdf(true);

      const { data: servidor, error: servidorError } = await supabase
        .from('v_servidores_situacao')
        .select('id, nome_completo, cpf, matricula')
        .eq('id', servidorId)
        .maybeSingle();

      if (servidorError) throw servidorError;
      if (!servidor?.cpf || !servidor?.nome_completo) {
        toast.error('Não foi possível obter CPF/nome do servidor para gerar o PDF.');
        return;
      }

      const cargoNome = portaria.cargo?.nome || '';
      const unidadeNome = portaria.unidade?.nome || '';
      if (!cargoNome || !unidadeNome) {
        toast.error('Portaria sem cargo/unidade vinculados para gerar o PDF.');
        return;
      }

      const doc = buildPortariaPdfDoc({
        portaria: {
          numero: portaria.numero,
          data_documento: portaria.data_documento,
          ementa: portaria.ementa,
          categoria: portaria.categoria,
        },
        servidor: {
          nome_completo: servidor.nome_completo,
          cpf: servidor.cpf,
          matricula: servidor.matricula,
        },
        cargo: {
          nome: cargoNome,
          sigla: portaria.cargo?.sigla,
        },
        unidade: {
          nome: unidadeNome,
          sigla: portaria.unidade?.sigla,
        },
      });

      savePortariaPdf(doc, { numero: portaria.numero, servidorNome: servidor.nome_completo });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar PDF');
    } finally {
      setIsGeneratingPdf(false);
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
          <div className="flex items-center gap-2">
            <Button onClick={() => setNovaPortariaOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Portaria
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
            onGeneratePdf={handleGeneratePdf}
          />
        ) : (
          <PortariaTable
            portarias={portarias}
            isLoading={isLoading}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
            onGeneratePdf={handleGeneratePdf}
            onRegistrarPublicacao={handleRegistrarPublicacao}
            onRegistrarAssinatura={handleRegistrarAssinatura}
          />
        )}
      </div>

      {/* Dialogs */}
      <NovaPortariaUnificada
        open={novaPortariaOpen}
        onOpenChange={setNovaPortariaOpen}
        onSuccess={() => refetch()}
      />

      {/* Dialog Editar Portaria (usa o mesmo formulário unificado) */}
      <NovaPortariaUnificada
        open={editPortariaOpen}
        onOpenChange={setEditPortariaOpen}
        onSuccess={() => refetch()}
        mode="edit"
        portariaId={selectedPortaria?.id}
        initialPortaria={selectedPortaria}
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
      <Dialog
        open={viewDialogOpen}
        onOpenChange={(open) => {
          setViewDialogOpen(open);
          if (!open) setSelectedPortaria(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedPortaria ? `Portaria nº ${selectedPortaria.numero}` : 'Portaria'}
            </DialogTitle>
            <DialogDescription>
              {selectedPortaria?.ementa || selectedPortaria?.titulo || ''}
            </DialogDescription>
          </DialogHeader>

          {selectedPortaria && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {STATUS_PORTARIA_LABELS[selectedPortaria.status]}
                </Badge>
                {selectedPortaria.categoria && (
                  <Badge variant="outline" className="capitalize">
                    {selectedPortaria.categoria}
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  Data: {new Date(selectedPortaria.data_documento).toLocaleDateString('pt-BR')}
                </span>
              </div>

              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-sm font-medium mb-2">Conteúdo</p>
                <pre className="whitespace-pre-wrap text-sm text-muted-foreground max-h-[55vh] overflow-auto">
                  {selectedPortariaText || '(sem conteúdo)'}
                </pre>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Fechar
            </Button>
            {selectedPortaria && (
              <Button onClick={() => handleGeneratePdf(selectedPortaria)} disabled={isGeneratingPdf}>
                <Download className="h-4 w-4 mr-2" />
                {isGeneratingPdf ? 'Gerando PDF...' : 'Baixar PDF'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Registrar Assinatura */}
      <Dialog open={assinaturaDialogOpen} onOpenChange={setAssinaturaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Assinatura</DialogTitle>
            <DialogDescription>Portaria nº {selectedPortaria?.numero}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="assinado_por">Assinado por</Label>
              <Input
                id="assinado_por"
                placeholder="Nome do signatário"
                value={assinaturaData.assinado_por}
                onChange={(e) =>
                  setAssinaturaData((prev) => ({ ...prev, assinado_por: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_assinatura">Data da Assinatura</Label>
              <Input
                id="data_assinatura"
                type="date"
                value={assinaturaData.data_assinatura}
                onChange={(e) =>
                  setAssinaturaData((prev) => ({ ...prev, data_assinatura: e.target.value }))
                }
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
