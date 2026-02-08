/**
 * DASHBOARD - RECURSOS HUMANOS
 * Usa ModuleLayout para navegação modular
 */

import { Users, Calendar, Plane, Clock, UserPlus, Award } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { useRHDashboardStats } from "@/hooks/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function RHDashboardPage() {
  const { data: stats, isLoading } = useRHDashboardStats();

  const statCards = [
    { 
      label: "Servidores Ativos", 
      value: isLoading ? "..." : String(stats?.servidoresAtivos || 0), 
      icon: Users, 
      href: "/rh/servidores" 
    },
    { 
      label: "Em Férias", 
      value: isLoading ? "..." : String(stats?.emFerias || 0), 
      icon: Calendar, 
      href: "/rh/ferias" 
    },
    { 
      label: "Viagens Pendentes", 
      value: isLoading ? "..." : String(stats?.viagensPendentes || 0), 
      icon: Plane, 
      href: "/rh/viagens" 
    },
    { 
      label: "Frequência Mês", 
      value: isLoading ? "..." : `${stats?.frequenciaHoje || 0}%`, 
      icon: Clock, 
      href: "/rh/frequencia" 
    },
  ];

  const quickActions = [
    { label: "Novo Servidor", description: "Cadastrar servidor", href: "/rh/servidores/novo", icon: UserPlus },
    { label: "Lançar Férias", description: "Programar férias", href: "/rh/ferias", icon: Calendar },
    { label: "Nova Viagem", description: "Solicitar diária", href: "/rh/viagens", icon: Plane },
    { label: "Designações", description: "Gerenciar designações", href: "/rh/designacoes", icon: Award },
  ];

  return (
    <ModuleLayout module="rh">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-500" />
            Recursos Humanos
          </h1>
          <p className="text-muted-foreground">Gestão de pessoal, frequência, férias e viagens</p>
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
