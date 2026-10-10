/**
 * Cadastro/edição de dependente para dedução de IRRF (aba Dependentes da ficha financeira).
 * A alteração só reflete no IRRF da ficha ao reprocessar a folha.
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
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { useSaveDependenteIRRF, type DependenteIRRFRow } from "@/hooks/useFolhaPagamento";
import { isValidCPF } from "@/lib/formatters";
import { TIPO_DEPENDENTE_LABELS } from "@/types/folha";

const hoje = () => format(new Date(), "yyyy-MM-dd");

const schema = z
  .object({
    nome: z.string().trim().min(3, "Nome deve ter pelo menos 3 caracteres").max(200),
    cpf: z.string().trim().optional(),
    data_nascimento: z.string().min(1, "Informe a data de nascimento"),
    tipo_dependente: z.string().min(1, "Informe o tipo"),
    deduz_irrf: z.boolean(),
    data_inicio_deducao: z.string().min(1, "Informe o início da dedução"),
    data_fim_deducao: z.string().optional(),
    observacoes: z.string().trim().optional(),
  })
  .superRefine((d, ctx) => {
    if (d.cpf && !isValidCPF(d.cpf)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["cpf"], message: "CPF inválido" });
    }
    // Comparação de strings ISO (sem new Date, que desloca fuso).
    if (d.data_nascimento >= hoje()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["data_nascimento"], message: "A data de nascimento deve ser no passado" });
    }
    if (d.data_fim_deducao && d.data_fim_deducao < d.data_inicio_deducao) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["data_fim_deducao"], message: "O fim da dedução não pode ser antes do início" });
    }
  });

type DependenteFormValues = z.infer<typeof schema>;

interface DependenteIRRFFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servidorId: string;
  /** Registro em edição; ausente = criar. */
  dependente?: DependenteIRRFRow | null;
}

export function DependenteIRRFFormDialog({ open, onOpenChange, servidorId, dependente }: DependenteIRRFFormDialogProps) {
  const editando = !!dependente;
  const salvar = useSaveDependenteIRRF();

  const form = useForm<DependenteFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: "",
      cpf: "",
      data_nascimento: "",
      tipo_dependente: "filho",
      deduz_irrf: true,
      data_inicio_deducao: "",
      data_fim_deducao: "",
      observacoes: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      nome: dependente?.nome ?? "",
      cpf: dependente?.cpf ?? "",
      data_nascimento: dependente?.data_nascimento?.slice(0, 10) ?? "",
      tipo_dependente: dependente?.tipo_dependente ?? "filho",
      deduz_irrf: dependente?.deduz_irrf ?? true,
      data_inicio_deducao: dependente?.data_inicio_deducao?.slice(0, 10) ?? hoje(),
      data_fim_deducao: dependente?.data_fim_deducao?.slice(0, 10) ?? "",
      observacoes: dependente?.observacoes ?? "",
    });
  }, [open, dependente, form]);

  const onSubmit = async (d: DependenteFormValues) => {
    try {
      await salvar.mutateAsync({
        id: dependente?.id,
        servidor_id: servidorId,
        nome: d.nome,
        cpf: d.cpf ? d.cpf.replace(/\D/g, "") : null,
        data_nascimento: d.data_nascimento,
        tipo_dependente: d.tipo_dependente,
        deduz_irrf: d.deduz_irrf,
        data_inicio_deducao: d.data_inicio_deducao,
        data_fim_deducao: d.data_fim_deducao ? d.data_fim_deducao : null,
        observacoes: d.observacoes ? d.observacoes : null,
        ativo: true,
      });
      onOpenChange(false);
    } catch {
      // Toast de erro já emitido pelo hook (descreverErroBanco).
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editando ? "Editar dependente" : "Novo dependente"}</DialogTitle>
          <DialogDescription>
            Dependente para dedução do IRRF. A quantidade na ficha só muda ao reprocessar a folha.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00" {...field} />
                    </FormControl>
                    <FormDescription>Obrigatório no eSocial para maiores de 8 anos.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data_nascimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de nascimento *</FormLabel>
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
              name="tipo_dependente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de dependente *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(TIPO_DEPENDENTE_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deduz_irrf"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div>
                    <FormLabel>Deduz IRRF</FormLabel>
                    <FormDescription>Desmarque para dependente só cadastral (sem dedução).</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_inicio_deducao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Início da dedução *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data_fim_deducao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fim da dedução</FormLabel>
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
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={salvar.isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvar.isPending}>
                {salvar.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {editando ? "Salvar alterações" : "Cadastrar dependente"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
