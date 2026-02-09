/**
 * DIALOG: NOVA CAMPANHA DE INVENTÁRIO
 * Formulário para criar nova campanha de levantamento patrimonial
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useCreateCampanhaInventario } from "@/hooks/usePatrimonio";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const TIPOS_CAMPANHA = [
  { value: "geral", label: "Geral", description: "Inventário completo de todos os bens" },
  { value: "setorial", label: "Setorial", description: "Inventário de unidades específicas" },
  { value: "rotativo", label: "Rotativo", description: "Inventário programado por cronograma" },
];

const formSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  tipo: z.enum(["geral", "setorial", "rotativo"]),
  ano: z.number().min(2020).max(2100),
  data_inicio: z.date({ required_error: "Data de início é obrigatória" }),
  data_fim: z.date({ required_error: "Data de término é obrigatória" }),
  responsavel_geral_id: z.string().optional(),
  observacoes: z.string().optional(),
}).refine(data => data.data_fim >= data.data_inicio, {
  message: "Data de término deve ser igual ou posterior à data de início",
  path: ["data_fim"],
});

type FormValues = z.infer<typeof formSchema>;

// Hook local para servidores ativos
function useServidoresAtivos() {
  return useQuery({
    queryKey: ['servidores-ativos-campanha'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('servidores')
        .select('id, nome_completo')
        .eq('situacao', 'ativo')
        .order('nome_completo');
      if (error) throw error;
      return data;
    },
  });
}

export function NovaCampanhaDialog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isOpen = searchParams.get("acao") === "nova";

  const { data: servidores } = useServidoresAtivos();
  const createCampanha = useCreateCampanhaInventario();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      tipo: "geral",
      ano: new Date().getFullYear(),
      observacoes: "",
    },
  });

  const handleClose = () => {
    setSearchParams({});
    form.reset();
  };

  const onSubmit = async (data: FormValues) => {
    try {
      await createCampanha.mutateAsync({
        nome: data.nome,
        tipo: data.tipo,
        ano: data.ano,
        data_inicio: format(data.data_inicio, "yyyy-MM-dd"),
        data_fim: format(data.data_fim, "yyyy-MM-dd"),
        responsavel_geral_id: data.responsavel_geral_id || null,
        observacoes: data.observacoes || null,
        status: "planejada",
      });
      handleClose();
    } catch (error) {
      // Erro tratado pelo hook
    }
  };

  const servidoresAtivos = servidores || [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Nova Campanha de Inventário
          </DialogTitle>
          <DialogDescription>
            Crie uma nova campanha para levantamento e conferência de bens patrimoniais.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Campanha *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Inventário Anual 2025" {...field} />
                  </FormControl>
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
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIPOS_CAMPANHA.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            <div>
                              <span className="font-medium">{tipo.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {TIPOS_CAMPANHA.find(t => t.value === field.value)?.description}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ano"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano de Referência *</FormLabel>
                    <Select 
                      onValueChange={(v) => field.onChange(parseInt(v))} 
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o ano" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[0, 1, 2].map((offset) => {
                          const year = new Date().getFullYear() + offset;
                          return (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          );
                        })}
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
                name="data_inicio"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Início *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione a data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date("2020-01-01")}
                          locale={ptBR}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_fim"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Término *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Selecione a data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => {
                            const inicio = form.getValues("data_inicio");
                            return inicio ? date < inicio : false;
                          }}
                          locale={ptBR}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="responsavel_geral_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsável Geral</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o responsável (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {servidoresAtivos.map((servidor) => (
                        <SelectItem key={servidor.id} value={servidor.id}>
                          {servidor.nome_completo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Servidor responsável pela coordenação da campanha
                  </FormDescription>
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
                      placeholder="Informações adicionais sobre a campanha..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createCampanha.isPending}>
                {createCampanha.isPending ? "Criando..." : "Criar Campanha"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
