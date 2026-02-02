/**
 * CONFIGURAÇÃO DE NAVEGAÇÃO INSTITUCIONAL
 * 
 * Estrutura hierárquica governamental baseada em SEI/e-Processo
 * Organizada por FUNÇÃO ADMINISTRATIVA, não por tabela
 * 
 * @version 2.0.0
 * @author Sistema IDJUV
 */

import {
  LayoutDashboard,
  Workflow,
  FileText,
  Archive,
  ShoppingCart,
  FileCheck,
  DollarSign,
  Users,
  UserCog,
  Calendar,
  Clock,
  Plane,
  Building2,
  Package,
  Boxes,
  Wallet,
  BarChart3,
  TrendingUp,
  CreditCard,
  Scale,
  AlertTriangle,
  ClipboardCheck,
  Shield,
  FileSearch,
  Eye,
  Globe,
  Landmark,
  Settings,
  UserPlus,
  Database,
  BookOpen,
  HelpCircle,
  Award,
  Network,
  Megaphone,
  Video,
  Send,
  MessageSquare,
  Handshake,
  Car,
  Briefcase,
  MapPin,
  FileSpreadsheet,
  type LucideIcon,
} from "lucide-react";

// ================================
// TIPOS
// ================================

export interface NavItem {
  id: string;
  label: string;
  labelShort?: string; // Label curto para mobile
  href?: string;
  icon: LucideIcon;
  children?: NavItem[];
  permissao?: string; // Código de permissão RBAC
  badge?: number | string;
  priority?: number; // Menor número = maior prioridade (para mobile)
  hideOnMobile?: boolean; // Ocultar do primeiro nível mobile
}

export interface NavSection {
  id: string;
  label: string;
  labelShort?: string;
  icon: LucideIcon;
  items: NavItem[];
  priority?: number;
  permissao?: string;
}

// ================================
// MAPEAMENTO DE PERMISSÕES
// ================================

export const NAV_PERMISSAO_MAP: Record<string, string> = {
  // Dashboard
  'dashboard': 'admin.dashboard.visualizar',
  
  // Processos
  'gestao-processos': 'workflow.visualizar',
  'meus-processos': 'workflow.visualizar',
  'tramitacao': 'workflow.tramitar',
  'arquivados': 'workflow.visualizar',
  
  // Compras & Contratos
  'licitacoes': 'processos.compras.visualizar',
  'contratos': 'processos.compras.visualizar',
  'execucao-contratual': 'processos.compras.visualizar',
  'empenhos': 'processos.pagamentos.visualizar',
  
  // RH
  'servidores': 'rh.servidores.visualizar',
  'movimentacoes': 'rh.servidores.visualizar',
  'ferias-licencas': 'rh.ferias.visualizar',
  'folha': 'folha.gestao.visualizar',
  'frequencia': 'rh.frequencia.visualizar',
  'designacoes': 'rh.designacoes.visualizar',
  'portarias-rh': 'rh.portarias.visualizar',
  
  // Patrimônio
  'bens': 'processos.patrimonio.visualizar',
  'movimentacao-bens': 'processos.patrimonio.visualizar',
  'almoxarifado': 'processos.almoxarifado.visualizar',
  'estoque': 'processos.almoxarifado.visualizar',
  
  // Orçamento
  'dotacao': 'transparencia.execucao.visualizar',
  'creditos': 'transparencia.execucao.visualizar',
  'execucao-orcamentaria': 'transparencia.execucao.visualizar',
  
  // Governança
  'matriz-raci': 'governanca.raci.visualizar',
  'gestao-riscos': 'governanca.riscos.visualizar',
  'controles-internos': 'governanca.controles.visualizar',
  'checklists': 'governanca.controles.visualizar',
  'decisoes': 'governanca.decisoes.visualizar',
  'pareceres': 'governanca.pareceres.visualizar',
  'lei-criacao': 'governanca.lei.visualizar',
  'decreto': 'governanca.decreto.visualizar',
  'regimento': 'governanca.regimento.visualizar',
  'portarias-gov': 'governanca.portarias.visualizar',
  
  // Transparência
  'portal-transparencia': 'transparencia.portal.visualizar',
  'licitacoes-publicas': 'transparencia.licitacoes.visualizar',
  'contratos-publicos': 'transparencia.contratos.visualizar',
  'patrimonio-publico': 'transparencia.patrimonio.visualizar',
  'esic-lai': 'transparencia.lai.visualizar',
  'cargos-remuneracao': 'transparencia.cargos.visualizar',
  
  // Admin
  'usuarios': 'admin.usuarios.visualizar',
  'perfis': 'admin.perfis.visualizar',
  'parametros': 'admin.parametros.visualizar',
  'debitos-tecnicos': 'admin.debitos.visualizar',
  'auditoria': 'admin.auditoria.visualizar',
  'backup': 'admin.backup.visualizar',
  'database': 'admin.database.visualizar',
  
  // Programas
  'federacoes': 'programas.federacoes.visualizar',
  'bolsa-atleta': 'programas.bolsa.visualizar',
  
  // Estrutura
  'organograma': 'estrutura.organograma.visualizar',
  'cargos': 'estrutura.cargos.visualizar',
  'lotacoes': 'estrutura.lotacoes.visualizar',
  'unidades': 'unidades.gestao.visualizar',
  
  // ASCOM
  'demandas-ascom': 'ascom.demandas.visualizar',
  
  // Reuniões
  'reunioes': 'admin.reunioes.visualizar',
};

// ================================
// ESTRUTURA DE NAVEGAÇÃO
// ================================

export const navigationConfig: NavSection[] = [
  // ========== PROCESSOS ==========
  {
    id: "processos",
    label: "Processos",
    labelShort: "Processos",
    icon: Workflow,
    priority: 1,
    items: [
      {
        id: "gestao-processos",
        label: "Processos Administrativos",
        labelShort: "Processos",
        href: "/workflow/processos",
        icon: Workflow,
        permissao: "workflow.visualizar",
        priority: 1,
      },
      {
        id: "meus-processos",
        label: "Meus Processos",
        labelShort: "Meus",
        href: "/workflow/processos?filtro=meus",
        icon: FileText,
        permissao: "workflow.visualizar",
        priority: 2,
      },
      {
        id: "tramitacao",
        label: "Em Tramitação",
        labelShort: "Tramitação",
        href: "/workflow/processos?status=tramitando",
        icon: Send,
        permissao: "workflow.tramitar",
        priority: 3,
      },
      {
        id: "arquivados",
        label: "Arquivados",
        href: "/workflow/processos?status=arquivado",
        icon: Archive,
        permissao: "workflow.visualizar",
        priority: 10,
        hideOnMobile: true,
      },
    ],
  },

  // ========== COMPRAS & CONTRATOS ==========
  {
    id: "compras",
    label: "Compras & Contratos",
    labelShort: "Compras",
    icon: ShoppingCart,
    priority: 2,
    items: [
      {
        id: "licitacoes",
        label: "Licitações",
        href: "/processos/compras",
        icon: ShoppingCart,
        permissao: "processos.compras.visualizar",
        priority: 1,
      },
      {
        id: "contratos",
        label: "Contratos",
        href: "/processos/compras?tab=contratos",
        icon: FileCheck,
        permissao: "processos.compras.visualizar",
        priority: 2,
      },
      {
        id: "execucao-contratual",
        label: "Execução Contratual",
        href: "/processos/compras?tab=execucao",
        icon: ClipboardCheck,
        permissao: "processos.compras.visualizar",
        hideOnMobile: true,
      },
      {
        id: "empenhos",
        label: "Empenhos / Liquidações / Pagamentos",
        labelShort: "Pagamentos",
        href: "/processos/pagamentos",
        icon: DollarSign,
        permissao: "processos.pagamentos.visualizar",
        priority: 3,
      },
    ],
  },

  // ========== RECURSOS HUMANOS ==========
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
        href: "/rh/servidores",
        icon: Users,
        permissao: "rh.servidores.visualizar",
        priority: 1,
      },
      {
        id: "movimentacoes",
        label: "Movimentações Funcionais",
        labelShort: "Movimentações",
        icon: UserCog,
        permissao: "rh.servidores.visualizar",
        children: [
          {
            id: "designacoes",
            label: "Designações",
            href: "/rh/designacoes",
            icon: MapPin,
            permissao: "rh.designacoes.visualizar",
          },
          {
            id: "lotacoes",
            label: "Lotações",
            href: "/lotacoes",
            icon: Building2,
            permissao: "estrutura.lotacoes.visualizar",
          },
          {
            id: "portarias-rh",
            label: "Central de Portarias",
            href: "/rh/portarias",
            icon: FileSpreadsheet,
            permissao: "rh.portarias.visualizar",
          },
        ],
      },
      {
        id: "ferias-licencas",
        label: "Férias e Licenças",
        labelShort: "Férias",
        icon: Calendar,
        children: [
          {
            id: "ferias",
            label: "Férias",
            href: "/rh/ferias",
            icon: Calendar,
            permissao: "rh.ferias.visualizar",
          },
          {
            id: "licencas",
            label: "Licenças",
            href: "/rh/licencas",
            icon: Clock,
            permissao: "rh.licencas.visualizar",
          },
        ],
      },
      {
        id: "frequencia",
        label: "Frequência",
        icon: Clock,
        children: [
          {
            id: "gestao-frequencia",
            label: "Gestão de Frequência",
            href: "/rh/frequencia",
            icon: Clock,
            permissao: "rh.frequencia.visualizar",
          },
          {
            id: "pacotes-frequencia",
            label: "Controle de Pacotes",
            href: "/rh/frequencia/pacotes",
            icon: Package,
            permissao: "rh.frequencia.visualizar",
          },
          {
            id: "config-frequencia",
            label: "Configuração",
            href: "/rh/frequencia/configuracao",
            icon: Settings,
            permissao: "rh.frequencia.configurar",
          },
        ],
      },
      {
        id: "viagens",
        label: "Viagens e Diárias",
        labelShort: "Viagens",
        href: "/rh/viagens",
        icon: Plane,
        permissao: "rh.viagens.visualizar",
        hideOnMobile: true,
      },
      {
        id: "folha",
        label: "Folha de Pagamento",
        labelShort: "Folha",
        href: "/folha/bloqueada",
        icon: Wallet,
        permissao: "folha.gestao.visualizar",
        badge: "Bloqueada",
        hideOnMobile: true,
      },
    ],
  },

  // ========== PATRIMÔNIO & ALMOXARIFADO ==========
  {
    id: "patrimonio",
    label: "Patrimônio & Almoxarifado",
    labelShort: "Patrimônio",
    icon: Package,
    priority: 5,
    items: [
      {
        id: "bens",
        label: "Bens Patrimoniais",
        href: "/processos/patrimonio",
        icon: Package,
        permissao: "processos.patrimonio.visualizar",
      },
      {
        id: "movimentacao-bens",
        label: "Movimentações de Bens",
        href: "/processos/patrimonio?tab=movimentacoes",
        icon: TrendingUp,
        permissao: "processos.patrimonio.visualizar",
        hideOnMobile: true,
      },
      {
        id: "almoxarifado",
        label: "Almoxarifado",
        href: "/processos/almoxarifado",
        icon: Boxes,
        permissao: "processos.almoxarifado.visualizar",
      },
      {
        id: "estoque",
        label: "Estoque",
        href: "/processos/almoxarifado?tab=estoque",
        icon: Package,
        permissao: "processos.almoxarifado.visualizar",
        hideOnMobile: true,
      },
    ],
  },

  // ========== ORÇAMENTO ==========
  {
    id: "orcamento",
    label: "Orçamento",
    labelShort: "Orçamento",
    icon: Wallet,
    priority: 6,
    items: [
      {
        id: "dotacao",
        label: "Dotação Orçamentária",
        href: "/transparencia/execucao?tab=dotacao",
        icon: CreditCard,
        permissao: "transparencia.execucao.visualizar",
      },
      {
        id: "creditos",
        label: "Créditos Adicionais",
        href: "/transparencia/execucao?tab=creditos",
        icon: TrendingUp,
        permissao: "transparencia.execucao.visualizar",
        hideOnMobile: true,
      },
      {
        id: "execucao-orcamentaria",
        label: "Execução Orçamentária",
        href: "/transparencia/execucao",
        icon: BarChart3,
        permissao: "transparencia.execucao.visualizar",
      },
    ],
  },

  // ========== GOVERNANÇA & COMPLIANCE ==========
  {
    id: "governanca",
    label: "Governança & Compliance",
    labelShort: "Governança",
    icon: Scale,
    priority: 7,
    items: [
      {
        id: "documentos-legais",
        label: "Documentos Legais",
        icon: FileText,
        children: [
          {
            id: "lei-criacao",
            label: "Lei de Criação",
            href: "/governanca/lei-criacao",
            icon: FileText,
            permissao: "governanca.lei.visualizar",
          },
          {
            id: "decreto",
            label: "Decreto Regulamentador",
            href: "/governanca/decreto",
            icon: FileCheck,
            permissao: "governanca.decreto.visualizar",
          },
          {
            id: "regimento",
            label: "Regimento Interno",
            href: "/governanca/regimento",
            icon: BookOpen,
            permissao: "governanca.regimento.visualizar",
          },
          {
            id: "portarias-gov",
            label: "Portarias",
            href: "/governanca/portarias",
            icon: FileSpreadsheet,
            permissao: "governanca.portarias.visualizar",
          },
        ],
      },
      {
        id: "matriz-raci",
        label: "Matriz RACI",
        href: "/governanca/matriz-raci",
        icon: BarChart3,
        permissao: "governanca.raci.visualizar",
      },
      {
        id: "gestao-riscos",
        label: "Gestão de Riscos",
        href: "/governanca/riscos",
        icon: AlertTriangle,
        permissao: "governanca.riscos.visualizar",
      },
      {
        id: "controles-internos",
        label: "Controles Internos",
        href: "/governanca/controles",
        icon: Shield,
        permissao: "governanca.controles.visualizar",
        hideOnMobile: true,
      },
      {
        id: "checklists",
        label: "Checklists TCE / TCU / CGU",
        labelShort: "Checklists",
        href: "/governanca/checklists",
        icon: ClipboardCheck,
        permissao: "governanca.controles.visualizar",
        hideOnMobile: true,
      },
    ],
  },

  // ========== TRANSPARÊNCIA & LAI ==========
  {
    id: "transparencia",
    label: "Transparência & LAI",
    labelShort: "Transparência",
    icon: Globe,
    priority: 8,
    items: [
      {
        id: "portal-transparencia",
        label: "Portal da Transparência",
        href: "/transparencia",
        icon: Globe,
        permissao: "transparencia.portal.visualizar",
      },
      {
        id: "licitacoes-publicas",
        label: "Licitações Públicas",
        href: "/transparencia/licitacoes",
        icon: ShoppingCart,
        permissao: "transparencia.licitacoes.visualizar",
      },
      {
        id: "contratos-publicos",
        label: "Contratos Públicos",
        href: "/transparencia/contratos",
        icon: FileCheck,
        permissao: "transparencia.contratos.visualizar",
        hideOnMobile: true,
      },
      {
        id: "execucao-publica",
        label: "Execução Orçamentária",
        href: "/transparencia/execucao",
        icon: BarChart3,
        permissao: "transparencia.execucao.visualizar",
        hideOnMobile: true,
      },
      {
        id: "patrimonio-publico",
        label: "Patrimônio Público",
        href: "/transparencia/patrimonio",
        icon: Landmark,
        permissao: "transparencia.patrimonio.visualizar",
        hideOnMobile: true,
      },
      {
        id: "cargos-remuneracao",
        label: "Cargos e Remuneração",
        href: "/transparencia/cargos",
        icon: DollarSign,
        permissao: "transparencia.cargos.visualizar",
      },
      {
        id: "esic-lai",
        label: "e-SIC / LAI",
        href: "/transparencia/lai",
        icon: FileSearch,
        permissao: "transparencia.lai.visualizar",
      },
    ],
  },

  // ========== PROGRAMAS ==========
  {
    id: "programas",
    label: "Programas",
    labelShort: "Programas",
    icon: Award,
    priority: 9,
    items: [
      {
        id: "federacoes",
        label: "Federações Esportivas",
        href: "/admin/federacoes",
        icon: Award,
        permissao: "programas.federacoes.visualizar",
      },
      {
        id: "bolsa-atleta",
        label: "Bolsa Atleta",
        href: "/programas/bolsa-atleta",
        icon: Award,
        permissao: "programas.bolsa.visualizar",
      },
      {
        id: "juventude-cidada",
        label: "Juventude Cidadã",
        href: "/programas/juventude-cidada",
        icon: Users,
        permissao: "programas.juventude.visualizar",
        hideOnMobile: true,
      },
      {
        id: "esporte-comunidade",
        label: "Esporte na Comunidade",
        href: "/programas/esporte-comunidade",
        icon: Award,
        permissao: "programas.esporte.visualizar",
        hideOnMobile: true,
      },
    ],
  },

  // ========== ESTRUTURA ORGANIZACIONAL ==========
  {
    id: "estrutura",
    label: "Estrutura Organizacional",
    labelShort: "Estrutura",
    icon: Network,
    priority: 10,
    items: [
      {
        id: "organograma",
        label: "Organograma",
        href: "/organograma",
        icon: Network,
        permissao: "estrutura.organograma.visualizar",
      },
      {
        id: "gestao-organograma",
        label: "Gestão do Organograma",
        href: "/organograma/gestao",
        icon: Settings,
        permissao: "estrutura.organograma.editar",
        hideOnMobile: true,
      },
      {
        id: "cargos",
        label: "Cargos",
        href: "/cargos",
        icon: Briefcase,
        permissao: "estrutura.cargos.visualizar",
      },
      {
        id: "unidades-locais",
        label: "Unidades Locais",
        icon: Building2,
        children: [
          {
            id: "gestao-unidades",
            label: "Gestão de Unidades",
            href: "/unidades",
            icon: Building2,
            permissao: "unidades.gestao.visualizar",
          },
          {
            id: "relatorios-unidades",
            label: "Relatórios de Unidades",
            href: "/unidades/relatorios",
            icon: BarChart3,
            permissao: "unidades.relatorios.visualizar",
          },
          {
            id: "cedencia-unidades",
            label: "Cedências e Termos",
            href: "/unidades/cedencia",
            icon: FileText,
            permissao: "unidades.cedencia.visualizar",
          },
        ],
      },
    ],
  },

  // ========== COMUNICAÇÃO ==========
  {
    id: "comunicacao",
    label: "Comunicação",
    labelShort: "Comunicação",
    icon: Megaphone,
    priority: 11,
    items: [
      {
        id: "demandas-ascom",
        label: "Gestão de Demandas ASCOM",
        labelShort: "ASCOM",
        href: "/admin/ascom/demandas",
        icon: Megaphone,
        permissao: "ascom.demandas.visualizar",
      },
      {
        id: "reunioes",
        label: "Reuniões",
        href: "/admin/reunioes",
        icon: Video,
        permissao: "admin.reunioes.visualizar",
      },
      {
        id: "pre-cadastros",
        label: "Pré-Cadastros",
        href: "/admin/pre-cadastros",
        icon: UserPlus,
        permissao: "rh.precadastros.visualizar",
        hideOnMobile: true,
      },
    ],
  },

  // ========== ADMINISTRAÇÃO DO SISTEMA ==========
  {
    id: "admin",
    label: "Administração do Sistema",
    labelShort: "Admin",
    icon: Settings,
    priority: 20,
    items: [
      {
        id: "usuarios",
        label: "Usuários",
        icon: Users,
        children: [
          {
            id: "gerenciar-usuarios",
            label: "Gerenciar Usuários",
            href: "/admin/usuarios",
            icon: Users,
            permissao: "admin.usuarios.visualizar",
          },
          {
            id: "usuarios-tecnicos",
            label: "Usuários Técnicos",
            href: "/admin/usuarios-tecnicos",
            icon: Settings,
            permissao: "admin.usuarios.tecnicos",
          },
        ],
      },
      {
        id: "perfis",
        label: "Perfis e Permissões",
        href: "/admin/perfis",
        icon: Shield,
        permissao: "admin.perfis.visualizar",
      },
      {
        id: "aprovacoes",
        label: "Central de Aprovações",
        href: "/admin/aprovacoes",
        icon: FileCheck,
        permissao: "admin.aprovacoes.visualizar",
      },
      {
        id: "auditoria",
        label: "Auditoria / Logs",
        href: "/admin/auditoria",
        icon: Eye,
        permissao: "admin.auditoria.visualizar",
      },
      {
        id: "database",
        label: "Banco de Dados",
        href: "/admin/database",
        icon: Database,
        permissao: "admin.database.visualizar",
        hideOnMobile: true,
      },
      {
        id: "backup",
        label: "Backup Offsite",
        href: "/admin/backup",
        icon: Database,
        permissao: "admin.backup.visualizar",
        hideOnMobile: true,
      },
      {
        id: "disaster-recovery",
        label: "Disaster Recovery",
        href: "/admin/disaster-recovery",
        icon: Shield,
        permissao: "admin.disaster.visualizar",
        hideOnMobile: true,
      },
      {
        id: "ajuda",
        label: "Ajuda",
        href: "/admin/ajuda",
        icon: HelpCircle,
        permissao: "admin.ajuda.visualizar",
      },
    ],
  },
];

// ================================
// HELPERS
// ================================

/**
 * Obtém breadcrumb para uma rota
 */
export function getBreadcrumbForPath(path: string): Array<{ label: string; href?: string }> {
  const breadcrumb: Array<{ label: string; href?: string }> = [
    { label: "Sistema", href: "/admin" },
  ];

  const findPath = (
    items: NavItem[],
    sectionLabel: string,
    parentPath: Array<{ label: string; href?: string }>
  ): boolean => {
    for (const item of items) {
      const itemHref = item.href?.split('?')[0]; // Remove query params
      if (itemHref === path) {
        breadcrumb.push(...parentPath);
        breadcrumb.push({ label: item.label });
        return true;
      }
      if (item.children) {
        const newPath = item.href
          ? [...parentPath, { label: item.label, href: item.href }]
          : [...parentPath, { label: item.label }];
        if (findPath(item.children, sectionLabel, newPath)) {
          return true;
        }
      }
    }
    return false;
  };

  for (const section of navigationConfig) {
    if (findPath(section.items, section.label, [{ label: section.label }])) {
      break;
    }
  }

  return breadcrumb;
}

/**
 * Obtém todos os itens para busca
 */
export function getAllSearchableItems(): Array<{
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  section: string;
  keywords: string[];
}> {
  const items: Array<{
    id: string;
    label: string;
    href: string;
    icon: LucideIcon;
    section: string;
    keywords: string[];
  }> = [];

  const processItem = (item: NavItem, section: string) => {
    if (item.href) {
      items.push({
        id: item.id,
        label: item.label,
        href: item.href.split('?')[0],
        icon: item.icon,
        section,
        keywords: [item.label.toLowerCase(), item.labelShort?.toLowerCase() || ''],
      });
    }
    if (item.children) {
      item.children.forEach((child) => processItem(child, section));
    }
  };

  navigationConfig.forEach((section) => {
    section.items.forEach((item) => {
      processItem(item, section.label);
    });
  });

  return items;
}

/**
 * Filtra itens para exibição mobile (prioridade)
 */
export function getMobileNavItems(sections: NavSection[]): NavItem[] {
  const allItems: NavItem[] = [];
  
  sections.forEach(section => {
    section.items.forEach(item => {
      if (!item.hideOnMobile && item.href) {
        allItems.push(item);
      }
      if (item.children) {
        item.children.forEach(child => {
          if (!child.hideOnMobile && child.href) {
            allItems.push(child);
          }
        });
      }
    });
  });

  return allItems
    .filter(item => item.priority && item.priority <= 5)
    .sort((a, b) => (a.priority || 99) - (b.priority || 99))
    .slice(0, 6);
}
