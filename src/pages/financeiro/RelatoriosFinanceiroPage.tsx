import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  PieChart,
  TrendingUp,
  Building2,
  Users,
  Wallet,
  Download,
  Calendar,
} from "lucide-react";

const relatorios = [
  {
    id: "execucao-orcamentaria",
    titulo: "Execução Orçamentária",
    descricao: "Demonstrativo de execução por programa, ação e natureza de despesa",
    icon: PieChart,
    categoria: "Orçamento",
  },
  {
    id: "despesas-centro-custo",
    titulo: "Despesas por Centro de Custo",
    descricao: "Análise de gastos por unidade organizacional",
    icon: Building2,
    categoria: "Despesas",
  },
  {
    id: "despesas-fornecedor",
    titulo: "Despesas por Fornecedor",
    descricao: "Ranking e detalhamento de pagamentos por fornecedor",
    icon: Users,
    categoria: "Despesas",
  },
  {
    id: "fluxo-caixa",
    titulo: "Fluxo de Caixa",
    descricao: "Entradas e saídas por período com projeções",
    icon: TrendingUp,
    categoria: "Financeiro",
  },
  {
    id: "adiantamentos",
    titulo: "Adiantamentos e Prestações",
    descricao: "Controle de suprimento de fundos e comprovações",
    icon: Wallet,
    categoria: "Controle",
  },
  {
    id: "contratos-vigentes",
    titulo: "Contratos Vigentes",
    descricao: "Execução financeira e cronograma de contratos ativos",
    icon: FileText,
    categoria: "Contratos",
  },
  {
    id: "contas-pagar",
    titulo: "Contas a Pagar (Aging)",
    descricao: "Análise de vencimentos e compromissos futuros",
    icon: Calendar,
    categoria: "Financeiro",
  },
  {
    id: "conciliacao-bancaria",
    titulo: "Conciliação Bancária",
    descricao: "Status de conciliação por conta e período",
    icon: Building2,
    categoria: "Tesouraria",
  },
];

const categorias = [...new Set(relatorios.map((r) => r.categoria))];

export default function RelatoriosFinanceiroPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Relatórios Financeiros</h1>
        <p className="text-muted-foreground">
          Central de relatórios e demonstrativos do módulo financeiro
        </p>
      </div>

      {categorias.map((categoria) => (
        <div key={categoria} className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground border-b pb-2">
            {categoria}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatorios
              .filter((r) => r.categoria === categoria)
              .map((relatorio) => (
                <Card key={relatorio.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <relatorio.icon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <CardTitle className="text-base">{relatorio.titulo}</CardTitle>
                    <CardDescription className="text-sm">
                      {relatorio.descricao}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 gap-1">
                        <FileText className="h-3.5 w-3.5" />
                        Visualizar
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-1">
                        <Download className="h-3.5 w-3.5" />
                        PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
