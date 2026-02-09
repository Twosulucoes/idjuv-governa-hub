/**
 * DIALOG: CADASTRO EM LOTE DE BENS
 * Formulário para cadastrar múltiplos bens com sequência automática
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
  FormDescription,
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
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Package, CheckCircle2 } from "lucide-react";
import { useCadastroLote, type CadastroLoteResult } from "@/hooks/patrimonio/useCadastroLote";
import {
  CATEGORIAS_LABEL,
  ESTADOS_CONSERVACAO_LABEL,
  FORMAS_AQUISICAO_LABEL,
  type CategoriaBem,
  type EstadoConservacao,
  type FormaAquisicao,
} from "@/hooks/patrimonio/useCadastroBemSimplificado";
import { useState } from "react";

const formSchema = z.object({
  unidade_local_id: z.string().min(1, "Selecione a unidade"),
  quantidade: z.coerce.number().min(1, "Mínimo 1 item").max(100, "Máximo 100 itens por lote"),
  descricao: z.string().min(3, "Descrição obrigatória (mín. 3 caracteres)"),
  categoria_bem: z.string().min(1, "Selecione a categoria"),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  estado_conservacao: z.string().min(1, "Selecione o estado"),
  localizacao_especifica: z.string().optional(),
  forma_aquisicao: z.string().min(1, "Selecione a forma de aquisição"),
  processo_sei: z.string().optional(),
  nota_fiscal: z.string().optional(),
  observacao: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CadastroLoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unidadePreSelecionada?: string;
}

export function CadastroLoteDialog({ open, onOpenChange, unidadePreSelecionada }: CadastroLoteDialogProps) {
  const { cadastrarLote, isPending, progresso } = useCadastroLote();
  const [resultado, setResultado] = useState<CadastroLoteResult | null>(null);

  const { data: unidades } = useQuery({
    queryKey: ["unidades-locais-ativas"],
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

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      unidade_local_id: unidadePreSelecionada || "",
      quantidade: 1,
      descricao: "",
      categoria_bem: "",
      marca: "",
      modelo: "",
      estado_conservacao: "bom",
      localizacao_especifica: "",
      forma_aquisicao: "compra",
      processo_sei: "",
      nota_fiscal: "",
      observacao: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setResultado(null);
    const result = await cadastrarLote({
      unidade_local_id: data.unidade_local_id,
      quantidade: data.quantidade,
      descricao: data.descricao,
      categoria_bem: data.categoria_bem as CategoriaBem,
      marca: data.marca,
      modelo: data.modelo,
      estado_conservacao: data.estado_conservacao as EstadoConservacao,
      localizacao_especifica: data.localizacao_especifica,
      forma_aquisicao: data.forma_aquisicao as FormaAquisicao,
      processo_sei: data.processo_sei,
      nota_fiscal: data.nota_fiscal,
      observacao: data.observacao,
    });
    setResultado(result);
  };

  const handleClose = () => {
    if (!isPending) {
      form.reset();
      setResultado(null);
      onOpenChange(false);
    }
  };

  const progressoPercent = progresso.total > 0 ? (progresso.atual / progresso.total) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Cadastro em Lote
          </DialogTitle>
          <DialogDescription>
            Cadastre múltiplos bens idênticos com sequência automática de tombamento
          </DialogDescription>
        </DialogHeader>

        {resultado ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 text-primary">
              <CheckCircle2 className="h-8 w-8" />
              <div>
                <p className="font-semibold text-lg">{resultado.sucesso} bens cadastrados!</p>
                {resultado.falhas > 0 && (
                  <p className="text-sm text-destructive">{resultado.falhas} falhas</p>
                )}
              </div>
            </div>
            
            <div className="bg-muted rounded-lg p-4 max-h-40 overflow-y-auto">
              <p className="text-sm font-medium mb-2">Tombamentos gerados:</p>
              <div className="flex flex-wrap gap-2">
                {resultado.tombamentos.map((t) => (
                  <span key={t} className="bg-background px-2 py-1 rounded text-sm font-mono">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Fechar
              </Button>
              <Button onClick={() => setResultado(null)}>
                Novo Cadastro
              </Button>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="unidade_local_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade Local *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {unidades?.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.codigo_unidade ? `${u.codigo_unidade} - ` : ""}{u.nome_unidade}
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
                  name="quantidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade *</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={100} {...field} />
                      </FormControl>
                      <FormDescription>Máximo 100 itens por lote</FormDescription>
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
                    <FormLabel>Descrição do Bem *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Cadeira Escritório Giratória" {...field} />
                    </FormControl>
                    <FormDescription>Todos os itens terão esta descrição</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categoria_bem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(CATEGORIAS_LABEL).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estado_conservacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado de Conservação *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(ESTADOS_CONSERVACAO_LABEL).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="marca"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Dell" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="modelo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Optiplex 3080" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="forma_aquisicao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Aquisição *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(FORMAS_AQUISICAO_LABEL).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="localizacao_especifica"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Localização Específica</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Sala 201, Bloco B" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="processo_sei"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Processo SEI</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 00000.000000/2024-00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nota_fiscal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nota Fiscal</FormLabel>
                      <FormControl>
                        <Input placeholder="Número da NF" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="observacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observações adicionais sobre os bens..."
                        className="min-h-[60px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isPending && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Cadastrando...</span>
                    <span>{progresso.atual} de {progresso.total}</span>
                  </div>
                  <Progress value={progressoPercent} className="h-2" />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    <>
                      <Package className="w-4 h-4 mr-2" />
                      Cadastrar em Lote
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
