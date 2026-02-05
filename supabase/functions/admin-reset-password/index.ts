import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

serve(async (req) => {
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

    // Validar JWT manualmente (verify_jwt=false)
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
      return new Response(
        JSON.stringify({
          error: "Usuário não autenticado",
          details: claimsError?.message ?? null,
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Autorizar: verificar se tem permissão admin.usuarios via RPC (no contexto do usuário)
    const { data: temPermissao, error: permError } = await supabaseClient.rpc(
      "usuario_tem_permissao",
      {
        _user_id: requesterId,
        _codigo_funcao: "admin.usuarios",
      }
    );

    if (permError) {
      return new Response(
        JSON.stringify({
          error: "Falha ao validar permissões",
          details: permError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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

    const senhaTemporaria = generateTempPassword();

    // Atualizar senha do usuário (admin)
    const { error: updateAuthError } = await admin.auth.admin.updateUserById(targetUserId, {
      password: senhaTemporaria,
    });

    if (updateAuthError) {
      return new Response(JSON.stringify({ error: updateAuthError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Marcar para trocar senha no primeiro acesso
    await admin
      .from("profiles")
      .update({ requires_password_change: true, updated_at: new Date().toISOString() })
      .eq("id", targetUserId);

    // Forçar troca via settings de segurança (se existir)
    await admin
      .from("user_security_settings")
      .upsert({ user_id: targetUserId, force_password_change: true }, { onConflict: "user_id" });

    return new Response(JSON.stringify({ senhaTemporaria }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
