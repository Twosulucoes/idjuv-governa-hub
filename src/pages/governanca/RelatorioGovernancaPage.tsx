import { Link } from "react-router-dom";
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  FileText, 
  Shield,
  Target,
  Calendar,
  Download
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { generateRelatorioGovernancaPDF } from "@/lib/pdfGenerator";
import { toast } from "sonner";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";

// Dados dos indicadores principais
const indicadoresPrincipais = [
  {
    titulo: "Conformidade Geral",
    valor: 87,
    meta: 90,
    icon: CheckCircle2,
    cor: "text-emerald-600",
    bgCor: "bg-emerald-100",
  },
  {
    titulo: "Processos Mapeados",
    valor: 24,
    meta: 30,
    icon: FileText,
    cor: "text-blue-600",
    bgCor: "bg-blue-100",
  },
  {
    titulo: "Capacitações Realizadas",
    valor: 156,
    meta: 200,
    icon: Users,
    cor: "text-violet-600",
    bgCor: "bg-violet-100",
  },
  {
    titulo: "Riscos Mitigados",
    valor: 18,
    meta: 22,
    icon: Shield,
    cor: "text-amber-600",
    bgCor: "bg-amber-100",
  },
];

// Dados do gráfico de conformidade mensal
const dadosConformidade = [
  { mes: "Jan", conformidade: 72, meta: 90 },
  { mes: "Fev", conformidade: 75, meta: 90 },
  { mes: "Mar", conformidade: 78, meta: 90 },
  { mes: "Abr", conformidade: 80, meta: 90 },
  { mes: "Mai", conformidade: 82, meta: 90 },
  { mes: "Jun", conformidade: 85, meta: 90 },
  { mes: "Jul", conformidade: 84, meta: 90 },
  { mes: "Ago", conformidade: 86, meta: 90 },
  { mes: "Set", conformidade: 87, meta: 90 },
  { mes: "Out", conformidade: 87, meta: 90 },
  { mes: "Nov", conformidade: 88, meta: 90 },
  { mes: "Dez", conformidade: 87, meta: 90 },
];

// Dados do gráfico de processos por área
const dadosProcessos = [
  { area: "Compras", quantidade: 8, cor: "#3b82f6" },
  { area: "RH", quantidade: 5, cor: "#8b5cf6" },
  { area: "Patrimônio", quantidade: 4, cor: "#10b981" },
  { area: "Financeiro", quantidade: 4, cor: "#f59e0b" },
  { area: "Almoxarifado", quantidade: 3, cor: "#ef4444" },
];

// Dados de riscos por categoria
const dadosRiscos = [
  { categoria: "Baixo", quantidade: 12, cor: "#10b981" },
  { categoria: "Médio", quantidade: 8, cor: "#f59e0b" },
  { categoria: "Alto", quantidade: 4, cor: "#ef4444" },
  { categoria: "Crítico", quantidade: 1, cor: "#7c2d12" },
];

// Ações de integridade
const acoesIntegridade = [
  {
    titulo: "Treinamento em Ética",
    status: "concluido",
    percentual: 100,
    prazo: "Mar/2025",
  },
  {
    titulo: "Atualização Código de Conduta",
    status: "concluido",
    percentual: 100,
    prazo: "Abr/2025",
  },
  {
    titulo: "Mapeamento de Riscos",
    status: "em_andamento",
    percentual: 75,
    prazo: "Jun/2025",
  },
  {
    titulo: "Implantação Canal Denúncias",
    status: "concluido",
    percentual: 100,
    prazo: "Mai/2025",
  },
  {
    titulo: "Auditoria Interna",
    status: "em_andamento",
    percentual: 45,
    prazo: "Dez/2025",
  },
  {
    titulo: "Certificação ISO 37001",
    status: "pendente",
    percentual: 10,
    prazo: "Dez/2026",
  },
];

const chartConfig = {
  conformidade: {
    label: "Conformidade",
    color: "hsl(var(--primary))",
  },
  meta: {
    label: "Meta",
    color: "hsl(var(--muted-foreground))",
  },
};

export default function RelatorioGovernancaPage() {
  return (
    <MainLayout>
      {/* Cabeçalho */}
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 text-sm mb-4 opacity-80">
            <Link to="/" className="hover:underline">Início</Link>
            <span>/</span>
            <Link to="/governanca" className="hover:underline">Governança</Link>
            <span>/</span>
            <span>Relatório Anual</span>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-accent-foreground" />
              </div>
              <div>
                <h1 className="font-serif text-3xl lg:text-4xl font-bold">
                  Relatório Anual de Governança e Integridade
                </h1>
                <p className="opacity-90 mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Exercício 2025 - Atualizado em Dezembro
                </p>
              </div>
            </div>
            <Button 
              variant="secondary" 
              className="flex items-center gap-2"
              onClick={() => {
                generateRelatorioGovernancaPDF();
                toast.success("PDF do Relatório de Governança gerado com sucesso!");
              }}
            >
              <Download className="w-4 h-4" />
              Baixar PDF
            </Button>
          </div>
        </div>
      </section>

      {/* Indicadores Principais */}
      <section className="py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {indicadoresPrincipais.map((indicador) => (
              <Card key={indicador.titulo} className="relative overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {indicador.titulo}
                      </p>
                      <p className="text-3xl font-bold">
                        {indicador.valor}
                        {indicador.titulo === "Conformidade Geral" && "%"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Meta: {indicador.meta}{indicador.titulo === "Conformidade Geral" && "%"}
                      </p>
                    </div>
                    <div className={`w-12 h-12 ${indicador.bgCor} rounded-lg flex items-center justify-center`}>
                      <indicador.icon className={`w-6 h-6 ${indicador.cor}`} />
                    </div>
                  </div>
                  <Progress 
                    value={(indicador.valor / indicador.meta) * 100} 
                    className="mt-4 h-2" 
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Gráficos */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gráfico de Conformidade */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Evolução da Conformidade
                </CardTitle>
                <CardDescription>
                  Índice mensal de conformidade vs meta estabelecida
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <LineChart data={dadosConformidade}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="mes" className="text-xs" />
                    <YAxis domain={[60, 100]} className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="conformidade" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="meta" 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeDasharray="5 5"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Processos por Área */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Processos Mapeados por Área
                </CardTitle>
                <CardDescription>
                  Distribuição dos 24 processos formalizados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <BarChart data={dadosProcessos} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="area" type="category" className="text-xs" width={80} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="quantidade" radius={[0, 4, 4, 0]}>
                      {dadosProcessos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.cor} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Riscos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  Matriz de Riscos
                </CardTitle>
                <CardDescription>
                  Classificação dos 25 riscos identificados
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <ChartContainer config={chartConfig} className="h-[300px] w-full max-w-[400px]">
                  <PieChart>
                    <Pie
                      data={dadosRiscos}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="quantidade"
                      label={({ categoria, quantidade }) => `${categoria}: ${quantidade}`}
                    >
                      {dadosRiscos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.cor} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Ações de Integridade */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Plano de Ação de Integridade
                </CardTitle>
                <CardDescription>
                  Acompanhamento das ações planejadas para 2025
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {acoesIntegridade.map((acao) => (
                    <div key={acao.titulo} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{acao.titulo}</span>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              acao.status === "concluido" 
                                ? "default" 
                                : acao.status === "em_andamento" 
                                ? "secondary" 
                                : "outline"
                            }
                            className={
                              acao.status === "concluido" 
                                ? "bg-emerald-600" 
                                : ""
                            }
                          >
                            {acao.status === "concluido" 
                              ? "Concluído" 
                              : acao.status === "em_andamento" 
                              ? "Em Andamento" 
                              : "Pendente"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {acao.prazo}
                          </span>
                        </div>
                      </div>
                      <Progress value={acao.percentual} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Resumo Executivo */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-2xl">Resumo Executivo</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Principais Conquistas
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Implantação do Portal de Governança com 100% dos documentos estruturantes</li>
                    <li>• Canal de Denúncias operacional com garantia de anonimato</li>
                    <li>• 24 processos administrativos formalizados e documentados</li>
                    <li>• 156 servidores capacitados em ética e integridade</li>
                    <li>• Matriz de Riscos institucional aprovada e publicada</li>
                    <li>• Código de Ética e Conduta atualizado e divulgado</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Metas para 2026
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Atingir 95% de conformidade nos processos críticos</li>
                    <li>• Mapear 100% dos processos institucionais (30 processos)</li>
                    <li>• Implementar sistema de gestão de riscos automatizado</li>
                    <li>• Capacitar 100% dos servidores em integridade</li>
                    <li>• Obter certificação ISO 37001 (Antissuborno)</li>
                    <li>• Realizar auditoria externa de governança</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Fundamentos Legais */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="font-serif text-xl">Fundamentação Legal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h5 className="font-semibold mb-2">Legislação Federal</h5>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Lei nº 13.303/2016 (Estatais)</li>
                    <li>• Lei nº 12.846/2013 (Anticorrupção)</li>
                    <li>• Decreto nº 9.203/2017 (Governança)</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold mb-2">Legislação Estadual</h5>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Lei Estadual nº XXX/2025 (IDJUV)</li>
                    <li>• Decreto Regulamentador IDJUV</li>
                    <li>• Regimento Interno IDJUV</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-semibold mb-2">Normativas Internas</h5>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Plano de Integridade 2025</li>
                    <li>• Código de Ética e Conduta</li>
                    <li>• Política de Gestão de Riscos</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}
