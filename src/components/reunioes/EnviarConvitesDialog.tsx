import { useState, useEffect, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Send, 
  Loader2, 
  MessageSquare, 
  Mail, 
  Settings, 
  ChevronRight,
  Users,
  AlertCircle,
  Check,
  Eye
} from "lucide-react";
import { PreviewMensagem } from "./PreviewMensagem";
import { Link } from "react-router-dom";

interface Participante {
  id: string;
  nome_externo?: string | null;
  email_externo?: string | null;
  telefone_externo?: string | null;
  servidor?: {
    id: string;
    nome_completo: string;
    email_pessoal?: string | null;
    telefone_celular?: string | null;
  } | null;
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
  nome_assinante_1: string | null;
  cargo_assinante_1: string | null;
  texto_rodape?: string | null;
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
  const [step, setStep] = useState<"canal" | "config" | "selecao" | "preview">("canal");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [canal, setCanal] = useState<"email" | "whatsapp">("email");
  const [modeloId, setModeloId] = useState<string>("");
  const [assinaturaId, setAssinaturaId] = useState<string>("");
  const [mensagemPersonalizada, setMensagemPersonalizada] = useState("");

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep("canal");
      setSelectedIds([]);
      setCanal("email");
    }
  }, [open]);

  // Buscar modelos de mensagem
  const { data: modelos, isLoading: loadingModelos } = useQuery({
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
  const { data: assinaturas, isLoading: loadingAssinaturas } = useQuery({
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

  // Filtrar participantes com contato (considerando dados do servidor também)
  const participantesComContato = useMemo(() => {
    return participantes.filter((p) => {
      if (canal === "email") {
        return p.email_externo || p.servidor?.email_pessoal;
      }
      return p.telefone_externo || p.servidor?.telefone_celular;
    });
  }, [participantes, canal]);

  const participantesSemContato = useMemo(() => {
    return participantes.filter((p) => {
      if (canal === "email") {
        return !p.email_externo && !p.servidor?.email_pessoal;
      }
      return !p.telefone_externo && !p.servidor?.telefone_celular;
    });
  }, [participantes, canal]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
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
          mensagem_personalizada: mensagemPersonalizada || undefined,
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

      const result: any = response.data;
      console.log("Resultado envio convites:", result);

      if (!result || typeof result !== "object") {
        throw new Error("Resposta inválida do servidor");
      }

      if (canal === "whatsapp" && result.resultados) {
        const linksWhatsApp = result.resultados
          .filter((r: any) => r.sucesso && r.link_whatsapp)
          .map((r: any) => r.link_whatsapp);

        if (linksWhatsApp.length > 0) {
          // Pode ser bloqueado por popup blocker; nesse caso o link fica no console.
          window.open(linksWhatsApp[0], "_blank");

          if (linksWhatsApp.length > 1) {
            toast.info(
              `${linksWhatsApp.length} links do WhatsApp gerados. O primeiro foi aberto.`,
              { duration: 5000 }
            );
            console.log("Links WhatsApp gerados:", linksWhatsApp);
          }
        }
      }

      toast.success(`${result.sucessos} convite(s) processado(s)`);

      if (result.falhas > 0) {
        const detalhes = (result.resultados || [])
          .filter((r: any) => !r.sucesso)
          .slice(0, 3)
          .map((r: any) => `${r.participante_id}: ${r.erro || "falha"}`)
          .join(" | ");

        toast.warning(`Falhas: ${result.falhas}${detalhes ? ` — ${detalhes}` : ""}`);
        console.warn("Falhas no envio de convites:", result.resultados);
      }

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

  const getInitials = (name?: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  };

  const getNome = (p: Participante) => p.nome_externo || p.servidor?.nome_completo || "Sem nome";

  const temModelos = modelos && modelos.length > 0;

  // Step content renderer
  const renderStepContent = () => {
    switch (step) {
      case "canal":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Como deseja enviar os convites?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  canal === "email" ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setCanal("email")}
              >
                <CardContent className="p-6 text-center">
                  <Mail className="h-10 w-10 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold">E-mail</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Envio automático
                  </p>
                </CardContent>
              </Card>
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  canal === "whatsapp" ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setCanal("whatsapp")}
              >
                <CardContent className="p-6 text-center">
                  <MessageSquare className="h-10 w-10 mx-auto mb-3 text-green-600" />
                  <h3 className="font-semibold">WhatsApp</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Abre links para envio
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "config":
        return (
          <div className="space-y-4">
            {!temModelos ? (
              <div className="text-center py-6 bg-muted/50 rounded-lg border-2 border-dashed">
                <AlertCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium">Nenhum modelo configurado</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Configure um modelo de mensagem para continuar
                </p>
                <Link to="/admin/reunioes/configuracao">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar Modelos
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Modelo de Mensagem</Label>
                    <Select value={modeloId} onValueChange={handleModeloChange}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Selecione um modelo..." />
                      </SelectTrigger>
                      <SelectContent>
                        {modelos?.map((modelo) => (
                          <SelectItem key={modelo.id} value={modelo.id}>
                            {modelo.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Assinatura</Label>
                    <Select value={assinaturaId || "none"} onValueChange={(v) => setAssinaturaId(v === "none" ? "" : v)}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem assinatura</SelectItem>
                        {assinaturas?.map((assinatura) => (
                          <SelectItem key={assinatura.id} value={assinatura.id}>
                            {assinatura.nome_configuracao}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Mensagem</Label>
                    <Textarea
                      value={mensagemPersonalizada}
                      onChange={(e) => setMensagemPersonalizada(e.target.value)}
                      placeholder="Personalize a mensagem..."
                      rows={5}
                      className="mt-1.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Variáveis: {"{nome}"}, {"{data}"}, {"{hora}"}, {"{local}"}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case "selecao":
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                <Checkbox
                  checked={
                    selectedIds.length > 0 &&
                    selectedIds.length === participantesComContato.length
                  }
                  onCheckedChange={selectAll}
                />
                Selecionar todos
              </label>
              <Badge variant="secondary">
                {selectedIds.length} de {participantesComContato.length}
              </Badge>
            </div>

            <ScrollArea className="h-[280px] border rounded-lg">
              {participantesComContato.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Nenhum participante com {canal === "email" ? "e-mail" : "telefone"}</p>
                </div>
              ) : (
                <div className="divide-y">
                  {participantesComContato.map((p) => {
                    const nome = getNome(p);
                    const contato = canal === "email" 
                      ? (p.email_externo || p.servidor?.email_pessoal) 
                      : (p.telefone_externo || p.servidor?.telefone_celular);
                    const isSelected = selectedIds.includes(p.id);

                    return (
                      <label
                        key={p.id}
                        className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                          isSelected ? "bg-primary/5" : ""
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelect(p.id)}
                        />
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs bg-primary/10">
                            {getInitials(nome)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{nome}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {contato}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {participantesSemContato.length > 0 && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {participantesSemContato.length} participante(s) sem {canal === "email" ? "e-mail" : "telefone"}
              </p>
            )}
          </div>
        );

      case "preview":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Destinatários:</span>
              <Badge variant="secondary">{selectedIds.length} selecionado(s)</Badge>
            </div>
            
            <PreviewMensagem
              assunto={modeloAtual?.assunto || "Convite para Reunião"}
              corpo={mensagemPersonalizada || modeloAtual?.conteudo_html || ""}
              canal={canal}
              assinatura={assinaturaAtual ? {
                nome: assinaturaAtual.nome_assinante_1 || "",
                cargo: assinaturaAtual.cargo_assinante_1 || "",
                setor: assinaturaAtual.texto_rodape || "",
              } : undefined}
            />
          </div>
        );
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case "canal": return "Escolha o Canal";
      case "config": return "Configure a Mensagem";
      case "selecao": return "Selecione os Participantes";
      case "preview": return "Confirme o Envio";
    }
  };

  const canProceed = () => {
    switch (step) {
      case "canal": return true;
      case "config": return temModelos && mensagemPersonalizada.trim().length > 0;
      case "selecao": return selectedIds.length > 0;
      case "preview": return true;
    }
  };

  const handleNext = () => {
    switch (step) {
      case "canal": setStep("config"); break;
      case "config": setStep("selecao"); break;
      case "selecao": setStep("preview"); break;
      case "preview": handleEnviar(); break;
    }
  };

  const handleBack = () => {
    switch (step) {
      case "config": setStep("canal"); break;
      case "selecao": setStep("config"); break;
      case "preview": setStep("selecao"); break;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            {getStepTitle()}
          </DialogTitle>
          {reuniaoTitulo && (
            <DialogDescription className="truncate">
              {reuniaoTitulo}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-1.5 py-2">
          {["canal", "config", "selecao", "preview"].map((s, i) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step ? "w-6 bg-primary" : "w-1.5 bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="min-h-[300px]">
          {(loadingModelos || loadingAssinaturas) ? (
            <div className="flex items-center justify-center h-[300px]">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            renderStepContent()
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {step !== "canal" && (
            <Button variant="outline" onClick={handleBack} disabled={loading}>
              Voltar
            </Button>
          )}
          <Button 
            onClick={handleNext} 
            disabled={!canProceed() || loading}
            className="gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {step === "preview" ? (
              <>
                <Send className="h-4 w-4" />
                Enviar
              </>
            ) : (
              <>
                Continuar
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
