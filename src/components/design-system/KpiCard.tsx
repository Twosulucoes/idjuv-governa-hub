import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { VALUE_COLORS } from "@/lib/statusColors";
import { cn } from "@/lib/utils";

export interface KpiCardProps {
  rotulo: string;
  /** Valor já formatado (ex.: "R$ 1,2 mi", "342"). */
  valor: React.ReactNode;
  /** Texto secundário abaixo do valor (ex.: "Concluído", "há 2 dias"). */
  detalhe?: React.ReactNode;
  /** Variação em % contra o período anterior (ex.: 4.2 ou -1.5). */
  variacao?: number | null;
  /** Período de comparação (ex.: "vs. mês anterior"). */
  periodo?: string;
  /** `false` quando subir é ruim (ex.: despesas, faltas). */
  subirEhBom?: boolean;
  icone?: LucideIcon;
  carregando?: boolean;
  className?: string;
}

const pct = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1, signDisplay: "exceptZero" });

/** Indicador de painel: rótulo, valor tabular e variação com ícone e sinal (nunca só cor). */
export function KpiCard({
  rotulo,
  valor,
  detalhe,
  variacao,
  periodo,
  subirEhBom = true,
  icone: Icone,
  carregando = false,
  className,
}: KpiCardProps) {
  const temVariacao = typeof variacao === "number" && Number.isFinite(variacao);
  // Direção pelo valor exibido (1 casa): 0,04% aparece "0%" e conta como estável.
  const arredondada = temVariacao ? Math.round(variacao! * 10) / 10 : 0;
  const direcao = arredondada === 0 ? "estavel" : arredondada > 0 ? "sobe" : "desce";
  const IconeVariacao = direcao === "sobe" ? TrendingUp : direcao === "desce" ? TrendingDown : Minus;
  const boa = direcao === "estavel" ? null : (direcao === "sobe") === subirEhBom;
  const cor = boa === null ? VALUE_COLORS.neutral : boa ? VALUE_COLORS.positive : VALUE_COLORS.negative;

  return (
    <Card className={className}>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-body text-muted-foreground">{rotulo}</p>
          {Icone && <Icone className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
        </div>
        {carregando ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="text-h1 tabular-nums text-foreground">{valor}</p>
        )}
        {detalhe != null && !carregando && <p className="text-caption text-muted-foreground">{detalhe}</p>}
        {temVariacao && !carregando && (
          <p className={cn("flex items-center gap-1 text-caption font-medium tabular-nums", cor)}>
            <IconeVariacao className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {pct.format(arredondada)}%
              {periodo && <span className="font-normal text-muted-foreground"> {periodo}</span>}
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
