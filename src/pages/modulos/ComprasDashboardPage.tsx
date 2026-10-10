/**
 * DASHBOARD - COMPRAS
 * Usa ModuleLayout para navegação modular e os padrões do design system
 * (PageHeader, KpiCard).
 */

import { FileText, Gavel, Scale, FileCheck, MapPin, Handshake, AlertCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { useComprasDashboardStats } from "@/hooks/dashboard";
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
  /** Sem `href`: não há tela própria para o indicador. */
  href?: string;
}

export default function ComprasDashboardPage() {
  const { data: stats, isLoading, isError, refetch } = useComprasDashboardStats();

  // Sem dado (erro) mostra "—" em vez de um zero que parece real
  const valor = (n: number | undefined) => (stats ? numero.format(n || 0) : "—");

  const indicadores: Indicador[] = [
    { rotulo: "Licitações ativas", valor: valor(stats?.licitacoesAtivas), icone: Gavel, href: "/processos/compras" },
    { rotulo: "Em andamento", valor: valor(stats?.emAndamento), icone: FileText },
    { rotulo: "Dispensas/inexig.", valor: valor(stats?.dispensasInexigibilidades), icone: Scale },
    { rotulo: "Concluídas (ano)", valor: valor(stats?.concluidas), icone: FileCheck },
  ];

  // Só rotas registradas em App.tsx
  const quickActions = [
    { label: "Nova licitação", description: "Iniciar processo", href: "/processos/compras?acao=novo", icon: Gavel },
    { label: "Termo de demanda", description: "Formalizar demanda", href: "/formularios/termo-demanda", icon: FileText },
    { label: "Diárias e viagens", description: "Ordem de missão", href: "/processos/diarias", icon: MapPin },
    { label: "Convênios", description: "Parcerias e cooperação", href: "/processos/convenios", icon: Handshake },
  ];

  return (
    <ModuleLayout module="compras">
      <div className="space-y-6">
        <PageHeader
          titulo="Compras"
          descricao="Licitações, dispensas e processos de aquisição"
          acoes={
            <Button asChild>
              <Link to="/processos/compras?acao=novo">
                <Gavel className="h-4 w-4" aria-hidden="true" />
                Nova licitação
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
        <section aria-labelledby="compras-indicadores">
          <h2 id="compras-indicadores" className="sr-only">Indicadores</h2>
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
