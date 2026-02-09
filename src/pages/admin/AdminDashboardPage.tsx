import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Building2,
  FileText,
  Shield,
  Clock,
  Star,
  ArrowRight,
  TrendingUp,
  Calendar,
  Briefcase,
  HelpCircle,
  Plane,
  ChevronRight,
  BookOpen,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { menuConfig, getAllRouteItems } from "@/config/menu.config";
import { useAdminDashboardStats } from "@/hooks/admin/useAdminDashboardStats";

const RECENT_PAGES_KEY = "admin-recent-pages";
const FAVORITES_KEY = "menu-favorites-v3";

interface QuickLink {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

const quickLinks: QuickLink[] = [
  {
    label: "Novo Servidor",
    description: "Cadastrar um novo servidor",
    href: "/rh/servidores/novo",
    icon: Users,
  },
  {
    label: "Gestão de Férias",
    description: "Gerenciar férias dos servidores",
    href: "/rh/ferias",
    icon: Calendar,
  },
  {
    label: "Relatórios de RH",
    description: "Gerar relatórios de pessoal",
    href: "/rh/relatorios",
    icon: TrendingUp,
  },
  {
    label: "Gestão de Usuários",
    description: "Gerenciar acessos ao sistema",
    href: "/admin/usuarios",
    icon: Shield,
  },
];

interface SearchableItem {
  id: string;
  label: string;
  href: string;
  section: string;
  icon: LucideIcon;
}

export default function AdminDashboardPage() {
  const [recentPages, setRecentPages] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  // Buscar estatísticas reais do banco de dados
  const { data: stats, isLoading: statsLoading } = useAdminDashboardStats();
  
  // Estatísticas dinâmicas baseadas nos dados do BD
  const quickStats = useMemo(() => [
    {
      label: "Servidores Ativos",
      value: stats?.servidoresAtivos ?? 0,
      trend: stats?.servidoresTrend,
      trendUp: true,
      icon: Users,
      href: "/rh/servidores",
    },
    {
      label: "Unidades",
      value: stats?.unidades ?? 0,
      icon: Building2,
      href: "/organograma",
    },
    {
      label: "Documentos",
      value: stats?.documentos ?? 0,
      trend: stats?.documentosTrend,
      trendUp: true,
      icon: FileText,
      href: "/admin/documentos",
    },
    {
      label: "Cargos",
      value: stats?.cargos ?? 0,
      icon: Briefcase,
      href: "/cargos",
    },
  ], [stats]);
  
  // Converte itens do menu para formato de busca
  const allItems = useMemo((): SearchableItem[] => {
    const routeItems = getAllRouteItems();
    return routeItems
      .filter(item => item.route)
      .map(item => ({
        id: item.id,
        label: item.label,
        href: item.route!,
        section: 'Sistema',
        icon: item.icon,
      }));
  }, []);

  useEffect(() => {
    const savedRecent = localStorage.getItem(RECENT_PAGES_KEY);
    const savedFavorites = localStorage.getItem(FAVORITES_KEY);
    if (savedRecent) setRecentPages(JSON.parse(savedRecent));
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
  }, []);

  const recentItems = useMemo(() => {
    return recentPages
      .slice(0, 5)
      .map((href) => allItems.find((item) => item.href === href))
      .filter(Boolean) as SearchableItem[];
  }, [recentPages, allItems]);

  const favoriteItems = useMemo(() => {
    return allItems.filter((item) => favorites.includes(item.id)).slice(0, 6);
  }, [allItems, favorites]);

  return (
    <ModuleLayout module="admin">
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Painel Administrativo
          </h1>
          <p className="text-muted-foreground">
            Bem-vindo ao sistema de gestão do IDJUV
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickStats.map((stat) => (
            <Link key={stat.label} to={stat.href}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.label}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold">{stat.value}</div>
                  )}
                  {stat.trend && !statsLoading && (
                    <p
                      className={`text-xs ${
                        stat.trendUp ? "text-green-600" : "text-muted-foreground"
                      }`}
                    >
                      <TrendingUp className="inline h-3 w-3 mr-1" />
                      {stat.trend}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Pages */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Acessos Recentes
              </CardTitle>
              <CardDescription>
                Páginas que você visitou recentemente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentItems.length > 0 ? (
                <div className="space-y-2">
                  {recentItems.map((item) => (
                    <Link
                      key={item.id}
                      to={item.href}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{item.label}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum acesso recente
                </p>
              )}
            </CardContent>
          </Card>

          {/* Favorites */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                Favoritos
              </CardTitle>
              <CardDescription>
                Suas páginas favoritas para acesso rápido
              </CardDescription>
            </CardHeader>
            <CardContent>
              {favoriteItems.length > 0 ? (
                <div className="space-y-2">
                  {favoriteItems.map((item) => (
                    <Link
                      key={item.id}
                      to={item.href}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{item.label}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {item.section}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Clique na ⭐ ao lado das páginas para adicionar favoritos
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Links Rápidos</CardTitle>
              <CardDescription>
                Atalhos para as ações mais comuns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {quickLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <link.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{link.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {link.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Como Fazer - Quick Guides */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Como Fazer?
            </CardTitle>
            <CardDescription>
              Guias rápidos para tarefas comuns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <Link
                to="/admin/ajuda#cadastrar-servidor"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Cadastrar servidor</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span>Pessoas</span>
                    <ChevronRight className="h-3 w-3" />
                    <span>Servidores</span>
                    <ChevronRight className="h-3 w-3" />
                    <span>Novo</span>
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>

              <Link
                to="/admin/ajuda#lancar-viagem"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Plane className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Lançar viagem</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span>Pessoas</span>
                    <ChevronRight className="h-3 w-3" />
                    <span>Viagens</span>
                    <ChevronRight className="h-3 w-3" />
                    <span>Nova</span>
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>

              <Link
                to="/admin/ajuda#gerenciar-ferias"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Gerenciar férias</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span>Pessoas</span>
                    <ChevronRight className="h-3 w-3" />
                    <span>Férias</span>
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>

              <Link
                to="/admin/ajuda#cadastrar-cargo"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Cadastrar cargo</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span>Cadastros</span>
                    <ChevronRight className="h-3 w-3" />
                    <span>Cargos</span>
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>

              <Link
                to="/admin/ajuda#gestao-unidades"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Gerenciar unidades</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span>Cadastros</span>
                    <ChevronRight className="h-3 w-3" />
                    <span>Organograma</span>
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>

              <Link
                to="/admin/ajuda"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors bg-muted/30"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Ver todos os tutoriais</p>
                  <p className="text-xs text-muted-foreground">
                    Guias completos passo a passo
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Module Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Mapa do Sistema</CardTitle>
            <CardDescription>
              Visão geral de todos os módulos disponíveis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {menuConfig.map((section) => (
                <div
                  key={section.id}
                  className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <section.icon className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="font-semibold">{section.label}</h3>
                  </div>
                  <div className="space-y-1">
                    {section.items.slice(0, 4).map((item) => (
                      <div key={item.id}>
                        {item.route ? (
                          <Link
                            to={item.route}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors block py-0.5"
                          >
                            {item.label}
                          </Link>
                        ) : (
                          <span className="text-sm text-muted-foreground block py-0.5">
                            {item.label}
                          </span>
                        )}
                      </div>
                    ))}
                    {section.items.length > 4 && (
                      <p className="text-xs text-muted-foreground pt-1">
                        +{section.items.length - 4} mais...
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
