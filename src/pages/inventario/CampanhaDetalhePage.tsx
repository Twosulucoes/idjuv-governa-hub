/**
 * PÁGINA: DETALHES DA CAMPANHA DE INVENTÁRIO
 * Visualização completa com métricas, progresso e lista de coletas
 */

import { Link, useParams } from "react-router-dom";
import { 
  ArrowLeft, Calendar, BarChart3, 
  CheckCircle2, AlertTriangle, Play, Pause, QrCode, Eye,
  Package, FileText, RefreshCw, Layers
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DataTable, EmptyState, KpiCard, PageHeader, StatusBadge,
  type ColunaTabela, type TomStatus,
} from "@/components/design-system";
import { useCampanhaInventario, useColetasInventario, useUpdateCampanhaStatus } from "@/hooks/usePatrimonio";

const STATUS_CAMPANHA: Record<string, { label: string; tom: TomStatus }> = {
  planejada: { label: "Planejada", tom: "neutro" },
  em_andamento: { label: "Em andamento", tom: "andamento" },
  pausada: { label: "Pausada", tom: "pendente" },
  concluida: { label: "Concluída", tom: "sucesso" },
  cancelada: { label: "Cancelada", tom: "erro" },
};

const STATUS_COLETA: Record<string, { label: string; tom: TomStatus }> = {
  conferido: { label: "Conferido", tom: "sucesso" },
  divergente: { label: "Divergente", tom: "pendente" },
  nao_localizado: { label: "Não localizado", tom: "erro" },
  avariado: { label: "Avariado", tom: "pendente" },
  em_manutencao: { label: "Em manutenção", tom: "andamento" },
  sem_etiqueta: { label: "Sem etiqueta", tom: "neutro" },
};

type Coleta = NonNullable<ReturnType<typeof useColetasInventario>["data"]>[number];

const colunasColetas: ColunaTabela<Coleta>[] = [
  {
    id: "patrimonio",
    cabecalho: "Patrimônio",
    celula: (coleta) => <span className="font-mono">{coleta.bem?.numero_patrimonio || "-"}</span>,
    ordenarPor: (coleta) => coleta.bem?.numero_patrimonio,
    buscarPor: (coleta) => coleta.bem?.numero_patrimonio,
  },
  {
    id: "descricao",
    cabecalho: "Descrição",
    celula: (coleta) => (
      <span className="block max-w-[200px] truncate" title={coleta.bem?.descricao ?? undefined}>
        {coleta.bem?.descricao || "-"}
      </span>
    ),
    ordenarPor: (coleta) => coleta.bem?.descricao,
    buscarPor: (coleta) => coleta.bem?.descricao,
    mobile: "titulo",
  },
  {
    id: "status",
    cabecalho: "Status",
    celula: (coleta) => {
      const st = STATUS_COLETA[coleta.status_coleta ?? ""] || STATUS_COLETA.conferido;
      return <StatusBadge tom={st.tom}>{st.label}</StatusBadge>;
    },
    ordenarPor: (coleta) => coleta.status_coleta,
  },
  {
    id: "localizacao",
    cabecalho: "Localização",
    celula: (coleta) => coleta.localizacao_encontrada_sala || "-",
    ordenarPor: (coleta) => coleta.localizacao_encontrada_sala,
    buscarPor: (coleta) => coleta.localizacao_encontrada_sala,
  },
  {
    id: "data",
    cabecalho: "Data",
    celula: (coleta) => format(new Date(coleta.data_coleta), "dd/MM HH:mm"),
    ordenarPor: (coleta) => coleta.data_coleta,
  },
];

export default function CampanhaDetalhePage() {
  const { id } = useParams<{ id: string }>();
  
  const { data: campanha, isLoading, refetch } = useCampanhaInventario(id);
  const {
    data: coletas,
    isLoading: loadingColetas,
    isError: erroColetas,
    refetch: refetchColetas,
  } = useColetasInventario(id || "");
  const updateStatus = useUpdateCampanhaStatus();

  const handleStatusChange = async (novoStatus: string) => {
    if (!id) return;
    await updateStatus.mutateAsync({ id, status: novoStatus });
    refetch();
  };

  if (isLoading) {
    return (
      <ModuleLayout module="patrimonio">
        <div className="space-y-6" role="status" aria-label="Carregando campanha">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </ModuleLayout>
    );
  }

  if (!campanha) {
    return (
      <ModuleLayout module="patrimonio">
        <div className="space-y-6">
          <PageHeader
            migalhas={[{ rotulo: "Inventário", href: "/inventario" }, { rotulo: "Campanhas", href: "/inventario/campanhas" }, { rotulo: "Detalhe" }]}
            titulo="Campanha de inventário"
          />
          <EmptyState
            icone={AlertTriangle}
            titulo="Campanha não encontrada"
            descricao="A campanha solicitada não existe ou foi removida."
            acao={
              <Button asChild>
                <Link to="/inventario/campanhas">Voltar para campanhas</Link>
              </Button>
            }
          />
        </div>
      </ModuleLayout>
    );
  }

  const statusInfo = STATUS_CAMPANHA[campanha.status ?? ""] || STATUS_CAMPANHA.planejada;

  const coletasPorStatus = coletas?.reduce((acc, c) => {
    const status = c.status_coleta || 'conferido';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <ModuleLayout module="patrimonio">
      <div className="space-y-6">
        <PageHeader
          migalhas={[
            { rotulo: "Inventário", href: "/inventario" },
            { rotulo: "Campanhas", href: "/inventario/campanhas" },
            { rotulo: campanha.nome },
          ]}
          titulo={campanha.nome}
          status={<StatusBadge tom={statusInfo.tom}>{statusInfo.label}</StatusBadge>}
          descricao={
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              {format(new Date(campanha.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
              {" - "}
              {format(new Date(campanha.data_fim), "dd/MM/yyyy", { locale: ptBR })}
            </span>
          }
          acoes={
            <>
              <Button variant="outline" asChild>
                <Link to="/inventario/campanhas">
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Voltar
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to={`/inventario/campanhas/${id}/painel`}>
                  <Layers className="h-4 w-4" aria-hidden="true" />
                  Painel de campo
                </Link>
              </Button>
              {campanha.status === "planejada" && (
                <Button onClick={() => handleStatusChange("em_andamento")} disabled={updateStatus.isPending}>
                  <Play className="h-4 w-4" aria-hidden="true" />
                  Iniciar campanha
                </Button>
              )}
              {campanha.status === "em_andamento" && (
                <>
                  <Button variant="outline" onClick={() => handleStatusChange("pausada")} disabled={updateStatus.isPending}>
                    <Pause className="h-4 w-4" aria-hidden="true" />
                    Pausar
                  </Button>
                  <Button variant="outline" onClick={() => handleStatusChange("concluida")} disabled={updateStatus.isPending}>
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Concluir
                  </Button>
                  <Button asChild>
                    <Link to={`/inventario/campanhas/${id}/coleta`}>
                      <QrCode className="h-4 w-4" aria-hidden="true" />
                      Continuar coleta
                    </Link>
                  </Button>
                </>
              )}
              {campanha.status === "pausada" && (
                <Button onClick={() => handleStatusChange("em_andamento")} disabled={updateStatus.isPending}>
                  <Play className="h-4 w-4" aria-hidden="true" />
                  Retomar
                </Button>
              )}
              {campanha.status === "concluida" && (
                <Button variant="outline" onClick={() => handleStatusChange("em_andamento")} disabled={updateStatus.isPending}>
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Reabrir campanha
                </Button>
              )}
            </>
          }
        />

        {/* Métricas */}
        <div className="grid gap-4 md:grid-cols-4">
          <KpiCard rotulo="Bens esperados" valor={campanha.total_bens_esperados || 0} icone={Package} />
          <KpiCard rotulo="Conferidos" valor={campanha.total_conferidos || 0} icone={CheckCircle2} />
          <KpiCard rotulo="Divergências" valor={campanha.total_divergencias || 0} icone={AlertTriangle} />
          <KpiCard
            rotulo="Conclusão"
            valor={`${(campanha.percentual_conclusao || 0).toFixed(1)}%`}
            icone={BarChart3}
          />
        </div>
        <Progress
          value={campanha.percentual_conclusao || 0}
          aria-label={`Conclusão da campanha: ${(campanha.percentual_conclusao || 0).toFixed(1)}%`}
        />

        {/* Conteúdo em Tabs */}
        <Tabs defaultValue="coletas">
          <TabsList>
            <TabsTrigger value="coletas">
              <Eye className="w-4 h-4 mr-2" aria-hidden="true" />
              Coletas ({coletas?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="resumo">
              <FileText className="w-4 h-4 mr-2" aria-hidden="true" />
              Resumo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="coletas" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-h3">Bens coletados</CardTitle>
                <CardDescription>Lista de bens conferidos nesta campanha</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  rotulo="Bens coletados"
                  dados={coletas ?? []}
                  colunas={colunasColetas}
                  chaveLinha={(coleta) => coleta.id}
                  carregando={loadingColetas}
                  erro={erroColetas ? "Não foi possível carregar as coletas." : null}
                  aoTentarNovamente={() => refetchColetas()}
                  busca={{ placeholder: "Buscar por patrimônio, descrição ou local" }}
                  vazio={{
                    icone: QrCode,
                    titulo: "Nenhuma coleta registrada ainda",
                    acao: campanha.status === "em_andamento" ? (
                      <Button asChild>
                        <Link to={`/inventario/campanhas/${id}/coleta`}>Iniciar coleta</Link>
                      </Button>
                    ) : undefined,
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resumo" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-h3">Informações da campanha</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <Badge variant="outline" className="capitalize">{campanha.tipo}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ano de referência:</span>
                    <span className="font-medium">{campanha.ano}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Período:</span>
                    <span className="font-medium">
                      {format(new Date(campanha.data_inicio), "dd/MM/yyyy")} - {format(new Date(campanha.data_fim), "dd/MM/yyyy")}
                    </span>
                  </div>
                  {(campanha as any).responsavel && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Responsável:</span>
                      <span className="font-medium">{(campanha as any).responsavel.nome_completo}</span>
                    </div>
                  )}
                  {campanha.observacoes && (
                    <div className="pt-2 border-t">
                      <span className="text-muted-foreground text-sm">Observações:</span>
                      <p className="mt-1">{campanha.observacoes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-h3">Distribuição por status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(STATUS_COLETA).map(([key, value]) => {
                      const count = coletasPorStatus[key] || 0;
                      const total = coletas?.length || 1;
                      const percent = (count / total) * 100;
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <StatusBadge tom={value.tom}>{value.label}</StatusBadge>
                            <span className="font-medium tabular-nums">{count}</span>
                          </div>
                          <Progress value={percent} className="h-2" aria-label={`${value.label}: ${count}`} />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ModuleLayout>
  );
}
