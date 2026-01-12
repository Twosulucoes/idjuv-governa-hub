import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, X } from "lucide-react";
import { useSaveRubrica } from "@/hooks/useFolhaPagamento";
import type { Rubrica, TipoRubrica, TipoCalculoRubrica } from "@/types/folha";
import { TIPO_RUBRICA_LABELS, TIPO_CALCULO_LABELS } from "@/types/folha";

const rubricaSchema = z.object({
  codigo: z.string().min(1, "Código é obrigatório"),
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  tipo: z.enum(["provento", "desconto", "neutro", "informativo"]),
  tipo_calculo: z.enum(["fixo", "percentual_base", "percentual_bruto", "formula", "referencia", "manual"]),
  percentual: z.coerce.number().min(0).max(100).optional(),
  valor_fixo: z.coerce.number().min(0).optional(),
  formula_calculo: z.string().optional(),
  incidencia_irrf: z.boolean().default(false),
  incidencia_inss: z.boolean().default(false),
  incidencia_fgts: z.boolean().default(false),
  ativa: z.boolean().default(true),
  ordem_calculo: z.coerce.number().int().min(1).default(100),
  descricao: z.string().optional(),
});

type RubricaFormData = z.infer<typeof rubricaSchema>;

interface RubricaFormProps {
  rubrica?: Rubrica | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RubricaForm({ rubrica, onSuccess, onCancel }: RubricaFormProps) {
  const saveRubrica = useSaveRubrica();

  const form = useForm<RubricaFormData>({
    resolver: zodResolver(rubricaSchema),
    defaultValues: {
      codigo: rubrica?.codigo || "",
      nome: rubrica?.nome || "",
      tipo: (rubrica?.tipo as TipoRubrica) || "provento",
      tipo_calculo: (rubrica?.tipo_calculo as TipoCalculoRubrica) || "manual",
      percentual: rubrica?.percentual || undefined,
      valor_fixo: rubrica?.valor_fixo || undefined,
      formula_calculo: rubrica?.formula_calculo || "",
      incidencia_irrf: rubrica?.incidencia_irrf ?? false,
      incidencia_inss: rubrica?.incidencia_inss ?? false,
      incidencia_fgts: rubrica?.incidencia_fgts ?? false,
      ativa: rubrica?.ativa ?? true,
      ordem_calculo: rubrica?.ordem_calculo || 100,
      descricao: rubrica?.descricao || "",
    },
  });

  const tipoCalculo = form.watch("tipo_calculo");

  const onSubmit = (data: RubricaFormData) => {
    saveRubrica.mutate(
      {
        ...data,
        id: rubrica?.id,
      },
      {
        onSuccess: () => {
          onSuccess?.();
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="codigo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="001" className="font-mono" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ordem_calculo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ordem de Cálculo</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min={1} />
                </FormControl>
                <FormDescription>Define a sequência de processamento</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Nome da rubrica" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(TIPO_RUBRICA_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
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
            name="tipo_calculo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Cálculo *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Como calcular" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(TIPO_CALCULO_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Campos condicionais baseados no tipo de cálculo */}
        {(tipoCalculo === "percentual_base" || tipoCalculo === "percentual_bruto") && (
          <FormField
            control={form.control}
            name="percentual"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Percentual (%)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.01" min={0} max={100} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {tipoCalculo === "fixo" && (
          <FormField
            control={form.control}
            name="valor_fixo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor Fixo (R$)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.01" min={0} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {tipoCalculo === "formula" && (
          <FormField
            control={form.control}
            name="formula_calculo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fórmula de Cálculo</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Descreva a fórmula de cálculo" rows={3} />
                </FormControl>
                <FormDescription>
                  Use variáveis como SALARIO_BASE, BRUTO, HORAS_TRAB, etc.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Descrição detalhada da rubrica" rows={2} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Incidências */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Incidências Tributárias</h4>
          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="incidencia_inss"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>INSS</FormLabel>
                    <FormDescription className="text-xs">
                      Incide contribuição previdenciária
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="incidencia_irrf"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>IRRF</FormLabel>
                    <FormDescription className="text-xs">
                      Incide imposto de renda
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="incidencia_fgts"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>FGTS</FormLabel>
                    <FormDescription className="text-xs">
                      Incide FGTS (se aplicável)
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="ativa"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Rubrica Ativa</FormLabel>
                <FormDescription>
                  Rubricas inativas não aparecem nas seleções e não são calculadas
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button type="submit" disabled={saveRubrica.isPending}>
            {saveRubrica.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar
          </Button>
        </div>
      </form>
    </Form>
  );
}
