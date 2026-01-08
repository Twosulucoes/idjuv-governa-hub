import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown, Shield, FileText, BookOpen, Scale, Eye, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logoGoverno from "@/assets/logo-governo-roraima.jpg";
import { LogoIdjuv } from "@/components/ui/LogoIdjuv";

const menuItems = [
  {
    title: "Governança",
    icon: Shield,
    href: "/governanca",
    items: [
      { title: "Lei de Criação", href: "/governanca/lei-criacao" },
      { title: "Decreto Regulamentador", href: "/governanca/decreto" },
      { title: "Regimento Interno", href: "/governanca/regimento" },
      { title: "Organograma", href: "/governanca/organograma" },
      { title: "Portarias Estruturantes", href: "/governanca/portarias" },
      { title: "Matriz RACI", href: "/governanca/matriz-raci" },
      { title: "Relatório de Governança", href: "/governanca/relatorio" },
    ],
  },
  {
    title: "Processos",
    icon: FileText,
    href: "/processos",
    items: [
      { title: "Compras e Contratos", href: "/processos/compras" },
      { title: "Diárias e Viagens", href: "/processos/diarias" },
      { title: "Patrimônio", href: "/processos/patrimonio" },
      { title: "Convênios e Parcerias", href: "/processos/convenios" },
      { title: "Almoxarifado", href: "/processos/almoxarifado" },
      { title: "Veículos", href: "/processos/veiculos" },
      { title: "Pagamentos", href: "/processos/pagamentos" },
    ],
  },
  {
    title: "Manuais",
    icon: BookOpen,
    href: "/manuais",
    items: [
      { title: "Manual de Compras", href: "/manuais/compras" },
      { title: "Manual de Diárias", href: "/manuais/diarias" },
      { title: "Manual de Patrimônio", href: "/manuais/patrimonio" },
      { title: "Manual de Convênios", href: "/manuais/convenios" },
    ],
  },
  {
    title: "Integridade",
    icon: Scale,
    href: "/integridade",
    items: [
      { title: "Código de Ética", href: "/integridade/codigo-etica" },
      { title: "Canal de Denúncias", href: "/integridade/denuncias" },
      { title: "Conflito de Interesses", href: "/integridade/conflito" },
      { title: "Política de Integridade", href: "/integridade/politica" },
    ],
  },
  {
    title: "Transparência",
    icon: Eye,
    href: "/transparencia",
  },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const location = useLocation();
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fechar menu mobile quando navegar
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevenir scroll quando menu mobile está aberto
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Faixa decorativa superior */}
      <div className="faixa-brasil" />
      
      {/* Barra superior do Governo */}
      <div className="bg-primary dark:bg-card/95 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Logo Governo - com container apenas onde necessário */}
            <div className="logo-container-gov">
              <img 
                src={logoGoverno} 
                alt="Governo do Estado de Roraima" 
                className="logo-gov w-auto"
              />
            </div>
            <div className="hidden sm:block h-5 w-px bg-primary-foreground/20 dark:bg-border" />
            <span className="hidden sm:block text-xs font-medium text-primary-foreground/90 dark:text-foreground/80">
              Governo de Roraima
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-8 w-8 p-0 text-primary-foreground dark:text-foreground hover:bg-primary-foreground/10 dark:hover:bg-muted rounded-full"
              aria-label="Alternar tema"
            >
              {mounted && resolvedTheme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <Link 
              to="/acesso" 
              className="text-xs font-medium px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
            >
              Área Restrita
            </Link>
          </div>
        </div>
      </div>

      {/* Header principal */}
      <div className="bg-background/98 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo IDJUV - SEM container, direta */}
            <Link to="/" className="flex items-center group flex-shrink-0">
              <LogoIdjuv 
                className="logo-header transition-transform group-hover:scale-[1.02]"
              />
            </Link>

            {/* Desktop Navigation */}
            <NavigationMenu className="hidden lg:flex">
              <NavigationMenuList className="gap-0.5">
                {menuItems.map((item) => (
                  <NavigationMenuItem key={item.title}>
                    {item.items ? (
                      <>
                        <NavigationMenuTrigger className="bg-transparent text-foreground/80 hover:text-foreground hover:bg-muted/50 data-[state=open]:bg-muted/50 h-9 px-3 text-sm font-medium">
                          <item.icon className="w-4 h-4 mr-1.5 opacity-70" />
                          {item.title}
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <ul className="grid w-[260px] gap-0.5 p-1.5">
                            {item.items.map((subItem) => (
                              <li key={subItem.href}>
                                <NavigationMenuLink asChild>
                                  <Link
                                    to={subItem.href}
                                    className={cn(
                                      "block select-none rounded-md px-3 py-2.5 leading-none no-underline outline-none transition-colors hover:bg-muted text-sm",
                                      location.pathname === subItem.href && "bg-muted text-primary font-medium"
                                    )}
                                  >
                                    {subItem.title}
                                  </Link>
                                </NavigationMenuLink>
                              </li>
                            ))}
                          </ul>
                        </NavigationMenuContent>
                      </>
                    ) : (
                      <NavigationMenuLink asChild>
                        <Link
                          to={item.href}
                          className={cn(
                            "flex items-center px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-md transition-colors",
                            location.pathname === item.href && "text-primary bg-muted/50"
                          )}
                        >
                          <item.icon className="w-4 h-4 mr-1.5 opacity-70" />
                          {item.title}
                        </Link>
                      </NavigationMenuLink>
                    )}
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-10 w-10 text-foreground hover:bg-muted rounded-full flex-shrink-0"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation - Full Screen Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-40 tap-highlight-none"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          
          {/* Menu Panel - Full height with safe area */}
          <div className="lg:hidden fixed inset-x-0 top-0 bottom-0 bg-background z-50 flex flex-col animate-fade-in safe-area-inset-bottom">
            {/* Header do menu mobile */}
            <div className="flex items-center justify-between p-4 border-b bg-background sticky top-0 z-10 safe-area-inset-top">
              <LogoIdjuv className="h-8" />
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full touch-target"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Conteúdo do menu com scroll */}
            <nav className="flex-1 overflow-y-auto overscroll-contain scroll-container px-4 py-4">
              <div className="space-y-1">
                {menuItems.map((item) => (
                  <div key={item.title} className="space-y-1">
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center px-4 py-3.5 rounded-lg hover:bg-muted text-foreground transition-colors touch-target tap-highlight-subtle",
                        location.pathname === item.href && "bg-muted text-primary"
                      )}
                      onClick={() => !item.items && setMobileMenuOpen(false)}
                    >
                      <item.icon className="w-5 h-5 mr-3 text-primary flex-shrink-0" />
                      <span className="font-medium text-base">{item.title}</span>
                      {item.items && <ChevronDown className="w-4 h-4 ml-auto text-muted-foreground" />}
                    </Link>
                    {item.items && (
                      <div className="ml-8 space-y-0.5 border-l-2 border-muted pl-4">
                        {item.items.map((subItem) => (
                          <Link
                            key={subItem.href}
                            to={subItem.href}
                            className={cn(
                              "block px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors touch-target-sm",
                              location.pathname === subItem.href && "text-primary bg-muted font-medium"
                            )}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {subItem.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </nav>

            {/* Footer do menu mobile */}
            <div className="border-t p-4 bg-muted/30 safe-area-inset-bottom">
              <Link 
                to="/acesso"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium touch-target"
              >
                Área Restrita
              </Link>
            </div>
          </div>
        </>
      )}
    </header>
  );
}