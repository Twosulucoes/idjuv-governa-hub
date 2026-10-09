// Moldura HTML dos e-mails com a identidade da instituição (sem nome de cliente no código).
// A identidade vem de config_envio (marca_*); o que faltar cai em config_institucional e,
// por fim, num cabeçalho neutro só com o nome do remetente.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import type { ConfigEnvio } from "./index.ts";

export interface IdentidadeEmail {
  nome: string;
  logoUrl: string | null;
  cor: string;
  rodape: string | null;
}

const COR_NEUTRA = "#334155";

export function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Texto puro → HTML seguro, preservando quebras de linha. */
export function textoParaHtml(texto: string): string {
  return escaparHtml(texto).replace(/\r?\n/g, "<br>");
}

export async function carregarIdentidade(admin: SupabaseClient, cfg: ConfigEnvio | null): Promise<IdentidadeEmail> {
  let nome = cfg?.marca_nome?.trim() || "";
  let logoUrl = cfg?.marca_logo_url || null;

  if (!nome || !logoUrl) {
    const { data } = await admin
      .from("config_institucional")
      .select("nome, nome_fantasia, logo_url")
      .eq("ativo", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (data) {
      nome = nome || data.nome_fantasia || data.nome || "";
      if (!logoUrl && typeof data.logo_url === "string" && data.logo_url.startsWith("https://")) {
        logoUrl = data.logo_url;
      }
    }
  }

  return {
    nome: nome || cfg?.remetente_nome || "",
    logoUrl,
    cor: cfg?.marca_cor && /^#[0-9A-Fa-f]{6}$/.test(cfg.marca_cor) ? cfg.marca_cor : COR_NEUTRA,
    rodape: cfg?.rodape?.trim() || null,
  };
}

/**
 * Monta o e-mail completo. `corpoHtml` já deve estar escapado por quem chama
 * (use textoParaHtml para texto digitado por usuário).
 */
export function montarEmailInstitucional(
  identidade: IdentidadeEmail,
  { titulo, subtitulo, corpoHtml }: { titulo: string; subtitulo?: string; corpoHtml: string },
): string {
  const nome = escaparHtml(identidade.nome);
  const logo = identidade.logoUrl
    ? `<img src="${escaparHtml(identidade.logoUrl)}" alt="${nome}" style="max-height:48px;max-width:200px;display:block;margin-bottom:12px;">`
    : "";
  const rodape = escaparHtml(identidade.rodape || identidade.nome);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escaparHtml(titulo)}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: ${identidade.cor}; padding: 20px; border-radius: 8px 8px 0 0;">
    ${logo}
    ${nome ? `<p style="color: #ffffff; margin: 0; font-size: 18px; font-weight: bold;">${nome}</p>` : ""}
    ${subtitulo ? `<p style="color: #ffffff; opacity: 0.85; margin: 4px 0 0 0;">${escaparHtml(subtitulo)}</p>` : ""}
  </div>
  <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
    ${corpoHtml}
  </div>
  <div style="background: ${identidade.cor}; padding: 12px; border-radius: 0 0 8px 8px; text-align: center;">
    <p style="color: #ffffff; opacity: 0.85; margin: 0; font-size: 12px;">${rodape}</p>
  </div>
</body>
</html>`;
}
