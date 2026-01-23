// ================================================================
// TIPOS E CONFIGURAÇÕES PARA RELATÓRIOS DE FEDERAÇÕES
// ================================================================

export type TipoRelatorioFederacao = 'federacoes' | 'dirigentes';

export interface CampoRelatorioFederacao {
  id: string;
  label: string;
  tipo: 'texto' | 'data' | 'badge' | 'lista';
  grupo: 'federacao' | 'dirigentes' | 'contato' | 'social';
  largura?: 'pequena' | 'media' | 'grande' | 'auto';
}

export interface FiltroFederacao {
  id: string;
  label: string;
  tipo: 'select' | 'multiselect' | 'periodo' | 'boolean';
  opcoes?: { value: string; label: string }[];
}

export interface ConfiguracaoRelatorioFederacao {
  id?: string;
  nome: string;
  descricao?: string;
  tipo: TipoRelatorioFederacao;
  titulo: string;
  subtitulo?: string;
  incluirLogos: boolean;
  orientacao: 'retrato' | 'paisagem';
  camposSelecionados: string[];
  filtros: Record<string, string | string[] | boolean | { inicio?: string; fim?: string }>;
  ordenacao: { campo: string; direcao: 'asc' | 'desc' };
  criadoEm?: string;
  atualizadoEm?: string;
}

// ================================================================
// CAMPOS DISPONÍVEIS - FEDERAÇÕES
// ================================================================

export const CAMPOS_FEDERACOES: CampoRelatorioFederacao[] = [
  // Dados da Federação
  { id: 'nome', label: 'Nome', tipo: 'texto', grupo: 'federacao', largura: 'grande' },
  { id: 'sigla', label: 'Sigla', tipo: 'texto', grupo: 'federacao', largura: 'pequena' },
  { id: 'modalidade', label: 'Modalidade', tipo: 'texto', grupo: 'federacao', largura: 'media' },
  { id: 'status', label: 'Status', tipo: 'badge', grupo: 'federacao', largura: 'pequena' },
  { id: 'data_criacao', label: 'Data de Criação', tipo: 'data', grupo: 'federacao', largura: 'media' },
  { id: 'mandato_inicio', label: 'Início Mandato', tipo: 'data', grupo: 'federacao', largura: 'media' },
  { id: 'mandato_fim', label: 'Fim Mandato', tipo: 'data', grupo: 'federacao', largura: 'media' },
  { id: 'endereco', label: 'Endereço', tipo: 'texto', grupo: 'federacao', largura: 'grande' },
  { id: 'endereco_bairro', label: 'Bairro', tipo: 'texto', grupo: 'federacao', largura: 'media' },
  { id: 'municipio', label: 'Município', tipo: 'texto', grupo: 'federacao', largura: 'media' },
  
  // Contatos da Federação
  { id: 'telefone', label: 'Telefone', tipo: 'texto', grupo: 'contato', largura: 'media' },
  { id: 'email', label: 'E-mail', tipo: 'texto', grupo: 'contato', largura: 'media' },
  
  // Redes Sociais da Federação
  { id: 'instagram', label: 'Instagram', tipo: 'texto', grupo: 'social', largura: 'media' },
  { id: 'facebook', label: 'Facebook', tipo: 'texto', grupo: 'social', largura: 'media' },
  
  // Dirigentes
  { id: 'presidente_nome', label: 'Presidente', tipo: 'texto', grupo: 'dirigentes', largura: 'grande' },
  { id: 'presidente_telefone', label: 'Tel. Presidente', tipo: 'texto', grupo: 'dirigentes', largura: 'media' },
  { id: 'presidente_email', label: 'E-mail Presidente', tipo: 'texto', grupo: 'dirigentes', largura: 'media' },
  { id: 'presidente_instagram', label: 'Instagram Presidente', tipo: 'texto', grupo: 'social', largura: 'media' },
  { id: 'vice_presidente_nome', label: 'Vice-Presidente', tipo: 'texto', grupo: 'dirigentes', largura: 'grande' },
  { id: 'vice_presidente_telefone', label: 'Tel. Vice', tipo: 'texto', grupo: 'dirigentes', largura: 'media' },
  { id: 'vice_presidente_instagram', label: 'Instagram Vice', tipo: 'texto', grupo: 'social', largura: 'media' },
  { id: 'diretor_tecnico_nome', label: 'Diretor Técnico', tipo: 'texto', grupo: 'dirigentes', largura: 'grande' },
  { id: 'diretor_tecnico_telefone', label: 'Tel. Diretor', tipo: 'texto', grupo: 'dirigentes', largura: 'media' },
  { id: 'diretor_tecnico_instagram', label: 'Instagram Diretor', tipo: 'texto', grupo: 'social', largura: 'media' },
];

// ================================================================
// CAMPOS DISPONÍVEIS - DIRIGENTES (visão expandida)
// ================================================================

export const CAMPOS_DIRIGENTES: CampoRelatorioFederacao[] = [
  { id: 'federacao_nome', label: 'Federação', tipo: 'texto', grupo: 'federacao', largura: 'grande' },
  { id: 'federacao_sigla', label: 'Sigla', tipo: 'texto', grupo: 'federacao', largura: 'pequena' },
  { id: 'cargo', label: 'Cargo', tipo: 'texto', grupo: 'dirigentes', largura: 'media' },
  { id: 'nome', label: 'Nome', tipo: 'texto', grupo: 'dirigentes', largura: 'grande' },
  { id: 'telefone', label: 'Telefone', tipo: 'texto', grupo: 'contato', largura: 'media' },
  { id: 'email', label: 'E-mail', tipo: 'texto', grupo: 'contato', largura: 'media' },
  { id: 'instagram', label: 'Instagram', tipo: 'texto', grupo: 'social', largura: 'media' },
  { id: 'facebook', label: 'Facebook', tipo: 'texto', grupo: 'social', largura: 'media' },
  { id: 'data_nascimento', label: 'Data Nascimento', tipo: 'data', grupo: 'dirigentes', largura: 'media' },
];

export const CAMPOS_POR_TIPO_FEDERACAO: Record<TipoRelatorioFederacao, CampoRelatorioFederacao[]> = {
  federacoes: CAMPOS_FEDERACOES,
  dirigentes: CAMPOS_DIRIGENTES,
};

// ================================================================
// FILTROS DISPONÍVEIS
// ================================================================

export const FILTROS_FEDERACOES: FiltroFederacao[] = [
  {
    id: 'status',
    label: 'Status',
    tipo: 'multiselect',
    opcoes: [
      { value: 'em_analise', label: 'Em Análise' },
      { value: 'ativo', label: 'Ativa' },
      { value: 'inativo', label: 'Inativa' },
      { value: 'rejeitado', label: 'Rejeitada' },
    ],
  },
  {
    id: 'municipio',
    label: 'Município',
    tipo: 'multiselect',
    opcoes: [
      { value: 'Boa Vista', label: 'Boa Vista' },
      { value: 'Alto Alegre', label: 'Alto Alegre' },
      { value: 'Amajari', label: 'Amajari' },
      { value: 'Bonfim', label: 'Bonfim' },
      { value: 'Cantá', label: 'Cantá' },
      { value: 'Caracaraí', label: 'Caracaraí' },
      { value: 'Caroebe', label: 'Caroebe' },
      { value: 'Iracema', label: 'Iracema' },
      { value: 'Mucajaí', label: 'Mucajaí' },
      { value: 'Normandia', label: 'Normandia' },
      { value: 'Pacaraima', label: 'Pacaraima' },
      { value: 'Rorainópolis', label: 'Rorainópolis' },
      { value: 'São João da Baliza', label: 'São João da Baliza' },
      { value: 'São Luiz', label: 'São Luiz' },
      { value: 'Uiramutã', label: 'Uiramutã' },
    ],
  },
  {
    id: 'periodo_mandato',
    label: 'Período do Mandato',
    tipo: 'periodo',
  },
  {
    id: 'possui_instagram',
    label: 'Possui Instagram',
    tipo: 'boolean',
  },
  {
    id: 'possui_facebook',
    label: 'Possui Facebook',
    tipo: 'boolean',
  },
  {
    id: 'possui_diretor_tecnico',
    label: 'Possui Diretor Técnico',
    tipo: 'boolean',
  },
];

export const FILTROS_DIRIGENTES: FiltroFederacao[] = [
  {
    id: 'cargo',
    label: 'Cargo',
    tipo: 'multiselect',
    opcoes: [
      { value: 'presidente', label: 'Presidente' },
      { value: 'vice_presidente', label: 'Vice-Presidente' },
      { value: 'diretor_tecnico', label: 'Diretor Técnico' },
    ],
  },
  {
    id: 'status_federacao',
    label: 'Status da Federação',
    tipo: 'multiselect',
    opcoes: [
      { value: 'em_analise', label: 'Em Análise' },
      { value: 'ativo', label: 'Ativa' },
      { value: 'inativo', label: 'Inativa' },
    ],
  },
  {
    id: 'possui_instagram',
    label: 'Possui Instagram',
    tipo: 'boolean',
  },
];

export const FILTROS_POR_TIPO_FEDERACAO: Record<TipoRelatorioFederacao, FiltroFederacao[]> = {
  federacoes: FILTROS_FEDERACOES,
  dirigentes: FILTROS_DIRIGENTES,
};

// ================================================================
// LABELS E ÍCONES
// ================================================================

export const TIPO_RELATORIO_FEDERACAO_LABELS: Record<TipoRelatorioFederacao, string> = {
  federacoes: 'Federações',
  dirigentes: 'Dirigentes',
};

export const STATUS_FEDERACAO_LABELS: Record<string, string> = {
  em_analise: 'Em Análise',
  ativo: 'Ativa',
  inativo: 'Inativa',
  rejeitado: 'Rejeitada',
};

// ================================================================
// CONFIGURAÇÕES PADRÃO
// ================================================================

export const CONFIG_PADRAO_FEDERACAO: Record<TipoRelatorioFederacao, Partial<ConfiguracaoRelatorioFederacao>> = {
  federacoes: {
    titulo: 'Relatório de Federações Esportivas',
    subtitulo: 'Instituto de Desenvolvimento da Juventude e do Esporte - IDJuv',
    camposSelecionados: ['sigla', 'nome', 'status', 'presidente_nome', 'telefone', 'email'],
    orientacao: 'paisagem',
    ordenacao: { campo: 'nome', direcao: 'asc' },
  },
  dirigentes: {
    titulo: 'Relatório de Dirigentes das Federações',
    subtitulo: 'Instituto de Desenvolvimento da Juventude e do Esporte - IDJuv',
    camposSelecionados: ['federacao_sigla', 'cargo', 'nome', 'telefone', 'email'],
    orientacao: 'paisagem',
    ordenacao: { campo: 'federacao_sigla', direcao: 'asc' },
  },
};

// ================================================================
// GRUPOS DE CAMPOS
// ================================================================

export const GRUPOS_CAMPOS: Record<string, string> = {
  federacao: 'Dados da Federação',
  dirigentes: 'Dirigentes',
  contato: 'Contatos',
  social: 'Redes Sociais',
};
