/**
 * DASHBOARD - GESTORES ESCOLARES
 */

import { School, Users, FileCheck, ClipboardList, UserPlus, Search, Download, BarChart3 } from "lucide-react";
import { ModuleDashboard, type ModuleStat, type ModuleQuickAction, type ModuleMenuItem } from "@/components/modules";

const stats: ModuleStat[] = [
  { label: "Gestores Cadastrados", value: "156", icon: Users, href: "/cadastrogestores/admin" },
  { label: "Escolas", value: "89", icon: School },
  { label: "Pendentes", value: "12", icon: ClipboardList },
  { label: "Aprovados", value: "144", icon: FileCheck },
];

const quickActions: ModuleQuickAction[] = [
  { label: "Gestão de Cadastros", description: "Administrar gestores", href: "/cadastrogestores/admin", icon: ClipboardList, variant: "default" },
  { label: "Importar Escolas", description: "Carregar lista", href: "/cadastrogestores/importar", icon: Download },
  { label: "Consultar", description: "Buscar gestor", href: "/cadastrogestores/consulta", icon: Search },
  { label: "Relatórios", description: "Estatísticas", href: "/cadastrogestores/relatorios", icon: BarChart3 },
];

const menuItems: ModuleMenuItem[] = [
  { label: "Gestão de Cadastros", href: "/cadastrogestores/admin" },
  { label: "Importar Escolas", href: "/cadastrogestores/importar" },
  { label: "Consulta Pública", href: "/cadastrogestores/consulta" },
  { label: "Relatórios", href: "/cadastrogestores/relatorios" },
];

export default function GestoresEscolaresDashboardPage() {
  return (
    <ModuleDashboard
      title="Gestores Escolares"
      description="Credenciamento para Jogos Escolares"
      icon={School}
      color="amber"
      stats={stats}
      quickActions={quickActions}
      menuItems={menuItems}
    />
  );
}
