/**
 * DASHBOARD - INTEGRIDADE
 * Usa ModuleLayout para navegação modular
 */

import { Shield, AlertTriangle, Lock, Eye, Scale, ClipboardList } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { useIntegridadeDashboardStats } from "@/hooks/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function IntegridadeDashboardPage() {
  const { data: stats, isLoading } = useIntegridadeDashboardStats();

  const statCards = [
    { 
      label: "Denúncias Abertas", 
      value: isLoading ? "..." : String(stats?.denunciasAbertas || 0), 
      icon: AlertTriangle, 
      href: "/integridade/denuncias" 
    },
    { 
      label: "Em Análise", 
      value: isLoading ? "..." : String(stats?.emAnalise || 0), 
      icon: Eye 
    },
    { 
      label: "Resolvidas (Ano)", 
      value: isLoading ? "..." : String(stats?.resolvidasAno || 0), 
      icon: Shield 
    },
    { 
      label: "Conformidade", 
      value: isLoading ? "..." : `${stats?.conformidade || 0}%`, 
      icon: Shield 
    },
  ];

  const quickActions = [
    { label: "Canal de Denúncias", description: "Receber denúncia", href: "/integridade/denuncias", icon: AlertTriangle },
    { label: "Gestão", description: "Administrar denúncias", href: "/integridade/gestao", icon: ClipboardList },
    { label: "Código de Ética", description: "Normas de conduta", href: "/integridade/etica", icon: Scale },
    { label: "Conflito de Interesses", description: "Declarações", href: "/integridade/conflitos", icon: Lock },
  ];

  return (
    <ModuleLayout module="integridade">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Integridade
          </h1>
          <p className="text-muted-foreground">Ética, compliance e canal de denúncias</p>
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
