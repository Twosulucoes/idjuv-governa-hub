/**
 * Footer Institucional V2 - Hot site Seletivas Estudantis
 * Design minimalista P&B
 */

import { LogoIdjuv } from "@/components/ui/LogoIdjuv";
import logoGovernoDark from "@/assets/logo-governo-roraima-dark.png";

export function SeletivaFooterV2() {
  return (
    <footer className="bg-zinc-900 text-zinc-100 py-8">
      <div className="container mx-auto px-4">
        {/* Logos Institucionais */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-6">
          <p className="text-[10px] text-zinc-400 mb-2 text-right">
            <span className="block">Diretoria de</span>
            <span className="block uppercase text-lg tracking-[0.5em]">ESPORTE</span>
          </p>
          
          <LogoIdjuv variant="dark" className="h-12" />
          
          <img 
            src={logoGovernoDark} 
            alt="Governo de Roraima" 
            className="h-10 object-contain"
          />
        </div>
        
        {/* Copyright */}
        <div className="text-center border-t border-zinc-800 pt-6">
          <p className="text-[10px] tracking-[0.2em] uppercase text-zinc-500">
            © 2026 IDJuv - Instituto de Desporto e Juventude de Roraima
          </p>
          <p className="text-[10px] tracking-[0.15em] uppercase text-zinc-600 mt-1">
            Governo de Roraima
          </p>
        </div>
      </div>
    </footer>
  );
}
