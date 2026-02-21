/**
 * DASHBOARD - FINANCEIRO
 * Usa ModuleLayout para navegação modular
 * Consome useDashboardFinanceiro (hook centralizado) em vez de stats duplicados
 */

import { DollarSign, FileText, CreditCard, TrendingUp, Receipt, Calculator } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { useDashboardFinanceiro } from "@/hooks/useFinanceiro";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/lib/formatters";

export default function FinanceiroDashboardPage() {
  const {
    resumoOrcamentario,
    pagamentosPendentes,
    solicitacoesPendentes,
    loading,
  } = useDashboardFinanceiro();

  const resumo = resumoOrcamentario.data;
  const isLoading = loading;

  const statCards = [
    { 
      label: "Dotação Atual", 
      value: isLoading ? "..." : formatCurrency(resumo?.dotacao_atual || 0), 
      icon: DollarSign, 
      href: "/financeiro/orcamento" 
    },
    { 
      label: "Executado", 
      value: isLoading ? "..." : `${(resumo?.percentual_executado || 0).toFixed(1)}%`, 
      icon: TrendingUp 
    },
    { 
      label: "Solicitações Pendentes", 
      value: isLoading ? "..." : String(solicitacoesPendentes.data || 0), 
      icon: FileText, 
      href: "/financeiro/solicitacoes" 
    },
    { 
      label: "Pago", 
      value: isLoading ? "..." : formatCurrency(resumo?.pago || 0), 
      icon: CreditCard,
      href: "/financeiro/pagamentos"
    },
  ];

  const quickActions = [
    { label: "Nova Solicitação", description: "Solicitar despesa", href: "/financeiro/solicitacoes/nova", icon: Receipt },
    { label: "Empenhos", description: "Gerenciar empenhos", href: "/financeiro/empenhos", icon: FileText },
    { label: "Liquidações", description: "Processar liquidações", href: "/financeiro/liquidacoes", icon: Calculator },
    { label: "Pagamentos", description: "Ordens de pagamento", href: "/financeiro/pagamentos", icon: CreditCard },
  ];

  return (
    <ModuleLayout module="financeiro">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-green-500" />
            Financeiro
          </h1>
          <p className="text-muted-foreground">Orçamento, empenhos, liquidações e pagamentos</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            const content = (
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );

            return stat.href ? (
              <Link key={stat.label} to={stat.href}>
                {content}
              </Link>
            ) : (
              <div key={stat.label}>{content}</div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Acesse as principais funcionalidades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.label}
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    asChild
                  >
                    <Link to={action.href}>
                      <Icon className="h-6 w-6" />
                      <span className="font-medium">{action.label}</span>
                      <span className="text-xs text-muted-foreground">{action.description}</span>
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
