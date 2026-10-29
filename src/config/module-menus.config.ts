/**
 * CONFIGURAÇÃO DE MENUS POR MÓDULO
 * 
 * Define os itens de navegação específicos de cada módulo
 * 
 * @version 1.0.0
 */

import {
  LayoutDashboard,
  Search,
  Hourglass,
  Users,
  UserCog,
  FileText,
  Calendar,
  CalendarDays,
  Plane,
  Receipt,
  BarChart3,
  AlertTriangle,
  Cake,
  Download,
  Settings,
  Package,
  Boxes,
  TrendingUp,
  ClipboardCheck,
  ClipboardList,
  ListChecks,
  Wrench,
  Trash2,
  ShoppingCart,
  FileCheck,
  Building2,
  Scale,
  Shield,
  Plus,
  Eye,
  Globe,
  Megaphone,
  Trophy,
  School,
  Database,
  HelpCircle,
  Upload,
  Send,
  Workflow,
  Network,
  Landmark,
  type LucideIcon,
  FolderOpen,
  Smartphone,
  ArrowLeftRight,
  Bell,
  Mail,
  History,
  BookOpen,
  Medal,
  Heart,
  Briefcase,
} from "lucide-react";
import type { Modulo } from "@/shared/config/modules.config";
import type { PermissionCode } from "@/types/auth";

export interface ModuleMenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  route: string;
  /** Permissão exigida para mostrar o item (a mesma da rota; sem ela o item aparece para todos do módulo). */
  permission?: PermissionCode;
  /** Como `permission`, mas basta uma da lista (rota com várias permissões aceitas). */
  algumaPermissao?: PermissionCode[];
  children?: ModuleMenuItem[];
}

export interface ModuleMenuConfig {
  dashboard: {
    label: string;
    route: string;
  };
  items: ModuleMenuItem[];
}

// ================================
// MENUS POR MÓDULO
// ================================

export const MODULE_MENUS: Record<Modulo, ModuleMenuConfig> = {
  // RH
  rh: {
    dashboard: { label: "Painel RH", route: "/rh" },
    items: [
      { id: "servidores", label: "Servidores", icon: Users, route: "/rh/servidores" },
      { id: "gestao-lotacao", label: "Gestão de Lotação", icon: Building2, route: "/rh/gestao-lotacao" },
      { id: "designacoes", label: "Designações", icon: UserCog, route: "/rh/designacoes" },
      { id: "comissoes", label: "Comissões", icon: Scale, route: "/rh/comissoes", permission: "rh" },
      { id: "portarias-pendencias", label: "Portarias (Pendências)", icon: FileText, route: "/rh/portarias/pendencias" },
      { 
        id: "frequencia", 
        label: "Frequência", 
        icon: CalendarDays, 
        route: "/rh/frequencia",
        children: [
          { id: "frequencia-gestao", label: "Gestão", icon: CalendarDays, route: "/rh/frequencia" },
          { id: "frequencia-pacotes", label: "Pacotes", icon: FolderOpen, route: "/rh/frequencia/pacotes" },
          { id: "frequencia-validacao", label: "Validação", icon: ClipboardCheck, route: "/rh/frequencia/validacao" },
          { id: "frequencia-config", label: "Parâmetros", icon: Settings, route: "/rh/frequencia/configuracao" },
        ]
      },
      { id: "ferias", label: "Férias", icon: Calendar, route: "/rh/ferias" },
      { id: "licencas", label: "Licenças", icon: FileText, route: "/rh/licencas" },
      { id: "viagens", label: "Viagens", icon: Plane, route: "/rh/viagens" },
      { 
        id: "folha-pagamento", 
        label: "Folha de Pagamento", 
        icon: Receipt, 
        route: "/folha",
        children: [
          { id: "folha-dashboard", label: "Painel", icon: BarChart3, route: "/folha" },
          { id: "folha-fichas", label: "Fichas Financeiras", icon: FileText, route: "/folha/fichas" },
          { id: "folha-rubricas", label: "Rubricas", icon: Settings, route: "/folha/rubricas" },
        ]
      },
      { id: "contracheques", label: "Contracheques", icon: Receipt, route: "/rh/contracheques", permission: "rh.contracheques.visualizar" },
      // Próprio contracheque (só login): para quem não vê mais "Contracheques" (os de outros servidores)
      { id: "meu-contracheque", label: "Meu Contracheque", icon: Receipt, route: "/rh/meu-contracheque" },
      { id: "aniversariantes", label: "Aniversariantes", icon: Cake, route: "/rh/aniversariantes" },
      { id: "pendencias", label: "Pendências", icon: AlertTriangle, route: "/rh/pendencias" },
      { id: "relatorios", label: "Relatórios", icon: BarChart3, route: "/rh/relatorios" },
      { id: "exportar", label: "Exportar", icon: Download, route: "/rh/exportar", permission: "rh.exportar" },
      { id: "auditoria-rh", label: "Trilha de Auditoria", icon: History, route: "/rh/auditoria", permission: "rh.auditoria.visualizar" },
    ],
  },

  // Financeiro
  financeiro: {
    dashboard: { label: "Painel Financeiro", route: "/financeiro" },
    items: [
      { id: "qdd", label: "QDD - Detalhamento", icon: FileText, route: "/financeiro/qdd" },
      { id: "empenhos", label: "Empenhos", icon: FileText, route: "/financeiro/empenhos" },
      // Lançamentos fora do FIPLAN, regularizados depois nele (FIPLAN fechado, tarifas, contas de convênio)
      {
        id: "contingencia",
        label: "Contingência (regularizar no FIPLAN)",
        icon: FileCheck,
        route: "/financeiro/liquidacoes",
        children: [
          { id: "liquidacoes", label: "Liquidações", icon: FileCheck, route: "/financeiro/liquidacoes" },
          { id: "pagamentos", label: "Pagamentos", icon: Receipt, route: "/financeiro/pagamentos" },
        ],
      },
      { id: "favorecidos", label: "Favorecidos", icon: Users, route: "/financeiro/favorecidos", permission: "orcamento.criar" },
      { id: "contas", label: "Contas Bancárias", icon: Building2, route: "/financeiro/contas-bancarias" },
      { id: "conciliacao", label: "Conciliação Bancária", icon: ArrowLeftRight, route: "/financeiro/conciliacao", permission: "pagamento.conciliar" },
      { id: "atualizar", label: "Atualizar dados", icon: Upload, route: "/financeiro/atualizar" },
    ],
  },

  // Compras
  compras: {
    dashboard: { label: "Painel de Compras", route: "/compras" },
    items: [
      // Na ordem do ciclo: planejar (PCA e programação por natureza), contratar (processos) e, por último, o manual.
      { id: "pca", label: "Plano de Contratações (PCA)", icon: ClipboardList, route: "/compras/pca", permission: "compras.pca.visualizar" },
      { id: "pesquisa-precos", label: "Pesquisa de preços", icon: Scale, route: "/compras/pesquisa-precos", algumaPermissao: ["compras.pesquisa_precos.visualizar", "compras.pesquisa_precos.editar"] },
      { id: "programacao-natureza", label: "Programação por natureza", icon: Landmark, route: "/compras/programacao", permission: "compras.processos.visualizar" },
      { id: "processos", label: "Processos de contratação", icon: ShoppingCart, route: "/compras/processos", permission: "compras.processos.visualizar" },
      { id: "guia-compras", label: "Como funciona uma compra", icon: FileText, route: "/processos/compras" },
    ],
  },

  // Contratos
  contratos: {
    dashboard: { label: "Painel de Contratos", route: "/contratos" },
    // Execução, aditivos e avisos de vencimento entram com as entregas C2 a C6 (P21).
    items: [
      { id: "contratos-lista", label: "Contratos", icon: FileCheck, route: "/contratos/lista", algumaPermissao: ["contratos.visualizar", "contratos.criar", "contratos.editar"] },
      { id: "passagens", label: "Passagens aéreas", icon: Plane, route: "/contratos/passagens", permission: "contratos.passagens.visualizar" },
      { id: "passagens-beneficiarios", label: "Beneficiários de passagem", icon: Users, route: "/contratos/passagens/beneficiarios", permission: "contratos.passagens.visualizar" },
      { id: "passagens-pendencias", label: "Pendências de passagens", icon: ClipboardCheck, route: "/contratos/passagens/pendencias", permission: "contratos.passagens.visualizar" },
      { id: "passagens-faturas", label: "Faturas de passagens", icon: Receipt, route: "/contratos/passagens/faturas", permission: "contratos.passagens.visualizar" },
    ],
  },

  // Patrimônio
  patrimonio: {
    dashboard: { label: "Painel de Patrimônio", route: "/inventario" },
    items: [
      { id: "bens", label: "Bens Patrimoniais", icon: Package, route: "/inventario/bens" },
      { id: "cadastro-simplificado", label: "Cadastro Rápido", icon: Plus, route: "/inventario/cadastro-simplificado" },
      { id: "patrimonio-mobile", label: "📱 App Mobile (PWA)", icon: Smartphone, route: "/patrimonio-mobile" },
      { id: "movimentacoes", label: "Movimentações", icon: TrendingUp, route: "/inventario/movimentacoes" },
      { id: "campanhas", label: "Campanhas", icon: ClipboardCheck, route: "/inventario/campanhas" },
      { id: "almoxarifado", label: "Almoxarifado", icon: Boxes, route: "/inventario/almoxarifado" },
      { id: "requisicoes", label: "Requisições", icon: ClipboardList, route: "/inventario/requisicoes" },
      { id: "manutencoes", label: "Manutenções", icon: Wrench, route: "/inventario/manutencoes" },
      { id: "baixas", label: "Baixas", icon: Trash2, route: "/inventario/baixas" },
      { id: "unidades-locais", label: "Unidades Locais", icon: Building2, route: "/unidades", permission: "unidades.visualizar" },
      { id: "relatorios", label: "Relatórios", icon: BarChart3, route: "/inventario/relatorios" },
    ],
  },

  // Governança
  governanca: {
    dashboard: { label: "Painel de Governança", route: "/governanca" },
    items: [
      { id: "organograma", label: "Organograma", icon: Network, route: "/organograma" },
      { id: "estrutura", label: "Estrutura", icon: Building2, route: "/governanca/estrutura" },
      { id: "cargos", label: "Cargos", icon: Users, route: "/cargos" },
      { id: "quadro-vagas", label: "Quadro de Vagas", icon: Users, route: "/cargos/vagas" },
      { id: "federacoes", label: "Federações", icon: Trophy, route: "/admin/federacoes" },
      { id: "instituicoes", label: "Instituições", icon: Landmark, route: "/admin/instituicoes" },
    ],
  },

  // Workflow/Processos: só localizar; a tramitação é no SEI (as telas do workflow
  // seguem abrindo pelo painel, sem atalho no menu)
  workflow: {
    dashboard: { label: "Painel de Processos", route: "/workflow" },
    items: [
      { id: "localizar", label: "Localizar processo", icon: Search, route: "/processos/localizar" },
      { id: "parados", label: "Parados", icon: Hourglass, route: "/processos/localizar?aba=parados" },
    ],
  },

  // Integridade
  integridade: {
    dashboard: { label: "Painel de Integridade", route: "/integridade" },
    items: [
      { id: "denuncias", label: "Canal de Denúncias", icon: AlertTriangle, route: "/integridade/denuncias" },
      { id: "codigo-etica", label: "Código de Ética", icon: BookOpen, route: "/integridade/codigo-etica", permission: "integridade.visualizar" },
      { id: "conflito", label: "Conflito de Interesses", icon: Scale, route: "/integridade/conflito", permission: "integridade.visualizar" },
      { id: "politica", label: "Política de Integridade", icon: Shield, route: "/integridade/politica", permission: "integridade.visualizar" },
    ],
  },

  // Transparência (Gestão Administrativa)
  transparencia: {
    dashboard: { label: "Painel de Transparência", route: "/transparencia/admin" },
    items: [
      { id: "portal", label: "Portal LAI", icon: Globe, route: "/transparencia" },
      { id: "editais", label: "Editais", icon: FileText, route: "/transparencia/editais" },
      { id: "solicitacoes", label: "Solicitações", icon: FileText, route: "/transparencia/lai" },
      { id: "dados", label: "Dados Abertos", icon: Eye, route: "/transparencia/orcamento" },
    ],
  },

  // Comunicação
  comunicacao: {
    dashboard: { label: "Painel ASCOM", route: "/ascom" },
    items: [
      { id: "demandas", label: "Demandas", icon: Megaphone, route: "/ascom/demandas" },
      { id: "nova-demanda", label: "Nova Demanda", icon: FileText, route: "/ascom/demandas/nova" },
      { 
        id: "cms", 
        label: "CMS - Conteúdos", 
        icon: FileText, 
        route: "/ascom/cms/noticias",
        children: [
          { id: "cms-noticias", label: "Notícias", icon: FileText, route: "/ascom/cms/noticias" },
          { id: "cms-galerias", label: "Galerias de Fotos", icon: Eye, route: "/ascom/cms/galerias" },
          { id: "cms-banners", label: "Banners", icon: Megaphone, route: "/ascom/cms/banners" },
        ]
      },
      { id: "aniversariantes", label: "Aniversariantes", icon: Cake, route: "/comunicacao/aniversariantes", permission: "rh.servidores.visualizar" },
      { id: "calendario", label: "Calendário", icon: Calendar, route: "/comunicacao/calendario", permission: "comunicacao.visualizar" },
      { id: "avisos", label: "Avisos e Datas", icon: Bell, route: "/avisos" },
    ],
  },

  // Programas
  programas: {
    dashboard: { label: "Painel de Programas", route: "/programas" },
    items: [
      { id: "bolsa-atleta", label: "Bolsa Atleta", icon: Medal, route: "/programas/bolsa-atleta", permission: "programas.visualizar" },
      { id: "juventude-cidada", label: "Juventude Cidadã", icon: Users, route: "/programas/juventude-cidada", permission: "programas.visualizar" },
      { id: "esporte-comunidade", label: "Esporte na Comunidade", icon: Heart, route: "/programas/esporte-comunidade", permission: "programas.visualizar" },
      { id: "jovem-empreendedor", label: "Jovem Empreendedor", icon: Briefcase, route: "/programas/jovem-empreendedor", permission: "programas.visualizar" },
      { id: "jogos-escolares", label: "Jogos Escolares", icon: School, route: "/programas/jogos-escolares", permission: "programas.visualizar" },
      { 
        id: "selecoes", 
        label: "Seleções Estudantis", 
        icon: Trophy, 
        route: "/programas/selecoes",
        children: [
          { id: "selecoes-hotsite", label: "Hot Site", icon: Globe, route: "/programas/selecoes" },
          { id: "selecoes-inscricoes", label: "Inscrições", icon: Users, route: "/programas/selecoes/admin/inscricoes" },
          { id: "selecoes-config", label: "Configuração", icon: Settings, route: "/programas/selecoes/admin/configuracao" },
          { id: "selecoes-relatorios", label: "Relatórios", icon: BarChart3, route: "/programas/selecoes/admin/relatorios" },
        ]
      },
    ],
  },

  // Gestores Escolares
  gestores_escolares: {
    dashboard: { label: "Painel Gestores", route: "/cadastrogestores/admin" },
    items: [
      { id: "gestores", label: "Gestores", icon: School, route: "/cadastrogestores/admin" },
      { id: "escolas", label: "Escolas", icon: Building2, route: "/cadastrogestores/escolas" },
      { id: "relatorios", label: "Relatórios", icon: BarChart3, route: "/cadastrogestores/relatorios" },
      { id: "auditoria", label: "Auditoria", icon: Shield, route: "/cadastrogestores/auditoria" },
    ],
  },

  // Organizações (Federações, Instituições, Associações)
  organizacoes: {
    dashboard: { label: "Organizações", route: "/admin/federacoes" },
    items: [
      { id: "federacoes", label: "Federações", icon: Trophy, route: "/admin/federacoes" },
      { id: "instituicoes", label: "Instituições", icon: Building2, route: "/admin/instituicoes" },
    ],
  },

  // Gabinete da Presidência
  gabinete: {
    dashboard: { label: "Painel do Gabinete", route: "/gabinete" },
    items: [
      { id: "pre-cadastros", label: "Pré-Cadastros", icon: Users, route: "/gabinete/pre-cadastros" },
      { 
        id: "portarias", 
        label: "Central de Portarias", 
        icon: FileText, 
        route: "/gabinete/portarias",
        children: [
          { id: "portarias-cadastro", label: "Cadastrar Portaria", icon: FileText, route: "/gabinete/portarias" },
          { id: "portarias-consulta", label: "Consultar Portarias", icon: Eye, route: "/gabinete/portarias/consulta" },
        ]
      },
      { id: "ordem-missao", label: "Ordem de Missão", icon: Plane, route: "/formularios/ordem-missao" },
      { id: "relatorio-viagem", label: "Relatório de Viagem", icon: FileCheck, route: "/formularios/relatorio-viagem" },
    ],
  },

  // Admin
  admin: {
    dashboard: { label: "Painel Admin", route: "/admin" },
    items: [
      { id: "usuarios", label: "Usuários", icon: Users, route: "/admin/usuarios" },
      { id: "paginas-publicas", label: "Páginas Públicas", icon: Globe, route: "/admin/paginas", permission: "admin.config" },
      { id: "menu-site", label: "Menu do Site", icon: ListChecks, route: "/admin/menu-site", permission: "admin.config" },
      { id: "auditoria", label: "Auditoria", icon: Shield, route: "/admin/auditoria" },
      { id: "banco-dados", label: "Banco de Dados", icon: Database, route: "/admin/database" },
      { id: "importacoes", label: "Importação de Dados", icon: Upload, route: "/admin/importacoes" },
      { id: "envios", label: "E-mail e WhatsApp", icon: Mail, route: "/admin/envios" },
      { id: "configuracao-cliente", label: "Configuração do Cliente", icon: Building2, route: "/admin/configuracao-cliente" },
      { id: "modulos", label: "Gestão de Módulos", icon: Package, route: "/admin/modulos" },
      { id: "permissoes", label: "Painel de Permissões", icon: Shield, route: "/admin/permissoes" },
      { id: "setores-modulos", label: "Setores dos Módulos", icon: Network, route: "/admin/setores-modulos", permission: "admin.config" },
      { id: "ajuda", label: "Ajuda", icon: HelpCircle, route: "/admin/ajuda" },
    ],
  },

  // Patrimônio Mobile (PWA)
  patrimonio_mobile: {
    dashboard: { label: "App Patrimônio", route: "/patrimonio-mobile" },
    items: [
      { id: "instalar", label: "Instalar App", icon: Smartphone, route: "/instalar" },
    ],
  },

  // Árbitros
  arbitros: {
    dashboard: { label: "Painel de Árbitros", route: "/cadastro-arbitros/admin" },
    items: [
      { id: "arbitros-cadastros", label: "Cadastros", icon: Users, route: "/cadastro-arbitros/admin" },
      { id: "arbitros-relatorios", label: "Relatórios", icon: BarChart3, route: "/cadastro-arbitros/admin?tab=relatorios" },
    ],
  },
};
