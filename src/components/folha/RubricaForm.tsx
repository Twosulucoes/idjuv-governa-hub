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
import { TIPO_RUBRICA_LABELS, type TipoRubrica } from "@/types/folha";

const rubricaSchema = z.object({
  codigo: z.string().min(1, "Código é obrigatório"),
  descricao: z.string().min(3, "Descrição deve ter pelo menos 3 caracteres"),
  tipo: z.enum(["provento", "desconto", "encargo", "informativo"]),
  percentual: z.coerce.number().min(0).max(100).optional(),
  valor_fixo: z.coerce.number().min(0).optional(),
  incide_irrf: z.boolean().default(false),
  incide_inss: z.boolean().default(false),
  incide_fgts: z.boolean().default(false),
  ativo: z.boolean().default(true),
});

type RubricaFormData = z.infer<typeof rubricaSchema>;

interface RubricaData {
  id?: string;
  codigo: string;
  descricao: string;
  tipo: TipoRubrica;
  percentual?: number;
  valor_fixo?: number;
  incide_irrf?: boolean;
  incide_inss?: boolean;
  incide_fgts?: boolean;
  ativo?: boolean;
}

interface RubricaFormProps {
  rubrica?: RubricaData | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RubricaForm({ rubrica, onSuccess, onCancel }: RubricaFormProps) {
  const saveRubrica = useSaveRubrica();

  const form = useForm<RubricaFormData>({
    resolver: zodResolver(rubricaSchema),
    defaultValues: {
      codigo: rubrica?.codigo || "",
      descricao: rubrica?.descricao || "",
      tipo: rubrica?.tipo || "provento",
      percentual: rubrica?.percentual || undefined,
      valor_fixo: rubrica?.valor_fixo || undefined,
      incide_irrf: rubrica?.incide_irrf ?? false,
      incide_inss: rubrica?.incide_inss ?? false,
      incide_fgts: rubrica?.incide_fgts ?? false,
      ativo: rubrica?.ativo ?? true,
    },
  });

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
        </div>

        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição *</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Descrição detalhada da rubrica" rows={2} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
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
        </div>

        {/* Incidências */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Incidências Tributárias</h4>
          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="incide_inss"
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
              name="incide_irrf"
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
              name="incide_fgts"
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
          name="ativo"
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
