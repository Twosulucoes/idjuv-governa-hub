/**
 * Página de Listagem de Empenhos
 */

import { useState } from "react";
import EmpenhoFormDialog from "@/components/financeiro/EmpenhoFormDialog";
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
import { DataTable, PageHeader, StatusBadge, type ColunaTabela, type TomStatus } from "@/components/design-system";
import { Plus, Eye, Receipt } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useEmpenhos } from "@/hooks/useFinanceiro";
import { formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TIPO_EMPENHO_LABELS, type Empenho, type StatusEmpenho } from "@/types/financeiro";

/** Situação do empenho → rótulo e tom do selo. */
const SITUACAO_EMPENHO: Record<StatusEmpenho, { label: string; tom: TomStatus }> = {
  emitido: { label: "Emitido", tom: "andamento" },
  parcialmente_liquidado: { label: "Parcialmente liquidado", tom: "pendente" },
  liquidado: { label: "Liquidado", tom: "andamento" },
  parcialmente_pago: { label: "Parcialmente pago", tom: "pendente" },
  pago: { label: "Pago", tom: "sucesso" },
  anulado: { label: "Anulado", tom: "erro" },
};

const colunas: ColunaTabela<Empenho>[] = [
  {
    id: "numero",
    cabecalho: "Número",
    celula: (emp) => <span className="font-mono font-medium">{emp.numero}</span>,
    ordenarPor: (emp) => emp.numero,
    buscarPor: (emp) => emp.numero,
  },
  {
    id: "data",
    cabecalho: "Data",
    celula: (emp) => format(new Date(emp.data_empenho), "dd/MM/yyyy", { locale: ptBR }),
    ordenarPor: (emp) => new Date(emp.data_empenho),
  },
  {
    id: "fornecedor",
    cabecalho: "Fornecedor",
    celula: (emp) => emp.fornecedor?.razao_social || "-",
    ordenarPor: (emp) => emp.fornecedor?.razao_social,
    buscarPor: (emp) => emp.fornecedor?.razao_social,
  },
  {
    id: "objeto",
    cabecalho: "Objeto",
    celula: (emp) => (
      <span className="block max-w-[200px] truncate" title={emp.objeto}>
        {emp.objeto}
      </span>
    ),
    ordenarPor: (emp) => emp.objeto,
    buscarPor: (emp) => emp.objeto,
    mobile: "titulo",
  },
  {
    id: "tipo",
    cabecalho: "Tipo",
    celula: (emp) => (
      <Badge variant="outline">
        {TIPO_EMPENHO_LABELS[emp.tipo as keyof typeof TIPO_EMPENHO_LABELS] || emp.tipo}
      </Badge>
    ),
    ordenarPor: (emp) => emp.tipo,
  },
  {
    id: "empenhado",
    cabecalho: "Empenhado",
    celula: (emp) => <span className="font-medium tabular-nums">{formatCurrency(emp.valor_empenhado)}</span>,
    ordenarPor: (emp) => Number(emp.valor_empenhado),
    alinhamento: "direita",
  },
  {
    id: "saldo",
    cabecalho: "Saldo",
    celula: (emp) => (
      <span className={`tabular-nums ${Number(emp.saldo_liquidar) > 0 ? "text-warning" : "text-success"}`}>
        {formatCurrency(Number(emp.saldo_liquidar))}
      </span>
    ),
    ordenarPor: (emp) => Number(emp.saldo_liquidar),
    alinhamento: "direita",
  },
  {
    id: "situacao",
    cabecalho: "Situação",
    celula: (emp) => {
      const s = SITUACAO_EMPENHO[emp.status];
      return s ? <StatusBadge tom={s.tom}>{s.label}</StatusBadge> : <StatusBadge tom="neutro">{emp.status}</StatusBadge>;
    },
    ordenarPor: (emp) => SITUACAO_EMPENHO[emp.status]?.label ?? emp.status,
  },
];

export default function EmpenhosPage() {
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get("status") || "";

  const [filtroStatus, setFiltroStatus] = useState(statusParam);
  const [formOpen, setFormOpen] = useState(false);

  const { data: empenhos, isLoading, isError, refetch } = useEmpenhos({
    status: filtroStatus && filtroStatus !== "todos" ? filtroStatus : undefined
  });

  return (
    <ModuleLayout module="financeiro">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Financeiro", href: "/financeiro" }, { rotulo: "Empenhos" }]}
          titulo="Empenhos"
          descricao="Gestão de notas de empenho"
          acoes={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Novo empenho
            </Button>
          }
        />

        <DataTable
          rotulo="Empenhos"
          dados={empenhos ?? []}
          colunas={colunas}
          chaveLinha={(emp) => emp.id}
          carregando={isLoading}
          erro={isError ? "Verifique sua conexão e tente novamente." : null}
          aoTentarNovamente={() => refetch()}
          busca={{ placeholder: "Buscar por número, objeto, fornecedor..." }}
          filtros={
            <Select value={filtroStatus || "todos"} onValueChange={(v) => setFiltroStatus(v === "todos" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-[200px]" aria-label="Filtrar por situação">
                <SelectValue placeholder="Todas as situações" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as situações</SelectItem>
                <SelectItem value="emitido">Emitido</SelectItem>
                <SelectItem value="parcialmente_liquidado">Parc. liquidado</SelectItem>
                <SelectItem value="liquidado">Liquidado</SelectItem>
                <SelectItem value="parcialmente_pago">Parc. pago</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="anulado">Anulado</SelectItem>
              </SelectContent>
            </Select>
          }
          vazio={{
            icone: Receipt,
            titulo: "Nenhum empenho encontrado",
            descricao: "Não há empenhos para os filtros selecionados.",
          }}
          acoesLinha={(emp) => (
            <Button variant="ghost" size="icon" asChild>
              <Link to={`/financeiro/empenhos/${emp.id}`} aria-label={`Ver empenho ${emp.numero}`}>
                <Eye className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          )}
        />
        <EmpenhoFormDialog open={formOpen} onOpenChange={setFormOpen} />
      </div>
    </ModuleLayout>
  );
}
