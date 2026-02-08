/**
 * TEMPLATE BASE PARA DASHBOARDS DE MÓDULO
 * 
 * Componente reutilizável para todos os dashboards de módulo.
 * 
 * @version 1.0.0
 */

import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModuleQuickAction {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  variant?: "default" | "outline";
}

export interface ModuleStat {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  icon: LucideIcon;
  href?: string;
}

export interface ModuleMenuItem {
  label: string;
  href: string;
  badge?: string;
}

interface ModuleDashboardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  stats?: ModuleStat[];
  quickActions?: ModuleQuickAction[];
  menuItems?: ModuleMenuItem[];
  children?: React.ReactNode;
}

const COLOR_CLASSES: Record<string, string> = {
  blue: "from-blue-600 to-blue-800",
  green: "from-green-600 to-green-800",
  purple: "from-purple-600 to-purple-800",
  orange: "from-orange-600 to-orange-800",
  amber: "from-amber-600 to-amber-800",
  indigo: "from-indigo-600 to-indigo-800",
  cyan: "from-cyan-600 to-cyan-800",
  teal: "from-teal-600 to-teal-800",
  pink: "from-pink-600 to-pink-800",
  rose: "from-rose-600 to-rose-800",
  emerald: "from-emerald-600 to-emerald-800",
  slate: "from-slate-600 to-slate-800",
};

export function ModuleDashboard({
  title,
  description,
  icon: Icon,
  color,
  stats = [],
  quickActions = [],
  menuItems = [],
  children,
}: ModuleDashboardProps) {
  const gradientClass = COLOR_CLASSES[color] || COLOR_CLASSES.slate;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Hero Section */}
        <div className={cn(
          "relative overflow-hidden rounded-xl p-6 lg:p-8 text-white",
          "bg-gradient-to-br",
          gradientClass
        )}>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold">{title}</h1>
                  <p className="text-white/80 text-sm lg:text-base">{description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
              const StatIcon = stat.icon;
              const content = (
                <Card className={cn(
                  "transition-all duration-200",
                  stat.href && "hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                )}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                    <StatIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    {stat.trend && (
                      <p className={cn(
                        "text-xs",
                        stat.trendUp ? "text-green-600" : "text-muted-foreground"
                      )}>
                        {stat.trend}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );

              return stat.href ? (
                <Link key={index} to={stat.href}>
                  {content}
                </Link>
              ) : (
                <div key={index}>{content}</div>
              );
            })}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Quick Actions */}
          {quickActions.length > 0 && (
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Ações Rápidas</CardTitle>
                <CardDescription>Funcionalidades mais usadas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickActions.map((action, index) => {
                  const ActionIcon = action.icon;
                  return (
                    <Button
                      key={index}
                      variant={action.variant || "outline"}
                      className="w-full justify-start gap-3 h-auto py-3"
                      asChild
                    >
                      <Link to={action.href}>
                        <ActionIcon className="h-5 w-5 shrink-0" />
                        <div className="text-left flex-1 min-w-0">
                          <p className="font-medium">{action.label}</p>
                          <p className="text-xs text-muted-foreground font-normal truncate">
                            {action.description}
                          </p>
                        </div>
                      </Link>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Menu Items */}
          {menuItems.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Navegação do Módulo</CardTitle>
                <CardDescription>Todas as áreas disponíveis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2">
                  {menuItems.map((item, index) => (
                    <Link
                      key={index}
                      to={item.href}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors group"
                    >
                      <span className="font-medium group-hover:text-primary transition-colors">
                        {item.label}
                      </span>
                      <div className="flex items-center gap-2">
                        {item.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {item.badge}
                          </Badge>
                        )}
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Custom Content */}
        {children}
      </div>
    </AdminLayout>
  );
}
