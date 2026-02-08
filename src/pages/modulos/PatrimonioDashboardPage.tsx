/**
 * DASHBOARD - PATRIMÔNIO
 * Usa ModuleLayout para navegação modular
 */

import { Package, Building2, Warehouse, QrCode, ClipboardCheck, ArrowRightLeft, AlertTriangle } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { usePatrimonioDashboardStats } from "@/hooks/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function PatrimonioDashboardPage() {
  const { data: stats, isLoading } = usePatrimonioDashboardStats();

  const statCards = [
    { 
      label: "Bens Ativos", 
      value: isLoading ? "..." : String(stats?.bensAtivos || 0), 
      icon: Package, 
      href: "/inventario/bens" 
    },
    { 
      label: "Unidades Locais", 
      value: isLoading ? "..." : String(stats?.unidadesLocais || 0), 
      icon: Building2, 
      href: "/unidades" 
    },
    { 
      label: "Itens Estoque", 
      value: isLoading ? "..." : String(stats?.itensEstoque || 0), 
      icon: Warehouse, 
      href: "/inventario/almoxarifado" 
    },
    { 
      label: "Pendências", 
      value: isLoading ? "..." : String(stats?.pendencias || 0), 
      icon: AlertTriangle, 
      href: "/inventario/pendencias" 
    },
  ];

  const quickActions = [
    { label: "Novo Bem", description: "Cadastrar patrimônio", href: "/inventario/bens/novo", icon: Package },
    { label: "Movimentação", description: "Transferir bem", href: "/inventario/movimentacoes", icon: ArrowRightLeft },
    { label: "Inventário", description: "Realizar conferência", href: "/inventario/campanhas", icon: ClipboardCheck },
    { label: "Gerar QR Code", description: "Etiquetas", href: "/inventario/etiquetas", icon: QrCode },
  ];

  return (
    <ModuleLayout module="patrimonio">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            Patrimônio
          </h1>
          <p className="text-muted-foreground">Bens patrimoniais, inventário e almoxarifado</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.label} to={stat.href}>
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
              </Link>
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
