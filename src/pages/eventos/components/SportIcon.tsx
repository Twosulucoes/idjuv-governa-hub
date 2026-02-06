/**
 * Componente de Ícone de Modalidade usando recorte da imagem de silhuetas
 */

import { cn } from "@/lib/utils";
import silhuetasImg from "@/assets/silhuetas-modalidades.png";

interface SportIconProps {
  sport: "futsal" | "handebol" | "basquete" | "volei";
  className?: string;
  size?: "sm" | "md" | "lg";
}

// Mapeamento das posições de cada esporte na imagem 2x2
// A imagem está dividida em 4 quadrantes iguais
const sportPositions = {
  handebol: { row: 0, col: 0, color: "bg-blue-500" },      // Superior esquerdo - azul
  volei: { row: 0, col: 1, color: "bg-orange-500" },       // Superior direito - laranja
  basquete: { row: 1, col: 0, color: "bg-purple-600" },    // Inferior esquerdo - roxo
  futsal: { row: 1, col: 1, color: "bg-red-500" },         // Inferior direito - vermelho
};

const sizes = {
  sm: "w-12 h-12",
  md: "w-20 h-20",
  lg: "w-28 h-28",
};

export function SportIcon({ sport, className, size = "md" }: SportIconProps) {
  const position = sportPositions[sport];
  
  // Calcula a posição do background para mostrar apenas o quadrante correto
  const bgPositionX = position.col === 0 ? "0%" : "100%";
  const bgPositionY = position.row === 0 ? "0%" : "100%";
  
  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden flex-shrink-0 shadow-lg",
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

/**
 * Versão com borda decorativa
 */
export function SportIconCircle({ sport, className, size = "md" }: SportIconProps) {
  return (
    <div className={cn("relative", sizes[size], className)}>
      <div className="absolute inset-0 rounded-full border-4 border-zinc-900 dark:border-zinc-100" />
      <div className="absolute inset-1 rounded-full overflow-hidden">
        <SportIcon sport={sport} className="w-full h-full rounded-full" size="lg" />
      </div>
    </div>
  );
}
