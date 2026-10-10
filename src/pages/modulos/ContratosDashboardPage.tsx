/**
 * DASHBOARD - CONTRATOS
 * Usa ModuleLayout para navegação modular e os padrões do design system
 * (PageHeader, KpiCard).
 */

import { FileText, Calendar, FileEdit, BarChart3, TrendingUp, Gavel, Globe, AlertCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { useContratosDashboardStats } from "@/hooks/dashboard";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { KpiCard, PageHeader } from "@/components/design-system";
import { Link } from "react-router-dom";

const numero = new Intl.NumberFormat("pt-BR");

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}K`;
  }
  return `R$ ${value.toFixed(0)}`;
}

interface Indicador {
  rotulo: string;
  valor: string;
  icone: LucideIcon;
  /** Sem `href`: não há tela própria para o indicador. */
  href?: string;
}

export default function ContratosDashboardPage() {
  const { data: stats, isLoading, isError, refetch } = useContratosDashboardStats();

  // Sem dado (erro) mostra "—" em vez de um zero que parece real
  const valor = (n: number | undefined) => (stats ? numero.format(n || 0) : "—");

  const indicadores: Indicador[] = [
    {
      rotulo: "Contratos vigentes",
      valor: valor(stats?.contratosVigentes),
      icone: FileText,
    },
    { rotulo: "A vencer (90 dias)", valor: valor(stats?.aVencer90Dias), icone: Calendar },
    { rotulo: "Aditivos pendentes", valor: valor(stats?.aditivosPendentes), icone: FileEdit },
    {
      rotulo: "Valor total",
      valor: stats ? formatCurrency(stats.valorTotal || 0) : "—",
      icone: BarChart3,
    },
  ];

  // Só rotas registradas em App.tsx (as mesmas de src/config/menu.config.ts); ainda não há tela própria de lista de contratos
  const quickActions = [
    { label: "Contratos", description: "Processo de compras e contratos", href: "/processos/compras?tab=contratos", icon: FileText },
    { label: "Execução contratual", description: "Acompanhar execução", href: "/processos/compras?tab=execucao", icon: TrendingUp },
    { label: "Licitações", description: "Processo de compras", href: "/processos/compras", icon: Gavel },
    { label: "Contratos publicados", description: "Portal da transparência", href: "/transparencia/contratos", icon: Globe },
  ];

  return (
    <ModuleLayout module="contratos">
      <div className="space-y-6">
        <PageHeader
          titulo="Contratos"
          descricao="Gestão e execução contratual"
          acoes={
            <Button asChild>
              <Link to="/processos/compras?tab=contratos">
                <FileText className="h-4 w-4" aria-hidden="true" />
                Ver contratos
              </Link>
            </Button>
          }
        />

        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription className="flex flex-wrap items-center gap-2">
              Não foi possível carregar os indicadores.
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Indicadores: os que têm tela própria levam a ela */}
        <section aria-labelledby="contratos-indicadores">
          <h2 id="contratos-indicadores" className="sr-only">Indicadores</h2>
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {indicadores.map((ind) => {
              const cartao = (
                <KpiCard
                  rotulo={ind.rotulo}
                  valor={ind.valor}
                  icone={ind.icone}
                  carregando={isLoading}
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

        {/* Ações rápidas */}
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
