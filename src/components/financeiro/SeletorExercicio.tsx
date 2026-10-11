/**
 * Seletor do exercício do módulo Financeiro. O ano escolhido vai para a URL
 * (`?exercicio=`) e vale para todas as telas do módulo (useExercicioFinanceiro).
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useExercicioFinanceiro } from "@/hooks/useExercicioFinanceiro";
import { cn } from "@/lib/utils";

interface SeletorExercicioProps {
  className?: string;
}

export function SeletorExercicio({ className }: SeletorExercicioProps) {
  const { exercicio, setExercicio, exercicios } = useExercicioFinanceiro();

  return (
    <Select value={String(exercicio)} onValueChange={(v) => setExercicio(Number(v))}>
      <SelectTrigger className={cn("w-full sm:w-32", className)} aria-label="Exercício">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {exercicios.map((ano) => (
          <SelectItem key={ano} value={String(ano)}>
            {ano}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default SeletorExercicio;
