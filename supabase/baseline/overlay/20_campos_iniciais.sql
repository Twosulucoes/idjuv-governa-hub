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
-- Nos pedidos do RH (Onda B / B2) o módulo sozinho não isenta: é preciso também a permissão de decidir
-- (formato `perm:` do primeiro argumento, abaixo), e nunca na linha do próprio servidor. A migração
-- 20261010090000_onda_b_rh_permissoes.sql traz a mesma função e os mesmos triggers do RH.

-- SECURITY DEFINER porque `anon` não tem EXECUTE em can_access_module (nem deve ter). Dentro de uma
-- função definer current_user vira o dono, então o papel de quem chamou vem do GUC `role` (o PostgREST
-- faz SET LOCAL ROLE anon/authenticated); service role e conexões diretas têm `role` = none/postgres.
--
-- Primeiro argumento (quem fica isento, ou seja, pode gravar status/aprovação já no INSERT):
--   <módulo>                                   quem tem o módulo (formato original; tabelas de outros domínios)
--   perm:<módulo>:<código>[|<código>...][:<tabela_pai>.<coluna_fk> | :usuario]
--                                              quem tem o módulo E qualquer dos códigos (Onda B / B2: no RH,
--                                              ter o módulo sem a permissão não basta), e mesmo assim NÃO na
--                                              linha do próprio servidor (ninguém decide sobre o próprio pedido):
--                                              a posse é NEW.servidor_id ou, com <tabela_pai>.<coluna_fk>, o
--                                              servidor_id da linha pai, conferida por eh_meu_servidor() (vínculo
--                                              do perfil ou, sem vínculo, o CPF). Com `:usuario` a posse é o
--                                              USUÁRIO: NEW.servidor_id guarda o id de profiles (FK para
--                                              profiles(id), ex.: solicitacoes_ajuste_ponto) e é comparado com
--                                              auth.uid(). O papel admin é sempre isento.
CREATE OR REPLACE FUNCTION public.forcar_campos_iniciais()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ov jsonb := '{}'::jsonb;
  kv text;
  i int;
  isento boolean;
  partes text[];
  ref text[];
  posse uuid;
BEGIN
  IF coalesce(current_setting('role', true), 'none') NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;
  IF TG_ARGV[0] LIKE 'perm:%' THEN
    partes := string_to_array(TG_ARGV[0], ':');
    isento := public.can_access_module(auth.uid(), partes[2])
      AND EXISTS (SELECT 1 FROM unnest(string_to_array(partes[3], '|')) AS c(codigo)
                  WHERE public.has_permission_code(auth.uid(), c.codigo));
    IF isento AND NOT public.is_admin_user(auth.uid()) THEN
      IF partes[4] = 'usuario' THEN
        -- posse por usuário: a coluna servidor_id guarda o id de profiles
        IF (to_jsonb(NEW) ->> 'servidor_id')::uuid = auth.uid() THEN
          isento := false;
        END IF;
      ELSE
        IF partes[4] IS NOT NULL THEN
          ref := string_to_array(partes[4], '.');
          EXECUTE format('SELECT servidor_id FROM public.%I WHERE id = $1', ref[1])
            INTO posse USING (to_jsonb(NEW) ->> ref[2])::uuid;
        ELSE
          posse := (to_jsonb(NEW) ->> 'servidor_id')::uuid;
        END IF;
        IF public.eh_meu_servidor(posse) THEN
          isento := false;
        END IF;
      END IF;
    END IF;
  ELSE
    isento := public.can_access_module(auth.uid(), TG_ARGV[0]);
  END IF;
  IF NOT isento THEN
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
    -- RH (Onda B / B2): isento quem tem o módulo E rh.aprovar ou rh.frequencia.lancar, fora da própria linha
    -- (solicitacoes_ajuste_ponto.servidor_id tem FK para profiles(id): posse por usuário, `:usuario`)
    ('solicitacoes_abono',               'perm:rh:rh.aprovar|rh.frequencia.lancar', 'status=pendente,aprovado_chefia_por=NULL,aprovado_chefia_em=NULL,aprovado_rh_por=NULL,aprovado_rh_em=NULL,observacao_aprovador=NULL,motivo_rejeicao=NULL,created_by=@uid'),
    ('justificativas_ponto',             'perm:rh:rh.aprovar|rh.frequencia.lancar:registros_ponto.registro_ponto_id', 'status=pendente,aprovador_id=NULL,data_aprovacao=NULL,observacao_aprovador=NULL,motivo_rejeicao=NULL,created_by=@uid'),
    ('solicitacoes_ajuste_ponto',        'perm:rh:rh.aprovar|rh.frequencia.lancar:usuario', 'status=pendente,aprovador_id=NULL,data_aprovacao=NULL,observacao_aprovador=NULL,motivo_rejeicao=NULL,created_by=@uid'),
    -- B3 (migração 20261010210000): isento só quem tem o módulo E rh.servidores.editar, fora do próprio pedido; o
    -- servidor que pede o próprio documento não grava arquivo assinado, data do envio nem link de modelo
    ('documentos_requerimento_servidor', 'perm:rh:rh.servidores.editar', 'status=pendente,arquivo_assinado_url=NULL,data_upload_assinado=NULL,modelo_url=NULL,created_by=@uid')
  ) AS v(tabela, isencao, campos)
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_forcar_campos_iniciais ON public.%I', r.tabela);
    EXECUTE format(
      'CREATE TRIGGER trg_forcar_campos_iniciais BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.forcar_campos_iniciais(%s)',
      r.tabela,
      (SELECT string_agg(quote_literal(x), ', ') FROM unnest(ARRAY[r.isencao] || string_to_array(r.campos, ',')) AS x)
    );
  END LOOP;
END $$;

-- Formulário público de gestores escolares: o INSERT anônimo só cria pré-cadastro "aguardando" (igual à
-- migração 20261010170000; o trigger acima já força o status, a policy recusa em vez de corrigir).
DROP POLICY IF EXISTS "insercao_publica_gestores" ON public.gestores_escolares;
CREATE POLICY "insercao_publica_gestores" ON public.gestores_escolares FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'aguardando');

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
