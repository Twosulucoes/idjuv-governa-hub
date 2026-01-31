/**
 * Edge Function: Download de Pacotes de Frequência
 * 
 * Fornece download autenticado de arquivos ZIP de frequência
 * Valida link único e autenticação do usuário
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const linkDownload = url.searchParams.get('link');
    const action = url.searchParams.get('action') || 'download';

    // Validar parâmetros
    if (!linkDownload) {
      return new Response(
        JSON.stringify({ error: 'Link de download não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Autenticação necessária' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Erro de autenticação:', authError);
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[download-frequencia] Usuário ${user.email} solicitando link: ${linkDownload}`);

    // Buscar pacote pelo link
    const { data: pacote, error: pacoteError } = await supabase
      .from('frequencia_pacotes')
      .select('*')
      .eq('link_download', linkDownload)
      .single();

    if (pacoteError || !pacote) {
      console.error('Pacote não encontrado:', pacoteError);
      return new Response(
        JSON.stringify({ error: 'Pacote não encontrado ou link inválido' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se pacote foi gerado
    if (pacote.status !== 'gerado') {
      return new Response(
        JSON.stringify({ 
          error: 'Pacote ainda não foi gerado',
          status: pacote.status,
          message: pacote.status === 'gerando' 
            ? 'O pacote está sendo gerado. Aguarde alguns instantes.'
            : 'O pacote ainda não foi processado.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar expiração (se configurada)
    if (pacote.link_expira_em) {
      const expiraEm = new Date(pacote.link_expira_em);
      if (expiraEm < new Date()) {
        return new Response(
          JSON.stringify({ error: 'Link de download expirado' }),
          { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Se é apenas verificação de info
    if (action === 'info') {
      return new Response(
        JSON.stringify({
          success: true,
          pacote: {
            id: pacote.id,
            periodo: pacote.periodo,
            tipo: pacote.tipo,
            unidade_nome: pacote.unidade_nome,
            agrupamento_nome: pacote.agrupamento_nome,
            arquivo_nome: pacote.arquivo_nome,
            arquivo_tamanho: pacote.arquivo_tamanho,
            total_arquivos: pacote.total_arquivos,
            gerado_em: pacote.gerado_em,
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se arquivo existe
    if (!pacote.arquivo_path) {
      return new Response(
        JSON.stringify({ error: 'Arquivo do pacote não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar URL assinada para download
    const { data: signedUrl, error: signedError } = await supabase.storage
      .from('frequencias')
      .createSignedUrl(pacote.arquivo_path, 3600); // 1 hora

    if (signedError || !signedUrl) {
      console.error('Erro ao gerar URL assinada:', signedError);
      return new Response(
        JSON.stringify({ error: 'Erro ao gerar link de download' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[download-frequencia] URL gerada para pacote ${pacote.id}`);

    // Registrar acesso (log de auditoria)
    try {
      await supabase.from('audit_logs').insert({
        action: 'read',
        entity_type: 'frequencia_pacote',
        entity_id: pacote.id,
        user_id: user.id,
        description: `Download do pacote de frequências: ${pacote.arquivo_nome}`,
        metadata: {
          periodo: pacote.periodo,
          tipo: pacote.tipo,
          arquivo: pacote.arquivo_nome,
        },
      });
    } catch (auditErr) {
      console.warn('Erro ao registrar auditoria:', auditErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        download_url: signedUrl.signedUrl,
        arquivo_nome: pacote.arquivo_nome,
        expira_em: new Date(Date.now() + 3600000).toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[download-frequencia] Erro:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
