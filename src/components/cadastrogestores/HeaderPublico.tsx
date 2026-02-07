/**
 * Header Institucional para páginas públicas do módulo de Cadastro de Gestores
 * Segue o padrão visual do projeto com logos do Governo RR e IDJuv
 */

import { Link } from 'react-router-dom';
import logoGoverno from '@/assets/logo-governo-roraima.jpg';
import logoGovernoDark from '@/assets/logo-governo-roraima-dark.png';
import { useLogoIdjuv } from '@/hooks/useLogoIdjuv';

interface HeaderPublicoProps {
  titulo?: string;
  subtitulo?: string;
}

export function HeaderPublico({ 
  titulo = "Credenciamento de Gestores Escolares",
  subtitulo = "Jogos Escolares de Roraima - JER 2025"
}: HeaderPublicoProps) {
  const logoIdjuv = useLogoIdjuv();

  return (
    <header className="bg-primary text-primary-foreground">
      {/* Linha dourada superior */}
      <div className="h-1 bg-[#B4914B]" />
      
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo Governo (esquerda) */}
          <Link to="/" className="flex-shrink-0">
            <div className="bg-white/95 rounded-lg p-1.5">
              <img
                src={logoGoverno}
                alt="Governo do Estado de Roraima"
                className="h-10 md:h-12 w-auto object-contain dark:hidden"
              />
              <img
                src={logoGovernoDark}
                alt="Governo do Estado de Roraima"
                className="h-10 md:h-12 w-auto object-contain hidden dark:block"
              />
            </div>
          </Link>

          {/* Textos Centrais */}
          <div className="flex-1 text-center hidden sm:block">
            <p className="font-bold text-sm md:text-base text-white">
              GOVERNO DO ESTADO DE RORAIMA
            </p>
            <p className="text-xs md:text-sm text-white/90">
              Instituto de Desporto, Juventude e Lazer
            </p>
          </div>

          {/* Logo IDJuv (direita) */}
          <Link to="/" className="flex-shrink-0">
            <div className="bg-white/95 rounded-lg p-1.5">
              <img
                src={logoIdjuv}
                alt="IDJuv"
                className="h-10 md:h-12 w-auto object-contain"
              />
            </div>
          </Link>
        </div>

        {/* Título da página */}
        <div className="text-center mt-4 pt-4 border-t border-white/20">
          <h1 className="font-bold text-lg md:text-xl text-white">
            {titulo}
          </h1>
          <p className="text-sm text-white/80 mt-1">
            {subtitulo}
          </p>
        </div>
      </div>
    </header>
  );
}
