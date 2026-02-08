/**
 * DASHBOARD - WORKFLOW / PROCESSOS
 */

import { GitBranch, FileText, Clock, CheckCircle, FilePlus, Search, ArrowRight, AlertCircle } from "lucide-react";
import { ModuleDashboard, type ModuleStat, type ModuleQuickAction, type ModuleMenuItem } from "@/components/modules";

const stats: ModuleStat[] = [
  { label: "Processos Ativos", value: "24", icon: FileText, href: "/workflow" },
  { label: "Pendentes Comigo", value: "5", icon: Clock },
  { label: "Tramitados Hoje", value: "8", icon: ArrowRight },
  { label: "Concluídos (Mês)", value: "32", icon: CheckCircle },
];

const quickActions: ModuleQuickAction[] = [
  { label: "Novo Processo", description: "Iniciar processo", href: "/workflow/novo", icon: FilePlus, variant: "default" },
  { label: "Meus Processos", description: "Processos pendentes", href: "/workflow/meus", icon: Clock },
  { label: "Consultar", description: "Buscar processo", href: "/workflow/consultar", icon: Search },
  { label: "Tramitar", description: "Encaminhar processo", href: "/workflow", icon: ArrowRight },
];

const menuItems: ModuleMenuItem[] = [
  { label: "Todos os Processos", href: "/workflow" },
  { label: "Meus Processos", href: "/workflow/meus" },
  { label: "Em Tramitação", href: "/workflow/tramitacao" },
  { label: "Arquivados", href: "/workflow/arquivados" },
  { label: "Criar Processo", href: "/workflow/novo" },
  { label: "Relatórios", href: "/workflow/relatorios" },
];

export default function WorkflowDashboardPage() {
  return (
    <ModuleDashboard
      title="Processos Administrativos"
      description="Tramitação e gestão de processos"
      icon={GitBranch}
      color="purple"
      stats={stats}
      quickActions={quickActions}
      menuItems={menuItems}
    />
  );
}
