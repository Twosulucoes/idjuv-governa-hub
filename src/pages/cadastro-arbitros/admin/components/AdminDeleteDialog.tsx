import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import type { ArbitroCadastro } from "../arbitrosAdminService";

interface Props {
  arbitro: ArbitroCadastro;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

export function AdminDeleteDialog({ arbitro, onClose, onConfirm, loading }: Props) {
  return (
    <AlertDialog open onOpenChange={() => onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o cadastro de <strong>{arbitro.nome}</strong>
            {arbitro.protocolo && <> (Protocolo: <span className="font-mono">{arbitro.protocolo}</span>)</>}?
            <br /><br />
            <span className="text-destructive font-medium">Esta ação não pode ser desfeita.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Excluir
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
