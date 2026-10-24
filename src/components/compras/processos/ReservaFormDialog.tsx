/**
 * Reserva do processo numa combinação ação × fonte × natureza do QDD. Mostra o saldo livre da combinação (QDD menos o
 * pendente das outras reservas) enquanto se digita; quando o valor não cabe, a justificativa é obrigatória (o banco
 * confere de novo). "Puxar do PCA" preenche com o item do PCA que tem o mesmo nº SEI.
 */

import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, ClipboardList } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { faltaNoSaldo } from "@/lib/compras/faseFinanceira";
import { formatarNatureza } from "@/lib/financeiro/painelExecucao";
import { formatCurrency } from "@/lib/formatters";
import { lerNumeroBr } from "@/lib/pca/numero";
import {
  useItensPcaDoProcesso,
  useProgramacaoPorNatureza,
  useSaldoLivre,
  type ReservaDoProcesso,
  type ReservaInput,
} from "@/hooks/useProcessosContratacao";
import type { ProcessoContratacao } from "@/types/processos";

const schema = z.object({
  exercicio: z.string().regex(/^\d{4}$/, "Ano com 4 dígitos"),
  combinacao: z.string().min(1, "Escolha a natureza no QDD"),
  valor: z.string().refine((v) => lerNumeroBr(v) > 0, "Informe um valor maior que zero"),
  justificativa: z.string().trim().max(2000).optional(),
  pca_item_id: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Combinacao {
  chave: string;
  acao_id: string;
  fonte_recurso_id: string;
  natureza_despesa_id: string;
  rotulo: string;
}

const chave = (acao: string, fonte: string, natureza: string) => `${acao}|${fonte}|${natureza}`;
const paraTexto = (n: number | null | undefined) =>
  n == null ? "" : n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processo: ProcessoContratacao;
  /** Reserva em edição; sem ela, nova reserva. */
  reserva?: ReservaDoProcesso | null;
  salvando?: boolean;
  onSalvar: (dados: ReservaInput) => Promise<unknown>;
}

export function ReservaFormDialog({ open, onOpenChange, processo, reserva, salvando, onSalvar }: Props) {
  const form = useForm<FormData>({ resolver: zodResolver(schema) });
  const exercicioTexto = useWatch({ control: form.control, name: "exercicio" });
  const exercicio = /^\d{4}$/.test(exercicioTexto ?? "") ? Number(exercicioTexto) : undefined;
  const combinacao = useWatch({ control: form.control, name: "combinacao" });
  const valorTexto = useWatch({ control: form.control, name: "valor" });

  const programacao = useProgramacaoPorNatureza(open ? exercicio : undefined);
  const itensPca = useItensPcaDoProcesso(open ? processo.numero_processo : undefined);

  const combinacoes = useMemo<Combinacao[]>(() => {
    const lista: Combinacao[] = (programacao.data ?? [])
      .filter((l) => l.tem_qdd)
      .map((l) => ({
        chave: chave(l.acao_id, l.fonte_recurso_id, l.natureza_despesa_id),
        acao_id: l.acao_id,
        fonte_recurso_id: l.fonte_recurso_id,
        natureza_despesa_id: l.natureza_despesa_id,
        rotulo: `${formatarNatureza(l.natureza_codigo)} ${l.natureza_nome} · ação ${l.acao_codigo} · fonte ${l.fonte_codigo}`,
      }))
      .sort((a, b) => a.rotulo.localeCompare(b.rotulo, "pt-BR"));
    // A reserva em edição continua escolhível mesmo que a combinação tenha saído do QDD
    if (reserva && reserva.exercicio === exercicio) {
      const k = chave(reserva.acao_id, reserva.fonte_recurso_id, reserva.natureza_despesa_id);
      if (!lista.some((c) => c.chave === k)) {
        lista.unshift({
          chave: k,
          acao_id: reserva.acao_id,
          fonte_recurso_id: reserva.fonte_recurso_id,
          natureza_despesa_id: reserva.natureza_despesa_id,
          rotulo: `${formatarNatureza(reserva.natureza_codigo)} ${reserva.natureza_nome} · ação ${reserva.acao_codigo} · fonte ${reserva.fonte_codigo} (sem dotação no QDD)`,
        });
      }
    }
    return lista;
  }, [programacao.data, reserva, exercicio]);

  const escolhida = combinacoes.find((c) => c.chave === combinacao);
  const saldo = useSaldoLivre(exercicio, escolhida?.acao_id, escolhida?.fonte_recurso_id, escolhida?.natureza_despesa_id, reserva?.id);
  const valor = lerNumeroBr(valorTexto ?? "");
  const falta = escolhida && saldo.isSuccess && valor > 0 ? faltaNoSaldo(valor, saldo.data) : undefined;
  // null = sem dotação no QDD; número > 0 = não cabe. Nos dois casos a justificativa é obrigatória.
  const precisaJustificar = falta === null || (typeof falta === "number" && falta > 0);

  useEffect(() => {
    if (!open) return;
    form.reset({
      exercicio: String(reserva?.exercicio ?? processo.ano),
      combinacao: reserva ? chave(reserva.acao_id, reserva.fonte_recurso_id, reserva.natureza_despesa_id) : "",
      valor: paraTexto(reserva?.valor),
      justificativa: reserva?.justificativa_saldo ?? "",
      pca_item_id: reserva?.pca_item_id ?? "",
    });
  }, [open, reserva, processo, form]);

  const puxarDoPca = (id: string) => {
    const item = itensPca.data?.find((i) => i.id === id);
    if (!item) return;
    form.setValue("exercicio", String(item.exercicio));
    if (item.acao_id && item.fonte_recurso_id && item.natureza_despesa_id) {
      form.setValue("combinacao", chave(item.acao_id, item.fonte_recurso_id, item.natureza_despesa_id), { shouldValidate: true });
    }
    form.setValue("valor", paraTexto(item.valor_total), { shouldValidate: true });
    form.setValue("pca_item_id", item.id);
  };

  const onSubmit = async (d: FormData) => {
    const c = combinacoes.find((x) => x.chave === d.combinacao);
    if (!c) return;
    if (precisaJustificar && (d.justificativa ?? "").length < 10) {
      form.setError("justificativa", { message: "Explique em pelo menos 10 caracteres por que reservar sem saldo" });
      return;
    }
    try {
      await onSalvar({
        id: reserva?.id ?? null,
        processo_id: processo.id,
        exercicio: Number(d.exercicio),
        acao_id: c.acao_id,
        fonte_recurso_id: c.fonte_recurso_id,
        natureza_despesa_id: c.natureza_despesa_id,
        valor: lerNumeroBr(d.valor),
        pca_item_id: d.pca_item_id || null,
        justificativa: precisaJustificar ? d.justificativa : null,
      });
      onOpenChange(false);
    } catch {
      // erro já exibido pelo toast da mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{reserva ? "Editar reserva" : "Nova reserva"}</DialogTitle>
          <DialogDescription>
            Processo {processo.numero_processo}. A reserva separa o valor numa natureza do QDD até o PED ser autorizado no FIPLAN.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {!reserva && (itensPca.data?.length ?? 0) > 0 && (
              <div className="space-y-2 rounded-md border p-3">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <ClipboardList className="h-4 w-4" aria-hidden="true" />
                  Puxar do PCA
                </p>
                <Select onValueChange={puxarDoPca}>
                  <SelectTrigger aria-label="Item do PCA com o mesmo nº SEI"><SelectValue placeholder="Escolha o item do PCA" /></SelectTrigger>
                  <SelectContent>
                    {itensPca.data!.map((i) => (
                      <SelectItem key={i.id} value={i.id}>{`${i.descricao} · ${formatCurrency(i.valor_total)} (${i.exercicio})`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
              <FormField
                control={form.control}
                name="exercicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exercício *</FormLabel>
                    <FormControl><Input inputMode="numeric" maxLength={4} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="combinacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Natureza, ação e fonte *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={programacao.isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={programacao.isLoading ? "Carregando o QDD…" : "Escolha no QDD"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {combinacoes.map((c) => <SelectItem key={c.chave} value={c.chave}>{c.rotulo}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {exercicio && programacao.isSuccess && combinacoes.length === 0 && (
                      <FormDescription>Não há QDD de {exercicio} importado. Peça ao Financeiro para importar o QDD.</FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="valor"
              render={({ field }) => (
                <FormItem className="sm:max-w-[16rem]">
                  <FormLabel>Valor reservado (R$) *</FormLabel>
                  <FormControl><Input inputMode="decimal" placeholder="0,00" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {escolhida && saldo.isSuccess && (
              <p className="text-sm" aria-live="polite">
                {saldo.data === null
                  ? "Esta combinação não tem dotação no QDD importado."
                  : <>Saldo livre da combinação{reserva ? " (sem esta reserva)" : ""}: <strong>{formatCurrency(saldo.data)}</strong></>}
              </p>
            )}

            {precisaJustificar && (
              <>
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  <AlertDescription>
                    {falta === null
                      ? "Sem dotação no QDD para esta combinação. Só dá para reservar com justificativa."
                      : `Faltam ${formatCurrency(falta as number)} no saldo livre. Só dá para reservar com justificativa (ex.: suplementação pedida).`}
                  </AlertDescription>
                </Alert>
                <FormField
                  control={form.control}
                  name="justificativa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Justificativa *</FormLabel>
                      <FormControl><Textarea rows={3} placeholder="Ex.: suplementação pedida no processo 17302.000900/2026.11" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={salvando}>Salvar reserva</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
