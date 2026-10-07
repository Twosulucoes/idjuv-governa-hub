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
-- role) não são afetados. Argumentos do trigger: módulo, depois coluna=valor (NULL = nulo).
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
      ov := ov || jsonb_build_object(
        split_part(kv, '=', 1),
        CASE WHEN split_part(kv, '=', 2) = 'NULL' THEN NULL ELSE split_part(kv, '=', 2) END
      );
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
    ('cadastro_arbitros',                'arbitros',           'status=enviado,protocolo=NULL'),
    ('cadastro_arbitros_modalidades',    'arbitros',           'status=pendente,observacoes=NULL'),
    ('federacoes_esportivas',            'federacoes',         'status=em_analise,observacoes_internas=NULL,analisado_por=NULL,data_analise=NULL'),
    ('gestores_escolares',               'gestores_escolares', 'status=aguardando,responsavel_id=NULL,responsavel_nome=NULL,observacoes=NULL,contato_realizado=false,acesso_testado=false,data_cadastro_cbde=NULL,data_contato=NULL,data_confirmacao=NULL'),
    ('solicitacoes_abono',               'rh',                 'status=pendente,aprovado_chefia_por=NULL,aprovado_chefia_em=NULL,aprovado_rh_por=NULL,aprovado_rh_em=NULL'),
    ('justificativas_ponto',             'rh',                 'status=pendente,aprovador_id=NULL,data_aprovacao=NULL,observacao_aprovador=NULL'),
    ('solicitacoes_ajuste_ponto',        'rh',                 'status=pendente,aprovador_id=NULL,data_aprovacao=NULL,observacao_aprovador=NULL'),
    ('documentos_requerimento_servidor', 'rh',                 'status=pendente')
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
