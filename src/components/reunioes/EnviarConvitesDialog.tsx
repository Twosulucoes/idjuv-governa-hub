import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { Send, Loader2, MessageSquare, Mail, ChevronDown, Settings, ExternalLink } from "lucide-react";
import { PreviewMensagem } from "./PreviewMensagem";
import { Link } from "react-router-dom";

interface Participante {
  id: string;
  nome_externo?: string;
  email_externo?: string;
  telefone_externo?: string;
  servidor?: {
    id: string;
    nome_completo: string;
  };
}

interface ModeloMensagem {
  id: string;
  tipo: string;
  nome: string;
  assunto: string;
  conteudo_html: string;
}

interface AssinaturaConfig {
  id: string;
  nome_configuracao: string;
  nome_assinante_1: string;
  cargo_assinante_1: string;
  texto_rodape?: string;
}

interface EnviarConvitesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reuniaoId?: string;
  reuniaoTitulo?: string;
  participantes: Participante[];
}

export function EnviarConvitesDialog({
  open,
  onOpenChange,
  reuniaoId,
  reuniaoTitulo,
  participantes,
}: EnviarConvitesDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [canal, setCanal] = useState<"email" | "whatsapp">("email");
  const [modeloId, setModeloId] = useState<string>("");
  const [assinaturaId, setAssinaturaId] = useState<string>("");
  const [mensagemPersonalizada, setMensagemPersonalizada] = useState("");
  const [showPersonalizacao, setShowPersonalizacao] = useState(false);

  // Buscar modelos de mensagem
  const { data: modelos } = useQuery({
    queryKey: ["modelos-mensagem-convite"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modelos_mensagem_reuniao")
        .select("id, tipo, nome, assunto, conteudo_html")
        .eq("ativo", true)
        .eq("tipo", "convite")
        .order("padrao", { ascending: false });
      if (error) throw error;
      return data as ModeloMensagem[];
    },
    enabled: open,
  });

  // Buscar configurações de assinatura
  const { data: assinaturas } = useQuery({
    queryKey: ["config-assinatura"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("config_assinatura_reuniao")
        .select("id, nome_configuracao, nome_assinante_1, cargo_assinante_1, texto_rodape")
        .eq("ativo", true)
        .order("padrao", { ascending: false });
      if (error) throw error;
      return data as AssinaturaConfig[];
    },
    enabled: open,
  });

  // Selecionar modelo padrão quando carregar
  useEffect(() => {
    if (modelos && modelos.length > 0 && !modeloId) {
      setModeloId(modelos[0].id);
      setMensagemPersonalizada(modelos[0].conteudo_html);
    }
  }, [modelos, modeloId]);

  // Selecionar assinatura padrão quando carregar
  useEffect(() => {
    if (assinaturas && assinaturas.length > 0 && !assinaturaId) {
      setAssinaturaId(assinaturas[0].id);
    }
  }, [assinaturas, assinaturaId]);

  // Atualizar mensagem quando mudar o modelo
  const handleModeloChange = (novoModeloId: string) => {
    setModeloId(novoModeloId);
    const modelo = modelos?.find((m) => m.id === novoModeloId);
    if (modelo) {
      setMensagemPersonalizada(modelo.conteudo_html);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const participantesComContato = participantes.filter((p) =>
      canal === "email" ? p.email_externo : p.telefone_externo
    );
    if (selectedIds.length === participantesComContato.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(participantesComContato.map((p) => p.id));
    }
  };

  const handleEnviar = async () => {
    if (selectedIds.length === 0) {
      toast.error("Selecione pelo menos um participante");
      return;
    }

    if (!reuniaoId) {
      toast.error("Erro: ID da reunião não encontrado");
      return;
    }

    setLoading(true);
    try {
      const modelo = modelos?.find((m) => m.id === modeloId);
      const assinatura = assinaturas?.find((a) => a.id === assinaturaId);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Você precisa estar autenticado");
        return;
      }

      const response = await supabase.functions.invoke("enviar-convite-reuniao", {
        body: {
          reuniao_id: reuniaoId,
          participante_ids: selectedIds,
          modelo_id: modeloId || undefined,
          mensagem_personalizada: showPersonalizacao ? mensagemPersonalizada : undefined,
          canal,
          assinatura: assinatura ? {
            nome: assinatura.nome_assinante_1,
            cargo: assinatura.cargo_assinante_1,
            setor: assinatura.texto_rodape,
          } : undefined,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao enviar convites");
      }

      const result = response.data;

      if (canal === "whatsapp" && result.resultados) {
        // Para WhatsApp, abrir os links em novas abas
        const linksWhatsApp = result.resultados
          .filter((r: any) => r.sucesso && r.link_whatsapp)
          .map((r: any) => r.link_whatsapp);

        if (linksWhatsApp.length > 0) {
          // Abrir primeiro link diretamente
          window.open(linksWhatsApp[0], "_blank");
          
          if (linksWhatsApp.length > 1) {
            toast.info(
              `${linksWhatsApp.length} links do WhatsApp gerados. O primeiro foi aberto. Os outros links estão disponíveis no console.`,
              { duration: 5000 }
            );
            console.log("Links WhatsApp gerados:", linksWhatsApp);
          }
        }
      }

      toast.success(`${result.sucessos} convite(s) enviado(s) com sucesso!`);
      
      if (result.falhas > 0) {
        toast.warning(`${result.falhas} convite(s) falharam`);
      }

      setSelectedIds([]);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao enviar convites:", error);
      toast.error("Erro ao enviar convites: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const modeloAtual = modelos?.find((m) => m.id === modeloId);
  const assinaturaAtual = assinaturas?.find((a) => a.id === assinaturaId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Enviar Convites
          </DialogTitle>
          <DialogDescription>
            Envie convites para os participantes da reunião{reuniaoTitulo && `: ${reuniaoTitulo}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Canal de envio */}
          <div className="flex gap-2">
            <Button
              variant={canal === "email" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setCanal("email")}
            >
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
            <Button
              variant={canal === "whatsapp" ? "default" : "outline"}
              size="sm"
              className="flex-1"
              onClick={() => setCanal("whatsapp")}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
          </div>

          {/* Seleção de modelo e assinatura */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Modelo de Mensagem</Label>
              <Select value={modeloId} onValueChange={handleModeloChange}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {modelos?.map((modelo) => (
                    <SelectItem key={modelo.id} value={modelo.id}>
                      {modelo.nome}
                    </SelectItem>
                  ))}
                  {(!modelos || modelos.length === 0) && (
                    <div className="p-2 text-sm text-muted-foreground">
                      Nenhum modelo configurado
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Assinatura</Label>
              <Select value={assinaturaId} onValueChange={setAssinaturaId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem assinatura</SelectItem>
                  {assinaturas?.map((assinatura) => (
                    <SelectItem key={assinatura.id} value={assinatura.id}>
                      {assinatura.nome_configuracao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Link para configuração */}
          {(!modelos || modelos.length === 0) && (
            <div className="p-3 bg-muted/50 rounded-lg border border-dashed flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Nenhum modelo de mensagem configurado
              </span>
              <Link to="/admin/reunioes/configuracao">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar
                </Button>
              </Link>
            </div>
          )}

          {/* Personalização da mensagem */}
          <Collapsible open={showPersonalizacao} onOpenChange={setShowPersonalizacao}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                Personalizar mensagem
                <ChevronDown className={`h-4 w-4 transition-transform ${showPersonalizacao ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <Textarea
                value={mensagemPersonalizada}
                onChange={(e) => setMensagemPersonalizada(e.target.value)}
                placeholder="Personalize a mensagem..."
                rows={6}
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Preview da mensagem */}
          <PreviewMensagem
            assunto={modeloAtual?.assunto || "Convite para Reunião"}
            corpo={showPersonalizacao ? mensagemPersonalizada : (modeloAtual?.conteudo_html || "")}
            canal={canal}
            assinatura={assinaturaAtual ? {
              nome: assinaturaAtual.nome_assinante_1,
              cargo: assinaturaAtual.cargo_assinante_1,
              setor: assinaturaAtual.texto_rodape,
            } : undefined}
          />

          {/* Lista de participantes */}
          <div className="border rounded-lg">
            <div className="flex items-center justify-between p-3 border-b bg-muted/50">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                <Checkbox
                  checked={
                    selectedIds.length > 0 &&
                    selectedIds.length === participantes.filter((p) =>
                      canal === "email" ? p.email_externo : p.telefone_externo
                    ).length
                  }
                  onCheckedChange={selectAll}
                />
                Selecionar todos
              </label>
              <span className="text-xs text-muted-foreground">
                {selectedIds.length} selecionado(s)
              </span>
            </div>

            <ScrollArea className="h-[200px]">
              {participantes.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum participante adicionado
                </div>
              ) : (
                <div className="divide-y">
                  {participantes.map((p) => {
                    const nome = p.nome_externo || p.servidor?.nome_completo || "Sem nome";
                    const contato = canal === "email" ? p.email_externo : p.telefone_externo;
                    const temContato = !!contato;

                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                          !temContato ? "opacity-50" : ""
                        }`}
                      >
                        <Checkbox
                          checked={selectedIds.includes(p.id)}
                          onCheckedChange={() => toggleSelect(p.id)}
                          disabled={!temContato}
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {nome[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{nome}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {contato || `Sem ${canal === "email" ? "email" : "telefone"}`}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleEnviar} disabled={loading || selectedIds.length === 0}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {canal === "whatsapp" && <ExternalLink className="mr-2 h-4 w-4" />}
            Enviar {selectedIds.length > 0 && `(${selectedIds.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
