/**
 * Formulário de publicação/edição de aviso (gestor com avisos.gerenciar).
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
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
import { PRIORIDADE_AVISO_LABEL, type Aviso, type AvisoInput } from "@/types/avisos";

const schema = z
  .object({
    titulo: z.string().trim().min(3, "Mínimo de 3 caracteres").max(200),
    conteudo: z.string().trim().min(1, "Escreva o aviso").max(5000),
    prioridade: z.enum(["baixa", "normal", "alta", "urgente"]),
    destaque: z.boolean(),
    publico: z.enum(["todos", "modulos"]),
    modulos_alvo: z.array(z.string()),
    inicio_em: z.string().min(1, "Informe o início"),
    expira_em: z.string().optional(),
    link: z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || v.startsWith("/") || v.startsWith("https://"), "Use um caminho do sistema (/...) ou https://"),
    ativo: z.boolean(),
  })
  .refine((d) => d.publico === "todos" || d.modulos_alvo.length > 0, {
    path: ["modulos_alvo"],
    message: "Escolha ao menos um módulo",
  })
  .refine((d) => !d.expira_em || new Date(d.expira_em) > new Date(d.inicio_em), {
    path: ["expira_em"],
    message: "A expiração precisa ser depois do início",
  });

type FormData = z.infer<typeof schema>;

const paraInputLocal = (iso: string) => format(new Date(iso), "yyyy-MM-dd'T'HH:mm");

interface AvisoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aviso?: Aviso | null;
  salvando?: boolean;
  onSalvar: (input: AvisoInput & { id?: string }) => Promise<unknown>;
}

export function AvisoFormDialog({ open, onOpenChange, aviso, salvando, onSalvar }: AvisoFormDialogProps) {
  const modulos = modulosHabilitados();

  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) return;
    form.reset({
      titulo: aviso?.titulo ?? "",
      conteudo: aviso?.conteudo ?? "",
      prioridade: aviso?.prioridade ?? "normal",
      destaque: aviso?.destaque ?? false,
      publico: aviso?.publico ?? "todos",
      modulos_alvo: aviso?.modulos_alvo ?? [],
      inicio_em: paraInputLocal(aviso?.inicio_em ?? new Date().toISOString()),
      expira_em: aviso?.expira_em ? paraInputLocal(aviso.expira_em) : "",
      link: aviso?.link ?? "",
      ativo: aviso?.ativo ?? true,
    });
  }, [open, aviso, form]);

  const publico = form.watch("publico");

  const onSubmit = async (d: FormData) => {
    try {
      await onSalvar({
      id: aviso?.id,
      titulo: d.titulo,
      conteudo: d.conteudo,
      prioridade: d.prioridade,
      destaque: d.destaque,
      publico: d.publico,
      modulos_alvo: d.modulos_alvo as Modulo[],
      inicio_em: new Date(d.inicio_em).toISOString(),
      expira_em: d.expira_em ? new Date(d.expira_em).toISOString() : null,
      link: d.link || null,
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
          <DialogTitle>{aviso ? "Editar aviso" : "Novo aviso"}</DialogTitle>
          <DialogDescription>O aviso aparece no sino e, se estiver em destaque, no topo das telas.</DialogDescription>
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
                    <Input placeholder="Ex.: Expediente reduzido na sexta" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="conteudo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensagem *</FormLabel>
                  <FormControl>
                    <Textarea rows={5} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="prioridade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(PRIORIDADE_AVISO_LABEL).map(([valor, label]) => (
                          <SelectItem key={valor} value={valor}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="publico"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Para quem</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="todos">Todos os usuários</SelectItem>
                        <SelectItem value="modulos">Usuários de módulos específicos</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            {publico === "modulos" && (
              <FormField
                control={form.control}
                name="modulos_alvo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Módulos</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="inicio_em"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Publicar a partir de</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expira_em"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expira em</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormDescription>Vazio = não expira</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="/rh/ferias ou https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
              <FormField
                control={form.control}
                name="destaque"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal">Destacar no topo das telas</FormLabel>
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
                    <FormLabel className="font-normal">Ativo</FormLabel>
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
                {aviso ? "Salvar" : "Publicar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
