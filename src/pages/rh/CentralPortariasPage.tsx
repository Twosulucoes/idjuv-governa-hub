import { useMemo, useState } from 'react';
import {
  Plus,
  LayoutGrid,
  Table as TableIcon,
  Filter,
  Search,
  Download,
  BarChart3,
  AlertTriangle,
  Pencil,
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
import { Badge } from '@/components/ui/badge';

import {
  PortariaKanban,
  PortariaTable,
  RegistrarPublicacaoDialog,
  RegistrarAssinaturaDialog,
} from '@/components/portarias';
import { NovaPortariaSimplificada } from '@/components/portarias/NovaPortariaSimplificada';
import { RelatorioPortariasDialog } from '@/components/portarias/RelatorioPortariasDialog';
import { CentralRelatoriosDialog } from '@/components/relatorios/CentralRelatoriosDialog';
import { supabase } from '@/integrations/supabase/client';
import { usePortarias, useDeletePortaria } from '@/hooks/usePortarias';
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
  const [relatorioOpen, setRelatorioOpen] = useState(false);
  const [centralRelatoriosOpen, setCentralRelatoriosOpen] = useState(false);
  const [publicacaoDialogOpen, setPublicacaoDialogOpen] = useState(false);
  const [assinaturaDialogOpen, setAssinaturaDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const [selectedPortaria, setSelectedPortaria] = useState<Portaria | null>(null);
  const [filters, setFilters] = useState<{
    status?: StatusPortaria;
    busca?: string;
    ano?: number;
  }>({
    ano: new Date().getFullYear(),
  });

  const { data: portarias = [], isLoading, refetch } = usePortarias(filters);
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
    setAssinaturaDialogOpen(true);
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
    <ModuleLayout module="gabinete">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Central de Portarias</h1>
            <p className="text-muted-foreground">
              Cadastre e gerencie portarias de pessoal - Gabinete da Presidência
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setCentralRelatoriosOpen(true)}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Central Relatórios
            </Button>
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
            onGeneratePdf={handleGeneratePdf}
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
      <Dialog
        open={viewDialogOpen}
        onOpenChange={(open) => {
          setViewDialogOpen(open);
          if (!open) setSelectedPortaria(null);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPortaria ? `Portaria nº ${selectedPortaria.numero}` : 'Portaria'}
            </DialogTitle>
            <DialogDescription>
              {selectedPortaria?.ementa || selectedPortaria?.titulo || ''}
            </DialogDescription>
          </DialogHeader>

          {selectedPortaria && (
            <div className="space-y-4">
              {/* Status e Categoria */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {STATUS_PORTARIA_LABELS[selectedPortaria.status]}
                </Badge>
                {selectedPortaria.categoria && (
                  <Badge variant="outline" className="capitalize">
                    {selectedPortaria.categoria}
                  </Badge>
                )}
              </div>

              {/* Grid de informações */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Data do Documento</p>
                  <p className="text-sm font-semibold">
                    {new Date(selectedPortaria.data_documento).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Assinatura</p>
                  <p className="text-sm font-semibold">
                    {selectedPortaria.data_assinatura
                      ? new Date(selectedPortaria.data_assinatura).toLocaleDateString('pt-BR')
                      : <span className="text-muted-foreground font-normal">Não assinada</span>}
                  </p>
                  {selectedPortaria.assinante?.full_name && (
                    <p className="text-xs text-muted-foreground">{selectedPortaria.assinante.full_name}</p>
                  )}
                </div>

                <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">DOE (Diário Oficial)</p>
                  {selectedPortaria.doe_numero || selectedPortaria.doe_data ? (
                    <>
                      {selectedPortaria.doe_numero && (
                        <p className="text-sm font-semibold">Nº {selectedPortaria.doe_numero}</p>
                      )}
                      {selectedPortaria.doe_data && (
                        <p className="text-xs text-muted-foreground">
                          {new Date(selectedPortaria.doe_data).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-1 text-warning">
                      <AlertTriangle className="h-3 w-3" />
                      <span className="text-xs font-medium">Não informado</span>
                    </div>
                  )}
                </div>

                <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Anexo / Arquivo</p>
                  {selectedPortaria.arquivo_assinado_url ? (
                    <a href={selectedPortaria.arquivo_assinado_url} target="_blank" rel="noreferrer"
                       className="text-sm text-primary underline font-medium">
                      📎 Arquivo assinado
                    </a>
                  ) : selectedPortaria.arquivo_url ? (
                    <a href={selectedPortaria.arquivo_url} target="_blank" rel="noreferrer"
                       className="text-sm text-primary underline font-medium">
                      📎 Arquivo anexado
                    </a>
                  ) : (
                    <div className="flex items-center gap-1 text-warning">
                      <AlertTriangle className="h-3 w-3" />
                      <span className="text-xs font-medium">Sem anexo</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Servidor / Cargo / Unidade */}
              {(selectedPortaria.servidor || selectedPortaria.cargo || selectedPortaria.unidade) && (
                <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Vínculos</p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedPortaria.servidor && (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Servidor</p>
                        <p className="text-sm">{selectedPortaria.servidor.nome_completo}</p>
                        {selectedPortaria.servidor.matricula && (
                          <p className="text-xs text-muted-foreground">Mat. {selectedPortaria.servidor.matricula}</p>
                        )}
                      </div>
                    )}
                    {selectedPortaria.cargo && (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Cargo</p>
                        <p className="text-sm">{selectedPortaria.cargo.nome}</p>
                        {selectedPortaria.cargo.sigla && (
                          <p className="text-xs text-muted-foreground">{selectedPortaria.cargo.sigla}</p>
                        )}
                      </div>
                    )}
                    {selectedPortaria.unidade && (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Unidade</p>
                        <p className="text-sm">{selectedPortaria.unidade.nome}</p>
                        {selectedPortaria.unidade.sigla && (
                          <p className="text-xs text-muted-foreground">{selectedPortaria.unidade.sigla}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Servidores vinculados (múltiplos) */}
              {selectedPortaria.servidores_ids && selectedPortaria.servidores_ids.length > 0 && !selectedPortaria.servidor && (
                <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Servidores vinculados</p>
                  <p className="text-sm">{selectedPortaria.servidores_ids.length} servidor(es)</p>
                </div>
              )}

              {/* Vigência */}
              {(selectedPortaria.data_vigencia_inicio || selectedPortaria.data_vigencia_fim) && (
                <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Vigência</p>
                  <p className="text-sm">
                    {selectedPortaria.data_vigencia_inicio && new Date(selectedPortaria.data_vigencia_inicio).toLocaleDateString('pt-BR')}
                    {selectedPortaria.data_vigencia_inicio && selectedPortaria.data_vigencia_fim && ' a '}
                    {selectedPortaria.data_vigencia_fim && new Date(selectedPortaria.data_vigencia_fim).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}

              {/* Conteúdo */}
              {selectedPortariaText && (
                <div className="rounded-lg border bg-muted/20 p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Conteúdo</p>
                  <pre className="whitespace-pre-wrap text-sm text-foreground/80 max-h-[30vh] overflow-auto">
                    {selectedPortariaText}
                  </pre>
                </div>
              )}

              {/* Observações */}
              {selectedPortaria.observacoes && (
                <div className="rounded-lg border bg-muted/20 p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Observações</p>
                  <p className="text-sm text-foreground/80">{selectedPortaria.observacoes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Fechar
            </Button>
            {selectedPortaria && (
              <>
                <Button variant="outline" onClick={() => {
                  setViewDialogOpen(false);
                  handleEdit(selectedPortaria);
                }}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button onClick={() => handleGeneratePdf(selectedPortaria)} disabled={isGeneratingPdf}>
                  <Download className="h-4 w-4 mr-2" />
                  {isGeneratingPdf ? 'Gerando PDF...' : 'Baixar PDF'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
