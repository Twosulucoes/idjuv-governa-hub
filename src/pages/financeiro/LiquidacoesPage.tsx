import { useState } from "react";
import { ModuleLayout } from "@/components/layout";
import LiquidacaoFormDialog from "@/components/financeiro/LiquidacaoFormDialog";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  PageHeader,
  StatusBadge,
  useEstadoFiltros,
  type ColunaTabela,
  type FiltroDef,
  type TomStatus,
} from "@/components/design-system";
import { Plus, FileCheck, Paperclip } from "lucide-react";
import { formatCurrency, formatDateBR } from "@/lib/formatters";
import { useLiquidacoes } from "@/hooks/useFinanceiro";
import { useExercicioFinanceiro } from "@/hooks/useExercicioFinanceiro";
import { SeletorExercicio } from "@/components/financeiro/SeletorExercicio";
import type { Liquidacao } from "@/types/financeiro";

/** Situação da liquidação → rótulo e tom do selo. */
const SITUACAO_LIQUIDACAO: Record<string, { label: string; tom: TomStatus }> = {
  pendente: { label: "Pendente", tom: "pendente" },
  em_analise: { label: "Em análise", tom: "andamento" },
  atestada: { label: "Atestada", tom: "andamento" },
  aprovada: { label: "Aprovada", tom: "sucesso" },
  rejeitada: { label: "Rejeitada", tom: "erro" },
  cancelada: { label: "Cancelada", tom: "neutro" },
};

const filtrosLiquidacao: FiltroDef<Liquidacao>[] = [
  {
    tipo: "lista",
    id: "status",
    rotulo: "Situação",
    principal: true,
    valor: (liq) => liq.status,
    opcoes: Object.entries(SITUACAO_LIQUIDACAO).map(([valor, s]) => ({ valor, rotulo: s.label })),
  },
  { tipo: "periodo", id: "periodo", rotulo: "Data da liquidação", principal: true, valor: (liq) => liq.data_liquidacao },
  {
    tipo: "lista",
    id: "credor",
    rotulo: "Credor",
    principal: true,
    valor: (liq) => liq.empenho?.fornecedor?.razao_social,
  },
  { tipo: "lista", id: "documento", rotulo: "Tipo de documento", valor: (liq) => liq.tipo_documento?.toUpperCase() },
  { tipo: "faixa", id: "valor", rotulo: "Valor liquidado", formato: "moeda", valor: (liq) => Number(liq.valor_liquidado) },
  { tipo: "booleano", id: "com_retencao", rotulo: "Com retenções", valor: (liq) => Number(liq.valor_retencoes) > 0 },
];

const colunas: ColunaTabela<Liquidacao>[] = [
  {
    id: "numero",
    cabecalho: "Número",
    celula: (liq) => <span className="font-medium">{liq.numero}</span>,
    ordenarPor: (liq) => liq.numero,
    buscarPor: (liq) => liq.numero,
    mobile: "titulo",
  },
  {
    id: "empenho",
    cabecalho: "Empenho",
    celula: (liq) => liq.empenho?.numero ?? "-",
    ordenarPor: (liq) => liq.empenho?.numero,
    buscarPor: (liq) => liq.empenho?.numero,
  },
  {
    id: "atesto",
    cabecalho: "Data do atesto",
    celula: (liq) => formatDateBR(liq.atestado_em),
    ordenarPor: (liq) => (liq.atestado_em ? new Date(liq.atestado_em) : null),
  },
  {
    id: "valor",
    cabecalho: "Valor",
    celula: (liq) => <span className="font-mono tabular-nums">{formatCurrency(liq.valor_liquidado)}</span>,
    ordenarPor: (liq) => Number(liq.valor_liquidado),
    alinhamento: "direita",
  },
  {
    id: "situacao",
    cabecalho: "Situação",
    celula: (liq) => {
      const s = SITUACAO_LIQUIDACAO[liq.status];
      return s ? <StatusBadge tom={s.tom}>{s.label}</StatusBadge> : <StatusBadge tom="neutro">{liq.status}</StatusBadge>;
    },
    ordenarPor: (liq) => SITUACAO_LIQUIDACAO[liq.status]?.label ?? liq.status,
  },
  {
    id: "anexos",
    cabecalho: "Anexos",
    celula: (liq) =>
      liq.historico_status && liq.historico_status.length > 0 ? (
        <>
          <Paperclip className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">Possui anexos</span>
        </>
      ) : null,
    mobile: "oculta",
  },
];

export default function LiquidacoesPage() {
  const [formOpen, setFormOpen] = useState(false);
  const { exercicio, comExercicio } = useExercicioFinanceiro();

  const { data: liquidacoes, isLoading, isError, refetch } = useLiquidacoes({ exercicio });

  const filtros = useEstadoFiltros("financeiro.liquidacoes", filtrosLiquidacao);

  return (
    <ModuleLayout module="financeiro">
    <div className="space-y-6">
      <PageHeader
        migalhas={[{ rotulo: "Financeiro", href: comExercicio("/financeiro") }, { rotulo: "Liquidações" }]}
        titulo="Liquidações"
        descricao={`Gestão de liquidações e atesto de despesas · exercício ${exercicio}`}
        acoes={
          <>
            <SeletorExercicio />
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nova liquidação
            </Button>
          </>
        }
      />

      <DataTable
        rotulo="Liquidações registradas"
        dados={liquidacoes ?? []}
        colunas={colunas}
        chaveLinha={(liq) => liq.id}
        carregando={isLoading}
        erro={isError ? "Verifique sua conexão e tente novamente." : null}
        aoTentarNovamente={() => refetch()}
        busca={{ placeholder: "Buscar por número..." }}
        filtrosDinamicos={filtros}
        vazio={{
          icone: FileCheck,
          titulo: "Nenhuma liquidação encontrada",
          descricao: "Não há liquidações para os filtros selecionados.",
        }}
      />
    </div>
    <LiquidacaoFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </ModuleLayout>
  );
}
