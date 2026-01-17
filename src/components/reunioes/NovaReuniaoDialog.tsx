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
import { toast } from "sonner";
import { Calendar, Clock, MapPin, Video, Users, Loader2 } from "lucide-react";

const formSchema = z.object({
  titulo: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  descricao: z.string().optional(),
  data: z.string().min(1, "Data é obrigatória"),
  hora: z.string().min(1, "Hora é obrigatória"),
  duracao_minutos: z.coerce.number().min(15, "Mínimo 15 minutos"),
  tipo: z.enum(["presencial", "virtual", "hibrida"]),
  local: z.string().optional(),
  link_virtual: z.string().url().optional().or(z.literal("")),
  pauta: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NovaReuniaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function NovaReuniaoDialog({ open, onOpenChange, onSuccess }: NovaReuniaoDialogProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: "",
      descricao: "",
      data: "",
      hora: "",
      duracao_minutos: 60,
      tipo: "presencial",
      local: "",
      link_virtual: "",
      pauta: "",
    },
  });

  const tipoSelecionado = form.watch("tipo");

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const { error } = await supabase.from("reunioes").insert({
        titulo: values.titulo,
        objetivo: values.descricao || null,
        data_reuniao: values.data,
        hora_inicio: values.hora,
        tipo_reuniao: values.tipo,
        local: values.local || null,
        link_virtual: values.link_virtual || null,
        pauta: values.pauta || null,
        status: "agendada",
      });

      if (error) throw error;

      toast.success("Reunião criada com sucesso!");
      form.reset();
      onSuccess();
    } catch (error: any) {
      toast.error("Erro ao criar reunião: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Reunião</DialogTitle>
          <DialogDescription>
            Preencha os dados para agendar uma nova reunião
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

            {/* Data e Hora - responsivo */}
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
                name="hora"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      Hora *
                    </FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duracao_minutos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (min)</FormLabel>
                    <FormControl>
                      <Input type="number" min={15} step={15} {...field} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="presencial">
                          <span className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Presencial
                          </span>
                        </SelectItem>
                        <SelectItem value="virtual">
                          <span className="flex items-center gap-2">
                            <Video className="h-4 w-4" />
                            Virtual
                          </span>
                        </SelectItem>
                        <SelectItem value="hibrida">
                          <span className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Híbrida
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {(tipoSelecionado === "presencial" || tipoSelecionado === "hibrida") && (
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
            )}

            {(tipoSelecionado === "virtual" || tipoSelecionado === "hibrida") && (
              <FormField
                control={form.control}
                name="link_virtual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <Video className="h-3.5 w-3.5" />
                      Link da Reunião
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
            )}

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
                Criar Reunião
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
