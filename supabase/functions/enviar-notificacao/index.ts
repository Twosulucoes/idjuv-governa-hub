// ============================================================================
// enviar-notificacao — porta de entrada dos disparos pela configuração da instância
// ============================================================================
// Ações:
//   teste   envia um e-mail ou WhatsApp de teste para validar a configuração da tela
//           Administração › Envio de e-mail e WhatsApp. Exige admin.envios.configurar e respeita
//           a cota de 20 testes por usuário por hora (consumir_cota_uso).
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
import { CABECALHOS_CLIENTE_SUPABASE, montarCors } from "../_shared/cors.ts";

// Envio de teste: no máximo 20 por usuário por hora (a função manda mensagem com a marca do órgão para
// qualquer destino digitado). Cota pela RPC consumir_cota_uso, como em enviar-convite-reuniao.
const MAX_TESTES_POR_HORA = 20;

// CORS com allowlist por ambiente (ALLOWED_ORIGINS), em falha fechada: ver ../_shared/cors.ts.
function corsHeaders(req: Request) {
  return montarCors(req, { cabecalhos: CABECALHOS_CLIENTE_SUPABASE });
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

    // Conta e registra o teste na trilha numa transação (pedidos em paralelo não furam o limite).
    // Devolve a resposta de erro, ou null quando ainda está dentro da cota. Sem o destino na descrição (LGPD).
    const consumirCotaTeste = async (): Promise<Response | null> => {
      const { data: dentroDaCota, error: cotaError } = await admin.rpc("consumir_cota_uso", {
        _usuario: user.id,
        _tipo: "envio_teste",
        _quantidade: 1,
        _limite: MAX_TESTES_POR_HORA,
        _modulo: "admin",
        _descricao: `Envio de teste por ${canal}`,
      });
      if (cotaError) {
        console.error("enviar-notificacao: falha ao consumir a cota:", cotaError.code);
        return responder({ error: "Falha ao verificar o limite de envio" }, 500);
      }
      if (!dentroDaCota) {
        return responder({ error: `Limite de ${MAX_TESTES_POR_HORA} envios de teste por hora atingido. Tente mais tarde.` }, 429);
      }
      return null;
    };

    if (canal === "email") {
      if (!EMAIL_RE.test(alvo) || alvo.length > 254) return responder({ error: "E-mail de destino inválido" }, 400);
      // O teste vale para a configuração salva mesmo com o canal desligado (testar antes de ativar).
      const salva = await carregarConfigEnvio(admin, "email");
      if (!salva?.provedor) return responder({ error: "Salve a configuração de e-mail antes de testar" }, 400);
      const cfg = { ...salva, ativo: true };
      const foraDaCota = await consumirCotaTeste();
      if (foraDaCota) return foraDaCota;
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
      const foraDaCota = await consumirCotaTeste();
      if (foraDaCota) return foraDaCota;
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
