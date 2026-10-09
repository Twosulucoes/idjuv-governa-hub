/**
 * DASHBOARD - RECURSOS HUMANOS
 * Usa ModuleLayout para navegação modular e os padrões do design system
 * (PageHeader, KpiCard). Piloto da Fase 3: docs/superpowers/plans/2026-10-09-design-system.md
 */

import { Users, Calendar, Plane, Clock, UserPlus, Award, AlertCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { useRHDashboardStats } from "@/hooks/dashboard";
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

export default function RHDashboardPage() {
  const { data: stats, isLoading, isError, refetch } = useRHDashboardStats();

  // Sem dado (erro) mostra "—" em vez de um zero que parece real
  const valor = (n: number | undefined, sufixo = "") =>
    stats && typeof n === "number" ? `${numero.format(n)}${sufixo}` : "—";

  const indicadores: Indicador[] = [
    { rotulo: "Servidores ativos", valor: valor(stats?.servidoresAtivos), icone: Users, href: "/rh/servidores" },
    { rotulo: "Em férias agora", valor: valor(stats?.emFerias), icone: Calendar, href: "/rh/ferias" },
    { rotulo: "Viagens aguardando autorização", valor: valor(stats?.viagensPendentes), icone: Plane, href: "/rh/viagens" },
    { rotulo: "Presença média no mês", valor: valor(stats?.frequenciaHoje, "%"), icone: Clock, href: "/rh/frequencia" },
  ];

  const quickActions = [
    { label: "Novo servidor", description: "Cadastrar servidor", href: "/rh/servidores/novo", icon: UserPlus },
    { label: "Lançar férias", description: "Programar férias", href: "/rh/ferias", icon: Calendar },
    { label: "Nova viagem", description: "Solicitar diária", href: "/rh/viagens", icon: Plane },
    { label: "Designações", description: "Gerenciar designações", href: "/rh/designacoes", icon: Award },
  ];

  return (
    <ModuleLayout module="rh">
      <div className="space-y-6">
        <PageHeader
          titulo="Recursos Humanos"
          descricao="Gestão de pessoal, frequência, férias e viagens"
          acoes={
            <Button asChild>
              <Link to="/rh/servidores/novo">
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                Novo servidor
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
        <section aria-labelledby="rh-indicadores">
          <h2 id="rh-indicadores" className="sr-only">Indicadores</h2>
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
