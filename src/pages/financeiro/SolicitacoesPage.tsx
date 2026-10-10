/**
 * Página de Listagem de Solicitações de Despesa
 */

import { useState } from "react";
import { ModuleLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, PageHeader, StatusBadge, type ColunaTabela, type TomStatus } from "@/components/design-system";
import { Plus, Eye, FileText } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useSolicitacoes } from "@/hooks/useFinanceiro";
import { formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { SolicitacaoDespesa, StatusWorkflowFinanceiro } from "@/types/financeiro";

/** Situação da solicitação → rótulo e tom do selo. */
const SITUACAO_SOLICITACAO: Record<StatusWorkflowFinanceiro, { label: string; tom: TomStatus }> = {
  rascunho: { label: "Rascunho", tom: "neutro" },
  pendente_analise: { label: "Pendente de análise", tom: "pendente" },
  em_analise: { label: "Em análise", tom: "andamento" },
  aprovado: { label: "Aprovado", tom: "sucesso" },
  rejeitado: { label: "Rejeitado", tom: "erro" },
  cancelado: { label: "Cancelado", tom: "neutro" },
  executado: { label: "Executado", tom: "sucesso" },
  estornado: { label: "Estornado", tom: "erro" },
};

/** Prioridade → rótulo e tom do selo. */
const PRIORIDADE_SOLICITACAO: Record<string, { label: string; tom: TomStatus }> = {
  baixa: { label: "Baixa", tom: "neutro" },
  normal: { label: "Normal", tom: "neutro" },
  alta: { label: "Alta", tom: "pendente" },
  urgente: { label: "Urgente", tom: "destaque" },
};

const colunas: ColunaTabela<SolicitacaoDespesa>[] = [
  {
    id: "numero",
    cabecalho: "Número",
    celula: (sol) => <span className="font-mono font-medium">{sol.numero}</span>,
    ordenarPor: (sol) => sol.numero,
    buscarPor: (sol) => sol.numero,
  },
  {
    id: "data",
    cabecalho: "Data",
    celula: (sol) => format(new Date(sol.data_solicitacao), "dd/MM/yyyy", { locale: ptBR }),
    ordenarPor: (sol) => new Date(sol.data_solicitacao),
  },
  {
    id: "unidade",
    cabecalho: "Unidade",
    celula: (sol) => sol.unidade_solicitante?.sigla || sol.unidade_solicitante?.nome || "-",
    ordenarPor: (sol) => sol.unidade_solicitante?.sigla || sol.unidade_solicitante?.nome,
    buscarPor: (sol) => `${sol.unidade_solicitante?.sigla ?? ""} ${sol.unidade_solicitante?.nome ?? ""}`,
  },
  {
    id: "objeto",
    cabecalho: "Objeto",
    celula: (sol) => (
      <span className="block max-w-[200px] truncate" title={sol.objeto}>
        {sol.objeto}
      </span>
    ),
    ordenarPor: (sol) => sol.objeto,
    buscarPor: (sol) => `${sol.objeto ?? ""} ${sol.fornecedor?.razao_social ?? ""}`,
    mobile: "titulo",
  },
  {
    id: "valor",
    cabecalho: "Valor",
    celula: (sol) => <span className="font-medium tabular-nums">{formatCurrency(sol.valor_estimado)}</span>,
    ordenarPor: (sol) => Number(sol.valor_estimado),
    alinhamento: "direita",
  },
  {
    id: "prioridade",
    cabecalho: "Prioridade",
    celula: (sol) => {
      const p = PRIORIDADE_SOLICITACAO[sol.prioridade];
      return p ? <StatusBadge tom={p.tom}>{p.label}</StatusBadge> : <StatusBadge tom="neutro">{sol.prioridade || "-"}</StatusBadge>;
    },
    ordenarPor: (sol) => ["baixa", "normal", "alta", "urgente"].indexOf(sol.prioridade),
  },
  {
    id: "situacao",
    cabecalho: "Situação",
    celula: (sol) => {
      const s = SITUACAO_SOLICITACAO[sol.status];
      return s ? <StatusBadge tom={s.tom}>{s.label}</StatusBadge> : <StatusBadge tom="neutro">{sol.status}</StatusBadge>;
    },
    ordenarPor: (sol) => SITUACAO_SOLICITACAO[sol.status]?.label ?? sol.status,
  },
];

export default function SolicitacoesPage() {
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get("status") || "";

  const [filtroStatus, setFiltroStatus] = useState(statusParam);

  const { data: solicitacoes, isLoading, isError, refetch } = useSolicitacoes({
    status: filtroStatus && filtroStatus !== "todos" ? filtroStatus : undefined
  });

  return (
    <ModuleLayout module="financeiro">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Financeiro", href: "/financeiro" }, { rotulo: "Solicitações de despesa" }]}
          titulo="Solicitações de despesa"
          descricao="Gerencie as solicitações de despesa da instituição"
          acoes={
            <Button asChild>
              <Link to="/financeiro/solicitacoes?acao=nova">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Nova solicitação
              </Link>
            </Button>
          }
        />

        <DataTable
          rotulo="Solicitações de despesa"
          dados={solicitacoes ?? []}
          colunas={colunas}
          chaveLinha={(sol) => sol.id}
          carregando={isLoading}
          erro={isError ? "Verifique sua conexão e tente novamente." : null}
          aoTentarNovamente={() => refetch()}
          busca={{ placeholder: "Buscar por número, objeto, unidade..." }}
          filtros={
            <Select value={filtroStatus || "todos"} onValueChange={(v) => setFiltroStatus(v === "todos" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-[200px]" aria-label="Filtrar por situação">
                <SelectValue placeholder="Todas as situações" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as situações</SelectItem>
                <SelectItem value="rascunho">Rascunho</SelectItem>
                <SelectItem value="pendente_analise">Pendente de análise</SelectItem>
                <SelectItem value="em_analise">Em análise</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="rejeitado">Rejeitado</SelectItem>
                <SelectItem value="executado">Executado</SelectItem>
              </SelectContent>
            </Select>
          }
          vazio={{
            icone: FileText,
            titulo: "Nenhuma solicitação encontrada",
            descricao: "Não há solicitações de despesa para os filtros selecionados.",
          }}
          acoesLinha={(sol) => (
            <Button variant="ghost" size="icon" asChild>
              <Link to={`/financeiro/solicitacoes/${sol.id}`} aria-label={`Ver solicitação ${sol.numero}`}>
                <Eye className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          )}
        />
      </div>
    </ModuleLayout>
  );
}
