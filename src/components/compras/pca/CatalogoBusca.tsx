/**
 * Busca no catálogo CATMAT/CATSER para o item do PCA: o tipo de material (PDM) ou o serviço vem da cópia local;
 * o item exato de material é buscado no portal na hora (opcional; com o portal fora do ar, salva só com o PDM).
 */

import { useState } from "react";
import { AlertTriangle, Check, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useBuscarCatalogo, useItensDoPdm, type PdmCatalogo, type ServicoCatalogo } from "@/hooks/usePca";

export interface EscolhaCatalogo {
  codigo: number;
  nome: string;
  grupo: string;
}

interface CatalogoBuscaProps {
  tipo: "material" | "servico";
  escolha: EscolhaCatalogo | null;
  aoEscolher: (e: EscolhaCatalogo | null) => void;
  codigoItem: number | null;
  aoEscolherItem: (codigoItem: number | null, descricao: string | null) => void;
  /** false = só o tipo de material (PDM), sem a escolha do item exato (ex.: classificar a reserva do processo). */
  comItemExato?: boolean;
}

const SEM_ITEM = "sem-item";

export function CatalogoBusca({ tipo, escolha, aoEscolher, codigoItem, aoEscolherItem, comItemExato = true }: CatalogoBuscaProps) {
  const [termo, setTermo] = useState("");
  const { data: resultados, isFetching, isError } = useBuscarCatalogo(termo, tipo);
  const itens = useItensDoPdm(tipo === "material" && comItemExato ? escolha?.codigo ?? null : null);

  const opcoes: EscolhaCatalogo[] = (resultados ?? []).map((r) =>
    tipo === "material"
      ? { codigo: (r as PdmCatalogo).codigo_pdm, nome: (r as PdmCatalogo).nome_pdm, grupo: (r as PdmCatalogo).nome_classe }
      : { codigo: (r as ServicoCatalogo).codigo_servico, nome: (r as ServicoCatalogo).nome_servico, grupo: (r as ServicoCatalogo).nome_classe ?? (r as ServicoCatalogo).nome_secao },
  );

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="pca-busca-catalogo">{tipo === "material" ? "Tipo de material (CATMAT) *" : "Serviço (CATSER) *"}</Label>
        {escolha ? (
          <div className="flex items-start justify-between gap-2 rounded-md border p-3 text-sm">
            <div>
              <p className="font-medium">{escolha.nome}</p>
              <p className="text-muted-foreground">{escolha.grupo} · código {escolha.codigo}</p>
            </div>
            <button
              type="button"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => { aoEscolher(null); aoEscolherItem(null, null); }}
            >
              Trocar
            </button>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="pca-busca-catalogo"
                className="pl-9"
                placeholder={tipo === "material" ? "Ex.: papel, cartucho, bola de futebol" : "Ex.: limpeza, manutenção de ar-condicionado"}
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                autoComplete="off"
              />
            </div>
            {termo.trim().length > 0 && termo.trim().length < 3 && (
              <p className="text-sm text-muted-foreground">Digite pelo menos 3 letras.</p>
            )}
            {isError && <p className="text-sm text-destructive">Não foi possível buscar no catálogo.</p>}
            {isFetching && <Skeleton className="h-20" />}
            {!isFetching && termo.trim().length >= 3 && opcoes.length === 0 && !isError && (
              <p className="text-sm text-muted-foreground">
                Nada encontrado. Tente outra palavra ou peça para atualizar o catálogo.
              </p>
            )}
            {opcoes.length > 0 && (
              <ul className="max-h-56 divide-y overflow-y-auto rounded-md border" aria-label="Resultados do catálogo">
                {opcoes.map((o) => (
                  <li key={o.codigo}>
                    <button
                      type="button"
                      className={cn("w-full px-3 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none")}
                      onClick={() => { aoEscolher(o); setTermo(""); }}
                    >
                      <span className="font-medium">{o.nome}</span>
                      <span className="block text-muted-foreground">{o.grupo} · {o.codigo}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {tipo === "material" && comItemExato && escolha && (
        <div className="space-y-2">
          <Label htmlFor="pca-item-catalogo">Item exato (opcional)</Label>
          {itens.isLoading ? (
            <Skeleton className="h-10" />
          ) : itens.isError ? (
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
              Não foi possível carregar os itens do portal; dá para salvar só com o tipo de material.
            </p>
          ) : (
            <Select
              value={codigoItem ? String(codigoItem) : SEM_ITEM}
              onValueChange={(v) => {
                if (v === SEM_ITEM) return aoEscolherItem(null, null);
                const it = itens.data?.find((i) => String(i.codigoItem) === v);
                aoEscolherItem(Number(v), it?.descricao ?? null);
              }}
            >
              <SelectTrigger id="pca-item-catalogo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-w-[min(90vw,40rem)]">
                <SelectItem value={SEM_ITEM}>Sem item exato (só o tipo de material)</SelectItem>
                {(itens.data ?? []).map((i) => (
                  <SelectItem key={i.codigoItem} value={String(i.codigoItem)}>
                    <span className="line-clamp-2">
                      {i.codigoItem} – {i.descricao}
                      {i.sustentavel && <Check className="ml-1 inline h-3 w-3" aria-label="sustentável" />}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}
    </div>
  );
}
