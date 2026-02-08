/**
 * DASHBOARD - PROGRAMAS
 * Usa ModuleLayout para navegação modular
 */

import { Award, Users, Trophy, Calendar, Target, MapPin } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { useProgramasDashboardStats } from "@/hooks/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function ProgramasDashboardPage() {
  const { data: stats, isLoading } = useProgramasDashboardStats();

  const statCards = [
    { 
      label: "Programas Ativos", 
      value: isLoading ? "..." : String(stats?.programasAtivos || 0), 
      icon: Target,
      href: "/programas/lista"
    },
    { 
      label: "Beneficiários", 
      value: isLoading ? "..." : String(stats?.beneficiarios || 0), 
      icon: Users,
      href: "/programas/beneficiarios"
    },
    { 
      label: "Atletas (Bolsa)", 
      value: isLoading ? "..." : String(stats?.atletasBolsa || 0), 
      icon: Trophy,
      href: "/programas/bolsa-atleta"
    },
    { 
      label: "Eventos (Ano)", 
      value: isLoading ? "..." : String(stats?.eventosAno || 0), 
      icon: Calendar 
    },
  ];

  const quickActions = [
    { label: "Bolsa Atleta", description: "Gestão de atletas", href: "/programas/bolsa-atleta", icon: Trophy },
    { label: "Juventude Cidadã", description: "Jovens atendidos", href: "/programas/juventude", icon: Users },
    { label: "Jogos Escolares", description: "JERs", href: "/programas/jogos-escolares", icon: Award },
    { label: "Esporte na Comunidade", description: "Núcleos", href: "/programas/esporte-comunidade", icon: MapPin },
  ];

  return (
    <ModuleLayout module="programas">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Award className="h-8 w-8 text-primary" />
            Programas
          </h1>
          <p className="text-muted-foreground">Programas sociais e esportivos</p>
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
