 // Tipos para Instituições - Cadastro de entidades solicitantes de espaço
 
 export type TipoInstituicao = 'formal' | 'informal' | 'orgao_publico';
 
 export type EsferaGoverno = 'municipal' | 'estadual' | 'federal';
 
 export type StatusInstituicao = 'ativo' | 'inativo' | 'pendente_validacao';
 
 export interface Instituicao {
   id: string;
   codigo_instituicao: string;
   tipo_instituicao: TipoInstituicao;
   nome_razao_social: string;
   nome_fantasia?: string;
   cnpj?: string;
   inscricao_estadual?: string;
   esfera_governo?: EsferaGoverno;
   orgao_vinculado?: string;
   endereco_logradouro?: string;
   endereco_numero?: string;
   endereco_complemento?: string;
   endereco_bairro?: string;
   endereco_cidade?: string;
   endereco_uf?: string;
   endereco_cep?: string;
   telefone?: string;
   email?: string;
   site?: string;
   responsavel_nome: string;
   responsavel_cpf?: string;
   responsavel_cargo?: string;
   responsavel_telefone?: string;
   responsavel_email?: string;
   ato_constituicao?: string;
   ato_documento_url?: string;
   data_fundacao?: string;
   area_atuacao?: string[];
   observacoes?: string;
   status: StatusInstituicao;
   validado_por?: string;
   data_validacao?: string;
   ativo: boolean;
   created_at?: string;
   created_by?: string;
   updated_at?: string;
   updated_by?: string;
   // Dados agregados da view
   total_solicitacoes?: number;
   solicitacoes_aprovadas?: number;
 }
 
 export interface InstituicaoResumo {
   id: string;
   codigo_instituicao: string;
   tipo_instituicao: TipoInstituicao;
   nome_razao_social: string;
   nome_fantasia?: string;
   cnpj?: string;
   esfera_governo?: EsferaGoverno;
   orgao_vinculado?: string;
   endereco_cidade?: string;
   endereco_uf?: string;
   telefone?: string;
   email?: string;
   responsavel_nome?: string;
   responsavel_cargo?: string;
   status: StatusInstituicao;
   ativo: boolean;
   created_at?: string;
   total_solicitacoes: number;
   solicitacoes_aprovadas: number;
 }
 
 export interface InstituicaoFormData {
   tipo_instituicao: TipoInstituicao;
   nome_razao_social: string;
   nome_fantasia?: string;
   cnpj?: string;
   inscricao_estadual?: string;
   esfera_governo?: EsferaGoverno;
   orgao_vinculado?: string;
   endereco_logradouro?: string;
   endereco_numero?: string;
   endereco_complemento?: string;
   endereco_bairro?: string;
   endereco_cidade?: string;
   endereco_uf?: string;
   endereco_cep?: string;
   telefone?: string;
   email?: string;
   site?: string;
   responsavel_nome: string;
   responsavel_cpf?: string;
   responsavel_cargo?: string;
   responsavel_telefone?: string;
   responsavel_email?: string;
   ato_constituicao?: string;
   data_fundacao?: string;
   area_atuacao?: string[];
   observacoes?: string;
 }
 
 // Labels para UI
 export const TIPO_INSTITUICAO_LABELS: Record<TipoInstituicao, string> = {
   formal: 'Instituição Formal',
   informal: 'Grupo Informal',
   orgao_publico: 'Órgão Público',
 };
 
 export const TIPO_INSTITUICAO_DESCRICOES: Record<TipoInstituicao, string> = {
   formal: 'Entidade com CNPJ (associações, ONGs, clubes, ligas esportivas)',
   informal: 'Grupo sem CNPJ (times amadores, coletivos, grupos de bairro)',
   orgao_publico: 'Órgão governamental (secretarias, prefeituras, autarquias)',
 };
 
 export const ESFERA_GOVERNO_LABELS: Record<EsferaGoverno, string> = {
   municipal: 'Municipal',
   estadual: 'Estadual',
   federal: 'Federal',
 };
 
 export const STATUS_INSTITUICAO_LABELS: Record<StatusInstituicao, string> = {
   ativo: 'Ativo',
   inativo: 'Inativo',
   pendente_validacao: 'Pendente de Validação',
 };
 
 export const STATUS_INSTITUICAO_COLORS: Record<StatusInstituicao, string> = {
   ativo: 'bg-success text-success-foreground',
   inativo: 'bg-muted text-muted-foreground',
   pendente_validacao: 'bg-warning text-warning-foreground',
 };
 
 export const TIPO_INSTITUICAO_COLORS: Record<TipoInstituicao, string> = {
   formal: 'bg-primary text-primary-foreground',
   informal: 'bg-secondary text-secondary-foreground',
   orgao_publico: 'bg-info text-info-foreground',
 };
 
 export const TIPO_INSTITUICAO_ICONS: Record<TipoInstituicao, string> = {
   formal: 'Building2',
   informal: 'Users',
   orgao_publico: 'Landmark',
 };
 
 export const AREAS_ATUACAO_OPTIONS = [
   'Esporte',
   'Cultura',
   'Lazer',
   'Educação',
   'Assistência Social',
   'Saúde',
   'Meio Ambiente',
   'Turismo',
   'Juventude',
   'Comunidade',
   'Religioso',
   'Outro',
 ];
 
 // Formato padrão SEI: XXXX.XXXXXX/YYYY-XX
 export const SEI_PATTERN = /^\d{4}\.\d{6}\/\d{4}-\d{2}$/;
 export const SEI_PLACEHOLDER = '0000.000000/0000-00';
 export const SEI_MASK = '9999.999999/9999-99';