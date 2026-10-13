/**
 * Detalhe do processo acompanhado: etapas, checklist, ações e abas (linha do tempo, despachos, documentos, credenciais).
 * Só leitura nas tabelas; toda escrita vai pelas RPCs wf_* (hooks de useAcompanhamentoProcessos).
 */
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ModuleLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, PageHeader, StatusBadge, type TomStatus } from '@/components/design-system';
import {
  AlertTriangle, ArrowLeft, FileText, Clock, MessageSquare, Paperclip, User, FolderOpen, KeyRound, Pencil, RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useMovimentacoes, useDespachos, useDocumentosProcesso } from '@/hooks/useWorkflow';
import {
  useAtualizarNumeroSei,
  useChecklistProcesso,
  useModeloProcesso,
  useProcessoAcompanhamento,
} from '@/hooks/useAcompanhamentoProcessos';
import { rotuloSituacaoPrazo, tomStatusDoSemaforo } from '@/lib/workflow/semaforoPrazo';
import {
  TIPO_PROCESSO_LABELS,
  TIPO_MOVIMENTACAO_LABELS,
  TIPO_DESPACHO_LABELS,
  DECISAO_LABELS,
  type NivelSigilo,
  type ProcessoAcompanhamento,
  type StatusMovimentacao,
  type StatusProcesso,
} from '@/types/workflow';
import { TrilhaEtapas } from '@/components/workflow/TrilhaEtapas';
import { ChecklistEtapa } from '@/components/workflow/ChecklistEtapa';
import { AcoesProcesso } from '@/components/workflow/AcoesProcesso';
import { CredenciaisSigiloTab } from '@/components/workflow/CredenciaisSigiloTab';

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

/** Nº SEI do cabeçalho; editável só com workflow.tramitar, em andamento e na etapa 1 (ou sem modelo). */
function NumeroSei({ processo, editavel }: { processo: ProcessoAcompanhamento; editavel: boolean }) {
  const atualizar = useAtualizarNumeroSei();
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState('');

  if (editando) {
    return (
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          atualizar.mutate(
            { processoId: processo.id, numeroSei: valor.trim() || null },
            { onSuccess: () => setEditando(false) },
          );
        }}
      >
        <Input
          aria-label="Número SEI"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="h-8 w-56"
          autoFocus
        />
        <Button type="submit" size="sm" disabled={atualizar.isPending}>Salvar</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setEditando(false)} disabled={atualizar.isPending}>
          Cancelar
        </Button>
      </form>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <span className="font-medium">{processo.numero_sei || 'Não informado'}</span>
      {editavel && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => { setValor(processo.numero_sei ?? ''); setEditando(true); }}
          aria-label="Editar número SEI"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </Button>
      )}
    </span>
  );
}

export default function ProcessoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = useAuth();

  const {
    data: processo,
    isLoading: loadingProcesso,
    isError: erroProcesso,
    refetch: recarregarProcesso,
    isFetching: recarregandoProcesso,
  } = useProcessoAcompanhamento(id ?? '');
  const { data: modelo, isLoading: loadingModelo, isError: erroModelo } = useModeloProcesso(processo?.modelo_codigo ?? '');
  const { data: respostas } = useChecklistProcesso(id ?? '');
  const { data: movimentacoes, isLoading: loadingMovimentacoes } = useMovimentacoes(id);
  const { data: despachos } = useDespachos(id);
  const { data: documentos } = useDocumentosProcesso(id);

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

  // falha na consulta (rede, servidor) não é "não encontrado": mostra o erro e deixa tentar de novo
  if (erroProcesso) {
    return (
      <ModuleLayout module="workflow">
        <div className="space-y-6">
          <PageHeader migalhas={[...MIGALHAS_BASE, { rotulo: 'Processo' }]} titulo="Processo" />
          <EmptyState
            icone={AlertTriangle}
            titulo="Não foi possível carregar o processo"
            descricao="Verifique a conexão e tente de novo."
            acao={
              <Button variant="outline" onClick={() => recarregarProcesso()} disabled={recarregandoProcesso}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Tentar de novo
              </Button>
            }
          />
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

  const numeroProcesso = processo.numero_formatado || `${processo.numero_processo}/${processo.ano}`;
  const seloStatus = selo(STATUS_PROCESSO_SELO, processo.status, 'Sem situação');
  const seloSigilo = selo(SIGILO_SELO, processo.sigilo, 'Sem sigilo');
  const andamento = processo.status === 'aberto' || processo.status === 'em_tramitacao';
  const temModelo = !!processo.modelo_id && processo.etapa_atual_ordem != null;
  const prazo = rotuloSituacaoPrazo(processo.situacao_prazo);
  const podeEditarSei =
    andamento && hasPermission('workflow.tramitar') && (!temModelo || processo.etapa_atual_ordem === 1);
  const podeMarcar = andamento && hasPermission('workflow.tramitar');
  const podeVerCredenciais = hasPermission('workflow.admin');

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
              {andamento && temModelo && processo.situacao_prazo !== 'sem_prazo' && (
                <StatusBadge tom={tomStatusDoSemaforo(prazo.tom)}>{prazo.texto}</StatusBadge>
              )}
            </>
          }
        />

        {/* Dados principais */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <dl className="space-y-1">
                <dt className="text-body text-muted-foreground">Nº SEI</dt>
                <dd><NumeroSei processo={processo} editavel={podeEditarSei} /></dd>
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <dl className="space-y-1">
                <dt className="text-body text-muted-foreground">Etapa atual</dt>
                <dd>
                  <span className="block font-medium">
                    {temModelo ? `${processo.etapa_atual_ordem} de ${processo.etapa_total}` : 'Sem modelo de fluxo'}
                  </span>
                  {temModelo && (
                    <span className="block text-caption text-muted-foreground">{processo.etapa_nome}</span>
                  )}
                </dd>
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <dl className="space-y-1">
                <dt className="text-body text-muted-foreground">Unidade</dt>
                <dd className="font-medium">{processo.unidade_sigla || processo.unidade_nome || 'Não definida'}</dd>
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <dl className="space-y-1">
                <dt className="text-body text-muted-foreground">Interessado</dt>
                <dd>
                  <span className="block font-medium truncate">{processo.interessado_nome}</span>
                  <span className="block text-caption text-muted-foreground capitalize">
                    {TIPO_PROCESSO_LABELS[processo.tipo_processo] ?? processo.tipo_processo} • {processo.interessado_tipo} • aberto em{' '}
                    {format(new Date(processo.data_abertura), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                </dd>
              </dl>
            </CardContent>
          </Card>
        </div>

        <AcoesProcesso processo={processo} etapas={modelo?.etapas ?? []} />

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <h2 className="text-h3 text-foreground">Etapas</h2>
            </CardHeader>
            <CardContent>
              <TrilhaEtapas modelo={modelo} processo={processo} carregando={loadingModelo} erro={erroModelo} />
            </CardContent>
          </Card>
          {temModelo && modelo && (
            <Card>
              <CardHeader>
                <h2 className="text-h3 text-foreground">Checklist</h2>
              </CardHeader>
              <CardContent>
                <ChecklistEtapa
                  processoId={processo.id}
                  itens={modelo.checklist}
                  respostas={respostas ?? []}
                  etapaAtual={processo.etapa_atual_ordem ?? 0}
                  podeMarcar={podeMarcar}
                />
              </CardContent>
            </Card>
          )}
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
            {podeVerCredenciais && (
              <TabsTrigger value="credenciais" className="gap-2">
                <KeyRound className="h-4 w-4" aria-hidden="true" />
                Credenciais
              </TabsTrigger>
            )}
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
                                    {TIPO_MOVIMENTACAO_LABELS[mov.tipo_movimentacao] ?? mov.tipo_movimentacao}
                                  </Badge>
                                  <StatusBadge tom={selo(STATUS_MOVIMENTACAO_SELO, mov.status, 'Sem situação').tom}>
                                    {selo(STATUS_MOVIMENTACAO_SELO, mov.status, 'Sem situação').label}
                                  </StatusBadge>
                                </div>
                                <p className="mt-1 text-sm">{mov.descricao}</p>
                                {mov.etapa_destino_ordem != null && mov.etapa_destino_ordem !== mov.etapa_origem_ordem && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Etapa {mov.etapa_origem_ordem ?? '-'} → etapa {mov.etapa_destino_ordem}
                                  </p>
                                )}
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

          {podeVerCredenciais && (
            <TabsContent value="credenciais">
              <Card>
                <CardHeader>
                  <h2 className="text-h3 text-foreground">Credenciais de acesso</h2>
                </CardHeader>
                <CardContent>
                  <CredenciaisSigiloTab processoId={processo.id} sigilo={processo.sigilo} />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

    </ModuleLayout>
  );
}
