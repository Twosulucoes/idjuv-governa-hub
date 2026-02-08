import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    // Criar cliente para verificar quem está fazendo a requisição
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verificar usuário autenticado
    const { data: { user: requestingUser }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !requestingUser) {
      throw new Error('Usuário não autenticado');
    }

    // Verificar se é admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: requestingUserRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .single();

    if (!requestingUserRole || requestingUserRole.role !== 'admin') {
      throw new Error('Apenas administradores podem excluir usuários');
    }

    // Obter ID do usuário a ser excluído
    const { userId } = await req.json();
    if (!userId) {
      throw new Error('ID do usuário não informado');
    }

    // Verificar se não está tentando excluir a si mesmo
    if (userId === requestingUser.id) {
      throw new Error('Você não pode excluir sua própria conta');
    }

    // Verificar se não é o super admin protegido
    const PROTECTED_SUPER_ADMIN_ID = 'b53e0eea-bf59-4de9-b71e-5d36d3c69bb8';
    if (userId === PROTECTED_SUPER_ADMIN_ID) {
      throw new Error('Este usuário é protegido e não pode ser excluído');
    }

    // Buscar dados do usuário antes de excluir (para log)
    const { data: userToDelete } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    // Excluir na ordem correta (devido às foreign keys)
    // 1. Remover módulos
    await supabaseAdmin
      .from('user_modules')
      .delete()
      .eq('user_id', userId);

    // 2. Remover role
    await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    // 3. Limpar vínculo de servidor (não excluir o profile, deixar o auth.users excluir em cascata)
    await supabaseAdmin
      .from('profiles')
      .update({ servidor_id: null })
      .eq('id', userId);

    // 4. Excluir do auth.users (isso vai excluir em cascata o profile)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteError) {
      throw new Error(`Erro ao excluir usuário: ${deleteError.message}`);
    }

    // Registrar no audit log
    await supabaseAdmin.from('audit_logs').insert({
      action: 'DELETE',
      entity_type: 'user',
      entity_id: userId,
      user_id: requestingUser.id,
      description: `Usuário excluído: ${userToDelete?.email || userId}`,
      before_data: userToDelete,
      module_name: 'admin'
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Usuário excluído com sucesso',
        deletedUser: userToDelete?.email 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
