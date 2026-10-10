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
  type LucideIcon,
} from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard, PageHeader } from "@/components/design-system";
import { useDadosOficiais } from "@/hooks/useDadosOficiais";
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
    label: "Novo servidor",
    description: "Cadastrar um novo servidor",
    href: "/rh/servidores/novo",
    icon: Users,
  },
  {
    label: "Gestão de férias",
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
    label: "Gestão de usuários",
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
  const { nomeCurto } = useDadosOficiais();
  
  // Buscar estatísticas reais do banco de dados
  const { data: stats, isLoading: statsLoading } = useAdminDashboardStats();
  
  // Estatísticas dinâmicas baseadas nos dados do BD
  const quickStats = useMemo(() => [
    {
      label: "Servidores ativos",
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
        <PageHeader
          titulo="Painel administrativo"
          descricao={`Bem-vindo ao sistema de gestão do ${nomeCurto}`}
        />

        {/* Indicadores: cada cartão leva à tela do assunto */}
        <section aria-labelledby="admin-indicadores">
          <h2 id="admin-indicadores" className="sr-only">Indicadores</h2>
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickStats.map((stat) => (
              <li key={stat.label}>
                <Link
                  to={stat.href}
                  className="block h-full rounded-lg transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <KpiCard
                    rotulo={stat.label}
                    valor={stat.value}
                    detalhe={
                      stat.trend ? (
                        <span className="inline-flex items-center gap-1 font-medium text-success">
                          <TrendingUp className="h-3 w-3" aria-hidden="true" />
                          {stat.trend}
                        </span>
                      ) : undefined
                    }
                    icone={stat.icon}
                    carregando={statsLoading}
                    className="h-full"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Pages */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" aria-hidden="true" />
                Acessos recentes
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
                        <item.icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        <span className="text-sm">{item.label}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
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
                <Star className="h-5 w-5 fill-warning text-warning" aria-hidden="true" />
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
                        <item.icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
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
              <CardTitle>Links rápidos</CardTitle>
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
                      <link.icon className="h-4 w-4 text-primary" aria-hidden="true" />
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
              <HelpCircle className="h-5 w-5" aria-hidden="true" />
              Como fazer?
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
                  <Users className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Cadastrar servidor</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span>Pessoas</span>
                    <ChevronRight className="h-3 w-3" aria-hidden="true" />
                    <span>Servidores</span>
                    <ChevronRight className="h-3 w-3" aria-hidden="true" />
                    <span>Novo</span>
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
              </Link>

              <Link
                to="/admin/ajuda#lancar-viagem"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Plane className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Lançar viagem</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span>Pessoas</span>
                    <ChevronRight className="h-3 w-3" aria-hidden="true" />
                    <span>Viagens</span>
                    <ChevronRight className="h-3 w-3" aria-hidden="true" />
                    <span>Nova</span>
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
              </Link>

              <Link
                to="/admin/ajuda#gerenciar-ferias"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Gerenciar férias</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span>Pessoas</span>
                    <ChevronRight className="h-3 w-3" aria-hidden="true" />
                    <span>Férias</span>
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
              </Link>

              <Link
                to="/admin/ajuda#cadastrar-cargo"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Briefcase className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Cadastrar cargo</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span>Cadastros</span>
                    <ChevronRight className="h-3 w-3" aria-hidden="true" />
                    <span>Cargos</span>
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
              </Link>

              <Link
                to="/admin/ajuda#gestao-unidades"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Gerenciar unidades</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span>Cadastros</span>
                    <ChevronRight className="h-3 w-3" aria-hidden="true" />
                    <span>Organograma</span>
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
              </Link>

              <Link
                to="/admin/ajuda"
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors bg-muted/30"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">Ver todos os tutoriais</p>
                  <p className="text-xs text-muted-foreground">
                    Guias completos passo a passo
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Module Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Mapa do sistema</CardTitle>
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
                      <section.icon className="h-4 w-4 text-primary" aria-hidden="true" />
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
