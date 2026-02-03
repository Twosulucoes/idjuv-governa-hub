/**
 * DIALOG: NOVA BAIXA DE BEM
 * Formulário para solicitar baixa de bens patrimoniais
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
  bem_id: z.string().min(1, "Selecione o bem"),
  motivo: z.string().min(1, "Selecione o motivo"),
  justificativa: z.string().min(10, "A justificativa deve ter pelo menos 10 caracteres"),
  valor_residual: z.coerce.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

const MOTIVOS_BAIXA = [
  { value: "inservivel", label: "Inservível / Irrecuperável" },
  { value: "obsoleto", label: "Obsolescência Tecnológica" },
  { value: "perda", label: "Extravio / Furto / Roubo / Perda" },
  { value: "doacao", label: "Doação" },
  { value: "alienacao", label: "Alienação / Venda" },
];

interface NovaBaixaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NovaBaixaDialog({ open, onOpenChange }: NovaBaixaDialogProps) {
  const queryClient = useQueryClient();

  const { data: bens } = useQuery({
    queryKey: ["bens-ativos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bens_patrimoniais")
        .select("id, numero_patrimonio, descricao, valor_aquisicao")
        .eq("situacao", "ativo")
        .order("numero_patrimonio");
      if (error) throw error;
      return data;
    },
  });

  const createBaixa = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data: result, error } = await supabase
        .from("baixas_patrimonio")
        .insert([{
          bem_id: formData.bem_id,
          motivo: formData.motivo as "inservivel" | "obsoleto" | "perda" | "doacao" | "alienacao",
          justificativa: formData.justificativa,
          valor_residual: formData.valor_residual || null,
          data_solicitacao: new Date().toISOString().split("T")[0],
          status: "pendente",
        }])
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["baixas-patrimonio"] });
      toast.success("Solicitação de baixa registrada com sucesso");
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar baixa: ${error.message}`);
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bem_id: "",
      motivo: "",
      justificativa: "",
      valor_residual: 0,
    },
  });

  const onSubmit = async (data: FormData) => {
    await createBaixa.mutateAsync(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Baixa de Bem</DialogTitle>
          <DialogDescription>
            Solicite a baixa de um bem patrimonial. A solicitação passará por aprovação.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="bem_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bem Patrimonial *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o bem" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bens?.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          [{b.numero_patrimonio}] {b.descricao}
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
              name="motivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo da Baixa *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o motivo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MOTIVOS_BAIXA.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
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
              name="justificativa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justificativa *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva detalhadamente a justificativa para a baixa..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="valor_residual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Residual Estimado (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createBaixa.isPending}>
                {createBaixa.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Solicitar Baixa
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
