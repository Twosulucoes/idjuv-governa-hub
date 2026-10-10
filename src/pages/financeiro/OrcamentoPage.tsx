import { useState } from "react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, PieChart, TrendingUp, PiggyBank } from "lucide-react";
import {
  DataTable,
  KpiCard,
  PageHeader,
  StatusBadge,
  type ColunaTabela,
  type TomStatus,
} from "@/components/design-system";
import { formatCurrency } from "@/lib/formatters";
import { useDotacoes, useResumoOrcamentario } from "@/hooks/useFinanceiro";
import type { Dotacao } from "@/types/financeiro";
import { cn } from "@/lib/utils";

const percentualDeExecucao = (dot: Dotacao) =>
  dot.valor_atual > 0 ? (dot.valor_empenhado / dot.valor_atual) * 100 : 0;

// Faixas de execução (empenhado / dotação): acima de 90% é crítico, acima de 70% pede atenção
const tomDaExecucao = (execucao: number): TomStatus =>
  execucao > 90 ? "erro" : execucao > 70 ? "pendente" : "neutro";

const colunas: ColunaTabela<Dotacao>[] = [
  {
    id: "codigo",
    cabecalho: "Código",
    celula: (dot) => <span className="font-mono text-body">{dot.codigo_dotacao}</span>,
    ordenarPor: (dot) => dot.codigo_dotacao,
    buscarPor: (dot) => dot.codigo_dotacao,
    mobile: "titulo",
  },
  {
    id: "acao",
    cabecalho: "Ação/Programa",
    celula: (dot) => (
      <div>
        <p className="font-medium">{dot.acao?.nome}</p>
        <p className="text-caption text-muted-foreground">{dot.programa?.nome}</p>
      </div>
    ),
    ordenarPor: (dot) => dot.acao?.nome,
    buscarPor: (dot) => `${dot.acao?.nome ?? ""} ${dot.programa?.nome ?? ""}`,
  },
  {
    id: "natureza",
    cabecalho: "Natureza",
    celula: (dot) => <span className="font-mono text-body">{dot.natureza_despesa?.codigo}</span>,
    ordenarPor: (dot) => dot.natureza_despesa?.codigo,
  },
  {
    id: "fonte",
    cabecalho: "Fonte",
    celula: (dot) => dot.fonte_recurso?.codigo,
    ordenarPor: (dot) => dot.fonte_recurso?.codigo,
  },
  {
    id: "dotacao",
    cabecalho: "Dotação",
    celula: (dot) => <span className="tabular-nums">{formatCurrency(dot.valor_atual)}</span>,
    ordenarPor: (dot) => dot.valor_atual,
    alinhamento: "direita",
  },
  {
    id: "empenhado",
    cabecalho: "Empenhado",
    celula: (dot) => <span className="tabular-nums">{formatCurrency(dot.valor_empenhado)}</span>,
    ordenarPor: (dot) => dot.valor_empenhado,
    alinhamento: "direita",
  },
  {
    id: "saldo",
    cabecalho: "Saldo",
    celula: (dot) => (
      <span className={cn("tabular-nums", dot.saldo_disponivel < 0 ? "text-destructive" : "text-success")}>
        {formatCurrency(dot.saldo_disponivel)}
      </span>
    ),
    ordenarPor: (dot) => dot.saldo_disponivel,
    alinhamento: "direita",
  },
  {
    id: "execucao",
    cabecalho: "Execução",
    celula: (dot) => {
      const execucao = percentualDeExecucao(dot);
      return (
        <StatusBadge tom={tomDaExecucao(execucao)} className="tabular-nums">
          {execucao.toFixed(0)}%
        </StatusBadge>
      );
    },
    ordenarPor: percentualDeExecucao,
    alinhamento: "direita",
  },
];

export default function OrcamentoPage() {
  const [exercicio, setExercicio] = useState(new Date().getFullYear().toString());

  const { data: dotacoes, isLoading, isError, refetch } = useDotacoes(parseInt(exercicio));
  const { data: resumo, isLoading: carregandoResumo } = useResumoOrcamentario(parseInt(exercicio));

  // Usar dados do resumo centralizado em vez de recalcular
  const totalDotacao = resumo?.dotacao_atual || 0;
  const totalEmpenhado = resumo?.empenhado || 0;
  const saldoDisponivel = resumo?.saldo_disponivel || 0;
  const percentualExecutado = resumo?.percentual_executado || 0;

  return (
    <ModuleLayout module="financeiro">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Financeiro", href: "/financeiro" }, { rotulo: "Orçamento" }]}
          titulo="Orçamento"
          descricao="Gestão de dotações e execução orçamentária"
          acoes={
            <>
              <Select value={exercicio} onValueChange={setExercicio}>
                <SelectTrigger className="w-32" aria-label="Exercício">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                </SelectContent>
              </Select>
              <Button>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Nova dotação
              </Button>
            </>
          }
        />

        <section aria-labelledby="orc-indicadores">
          <h2 id="orc-indicadores" className="sr-only">Indicadores do exercício</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard rotulo="Dotação total" valor={formatCurrency(totalDotacao)} icone={PieChart} carregando={carregandoResumo} />
            <KpiCard rotulo="Empenhado" valor={formatCurrency(totalEmpenhado)} icone={TrendingUp} carregando={carregandoResumo} />
            <KpiCard rotulo="Saldo disponível" valor={formatCurrency(saldoDisponivel)} icone={PiggyBank} carregando={carregandoResumo} />
            <Card>
              <CardContent className="space-y-2 p-4">
                <p className="text-body text-muted-foreground" id="orc-execucao">Execução (pago / dotação)</p>
                {carregandoResumo ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <p className="text-h1 tabular-nums text-foreground">{percentualExecutado.toFixed(1)}%</p>
                    <Progress value={percentualExecutado} className="h-2" aria-labelledby="orc-execucao" />
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <section aria-labelledby="orc-dotacoes" className="space-y-3">
          <h2 id="orc-dotacoes" className="text-h2 text-foreground">Dotações orçamentárias — {exercicio}</h2>
          <DataTable
            rotulo={`Dotações orçamentárias de ${exercicio}`}
            dados={dotacoes ?? []}
            colunas={colunas}
            chaveLinha={(dot) => dot.id}
            carregando={isLoading}
            erro={isError ? "Não foi possível carregar as dotações." : null}
            aoTentarNovamente={() => refetch()}
            busca={{ placeholder: "Buscar por código, ação ou programa…" }}
            vazio={{
              icone: PieChart,
              titulo: "Nenhuma dotação encontrada",
              descricao: `Não há dotações ativas cadastradas para ${exercicio}.`,
            }}
          />
        </section>
      </div>
    </ModuleLayout>
  );
}
