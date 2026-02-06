/**
 * Elementos Decorativos SVG para V2 do Hot Site
 * Estilo minimalista baseado nos cards de referência
 */

import { cn } from "@/lib/utils";

interface DecorativeProps {
  className?: string;
}

/**
 * Indicador de página estilo dots
 */
export function DotsIndicator({ 
  total = 5, 
  active = 0,
  className 
}: DecorativeProps & { total?: number; active?: number }) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-2 h-2 rounded-full transition-colors",
            i === active ? "bg-zinc-900" : "bg-zinc-400"
          )}
        />
      ))}
    </div>
  );
}

/**
 * Linha curva decorativa - estilo Futsal card
 */
export function CurvedLine({ className }: DecorativeProps) {
  return (
    <svg
      viewBox="0 0 200 100"
      fill="none"
      className={cn("w-32 h-16", className)}
    >
      <path
        d="M0 50 Q50 0, 100 50 T200 50"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
      />
    </svg>
  );
}

/**
 * Retângulo arredondado decorativo
 */
export function RoundedRect({ className }: DecorativeProps) {
  return (
    <div
      className={cn(
        "w-24 h-8 rounded-full border-2 border-current",
        className
      )}
    />
  );
}

/**
 * Círculo decorativo com borda
 */
export function DecorativeCircle({ className }: DecorativeProps) {
  return (
    <div
      className={cn(
        "rounded-full border-4 border-zinc-900 bg-zinc-200",
        className
      )}
    />
  );
}

/**
 * Jogador de Futsal - silhueta detalhada
 */
export function FutsalPlayer({ className }: DecorativeProps) {
  return (
    <svg viewBox="0 0 100 120" fill="currentColor" className={cn("w-full h-full", className)}>
      {/* Cabeça */}
      <ellipse cx="50" cy="12" rx="10" ry="11" />
      {/* Corpo/Torso */}
      <path d="M35 25 L40 22 L50 20 L60 22 L65 25 L62 50 L58 48 L50 50 L42 48 L38 50 Z" />
      {/* Braço esquerdo (chutando) */}
      <path d="M35 28 L25 35 L20 50 L25 52 L32 40 L38 35 Z" />
      {/* Braço direito */}
      <path d="M65 28 L75 38 L78 42 L74 45 L68 38 L62 32 Z" />
      {/* Perna esquerda (apoio) */}
      <path d="M42 48 L40 70 L38 95 L35 105 L42 107 L45 97 L46 70 L48 50 Z" />
      {/* Perna direita (chutando - elevada) */}
      <path d="M52 50 L55 55 L70 60 L85 55 L88 50 L85 48 L70 52 L55 48 L52 48 Z" />
      {/* Bola */}
      <circle cx="92" cy="52" r="8" />
      <path d="M88 52 L92 48 L96 52 L92 56 Z" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

/**
 * Jogador de Handebol - silhueta detalhada
 */
export function HandebolPlayer({ className }: DecorativeProps) {
  return (
    <svg viewBox="0 0 100 120" fill="currentColor" className={cn("w-full h-full", className)}>
      {/* Cabeça */}
      <ellipse cx="45" cy="12" rx="10" ry="11" />
      {/* Corpo/Torso inclinado */}
      <path d="M32 25 L38 22 L48 20 L58 24 L60 28 L55 52 L48 50 L40 52 L35 50 Z" />
      {/* Braço esquerdo */}
      <path d="M32 28 L22 40 L18 55 L22 58 L28 45 L35 32 Z" />
      {/* Braço direito (arremessando) - elevado com bola */}
      <path d="M58 24 L70 15 L82 8 L85 12 L75 22 L65 30 L60 28 Z" />
      {/* Bola na mão */}
      <circle cx="85" cy="8" r="6" />
      {/* Perna esquerda */}
      <path d="M40 50 L38 72 L35 95 L32 107 L40 108 L43 96 L44 72 L45 52 Z" />
      {/* Perna direita (impulso) */}
      <path d="M48 50 L52 70 L58 90 L62 100 L68 97 L60 85 L54 65 L50 50 Z" />
    </svg>
  );
}

/**
 * Jogador de Basquete - silhueta detalhada
 */
export function BasquetePlayer({ className }: DecorativeProps) {
  return (
    <svg viewBox="0 0 100 130" fill="currentColor" className={cn("w-full h-full", className)}>
      {/* Cabeça */}
      <ellipse cx="50" cy="12" rx="10" ry="11" />
      {/* Corpo/Torso */}
      <path d="M38 25 L42 22 L50 20 L58 22 L62 25 L58 55 L52 53 L48 53 L42 55 Z" />
      {/* Braço esquerdo (equilibrando) */}
      <path d="M38 28 L28 35 L22 45 L26 48 L32 40 L40 32 Z" />
      {/* Braço direito (segurando bola acima) */}
      <path d="M62 25 L72 18 L78 8 L82 10 L78 22 L68 30 L62 28 Z" />
      {/* Bola acima */}
      <circle cx="80" cy="5" r="9" />
      <path d="M74 5 Q80 0, 86 5 Q80 10, 74 5" fill="currentColor" opacity="0.3" />
      {/* Perna esquerda (flexionada - salto) */}
      <path d="M42 53 L38 65 L35 75 L32 85 L28 95 L35 98 L40 88 L44 75 L46 60 L48 55 Z" />
      {/* Perna direita (estendida) */}
      <path d="M52 53 L55 70 L58 90 L60 105 L55 115 L62 118 L68 108 L64 88 L58 65 L54 53 Z" />
    </svg>
  );
}

/**
 * Jogador de Vôlei - silhueta detalhada
 */
export function VoleiPlayer({ className }: DecorativeProps) {
  return (
    <svg viewBox="0 0 100 130" fill="currentColor" className={cn("w-full h-full", className)}>
      {/* Cabeça */}
      <ellipse cx="50" cy="12" rx="10" ry="11" />
      {/* Corpo/Torso arqueado */}
      <path d="M38 25 L44 22 L50 20 L56 22 L62 25 L58 50 L50 52 L42 50 Z" />
      {/* Braço esquerdo (preparando) */}
      <path d="M38 28 L30 22 L22 25 L20 30 L28 30 L38 30 Z" />
      {/* Braço direito (atacando - cortada) */}
      <path d="M62 25 L75 15 L88 5 L92 10 L80 22 L68 32 L62 28 Z" />
      {/* Mão na bola */}
      <ellipse cx="90" cy="6" rx="7" ry="7" />
      {/* Perna esquerda (impulso) */}
      <path d="M42 50 L38 65 L32 80 L28 95 L35 100 L42 85 L46 68 L48 52 Z" />
      {/* Perna direita (elevada atrás) */}
      <path d="M52 52 L58 60 L68 68 L75 72 L78 68 L70 60 L60 52 L54 50 Z" />
    </svg>
  );
}

/**
 * Círculo com figura de atleta específica por esporte
 */
export function AthleteCircle({ 
  sport = "generic",
  className 
}: DecorativeProps & { sport?: "futsal" | "handebol" | "basquete" | "volei" | "generic" }) {
  const SportComponent = {
    futsal: FutsalPlayer,
    handebol: HandebolPlayer,
    basquete: BasquetePlayer,
    volei: VoleiPlayer,
    generic: FutsalPlayer
  }[sport];

  return (
    <div className={cn("relative", className)}>
      <div className="w-full h-full rounded-full border-4 border-zinc-900 bg-gradient-to-br from-zinc-100 to-zinc-200 absolute inset-0" />
      <div className="absolute inset-3 text-zinc-900 flex items-center justify-center">
        <SportComponent className="w-4/5 h-4/5" />
      </div>
    </div>
  );
}

/**
 * Elemento decorativo de canto
 */
export function CornerDecoration({ 
  position = "top-left",
  className 
}: DecorativeProps & { position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" }) {
  const rotations = {
    "top-left": "rotate-0",
    "top-right": "rotate-90",
    "bottom-right": "rotate-180",
    "bottom-left": "-rotate-90"
  };

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      className={cn("w-20 h-20", rotations[position], className)}
    >
      <path d="M0 100 Q0 0, 100 0" />
      <path d="M0 80 Q20 20, 80 0" />
    </svg>
  );
}

/**
 * Linhas decorativas paralelas
 */
export function ParallelLines({ className }: DecorativeProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="h-0.5 w-full bg-current" />
      <div className="h-0.5 w-3/4 bg-current" />
      <div className="h-0.5 w-1/2 bg-current" />
    </div>
  );
}
