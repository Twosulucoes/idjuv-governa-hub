/**
 * DASHBOARD - GESTORES ESCOLARES
 * Consome dados reais do banco de dados
 */

import { School, Users, FileCheck, ClipboardList, Search, Download, BarChart3, Loader2 } from "lucide-react";
import { ModuleDashboard, type ModuleStat, type ModuleQuickAction, type ModuleMenuItem } from "@/components/modules";
import { useGestoresEscolaresDashboardStats } from "@/hooks/dashboard";

const quickActions: ModuleQuickAction[] = [
  { label: "Gestão de Cadastros", description: "Administrar gestores", href: "/cadastrogestores/admin", icon: ClipboardList, variant: "default" },
  { label: "Importar Escolas", description: "Carregar lista", href: "/cadastrogestores/admin/escolas", icon: Download },
  { label: "Consultar", description: "Buscar gestor", href: "/cadastrogestores/consulta", icon: Search },
  { label: "Relatórios", description: "Estatísticas", href: "/cadastrogestores/relatorios", icon: BarChart3 },
];

const menuItems: ModuleMenuItem[] = [
  { label: "Gestão de Cadastros", href: "/cadastrogestores/admin" },
  { label: "Importar Escolas", href: "/cadastrogestores/admin/escolas" },
  { label: "Consulta Pública", href: "/cadastrogestores/consulta" },
  { label: "Relatórios", href: "/cadastrogestores/relatorios" },
];

export default function GestoresEscolaresDashboardPage() {
  const { data: stats, isLoading } = useGestoresEscolaresDashboardStats();

  // Stats dinâmicos baseados no BD
  const dynamicStats: ModuleStat[] = [
    { 
      label: "Gestores Cadastrados", 
      value: isLoading ? "..." : String(stats?.gestoresCadastrados || 0), 
      icon: Users, 
      href: "/cadastrogestores/admin" 
    },
    { 
      label: "Escolas", 
      value: isLoading ? "..." : String(stats?.escolas || 0), 
      icon: School,
      href: "/cadastrogestores/admin/escolas"
    },
    { 
      label: "Pendentes", 
      value: isLoading ? "..." : String(stats?.pendentes || 0), 
      icon: ClipboardList 
    },
    { 
      label: "Confirmados", 
      value: isLoading ? "..." : String(stats?.confirmados || 0), 
      icon: FileCheck 
    },
  ];

  return (
    <ModuleDashboard
      title="Gestores Escolares"
      description="Credenciamento para Jogos Escolares"
      icon={School}
      color="amber"
      stats={dynamicStats}
      quickActions={quickActions}
      menuItems={menuItems}
    />
  );
}
