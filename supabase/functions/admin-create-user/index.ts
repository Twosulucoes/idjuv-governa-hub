import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: adminAccess } = await supabaseAdmin
      .from("user_modules")
      .select("id")
      .eq("user_id", caller.id)
      .eq("module", "admin")
      .maybeSingle();

    if (!adminAccess) {
      return new Response(JSON.stringify({ error: "Acesso negado. Apenas administradores." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { email, password, user_metadata } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email e senha são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        await ensureProfile(existing.id, existing.email);

        return new Response(
          JSON.stringify({ user: { id: existing.id, email: existing.email }, recovered: true }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error creating user:", error);
    return new Response(JSON.stringify({ error: error.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
