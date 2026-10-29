/**
 * Lança ou mostra uma fatura (nota fiscal) da agência: nº, emissão, valor, processo SEI do pagamento e os bilhetes que
 * ela cobre. O valor de cada bilhete vem do bilhete (emissão + multa − reembolso) e pode ser ajustado. A conferência
 * mostra a diferença entre a nota e a soma dos bilhetes; diferença não impede gravar. Fatura paga ou cancelada e
 * quem não tem o financeiro das passagens só veem.
 */

import { useEffect, useMemo, useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import { StatusBadge } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDateBR } from "@/lib/formatters";
import { conferirFatura } from "@/lib/passagens/faturas";
import { valorTrecho } from "@/lib/passagens/regras";
import { useSalvarFatura } from "@/hooks/usePassagensFaturas";
import { rotuloSituacaoFatura, type BilheteDoContrato, type FaturaComItens } from "@/types/passagens";
import { TOM_FATURA } from "./tons";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contratoId: string;
  /** null = nova fatura. */
  fatura: FaturaComItens | null;
  /** Bilhetes do contrato (todos); a lista mostra os sem nota e os desta fatura. */
  bilhetes: BilheteDoContrato[];
  /** Trechos já em outra fatura (não cancelada). */
  faturadosEmOutra: ReadonlySet<string>;
  podeEditar: boolean;
  aoMudarSituacao?: (f: FaturaComItens) => void;
}

const hoje = () => new Date().toLocaleDateString("sv-SE");
// "1.234,56" (com vírgula, o ponto é de milhar) ou "1234.56"
const paraNumero = (v: string) => (v.includes(",") ? Number(v.replace(/\./g, "").replace(",", ".")) : Number(v));
const paraTexto = (v: number) => v.toFixed(2).replace(".", ",");

export function FaturaDialog({ open, onOpenChange, contratoId, fatura, bilhetes, faturadosEmOutra, podeEditar, aoMudarSituacao }: Props) {
  const salvar = useSalvarFatura();
  const travada = !!fatura && (fatura.situacao === "paga" || fatura.situacao === "cancelada");
  const edita = podeEditar && !travada;
  const [numero, setNumero] = useState("");
  const [emissao, setEmissao] = useState("");
  const [valor, setValor] = useState("");
  const [processo, setProcesso] = useState("");
  const [obs, setObs] = useState("");
  // trecho_id → valor digitado
  const [itens, setItens] = useState<Record<string, string>>({});
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setNumero(fatura?.numero ?? "");
    setEmissao(fatura?.data_emissao ?? hoje());
    setValor(fatura ? paraTexto(Number(fatura.valor)) : "");
    setProcesso(fatura?.processo_sei_pagamento ?? "");
    setObs(fatura?.observacoes ?? "");
    setItens(Object.fromEntries((fatura?.itens ?? []).map((i) => [i.trecho_id, paraTexto(Number(i.valor))])));
    setErro(null);
  }, [open, fatura]);

  // os bilhetes desta fatura e, para quem edita, os sem nota: desmarcar não tira o bilhete da lista
  const lista = useMemo(() => {
    const iniciais = new Set(fatura?.itens.map((i) => i.trecho_id) ?? []);
    return bilhetes.filter((b) => iniciais.has(b.id) || (edita && !faturadosEmOutra.has(b.id) && valorTrecho(b) > 0));
  }, [bilhetes, faturadosEmOutra, edita, fatura]);
  const marcados = Object.entries(itens).map(([trecho_id, v]) => ({ trecho_id, valor: paraNumero(v) }));
  const conf = conferirFatura(paraNumero(valor || "0"), marcados);

  const alternar = (b: BilheteDoContrato, marcar: boolean) =>
    setItens((atual) => {
      const novo = { ...atual };
      if (marcar) novo[b.id] = paraTexto(valorTrecho(b));
      else delete novo[b.id];
      return novo;
    });

  const gravar = async () => {
    const v = paraNumero(valor);
    if (!numero.trim() || !emissao || !(v > 0)) {
      setErro("Informe o nº, a data de emissão e o valor da nota.");
      return;
    }
    if (marcados.length === 0) {
      setErro("Marque os bilhetes que a nota cobre.");
      return;
    }
    if (marcados.some((m) => !(m.valor >= 0))) {
      setErro("Confira o valor de cada bilhete.");
      return;
    }
    try {
      await salvar.mutateAsync({
        id: fatura?.id,
        contrato_id: contratoId,
        numero: numero.trim(),
        data_emissao: emissao,
        valor: v,
        processo_sei_pagamento: processo.trim() || null,
        observacoes: obs.trim() || null,
        itens: marcados,
      });
      onOpenChange(false);
    } catch {
      // erro já exibido pelo toast da mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {fatura ? `Fatura ${fatura.numero}` : "Nova fatura"}
            {fatura && <StatusBadge tom={TOM_FATURA[fatura.situacao] ?? "neutro"} icone={false}>{rotuloSituacaoFatura(fatura.situacao)}</StatusBadge>}
          </DialogTitle>
          <DialogDescription>
            {edita ? "Dados da nota da agência e os bilhetes que ela cobre. Cada bilhete entra numa nota só." : "Nota da agência e os bilhetes que ela cobre."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="fat-numero">Nº da nota</Label>
              <Input id="fat-numero" value={numero} onChange={(e) => setNumero(e.target.value)} disabled={!edita} maxLength={40} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fat-emissao">Emissão</Label>
              <Input id="fat-emissao" type="date" value={emissao} onChange={(e) => setEmissao(e.target.value)} disabled={!edita} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fat-valor">Valor da nota (R$)</Label>
              <Input id="fat-valor" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} disabled={!edita} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fat-processo">Processo SEI do pagamento</Label>
              <Input id="fat-processo" value={processo} onChange={(e) => setProcesso(e.target.value)} disabled={!edita} maxLength={60} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fat-obs">Observações</Label>
              <Textarea id="fat-obs" rows={1} value={obs} onChange={(e) => setObs(e.target.value)} disabled={!edita} maxLength={2000} />
            </div>
          </div>

          {fatura && fatura.situacao !== "recebida" && (
            <dl className="grid gap-2 rounded-md border border-border p-3 text-sm sm:grid-cols-2">
              {fatura.atesto_data && <div><dt className="text-muted-foreground">Atesto</dt><dd>{formatDateBR(fatura.atesto_data)} · SEI {fatura.atesto_documento_sei}</dd></div>}
              {fatura.liquidacao_data && <div><dt className="text-muted-foreground">Liquidação</dt><dd>{formatDateBR(fatura.liquidacao_data)}</dd></div>}
              {fatura.pagamento_data && <div><dt className="text-muted-foreground">Pagamento</dt><dd>{formatDateBR(fatura.pagamento_data)} · OB {fatura.ob_numero}</dd></div>}
              {fatura.cancelamento_motivo && <div className="sm:col-span-2"><dt className="text-muted-foreground">Motivo do cancelamento</dt><dd>{fatura.cancelamento_motivo}</dd></div>}
            </dl>
          )}

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Bilhetes {edita ? "(marque os que a nota cobre)" : ""}</legend>
            {lista.length === 0 && <p className="text-sm text-muted-foreground">{fatura?.situacao === "cancelada" ? "Fatura cancelada: os bilhetes voltaram para a faturar." : "Nenhum bilhete a faturar neste contrato."}</p>}
            <ul className="divide-y divide-border rounded-md border border-border">
              {lista.map((b) => {
                const marcado = b.id in itens;
                return (
                  <li key={b.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      {edita && (
                        <Checkbox id={`bil-${b.id}`} checked={marcado} onCheckedChange={(c) => alternar(b, c === true)} className="mt-0.5" />
                      )}
                      <label htmlFor={`bil-${b.id}`} className="min-w-0 text-sm">
                        <span className="font-medium">{b.passageiro.nome}</span> · {b.origem} → {b.destino}
                        <span className="block text-muted-foreground">
                          {b.localizador} · emitido em {formatDateBR(b.data_emissao)} · SEI {b.passageiro.pedido.numero_sei}
                        </span>
                      </label>
                    </div>
                    {marcado ? (
                      <Input
                        aria-label={`Valor do bilhete ${b.localizador}`}
                        inputMode="decimal"
                        className="sm:w-32 sm:text-right"
                        value={itens[b.id]}
                        disabled={!edita}
                        onChange={(e) => setItens((a) => ({ ...a, [b.id]: e.target.value }))}
                      />
                    ) : (
                      <span className="text-sm tabular-nums text-muted-foreground sm:w-32 sm:text-right">{formatCurrency(valorTrecho(b))}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </fieldset>

          <div className="flex flex-wrap justify-between gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm" role="status">
            <span>{marcados.length} {marcados.length === 1 ? "bilhete" : "bilhetes"} · soma <span className="tabular-nums">{formatCurrency(conf.soma)}</span></span>
            <span className={conf.confere ? "" : "font-medium text-warning"}>
              {conf.confere ? "Nota confere com os bilhetes" : `Diferença da nota: ${formatCurrency(conf.diferenca)}`}
            </span>
          </div>
          {erro && <p className="text-sm font-medium text-destructive" role="alert">{erro}</p>}
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{edita ? "Cancelar" : "Fechar"}</Button>
          {fatura && podeEditar && fatura.situacao !== "cancelada" && aoMudarSituacao && (
            <Button type="button" variant="outline" onClick={() => aoMudarSituacao(fatura)}>
              <ArrowRightLeft className="h-4 w-4" aria-hidden="true" />
              Mudar situação
            </Button>
          )}
          {edita && <Button onClick={gravar} disabled={salvar.isPending}>Salvar</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
