/**
 * Footer Institucional V2 - Hot site Seletivas Estudantis
 * Design minimalista P&B
 */

import { Logo } from "@/components/ui/Logo";
import { getMarcaAssets, useTenant } from '@/core/tenant';

// Marca vem do perfil do tenant, não de '@/assets' (White Label — Fase 1).
const { entidadeSuperiorDark: logoGovernoDark } = getMarcaAssets();

export function SeletivaFooterV2() {
  const { identidade, entidadeSuperior } = useTenant();
  // Classe "dark" fixa: o rodapé é sempre escuro (logos na versão para fundo escuro)
  return (
    <footer className="dark bg-background text-foreground py-8">
      <div className="container mx-auto px-4">
        {/* Logos Institucionais */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-6">
          <p className="text-xs text-muted-foreground mb-2 text-right">
            <span className="block">Diretoria de</span>
            <span className="block uppercase text-lg tracking-[0.5em]">ESPORTE</span>
          </p>
          
          <Logo variant="dark" className="h-12" />
          
          <img 
            src={logoGovernoDark} 
            alt={entidadeSuperior?.nome ?? ""} 
            className="h-10 object-contain"
          />
        </div>
        
        {/* Copyright */}
        <div className="text-center border-t border-border pt-6">
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
            © 2026 {identidade.nomeOficial}
          </p>
          {entidadeSuperior?.nome && (
            <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground mt-1">
              {entidadeSuperior.nome}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
