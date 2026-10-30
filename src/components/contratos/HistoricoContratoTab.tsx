/**
 * Trilha do contrato (audit_log_licitacoes): cadastro e mudanças do contrato, dos itens, das designações de gestor e
 * fiscais e das alterações (aditivo, apostilamento, suspensão, rescisão), com quem fez e quando. Os textos vêm de
 * src/lib/contratos/historico.ts.
 */

import { useMemo } from "react";
import { History } from "lucide-react";
import { EmptyState } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useHistoricoContrato } from "@/hooks/useContratos";
import { descreverHistorico } from "@/lib/contratos/historico";
import { formatarDataHora } from "@/lib/passagens/regras";

export function HistoricoContratoTab({ contratoId }: { contratoId: string }) {
  const historico = useHistoricoContrato(contratoId);
  // o recálculo do contrato sem campo visível mudado não vira linha
  const registros = useMemo(
    () => (historico.data ?? []).flatMap((h) => {
      const d = descreverHistorico(h);
      return d ? [{ h, ...d }] : [];
    }),
    [historico.data],
  );

  if (historico.isLoading) return <Skeleton className="h-48" />;
  if (historico.isError) {
    return <EmptyState titulo="Não foi possível carregar o histórico" acao={<Button variant="outline" onClick={() => historico.refetch()}>Tentar novamente</Button>} />;
  }
  if (!registros.length) return <EmptyState icone={History} titulo="Sem registros ainda" />;

  return (
    <ol className="relative space-y-4 border-l border-border pl-6">
      {registros.map(({ h, titulo, detalhes }) => (
        <li key={h.id} className="relative">
          <span className="absolute -left-[1.81rem] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary" aria-hidden="true" />
          <p className="text-sm font-medium">
            {formatarDataHora(h.created_at)}
            {h.usuario_nome && <span className="font-normal text-muted-foreground"> · {h.usuario_nome}</span>}
          </p>
          <p className="text-sm">{titulo}</p>
          {detalhes.length > 0 && (
            <ul className="mt-1 space-y-0.5 text-sm text-muted-foreground">
              {detalhes.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          )}
        </li>
      ))}
    </ol>
  );
}
