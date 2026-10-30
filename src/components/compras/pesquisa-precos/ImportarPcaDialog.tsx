/**
 * Itens do PCA trazidos para a pesquisa: os itens ativos do PCA com o mesmo nº SEI (o DFD), ou de outro nº digitado,
 * entram com o catálogo, a unidade e a quantidade do PCA e ficam ligados a ele (pca_item_id). A estimativa preliminar
 * do DFD aparece no item ao lado do valor estimado pela pesquisa. A leitura segue a RLS do PCA.
 */

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { precoBR, quantidadeBR } from "@/lib/compras/relatorioPesquisaPrecos";
import { useItensPcaDoSei, type ItemPcaResumo, type PesquisaPrecosItemInput } from "@/hooks/usePesquisaPrecos";

interface ImportarPcaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  numeroSei: string;
  proximoNumero: number;
  /** Itens do PCA que já estão na pesquisa. */
  jaNaPesquisa: Set<string>;
  salvando?: boolean;
  onSalvar: (itens: PesquisaPrecosItemInput[]) => Promise<unknown>;
}

/** Catálogo do item do PCA no formato do item da pesquisa (item exato do CATMAT, tipo de material ou serviço). */
function catalogoDoPca(i: ItemPcaResumo): Pick<PesquisaPrecosItemInput, "catalogo_campo" | "codigo_catalogo"> {
  if (i.tipo === "servico") return { catalogo_campo: i.codigo_servico ? "codigoItemCatalogo" : null, codigo_catalogo: i.codigo_servico };
  if (i.codigo_item) return { catalogo_campo: "codigoItemCatalogo", codigo_catalogo: i.codigo_item };
  return { catalogo_campo: i.codigo_pdm ? "codigoPdm" : null, codigo_catalogo: i.codigo_pdm };
}

export function ImportarPcaDialog({ open, onOpenChange, numeroSei, proximoNumero, jaNaPesquisa, salvando, onSalvar }: ImportarPcaDialogProps) {
  const [sei, setSei] = useState(numeroSei);
  const [seiAplicado, setSeiAplicado] = useState(numeroSei);
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const itens = useItensPcaDoSei(seiAplicado, open);

  useEffect(() => {
    if (!open) return;
    setSei(numeroSei);
    setSeiAplicado(numeroSei);
  }, [open, numeroSei]);

  const disponiveis = useMemo(() => (itens.data ?? []).filter((i) => !jaNaPesquisa.has(i.id)), [itens.data, jaNaPesquisa]);
  useEffect(() => setMarcados(new Set(disponiveis.map((i) => i.id))), [disponiveis]);

  const alternar = (id: string) => setMarcados((m) => {
    const n = new Set(m);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  const salvar = async () => {
    const escolhidos = disponiveis.filter((i) => marcados.has(i.id));
    try {
      await onSalvar(escolhidos.map((i, k) => ({
        numero: proximoNumero + k,
        tipo: i.tipo,
        ...catalogoDoPca(i),
        nome_catalogo: null,
        descricao: i.descricao,
        unidade: i.unidade_fornecimento,
        quantidade: Number(i.quantidade),
        pca_item_id: i.id,
      })));
      onOpenChange(false);
    } catch {
      // erro já exibido pelo toast da mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Trazer itens do PCA</DialogTitle>
          <DialogDescription>
            Os itens do PCA lançados a partir do DFD entram com o catálogo, a unidade e a quantidade, e o item mostra a estimativa
            preliminar do DFD ao lado do valor estimado pela pesquisa.
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); setSeiAplicado(sei.trim()); }}>
          <div className="space-y-1">
            <Label htmlFor="ip-sei">Processo SEI do DFD</Label>
            <Input id="ip-sei" className="w-64" value={sei} onChange={(e) => setSei(e.target.value)} />
          </div>
          <Button type="submit" variant="outline" disabled={!sei.trim()}>Procurar</Button>
        </form>
        {itens.isLoading ? <Skeleton className="h-24" />
          : itens.isError ? <p className="text-sm text-destructive">Não foi possível ler o PCA. É preciso a permissão de ver o PCA.</p>
          : !disponiveis.length ? (
            <p className="text-sm text-muted-foreground">
              {(itens.data ?? []).length ? "Os itens desse processo já estão na pesquisa." : "Nenhum item ativo do PCA com esse processo SEI."}
            </p>
          ) : (
            <div className="max-h-[50vh] overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr className="text-left">
                    <th className="p-2"><span className="sr-only">Marcar</span></th>
                    <th className="p-2">Descrição</th>
                    <th className="p-2">Unidade</th>
                    <th className="p-2 text-right">Qtd.</th>
                    <th className="p-2 text-right">Estimativa do DFD</th>
                  </tr>
                </thead>
                <tbody>
                  {disponiveis.map((i) => (
                    <tr key={i.id} className="border-t align-top">
                      <td className="p-2"><Checkbox aria-label={`Marcar ${i.descricao}`} checked={marcados.has(i.id)} onCheckedChange={() => alternar(i.id)} /></td>
                      <td className="p-2">{i.descricao}</td>
                      <td className="p-2">{i.unidade_fornecimento}</td>
                      <td className="p-2 text-right tabular-nums">{quantidadeBR(Number(i.quantidade))}</td>
                      <td className="p-2 text-right tabular-nums">{precoBR(Number(i.valor_unitario))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={salvar} disabled={!marcados.size || salvando}>Trazer {marcados.size || ""} item(ns)</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
