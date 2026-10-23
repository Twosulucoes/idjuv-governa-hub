import { useState } from "react";
import { Link } from "react-router-dom";
import { ModuleLayout } from "@/components/layout";
import ContaBancariaFormDialog from "@/components/financeiro/ContaBancariaFormDialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DataTable, KpiCard, PageHeader, StatusBadge, type ColunaTabela } from "@/components/design-system";
import { Plus, Building2, CheckCircle2, Wallet, Info } from "lucide-react";
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
  const [formOpen, setFormOpen] = useState(false);

  const saldoTotal = contas?.reduce((acc, conta) => acc + (conta.saldo_atual || 0), 0) || 0;

  return (
    <ModuleLayout module="financeiro">
    <div className="space-y-6">
      <PageHeader
        migalhas={[{ rotulo: "Financeiro", href: "/financeiro" }, { rotulo: "Contas bancárias" }]}
        titulo="Contas bancárias"
        descricao="Gestão de contas e saldos bancários"
        acoes={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nova conta
          </Button>
        }
      />

      <Alert>
        <Info className="h-4 w-4" aria-hidden="true" />
        <AlertTitle>Esta tela é a tesouraria (saldos)</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            A conta que paga pelo arquivo do banco (convênio, remessa OBN600) se cadastra e se edita em Conciliação
            bancária → Contas pagadoras. A conta de quem recebe fica no cadastro do favorecido.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/financeiro/conciliacao?aba=contas">Abrir contas pagadoras</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/financeiro/favorecidos">Abrir favorecidos</Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>

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
      />
    </div>
    <ContaBancariaFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </ModuleLayout>
  );
}
