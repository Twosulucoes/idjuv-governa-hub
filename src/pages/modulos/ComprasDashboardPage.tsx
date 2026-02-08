/**
 * DASHBOARD - COMPRAS
 * Usa ModuleLayout para navegação modular
 */

import { ShoppingCart, FileText, Gavel, Scale, FileCheck, TrendingUp } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { useComprasDashboardStats } from "@/hooks/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function ComprasDashboardPage() {
  const { data: stats, isLoading } = useComprasDashboardStats();

  const statCards = [
    { 
      label: "Licitações Ativas", 
      value: isLoading ? "..." : String(stats?.licitacoesAtivas || 0), 
      icon: Gavel, 
      href: "/processos/compras" 
    },
    { 
      label: "Em Andamento", 
      value: isLoading ? "..." : String(stats?.emAndamento || 0), 
      icon: FileText 
    },
    { 
      label: "Dispensas/Inexig.", 
      value: isLoading ? "..." : String(stats?.dispensasInexigibilidades || 0), 
      icon: Scale 
    },
    { 
      label: "Concluídas (Ano)", 
      value: isLoading ? "..." : String(stats?.concluidas || 0), 
      icon: FileCheck 
    },
  ];

  const quickActions = [
    { label: "Nova Licitação", description: "Iniciar processo", href: "/processos/compras?acao=novo", icon: Gavel },
    { label: "Termo de Referência", description: "Elaborar TR", href: "/compras/tr", icon: FileText },
    { label: "Pesquisa de Preços", description: "Orçamentos", href: "/compras/pesquisa", icon: TrendingUp },
    { label: "Dispensas", description: "Art. 75", href: "/compras/dispensas", icon: Scale },
  ];

  return (
    <ModuleLayout module="compras">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-primary" />
            Compras
          </h1>
          <p className="text-muted-foreground">Licitações, dispensas e processos de aquisição</p>
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
