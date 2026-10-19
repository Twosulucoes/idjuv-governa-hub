/**
 * BLOCOS DAS TELAS DE DETALHE DO INVENTÁRIO
 * Movimentação, manutenção e baixa: lista de campos (dl/dt/dd), carregando e "não encontrado".
 */

import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, type LucideIcon } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, PageHeader, type Migalha } from "@/components/design-system";
import { formatDateBR } from "@/lib/formatters";

/** Data com hora (timestamp) no padrão brasileiro; sem valor, "—". */
export function DataHora({ valor }: { valor: string | null | undefined }) {
  if (!valor) return <>—</>;
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return <>{valor}</>;
  return <>{data.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</>;
}

/** Data sem hora (coluna `date`), sem erro de fuso; sem valor, "—". */
export function DataSemHora({ valor }: { valor: string | null | undefined }) {
  return <>{valor ? formatDateBR(valor) : "—"}</>;
}

/** Card com título e uma lista de campos (`CampoDetalhe`). */
export function CardDetalhe({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="divide-y divide-border">{children}</dl>
      </CardContent>
    </Card>
  );
}

export function CampoDetalhe({ icone: Icone, rotulo, children }: { icone: LucideIcon; rotulo: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-0.5 rounded-md bg-muted p-1.5">
        <Icone className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <dt className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{rotulo}</dt>
        <dd className="mt-0.5 text-sm font-medium text-foreground break-words">{children}</dd>
      </div>
    </div>
  );
}

export function DetalheCarregando({ rotulo }: { rotulo: string }) {
  return (
    <ModuleLayout module="patrimonio">
      <div className="space-y-6" role="status" aria-busy="true" aria-label={rotulo}>
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    </ModuleLayout>
  );
}

export function DetalheNaoEncontrado({
  migalhas,
  titulo,
  icone,
  mensagem,
  voltarPara,
  rotuloVoltar,
}: {
  migalhas: Migalha[];
  titulo: string;
  icone: LucideIcon;
  mensagem: string;
  voltarPara: string;
  rotuloVoltar: string;
}) {
  return (
    <ModuleLayout module="patrimonio">
      <div className="space-y-6">
        <PageHeader migalhas={migalhas} titulo={titulo} />
        <Card className="border-dashed">
          <EmptyState
            icone={icone}
            titulo={mensagem}
            descricao="O registro solicitado não existe, foi removido ou você não tem acesso a ele."
            acao={
              <Button asChild variant="outline">
                <Link to={voltarPara}>
                  <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                  {rotuloVoltar}
                </Link>
              </Button>
            }
            className="py-12"
          />
        </Card>
      </div>
    </ModuleLayout>
  );
}
