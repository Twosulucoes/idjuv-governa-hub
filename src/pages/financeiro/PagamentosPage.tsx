/**
 * Página de Listagem de Pagamentos
 */

import { useMemo, useState } from "react";
import PagamentoFormDialog from "@/components/financeiro/PagamentoFormDialog";
import { ModuleLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DataTable,
  KpiCard,
  PageHeader,
  StatusBadge,
  aplicarFiltros,
  useEstadoFiltros,
  type ColunaTabela,
  type FiltroDef,
  type TomStatus,
} from "@/components/design-system";
import { Plus, Eye, CreditCard, CalendarClock, CheckCircle2, ListOrdered } from "lucide-react";
import { Link } from "react-router-dom";
import { usePagamentos } from "@/hooks/useFinanceiro";
import { useExercicioFinanceiro } from "@/hooks/useExercicioFinanceiro";
import { SeletorExercicio } from "@/components/financeiro/SeletorExercicio";
import { formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { STATUS_PAGAMENTO_LABELS, type Pagamento, type StatusPagamento } from "@/types/financeiro";

const TOM_STATUS_PAGAMENTO: Record<StatusPagamento, TomStatus> = {
  programado: "pendente",
  autorizado: "andamento",
  pago: "sucesso",
  devolvido: "erro",
  estornado: "erro",
  cancelado: "neutro",
};

function StatusPagamentoBadge({ status }: { status: string }) {
  const label = STATUS_PAGAMENTO_LABELS[status as StatusPagamento];
  if (!label) return <StatusBadge tom="neutro">{status || "Sem status"}</StatusBadge>;
  return <StatusBadge tom={TOM_STATUS_PAGAMENTO[status as StatusPagamento]}>{label}</StatusBadge>;
}

// "status" mantém o nome do parâmetro dos atalhos do painel (?status=pago).
const filtrosPagamento: FiltroDef<Pagamento>[] = [
  {
    tipo: "lista",
    id: "status",
    rotulo: "Situação",
    principal: true,
    valor: (pag) => pag.status,
    opcoes: Object.entries(STATUS_PAGAMENTO_LABELS).map(([valor, rotulo]) => ({ valor, rotulo })),
  },
  { tipo: "periodo", id: "periodo", rotulo: "Data do pagamento", principal: true, valor: (pag) => pag.data_pagamento },
  { tipo: "lista", id: "favorecido", rotulo: "Favorecido", principal: true, valor: (pag) => pag.fornecedor?.razao_social },
  {
    tipo: "lista",
    id: "conta",
    rotulo: "Conta bancária",
    valor: (pag) => pag.conta_bancaria?.nome_conta ?? null,
  },
  { tipo: "lista", id: "forma", rotulo: "Forma de pagamento", valor: (pag) => pag.forma_pagamento?.toUpperCase() },
  { tipo: "faixa", id: "valor", rotulo: "Valor bruto", formato: "moeda", valor: (pag) => Number(pag.valor_bruto) },
  { tipo: "booleano", id: "estornado", rotulo: "Só estornados", valor: (pag) => pag.estornado },
];

const colunas: ColunaTabela<Pagamento>[] = [
  {
    id: "numero",
    cabecalho: "Número",
    celula: (pag) => <span className="font-mono font-medium">{pag.numero}</span>,
    ordenarPor: (pag) => pag.numero,
    buscarPor: (pag) => pag.numero,
    mobile: "titulo",
  },
  {
    id: "data",
    cabecalho: "Data",
    celula: (pag) => (
      <span className="whitespace-nowrap">
        {format(new Date(pag.data_pagamento), "dd/MM/yyyy", { locale: ptBR })}
      </span>
    ),
    ordenarPor: (pag) => pag.data_pagamento,
  },
  {
    id: "empenho",
    cabecalho: "Empenho",
    celula: (pag) => <span className="font-mono">{pag.empenho?.numero || "-"}</span>,
    ordenarPor: (pag) => pag.empenho?.numero,
    buscarPor: (pag) => pag.empenho?.numero,
  },
  {
    id: "favorecido",
    cabecalho: "Favorecido",
    celula: (pag) => pag.fornecedor?.razao_social || "-",
    ordenarPor: (pag) => pag.fornecedor?.razao_social,
    buscarPor: (pag) => pag.fornecedor?.razao_social,
  },
  {
    id: "forma",
    cabecalho: "Forma",
    celula: (pag) => (
      <Badge variant="outline" className="uppercase text-caption">
        {pag.forma_pagamento}
      </Badge>
    ),
    ordenarPor: (pag) => pag.forma_pagamento,
  },
  {
    id: "valor_bruto",
    cabecalho: "Valor bruto",
    celula: (pag) => <span className="font-medium tabular-nums">{formatCurrency(Number(pag.valor_bruto))}</span>,
    ordenarPor: (pag) => Number(pag.valor_bruto),
    alinhamento: "direita",
  },
  {
    id: "valor_liquido",
    cabecalho: "Valor líquido",
    celula: (pag) => <span className="font-medium tabular-nums">{formatCurrency(Number(pag.valor_liquido))}</span>,
    ordenarPor: (pag) => Number(pag.valor_liquido),
    alinhamento: "direita",
  },
  {
    id: "status",
    cabecalho: "Situação",
    celula: (pag) => <StatusPagamentoBadge status={pag.status} />,
    ordenarPor: (pag) => STATUS_PAGAMENTO_LABELS[pag.status] ?? pag.status,
  },
];

export default function PagamentosPage() {
  const [formOpen, setFormOpen] = useState(false);
  const { exercicio, comExercicio } = useExercicioFinanceiro();
  const filtros = useEstadoFiltros("financeiro.pagamentos", filtrosPagamento);

  const { data: pagamentos, isLoading, isError, refetch } = usePagamentos({ exercicio });

  // Totais acompanham os filtros escolhidos
  const filtrados = useMemo(
    () => aplicarFiltros(pagamentos ?? [], filtros.definicoes, filtros.estado),
    [pagamentos, filtros.definicoes, filtros.estado],
  );
  const totalProgramado = filtrados.filter(p => p.status === 'programado')
    .reduce((acc, p) => acc + Number(p.valor_bruto), 0);
  const totalPago = filtrados.filter(p => p.status === 'pago')
    .reduce((acc, p) => acc + Number(p.valor_bruto), 0);

  return (
    <ModuleLayout module="financeiro">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Financeiro", href: comExercicio("/financeiro") }, { rotulo: "Pagamentos" }]}
          titulo="Pagamentos"
          descricao={`Gestão de ordens de pagamento · exercício ${exercicio}`}
          acoes={
            <>
              <SeletorExercicio />
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Novo pagamento
              </Button>
            </>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard rotulo="Programados" valor={formatCurrency(totalProgramado)} icone={CalendarClock} carregando={isLoading} />
          <KpiCard rotulo="Pagos no período" valor={formatCurrency(totalPago)} icone={CheckCircle2} carregando={isLoading} />
          <KpiCard rotulo="Total de registros" valor={filtrados.length} icone={ListOrdered} carregando={isLoading} />
        </div>

        <DataTable
          rotulo="Pagamentos"
          dados={pagamentos ?? []}
          colunas={colunas}
          chaveLinha={(pag) => pag.id}
          carregando={isLoading}
          erro={isError ? "Não foi possível carregar os pagamentos." : null}
          aoTentarNovamente={() => refetch()}
          busca={{ placeholder: "Buscar por número, fornecedor, empenho…" }}
          filtrosDinamicos={filtros}
          vazio={{
            icone: CreditCard,
            titulo: "Nenhum pagamento encontrado",
            descricao: "Ajuste o filtro ou registre um pagamento.",
          }}
          acoesLinha={(pag) => (
            <Button variant="ghost" size="icon" asChild>
              <Link to={comExercicio(`/financeiro/pagamentos/${pag.id}`)} aria-label={`Ver pagamento ${pag.numero}`}>
                <Eye className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          )}
        />
        <PagamentoFormDialog open={formOpen} onOpenChange={setFormOpen} />
      </div>
    </ModuleLayout>
  );
}
