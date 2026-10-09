/**
 * Formulário de férias (criar/editar) com as regras de `@/lib/feriasRegras`:
 * saldo de 30 dias por período aquisitivo, parcelas (até 3), abono pecuniário
 * (até 10 dias) e sobreposição com férias, licenças e cessões do servidor.
 *
 * Edição: `programada` libera tudo; `em_gozo` só data de fim, parcela, portaria
 * e observações; demais status não editam (o botão nem abre o diálogo).
 */

import { useEffect, useMemo, useRef } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Loader2, Sun } from "lucide-react";
import { toast } from "sonner";
import {
  useCriarFerias,
  useAtualizarFerias,
  useFeriasServidor,
  useOcupacoesServidor,
  type ServidorParaFerias,
} from "@/hooks/useFerias";
import {
  DIAS_FERIAS_ANO,
  MAX_DIAS_ABONO,
  MAX_PARCELAS,
  calcularDias,
  calcularSaldoPeriodo,
  camposEditaveisPorStatus,
  detectarSobreposicao,
  registrosDoPeriodo,
  sugerirPeriodoAquisitivo,
  validarAbono,
  validarParcelas,
} from "@/lib/feriasRegras";
import type { FeriasServidor, FeriasServidorInput } from "@/types/rh";

const schemaBase = z.object({
  servidor_id: z.string().min(1, "Selecione o servidor"),
  periodo_aquisitivo_inicio: z.string().min(1, "Informe o início do período aquisitivo"),
  periodo_aquisitivo_fim: z.string().min(1, "Informe o fim do período aquisitivo"),
  data_inicio: z.string().min(1, "Informe o início do gozo"),
  data_fim: z.string().min(1, "Informe o fim do gozo"),
  parcela: z.coerce.number().int("Informe um número inteiro").min(1, "Mínimo 1"),
  total_parcelas: z.coerce.number().int("Informe um número inteiro").min(1, "Mínimo 1").max(MAX_PARCELAS, `Máximo ${MAX_PARCELAS}`),
  abono_pecuniario: z.boolean(),
  dias_abono: z.coerce.number().int("Informe um número inteiro").min(0, "Não pode ser negativo"),
  portaria_numero: z.string().optional(),
  portaria_data: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof schemaBase>;

interface FeriasFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servidores: ServidorParaFerias[];
  /** Registro em edição; ausente = criar. */
  ferias?: FeriasServidor | null;
}

export function FeriasFormDialog({ open, onOpenChange, servidores, ferias }: FeriasFormDialogProps) {
  const editando = !!ferias;
  const modoEdicao = camposEditaveisPorStatus(ferias?.status);
  const bloqueiaTudo = editando && modoEdicao === "nenhum";
  const somenteParcial = editando && modoEdicao === "parcial";

  const criar = useCriarFerias();
  const atualizar = useAtualizarFerias();
  const salvando = criar.isPending || atualizar.isPending;

  // Resolver dinâmico: as regras dependem das férias/ocupações já carregadas do servidor.
  const schemaRef = useRef<z.ZodTypeAny>(schemaBase);
  const resolver: Resolver<FormData> = (values, context, options) =>
    zodResolver(schemaRef.current)(values, context, options);

  const form = useForm<FormData>({
    resolver,
    defaultValues: {
      servidor_id: "",
      periodo_aquisitivo_inicio: "",
      periodo_aquisitivo_fim: "",
      data_inicio: "",
      data_fim: "",
      parcela: 1,
      total_parcelas: 1,
      abono_pecuniario: false,
      dias_abono: 0,
      portaria_numero: "",
      portaria_data: "",
      observacoes: "",
    },
  });

  const servidorId = form.watch("servidor_id");
  const paInicio = form.watch("periodo_aquisitivo_inicio");
  const paFim = form.watch("periodo_aquisitivo_fim");
  const dataInicio = form.watch("data_inicio");
  const dataFim = form.watch("data_fim");
  const abonoMarcado = form.watch("abono_pecuniario");
  const diasCalculados = calcularDias(dataInicio, dataFim);

  const { data: feriasServidor = [] } = useFeriasServidor(servidorId);
  const { data: ocupacoes = [] } = useOcupacoesServidor(servidorId);

  // Preenche o formulário ao abrir (criar ou editar).
  useEffect(() => {
    if (!open) return;
    form.reset({
      servidor_id: ferias?.servidor_id ?? "",
      periodo_aquisitivo_inicio: ferias?.periodo_aquisitivo_inicio ?? "",
      periodo_aquisitivo_fim: ferias?.periodo_aquisitivo_fim ?? "",
      data_inicio: ferias?.data_inicio ?? "",
      data_fim: ferias?.data_fim ?? "",
      parcela: ferias?.parcela ?? 1,
      total_parcelas: ferias?.total_parcelas ?? 1,
      abono_pecuniario: ferias?.abono_pecuniario ?? false,
      dias_abono: ferias?.dias_abono ?? 0,
      portaria_numero: ferias?.portaria_numero ?? "",
      portaria_data: ferias?.portaria_data ?? "",
      observacoes: ferias?.observacoes ?? "",
    });
  }, [open, ferias, form]);

  // Ao escolher o servidor (só no criar), sugere o período aquisitivo pela data de admissão.
  const sugerirPA = (id: string) => {
    const servidor = servidores.find((s) => s.id === id);
    const pa = sugerirPeriodoAquisitivo(servidor?.data_admissao);
    if (pa) {
      form.setValue("periodo_aquisitivo_inicio", pa.inicio, { shouldDirty: true });
      form.setValue("periodo_aquisitivo_fim", pa.fim, { shouldDirty: true });
    }
  };

  // Saldo do PA informado, desconsiderando o próprio registro em edição.
  const saldoPA = useMemo(() => {
    if (!paInicio || !paFim) return null;
    const outros = feriasServidor.filter((f) => f.id !== ferias?.id);
    return calcularSaldoPeriodo(outros, { inicio: paInicio, fim: paFim });
  }, [feriasServidor, paInicio, paFim, ferias?.id]);

  // Schema completo com as regras de negócio, recriado quando os dados do servidor mudam.
  schemaRef.current = useMemo(
    () =>
      schemaBase.superRefine((d, ctx) => {
        if (d.periodo_aquisitivo_fim < d.periodo_aquisitivo_inicio) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["periodo_aquisitivo_fim"], message: "O fim do período aquisitivo não pode ser antes do início" });
        }
        if (d.data_fim < d.data_inicio) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["data_fim"], message: "O fim do gozo não pode ser antes do início" });
          return;
        }
        const dias = calcularDias(d.data_inicio, d.data_fim);

        for (const msg of validarAbono(d.dias_abono, d.abono_pecuniario)) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dias_abono"], message: msg });
        }

        const doPA = registrosDoPeriodo(feriasServidor, { inicio: d.periodo_aquisitivo_inicio, fim: d.periodo_aquisitivo_fim });
        const errosParcelas = validarParcelas(doPA, {
          id: ferias?.id,
          dias_gozados: dias,
          dias_abono: d.abono_pecuniario ? d.dias_abono : 0,
          parcela: d.parcela,
          total_parcelas: d.total_parcelas,
        });
        for (const msg of errosParcelas) {
          const path = msg.includes("total de parcelas") ? "total_parcelas" : msg.includes("limite") ? "data_fim" : "parcela";
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message: msg });
        }

        const conflitos = detectarSobreposicao({ id: ferias?.id, inicio: d.data_inicio, fim: d.data_fim }, ocupacoes);
        if (conflitos.length > 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["root"],
            message: `Período sobrepõe: ${conflitos.map((c) => c.descricao).join("; ")}`,
          });
        }
      }),
    [feriasServidor, ocupacoes, ferias?.id],
  );

  const onSubmit = async (d: FormData) => {
    const dias = calcularDias(d.data_inicio, d.data_fim);
    const input: FeriasServidorInput = {
      servidor_id: d.servidor_id,
      periodo_aquisitivo_inicio: d.periodo_aquisitivo_inicio,
      periodo_aquisitivo_fim: d.periodo_aquisitivo_fim,
      data_inicio: d.data_inicio,
      data_fim: d.data_fim,
      dias_gozados: dias,
      abono_pecuniario: d.abono_pecuniario,
      dias_abono: d.abono_pecuniario ? d.dias_abono : null,
      parcela: d.parcela,
      total_parcelas: d.total_parcelas,
      portaria_numero: d.portaria_numero || null,
      portaria_data: d.portaria_data || null,
      observacoes: d.observacoes || null,
    };
    try {
      if (editando) {
        // Em gozo: só os campos liberados vão para o banco.
        const parcial: Partial<FeriasServidorInput> = somenteParcial
          ? {
              data_fim: input.data_fim,
              dias_gozados: input.dias_gozados,
              parcela: input.parcela,
              portaria_numero: input.portaria_numero,
              portaria_data: input.portaria_data,
              observacoes: input.observacoes,
            }
          : input;
        await atualizar.mutateAsync({ id: ferias!.id, ...parcial });
        toast.success("Férias atualizadas com sucesso!");
      } else {
        await criar.mutateAsync({ ...input, status: "programada" });
        toast.success("Férias cadastradas com sucesso!");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(`Erro ao salvar férias: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const erroRoot = form.formState.errors.root?.message;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-primary" />
            {editando ? "Editar Férias" : "Programar Férias"}
          </DialogTitle>
          <DialogDescription>
            {DIAS_FERIAS_ANO} dias por período aquisitivo, em até {MAX_PARCELAS} parcelas; abono pecuniário de até {MAX_DIAS_ABONO} dias.
            {somenteParcial && " Férias em gozo: só data de fim, parcela, portaria e observações podem ser alteradas."}
          </DialogDescription>
        </DialogHeader>

        {bloqueiaTudo && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Edição não permitida</AlertTitle>
            <AlertDescription>Férias concluídas, interrompidas ou canceladas não podem ser editadas.</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="servidor_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Servidor *</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      sugerirPA(v);
                    }}
                    disabled={editando}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o servidor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {servidores.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.nome_completo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="periodo_aquisitivo_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Início do Período Aquisitivo *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={somenteParcial || bloqueiaTudo} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="periodo_aquisitivo_fim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fim do Período Aquisitivo *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={somenteParcial || bloqueiaTudo} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {saldoPA && (
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <span className="font-medium">Saldo do período aquisitivo:</span>{" "}
                <span className={saldoPA.saldo <= 0 ? "text-destructive font-semibold" : "text-foreground font-semibold"}>
                  {saldoPA.saldo} de {DIAS_FERIAS_ANO} dias
                </span>
                <span className="text-muted-foreground"> (gozados {saldoPA.usados}, abono {saldoPA.abono}{editando ? ", sem contar este lançamento" : ""})</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="data_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Início do Gozo *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={somenteParcial || bloqueiaTudo} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data_fim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fim do Gozo *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={bloqueiaTudo} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>Dias</FormLabel>
                <FormControl>
                  <Input type="number" value={diasCalculados} readOnly className="bg-muted" />
                </FormControl>
                <FormDescription>Dias corridos, calculado.</FormDescription>
              </FormItem>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="parcela"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parcela</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={MAX_PARCELAS} {...field} disabled={bloqueiaTudo} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="total_parcelas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total de Parcelas</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={MAX_PARCELAS} {...field} disabled={somenteParcial || bloqueiaTudo} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 items-start">
              <FormField
                control={form.control}
                name="abono_pecuniario"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0 pt-8">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) => {
                          field.onChange(v === true);
                          if (v !== true) form.setValue("dias_abono", 0);
                        }}
                        disabled={somenteParcial || bloqueiaTudo}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Abono pecuniário (venda de 1/3)</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dias_abono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dias de Abono</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={MAX_DIAS_ABONO} {...field} disabled={!abonoMarcado || somenteParcial || bloqueiaTudo} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="portaria_numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número da Portaria</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={bloqueiaTudo} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="portaria_data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Portaria</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={bloqueiaTudo} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} disabled={bloqueiaTudo} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {erroRoot && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Sobreposição de períodos</AlertTitle>
                <AlertDescription>{erroRoot}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvando || bloqueiaTudo}>
                {salvando && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editando ? "Salvar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
