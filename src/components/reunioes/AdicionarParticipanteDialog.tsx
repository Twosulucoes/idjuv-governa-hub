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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, UserPlus, Building2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const servidorSchema = z.object({
  servidor_id: z.string().min(1, "Selecione um servidor"),
});

const externoSchema = z.object({
  nome_externo: z.string().min(2, "Nome é obrigatório"),
  email_externo: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone_externo: z.string().optional(),
  cargo_externo: z.string().optional(),
  orgao_externo: z.string().optional(),
});

interface AdicionarParticipanteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reuniaoId?: string;
  onSuccess: () => void;
}

export function AdicionarParticipanteDialog({
  open,
  onOpenChange,
  reuniaoId,
  onSuccess,
}: AdicionarParticipanteDialogProps) {
  const [loading, setLoading] = useState(false);
  const [tipoParticipante, setTipoParticipante] = useState<"servidor" | "externo">("servidor");

  const servidorForm = useForm({
    resolver: zodResolver(servidorSchema),
    defaultValues: { servidor_id: "" },
  });

  const externoForm = useForm({
    resolver: zodResolver(externoSchema),
    defaultValues: {
      nome_externo: "",
      email_externo: "",
      telefone_externo: "",
      cargo_externo: "",
      orgao_externo: "",
    },
  });

  const { data: servidores } = useQuery({
    queryKey: ["servidores-ativos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servidores")
        .select("id, nome_completo")
        .eq("ativo", true)
        .order("nome_completo");
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  const onSubmitServidor = async (values: z.infer<typeof servidorSchema>) => {
    if (!reuniaoId) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("participantes_reuniao").insert({
        reuniao_id: reuniaoId,
        servidor_id: values.servidor_id,
        status: "pendente",
      });
      if (error) throw error;
      toast.success("Participante adicionado!");
      servidorForm.reset();
      onSuccess();
    } catch (error: any) {
      toast.error("Erro: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const onSubmitExterno = async (values: z.infer<typeof externoSchema>) => {
    if (!reuniaoId) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("participantes_reuniao").insert({
        reuniao_id: reuniaoId,
        nome_externo: values.nome_externo,
        email_externo: values.email_externo || null,
        telefone_externo: values.telefone_externo || null,
        cargo_externo: values.cargo_externo || null,
        orgao_externo: values.orgao_externo || null,
        status: "pendente",
      });
      if (error) throw error;
      toast.success("Participante externo adicionado!");
      externoForm.reset();
      onSuccess();
    } catch (error: any) {
      toast.error("Erro: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Participante</DialogTitle>
          <DialogDescription>
            Adicione um servidor do IDJUV ou participante externo
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tipoParticipante} onValueChange={(v) => setTipoParticipante(v as any)}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="servidor">
              <UserPlus className="h-4 w-4 mr-2" />
              Servidor
            </TabsTrigger>
            <TabsTrigger value="externo">
              <Building2 className="h-4 w-4 mr-2" />
              Externo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="servidor" className="mt-4">
            <Form {...servidorForm}>
              <form onSubmit={servidorForm.handleSubmit(onSubmitServidor)} className="space-y-4">
                <FormField
                  control={servidorForm.control}
                  name="servidor_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Servidor</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um servidor" />
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

                <div className="flex gap-3 pt-2">
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
                    Adicionar
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="externo" className="mt-4">
            <Form {...externoForm}>
              <form onSubmit={externoForm.handleSubmit(onSubmitExterno)} className="space-y-4">
                <FormField
                  control={externoForm.control}
                  name="nome_externo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={externoForm.control}
                  name="email_externo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={externoForm.control}
                    name="cargo_externo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cargo</FormLabel>
                        <FormControl>
                          <Input placeholder="Cargo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={externoForm.control}
                    name="orgao_externo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Órgão</FormLabel>
                        <FormControl>
                          <Input placeholder="Órgão/Empresa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={externoForm.control}
                  name="telefone_externo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-2">
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
                    Adicionar
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
