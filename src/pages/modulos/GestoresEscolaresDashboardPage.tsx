/**
 * DASHBOARD - GESTORES ESCOLARES
 * Usa ModuleLayout para navegação modular
 */

import { School, Users, FileCheck, ClipboardList, Search, Download, BarChart3 } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { useGestoresEscolaresDashboardStats } from "@/hooks/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function GestoresEscolaresDashboardPage() {
  const { data: stats, isLoading } = useGestoresEscolaresDashboardStats();

  const statCards = [
    { 
      label: "Gestores Cadastrados", 
      value: isLoading ? "..." : String(stats?.gestoresCadastrados || 0), 
      icon: Users, 
      href: "/cadastrogestores/admin" 
    },
    { 
      label: "Escolas", 
      value: isLoading ? "..." : String(stats?.escolas || 0), 
      icon: School,
      href: "/cadastrogestores/escolas"
    },
    { 
      label: "Pendentes", 
      value: isLoading ? "..." : String(stats?.pendentes || 0), 
      icon: ClipboardList 
    },
    { 
      label: "Confirmados", 
      value: isLoading ? "..." : String(stats?.confirmados || 0), 
      icon: FileCheck 
    },
  ];

  const quickActions = [
    { label: "Gestão de Cadastros", description: "Administrar gestores", href: "/cadastrogestores/admin", icon: ClipboardList },
    { label: "Importar Escolas", description: "Carregar lista", href: "/cadastrogestores/escolas", icon: Download },
    { label: "Consultar", description: "Buscar gestor", href: "/cadastrogestores/consulta", icon: Search },
    { label: "Relatórios", description: "Estatísticas", href: "/cadastrogestores/relatorios", icon: BarChart3 },
  ];

  return (
    <ModuleLayout module="gestores_escolares">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <School className="h-8 w-8 text-amber-500" />
            Gestores Escolares
          </h1>
          <p className="text-muted-foreground">Credenciamento para Jogos Escolares</p>
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
