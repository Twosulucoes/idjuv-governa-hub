/**
 * DASHBOARD - PATRIMÔNIO
 */

import { Package, Building2, Warehouse, QrCode, ClipboardCheck, ArrowRightLeft, FileSearch, AlertTriangle } from "lucide-react";
import { ModuleDashboard, type ModuleStat, type ModuleQuickAction, type ModuleMenuItem } from "@/components/modules";

const stats: ModuleStat[] = [
  { label: "Bens Ativos", value: "1.247", icon: Package, href: "/inventario/bens" },
  { label: "Unidades Locais", value: "12", icon: Building2, href: "/unidades" },
  { label: "Itens Estoque", value: "356", icon: Warehouse, href: "/inventario/almoxarifado" },
  { label: "Pendências", value: "5", icon: AlertTriangle, href: "/inventario/pendencias" },
];

const quickActions: ModuleQuickAction[] = [
  { label: "Novo Bem", description: "Cadastrar patrimônio", href: "/inventario/bens/novo", icon: Package, variant: "default" },
  { label: "Movimentação", description: "Transferir bem", href: "/inventario/movimentacoes", icon: ArrowRightLeft },
  { label: "Inventário", description: "Realizar conferência", href: "/inventario/conferencia", icon: ClipboardCheck },
  { label: "Gerar QR Code", description: "Etiquetas", href: "/inventario/etiquetas", icon: QrCode },
];

const menuItems: ModuleMenuItem[] = [
  { label: "Bens Patrimoniais", href: "/inventario/bens" },
  { label: "Movimentações", href: "/inventario/movimentacoes" },
  { label: "Unidades Locais", href: "/unidades" },
  { label: "Almoxarifado", href: "/inventario/almoxarifado" },
  { label: "Inventário/Conferência", href: "/inventario/conferencia" },
  { label: "Baixas", href: "/inventario/baixas" },
  { label: "Relatórios", href: "/inventario/relatorios" },
];

export default function PatrimonioDashboardPage() {
  return (
    <ModuleDashboard
      title="Patrimônio"
      description="Bens patrimoniais, inventário e almoxarifado"
      icon={Package}
      color="cyan"
      stats={stats}
      quickActions={quickActions}
      menuItems={menuItems}
    />
  );
}
