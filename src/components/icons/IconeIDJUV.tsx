import { cn } from "@/lib/utils";

interface IconeIDJUVProps {
  className?: string;
  size?: number;
}

export function IconeIDJUV({ className, size = 24 }: IconeIDJUVProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("transition-transform", className)}
    >
      {/* Silhueta do estado de Roraima (simplificada) */}
      <path 
        d="M28 4C28 4 32 6 36 10C40 14 42 20 42 24C42 28 40 34 36 38C32 42 26 44 22 44C18 44 12 42 8 38C4 34 2 28 2 24C2 20 4 14 8 10C12 6 18 4 22 4H28Z" 
        className="fill-primary/20 stroke-primary" 
        strokeWidth="1.5"
      />
      
      {/* Figura do atleta - corpo */}
      <circle cx="24" cy="14" r="4" className="fill-white stroke-primary" strokeWidth="1.5" />
      
      {/* Corpo em movimento */}
      <path 
        d="M24 18L28 28L24 32L20 28L24 18Z" 
        className="fill-white stroke-primary" 
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      
      {/* Braços em movimento */}
      <path d="M20 22L14 18" className="stroke-primary" strokeWidth="2" strokeLinecap="round" />
      <path d="M28 22L34 18" className="stroke-primary" strokeWidth="2" strokeLinecap="round" />
      
      {/* Pernas em movimento */}
      <path d="M22 32L16 40" className="stroke-primary" strokeWidth="2" strokeLinecap="round" />
      <path d="M26 32L32 40" className="stroke-primary" strokeWidth="2" strokeLinecap="round" />
      
      {/* Seta de progresso - principal elemento da logo */}
      <path 
        d="M36 16L44 8" 
        className="stroke-accent" 
        strokeWidth="3" 
        strokeLinecap="round"
      />
      <path 
        d="M40 6L44 8L42 12" 
        className="stroke-accent" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Detalhes verde e amarelo (bandeira) */}
      <path d="M14 24L10 30L14 36" className="stroke-secondary" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 28L8 32" className="stroke-highlight" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
