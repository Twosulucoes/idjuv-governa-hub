import { cn } from "@/lib/utils";

interface IconeTransparenciaProps {
  className?: string;
  size?: number;
}

export function IconeTransparencia({ className, size = 24 }: IconeTransparenciaProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("transition-transform", className)}
    >
      {/* Olho - contorno externo */}
      <path 
        d="M4 24C4 24 12 10 24 10C36 10 44 24 44 24C44 24 36 38 24 38C12 38 4 24 4 24Z" 
        className="fill-primary/10 stroke-primary" 
        strokeWidth="2.5"
      />
      
      {/* Íris */}
      <circle cx="24" cy="24" r="10" className="fill-secondary/30 stroke-secondary" strokeWidth="2" />
      
      {/* Pupila */}
      <circle cx="24" cy="24" r="5" className="fill-primary" />
      
      {/* Brilho */}
      <circle cx="22" cy="22" r="2" className="fill-white" />
      
      {/* Raios de luz/transparência */}
      <path d="M24 2V6" className="stroke-accent" strokeWidth="2" strokeLinecap="round" />
      <path d="M24 42V46" className="stroke-accent" strokeWidth="2" strokeLinecap="round" />
      <path d="M38 10L35 13" className="stroke-highlight" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 38L13 35" className="stroke-highlight" strokeWidth="2" strokeLinecap="round" />
      <path d="M38 38L35 35" className="stroke-highlight" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 10L13 13" className="stroke-highlight" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
