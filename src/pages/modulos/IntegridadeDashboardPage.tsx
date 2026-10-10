/**
 * DASHBOARD - INTEGRIDADE
 * Usa ModuleLayout para navegação modular e os padrões do design system
 * (PageHeader, KpiCard). Referência: src/pages/modulos/RHDashboardPage.tsx
 */

import { Shield, AlertTriangle, Lock, Eye, Scale, ClipboardList, AlertCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { useIntegridadeDashboardStats } from "@/hooks/dashboard";
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

export default function IntegridadeDashboardPage() {
  const { data: stats, isLoading, isError, refetch } = useIntegridadeDashboardStats();

  // Sem dado (erro) mostra "—" em vez de um zero que parece real
  const valor = (n: number | undefined, sufixo = "") =>
    stats && typeof n === "number" ? `${numero.format(n)}${sufixo}` : "—";

  const indicadores: Indicador[] = [
    { rotulo: "Denúncias abertas", valor: valor(stats?.denunciasAbertas), icone: AlertTriangle, href: "/integridade/denuncias" },
    { rotulo: "Em análise", valor: valor(stats?.emAnalise), icone: Eye },
    { rotulo: "Resolvidas no ano", valor: valor(stats?.resolvidasAno), icone: Shield },
    { rotulo: "Conformidade", valor: valor(stats?.conformidade, "%"), icone: Shield },
  ];

  const quickActions = [
    { label: "Canal de denúncias", description: "Receber denúncia", href: "/integridade/denuncias", icon: AlertTriangle },
    { label: "Gestão", description: "Administrar denúncias", href: "/integridade/gestao-denuncias", icon: ClipboardList },
    { label: "Código de ética", description: "Normas de conduta", href: "/integridade/codigo-etica", icon: Scale },
    { label: "Conflito de interesses", description: "Declarações", href: "/integridade/conflito", icon: Lock },
  ];

  return (
    <ModuleLayout module="integridade">
      <div className="space-y-6">
        <PageHeader
          titulo="Integridade"
          descricao="Ética, compliance e canal de denúncias"
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
        <section aria-labelledby="integridade-indicadores">
          <h2 id="integridade-indicadores" className="sr-only">Indicadores</h2>
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
