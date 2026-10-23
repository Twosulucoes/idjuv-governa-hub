// Rótulos e tons do PCA usados nas telas (lista, itens e orçamento).
import type { TomStatus } from "@/components/design-system";

export const SITUACAO_PCA_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  enviado_sei: "Enviado ao SEI",
  aprovado: "Aprovado",
  publicado: "Publicado no PNCP",
};

export const TOM_SITUACAO_PCA: Record<string, TomStatus> = {
  rascunho: "pendente",
  enviado_sei: "andamento",
  aprovado: "sucesso",
  publicado: "sucesso",
};

export const PRIORIDADE_LABEL: Record<string, string> = { alta: "Alta", media: "Média", baixa: "Baixa" };

export const TOM_PRIORIDADE: Record<string, TomStatus> = { alta: "destaque", media: "neutro", baixa: "neutro" };

export const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/** "1.01.000 – Nome" para listas de ação, fonte e natureza. */
export const rotuloClassificador = (c: { codigo: string; nome: string } | undefined) =>
  c ? `${c.codigo} – ${c.nome}` : "—";
