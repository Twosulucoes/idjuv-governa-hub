import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

// CORS com allowlist por ambiente. Defina ALLOWED_ORIGINS (lista separada por
// vírgula) nas variáveis da função para restringir as origens. Sem a variável,
// mantém o comportamento permissivo ("*") para não quebrar ambientes existentes.
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

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user: caller },
      error: callerError,
    } = await supabaseUser.auth.getUser();

    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Autorização padronizada: permissão institucional admin.usuarios
    const { data: temPermissao, error: permError } = await supabaseUser.rpc(
      "usuario_tem_permissao",
      { _user_id: caller.id, _codigo_funcao: "admin.usuarios" }
    );

    if (permError) {
      return new Response(
        JSON.stringify({ error: "Falha ao validar permissões", details: permError.message }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    if (!temPermissao) {
      return new Response(JSON.stringify({ error: "Acesso negado. Requer permissão admin.usuarios." }), {
        status: 403,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { email, password, user_metadata } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email e senha são obrigatórios" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const tipoUsuario = user_metadata?.tipo_usuario === "tecnico" ? "tecnico" : "servidor";
    const fullName = user_metadata?.full_name || normalizedEmail;

    const ensureProfile = async (userId: string, userEmail: string) => {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            id: userId,
            email: userEmail,
            full_name: fullName,
            tipo_usuario: tipoUsuario,
            is_active: true,
          },
          { onConflict: "id" }
        );

      if (profileError) throw profileError;
    };

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: user_metadata || {},
    });

    if (createError) {
      if (
        createError.message?.includes("already been registered") ||
        createError.message?.includes("already exists")
      ) {
        const { data: listed, error: listError } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });

        if (listError) throw listError;

        const existing = listed?.users?.find(
          (u) => (u.email || "").toLowerCase() === normalizedEmail
        );

        if (!existing?.id || !existing.email) {
          return new Response(
            JSON.stringify({
              error: "user_already_exists",
              message: "Usuário já registrado com este email",
            }),
            {
              status: 409,
              headers: { ...cors, "Content-Type": "application/json" },
            }
          );
        }

        await ensureProfile(existing.id, existing.email);

        return new Response(
          JSON.stringify({ user: { id: existing.id, email: existing.email }, recovered: true }),
          {
            status: 200,
            headers: { ...cors, "Content-Type": "application/json" },
          }
        );
      }

      throw createError;
    }

    if (!newUser?.user?.id || !newUser.user.email) {
      throw new Error("Falha ao criar usuário");
    }

    await ensureProfile(newUser.user.id, newUser.user.email);

    return new Response(
      JSON.stringify({ user: { id: newUser.user.id, email: newUser.user.email } }),
      {
        status: 200,
        headers: { ...cors, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error creating user:", error);
    return new Response(JSON.stringify({ error: error.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
