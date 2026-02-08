/**
 * DASHBOARD - RECURSOS HUMANOS
 */

import { Users, Calendar, Plane, FileText, ClipboardList, UserPlus, Clock, Award } from "lucide-react";
import { ModuleDashboard, type ModuleStat, type ModuleQuickAction, type ModuleMenuItem } from "@/components/modules";

const stats: ModuleStat[] = [
  { label: "Servidores Ativos", value: "45", icon: Users, href: "/rh/servidores" },
  { label: "Em Férias", value: "3", icon: Calendar, href: "/rh/ferias" },
  { label: "Viagens Pendentes", value: "2", icon: Plane, href: "/rh/viagens" },
  { label: "Frequência Hoje", value: "92%", icon: Clock, href: "/rh/frequencia" },
];

const quickActions: ModuleQuickAction[] = [
  { label: "Novo Servidor", description: "Cadastrar servidor", href: "/rh/servidores/novo", icon: UserPlus, variant: "default" },
  { label: "Lançar Férias", description: "Programar férias", href: "/rh/ferias", icon: Calendar },
  { label: "Nova Viagem", description: "Solicitar diária", href: "/rh/viagens", icon: Plane },
  { label: "Designações", description: "Gerenciar designações", href: "/rh/designacoes", icon: Award },
];

const menuItems: ModuleMenuItem[] = [
  { label: "Servidores", href: "/rh/servidores" },
  { label: "Férias e Licenças", href: "/rh/ferias" },
  { label: "Viagens e Diárias", href: "/rh/viagens" },
  { label: "Frequência", href: "/rh/frequencia" },
  { label: "Designações", href: "/rh/designacoes" },
  { label: "Central de Portarias", href: "/rh/portarias" },
  { label: "Relatórios", href: "/rh/relatorios" },
  { label: "Modelos de Documentos", href: "/rh/modelos" },
];

export default function RHDashboardPage() {
  return (
    <ModuleDashboard
      title="Recursos Humanos"
      description="Gestão de pessoal, frequência, férias e viagens"
      icon={Users}
      color="blue"
      stats={stats}
      quickActions={quickActions}
      menuItems={menuItems}
    />
  );
}
