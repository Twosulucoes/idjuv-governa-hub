/**
 * Página de detalhes do processo administrativo
 */
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ModuleLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, PageHeader, StatusBadge, type TomStatus } from '@/components/design-system';
import {
  ArrowLeft, FileText, Clock, Send, MessageSquare,
  Paperclip, AlertTriangle, CheckCircle, User, FolderOpen
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useProcesso, 
  useMovimentacoes, 
  useDespachos, 
  useDocumentosProcesso,
  usePrazosProcesso 
} from '@/hooks/useWorkflow';
import {
  TIPO_PROCESSO_LABELS,
  TIPO_MOVIMENTACAO_LABELS,
  TIPO_DESPACHO_LABELS,
  DECISAO_LABELS,
  type NivelSigilo,
  type StatusMovimentacao,
  type StatusProcesso,
} from '@/types/workflow';
import { NovoDespachoDialog } from '@/components/workflow/NovoDespachoDialog';
import { NovaMovimentacaoDialog } from '@/components/workflow/NovaMovimentacaoDialog';

type Selo = { label: string; tom: TomStatus };

// Situações → selo (texto + tom; nunca só cor)
const STATUS_PROCESSO_SELO: Record<StatusProcesso, Selo> = {
  aberto: { label: 'Aberto', tom: 'andamento' },
  em_tramitacao: { label: 'Em tramitação', tom: 'pendente' },
  suspenso: { label: 'Suspenso', tom: 'neutro' },
  concluido: { label: 'Concluído', tom: 'sucesso' },
  arquivado: { label: 'Arquivado', tom: 'neutro' },
};

const SIGILO_SELO: Record<NivelSigilo, Selo> = {
  publico: { label: 'Público', tom: 'sucesso' },
  restrito: { label: 'Restrito', tom: 'pendente' },
  sigiloso: { label: 'Sigiloso', tom: 'erro' },
};

const STATUS_MOVIMENTACAO_SELO: Record<StatusMovimentacao, Selo> = {
  pendente: { label: 'Pendente', tom: 'pendente' },
  recebido: { label: 'Recebido', tom: 'andamento' },
  respondido: { label: 'Respondido', tom: 'sucesso' },
  vencido: { label: 'Vencido', tom: 'erro' },
  cancelado: { label: 'Cancelado', tom: 'neutro' },
};

function selo<K extends string>(mapa: Record<K, Selo>, valor: K | null | undefined, vazio: string): Selo {
  return (valor && mapa[valor]) ?? { label: valor ?? vazio, tom: 'neutro' };
}

const MIGALHAS_BASE = [
  { rotulo: 'Processos', href: '/workflow' },
  { rotulo: 'Gestão de processos', href: '/workflow/processos' },
];

export default function ProcessoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const [despachoDialogOpen, setDespachoDialogOpen] = useState(false);
  const [movimentacaoDialogOpen, setMovimentacaoDialogOpen] = useState(false);

  const { data: processo, isLoading: loadingProcesso } = useProcesso(id);
  const { data: movimentacoes, isLoading: loadingMovimentacoes } = useMovimentacoes(id);
  const { data: despachos } = useDespachos(id);
  const { data: documentos } = useDocumentosProcesso(id);
  const { data: prazos } = usePrazosProcesso(id);

  const prazosVencidos = prazos?.filter(p => !p.cumprido && new Date(p.data_limite) < new Date()).length || 0;

  if (loadingProcesso) {
    return (
      <ModuleLayout module="workflow">
        <div className="space-y-4" aria-busy="true">
          <PageHeader migalhas={[...MIGALHAS_BASE, { rotulo: 'Processo' }]} titulo="Carregando processo…" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </ModuleLayout>
    );
  }

  if (!processo) {
    return (
      <ModuleLayout module="workflow">
        <div className="space-y-6">
          <PageHeader migalhas={[...MIGALHAS_BASE, { rotulo: 'Processo' }]} titulo="Processo não encontrado" />
          <EmptyState
            icone={FolderOpen}
            titulo="Processo não encontrado"
            descricao="O processo pode ter sido removido ou você não tem acesso a ele."
            acao={
              <Button asChild variant="outline">
                <Link to="/workflow/processos">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Voltar para lista
                </Link>
              </Button>
            }
          />
        </div>
      </ModuleLayout>
    );
  }

  const numeroProcesso = `${processo.numero_processo}/${processo.ano}`;
  const seloStatus = selo(STATUS_PROCESSO_SELO, processo.status, 'Sem situação');
  const seloSigilo = selo(SIGILO_SELO, processo.sigilo, 'Sem sigilo');

  return (
    <ModuleLayout module="workflow">
      <div className="space-y-6">
        <PageHeader
          migalhas={[...MIGALHAS_BASE, { rotulo: numeroProcesso }]}
          titulo={`Processo ${numeroProcesso}`}
          descricao={processo.assunto}
          status={
            <>
              <StatusBadge tom={seloStatus.tom}>{seloStatus.label}</StatusBadge>
              <StatusBadge tom={seloSigilo.tom}>{seloSigilo.label}</StatusBadge>
            </>
          }
          acoes={
            <>
              <Button variant="outline" onClick={() => setMovimentacaoDialogOpen(true)}>
                <Send className="h-4 w-4" aria-hidden="true" />
                Tramitar
              </Button>
              <Button onClick={() => setDespachoDialogOpen(true)}>
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                Despachar
              </Button>
            </>
          }
        />

        {/* Dados principais */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <dl className="space-y-1">
                <dt className="text-body text-muted-foreground">Tipo</dt>
                <dd className="font-medium">{TIPO_PROCESSO_LABELS[processo.tipo_processo] ?? processo.tipo_processo}</dd>
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <dl className="space-y-1">
                <dt className="text-body text-muted-foreground">Interessado</dt>
                <dd>
                  <span className="block font-medium truncate">{processo.interessado_nome}</span>
                  <span className="block text-caption text-muted-foreground capitalize">{processo.interessado_tipo}</span>
                </dd>
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <dl className="space-y-1">
                <dt className="text-body text-muted-foreground">Abertura</dt>
                <dd className="font-medium">
                  {format(new Date(processo.data_abertura), 'dd/MM/yyyy', { locale: ptBR })}
                </dd>
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <dl className="space-y-1">
                <dt className="text-body text-muted-foreground">Prazos</dt>
                <dd>
                  {prazosVencidos > 0 ? (
                    <StatusBadge tom="erro">{prazosVencidos} vencido(s)</StatusBadge>
                  ) : (
                    <StatusBadge tom="sucesso">Em dia</StatusBadge>
                  )}
                </dd>
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="timeline" className="space-y-4">
          <TabsList>
            <TabsTrigger value="timeline" className="gap-2">
              <Clock className="h-4 w-4" aria-hidden="true" />
              Linha do tempo ({movimentacoes?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="despachos" className="gap-2">
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
              Despachos ({despachos?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="documentos" className="gap-2">
              <Paperclip className="h-4 w-4" aria-hidden="true" />
              Documentos ({documentos?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="prazos" className="gap-2">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              Prazos ({prazos?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Timeline */}
          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <h2 className="text-h3 text-foreground">Histórico de movimentações</h2>
              </CardHeader>
              <CardContent>
                {loadingMovimentacoes ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : movimentacoes?.length === 0 ? (
                  <EmptyState icone={Clock} titulo="Nenhuma movimentação registrada" />
                ) : (
                  <div className="relative space-y-6">
                    <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" aria-hidden="true" />
                    {movimentacoes?.map((mov) => (
                      <div key={mov.id} className="relative pl-10">
                        <div className="absolute left-2 top-2 w-4 h-4 rounded-full bg-primary border-2 border-background" aria-hidden="true" />
                        <Card>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">#{mov.numero_sequencial}</span>
                                  <Badge variant="outline">
                                    {TIPO_MOVIMENTACAO_LABELS[mov.tipo_movimentacao]}
                                  </Badge>
                                  <StatusBadge tom={selo(STATUS_MOVIMENTACAO_SELO, mov.status, 'Sem situação').tom}>
                                    {selo(STATUS_MOVIMENTACAO_SELO, mov.status, 'Sem situação').label}
                                  </StatusBadge>
                                </div>
                                <p className="mt-1 text-sm">{mov.descricao}</p>
                                {mov.unidade_destino && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Destino: {mov.unidade_destino.sigla || mov.unidade_destino.nome}
                                  </p>
                                )}
                              </div>
                              <div className="text-right text-sm text-muted-foreground">
                                {format(new Date(mov.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Despachos */}
          <TabsContent value="despachos">
            <Card>
              <CardHeader>
                <h2 className="text-h3 text-foreground">Despachos</h2>
              </CardHeader>
              <CardContent>
                {despachos?.length === 0 ? (
                  <EmptyState icone={MessageSquare} titulo="Nenhum despacho registrado" />
                ) : (
                  <div className="space-y-4">
                    {despachos?.map((despacho) => (
                      <Card key={despacho.id} className="bg-muted/30">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Despacho #{despacho.numero_despacho}</span>
                              <Badge variant="outline">
                                {TIPO_DESPACHO_LABELS[despacho.tipo_despacho]}
                              </Badge>
                              {despacho.decisao && (
                                <Badge>{DECISAO_LABELS[despacho.decisao]}</Badge>
                              )}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(despacho.data_despacho), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          </div>
                          <div className="prose prose-sm max-w-none">
                            <p>{despacho.texto_despacho}</p>
                          </div>
                          {despacho.fundamentacao_legal && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Fundamentação: {despacho.fundamentacao_legal}
                            </p>
                          )}
                          {despacho.autoridade && (
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                              <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                              <span className="text-sm">{despacho.autoridade.nome_completo}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documentos */}
          <TabsContent value="documentos">
            <Card>
              <CardHeader>
                <h2 className="text-h3 text-foreground">Documentos anexados</h2>
              </CardHeader>
              <CardContent>
                {documentos?.length === 0 ? (
                  <EmptyState icone={Paperclip} titulo="Nenhum documento anexado" />
                ) : (
                  <div className="space-y-2">
                    {documentos?.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <FileText className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                        <div className="flex-1">
                          <p className="font-medium">{doc.titulo}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.numero_documento && `Nº ${doc.numero_documento} • `}
                            {format(new Date(doc.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        </div>
                        {doc.arquivo_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={doc.arquivo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Abrir documento ${doc.titulo} (abre em nova aba)`}
                            >
                              Abrir
                            </a>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prazos */}
          <TabsContent value="prazos">
            <Card>
              <CardHeader>
                <h2 className="text-h3 text-foreground">Controle de prazos</h2>
              </CardHeader>
              <CardContent>
                {prazos?.length === 0 ? (
                  <EmptyState icone={AlertTriangle} titulo="Nenhum prazo registrado" />
                ) : (
                  <div className="space-y-2">
                    {prazos?.map((prazo) => {
                      const vencido = !prazo.cumprido && new Date(prazo.data_limite) < new Date();
                      return (
                        <div 
                          key={prazo.id} 
                          className={`flex items-center gap-3 p-3 rounded-lg border ${
                            prazo.cumprido ? 'bg-success/10 border-success/30' : 
                            vencido ? 'bg-destructive/10 border-destructive/30' : ''
                          }`}
                        >
                          {prazo.cumprido ? (
                            <CheckCircle className="h-5 w-5 text-success" aria-hidden="true" />
                          ) : vencido ? (
                            <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
                          ) : (
                            <Clock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{prazo.descricao}</p>
                            <p className="text-xs text-muted-foreground">
                              Limite: {format(new Date(prazo.data_limite), 'dd/MM/yyyy', { locale: ptBR })}
                              {prazo.base_legal && ` • ${prazo.base_legal}`}
                            </p>
                          </div>
                          {vencido && <StatusBadge tom="erro">Vencido</StatusBadge>}
                          {prazo.cumprido && (
                            <StatusBadge tom="sucesso">
                              Cumprido em {format(new Date(prazo.data_cumprimento!), 'dd/MM/yyyy', { locale: ptBR })}
                            </StatusBadge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <NovoDespachoDialog
        open={despachoDialogOpen}
        onOpenChange={setDespachoDialogOpen}
        processoId={id!}
      />

      <NovaMovimentacaoDialog
        open={movimentacaoDialogOpen}
        onOpenChange={setMovimentacaoDialogOpen}
        processoId={id!}
      />
    </ModuleLayout>
  );
}
