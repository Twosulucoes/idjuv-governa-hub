/**
 * DASHBOARD - COMUNICAÇÃO (ASCOM)
 * Usa ModuleLayout para navegação modular e os padrões do design system
 * (PageHeader, KpiCard). Ver docs/GUIA_FRONTEND.md (Design System).
 */

import { FileText, Image, Calendar, Send, Clock, CheckCircle, AlertCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { useComunicacaoDashboardStats } from "@/hooks/dashboard";
import { useAuth } from "@/contexts/AuthContext";
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

export default function ComunicacaoDashboardPage() {
  const { data: stats, isLoading, isError, refetch } = useComunicacaoDashboardStats();
  const { hasPermission } = useAuth();

  // Sem dado (erro) mostra "—" em vez de um zero que parece real
  const valor = (n: number | undefined) => (stats ? numero.format(n || 0) : "—");

  const indicadores: Indicador[] = [
    { rotulo: "Demandas abertas", valor: valor(stats?.demandasAbertas), icone: FileText, href: "/ascom/demandas" },
    { rotulo: "Em produção", valor: valor(stats?.emProducao), icone: Clock },
    { rotulo: "Publicadas no mês", valor: valor(stats?.publicadasMes), icone: CheckCircle },
    { rotulo: "Eventos no mês", valor: valor(stats?.eventosMes), icone: Calendar, href: "/comunicacao/calendario" },
  ];

  const quickActions = [
    { label: "Nova demanda", description: "Solicitar comunicação", href: "/ascom/demandas/nova", icon: Send },
    { label: "Minhas demandas", description: "Acompanhar solicitações", href: "/ascom/demandas?minhas=true", icon: Clock },
    { label: "Agenda", description: "Eventos programados", href: "/comunicacao/calendario", icon: Calendar },
    { label: "Galeria", description: "Mídia e imagens", href: "/ascom/cms/galerias", icon: Image },
  ];

  return (
    <ModuleLayout module="comunicacao">
      <div className="space-y-6">
        <PageHeader
          titulo="Comunicação"
          descricao="ASCOM e demandas de comunicação"
          acoes={
            // Mesma permissão da rota de destino (ROUTE_PERMISSIONS)
            hasPermission("ascom.demandas.criar") ? (
              <Button asChild>
                <Link to="/ascom/demandas/nova">
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Nova demanda
                </Link>
              </Button>
            ) : undefined
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
        <section aria-labelledby="comunicacao-indicadores">
          <h2 id="comunicacao-indicadores" className="sr-only">Indicadores</h2>
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
