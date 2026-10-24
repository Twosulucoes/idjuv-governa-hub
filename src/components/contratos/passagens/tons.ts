/** Tom visual da situação do pedido de passagem (lista e ficha). */

import type { TomStatus } from "@/components/design-system";

export const TOM_PEDIDO: Record<string, TomStatus> = {
  recebido: "pendente",
  cotacao_solicitada: "andamento",
  cotacao_recebida: "andamento",
  aprovado: "destaque",
  emitido: "sucesso",
  concluido: "sucesso",
  cancelado: "neutro",
};
