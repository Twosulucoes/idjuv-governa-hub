// ============================================
// PÁGINA PÚBLICA DE CONSULTA DE PROTOCOLO ASCOM
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Search, 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Calendar,
  User,
  Building2,
  Phone,
  Mail,
  ExternalLink,
  Download,
  MessageSquare,
  Package,
  Megaphone,
  ArrowLeft
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LogoIdjuv } from '@/components/ui/LogoIdjuv';

import {
  DemandaAscom,
  AnexoDemandaAscom,
  EntregavelDemandaAscom,
  ComentarioDemandaAscom,
  STATUS_DEMANDA_LABELS,
  STATUS_DEMANDA_COLORS,
  CATEGORIA_DEMANDA_LABELS,
  TIPO_DEMANDA_LABELS,
  PRIORIDADE_DEMANDA_LABELS,
  PRIORIDADE_DEMANDA_COLORS,
  StatusDemandaAscom
} from '@/types/ascom';

// Ícones de status
const STATUS_ICONS: Record<StatusDemandaAscom, React.ReactNode> = {
  rascunho: <FileText className="h-4 w-4" />,
  enviada: <Clock className="h-4 w-4" />,
  em_analise: <Search className="h-4 w-4" />,
  aguardando_autorizacao: <AlertCircle className="h-4 w-4" />,
  aprovada: <CheckCircle2 className="h-4 w-4" />,
  em_execucao: <Clock className="h-4 w-4" />,
  concluida: <CheckCircle2 className="h-4 w-4" />,
  indeferida: <XCircle className="h-4 w-4" />,
  cancelada: <XCircle className="h-4 w-4" />
};

export default function ConsultaProtocoloAscomPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [protocolo, setProtocolo] = useState(searchParams.get('protocolo') || '');
  const [loading, setLoading] = useState(false);
  const [demanda, setDemanda] = useState<DemandaAscom | null>(null);
  const [anexos, setAnexos] = useState<AnexoDemandaAscom[]>([]);
  const [entregaveis, setEntregaveis] = useState<EntregavelDemandaAscom[]>([]);
  const [comentarios, setComentarios] = useState<ComentarioDemandaAscom[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [buscaRealizada, setBuscaRealizada] = useState(false);

  // Buscar automaticamente se protocolo vier na URL
  useEffect(() => {
    const protocoloParam = searchParams.get('protocolo');
    if (protocoloParam) {
      setProtocolo(protocoloParam);
      buscarDemanda(protocoloParam);
    }
  }, [searchParams]);

  const buscarDemanda = async (numeroProtocolo: string) => {
    if (!numeroProtocolo.trim()) {
      setErro('Digite o número do protocolo');
      return;
    }

    setLoading(true);
    setErro(null);
    setBuscaRealizada(true);

    try {
      // Buscar demanda pelo número
      const { data: demandaData, error: demandaError } = await (supabase as any)
        .from('demandas_ascom')
        .select(`
          *,
          unidade_solicitante:estrutura_organizacional(id, nome, sigla)
        `)
        .eq('numero_demanda', numeroProtocolo.trim().toUpperCase())
        .single();

      if (demandaError || !demandaData) {
        setDemanda(null);
        setErro('Protocolo não encontrado. Verifique o número e tente novamente.');
        return;
      }

      setDemanda(demandaData as DemandaAscom);

      // Buscar anexos (apenas de solicitação)
      const { data: anexosData } = await (supabase as any)
        .from('demandas_ascom_anexos')
        .select('*')
        .eq('demanda_id', demandaData.id)
        .eq('tipo_anexo', 'solicitacao')
        .order('created_at', { ascending: false });

      setAnexos(anexosData || []);

      // Buscar entregáveis
      const { data: entregaveisData } = await (supabase as any)
        .from('demandas_ascom_entregaveis')
        .select('*')
        .eq('demanda_id', demandaData.id)
        .order('created_at', { ascending: false });

      setEntregaveis(entregaveisData || []);

      // Buscar comentários visíveis ao solicitante
      const { data: comentariosData } = await (supabase as any)
        .from('demandas_ascom_comentarios')
        .select('*')
        .eq('demanda_id', demandaData.id)
        .eq('visivel_solicitante', true)
        .order('created_at', { ascending: true });

      setComentarios(comentariosData || []);

    } catch (error: any) {
      console.error('Erro na busca:', error);
      setErro('Erro ao buscar protocolo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    buscarDemanda(protocolo);
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    try {
      return format(parseISO(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return date;
    }
  };

  const formatDateShort = (date: string | null | undefined) => {
    if (!date) return '-';
    try {
      return format(parseISO(date), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return date;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoIdjuv className="h-10 w-auto" />
            <div>
              <h1 className="font-semibold text-lg">IDJuv - ASCOM</h1>
              <p className="text-sm text-muted-foreground">Consulta de Protocolo</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/ascom/solicitar')}>
            Nova Solicitação
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4 mx-auto w-fit">
              <Search className="h-5 w-5" />
              <span className="font-medium">Consulta de Protocolo</span>
            </div>
            <CardTitle className="text-2xl">Acompanhe sua Solicitação</CardTitle>
            <CardDescription>
              Digite o número do protocolo recebido para verificar o andamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex gap-3 max-w-md mx-auto">
              <Input
                placeholder="Ex: 0001/2025-ASCOM"
                value={protocolo}
                onChange={(e) => setProtocolo(e.target.value.toUpperCase())}
                className="text-center font-mono text-lg"
              />
              <Button type="submit" disabled={loading}>
                {loading ? 'Buscando...' : 'Buscar'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Error State */}
        {erro && buscaRealizada && (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro na Busca</AlertTitle>
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        {/* Result */}
        {demanda && (
          <div className="space-y-6">
            {/* Status Header */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Protocolo</p>
                    <h2 className="text-2xl font-bold font-mono">{demanda.numero_demanda}</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={`${STATUS_DEMANDA_COLORS[demanda.status]} gap-1`}>
                      {STATUS_ICONS[demanda.status]}
                      {STATUS_DEMANDA_LABELS[demanda.status]}
                    </Badge>
                    <Badge className={PRIORIDADE_DEMANDA_COLORS[demanda.prioridade]}>
                      {PRIORIDADE_DEMANDA_LABELS[demanda.prioridade]}
                    </Badge>
                    {demanda.requer_autorizacao_presidencia && (
                      <Badge variant="outline" className="gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Requer Autorização
                      </Badge>
                    )}
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{demanda.titulo}</h3>
                    <p className="text-sm text-muted-foreground">
                      {CATEGORIA_DEMANDA_LABELS[demanda.categoria]} • {TIPO_DEMANDA_LABELS[demanda.tipo]}
                    </p>
                  </div>
                  <div className="text-sm space-y-1 md:text-right">
                    <p><span className="text-muted-foreground">Solicitado em:</span> {formatDate(demanda.created_at)}</p>
                    <p><span className="text-muted-foreground">Prazo:</span> {formatDateShort(demanda.prazo_entrega)}</p>
                    {demanda.data_conclusao && (
                      <p className="text-emerald-600"><span className="text-muted-foreground">Concluído em:</span> {formatDate(demanda.data_conclusao)}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="detalhes">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
                <TabsTrigger value="anexos" className="gap-1">
                  Anexos
                  {anexos.length > 0 && <Badge variant="secondary" className="ml-1">{anexos.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="entregaveis" className="gap-1">
                  Entregáveis
                  {entregaveis.length > 0 && <Badge variant="secondary" className="ml-1">{entregaveis.length}</Badge>}
                </TabsTrigger>
                <TabsTrigger value="mensagens" className="gap-1">
                  Mensagens
                  {comentarios.length > 0 && <Badge variant="secondary" className="ml-1">{comentarios.length}</Badge>}
                </TabsTrigger>
              </TabsList>

              {/* Detalhes */}
              <TabsContent value="detalhes">
                <Card>
                  <CardContent className="pt-6 space-y-6">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Descrição</h4>
                      <p className="whitespace-pre-wrap">{demanda.descricao_detalhada}</p>
                    </div>

                    {demanda.objetivo_institucional && (
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Objetivo Institucional</h4>
                        <p>{demanda.objetivo_institucional}</p>
                      </div>
                    )}

                    {demanda.publico_alvo && (
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Público-Alvo</h4>
                        <p>{demanda.publico_alvo}</p>
                      </div>
                    )}

                    {(demanda.data_evento || demanda.local_evento) && (
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Dados do Evento</h4>
                        <div className="flex flex-wrap gap-4 text-sm">
                          {demanda.data_evento && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {formatDateShort(demanda.data_evento)}
                              {demanda.hora_evento && ` às ${demanda.hora_evento}`}
                            </div>
                          )}
                          {demanda.local_evento && (
                            <div className="flex items-center gap-1">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              {demanda.local_evento}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {demanda.justificativa_indeferimento && (
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertTitle>Justificativa do Indeferimento</AlertTitle>
                        <AlertDescription>{demanda.justificativa_indeferimento}</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Anexos */}
              <TabsContent value="anexos">
                <Card>
                  <CardContent className="pt-6">
                    {anexos.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhum anexo enviado</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {anexos.map((anexo) => (
                          <div key={anexo.id} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium text-sm">{anexo.nome_arquivo}</p>
                                {anexo.descricao && (
                                  <p className="text-xs text-muted-foreground">{anexo.descricao}</p>
                                )}
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                              <a href={anexo.url_arquivo} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Entregáveis */}
              <TabsContent value="entregaveis">
                <Card>
                  <CardContent className="pt-6">
                    {entregaveis.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhum entregável disponível ainda</p>
                        <p className="text-sm">Os materiais aparecerão aqui quando forem concluídos</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {entregaveis.map((entregavel) => (
                          <div key={entregavel.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="font-medium">{entregavel.tipo_entregavel}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{entregavel.descricao}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Entregue em: {formatDate(entregavel.data_entrega)}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {entregavel.url_arquivo && (
                                  <Button variant="outline" size="sm" asChild>
                                    <a href={entregavel.url_arquivo} target="_blank" rel="noopener noreferrer">
                                      <Download className="h-4 w-4 mr-1" />
                                      Baixar
                                    </a>
                                  </Button>
                                )}
                                {entregavel.link_publicacao && (
                                  <Button variant="outline" size="sm" asChild>
                                    <a href={entregavel.link_publicacao} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-4 w-4 mr-1" />
                                      Ver
                                    </a>
                                  </Button>
                                )}
                                {(entregavel as any).link_drive && (
                                  <Button variant="outline" size="sm" asChild>
                                    <a href={(entregavel as any).link_drive} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-4 w-4 mr-1" />
                                      Drive
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Mensagens */}
              <TabsContent value="mensagens">
                <Card>
                  <CardContent className="pt-6">
                    {comentarios.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhuma mensagem</p>
                        <p className="text-sm">As atualizações da ASCOM aparecerão aqui</p>
                      </div>
                    ) : (
                      <ScrollArea className="max-h-[400px]">
                        <div className="space-y-4">
                          {comentarios.map((comentario) => (
                            <div key={comentario.id} className="border-l-2 border-primary pl-4 py-2">
                              <p className="text-sm">{comentario.conteudo}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {formatDate(comentario.created_at)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Actions */}
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => navigate('/ascom/solicitar')}>
                <Megaphone className="h-4 w-4 mr-2" />
                Nova Solicitação
              </Button>
              <Button variant="ghost" onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Site
              </Button>
            </div>
          </div>
        )}

        {/* Initial State */}
        {!demanda && !erro && !buscaRealizada && (
          <Card className="text-center py-12">
            <CardContent>
              <Search className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">Digite o número do protocolo</h3>
              <p className="text-muted-foreground">
                Use o campo acima para buscar sua solicitação
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Instituto de Desenvolvimento da Juventude, Esporte e Lazer de Roraima - IDJuv</p>
          <p className="mt-1">Assessoria de Comunicação Social - ASCOM</p>
        </div>
      </footer>
    </div>
  );
}
