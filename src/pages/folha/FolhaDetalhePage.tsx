import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin";
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
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { STATUS_FOLHA_LABELS, STATUS_FOLHA_COLORS, MESES, type StatusFolha } from "@/types/folha";
import { useUpdateFolhaStatus, useConfigAutarquia, useRemessasFolha, useEventosESocialFolha } from "@/hooks/useFolhaPagamento";
import { ProcessarFolhaDialog } from "@/components/folha/ProcessarFolhaDialog";
import { PendenciasServidoresDialog } from "@/components/folha/PendenciasServidoresDialog";
import { GerarRemessaDialog } from "@/components/folha/GerarRemessaDialog";
import { GerarESocialDialog } from "@/components/folha/GerarESocialDialog";
import { format } from "date-fns";

export default function FolhaDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Estados dos diálogos
  const [showProcessar, setShowProcessar] = useState(false);
  const [showPendencias, setShowPendencias] = useState(false);
  const [showRemessa, setShowRemessa] = useState(false);
  const [showESocial, setShowESocial] = useState(false);
  
  // Estado de busca
  const [busca, setBusca] = useState("");

  // Mutations
  const updateStatus = useUpdateFolhaStatus();
  
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

  const handleUpdateStatus = async (novoStatus: StatusFolha) => {
    if (!id) return;
    try {
      await updateStatus.mutateAsync({ id, status: novoStatus });
      queryClient.invalidateQueries({ queryKey: ["folha-detalhe", id] });
      toast.success(`Status alterado para ${STATUS_FOLHA_LABELS[novoStatus]}`);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
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
      <AdminLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (!folha) {
    return (
      <AdminLayout>
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
      </AdminLayout>
    );
  }

  const competencia = `${MESES[folha.competencia_mes - 1]}/${folha.competencia_ano}`;
  const status = folha.status as StatusFolha;
  
  // Determinar ações disponíveis por status
  const podeProcessar = status === "previa" || status === "aberta";
  const podeFechar = status === "processando";
  const podeReabrir = status === "fechada" || status === "reaberta";
  const podeGerarRemessa = (status === "fechada" || status === "processando") && (fichas?.length || 0) > 0;
  const podeGerarESocial = (status === "fechada" || status === "processando") && (fichas?.length || 0) > 0;

  return (
    <AdminLayout>
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
                onClick={() => handleUpdateStatus("fechada")}
                disabled={updateStatus.isPending}
              >
                <Lock className="mr-2 h-4 w-4" />
                Fechar Folha
              </Button>
            )}
            
            {podeReabrir && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleUpdateStatus("reaberta")}
                disabled={updateStatus.isPending}
              >
                <Unlock className="mr-2 h-4 w-4" />
                Reabrir
              </Button>
            )}
            
            {podeGerarRemessa && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowRemessa(true)}
              >
                <Building className="mr-2 h-4 w-4" />
                Gerar CNAB
              </Button>
            )}
            
            {podeGerarESocial && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowESocial(true)}
              >
                <FileCode className="mr-2 h-4 w-4" />
                eSocial
              </Button>
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

        {/* Cards de Resumo */}
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

        {/* Encargos Patronais */}
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

        {/* Tabs de Conteúdo */}
        <Tabs defaultValue="fichas" className="space-y-4">
          <TabsList>
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
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/rh/servidores/${ficha.servidor?.id}`)}
                                title="Ver servidor"
                              >
                                <Eye className="h-4 w-4" />
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

          {/* Tab: Remessas CNAB */}
          <TabsContent value="remessas">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle>Remessas Bancárias (CNAB 240)</CardTitle>
                  {podeGerarRemessa && (
                    <Button size="sm" onClick={() => setShowRemessa(true)}>
                      <Building className="mr-2 h-4 w-4" />
                      Nova Remessa
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!remessas || remessas.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma remessa bancária gerada para esta folha.</p>
                    {podeGerarRemessa && (
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
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Baixar arquivo"
                              >
                                <Download className="h-4 w-4" />
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

          {/* Tab: Eventos eSocial */}
          <TabsContent value="esocial">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle>Eventos eSocial</CardTitle>
                  {podeGerarESocial && (
                    <Button size="sm" onClick={() => setShowESocial(true)}>
                      <FileCode className="mr-2 h-4 w-4" />
                      Gerar Eventos
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!eventosESocial || eventosESocial.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum evento eSocial gerado para esta folha.</p>
                    {podeGerarESocial && (
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
                                <Badge variant="secondary">Pendente</Badge>
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
                                title="Ver detalhes"
                              >
                                <Eye className="h-4 w-4" />
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
      
      <PendenciasServidoresDialog
        open={showPendencias}
        onOpenChange={setShowPendencias}
      />
      
      <GerarRemessaDialog
        open={showRemessa}
        onOpenChange={setShowRemessa}
        folhaId={id || ""}
        competencia={competencia}
      />
      
      <GerarESocialDialog
        open={showESocial}
        onOpenChange={setShowESocial}
        folhaId={id || ""}
        competencia={competencia}
        mes={folha.competencia_mes}
        ano={folha.competencia_ano}
      />
    </AdminLayout>
  );
}