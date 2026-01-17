import { useState, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, UserPlus, Building2, Search, User, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busca, setBusca] = useState("");

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

  const { data: servidores = [], isLoading: loadingServidores } = useQuery({
    queryKey: ["servidores-reuniao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servidores")
        .select("id, nome_completo, foto_url")
        .eq("ativo", true)
        .order("nome_completo");
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  // Buscar participantes já adicionados
  const { data: participantesExistentes = [] } = useQuery({
    queryKey: ["participantes-existentes", reuniaoId],
    queryFn: async () => {
      if (!reuniaoId) return [];
      const { data, error } = await supabase
        .from("participantes_reuniao")
        .select("servidor_id")
        .eq("reuniao_id", reuniaoId)
        .not("servidor_id", "is", null);
      if (error) throw error;
      return data.map((p) => p.servidor_id) as string[];
    },
    enabled: open && !!reuniaoId,
  });

  const servidoresFiltrados = useMemo(() => {
    let filtered = servidores.filter((s) => !participantesExistentes.includes(s.id));
    if (busca.trim()) {
      const termo = busca.toLowerCase();
      filtered = filtered.filter((s) =>
        s.nome_completo?.toLowerCase().includes(termo)
      );
    }
    return filtered;
  }, [servidores, busca, participantesExistentes]);

  const allSelected = servidoresFiltrados.length > 0 && 
    servidoresFiltrados.every((s) => selectedIds.includes(s.id));

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(servidoresFiltrados.map((s) => s.id));
    }
  };

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleClose = () => {
    setSelectedIds([]);
    setBusca("");
    externoForm.reset();
    onOpenChange(false);
  };

  const onSubmitServidores = async () => {
    if (!reuniaoId || selectedIds.length === 0) return;
    setLoading(true);
    try {
      const inserts = selectedIds.map((servidor_id) => ({
        reuniao_id: reuniaoId,
        servidor_id,
        status: "pendente" as const,
      }));

      const { error } = await supabase.from("participantes_reuniao").insert(inserts);
      if (error) throw error;
      
      toast.success(`${selectedIds.length} participante(s) adicionado(s)!`);
      setSelectedIds([]);
      setBusca("");
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

  const getInitials = (name: string) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Adicionar Participantes</DialogTitle>
          <DialogDescription>
            Selecione servidores do IDJUV ou adicione participante externo
          </DialogDescription>
        </DialogHeader>

        <Tabs 
          value={tipoParticipante} 
          onValueChange={(v) => setTipoParticipante(v as any)}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="servidor">
              <UserPlus className="h-4 w-4 mr-2" />
              Servidores
            </TabsTrigger>
            <TabsTrigger value="externo">
              <Building2 className="h-4 w-4 mr-2" />
              Externo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="servidor" className="flex-1 flex flex-col min-h-0 mt-4 space-y-3">
            {/* Busca e ações */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar servidor..."
                  className="pl-9"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleToggleAll}
                className="whitespace-nowrap"
              >
                <Users className="h-4 w-4 mr-1" />
                {allSelected ? "Desmarcar" : "Todos"}
              </Button>
            </div>

            {/* Contador */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {servidoresFiltrados.length} servidor(es) disponível(is)
              </span>
              {selectedIds.length > 0 && (
                <Badge variant="default">
                  {selectedIds.length} selecionado(s)
                </Badge>
              )}
            </div>

            {/* Lista de servidores */}
            <ScrollArea className="flex-1 border rounded-lg" style={{ maxHeight: "280px" }}>
              {loadingServidores ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                  Carregando...
                </div>
              ) : servidoresFiltrados.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  {busca ? "Nenhum servidor encontrado" : "Todos os servidores já foram adicionados"}
                </div>
              ) : (
                <div className="divide-y">
                  {servidoresFiltrados.map((servidor) => {
                    const isSelected = selectedIds.includes(servidor.id);
                    return (
                      <div
                        key={servidor.id}
                        className={`flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors ${
                          isSelected ? "bg-primary/10" : ""
                        }`}
                        onClick={() => handleToggle(servidor.id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggle(servidor.id)}
                          aria-label={`Selecionar ${servidor.nome_completo}`}
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={servidor.foto_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(servidor.nome_completo)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="flex-1 text-sm font-medium truncate">
                          {servidor.nome_completo}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Botões */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleClose}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1" 
                disabled={loading || selectedIds.length === 0}
                onClick={onSubmitServidores}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Adicionar ({selectedIds.length})
              </Button>
            </div>
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
                    onClick={handleClose}
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
