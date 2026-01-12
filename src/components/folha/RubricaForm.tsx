import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, X } from "lucide-react";
import { useSaveRubrica } from "@/hooks/useFolhaPagamento";
import { TIPO_RUBRICA_LABELS, type TipoRubrica } from "@/types/folha";

// Labels para campos do banco de dados
const NATUREZA_LABELS = {
  remuneratorio: "Remuneratório",
  indenizatorio: "Indenizatório",
  informativo: "Informativo",
} as const;

const FORMULA_TIPO_LABELS = {
  valor_fixo: "Valor Fixo",
  percentual_base: "Percentual sobre Base",
  quantidade_valor: "Quantidade × Valor",
  referencia_cargo: "Referência do Cargo",
  calculo_especial: "Cálculo Especial",
} as const;

const rubricaSchema = z.object({
  codigo: z.string().min(1, "Código é obrigatório").max(10, "Código deve ter no máximo 10 caracteres"),
  descricao: z.string().min(3, "Descrição deve ter pelo menos 3 caracteres"),
  tipo: z.enum(["provento", "desconto", "encargo", "informativo"]),
  natureza: z.enum(["remuneratorio", "indenizatorio", "informativo"]),
  formula_tipo: z.enum(["valor_fixo", "percentual_base", "quantidade_valor", "referencia_cargo", "calculo_especial"]),
  formula_valor: z.coerce.number().min(0).optional().nullable(),
  formula_referencia: z.string().max(50).optional().nullable(),
  incide_irrf: z.boolean().default(false),
  incide_inss: z.boolean().default(false),
  incide_fgts: z.boolean().default(false),
  incide_13: z.boolean().default(true),
  incide_ferias: z.boolean().default(true),
  vigencia_inicio: z.string().min(1, "Data de início é obrigatória"),
  vigencia_fim: z.string().optional().nullable(),
  codigo_esocial: z.string().max(10).optional().nullable(),
  ativo: z.boolean().default(true),
});

type RubricaFormData = z.infer<typeof rubricaSchema>;

interface RubricaData {
  id?: string;
  codigo: string;
  descricao: string;
  tipo: TipoRubrica;
  natureza?: string;
  formula_tipo?: string;
  formula_valor?: number | null;
  formula_referencia?: string | null;
  incide_irrf?: boolean;
  incide_inss?: boolean;
  incide_fgts?: boolean;
  incide_13?: boolean;
  incide_ferias?: boolean;
  vigencia_inicio?: string;
  vigencia_fim?: string | null;
  codigo_esocial?: string | null;
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
      natureza: (rubrica?.natureza as "remuneratorio" | "indenizatorio" | "informativo") || "remuneratorio",
      formula_tipo: (rubrica?.formula_tipo as "valor_fixo" | "percentual_base" | "quantidade_valor" | "referencia_cargo" | "calculo_especial") || "valor_fixo",
      formula_valor: rubrica?.formula_valor ?? undefined,
      formula_referencia: rubrica?.formula_referencia || "",
      incide_irrf: rubrica?.incide_irrf ?? false,
      incide_inss: rubrica?.incide_inss ?? false,
      incide_fgts: rubrica?.incide_fgts ?? false,
      incide_13: rubrica?.incide_13 ?? true,
      incide_ferias: rubrica?.incide_ferias ?? true,
      vigencia_inicio: rubrica?.vigencia_inicio?.split("T")[0] || new Date().toISOString().split("T")[0],
      vigencia_fim: rubrica?.vigencia_fim?.split("T")[0] || "",
      codigo_esocial: rubrica?.codigo_esocial || "",
      ativo: rubrica?.ativo ?? true,
    },
  });

  const formulaTipo = form.watch("formula_tipo");

  const onSubmit = (data: RubricaFormData) => {
    saveRubrica.mutate(
      {
        ...data,
        id: rubrica?.id,
        formula_valor: data.formula_valor || null,
        formula_referencia: data.formula_referencia || null,
        vigencia_fim: data.vigencia_fim || null,
        codigo_esocial: data.codigo_esocial || null,
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
        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="codigo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="001" className="font-mono" maxLength={10} />
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

          <FormField
            control={form.control}
            name="natureza"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Natureza *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(NATUREZA_LABELS).map(([key, label]) => (
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
                <Input {...field} placeholder="Descrição detalhada da rubrica" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Cálculo */}
        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="formula_tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Cálculo *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(FORMULA_TIPO_LABELS).map(([key, label]) => (
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
            name="formula_valor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {formulaTipo === "percentual_base" ? "Percentual (%)" : "Valor (R$)"}
                </FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    value={field.value ?? ""} 
                    type="number" 
                    step="0.01" 
                    min={0} 
                    placeholder={formulaTipo === "percentual_base" ? "Ex: 11.5" : "Ex: 500.00"}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="formula_referencia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Referência</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} placeholder="SALARIO_BASE" maxLength={50} />
                </FormControl>
                <FormDescription className="text-xs">
                  Usado para fórmulas/referências
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Vigência */}
        <div className="grid gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="vigencia_inicio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vigência Início *</FormLabel>
                <FormControl>
                  <Input {...field} type="date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vigencia_fim"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vigência Fim</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} type="date" />
                </FormControl>
                <FormDescription className="text-xs">Deixe vazio se indeterminado</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="codigo_esocial"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código eSocial</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} placeholder="1000" maxLength={10} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Incidências */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Incidências</h4>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            <FormField
              control={form.control}
              name="incide_inss"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">INSS</FormLabel>
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
                    <FormLabel className="text-sm">IRRF</FormLabel>
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
                    <FormLabel className="text-sm">FGTS</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="incide_13"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">13º</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="incide_ferias"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">Férias</FormLabel>
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
