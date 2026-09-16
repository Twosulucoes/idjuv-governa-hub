/**
 * LOGO DA INSTITUIÇÃO
 *
 * Substitui `LogoIdjuv` (White Label — Fase 2). A imagem e o texto alternativo
 * vêm do perfil do tenant ativo; o componente não conhece nenhum cliente.
 *
 * Tamanhos por contexto vêm das classes `logo-*` em `src/index.css`:
 * header (3.5rem), footer (3rem), sidebar (2rem), card (2.5rem), hero (4rem).
 *
 * Regras mantidas da versão anterior:
 * 1. Nunca esticar — sempre `object-contain`.
 * 2. Fundo claro → variante clara; fundo escuro → variante escura.
 * 3. `variant="auto"` segue o tema.
 * 4. Sem container desnecessário em volta.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  useIdentidade,
  useLogoOrgao,
  useLogoEntidadeSuperior,
  useMarcaAssets,
  useTenant,
  type VarianteLogo,
} from '@/core/tenant';
import { cn } from '@/lib/utils';

interface LogoProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'width' | 'height'> {
  /** Fundo sobre o qual a logo aparece. `'auto'` segue o tema. */
  variant?: VarianteLogo;
}

/**
 * Logo do órgão.
 *
 * @example
 * <Logo className="logo-header" />           // segue o tema
 * <Logo variant="dark" className="h-14" />   // força fundo escuro
 */
export function Logo({
  className,
  alt,
  variant = 'auto',
  loading = 'lazy',
  ...props
}: LogoProps) {
  const identidade = useIdentidade();
  const { logoLight, logoDark } = useMarcaAssets();
  const logoSrc = useLogoOrgao(variant);
  const [srcAtual, setSrcAtual] = useState(logoSrc);
  const [comErro, setComErro] = useState(false);

  // Acompanha a troca de tema.
  useEffect(() => {
    setSrcAtual(logoSrc);
    setComErro(false);
  }, [logoSrc]);

  // Se a variante falhar ao carregar, tenta a outra antes de desistir.
  const aoFalhar = () => {
    if (comErro) return;
    setComErro(true);
    setSrcAtual(logoSrc === logoDark ? logoLight : logoDark);
  };

  return (
    <img
      src={srcAtual}
      alt={alt ?? `${identidade.sigla} — ${identidade.nomeOficial}`}
      loading={loading}
      className={cn('logo object-contain', comErro && 'opacity-80', className)}
      onError={aoFalhar}
      {...props}
    />
  );
}

/** Logo do órgão sem tratamento de erro — para contextos simples. */
export function LogoSimples({
  variant = 'auto',
  className,
  alt,
  ...props
}: Omit<LogoProps, 'loading'>) {
  const identidade = useIdentidade();
  const logoSrc = useLogoOrgao(variant);

  return (
    <img
      src={logoSrc}
      alt={alt ?? identidade.nomeCurto}
      className={cn('logo object-contain', className)}
      loading="lazy"
      {...props}
    />
  );
}

interface LogoLinkProps extends LogoProps {
  href?: string;
}

/** Logo como link para a home. */
export function LogoLink({
  href = '/',
  variant = 'auto',
  className,
  ...logoProps
}: LogoLinkProps) {
  return (
    <Link
      to={href}
      className="inline-flex items-center"
      aria-label="Ir para página inicial"
    >
      <Logo variant={variant} className={className} {...logoProps} />
    </Link>
  );
}

/**
 * Logo da entidade superior (Governo do Estado, Prefeitura, Ministério).
 *
 * Não renderiza nada quando a instituição não tem entidade superior — é o que
 * permite ao mesmo layout servir um órgão autônomo sem deixar buraco.
 */
export function LogoEntidadeSuperior({
  className,
  alt,
  variant = 'auto',
  loading = 'lazy',
  ...props
}: LogoProps) {
  const { entidadeSuperior } = useTenant();
  const src = useLogoEntidadeSuperior(variant);

  if (!entidadeSuperior || !src) return null;

  return (
    <img
      src={src}
      alt={alt ?? entidadeSuperior.nome}
      loading={loading}
      className={cn('logo object-contain', className)}
      {...props}
    />
  );
}
