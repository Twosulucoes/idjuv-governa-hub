/**
 * Gera a remessa OBN600 (ordens bancárias de crédito em conta) dos pagamentos escolhidos.
 * Código do cliente, UG, gestão e conta pagadora vêm de `contas_autarquia` (aba "Contas pagadoras"); o banco reserva o nº da remessa, monta
 * as OBs (favorecido e conta) e o arquivo sai só desse retrato. Se algo falhar depois da reserva, a tela oferece
 * cancelar a reserva.
 */

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, FileDown, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ErroRemessaReservada,
  useCancelarRemessaBancaria,
  useContasPagadorasObn,
  useGerarRemessaObn600,
} from "@/hooks/useConciliacaoBancaria";
import { formatCurrency } from "@/lib/formatters";
import type { PagamentoParaRemessa } from "@/types/conciliacaoBancaria";

const hojeIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const schema = z.object({
  conta_id: z.string().min(1, "Escolha a conta pagadora"),
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data das ordens bancárias")
    .refine((v) => v >= hojeIso(), "A data não pode ser no passado"),
  sequencial_minimo: z
    .string()
    .trim()
    .regex(/^\d{0,5}$/, "Número com até 5 dígitos")
    .optional(),
});

type Dados = z.infer<typeof schema>;

interface Props {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  pagamentos: PagamentoParaRemessa[];
  /** Chamado depois de gerar (para limpar a seleção) */
  onGerado?: () => void;
  /** Leva à aba "Contas pagadoras" (quando falta cadastrar a conta) */
  aoAbrirContas?: () => void;
}

export function GerarRemessaObnDialog({ aberto, onOpenChange, pagamentos, onGerado, aoAbrirContas }: Props) {
  const contas = useContasPagadorasObn();
  const gerar = useGerarRemessaObn600();
  const cancelar = useCancelarRemessaBancaria();
  const [reserva, setReserva] = useState<{ id: string; nsa: number; mensagem: string } | null>(null);

  useEffect(() => {
    if (aberto) setReserva(null);
  }, [aberto]);

  const form = useForm<Dados>({
    resolver: zodResolver(schema),
    defaultValues: { conta_id: "", data: hojeIso(), sequencial_minimo: "" },
  });

  // Uma conta só: já vem escolhida
  useEffect(() => {
    if (aberto && contas.data?.length === 1 && !form.getValues("conta_id")) {
      form.setValue("conta_id", contas.data[0].id);
    }
  }, [aberto, contas.data, form]);

  const total = pagamentos.reduce((s, p) => s + Number(p.valor_liquido), 0);
  const ocupado = gerar.isPending || cancelar.isPending;

  const fechar = (v: boolean) => {
    if (ocupado) return;
    onOpenChange(v);
  };

  const enviar = async (d: Dados) => {
    setReserva(null);
    try {
      await gerar.mutateAsync({
        contaId: d.conta_id,
        pagamentoIds: pagamentos.map((p) => p.id),
        dataPagamento: d.data,
        sequencialMinimo: d.sequencial_minimo ? Number(d.sequencial_minimo) : null,
      });
    } catch (e) {
      // O toast já mostrou o erro; com o número reservado, oferece liberar a reserva
      if (e instanceof ErroRemessaReservada) setReserva({ id: e.remessaId, nsa: e.nsa, mensagem: e.message });
      return;
    }
    onGerado?.();
    onOpenChange(false);
  };

  const cancelarReserva = async () => {
    if (!reserva) return;
    try {
      await cancelar.mutateAsync(reserva.id);
      setReserva(null);
    } catch {
      // toast de erro já exibido pela mutation
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={fechar}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerar remessa OBN600</DialogTitle>
          <DialogDescription>
            {pagamentos.length} pagamento(s) · {formatCurrency(total)}. O arquivo é baixado para você enviar ao banco;
            o retorno volta pela importação de arquivos e dá a baixa nos pagamentos.
          </DialogDescription>
        </DialogHeader>

        {contas.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" aria-hidden />
            <AlertTitle>Não foi possível carregar as contas pagadoras</AlertTitle>
          </Alert>
        ) : contas.data && contas.data.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" aria-hidden />
            <AlertTitle>Nenhuma conta com os dados do OBN600</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>Cadastre o código do cliente no BB, a UG e a gestão na conta da instituição e volte aqui.</p>
              {aoAbrirContas && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    aoAbrirContas();
                  }}
                >
                  Abrir contas pagadoras
                </Button>
              )}
            </AlertDescription>
          </Alert>
        ) : null}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(enviar)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="conta_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conta pagadora</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={contas.isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={contas.isLoading ? "Carregando…" : "Escolha a conta"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contas.data?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.descricao} · UG {c.obn_unidade_gestora}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="data"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data das ordens bancárias</FormLabel>
                  <FormControl>
                    <Input type="date" min={hojeIso()} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sequencial_minimo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nº da remessa (só na primeira)</FormLabel>
                  <FormControl>
                    <Input inputMode="numeric" maxLength={5} placeholder="Opcional" {...field} />
                  </FormControl>
                  <FormDescription>
                    Na primeira remessa desta conta, informe o número que continua a numeração de hoje (posições 48 a
                    52 do header). Depois o sistema segue sozinho e este campo é ignorado.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {reserva && (
              <Alert variant="destructive" aria-live="polite">
                <AlertCircle className="h-4 w-4" aria-hidden />
                <AlertTitle>A remessa nº {reserva.nsa} ficou reservada sem arquivo</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>{reserva.mensagem}</p>
                  <p>Cancele a reserva para liberar os pagamentos antes de tentar de novo.</p>
                  <Button type="button" size="sm" variant="outline" onClick={cancelarReserva} disabled={ocupado}>
                    {cancelar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
                    Cancelar reserva
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => fechar(false)} disabled={ocupado}>
                Cancelar
              </Button>
              <Button type="submit" disabled={ocupado || !contas.data?.length}>
                {ocupado ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <FileDown className="mr-2 h-4 w-4" aria-hidden />
                )}
                Gerar e baixar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
