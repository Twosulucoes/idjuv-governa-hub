import { cn } from "@/lib/utils";

interface IconeManuaisProps {
  className?: string;
  size?: number;
}

export function IconeManuais({ className, size = 24 }: IconeManuaisProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("transition-transform", className)}
    >
      {/* Livro aberto - lado esquerdo */}
      <path 
        d="M6 10C6 8.89543 6.89543 8 8 8H20C22.2091 8 24 9.79086 24 12V40C24 38.3431 22.6569 37 21 37H8C6.89543 37 6 36.1046 6 35V10Z" 
        className="fill-primary/20 stroke-primary" 
        strokeWidth="2" 
      />
      
      {/* Livro aberto - lado direito */}
      <path 
        d="M42 10C42 8.89543 41.1046 8 40 8H28C25.7909 8 24 9.79086 24 12V40C24 38.3431 25.3431 37 27 37H40C41.1046 37 42 36.1046 42 35V10Z" 
        className="fill-secondary/20 stroke-secondary" 
        strokeWidth="2" 
      />
      
      {/* Lombada do livro */}
      <line x1="24" y1="12" x2="24" y2="40" className="stroke-accent" strokeWidth="2" />
      
      {/* Linhas de texto - esquerda */}
      <line x1="10" y1="16" x2="20" y2="16" className="stroke-primary/50" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="21" x2="18" y2="21" className="stroke-primary/50" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="26" x2="20" y2="26" className="stroke-primary/50" strokeWidth="1.5" strokeLinecap="round" />
      
      {/* Linhas de texto - direita */}
      <line x1="28" y1="16" x2="38" y2="16" className="stroke-secondary/50" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="28" y1="21" x2="36" y2="21" className="stroke-secondary/50" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="28" y1="26" x2="38" y2="26" className="stroke-secondary/50" strokeWidth="1.5" strokeLinecap="round" />
      
      {/* Marca páginas */}
      <path d="M34 4V14L37 11L40 14V4H34Z" className="fill-highlight" />
    </svg>
  );
}
