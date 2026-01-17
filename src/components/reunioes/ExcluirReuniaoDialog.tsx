import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ExcluirReuniaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reuniaoId: string | undefined;
  reuniaoTitulo: string;
  onSuccess: () => void;
}

export function ExcluirReuniaoDialog({ 
  open, 
  onOpenChange, 
  reuniaoId, 
  reuniaoTitulo,
  onSuccess 
}: ExcluirReuniaoDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!reuniaoId) return;
    
    setLoading(true);
    try {
      // Primeiro, excluir os participantes associados
      const { error: participantesError } = await supabase
        .from("participantes_reuniao")
        .delete()
        .eq("reuniao_id", reuniaoId);

      if (participantesError) {
        console.error("Erro ao excluir participantes:", participantesError);
        // Continua mesmo se falhar, pois pode não haver participantes
      }

      // Depois, excluir a reunião
      const { error } = await supabase
        .from("reunioes")
        .delete()
        .eq("id", reuniaoId);

      if (error) throw error;

      toast.success("Reunião excluída com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erro ao excluir reunião: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Reunião</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a reunião{" "}
            <strong>"{reuniaoTitulo}"</strong>?
            <br />
            <br />
            Esta ação não pode ser desfeita. Todos os participantes e dados 
            relacionados serão permanentemente removidos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
