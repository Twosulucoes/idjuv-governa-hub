/**
 * DASHBOARD - CONTRATOS
 * Usa ModuleLayout para navegação modular
 */

import { FileText, Calendar, FileEdit, BarChart3, FilePlus, AlertTriangle } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { useContratosDashboardStats } from "@/hooks/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}K`;
  }
  return `R$ ${value.toFixed(0)}`;
}

export default function ContratosDashboardPage() {
  const { data: stats, isLoading } = useContratosDashboardStats();

  const statCards = [
    { 
      label: "Contratos Vigentes", 
      value: isLoading ? "..." : String(stats?.contratosVigentes || 0), 
      icon: FileText, 
      href: "/contratos/lista" 
    },
    { 
      label: "A Vencer (90 dias)", 
      value: isLoading ? "..." : String(stats?.aVencer90Dias || 0), 
      icon: Calendar,
      href: "/contratos/vencimentos"
    },
    { 
      label: "Aditivos Pendentes", 
      value: isLoading ? "..." : String(stats?.aditivosPendentes || 0), 
      icon: FileEdit,
      href: "/contratos/aditivos"
    },
    { 
      label: "Valor Total", 
      value: isLoading ? "..." : formatCurrency(stats?.valorTotal || 0), 
      icon: BarChart3 
    },
  ];

  const quickActions = [
    { label: "Novo Contrato", description: "Cadastrar contrato", href: "/contratos/novo", icon: FilePlus },
    { label: "Aditivo", description: "Registrar aditivo", href: "/contratos/aditivos", icon: FileEdit },
    { label: "Fiscalização", description: "Registro de ocorrências", href: "/contratos/fiscalizacao", icon: AlertTriangle },
    { label: "Vencimentos", description: "Agenda de contratos", href: "/contratos/vencimentos", icon: Calendar },
  ];

  return (
    <ModuleLayout module="contratos">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            Contratos
          </h1>
          <p className="text-muted-foreground">Gestão e execução contratual</p>
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
