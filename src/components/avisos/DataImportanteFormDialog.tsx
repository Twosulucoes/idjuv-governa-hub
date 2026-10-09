/**
 * Formulário de cadastro/edição de data importante (prazo, evento, reunião...).
 * Feriados não entram aqui: são mantidos em Configuração de Frequência (dias não úteis).
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { modulosHabilitados, type Modulo } from "@/shared/config/modules.config";
import { TIPO_DATA_LABEL, type DataImportante, type DataImportanteInput, type TipoDataImportante } from "@/types/avisos";

const TIPOS: TipoDataImportante[] = ["prazo", "evento", "reuniao", "comemorativa", "outro"];

const schema = z
  .object({
    titulo: z.string().trim().min(3, "Mínimo de 3 caracteres").max(200),
    descricao: z.string().trim().max(2000).optional(),
    data: z.string().min(1, "Informe a data"),
    data_fim: z.string().optional(),
    tipo: z.enum(["prazo", "evento", "reuniao", "comemorativa", "outro"]),
    recorrente_anual: z.boolean(),
    modulos_alvo: z.array(z.string()),
    ativo: z.boolean(),
  })
  .refine((d) => !d.data_fim || d.data_fim >= d.data, {
    path: ["data_fim"],
    message: "O fim não pode ser antes do início",
  });

type FormData = z.infer<typeof schema>;

interface DataImportanteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataImportante?: DataImportante | null;
  salvando?: boolean;
  onSalvar: (input: DataImportanteInput & { id?: string }) => Promise<unknown>;
}

export function DataImportanteFormDialog({
  open,
  onOpenChange,
  dataImportante,
  salvando,
  onSalvar,
}: DataImportanteFormDialogProps) {
  const modulos = modulosHabilitados();
  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) return;
    form.reset({
      titulo: dataImportante?.titulo ?? "",
      descricao: dataImportante?.descricao ?? "",
      data: dataImportante?.data ?? "",
      data_fim: dataImportante?.data_fim ?? "",
      tipo: dataImportante?.tipo ?? "prazo",
      recorrente_anual: dataImportante?.recorrente_anual ?? false,
      modulos_alvo: dataImportante?.modulos_alvo ?? [],
      ativo: dataImportante?.ativo ?? true,
    });
  }, [open, dataImportante, form]);

  const onSubmit = async (d: FormData) => {
    try {
      await onSalvar({
        id: dataImportante?.id,
        titulo: d.titulo,
        descricao: d.descricao || null,
        data: d.data,
        data_fim: d.data_fim || null,
        tipo: d.tipo,
        recorrente_anual: d.recorrente_anual,
        modulos_alvo: d.modulos_alvo as Modulo[],
        ativo: d.ativo,
      });
      onOpenChange(false);
    } catch {
      // erro já exibido pelo toast da mutation; o diálogo continua aberto
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dataImportante ? "Editar data" : "Nova data importante"}</DialogTitle>
          <DialogDescription>
            Prazos, eventos e reuniões. Feriados são cadastrados em Configuração de Frequência.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Fechamento da folha" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIPOS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {TIPO_DATA_LABEL[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data_fim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Até</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="modulos_alvo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mostrar para</FormLabel>
                  <FormDescription>Nenhum marcado = todos os usuários</FormDescription>
                  <div className="grid grid-cols-1 gap-2 rounded-md border p-3 sm:grid-cols-2">
                    {modulos.map((m) => (
                      <label key={m.codigo} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={field.value.includes(m.codigo)}
                          onCheckedChange={(marcado) =>
                            field.onChange(
                              marcado ? [...field.value, m.codigo] : field.value.filter((c) => c !== m.codigo),
                            )
                          }
                        />
                        {m.nome}
                      </label>
                    ))}
                  </div>
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
              <FormField
                control={form.control}
                name="recorrente_anual"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal">Repete todo ano</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ativo"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal">Ativa</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvando}>
                {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
