/**
 * GERADOR DE RELATÓRIOS DINÂMICOS — formatação de célula (tela, PDF e linha de filtros).
 */

import type { TipoColuna, ValorCelula } from "./tipos";

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const numero = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

/** "2026-03-05" ou "2026-03-05T10:00:00Z" → "05/03/2026", sem passar pelo fuso (data do FIPLAN é dia, não instante). */
export function dataBR(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

/** "2026-03" → "03/2026" (colunas de mês). */
export function mesBR(iso: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(iso);
  return m ? `${m[2]}/${m[1]}` : iso;
}

export function formatarValor(valor: ValorCelula, tipo: TipoColuna): string {
  if (valor === null || valor === "") return "—";
  switch (tipo) {
    case "moeda":
      return typeof valor === "number" ? moeda.format(valor) : String(valor);
    case "numero":
      return typeof valor === "number" ? numero.format(valor) : String(valor);
    case "data":
      return typeof valor === "string" ? (valor.length === 7 ? mesBR(valor) : dataBR(valor)) : String(valor);
    case "booleano":
      return valor === true ? "Sim" : valor === false ? "Não" : String(valor);
    default:
      return String(valor);
  }
}
