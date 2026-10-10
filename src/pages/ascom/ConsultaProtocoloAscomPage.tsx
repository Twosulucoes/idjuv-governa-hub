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
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Logo } from "@/components/ui/Logo";
import { SkipLink, StatusBadge, type TomStatus } from "@/components/design-system";
import { useIdentidade } from "@/core/tenant";

import {
  DemandaAscom,
  AnexoDemandaAscom,
  EntregavelDemandaAscom,
  ComentarioDemandaAscom,
  STATUS_DEMANDA_LABELS,
  CATEGORIA_DEMANDA_LABELS,
  TIPO_DEMANDA_LABELS,
  PRIORIDADE_DEMANDA_LABELS
} from '@/types/ascom';

// Situação do protocolo → selo (texto + ícone + tom). Valor fora do mapa cai em neutro.
const TOM_STATUS_DEMANDA: Record<string, TomStatus> = {
  rascunho: 'neutro',
  enviada: 'pendente',
  em_analise: 'andamento',
  aguardando_autorizacao: 'pendente',
  aprovada: 'sucesso',
  em_execucao: 'andamento',
  concluida: 'sucesso',
  indeferida: 'erro',
  cancelada: 'erro',
};

const TOM_PRIORIDADE_DEMANDA: Record<string, TomStatus> = {
  baixa: 'neutro',
  normal: 'neutro',
  alta: 'pendente',
  urgente: 'destaque',
};


export default function ConsultaProtocoloAscomPage() {
  const navigate = useNavigate();
  const { nomeOficial, sigla } = useIdentidade();
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
      <SkipLink />
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="h-10 w-auto" />
            <div>
              <p className="font-semibold text-lg">{sigla} - ASCOM</p>
              <p className="text-sm text-muted-foreground">Consulta de Protocolo</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/ascom/solicitar')}>
            Nova solicitação
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main id="conteudo" tabIndex={-1} className="container mx-auto px-4 py-8 max-w-4xl focus:outline-none">
        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader className="text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4 mx-auto w-fit">
              <Search className="h-5 w-5" aria-hidden="true" />
              <span className="font-medium">Consulta de protocolo</span>
            </div>
            <h1 className="text-2xl font-semibold leading-tight tracking-tight">Acompanhe sua solicitação</h1>
            <CardDescription className="text-base">
              Digite o número do protocolo recebido para verificar o andamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex gap-3 max-w-md mx-auto">
              <label htmlFor="protocolo-consulta" className="sr-only">Número do protocolo</label>
              <Input
                id="protocolo-consulta"
                placeholder="Ex: 0001/2025-ASCOM"
                value={protocolo}
                onChange={(e) => setProtocolo(e.target.value.toUpperCase())}
                className="text-center font-mono text-lg h-11"
              />
              <Button type="submit" disabled={loading} className="h-11">
                {loading ? 'Buscando...' : 'Buscar'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Error State */}
        {erro && buscaRealizada && (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>Erro na busca</AlertTitle>
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
                    <StatusBadge tom={TOM_STATUS_DEMANDA[demanda.status] ?? 'neutro'}>
                      {STATUS_DEMANDA_LABELS[demanda.status] ?? demanda.status ?? 'Sem situação'}
                    </StatusBadge>
                    <StatusBadge tom={TOM_PRIORIDADE_DEMANDA[demanda.prioridade] ?? 'neutro'}>
                      Prioridade {(PRIORIDADE_DEMANDA_LABELS[demanda.prioridade] ?? demanda.prioridade ?? 'não informada').toLowerCase()}
                    </StatusBadge>
                    {demanda.requer_autorizacao_presidencia && (
                      <Badge variant="outline" className="gap-1">
                        <AlertCircle className="h-3 w-3" aria-hidden="true" />
                        Requer Autorização
                      </Badge>
                    )}
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{demanda.titulo}</h3>
                    <p className="text-base text-muted-foreground">
                      {CATEGORIA_DEMANDA_LABELS[demanda.categoria]} • {TIPO_DEMANDA_LABELS[demanda.tipo]}
                    </p>
                  </div>
                  <div className="text-sm space-y-1 md:text-right">
                    <p><span className="text-muted-foreground">Solicitado em:</span> {formatDate(demanda.created_at)}</p>
                    <p><span className="text-muted-foreground">Prazo:</span> {formatDateShort(demanda.prazo_entrega)}</p>
                    {demanda.data_conclusao && (
                      <p className="text-success"><span className="text-muted-foreground">Concluído em:</span> {formatDate(demanda.data_conclusao)}</p>
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
                            <Button variant="ghost" size="icon" asChild>
                              <a href={anexo.url_arquivo} target="_blank" rel="noopener noreferrer" aria-label={`Baixar ${anexo.nome_arquivo} (abre em nova aba)`}>
                                <Download className="h-4 w-4" aria-hidden="true" />
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
                                <p className="text-base text-muted-foreground mt-1">{entregavel.descricao}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Entregue em: {formatDate(entregavel.data_entrega)}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {entregavel.url_arquivo && (
                                  <Button variant="outline" asChild>
                                    <a href={entregavel.url_arquivo} target="_blank" rel="noopener noreferrer">
                                      <Download className="h-4 w-4 mr-1" />
                                      Baixar
                                    </a>
                                  </Button>
                                )}
                                {entregavel.link_publicacao && (
                                  <Button variant="outline" asChild>
                                    <a href={entregavel.link_publicacao} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink className="h-4 w-4 mr-1" />
                                      Ver
                                    </a>
                                  </Button>
                                )}
                                {(entregavel as any).link_drive && (
                                  <Button variant="outline" asChild>
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
                              <p className="text-base">{comentario.conteudo}</p>
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
                <Megaphone className="h-4 w-4 mr-2" aria-hidden="true" />
                Nova solicitação
              </Button>
              <Button variant="ghost" onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
                Voltar ao site
              </Button>
            </div>
          </div>
        )}

        {/* Initial State */}
        {!demanda && !erro && !buscaRealizada && (
          <Card className="text-center py-12">
            <CardContent>
              <Search className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" aria-hidden="true" />
              <h2 className="text-lg font-medium mb-2">Digite o número do protocolo</h2>
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
          <p>{nomeOficial} - {sigla}</p>
          <p className="mt-1">Assessoria de Comunicação Social - ASCOM</p>
        </div>
      </footer>
    </div>
  );
}
