/**
 * DASHBOARD - CONTRATOS
 */

import { FileText, Calendar, AlertTriangle, CheckCircle, FilePlus, FileEdit, Clock, BarChart3 } from "lucide-react";
import { ModuleDashboard, type ModuleStat, type ModuleQuickAction, type ModuleMenuItem } from "@/components/modules";

const stats: ModuleStat[] = [
  { label: "Contratos Vigentes", value: "18", icon: FileText, href: "/contratos" },
  { label: "A Vencer (90 dias)", value: "3", icon: Calendar },
  { label: "Aditivos Pendentes", value: "2", icon: FileEdit },
  { label: "Valor Total", value: "R$ 8.2M", icon: BarChart3 },
];

const quickActions: ModuleQuickAction[] = [
  { label: "Novo Contrato", description: "Cadastrar contrato", href: "/contratos/novo", icon: FilePlus, variant: "default" },
  { label: "Aditivo", description: "Registrar aditivo", href: "/contratos/aditivos", icon: FileEdit },
  { label: "Fiscalização", description: "Registro de ocorrências", href: "/contratos/fiscalizacao", icon: AlertTriangle },
  { label: "Vencimentos", description: "Agenda de contratos", href: "/contratos/vencimentos", icon: Calendar },
];

const menuItems: ModuleMenuItem[] = [
  { label: "Contratos", href: "/contratos" },
  { label: "Aditivos", href: "/contratos/aditivos" },
  { label: "Fiscalização", href: "/contratos/fiscalizacao" },
  { label: "Execução Contratual", href: "/contratos/execucao" },
  { label: "Garantias", href: "/contratos/garantias" },
  { label: "Penalidades", href: "/contratos/penalidades" },
  { label: "Relatórios", href: "/contratos/relatorios" },
];

export default function ContratosDashboardPage() {
  return (
    <ModuleDashboard
      title="Contratos"
      description="Gestão e execução contratual"
      icon={FileText}
      color="amber"
      stats={stats}
      quickActions={quickActions}
      menuItems={menuItems}
    />
  );
}
