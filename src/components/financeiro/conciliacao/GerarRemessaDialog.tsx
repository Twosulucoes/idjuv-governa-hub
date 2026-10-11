/**
 * Gera o arquivo de reenvio dos recusados no leiaute do BB Gestão MAX (CNAB 240).
 * Conta pagadora e convênio vêm de `contas_autarquia`; CNPJ, nome e endereço do pagador, de
 * `config_autarquia` (ou do perfil do tenant). O NSA é reservado no banco antes de gerar.
 */

import { useEffect, useMemo } from "react";
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
  useContasPagadoras,
  useDadosPagador,
  useGerarRemessaGestaoMax,
  type GerarRemessaInput,
} from "@/hooks/useConciliacaoBancaria";
import { validarRemessaGestaoMax } from "@/lib/bancario/gestaoMaxCnab240";
import { separarDigito } from "@/lib/cnabGenerator";
import { formatCurrency } from "@/lib/formatters";
import type { CorrecaoBancaria, MovimentoBancario } from "@/types/conciliacaoBancaria";

const hojeIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const schema = z.object({
  conta_id: z.string().min(1, "Escolha a conta pagadora"),
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data do crédito")
    .refine((v) => v >= hojeIso(), "A data do crédito não pode ser no passado"),
  servico: z.enum(["98", "30"]),
  nsa_minimo: z
    .string()
    .trim()
    .regex(/^\d{0,6}$/, "Número com até 6 dígitos")
    .optional(),
});

type Dados = z.infer<typeof schema>;

interface Props {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  movimentos: MovimentoBancario[];
  correcoes: Map<string, CorrecaoBancaria>;
  /** Chamado depois de gerar (para limpar a seleção) */
  onGerado?: () => void;
}

export function GerarRemessaDialog({ aberto, onOpenChange, movimentos, correcoes, onGerado }: Props) {
  const contas = useContasPagadoras();
  const pagador = useDadosPagador();
  const gerar = useGerarRemessaGestaoMax();

  const form = useForm<Dados>({
    resolver: zodResolver(schema),
    defaultValues: { conta_id: "", data: hojeIso(), servico: "98", nsa_minimo: "" },
  });

  // Uma conta só: já vem escolhida
  useEffect(() => {
    if (aberto && contas.data?.length === 1 && !form.getValues("conta_id")) {
      form.setValue("conta_id", contas.data[0].id);
    }
  }, [aberto, contas.data, form]);

  const data = form.watch("data");
  const servico = form.watch("servico");
  const contaId = form.watch("conta_id");
  const conta = contas.data?.find((c) => c.id === contaId);

  const creditos = useMemo<GerarRemessaInput["movimentos"]>(
    () =>
      movimentos.map((m) => {
        const c = correcoes.get(m.id);
        const ag = separarDigito(m.agencia);
        const ct = separarDigito(m.conta);
        return {
          id: m.id,
          credito: {
            identificador: m.identificador,
            nome: m.favorecido_nome ?? "",
            documento: m.favorecido_documento ?? "",
            banco: c?.banco ?? m.banco ?? "",
            agencia: c?.agencia ?? ag.numero,
            agencia_dv: c?.agencia_dv ?? ag.digito,
            conta: c?.conta ?? ct.numero,
            conta_dv: c?.conta_dv ?? ct.digito,
            valor: Number(m.valor),
            data,
          },
        };
      }),
    [movimentos, correcoes, data],
  );

  // Conferência prévia (o NSA real só existe depois da reserva no banco)
  const faltas = useMemo(() => {
    if (!pagador.data || !conta) return [];
    return validarRemessaGestaoMax({
      pagador: {
        ...pagador.data,
        convenio: conta.convenio_pagamento ?? "",
        agencia: conta.agencia,
        agenciaDigito: conta.agencia_digito ?? "",
        conta: conta.conta,
        contaDigito: conta.conta_digito ?? "",
      },
      nsa: 1,
      dataGeracao: new Date(),
      creditos: creditos.map(({ credito: { identificador, ...c } }) => ({ ...c, seu_numero: identificador })),
    });
  }, [pagador.data, conta, creditos]);

  const total = movimentos.reduce((s, m) => s + Number(m.valor), 0);
  const ocupado = gerar.isPending;

  const fechar = (v: boolean) => {
    if (ocupado) return;
    onOpenChange(v);
  };

  const enviar = async (d: Dados) => {
    if (!conta || !pagador.data || faltas.length) return;
    await gerar.mutateAsync({
      conta,
      pagador: pagador.data,
      movimentos: creditos,
      servicoCreditoBB: d.servico,
      nsaMinimo: d.nsa_minimo ? Number(d.nsa_minimo) : null,
    });
    onGerado?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={aberto} onOpenChange={fechar}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerar arquivo para o Gestão MAX</DialogTitle>
          <DialogDescription>
            {movimentos.length} crédito(s) · {formatCurrency(total)}. O arquivo é baixado para você enviar no Gestão
            MAX; o retorno do banco volta pela importação de arquivos.
          </DialogDescription>
        </DialogHeader>

        {contas.isError || pagador.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" aria-hidden />
            <AlertTitle>Não foi possível carregar a conta pagadora ou os dados do pagador</AlertTitle>
          </Alert>
        ) : contas.data && contas.data.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" aria-hidden />
            <AlertTitle>Nenhuma conta com convênio de pagamento</AlertTitle>
            <AlertDescription>
              Cadastre o convênio de pagamento do BB na conta da instituição (Configurações da Folha → Bancos) e volte
              aqui.
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
                          {c.descricao} · convênio {c.convenio_pagamento}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data do crédito</FormLabel>
                    <FormControl>
                      <Input type="date" min={hojeIso()} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="servico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de pagamento (BB)</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="98">Pagamentos diversos</SelectItem>
                        <SelectItem value="30">Salários</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="nsa_minimo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número do arquivo (NSA) mínimo</FormLabel>
                  <FormControl>
                    <Input inputMode="numeric" maxLength={6} placeholder="Opcional" {...field} />
                  </FormControl>
                  <FormDescription>
                    Use para continuar a numeração do Gestão MAX (o próximo número que ele espera). Em branco, segue a
                    numeração registrada no sistema.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {servico === "30" && (
              <p className="text-xs text-muted-foreground">
                Salários valem só para crédito no BB; outros bancos seguem como pagamentos diversos.
              </p>
            )}

            {faltas.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" aria-hidden />
                <AlertTitle>Faltam dados para gerar o arquivo</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4">
                    {faltas.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => fechar(false)} disabled={ocupado}>
                Cancelar
              </Button>
              <Button type="submit" disabled={ocupado || !conta || !pagador.data || faltas.length > 0}>
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
