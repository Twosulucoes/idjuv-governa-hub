/**
 * Página de Listagem de Empenhos
 */

import { useState } from "react";
import EmpenhoFormDialog from "@/components/financeiro/EmpenhoFormDialog";
import { ModuleLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DataTable,
  PageHeader,
  StatusBadge,
  useEstadoFiltros,
  type ColunaTabela,
  type FiltroDef,
  type TomStatus,
} from "@/components/design-system";
import { Plus, Eye, Receipt } from "lucide-react";
import { Link } from "react-router-dom";
import { useEmpenhos } from "@/hooks/useFinanceiro";
import { useExercicioFinanceiro } from "@/hooks/useExercicioFinanceiro";
import { SeletorExercicio } from "@/components/financeiro/SeletorExercicio";
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

const credorDoEmpenho = (emp: Empenho) => emp.fornecedor?.razao_social || emp.credor_nome || null;

// Filtros da tela; "status" mantém o nome do parâmetro dos atalhos do painel (?status=emitido).
const filtrosEmpenho: FiltroDef<Empenho>[] = [
  {
    tipo: "lista",
    id: "status",
    rotulo: "Situação",
    principal: true,
    valor: (emp) => emp.status,
    opcoes: Object.entries(SITUACAO_EMPENHO).map(([valor, s]) => ({ valor, rotulo: s.label })),
  },
  { tipo: "periodo", id: "periodo", rotulo: "Data do empenho", principal: true, valor: (emp) => emp.data_empenho },
  { tipo: "lista", id: "credor", rotulo: "Credor", principal: true, valor: credorDoEmpenho },
  {
    tipo: "lista",
    id: "natureza",
    rotulo: "Natureza",
    valor: (emp) => (emp.natureza_despesa ? `${emp.natureza_despesa.codigo} - ${emp.natureza_despesa.nome}` : null),
  },
  {
    tipo: "lista",
    id: "fonte",
    rotulo: "Fonte",
    valor: (emp) => (emp.fonte_recurso ? `${emp.fonte_recurso.codigo} - ${emp.fonte_recurso.nome}` : null),
  },
  {
    tipo: "lista",
    id: "tipo",
    rotulo: "Tipo",
    valor: (emp) => emp.tipo,
    opcoes: Object.entries(TIPO_EMPENHO_LABELS).map(([valor, rotulo]) => ({ valor, rotulo })),
  },
  {
    tipo: "lista",
    id: "origem",
    rotulo: "Origem",
    valor: (emp) => emp.origem,
    opcoes: [
      { valor: "fiplan", rotulo: "FIPLAN" },
      { valor: "sistema", rotulo: "Contingência (sistema)" },
    ],
  },
  { tipo: "faixa", id: "valor", rotulo: "Valor empenhado", formato: "moeda", valor: (emp) => Number(emp.valor_empenhado) },
  { tipo: "booleano", id: "com_saldo", rotulo: "Com saldo a liquidar", valor: (emp) => Number(emp.saldo_liquidar) > 0 },
];

const colunas: ColunaTabela<Empenho>[] = [
  {
    id: "numero",
    cabecalho: "Número",
    celula: (emp) => (
      <span className="inline-flex items-center gap-2">
        <span className="font-mono font-medium">{emp.numero}</span>
        {emp.origem === "fiplan" && <Badge variant="outline">FIPLAN</Badge>}
      </span>
    ),
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
    // Empenho do FIPLAN sem favorecido ligado mostra o credor como veio no relatório
    celula: (emp) => emp.fornecedor?.razao_social || emp.credor_nome || "-",
    ordenarPor: (emp) => emp.fornecedor?.razao_social ?? emp.credor_nome,
    buscarPor: (emp) => emp.fornecedor?.razao_social ?? emp.credor_nome,
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
  const [formOpen, setFormOpen] = useState(false);
  const { exercicio, comExercicio } = useExercicioFinanceiro();
  const filtros = useEstadoFiltros("financeiro.empenhos", filtrosEmpenho);

  const { data: empenhos, isLoading, isError, refetch } = useEmpenhos({ exercicio });

  return (
    <ModuleLayout module="financeiro">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Financeiro", href: comExercicio("/financeiro") }, { rotulo: "Empenhos" }]}
          titulo="Empenhos"
          descricao={`Gestão de notas de empenho · exercício ${exercicio}`}
          acoes={
            <>
              <SeletorExercicio />
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Empenho de contingência
              </Button>
            </>
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
          filtrosDinamicos={filtros}
          vazio={{
            icone: Receipt,
            titulo: "Nenhum empenho encontrado",
            descricao: "Não há empenhos para os filtros selecionados.",
          }}
          acoesLinha={(emp) => (
            <Button variant="ghost" size="icon" asChild>
              <Link to={comExercicio(`/financeiro/empenhos/${emp.id}`)} aria-label={`Ver empenho ${emp.numero}`}>
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
