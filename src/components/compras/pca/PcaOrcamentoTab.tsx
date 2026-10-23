/**
 * Aba "Orçamento" do PCA: teto (PLOA ou QDD) por ação orçamentária × fonte contra o total planejado nos itens.
 * Compras digita o teto da PLOA; quando o QDD do exercício chega, "Usar o QDD" troca os tetos pelo que foi importado.
 */

import { useState } from "react";
import { Plus } from "lucide-react";
import { KpiCard } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/formatters";
import { calcularOrcamento, totaisOrcamento } from "@/lib/pca/orcamento";
import { lerNumeroBr } from "@/lib/pca/numero";
import { cn } from "@/lib/utils";
import {
  useSalvarPcaTeto, useUsarQddPca, type ClassificadoresPca, type PcaItem, type PcaPlano, type PcaTeto,
} from "@/hooks/usePca";
import { rotuloClassificador } from "./rotulos";

interface PcaOrcamentoTabProps {
  plano: PcaPlano;
  tetos: PcaTeto[] | undefined;
  itens: PcaItem[] | undefined;
  classificadores: ClassificadoresPca | undefined;
  podeEditar: boolean;
}

function Diferenca({ valor }: { valor: number }) {
  if (valor < 0) return <span className="font-semibold text-destructive">Falta {formatCurrency(-valor)}</span>;
  return <span className="text-success">Sobra {formatCurrency(valor)}</span>;
}

/** Campo do teto: grava ao sair do campo, se o valor mudou. */
function CampoTeto({ valor, rotulo, aoSalvar }: { valor: number; rotulo: string; aoSalvar: (v: number) => void }) {
  const [texto, setTexto] = useState(valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  const numero = lerNumeroBr(texto);
  const invalido = Number.isNaN(numero) || numero < 0;
  return (
    <Input
      className="ml-auto w-36 text-right"
      inputMode="decimal"
      aria-label={`Teto de ${rotulo}`}
      aria-invalid={invalido}
      value={texto}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={() => { if (!invalido && Math.round(numero * 100) !== Math.round(valor * 100)) aoSalvar(numero); }}
    />
  );
}

export function PcaOrcamentoTab({ plano, tetos, itens, classificadores, podeEditar }: PcaOrcamentoTabProps) {
  const salvarTeto = useSalvarPcaTeto();
  const usarQdd = useUsarQddPca();
  const [novo, setNovo] = useState({ acao: "", fonte: "", valor: "" });
  const [confirmarQdd, setConfirmarQdd] = useState(false);

  const linhas = calcularOrcamento(tetos ?? [], itens ?? []);
  const totais = totaisOrcamento(linhas);
  const acao = (id: string) => classificadores?.acoes.find((a) => a.id === id);
  const fonte = (id: string) => classificadores?.fontes.find((f) => f.id === id);
  const origemQdd = (tetos ?? []).some((t) => t.origem === "qdd");
  const valorNovo = lerNumeroBr(novo.valor);
  const novoValido = !!novo.acao && !!novo.fonte && !Number.isNaN(valorNovo) && valorNovo >= 0;

  const incluir = async () => {
    if (!novoValido) return;
    try {
      await salvarTeto.mutateAsync({ plano_id: plano.id, acao_id: novo.acao, fonte_recurso_id: novo.fonte, valor_previsto: valorNovo });
      setNovo({ acao: "", fonte: "", valor: "" });
    } catch {
      // erro já exibido pelo toast da mutation
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard rotulo={origemQdd ? "Teto (QDD)" : "Teto (PLOA)"} valor={formatCurrency(totais.teto)} />
        <KpiCard rotulo="Planejado no PCA" valor={formatCurrency(totais.planejado)} />
        <KpiCard rotulo={totais.diferenca < 0 ? "Falta" : "Sobra"} valor={formatCurrency(Math.abs(totais.diferenca))} />
      </div>

      {podeEditar && (classificadores?.qdd_linhas ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">O QDD de {plano.exercicio} já foi importado</CardTitle>
            <CardDescription>Dá para trocar os tetos digitados pelos valores do QDD, por ação e fonte.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => setConfirmarQdd(true)} disabled={usarQdd.isPending}>Usar o QDD</Button>
          </CardContent>
        </Card>
      )}

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ação orçamentária</TableHead>
              <TableHead>Fonte</TableHead>
              <TableHead className="text-right">Teto</TableHead>
              <TableHead className="text-right">Planejado</TableHead>
              <TableHead className="text-right">Diferença</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Nenhum teto nem item ainda. {podeEditar && "Inclua o teto da PLOA abaixo."}
                </TableCell>
              </TableRow>
            )}
            {linhas.map((l) => {
              const rotulo = `${acao(l.acaoId)?.codigo ?? "ação"} / ${fonte(l.fonteRecursoId)?.codigo ?? "fonte"}`;
              return (
                <TableRow key={`${l.acaoId}|${l.fonteRecursoId}`} className={cn(l.estourado && "bg-destructive/5")}>
                  <TableCell>{rotuloClassificador(acao(l.acaoId))}</TableCell>
                  <TableCell>{rotuloClassificador(fonte(l.fonteRecursoId))}</TableCell>
                  <TableCell className="text-right">
                    {podeEditar ? (
                      <CampoTeto
                        key={l.teto}
                        valor={l.teto}
                        rotulo={rotulo}
                        aoSalvar={(v) => salvarTeto.mutate({ plano_id: plano.id, acao_id: l.acaoId, fonte_recurso_id: l.fonteRecursoId, valor_previsto: v })}
                      />
                    ) : formatCurrency(l.teto)}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(l.planejado)}</TableCell>
                  <TableCell className="text-right"><Diferenca valor={l.diferenca} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          {linhas.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2} className="font-semibold">Total</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(totais.teto)}</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(totais.planejado)}</TableCell>
                <TableCell className="text-right"><Diferenca valor={totais.diferenca} /></TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      {podeEditar && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Incluir teto da PLOA</CardTitle>
            <CardDescription>Valor previsto para a ação e a fonte. Convênio ou emenda entram como fonte.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-[1fr_1fr_10rem_auto] sm:items-end">
            <Select value={novo.acao} onValueChange={(v) => setNovo((n) => ({ ...n, acao: v }))}>
              <SelectTrigger aria-label="Ação orçamentária"><SelectValue placeholder="Ação orçamentária" /></SelectTrigger>
              <SelectContent>
                {(classificadores?.acoes ?? []).map((a) => <SelectItem key={a.id} value={a.id}>{rotuloClassificador(a)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={novo.fonte} onValueChange={(v) => setNovo((n) => ({ ...n, fonte: v }))}>
              <SelectTrigger aria-label="Fonte de recurso"><SelectValue placeholder="Fonte de recurso" /></SelectTrigger>
              <SelectContent>
                {(classificadores?.fontes ?? []).map((f) => <SelectItem key={f.id} value={f.id}>{rotuloClassificador(f)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input
              inputMode="decimal"
              placeholder="0,00"
              aria-label="Valor previsto"
              value={novo.valor}
              onChange={(e) => setNovo((n) => ({ ...n, valor: e.target.value }))}
            />
            <Button onClick={incluir} disabled={!novoValido || salvarTeto.isPending}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Incluir
            </Button>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={confirmarQdd} onOpenChange={setConfirmarQdd}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Trocar os tetos pelo QDD?</AlertDialogTitle>
            <AlertDialogDescription>
              Os tetos digitados saem e entram os valores do QDD de {plano.exercicio}, somados por ação e fonte. A troca
              fica registrada no histórico do PCA.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => usarQdd.mutate(plano.id)}>Usar o QDD</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
