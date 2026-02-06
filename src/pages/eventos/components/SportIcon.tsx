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
  sm: { container: "w-10 h-10", px: 40 },
  md: { container: "w-14 h-14", px: 56 },
  lg: { container: "w-20 h-20", px: 80 },
};

export function SportIcon({ sport, className, size = "md" }: SportIconProps) {
  const position = sportPositions[sport];
  const sizeConfig = sizes[size];
  
  // Calcula a posição do background para mostrar apenas o quadrante correto
  const bgPositionX = position.col === 0 ? "0%" : "100%";
  const bgPositionY = position.row === 0 ? "0%" : "100%";
  
  return (
    <div
      className={cn(
        "rounded-lg overflow-hidden flex-shrink-0",
        sizeConfig.container,
        className
      )}
    >
      <img
        src={silhuetasImg}
        alt={`Ícone de ${sport}`}
        className="w-[200%] h-[200%] object-cover grayscale contrast-200 brightness-0 dark:invert"
        style={{
          objectPosition: `${bgPositionX} ${bgPositionY}`,
          transform: `translate(${position.col === 0 ? '0' : '-50%'}, ${position.row === 0 ? '0' : '-50%'})`,
        }}
      />
    </div>
  );
}
