/**
 * DASHBOARD - GOVERNANÇA
 * Usa ModuleLayout para navegação modular e os padrões do design system
 * (PageHeader, KpiCard).
 */

import { Building2, Network, Users, FileText, Shield, ClipboardList, AlertCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { useGovernancaDashboardStats } from "@/hooks/dashboard";
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
  href: string;
}

export default function GovernancaDashboardPage() {
  const { data: stats, isLoading, isError, refetch } = useGovernancaDashboardStats();

  // Sem dado (erro) mostra "—" em vez de um zero que parece real
  const valor = (n: number | undefined) => (stats ? numero.format(n || 0) : "—");

  const indicadores: Indicador[] = [
    { rotulo: "Unidades organizacionais", valor: valor(stats?.unidadesOrg), icone: Building2, href: "/organograma" },
    { rotulo: "Cargos", valor: valor(stats?.cargos), icone: Users, href: "/cargos" },
    { rotulo: "Federações", valor: valor(stats?.federacoes), icone: Shield, href: "/admin/federacoes" },
    { rotulo: "Portarias", valor: valor(stats?.portarias), icone: FileText, href: "/rh/portarias" },
  ];

  const quickActions = [
    { label: "Organograma", description: "Estrutura organizacional", href: "/organograma", icon: Network },
    { label: "Matriz RACI", description: "Responsabilidades", href: "/governanca/matriz-raci", icon: ClipboardList },
    { label: "Federações", description: "Gestão de entidades", href: "/admin/federacoes", icon: Shield },
    { label: "Portarias", description: "Atos normativos", href: "/rh/portarias", icon: FileText },
  ];

  return (
    <ModuleLayout module="governanca">
      <div className="space-y-6">
        <PageHeader
          titulo="Governança"
          descricao="Estrutura organizacional, normas e compliance"
          acoes={
            <Button asChild>
              <Link to="/organograma">
                <Network className="h-4 w-4" aria-hidden="true" />
                Ver organograma
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

        {/* Indicadores: cada cartão leva à tela do assunto */}
        <section aria-labelledby="governanca-indicadores">
          <h2 id="governanca-indicadores" className="sr-only">Indicadores</h2>
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {indicadores.map((ind) => (
              <li key={ind.rotulo}>
                <Link
                  to={ind.href}
                  className="block h-full rounded-lg transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <KpiCard
                    rotulo={ind.rotulo}
                    valor={ind.valor}
                    icone={ind.icone}
                    carregando={isLoading}
                    className="h-full"
                  />
                </Link>
              </li>
            ))}
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
