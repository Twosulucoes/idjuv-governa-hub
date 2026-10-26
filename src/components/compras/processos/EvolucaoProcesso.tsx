/**
 * Evolução do processo de contratação pelas seis fases (src/lib/compras/evolucaoProcesso.ts): a barra compacta da
 * lista e a linha do tempo das fases da ficha, com a data de início e os dias em cada uma.
 */

import { Check, X } from "lucide-react";
import { formatDateBR } from "@/lib/formatters";
import {
  DIAS_PARA_PARADO,
  FASES_COMPRA,
  evolucaoDoProcesso,
  linhaDoTempoFases,
  type FaseNaLinhaDoTempo,
} from "@/lib/compras/evolucaoProcesso";
import { cn } from "@/lib/utils";
import type { ProcessoAndamento, ProcessoContratacao } from "@/types/processos";

const dias = (n: number) => (n === 1 ? "1 dia" : `${n} dias`);

/** Barra da lista: seis segmentos, a fase e o percentual. */
export function BarraEvolucao({ processo }: { processo: Pick<ProcessoContratacao, "etapa" | "atualizado_em"> }) {
  const e = evolucaoDoProcesso(processo);
  const rotulo = e.cancelado ? "Cancelado" : `${e.fase?.rotulo ?? "Sem fase"} · ${e.percentual}%`;
  return (
    <div className="min-w-[9rem] space-y-1" title={e.parado ? `Sem movimentação há ${dias(e.diasSemMovimentacao ?? 0)}` : undefined}>
      <div
        className="flex gap-0.5"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={e.percentual}
        aria-label={`Evolução do processo: ${rotulo}`}
      >
        {FASES_COMPRA.map((f, i) => (
          <span
            key={f.codigo}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              i > e.indiceAtual ? "bg-muted" : e.cancelado ? "bg-muted-foreground/40" : e.parado && i === e.indiceAtual ? "bg-warning" : "bg-primary",
            )}
          />
        ))}
      </div>
      <span className={cn("block text-xs", e.cancelado ? "text-muted-foreground" : e.parado ? "font-medium text-warning" : "text-muted-foreground")}>
        {rotulo}
        {e.parado && " · parado"}
      </span>
    </div>
  );
}

function Marcador({ item, parado }: { item: FaseNaLinhaDoTempo; parado: boolean }) {
  const base = "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold";
  if (item.situacao === "concluida") return <span className={cn(base, "border-primary bg-primary text-primary-foreground")}><Check className="h-4 w-4" aria-hidden="true" /></span>;
  if (item.situacao === "cancelada") return <span className={cn(base, "border-muted-foreground/40 bg-muted text-muted-foreground")}><X className="h-4 w-4" aria-hidden="true" /></span>;
  if (item.situacao === "atual") return <span className={cn(base, parado ? "border-warning bg-warning/15 text-warning" : "border-primary bg-primary/15 text-primary")}>{FASES_COMPRA.indexOf(item.fase) + 1}</span>;
  return <span className={cn(base, "border-border bg-background text-muted-foreground")}>{FASES_COMPRA.indexOf(item.fase) + 1}</span>;
}

const SITUACAO: Record<FaseNaLinhaDoTempo["situacao"], string> = {
  concluida: "concluída",
  atual: "fase atual",
  pendente: "a fazer",
  cancelada: "cancelado aqui",
};

/** Linha do tempo das fases: horizontal na tela larga, vertical no celular. */
export function LinhaDoTempoFases({
  processo,
  andamentos,
}: {
  processo: Pick<ProcessoContratacao, "etapa" | "atualizado_em">;
  andamentos: Pick<ProcessoAndamento, "etapa" | "data" | "data_informada">[];
}) {
  const e = evolucaoDoProcesso(processo, undefined, andamentos);
  const fases = linhaDoTempoFases(processo, andamentos);
  const resumo = e.cancelado
    ? "Processo cancelado"
    : `${e.fase?.rotulo ?? "Sem fase"} · ${e.percentual}% do caminho`;

  return (
    <section aria-label="Evolução do processo" className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">Evolução</h2>
        <p className={cn("text-sm", e.parado ? "font-medium text-warning" : "text-muted-foreground")}>
          {resumo}
          {e.parado && ` · parado há ${dias(e.diasSemMovimentacao ?? 0)} (mais de ${DIAS_PARA_PARADO})`}
        </p>
      </div>
      <ol className="grid gap-3 sm:grid-cols-6 sm:gap-2">
        {fases.map((item, i) => (
          <li key={item.fase.codigo} className="relative flex gap-3 sm:flex-col sm:items-center sm:gap-2 sm:text-center">
            {i < fases.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-3.5 top-7 h-[calc(100%-1rem)] w-0.5 sm:left-[calc(50%+1rem)] sm:top-3.5 sm:h-0.5 sm:w-[calc(100%-1.5rem)]",
                  fases[i + 1].situacao === "pendente" ? "bg-border" : "bg-primary",
                )}
              />
            )}
            <Marcador item={item} parado={e.parado} />
            <div className="min-w-0 space-y-0.5 pb-1">
              <p className={cn("text-sm font-medium", item.situacao === "pendente" && "text-muted-foreground")}>{item.fase.rotulo}</p>
              <p className="text-xs text-muted-foreground">
                {item.inicio ? `desde ${formatDateBR(item.inicio)}` : SITUACAO[item.situacao]}
              </p>
              {item.dias !== null && (
                <p className={cn("text-xs", item.situacao === "atual" && e.parado ? "font-medium text-warning" : "text-muted-foreground")}>
                  {item.situacao === "atual" ? `há ${dias(item.dias)}` : dias(item.dias)}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
