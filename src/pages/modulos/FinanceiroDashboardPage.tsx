/**
 * DASHBOARD - FINANCEIRO
 */

import { DollarSign, FileText, CreditCard, TrendingUp, Receipt, PiggyBank, Calculator, BarChart3 } from "lucide-react";
import { ModuleDashboard, type ModuleStat, type ModuleQuickAction, type ModuleMenuItem } from "@/components/modules";

const stats: ModuleStat[] = [
  { label: "Dotação Anual", value: "R$ 12M", icon: PiggyBank, href: "/financeiro/dotacao" },
  { label: "Executado", value: "45%", icon: TrendingUp },
  { label: "Empenhos Pendentes", value: "8", icon: FileText, href: "/financeiro/empenhos" },
  { label: "Pagamentos", value: "R$ 5.4M", icon: CreditCard },
];

const quickActions: ModuleQuickAction[] = [
  { label: "Nova Solicitação", description: "Solicitar despesa", href: "/financeiro/solicitacoes/nova", icon: Receipt, variant: "default" },
  { label: "Empenhos", description: "Gerenciar empenhos", href: "/financeiro/empenhos", icon: FileText },
  { label: "Liquidações", description: "Processar liquidações", href: "/financeiro/liquidacoes", icon: Calculator },
  { label: "Pagamentos", description: "Ordens de pagamento", href: "/financeiro/pagamentos", icon: CreditCard },
];

const menuItems: ModuleMenuItem[] = [
  { label: "Dotação Orçamentária", href: "/financeiro/dotacao" },
  { label: "Solicitações de Despesa", href: "/financeiro/solicitacoes" },
  { label: "Empenhos", href: "/financeiro/empenhos" },
  { label: "Liquidações", href: "/financeiro/liquidacoes" },
  { label: "Pagamentos", href: "/financeiro/pagamentos" },
  { label: "Adiantamentos", href: "/financeiro/adiantamentos" },
  { label: "Relatórios", href: "/financeiro/relatorios" },
];

export default function FinanceiroDashboardPage() {
  return (
    <ModuleDashboard
      title="Financeiro"
      description="Orçamento, empenhos, liquidações e pagamentos"
      icon={DollarSign}
      color="green"
      stats={stats}
      quickActions={quickActions}
      menuItems={menuItems}
    />
  );
}
