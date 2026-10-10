/**
 * Cadastro/edição de consignação do servidor (aba Consignações da ficha financeira).
 * Margem consignável calculada no front sobre o líquido da ficha (`avaliarMargem`);
 * exceder a margem não bloqueia, mas exige confirmação explícita.
 */

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Loader2, Save } from "lucide-react";
import { useRubricas, useSaveConsignacao, type ConsignacaoRow } from "@/hooks/useFolhaPagamento";
import { avaliarMargem, type ConsignacaoParaMargem } from "@/lib/folhaFichaRegras";
import { formatCurrency } from "@/lib/formatters";
import { TIPO_CONSIGNACAO_LABELS } from "@/types/folha";

const SEM_RUBRICA = "__sem_rubrica__";
const COMPETENCIA_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

const schema = z
  .object({
    consignataria_nome: z.string().trim().min(3, "Informe a consignatária (mínimo 3 caracteres)").max(200),
    consignataria_cnpj: z.string().trim().optional(),
    numero_contrato: z.string().trim().min(1, "Informe o número do contrato").max(50, "Máximo de 50 caracteres"),
    tipo_consignacao: z.string().min(1, "Informe o tipo"),
    valor_parcela: z.coerce.number({ invalid_type_error: "Informe o valor" }).positive("A parcela deve ser maior que zero"),
    total_parcelas: z.coerce.number({ invalid_type_error: "Informe o total" }).int("Informe um número inteiro").min(1, "Mínimo 1 parcela"),
    parcelas_pagas: z.coerce.number({ invalid_type_error: "Informe as pagas" }).int("Informe um número inteiro").min(0, "Não pode ser negativo"),
    data_inicio: z.string().min(1, "Informe a data de início"),
    data_fim: z.string().optional(),
    competencia_inicio: z.string().optional(),
    competencia_fim: z.string().optional(),
    rubrica_id: z.string(),
    observacoes: z.string().trim().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.consignataria_cnpj && d.consignataria_cnpj.replace(/\D/g, "").length !== 14) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["consignataria_cnpj"], message: "CNPJ deve ter 14 dígitos" });
    }
    if (d.parcelas_pagas > d.total_parcelas) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["parcelas_pagas"], message: "Parcelas pagas não podem exceder o total" });
    }
    if (d.data_fim && d.data_fim < d.data_inicio) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["data_fim"], message: "A data de fim não pode ser antes do início" });
    }
    if (d.competencia_inicio && !COMPETENCIA_RE.test(d.competencia_inicio)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["competencia_inicio"], message: "Use o formato AAAA-MM" });
    }
    if (d.competencia_fim && !COMPETENCIA_RE.test(d.competencia_fim)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["competencia_fim"], message: "Use o formato AAAA-MM" });
    }
    if (d.competencia_inicio && d.competencia_fim && d.competencia_fim < d.competencia_inicio) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["competencia_fim"], message: "A competência final não pode ser antes da inicial" });
    }
  });

type ConsignacaoFormValues = z.infer<typeof schema>;

interface ConsignacaoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servidorId: string;
  /** Registro em edição; ausente = criar. */
  consignacao?: ConsignacaoRow | null;
  /** Líquido da ficha (base da margem) e percentual de margem vigente. */
  valorLiquido: number | null | undefined;
  percentualMargem: number | null | undefined;
  /** Demais consignações do servidor, para a margem usada. */
  consignacoes: ConsignacaoParaMargem[];
}

export function ConsignacaoFormDialog({
  open,
  onOpenChange,
  servidorId,
  consignacao,
  valorLiquido,
  percentualMargem,
  consignacoes,
}: ConsignacaoFormDialogProps) {
  const editando = !!consignacao;
  const salvar = useSaveConsignacao();
  const { data: rubricas } = useRubricas(true);
  const rubricasDesconto = (rubricas ?? []).filter((r) => r.tipo === "desconto");
  const [confirmaExcesso, setConfirmaExcesso] = useState(false);

  const form = useForm<ConsignacaoFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      consignataria_nome: "",
      consignataria_cnpj: "",
      numero_contrato: "",
      tipo_consignacao: "emprestimo",
      valor_parcela: 0,
      total_parcelas: 1,
      parcelas_pagas: 0,
      data_inicio: "",
      data_fim: "",
      competencia_inicio: "",
      competencia_fim: "",
      rubrica_id: SEM_RUBRICA,
      observacoes: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    setConfirmaExcesso(false);
    form.reset({
      consignataria_nome: consignacao?.consignataria_nome ?? "",
      consignataria_cnpj: consignacao?.consignataria_cnpj ?? "",
      numero_contrato: consignacao?.numero_contrato ?? "",
      tipo_consignacao: consignacao?.tipo_consignacao ?? "emprestimo",
      valor_parcela: consignacao ? Number(consignacao.valor_parcela) : 0,
      total_parcelas: consignacao?.total_parcelas ?? 1,
      parcelas_pagas: consignacao?.parcelas_pagas ?? 0,
      data_inicio: consignacao?.data_inicio?.slice(0, 10) ?? "",
      data_fim: consignacao?.data_fim?.slice(0, 10) ?? "",
      competencia_inicio: consignacao?.competencia_inicio ?? "",
      competencia_fim: consignacao?.competencia_fim ?? "",
      rubrica_id: consignacao?.rubrica_id ?? SEM_RUBRICA,
      observacoes: consignacao?.observacoes ?? "",
    });
  }, [open, consignacao, form]);

  const valorParcela = Number(form.watch("valor_parcela")) || 0;
  const totalParcelas = Number(form.watch("total_parcelas")) || 0;
  const parcelasPagas = Number(form.watch("parcelas_pagas")) || 0;

  const margem = useMemo(
    () => avaliarMargem(valorLiquido, percentualMargem, consignacoes, valorParcela, consignacao?.id),
    [valorLiquido, percentualMargem, consignacoes, valorParcela, consignacao?.id],
  );
  const semParametroMargem = !percentualMargem;

  const onSubmit = async (d: ConsignacaoFormValues) => {
    if (margem.excede && !confirmaExcesso) {
      form.setError("root", { message: "A parcela excede a margem disponível. Marque a confirmação para prosseguir." });
      return;
    }
    const valorTotal = Math.round(d.valor_parcela * d.total_parcelas * 100) / 100;
    const saldo = Math.round(d.valor_parcela * (d.total_parcelas - d.parcelas_pagas) * 100) / 100;
    try {
      await salvar.mutateAsync({
        id: consignacao?.id,
        servidor_id: servidorId,
        consignataria_nome: d.consignataria_nome,
        consignataria_cnpj: d.consignataria_cnpj ? d.consignataria_cnpj : null,
        numero_contrato: d.numero_contrato,
        tipo_consignacao: d.tipo_consignacao,
        valor_parcela: d.valor_parcela,
        total_parcelas: d.total_parcelas,
        parcelas_pagas: d.parcelas_pagas,
        valor_total: valorTotal,
        saldo_devedor: saldo,
        data_inicio: d.data_inicio,
        data_fim: d.data_fim ? d.data_fim : null,
        competencia_inicio: d.competencia_inicio ? d.competencia_inicio : null,
        competencia_fim: d.competencia_fim ? d.competencia_fim : null,
        rubrica_id: d.rubrica_id === SEM_RUBRICA ? null : d.rubrica_id,
        observacoes: d.observacoes ? d.observacoes : null,
        // Saldo zerado quita automaticamente; demais flags só no criar (ações da aba cuidam da edição).
        ...(editando ? {} : { ativo: true, suspenso: false }),
        quitado: saldo <= 0,
      });
      onOpenChange(false);
    } catch {
      // Toast de erro já emitido pelo hook (descreverErroBanco).
    }
  };

  const erroRoot = form.formState.errors.root?.message;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editando ? "Editar consignação" : "Nova consignação"}</DialogTitle>
          <DialogDescription>
            Desconto autorizado em folha (empréstimo, plano de saúde, mensalidade etc.). A margem é calculada sobre o
            líquido desta ficha.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
          {semParametroMargem ? (
            <span className="text-muted-foreground">
              Parâmetro <code>margem_consignavel</code> não encontrado para a competência — margem não avaliada.
            </span>
          ) : (
            <>
              <span className="font-medium">Margem:</span> {formatCurrency(margem.margem)} ({percentualMargem}% de{" "}
              {formatCurrency(margem.base)}) · <span className="font-medium">usada:</span> {formatCurrency(margem.usada)} ·{" "}
              <span className="font-medium">disponível:</span>{" "}
              <span className={margem.disponivel < 0 ? "text-destructive font-semibold" : "font-semibold"}>
                {formatCurrency(margem.disponivel)}
              </span>
            </>
          )}
        </div>

        {margem.excede && !semParametroMargem && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Parcela acima da margem disponível</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                A parcela de {formatCurrency(valorParcela)} excede a margem disponível de {formatCurrency(margem.disponivel)}.
                O banco não bloqueia o cadastro; a decisão é sua.
              </p>
              <div className="flex items-center gap-2">
                <Checkbox id="confirma-excesso" checked={confirmaExcesso} onCheckedChange={(v) => setConfirmaExcesso(v === true)} />
                <Label htmlFor="confirma-excesso" className="text-sm">Confirmo o lançamento acima da margem</Label>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="consignataria_nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consignatária *</FormLabel>
                    <FormControl>
                      <Input placeholder="Banco, operadora, associação..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="consignataria_cnpj"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl>
                      <Input placeholder="00.000.000/0000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="numero_contrato"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº do contrato *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>Usado como referência do desconto ao lançar na ficha.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tipo_consignacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(TIPO_CONSIGNACAO_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="valor_parcela"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor da parcela (R$) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min={0} {...field} />
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
                    <FormLabel>Total de parcelas *</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="parcelas_pagas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parcelas pagas</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <p className="text-sm text-muted-foreground">
              Total do contrato: <span className="font-medium text-foreground">{formatCurrency(valorParcela * totalParcelas)}</span> · saldo
              devedor: <span className="font-medium text-foreground">{formatCurrency(valorParcela * Math.max(totalParcelas - parcelasPagas, 0))}</span>
            </p>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de início *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    <FormLabel>Data de fim</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="competencia_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competência inicial</FormLabel>
                    <FormControl>
                      <Input type="month" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="competencia_fim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Competência final</FormLabel>
                    <FormControl>
                      <Input type="month" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="rubrica_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rubrica de desconto</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sem rubrica" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={SEM_RUBRICA}>Sem rubrica</SelectItem>
                      {rubricasDesconto.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.codigo} - {r.descricao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Opcional; vai para o item quando a consignação é lançada na ficha.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {erroRoot && <p className="text-sm font-medium text-destructive">{erroRoot}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={salvar.isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvar.isPending}>
                {salvar.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {editando ? "Salvar alterações" : "Cadastrar consignação"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
