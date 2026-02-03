/**
 * DIALOG: NOVO ITEM DE MATERIAL
 * Formulário para cadastro de novos itens no almoxarifado
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
import { useCreateItemMaterial } from "@/hooks/useAlmoxarifado";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  codigo: z.string().min(1, "Código é obrigatório"),
  codigo_sku: z.string().optional(),
  descricao: z.string().min(3, "Descrição deve ter pelo menos 3 caracteres"),
  especificacao: z.string().optional(),
  unidade_medida: z.string().min(1, "Unidade de medida é obrigatória"),
  categoria_id: z.string().optional(),
  estoque_minimo: z.coerce.number().optional(),
  estoque_maximo: z.coerce.number().optional(),
  ponto_reposicao: z.coerce.number().optional(),
  valor_unitario_medio: z.coerce.number().optional(),
});

type FormData = z.infer<typeof formSchema>;

const UNIDADES_MEDIDA = [
  { value: "UN", label: "Unidade" },
  { value: "CX", label: "Caixa" },
  { value: "PC", label: "Pacote" },
  { value: "KG", label: "Quilograma" },
  { value: "L", label: "Litro" },
  { value: "M", label: "Metro" },
  { value: "M2", label: "Metro Quadrado" },
  { value: "RL", label: "Rolo" },
  { value: "FR", label: "Frasco" },
  { value: "TB", label: "Tubo" },
  { value: "GL", label: "Galão" },
  { value: "SC", label: "Saco" },
];

interface NovoItemMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NovoItemMaterialDialog({ open, onOpenChange }: NovoItemMaterialDialogProps) {
  const createItem = useCreateItemMaterial();

  const { data: categorias } = useQuery({
    queryKey: ["categorias-material"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias_material")
        .select("id, nome, codigo")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      codigo: "",
      codigo_sku: "",
      descricao: "",
      especificacao: "",
      unidade_medida: "UN",
      categoria_id: "",
      estoque_minimo: 0,
      estoque_maximo: 0,
      ponto_reposicao: 0,
      valor_unitario_medio: 0,
    },
  });

  const onSubmit = async (data: FormData) => {
    await createItem.mutateAsync({
      codigo: data.codigo,
      codigo_sku: data.codigo_sku || null,
      descricao: data.descricao,
      especificacao: data.especificacao || null,
      unidade_medida: data.unidade_medida,
      categoria_id: data.categoria_id || null,
      estoque_minimo: data.estoque_minimo || null,
      estoque_maximo: data.estoque_maximo || null,
      ponto_reposicao: data.ponto_reposicao || null,
      valor_unitario_medio: data.valor_unitario_medio || null,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Item de Material</DialogTitle>
          <DialogDescription>
            Cadastre um novo item no almoxarifado
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="codigo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código *</FormLabel>
                    <FormControl>
                      <Input placeholder="MAT001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="codigo_sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="SKU opcional" {...field} />
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
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do material" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="especificacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especificação Técnica</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalhes técnicos do material..."
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
                name="unidade_medida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade de Medida *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNIDADES_MEDIDA.map((u) => (
                          <SelectItem key={u.value} value={u.value}>
                            {u.label} ({u.value})
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
                name="categoria_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categorias?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="estoque_minimo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque Mínimo</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="estoque_maximo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estoque Máximo</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ponto_reposicao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ponto Reposição</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="valor_unitario_medio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Unitário Médio (R$)</FormLabel>
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
              <Button type="submit" disabled={createItem.isPending}>
                {createItem.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Cadastrar Item
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
