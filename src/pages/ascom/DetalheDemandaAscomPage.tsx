// ============================================
// PÁGINA DE DETALHE DA DEMANDA ASCOM
// ============================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowLeft, 
  Clock, 
  Calendar, 
  User, 
  Building2, 
  Phone, 
  Mail,
  FileText,
  MessageSquare,
  Download,
  Trash2,
  CheckCircle,
  XCircle,
  PlayCircle,
  Send,
  AlertTriangle,
  Paperclip,
  Link,
  Plus
} from 'lucide-react';

import { ModuleLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

import { useDemandasAscom } from '@/hooks/useDemandasAscom';
import { useAuth } from '@/contexts/AuthContext';
import {
  DemandaAscom,
  AnexoDemandaAscom,
  EntregavelDemandaAscom,
  ComentarioDemandaAscom,
  StatusDemandaAscom,
  STATUS_DEMANDA_LABELS,
  STATUS_DEMANDA_COLORS,
  CATEGORIA_DEMANDA_LABELS,
  TIPO_DEMANDA_LABELS,
  PRIORIDADE_DEMANDA_LABELS,
  PRIORIDADE_DEMANDA_COLORS
} from '@/types/ascom';

export default function DetalheDemandaAscomPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isSuperAdmin, hasAnyPermission } = useAuth();
  
  const {
    demandaAtual,
    loading,
    fetchDemandaPorId,
    alterarStatus,
    autorizarPresidencia,
    fetchAnexos,
    uploadAnexo,
    removerAnexo,
    fetchEntregaveis,
    adicionarEntregavel,
    fetchComentarios,
    adicionarComentario
  } = useDemandasAscom();

  const [anexos, setAnexos] = useState<AnexoDemandaAscom[]>([]);
  const [entregaveis, setEntregaveis] = useState<EntregavelDemandaAscom[]>([]);
  const [comentarios, setComentarios] = useState<ComentarioDemandaAscom[]>([]);
  const [novoComentario, setNovoComentario] = useState('');
  const [comentarioInterno, setComentarioInterno] = useState(false);
  const [justificativaIndeferimento, setJustificativaIndeferimento] = useState('');
  const [dialogIndeferir, setDialogIndeferir] = useState(false);
  const [dialogEntregavel, setDialogEntregavel] = useState(false);
  const [novoEntregavel, setNovoEntregavel] = useState({
    tipo_entregavel: '',
    descricao: '',
    url_arquivo: '',
    link_publicacao: ''
  });

  const isAscom = isSuperAdmin || hasAnyPermission(['ascom.demandas.tratar', 'ascom.demandas.visualizar']);
  const isPresidencia = isSuperAdmin || hasAnyPermission(['aprovacoes.aprovar', 'aprovacoes.presidencia']);

  useEffect(() => {
    if (id) {
      fetchDemandaPorId(id);
      loadDados(id);
    }
  }, [id, fetchDemandaPorId]);

  const loadDados = async (demandaId: string) => {
    const [anexosData, entregaveisData, comentariosData] = await Promise.all([
      fetchAnexos(demandaId),
      fetchEntregaveis(demandaId),
      fetchComentarios(demandaId)
    ]);
    setAnexos(anexosData);
    setEntregaveis(entregaveisData);
    setComentarios(comentariosData);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, tipo: 'solicitacao' | 'entregavel') => {
    if (e.target.files && id) {
      for (const file of Array.from(e.target.files)) {
        const result = await uploadAnexo(id, file, tipo);
        if (result) {
          setAnexos(prev => [result, ...prev]);
        }
      }
    }
  };

  const handleRemoverAnexo = async (anexo: AnexoDemandaAscom) => {
    const success = await removerAnexo(anexo);
    if (success) {
      setAnexos(prev => prev.filter(a => a.id !== anexo.id));
    }
  };

  const handleEnviarComentario = async () => {
    if (!novoComentario.trim() || !id) return;
    
    const tipo = comentarioInterno ? 'interno' : 'comentario';
    const result = await adicionarComentario(id, novoComentario, tipo, !comentarioInterno);
    
    if (result) {
      setComentarios(prev => [...prev, result]);
      setNovoComentario('');
      setComentarioInterno(false);
    }
  };

  const handleAlterarStatus = async (novoStatus: StatusDemandaAscom, justificativa?: string) => {
    if (!id) return;
    
    const result = await alterarStatus(id, novoStatus, justificativa);
    if (result) {
      fetchDemandaPorId(id);
      // Adicionar comentário de status
      await adicionarComentario(id, `Status alterado para: ${STATUS_DEMANDA_LABELS[novoStatus]}${justificativa ? ` - ${justificativa}` : ''}`, 'status', true);
      loadDados(id);
    }
    setDialogIndeferir(false);
  };

  const handleAutorizarPresidencia = async (autorizado: boolean) => {
    if (!id) return;
    
    const result = await autorizarPresidencia(id, autorizado);
    if (result) {
      fetchDemandaPorId(id);
      loadDados(id);
    }
  };

  const handleAdicionarEntregavel = async () => {
    if (!id || !novoEntregavel.tipo_entregavel || !novoEntregavel.descricao) return;
    
    const result = await adicionarEntregavel(id, novoEntregavel);
    if (result) {
      setEntregaveis(prev => [result, ...prev]);
      setNovoEntregavel({ tipo_entregavel: '', descricao: '', url_arquivo: '', link_publicacao: '' });
      setDialogEntregavel(false);
    }
  };

  if (loading) {
    return (
      <ModuleLayout module="comunicacao">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </ModuleLayout>
    );
  }

  if (!demandaAtual) {
    return (
      <ModuleLayout module="comunicacao">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Demanda não encontrada</h2>
          <Button onClick={() => navigate('/ascom/demandas')} className="mt-4">
            Voltar
          </Button>
        </div>
      </ModuleLayout>
    );
  }

  const demanda = demandaAtual;

  return (
    <ModuleLayout module="comunicacao">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/ascom/demandas')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{demanda.numero_demanda}</h1>
                <Badge className={STATUS_DEMANDA_COLORS[demanda.status]}>
                  {STATUS_DEMANDA_LABELS[demanda.status]}
                </Badge>
                <Badge className={PRIORIDADE_DEMANDA_COLORS[demanda.prioridade]}>
                  {PRIORIDADE_DEMANDA_LABELS[demanda.prioridade]}
                </Badge>
                {demanda.requer_autorizacao_presidencia && (
                  <Badge variant="outline" className="border-orange-500 text-orange-500">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Requer autorização
                  </Badge>
                )}
              </div>
              <h2 className="text-xl mt-1">{demanda.titulo}</h2>
              <p className="text-muted-foreground">
                {CATEGORIA_DEMANDA_LABELS[demanda.categoria]} • {TIPO_DEMANDA_LABELS[demanda.tipo]}
              </p>
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-2">
            {demanda.status === 'rascunho' && (
              <Button onClick={() => handleAlterarStatus('enviada')}>
                <Send className="h-4 w-4 mr-2" />
                Enviar
              </Button>
            )}
            
            {demanda.status === 'enviada' && isAscom && (
              <Button onClick={() => handleAlterarStatus('em_analise')}>
                Iniciar Análise
              </Button>
            )}
            
            {demanda.status === 'em_analise' && isAscom && (
              <>
                {demanda.requer_autorizacao_presidencia ? (
                  <Button onClick={() => handleAlterarStatus('aguardando_autorizacao')}>
                    Solicitar Autorização
                  </Button>
                ) : (
                  <Button onClick={() => handleAlterarStatus('aprovada')}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprovar
                  </Button>
                )}
                <Button variant="destructive" onClick={() => setDialogIndeferir(true)}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Indeferir
                </Button>
              </>
            )}
            
            {demanda.status === 'aguardando_autorizacao' && isPresidencia && (
              <>
                <Button onClick={() => handleAutorizarPresidencia(true)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Autorizar
                </Button>
                <Button variant="destructive" onClick={() => handleAutorizarPresidencia(false)}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Não Autorizar
                </Button>
              </>
            )}
            
            {demanda.status === 'aprovada' && isAscom && (
              <Button onClick={() => handleAlterarStatus('em_execucao')}>
                <PlayCircle className="h-4 w-4 mr-2" />
                Iniciar Execução
              </Button>
            )}
            
            {demanda.status === 'em_execucao' && isAscom && (
              <Button onClick={() => handleAlterarStatus('concluida')}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Concluir
              </Button>
            )}
            
            {!['concluida', 'cancelada', 'indeferida'].includes(demanda.status) && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">Cancelar Demanda</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar demanda?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. A demanda será marcada como cancelada.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleAlterarStatus('cancelada')}>
                      Confirmar Cancelamento
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Detalhes */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhes da Demanda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Descrição Detalhada</Label>
                  <p className="mt-1 whitespace-pre-wrap">{demanda.descricao_detalhada}</p>
                </div>
                
                {demanda.objetivo_institucional && (
                  <div>
                    <Label className="text-muted-foreground">Objetivo Institucional</Label>
                    <p className="mt-1">{demanda.objetivo_institucional}</p>
                  </div>
                )}
                
                {demanda.publico_alvo && (
                  <div>
                    <Label className="text-muted-foreground">Público-Alvo</Label>
                    <p className="mt-1">{demanda.publico_alvo}</p>
                  </div>
                )}

                {demanda.justificativa_indeferimento && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <Label className="text-red-600">Justificativa do Indeferimento</Label>
                    <p className="mt-1 text-red-800">{demanda.justificativa_indeferimento}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabs: Anexos, Entregáveis, Comentários */}
            <Card>
              <Tabs defaultValue="anexos">
                <CardHeader>
                  <TabsList>
                    <TabsTrigger value="anexos">
                      <Paperclip className="h-4 w-4 mr-2" />
                      Anexos ({anexos.length})
                    </TabsTrigger>
                    <TabsTrigger value="entregaveis">
                      <FileText className="h-4 w-4 mr-2" />
                      Entregáveis ({entregaveis.length})
                    </TabsTrigger>
                    <TabsTrigger value="comentarios">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Comentários ({comentarios.length})
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent>
                  <TabsContent value="anexos" className="mt-0">
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <input
                          type="file"
                          multiple
                          onChange={(e) => handleFileUpload(e, 'solicitacao')}
                          className="hidden"
                          id="upload-anexo"
                        />
                        <label htmlFor="upload-anexo">
                          <Button variant="outline" size="sm" asChild>
                            <span>
                              <Plus className="h-4 w-4 mr-2" />
                              Adicionar Anexo
                            </span>
                          </Button>
                        </label>
                      </div>
                      
                      {anexos.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">
                          Nenhum anexo adicionado
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {anexos.map((anexo) => (
                            <div 
                              key={anexo.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{anexo.nome_arquivo}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {anexo.tipo_anexo} • {format(new Date(anexo.created_at), 'dd/MM/yyyy HH:mm')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="icon" asChild>
                                  <a href={anexo.url_arquivo} target="_blank" rel="noopener noreferrer">
                                    <Download className="h-4 w-4" />
                                  </a>
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleRemoverAnexo(anexo)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="entregaveis" className="mt-0">
                    <div className="space-y-4">
                      {isAscom && (
                        <Dialog open={dialogEntregavel} onOpenChange={setDialogEntregavel}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Plus className="h-4 w-4 mr-2" />
                              Adicionar Entregável
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Novo Entregável</DialogTitle>
                              <DialogDescription>
                                Registre o material entregue para esta demanda
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Tipo de Entregável</Label>
                                <Input 
                                  value={novoEntregavel.tipo_entregavel}
                                  onChange={(e) => setNovoEntregavel(prev => ({ ...prev, tipo_entregavel: e.target.value }))}
                                  placeholder="Ex: Arte, Foto, Vídeo, Texto..."
                                />
                              </div>
                              <div>
                                <Label>Descrição</Label>
                                <Textarea 
                                  value={novoEntregavel.descricao}
                                  onChange={(e) => setNovoEntregavel(prev => ({ ...prev, descricao: e.target.value }))}
                                  placeholder="Descreva o entregável..."
                                />
                              </div>
                              <div>
                                <Label>Link de Publicação (opcional)</Label>
                                <Input 
                                  value={novoEntregavel.link_publicacao}
                                  onChange={(e) => setNovoEntregavel(prev => ({ ...prev, link_publicacao: e.target.value }))}
                                  placeholder="https://..."
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button onClick={handleAdicionarEntregavel}>Adicionar</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                      
                      {entregaveis.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">
                          Nenhum entregável registrado
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {entregaveis.map((entregavel) => (
                            <div 
                              key={entregavel.id}
                              className="p-3 border rounded-lg"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <Badge variant="outline">{entregavel.tipo_entregavel}</Badge>
                                  <p className="mt-2">{entregavel.descricao}</p>
                                  {entregavel.link_publicacao && (
                                    <a 
                                      href={entregavel.link_publicacao} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-2"
                                    >
                                      <Link className="h-3 w-3" />
                                      Ver publicação
                                    </a>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(entregavel.data_entrega), 'dd/MM/yyyy')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="comentarios" className="mt-0">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Textarea 
                          value={novoComentario}
                          onChange={(e) => setNovoComentario(e.target.value)}
                          placeholder="Escreva um comentário..."
                          className="min-h-[80px]"
                        />
                        <div className="flex items-center justify-between">
                          {isAscom && (
                            <div className="flex items-center gap-2">
                              <Checkbox 
                                id="interno"
                                checked={comentarioInterno}
                                onCheckedChange={(checked) => setComentarioInterno(!!checked)}
                              />
                              <label htmlFor="interno" className="text-sm text-muted-foreground">
                                Comentário interno (visível apenas para ASCOM)
                              </label>
                            </div>
                          )}
                          <Button onClick={handleEnviarComentario} disabled={!novoComentario.trim()}>
                            Enviar
                          </Button>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-3">
                          {comentarios.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">
                              Nenhum comentário
                            </p>
                          ) : (
                            comentarios.map((comentario) => (
                              <div 
                                key={comentario.id}
                                className={`p-3 rounded-lg ${
                                  comentario.tipo === 'interno' 
                                    ? 'bg-yellow-50 border border-yellow-200' 
                                    : comentario.tipo === 'status'
                                    ? 'bg-blue-50 border border-blue-200'
                                    : 'bg-muted'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    {comentario.tipo === 'interno' && (
                                      <Badge variant="outline" className="text-xs">Interno</Badge>
                                    )}
                                    {comentario.tipo === 'status' && (
                                      <Badge variant="outline" className="text-xs">Sistema</Badge>
                                    )}
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(comentario.created_at), 'dd/MM/yyyy HH:mm')}
                                  </span>
                                </div>
                                <p className="text-sm">{comentario.conteudo}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Informações do Solicitante */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Solicitante</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{demanda.nome_responsavel}</span>
                </div>
                {demanda.cargo_funcao && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{demanda.cargo_funcao}</span>
                  </div>
                )}
                {demanda.unidade_solicitante && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{demanda.unidade_solicitante.sigla} - {demanda.unidade_solicitante.nome}</span>
                  </div>
                )}
                {demanda.contato_telefone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{demanda.contato_telefone}</span>
                  </div>
                )}
                {demanda.contato_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{demanda.contato_email}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Datas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Datas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Criada em</span>
                  <span>{format(new Date(demanda.created_at), 'dd/MM/yyyy HH:mm')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Prazo</span>
                  <span className={
                    new Date(demanda.prazo_entrega) < new Date() && 
                    !['concluida', 'cancelada', 'indeferida'].includes(demanda.status)
                      ? 'text-red-600 font-medium'
                      : ''
                  }>
                    {format(new Date(demanda.prazo_entrega), 'dd/MM/yyyy')}
                  </span>
                </div>
                {demanda.data_evento && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Evento</span>
                    <span>
                      {format(new Date(demanda.data_evento), 'dd/MM/yyyy')}
                      {demanda.hora_evento && ` às ${demanda.hora_evento}`}
                    </span>
                  </div>
                )}
                {demanda.local_evento && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Local</span>
                    <span className="text-right text-sm">{demanda.local_evento}</span>
                  </div>
                )}
                {demanda.data_conclusao && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Concluída em</span>
                    <span>{format(new Date(demanda.data_conclusao), 'dd/MM/yyyy HH:mm')}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Observações Internas */}
            {isAscom && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Observações Internas</CardTitle>
                  <CardDescription>Visível apenas para ASCOM</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea 
                    value={demanda.observacoes_internas_ascom || ''}
                    placeholder="Adicione observações internas..."
                    className="min-h-[100px]"
                    disabled
                  />
                </CardContent>
              </Card>
            )}

            {/* Histórico de Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Histórico</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {(demanda.historico_status || []).map((item, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {format(new Date(item.data), 'dd/MM HH:mm')}
                        </span>
                        <span>→</span>
                        <Badge className={`text-xs ${STATUS_DEMANDA_COLORS[item.status_novo]}`}>
                          {STATUS_DEMANDA_LABELS[item.status_novo]}
                        </Badge>
                      </div>
                    ))}
                    {(!demanda.historico_status || demanda.historico_status.length === 0) && (
                      <p className="text-sm text-muted-foreground">Nenhuma alteração registrada</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialog de Indeferimento */}
      <Dialog open={dialogIndeferir} onOpenChange={setDialogIndeferir}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Indeferir Demanda</DialogTitle>
            <DialogDescription>
              Informe o motivo do indeferimento
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Justificativa *</Label>
            <Textarea 
              value={justificativaIndeferimento}
              onChange={(e) => setJustificativaIndeferimento(e.target.value)}
              placeholder="Descreva o motivo do indeferimento..."
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogIndeferir(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => handleAlterarStatus('indeferida', justificativaIndeferimento)}
              disabled={!justificativaIndeferimento.trim()}
            >
              Confirmar Indeferimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
