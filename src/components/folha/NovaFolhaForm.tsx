import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus } from "lucide-react";
import { useCreateFolha, useFolhasPagamento } from "@/hooks/useFolhaPagamento";
import { MESES, TIPO_FOLHA_LABELS, type TipoFolha } from "@/types/folha";
import { toast } from "sonner";

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const novaFolhaSchema = z.object({
  ano: z.coerce.number().int().min(2020).max(2100),
  mes: z.coerce.number().int().min(1).max(12),
  tipo: z.enum(["normal", "complementar", "decimo_terceiro", "ferias", "rescisao"]),
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
      ano: currentYear,
      mes: currentMonth,
      tipo: "normal",
      observacoes: "",
    },
  });

  const onSubmit = (data: NovaFolhaFormData) => {
    // Verificar se já existe folha para a competência
    const existe = folhasExistentes?.find(
      (f) => f.ano === data.ano && f.mes === data.mes && f.tipo === data.tipo
    );

    if (existe) {
      toast.error("Já existe uma folha para esta competência e tipo.");
      return;
    }

    createFolha.mutate(
      {
        ...data,
        status: "rascunho",
        total_bruto: 0,
        total_descontos: 0,
        total_liquido: 0,
        total_encargos: 0,
        quantidade_servidores: 0,
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
            name="mes"
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
            name="ano"
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
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Folha *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(TIPO_FOLHA_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Folha Normal é a mensal regular. Use Complementar para pagamentos adicionais.
              </FormDescription>
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
