import { cn } from "@/lib/utils";

interface IconeProcessosProps {
  className?: string;
  size?: number;
}

export function IconeProcessos({ className, size = 24 }: IconeProcessosProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("transition-transform", className)}
    >
      {/* Documento principal */}
      <rect x="8" y="4" width="24" height="32" rx="2" className="fill-primary/20 stroke-primary" strokeWidth="2" />
      
      {/* Linhas do documento */}
      <line x1="14" y1="12" x2="26" y2="12" className="stroke-primary/60" strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="18" x2="26" y2="18" className="stroke-primary/60" strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="24" x2="22" y2="24" className="stroke-primary/60" strokeWidth="2" strokeLinecap="round" />
      
      {/* Documento secundário (atrás) */}
      <rect x="16" y="12" width="24" height="32" rx="2" className="fill-card stroke-secondary" strokeWidth="2" />
      
      {/* Linhas do documento secundário */}
      <line x1="22" y1="20" x2="34" y2="20" className="stroke-secondary/60" strokeWidth="2" strokeLinecap="round" />
      <line x1="22" y1="26" x2="34" y2="26" className="stroke-secondary/60" strokeWidth="2" strokeLinecap="round" />
      <line x1="22" y1="32" x2="30" y2="32" className="stroke-secondary/60" strokeWidth="2" strokeLinecap="round" />
      
      {/* Check de aprovação */}
      <circle cx="38" cy="10" r="8" className="fill-secondary" />
      <path d="M34 10L37 13L42 8" className="stroke-white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
