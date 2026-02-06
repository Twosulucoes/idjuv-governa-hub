/**
 * Header Minimalista V2 - Hot site Seletivas Estudantis
 * Com suporte a dark mode
 */

import { Link } from "react-router-dom";
import { Instagram, Moon, Sun } from "lucide-react";
import { LogoIdjuv } from "@/components/ui/LogoIdjuv";
import logoGoverno from "@/assets/logo-governo-roraima.jpg";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function SeletivaHeaderV2() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-100/95 dark:bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-300 dark:border-zinc-700 transition-colors">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3">
            <LogoIdjuv variant="light" className="h-8 dark:hidden" />
            <LogoIdjuv variant="dark" className="h-8 hidden dark:block" />
          </Link>
          <div className="h-6 w-px bg-zinc-400 dark:bg-zinc-600" />
          <img 
            src={logoGoverno} 
            alt="Governo de Roraima" 
            className="h-6 object-contain dark:brightness-110"
          />
        </div>
        
        <div className="flex items-center gap-3">
          {/* Toggle Dark Mode */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full w-9 h-9 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-zinc-700" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-zinc-300" />
            <span className="sr-only">Alternar tema</span>
          </Button>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/idjuv.rr/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 rounded-full hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            <Instagram className="w-4 h-4" />
            <span className="text-xs font-bold tracking-wider uppercase hidden sm:inline">@idjuv.rr</span>
          </a>
        </div>
      </div>
    </header>
  );
}
