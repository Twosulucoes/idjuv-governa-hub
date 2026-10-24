/**
 * Escolha de beneficiário ativo por nome ou CPF (filtro local da lista), com atalho para cadastrar um novo.
 */

import { useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mascararCpf, somenteDigitos } from "@/lib/passagens/regras";
import { useBeneficiarios } from "@/hooks/usePassagens";
import { BeneficiarioFormDialog } from "./BeneficiarioFormDialog";

interface Props {
  escolhido: { id: string; nome: string } | null;
  aoEscolher: (b: { id: string; nome: string } | null) => void;
  podeCadastrar?: boolean;
  id?: string;
}

const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function BeneficiarioBusca({ escolhido, aoEscolher, podeCadastrar, id }: Props) {
  const [termo, setTermo] = useState("");
  const [novo, setNovo] = useState(false);
  const lista = useBeneficiarios();

  const achados = useMemo(() => {
    const t = termo.trim();
    if (t.length < 2) return [];
    const dig = somenteDigitos(t);
    return (lista.data ?? [])
      .filter((b) => b.ativo && (semAcento(b.nome).includes(semAcento(t)) || (dig.length >= 3 && b.cpf.includes(dig))))
      .slice(0, 20);
  }, [lista.data, termo]);

  if (escolhido) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm">
        <span className="font-medium">{escolhido.nome}</span>
        <Button type="button" variant="ghost" size="sm" onClick={() => aoEscolher(null)} aria-label="Trocar beneficiário">
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input id={id} value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Nome ou CPF" className="pl-9" autoComplete="off" />
        </div>
        {podeCadastrar && (
          <Button type="button" variant="outline" onClick={() => setNovo(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Novo
          </Button>
        )}
      </div>
      {lista.isError && <p className="text-sm text-destructive">Não foi possível carregar os beneficiários.</p>}
      {termo.trim().length >= 2 && !lista.isLoading && (
        achados.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ninguém encontrado. {podeCadastrar && "Use “Novo” para cadastrar."}</p>
        ) : (
          <ul className="max-h-48 divide-y divide-border overflow-y-auto rounded-md border border-border" aria-label="Beneficiários encontrados">
            {achados.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                  onClick={() => {
                    aoEscolher({ id: b.id, nome: b.nome });
                    setTermo("");
                  }}
                >
                  <span className="font-medium">{b.nome}</span>
                  <span className="block text-xs text-muted-foreground">
                    CPF {mascararCpf(b.cpf)}{b.instituicao_nome ? ` · ${b.instituicao_nome}` : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )
      )}
      <BeneficiarioFormDialog open={novo} onOpenChange={setNovo} aoSalvar={(b) => aoEscolher({ id: b.id, nome: b.nome })} />
    </div>
  );
}
