import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save, X } from "lucide-react";
import { useSaveFaixaIRRF } from "@/hooks/useFolhaPagamento";

const faixaIRRFSchema = z.object({
  faixa_ordem: z.coerce.number().min(0, "Ordem é obrigatória"),
  valor_minimo: z.coerce.number().min(0, "Valor mínimo é obrigatório"),
  valor_maximo: z.coerce.number().min(0, "Valor máximo é obrigatório"),
  aliquota: z.coerce.number().min(0).max(100, "Alíquota deve estar entre 0 e 100"),
  parcela_deduzir: z.coerce.number().min(0, "Parcela a deduzir é obrigatória"),
  vigencia_inicio: z.string().min(1, "Data de início é obrigatória"),
  vigencia_fim: z.string().optional().nullable(),
  descricao: z.string().optional().nullable(),
});

type FaixaIRRFFormData = z.infer<typeof faixaIRRFSchema>;

interface FaixaIRRFData {
  id?: string;
  faixa_ordem: number;
  valor_minimo: number;
  valor_maximo: number;
  aliquota: number;
  parcela_deduzir: number;
  vigencia_inicio: string;
  vigencia_fim?: string | null;
  descricao?: string | null;
}

interface TabelaIRRFFormProps {
  faixa?: FaixaIRRFData | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TabelaIRRFForm({ faixa, onSuccess, onCancel }: TabelaIRRFFormProps) {
  const saveFaixa = useSaveFaixaIRRF();

  const form = useForm<FaixaIRRFFormData>({
    resolver: zodResolver(faixaIRRFSchema),
    defaultValues: {
      faixa_ordem: faixa?.faixa_ordem ?? 0,
      valor_minimo: faixa?.valor_minimo || 0,
      valor_maximo: faixa?.valor_maximo || 0,
      aliquota: faixa?.aliquota || 0,
      parcela_deduzir: faixa?.parcela_deduzir || 0,
      vigencia_inicio: faixa?.vigencia_inicio?.split("T")[0] || new Date().toISOString().split("T")[0],
      vigencia_fim: faixa?.vigencia_fim?.split("T")[0] || "",
      descricao: faixa?.descricao || "",
    },
  });

  const onSubmit = (data: FaixaIRRFFormData) => {
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
        <div className="grid gap-4 grid-cols-3">
          <FormField
            control={form.control}
            name="faixa_ordem"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ordem da Faixa *</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min={0} />
                </FormControl>
                <FormDescription className="text-xs">0 = Isento</FormDescription>
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
                  <Input {...field} type="number" step="0.1" min={0} max={100} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parcela_deduzir"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parcela a Deduzir (R$) *</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.01" min={0} />
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
                <Input {...field} value={field.value ?? ""} placeholder="Ex: Faixa isenta IRRF 2025" />
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
