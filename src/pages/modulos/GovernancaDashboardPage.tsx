/**
 * DASHBOARD - GOVERNANÇA
 * Usa ModuleLayout para navegação modular
 */

import { Building2, Network, Users, FileText, Shield, ClipboardList } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { useGovernancaDashboardStats } from "@/hooks/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function GovernancaDashboardPage() {
  const { data: stats, isLoading } = useGovernancaDashboardStats();

  const statCards = [
    { 
      label: "Unidades Org.", 
      value: isLoading ? "..." : String(stats?.unidadesOrg || 0), 
      icon: Building2, 
      href: "/organograma" 
    },
    { 
      label: "Cargos", 
      value: isLoading ? "..." : String(stats?.cargos || 0), 
      icon: Users, 
      href: "/cargos" 
    },
    { 
      label: "Federações", 
      value: isLoading ? "..." : String(stats?.federacoes || 0), 
      icon: Shield, 
      href: "/admin/federacoes" 
    },
    { 
      label: "Portarias", 
      value: isLoading ? "..." : String(stats?.portarias || 0), 
      icon: FileText, 
      href: "/rh/portarias" 
    },
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
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            Governança
          </h1>
          <p className="text-muted-foreground">Estrutura organizacional, normas e compliance</p>
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
