// ============================================================================
// enviar-notificacao — porta de entrada dos disparos pela configuração da instância
// ============================================================================
// Ações:
//   teste   envia um e-mail ou WhatsApp de teste para validar a configuração da tela
//           Administração › Envio de e-mail e WhatsApp. Exige admin.envios.configurar.
//
// Novos usos (ex.: avisos) entram como novas ações aqui: cada ação checa a SUA
// permissão e monta o conteúdo no servidor a partir do registro (aviso_id, ...), nunca
// a partir de texto livre do cliente. O envio em si é do núcleo ../_shared/envio.
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import {
  carregarConfigEnvio,
  carregarIdentidade,
  enviarEmail,
  EMAIL_RE,
  enviarWhatsAppTemplate,
  montarEmailInstitucional,
  textoParaHtml,
} from "../_shared/envio/index.ts";

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function corsHeaders(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  const allowOrigin = ALLOWED_ORIGINS.length === 0
    ? "*"
    : ALLOWED_ORIGINS.includes(origin)
      ? origin
      : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Vary": "Origin",
  };
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req);
  const responder = (corpo: unknown, status = 200) =>
    new Response(JSON.stringify(corpo), { status, headers: { ...cors, "Content-Type": "application/json" } });

  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return responder({ error: "Não autorizado" }, 401);

    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!url || !anonKey || !serviceKey) return responder({ error: "Configuração do backend ausente" }, 500);

    const usuario = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const admin = createClient(url, serviceKey);

    const { data: { user }, error: userError } = await usuario.auth.getUser();
    if (userError || !user) return responder({ error: "Sessão inválida" }, 401);

    const body = await req.json().catch(() => ({}));
    const { acao, canal, destino } = body as { acao?: string; canal?: string; destino?: string };

    if (acao !== "teste") return responder({ error: "Ação inválida" }, 400);

    // Permissão avaliada como o próprio usuário (auth.uid() dentro da função).
    const { data: pode, error: permError } = await usuario.rpc("pode_configurar_envios");
    if (permError) return responder({ error: "Falha ao validar permissões" }, 500);
    if (!pode) return responder({ error: "Sem permissão para configurar envios" }, 403);

    const alvo = String(destino ?? "").trim();
    const origem = { modulo: "teste", disparadoPor: user.id };

    if (canal === "email") {
      if (!EMAIL_RE.test(alvo) || alvo.length > 254) return responder({ error: "E-mail de destino inválido" }, 400);
      // O teste vale para a configuração salva mesmo com o canal desligado (testar antes de ativar).
      const salva = await carregarConfigEnvio(admin, "email");
      if (!salva?.provedor) return responder({ error: "Salve a configuração de e-mail antes de testar" }, 400);
      const cfg = { ...salva, ativo: true };
      const identidade = await carregarIdentidade(admin, cfg);
      const html = montarEmailInstitucional(identidade, {
        titulo: "Teste de envio",
        subtitulo: "Teste de configuração",
        corpoHtml: `<p>${textoParaHtml(
          "Este é um e-mail de teste enviado pelo sistema.\nSe você recebeu esta mensagem, o envio de e-mail está configurado corretamente.",
        )}</p>`,
      });
      const r = await enviarEmail(admin, { para: alvo, assunto: "Teste de envio de e-mail", html }, origem, cfg);
      return responder({ status: r.status, erro: r.erro ?? null });
    }

    if (canal === "whatsapp") {
      const digitos = alvo.replace(/\D/g, "");
      if (digitos.length < 10 || digitos.length > 15) return responder({ error: "Telefone de destino inválido" }, 400);
      // hello_world já vem aprovado em toda conta WhatsApp Business: testa número e token
      // sem depender dos templates do cliente.
      const salva = await carregarConfigEnvio(admin, "whatsapp");
      if (!salva?.provedor) return responder({ error: "Salve a configuração do WhatsApp antes de testar" }, 400);
      const r = await enviarWhatsAppTemplate(
        admin,
        digitos,
        { nome: "hello_world", idioma: "en_US", parametros: [] },
        origem,
        { ...salva, ativo: true },
      );
      return responder({ status: r.status, erro: r.erro ?? null });
    }

    return responder({ error: "Canal inválido" }, 400);
  } catch (e) {
    console.error("enviar-notificacao:", e instanceof Error ? e.message : e);
    return responder({ error: "Erro interno" }, 500);
  }
});
