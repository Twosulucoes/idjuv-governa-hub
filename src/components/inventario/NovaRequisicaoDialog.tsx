/**
 * DIALOG: NOVA REQUISIÇÃO DE MATERIAL
 * Formulário para criar novas requisições de material
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
import { useCreateRequisicao, useAlmoxarifados, useItensMaterial } from "@/hooks/useAlmoxarifado";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const formSchema = z.object({
  almoxarifado_id: z.string().min(1, "Selecione um almoxarifado"),
  setor_solicitante_id: z.string().min(1, "Selecione o setor"),
  finalidade: z.string().min(5, "Descreva a finalidade"),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ItemRequisicao {
  item_id: string;
  item_descricao: string;
  quantidade: number;
  unidade_medida: string;
}

interface NovaRequisicaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NovaRequisicaoDialog({ open, onOpenChange }: NovaRequisicaoDialogProps) {
  const [itensRequisicao, setItensRequisicao] = useState<ItemRequisicao[]>([]);
  const [itemSelecionado, setItemSelecionado] = useState("");
  const [quantidadeItem, setQuantidadeItem] = useState(1);
  
  const createRequisicao = useCreateRequisicao();
  const { data: almoxarifados } = useAlmoxarifados();
  const { data: itensMaterial } = useItensMaterial();

  const { data: setores } = useQuery({
    queryKey: ["setores-estrutura"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estrutura_organizacional")
        .select("id, nome, sigla")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  const { data: servidorLogado } = useQuery({
    queryKey: ["servidor-logado"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("servidores")
        .select("id, nome_completo, unidade_atual_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      almoxarifado_id: "",
      setor_solicitante_id: "",
      finalidade: "",
      observacoes: "",
    },
  });

  const adicionarItem = () => {
    if (!itemSelecionado || quantidadeItem <= 0) return;
    
    const item = itensMaterial?.find(i => i.id === itemSelecionado);
    if (!item) return;

    // Verifica se já existe
    if (itensRequisicao.some(i => i.item_id === itemSelecionado)) {
      return;
    }

    setItensRequisicao([
      ...itensRequisicao,
      {
        item_id: item.id,
        item_descricao: item.descricao,
        quantidade: quantidadeItem,
        unidade_medida: item.unidade_medida,
      },
    ]);
    setItemSelecionado("");
    setQuantidadeItem(1);
  };

  const removerItem = (itemId: string) => {
    setItensRequisicao(itensRequisicao.filter(i => i.item_id !== itemId));
  };

  const gerarNumeroRequisicao = () => {
    const ano = new Date().getFullYear();
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, "0");
    return `REQ-${ano}-${random}`;
  };

  const onSubmit = async (data: FormData) => {
    if (itensRequisicao.length === 0) {
      return;
    }

    if (!servidorLogado) {
      return;
    }

    await createRequisicao.mutateAsync({
      requisicao: {
        numero: gerarNumeroRequisicao(),
        data_solicitacao: new Date().toISOString().split("T")[0],
        solicitante_id: servidorLogado.id,
        setor_solicitante_id: data.setor_solicitante_id,
        almoxarifado_id: data.almoxarifado_id,
        finalidade: data.finalidade,
        observacoes: data.observacoes || null,
        status: "pendente",
      },
      itens: itensRequisicao.map(item => ({
        item_id: item.item_id,
        quantidade_solicitada: item.quantidade,
      })),
    });

    form.reset();
    setItensRequisicao([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Requisição de Material</DialogTitle>
          <DialogDescription>
            Solicite materiais do almoxarifado para seu setor
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="almoxarifado_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Almoxarifado *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o almoxarifado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {almoxarifados?.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.nome}
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
                name="setor_solicitante_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setor Solicitante *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o setor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {setores?.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.sigla ? `${s.sigla} - ${s.nome}` : s.nome}
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
              name="finalidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Finalidade *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a finalidade da requisição..."
                      className="min-h-[60px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Adicionar Itens */}
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium">Itens da Requisição</h4>
              
              <div className="flex gap-2">
                <Select value={itemSelecionado} onValueChange={setItemSelecionado}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione um item" />
                  </SelectTrigger>
                  <SelectContent>
                    {itensMaterial?.filter(i => !itensRequisicao.some(ir => ir.item_id === i.id)).map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.codigo_sku ? `[${item.codigo_sku}] ` : ""}{item.descricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={1}
                  className="w-24"
                  placeholder="Qtd"
                  value={quantidadeItem}
                  onChange={e => setQuantidadeItem(parseInt(e.target.value) || 1)}
                />
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={adicionarItem}
                  disabled={!itemSelecionado}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {itensRequisicao.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="w-24 text-center">Qtd</TableHead>
                      <TableHead className="w-20 text-center">Unid.</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itensRequisicao.map((item) => (
                      <TableRow key={item.item_id}>
                        <TableCell>{item.item_descricao}</TableCell>
                        <TableCell className="text-center">{item.quantidade}</TableCell>
                        <TableCell className="text-center">{item.unidade_medida}</TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removerItem(item.item_id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum item adicionado
                </p>
              )}
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
              <Button 
                type="submit" 
                disabled={createRequisicao.isPending || itensRequisicao.length === 0}
              >
                {createRequisicao.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Criar Requisição
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
