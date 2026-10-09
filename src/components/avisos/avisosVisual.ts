/**
 * Cores e ícones compartilhados pelo mural, sino e destaque de avisos.
 */

import { AlertTriangle, Bell, Info, Megaphone, type LucideIcon } from "lucide-react";
import type { EventoDataImportante, PrioridadeAviso } from "@/types/avisos";

interface EstiloPrioridade {
  classe: string; // caixa colorida (sino e destaque)
  borda: string; // borda lateral do card no mural
  texto: string; // cor do ícone
  icone: LucideIcon;
}

export const PRIORIDADE_AVISO_ESTILO: Record<PrioridadeAviso, EstiloPrioridade> = {
  urgente: {
    classe: "border-destructive/50 bg-destructive/10 text-destructive",
    borda: "border-l-destructive",
    texto: "text-destructive",
    icone: AlertTriangle,
  },
  alta: {
    classe: "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    borda: "border-l-amber-500",
    texto: "text-amber-600 dark:text-amber-300",
    icone: Megaphone,
  },
  normal: {
    classe: "border-primary/40 bg-primary/5 text-primary",
    borda: "border-l-primary",
    texto: "text-primary",
    icone: Bell,
  },
  baixa: {
    classe: "border-border bg-muted text-muted-foreground",
    borda: "border-l-muted-foreground",
    texto: "text-muted-foreground",
    icone: Info,
  },
};

export const TIPO_DATA_ESTILO: Record<EventoDataImportante["tipo"], string> = {
  prazo: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
  evento: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  reuniao: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200",
  comemorativa: "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-200",
  outro: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  feriado: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  ponto_facultativo: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200",
  aniversario: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
};

/** "2026-10-09" -> "09/10" (sem passar por Date, que mudaria o dia pelo fuso). */
export function diaMes(data: string): string {
  const [, m, d] = data.split("-");
  return `${d}/${m}`;
}
