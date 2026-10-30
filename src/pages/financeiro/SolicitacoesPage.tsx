/**
 * Página de Listagem de Solicitações de Despesa
 */

import { ModuleLayout } from "@/components/layout";
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
import { Plus, Eye, FileText } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useSolicitacoes } from "@/hooks/useFinanceiro";
import { useExercicioFinanceiro } from "@/hooks/useExercicioFinanceiro";
import { SeletorExercicio } from "@/components/financeiro/SeletorExercicio";
import SolicitacaoFormDialog from "@/components/financeiro/SolicitacaoFormDialog";
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

// "status" mantém o nome do parâmetro dos atalhos do painel (?status=pendente_analise).
const filtrosSolicitacao: FiltroDef<SolicitacaoDespesa>[] = [
  {
    tipo: "lista",
    id: "status",
    rotulo: "Situação",
    principal: true,
    valor: (sol) => sol.status,
    opcoes: Object.entries(SITUACAO_SOLICITACAO).map(([valor, s]) => ({ valor, rotulo: s.label })),
  },
  { tipo: "periodo", id: "periodo", rotulo: "Data da solicitação", principal: true, valor: (sol) => sol.data_solicitacao },
  {
    tipo: "lista",
    id: "unidade",
    rotulo: "Unidade",
    principal: true,
    valor: (sol) => sol.unidade_solicitante?.sigla || sol.unidade_solicitante?.nome,
  },
  {
    tipo: "lista",
    id: "prioridade",
    rotulo: "Prioridade",
    valor: (sol) => sol.prioridade,
    opcoes: Object.entries(PRIORIDADE_SOLICITACAO).map(([valor, p]) => ({ valor, rotulo: p.label })),
  },
  { tipo: "lista", id: "tipo", rotulo: "Tipo de despesa", valor: (sol) => sol.tipo_despesa },
  { tipo: "faixa", id: "valor", rotulo: "Valor estimado", formato: "moeda", valor: (sol) => Number(sol.valor_estimado) },
];

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
  const [searchParams, setSearchParams] = useSearchParams();
  // "?acao=nova" (botão do cabeçalho, atalho do painel) abre o formulário
  const formAberto = searchParams.get("acao") === "nova";
  const { exercicio, comExercicio } = useExercicioFinanceiro();

  const filtros = useEstadoFiltros("financeiro.solicitacoes", filtrosSolicitacao);

  const { data: solicitacoes, isLoading, isError, refetch } = useSolicitacoes({ exercicio });

  const alterarFormulario = (aberto: boolean) => {
    setSearchParams(
      (atual) => {
        const proximo = new URLSearchParams(atual);
        if (aberto) proximo.set("acao", "nova");
        else proximo.delete("acao");
        return proximo;
      },
      { replace: true },
    );
  };

  return (
    <ModuleLayout module="financeiro">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Financeiro", href: comExercicio("/financeiro") }, { rotulo: "Solicitações de despesa" }]}
          titulo="Solicitações de despesa"
          descricao={`Solicitações de despesa da instituição · exercício ${exercicio}`}
          acoes={
            <>
              <SeletorExercicio />
              <Button asChild>
                <Link to={comExercicio("/financeiro/solicitacoes?acao=nova")}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Nova solicitação
                </Link>
              </Button>
            </>
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
          filtrosDinamicos={filtros}
          vazio={{
            icone: FileText,
            titulo: "Nenhuma solicitação encontrada",
            descricao: "Não há solicitações de despesa para os filtros selecionados.",
          }}
          acoesLinha={(sol) => (
            <Button variant="ghost" size="icon" asChild>
              <Link to={comExercicio(`/financeiro/solicitacoes/${sol.id}`)} aria-label={`Ver solicitação ${sol.numero}`}>
                <Eye className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          )}
        />
        <SolicitacaoFormDialog open={formAberto} onOpenChange={alterarFormulario} exercicio={exercicio} />
      </div>
    </ModuleLayout>
  );
}
