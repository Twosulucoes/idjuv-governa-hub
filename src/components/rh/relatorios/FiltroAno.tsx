import { useId } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FiltroAnoProps {
  ano: number;
  onChange: (ano: number) => void;
  /** Quantos anos para trás oferecer (padrão 5). */
  anosAtras?: number;
  label?: string;
}

/** Só o ano (exercício), para relatórios anuais como o resumo das folhas. */
export function FiltroAno({ ano, onChange, anosAtras = 5, label = "Ano" }: FiltroAnoProps) {
  const id = useId();
  const anoAtual = new Date().getFullYear();
  const anos = Array.from({ length: anosAtras }, (_, i) => anoAtual - i);
  if (!anos.includes(ano)) anos.push(ano);
  anos.sort((a, b) => b - a);

  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Select value={String(ano)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={label} />
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
  );
}
