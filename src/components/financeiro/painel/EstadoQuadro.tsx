import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/** Estado comum aos quadros do painel: carregando, erro ou o conteúdo. */
export interface EstadoQuadroProps {
  carregando: boolean;
  erro: boolean;
  onTentarNovamente: () => void;
}

export function EstadoQuadro({
  carregando,
  erro,
  onTentarNovamente,
  children,
}: EstadoQuadroProps & { children: React.ReactNode }) {
  if (carregando) {
    return (
      <div className="space-y-2" aria-busy="true">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-5/6" />
        <Skeleton className="h-6 w-2/3" />
      </div>
    );
  }
  if (erro) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <AlertDescription className="flex flex-wrap items-center gap-2">
          Não foi possível carregar este quadro.
          <Button variant="outline" size="sm" onClick={onTentarNovamente}>
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  return <>{children}</>;
}
