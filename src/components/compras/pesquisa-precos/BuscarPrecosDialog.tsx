/**
 * Busca de preços pelo nome do produto, num passo só: o sistema sugere o código do catálogo pelo nome (cópia local do
 * CATMAT/CATSER) e busca, ao mesmo tempo, os preços praticados no Compras.gov.br por esse código (art. 17, I, do
 * Decreto 39.050-E/2025) e os resultados homologados do PNCP pelo nome (art. 17, II), nos 12 meses antes da data de
 * referência. Tudo numa lista; os mais recentes da mesma unidade com as palavras buscadas já vêm marcados, e quem
 * pesquisa desmarca o que não for o mesmo produto. Cada preço entra com a fonte e a data e hora desta consulta.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ExternalLink, Loader2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { mesmaUnidade, palavrasDaBusca, preMarcar, somarMeses, LIMITE_PRE_MARCADOS } from "@/lib/compras/pesquisaPrecos";
import { catalogoDoItem, dataBR, precoBR, quantidadeBR } from "@/lib/compras/relatorioPesquisaPrecos";
import {
  amostraDoPreco, buscarPrecosComprasGov, buscarPrecosPncp, MAX_PAGINAS_COMPRAS, useSugestaoCatalogo, type AmostraInput,
  type ItemComAmostras, type PesquisaPrecosItemInput, type PrecoEncontrado,
} from "@/hooks/usePesquisaPrecos";
import { ORIGEM_LABEL } from "./rotulos";

const LIMITE_LISTA = 500;
const ATUAL = "atual";
const SEM_CODIGO = "sem-codigo";

type Catalogo = Pick<PesquisaPrecosItemInput, "catalogo_campo" | "codigo_catalogo" | "nome_catalogo">;

interface Resultado {
  precos: PrecoEncontrado[];
  em: string;
  avisos: string[];
}

interface BuscarPrecosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ItemComAmostras;
  dataReferencia: string;
  incluindo?: boolean;
  onIncluir: (amostras: AmostraInput[]) => Promise<unknown>;
  /** Grava no item o código do catálogo escolhido aqui (quando muda). */
  onSalvarCatalogo: (catalogo: Catalogo) => Promise<unknown>;
}

export function BuscarPrecosDialog({ open, onOpenChange, item, dataReferencia, incluindo, onIncluir, onSalvarCatalogo }: BuscarPrecosDialogProps) {
  const tipo = item.tipo as "material" | "servico";
  const inicio = somarMeses(dataReferencia, -12);
  const fim = dataReferencia;
  const [termo, setTermo] = useState("");
  const [termoAplicado, setTermoAplicado] = useState("");
  const [escolhaCatalogo, setEscolhaCatalogo] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [progresso, setProgresso] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [preMarcados, setPreMarcados] = useState(0);
  const [soMesmaUnidade, setSoMesmaUnidade] = useState(true);
  const [uf, setUf] = useState("");
  const buscouAoAbrir = useRef(false);

  useEffect(() => {
    if (!open) return;
    const inicial = palavrasDaBusca(item.descricao).join(" ") || palavrasDaBusca(item.nome_catalogo).join(" ");
    setTermo(inicial);
    setTermoAplicado(inicial);
    setEscolhaCatalogo(item.codigo_catalogo ? ATUAL : null);
    setResultado(null);
    setMarcados(new Set());
    setSoMesmaUnidade(true);
    setUf("");
    buscouAoAbrir.current = false;
    // só ao abrir: gravar o código no item (ao usar os preços) não pode reiniciar a busca
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const sugestao = useSugestaoCatalogo(open ? termoAplicado : "", tipo);
  const opcoes = sugestao.data?.opcoes ?? [];
  // sem código no item, fica com a primeira sugestão do catálogo; a pessoa pode trocar
  const valorCatalogo = escolhaCatalogo ?? (opcoes[0] ? `s${opcoes[0].codigo}` : SEM_CODIGO);
  const catalogo: Catalogo = useMemo(() => {
    if (valorCatalogo === ATUAL) {
      return { catalogo_campo: item.catalogo_campo, codigo_catalogo: item.codigo_catalogo, nome_catalogo: item.nome_catalogo };
    }
    const op = opcoes.find((o) => `s${o.codigo}` === valorCatalogo);
    if (!op) return { catalogo_campo: null, codigo_catalogo: null, nome_catalogo: null };
    return { catalogo_campo: tipo === "material" ? "codigoPdm" : "codigoItemCatalogo", codigo_catalogo: op.codigo, nome_catalogo: op.nome };
  }, [valorCatalogo, opcoes, item.catalogo_campo, item.codigo_catalogo, item.nome_catalogo, tipo]);

  const jaNoItem = useMemo(() => new Set(item.amostras.map((a) => a.id_externo).filter((x): x is string => !!x)), [item.amostras]);

  const buscar = async (cat: Catalogo, nome: string) => {
    setBuscando(true);
    setResultado(null);
    setMarcados(new Set());
    const avisos: string[] = [];
    const compras = cat.codigo_catalogo && cat.catalogo_campo
      ? buscarPrecosComprasGov(
        { tipo, campo: cat.catalogo_campo as "codigoItemCatalogo" | "codigoPdm", codigo: cat.codigo_catalogo, dataInicio: inicio, dataFim: fim },
        (pagina, total) => setProgresso(`Compras.gov.br: página ${pagina} de ${total}`),
      )
      : Promise.resolve(null);
    const pncp = palavrasDaBusca(nome).length ? buscarPrecosPncp(nome, inicio, fim) : Promise.resolve(null);
    const [rc, rp] = await Promise.allSettled([compras, pncp]);
    const precos: PrecoEncontrado[] = [];
    if (rc.status === "fulfilled" && rc.value) {
      precos.push(...rc.value.precos);
      if (rc.value.cortado) avisos.push(`O Compras.gov.br trouxe só as ${MAX_PAGINAS_COMPRAS} primeiras páginas: escolha um código mais específico.`);
    } else if (rc.status === "rejected") {
      avisos.push(`Compras.gov.br: ${rc.reason instanceof Error ? rc.reason.message : "não respondeu."}`);
    } else {
      avisos.push("Sem código do catálogo: a busca no Compras.gov.br ficou de fora.");
    }
    if (rp.status === "fulfilled" && rp.value) {
      precos.push(...rp.value.precos);
      if (rp.value.comprasComFalha) avisos.push(`PNCP: ${rp.value.comprasComFalha} compra(s) não responderam e ficaram de fora.`);
    } else if (rp.status === "rejected") {
      avisos.push(`PNCP: ${rp.reason instanceof Error ? rp.reason.message : "não respondeu."}`);
    }
    setResultado({ precos, em: new Date().toISOString(), avisos });
    const marcadosDeInicio = preMarcar(precos, { unidade: item.unidade, palavras: palavrasDaBusca(nome), jaNoItem });
    setMarcados(marcadosDeInicio);
    setPreMarcados(marcadosDeInicio.size);
    setBuscando(false);
    setProgresso(null);
  };

  // abre já buscando: com o código do item, ou com a primeira sugestão do catálogo assim que ela chegar
  useEffect(() => {
    if (!open || buscouAoAbrir.current || !termoAplicado) return;
    if (!item.codigo_catalogo && sugestao.isLoading) return;
    buscouAoAbrir.current = true;
    void buscar(catalogo, termoAplicado);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, termoAplicado, sugestao.isLoading, item.codigo_catalogo]);

  const novaBusca = () => {
    const t = termo.trim();
    if (t === termoAplicado) {
      void buscar(catalogo, t);
      return;
    }
    // termo novo: nova sugestão do catálogo, e busca quando ela chegar (o código do item continua se já havia)
    setEscolhaCatalogo(item.codigo_catalogo ? ATUAL : null);
    setTermoAplicado(t);
    buscouAoAbrir.current = false;
  };

  const temMesmaUnidade = useMemo(() => (resultado?.precos ?? []).some((p) => mesmaUnidade(item.unidade, p.unidade)), [resultado, item.unidade]);
  const filtrados = useMemo(() => (resultado?.precos ?? [])
    .filter((p) => !soMesmaUnidade || !temMesmaUnidade || mesmaUnidade(item.unidade, p.unidade))
    .filter((p) => !uf.trim() || p.uf === uf.trim().toUpperCase())
    .sort((a, b) => (b.dataReferencia ?? "").localeCompare(a.dataReferencia ?? "")), [resultado, soMesmaUnidade, temMesmaUnidade, uf, item.unidade]);
  const visiveis = filtrados.slice(0, LIMITE_LISTA);
  const marcaveis = visiveis.filter((p) => !jaNoItem.has(p.idExterno));
  const todosMarcados = marcaveis.length > 0 && marcaveis.every((p) => marcados.has(p.idExterno));

  const alternar = (id: string) => setMarcados((m) => {
    const n = new Set(m);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  const usar = async () => {
    if (!resultado) return;
    const escolhidos = resultado.precos.filter((p) => marcados.has(p.idExterno));
    try {
      if (catalogo.codigo_catalogo && catalogo.codigo_catalogo !== item.codigo_catalogo) await onSalvarCatalogo(catalogo);
      await onIncluir(escolhidos.map((p) => amostraDoPreco(p, resultado.em)));
      onOpenChange(false);
    } catch {
      // erro já exibido pelo toast da mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Buscar preços — item {item.numero}</DialogTitle>
          <DialogDescription>
            Compras.gov.br (art. 17, I) e contratações similares do PNCP (art. 17, II) de {dataBR(inicio)} a {dataBR(fim)}, os 12 meses
            antes da data de referência.
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => { e.preventDefault(); novaBusca(); }}>
          <div className="min-w-[16rem] flex-1 space-y-1">
            <Label htmlFor="bp-termo">Nome do produto</Label>
            <Input id="bp-termo" value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Ex.: bola futebol campo" autoComplete="off" />
          </div>
          <Button type="submit" disabled={buscando || palavrasDaBusca(termo).length === 0}>
            {buscando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}
            Buscar de novo
          </Button>
        </form>

        <div className="space-y-1">
          <Label htmlFor="bp-catalogo">Código do catálogo (para o Compras.gov.br)</Label>
          <Select
            value={valorCatalogo}
            onValueChange={(v) => { setEscolhaCatalogo(v); }}
            disabled={buscando}
          >
            <SelectTrigger id="bp-catalogo"><SelectValue /></SelectTrigger>
            <SelectContent>
              {item.codigo_catalogo && (
                <SelectItem value={ATUAL}>{catalogoDoItem(item)}{item.nome_catalogo ? ` · ${item.nome_catalogo}` : ""} (do item)</SelectItem>
              )}
              {opcoes.map((o) => (
                <SelectItem key={o.codigo} value={`s${o.codigo}`}>
                  {tipo === "material" ? "CATMAT (tipo de material)" : "CATSER"} {o.codigo} · {o.nome} ({o.grupo})
                </SelectItem>
              ))}
              <SelectItem value={SEM_CODIGO}>Sem código (só o PNCP)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {sugestao.isLoading ? "Procurando o código pelo nome…"
              : sugestao.isError ? "Não foi possível consultar o catálogo."
              : !item.codigo_catalogo && !opcoes.length ? "Nenhum código achado pelo nome: tente outras palavras."
              : "Trocou o código? Clique em Buscar de novo."}
          </p>
        </div>

        {progresso && <p className="text-sm text-muted-foreground" aria-live="polite">{progresso}</p>}
        {buscando && !progresso && <p className="text-sm text-muted-foreground" aria-live="polite">Buscando nas duas fontes…</p>}

        {resultado && (
          <div className="space-y-3">
            {resultado.avisos.map((a) => (
              <p key={a} className="flex items-start gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{a}
              </p>
            ))}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {temMesmaUnidade && (
                <div className="flex items-center gap-2">
                  <Switch id="bp-unidade" checked={soMesmaUnidade} onCheckedChange={setSoMesmaUnidade} />
                  <Label htmlFor="bp-unidade">Só a unidade do item ({item.unidade})</Label>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Label htmlFor="bp-uf">UF</Label>
                <Input id="bp-uf" className="w-20" maxLength={2} placeholder="todas" value={uf} onChange={(e) => setUf(e.target.value.replace(/[^a-zA-Z]/g, ""))} />
              </div>
              <p className="text-sm text-muted-foreground">
                {resultado.precos.length} preço(s) encontrado(s); {filtrados.length} no filtro
                {filtrados.length > LIMITE_LISTA ? ` (mostrando os ${LIMITE_LISTA} mais recentes)` : ""}.
              </p>
            </div>
            {preMarcados > 0 && (
              <p className="text-sm">
                Vieram marcados os {preMarcados} mais recentes (até {LIMITE_PRE_MARCADOS}) da mesma unidade e com as palavras buscadas.
                Desmarque o que não for o mesmo produto.
              </p>
            )}
            {filtrados.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum preço no período e no filtro. Tente outras palavras ou outro código.</p>
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
                      <th className="p-2">Fonte</th>
                      <th className="p-2">Órgão (UF)</th>
                      <th className="p-2">Compra e descrição</th>
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
                          <td className="p-2"><Badge variant="outline">{ORIGEM_LABEL[p.origem]}</Badge></td>
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
          <Button onClick={usar} disabled={!marcados.size || incluindo || buscando}>Usar {marcados.size || ""} preço(s)</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
