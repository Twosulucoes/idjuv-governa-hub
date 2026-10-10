/**
 * Página de Listagem de Pagamentos
 */

import { useState } from "react";
import PagamentoFormDialog from "@/components/financeiro/PagamentoFormDialog";
import { ModuleLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, KpiCard, PageHeader, StatusBadge, type ColunaTabela, type TomStatus } from "@/components/design-system";
import { Plus, Eye, CreditCard, CalendarClock, CheckCircle2, ListOrdered } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { usePagamentos } from "@/hooks/useFinanceiro";
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
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get("status") || "";
  
  const [filtroStatus, setFiltroStatus] = useState(statusParam);
  const [formOpen, setFormOpen] = useState(false);
  
  const { data: pagamentos, isLoading, isError, refetch } = usePagamentos({ 
    status: filtroStatus && filtroStatus !== "todos" ? filtroStatus : undefined 
  });

  // Calcular totais
  const totalProgramado = pagamentos?.filter(p => p.status === 'programado')
    .reduce((acc, p) => acc + Number(p.valor_bruto), 0) || 0;
  const totalPago = pagamentos?.filter(p => p.status === 'pago')
    .reduce((acc, p) => acc + Number(p.valor_bruto), 0) || 0;

  return (
    <ModuleLayout module="financeiro">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Financeiro", href: "/financeiro" }, { rotulo: "Pagamentos" }]}
          titulo="Pagamentos"
          descricao="Gestão de ordens de pagamento"
          acoes={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Novo pagamento
            </Button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KpiCard rotulo="Programados" valor={formatCurrency(totalProgramado)} icone={CalendarClock} carregando={isLoading} />
          <KpiCard rotulo="Pagos no período" valor={formatCurrency(totalPago)} icone={CheckCircle2} carregando={isLoading} />
          <KpiCard rotulo="Total de registros" valor={pagamentos?.length || 0} icone={ListOrdered} carregando={isLoading} />
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
          filtros={
            <Select value={filtroStatus || "todos"} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-full sm:w-[200px]" aria-label="Filtrar por situação">
                <SelectValue placeholder="Todas as situações" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as situações</SelectItem>
                <SelectItem value="programado">Programado</SelectItem>
                <SelectItem value="autorizado">Autorizado</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="devolvido">Devolvido</SelectItem>
                <SelectItem value="estornado">Estornado</SelectItem>
              </SelectContent>
            </Select>
          }
          vazio={{
            icone: CreditCard,
            titulo: "Nenhum pagamento encontrado",
            descricao: "Ajuste o filtro ou registre um pagamento.",
          }}
          acoesLinha={(pag) => (
            <Button variant="ghost" size="icon" asChild>
              <Link to={`/financeiro/pagamentos/${pag.id}`} aria-label={`Ver pagamento ${pag.numero}`}>
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
