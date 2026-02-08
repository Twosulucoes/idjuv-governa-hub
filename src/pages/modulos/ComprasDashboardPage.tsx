/**
 * DASHBOARD - COMPRAS
 */

import { ShoppingCart, FileText, Gavel, ClipboardList, Scale, FileCheck, TrendingUp, AlertCircle } from "lucide-react";
import { ModuleDashboard, type ModuleStat, type ModuleQuickAction, type ModuleMenuItem } from "@/components/modules";

const stats: ModuleStat[] = [
  { label: "Licitações Ativas", value: "4", icon: Gavel, href: "/compras/licitacoes" },
  { label: "Em Andamento", value: "12", icon: FileText },
  { label: "Dispensas/Inexig.", value: "3", icon: Scale },
  { label: "Concluídas (Ano)", value: "28", icon: FileCheck },
];

const quickActions: ModuleQuickAction[] = [
  { label: "Nova Licitação", description: "Iniciar processo", href: "/compras/licitacoes/nova", icon: Gavel, variant: "default" },
  { label: "Termo de Referência", description: "Elaborar TR", href: "/compras/tr", icon: FileText },
  { label: "Pesquisa de Preços", description: "Orçamentos", href: "/compras/pesquisa", icon: TrendingUp },
  { label: "Dispensas", description: "Art. 75", href: "/compras/dispensas", icon: Scale },
];

const menuItems: ModuleMenuItem[] = [
  { label: "Licitações", href: "/compras/licitacoes" },
  { label: "Dispensas e Inexigibilidades", href: "/compras/dispensas" },
  { label: "Atas de Registro de Preço", href: "/compras/atas" },
  { label: "Termos de Referência", href: "/compras/tr" },
  { label: "Pesquisa de Preços", href: "/compras/pesquisa" },
  { label: "Fornecedores", href: "/compras/fornecedores" },
  { label: "Relatórios", href: "/compras/relatorios" },
];

export default function ComprasDashboardPage() {
  return (
    <ModuleDashboard
      title="Compras"
      description="Licitações, dispensas e processos de aquisição"
      icon={ShoppingCart}
      color="orange"
      stats={stats}
      quickActions={quickActions}
      menuItems={menuItems}
    />
  );
}
