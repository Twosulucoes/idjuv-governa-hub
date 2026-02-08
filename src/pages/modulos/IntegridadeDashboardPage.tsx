/**
 * DASHBOARD - INTEGRIDADE
 */

import { Shield, AlertTriangle, FileText, Lock, Eye, UserCheck, Scale, ClipboardList } from "lucide-react";
import { ModuleDashboard, type ModuleStat, type ModuleQuickAction, type ModuleMenuItem } from "@/components/modules";

const stats: ModuleStat[] = [
  { label: "Denúncias Abertas", value: "3", icon: AlertTriangle, href: "/integridade/denuncias" },
  { label: "Em Análise", value: "2", icon: Eye },
  { label: "Resolvidas (Ano)", value: "8", icon: UserCheck },
  { label: "Conformidade", value: "94%", icon: Shield },
];

const quickActions: ModuleQuickAction[] = [
  { label: "Canal de Denúncias", description: "Receber denúncia", href: "/integridade/denuncias", icon: AlertTriangle, variant: "default" },
  { label: "Gestão", description: "Administrar denúncias", href: "/integridade/gestao", icon: ClipboardList },
  { label: "Código de Ética", description: "Normas de conduta", href: "/integridade/etica", icon: Scale },
  { label: "Conflito de Interesses", description: "Declarações", href: "/integridade/conflitos", icon: Lock },
];

const menuItems: ModuleMenuItem[] = [
  { label: "Visão Geral", href: "/integridade" },
  { label: "Canal de Denúncias", href: "/integridade/denuncias" },
  { label: "Gestão de Denúncias", href: "/integridade/gestao" },
  { label: "Código de Ética", href: "/integridade/etica" },
  { label: "Conflito de Interesses", href: "/integridade/conflitos" },
  { label: "Relatórios", href: "/integridade/relatorios" },
];

export default function IntegridadeDashboardPage() {
  return (
    <ModuleDashboard
      title="Integridade"
      description="Ética, compliance e canal de denúncias"
      icon={Shield}
      color="rose"
      stats={stats}
      quickActions={quickActions}
      menuItems={menuItems}
    />
  );
}
