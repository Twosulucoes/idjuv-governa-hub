/**
 * CONFIGURAÇÃO DE MENU INSTITUCIONAL
 * 
 * Sistema de navegação baseado exclusivamente no RBAC institucional
 * com permissões no formato: dominio.capacidade
 * 
 * NÃO USAR: roles hardcoded, MODULE_PERMISSIONS, legacyPermissions
 * 
 * @version 3.0.0
 */

import {
  LayoutDashboard,
  Workflow,
  FileText,
  Archive,
  ShoppingCart,
  FileCheck,
  Users,
  UserCog,
  Building2,
  Package,
  Boxes,
  Wallet,
  BarChart3,
  Scale,
  AlertTriangle,
  ClipboardCheck,
  Shield,
  Eye,
  Globe,
  Settings,
  Database,
  HelpCircle,
  Send,
  TrendingUp,
  User,
  MapPin,
  Trophy,
  Megaphone,
  Calendar,
  CalendarDays,
  Plane,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";

// ================================
// TIPOS
// ================================

/**
 * Permissões institucionais no formato: dominio.capacidade
 * Mapeiam diretamente para a tabela public.permissoes
 */
export type PermissaoInstitucional = 
  // Workflow
  | 'workflow.visualizar'
  | 'workflow.criar'
  | 'workflow.tramitar'
  | 'workflow.despachar'
  | 'workflow.aprovar'
  | 'workflow.arquivar'
  // Compras
  | 'compras.visualizar'
  | 'compras.criar'
  | 'compras.tramitar'
  | 'compras.aprovar'
  // Contratos
  | 'contratos.visualizar'
  | 'contratos.criar'
  | 'contratos.tramitar'
  | 'contratos.aprovar'
  // RH
  | 'rh.visualizar'
  | 'rh.criar'
  | 'rh.tramitar'
  | 'rh.aprovar'
  | 'rh.self'
  // Orçamento
  | 'orcamento.visualizar'
  | 'orcamento.criar'
  | 'orcamento.aprovar'
  // Patrimônio
  | 'patrimonio.visualizar'
  | 'patrimonio.criar'
  | 'patrimonio.tramitar'
  // Governança
  | 'governanca.visualizar'
  | 'governanca.aprovar'
  | 'governanca.avaliar'
  // Transparência
  | 'transparencia.visualizar'
  | 'transparencia.responder'
  // Admin
  | 'admin.usuarios'
  | 'admin.perfis'
  | 'admin.auditoria'
  | 'admin.config'
  | 'admin.backup';

export interface MenuItem {
  id: string;
  label: string;
  labelShort?: string;
  icon: LucideIcon;
  route?: string;
  permission?: PermissaoInstitucional;
  children?: MenuItem[];
  badge?: string | number;
  priority?: number; // Menor = maior prioridade (mobile)
}

export interface MenuSection {
  id: string;
  label: string;
  labelShort?: string;
  icon: LucideIcon;
  items: MenuItem[];
  priority?: number;
}

// ================================
// CONFIGURAÇÃO DO MENU
// ================================

export const menuConfig: MenuSection[] = [
  // ========== 1. PROCESSOS ADMINISTRATIVOS ==========
  {
    id: "processos",
    label: "Processos Administrativos",
    labelShort: "Processos",
    icon: Workflow,
    priority: 1,
    items: [
      {
        id: "processos-lista",
        label: "Processos",
        labelShort: "Lista",
        route: "/workflow/processos",
        icon: Workflow,
        permission: "workflow.visualizar",
        priority: 1,
      },
      {
        id: "processos-novo",
        label: "Novo Processo",
        labelShort: "Novo",
        route: "/workflow/processos?acao=novo",
        icon: FileText,
        permission: "workflow.criar",
        priority: 2,
      },
      {
        id: "processos-tramitacao",
        label: "Em Tramitação",
        labelShort: "Tramitação",
        route: "/workflow/processos?status=tramitando",
        icon: Send,
        permission: "workflow.tramitar",
        priority: 3,
      },
      {
        id: "processos-arquivados",
        label: "Arquivados",
        route: "/workflow/processos?status=arquivado",
        icon: Archive,
        permission: "workflow.visualizar",
        priority: 10,
      },
    ],
  },

  // ========== 2. COMPRAS E CONTRATOS ==========
  {
    id: "compras-contratos",
    label: "Compras e Contratos",
    labelShort: "Compras",
    icon: ShoppingCart,
    priority: 2,
    items: [
      {
        id: "compras-submenu",
        label: "Compras",
        icon: ShoppingCart,
        children: [
          {
            id: "licitacoes",
            label: "Licitações",
            route: "/processos/compras",
            icon: ShoppingCart,
            permission: "compras.visualizar",
          },
          {
            id: "nova-licitacao",
            label: "Nova Licitação",
            route: "/processos/compras?acao=novo",
            icon: FileText,
            permission: "compras.criar",
          },
        ],
      },
      {
        id: "contratos-submenu",
        label: "Contratos",
        icon: FileCheck,
        children: [
          {
            id: "contratos-lista",
            label: "Contratos",
            route: "/processos/compras?tab=contratos",
            icon: FileCheck,
            permission: "contratos.visualizar",
          },
          {
            id: "contratos-execucao",
            label: "Execução Contratual",
            route: "/processos/compras?tab=execucao",
            icon: TrendingUp,
            permission: "contratos.tramitar",
          },
        ],
      },
    ],
  },

  // ========== 3. RECURSOS HUMANOS ==========
  {
    id: "rh",
    label: "Recursos Humanos",
    labelShort: "RH",
    icon: Users,
    priority: 3,
    items: [
      {
        id: "servidores",
        label: "Servidores",
        route: "/rh/servidores",
        icon: Users,
        permission: "rh.visualizar",
        priority: 1,
      },
      {
        id: "movimentacoes",
        label: "Movimentações",
        route: "/rh/designacoes",
        icon: UserCog,
        permission: "rh.tramitar",
        priority: 2,
      },
      {
        id: "portarias",
        label: "Portarias",
        route: "/rh/portarias",
        icon: FileText,
        permission: "rh.aprovar",
        priority: 3,
      },
      {
        id: "frequencia",
        label: "Frequência",
        route: "/rh/frequencia",
        icon: CalendarDays,
        permission: "rh.visualizar",
        priority: 4,
      },
      {
        id: "ferias-licencas",
        label: "Férias e Licenças",
        icon: Calendar,
        children: [
          {
            id: "ferias",
            label: "Férias",
            route: "/rh/ferias",
            icon: Calendar,
            permission: "rh.visualizar",
          },
          {
            id: "licencas",
            label: "Licenças",
            route: "/rh/licencas",
            icon: FileText,
            permission: "rh.visualizar",
          },
        ],
      },
      {
        id: "viagens",
        label: "Viagens",
        route: "/rh/viagens",
        icon: Plane,
        permission: "rh.visualizar",
      },
      {
        id: "relatorios-rh",
        label: "Relatórios",
        route: "/rh/relatorios",
        icon: BarChart3,
        permission: "rh.visualizar",
      },
      {
        id: "meus-dados",
        label: "Meus Dados",
        route: "/rh/meus-dados",
        icon: User,
        permission: "rh.self",
        priority: 10,
      },
    ],
  },

  // ========== 4. PATRIMÔNIO E ALMOXARIFADO ==========
  {
    id: "patrimonio",
    label: "Patrimônio e Almoxarifado",
    labelShort: "Patrimônio",
    icon: Package,
    priority: 4,
    items: [
      {
        id: "bens",
        label: "Bens Patrimoniais",
        route: "/processos/patrimonio",
        icon: Package,
        permission: "patrimonio.visualizar",
      },
      {
        id: "movimentacao-bens",
        label: "Movimentações",
        route: "/processos/patrimonio?tab=movimentacoes",
        icon: TrendingUp,
        permission: "patrimonio.tramitar",
      },
      {
        id: "almoxarifado",
        label: "Estoque",
        route: "/processos/almoxarifado",
        icon: Boxes,
        permission: "patrimonio.visualizar",
      },
    ],
  },

  // ========== 5. ORÇAMENTO ==========
  {
    id: "orcamento",
    label: "Orçamento",
    labelShort: "Orçamento",
    icon: Wallet,
    priority: 5,
    items: [
      {
        id: "dotacoes",
        label: "Dotações",
        route: "/transparencia/execucao?tab=dotacao",
        icon: Wallet,
        permission: "orcamento.visualizar",
      },
      {
        id: "execucao-orcamentaria",
        label: "Execução",
        route: "/transparencia/execucao",
        icon: BarChart3,
        permission: "orcamento.visualizar",
      },
    ],
  },

  // ========== 6. GOVERNANÇA E COMPLIANCE ==========
  {
    id: "governanca",
    label: "Governança e Compliance",
    labelShort: "Governança",
    icon: Scale,
    priority: 6,
    items: [
      {
        id: "riscos",
        label: "Gestão de Riscos",
        route: "/governanca/riscos",
        icon: AlertTriangle,
        permission: "governanca.visualizar",
      },
      {
        id: "controles",
        label: "Controles Internos",
        route: "/governanca/controles",
        icon: Shield,
        permission: "governanca.visualizar",
      },
      {
        id: "decisoes",
        label: "Decisões",
        route: "/governanca/decisoes",
        icon: Scale,
        permission: "governanca.aprovar",
      },
      {
        id: "checklists",
        label: "Checklists",
        route: "/governanca/checklists",
        icon: ClipboardCheck,
        permission: "governanca.avaliar",
      },
    ],
  },

  // ========== 7. TRANSPARÊNCIA E LAI ==========
  {
    id: "transparencia",
    label: "Transparência e LAI",
    labelShort: "Transparência",
    icon: Eye,
    priority: 7,
    items: [
      {
        id: "portal",
        label: "Portal da Transparência",
        route: "/transparencia",
        icon: Globe,
        permission: "transparencia.visualizar",
      },
      {
        id: "licitacoes-publicas",
        label: "Licitações",
        route: "/transparencia/licitacoes",
        icon: ShoppingCart,
        permission: "transparencia.visualizar",
      },
      {
        id: "contratos-publicos",
        label: "Contratos",
        route: "/transparencia/contratos",
        icon: FileCheck,
        permission: "transparencia.visualizar",
      },
      {
        id: "lai",
        label: "e-SIC / LAI",
        route: "/transparencia/lai",
        icon: Eye,
        permission: "transparencia.responder",
      },
    ],
  },

  // ========== 8. ESPAÇOS E FEDERAÇÕES ==========
  {
    id: "espacos-federacoes",
    label: "Espaços e Federações",
    labelShort: "Espaços",
    icon: MapPin,
    priority: 8,
    items: [
      {
        id: "unidades-locais",
        label: "Unidades Locais",
        route: "/unidades",
        icon: MapPin,
        permission: "patrimonio.visualizar",
      },
      {
        id: "federacoes",
        label: "Federações Esportivas",
        route: "/admin/federacoes",
        icon: Trophy,
      },
    ],
  },

  // ========== 9. COMUNICAÇÃO (ASCOM) ==========
  {
    id: "ascom",
    label: "Comunicação",
    labelShort: "ASCOM",
    icon: Megaphone,
    priority: 9,
    items: [
      {
        id: "demandas-ascom",
        label: "Demandas",
        route: "/admin/ascom/demandas",
        icon: ClipboardList,
      },
    ],
  },

  // ========== 10. ADMINISTRAÇÃO (RESTRITO) ==========
  {
    id: "admin",
    label: "Administração",
    labelShort: "Admin",
    icon: Settings,
    priority: 10,
    items: [
      {
        id: "central-relatorios",
        label: "Central de Relatórios",
        route: "/admin/central-relatorios",
        icon: BarChart3,
        priority: 1,
      },
      {
        id: "usuarios",
        label: "Usuários",
        route: "/admin/usuarios",
        icon: Users,
        permission: "admin.usuarios",
      },
      {
        id: "perfis",
        label: "Perfis",
        route: "/admin/perfis",
        icon: Shield,
        permission: "admin.perfis",
      },
      {
        id: "reunioes",
        label: "Reuniões",
        route: "/admin/reunioes",
        icon: Calendar,
        permission: "admin.config",
      },
      {
        id: "auditoria",
        label: "Auditoria",
        route: "/admin/auditoria",
        icon: Eye,
        permission: "admin.auditoria",
      },
      {
        id: "configuracoes",
        label: "Configurações",
        route: "/admin/configuracoes",
        icon: Settings,
        permission: "admin.config",
      },
      {
        id: "backup",
        label: "Backup",
        route: "/admin/backup",
        icon: Database,
        permission: "admin.backup",
      },
      {
        id: "ajuda",
        label: "Ajuda",
        route: "/admin/ajuda",
        icon: HelpCircle,
      },
    ],
  },
];

// ================================
// HELPERS
// ================================

/**
 * Dashboard é sempre acessível para usuários autenticados
 */
export const DASHBOARD_ITEM: MenuItem = {
  id: "dashboard",
  label: "Painel",
  labelShort: "Início",
  route: "/admin",
  icon: LayoutDashboard,
  priority: 0,
};

/**
 * Busca um item de menu por ID (recursivo)
 */
export function findMenuItemById(id: string): MenuItem | undefined {
  const searchItems = (items: MenuItem[]): MenuItem | undefined => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = searchItems(item.children);
        if (found) return found;
      }
    }
    return undefined;
  };

  for (const section of menuConfig) {
    const found = searchItems(section.items);
    if (found) return found;
  }

  return undefined;
}

/**
 * Retorna todos os itens com rota (folhas)
 */
export function getAllRouteItems(): MenuItem[] {
  const items: MenuItem[] = [DASHBOARD_ITEM];

  const collectItems = (menuItems: MenuItem[]) => {
    for (const item of menuItems) {
      if (item.route) {
        items.push(item);
      }
      if (item.children) {
        collectItems(item.children);
      }
    }
  };

  for (const section of menuConfig) {
    collectItems(section.items);
  }

  return items;
}
