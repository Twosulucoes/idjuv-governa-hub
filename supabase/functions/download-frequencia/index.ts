/**
 * Edge Function: Download de Pacotes de Frequência
 *
 * Fornece download autenticado de arquivos ZIP de frequência (URL assinada do bucket privado `frequencias`).
 *
 * Segurança (Onda B / B3, migração 20261010210000_onda_b_rh_storage.sql):
 * - exige token válido E, conferidos pelo banco com o id do usuário do token ANTES de qualquer leitura com a
 *   service role: módulo `rh` (can_access_module) e `rh.frequencia.visualizar` (has_permission_code), que já exigem
 *   perfil ativo; erro na checagem nega (403 genérico);
 * - só assina caminho relativo seguro (sem `/` inicial, segmento `.`/`..`, `%`, `\`, `?`, `#` nem caractere de
 *   controle: o parser de URL apaga tab/LF/CR e `.<tab>./` viraria `../`), a mesma regra do CHECK
 *   frequencia_pacotes_arquivo_path_seguro;
 * - o log leva só o id do usuário e um código, nunca e-mail, token, link ou caminho.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

// Mesma regra do CHECK frequencia_pacotes_arquivo_path_seguro: caminho relativo, sem segmento `.`/`..` e sem `%`,
// `\`, `?`, `#` ou caractere de controle (a service role assinaria qualquer objeto do bucket; o parser de URL apaga
// tab/LF/CR, então `.<tab>./` viraria `../` depois desta checagem).
function caminhoSeguro(caminho: unknown): caminho is string {
  if (typeof caminho !== 'string' || caminho === '' || caminho.startsWith('/')) return false;
  if (/[%\\?#]/.test(caminho)) return false;
  // caractere de controle (U+0000 a U+001F e U+007F), sem regex de controle (regra no-control-regex do ESLint)
  if ([...caminho].some((c) => c.charCodeAt(0) < 0x20 || c.charCodeAt(0) === 0x7f)) return false;
  return !caminho.split('/').some((segmento) => segmento === '.' || segmento === '..');
}

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

    // Autorização (Onda B / B3): módulo rh e rh.frequencia.visualizar (o mesmo da rota /rh/frequencia/pacotes),
    // conferidos pelo banco com o id do usuário do token ANTES de qualquer leitura com a service role. As duas
    // funções já exigem perfil ativo (profiles.is_active). Erro na checagem nega o acesso (falha fechada).
    const [acessoModulo, acessoPermissao] = await Promise.all([
      supabase.rpc('can_access_module', { _user_id: user.id, _module: 'rh' }),
      supabase.rpc('has_permission_code', { _user_id: user.id, _permission: 'rh.frequencia.visualizar' }),
    ]);

    if (
      acessoModulo.error || acessoPermissao.error ||
      acessoModulo.data !== true || acessoPermissao.data !== true
    ) {
      // Só o id do usuário e o código do erro no log (sem e-mail, token ou link).
      const codigoErro = acessoModulo.error?.code ?? acessoPermissao.error?.code;
      console.warn(
        `[download-frequencia] Acesso negado ao usuário ${user.id}` + (codigoErro ? ` (erro ${codigoErro})` : ''),
      );
      return new Response(
        JSON.stringify({ error: 'Acesso negado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[download-frequencia] Usuário ${user.id} solicitando pacote`);

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

    // Verificar se arquivo existe e se o caminho é seguro (resposta genérica nos dois casos)
    if (!pacote.arquivo_path || !caminhoSeguro(pacote.arquivo_path)) {
      if (pacote.arquivo_path) {
        console.warn(`[download-frequencia] Usuário ${user.id}: caminho_invalido no pacote ${pacote.id}`);
      }
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
        action: 'download',
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
