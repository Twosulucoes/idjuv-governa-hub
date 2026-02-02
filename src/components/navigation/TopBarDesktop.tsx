/**
 * TopBar Desktop — Header Institucional
 * 
 * Barra superior minimalista com:
 * - Breadcrumb de navegação
 * - Indicador de pendências
 * - Alertas visuais
 * - Usuário logado
 */

import { useLocation, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Search, 
  Bell, 
  Moon, 
  Sun, 
  AlertTriangle,
  Clock,
  Home,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/auth/UserMenu";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Link } from "react-router-dom";
import { useEffect } from "react";

interface TopBarDesktopProps {
  onOpenSearch: () => void;
  pendencias?: number;
  alertas?: Array<{
    id: string;
    tipo: 'prazo' | 'urgente' | 'info';
    mensagem: string;
    link?: string;
  }>;
}

/**
 * Gera breadcrumbs baseado na rota atual
 */
function getBreadcrumbForPath(pathname: string): Array<{ label: string; href?: string }> {
  const parts = pathname.split('/').filter(Boolean);
  const crumbs: Array<{ label: string; href?: string }> = [
    { label: 'Início', href: '/admin' }
  ];

  const labelMap: Record<string, string> = {
    'admin': 'Admin',
    'rh': 'RH',
    'servidores': 'Servidores',
    'workflow': 'Processos',
    'processos': 'Processos',
    'compras': 'Compras',
    'patrimonio': 'Patrimônio',
    'transparencia': 'Transparência',
    'governanca': 'Governança',
    'usuarios': 'Usuários',
    'perfis': 'Perfis',
    'auditoria': 'Auditoria',
    'configuracoes': 'Configurações',
    'ferias': 'Férias',
    'licencas': 'Licenças',
    'frequencia': 'Frequência',
    'portarias': 'Portarias',
    'designacoes': 'Designações',
  };

  let currentPath = '';
  parts.forEach((part, index) => {
    currentPath += `/${part}`;
    if (part !== 'admin' || index > 0) {
      crumbs.push({
        label: labelMap[part] || part.charAt(0).toUpperCase() + part.slice(1),
        href: index < parts.length - 1 ? currentPath : undefined
      });
    }
  });

  return crumbs;
}

export function TopBarDesktop({ 
  onOpenSearch, 
  pendencias = 0,
  alertas = []
}: TopBarDesktopProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const breadcrumbs = getBreadcrumbForPath(location.pathname);

  // Atalho de teclado para busca
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        onOpenSearch();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onOpenSearch]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/admin");
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const alertasUrgentes = alertas.filter(a => a.tipo === 'urgente');

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      {/* Botão Voltar */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-8 w-8 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Voltar</TooltipContent>
      </Tooltip>

      {/* Breadcrumb */}
      <div className="flex-1 overflow-hidden">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => (
              <BreadcrumbItem key={index}>
                {index > 0 && <BreadcrumbSeparator />}
                {item.href && index < breadcrumbs.length - 1 ? (
                  <BreadcrumbLink asChild>
                    <Link to={item.href} className="hover:text-foreground transition-colors">
                      {index === 0 ? <Home className="h-4 w-4" /> : item.label}
                    </Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="truncate max-w-[200px]">
                    {item.label}
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-2">
        {/* Busca */}
        <Button
          variant="outline"
          size="sm"
          className="hidden md:flex items-center gap-2 text-muted-foreground h-9"
          onClick={onOpenSearch}
        >
          <Search className="h-4 w-4" />
          <span className="text-sm">Buscar...</span>
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        {/* Pendências */}
        {pendencias > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" asChild>
                <Link to="/admin/aprovacoes">
                  <Clock className="h-5 w-5" />
                  <Badge 
                    variant="default" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                  >
                    {pendencias > 9 ? '9+' : pendencias}
                  </Badge>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {pendencias} pendência(s) aguardando aprovação
            </TooltipContent>
          </Tooltip>
        )}

        {/* Alertas */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className={cn(
                "h-5 w-5",
                alertasUrgentes.length > 0 && "text-destructive"
              )} />
              {alertas.length > 0 && (
                <span className={cn(
                  "absolute -top-1 -right-1 h-4 w-4 rounded-full text-[10px] font-medium flex items-center justify-center",
                  alertasUrgentes.length > 0 
                    ? "bg-destructive text-destructive-foreground animate-pulse"
                    : "bg-primary text-primary-foreground"
                )}>
                  {alertas.length > 9 ? '9+' : alertas.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Notificações</h4>
              {alertas.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma notificação pendente
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {alertas.map(alerta => (
                    <div 
                      key={alerta.id}
                      className={cn(
                        "flex items-start gap-2 p-2 rounded-md text-sm",
                        alerta.tipo === 'urgente' && "bg-destructive/10 text-destructive",
                        alerta.tipo === 'prazo' && "bg-warning/10 text-warning-foreground",
                        alerta.tipo === 'info' && "bg-muted"
                      )}
                    >
                      {alerta.tipo === 'urgente' && <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />}
                      {alerta.tipo === 'prazo' && <Clock className="h-4 w-4 shrink-0 mt-0.5" />}
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{alerta.mensagem}</p>
                        {alerta.link && (
                          <Link 
                            to={alerta.link} 
                            className="text-xs text-primary hover:underline"
                          >
                            Ver detalhes
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Tema */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Alternar tema
          </TooltipContent>
        </Tooltip>

        {/* Menu Usuário */}
        <UserMenu />
      </div>
    </header>
  );
}
