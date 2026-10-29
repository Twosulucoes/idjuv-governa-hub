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
  Search,
  Hourglass,
  FileText,
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
  Upload,
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
  ListChecks,
  Link2,
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
  History,
  type LucideIcon,
  Bell,
  Mail,
  ArrowLeftRight,
  Handshake,
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
  | 'compras.pca.visualizar'
  | 'compras.pesquisa_precos.visualizar'
  | 'compras.pesquisa_precos.editar'
  | 'compras.processos.visualizar'
  | 'compras.processos.editar'
  // Contratos
  | 'contratos.visualizar'
  | 'contratos.criar'
  | 'contratos.editar'
  | 'contratos.tramitar'
  | 'contratos.aprovar'
  | 'contratos.passagens.visualizar'
  | 'contratos.passagens.editar'
  | 'contratos.passagens.financeiro'
  // RH
  // Código sem ponto = o módulo (hasPermission confere user_modules): para itens cuja rota pede só requiredModule
  | 'rh'
  | 'rh.visualizar'
  | 'rh.criar'
  | 'rh.tramitar'
  | 'rh.aprovar'
  | 'rh.frequencia.lancar'
  | 'rh.frequencia.configurar'
  | 'rh.viagens.visualizar'
  | 'rh.relatorios.visualizar'
  | 'rh.auditoria.visualizar'
  | 'rh.exportar'
  | 'rh.contracheques.visualizar'
  | 'rh.self'
  // Folha (módulo rh; códigos do catálogo, ver docs/RBAC_PERMISSOES.md)
  | 'financeiro.folha.visualizar'
  | 'financeiro.folha.processar'
  | 'financeiro.folha.configurar'
  // Orçamento
  | 'orcamento.visualizar'
  | 'orcamento.criar'
  | 'orcamento.aprovar'
  | 'orcamento.importar'
  | 'financeiro.convenios.visualizar'
  | 'pagamento.conciliar'
  // Gabinete
  | 'gabinete.portarias.importar'
  // Patrimônio
  | 'patrimonio.visualizar'
  | 'patrimonio.criar'
  | 'patrimonio.editar'
  | 'patrimonio.tramitar'
  // Unidades locais
  | 'unidades.visualizar'
  | 'unidades.relatorios.visualizar'
  // Governança
  | 'governanca.visualizar'
  | 'governanca.aprovar'
  | 'governanca.avaliar'
  | 'governanca.cargos.visualizar'
  | 'governanca.relatorios.visualizar'
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
  | 'comunicacao.visualizar'
  | 'ascom.gerenciar'
  | 'rh.servidores.visualizar'
  | 'admin.backup'
  | 'admin.envios'
  | 'admin.configuracao_cliente';

export interface MenuItem {
  id: string;
  label: string;
  labelShort?: string;
  icon: LucideIcon;
  route?: string;
  permission?: PermissaoInstitucional;
  /** Alternativa a `permission`: o item aparece para quem tem qualquer uma destas. */
  permissions?: PermissaoInstitucional[];
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
    label: "Processos SEI",
    labelShort: "Processos",
    icon: Workflow,
    priority: 1,
    items: [
      {
        id: "processos-localizar",
        label: "Localizar processo",
        labelShort: "Localizar",
        route: "/processos/localizar",
        icon: Search,
        priority: 0,
      },
      {
        id: "processos-parados",
        label: "Parados",
        route: "/processos/localizar?aba=parados",
        icon: Hourglass,
        priority: 0,
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
            id: "pca",
            label: "Plano de Contratações (PCA)",
            route: "/compras/pca",
            icon: ClipboardList,
            permission: "compras.pca.visualizar",
          },
          {
            id: "pesquisa-precos",
            label: "Pesquisa de preços",
            route: "/compras/pesquisa-precos",
            icon: Scale,
            permission: "compras.pesquisa_precos.visualizar",
          },
          {
            id: "programacao-natureza",
            label: "Programação por natureza",
            route: "/compras/programacao",
            icon: Landmark,
            permission: "compras.processos.visualizar",
          },
          {
            id: "licitacoes",
            label: "Processos de contratação",
            route: "/compras/processos",
            icon: ShoppingCart,
            permission: "compras.processos.visualizar",
          },
          {
            id: "nova-licitacao",
            label: "Novo processo",
            route: "/compras/processos?novo=1",
            icon: FileText,
            permission: "compras.processos.editar",
          },
          {
            id: "guia-compras",
            label: "Como funciona uma compra",
            route: "/processos/compras",
            icon: BookOpen,
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
            route: "/contratos/lista",
            icon: FileCheck,
            permissions: ["contratos.visualizar", "contratos.criar", "contratos.editar"],
          },
          {
            id: "contratos-novo",
            label: "Novo contrato",
            route: "/contratos/lista?novo=1",
            icon: FileText,
            permission: "contratos.criar",
          },
          {
            id: "passagens",
            label: "Passagens aéreas",
            route: "/contratos/passagens",
            icon: Plane,
            permissions: ["contratos.passagens.visualizar", "contratos.passagens.editar"],
          },
          {
            id: "passagens-pendencias",
            label: "Pendências de passagens",
            route: "/contratos/passagens/pendencias",
            icon: ClipboardCheck,
            permissions: ["contratos.passagens.visualizar", "contratos.passagens.editar"],
          },
          {
            id: "passagens-faturas",
            label: "Faturas de passagens",
            route: "/contratos/passagens/faturas",
            icon: Receipt,
            permissions: ["contratos.passagens.visualizar", "contratos.passagens.editar", "contratos.passagens.financeiro"],
          },
          {
            id: "passagens-novo",
            label: "Novo pedido de passagem",
            route: "/contratos/passagens?novo=1",
            icon: FileText,
            permission: "contratos.passagens.editar",
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
        label: "Gestão de Lotação",
        route: "/rh/gestao-lotacao",
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
        id: "comissoes",
        label: "Comissões",
        route: "/rh/comissoes",
        icon: Scale,
        // Mesma exigência da rota (requiredModule="rh" em /rh/comissoes no App.tsx): o módulo rh
        permission: "rh",
        priority: 2.5,
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
            id: "frequencia-validacao",
            label: "Validação e Fechamento",
            labelShort: "Validação",
            route: "/rh/frequencia/validacao",
            icon: ClipboardCheck,
            permissions: ["rh.aprovar", "rh.frequencia.lancar"],
          },
          {
            id: "frequencia-config",
            label: "Parametrização",
            labelShort: "Parâmetros",
            route: "/rh/frequencia/configuracao",
            icon: Settings,
            permission: "rh.frequencia.configurar",
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
        permission: "rh.viagens.visualizar",
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
            permission: "financeiro.folha.visualizar",
          },
          {
            id: "folha-fichas",
            label: "Fichas Financeiras",
            route: "/folha/fichas",
            icon: FileText,
            permission: "financeiro.folha.visualizar",
          },
          {
            id: "folha-rubricas",
            label: "Rubricas",
            route: "/folha/rubricas",
            icon: Settings,
            permission: "financeiro.folha.configurar",
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
            permission: "rh.contracheques.visualizar",
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
            permission: "rh.exportar",
          },
        ],
      },
      {
        id: "relatorios-rh",
        label: "Relatórios",
        route: "/rh/relatorios",
        icon: BarChart3,
        permission: "rh.relatorios.visualizar",
      },
      {
        id: "auditoria-rh",
        label: "Trilha de Auditoria",
        labelShort: "Auditoria",
        route: "/rh/auditoria",
        icon: History,
        permission: "rh.auditoria.visualizar",
      },
      {
        id: "meus-dados",
        label: "Meus Dados",
        route: "/rh/meus-dados",
        icon: User,
        permission: "rh.self",
        priority: 10,
      },
      {
        id: "minha-frequencia",
        label: "Minha Frequência",
        route: "/rh/minha-frequencia",
        icon: CalendarDays,
        permission: "rh.self",
        priority: 11,
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
        permission: "patrimonio.visualizar",
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
        permission: "patrimonio.visualizar",
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
        // Orçamento: resumo e dotações ficam no QDD (fonte: FIPLAN)
        id: "fin-qdd",
        label: "QDD - Detalhamento",
        labelShort: "QDD",
        route: "/financeiro/qdd",
        icon: FileText,
        permission: "orcamento.visualizar",
        priority: 2,
      },
      {
        // Empenhos do FIPLAN (FIP 614); o "Novo empenho" fica para a contingência
        id: "fin-empenhos",
        label: "Empenhos",
        route: "/financeiro/empenhos",
        icon: FileCheck,
        permission: "orcamento.criar",
        priority: 3,
      },
      {
        // Lançamentos fora do FIPLAN (FIPLAN fechado de janeiro a abril, tarifas, contas de convênio),
        // regularizados depois no FIPLAN; os pagamentos saem pela remessa OBN600 da Conciliação
        id: "fin-contingencia-submenu",
        label: "Contingência (regularizar no FIPLAN)",
        labelShort: "Contingência",
        icon: ClipboardCheck,
        priority: 4,
        children: [
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
        // Espelho do Transferegov (só leitura), atualizado todo dia
        id: "fin-convenios",
        label: "Convênios federais",
        labelShort: "Convênios",
        route: "/financeiro/convenios",
        icon: Handshake,
        permission: "financeiro.convenios.visualizar",
        priority: 4,
      },
      {
        id: "fin-favorecidos",
        label: "Favorecidos",
        route: "/financeiro/favorecidos",
        icon: Users,
        permission: "orcamento.criar",
        priority: 5,
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
        id: "fin-conciliacao",
        label: "Conciliação Bancária",
        labelShort: "Conciliação",
        route: "/financeiro/conciliacao",
        icon: ArrowLeftRight,
        permission: "pagamento.conciliar",
        priority: 5,
      },
      {
        id: "fin-atualizar",
        label: "Atualizar dados",
        labelShort: "Atualizar",
        route: "/financeiro/atualizar",
        icon: Upload,
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
          {
            id: "quadro-vagas",
            label: "Quadro de Vagas",
            route: "/cargos/vagas",
            icon: Briefcase,
            permission: "governanca.cargos.visualizar",
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
        id: "relatorio-governanca",
        label: "Relatórios",
        route: "/governanca/relatorio",
        icon: BarChart3,
        permission: "governanca.relatorios.visualizar",
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
      {
        id: "editais",
        label: "Editais",
        route: "/transparencia/editais",
        icon: FileText,
        permission: "transparencia.visualizar",
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
        permission: "unidades.visualizar",
      },
      {
        id: "relatorios-unidades",
        label: "Relatórios Unidades",
        labelShort: "Relatórios",
        route: "/unidades/central-relatorios",
        icon: BarChart3,
        permission: "unidades.relatorios.visualizar",
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
        route: "/gabinete/pre-cadastros",
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
        id: "calendario-comunicacao",
        label: "Calendário",
        route: "/comunicacao/calendario",
        icon: Calendar,
        permission: "comunicacao.visualizar",
      },
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
        permissions: ["rh.servidores.visualizar", "ascom.gerenciar"],
      },
      {
        id: "avisos-datas",
        label: "Avisos e Datas",
        route: "/avisos",
        icon: Bell,
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

  // ========== 13.5. ÁRBITROS ==========
  {
    id: "arbitros",
    label: "Árbitros",
    labelShort: "Árbitros",
    icon: Gavel,
    priority: 13.5,
    items: [
      {
        id: "arbitros-admin",
        label: "Painel de Árbitros",
        route: "/cadastro-arbitros/admin",
        icon: ClipboardList,
      },
      {
        id: "arbitros-cadastros",
        label: "Cadastros",
        route: "/cadastro-arbitros/admin?tab=cadastros",
        icon: Users,
      },
      {
        id: "arbitros-relatorios",
        label: "Relatórios",
        route: "/cadastro-arbitros/admin?tab=relatorios",
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
        id: "setores-modulos",
        label: "Setores dos Módulos",
        labelShort: "Setores",
        route: "/admin/setores-modulos",
        icon: Network,
        permission: "admin.config",
      },
      {
        id: "paginas-publicas",
        label: "Páginas Públicas",
        route: "/admin/paginas",
        icon: Globe,
        permission: "admin.config",
      },
      {
        id: "menu-site",
        label: "Menu do Site",
        route: "/admin/menu-site",
        icon: ListChecks,
        permission: "admin.config",
      },
      {
        id: "links-uteis",
        label: "Links Úteis",
        route: "/admin/links-uteis",
        icon: Link2,
        permission: "admin.config",
      },
      {
        id: "config-campos-precadastro",
        label: "Campos Pré-Cadastro",
        route: "/admin/config-campos-precadastro",
        icon: Settings,
        permission: "admin.usuarios",
      },
      {
        id: "importacoes",
        label: "Importação de Dados",
        route: "/admin/importacoes",
        icon: Upload,
        // Qualquer permissão de importador (mesma lista de PERMISSOES_IMPORTACAO em src/lib/importacao/registro.ts)
        permissions: ["orcamento.importar", "pagamento.conciliar", "gabinete.portarias.importar", "financeiro.folha.processar", "compras.processos.editar", "contratos.criar"],
      },
      {
        id: "envios",
        label: "E-mail e WhatsApp",
        route: "/admin/envios",
        icon: Mail,
        permission: "admin.envios",
      },
      {
        id: "configuracao-cliente",
        label: "Configuração do Cliente",
        route: "/admin/configuracao-cliente",
        icon: Building2,
        permission: "admin.configuracao_cliente",
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
