import { 
  CheckCircle2, 
  Users, 
  FileText, 
  Shield,
  Target,
  Calendar,
  Download
} from "lucide-react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChartCard, PageHeader, StatusBadge, type TomStatus } from "@/components/design-system";
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
} from "recharts";

// Dados dos indicadores principais
const indicadoresPrincipais = [
  {
    titulo: "Conformidade Geral",
    valor: 87,
    meta: 90,
    icon: CheckCircle2,
    cor: "text-success",
    bgCor: "bg-success/15",
  },
  {
    titulo: "Processos Mapeados",
    valor: 24,
    meta: 30,
    icon: FileText,
    cor: "text-info",
    bgCor: "bg-info/15",
  },
  {
    titulo: "Capacitações Realizadas",
    valor: 156,
    meta: 200,
    icon: Users,
    cor: "text-primary",
    bgCor: "bg-primary/15",
  },
  {
    titulo: "Riscos Mitigados",
    valor: 18,
    meta: 22,
    icon: Shield,
    cor: "text-warning",
    bgCor: "bg-warning/15",
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
  { area: "Compras", quantidade: 8, cor: "hsl(var(--chart-1))" },
  { area: "RH", quantidade: 5, cor: "hsl(var(--chart-2))" },
  { area: "Patrimônio", quantidade: 4, cor: "hsl(var(--chart-3))" },
  { area: "Financeiro", quantidade: 4, cor: "hsl(var(--chart-4))" },
  { area: "Almoxarifado", quantidade: 3, cor: "hsl(var(--chart-5))" },
];

// Dados de riscos por categoria
const dadosRiscos = [
  { categoria: "Baixo", quantidade: 12, cor: "hsl(var(--success))" },
  { categoria: "Médio", quantidade: 8, cor: "hsl(var(--chart-8))" },
  { categoria: "Alto", quantidade: 4, cor: "hsl(var(--chart-3))" },
  { categoria: "Crítico", quantidade: 1, cor: "hsl(var(--destructive))" },
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

// Situação da ação → rótulo e tom (status nunca só por cor)
const SITUACAO_ACAO: Record<string, { label: string; tom: TomStatus }> = {
  concluido: { label: "Concluído", tom: "sucesso" },
  em_andamento: { label: "Em andamento", tom: "andamento" },
  pendente: { label: "Pendente", tom: "pendente" },
};

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
    <ModuleLayout module="governanca">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Governança", href: "/governanca" }, { rotulo: "Relatório de governança" }]}
          titulo="Relatório anual de governança e integridade"
          descricao={
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" aria-hidden="true" />
              Exercício 2025 - Atualizado em dezembro
            </span>
          }
          acoes={
            <Button
              onClick={() => {
                generateRelatorioGovernancaPDF();
                toast.success("PDF do Relatório de Governança gerado com sucesso!");
              }}
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              Baixar PDF
            </Button>
          }
        />

        {/* Indicadores principais (com meta e progresso; por isso não usam KpiCard) */}
        <section aria-labelledby="relatorio-indicadores">
          <h2 id="relatorio-indicadores" className="sr-only">Indicadores principais</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {indicadoresPrincipais.map((indicador) => (
            <Card key={indicador.titulo} className="relative overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {indicador.titulo}
                    </p>
                    <p className="text-h1 tabular-nums">
                      {indicador.valor}
                      {indicador.titulo === "Conformidade Geral" && "%"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Meta: {indicador.meta}{indicador.titulo === "Conformidade Geral" && "%"}
                    </p>
                  </div>
                  <div className={`w-12 h-12 ${indicador.bgCor} rounded-lg flex items-center justify-center`}>
                    <indicador.icon className={`w-6 h-6 ${indicador.cor}`} aria-hidden="true" />
                  </div>
                </div>
                <Progress 
                  value={(indicador.valor / indicador.meta) * 100} 
                  className="mt-4 h-2" 
                  aria-label={`${indicador.titulo}: ${Math.round((indicador.valor / indicador.meta) * 100)}% da meta`}
                />
              </CardContent>
            </Card>
          ))}
        </div>
        </section>

        {/* Gráficos */}
        <h2 className="sr-only">Gráficos</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Conformidade */}
          <ChartCard
            titulo="Evolução da conformidade"
            descricao="Índice mensal de conformidade vs meta estabelecida"
            tabela={{
              colunas: [
                { chave: "mes", rotulo: "Mês" },
                { chave: "conformidade", rotulo: "Conformidade (%)", numerica: true },
                { chave: "meta", rotulo: "Meta (%)", numerica: true },
              ],
              linhas: dadosConformidade,
            }}
          >
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
          </ChartCard>

          {/* Gráfico de Processos por Área */}
          <ChartCard
            titulo="Processos mapeados por área"
            descricao="Distribuição dos 24 processos formalizados"
            tabela={{
              colunas: [
                { chave: "area", rotulo: "Área" },
                { chave: "quantidade", rotulo: "Processos", numerica: true },
              ],
              linhas: dadosProcessos.map(({ area, quantidade }) => ({ area, quantidade })),
            }}
          >
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
          </ChartCard>

          {/* Gráfico de Riscos */}
          <ChartCard
            titulo="Matriz de riscos"
            descricao="Classificação dos 25 riscos identificados"
            tabela={{
              colunas: [
                { chave: "categoria", rotulo: "Classificação" },
                { chave: "quantidade", rotulo: "Riscos", numerica: true },
              ],
              linhas: dadosRiscos.map(({ categoria, quantidade }) => ({ categoria, quantidade })),
            }}
          >
              <ChartContainer config={chartConfig} className="mx-auto h-[300px] w-full max-w-[400px]">
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
          </ChartCard>

          {/* Ações de Integridade */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" aria-hidden="true" />
                Plano de ação de integridade
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
                        <StatusBadge tom={SITUACAO_ACAO[acao.status]?.tom ?? "neutro"}>
                          {SITUACAO_ACAO[acao.status]?.label ?? acao.status}
                        </StatusBadge>
                        <span className="text-xs text-muted-foreground">
                          {acao.prazo}
                        </span>
                      </div>
                    </div>
                    <Progress value={acao.percentual} className="h-2" aria-label={`${acao.titulo}: ${acao.percentual}% concluído`} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumo Executivo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-h2">Resumo executivo</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success" aria-hidden="true" />
                  Principais conquistas
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
                  <Target className="w-5 h-5 text-primary" aria-hidden="true" />
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

        {/* Fundamentos Legais */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-h3">Fundamentação legal</CardTitle>
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
                  <li>• Lei nº 2.301/2025 (IDJUV)</li>
                  <li>• Decreto Regulamentador IDJUV</li>
                  <li>• Regimento Interno IDJUV</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold mb-2">Normativas Internas</h5>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Plano de Integridade 2025</li>
                  <li>• Código de Ética e Conduta</li>
                  <li>• Matriz de Riscos Institucional</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
