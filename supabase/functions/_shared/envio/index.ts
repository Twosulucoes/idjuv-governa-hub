// ============================================================================
// Núcleo de envio de e-mail e WhatsApp, reaproveitado pelas Edge Functions.
// ============================================================================
// A configuração vem do banco da instância (tabela config_envio + credencial no Vault,
// lida pela RPC config_envio_servidor, que só o service role executa). Cada disparo
// é registrado em envios_log, sem o corpo da mensagem.
//
// Quem chama é responsável por autenticar o usuário e checar a permissão da ação
// (convite de reunião, aviso, teste...) ANTES de chamar estas funções, e por montar
// o conteúdo no servidor: o núcleo não deve virar um relay de mensagem livre.
//
// Sem config_envio ativa:
//   - e-mail cai nos secrets antigos RESEND_API_KEY/RESEND_FROM (comportamento anterior);
//   - WhatsApp devolve { status: 'nao_configurado' } e quem chama decide (ex.: link wa.me).
// ============================================================================

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

export { carregarIdentidade, montarEmailInstitucional, escaparHtml, textoParaHtml } from "./html.ts";
export type { IdentidadeEmail } from "./html.ts";

const VERSAO_GRAPH = "v21.0";

export type Canal = "email" | "whatsapp";

export interface ConfigEnvio {
  canal: Canal;
  ativo: boolean;
  provedor: "smtp" | "resend" | "meta_cloud" | null;
  remetente_nome: string | null;
  remetente_email: string | null;
  responder_para: string | null;
  smtp_host: string | null;
  smtp_porta: number | null;
  smtp_seguranca: "ssl" | "starttls" | null;
  smtp_usuario: string | null;
  marca_nome: string | null;
  marca_logo_url: string | null;
  marca_cor: string | null;
  rodape: string | null;
  wa_phone_number_id: string | null;
  wa_business_account_id: string | null;
  wa_templates: Record<string, { nome?: string; idioma?: string }>;
  segredo: string | null;
}

export interface Origem {
  modulo: string;
  id?: string | null;
  disparadoPor?: string | null;
}

export type StatusEnvio = "enviado" | "falhou" | "nao_configurado";

export interface ResultadoEnvio {
  status: StatusEnvio;
  erro?: string;
  idExterno?: string;
}

export async function carregarConfigEnvio(admin: SupabaseClient, canal: Canal): Promise<ConfigEnvio | null> {
  const { data, error } = await admin.rpc("config_envio_servidor", { p_canal: canal });
  if (error) {
    // Migração ainda não aplicada ou Vault indisponível: segue como "sem configuração".
    console.warn(`config_envio_servidor(${canal}) indisponível:`, error.message);
    return null;
  }
  return (data as ConfigEnvio | null) ?? null;
}

async function registrar(
  admin: SupabaseClient,
  canal: Canal,
  provedor: string,
  destinatario: string,
  assunto: string | null,
  origem: Origem,
  r: ResultadoEnvio,
) {
  if (r.status === "nao_configurado") return;
  const { error } = await admin.from("envios_log").insert({
    canal,
    provedor,
    destinatario,
    assunto: assunto?.slice(0, 300) ?? null,
    origem_modulo: origem.modulo,
    origem_id: origem.id ?? null,
    status: r.status,
    erro: r.erro?.slice(0, 1000) ?? null,
    id_externo: r.idExterno ?? null,
    disparado_por: origem.disparadoPor ?? null,
  });
  if (error) console.warn("Falha ao gravar envios_log:", error.message);
}

function mensagemDeErro(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

// ---------------------------------------------------------------------------
// E-mail
// ---------------------------------------------------------------------------

export interface EmailParaEnviar {
  para: string;
  assunto: string;
  html: string;
}

/** Remetente "\"Nome\" <email>" sem caracteres que quebrem o cabeçalho ou virem lista (, ;). */
function formatarRemetente(nome: string | null, email: string): string {
  const limpo = (nome ?? "").replace(/["<>\\\r\n,;]/g, "").trim();
  return limpo ? `"${limpo}" <${email}>` : email;
}

export const EMAIL_RE = /^[^@\s<>,;]+@[^@\s<>,;]+\.[^@\s<>,;]+$/;

const PORTAS_SMTP = new Set([25, 465, 587, 2525]);

/** IP de loopback, rede privada, link-local ou reservado (IPv4 e IPv6). */
function ipInterno(ip: string): boolean {
  const v4 = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
  }
  const v6 = ip.toLowerCase();
  return v6 === "::" || v6 === "::1" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80") ||
    v6.startsWith("::ffff:");
}

/**
 * O servidor SMTP é escolhido por quem configura: não pode apontar para a rede interna da VPS
 * (db, kong, rest...) nem para portas que não sejam de e-mail (SSRF / varredura de portas).
 */
async function validarDestinoSmtp(host: string, porta: number): Promise<string | null> {
  if (!PORTAS_SMTP.has(porta)) return "Porta SMTP não permitida (use 25, 465, 587 ou 2525)";
  if (!host.includes(".") || ipInterno(host)) return "Servidor SMTP não permitido";
  if (/^[\d.]+$/.test(host)) return null; // IPv4 público literal
  if (typeof Deno.resolveDns !== "function") {
    // Runtime sem resolução de DNS: fica só a checagem do nome/IP literal acima.
    console.warn("Deno.resolveDns indisponível: destino SMTP checado só pelo nome");
    return null;
  }
  const ips: string[] = [];
  let apiFalhou = false;
  for (const tipo of ["A", "AAAA"] as const) {
    try {
      ips.push(...(await Deno.resolveDns(host, tipo)));
    } catch (e) {
      // NotFound = sem registro desse tipo; outro erro = resolução indisponível no runtime
      if (!(e instanceof Deno.errors.NotFound)) apiFalhou = true;
    }
  }
  if (ips.length === 0) {
    if (apiFalhou) {
      console.warn("Falha ao resolver DNS do SMTP: destino checado só pelo nome");
      return null;
    }
    return "Servidor SMTP não encontrado (DNS)";
  }
  // Risco conhecido: o denomailer resolve o nome de novo (janela de DNS rebinding).
  return ips.some(ipInterno) ? "Servidor SMTP não permitido" : null;
}

async function enviarResend(apiKey: string, from: string, replyTo: string | null, msg: EmailParaEnviar): Promise<ResultadoEnvio> {
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [msg.para],
      subject: msg.assunto,
      html: msg.html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  const corpo = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    return { status: "falhou", erro: corpo?.message || `Resend respondeu ${resp.status}` };
  }
  return { status: "enviado", idExterno: corpo?.id };
}

async function enviarSmtp(cfg: ConfigEnvio, msg: EmailParaEnviar): Promise<ResultadoEnvio> {
  if (!cfg.smtp_host || !cfg.smtp_porta || !cfg.remetente_email) {
    return { status: "falhou", erro: "SMTP incompleto: informe servidor, porta e e-mail do remetente" };
  }
  const bloqueio = await validarDestinoSmtp(cfg.smtp_host, cfg.smtp_porta);
  if (bloqueio) return { status: "falhou", erro: bloqueio };
  const client = new SMTPClient({
    connection: {
      hostname: cfg.smtp_host,
      port: cfg.smtp_porta,
      // ssl = TLS direto (465); starttls = conexão simples promovida a TLS (587)
      tls: cfg.smtp_seguranca !== "starttls",
      ...(cfg.smtp_usuario ? { auth: { username: cfg.smtp_usuario, password: cfg.segredo ?? "" } } : {}),
    },
  });
  try {
    await client.send({
      from: formatarRemetente(cfg.remetente_nome, cfg.remetente_email),
      to: msg.para,
      ...(cfg.responder_para ? { replyTo: cfg.responder_para } : {}),
      subject: msg.assunto,
      content: "auto",
      html: msg.html,
    });
    return { status: "enviado" };
  } finally {
    try {
      await client.close();
    } catch {
      // conexão já encerrada pelo servidor
    }
  }
}

/**
 * Envia um e-mail pela configuração da instância (ou pelo Resend legado, se não houver)
 * e registra em envios_log. Nunca lança: falhas voltam em `erro`.
 */
export async function enviarEmail(
  admin: SupabaseClient,
  msg: EmailParaEnviar,
  origem: Origem,
  cfg?: ConfigEnvio | null,
): Promise<ResultadoEnvio> {
  const config = cfg === undefined ? await carregarConfigEnvio(admin, "email") : cfg;
  let provedor = "resend_legado";
  let r: ResultadoEnvio;

  // Destinatário único e assunto sem quebra de linha (evita injeção de cabeçalho).
  const para = msg.para.trim();
  if (!EMAIL_RE.test(para) || para.length > 254) {
    return { status: "falhou", erro: "E-mail de destino inválido" };
  }
  msg = { ...msg, para, assunto: msg.assunto.replace(/[\r\n]+/g, " ").slice(0, 300) };

  try {
    if (config?.ativo && config.provedor === "smtp") {
      provedor = "smtp";
      r = await enviarSmtp(config, msg);
    } else if (config?.ativo && config.provedor === "resend") {
      provedor = "resend";
      r = !config.segredo || !config.remetente_email
        ? { status: "falhou", erro: "Resend incompleto: informe a API key e o e-mail do remetente" }
        : await enviarResend(config.segredo, formatarRemetente(config.remetente_nome, config.remetente_email), config.responder_para, msg);
    } else {
      const apiKey = Deno.env.get("RESEND_API_KEY") ?? "";
      const from = Deno.env.get("RESEND_FROM") ?? "";
      r = !apiKey || !from
        ? { status: "nao_configurado", erro: "Envio de e-mail não configurado (Administração › Envio de e-mail e WhatsApp)" }
        : await enviarResend(apiKey, from, null, msg);
    }
  } catch (e) {
    r = { status: "falhou", erro: mensagemDeErro(e) };
  }

  await registrar(admin, "email", provedor, msg.para, msg.assunto, origem, r);
  return r;
}

// ---------------------------------------------------------------------------
// WhatsApp (Meta Cloud API)
// ---------------------------------------------------------------------------

/** Só dígitos, com DDI 55 quando vier no formato nacional (DDD + número). */
export function normalizarTelefone(telefone: string): string {
  const digitos = telefone.replace(/\D/g, "");
  return digitos.length === 10 || digitos.length === 11 ? `55${digitos}` : digitos;
}

export interface TemplateWhatsApp {
  nome: string;
  idioma: string;
  /** Valores de {{1}}, {{2}}... do corpo do template, na ordem. */
  parametros: string[];
}

/** Template configurado para um uso (ex.: 'convite_reuniao'), ou null. */
export function templateConfigurado(cfg: ConfigEnvio | null, uso: string): { nome: string; idioma: string } | null {
  const t = cfg?.wa_templates?.[uso];
  return t?.nome ? { nome: t.nome, idioma: t.idioma || "pt_BR" } : null;
}

/** WhatsApp pronto para envio pela API (ativo, número e token gravados). */
export function whatsappDisponivel(cfg: ConfigEnvio | null): cfg is ConfigEnvio {
  return !!(cfg?.ativo && cfg.provedor === "meta_cloud" && cfg.wa_phone_number_id && cfg.segredo);
}

// A Meta recusa parâmetro com quebra de linha, tab ou mais de 4 espaços seguidos.
function limparParametro(valor: string): string {
  return valor.replace(/[\r\n\t]+/g, " ").replace(/ {4,}/g, "   ").trim().slice(0, 1000) || "-";
}

/**
 * Envia um template aprovado pela Meta e registra em envios_log. Mensagem iniciada pela
 * empresa só pode ser template; texto livre só vale dentro da janela de 24h de conversa.
 */
export async function enviarWhatsAppTemplate(
  admin: SupabaseClient,
  telefone: string,
  template: TemplateWhatsApp,
  origem: Origem,
  cfg?: ConfigEnvio | null,
): Promise<ResultadoEnvio> {
  const config = cfg === undefined ? await carregarConfigEnvio(admin, "whatsapp") : cfg;
  if (!whatsappDisponivel(config)) {
    return { status: "nao_configurado", erro: "WhatsApp oficial não configurado" };
  }

  const para = normalizarTelefone(telefone);
  let r: ResultadoEnvio;
  try {
    const resp = await fetch(
      `https://graph.facebook.com/${VERSAO_GRAPH}/${encodeURIComponent(config.wa_phone_number_id!)}/messages`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${config.segredo}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: para,
          type: "template",
          template: {
            name: template.nome,
            language: { code: template.idioma },
            ...(template.parametros.length
              ? {
                  components: [{
                    type: "body",
                    parameters: template.parametros.map((p) => ({ type: "text", text: limparParametro(p) })),
                  }],
                }
              : {}),
          },
        }),
      },
    );
    const corpo = await resp.json().catch(() => ({}));
    r = resp.ok
      ? { status: "enviado", idExterno: corpo?.messages?.[0]?.id }
      : { status: "falhou", erro: corpo?.error?.message || `Meta respondeu ${resp.status}` };
  } catch (e) {
    r = { status: "falhou", erro: mensagemDeErro(e) };
  }

  await registrar(admin, "whatsapp", "meta_cloud", para, template.nome, origem, r);
  return r;
}
