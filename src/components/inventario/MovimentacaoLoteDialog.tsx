/**
 * DIALOG: MOVIMENTAÇÃO EM LOTE DE BENS
 * Formulário para transferir múltiplos bens para outra unidade
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowRightLeft, CheckCircle2, Search, X } from "lucide-react";
import { useMovimentacaoLote } from "@/hooks/patrimonio/useMovimentacaoLote";

const TIPOS_MOVIMENTACAO = [
  { value: "transferencia_interna", label: "Transferência Interna" },
  { value: "cessao", label: "Cessão" },
  { value: "emprestimo", label: "Empréstimo" },
  { value: "recolhimento", label: "Recolhimento" },
];

const formSchema = z.object({
  unidade_destino_id: z.string().min(1, "Selecione a unidade de destino"),
  responsavel_destino_id: z.string().optional(),
  tipo_movimentacao: z.enum(["transferencia_interna", "cessao", "emprestimo", "recolhimento"]),
  motivo: z.string().trim().min(5, "Descreva o motivo (mín. 5 caracteres)").max(500, "Máximo 500 caracteres"),
  observacoes: z.string().trim().max(1000, "Máximo 1000 caracteres").optional(),
});

type FormData = z.infer<typeof formSchema>;

interface MovimentacaoLoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unidadeOrigemId?: string;
}

export function MovimentacaoLoteDialog({ open, onOpenChange, unidadeOrigemId }: MovimentacaoLoteDialogProps) {
  const { movimentarLote, isPending, progresso } = useMovimentacaoLote();
  const [bensSelecionados, setBensSelecionados] = useState<string[]>([]);
  const [busca, setBusca] = useState("");
  const [etapa, setEtapa] = useState<"selecao" | "formulario" | "resultado">("selecao");
  const [resultado, setResultado] = useState<{ sucesso: number; falhas: number } | null>(null);

  // Buscar bens disponíveis
  const { data: bens, isLoading: loadingBens } = useQuery({
    queryKey: ["bens-para-movimentacao", unidadeOrigemId],
    queryFn: async () => {
      let query = supabase
        .from("bens_patrimoniais")
        .select(`
          id, numero_patrimonio, descricao, categoria_bem, marca, modelo,
          unidade_local:unidades_locais!bens_patrimoniais_unidade_local_id_fkey(id, nome_unidade, codigo_unidade)
        `)
        .in("situacao", ["ativo", "alocado", "cadastrado", "tombado"])
        .order("numero_patrimonio");

      if (unidadeOrigemId) {
        query = query.eq("unidade_local_id", unidadeOrigemId);
      }

      const { data, error } = await query.limit(500);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

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

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      unidade_destino_id: "",
      responsavel_destino_id: "",
      tipo_movimentacao: "transferencia_interna",
      motivo: "",
      observacoes: "",
    },
  });

  // Filtrar bens pela busca
  const bensFiltrados = bens?.filter((bem) => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      bem.numero_patrimonio.toLowerCase().includes(termo) ||
      bem.descricao.toLowerCase().includes(termo) ||
      bem.marca?.toLowerCase().includes(termo) ||
      bem.modelo?.toLowerCase().includes(termo)
    );
  });

  const toggleBem = (id: string) => {
    setBensSelecionados((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const toggleTodos = () => {
    if (bensFiltrados && bensSelecionados.length === bensFiltrados.length) {
      setBensSelecionados([]);
    } else {
      setBensSelecionados(bensFiltrados?.map((b) => b.id) || []);
    }
  };

  const onSubmit = async (data: FormData) => {
    const result = await movimentarLote({
      bem_ids: bensSelecionados,
      unidade_destino_id: data.unidade_destino_id,
      responsavel_destino_id: data.responsavel_destino_id,
      tipo_movimentacao: data.tipo_movimentacao,
      motivo: data.motivo,
      observacoes: data.observacoes,
    });
    setResultado(result);
    setEtapa("resultado");
  };

  const handleClose = () => {
    if (!isPending) {
      form.reset();
      setBensSelecionados([]);
      setBusca("");
      setEtapa("selecao");
      setResultado(null);
      onOpenChange(false);
    }
  };

  const progressoPercent = progresso.total > 0 ? (progresso.atual / progresso.total) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Movimentação em Lote
          </DialogTitle>
          <DialogDescription>
            {etapa === "selecao" && "Selecione os bens que deseja movimentar"}
            {etapa === "formulario" && `${bensSelecionados.length} bens selecionados`}
            {etapa === "resultado" && "Movimentação concluída"}
          </DialogDescription>
        </DialogHeader>

        {etapa === "selecao" && (
          <div className="flex flex-col flex-1 min-h-0 space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por patrimônio, descrição, marca..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9"
                />
                {busca && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setBusca("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={toggleTodos}>
                {bensFiltrados && bensSelecionados.length === bensFiltrados.length
                  ? "Desmarcar Todos"
                  : "Selecionar Todos"}
              </Button>
            </div>

            <ScrollArea className="flex-1 border rounded-md">
              {loadingBens ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : !bensFiltrados?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum bem encontrado
                </div>
              ) : (
                <div className="divide-y">
                  {bensFiltrados.map((bem) => (
                    <label
                      key={bem.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={bensSelecionados.includes(bem.id)}
                        onCheckedChange={() => toggleBem(bem.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium">
                            {bem.numero_patrimonio}
                          </span>
                          {bem.categoria_bem && (
                            <Badge variant="outline" className="text-xs">
                              {bem.categoria_bem}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {bem.descricao}
                          {bem.marca && ` - ${bem.marca}`}
                          {bem.modelo && ` ${bem.modelo}`}
                        </p>
                        {bem.unidade_local && (
                          <p className="text-xs text-muted-foreground">
                            📍 {bem.unidade_local.nome_unidade}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="flex justify-between items-center pt-2">
              <span className="text-sm text-muted-foreground">
                {bensSelecionados.length} selecionado(s)
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => setEtapa("formulario")}
                  disabled={bensSelecionados.length === 0}
                >
                  Continuar
                </Button>
              </div>
            </div>
          </div>
        )}

        {etapa === "formulario" && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="tipo_movimentacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Movimentação *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
                  name="unidade_destino_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade de Destino *</FormLabel>
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
                  name="responsavel_destino_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsável Destino</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
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
                        maxLength={500}
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
                        maxLength={1000}
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
                    <span>Processando...</span>
                    <span>{progresso.atual} de {progresso.total}</span>
                  </div>
                  <Progress value={progressoPercent} className="h-2" />
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={() => setEtapa("selecao")} disabled={isPending}>
                  Voltar
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <ArrowRightLeft className="w-4 h-4 mr-2" />
                        Movimentar {bensSelecionados.length} Bens
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        )}

        {etapa === "resultado" && resultado && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 text-primary">
              <CheckCircle2 className="h-8 w-8" />
              <div>
                <p className="font-semibold text-lg">
                  {resultado.sucesso} movimentações registradas!
                </p>
                {resultado.falhas > 0 && (
                  <p className="text-sm text-destructive">{resultado.falhas} falhas</p>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              As movimentações foram registradas com status "pendente" e aguardam aprovação.
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Fechar
              </Button>
              <Button onClick={() => {
                setBensSelecionados([]);
                setResultado(null);
                setEtapa("selecao");
              }}>
                Nova Movimentação
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
