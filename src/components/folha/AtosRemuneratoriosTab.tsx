import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, CheckCircle2, Edit2, Loader2, Percent, Plus, Scale, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useRubricas } from "@/hooks/useFolhaPagamento";
import {
  useAdicionarItensAto,
  useAplicarAto,
  useAtosRemuneratorios,
  useCargosParaReajuste,
  useExcluirAto,
  useRemoverItemAto,
  useUltimaFolhaFechada,
  type AtoRemuneratorio,
  type ItemAtoRemuneratorio,
} from "@/hooks/useAtosRemuneratorios";
import { AtoRemuneratorioForm } from "./AtoRemuneratorioForm";
import {
  avisosVigencia,
  identificacaoAto,
  itensPorPercentual,
  ROTULO_ALVO,
  type AlvoItemAto,
} from "@/lib/atosRemuneratorios";
import { definicaoParametro, formatarValorParametro, PARAMETROS_FOLHA } from "@/lib/parametrosFolha";
import { formatCurrency } from "@/lib/formatters";

/** Data pura (AAAA-MM-DD) lida como local, para não aparecer um dia antes em Roraima. */
const dataBr = (v: string | null | undefined) => (v ? format(parseISO(String(v).slice(0, 10)), "dd/MM/yyyy") : "-");

const numero = (v: string) => Number(v.replace(/\./g, "").replace(",", "."));

function nomeAlvo(i: ItemAtoRemuneratorio): string {
  if (i.alvo === "cargo") return i.cargo ? `${i.cargo.sigla ? `${i.cargo.sigla} · ` : ""}${i.cargo.nome}` : "Cargo";
  if (i.alvo === "rubrica") return i.rubrica ? `${i.rubrica.codigo} · ${i.rubrica.descricao}` : "Rubrica";
  return definicaoParametro(i.tipo_parametro ?? "")?.descricao ?? i.tipo_parametro ?? "Parâmetro";
}

function valorFmt(i: Pick<ItemAtoRemuneratorio, "alvo" | "tipo_parametro">, v: number | null | undefined): string {
  if (v == null) return "-";
  return i.alvo === "parametro" ? formatarValorParametro(i.tipo_parametro ?? "", v) : formatCurrency(v);
}

/** Valor de hoje do alvo (o anterior gravado pelo banco só existe depois de aplicar). */
function valorAtual(i: ItemAtoRemuneratorio): number | null {
  if (i.alvo === "cargo") return i.cargo?.vencimento_base ?? null;
  if (i.alvo === "rubrica") return i.rubrica?.formula_valor ?? null;
  return null;
}

export function AtosRemuneratoriosTab() {
  const { hasPermission } = useAuth();
  const podeConfigurar = hasPermission("financeiro.folha.configurar");
  const { data: atos, isLoading } = useAtosRemuneratorios();
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<AtoRemuneratorio | null>(null);
  const [abertoId, setAbertoId] = useState<string | null>(null);
  const aberto = atos?.find((a) => a.id === abertoId) ?? null;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Atos e reajustes</CardTitle>
            <CardDescription>
              Lei, decreto ou instrução normativa que muda vencimentos, subsídios, rubricas ou parâmetros da folha. O
              ato fica registrado com os valores anterior e novo, e a folha usa cada valor na sua vigência.
            </CardDescription>
          </div>
          <Button
            onClick={() => {
              setEditando(null);
              setFormAberto(true);
            }}
            disabled={!podeConfigurar}
            title={!podeConfigurar ? "Exige a permissão de configurar a folha" : undefined}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo ato
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !atos?.length ? (
          <div className="py-8 text-center text-muted-foreground">
            <Scale className="mx-auto mb-3 h-10 w-10 opacity-50" />
            <p>Nenhum ato registrado. Registre aqui o próximo reajuste.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ato</TableHead>
                  <TableHead>Vigência</TableHead>
                  <TableHead>Ementa</TableHead>
                  <TableHead className="text-right">Itens</TableHead>
                  <TableHead className="text-center">Situação</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {atos.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium whitespace-nowrap">{identificacaoAto(a)}</TableCell>
                    <TableCell className="whitespace-nowrap">{dataBr(a.vigencia_inicio)}</TableCell>
                    <TableCell className="max-w-md truncate" title={a.ementa}>
                      {a.ementa}
                    </TableCell>
                    <TableCell className="text-right font-mono">{a.itens.length}</TableCell>
                    <TableCell className="text-center">
                      {a.status === "aplicado" ? (
                        <Badge variant="secondary">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Aplicado
                        </Badge>
                      ) : (
                        <Badge variant="outline">Rascunho</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setAbertoId(a.id)}>
                        Abrir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={formAberto} onOpenChange={setFormAberto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar ato" : "Novo ato"}</DialogTitle>
            <DialogDescription>Os dados do ato publicado. Depois inclua o que ele muda e aplique.</DialogDescription>
          </DialogHeader>
          <AtoRemuneratorioForm
            ato={editando}
            onCancel={() => setFormAberto(false)}
            onSuccess={(id) => {
              setFormAberto(false);
              setAbertoId(id);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!aberto} onOpenChange={(o) => !o && setAbertoId(null)}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          {aberto && (
            <DetalheAto
              ato={aberto}
              podeConfigurar={podeConfigurar}
              onEditar={() => {
                setEditando(aberto);
                setFormAberto(true);
              }}
              onExcluido={() => setAbertoId(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function DetalheAto({
  ato,
  podeConfigurar,
  onEditar,
  onExcluido,
}: {
  ato: AtoRemuneratorio;
  podeConfigurar: boolean;
  onEditar: () => void;
  onExcluido: () => void;
}) {
  const rascunho = ato.status === "rascunho";
  const editavel = rascunho && podeConfigurar;
  const { data: ultimaFechada } = useUltimaFolhaFechada();
  const removerItem = useRemoverItemAto();
  const aplicar = useAplicarAto();
  const excluir = useExcluirAto();
  const [confirmarAplicar, setConfirmarAplicar] = useState(false);
  const [confirmarExcluir, setConfirmarExcluir] = useState(false);
  const avisos = rascunho ? avisosVigencia(ato.vigencia_inicio, ultimaFechada) : [];

  return (
    <>
      <DialogHeader>
        <DialogTitle>{identificacaoAto(ato)}</DialogTitle>
        <DialogDescription>{ato.ementa}</DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <p className="text-muted-foreground">Data do ato</p>
          <p>{dataBr(ato.data_ato)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Publicação</p>
          <p>{dataBr(ato.data_publicacao)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Vale a partir de</p>
          <p className="font-medium">{dataBr(ato.vigencia_inicio)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Processo SEI</p>
          <p>{ato.processo_sei || "-"}</p>
        </div>
        {ato.percentual != null && (
          <div>
            <p className="text-muted-foreground">Percentual</p>
            <p>{String(ato.percentual).replace(".", ",")}%</p>
          </div>
        )}
        {ato.link_publicacao && (
          <div className="col-span-2">
            <p className="text-muted-foreground">Publicação</p>
            <a href={ato.link_publicacao} target="_blank" rel="noopener noreferrer" className="text-primary underline">
              Abrir a publicação
            </a>
          </div>
        )}
        {ato.status === "aplicado" && (
          <div className="col-span-2">
            <p className="text-muted-foreground">Aplicado em</p>
            <p>{ato.aplicado_em ? format(new Date(ato.aplicado_em), "dd/MM/yyyy HH:mm") : "-"}</p>
          </div>
        )}
      </div>

      {avisos.map((a) => (
        <Alert key={a}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{a}</AlertDescription>
        </Alert>
      ))}

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>O que muda</TableHead>
              <TableHead>Alvo</TableHead>
              <TableHead className="text-right">{rascunho ? "Valor hoje" : "Valor anterior"}</TableHead>
              <TableHead className="text-right">Valor novo</TableHead>
              {editavel && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {ato.itens.length === 0 && (
              <TableRow>
                <TableCell colSpan={editavel ? 5 : 4} className="py-6 text-center text-muted-foreground">
                  Nenhum item. Inclua abaixo o que o ato muda.
                </TableCell>
              </TableRow>
            )}
            {ato.itens.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="whitespace-nowrap">{ROTULO_ALVO[i.alvo as AlvoItemAto] ?? i.alvo}</TableCell>
                <TableCell>{nomeAlvo(i)}</TableCell>
                <TableCell className="text-right font-mono">
                  {valorFmt(i, rascunho ? valorAtual(i) : i.valor_anterior)}
                </TableCell>
                <TableCell className="text-right font-mono">{valorFmt(i, i.valor_novo)}</TableCell>
                {editavel && (
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remover item"
                      onClick={() => removerItem.mutate(i.id)}
                      disabled={removerItem.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editavel && <IncluirItens ato={ato} />}

      {editavel && (
        <div className="flex flex-wrap justify-between gap-2 border-t pt-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onEditar}>
              <Edit2 className="mr-2 h-4 w-4" />
              Editar dados
            </Button>
            <Button variant="outline" onClick={() => setConfirmarExcluir(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir rascunho
            </Button>
          </div>
          <Button onClick={() => setConfirmarAplicar(true)} disabled={!ato.itens.length || aplicar.isPending}>
            {aplicar.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
            Aplicar o ato
          </Button>
        </div>
      )}

      <AlertDialog open={confirmarAplicar} onOpenChange={setConfirmarAplicar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aplicar {identificacaoAto(ato)}?</AlertDialogTitle>
            <AlertDialogDescription>
              Os {ato.itens.length} valor(es) passam a valer a partir de {dataBr(ato.vigencia_inicio)}, e o ato não
              poderá mais ser alterado nem excluído. Para corrigir depois, registra-se outro ato.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => aplicar.mutate(ato.id)}>Aplicar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmarExcluir} onOpenChange={setConfirmarExcluir}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir o rascunho?</AlertDialogTitle>
            <AlertDialogDescription>O ato e seus itens saem. Nada foi aplicado na folha.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => excluir.mutate(ato.id, { onSuccess: onExcluido })}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function IncluirItens({ ato }: { ato: AtoRemuneratorio }) {
  const { data: cargos } = useCargosParaReajuste();
  const { data: rubricas } = useRubricas(true);
  const adicionar = useAdicionarItensAto();
  const [alvo, setAlvo] = useState<AlvoItemAto>("cargo");
  const [alvoId, setAlvoId] = useState("");
  const [valor, setValor] = useState("");
  const [percentual, setPercentual] = useState(ato.percentual != null ? String(ato.percentual).replace(".", ",") : "");
  const [categoria, setCategoria] = useState("todas");

  const noAto = useMemo(() => new Set(ato.itens.map((i) => i.cargo_id).filter((x): x is string => !!x)), [ato.itens]);
  const categorias = useMemo(
    () => [...new Set((cargos ?? []).map((c) => c.categoria as string))].sort(),
    [cargos],
  );
  const pct = numero(percentual);
  const doReajuste = useMemo(
    () =>
      Number.isFinite(pct) && percentual.trim()
        ? itensPorPercentual(
            (cargos ?? []).filter((c) => categoria === "todas" || c.categoria === categoria),
            pct,
            noAto,
          )
        : [],
    [cargos, categoria, pct, percentual, noAto],
  );
  const valorNovo = numero(valor);
  const podeIncluir = !!alvoId && Number.isFinite(valorNovo) && valorNovo >= 0 && valor.trim() !== "";

  const incluir = () => {
    if (!podeIncluir) return;
    adicionar.mutate(
      {
        atoId: ato.id,
        itens: [
          {
            alvo,
            cargo_id: alvo === "cargo" ? alvoId : null,
            rubrica_id: alvo === "rubrica" ? alvoId : null,
            tipo_parametro: alvo === "parametro" ? alvoId : null,
            valor_novo: valorNovo,
          },
        ],
      },
      {
        onSuccess: () => {
          setAlvoId("");
          setValor("");
        },
      },
    );
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-3 rounded-md border p-4">
        <p className="font-medium">Incluir um item</p>
        <div className="space-y-2">
          <Label>O que muda</Label>
          <Select
            value={alvo}
            onValueChange={(v) => {
              setAlvo(v as AlvoItemAto);
              setAlvoId("");
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(ROTULO_ALVO) as AlvoItemAto[]).map((a) => (
                <SelectItem key={a} value={a}>
                  {ROTULO_ALVO[a]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{alvo === "cargo" ? "Cargo" : alvo === "rubrica" ? "Rubrica" : "Parâmetro"}</Label>
          <Select value={alvoId} onValueChange={setAlvoId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {alvo === "cargo" &&
                cargos?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.sigla ? `${c.sigla} · ` : ""}
                    {c.nome} ({formatCurrency(c.vencimento_base)})
                  </SelectItem>
                ))}
              {alvo === "rubrica" &&
                rubricas?.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.codigo} · {r.descricao}
                  </SelectItem>
                ))}
              {alvo === "parametro" &&
                PARAMETROS_FOLHA.map((p) => (
                  <SelectItem key={p.tipo} value={p.tipo}>
                    {p.descricao}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="valor-novo-item">Valor novo</Label>
          <Input id="valor-novo-item" value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal" placeholder="0,00" />
        </div>
        <Button onClick={incluir} disabled={!podeIncluir || adicionar.isPending}>
          <Plus className="mr-2 h-4 w-4" />
          Incluir
        </Button>
      </div>

      <div className="space-y-3 rounded-md border p-4">
        <p className="font-medium">Reajuste geral dos cargos</p>
        <p className="text-sm text-muted-foreground">
          Inclui um item por cargo com o vencimento de hoje mais o percentual, arredondado ao centavo. Confira na lista
          antes de aplicar; um item pode ser removido e incluído de novo com outro valor.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="percentual-reajuste">Percentual (%)</Label>
            <Input
              id="percentual-reajuste"
              value={percentual}
              onChange={(e) => setPercentual(e.target.value)}
              inputMode="decimal"
              placeholder="6,5"
            />
          </div>
          <div className="space-y-2">
            <Label>Cargos</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos</SelectItem>
                {categorias.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            adicionar.mutate({ atoId: ato.id, itens: doReajuste.map((i) => ({ alvo: "cargo" as const, ...i })) })
          }
          disabled={!doReajuste.length || adicionar.isPending}
        >
          <Percent className="mr-2 h-4 w-4" />
          Incluir {doReajuste.length} cargo(s)
        </Button>
      </div>
    </div>
  );
}
