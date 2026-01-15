// ================================================================
// TIPOS PARA SISTEMA AVANÇADO DE RELATÓRIOS
// ================================================================

// Tipos de relatório disponíveis
export type TipoRelatorio = 
  | 'portarias'
  | 'servidores'
  | 'cargos_vagas';

// Campos disponíveis por tipo de relatório
export interface CampoRelatorio {
  id: string;
  label: string;
  tipo: 'texto' | 'numero' | 'data' | 'badge' | 'lista';
  obrigatorio?: boolean;
  largura?: 'pequena' | 'media' | 'grande' | 'auto';
  formatador?: string; // nome de função formatadora
  agrupavel?: boolean; // pode ser usado para agrupar
}

// Definição de agrupamento
export interface NivelAgrupamento {
  campo: string;
  ordem: 'asc' | 'desc';
  mostrarSubtotal?: boolean;
  mostrarContagem?: boolean;
}

// Configuração completa de um relatório
export interface ConfiguracaoRelatorio {
  // Identificação
  id?: string;
  nome: string;
  descricao?: string;
  tipo: TipoRelatorio;
  
  // Aparência
  titulo: string;
  subtitulo?: string;
  incluirLogos: boolean;
  orientacao: 'retrato' | 'paisagem';
  
  // Campos
  camposSelecionados: string[];
  
  // Agrupamentos (até 3 níveis)
  agrupamentos: NivelAgrupamento[];
  
  // Ordenação
  ordenacao: {
    campo: string;
    direcao: 'asc' | 'desc';
  };
  
  // Filtros
  filtros: Record<string, string | string[] | { inicio?: string; fim?: string }>;
  
  // Opções
  mostrarTotais: boolean;
  mostrarResumo: boolean;
  mostrarGraficos?: boolean;
  
  // Metadados
  criadoEm?: string;
  atualizadoEm?: string;
}

// ================================================================
// CAMPOS DISPONÍVEIS POR TIPO DE RELATÓRIO
// ================================================================

export const CAMPOS_PORTARIAS: CampoRelatorio[] = [
  { id: 'numero', label: 'Número', tipo: 'texto', obrigatorio: true, largura: 'pequena' },
  { id: 'titulo', label: 'Título', tipo: 'texto', largura: 'grande' },
  { id: 'categoria', label: 'Categoria', tipo: 'badge', agrupavel: true, largura: 'media' },
  { id: 'status', label: 'Status', tipo: 'badge', agrupavel: true, largura: 'media' },
  { id: 'data_documento', label: 'Data', tipo: 'data', largura: 'pequena' },
  { id: 'ementa', label: 'Ementa', tipo: 'texto', largura: 'grande' },
  { id: 'servidores_count', label: 'Qtd. Servidores', tipo: 'numero', largura: 'pequena' },
  { id: 'unidade_nome', label: 'Unidade', tipo: 'texto', agrupavel: true, largura: 'media' },
  { id: 'cargo_nome', label: 'Cargo', tipo: 'texto', agrupavel: true, largura: 'media' },
  { id: 'doe_numero', label: 'DOE Nº', tipo: 'texto', largura: 'pequena' },
  { id: 'doe_data', label: 'Data DOE', tipo: 'data', largura: 'pequena' },
  { id: 'data_vigencia_inicio', label: 'Vigência Início', tipo: 'data', largura: 'pequena' },
  { id: 'data_vigencia_fim', label: 'Vigência Fim', tipo: 'data', largura: 'pequena' },
  { id: 'mes_ano', label: 'Mês/Ano', tipo: 'texto', agrupavel: true, largura: 'pequena' },
];

export const CAMPOS_SERVIDORES: CampoRelatorio[] = [
  { id: 'matricula', label: 'Matrícula', tipo: 'texto', largura: 'pequena' },
  { id: 'nome_completo', label: 'Nome', tipo: 'texto', obrigatorio: true, largura: 'grande' },
  { id: 'cpf', label: 'CPF', tipo: 'texto', largura: 'media' },
  { id: 'tipo_servidor', label: 'Tipo Servidor', tipo: 'badge', agrupavel: true, largura: 'media' },
  { id: 'situacao', label: 'Situação', tipo: 'badge', agrupavel: true, largura: 'pequena' },
  { id: 'cargo_nome', label: 'Cargo', tipo: 'texto', agrupavel: true, largura: 'media' },
  { id: 'cargo_sigla', label: 'Sigla Cargo', tipo: 'texto', largura: 'pequena' },
  { id: 'unidade_nome', label: 'Unidade', tipo: 'texto', agrupavel: true, largura: 'media' },
  { id: 'unidade_sigla', label: 'Sigla Unidade', tipo: 'texto', largura: 'pequena' },
  { id: 'data_nomeacao', label: 'Data Nomeação', tipo: 'data', largura: 'pequena' },
  { id: 'data_posse', label: 'Data Posse', tipo: 'data', largura: 'pequena' },
  { id: 'email_institucional', label: 'E-mail', tipo: 'texto', largura: 'media' },
  { id: 'telefone_celular', label: 'Telefone', tipo: 'texto', largura: 'pequena' },
  { id: 'lotacao_inicio', label: 'Lotação Desde', tipo: 'data', largura: 'pequena' },
  { id: 'provimento_status', label: 'Status Provimento', tipo: 'badge', agrupavel: true, largura: 'pequena' },
];

export const CAMPOS_CARGOS: CampoRelatorio[] = [
  { id: 'nome', label: 'Nome do Cargo', tipo: 'texto', obrigatorio: true, largura: 'grande' },
  { id: 'sigla', label: 'Sigla', tipo: 'texto', largura: 'pequena' },
  { id: 'categoria', label: 'Categoria', tipo: 'badge', agrupavel: true, largura: 'media' },
  { id: 'natureza', label: 'Natureza', tipo: 'badge', agrupavel: true, largura: 'media' },
  { id: 'quantidade_vagas', label: 'Vagas Previstas', tipo: 'numero', largura: 'pequena' },
  { id: 'vagas_ocupadas', label: 'Vagas Ocupadas', tipo: 'numero', largura: 'pequena' },
  { id: 'vagas_disponiveis', label: 'Vagas Disponíveis', tipo: 'numero', largura: 'pequena' },
  { id: 'percentual_ocupacao', label: '% Ocupação', tipo: 'numero', largura: 'pequena' },
  { id: 'escolaridade', label: 'Escolaridade', tipo: 'texto', agrupavel: true, largura: 'media' },
  { id: 'vencimento_base', label: 'Vencimento Base', tipo: 'numero', largura: 'pequena' },
  { id: 'cbo', label: 'CBO', tipo: 'texto', largura: 'pequena' },
  { id: 'lei_criacao', label: 'Lei de Criação', tipo: 'texto', largura: 'media' },
  { id: 'nivel_hierarquico', label: 'Nível Hierárquico', tipo: 'numero', agrupavel: true, largura: 'pequena' },
  { id: 'ativo', label: 'Ativo', tipo: 'badge', agrupavel: true, largura: 'pequena' },
];

// Mapeamento de campos por tipo
export const CAMPOS_POR_TIPO: Record<TipoRelatorio, CampoRelatorio[]> = {
  portarias: CAMPOS_PORTARIAS,
  servidores: CAMPOS_SERVIDORES,
  cargos_vagas: CAMPOS_CARGOS,
};

// Labels dos tipos de relatório
export const TIPO_RELATORIO_LABELS: Record<TipoRelatorio, string> = {
  portarias: 'Portarias',
  servidores: 'Servidores',
  cargos_vagas: 'Cargos e Vagas',
};

// Ícones dos tipos (nomes dos ícones lucide)
export const TIPO_RELATORIO_ICONS: Record<TipoRelatorio, string> = {
  portarias: 'FileText',
  servidores: 'Users',
  cargos_vagas: 'Briefcase',
};

// Configuração padrão por tipo
export const CONFIG_PADRAO: Record<TipoRelatorio, Partial<ConfiguracaoRelatorio>> = {
  portarias: {
    titulo: 'RELATÓRIO DE PORTARIAS',
    camposSelecionados: ['numero', 'titulo', 'categoria', 'status', 'data_documento'],
    agrupamentos: [{ campo: 'status', ordem: 'asc', mostrarContagem: true }],
    ordenacao: { campo: 'data_documento', direcao: 'desc' },
  },
  servidores: {
    titulo: 'RELATÓRIO DE SERVIDORES',
    camposSelecionados: ['nome_completo', 'cpf', 'cargo_nome', 'unidade_nome', 'situacao'],
    agrupamentos: [{ campo: 'unidade_nome', ordem: 'asc', mostrarContagem: true }],
    ordenacao: { campo: 'nome_completo', direcao: 'asc' },
  },
  cargos_vagas: {
    titulo: 'RELATÓRIO DE CARGOS E VAGAS',
    camposSelecionados: ['nome', 'sigla', 'categoria', 'quantidade_vagas', 'vagas_ocupadas', 'vagas_disponiveis'],
    agrupamentos: [{ campo: 'categoria', ordem: 'asc', mostrarContagem: true }],
    ordenacao: { campo: 'nome', direcao: 'asc' },
  },
};

// Filtros disponíveis por tipo
export interface FiltroRelatorio {
  id: string;
  label: string;
  tipo: 'select' | 'multiselect' | 'periodo' | 'texto';
  opcoes?: { value: string; label: string }[];
  campo?: string; // campo no banco
}

export const FILTROS_PORTARIAS: FiltroRelatorio[] = [
  {
    id: 'status',
    label: 'Status',
    tipo: 'multiselect',
    opcoes: [
      { value: 'minuta', label: 'Minuta' },
      { value: 'aguardando_assinatura', label: 'Aguardando Assinatura' },
      { value: 'assinado', label: 'Assinado' },
      { value: 'aguardando_publicacao', label: 'Aguardando Publicação' },
      { value: 'publicado', label: 'Publicado' },
      { value: 'vigente', label: 'Vigente' },
      { value: 'revogado', label: 'Revogado' },
    ],
  },
  {
    id: 'categoria',
    label: 'Categoria',
    tipo: 'multiselect',
    opcoes: [
      { value: 'nomeacao', label: 'Nomeação' },
      { value: 'exoneracao', label: 'Exoneração' },
      { value: 'designacao', label: 'Designação' },
      { value: 'pessoal', label: 'Pessoal' },
      { value: 'licenca', label: 'Licença' },
      { value: 'ferias', label: 'Férias' },
      { value: 'administrativa', label: 'Administrativa' },
    ],
  },
  { id: 'periodo', label: 'Período', tipo: 'periodo' },
];

export const FILTROS_SERVIDORES: FiltroRelatorio[] = [
  {
    id: 'tipo_servidor',
    label: 'Tipo de Servidor',
    tipo: 'multiselect',
    opcoes: [
      { value: 'efetivo_idjuv', label: 'Efetivo IDJUV' },
      { value: 'comissionado_idjuv', label: 'Comissionado IDJUV' },
      { value: 'cedido_entrada', label: 'Cedido (Entrada)' },
      { value: 'cedido_saida', label: 'Cedido (Saída)' },
    ],
  },
  {
    id: 'situacao',
    label: 'Situação',
    tipo: 'multiselect',
    opcoes: [
      { value: 'ativo', label: 'Ativo' },
      { value: 'inativo', label: 'Inativo' },
      { value: 'afastado', label: 'Afastado' },
      { value: 'licenca', label: 'Em Licença' },
      { value: 'ferias', label: 'Em Férias' },
    ],
  },
  { id: 'unidade', label: 'Unidade', tipo: 'select' },
];

export const FILTROS_CARGOS: FiltroRelatorio[] = [
  {
    id: 'categoria',
    label: 'Categoria',
    tipo: 'multiselect',
    opcoes: [
      { value: 'CC', label: 'Cargo Comissionado' },
      { value: 'CE', label: 'Cargo Efetivo' },
      { value: 'FG', label: 'Função Gratificada' },
    ],
  },
  {
    id: 'natureza',
    label: 'Natureza',
    tipo: 'multiselect',
    opcoes: [
      { value: 'efetivo', label: 'Efetivo' },
      { value: 'comissionado', label: 'Comissionado' },
    ],
  },
  {
    id: 'ativo',
    label: 'Situação',
    tipo: 'select',
    opcoes: [
      { value: 'true', label: 'Ativos' },
      { value: 'false', label: 'Inativos' },
      { value: 'all', label: 'Todos' },
    ],
  },
];

export const FILTROS_POR_TIPO: Record<TipoRelatorio, FiltroRelatorio[]> = {
  portarias: FILTROS_PORTARIAS,
  servidores: FILTROS_SERVIDORES,
  cargos_vagas: FILTROS_CARGOS,
};
