/**
 * Texto de apoio para as seções 2 a 5 da nota técnica de pesquisa de preços, que é redigida e assinada no SEI.
 * Os trechos marcados com [JUSTIFICAR] ficam para quem assina completar.
 */

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface TextoNotaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  texto: string;
}

export function TextoNotaDialog({ open, onOpenChange, texto }: TextoNotaDialogProps) {
  const { toast } = useToast();
  const [copiado, setCopiado] = useState(false);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast({ title: "Não foi possível copiar", description: "Selecione o texto e copie com Ctrl+C.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Texto de apoio da nota técnica</DialogTitle>
          <DialogDescription>
            Cole no SEI e complete os trechos [JUSTIFICAR]. A nota é redigida e assinada lá; o relatório em PDF vai anexo.
          </DialogDescription>
        </DialogHeader>
        <Textarea aria-label="Texto da nota técnica" readOnly rows={20} value={texto} className="font-mono text-xs" />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button onClick={copiar}>
            {copiado ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
            {copiado ? "Copiado" : "Copiar texto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
