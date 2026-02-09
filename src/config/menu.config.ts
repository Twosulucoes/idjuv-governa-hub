/**
 * CONFIGURAÇÃO DE MENU INSTITUCIONAL
 * 
 * Sistema de navegação baseado exclusivamente no RBAC institucional
 * com permissões no formato: dominio.capacidade
 * 
 * @version 4.0.0 - Reorganizado com todos os módulos
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
  Wrench,
  Trash2,
  BookOpen,
  GraduationCap,
  Users2,
  Heart,
  Briefcase,
  School,
  Medal,
  FileWarning,
  ScrollText,
  Landmark,
  Network,
  Cake,
  Receipt,
  FolderOpen,
  Download,
  Gavel,
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
  // Integridade
  | 'integridade.visualizar'
  | 'integridade.gerenciar'
  // Programas
  | 'programas.visualizar'
  | 'programas.gerenciar'
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
  priority?: number;
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
        id: "lotacoes",
        label: "Lotações",
        route: "/lotacoes",
        icon: Users2,
        permission: "rh.visualizar",
        priority: 1.5,
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
        id: "frequencia-submenu",
        label: "Frequência",
        icon: CalendarDays,
        priority: 4,
        children: [
          {
            id: "frequencia",
            label: "Gestão de Frequência",
            route: "/rh/frequencia",
            icon: CalendarDays,
            permission: "rh.visualizar",
          },
          {
            id: "frequencia-pacotes",
            label: "Pacotes de Frequência",
            route: "/rh/frequencia/pacotes",
            icon: FolderOpen,
            permission: "rh.visualizar",
          },
          {
            id: "frequencia-config",
            label: "Parametrização",
            labelShort: "Parâmetros",
            route: "/rh/frequencia/configuracao",
            icon: Settings,
            permission: "rh.aprovar",
          },
        ],
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
        id: "folha-pagamento",
        label: "Folha de Pagamento",
        icon: Receipt,
        children: [
          {
            id: "folha-dashboard",
            label: "Painel da Folha",
            route: "/folha",
            icon: BarChart3,
            permission: "rh.aprovar",
          },
          {
            id: "folha-fichas",
            label: "Fichas Financeiras",
            route: "/folha/fichas",
            icon: FileText,
            permission: "rh.aprovar",
          },
          {
            id: "folha-rubricas",
            label: "Rubricas",
            route: "/folha/rubricas",
            icon: Settings,
            permission: "rh.aprovar",
          },
        ],
      },
      {
        id: "contracheques-submenu",
        label: "Contracheques",
        icon: Receipt,
        children: [
          {
            id: "meu-contracheque",
            label: "Meu Contracheque",
            route: "/rh/meu-contracheque",
            icon: Receipt,
            permission: "rh.self",
          },
          {
            id: "contracheques",
            label: "Consultar Contracheques",
            route: "/rh/contracheques",
            icon: Receipt,
            permission: "rh.visualizar",
          },
        ],
      },
      {
        id: "utilitarios-rh",
        label: "Utilitários",
        icon: Wrench,
        children: [
          {
            id: "aniversariantes",
            label: "Aniversariantes",
            route: "/rh/aniversariantes",
            icon: Cake,
            permission: "rh.visualizar",
          },
          {
            id: "pendencias-rh",
            label: "Diagnóstico de Pendências",
            labelShort: "Pendências",
            route: "/rh/pendencias",
            icon: AlertTriangle,
            permission: "rh.visualizar",
          },
          {
            id: "modelos-docs",
            label: "Modelos de Documentos",
            labelShort: "Modelos",
            route: "/rh/modelos",
            icon: FileText,
            permission: "rh.visualizar",
          },
          {
            id: "exportar-planilha",
            label: "Exportar Planilha",
            route: "/rh/exportar",
            icon: Download,
            permission: "rh.visualizar",
          },
        ],
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

  // ========== 4. INVENTÁRIO E PATRIMÔNIO ==========
  {
    id: "inventario",
    label: "Inventário e Patrimônio",
    labelShort: "Inventário",
    icon: Package,
    priority: 4,
    items: [
      {
        id: "inv-dashboard",
        label: "Painel",
        route: "/inventario",
        icon: BarChart3,
        permission: "patrimonio.visualizar",
        priority: 1,
      },
      {
        id: "bens",
        label: "Bens Patrimoniais",
        route: "/inventario/bens",
        icon: Package,
        permission: "patrimonio.visualizar",
        priority: 2,
      },
      {
        id: "movimentacao-bens",
        label: "Movimentações",
        route: "/inventario/movimentacoes",
        icon: TrendingUp,
        permission: "patrimonio.tramitar",
        priority: 3,
      },
      {
        id: "campanhas-inventario",
        label: "Campanhas",
        route: "/inventario/campanhas",
        icon: ClipboardCheck,
        permission: "patrimonio.visualizar",
        priority: 4,
      },
      {
        id: "almoxarifado",
        label: "Almoxarifado",
        route: "/inventario/almoxarifado",
        icon: Boxes,
        permission: "patrimonio.visualizar",
        priority: 5,
      },
      {
        id: "requisicoes-material",
        label: "Requisições",
        route: "/inventario/requisicoes",
        icon: ClipboardList,
        permission: "patrimonio.visualizar",
        priority: 6,
      },
      {
        id: "manutencoes-bens",
        label: "Manutenções",
        route: "/inventario/manutencoes",
        icon: Wrench,
        permission: "patrimonio.visualizar",
        priority: 7,
      },
      {
        id: "baixas-patrimonio",
        label: "Baixas",
        route: "/inventario/baixas",
        icon: Trash2,
        permission: "patrimonio.criar",
        priority: 8,
      },
    ],
  },

  // ========== 5. FINANCEIRO (ERP) ==========
  {
    id: "financeiro",
    label: "Financeiro",
    labelShort: "Financeiro",
    icon: Wallet,
    priority: 5,
    items: [
      {
        id: "fin-dashboard",
        label: "Painel Financeiro",
        labelShort: "Painel",
        route: "/financeiro",
        icon: BarChart3,
        permission: "orcamento.visualizar",
        priority: 1,
      },
      {
        id: "fin-orcamento",
        label: "Orçamento",
        route: "/financeiro/orcamento",
        icon: Wallet,
        permission: "orcamento.visualizar",
        priority: 2,
      },
      {
        id: "fin-despesas-submenu",
        label: "Despesas",
        icon: FileText,
        priority: 3,
        children: [
          {
            id: "fin-solicitacoes",
            label: "Solicitações",
            route: "/financeiro/solicitacoes",
            icon: FileText,
            permission: "orcamento.visualizar",
          },
          {
            id: "fin-empenhos",
            label: "Empenhos",
            route: "/financeiro/empenhos",
            icon: FileCheck,
            permission: "orcamento.criar",
          },
          {
            id: "fin-liquidacoes",
            label: "Liquidações",
            route: "/financeiro/liquidacoes",
            icon: ClipboardCheck,
            permission: "orcamento.criar",
          },
          {
            id: "fin-pagamentos",
            label: "Pagamentos",
            route: "/financeiro/pagamentos",
            icon: Send,
            permission: "orcamento.aprovar",
          },
        ],
      },
      {
        id: "fin-adiantamentos",
        label: "Adiantamentos",
        route: "/financeiro/adiantamentos",
        icon: Wallet,
        permission: "orcamento.visualizar",
        priority: 4,
      },
      {
        id: "fin-contas",
        label: "Contas Bancárias",
        labelShort: "Contas",
        route: "/financeiro/contas-bancarias",
        icon: Building2,
        permission: "orcamento.aprovar",
        priority: 5,
      },
      {
        id: "fin-relatorios",
        label: "Relatórios",
        route: "/financeiro/relatorios",
        icon: BarChart3,
        permission: "orcamento.visualizar",
        priority: 10,
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
        id: "estrutura-submenu",
        label: "Estrutura Organizacional",
        labelShort: "Estrutura",
        icon: Building2,
        children: [
          {
            id: "organograma",
            label: "Organograma",
            route: "/organograma",
            icon: Network,
            permission: "governanca.visualizar",
          },
          {
            id: "estrutura-org",
            label: "Gestão da Estrutura",
            route: "/governanca/estrutura",
            icon: Building2,
            permission: "governanca.visualizar",
          },
          {
            id: "cargos",
            label: "Cargos",
            route: "/cargos",
            icon: Briefcase,
            permission: "governanca.visualizar",
          },
        ],
      },
      {
        id: "documentos-legais",
        label: "Documentos Legais",
        icon: Gavel,
        children: [
          {
            id: "lei-criacao",
            label: "Lei de Criação",
            route: "/governanca/lei-criacao",
            icon: ScrollText,
            permission: "governanca.visualizar",
          },
          {
            id: "decreto",
            label: "Decreto",
            route: "/governanca/decreto",
            icon: ScrollText,
            permission: "governanca.visualizar",
          },
          {
            id: "regimento",
            label: "Regimento Interno",
            route: "/governanca/regimento",
            icon: BookOpen,
            permission: "governanca.visualizar",
          },
          {
            id: "portarias-gov",
            label: "Portarias",
            route: "/governanca/portarias",
            icon: FileText,
            permission: "governanca.visualizar",
          },
        ],
      },
      {
        id: "matriz-raci",
        label: "Matriz RACI",
        route: "/governanca/matriz-raci",
        icon: ClipboardList,
        permission: "governanca.visualizar",
      },
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
      {
        id: "relatorio-governanca",
        label: "Relatórios",
        route: "/governanca/relatorio",
        icon: BarChart3,
        permission: "governanca.visualizar",
      },
    ],
  },

  // ========== 7. INTEGRIDADE ==========
  {
    id: "integridade",
    label: "Integridade",
    labelShort: "Integridade",
    icon: Shield,
    priority: 7,
    items: [
      {
        id: "integridade-portal",
        label: "Portal de Integridade",
        route: "/integridade",
        icon: Shield,
        permission: "integridade.visualizar",
      },
      {
        id: "denuncias",
        label: "Denúncias",
        route: "/integridade/denuncias",
        icon: FileWarning,
        permission: "integridade.visualizar",
      },
      {
        id: "gestao-denuncias",
        label: "Gestão de Denúncias",
        route: "/integridade/gestao-denuncias",
        icon: ClipboardList,
        permission: "integridade.gerenciar",
      },
      {
        id: "codigo-etica",
        label: "Código de Ética",
        route: "/integridade/codigo-etica",
        icon: BookOpen,
        permission: "integridade.visualizar",
      },
      {
        id: "conflito-interesses",
        label: "Conflito de Interesses",
        route: "/integridade/conflito",
        icon: AlertTriangle,
        permission: "integridade.visualizar",
      },
      {
        id: "politica-integridade",
        label: "Política de Integridade",
        route: "/integridade/politica",
        icon: ScrollText,
        permission: "integridade.visualizar",
      },
    ],
  },

  // ========== 8. TRANSPARÊNCIA E LAI ==========
  {
    id: "transparencia",
    label: "Transparência e LAI",
    labelShort: "Transparência",
    icon: Eye,
    priority: 8,
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
        id: "orcamento-publico",
        label: "Execução Orçamentária",
        route: "/transparencia/orcamento",
        icon: Wallet,
        permission: "transparencia.visualizar",
      },
      {
        id: "patrimonio-publico",
        label: "Patrimônio",
        route: "/transparencia/patrimonio",
        icon: Package,
        permission: "transparencia.visualizar",
      },
      {
        id: "cargos-remuneracao",
        label: "Cargos e Remuneração",
        route: "/transparencia/cargos",
        icon: Users,
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

  // ========== 9. ESPAÇOS E FEDERAÇÕES ==========
  {
    id: "espacos-federacoes",
    label: "Espaços e Federações",
    labelShort: "Espaços",
    icon: MapPin,
    priority: 9,
    items: [
      {
        id: "unidades-locais",
        label: "Unidades Locais",
        route: "/unidades",
        icon: MapPin,
        permission: "patrimonio.visualizar",
      },
      {
        id: "relatorios-unidades",
        label: "Relatórios Unidades",
        labelShort: "Relatórios",
        route: "/unidades/central-relatorios",
        icon: BarChart3,
        permission: "patrimonio.visualizar",
      },
      {
        id: "federacoes",
        label: "Federações Esportivas",
        route: "/admin/federacoes",
        icon: Trophy,
      },
      {
        id: "instituicoes",
        label: "Instituições",
        route: "/admin/instituicoes",
        icon: Building2,
      },
    ],
  },

  // ========== 10. PROGRAMAS ==========
  {
    id: "programas",
    label: "Programas",
    labelShort: "Programas",
    icon: GraduationCap,
    priority: 10,
    items: [
      {
        id: "bolsa-atleta",
        label: "Bolsa Atleta",
        route: "/programas/bolsa-atleta",
        icon: Medal,
        permission: "programas.visualizar",
      },
      {
        id: "juventude-cidada",
        label: "Juventude Cidadã",
        route: "/programas/juventude-cidada",
        icon: Users2,
        permission: "programas.visualizar",
      },
      {
        id: "esporte-comunidade",
        label: "Esporte na Comunidade",
        route: "/programas/esporte-comunidade",
        icon: Heart,
        permission: "programas.visualizar",
      },
      {
        id: "jovem-empreendedor",
        label: "Jovem Empreendedor",
        route: "/programas/jovem-empreendedor",
        icon: Briefcase,
        permission: "programas.visualizar",
      },
      {
        id: "jogos-escolares",
        label: "Jogos Escolares",
        route: "/programas/jogos-escolares",
        icon: School,
        permission: "programas.visualizar",
      },
    ],
  },

  // ========== 11. GABINETE ==========
  {
    id: "gabinete",
    label: "Gabinete da Presidência",
    labelShort: "Gabinete",
    icon: Landmark,
    priority: 11,
    items: [
      {
        id: "gab-pre-cadastros",
        label: "Pré-Cadastros",
        route: "/curriculo/pre-cadastros",
        icon: Users,
      },
      {
        id: "gab-portarias",
        label: "Central de Portarias",
        icon: FileText,
        children: [
          {
            id: "portarias-cadastro",
            label: "Cadastrar Portaria",
            route: "/gabinete/portarias",
            icon: FileText,
          },
          {
            id: "portarias-consulta",
            label: "Consultar Portarias",
            route: "/gabinete/portarias/consulta",
            icon: Eye,
          },
        ],
      },
      {
        id: "gab-ordem-missao",
        label: "Ordem de Missão",
        route: "/formularios/ordem-missao",
        icon: Plane,
      },
      {
        id: "gab-relatorio-viagem",
        label: "Relatório de Viagem",
        route: "/formularios/relatorio-viagem",
        icon: FileCheck,
      },
      {
        id: "gab-workflow-rh",
        label: "Workflow RH",
        route: "/gabinete/workflow-rh",
        icon: Workflow,
      },
    ],
  },

  // ========== 12. COMUNICAÇÃO (ASCOM) ==========
  {
    id: "ascom",
    label: "Comunicação",
    labelShort: "ASCOM",
    icon: Megaphone,
    priority: 12,
    items: [
      {
        id: "demandas-ascom",
        label: "Demandas",
        route: "/ascom/demandas",
        icon: ClipboardList,
      },
      {
        id: "aniversariantes-ascom",
        label: "Aniversariantes",
        route: "/comunicacao/aniversariantes",
        icon: Cake,
      },
    ],
  },

  // ========== 13. GESTORES ESCOLARES ==========
  {
    id: "gestores-escolares",
    label: "Gestores Escolares",
    labelShort: "JER",
    icon: School,
    priority: 13,
    items: [
      {
        id: "ger-gestores",
        label: "Gestores",
        route: "/cadastrogestores/admin",
        icon: School,
      },
      {
        id: "ger-escolas",
        label: "Escolas",
        route: "/cadastrogestores/escolas",
        icon: Building2,
      },
      {
        id: "ger-relatorios",
        label: "Relatórios",
        route: "/cadastrogestores/relatorios",
        icon: BarChart3,
      },
    ],
  },

  // ========== 14. ADMINISTRAÇÃO (RESTRITO) ==========
  {
    id: "admin",
    label: "Administração",
    labelShort: "Admin",
    icon: Settings,
    priority: 14,
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
        priority: 2,
      },
      {
        id: "perfis",
        label: "Perfis",
        route: "/admin/perfis",
        icon: Shield,
        permission: "admin.perfis",
      },
      {
        id: "pre-cadastros",
        label: "Pré-Cadastros",
        route: "/admin/pre-cadastros",
        icon: UserCog,
        permission: "admin.usuarios",
      },
      {
        id: "gestores-escolares-admin",
        label: "Gestores Escolares",
        labelShort: "JER",
        route: "/cadastrogestores/admin",
        icon: School,
        permission: "admin.usuarios",
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
        id: "paginas-publicas",
        label: "Páginas Públicas",
        route: "/admin/paginas",
        icon: Globe,
        // Visível para todos os admins
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
