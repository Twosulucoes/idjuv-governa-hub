import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { montarCors } from "../_shared/cors.ts";

// CORS com allowlist por ambiente (ALLOWED_ORIGINS), em falha fechada: ver ../_shared/cors.ts.
function corsHeaders(req: Request) {
  return montarCors(req);
}

serve(async (req) => {
  const cors = corsHeaders(req);
  const responder = (corpo: Record<string, unknown>, status: number) =>
    new Response(JSON.stringify(corpo), { status, headers: { ...cors, "Content-Type": "application/json" } });

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return responder({ success: false, error: "Não autorizado" }, 401);
    }

    // Cliente no contexto do usuário (para validar identidade e permissão)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: requestingUser }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !requestingUser) {
      return responder({ success: false, error: "Usuário não autenticado" }, 401);
    }

    // Autorização: papel de administrador (is_admin_user). A permissão admin.usuarios, concedida por módulo ao papel `user`,
    // não basta: o usuário não consegue gerir papéis/módulos pela RLS e, aqui, tomaria a conta de qualquer não-administrador.
    const { data: temPermissao, error: permError } = await supabaseClient.rpc(
      "is_admin_user", { _user_id: requestingUser.id }
    );

    if (permError) {
      // Detalhe só no log; o cliente recebe a mensagem genérica.
      console.error("delete-user: falha ao validar permissões:", permError.code, permError.message);
      return responder({ success: false, error: "Falha ao validar permissões" }, 500);
    }

    if (!temPermissao) {
      return new Response(
        JSON.stringify({ success: false, error: "Acesso negado. Requer papel de administrador." }),
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
      return responder({ success: false, error: "ID do usuário não informado" }, 400);
    }

    if (userId === requestingUser.id) {
      return responder({ success: false, error: "Você não pode excluir sua própria conta" }, 400);
    }

    // Nenhum administrador é excluído por esta função (antes só um UUID fixo era protegido, e ele não
    // existe num banco novo). Para excluir um admin, outro admin tira o papel antes, e isso fica na trilha.
    const { data: alvoAdmin, error: alvoError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .limit(1);

    if (alvoError) {
      console.error("delete-user: falha ao verificar o usuário:", alvoError.code);
      return responder({ success: false, error: "Falha ao verificar o usuário" }, 500);
    }

    if ((alvoAdmin ?? []).length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Administradores não podem ser excluídos. Remova o papel de administrador antes.",
        }),
        { status: 403, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Buscar dados do usuário antes de excluir (para log)
    const { data: userToDelete } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .maybeSingle();

    // Trilha (onda E1): as gravações abaixo (user_modules, user_roles e o vínculo do perfil com o servidor) rodam
    // pela service role e entram em audit_logs com origem "sistema", sem autor. Esta linha complementar registra o
    // administrador que pediu, antes delas. Sem e-mail nem outro dado pessoal.
    const { error: trilhaError } = await supabaseAdmin.from("audit_logs").insert({
      action: "update",
      entity_type: "user",
      entity_id: userId,
      user_id: requestingUser.id,
      module_name: "admin",
      description: "Módulos, papéis e vínculo com o servidor removidos para excluir o usuário (delete-user)",
      metadata: { fonte: "delete-user", etapa: "remover_acessos" },
    });
    if (trilhaError) console.error("Falha ao registrar a trilha da exclusão de usuário:", trilhaError.code);

    // Excluir na ordem correta (devido às foreign keys)
    await supabaseAdmin.from("user_modules").delete().eq("user_id", userId);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    await supabaseAdmin.from("profiles").update({ servidor_id: null }).eq("id", userId);

    // Excluir do auth.users (cascata remove o profile)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("delete-user: falha ao excluir no Auth:", deleteError.status, deleteError.message);
      return responder({ success: false, error: "Erro ao excluir usuário" }, 500);
    }

    // Registrar no audit log
    await supabaseAdmin.from("audit_logs").insert({
      action: "delete",
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
    // Detalhe só no log; o cliente recebe a mensagem genérica.
    console.error("delete-user: erro inesperado:", error);
    return responder({ success: false, error: "Erro ao excluir usuário" }, 500);
  }
});
