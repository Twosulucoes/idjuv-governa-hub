/**
 * DASHBOARD - TRANSPARÊNCIA
 * Usa ModuleLayout para navegação modular
 */

import { Eye, FileText, Search, Download, Globe, BarChart3, Users } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { useTransparenciaDashboardStats } from "@/hooks/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function TransparenciaDashboardPage() {
  const { data: stats, isLoading } = useTransparenciaDashboardStats();

  const statCards = [
    { 
      label: "Publicações", 
      value: isLoading ? "..." : String(stats?.publicacoes || 0), 
      icon: FileText 
    },
    { 
      label: "Downloads (Mês)", 
      value: isLoading ? "..." : String(stats?.downloadsMes || 0), 
      icon: Download 
    },
    { 
      label: "Solicitações LAI", 
      value: isLoading ? "..." : String(stats?.solicitacoesLai || 0), 
      icon: Search,
      href: "/transparencia/lai"
    },
    { 
      label: "Acessos (Mês)", 
      value: isLoading ? "..." : String(stats?.acessosMes || 0), 
      icon: Globe 
    },
  ];

  const quickActions = [
    { label: "Portal LAI", description: "e-SIC", href: "/transparencia/lai", icon: Search },
    { label: "Licitações", description: "Publicações", href: "/transparencia/licitacoes", icon: FileText },
    { label: "Cargos e Remuneração", description: "Quadro de pessoal", href: "/transparencia/cargos", icon: Users },
    { label: "Execução Orçamentária", description: "Despesas públicas", href: "/transparencia/orcamento", icon: BarChart3 },
  ];

  return (
    <ModuleLayout module="transparencia">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Eye className="h-8 w-8 text-primary" />
            Transparência
          </h1>
          <p className="text-muted-foreground">Portal LAI e dados públicos</p>
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
