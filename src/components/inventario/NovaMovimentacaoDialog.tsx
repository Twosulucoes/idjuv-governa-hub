/**
 * DIALOG: NOVA MOVIMENTAÇÃO DE BEM
 * Formulário para registrar transferências de bens
 */

import { useState } from "react";
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
  tipo_movimentacao: z.string().min(1, "Selecione o tipo"),
  unidade_local_destino_id: z.string().min(1, "Selecione a unidade de destino"),
  responsavel_destino_id: z.string().optional(),
  motivo: z.string().min(5, "Descreva o motivo (mín. 5 caracteres)"),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const TIPOS_MOVIMENTACAO = [
  { value: "transferencia_interna", label: "Transferência Interna" },
  { value: "cessao", label: "Cessão" },
  { value: "emprestimo", label: "Empréstimo" },
  { value: "recolhimento", label: "Recolhimento" },
];

interface NovaMovimentacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NovaMovimentacaoDialog({ open, onOpenChange }: NovaMovimentacaoDialogProps) {
  const queryClient = useQueryClient();

  // Buscar bens com unidade local atual
  const { data: bens } = useQuery({
    queryKey: ["bens-ativos-movimentacao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bens_patrimoniais")
        .select("id, numero_patrimonio, descricao, unidade_local_id")
        .in("situacao", ["ativo", "alocado", "cadastrado", "tombado"])
        .order("numero_patrimonio");
      if (error) throw error;
      return data;
    },
  });

  const { data: unidades } = useQuery({
    queryKey: ["unidades-locais"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("unidades_locais")
        .select("id, nome_unidade, codigo_unidade")
        .eq("status", "ativa")
        .order("nome_unidade");
      if (error) throw error;
      return data;
    },
  });

  const { data: servidores } = useQuery({
    queryKey: ["servidores-ativos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servidores")
        .select("id, nome_completo")
        .eq("ativo", true)
        .order("nome_completo")
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Obter unidade de origem do bem selecionado
  const bemSelecionado = bens?.find(b => b.id === form.watch("bem_id"));

  const createMovimentacao = useMutation({
    mutationFn: async (formData: FormData) => {
      const { data: result, error } = await supabase
        .from("movimentacoes_patrimonio")
        .insert([{
          bem_id: formData.bem_id,
          tipo: formData.tipo_movimentacao as "transferencia_interna" | "cessao" | "emprestimo" | "recolhimento",
          unidade_local_origem_id: bemSelecionado?.unidade_local_id || null,
          unidade_local_destino_id: formData.unidade_local_destino_id,
          responsavel_destino_id: formData.responsavel_destino_id || null,
          motivo: formData.motivo,
          observacoes: formData.observacoes || null,
          data_movimentacao: new Date().toISOString().split("T")[0],
          status: "pendente" as const,
        }])
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movimentacoes-patrimonio"] });
      toast.success("Movimentação registrada com sucesso");
      form.reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao registrar movimentação: ${error.message}`);
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bem_id: "",
      tipo_movimentacao: "",
      unidade_local_destino_id: "",
      responsavel_destino_id: "",
      motivo: "",
      observacoes: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    await createMovimentacao.mutateAsync(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Movimentação de Bem</DialogTitle>
          <DialogDescription>
            Registre uma transferência ou movimentação de bem patrimonial
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
              name="tipo_movimentacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Movimentação *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIPOS_MOVIMENTACAO.map((t) => (
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unidade_local_destino_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade de Destino *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {unidades?.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.codigo_unidade ? `${u.codigo_unidade} - ${u.nome_unidade}` : u.nome_unidade}
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
                name="responsavel_destino_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável Destino</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {servidores?.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.nome_completo}
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
              name="motivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o motivo da movimentação..."
                      className="min-h-[80px]"
                      {...field}
                    />
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
              <Button type="submit" disabled={createMovimentacao.isPending}>
                {createMovimentacao.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Registrar Movimentação
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
