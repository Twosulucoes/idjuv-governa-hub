/**
 * DASHBOARD - FINANCEIRO
 * Usa ModuleLayout para navegação modular e os padrões do design system
 * (PageHeader, KpiCard). Consome useDashboardFinanceiro (hook centralizado).
 */

import { DollarSign, FileText, CreditCard, TrendingUp, Receipt, Calculator, AlertCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { useDashboardFinanceiro } from "@/hooks/useFinanceiro";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { KpiCard, PageHeader } from "@/components/design-system";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/lib/formatters";

const numero = new Intl.NumberFormat("pt-BR");
const percentual = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

interface Indicador {
  rotulo: string;
  valor: string;
  icone: LucideIcon;
  href?: string;
  carregando: boolean;
}

export default function FinanceiroDashboardPage() {
  const {
    resumoOrcamentario,
    solicitacoesPendentes,
    loading,
  } = useDashboardFinanceiro();

  const resumo = resumoOrcamentario.data;

  // Sem dado (erro) mostra "—" em vez de um zero que parece real
  const indicadores: Indicador[] = [
    {
      rotulo: "Dotação atual",
      valor: resumo ? formatCurrency(resumo.dotacao_atual || 0) : "—",
      icone: DollarSign,
      href: "/financeiro/orcamento",
      carregando: loading,
    },
    {
      rotulo: "Executado (pago / dotação)",
      valor: resumo ? `${percentual.format(resumo.percentual_executado || 0)}%` : "—",
      icone: TrendingUp,
      carregando: loading,
    },
    {
      rotulo: "Solicitações pendentes",
      valor: typeof solicitacoesPendentes.data === "number" ? numero.format(solicitacoesPendentes.data) : "—",
      icone: FileText,
      href: "/financeiro/solicitacoes",
      carregando: solicitacoesPendentes.isLoading,
    },
    {
      rotulo: "Pago",
      valor: resumo ? formatCurrency(resumo.pago || 0) : "—",
      icone: CreditCard,
      href: "/financeiro/pagamentos",
      carregando: loading,
    },
  ];

  const quickActions = [
    { label: "Solicitações", description: "Solicitações de despesa", href: "/financeiro/solicitacoes", icon: Receipt },
    { label: "Empenhos", description: "Gerenciar empenhos", href: "/financeiro/empenhos", icon: FileText },
    { label: "Liquidações", description: "Processar liquidações", href: "/financeiro/liquidacoes", icon: Calculator },
    { label: "Pagamentos", description: "Ordens de pagamento", href: "/financeiro/pagamentos", icon: CreditCard },
  ];

  return (
    <ModuleLayout module="financeiro">
      <div className="space-y-6">
        <PageHeader
          titulo="Financeiro"
          descricao="Orçamento, empenhos, liquidações e pagamentos"
        />

        {resumoOrcamentario.isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription className="flex flex-wrap items-center gap-2">
              Não foi possível carregar os indicadores.
              <Button variant="outline" size="sm" onClick={() => resumoOrcamentario.refetch()}>
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Indicadores: os que têm tela própria levam a ela */}
        <section aria-labelledby="fin-indicadores">
          <h2 id="fin-indicadores" className="sr-only">Indicadores</h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {indicadores.map((ind) => {
              const cartao = (
                <KpiCard
                  rotulo={ind.rotulo}
                  valor={ind.valor}
                  icone={ind.icone}
                  carregando={ind.carregando}
                  className="h-full"
                />
              );
              return (
                <li key={ind.rotulo}>
                  {ind.href ? (
                    <Link
                      to={ind.href}
                      className="block h-full rounded-lg transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {cartao}
                    </Link>
                  ) : (
                    cartao
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <h2 className="text-h2 text-foreground">Ações rápidas</h2>
            <CardDescription>Acesse as principais funcionalidades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.label}
                    variant="outline"
                    className="h-auto sm:h-auto py-4 flex flex-col items-center gap-2 whitespace-normal"
                    asChild
                  >
                    <Link to={action.href}>
                      <Icon className="h-6 w-6" aria-hidden="true" />
                      <span className="font-medium">{action.label}</span>
                      <span className="text-caption text-muted-foreground">{action.description}</span>
                    </Link>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
