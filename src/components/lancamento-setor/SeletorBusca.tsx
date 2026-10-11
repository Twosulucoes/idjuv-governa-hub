/**
 * Campo de escolha com busca (combobox: Popover + Command do shadcn), para listas longas como servidores e unidades
 * da estrutura. Acessível pelo teclado; o botão anuncia o valor escolhido.
 */

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface OpcaoBusca {
  valor: string;
  rotulo: string;
  /** Texto secundário (matrícula, sigla). Também entra na busca. */
  detalhe?: string | null;
  desabilitada?: boolean;
}

interface SeletorBuscaProps {
  id?: string;
  opcoes: OpcaoBusca[];
  valor: string | null | undefined;
  aoEscolher: (valor: string) => void;
  placeholder?: string;
  placeholderBusca?: string;
  vazio?: string;
  carregando?: boolean;
  desabilitado?: boolean;
  invalido?: boolean;
  "aria-describedby"?: string;
}

export function SeletorBusca({
  id,
  opcoes,
  valor,
  aoEscolher,
  placeholder = "Selecione…",
  placeholderBusca = "Buscar…",
  vazio = "Nada encontrado.",
  carregando = false,
  desabilitado = false,
  invalido = false,
  "aria-describedby": descritoPor,
}: SeletorBuscaProps) {
  const [aberto, setAberto] = useState(false);
  const atual = opcoes.find((o) => o.valor === valor);

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={aberto}
          aria-invalid={invalido || undefined}
          aria-describedby={descritoPor}
          disabled={desabilitado}
          className={cn("w-full justify-between font-normal", !atual && "text-muted-foreground")}
        >
          <span className="truncate">
            {carregando ? "Carregando…" : atual ? `${atual.rotulo}${atual.detalhe ? ` (${atual.detalhe})` : ""}` : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[16rem] p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholderBusca} />
          <CommandList>
            <CommandEmpty>{vazio}</CommandEmpty>
            <CommandGroup>
              {opcoes.map((o) => (
                <CommandItem
                  key={o.valor}
                  value={`${o.rotulo} ${o.detalhe ?? ""} ${o.valor}`}
                  disabled={o.desabilitada}
                  onSelect={() => {
                    aoEscolher(o.valor);
                    setAberto(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", o.valor === valor ? "opacity-100" : "opacity-0")} aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block truncate">{o.rotulo}</span>
                    {o.detalhe && <span className="block truncate text-caption text-muted-foreground">{o.detalhe}</span>}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
