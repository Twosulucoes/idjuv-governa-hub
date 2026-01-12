import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save, X } from "lucide-react";
import { useSaveFaixaINSS } from "@/hooks/useFolhaPagamento";

const faixaINSSSchema = z.object({
  faixa_ordem: z.coerce.number().min(1, "Ordem é obrigatória"),
  valor_minimo: z.coerce.number().min(0, "Valor mínimo é obrigatório"),
  valor_maximo: z.coerce.number().min(0, "Valor máximo é obrigatório"),
  aliquota: z.coerce.number().min(0).max(100, "Alíquota deve estar entre 0 e 100"),
  vigencia_inicio: z.string().min(1, "Data de início é obrigatória"),
  vigencia_fim: z.string().optional().nullable(),
  descricao: z.string().optional().nullable(),
});

type FaixaINSSFormData = z.infer<typeof faixaINSSSchema>;

interface FaixaINSSData {
  id?: string;
  faixa_ordem: number;
  valor_minimo: number;
  valor_maximo: number;
  aliquota: number;
  vigencia_inicio: string;
  vigencia_fim?: string | null;
  descricao?: string | null;
}

interface TabelaINSSFormProps {
  faixa?: FaixaINSSData | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TabelaINSSForm({ faixa, onSuccess, onCancel }: TabelaINSSFormProps) {
  const saveFaixa = useSaveFaixaINSS();

  const form = useForm<FaixaINSSFormData>({
    resolver: zodResolver(faixaINSSSchema),
    defaultValues: {
      faixa_ordem: faixa?.faixa_ordem || 1,
      valor_minimo: faixa?.valor_minimo || 0,
      valor_maximo: faixa?.valor_maximo || 0,
      aliquota: faixa?.aliquota || 0,
      vigencia_inicio: faixa?.vigencia_inicio?.split("T")[0] || new Date().toISOString().split("T")[0],
      vigencia_fim: faixa?.vigencia_fim?.split("T")[0] || "",
      descricao: faixa?.descricao || "",
    },
  });

  const onSubmit = (data: FaixaINSSFormData) => {
    saveFaixa.mutate(
      {
        ...data,
        id: faixa?.id,
        vigencia_fim: data.vigencia_fim || null,
        descricao: data.descricao || null,
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
        <div className="grid gap-4 grid-cols-2">
          <FormField
            control={form.control}
            name="faixa_ordem"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ordem da Faixa *</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min={1} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="aliquota"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alíquota (%) *</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.01" min={0} max={100} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 grid-cols-2">
          <FormField
            control={form.control}
            name="valor_minimo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor Mínimo (R$) *</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.01" min={0} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="valor_maximo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor Máximo (R$) *</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.01" min={0} />
                </FormControl>
                <FormDescription className="text-xs">Use 99999999 para sem limite</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 grid-cols-2">
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
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} placeholder="Ex: Primeira faixa INSS 2025" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button type="submit" disabled={saveFaixa.isPending}>
            {saveFaixa.isPending ? (
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
