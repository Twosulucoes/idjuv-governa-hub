import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import {
  carregarConfigEnvio,
  carregarIdentidade,
  enviarEmail,
  enviarWhatsAppTemplate,
  escaparHtml,
  montarEmailInstitucional,
  normalizarTelefone,
  templateConfigurado,
  textoParaHtml,
  whatsappDisponivel,
  type IdentidadeEmail,
} from "../_shared/envio/index.ts";

// CORS com allowlist por ambiente (mesmo padrão de admin-create-user/delete-user).
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function buildCors(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  const allowOrigin = ALLOWED_ORIGINS.length === 0
    ? "*"
    : ALLOWED_ORIGINS.includes(origin)
      ? origin
      : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

// Limites contra uso do convite como disparador de mensagens em nome do órgão (phishing/spam):
// participantes por chamada, convites por usuário por hora, tamanho do texto livre e nenhum link
// além do link da própria reunião.
const MAX_PARTICIPANTES_POR_ENVIO = 50;
const MAX_CONVITES_POR_HORA = 200;
const MAX_MENSAGEM = 2000;
const MAX_ASSINATURA = 200;
// Endereço com esquema/www, ou domínio nu com terminação comum (clientes de e-mail e o WhatsApp
// transformam "site.com/login" em link).
const PADRAO_LINK =
  /\b(?:(?:https?:\/\/|www\.)[^\s<>"']+|[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|net|org|br|io|info|biz|app|xyz|online|site|top|me|co|ly|gl|link|click|live|shop|store|ru|cn|tk)\b(?:\/[^\s<>"']*)?)/gi;

/** Links do texto que não são o link da reunião (o texto vem de quem dispara, não do órgão). */
function linksNaoPermitidos(texto: string | null | undefined, linkReuniao: string | null | undefined): string[] {
  if (!texto) return [];
  const permitido = (linkReuniao ?? "").trim().replace(/\/+$/, "").toLowerCase();
  return [...texto.matchAll(PADRAO_LINK)]
    // domínio de endereço de e-mail (fulano@orgao.gov.br) não vira link
    .filter((m) => texto[(m.index ?? 0) - 1] !== "@")
    .map((m) => m[0])
    .filter((url) => {
      const limpo = url.replace(/[.,;:!?)\]]+$/, "").replace(/\/+$/, "").toLowerCase();
      if (!permitido) return true;
      // o link da reunião, com ou sem esquema
      return limpo !== permitido && limpo !== permitido.replace(/^https?:\/\//, "");
    });
}

interface EnviarConviteRequest {
  reuniao_id: string;
  participante_ids: string[];
  modelo_id?: string;
  mensagem_personalizada?: string;
  canal: "email" | "whatsapp";
  assinatura?: {
    nome: string;
    cargo: string;
    setor?: string;
  };
}

interface Reuniao {
  id: string;
  titulo: string;
  data_reuniao: string;
  hora_inicio: string;
  hora_fim?: string | null;
  local?: string | null;
  link_virtual?: string | null;
  tipo: string;
  pauta?: string | null;
  created_by?: string | null;
}

interface Participante {
  id: string;
  nome_externo?: string;
  email_externo?: string;
  telefone_externo?: string;
  servidor?: {
    nome_completo: string;
    email_pessoal?: string;
    telefone_celular?: string;
  }[] | { nome_completo: string; email_pessoal?: string; telefone_celular?: string } | null;
}

interface ModeloMensagem {
  id: string;
  assunto: string;
  conteudo_html: string;
}

function formatarData(dataStr: string): string {
  // Evita o “dia anterior” por efeito de fuso ao parsear uma coluna DATE
  const data = new Date(dataStr + "T12:00:00");
  return data.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatarHorario(horario: string | null | undefined): string {
  if (!horario) return "";
  return String(horario).substring(0, 5);
}

function substituirVariaveis(
  texto: string,
  reuniao: Reuniao,
  participante: Participante,
  assinatura?: { nome: string; cargo: string; setor?: string },
  nomeInstituicao = ""
): string {
  // Handle servidor which can be array or object from Supabase
  let nomeServidor = "Participante";
  if (participante.servidor) {
    if (Array.isArray(participante.servidor) && participante.servidor.length > 0) {
      nomeServidor = participante.servidor[0].nome_completo;
    } else if (!Array.isArray(participante.servidor)) {
      nomeServidor = participante.servidor.nome_completo;
    }
  }
  const nome = participante.nome_externo || nomeServidor;

  const horaInicio = formatarHorario(reuniao.hora_inicio);
  const horaFim = reuniao.hora_fim ? formatarHorario(reuniao.hora_fim) : "";
  const organizador = assinatura?.nome || nomeInstituicao;
  const unidadeResponsavel = assinatura?.setor || "";

  let resultado = texto
    // Nome
    .replace(/\{nome\}/g, nome)
    .replace(/\{\{nome_participante\}\}/g, nome)

    // Título
    .replace(/\{titulo\}/g, reuniao.titulo)
    .replace(/\{\{titulo_reuniao\}\}/g, reuniao.titulo)

    // Data
    .replace(/\{data\}/g, formatarData(reuniao.data_reuniao))
    .replace(/\{\{data_reuniao\}\}/g, formatarData(reuniao.data_reuniao))

    // Horário
    .replace(/\{hora\}/g, horaInicio)
    .replace(/\{horario\}/g, horaInicio)
    .replace(/\{hora_inicio\}/g, horaInicio)
    .replace(/\{\{hora_inicio\}\}/g, horaInicio)
    .replace(/\{hora_fim\}/g, horaFim)
    .replace(/\{\{hora_fim\}\}/g, horaFim)
    .replace(/\{horario_fim\}/g, horaFim)

    // Local / Link / Tipo / Pauta
    .replace(/\{local\}/g, reuniao.local || "A definir")
    .replace(/\{\{local\}\}/g, reuniao.local || "A definir")
    .replace(/\{link\}/g, reuniao.link_virtual || "")
    .replace(/\{\{link\}\}/g, reuniao.link_virtual || "")
    .replace(
      /\{tipo\}/g,
      reuniao.tipo === "virtual"
        ? "Virtual"
        : reuniao.tipo === "presencial"
          ? "Presencial"
          : "Híbrida"
    )
    .replace(
      /\{\{tipo\}\}/g,
      reuniao.tipo === "virtual"
        ? "Virtual"
        : reuniao.tipo === "presencial"
          ? "Presencial"
          : "Híbrida"
    )
    .replace(/\{pauta\}/g, reuniao.pauta || "")
    .replace(/\{\{pauta\}\}/g, reuniao.pauta || "")

    // Assinatura (variáveis do template)
    .replace(/\{\{organizador\}\}/g, organizador)
    .replace(/\{\{unidade_responsavel\}\}/g, unidadeResponsavel);
  
  if (assinatura) {
    resultado += `\n\n---\n${assinatura.nome}\n${assinatura.cargo}`;
    if (assinatura.setor) {
      resultado += `\n${assinatura.setor}`;
    }
  }
  
  return resultado;
}

function tipoLegivel(tipo: string): string {
  return tipo === "virtual" ? "Virtual" : tipo === "presencial" ? "Presencial" : "Híbrida";
}

/** Primeiro nome/participante para o template do WhatsApp. */
function nomeDoParticipante(participante: Participante): string {
  const s = participante.servidor;
  const nomeServidor = Array.isArray(s) ? s[0]?.nome_completo : s?.nome_completo;
  return participante.nome_externo || nomeServidor || "Participante";
}

function gerarHtmlEmail(corpo: string, reuniao: Reuniao, identidade: IdentidadeEmail): string {
  const linha = (rotulo: string, valor: string, ultima = false) => `
        <tr>
          <td style="padding: 8px 0;${ultima ? "" : " border-bottom: 1px solid #e2e8f0;"}"><strong style="color: #64748b;">${rotulo}</strong></td>
          <td style="padding: 8px 0;${ultima ? "" : " border-bottom: 1px solid #e2e8f0;"}">${valor}</td>
        </tr>`;
  // Só http(s) vira link clicável; o resto aparece como texto.
  const link = reuniao.link_virtual && /^https?:\/\//i.test(reuniao.link_virtual)
    ? `<a href="${escaparHtml(reuniao.link_virtual)}" style="color: #2563eb;">${escaparHtml(reuniao.link_virtual)}</a>`
    : reuniao.link_virtual ? escaparHtml(reuniao.link_virtual) : "";

  const horario = formatarHorario(reuniao.hora_inicio) + (reuniao.hora_fim ? ` às ${formatarHorario(reuniao.hora_fim)}` : "");
  const local = reuniao.tipo === "virtual" ? "Online" : reuniao.local || "A definir";

  const corpoHtml = `
    <div style="background: #ffffff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h2 style="color: #1f2937; margin-top: 0;">${escaparHtml(reuniao.titulo)}</h2>
      <table style="width: 100%; border-collapse: collapse;">
        ${linha("📅 Data:", escaparHtml(formatarData(reuniao.data_reuniao)))}
        ${linha("🕐 Horário:", escaparHtml(horario))}
        ${linha("📍 Local:", escaparHtml(local), !link)}
        ${link ? linha("🔗 Link:", link, true) : ""}
      </table>
    </div>
    <div style="background: #ffffff; padding: 20px; border-radius: 8px;">${textoParaHtml(corpo)}</div>`;

  return montarEmailInstitucional(identidade, {
    titulo: "Convite para Reunião",
    subtitulo: "Convite para Reunião",
    corpoHtml,
  });
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Edge function enviar-convite-reuniao chamada");
  
  const corsHeaders = buildCors(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Sem header de autorização");
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !anonKey) {
      console.error("Configuração do backend ausente (SUPABASE_URL / SUPABASE_ANON_KEY)");
      return new Response(JSON.stringify({ error: "Configuração do backend ausente" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");

    // Cliente do usuário (respeita RLS)
    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Cliente admin (bypass RLS) — necessário para ler contato de servidores quando o usuário
    // não tem permissão direta de SELECT na tabela de servidores.
    const admin = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : supabase;

    // Autenticar usuário (token recebido do frontend)
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData?.user) {
      console.error("Erro ao verificar usuário:", userError);
      return new Response(JSON.stringify({ error: "Token inválido ou expirado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: EnviarConviteRequest = await req.json();

    const {
      reuniao_id,
      participante_ids,
      modelo_id,
      mensagem_personalizada,
      canal,
      assinatura,
    } = body;

    if (!reuniao_id || !participante_ids || participante_ids.length === 0) {
      return new Response(JSON.stringify({ error: "Dados incompletos" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const erroPedido = (mensagem: string, status = 400) =>
      new Response(JSON.stringify({ error: mensagem }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    if (!Array.isArray(participante_ids) || participante_ids.length > MAX_PARTICIPANTES_POR_ENVIO) {
      return erroPedido(`Envie no máximo ${MAX_PARTICIPANTES_POR_ENVIO} convites por vez.`);
    }
    if (canal !== "email" && canal !== "whatsapp") {
      return erroPedido("Canal inválido");
    }
    if (mensagem_personalizada && (typeof mensagem_personalizada !== "string" || mensagem_personalizada.length > MAX_MENSAGEM)) {
      return erroPedido(`A mensagem pode ter no máximo ${MAX_MENSAGEM} caracteres.`);
    }
    const camposAssinatura = assinatura ? [assinatura.nome, assinatura.cargo, assinatura.setor] : [];
    if (camposAssinatura.some((c) => c !== undefined && c !== null && (typeof c !== "string" || c.length > MAX_ASSINATURA))) {
      return erroPedido("Assinatura inválida");
    }

    const { data: isAdmin, error: isAdminError } = await admin.rpc("is_admin_user", {
      _user_id: userData.user.id,
    });

    if (isAdminError) {
      console.warn("Não foi possível verificar se usuário é admin:", isAdminError);
    }

    // Buscar dados da reunião (inclui created_by para checar permissão)
    const { data: reuniao, error: reuniaoError } = await admin
      .from("reunioes")
      .select(
        "id, titulo, data_reuniao, hora_inicio, hora_fim, local, link_virtual, tipo, pauta, created_by"
      )
      .eq("id", reuniao_id)
      .single();

    if (reuniaoError || !reuniao) {
      console.error("Erro ao buscar reunião:", reuniaoError);
      return new Response(JSON.stringify({ error: "Reunião não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const podeEnviar = Boolean(isAdmin) || (reuniao.created_by && reuniao.created_by === userData.user.id);
    if (!podeEnviar) {
      return new Response(JSON.stringify({ error: "Sem permissão para enviar convites desta reunião" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Buscar participantes (restrito à reunião informada)
    const { data: participantes, error: participantesError } = await admin
      .from("participantes_reuniao")
      .select(
        `
        id,
        nome_externo,
        email_externo,
        telefone_externo,
        servidor:servidor_id (
          nome_completo,
          email_pessoal,
          telefone_celular
        )
      `
      )
      .eq("reuniao_id", reuniao_id)
      .in("id", participante_ids);

    if (participantesError) {
      console.error("Erro ao buscar participantes:", participantesError);
      return new Response(JSON.stringify({ error: "Erro ao buscar participantes" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Buscar modelo de mensagem
    let modelo: ModeloMensagem | null = null;
    if (modelo_id) {
      const { data: modeloData } = await admin
        .from("modelos_mensagem_reuniao")
        .select("id, assunto, conteudo_html")
        .eq("id", modelo_id)
        .single();
      modelo = modeloData;
    }

    // Se não tem modelo, usar mensagem padrão
    const assuntoPadrao = `Convite: ${reuniao.titulo}`;
    const corpoPadrao = `Prezado(a) {nome},

Você está sendo convidado(a) para a reunião "${reuniao.titulo}".

📅 Data: {data}
🕐 Horário: {horario}
📍 Local: {local}
${reuniao.link_virtual ? `🔗 Link: {link}` : ""}

Contamos com sua presença.

Atenciosamente,`;

    const assuntoFinal = modelo?.assunto || assuntoPadrao;
    const corpoFinal = mensagem_personalizada || modelo?.conteudo_html || corpoPadrao;

    // O texto sai com a identidade do órgão: só o link da reunião pode aparecer nele. A checagem é sobre o
    // texto já com as variáveis trocadas ({local}, {pauta}…), como cada destinatário vai ler.
    const textosFinais = (participantes || []).flatMap((p) => [
      substituirVariaveis(corpoFinal, reuniao as Reuniao, p as Participante, assinatura, ""),
      substituirVariaveis(assuntoFinal, reuniao as Reuniao, p as Participante, undefined, ""),
    ]);
    const linksProibidos = [assuntoFinal, corpoFinal, reuniao.local, reuniao.pauta, ...camposAssinatura, ...textosFinais]
      .flatMap((t) => linksNaoPermitidos(t, reuniao.link_virtual));
    if (linksProibidos.length > 0) {
      return erroPedido("A mensagem não pode conter links além do link da reunião (cadastre-o no campo de link da reunião).");
    }

    // Cota por usuário na última hora: conta e registra numa transação (envios em paralelo não somam por fora).
    // Cada chamada consome a quantidade de convites pedidos, inclusive reenvios.
    const { data: dentroDaCota, error: cotaError } = await admin.rpc("consumir_cota_uso", {
      _usuario: userData.user.id,
      _tipo: "convite_reuniao",
      _quantidade: (participantes || []).length || 1,
      _limite: MAX_CONVITES_POR_HORA,
      _modulo: "gabinete",
      _descricao: `Convites da reunião ${reuniao_id} por ${canal}`,
    });
    if (cotaError) {
      console.error("Erro ao consumir cota de convites:", cotaError);
      return erroPedido("Falha ao verificar o limite de envio", 500);
    }
    if (!dentroDaCota) {
      return erroPedido(`Limite de ${MAX_CONVITES_POR_HORA} convites por hora atingido. Tente mais tarde.`, 429);
    }

    // Configuração da instância (e-mail/WhatsApp) e identidade visual, carregadas uma vez.
    const cfgEmail = canal === "email" ? await carregarConfigEnvio(admin, "email") : null;
    const cfgWhats = canal === "whatsapp" ? await carregarConfigEnvio(admin, "whatsapp") : null;
    const identidade = await carregarIdentidade(admin, cfgEmail);
    const templateConvite = templateConfigurado(cfgWhats, "convite_reuniao");
    const whatsappPelaApi = whatsappDisponivel(cfgWhats) && !!templateConvite;
    const origem = { modulo: "reunioes", id: reuniao_id, disparadoPor: userData.user.id };

    const marcarConviteEnviado = (participanteId: string) =>
      admin
        .from("participantes_reuniao")
        .update({
          convite_enviado: true,
          convite_enviado_em: new Date().toISOString(),
          convite_enviado_por: userData.user.id,
          convite_canal: canal,
        })
        .eq("id", participanteId);

    const resultados: {
      participante_id: string;
      sucesso: boolean;
      erro?: string;
      link_whatsapp?: string;
      via_api?: boolean;
    }[] = [];

    for (const participante of participantes || []) {
      const corpoSubstituido = substituirVariaveis(
        corpoFinal, reuniao as Reuniao, participante as Participante, assinatura, identidade.nome
      );
      const assuntoSubstituido = substituirVariaveis(
        assuntoFinal, reuniao as Reuniao, participante as Participante, undefined, identidade.nome
      );

      // Obter dados do servidor (pode ser array ou objeto)
      let servidorData: { nome_completo: string; email_pessoal?: string; telefone_celular?: string } | null = null;
      if (participante.servidor) {
        if (Array.isArray(participante.servidor) && participante.servidor.length > 0) {
          servidorData = participante.servidor[0];
        } else if (!Array.isArray(participante.servidor)) {
          servidorData = participante.servidor;
        }
      }

      if (canal === "email") {
        // Prioriza email_externo, se não tiver usa email_pessoal do servidor
        const email = participante.email_externo || servidorData?.email_pessoal;
        if (!email) {
          resultados.push({ participante_id: participante.id, sucesso: false, erro: "Sem email" });
          continue;
        }

        const r = await enviarEmail(
          admin,
          { para: email, assunto: assuntoSubstituido, html: gerarHtmlEmail(corpoSubstituido, reuniao as Reuniao, identidade) },
          origem,
          cfgEmail,
        );
        if (r.status !== "enviado") {
          resultados.push({ participante_id: participante.id, sucesso: false, erro: r.erro || "Falha ao enviar e-mail" });
          continue;
        }

        await marcarConviteEnviado(participante.id);
        resultados.push({ participante_id: participante.id, sucesso: true });
      } else if (canal === "whatsapp") {
        // Prioriza telefone_externo, se não tiver usa telefone_celular do servidor
        const telefone = participante.telefone_externo || servidorData?.telefone_celular;
        if (!telefone) {
          resultados.push({ participante_id: participante.id, sucesso: false, erro: "Sem telefone" });
          continue;
        }

        if (whatsappPelaApi) {
          // Template aprovado na Meta: {{1}} nome, {{2}} título, {{3}} data, {{4}} horário, {{5}} local ou link
          const r = reuniao as Reuniao;
          const horario = formatarHorario(r.hora_inicio) + (r.hora_fim ? ` às ${formatarHorario(r.hora_fim)}` : "");
          const local = r.tipo === "virtual" ? (r.link_virtual || "Online") : `${r.local || "A definir"} (${tipoLegivel(r.tipo)})`;
          const envio = await enviarWhatsAppTemplate(
            admin,
            telefone,
            {
              nome: templateConvite!.nome,
              idioma: templateConvite!.idioma,
              parametros: [nomeDoParticipante(participante as Participante), r.titulo, formatarData(r.data_reuniao), horario, local],
            },
            origem,
            cfgWhats,
          );
          if (envio.status !== "enviado") {
            resultados.push({ participante_id: participante.id, sucesso: false, erro: envio.erro || "Falha ao enviar WhatsApp" });
            continue;
          }
          await marcarConviteEnviado(participante.id);
          resultados.push({ participante_id: participante.id, sucesso: true, via_api: true });
          continue;
        }

        // Sem WhatsApp oficial configurado: link wa.me para quem dispara abrir no próprio WhatsApp.
        const linkWhatsApp = `https://wa.me/${normalizarTelefone(telefone)}?text=${encodeURIComponent(corpoSubstituido)}`;
        await marcarConviteEnviado(participante.id);
        resultados.push({ participante_id: participante.id, sucesso: true, link_whatsapp: linkWhatsApp });
      }
    }

    const sucessos = resultados.filter(r => r.sucesso).length;
    const falhas = resultados.filter(r => !r.sucesso).length;

    console.log(`Convites processados: ${sucessos} sucessos, ${falhas} falhas`);

    return new Response(
      JSON.stringify({ 
        message: `${sucessos} convite(s) processado(s)`,
        resultados,
        sucessos,
        falhas,
        enviados_whatsapp_api: resultados.filter(r => r.via_api).length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Erro geral:", error);
    return new Response(
      JSON.stringify({ error: "Erro ao enviar convites" }),
      { status: 500, headers: { ...buildCors(req), "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
