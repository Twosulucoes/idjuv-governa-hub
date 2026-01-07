import { cn } from "@/lib/utils";

interface IconeIntegridadeProps {
  className?: string;
  size?: number;
}

export function IconeIntegridade({ className, size = 24 }: IconeIntegridadeProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("transition-transform", className)}
    >
      {/* Balança - base */}
      <rect x="22" y="36" width="4" height="8" className="fill-primary" />
      <rect x="16" y="42" width="16" height="4" rx="1" className="fill-primary/80" />
      
      {/* Poste central */}
      <rect x="23" y="8" width="2" height="28" className="fill-primary" />
      
      {/* Barra horizontal */}
      <rect x="6" y="10" width="36" height="3" rx="1" className="fill-secondary" />
      
      {/* Prato esquerdo */}
      <path d="M6 13L10 24H18L22 13" className="stroke-primary" strokeWidth="2" fill="none" />
      <ellipse cx="14" cy="24" rx="5" ry="2" className="fill-primary/30 stroke-primary" strokeWidth="1.5" />
      
      {/* Prato direito */}
      <path d="M26 13L30 24H38L42 13" className="stroke-primary" strokeWidth="2" fill="none" />
      <ellipse cx="34" cy="24" rx="5" ry="2" className="fill-primary/30 stroke-primary" strokeWidth="1.5" />
      
      {/* Símbolo de ética/estrela no topo */}
      <circle cx="24" cy="6" r="4" className="fill-highlight" />
      <circle cx="24" cy="6" r="2" className="fill-white" />
      
      {/* Correntes */}
      <line x1="8" y1="13" x2="10" y2="22" className="stroke-accent" strokeWidth="1.5" />
      <line x1="20" y1="13" x2="18" y2="22" className="stroke-accent" strokeWidth="1.5" />
      <line x1="28" y1="13" x2="30" y2="22" className="stroke-accent" strokeWidth="1.5" />
      <line x1="40" y1="13" x2="38" y2="22" className="stroke-accent" strokeWidth="1.5" />
    </svg>
  );
}
