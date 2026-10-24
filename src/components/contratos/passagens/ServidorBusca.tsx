/**
 * Busca de servidor por nome ou matrícula (RPC passagem_buscar_servidores: só nome, matrícula e cargo).
 * Mostra o escolhido com um botão para trocar.
 */

import { useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBuscarServidores } from "@/hooks/usePassagens";
import type { ServidorParaPassagem } from "@/types/passagens";

interface Props {
  escolhido: { id: string; nome: string } | null;
  aoEscolher: (s: ServidorParaPassagem | null) => void;
  id?: string;
}

export function ServidorBusca({ escolhido, aoEscolher, id }: Props) {
  const [termo, setTermo] = useState("");
  const busca = useBuscarServidores(termo);

  if (escolhido) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm">
        <span className="font-medium">{escolhido.nome}</span>
        <Button type="button" variant="ghost" size="sm" onClick={() => aoEscolher(null)} aria-label="Trocar servidor">
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          id={id}
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Nome ou matrícula (3 letras ou mais)"
          className="pl-9"
          autoComplete="off"
        />
      </div>
      {busca.isFetching && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Buscando…
        </p>
      )}
      {busca.isError && <p className="text-sm text-destructive">Não foi possível buscar servidores.</p>}
      {busca.data && termo.trim().length >= 3 && (
        busca.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum servidor ativo encontrado.</p>
        ) : (
          <ul className="max-h-48 divide-y divide-border overflow-y-auto rounded-md border border-border" aria-label="Servidores encontrados">
            {busca.data.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                  onClick={() => {
                    aoEscolher(s);
                    setTermo("");
                  }}
                >
                  <span className="font-medium">{s.nome}</span>
                  <span className="block text-xs text-muted-foreground">
                    {[s.matricula && `Matrícula ${s.matricula}`, s.cargo].filter(Boolean).join(" · ") || "—"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}
