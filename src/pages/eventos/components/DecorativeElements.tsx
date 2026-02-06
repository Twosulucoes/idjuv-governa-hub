/**
 * Elementos Decorativos SVG para V2 do Hot Site
 * Estilo minimalista com suporte a dark mode
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
    <div className={cn("flex items-center gap-2", className)}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-2 h-2 rounded-full transition-colors",
            i === active 
              ? "bg-zinc-900 dark:bg-zinc-100" 
              : "bg-zinc-300 dark:bg-zinc-600"
          )}
        />
      ))}
    </div>
  );
}

/**
 * Jogador de Futsal - silhueta
 */
export function FutsalPlayer({ className }: DecorativeProps) {
  return (
    <svg viewBox="0 0 100 120" fill="currentColor" className={cn("w-full h-full", className)}>
      <ellipse cx="50" cy="12" rx="10" ry="11" />
      <path d="M35 25 L40 22 L50 20 L60 22 L65 25 L62 50 L58 48 L50 50 L42 48 L38 50 Z" />
      <path d="M35 28 L25 35 L20 50 L25 52 L32 40 L38 35 Z" />
      <path d="M65 28 L75 38 L78 42 L74 45 L68 38 L62 32 Z" />
      <path d="M42 48 L40 70 L38 95 L35 105 L42 107 L45 97 L46 70 L48 50 Z" />
      <path d="M52 50 L55 55 L70 60 L85 55 L88 50 L85 48 L70 52 L55 48 L52 48 Z" />
      <circle cx="92" cy="52" r="8" />
    </svg>
  );
}

/**
 * Jogador de Handebol - silhueta
 */
export function HandebolPlayer({ className }: DecorativeProps) {
  return (
    <svg viewBox="0 0 100 120" fill="currentColor" className={cn("w-full h-full", className)}>
      <ellipse cx="45" cy="12" rx="10" ry="11" />
      <path d="M32 25 L38 22 L48 20 L58 24 L60 28 L55 52 L48 50 L40 52 L35 50 Z" />
      <path d="M32 28 L22 40 L18 55 L22 58 L28 45 L35 32 Z" />
      <path d="M58 24 L70 15 L82 8 L85 12 L75 22 L65 30 L60 28 Z" />
      <circle cx="85" cy="8" r="6" />
      <path d="M40 50 L38 72 L35 95 L32 107 L40 108 L43 96 L44 72 L45 52 Z" />
      <path d="M48 50 L52 70 L58 90 L62 100 L68 97 L60 85 L54 65 L50 50 Z" />
    </svg>
  );
}

/**
 * Jogador de Basquete - silhueta
 */
export function BasquetePlayer({ className }: DecorativeProps) {
  return (
    <svg viewBox="0 0 100 130" fill="currentColor" className={cn("w-full h-full", className)}>
      <ellipse cx="50" cy="12" rx="10" ry="11" />
      <path d="M38 25 L42 22 L50 20 L58 22 L62 25 L58 55 L52 53 L48 53 L42 55 Z" />
      <path d="M38 28 L28 35 L22 45 L26 48 L32 40 L40 32 Z" />
      <path d="M62 25 L72 18 L78 8 L82 10 L78 22 L68 30 L62 28 Z" />
      <circle cx="80" cy="5" r="9" />
      <path d="M42 53 L38 65 L35 75 L32 85 L28 95 L35 98 L40 88 L44 75 L46 60 L48 55 Z" />
      <path d="M52 53 L55 70 L58 90 L60 105 L55 115 L62 118 L68 108 L64 88 L58 65 L54 53 Z" />
    </svg>
  );
}

/**
 * Jogador de Vôlei - silhueta
 */
export function VoleiPlayer({ className }: DecorativeProps) {
  return (
    <svg viewBox="0 0 100 130" fill="currentColor" className={cn("w-full h-full", className)}>
      <ellipse cx="50" cy="12" rx="10" ry="11" />
      <path d="M38 25 L44 22 L50 20 L56 22 L62 25 L58 50 L50 52 L42 50 Z" />
      <path d="M38 28 L30 22 L22 25 L20 30 L28 30 L38 30 Z" />
      <path d="M62 25 L75 15 L88 5 L92 10 L80 22 L68 32 L62 28 Z" />
      <ellipse cx="90" cy="6" rx="7" ry="7" />
      <path d="M42 50 L38 65 L32 80 L28 95 L35 100 L42 85 L46 68 L48 52 Z" />
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
      <div className="w-full h-full rounded-full border-4 border-zinc-900 dark:border-zinc-100 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-700 dark:to-zinc-800 absolute inset-0" />
      <div className="absolute inset-3 text-zinc-900 dark:text-zinc-100 flex items-center justify-center">
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
