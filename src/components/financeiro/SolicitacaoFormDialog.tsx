/**
 * Formulário de Solicitação de Despesa - Dialog
 * A solicitação nasce como rascunho no exercício selecionado no módulo.
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useCriarSolicitacao, useUnidadesSolicitantes } from "@/hooks/useFinanceiro";
import { PRIORIDADE_OPTIONS, TIPO_DESPESA_OPTIONS } from "@/types/financeiro";

const hoje = () => new Date().toISOString().split("T")[0];

const schema = z.object({
  data_solicitacao: z.string().min(1, "Informe a data"),
  unidade_solicitante_id: z.string().min(1, "Selecione a unidade solicitante"),
  tipo_despesa: z.string().min(1, "Selecione o tipo de despesa"),
  prioridade: z.enum(["baixa", "normal", "alta", "urgente"]),
  valor_estimado: z.coerce
    .number({ invalid_type_error: "Informe o valor estimado" })
    .positive("O valor deve ser maior que zero")
    .max(9_999_999_999_999.99, "Valor acima do limite"),
  prazo_execucao: z.string().optional(),
  objeto: z.string().trim().min(5, "Descreva o objeto (mínimo de 5 caracteres)").max(3000),
  justificativa: z.string().trim().min(10, "Justifique a despesa (mínimo de 10 caracteres)").max(3000),
  observacoes: z.string().trim().max(1000).optional(),
});

type FormData = z.infer<typeof schema>;

const VALORES_INICIAIS: FormData = {
  data_solicitacao: "",
  unidade_solicitante_id: "",
  tipo_despesa: "",
  prioridade: "normal",
  valor_estimado: undefined as unknown as number,
  prazo_execucao: "",
  objeto: "",
  justificativa: "",
  observacoes: "",
};

interface SolicitacaoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercicio: number;
}

export default function SolicitacaoFormDialog({ open, onOpenChange, exercicio }: SolicitacaoFormDialogProps) {
  const criarSolicitacao = useCriarSolicitacao();
  const { data: unidades, isLoading: carregandoUnidades } = useUnidadesSolicitantes();
  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: VALORES_INICIAIS });

  useEffect(() => {
    if (open) form.reset({ ...VALORES_INICIAIS, data_solicitacao: hoje() });
  }, [open, form]);

  const onSubmit = async (d: FormData) => {
    try {
      await criarSolicitacao.mutateAsync({
        exercicio,
        data_solicitacao: d.data_solicitacao,
        unidade_solicitante_id: d.unidade_solicitante_id,
        tipo_despesa: d.tipo_despesa,
        prioridade: d.prioridade,
        valor_estimado: d.valor_estimado,
        prazo_execucao: d.prazo_execucao || undefined,
        objeto: d.objeto,
        justificativa: d.justificativa,
        observacoes: d.observacoes || undefined,
      });
      onOpenChange(false);
    } catch {
      // erro já exibido pelo toast da mutation; o diálogo continua aberto
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova solicitação de despesa</DialogTitle>
          <DialogDescription>
            Exercício {exercicio}. A solicitação é salva como rascunho e segue depois para análise.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="unidade_solicitante_id"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Unidade solicitante *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={carregandoUnidades ? "Carregando…" : "Selecione a unidade"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {unidades?.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.sigla ? `${u.sigla} — ${u.nome}` : u.nome}
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
                name="tipo_despesa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de despesa *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIPO_DESPESA_OPTIONS.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
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
                        {PRIORIDADE_OPTIONS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
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
                name="valor_estimado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor estimado (R$) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0.01"
                        placeholder="0,00"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_solicitacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da solicitação *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prazo_execucao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prazo de execução</FormLabel>
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
              name="objeto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objeto *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="O que será contratado ou adquirido" rows={3} maxLength={3000} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="justificativa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justificativa *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Por que a despesa é necessária" rows={3} maxLength={3000} {...field} />
                  </FormControl>
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
                    <Textarea rows={2} maxLength={1000} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={criarSolicitacao.isPending}>
                {criarSolicitacao.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Salvar solicitação
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
