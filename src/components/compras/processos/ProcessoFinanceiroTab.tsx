/**
 * Fase financeira do processo no FIPLAN: reservado → PED autorizado → empenhado → liquidado → pago. PEDs do relatório
 * "Consultar PED" e empenhos do FIP 614 ligados pelo nº do processo (a chave 000885/26-92).
 */

import { FileClock } from "lucide-react";
import { DataTable, KpiCard, StatusBadge, type ColunaTabela } from "@/components/design-system";
import { faseFinanceira } from "@/lib/compras/faseFinanceira";
import { formatCurrency, formatDateBR } from "@/lib/formatters";
import { SITUACAO_AUTORIZADO } from "@/lib/importacao/importadores/pedsFiplanParser";
import type { EmpenhoDoProcesso, FinanceiroDoProcesso, PedDoProcesso } from "@/hooks/useProcessosContratacao";
import { ProcessoEmpenhosTab } from "./ProcessoEmpenhosTab";

interface Consulta<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => unknown;
}

interface Props {
  financeiro: FinanceiroDoProcesso | undefined;
  carregandoFinanceiro: boolean;
  peds: Consulta<PedDoProcesso[]>;
  empenhos: Consulta<EmpenhoDoProcesso[]>;
}

const colunasPed: ColunaTabela<PedDoProcesso>[] = [
  { id: "numero", cabecalho: "PED", celula: (p) => <span className="whitespace-nowrap">{p.numero}</span>, ordenarPor: (p) => p.numero, mobile: "titulo" },
  { id: "autorizacao", cabecalho: "Autorizado em", celula: (p) => (p.data_autorizacao ? formatDateBR(p.data_autorizacao) : "—"), ordenarPor: (p) => p.data_autorizacao },
  {
    id: "situacao",
    cabecalho: "Situação",
    celula: (p) => (
      <StatusBadge tom={p.situacao === SITUACAO_AUTORIZADO ? "pendente" : /empenhad/i.test(p.situacao) ? "sucesso" : "neutro"} icone={false}>
        {p.situacao.replace(/^Pedido \(PED\) /, "")}
      </StatusBadge>
    ),
  },
  { id: "empenho", cabecalho: "Empenho", celula: (p) => p.empenho_numero ?? "—" },
  { id: "natureza", cabecalho: "Natureza", celula: (p) => p.natureza ?? "—" },
  { id: "fonte", cabecalho: "Fonte", celula: (p) => p.fonte ?? "—" },
  { id: "valor", cabecalho: "Valor", celula: (p) => formatCurrency(p.valor), ordenarPor: (p) => p.valor, alinhamento: "direita" },
];

export function ProcessoFinanceiroTab({ financeiro, carregandoFinanceiro, peds, empenhos }: Props) {
  const fase = faseFinanceira(financeiro);
  const v = (n: number | undefined) => formatCurrency(n ?? 0);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">Fase financeira:</span>
        <StatusBadge tom={fase.tom} icone={false}>{fase.rotulo}</StatusBadge>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard rotulo="Reservado" valor={v(financeiro?.reservado)} detalhe={`pendente ${v(financeiro?.pendente)}`} carregando={carregandoFinanceiro} />
        <KpiCard rotulo="PED autorizado" valor={v(financeiro?.ped_autorizado)} detalhe="aguardando empenho" carregando={carregandoFinanceiro} />
        <KpiCard rotulo="Empenhado" valor={v(financeiro?.empenhado)} carregando={carregandoFinanceiro} />
        <KpiCard rotulo="Liquidado" valor={v(financeiro?.liquidado)} carregando={carregandoFinanceiro} />
        <KpiCard rotulo="Pago" valor={v(financeiro?.pago)} carregando={carregandoFinanceiro} />
      </div>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">Pedidos de empenho (PED)</h2>
        <DataTable
          rotulo="PEDs do processo"
          dados={peds.data ?? []}
          colunas={colunasPed}
          chaveLinha={(p) => p.ped_id}
          carregando={peds.isLoading}
          erro={peds.isError ? "Não foi possível carregar os PEDs." : null}
          aoTentarNovamente={() => peds.refetch()}
          vazio={{
            icone: FileClock,
            titulo: "Nenhum PED com este processo",
            descricao: "Os PEDs aparecem aqui quando o Financeiro importa o relatório \"Consultar PED\" do FIPLAN.",
          }}
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">Empenhos (FIP 614)</h2>
        <ProcessoEmpenhosTab
          empenhos={empenhos.data}
          carregando={empenhos.isLoading}
          erro={empenhos.isError}
          aoTentarNovamente={() => empenhos.refetch()}
        />
      </section>
    </div>
  );
}
