/**
 * DASHBOARD - COMUNICAÇÃO (ASCOM)
 */

import { Megaphone, FileText, Image, Calendar, Send, Clock, CheckCircle, Users } from "lucide-react";
import { ModuleDashboard, type ModuleStat, type ModuleQuickAction, type ModuleMenuItem } from "@/components/modules";

const stats: ModuleStat[] = [
  { label: "Demandas Abertas", value: "12", icon: FileText, href: "/ascom" },
  { label: "Em Produção", value: "5", icon: Clock },
  { label: "Publicadas (Mês)", value: "28", icon: CheckCircle },
  { label: "Eventos (Mês)", value: "8", icon: Calendar },
];

const quickActions: ModuleQuickAction[] = [
  { label: "Nova Demanda", description: "Solicitar comunicação", href: "/ascom/nova", icon: Send, variant: "default" },
  { label: "Minhas Demandas", description: "Acompanhar solicitações", href: "/ascom/minhas", icon: Clock },
  { label: "Agenda", description: "Eventos programados", href: "/ascom/agenda", icon: Calendar },
  { label: "Galeria", description: "Mídia e imagens", href: "/ascom/galeria", icon: Image },
];

const menuItems: ModuleMenuItem[] = [
  { label: "Gestão de Demandas", href: "/ascom" },
  { label: "Nova Demanda", href: "/ascom/nova" },
  { label: "Eventos", href: "/ascom/eventos" },
  { label: "Galeria de Mídia", href: "/ascom/galeria" },
  { label: "Relatórios", href: "/ascom/relatorios" },
];

export default function ComunicacaoDashboardPage() {
  return (
    <ModuleDashboard
      title="Comunicação"
      description="ASCOM e demandas de comunicação"
      icon={Megaphone}
      color="pink"
      stats={stats}
      quickActions={quickActions}
      menuItems={menuItems}
    />
  );
}
