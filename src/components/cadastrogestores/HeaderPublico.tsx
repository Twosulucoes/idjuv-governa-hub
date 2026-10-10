/**
 * Header Institucional para páginas públicas do módulo de Cadastro de Gestores
 * Segue o padrão visual do projeto com logos da entidade superior e do órgão (perfil do tenant)
 */

import { Link } from 'react-router-dom';
import { useIdentidade, useLogoOrgao, useTenant } from '@/core/tenant';

import { getMarcaAssets } from '@/core/tenant';

// Marca vem do perfil do tenant, não de '@/assets' (White Label — Fase 1).
const { entidadeSuperiorDark: logoGovernoDark, entidadeSuperiorLight: logoGoverno } = getMarcaAssets();

interface HeaderPublicoProps {
  titulo?: string;
  subtitulo?: string;
}

export function HeaderPublico({ 
  titulo = "Credenciamento de Gestores Escolares",
  subtitulo = "Jogos Escolares de Roraima - JER's 2026"
}: HeaderPublicoProps) {
  const logoIdjuv = useLogoOrgao();
  const { nomeOficial, sigla } = useIdentidade();
  const { entidadeSuperior } = useTenant();
  const nomeEntidadeSuperior = entidadeSuperior?.nome ?? '';

  return (
    <header className="bg-primary text-primary-foreground">
      {/* Linha dourada superior */}
      <div className="h-1 bg-highlight" aria-hidden="true" />
      
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo Governo (esquerda) */}
          <Link to="/" className="flex-shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground" aria-label="Ir para a página inicial">
            <div className="bg-background/95 rounded-lg p-1.5">
              <img
                src={logoGoverno}
                alt={nomeEntidadeSuperior}
                className="h-10 md:h-12 w-auto object-contain dark:hidden"
              />
              <img
                src={logoGovernoDark}
                alt={nomeEntidadeSuperior}
                className="h-10 md:h-12 w-auto object-contain hidden dark:block"
              />
            </div>
          </Link>

          {/* Textos Centrais */}
          <div className="flex-1 text-center hidden sm:block">
            {nomeEntidadeSuperior && (
              <p className="font-bold text-sm md:text-base text-primary-foreground uppercase">
                {nomeEntidadeSuperior}
              </p>
            )}
            <p className="text-xs md:text-sm text-primary-foreground/90">
              {nomeOficial}
            </p>
          </div>

          {/* Logo do órgão (direita) */}
          <Link to="/" className="flex-shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground" aria-label={`${sigla} — página inicial`}>
            <div className="bg-background/95 rounded-lg p-1.5">
              <img
                src={logoIdjuv}
                alt={sigla}
                className="h-10 md:h-12 w-auto object-contain"
              />
            </div>
          </Link>
        </div>

        {/* Título da página */}
        <div className="text-center mt-4 pt-4 border-t border-primary-foreground/20">
          <h1 className="font-bold text-lg md:text-xl text-primary-foreground">
            {titulo}
          </h1>
          <p className="text-base text-primary-foreground/80 mt-1">
            {subtitulo}
          </p>
        </div>
      </div>
    </header>
  );
}
