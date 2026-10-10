import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { periodoValido } from "@/lib/relatoriosRHRegras";

interface FiltroPeriodoProps {
  inicio: string;
  fim: string;
  onChange: (inicio: string, fim: string) => void;
}

/** Período (data inicial e final) dos relatórios; avisa quando o intervalo é inválido. */
export function FiltroPeriodo({ inicio, fim, onChange }: FiltroPeriodoProps) {
  const id = useId();
  const preenchido = !!inicio && !!fim;
  const invalido = preenchido && !periodoValido(inicio, fim);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor={`${id}-inicio`}>Data inicial</Label>
          <Input
            id={`${id}-inicio`}
            type="date"
            value={inicio}
            onChange={(e) => onChange(e.target.value, fim)}
            aria-invalid={invalido || undefined}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${id}-fim`}>Data final</Label>
          <Input
            id={`${id}-fim`}
            type="date"
            value={fim}
            min={inicio || undefined}
            onChange={(e) => onChange(inicio, e.target.value)}
            aria-invalid={invalido || undefined}
          />
        </div>
      </div>
      {invalido && (
        <p className="text-xs text-destructive" role="alert">
          A data final deve ser igual ou posterior à inicial.
        </p>
      )}
    </div>
  );
}
