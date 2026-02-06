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
 * Silhueta de atleta genérica
 */
export function AthleteSilhouette({ 
  sport = "generic",
  className 
}: DecorativeProps & { sport?: "futsal" | "handebol" | "basquete" | "volei" | "generic" }) {
  const paths: Record<string, string> = {
    futsal: "M50 10 L45 25 L40 20 L35 40 L30 80 L40 85 L45 60 L50 85 L55 60 L60 85 L70 80 L65 40 L60 20 L55 25 Z",
    handebol: "M50 10 L45 25 L35 30 L30 50 L25 80 L35 85 L45 60 L50 85 L55 60 L65 85 L75 80 L70 50 L65 30 L55 25 Z",
    basquete: "M50 8 L45 22 L30 35 L35 55 L30 85 L42 88 L48 62 L52 62 L58 88 L70 85 L65 55 L70 35 L55 22 Z",
    volei: "M50 10 L45 25 L38 35 L32 55 L28 82 L40 88 L47 60 L53 60 L60 88 L72 82 L68 55 L62 35 L55 25 Z",
    generic: "M50 10 L45 25 L40 35 L35 55 L30 80 L40 85 L47 60 L53 60 L60 85 L70 80 L65 55 L60 35 L55 25 Z"
  };

  return (
    <svg
      viewBox="0 0 100 100"
      fill="currentColor"
      className={cn("w-full h-full", className)}
    >
      <circle cx="50" cy="10" r="8" />
      <path d={paths[sport]} />
    </svg>
  );
}

/**
 * Círculo com silhueta de atleta
 */
export function AthleteCircle({ 
  sport = "generic",
  className 
}: DecorativeProps & { sport?: "futsal" | "handebol" | "basquete" | "volei" | "generic" }) {
  return (
    <div className={cn("relative", className)}>
      <DecorativeCircle className="w-full h-full absolute inset-0" />
      <div className="absolute inset-4 text-zinc-900">
        <AthleteSilhouette sport={sport} />
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
