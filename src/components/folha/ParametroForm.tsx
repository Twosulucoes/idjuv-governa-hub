import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, X } from "lucide-react";
import { useSaveParametro } from "@/hooks/useFolhaPagamento";

const PARAMETROS_PREDEFINIDOS = [
  { tipo: "SALARIO_MINIMO", descricao: "Salário mínimo nacional" },
  { tipo: "TETO_INSS", descricao: "Teto de contribuição do INSS" },
  { tipo: "DEDUCAO_DEPENDENTE_IRRF", descricao: "Dedução por dependente para IRRF" },
  { tipo: "SALARIO_FAMILIA_COTA", descricao: "Valor da cota do salário-família" },
  { tipo: "SALARIO_FAMILIA_LIMITE", descricao: "Limite salarial para salário-família" },
  { tipo: "ALIQUOTA_FGTS", descricao: "Alíquota do FGTS" },
  { tipo: "TETO_RPPS", descricao: "Teto do Regime Próprio de Previdência" },
];

const parametroSchema = z.object({
  tipo_parametro: z.string().min(3, "Tipo é obrigatório"),
  valor: z.coerce.number().min(0, "Valor deve ser maior ou igual a zero"),
  descricao: z.string().optional(),
  vigencia_inicio: z.string().min(1, "Data de início é obrigatória"),
  vigencia_fim: z.string().optional(),
});

type ParametroFormData = z.infer<typeof parametroSchema>;

interface ParametroData {
  id?: string;
  tipo_parametro: string;
  valor: number;
  descricao?: string;
  vigencia_inicio: string;
  vigencia_fim?: string;
}

interface ParametroFormProps {
  parametro?: ParametroData | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ParametroForm({ parametro, onSuccess, onCancel }: ParametroFormProps) {
  const saveParametro = useSaveParametro();

  const form = useForm<ParametroFormData>({
    resolver: zodResolver(parametroSchema),
    defaultValues: {
      tipo_parametro: parametro?.tipo_parametro || "",
      valor: parametro?.valor || 0,
      descricao: parametro?.descricao || "",
      vigencia_inicio: parametro?.vigencia_inicio?.split("T")[0] || new Date().toISOString().split("T")[0],
      vigencia_fim: parametro?.vigencia_fim?.split("T")[0] || "",
    },
  });

  const tipoParametro = form.watch("tipo_parametro");

  const handleTipoChange = (novoTipo: string) => {
    form.setValue("tipo_parametro", novoTipo);
    const predefinido = PARAMETROS_PREDEFINIDOS.find((p) => p.tipo === novoTipo);
    if (predefinido && !form.getValues("descricao")) {
      form.setValue("descricao", predefinido.descricao);
    }
  };

  const onSubmit = (data: ParametroFormData) => {
    saveParametro.mutate(
      {
        ...data,
        id: parametro?.id,
        ativo: true,
        vigencia_fim: data.vigencia_fim || null,
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="tipo_parametro"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Parâmetro *</FormLabel>
              <Select onValueChange={handleTipoChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione ou digite" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PARAMETROS_PREDEFINIDOS.map((p) => (
                    <SelectItem key={p.tipo} value={p.tipo}>
                      {p.tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Ou digite um nome personalizado:
              </FormDescription>
              <Input
                {...field}
                placeholder="NOME_DO_PARAMETRO"
                className="font-mono uppercase"
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="valor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor *</FormLabel>
              <FormControl>
                <Input {...field} type="number" step="0.01" min={0} />
              </FormControl>
              <FormDescription>
                {tipoParametro.includes("SALARIO") || tipoParametro.includes("TETO") || tipoParametro.includes("DEDUCAO")
                  ? "Valor em Reais (R$)"
                  : tipoParametro.includes("ALIQUOTA")
                  ? "Valor em percentual (%)"
                  : "Valor numérico"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Descrição do parâmetro" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
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
                  <Input {...field} type="date" />
                </FormControl>
                <FormDescription>Deixe em branco se indeterminado</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button type="submit" disabled={saveParametro.isPending}>
            {saveParametro.isPending ? (
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
