/**
 * IA da instituição (tabelas ia_config e ia_uso). Cada instituição escolhe o provedor e
 * cadastra a própria chave, gravada no Vault pela RPC salvar_chave_ia. A chave nunca chega
 * ao front: só se sabe SE e QUANDO foi gravada e os 4 últimos caracteres.
 */

export const PERMISSAO_CONFIGURAR_IA = "ia.configurar";
export const PERMISSAO_USAR_IA = "ia.usar";

export type ProvedorIA = "openai" | "anthropic" | "gemini" | "compativel_openai";

export const PROVEDOR_IA_LABEL: Record<ProvedorIA, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  gemini: "Google Gemini",
  compativel_openai: "Compatível com OpenAI (URL própria)",
};

/** Colunas legíveis de ia_config (a referência da chave no Vault não tem GRANT de SELECT). */
export interface ConfigIA {
  id: boolean;
  ativo: boolean;
  provedor: ProvedorIA;
  url_base: string | null;
  modelo: string;
  limite_chamadas_hora: number;
  teto_tokens_mes: number | null;
  enviar_dados_pessoais: boolean;
  segredo_final: string | null;
  segredo_atualizado_em: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export const COLUNAS_CONFIG_IA =
  "id, ativo, provedor, url_base, modelo, limite_chamadas_hora, teto_tokens_mes, enviar_dados_pessoais, " +
  "segredo_final, segredo_atualizado_em, updated_by, created_at, updated_at";

/** Colunas que o front pode gravar (o banco recusa as demais). */
export type ConfigIAInput = Pick<
  ConfigIA,
  "ativo" | "provedor" | "url_base" | "modelo" | "limite_chamadas_hora" | "teto_tokens_mes" | "enviar_dados_pessoais"
>;

/** Retorno da RPC resumo_uso_ia_mes(). */
export interface ResumoUsoIA {
  chamadas: number;
  tokens_entrada: number;
  tokens_saida: number;
  teto_tokens_mes: number | null;
}

/** Resposta do recurso "testar" do ia-gateway. */
export interface ResultadoTesteIA {
  ok: true;
  provedor: ProvedorIA;
  modelo: string;
}
