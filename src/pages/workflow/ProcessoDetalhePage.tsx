/**
 * Página de detalhes do processo administrativo
 */
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ModuleLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, FileText, Clock, Send, MessageSquare, 
  Paperclip, AlertTriangle, CheckCircle, User
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
  STATUS_PROCESSO_LABELS,
  STATUS_PROCESSO_COLORS,
  SIGILO_LABELS,
  SIGILO_COLORS,
  TIPO_MOVIMENTACAO_LABELS,
  STATUS_MOVIMENTACAO_LABELS,
  STATUS_MOVIMENTACAO_COLORS,
  TIPO_DESPACHO_LABELS,
  DECISAO_LABELS,
} from '@/types/workflow';
import { NovoDespachoDialog } from '@/components/workflow/NovoDespachoDialog';
import { NovaMovimentacaoDialog } from '@/components/workflow/NovaMovimentacaoDialog';

export default function ProcessoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </ModuleLayout>
    );
  }

  if (!processo) {
    return (
      <ModuleLayout module="workflow">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Processo não encontrado</h2>
          <Button className="mt-4" onClick={() => navigate('/admin/workflow')}>
            Voltar para lista
          </Button>
        </div>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout module="workflow">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/workflow')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                Processo {processo.numero_processo}/{processo.ano}
              </h1>
              <Badge className={STATUS_PROCESSO_COLORS[processo.status]}>
                {STATUS_PROCESSO_LABELS[processo.status]}
              </Badge>
              <Badge className={SIGILO_COLORS[processo.sigilo]}>
                {SIGILO_LABELS[processo.sigilo]}
              </Badge>
            </div>
            <p className="text-muted-foreground">{processo.assunto}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setMovimentacaoDialogOpen(true)}>
              <Send className="h-4 w-4 mr-2" />
              Tramitar
            </Button>
            <Button onClick={() => setDespachoDialogOpen(true)}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Despachar
            </Button>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-medium">{TIPO_PROCESSO_LABELS[processo.tipo_processo]}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Interessado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-medium truncate">{processo.interessado_nome}</div>
              <div className="text-xs text-muted-foreground capitalize">{processo.interessado_tipo}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Abertura</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="font-medium">
                {format(new Date(processo.data_abertura), 'dd/MM/yyyy', { locale: ptBR })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Prazos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {prazosVencidos > 0 ? (
                  <>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="font-medium text-red-600">{prazosVencidos} vencido(s)</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-green-600">Em dia</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="timeline" className="space-y-4">
          <TabsList>
            <TabsTrigger value="timeline" className="gap-2">
              <Clock className="h-4 w-4" />
              Linha do Tempo ({movimentacoes?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="despachos" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Despachos ({despachos?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="documentos" className="gap-2">
              <Paperclip className="h-4 w-4" />
              Documentos ({documentos?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="prazos" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Prazos ({prazos?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Timeline */}
          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Movimentações</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingMovimentacoes ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : movimentacoes?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma movimentação registrada
                  </p>
                ) : (
                  <div className="relative space-y-6">
                    <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />
                    {movimentacoes?.map((mov, index) => (
                      <div key={mov.id} className="relative pl-10">
                        <div className="absolute left-2 top-2 w-4 h-4 rounded-full bg-primary border-2 border-background" />
                        <Card>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">#{mov.numero_sequencial}</span>
                                  <Badge variant="outline">
                                    {TIPO_MOVIMENTACAO_LABELS[mov.tipo_movimentacao]}
                                  </Badge>
                                  <Badge className={STATUS_MOVIMENTACAO_COLORS[mov.status]}>
                                    {STATUS_MOVIMENTACAO_LABELS[mov.status]}
                                  </Badge>
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
                <CardTitle>Despachos</CardTitle>
              </CardHeader>
              <CardContent>
                {despachos?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum despacho registrado
                  </p>
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
                              <User className="h-4 w-4 text-muted-foreground" />
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
                <CardTitle>Documentos Anexados</CardTitle>
              </CardHeader>
              <CardContent>
                {documentos?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum documento anexado
                  </p>
                ) : (
                  <div className="space-y-2">
                    {documentos?.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium">{doc.titulo}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.numero_documento && `Nº ${doc.numero_documento} • `}
                            {format(new Date(doc.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </p>
                        </div>
                        {doc.arquivo_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={doc.arquivo_url} target="_blank" rel="noopener noreferrer">
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
                <CardTitle>Controle de Prazos</CardTitle>
              </CardHeader>
              <CardContent>
                {prazos?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum prazo registrado
                  </p>
                ) : (
                  <div className="space-y-2">
                    {prazos?.map((prazo) => {
                      const vencido = !prazo.cumprido && new Date(prazo.data_limite) < new Date();
                      return (
                        <div 
                          key={prazo.id} 
                          className={`flex items-center gap-3 p-3 rounded-lg border ${
                            prazo.cumprido ? 'bg-green-50 border-green-200' : 
                            vencido ? 'bg-red-50 border-red-200' : ''
                          }`}
                        >
                          {prazo.cumprido ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : vencido ? (
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                          ) : (
                            <Clock className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{prazo.descricao}</p>
                            <p className="text-xs text-muted-foreground">
                              Limite: {format(new Date(prazo.data_limite), 'dd/MM/yyyy', { locale: ptBR })}
                              {prazo.base_legal && ` • ${prazo.base_legal}`}
                            </p>
                          </div>
                          {prazo.cumprido && (
                            <Badge variant="outline" className="text-green-600">
                              Cumprido em {format(new Date(prazo.data_cumprimento!), 'dd/MM/yyyy', { locale: ptBR })}
                            </Badge>
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
