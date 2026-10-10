import { useId } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MESES } from "@/types/folha";

interface FiltroCompetenciaProps {
  ano: number;
  mes: number;
  onChange: (ano: number, mes: number) => void;
  /** Quantos anos para trás oferecer (padrão 5). */
  anosAtras?: number;
}

/** Competência (ano/mês) para os relatórios mensais, como o de frequência. */
export function FiltroCompetencia({ ano, mes, onChange, anosAtras = 5 }: FiltroCompetenciaProps) {
  const id = useId();
  const anoAtual = new Date().getFullYear();
  const anos = Array.from({ length: anosAtras }, (_, i) => anoAtual - i);
  if (!anos.includes(ano)) anos.push(ano);

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label htmlFor={`${id}-mes`}>Mês</Label>
        <Select value={String(mes)} onValueChange={(v) => onChange(ano, Number(v))}>
          <SelectTrigger id={`${id}-mes`}>
            <SelectValue placeholder="Mês" />
          </SelectTrigger>
          <SelectContent>
            {MESES.map((nome, i) => (
              <SelectItem key={nome} value={String(i + 1)}>
                {nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${id}-ano`}>Ano</Label>
        <Select value={String(ano)} onValueChange={(v) => onChange(Number(v), mes)}>
          <SelectTrigger id={`${id}-ano`}>
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            {anos.map((a) => (
              <SelectItem key={a} value={String(a)}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
