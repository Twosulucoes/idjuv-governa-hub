/**
 * Header Minimalista V2 - Hot site Seletivas Estudantis
 * Com suporte a dark mode
 */

import { Link } from "react-router-dom";
import { Instagram, Moon, Sun } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

import { getMarcaAssets } from '@/core/tenant';

import { useTenant } from '@/core/tenant';
// Marca vem do perfil do tenant, não de '@/assets' (White Label — Fase 1).
const { entidadeSuperiorDark: logoGovernoDark, entidadeSuperiorLight: logoGoverno } = getMarcaAssets();

export function SeletivaHeaderV2() {
  const { contato, entidadeSuperior } = useTenant();
  const instagram = contato?.redesSociais?.instagram;
  const { theme, setTheme } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border transition-colors">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" aria-label="Página inicial" className="flex min-h-11 items-center gap-3">
            <Logo variant="light" className="h-8 dark:hidden" />
            <Logo variant="dark" className="h-8 hidden dark:block" />
          </Link>
          <div aria-hidden="true" className="h-6 w-px bg-border" />
          <img 
            src={logoGoverno} 
            alt={entidadeSuperior?.nome ?? ""} 
            className="h-6 object-contain dark:hidden"
          />
          <img 
            src={logoGovernoDark} 
            alt={entidadeSuperior?.nome ?? ""} 
            className="h-6 object-contain hidden dark:block"
          />
        </div>
        
        <div className="flex items-center gap-3">
          {/* Toggle Dark Mode */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full h-11 w-11 bg-muted text-foreground hover:bg-muted/70"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" aria-hidden="true" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" aria-hidden="true" />
            <span className="sr-only">Alternar tema</span>
          </Button>

          {/* Instagram */}
          <a
            href={`https://www.instagram.com/${instagram}/`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Instagram @${instagram} (abre em nova aba)`}
            className="flex min-h-11 min-w-11 items-center justify-center gap-2 px-4 py-2 bg-foreground text-background rounded-full hover:bg-foreground/85 transition-colors"
          >
            <Instagram className="w-4 h-4" aria-hidden="true" />
            <span className="text-xs font-bold tracking-wider uppercase hidden sm:inline">@{instagram}</span>
          </a>
        </div>
      </div>
    </header>
  );
}
