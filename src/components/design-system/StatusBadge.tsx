import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Ban, CheckCircle2, Circle, Clock, Star } from "lucide-react";
import { STATUS_COLORS } from "@/lib/statusColors";
import { cn } from "@/lib/utils";

export type TomStatus = "sucesso" | "pendente" | "andamento" | "erro" | "neutro" | "destaque";

const CLASSES: Record<TomStatus, string> = {
  sucesso: STATUS_COLORS.success,
  pendente: STATUS_COLORS.pending,
  andamento: STATUS_COLORS.inProgress,
  erro: STATUS_COLORS.error,
  neutro: STATUS_COLORS.neutral,
  destaque: STATUS_COLORS.highlight,
};

const ICONES: Record<TomStatus, LucideIcon> = {
  sucesso: CheckCircle2,
  pendente: AlertTriangle,
  andamento: Clock,
  erro: Ban,
  neutro: Circle,
  destaque: Star,
};

/**
 * Situações de domínio mais comuns → tom visual. Comparação sem acento e sem
 * caixa; `_`, `-` e espaço são equivalentes. O que não estiver aqui cai em "neutro".
 */
const TOM_POR_SITUACAO: Record<string, TomStatus> = {
  ativo: "sucesso",
  aprovado: "sucesso",
  concluido: "sucesso",
  finalizado: "sucesso",
  pago: "sucesso",
  homologado: "sucesso",
  publicado: "sucesso",
  deferido: "sucesso",
  pendente: "pendente",
  aguardando: "pendente",
  rascunho: "pendente",
  em_aprovacao: "pendente",
  vencendo: "pendente",
  em_andamento: "andamento",
  em_analise: "andamento",
  em_execucao: "andamento",
  tramitando: "andamento",
  em_tramitacao: "andamento",
  processando: "andamento",
  cancelado: "erro",
  rejeitado: "erro",
  reprovado: "erro",
  indeferido: "erro",
  vencido: "erro",
  bloqueado: "erro",
  erro: "erro",
  inativo: "neutro",
  arquivado: "neutro",
  suspenso: "neutro",
  urgente: "destaque",
};

export function tomDaSituacao(situacao: string | null | undefined): TomStatus {
  if (!situacao) return "neutro";
  const chave = situacao
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");
  if (TOM_POR_SITUACAO[chave]) return TOM_POR_SITUACAO[chave];
  // Feminino e plural: "concluída", "ativas", "cancelados" → forma do mapa.
  const singular = chave.replace(/s$/, "");
  const masculino = singular.replace(/a$/, "o");
  return TOM_POR_SITUACAO[singular] ?? TOM_POR_SITUACAO[masculino] ?? "neutro";
}

export interface StatusBadgeProps {
  /** Texto exibido. Sempre visível: status nunca é só cor. */
  children: React.ReactNode;
  /** Tom explícito. Sem ele, é deduzido do texto (quando `children` é string). */
  tom?: TomStatus;
  /** `false` esconde o ícone (ex.: tabelas muito densas). */
  icone?: boolean;
  className?: string;
}

/** Selo de situação padrão: cor semântica + ícone + texto. */
export function StatusBadge({ children, tom, icone = true, className }: StatusBadgeProps) {
  const tomFinal = tom ?? (typeof children === "string" ? tomDaSituacao(children) : "neutro");
  const Icone = ICONES[tomFinal];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-caption font-medium",
        CLASSES[tomFinal],
        className,
      )}
    >
      {icone && <Icone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
      {children}
    </span>
  );
}
