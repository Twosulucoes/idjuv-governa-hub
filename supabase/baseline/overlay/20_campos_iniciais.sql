-- Formulários públicos e pedidos do servidor: quem não gere o módulo não escolhe status nem aprovação.
--
-- As policies de INSERT desses formulários só conferiam "quem é" (anon/true ou servidor_id próprio)
-- e deixavam o autor gravar qualquer valor nas demais colunas. Reproduzido em banco vazio:
--   * servidor inseriu solicitacoes_abono com status = 'aprovado' e aprovado_rh_por/em forjados;
--   * anon inseriu federacoes_esportivas com status = 'ativo' e analisado_por preenchido, e
--     cadastro_arbitros com status = 'aprovado' e protocolo escolhido por ele.
--
-- O trigger BEFORE INSERT abaixo devolve essas colunas ao valor inicial quando o autor atua como
-- `anon`/`authenticated` (papel da sessão) SEM acesso ao módulo que administra a tabela. Quem tem o módulo (a equipe
-- que cadastra em nome de outra pessoa) e os caminhos internos (funções SECURITY DEFINER, service
-- role) não são afetados. Argumentos do trigger: módulo, depois coluna=valor (NULL = nulo; @uid =
-- auth.uid()). Colunas que a tabela não tem são ignoradas, então uma lista serve a tabelas parecidas.
-- O nome começa com "trg_forcar" para rodar ANTES de triggers que preenchem protocolo.

-- SECURITY DEFINER porque `anon` não tem EXECUTE em can_access_module (nem deve ter). Dentro de uma
-- função definer current_user vira o dono, então o papel de quem chamou vem do GUC `role` (o PostgREST
-- faz SET LOCAL ROLE anon/authenticated); service role e conexões diretas têm `role` = none/postgres.
CREATE OR REPLACE FUNCTION public.forcar_campos_iniciais()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ov jsonb := '{}'::jsonb;
  kv text;
  i int;
BEGIN
  IF coalesce(current_setting('role', true), 'none') IN ('anon', 'authenticated')
     AND NOT public.can_access_module(auth.uid(), TG_ARGV[0]) THEN
    FOR i IN 1 .. TG_NARGS - 1 LOOP
      kv := TG_ARGV[i];
      IF to_jsonb(NEW) ? split_part(kv, '=', 1) THEN
        ov := ov || jsonb_build_object(
          split_part(kv, '=', 1),
          CASE split_part(kv, '=', 2) WHEN 'NULL' THEN NULL WHEN '@uid' THEN auth.uid()::text ELSE split_part(kv, '=', 2) END
        );
      END IF;
    END LOOP;
    NEW := jsonb_populate_record(NEW, to_jsonb(NEW) || ov);
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('cadastro_arbitros',                'arbitros',           'status=enviado,protocolo=NULL,created_by=@uid'),
    ('cadastro_arbitros_modalidades',    'arbitros',           'status=pendente,observacoes=NULL,created_by=@uid'),
    ('federacoes_esportivas',            'federacoes',         'status=em_analise,observacoes_internas=NULL,analisado_por=NULL,data_analise=NULL,created_by=@uid'),
    ('gestores_escolares',               'gestores_escolares', 'status=aguardando,responsavel_id=NULL,responsavel_nome=NULL,observacoes=NULL,contato_realizado=false,acesso_testado=false,data_cadastro_cbde=NULL,data_contato=NULL,data_confirmacao=NULL,created_by=@uid'),
    ('solicitacoes_abono',               'rh',                 'status=pendente,aprovado_chefia_por=NULL,aprovado_chefia_em=NULL,aprovado_rh_por=NULL,aprovado_rh_em=NULL,observacao_aprovador=NULL,motivo_rejeicao=NULL,created_by=@uid'),
    ('justificativas_ponto',             'rh',                 'status=pendente,aprovador_id=NULL,data_aprovacao=NULL,observacao_aprovador=NULL,motivo_rejeicao=NULL,created_by=@uid'),
    ('solicitacoes_ajuste_ponto',        'rh',                 'status=pendente,aprovador_id=NULL,data_aprovacao=NULL,observacao_aprovador=NULL,motivo_rejeicao=NULL,created_by=@uid'),
    ('documentos_requerimento_servidor', 'rh',                 'status=pendente,created_by=@uid')
  ) AS v(tabela, modulo, campos)
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_forcar_campos_iniciais ON public.%I', r.tabela);
    EXECUTE format(
      'CREATE TRIGGER trg_forcar_campos_iniciais BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.forcar_campos_iniciais(%s)',
      r.tabela,
      (SELECT string_agg(quote_literal(x), ', ') FROM unnest(ARRAY[r.modulo] || string_to_array(r.campos, ',')) AS x)
    );
  END LOOP;
END $$;

-- Links gravados por quem envia o formulário público (foto e documentos do árbitro) aparecem como <a href>
-- na tela da equipe: `javascript:` ou um endereço de phishing viravam link clicável dentro do sistema.
-- Só ficam endereços do próprio bucket arbitros-docs (como o getPublicUrl do front os gera).
CREATE OR REPLACE FUNCTION public.sanear_urls_arbitros()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  j jsonb := to_jsonb(NEW);
  padrao constant text := '^https?://[^/]+/storage/v1/object/public/arbitros-docs/';
BEGIN
  IF coalesce(current_setting('role', true), 'none') IN ('anon', 'authenticated')
     AND NOT public.can_access_module(auth.uid(), 'arbitros') THEN
    IF j ? 'foto_url' AND j->>'foto_url' IS NOT NULL AND j->>'foto_url' !~ padrao THEN
      j := j || jsonb_build_object('foto_url', NULL);
    END IF;
    IF j ? 'documentos_urls' AND jsonb_typeof(j->'documentos_urls') = 'array' THEN
      j := j || jsonb_build_object('documentos_urls', COALESCE(
        (SELECT jsonb_agg(e) FROM jsonb_array_elements(j->'documentos_urls') e
          WHERE jsonb_typeof(e) = 'string' AND (e #>> '{}') ~ padrao), '[]'::jsonb));
    ELSIF j ? 'documentos_urls' THEN
      j := j || jsonb_build_object('documentos_urls', '[]'::jsonb);
    END IF;
    NEW := jsonb_populate_record(NEW, j);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_forcar_urls_arbitros ON public.cadastro_arbitros;
CREATE TRIGGER trg_forcar_urls_arbitros BEFORE INSERT OR UPDATE ON public.cadastro_arbitros
  FOR EACH ROW EXECUTE FUNCTION public.sanear_urls_arbitros();
DROP TRIGGER IF EXISTS trg_forcar_urls_arbitros ON public.cadastro_arbitros_modalidades;
CREATE TRIGGER trg_forcar_urls_arbitros BEFORE INSERT OR UPDATE ON public.cadastro_arbitros_modalidades
  FOR EACH ROW EXECUTE FUNCTION public.sanear_urls_arbitros();
