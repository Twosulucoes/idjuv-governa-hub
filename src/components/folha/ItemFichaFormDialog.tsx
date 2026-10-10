/**
 * Inclusão/edição manual de um item (provento ou desconto) da ficha financeira.
 * A rubrica é opcional: ao escolher uma, descrição e tipo são preenchidos.
 * Totais da ficha e da folha são recalculados pelo hook; INSS/IRRF não (só no processamento).
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Loader2, Save } from "lucide-react";
import { useRubricas, useSaveItemFicha } from "@/hooks/useFolhaPagamento";
import { ORDEM_ITEM_MANUAL } from "@/lib/folhaFichaRegras";
import { TIPO_ITEM_FICHA_LABELS, type ItemFichaFinanceira, type TipoItemFicha } from "@/types/folha";

// Radix Select não aceita value "" — sentinela para "sem rubrica".
const SEM_RUBRICA = "__sem_rubrica__";

const schema = z.object({
  rubrica_id: z.string(),
  descricao: z.string().trim().min(3, "Descrição deve ter pelo menos 3 caracteres").max(200, "Máximo de 200 caracteres"),
  tipo: z.enum(["provento", "desconto"], { required_error: "Informe o tipo" }),
  valor: z.coerce.number({ invalid_type_error: "Informe um valor" }).positive("O valor deve ser maior que zero"),
  referencia: z.string().trim().max(50, "Máximo de 50 caracteres").optional(),
  ordem: z.coerce.number().int("Informe um número inteiro").min(0, "Não pode ser negativo"),
});

type ItemFormValues = z.infer<typeof schema>;

interface ItemFichaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fichaId: string;
  /** Item em edição; ausente = incluir. */
  item?: ItemFichaFinanceira | null;
}

export function ItemFichaFormDialog({ open, onOpenChange, fichaId, item }: ItemFichaFormDialogProps) {
  const editando = !!item;
  const { data: rubricas } = useRubricas(true);
  const salvar = useSaveItemFicha();

  // Só rubricas de provento/desconto podem virar item (CHECK da tabela).
  const rubricasElegiveis = (rubricas ?? []).filter((r) => r.tipo === "provento" || r.tipo === "desconto");

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      rubrica_id: SEM_RUBRICA,
      descricao: "",
      tipo: "provento",
      valor: 0,
      referencia: "",
      ordem: ORDEM_ITEM_MANUAL,
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      rubrica_id: item?.rubrica_id ?? SEM_RUBRICA,
      descricao: item?.descricao ?? "",
      tipo: (item?.tipo === "desconto" ? "desconto" : "provento") as TipoItemFicha,
      valor: item ? Number(item.valor) : 0,
      referencia: item?.referencia ?? "",
      ordem: item?.ordem ?? ORDEM_ITEM_MANUAL,
    });
  }, [open, item, form]);

  const aoEscolherRubrica = (rubricaId: string) => {
    form.setValue("rubrica_id", rubricaId, { shouldDirty: true });
    if (rubricaId === SEM_RUBRICA) return;
    const rubrica = rubricasElegiveis.find((r) => r.id === rubricaId);
    if (!rubrica) return;
    form.setValue("descricao", rubrica.descricao, { shouldDirty: true });
    form.setValue("tipo", rubrica.tipo as TipoItemFicha, { shouldDirty: true });
  };

  // Trocar o tipo à mão solta a rubrica de tipo diferente (item "provento" não pode apontar rubrica de desconto).
  const aoEscolherTipo = (tipo: string) => {
    form.setValue("tipo", tipo as TipoItemFicha, { shouldDirty: true });
    const rubricaId = form.getValues("rubrica_id");
    const rubrica = rubricasElegiveis.find((r) => r.id === rubricaId);
    if (rubrica && rubrica.tipo !== tipo) form.setValue("rubrica_id", SEM_RUBRICA, { shouldDirty: true });
  };

  const onSubmit = async (d: ItemFormValues) => {
    try {
      await salvar.mutateAsync({
        id: item?.id,
        ficha_id: fichaId,
        rubrica_id: d.rubrica_id === SEM_RUBRICA ? null : d.rubrica_id,
        descricao: d.descricao,
        tipo: d.tipo,
        valor: Math.round(d.valor * 100) / 100,
        referencia: d.referencia ? d.referencia : null,
        ordem: d.ordem,
        // Lançamento manual não tem base/percentual calculados.
        base_calculo: item?.base_calculo ?? null,
        percentual: item?.percentual ?? null,
      });
      onOpenChange(false);
    } catch {
      // Toast de erro já emitido pelo hook (descreverErroBanco).
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editando ? "Editar item da ficha" : "Incluir item na ficha"}</DialogTitle>
          <DialogDescription>
            Lançamento manual de provento ou desconto. Os totais da ficha e da folha são recalculados ao salvar.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            INSS e IRRF <strong>não</strong> são recalculados aqui — só no processamento da folha, que também apaga os
            itens lançados manualmente.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rubrica_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rubrica</FormLabel>
                  <Select value={field.value} onValueChange={aoEscolherRubrica}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sem rubrica" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={SEM_RUBRICA}>Sem rubrica (lançamento livre)</SelectItem>
                      {rubricasElegiveis.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.codigo} - {r.descricao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Opcional. Ao escolher, descrição e tipo são preenchidos.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Gratificação por encargo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select value={field.value} onValueChange={aoEscolherTipo}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Object.keys(TIPO_ITEM_FICHA_LABELS) as TipoItemFicha[]).map((t) => (
                          <SelectItem key={t} value={t}>{TIPO_ITEM_FICHA_LABELS[t]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$) *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="referencia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referência</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex.: 30 dias, nº do contrato" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ordem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordem</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormDescription>Posição na listagem ({ORDEM_ITEM_MANUAL} para manuais).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={salvar.isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvar.isPending}>
                {salvar.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {editando ? "Salvar alterações" : "Incluir item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
