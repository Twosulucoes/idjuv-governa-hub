import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS com allowlist por ambiente (ver admin-create-user).
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
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

// Super admin protegido — não pode ser excluído (ver shared/config/protected-users)
const PROTECTED_SUPER_ADMIN_ID = "b53e0eea-bf59-4de9-b71e-5d36d3c69bb8";

serve(async (req) => {
  const cors = corsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Não autorizado");
    }

    // Cliente no contexto do usuário (para validar identidade e permissão)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: requestingUser }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !requestingUser) {
      throw new Error("Usuário não autenticado");
    }

    // Autorização padronizada: permissão institucional admin.usuarios
    const { data: temPermissao, error: permError } = await supabaseClient.rpc(
      "usuario_tem_permissao",
      { _user_id: requestingUser.id, _codigo_funcao: "admin.usuarios" }
    );

    if (permError) {
      throw new Error(`Falha ao validar permissões: ${permError.message}`);
    }

    if (!temPermissao) {
      return new Response(
        JSON.stringify({ success: false, error: "Acesso negado. Requer permissão admin.usuarios." }),
        { status: 403, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Cliente admin (service role) para operações privilegiadas
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { userId } = await req.json();
    if (!userId) {
      throw new Error("ID do usuário não informado");
    }

    if (userId === requestingUser.id) {
      throw new Error("Você não pode excluir sua própria conta");
    }

    if (userId === PROTECTED_SUPER_ADMIN_ID) {
      throw new Error("Este usuário é protegido e não pode ser excluído");
    }

    // Buscar dados do usuário antes de excluir (para log)
    const { data: userToDelete } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .maybeSingle();

    // Excluir na ordem correta (devido às foreign keys)
    await supabaseAdmin.from("user_modules").delete().eq("user_id", userId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    await supabaseAdmin.from("profiles").update({ servidor_id: null }).eq("id", userId);

    // Excluir do auth.users (cascata remove o profile)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) {
      throw new Error(`Erro ao excluir usuário: ${deleteError.message}`);
    }

    // Registrar no audit log
    await supabaseAdmin.from("audit_logs").insert({
      action: "DELETE",
      entity_type: "user",
      entity_id: userId,
      user_id: requestingUser.id,
      description: `Usuário excluído: ${userToDelete?.email || userId}`,
      before_data: userToDelete,
      module_name: "admin",
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Usuário excluído com sucesso",
        deletedUser: userToDelete?.email,
      }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 400, headers: { ...corsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
