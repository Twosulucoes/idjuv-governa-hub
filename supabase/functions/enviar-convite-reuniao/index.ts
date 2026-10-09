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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
