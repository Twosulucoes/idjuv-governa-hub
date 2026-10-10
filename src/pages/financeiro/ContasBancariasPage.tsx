import { ModuleLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { DataTable, KpiCard, PageHeader, StatusBadge, type ColunaTabela } from "@/components/design-system";
import { Plus, Building2, Eye, RefreshCw, CheckCircle2, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useContasBancarias } from "@/hooks/useFinanceiro";
import type { ContaBancaria } from "@/types/financeiro";

const tipoContaLabels: Record<string, string> = {
  corrente: "Corrente",
  poupanca: "Poupança",
  aplicacao: "Aplicação",
  vinculada: "Vinculada",
};

const colunas: ColunaTabela<ContaBancaria>[] = [
  {
    id: "nome",
    cabecalho: "Nome",
    celula: (conta) => <span className="font-medium">{conta.nome_conta}</span>,
    ordenarPor: (conta) => conta.nome_conta,
    buscarPor: (conta) => conta.nome_conta,
    mobile: "titulo",
  },
  {
    id: "banco",
    cabecalho: "Banco",
    celula: (conta) => conta.banco_nome,
    ordenarPor: (conta) => conta.banco_nome,
    buscarPor: (conta) => conta.banco_nome,
  },
  {
    id: "agencia",
    cabecalho: "Agência",
    celula: (conta) => conta.agencia,
    ordenarPor: (conta) => conta.agencia,
  },
  {
    id: "conta",
    cabecalho: "Conta",
    celula: (conta) => conta.conta,
    ordenarPor: (conta) => conta.conta,
    buscarPor: (conta) => conta.conta,
  },
  {
    id: "tipo",
    cabecalho: "Tipo",
    celula: (conta) => tipoContaLabels[conta.tipo] || conta.tipo,
    ordenarPor: (conta) => tipoContaLabels[conta.tipo] || conta.tipo,
  },
  {
    id: "saldo",
    cabecalho: "Saldo",
    celula: (conta) => <span className="font-mono tabular-nums">{formatCurrency(conta.saldo_atual)}</span>,
    ordenarPor: (conta) => Number(conta.saldo_atual || 0),
    alinhamento: "direita",
  },
  {
    id: "status",
    cabecalho: "Situação",
    celula: (conta) => (
      <StatusBadge tom={conta.ativo ? "sucesso" : "neutro"}>{conta.ativo ? "Ativa" : "Inativa"}</StatusBadge>
    ),
    ordenarPor: (conta) => conta.ativo,
  },
];

export default function ContasBancariasPage() {
  const { data: contas, isLoading, isError, refetch } = useContasBancarias();

  const saldoTotal = contas?.reduce((acc, conta) => acc + (conta.saldo_atual || 0), 0) || 0;

  return (
    <ModuleLayout module="financeiro">
    <div className="space-y-6">
      <PageHeader
        migalhas={[{ rotulo: "Financeiro", href: "/financeiro" }, { rotulo: "Contas bancárias" }]}
        titulo="Contas bancárias"
        descricao="Gestão de contas e saldos bancários"
        acoes={
          <>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Atualizar saldos
            </Button>
            <Button>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nova conta
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard rotulo="Total de contas" valor={contas?.length || 0} icone={Building2} carregando={isLoading} />
        <KpiCard
          rotulo="Contas ativas"
          valor={contas?.filter((c) => c.ativo).length || 0}
          icone={CheckCircle2}
          carregando={isLoading}
        />
        <KpiCard rotulo="Saldo total" valor={formatCurrency(saldoTotal)} icone={Wallet} carregando={isLoading} />
      </div>

      <DataTable
        rotulo="Contas cadastradas"
        dados={contas ?? []}
        colunas={colunas}
        chaveLinha={(conta) => conta.id}
        carregando={isLoading}
        erro={isError ? "Não foi possível carregar as contas bancárias." : null}
        aoTentarNovamente={() => refetch()}
        busca={{ placeholder: "Buscar por nome, banco ou número…" }}
        vazio={{
          icone: Building2,
          titulo: "Nenhuma conta encontrada",
          descricao: "Cadastre uma conta bancária para começar.",
        }}
        acoesLinha={(conta) => (
          <Button variant="ghost" size="icon" aria-label={`Ver conta ${conta.nome_conta}`}>
            <Eye className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      />
    </div>
    </ModuleLayout>
  );
}
