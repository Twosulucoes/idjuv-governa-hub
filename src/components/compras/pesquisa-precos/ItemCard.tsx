/**
 * Um item da pesquisa: os preços coletados com a fonte, a situação de cada um no saneamento (art. 2º, IX e X, do
 * Decreto 39.050-E/2025), a estatística, o método do art. 18 e as pendências. A coleta é um botão só, "Buscar preços"
 * (Compras.gov.br e PNCP pelo nome); "Adicionar outro preço" abre o edital do PNCP pelo link e o lançamento à mão
 * (incisos I a V). Quando o item veio do PCA, mostra a estimativa do DFD e leva o valor ao PCA; na adesão e na
 * prorrogação, compara o preço da ata ou do contrato com o estimado (Lei 14.133, art. 86, § 2º, II, e art. 107).
 */

import { useEffect, useState } from "react";
import { ArrowUpRight, ChevronDown, ExternalLink, Globe, MoreHorizontal, Pencil, PenLine, RotateCcw, Search, Trash2, XCircle } from "lucide-react";
import { StatusBadge } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { lerNumeroBr } from "@/lib/pca/numero";
import { compararComAta, METODO_LABEL, PARAMETROS, type MetodoPesquisa, type ParametroPesquisa } from "@/lib/compras/pesquisaPrecos";
import {
  catalogoDoItem, COMPARACAO_DA_FINALIDADE, dataBR, dataHoraConsulta, fonteDaAmostra, moedaBR, pctBR, precoBR, quantidadeBR,
  SITUACAO_RELATORIO_LABEL, type AmostraRelatorio, type ItemRelatorio,
} from "@/lib/compras/relatorioPesquisaPrecos";
import {
  useAlterarAmostra, useExcluirAmostra, useExcluirItemPesquisa, useIncluirAmostras, useLevarAoPca, useSalvarItemPesquisa,
  type ItemComAmostras, type ItemPcaResumo, type PesquisaPrecosItemInput,
} from "@/hooks/usePesquisaPrecos";
import { AmostraManualDialog } from "./AmostraManualDialog";
import { BuscarPrecosDialog } from "./BuscarPrecosDialog";
import { ImportarPncpDialog } from "./ImportarPncpDialog";
import { ORIGEM_LABEL, TOM_SITUACAO_AMOSTRA } from "./rotulos";

const SUGERIDO = "sugerido";

interface ItemCardProps {
  item: ItemComAmostras;
  relatorio: ItemRelatorio;
  pesquisaId: string;
  dataReferencia: string;
  finalidade: string;
  podeEditar: boolean;
  /** Item do PCA ligado (só chega para quem lê o PCA). */
  pca?: ItemPcaResumo;
  podeEditarPca: boolean;
  onEditar: () => void;
}

const paraTexto = (n: number | null | undefined) => (n == null ? "" : String(n).replace(".", ","));

export function ItemCard({ item, relatorio: r, pesquisaId, dataReferencia, finalidade, podeEditar, pca, podeEditarPca, onEditar }: ItemCardProps) {
  const incluir = useIncluirAmostras(item.id);
  const alterar = useAlterarAmostra();
  const excluirAmostra = useExcluirAmostra();
  const salvarItem = useSalvarItemPesquisa(pesquisaId);
  const excluirItem = useExcluirItemPesquisa();
  const levarAoPca = useLevarAoPca();

  const [dialogo, setDialogo] = useState<"compras" | "pncp" | "manual" | null>(null);
  const [desconsiderar, setDesconsiderar] = useState<AmostraRelatorio | null>(null);
  const [motivo, setMotivo] = useState("");
  const [apagarItem, setApagarItem] = useState(false);
  const [apagarAmostra, setApagarAmostra] = useState<AmostraRelatorio | null>(null);
  const [justificativa, setJustificativa] = useState(item.justificativa ?? "");
  const [precoAta, setPrecoAta] = useState(paraTexto(item.preco_comparado));

  useEffect(() => setJustificativa(item.justificativa ?? ""), [item.justificativa]);
  useEffect(() => setPrecoAta(paraTexto(item.preco_comparado)), [item.preco_comparado]);

  const a = r.analise;
  const sugerido = a.metodoSugerido;

  const salvarCom = (campos: Partial<PesquisaPrecosItemInput>) => salvarItem.mutateAsync({
    id: item.id, numero: item.numero, tipo: item.tipo, catalogo_campo: item.catalogo_campo, codigo_catalogo: item.codigo_catalogo,
    nome_catalogo: item.nome_catalogo, descricao: item.descricao, unidade: item.unidade, quantidade: item.quantidade,
    metodo: item.metodo, justificativa: item.justificativa, ...campos,
  });
  const salvarMetodo = (metodo: string | null, texto: string | null) =>
    salvarCom({ metodo, justificativa: texto?.trim() || null }).catch(() => undefined);

  const regra = COMPARACAO_DA_FINALIDADE[finalidade];
  const precoAtaNumero = lerNumeroBr(precoAta);
  const precoAtaValido = precoAta.trim() === "" || precoAtaNumero > 0;
  const pcaUnitario = pca ? Number(pca.valor_unitario) : null;
  const diferencaPca = pca ? compararComAta(pcaUnitario, r.valorUnitario) : null;

  const confirmarDesconsiderar = async () => {
    if (!desconsiderar || !motivo.trim()) return;
    try {
      await alterar.mutateAsync({ id: desconsiderar.id, considerada: false, motivo_desconsideracao: motivo.trim() });
      setDesconsiderar(null);
    } catch {
      // erro já exibido pelo toast da mutation
    }
  };

  const estatistica: [string, string][] = [
    ["Preços considerados", String(a.quantidade)],
    ["Média", a.media === null ? "—" : precoBR(a.media)],
    ["Limites (±30%)", a.limiteInferior === null || a.limiteSuperior === null ? "—" : `${precoBR(a.limiteInferior)} a ${precoBR(a.limiteSuperior)}`],
    ["Válidos", String(a.validos)],
    ["Média saneada", a.mediaSaneada === null ? "—" : precoBR(a.mediaSaneada)],
    ["Coeficiente de variação", a.coeficienteVariacao === null ? "—" : pctBR(a.coeficienteVariacao)],
    ["Mediana", a.mediana === null ? "—" : precoBR(a.mediana)],
    ["Menor preço", a.menor === null ? "—" : precoBR(a.menor)],
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">Item {item.numero} — {item.descricao}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {[catalogoDoItem(item) ?? "Sem código do catálogo", item.nome_catalogo, `${quantidadeBR(Number(item.quantidade))} ${item.unidade}`]
              .filter(Boolean).join(" · ")}
          </p>
        </div>
        {podeEditar && (
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            <Button size="sm" onClick={() => setDialogo("compras")}>
              <Search className="h-4 w-4" aria-hidden="true" />Buscar preços
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">Adicionar outro preço<ChevronDown className="h-4 w-4" aria-hidden="true" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setDialogo("pncp")}><Globe className="mr-2 h-4 w-4" aria-hidden="true" />Edital do PNCP pelo link</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setDialogo("manual")}>
                  <PenLine className="mr-2 h-4 w-4" aria-hidden="true" />Orçamento, site ou nota fiscal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" aria-label={`Mais ações do item ${item.numero}`}>
                  <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={onEditar}><Pencil className="mr-2 h-4 w-4" aria-hidden="true" />Editar item</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setApagarItem(true)} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />Apagar item
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {r.amostras.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum preço coletado ainda.</p>
        ) : (
          <div className="overflow-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr className="text-left">
                  <th className="p-2">Inc.</th>
                  <th className="p-2">Fonte</th>
                  <th className="p-2">Compra / documento</th>
                  <th className="p-2">Data</th>
                  <th className="p-2">Fornecedor</th>
                  <th className="p-2 text-right">Preço</th>
                  <th className="p-2">Situação</th>
                  {podeEditar && <th className="p-2"><span className="sr-only">Ações</span></th>}
                </tr>
              </thead>
              <tbody>
                {r.amostras.map((s) => (
                  <tr key={s.id} className={`border-t align-top ${s.considerada ? "" : "text-muted-foreground"}`}>
                    <td className="p-2" title={PARAMETROS[s.parametro as ParametroPesquisa]?.rotulo}>
                      {PARAMETROS[s.parametro as ParametroPesquisa]?.inciso ?? s.parametro}
                    </td>
                    <td className="p-2">
                      {fonteDaAmostra(s)}
                      <span className="block text-xs text-muted-foreground">
                        {ORIGEM_LABEL[s.origem] ?? s.origem} · consulta em {dataHoraConsulta(s.consultado_em)}
                      </span>
                    </td>
                    <td className="p-2">
                      {s.link ? (
                        <a href={s.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline">
                          {s.numero_compra ?? "abrir fonte"}<ExternalLink className="h-3 w-3" aria-hidden="true" />
                        </a>
                      ) : s.numero_compra ?? "—"}
                    </td>
                    <td className="p-2 whitespace-nowrap">{dataBR(s.data_referencia)}</td>
                    <td className="p-2">{s.fornecedor_nome ?? "—"}{s.marca && <span className="block text-xs text-muted-foreground">{s.marca}</span>}</td>
                    <td className="p-2 text-right tabular-nums">
                      {precoBR(Number(s.preco_unitario))}
                      {s.unidade && <span className="block text-xs text-muted-foreground">{s.unidade}</span>}
                    </td>
                    <td className="p-2">
                      <StatusBadge tom={TOM_SITUACAO_AMOSTRA[s.situacao]}>{SITUACAO_RELATORIO_LABEL[s.situacao]}</StatusBadge>
                      {!s.considerada && s.motivo_desconsideracao && <span className="block text-xs">{s.motivo_desconsideracao}</span>}
                      {s.aviso && <span className="block text-xs text-destructive">{s.aviso}</span>}
                    </td>
                    {podeEditar && (
                      <td className="p-2">
                        <div className="flex gap-1">
                          {s.considerada ? (
                            <Button size="icon" variant="ghost" aria-label="Desconsiderar preço" title="Desconsiderar"
                              onClick={() => { setMotivo(""); setDesconsiderar(s); }}>
                              <XCircle className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          ) : (
                            <Button size="icon" variant="ghost" aria-label="Voltar a considerar" title="Voltar a considerar"
                              onClick={() => alterar.mutate({ id: s.id, considerada: true, motivo_desconsideracao: null })}>
                              <RotateCcw className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" aria-label="Apagar preço" title="Apagar" onClick={() => setApagarAmostra(s)}>
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {estatistica.map(([rotulo, valor]) => (
            <div key={rotulo}>
              <dt className="text-muted-foreground">{rotulo}</dt>
              <dd className="font-medium tabular-nums">{valor}</dd>
            </div>
          ))}
        </dl>

        <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
          <div className="space-y-1">
            <Label htmlFor={`pp-metodo-${item.id}`}>Método (art. 18, § 1º, VII)</Label>
            <Select
              value={item.metodo ?? SUGERIDO}
              disabled={!podeEditar || salvarItem.isPending}
              onValueChange={(v) => salvarMetodo(v === SUGERIDO ? null : v, justificativa)}
            >
              <SelectTrigger id={`pp-metodo-${item.id}`}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={SUGERIDO}>Pelo coeficiente{sugerido ? ` (${METODO_LABEL[sugerido]})` : ""}</SelectItem>
                {(Object.keys(METODO_LABEL) as MetodoPesquisa[]).map((m) => <SelectItem key={m} value={m}>{METODO_LABEL[m]}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="pt-2 text-sm">
              <p className="text-muted-foreground">Valor unitário estimado</p>
              <p className="text-lg font-semibold tabular-nums">{r.valorUnitario === null ? "—" : precoBR(r.valorUnitario)}</p>
              <p className="text-muted-foreground">Total: <span className="font-medium text-foreground tabular-nums">{r.valorTotal === null ? "—" : moedaBR(r.valorTotal)}</span></p>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor={`pp-just-${item.id}`}>Justificativa (método diferente, menos de 3 preços, fontes sem os incisos I e II)</Label>
            <Textarea id={`pp-just-${item.id}`} rows={4} value={justificativa} disabled={!podeEditar}
              onChange={(e) => setJustificativa(e.target.value)} />
            {podeEditar && justificativa !== (item.justificativa ?? "") && (
              <Button size="sm" onClick={() => salvarMetodo(item.metodo, justificativa)} disabled={salvarItem.isPending}>Salvar justificativa</Button>
            )}
          </div>
        </div>

        {(pca || regra) && (
          <div className="grid gap-4 rounded-md border p-3 text-sm lg:grid-cols-2">
            {pca && (
              <div className="space-y-1">
                <p className="font-medium">PCA (estimativa preliminar do DFD, SEI {pca.numero_sei})</p>
                <p>
                  {precoBR(pcaUnitario!)} por {pca.unidade_fornecimento}
                  {diferencaPca && diferencaPca.situacao !== "igual" && (
                    <span className="text-muted-foreground"> · {pctBR(Math.abs(diferencaPca.diferenca))} {diferencaPca.situacao} do estimado na pesquisa</span>
                  )}
                  {diferencaPca?.situacao === "igual" && <span className="text-muted-foreground"> · igual ao estimado na pesquisa</span>}
                </p>
                {podeEditarPca && r.valorUnitario !== null && diferencaPca?.situacao !== "igual" && (
                  <Button size="sm" variant="outline" disabled={levarAoPca.isPending}
                    onClick={() => levarAoPca.mutate({ id: pca.id, valorUnitario: r.valorUnitario! })}>
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />Levar {precoBR(r.valorUnitario)} ao PCA
                  </Button>
                )}
              </div>
            )}
            {regra && (
              <div className="space-y-1">
                <Label htmlFor={`pp-ata-${item.id}`}>{regra.rotulo.charAt(0).toUpperCase() + regra.rotulo.slice(1)} (Lei 14.133, {regra.artigo})</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Input id={`pp-ata-${item.id}`} className="w-40" inputMode="decimal" placeholder="R$ por unidade" value={precoAta}
                    disabled={!podeEditar} onChange={(e) => setPrecoAta(e.target.value)} aria-invalid={!precoAtaValido} />
                  {podeEditar && precoAta !== paraTexto(item.preco_comparado) && (
                    <Button size="sm" disabled={!precoAtaValido || salvarItem.isPending}
                      onClick={() => salvarCom({ preco_comparado: precoAta.trim() === "" ? null : precoAtaNumero }).catch(() => undefined)}>
                      Salvar
                    </Button>
                  )}
                </div>
                {!precoAtaValido && <p className="text-destructive">Informe um valor maior que zero.</p>}
                {precoAtaValido && precoAta.trim() !== "" && precoAta !== paraTexto(item.preco_comparado) && (
                  <p className="text-muted-foreground">Será gravado como {precoBR(precoAtaNumero)} (use vírgula para os centavos).</p>
                )}
                {r.comparacao && (
                  <p className={r.comparacao.situacao === "acima" ? "font-medium text-destructive" : "font-medium"}>
                    {r.comparacao.situacao === "igual" ? "Igual ao valor estimado"
                      : `${pctBR(Math.abs(r.comparacao.diferenca))} ${r.comparacao.situacao} do valor estimado (${precoBR(r.valorUnitario!)})`}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {r.pendencias.length > 0 && (
          <ul className="list-disc space-y-1 rounded-md border border-destructive/40 p-3 pl-7 text-sm" aria-label={`Pendências do item ${item.numero}`}>
            {r.pendencias.map((p) => <li key={p}>{p}</li>)}
          </ul>
        )}
      </CardContent>

      {dialogo === "compras" && (
        <BuscarPrecosDialog open onOpenChange={(o) => !o && setDialogo(null)} item={item} dataReferencia={dataReferencia}
          incluindo={incluir.isPending} onIncluir={incluir.mutateAsync} onSalvarCatalogo={(c) => salvarCom(c)} />
      )}
      {dialogo === "pncp" && (
        <ImportarPncpDialog open onOpenChange={(o) => !o && setDialogo(null)} item={item} incluindo={incluir.isPending} onIncluir={incluir.mutateAsync} />
      )}
      <AmostraManualDialog open={dialogo === "manual"} onOpenChange={(o) => !o && setDialogo(null)} unidadeDoItem={item.unidade}
        incluindo={incluir.isPending} onIncluir={incluir.mutateAsync} />

      <Dialog open={!!desconsiderar} onOpenChange={(o) => !o && setDesconsiderar(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Desconsiderar preço</DialogTitle>
            <DialogDescription>
              {desconsiderar && `${precoBR(Number(desconsiderar.preco_unitario))} — ${fonteDaAmostra(desconsiderar)}. `}
              O preço sai do cálculo e o motivo vai para o relatório.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label htmlFor="pp-motivo">Motivo *</Label>
            <Textarea id="pp-motivo" rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: objeto diferente, unidade incompatível, quantidade muito distante" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDesconsiderar(null)}>Cancelar</Button>
            <Button onClick={confirmarDesconsiderar} disabled={!motivo.trim() || alterar.isPending}>Desconsiderar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={apagarItem} onOpenChange={setApagarItem}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar o item {item.numero}?</AlertDialogTitle>
            <AlertDialogDescription>Os {item.amostras.length} preço(s) coletado(s) para ele também saem da pesquisa.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => excluirItem.mutate(item.id)}>Apagar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!apagarAmostra} onOpenChange={(o) => !o && setApagarAmostra(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar este preço?</AlertDialogTitle>
            <AlertDialogDescription>
              Para tirar o preço do cálculo e manter o registro no relatório, use “Desconsiderar”.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => apagarAmostra && excluirAmostra.mutate(apagarAmostra.id)}>Apagar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
