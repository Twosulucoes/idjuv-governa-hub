/**
 * Aba Parados do localizador: contratações e processos acompanhados do Workflow em andamento sem movimentação há mais
 * de DIAS_PARA_PARADO dias, do mais parado para o menos, com filtro por setor.
 */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Hourglass } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, StatusBadge } from "@/components/design-system";
import { BarraEvolucao } from "@/components/compras/processos/EvolucaoProcesso";
import { useProcessosParados } from "@/hooks/useLocalizadorSei";
import { DIAS_PARA_PARADO } from "@/lib/compras/evolucaoProcesso";
import { ORIGENS } from "@/lib/processos/localizador";
import { formatDateBR } from "@/lib/formatters";
import { copiarNumero, situacaoLegivel } from "./CartaoProcessoSei";

const TODOS = "__todos__";
const SEM_SETOR = "__sem_setor__";

export function ListaParados() {
  const { data, isLoading, error } = useProcessosParados();
  const [setor, setSetor] = useState(TODOS);

  const setores = useMemo(
    () => [...new Set((data ?? []).map((p) => p.onde).filter((o): o is string => !!o))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [data],
  );
  const lista = (data ?? []).filter((p) => setor === TODOS || (setor === SEM_SETOR ? !p.onde : p.onde === setor));

  if (isLoading) {
    return (
      <div className="space-y-2" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }
  if (error) {
    return <EmptyState titulo="Não foi possível carregar os parados" descricao={(error as Error).message} />;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-body text-muted-foreground">
          Em andamento e sem movimentação há mais de {DIAS_PARA_PARADO} dias, nos módulos que você acessa.
        </p>
        <Select value={setor} onValueChange={setSetor}>
          <SelectTrigger className="w-56" aria-label="Filtrar por setor">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os setores</SelectItem>
            {setores.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
            <SelectItem value={SEM_SETOR}>Sem setor informado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {lista.length === 0 ? (
        <EmptyState icone={Hourglass} titulo="Nenhum processo parado" descricao="Tudo o que você acompanha andou nos últimos dias." />
      ) : (
        <ul className="space-y-2">
          {lista.map((p) => (
            <li key={`${p.origem}:${p.registro_id}`}>
              <Card>
                <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                  <div className="w-24 shrink-0 text-center">
                    <p className="text-h3 tabular-nums text-destructive">{p.dias}</p>
                    <p className="text-caption text-muted-foreground">dias parado</p>
                  </div>
                  <Link to={ORIGENS[p.origem].link({ registro_id: p.registro_id, ref: null })} className="min-w-0 flex-1 space-y-0.5 hover:underline">
                    <p className="font-mono text-body">{p.numero_sei ?? "Sem nº SEI"}</p>
                    <p className="truncate text-body text-foreground">{p.titulo ?? "Sem objeto informado"}</p>
                    <p className="text-caption text-muted-foreground">
                      {ORIGENS[p.origem].rotulo}
                      {p.onde ? ` · ${p.onde}` : ""} · desde {formatDateBR(p.atualizado_em)}
                    </p>
                  </Link>
                  {p.origem === "contratacao" ? (
                    <BarraEvolucao processo={{ etapa: p.situacao, atualizado_em: p.atualizado_em }} />
                  ) : (
                    <StatusBadge icone={false}>{situacaoLegivel(p) ?? "—"}</StatusBadge>
                  )}
                  {p.numero_sei && (
                    <Button variant="ghost" size="sm" onClick={() => copiarNumero(p.numero_sei!)} aria-label={`Copiar número ${p.numero_sei}`}>
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
