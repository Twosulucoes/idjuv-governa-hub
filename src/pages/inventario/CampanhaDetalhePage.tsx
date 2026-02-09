/**
 * PÁGINA: DETALHES DA CAMPANHA DE INVENTÁRIO
 * Visualização completa com métricas, progresso e lista de coletas
 */

import { Link, useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, ClipboardCheck, Calendar, Users, BarChart3, 
  CheckCircle2, AlertTriangle, Play, Pause, QrCode, Eye,
  Package, Clock, FileText, RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useCampanhaInventario, useColetasInventario, useUpdateCampanhaStatus } from "@/hooks/usePatrimonio";

const STATUS_CAMPANHA = {
  planejada: { label: "Planejada", color: "bg-muted text-muted-foreground", icon: Calendar },
  em_andamento: { label: "Em Andamento", color: "bg-primary text-primary-foreground", icon: Play },
  pausada: { label: "Pausada", color: "bg-warning text-warning-foreground", icon: Pause },
  concluida: { label: "Concluída", color: "bg-success text-success-foreground", icon: CheckCircle2 },
};

const STATUS_COLETA = {
  conferido: { label: "Conferido", color: "bg-success/10 text-success" },
  divergente: { label: "Divergente", color: "bg-warning/10 text-warning" },
  nao_localizado: { label: "Não Localizado", color: "bg-destructive/10 text-destructive" },
  sem_etiqueta: { label: "Sem Etiqueta", color: "bg-muted text-muted-foreground" },
};

export default function CampanhaDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: campanha, isLoading, refetch } = useCampanhaInventario(id);
  const { data: coletas, isLoading: loadingColetas } = useColetasInventario(id || "");
  const updateStatus = useUpdateCampanhaStatus();

  const handleStatusChange = async (novoStatus: string) => {
    if (!id) return;
    await updateStatus.mutateAsync({ id, status: novoStatus });
    refetch();
  };

  if (isLoading) {
    return (
      <ModuleLayout module="patrimonio">
        <section className="bg-secondary text-secondary-foreground py-6">
          <div className="container mx-auto px-4">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </section>
        <section className="py-6">
          <div className="container mx-auto px-4">
            <div className="grid gap-4 md:grid-cols-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
            </div>
          </div>
        </section>
      </ModuleLayout>
    );
  }

  if (!campanha) {
    return (
      <ModuleLayout module="patrimonio">
        <section className="py-12">
          <div className="container mx-auto px-4 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Campanha não encontrada</h2>
            <p className="text-muted-foreground mb-4">A campanha solicitada não existe ou foi removida.</p>
            <Button asChild>
              <Link to="/inventario/campanhas">Voltar para Campanhas</Link>
            </Button>
          </div>
        </section>
      </ModuleLayout>
    );
  }

  const statusInfo = STATUS_CAMPANHA[campanha.status as keyof typeof STATUS_CAMPANHA] || STATUS_CAMPANHA.planejada;
  const StatusIcon = statusInfo.icon;

  const coletasPorStatus = coletas?.reduce((acc, c) => {
    const status = c.status_coleta || 'conferido';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <ModuleLayout module="patrimonio">
      {/* Header */}
      <section className="bg-secondary text-secondary-foreground py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-sm mb-3 opacity-80">
            <Link to="/inventario" className="hover:underline">Inventário</Link>
            <span>/</span>
            <Link to="/inventario/campanhas" className="hover:underline">Campanhas</Link>
            <span>/</span>
            <span>Detalhes</span>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="w-8 h-8" />
              <div>
                <h1 className="font-serif text-2xl font-bold">{campanha.nome}</h1>
                <p className="opacity-90 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(campanha.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
                  {" - "}
                  {format(new Date(campanha.data_fim), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${statusInfo.color} border-0`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusInfo.label}
              </Badge>
              <Button variant="outline" size="sm" asChild>
                <Link to="/inventario/campanhas">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Ações de Status */}
      <section className="py-4 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2">
            {campanha.status === "planejada" && (
              <Button onClick={() => handleStatusChange("em_andamento")} disabled={updateStatus.isPending}>
                <Play className="w-4 h-4 mr-2" />
                Iniciar Campanha
              </Button>
            )}
            {campanha.status === "em_andamento" && (
              <>
                <Button asChild>
                  <Link to={`/inventario/campanhas/${id}/coleta`}>
                    <QrCode className="w-4 h-4 mr-2" />
                    Continuar Coleta
                  </Link>
                </Button>
                <Button variant="outline" onClick={() => handleStatusChange("pausada")} disabled={updateStatus.isPending}>
                  <Pause className="w-4 h-4 mr-2" />
                  Pausar
                </Button>
                <Button variant="secondary" onClick={() => handleStatusChange("concluida")} disabled={updateStatus.isPending}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Concluir
                </Button>
              </>
            )}
            {campanha.status === "pausada" && (
              <Button onClick={() => handleStatusChange("em_andamento")} disabled={updateStatus.isPending}>
                <Play className="w-4 h-4 mr-2" />
                Retomar
              </Button>
            )}
            {campanha.status === "concluida" && (
              <Button variant="outline" onClick={() => handleStatusChange("em_andamento")} disabled={updateStatus.isPending}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reabrir Campanha
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Métricas */}
      <section className="py-6">
        <div className="container mx-auto px-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  Bens Esperados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{campanha.total_bens_esperados || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  Conferidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">{campanha.total_conferidos || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  Divergências
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-warning">{campanha.total_divergencias || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <BarChart3 className="w-4 h-4" />
                  Conclusão
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{(campanha.percentual_conclusao || 0).toFixed(1)}%</div>
                <Progress value={campanha.percentual_conclusao || 0} className="mt-2" />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Conteúdo em Tabs */}
      <section className="py-6">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="coletas">
            <TabsList>
              <TabsTrigger value="coletas">
                <Eye className="w-4 h-4 mr-2" />
                Coletas ({coletas?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="resumo">
                <FileText className="w-4 h-4 mr-2" />
                Resumo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="coletas" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Bens Coletados</CardTitle>
                  <CardDescription>Lista de bens conferidos nesta campanha</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingColetas ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
                    </div>
                  ) : coletas?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <QrCode className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma coleta registrada ainda.</p>
                      {campanha.status === "em_andamento" && (
                        <Button asChild className="mt-4">
                          <Link to={`/inventario/campanhas/${id}/coleta`}>
                            Iniciar Coleta
                          </Link>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Patrimônio</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Localização</TableHead>
                            <TableHead>Data</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {coletas?.slice(0, 50).map((coleta) => {
                            const statusColeta = STATUS_COLETA[coleta.status_coleta as keyof typeof STATUS_COLETA] || STATUS_COLETA.conferido;
                            return (
                              <TableRow key={coleta.id}>
                                <TableCell className="font-mono">
                                  {(coleta as any).bem?.numero_patrimonio || "-"}
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate">
                                  {(coleta as any).bem?.descricao || "-"}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={statusColeta.color}>
                                    {statusColeta.label}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {coleta.localizacao_encontrada_sala || "-"}
                                </TableCell>
                                <TableCell>
                                  {format(new Date(coleta.data_coleta), "dd/MM HH:mm")}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resumo" className="mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Informações da Campanha</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo:</span>
                      <Badge variant="outline" className="capitalize">{campanha.tipo}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ano de Referência:</span>
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
                    <CardTitle>Distribuição por Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(STATUS_COLETA).map(([key, value]) => {
                        const count = coletasPorStatus[key] || 0;
                        const total = coletas?.length || 1;
                        const percent = (count / total) * 100;
                        return (
                          <div key={key} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className={value.color.replace("bg-", "text-").split(" ")[0]}>
                                {value.label}
                              </span>
                              <span className="font-medium">{count}</span>
                            </div>
                            <Progress value={percent} className="h-2" />
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
      </section>
    </ModuleLayout>
  );
}
