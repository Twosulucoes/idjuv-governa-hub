// Tipos do Canal de Denúncias (módulo integridade).
//
// A tabela `denuncias` e a RPC `registrar_denuncia_publica` foram criadas em
// supabase/migrations/20260924120000_e7a1c9b4-2f3d-4a1e-9c5b-6d8f0a1b2c3d.sql
// e ainda não constam em src/integrations/supabase/types.ts (gerado) porque
// esta sessão não teve acesso ao projeto Supabase real do IDJUV para rodar a
// introspecção. Os hooks em @/hooks/useDenuncias tipam manualmente por isso —
// regenerar types.ts via MCP assim que o projeto certo estiver conectado.

export type StatusDenuncia =
  | "pendente"
  | "em_analise"
  | "em_investigacao"
  | "concluida"
  | "arquivada";

export type TipoDenuncia =
  | "corrupcao"
  | "assedio"
  | "conflito"
  | "favorecimento"
  | "irregularidade"
  | "outro";

export const TIPOS_DENUNCIA: { id: TipoDenuncia; label: string }[] = [
  { id: "corrupcao", label: "Corrupção ou desvio de recursos" },
  { id: "assedio", label: "Assédio moral ou sexual" },
  { id: "conflito", label: "Conflito de interesses" },
  { id: "favorecimento", label: "Favorecimento indevido" },
  { id: "irregularidade", label: "Irregularidade administrativa" },
  { id: "outro", label: "Outro" },
];

export function labelTipoDenuncia(tipo: string): string {
  return TIPOS_DENUNCIA.find((t) => t.id === tipo)?.label || tipo;
}

export interface Denuncia {
  id: string;
  protocolo: string;
  tipo: TipoDenuncia;
  anonima: boolean;
  nome_denunciante: string | null;
  email_denunciante: string | null;
  telefone_denunciante: string | null;
  cargo_denunciante: string | null;
  envolvidos: string;
  data_ocorrencia: string;
  local_ocorrencia: string;
  descricao: string;
  evidencias: string | null;
  status: StatusDenuncia;
  parecer: string | null;
  responsavel: string | null;
  created_at: string;
  updated_at: string;
}

export interface RegistrarDenunciaInput {
  anonima: boolean;
  tipo: TipoDenuncia;
  envolvidos: string;
  dataOcorrencia: string;
  localOcorrencia: string;
  descricao: string;
  evidencias?: string;
  nome?: string;
  email?: string;
  telefone?: string;
  cargo?: string;
}

export interface AtualizarDenunciaInput {
  id: string;
  status: StatusDenuncia;
  parecer?: string | null;
  responsavel?: string | null;
}
