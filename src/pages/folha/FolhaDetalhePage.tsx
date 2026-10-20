import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Loader2,
  Users,
  DollarSign,
  FileText,
  Calculator,
  Play,
  AlertTriangle,
  Building,
  FileCode,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  Download,
  Send,
  Eye,
  Info,
  Printer,
  History,
  Ban,
  FileInput,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { STATUS_FOLHA_LABELS, STATUS_FOLHA_COLORS, MESES, type StatusFolha } from "@/types/folha";
import { useConfigAutarquia, useRemessasFolha, useEventosESocialFolha } from "@/hooks/useFolhaPagamento";
import { usePermissoesFolha } from "@/hooks/useFechamentoFolha";
import { FecharFolhaDialog } from "@/components/folha/FecharFolhaDialog";
import { ReabrirFolhaDialog } from "@/components/folha/ReabrirFolhaDialog";
import { ProcessarFolhaDialog } from "@/components/folha/ProcessarFolhaDialog";
import { PendenciasServidoresDialog } from "@/components/folha/PendenciasServidoresDialog";
import { GerarRemessaDialog } from "@/components/folha/GerarRemessaDialog";
import { GerarESocialDialog } from "@/components/folha/GerarESocialDialog";
import { CancelarRemessaDialog } from "@/components/folha/CancelarRemessaDialog";
import { ImportarRetornoDialog, RetornosDaFolha, type RemessaParaRetorno } from "@/components/folha/RetornoRemessa";
import {
  useBaixarEventoESocial,
  useBaixarRemessaGuardada,
  ROTULO_TIPO_CREDITO,
  type RemessaComArquivo,
} from "@/hooks/useArquivosFolha";
import { FichaFinanceiraDialog } from "@/components/folha/FichaFinanceiraDialog";
import { format } from "date-fns";
import { generateContracheque } from "@/lib/pdfContracheque";
import { useAuth } from "@/contexts/AuthContext";
import { useRegistrarEvento } from "@/hooks/useTrilhaAuditoria";
import { HistoricoAlteracoesTab } from "@/components/auditoria/HistoricoAlteracoesTab";

export default function FolhaDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Aba de histórico (trilha): rh.auditoria.visualizar ou admin (hasPermission libera o admin)
  const { hasPermission } = useAuth();
  const podeVerTrilha = hasPermission("rh.auditoria.visualizar");
  const { registrarAntes } = useRegistrarEvento();
  
  // Estados dos diálogos
  const [showProcessar, setShowProcessar] = useState(false);
  const [showFechar, setShowFechar] = useState(false);
  const [showReabrir, setShowReabrir] = useState(false);
  const [showPendencias, setShowPendencias] = useState(false);
  const [showRemessa, setShowRemessa] = useState(false);
  const [showESocial, setShowESocial] = useState(false);
  const [fichaDetalheId, setFichaDetalheId] = useState<string | null>(null);
  const [remessaCancelar, setRemessaCancelar] = useState<RemessaComArquivo | null>(null);
  const [remessaRetorno, setRemessaRetorno] = useState<RemessaParaRetorno | null>(null);
  const [baixandoArquivoId, setBaixandoArquivoId] = useState<string | null>(null);
  const baixarRemessaGuardada = useBaixarRemessaGuardada();
  const baixarEventoESocial = useBaixarEventoESocial();
  
  // Estado de busca
  const [busca, setBusca] = useState("");

  // Permissões de fechamento/reabertura (RPCs usuario_pode_fechar_folha / usuario_pode_reabrir_folha)
  const { data: permissoes } = usePermissoesFolha();

  // Queries
  const { data: configAutarquia, isLoading: loadingConfig } = useConfigAutarquia();

  // Buscar dados da folha
  const { data: folha, isLoading: loadingFolha, refetch: refetchFolha } = useQuery({
    queryKey: ["folha-detalhe", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("folhas_pagamento")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Buscar fichas financeiras da folha
  const { data: fichas, isLoading: loadingFichas } = useQuery({
    queryKey: ["fichas-financeiras", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fichas_financeiras")
        .select(`
          *,
          servidor:servidores(id, nome_completo, cpf, matricula)
        `)
        .eq("folha_id", id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Buscar remessas bancárias
  const { data: remessas } = useRemessasFolha(id);
  
  // Buscar eventos eSocial
  const { data: eventosESocial } = useEventosESocialFolha(id);

  const formatCurrency = (value: number | null | undefined) => {
    return (value ?? 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleRefresh = () => {
    refetchFolha();
    queryClient.invalidateQueries({ queryKey: ["fichas-financeiras", id] });
    queryClient.invalidateQueries({ queryKey: ["remessas-bancarias", id] });
    queryClient.invalidateQueries({ queryKey: ["eventos-esocial", id] });
    toast.success("Dados atualizados!");
  };

  // Filtrar fichas pela busca
  const fichasFiltradas = fichas?.filter((ficha) => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      ficha.servidor?.nome_completo?.toLowerCase().includes(termo) ||
      ficha.servidor?.matricula?.toLowerCase().includes(termo) ||
      ficha.cargo_nome?.toLowerCase().includes(termo)
    );
  });

  if (loadingFolha || loadingConfig) {
    return (
      <ModuleLayout module="rh">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </ModuleLayout>
    );
  }

  if (!folha) {
    return (
      <ModuleLayout module="rh">
        <div className="text-center py-24">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold mb-2">Folha não encontrada</h2>
          <p className="text-muted-foreground mb-4">
            A folha de pagamento solicitada não existe ou foi removida.
          </p>
          <Button onClick={() => navigate("/folha/gestao")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Gestão
          </Button>
        </div>
      </ModuleLayout>
    );
  }

  const competencia = `${MESES[folha.competencia_mes - 1]}/${folha.competencia_ano}`;
  const status = folha.status as StatusFolha;
  
  // Determinar ações disponíveis por status
  const podeProcessar = status === "previa" || status === "aberta";
  // Fechar/reabrir passam pelas RPCs fechar_folha/reabrir_folha (máquina de
  // estados, hash e histórico) — mesmas regras da lista em /folha.
  const podeFechar = (status === "processando" || status === "aberta") && !!permissoes?.podeFechar;
  const podeReabrir = status === "fechada" && !!permissoes?.podeReabrir;
  // Remessa CNAB e eSocial: botões aparecem com fichas, mas só geram com a folha fechada (o banco também recusa).
  const podeGerarRemessa = status !== "previa" && (fichas?.length || 0) > 0;
  const podeGerarESocial = status !== "previa" && (fichas?.length || 0) > 0;
  const folhaFechada = status === "fechada";
  const motivoSemArquivos = "Disponível com a folha fechada: remessa e eventos do eSocial saem só da folha conferida.";
  // Guardar o arquivo da remessa, baixá-lo de novo e cancelar exigem financeiro.folha.processar no banco (UX aqui).
  const podeProcessarFolha = hasPermission("financeiro.folha.processar");
  const motivoSemProcessar = "Exige a permissão de processar a folha (financeiro.folha.processar).";
  const podeAbrirRemessa = folhaFechada && podeProcessarFolha;
  const motivoRemessa = !folhaFechada ? motivoSemArquivos : !podeProcessarFolha ? motivoSemProcessar : undefined;
  // eSocial: gerar e baixar também exigem financeiro.folha.processar (o banco exige o mesmo para gravar e ler)
  const podeAbrirESocial = folhaFechada && podeProcessarFolha;
  const motivoESocial = !folhaFechada ? motivoSemArquivos : !podeProcessarFolha ? motivoSemProcessar : undefined;
  // Leitura restrita: sem rh.contracheques.visualizar nem processar, a RLS só devolve a ficha do próprio servidor.
  // Totais e contagens desta tela seriam parciais ou expõem a folha inteira: ficam escondidos (UX; a fronteira é a RLS).
  const leituraRestrita = !hasPermission("rh.contracheques.visualizar") && !podeProcessarFolha;

  const handleBaixarRemessa = async (remessa: RemessaComArquivo) => {
    setBaixandoArquivoId(remessa.id);
    try {
      if (await baixarRemessaGuardada(remessa)) toast.success("Arquivo da remessa baixado (hash conferido).");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível baixar o arquivo da remessa.");
    } finally {
      setBaixandoArquivoId(null);
    }
  };

  const handleBaixarEvento = async (evento: NonNullable<typeof eventosESocial>[number]) => {
    setBaixandoArquivoId(evento.id);
    try {
      const ok = await baixarEventoESocial({
        id: evento.id,
        tipo_evento: evento.tipo_evento,
        id_evento: evento.id_evento,
        payload_xml: evento.payload_xml,
        folhaId: folha.id,
        ano: folha.competencia_ano,
        mes: folha.competencia_mes,
      });
      if (ok) toast.success("XML (rascunho) baixado.");
    } catch (erro) {
      console.error("Erro ao baixar o XML do evento:", erro);
      toast.error("Não foi possível baixar o XML do evento.");
    } finally {
      setBaixandoArquivoId(null);
    }
  };

  return (
    <ModuleLayout module="rh">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/folha/gestao")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Folha {competencia}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={STATUS_FOLHA_COLORS[status] || "bg-gray-100"}>
                  {STATUS_FOLHA_LABELS[status] || status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Tipo: {folha.tipo_folha}
                </span>
              </div>
            </div>
          </div>
          
          {/* Barra de Ações */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPendencias(true)}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Pendências
            </Button>
            
            {podeProcessar && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowProcessar(true)}
              >
                <Play className="mr-2 h-4 w-4" />
                Processar
              </Button>
            )}
            
            {podeFechar && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowFechar(true)}
              >
                <Lock className="mr-2 h-4 w-4" />
                Fechar Folha
              </Button>
            )}
            
            {podeReabrir && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReabrir(true)}
              >
                <Unlock className="mr-2 h-4 w-4" />
                Reabrir
              </Button>
            )}
            
            {podeGerarRemessa && (
              <span title={motivoRemessa}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowRemessa(true)}
                  disabled={!podeAbrirRemessa}
                >
                  <Building className="mr-2 h-4 w-4" />
                  Gerar CNAB
                </Button>
              </span>
            )}
            
            {podeGerarESocial && (
              <span title={motivoESocial}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowESocial(true)}
                  disabled={!podeAbrirESocial}
                >
                  <FileCode className="mr-2 h-4 w-4" />
                  eSocial
                </Button>
              </span>
            )}
          </div>
        </div>

        {/* Alerta de configuração */}
        {!configAutarquia?.cnpj && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Configuração Incompleta</AlertTitle>
            <AlertDescription>
              A autarquia não está configurada. Configure o CNPJ e demais dados em{" "}
              <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/folha/configuracao")}>
                Configurações da Folha
              </Button>{" "}
              antes de processar ou gerar arquivos.
            </AlertDescription>
          </Alert>
        )}

        {/* Leitura restrita: só a própria ficha */}
        {leituraRestrita && (
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertTitle>Você vê apenas a sua ficha</AlertTitle>
            <AlertDescription>
              Nesta folha aparecem só os seus dados. Ver as fichas e os totais de todos os servidores exige a permissão
              de consultar contracheques (rh.contracheques.visualizar) ou de processar a folha.
            </AlertDescription>
          </Alert>
        )}

        {/* Alerta de dados bancários faltantes */}
        {!leituraRestrita && fichas && fichas.length > 0 && (() => {
          const semDadosBancarios = fichas.filter(f => !f.banco_codigo || !f.banco_agencia || !f.banco_conta);
          if (semDadosBancarios.length > 0) {
            return (
              <Alert className="border-orange-200 bg-orange-50">
                <Info className="h-4 w-4 text-orange-600" />
                <AlertTitle className="text-orange-800">Dados Bancários Incompletos</AlertTitle>
                <AlertDescription className="text-orange-700">
                  {semDadosBancarios.length} servidor(es) sem dados bancários cadastrados. 
                  A remessa CNAB não incluirá esses servidores.
                </AlertDescription>
              </Alert>
            );
          }
          return null;
        })()}

        {/* Cards de Resumo (totais da folha inteira: escondidos na leitura restrita) */}
        {!leituraRestrita && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Servidores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{folha.quantidade_servidores || fichas?.length || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Bruto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(folha.total_bruto)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Total Descontos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(folha.total_descontos)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Líquido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(folha.total_liquido)}
              </p>
            </CardContent>
          </Card>
        </div>

        )}

        {/* Encargos Patronais */}
        {!leituraRestrita && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                INSS Servidor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{formatCurrency(folha.total_inss_servidor)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                INSS Patronal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{formatCurrency(folha.total_inss_patronal)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                IRRF
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{formatCurrency(folha.total_irrf)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Encargos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{formatCurrency(folha.total_encargos_patronais)}</p>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Tabs de Conteúdo */}
        <Tabs defaultValue="fichas" className="space-y-4">
          <TabsList className="h-auto flex-wrap justify-start">
            <TabsTrigger value="fichas" className="gap-2">
              <FileText className="h-4 w-4" />
              Fichas Financeiras
              {fichas && fichas.length > 0 && (
                <Badge variant="secondary" className="ml-1">{fichas.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="remessas" className="gap-2">
              <Building className="h-4 w-4" />
              Remessas CNAB
              {remessas && remessas.length > 0 && (
                <Badge variant="secondary" className="ml-1">{remessas.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="esocial" className="gap-2">
              <FileCode className="h-4 w-4" />
              Eventos eSocial
              {eventosESocial && eventosESocial.length > 0 && (
                <Badge variant="secondary" className="ml-1">{eventosESocial.length}</Badge>
              )}
            </TabsTrigger>
            {podeVerTrilha && (
              <TabsTrigger value="trilha" className="gap-2">
                <History className="h-4 w-4" />
                Histórico de alterações
              </TabsTrigger>
            )}
          </TabsList>

          {/* Tab: Fichas Financeiras */}
          <TabsContent value="fichas">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle>Fichas Financeiras</CardTitle>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou matrícula..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingFichas ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : fichasFiltradas?.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    {busca ? (
                      <p>Nenhuma ficha encontrada para "{busca}".</p>
                    ) : leituraRestrita ? (
                      <>
                        <p>Você vê apenas a sua ficha, e não há ficha sua nesta folha.</p>
                        <p className="text-sm mt-2">
                          As fichas dos outros servidores exigem a permissão de consultar contracheques.
                        </p>
                      </>
                    ) : (
                      <>
                        <p>Nenhuma ficha financeira processada para esta competência.</p>
                        <p className="text-sm mt-2">
                          Processe a folha para gerar as fichas financeiras dos servidores.
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Matrícula</TableHead>
                          <TableHead>Servidor</TableHead>
                          <TableHead>Cargo</TableHead>
                          <TableHead className="text-right">Proventos</TableHead>
                          <TableHead className="text-right">Descontos</TableHead>
                          <TableHead className="text-right">Líquido</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-center">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fichasFiltradas?.map((ficha) => (
                          <TableRow key={ficha.id}>
                            <TableCell className="font-mono">
                              {ficha.servidor?.matricula || "-"}
                            </TableCell>
                            <TableCell className="font-medium">
                              {ficha.servidor?.nome_completo || "Servidor não encontrado"}
                            </TableCell>
                            <TableCell>{ficha.cargo_nome || "-"}</TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(ficha.total_proventos)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-orange-600">
                              {formatCurrency(ficha.total_descontos)}
                            </TableCell>
                            <TableCell className="text-right font-mono font-medium text-green-600">
                              {formatCurrency(ficha.valor_liquido)}
                            </TableCell>
                            <TableCell className="text-center">
                              {ficha.tem_inconsistencia ? (
                                <Badge variant="destructive" className="gap-1">
                                  <XCircle className="h-3 w-3" />
                                  Inconsistência
                                </Badge>
                              ) : ficha.processado ? (
                                <Badge className="bg-green-100 text-green-800 gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  OK
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Pendente</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setFichaDetalheId(ficha.id)}
                                  title="Ver detalhes da ficha"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => navigate(`/rh/servidores/${ficha.servidor?.id}`)}
                                  title="Ver servidor"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={async () => {
                                    if (folha) {
                                      // Trilha: impressão registrada antes de gerar (sem registro, sem arquivo)
                                      const ok = await registrarAntes({
                                        acao: "download",
                                        entidade: "contracheque",
                                        entidadeId: ficha.id,
                                        descricao: "Contracheque impresso/baixado (detalhe da folha)",
                                        metadados: { folha_id: folha.id, servidor_id: ficha.servidor_id, formato: "pdf" },
                                      });
                                      if (!ok) return;
                                      try {
                                        await generateContracheque({
                                          ficha: {
                                            id: ficha.id,
                                            servidor_id: ficha.servidor_id || "",
                                            cargo_nome: ficha.cargo_nome || undefined,
                                            total_proventos: ficha.total_proventos || 0,
                                            total_descontos: ficha.total_descontos || 0,
                                            valor_liquido: ficha.valor_liquido || 0,
                                            base_inss: ficha.base_inss || undefined,
                                            valor_inss: ficha.valor_inss || undefined,
                                            base_irrf: ficha.base_irrf || undefined,
                                            valor_irrf: ficha.valor_irrf || undefined,
                                            quantidade_dependentes: ficha.quantidade_dependentes || undefined,
                                            servidor: ficha.servidor ? {
                                              nome_completo: ficha.servidor.nome_completo,
                                              cpf: ficha.servidor.cpf || "",
                                              matricula: ficha.servidor.matricula || undefined,
                                            } : undefined,
                                          },
                                          competencia: `${MESES[folha.competencia_mes - 1]}/${folha.competencia_ano}`,
                                          competenciaAno: folha.competencia_ano,
                                          competenciaMes: folha.competencia_mes,
                                        });
                                        toast.success("Contracheque gerado!");
                                      } catch (error) {
                                        console.error("Erro ao gerar contracheque:", error);
                                        toast.error("Erro ao gerar contracheque");
                                      }
                                    }
                                  }}
                                  title="Gerar Contracheque"
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Remessas CNAB */}
          <TabsContent value="remessas">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle>Remessas Bancárias (CNAB 240)</CardTitle>
                  {podeGerarRemessa && (
                    <span title={motivoRemessa}>
                      <Button size="sm" onClick={() => setShowRemessa(true)} disabled={!podeAbrirRemessa}>
                        <Building className="mr-2 h-4 w-4" />
                        Nova Remessa
                      </Button>
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {podeGerarRemessa && motivoRemessa && (
                  <Alert className="mb-4">
                    <Lock className="h-4 w-4" />
                    <AlertDescription>{motivoRemessa}</AlertDescription>
                  </Alert>
                )}
                {!remessas || remessas.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma remessa bancária gerada para esta folha.</p>
                    {podeGerarRemessa && podeAbrirRemessa && (
                      <p className="text-sm mt-2">
                        Clique em "Nova Remessa" para gerar o arquivo CNAB.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nº Remessa</TableHead>
                          <TableHead>Créditos</TableHead>
                          <TableHead>Conta</TableHead>
                          <TableHead>Data Geração</TableHead>
                          <TableHead className="text-right">Registros</TableHead>
                          <TableHead className="text-right">Valor Total</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-center">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {remessas.map((remessa) => (
                          <TableRow key={remessa.id}>
                            <TableCell className="font-mono">
                              {remessa.numero_remessa}
                            </TableCell>
                            <TableCell>
                              {remessa.tipo_credito === "pensao"
                                ? ROTULO_TIPO_CREDITO.pensao
                                : ROTULO_TIPO_CREDITO.servidores}
                            </TableCell>
                            <TableCell>
                              {(remessa.conta as any)?.banco?.nome || "-"} - {(remessa.conta as any)?.descricao || "-"}
                            </TableCell>
                            <TableCell>
                              {remessa.data_geracao ? format(new Date(remessa.data_geracao), "dd/MM/yyyy HH:mm") : "-"}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {remessa.quantidade_registros || 0}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(remessa.valor_total)}
                            </TableCell>
                            <TableCell className="text-center">
                              {remessa.status === "gerada" && (
                                <Badge variant="secondary">Gerada</Badge>
                              )}
                              {remessa.status === "enviada" && (
                                <Badge className="bg-blue-100 text-blue-800">
                                  <Send className="h-3 w-3 mr-1" />
                                  Enviada
                                </Badge>
                              )}
                              {remessa.status === "processada" && (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Processada
                                </Badge>
                              )}
                              {remessa.status === "rejeitada" && (
                                <Badge variant="destructive">Rejeitada</Badge>
                              )}
                              {remessa.status === "cancelada" && (
                                <Badge
                                  variant="outline"
                                  title={(remessa as unknown as RemessaComArquivo).motivo_cancelamento ?? undefined}
                                >
                                  <Ban className="h-3 w-3 mr-1" />
                                  Cancelada
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {(() => {
                                // Colunas da E3 (arquivo_path, arquivo_sha256) no formato de RemessaComArquivo
                                const r = remessa as unknown as RemessaComArquivo;
                                return (
                                  <div className="flex items-center justify-center gap-1">
                                    {r.arquivo_path ? (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        title={
                                          r.status === "cancelada"
                                            ? "Remessa cancelada: não envie ao banco"
                                            : podeProcessarFolha
                                              ? "Baixar o arquivo guardado (confere o hash)"
                                              : motivoSemProcessar
                                        }
                                        disabled={
                                          r.status === "cancelada" || !podeProcessarFolha || baixandoArquivoId === r.id
                                        }
                                        onClick={() => handleBaixarRemessa(r)}
                                      >
                                        {baixandoArquivoId === r.id ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Download className="h-4 w-4" />
                                        )}
                                      </Button>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">arquivo não guardado</span>
                                    )}
                                    {r.status !== "cancelada" && podeProcessarFolha && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Registrar o retorno do banco (.ret)"
                                        onClick={() =>
                                          setRemessaRetorno({
                                            ...r,
                                            convenio: (remessa.conta as { convenio_pagamento?: string | null } | null)
                                              ?.convenio_pagamento,
                                          })
                                        }
                                      >
                                        <FileInput className="h-4 w-4" />
                                      </Button>
                                    )}
                                    {r.status !== "cancelada" && r.status !== "processada" && podeProcessarFolha && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Cancelar remessa (com motivo)"
                                        onClick={() => setRemessaCancelar(r)}
                                      >
                                        <Ban className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                );
                              })()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                {id && <RetornosDaFolha folhaId={id} />}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Eventos eSocial */}
          <TabsContent value="esocial">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle>Eventos eSocial (rascunho, não transmitido)</CardTitle>
                  {podeGerarESocial && (
                    <span title={motivoESocial}>
                      <Button size="sm" onClick={() => setShowESocial(true)} disabled={!podeAbrirESocial}>
                        <FileCode className="mr-2 h-4 w-4" />
                        Gerar Eventos
                      </Button>
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Este sistema ainda não transmite ao eSocial: os eventos abaixo são rascunho para conferência.
                    {podeGerarESocial && motivoESocial && ` ${motivoESocial}`}
                  </AlertDescription>
                </Alert>
                {!eventosESocial || eventosESocial.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    {leituraRestrita ? (
                      <p>
                        Os eventos do eSocial só aparecem para quem tem a permissão de consultar contracheques
                        (rh.contracheques.visualizar) ou de processar a folha.
                      </p>
                    ) : (
                      <p>Nenhum evento eSocial gerado para esta folha.</p>
                    )}
                    {podeGerarESocial && podeAbrirESocial && (
                      <p className="text-sm mt-2">
                        Clique em "Gerar Eventos" para criar os eventos S-1200, S-1210 e S-1299.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo Evento</TableHead>
                          <TableHead>Servidor</TableHead>
                          <TableHead>ID Evento</TableHead>
                          <TableHead>Data Geração</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-center">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {eventosESocial.map((evento) => (
                          <TableRow key={evento.id}>
                            <TableCell className="font-mono font-medium">
                              {evento.tipo_evento}
                            </TableCell>
                            <TableCell>
                              {(evento.servidor as any)?.nome_completo || "-"}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {evento.id_evento || "-"}
                            </TableCell>
                            <TableCell>
                              {evento.data_geracao ? format(new Date(evento.data_geracao), "dd/MM/yyyy HH:mm") : "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              {evento.status === "pendente" && (
                                <Badge variant="secondary">Rascunho (não transmitido)</Badge>
                              )}
                              {evento.status === "erro" && (
                                <Badge variant="outline">Rascunho com pendências</Badge>
                              )}
                              {evento.status === "enviado" && (
                                <Badge className="bg-blue-100 text-blue-800">Enviado</Badge>
                              )}
                              {evento.status === "aceito" && (
                                <Badge className="bg-green-100 text-green-800">Aceito</Badge>
                              )}
                              {evento.status === "rejeitado" && (
                                <Badge variant="destructive">Rejeitado</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                title={
                                  podeProcessarFolha ? "Baixar XML (rascunho, não transmitido)" : motivoSemProcessar
                                }
                                disabled={!podeProcessarFolha || !evento.payload_xml || baixandoArquivoId === evento.id}
                                onClick={() => handleBaixarEvento(evento)}
                              >
                                {baixandoArquivoId === evento.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Histórico de alterações (trilha de auditoria) */}
          {podeVerTrilha && (
            <TabsContent value="trilha">
              <HistoricoAlteracoesTab escopo={{ tipo: "folha", folhaId: folha.id }} />
            </TabsContent>
          )}
        </Tabs>

        {/* Observações */}
        {folha.observacoes && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Observações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{folha.observacoes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Diálogos */}
      <ProcessarFolhaDialog
        open={showProcessar}
        onOpenChange={setShowProcessar}
        folhaId={id || ""}
        competencia={competencia}
      />

      <FecharFolhaDialog
        open={showFechar}
        onOpenChange={setShowFechar}
        folhaId={id || ""}
        competenciaAno={folha.competencia_ano}
        competenciaMes={folha.competencia_mes}
      />

      <ReabrirFolhaDialog
        open={showReabrir}
        onOpenChange={setShowReabrir}
        folhaId={id || ""}
        competenciaAno={folha.competencia_ano}
        competenciaMes={folha.competencia_mes}
      />
      
      <PendenciasServidoresDialog
        open={showPendencias}
        onOpenChange={setShowPendencias}
      />
      
      <GerarRemessaDialog
        open={showRemessa}
        onOpenChange={setShowRemessa}
        folhaId={id || ""}
        competencia={competencia}
        competenciaAno={folha.competencia_ano}
        competenciaMes={folha.competencia_mes}
        folhaFechada={folhaFechada}
        quantidadeServidores={folha.quantidade_servidores}
      />

      <CancelarRemessaDialog
        remessa={remessaCancelar}
        onOpenChange={(aberto) => !aberto && setRemessaCancelar(null)}
      />
      <ImportarRetornoDialog
        remessa={remessaRetorno}
        onOpenChange={(aberto) => !aberto && setRemessaRetorno(null)}
      />
      
      <GerarESocialDialog
        open={showESocial}
        onOpenChange={setShowESocial}
        folhaId={id || ""}
        competencia={competencia}
        mes={folha.competencia_mes}
        ano={folha.competencia_ano}
        folhaFechada={folhaFechada}
        quantidadeServidores={folha.quantidade_servidores}
      />
      
      {fichaDetalheId && (
        <FichaFinanceiraDialog
          open={!!fichaDetalheId}
          onOpenChange={(open) => !open && setFichaDetalheId(null)}
          fichaId={fichaDetalheId}
        />
      )}
    </ModuleLayout>
  );
}