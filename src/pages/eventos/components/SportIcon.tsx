/**
 * Componente de Ícone de Modalidade usando recorte da imagem de silhuetas
 * Versão com silhuetas P&B sem fundo colorido
 */

import { cn } from "@/lib/utils";
import silhuetasImg from "@/assets/silhuetas-modalidades.png";

interface SportIconProps {
  sport: "futsal" | "handebol" | "basquete" | "volei";
  className?: string;
  size?: "sm" | "md" | "lg";
}

// Mapeamento das posições de cada esporte na imagem 2x2
const sportPositions = {
  handebol: { row: 0, col: 0 },   // Superior esquerdo
  volei: { row: 0, col: 1 },      // Superior direito
  basquete: { row: 1, col: 0 },   // Inferior esquerdo
  futsal: { row: 1, col: 1 },     // Inferior direito
};

const sizes = {
  sm: "w-10 h-10",
  md: "w-14 h-14",
  lg: "w-20 h-20",
};

export function SportIcon({ sport, className, size = "md" }: SportIconProps) {
  const position = sportPositions[sport];
  
  // Calcula a posição do background para mostrar apenas o quadrante correto
  const bgPositionX = position.col === 0 ? "0%" : "100%";
  const bgPositionY = position.row === 0 ? "0%" : "100%";
  
  return (
    <div
      className={cn(
        "rounded-lg overflow-hidden flex-shrink-0 grayscale contrast-200 brightness-0 dark:invert",
        sizes[size],
        className
      )}
      style={{
        backgroundImage: `url(${silhuetasImg})`,
        backgroundSize: "200% 200%",
        backgroundPosition: `${bgPositionX} ${bgPositionY}`,
      }}
      aria-label={`Ícone de ${sport}`}
    />
  );
}
