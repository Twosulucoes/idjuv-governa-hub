import { ModuleLayout } from "@/components/layout";
import { Card, CardHeader, CardDescription } from "@/components/ui/card";
import { PageHeader, StatusBadge } from "@/components/design-system";
import {
  FileText,
  PieChart,
  TrendingUp,
  Building2,
  Users,
  Wallet,
  Calendar,
} from "lucide-react";

const relatorios = [
  {
    id: "execucao-orcamentaria",
    titulo: "Execução orçamentária",
    descricao: "Demonstrativo de execução por programa, ação e natureza de despesa",
    icon: PieChart,
    categoria: "Orçamento",
  },
  {
    id: "despesas-centro-custo",
    titulo: "Despesas por centro de custo",
    descricao: "Análise de gastos por unidade organizacional",
    icon: Building2,
    categoria: "Despesas",
  },
  {
    id: "despesas-fornecedor",
    titulo: "Despesas por fornecedor",
    descricao: "Ranking e detalhamento de pagamentos por fornecedor",
    icon: Users,
    categoria: "Despesas",
  },
  {
    id: "fluxo-caixa",
    titulo: "Fluxo de caixa",
    descricao: "Entradas e saídas por período com projeções",
    icon: TrendingUp,
    categoria: "Financeiro",
  },
  {
    id: "adiantamentos",
    titulo: "Adiantamentos e prestações",
    descricao: "Controle de suprimento de fundos e comprovações",
    icon: Wallet,
    categoria: "Controle",
  },
  {
    id: "contratos-vigentes",
    titulo: "Contratos vigentes",
    descricao: "Execução financeira e cronograma de contratos ativos",
    icon: FileText,
    categoria: "Contratos",
  },
  {
    id: "contas-pagar",
    titulo: "Contas a pagar (aging)",
    descricao: "Análise de vencimentos e compromissos futuros",
    icon: Calendar,
    categoria: "Financeiro",
  },
  {
    id: "conciliacao-bancaria",
    titulo: "Conciliação bancária",
    descricao: "Status de conciliação por conta e período",
    icon: Building2,
    categoria: "Tesouraria",
  },
];

const categorias = [...new Set(relatorios.map((r) => r.categoria))];

export default function RelatoriosFinanceiroPage() {
  return (
    <ModuleLayout module="financeiro">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Financeiro", href: "/financeiro" }, { rotulo: "Relatórios" }]}
          titulo="Relatórios financeiros"
          descricao="Central de relatórios e demonstrativos do módulo financeiro"
        />

        <p className="text-body text-muted-foreground">
          Os relatórios abaixo ainda não estão disponíveis para geração. Enquanto isso, use a exportação do QDD e
          as listagens de cada tela.
        </p>

        {categorias.map((categoria) => (
          <section key={categoria} className="space-y-4" aria-labelledby={`cat-${categoria}`}>
            <h2 id={`cat-${categoria}`} className="text-h2 text-foreground border-b border-border pb-2">
              {categoria}
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatorios
                .filter((r) => r.categoria === categoria)
                .map((relatorio) => (
                  <li key={relatorio.id}>
                    <Card className="h-full">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <relatorio.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                          </div>
                          <StatusBadge tom="neutro">Em preparação</StatusBadge>
                        </div>
                        <h3 className="text-h3 text-foreground">{relatorio.titulo}</h3>
                        <CardDescription>{relatorio.descricao}</CardDescription>
                      </CardHeader>
                    </Card>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </ModuleLayout>
  );
}
