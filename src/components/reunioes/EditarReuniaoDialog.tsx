import { useState, useEffect } from "react";
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
import { toast } from "sonner";
import { Calendar, Clock, MapPin, Video, Loader2 } from "lucide-react";

const formSchema = z.object({
  titulo: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  descricao: z.string().optional(),
  data: z.string().min(1, "Data é obrigatória"),
  hora: z.string().min(1, "Hora é obrigatória"),
  hora_fim: z.string().optional(),
  tipo: z.enum(["ordinaria", "extraordinaria", "audiencia", "sessao_solene", "reuniao_trabalho"]),
  local: z.string().optional(),
  link_virtual: z.string().url().optional().or(z.literal("")),
  pauta: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Reuniao {
  id: string;
  titulo: string;
  observacoes: string | null;
  data_reuniao: string;
  hora_inicio: string;
  hora_fim: string | null;
  tipo: string;
  local: string | null;
  link_virtual: string | null;
  pauta: string | null;
  status: string;
}

interface EditarReuniaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reuniao: Reuniao | null;
  onSuccess: () => void;
}

export function EditarReuniaoDialog({ open, onOpenChange, reuniao, onSuccess }: EditarReuniaoDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: "",
      descricao: "",
      data: "",
      hora: "",
      hora_fim: "",
      tipo: "ordinaria",
      local: "",
      link_virtual: "",
      pauta: "",
    },
  });

  // Preencher o form quando a reunião mudar
  useEffect(() => {
    if (reuniao && open) {
      form.reset({
        titulo: reuniao.titulo || "",
        descricao: reuniao.observacoes || "",
        data: reuniao.data_reuniao || "",
        hora: reuniao.hora_inicio || "",
        hora_fim: reuniao.hora_fim || "",
        tipo: (reuniao.tipo as FormValues["tipo"]) || "ordinaria",
        local: reuniao.local || "",
        link_virtual: reuniao.link_virtual || "",
        pauta: reuniao.pauta || "",
      });
    }
  }, [reuniao, open, form]);

  const onSubmit = async (values: FormValues) => {
    if (!reuniao) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("reunioes")
        .update({
          titulo: values.titulo,
          observacoes: values.descricao || null,
          data_reuniao: values.data,
          hora_inicio: values.hora,
          hora_fim: values.hora_fim || null,
          tipo: values.tipo as "ordinaria" | "extraordinaria" | "audiencia" | "sessao_solene" | "reuniao_trabalho",
          local: values.local || null,
          link_virtual: values.link_virtual || null,
          pauta: values.pauta || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", reuniao.id);

      if (error) throw error;

      toast.success("Reunião atualizada com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erro ao atualizar reunião: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Reunião</DialogTitle>
          <DialogDescription>
            Altere os dados da reunião conforme necessário
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Reunião de Planejamento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva brevemente o objetivo da reunião" 
                      className="resize-none"
                      rows={2}
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
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Data *
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ordinaria">Ordinária</SelectItem>
                        <SelectItem value="extraordinaria">Extraordinária</SelectItem>
                        <SelectItem value="reuniao_trabalho">Reunião de Trabalho</SelectItem>
                        <SelectItem value="audiencia">Audiência</SelectItem>
                        <SelectItem value="sessao_solene">Sessão Solene</SelectItem>
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
                name="hora"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Hora Início *
                    </FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hora_fim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Hora Fim
                    </FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="local"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    Local
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Sala de Reuniões 01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="link_virtual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    <Video className="h-3.5 w-3.5" />
                    Link da Reunião (opcional)
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="url" 
                      placeholder="https://meet.google.com/..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pauta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pauta</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Itens a serem discutidos..." 
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
