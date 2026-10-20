import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, X } from "lucide-react";
import { useSalvarAto, type AtoRemuneratorio } from "@/hooks/useAtosRemuneratorios";
import { TIPOS_ATO, type TipoAto } from "@/lib/atosRemuneratorios";

const opcional = (v: string | undefined) => (v?.trim() ? v.trim() : null);

const atoSchema = z
  .object({
    tipo_ato: z.enum(Object.keys(TIPOS_ATO) as [TipoAto, ...TipoAto[]]),
    numero: z.string().trim().min(1, "Informe o número do ato"),
    data_ato: z.string().min(1, "Informe a data do ato"),
    data_publicacao: z.string().optional(),
    vigencia_inicio: z.string().min(1, "Informe o início da vigência"),
    ementa: z.string().trim().min(5, "Descreva o que o ato muda"),
    percentual: z
      .string()
      .optional()
      .refine((v) => !v?.trim() || !Number.isNaN(Number(v.replace(",", "."))), "Use um número, ex.: 6,5"),
    processo_sei: z.string().optional(),
    link_publicacao: z
      .string()
      .optional()
      .refine((v) => !v?.trim() || /^https:\/\//i.test(v.trim()), "Use um endereço https://"),
    observacoes: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.data_publicacao && d.data_publicacao < d.data_ato) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["data_publicacao"], message: "A publicação não pode ser antes do ato" });
    }
  });

type AtoFormData = z.infer<typeof atoSchema>;

interface Props {
  ato?: AtoRemuneratorio | null;
  onSuccess?: (id: string) => void;
  onCancel?: () => void;
}

export function AtoRemuneratorioForm({ ato, onSuccess, onCancel }: Props) {
  const salvar = useSalvarAto();
  const form = useForm<AtoFormData>({
    resolver: zodResolver(atoSchema),
    defaultValues: {
      tipo_ato: (ato?.tipo_ato as TipoAto) ?? "lei",
      numero: ato?.numero ?? "",
      data_ato: ato?.data_ato ?? "",
      data_publicacao: ato?.data_publicacao ?? "",
      vigencia_inicio: ato?.vigencia_inicio ?? "",
      ementa: ato?.ementa ?? "",
      percentual: ato?.percentual != null ? String(ato.percentual).replace(".", ",") : "",
      processo_sei: ato?.processo_sei ?? "",
      link_publicacao: ato?.link_publicacao ?? "",
      observacoes: ato?.observacoes ?? "",
    },
  });

  const onSubmit = (d: AtoFormData) => {
    salvar.mutate(
      {
        id: ato?.id,
        dados: {
          tipo_ato: d.tipo_ato,
          numero: d.numero.trim(),
          data_ato: d.data_ato,
          data_publicacao: d.data_publicacao || null,
          vigencia_inicio: d.vigencia_inicio,
          ementa: d.ementa.trim(),
          percentual: d.percentual?.trim() ? Number(d.percentual.replace(",", ".")) : null,
          processo_sei: opcional(d.processo_sei),
          link_publicacao: opcional(d.link_publicacao),
          observacoes: opcional(d.observacoes),
        },
      },
      { onSuccess: (id) => onSuccess?.(id) },
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="tipo_ato"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo do ato</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(TIPOS_ATO).map(([v, r]) => (
                      <SelectItem key={v} value={v}>
                        {r}
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
            name="numero"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="2.301/2026" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="data_ato"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data do ato</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="data_publicacao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Publicação no DOE</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="vigencia_inicio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vale a partir de</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormDescription>A folha usa os valores novos a partir desta data.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="percentual"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Percentual do reajuste (%)</FormLabel>
                <FormControl>
                  <Input {...field} inputMode="decimal" placeholder="6,5" />
                </FormControl>
                <FormDescription>Só para registro; os valores aplicados são os dos itens.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="ementa"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ementa</FormLabel>
              <FormControl>
                <Textarea {...field} rows={2} placeholder="Concede reajuste de 6,5% aos vencimentos e subsídios..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="processo_sei"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Processo SEI</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="link_publicacao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Link da publicação</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="https://" />
                </FormControl>
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
                <Textarea {...field} rows={2} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button type="submit" disabled={salvar.isPending}>
            {salvar.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar
          </Button>
        </div>
      </form>
    </Form>
  );
}
