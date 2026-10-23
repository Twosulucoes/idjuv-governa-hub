/**
 * DASHBOARD - FINANCEIRO
 * Painel da execução orçamentária do exercício, calculado sobre o QDD e o FIP 614 importados do FIPLAN.
 * Spec: docs/superpowers/specs/2026-10-23-painel-financeiro-fiplan-design.md
 */

import { useMemo } from "react";
import { FileText, CreditCard, Receipt, Calculator, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { ModuleLayout } from "@/components/layout";
import { usePainelFinanceiro } from "@/hooks/useFinanceiro";
import { useExercicioFinanceiro } from "@/hooks/useExercicioFinanceiro";
import { SeletorExercicio } from "@/components/financeiro/SeletorExercicio";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/design-system";
import { FaixaAtualizacao } from "@/components/financeiro/painel/FaixaAtualizacao";
import { CartoesExecucao } from "@/components/financeiro/painel/CartoesExecucao";
import { ExecucaoPorGrupo } from "@/components/financeiro/painel/ExecucaoPorGrupo";
import { AlertasSaldo } from "@/components/financeiro/painel/AlertasSaldo";
import { FilaPagamento } from "@/components/financeiro/painel/FilaPagamento";
import { MaioresDespesas } from "@/components/financeiro/painel/MaioresDespesas";
import {
  alertasDeSaldo,
  execucaoPorGrupo,
  filaDePagamento,
  maioresDespesas,
  resumirExecucao,
} from "@/lib/financeiro/painelExecucao";

/** Mês dos dados: o da última importação do QDD; exercício encerrado vale dezembro. */
function mesDeReferencia(exercicio: number, qdd: string | null, hoje: Date): number {
  if (exercicio < hoje.getFullYear()) return 12;
  return (qdd ? new Date(qdd) : hoje).getMonth() + 1;
}

export default function FinanceiroDashboardPage() {
  const { exercicio, comExercicio } = useExercicioFinanceiro();
  const { dotacoes, empenhos, atualizacao } = usePainelFinanceiro(exercicio);
  const hoje = useMemo(() => new Date(), []);

  const linhas = dotacoes.data;
  const qdd = atualizacao.data?.qdd ?? null;
  const painel = useMemo(() => {
    if (!linhas) return null;
    const mes = mesDeReferencia(exercicio, qdd, hoje);
    return {
      resumo: resumirExecucao(linhas),
      grupos: execucaoPorGrupo(linhas),
      alertas: alertasDeSaldo(linhas, mes),
      despesas: maioresDespesas(linhas),
    };
  }, [linhas, exercicio, qdd, hoje]);
  const fila = useMemo(() => filaDePagamento(empenhos.data ?? [], hoje), [empenhos.data, hoje]);

  const estadoDotacoes = {
    carregando: dotacoes.isLoading,
    erro: dotacoes.isError,
    onTentarNovamente: () => dotacoes.refetch(),
  };
  const semDados = !dotacoes.isLoading && !dotacoes.isError && (linhas?.length ?? 0) === 0;

  const quickActions = [
    { label: "Solicitações", description: "Solicitações de despesa", href: "/financeiro/solicitacoes", icon: Receipt },
    { label: "Empenhos", description: "Gerenciar empenhos", href: "/financeiro/empenhos", icon: FileText },
    { label: "Liquidações", description: "Processar liquidações", href: "/financeiro/liquidacoes", icon: Calculator },
    { label: "Pagamentos", description: "Ordens de pagamento", href: "/financeiro/pagamentos", icon: CreditCard },
  ];

  return (
    <ModuleLayout module="financeiro">
      <div className="space-y-6">
        <PageHeader
          titulo="Financeiro"
          descricao={`Execução orçamentária do exercício ${exercicio}`}
          acoes={<SeletorExercicio />}
        />

        {!atualizacao.isLoading && (
          <FaixaAtualizacao qdd={qdd} fip614={atualizacao.data?.fip614 ?? null} hoje={hoje} />
        )}

        {semDados ? (
          <EmptyState
            icone={Upload}
            titulo="Importe o QDD do FIPLAN para ver o painel"
            descricao="O painel é calculado sobre o QDD (dotações) e o FIP 614 (empenhos) importados na Central de Importações."
            acao={
              <Button asChild>
                <Link to="/admin/importacoes">Ir para a Central de Importações</Link>
              </Button>
            }
          />
        ) : (
          <>
            <CartoesExecucao
              resumo={dotacoes.isError ? null : (painel?.resumo ?? null)}
              carregando={dotacoes.isLoading}
              comExercicio={comExercicio}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 [&>*]:min-w-0">
              <ExecucaoPorGrupo grupos={painel?.grupos ?? []} {...estadoDotacoes} />
              <AlertasSaldo alertas={painel?.alertas ?? []} {...estadoDotacoes} />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 [&>*]:min-w-0">
              <div className="lg:col-span-3">
                <FilaPagamento
                  fila={fila}
                  comExercicio={comExercicio}
                  carregando={empenhos.isLoading}
                  erro={empenhos.isError}
                  onTentarNovamente={() => empenhos.refetch()}
                />
              </div>
              <div className="lg:col-span-2">
                <MaioresDespesas despesas={painel?.despesas ?? []} {...estadoDotacoes} />
              </div>
            </div>
          </>
        )}

        <Card>
          <CardHeader>
            <h2 className="text-h2 text-foreground">Ações rápidas</h2>
            <CardDescription>Acesse as principais funcionalidades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.label}
                    variant="outline"
                    className="h-auto sm:h-auto py-4 flex flex-col items-center gap-2 whitespace-normal"
                    asChild
                  >
                    <Link to={comExercicio(action.href)}>
                      <Icon className="h-6 w-6" aria-hidden="true" />
                      <span className="font-medium">{action.label}</span>
                      <span className="text-caption text-muted-foreground">{action.description}</span>
                    </Link>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
