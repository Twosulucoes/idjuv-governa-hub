import { useId } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Valor reservado para "sem filtro" (o Radix Select não aceita string vazia). */
export const TODOS = "__todos__";

interface FiltroSelectProps {
  label: string;
  /** Valor atual; `undefined`/vazio = todos. */
  valor: string | undefined;
  /** Opções `valor → rótulo`, na ordem de exibição. */
  opcoes: Record<string, string> | Array<{ valor: string; rotulo: string }>;
  /** Recebe `undefined` quando o usuário escolhe "Todos". */
  onChange: (valor: string | undefined) => void;
  rotuloTodos?: string;
  carregando?: boolean;
}

/** Select de filtro opcional (status, ônus, unidade…) com a opção "Todos". */
export function FiltroSelect({ label, valor, opcoes, onChange, rotuloTodos = "Todos", carregando }: FiltroSelectProps) {
  const id = useId();
  const lista = Array.isArray(opcoes) ? opcoes : Object.entries(opcoes).map(([v, r]) => ({ valor: v, rotulo: r }));

  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Select value={valor || TODOS} onValueChange={(v) => onChange(v === TODOS ? undefined : v)} disabled={carregando}>
        <SelectTrigger id={id}>
          <SelectValue placeholder={rotuloTodos} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>{rotuloTodos}</SelectItem>
          {lista.map((o) => (
            <SelectItem key={o.valor} value={o.valor}>
              {o.rotulo}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
