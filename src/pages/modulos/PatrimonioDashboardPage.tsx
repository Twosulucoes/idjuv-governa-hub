/**
 * DASHBOARD - PATRIMÔNIO
 * Usa ModuleLayout para navegação modular e os padrões do design system
 * (PageHeader, KpiCard). Ver docs/GUIA_FRONTEND.md (Design System).
 */

import { Package, Building2, Warehouse, QrCode, ClipboardCheck, ArrowRightLeft, AlertTriangle, AlertCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { usePatrimonioDashboardStats } from "@/hooks/dashboard";
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

export default function PatrimonioDashboardPage() {
  const { data: stats, isLoading, isError, refetch } = usePatrimonioDashboardStats();

  // Sem dado (erro) mostra "—" em vez de um zero que parece real
  const valor = (n: number | undefined) => (stats ? numero.format(n || 0) : "—");

  const indicadores: Indicador[] = [
    { rotulo: "Bens ativos", valor: valor(stats?.bensAtivos), icone: Package, href: "/inventario/bens" },
    { rotulo: "Unidades locais", valor: valor(stats?.unidadesLocais), icone: Building2, href: "/unidades" },
    { rotulo: "Itens em estoque", valor: valor(stats?.itensEstoque), icone: Warehouse, href: "/inventario/almoxarifado" },
    { rotulo: "Pendências", valor: valor(stats?.pendencias), icone: AlertTriangle, href: "/inventario/pendencias" },
  ];

  const quickActions = [
    { label: "Novo bem", description: "Cadastrar patrimônio", href: "/inventario/bens?acao=novo", icon: Package },
    { label: "Movimentação", description: "Transferir bem", href: "/inventario/movimentacoes", icon: ArrowRightLeft },
    { label: "Inventário", description: "Realizar conferência", href: "/inventario/campanhas", icon: ClipboardCheck },
    { label: "Gerar QR Code", description: "Etiquetas", href: "/inventario/etiquetas", icon: QrCode },
  ];

  return (
    <ModuleLayout module="patrimonio">
      <div className="space-y-6">
        <PageHeader
          titulo="Patrimônio"
          descricao="Bens patrimoniais, inventário e almoxarifado"
          acoes={
            <Button asChild>
              <Link to="/inventario/bens?acao=novo">
                <Package className="h-4 w-4" aria-hidden="true" />
                Novo bem
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
        <section aria-labelledby="patrimonio-indicadores">
          <h2 id="patrimonio-indicadores" className="sr-only">Indicadores</h2>
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
