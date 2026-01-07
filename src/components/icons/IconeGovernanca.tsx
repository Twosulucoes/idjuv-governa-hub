import { cn } from "@/lib/utils";

interface IconeGovernancaProps {
  className?: string;
  size?: number;
}

export function IconeGovernanca({ className, size = 24 }: IconeGovernancaProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("transition-transform", className)}
    >
      {/* Base do prédio institucional */}
      <rect x="8" y="38" width="32" height="4" rx="1" className="fill-primary" />
      
      {/* Colunas */}
      <rect x="12" y="18" width="4" height="20" rx="1" className="fill-primary/80" />
      <rect x="22" y="18" width="4" height="20" rx="1" className="fill-primary/80" />
      <rect x="32" y="18" width="4" height="20" rx="1" className="fill-primary/80" />
      
      {/* Teto triangular */}
      <path d="M6 18L24 6L42 18H6Z" className="fill-secondary" />
      
      {/* Detalhe central - escudo */}
      <circle cx="24" cy="12" r="3" className="fill-primary" />
      
      {/* Seta de progresso */}
      <path d="M38 8L42 4L46 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="stroke-accent" />
      <path d="M42 4V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="stroke-accent" />
    </svg>
  );
}
