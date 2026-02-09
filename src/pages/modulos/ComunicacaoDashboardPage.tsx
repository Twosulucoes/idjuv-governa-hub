/**
 * DASHBOARD - COMUNICAÇÃO (ASCOM)
 * Usa ModuleLayout para navegação modular
 */

import { Megaphone, FileText, Image, Calendar, Send, Clock, CheckCircle } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { useComunicacaoDashboardStats } from "@/hooks/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function ComunicacaoDashboardPage() {
  const { data: stats, isLoading } = useComunicacaoDashboardStats();

  const statCards = [
    { 
      label: "Demandas Abertas", 
      value: isLoading ? "..." : String(stats?.demandasAbertas || 0), 
      icon: FileText, 
      href: "/ascom/demandas" 
    },
    { 
      label: "Em Produção", 
      value: isLoading ? "..." : String(stats?.emProducao || 0), 
      icon: Clock 
    },
    { 
      label: "Publicadas (Mês)", 
      value: isLoading ? "..." : String(stats?.publicadasMes || 0), 
      icon: CheckCircle 
    },
    { 
      label: "Eventos (Mês)", 
      value: isLoading ? "..." : String(stats?.eventosMes || 0), 
      icon: Calendar,
      href: "/comunicacao/calendario"
    },
  ];

  const quickActions = [
    { label: "Nova Demanda", description: "Solicitar comunicação", href: "/ascom/demandas/nova", icon: Send },
    { label: "Minhas Demandas", description: "Acompanhar solicitações", href: "/ascom/demandas?minhas=true", icon: Clock },
    { label: "Agenda", description: "Eventos programados", href: "/comunicacao/calendario", icon: Calendar },
    { label: "Galeria", description: "Mídia e imagens", href: "/ascom/galeria", icon: Image },
  ];

  return (
    <ModuleLayout module="comunicacao">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Megaphone className="h-8 w-8 text-primary" />
            Comunicação
          </h1>
          <p className="text-muted-foreground">ASCOM e demandas de comunicação</p>
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
