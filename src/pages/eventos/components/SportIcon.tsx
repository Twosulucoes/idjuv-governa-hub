/**
 * Componente de Ícone de Modalidade - Ícones Lucide
 * Versão simplificada com ícones vetoriais
 */

import { cn } from "@/lib/utils";
import { Dribbble, Circle, Target, Volleyball } from "lucide-react";

interface SportIconProps {
  sport: "futsal" | "handebol" | "basquete" | "volei";
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { container: "w-10 h-10", icon: 20 },
  md: { container: "w-12 h-12", icon: 24 },
  lg: { container: "w-16 h-16", icon: 32 },
};

const sportIcons = {
  futsal: Circle,      // Bola de futsal
  handebol: Target,    // Alvo para handebol
  basquete: Dribbble,  // Bola de basquete
  volei: Volleyball,   // Bola de vôlei (se não existir, usar Circle)
};

export function SportIcon({ sport, className, size = "md" }: SportIconProps) {
  const sizeConfig = sizes[size];
  const IconComponent = sportIcons[sport];
  
  return (
    <div
      className={cn(
        "flex items-center justify-center flex-shrink-0",
        className
      )}
    >
      <IconComponent 
        size={sizeConfig.icon} 
        className="text-zinc-800 dark:text-zinc-200"
        strokeWidth={1.5}
      />
    </div>
  );
}
