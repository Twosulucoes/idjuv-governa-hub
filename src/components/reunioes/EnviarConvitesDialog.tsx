import { useState } from "react";
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
import { toast } from "sonner";
import { Send, Loader2, MessageSquare } from "lucide-react";

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

interface EnviarConvitesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reuniaoId?: string;
  participantes: Participante[];
}

export function EnviarConvitesDialog({
  open,
  onOpenChange,
  reuniaoId,
  participantes,
}: EnviarConvitesDialogProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [canal, setCanal] = useState<"email" | "whatsapp">("whatsapp");

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === participantes.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(participantes.map((p) => p.id));
    }
  };

  const handleEnviar = async () => {
    if (selectedIds.length === 0) {
      toast.error("Selecione pelo menos um participante");
      return;
    }

    setLoading(true);
    try {
      // Simula envio - em produção seria via edge function
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      toast.success(`Convites enviados para ${selectedIds.length} participante(s)!`);
      setSelectedIds([]);
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erro ao enviar convites: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const participantesComContato = participantes.filter(
    (p) => p.email_externo || p.telefone_externo
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Enviar Convites
          </DialogTitle>
          <DialogDescription>
            Selecione os participantes para enviar o convite da reunião
          </DialogDescription>
        </DialogHeader>

        {/* Canal de envio */}
        <div className="flex gap-2">
          <Button
            variant={canal === "whatsapp" ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => setCanal("whatsapp")}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            WhatsApp
          </Button>
          <Button
            variant={canal === "email" ? "default" : "outline"}
            size="sm"
            className="flex-1"
            onClick={() => setCanal("email")}
          >
            <Send className="h-4 w-4 mr-2" />
            Email
          </Button>
        </div>

        {/* Lista de participantes */}
        <div className="border rounded-lg">
          <div className="flex items-center justify-between p-3 border-b bg-muted/50">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
              <Checkbox
                checked={selectedIds.length === participantes.length && participantes.length > 0}
                onCheckedChange={selectAll}
              />
              Selecionar todos
            </label>
            <span className="text-xs text-muted-foreground">
              {selectedIds.length} selecionado(s)
            </span>
          </div>

          <ScrollArea className="h-[240px]">
            {participantes.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Nenhum participante adicionado
              </div>
            ) : (
              <div className="divide-y">
                {participantes.map((p) => {
                  const nome = p.nome_externo || p.servidor?.nome_completo || "Sem nome";
                  const contato = p.email_externo || p.telefone_externo;
                  const temContato = canal === "email" ? p.email_externo : p.telefone_externo;
                  
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
                          {temContato || `Sem ${canal === "email" ? "email" : "telefone"}`}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleEnviar} disabled={loading || selectedIds.length === 0}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar {selectedIds.length > 0 && `(${selectedIds.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
