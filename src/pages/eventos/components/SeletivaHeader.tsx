/**
 * Header do hot site de Seletivas Estudantis
 */

import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { FaixaBrasil } from "@/components/ui/FaixaBrasil";
import { getMarcaAssets } from '@/core/tenant';

// Marca vem do perfil do tenant, não de '@/assets' (White Label — Fase 1).
const { entidadeSuperiorLight: logoGoverno } = getMarcaAssets();

export function SeletivaHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <FaixaBrasil />
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3">
            <Logo variant="auto" className="h-10" />
          </Link>
          <div className="h-8 w-px bg-border" />
          <img 
            src={logoGoverno} 
            alt="Governo de Roraima" 
            className="h-8 object-contain"
          />
        </div>
        
        <a
          href="https://www.instagram.com/idjuv.rr/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:opacity-90 transition-opacity"
        >
          <Instagram className="w-5 h-5" />
          <span className="text-sm font-medium">@idjuv.rr</span>
        </a>
      </div>
    </header>
  );
}
