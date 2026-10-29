/**
 * Contratação similar no PNCP (art. 17, II, do Decreto 39.050-E/2025): a pessoa cola o link do edital ou o número
 * de controle, escolhe o item da compra e os preços homologados que entram, com órgão, UF, compra, processo e data.
 */

import { useEffect, useState } from "react";
import { AlertTriangle, ExternalLink, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lerReferenciaPncp, type ReferenciaPncp } from "@/lib/compras/pesquisaPrecos";
import { dataBR, precoBR, quantidadeBR } from "@/lib/compras/relatorioPesquisaPrecos";
import {
  amostraDoPreco, buscarCompraPncp, buscarResultadosPncp, type AmostraInput, type CompraPncp, type ItemComAmostras, type ItemPncp,
  type PrecoEncontrado,
} from "@/hooks/usePesquisaPrecos";

interface ImportarPncpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ItemComAmostras;
  incluindo?: boolean;
  onIncluir: (amostras: AmostraInput[]) => Promise<unknown>;
}

export function ImportarPncpDialog({ open, onOpenChange, item, incluindo, onIncluir }: ImportarPncpDialogProps) {
  const [texto, setTexto] = useState("");
  const [ref, setRef] = useState<ReferenciaPncp | null>(null);
  const [compra, setCompra] = useState<{ compra: CompraPncp; itens: ItemPncp[] } | null>(null);
  const [numeroItem, setNumeroItem] = useState<number | null>(null);
  const [precos, setPrecos] = useState<{ lista: PrecoEncontrado[]; em: string } | null>(null);
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTexto("");
    setRef(null);
    setCompra(null);
    setNumeroItem(null);
    setPrecos(null);
    setMarcados(new Set());
    setErro(null);
  }, [open]);

  const jaNoItem = new Set(item.amostras.map((a) => a.id_externo).filter(Boolean));

  const abrirCompra = async () => {
    const r = lerReferenciaPncp(texto);
    if (!r) {
      setErro("Cole o link do edital no PNCP (pncp.gov.br/app/editais/…) ou o número de controle (CNPJ-1-sequencial/ano).");
      return;
    }
    setCarregando(true);
    setErro(null);
    setCompra(null);
    setPrecos(null);
    setNumeroItem(null);
    try {
      setRef(r);
      setCompra(await buscarCompraPncp(r));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível abrir a compra no PNCP.");
    } finally {
      setCarregando(false);
    }
  };

  const abrirItem = async (n: number) => {
    if (!ref) return;
    setNumeroItem(n);
    setCarregando(true);
    setErro(null);
    setPrecos(null);
    setMarcados(new Set());
    try {
      const r = await buscarResultadosPncp(ref, n);
      setPrecos({ lista: r.precos, em: new Date().toISOString() });
      setMarcados(new Set(r.precos.filter((p) => !jaNoItem.has(p.idExterno)).map((p) => p.idExterno)));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível ler o resultado do item.");
    } finally {
      setCarregando(false);
    }
  };

  const incluir = async () => {
    if (!precos) return;
    try {
      await onIncluir(precos.lista.filter((p) => marcados.has(p.idExterno)).map((p) => amostraDoPreco(p, precos.em)));
      onOpenChange(false);
    } catch {
      // erro já exibido pelo toast da mutation
    }
  };

  const c = compra?.compra;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contratação similar no PNCP — item {item.numero}</DialogTitle>
          <DialogDescription>Preço homologado de outra contratação, dos 12 meses antes da data de referência (art. 17, II).</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[16rem] flex-1 space-y-1">
            <Label htmlFor="pncp-ref">Link ou número de controle no PNCP</Label>
            <Input id="pncp-ref" placeholder="https://pncp.gov.br/app/editais/00000000000000/2026/1" value={texto}
              onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") abrirCompra(); }} />
          </div>
          <Button onClick={abrirCompra} disabled={carregando || !texto.trim()}>
            {carregando && !compra ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}
            Abrir compra
          </Button>
        </div>

        {erro && <p className="flex items-start gap-2 text-sm text-destructive"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{erro}</p>}

        {c && (
          <div className="space-y-3 rounded-md border p-3 text-sm">
            <div>
              <p className="font-medium">{c.orgao ?? "Órgão não informado"}{c.uf ? ` (${c.uf})` : ""}</p>
              <p className="text-muted-foreground">
                {[c.modalidade, c.numeroCompra ? `nº ${c.numeroCompra}` : null, c.processo ? `processo ${c.processo}` : null].filter(Boolean).join(" · ")}
                {" · "}
                <a href={c.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline">
                  ver no PNCP<ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </p>
              {c.objeto && <p className="mt-1">{c.objeto}</p>}
            </div>
            {compra.itens.length === 0 ? (
              <p className="text-muted-foreground">A compra não tem itens publicados.</p>
            ) : (
              <div className="max-h-56 overflow-auto rounded-md border">
                <ul className="divide-y" aria-label="Itens da compra">
                  {compra.itens.map((i) => (
                    <li key={i.numeroItem}>
                      <button
                        type="button"
                        disabled={!i.temResultado || carregando}
                        onClick={() => abrirItem(i.numeroItem)}
                        className={`w-full px-3 py-2 text-left hover:bg-muted focus-visible:bg-muted focus-visible:outline-none disabled:opacity-60 ${numeroItem === i.numeroItem ? "bg-muted" : ""}`}
                      >
                        <span className="font-medium">Item {i.numeroItem}</span> — {i.descricao ?? "sem descrição"}
                        <span className="block text-muted-foreground">
                          {[i.unidade, i.quantidade !== null ? `qtd. ${quantidadeBR(i.quantidade)}` : null,
                            i.temResultado ? "com resultado" : "sem resultado"].filter(Boolean).join(" · ")}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {precos && (
          precos.lista.length === 0 ? (
            <p className="text-sm text-muted-foreground">O item não tem preço homologado válido.</p>
          ) : (
            <div className="overflow-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr className="text-left">
                    <th className="p-2"><span className="sr-only">Marcar</span></th>
                    <th className="p-2">Fornecedor</th>
                    <th className="p-2">Data</th>
                    <th className="p-2">Unid.</th>
                    <th className="p-2 text-right">Qtd.</th>
                    <th className="p-2 text-right">Preço homologado</th>
                  </tr>
                </thead>
                <tbody>
                  {precos.lista.map((p) => {
                    const ja = jaNoItem.has(p.idExterno);
                    return (
                      <tr key={p.idExterno} className="border-t">
                        <td className="p-2">
                          <Checkbox aria-label={`Marcar ${p.fornecedorNome ?? "preço"}`} disabled={ja} checked={ja || marcados.has(p.idExterno)}
                            onCheckedChange={(v) => setMarcados((m) => { const n = new Set(m); if (v) n.add(p.idExterno); else n.delete(p.idExterno); return n; })} />
                        </td>
                        <td className="p-2">{p.fornecedorNome ?? "—"}{ja && <span className="block text-muted-foreground">já no item</span>}</td>
                        <td className="p-2">{dataBR(p.dataReferencia)}</td>
                        <td className="p-2">{p.unidade ?? "—"}</td>
                        <td className="p-2 text-right tabular-nums">{p.quantidade === null ? "—" : quantidadeBR(p.quantidade)}</td>
                        <td className="p-2 text-right tabular-nums">{precoBR(p.precoUnitario)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button onClick={incluir} disabled={!marcados.size || incluindo}>Incluir {marcados.size || ""} preço(s)</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
