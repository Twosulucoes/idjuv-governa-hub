/**
 * Conciliação manual: liga um movimento bancário a um pagamento do sistema, ou desfaz o vínculo
 * (RPC `conciliar_movimento_bancario`, que confere a permissão `pagamento.conciliar`).
 * Candidatos: pagamentos do ano do movimento (data do pagamento ou do arquivo), os de mesmo valor líquido primeiro.
 * Valor diferente exige justificativa; trocar o vínculo exige desvincular antes (regras da RPC).
 */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Search, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useConciliarMovimento, usePagamentosParaConciliar } from "@/hooks/useConciliacaoBancaria";
import { formatCurrency } from "@/lib/formatters";
import type { MovimentoBancario } from "@/types/conciliacaoBancaria";
import { dataBR, documentoMascarado } from "@/lib/bancario/exibicao";

interface Props {
  movimento: MovimentoBancario | null;
  onOpenChange: (aberto: boolean) => void;
}

const LIMITE_LISTA = 50;

/** Ano do movimento: data do pagamento; sem ela, data do arquivo. */
function anoDoMovimento(m: MovimentoBancario | null): number | null {
  const data = m?.data_pagamento ?? m?.data_arquivo;
  const ano = data ? Number(data.slice(0, 4)) : NaN;
  return Number.isFinite(ano) ? ano : null;
}

export function ConciliarMovimentoDialog({ movimento, onOpenChange }: Props) {
  const aberto = !!movimento;
  const vinculado = !!movimento?.pagamento_id;
  const exercicio = anoDoMovimento(movimento);
  const { data: pagamentos, isLoading, isError } = usePagamentosParaConciliar(exercicio, aberto && !vinculado);
  const conciliar = useConciliarMovimento();
  const [busca, setBusca] = useState("");
  const [escolhido, setEscolhido] = useState("");
  const [justificativa, setJustificativa] = useState("");

  const candidatos = useMemo(() => {
    if (!movimento || !pagamentos) return [];
    const alvo = Math.round(Number(movimento.valor) * 100);
    const termo = busca.trim().toLowerCase();
    return pagamentos
      .filter(
        (p) =>
          !termo ||
          p.numero.toLowerCase().includes(termo) ||
          (p.fornecedor?.razao_social ?? "").toLowerCase().includes(termo),
      )
      .map((p) => ({
        p,
        // A RPC compara com o valor líquido
        mesmoValor: Math.round(Number(p.valor_liquido) * 100) === alvo,
      }))
      .sort((a, b) => Number(b.mesmoValor) - Number(a.mesmoValor))
      .slice(0, LIMITE_LISTA);
  }, [movimento, pagamentos, busca]);

  const fechar = (v: boolean) => {
    if (conciliar.isPending) return;
    if (!v) {
      setBusca("");
      setEscolhido("");
      setJustificativa("");
    }
    onOpenChange(v);
  };

  const candidatoEscolhido = candidatos.find((c) => c.p.id === escolhido);
  const exigeJustificativa = !!candidatoEscolhido && !candidatoEscolhido.mesmoValor;
  const podeConciliar = !!escolhido && (!exigeJustificativa || justificativa.trim().length > 0);

  const confirmar = async () => {
    if (!movimento || !podeConciliar) return;
    try {
      await conciliar.mutateAsync({
        movimentoId: movimento.id,
        pagamentoId: escolhido,
        justificativa: exigeJustificativa ? justificativa : null,
      });
    } catch {
      return; // toast de erro já exibido pela mutation
    }
    fechar(false);
  };

  const desvincular = async () => {
    if (!movimento) return;
    try {
      await conciliar.mutateAsync({ movimentoId: movimento.id, pagamentoId: null });
    } catch {
      return;
    }
    fechar(false);
  };

  return (
    <Dialog open={aberto} onOpenChange={fechar}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{vinculado ? "Vínculo com o pagamento" : "Conciliar com um pagamento"}</DialogTitle>
          <DialogDescription>
            {vinculado
              ? "Este movimento já está ligado a um pagamento. Para ligar a outro, desvincule antes."
              : "Escolha o pagamento do sistema que corresponde a este movimento do banco."}
          </DialogDescription>
        </DialogHeader>

        {movimento && (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-md border p-3 text-sm sm:grid-cols-4">
            <dt className="text-muted-foreground">Favorecido</dt>
            <dd className="col-span-1 truncate sm:col-span-3">{movimento.favorecido_nome || "—"}</dd>
            <dt className="text-muted-foreground">CPF/CNPJ</dt>
            <dd className="font-mono">{documentoMascarado(movimento.favorecido_documento)}</dd>
            <dt className="text-muted-foreground">Valor</dt>
            <dd className="tabular-nums">{formatCurrency(Number(movimento.valor))}</dd>
            <dt className="text-muted-foreground">Data</dt>
            <dd>{dataBR(movimento.data_pagamento)}</dd>
            <dt className="text-muted-foreground">OB / seu número</dt>
            <dd className="font-mono">{movimento.identificador}</dd>
          </dl>
        )}

        {vinculado ? (
          <p className="rounded-md border p-3 text-sm">
            Pagamento vinculado:{" "}
            {movimento?.pagamento ? (
              <Link
                to={`/financeiro/pagamentos/${movimento.pagamento.id}`}
                className="font-mono text-primary underline-offset-4 hover:underline"
              >
                {movimento.pagamento.numero}
              </Link>
            ) : (
              <span className="text-muted-foreground">sem acesso ao número</span>
            )}
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="busca-pagamento">Buscar pagamento</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
                <Input
                  id="busca-pagamento"
                  className="pl-8"
                  placeholder="Número ou fornecedor"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto rounded-md border p-2">
              {isLoading ? (
                <p className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Carregando pagamentos…
                </p>
              ) : isError ? (
                <p className="p-2 text-sm text-destructive">Não foi possível carregar os pagamentos.</p>
              ) : candidatos.length === 0 ? (
                <p className="p-2 text-sm text-muted-foreground">
                  {exercicio ? `Nenhum pagamento encontrado no exercício ${exercicio}.` : "Movimento sem data: não há exercício para buscar."}
                </p>
              ) : (
                <RadioGroup value={escolhido} onValueChange={setEscolhido} aria-label="Pagamentos">
                  {candidatos.map(({ p, mesmoValor }) => (
                    <Label
                      key={p.id}
                      htmlFor={`pg-${p.id}`}
                      className="flex cursor-pointer items-start gap-3 rounded-md p-2 font-normal hover:bg-muted/50"
                    >
                      <RadioGroupItem id={`pg-${p.id}`} value={p.id} className="mt-0.5" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-mono text-sm font-medium">{p.numero}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {p.fornecedor?.razao_social ?? "Sem fornecedor"} · {dataBR(p.data_pagamento)}
                        </span>
                      </span>
                      <span className="text-right text-sm tabular-nums">
                        {formatCurrency(Number(p.valor_liquido))}
                        {mesmoValor && <span className="block text-xs text-success">mesmo valor</span>}
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
              )}
            </div>

            {exigeJustificativa && (
              <div className="space-y-2">
                <Label htmlFor="justificativa-conciliacao">Justificativa (valor diferente)</Label>
                <Textarea
                  id="justificativa-conciliacao"
                  rows={2}
                  maxLength={500}
                  value={justificativa}
                  onChange={(e) => setJustificativa(e.target.value)}
                  aria-describedby="justificativa-conciliacao-ajuda"
                />
                <p id="justificativa-conciliacao-ajuda" className="text-xs text-muted-foreground">
                  O valor líquido do pagamento não confere com o do movimento: explique o vínculo.
                </p>
              </div>
            )}
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => fechar(false)} disabled={conciliar.isPending}>
            {vinculado ? "Fechar" : "Cancelar"}
          </Button>
          {vinculado ? (
            <Button variant="destructive" onClick={desvincular} disabled={conciliar.isPending}>
              {conciliar.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Unlink className="mr-2 h-4 w-4" aria-hidden />
              )}
              Desvincular
            </Button>
          ) : (
            <Button onClick={confirmar} disabled={!podeConciliar || conciliar.isPending}>
              {conciliar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              Conciliar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
