/**
 * Empenhos do FIP 614 com o mesmo nº SEI do processo (importados no Financeiro).
 */

import { Receipt } from "lucide-react";
import { DataTable, type ColunaTabela } from "@/components/design-system";
import { formatCurrency, formatDateBR } from "@/lib/formatters";
import type { EmpenhoDoProcesso } from "@/hooks/useProcessosContratacao";

interface Props {
  empenhos: EmpenhoDoProcesso[] | undefined;
  carregando: boolean;
  erro: boolean;
  aoTentarNovamente: () => void;
}

const colunas: ColunaTabela<EmpenhoDoProcesso>[] = [
  { id: "numero", cabecalho: "Empenho", celula: (e) => e.numero, ordenarPor: (e) => e.numero, mobile: "titulo" },
  { id: "data", cabecalho: "Data", celula: (e) => formatDateBR(e.data_empenho), ordenarPor: (e) => e.data_empenho },
  { id: "natureza", cabecalho: "Natureza", celula: (e) => e.natureza ?? "—" },
  { id: "fonte", cabecalho: "Fonte", celula: (e) => e.fonte ?? "—" },
  { id: "credor", cabecalho: "Credor", celula: (e) => e.credor ?? "—" },
  {
    id: "empenhado",
    cabecalho: "Empenhado",
    celula: (e) => formatCurrency(Number(e.valor_empenhado) - Number(e.valor_anulado)),
    ordenarPor: (e) => Number(e.valor_empenhado) - Number(e.valor_anulado),
    alinhamento: "direita",
  },
  { id: "liquidado", cabecalho: "Liquidado", celula: (e) => formatCurrency(e.valor_liquidado), alinhamento: "direita" },
  { id: "pago", cabecalho: "Pago", celula: (e) => formatCurrency(e.valor_pago), alinhamento: "direita" },
];

export function ProcessoEmpenhosTab({ empenhos, carregando, erro, aoTentarNovamente }: Props) {
  return (
    <DataTable
      rotulo="Empenhos do processo"
      dados={empenhos ?? []}
      colunas={colunas}
      chaveLinha={(e) => e.empenho_id}
      carregando={carregando}
      erro={erro ? "Não foi possível carregar os empenhos." : null}
      aoTentarNovamente={aoTentarNovamente}
      vazio={{
        icone: Receipt,
        titulo: "Nenhum empenho com este nº SEI",
        descricao: "Os empenhos aparecem aqui quando o FIP 614 é importado no Financeiro com o mesmo número do processo.",
      }}
    />
  );
}
