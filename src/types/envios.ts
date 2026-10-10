/**
 * Envio de e-mail e WhatsApp configurado pelo próprio cliente (tabelas config_envio e
 * envios_log). A credencial (senha SMTP, API key, token da Meta) nunca chega ao front:
 * é gravada pela RPC salvar_segredo_envio e só se sabe SE e QUANDO foi gravada.
 */

export const PERMISSAO_VER_ENVIOS = "admin.envios";
export const PERMISSAO_CONFIGURAR_ENVIOS = "admin.envios.configurar";

export type CanalEnvio = "email" | "whatsapp";
export type ProvedorEmail = "smtp" | "resend";
export type SegurancaSmtp = "ssl" | "starttls";

export interface TemplateWhatsAppConfig {
  nome?: string;
  idioma?: string;
}

/** Usos que disparam template de WhatsApp, com a ordem das variáveis esperadas. */
export const USOS_TEMPLATE_WHATSAPP: Record<string, { label: string; variaveis: string[] }> = {
  convite_reuniao: {
    label: "Convite de reunião",
    variaveis: ["nome do participante", "título da reunião", "data", "horário", "local ou link"],
  },
};

export interface ConfigEnvio {
  canal: CanalEnvio;
  ativo: boolean;
  provedor: ProvedorEmail | "meta_cloud" | null;
  remetente_nome: string | null;
  remetente_email: string | null;
  responder_para: string | null;
  smtp_host: string | null;
  smtp_porta: number | null;
  smtp_seguranca: SegurancaSmtp | null;
  smtp_usuario: string | null;
  marca_nome: string | null;
  marca_logo_url: string | null;
  marca_cor: string | null;
  rodape: string | null;
  wa_phone_number_id: string | null;
  wa_business_account_id: string | null;
  wa_templates: Record<string, TemplateWhatsAppConfig>;
  segredo_atualizado_em: string | null;
  updated_at: string;
}

/** Colunas que o front pode ler (segredo_id não tem GRANT de SELECT). */
export const COLUNAS_CONFIG_ENVIO =
  "canal, ativo, provedor, remetente_nome, remetente_email, responder_para, smtp_host, smtp_porta, " +
  "smtp_seguranca, smtp_usuario, marca_nome, marca_logo_url, marca_cor, rodape, wa_phone_number_id, " +
  "wa_business_account_id, wa_templates, segredo_atualizado_em, updated_at";

export type ConfigEnvioInput = Partial<
  Omit<ConfigEnvio, "canal" | "segredo_atualizado_em" | "updated_at">
>;

export type StatusEnvio = "enviado" | "falhou";

export interface EnvioLog {
  id: string;
  criado_em: string;
  canal: CanalEnvio;
  provedor: string;
  destinatario: string;
  assunto: string | null;
  origem_modulo: string;
  origem_id: string | null;
  status: StatusEnvio;
  erro: string | null;
  id_externo: string | null;
}

export const ORIGEM_ENVIO_LABEL: Record<string, string> = {
  reunioes: "Reuniões",
  avisos: "Avisos",
  teste: "Teste",
};
