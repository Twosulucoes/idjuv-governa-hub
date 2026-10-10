import { useMemo, useState } from "react";
import { ModuleLayout } from "@/components/layout";
import LiquidacaoFormDialog from "@/components/financeiro/LiquidacaoFormDialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, PageHeader, StatusBadge, type ColunaTabela, type TomStatus } from "@/components/design-system";
import { Plus, FileCheck, Eye, Paperclip } from "lucide-react";
import { formatCurrency, formatDateBR } from "@/lib/formatters";
import { useLiquidacoes } from "@/hooks/useFinanceiro";
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
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [formOpen, setFormOpen] = useState(false);

  const { data: liquidacoes, isLoading, isError, refetch } = useLiquidacoes();

  const filteredLiquidacoes = useMemo(
    () => (liquidacoes ?? []).filter((liq) => statusFilter === "todos" || liq.status === statusFilter),
    [liquidacoes, statusFilter],
  );

  return (
    <ModuleLayout module="financeiro">
    <div className="space-y-6">
      <PageHeader
        migalhas={[{ rotulo: "Financeiro", href: "/financeiro" }, { rotulo: "Liquidações" }]}
        titulo="Liquidações"
        descricao="Gestão de liquidações e atesto de despesas"
        acoes={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nova liquidação
          </Button>
        }
      />

      <DataTable
        rotulo="Liquidações registradas"
        dados={filteredLiquidacoes}
        colunas={colunas}
        chaveLinha={(liq) => liq.id}
        carregando={isLoading}
        erro={isError ? "Verifique sua conexão e tente novamente." : null}
        aoTentarNovamente={() => refetch()}
        busca={{ placeholder: "Buscar por número..." }}
        filtros={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48" aria-label="Filtrar por situação">
              <SelectValue placeholder="Situação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as situações</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="em_analise">Em análise</SelectItem>
              <SelectItem value="aprovada">Aprovada</SelectItem>
              <SelectItem value="rejeitada">Rejeitada</SelectItem>
            </SelectContent>
          </Select>
        }
        vazio={{
          icone: FileCheck,
          titulo: "Nenhuma liquidação encontrada",
          descricao: "Não há liquidações para os filtros selecionados.",
        }}
        acoesLinha={(liq) => (
          <Button variant="ghost" size="icon" aria-label={`Ver liquidação ${liq.numero}`}>
            <Eye className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      />
    </div>
    <LiquidacaoFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </ModuleLayout>
  );
}
