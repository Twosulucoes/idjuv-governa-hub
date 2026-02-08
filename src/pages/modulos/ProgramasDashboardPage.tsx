/**
 * DASHBOARD - PROGRAMAS
 */

import { Award, Users, Trophy, Calendar, Target, FileText, MapPin, BarChart3 } from "lucide-react";
import { ModuleDashboard, type ModuleStat, type ModuleQuickAction, type ModuleMenuItem } from "@/components/modules";

const stats: ModuleStat[] = [
  { label: "Programas Ativos", value: "5", icon: Target },
  { label: "Beneficiários", value: "1.2k", icon: Users },
  { label: "Atletas (Bolsa)", value: "48", icon: Trophy },
  { label: "Eventos (Ano)", value: "32", icon: Calendar },
];

const quickActions: ModuleQuickAction[] = [
  { label: "Bolsa Atleta", description: "Gestão de atletas", href: "/programas/bolsa-atleta", icon: Trophy, variant: "default" },
  { label: "Juventude Cidadã", description: "Jovens atendidos", href: "/programas/juventude", icon: Users },
  { label: "Jogos Escolares", description: "JERs", href: "/programas/jogos-escolares", icon: Award },
  { label: "Esporte na Comunidade", description: "Núcleos", href: "/programas/esporte-comunidade", icon: MapPin },
];

const menuItems: ModuleMenuItem[] = [
  { label: "Visão Geral", href: "/programas" },
  { label: "Bolsa Atleta", href: "/programas/bolsa-atleta" },
  { label: "Juventude Cidadã", href: "/programas/juventude" },
  { label: "Jogos Escolares", href: "/programas/jogos-escolares" },
  { label: "Esporte na Comunidade", href: "/programas/esporte-comunidade" },
  { label: "Relatórios", href: "/programas/relatorios" },
];

export default function ProgramasDashboardPage() {
  return (
    <ModuleDashboard
      title="Programas"
      description="Programas sociais e esportivos"
      icon={Award}
      color="emerald"
      stats={stats}
      quickActions={quickActions}
      menuItems={menuItems}
    />
  );
}
