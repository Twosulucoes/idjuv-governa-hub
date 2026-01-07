import { useState, useEffect } from "react";
import { useLogoIdjuv, logoIdjuvOficial, logoIdjuvDark } from "@/hooks/useLogoIdjuv";
import { cn } from "@/lib/utils";

/**
 * SISTEMA DE LOGOS IDJUV
 * 
 * Tamanhos por contexto (definidos em CSS como variáveis):
 * - Header desktop: 3.5rem (56px)
 * - Header mobile: 2.5rem (40px)  
 * - Footer: 3rem (48px)
 * - Sidebar: 2rem (32px)
 * - Card: 2.5rem (40px)
 * - Hero: 4rem (64px)
 * 
 * Regras:
 * 1. NUNCA esticar ou comprimir - usar object-contain
 * 2. Fundo claro → logo oficial (variant="light")
 * 3. Fundo escuro → logo dark (variant="dark")
 * 4. Auto detecta pelo tema quando variant="auto"
 * 5. NÃO usar containers/boxes desnecessários
 */

interface LogoIdjuvProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'width' | 'height'> {
  /**
   * Variante da logo baseada no fundo
   * - 'auto': detecta automaticamente pelo tema (padrão)
   * - 'light': logo oficial para fundos claros
   * - 'dark': logo para fundos escuros
   */
  variant?: 'auto' | 'light' | 'dark';
}

/**
 * Componente principal de logo IDJUV
 * 
 * @example
 * // Auto-detecta baseado no tema
 * <LogoIdjuv className="logo-header" />
 * 
 * @example
 * // Força versão para fundo escuro
 * <LogoIdjuv variant="dark" className="logo-footer" />
 */
export function LogoIdjuv({ 
  className, 
  alt = "IDJUV - Instituto de Desporto e Juventude de Roraima",
  variant = 'auto',
  loading = "lazy",
  ...props
}: LogoIdjuvProps) {
  const forceVariant = variant === 'auto' ? undefined : variant;
  const logoSrc = useLogoIdjuv(forceVariant);
  const [currentSrc, setCurrentSrc] = useState(logoSrc);
  const [hasError, setHasError] = useState(false);

  // Atualiza quando o tema muda
  useEffect(() => {
    setCurrentSrc(logoSrc);
    setHasError(false);
  }, [logoSrc]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      // Fallback para versão alternativa
      setCurrentSrc(variant === 'dark' ? logoIdjuvOficial : logoIdjuvDark);
    }
  };

  return (
    <img
      src={currentSrc}
      alt={alt}
      loading={loading}
      className={cn(
        "logo object-contain",
        hasError && "opacity-80",
        className
      )}
      onError={handleError}
      {...props}
    />
  );
}

/**
 * Versão simplificada - apenas imagem, sem lógica extra
 */
export function LogoIdjuvSimple({ 
  variant = 'auto',
  className,
  ...props 
}: Omit<LogoIdjuvProps, 'loading'>) {
  const forceVariant = variant === 'auto' ? undefined : variant;
  const logoSrc = useLogoIdjuv(forceVariant);

  return (
    <img
      src={logoSrc}
      alt="IDJUV"
      className={cn("logo object-contain", className)}
      loading="lazy"
      {...props}
    />
  );
}

/**
 * Logo como link para home
 */
interface LogoIdjuvLinkProps extends LogoIdjuvProps {
  href?: string;
}

export function LogoIdjuvLink({
  href = "/",
  variant = 'auto',
  className,
  ...logoProps
}: LogoIdjuvLinkProps) {
  return (
    <a
      href={href}
      className="inline-flex items-center"
      aria-label="Ir para página inicial"
    >
      <LogoIdjuv
        variant={variant}
        className={className}
        {...logoProps}
      />
    </a>
  );
}

/**
 * Logos estáticas para uso direto (PDFs, contextos estáticos)
 */
export const logos = {
  /** Logo oficial (fundo claro) */
  light: logoIdjuvOficial,
  /** Logo dark (fundo escuro) */
  dark: logoIdjuvDark,
  /** Hook para obter logo baseado no tema */
  useLogoIdjuv,
} as const;

// Re-exportar para compatibilidade
export { logoIdjuvOficial, logoIdjuvDark };