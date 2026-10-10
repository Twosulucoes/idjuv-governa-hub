-- ============================================================================
-- Onda B / B3 — arquivos do RH no storage (frequencias, documentos-requerimento, documentos) e as tabelas
-- frequencia_pacotes/frequencia_arquivos/documentos_requerimento_servidor por permissão
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-10-onda-b-rh-storage-design.md
--
-- Premissas (ver a spec):
--   * Vale nos DOIS estados do banco, como a B1 e a B2:
--       (a) baseline (docs/NOVO_BANCO.md): policies `st_<bucket>_*` de storage por módulo (overlay/50), `rls_*` nas
--           tabelas e os overlays 10/40;
--       (b) só-migrações (replay): `acesso_total_*` em frequencia_pacotes/frequencia_arquivos/
--           documentos_requerimento_servidor e as policies antigas de storage (qualquer logado lê e grava em frequencias
--           e documentos-requerimento; em documentos grava e não lê).
--     Tudo é idempotente (CREATE OR REPLACE, DROP ... IF EXISTS, REVOKE/GRANT, UPDATE com valor fixo, CREATE INDEX IF
--     NOT EXISTS, CHECK criado só se não existir). As policies
--     antigas saem por NOME (as conhecidas das migrações), para não apagar o que a plataforma tenha criado; no fim, um
--     aviso (WARNING, não erro) lista qualquer outra policy de storage.objects que ainda cite estes buckets.
--   * Mesmo critério da B2: ler continua pelo módulo `rh` (mais o dono do arquivo); gravar exige o módulo E um código
--     que o catálogo já tem. Nenhum código novo.
--       frequencias + frequencia_pacotes/frequencia_arquivos .... gravar: rh.frequencia.lancar|criar|editar; o servidor
--                                                                 lê o PDF dele (frequencia_arquivos.arquivo_path)
--       documentos-requerimento + documentos_requerimento_servidor gravar: rh.servidores.editar; o servidor lê a pasta
--                                                                 dele (<servidor_id>/...) e não envia arquivo; na
--                                                                 tabela, lê e cria o próprio pedido (;insere_proprio),
--                                                                 sem status, arquivo assinado nem link de modelo
--                                                                 (forcar_campos_iniciais, isento por permissão)
--       documentos .............................................. por módulo (workflow ou rh), como o baseline: só
--                                                                 alinha o replay (inclui o SELECT que faltava)
--     Sem "nunca na própria" (;sem_autoaprovacao): o lote da unidade inclui o próprio RH e o arquivo é gerado, não
--     decidido. O dono do arquivo é o mesmo da RLS das tabelas (servidor_id = meu_servidor_id(), ;proprio).
--   * arquivo_path das duas tabelas de frequência só aceita caminho relativo sem `.`/`..`, `%`, `\`, `?`, `#` nem
--     caractere de controle (CHECK
--     NOT VALID: não reprova linha antiga; a Edge Function download-frequencia confere a mesma regra antes de assinar).
--   * Depende da B2 (forcar_campos_iniciais com o formato `perm:`, 20261010090000) e da B1 (has_permission_code/
--     can_access_module/is_active_user/meu_servidor_id exigem perfil ativo nos dois estados).
--
-- Blocos:
--   0. eh_meu_arquivo_frequencia(text) e eh_minha_pasta_servidor(text) (mesmo texto do overlay/10)
--   1. policies de frequencia_pacotes, frequencia_arquivos e documentos_requerimento_servidor — cópia literal de
--      supabase/baseline/rls/35_policies_geradas.sql (gerado de rls/mapa.csv; não editar à mão, regenerar). Antes: RLS
--      ligado e DROP das `acesso_total_*`. Depois: anon sem privilégio; authenticated sem TRUNCATE/TRIGGER/REFERENCES
--      (o baseline já faz isto no overlay/40). Trigger trg_forcar_campos_iniciais do pedido (mesmo texto do overlay/20).
--      CHECK de arquivo_path e índice em frequencia_arquivos(arquivo_path).
--   2. storage: policies `st_<bucket>_{select,insert,update,delete}` dos três buckets (mesmo texto do overlay/50),
--      buckets privados e limite de tamanho/tipo do bucket documentos-requerimento
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Funções auxiliares das policies de storage (antes delas: CREATE POLICY confere que a função existe)
-- ----------------------------------------------------------------------------
-- O objeto do bucket `frequencias` é o PDF de frequência do usuário logado? Verdadeira quando há uma linha em
-- frequencia_arquivos com arquivo_path = _path e servidor_id = meu_servidor_id() (o vínculo do perfil ativo: o mesmo dono
-- da RLS de frequencia_arquivos, ;proprio; sem vínculo, nada). Perfil ativo é pré-condição.
-- SECURITY DEFINER porque o servidor não precisa enxergar a linha de frequencia_arquivos pela RLS para ler o seu
-- PDF. Nunca devolve NULL. Mesmo texto em supabase/baseline/overlay/10_funcoes_acesso.sql.
CREATE OR REPLACE FUNCTION public.eh_meu_arquivo_frequencia(_path text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL
     AND _path IS NOT NULL
     AND public.is_active_user()
     AND EXISTS (
       SELECT 1
         FROM public.frequencia_arquivos fa
        WHERE fa.arquivo_path = _path
          AND fa.servidor_id = public.meu_servidor_id());
$$;

-- O objeto do bucket `documentos-requerimento` está na pasta do servidor do usuário logado? O caminho é
-- <servidor_id>/<doc_id>.<ext> (DocumentosServidorTab): a primeira pasta precisa ter formato de uuid (conferido ANTES
-- do cast, para nome fora do padrão dar false e não erro) e ser meu_servidor_id() (mesmo dono da RLS ;proprio).
-- Perfil ativo é pré-condição.
-- Nunca devolve NULL. Mesmo texto em supabase/baseline/overlay/10_funcoes_acesso.sql.
CREATE OR REPLACE FUNCTION public.eh_minha_pasta_servidor(_name text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_pasta text;
BEGIN
  IF _name IS NULL OR auth.uid() IS NULL OR NOT public.is_active_user() THEN
    RETURN false;
  END IF;
  v_pasta := (storage.foldername(_name))[1];
  IF v_pasta IS NULL
     OR v_pasta !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN false;
  END IF;
  RETURN coalesce(v_pasta::uuid = public.meu_servidor_id(), false);
END;
$$;

-- EXECUTE só para authenticated (as policies as chamam como o usuário; a service role não passa por RLS).
-- No baseline, o mesmo REVOKE/GRANT está em supabase/baseline/overlay/40_privilegios.sql.
REVOKE EXECUTE ON FUNCTION public.eh_meu_arquivo_frequencia(text) FROM PUBLIC, anon, service_role;
REVOKE EXECUTE ON FUNCTION public.eh_minha_pasta_servidor(text) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.eh_meu_arquivo_frequencia(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.eh_minha_pasta_servidor(text) TO authenticated;

-- ----------------------------------------------------------------------------
-- 1. Policies de frequencia_pacotes e frequencia_arquivos (classe permissao do gerador)
-- ----------------------------------------------------------------------------
-- Policies permissivas são OR: qualquer `acesso_total_*` (ou policy antiga) que sobrasse anularia a restrição; os nomes
-- do estado (b) são removidos antes de criar as geradas. As policies antigas de 20260131151603/20260202034622 já
-- tinham saído em 20260220132907; os DROP por nome (vindos de remover_policies no mapa) cobrem um banco que não a rodou.

-- frequencia_arquivos
ALTER TABLE public.frequencia_arquivos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acesso_total_select ON public.frequencia_arquivos;
DROP POLICY IF EXISTS acesso_total_insert ON public.frequencia_arquivos;
DROP POLICY IF EXISTS acesso_total_update ON public.frequencia_arquivos;
DROP POLICY IF EXISTS acesso_total_delete ON public.frequencia_arquivos;
-- (gerado por scripts/db/gerar-rls.mjs — classe permissao, módulo rh; os DROP dos nomes rls_* e de remover_policies vêm no próprio SQL gerado)
DROP POLICY IF EXISTS "Usuários autenticados podem inserir arquivos" ON public.frequencia_arquivos;
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar arquivos" ON public.frequencia_arquivos;
DROP POLICY IF EXISTS "rls_select" ON public.frequencia_arquivos;
CREATE POLICY "rls_select" ON public.frequencia_arquivos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.frequencia_arquivos;
CREATE POLICY "rls_insert" ON public.frequencia_arquivos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar')));
DROP POLICY IF EXISTS "rls_update" ON public.frequencia_arquivos;
CREATE POLICY "rls_update" ON public.frequencia_arquivos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar')));
DROP POLICY IF EXISTS "rls_delete" ON public.frequencia_arquivos;
CREATE POLICY "rls_delete" ON public.frequencia_arquivos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar')));

-- frequencia_pacotes
ALTER TABLE public.frequencia_pacotes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acesso_total_select ON public.frequencia_pacotes;
DROP POLICY IF EXISTS acesso_total_insert ON public.frequencia_pacotes;
DROP POLICY IF EXISTS acesso_total_update ON public.frequencia_pacotes;
DROP POLICY IF EXISTS acesso_total_delete ON public.frequencia_pacotes;
-- (gerado por scripts/db/gerar-rls.mjs — classe permissao, módulo rh; os DROP dos nomes rls_* e de remover_policies vêm no próprio SQL gerado)
DROP POLICY IF EXISTS "frequencia_pacotes_update_rh" ON public.frequencia_pacotes;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar pacotes" ON public.frequencia_pacotes;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir pacotes" ON public.frequencia_pacotes;
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar pacotes" ON public.frequencia_pacotes;
DROP POLICY IF EXISTS "rls_select" ON public.frequencia_pacotes;
CREATE POLICY "rls_select" ON public.frequencia_pacotes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')));
DROP POLICY IF EXISTS "rls_insert" ON public.frequencia_pacotes;
CREATE POLICY "rls_insert" ON public.frequencia_pacotes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar')));
DROP POLICY IF EXISTS "rls_update" ON public.frequencia_pacotes;
CREATE POLICY "rls_update" ON public.frequencia_pacotes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar')));
DROP POLICY IF EXISTS "rls_delete" ON public.frequencia_pacotes;
CREATE POLICY "rls_delete" ON public.frequencia_pacotes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar')));

-- documentos_requerimento_servidor
ALTER TABLE public.documentos_requerimento_servidor ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS acesso_total_select ON public.documentos_requerimento_servidor;
DROP POLICY IF EXISTS acesso_total_insert ON public.documentos_requerimento_servidor;
DROP POLICY IF EXISTS acesso_total_update ON public.documentos_requerimento_servidor;
DROP POLICY IF EXISTS acesso_total_delete ON public.documentos_requerimento_servidor;
-- (gerado por scripts/db/gerar-rls.mjs — classe permissao, módulo rh; os DROP dos nomes rls_* e de remover_policies vêm no próprio SQL gerado)
DROP POLICY IF EXISTS "Authenticated users can view" ON public.documentos_requerimento_servidor;
DROP POLICY IF EXISTS "Only creator or admin can delete" ON public.documentos_requerimento_servidor;
DROP POLICY IF EXISTS "RH users can insert" ON public.documentos_requerimento_servidor;
DROP POLICY IF EXISTS "RH users can update" ON public.documentos_requerimento_servidor;
DROP POLICY IF EXISTS "rls_select" ON public.documentos_requerimento_servidor;
CREATE POLICY "rls_select" ON public.documentos_requerimento_servidor FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_insert" ON public.documentos_requerimento_servidor;
CREATE POLICY "rls_insert" ON public.documentos_requerimento_servidor FOR INSERT TO authenticated
  WITH CHECK (((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.servidores.editar')) OR servidor_id = public.meu_servidor_id());
DROP POLICY IF EXISTS "rls_update" ON public.documentos_requerimento_servidor;
CREATE POLICY "rls_update" ON public.documentos_requerimento_servidor FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.servidores.editar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.servidores.editar'));
DROP POLICY IF EXISTS "rls_delete" ON public.documentos_requerimento_servidor;
CREATE POLICY "rls_delete" ON public.documentos_requerimento_servidor FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'rh')) AND public.has_permission_code(auth.uid(), 'rh.servidores.editar'));

-- ---- privilégios de tabela (estado (b): anon/authenticated tinham ALL; o baseline já faz isto no overlay/40) ----
-- anon não lê nem escreve nestas tabelas; TRUNCATE/TRIGGER/REFERENCES não servem à API. Idempotente.
REVOKE ALL ON public.frequencia_pacotes, public.frequencia_arquivos, public.documentos_requerimento_servidor FROM anon;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.frequencia_pacotes, public.frequencia_arquivos, public.documentos_requerimento_servidor FROM authenticated;

-- ---- pedido de documento: campos iniciais (mesmo texto de supabase/baseline/overlay/20_campos_iniciais.sql) ----
-- Antes (B2) quem tinha o módulo rh ficava isento. Agora o servidor cria o próprio pedido pela RLS (;insere_proprio) e
-- não pode nascer com o arquivo assinado, a data do envio, o link de modelo ou outro status: isento só quem tem o módulo
-- E rh.servidores.editar, e nunca no próprio pedido (formato perm: de forcar_campos_iniciais, criado na B2).
DROP TRIGGER IF EXISTS trg_forcar_campos_iniciais ON public.documentos_requerimento_servidor;
CREATE TRIGGER trg_forcar_campos_iniciais BEFORE INSERT ON public.documentos_requerimento_servidor
  FOR EACH ROW EXECUTE FUNCTION public.forcar_campos_iniciais('perm:rh:rh.servidores.editar', 'status=pendente', 'arquivo_assinado_url=NULL', 'data_upload_assinado=NULL', 'modelo_url=NULL', 'created_by=@uid');

-- ---- arquivo_path seguro e índice da busca por caminho ----
-- O caminho vai para createSignedUrl (Edge Function, service role) e para a policy st_frequencias_select: só caminho
-- relativo, sem segmento `.`/`..`, sem `%`, `\`, `?`, `#` nem caractere de controle (o parser de URL apaga tab/LF/CR:
-- `.<tab>./` viraria `../`) (NULL continua valendo em frequencia_pacotes). NOT VALID:
-- linhas antigas não são reprovadas, mas toda linha nova ou alterada passa pela regra. Mesmo texto nas duas tabelas.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['frequencia_pacotes', 'frequencia_arquivos'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_constraint
                    WHERE conrelid = ('public.' || t)::regclass AND conname = t || '_arquivo_path_seguro') THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (arquivo_path IS NULL OR (arquivo_path <> %L AND arquivo_path !~ %L AND arquivo_path !~ %L AND arquivo_path !~ %L AND arquivo_path !~ %L)) NOT VALID',
        t, t || '_arquivo_path_seguro', '', '^/', '[%\\?#]', '(^|/)\.\.?(/|$)', '[[:cntrl:]]');
    END IF;
  END LOOP;
END $$;
-- eh_meu_arquivo_frequencia (policy de leitura do bucket) procura a linha pelo caminho
CREATE INDEX IF NOT EXISTS idx_frequencia_arquivos_arquivo_path ON public.frequencia_arquivos USING btree (arquivo_path);

-- ----------------------------------------------------------------------------
-- 2. Storage (mesmo texto de supabase/baseline/overlay/50_storage.sql)
-- ----------------------------------------------------------------------------
-- Policies antigas destes três buckets, por nome (20260116221736, 20260131151603, 20260216171714 e os nomes que
-- 20260116221736 já removia), e as `st_<bucket>_*` (estado (a)), recriadas logo abaixo.
DO $$
DECLARE nome text;
BEGIN
  FOREACH nome IN ARRAY ARRAY[
    -- documentos (20260116221736)
    'Usuarios autenticados podem fazer upload de documentos', 'Usuarios autenticados podem atualizar documentos',
    'Usuarios autenticados podem deletar documentos', 'Admins podem fazer upload de documentos',
    'Managers podem fazer upload de documentos', 'Admins podem atualizar documentos', 'Admins podem deletar documentos',
    -- frequencias (20260131151603)
    'Usuários autenticados podem visualizar frequências', 'Usuários autenticados podem inserir frequências',
    'Usuários autenticados podem atualizar frequências',
    -- documentos-requerimento (20260216171714)
    'Auth users can upload docs', 'Auth users can view docs', 'Auth users can update docs', 'Auth users can delete docs',
    -- baseline (overlay/50)
    'st_documentos_select', 'st_documentos_insert', 'st_documentos_update', 'st_documentos_delete',
    'st_frequencias_select', 'st_frequencias_insert', 'st_frequencias_update', 'st_frequencias_delete',
    'st_documentos-requerimento_select', 'st_documentos-requerimento_insert',
    'st_documentos-requerimento_update', 'st_documentos-requerimento_delete'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', nome);
  END LOOP;
END $$;

-- frequencias: ler com o módulo rh ou sendo o dono do PDF; gravar com o módulo E rh.frequencia.lancar|criar|editar.
CREATE POLICY "st_frequencias_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'frequencias' AND (public.can_access_module(auth.uid(), 'rh') OR public.eh_meu_arquivo_frequencia(name)));
CREATE POLICY "st_frequencias_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'frequencias' AND (public.can_access_module(auth.uid(), 'rh') AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar'))));
CREATE POLICY "st_frequencias_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'frequencias' AND (public.can_access_module(auth.uid(), 'rh') AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar'))))
  WITH CHECK (bucket_id = 'frequencias' AND (public.can_access_module(auth.uid(), 'rh') AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar'))));
CREATE POLICY "st_frequencias_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'frequencias' AND (public.can_access_module(auth.uid(), 'rh') AND (public.has_permission_code(auth.uid(), 'rh.frequencia.lancar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.criar') OR public.has_permission_code(auth.uid(), 'rh.frequencia.editar'))));

-- documentos-requerimento: ler com o módulo rh ou sendo a pasta do próprio servidor; gravar com o módulo E
-- rh.servidores.editar (o servidor não envia arquivo).
CREATE POLICY "st_documentos-requerimento_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documentos-requerimento' AND (public.can_access_module(auth.uid(), 'rh') OR public.eh_minha_pasta_servidor(name)));
CREATE POLICY "st_documentos-requerimento_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documentos-requerimento' AND (public.can_access_module(auth.uid(), 'rh') AND public.has_permission_code(auth.uid(), 'rh.servidores.editar')));
CREATE POLICY "st_documentos-requerimento_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'documentos-requerimento' AND (public.can_access_module(auth.uid(), 'rh') AND public.has_permission_code(auth.uid(), 'rh.servidores.editar')))
  WITH CHECK (bucket_id = 'documentos-requerimento' AND (public.can_access_module(auth.uid(), 'rh') AND public.has_permission_code(auth.uid(), 'rh.servidores.editar')));
CREATE POLICY "st_documentos-requerimento_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documentos-requerimento' AND (public.can_access_module(auth.uid(), 'rh') AND public.has_permission_code(auth.uid(), 'rh.servidores.editar')));

-- documentos: por módulo (workflow ou rh) nos quatro comandos, como o laço do overlay/50.
CREATE POLICY "st_documentos_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documentos' AND (public.can_access_module(auth.uid(), 'workflow') OR public.can_access_module(auth.uid(), 'rh')));
CREATE POLICY "st_documentos_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documentos' AND (public.can_access_module(auth.uid(), 'workflow') OR public.can_access_module(auth.uid(), 'rh')));
CREATE POLICY "st_documentos_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'documentos' AND (public.can_access_module(auth.uid(), 'workflow') OR public.can_access_module(auth.uid(), 'rh')))
  WITH CHECK (bucket_id = 'documentos' AND (public.can_access_module(auth.uid(), 'workflow') OR public.can_access_module(auth.uid(), 'rh')));
CREATE POLICY "st_documentos_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documentos' AND (public.can_access_module(auth.uid(), 'workflow') OR public.can_access_module(auth.uid(), 'rh')));

-- Os três buckets são privados (o front abre por URL assinada); documentos-requerimento: 10 MB, PDF e imagem (como
-- documentos). Mesmos valores do INSERT ... ON CONFLICT DO UPDATE do overlay/50.
UPDATE storage.buckets SET public = false WHERE id IN ('frequencias', 'documentos-requerimento', 'documentos');
UPDATE storage.buckets
   SET file_size_limit = 10485760,
       allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
 WHERE id = 'documentos-requerimento';

-- Aviso (não erro): policy de storage.objects fora das st_* acima que ainda valha para um destes buckets (compara
-- bucket_id com o nome, ou não filtra bucket_id e vale para todos). Policies permissivas são OR: uma assim, criada
-- fora das migrações, anularia a regra acima e precisa ser revista à mão.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
     WHERE schemaname = 'storage' AND tablename = 'objects'
       AND policyname !~ '^st_(frequencias|documentos|documentos-requerimento)_(select|insert|update|delete)$'
       AND (coalesce(qual, '') || ' ' || coalesce(with_check, ''))
           ~ ('bucket_id = (''(frequencias|documentos|documentos-requerimento)''|ANY \(ARRAY\[[^]]*''(frequencias|documentos|documentos-requerimento)'')'
              || '|^((?!bucket_id).)*$')
  LOOP
    RAISE WARNING 'storage.objects: a policy "%" também vale para frequencias/documentos/documentos-requerimento; revise (OR com as st_*)', r.policyname;
  END LOOP;
END $$;
