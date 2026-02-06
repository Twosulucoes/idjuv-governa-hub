/**
 * Header Minimalista V2 - Hot site Seletivas Estudantis
 */

import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";
import { LogoIdjuv } from "@/components/ui/LogoIdjuv";
import logoGoverno from "@/assets/logo-governo-roraima.jpg";

export function SeletivaHeaderV2() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-100/95 backdrop-blur-sm border-b border-zinc-300">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3">
            <LogoIdjuv variant="light" className="h-8" />
          </Link>
          <div className="h-6 w-px bg-zinc-400" />
          <img 
            src={logoGoverno} 
            alt="Governo de Roraima" 
            className="h-6 object-contain"
          />
        </div>
        
        <a
          href="https://www.instagram.com/idjuv.rr/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-zinc-100 rounded-full hover:bg-zinc-800 transition-colors"
        >
          <Instagram className="w-4 h-4" />
          <span className="text-xs font-bold tracking-wider uppercase">@idjuv.rr</span>
        </a>
      </div>
    </header>
  );
}
