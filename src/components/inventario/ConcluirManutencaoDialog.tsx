/**
 * DIALOG: CONCLUIR MANUTENÇÃO
 * Fecha uma manutenção aberta/em andamento. O banco devolve o bem para "ativo".
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useConcluirManutencao } from "@/hooks/usePatrimonio";

const hoje = () => new Date().toISOString().split("T")[0];

const formSchema = z.object({
  data_conclusao: z.string().min(1, "Informe a data de conclusão"),
  custo_final: z
    .union([z.literal(""), z.coerce.number().min(0, "O custo não pode ser negativo")])
    .optional(),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ConcluirManutencaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manutencao: {
    id: string;
    custo_estimado: number | null;
    observacoes: string | null;
    bem?: { numero_patrimonio?: string | null; descricao?: string | null } | null;
  } | null;
}

export function ConcluirManutencaoDialog({ open, onOpenChange, manutencao }: ConcluirManutencaoDialogProps) {
  const concluir = useConcluirManutencao();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { data_conclusao: hoje(), custo_final: "", observacoes: "" },
  });

  useEffect(() => {
    if (open && manutencao) {
      form.reset({
        data_conclusao: hoje(),
        custo_final: manutencao.custo_estimado ?? "",
        observacoes: manutencao.observacoes ?? "",
      });
    }
  }, [open, manutencao, form]);

  const onSubmit = (dados: FormData) => {
    if (!manutencao) return;
    concluir.mutate(
      {
        id: manutencao.id,
        dataConclusao: dados.data_conclusao,
        custoFinal: dados.custo_final === "" || dados.custo_final === undefined ? null : dados.custo_final,
        observacoes: dados.observacoes?.trim() || null,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  const bem = manutencao?.bem?.numero_patrimonio || manutencao?.bem?.descricao || "bem";

  return (
    <Dialog open={open} onOpenChange={(valor) => !concluir.isPending && onOpenChange(valor)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Concluir manutenção</DialogTitle>
          <DialogDescription>
            Registre o fechamento da manutenção do bem {bem}. O bem volta para a situação "ativo".
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="data_conclusao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de conclusão *</FormLabel>
                    <FormControl>
                      <Input type="date" max={hoje()} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="custo_final"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo final (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" {...field} value={field.value ?? ""} />
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
                    <Textarea placeholder="Serviço executado, peças trocadas..." className="min-h-[80px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={concluir.isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={concluir.isPending}>
                {concluir.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                Concluir
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
