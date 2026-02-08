/**
 * DASHBOARD - WORKFLOW / PROCESSOS
 * Usa ModuleLayout para navegação modular
 */

import { GitBranch, FileText, Clock, CheckCircle, FilePlus, Search, ArrowRight } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { useWorkflowDashboardStats } from "@/hooks/dashboard";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function WorkflowDashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useWorkflowDashboardStats(user?.id);

  const statCards = [
    { 
      label: "Processos Ativos", 
      value: isLoading ? "..." : String(stats?.processosAtivos || 0), 
      icon: FileText, 
      href: "/workflow/processos" 
    },
    { 
      label: "Pendentes Comigo", 
      value: isLoading ? "..." : String(stats?.pendentesComigo || 0), 
      icon: Clock,
      href: "/workflow/processos?meus=true"
    },
    { 
      label: "Tramitados Hoje", 
      value: isLoading ? "..." : String(stats?.tramitadosHoje || 0), 
      icon: ArrowRight 
    },
    { 
      label: "Concluídos (Mês)", 
      value: isLoading ? "..." : String(stats?.concluidosMes || 0), 
      icon: CheckCircle 
    },
  ];

  const quickActions = [
    { label: "Novo Processo", description: "Iniciar processo", href: "/workflow/processos?acao=novo", icon: FilePlus },
    { label: "Meus Processos", description: "Processos pendentes", href: "/workflow/processos?meus=true", icon: Clock },
    { label: "Consultar", description: "Buscar processo", href: "/workflow/processos", icon: Search },
    { label: "Tramitar", description: "Encaminhar processo", href: "/workflow/processos", icon: ArrowRight },
  ];

  return (
    <ModuleLayout module="workflow">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <GitBranch className="h-8 w-8 text-primary" />
            Processos Administrativos
          </h1>
          <p className="text-muted-foreground">Tramitação e gestão de processos</p>
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
