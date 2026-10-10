/**
 * Dashboard do Módulo Financeiro
 * Visão consolidada de orçamento, despesas, receitas e pendências
 * Padrões do design system: PageHeader, KpiCard, ChartCard, EmptyState.
 */

import type { LucideIcon } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ChartCard, EmptyState, KpiCard, PageHeader } from "@/components/design-system";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  AlertCircle,
  FileText,
  Building2,
  CreditCard,
  ArrowDownRight,
  PiggyBank,
  Receipt,
  CheckCircle2,
  Plus,
  History,
} from "lucide-react";
import { useDashboardFinanceiro } from "@/hooks/useFinanceiro";
import { useIdentidade } from "@/core/tenant";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const numero = new Intl.NumberFormat("pt-BR");

interface Indicador {
  rotulo: string;
  valor: string;
  icone: LucideIcon;
  href: string;
  carregando: boolean;
}

const chartConfig = {
  valor: { label: "Valor", color: "hsl(var(--chart-1))" },
};

const operacoes = [
  { label: "Solicitações", href: "/financeiro/solicitacoes", icon: FileText },
  { label: "Empenhos", href: "/financeiro/empenhos", icon: Receipt },
  { label: "Liquidações", href: "/financeiro/liquidacoes", icon: CheckCircle2 },
  { label: "Pagamentos", href: "/financeiro/pagamentos", icon: ArrowDownRight },
  { label: "Adiantamentos", href: "/financeiro/adiantamentos", icon: Wallet },
  { label: "Restos a pagar", href: "/financeiro/restos-a-pagar", icon: History },
];

export default function DashboardFinanceiroPage() {
  const { sigla } = useIdentidade();
  const {
    resumoOrcamentario,
    contasBancarias,
    pagamentosPendentes,
    adiantamentosPendentes,
    solicitacoesPendentes,
    loading,
  } = useDashboardFinanceiro();

  const resumo = resumoOrcamentario.data;
  const contas = contasBancarias.data || [];
  const saldoTotal = contas.reduce((acc, c) => acc + Number(c.saldo_atual || 0), 0);
  const temErro = resumoOrcamentario.isError || contasBancarias.isError;

  // Sem dado (erro) mostra "—" em vez de um zero que parece real
  const moeda = (n: number | undefined) => (resumo ? formatCurrency(n || 0) : "—");
  const contagem = (n: number | undefined) => (typeof n === "number" ? numero.format(n) : "—");

  const orcamento: Indicador[] = [
    { rotulo: "Dotação atual", valor: moeda(resumo?.dotacao_atual), icone: Wallet, href: "/financeiro/orcamento", carregando: loading },
    { rotulo: "Empenhado", valor: moeda(resumo?.empenhado), icone: TrendingUp, href: "/financeiro/empenhos", carregando: loading },
    { rotulo: "Pago", valor: moeda(resumo?.pago), icone: TrendingDown, href: "/financeiro/pagamentos", carregando: loading },
    { rotulo: "Saldo disponível para empenho", valor: moeda(resumo?.saldo_disponivel), icone: PiggyBank, href: "/financeiro/orcamento", carregando: loading },
  ];

  const pendencias: Indicador[] = [
    {
      rotulo: "Solicitações pendentes",
      valor: contagem(solicitacoesPendentes.data),
      icone: FileText,
      href: "/financeiro/solicitacoes?status=pendente_analise",
      carregando: solicitacoesPendentes.isLoading,
    },
    {
      rotulo: "Pagamentos programados",
      valor: contagem(pagamentosPendentes.data),
      icone: Clock,
      href: "/financeiro/pagamentos?status=programado",
      carregando: pagamentosPendentes.isLoading,
    },
    {
      rotulo: "Adiantamentos pendentes",
      valor: contagem(adiantamentosPendentes.data),
      icone: AlertTriangle,
      href: "/financeiro/adiantamentos",
      carregando: adiantamentosPendentes.isLoading,
    },
  ];

  // Execução orçamentária: mesmas cores dos tokens de gráfico, com tabela alternativa
  const execucao = [
    { etapa: "Dotação inicial", valor: resumo?.dotacao_inicial || 0, cor: "hsl(var(--chart-7))" },
    { etapa: "Dotação atual", valor: resumo?.dotacao_atual || 0, cor: "hsl(var(--chart-1))" },
    { etapa: "Empenhado", valor: resumo?.empenhado || 0, cor: "hsl(var(--chart-4))" },
    { etapa: "Liquidado", valor: resumo?.liquidado || 0, cor: "hsl(var(--chart-6))" },
    { etapa: "Pago", valor: resumo?.pago || 0, cor: "hsl(var(--chart-2))" },
    { etapa: "Disponível", valor: resumo?.saldo_disponivel || 0, cor: "hsl(var(--chart-3))" },
  ];

  const renderIndicadores = (lista: Indicador[], classeGrade: string) => (
    <ul className={cn("grid gap-4", classeGrade)}>
      {lista.map((ind) => (
        <li key={ind.rotulo}>
          <Link
            to={ind.href}
            className="block h-full rounded-lg transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <KpiCard
              rotulo={ind.rotulo}
              valor={ind.valor}
              icone={ind.icone}
              carregando={ind.carregando}
              className="h-full"
            />
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <ModuleLayout module="financeiro">
      <div className="space-y-6">
        <PageHeader
          titulo="Financeiro"
          descricao={`Gestão orçamentária e financeira do ${sigla}`}
          acoes={
            <>
              <Button variant="outline" asChild>
                <Link to="/financeiro/relatorios">Relatórios</Link>
              </Button>
              <Button asChild>
                <Link to="/financeiro/solicitacoes?acao=nova">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Nova solicitação
                </Link>
              </Button>
            </>
          }
        />

        {temErro && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription className="flex flex-wrap items-center gap-2">
              Não foi possível carregar os dados financeiros.
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  resumoOrcamentario.refetch();
                  contasBancarias.refetch();
                }}
              >
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Resumo orçamentário */}
        <section aria-labelledby="fin-orcamento">
          <h2 id="fin-orcamento" className="sr-only">Resumo orçamentário</h2>
          {renderIndicadores(orcamento, "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4")}
        </section>

        {/* Pendências */}
        <section aria-labelledby="fin-pendencias" className="space-y-3">
          <h2 id="fin-pendencias" className="text-h2 text-foreground">Pendências</h2>
          {renderIndicadores(pendencias, "grid-cols-1 md:grid-cols-3")}
        </section>

        {/* Contas Bancárias e Operações */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <h2 className="text-h2 text-foreground flex items-center gap-2">
                <Building2 className="h-5 w-5" aria-hidden="true" />
                Contas bancárias
              </h2>
              <Badge variant="outline" className="tabular-nums">
                Total: {formatCurrency(saldoTotal)}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <>
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </>
              ) : contas.length === 0 ? (
                <EmptyState
                  icone={Building2}
                  titulo="Nenhuma conta cadastrada"
                  descricao="Cadastre as contas bancárias para acompanhar os saldos aqui."
                  className="py-6"
                />
              ) : (
                <ul className="space-y-3">
                  {contas.slice(0, 5).map((conta) => (
                    <li
                      key={conta.id}
                      className="flex items-center justify-between gap-3 p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <CreditCard className="h-8 w-8 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="font-medium text-body">{conta.nome_conta}</p>
                          <p className="text-caption text-muted-foreground">
                            {conta.banco_nome} | Ag: {conta.agencia} | CC: {conta.conta}
                          </p>
                        </div>
                      </div>
                      <p
                        className={cn(
                          "shrink-0 text-right font-bold tabular-nums",
                          Number(conta.saldo_atual) >= 0 ? "text-success" : "text-destructive",
                        )}
                      >
                        {formatCurrency(Number(conta.saldo_atual))}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link to="/financeiro/contas-bancarias">Ver todas as contas</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-h2 text-foreground">Operações</h2>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {operacoes.map((op) => {
                const Icon = op.icon;
                return (
                  <Button
                    key={op.label}
                    variant="outline"
                    className="h-auto sm:h-auto py-4 flex flex-col items-center gap-2 whitespace-normal"
                    asChild
                  >
                    <Link to={op.href}>
                      <Icon className="h-6 w-6" aria-hidden="true" />
                      <span className="font-medium">{op.label}</span>
                    </Link>
                  </Button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Execução orçamentária: só com dados (sem resumo, nada de gráfico com zeros) */}
        {loading || resumo ? (
        <ChartCard
          titulo="Execução orçamentária"
          descricao={
            resumo
              ? `${(resumo.percentual_executado || 0).toFixed(1)}% da dotação atual já foi pago`
              : undefined
          }
          tabela={{
            colunas: [
              { chave: "etapa", rotulo: "Etapa" },
              { chave: "valor", rotulo: "Valor", numerica: true },
            ],
            linhas: execucao.map(({ etapa, valor }) => ({
              etapa,
              valor: <span className="tabular-nums">{formatCurrency(valor)}</span>,
            })),
          }}
        >
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={execucao} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  type="number"
                  className="text-xs"
                  tickFormatter={(v: number) =>
                    new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(v)
                  }
                />
                <YAxis dataKey="etapa" type="category" className="text-xs" width={110} />
                <ChartTooltip
                  content={<ChartTooltipContent formatter={(v) => formatCurrency(Number(v))} />}
                />
                <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                  {execucao.map((entry) => (
                    <Cell key={entry.etapa} fill={entry.cor} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </ChartCard>
        ) : (
          <Card>
            <EmptyState
              icone={Wallet}
              titulo="Execução orçamentária indisponível"
              descricao={
                resumoOrcamentario.isError
                  ? "Não foi possível carregar o resumo orçamentário."
                  : "Não há resumo orçamentário registrado para exibir."
              }
            />
          </Card>
        )}
      </div>
    </ModuleLayout>
  );
}
