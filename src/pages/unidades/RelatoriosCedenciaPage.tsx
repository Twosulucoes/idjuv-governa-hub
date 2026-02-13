import { useState, useEffect } from "react";
import { ModuleLayout } from "@/components/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  BarChart3, 
  Calendar,
  Building2,
  Users,
  FileText,
  AlertTriangle,
  Loader2,
  Download,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  MUNICIPIOS_RORAIMA,
  STATUS_AGENDA_LABELS,
  STATUS_AGENDA_COLORS,
} from "@/types/unidadesLocais";

interface RelatorioUsoUnidade {
  unidade_id: string;
  nome_unidade: string;
  municipio: string;
  tipo_unidade: string;
  status_unidade: string;
  ano_referencia: number;
  total_cedencias: number;
  cedencias_aprovadas: number;
  cedencias_rejeitadas: number;
  cedencias_concluidas: number;
  total_publico_estimado: number;
}

interface CedenciaAVencer {
  agenda_id: string;
  titulo: string;
  unidade_id: string;
  nome_unidade: string;
  municipio: string;
  data_inicio: string;
  data_fim: string;
  dias_para_vencer: number;
  solicitante_nome: string;
  numero_protocolo?: string;
  status: string;
}

interface EstatisticasGerais {
  totalUnidades: number;
  totalCedencias: number;
  cedenciasAprovadas: number;
  cedenciasRejeitadas: number;
  publicoTotalAtendido: number;
  unidadesMaisUsadas: { nome: string; total: number }[];
  municipiosAtivos: string[];
}

function RelatoriosCedenciaContent() {
  const [loading, setLoading] = useState(true);
  const [relatorioUso, setRelatorioUso] = useState<RelatorioUsoUnidade[]>([]);
  const [cedenciasAVencer, setCedenciasAVencer] = useState<CedenciaAVencer[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasGerais | null>(null);
  const [filterMunicipio, setFilterMunicipio] = useState<string>("all");
  const [filterPeriodo, setFilterPeriodo] = useState<string>("mes_atual");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  useEffect(() => {
    // Definir período padrão (mês atual)
    const hoje = new Date();
    setDataInicio(format(startOfMonth(hoje), "yyyy-MM-dd"));
    setDataFim(format(endOfMonth(hoje), "yyyy-MM-dd"));
    loadRelatorios();
  }, []);

  useEffect(() => {
    if (dataInicio && dataFim) {
      loadRelatorios();
    }
  }, [dataInicio, dataFim, filterMunicipio]);

  async function loadRelatorios() {
    setLoading(true);
    try {
      // Carregar relatório de uso (usando view)
      const { data: usoData, error: usoError } = await supabase
        .from("v_relatorio_uso_unidades")
        .select("*");

      if (usoError) {
        console.error("Erro na view de relatório:", usoError);
      } else {
        setRelatorioUso((usoData || []) as unknown as RelatorioUsoUnidade[]);
      }

      // Carregar cedências a vencer
      const { data: vencerData, error: vencerError } = await supabase
        .from("v_cedencias_a_vencer")
        .select("*")
        .order("dias_para_vencer", { ascending: true });

      if (vencerError) {
        console.error("Erro na view de vencimentos:", vencerError);
      } else {
        setCedenciasAVencer((vencerData || []) as CedenciaAVencer[]);
      }

      // Carregar estatísticas gerais
      await loadEstatisticas();
    } catch (error) {
      console.error("Erro ao carregar relatórios:", error);
      toast.error("Erro ao carregar relatórios");
    } finally {
      setLoading(false);
    }
  }

  async function loadEstatisticas() {
    try {
      // Total de unidades
      const { count: totalUnidades } = await supabase
        .from("unidades_locais")
        .select("*", { count: "exact", head: true });

      // Total de cedências
      const { data: cedenciasData, error: cedenciasError } = await supabase
        .from("agenda_unidade")
        .select("status, publico_estimado")
        .gte("data_inicio", dataInicio)
        .lte("data_fim", dataFim);

      if (cedenciasError) throw cedenciasError;

      const totalCedencias = cedenciasData?.length || 0;
      const cedenciasAprovadas = cedenciasData?.filter(c => c.status === "aprovado" || c.status === "concluido").length || 0;
      const cedenciasRejeitadas = cedenciasData?.filter(c => c.status === "rejeitado").length || 0;
      const publicoTotalAtendido = cedenciasData
        ?.filter(c => c.status === "aprovado" || c.status === "concluido")
        .reduce((sum, c) => sum + (c.publico_estimado || 0), 0) || 0;

      // Unidades mais usadas (top 5)
      const { data: topUnidades } = await supabase
        .from("agenda_unidade")
        .select(`
          unidade_local_id,
          unidades_locais!inner(nome_unidade)
        `)
        .in("status", ["aprovado", "concluido"])
        .gte("data_inicio", dataInicio)
        .lte("data_fim", dataFim);

      const unidadesCount: Record<string, { nome: string; total: number }> = {};
      topUnidades?.forEach((item: any) => {
        const id = item.unidade_local_id;
        const nome = item.unidades_locais?.nome_unidade || "Desconhecida";
        if (!unidadesCount[id]) {
          unidadesCount[id] = { nome, total: 0 };
        }
        unidadesCount[id].total++;
      });

      const unidadesMaisUsadas = Object.values(unidadesCount)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      // Municípios ativos
      const { data: municipiosData } = await supabase
        .from("unidades_locais")
        .select("municipio")
        .eq("status", "ativa");

      const municipiosAtivos = [...new Set(municipiosData?.map(m => m.municipio) || [])];

      setEstatisticas({
        totalUnidades: totalUnidades || 0,
        totalCedencias,
        cedenciasAprovadas,
        cedenciasRejeitadas,
        publicoTotalAtendido,
        unidadesMaisUsadas,
        municipiosAtivos,
      });
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    }
  }

  function handlePeriodoChange(periodo: string) {
    setFilterPeriodo(periodo);
    const hoje = new Date();
    
    switch (periodo) {
      case "mes_atual":
        setDataInicio(format(startOfMonth(hoje), "yyyy-MM-dd"));
        setDataFim(format(endOfMonth(hoje), "yyyy-MM-dd"));
        break;
      case "mes_anterior":
        const mesAnterior = subMonths(hoje, 1);
        setDataInicio(format(startOfMonth(mesAnterior), "yyyy-MM-dd"));
        setDataFim(format(endOfMonth(mesAnterior), "yyyy-MM-dd"));
        break;
      case "trimestre":
        setDataInicio(format(subMonths(hoje, 3), "yyyy-MM-dd"));
        setDataFim(format(hoje, "yyyy-MM-dd"));
        break;
      case "ano":
        setDataInicio(`${hoje.getFullYear()}-01-01`);
        setDataFim(format(hoje, "yyyy-MM-dd"));
        break;
      case "personalizado":
        // Mantém as datas atuais
        break;
    }
  }

  const filteredRelatorio = relatorioUso.filter(r => 
    filterMunicipio === "all" || r.municipio === filterMunicipio
  );

  return (
    <ModuleLayout module="patrimonio">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Relatórios Gerenciais
            </h1>
            <p className="text-muted-foreground">
              Análise de uso das unidades esportivas e cedências
            </p>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros do Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Período</Label>
                <Select value={filterPeriodo} onValueChange={handlePeriodoChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mes_atual">Mês Atual</SelectItem>
                    <SelectItem value="mes_anterior">Mês Anterior</SelectItem>
                    <SelectItem value="trimestre">Último Trimestre</SelectItem>
                    <SelectItem value="ano">Ano Atual</SelectItem>
                    <SelectItem value="personalizado">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {filterPeriodo === "personalizado" && (
                <>
                  <div className="space-y-2">
                    <Label>Data Início</Label>
                    <Input
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Fim</Label>
                    <Input
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label>Município</Label>
                <Select value={filterMunicipio} onValueChange={setFilterMunicipio}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {MUNICIPIOS_RORAIMA.map((mun) => (
                      <SelectItem key={mun} value={mun}>
                        {mun}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Cards de Estatísticas */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{estatisticas?.totalUnidades || 0}</p>
                      <p className="text-sm text-muted-foreground">Total de Unidades</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-info/10 rounded-full">
                      <Calendar className="h-6 w-6 text-info" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{estatisticas?.totalCedencias || 0}</p>
                      <p className="text-sm text-muted-foreground">Total de Cedências</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-success/10 rounded-full">
                      <CheckCircle className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{estatisticas?.cedenciasAprovadas || 0}</p>
                      <p className="text-sm text-muted-foreground">Aprovadas/Concluídas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-warning/10 rounded-full">
                      <Users className="h-6 w-6 text-warning" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {estatisticas?.publicoTotalAtendido?.toLocaleString("pt-BR") || 0}
                      </p>
                      <p className="text-sm text-muted-foreground">Público Atendido</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Unidades Mais Utilizadas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Unidades Mais Utilizadas
                  </CardTitle>
                  <CardDescription>Top 5 unidades com mais cedências no período</CardDescription>
                </CardHeader>
                <CardContent>
                  {estatisticas?.unidadesMaisUsadas && estatisticas.unidadesMaisUsadas.length > 0 ? (
                    <div className="space-y-4">
                      {estatisticas.unidadesMaisUsadas.map((unidade, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{unidade.nome}</p>
                            <div className="w-full bg-muted rounded-full h-2 mt-1">
                              <div 
                                className="bg-primary rounded-full h-2 transition-all"
                                style={{ 
                                  width: `${(unidade.total / estatisticas.unidadesMaisUsadas[0].total) * 100}%` 
                                }}
                              />
                            </div>
                          </div>
                          <span className="text-sm font-medium">
                            {unidade.total} cedências
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum dado disponível para o período
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Cedências a Vencer */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    Cedências a Vencer
                  </CardTitle>
                  <CardDescription>Próximos 30 dias</CardDescription>
                </CardHeader>
                <CardContent>
                  {cedenciasAVencer.length > 0 ? (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {cedenciasAVencer.slice(0, 10).map((cedencia) => (
                        <div 
                          key={cedencia.agenda_id} 
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{cedencia.titulo}</p>
                            <p className="text-sm text-muted-foreground">
                              {cedencia.nome_unidade} - {cedencia.municipio}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Término: {format(parseISO(cedencia.data_fim), "dd/MM/yyyy")}
                            </p>
                          </div>
                          <Badge 
                            className={
                              cedencia.dias_para_vencer <= 7 
                                ? "bg-destructive text-destructive-foreground"
                                : cedencia.dias_para_vencer <= 15
                                ? "bg-warning text-warning-foreground"
                                : "bg-muted text-muted-foreground"
                            }
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            {cedencia.dias_para_vencer} dias
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhuma cedência próxima do vencimento
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tabela de Relatório por Unidade */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Relatório de Uso por Unidade
                </CardTitle>
                <CardDescription>
                  Detalhamento das cedências por unidade esportiva
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Unidade</TableHead>
                      <TableHead>Município</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Aprovadas</TableHead>
                      <TableHead className="text-center">Rejeitadas</TableHead>
                      <TableHead className="text-center">Concluídas</TableHead>
                      <TableHead className="text-right">Público Est.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRelatorio.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Nenhum dado disponível
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRelatorio.map((item) => (
                        <TableRow key={item.unidade_id}>
                          <TableCell className="font-medium">{item.nome_unidade}</TableCell>
                          <TableCell>{item.municipio}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.tipo_unidade}</Badge>
                          </TableCell>
                          <TableCell className="text-center">{item.total_cedencias}</TableCell>
                          <TableCell className="text-center">
                            <span className="text-success font-medium">{item.cedencias_aprovadas}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-destructive font-medium">{item.cedencias_rejeitadas}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-primary font-medium">{item.cedencias_concluidas}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            {item.total_publico_estimado?.toLocaleString("pt-BR") || 0}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </ModuleLayout>
  );
}

export default function RelatoriosCedenciaPage() {
  return (
    <ProtectedRoute requiredModule="patrimonio">
      <RelatoriosCedenciaContent />
    </ProtectedRoute>
  );
}
