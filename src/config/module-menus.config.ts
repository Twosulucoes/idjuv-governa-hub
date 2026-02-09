/**
 * CONFIGURAÇÃO DE MENUS POR MÓDULO
 * 
 * Define os itens de navegação específicos de cada módulo
 * 
 * @version 1.0.0
 */

import {
  LayoutDashboard,
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
  Wrench,
  Trash2,
  ShoppingCart,
  FileCheck,
  Wallet,
  Building2,
  Scale,
  Shield,
  Eye,
  Globe,
  Megaphone,
  Trophy,
  School,
  Database,
  HelpCircle,
  Archive,
  Send,
  Workflow,
  Network,
  Landmark,
  type LucideIcon,
  FolderOpen,
} from "lucide-react";
import type { Modulo } from "@/shared/config/modules.config";

export interface ModuleMenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  route: string;
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
      { id: "lotacoes", label: "Lotações (Legado)", icon: Users, route: "/lotacoes" },
      { id: "designacoes", label: "Designações", icon: UserCog, route: "/rh/designacoes" },
      { id: "portarias-pendencias", label: "Portarias (Pendências)", icon: FileText, route: "/rh/portarias/pendencias" },
      { 
        id: "frequencia", 
        label: "Frequência", 
        icon: CalendarDays, 
        route: "/rh/frequencia",
        children: [
          { id: "frequencia-gestao", label: "Gestão", icon: CalendarDays, route: "/rh/frequencia" },
          { id: "frequencia-pacotes", label: "Pacotes", icon: FolderOpen, route: "/rh/frequencia/pacotes" },
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
      { id: "contracheques", label: "Contracheques", icon: Receipt, route: "/rh/contracheques" },
      { id: "aniversariantes", label: "Aniversariantes", icon: Cake, route: "/rh/aniversariantes" },
      { id: "pendencias", label: "Pendências", icon: AlertTriangle, route: "/rh/pendencias" },
      { id: "relatorios", label: "Relatórios", icon: BarChart3, route: "/rh/relatorios" },
      { id: "exportar", label: "Exportar", icon: Download, route: "/rh/exportar" },
    ],
  },

  // Financeiro
  financeiro: {
    dashboard: { label: "Painel Financeiro", route: "/financeiro" },
    items: [
      { id: "orcamento", label: "Orçamento", icon: Wallet, route: "/financeiro/orcamento" },
      { id: "empenhos", label: "Empenhos", icon: FileText, route: "/financeiro/empenhos" },
      { id: "liquidacoes", label: "Liquidações", icon: FileCheck, route: "/financeiro/liquidacoes" },
      { id: "pagamentos", label: "Pagamentos", icon: Receipt, route: "/financeiro/pagamentos" },
      { id: "relatorios", label: "Relatórios", icon: BarChart3, route: "/financeiro/relatorios" },
    ],
  },

  // Compras
  compras: {
    dashboard: { label: "Painel de Compras", route: "/compras" },
    items: [
      { id: "licitacoes", label: "Licitações", icon: ShoppingCart, route: "/processos/compras" },
      { id: "nova-licitacao", label: "Nova Licitação", icon: FileText, route: "/processos/compras?acao=novo" },
      { id: "atas-srp", label: "Atas SRP", icon: FileCheck, route: "/compras/atas" },
      { id: "fornecedores", label: "Fornecedores", icon: Building2, route: "/compras/fornecedores" },
    ],
  },

  // Contratos
  contratos: {
    dashboard: { label: "Painel de Contratos", route: "/contratos" },
    items: [
      { id: "contratos-lista", label: "Contratos", icon: FileCheck, route: "/contratos/lista" },
      { id: "execucao", label: "Execução Contratual", icon: TrendingUp, route: "/contratos/execucao" },
      { id: "aditivos", label: "Aditivos", icon: FileText, route: "/contratos/aditivos" },
      { id: "vencimentos", label: "Vencimentos", icon: AlertTriangle, route: "/contratos/vencimentos" },
    ],
  },

  // Patrimônio
  patrimonio: {
    dashboard: { label: "Painel de Patrimônio", route: "/inventario" },
    items: [
      { id: "bens", label: "Bens Patrimoniais", icon: Package, route: "/inventario/bens" },
      { id: "movimentacoes", label: "Movimentações", icon: TrendingUp, route: "/inventario/movimentacoes" },
      { id: "campanhas", label: "Campanhas", icon: ClipboardCheck, route: "/inventario/campanhas" },
      { id: "almoxarifado", label: "Almoxarifado", icon: Boxes, route: "/inventario/almoxarifado" },
      { id: "requisicoes", label: "Requisições", icon: ClipboardList, route: "/inventario/requisicoes" },
      { id: "manutencoes", label: "Manutenções", icon: Wrench, route: "/inventario/manutencoes" },
      { id: "baixas", label: "Baixas", icon: Trash2, route: "/inventario/baixas" },
      { id: "unidades-locais", label: "Unidades Locais", icon: Building2, route: "/unidades" },
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
      { id: "federacoes", label: "Federações", icon: Trophy, route: "/admin/federacoes" },
      { id: "instituicoes", label: "Instituições", icon: Landmark, route: "/admin/instituicoes" },
      { id: "riscos", label: "Gestão de Riscos", icon: AlertTriangle, route: "/governanca/riscos" },
      { id: "controles", label: "Controles Internos", icon: Shield, route: "/governanca/controles" },
    ],
  },

  // Workflow/Processos
  workflow: {
    dashboard: { label: "Painel de Processos", route: "/workflow" },
    items: [
      { id: "processos", label: "Processos", icon: Workflow, route: "/workflow/processos" },
      { id: "novo", label: "Novo Processo", icon: FileText, route: "/workflow/processos?acao=novo" },
      { id: "tramitacao", label: "Em Tramitação", icon: Send, route: "/workflow/processos?status=tramitando" },
      { id: "arquivados", label: "Arquivados", icon: Archive, route: "/workflow/processos?status=arquivado" },
    ],
  },

  // Integridade
  integridade: {
    dashboard: { label: "Painel de Integridade", route: "/integridade" },
    items: [
      { id: "denuncias", label: "Canal de Denúncias", icon: AlertTriangle, route: "/integridade/denuncias" },
      { id: "etica", label: "Comitê de Ética", icon: Scale, route: "/integridade/etica" },
      { id: "compliance", label: "Compliance", icon: Shield, route: "/integridade/compliance" },
    ],
  },

  // Transparência (Gestão Administrativa)
  transparencia: {
    dashboard: { label: "Painel de Transparência", route: "/transparencia/admin" },
    items: [
      { id: "portal", label: "Portal LAI", icon: Globe, route: "/transparencia" },
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
      { id: "calendario", label: "Calendário", icon: Calendar, route: "/ascom/calendario" },
    ],
  },

  // Programas
  programas: {
    dashboard: { label: "Painel de Programas", route: "/programas" },
    items: [
      { id: "lista", label: "Programas", icon: Trophy, route: "/programas/lista" },
      { id: "acoes", label: "Ações", icon: ClipboardList, route: "/programas/acoes" },
      { id: "beneficiarios", label: "Beneficiários", icon: Users, route: "/programas/beneficiarios" },
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
      { id: "pre-cadastros", label: "Pré-Cadastros", icon: Users, route: "/curriculo/pre-cadastros" },
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
      { id: "workflow-rh", label: "Workflow RH", icon: Workflow, route: "/gabinete/workflow-rh" },
    ],
  },

  // Admin
  admin: {
    dashboard: { label: "Painel Admin", route: "/admin" },
    items: [
      { id: "usuarios", label: "Usuários", icon: Users, route: "/admin/usuarios" },
      { id: "auditoria", label: "Auditoria", icon: Shield, route: "/admin/auditoria" },
      { id: "banco-dados", label: "Banco de Dados", icon: Database, route: "/admin/database" },
      { id: "backup", label: "Backup", icon: Archive, route: "/admin/backup" },
      { id: "ajuda", label: "Ajuda", icon: HelpCircle, route: "/admin/ajuda" },
    ],
  },
};
