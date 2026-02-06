/**
 * CONFIGURAÇÃO CENTRAL DE MÓDULOS
 * 
 * Define todos os módulos do sistema e suas rotas associadas.
 * Usado para controle de acesso baseado em módulos (pasta = permissão).
 * 
 * @version 1.1.0
 */

import {
  Settings,
  Users,
  GitBranch,
  ShoppingCart,
  FileText,
  DollarSign,
  Package,
  Building2,
  Eye,
  Megaphone,
  type LucideIcon,
} from 'lucide-react';

// ================================
// TIPOS
// ================================

export const MODULOS = [
  'admin',
  'rh',
  'workflow',
  'compras',
  'contratos',
  'financeiro',
  'patrimonio',
  'governanca',
  'transparencia',
  'comunicacao',
] as const;

export type Modulo = typeof MODULOS[number];

export interface ModuleConfig {
  codigo: Modulo;
  nome: string;
  descricao: string;
  icone: LucideIcon;
  cor: string;
  rotas: string[];
  menuSectionIds: string[];
}

// ================================
// CONFIGURAÇÃO DOS MÓDULOS
// ================================

export const MODULES_CONFIG: ModuleConfig[] = [
  {
    codigo: 'admin',
    nome: 'Administração',
    descricao: 'Usuários, perfis, auditoria, reuniões',
    icone: Settings,
    cor: 'slate',
    rotas: ['/admin'],
    menuSectionIds: ['admin'],
  },
  {
    codigo: 'rh',
    nome: 'Recursos Humanos',
    descricao: 'Servidores, frequência, férias, portarias, folha',
    icone: Users,
    cor: 'blue',
    rotas: ['/rh', '/folha', '/curriculo'],
    menuSectionIds: ['rh'],
  },
  {
    codigo: 'workflow',
    nome: 'Processos',
    descricao: 'Tramitação de processos administrativos',
    icone: GitBranch,
    cor: 'purple',
    rotas: ['/workflow'],
    menuSectionIds: ['processos'],
  },
  {
    codigo: 'compras',
    nome: 'Compras',
    descricao: 'Licitações e processos de aquisição',
    icone: ShoppingCart,
    cor: 'orange',
    rotas: ['/processos/compras', '/processos/diarias', '/processos/convenios', '/processos/veiculos'],
    menuSectionIds: ['compras-contratos'],
  },
  {
    codigo: 'contratos',
    nome: 'Contratos',
    descricao: 'Gestão e execução contratual',
    icone: FileText,
    cor: 'amber',
    rotas: ['/contratos'],
    menuSectionIds: ['compras-contratos'],
  },
  {
    codigo: 'financeiro',
    nome: 'Financeiro',
    descricao: 'Orçamento, empenhos, pagamentos',
    icone: DollarSign,
    cor: 'green',
    rotas: ['/financeiro', '/processos/pagamentos'],
    menuSectionIds: ['financeiro'],
  },
  {
    codigo: 'patrimonio',
    nome: 'Patrimônio',
    descricao: 'Bens, inventário, almoxarifado, unidades',
    icone: Package,
    cor: 'cyan',
    rotas: ['/inventario', '/unidades', '/processos/patrimonio', '/processos/almoxarifado'],
    menuSectionIds: ['inventario', 'espacos-federacoes'],
  },
  {
    codigo: 'governanca',
    nome: 'Governança',
    descricao: 'Estrutura, organograma, cargos, federações, programas',
    icone: Building2,
    cor: 'indigo',
    rotas: ['/governanca', '/organograma', '/cargos', '/lotacoes', '/federacoes', '/instituicoes', '/programas', '/integridade'],
    menuSectionIds: ['governanca'],
  },
  {
    codigo: 'transparencia',
    nome: 'Transparência',
    descricao: 'Portal LAI e dados públicos',
    icone: Eye,
    cor: 'teal',
    rotas: ['/transparencia'],
    menuSectionIds: ['transparencia'],
  },
  {
    codigo: 'comunicacao',
    nome: 'Comunicação',
    descricao: 'ASCOM e demandas de comunicação',
    icone: Megaphone,
    cor: 'pink',
    rotas: ['/ascom'],
    menuSectionIds: ['ascom'],
  },
];

// ================================
// HELPERS
// ================================

/**
 * Encontra o módulo que corresponde a uma rota
 */
export function findModuleByRoute(pathname: string): ModuleConfig | undefined {
  return MODULES_CONFIG.find(m => 
    m.rotas.some(r => pathname === r || pathname.startsWith(r + '/'))
  );
}

/**
 * Obtém módulo por código
 */
export function getModuleByCode(codigo: Modulo): ModuleConfig | undefined {
  return MODULES_CONFIG.find(m => m.codigo === codigo);
}

/**
 * Obtém lista de códigos de todos os módulos
 */
export function getAllModuleCodes(): Modulo[] {
  return [...MODULOS];
}

/**
 * Mapeamento de cor para classes Tailwind
 */
export const MODULO_COR_CLASSES: Record<string, string> = {
  slate: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200',
  green: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-200',
  orange: 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-200',
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-200',
  indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-200',
  cyan: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-800 dark:text-cyan-200',
  teal: 'bg-teal-100 text-teal-800 dark:bg-teal-800 dark:text-teal-200',
  pink: 'bg-pink-100 text-pink-800 dark:bg-pink-800 dark:text-pink-200',
};

/**
 * Obtém a classe de cor para um módulo
 */
export function getModuloCorClass(cor: string | null): string {
  return MODULO_COR_CLASSES[cor || 'slate'] || MODULO_COR_CLASSES.slate;
}

/**
 * Verifica se uma seção do menu pertence a algum módulo
 * Retorna o primeiro módulo encontrado ou null
 */
export function getModuleForMenuSection(sectionId: string): Modulo | null {
  const config = MODULES_CONFIG.find(m => m.menuSectionIds.includes(sectionId));
  return config?.codigo || null;
}