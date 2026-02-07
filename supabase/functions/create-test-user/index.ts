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
    const { email, password, role, modulos } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Criar usuário no auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirma o email
    });

    if (authError) {
      // Se usuário já existe, buscar o ID
      if (authError.message?.includes('already been registered')) {
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === email);
        
        if (existingUser) {
          // Atualizar permissões do usuário existente
          await supabaseAdmin.from('profiles').update({ is_active: true }).eq('id', existingUser.id);
          await supabaseAdmin.from('user_roles').upsert({ user_id: existingUser.id, role }, { onConflict: 'user_id' });
          
          // Limpar módulos antigos e adicionar novos
          await supabaseAdmin.from('user_modules').delete().eq('user_id', existingUser.id);
          if (modulos?.length > 0) {
            const modulosInsert = modulos.map((m: string) => ({ user_id: existingUser.id, module: m }));
            await supabaseAdmin.from('user_modules').insert(modulosInsert);
          }

          return new Response(
            JSON.stringify({ success: true, userId: existingUser.id, message: 'Usuário existente atualizado' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      throw authError;
    }

    const userId = authData.user!.id;

    // Ativar profile
    await supabaseAdmin.from('profiles').update({ 
      is_active: true,
      tipo_usuario: 'tecnico',
      full_name: 'Usuário de Teste'
    }).eq('id', userId);

    // Definir role
    await supabaseAdmin.from('user_roles').upsert({ user_id: userId, role: role || 'admin' }, { onConflict: 'user_id' });

    // Adicionar módulos
    if (modulos?.length > 0) {
      const modulosInsert = modulos.map((m: string) => ({ user_id: userId, module: m }));
      await supabaseAdmin.from('user_modules').insert(modulosInsert);
    }

    return new Response(
      JSON.stringify({ success: true, userId, message: 'Usuário criado com sucesso' }),
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
