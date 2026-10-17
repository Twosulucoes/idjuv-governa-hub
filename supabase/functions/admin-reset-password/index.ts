import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { CABECALHOS_CLIENTE_SUPABASE, montarCors } from "../_shared/cors.ts";

// CORS com allowlist por ambiente (ALLOWED_ORIGINS), em falha fechada: ver ../_shared/cors.ts.
function buildCors(req: Request) {
  return montarCors(req, { cabecalhos: CABECALHOS_CLIENTE_SUPABASE, metodos: "POST, OPTIONS" });
}

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  // crypto.getRandomValues (e não Math.random): é uma senha de acesso. Descarta valores que
  // enviesariam a escolha (256 não é múltiplo de chars.length).
  const limite = 256 - (256 % chars.length);
  let password = "";
  while (password.length < 12) {
    const [b] = crypto.getRandomValues(new Uint8Array(1));
    if (b < limite) password += chars.charAt(b % chars.length);
  }
  return password;
}

serve(async (req) => {
  const corsHeaders = buildCors(req);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeaderRaw = req.headers.get("Authorization") ?? req.headers.get("authorization");
    console.log("Auth header presente:", !!authHeaderRaw);

    if (!authHeaderRaw) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tokenMatch = authHeaderRaw.match(/^Bearer\s+(.+)$/i);
    const accessToken = tokenMatch?.[1];

    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey || !supabaseAnonKey) {
      return new Response(JSON.stringify({ error: "Configuração do backend ausente" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validar o JWT também aqui: o roteador já exige (verify_jwt = true no config.toml), mas a função precisa
    // do id de quem chama e não confia só na camada de fora.
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(accessToken);
    const requesterId = claimsData?.claims?.sub as string | undefined;

    if (claimsError || !requesterId) {
      // Detalhe só no log; o cliente recebe a mensagem genérica.
      if (claimsError) console.error("admin-reset-password: token recusado:", claimsError.message);
      return new Response(JSON.stringify({ error: "Usuário não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Autorizar: só o papel de administrador (is_admin_user) redefine senhas; a permissão admin.usuarios, concedida
    // por módulo ao papel `user`, deixaria um não-administrador tomar a conta de qualquer usuário.
    const { data: temPermissao, error: permError } = await supabaseClient.rpc(
      "is_admin_user", { _user_id: requesterId }
    );

    if (permError) {
      console.error("admin-reset-password: falha ao validar permissões:", permError.code, permError.message);
      return new Response(JSON.stringify({ error: "Falha ao validar permissões" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!temPermissao) {
      return new Response(JSON.stringify({ error: "Sem permissão" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cliente admin (bypass RLS) para operações privilegiadas
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const body = await req.json().catch(() => ({}));
    const targetUserId = body?.userId;

    if (!targetUserId || typeof targetUserId !== "string") {
      return new Response(JSON.stringify({ error: "userId é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Um administrador não redefine a senha de outro: com a senha temporária na mão, tomaria a conta
    // dele sem deixar rastro. Para outro admin, só a recuperação por e-mail (o próprio dono recebe).
    if (targetUserId !== requesterId) {
      const { data: alvoAdmin, error: alvoError } = await admin
        .from("user_roles")
        .select("user_id")
        .eq("user_id", targetUserId)
        .eq("role", "admin")
        .limit(1);

      if (alvoError) {
        return new Response(JSON.stringify({ error: "Falha ao verificar o usuário" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if ((alvoAdmin ?? []).length > 0) {
        return new Response(
          JSON.stringify({
            error: "A senha de outro administrador só pode ser redefinida pela recuperação por e-mail.",
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const senhaTemporaria = generateTempPassword();

    // Atualizar senha do usuário (admin)
    const { error: updateAuthError } = await admin.auth.admin.updateUserById(targetUserId, {
      password: senhaTemporaria,
    });

    if (updateAuthError) {
      console.error("admin-reset-password: falha ao atualizar a senha:", updateAuthError.status, updateAuthError.message);
      return new Response(JSON.stringify({ error: "Não foi possível redefinir a senha" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Marcar para trocar senha no primeiro acesso
    await admin
      .from("profiles")
      .update({ requires_password_change: true, updated_at: new Date().toISOString() })
      .eq("id", targetUserId);

    // Trilha: quem redefiniu a senha de quem (nunca a senha), pelo id: sem e-mail na descrição (LGPD).
    // Falha aqui não desfaz a troca, mas fica no log.
    const { error: auditError } = await admin.from("audit_logs").insert({
      action: "password_reset",
      entity_type: "user",
      entity_id: targetUserId,
      user_id: requesterId,
      module_name: "admin",
      description: `Senha redefinida pelo administrador: usuário ${targetUserId}`,
      metadata: { senha_temporaria: true },
    });
    if (auditError) console.error("Falha ao gravar auditoria do reset de senha:", auditError.message);

    return new Response(JSON.stringify({ senhaTemporaria }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-reset-password: erro inesperado:", e);
    return new Response(JSON.stringify({ error: "Erro ao redefinir a senha" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
