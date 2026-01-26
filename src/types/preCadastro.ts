export interface Idioma {
  idioma: string;
  nivel: 'basico' | 'intermediario' | 'avancado' | 'fluente';
}

export interface CursoComplementar {
  nome: string;
  instituicao: string;
  carga_horaria?: number;
  ano?: number;
}

export interface Dependente {
  nome: string;
  cpf: string;
  data_nascimento: string;
  parentesco: string;
  certidao_tipo?: string;
  termo_guarda?: boolean;
}

export type StatusPreCadastro = 'rascunho' | 'enviado' | 'aprovado' | 'rejeitado' | 'convertido';

export interface PreCadastro {
  id: string;
  codigo_acesso: string;
  status: StatusPreCadastro;
  
  // Dados Pessoais
  nome_completo: string;
  nome_social?: string;
  data_nascimento?: string;
  sexo?: string;
  estado_civil?: string;
  nacionalidade?: string;
  naturalidade_cidade?: string;
  naturalidade_uf?: string;
  foto_url?: string;
  raca_cor?: string;
  pcd?: boolean;
  pcd_tipo?: string;
  nome_mae?: string;
  nome_pai?: string;
  tipo_sanguineo?: string;
  
  // Documentos Pessoais
  cpf: string;
  rg?: string;
  rg_orgao_expedidor?: string;
  rg_uf?: string;
  rg_data_emissao?: string;
  certidao_tipo?: string;
  titulo_eleitor?: string;
  titulo_zona?: string;
  titulo_secao?: string;
  titulo_cidade_votacao?: string;
  titulo_uf_votacao?: string;
  titulo_data_emissao?: string;
  certificado_reservista?: string;
  reservista_orgao?: string;
  reservista_data_emissao?: string;
  reservista_categoria?: string;
  reservista_ano?: number;
  ctps_numero?: string;
  ctps_serie?: string;
  ctps_uf?: string;
  ctps_data_emissao?: string;
  
  // Contato e Endereço
  email: string;
  telefone_celular?: string;
  telefone_fixo?: string;
  endereco_logradouro?: string;
  endereco_numero?: string;
  endereco_complemento?: string;
  endereco_bairro?: string;
  endereco_cidade?: string;
  endereco_uf?: string;
  endereco_cep?: string;
  
  // Documentos Previdenciários
  pis_pasep?: string;
  
  // Escolaridade/Habilitação
  escolaridade?: string;
  formacao_academica?: string;
  instituicao_ensino?: string;
  ano_conclusao?: number;
  registro_conselho?: string;
  conselho_numero?: string;
  cnh_numero?: string;
  cnh_categoria?: string;
  cnh_validade?: string;
  cnh_data_expedicao?: string;
  cnh_primeira_habilitacao?: string;
  cnh_uf?: string;
  
  // Aptidões e Características
  habilidades?: string[];
  idiomas?: Idioma[];
  experiencia_resumo?: string;
  cursos_complementares?: CursoComplementar[];
  
  // Checklist de Documentos
  doc_rg?: boolean;
  doc_cpf?: boolean;
  doc_certidao?: boolean;
  doc_titulo_eleitor?: boolean;
  doc_certificado_reservista?: boolean;
  doc_comprovante_residencia?: boolean;
  doc_pis_pasep?: boolean;
  doc_diploma?: boolean;
  doc_historico_escolar?: boolean;
  doc_registro_conselho?: boolean;
  doc_certidao_criminal_estadual?: boolean;
  doc_certidao_criminal_federal?: boolean;
  doc_quitacao_eleitoral?: boolean;
  doc_certidao_improbidade?: boolean;
  doc_declaracao_acumulacao?: boolean;
  doc_declaracao_bens?: boolean;
  doc_termo_responsabilidade?: boolean;
  doc_comprovante_bancario?: boolean;
  
  // Dados Bancários
  banco_nome?: string;
  banco_codigo?: string;
  banco_agencia?: string;
  banco_conta?: string;
  banco_tipo_conta?: string;
  
  // Dependentes
  dependentes?: Dependente[];
  
  // Metadados
  observacoes?: string;
  ip_envio?: string;
  data_envio?: string;
  servidor_id?: string;
  convertido_em?: string;
  convertido_por?: string;
  created_at?: string;
  updated_at?: string;
}

export const ESCOLARIDADES = [
  'Ensino Fundamental Incompleto',
  'Ensino Fundamental Completo',
  'Ensino Médio Incompleto',
  'Ensino Médio Completo',
  'Técnico',
  'Superior Incompleto',
  'Superior Completo',
  'Pós-Graduação',
  'Mestrado',
  'Doutorado',
];

export const ESTADOS_CIVIS = [
  'Solteiro(a)',
  'Casado(a)',
  'Divorciado(a)',
  'Viúvo(a)',
  'União Estável',
  'Separado(a)',
];

export const TIPOS_SANGUINEOS = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Não sei'
];

export const CATEGORIAS_RESERVA = [
  '1ª Categoria',
  '2ª Categoria',
  '3ª Categoria',
];

export const CATEGORIAS_CNH = ['A', 'B', 'AB', 'C', 'D', 'E', 'ACC'];

export const NIVEIS_IDIOMA = [
  { value: 'basico', label: 'Básico' },
  { value: 'intermediario', label: 'Intermediário' },
  { value: 'avancado', label: 'Avançado' },
  { value: 'fluente', label: 'Fluente' },
];

export const PARENTESCOS = [
  'Filho(a)',
  'Cônjuge',
  'Companheiro(a)',
  'Pai/Mãe',
  'Enteado(a)',
  'Tutelado(a)',
  'Outro',
];

export const HABILIDADES_SUGERIDAS = [
  'Informática Básica',
  'Pacote Office',
  'Excel Avançado',
  'Redação Oficial',
  'Atendimento ao Público',
  'Organização',
  'Trabalho em Equipe',
  'Liderança',
  'Comunicação',
  'Gestão de Projetos',
  'Administração Pública',
  'Legislação',
  'Finanças Públicas',
  'Recursos Humanos',
  'Contabilidade',
  'Direito Administrativo',
  'Direção de Veículos',
  'Eventos',
  'Esportes',
  'Lazer e Recreação',
];

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

export const DOCUMENTOS_CHECKLIST = {
  pessoais: [
    { key: 'doc_rg', label: 'RG - Documento de Identidade' },
    { key: 'doc_cpf', label: 'CPF - Cadastro de Pessoa Física' },
    { key: 'doc_certidao', label: 'Certidão de Nascimento ou Casamento' },
    { key: 'doc_titulo_eleitor', label: 'Título de Eleitor' },
    { key: 'doc_certificado_reservista', label: 'Certificado de Reservista (quando aplicável)' },
    { key: 'doc_comprovante_residencia', label: 'Comprovante de Residência' },
  ],
  previdenciarios: [
    { key: 'doc_pis_pasep', label: 'NIS / PIS / PASEP' },
  ],
  escolaridade: [
    { key: 'doc_diploma', label: 'Diploma ou Certificado exigido para o cargo' },
    { key: 'doc_registro_conselho', label: 'Registro em Conselho Profissional (quando exigido)' },
  ],
  certidoes: [
    { key: 'doc_certidao_criminal_estadual', label: 'Certidão Negativa Criminal - Justiça Estadual' },
    { key: 'doc_certidao_criminal_federal', label: 'Certidão Negativa Criminal - Justiça Federal' },
    { key: 'doc_quitacao_eleitoral', label: 'Certidão de Quitação Eleitoral' },
  ],
  declaracoes: [
    { key: 'doc_declaracao_acumulacao', label: 'Declaração de Não Acumulação de Cargos' },
    { key: 'doc_declaracao_bens', label: 'Declaração de Bens e Valores' },
  ],
  bancarios: [
    { key: 'doc_comprovante_bancario', label: 'Comprovante de Conta Bancária' },
  ],
};
