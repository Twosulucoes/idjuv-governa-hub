import { FolderKanban } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/formatters";
import { formatarNatureza } from "@/lib/financeiro/painelExecucao";
import { useProgramacaoPorNatureza } from "@/hooks/useProcessosContratacao";
import { EstadoQuadro } from "./EstadoQuadro";

/**
 * Quanto os processos de contratação reservaram nas naturezas e ainda não virou PED nem empenho no FIPLAN. Fica fora
 * do saldo do QDD (que só enxerga o FIPLAN): é o que o Financeiro já sabe que vai ser pedido.
 */
export function ReservadoEmProcessos({ exercicio }: { exercicio: number }) {
  const { hasPermission } = useAuth();
  const programacao = useProgramacaoPorNatureza(exercicio);
  const linhas = (programacao.data ?? []).filter((l) => l.pendente_processos > 0).sort((a, b) => b.pendente_processos - a.pendente_processos);
  const total = linhas.reduce((s, l) => s + l.pendente_processos, 0);
  const processos = new Set(linhas.flatMap((l) => l.processos.filter((p) => p.pendente > 0).map((p) => p.id))).size;
  const verProgramacao = hasPermission("compras.processos.visualizar") || hasPermission("compras.processos.editar");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-h3">Reservado em processos</CardTitle>
        <CardDescription>Valor que Compras reservou nas naturezas e ainda não tem PED nem empenho no FIPLAN</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <EstadoQuadro carregando={programacao.isLoading} erro={programacao.isError} onTentarNovamente={() => programacao.refetch()}>
          {linhas.length === 0 ? (
            <p className="flex items-center gap-2 text-body text-muted-foreground">
              <FolderKanban className="h-4 w-4" aria-hidden="true" />
              Nenhum processo com reserva pendente em {exercicio}.
            </p>
          ) : (
            <>
              <p className="text-body">
                <span className="text-h2 font-semibold tabular-nums">{formatCurrency(total)}</span>{" "}
                <span className="text-muted-foreground">em {processos} {processos === 1 ? "processo" : "processos"}</span>
              </p>
              <ul className="divide-y divide-border">
                {linhas.slice(0, 5).map((l) => (
                  <li key={`${l.acao_id}-${l.fonte_recurso_id}-${l.natureza_despesa_id}`} className="flex justify-between gap-3 py-2 text-caption">
                    <span className="min-w-0">
                      <span className="font-medium text-foreground">{formatarNatureza(l.natureza_codigo)}</span>
                      <span className="text-muted-foreground"> · fonte {l.fonte_codigo} · ação {l.acao_codigo}</span>
                    </span>
                    <span className="shrink-0 text-right tabular-nums">
                      {formatCurrency(l.pendente_processos)}
                      <span className={l.saldo_livre < 0 ? "block font-semibold text-destructive" : "block text-muted-foreground"}>
                        livre {formatCurrency(l.saldo_livre)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
          {verProgramacao && (
            <Link to="/compras/processos/programacao" className="text-caption font-medium text-primary underline-offset-2 hover:underline">
              Ver a programação por natureza
            </Link>
          )}
        </EstadoQuadro>
      </CardContent>
    </Card>
  );
}
