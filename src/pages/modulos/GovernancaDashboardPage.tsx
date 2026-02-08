/**
 * DASHBOARD - GOVERNANÇA
 */

import { Building2, Network, Users, FileText, Shield, Scale, Landmark, ClipboardList } from "lucide-react";
import { ModuleDashboard, type ModuleStat, type ModuleQuickAction, type ModuleMenuItem } from "@/components/modules";

const stats: ModuleStat[] = [
  { label: "Unidades Org.", value: "12", icon: Building2, href: "/organograma" },
  { label: "Cargos", value: "28", icon: Users, href: "/cargos" },
  { label: "Federações", value: "15", icon: Shield, href: "/admin/federacoes" },
  { label: "Portarias", value: "42", icon: FileText, href: "/governanca/portarias" },
];

const quickActions: ModuleQuickAction[] = [
  { label: "Organograma", description: "Estrutura organizacional", href: "/organograma", icon: Network, variant: "default" },
  { label: "Matriz RACI", description: "Responsabilidades", href: "/governanca/matriz-raci", icon: ClipboardList },
  { label: "Federações", description: "Gestão de entidades", href: "/admin/federacoes", icon: Shield },
  { label: "Portarias", description: "Atos normativos", href: "/governanca/portarias", icon: FileText },
];

const menuItems: ModuleMenuItem[] = [
  { label: "Organograma", href: "/organograma" },
  { label: "Gestão do Organograma", href: "/organograma/gestao" },
  { label: "Cargos", href: "/cargos" },
  { label: "Lotações", href: "/lotacoes" },
  { label: "Matriz RACI", href: "/governanca/matriz-raci" },
  { label: "Lei de Criação", href: "/governanca/lei-criacao" },
  { label: "Regimento Interno", href: "/governanca/regimento" },
  { label: "Federações Esportivas", href: "/admin/federacoes" },
];

export default function GovernancaDashboardPage() {
  return (
    <ModuleDashboard
      title="Governança"
      description="Estrutura organizacional, normas e compliance"
      icon={Building2}
      color="indigo"
      stats={stats}
      quickActions={quickActions}
      menuItems={menuItems}
    />
  );
}
