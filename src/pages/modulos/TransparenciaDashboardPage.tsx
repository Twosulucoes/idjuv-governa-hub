/**
 * DASHBOARD - TRANSPARÊNCIA
 */

import { Eye, FileText, Search, Download, Globe, BarChart3, Users, Building2 } from "lucide-react";
import { ModuleDashboard, type ModuleStat, type ModuleQuickAction, type ModuleMenuItem } from "@/components/modules";

const stats: ModuleStat[] = [
  { label: "Publicações", value: "156", icon: FileText },
  { label: "Downloads (Mês)", value: "1.2k", icon: Download },
  { label: "Solicitações LAI", value: "8", icon: Search },
  { label: "Acessos (Mês)", value: "5.4k", icon: Globe },
];

const quickActions: ModuleQuickAction[] = [
  { label: "Portal LAI", description: "e-SIC", href: "/transparencia/lai", icon: Search, variant: "default" },
  { label: "Licitações", description: "Publicações", href: "/transparencia/licitacoes", icon: FileText },
  { label: "Cargos e Remuneração", description: "Quadro de pessoal", href: "/transparencia/cargos", icon: Users },
  { label: "Execução Orçamentária", description: "Despesas públicas", href: "/transparencia/orcamento", icon: BarChart3 },
];

const menuItems: ModuleMenuItem[] = [
  { label: "Portal da Transparência", href: "/transparencia" },
  { label: "Licitações Públicas", href: "/transparencia/licitacoes" },
  { label: "Contratos Públicos", href: "/transparencia/contratos" },
  { label: "Execução Orçamentária", href: "/transparencia/orcamento" },
  { label: "Patrimônio Público", href: "/transparencia/patrimonio" },
  { label: "Cargos e Remuneração", href: "/transparencia/cargos" },
  { label: "e-SIC / LAI", href: "/transparencia/lai" },
];

export default function TransparenciaDashboardPage() {
  return (
    <ModuleDashboard
      title="Transparência"
      description="Portal LAI e dados públicos"
      icon={Eye}
      color="teal"
      stats={stats}
      quickActions={quickActions}
      menuItems={menuItems}
    />
  );
}
