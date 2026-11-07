import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * Falha da última gravação, no topo do formulário, até a próxima tentativa (o aviso flutuante some em segundos).
 * A mensagem vem de `mensagemDeErro` (`@/lib/erroBanco`). Teste do RH de 06/11/2026, item 24.
 */
export function ErroGravacao({ mensagem, titulo = "Não foi possível gravar" }: { mensagem: string | null; titulo?: string }) {
  if (!mensagem) return null;
  return (
    <Alert variant="destructive" role="alert">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{titulo}</AlertTitle>
      <AlertDescription>{mensagem}</AlertDescription>
    </Alert>
  );
}
