import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus } from "lucide-react";
import { useCreateFolha, useFolhasPagamento } from "@/hooks/useFolhaPagamento";
import { MESES, STATUS_FOLHA_LABELS } from "@/types/folha";
import { toast } from "sonner";

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const novaFolhaSchema = z.object({
  competencia_ano: z.coerce.number().int().min(2020).max(2100),
  competencia_mes: z.coerce.number().int().min(1).max(12),
  observacoes: z.string().optional(),
});

type NovaFolhaFormData = z.infer<typeof novaFolhaSchema>;

interface NovaFolhaFormProps {
  onSuccess?: () => void;
}

export function NovaFolhaForm({ onSuccess }: NovaFolhaFormProps) {
  const createFolha = useCreateFolha();
  const { data: folhasExistentes } = useFolhasPagamento(currentYear);

  const form = useForm<NovaFolhaFormData>({
    resolver: zodResolver(novaFolhaSchema),
    defaultValues: {
      competencia_ano: currentYear,
      competencia_mes: currentMonth,
      observacoes: "",
    },
  });

  const onSubmit = (data: NovaFolhaFormData) => {
    // Verificar se já existe folha para a competência
    const existe = folhasExistentes?.find(
      (f) => f.competencia_ano === data.competencia_ano && f.competencia_mes === data.competencia_mes
    );

    if (existe) {
      toast.error("Já existe uma folha para esta competência.");
      return;
    }

    createFolha.mutate(
      {
        ...data,
        tipo_folha: "mensal",
        status: "previa",
      },
      {
        onSuccess: () => {
          onSuccess?.();
        },
      }
    );
  };

  const years = Array.from({ length: 3 }, (_, i) => currentYear - 1 + i);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 grid-cols-2">
          <FormField
            control={form.control}
            name="competencia_mes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mês *</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(Number(v))}
                  value={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Mês" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MESES.map((mes, index) => (
                      <SelectItem key={index} value={(index + 1).toString()}>
                        {mes}
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
            name="competencia_ano"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ano *</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(Number(v))}
                  value={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Ano" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
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
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Observações sobre esta folha (opcional)"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={createFolha.isPending}>
            {createFolha.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Criar Folha
          </Button>
        </div>
      </form>
    </Form>
  );
}
