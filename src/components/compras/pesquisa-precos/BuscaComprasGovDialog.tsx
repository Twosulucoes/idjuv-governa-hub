/**
 * Busca de preços praticados no Compras.gov.br (art. 17, I, do Decreto 39.050-E/2025) pelo código do catálogo do
 * item, no período dos 12 meses antes da data de referência. A pessoa filtra por UF e unidade, marca os preços que
 * servem (mesmo objeto, mesma unidade) e inclui; cada um entra com a fonte e a data e hora desta consulta.
 */

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ExternalLink, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { somarMeses } from "@/lib/compras/pesquisaPrecos";
import { catalogoDoItem, dataBR, precoBR, quantidadeBR } from "@/lib/compras/relatorioPesquisaPrecos";
import {
  amostraDoPreco, buscarPrecosComprasGov, MAX_PAGINAS_COMPRAS, type AmostraInput, type ItemComAmostras, type PrecoEncontrado,
} from "@/hooks/usePesquisaPrecos";

const TODAS = "todas";
const LIMITE_LISTA = 500;

interface BuscaComprasGovDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ItemComAmostras;
  dataReferencia: string;
  incluindo?: boolean;
  onIncluir: (amostras: AmostraInput[]) => Promise<unknown>;
}

export function BuscaComprasGovDialog({ open, onOpenChange, item, dataReferencia, incluindo, onIncluir }: BuscaComprasGovDialogProps) {
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [uf, setUf] = useState("");
  const [unidade, setUnidade] = useState(TODAS);
  const [buscando, setBuscando] = useState(false);
  const [progresso, setProgresso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ precos: PrecoEncontrado[]; totalRegistros: number; cortado: boolean; em: string } | null>(null);
  const [marcados, setMarcados] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    setInicio(somarMeses(dataReferencia, -12));
    setFim(dataReferencia);
    setUf("");
    setUnidade(TODAS);
    setErro(null);
    setResultado(null);
    setMarcados(new Set());
  }, [open, dataReferencia]);

  const jaNoItem = useMemo(() => new Set(item.amostras.map((a) => a.id_externo).filter(Boolean)), [item.amostras]);
  const unidades = useMemo(() => [...new Set((resultado?.precos ?? []).map((p) => p.unidade ?? "—"))].sort(), [resultado]);
  const filtrados = useMemo(() => (resultado?.precos ?? [])
    .filter((p) => !uf.trim() || p.uf === uf.trim().toUpperCase())
    .filter((p) => unidade === TODAS || (p.unidade ?? "—") === unidade)
    .sort((a, b) => (b.dataReferencia ?? "").localeCompare(a.dataReferencia ?? "")), [resultado, uf, unidade]);
  const visiveis = filtrados.slice(0, LIMITE_LISTA);

  const buscar = async () => {
    if (!item.codigo_catalogo || !item.catalogo_campo) return;
    setBuscando(true);
    setErro(null);
    setMarcados(new Set());
    try {
      const r = await buscarPrecosComprasGov(
        { tipo: item.tipo as "material" | "servico", campo: item.catalogo_campo as "codigoItemCatalogo" | "codigoPdm", codigo: item.codigo_catalogo, dataInicio: inicio, dataFim: fim },
        (pagina, total) => setProgresso(`Página ${pagina} de ${total}`),
      );
      setResultado({ ...r, em: new Date().toISOString() });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível buscar os preços.");
    } finally {
      setBuscando(false);
      setProgresso(null);
    }
  };

  const alternar = (id: string) => setMarcados((m) => {
    const n = new Set(m);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });
  const marcaveis = visiveis.filter((p) => !jaNoItem.has(p.idExterno));
  const todosMarcados = marcaveis.length > 0 && marcaveis.every((p) => marcados.has(p.idExterno));

  const incluir = async () => {
    if (!resultado) return;
    const escolhidos = resultado.precos.filter((p) => marcados.has(p.idExterno));
    try {
      await onIncluir(escolhidos.map((p) => amostraDoPreco(p, resultado.em)));
      onOpenChange(false);
    } catch {
      // erro já exibido pelo toast da mutation
    }
  };

  const semCatalogo = !item.codigo_catalogo || !item.catalogo_campo;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preços do Compras.gov.br — item {item.numero}</DialogTitle>
          <DialogDescription>
            {semCatalogo
              ? "O item não tem código do catálogo. Edite o item e escolha o material ou o serviço."
              : `${catalogoDoItem(item)}${item.nome_catalogo ? ` · ${item.nome_catalogo}` : ""}. Sistema oficial do art. 17, I, do Decreto 39.050-E/2025.`}
          </DialogDescription>
        </DialogHeader>

        {!semCatalogo && (
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="cg-inicio">De</Label>
              <Input id="cg-inicio" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cg-fim">Até</Label>
              <Input id="cg-fim" type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
            </div>
            <Button onClick={buscar} disabled={buscando || !inicio || !fim || inicio > fim}>
              {buscando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}
              Buscar
            </Button>
            {progresso && <span className="text-sm text-muted-foreground" aria-live="polite">{progresso}</span>}
          </div>
        )}

        {erro && <p className="flex items-start gap-2 text-sm text-destructive"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{erro}</p>}

        {resultado && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label htmlFor="cg-uf">UF</Label>
                <Input id="cg-uf" className="w-20" maxLength={2} placeholder="todas" value={uf} onChange={(e) => setUf(e.target.value.replace(/[^a-zA-Z]/g, ""))} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cg-unidade">Unidade</Label>
                <Select value={unidade} onValueChange={setUnidade}>
                  <SelectTrigger id="cg-unidade" className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TODAS}>Todas</SelectItem>
                    {unidades.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground">
                {resultado.precos.length} preço(s) recebido(s){resultado.totalRegistros > resultado.precos.length ? ` de ${resultado.totalRegistros}` : ""};
                {" "}{filtrados.length} no filtro{filtrados.length > LIMITE_LISTA ? ` (mostrando os ${LIMITE_LISTA} mais recentes)` : ""}.
              </p>
            </div>
            {resultado.cortado && (
              <p className="text-sm text-muted-foreground">
                A busca trouxe só as {MAX_PAGINAS_COMPRAS} primeiras páginas. Diminua o período ou use o item exato do CATMAT.
              </p>
            )}
            {filtrados.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum preço no período e no filtro.</p>
            ) : (
              <div className="max-h-[50vh] overflow-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted">
                    <tr className="text-left">
                      <th className="p-2">
                        <Checkbox
                          aria-label="Marcar todos"
                          checked={todosMarcados}
                          onCheckedChange={(v) => setMarcados(v ? new Set(marcaveis.map((p) => p.idExterno)) : new Set())}
                        />
                      </th>
                      <th className="p-2">Órgão (UF)</th>
                      <th className="p-2">Compra</th>
                      <th className="p-2">Data</th>
                      <th className="p-2">Fornecedor</th>
                      <th className="p-2">Unid.</th>
                      <th className="p-2 text-right">Qtd.</th>
                      <th className="p-2 text-right">Preço</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visiveis.map((p) => {
                      const ja = jaNoItem.has(p.idExterno);
                      return (
                        <tr key={p.idExterno} className="border-t align-top">
                          <td className="p-2">
                            <Checkbox aria-label={`Marcar ${p.orgao ?? "preço"}`} disabled={ja} checked={ja || marcados.has(p.idExterno)} onCheckedChange={() => alternar(p.idExterno)} />
                          </td>
                          <td className="p-2">{p.orgao ?? "—"}{p.uf ? ` (${p.uf})` : ""}{ja && <span className="block text-muted-foreground">já no item</span>}</td>
                          <td className="p-2">
                            {p.link ? (
                              <a href={p.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline">
                                {p.numeroCompra}<ExternalLink className="h-3 w-3" aria-hidden="true" />
                              </a>
                            ) : p.numeroCompra}
                            {p.descricao && <span className="block text-muted-foreground line-clamp-2">{p.descricao}</span>}
                          </td>
                          <td className="p-2 whitespace-nowrap">{dataBR(p.dataReferencia)}</td>
                          <td className="p-2">{p.fornecedorNome ?? "—"}{p.marca && <span className="block text-muted-foreground">{p.marca}</span>}</td>
                          <td className="p-2">{p.unidade ?? "—"}</td>
                          <td className="p-2 text-right tabular-nums">{p.quantidade === null ? "—" : quantidadeBR(p.quantidade)}</td>
                          <td className="p-2 text-right tabular-nums">{precoBR(p.precoUnitario)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button onClick={incluir} disabled={!marcados.size || incluindo}>Incluir {marcados.size || ""} preço(s)</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
