import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
  horario_inicio: string;
  horario_fim?: string;
  local?: string;
  link_virtual?: string;
  tipo: string;
  pauta?: string;
}

interface Participante {
  id: string;
  nome_externo?: string;
  email_externo?: string;
  telefone_externo?: string;
  servidor?: {
    nome_completo: string;
  };
}

interface ModeloMensagem {
  id: string;
  assunto: string;
  corpo: string;
}

function formatarData(dataStr: string): string {
  const data = new Date(dataStr + "T00:00:00");
  return data.toLocaleDateString("pt-BR", { 
    weekday: "long", 
    day: "2-digit", 
    month: "long", 
    year: "numeric" 
  });
}

function formatarHorario(horario: string): string {
  return horario.substring(0, 5);
}

function substituirVariaveis(
  texto: string,
  reuniao: Reuniao,
  participante: Participante,
  assinatura?: { nome: string; cargo: string; setor?: string }
): string {
  const nome = participante.nome_externo || participante.servidor?.nome_completo || "Participante";
  
  let resultado = texto
    .replace(/\{nome\}/g, nome)
    .replace(/\{titulo\}/g, reuniao.titulo)
    .replace(/\{data\}/g, formatarData(reuniao.data_reuniao))
    .replace(/\{horario\}/g, formatarHorario(reuniao.horario_inicio))
    .replace(/\{horario_fim\}/g, reuniao.horario_fim ? formatarHorario(reuniao.horario_fim) : "")
    .replace(/\{local\}/g, reuniao.local || "A definir")
    .replace(/\{link\}/g, reuniao.link_virtual || "")
    .replace(/\{tipo\}/g, reuniao.tipo === "virtual" ? "Virtual" : reuniao.tipo === "presencial" ? "Presencial" : "Híbrida")
    .replace(/\{pauta\}/g, reuniao.pauta || "");
  
  if (assinatura) {
    resultado += `\n\n---\n${assinatura.nome}\n${assinatura.cargo}`;
    if (assinatura.setor) {
      resultado += `\n${assinatura.setor}`;
    }
  }
  
  return resultado;
}

function gerarHtmlEmail(corpo: string, reuniao: Reuniao): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convite para Reunião</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%); padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">IDJUV - Instituto de Desenvolvimento da Juventude</h1>
    <p style="color: #cbd5e1; margin: 5px 0 0 0;">Convite para Reunião</p>
  </div>
  
  <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
      <h2 style="color: #1e3a5f; margin-top: 0;">${reuniao.titulo}</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
            <strong style="color: #64748b;">📅 Data:</strong>
          </td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
            ${formatarData(reuniao.data_reuniao)}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
            <strong style="color: #64748b;">🕐 Horário:</strong>
          </td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
            ${formatarHorario(reuniao.horario_inicio)}${reuniao.horario_fim ? ` às ${formatarHorario(reuniao.horario_fim)}` : ""}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
            <strong style="color: #64748b;">📍 Local:</strong>
          </td>
          <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
            ${reuniao.tipo === "virtual" ? "Online" : reuniao.local || "A definir"}
          </td>
        </tr>
        ${reuniao.link_virtual ? `
        <tr>
          <td style="padding: 8px 0;">
            <strong style="color: #64748b;">🔗 Link:</strong>
          </td>
          <td style="padding: 8px 0;">
            <a href="${reuniao.link_virtual}" style="color: #2563eb;">${reuniao.link_virtual}</a>
          </td>
        </tr>
        ` : ""}
      </table>
    </div>
    
    <div style="white-space: pre-wrap; background: white; padding: 20px; border-radius: 8px;">
      ${corpo.replace(/\n/g, "<br>")}
    </div>
  </div>
  
  <div style="background: #1e3a5f; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">
    <p style="color: #94a3b8; margin: 0; font-size: 12px;">
      Instituto de Desenvolvimento da Juventude de Roraima - IDJUV
    </p>
  </div>
</body>
</html>
  `;
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
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Erro ao verificar claims:", claimsError);
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: EnviarConviteRequest = await req.json();
    console.log("Request body:", JSON.stringify(body, null, 2));

    const { reuniao_id, participante_ids, modelo_id, mensagem_personalizada, canal, assinatura } = body;

    if (!reuniao_id || !participante_ids || participante_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: "Dados incompletos" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar dados da reunião
    const { data: reuniao, error: reuniaoError } = await supabase
      .from("reunioes")
      .select("id, titulo, data_reuniao, horario_inicio, horario_fim, local, link_virtual, tipo, pauta")
      .eq("id", reuniao_id)
      .single();

    if (reuniaoError || !reuniao) {
      console.error("Erro ao buscar reunião:", reuniaoError);
      return new Response(
        JSON.stringify({ error: "Reunião não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar participantes
    const { data: participantes, error: participantesError } = await supabase
      .from("participantes_reuniao")
      .select(`
        id,
        nome_externo,
        email_externo,
        telefone_externo,
        servidor:servidor_id (
          nome_completo
        )
      `)
      .in("id", participante_ids);

    if (participantesError) {
      console.error("Erro ao buscar participantes:", participantesError);
      return new Response(
        JSON.stringify({ error: "Erro ao buscar participantes" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar modelo de mensagem
    let modelo: ModeloMensagem | null = null;
    if (modelo_id) {
      const { data: modeloData } = await supabase
        .from("modelos_mensagem_reuniao")
        .select("id, assunto, corpo")
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
    let corpoFinal = mensagem_personalizada || modelo?.corpo || corpoPadrao;

    const resultados: { participante_id: string; sucesso: boolean; erro?: string; link_whatsapp?: string }[] = [];

    for (const participante of participantes || []) {
      const corpoSubstituido = substituirVariaveis(corpoFinal, reuniao as Reuniao, participante as Participante, assinatura);
      const assuntoSubstituido = substituirVariaveis(assuntoFinal, reuniao as Reuniao, participante as Participante);

      if (canal === "email") {
        const email = participante.email_externo;
        if (!email) {
          resultados.push({ participante_id: participante.id, sucesso: false, erro: "Sem email" });
          continue;
        }

        try {
          const htmlEmail = gerarHtmlEmail(corpoSubstituido, reuniao as Reuniao);
          
          const emailResponse = await resend.emails.send({
            from: "IDJUV <onboarding@resend.dev>",
            to: [email],
            subject: assuntoSubstituido,
            html: htmlEmail,
          });

          console.log("Email enviado:", emailResponse);

          // Atualizar status do participante
          await supabase
            .from("participantes_reuniao")
            .update({ 
              convite_enviado_em: new Date().toISOString(),
              canal_envio: "email"
            })
            .eq("id", participante.id);

          resultados.push({ participante_id: participante.id, sucesso: true });
        } catch (emailError: any) {
          console.error("Erro ao enviar email:", emailError);
          resultados.push({ participante_id: participante.id, sucesso: false, erro: emailError.message });
        }
      } else if (canal === "whatsapp") {
        const telefone = participante.telefone_externo;
        if (!telefone) {
          resultados.push({ participante_id: participante.id, sucesso: false, erro: "Sem telefone" });
          continue;
        }

        // Formatar telefone para WhatsApp (remover caracteres não numéricos e adicionar código do país)
        let telefoneFormatado = telefone.replace(/\D/g, "");
        if (!telefoneFormatado.startsWith("55")) {
          telefoneFormatado = "55" + telefoneFormatado;
        }

        const mensagemWhatsApp = encodeURIComponent(corpoSubstituido);
        const linkWhatsApp = `https://wa.me/${telefoneFormatado}?text=${mensagemWhatsApp}`;

        // Atualizar status do participante
        await supabase
          .from("participantes_reuniao")
          .update({ 
            convite_enviado_em: new Date().toISOString(),
            canal_envio: "whatsapp"
          })
          .eq("id", participante.id);

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
        falhas
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
