/**
 * DASHBOARD - TRANSPARÊNCIA
 * Usa ModuleLayout para navegação modular e os padrões do design system
 * (PageHeader, KpiCard). Ver docs/GUIA_FRONTEND.md (Design System).
 */

import { FileText, Search, Download, Globe, BarChart3, Users, AlertCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { useTransparenciaDashboardStats } from "@/hooks/dashboard";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { KpiCard, PageHeader } from "@/components/design-system";
import { Link } from "react-router-dom";

const numero = new Intl.NumberFormat("pt-BR");

interface Indicador {
  rotulo: string;
  valor: string;
  icone: LucideIcon;
  href?: string;
}

export default function TransparenciaDashboardPage() {
  const { data: stats, isLoading, isError, refetch } = useTransparenciaDashboardStats();

  // Sem dado (erro) mostra "—" em vez de um zero que parece real
  const valor = (n: number | undefined) => (stats ? numero.format(n || 0) : "—");

  const indicadores: Indicador[] = [
    { rotulo: "Publicações", valor: valor(stats?.publicacoes), icone: FileText },
    { rotulo: "Downloads no mês", valor: valor(stats?.downloadsMes), icone: Download },
    { rotulo: "Solicitações LAI", valor: valor(stats?.solicitacoesLai), icone: Search, href: "/transparencia/lai" },
    { rotulo: "Acessos no mês", valor: valor(stats?.acessosMes), icone: Globe },
  ];

  const quickActions = [
    { label: "Portal LAI", description: "e-SIC", href: "/transparencia/lai", icon: Search },
    { label: "Licitações", description: "Publicações", href: "/transparencia/licitacoes", icon: FileText },
    { label: "Cargos e remuneração", description: "Quadro de pessoal", href: "/transparencia/cargos", icon: Users },
    { label: "Execução orçamentária", description: "Despesas públicas", href: "/transparencia/orcamento", icon: BarChart3 },
  ];

  return (
    <ModuleLayout module="transparencia">
      <div className="space-y-6">
        <PageHeader titulo="Transparência" descricao="Portal LAI e dados públicos" />

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
        <section aria-labelledby="transparencia-indicadores">
          <h2 id="transparencia-indicadores" className="sr-only">Indicadores</h2>
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {indicadores.map((ind) => {
              const card = (
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
                      {card}
                    </Link>
                  ) : (
                    card
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
