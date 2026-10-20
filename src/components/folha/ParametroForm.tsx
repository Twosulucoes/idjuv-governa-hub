import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, X } from "lucide-react";
import { useSaveParametro } from "@/hooks/useFolhaPagamento";
import { GRUPOS_PARAMETROS, PARAMETROS_FOLHA, definicaoParametro, normalizarTipoParametro, unidadeDoParametro } from "@/lib/parametrosFolha";

const parametroSchema = z
  .object({
    tipo_parametro: z.string().min(3, "Tipo é obrigatório"),
    valor: z.coerce.number().min(0, "Valor deve ser maior ou igual a zero"),
    descricao: z.string().optional(),
    vigencia_inicio: z.string().min(1, "Data de início é obrigatória"),
    vigencia_fim: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    if (normalizarTipoParametro(d.tipo_parametro).length < 3) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["tipo_parametro"], message: "Use letras, números e _ (mínimo 3 caracteres)" });
    }
    if (unidadeDoParametro(d.tipo_parametro) === "sim_nao" && d.valor !== 0 && d.valor !== 1) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["valor"], message: "Use 1 (remunerado) ou 0 (sem remuneração)" });
    }
    if (d.vigencia_fim && d.vigencia_fim < d.vigencia_inicio) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["vigencia_fim"], message: "O fim da vigência não pode ser antes do início" });
    }
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
    const predefinido = definicaoParametro(novoTipo);
    if (predefinido && !form.getValues("descricao")) {
      form.setValue("descricao", predefinido.descricao);
    }
  };

  const onSubmit = (data: ParametroFormData) => {
    saveParametro.mutate(
      {
        ...data,
        // o banco procura o nome em minúsculas: a tela já grava assim
        tipo_parametro: normalizarTipoParametro(data.tipo_parametro),
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
                  {GRUPOS_PARAMETROS.map((grupo) => (
                    <SelectGroup key={grupo}>
                      <SelectLabel>{grupo}</SelectLabel>
                      {PARAMETROS_FOLHA.filter((p) => p.grupo === grupo).map((p) => (
                        <SelectItem key={p.tipo} value={p.tipo}>
                          {p.tipo}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Ou digite um nome personalizado (gravado em minúsculas, com _ no lugar de espaço):
              </FormDescription>
              <Input
                {...field}
                placeholder="nome_do_parametro"
                className="font-mono"
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
                <Input {...field} type="number" step={unidadeDoParametro(tipoParametro) === "numero" ? "any" : "0.01"} min={0} />
              </FormControl>
              <FormDescription>
                {{ reais: "Valor em Reais (R$)", percentual: "Valor em percentual (%)", sim_nao: "1 = remunerado, 0 = sem remuneração", numero: "Valor numérico" }[unidadeDoParametro(tipoParametro)]}
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
