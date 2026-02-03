/**
 * DIALOG: NOVA MANUTENÇÃO DE BEM
 * Formulário para registrar manutenções de bens patrimoniais
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
  tipo: z.string().min(1, "Selecione o tipo"),
  descricao: z.string().min(5, "Descreva o problema ou serviço"),
  data_prevista: z.string().optional(),
  custo_estimado: z.coerce.number().optional(),
  prestador: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const TIPOS_MANUTENCAO = [
  { value: "preventiva", label: "Preventiva" },
  { value: "corretiva", label: "Corretiva" },
];

interface NovaManutencaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NovaManutencaoDialog({ open, onOpenChange }: NovaManutencaoDialogProps) {
  const queryClient = useQueryClient();

  const { data: bens } = useQuery({
    queryKey: ["bens-ativos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bens_patrimoniais")
        .select("id, numero_patrimonio, descricao")
        .eq("situacao", "ativo")
        .order("numero_patrimonio");
      if (error) throw error;
      return data;
    },
  });

  const createManutencao = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data: result, error } = await supabase
        .from("manutencoes_patrimonio")
        .insert([{
          bem_id: formData.bem_id,
          tipo: formData.tipo as "preventiva" | "corretiva",
          descricao_problema: formData.descricao,
          data_abertura: new Date().toISOString().split("T")[0],
          custo_estimado: formData.custo_estimado || null,
          fornecedor_externo: formData.prestador || null,
          observacoes: formData.observacoes || null,
          status: "aberta",
        }])
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manutencoes-patrimonio"] });
      toast.success("Manutenção registrada com sucesso");
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar manutenção: ${error.message}`);
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bem_id: "",
      tipo: "",
      descricao: "",
      data_prevista: "",
      custo_estimado: 0,
      prestador: "",
      observacoes: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    await createManutencao.mutateAsync(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Manutenção</DialogTitle>
          <DialogDescription>
            Registre uma solicitação de manutenção para um bem patrimonial
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Manutenção *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIPOS_MANUTENCAO.map((t) => (
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
                name="data_prevista"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Prevista</FormLabel>
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
                  <FormLabel>Descrição do Problema/Serviço *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o problema ou serviço necessário..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="custo_estimado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo Estimado (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="prestador"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prestador de Serviço</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do prestador" {...field} />
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
                    <Textarea
                      placeholder="Observações adicionais..."
                      className="min-h-[60px]"
                      {...field}
                    />
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
              <Button type="submit" disabled={createManutencao.isPending}>
                {createManutencao.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Registrar Manutenção
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
