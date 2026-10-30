import { ModuleLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import {
  DataTable,
  PageHeader,
  StatusBadge,
  dataISO,
  useEstadoFiltros,
  type ColunaTabela,
  type FiltroDef,
  type TomStatus,
} from "@/components/design-system";
import { Wallet, AlertTriangle } from "lucide-react";
import { formatCurrency, formatDateBR } from "@/lib/formatters";
import { useAdiantamentos } from "@/hooks/useFinanceiro";
import { useExercicioFinanceiro } from "@/hooks/useExercicioFinanceiro";
import { SeletorExercicio } from "@/components/financeiro/SeletorExercicio";
import { STATUS_ADIANTAMENTO_LABELS, type Adiantamento, type StatusAdiantamento } from "@/types/financeiro";

const TOM_STATUS_ADIANTAMENTO: Record<StatusAdiantamento, TomStatus> = {
  solicitado: "pendente",
  autorizado: "andamento",
  liberado: "andamento",
  em_uso: "andamento",
  prestacao_pendente: "pendente",
  prestado: "sucesso",
  aprovado: "sucesso",
  rejeitado: "erro",
  bloqueado: "erro",
};

function StatusAdiantamentoBadge({ status }: { status: string }) {
  const label = STATUS_ADIANTAMENTO_LABELS[status as StatusAdiantamento];
  if (!label) return <StatusBadge tom="neutro">{status || "Sem status"}</StatusBadge>;
  return <StatusBadge tom={TOM_STATUS_ADIANTAMENTO[status as StatusAdiantamento]}>{label}</StatusBadge>;
}

const PRESTACAO_ENCERRADA: StatusAdiantamento[] = ["prestado", "aprovado", "rejeitado"];

const filtrosAdiantamento: FiltroDef<Adiantamento>[] = [
  {
    tipo: "lista",
    id: "status",
    rotulo: "Situação",
    principal: true,
    valor: (adi) => adi.status,
    opcoes: Object.entries(STATUS_ADIANTAMENTO_LABELS).map(([valor, rotulo]) => ({ valor, rotulo })),
  },
  { tipo: "periodo", id: "periodo", rotulo: "Data da solicitação", principal: true, valor: (adi) => adi.data_solicitacao },
  {
    tipo: "booleano",
    id: "prazo_vencido",
    rotulo: "Prestação de contas vencida",
    principal: true,
    valor: (adi) =>
      Boolean(adi.prazo_prestacao_contas) &&
      adi.prazo_prestacao_contas!.slice(0, 10) < dataISO(new Date()) &&
      !PRESTACAO_ENCERRADA.includes(adi.status),
  },
  { tipo: "lista", id: "suprido", rotulo: "Servidor suprido", valor: (adi) => adi.servidor_suprido?.nome_completo },
  { tipo: "periodo", id: "prazo", rotulo: "Prazo de comprovação", valor: (adi) => adi.prazo_prestacao_contas },
  {
    tipo: "faixa",
    id: "valor",
    rotulo: "Valor",
    formato: "moeda",
    valor: (adi) => Number(adi.valor_aprovado || adi.valor_solicitado),
  },
];

const colunas: ColunaTabela<Adiantamento>[] = [
  {
    id: "numero",
    cabecalho: "Número",
    celula: (adi) => <span className="font-medium">{adi.numero}</span>,
    ordenarPor: (adi) => adi.numero,
    buscarPor: (adi) => adi.numero,
    mobile: "titulo",
  },
  {
    id: "finalidade",
    cabecalho: "Finalidade",
    celula: (adi) => adi.finalidade,
    ordenarPor: (adi) => adi.finalidade,
    buscarPor: (adi) => adi.finalidade,
  },
  {
    id: "valor",
    cabecalho: "Valor",
    celula: (adi) => (
      <span className="font-mono tabular-nums">{formatCurrency(adi.valor_aprovado || adi.valor_solicitado)}</span>
    ),
    ordenarPor: (adi) => Number(adi.valor_aprovado || adi.valor_solicitado),
    alinhamento: "direita",
  },
  {
    id: "prazo",
    cabecalho: "Prazo de comprovação",
    celula: (adi) => formatDateBR(adi.prazo_prestacao_contas),
    ordenarPor: (adi) => adi.prazo_prestacao_contas,
  },
  {
    id: "status",
    cabecalho: "Situação",
    celula: (adi) => <StatusAdiantamentoBadge status={adi.status} />,
    ordenarPor: (adi) => STATUS_ADIANTAMENTO_LABELS[adi.status] ?? adi.status,
  },
];

export default function AdiantamentosPage() {
  const { exercicio, comExercicio } = useExercicioFinanceiro();
  
  const { data: adiantamentos, isLoading, isError, refetch } = useAdiantamentos({ exercicio });

  const filtros = useEstadoFiltros("financeiro.adiantamentos", filtrosAdiantamento);

  const adiantamentosVencendo = adiantamentos?.filter(
    (adi) => adi.status === "liberado" && adi.prazo_prestacao_contas
  );

  return (
    <ModuleLayout module="financeiro">
    <div className="space-y-6">
      <PageHeader
        migalhas={[{ rotulo: "Financeiro", href: comExercicio("/financeiro") }, { rotulo: "Adiantamentos" }]}
        titulo="Adiantamentos"
        descricao={`Suprimento de fundos e prestação de contas · exercício ${exercicio}`}
        acoes={<SeletorExercicio />}
      />

      {adiantamentosVencendo && adiantamentosVencendo.length > 0 && (
        <Card className="border-warning/50 bg-warning/5" role="note">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-warning" aria-hidden="true" />
              <p className="text-foreground">
                <strong>{adiantamentosVencendo.length}</strong> adiantamento(s) 
                aguardando prestação de contas
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <DataTable
        rotulo="Adiantamentos registrados"
        dados={adiantamentos ?? []}
        colunas={colunas}
        chaveLinha={(adi) => adi.id}
        carregando={isLoading}
        erro={isError ? "Não foi possível carregar os adiantamentos." : null}
        aoTentarNovamente={() => refetch()}
        busca={{ placeholder: "Buscar por número ou finalidade…" }}
        filtrosDinamicos={filtros}
        vazio={{
          icone: Wallet,
          titulo: "Nenhum adiantamento encontrado",
          descricao: "Ajuste o filtro ou escolha outro exercício.",
        }}
      />
    </div>
    </ModuleLayout>
  );
}
