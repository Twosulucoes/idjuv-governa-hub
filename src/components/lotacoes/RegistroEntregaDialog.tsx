import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MemorandoData {
  id: string;
  numero_protocolo: string;
  servidor_nome: string;
  unidade_destino_nome: string;
}

interface RegistroEntregaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memorando: MemorandoData | null;
}

export function RegistroEntregaDialog({ open, onOpenChange, memorando }: RegistroEntregaDialogProps) {
  const queryClient = useQueryClient();
  const [recebidoPor, setRecebidoPor] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const registrarEntregaMutation = useMutation({
    mutationFn: async () => {
      if (!memorando) throw new Error("Memorando não selecionado");

      const { error } = await supabase
        .from('memorandos_lotacao')
        .update({
          entregue: true,
          data_entrega: new Date().toISOString(),
          recebido_por: recebidoPor || memorando.servidor_nome,
          observacoes_entrega: observacoes || null,
          status: 'entregue',
        })
        .eq('id', memorando.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memorandos-lotacao"] });
      toast.success("Entrega registrada com sucesso!");
      handleClose();
    },
    onError: (error: any) => {
      toast.error(`Erro ao registrar entrega: ${error.message}`);
    },
  });

  const handleClose = () => {
    setRecebidoPor("");
    setObservacoes("");
    onOpenChange(false);
  };

  if (!memorando) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-success" />
            Registrar Entrega do Memorando
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">Protocolo</p>
            <p className="font-semibold">{memorando.numero_protocolo}</p>
            <p className="text-sm mt-2">Servidor: {memorando.servidor_nome}</p>
          </div>

          <div>
            <Label htmlFor="recebido">Recebido por</Label>
            <Input
              id="recebido"
              value={recebidoPor}
              onChange={(e) => setRecebidoPor(e.target.value)}
              placeholder={memorando.servidor_nome}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Deixe em branco para usar o nome do servidor
            </p>
          </div>

          <div>
            <Label htmlFor="obs-entrega">Observações da entrega</Label>
            <Textarea
              id="obs-entrega"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações sobre a entrega..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={() => registrarEntregaMutation.mutate()}
            disabled={registrarEntregaMutation.isPending}
          >
            {registrarEntregaMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Registrando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar Entrega
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
