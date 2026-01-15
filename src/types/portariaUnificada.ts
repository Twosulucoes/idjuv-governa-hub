// Tipos para o Sistema Unificado de Portarias

export type ColunaTabela = 
  | 'numero'
  | 'nome_completo'
  | 'cpf'
  | 'matricula'
  | 'cargo'
  | 'unidade_setor'
  | 'codigo'
  | 'custom';

export interface ColunaPersonalizada {
  id: string;
  titulo: string;
  tipo: 'texto' | 'data' | 'numero';
  largura?: number;
}

export interface ConfiguracaoTabela {
  habilitada: boolean;
  colunas: ColunaTabela[];
  colunasPersonalizadas: ColunaPersonalizada[];
}

export interface Artigo {
  id: string;
  numero: string;
  conteudo: string;
}

export interface ConfiguracaoAssinatura {
  nome: string;
  cargo: string;
  local: string;
}

export interface DadosPortariaUnificada {
  // Dados básicos
  numero: string;
  data_documento: string;
  categoria: string;
  titulo: string;
  ementa?: string;
  
  // Campos específicos por categoria
  cargo_id?: string;
  unidade_id?: string;
  unidade_origem_id?: string;
  unidade_destino_id?: string;
  data_inicio?: string;
  data_fim?: string;
  tipo_licenca?: string;
  dias_ferias?: number;
  exercicio?: number;
  orgao_cessionario?: string;
  onus?: string;
  
  // Conteúdo
  preambulo: string;
  artigos: Artigo[];
  configuracao_tabela: ConfiguracaoTabela;
  servidores_ids: string[];
  
  // Assinatura
  assinatura: ConfiguracaoAssinatura;
}

// Campos que aparecem para cada categoria
export const CAMPOS_POR_CATEGORIA: Record<string, string[]> = {
  nomeacao: ['cargo_id', 'unidade_id'],
  exoneracao: ['cargo_id', 'unidade_id'],
  designacao: ['unidade_origem_id', 'unidade_destino_id', 'data_inicio', 'data_fim'],
  ferias: ['data_inicio', 'data_fim', 'dias_ferias', 'exercicio'],
  licenca: ['tipo_licenca', 'data_inicio', 'data_fim'],
  cessao: ['orgao_cessionario', 'onus', 'data_inicio', 'data_fim'],
  pessoal: [],
  estruturante: [],
  normativa: [],
  delegacao: [],
  dispensa: ['unidade_origem_id', 'unidade_destino_id'],
};

// Labels para os campos
export const CAMPO_LABELS: Record<string, string> = {
  cargo_id: 'Cargo',
  unidade_id: 'Unidade/Setor',
  unidade_origem_id: 'Unidade de Origem',
  unidade_destino_id: 'Unidade de Destino',
  data_inicio: 'Data de Início',
  data_fim: 'Data de Fim',
  tipo_licenca: 'Tipo de Licença',
  dias_ferias: 'Dias de Férias',
  exercicio: 'Exercício',
  orgao_cessionario: 'Órgão Cessionário',
  onus: 'Ônus',
};

// Templates de preâmbulo por categoria
export const PREAMBULO_TEMPLATES: Record<string, string> = {
  nomeacao: `O PRESIDENTE DO INSTITUTO DE DESPORTO, JUVENTUDE E LAZER DO ESTADO DE RORAIMA – IDJuv, no uso das atribuições legais que lhe são conferidas pela Lei nº 2.301, de 29 de dezembro de 2025, e demais normas aplicáveis,

CONSIDERANDO o disposto no art. 7º, §3º, da Lei nº 2.301/2025, que estabelece que a investidura nos cargos em comissão do IDJuv dar-se-á por ato do Diretor Presidente;

RESOLVE:`,
  exoneracao: `O PRESIDENTE DO INSTITUTO DE DESPORTO, JUVENTUDE E LAZER DO ESTADO DE RORAIMA – IDJuv, no uso das atribuições legais que lhe são conferidas pela Lei nº 2.301, de 29 de dezembro de 2025, e demais normas aplicáveis,

CONSIDERANDO o disposto no art. 7º, §3º, da Lei nº 2.301/2025;

RESOLVE:`,
  designacao: `O PRESIDENTE DO INSTITUTO DE DESPORTO, JUVENTUDE E LAZER DO ESTADO DE RORAIMA – IDJuv, no uso das atribuições legais que lhe são conferidas pela Lei nº 2.301, de 29 de dezembro de 2025, e demais normas aplicáveis,

RESOLVE:`,
  ferias: `O PRESIDENTE DO INSTITUTO DE DESPORTO, JUVENTUDE E LAZER DO ESTADO DE RORAIMA – IDJuv, no uso das atribuições legais que lhe são conferidas pela Lei nº 2.301, de 29 de dezembro de 2025, e demais normas aplicáveis,

RESOLVE:`,
  licenca: `O PRESIDENTE DO INSTITUTO DE DESPORTO, JUVENTUDE E LAZER DO ESTADO DE RORAIMA – IDJuv, no uso das atribuições legais que lhe são conferidas pela Lei nº 2.301, de 29 de dezembro de 2025, e demais normas aplicáveis,

RESOLVE:`,
  cessao: `O PRESIDENTE DO INSTITUTO DE DESPORTO, JUVENTUDE E LAZER DO ESTADO DE RORAIMA – IDJuv, no uso das atribuições legais que lhe são conferidas pela Lei nº 2.301, de 29 de dezembro de 2025, e demais normas aplicáveis,

RESOLVE:`,
  pessoal: `O PRESIDENTE DO INSTITUTO DE DESPORTO, JUVENTUDE E LAZER DO ESTADO DE RORAIMA – IDJuv, no uso das atribuições legais que lhe são conferidas pela Lei nº 2.301, de 29 de dezembro de 2025, e demais normas aplicáveis,

RESOLVE:`,
  estruturante: `O PRESIDENTE DO INSTITUTO DE DESPORTO, JUVENTUDE E LAZER DO ESTADO DE RORAIMA – IDJuv, no uso das atribuições legais que lhe são conferidas pela Lei nº 2.301, de 29 de dezembro de 2025, e demais normas aplicáveis,

RESOLVE:`,
  normativa: `O PRESIDENTE DO INSTITUTO DE DESPORTO, JUVENTUDE E LAZER DO ESTADO DE RORAIMA – IDJuv, no uso das atribuições legais que lhe são conferidas pela Lei nº 2.301, de 29 de dezembro de 2025, e demais normas aplicáveis,

RESOLVE:`,
  delegacao: `O PRESIDENTE DO INSTITUTO DE DESPORTO, JUVENTUDE E LAZER DO ESTADO DE RORAIMA – IDJuv, no uso das atribuições legais que lhe são conferidas pela Lei nº 2.301, de 29 de dezembro de 2025, e demais normas aplicáveis,

RESOLVE:`,
  dispensa: `O PRESIDENTE DO INSTITUTO DE DESPORTO, JUVENTUDE E LAZER DO ESTADO DE RORAIMA – IDJuv, no uso das atribuições legais que lhe são conferidas pela Lei nº 2.301, de 29 de dezembro de 2025, e demais normas aplicáveis,

RESOLVE:`,
};

// Templates de artigos por categoria
export const ARTIGOS_TEMPLATES: Record<string, Artigo[]> = {
  nomeacao: [
    { id: '1', numero: '1º', conteudo: 'NOMEAR os servidores abaixo relacionados para os respectivos cargos em comissão do Instituto de Desporto, Juventude e Lazer do Estado de Roraima – IDJuv.' },
    { id: '2', numero: '2º', conteudo: 'Os servidores nomeados farão jus à remuneração correspondente aos respectivos cargos, conforme disposto no Anexo I da Lei nº 2.301, de 29 de dezembro de 2025.' },
    { id: '3', numero: '3º', conteudo: 'Esta Portaria entra em vigor na data de sua publicação, com efeitos a contar de {{DATA_EFEITOS}}.' },
  ],
  exoneracao: [
    { id: '1', numero: '1º', conteudo: 'EXONERAR os servidores abaixo relacionados dos respectivos cargos em comissão do Instituto de Desporto, Juventude e Lazer do Estado de Roraima – IDJuv.' },
    { id: '2', numero: '2º', conteudo: 'Esta Portaria entra em vigor na data de sua publicação.' },
  ],
  designacao: [
    { id: '1', numero: '1º', conteudo: 'DESIGNAR os servidores abaixo relacionados para exercerem suas atividades nas unidades indicadas, sem prejuízo de suas lotações originais.' },
    { id: '2', numero: '2º', conteudo: 'A designação terá vigência de {{DATA_INICIO}} a {{DATA_FIM}}.' },
    { id: '3', numero: '3º', conteudo: 'Esta Portaria entra em vigor na data de sua publicação.' },
  ],
  ferias: [
    { id: '1', numero: '1º', conteudo: 'CONCEDER férias aos servidores abaixo relacionados, referentes ao exercício de {{EXERCICIO}}.' },
    { id: '2', numero: '2º', conteudo: 'Esta Portaria entra em vigor na data de sua publicação.' },
  ],
  licenca: [
    { id: '1', numero: '1º', conteudo: 'CONCEDER licença {{TIPO_LICENCA}} aos servidores abaixo relacionados, pelo período indicado.' },
    { id: '2', numero: '2º', conteudo: 'Esta Portaria entra em vigor na data de sua publicação.' },
  ],
  cessao: [
    { id: '1', numero: '1º', conteudo: 'CEDER os servidores abaixo relacionados ao {{ORGAO_CESSIONARIO}}, com ônus {{ONUS}}.' },
    { id: '2', numero: '2º', conteudo: 'Esta Portaria entra em vigor na data de sua publicação.' },
  ],
  pessoal: [
    { id: '1', numero: '1º', conteudo: '' },
    { id: '2', numero: '2º', conteudo: 'Esta Portaria entra em vigor na data de sua publicação.' },
  ],
  estruturante: [
    { id: '1', numero: '1º', conteudo: '' },
    { id: '2', numero: '2º', conteudo: 'Esta Portaria entra em vigor na data de sua publicação.' },
  ],
  normativa: [
    { id: '1', numero: '1º', conteudo: '' },
    { id: '2', numero: '2º', conteudo: 'Esta Portaria entra em vigor na data de sua publicação.' },
  ],
  delegacao: [
    { id: '1', numero: '1º', conteudo: 'DELEGAR competência ao(s) servidor(es) abaixo relacionado(s) para:' },
    { id: '2', numero: '2º', conteudo: 'Esta Portaria entra em vigor na data de sua publicação.' },
  ],
  dispensa: [
    { id: '1', numero: '1º', conteudo: 'DISPENSAR os servidores abaixo relacionados das designações anteriormente conferidas, retornando às suas unidades de origem.' },
    { id: '2', numero: '2º', conteudo: 'Esta Portaria entra em vigor na data de sua publicação.' },
  ],
};

// Assinatura padrão
export const ASSINATURA_PADRAO: ConfiguracaoAssinatura = {
  nome: 'MARCELO DE MAGALHÃES NUNES',
  cargo: 'Presidente do Instituto de Desporto, Juventude e Lazer\ndo Estado de Roraima',
  local: 'Boa Vista – RR',
};

// Labels para colunas da tabela
export const COLUNA_LABELS: Record<ColunaTabela, string> = {
  numero: 'Nº',
  nome_completo: 'NOME COMPLETO',
  cpf: 'CPF',
  matricula: 'MATRÍCULA',
  cargo: 'CARGO',
  unidade_setor: 'UNIDADE/SETOR',
  codigo: 'CÓDIGO',
  custom: 'Personalizada',
};

// Colunas padrão da tabela
export const COLUNAS_PADRAO: ColunaTabela[] = [
  'numero',
  'nome_completo',
  'cpf',
  'cargo',
  'unidade_setor',
  'codigo',
];

// Tipos de licença disponíveis
export const TIPOS_LICENCA = [
  { value: 'maternidade', label: 'Licença Maternidade' },
  { value: 'paternidade', label: 'Licença Paternidade' },
  { value: 'saude', label: 'Licença para Tratamento de Saúde' },
  { value: 'interesse_particular', label: 'Licença para Interesse Particular' },
  { value: 'capacitacao', label: 'Licença para Capacitação' },
  { value: 'casamento', label: 'Licença Casamento (Gala)' },
  { value: 'luto', label: 'Licença Luto' },
  { value: 'premio', label: 'Licença Prêmio' },
];

// Opções de ônus para cessão
export const OPCOES_ONUS = [
  { value: 'cedente', label: 'Para o Órgão Cedente' },
  { value: 'cessionario', label: 'Para o Órgão Cessionário' },
  { value: 'compartilhado', label: 'Compartilhado' },
  { value: 'sem_onus', label: 'Sem Ônus' },
];
