-- Teste da RLS do baseline, tabela a tabela, com personas reais (SET ROLE + claims do JWT).
-- Rodar via scripts/db/testar-rls.sh (como SUPERUSUÁRIO, num banco descartável que já recebeu
-- schema + overlay + rls). Lê supabase/baseline/rls/mapa.csv, semeia 1-2 linhas por tabela
-- (valores fictícios, FKs ignoradas com session_replication_role = replica) e verifica:
--
--   modulo           módulo do mapa vê/insere; outro módulo, sem módulo e inativo NÃO; admin vê; anon nega
--   catalogo         qualquer ativo lê; escrita só por módulo
--   catalogo_admin   qualquer ativo lê; escrita só do papel admin (módulo "admin" não basta)
--   admin            só o papel admin (módulo "admin" sozinho não basta; admin bloqueado não)
--   admin_leitura    só o admin lê; ninguém escreve por API (audit_logs)
--   trilha           o módulo lê; ninguém escreve por API (nem o admin)
--   publico_admin    anon e logados leem; só o admin escreve
--   proprio_*        o servidor A vê só o seu; B só o seu; sem módulo não vê o do outro; módulo vê ambos
--   proprio_user     cada usuário lê as suas linhas; admin lê todas; só admin escreve
--   permissao        módulo lê (;proprio/;pai: o servidor lê o seu, como proprio_leitura/proprio_filho; ;filho: lê a
--                    linha em que tem uma filha sua, ex.: a folha da própria ficha); escreve só quem tem módulo E o
--                    código do extra (persona perm_<código>: módulo + user_modules.permissions); o módulo sem a
--                    permissão e a permissão avulsa sem módulo (perm_avulsa_<código>, só user_permissions) NÃO
--                    escrevem; admin tudo; sem módulo não lê; anon nada. Com lista (escrita=a|b|c) há uma persona por
--                    código e CADA uma sozinha escreve; ;excluir=<código>|admin: só esse código (ou só o admin) apaga;
--                    ;insere_proprio: o servidor sem módulo insere o próprio pedido e não o de outro;
--                    ;sem_autoaprovacao: a persona com a permissão e dona da linha A só altera/apaga a linha B (com
--                    ;excluir=<código>, o DELETE com a persona desse código), e só insere para si pelo caminho da posse
--                    (;insere_proprio); ;posse=usuario: a posse é o perfil (uid), semeada com o uid de srv_a/srv_b, e a FK
--                    da coluna de posse decide (profiles exige ;posse=usuario; servidores o proíbe)
--                    ;leitura=a|b (E3): o módulo só lê com um dos códigos (persona perm_<código>); o módulo sozinho e a
--                    persona só com o código de escrita fora da lista não leem; a posse continua lendo a linha própria
--   proprio_leitura  ;coluna=<col>: posse por outra coluna (servidores: id); ;excluir=<código>: DELETE só com o código
--   excluir=ninguem  (modulo, permissao, proprio_leitura; E3) ninguém apaga pela API, nem o admin
--   altera=<c>       (modulo; P14 entrega 4) o UPDATE exige o módulo E o código (persona perm_<código>); o módulo sozinho
--                    lê, insere e não altera
--   coletor=<m>:<ops> (modulo e permissao; P14 entrega 4) o módulo do app de campo (mod_<m>, fora da coluna modulos) faz SÓ
--                    as operações listadas (select|insert|update): as outras são negadas, DELETE sempre
--   fechada          ninguém lê (nem admin)
--   preservar        profiles e denuncias: testes próprios no bloco "cobertura adicional"
--   UPDATE/DELETE    por tabela e persona (SET col = DEFAULT, sem WHERE: mede só a policy de UPDATE)
--   storage          SELECT/INSERT/UPDATE/DELETE por bucket e persona; upload anônimo só nas pastas do formulário
--                    arquivos do RH (B3): frequencias e documentos-requerimento gravam só com módulo E código; o
--                    servidor lê o próprio PDF/a própria pasta e não a de outro; documentos só por módulo
--   identidade/RPCs  auto-ativação, servidor_id alheio, injeção de SQL, SECURITY DEFINER sem checagem, privilégios
--                    padrão, campos que o autor não escolhe, links do formulário, fechamento de folha, views
--   RH (B2)          campos iniciais isentos por permissão (e nunca no próprio pedido); etapas do abono e do
--                    fechamento (trigger validar_etapa_frequencia: chefia rh.aprovar, RH rh.frequencia.lancar); casos da
--                    revisão de segurança (dados imutáveis, autoria forçada, posse por usuário, aprovador sem vínculo)
--   RH (E1)          autoria gravada pelo banco (autor forjado ignorado, também para o admin; created_* imutáveis;
--                    decisão = quem age, agora; só a origem sistema informa o autor); trilha com servidor, origem,
--                    campos alterados, máscara LGPD, IP/user agent; UPDATE sem mudança não grava; trilha imutável
--                    (postgres, service role, superusuário, modo réplica); folha (fechado_por, processado_por);
--                    etapa da frequência sem atalho de autoria do admin; registrar_evento; leitura da trilha do RH;
--                    cobertura de zz_fixar_autoria/fn_audit_trigger nas tabelas do RH do mapa
--   RH (E2)          índices da consulta da trilha; trilha dos arquivos de frequencias e documentos-requerimento
--                    (upload, troca, mover, exclusão; sem nome do caminho, user_metadata nem antes/depois)
--   RH (E3)          remessa CNAB e eSocial: folha fechada, número da remessa pelo banco, arquivo uma vez, cancelamento
--                    pela RPC, evento sem repetição, recibo, bucket remessas-cnab; contracheques só com
--                    rh.contracheques.visualizar ou financeiro.folha.processar (ou o próprio); sem DELETE em remessas/eventos
--   global           anon só nas exceções; nenhuma policy acesso_total; funções-stub não existem
--   P12              INSERT público de federações/árbitros só na situação inicial (sem depender do trigger); gestor só
--                    pela RPC (duplicidade neutra); limite por IP (PT429) nas RPCs e no INSERT público; permissões de
--                    outro usuário só para o próprio ou o admin; chefe da unidade só com rh/patrimonio
--   P14 (entrega 4)  app de coleta só com o que usa (coletor=), patrimonio.editar no UPDATE de bem, DELETE de bem só do
--                    admin, valor/data/forma de aquisição e situação só do admin (42501), estatística da campanha pelo
--                    trigger SECURITY DEFINER e patrimonio_decidir_baixa ainda baixando o bem
--
-- Cobertura é exigida: tabela sem linha semente, fora do mapa ou sem RLS é FALHA. As tabelas temporárias do teste
-- (mapa, persona, semeado...) são lidas por papéis com SET ROLE, então recebem GRANT explícito.
--
-- Saída: uma linha "FALHA ..." por violação e um resumo. Termina com erro se houver falha.

\set ON_ERROR_STOP on
\set QUIET on

CREATE TEMP TABLE mapa (tabela text, modulos text, classe text, confianca text, nota text, extra text, remover_policies text, anon text);
-- FORCE_NOT_NULL: campo vazio do CSV vira '' e não NULL. Com NULL, `m.anon <> 'insert'` dá NULL e o IF não
-- dispara: seis asserções por tabela ficavam mortas em 225 das 235 tabelas.
\copy mapa FROM 'supabase/baseline/rls/mapa.csv' WITH (FORMAT csv, HEADER, FORCE_NOT_NULL (modulos, nota, extra, remover_policies, anon))
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM mapa WHERE anon IS NULL OR modulos IS NULL OR extra IS NULL) THEN
    RAISE EXCEPTION 'mapa carregado com NULL em colunas que as asserções comparam (anon/modulos/extra)';
  END IF;
END $$;

CREATE TEMP TABLE resultado (nivel text, msg text);
CREATE TEMP TABLE semeado (tabela text PRIMARY KEY, ok boolean, id_a text, id_b text);
CREATE TEMP TABLE seed_erro (tabela text, msg text);
-- Valores fixos para CHECKs entre colunas (o gerador de sementes só entende CHECK de coluna única).
CREATE TEMP TABLE seed_ov (tabela text PRIMARY KEY, ov jsonb);
-- seed_row também roda com SET ROLE (anon/authenticated): as tabelas temporárias que ela usa precisam ser acessíveis
GRANT SELECT ON seed_ov TO PUBLIC;
GRANT INSERT ON seed_erro TO PUBLIC;
INSERT INTO seed_ov VALUES
  ('approval_delegations', '{"valid_from":"2020-01-01T00:00:00Z","valid_until":"2030-01-01T00:00:00Z"}'),
  ('participantes_reuniao', '{"nome_externo":"Convidado Teste"}'),
  ('publicacoes_legais', '{"contrato_id":"c0000000-0000-0000-0000-0000000000c1"}'),
  -- regra_lancamento já vem com uma linha por módulo (catálogo, UNIQUE em modulo): a linha de teste usa `arbitros`,
  -- apagada do catálogo logo depois das personas (bloco de sementes, em modo réplica)
  ('regra_lancamento', '{"modulo":"arbitros"}'),
  -- comissão de inventário, licitação ou fiscalização exige objeto (comissoes_objeto_obrigatorio_check): `outra` não
  ('comissoes', '{"tipo":"outra"}'),
  -- código da vaga em maiúsculas (vagas_cargo_codigo_check, migração 20261012150000)
  ('vagas_cargo', '{"codigo":"VAGA-TESTE.001"}'),
  -- um alvo por item (atos_remuneratorios_itens_alvo_check, migração 20261020100000)
  ('atos_remuneratorios_itens', '{"alvo":"parametro","cargo_id":null,"rubrica_id":null,"tipo_parametro":"teste_seed"}'),
  -- competência no dia 1 e item pendente do próprio mês (migração 20261026090000)
  ('fin_conciliacoes_mensais', '{"competencia":"2020-01-01","situacao":"rascunho","fechada_em":null,"fechada_por":null}'),
  ('fin_conciliacao_itens', '{"lado":"bancario","natureza":"debito","valor":1,"situacao":"pendente","origem":"mes","item_origem_id":null,"grupo":null,"regra":null,"re":null,"nob":null}'),
  -- empenho sem favorecido nem dotação só com origem fiplan (fin_empenhos_sistema_vinculos_check, migração 20261027090000)
  ('fin_empenhos', '{"origem":"fiplan","credor_codigo_fiplan":"2001.00001-1","credor_nome":"Credor Teste"}'),
  -- item do PCA: serviço do catálogo, sem PDM nem item de material (pca_itens_catalogo_check, migração 20261028090000)
  ('pca_itens', '{"tipo":"servico","codigo_servico":1,"codigo_pdm":null,"codigo_item":null,"quantidade":1,"valor_unitario":1,"mes_desejado":1,"numero_sei":"SEI-1","descricao":"Teste","unidade_fornecimento":"UN"}'),
  ('cat_sincronizacoes', '{"tipo":"pdm"}'),
  -- passagens aéreas (migração 20261031090000): CPF com 11 dígitos; pedido de instituição pelo nome; passageiro
  -- beneficiário (um dos dois); trecho a cotar, sem localizador
  ('passagem_beneficiarios', '{"cpf":"00000000191","nome":"Beneficiário Teste"}'),
  ('passagem_pedidos', '{"solicitante_tipo":"instituicao","solicitante_nome":"Federação Teste","situacao":"recebido","destino_uf":"RR","data_inicio":null,"data_fim":null}'),
  ('passagem_passageiros', '{"servidor_id":null,"viagem_id":null,"beneficiario_id":"b0000000-0000-0000-0000-0000000000b1"}'),
  ('passagem_trechos', '{"situacao":"a_cotar","localizador":null,"partida":null,"chegada":null}'),
  ('passagem_cotacoes', '{"escolhida":false,"partida":null,"chegada":null}'),
  -- anexo das passagens (migração 20261101090000): o caminho começa pelo id do pedido (passagem_anexos_caminho_pedido_check)
  ('passagem_anexos', '{"pedido_id":"d0000000-0000-0000-0000-0000000000d1","passageiro_id":null,"caminho":"d0000000-0000-0000-0000-0000000000d1/seed.pdf"}');
-- Segunda linha (B) de tabelas semeadas em dupla sem servidor_id (classe permissao;filho=): valores que
-- escapam de UNIQUE entre colunas (o gerador de sementes repete os mesmos valores fictícios).
CREATE TEMP TABLE seed_ov_b (tabela text PRIMARY KEY, ov jsonb);
INSERT INTO seed_ov_b VALUES
  ('folhas_pagamento', '{"competencia_mes": 2}');

-- ---------------------------------------------------------------- utilitários
-- Insere uma linha preenchendo as colunas NOT NULL sem padrão com valores fictícios.
-- ov = valores fixos por coluna. Devolve o id (text) da linha criada ou NULL se falhou.
CREATE FUNCTION pg_temp.seed_row(t text, ov jsonb DEFAULT '{}', ret boolean DEFAULT true) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
  cols text[] := '{}'; vals text[] := '{}'; r record; v text; novo text; chk text;
BEGIN
  ov := coalesce((SELECT o.ov FROM seed_ov o WHERE o.tabela = t), '{}'::jsonb) || ov;
  FOR r IN
    SELECT a.attnum, a.attname, a.attnotnull, a.atthasdef, a.atttypmod, ty.typname, ty.typcategory, ty.oid AS typoid
    FROM pg_attribute a JOIN pg_type ty ON ty.oid = a.atttypid
    WHERE a.attrelid = ('public.' || quote_ident(t))::regclass AND a.attnum > 0 AND NOT a.attisdropped
      AND a.attgenerated = '' AND a.attidentity = ''
    ORDER BY a.attnum
  LOOP
    IF ov ? r.attname THEN
      cols := cols || quote_ident(r.attname);
      vals := vals || coalesce(quote_literal(ov->>r.attname) || '::' || r.typname, 'NULL');
    ELSIF r.attnotnull AND NOT r.atthasdef THEN
      -- CHECK de coluna única (tipo IN ('a','b'), mes BETWEEN 1 AND 12...): usa o primeiro literal do CHECK
      chk := (SELECT pg_get_constraintdef(c.oid) FROM pg_constraint c
              WHERE c.conrelid = ('public.' || quote_ident(t))::regclass AND c.contype = 'c' AND c.conkey = ARRAY[r.attnum::smallint] LIMIT 1);
      v := CASE
        WHEN chk IS NOT NULL AND r.typcategory = 'S' AND chk ~ '''[^'']+''' THEN quote_literal((regexp_match(chk, '''([^'']+)'''))[1])
        WHEN chk IS NOT NULL AND r.typcategory = 'N' AND chk ~ '-?[0-9]+' THEN (regexp_match(chk, '(-?[0-9]+)'))[1]
        WHEN r.typcategory = 'E' THEN (SELECT quote_literal(enumlabel) FROM pg_enum WHERE enumtypid = r.typoid ORDER BY enumsortorder LIMIT 1)
        WHEN r.typname = 'uuid' THEN quote_literal(gen_random_uuid()::text)
        WHEN r.typcategory = 'S' THEN quote_literal(left('x' || md5(random()::text), CASE WHEN r.atttypmod > 4 THEN least(r.atttypmod - 4, 9) ELSE 9 END))
        WHEN r.typcategory = 'N' THEN '0'
        WHEN r.typcategory = 'B' THEN 'false'
        WHEN r.typname = 'date' THEN 'current_date'
        WHEN r.typname IN ('timestamp','timestamptz') THEN 'now()'
        WHEN r.typname IN ('time','timetz') THEN quote_literal('00:00')
        WHEN r.typcategory = 'T' THEN quote_literal('0')
        WHEN r.typname IN ('json','jsonb') THEN quote_literal('{}')
        WHEN r.typcategory = 'A' THEN quote_literal('{}')
        WHEN r.typname = 'bytea' THEN quote_literal('\x')
        ELSE NULL END;
      IF v IS NULL THEN RETURN NULL; END IF;
      cols := cols || quote_ident(r.attname);
      vals := vals || (v || '::' || CASE WHEN r.typcategory IN ('E','A') OR r.typname IN ('json','jsonb','uuid') THEN format_type(r.typoid, NULL) ELSE r.typname END);
    END IF;
  END LOOP;
  BEGIN
    IF NOT ret THEN
      -- sem RETURNING: para inserir como anon/servidor, que não têm SELECT
      EXECUTE format('INSERT INTO public.%I (%s) VALUES (%s)', t, array_to_string(cols, ','), array_to_string(vals, ','));
      RETURN 'ok';
    ELSIF array_length(cols, 1) IS NULL THEN
      EXECUTE format('INSERT INTO public.%I DEFAULT VALUES RETURNING to_jsonb(%I.*)->>''id''', t, t) INTO novo;
    ELSE
      EXECUTE format('INSERT INTO public.%I (%s) VALUES (%s) RETURNING to_jsonb(%I.*)->>''id''', t, array_to_string(cols, ','), array_to_string(vals, ','), t) INTO novo;
    END IF;
    RETURN coalesce(novo, 'sem-id');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO seed_erro VALUES (t, SQLERRM);
    RETURN NULL;
  END;
END $$;

-- Quantas linhas a persona enxerga (-1 = sem privilégio de tabela, ex.: anon).
CREATE FUNCTION pg_temp.sel(p_uid uuid, p_role text, t text) RETURNS int
LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', p_role)::text, true);
  EXECUTE format('SET LOCAL ROLE %I', p_role);
  BEGIN
    EXECUTE format('SELECT count(*) FROM public.%I', t) INTO n;
  EXCEPTION WHEN insufficient_privilege THEN n := -1;
  END;
  RESET ROLE;
  RETURN n;
END $$;

-- 'passou' se a RLS deixou a linha entrar (qualquer outro erro vem depois da RLS), 'negado' se 42501.
-- Nada é gravado: a sub-transação é desfeita sempre.
CREATE FUNCTION pg_temp.ins(p_uid uuid, p_role text, t text, cols text DEFAULT '', vals text DEFAULT '') RETURNS text
LANGUAGE plpgsql AS $$
DECLARE res text;
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', p_role)::text, true);
  EXECUTE format('SET LOCAL ROLE %I', p_role);
  BEGIN
    IF cols = '' THEN EXECUTE format('INSERT INTO public.%I DEFAULT VALUES', t);
    ELSE EXECUTE format('INSERT INTO public.%I (%s) VALUES (%s)', t, cols, vals); END IF;
    RAISE EXCEPTION USING ERRCODE = 'P0099', MESSAGE = 'desfazer';
  EXCEPTION
    WHEN SQLSTATE '42501' THEN res := 'negado';
    WHEN SQLSTATE 'P0099' THEN res := 'passou';
    WHEN OTHERS THEN res := 'passou';
  END;
  RESET ROLE;
  RETURN res;
END $$;

-- Quantas linhas a persona consegue ALTERAR / APAGAR (-1 = sem privilégio ou barrada pela RLS).
-- Nada é gravado: a sub-transação é desfeita sempre. UPDATE atribui DEFAULT à primeira coluna: sem
-- WHERE nem referência a coluna, o comando NÃO exige visibilidade pelas policies de SELECT, então o
-- que se mede é só a policy de UPDATE (uma policy UPDATE ... USING (true) esquecida é pega).
CREATE FUNCTION pg_temp.upd(p_uid uuid, p_role text, t text) RETURNS int
LANGUAGE plpgsql AS $$
DECLARE n int := -1; col text;
BEGIN
  SELECT quote_ident(a.attname) INTO col FROM pg_attribute a
   WHERE a.attrelid = ('public.' || quote_ident(t))::regclass AND a.attnum > 0 AND NOT a.attisdropped AND a.attgenerated = ''
   ORDER BY a.attnum LIMIT 1;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', p_role)::text, true);
  EXECUTE format('SET LOCAL ROLE %I', p_role);
  BEGIN
    EXECUTE format('UPDATE public.%I SET %s = DEFAULT', t, col);
    GET DIAGNOSTICS n = ROW_COUNT;
    RAISE EXCEPTION USING ERRCODE = 'P0099', MESSAGE = 'desfazer';
  EXCEPTION
    WHEN SQLSTATE 'P0099' THEN NULL;
    WHEN SQLSTATE '42501' THEN n := -1;
    WHEN OTHERS THEN n := -2;   -- erro que não é de permissão: aparece como falha na asserção
  END;
  RESET ROLE;
  RETURN n;
END $$;

CREATE FUNCTION pg_temp.del(p_uid uuid, p_role text, t text) RETURNS int
LANGUAGE plpgsql AS $$
DECLARE n int := -1;
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', p_role)::text, true);
  EXECUTE format('SET LOCAL ROLE %I', p_role);
  BEGIN
    EXECUTE format('DELETE FROM public.%I', t);
    GET DIAGNOSTICS n = ROW_COUNT;
    RAISE EXCEPTION USING ERRCODE = 'P0099', MESSAGE = 'desfazer';
  EXCEPTION
    WHEN SQLSTATE 'P0099' THEN NULL;
    WHEN SQLSTATE '42501' THEN n := -1;
    WHEN OTHERS THEN n := -2;
  END;
  RESET ROLE;
  RETURN n;
END $$;

-- Executa um comando como a persona e devolve 'ok:<linhas>' ou 'erro:<sqlstate>:<mensagem>'.
-- Sempre desfaz (sub-transação) — serve para provar que uma operação é negada ou permitida.
CREATE FUNCTION pg_temp.sql_como(p_uid uuid, p_role text, p_sql text) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE res text; n bigint;
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', p_role)::text, true);
  EXECUTE format('SET LOCAL ROLE %I', p_role);
  BEGIN
    EXECUTE p_sql;
    GET DIAGNOSTICS n = ROW_COUNT;
    res := 'ok:' || n;
    RAISE EXCEPTION USING ERRCODE = 'P0099', MESSAGE = 'desfazer';
  EXCEPTION
    WHEN SQLSTATE 'P0099' THEN NULL;
    WHEN OTHERS THEN res := 'erro:' || SQLSTATE || ':' || left(SQLERRM, 90);
  END;
  RESET ROLE;
  RETURN res;
END $$;

-- Executa como a persona um comando com RETURNING de UMA coluna e devolve o valor (texto), 'vazio' (0 linhas) ou
-- 'erro:<sqlstate>:<mensagem>'. Sempre desfaz: serve para ler o que os triggers gravaram (ex.: autoria forçada).
CREATE FUNCTION pg_temp.valor_desfeito_como(p_uid uuid, p_role text, p_sql text) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE res text;
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', p_role)::text, true);
  EXECUTE format('SET LOCAL ROLE %I', p_role);
  BEGIN
    EXECUTE p_sql INTO res;
    res := coalesce(res, 'vazio');
    RAISE EXCEPTION USING ERRCODE = 'P0099', MESSAGE = 'desfazer';
  EXCEPTION
    WHEN SQLSTATE 'P0099' THEN NULL;
    WHEN OTHERS THEN res := 'erro:' || SQLSTATE || ':' || left(SQLERRM, 90);
  END;
  RESET ROLE;
  RETURN res;
END $$;

-- INSERT que PERSISTE, feito como a persona (para ler depois, como superusuário, o que os triggers gravaram).
CREATE FUNCTION pg_temp.insere_como(p_uid uuid, p_role text, t text, ov jsonb) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE res text;
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', p_role)::text, true);
  EXECUTE format('SET LOCAL ROLE %I', p_role);
  BEGIN
    res := pg_temp.seed_row(t, ov, false);
  EXCEPTION WHEN OTHERS THEN res := 'erro:' || SQLSTATE;
  END;
  RESET ROLE;
  RETURN coalesce(res, 'erro:seed');
END $$;

CREATE FUNCTION pg_temp.falha(msg text) RETURNS void LANGUAGE sql AS $$ INSERT INTO resultado VALUES ('FALHA', msg) $$;
CREATE FUNCTION pg_temp.nota(msg text) RETURNS void LANGUAGE sql AS $$ INSERT INTO resultado VALUES ('nota', msg) $$;

-- ---------------------------------------------------------------- personas
SET session_replication_role = replica;  -- semeia sem disparar triggers nem FKs
DO $$ BEGIN  -- vaga para a linha de teste de regra_lancamento (ver seed_ov); banco anterior à regra de setor: nada
  IF to_regclass('public.regra_lancamento') IS NOT NULL THEN DELETE FROM public.regra_lancamento WHERE modulo = 'arbitros'; END IF;
END $$;

CREATE TEMP TABLE persona (nome text PRIMARY KEY, uid uuid);
INSERT INTO persona VALUES
  ('admin',   'a0000000-0000-0000-0000-000000000001'),
  ('nenhum',  'a0000000-0000-0000-0000-000000000002'),
  ('inativo', 'a0000000-0000-0000-0000-000000000003'),
  ('srv_a',   'a0000000-0000-0000-0000-000000000004'),
  ('srv_b',   'a0000000-0000-0000-0000-000000000005'),
  ('admin_inativo', 'a0000000-0000-0000-0000-000000000006'),   -- papel admin, perfil bloqueado
  ('srv_inativo',   'a0000000-0000-0000-0000-000000000007');   -- servidor A, perfil bloqueado
INSERT INTO persona SELECT 'mod_' || e.enumlabel, md5('mod_' || e.enumlabel)::uuid
FROM pg_enum e JOIN pg_type ty ON ty.oid = e.enumtypid WHERE ty.typname = 'app_module';
-- Leitura do extra (sufixos ;chave[=valor] em qualquer ordem; ver o cabeçalho de scripts/db/gerar-rls.mjs)
-- códigos de escrita (classe permissao, e catalogo com extra escrita=a|b|c); NULL nas outras classes
CREATE FUNCTION pg_temp.codigos_escrita(classe text, extra text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN classe IN ('permissao', 'catalogo') THEN string_to_array((regexp_match(extra, '^escrita=([^;]+)'))[1], '|') END
$$;
-- ;excluir=<código>|admin|ninguem (permissao, proprio_leitura e, desde a E3, modulo; catalogo_admin só ninguem, regra
-- de setor); NULL se não há
CREATE FUNCTION pg_temp.excluir_de(classe text, extra text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN classe IN ('permissao', 'proprio_leitura', 'modulo', 'catalogo_admin') THEN (regexp_match(extra, '(^|;)excluir=([^;]+)'))[2] END
$$;
-- ;leitura=a|b (permissao, E3; trilha, passagens): códigos exigidos, além do módulo, para ler; NULL se não há (o módulo lê)
CREATE FUNCTION pg_temp.codigos_leitura(classe text, extra text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN classe IN ('permissao', 'trilha') THEN string_to_array((regexp_match(extra, '(^|;)leitura=([^;]+)'))[2], '|') END
$$;
-- altera=a|b (modulo, P14 entrega 4): códigos exigidos, além do módulo, para o UPDATE; NULL se não há
CREATE FUNCTION pg_temp.codigos_altera(classe text, extra text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN classe = 'modulo' THEN string_to_array((regexp_match(extra, '(^|;)altera=([^;]+)'))[2], '|') END
$$;
-- coletor=<módulo>:<ops> (modulo e permissao, P14 entrega 4): {módulo, op1, op2...} (ops em minúsculas); NULL se não há
CREATE FUNCTION pg_temp.coletor_de(classe text, extra text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN classe IN ('modulo', 'permissao') AND extra ~ '(^|;)coletor=' THEN
    ARRAY[(regexp_match(extra, '(^|;)coletor=([a-z_0-9]+):'))[2]]
    || string_to_array((regexp_match(extra, '(^|;)coletor=[a-z_0-9]+:([^;]+)'))[2], '|') END
$$;
-- true quando o extra traz o sufixo sem valor (ex.: proprio, insere_proprio, sem_autoaprovacao)
CREATE FUNCTION pg_temp.tem_sufixo(extra text, sufixo text) RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT sufixo = ANY (string_to_array(extra, ';'))
$$;

-- classe permissao: uma persona por código exigido no extra (cada código da lista escrita=a|b|c e o de ;excluir=),
-- com o(s) módulo(s) das tabelas que o exigem E o código em user_modules.permissions (a forma mais barata de
-- conceder permissão). proprio_leitura com ;excluir=<código> também ganha a persona do código.
CREATE TEMP TABLE persona_perm (nome text PRIMARY KEY, codigo text, modulos text[]);
INSERT INTO persona_perm
SELECT 'perm_' || codigo, codigo, array_agg(DISTINCT modulo)
FROM (SELECT c.codigo, unnest(string_to_array(m.modulos, '|')) AS modulo
      FROM mapa m
      CROSS JOIN LATERAL unnest(coalesce(pg_temp.codigos_escrita(m.classe, m.extra), '{}'::text[])
                                || coalesce(pg_temp.codigos_leitura(m.classe, m.extra), '{}'::text[])
                                || coalesce(pg_temp.codigos_altera(m.classe, m.extra), '{}'::text[])
                                || ARRAY[CASE WHEN pg_temp.excluir_de(m.classe, m.extra) NOT IN ('admin', 'ninguem')
                                              THEN pg_temp.excluir_de(m.classe, m.extra) END]) AS c(codigo)
      WHERE c.codigo IS NOT NULL) x
GROUP BY codigo;
INSERT INTO persona SELECT nome, md5(nome)::uuid FROM persona_perm;
-- e uma persona só com a permissão AVULSA (user_permissions), sem módulo: não pode escrever nem ler
INSERT INTO persona SELECT 'perm_avulsa_' || codigo, md5('perm_avulsa_' || codigo)::uuid FROM persona_perm;
-- usuários do Auth das personas (FKs de audit_logs/profiles apontam para auth.users; triggers estão desligados aqui)
INSERT INTO auth.users (id, email) SELECT uid, nome || '@teste.invalid' FROM persona;

DO $$
DECLARE p record; mm text; sa text := 'b0000000-0000-0000-0000-00000000000a'; sb text := 'b0000000-0000-0000-0000-00000000000b';
BEGIN
  FOR p IN SELECT * FROM persona LOOP
    PERFORM pg_temp.seed_row('profiles', jsonb_build_object('id', p.uid, 'email', p.nome || '@teste.invalid',
      'is_active', (p.nome NOT IN ('inativo', 'admin_inativo', 'srv_inativo')), 'tipo_usuario', 'servidor',
      'servidor_id', CASE p.nome WHEN 'srv_a' THEN sa WHEN 'srv_inativo' THEN sa WHEN 'srv_b' THEN sb ELSE NULL END));
  END LOOP;
  PERFORM pg_temp.seed_row('user_roles', jsonb_build_object('user_id', (SELECT uid FROM persona WHERE nome='admin'), 'role', 'admin'));
  PERFORM pg_temp.seed_row('user_roles', jsonb_build_object('user_id', (SELECT uid FROM persona WHERE nome='admin_inativo'), 'role', 'admin'));
  FOR p IN SELECT * FROM persona WHERE nome LIKE 'mod_%' LOOP
    PERFORM pg_temp.seed_row('user_modules', jsonb_build_object('user_id', p.uid, 'module', substr(p.nome, 5)));
  END LOOP;
  PERFORM pg_temp.seed_row('user_modules', jsonb_build_object('user_id', (SELECT uid FROM persona WHERE nome='inativo'), 'module', 'rh'));
  FOR p IN SELECT pp.*, pe.uid FROM persona_perm pp JOIN persona pe ON pe.nome = pp.nome LOOP
    FOREACH mm IN ARRAY p.modulos LOOP
      PERFORM pg_temp.seed_row('user_modules', jsonb_build_object('user_id', p.uid, 'module', mm,
        'permissions', '{' || p.codigo || '}'));
    END LOOP;
  END LOOP;
  FOR p IN SELECT pp.codigo, pe.uid FROM persona_perm pp JOIN persona pe ON pe.nome = 'perm_avulsa_' || pp.codigo LOOP
    PERFORM pg_temp.seed_row('user_permissions', jsonb_build_object('user_id', p.uid, 'permission', p.codigo));
  END LOOP;
  -- uma permissão avulsa de alguém que não é persona (só para haver linha a UPDATE/DELETE)
  PERFORM pg_temp.seed_row('user_permissions', jsonb_build_object('user_id', 'f0000000-0000-0000-0000-000000000001'));
END $$;

-- ---------------------------------------------------------------- semeadura por tabela
-- Posse própria: {pai, fk} para proprio_filho (extra=pai=...) e permissao (extra=escrita=...;pai=...); NULL se não há.
CREATE FUNCTION pg_temp.pai_de(classe text, extra text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN classe = 'proprio_filho' THEN regexp_match(extra, '^pai=([a-z0-9_]+)\.([a-z0-9_]+)')
              WHEN classe = 'permissao' THEN regexp_match(extra, ';pai=([a-z0-9_]+)\.([a-z0-9_]+)(;|$)') END
$$;
-- Posse derivada: {filha, fk} para permissao (extra=escrita=...;filho=<filha>.<fk>): o servidor lê a linha
-- referenciada por uma filha sua (filha.servidor_id); NULL se não há.
CREATE FUNCTION pg_temp.filho_de(classe text, extra text) RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN classe = 'permissao' THEN regexp_match(extra, ';filho=([a-z0-9_]+)\.([a-z0-9_]+)(;|$)') END
$$;
-- true quando o próprio servidor lê por uma coluna da linha (proprio_leitura, proprio, permissao;proprio)
CREATE FUNCTION pg_temp.proprio_de(classe text, extra text) RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT classe IN ('proprio_leitura', 'proprio') OR (classe = 'permissao' AND pg_temp.tem_sufixo(extra, 'proprio'))
$$;
-- coluna de posse de proprio_de (;coluna=<col>; padrão servidor_id)
CREATE FUNCTION pg_temp.coluna_posse(extra text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT coalesce((regexp_match(extra, '(^|;)coluna=([a-z0-9_]+)'))[2], 'servidor_id')
$$;
-- true quando a posse é do USUÁRIO (permissao;posse=usuario): a coluna de posse (ou o servidor_id do pai) guarda o id
-- de profiles (FK para profiles(id)), não o do servidor. A semente usa então o uid da persona (srv_a/srv_b).
CREATE FUNCTION pg_temp.posse_usuario(extra text) RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT pg_temp.tem_sufixo(extra, 'posse=usuario')
$$;
-- true quando o servidor também INSERE a linha sua (proprio; proprio_filho;insere; permissao;insere_proprio)
CREATE FUNCTION pg_temp.insere_proprio_de(classe text, extra text) RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT classe = 'proprio' OR (classe = 'proprio_filho' AND pg_temp.tem_sufixo(extra, 'insere'))
      OR (classe = 'permissao' AND pg_temp.tem_sufixo(extra, 'insere_proprio'))
$$;

DO $$
DECLARE m record; ida text; idb text; sa uuid := 'b0000000-0000-0000-0000-00000000000a'; sb uuid := 'b0000000-0000-0000-0000-00000000000b';
        pai text; fk text; pida text; pidb text; cx text[]; dupla boolean; filha text;
        -- posse por usuário (;posse=usuario): o dono é o perfil da persona, não o servidor (respeita a FK real)
        u_a uuid := (SELECT uid FROM persona WHERE nome = 'srv_a'); u_b uuid := (SELECT uid FROM persona WHERE nome = 'srv_b');
BEGIN
  -- posse derivada primeiro (permissao;filho=): linha A e linha B, cada uma com uma filha do servidor A / B
  FOR m IN SELECT * FROM mapa WHERE pg_temp.filho_de(classe, extra) IS NOT NULL LOOP
    cx := pg_temp.filho_de(m.classe, m.extra); filha := cx[1]; fk := cx[2];
    IF NOT EXISTS (SELECT 1 FROM semeado WHERE tabela = m.tabela) THEN
      ida := pg_temp.seed_row(m.tabela);
      idb := pg_temp.seed_row(m.tabela, coalesce((SELECT o.ov FROM seed_ov_b o WHERE o.tabela = m.tabela), '{}'::jsonb));
      INSERT INTO semeado VALUES (m.tabela, ida IS NOT NULL AND idb IS NOT NULL, ida, idb);
    END IF;
    SELECT id_a, id_b INTO ida, idb FROM semeado WHERE tabela = m.tabela;
    IF NOT EXISTS (SELECT 1 FROM semeado WHERE tabela = filha) THEN
      pida := pg_temp.seed_row(filha, jsonb_build_object(fk, ida, 'servidor_id', sa));
      pidb := pg_temp.seed_row(filha, jsonb_build_object(fk, idb, 'servidor_id', sb));
      INSERT INTO semeado VALUES (filha, pida IS NOT NULL AND pidb IS NOT NULL, pida, pidb);
    END IF;
  END LOOP;
  -- pais depois (proprio_filho e permissao;pai precisam de registros pai de A e de B)
  FOR m IN SELECT * FROM mapa WHERE pg_temp.pai_de(classe, extra) IS NOT NULL LOOP
    cx := pg_temp.pai_de(m.classe, m.extra);
    pai := cx[1];
    IF NOT EXISTS (SELECT 1 FROM semeado WHERE tabela = pai) THEN
      pida := pg_temp.seed_row(pai, jsonb_build_object('servidor_id', CASE WHEN pg_temp.posse_usuario(m.extra) THEN u_a ELSE sa END));
      pidb := pg_temp.seed_row(pai, jsonb_build_object('servidor_id', CASE WHEN pg_temp.posse_usuario(m.extra) THEN u_b ELSE sb END));
      INSERT INTO semeado VALUES (pai, pida IS NOT NULL AND pidb IS NOT NULL, pida, pidb);
    END IF;
  END LOOP;
  FOR m IN SELECT * FROM mapa WHERE classe NOT IN ('preservar') AND NOT EXISTS (SELECT 1 FROM semeado s WHERE s.tabela = mapa.tabela) LOOP
    dupla := pg_temp.proprio_de(m.classe, m.extra) OR pg_temp.pai_de(m.classe, m.extra) IS NOT NULL
             OR pg_temp.filho_de(m.classe, m.extra) IS NOT NULL OR m.classe = 'proprio_user';
    IF pg_temp.proprio_de(m.classe, m.extra) THEN
      ida := pg_temp.seed_row(m.tabela, jsonb_build_object(pg_temp.coluna_posse(m.extra), CASE WHEN pg_temp.posse_usuario(m.extra) THEN u_a ELSE sa END));
      idb := pg_temp.seed_row(m.tabela, jsonb_build_object(pg_temp.coluna_posse(m.extra), CASE WHEN pg_temp.posse_usuario(m.extra) THEN u_b ELSE sb END));
    ELSIF pg_temp.pai_de(m.classe, m.extra) IS NOT NULL THEN
      cx := pg_temp.pai_de(m.classe, m.extra); pai := cx[1]; fk := cx[2];
      SELECT id_a, id_b INTO pida, pidb FROM semeado WHERE tabela = pai;
      ida := pg_temp.seed_row(m.tabela, jsonb_build_object(fk, pida));
      idb := pg_temp.seed_row(m.tabela, jsonb_build_object(fk, pidb));
    ELSIF m.classe = 'proprio_user' AND m.tabela IN ('user_roles', 'user_modules', 'user_permissions') THEN
      -- tabelas de identidade: as linhas das personas JÁ são a semente (semear mais daria papel/módulo às personas)
      ida := 'personas'; idb := 'personas';
    ELSIF m.classe = 'proprio_user' THEN
      ida := pg_temp.seed_row(m.tabela, jsonb_build_object(substring(m.extra from 'coluna=(.+)'), (SELECT uid FROM persona WHERE nome = 'srv_a')));
      idb := pg_temp.seed_row(m.tabela, jsonb_build_object(substring(m.extra from 'coluna=(.+)'), (SELECT uid FROM persona WHERE nome = 'srv_b')));
    ELSE
      ida := pg_temp.seed_row(m.tabela); idb := NULL;
    END IF;
    INSERT INTO semeado VALUES (m.tabela, ida IS NOT NULL AND (idb IS NOT NULL OR NOT dupla), ida, idb);
  END LOOP;
END $$;

RESET session_replication_role;

-- ---------------------------------------------------------------- posse declarada x FK real
-- A semente roda com session_replication_role = replica (FKs desligadas): uma posse declarada por servidor numa
-- coluna cuja FK aponta para profiles(id) passava despercebida (banco_horas, solicitacoes_ajuste_ponto). Aqui a FK
-- da coluna de posse (ou do servidor_id do pai, com ;pai=) decide: profiles exige ;posse=usuario; servidores o proíbe.
DO $$
DECLARE m record; cx text[]; tab text; col text; alvo regclass;
BEGIN
  FOR m IN SELECT * FROM mapa WHERE classe = 'permissao' AND (pg_temp.proprio_de(classe, extra) OR pg_temp.pai_de(classe, extra) IS NOT NULL) LOOP
    IF pg_temp.proprio_de(m.classe, m.extra) THEN tab := m.tabela; col := pg_temp.coluna_posse(m.extra);
    ELSE cx := pg_temp.pai_de(m.classe, m.extra); tab := cx[1]; col := 'servidor_id';
    END IF;
    alvo := NULL;
    SELECT c.confrelid::regclass INTO alvo FROM pg_constraint c JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attname = col
     WHERE c.conrelid = ('public.' || quote_ident(tab))::regclass AND c.contype = 'f' AND c.conkey = ARRAY[a.attnum] LIMIT 1;
    IF alvo = 'public.profiles'::regclass AND NOT pg_temp.posse_usuario(m.extra) THEN
      PERFORM pg_temp.falha(format('%s: a posse (%s.%s) tem FK para profiles(id) e o mapa não declara ;posse=usuario', m.tabela, tab, col));
    ELSIF alvo = 'public.servidores'::regclass AND pg_temp.posse_usuario(m.extra) THEN
      PERFORM pg_temp.falha(format('%s: ;posse=usuario, mas %s.%s tem FK para servidores(id)', m.tabela, tab, col));
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------- asserções por tabela
-- Triggers desligados: um BEFORE INSERT que levanta erro roda ANTES da checagem de RLS e faria
-- um INSERT negado parecer 'passou'. A RLS em si continua valendo para o papel de teste.
SET session_replication_role = replica;

DO $$
DECLARE
  m record; mods text[]; mm text; ok_seed boolean; n int; r text; outro text;
  u_admin uuid := (SELECT uid FROM persona WHERE nome='admin');
  u_nenhum uuid := (SELECT uid FROM persona WHERE nome='nenhum');
  u_inativo uuid := (SELECT uid FROM persona WHERE nome='inativo');
  u_a uuid := (SELECT uid FROM persona WHERE nome='srv_a');
  u_b uuid := (SELECT uid FROM persona WHERE nome='srv_b');
  sa text := 'b0000000-0000-0000-0000-00000000000a'; sb text := 'b0000000-0000-0000-0000-00000000000b';
  pai text; fk text; cx text[]; pida text; pidb text; u_mod uuid; coluna text; u_perm uuid; u_avulsa uuid; codigo text; insere boolean;
  codigos text[]; outro_sv text;
  -- ;leitura=a|b (E3): códigos de leitura e a persona que lê as linhas pelo módulo (mod_<m> sem o sufixo)
  leit text[]; leitor text;
  -- dono das linhas A/B na coluna de posse (servidor; ou o perfil da persona com ;posse=usuario) e literais das
  -- linhas A/B no teste de ;sem_autoaprovacao
  dono_a text; dono_b text; lit_a text; lit_b text; pai_a text;
  colet text[];   -- coletor=<m>:<ops> (P14 entrega 4): {módulo, ops...}
  total int := 0;
BEGIN
  FOR m IN SELECT * FROM mapa WHERE classe NOT IN ('preservar') ORDER BY tabela LOOP
    total := total + 1;
    mods := string_to_array(nullif(m.modulos, ''), '|');
    codigos := pg_temp.codigos_escrita(m.classe, m.extra);
    codigo := array_to_string(codigos, '|');
    leit := pg_temp.codigos_leitura(m.classe, m.extra);
    leitor := CASE WHEN leit IS NULL THEN 'mod_' || mods[1] ELSE 'perm_' || leit[1] END;
    dono_a := CASE WHEN pg_temp.posse_usuario(m.extra) THEN u_a::text ELSE sa END;
    dono_b := CASE WHEN pg_temp.posse_usuario(m.extra) THEN u_b::text ELSE sb END;
    SELECT ok INTO ok_seed FROM semeado WHERE tabela = m.tabela;
    IF NOT coalesce(ok_seed, false) THEN PERFORM pg_temp.falha('sem linha de teste (cobertura incompleta; ajuste seed_ov): ' || m.tabela || ' [' || m.classe || '] ' || coalesce((SELECT msg FROM seed_erro WHERE tabela = m.tabela LIMIT 1), '')); END IF;

    -- anônimo: só o que o mapa declara na coluna anon (select|insert); o resto é negado
    IF m.anon = 'select' THEN
      IF pg_temp.sel(NULL, 'anon', m.tabela) = -1 THEN PERFORM pg_temp.falha(m.tabela || ': anon deveria ler (leitura pública declarada)'); END IF;
    ELSIF pg_temp.sel(NULL, 'anon', m.tabela) <> -1 THEN
      PERFORM pg_temp.falha(m.tabela || ': anon consegue SELECT');
    END IF;
    IF m.anon = 'insert' THEN
      IF pg_temp.ins(NULL, 'anon', m.tabela) = 'negado' THEN PERFORM pg_temp.falha(m.tabela || ': anon deveria inserir (formulário público declarado)'); END IF;
    ELSIF pg_temp.ins(NULL, 'anon', m.tabela) <> 'negado' THEN
      PERFORM pg_temp.falha(m.tabela || ': anon consegue INSERT');
    END IF;

    IF m.classe IN ('fechada') THEN
      FOREACH mm IN ARRAY ARRAY['admin','nenhum'] LOOP
        n := pg_temp.sel((SELECT uid FROM persona WHERE nome = mm), 'authenticated', m.tabela);
        IF n > 0 THEN PERFORM pg_temp.falha(m.tabela || ': tabela fechada visível para ' || mm); END IF;
      END LOOP;
      CONTINUE;
    END IF;

    -- sem módulo / inativo nunca escrevem; nunca leem (exceto catálogo e posse própria)
    IF pg_temp.ins(u_nenhum, 'authenticated', m.tabela) <> 'negado' AND m.classe <> 'proprio' AND m.classe <> 'proprio_filho' AND m.anon <> 'insert' THEN
      PERFORM pg_temp.falha(m.tabela || ': usuário sem módulo consegue INSERT');
    END IF;
    IF pg_temp.ins(u_inativo, 'authenticated', m.tabela) <> 'negado' AND m.classe NOT IN ('proprio','proprio_filho') AND m.anon <> 'insert' THEN
      PERFORM pg_temp.falha(m.tabela || ': usuário inativo consegue INSERT');
    END IF;
    IF m.classe NOT IN ('catalogo', 'catalogo_admin') AND m.anon <> 'select' AND coalesce(ok_seed, false) THEN
      IF pg_temp.sel(u_inativo, 'authenticated', m.tabela) > 0 THEN
        PERFORM pg_temp.falha(m.tabela || ': usuário inativo enxerga linhas');
      END IF;
    END IF;

    IF m.classe IN ('modulo','catalogo','proprio_leitura','proprio','proprio_filho','trilha','permissao') THEN
      -- cada módulo do mapa vê e escreve (trilha: ninguém escreve; permissao e catalogo com escrita=: o módulo sozinho
      -- não escreve)
      FOREACH mm IN ARRAY mods LOOP
        u_mod := (SELECT uid FROM persona WHERE nome = 'mod_' || mm);
        IF coalesce(ok_seed, false) THEN
          n := pg_temp.sel(u_mod, 'authenticated', m.tabela);
          IF leit IS NULL AND n < 1 THEN
            PERFORM pg_temp.falha(m.tabela || ': módulo ' || mm || ' não enxerga a linha');
          ELSIF leit IS NOT NULL AND n > 0 THEN   -- ;leitura=: o módulo sozinho não lê
            PERFORM pg_temp.falha(m.tabela || ': módulo ' || mm || ' SEM ' || array_to_string(leit, '|') || ' enxerga linhas (leitura=)');
          END IF;
        END IF;
        IF m.classe IN ('trilha', 'permissao') OR codigos IS NOT NULL THEN
          IF pg_temp.ins(u_mod, 'authenticated', m.tabela) <> 'negado' THEN
            PERFORM pg_temp.falha(m.tabela || ': módulo ' || mm || CASE WHEN m.classe = 'trilha'
              THEN ' consegue INSERT em trilha (só leitura)' ELSE ' SEM a permissão ' || codigo || ' consegue INSERT' END);
          END IF;
        ELSIF pg_temp.ins(u_mod, 'authenticated', m.tabela) = 'negado' THEN
          PERFORM pg_temp.falha(m.tabela || ': módulo ' || mm || ' não consegue INSERT');
        END IF;
      END LOOP;
      -- módulo alheio não vê nem escreve
      -- (o módulo do coletor também não conta como alheio)
      outro := (SELECT x FROM unnest(ARRAY['financeiro','rh','compras','patrimonio']) x
                WHERE x <> ALL (mods) AND x IS DISTINCT FROM (pg_temp.coletor_de(m.classe, m.extra))[1] LIMIT 1);
      u_mod := (SELECT uid FROM persona WHERE nome = 'mod_' || outro);
      IF m.classe <> 'catalogo' AND m.anon <> 'select' AND coalesce(ok_seed, false) AND pg_temp.sel(u_mod, 'authenticated', m.tabela) > 0 THEN
        PERFORM pg_temp.falha(m.tabela || ': módulo alheio (' || outro || ') enxerga linhas');
      END IF;
      IF pg_temp.ins(u_mod, 'authenticated', m.tabela) <> 'negado' AND m.classe NOT IN ('proprio','proprio_filho') AND m.anon <> 'insert' THEN
        PERFORM pg_temp.falha(m.tabela || ': módulo alheio (' || outro || ') consegue INSERT');
      END IF;
      -- admin (papel) tem acesso
      IF coalesce(ok_seed, false) AND pg_temp.sel(u_admin, 'authenticated', m.tabela) < 1 THEN
        PERFORM pg_temp.falha(m.tabela || ': papel admin não enxerga a linha');
      END IF;
      -- coletor=<m>:<ops> (P14 entrega 4): o módulo do app de campo lê/insere só se a operação está listada
      colet := pg_temp.coletor_de(m.classe, m.extra);
      IF colet IS NOT NULL THEN
        u_mod := (SELECT uid FROM persona WHERE nome = 'mod_' || colet[1]);
        IF colet[1] = ANY (mods) THEN PERFORM pg_temp.falha(m.tabela || ': o módulo do coletor (' || colet[1] || ') também está na coluna modulos'); END IF;
        IF coalesce(ok_seed, false) THEN
          n := pg_temp.sel(u_mod, 'authenticated', m.tabela);
          IF 'select' = ANY (colet) AND n < 1 THEN PERFORM pg_temp.falha(m.tabela || ': coletor ' || colet[1] || ' não enxerga a linha (select declarado)');
          ELSIF NOT ('select' = ANY (colet)) AND n > 0 THEN PERFORM pg_temp.falha(m.tabela || ': coletor ' || colet[1] || ' enxerga linhas sem select declarado'); END IF;
        END IF;
        r := pg_temp.ins(u_mod, 'authenticated', m.tabela);
        IF 'insert' = ANY (colet) AND r = 'negado' THEN PERFORM pg_temp.falha(m.tabela || ': coletor ' || colet[1] || ' não consegue INSERT (insert declarado)');
        ELSIF NOT ('insert' = ANY (colet)) AND r <> 'negado' THEN PERFORM pg_temp.falha(m.tabela || ': coletor ' || colet[1] || ' consegue INSERT sem insert declarado'); END IF;
      END IF;
    END IF;

    IF m.classe = 'catalogo' AND coalesce(ok_seed, false) THEN
      IF pg_temp.sel(u_nenhum, 'authenticated', m.tabela) < 1 THEN PERFORM pg_temp.falha(m.tabela || ': catálogo ilegível para usuário ativo'); END IF;
      IF pg_temp.sel(u_inativo, 'authenticated', m.tabela) > 0 THEN PERFORM pg_temp.falha(m.tabela || ': catálogo legível para usuário INATIVO'); END IF;
    ELSIF m.classe IN ('modulo','admin','trilha','admin_leitura','permissao') AND m.anon <> 'select' AND coalesce(ok_seed, false) THEN
      IF pg_temp.sel(u_nenhum, 'authenticated', m.tabela) > 0 THEN PERFORM pg_temp.falha(m.tabela || ': usuário sem módulo enxerga linhas'); END IF;
    END IF;

    -- escrita por permissão granular (classe permissao): o módulo lê e não escreve (bloco acima); escreve quem tem
    -- módulo E código (perm_<código>) ou o papel admin; a permissão avulsa sem módulo (perm_avulsa_<código>) não
    -- escreve nem lê (catalogo com escrita=: não escreve, mas lê como qualquer usuário ativo). A leitura própria
    -- (;proprio / ;pai / ;filho) é testada nos blocos de posse abaixo.
    IF m.classe = 'permissao' OR (m.classe = 'catalogo' AND codigos IS NOT NULL) THEN
      IF codigos IS NULL OR array_length(codigos, 1) IS NULL THEN
        PERFORM pg_temp.falha(m.tabela || ': extra da classe permissao sem escrita=<código> (' || m.extra || ')');
      END IF;
      -- lista escrita=a|b|c: CADA código sozinho (com o módulo) escreve
      FOREACH codigo IN ARRAY coalesce(codigos, '{}') LOOP
        u_perm := (SELECT uid FROM persona WHERE nome = 'perm_' || codigo);
        u_avulsa := (SELECT uid FROM persona WHERE nome = 'perm_avulsa_' || codigo);
        IF u_perm IS NULL OR u_avulsa IS NULL THEN PERFORM pg_temp.falha(m.tabela || ': sem persona para o código ' || codigo); CONTINUE; END IF;
        IF coalesce(ok_seed, false) THEN
          n := pg_temp.sel(u_perm, 'authenticated', m.tabela);
          IF (leit IS NULL OR codigo = ANY (leit)) AND n < 1 THEN
            PERFORM pg_temp.falha(m.tabela || ': quem tem ' || codigo || ' não enxerga a linha');
          ELSIF leit IS NOT NULL AND NOT (codigo = ANY (leit)) AND n > 0 THEN
            PERFORM pg_temp.falha(m.tabela || ': quem tem só ' || codigo || ' (escrita) enxerga linhas sem ' || array_to_string(leit, '|'));
          END IF;
        END IF;
        IF pg_temp.ins(u_perm, 'authenticated', m.tabela) = 'negado' THEN
          PERFORM pg_temp.falha(m.tabela || ': quem tem ' || codigo || ' não consegue INSERT');
        END IF;
        IF pg_temp.ins(u_avulsa, 'authenticated', m.tabela) <> 'negado' THEN
          PERFORM pg_temp.falha(m.tabela || ': permissão avulsa ' || codigo || ' SEM o módulo consegue INSERT');
        END IF;
        IF coalesce(ok_seed, false) AND m.classe = 'permissao' AND pg_temp.sel(u_avulsa, 'authenticated', m.tabela) > 0 THEN
          PERFORM pg_temp.falha(m.tabela || ': permissão avulsa ' || codigo || ' SEM o módulo enxerga linhas');
        END IF;
        -- ;sem_autoaprovacao: dono da linha A, com a permissão, não insere para si pelo caminho da permissão (só pelo da
        -- posse, com ;insere_proprio) e insere para o outro. Dono = profiles.servidor_id = A; com ;posse=usuario o dono é
        -- o próprio perfil (a linha própria leva o uid da persona; com ;pai=, o pai A passa a ser da persona)
        IF pg_temp.tem_sufixo(m.extra, 'sem_autoaprovacao') AND coalesce(ok_seed, false) THEN
          IF NOT pg_temp.posse_usuario(m.extra) THEN UPDATE public.profiles SET servidor_id = sa::uuid WHERE id = u_perm; END IF;
          IF pg_temp.proprio_de(m.classe, m.extra) THEN
            coluna := pg_temp.coluna_posse(m.extra);
            lit_a := quote_literal(CASE WHEN pg_temp.posse_usuario(m.extra) THEN u_perm::text ELSE sa END); outro_sv := quote_literal(dono_b);
          ELSE
            cx := pg_temp.pai_de(m.classe, m.extra); coluna := cx[2];
            SELECT id_a, quote_literal(id_a), quote_literal(id_b) INTO pai_a, lit_a, outro_sv FROM semeado WHERE tabela = cx[1];
            IF pg_temp.posse_usuario(m.extra) THEN EXECUTE format('UPDATE public.%I SET servidor_id = %L WHERE id = %L', cx[1], u_perm, pai_a); END IF;
          END IF;
          IF (pg_temp.ins(u_perm, 'authenticated', m.tabela, coluna, lit_a) = 'negado') = pg_temp.insere_proprio_de(m.classe, m.extra) THEN
            PERFORM pg_temp.falha(m.tabela || ': dono da linha com ' || codigo || CASE WHEN pg_temp.insere_proprio_de(m.classe, m.extra)
              THEN ' não insere o próprio pedido (caminho da posse)' ELSE ' insere linha para si mesmo (sem_autoaprovacao)' END);
          END IF;
          IF pg_temp.ins(u_perm, 'authenticated', m.tabela, coluna, outro_sv) = 'negado' THEN
            PERFORM pg_temp.falha(m.tabela || ': dono da linha A com ' || codigo || ' não insere linha do OUTRO servidor');
          END IF;
          UPDATE public.profiles SET servidor_id = NULL WHERE id = u_perm;
          IF pg_temp.posse_usuario(m.extra) AND NOT pg_temp.proprio_de(m.classe, m.extra) THEN
            EXECUTE format('UPDATE public.%I SET servidor_id = %L WHERE id = %L', cx[1], u_a, pai_a);
          END IF;
        END IF;
      END LOOP;
      -- ;leitura=a|b (E3): cada código, com o módulo, lê; sozinho (avulso) não lê; quem só lê não escreve
      FOREACH codigo IN ARRAY coalesce(leit, '{}') LOOP
        u_perm := (SELECT uid FROM persona WHERE nome = 'perm_' || codigo);
        u_avulsa := (SELECT uid FROM persona WHERE nome = 'perm_avulsa_' || codigo);
        IF u_perm IS NULL OR u_avulsa IS NULL THEN PERFORM pg_temp.falha(m.tabela || ': sem persona para o código de leitura ' || codigo); CONTINUE; END IF;
        IF coalesce(ok_seed, false) AND pg_temp.sel(u_perm, 'authenticated', m.tabela) < 1 THEN
          PERFORM pg_temp.falha(m.tabela || ': quem tem a leitura ' || codigo || ' (com o módulo) não enxerga a linha');
        END IF;
        IF coalesce(ok_seed, false) AND pg_temp.sel(u_avulsa, 'authenticated', m.tabela) > 0 THEN
          PERFORM pg_temp.falha(m.tabela || ': leitura avulsa ' || codigo || ' SEM o módulo enxerga linhas');
        END IF;
        IF NOT (codigo = ANY (coalesce(codigos, '{}'))) AND pg_temp.ins(u_perm, 'authenticated', m.tabela) <> 'negado' THEN
          PERFORM pg_temp.falha(m.tabela || ': quem só tem a leitura ' || codigo || ' consegue INSERT');
        END IF;
      END LOOP;
      IF pg_temp.ins(u_admin, 'authenticated', m.tabela) = 'negado' THEN PERFORM pg_temp.falha(m.tabela || ': papel admin não consegue INSERT'); END IF;
      IF pg_temp.ins((SELECT uid FROM persona WHERE nome='admin_inativo'), 'authenticated', m.tabela) <> 'negado' THEN PERFORM pg_temp.falha(m.tabela || ': admin BLOQUEADO consegue INSERT'); END IF;
    END IF;

    -- só o admin lê e ninguém escreve por API (audit_logs)
    IF m.classe = 'admin_leitura' AND coalesce(ok_seed, false) THEN
      IF pg_temp.sel(u_admin, 'authenticated', m.tabela) < 1 THEN PERFORM pg_temp.falha(m.tabela || ': admin não lê'); END IF;
      IF pg_temp.sel((SELECT uid FROM persona WHERE nome='admin_inativo'), 'authenticated', m.tabela) > 0 THEN PERFORM pg_temp.falha(m.tabela || ': admin BLOQUEADO lê'); END IF;
      IF pg_temp.ins(u_admin, 'authenticated', m.tabela) <> 'negado' THEN PERFORM pg_temp.falha(m.tabela || ': admin consegue INSERT por API'); END IF;
    END IF;

    -- portal público: anon e logado leem; só o papel admin escreve
    IF m.classe = 'publico_admin' AND coalesce(ok_seed, false) THEN
      IF pg_temp.sel(NULL, 'anon', m.tabela) < 1 THEN PERFORM pg_temp.falha(m.tabela || ': anon deveria ler o portal público'); END IF;
      IF pg_temp.sel(u_nenhum, 'authenticated', m.tabela) < 1 THEN PERFORM pg_temp.falha(m.tabela || ': usuário logado deveria ler'); END IF;
      IF pg_temp.ins(u_admin, 'authenticated', m.tabela) = 'negado' THEN PERFORM pg_temp.falha(m.tabela || ': admin não consegue INSERT'); END IF;
      IF pg_temp.ins((SELECT uid FROM persona WHERE nome='admin_inativo'), 'authenticated', m.tabela) <> 'negado' THEN PERFORM pg_temp.falha(m.tabela || ': admin BLOQUEADO consegue INSERT'); END IF;
    END IF;

    -- catálogo só-admin: todo usuário ativo lê; só o papel admin escreve (módulo "admin" não basta)
    IF m.classe = 'catalogo_admin' AND coalesce(ok_seed, false) THEN
      IF pg_temp.sel(u_nenhum, 'authenticated', m.tabela) < 1 THEN PERFORM pg_temp.falha(m.tabela || ': catálogo ilegível para usuário ativo sem módulo'); END IF;
      IF pg_temp.sel(u_inativo, 'authenticated', m.tabela) > 0 THEN PERFORM pg_temp.falha(m.tabela || ': catálogo legível para usuário INATIVO'); END IF;
      IF pg_temp.ins(u_admin, 'authenticated', m.tabela) = 'negado' THEN PERFORM pg_temp.falha(m.tabela || ': papel admin não consegue INSERT'); END IF;
      IF pg_temp.ins((SELECT uid FROM persona WHERE nome='mod_admin'), 'authenticated', m.tabela) <> 'negado' THEN PERFORM pg_temp.falha(m.tabela || ': módulo admin sem papel consegue INSERT'); END IF;
    END IF;

    -- configuração por usuário: cada um lê só as suas linhas; admin lê todas; escrita só do admin
    IF m.classe = 'proprio_user' AND m.tabela IN ('user_roles', 'user_modules', 'user_permissions') THEN
      -- quem não é admin só enxerga as próprias linhas; o admin vê todas; perfil bloqueado não vê nada
      IF pg_temp.sel(u_nenhum, 'authenticated', m.tabela) > 0 THEN PERFORM pg_temp.falha(m.tabela || ': usuário sem papel/módulo enxerga linhas'); END IF;
      IF pg_temp.sel((SELECT uid FROM persona WHERE nome='admin_inativo'), 'authenticated', m.tabela) > 0 THEN PERFORM pg_temp.falha(m.tabela || ': admin BLOQUEADO enxerga linhas'); END IF;
      IF m.tabela = 'user_modules' AND pg_temp.sel((SELECT uid FROM persona WHERE nome='mod_rh'), 'authenticated', m.tabela) <> 1 THEN PERFORM pg_temp.falha('user_modules: mod_rh deveria ver só a própria linha'); END IF;
      IF m.tabela = 'user_roles' AND pg_temp.sel(u_admin, 'authenticated', m.tabela) < 2 THEN PERFORM pg_temp.falha('user_roles: admin deveria ver todas as linhas'); END IF;
    ELSIF m.classe = 'proprio_user' AND coalesce(ok_seed, false) THEN
      IF pg_temp.sel(u_a, 'authenticated', m.tabela) <> 1 THEN PERFORM pg_temp.falha(m.tabela || ': srv_a deveria ver exatamente 1 linha (a sua)'); END IF;
      IF pg_temp.sel(u_b, 'authenticated', m.tabela) <> 1 THEN PERFORM pg_temp.falha(m.tabela || ': srv_b deveria ver exatamente 1 linha (a sua)'); END IF;
      IF pg_temp.sel(u_admin, 'authenticated', m.tabela) <> 2 THEN PERFORM pg_temp.falha(m.tabela || ': admin deveria ver as 2 linhas'); END IF;
      IF pg_temp.ins(u_a, 'authenticated', m.tabela, substring(m.extra from 'coluna=(.+)'), quote_literal(u_a)) <> 'negado' THEN PERFORM pg_temp.falha(m.tabela || ': usuário comum consegue INSERT'); END IF;
    END IF;

    IF m.classe = 'admin' THEN
      IF coalesce(ok_seed, false) AND pg_temp.sel(u_admin, 'authenticated', m.tabela) < 1 THEN PERFORM pg_temp.falha(m.tabela || ': papel admin não enxerga'); END IF;
      IF coalesce(ok_seed, false) AND pg_temp.sel((SELECT uid FROM persona WHERE nome='mod_admin'), 'authenticated', m.tabela) > 0 THEN
        PERFORM pg_temp.falha(m.tabela || ': módulo "admin" sem papel admin enxerga (deveria exigir o papel)');
      END IF;
      IF pg_temp.ins(u_admin, 'authenticated', m.tabela) = 'negado' THEN PERFORM pg_temp.falha(m.tabela || ': papel admin não consegue INSERT'); END IF;
    END IF;

    -- posse própria pela coluna servidor_id (proprio_leitura, proprio, permissao;proprio)
    IF pg_temp.proprio_de(m.classe, m.extra) AND coalesce(ok_seed, false) THEN
      IF pg_temp.sel(u_a, 'authenticated', m.tabela) <> 1 THEN PERFORM pg_temp.falha(m.tabela || ': srv_a deveria ver exatamente 1 linha (a sua)'); END IF;
      IF pg_temp.sel(u_b, 'authenticated', m.tabela) <> 1 THEN PERFORM pg_temp.falha(m.tabela || ': srv_b deveria ver exatamente 1 linha (a sua)'); END IF;
      IF pg_temp.sel((SELECT uid FROM persona WHERE nome=leitor), 'authenticated', m.tabela) <> 2 THEN
        PERFORM pg_temp.falha(m.tabela || ': ' || leitor || ' (leitura pelo módulo) deveria ver as 2 linhas');
      END IF;
      coluna := pg_temp.coluna_posse(m.extra);
      IF NOT pg_temp.insere_proprio_de(m.classe, m.extra) AND pg_temp.ins(u_a, 'authenticated', m.tabela, coluna, quote_literal(dono_a)) <> 'negado' THEN
        PERFORM pg_temp.falha(m.tabela || ': servidor consegue escrever em tabela só-leitura própria');
      END IF;
      IF pg_temp.insere_proprio_de(m.classe, m.extra) THEN
        IF pg_temp.ins(u_a, 'authenticated', m.tabela, coluna, quote_literal(dono_a)) = 'negado' THEN PERFORM pg_temp.falha(m.tabela || ': srv_a não consegue criar pedido para si'); END IF;
        IF pg_temp.ins(u_a, 'authenticated', m.tabela, coluna, quote_literal(dono_b)) <> 'negado' THEN PERFORM pg_temp.falha(m.tabela || ': srv_a consegue criar pedido em nome de OUTRO servidor'); END IF;
      END IF;
    END IF;
    -- posse pela tabela pai (proprio_filho, permissao;pai=)
    IF pg_temp.pai_de(m.classe, m.extra) IS NOT NULL AND coalesce(ok_seed, false) THEN
      cx := pg_temp.pai_de(m.classe, m.extra); pai := cx[1]; fk := cx[2];
      insere := pg_temp.insere_proprio_de(m.classe, m.extra);
      SELECT id_a, id_b INTO pida, pidb FROM semeado WHERE tabela = pai;
      IF pg_temp.sel(u_a, 'authenticated', m.tabela) <> 1 THEN PERFORM pg_temp.falha(m.tabela || ': srv_a deveria ver exatamente 1 linha (a sua)'); END IF;
      IF pg_temp.sel(u_b, 'authenticated', m.tabela) <> 1 THEN PERFORM pg_temp.falha(m.tabela || ': srv_b deveria ver exatamente 1 linha (a sua)'); END IF;
      IF pg_temp.sel((SELECT uid FROM persona WHERE nome=leitor), 'authenticated', m.tabela) <> 2 THEN
        PERFORM pg_temp.falha(m.tabela || ': ' || leitor || ' (leitura pelo módulo) deveria ver as 2 linhas');
      END IF;
      IF insere THEN
        IF pg_temp.ins(u_a, 'authenticated', m.tabela, fk, quote_literal(pida)) = 'negado' THEN PERFORM pg_temp.falha(m.tabela || ': srv_a não consegue criar registro no próprio pai'); END IF;
        IF pg_temp.ins(u_a, 'authenticated', m.tabela, fk, quote_literal(pidb)) <> 'negado' THEN PERFORM pg_temp.falha(m.tabela || ': srv_a consegue criar registro no pai de OUTRO servidor'); END IF;
      ELSIF pg_temp.ins(u_a, 'authenticated', m.tabela, fk, quote_literal(pida)) <> 'negado' THEN
        PERFORM pg_temp.falha(m.tabela || ': servidor consegue escrever em tabela só-leitura própria');
      END IF;
    END IF;
    -- posse derivada (permissao;filho=): o servidor lê a linha em que tem uma filha sua; não escreve
    IF pg_temp.filho_de(m.classe, m.extra) IS NOT NULL AND coalesce(ok_seed, false) THEN
      IF pg_temp.sel(u_a, 'authenticated', m.tabela) <> 1 THEN PERFORM pg_temp.falha(m.tabela || ': srv_a deveria ver exatamente 1 linha (a da sua filha)'); END IF;
      IF pg_temp.sel(u_b, 'authenticated', m.tabela) <> 1 THEN PERFORM pg_temp.falha(m.tabela || ': srv_b deveria ver exatamente 1 linha (a da sua filha)'); END IF;
      IF pg_temp.sel((SELECT uid FROM persona WHERE nome=leitor), 'authenticated', m.tabela) <> 2 THEN
        PERFORM pg_temp.falha(m.tabela || ': ' || leitor || ' (leitura pelo módulo) deveria ver as 2 linhas');
      END IF;
      IF pg_temp.ins(u_a, 'authenticated', m.tabela) <> 'negado' THEN
        PERFORM pg_temp.falha(m.tabela || ': servidor consegue escrever em tabela de posse derivada');
      END IF;
    END IF;
  END LOOP;
  PERFORM pg_temp.nota('tabelas verificadas (classe diferente de preservar): ' || total);
END $$;

-- Faz a persona p_uid "dona" da linha A da tabela: posse por servidor = profiles.servidor_id da persona vira o servidor
-- A; com ;posse=usuario, a coluna de posse da linha A (ou o servidor_id do pai A, com ;pai=) recebe o uid da persona.
-- desfazer = true volta ao estado da semente (vínculo nulo / linha de srv_a). Roda como superusuário (replica).
CREATE FUNCTION pg_temp.tornar_dono_a(t text, classe text, extra text, p_uid uuid, desfazer boolean DEFAULT false) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE cx text[]; u_a uuid := (SELECT uid FROM persona WHERE nome = 'srv_a'); id_linha text;
BEGIN
  IF NOT pg_temp.posse_usuario(extra) THEN
    UPDATE public.profiles SET servidor_id = CASE WHEN desfazer THEN NULL ELSE 'b0000000-0000-0000-0000-00000000000a'::uuid END
     WHERE id = p_uid;
  ELSIF pg_temp.proprio_de(classe, extra) THEN
    SELECT id_a INTO id_linha FROM semeado WHERE tabela = t;
    EXECUTE format('UPDATE public.%I SET %I = %L WHERE id = %L', t, pg_temp.coluna_posse(extra), CASE WHEN desfazer THEN u_a ELSE p_uid END, id_linha);
  ELSE
    cx := pg_temp.pai_de(classe, extra);
    SELECT id_a INTO id_linha FROM semeado WHERE tabela = cx[1];
    EXECUTE format('UPDATE public.%I SET servidor_id = %L WHERE id = %L', cx[1], CASE WHEN desfazer THEN u_a ELSE p_uid END, id_linha);
  END IF;
END $$;

-- ---------------------------------------------------------------- UPDATE e DELETE por tabela
-- Quem escreve: admin e o(s) módulo(s) do mapa. `trilha` ninguém; `admin`, `catalogo_admin` e
-- `proprio_user` só o papel admin. O servidor dono de uma linha (proprio_*) NÃO altera nem apaga.
-- permissao: cada código da lista escrita=; ;excluir=<código>|admin muda só o DELETE (também em proprio_leitura).
-- ;sem_autoaprovacao: a persona com a permissão e dona da linha A só alcança a linha B (UPDATE e DELETE; com
-- ;excluir=<código>, o DELETE é medido com a persona desse código).
-- modulo;altera=<código>: o UPDATE só com a persona do código (o módulo sozinho insere e apaga, salvo excluir=).
-- coletor=<m>:<ops>: mod_<m> altera só com update na lista e nunca apaga.
DO $$
DECLARE
  m record; mods text[]; pers record; autorizado boolean; n int; op text; outro text; checagens int := 0;
  perms text[]; avulsas text[]; excl text; perm_excl text; tem_mod boolean; codigo text; u_perm uuid;
  perms_alt text[]; colet text[];   -- altera= e coletor= (P14 entrega 4)
  sa uuid := 'b0000000-0000-0000-0000-00000000000a';
  u_a uuid := (SELECT uid FROM persona WHERE nome = 'srv_a');
BEGIN
  FOR m IN SELECT * FROM mapa WHERE classe NOT IN ('preservar', 'fechada') AND tabela IN (SELECT tabela FROM semeado WHERE ok) ORDER BY tabela LOOP
    mods := coalesce(string_to_array(nullif(m.modulos, ''), '|'), ARRAY[]::text[]);
    outro := (SELECT x FROM unnest(ARRAY['financeiro','rh','compras','patrimonio']) x WHERE x <> ALL (mods) LIMIT 1);
    perms := coalesce((SELECT array_agg('perm_' || c) FROM unnest(pg_temp.codigos_escrita(m.classe, m.extra)) c), '{}');
    avulsas := coalesce((SELECT array_agg('perm_avulsa_' || c) FROM unnest(pg_temp.codigos_escrita(m.classe, m.extra)) c), '{}');
    excl := pg_temp.excluir_de(m.classe, m.extra);
    perm_excl := CASE WHEN excl NOT IN ('admin', 'ninguem') THEN 'perm_' || excl END;
    perms_alt := coalesce((SELECT array_agg('perm_' || c) FROM unnest(pg_temp.codigos_altera(m.classe, m.extra)) c), '{}');
    colet := pg_temp.coletor_de(m.classe, m.extra);
    FOR pers IN SELECT * FROM persona
                WHERE nome IN ('admin','admin_inativo','nenhum','inativo','srv_a','srv_inativo','mod_admin','mod_' || outro)
                   OR nome = ANY (SELECT 'mod_' || x FROM unnest(mods) x)
                   OR nome = ANY (perms) OR nome = ANY (avulsas) OR nome = perm_excl
                   OR nome = ANY (perms_alt) OR nome = 'mod_' || colet[1] LOOP
      -- persona com algum módulo da tabela (mod_<m> ou perm_<código> cujo módulo é da tabela)
      tem_mod := (pers.nome LIKE 'mod_%' AND substr(pers.nome, 5) = ANY (mods))
                 OR EXISTS (SELECT 1 FROM persona_perm pp WHERE pp.nome = pers.nome AND pp.modulos && mods);
      FOREACH op IN ARRAY ARRAY['UPDATE', 'DELETE'] LOOP
        autorizado := CASE
          WHEN m.classe IN ('trilha', 'admin_leitura') THEN false
          WHEN op = 'DELETE' AND excl = 'ninguem' THEN false                 -- E3: ninguém apaga pela API, nem o admin
          WHEN m.classe IN ('admin', 'catalogo_admin', 'proprio_user', 'publico_admin') THEN pers.nome = 'admin'
          -- coletor=<m>:<ops>: o módulo do app de campo só faz o que está listado (DELETE nunca)
          WHEN colet IS NOT NULL AND pers.nome = 'mod_' || colet[1] THEN lower(op) = ANY (colet)
          WHEN op = 'DELETE' AND excl = 'admin' THEN pers.nome = 'admin'
          WHEN op = 'DELETE' AND excl IS NOT NULL THEN pers.nome = 'admin' OR pers.nome = perm_excl
          WHEN m.classe = 'permissao' OR cardinality(perms) > 0 THEN pers.nome = 'admin' OR pers.nome = ANY (perms)   -- módulo sozinho e permissão avulsa NÃO alteram nem apagam
          WHEN op = 'UPDATE' AND cardinality(perms_alt) > 0 THEN pers.nome = 'admin' OR pers.nome = ANY (perms_alt)   -- altera=: só com o código
          ELSE pers.nome = 'admin' OR tem_mod
        END;
        n := CASE op WHEN 'UPDATE' THEN pg_temp.upd(pers.uid, 'authenticated', m.tabela) ELSE pg_temp.del(pers.uid, 'authenticated', m.tabela) END;
        checagens := checagens + 1;
        IF n = -2 THEN
          PERFORM pg_temp.falha(format('%s %s: erro inesperado para %s (não é de permissão)', m.tabela, op, pers.nome));
        ELSIF autorizado AND n < 1 THEN
          PERFORM pg_temp.falha(format('%s: %s deveria conseguir %s (afetou %s)', m.tabela, pers.nome, op, n));
        ELSIF NOT autorizado AND n > 0 THEN
          PERFORM pg_temp.falha(format('%s: %s consegue %s (%s linha(s)) e não deveria', m.tabela, pers.nome, op, n));
        END IF;
      END LOOP;
    END LOOP;
    -- ;sem_autoaprovacao: quem escreve e é dono da linha A só alcança a linha B (do outro). Quem escreve: permissao,
    -- cada perm_<código> da escrita; proprio_leitura, o módulo (mod_<m>) e a persona de excluir=. DELETE: os mesmos
    -- quando não há excluir=; com excluir=<código>, só a persona desse código; excluir=admin, ninguém aqui.
    IF pg_temp.tem_sufixo(m.extra, 'sem_autoaprovacao') THEN
      FOR pers IN
        SELECT pe.nome, pe.uid,
               coalesce(pe.nome = ANY (perms) OR (m.classe = 'proprio_leitura' AND pe.nome IN ('mod_' || mods[1], perm_excl)), false) AS altera,
               coalesce(CASE WHEN excl IN ('admin', 'ninguem') THEN false
                             WHEN excl IS NOT NULL THEN pe.nome = perm_excl
                             ELSE pe.nome = ANY (perms) OR (m.classe = 'proprio_leitura' AND pe.nome = 'mod_' || mods[1]) END, false) AS apaga
          FROM persona pe
         WHERE pe.nome = ANY (perms) OR pe.nome = perm_excl OR (m.classe = 'proprio_leitura' AND pe.nome = 'mod_' || mods[1])
         ORDER BY pe.nome
      LOOP
        PERFORM pg_temp.tornar_dono_a(m.tabela, m.classe, m.extra, pers.uid);
        IF pers.altera THEN
          n := pg_temp.upd(pers.uid, 'authenticated', m.tabela);
          IF n <> 1 THEN PERFORM pg_temp.falha(format('%s: %s, dono da linha A, altera %s linha(s) (esperado 1: só a do outro)', m.tabela, pers.nome, n)); END IF;
          checagens := checagens + 1;
        END IF;
        IF pers.apaga THEN
          n := pg_temp.del(pers.uid, 'authenticated', m.tabela);
          IF n <> 1 THEN PERFORM pg_temp.falha(format('%s: %s, dono da linha A, apaga %s linha(s) (esperado 1: só a do outro)', m.tabela, pers.nome, n)); END IF;
          checagens := checagens + 1;
        END IF;
        PERFORM pg_temp.tornar_dono_a(m.tabela, m.classe, m.extra, pers.uid, true);
      END LOOP;
    END IF;
    -- anon nunca altera nem apaga
    IF pg_temp.upd(NULL, 'anon', m.tabela) > 0 OR pg_temp.del(NULL, 'anon', m.tabela) > 0 THEN
      PERFORM pg_temp.falha(m.tabela || ': anon consegue UPDATE/DELETE');
    END IF;
  END LOOP;
  PERFORM pg_temp.nota('UPDATE/DELETE: ' || checagens || ' checagens por persona/tabela');
END $$;

-- ---------------------------------------------------------------- asserções globais
DO $$
DECLARE n int; u_admin uuid := (SELECT uid FROM persona WHERE nome='admin'); u_nenhum uuid := (SELECT uid FROM persona WHERE nome='nenhum'); r text; x record;
BEGIN
  -- cobertura: toda tabela de public está no mapa (e vice-versa) e tem RLS ligado
  FOR x IN SELECT c.relname FROM pg_class c WHERE c.relnamespace = 'public'::regnamespace AND c.relkind IN ('r','p')
           AND NOT EXISTS (SELECT 1 FROM mapa m WHERE m.tabela = c.relname) LOOP
    PERFORM pg_temp.falha(x.relname || ': tabela fora de rls/mapa.csv (decida o módulo dono)');
  END LOOP;
  FOR x IN SELECT m.tabela FROM mapa m WHERE NOT EXISTS (SELECT 1 FROM pg_class c WHERE c.relnamespace = 'public'::regnamespace AND c.relkind IN ('r','p') AND c.relname = m.tabela) LOOP
    PERFORM pg_temp.falha(x.tabela || ': consta em rls/mapa.csv mas não existe no banco');
  END LOOP;
  FOR x IN SELECT c.relname FROM pg_class c WHERE c.relnamespace = 'public'::regnamespace AND c.relkind IN ('r','p') AND NOT c.relrowsecurity LOOP
    PERFORM pg_temp.falha(x.relname || ': RLS desligado');
  END LOOP;

  SELECT count(*) INTO n FROM pg_policies WHERE schemaname = 'public' AND policyname ILIKE 'acesso_total%';
  IF n > 0 THEN PERFORM pg_temp.falha('ainda existem ' || n || ' policies acesso_total'); END IF;

  -- anon: só as exceções públicas
  SELECT count(*) INTO n FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace AND p.prokind IN ('f','p') AND has_function_privilege('anon', p.oid, 'EXECUTE');
  -- 10 do portal e formulários + 4 do pré-cadastro público (migração 20261012140000)
  IF n <> 14 THEN PERFORM pg_temp.falha('anon executa ' || n || ' funções (esperado: 14 RPCs públicas)'); END IF;
  SELECT count(*) INTO n FROM pg_class c WHERE c.relnamespace = 'public'::regnamespace AND c.relkind IN ('r','p') AND (has_any_column_privilege('anon', c.oid, 'SELECT') OR has_table_privilege('anon', c.oid, 'INSERT') OR has_table_privilege('anon', c.oid, 'UPDATE') OR has_table_privilege('anon', c.oid, 'DELETE'));
  IF n <> (SELECT count(*) FROM mapa WHERE anon <> '') THEN PERFORM pg_temp.falha('anon tem privilégio em ' || n || ' tabelas; o mapa declara ' || (SELECT count(*) FROM mapa WHERE anon <> '')); END IF;
  FOR x IN SELECT tabela, anon FROM mapa WHERE anon <> '' LOOP
    -- has_any_column_privilege: a leitura pode ser por coluna (dados_oficiais: só chave, valor, categoria)
    IF x.anon = 'select' AND NOT has_any_column_privilege('anon', ('public.' || quote_ident(x.tabela))::regclass, 'SELECT') THEN
      PERFORM pg_temp.falha(x.tabela || ': o mapa declara leitura anônima, mas anon não tem SELECT');
    END IF;
    IF x.anon = 'insert' AND NOT has_table_privilege('anon', ('public.' || quote_ident(x.tabela))::regclass, 'INSERT') THEN
      PERFORM pg_temp.falha(x.tabela || ': o mapa declara inserção anônima, mas anon não tem INSERT');
    END IF;
  END LOOP;
  SELECT count(*) INTO n FROM pg_policies WHERE schemaname = 'public' AND roles && ARRAY['anon','public']::name[] AND cmd IN ('UPDATE','DELETE','ALL') AND NOT (qual ILIKE '%user_roles%');
  IF n > 0 THEN PERFORM pg_temp.falha(n || ' policies de UPDATE/DELETE valem para anon/public sem checar papel'); END IF;

  -- stubs de acesso total não podem voltar
  IF public.usuario_eh_super_admin(u_nenhum) THEN PERFORM pg_temp.falha('usuario_eh_super_admin(usuário comum) = true'); END IF;
  IF NOT public.usuario_eh_super_admin(u_admin) THEN PERFORM pg_temp.falha('usuario_eh_super_admin(admin) = false'); END IF;
  SELECT count(*) INTO n FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace AND p.prokind = 'f' AND p.prorettype = 'boolean'::regtype
    AND regexp_replace(lower(btrim(p.prosrc)), '[\s;]+', ' ', 'g') ~ '^ ?(select )?(auth\.uid\(\) is not null|true) ?$';
  IF n > 0 THEN PERFORM pg_temp.falha(n || ' funções-stub de acesso total (auth.uid() IS NOT NULL / true)'); END IF;
  SELECT count(*) INTO n FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace AND p.prokind IN ('f','p') AND p.prosrc ~* '\m(usuario_perfis|perfil_funcoes|funcoes_sistema)\M' AND p.proname <> 'fn_audit_log_licitacoes';
  IF n > 0 THEN PERFORM pg_temp.falha(n || ' funções ainda leem tabelas removidas (usuario_perfis/perfil_funcoes/funcoes_sistema)'); END IF;

  -- trilha de auditoria: authenticated não escreve direto, log_audit grava, anon não chama
  r := pg_temp.ins(u_nenhum, 'authenticated', 'audit_logs', 'action', quote_literal('view'));
  IF r <> 'negado' THEN PERFORM pg_temp.falha('authenticated consegue INSERT direto em audit_logs'); END IF;
  r := pg_temp.ins(u_admin, 'authenticated', 'audit_logs', 'action', quote_literal('view'));
  IF r <> 'negado' THEN PERFORM pg_temp.falha('admin consegue INSERT direto em audit_logs'); END IF;
END $$;

-- ---------------------------------------------------------------- storage (overlay/50_storage.sql)
-- Um objeto fictício por bucket; cada persona só enxerga/escreve onde o módulo do bucket permite.
CREATE FUNCTION pg_temp.sel_obj(p_uid uuid, p_role text, p_bucket text) RETURNS int
LANGUAGE plpgsql AS $$
DECLARE n int;
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', p_role)::text, true);
  EXECUTE format('SET LOCAL ROLE %I', p_role);
  BEGIN
    SELECT count(*) INTO n FROM storage.objects WHERE bucket_id = p_bucket;
  EXCEPTION WHEN insufficient_privilege THEN n := -1;
  END;
  RESET ROLE;
  RETURN n;
END $$;

CREATE FUNCTION pg_temp.ins_obj(p_uid uuid, p_role text, p_bucket text, p_nome text DEFAULT NULL) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE res text;
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', p_role)::text, true);
  EXECUTE format('SET LOCAL ROLE %I', p_role);
  BEGIN
    INSERT INTO storage.objects (bucket_id, name) VALUES (p_bucket, coalesce(p_nome, 'teste-' || gen_random_uuid()));
    RAISE EXCEPTION USING ERRCODE = 'P0099', MESSAGE = 'desfazer';
  EXCEPTION
    WHEN SQLSTATE '42501' THEN res := 'negado';
    WHEN SQLSTATE 'P0099' THEN res := 'passou';
    WHEN OTHERS THEN res := 'passou';
  END;
  RESET ROLE;
  RETURN res;
END $$;

-- codigos: NULL = o módulo lê e grava; com códigos (B3, migração 20261010210000), o módulo só LÊ e gravar exige o
-- módulo E um dos códigos (as personas perm_* e o dono do arquivo são testados no bloco "RH: storage (B3)").
CREATE TEMP TABLE bucket_modulos (bucket text, modulos text[], codigos text[]);
INSERT INTO bucket_modulos VALUES
  ('arbitros-docs', ARRAY['arbitros'], NULL), ('ascom-demandas', ARRAY['comunicacao'], NULL),
  ('documentos', ARRAY['workflow','rh'], NULL),
  ('documentos-requerimento', ARRAY['rh'], ARRAY['rh.servidores.editar']),
  ('frequencias', ARRAY['rh'], ARRAY['rh.frequencia.lancar','rh.frequencia.criar','rh.frequencia.editar']),
  ('inventario-evidencias', ARRAY['patrimonio','patrimonio_mobile'], NULL),
  ('inventario-fotos', ARRAY['patrimonio','patrimonio_mobile'], NULL),
  ('patrimonio-docs', ARRAY['patrimonio','patrimonio_mobile'], NULL), ('patrimonio-fotos', ARRAY['patrimonio','patrimonio_mobile'], NULL),
  ('transparencia-publicacoes', ARRAY['transparencia'], NULL);

INSERT INTO storage.objects (bucket_id, name) SELECT bucket, 'semente.bin' FROM bucket_modulos;

DO $$
DECLARE b record; p record; esperado int; n int; r text; permitido boolean; grava boolean;
        u_admin uuid := (SELECT uid FROM persona WHERE nome='admin');
        u_anon uuid := '00000000-0000-0000-0000-000000000000';
BEGIN
  IF (SELECT count(*) FROM storage.buckets WHERE id IN (SELECT bucket FROM bucket_modulos)) <> (SELECT count(*) FROM bucket_modulos) THEN
    PERFORM pg_temp.falha('storage: faltam buckets do overlay');
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects'
             AND (qual ILIKE '%auth.uid() IS NOT NULL%' OR with_check ILIKE '%auth.uid() IS NOT NULL%')) THEN
    PERFORM pg_temp.falha('storage: ainda há policy liberada a qualquer usuário logado');
  END IF;
  FOR b IN SELECT * FROM bucket_modulos LOOP
    FOR p IN SELECT * FROM persona WHERE nome NOT LIKE 'perm_%' LOOP   -- perm_* têm módulo: o storage é coberto por mod_*
      permitido := p.nome = 'admin' OR (p.nome LIKE 'mod_%' AND substr(p.nome, 5) = ANY (b.modulos));
      -- bucket com códigos: o módulo sozinho não grava (só o admin, entre as personas deste laço)
      grava := permitido AND (b.codigos IS NULL OR p.nome = 'admin');
      esperado := CASE WHEN permitido THEN 1 ELSE 0 END;
      n := pg_temp.sel_obj(p.uid, 'authenticated', b.bucket);
      IF n <> esperado THEN PERFORM pg_temp.falha(format('storage %s: %s vê %s objeto(s), esperado %s', b.bucket, p.nome, n, esperado)); END IF;
      r := pg_temp.ins_obj(p.uid, 'authenticated', b.bucket);
      IF (r = 'passou') <> grava THEN PERFORM pg_temp.falha(format('storage %s: %s INSERT = %s, esperado %s', b.bucket, p.nome, r, CASE WHEN grava THEN 'passou' ELSE 'negado' END)); END IF;
    END LOOP;
    n := pg_temp.sel_obj(u_anon, 'anon', b.bucket);
    IF n > 0 THEN PERFORM pg_temp.falha(format('storage %s: anon lista %s objeto(s)', b.bucket, n)); END IF;
    r := pg_temp.ins_obj(u_anon, 'anon', b.bucket, 'fotos/teste-' || gen_random_uuid());
    IF (r = 'passou') <> (b.bucket = 'arbitros-docs') THEN
      PERFORM pg_temp.falha(format('storage %s: anon INSERT = %s (só arbitros-docs aceita)', b.bucket, r));
    END IF;
  END LOOP;
  -- formulário público de árbitros: só as pastas do formulário, e o bucket limita tamanho e tipo
  IF pg_temp.ins_obj(u_anon, 'anon', 'arbitros-docs', 'raiz-qualquer/arquivo') <> 'negado' THEN PERFORM pg_temp.falha('storage arbitros-docs: anon grava fora das pastas do formulário'); END IF;
  IF pg_temp.ins_obj(u_anon, 'anon', 'arbitros-docs', 'documentos/a') = 'negado' OR pg_temp.ins_obj(u_anon, 'anon', 'arbitros-docs', 'modalidades/a') = 'negado' THEN PERFORM pg_temp.falha('storage arbitros-docs: anon não grava nas pastas do formulário'); END IF;
  IF (SELECT file_size_limit IS NULL OR allowed_mime_types IS NULL FROM storage.buckets WHERE id = 'arbitros-docs') THEN PERFORM pg_temp.falha('storage arbitros-docs: bucket sem limite de tamanho/tipo (upload anônimo)'); END IF;
  -- cópias de RG/CPF: o bucket não pode servir arquivo por URL pública (sem login)
  IF (SELECT public FROM storage.buckets WHERE id = 'arbitros-docs') THEN PERFORM pg_temp.falha('storage arbitros-docs: bucket público (documentos pessoais sem login)'); END IF;
  PERFORM pg_temp.nota('storage: ' || (SELECT count(*) FROM bucket_modulos) || ' buckets x ' || (SELECT count(*) FROM persona WHERE nome NOT LIKE 'perm_%') || ' personas verificados');
END $$;

RESET session_replication_role;

-- ---------------------------------------------------------------- handle_new_user (overlay/15_novo_usuario.sql)
-- Com triggers LIGADOS: criar usuário no Auth tem de gerar perfil inativo + papel 'user'.
DO $$
DECLARE novo uuid := 'c0000000-0000-0000-0000-0000000000a1'; novo_t uuid := 'c0000000-0000-0000-0000-0000000000a2'; x record;
BEGIN
  INSERT INTO auth.users (id, email, raw_user_meta_data)
  VALUES (novo, 'novo@teste.invalid', '{"full_name":"Fulano de Tal"}'::jsonb);
  INSERT INTO auth.users (id, email, raw_user_meta_data)
  VALUES (novo_t, 'tecnico@teste.invalid', '{"tipo_usuario":"tecnico"}'::jsonb);

  SELECT * INTO x FROM public.profiles WHERE id = novo;
  IF NOT FOUND THEN PERFORM pg_temp.falha('handle_new_user: perfil não foi criado');
  ELSE
    IF x.is_active THEN PERFORM pg_temp.falha('handle_new_user: perfil nasceu ATIVO'); END IF;
    IF x.tipo_usuario <> 'servidor' THEN PERFORM pg_temp.falha('handle_new_user: tipo_usuario padrão = ' || x.tipo_usuario); END IF;
    IF x.full_name <> 'Fulano de Tal' THEN PERFORM pg_temp.falha('handle_new_user: full_name = ' || coalesce(x.full_name, 'NULL')); END IF;
  END IF;
  IF (SELECT role::text FROM public.user_roles WHERE user_id = novo) IS DISTINCT FROM 'user' THEN
    PERFORM pg_temp.falha('handle_new_user: papel inicial deveria ser user');
  END IF;
  IF (SELECT tipo_usuario FROM public.profiles WHERE id = novo_t) IS DISTINCT FROM 'tecnico' THEN
    PERFORM pg_temp.falha('handle_new_user: tipo_usuario=tecnico não foi respeitado');
  END IF;
  -- usuário recém-criado não ganha módulo nem acesso: está inativo
  IF public.can_access_module(novo, 'rh') THEN PERFORM pg_temp.falha('usuário novo (inativo) acessa o módulo rh'); END IF;
  IF (SELECT count(*) FROM public.user_modules WHERE user_id = novo) > 0 THEN PERFORM pg_temp.falha('usuário novo já nasce com módulos'); END IF;
END $$;

-- ---------------------------------------------------------------- identidade, RPCs e triggers (TRIGGERS LIGADOS)
DO $$
DECLARE
  u_admin uuid := (SELECT uid FROM persona WHERE nome='admin');
  u_admin_i uuid := (SELECT uid FROM persona WHERE nome='admin_inativo');
  u_nenhum uuid := (SELECT uid FROM persona WHERE nome='nenhum');
  u_inativo uuid := (SELECT uid FROM persona WHERE nome='inativo');
  u_a uuid := (SELECT uid FROM persona WHERE nome='srv_a');
  u_srv_i uuid := (SELECT uid FROM persona WHERE nome='srv_inativo');
  u_rh uuid := (SELECT uid FROM persona WHERE nome='mod_rh');
  u_lanc uuid := (SELECT uid FROM persona WHERE nome='perm_rh.frequencia.lancar');
  u_arb uuid := (SELECT uid FROM persona WHERE nome='mod_arbitros');
  sa text := 'b0000000-0000-0000-0000-00000000000a';
  sb text := 'b0000000-0000-0000-0000-00000000000b';
  r text; n int; f record; permitidas text[]; v_tipo text;
BEGIN
  -- ===== profiles: ninguém se ativa, se desbloqueia nem assume servidor_id alheio
  r := pg_temp.sql_como(u_inativo, 'authenticated', 'UPDATE public.profiles SET is_active = true WHERE id = auth.uid()');
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('profiles: usuário inativo se auto-ativa (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_nenhum, 'authenticated', format('UPDATE public.profiles SET servidor_id = %L WHERE id = auth.uid()', sb));
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('profiles: usuário assume servidor_id alheio (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_nenhum, 'authenticated', 'UPDATE public.profiles SET blocked_at = NULL, blocked_reason = NULL, tipo_usuario = ''tecnico'', cpf = ''1'', restringir_modulos = true, email = ''x@y.z'' WHERE id = auth.uid()');
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('profiles: usuário altera bloqueio/tipo/cpf/e-mail (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_nenhum, 'authenticated', 'UPDATE public.profiles SET full_name = ''Novo Nome'', avatar_url = NULL, requires_password_change = false WHERE id = auth.uid()');
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('profiles: usuário não edita nome/avatar/troca de senha (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_nenhum, 'authenticated', 'UPDATE public.profiles SET full_name = ''Invasor'' WHERE id <> auth.uid()');
  IF r <> 'ok:0' THEN PERFORM pg_temp.falha('profiles: usuário edita perfil de outro (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_nenhum, 'authenticated', 'INSERT INTO public.profiles (id, tipo_usuario, is_active) VALUES (auth.uid(), ''servidor'', true)');
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('profiles: usuário insere o próprio perfil (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_nenhum, 'authenticated', 'DELETE FROM public.profiles WHERE id = auth.uid()');
  IF r <> 'ok:0' THEN PERFORM pg_temp.falha('profiles: usuário apaga o próprio perfil (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_admin, 'authenticated', format('UPDATE public.profiles SET is_active = true WHERE id = %L', u_inativo));
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('profiles: admin não ativa usuário (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_admin_i, 'authenticated', format('UPDATE public.profiles SET is_active = true WHERE id = %L', u_admin_i));
  IF r NOT IN ('ok:0') AND r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('profiles: admin BLOQUEADO se desbloqueia (' || r || ')'); END IF;

  -- ===== papéis e módulos: ninguém se promove
  r := pg_temp.sql_como(u_nenhum, 'authenticated', 'INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), ''admin'')');
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('user_roles: usuário se promove a admin (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_nenhum, 'authenticated', 'INSERT INTO public.user_modules (user_id, module) VALUES (auth.uid(), ''financeiro'')');
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('user_modules: usuário se concede módulo (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_admin_i, 'authenticated', 'INSERT INTO public.user_modules (user_id, module) VALUES (auth.uid(), ''financeiro'')');
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('user_modules: admin BLOQUEADO concede módulo (' || r || ')'); END IF;

  -- ===== catálogos que o app lê no login de TODO usuário ativo
  FOREACH r IN ARRAY ARRAY['module_permissions_catalog', 'role_permissions', 'module_settings', 'dados_oficiais'] LOOP
    IF pg_temp.sel(u_nenhum, 'authenticated', r) < 1 THEN PERFORM pg_temp.falha(r || ': usuário ativo comum não lê (o login quebra)'); END IF;
  END LOOP;

  -- ===== perfil bloqueado perde tudo, inclusive posse própria e papel admin
  IF pg_temp.sel(u_srv_i, 'authenticated', 'fichas_financeiras') <> 0 THEN PERFORM pg_temp.falha('fichas_financeiras: servidor BLOQUEADO lê a própria ficha'); END IF;
  IF pg_temp.sel(u_a, 'authenticated', 'fichas_financeiras') <> 1 THEN PERFORM pg_temp.falha('fichas_financeiras: servidor ativo não lê a própria ficha'); END IF;
  IF public.is_admin_user(u_admin_i) THEN PERFORM pg_temp.falha('is_admin_user(admin bloqueado) = true'); END IF;
  IF NOT public.is_admin_user(u_admin) THEN PERFORM pg_temp.falha('is_admin_user(admin ativo) = false'); END IF;
  IF public.has_permission_code(u_admin_i, 'admin.usuarios') THEN PERFORM pg_temp.falha('has_permission_code(admin bloqueado) = true'); END IF;
  IF NOT public.usuario_eh_admin(u_admin) THEN PERFORM pg_temp.falha('usuario_eh_admin(admin) = false (os triggers de folha dependem dela)'); END IF;

  -- ===== log_audit: só autenticado; anon não
  r := pg_temp.sql_como(u_nenhum, 'authenticated', 'SELECT public.log_audit(_action := ''view'', _entity_type := ''teste'', _module_name := ''rh'', _description := ''teste'')');
  IF r NOT LIKE 'ok:%' THEN PERFORM pg_temp.falha('log_audit: usuário autenticado não grava (' || r || ')'); END IF;
  r := pg_temp.sql_como(NULL, 'anon', 'SELECT public.log_audit(_action := ''view'', _entity_type := ''teste'', _module_name := ''rh'', _description := ''teste'')');
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('log_audit: anon consegue chamar (' || r || ')'); END IF;

  -- ===== injeção de SQL em fn_gerar_numero_financeiro
  r := pg_temp.sql_como(u_nenhum, 'authenticated', 'SELECT public.fn_gerar_numero_financeiro(''parametros, (select nome_completo as numero from servidores) q --'', 2026)');
  IF r NOT LIKE 'erro:22023%' THEN PERFORM pg_temp.falha('fn_gerar_numero_financeiro aceita p_tipo arbitrário (' || r || ')'); END IF;
  FOREACH r IN ARRAY ARRAY['solicitacao', 'empenho', 'liquidacao', 'pagamento', 'receita', 'adiantamento', 'alteracao'] LOOP
    n := (pg_temp.sql_como(u_nenhum, 'authenticated', format('SELECT public.fn_gerar_numero_financeiro(%L, 2026)', r)) LIKE 'ok:%')::int;
    IF n = 0 THEN PERFORM pg_temp.falha('fn_gerar_numero_financeiro(' || r || ') falha'); END IF;
  END LOOP;

  -- ===== SECURITY DEFINER sem checagem de quem chama: só as da lista revisada
  permitidas := ARRAY[
    -- calculadoras e consultas de parâmetro (sem dado pessoal)
    'calcular_horas_trabalhadas','calcular_inss_servidor','calcular_irrf','fn_calcular_ferias','fn_calcular_nivel_parametro',
    'fn_validar_teto_remuneratorio','get_parametro_vigente','obter_parametro_simples','obter_parametro_vigente',
    -- numeração/protocolo (devolvem o próximo número; precisam ver todas as linhas, por isso DEFINER)
    'fn_gerar_numero_financeiro','gerar_numero_portaria','gerar_numero_tombamento',
    'gerar_protocolo_cedencia','gerar_protocolo_memorando_lotacao','get_proximo_numero_remessa',
    -- estrutura organizacional e processos (sem dado pessoal sensível)
    'folha_esta_bloqueada',
    'get_hierarquia_unidade','get_subordinados_unidade','user_has_unit_access','can_approve','can_view_indicacao',
    -- ajudantes de RLS/RBAC: as policies os chamam como o usuário, então precisam de EXECUTE (consultam
    -- permissões de terceiros pelo UUID; risco aceito e registrado em supabase/baseline/README.md). Desde a P12
    -- (migração 20261017090000) get_user_permission_codes, get_user_permissions, get_permissions_from_servidor,
    -- listar_permissoes_usuario e get_chefe_unidade_atual checam quem chama e saíram desta lista.
    'can_access_module','has_module','has_permission','has_permission_code','is_active_user','is_admin_user','is_user_active',
    -- RPCs públicas (formulários e portal): anon executa
    'arbitro_cpf_cadastrado','obter_protocolo_arbitro','obter_dado_oficial','registrar_denuncia_publica',
    'consultar_gestor_por_cpf','registrar_gestor_publico',
    -- portal da transparência: só totais/campos públicos, LGPD filtrada no servidor (migração 20261010200100)
    'transparencia_execucao_orcamentaria','transparencia_licitacoes','transparencia_patrimonio',
    -- quadro de cargos: só nome do ocupante, nunca indicação/CPF/contato (migração 20261010234000)
    'transparencia_cargos_publicos',
    -- só authenticated executa (anon não); incrementa o contador de bloqueio por token errado
    'consultar_protocolo_sic',
    -- pré-cadastro público (migração 20261012140000): formulário sem login, a guarda é o token de cada pré-cadastro
    'pre_cadastro_publico_criar','pre_cadastro_publico_obter','pre_cadastro_publico_salvar','pre_cadastro_publico_enviar',
    -- folha/frequência travada (migração 20261012100000): só devolve se a competência do servidor está fechada
    'frequencia_competencia_travada'];
  FOR f IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace AND p.prosecdef AND p.prorettype <> 'trigger'::regtype
      AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
      AND NOT (p.prosrc ~* 'auth\.uid\(\)|can_access_module|is_admin_user|is_admin_atual|usuario_tem_permissao|has_permission_code|usuario_eh_admin|usuario_eh_super_admin|is_active_user|perfil_ativo_atual|pode_gerenciar_avisos|pode_configurar_envios|pode_ver_envios|wf_pode_ver_processo')
      AND p.proname <> ALL (permitidas)
  LOOP
    PERFORM pg_temp.falha('SECURITY DEFINER sem checagem de quem chama e executável por authenticated: ' || f.proname || '(' || f.args || ')');
  END LOOP;
  -- somente-leitura com dado pessoal rodam como o usuário (RLS vale); as que escrevem não são de authenticated
  FOR f IN SELECT p.proname FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace AND p.prosecdef
           AND p.proname IN ('fn_gerar_esocial_s1200','fn_gerar_esocial_s2200','fn_validar_margem_consignavel','fn_calcular_13_proporcional','gerar_relatorio_responsavel','verificar_conflito_agenda') LOOP
    PERFORM pg_temp.falha(f.proname || ': continua SECURITY DEFINER e lê dado pessoal');
  END LOOP;
  FOR f IN SELECT p.proname FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace
           AND p.proname IN ('fn_atualizar_situacao_servidor') AND has_function_privilege('authenticated', p.oid, 'EXECUTE') LOOP
    PERFORM pg_temp.falha(f.proname || ': executável por authenticated (escreve em servidores)');
  END LOOP;
  -- processar_folha_pagamento (migração 20261010070000): authenticated executa, MAS o corpo exige
  -- has_permission_code(auth.uid(), 'financeiro.folha.processar'); anon nunca executa
  FOR f IN SELECT p.oid, p.prosrc FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace AND p.proname = 'processar_folha_pagamento' LOOP
    IF NOT has_function_privilege('authenticated', f.oid, 'EXECUTE') THEN PERFORM pg_temp.falha('processar_folha_pagamento: deveria ser executável por authenticated (com guarda de permissão)'); END IF;
    IF f.prosrc !~ 'has_permission_code' THEN PERFORM pg_temp.falha('processar_folha_pagamento: sem guarda has_permission_code no corpo'); END IF;
    IF has_function_privilege('anon', f.oid, 'EXECUTE') THEN PERFORM pg_temp.falha('processar_folha_pagamento: executável por anon'); END IF;
  END LOOP;

  -- eSocial devolve o servidor ao RH e NADA a quem não tem módulo (a RLS de servidores vale)
  -- (servidores é proprio_leitura;coluna=id: a semente já criou a linha com id = sa; aqui só ganha o nome procurado)
  INSERT INTO public.servidores (id, nome_completo, cpf) VALUES (sa::uuid, 'Servidor Alheio Teste', '00000000000')
    ON CONFLICT (id) DO UPDATE SET nome_completo = EXCLUDED.nome_completo;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_nenhum, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  BEGIN r := public.fn_gerar_esocial_s2200(sa::uuid)::text; EXCEPTION WHEN OTHERS THEN r := 'erro'; END;
  RESET ROLE;
  IF r ILIKE '%Servidor Alheio%' THEN PERFORM pg_temp.falha('fn_gerar_esocial_s2200: usuário sem módulo recebeu dado do servidor'); END IF;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_rh, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  BEGIN r := public.fn_gerar_esocial_s2200(sa::uuid)::text; EXCEPTION WHEN OTHERS THEN r := 'erro:' || SQLERRM; END;
  RESET ROLE;
  IF r NOT ILIKE '%Servidor Alheio%' THEN PERFORM pg_temp.falha('fn_gerar_esocial_s2200: o RH não recebe o servidor (' || left(r, 80) || ')'); END IF;

  -- ===== portal: quadro de cargos (anon) mostra o nome do ocupante e nunca indicação nem CPF (migração 20261010234000)
  INSERT INTO public.estrutura_organizacional (id, nome, sigla, tipo, nivel)
    VALUES ('c0000000-0000-0000-0000-0000000000e1', 'Unidade Cargos Teste', 'UCT', 'diretoria', 2);
  INSERT INTO public.cargos (id, nome, sigla, categoria, natureza, vencimento_base, quantidade_vagas)
    VALUES ('c0000000-0000-0000-0000-0000000000c1', 'Cargo Teste LAI', 'CT-I', 'comissionado', 'comissionado', 1234.56, 2);
  INSERT INTO public.composicao_cargos (unidade_id, cargo_id, quantidade_vagas)
    VALUES ('c0000000-0000-0000-0000-0000000000e1', 'c0000000-0000-0000-0000-0000000000c1', 2);
  INSERT INTO public.servidores (id, nome_completo, cpf, indicacao)
    VALUES ('c0000000-0000-0000-0000-0000000000a1', 'Ocupante Publico Teste', '98765432100', 'Padrinho Secreto Teste');
  INSERT INTO public.vinculos_servidor (servidor_id, tipo, cargo_id, unidade_id, data_inicio)
    VALUES ('c0000000-0000-0000-0000-0000000000a1', 'comissionado', 'c0000000-0000-0000-0000-0000000000c1',
            'c0000000-0000-0000-0000-0000000000e1', current_date);
  PERFORM set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  SET LOCAL ROLE anon;
  BEGIN
    SELECT string_agg(t::text, ' | '), count(*) INTO r, n FROM public.transparencia_cargos_publicos() t WHERE t.cargo = 'Cargo Teste LAI';
  EXCEPTION WHEN OTHERS THEN r := 'erro:' || SQLERRM; n := -1;
  END;
  RESET ROLE;
  IF n <> 2 THEN PERFORM pg_temp.falha('transparencia_cargos_publicos: esperadas 2 linhas (1 ocupada, 1 vaga) do cargo de teste, vieram ' || n || ' (' || left(coalesce(r, ''), 90) || ')'); END IF;
  IF coalesce(r, '') NOT LIKE '%Ocupante Publico Teste%' THEN PERFORM pg_temp.falha('transparencia_cargos_publicos: anon não vê o nome do ocupante'); END IF;
  IF r ILIKE '%Padrinho Secreto%' OR r LIKE '%98765432100%' THEN PERFORM pg_temp.falha('transparencia_cargos_publicos: expõe indicação ou CPF'); END IF;

  -- ===== privilégios padrão: função criada depois NÃO nasce executável por anon
  SET LOCAL ROLE postgres;
  CREATE FUNCTION public.zz_teste_privilegio() RETURNS int LANGUAGE sql AS 'SELECT 1';
  RESET ROLE;
  IF has_function_privilege('anon', 'public.zz_teste_privilegio()', 'EXECUTE') THEN PERFORM pg_temp.falha('função nova nasce executável por anon (default privileges)'); END IF;
  DROP FUNCTION public.zz_teste_privilegio();
  SELECT count(*) INTO n FROM pg_class c WHERE c.relnamespace = 'public'::regnamespace AND c.relkind IN ('r','p')
     AND (has_table_privilege('anon', c.oid, 'TRUNCATE') OR has_table_privilege('authenticated', c.oid, 'TRUNCATE')
          OR has_table_privilege('anon', c.oid, 'TRIGGER') OR has_table_privilege('authenticated', c.oid, 'TRIGGER'));
  IF n > 0 THEN PERFORM pg_temp.falha(n || ' tabelas com TRUNCATE/TRIGGER para anon ou authenticated'); END IF;
  IF has_table_privilege('authenticated', 'public.audit_logs', 'INSERT') OR has_table_privilege('authenticated', 'public.audit_logs', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.audit_logs', 'DELETE') THEN
    PERFORM pg_temp.falha('audit_logs: authenticated tem INSERT/UPDATE/DELETE por privilégio (só RLS o barra)');
  END IF;

  -- ===== formulários públicos e pedidos do servidor: status/aprovação não são escolhidos por quem envia
  r := pg_temp.insere_como(NULL, 'anon', 'cadastro_arbitros', jsonb_build_object('id', 'd1000000-0000-0000-0000-000000000001', 'status', 'aprovado', 'protocolo', 'FAKE-1'));
  IF r <> 'ok' THEN PERFORM pg_temp.falha('cadastro_arbitros: anon não consegue enviar o formulário (' || r || ')');
  ELSE
    IF (SELECT status FROM public.cadastro_arbitros WHERE id = 'd1000000-0000-0000-0000-000000000001') <> 'enviado' THEN PERFORM pg_temp.falha('cadastro_arbitros: anon escolheu o status'); END IF;
    IF (SELECT protocolo FROM public.cadastro_arbitros WHERE id = 'd1000000-0000-0000-0000-000000000001') !~ '^ARB-' THEN PERFORM pg_temp.falha('cadastro_arbitros: anon escolheu o protocolo'); END IF;
  END IF;
  r := pg_temp.insere_como(u_arb, 'authenticated', 'cadastro_arbitros', jsonb_build_object('id', 'd1000000-0000-0000-0000-000000000002', 'status', 'aprovado'));
  IF r <> 'ok' OR (SELECT status FROM public.cadastro_arbitros WHERE id = 'd1000000-0000-0000-0000-000000000002') <> 'aprovado' THEN
    PERFORM pg_temp.falha('cadastro_arbitros: quem gere o módulo arbitros não consegue definir o status (' || r || ')');
  END IF;
  r := pg_temp.insere_como(NULL, 'anon', 'federacoes_esportivas', jsonb_build_object('id', 'd1000000-0000-0000-0000-000000000003', 'status', 'ativo', 'analisado_por', u_admin::text, 'observacoes_internas', 'forjado'));
  IF r <> 'ok' THEN PERFORM pg_temp.falha('federacoes_esportivas: anon não consegue enviar o formulário (' || r || ')');
  ELSIF (SELECT status || coalesce(analisado_por::text, '') || coalesce(observacoes_internas, '') FROM public.federacoes_esportivas WHERE id = 'd1000000-0000-0000-0000-000000000003') <> 'em_analise' THEN
    PERFORM pg_temp.falha('federacoes_esportivas: anon forjou status/analisado_por/observações');
  END IF;
  v_tipo := pg_temp.seed_row('tipos_abono');   -- as FKs valem aqui (triggers e constraints ligados)
  r := pg_temp.insere_como(u_a, 'authenticated', 'solicitacoes_abono', jsonb_build_object('id', 'd1000000-0000-0000-0000-000000000004', 'servidor_id', sa, 'tipo_abono_id', v_tipo, 'status', 'aprovado', 'aprovado_rh_por', u_admin::text, 'aprovado_rh_em', now()::text));
  IF r <> 'ok' THEN PERFORM pg_temp.falha('solicitacoes_abono: servidor não consegue pedir abono para si (' || r || ')');
  ELSIF (SELECT status || coalesce(aprovado_rh_por::text, '') || coalesce(aprovado_rh_em::text, '') FROM public.solicitacoes_abono WHERE id = 'd1000000-0000-0000-0000-000000000004') <> 'pendente' THEN
    PERFORM pg_temp.falha('solicitacoes_abono: servidor se autoaprovou');
  END IF;
  -- o RH lança abono já aprovado: módulo rh E rh.frequencia.lancar (B2; o módulo sozinho não escreve mais)
  r := pg_temp.insere_como((SELECT uid FROM persona WHERE nome='perm_rh.frequencia.lancar'), 'authenticated', 'solicitacoes_abono', jsonb_build_object('id', 'd1000000-0000-0000-0000-000000000005', 'servidor_id', sa, 'tipo_abono_id', v_tipo, 'status', 'aprovado'));
  IF r <> 'ok' OR (SELECT status FROM public.solicitacoes_abono WHERE id = 'd1000000-0000-0000-0000-000000000005') <> 'aprovado' THEN
    PERFORM pg_temp.falha('solicitacoes_abono: o RH (rh.frequencia.lancar) não consegue lançar abono já aprovado (' || r || ')');
  END IF;
END $$;

-- ---------------------------------------------------------------- correções da 2ª revisão (TRIGGERS LIGADOS)
-- Executa como a persona e devolve o texto do primeiro valor (sem desfazer; a cópia do banco é descartada).
CREATE FUNCTION pg_temp.valor_como(p_uid uuid, p_role text, p_sql text) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE res text;
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', p_role)::text, true);
  EXECUTE format('SET LOCAL ROLE %I', p_role);
  BEGIN
    EXECUTE p_sql INTO res;
  EXCEPTION WHEN OTHERS THEN res := 'erro:' || SQLSTATE || ':' || left(SQLERRM, 90);
  END;
  RESET ROLE;
  RETURN res;
END $$;

-- Executa um comando (sem retorno) como a persona e MANTÉM o efeito; devolve 'ok' ou 'erro:<sqlstate>:<msg>'.
CREATE FUNCTION pg_temp.exec_como(p_uid uuid, p_role text, p_sql text) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE res text := 'ok';
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', p_role)::text, true);
  EXECUTE format('SET LOCAL ROLE %I', p_role);
  BEGIN
    EXECUTE p_sql;
  EXCEPTION WHEN OTHERS THEN res := 'erro:' || SQLSTATE || ':' || left(SQLERRM, 90);
  END;
  RESET ROLE;
  RETURN res;
END $$;

DO $$
DECLARE
  u_admin uuid := (SELECT uid FROM persona WHERE nome='admin');
  u_nenhum uuid := (SELECT uid FROM persona WHERE nome='nenhum');
  u_inativo uuid := (SELECT uid FROM persona WHERE nome='inativo');
  u_a uuid := (SELECT uid FROM persona WHERE nome='srv_a');
  u_rh uuid := (SELECT uid FROM persona WHERE nome='mod_rh');
  u_lanc uuid := (SELECT uid FROM persona WHERE nome='perm_rh.frequencia.lancar');
  u_proc uuid := (SELECT uid FROM persona WHERE nome='perm_financeiro.folha.processar');  -- módulo rh + permissão de processar
  sa text := 'b0000000-0000-0000-0000-00000000000a';
  sx uuid := 'b0000000-0000-0000-0000-0000000000c1';
  sy uuid := 'b0000000-0000-0000-0000-0000000000c2';
  px uuid := 'a0000000-0000-0000-0000-0000000000c1';   -- perfil comum ligado ao servidor sx
  r text; inst text; meta text; folha text; ficha text; item text; folha2 text; ficha2 text; item2 text; escola text; v_tipo text;
BEGIN
  -- ===== B1: o módulo rh (que edita servidores.situacao) não liga/desliga contas por esse caminho
  INSERT INTO public.servidores (id, nome_completo, cpf, situacao) VALUES (sx, 'Servidor X Teste', '00000000001', 'ativo'), (sy, 'Servidor Y Teste', '00000000002', 'ativo');
  INSERT INTO auth.users (id, email) VALUES (px, 'px@teste.invalid') ON CONFLICT DO NOTHING;
  INSERT INTO public.profiles (id, email, is_active, tipo_usuario, servidor_id) VALUES (px, 'px@teste.invalid', true, 'servidor', sx) ON CONFLICT (id) DO UPDATE SET servidor_id = sx, is_active = true;
  UPDATE public.profiles SET servidor_id = sy WHERE id = u_admin;
  -- administrador bloqueado à mão (incidente de segurança) ligado a um servidor 'inativo'
  UPDATE public.servidores SET situacao = 'inativo' WHERE id = sy;
  UPDATE public.profiles SET is_active = false, blocked_at = now(), blocked_reason = 'incidente de seguranca' WHERE id = u_admin;
  r := pg_temp.exec_como(u_rh, 'authenticated', format('UPDATE public.servidores SET situacao = ''ativo'' WHERE id = %L', sy));
  IF (SELECT is_active FROM public.profiles WHERE id = u_admin) THEN PERFORM pg_temp.falha('RH reativa um administrador bloqueado ao mudar servidores.situacao (' || r || ')'); END IF;
  UPDATE public.profiles SET is_active = true, blocked_at = NULL, blocked_reason = NULL WHERE id = u_admin;  -- restaura a persona
  -- conta comum bloqueada À MÃO também não é reativada; a bloqueada pelo automatismo volta
  UPDATE public.profiles SET is_active = false, blocked_at = now(), blocked_reason = 'bloqueio manual' WHERE id = px;
  UPDATE public.servidores SET situacao = 'inativo' WHERE id = sx;
  PERFORM pg_temp.exec_como(u_rh, 'authenticated', format('UPDATE public.servidores SET situacao = ''ativo'' WHERE id = %L', sx));
  IF (SELECT is_active FROM public.profiles WHERE id = px) THEN PERFORM pg_temp.falha('RH reativa conta bloqueada manualmente ao mudar servidores.situacao'); END IF;
  UPDATE public.profiles SET is_active = true, blocked_at = NULL, blocked_reason = NULL WHERE id = px;
  r := pg_temp.exec_como(u_rh, 'authenticated', format('UPDATE public.servidores SET situacao = ''exonerado'' WHERE id = %L', sx));
  IF (SELECT is_active FROM public.profiles WHERE id = px) THEN PERFORM pg_temp.falha('exonerar o servidor não bloqueia a conta ligada a ele (' || coalesce(r, 'sem erro; situacao=' || (SELECT situacao::text FROM public.servidores WHERE id = sx)) || ')'); END IF;
  PERFORM pg_temp.exec_como(u_rh, 'authenticated', format('UPDATE public.servidores SET situacao = ''ativo'' WHERE id = %L', sx));
  IF NOT (SELECT is_active FROM public.profiles WHERE id = px) THEN PERFORM pg_temp.falha('reativar o servidor não devolve a conta que o próprio automatismo bloqueou'); END IF;

  -- ===== I3: valor de parâmetro por servidor não vaza pelas RPCs SECURITY DEFINER
  inst := pg_temp.seed_row('config_institucional');
  meta := pg_temp.seed_row('config_parametros_meta');
  INSERT INTO public.config_parametros_valores (instituicao_id, parametro_codigo, servidor_id, valor, vigencia_inicio, ativo)
  VALUES (inst::uuid, (SELECT codigo FROM public.config_parametros_meta WHERE id = meta::uuid), sa::uuid, '"SEGREDO-INDIVIDUAL"'::jsonb, current_date - 1, true);
  r := format('SELECT public.obter_parametro_simples(%L::uuid, %L, current_date, %L::uuid)', inst, (SELECT codigo FROM public.config_parametros_meta WHERE id = meta::uuid), sa);
  IF pg_temp.valor_como(u_nenhum, 'authenticated', r) ILIKE '%SEGREDO%' THEN PERFORM pg_temp.falha('obter_parametro_simples devolve o valor individual de outro servidor a quem não tem módulo'); END IF;
  IF pg_temp.valor_como(u_inativo, 'authenticated', r) ILIKE '%SEGREDO%' THEN PERFORM pg_temp.falha('obter_parametro_simples devolve valor a usuário inativo'); END IF;
  IF pg_temp.valor_como(u_a, 'authenticated', r) NOT ILIKE '%SEGREDO%' THEN PERFORM pg_temp.falha('obter_parametro_simples não devolve ao próprio servidor o seu valor'); END IF;
  IF pg_temp.valor_como(u_rh, 'authenticated', r) NOT ILIKE '%SEGREDO%' THEN PERFORM pg_temp.falha('obter_parametro_simples não devolve ao RH o valor do servidor'); END IF;

  -- ===== I4/M3: fechar/reabrir folha só por quem pode; as RPCs gravam a auditoria
  folha := pg_temp.seed_row('folhas_pagamento', '{"competencia_ano": 2031, "competencia_mes": 7}'::jsonb);
  IF folha IS NULL THEN PERFORM pg_temp.falha('não consegui semear folhas_pagamento: ' || (SELECT msg FROM seed_erro WHERE tabela = 'folhas_pagamento' ORDER BY ctid DESC LIMIT 1)); END IF;
  -- módulo rh sem a permissão: a RLS (classe permissao) nem deixa o UPDATE chegar à linha (ok:0) ou nega (42501)
  r := pg_temp.sql_como(u_rh, 'authenticated', format('UPDATE public.folhas_pagamento SET status = ''fechada'' WHERE id = %L', folha));
  IF r NOT LIKE 'erro:42501%' AND r <> 'ok:0' THEN PERFORM pg_temp.falha('folhas_pagamento: usuário do módulo rh fecha a folha por UPDATE direto (' || r || ')'); END IF;
  -- quem tem financeiro.folha.processar passa pela RLS; é o trigger folhas_proteger_fechamento que barra (só rh.admin/admin fecham).
  -- A mensagem é exigida para medir o trigger, e não a policy.
  r := pg_temp.sql_como(u_proc, 'authenticated', format('UPDATE public.folhas_pagamento SET status = ''fechada'' WHERE id = %L', folha));
  IF r NOT LIKE 'erro:42501:Sem permissão para fechar%' THEN PERFORM pg_temp.falha('folhas_pagamento: quem processa a folha fecha por UPDATE direto (' || r || ')'); END IF;
  IF (SELECT status FROM public.folhas_pagamento WHERE id = folha::uuid) = 'fechada' THEN PERFORM pg_temp.falha('folhas_pagamento: a folha foi fechada por UPDATE direto'); END IF;
  r := pg_temp.valor_como(u_admin, 'authenticated', format('SELECT public.fechar_folha(%L::uuid, ''teste'')::text', folha));
  IF r NOT LIKE '%"success": true%' THEN PERFORM pg_temp.falha('fechar_folha falha para o administrador (' || left(r, 120) || ')'); END IF;
  -- folha FECHADA: quem processa não a apaga (a cascata levaria fichas e itens) — trigger trg_folhas_proteger_exclusao
  r := pg_temp.sql_como(u_proc, 'authenticated', format('DELETE FROM public.folhas_pagamento WHERE id = %L', folha));
  IF r NOT LIKE 'erro:42501:Folha fechada%' THEN PERFORM pg_temp.falha('folhas_pagamento: quem processa a folha apaga uma folha FECHADA (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_rh, 'authenticated', format('UPDATE public.folhas_pagamento SET status = ''reaberta'' WHERE id = %L', folha));
  IF r NOT LIKE 'erro:42501%' AND r <> 'ok:0' THEN PERFORM pg_temp.falha('folhas_pagamento: usuário do módulo rh reabre a folha por UPDATE direto (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_proc, 'authenticated', format('UPDATE public.folhas_pagamento SET status = ''reaberta'' WHERE id = %L', folha));
  IF r NOT LIKE 'erro:42501:Apenas administradores%' THEN PERFORM pg_temp.falha('folhas_pagamento: quem processa a folha reabre por UPDATE direto (' || r || ')'); END IF;
  -- folha FECHADA barra o INSERT de ficha/item para quem não é admin (triggers trg_bloquear_insercao_*), mas não para o admin
  r := pg_temp.sql_como(u_proc, 'authenticated', format('INSERT INTO public.fichas_financeiras (folha_id, servidor_id, competencia_ano, competencia_mes) VALUES (%L, %L, 2031, 7)', folha, sa));
  IF r NOT LIKE 'erro:42501:Folha fechada%' THEN PERFORM pg_temp.falha('fichas_financeiras: INSERT em folha fechada passou para quem processa a folha (' || r || ')'); END IF;
  ficha := pg_temp.valor_como(u_admin, 'authenticated', format('INSERT INTO public.fichas_financeiras (folha_id, servidor_id, competencia_ano, competencia_mes) VALUES (%L, %L, 2031, 7) RETURNING id::text', folha, sa));
  IF ficha IS NULL THEN PERFORM pg_temp.falha('fichas_financeiras: admin não insere ficha em folha fechada');
  ELSE
    r := pg_temp.sql_como(u_proc, 'authenticated', format('INSERT INTO public.itens_ficha_financeira (ficha_id, tipo, referencia, valor, descricao) VALUES (%L, ''desconto'', ''ref-teste'', 1, ''teste'')', ficha));
    IF r NOT LIKE 'erro:42501:Folha fechada%' THEN PERFORM pg_temp.falha('itens_ficha_financeira: INSERT em folha fechada passou para quem processa a folha (' || r || ')'); END IF;
    item := pg_temp.valor_como(u_admin, 'authenticated', format('INSERT INTO public.itens_ficha_financeira (ficha_id, tipo, referencia, valor, descricao) VALUES (%L, ''desconto'', ''ref-teste'', 1, ''teste'') RETURNING id::text', ficha));
    IF item IS NULL THEN PERFORM pg_temp.falha('itens_ficha_financeira: admin não insere item em folha fechada'); END IF;
    -- mover um item ENTRE fichas de folhas diferentes também é alteração de folha fechada (origem e destino)
    folha2 := pg_temp.seed_row('folhas_pagamento', '{"competencia_ano": 2031, "competencia_mes": 8}'::jsonb);
    ficha2 := CASE WHEN folha2 IS NULL THEN NULL ELSE pg_temp.seed_row('fichas_financeiras', jsonb_build_object('folha_id', folha2, 'servidor_id', sa, 'competencia_ano', 2031, 'competencia_mes', 8)) END;
    IF item IS NULL OR ficha2 IS NULL THEN PERFORM pg_temp.falha('não consegui semear folha aberta + ficha para o teste de origem/destino: ' || coalesce((SELECT msg FROM seed_erro ORDER BY ctid DESC LIMIT 1), ''));
    ELSE
      r := pg_temp.sql_como(u_proc, 'authenticated', format('UPDATE public.itens_ficha_financeira SET ficha_id = %L WHERE id = %L', ficha2, item));
      IF r NOT LIKE 'erro:42501:Folha fechada%' THEN PERFORM pg_temp.falha('itens_ficha_financeira: item SAI da folha fechada por UPDATE de ficha_id (' || r || ')'); END IF;
      item2 := pg_temp.valor_como(u_proc, 'authenticated', format('INSERT INTO public.itens_ficha_financeira (ficha_id, tipo, referencia, valor, descricao) VALUES (%L, ''desconto'', ''ref-teste-2'', 1, ''teste'') RETURNING id::text', ficha2));
      IF item2 IS NULL THEN PERFORM pg_temp.falha('itens_ficha_financeira: quem processa não insere item em folha ABERTA');
      ELSE
        r := pg_temp.sql_como(u_proc, 'authenticated', format('UPDATE public.itens_ficha_financeira SET ficha_id = %L WHERE id = %L', ficha, item2));
        IF r NOT LIKE 'erro:42501:Folha fechada%' THEN PERFORM pg_temp.falha('itens_ficha_financeira: item ENTRA na folha fechada por UPDATE de ficha_id (' || r || ')'); END IF;
      END IF;
    END IF;
  END IF;
  -- posse derivada (classe permissao;filho=): o servidor sem módulo lê a folha FECHADA em que tem ficha, e só ela
  UPDATE public.profiles SET is_active = true, servidor_id = sx WHERE id = px;
  IF pg_temp.sel(px, 'authenticated', 'folhas_pagamento') <> 0 THEN PERFORM pg_temp.falha('folhas_pagamento: servidor sem ficha enxerga folha(s) (' || pg_temp.sel(px, 'authenticated', 'folhas_pagamento') || ')'); END IF;
  r := pg_temp.valor_como(u_admin, 'authenticated', format('INSERT INTO public.fichas_financeiras (folha_id, servidor_id, competencia_ano, competencia_mes) VALUES (%L, %L, 2031, 7) RETURNING id::text', folha, sx));
  IF r IS NULL THEN PERFORM pg_temp.falha('fichas_financeiras: admin não insere a ficha do servidor sx na folha fechada');
  ELSIF pg_temp.sel(px, 'authenticated', 'folhas_pagamento') <> 1 THEN PERFORM pg_temp.falha('folhas_pagamento: servidor com ficha em folha fechada deveria ver exatamente 1 folha (viu ' || pg_temp.sel(px, 'authenticated', 'folhas_pagamento') || ')');
  END IF;
  r := pg_temp.valor_como(u_admin, 'authenticated', format('SELECT public.reabrir_folha(%L::uuid, ''teste de reabertura'')::text', folha));
  IF r NOT LIKE '%"success": true%' THEN PERFORM pg_temp.falha('reabrir_folha falha para o administrador (' || left(r, 120) || ')'); END IF;
  r := pg_temp.sql_como(u_admin, 'authenticated', 'UPDATE public.config_parametros_valores SET ativo = ativo');
  IF r LIKE 'erro:%' THEN PERFORM pg_temp.falha('escrita em config_parametros_valores falha (fn_audit_parametros): ' || r); END IF;

  -- ===== I5: o formulário público de gestores escolares funciona para anon (trigger atualiza escolas_jer)
  -- Desde a P12 (migração 20261017090000) o INSERT direto é recusado (anon e logado sem módulo); só a RPC grava.
  escola := pg_temp.seed_row('escolas_jer');
  r := pg_temp.insere_como(NULL, 'anon', 'gestores_escolares', jsonb_build_object('id', 'd1000000-0000-0000-0000-000000000006', 'escola_id', escola, 'status', 'aguardando'));
  IF r = 'ok' THEN PERFORM pg_temp.falha('gestores_escolares: anon insere direto na tabela (só pela RPC registrar_gestor_publico)'); END IF;
  r := pg_temp.insere_como(u_nenhum, 'authenticated', 'gestores_escolares', jsonb_build_object('id', 'd1000000-0000-0000-0000-000000000006', 'escola_id', escola, 'status', 'aguardando'));
  IF r = 'ok' THEN PERFORM pg_temp.falha('gestores_escolares: logado sem módulo insere direto na tabela'); END IF;
  r := pg_temp.valor_como(NULL, 'anon', format('SELECT public.registrar_gestor_publico(%L::uuid, ''CICLANO'', ''10987654321'', NULL, NULL, ''c@teste.invalid'', ''95988888888'', NULL)::text', escola));
  IF r IS NULL OR r LIKE 'erro:%' OR r LIKE '%"erro"%' THEN PERFORM pg_temp.falha('gestores_escolares: anon não consegue enviar o formulário pela RPC (' || coalesce(r, 'NULL') || ')');
  ELSIF NOT (SELECT ja_cadastrada FROM public.escolas_jer WHERE id = escola::uuid) THEN PERFORM pg_temp.falha('gestores_escolares: escolas_jer.ja_cadastrada não foi marcada');
  ELSIF (SELECT status FROM public.gestores_escolares WHERE cpf = '10987654321') <> 'aguardando' THEN PERFORM pg_temp.falha('gestores_escolares: o cadastro público não nasceu aguardando');
  END IF;

  -- ===== M2/M6: usuário inativo não grava auditoria; perfil inexistente não é "ativo"
  r := pg_temp.sql_como(u_inativo, 'authenticated', 'SELECT public.log_audit(_action := ''view'', _entity_type := ''teste'', _module_name := ''rh'', _description := ''teste'')');
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('log_audit grava para usuário inativo (' || r || ')'); END IF;
  IF public.is_active_user('f1111111-1111-1111-1111-111111111111'::uuid) THEN PERFORM pg_temp.falha('is_active_user(perfil inexistente) = true'); END IF;
  r := pg_temp.sql_como(NULL, 'anon', 'SELECT public.registrar_denuncia_publica(true, ''outro'', ''x'', ''2026-01-01'', ''x'', ''descricao de teste'', NULL, NULL, NULL, NULL, NULL)');
  IF r NOT LIKE 'ok:%' THEN PERFORM pg_temp.falha('registrar_denuncia_publica (anon) falha (' || r || ')'); END IF;

  -- ===== M4: colunas de autoria e rejeição também não são escolhidas pelo servidor
  v_tipo := pg_temp.seed_row('tipos_abono');
  r := pg_temp.insere_como(u_a, 'authenticated', 'solicitacoes_abono', jsonb_build_object('id', 'd1000000-0000-0000-0000-000000000007', 'servidor_id', sa, 'tipo_abono_id', v_tipo, 'created_by', u_admin::text, 'motivo_rejeicao', 'forjado: rejeitado por RH'));
  IF r <> 'ok' THEN PERFORM pg_temp.falha('solicitacoes_abono: pedido do servidor falhou (' || r || ')');
  ELSIF (SELECT created_by IS DISTINCT FROM u_a OR motivo_rejeicao IS NOT NULL FROM public.solicitacoes_abono WHERE id = 'd1000000-0000-0000-0000-000000000007') THEN
    PERFORM pg_temp.falha('solicitacoes_abono: servidor forjou created_by/motivo_rejeicao');
  END IF;

  -- ===== M8: links do formulário público só do bucket arbitros-docs
  r := pg_temp.insere_como(NULL, 'anon', 'cadastro_arbitros', jsonb_build_object('id', 'd1000000-0000-0000-0000-000000000008', 'foto_url', 'javascript:alert(1)',
         'documentos_urls', jsonb_build_array('javascript:x', 'https://evil.example/login', 'https://api.exemplo.org/storage/v1/object/public/arbitros-docs/documentos/a.pdf')));
  IF r <> 'ok' THEN PERFORM pg_temp.falha('cadastro_arbitros: anon com links não envia (' || r || ')');
  ELSE
    IF (SELECT foto_url FROM public.cadastro_arbitros WHERE id = 'd1000000-0000-0000-0000-000000000008') IS NOT NULL THEN PERFORM pg_temp.falha('cadastro_arbitros: foto_url javascript: aceita'); END IF;
    IF (SELECT documentos_urls::text FROM public.cadastro_arbitros WHERE id = 'd1000000-0000-0000-0000-000000000008') <> '["https://api.exemplo.org/storage/v1/object/public/arbitros-docs/documentos/a.pdf"]' THEN
      PERFORM pg_temp.falha('cadastro_arbitros: documentos_urls com link fora do bucket aceitos: ' || (SELECT documentos_urls::text FROM public.cadastro_arbitros WHERE id = 'd1000000-0000-0000-0000-000000000008'));
    END IF;
  END IF;
END $$;

-- ---------------------------------------------------------------- cobertura adicional (3ª revisão)
-- UPDATE/DELETE em storage.objects por persona e bucket: sem WHERE (não exige visibilidade pelas policies de SELECT),
-- com as linhas dos OUTROS buckets removidas dentro da sub-transação, para medir só o bucket testado.
CREATE FUNCTION pg_temp.mut_obj(p_uid uuid, p_role text, p_bucket text, p_op text) RETURNS int
LANGUAGE plpgsql AS $$
DECLARE n int := -1;
BEGIN
  BEGIN
    DELETE FROM storage.objects WHERE bucket_id <> p_bucket;           -- como superusuário, desfeito adiante
    PERFORM set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', p_role)::text, true);
    EXECUTE format('SET LOCAL ROLE %I', p_role);
    BEGIN
      IF p_op = 'UPDATE' THEN UPDATE storage.objects SET updated_at = DEFAULT; ELSE DELETE FROM storage.objects; END IF;
      GET DIAGNOSTICS n = ROW_COUNT;
    EXCEPTION WHEN insufficient_privilege THEN n := -1;
    END;
    RESET ROLE;
    RAISE EXCEPTION USING ERRCODE = 'P0099', MESSAGE = 'desfazer';
  EXCEPTION WHEN SQLSTATE 'P0099' THEN NULL;
  END;
  RETURN n;
END $$;

DO $$
DECLARE b record; p record; permitido boolean; n int; op text; f record; t text; cols text[]; col text; vals text[]; i int;
        u_nenhum uuid := (SELECT uid FROM persona WHERE nome='nenhum');
        u_admin uuid := (SELECT uid FROM persona WHERE nome='admin');
        u_srv_i uuid := (SELECT uid FROM persona WHERE nome='srv_inativo');
        u_a uuid := (SELECT uid FROM persona WHERE nome='srv_a');
        u_den uuid := 'a0000000-0000-0000-0000-0000000000d1';
        r text; den text;
BEGIN
  -- ===== storage: UPDATE e DELETE por bucket (SELECT/INSERT já são testados acima)
  FOR b IN SELECT * FROM bucket_modulos LOOP
    FOR p IN SELECT * FROM persona WHERE nome IN ('admin','admin_inativo','nenhum','inativo','srv_a','mod_admin') OR nome IN (SELECT 'mod_' || x FROM unnest(b.modulos) x) LOOP
      permitido := p.nome = 'admin' OR (p.nome LIKE 'mod_%' AND substr(p.nome, 5) = ANY (b.modulos));
      -- evidências do inventário: sobrescrever/apagar exige patrimonio.tramitar (o módulo sozinho não basta;
      -- o caso positivo está no bloco "inventário de campo")
      IF b.bucket = 'inventario-evidencias' THEN permitido := p.nome = 'admin'; END IF;
      -- arquivos do RH (B3): sobrescrever/apagar exige o código, como o INSERT (caso positivo no bloco "RH: storage")
      IF b.codigos IS NOT NULL THEN permitido := p.nome = 'admin'; END IF;
      FOREACH op IN ARRAY ARRAY['UPDATE', 'DELETE'] LOOP
        n := pg_temp.mut_obj(p.uid, 'authenticated', b.bucket, op);
        IF permitido AND n < 1 THEN PERFORM pg_temp.falha(format('storage %s: %s deveria conseguir %s (afetou %s)', b.bucket, p.nome, op, n)); END IF;
        IF NOT permitido AND n > 0 THEN PERFORM pg_temp.falha(format('storage %s: %s consegue %s (%s objeto(s))', b.bucket, p.nome, op, n)); END IF;
      END LOOP;
    END LOOP;
    IF pg_temp.mut_obj(NULL, 'anon', b.bucket, 'UPDATE') > 0 OR pg_temp.mut_obj(NULL, 'anon', b.bucket, 'DELETE') > 0 THEN
      PERFORM pg_temp.falha('storage ' || b.bucket || ': anon consegue UPDATE/DELETE');
    END IF;
  END LOOP;

  -- ===== views: security_invoker e sem SELECT para anon (view com dono postgres leria tudo, ignorando a RLS)
  FOR f IN SELECT c.relname FROM pg_class c WHERE c.relnamespace = 'public'::regnamespace AND c.relkind IN ('v', 'm')
           AND NOT (coalesce(c.reloptions, '{}') && ARRAY['security_invoker=on', 'security_invoker=true']) LOOP
    PERFORM pg_temp.falha('view ' || f.relname || ' sem security_invoker (ignora a RLS das tabelas de origem)');
  END LOOP;
  FOR f IN SELECT c.relname FROM pg_class c WHERE c.relnamespace = 'public'::regnamespace AND c.relkind IN ('v', 'm')
           AND has_table_privilege('anon', c.oid, 'SELECT') LOOP
    PERFORM pg_temp.falha('view ' || f.relname || ': anon tem SELECT');
  END LOOP;

  -- ===== profiles: cada coluna protegida, uma por vez (não basta uma para o trigger reprovar)
  FOREACH t IN ARRAY ARRAY['email = ''x@y.z''', 'cpf = ''1''', 'blocked_at = now()', 'blocked_reason = ''x''',
                           'restringir_modulos = true', 'tipo_usuario = ''tecnico''', 'is_active = false',
                           'servidor_id = ''b0000000-0000-0000-0000-00000000000b'''] LOOP
    r := pg_temp.sql_como(u_nenhum, 'authenticated', 'UPDATE public.profiles SET ' || t || ' WHERE id = auth.uid()');
    IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('profiles: usuário comum consegue alterar (' || t || '): ' || r); END IF;
  END LOOP;
  -- sem WHERE (PATCH sem filtro): a policy de UPDATE só pode alcançar a PRÓPRIA linha
  r := pg_temp.sql_como(u_nenhum, 'authenticated', 'UPDATE public.profiles SET avatar_url = DEFAULT');
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('profiles: UPDATE sem filtro alcança ' || r || ' linha(s) (esperado ok:1, só a própria)'); END IF;
  r := pg_temp.sql_como(u_nenhum, 'authenticated', 'DELETE FROM public.profiles');
  IF r <> 'ok:0' THEN PERFORM pg_temp.falha('profiles: usuário comum apaga perfis (' || r || ')'); END IF;
  IF pg_temp.sel(u_nenhum, 'authenticated', 'profiles') <> 1 THEN PERFORM pg_temp.falha('profiles: usuário comum enxerga ' || pg_temp.sel(u_nenhum, 'authenticated', 'profiles') || ' perfis (esperado só o próprio)'); END IF;
  IF pg_temp.sel(NULL, 'anon', 'profiles') <> -1 THEN PERFORM pg_temp.falha('profiles: anon consegue SELECT'); END IF;
  IF pg_temp.sel(u_admin, 'authenticated', 'profiles') < (SELECT count(*) FROM persona) THEN PERFORM pg_temp.falha('profiles: admin não enxerga todos os perfis'); END IF;

  -- ===== denuncias (policies próprias por permissão granular): só quem tem integridade.gerenciar
  INSERT INTO auth.users (id, email) VALUES (u_den, 'denuncias@teste.invalid');
  -- handle_new_user (trigger ligado aqui) já criou o perfil INATIVO e o papel `user`: só falta ativar
  UPDATE public.profiles SET is_active = true WHERE id = u_den;
  INSERT INTO public.user_permissions (user_id, permission) VALUES (u_den, 'integridade.gerenciar');
  den := pg_temp.seed_row('denuncias');
  IF den IS NULL THEN PERFORM pg_temp.falha('não consegui semear denuncias: ' || (SELECT msg FROM seed_erro WHERE tabela = 'denuncias' LIMIT 1));
  ELSE
    IF pg_temp.sel(u_den, 'authenticated', 'denuncias') < 1 THEN PERFORM pg_temp.falha('denuncias: quem tem integridade.gerenciar não lê'); END IF;
    IF pg_temp.upd(u_den, 'authenticated', 'denuncias') < 1 THEN PERFORM pg_temp.falha('denuncias: quem tem integridade.gerenciar não atualiza'); END IF;
    FOR p IN SELECT * FROM persona WHERE nome IN ('nenhum', 'inativo', 'srv_a', 'admin_inativo', 'mod_integridade') LOOP
      IF pg_temp.sel(p.uid, 'authenticated', 'denuncias') > 0 THEN PERFORM pg_temp.falha('denuncias: ' || p.nome || ' enxerga denúncias'); END IF;
      IF pg_temp.upd(p.uid, 'authenticated', 'denuncias') > 0 OR pg_temp.del(p.uid, 'authenticated', 'denuncias') > 0 THEN PERFORM pg_temp.falha('denuncias: ' || p.nome || ' altera/apaga denúncias'); END IF;
    END LOOP;
    IF pg_temp.del(u_den, 'authenticated', 'denuncias') > 0 THEN PERFORM pg_temp.falha('denuncias: ninguém deveria apagar denúncia por API'); END IF;
    IF pg_temp.sel(NULL, 'anon', 'denuncias') <> -1 THEN PERFORM pg_temp.falha('denuncias: anon consegue SELECT'); END IF;
  END IF;

  -- ===== triggers de campos iniciais existem nas 8 tabelas do overlay 20 (e o de links em 2)
  FOREACH t IN ARRAY ARRAY['cadastro_arbitros','cadastro_arbitros_modalidades','federacoes_esportivas','gestores_escolares','solicitacoes_abono','justificativas_ponto','solicitacoes_ajuste_ponto','documentos_requerimento_servidor'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = ('public.' || t)::regclass AND tgname = 'trg_forcar_campos_iniciais' AND NOT tgisinternal AND tgenabled <> 'D') THEN
      PERFORM pg_temp.falha(t || ': falta o trigger trg_forcar_campos_iniciais');
    END IF;
  END LOOP;
  FOREACH t IN ARRAY ARRAY['cadastro_arbitros','cadastro_arbitros_modalidades'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = ('public.' || t)::regclass AND tgname = 'trg_forcar_urls_arbitros' AND NOT tgisinternal AND tgenabled <> 'D') THEN
      PERFORM pg_temp.falha(t || ': falta o trigger trg_forcar_urls_arbitros');
    END IF;
  END LOOP;

  -- ===== trilhas: nem o admin insere por API
  FOR f IN SELECT tabela FROM mapa WHERE classe IN ('trilha', 'admin_leitura') LOOP
    IF pg_temp.ins(u_admin, 'authenticated', f.tabela) <> 'negado' THEN PERFORM pg_temp.falha(f.tabela || ': admin consegue INSERT em trilha por API'); END IF;
  END LOOP;

  -- ===== gestores escolares: as duas RPCs públicas funcionam para anon (e só devolvem nome, status e escola)
  r := pg_temp.valor_como(NULL, 'anon', format('SELECT public.registrar_gestor_publico(%L::uuid, ''FULANO'', ''12345678901'', NULL, NULL, ''f@teste.invalid'', ''95999999999'', NULL)::text',
         (SELECT e.id FROM public.escolas_jer e WHERE NOT EXISTS (SELECT 1 FROM public.gestores_escolares g WHERE g.escola_id = e.id) LIMIT 1)));
  IF r IS NULL OR r LIKE 'erro:%' THEN PERFORM pg_temp.falha('registrar_gestor_publico (anon) falha: ' || coalesce(r, 'NULL')); END IF;
  IF r ~* 'cpf|email|celular|12345678901' THEN PERFORM pg_temp.falha('registrar_gestor_publico devolve dado pessoal: ' || r); END IF;
  r := pg_temp.valor_como(NULL, 'anon', 'SELECT public.consultar_gestor_por_cpf(''123.456.789-01'')::text');
  IF r IS NULL OR r LIKE 'erro:%' OR r NOT LIKE '%aguardando%' THEN PERFORM pg_temp.falha('consultar_gestor_por_cpf (anon) não acha o gestor: ' || coalesce(r, 'NULL')); END IF;
  IF r ~* 'cpf|email|celular|12345678901' THEN PERFORM pg_temp.falha('consultar_gestor_por_cpf devolve dado pessoal: ' || r); END IF;
  -- P12: só a situação e o nome da escola (sem o nome da pessoa e sem ids)
  IF r ~* 'FULANO|"id"|"nome": "FULANO' OR (r::jsonb - 'status' - 'escola') <> '{}'::jsonb OR ((r::jsonb -> 'escola') - 'nome') <> '{}'::jsonb THEN
    PERFORM pg_temp.falha('consultar_gestor_por_cpf devolve mais que situação e escola: ' || r);
  END IF;
  IF pg_temp.valor_como(NULL, 'anon', 'SELECT public.consultar_gestor_por_cpf(''000'')::text') IS NOT NULL THEN PERFORM pg_temp.falha('consultar_gestor_por_cpf aceita CPF inválido'); END IF;
END $$;

-- ---------------------------------------------------------------- P12: formulários públicos e permissões (migração 20261017090000)
-- Policies de INSERT público só com a situação inicial (também com o trigger de campos iniciais desligado);
-- limite por IP (PT429) nas RPCs públicas e no INSERT direto, sem barrar a equipe do módulo nem outro IP;
-- duplicidade neutra no cadastro de gestor; funções de permissão só sobre si mesmo ou para o admin;
-- chefe da unidade só para quem lê nomeacoes_chefe_unidade. TRIGGERS LIGADOS.
DO $$
DECLARE
  u_admin uuid := (SELECT uid FROM persona WHERE nome='admin');
  u_nenhum uuid := (SELECT uid FROM persona WHERE nome='nenhum');
  u_arb uuid := (SELECT uid FROM persona WHERE nome='mod_arbitros');
  u_fed uuid := (SELECT uid FROM persona WHERE nome='mod_federacoes');
  u_pat uuid := (SELECT uid FROM persona WHERE nome='mod_patrimonio');
  u_rh uuid := (SELECT uid FROM persona WHERE nome='mod_rh');
  u_lanc uuid := (SELECT uid FROM persona WHERE nome='perm_rh.frequencia.lancar');
  arb uuid := 'd1200000-0000-0000-0000-000000000001';
  unid text := (SELECT id_a FROM semeado WHERE tabela = 'unidades_locais');
  srv text := (SELECT id_a FROM semeado WHERE tabela = 'servidores');
  escola text; r text; i int; fn text; p record;
  fed_ok jsonb := jsonb_build_object('status', 'em_analise', 'analisado_por', NULL, 'data_analise', NULL, 'observacoes_internas', NULL);
BEGIN
  -- ===== a) policy de INSERT público sem depender do trigger trg_forcar_campos_iniciais
  ALTER TABLE public.federacoes_esportivas DISABLE TRIGGER trg_forcar_campos_iniciais;
  ALTER TABLE public.cadastro_arbitros DISABLE TRIGGER trg_forcar_campos_iniciais;
  ALTER TABLE public.cadastro_arbitros_modalidades DISABLE TRIGGER trg_forcar_campos_iniciais;
  PERFORM set_config('request.headers', '{"x-real-ip": "198.51.100.1"}', true);
  FOREACH r IN ARRAY ARRAY['ativo', 'rejeitado', 'inativo'] LOOP
    IF pg_temp.insere_como(NULL, 'anon', 'federacoes_esportivas', fed_ok || jsonb_build_object('status', r)) = 'ok' THEN
      PERFORM pg_temp.falha('P12 federacoes_esportivas: anon insere com status ' || r);
    END IF;
  END LOOP;
  IF pg_temp.insere_como(NULL, 'anon', 'federacoes_esportivas', fed_ok || jsonb_build_object('analisado_por', u_admin::text)) = 'ok'
     OR pg_temp.insere_como(NULL, 'anon', 'federacoes_esportivas', fed_ok || jsonb_build_object('data_analise', now()::text)) = 'ok'
     OR pg_temp.insere_como(NULL, 'anon', 'federacoes_esportivas', fed_ok || jsonb_build_object('observacoes_internas', 'forjado')) = 'ok' THEN
    PERFORM pg_temp.falha('P12 federacoes_esportivas: anon insere com campo interno preenchido');
  END IF;
  r := pg_temp.insere_como(NULL, 'anon', 'federacoes_esportivas', fed_ok);
  IF r <> 'ok' THEN PERFORM pg_temp.falha('P12 federacoes_esportivas: anon não envia o formulário com a situação inicial (' || r || ')'); END IF;
  r := pg_temp.insere_como(u_fed, 'authenticated', 'federacoes_esportivas', fed_ok || jsonb_build_object('status', 'ativo'));
  IF r <> 'ok' THEN PERFORM pg_temp.falha('P12 federacoes_esportivas: o módulo federacoes não cadastra federação ativa (' || r || ')'); END IF;
  IF pg_temp.insere_como(NULL, 'anon', 'cadastro_arbitros', jsonb_build_object('status', 'aprovado')) = 'ok' THEN
    PERFORM pg_temp.falha('P12 cadastro_arbitros: anon insere com status aprovado');
  END IF;
  IF pg_temp.insere_como(u_nenhum, 'authenticated', 'cadastro_arbitros', jsonb_build_object('status', 'aprovado')) = 'ok' THEN
    PERFORM pg_temp.falha('P12 cadastro_arbitros: logado sem módulo insere com status aprovado');
  END IF;
  r := pg_temp.insere_como(NULL, 'anon', 'cadastro_arbitros', jsonb_build_object('id', arb, 'status', 'enviado', 'protocolo', NULL));
  IF r <> 'ok' THEN PERFORM pg_temp.falha('P12 cadastro_arbitros: anon não envia o formulário com a situação inicial (' || r || ')');
  ELSIF (SELECT protocolo FROM public.cadastro_arbitros WHERE id = arb) !~ '^ARB-' THEN PERFORM pg_temp.falha('P12 cadastro_arbitros: protocolo não gerado');
  END IF;
  IF pg_temp.insere_como(NULL, 'anon', 'cadastro_arbitros_modalidades', jsonb_build_object('arbitro_id', arb, 'modalidade', 'p12-a', 'status', 'aprovado', 'observacoes', NULL)) = 'ok'
     OR pg_temp.insere_como(NULL, 'anon', 'cadastro_arbitros_modalidades', jsonb_build_object('arbitro_id', arb, 'modalidade', 'p12-b', 'status', 'pendente', 'observacoes', 'forjado')) = 'ok' THEN
    PERFORM pg_temp.falha('P12 cadastro_arbitros_modalidades: anon insere com status final ou observação interna');
  END IF;
  r := pg_temp.insere_como(NULL, 'anon', 'cadastro_arbitros_modalidades', jsonb_build_object('arbitro_id', arb, 'modalidade', 'p12-c', 'status', 'pendente', 'observacoes', NULL));
  IF r <> 'ok' THEN PERFORM pg_temp.falha('P12 cadastro_arbitros_modalidades: anon não envia a modalidade pendente (' || r || ')'); END IF;
  r := pg_temp.insere_como(u_arb, 'authenticated', 'cadastro_arbitros', jsonb_build_object('status', 'aprovado'));
  IF r <> 'ok' THEN PERFORM pg_temp.falha('P12 cadastro_arbitros: o módulo arbitros não cadastra árbitro aprovado (' || r || ')'); END IF;
  ALTER TABLE public.federacoes_esportivas ENABLE TRIGGER trg_forcar_campos_iniciais;
  ALTER TABLE public.cadastro_arbitros ENABLE TRIGGER trg_forcar_campos_iniciais;
  ALTER TABLE public.cadastro_arbitros_modalidades ENABLE TRIGGER trg_forcar_campos_iniciais;
  FOREACH r IN ARRAY ARRAY['cadastro_arbitros', 'cadastro_arbitros_modalidades', 'federacoes_esportivas'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = ('public.' || r)::regclass AND tgname = 'trg_limite_publico' AND NOT tgisinternal AND tgenabled <> 'D') THEN
      PERFORM pg_temp.falha('P12 ' || r || ': falta o trigger trg_limite_publico');
    END IF;
  END LOOP;

  -- ===== b) limite por IP no INSERT direto (federações: 10 por hora; o IP 198.51.100.1 já gastou 1 acima)
  PERFORM set_config('request.headers', '{"x-real-ip": "198.51.100.2"}', true);
  FOR i IN 1..10 LOOP
    r := pg_temp.insere_como(NULL, 'anon', 'federacoes_esportivas', '{}'::jsonb);
    IF r <> 'ok' THEN PERFORM pg_temp.falha('P12 limite: federação ' || i || ' de 10 recusada (' || r || ')'); END IF;
  END LOOP;
  DELETE FROM seed_erro WHERE tabela = 'federacoes_esportivas';
  r := pg_temp.insere_como(NULL, 'anon', 'federacoes_esportivas', '{}'::jsonb);
  IF r = 'ok' OR NOT EXISTS (SELECT 1 FROM seed_erro WHERE tabela = 'federacoes_esportivas' AND msg LIKE 'Muitas solicitações%') THEN
    PERFORM pg_temp.falha('P12 limite: 11ª federação do mesmo IP não deu PT429 (' || r || ': ' || coalesce((SELECT string_agg(msg, '; ') FROM seed_erro WHERE tabela = 'federacoes_esportivas'), '') || ')');
  END IF;
  FOR i IN 1..12 LOOP   -- a equipe do módulo (mesmo IP) não é barrada
    r := pg_temp.insere_como(u_fed, 'authenticated', 'federacoes_esportivas', '{}'::jsonb);
    IF r <> 'ok' THEN PERFORM pg_temp.falha('P12 limite: o módulo federacoes foi barrado pelo limite do IP (' || r || ')'); EXIT; END IF;
  END LOOP;
  PERFORM set_config('request.headers', '{"x-forwarded-for": "10.0.0.1, 198.51.100.3"}', true);
  r := pg_temp.insere_como(NULL, 'anon', 'federacoes_esportivas', '{}'::jsonb);
  IF r <> 'ok' THEN PERFORM pg_temp.falha('P12 limite: outro IP barrado pelo limite do primeiro (' || r || ')'); END IF;

  -- ===== c) limite por IP nas RPCs públicas
  PERFORM set_config('request.headers', '{"x-real-ip": "198.51.100.4"}', true);
  FOR i IN 1..30 LOOP
    r := pg_temp.valor_como(NULL, 'anon', 'SELECT public.consultar_gestor_por_cpf(''99999999999'')::text');
    IF r LIKE 'erro:%' THEN PERFORM pg_temp.falha('P12 limite: consulta de gestor ' || i || ' de 30 recusada (' || r || ')'); EXIT; END IF;
  END LOOP;
  r := pg_temp.valor_como(NULL, 'anon', 'SELECT public.consultar_gestor_por_cpf(''99999999999'')::text');
  IF coalesce(r, '') NOT LIKE 'erro:PT429%' THEN PERFORM pg_temp.falha('P12 limite: 31ª consulta de gestor não deu PT429 (' || coalesce(r, 'NULL') || ')'); END IF;
  FOR i IN 1..30 LOOP
    r := pg_temp.valor_como(NULL, 'anon', 'SELECT public.arbitro_cpf_cadastrado(''99999999999'')::text');
    IF r LIKE 'erro:%' THEN PERFORM pg_temp.falha('P12 limite: consulta de CPF de árbitro ' || i || ' de 30 recusada (' || r || ')'); EXIT; END IF;
  END LOOP;
  r := pg_temp.valor_como(NULL, 'anon', 'SELECT public.arbitro_cpf_cadastrado(''99999999999'')::text');
  IF coalesce(r, '') NOT LIKE 'erro:PT429%' THEN PERFORM pg_temp.falha('P12 limite: 31ª consulta de CPF de árbitro não deu PT429 (' || coalesce(r, 'NULL') || ')'); END IF;
  FOR i IN 1..10 LOOP
    r := pg_temp.valor_como(NULL, 'anon', 'SELECT public.registrar_denuncia_publica(true, ''outro'', ''x'', ''2026-01-01'', ''x'', ''descricao de teste'', NULL, NULL, NULL, NULL, NULL)');
    IF r LIKE 'erro:%' THEN PERFORM pg_temp.falha('P12 limite: denúncia ' || i || ' de 10 recusada (' || r || ')'); EXIT; END IF;
  END LOOP;
  r := pg_temp.valor_como(NULL, 'anon', 'SELECT public.registrar_denuncia_publica(true, ''outro'', ''x'', ''2026-01-01'', ''x'', ''descricao de teste'', NULL, NULL, NULL, NULL, NULL)');
  IF coalesce(r, '') NOT LIKE 'erro:PT429%' THEN PERFORM pg_temp.falha('P12 limite: 11ª denúncia não deu PT429 (' || coalesce(r, 'NULL') || ')'); END IF;
  -- sem usuário de API (service role, migração): não consome nem é barrado
  IF public.consultar_gestor_por_cpf('99999999999') IS NOT NULL THEN NULL; END IF;
  -- o IP fica só como hash
  IF EXISTS (SELECT 1 FROM public.limite_requisicoes_publicas WHERE chave_hash LIKE '%198.51.100%') THEN
    PERFORM pg_temp.falha('P12 limite: IP em claro em limite_requisicoes_publicas');
  END IF;
  IF pg_temp.sel(u_admin, 'authenticated', 'limite_requisicoes_publicas') <> -1 OR pg_temp.sel(NULL, 'anon', 'limite_requisicoes_publicas') <> -1 THEN
    PERFORM pg_temp.falha('P12 limite: limite_requisicoes_publicas tem privilégio de leitura pela API');
  END IF;
  FOREACH fn IN ARRAY ARRAY['public.limite_publico_consumir(text, integer, text)', 'public.limite_publico_insercao()'] LOOP
    IF has_function_privilege('anon', fn, 'EXECUTE') OR has_function_privilege('authenticated', fn, 'EXECUTE') THEN
      PERFORM pg_temp.falha('P12 limite: ' || fn || ' executável pela API');
    END IF;
  END LOOP;

  -- ===== d) gestor: duplicidade neutra e contada no limite (10 por hora)
  PERFORM set_config('request.headers', '{"x-real-ip": "198.51.100.5"}', true);
  escola := (SELECT escola_id::text FROM public.gestores_escolares WHERE cpf = '12345678901');
  FOR i IN 1..10 LOOP
    -- mesmo CPF, e-mail e escola novos; depois mesmo e-mail; depois mesma escola
    r := pg_temp.valor_como(NULL, 'anon', format('SELECT public.registrar_gestor_publico(%L::uuid, ''X'', %L, NULL, NULL, %L, ''95900000000'', NULL)::text',
           CASE i % 3 WHEN 0 THEN escola ELSE pg_temp.seed_row('escolas_jer') END,
           CASE i % 3 WHEN 1 THEN '12345678901' ELSE lpad(i::text, 11, '7') END,
           CASE i % 3 WHEN 2 THEN 'f@teste.invalid' ELSE 'p12-' || i || '@teste.invalid' END));
    IF coalesce(r, '') NOT LIKE '{"erro": %' THEN PERFORM pg_temp.falha('P12 gestor: duplicidade ' || i || ' não voltou como erro neutro (' || coalesce(r, 'NULL') || ')'); EXIT; END IF;
    IF r ~* 'unique|constraint|cpf|e-?mail|escola|23505' THEN PERFORM pg_temp.falha('P12 gestor: o erro de duplicidade revela o dado: ' || r); EXIT; END IF;
  END LOOP;
  r := pg_temp.valor_como(NULL, 'anon', format('SELECT public.registrar_gestor_publico(%L::uuid, ''X'', ''10000000001'', NULL, NULL, ''p12-novo@teste.invalid'', ''95900000000'', NULL)::text', pg_temp.seed_row('escolas_jer')));
  IF coalesce(r, '') NOT LIKE 'erro:PT429%' THEN PERFORM pg_temp.falha('P12 gestor: 11ª tentativa do mesmo IP não deu PT429 (' || coalesce(r, 'NULL') || ')'); END IF;

  -- ===== e) permissões de outro usuário: só o próprio ou o admin
  FOREACH fn IN ARRAY ARRAY['get_user_permission_codes(%L)::text', 'get_user_permissions(%L)::text', 'get_permissions_from_servidor(%L)::text',
                            '(SELECT count(*) FROM public.listar_permissoes_usuario(%L))::text'] LOOP
    r := pg_temp.valor_como(u_nenhum, 'authenticated', 'SELECT ' || CASE WHEN fn LIKE '(%' THEN '' ELSE 'public.' END || format(fn, u_admin));
    IF coalesce(r, '') NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('P12 permissões: usuário comum lê as de outro usuário com ' || fn || ' (' || coalesce(r, 'NULL') || ')'); END IF;
    r := pg_temp.valor_como(u_nenhum, 'authenticated', 'SELECT ' || CASE WHEN fn LIKE '(%' THEN '' ELSE 'public.' END || format(fn, u_nenhum));
    IF coalesce(r, '') LIKE 'erro:%' THEN PERFORM pg_temp.falha('P12 permissões: usuário não lê as próprias com ' || fn || ' (' || r || ')'); END IF;
    r := pg_temp.valor_como(u_admin, 'authenticated', 'SELECT ' || CASE WHEN fn LIKE '(%' THEN '' ELSE 'public.' END || format(fn, u_nenhum));
    IF coalesce(r, '') LIKE 'erro:%' THEN PERFORM pg_temp.falha('P12 permissões: admin não lê as de outro usuário com ' || fn || ' (' || r || ')'); END IF;
  END LOOP;
  r := pg_temp.valor_como(u_rh, 'authenticated', format('SELECT public.get_user_permission_codes(%L)::text', u_nenhum));
  IF coalesce(r, '') NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('P12 permissões: usuário com módulo lê as de outro usuário (' || coalesce(r, 'NULL') || ')'); END IF;
  r := pg_temp.valor_como(u_lanc, 'authenticated', 'SELECT public.get_user_permission_codes(auth.uid())::text');
  IF coalesce(r, '') NOT LIKE '%rh.frequencia.lancar%' THEN PERFORM pg_temp.falha('P12 permissões: o usuário não lê os próprios códigos (' || coalesce(r, 'NULL') || ')'); END IF;
  -- has_permission_code (policies, Edge Functions) segue igual para o próprio usuário e fora da API
  r := pg_temp.valor_como(u_lanc, 'authenticated', 'SELECT public.has_permission_code(auth.uid(), ''rh.frequencia.lancar'')::text');
  IF coalesce(r, '') <> 'true' THEN PERFORM pg_temp.falha('P12 permissões: has_permission_code(auth.uid()) quebrou (' || coalesce(r, 'NULL') || ')'); END IF;
  IF NOT ('rh.frequencia.lancar' = ANY (public.get_user_permission_codes(u_lanc))) OR NOT public.has_permission_code(u_lanc, 'rh.frequencia.lancar')
     OR public.has_permission_code(u_admin, 'qualquer.coisa') IS DISTINCT FROM true THEN
    PERFORM pg_temp.falha('P12 permissões: fora da API (service role) a consulta de outro usuário deixou de funcionar');
  END IF;

  -- ===== f) chefe da unidade: só quem lê nomeacoes_chefe_unidade (rh ou patrimonio; admin passa)
  PERFORM set_config('session_replication_role', 'replica', true);
  INSERT INTO public.nomeacoes_chefe_unidade (unidade_local_id, servidor_id, ato_nomeacao_tipo, ato_numero, ato_data_publicacao, data_inicio, status)
  VALUES (unid::uuid, srv::uuid, (SELECT e.enumlabel::public.tipo_ato_nomeacao FROM pg_enum e WHERE e.enumtypid = 'public.tipo_ato_nomeacao'::regtype ORDER BY e.enumsortorder LIMIT 1),
          'P12/2026', current_date, current_date + 1, 'ativo');
  PERFORM set_config('session_replication_role', 'origin', true);
  FOR p IN SELECT * FROM (VALUES ('nenhum', 0), ('mod_arbitros', 0), ('mod_patrimonio', 1), ('mod_rh', 1), ('admin', 1)) v(nome, esperado) LOOP
    r := pg_temp.valor_como((SELECT uid FROM persona WHERE nome = p.nome), 'authenticated', format('SELECT count(*)::text FROM public.get_chefe_unidade_atual(%L::uuid)', unid));
    IF coalesce(r, '') <> p.esperado::text THEN
      PERFORM pg_temp.falha(format('P12 get_chefe_unidade_atual: %s recebe %s linha(s) (esperado %s)', p.nome, coalesce(r, 'NULL'), p.esperado));
    END IF;
  END LOOP;

  PERFORM pg_temp.nota('P12: INSERT público de federações e árbitros só na situação inicial, limite por IP (INSERT direto e 4 RPCs), duplicidade neutra do gestor, permissões de outro usuário e chefe da unidade verificados');
END $$;

-- ---------------------------------------------------------------- inventário de campo (migração 20261009160000)
-- fotos_vistoria_inventario é `preservar`: módulo lê, INSERT só em nome próprio, UPDATE só do autor ou com
-- patrimonio.tramitar, DELETE só com patrimonio.tramitar; só legenda/tem_pessoa/codigo_objeto mudam (trigger). O bucket inventario-evidencias segue a mesma regra
-- para sobrescrever/apagar. TRIGGERS LIGADOS.
DO $$
DECLARE
  u_trm uuid := 'a0000000-0000-0000-0000-0000000000f1';   -- módulo patrimonio + patrimonio.tramitar
  u_pat uuid := (SELECT uid FROM persona WHERE nome='mod_patrimonio');
  u_mob uuid := (SELECT uid FROM persona WHERE nome='mod_patrimonio_mobile');
  camp text := (SELECT id_a FROM semeado WHERE tabela = 'campanhas_inventario');
  unid text := (SELECT id_a FROM semeado WHERE tabela = 'unidades_locais');
  hash text := repeat('ab', 32);
  ins_sql text := 'INSERT INTO public.fotos_vistoria_inventario (campanha_id, unidade_local_id, storage_path, hash_sha256, capturada_em%s) VALUES (%L, %L, %L, %L, now()%s)';
  foto text; r text; p record; campo text;
BEGIN
  INSERT INTO auth.users (id, email) VALUES (u_trm, 'tramitar@teste.invalid');
  UPDATE public.profiles SET is_active = true WHERE id = u_trm;
  INSERT INTO public.user_permissions (user_id, permission) VALUES (u_trm, 'patrimonio.tramitar');
  INSERT INTO public.user_modules (user_id, module) VALUES (u_trm, 'patrimonio');
  foto := pg_temp.seed_row('fotos_vistoria_inventario', jsonb_build_object('campanha_id', camp, 'unidade_local_id', unid,
            'storage_path', camp || '/' || unid || '/semente.jpg', 'hash_sha256', hash, 'capturada_em', now()::text, 'usuario_id', u_pat));
  IF foto IS NULL THEN
    PERFORM pg_temp.falha('não consegui semear fotos_vistoria_inventario: ' || coalesce((SELECT msg FROM seed_erro WHERE tabela = 'fotos_vistoria_inventario' LIMIT 1), '?'));
    RETURN;
  END IF;
  FOR p IN SELECT * FROM persona WHERE nome IN ('admin', 'mod_patrimonio', 'mod_patrimonio_mobile') LOOP
    IF pg_temp.sel(p.uid, 'authenticated', 'fotos_vistoria_inventario') < 1 THEN PERFORM pg_temp.falha('fotos_vistoria_inventario: ' || p.nome || ' não lê'); END IF;
  END LOOP;
  FOR p IN SELECT * FROM persona WHERE nome IN ('nenhum', 'inativo', 'srv_a', 'admin_inativo', 'mod_rh', 'mod_admin') LOOP
    IF pg_temp.sel(p.uid, 'authenticated', 'fotos_vistoria_inventario') > 0 THEN PERFORM pg_temp.falha('fotos_vistoria_inventario: ' || p.nome || ' enxerga fotos'); END IF;
    IF pg_temp.upd(p.uid, 'authenticated', 'fotos_vistoria_inventario') > 0 OR pg_temp.del(p.uid, 'authenticated', 'fotos_vistoria_inventario') > 0 THEN
      PERFORM pg_temp.falha('fotos_vistoria_inventario: ' || p.nome || ' altera/apaga fotos');
    END IF;
    r := pg_temp.sql_como(p.uid, 'authenticated', format(ins_sql, '', camp, unid, 'x/' || p.nome, hash, ''));
    IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('fotos_vistoria_inventario: ' || p.nome || ' insere (' || r || ')'); END IF;
  END LOOP;
  IF pg_temp.sel(NULL, 'anon', 'fotos_vistoria_inventario') <> -1 THEN PERFORM pg_temp.falha('fotos_vistoria_inventario: anon consegue SELECT'); END IF;
  -- INSERT: o módulo grava em nome próprio (usuario_id padrão = auth.uid()), nunca em nome de outro
  r := pg_temp.sql_como(u_mob, 'authenticated', format(ins_sql, '', camp, unid, 'mob/1.jpg', hash, ''));
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('fotos_vistoria_inventario: mod_patrimonio_mobile não insere em nome próprio (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_mob, 'authenticated', format(ins_sql, ', usuario_id', camp, unid, 'mob/2.jpg', hash, ', ' || quote_literal(u_pat)));
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('fotos_vistoria_inventario: módulo insere em nome de OUTRO usuário (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_mob, 'authenticated', format(ins_sql, '', camp, unid, 'mob/3.jpg', 'NAOHEX', ''));
  IF r NOT LIKE 'erro:23514%' THEN PERFORM pg_temp.falha('fotos_vistoria_inventario: aceita hash_sha256 inválido (' || r || ')'); END IF;
  -- UPDATE: o autor (mod_patrimonio, dono da semente) e quem tem patrimonio.tramitar editam; outro usuário do módulo não
  r := pg_temp.sql_como(u_pat, 'authenticated', 'UPDATE public.fotos_vistoria_inventario SET legenda = ''fachada'', tem_pessoa = true, codigo_objeto = ''OBJ-1''');
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('fotos_vistoria_inventario: o autor não edita legenda/tem_pessoa/codigo_objeto (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_mob, 'authenticated', 'UPDATE public.fotos_vistoria_inventario SET legenda = ''alheia''');
  IF r <> 'ok:0' THEN PERFORM pg_temp.falha('fotos_vistoria_inventario: módulo edita foto de OUTRO autor sem patrimonio.tramitar (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_trm, 'authenticated', 'UPDATE public.fotos_vistoria_inventario SET legenda = ''revisada''');
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('fotos_vistoria_inventario: quem tem patrimonio.tramitar não edita a legenda (' || r || ')'); END IF;
  -- campos de prova: ninguém altera (nem quem tem patrimonio.tramitar)
  FOREACH campo IN ARRAY ARRAY['hash_sha256 = repeat(''cd'', 32)', 'storage_path = ''outro''', 'capturada_em = now() - interval ''1 day''',
                               'latitude = 1', 'longitude = 1', 'usuario_id = auth.uid()', 'id = gen_random_uuid()',
                               'campanha_id = gen_random_uuid()', 'unidade_local_id = gen_random_uuid()', 'bem_id = gen_random_uuid()',
                               'enviada_em = now() - interval ''1 hour''', 'precisao_m = 5', 'mime_type = ''image/webp''',
                               'tamanho_bytes = 10', 'dispositivo_info = ''{"so":"x"}''::jsonb'] LOOP
    r := pg_temp.sql_como(u_trm, 'authenticated', 'UPDATE public.fotos_vistoria_inventario SET ' || campo);
    IF r NOT LIKE 'erro:23514%' THEN PERFORM pg_temp.falha('fotos_vistoria_inventario: UPDATE de campo de prova passou (' || campo || ': ' || r || ')'); END IF;
  END LOOP;
  -- DELETE: só com patrimonio.tramitar
  r := pg_temp.sql_como(u_pat, 'authenticated', 'DELETE FROM public.fotos_vistoria_inventario');
  IF r <> 'ok:0' THEN PERFORM pg_temp.falha('fotos_vistoria_inventario: módulo sem patrimonio.tramitar apaga (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_trm, 'authenticated', 'DELETE FROM public.fotos_vistoria_inventario');
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('fotos_vistoria_inventario: quem tem patrimonio.tramitar não apaga (' || r || ')'); END IF;
  -- bucket: sobrescrever/apagar a evidência só com patrimonio.tramitar
  r := pg_temp.sql_como(u_pat, 'authenticated', 'DELETE FROM storage.objects WHERE bucket_id = ''inventario-evidencias''');
  IF r <> 'ok:0' THEN PERFORM pg_temp.falha('storage inventario-evidencias: módulo sem patrimonio.tramitar apaga (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_pat, 'authenticated', 'UPDATE storage.objects SET name = name WHERE bucket_id = ''inventario-evidencias''');
  IF r <> 'ok:0' THEN PERFORM pg_temp.falha('storage inventario-evidencias: módulo sem patrimonio.tramitar sobrescreve (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_trm, 'authenticated', 'DELETE FROM storage.objects WHERE bucket_id = ''inventario-evidencias''');
  IF r NOT LIKE 'ok:%' OR r = 'ok:0' THEN PERFORM pg_temp.falha('storage inventario-evidencias: quem tem patrimonio.tramitar não apaga (' || r || ')'); END IF;
  IF (SELECT public OR file_size_limit IS DISTINCT FROM 10485760 FROM storage.buckets WHERE id = 'inventario-evidencias') THEN
    PERFORM pg_temp.falha('storage inventario-evidencias: bucket público ou sem limite de 10 MB');
  END IF;
  -- unidades por campanha: a autoria do INSERT é sempre quem grava (o campo enviado é sobrescrito)
  r := pg_temp.valor_como(u_pat, 'authenticated', format('INSERT INTO public.campanhas_inventario_unidades (campanha_id, unidade_local_id, created_by, updated_by) VALUES (%L, %L, %L, %L) RETURNING created_by::text || ''|'' || updated_by::text', camp, unid, u_mob, u_mob));
  IF r IS DISTINCT FROM (u_pat::text || '|' || u_pat::text) THEN PERFORM pg_temp.falha('campanhas_inventario_unidades: created_by/updated_by escolhidos pelo cliente (' || coalesce(r, 'NULL') || ')'); END IF;
  FOREACH campo IN ARRAY ARRAY['campanhas_inventario_unidades', 'fotos_vistoria_inventario'] LOOP
    IF NOT (SELECT relforcerowsecurity FROM pg_class WHERE oid = ('public.' || campo)::regclass) THEN PERFORM pg_temp.falha(campo || ': sem FORCE ROW LEVEL SECURITY'); END IF;
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = 'public.campanhas_inventario_unidades'::regclass AND NOT tgisinternal AND tgenabled <> 'D') THEN
    PERFORM pg_temp.falha('campanhas_inventario_unidades: falta o trigger de updated_at/updated_by');
  END IF;
END $$;

-- ---------------------------------------------------------------- Patrimônio: permissões (P14 entrega 4, migração 20261023100000) (TRIGGERS LIGADOS)
-- O app de coleta (mod_patrimonio_mobile) lê e cadastra bem (a foto no próprio INSERT), lê e registra coleta, só pede
-- baixa e movimentação, muda a situação da unidade na vistoria e não altera nem apaga bem, unidade, almoxarifado ou
-- campanha; as estatísticas da campanha seguem vindo do trigger (fn_atualizar_estatisticas_campanha, SECURITY DEFINER).
-- O UPDATE de bem exige patrimonio.editar; o DELETE, o papel admin; valor, data e forma de aquisição e situação só o
-- admin muda pela API (fn_bens_proteger_colunas, 42501), e patrimonio_decidir_baixa (SECURITY DEFINER) segue baixando.
DO $$
DECLARE
  u_mob uuid := (SELECT uid FROM persona WHERE nome = 'mod_patrimonio_mobile');
  u_pat uuid := (SELECT uid FROM persona WHERE nome = 'mod_patrimonio');
  u_edt uuid := (SELECT uid FROM persona WHERE nome = 'perm_patrimonio.editar');
  u_admin uuid := (SELECT uid FROM persona WHERE nome = 'admin');
  u_trm uuid := 'a0000000-0000-0000-0000-0000000000f2';   -- módulo patrimonio + patrimonio.tramitar
  unid uuid := (SELECT id_a FROM semeado WHERE tabela = 'unidades_locais')::uuid;
  camp uuid; bem uuid; bem2 uuid; baixa uuid; r text; t text; n int; campo text;
BEGIN
  IF u_edt IS NULL THEN PERFORM pg_temp.falha('P14: sem a persona perm_patrimonio.editar (altera= de bens_patrimoniais no mapa?)'); RETURN; END IF;
  INSERT INTO auth.users (id, email) VALUES (u_trm, 'tramitar-p14@teste.invalid');
  UPDATE public.profiles SET is_active = true WHERE id = u_trm;
  INSERT INTO public.user_permissions (user_id, permission) VALUES (u_trm, 'patrimonio.tramitar');
  INSERT INTO public.user_modules (user_id, module) VALUES (u_trm, 'patrimonio');
  INSERT INTO public.campanhas_inventario (nome, ano, data_inicio, data_fim)
    VALUES ('Campanha P14', 2026, current_date, current_date + 30) RETURNING id INTO camp;
  INSERT INTO public.bens_patrimoniais (descricao, data_aquisicao, valor_aquisicao, unidade_local_id)
    VALUES ('Bem P14', current_date, 100, unid) RETURNING id INTO bem;
  INSERT INTO public.bens_patrimoniais (descricao, data_aquisicao, valor_aquisicao, unidade_local_id)
    VALUES ('Bem P14 sem filhos', current_date, 50, unid) RETURNING id INTO bem2;
  INSERT INTO public.campanhas_inventario_unidades (campanha_id, unidade_local_id) VALUES (camp, unid);

  -- ===== coletor: bem
  IF pg_temp.sel(u_mob, 'authenticated', 'bens_patrimoniais') < 1 THEN PERFORM pg_temp.falha('P14: coletor não lê bens'); END IF;
  r := pg_temp.valor_desfeito_como(u_mob, 'authenticated', format(
    'INSERT INTO public.bens_patrimoniais (descricao, data_aquisicao, valor_aquisicao, unidade_local_id, situacao, forma_aquisicao, foto_bem_url) '
    'VALUES (''Cadeira'', current_date, 0, %L, ''ativo'', ''compra'', ''https://x/foto.jpg'') RETURNING numero_patrimonio || ''|'' || foto_bem_url', unid));
  IF r NOT LIKE 'PAT-%|https://x/foto.jpg' THEN PERFORM pg_temp.falha('P14: coletor não cadastra bem com a foto no INSERT e lê de volta (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_mob, 'authenticated', format('UPDATE public.bens_patrimoniais SET foto_bem_url = ''x'' WHERE id = %L', bem));
  IF r <> 'ok:0' THEN PERFORM pg_temp.falha('P14: coletor altera bem (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_mob, 'authenticated', format('DELETE FROM public.bens_patrimoniais WHERE id = %L', bem2));
  IF r <> 'ok:0' THEN PERFORM pg_temp.falha('P14: coletor apaga bem (' || r || ')'); END IF;

  -- ===== coletor: coleta (e as estatísticas da campanha, pelo trigger SECURITY DEFINER)
  r := pg_temp.exec_como(u_mob, 'authenticated', format('INSERT INTO public.coletas_inventario (campanha_id, bem_id) VALUES (%L, %L)', camp, bem));
  IF r <> 'ok' THEN PERFORM pg_temp.falha('P14: coletor não registra coleta (' || r || ')'); END IF;
  IF (SELECT total_conferidos FROM public.campanhas_inventario WHERE id = camp) IS DISTINCT FROM 1 THEN
    PERFORM pg_temp.falha('P14: coleta do coletor não atualizou total_conferidos da campanha ('
      || coalesce((SELECT total_conferidos::text FROM public.campanhas_inventario WHERE id = camp), 'NULL') || ')');
  END IF;
  r := pg_temp.valor_desfeito_como(u_mob, 'authenticated', format('SELECT count(*)::text FROM public.coletas_inventario WHERE campanha_id = %L', camp));
  IF r <> '1' THEN PERFORM pg_temp.falha('P14: coletor não lê a coleta que registrou (' || r || ')'); END IF;

  -- ===== coletor: pede baixa e movimentação (INSERT sem leitura de volta), não lê nem decide
  r := pg_temp.sql_como(u_mob, 'authenticated', format(
    'INSERT INTO public.baixas_patrimonio (bem_id, motivo, justificativa, status) VALUES (%L, ''inservivel'', ''quebrado'', ''solicitada'')', bem));
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('P14: coletor não pede baixa (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_mob, 'authenticated', format(
    'INSERT INTO public.movimentacoes_patrimonio (bem_id, tipo, motivo, status, unidade_local_origem_id, unidade_local_destino_id) '
    'VALUES (%L, ''transferencia_interna'', ''via app'', ''pendente'', %L, %L)', bem, unid, unid));
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('P14: coletor não pede movimentação (' || r || ')'); END IF;
  FOREACH t IN ARRAY ARRAY['baixas_patrimonio', 'movimentacoes_patrimonio'] LOOP
    IF pg_temp.sel(u_mob, 'authenticated', t) > 0 THEN PERFORM pg_temp.falha('P14: coletor lê ' || t); END IF;
  END LOOP;

  -- ===== coletor: situação da unidade na vistoria (UPDATE sim; INSERT e DELETE não)
  r := pg_temp.sql_como(u_mob, 'authenticated', format('UPDATE public.campanhas_inventario_unidades SET situacao = ''em_vistoria'' WHERE campanha_id = %L', camp));
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('P14: coletor não muda a situação da unidade na campanha (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_mob, 'authenticated', format('INSERT INTO public.campanhas_inventario_unidades (campanha_id, unidade_local_id) VALUES (%L, %L)', camp, gen_random_uuid()));
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('P14: coletor inclui unidade na campanha (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_mob, 'authenticated', format('DELETE FROM public.campanhas_inventario_unidades WHERE campanha_id = %L', camp));
  IF r <> 'ok:0' THEN PERFORM pg_temp.falha('P14: coletor apaga unidade da campanha (' || r || ')'); END IF;

  -- ===== coletor: lê mas não altera nem apaga bem, unidade, campanha; almoxarifado nem lê
  FOREACH t IN ARRAY ARRAY['bens_patrimoniais', 'unidades_locais', 'almoxarifados', 'campanhas_inventario'] LOOP
    IF pg_temp.upd(u_mob, 'authenticated', t) > 0 THEN PERFORM pg_temp.falha('P14: coletor consegue UPDATE em ' || t); END IF;
    IF pg_temp.del(u_mob, 'authenticated', t) > 0 THEN PERFORM pg_temp.falha('P14: coletor consegue DELETE em ' || t); END IF;
  END LOOP;
  FOREACH t IN ARRAY ARRAY['unidades_locais', 'campanhas_inventario'] LOOP
    IF pg_temp.sel(u_mob, 'authenticated', t) < 1 THEN PERFORM pg_temp.falha('P14: coletor não lê ' || t); END IF;
    IF pg_temp.ins(u_mob, 'authenticated', t) <> 'negado' THEN PERFORM pg_temp.falha('P14: coletor insere em ' || t); END IF;
  END LOOP;
  -- tabelas que saíram do app de coleta: nada
  FOREACH t IN ARRAY ARRAY['agenda_unidade', 'almoxarifados', 'categorias_material', 'conciliacoes_inventario', 'estoque',
                           'historico_patrimonio', 'itens_material', 'manutencoes_patrimonio', 'movimentacoes_bem',
                           'movimentacoes_estoque', 'ocorrencias_patrimonio', 'patrimonio_unidade', 'requisicao_itens',
                           'requisicoes_material', 'termos_cessao', 'documentos_cedencia'] LOOP
    IF pg_temp.sel(u_mob, 'authenticated', t) > 0 THEN PERFORM pg_temp.falha('P14: coletor ainda lê ' || t); END IF;
    IF pg_temp.ins(u_mob, 'authenticated', t) <> 'negado' THEN PERFORM pg_temp.falha('P14: coletor ainda insere em ' || t); END IF;
    IF pg_temp.upd(u_mob, 'authenticated', t) > 0 OR pg_temp.del(u_mob, 'authenticated', t) > 0 THEN
      PERFORM pg_temp.falha('P14: coletor ainda altera/apaga ' || t);
    END IF;
  END LOOP;
  IF pg_temp.sel(u_mob, 'authenticated', 'fotos_vistoria_inventario') < 1 THEN PERFORM pg_temp.falha('P14: coletor perdeu a leitura das fotos da vistoria'); END IF;

  -- ===== sistema: cadastrar pelo módulo; editar com patrimonio.editar; apagar só o admin
  r := pg_temp.valor_desfeito_como(u_pat, 'authenticated', format(
    'INSERT INTO public.bens_patrimoniais (descricao, data_aquisicao, valor_aquisicao, unidade_local_id) VALUES (''Mesa'', current_date, 10, %L) RETURNING numero_patrimonio', unid));
  IF r NOT LIKE 'PAT-%' THEN PERFORM pg_temp.falha('P14: módulo patrimonio sem patrimonio.editar não cadastra bem (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_pat, 'authenticated', format('UPDATE public.bens_patrimoniais SET descricao = ''outra'' WHERE id = %L', bem));
  IF r <> 'ok:0' THEN PERFORM pg_temp.falha('P14: módulo patrimonio SEM patrimonio.editar altera bem (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_edt, 'authenticated', format('UPDATE public.bens_patrimoniais SET descricao = ''outra'', marca = ''M'' WHERE id = %L', bem));
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('P14: quem tem patrimonio.editar não altera a descrição do bem (' || r || ')'); END IF;
  -- mesmo valor nas colunas protegidas (formulário que manda tudo) passa
  r := pg_temp.sql_como(u_edt, 'authenticated', format(
    'UPDATE public.bens_patrimoniais SET valor_aquisicao = valor_aquisicao, data_aquisicao = data_aquisicao, forma_aquisicao = forma_aquisicao, situacao = situacao, descricao = ''x'' WHERE id = %L', bem));
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('P14: UPDATE com as colunas protegidas inalteradas recusado (' || r || ')'); END IF;
  FOREACH campo IN ARRAY ARRAY['valor_aquisicao = 999', 'data_aquisicao = current_date - 1', 'forma_aquisicao = ''doacao''', 'situacao = ''baixado'''] LOOP
    r := pg_temp.sql_como(u_edt, 'authenticated', format('UPDATE public.bens_patrimoniais SET %s WHERE id = %L', campo, bem));
    IF r NOT LIKE 'erro:42501:Somente administradores%' THEN PERFORM pg_temp.falha('P14: não-admin com patrimonio.editar muda ' || campo || ' (' || r || ')'); END IF;
    r := pg_temp.sql_como(u_admin, 'authenticated', format('UPDATE public.bens_patrimoniais SET %s WHERE id = %L', campo, bem));
    IF r <> 'ok:1' THEN PERFORM pg_temp.falha('P14: admin não muda ' || campo || ' (' || r || ')'); END IF;
  END LOOP;
  FOREACH t IN ARRAY ARRAY['mod_patrimonio', 'perm_patrimonio.editar'] LOOP
    r := pg_temp.sql_como((SELECT uid FROM persona WHERE nome = t), 'authenticated', format('DELETE FROM public.bens_patrimoniais WHERE id = %L', bem2));
    IF r <> 'ok:0' THEN PERFORM pg_temp.falha('P14: ' || t || ' apaga bem (' || r || ')'); END IF;
  END LOOP;
  -- o admin passa pela RLS; a FK de historico_patrimonio (o cadastro já gravou o evento) segura a exclusão do bem
  r := pg_temp.sql_como(u_admin, 'authenticated', format('DELETE FROM public.bens_patrimoniais WHERE id = %L', bem2));
  IF r <> 'ok:1' AND r NOT LIKE 'erro:23503%historico_p%' THEN PERFORM pg_temp.falha('P14: RLS barra o admin de apagar bem (' || r || ')'); END IF;

  -- ===== decisão da baixa (SECURITY DEFINER) continua mudando a situação do bem
  r := pg_temp.exec_como(u_mob, 'authenticated', format(
    'INSERT INTO public.baixas_patrimonio (bem_id, motivo, justificativa, status) VALUES (%L, ''perda'', ''sumiu'', ''solicitada'')', bem));
  IF r <> 'ok' THEN PERFORM pg_temp.falha('P14: coletor não pede a baixa a decidir (' || r || ')'); END IF;
  SELECT id INTO baixa FROM public.baixas_patrimonio WHERE bem_id = bem AND motivo = 'perda';
  r := pg_temp.sql_como(u_pat, 'authenticated', format('SELECT public.patrimonio_decidir_baixa(%L, true)', baixa));
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('P14: módulo sem patrimonio.tramitar decide baixa (' || r || ')'); END IF;
  r := pg_temp.exec_como(u_trm, 'authenticated', format('SELECT public.patrimonio_decidir_baixa(%L, true)', baixa));
  IF r <> 'ok' THEN PERFORM pg_temp.falha('P14: patrimonio_decidir_baixa falhou para quem tem patrimonio.tramitar (' || r || ')'); END IF;
  IF (SELECT situacao FROM public.bens_patrimoniais WHERE id = bem) IS DISTINCT FROM 'baixado'
     OR (SELECT status FROM public.baixas_patrimonio WHERE id = baixa) IS DISTINCT FROM 'aprovada' THEN
    PERFORM pg_temp.falha('P14: baixa aprovada não baixou o bem (situacao '
      || coalesce((SELECT situacao FROM public.bens_patrimoniais WHERE id = bem), 'NULL') || ')');
  END IF;

  -- ===== funções e catálogo
  IF NOT (SELECT prosecdef FROM pg_proc WHERE oid = 'public.fn_atualizar_estatisticas_campanha()'::regprocedure) THEN
    PERFORM pg_temp.falha('P14: fn_atualizar_estatisticas_campanha não é SECURITY DEFINER');
  END IF;
  FOREACH t IN ARRAY ARRAY['public.fn_atualizar_estatisticas_campanha()', 'public.fn_bens_proteger_colunas()'] LOOP
    IF has_function_privilege('authenticated', t::regprocedure, 'EXECUTE') OR has_function_privilege('anon', t::regprocedure, 'EXECUTE') THEN
      PERFORM pg_temp.falha('P14: ' || t || ' executável pela API');
    END IF;
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = 'public.bens_patrimoniais'::regclass AND tgname = 'trg_bens_proteger_colunas' AND tgenabled <> 'D') THEN
    PERFORM pg_temp.falha('P14: falta o trigger trg_bens_proteger_colunas');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.module_permissions_catalog WHERE permission_code = 'patrimonio.editar' AND module_code = 'patrimonio')
     OR (SELECT count(*) FROM public.role_permissions WHERE permission = 'patrimonio.editar' AND role IN ('admin', 'manager')) <> 2 THEN
    PERFORM pg_temp.falha('P14: patrimonio.editar fora do catálogo ou sem os papéis admin e manager');
  END IF;
  PERFORM pg_temp.nota('P14 (permissões do patrimônio): coletor (bem com foto, coleta e estatística da campanha, pedidos de baixa e movimentação, situação da unidade, sem UPDATE/DELETE, tabelas fora do app), patrimonio.editar, DELETE só admin, colunas protegidas (42501) e decisão da baixa verificados');
END $$;

-- ---------------------------------------------------------------- RH: permissões e etapas (Onda B / B2) (TRIGGERS LIGADOS)
-- Migração 20261010090000_onda_b_rh_permissoes.sql (e overlay/20 no baseline):
--   * forcar_campos_iniciais com isenção por PERMISSÃO (perm:rh:rh.aprovar|rh.frequencia.lancar): quem tem o módulo
--     sem a permissão e quem tem a permissão mas é o dono do pedido gravam o pedido zerado (status pendente,
--     aprovadores nulos); quem tem módulo E permissão grava já decidido para OUTRO servidor;
--   * validar_etapa_frequencia: cada etapa do abono e do fechamento exige a sua permissão (42501 com a etapa); dados do
--     abono imutáveis fora de pendente; chave, assinatura e linha consolidada do fechamento protegidas; autoria forçada;
--   * revisão de segurança: posse por usuário (ajuste de ponto, banco de horas), ninguém grava no que é seu,
--     aprovador sem vínculo identificado pelo CPF, exclusão de justificativa só do RH;
--   * 2ª e 3ª rodadas (migração 20261010100000): tipos de abono, ficha própria e CPF, autoria (forçada, não anulável,
--     nula fora da etapa), pedido nasce pendente sem o RH, status nulo e legado, etapa em justificativa e ajuste.
DO $$
DECLARE
  u_admin uuid := (SELECT uid FROM persona WHERE nome='admin');
  u_rh uuid := (SELECT uid FROM persona WHERE nome='mod_rh');
  u_lanc uuid := (SELECT uid FROM persona WHERE nome='perm_rh.frequencia.lancar');                      -- módulo rh, sem permissão
  u_ch uuid := (SELECT uid FROM persona WHERE nome='perm_rh.aprovar');             -- chefia: módulo rh + rh.aprovar
  u_rhp uuid := (SELECT uid FROM persona WHERE nome='perm_rh.frequencia.lancar');  -- RH: módulo rh + rh.frequencia.lancar
  sa text := 'b0000000-0000-0000-0000-00000000000a';
  sb text := 'b0000000-0000-0000-0000-00000000000b';
  ponto_a text := (SELECT id_a FROM semeado WHERE tabela = 'registros_ponto');   -- registro de ponto do servidor A
  ponto_b text := (SELECT id_b FROM semeado WHERE tabela = 'registros_ponto');   -- registro de ponto do servidor B
  tipo_rh uuid; tipo_chefia uuid; r text; t text; x record;
  ab_pend uuid := 'd2000000-0000-0000-0000-000000000001';      -- pendente, tipo que exige o RH
  ab_pend2 uuid := 'd2000000-0000-0000-0000-000000000002';     -- pendente, tipo que dispensa o RH
  ab_chefia uuid := 'd2000000-0000-0000-0000-000000000003';    -- já aprovado pela chefia (etapa do RH)
  ff_novo uuid := 'd2000000-0000-0000-0000-000000000011';      -- fechamento sem validação
  ff_cons uuid := 'd2000000-0000-0000-0000-000000000012';      -- fechamento validado e consolidado
  ab_aprov uuid := 'd2000000-0000-0000-0000-000000000004';     -- abono já aprovado (fim do fluxo)
  ab_rej uuid := 'd2000000-0000-0000-0000-000000000005';       -- abono rejeitado
  aj_ch uuid := 'd2000000-0000-0000-0000-000000000041';        -- ajuste de ponto da própria chefia (posse por usuário)
  aj_a uuid := 'd2000000-0000-0000-0000-000000000042';         -- ajuste de ponto do usuário srv_a
  bh_rhp uuid := 'd2000000-0000-0000-0000-000000000051';       -- banco de horas do próprio RH
  ab_aprov2 uuid := 'd2000000-0000-0000-0000-000000000006';    -- abono aprovado pelo RH, com a autoria registrada
  aj_aprov uuid := 'd2000000-0000-0000-0000-000000000045';     -- ajuste já aprovado (com aprovador)
  jp_pend uuid := 'd2000000-0000-0000-0000-000000000033';      -- justificativa pendente no ponto A
  jp_aprov uuid := 'd2000000-0000-0000-0000-000000000034';     -- justificativa aprovada no ponto A
  u_cfg uuid := (SELECT uid FROM persona WHERE nome='perm_rh.frequencia.configurar');  -- configurador da frequência
  u_nenhum uuid := (SELECT uid FROM persona WHERE nome='nenhum');
  ab_chefia2 uuid := 'd2000000-0000-0000-0000-000000000007';   -- abono aprovado pela chefia, com a autoria registrada
  ff_reab uuid := 'd2000000-0000-0000-0000-000000000013';      -- fechamento reaberto pelo RH, à espera de reconsolidação
  tipo_just public.tipo_justificativa := (SELECT enumlabel::text::public.tipo_justificativa FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'tipo_justificativa' ORDER BY enumsortorder LIMIT 1);
  u_a uuid := (SELECT uid FROM persona WHERE nome='srv_a');                         -- servidor A (profiles.servidor_id = A)
  chefia_ok text := 'status = ''aprovado_chefia'', aprovado_chefia_por = auth.uid(), aprovado_chefia_em = now()';
  rh_ok text := 'status = ''aprovado'', aprovado_rh_por = auth.uid(), aprovado_rh_em = now()';
  encerra text := 'status = ''aprovado'', aprovado_chefia_por = auth.uid(), aprovado_chefia_em = now()';
  rejeita text := 'status = ''rejeitado'', motivo_rejeicao = ''motivo de teste''';
  validar text := 'validado_chefia = true, validado_chefia_por = auth.uid(), validado_chefia_em = now()';
  consolidar text := 'consolidado_rh = true, consolidado_rh_por = auth.uid(), consolidado_rh_em = now(), reaberto = false';
  reabrir text := 'reaberto = true, reaberto_por = auth.uid(), reaberto_em = now(), justificativa_reabertura = ''teste'', validado_chefia = false, validado_chefia_por = NULL, validado_chefia_em = NULL, consolidado_rh = false, consolidado_rh_por = NULL, consolidado_rh_em = NULL';
BEGIN
  tipo_rh := pg_temp.seed_row('tipos_abono', '{"exige_aprovacao_rh": true}'::jsonb)::uuid;
  tipo_chefia := pg_temp.seed_row('tipos_abono', '{"exige_aprovacao_rh": false}'::jsonb)::uuid;

  -- ===== campos iniciais por permissão (forcar_campos_iniciais, formato perm:)
  -- módulo rh SEM permissão, ligado ao servidor B: insere o próprio pedido (caminho da posse), mas não decide
  UPDATE public.profiles SET servidor_id = sb::uuid WHERE id = u_rh;
  r := pg_temp.insere_como(u_rh, 'authenticated', 'solicitacoes_abono', jsonb_build_object('id', 'd2000000-0000-0000-0000-000000000021', 'servidor_id', sb, 'tipo_abono_id', tipo_rh, 'status', 'aprovado', 'aprovado_rh_por', u_admin::text, 'aprovado_rh_em', now()::text));
  IF r <> 'ok' THEN PERFORM pg_temp.falha('solicitacoes_abono: módulo rh sem permissão não pede abono para si (' || r || ')');
  ELSIF (SELECT status || coalesce(aprovado_rh_por::text, '') FROM public.solicitacoes_abono WHERE id = 'd2000000-0000-0000-0000-000000000021') <> 'pendente' THEN
    PERFORM pg_temp.falha('solicitacoes_abono: módulo rh sem permissão grava o próprio pedido já aprovado (campos iniciais isentos só pelo módulo)');
  END IF;
  r := pg_temp.insere_como(u_rh, 'authenticated', 'solicitacoes_abono', jsonb_build_object('servidor_id', sa, 'tipo_abono_id', tipo_rh));
  IF r = 'ok' THEN PERFORM pg_temp.falha('solicitacoes_abono: módulo rh sem permissão insere pedido de OUTRO servidor'); END IF;
  UPDATE public.profiles SET servidor_id = NULL WHERE id = u_rh;
  -- RH com a permissão, ligado ao servidor B: o próprio pedido entra zerado; o de outro servidor entra decidido
  UPDATE public.profiles SET servidor_id = sb::uuid WHERE id = u_rhp;
  r := pg_temp.insere_como(u_rhp, 'authenticated', 'solicitacoes_abono', jsonb_build_object('id', 'd2000000-0000-0000-0000-000000000022', 'servidor_id', sb, 'tipo_abono_id', tipo_rh, 'status', 'aprovado', 'aprovado_rh_por', u_rhp::text, 'aprovado_rh_em', now()::text));
  IF r <> 'ok' THEN PERFORM pg_temp.falha('solicitacoes_abono: RH não pede abono para si (' || r || ')');
  ELSIF (SELECT status || coalesce(aprovado_rh_por::text, '') FROM public.solicitacoes_abono WHERE id = 'd2000000-0000-0000-0000-000000000022') <> 'pendente' THEN
    PERFORM pg_temp.falha('solicitacoes_abono: RH grava o PRÓPRIO pedido já aprovado (autoaprovação no INSERT)');
  END IF;
  r := pg_temp.insere_como(u_rhp, 'authenticated', 'solicitacoes_abono', jsonb_build_object('id', 'd2000000-0000-0000-0000-000000000023', 'servidor_id', sa, 'tipo_abono_id', tipo_rh, 'status', 'aprovado', 'aprovado_rh_por', u_rhp::text, 'aprovado_rh_em', now()::text));
  IF r <> 'ok' OR (SELECT status FROM public.solicitacoes_abono WHERE id = 'd2000000-0000-0000-0000-000000000023') <> 'aprovado' THEN
    PERFORM pg_temp.falha('solicitacoes_abono: RH não lança abono já aprovado para outro servidor (' || r || ')');
  END IF;
  UPDATE public.profiles SET servidor_id = NULL WHERE id = u_rhp;
  -- justificativa (posse pelo registro de ponto): chefia dona do ponto B grava zerada; no ponto A, decidida
  UPDATE public.profiles SET servidor_id = sb::uuid WHERE id = u_ch;
  r := pg_temp.insere_como(u_ch, 'authenticated', 'justificativas_ponto', jsonb_build_object('id', 'd2000000-0000-0000-0000-000000000031', 'registro_ponto_id', ponto_b, 'status', 'aprovada', 'aprovador_id', u_ch::text));
  IF r <> 'ok' THEN PERFORM pg_temp.falha('justificativas_ponto: chefia não justifica o próprio ponto (' || r || ')');
  ELSIF (SELECT status::text || coalesce(aprovador_id::text, '') FROM public.justificativas_ponto WHERE id = 'd2000000-0000-0000-0000-000000000031') <> 'pendente' THEN
    PERFORM pg_temp.falha('justificativas_ponto: chefia grava a justificativa do PRÓPRIO ponto já aprovada');
  END IF;
  -- no ponto de outro servidor, quem decide e insere já decidido é o RH (rh.frequencia.lancar); a chefia, não (3ª rodada, A)
  r := pg_temp.insere_como(u_rhp, 'authenticated', 'justificativas_ponto', jsonb_build_object('id', 'd2000000-0000-0000-0000-000000000032', 'registro_ponto_id', ponto_a, 'status', 'aprovada', 'aprovador_id', u_ch::text));
  IF r <> 'ok' OR (SELECT status::text || '|' || aprovador_id::text FROM public.justificativas_ponto WHERE id = 'd2000000-0000-0000-0000-000000000032') <> 'aprovada|' || u_rhp::text THEN
    PERFORM pg_temp.falha('justificativas_ponto: o RH não registra justificativa decidida no ponto de OUTRO servidor (' || r || ')');
  END IF;
  UPDATE public.profiles SET servidor_id = NULL WHERE id = u_ch;
  FOREACH t IN ARRAY ARRAY['solicitacoes_abono', 'justificativas_ponto', 'solicitacoes_ajuste_ponto'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = ('public.' || t)::regclass AND tgname = 'trg_forcar_campos_iniciais'
                   AND NOT tgisinternal AND encode(tgargs, 'escape') LIKE 'perm:rh:%') THEN
      PERFORM pg_temp.falha(t || ': trg_forcar_campos_iniciais não isenta por permissão (perm:rh:...)');
    END IF;
  END LOOP;

  -- ===== etapas do abono (validar_etapa_frequencia)
  INSERT INTO public.solicitacoes_abono (id, servidor_id, tipo_abono_id, data_inicio, data_fim, justificativa, status) VALUES
    (ab_pend, sa::uuid, tipo_rh, current_date, current_date, 'teste', 'pendente'),
    (ab_pend2, sa::uuid, tipo_chefia, current_date, current_date, 'teste', 'pendente'),
    (ab_chefia, sa::uuid, tipo_rh, current_date, current_date, 'teste', 'aprovado_chefia'),
    (ab_aprov, sa::uuid, tipo_rh, current_date, current_date, 'teste', 'aprovado'),
    (ab_rej, sa::uuid, tipo_rh, current_date, current_date, 'teste', 'rejeitado');
  INSERT INTO public.solicitacoes_abono (id, servidor_id, tipo_abono_id, data_inicio, data_fim, justificativa, status, aprovado_rh_por, aprovado_rh_em) VALUES
    (ab_aprov2, sa::uuid, tipo_rh, current_date, current_date, 'teste', 'aprovado', u_rhp, now());
  INSERT INTO public.solicitacoes_abono (id, servidor_id, tipo_abono_id, data_inicio, data_fim, justificativa, status, aprovado_chefia_por, aprovado_chefia_em) VALUES
    (ab_chefia2, sa::uuid, tipo_rh, current_date, current_date, 'teste', 'aprovado_chefia', u_ch, now());
  INSERT INTO public.solicitacoes_ajuste_ponto (id, servidor_id, data_ocorrido, tipo_ajuste, motivo) VALUES
    (aj_ch, u_ch, current_date, 'teste', 'teste'), (aj_a, u_a, current_date, 'teste', 'teste');
  INSERT INTO public.solicitacoes_ajuste_ponto (id, servidor_id, data_ocorrido, tipo_ajuste, motivo, status, aprovador_id, data_aprovacao) VALUES
    (aj_aprov, u_a, current_date, 'teste', 'teste', 'aprovada', u_rhp, now());
  INSERT INTO public.justificativas_ponto (id, registro_ponto_id, tipo, descricao, status, aprovador_id, data_aprovacao) VALUES
    (jp_pend, ponto_a::uuid, (SELECT enumlabel::text::public.tipo_justificativa FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'tipo_justificativa' ORDER BY enumsortorder LIMIT 1), 'teste', 'pendente', NULL, NULL),
    (jp_aprov, ponto_a::uuid, (SELECT enumlabel::text::public.tipo_justificativa FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'tipo_justificativa' ORDER BY enumsortorder LIMIT 1), 'teste', 'aprovada', u_rhp, now());
  FOR x IN SELECT * FROM (VALUES
      -- quem, linha, SET, esperado (ok:1 ou prefixo do erro)
      ('chefia', ab_pend, chefia_ok, 'ok:1'),
      ('rh', ab_pend, chefia_ok, 'erro:42501:Etapa da chefia'),
      ('chefia', ab_chefia, rh_ok, 'erro:42501:Etapa do RH'),
      ('rh', ab_chefia, rh_ok, 'ok:1'),
      ('chefia', ab_chefia, 'aprovado_rh_por = auth.uid()', 'erro:42501:Etapa do RH'),
      ('rh', ab_pend, 'aprovado_chefia_por = auth.uid()', 'erro:42501:Etapa da chefia'),
      ('chefia', ab_pend2, encerra, 'ok:1'),                         -- tipo dispensa o RH: a chefia encerra
      ('chefia', ab_pend, encerra, 'erro:42501:Etapa do RH'),        -- tipo exige o RH: a chefia não encerra
      ('chefia', ab_pend, rejeita, 'ok:1'),
      ('rh', ab_pend, rejeita, 'ok:1'),
      ('chefia', ab_chefia, rejeita, 'erro:42501:Etapa do RH'),      -- rejeitar na etapa do RH
      ('rh', ab_chefia, rejeita, 'ok:1'),
      ('chefia', ab_pend, 'status = ''cancelado''', 'erro:42501:Etapa do RH'),
      ('admin', ab_pend, rh_ok, 'ok:1')
    ) AS v(quem, linha, sets, esperado) LOOP
    r := pg_temp.sql_como(CASE x.quem WHEN 'chefia' THEN u_ch WHEN 'rh' THEN u_rhp ELSE u_admin END, 'authenticated',
                          format('UPDATE public.solicitacoes_abono SET %s WHERE id = %L', x.sets, x.linha));
    IF r NOT LIKE x.esperado || '%' THEN
      PERFORM pg_temp.falha(format('solicitacoes_abono: %s com SET %s deu %s (esperado %s)', x.quem, x.sets, r, x.esperado));
    END IF;
  END LOOP;
  -- INSERT já decidido na etapa do RH por quem só tem rh.aprovar (a isenção do forcar vale, a etapa não)
  r := pg_temp.sql_como(u_ch, 'authenticated', format('INSERT INTO public.solicitacoes_abono (servidor_id, tipo_abono_id, data_inicio, data_fim, justificativa, status, aprovado_rh_por, aprovado_rh_em) VALUES (%L, %L, current_date, current_date, ''x'', ''aprovado'', auth.uid(), now())', sa, tipo_rh));
  IF r NOT LIKE 'erro:42501:Etapa do RH%' THEN PERFORM pg_temp.falha('solicitacoes_abono: quem só tem rh.aprovar insere abono já aprovado pelo RH (' || r || ')'); END IF;
  -- DELETE é do RH
  -- (a policy de DELETE exige rh.frequencia.lancar: 0 linhas; o trigger é a defesa extra, 42501)
  r := pg_temp.sql_como(u_ch, 'authenticated', format('DELETE FROM public.solicitacoes_abono WHERE id = %L', ab_pend));
  IF r <> 'ok:0' AND r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('solicitacoes_abono: quem só tem rh.aprovar apaga abono (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_rhp, 'authenticated', format('DELETE FROM public.solicitacoes_abono WHERE id = %L', ab_pend));
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('solicitacoes_abono: RH não apaga abono de outro servidor (' || r || ')'); END IF;

  -- ===== etapas do fechamento da frequência
  INSERT INTO public.frequencia_fechamento (id, servidor_id, ano, mes) VALUES (ff_novo, sa::uuid, 2031, 1);
  INSERT INTO public.frequencia_fechamento (id, servidor_id, ano, mes, reaberto, reaberto_por, reaberto_em, justificativa_reabertura)
    VALUES (ff_reab, sa::uuid, 2031, 7, true, u_rhp, now(), 'teste');
  INSERT INTO public.frequencia_fechamento (id, servidor_id, ano, mes, validado_chefia, validado_chefia_por, validado_chefia_em, consolidado_rh, consolidado_rh_por, consolidado_rh_em)
    VALUES (ff_cons, sa::uuid, 2031, 2, true, u_ch, now(), true, u_rhp, now());
  FOR x IN SELECT * FROM (VALUES
      ('chefia', ff_novo, validar, 'ok:1'),
      ('rh', ff_novo, validar, 'erro:42501:Etapa da chefia'),
      ('chefia', ff_novo, consolidar, 'erro:42501:Etapa do RH'),
      ('rh', ff_novo, consolidar, 'ok:1'),
      ('rh', ff_cons, reabrir, 'ok:1'),
      ('chefia', ff_cons, reabrir, 'erro:42501:Etapa do RH'),
      ('chefia', ff_cons, 'validado_chefia = false', 'erro:42501:Etapa do RH'),
      ('admin', ff_novo, consolidar, 'ok:1')
    ) AS v(quem, linha, sets, esperado) LOOP
    r := pg_temp.sql_como(CASE x.quem WHEN 'chefia' THEN u_ch WHEN 'rh' THEN u_rhp ELSE u_admin END, 'authenticated',
                          format('UPDATE public.frequencia_fechamento SET %s WHERE id = %L', x.sets, x.linha));
    IF r NOT LIKE x.esperado || '%' THEN
      PERFORM pg_temp.falha(format('frequencia_fechamento: %s com SET %s deu %s (esperado %s)', x.quem, left(x.sets, 40), r, x.esperado));
    END IF;
  END LOOP;
  -- upsert do front (validar/consolidar): a linha nova não nasce consolidada por quem só valida
  r := pg_temp.sql_como(u_ch, 'authenticated', format('INSERT INTO public.frequencia_fechamento (servidor_id, ano, mes, consolidado_rh, consolidado_rh_por, consolidado_rh_em) VALUES (%L, 2031, 3, true, auth.uid(), now())', sa));
  IF r NOT LIKE 'erro:42501:Etapa do RH%' THEN PERFORM pg_temp.falha('frequencia_fechamento: quem só tem rh.aprovar insere fechamento já consolidado (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_ch, 'authenticated', format('INSERT INTO public.frequencia_fechamento (servidor_id, ano, mes, validado_chefia, validado_chefia_por, validado_chefia_em) VALUES (%L, 2031, 4, true, auth.uid(), now()) ON CONFLICT (servidor_id, ano, mes) DO UPDATE SET validado_chefia = EXCLUDED.validado_chefia, validado_chefia_por = EXCLUDED.validado_chefia_por, validado_chefia_em = EXCLUDED.validado_chefia_em', sa));
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('frequencia_fechamento: chefia não valida por upsert (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_rhp, 'authenticated', format('INSERT INTO public.frequencia_fechamento (servidor_id, ano, mes, consolidado_rh, consolidado_rh_por, consolidado_rh_em, reaberto) VALUES (%L, 2031, 2, true, auth.uid(), now(), false) ON CONFLICT (servidor_id, ano, mes) DO UPDATE SET consolidado_rh = EXCLUDED.consolidado_rh, consolidado_rh_por = EXCLUDED.consolidado_rh_por, consolidado_rh_em = EXCLUDED.consolidado_rh_em, reaberto = EXCLUDED.reaberto', sa));
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('frequencia_fechamento: RH não consolida por upsert (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_ch, 'authenticated', format('DELETE FROM public.frequencia_fechamento WHERE id = %L', ff_cons));
  IF r <> 'ok:0' AND r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('frequencia_fechamento: quem só tem rh.aprovar apaga o fechamento (' || r || ')'); END IF;
  -- dono da linha não decide sobre a própria (sem_autoaprovacao, com triggers ligados): a RLS nem alcança a linha
  UPDATE public.profiles SET servidor_id = sa::uuid WHERE id = u_ch;
  r := pg_temp.sql_como(u_ch, 'authenticated', format('UPDATE public.frequencia_fechamento SET %s WHERE id = %L', validar, ff_novo));
  IF r <> 'ok:0' AND r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('frequencia_fechamento: chefia valida a PRÓPRIA frequência (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_ch, 'authenticated', format('UPDATE public.solicitacoes_abono SET %s WHERE id = %L', chefia_ok, ab_pend2));
  IF r <> 'ok:0' AND r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('solicitacoes_abono: chefia aprova o PRÓPRIO abono (' || r || ')'); END IF;
  UPDATE public.profiles SET servidor_id = NULL WHERE id = u_ch;

  -- ===== revisão de segurança da B2: um caso por achado (cada um reprova com a versão anterior) e os positivos
  -- (achado 1) abono: sem rh.frequencia.lancar, dados imutáveis fora de pendente; a chefia só sai de pendente.
  -- (I3) a chefia não troca o tipo (nem para encerrar o fluxo: vale o tipo de OLD)
  FOR x IN SELECT * FROM (VALUES
      ('chefia', ab_aprov, 'data_fim = data_fim + 5', 'erro:42501:Etapa do RH'),       -- estende abono aprovado
      ('chefia', ab_chefia, 'justificativa = ''outra''', 'erro:42501:Etapa do RH'),
      ('rh', ab_aprov, 'data_fim = data_fim + 5', 'ok:1'),                            -- o RH corrige
      ('chefia', ab_pend, 'data_fim = data_fim + 1', 'erro:42501:Etapa do RH'),       -- nem em pendente a chefia edita (N4)
      ('chefia', ab_aprov, chefia_ok, 'erro:42501:Etapa do RH'),                      -- rebaixa o aprovado
      ('chefia', ab_rej, chefia_ok, 'erro:42501:Etapa do RH'),                        -- ressuscita o rejeitado
      ('chefia', ab_rej, 'status = ''pendente''', 'erro:42501:Etapa do RH'),
      ('chefia', ab_pend, format('%s, tipo_abono_id = %L', encerra, tipo_chefia), 'erro:42501:Etapa do RH'),  -- troca o tipo e encerra
      ('chefia', ab_pend, format('tipo_abono_id = %L', tipo_chefia), 'erro:42501:Etapa do RH'),
      ('chefia', ab_pend, format('servidor_id = %L', sb), 'erro:42501:Etapa do RH'),
      ('rh', ab_pend, format('tipo_abono_id = %L', tipo_chefia), 'ok:1')
    ) AS v(quem, linha, sets, esperado) LOOP
    r := pg_temp.sql_como(CASE x.quem WHEN 'chefia' THEN u_ch WHEN 'rh' THEN u_rhp ELSE u_admin END, 'authenticated',
                          format('UPDATE public.solicitacoes_abono SET %s WHERE id = %L', x.sets, x.linha));
    IF r NOT LIKE x.esperado || '%' THEN
      PERFORM pg_temp.falha(format('solicitacoes_abono: %s com SET %s deu %s (esperado %s)', x.quem, x.sets, r, x.esperado));
    END IF;
  END LOOP;
  -- (achado 1) fechamento: servidor/ano/mês imutáveis; consolidado intocável sem o RH; assinatura só do dono
  FOR x IN SELECT * FROM (VALUES
      ('chefia', ff_cons, 'mes = 5', 'erro:42501'),                                   -- muda o mês do consolidado
      ('chefia', ff_cons, format('servidor_id = %L', sb), 'erro:42501'),              -- muda o servidor do consolidado
      ('rh', ff_novo, 'mes = 6', 'erro:42501:Fechamento'),                            -- nem o RH muda a chave
      ('chefia', ff_cons, 'observacoes = ''x''', 'erro:42501:Etapa do RH'),
      ('rh', ff_cons, 'observacoes = ''x''', 'ok:1'),
      ('chefia', ff_novo, 'assinado_servidor = true, assinado_servidor_em = now()', 'erro:42501:Assinatura'),  -- assina pelo servidor
      ('rh', ff_novo, 'assinado_servidor = true, assinado_servidor_em = now()', 'erro:42501:Assinatura')
    ) AS v(quem, linha, sets, esperado) LOOP
    r := pg_temp.sql_como(CASE x.quem WHEN 'chefia' THEN u_ch WHEN 'rh' THEN u_rhp ELSE u_admin END, 'authenticated',
                          format('UPDATE public.frequencia_fechamento SET %s WHERE id = %L', x.sets, x.linha));
    IF r NOT LIKE x.esperado || '%' THEN
      PERFORM pg_temp.falha(format('frequencia_fechamento: %s com SET %s deu %s (esperado %s)', x.quem, left(x.sets, 40), r, x.esperado));
    END IF;
  END LOOP;
  -- positivo: o próprio servidor assina a sua frequência. Pela API a RLS ainda não deixa o servidor alterar o próprio
  -- fechamento (assinatura sem tela, fora do escopo da B2): aqui se mede só o trigger, com a RLS desligada no instante.
  ALTER TABLE public.frequencia_fechamento DISABLE ROW LEVEL SECURITY;
  r := pg_temp.sql_como(u_a, 'authenticated', format('UPDATE public.frequencia_fechamento SET assinado_servidor = true, assinado_servidor_em = now() WHERE id = %L', ff_novo));
  ALTER TABLE public.frequencia_fechamento ENABLE ROW LEVEL SECURITY;
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('frequencia_fechamento: o trigger não deixa o próprio servidor assinar a sua frequência (' || r || ')'); END IF;

  -- (I4) autoria: o par _por/_em gravado é de quem age, agora (mesmo que o comando mande outro uid e outra data)
  FOR x IN SELECT * FROM (VALUES
      ('chefia', 'solicitacoes_abono', ab_pend, 'status = ''aprovado_chefia'', aprovado_chefia_por = %L, aprovado_chefia_em = ''2000-01-01''', 'aprovado_chefia'),
      ('rh', 'solicitacoes_abono', ab_chefia, 'status = ''aprovado'', aprovado_rh_por = %L, aprovado_rh_em = ''2000-01-01''', 'aprovado_rh'),
      ('chefia', 'frequencia_fechamento', ff_novo, 'validado_chefia = true, validado_chefia_por = %L, validado_chefia_em = ''2000-01-01''', 'validado_chefia'),
      ('rh', 'frequencia_fechamento', ff_novo, 'consolidado_rh = true, consolidado_rh_por = %L, consolidado_rh_em = ''2000-01-01''', 'consolidado_rh'),
      ('rh', 'frequencia_fechamento', ff_cons, 'reaberto = true, reaberto_por = %L, reaberto_em = ''2000-01-01'', justificativa_reabertura = ''t'', consolidado_rh = false, consolidado_rh_por = NULL, consolidado_rh_em = NULL', 'reaberto')
    ) AS v(quem, tabela, linha, sets, etapa) LOOP
    r := pg_temp.valor_desfeito_como(CASE x.quem WHEN 'chefia' THEN u_ch ELSE u_rhp END, 'authenticated',
      format('UPDATE public.%I SET %s WHERE id = %L RETURNING %I::text || ''|'' || (%I >= now() - interval ''1 minute'')::text',
             x.tabela, format(x.sets, u_admin), x.linha, x.etapa || '_por', x.etapa || '_em'));
    IF r <> (CASE x.quem WHEN 'chefia' THEN u_ch ELSE u_rhp END)::text || '|true' THEN
      PERFORM pg_temp.falha(format('%s: %s registra %s em nome de outro usuário ou com data forjada (%s)', x.tabela, x.quem, x.etapa, r));
    END IF;
  END LOOP;

  -- (I1) solicitacoes_ajuste_ponto.servidor_id tem FK para profiles(id): a posse é do USUÁRIO
  r := pg_temp.insere_como(u_ch, 'authenticated', 'solicitacoes_ajuste_ponto', jsonb_build_object('id', 'd2000000-0000-0000-0000-000000000043', 'servidor_id', u_ch, 'status', 'aprovada', 'aprovador_id', u_ch, 'data_aprovacao', now()));
  IF r <> 'ok' THEN PERFORM pg_temp.falha('solicitacoes_ajuste_ponto: chefia não pede o próprio ajuste (' || r || ')');
  ELSIF (SELECT status::text || coalesce(aprovador_id::text, '') FROM public.solicitacoes_ajuste_ponto WHERE id = 'd2000000-0000-0000-0000-000000000043') <> 'pendente' THEN
    PERFORM pg_temp.falha('solicitacoes_ajuste_ponto: chefia grava o PRÓPRIO ajuste já aprovado (campos iniciais isentos)');
  END IF;
  r := pg_temp.sql_como(u_ch, 'authenticated', format('UPDATE public.solicitacoes_ajuste_ponto SET status = ''aprovada'', aprovador_id = auth.uid() WHERE id = %L', aj_ch));
  IF r <> 'ok:0' AND r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('solicitacoes_ajuste_ponto: chefia aprova o PRÓPRIO ajuste (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_ch, 'authenticated', format('UPDATE public.solicitacoes_ajuste_ponto SET status = ''aprovada'', aprovador_id = auth.uid() WHERE id = %L', aj_a));
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('solicitacoes_ajuste_ponto: chefia não aprova o ajuste de outro usuário (' || r || ')'); END IF;
  r := pg_temp.insere_como(u_a, 'authenticated', 'solicitacoes_ajuste_ponto', jsonb_build_object('id', 'd2000000-0000-0000-0000-000000000044', 'servidor_id', u_a, 'status', 'aprovada'));
  IF r <> 'ok' THEN PERFORM pg_temp.falha('solicitacoes_ajuste_ponto: o servidor não pede o próprio ajuste (' || r || ')');
  ELSIF (SELECT status::text FROM public.solicitacoes_ajuste_ponto WHERE id = 'd2000000-0000-0000-0000-000000000044') <> 'pendente' THEN
    PERFORM pg_temp.falha('solicitacoes_ajuste_ponto: o servidor grava o próprio ajuste já aprovado');
  ELSIF pg_temp.valor_desfeito_como(u_a, 'authenticated', 'SELECT count(*)::text FROM public.solicitacoes_ajuste_ponto WHERE id = ''d2000000-0000-0000-0000-000000000044''') <> '1' THEN
    PERFORM pg_temp.falha('solicitacoes_ajuste_ponto: o servidor não lê o próprio ajuste');
  END IF;

  -- (I2) ninguém grava, pelo caminho da permissão, no que é seu: ponto, frequência, banco de horas, férias, licenças, viagens
  UPDATE public.profiles SET servidor_id = sb::uuid WHERE id = u_rhp;
  FOREACH t IN ARRAY ARRAY['registros_ponto', 'frequencia_mensal'] LOOP
    IF pg_temp.ins(u_rhp, 'authenticated', t, 'servidor_id', quote_literal(sb)) <> 'negado' THEN PERFORM pg_temp.falha(t || ': o RH grava no PRÓPRIO registro'); END IF;
    IF pg_temp.ins(u_rhp, 'authenticated', t, 'servidor_id', quote_literal(sa)) = 'negado' THEN PERFORM pg_temp.falha(t || ': o RH não grava o registro de outro servidor'); END IF;
  END LOOP;
  UPDATE public.profiles SET servidor_id = NULL WHERE id = u_rhp;
  INSERT INTO public.banco_horas (id, servidor_id, mes, ano) VALUES (bh_rhp, u_rhp, 1, 2031);
  IF pg_temp.ins(u_rhp, 'authenticated', 'banco_horas', 'servidor_id', quote_literal(u_rhp)) <> 'negado' THEN PERFORM pg_temp.falha('banco_horas: o RH cria o PRÓPRIO saldo'); END IF;
  IF pg_temp.ins(u_rhp, 'authenticated', 'banco_horas', 'servidor_id', quote_literal(u_a)) = 'negado' THEN PERFORM pg_temp.falha('banco_horas: o RH não cria o saldo de outro usuário'); END IF;
  r := pg_temp.sql_como(u_rhp, 'authenticated', format('UPDATE public.banco_horas SET saldo_atual = 99 WHERE id = %L', bh_rhp));
  IF r <> 'ok:0' AND r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('banco_horas: o RH altera o PRÓPRIO saldo (' || r || ')'); END IF;
  IF pg_temp.ins(u_rhp, 'authenticated', 'lancamentos_banco_horas', 'banco_horas_id', quote_literal(bh_rhp)) <> 'negado' THEN PERFORM pg_temp.falha('lancamentos_banco_horas: o RH lança no PRÓPRIO banco de horas'); END IF;
  IF pg_temp.ins(u_rhp, 'authenticated', 'lancamentos_banco_horas', 'banco_horas_id', quote_literal((SELECT id_a FROM semeado WHERE tabela = 'banco_horas'))) = 'negado' THEN
    PERFORM pg_temp.falha('lancamentos_banco_horas: o RH não lança no banco de horas de outro usuário');
  END IF;
  FOR x IN SELECT * FROM (VALUES ('ferias_servidor', 'perm_rh.ferias.criar'), ('licencas_afastamentos', 'perm_rh.licencas.criar'),
                                 ('viagens_diarias', 'perm_rh.viagens.criar')) AS v(tabela, persona) LOOP
    UPDATE public.profiles SET servidor_id = sb::uuid WHERE id = (SELECT uid FROM persona WHERE nome = x.persona);
    IF pg_temp.ins((SELECT uid FROM persona WHERE nome = x.persona), 'authenticated', x.tabela, 'servidor_id', quote_literal(sb)) <> 'negado' THEN
      PERFORM pg_temp.falha(x.tabela || ': quem tem ' || substr(x.persona, 6) || ' grava as PRÓPRIAS linhas');
    END IF;
    IF pg_temp.ins((SELECT uid FROM persona WHERE nome = x.persona), 'authenticated', x.tabela, 'servidor_id', quote_literal(sa)) = 'negado' THEN
      PERFORM pg_temp.falha(x.tabela || ': quem tem ' || substr(x.persona, 6) || ' não grava a linha de outro servidor');
    END IF;
    UPDATE public.profiles SET servidor_id = NULL WHERE id = (SELECT uid FROM persona WHERE nome = x.persona);
  END LOOP;

  -- (I5) aprovador SEM vínculo cujo CPF é o do servidor: o pedido é dele (eh_meu_servidor compara só os dígitos)
  UPDATE public.servidores SET cpf = '123.456.789-09' WHERE id = sa::uuid;
  UPDATE public.profiles SET cpf = '12345678909', servidor_id = NULL WHERE id = u_ch;
  r := pg_temp.sql_como(u_ch, 'authenticated', format('UPDATE public.solicitacoes_abono SET %s WHERE id = %L', chefia_ok, ab_pend2));
  IF r <> 'ok:0' AND r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('solicitacoes_abono: aprovador sem vínculo com o CPF do servidor aprova o PRÓPRIO abono (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_ch, 'authenticated', format('INSERT INTO public.solicitacoes_abono (servidor_id, tipo_abono_id, data_inicio, data_fim, justificativa, status, aprovado_chefia_por, aprovado_chefia_em) VALUES (%L, %L, current_date, current_date, ''x'', ''aprovado_chefia'', auth.uid(), now())', sa, tipo_rh));
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('solicitacoes_abono: aprovador sem vínculo com o CPF do servidor insere o PRÓPRIO abono (' || r || ')'); END IF;
  UPDATE public.profiles SET cpf = '987.654.321-00' WHERE id = u_ch;                -- outro CPF: aprova normalmente
  r := pg_temp.sql_como(u_ch, 'authenticated', format('UPDATE public.solicitacoes_abono SET %s WHERE id = %L', chefia_ok, ab_pend2));
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('solicitacoes_abono: aprovador sem vínculo e com outro CPF não aprova (' || r || ')'); END IF;
  UPDATE public.profiles SET cpf = '...' WHERE id = u_ch;                          -- CPF sem dígitos nunca casa
  UPDATE public.servidores SET cpf = '' WHERE id = sa::uuid;
  r := pg_temp.sql_como(u_ch, 'authenticated', format('UPDATE public.solicitacoes_abono SET %s WHERE id = %L', chefia_ok, ab_pend2));
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('solicitacoes_abono: CPF vazio casou com CPF vazio em eh_meu_servidor (' || r || ')'); END IF;
  UPDATE public.profiles SET cpf = NULL WHERE id = u_ch;

  -- (M1) excluir justificativa é do RH (antes a chefia, com rh.aprovar, apagava a de terceiro)
  r := pg_temp.sql_como(u_ch, 'authenticated', 'DELETE FROM public.justificativas_ponto WHERE id = ''d2000000-0000-0000-0000-000000000032''');
  IF r <> 'ok:0' AND r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('justificativas_ponto: a chefia apaga justificativa de outro servidor (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_rhp, 'authenticated', 'DELETE FROM public.justificativas_ponto WHERE id = ''d2000000-0000-0000-0000-000000000032''');
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('justificativas_ponto: o RH não apaga justificativa de outro servidor (' || r || ')'); END IF;

  -- ===== reverificação de segurança da B2 (2ª rodada, migração 20261010100000): um negativo por contorno e os positivos
  -- (N1) tipos_abono: a chefia não troca exige_aprovacao_rh (encerraria o fluxo e desfaria); o configurador troca
  r := pg_temp.sql_como(u_ch, 'authenticated', format('UPDATE public.tipos_abono SET exige_aprovacao_rh = false WHERE id = %L', tipo_rh));
  IF r <> 'ok:0' AND r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('tipos_abono: a chefia (rh.aprovar) altera exige_aprovacao_rh (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_rh, 'authenticated', format('UPDATE public.tipos_abono SET nome = ''outro'' WHERE id = %L', tipo_rh));
  IF r <> 'ok:0' AND r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('tipos_abono: o módulo rh sem rh.frequencia.configurar altera o tipo (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_cfg, 'authenticated', format('UPDATE public.tipos_abono SET exige_aprovacao_rh = false WHERE id = %L', tipo_rh));
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('tipos_abono: quem tem rh.frequencia.configurar não edita o tipo de abono (' || r || ')'); END IF;
  IF pg_temp.valor_desfeito_como(u_nenhum, 'authenticated', format('SELECT count(*)::text FROM public.tipos_abono WHERE id = %L', tipo_rh)) <> '1' THEN
    PERFORM pg_temp.falha('tipos_abono: usuário ativo sem módulo deixou de ler o catálogo');
  END IF;

  -- (N2) servidores: o RH (módulo) não edita a PRÓPRIA ficha — nem pelo vínculo, nem pelo CPF (sem vínculo); edita a de outro
  UPDATE public.servidores SET cpf = '111.222.333-44' WHERE id = sa::uuid;
  UPDATE public.profiles SET cpf = '11122233344', servidor_id = NULL WHERE id = u_rh;
  r := pg_temp.sql_como(u_rh, 'authenticated', format('UPDATE public.servidores SET cpf = ''00000000000'' WHERE id = %L', sa));
  IF r <> 'ok:0' AND r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('servidores: o RH sem vínculo troca o CPF da PRÓPRIA ficha (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_rh, 'authenticated', format('UPDATE public.servidores SET observacoes = ''editada pelo RH'' WHERE id = %L', sb));
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('servidores: o RH não edita a ficha de outro servidor (' || r || ')'); END IF;
  UPDATE public.profiles SET cpf = NULL, servidor_id = sa::uuid WHERE id = u_rh;
  r := pg_temp.sql_como(u_rh, 'authenticated', format('UPDATE public.servidores SET cpf = ''00000000000'' WHERE id = %L', sa));
  IF r <> 'ok:0' AND r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('servidores: o RH edita a PRÓPRIA ficha pelo vínculo (' || r || ')'); END IF;
  UPDATE public.profiles SET servidor_id = NULL WHERE id = u_rh;

  -- (N3) autoria nula: a etapa grava o seu par mesmo sem o comando mandar; enquanto vale, o par não é apagado
  FOR x IN SELECT * FROM (VALUES
      ('chefia', 'solicitacoes_abono', ab_pend, 'status = ''aprovado_chefia''', 'aprovado_chefia'),        -- positivo do fluxo
      ('chefia', 'solicitacoes_abono', ab_pend2, 'status = ''aprovado'', aprovado_chefia_em = now()', 'aprovado_chefia'),  -- encerra
      ('rh', 'solicitacoes_abono', ab_chefia, 'status = ''aprovado''', 'aprovado_rh'),                    -- RH aprova
      ('chefia', 'frequencia_fechamento', ff_novo, 'validado_chefia = true', 'validado_chefia'),
      ('rh', 'frequencia_fechamento', ff_novo, 'consolidado_rh = true', 'consolidado_rh'),
      ('rh', 'frequencia_fechamento', ff_cons, 'reaberto = true, justificativa_reabertura = ''t'', consolidado_rh = false, consolidado_rh_por = NULL, consolidado_rh_em = NULL', 'reaberto')
    ) AS v(quem, tabela, linha, sets, etapa) LOOP
    r := pg_temp.valor_desfeito_como(CASE x.quem WHEN 'chefia' THEN u_ch ELSE u_rhp END, 'authenticated',
      format('UPDATE public.%I SET %s WHERE id = %L RETURNING coalesce(%I::text, ''NULO'') || ''|'' || coalesce((%I >= now() - interval ''1 minute'')::text, ''NULO'')',
             x.tabela, x.sets, x.linha, x.etapa || '_por', x.etapa || '_em'));
    IF r <> (CASE x.quem WHEN 'chefia' THEN u_ch ELSE u_rhp END)::text || '|true' THEN
      PERFORM pg_temp.falha(format('%s: %s registra a etapa %s sem gravar a autoria (%s)', x.tabela, x.quem, x.etapa, r));
    END IF;
  END LOOP;
  FOR x IN SELECT * FROM (VALUES
      ('rh', 'solicitacoes_abono', ab_aprov2, 'aprovado_rh_por = NULL, aprovado_rh_em = NULL'),
      ('rh', 'frequencia_fechamento', ff_cons, 'consolidado_rh_por = NULL'),
      ('rh', 'frequencia_fechamento', ff_cons, 'validado_chefia_em = NULL'),
      ('chefia', 'solicitacoes_ajuste_ponto', aj_aprov, 'aprovador_id = NULL, data_aprovacao = NULL'),
      ('rh', 'solicitacoes_ajuste_ponto', aj_aprov, 'aprovador_id = NULL, data_aprovacao = NULL')
    ) AS v(quem, tabela, linha, sets) LOOP
    r := pg_temp.sql_como(CASE x.quem WHEN 'chefia' THEN u_ch ELSE u_rhp END, 'authenticated',
                          format('UPDATE public.%I SET %s WHERE id = %L', x.tabela, x.sets, x.linha));
    IF r NOT LIKE 'erro:42501%' THEN
      PERFORM pg_temp.falha(format('%s: %s apaga a autoria de uma etapa que vale (SET %s deu %s)', x.tabela, x.quem, x.sets, r));
    END IF;
  END LOOP;

  -- (N4) created_by do abono = quem insere (também o isento) e imutável; sem RH os dados não mudam nem em pendente
  r := pg_temp.valor_desfeito_como(u_rhp, 'authenticated', format('INSERT INTO public.solicitacoes_abono (servidor_id, tipo_abono_id, data_inicio, data_fim, justificativa, created_by) VALUES (%L, %L, current_date, current_date, ''x'', %L) RETURNING created_by::text', sa, tipo_rh, u_admin));
  IF r <> u_rhp::text THEN PERFORM pg_temp.falha('solicitacoes_abono: o RH (isento) grava created_by de outro usuário (' || r || ')'); END IF;
  FOR x IN SELECT * FROM (VALUES
      ('chefia', ab_pend, format('created_by = %L', u_admin), 'erro:42501'),
      ('rh', ab_pend, format('created_by = %L', u_admin), 'erro:42501'),
      ('chefia', ab_pend, 'data_fim = data_fim + 1', 'erro:42501:Etapa do RH'),
      ('chefia', ab_pend, 'documento_url = ''http://x''', 'erro:42501:Etapa do RH'),
      ('chefia', ab_pend, 'motivo_rejeicao = ''x''', 'erro:42501:Etapa do RH'),          -- motivo sem rejeitar
      ('chefia', ab_pend, rejeita, 'ok:1'),                                              -- rejeitar o pendente segue
      ('rh', ab_pend, 'data_fim = data_fim + 1', 'ok:1')                                 -- o RH corrige
    ) AS v(quem, linha, sets, esperado) LOOP
    r := pg_temp.sql_como(CASE x.quem WHEN 'chefia' THEN u_ch ELSE u_rhp END, 'authenticated',
                          format('UPDATE public.solicitacoes_abono SET %s WHERE id = %L', x.sets, x.linha));
    IF r NOT LIKE x.esperado || '%' THEN
      PERFORM pg_temp.falha(format('solicitacoes_abono: %s com SET %s deu %s (esperado %s)', x.quem, x.sets, r, x.esperado));
    END IF;
  END LOOP;
  -- o servidor não altera o próprio pedido (não há caminho de UPDATE pela posse)
  r := pg_temp.sql_como(u_a, 'authenticated', format('UPDATE public.solicitacoes_abono SET justificativa = ''outra'' WHERE id = %L', ab_pend));
  IF r <> 'ok:0' AND r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('solicitacoes_abono: o servidor altera o próprio pedido (' || r || ')'); END IF;

  -- (N5) justificativa e ajuste: decisão só a partir de pendente, texto imutável sem RH, autoria gravada; ajuste só o RH apaga
  FOR x IN SELECT * FROM (VALUES
      ('chefia', 'solicitacoes_ajuste_ponto', aj_a, 'motivo = ''outro''', 'erro:42501:Etapa do RH'),
      ('chefia', 'solicitacoes_ajuste_ponto', aj_aprov, 'status = ''rejeitada''', 'erro:42501:Etapa do RH'),
      ('chefia', 'solicitacoes_ajuste_ponto', aj_aprov, 'observacao_aprovador = ''x''', 'erro:42501:Etapa do RH'),
      ('chefia', 'solicitacoes_ajuste_ponto', aj_a, 'status = ''cancelada''', 'erro:42501:Etapa do RH'),
      ('rh', 'solicitacoes_ajuste_ponto', aj_aprov, 'status = ''rejeitada''', 'ok:1'),
      ('rh', 'solicitacoes_ajuste_ponto', aj_a, 'motivo = ''outro''', 'ok:1'),
      ('chefia', 'justificativas_ponto', jp_aprov, 'descricao = ''outra''', 'erro:42501:Etapa do RH'),
      ('chefia', 'justificativas_ponto', jp_aprov, 'status = ''rejeitada''', 'erro:42501:Etapa do RH'),
      ('chefia', 'justificativas_ponto', jp_pend, 'status = ''rejeitada''', 'ok:1'),
      ('rh', 'justificativas_ponto', jp_aprov, 'status = ''rejeitada''', 'ok:1')
    ) AS v(quem, tabela, linha, sets, esperado) LOOP
    r := pg_temp.sql_como(CASE x.quem WHEN 'chefia' THEN u_ch ELSE u_rhp END, 'authenticated',
                          format('UPDATE public.%I SET %s WHERE id = %L', x.tabela, x.sets, x.linha));
    IF r NOT LIKE x.esperado || '%' THEN
      PERFORM pg_temp.falha(format('%s: %s com SET %s deu %s (esperado %s)', x.tabela, x.quem, x.sets, r, x.esperado));
    END IF;
  END LOOP;
  FOR x IN SELECT * FROM (VALUES ('solicitacoes_ajuste_ponto', aj_a), ('justificativas_ponto', jp_pend)) AS v(tabela, linha) LOOP
    r := pg_temp.valor_desfeito_como(u_ch, 'authenticated',
      format('UPDATE public.%I SET status = ''aprovada'', aprovador_id = %L, data_aprovacao = ''2000-01-01'' WHERE id = %L RETURNING aprovador_id::text || ''|'' || (data_aprovacao >= now() - interval ''1 minute'')::text',
             x.tabela, u_admin, x.linha));
    IF r <> u_ch::text || '|true' THEN PERFORM pg_temp.falha(format('%s: a chefia decide sem gravar a própria autoria (%s)', x.tabela, r)); END IF;
    r := pg_temp.valor_desfeito_como(u_ch, 'authenticated',
      format('UPDATE public.%I SET status = ''aprovada'' WHERE id = %L RETURNING coalesce(aprovador_id::text, ''NULO'')', x.tabela, x.linha));
    IF r <> u_ch::text THEN PERFORM pg_temp.falha(format('%s: a chefia aprova e o aprovador fica nulo (%s)', x.tabela, r)); END IF;
  END LOOP;
  r := pg_temp.sql_como(u_ch, 'authenticated', format('DELETE FROM public.solicitacoes_ajuste_ponto WHERE id = %L', aj_a));
  IF r <> 'ok:0' AND r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('solicitacoes_ajuste_ponto: a chefia apaga o ajuste de outro usuário (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_rhp, 'authenticated', format('DELETE FROM public.solicitacoes_ajuste_ponto WHERE id = %L', aj_a));
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('solicitacoes_ajuste_ponto: o RH não apaga o ajuste de outro usuário (' || r || ')'); END IF;

  -- (N6) CPF gravado sem o zero inicial casa com o CPF completo (lpad 11)
  UPDATE public.servidores SET cpf = '012.345.678-90' WHERE id = sa::uuid;
  UPDATE public.profiles SET cpf = '1234567890', servidor_id = NULL WHERE id = u_ch;
  r := pg_temp.sql_como(u_ch, 'authenticated', format('UPDATE public.solicitacoes_abono SET %s WHERE id = %L', chefia_ok, ab_pend2));
  IF r <> 'ok:0' AND r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('solicitacoes_abono: aprovador sem vínculo com o CPF sem o zero inicial aprova o PRÓPRIO abono (' || r || ')'); END IF;
  UPDATE public.profiles SET cpf = NULL WHERE id = u_ch;

  -- ===== reverificação da B2 (3ª rodada, mesma migração 20261010100000): um negativo por item e os positivos do fluxo
  -- (A) sem rh.frequencia.lancar o pedido nasce pendente: a chefia (isenta pelo forcar) não insere já decidido
  r := pg_temp.sql_como(u_ch, 'authenticated', format('INSERT INTO public.solicitacoes_abono (servidor_id, tipo_abono_id, data_inicio, data_fim, justificativa, status) VALUES (%L, %L, current_date, current_date, ''texto da chefia'', ''aprovado_chefia'')', sb, tipo_rh));
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('solicitacoes_abono: a chefia insere abono já decidido em nome de outro servidor (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_ch, 'authenticated', format('INSERT INTO public.justificativas_ponto (registro_ponto_id, tipo, descricao, status) VALUES (%L, %L, ''texto da chefia'', ''aprovada'')', ponto_a, tipo_just));
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('justificativas_ponto: a chefia insere justificativa já decidida no ponto de outro servidor (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_ch, 'authenticated', format('INSERT INTO public.solicitacoes_ajuste_ponto (servidor_id, data_ocorrido, tipo_ajuste, motivo, status) VALUES (%L, current_date, ''x'', ''texto da chefia'', ''aprovada'')', u_a));
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('solicitacoes_ajuste_ponto: a chefia insere ajuste já decidido em nome de outro usuário (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_ch, 'authenticated', format('INSERT INTO public.solicitacoes_abono (servidor_id, tipo_abono_id, data_inicio, data_fim, justificativa, aprovado_chefia_por, aprovado_chefia_em, motivo_rejeicao) VALUES (%L, %L, current_date, current_date, ''x'', auth.uid(), now(), ''x'') RETURNING status || ''|'' || coalesce(aprovado_chefia_por::text, ''NULO'') || ''|'' || coalesce(motivo_rejeicao, ''NULO'')', sb, tipo_rh));
  IF r <> 'pendente|NULO|NULO' THEN PERFORM pg_temp.falha('solicitacoes_abono: o pendente inserido pela chefia nasce com campos de decisão (' || r || ')'); END IF;
  -- positivos: o servidor pede o próprio abono (nasce pendente); o RH insere já decidido para outro
  r := pg_temp.insere_como(u_a, 'authenticated', 'solicitacoes_abono', jsonb_build_object('id', 'd2000000-0000-0000-0000-000000000061', 'servidor_id', sa, 'tipo_abono_id', tipo_rh, 'status', 'aprovado'));
  IF r <> 'ok' OR (SELECT status FROM public.solicitacoes_abono WHERE id = 'd2000000-0000-0000-0000-000000000061') <> 'pendente' THEN
    PERFORM pg_temp.falha('solicitacoes_abono: o servidor não pede o próprio abono ou ele não nasce pendente (' || r || ')');
  END IF;
  r := pg_temp.valor_desfeito_como(u_rhp, 'authenticated', format('INSERT INTO public.solicitacoes_ajuste_ponto (servidor_id, data_ocorrido, tipo_ajuste, motivo, status) VALUES (%L, current_date, ''x'', ''x'', ''aprovada'') RETURNING status::text || ''|'' || coalesce(aprovador_id::text, ''NULO'')', u_a));
  IF r <> 'aprovada|' || u_rhp::text THEN PERFORM pg_temp.falha('solicitacoes_ajuste_ponto: o RH não insere ajuste já decidido para outro usuário (' || r || ')'); END IF;

  -- (D) status legado aprovado_rh: ninguém (fora o admin) transiciona para ele
  r := pg_temp.sql_como(u_rhp, 'authenticated', format('UPDATE public.solicitacoes_abono SET status = ''aprovado_rh'' WHERE id = %L', ab_chefia));
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('solicitacoes_abono: o RH leva o abono ao status legado aprovado_rh (' || r || ')'); END IF;

  -- (E) status NULL é recusado (não vale como pendente)
  r := pg_temp.sql_como(u_rhp, 'authenticated', format('UPDATE public.solicitacoes_abono SET status = NULL WHERE id = %L', ab_pend));
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('solicitacoes_abono: status NULL aceito (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_ch, 'authenticated', format('UPDATE public.solicitacoes_ajuste_ponto SET status = NULL WHERE id = %L', aj_a));
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('solicitacoes_ajuste_ponto: status NULL aceito (' || r || ')'); END IF;

  -- (F) fora da etapa ativa o par vai a NULL; o de uma etapa que já aconteceu continua
  r := pg_temp.valor_desfeito_como(u_rhp, 'authenticated', format('UPDATE public.solicitacoes_abono SET aprovado_rh_por = auth.uid(), aprovado_rh_em = now() WHERE id = %L RETURNING coalesce(aprovado_rh_por::text, ''NULO'')', ab_pend));
  IF r <> 'NULO' THEN PERFORM pg_temp.falha('solicitacoes_abono: aprovação do RH registrada num abono pendente (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_rhp, 'authenticated', format('UPDATE public.frequencia_fechamento SET validado_chefia_por = auth.uid(), validado_chefia_em = now() WHERE id = %L RETURNING coalesce(validado_chefia_por::text, ''NULO'')', ff_novo));
  IF r <> 'NULO' THEN PERFORM pg_temp.falha('frequencia_fechamento: validação registrada sem a frequência validada (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_ch, 'authenticated', format('UPDATE public.solicitacoes_abono SET status = ''aprovado_chefia'' WHERE id = %L RETURNING aprovado_chefia_por::text || ''|'' || coalesce(aprovado_rh_por::text, ''NULO'')', ab_pend));
  IF r <> u_ch::text || '|NULO' THEN PERFORM pg_temp.falha('solicitacoes_abono: a chefia aprova o pendente e os pares não ficam como deviam (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_rhp, 'authenticated', format('UPDATE public.solicitacoes_abono SET status = ''aprovado'', aprovado_rh_por = auth.uid(), aprovado_rh_em = now() WHERE id = %L RETURNING coalesce(aprovado_chefia_por::text, ''NULO'') || ''|'' || coalesce(aprovado_rh_por::text, ''NULO'')', ab_chefia2));
  IF r <> u_ch::text || '|' || u_rhp::text THEN PERFORM pg_temp.falha('solicitacoes_abono: o RH aprova depois da chefia e o par da chefia não permanece (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_rhp, 'authenticated', format('UPDATE public.solicitacoes_abono SET status = ''rejeitado'', motivo_rejeicao = ''x'' WHERE id = %L RETURNING coalesce(aprovado_chefia_por::text, ''NULO'')', ab_chefia2));
  IF r <> u_ch::text THEN PERFORM pg_temp.falha('solicitacoes_abono: o RH rejeita depois da chefia e a aprovação da chefia some (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_rhp, 'authenticated', format('UPDATE public.frequencia_fechamento SET consolidado_rh = true, reaberto = false WHERE id = %L RETURNING coalesce(reaberto_por::text, ''NULO'')', ff_reab));
  IF r <> u_rhp::text THEN PERFORM pg_temp.falha('frequencia_fechamento: a reconsolidação apaga o registro da reabertura (' || r || ')'); END IF;

  -- (C) servidores.cpf só pelo papel admin; reformatar (mesmos dígitos) segue livre
  UPDATE public.servidores SET cpf = '123.456.789-09' WHERE id = sb::uuid;
  r := pg_temp.sql_como(u_rh, 'authenticated', format('UPDATE public.servidores SET cpf = ''99999999999'' WHERE id = %L', sb));
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('servidores: o RH (módulo) troca o CPF de uma ficha (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_rh, 'authenticated', format('UPDATE public.servidores SET cpf = ''12345678909'' WHERE id = %L', sb));
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('servidores: o RH não regrava o mesmo CPF sem pontuação (formulário da ficha) (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_admin, 'authenticated', format('UPDATE public.servidores SET cpf = ''99999999999'' WHERE id = %L', sb));
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('servidores: o admin não corrige o CPF da ficha (' || r || ')'); END IF;

  FOREACH t IN ARRAY ARRAY['solicitacoes_abono', 'frequencia_fechamento', 'justificativas_ponto', 'solicitacoes_ajuste_ponto'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = ('public.' || t)::regclass AND tgname = 'trg_validar_etapa_frequencia' AND NOT tgisinternal AND tgenabled <> 'D') THEN
      PERFORM pg_temp.falha(t || ': falta o trigger trg_validar_etapa_frequencia');
    END IF;
  END LOOP;
  IF to_regprocedure('public.validar_etapa_frequencia()') IS NOT NULL
     AND has_function_privilege('authenticated', 'public.validar_etapa_frequencia()', 'EXECUTE') THEN
    PERFORM pg_temp.falha('validar_etapa_frequencia: executável por authenticated (função de trigger)');
  END IF;
END $$;

-- ---------------------------------------------------------------- RH: storage (Onda B / B3) (TRIGGERS LIGADOS)
-- Migração 20261010210000_onda_b_rh_storage.sql (e overlays 10/40/50 no baseline):
--   * frequencias: o módulo rh lê; gravar (INSERT/UPDATE/DELETE) exige o módulo E rh.frequencia.lancar|criar|editar; o
--     servidor sem módulo lê o PDF dele (linha de frequencia_arquivos com arquivo_path = nome e servidor_id dele) e não
--     o de outro; perfil bloqueado não lê;
--   * documentos-requerimento: o módulo rh lê; gravar exige o módulo E rh.servidores.editar; o servidor lê a pasta dele
--     (<servidor_id>/...) e não a de outro nem grava nela; pasta fora do formato uuid dá false (sem erro);
--   * documentos: ninguém sem o módulo (workflow ou rh) lê ou grava, nem com objeto na pasta do próprio servidor;
--   * funções eh_meu_arquivo_frequencia/eh_minha_pasta_servidor: só authenticated executa; limite do bucket
--     documentos-requerimento; nenhuma outra policy de storage.objects cita os três buckets.
-- Os objetos e linhas criados aqui ficam na cópia descartável do banco (os blocos anteriores já rodaram).
DO $$
DECLARE
  sa text := 'b0000000-0000-0000-0000-00000000000a'; sb text := 'b0000000-0000-0000-0000-00000000000b';
  u_a uuid := (SELECT uid FROM persona WHERE nome='srv_a');
  u_b uuid := (SELECT uid FROM persona WHERE nome='srv_b');
  u_ai uuid := (SELECT uid FROM persona WHERE nome='srv_inativo');
  u_nenhum uuid := (SELECT uid FROM persona WHERE nome='nenhum');
  u_rh uuid := (SELECT uid FROM persona WHERE nome='mod_rh');
  u_lanc uuid := (SELECT uid FROM persona WHERE nome='perm_rh.frequencia.lancar');
  u_admin uuid := (SELECT uid FROM persona WHERE nome='admin');
  u_ed uuid := (SELECT uid FROM persona WHERE nome='perm_rh.servidores.editar');   -- módulo rh + rh.servidores.editar
  r text; n int; c text; p record; f text;
BEGIN
  -- funções e privilégios (sem as funções, o resto do bloco não tem como passar)
  FOREACH f IN ARRAY ARRAY['public.eh_meu_arquivo_frequencia(text)', 'public.eh_minha_pasta_servidor(text)'] LOOP
    IF to_regprocedure(f) IS NULL THEN
      PERFORM pg_temp.falha('storage do RH: função ' || f || ' não existe');
    ELSE
      IF NOT has_function_privilege('authenticated', f, 'EXECUTE') THEN PERFORM pg_temp.falha(f || ': authenticated não executa (as policies a chamam)'); END IF;
      IF has_function_privilege('anon', f, 'EXECUTE') THEN PERFORM pg_temp.falha(f || ': executável por anon'); END IF;
      IF has_function_privilege('service_role', f, 'EXECUTE') THEN PERFORM pg_temp.falha(f || ': executável pela service_role (não precisa)'); END IF;
      IF NOT (SELECT prosecdef AND coalesce(proconfig::text, '') ~ 'search_path' FROM pg_proc WHERE oid = to_regprocedure(f)) THEN PERFORM pg_temp.falha(f || ': sem SECURITY DEFINER ou sem search_path fixo'); END IF;
    END IF;
  END LOOP;
  IF to_regprocedure('public.eh_minha_pasta_servidor(text)') IS NOT NULL THEN
    FOREACH c IN ARRAY ARRAY['nao-uuid/a.pdf', 'a.pdf', '', sa || '.pdf', '../' || sa || '/a.pdf'] LOOP
      r := pg_temp.valor_como(u_a, 'authenticated', format('SELECT public.eh_minha_pasta_servidor(%L)::text', c));
      IF r IS DISTINCT FROM 'false' THEN PERFORM pg_temp.falha(format('eh_minha_pasta_servidor(%L) = %s (esperado false, sem erro)', c, coalesce(r, 'NULL'))); END IF;
    END LOOP;
    r := pg_temp.valor_como(u_a, 'authenticated', 'SELECT public.eh_minha_pasta_servidor(NULL)::text');
    IF r IS DISTINCT FROM 'false' THEN PERFORM pg_temp.falha('eh_minha_pasta_servidor(NULL) = ' || coalesce(r, 'NULL') || ' (esperado false)'); END IF;
  END IF;
  IF to_regprocedure('public.eh_meu_arquivo_frequencia(text)') IS NOT NULL THEN
    r := pg_temp.valor_como(u_a, 'authenticated', 'SELECT public.eh_meu_arquivo_frequencia(NULL)::text');
    IF r IS DISTINCT FROM 'false' THEN PERFORM pg_temp.falha('eh_meu_arquivo_frequencia(NULL) = ' || coalesce(r, 'NULL') || ' (esperado false)'); END IF;
  END IF;

  -- bucket documentos-requerimento: privado, 10 MB, PDF e imagem
  IF (SELECT public OR file_size_limit IS DISTINCT FROM 10485760
             OR allowed_mime_types IS DISTINCT FROM ARRAY['application/pdf','image/jpeg','image/png','image/webp']
        FROM storage.buckets WHERE id = 'documentos-requerimento') IS NOT FALSE THEN
    PERFORM pg_temp.falha('storage documentos-requerimento: bucket público ou sem o limite de 10 MB / tipos PDF e imagem');
  END IF;
  -- só as st_* valem para estes buckets (policies permissivas são OR: uma antiga sobrando anularia a regra); policy
  -- sem filtro de bucket_id vale para todos e também conta
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects'
             AND policyname !~ '^st_(frequencias|documentos|documentos-requerimento)_(select|insert|update|delete)$'
             AND (coalesce(qual, '') || ' ' || coalesce(with_check, '')) ~ ('bucket_id = (''(frequencias|documentos|documentos-requerimento)''|ANY \(ARRAY\[[^]]*''(frequencias|documentos|documentos-requerimento)'')'
                  || '|^((?!bucket_id).)*$') LOOP
    PERFORM pg_temp.falha('storage: a policy "' || p.policyname || '" também vale para os arquivos do RH');
  END LOOP;

  -- vínculos da semeadura (srv_a e srv_inativo -> A, srv_b -> B): nenhum bloco anterior os muda; se mudar, o bloco
  -- mediria outra coisa
  IF u_ed IS NULL THEN RAISE EXCEPTION 'falta a persona perm_rh.servidores.editar (mapa.csv)'; END IF;
  IF (SELECT servidor_id FROM public.profiles WHERE id = u_a) IS DISTINCT FROM sa::uuid
     OR (SELECT servidor_id FROM public.profiles WHERE id = u_ai) IS DISTINCT FROM sa::uuid
     OR (SELECT servidor_id FROM public.profiles WHERE id = u_b) IS DISTINCT FROM sb::uuid THEN
    RAISE EXCEPTION 'storage do RH: vínculo de srv_a/srv_inativo/srv_b diferente da semeadura';
  END IF;

  -- semente (como superusuário, sem triggers/FKs): PDFs de frequência de A, de B e um sem servidor; documentos nas
  -- pastas de A e de B e fora do padrão.
  SET LOCAL session_replication_role = replica;
  INSERT INTO public.frequencia_arquivos (periodo, ano, mes, servidor_id, tipo, arquivo_path, arquivo_nome) VALUES
    ('2026-01', 2026, 1, sa::uuid, 'individual', 'b3/' || sa || '/2026-01.pdf', 'a.pdf'),
    ('2026-01', 2026, 1, sb::uuid, 'individual', 'b3/' || sb || '/2026-01.pdf', 'b.pdf'),
    ('2026-01', 2026, 1, NULL,     'individual', 'b3/sem-servidor/2026-01.pdf', 'x.pdf');
  INSERT INTO storage.objects (bucket_id, name) VALUES
    ('frequencias', 'b3/' || sa || '/2026-01.pdf'), ('frequencias', 'b3/' || sb || '/2026-01.pdf'),
    ('frequencias', 'b3/sem-servidor/2026-01.pdf'), ('frequencias', 'b3/' || sa || '/sem-linha.pdf'),
    ('documentos-requerimento', sa || '/doc-a.pdf'), ('documentos-requerimento', sb || '/doc-b.pdf'),
    ('documentos-requerimento', 'nao-uuid/doc.pdf'),
    ('documentos', sa || '/ato-a.pdf');
  SET LOCAL session_replication_role = origin;

  -- ===== frequencias: o dono lê o próprio PDF (só ele), outro servidor não; bloqueado e sem vínculo não
  r := pg_temp.valor_como(u_a, 'authenticated', 'SELECT string_agg(name, '','' ORDER BY name) FROM storage.objects WHERE bucket_id = ''frequencias''');
  IF r IS DISTINCT FROM 'b3/' || sa || '/2026-01.pdf' THEN PERFORM pg_temp.falha('storage frequencias: srv_a deveria ler só o próprio PDF; leu ' || coalesce(r, 'nada')); END IF;
  r := pg_temp.valor_como(u_b, 'authenticated', 'SELECT string_agg(name, '','' ORDER BY name) FROM storage.objects WHERE bucket_id = ''frequencias''');
  IF r IS DISTINCT FROM 'b3/' || sb || '/2026-01.pdf' THEN PERFORM pg_temp.falha('storage frequencias: srv_b deveria ler só o próprio PDF; leu ' || coalesce(r, 'nada')); END IF;
  FOR p IN SELECT * FROM persona WHERE nome IN ('srv_inativo', 'nenhum', 'inativo', 'admin_inativo', 'mod_financeiro') LOOP
    n := pg_temp.sel_obj(p.uid, 'authenticated', 'frequencias');
    IF n <> 0 THEN PERFORM pg_temp.falha(format('storage frequencias: %s lê %s objeto(s) (esperado 0)', p.nome, n)); END IF;
  END LOOP;
  -- o dono não grava nem apaga (nem o próprio PDF)
  IF pg_temp.ins_obj(u_a, 'authenticated', 'frequencias', 'b3/' || sa || '/novo.pdf') <> 'negado' THEN PERFORM pg_temp.falha('storage frequencias: srv_a grava na própria pasta'); END IF;
  r := pg_temp.sql_como(u_a, 'authenticated', 'DELETE FROM storage.objects WHERE bucket_id = ''frequencias''');
  IF r <> 'ok:0' THEN PERFORM pg_temp.falha('storage frequencias: srv_a apaga (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_a, 'authenticated', 'UPDATE storage.objects SET name = name WHERE bucket_id = ''frequencias''');
  IF r <> 'ok:0' THEN PERFORM pg_temp.falha('storage frequencias: srv_a sobrescreve (' || r || ')'); END IF;
  -- o módulo rh lê tudo (5 objetos: semente + 4) e não grava; cada código grava; a permissão avulsa não lê nem grava
  n := pg_temp.sel_obj(u_rh, 'authenticated', 'frequencias');
  IF n <> 5 THEN PERFORM pg_temp.falha('storage frequencias: mod_rh lê ' || n || ' objeto(s) (esperado 5)'); END IF;
  IF pg_temp.ins_obj(u_rh, 'authenticated', 'frequencias') <> 'negado' THEN PERFORM pg_temp.falha('storage frequencias: mod_rh (sem código) grava'); END IF;
  FOREACH c IN ARRAY ARRAY['rh.frequencia.lancar', 'rh.frequencia.criar', 'rh.frequencia.editar'] LOOP
    SELECT * INTO p FROM persona WHERE nome = 'perm_' || c;
    IF NOT FOUND THEN PERFORM pg_temp.falha('storage frequencias: falta a persona perm_' || c); CONTINUE; END IF;
    IF pg_temp.ins_obj(p.uid, 'authenticated', 'frequencias') <> 'passou' THEN PERFORM pg_temp.falha('storage frequencias: perm_' || c || ' não grava'); END IF;
    IF pg_temp.mut_obj(p.uid, 'authenticated', 'frequencias', 'UPDATE') < 1 THEN PERFORM pg_temp.falha('storage frequencias: perm_' || c || ' não sobrescreve'); END IF;
    IF pg_temp.mut_obj(p.uid, 'authenticated', 'frequencias', 'DELETE') < 1 THEN PERFORM pg_temp.falha('storage frequencias: perm_' || c || ' não apaga'); END IF;
    SELECT * INTO p FROM persona WHERE nome = 'perm_avulsa_' || c;
    IF NOT FOUND THEN RAISE EXCEPTION 'falta a persona perm_avulsa_%', c; END IF;
    IF pg_temp.sel_obj(p.uid, 'authenticated', 'frequencias') <> 0 THEN PERFORM pg_temp.falha('storage frequencias: perm_avulsa_' || c || ' (sem módulo) lê'); END IF;
    IF pg_temp.ins_obj(p.uid, 'authenticated', 'frequencias') <> 'negado' THEN PERFORM pg_temp.falha('storage frequencias: perm_avulsa_' || c || ' (sem módulo) grava'); END IF;
  END LOOP;
  IF pg_temp.ins_obj(u_ed, 'authenticated', 'frequencias') <> 'negado' THEN PERFORM pg_temp.falha('storage frequencias: rh.servidores.editar (código de outro bucket) grava'); END IF;
  -- tabelas: o dono lê a linha do próprio PDF (;proprio), não a de outro; mod_rh não escreve; o código escreve
  r := pg_temp.valor_como(u_a, 'authenticated', 'SELECT string_agg(arquivo_path, '','' ORDER BY arquivo_path) FROM public.frequencia_arquivos WHERE arquivo_path LIKE ''b3/%''');
  IF r IS DISTINCT FROM 'b3/' || sa || '/2026-01.pdf' THEN PERFORM pg_temp.falha('frequencia_arquivos: srv_a deveria ler só a própria linha; leu ' || coalesce(r, 'nada')); END IF;
  IF pg_temp.sel(u_a, 'authenticated', 'frequencia_pacotes') <> 0 THEN PERFORM pg_temp.falha('frequencia_pacotes: servidor sem módulo lê pacotes (link_download)'); END IF;
  r := pg_temp.sql_como(u_rh, 'authenticated', 'UPDATE public.frequencia_arquivos SET arquivo_nome = arquivo_nome');
  IF r <> 'ok:0' THEN PERFORM pg_temp.falha('frequencia_arquivos: mod_rh (sem código) altera (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_rh, 'authenticated', 'UPDATE public.frequencia_pacotes SET arquivo_path = arquivo_path');
  IF r <> 'ok:0' THEN PERFORM pg_temp.falha('frequencia_pacotes: mod_rh (sem código) troca arquivo_path (' || r || ')'); END IF;
  r := pg_temp.sql_como((SELECT uid FROM persona WHERE nome = 'perm_rh.frequencia.lancar'), 'authenticated', 'UPDATE public.frequencia_arquivos SET arquivo_nome = arquivo_nome WHERE arquivo_path LIKE ''b3/%''');
  IF r <> 'ok:3' THEN PERFORM pg_temp.falha('frequencia_arquivos: perm_rh.frequencia.lancar não altera (' || r || ')'); END IF;
  -- arquivo_path seguro (CHECK *_arquivo_path_seguro): caminho relativo sem ./.., %, \, ?, # nem caractere de controle
  -- (o parser de URL apaga tab/LF/CR: '.<tab>./' viraria '../'); vale até para quem grava
  FOREACH c IN ARRAY ARRAY['../x.pdf', 'b3/../x.pdf', './x.pdf', 'b3/.', '/abs.pdf', '', 'b3/%2e%2e/x.pdf', 'b3\x.pdf', 'b3/x.pdf?y', 'b3/x.pdf#y',
                           E'.\t./x.pdf', E'.\t./.\t./frequencias/x/empty', E'.\n./x.pdf', E'.\r./x.pdf', E'b3/x\u007f.pdf'] LOOP
    r := pg_temp.sql_como((SELECT uid FROM persona WHERE nome = 'perm_rh.frequencia.lancar'), 'authenticated',
           format('UPDATE public.frequencia_arquivos SET arquivo_path = %L WHERE arquivo_path = %L', c, 'b3/' || sa || '/2026-01.pdf'));
    IF r NOT LIKE 'erro:23514%' THEN PERFORM pg_temp.falha(format('frequencia_arquivos: arquivo_path %L aceito (%s)', c, r)); END IF;
    r := pg_temp.sql_como(u_admin, 'authenticated', format('UPDATE public.frequencia_pacotes SET arquivo_path = %L', c));
    IF r NOT LIKE 'erro:23514%' AND r <> 'ok:0' THEN PERFORM pg_temp.falha(format('frequencia_pacotes: arquivo_path %L aceito (%s)', c, r)); END IF;
  END LOOP;
  r := pg_temp.sql_como(u_admin, 'authenticated', 'UPDATE public.frequencia_pacotes SET arquivo_path = NULL');
  IF r NOT LIKE 'ok:%' THEN PERFORM pg_temp.falha('frequencia_pacotes: arquivo_path NULL recusado (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_admin, 'authenticated', 'UPDATE public.frequencia_pacotes SET arquivo_path = ''2026-01/unidade/pacote..v2.zip''');
  IF r NOT LIKE 'ok:%' THEN PERFORM pg_temp.falha('frequencia_pacotes: caminho válido recusado (' || r || ')'); END IF;
  IF (SELECT count(*) FROM public.frequencia_pacotes) = 0 THEN PERFORM pg_temp.falha('frequencia_pacotes: sem linha para testar o CHECK de arquivo_path'); END IF;
  IF to_regclass('public.idx_frequencia_arquivos_arquivo_path') IS NULL THEN PERFORM pg_temp.falha('frequencia_arquivos: falta o índice em arquivo_path'); END IF;
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id IN ('frequencias', 'documentos-requerimento', 'documentos') AND public) THEN
    PERFORM pg_temp.falha('storage: bucket do RH público');
  END IF;

  -- ===== documentos-requerimento: o servidor lê a própria pasta, não a de outro; não grava
  r := pg_temp.valor_como(u_a, 'authenticated', 'SELECT string_agg(name, '','' ORDER BY name) FROM storage.objects WHERE bucket_id = ''documentos-requerimento''');
  IF r IS DISTINCT FROM sa || '/doc-a.pdf' THEN PERFORM pg_temp.falha('storage documentos-requerimento: srv_a deveria ler só a própria pasta; leu ' || coalesce(r, 'nada')); END IF;
  r := pg_temp.valor_como(u_b, 'authenticated', 'SELECT string_agg(name, '','' ORDER BY name) FROM storage.objects WHERE bucket_id = ''documentos-requerimento''');
  IF r IS DISTINCT FROM sb || '/doc-b.pdf' THEN PERFORM pg_temp.falha('storage documentos-requerimento: srv_b deveria ler só a própria pasta; leu ' || coalesce(r, 'nada')); END IF;
  FOR p IN SELECT * FROM persona WHERE nome IN ('srv_inativo', 'nenhum', 'inativo', 'admin_inativo', 'mod_workflow') LOOP
    n := pg_temp.sel_obj(p.uid, 'authenticated', 'documentos-requerimento');
    IF n <> 0 THEN PERFORM pg_temp.falha(format('storage documentos-requerimento: %s lê %s objeto(s) (esperado 0)', p.nome, n)); END IF;
  END LOOP;
  IF pg_temp.ins_obj(u_a, 'authenticated', 'documentos-requerimento', sa || '/meu.pdf') <> 'negado' THEN PERFORM pg_temp.falha('storage documentos-requerimento: srv_a envia arquivo na própria pasta'); END IF;
  r := pg_temp.sql_como(u_a, 'authenticated', 'DELETE FROM storage.objects WHERE bucket_id = ''documentos-requerimento''');
  IF r <> 'ok:0' THEN PERFORM pg_temp.falha('storage documentos-requerimento: srv_a apaga (' || r || ')'); END IF;
  -- o módulo lê tudo (4: semente + 3) e não grava; rh.servidores.editar grava; o código da frequência não
  n := pg_temp.sel_obj(u_rh, 'authenticated', 'documentos-requerimento');
  IF n <> 4 THEN PERFORM pg_temp.falha('storage documentos-requerimento: mod_rh lê ' || n || ' objeto(s) (esperado 4)'); END IF;
  IF pg_temp.ins_obj(u_rh, 'authenticated', 'documentos-requerimento') <> 'negado' THEN PERFORM pg_temp.falha('storage documentos-requerimento: mod_rh (sem código) grava'); END IF;
  IF pg_temp.ins_obj(u_ed, 'authenticated', 'documentos-requerimento', sb || '/novo.pdf') <> 'passou' THEN PERFORM pg_temp.falha('storage documentos-requerimento: módulo + rh.servidores.editar não grava'); END IF;
  IF pg_temp.mut_obj(u_ed, 'authenticated', 'documentos-requerimento', 'UPDATE') < 1 THEN PERFORM pg_temp.falha('storage documentos-requerimento: módulo + rh.servidores.editar não sobrescreve'); END IF;
  IF pg_temp.mut_obj(u_ed, 'authenticated', 'documentos-requerimento', 'DELETE') < 1 THEN PERFORM pg_temp.falha('storage documentos-requerimento: módulo + rh.servidores.editar não apaga'); END IF;
  IF pg_temp.ins_obj((SELECT uid FROM persona WHERE nome = 'perm_rh.frequencia.lancar'), 'authenticated', 'documentos-requerimento') <> 'negado' THEN
    PERFORM pg_temp.falha('storage documentos-requerimento: rh.frequencia.lancar (código de outro bucket) grava');
  END IF;

  -- ===== documentos_requerimento_servidor (classe permissao;proprio;insere_proprio + forcar_campos_iniciais perm:)
  -- o servidor sem módulo cria o próprio pedido, mas nasce pendente e sem arquivo assinado, data de envio ou modelo
  r := pg_temp.valor_desfeito_como(u_a, 'authenticated', format('INSERT INTO public.documentos_requerimento_servidor (servidor_id, tipo_documento, titulo, status, arquivo_assinado_url, data_upload_assinado, modelo_url) VALUES (%L, ''declaracao'', ''t'', ''arquivado'', ''https://forjado/x.pdf'', now(), ''https://forjado/m.pdf'') RETURNING status || ''|'' || coalesce(arquivo_assinado_url, ''NULO'') || ''|'' || coalesce(data_upload_assinado::text, ''NULO'') || ''|'' || coalesce(modelo_url, ''NULO'')', sa));
  IF r IS DISTINCT FROM 'pendente|NULO|NULO|NULO' THEN PERFORM pg_temp.falha('documentos_requerimento_servidor: o servidor cria o próprio pedido com campos do RH (' || coalesce(r, 'NULL') || ')'); END IF;
  r := pg_temp.sql_como(u_a, 'authenticated', format('INSERT INTO public.documentos_requerimento_servidor (servidor_id, tipo_documento, titulo) VALUES (%L, ''declaracao'', ''t'')', sb));
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('documentos_requerimento_servidor: o servidor cria pedido de OUTRO servidor (' || r || ')'); END IF;
  -- semente: um pedido de A e um de B (superusuário)
  INSERT INTO public.documentos_requerimento_servidor (servidor_id, tipo_documento, titulo, observacoes) VALUES
    (sa::uuid, 'declaracao', 'b3-a', 'b3'), (sb::uuid, 'declaracao', 'b3-b', 'b3');
  r := pg_temp.valor_como(u_a, 'authenticated', 'SELECT string_agg(titulo, '','' ORDER BY titulo) FROM public.documentos_requerimento_servidor WHERE observacoes = ''b3''');
  IF r IS DISTINCT FROM 'b3-a' THEN PERFORM pg_temp.falha('documentos_requerimento_servidor: srv_a deveria ler só o próprio pedido; leu ' || coalesce(r, 'nada')); END IF;
  r := pg_temp.sql_como(u_a, 'authenticated', 'UPDATE public.documentos_requerimento_servidor SET arquivo_assinado_url = ''https://forjado/x.pdf''');
  IF r <> 'ok:0' THEN PERFORM pg_temp.falha('documentos_requerimento_servidor: o servidor grava arquivo_assinado_url (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_rh, 'authenticated', 'UPDATE public.documentos_requerimento_servidor SET arquivo_assinado_url = ''x'' WHERE observacoes = ''b3''');
  IF r <> 'ok:0' THEN PERFORM pg_temp.falha('documentos_requerimento_servidor: mod_rh sem rh.servidores.editar altera (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_rh, 'authenticated', format('INSERT INTO public.documentos_requerimento_servidor (servidor_id, tipo_documento, titulo) VALUES (%L, ''declaracao'', ''t'')', sb));
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('documentos_requerimento_servidor: mod_rh sem rh.servidores.editar cria pedido de outro (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_ed, 'authenticated', 'UPDATE public.documentos_requerimento_servidor SET arquivo_assinado_url = ''x'' WHERE observacoes = ''b3''');
  IF r <> 'ok:2' THEN PERFORM pg_temp.falha('documentos_requerimento_servidor: módulo + rh.servidores.editar não altera (' || r || ')'); END IF;
  -- quem tem o código cria o pedido de outro servidor já com o arquivo (isento no trigger)
  r := pg_temp.valor_desfeito_como(u_ed, 'authenticated', format('INSERT INTO public.documentos_requerimento_servidor (servidor_id, tipo_documento, titulo, status, arquivo_assinado_url) VALUES (%L, ''declaracao'', ''t'', ''recebido'', ''%s/d.pdf'') RETURNING status || ''|'' || coalesce(arquivo_assinado_url, ''NULO'')', sb, sb));
  IF r IS DISTINCT FROM 'recebido|' || sb || '/d.pdf' THEN PERFORM pg_temp.falha('documentos_requerimento_servidor: RH com rh.servidores.editar não registra o pedido recebido (' || coalesce(r, 'NULL') || ')'); END IF;

  -- ===== documentos: sem o módulo, nem a pasta do próprio servidor abre
  FOR p IN SELECT * FROM persona WHERE nome IN ('srv_a', 'nenhum', 'srv_inativo', 'admin_inativo', 'perm_avulsa_rh.frequencia.lancar') LOOP
    n := pg_temp.sel_obj(p.uid, 'authenticated', 'documentos');
    IF n <> 0 THEN PERFORM pg_temp.falha(format('storage documentos: %s lê %s objeto(s) sem o módulo', p.nome, n)); END IF;
    IF pg_temp.ins_obj(p.uid, 'authenticated', 'documentos', sa || '/x.pdf') <> 'negado' THEN PERFORM pg_temp.falha('storage documentos: ' || p.nome || ' grava sem o módulo'); END IF;
    IF pg_temp.mut_obj(p.uid, 'authenticated', 'documentos', 'UPDATE') > 0 OR pg_temp.mut_obj(p.uid, 'authenticated', 'documentos', 'DELETE') > 0 THEN
      PERFORM pg_temp.falha('storage documentos: ' || p.nome || ' altera/apaga sem o módulo');
    END IF;
  END LOOP;
  IF pg_temp.sel_obj(u_rh, 'authenticated', 'documentos') <> 2 OR pg_temp.sel_obj((SELECT uid FROM persona WHERE nome = 'mod_workflow'), 'authenticated', 'documentos') <> 2 THEN
    PERFORM pg_temp.falha('storage documentos: mod_rh/mod_workflow não leem os 2 objetos');
  END IF;
  IF pg_temp.sel_obj(u_admin, 'authenticated', 'frequencias') <> 5 OR pg_temp.sel_obj(u_admin, 'authenticated', 'documentos-requerimento') <> 4 THEN
    PERFORM pg_temp.falha('storage do RH: o admin não lê todos os objetos');
  END IF;
  PERFORM pg_temp.nota('storage do RH (B3): frequencias, documentos-requerimento e documentos por permissão e por dono verificados');
END $$;

-- ---------------------------------------------------------------- RH: autoria e trilha (Onda E1) (TRIGGERS LIGADOS)
-- Migração 20261011000000_rh_autoria_trilha.sql (spec docs/superpowers/specs/2026-10-10-rh-trilha-auditoria-design.md):
--   * autoria gravada pelo banco: o autor mandado pelo navegador é ignorado (também para o admin), created_* não mudam
--     no UPDATE, colunas de decisão viram auth.uid()/now(), só a origem `sistema` informa o autor;
--   * trilha (fn_audit_trigger v2): servidor e origem (usuario / usuario_sem_vinculo / sistema), campos alterados,
--     UPDATE sem mudança não grava, CPF/RG/CID mascarados, tabela sem id uuid grava a chave em metadata, IP e user agent
--     dos cabeçalhos (inválido vira NULL);
--   * trilha imutável: UPDATE/DELETE/TRUNCATE recusados em audit_logs, folha_historico_status e rubricas_historico como
--     postgres, service role e superusuário (inclusive com session_replication_role = replica); cascata do pai e GUC
--     de expurgo passam;
--   * folha: fechado_por não vem do cliente e não muda fora da transição; processar_folha_pagamento grava processado_por;
--   * frequência: o admin não escolhe o autor da etapa (validar_etapa_frequencia);
--   * registrar_evento: listas fechadas, só authenticated ativo, módulo rh (sem ele, só o próprio contracheque);
--     log_audit não forja a trilha do RH (só view/export/download, sem antes/depois; chaves de trigger tiradas; 32 KB);
--     leitura da trilha do RH com rh.auditoria.visualizar (migração 20261011000100), que nenhum papel recebe;
--   * revisão de segurança: payload do eSocial omitido; decisão não apagada nem redatada pela API; aprovado = true no
--     ponto grava o aprovador; IP de x-real-ip ou do último x-forwarded-for; cache do contexto relido quando o vínculo
--     muda; sequencia ordena a trilha; linha de histórico sem pai (FK nula) não passa pela exceção da cascata;
--   * cobertura: toda tabela do RH no mapa tem zz_fixar_autoria (BEFORE INSERT OR UPDATE, por linha, ligado) e
--     audit_<tabela> (AFTER INSERT OR UPDATE OR DELETE, fn_audit_trigger('rh'), ligado); as de trilha, a imutabilidade
--     em UPDATE/DELETE e em TRUNCATE (ENABLE ALWAYS).
-- Tudo o que é coluna nova é lido por to_jsonb(...)->>'coluna': num banco anterior à E1 o bloco reprova sem abortar.
SET session_replication_role = origin;
DO $$
DECLARE
  u_admin uuid := (SELECT uid FROM persona WHERE nome='admin');
  u_nenhum uuid := (SELECT uid FROM persona WHERE nome='nenhum');                      -- sem servidor vinculado
  u_inativo uuid := (SELECT uid FROM persona WHERE nome='inativo');
  u_a uuid := (SELECT uid FROM persona WHERE nome='srv_a');                            -- vinculado ao servidor A
  u_rh uuid := (SELECT uid FROM persona WHERE nome='mod_rh');
  u_lanc uuid := (SELECT uid FROM persona WHERE nome='perm_rh.frequencia.lancar');                          -- módulo rh, sem permissão
  u_proc uuid := (SELECT uid FROM persona WHERE nome='perm_financeiro.folha.processar');
  sa uuid := 'b0000000-0000-0000-0000-00000000000a';
  sb uuid := 'b0000000-0000-0000-0000-00000000000b';
  t1 uuid := 'e1000000-0000-0000-0000-000000000001';
  t2 uuid := 'e1000000-0000-0000-0000-000000000002';
  t5 uuid := 'e1000000-0000-0000-0000-000000000005';
  t6 uuid := 'e1000000-0000-0000-0000-000000000006';
  pc uuid := 'e1000000-0000-0000-0000-000000000011';
  ev uuid := 'e1000000-0000-0000-0000-000000000012';
  lic uuid := 'e1000000-0000-0000-0000-000000000013';
  f1 uuid := 'e1000000-0000-0000-0000-000000000021';
  f2 uuid := 'e1000000-0000-0000-0000-000000000022';
  ab uuid := 'e1000000-0000-0000-0000-000000000031';
  rp uuid := 'e1000000-0000-0000-0000-000000000041';
  ev2 uuid := 'e1000000-0000-0000-0000-000000000042';
  t7 uuid := 'e1000000-0000-0000-0000-000000000007';
  f3 uuid := 'e1000000-0000-0000-0000-000000000023';
  fc uuid := 'e1000000-0000-0000-0000-000000000024';
  r text; n int; n2 int; j jsonb; x record; v_tipo text; v_nome text; esperado text; seq1 bigint; seq2 bigint;
BEGIN
  PERFORM set_config('request.jwt.claims', '', true);
  PERFORM set_config('request.headers', '', true);

  -- ===== autor forjado pelo navegador é sobrescrito (usuário comum e admin); origem usuario_sem_vinculo
  r := pg_temp.insere_como(u_rh, 'authenticated', 'servidor_tags', jsonb_build_object('id', t1, 'nome', 'E1 tag 1',
         'created_by', u_admin, 'created_by_servidor_id', sb, 'created_at', '2000-01-01', 'updated_by', u_admin));
  SELECT to_jsonb(s) INTO j FROM public.servidor_tags s WHERE id = t1;
  IF r <> 'ok' OR j IS NULL THEN PERFORM pg_temp.falha('E1 autoria: o módulo rh não insere em servidor_tags (' || r || ')');
  ELSE
    IF j ->> 'created_by' IS DISTINCT FROM u_rh::text THEN PERFORM pg_temp.falha('E1 autoria: created_by forjado pelo navegador foi aceito (' || coalesce(j ->> 'created_by', 'nulo') || ')'); END IF;
    IF j ->> 'created_by_servidor_id' IS NOT NULL THEN PERFORM pg_temp.falha('E1 autoria: created_by_servidor_id forjado (usuário sem vínculo) foi aceito'); END IF;
    IF (j ->> 'created_at')::timestamptz < '2001-01-01' THEN PERFORM pg_temp.falha('E1 autoria: created_at forjado foi aceito'); END IF;
    IF j ->> 'updated_by' IS DISTINCT FROM u_rh::text THEN PERFORM pg_temp.falha('E1 autoria: updated_by do INSERT não é quem inseriu'); END IF;
  END IF;
  SELECT to_jsonb(a) INTO j FROM public.audit_logs a WHERE a.entity_type = 'servidor_tags' AND a.entity_id = t1 AND a.action = 'create';
  IF j IS NULL THEN PERFORM pg_temp.falha('E1 trilha: INSERT em servidor_tags não gerou linha em audit_logs');
  ELSE
    IF j ->> 'origem' IS DISTINCT FROM 'usuario_sem_vinculo' THEN PERFORM pg_temp.falha('E1 trilha: origem de usuário sem vínculo = ' || coalesce(j ->> 'origem', 'nula')); END IF;
    IF j ->> 'servidor_id' IS NOT NULL OR j ->> 'user_id' IS DISTINCT FROM u_rh::text THEN PERFORM pg_temp.falha('E1 trilha: usuário/servidor errados no INSERT sem vínculo'); END IF;
    IF j ->> 'transacao' IS NULL THEN PERFORM pg_temp.falha('E1 trilha: transacao não preenchida'); END IF;
    IF j ->> 'module_name' IS DISTINCT FROM 'rh' THEN PERFORM pg_temp.falha('E1 trilha: módulo da trilha de servidor_tags = ' || coalesce(j ->> 'module_name', 'nulo')); END IF;
  END IF;
  r := pg_temp.insere_como(u_admin, 'authenticated', 'servidor_tags', jsonb_build_object('id', t2, 'nome', 'E1 tag 2', 'created_by', u_nenhum));
  IF (SELECT created_by FROM public.servidor_tags WHERE id = t2) IS DISTINCT FROM u_admin THEN
    PERFORM pg_temp.falha('E1 autoria: o admin escolhe o autor do lançamento (' || r || ')');
  END IF;

  -- ===== created_* não mudam no UPDATE (nem pelo admin); updated_* = quem alterou; campos alterados sem o carimbo
  r := pg_temp.exec_como(u_admin, 'authenticated', format(
         'UPDATE public.servidor_tags SET nome = ''E1 tag 1b'', created_by = %L, created_by_servidor_id = %L, created_at = ''2000-01-01'' WHERE id = %L',
         u_nenhum, sb, t1));
  SELECT to_jsonb(s) INTO j FROM public.servidor_tags s WHERE id = t1;
  IF r <> 'ok' OR j ->> 'nome' <> 'E1 tag 1b' THEN PERFORM pg_temp.falha('E1 autoria: o admin não altera servidor_tags (' || r || ')');
  ELSE
    IF j ->> 'created_by' IS DISTINCT FROM u_rh::text OR (j ->> 'created_at')::timestamptz < '2001-01-01' OR j ->> 'created_by_servidor_id' IS NOT NULL THEN
      PERFORM pg_temp.falha('E1 autoria: created_* mudaram no UPDATE do admin');
    END IF;
    IF j ->> 'updated_by' IS DISTINCT FROM u_admin::text THEN PERFORM pg_temp.falha('E1 autoria: updated_by não é quem alterou'); END IF;
  END IF;
  SELECT to_jsonb(a) INTO j FROM public.audit_logs a WHERE a.entity_type = 'servidor_tags' AND a.entity_id = t1 AND a.action = 'update';
  IF j IS NULL OR j -> 'campos_alterados' IS DISTINCT FROM '["nome"]'::jsonb THEN
    PERFORM pg_temp.falha('E1 trilha: campos_alterados do UPDATE = ' || coalesce((j -> 'campos_alterados')::text, 'nulo') || ' (esperado ["nome"])');
  END IF;

  -- ===== UPDATE que não muda nada não gera linha
  SELECT count(*) INTO n FROM public.audit_logs WHERE entity_type = 'servidor_tags' AND entity_id = t1;
  r := pg_temp.exec_como(u_admin, 'authenticated', format('UPDATE public.servidor_tags SET nome = nome WHERE id = %L', t1));
  SELECT count(*) INTO n2 FROM public.audit_logs WHERE entity_type = 'servidor_tags' AND entity_id = t1;
  IF r <> 'ok' OR n2 <> n THEN PERFORM pg_temp.falha('E1 trilha: UPDATE sem mudança gerou linha (' || n || ' -> ' || n2 || ', ' || r || ')'); END IF;

  -- ===== origem usuario: servidor vinculado (retrato com nome e matrícula)
  INSERT INTO public.user_modules (user_id, module) VALUES (u_a, 'rh');
  r := pg_temp.insere_como(u_a, 'authenticated', 'servidor_tags', jsonb_build_object('id', t5, 'nome', 'E1 tag 5'));
  IF (SELECT to_jsonb(s) ->> 'created_by_servidor_id' FROM public.servidor_tags s WHERE id = t5) IS DISTINCT FROM sa::text THEN
    PERFORM pg_temp.falha('E1 autoria: created_by_servidor_id não é o servidor vinculado (' || r || ')');
  END IF;
  SELECT to_jsonb(a) INTO j FROM public.audit_logs a WHERE a.entity_type = 'servidor_tags' AND a.entity_id = t5 AND a.action = 'create';
  SELECT nome_completo INTO v_nome FROM public.servidores WHERE id = sa;
  IF j IS NULL OR j ->> 'origem' IS DISTINCT FROM 'usuario' OR j ->> 'servidor_id' IS DISTINCT FROM sa::text
     OR j ->> 'servidor_nome' IS DISTINCT FROM v_nome THEN
    PERFORM pg_temp.falha('E1 trilha: servidor responsável não gravado (origem ' || coalesce(j ->> 'origem', 'nula') || ', servidor ' || coalesce(j ->> 'servidor_id', 'nulo') || ')');
  END IF;
  DELETE FROM public.user_modules WHERE user_id = u_a AND module = 'rh';

  -- ===== origem sistema (sem auth.uid(), fora dos papéis da API): informa o autor; o servidor vem do perfil
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO public.servidor_tags (id, nome, created_by) VALUES (t6, 'E1 tag 6', u_a);
  SELECT to_jsonb(s) INTO j FROM public.servidor_tags s WHERE id = t6;
  IF j ->> 'created_by' IS DISTINCT FROM u_a::text OR j ->> 'created_by_servidor_id' IS DISTINCT FROM sa::text THEN
    PERFORM pg_temp.falha('E1 autoria: a origem sistema não informa o autor (' || coalesce(j ->> 'created_by', 'nulo') || ')');
  END IF;
  IF (SELECT to_jsonb(a) ->> 'origem' FROM public.audit_logs a WHERE a.entity_type = 'servidor_tags' AND a.entity_id = t6 LIMIT 1) IS DISTINCT FROM 'sistema' THEN
    PERFORM pg_temp.falha('E1 trilha: INSERT da service role/job não marcado como origem sistema');
  END IF;

  -- ===== colunas de decisão e de criação
  r := pg_temp.insere_como(u_rh, 'authenticated', 'pre_cadastros', jsonb_build_object('id', pc, 'convertido_por', u_admin, 'convertido_em', '2000-01-01'));
  SELECT to_jsonb(p) INTO j FROM public.pre_cadastros p WHERE id = pc;
  IF j IS NULL OR j ->> 'convertido_por' IS DISTINCT FROM u_rh::text OR (j ->> 'convertido_em')::timestamptz < '2001-01-01' THEN
    PERFORM pg_temp.falha('E1 decisão: convertido_por/convertido_em forjados foram aceitos (' || r || ')');
  END IF;
  SELECT to_jsonb(p) INTO j FROM public.pre_cadastros p WHERE id = pc;
  r := pg_temp.exec_como(u_rh, 'authenticated', format('UPDATE public.pre_cadastros SET convertido_por = NULL WHERE id = %L', pc));
  IF (SELECT convertido_por FROM public.pre_cadastros WHERE id = pc) IS DISTINCT FROM u_rh
     OR (SELECT convertido_em FROM public.pre_cadastros WHERE id = pc) IS DISTINCT FROM (j ->> 'convertido_em')::timestamptz THEN
    PERFORM pg_temp.falha('E1 decisão: a sessão da API apagou a decisão (convertido_por = NULL) (' || r || ')');
  END IF;
  r := pg_temp.exec_como(u_rh, 'authenticated', format('UPDATE public.pre_cadastros SET convertido_em = ''2000-01-01'' WHERE id = %L', pc));
  IF (SELECT convertido_em FROM public.pre_cadastros WHERE id = pc) IS DISTINCT FROM (j ->> 'convertido_em')::timestamptz THEN
    PERFORM pg_temp.falha('E1 decisão: a data da decisão mudou sozinha, com o autor igual (' || r || ')');
  END IF;
  -- ponto: aprovado = true grava aprovador e data pelo banco (o aprovador mandado é ignorado)
  r := pg_temp.insere_como(u_admin, 'authenticated', 'registros_ponto', jsonb_build_object('id', rp, 'servidor_id', sb, 'data', '2031-03-03', 'aprovado', false));
  r := r || '/' || pg_temp.exec_como(u_admin, 'authenticated', format(
         'UPDATE public.registros_ponto SET aprovado = true, aprovador_id = %L, data_aprovacao = ''2000-01-01'' WHERE id = %L', u_nenhum, rp));
  SELECT to_jsonb(x2) INTO j FROM public.registros_ponto x2 WHERE id = rp;
  IF j IS NULL OR j ->> 'aprovador_id' IS DISTINCT FROM u_admin::text OR (j ->> 'data_aprovacao')::timestamptz < '2001-01-01' THEN
    PERFORM pg_temp.falha('E1 decisão: aprovado = true no ponto não gravou o aprovador pelo banco (' || r || ', ' || coalesce(j ->> 'aprovador_id', 'nulo') || ')');
  END IF;
  r := pg_temp.insere_como(u_proc, 'authenticated', 'eventos_esocial', jsonb_build_object('id', ev, 'gerado_por', u_admin, 'data_geracao', '2000-01-01'));
  r := r || '/' || pg_temp.exec_como(u_proc, 'authenticated', format('UPDATE public.eventos_esocial SET gerado_por = %L, data_geracao = ''2000-01-01'' WHERE id = %L', u_admin, ev));
  SELECT to_jsonb(e) INTO j FROM public.eventos_esocial e WHERE id = ev;
  IF j IS NULL OR j ->> 'gerado_por' IS DISTINCT FROM u_proc::text OR (j ->> 'data_geracao')::timestamptz < '2001-01-01' THEN
    PERFORM pg_temp.falha('E1 criação: gerado_por do eSocial não é quem gerou ou mudou depois (' || r || ')');
  END IF;
  r := pg_temp.exec_como(u_proc, 'authenticated', format('UPDATE public.eventos_esocial SET data_envio = ''2000-01-01'' WHERE id = %L', ev));
  IF (SELECT to_jsonb(e) ->> 'data_envio' FROM public.eventos_esocial e WHERE id = ev) IS NOT NULL THEN
    PERFORM pg_temp.falha('E1 decisão: data_envio do eSocial gravada sem autor (' || r || ')');
  END IF;
  r := pg_temp.exec_como(u_proc, 'authenticated', format('UPDATE public.eventos_esocial SET enviado_por = %L, data_envio = ''2000-01-01'' WHERE id = %L', u_admin, ev));
  SELECT to_jsonb(e) INTO j FROM public.eventos_esocial e WHERE id = ev;
  IF j ->> 'enviado_por' IS DISTINCT FROM u_proc::text OR (j ->> 'data_envio')::timestamptz < '2001-01-01' THEN
    PERFORM pg_temp.falha('E1 decisão: enviado_por/data_envio do eSocial não são de quem marcou o envio (' || r || ', ' || coalesce(j ->> 'enviado_por', 'nulo') || ')');
  END IF;
  -- payload do eSocial (CPF e remuneração) não vai para a trilha
  r := pg_temp.insere_como(u_proc, 'authenticated', 'eventos_esocial', jsonb_build_object('id', ev2, 'tipo_evento', 'S-2200',
         'payload', jsonb_build_object('cpfTrab', '55566677788', 'vrRemun', 12345.67),
         'payload_xml', '<cpfTrab>55566677788</cpfTrab><vrRemun>12345.67</vrRemun>'));
  SELECT to_jsonb(a) INTO j FROM public.audit_logs a WHERE a.entity_type = 'eventos_esocial' AND a.entity_id = ev2 AND a.action = 'create';
  IF j IS NULL OR j -> 'after_data' ->> 'payload' IS DISTINCT FROM '[protegido]' OR j -> 'after_data' ->> 'payload_xml' IS DISTINCT FROM '[protegido]' THEN
    PERFORM pg_temp.falha('E1 máscara: payload do eSocial em claro (ou sem trilha) (' || r || ')');
  END IF;
  IF EXISTS (SELECT 1 FROM public.audit_logs a WHERE a::text LIKE '%55566677788%' OR a::text LIKE '%12345.67%') THEN
    PERFORM pg_temp.falha('E1 máscara: CPF ou remuneração do payload do eSocial na trilha');
  END IF;

  -- ===== máscara LGPD: CPF parcial, RG e nascimento protegidos (servidores), CID protegido (licenças)
  r := pg_temp.exec_como(u_admin, 'authenticated', format(
         'UPDATE public.servidores SET cpf = ''12345678901'', rg = ''RG-998877'', data_nascimento = ''1990-05-17'' WHERE id = %L', sb));
  SELECT to_jsonb(a) INTO j FROM public.audit_logs a
   WHERE a.entity_type = 'servidores' AND a.entity_id = sb AND a.action = 'update' AND a."timestamp" >= now() ORDER BY a."timestamp" DESC, a.id LIMIT 1;
  IF r <> 'ok' OR j IS NULL THEN PERFORM pg_temp.falha('E1 máscara: alteração de servidores sem trilha (' || r || ')');
  ELSE
    IF j -> 'after_data' ->> 'cpf' IS DISTINCT FROM '***.456.789-**' THEN PERFORM pg_temp.falha('E1 máscara: CPF na trilha de servidores = ' || coalesce(j -> 'after_data' ->> 'cpf', 'nulo')); END IF;
    IF j -> 'after_data' ->> 'rg' IS DISTINCT FROM '[protegido]' OR j -> 'after_data' ->> 'data_nascimento' IS DISTINCT FROM '[protegido]' THEN
      PERFORM pg_temp.falha('E1 máscara: RG ou nascimento em claro na trilha de servidores');
    END IF;
    IF NOT coalesce((j -> 'campos_alterados') ?& ARRAY['cpf', 'rg', 'data_nascimento'], false) THEN
      PERFORM pg_temp.falha('E1 máscara: campos_alterados não lista cpf/rg/data_nascimento (' || coalesce((j -> 'campos_alterados')::text, 'nulo') || ')');
    END IF;
  END IF;
  r := pg_temp.insere_como(u_admin, 'authenticated', 'licencas_afastamentos', jsonb_build_object('id', lic, 'servidor_id', sb, 'cid', 'F32.1'));
  IF (SELECT to_jsonb(a) -> 'after_data' ->> 'cid' FROM public.audit_logs a WHERE a.entity_type = 'licencas_afastamentos' AND a.entity_id = lic AND a.action = 'create') IS DISTINCT FROM '[protegido]' THEN
    PERFORM pg_temp.falha('E1 máscara: CID em claro (ou sem trilha) em licencas_afastamentos (' || r || ')');
  END IF;
  SELECT count(*) INTO n FROM public.audit_logs a
   WHERE a::text LIKE '%12345678901%' OR a::text LIKE '%RG-998877%' OR a::text LIKE '%1990-05-17%' OR a::text LIKE '%F32.1%';
  IF n > 0 THEN PERFORM pg_temp.falha('E1 máscara: ' || n || ' linha(s) de audit_logs com CPF/RG/nascimento/CID em claro'); END IF;

  -- ===== tabela sem coluna id uuid: entity_id nulo e a chave primária em metadata.chave (com máscara)
  BEGIN
    CREATE TEMP TABLE e1_sem_id (chave text PRIMARY KEY, cpf text);
    CREATE TRIGGER audit_e1_sem_id AFTER INSERT OR UPDATE OR DELETE ON pg_temp.e1_sem_id
      FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('teste_e1');
    EXECUTE 'INSERT INTO public.audit_colunas_sensiveis (tabela, coluna, tratamento) VALUES (''e1_sem_id'', ''cpf'', ''parcial'')';
    INSERT INTO pg_temp.e1_sem_id VALUES ('k-e1', '98765432100');
    SELECT to_jsonb(a) INTO j FROM public.audit_logs a WHERE a.entity_type = 'e1_sem_id' AND a.module_name = 'teste_e1';
    IF j IS NULL OR j ->> 'entity_id' IS NOT NULL OR j -> 'metadata' -> 'chave' ->> 'chave' IS DISTINCT FROM 'k-e1'
       OR j -> 'after_data' ->> 'cpf' IS DISTINCT FROM '***.654.321-**' THEN
      PERFORM pg_temp.falha('E1 trilha: tabela sem id uuid gravou ' || coalesce(left(j::text, 120), 'nada'));
    END IF;
  EXCEPTION WHEN OTHERS THEN
    PERFORM pg_temp.falha('E1 trilha: tabela sem id uuid falhou (' || SQLSTATE || ': ' || left(SQLERRM, 80) || ')');
  END;

  -- ===== IP e user agent dos cabeçalhos (x-real-ip; sem ele, o ÚLTIMO item de x-forwarded-for); registrar_evento
  PERFORM set_config('request.headers', '{"x-forwarded-for": "203.0.113.9, 198.51.100.4", "user-agent": "TesteE1/1.0"}', true);
  r := pg_temp.valor_como(u_rh, 'authenticated', 'SELECT public.registrar_evento(''download'', ''relatorio_rh'', NULL, ''relatório 01/2031'', ''{"formato": "pdf", "trigger": true}'')::text');
  SELECT to_jsonb(a) INTO j FROM public.audit_logs a WHERE a.id::text = r;
  IF j IS NULL THEN PERFORM pg_temp.falha('E1 registrar_evento: download de relatório pelo módulo rh não gravou (' || r || ')');
  ELSE
    IF j ->> 'user_id' IS DISTINCT FROM u_rh::text OR j ->> 'action' <> 'download' OR j ->> 'module_name' <> 'rh'
       OR j ->> 'origem' IS DISTINCT FROM 'usuario_sem_vinculo' THEN
      PERFORM pg_temp.falha('E1 registrar_evento: usuário/ação/módulo/origem errados (' || left(j::text, 120) || ')');
    END IF;
    IF j ->> 'ip_address' IS DISTINCT FROM '198.51.100.4' OR j ->> 'user_agent' IS DISTINCT FROM 'TesteE1/1.0' THEN
      PERFORM pg_temp.falha('E1 trilha: IP não é o último item de x-forwarded-for ou user agent fora dos cabeçalhos (' || coalesce(j ->> 'ip_address', 'nulo') || ', ' || coalesce(j ->> 'user_agent', 'nulo') || ')');
    END IF;
    IF j -> 'metadata' ? 'trigger' OR j -> 'metadata' ->> 'fonte' IS DISTINCT FROM 'registrar_evento' THEN
      PERFORM pg_temp.falha('E1 registrar_evento: metadados do cliente marcam a linha como de trigger (' || (j -> 'metadata')::text || ')');
    END IF;
  END IF;
  PERFORM set_config('request.headers', '{"x-real-ip": "192.0.2.10", "x-forwarded-for": "203.0.113.9, 198.51.100.4", "user-agent": "TesteE1/1.1"}', true);
  r := pg_temp.valor_como(u_rh, 'authenticated', 'SELECT public.registrar_evento(''view'', ''servidores'', NULL)::text');
  IF (SELECT host(ip_address) FROM public.audit_logs WHERE id::text = r) IS DISTINCT FROM '192.0.2.10' THEN
    PERFORM pg_temp.falha('E1 trilha: x-real-ip não tem preferência sobre x-forwarded-for (' || r || ')');
  END IF;
  PERFORM set_config('request.headers', '{"x-forwarded-for": "lixo", "user-agent": "TesteE1/2.0"}', true);
  r := pg_temp.valor_como(u_rh, 'authenticated', 'SELECT public.registrar_evento(''view'', ''servidores'', NULL)::text');
  SELECT to_jsonb(a) INTO j FROM public.audit_logs a WHERE a.id::text = r;
  IF j IS NULL OR j ->> 'ip_address' IS NOT NULL OR j ->> 'user_agent' IS DISTINCT FROM 'TesteE1/2.0' THEN
    PERFORM pg_temp.falha('E1 trilha: IP inválido no cabeçalho quebrou ou foi gravado (' || r || ')');
  END IF;
  PERFORM set_config('request.headers', 'nao-e-json', true);
  r := pg_temp.sql_como(u_rh, 'authenticated', 'SELECT public.registrar_evento(''export'', ''relatorio_rh'')');
  IF r NOT LIKE 'ok:%' THEN PERFORM pg_temp.falha('E1 trilha: cabeçalho que não é JSON quebra a gravação (' || r || ')'); END IF;
  PERFORM set_config('request.headers', '', true);
  r := pg_temp.sql_como(u_nenhum, 'authenticated', 'SELECT public.registrar_evento(''apagar'', ''servidores'')');
  IF r NOT LIKE 'erro:22023%' THEN PERFORM pg_temp.falha('E1 registrar_evento: aceita ação fora da lista (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_nenhum, 'authenticated', 'SELECT public.registrar_evento(''view'', ''pg_authid'')');
  IF r NOT LIKE 'erro:22023%' THEN PERFORM pg_temp.falha('E1 registrar_evento: aceita entidade fora da lista (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_nenhum, 'authenticated', 'SELECT public.registrar_evento(''view'', ''servidores'', NULL, NULL, ''[1,2]'')');
  IF r NOT LIKE 'erro:22023%' THEN PERFORM pg_temp.falha('E1 registrar_evento: aceita metadados que não são objeto (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_inativo, 'authenticated', 'SELECT public.registrar_evento(''view'', ''servidores'')');
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('E1 registrar_evento: perfil inativo grava (' || r || ')'); END IF;
  r := pg_temp.sql_como(NULL, 'anon', 'SELECT public.registrar_evento(''view'', ''servidores'')');
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('E1 registrar_evento: anon executa (' || r || ')'); END IF;
  -- sem o módulo rh: nenhuma tabela nem relatório; só o próprio contracheque
  r := pg_temp.sql_como(u_nenhum, 'authenticated', 'SELECT public.registrar_evento(''view'', ''servidores'')');
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('E1 registrar_evento: usuário sem o módulo rh registra visualização de servidores (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_a, 'authenticated', 'SELECT public.registrar_evento(''export'', ''relatorio_rh'')');
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('E1 registrar_evento: servidor sem o módulo rh registra relatório do RH (' || r || ')'); END IF;
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO public.folhas_pagamento (id, competencia_ano, competencia_mes, tipo_folha, status)
  SELECT f3, 2031, 3, e.enumlabel::public.tipo_folha, 'aberta' FROM pg_enum e WHERE e.enumtypid = 'public.tipo_folha'::regtype ORDER BY e.enumsortorder LIMIT 1;
  INSERT INTO public.fichas_financeiras (id, folha_id, servidor_id) VALUES (fc, f3, sa);
  r := pg_temp.sql_como(u_a, 'authenticated', format('SELECT public.registrar_evento(''download'', ''contracheque'', %L)', fc));
  IF r NOT LIKE 'ok:%' THEN PERFORM pg_temp.falha('E1 registrar_evento: o servidor não registra o download do próprio contracheque (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_nenhum, 'authenticated', format('SELECT public.registrar_evento(''download'', ''contracheque'', %L)', fc));
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('E1 registrar_evento: contracheque de outro servidor registrado sem o módulo rh (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_nenhum, 'authenticated', 'SELECT public.registrar_evento(''download'', ''contracheque'')');
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('E1 registrar_evento: contracheque sem ficha registrado sem o módulo rh (' || r || ')'); END IF;

  -- ===== log_audit não forja a trilha do RH
  r := pg_temp.sql_como(u_rh, 'authenticated', 'SELECT public.log_audit(''create''::public.audit_action, ''servidores'', NULL, ''rh'')');
  IF r NOT LIKE 'erro:22023%' THEN PERFORM pg_temp.falha('E1 log_audit: aceita create no módulo rh (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_rh, 'authenticated', 'SELECT public.log_audit(''update''::public.audit_action, ''servidores'', NULL, '' RH '')');
  IF r NOT LIKE 'erro:22023%' THEN PERFORM pg_temp.falha('E1 log_audit: aceita update no módulo " RH " (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_rh, 'authenticated', 'SELECT public.log_audit(''view''::public.audit_action, ''servidores'', NULL, ''rh'', NULL, ''{"cpf": "1"}'')');
  IF r NOT LIKE 'erro:22023%' THEN PERFORM pg_temp.falha('E1 log_audit: aceita antes/depois do cliente no módulo rh (' || r || ')'); END IF;
  r := pg_temp.valor_como(u_a, 'authenticated', format('SELECT public.log_audit(''view''::public.audit_action, ''contracheque'', %L, ''rh'', NULL, NULL, ''Contracheque visualizado'', ''{"acao": "visualizar"}'')::text', fc));
  IF r IS NULL OR r LIKE 'erro:%' THEN PERFORM pg_temp.falha('E1 log_audit: o contracheque (view no módulo rh) deixou de gravar (' || coalesce(r, 'nulo') || ')'); END IF;
  r := pg_temp.valor_como(u_rh, 'authenticated', 'SELECT public.log_audit(''create''::public.audit_action, ''fin_empenhos'', NULL, ''financeiro'', NULL, NULL, ''t'', ''{"trigger": true, "operation": "INSERT", "table": "x", "registrar_evento": true, "fonte": "forjada", "ok": 1}'')::text');
  SELECT metadata INTO j FROM public.audit_logs WHERE id::text = r;
  IF j IS NULL OR j ?| ARRAY['trigger', 'operation', 'table', 'registrar_evento'] OR j ->> 'fonte' IS DISTINCT FROM 'log_audit' OR j ->> 'ok' IS DISTINCT FROM '1' THEN
    PERFORM pg_temp.falha('E1 log_audit: metadados do cliente forjam linha de trigger (' || coalesce(j::text, r) || ')');
  END IF;
  r := pg_temp.sql_como(u_rh, 'authenticated', format('SELECT public.log_audit(''create''::public.audit_action, ''x'', NULL, ''financeiro'', NULL, %L::jsonb)',
         jsonb_build_object('grande', repeat('a', 33000))));
  IF r NOT LIKE 'erro:22023%' THEN PERFORM pg_temp.falha('E1 log_audit: aceita depois acima de 32 KB (' || left(r, 60) || ')'); END IF;

  -- ===== folha: fechado_por não vem do cliente; processado_por gravado pela RPC
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO public.folhas_pagamento (id, competencia_ano, competencia_mes, tipo_folha, status)
  SELECT f1, 2031, 1, e.enumlabel::public.tipo_folha, 'aberta' FROM pg_enum e WHERE e.enumtypid = 'public.tipo_folha'::regtype ORDER BY e.enumsortorder LIMIT 1;
  INSERT INTO public.folhas_pagamento (id, competencia_ano, competencia_mes, tipo_folha, status)
  SELECT f2, 2031, 2, e.enumlabel::public.tipo_folha, 'aberta' FROM pg_enum e WHERE e.enumtypid = 'public.tipo_folha'::regtype ORDER BY e.enumsortorder LIMIT 1;
  r := pg_temp.exec_como(u_admin, 'authenticated', format(
         'UPDATE public.folhas_pagamento SET status = ''fechada'', fechado_por = %L, fechado_em = ''2000-01-01'' WHERE id = %L', u_nenhum, f1));
  SELECT to_jsonb(f) INTO j FROM public.folhas_pagamento f WHERE id = f1;
  IF r <> 'ok' OR j ->> 'status' <> 'fechada' THEN PERFORM pg_temp.falha('E1 folha: o admin não fecha a folha de teste (' || r || ')');
  ELSIF j ->> 'fechado_por' IS DISTINCT FROM u_admin::text OR (j ->> 'fechado_em')::timestamptz < '2001-01-01' THEN
    PERFORM pg_temp.falha('E1 folha: fechado_por/fechado_em mandados pelo cliente foram aceitos (COALESCE)');
  END IF;
  r := pg_temp.exec_como(u_admin, 'authenticated', format('UPDATE public.folhas_pagamento SET fechado_por = %L WHERE id = %L', u_nenhum, f1));
  IF (SELECT fechado_por FROM public.folhas_pagamento WHERE id = f1) IS DISTINCT FROM u_admin THEN
    PERFORM pg_temp.falha('E1 folha: fechado_por muda fora da transição de status (' || r || ')');
  END IF;
  r := pg_temp.valor_como(u_proc, 'authenticated', format('SELECT (public.processar_folha_pagamento(%L)) ->> ''sucesso''', f2));
  IF r IS DISTINCT FROM 'true' THEN PERFORM pg_temp.falha('E1 folha: processar_folha_pagamento falhou na folha de teste (' || coalesce(r, 'nulo') || ')');
  ELSIF (SELECT processado_por FROM public.folhas_pagamento WHERE id = f2) IS DISTINCT FROM u_proc
        OR (SELECT data_processamento FROM public.folhas_pagamento WHERE id = f2) < '2001-01-01' THEN
    PERFORM pg_temp.falha('E1 folha: processar_folha_pagamento não grava processado_por/data_processamento');
  END IF;
  r := pg_temp.exec_como(u_proc, 'authenticated', format('UPDATE public.folhas_pagamento SET data_processamento = ''2000-01-01'' WHERE id = %L', f2));
  IF (SELECT data_processamento FROM public.folhas_pagamento WHERE id = f2) < '2001-01-01' THEN
    PERFORM pg_temp.falha('E1 folha: data_processamento mudada pelo cliente sem processar (' || r || ')');
  END IF;
  IF current_setting('trilha.renovar_decisao', true) IS DISTINCT FROM '' AND current_setting('trilha.renovar_decisao', true) IS NOT NULL THEN
    PERFORM pg_temp.falha('E1 folha: trilha.renovar_decisao ficou ligada depois de processar a folha');
  END IF;

  -- ===== trilha imutável: postgres, service role, superusuário e modo réplica
  SELECT count(*) INTO n FROM public.folha_historico_status WHERE folha_id = f1;
  IF n = 0 THEN PERFORM pg_temp.falha('E1 trilha: a transição da folha de teste não gerou folha_historico_status'); END IF;
  FOR x IN SELECT * FROM (VALUES ('audit_logs', 'description'), ('folha_historico_status', 'justificativa'),
                                 ('rubricas_historico', 'justificativa')) AS v(tabela, coluna) LOOP
    IF x.tabela = 'rubricas_historico' THEN
      SET LOCAL session_replication_role = replica;
      INSERT INTO public.rubricas_historico (rubrica_id, versao, dados_anteriores, dados_novos)
        VALUES ((SELECT id_a FROM semeado WHERE tabela = 'rubricas')::uuid, 99, '{}', '{}');
      SET LOCAL session_replication_role = origin;
    END IF;
    FOREACH esperado IN ARRAY ARRAY['postgres', 'service_role'] LOOP
      r := pg_temp.sql_como(NULL, esperado, format('UPDATE public.%I SET %I = ''x''', x.tabela, x.coluna));
      IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha(format('E1 imutável: UPDATE em %s como %s (%s)', x.tabela, esperado, r)); END IF;
      r := pg_temp.sql_como(NULL, esperado, format('DELETE FROM public.%I', x.tabela));
      IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha(format('E1 imutável: DELETE em %s como %s (%s)', x.tabela, esperado, r)); END IF;
      r := pg_temp.sql_como(NULL, esperado, format('TRUNCATE public.%I CASCADE', x.tabela));
      IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha(format('E1 imutável: TRUNCATE em %s como %s (%s)', x.tabela, esperado, r)); END IF;
    END LOOP;
    r := pg_temp.sql_como(NULL, 'postgres', format('DELETE FROM public.%I', x.tabela));
    IF r NOT ILIKE '%imutável%' THEN PERFORM pg_temp.falha(format('E1 imutável: DELETE em %s como postgres não é barrado pelo trigger (%s)', x.tabela, r)); END IF;
    BEGIN   -- superusuário em modo réplica (triggers comuns desligados): o trigger é ENABLE ALWAYS
      SET LOCAL session_replication_role = replica;
      EXECUTE format('DELETE FROM public.%I', x.tabela);
      GET DIAGNOSTICS n = ROW_COUNT;
      RAISE EXCEPTION USING ERRCODE = 'P0099', MESSAGE = 'apagou ' || n;
    EXCEPTION
      WHEN SQLSTATE 'P0099' THEN PERFORM pg_temp.falha(format('E1 imutável: superusuário em modo réplica %s em %s', SQLERRM, x.tabela));
      WHEN SQLSTATE '42501' THEN NULL;
    END;
    SET LOCAL session_replication_role = origin;
  END LOOP;
  -- expurgo autorizado (rotina futura): o GUC de sessão libera; a sub-transação desfaz
  BEGIN
    PERFORM set_config('trilha.expurgo', 'autorizado', true);
    DELETE FROM public.audit_logs WHERE entity_type = 'servidor_tags' AND entity_id = t6;
    GET DIAGNOSTICS n = ROW_COUNT;
    RAISE EXCEPTION USING ERRCODE = 'P0099', MESSAGE = n::text;
  EXCEPTION
    WHEN SQLSTATE 'P0099' THEN IF SQLERRM = '0' THEN PERFORM pg_temp.falha('E1 imutável: o GUC de expurgo não libera a exclusão'); END IF;
    WHEN OTHERS THEN PERFORM pg_temp.falha('E1 imutável: o GUC de expurgo não libera a exclusão (' || SQLSTATE || ')');
  END;
  IF current_setting('trilha.expurgo', true) = 'autorizado' THEN PERFORM pg_temp.falha('E1 imutável: GUC de expurgo sobrou depois da sub-transação'); END IF;
  -- linha de histórico sem pai (FK nula) não passa pela exceção da cascata
  SET LOCAL session_replication_role = replica;
  INSERT INTO public.rubricas_historico (rubrica_id, versao, dados_anteriores, dados_novos) VALUES (NULL, 98, '{}', '{}');
  SET LOCAL session_replication_role = origin;
  r := pg_temp.sql_como(NULL, 'postgres', 'DELETE FROM public.rubricas_historico WHERE rubrica_id IS NULL');
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('E1 imutável: linha de rubricas_historico com rubrica_id nulo é apagada (' || r || ')'); END IF;
  -- cascata do pai: excluir a folha (não fechada) leva o histórico dela
  r := pg_temp.sql_como(u_admin, 'authenticated', format('DELETE FROM public.folhas_pagamento WHERE id = %L', f2));
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('E1 imutável: a folha com histórico não é excluída pela cascata (' || r || ')'); END IF;

  -- ===== frequência: o admin não escolhe o autor da etapa
  v_tipo := pg_temp.seed_row('tipos_abono');
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO public.solicitacoes_abono (id, servidor_id, tipo_abono_id, data_inicio, data_fim, justificativa, status)
    VALUES (ab, sa, v_tipo::uuid, current_date, current_date, 'E1', 'pendente');
  r := pg_temp.exec_como(u_admin, 'authenticated', format(
         'UPDATE public.solicitacoes_abono SET status = ''aprovado'', aprovado_rh_por = %L, aprovado_rh_em = ''2000-01-01'' WHERE id = %L', u_nenhum, ab));
  SELECT to_jsonb(s) INTO j FROM public.solicitacoes_abono s WHERE id = ab;
  IF r <> 'ok' OR j ->> 'status' <> 'aprovado' THEN PERFORM pg_temp.falha('E1 frequência: o admin não aprova o abono (' || r || ')');
  ELSIF j ->> 'aprovado_rh_por' IS DISTINCT FROM u_admin::text OR (j ->> 'aprovado_rh_em')::timestamptz < '2001-01-01' THEN
    PERFORM pg_temp.falha('E1 frequência: o admin escolheu o autor/data da etapa (' || coalesce(j ->> 'aprovado_rh_por', 'nulo') || ')');
  END IF;

  -- ===== leitura da trilha do RH: módulo rh E rh.auditoria.visualizar; só o módulo 'rh'
  IF pg_temp.sel(u_rh, 'authenticated', 'audit_logs') <> 0 THEN PERFORM pg_temp.falha('E1 leitura: o módulo rh sem rh.auditoria.visualizar lê a trilha'); END IF;
  UPDATE public.user_modules SET permissions = ARRAY['rh.auditoria.visualizar'] WHERE user_id = u_rh AND module = 'rh';
  SELECT count(*) INTO n FROM public.audit_logs WHERE module_name = 'rh';
  IF n = 0 OR pg_temp.sel(u_rh, 'authenticated', 'audit_logs') <> n THEN
    PERFORM pg_temp.falha('E1 leitura: com rh.auditoria.visualizar não lê as ' || n || ' linhas do módulo rh');
  END IF;
  r := pg_temp.valor_desfeito_como(u_rh, 'authenticated', 'SELECT count(*)::text FROM public.audit_logs WHERE module_name IS DISTINCT FROM ''rh''');
  IF r <> '0' THEN PERFORM pg_temp.falha('E1 leitura: rh.auditoria.visualizar lê trilha de outro módulo (' || r || ')'); END IF;
  UPDATE public.user_modules SET permissions = NULL WHERE user_id = u_rh AND module = 'rh';
  BEGIN
    INSERT INTO public.user_permissions (user_id, permission) VALUES (u_nenhum, 'rh.auditoria.visualizar');
    IF pg_temp.sel(u_nenhum, 'authenticated', 'audit_logs') <> 0 THEN PERFORM pg_temp.falha('E1 leitura: a permissão avulsa sem o módulo rh lê a trilha'); END IF;
    DELETE FROM public.user_permissions WHERE user_id = u_nenhum AND permission = 'rh.auditoria.visualizar';
  EXCEPTION WHEN OTHERS THEN
    PERFORM pg_temp.falha('E1 leitura: permissão rh.auditoria.visualizar fora do catálogo (' || SQLSTATE || ')');
  END;
  IF pg_temp.sel(u_admin, 'authenticated', 'audit_logs') < 1 THEN PERFORM pg_temp.falha('E1 leitura: o admin não lê a trilha'); END IF;
  -- nenhum papel recebe a permissão; action_type fora de 'visualizar' (a carga do papel user não a alcança)
  IF EXISTS (SELECT 1 FROM public.role_permissions WHERE permission = 'rh.auditoria.visualizar') THEN
    PERFORM pg_temp.falha('E1 leitura: algum papel recebe rh.auditoria.visualizar por padrão');
  END IF;
  IF (SELECT action_type FROM public.module_permissions_catalog WHERE permission_code = 'rh.auditoria.visualizar') IS DISTINCT FROM 'auditar' THEN
    PERFORM pg_temp.falha('E1 leitura: rh.auditoria.visualizar sem action_type auditar no catálogo');
  END IF;

  -- ===== sequencia: ordem de gravação, sem escolha do cliente
  SELECT max(to_jsonb(a) ->> 'sequencia')::bigint INTO seq1 FROM public.audit_logs a;
  r := pg_temp.insere_como(u_rh, 'authenticated', 'servidor_tags', jsonb_build_object('id', t7, 'nome', 'E1 tag 7'));
  SELECT (to_jsonb(a) ->> 'sequencia')::bigint INTO seq2 FROM public.audit_logs a WHERE a.entity_type = 'servidor_tags' AND a.entity_id = t7;
  IF seq1 IS NULL OR seq2 IS NULL OR seq2 <= seq1 THEN
    PERFORM pg_temp.falha('E1 trilha: sequencia não ordena a gravação (' || coalesce(seq1::text, 'nula') || ' -> ' || coalesce(seq2::text, 'nula') || ')');
  END IF;
  -- cache do contexto: vincular o perfil no meio da transação muda o servidor do próximo lançamento
  r := pg_temp.exec_como(u_admin, 'authenticated', format('UPDATE public.profiles SET servidor_id = %L WHERE id = %L', sb, u_rh));
  r := r || '/' || pg_temp.exec_como(u_rh, 'authenticated', format('UPDATE public.servidor_tags SET nome = ''E1 tag 7b'' WHERE id = %L', t7));
  IF (SELECT to_jsonb(s2) ->> 'updated_by_servidor_id' FROM public.servidor_tags s2 WHERE id = t7) IS DISTINCT FROM sb::text
     OR (SELECT to_jsonb(a) ->> 'origem' FROM public.audit_logs a WHERE a.entity_type = 'servidor_tags' AND a.entity_id = t7 AND a.action = 'update') IS DISTINCT FROM 'usuario' THEN
    PERFORM pg_temp.falha('E1 trilha: o contexto guardado na transação não foi relido depois do vínculo do perfil (' || r || ')');
  END IF;
  r := pg_temp.exec_como(u_admin, 'authenticated', format('UPDATE public.profiles SET servidor_id = NULL WHERE id = %L', u_rh));

  -- ===== trilha do módulo admin: vínculo do perfil sim, nome não
  r := pg_temp.exec_como(u_nenhum, 'authenticated', 'UPDATE public.profiles SET full_name = ''Nome E1'' WHERE id = auth.uid()');
  IF EXISTS (SELECT 1 FROM public.audit_logs WHERE entity_type = 'profiles' AND entity_id = u_nenhum AND "timestamp" >= now()) THEN
    PERFORM pg_temp.falha('E1 trilha: troca de nome do perfil gerou linha (só vínculo e acesso entram)');
  END IF;
  r := pg_temp.exec_como(u_admin, 'authenticated', format('UPDATE public.profiles SET servidor_id = %L WHERE id = %L', sb, u_nenhum));
  SELECT to_jsonb(a) INTO j FROM public.audit_logs a WHERE a.entity_type = 'profiles' AND a.entity_id = u_nenhum AND a.action = 'update' AND a."timestamp" >= now();
  IF r <> 'ok' OR j IS NULL OR j ->> 'module_name' <> 'admin' OR j -> 'campos_alterados' IS DISTINCT FROM '["servidor_id"]'::jsonb
     OR j -> 'after_data' ->> 'email' IS DISTINCT FROM '[protegido]' THEN
    PERFORM pg_temp.falha('E1 trilha: vínculo servidor_id do perfil sem trilha do módulo admin (' || r || ', ' || coalesce(left(j::text, 100), 'nada') || ')');
  END IF;
  r := pg_temp.exec_como(u_admin, 'authenticated', format('UPDATE public.profiles SET servidor_id = NULL WHERE id = %L', u_nenhum));

  -- ===== cobertura: toda tabela do RH no mapa tem autoria e trilha; as de trilha, imutabilidade sempre ligada
  FOR x IN SELECT m.tabela, m.classe FROM mapa m WHERE 'rh' = ANY (string_to_array(m.modulos, '|')) ORDER BY 1 LOOP
    IF x.classe = 'trilha' THEN
      IF NOT EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_proc p ON p.oid = t.tgfoid
                      WHERE t.tgrelid = ('public.' || quote_ident(x.tabela))::regclass AND p.proname = 'trilha_imutavel'
                        AND t.tgenabled = 'A' AND (t.tgtype & 16) <> 0 AND (t.tgtype & 8) <> 0) THEN
        PERFORM pg_temp.falha('E1 cobertura: ' || x.tabela || ' (trilha) sem trilha_imutavel ENABLE ALWAYS em UPDATE/DELETE');
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_proc p ON p.oid = t.tgfoid
                      WHERE t.tgrelid = ('public.' || quote_ident(x.tabela))::regclass AND p.proname = 'trilha_imutavel'
                        AND t.tgenabled = 'A' AND (t.tgtype & 32) <> 0) THEN
        PERFORM pg_temp.falha('E1 cobertura: ' || x.tabela || ' (trilha) sem trilha_imutavel ENABLE ALWAYS em TRUNCATE');
      END IF;
    ELSE
      -- zz_fixar_autoria: BEFORE (2) por linha (1) em INSERT (4) e UPDATE (16), ligado
      IF NOT EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_proc p ON p.oid = t.tgfoid
                      WHERE t.tgrelid = ('public.' || quote_ident(x.tabela))::regclass AND p.proname = 'fixar_autoria' AND t.tgname = 'zz_fixar_autoria'
                        AND (t.tgtype & 1) <> 0 AND (t.tgtype & 2) <> 0 AND (t.tgtype & 4) <> 0 AND (t.tgtype & 16) <> 0
                        AND t.tgenabled <> 'D' AND t.tgqual IS NULL AND t.tgattr = ''::int2vector) THEN
        PERFORM pg_temp.falha('E1 cobertura: ' || x.tabela || ' sem zz_fixar_autoria BEFORE INSERT OR UPDATE por linha, ligado e sem condição');
      END IF;
      -- audit_<tabela>: AFTER por linha em INSERT, DELETE e UPDATE (8), fn_audit_trigger('rh'), ligado
      IF NOT EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_proc p ON p.oid = t.tgfoid
                      WHERE t.tgrelid = ('public.' || quote_ident(x.tabela))::regclass AND p.proname = 'fn_audit_trigger'
                        AND t.tgname = 'audit_' || x.tabela AND (t.tgtype & 1) <> 0 AND (t.tgtype & 2) = 0
                        AND (t.tgtype & 4) <> 0 AND (t.tgtype & 8) <> 0 AND (t.tgtype & 16) <> 0
                        AND t.tgenabled <> 'D' AND t.tgqual IS NULL AND t.tgattr = ''::int2vector
                        AND t.tgnargs = 1 AND encode(t.tgargs, 'escape') = 'rh\000') THEN
        PERFORM pg_temp.falha('E1 cobertura: ' || x.tabela || ' sem audit_' || x.tabela || ' AFTER INSERT OR UPDATE OR DELETE com fn_audit_trigger(''rh''), ligado');
      END IF;
      -- zz_fixar_autoria é o ÚLTIMO BEFORE ROW (a autoria final é a do banco)
      IF EXISTS (SELECT 1 FROM pg_trigger t
                  WHERE t.tgrelid = ('public.' || quote_ident(x.tabela))::regclass AND NOT t.tgisinternal
                    AND (t.tgtype & 1) <> 0 AND (t.tgtype & 2) <> 0 AND t.tgname > 'zz_fixar_autoria') THEN
        PERFORM pg_temp.falha('E1 cobertura: ' || x.tabela || ' tem trigger BEFORE ROW que roda depois de zz_fixar_autoria');
      END IF;
    END IF;
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_proc p ON p.oid = t.tgfoid
                  WHERE t.tgrelid = 'public.audit_logs'::regclass AND p.proname = 'trilha_imutavel' AND t.tgenabled = 'A' AND (t.tgtype & 32) <> 0) THEN
    PERFORM pg_temp.falha('E1 cobertura: audit_logs sem trilha_imutavel em TRUNCATE');
  END IF;

  -- ===== privilégios: funções de apoio e de trigger fora da API; registrar_evento só authenticated
  FOR x IN SELECT p.oid, p.proname FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace
             AND p.proname IN ('responsavel_atual', 'rh_exige_servidor_vinculado', 'mascarar_parcial', 'trilha_mascarar',
                               'trilha_contexto_requisicao', 'trilha_completar_contexto', 'trilha_imutavel', 'fixar_autoria',
                               'trilha_contexto', 'trilha_contexto_invalidar') LOOP
    IF has_function_privilege('authenticated', x.oid, 'EXECUTE') OR has_function_privilege('anon', x.oid, 'EXECUTE') THEN
      PERFORM pg_temp.falha('E1 privilégio: ' || x.proname || ' executável pela API');
    END IF;
  END LOOP;
  SELECT count(*) INTO n FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace AND p.proname IN
    ('responsavel_atual', 'rh_exige_servidor_vinculado', 'mascarar_parcial', 'trilha_mascarar', 'trilha_contexto_requisicao',
     'trilha_completar_contexto', 'trilha_imutavel', 'fixar_autoria', 'registrar_evento', 'trilha_contexto',
     'trilha_contexto_invalidar');
  IF n <> 11 THEN PERFORM pg_temp.falha('E1: faltam funções da migração 20261011000000 (' || n || ' de 11)'); END IF;
  -- máscara reaplicada não muda (a migração mascara a trilha antiga e roda mais de uma vez)
  IF EXISTS (SELECT 1 FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace AND p.proname = 'trilha_mascarar') THEN
    EXECUTE 'SELECT public.trilha_mascarar(''servidores'', public.trilha_mascarar(''servidores'', ''{"cpf": "12345678901", "pis_pasep": "1234567890"}''))::text' INTO r;
    IF r IS DISTINCT FROM '{"cpf": "***.456.789-**", "pis_pasep": "***45678**"}' THEN
      PERFORM pg_temp.falha('E1 máscara: reaplicar a máscara muda o valor (' || coalesce(r, 'nulo') || ')');
    END IF;
  END IF;
  FOR x IN SELECT p.oid FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace AND p.proname = 'registrar_evento' LOOP
    IF NOT has_function_privilege('authenticated', x.oid, 'EXECUTE') OR has_function_privilege('anon', x.oid, 'EXECUTE')
       OR has_function_privilege('service_role', x.oid, 'EXECUTE') THEN
      PERFORM pg_temp.falha('E1 privilégio: registrar_evento deveria ser só de authenticated');
    END IF;
  END LOOP;
  IF EXISTS (SELECT 1 FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace AND p.proname = 'rh_exige_servidor_vinculado') THEN
    EXECUTE 'SELECT public.rh_exige_servidor_vinculado()::text' INTO r;
    IF r <> 'false' THEN PERFORM pg_temp.falha('E1: rh_exige_servidor_vinculado() = ' || r || ' sem decisão do órgão (premissa 1)'); END IF;
  END IF;

  PERFORM pg_temp.nota('E1 (autoria e trilha do RH): autoria forçada, origem, máscara, imutabilidade, folha, frequência, registrar_evento, leitura e cobertura verificadas');
END $$;

-- ---------------------------------------------------------------- RH: consulta e trilha do Storage (Onda E2) (TRIGGERS LIGADOS)
-- Migração 20261011000200_rh_trilha_consulta.sql (spec docs/superpowers/specs/2026-10-10-rh-trilha-tela-design.md):
--   * índices de audit_logs da tela (entidade, servidor, módulo e usuário, todos + sequencia) e os três
--     antigos que viraram prefixo removidos;
--   * trilha do Storage: gravar ('upload'), trocar/mover ('update') e apagar ('delete') objeto em frequencias e
--     documentos-requerimento grava linha em audit_logs (módulo rh, entity_type storage.<bucket>, entity_id = id do
--     objeto) com usuário, servidor, origem, IP e user agent; só carimbo (updated_at) não grava; outro bucket não grava;
--     service role vira origem `sistema`; nada do caminho com nome, de user_metadata nem de antes/depois na trilha;
--     caminho de uuid em claro; servidor dono do arquivo quando dá para saber; função fora da API.
-- Colunas da E1 lidas por to_jsonb(...): num banco anterior o bloco reprova sem abortar.
DO $$
DECLARE
  u_admin uuid := (SELECT uid FROM persona WHERE nome='admin');
  u_a uuid := (SELECT uid FROM persona WHERE nome='srv_a');
  u_rh uuid := (SELECT uid FROM persona WHERE nome='mod_rh');
  u_lanc uuid := (SELECT uid FROM persona WHERE nome='perm_rh.frequencia.lancar');
  u_fl uuid := (SELECT uid FROM persona WHERE nome='perm_rh.frequencia.lancar');   -- módulo rh + rh.frequencia.lancar
  u_ed uuid := (SELECT uid FROM persona WHERE nome='perm_rh.servidores.editar');   -- módulo rh + rh.servidores.editar
  sa uuid := 'b0000000-0000-0000-0000-00000000000a';
  sb uuid := 'b0000000-0000-0000-0000-00000000000b';
  o1 uuid := 'e2000000-0000-0000-0000-000000000001';
  o2 uuid := 'e2000000-0000-0000-0000-000000000002';
  o3 uuid := 'e2000000-0000-0000-0000-000000000003';
  o4 uuid := 'e2000000-0000-0000-0000-000000000004';
  o5 uuid := 'e2000000-0000-0000-0000-000000000005';
  doc uuid := 'e2000000-0000-0000-0000-0000000000d1';
  nome1 text := '2026-02/DIRAF/9999_Fulano_Sigiloso_1700000000000.pdf';
  r text; n int; j jsonb; x record; f text;
BEGIN
  PERFORM set_config('request.jwt.claims', '', true);
  PERFORM set_config('request.headers', '', true);
  IF u_fl IS NULL OR u_ed IS NULL THEN RAISE EXCEPTION 'faltam as personas perm_rh.frequencia.lancar/perm_rh.servidores.editar (mapa.csv)'; END IF;

  -- ===== estrutura: funções fora da API, triggers ligados com WHEN nos dois buckets, índices
  FOREACH f IN ARRAY ARRAY['public.trilha_storage()', 'public.trilha_storage_chave(text,text)'] LOOP
    IF to_regprocedure(f) IS NULL THEN PERFORM pg_temp.falha('E2 storage: função ' || f || ' não existe'); CONTINUE; END IF;
    IF has_function_privilege('authenticated', f, 'EXECUTE') OR has_function_privilege('anon', f, 'EXECUTE') THEN
      PERFORM pg_temp.falha('E2 storage: ' || f || ' executável pela API');
    END IF;
  END LOOP;
  IF to_regprocedure('public.trilha_storage()') IS NOT NULL
     AND NOT (SELECT prosecdef AND coalesce(proconfig::text, '') ~ 'search_path' FROM pg_proc WHERE oid = to_regprocedure('public.trilha_storage()')) THEN
    PERFORM pg_temp.falha('E2 storage: trilha_storage sem SECURITY DEFINER ou sem search_path fixo');
  END IF;
  FOREACH f IN ARRAY ARRAY['insert:4', 'update:16', 'delete:8'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_trigger t JOIN pg_proc p ON p.oid = t.tgfoid
                    WHERE t.tgrelid = 'storage.objects'::regclass AND t.tgname = 'trilha_rh_storage_' || split_part(f, ':', 1)
                      AND p.proname = 'trilha_storage' AND t.tgenabled <> 'D' AND (t.tgtype & 1) <> 0 AND (t.tgtype & 2) = 0
                      AND (t.tgtype & split_part(f, ':', 2)::int) <> 0 AND t.tgnargs = 1 AND encode(t.tgargs, 'escape') = 'rh\000'
                      AND pg_get_triggerdef(t.oid) LIKE '%''frequencias''%' AND pg_get_triggerdef(t.oid) LIKE '%''documentos-requerimento''%') THEN
      PERFORM pg_temp.falha('E2 storage: falta trilha_rh_storage_' || split_part(f, ':', 1) || ' (AFTER por linha, trilha_storage(''rh''), ligado, WHEN nos dois buckets)');
    END IF;
  END LOOP;
  FOREACH f IN ARRAY ARRAY['idx_audit_logs_entidade_seq', 'idx_audit_logs_servidor_seq', 'idx_audit_logs_modulo_seq', 'idx_audit_logs_usuario_seq'] LOOP
    IF to_regclass('public.' || f) IS NULL THEN PERFORM pg_temp.falha('E2 índices: falta ' || f); END IF;
  END LOOP;
  FOREACH f IN ARRAY ARRAY['idx_audit_logs_entity', 'idx_audit_logs_module', 'idx_audit_logs_user'] LOOP
    IF to_regclass('public.' || f) IS NOT NULL THEN PERFORM pg_temp.falha('E2 índices: ' || f || ' (prefixo de um índice novo) continua'); END IF;
  END LOOP;

  -- quem age: perm_rh.frequencia.lancar vinculado ao servidor B (desfeito no fim); IP e user agent da requisição
  r := pg_temp.exec_como(u_admin, 'authenticated', format('UPDATE public.profiles SET servidor_id = %L WHERE id = %L', sb, u_fl));
  PERFORM set_config('request.headers', '{"x-real-ip": "192.0.2.20", "user-agent": "teste-e2"}', true);

  -- ===== upload no bucket frequencias: caminho com nome do servidor não vai à trilha; user_metadata também não
  r := pg_temp.exec_como(u_fl, 'authenticated', format(
         'INSERT INTO storage.objects (id, bucket_id, name, metadata, user_metadata) VALUES (%L, ''frequencias'', %L, %L, %L)',
         o1, nome1, '{"size": 1234, "mimetype": "application/pdf"}', '{"obs": "Segredo do cliente"}'));
  SELECT to_jsonb(a) INTO j FROM public.audit_logs a WHERE a.entity_type = 'storage.frequencias' AND a.entity_id = o1 AND a.action = 'upload';
  IF r <> 'ok' OR j IS NULL THEN
    PERFORM pg_temp.falha('E2 storage: upload em frequencias sem linha na trilha (' || r || ')');
  ELSE
    IF j ->> 'module_name' IS DISTINCT FROM 'rh' OR j ->> 'user_id' IS DISTINCT FROM u_fl::text OR j ->> 'origem' IS DISTINCT FROM 'usuario'
       OR j ->> 'servidor_id' IS DISTINCT FROM sb::text OR j ->> 'transacao' IS NULL THEN
      PERFORM pg_temp.falha('E2 storage: upload sem módulo rh, usuário, servidor ou origem (' || left(j::text, 160) || ')');
    END IF;
    IF j ->> 'ip_address' IS DISTINCT FROM '192.0.2.20' OR j ->> 'user_agent' IS DISTINCT FROM 'teste-e2' THEN
      PERFORM pg_temp.falha('E2 storage: upload sem IP/user agent da requisição (' || coalesce(j ->> 'ip_address', 'nulo') || ', ' || coalesce(j ->> 'user_agent', 'nulo') || ')');
    END IF;
    IF j -> 'metadata' -> 'chave' ->> 'bucket' IS DISTINCT FROM 'frequencias'
       OR jsonb_typeof(j -> 'metadata' -> 'chave' -> 'caminho') IS DISTINCT FROM 'null'
       OR j -> 'metadata' -> 'chave' ->> 'caminho_sha256' IS DISTINCT FROM encode(sha256(convert_to(nome1, 'UTF8')), 'hex')
       OR j -> 'metadata' -> 'chave' ->> 'periodo' IS DISTINCT FROM '2026-02' OR j -> 'metadata' -> 'chave' ->> 'extensao' IS DISTINCT FROM 'pdf'
       OR j -> 'metadata' ->> 'objeto_id' IS DISTINCT FROM o1::text OR j -> 'metadata' ->> 'tamanho' IS DISTINCT FROM '1234'
       OR j -> 'metadata' ->> 'tipo_conteudo' IS DISTINCT FROM 'application/pdf' OR j -> 'metadata' ->> 'fonte' IS DISTINCT FROM 'storage' THEN
      PERFORM pg_temp.falha('E2 storage: chave/metadados do upload diferentes do esperado (' || left((j -> 'metadata')::text, 200) || ')');
    END IF;
    IF j -> 'before_data' IS DISTINCT FROM 'null'::jsonb OR j -> 'after_data' IS DISTINCT FROM 'null'::jsonb THEN
      PERFORM pg_temp.falha('E2 storage: a linha do arquivo leva antes/depois');
    END IF;
  END IF;

  -- ===== só carimbo (updated_at) não grava; troca (version/metadata) grava 'update' com os campos; mover leva o anterior
  r := pg_temp.exec_como(u_fl, 'authenticated', format('UPDATE storage.objects SET updated_at = now(), last_accessed_at = now() WHERE id = %L', o1));
  SELECT count(*) INTO n FROM public.audit_logs a WHERE a.entity_id = o1 AND a.action = 'update';
  IF r <> 'ok' OR n <> 0 THEN PERFORM pg_temp.falha('E2 storage: UPDATE só de carimbo gravou ' || n || ' linha(s) (' || r || ')'); END IF;
  r := pg_temp.exec_como(u_fl, 'authenticated', format('UPDATE storage.objects SET version = ''v2'', metadata = ''{"size": 2048, "mimetype": "application/pdf"}'' WHERE id = %L', o1));
  SELECT to_jsonb(a) INTO j FROM public.audit_logs a WHERE a.entity_id = o1 AND a.action = 'update';
  IF r <> 'ok' OR j IS NULL OR j -> 'campos_alterados' IS DISTINCT FROM '["metadata", "version"]'::jsonb
     OR j -> 'metadata' ->> 'tamanho' IS DISTINCT FROM '2048' OR j -> 'metadata' ? 'anterior' THEN
    PERFORM pg_temp.falha('E2 storage: troca do arquivo sem linha update com campos_alterados (' || r || ', ' || coalesce(left(j::text, 160), 'nada') || ')');
  END IF;
  r := pg_temp.exec_como(u_fl, 'authenticated', format('UPDATE storage.objects SET name = %L WHERE id = %L', '2026-02/DIRAF/9999_Fulano_Sigiloso_v2.pdf', o1));
  SELECT to_jsonb(a) INTO j FROM public.audit_logs a WHERE a.entity_id = o1 AND a.action = 'update' AND (to_jsonb(a) -> 'campos_alterados') ? 'name';
  IF r <> 'ok' OR j IS NULL OR j -> 'metadata' -> 'anterior' ->> 'caminho_sha256' IS DISTINCT FROM encode(sha256(convert_to(nome1, 'UTF8')), 'hex')
     OR jsonb_typeof(j -> 'metadata' -> 'anterior' -> 'caminho') IS DISTINCT FROM 'null' THEN
    PERFORM pg_temp.falha('E2 storage: mover o arquivo não registra o caminho anterior (pelo hash) (' || r || ', ' || coalesce(left((j -> 'metadata')::text, 160), 'nada') || ')');
  END IF;

  -- ===== exclusão: linha delete com o servidor dono do PDF (linha de frequencia_arquivos da semente da B3)
  INSERT INTO storage.objects (id, bucket_id, name) VALUES (o2, 'frequencias', 'e2/' || sa || '/2026-03.pdf');
  INSERT INTO public.frequencia_arquivos (periodo, ano, mes, servidor_id, tipo, arquivo_path, arquivo_nome)
    VALUES ('2026-03', 2026, 3, sa, 'individual', 'e2/' || sa || '/2026-03.pdf', 'e2.pdf');
  r := pg_temp.exec_como(u_fl, 'authenticated', format('DELETE FROM storage.objects WHERE id = %L', o2));
  SELECT to_jsonb(a) INTO j FROM public.audit_logs a WHERE a.entity_type = 'storage.frequencias' AND a.entity_id = o2 AND a.action = 'delete';
  IF r <> 'ok' OR j IS NULL OR j ->> 'user_id' IS DISTINCT FROM u_fl::text OR j -> 'metadata' ->> 'servidor_alvo_id' IS DISTINCT FROM sa::text THEN
    PERFORM pg_temp.falha('E2 storage: exclusão em frequencias sem linha delete com o servidor dono (' || r || ', ' || coalesce(left(j::text, 160), 'nada') || ')');
  END IF;

  -- ===== documentos-requerimento: caminho de uuid vai em claro, com o servidor da pasta; exclusão também grava
  r := pg_temp.exec_como(u_ed, 'authenticated', format('INSERT INTO storage.objects (id, bucket_id, name) VALUES (%L, ''documentos-requerimento'', %L)', o3, sb || '/' || doc || '.pdf'));
  SELECT to_jsonb(a) INTO j FROM public.audit_logs a WHERE a.entity_type = 'storage.documentos-requerimento' AND a.entity_id = o3 AND a.action = 'upload';
  IF r <> 'ok' OR j IS NULL OR j -> 'metadata' -> 'chave' ->> 'caminho' IS DISTINCT FROM sb || '/' || doc || '.pdf'
     OR j -> 'metadata' ->> 'servidor_alvo_id' IS DISTINCT FROM sb::text OR j ->> 'origem' IS DISTINCT FROM 'usuario_sem_vinculo' THEN
    PERFORM pg_temp.falha('E2 storage: upload em documentos-requerimento sem caminho de uuid, servidor da pasta ou origem (' || r || ', ' || coalesce(left(j::text, 200), 'nada') || ')');
  END IF;
  r := pg_temp.exec_como(u_ed, 'authenticated', format('DELETE FROM storage.objects WHERE id = %L', o3));
  IF r <> 'ok' OR NOT EXISTS (SELECT 1 FROM public.audit_logs a WHERE a.entity_type = 'storage.documentos-requerimento' AND a.entity_id = o3 AND a.action = 'delete') THEN
    PERFORM pg_temp.falha('E2 storage: exclusão em documentos-requerimento sem linha na trilha (' || r || ')');
  END IF;

  -- ===== outro bucket não grava; gravação negada pela RLS não grava; service role vira origem sistema
  r := pg_temp.exec_como(u_admin, 'authenticated', format('INSERT INTO storage.objects (id, bucket_id, name) VALUES (%L, ''documentos'', ''e2/ato.pdf'')', o4));
  IF r <> 'ok' OR EXISTS (SELECT 1 FROM public.audit_logs a WHERE a.entity_id = o4) THEN
    PERFORM pg_temp.falha('E2 storage: objeto do bucket documentos gerou linha (ou não foi gravado: ' || r || ')');
  END IF;
  r := pg_temp.exec_como(u_a, 'authenticated', 'INSERT INTO storage.objects (bucket_id, name) VALUES (''frequencias'', ''e2/negado.pdf'')');
  IF r NOT LIKE 'erro:42501%' OR EXISTS (SELECT 1 FROM public.audit_logs a WHERE a.metadata -> 'chave' ->> 'caminho_sha256' = encode(sha256(convert_to('e2/negado.pdf', 'UTF8')), 'hex')) THEN
    PERFORM pg_temp.falha('E2 storage: gravação negada pela RLS deixou linha na trilha (ou passou: ' || r || ')');
  END IF;
  PERFORM set_config('request.headers', '', true);
  r := pg_temp.exec_como(NULL, 'service_role', format('INSERT INTO storage.objects (id, bucket_id, name) VALUES (%L, ''frequencias'', ''2026-04/GERAL/lote.zip'')', o5));
  SELECT to_jsonb(a) INTO j FROM public.audit_logs a WHERE a.entity_id = o5;
  IF r <> 'ok' OR j IS NULL OR j ->> 'origem' IS DISTINCT FROM 'sistema' OR j ->> 'user_id' IS NOT NULL THEN
    PERFORM pg_temp.falha('E2 storage: gravação pela service role sem linha de origem sistema (' || r || ', ' || coalesce(left(j::text, 160), 'nada') || ')');
  END IF;

  -- ===== nada de nome do servidor, user_metadata ou conteúdo na trilha dos arquivos
  SELECT count(*) INTO n FROM public.audit_logs a
   WHERE a.entity_type LIKE 'storage.%' AND (a::text LIKE '%Fulano%' OR a::text LIKE '%Sigiloso%' OR a::text LIKE '%Segredo do cliente%');
  IF n > 0 THEN PERFORM pg_temp.falha('E2 storage: ' || n || ' linha(s) da trilha com nome do caminho ou user_metadata'); END IF;
  SELECT count(*) INTO n FROM public.audit_logs a WHERE a.entity_type LIKE 'storage.%';
  IF n < 7 THEN PERFORM pg_temp.falha('E2 storage: esperava ao menos 7 linhas de arquivo na trilha, há ' || n); END IF;

  -- ===== leitura: as linhas dos arquivos são do módulo rh (rh.auditoria.visualizar lê, o módulo sozinho não)
  SELECT count(*) INTO n FROM public.audit_logs a WHERE a.entity_type LIKE 'storage.%' AND a.module_name = 'rh';
  r := pg_temp.valor_desfeito_como(u_rh, 'authenticated', 'SELECT count(*)::text FROM public.audit_logs WHERE entity_type LIKE ''storage.%''');
  IF r <> '0' THEN PERFORM pg_temp.falha('E2 storage: o módulo rh sem rh.auditoria.visualizar lê a trilha dos arquivos (' || r || ')'); END IF;
  UPDATE public.user_modules SET permissions = ARRAY['rh.auditoria.visualizar'] WHERE user_id = u_rh AND module = 'rh';
  r := pg_temp.valor_desfeito_como(u_rh, 'authenticated', 'SELECT count(*)::text FROM public.audit_logs WHERE entity_type LIKE ''storage.%''');
  IF r IS DISTINCT FROM n::text THEN PERFORM pg_temp.falha('E2 storage: com rh.auditoria.visualizar não lê as ' || n || ' linhas dos arquivos (' || r || ')'); END IF;
  UPDATE public.user_modules SET permissions = NULL WHERE user_id = u_rh AND module = 'rh';

  -- ===== revisão de segurança: extensão de lista fechada (M1) e tipo de conteúdo só tipo/subtipo (M2)
  IF to_regprocedure('public.trilha_storage_chave(text,text)') IS NOT NULL THEN
    EXECUTE format('SELECT public.trilha_storage_chave(''documentos-requerimento'', %L)', sb || '/' || doc || '.MariaSouza') INTO j;
    IF jsonb_typeof(j -> 'caminho') IS DISTINCT FROM 'null' OR j ? 'extensao' OR j::text LIKE '%MariaSouza%' THEN
      PERFORM pg_temp.falha('E2 storage: sufixo livre (.MariaSouza) sai em claro na chave (' || left(j::text, 160) || ')');
    END IF;
    EXECUTE format('SELECT public.trilha_storage_chave(''documentos-requerimento'', %L)', sb || '/' || doc || '.PDF') INTO j;
    IF j ->> 'caminho' IS DISTINCT FROM sb || '/' || doc || '.PDF' OR j ->> 'extensao' IS DISTINCT FROM 'pdf' THEN
      PERFORM pg_temp.falha('E2 storage: caminho de uuid com extensão da lista (.PDF) não sai em claro (' || left(j::text, 160) || ')');
    END IF;
  END IF;
  r := pg_temp.exec_como(u_ed, 'authenticated', format(
         'INSERT INTO storage.objects (id, bucket_id, name, metadata) VALUES (%L, ''documentos-requerimento'', %L, %L)',
         'e2000000-0000-0000-0000-000000000006', sb || '/' || doc || '-2.pdf', '{"mimetype": "text/html; charset=<b>Fulano</b>"}'));
  SELECT to_jsonb(a) INTO j FROM public.audit_logs a WHERE a.entity_id = 'e2000000-0000-0000-0000-000000000006' AND a.action = 'upload';
  IF r <> 'ok' OR j IS NULL OR j -> 'metadata' ? 'tipo_conteudo' THEN
    PERFORM pg_temp.falha('E2 storage: Content-Type livre do cliente gravado como tipo_conteudo (' || r || ', ' || coalesce(left((j -> 'metadata')::text, 160), 'nada') || ')');
  END IF;

  -- ===== M4: o cliente não forja linha de arquivo nem o servidor dono do arquivo
  r := pg_temp.valor_como(u_rh, 'authenticated', 'SELECT public.log_audit(''view''::public.audit_action, ''storage.frequencias'', NULL, ''rh'')::text');
  IF r NOT LIKE 'erro:22023%' THEN PERFORM pg_temp.falha('E2 log_audit: aceita entity_type storage.* (' || coalesce(r, 'nulo') || ')'); END IF;
  r := pg_temp.valor_como(u_rh, 'authenticated', 'SELECT public.log_audit(''view''::public.audit_action, '' Storage.x'', NULL, ''admin'')::text');
  IF r NOT LIKE 'erro:22023%' THEN PERFORM pg_temp.falha('E2 log_audit: aceita entity_type Storage.* com caixa/espaço (' || coalesce(r, 'nulo') || ')'); END IF;
  r := pg_temp.valor_como(u_rh, 'authenticated', format(
         'SELECT public.log_audit(''view''::public.audit_action, ''contracheque'', NULL, ''rh'', NULL, NULL, ''e2'', %L)::text',
         jsonb_build_object('servidor_alvo_id', sa, 'fonte', 'storage')));
  IF r IS NULL OR r LIKE 'erro:%' OR (SELECT metadata ? 'servidor_alvo_id' OR metadata ->> 'fonte' IS DISTINCT FROM 'log_audit' FROM public.audit_logs WHERE id::text = r) IS NOT FALSE THEN
    PERFORM pg_temp.falha('E2 log_audit: servidor_alvo_id/fonte do cliente gravados (' || coalesce(r, 'nulo') || ')');
  END IF;
  r := pg_temp.valor_como(u_rh, 'authenticated', format(
         'SELECT public.registrar_evento(''view'', ''servidores'', %L, ''e2'', %L)::text', sa, jsonb_build_object('servidor_alvo_id', sb, 'fonte', 'storage')));
  IF r IS NULL OR r LIKE 'erro:%' OR (SELECT metadata ? 'servidor_alvo_id' OR metadata ->> 'fonte' IS DISTINCT FROM 'registrar_evento' FROM public.audit_logs WHERE id::text = r) IS NOT FALSE THEN
    PERFORM pg_temp.falha('E2 registrar_evento: servidor_alvo_id/fonte do cliente gravados (' || coalesce(r, 'nulo') || ')');
  END IF;

  -- ===== alvos (migração 20261011000300): coluna gerada com GIN; s:<servidor> e f:<folha> nas linhas do recorte
  IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'public.audit_logs'::regclass AND attname = 'alvos' AND attgenerated = 's' AND NOT attisdropped) THEN
    PERFORM pg_temp.falha('E2 alvos: audit_logs.alvos (coluna gerada STORED) não existe');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_index i JOIN pg_class c ON c.oid = i.indexrelid JOIN pg_am am ON am.oid = c.relam
                  WHERE i.indrelid = 'public.audit_logs'::regclass AND am.amname = 'gin' AND i.indpred IS NULL
                    AND pg_get_indexdef(i.indexrelid) LIKE '%(alvos)') THEN
    PERFORM pg_temp.falha('E2 alvos: falta o índice GIN (sem WHERE) em audit_logs.alvos');
  END IF;
  FOR x IN SELECT * FROM (VALUES
      ('upload em documentos-requerimento (servidor_alvo_id da trilha do Storage)', 'storage.documentos-requerimento', o3::text, 's:' || sb),
      ('UPDATE de servidores (entity_id)', 'servidores', sb::text, 's:' || sb),
      ('licença do servidor (after_data.servidor_id)', 'licencas_afastamentos', NULL, 's:' || sb)) AS v(caso, tipo, ent, token) LOOP
    IF NOT EXISTS (SELECT 1 FROM public.audit_logs a WHERE a.entity_type = x.tipo AND (x.ent IS NULL OR a.entity_id::text = x.ent)
                      AND coalesce((to_jsonb(a) -> 'alvos') ? x.token, false)) THEN
      PERFORM pg_temp.falha('E2 alvos: ' || x.caso || ' sem ' || x.token);
    END IF;
  END LOOP;
  -- servidor_alvo_id só conta na linha da trilha do Storage (metadata.fonte = storage); servidor alheio não entra
  IF EXISTS (SELECT 1 FROM public.audit_logs a WHERE a.metadata ->> 'fonte' IS DISTINCT FROM 'storage' AND a.metadata ? 'servidor_alvo_id'
                AND coalesce((to_jsonb(a) -> 'alvos') ? ('s:' || (a.metadata ->> 'servidor_alvo_id')), false)
                AND NOT coalesce((to_jsonb(a) -> 'alvos') ? ('s:' || (a.after_data ->> 'servidor_id')), false)) THEN
    PERFORM pg_temp.falha('E2 alvos: servidor_alvo_id fora da trilha do Storage entrou no recorte');
  END IF;
  -- a consulta da aba (alvos @> ARRAY[s:<id>]) acha a licença e o arquivo do servidor B
  SELECT count(*) INTO n FROM public.audit_logs a WHERE a.module_name = 'rh' AND (to_jsonb(a) -> 'alvos') @> to_jsonb(ARRAY['s:' || sb]);
  IF n < 3 THEN PERFORM pg_temp.falha('E2 alvos: o recorte do servidor B acha só ' || n || ' linha(s)'); END IF;

  -- ===== fechar_folha / reabrir_folha gravam no módulo rh (bloco da 2ª revisão: folha 7/2031)
  IF (SELECT string_agg(DISTINCT a.module_name, ',') FROM public.audit_logs a
       WHERE a.entity_type = 'folhas_pagamento' AND (a.description LIKE 'Folha 7/2031 fechada%' OR a.description LIKE 'Folha 7/2031 REABERTA%')) IS DISTINCT FROM 'rh' THEN
    PERFORM pg_temp.falha('E2 folha: fechar_folha/reabrir_folha não gravam no módulo rh');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.audit_logs a WHERE a.entity_type = 'folhas_pagamento' AND a.description LIKE 'Folha 7/2031 fechada%'
                    AND coalesce((to_jsonb(a) -> 'alvos') ? ('f:' || a.entity_id::text), false)) THEN
    PERFORM pg_temp.falha('E2 alvos: o fechamento da folha não entra no recorte f:<folha>');
  END IF;
  IF EXISTS (SELECT 1 FROM public.audit_logs WHERE module_name = 'folha') THEN
    PERFORM pg_temp.falha('E2 folha: ainda há linha nova com module_name folha');
  END IF;

  r := pg_temp.exec_como(u_admin, 'authenticated', format('UPDATE public.profiles SET servidor_id = NULL WHERE id = %L', u_fl));
  PERFORM pg_temp.nota('E2 (trilha do Storage do RH e índices da consulta): upload, troca, mover, exclusão, sem dado pessoal do caminho, origem sistema e leitura verificados');
END $$;

-- ---------------------------------------------------------------- RH: integridade de CNAB e eSocial (Onda E3) (TRIGGERS LIGADOS)
-- Migração 20261011010000_rh_cnab_esocial_integridade.sql (spec docs/superpowers/specs/2026-10-11-rh-vazamentos-arquivos-design.md):
--   * remessa e evento do eSocial recusados com folha aberta (RHE01), também ao trocar a folha do evento; a folha é
--     lida com FOR SHARE e reabrir_folha a trava com FOR UPDATE;
--   * número da remessa dado pelo banco: o do cliente é ignorado, segue o maior da conta (inclusive antigo), não
--     repete (índice único conta + número) e não muda depois; folha e conta também não (RHE02);
--   * valor total e quantidade calculados das fichas da folha (os do cliente ignorados) e fixos depois (RHE02);
--   * uma remessa ativa por folha e conta (23505; depois de cancelar, outra pode ser gerada); reabrir_folha recusa folha
--     com remessa ativa e tira da vigência os eventos rascunho (status erro), mantendo o transmitido;
--   * arquivo: caminho <id>.rem e sha256 juntos, uma vez, só com financeiro.folha.processar, só por quem gerou a
--     remessa e com o objeto enviado por ele ao bucket (42501/22023/P0002/RHE02);
--   * prévia do número só com o módulo rh (42501);
--   * cancelamento só por cancelar_remessa (motivo obrigatório, permissão, autor e data; RHE03 fora dela; cancelada
--     não muda mais; processada não se cancela); RPC só para authenticated;
--   * eSocial: mesmo evento da mesma folha e servidor não se repete (23505; 'erro' fica fora); 'enviado'/'aceito' sem
--     recibo recusado (23514); S-1200/S-1210/S-1299 sem folha e S-1200/S-1210 sem servidor recusados (23514); coluna
--     rascunho;
--   * bucket privado remessas-cnab: anon, módulo sem o código e servidor não leem nem enviam; quem processa a folha
--     envia só <id>.rem de remessa que ele gerou, 'gerada' há menos de 1 hora e sem arquivo; ninguém troca nem apaga
--     pela API; nenhuma outra policy de storage.objects vale para o bucket (inclusive por bucket_id <> outro);
--   * funções de trigger fora da API.
-- Colunas e funções novas lidas por to_jsonb(...) e SQL dinâmico: num banco anterior o bloco reprova sem abortar.
SET session_replication_role = replica;
DO $$
BEGIN
  -- folhas (aberta e fechadas), contas e uma remessa antiga (número 41 na conta 2), gravadas com os triggers desligados
  INSERT INTO public.folhas_pagamento (id, competencia_ano, competencia_mes, tipo_folha, status) VALUES
    ('e3000000-0000-0000-0000-0000000000f1', 2032, 1, 'mensal', 'aberta'),
    ('e3000000-0000-0000-0000-0000000000f2', 2032, 2, 'mensal', 'fechada'),
    ('e3000000-0000-0000-0000-0000000000f3', 2032, 3, 'mensal', 'fechada'),
    ('e3000000-0000-0000-0000-0000000000f4', 2032, 4, 'mensal', 'fechada'),
    ('e3000000-0000-0000-0000-0000000000f5', 2032, 5, 'mensal', 'fechada'),
    ('e3000000-0000-0000-0000-0000000000f6', 2032, 6, 'mensal', 'fechada');
  -- fichas da folha f2: duas com banco e líquido (entram na remessa) e, na f3, uma sem conta e uma com líquido zero
  PERFORM pg_temp.seed_row('fichas_financeiras', jsonb_build_object('folha_id', 'e3000000-0000-0000-0000-0000000000f2',
    'servidor_id', 'b0000000-0000-0000-0000-00000000000a', 'valor_liquido', 1000.10, 'banco_codigo', '001', 'banco_agencia', '1234', 'banco_conta', '1111-1'));
  PERFORM pg_temp.seed_row('fichas_financeiras', jsonb_build_object('folha_id', 'e3000000-0000-0000-0000-0000000000f2',
    'servidor_id', 'b0000000-0000-0000-0000-00000000000b', 'valor_liquido', 2000.20, 'banco_codigo', '104', 'banco_agencia', '4321', 'banco_conta', '2222-2'));
  PERFORM pg_temp.seed_row('fichas_financeiras', jsonb_build_object('folha_id', 'e3000000-0000-0000-0000-0000000000f3',
    'servidor_id', 'b0000000-0000-0000-0000-00000000000a', 'valor_liquido', 500, 'banco_codigo', '001', 'banco_agencia', '1234', 'banco_conta', ''));
  PERFORM pg_temp.seed_row('fichas_financeiras', jsonb_build_object('folha_id', 'e3000000-0000-0000-0000-0000000000f3',
    'servidor_id', 'b0000000-0000-0000-0000-00000000000b', 'valor_liquido', 0, 'banco_codigo', '104', 'banco_agencia', '4321', 'banco_conta', '2222-2'));
  -- eventos do eSocial da folha f6 (para reabrir): dois rascunhos e um transmitido
  INSERT INTO public.eventos_esocial (id, folha_id, servidor_id, tipo_evento, payload, status, recibo) VALUES
    ('e3000000-0000-0000-0000-0000000000e6', 'e3000000-0000-0000-0000-0000000000f6', 'b0000000-0000-0000-0000-00000000000a', 'S-1200', '{}', 'pendente', NULL),
    ('e3000000-0000-0000-0000-0000000000e7', 'e3000000-0000-0000-0000-0000000000f6', NULL, 'S-1299', '{}', 'validado', NULL),
    ('e3000000-0000-0000-0000-0000000000e8', 'e3000000-0000-0000-0000-0000000000f6', 'b0000000-0000-0000-0000-00000000000b', 'S-1200', '{}', 'aceito', '1.2.000000000000000009');
  PERFORM pg_temp.seed_row('contas_autarquia', jsonb_build_object('id', 'e3000000-0000-0000-0000-0000000000c1'));
  PERFORM pg_temp.seed_row('contas_autarquia', jsonb_build_object('id', 'e3000000-0000-0000-0000-0000000000c2'));
  PERFORM pg_temp.seed_row('contas_autarquia', jsonb_build_object('id', 'e3000000-0000-0000-0000-0000000000c3', 'nsa_inicial', 1200));
  PERFORM pg_temp.seed_row('remessas_bancarias', jsonb_build_object('id', 'e3000000-0000-0000-0000-0000000000a0',
    'folha_id', 'e3000000-0000-0000-0000-0000000000f2', 'conta_autarquia_id', 'e3000000-0000-0000-0000-0000000000c2',
    'numero_remessa', 41, 'nome_arquivo', 'antiga.rem'));
END $$;
SET session_replication_role = origin;
DO $$
DECLARE
  u_admin uuid := (SELECT uid FROM persona WHERE nome='admin');
  u_nenhum uuid := (SELECT uid FROM persona WHERE nome='nenhum');
  u_a uuid := (SELECT uid FROM persona WHERE nome='srv_a');
  u_rh uuid := (SELECT uid FROM persona WHERE nome='mod_rh');
  u_lanc uuid := (SELECT uid FROM persona WHERE nome='perm_rh.frequencia.lancar');                          -- módulo rh, sem permissão
  u_proc uuid := (SELECT uid FROM persona WHERE nome='perm_financeiro.folha.processar');
  u_anon uuid := '00000000-0000-0000-0000-000000000000';
  sa uuid := 'b0000000-0000-0000-0000-00000000000a';
  sb uuid := 'b0000000-0000-0000-0000-00000000000b';
  fa uuid := 'e3000000-0000-0000-0000-0000000000f1';   -- folha aberta
  ff uuid := 'e3000000-0000-0000-0000-0000000000f2';   -- folha fechada
  ff2 uuid := 'e3000000-0000-0000-0000-0000000000f3';  -- outra folha fechada
  ff3 uuid := 'e3000000-0000-0000-0000-0000000000f4';
  ff4 uuid := 'e3000000-0000-0000-0000-0000000000f5';
  fr uuid := 'e3000000-0000-0000-0000-0000000000f6';   -- folha fechada a reabrir (só eventos do eSocial)
  c1 uuid := 'e3000000-0000-0000-0000-0000000000c1';
  c2 uuid := 'e3000000-0000-0000-0000-0000000000c2';
  rm1 uuid := 'e3000000-0000-0000-0000-0000000000a1';
  rm2 uuid := 'e3000000-0000-0000-0000-0000000000a2';
  rm3 uuid := 'e3000000-0000-0000-0000-0000000000a3';
  rm4 uuid := 'e3000000-0000-0000-0000-0000000000a4';
  rm5 uuid := 'e3000000-0000-0000-0000-0000000000a5';
  ev1 uuid := 'e3000000-0000-0000-0000-0000000000e1';
  hash1 text := repeat('ab', 32);
  -- o cliente manda valor 1 e 99 registros: o banco ignora e calcula das fichas
  ins_rem text := 'INSERT INTO public.remessas_bancarias (id, folha_id, conta_autarquia_id, numero_remessa, nome_arquivo, status, valor_total, quantidade_registros) VALUES (%L, %L, %L, %s, ''teste.rem'', %L, 1, 99) RETURNING numero_remessa::text';
  tem_bucket boolean := EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'remessas-cnab');
  ins_ev text := 'INSERT INTO public.eventos_esocial (id, folha_id, servidor_id, tipo_evento, payload, status) VALUES (%L, %L, %L, %L, ''{}'', %L)';
  r text; n int; j jsonb; f text;
BEGIN
  PERFORM set_config('request.jwt.claims', '', true);
  PERFORM set_config('request.headers', '', true);
  IF u_proc IS NULL THEN RAISE EXCEPTION 'falta a persona perm_financeiro.folha.processar (mapa.csv)'; END IF;

  -- ===== folha fechada (RHE01)
  r := pg_temp.sql_como(u_proc, 'authenticated', format(ins_rem, gen_random_uuid(), fa, c1, 999, 'gerada'));
  IF r NOT LIKE 'erro:RHE01:%' THEN PERFORM pg_temp.falha('E3 CNAB: remessa de folha ABERTA aceita (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_admin, 'authenticated', format(ins_rem, gen_random_uuid(), fa, c1, 999, 'gerada'));
  IF r NOT LIKE 'erro:RHE01:%' THEN PERFORM pg_temp.falha('E3 CNAB: admin gera remessa de folha ABERTA (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_proc, 'authenticated', format(ins_ev, gen_random_uuid(), fa, sa, 'S-1200', 'pendente'));
  IF r NOT LIKE 'erro:RHE01:%' THEN PERFORM pg_temp.falha('E3 eSocial: evento de folha ABERTA aceito (' || r || ')'); END IF;

  -- ===== número da remessa: o do cliente é ignorado; segue o maior da conta; não muda depois
  r := pg_temp.valor_como(u_proc, 'authenticated', format(ins_rem, rm1, ff, c1, 999, 'gerada'));
  IF r IS DISTINCT FROM '1' THEN PERFORM pg_temp.falha('E3 CNAB: número do cliente não foi ignorado na 1ª remessa da conta (esperado 1, veio ' || coalesce(r, 'nulo') || ')'); END IF;
  r := pg_temp.valor_como(u_proc, 'authenticated', format(ins_rem, rm2, ff2, c1, 1, 'gerada'));
  IF r IS DISTINCT FROM '2' THEN PERFORM pg_temp.falha('E3 CNAB: 2ª remessa da conta repetiu ou não seguiu o número (esperado 2, veio ' || coalesce(r, 'nulo') || ')'); END IF;
  r := pg_temp.valor_como(u_proc, 'authenticated', format(ins_rem, rm3, ff2, c2, 1, 'gerada'));
  IF r IS DISTINCT FROM '42' THEN PERFORM pg_temp.falha('E3 CNAB: numeração da conta 2 não seguiu a remessa antiga 41 (veio ' || coalesce(r, 'nulo') || ')'); END IF;
  r := pg_temp.valor_como(u_admin, 'authenticated', format(ins_rem, rm4, ff3, c1, 2, 'gerada'));
  IF r IS DISTINCT FROM '3' THEN PERFORM pg_temp.falha('E3 CNAB: 3ª remessa da conta 1 (admin) não veio 3 (' || coalesce(r, 'nulo') || ')'); END IF;
  r := pg_temp.valor_como(u_proc, 'authenticated', format(ins_rem, rm5, ff4, c1, 1, 'gerada'));
  IF r IS DISTINCT FROM '4' THEN PERFORM pg_temp.falha('E3 CNAB: 4ª remessa da conta 1 não veio 4 (' || coalesce(r, 'nulo') || ')'); END IF;
  -- número inicial da conta (continua a sequência do sistema anterior)
  r := pg_temp.valor_como(u_rh, 'authenticated', 'SELECT public.get_proximo_numero_remessa(''e3000000-0000-0000-0000-0000000000c3'', 2032)::text');
  IF r IS DISTINCT FROM '1200' THEN PERFORM pg_temp.falha('E3 CNAB: prévia do número não respeitou o NSA inicial 1200 (' || coalesce(r, 'nulo') || ')'); END IF;
  r := pg_temp.valor_como(u_proc, 'authenticated', format(ins_rem, gen_random_uuid(), ff, 'e3000000-0000-0000-0000-0000000000c3', 1, 'gerada'));
  IF r IS DISTINCT FROM '1200' THEN PERFORM pg_temp.falha('E3 CNAB: 1ª remessa da conta com NSA inicial 1200 não veio 1200 (' || coalesce(r, 'nulo') || ')'); END IF;
  -- valor e quantidade calculados das fichas (f2: 1000,10 + 2000,20; f3: nenhuma ficha com conta e líquido)
  SELECT to_jsonb(x) INTO j FROM public.remessas_bancarias x WHERE id = rm1;
  IF (j ->> 'valor_total')::numeric IS DISTINCT FROM 3000.30 OR (j ->> 'quantidade_registros')::int IS DISTINCT FROM 2 THEN
    PERFORM pg_temp.falha('E3 CNAB: valor/quantidade da remessa vieram do cliente ou não seguem as fichas (' || coalesce(j ->> 'valor_total', 'nulo') || ' / ' || coalesce(j ->> 'quantidade_registros', 'nulo') || ', esperado 3000.30 / 2)');
  END IF;
  SELECT to_jsonb(x) INTO j FROM public.remessas_bancarias x WHERE id = rm2;
  IF (j ->> 'valor_total')::numeric IS DISTINCT FROM 0 OR (j ->> 'quantidade_registros')::int IS DISTINCT FROM 0 THEN
    PERFORM pg_temp.falha('E3 CNAB: ficha sem conta ou com líquido zero entrou na remessa (' || coalesce(j ->> 'valor_total', 'nulo') || ' / ' || coalesce(j ->> 'quantidade_registros', 'nulo') || ')');
  END IF;
  -- uma remessa ativa por folha e conta
  r := pg_temp.sql_como(u_proc, 'authenticated', format(ins_rem, gen_random_uuid(), ff, c1, 1, 'gerada'));
  IF r NOT LIKE 'erro:23505:%' THEN PERFORM pg_temp.falha('E3 CNAB: segunda remessa ativa da mesma folha e conta aceita (' || r || ')'); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_index i WHERE i.indexrelid = to_regclass('public.remessas_bancarias_folha_conta_ativa_uidx') AND i.indisunique
                    AND pg_get_indexdef(i.indexrelid) LIKE '%(folha_id, conta_autarquia_id, tipo_credito) WHERE ((status)::text <> ''cancelada''::text)') THEN
    PERFORM pg_temp.falha('E3 CNAB: falta o índice único remessas_bancarias_folha_conta_ativa_uidx (folha, conta, tipo, ativa)');
  END IF;
  -- remessa de pensão alimentícia (migração 20261020090000): na conta 3, ao lado da de servidores da mesma folha; o banco
  -- soma os descontos de pensão cujo beneficiário tem conta
  SET LOCAL session_replication_role = replica;
  INSERT INTO public.pensoes_alimenticias (servidor_id, beneficiario_nome, beneficiario_cpf, tipo_calculo, valor_fixo, data_inicio,
                                           banco_codigo, banco_agencia, banco_conta)
    VALUES (sa, 'Beneficiaria E3', '00000000191', 'valor_fixo', 300.25, '2030-01-01', '237', '1234', '5678-9'),
           (sa, 'Sem Conta E3', NULL, 'valor_fixo', 50, '2030-01-01', NULL, NULL, NULL);
  INSERT INTO public.itens_ficha_financeira (ficha_id, descricao, tipo, valor)
    SELECT f.id, x.d, 'desconto', x.v FROM public.fichas_financeiras f,
           (VALUES ('Pensão alimentícia — Beneficiaria E3', 300.25), ('Pensão alimentícia — Sem Conta E3', 50.00)) x(d, v)
     WHERE f.folha_id = ff AND f.servidor_id = sa;
  SET LOCAL session_replication_role = origin;
  r := pg_temp.valor_como(u_proc, 'authenticated', format(
         'INSERT INTO public.remessas_bancarias (folha_id, conta_autarquia_id, numero_remessa, nome_arquivo, status, tipo_credito, valor_total, quantidade_registros) '
         || 'VALUES (%L, %L, 1, ''pensao.rem'', ''gerada'', ''pensao'', 1, 99) RETURNING valor_total::text || ''/'' || quantidade_registros', ff, 'e3000000-0000-0000-0000-0000000000c3'));
  IF r IS DISTINCT FROM '300.25/1' THEN
    PERFORM pg_temp.falha('E3 CNAB: remessa de pensão não somou só a pensão com conta (esperado 300.25/1, veio ' || coalesce(r, 'nulo') || ')');
  END IF;
  r := pg_temp.sql_como(u_proc, 'authenticated', format(
         'INSERT INTO public.remessas_bancarias (folha_id, conta_autarquia_id, numero_remessa, nome_arquivo, status, tipo_credito) VALUES (%L, %L, 1, ''p2.rem'', ''gerada'', ''pensao'')', ff, 'e3000000-0000-0000-0000-0000000000c3'));
  IF r NOT LIKE 'erro:23505:%' THEN PERFORM pg_temp.falha('E3 CNAB: segunda remessa de pensão ativa da mesma folha e conta aceita (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_proc, 'authenticated', format('UPDATE public.remessas_bancarias SET tipo_credito = ''pensao'' WHERE id = %L', rm1));
  IF r NOT LIKE 'erro:RHE02:%' THEN PERFORM pg_temp.falha('E3 CNAB: tipo da remessa mudou depois de gerada (' || r || ')'); END IF;
  -- prévia do número: só com o módulo rh
  r := pg_temp.valor_como(u_nenhum, 'authenticated', format('SELECT public.get_proximo_numero_remessa(%L, 2032)::text', c1));
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('E3 CNAB: get_proximo_numero_remessa sem o módulo rh (' || coalesce(r, 'nulo') || ')'); END IF;
  r := pg_temp.valor_como(u_rh, 'authenticated', format('SELECT public.get_proximo_numero_remessa(%L, 2032)::text', c1));
  IF r IS DISTINCT FROM '5' THEN PERFORM pg_temp.falha('E3 CNAB: get_proximo_numero_remessa com o módulo rh não deu 5 (' || coalesce(r, 'nulo') || ')'); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_index i WHERE i.indexrelid = to_regclass('public.remessas_bancarias_conta_numero_uidx') AND i.indisunique
                    AND pg_get_indexdef(i.indexrelid) LIKE '%(conta_autarquia_id, numero_remessa)') THEN
    PERFORM pg_temp.falha('E3 CNAB: falta o índice único remessas_bancarias_conta_numero_uidx (conta, número)');
  END IF;
  -- mesmo com os triggers desligados (carga direta), o índice barra o número repetido
  PERFORM set_config('session_replication_role', 'replica', true);
  BEGIN
    INSERT INTO public.remessas_bancarias (folha_id, conta_autarquia_id, numero_remessa, nome_arquivo) VALUES (ff, c1, 1, 'dup.rem');
    PERFORM pg_temp.falha('E3 CNAB: número repetido na mesma conta aceito com os triggers desligados');
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  PERFORM set_config('session_replication_role', 'origin', true);
  FOREACH f IN ARRAY ARRAY['numero_remessa = 7', format('folha_id = %L', ff), format('conta_autarquia_id = %L', c2),
                           'valor_total = 5', 'quantidade_registros = 5'] LOOP
    r := pg_temp.sql_como(u_proc, 'authenticated', format('UPDATE public.remessas_bancarias SET %s WHERE id = %L', f, rm2));
    IF r NOT LIKE 'erro:RHE02:%' THEN PERFORM pg_temp.falha('E3 CNAB: UPDATE ' || f || ' na remessa gerada passou (' || r || ')'); END IF;
  END LOOP;

  -- ===== arquivo: caminho e sha256 juntos, uma vez, com financeiro.folha.processar
  r := pg_temp.sql_como(u_rh, 'authenticated', format('UPDATE public.remessas_bancarias SET arquivo_path = %L, arquivo_sha256 = %L WHERE id = %L', rm1 || '.rem', hash1, rm1));
  -- sem a 20261011010100 o trigger recusa (42501); com ela a RLS de UPDATE já esconde a linha (0 linhas)
  IF r NOT LIKE 'erro:42501:%' AND r <> 'ok:0' THEN PERFORM pg_temp.falha('E3 CNAB: módulo rh SEM financeiro.folha.processar grava o arquivo (' || r || ')'); END IF;
  FOREACH f IN ARRAY ARRAY[format('arquivo_path = %L, arquivo_sha256 = %L', 'outro.rem', hash1),
                           format('arquivo_sha256 = %L', hash1),
                           format('arquivo_path = %L, arquivo_sha256 = %L', rm1 || '.rem', upper(hash1)),
                           format('arquivo_path = %L, arquivo_sha256 = %L', rm1 || '.rem', 'abc')] LOOP
    r := pg_temp.sql_como(u_proc, 'authenticated', format('UPDATE public.remessas_bancarias SET %s WHERE id = %L', f, rm1));
    IF r NOT LIKE 'erro:22023:%' THEN PERFORM pg_temp.falha('E3 CNAB: arquivo inválido aceito (' || f || ': ' || r || ')'); END IF;
  END LOOP;
  -- o objeto tem que estar no bucket, enviado por quem grava; a remessa, gerada por quem grava
  r := pg_temp.sql_como(u_proc, 'authenticated', format('UPDATE public.remessas_bancarias SET arquivo_path = %L, arquivo_sha256 = %L WHERE id = %L', rm1 || '.rem', hash1, rm1));
  IF r NOT LIKE 'erro:P0002:%' THEN PERFORM pg_temp.falha('E3 CNAB: arquivo_path gravado sem o objeto no bucket (' || r || ')'); END IF;
  IF tem_bucket THEN
    INSERT INTO storage.objects (bucket_id, name, owner_id) VALUES ('remessas-cnab', rm1 || '.rem', u_admin::text);
    r := pg_temp.sql_como(u_proc, 'authenticated', format('UPDATE public.remessas_bancarias SET arquivo_path = %L, arquivo_sha256 = %L WHERE id = %L', rm1 || '.rem', hash1, rm1));
    IF r NOT LIKE 'erro:P0002:%' THEN PERFORM pg_temp.falha('E3 CNAB: arquivo_path gravado com objeto enviado por outro usuário (' || r || ')'); END IF;
    UPDATE storage.objects SET owner_id = u_proc::text WHERE bucket_id = 'remessas-cnab' AND name = rm1 || '.rem';
    INSERT INTO storage.objects (bucket_id, name, owner_id) VALUES ('remessas-cnab', rm4 || '.rem', u_proc::text);
  END IF;
  r := pg_temp.sql_como(u_proc, 'authenticated', format('UPDATE public.remessas_bancarias SET arquivo_path = %L, arquivo_sha256 = %L WHERE id = %L', rm4 || '.rem', hash1, rm4));
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('E3 CNAB: arquivo gravado em remessa gerada por outro (' || r || ')'); END IF;
  IF tem_bucket THEN DELETE FROM storage.objects WHERE bucket_id = 'remessas-cnab' AND name = rm4 || '.rem'; END IF;
  r := pg_temp.sql_como(u_proc, 'authenticated', format('INSERT INTO public.remessas_bancarias (folha_id, conta_autarquia_id, nome_arquivo, arquivo_path, arquivo_sha256) VALUES (%L, %L, ''x.rem'', ''x.rem'', %L)', ff, c2, hash1));
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('E3 CNAB: arquivo gravado já no INSERT (' || r || ')'); END IF;
  r := pg_temp.exec_como(u_proc, 'authenticated', format('UPDATE public.remessas_bancarias SET arquivo_path = %L, arquivo_sha256 = %L WHERE id = %L', rm1 || '.rem', hash1, rm1));
  SELECT to_jsonb(x) INTO j FROM public.remessas_bancarias x WHERE id = rm1;
  IF r <> 'ok' OR j ->> 'arquivo_path' IS DISTINCT FROM rm1 || '.rem' OR j ->> 'arquivo_sha256' IS DISTINCT FROM hash1 THEN
    PERFORM pg_temp.falha('E3 CNAB: quem processa a folha não grava o arquivo da remessa (' || r || ')');
  END IF;
  FOREACH f IN ARRAY ARRAY[format('arquivo_sha256 = %L', repeat('cd', 32)), 'arquivo_path = NULL, arquivo_sha256 = NULL',
                           format('arquivo_path = %L', rm2 || '.rem')] LOOP
    r := pg_temp.sql_como(u_proc, 'authenticated', format('UPDATE public.remessas_bancarias SET %s WHERE id = %L', f, rm1));
    IF r NOT LIKE 'erro:RHE02:%' THEN PERFORM pg_temp.falha('E3 CNAB: arquivo já gravado mudou (' || f || ': ' || r || ')'); END IF;
    r := pg_temp.sql_como(u_admin, 'authenticated', format('UPDATE public.remessas_bancarias SET %s WHERE id = %L', f, rm1));
    IF r NOT LIKE 'erro:RHE02:%' THEN PERFORM pg_temp.falha('E3 CNAB: admin muda o arquivo já gravado (' || f || ': ' || r || ')'); END IF;
  END LOOP;

  -- ===== cancelamento só pela RPC
  r := pg_temp.sql_como(u_proc, 'authenticated', format(ins_rem, gen_random_uuid(), ff, c1, 9, 'cancelada'));
  IF r NOT LIKE 'erro:RHE03:%' THEN PERFORM pg_temp.falha('E3 CNAB: remessa nasce cancelada pelo INSERT (' || r || ')'); END IF;
  FOREACH f IN ARRAY ARRAY['status = ''cancelada''', 'motivo_cancelamento = ''sem RPC''', 'cancelada_em = now()'] LOOP
    r := pg_temp.sql_como(u_admin, 'authenticated', format('UPDATE public.remessas_bancarias SET %s WHERE id = %L', f, rm2));
    IF r NOT LIKE 'erro:RHE03:%' THEN PERFORM pg_temp.falha('E3 CNAB: cancelamento fora da RPC (' || f || ': ' || r || ')'); END IF;
  END LOOP;
  r := pg_temp.sql_como(u_rh, 'authenticated', format('SELECT public.cancelar_remessa(%L, %L)', rm2, 'motivo de teste'));
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('E3 CNAB: cancelar_remessa sem financeiro.folha.processar (' || r || ')'); END IF;
  FOREACH f IN ARRAY ARRAY['', '   ', 'abc'] LOOP
    r := pg_temp.sql_como(u_proc, 'authenticated', format('SELECT public.cancelar_remessa(%L, %L)', rm2, f));
    IF r NOT LIKE 'erro:22023:%' THEN PERFORM pg_temp.falha('E3 CNAB: cancelar_remessa sem motivo (' || quote_literal(f) || ': ' || r || ')'); END IF;
  END LOOP;
  r := pg_temp.sql_como(u_proc, 'authenticated', format('SELECT public.cancelar_remessa(NULL, %L)', 'motivo de teste'));
  IF r NOT LIKE 'erro:22023:%' AND r NOT LIKE 'erro:P0002:%' THEN PERFORM pg_temp.falha('E3 CNAB: cancelar_remessa de remessa inexistente (' || r || ')'); END IF;
  r := pg_temp.valor_como(u_proc, 'authenticated', format('SELECT status FROM public.cancelar_remessa(%L, %L)', rm2, '  arquivo gerado com a conta errada  '));
  SELECT to_jsonb(x) INTO j FROM public.remessas_bancarias x WHERE id = rm2;
  IF r IS DISTINCT FROM 'cancelada' OR j ->> 'status' IS DISTINCT FROM 'cancelada' OR j ->> 'cancelada_por' IS DISTINCT FROM u_proc::text
     OR j ->> 'cancelada_em' IS NULL OR j ->> 'motivo_cancelamento' IS DISTINCT FROM 'arquivo gerado com a conta errada'
     OR j ->> 'updated_by' IS DISTINCT FROM u_proc::text THEN
    PERFORM pg_temp.falha('E3 CNAB: cancelar_remessa não gravou status, autor, data e motivo (' || coalesce(r, 'nulo') || ')');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.audit_logs a WHERE a.entity_type = 'remessas_bancarias' AND a.entity_id = rm2 AND a.action = 'update'
                    AND a.module_name = 'rh' AND a.user_id = u_proc AND 'status' = ANY (a.campos_alterados)) THEN
    PERFORM pg_temp.falha('E3 CNAB: cancelamento sem linha na trilha (audit_logs)');
  END IF;
  r := pg_temp.sql_como(u_proc, 'authenticated', format('SELECT public.cancelar_remessa(%L, %L)', rm2, 'de novo, outro motivo'));
  IF r NOT LIKE 'erro:RHE03:%' THEN PERFORM pg_temp.falha('E3 CNAB: remessa cancelada duas vezes (' || r || ')'); END IF;
  FOREACH f IN ARRAY ARRAY['observacoes = ''depois''', 'status = ''gerada''', 'motivo_cancelamento = ''outro'''] LOOP
    r := pg_temp.sql_como(u_admin, 'authenticated', format('UPDATE public.remessas_bancarias SET %s WHERE id = %L', f, rm2));
    IF r NOT LIKE 'erro:RHE02:%' THEN PERFORM pg_temp.falha('E3 CNAB: remessa cancelada mudou (' || f || ': ' || r || ')'); END IF;
  END LOOP;
  r := pg_temp.exec_como(u_proc, 'authenticated', format('UPDATE public.remessas_bancarias SET status = ''processada'' WHERE id = %L', rm3));
  r := r || '/' || pg_temp.sql_como(u_proc, 'authenticated', format('SELECT public.cancelar_remessa(%L, %L)', rm3, 'motivo de teste'));
  IF r NOT LIKE 'ok/erro:RHE03:%' THEN PERFORM pg_temp.falha('E3 CNAB: remessa processada cancelada (' || r || ')'); END IF;
  -- cancelada sai do índice da remessa ativa: a folha e a conta da rm2 aceitam outra remessa
  r := pg_temp.sql_como(u_proc, 'authenticated', format(ins_rem, gen_random_uuid(), ff2, c1, 1, 'gerada'));
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('E3 CNAB: depois de cancelar, outra remessa da mesma folha e conta recusada (' || r || ')'); END IF;

  -- ===== reabrir_folha: recusa com remessa ativa; tira da vigência os eventos rascunho (o transmitido fica)
  r := pg_temp.valor_como(u_admin, 'authenticated', format('SELECT public.reabrir_folha(%L, %L)::text', ff, 'teste E3'));
  IF r IS NULL OR r NOT LIKE '%"success": false%' OR r NOT LIKE '%remessa bancária ativa%' THEN
    PERFORM pg_temp.falha('E3 reabrir: folha com remessa ativa reaberta ou sem a mensagem de cancelar antes (' || coalesce(r, 'nulo') || ')');
  END IF;
  IF (SELECT status::text FROM public.folhas_pagamento WHERE id = ff) <> 'fechada' THEN
    PERFORM pg_temp.falha('E3 reabrir: a folha com remessa ativa mudou de status');
  END IF;
  r := pg_temp.exec_como(u_admin, 'authenticated', format('SELECT public.reabrir_folha(%L, %L)', fr, 'teste E3'));
  IF r <> 'ok' OR (SELECT status::text FROM public.folhas_pagamento WHERE id = fr) <> 'reaberta' THEN
    PERFORM pg_temp.falha('E3 reabrir: folha sem remessa ativa não reabriu (' || r || ')');
  END IF;
  IF (SELECT count(*) FROM public.eventos_esocial WHERE folha_id = fr AND status::text = 'erro' AND mensagem_retorno LIKE 'Folha reaberta%'
         AND id IN ('e3000000-0000-0000-0000-0000000000e6', 'e3000000-0000-0000-0000-0000000000e7')) <> 2 THEN
    PERFORM pg_temp.falha('E3 reabrir: eventos rascunho da folha reaberta não saíram da vigência (status erro, "Folha reaberta")');
  END IF;
  IF (SELECT status::text FROM public.eventos_esocial WHERE id = 'e3000000-0000-0000-0000-0000000000e8') <> 'aceito' THEN
    PERFORM pg_temp.falha('E3 reabrir: evento transmitido (com recibo) mudou ao reabrir a folha');
  END IF;
  r := pg_temp.sql_como(u_proc, 'authenticated', format(ins_ev, gen_random_uuid(), fr, sa, 'S-1200', 'pendente'));
  IF r NOT LIKE 'erro:RHE01:%' THEN PERFORM pg_temp.falha('E3 reabrir: evento gerado na folha reaberta (' || r || ')'); END IF;
  IF (SELECT prosrc FROM pg_proc WHERE oid = to_regprocedure('public.exigir_folha_fechada()')) !~ 'FOR SHARE'
     OR (SELECT prosrc FROM pg_proc WHERE oid = to_regprocedure('public.reabrir_folha(uuid,text)')) !~ 'FOR UPDATE' THEN
    PERFORM pg_temp.falha('E3: exigir_folha_fechada sem FOR SHARE ou reabrir_folha sem FOR UPDATE na folha (corrida geração × reabertura)');
  END IF;
  IF to_regprocedure('public.cancelar_remessa(uuid,text)') IS NULL THEN
    PERFORM pg_temp.falha('E3 CNAB: função cancelar_remessa(uuid, text) não existe');
  ELSE
    IF has_function_privilege('anon', 'public.cancelar_remessa(uuid,text)', 'EXECUTE') OR NOT has_function_privilege('authenticated', 'public.cancelar_remessa(uuid,text)', 'EXECUTE') THEN
      PERFORM pg_temp.falha('E3 CNAB: cancelar_remessa deve ser executável só por authenticated (não anon)');
    END IF;
    IF NOT (SELECT prosecdef AND coalesce(proconfig::text, '') ~ 'search_path' FROM pg_proc WHERE oid = to_regprocedure('public.cancelar_remessa(uuid,text)')) THEN
      PERFORM pg_temp.falha('E3 CNAB: cancelar_remessa sem SECURITY DEFINER ou sem search_path fixo');
    END IF;
  END IF;

  -- ===== eSocial: sem repetição na mesma folha e servidor; 'erro' fica fora; folha do evento não vira aberta
  r := pg_temp.exec_como(u_proc, 'authenticated', format(ins_ev, ev1, ff, sa, 'S-1200', 'pendente'));
  IF r <> 'ok' THEN PERFORM pg_temp.falha('E3 eSocial: evento de folha fechada recusado (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_proc, 'authenticated', format(ins_ev, gen_random_uuid(), ff, sa, 'S-1200', 'pendente'));
  IF r NOT LIKE 'erro:23505:%' THEN PERFORM pg_temp.falha('E3 eSocial: S-1200 repetido para o mesmo servidor e folha (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_proc, 'authenticated', format(ins_ev, gen_random_uuid(), ff, sb, 'S-1200', 'pendente'));
  IF r NOT LIKE 'ok:1' THEN PERFORM pg_temp.falha('E3 eSocial: S-1200 de outro servidor na mesma folha recusado (' || r || ')'); END IF;
  r := pg_temp.exec_como(u_proc, 'authenticated', format(ins_ev, gen_random_uuid(), ff, NULL, 'S-1299', 'pendente'));
  r := r || '/' || pg_temp.sql_como(u_proc, 'authenticated', format(ins_ev, gen_random_uuid(), ff, NULL, 'S-1299', 'pendente'));
  IF r NOT LIKE 'ok/erro:23505:%' THEN PERFORM pg_temp.falha('E3 eSocial: S-1299 (sem servidor) repetido na mesma folha (' || r || ')'); END IF;
  r := pg_temp.exec_como(u_proc, 'authenticated', format(ins_ev, gen_random_uuid(), ff, sa, 'S-1200', 'erro'));
  r := r || '/' || pg_temp.exec_como(u_proc, 'authenticated', format(ins_ev, gen_random_uuid(), ff, sa, 'S-1200', 'erro'));
  IF r <> 'ok/ok' THEN PERFORM pg_temp.falha('E3 eSocial: evento com erro de validação não pode ser gerado de novo (' || r || ')'); END IF;
  -- evento periódico exige folha (e servidor, no S-1200/S-1210); não periódico não; 'erro' fica fora
  FOR f, r IN SELECT * FROM (VALUES ('S-1200 sem folha', format(ins_ev, gen_random_uuid(), NULL, sa, 'S-1200', 'pendente')),
                                    ('S-1299 sem folha', format(ins_ev, gen_random_uuid(), NULL, NULL, 'S-1299', 'pendente')),
                                    ('S-1210 sem servidor', format(ins_ev, gen_random_uuid(), ff, NULL, 'S-1210', 'pendente'))) AS v(q, cmd) LOOP
    r := pg_temp.sql_como(u_proc, 'authenticated', r);
    IF r NOT LIKE 'erro:23514:%' THEN PERFORM pg_temp.falha('E3 eSocial: ' || f || ' aceito (' || r || ')'); END IF;
  END LOOP;
  r := pg_temp.sql_como(u_proc, 'authenticated', format(ins_ev, gen_random_uuid(), NULL, sa, 'S-2200', 'pendente'));
  r := r || '/' || pg_temp.sql_como(u_proc, 'authenticated', format(ins_ev, gen_random_uuid(), NULL, NULL, 'S-1200', 'erro'));
  IF r <> 'ok:1/ok:1' THEN PERFORM pg_temp.falha('E3 eSocial: evento não periódico sem folha ou periódico em erro recusado (' || r || ')'); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.eventos_esocial'::regclass
                    AND conname = 'eventos_esocial_periodico_com_folha_check' AND convalidated) THEN
    PERFORM pg_temp.falha('E3 eSocial: CHECK eventos_esocial_periodico_com_folha_check ausente ou não validado');
  END IF;
  r := pg_temp.sql_como(u_proc, 'authenticated', format('UPDATE public.eventos_esocial SET folha_id = %L WHERE id = %L', fa, ev1));
  IF r NOT LIKE 'erro:RHE01:%' THEN PERFORM pg_temp.falha('E3 eSocial: evento passou para folha ABERTA por UPDATE (' || r || ')'); END IF;
  -- transmitido só com recibo; rascunho = sem recibo
  IF (SELECT to_jsonb(e) ->> 'rascunho' FROM public.eventos_esocial e WHERE id = ev1) IS DISTINCT FROM 'true' THEN
    PERFORM pg_temp.falha('E3 eSocial: evento novo não está marcado como rascunho (coluna rascunho)');
  END IF;
  FOREACH f IN ARRAY ARRAY['enviado', 'aceito'] LOOP
    r := pg_temp.sql_como(u_admin, 'authenticated', format('UPDATE public.eventos_esocial SET status = %L WHERE id = %L', f, ev1));
    IF r NOT LIKE 'erro:23514:%' THEN PERFORM pg_temp.falha('E3 eSocial: evento ' || f || ' sem recibo (' || r || ')'); END IF;
  END LOOP;
  r := pg_temp.exec_como(u_admin, 'authenticated', format('UPDATE public.eventos_esocial SET status = ''enviado'', recibo = ''1.2.000000000000000001'' WHERE id = %L', ev1));
  IF r <> 'ok' OR (SELECT to_jsonb(e) ->> 'rascunho' FROM public.eventos_esocial e WHERE id = ev1) IS DISTINCT FROM 'false' THEN
    PERFORM pg_temp.falha('E3 eSocial: evento com recibo não sai do rascunho (' || r || ')');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_index i WHERE i.indexrelid = to_regclass('public.eventos_esocial_folha_evento_servidor_uidx') AND i.indisunique) THEN
    PERFORM pg_temp.falha('E3 eSocial: falta o índice único eventos_esocial_folha_evento_servidor_uidx');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.eventos_esocial'::regclass
                    AND conname = 'eventos_esocial_transmitido_com_recibo_check' AND convalidated) THEN
    PERFORM pg_temp.falha('E3 eSocial: CHECK eventos_esocial_transmitido_com_recibo_check ausente ou não validado');
  END IF;

  -- ===== bucket privado remessas-cnab
  IF (SELECT NOT public AND file_size_limit = 10485760 FROM storage.buckets WHERE id = 'remessas-cnab') IS NOT TRUE THEN
    PERFORM pg_temp.falha('storage remessas-cnab: bucket ausente, público ou sem o limite de 10 MB');
  END IF;
  -- o objeto da rm1 (gravado acima, com dono) é o que se lê
  FOR f, n IN SELECT * FROM (VALUES ('admin', 1), ('perm_financeiro.folha.processar', 1), ('mod_rh', 0), ('nenhum', 0), ('srv_a', 0),
                                    ('mod_financeiro', 0), ('perm_avulsa_financeiro.folha.processar', 0), ('admin_inativo', 0)) AS v(p, esperado) LOOP
    IF pg_temp.sel_obj((SELECT uid FROM persona WHERE nome = f), 'authenticated', 'remessas-cnab') <> n THEN
      PERFORM pg_temp.falha('storage remessas-cnab: ' || f || ' lê ' || CASE n WHEN 1 THEN 'nada (deveria ler)' ELSE 'o arquivo (não deveria)' END);
    END IF;
  END LOOP;
  IF pg_temp.sel_obj(u_anon, 'anon', 'remessas-cnab') > 0 THEN PERFORM pg_temp.falha('storage remessas-cnab: anon lê'); END IF;
  -- enviar: só <id>.rem de remessa que o próprio usuário gerou, 'gerada' há menos de 1 hora e sem arquivo, com o
  -- módulo E o código (rm5 é de quem processa; rm4, do admin)
  IF pg_temp.ins_obj(u_proc, 'authenticated', 'remessas-cnab', rm5 || '.rem') <> 'passou' THEN PERFORM pg_temp.falha('storage remessas-cnab: quem processa a folha não envia o arquivo da remessa que gerou'); END IF;
  IF pg_temp.ins_obj(u_admin, 'authenticated', 'remessas-cnab', rm4 || '.rem') <> 'passou' THEN PERFORM pg_temp.falha('storage remessas-cnab: admin não envia o arquivo da remessa que gerou'); END IF;
  IF pg_temp.ins_obj(u_admin, 'authenticated', 'remessas-cnab', rm5 || '.rem') <> 'negado' THEN PERFORM pg_temp.falha('storage remessas-cnab: admin envia o arquivo de remessa gerada por outro'); END IF;
  IF pg_temp.ins_obj(u_proc, 'authenticated', 'remessas-cnab', rm4 || '.rem') <> 'negado' THEN PERFORM pg_temp.falha('storage remessas-cnab: quem processa envia o arquivo de remessa gerada por outro'); END IF;
  IF pg_temp.ins_obj(u_proc, 'authenticated', 'remessas-cnab', rm3 || '.rem') <> 'negado' THEN PERFORM pg_temp.falha('storage remessas-cnab: envio para remessa que não está gerada (processada)'); END IF;
  PERFORM set_config('session_replication_role', 'replica', true);
  UPDATE public.remessas_bancarias SET data_geracao = now() - interval '2 hours' WHERE id = rm5;
  PERFORM set_config('session_replication_role', 'origin', true);
  IF pg_temp.ins_obj(u_proc, 'authenticated', 'remessas-cnab', rm5 || '.rem') <> 'negado' THEN PERFORM pg_temp.falha('storage remessas-cnab: envio para remessa gerada há mais de 1 hora'); END IF;
  PERFORM set_config('session_replication_role', 'replica', true);
  UPDATE public.remessas_bancarias SET data_geracao = now() WHERE id = rm5;
  PERFORM set_config('session_replication_role', 'origin', true);
  FOR f IN SELECT unnest(ARRAY['mod_rh', 'nenhum', 'srv_a', 'perm_avulsa_financeiro.folha.processar', 'admin_inativo']) LOOP
    IF pg_temp.ins_obj((SELECT uid FROM persona WHERE nome = f), 'authenticated', 'remessas-cnab', rm5 || '.rem') <> 'negado' THEN
      PERFORM pg_temp.falha('storage remessas-cnab: ' || f || ' envia arquivo de remessa');
    END IF;
  END LOOP;
  IF pg_temp.ins_obj(u_anon, 'anon', 'remessas-cnab', rm5 || '.rem') <> 'negado' THEN PERFORM pg_temp.falha('storage remessas-cnab: anon envia'); END IF;
  FOREACH f IN ARRAY ARRAY[rm1 || '.rem', rm2 || '.rem', 'qualquer.rem', rm5 || '.txt', 'pasta/' || rm5 || '.rem', gen_random_uuid() || '.rem'] LOOP
    IF pg_temp.ins_obj(u_proc, 'authenticated', 'remessas-cnab', f) <> 'negado' THEN
      PERFORM pg_temp.falha('storage remessas-cnab: envio aceito fora da regra (' || f || ': remessa com arquivo, cancelada, inexistente ou nome fora do formato)');
    END IF;
  END LOOP;
  -- ninguém troca nem apaga pela API (nem quem processa, nem o admin)
  FOR f IN SELECT unnest(ARRAY['admin', 'perm_financeiro.folha.processar', 'mod_rh']) LOOP
    IF pg_temp.mut_obj((SELECT uid FROM persona WHERE nome = f), 'authenticated', 'remessas-cnab', 'UPDATE') > 0
       OR pg_temp.mut_obj((SELECT uid FROM persona WHERE nome = f), 'authenticated', 'remessas-cnab', 'DELETE') > 0 THEN
      PERFORM pg_temp.falha('storage remessas-cnab: ' || f || ' troca ou apaga o arquivo guardado');
    END IF;
  END LOOP;
  IF pg_temp.mut_obj(NULL, 'anon', 'remessas-cnab', 'UPDATE') > 0 OR pg_temp.mut_obj(NULL, 'anon', 'remessas-cnab', 'DELETE') > 0 THEN
    PERFORM pg_temp.falha('storage remessas-cnab: anon troca ou apaga');
  END IF;
  -- sequência do front, como quem processa a folha: INSERT (valor e quantidade do cliente sobrescritos; número lido
  -- de volta) → envio do objeto <id>.rem → UPDATE de arquivo_path/arquivo_sha256 pelo mesmo usuário
  r := pg_temp.valor_como(u_proc, 'authenticated', format(ins_rem || '', gen_random_uuid(), ff3, c2, 1, 'gerada'));
  IF r IS NULL OR r LIKE 'erro:%' THEN PERFORM pg_temp.falha('E3 sequência: INSERT da remessa recusado (' || coalesce(r, 'nulo') || ')'); END IF;
  SELECT x.id::text INTO f FROM public.remessas_bancarias x WHERE x.folha_id = ff3 AND x.conta_autarquia_id = c2;
  IF f IS NULL OR (SELECT quantidade_registros FROM public.remessas_bancarias WHERE id = f::uuid) <> 0 THEN
    PERFORM pg_temp.falha('E3 sequência: remessa não gravada ou quantidade do cliente (99) mantida');
  ELSIF tem_bucket THEN
    r := pg_temp.exec_como(u_proc, 'authenticated', format('INSERT INTO storage.objects (bucket_id, name, owner_id) VALUES (''remessas-cnab'', %L, auth.uid()::text)', f || '.rem'));
    r := r || '/' || pg_temp.exec_como(u_proc, 'authenticated', format('UPDATE public.remessas_bancarias SET arquivo_path = %L, arquivo_sha256 = %L WHERE id = %L', f || '.rem', repeat('0f', 32), f));
    IF r <> 'ok/ok' OR (SELECT arquivo_path FROM public.remessas_bancarias WHERE id = f::uuid) IS DISTINCT FROM f || '.rem' THEN
      PERFORM pg_temp.falha('E3 sequência: INSERT → envio → UPDATE do arquivo pelo mesmo usuário falhou (' || r || ')');
    END IF;
    IF pg_temp.ins_obj(u_proc, 'authenticated', 'remessas-cnab', f || '.rem') <> 'negado' THEN
      PERFORM pg_temp.falha('storage remessas-cnab: segundo envio para remessa que já tem arquivo');
    END IF;
  END IF;
  SELECT count(*) INTO n FROM pg_policies
   WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname !~ '^st_remessas-cnab_(select|insert)$'
     AND (coalesce(qual, '') || ' ' || coalesce(with_check, '')) ~ ('remessas-cnab|^((?!bucket_id).)*$'
            || '|bucket_id <> ''(?!remessas-cnab'')|bucket_id <> ALL \(ARRAY\[((?!remessas-cnab)[^]])*\]|NOT \(bucket_id = ''(?!remessas-cnab'')');
  IF n > 0 THEN PERFORM pg_temp.falha('storage remessas-cnab: ' || n || ' policy(ies) além de st_remessas-cnab_select/insert valem para o bucket'); END IF;
  IF (SELECT count(*) FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname ~ '^st_remessas-cnab_') <> 2 THEN
    PERFORM pg_temp.falha('storage remessas-cnab: esperadas só as policies de SELECT e INSERT');
  END IF;

  -- ===== estrutura: triggers ligados e funções de trigger fora da API
  FOR f, r IN SELECT * FROM (VALUES ('remessas_bancarias', 'trg_exigir_folha_fechada'), ('eventos_esocial', 'trg_exigir_folha_fechada'),
                                    ('remessas_bancarias', 'trg_remessa_integridade')) AS v(t, g) LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = ('public.' || f)::regclass AND tgname = r AND tgenabled = 'O') THEN
      PERFORM pg_temp.falha('E3: trigger ' || r || ' ausente ou desligado em ' || f);
    END IF;
  END LOOP;
  FOREACH f IN ARRAY ARRAY['public.exigir_folha_fechada()', 'public.remessa_integridade()'] LOOP
    IF to_regprocedure(f) IS NULL THEN PERFORM pg_temp.falha('E3: função ' || f || ' não existe'); CONTINUE; END IF;
    IF has_function_privilege('authenticated', f, 'EXECUTE') OR has_function_privilege('anon', f, 'EXECUTE') THEN
      PERFORM pg_temp.falha('E3: ' || f || ' executável pela API');
    END IF;
  END LOOP;

  PERFORM pg_temp.nota('E3 (integridade de CNAB e eSocial): folha fechada, número da remessa, arquivo, cancelamento, eventos repetidos, recibo e bucket remessas-cnab verificados');
END $$;

-- ---------------------------------------------------------------- RH: leitura dos contracheques e fim do DELETE (Onda E3, 0100) (TRIGGERS LIGADOS)
-- Migração 20261011010100_rh_contracheques_leitura.sql (muda RLS existente; separada para o dono decidir no merge):
--   * catálogo: rh.contracheques.visualizar (módulo rh, action_type que não é 'visualizar') só para admin e manager;
--   * premissa: o papel `user` com o módulo rh tem financeiro.folha.visualizar (por isso a permissão nova) e, mesmo
--     assim, não lê ficha nem item de ninguém; o papel manager com o módulo rh lê todas; o servidor sem módulo lê só
--     as próprias (e os itens delas);
--   * lancamentos_folha, consignacoes, pensoes_alimenticias, itens_retorno_bancario e eventos_esocial: mesma leitura
--     (papel user e módulo sem código leem 0; manager, quem tem o código, quem processa e o admin leem tudo); quem só lê
--     não altera, quem processa altera;
--   * remessas_bancarias: o módulo lê; sem financeiro.folha.processar (papel user, só o módulo, só rh.contracheques.visualizar) não insere
--     nem altera (o papel manager tem financeiro.folha.processar no catálogo);
--   * eventos_esocial: só o módulo rh não insere (42501); quem processa insere;
--   * fn_validar_margem_consignavel: SECURITY INVOKER; papel user, módulo sem código e servidor consultando outro
--     recebem 42501; o próprio servidor, quem tem o código, quem processa e o admin consultam;
--   * remessas_bancarias e eventos_esocial: DELETE pela API recusado (42501) para o módulo, quem processa a folha e o
--     admin; sem policy de DELETE e sem o privilégio.
-- A semântica genérica (;leitura= e excluir=ninguem do mapa) é medida nos blocos por tabela, acima.
SET session_replication_role = replica;
DO $$
DECLARE u_user uuid := 'e3100000-0000-0000-0000-000000000001'; u_ger uuid := 'e3100000-0000-0000-0000-000000000002';
BEGIN
  INSERT INTO auth.users (id, email) VALUES (u_user, 'e3_user@teste.invalid'), (u_ger, 'e3_manager@teste.invalid');
  PERFORM pg_temp.seed_row('profiles', jsonb_build_object('id', u_user, 'email', 'e3_user@teste.invalid', 'is_active', true, 'tipo_usuario', 'servidor'));
  PERFORM pg_temp.seed_row('profiles', jsonb_build_object('id', u_ger, 'email', 'e3_manager@teste.invalid', 'is_active', true, 'tipo_usuario', 'servidor'));
  PERFORM pg_temp.seed_row('user_roles', jsonb_build_object('user_id', u_user, 'role', 'user'));
  PERFORM pg_temp.seed_row('user_roles', jsonb_build_object('user_id', u_ger, 'role', 'manager'));
  PERFORM pg_temp.seed_row('user_modules', jsonb_build_object('user_id', u_user, 'module', 'rh'));
  PERFORM pg_temp.seed_row('user_modules', jsonb_build_object('user_id', u_ger, 'module', 'rh'));
END $$;
SET session_replication_role = origin;
DO $$
DECLARE
  u_user uuid := 'e3100000-0000-0000-0000-000000000001';   -- papel user + módulo rh (cadastra servidor, não vê salário)
  u_ger uuid := 'e3100000-0000-0000-0000-000000000002';    -- papel manager + módulo rh
  u_admin uuid := (SELECT uid FROM persona WHERE nome='admin');
  u_a uuid := (SELECT uid FROM persona WHERE nome='srv_a');
  u_rh uuid := (SELECT uid FROM persona WHERE nome='mod_rh');
  u_lanc uuid := (SELECT uid FROM persona WHERE nome='perm_rh.frequencia.lancar');
  u_proc uuid := (SELECT uid FROM persona WHERE nome='perm_financeiro.folha.processar');
  u_cc uuid := (SELECT uid FROM persona WHERE nome='perm_rh.contracheques.visualizar');
  sa uuid := 'b0000000-0000-0000-0000-00000000000a';
  total_f int; total_i int; meus_f int; meus_i int; n int; r text; t text; x record;
BEGIN
  PERFORM set_config('request.jwt.claims', '', true);
  PERFORM set_config('request.headers', '', true);

  -- ===== catálogo
  SELECT * INTO x FROM public.module_permissions_catalog WHERE permission_code = 'rh.contracheques.visualizar';
  IF NOT FOUND THEN
    PERFORM pg_temp.falha('E3 contracheques: rh.contracheques.visualizar fora do catálogo');
  ELSIF x.module_code <> 'rh' OR x.action_type = 'visualizar' THEN
    PERFORM pg_temp.falha('E3 contracheques: rh.contracheques.visualizar com módulo ' || x.module_code || ' ou action_type visualizar (o papel user a herdaria)');
  END IF;
  IF (SELECT string_agg(role::text, ',' ORDER BY role::text) FROM public.role_permissions WHERE permission = 'rh.contracheques.visualizar')
     IS DISTINCT FROM 'admin,manager' THEN
    PERFORM pg_temp.falha('E3 contracheques: rh.contracheques.visualizar deveria ser só dos papéis admin e manager');
  END IF;
  -- premissa da spec: o papel user com o módulo rh já tem financeiro.folha.visualizar
  IF NOT ('financeiro.folha.visualizar' = ANY (public.get_user_permission_codes(u_user))) THEN
    PERFORM pg_temp.falha('E3 contracheques: premissa mudou: o papel user com o módulo rh não tem mais financeiro.folha.visualizar (reveja a permissão da rota)');
  END IF;

  -- ===== leitura de fichas e itens
  SELECT count(*) INTO total_f FROM public.fichas_financeiras;
  SELECT count(*) INTO total_i FROM public.itens_ficha_financeira;
  SELECT count(*) INTO meus_f FROM public.fichas_financeiras WHERE servidor_id = sa;
  SELECT count(*) INTO meus_i FROM public.itens_ficha_financeira i JOIN public.fichas_financeiras f ON f.id = i.ficha_id WHERE f.servidor_id = sa;
  IF total_f <= meus_f OR total_i <= meus_i OR meus_f = 0 OR meus_i = 0 THEN
    PERFORM pg_temp.falha(format('E3 contracheques: sementes insuficientes (fichas %s/%s do servidor A, itens %s/%s)', meus_f, total_f, meus_i, total_i));
  END IF;
  FOR x IN SELECT * FROM (VALUES
      ('papel user + módulo rh (financeiro.folha.visualizar)', u_user, 0, 0),
      ('módulo rh sem código', u_rh, 0, 0),
      ('papel manager + módulo rh', u_ger, total_f, total_i),
      ('módulo rh + rh.contracheques.visualizar', u_cc, total_f, total_i),
      ('módulo rh + financeiro.folha.processar', u_proc, total_f, total_i),
      ('admin', u_admin, total_f, total_i),
      ('servidor A sem módulo (as próprias)', u_a, meus_f, meus_i)) AS v(quem, uid, fichas, itens) LOOP
    IF x.uid IS NULL THEN PERFORM pg_temp.falha('E3 contracheques: persona ausente: ' || x.quem); CONTINUE; END IF;
    n := pg_temp.sel(x.uid, 'authenticated', 'fichas_financeiras');
    IF n <> x.fichas THEN PERFORM pg_temp.falha(format('E3 contracheques: %s lê %s ficha(s), esperado %s', x.quem, n, x.fichas)); END IF;
    n := pg_temp.sel(x.uid, 'authenticated', 'itens_ficha_financeira');
    IF n <> x.itens THEN PERFORM pg_temp.falha(format('E3 contracheques: %s lê %s item(ns), esperado %s', x.quem, n, x.itens)); END IF;
  END LOOP;

  -- ===== remuneração e dado bancário por pessoa fora das fichas: mesma leitura (;leitura= do mapa)
  FOREACH t IN ARRAY ARRAY['lancamentos_folha', 'consignacoes', 'pensoes_alimenticias', 'itens_retorno_bancario',
                           'eventos_esocial'] LOOP
    EXECUTE format('SELECT count(*) FROM public.%I', t) INTO total_f;
    IF total_f = 0 THEN PERFORM pg_temp.falha('E3 remuneração: ' || t || ' sem semente'); CONTINUE; END IF;
    FOR x IN SELECT * FROM (VALUES
        ('papel user + módulo rh (financeiro.folha.visualizar)', u_user, 0),
        ('módulo rh sem código', u_rh, 0),
        ('papel manager + módulo rh', u_ger, total_f),
        ('módulo rh + rh.contracheques.visualizar', u_cc, total_f),
        ('módulo rh + financeiro.folha.processar', u_proc, total_f),
        ('admin', u_admin, total_f)) AS v(quem, uid, linhas) LOOP
      n := pg_temp.sel(x.uid, 'authenticated', t);
      IF n <> x.linhas THEN PERFORM pg_temp.falha(format('E3 remuneração: %s lê %s linha(s) de %s, esperado %s', x.quem, n, t, x.linhas)); END IF;
    END LOOP;
    -- quem só lê (rh.contracheques.visualizar) não altera; quem processa altera
    r := pg_temp.sql_como(u_cc, 'authenticated', format('UPDATE public.%I SET updated_at = updated_at', t));
    IF r <> 'ok:0' THEN PERFORM pg_temp.falha(format('E3 remuneração: rh.contracheques.visualizar altera %s (%s)', t, r)); END IF;
    r := pg_temp.sql_como(u_proc, 'authenticated', format('UPDATE public.%I SET updated_at = updated_at', t));
    IF r NOT LIKE 'ok:%' OR r = 'ok:0' THEN PERFORM pg_temp.falha(format('E3 remuneração: financeiro.folha.processar não altera %s (%s)', t, r)); END IF;
  END LOOP;

  -- ===== remessas_bancarias: o módulo lê (só totais); INSERT/UPDATE só com financeiro.folha.processar
  SELECT count(*) INTO total_f FROM public.remessas_bancarias;
  IF total_f = 0 THEN PERFORM pg_temp.falha('E3 remessa: sem semente');
  ELSE
    FOR x IN SELECT * FROM (VALUES ('papel user + módulo rh', u_user), ('módulo rh sem código', u_rh),
                                   ('módulo rh + financeiro.folha.processar', u_proc)) AS v(quem, uid) LOOP
      n := pg_temp.sel(x.uid, 'authenticated', 'remessas_bancarias');
      IF n <> total_f THEN PERFORM pg_temp.falha(format('E3 remessa: %s lê %s de %s remessa(s)', x.quem, n, total_f)); END IF;
    END LOOP;
    FOR x IN SELECT * FROM (VALUES ('papel user + módulo rh', u_user), ('módulo rh sem código', u_rh),
                                   ('módulo rh + rh.contracheques.visualizar', u_cc)) AS v(quem, uid) LOOP
      r := pg_temp.sql_como(x.uid, 'authenticated', 'UPDATE public.remessas_bancarias SET observacoes = observacoes');
      IF r <> 'ok:0' THEN PERFORM pg_temp.falha(format('E3 remessa: %s altera remessa sem financeiro.folha.processar (%s)', x.quem, r)); END IF;
      IF pg_temp.ins(x.uid, 'authenticated', 'remessas_bancarias') <> 'negado' THEN
        PERFORM pg_temp.falha(format('E3 remessa: %s insere remessa sem financeiro.folha.processar', x.quem));
      END IF;
    END LOOP;
  END IF;

  -- ===== eSocial: quem só tem o módulo rh não gera evento; quem processa a folha gera
  t := 'INSERT INTO public.eventos_esocial (tipo_evento, payload, status) VALUES (''S-2200'', ''{}'', ''pendente'')';
  r := pg_temp.sql_como(u_rh, 'authenticated', t);
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('E3 eSocial: módulo rh sem financeiro.folha.processar insere evento (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_proc, 'authenticated', t);
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('E3 eSocial: financeiro.folha.processar não insere evento (' || r || ')'); END IF;

  -- ===== fn_validar_margem_consignavel: mesma regra de leitura; roda como o usuário
  IF to_regprocedure('public.fn_validar_margem_consignavel(uuid)') IS NULL THEN
    PERFORM pg_temp.falha('E3 margem: fn_validar_margem_consignavel(uuid) não existe');
  ELSE
    IF (SELECT prosecdef FROM pg_proc WHERE oid = to_regprocedure('public.fn_validar_margem_consignavel(uuid)')) THEN
      PERFORM pg_temp.falha('E3 margem: fn_validar_margem_consignavel continua SECURITY DEFINER');
    END IF;
    FOR x IN SELECT * FROM (VALUES
        ('papel user + módulo rh', u_user, sa, false), ('módulo rh sem código', u_rh, sa, false),
        ('servidor A, de outro servidor', u_a, 'b0000000-0000-0000-0000-00000000000b'::uuid, false),
        ('servidor A, o próprio', u_a, sa, true), ('módulo rh + rh.contracheques.visualizar', u_cc, sa, true),
        ('módulo rh + financeiro.folha.processar', u_proc, sa, true), ('admin', u_admin, sa, true)) AS v(quem, uid, srv, pode) LOOP
      r := pg_temp.valor_como(x.uid, 'authenticated', format('SELECT count(*)::text FROM public.fn_validar_margem_consignavel(%L)', x.srv));
      IF x.pode AND r IS DISTINCT FROM '1' THEN PERFORM pg_temp.falha(format('E3 margem: %s não consulta (%s)', x.quem, coalesce(r, 'nulo'))); END IF;
      IF NOT x.pode AND r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha(format('E3 margem: %s consulta a margem (%s)', x.quem, coalesce(r, 'nulo'))); END IF;
    END LOOP;
  END IF;

  -- ===== sem DELETE pela API em remessas_bancarias e eventos_esocial
  FOREACH t IN ARRAY ARRAY['remessas_bancarias', 'eventos_esocial'] LOOP
    IF has_table_privilege('authenticated', 'public.' || t, 'DELETE') OR has_table_privilege('anon', 'public.' || t, 'DELETE') THEN
      PERFORM pg_temp.falha('E3: ' || t || ' com privilégio DELETE para a API');
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = t AND cmd IN ('DELETE', 'ALL')) THEN
      PERFORM pg_temp.falha('E3: ' || t || ' ainda tem policy de DELETE');
    END IF;
    FOR x IN SELECT * FROM (VALUES ('admin', u_admin), ('módulo rh', u_rh), ('financeiro.folha.processar', u_proc)) AS v(quem, uid) LOOP
      r := pg_temp.sql_como(x.uid, 'authenticated', format('DELETE FROM public.%I', t));
      IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha(format('E3: %s apaga em %s pela API (%s)', x.quem, t, r)); END IF;
    END LOOP;
  END LOOP;

  PERFORM pg_temp.nota('E3 (contracheques e DELETE): leitura de fichas, itens, lançamentos, consignações, pensões, retorno e eSocial por permissão, papel user sem acesso, o próprio servidor, escrita da remessa com processar e remessas/eventos sem DELETE verificados');
END $$;

-- ---------------------------------------------------------------- Financeiro: FIPLAN, arquivos bancários e extrato do BB (TRIGGERS LIGADOS)
-- Migrações 20261011100000 a 20261011100300 (spec docs/superpowers/specs/2026-10-11-financeiro-fiplan-banco-design.md):
--   * alteração orçamentária: situação no FIPLAN só muda por confirmar_alteracao_fiplan (orcamento.aprovar); UPDATE
--     direto recusado (42501) e INSERT sempre nasce pendente; depois de confirmada, valor, dotações, tipo, exercício
--     e status não mudam pela API (42501), processo SEI sim;
--   * fin_movimentos_bancarios, fin_remessas_bancarias, fin_extrato_lancamentos: o módulo financeiro lê, outro módulo
--     não; ninguém escreve pela API; funções de apoio fora da API; registrar_extrato_bb só da service role; as três
--     com trigger de auditoria (fn_audit_financeiro -> fin_audit_log); assinaturas antigas removidas;
--   * importar_arquivo_bancario: sem pagamento.conciliar (ou com a permissão avulsa sem o módulo) = 42501; simulação
--     não grava; remessa casa com o pagamento pelo CPF/CNPJ do fornecedor + valor + data a até 5 dias (fora da janela
--     não casa, mesmo no mesmo exercício); remessa com situação pago = 22023; reimportar = sem_alteracao; o retorno
--     pago atualiza o movimento e marca o pagamento como pago com a data_efetivacao da linha; retorno vazio (0 linhas)
--     grava o log com totais zerados;
--   * conciliar_movimento_bancario: troca direta de pagamento, pagamento com outro movimento pago e valor diferente
--     sem justificativa recusados (22023); justificativa gravada; desvincular não reverte o status do pagamento;
--   * corrigir_conta_movimento: só recusado, não fatura, não reservado/reenviado; justificativa obrigatória; banco 001
--     exige validado_bb ou justificativa com 15+ caracteres;
--   * registrar_remessa_bancaria: o servidor monta os créditos (conta corrigida ou a do movimento; seu número =
--     identificador numérico ou nsa*1000+seq), calcula quantidade/valor e reserva os movimentos; recusa movimento
--     não recusado, fatura, sem conta, já reenviado ou reservado por outro usuário; NSA mínimo só na primeira remessa;
--     nova tentativa do mesmo usuário reaproveita o NSA; confirmar só pelo autor e falha se a reserva foi mexida;
--     cancelar libera os movimentos (autor ou admin; confirmada não); obter devolve créditos e hash;
--   * retorno do reenvio casa com o pagamento original (seu número gerado e reenvio pago em outro ano);
--   * registrar_extrato_bb: idempotente pela chave e casa o débito com o pagamento;
--   * 20261011100400: pela API (módulo e admin) fin_pagamentos não passa a pago, não nasce pago e não muda
--     data_efetivacao (42501), outras transições seguem; a baixa pelo retorno do banco soma empenho/dotação e baixa o
--     saldo uma vez só; alteração confirmada no FIPLAN não é apagada pela API (pendente é).
-- Como valor_como (persiste), mas devolve 'vazio' em vez de NULL: comparação com NULL não esconde falha.
CREATE FUNCTION pg_temp.fin_valor_como(p_uid uuid, p_role text, p_sql text) RETURNS text
LANGUAGE plpgsql AS $$
DECLARE res text;
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', p_role)::text, true);
  EXECUTE format('SET LOCAL ROLE %I', p_role);
  BEGIN
    EXECUTE p_sql INTO res;
  EXCEPTION WHEN OTHERS THEN res := 'erro:' || SQLSTATE || ':' || left(SQLERRM, 120);
  END;
  RESET ROLE;
  RETURN coalesce(res, 'vazio');
END $$;
SET session_replication_role = replica;
DO $$
DECLARE
  u_conc uuid := 'f1000000-0000-0000-0000-000000000001'; u_aprov uuid := 'f1000000-0000-0000-0000-000000000002';
  u_avulsa uuid := 'f1000000-0000-0000-0000-000000000003'; u_conc2 uuid := 'f1000000-0000-0000-0000-000000000004';
  forn text := 'f2000000-0000-0000-0000-000000000001'; cb text := 'f2000000-0000-0000-0000-000000000002';
BEGIN
  INSERT INTO auth.users (id, email) VALUES (u_conc, 'fin_conc@teste.invalid'), (u_aprov, 'fin_aprov@teste.invalid'),
                                            (u_avulsa, 'fin_avulsa@teste.invalid'), (u_conc2, 'fin_conc2@teste.invalid');
  PERFORM pg_temp.seed_row('profiles', jsonb_build_object('id', u_conc, 'email', 'fin_conc@teste.invalid', 'is_active', true, 'tipo_usuario', 'servidor'));
  PERFORM pg_temp.seed_row('profiles', jsonb_build_object('id', u_aprov, 'email', 'fin_aprov@teste.invalid', 'is_active', true, 'tipo_usuario', 'servidor'));
  PERFORM pg_temp.seed_row('profiles', jsonb_build_object('id', u_avulsa, 'email', 'fin_avulsa@teste.invalid', 'is_active', true, 'tipo_usuario', 'servidor'));
  PERFORM pg_temp.seed_row('profiles', jsonb_build_object('id', u_conc2, 'email', 'fin_conc2@teste.invalid', 'is_active', true, 'tipo_usuario', 'servidor'));
  PERFORM pg_temp.seed_row('user_modules', jsonb_build_object('user_id', u_conc, 'module', 'financeiro', 'permissions', '{pagamento.conciliar}'));
  PERFORM pg_temp.seed_row('user_modules', jsonb_build_object('user_id', u_conc2, 'module', 'financeiro', 'permissions', '{pagamento.conciliar}'));
  PERFORM pg_temp.seed_row('user_modules', jsonb_build_object('user_id', u_aprov, 'module', 'financeiro', 'permissions', '{orcamento.aprovar}'));
  PERFORM pg_temp.seed_row('user_permissions', jsonb_build_object('user_id', u_avulsa, 'permission', 'pagamento.conciliar'));
  PERFORM pg_temp.seed_row('fornecedores', jsonb_build_object('id', forn, 'tipo_pessoa', 'PJ',
    'cpf_cnpj', '12.345.678/0001-90', 'razao_social', 'Fornecedor Teste'));
  PERFORM pg_temp.seed_row('fin_contas_bancarias', jsonb_build_object('id', cb,
    'banco_codigo', '001', 'banco_nome', 'Banco Teste', 'agencia', '1234', 'conta', '99999', 'nome_conta', 'Conta Teste'));
  -- pag1 (1500, 05/10) casa pela remessa; pag2 (320,50, pago) casa com o extrato; pag3 (777, exercício 2025) é o
  -- pagamento original do reenvio pago em 2026; pag4 (450, 01/09) testa a janela de 5 dias; pag5 (99, 01/01) tem
  -- o mesmo valor/documento do OB124 no mesmo exercício, mas fora da janela (não pode casar sozinho).
  PERFORM pg_temp.seed_row('fin_pagamentos', jsonb_build_object('id', 'f2000000-0000-0000-0000-000000000003', 'numero', 'PG-TESTE-1',
    'exercicio', 2026, 'data_pagamento', '2026-10-05', 'fornecedor_id', forn, 'conta_bancaria_id', cb,
    'valor_bruto', 1500, 'valor_retencoes', 0, 'forma_pagamento', 'ob', 'status', 'autorizado'));
  PERFORM pg_temp.seed_row('fin_pagamentos', jsonb_build_object('id', 'f2000000-0000-0000-0000-000000000004', 'numero', 'PG-TESTE-2',
    'exercicio', 2026, 'data_pagamento', '2026-10-06', 'fornecedor_id', forn, 'conta_bancaria_id', cb,
    'valor_bruto', 320.5, 'valor_retencoes', 0, 'forma_pagamento', 'ob', 'status', 'pago', 'data_efetivacao', '2026-10-06'));
  PERFORM pg_temp.seed_row('fin_pagamentos', jsonb_build_object('id', 'f2000000-0000-0000-0000-000000000007', 'numero', 'PG-TESTE-3',
    'exercicio', 2025, 'data_pagamento', '2025-12-20', 'fornecedor_id', forn, 'conta_bancaria_id', cb,
    'valor_bruto', 777, 'valor_retencoes', 0, 'forma_pagamento', 'ob', 'status', 'autorizado'));
  PERFORM pg_temp.seed_row('fin_pagamentos', jsonb_build_object('id', 'f2000000-0000-0000-0000-000000000008', 'numero', 'PG-TESTE-4',
    'exercicio', 2026, 'data_pagamento', '2026-09-01', 'fornecedor_id', forn, 'conta_bancaria_id', cb,
    'valor_bruto', 450, 'valor_retencoes', 0, 'forma_pagamento', 'ob', 'status', 'autorizado'));
  PERFORM pg_temp.seed_row('fin_pagamentos', jsonb_build_object('id', 'f2000000-0000-0000-0000-000000000009', 'numero', 'PG-TESTE-5',
    'exercicio', 2026, 'data_pagamento', '2026-01-01', 'fornecedor_id', forn, 'conta_bancaria_id', cb,
    'valor_bruto', 99, 'valor_retencoes', 0, 'forma_pagamento', 'ob', 'status', 'autorizado'));
  PERFORM pg_temp.seed_row('contas_autarquia', jsonb_build_object('id', 'f2000000-0000-0000-0000-000000000005',
    'descricao', 'Conta pagadora teste', 'agencia', '1234', 'agencia_digito', '3', 'conta', '55555', 'conta_digito', '7',
    'convenio_pagamento', '000123'));
  PERFORM pg_temp.seed_row('fin_alteracoes_orcamentarias', jsonb_build_object('id', 'f2000000-0000-0000-0000-000000000006',
    'numero', 'ALT-TESTE', 'exercicio', 2026, 'valor', 10, 'justificativa', 'teste', 'status', 'aprovado'));
  -- baixa pelo banco (20261011100400): dotação, empenho, conta com saldo e pagamento autorizado que casa pelo
  -- identificador_transacao; uma alteração pendente para o DELETE
  PERFORM pg_temp.seed_row('fin_dotacoes', jsonb_build_object('id', 'f2000000-0000-0000-0000-00000000000a', 'exercicio', 2026,
    'codigo_dotacao', 'DOT-TESTE', 'valor_inicial', 5000, 'valor_pago', 0));
  PERFORM pg_temp.seed_row('fin_empenhos', jsonb_build_object('id', 'f2000000-0000-0000-0000-00000000000b', 'numero', 'EMP-TESTE',
    'exercicio', 2026, 'dotacao_id', 'f2000000-0000-0000-0000-00000000000a', 'fornecedor_id', forn, 'valor_empenhado', 500,
    'valor_liquidado', 500, 'valor_pago', 0, 'objeto', 'teste', 'status', 'liquidado'));
  PERFORM pg_temp.seed_row('fin_contas_bancarias', jsonb_build_object('id', 'f2000000-0000-0000-0000-00000000000c',
    'banco_codigo', '001', 'banco_nome', 'Banco Teste', 'agencia', '1234', 'conta', '88888', 'nome_conta', 'Conta Saldo', 'saldo_atual', 1000));
  PERFORM pg_temp.seed_row('fin_liquidacoes', jsonb_build_object('id', 'f2000000-0000-0000-0000-00000000000f', 'numero', 'LIQ-TESTE',
    'exercicio', 2026, 'empenho_id', 'f2000000-0000-0000-0000-00000000000b', 'valor_documento', 500, 'valor_liquidado', 500));
  PERFORM pg_temp.seed_row('fin_pagamentos', jsonb_build_object('id', 'f2000000-0000-0000-0000-00000000000d', 'numero', 'PG-TESTE-6',
    'exercicio', 2026, 'data_pagamento', '2026-10-08', 'fornecedor_id', forn, 'empenho_id', 'f2000000-0000-0000-0000-00000000000b',
    'liquidacao_id', 'f2000000-0000-0000-0000-00000000000f',
    'conta_bancaria_id', 'f2000000-0000-0000-0000-00000000000c', 'valor_bruto', 200, 'valor_retencoes', 0,
    'forma_pagamento', 'ob', 'status', 'autorizado', 'identificador_transacao', 'TX-EMP-1'));
  PERFORM pg_temp.seed_row('fin_alteracoes_orcamentarias', jsonb_build_object('id', 'f2000000-0000-0000-0000-00000000000e',
    'numero', 'ALT-PEND', 'exercicio', 2026, 'valor', 5, 'justificativa', 'teste', 'status', 'rascunho'));
  -- movimentos gravados direto: uma fatura recusada e um crédito recusado com conta (para conciliação e NSA)
  -- (a fatura tem banco/agência/conta preenchidos de propósito: só a regra da fatura pode recusá-la no reenvio)
  INSERT INTO public.fin_movimentos_bancarios (id, origem, sentido, tipo_lancamento, identificador, favorecido_documento,
    banco, agencia, conta, valor, data_pagamento, codigo_barras, situacao, chave_unica)
  VALUES ('f3000000-0000-0000-0000-000000000001', 'obn600', 'retorno', 'fatura', 'OB-FATURA', '12345678000190',
    '001', '1234', '3333-3', 10, '2026-10-05', '83600000001', 'recusado', 'teste|fatura');
  INSERT INTO public.fin_movimentos_bancarios (id, origem, sentido, tipo_lancamento, identificador, favorecido_nome,
    favorecido_documento, banco, agencia, conta, valor, data_pagamento, situacao, chave_unica)
  VALUES ('f3000000-0000-0000-0000-000000000002', 'cnab240', 'retorno', 'credito_bb', 'MOVX', 'Fornecedor Teste',
    '12345678000190', '001', '1234', '2222-1', 1500, '2026-10-05', 'recusado', 'teste|movx');
END $$;
SET session_replication_role = origin;
DO $$
DECLARE
  u_conc uuid := 'f1000000-0000-0000-0000-000000000001'; u_aprov uuid := 'f1000000-0000-0000-0000-000000000002';
  u_avulsa uuid := 'f1000000-0000-0000-0000-000000000003'; u_conc2 uuid := 'f1000000-0000-0000-0000-000000000004';
  u_fin uuid := (SELECT uid FROM persona WHERE nome='mod_financeiro');
  u_rh uuid := (SELECT uid FROM persona WHERE nome='mod_rh');
  u_lanc uuid := (SELECT uid FROM persona WHERE nome='perm_rh.frequencia.lancar');
  u_admin uuid := (SELECT uid FROM persona WHERE nome='admin');
  pag1 uuid := 'f2000000-0000-0000-0000-000000000003';
  pag3 uuid := 'f2000000-0000-0000-0000-000000000007';
  pag5 uuid := 'f2000000-0000-0000-0000-000000000009';
  pag6 uuid := 'f2000000-0000-0000-0000-00000000000d';
  conta uuid := 'f2000000-0000-0000-0000-000000000002';
  cpag text := 'f2000000-0000-0000-0000-000000000005';
  alt uuid := 'f2000000-0000-0000-0000-000000000006';
  mov_fat uuid := 'f3000000-0000-0000-0000-000000000001';
  mov_x uuid := 'f3000000-0000-0000-0000-000000000002';
  hoje text := current_date::text;
  arq text := '{"nome":"OBN600_TESTE.REM","sha256":"' || repeat('a', 64) || '","tamanho":700}';
  par_rem text := '{"origem":"obn600","sentido":"remessa","data_arquivo":"2026-10-05","sequencial_arquivo":"12"}';
  par_ret text := '{"origem":"obn600","sentido":"retorno","data_arquivo":"2026-10-06","sequencial_arquivo":"12"}';
  par_cnab text := '{"origem":"cnab240","sentido":"retorno","data_arquivo":"2026-10-06","sequencial_arquivo":"5"}';
  lin_rem text := '[{"tipo_lancamento":"31","identificador":"2026OB000123","favorecido_nome":"Fornecedor Teste",'
                  '"favorecido_documento":"12345678000190","banco":"001","agencia":"1234","conta":"1111",'
                  '"valor":1500,"data_pagamento":"2026-10-05","situacao":"enviado"},'
                  '{"tipo_lancamento":"31","identificador":"2026OB000124","favorecido_documento":"12345678000190",'
                  '"valor":99,"data_pagamento":"2026-10-05","situacao":"enviado"}]';
  lin_ret text := '[{"tipo_lancamento":"31","identificador":"2026OB000123","favorecido_documento":"12345678000190",'
                  '"valor":1500,"data_pagamento":"2026-10-05","situacao":"pago","codigo_retorno":"01","autenticacao":"AUT1",'
                  '"data_efetivacao":"2026-10-07"},'
                  '{"tipo_lancamento":"31","identificador":"2026OB000124","favorecido_documento":"12345678000190",'
                  '"valor":99,"data_pagamento":"2026-10-05","situacao":"recusado","codigo_retorno":"09","motivo_recusa":"conta inexistente"}]';
  sql_imp text; sql_cnab text; r text; j jsonb; n int; t text; x record; mov_rec uuid; mov_ano uuid; rem uuid;
  mov_pago uuid; hash_ok text := repeat('b', 64);
BEGIN
  PERFORM set_config('request.jwt.claims', '', true);
  PERFORM set_config('request.headers', '', true);
  sql_cnab := 'SELECT public.importar_arquivo_bancario(%L::jsonb, '
              || quote_literal('{"nome":"CNAB_TESTE.RET","sha256":"' || repeat('d', 64) || '","tamanho":480}')
              || '::jsonb, %L::jsonb, %s)::text';

  -- ===== privilégios e leitura
  FOREACH t IN ARRAY ARRAY['fin_movimentos_bancarios', 'fin_remessas_bancarias', 'fin_extrato_lancamentos'] LOOP
    IF has_table_privilege('anon', 'public.' || t, 'SELECT') THEN PERFORM pg_temp.falha('FIN banco: anon lê ' || t); END IF;
    IF has_table_privilege('authenticated', 'public.' || t, 'INSERT') OR has_table_privilege('authenticated', 'public.' || t, 'UPDATE')
       OR has_table_privilege('authenticated', 'public.' || t, 'DELETE') THEN
      PERFORM pg_temp.falha('FIN banco: authenticated com privilégio de escrita em ' || t);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = t AND cmd <> 'SELECT') THEN
      PERFORM pg_temp.falha('FIN banco: policy de escrita em ' || t);
    END IF;
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = ('public.' || t)::regclass) THEN
      PERFORM pg_temp.falha('FIN banco: RLS desligada em ' || t);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger g WHERE g.tgrelid = ('public.' || t)::regclass AND NOT g.tgisinternal
                      AND g.tgfoid = 'public.fn_audit_financeiro()'::regprocedure
                      AND (g.tgtype & 28) = 28) THEN  -- INSERT(4) + DELETE(8) + UPDATE(16)
      PERFORM pg_temp.falha('FIN banco: ' || t || ' sem trigger de auditoria fn_audit_financeiro (INSERT/UPDATE/DELETE)');
    END IF;
  END LOOP;
  FOREACH t IN ARRAY ARRAY['fin_casar_movimento_pagamento(text,text,numeric,date)', 'fin_marcar_pagamento_pago(uuid,date)',
                           'fin_alteracoes_proteger_situacao_fiplan()', 'registrar_extrato_bb(uuid,jsonb)',
                           'fin_remessa_bancaria_json(uuid)'] LOOP
    IF has_function_privilege('authenticated', 'public.' || t, 'EXECUTE') OR has_function_privilege('anon', 'public.' || t, 'EXECUTE') THEN
      PERFORM pg_temp.falha('FIN banco: ' || t || ' executável pela API');
    END IF;
  END LOOP;
  IF NOT has_function_privilege('service_role', 'public.registrar_extrato_bb(uuid,jsonb)', 'EXECUTE') THEN
    PERFORM pg_temp.falha('FIN banco: service_role não executa registrar_extrato_bb');
  END IF;
  FOREACH t IN ARRAY ARRAY['importar_arquivo_bancario(jsonb,jsonb,jsonb,boolean)', 'conciliar_movimento_bancario(uuid,uuid,text)',
                           'registrar_remessa_bancaria(uuid,text,uuid[],date,integer,text)', 'confirmar_remessa_bancaria(uuid,text)',
                           'obter_remessa_bancaria(uuid)', 'cancelar_remessa_bancaria(uuid)',
                           'corrigir_conta_movimento(uuid,text,text,text,text,text,text,boolean)',
                           'confirmar_alteracao_fiplan(uuid)', 'pode_conciliar_pagamentos()'] LOOP
    IF to_regprocedure('public.' || t) IS NULL THEN PERFORM pg_temp.falha('FIN banco: função ' || t || ' não existe'); CONTINUE; END IF;
    IF has_function_privilege('anon', 'public.' || t, 'EXECUTE') THEN PERFORM pg_temp.falha('FIN banco: anon executa ' || t); END IF;
    IF NOT has_function_privilege('authenticated', 'public.' || t, 'EXECUTE') THEN PERFORM pg_temp.falha('FIN banco: authenticated não executa ' || t); END IF;
    IF NOT (SELECT prosecdef AND coalesce(proconfig::text, '') ~ 'search_path' FROM pg_proc WHERE oid = to_regprocedure('public.' || t)) THEN
      PERFORM pg_temp.falha('FIN banco: ' || t || ' sem SECURITY DEFINER ou sem search_path fixo');
    END IF;
  END LOOP;
  IF to_regprocedure('public.registrar_remessa_bancaria(uuid,text,integer,numeric,uuid[],integer)') IS NOT NULL
     OR to_regprocedure('public.conciliar_movimento_bancario(uuid,uuid)') IS NOT NULL THEN
    PERFORM pg_temp.falha('FIN banco: assinatura antiga de registrar_remessa_bancaria (quantidade/valor do cliente) ou de conciliar_movimento_bancario continua no banco');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.module_permissions_catalog WHERE permission_code = 'pagamento.conciliar' AND module_code = 'financeiro') THEN
    PERFORM pg_temp.falha('FIN banco: pagamento.conciliar fora do catálogo do financeiro');
  END IF;

  -- ===== alteração orçamentária x FIPLAN
  r := pg_temp.sql_como(u_fin, 'authenticated', format('UPDATE public.fin_alteracoes_orcamentarias SET situacao_fiplan = %L WHERE id = %L', 'confirmada', alt));
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('FIN FIPLAN: UPDATE direto da situação passou (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_fin, 'authenticated', format('UPDATE public.fin_alteracoes_orcamentarias SET processo_sei = %L WHERE id = %L', '00000.000000/2026-00', alt));
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('FIN FIPLAN: o módulo não edita processo_sei (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_fin, 'authenticated', format('UPDATE public.fin_alteracoes_orcamentarias SET valor = 11 WHERE id = %L', alt));
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('FIN FIPLAN: alteração pendente não aceita mudar o valor (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_fin, 'authenticated', 'INSERT INTO public.fin_alteracoes_orcamentarias (numero, exercicio, tipo, valor, justificativa, situacao_fiplan, confirmado_fiplan_em) '
       || 'VALUES (''ALT-X'', 2026, (SELECT enum_range(NULL::public.tipo_alteracao_orcamentaria))[1], 1, ''x'', ''confirmada'', now()) RETURNING situacao_fiplan || coalesce(confirmado_fiplan_em::text, '''')');
  IF r <> 'pendente' THEN PERFORM pg_temp.falha('FIN FIPLAN: INSERT não nasceu pendente (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_fin, 'authenticated', format('SELECT public.confirmar_alteracao_fiplan(%L)::text', alt));
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('FIN FIPLAN: módulo sem orcamento.aprovar confirmou (' || r || ')'); END IF;
  r := pg_temp.fin_valor_como(u_aprov, 'authenticated', format('SELECT public.confirmar_alteracao_fiplan(%L)->>''situacao_fiplan''', alt));
  IF r <> 'confirmada' THEN PERFORM pg_temp.falha('FIN FIPLAN: orcamento.aprovar não confirmou (' || r || ')'); END IF;
  IF (SELECT confirmado_fiplan_por FROM public.fin_alteracoes_orcamentarias WHERE id = alt) IS DISTINCT FROM u_aprov THEN
    PERFORM pg_temp.falha('FIN FIPLAN: autor da confirmação não gravado');
  END IF;
  -- confirmada: campos do FIPLAN travados pela API (inclusive para o admin); processo SEI segue editável
  FOREACH t IN ARRAY ARRAY['valor = 11', 'status = ''cancelado''', 'exercicio = 2027',
                           'dotacao_origem_id = gen_random_uuid()', 'dotacao_destino_id = gen_random_uuid()',
                           'tipo = (SELECT e FROM unnest(enum_range(NULL::public.tipo_alteracao_orcamentaria)) e WHERE e IS DISTINCT FROM tipo LIMIT 1)'] LOOP
    FOR x IN SELECT * FROM (VALUES ('mod_financeiro', u_fin), ('admin', u_admin)) v(quem, uid) LOOP
      r := pg_temp.sql_como(x.uid, 'authenticated', format('UPDATE public.fin_alteracoes_orcamentarias SET %s WHERE id = %L', t, alt));
      IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha(format('FIN FIPLAN: %s mudou alteração confirmada (%s: %s)', x.quem, t, r)); END IF;
    END LOOP;
  END LOOP;
  r := pg_temp.sql_como(u_fin, 'authenticated', format('UPDATE public.fin_alteracoes_orcamentarias SET processo_sei = %L, observacoes = %L WHERE id = %L', '11111.000000/2026-00', 'obs', alt));
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('FIN FIPLAN: processo SEI/observações de alteração confirmada não editáveis (' || r || ')'); END IF;

  -- ===== importar_arquivo_bancario: quem pode
  sql_imp := format('SELECT public.importar_arquivo_bancario(%L::jsonb, %L::jsonb, %L::jsonb, %s)::text', lin_rem, arq, par_rem, 'true');
  FOR x IN SELECT * FROM (VALUES ('mod_financeiro', u_fin), ('avulsa sem módulo', u_avulsa), ('mod_rh', u_rh)) v(quem, uid) LOOP
    r := pg_temp.valor_desfeito_como(x.uid, 'authenticated', sql_imp);
    IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha(format('FIN banco: %s importa arquivo bancário (%s)', x.quem, left(r, 80))); END IF;
  END LOOP;
  IF pg_temp.valor_desfeito_como(u_conc, 'authenticated', 'SELECT public.pode_conciliar_pagamentos()::text') <> 'true'
     OR pg_temp.valor_desfeito_como(u_fin, 'authenticated', 'SELECT public.pode_conciliar_pagamentos()::text') <> 'false' THEN
    PERFORM pg_temp.falha('FIN banco: pode_conciliar_pagamentos não reflete pagamento.conciliar');
  END IF;

  -- remessa com situação pago/recusado: recusada
  r := pg_temp.valor_desfeito_como(u_conc, 'authenticated', format('SELECT public.importar_arquivo_bancario(%L::jsonb, %L::jsonb, %L::jsonb, true)::text',
         replace(lin_rem, '"situacao":"enviado"},', '"situacao":"pago"},'), arq, par_rem));
  IF r NOT LIKE 'erro:22023:%' THEN PERFORM pg_temp.falha('FIN banco: remessa com situação pago aceita (' || left(r, 100) || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_conc, 'authenticated', format('SELECT public.importar_arquivo_bancario(%L::jsonb, %L::jsonb, %L::jsonb, true)::text',
         replace(lin_ret, '"2026-10-07"', '"2026-13-07"'), arq, par_ret));
  IF r NOT LIKE 'erro:22023:%' THEN PERFORM pg_temp.falha('FIN banco: data_efetivacao inválida aceita (' || left(r, 100) || ')'); END IF;

  -- simulação não grava
  r := pg_temp.fin_valor_como(u_conc, 'authenticated', sql_imp);
  j := r::jsonb;
  IF (j->'totais'->>'inserir')::int <> 2 OR NOT (j->>'simulacao')::boolean THEN PERFORM pg_temp.falha('FIN banco: simulação errada (' || left(r, 120) || ')'); END IF;
  IF EXISTS (SELECT 1 FROM public.fin_movimentos_bancarios WHERE chave_unica NOT LIKE 'teste|%') OR EXISTS (SELECT 1 FROM public.importacoes WHERE tipo = 'arquivo_bancario') THEN
    PERFORM pg_temp.falha('FIN banco: simulação gravou');
  END IF;

  -- remessa aplicada: casa com o pagamento (documento + valor + data) e não marca pago; OB124 (99) tem o mesmo
  -- valor e documento do pag5, no mesmo exercício, mas 277 dias depois: não casa
  r := pg_temp.fin_valor_como(u_conc, 'authenticated', replace(sql_imp, ', true)', ', false)'));
  IF r LIKE 'erro:%' THEN PERFORM pg_temp.falha('FIN banco: remessa não aplicou (' || r || ')'); END IF;
  IF (SELECT pagamento_id FROM public.fin_movimentos_bancarios WHERE identificador = '2026OB000123') IS DISTINCT FROM pag1 THEN
    PERFORM pg_temp.falha('FIN banco: remessa não casou com o pagamento');
  END IF;
  IF (SELECT pagamento_id FROM public.fin_movimentos_bancarios WHERE identificador = '2026OB000124') IS NOT NULL THEN
    PERFORM pg_temp.falha('FIN casamento: documento + valor casou fora da janela de 5 dias (OB124 com pag5)');
  END IF;
  IF (SELECT status::text FROM public.fin_pagamentos WHERE id = pag1) <> 'autorizado' THEN
    PERFORM pg_temp.falha('FIN banco: remessa (enviado) mudou o status do pagamento');
  END IF;
  IF (SELECT count(*) FROM public.importacoes WHERE tipo = 'arquivo_bancario' AND modulo = 'financeiro') <> 1 THEN
    PERFORM pg_temp.falha('FIN banco: log em importacoes ausente');
  END IF;
  r := pg_temp.fin_valor_como(u_conc, 'authenticated', replace(sql_imp, ', true)', ', false)'));
  IF (r::jsonb->'totais'->>'sem_alteracao')::int <> 2 THEN PERFORM pg_temp.falha('FIN banco: reimportar a remessa não deu sem_alteracao (' || left(r, 120) || ')'); END IF;
  IF (SELECT count(*) FROM public.fin_movimentos_bancarios WHERE chave_unica NOT LIKE 'teste|%') <> 2 THEN PERFORM pg_temp.falha('FIN banco: reimportação duplicou movimentos'); END IF;

  -- janela de 5 dias (pag4: 450 em 01/09): 10/09 não casa, 04/09 casa (simulação)
  t := '[{"tipo_lancamento":"credito_bb","identificador":"JANELA-1","favorecido_documento":"12345678000190","valor":450,"data_pagamento":"%s","situacao":"enviado"}]';
  r := pg_temp.fin_valor_como(u_conc, 'authenticated', format(sql_cnab, format(t, '2026-09-10'), replace(par_cnab, 'retorno', 'remessa'), 'true'));
  IF r LIKE 'erro:%' OR (r::jsonb->'linhas'->0) ? 'mudancas' THEN PERFORM pg_temp.falha('FIN casamento: casou a 9 dias da data do pagamento (' || left(r, 160) || ')'); END IF;
  r := pg_temp.fin_valor_como(u_conc, 'authenticated', format(sql_cnab, format(t, '2026-09-04'), replace(par_cnab, 'retorno', 'remessa'), 'true'));
  IF r LIKE 'erro:%' OR (r::jsonb->'linhas'->0->'mudancas'->'pagamento_id'->>1) IS DISTINCT FROM 'f2000000-0000-0000-0000-000000000008' THEN
    PERFORM pg_temp.falha('FIN casamento: não casou a 3 dias da data do pagamento (' || left(r, 160) || ')');
  END IF;

  -- retorno: pago marca o pagamento com a data de efetivação da linha; recusado guarda o motivo
  r := pg_temp.fin_valor_como(u_conc, 'authenticated',
         format('SELECT public.importar_arquivo_bancario(%L::jsonb, %L::jsonb, %L::jsonb, false)::text', lin_ret, replace(arq, 'REM', 'RET'), par_ret));
  IF r LIKE 'erro:%' OR (r::jsonb->'totais'->>'atualizar')::int <> 2 THEN PERFORM pg_temp.falha('FIN banco: retorno não atualizou (' || left(r, 120) || ')'); END IF;
  IF (SELECT status::text || '|' || coalesce(data_efetivacao::text, '') FROM public.fin_pagamentos WHERE id = pag1) <> 'pago|2026-10-07' THEN
    PERFORM pg_temp.falha('FIN banco: retorno pago não marcou o pagamento com a data_efetivacao da linha ('
      || (SELECT status::text || '|' || coalesce(data_efetivacao::text, '') FROM public.fin_pagamentos WHERE id = pag1) || ')');
  END IF;
  SELECT id INTO mov_pago FROM public.fin_movimentos_bancarios WHERE identificador = '2026OB000123';
  IF (SELECT data_efetivacao FROM public.fin_movimentos_bancarios WHERE id = mov_pago) IS DISTINCT FROM '2026-10-07'::date THEN
    PERFORM pg_temp.falha('FIN banco: data_efetivacao não gravada no movimento');
  END IF;
  SELECT id INTO mov_rec FROM public.fin_movimentos_bancarios WHERE identificador = '2026OB000124' AND situacao = 'recusado' AND motivo_recusa = 'conta inexistente';
  IF mov_rec IS NULL THEN PERFORM pg_temp.falha('FIN banco: recusado sem motivo/situação'); END IF;

  -- retorno vazio: válido, grava o log com totais zerados
  n := (SELECT count(*) FROM public.importacoes WHERE tipo = 'arquivo_bancario');
  r := pg_temp.fin_valor_como(u_conc, 'authenticated', format(sql_cnab, '[]', par_cnab, 'false'));
  IF r LIKE 'erro:%' OR r::jsonb->'totais' <> '{"inserir":0,"atualizar":0,"sem_alteracao":0}'::jsonb
     OR (SELECT count(*) FROM public.importacoes WHERE tipo = 'arquivo_bancario') <> n + 1 THEN
    PERFORM pg_temp.falha('FIN banco: retorno vazio recusado ou sem log (' || left(r, 120) || ')');
  END IF;

  -- recusado de 2025 (pag3: 777 em 20/12/2025), com conta própria "1234-5"/"1111-X": casa na janela
  r := pg_temp.fin_valor_como(u_conc, 'authenticated', format(sql_cnab,
         '[{"tipo_lancamento":"credito_bb","identificador":"7770001","favorecido_nome":"Fornecedor Teste","favorecido_documento":"12345678000190",'
         '"banco":"001","agencia":"1234-5","conta":"1111-X","valor":777,"data_pagamento":"2025-12-20","situacao":"recusado","codigo_retorno":"AG"}]',
         par_cnab, 'false'));
  SELECT id INTO mov_ano FROM public.fin_movimentos_bancarios WHERE identificador = '7770001';
  IF r LIKE 'erro:%' OR mov_ano IS NULL OR (SELECT pagamento_id FROM public.fin_movimentos_bancarios WHERE id = mov_ano) IS DISTINCT FROM pag3 THEN
    PERFORM pg_temp.falha('FIN casamento: recusado de 2025 não casou com o pagamento de 2025 (' || left(r, 120) || ')');
  END IF;

  -- leitura: o módulo lê, outro módulo não
  IF pg_temp.sel(u_fin, 'authenticated', 'fin_movimentos_bancarios') <> (SELECT count(*) FROM public.fin_movimentos_bancarios) THEN
    PERFORM pg_temp.falha('FIN banco: módulo financeiro não lê os movimentos');
  END IF;
  IF pg_temp.sel(u_rh, 'authenticated', 'fin_movimentos_bancarios') <> 0 THEN PERFORM pg_temp.falha('FIN banco: módulo rh lê os movimentos'); END IF;
  r := pg_temp.sql_como(u_admin, 'authenticated', 'UPDATE public.fin_movimentos_bancarios SET situacao = ''pago''');
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('FIN banco: admin altera movimento pela API (' || r || ')'); END IF;

  -- ===== conciliação manual
  r := pg_temp.valor_desfeito_como(u_fin, 'authenticated', format('SELECT public.conciliar_movimento_bancario(%L, %L)::text', mov_rec, pag5));
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('FIN banco: módulo sem pagamento.conciliar concilia (' || r || ')'); END IF;
  -- valor diferente (1500 x 99, pag5 sem movimento) sem justificativa: recusado; com justificativa: aceito e gravado
  r := pg_temp.valor_desfeito_como(u_conc, 'authenticated', format('SELECT public.conciliar_movimento_bancario(%L, %L)::text', mov_x, pag5));
  IF r NOT LIKE 'erro:22023:%' THEN PERFORM pg_temp.falha('FIN conciliação: valor diferente sem justificativa aceito (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_conc, 'authenticated', format('SELECT public.conciliar_movimento_bancario(%L, %L, %L)::text', mov_x, pag5, '   '));
  IF r NOT LIKE 'erro:22023:%' THEN PERFORM pg_temp.falha('FIN conciliação: justificativa em branco aceita (' || r || ')'); END IF;
  -- pag1 já tem movimento pago (OB123): outro movimento não entra, mesmo com valor igual
  r := pg_temp.valor_desfeito_como(u_conc, 'authenticated', format('SELECT public.conciliar_movimento_bancario(%L, %L)::text', mov_x, pag1));
  IF r NOT LIKE 'erro:22023:%' THEN PERFORM pg_temp.falha('FIN conciliação: pagamento com outro movimento pago recebeu mais um (' || r || ')'); END IF;
  -- movimento já vinculado (OB123 -> pag1) não troca direto de pagamento
  r := pg_temp.valor_desfeito_como(u_conc, 'authenticated', format('SELECT public.conciliar_movimento_bancario(%L, %L, %L)::text', mov_pago, pag5, 'troca direta de teste'));
  IF r NOT LIKE 'erro:22023:%' THEN PERFORM pg_temp.falha('FIN conciliação: movimento vinculado trocou de pagamento sem desvincular (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_conc, 'authenticated', format('SELECT public.conciliar_movimento_bancario(%L, %L)->>''valor_confere''', mov_pago, pag1));
  IF r <> 'true' THEN PERFORM pg_temp.falha('FIN conciliação: vincular de novo ao mesmo pagamento não é idempotente (' || r || ')'); END IF;
  -- movimento x (1500, recusado) em pag3 (777) com justificativa: grava a justificativa e o autor; depois desvincula
  r := pg_temp.fin_valor_como(u_conc, 'authenticated', format('SELECT public.conciliar_movimento_bancario(%L, %L, %L)->>''valor_confere''', mov_x, pag5, 'diferença conferida no processo'));
  IF r <> 'false' OR (SELECT conciliacao_justificativa || '|' || conciliado_por::text FROM public.fin_movimentos_bancarios WHERE id = mov_x)
                     IS DISTINCT FROM 'diferença conferida no processo|' || u_conc::text THEN
    PERFORM pg_temp.falha('FIN conciliação: justificativa/autor não gravados (' || r || ')');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.fin_audit_log a WHERE a.tabela_origem = 'fin_movimentos_bancarios' AND a.registro_id = mov_x
                    AND a.acao = 'UPDATE' AND a.usuario_id = u_conc AND 'pagamento_id' = ANY (a.campos_alterados)) THEN
    PERFORM pg_temp.falha('FIN conciliação: vínculo manual fora da trilha fin_audit_log');
  END IF;
  r := pg_temp.fin_valor_como(u_conc, 'authenticated', format('SELECT public.conciliar_movimento_bancario(%L, NULL)->>''pagamento_id''', mov_x));
  IF r <> 'vazio' OR (SELECT pagamento_id FROM public.fin_movimentos_bancarios WHERE id = mov_x) IS NOT NULL THEN
    PERFORM pg_temp.falha('FIN conciliação: desvincular falhou (' || r || ')');
  END IF;
  -- desvincular o movimento pago não reverte o status do pagamento
  r := pg_temp.valor_desfeito_como(u_conc, 'authenticated',
         format('SELECT (public.conciliar_movimento_bancario(%L, NULL)->>''status_revertido'') || ''|'' || (SELECT status::text FROM public.fin_pagamentos WHERE id = %L)', mov_pago, pag1));
  IF r <> 'false|pago' THEN PERFORM pg_temp.falha('FIN conciliação: desvincular reverteu o status do pagamento (' || r || ')'); END IF;
  -- OB124 (recusado, 99) vinculado à mão ao pag5 (99): é o pagamento original do reenvio
  r := pg_temp.fin_valor_como(u_conc, 'authenticated', format('SELECT public.conciliar_movimento_bancario(%L, %L)->>''valor_confere''', mov_rec, pag5));
  IF r <> 'true' THEN PERFORM pg_temp.falha('FIN conciliação: vínculo manual de valor igual falhou (' || r || ')'); END IF;

  -- ===== correção de conta
  t := 'SELECT public.corrigir_conta_movimento(%L, %L, %L, %L, %L, %L, %L, %s)::text';
  r := pg_temp.valor_desfeito_como(u_fin, 'authenticated', format(t, mov_rec, '237', '1234', '', '9999', '1', 'conta informada pelo credor', 'false'));
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('FIN correção: módulo sem pagamento.conciliar corrige conta (' || r || ')'); END IF;
  FOR x IN SELECT * FROM (VALUES
      ('movimento pago', mov_pago::text, '237', 'conta informada pelo credor', 'false'),
      ('fatura', mov_fat::text, '237', 'conta informada pelo credor', 'false'),
      ('justificativa vazia', mov_rec::text, '237', '  ', 'false'),
      ('BB sem validação e justificativa curta', mov_rec::text, '001', 'credor ligou', 'false'),
      ('banco inválido', mov_rec::text, '1', 'conta informada pelo credor', 'false')) v(caso, mov, banco, just, val) LOOP
    r := pg_temp.valor_desfeito_como(u_conc, 'authenticated', format(t, x.mov, x.banco, '1234', '', '9999', '1', x.just, x.val));
    IF r NOT LIKE 'erro:22023:%' THEN PERFORM pg_temp.falha(format('FIN correção: %s aceito (%s)', x.caso, r)); END IF;
  END LOOP;
  r := pg_temp.valor_desfeito_como(u_conc, 'authenticated', format(t, mov_rec, '001', '1234', '', '9999', '1', 'credor ligou', 'true'));
  IF r LIKE 'erro:%' THEN PERFORM pg_temp.falha('FIN correção: BB validado com justificativa curta recusado (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_conc, 'authenticated', format(t, mov_rec, '001', '1234', '', '9999', '1', 'credor confirmou por ofício', 'false'));
  IF r LIKE 'erro:%' THEN PERFORM pg_temp.falha('FIN correção: BB com justificativa de 15+ caracteres recusado (' || r || ')'); END IF;

  -- ===== remessa de reenvio: quem pode e o que entra
  t := 'SELECT public.registrar_remessa_bancaria(%L, ''gestao_max_cnab240'', %L::uuid[], %L::date, %s)::text';
  r := pg_temp.valor_desfeito_como(u_fin, 'authenticated', format(t, cpag, ARRAY[mov_ano], hoje, 'NULL'));
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('FIN remessa: módulo sem pagamento.conciliar reserva NSA (' || r || ')'); END IF;
  FOR x IN SELECT * FROM (VALUES
      ('movimento sem banco/agência/conta (OB124 antes da correção)', ARRAY[mov_rec]::text, hoje),
      ('fatura', ARRAY[mov_fat]::text, hoje),
      ('movimento pago', ARRAY[mov_pago]::text, hoje),
      ('lista vazia', '{}', hoje),
      ('movimento repetido', ARRAY[mov_ano, mov_ano]::text, hoje),
      ('data do pagamento no passado', ARRAY[mov_ano]::text, (current_date - 10)::text)) v(caso, movs, dt) LOOP
    r := pg_temp.valor_desfeito_como(u_conc, 'authenticated', format(t, cpag, x.movs, x.dt, 'NULL'));
    IF r NOT LIKE 'erro:22023:%' THEN PERFORM pg_temp.falha(format('FIN remessa: %s aceito (%s)', x.caso, left(r, 100))); END IF;
  END LOOP;

  -- corrige a conta do OB124 e reserva [OB124, 7770001] com NSA mínimo 7 (primeira remessa da conta)
  r := pg_temp.fin_valor_como(u_conc, 'authenticated', format('SELECT public.corrigir_conta_movimento(%L, %L, %L, %L, %L, %L, %L)->>''movimento_id''',
         mov_rec, '237', '0456', '', '78901', 'x', 'conta informada pelo credor'));
  IF r <> mov_rec::text OR (SELECT conta_corrigida->>'conta_dv' || '|' || corrigido_por::text FROM public.fin_movimentos_bancarios WHERE id = mov_rec)
                           IS DISTINCT FROM 'X|' || u_conc::text THEN
    PERFORM pg_temp.falha('FIN correção: conta corrigida/autor não gravados (' || r || ')');
  END IF;
  r := pg_temp.fin_valor_como(u_conc, 'authenticated', format(t, cpag, ARRAY[mov_rec, mov_ano], hoje, '7'));
  IF r LIKE 'erro:%' THEN PERFORM pg_temp.falha('FIN remessa: reserva falhou (' || r || ')'); r := '{}'; END IF;
  j := r::jsonb; rem := (j->>'id')::uuid;
  IF (j->>'nsa')::int IS DISTINCT FROM 7 OR j->>'convenio' IS DISTINCT FROM '000123' OR j->>'conta_digito' IS DISTINCT FROM '7'
     OR j->>'data_pagamento' IS DISTINCT FROM hoje OR j->>'tipo_servico' IS DISTINCT FROM '98' OR jsonb_array_length(j->'creditos') <> 2 OR j ? 'arquivo_sha256' THEN
    PERFORM pg_temp.falha('FIN remessa: retorno da reserva fora do formato (' || left(r, 200) || ')');
  END IF;
  IF j->'creditos'->0 @> jsonb_build_object('movimento_id', mov_rec, 'pagamento_id', pag5, 'banco', '237', 'agencia', '0456', 'agencia_dv', '',
                                             'conta', '78901', 'conta_dv', 'X', 'valor', 99, 'seu_numero', '7001', 'documento', '12345678000190') IS NOT TRUE
     OR j->'creditos'->1 @> jsonb_build_object('movimento_id', mov_ano, 'pagamento_id', pag3, 'banco', '001', 'agencia', '1234', 'agencia_dv', '5',
                                             'conta', '1111', 'conta_dv', 'X', 'valor', 777, 'seu_numero', '7770001') IS NOT TRUE THEN
    PERFORM pg_temp.falha('FIN remessa: créditos não montados pelo servidor como esperado (' || left(j->>'creditos', 300) || ')');
  END IF;
  IF (SELECT quantidade || '|' || valor_total FROM public.fin_remessas_bancarias WHERE id = rem) IS DISTINCT FROM '2|876.00'
     OR (SELECT count(*) FROM public.fin_movimentos_bancarios WHERE remessa_id = rem AND reenviado_em IS NULL) <> 2 THEN
    PERFORM pg_temp.falha('FIN remessa: quantidade/valor não calculados no servidor ou movimentos não reservados');
  END IF;
  -- outro usuário: não reserva os mesmos movimentos, não confirma nem cancela a reserva alheia
  r := pg_temp.valor_desfeito_como(u_conc2, 'authenticated', format(t, cpag, ARRAY[mov_ano], hoje, 'NULL'));
  IF r NOT LIKE 'erro:22023:%' THEN PERFORM pg_temp.falha('FIN remessa: movimento reservado por outro usuário entrou noutra remessa (' || left(r, 100) || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_conc2, 'authenticated', format('SELECT public.confirmar_remessa_bancaria(%L, %L)::text', rem, hash_ok));
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('FIN remessa: outro usuário confirmou a reserva (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_conc2, 'authenticated', format('SELECT public.cancelar_remessa_bancaria(%L)::text', rem));
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('FIN remessa: outro usuário cancelou a reserva (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_admin, 'authenticated', format('SELECT public.cancelar_remessa_bancaria(%L)->>''movimentos_liberados''', rem));
  IF r <> '2' THEN PERFORM pg_temp.falha('FIN remessa: admin não cancela reserva parada de outro usuário (' || r || ')'); END IF;
  -- reservado: a conta não muda
  r := pg_temp.valor_desfeito_como(u_conc, 'authenticated', format('SELECT public.corrigir_conta_movimento(%L, %L, %L, %L, %L, %L, %L)::text',
         mov_ano, '237', '1', '', '2', '', 'conta informada pelo credor'));
  IF r NOT LIKE 'erro:22023:%' THEN PERFORM pg_temp.falha('FIN correção: conta de movimento reservado mudou (' || r || ')'); END IF;
  -- nova tentativa do mesmo usuário: mesmo NSA, libera o que saiu da lista
  r := pg_temp.fin_valor_como(u_conc, 'authenticated', format(t, cpag, ARRAY[mov_rec], hoje, 'NULL'));
  IF r LIKE 'erro:%' OR (r::jsonb->>'id')::uuid IS DISTINCT FROM rem OR (r::jsonb->>'nsa')::int <> 7
     OR (SELECT remessa_id FROM public.fin_movimentos_bancarios WHERE id = mov_ano) IS NOT NULL THEN
    PERFORM pg_temp.falha('FIN remessa: nova tentativa não reaproveitou a reserva ou não liberou o movimento retirado (' || left(r, 120) || ')');
  END IF;
  -- cancelar libera e apaga; a próxima (ainda a primeira da conta) volta a usar o NSA mínimo
  r := pg_temp.fin_valor_como(u_conc, 'authenticated', format('SELECT public.cancelar_remessa_bancaria(%L)->>''movimentos_liberados''', rem));
  IF r <> '1' OR EXISTS (SELECT 1 FROM public.fin_remessas_bancarias WHERE id = rem)
     OR EXISTS (SELECT 1 FROM public.fin_movimentos_bancarios WHERE remessa_id = rem) THEN
    PERFORM pg_temp.falha('FIN remessa: cancelar não apagou a reserva ou não liberou os movimentos (' || r || ')');
  END IF;
  r := pg_temp.fin_valor_como(u_conc, 'authenticated', format(t, cpag, ARRAY[mov_rec, mov_ano], hoje, '7'));
  IF r LIKE 'erro:%' THEN PERFORM pg_temp.falha('FIN remessa: reserva depois do cancelamento falhou (' || left(r, 120) || ')'); r := '{}'; END IF;
  rem := (r::jsonb->>'id')::uuid;
  IF (r::jsonb->>'nsa')::int IS DISTINCT FROM 7 THEN PERFORM pg_temp.falha('FIN remessa: reserva depois do cancelamento (' || left(r, 120) || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_conc2, 'authenticated', format('SELECT public.obter_remessa_bancaria(%L)::text', rem));
  IF r LIKE 'erro:%' OR NOT (r::jsonb ? 'arquivo_sha256') OR jsonb_array_length(r::jsonb->'creditos') <> 2 THEN
    PERFORM pg_temp.falha('FIN remessa: obter_remessa_bancaria sem créditos/hash (' || left(r, 120) || ')');
  END IF;
  r := pg_temp.valor_desfeito_como(u_conc, 'authenticated', format(replace(t, '%s)::text', '%s, ''x'')::text'), cpag, ARRAY[mov_x], hoje, 'NULL'));
  IF r NOT LIKE 'erro:22023:%' THEN PERFORM pg_temp.falha('FIN remessa: tipo de serviço inválido aceito (' || left(r, 100) || ')'); END IF;
  -- nova tentativa com tipo de serviço 30 (salários): gravado e devolvido por obter_remessa_bancaria
  r := pg_temp.fin_valor_como(u_conc, 'authenticated', format(replace(t, '%s)::text', '%s, ''30'')->>''id'''), cpag, ARRAY[mov_rec, mov_ano], hoje, 'NULL'));
  r := r || '|' || pg_temp.valor_desfeito_como(u_conc, 'authenticated', format('SELECT public.obter_remessa_bancaria(%L)->>''tipo_servico''', rem));
  IF r IS DISTINCT FROM rem::text || '|30' THEN PERFORM pg_temp.falha('FIN remessa: tipo_servico 30 não gravado/devolvido por obter_remessa_bancaria (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_fin, 'authenticated', format('SELECT public.obter_remessa_bancaria(%L)::text', rem));
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('FIN remessa: módulo sem pagamento.conciliar obtém a remessa (' || left(r, 80) || ')'); END IF;
  -- confirmação falha se a reserva foi mexida
  UPDATE public.fin_movimentos_bancarios SET remessa_id = NULL WHERE id = mov_ano;
  r := pg_temp.valor_desfeito_como(u_conc, 'authenticated', format('SELECT public.confirmar_remessa_bancaria(%L, %L)::text', rem, hash_ok));
  IF r NOT LIKE 'erro:22023:%' THEN PERFORM pg_temp.falha('FIN remessa: confirmou com movimento fora da reserva (' || r || ')'); END IF;
  UPDATE public.fin_movimentos_bancarios SET remessa_id = rem WHERE id = mov_ano;
  r := pg_temp.fin_valor_como(u_conc, 'authenticated', format('SELECT public.confirmar_remessa_bancaria(%L, %L)->>''movimentos_marcados''', rem, hash_ok));
  IF r <> '2' THEN PERFORM pg_temp.falha('FIN remessa: confirmação não marcou os reenviados (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_conc, 'authenticated', format('SELECT public.confirmar_remessa_bancaria(%L, %L)->>''ja_confirmada''', rem, hash_ok));
  IF r <> 'true' THEN PERFORM pg_temp.falha('FIN remessa: reconfirmar com o mesmo hash não é idempotente (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_conc, 'authenticated', format('SELECT public.confirmar_remessa_bancaria(%L, %L)::text', rem, repeat('c', 64)));
  IF r NOT LIKE 'erro:22023:%' THEN PERFORM pg_temp.falha('FIN remessa: reconfirmar com outro hash passou (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_conc, 'authenticated', format('SELECT public.cancelar_remessa_bancaria(%L)::text', rem));
  IF r NOT LIKE 'erro:22023:%' THEN PERFORM pg_temp.falha('FIN remessa: remessa confirmada cancelada (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_conc, 'authenticated', format(t, cpag, ARRAY[mov_rec], hoje, 'NULL'));
  IF r NOT LIKE 'erro:22023:%' THEN PERFORM pg_temp.falha('FIN remessa: movimento já reenviado aceito de novo (' || left(r, 100) || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_conc, 'authenticated', format('SELECT public.obter_remessa_bancaria(%L)->>''arquivo_sha256''', rem));
  IF r IS DISTINCT FROM hash_ok THEN PERFORM pg_temp.falha('FIN remessa: obter_remessa_bancaria sem o hash confirmado (' || r || ')'); END IF;
  -- depois da primeira remessa, o NSA mínimo é ignorado: max + 1
  r := pg_temp.valor_desfeito_como(u_conc, 'authenticated', format(replace(t, ')::text', ')->>''nsa'''), cpag, ARRAY[mov_x], hoje, '50'));
  IF r <> '8' THEN PERFORM pg_temp.falha('FIN remessa: próximo NSA não é max + 1 com NSA mínimo ignorado (' || r || ')'); END IF;
  IF NOT EXISTS (SELECT 1 FROM public.fin_audit_log a WHERE a.tabela_origem = 'fin_remessas_bancarias' AND a.acao = 'DELETE') THEN
    PERFORM pg_temp.falha('FIN remessa: cancelamento fora da trilha fin_audit_log');
  END IF;

  -- ===== retorno do reenvio: casa com o pagamento original (seu número gerado 7001; 7770001 de 2025 pago em 2026)
  r := pg_temp.fin_valor_como(u_conc, 'authenticated', format(sql_cnab,
         '[{"tipo_lancamento":"credito_outro_banco","identificador":"7001","favorecido_documento":"12345678000190","valor":99,'
         '"data_pagamento":"' || hoje || '","situacao":"pago","codigo_retorno":"00"},'
         '{"tipo_lancamento":"credito_bb","identificador":"7770001","favorecido_documento":"12345678000190","valor":777,'
         '"data_pagamento":"' || hoje || '","data_efetivacao":"' || hoje || '","situacao":"pago","codigo_retorno":"00"}]',
         par_cnab, 'false'));
  IF r LIKE 'erro:%' OR (r::jsonb->'totais'->>'inserir')::int <> 2 THEN PERFORM pg_temp.falha('FIN reenvio: retorno não importou (' || left(r, 120) || ')'); END IF;
  IF (SELECT status::text FROM public.fin_pagamentos WHERE id = pag5) <> 'pago'
     OR (SELECT pagamento_id FROM public.fin_movimentos_bancarios WHERE identificador = '7001') IS DISTINCT FROM pag5 THEN
    PERFORM pg_temp.falha('FIN reenvio: retorno com seu número gerado (nsa*1000+seq) não casou com o pagamento original');
  END IF;
  IF (SELECT status::text || '|' || data_efetivacao FROM public.fin_pagamentos WHERE id = pag3) IS DISTINCT FROM 'pago|' || hoje
     OR (SELECT count(*) FROM public.fin_movimentos_bancarios WHERE identificador = '7770001' AND pagamento_id = pag3) <> 2 THEN
    PERFORM pg_temp.falha('FIN reenvio: reenvio pago em outro ano não casou com o pagamento original (2025)');
  END IF;

  -- ===== extrato do BB (service role)
  r := pg_temp.valor_desfeito_como(u_admin, 'authenticated', format('SELECT public.registrar_extrato_bb(%L, ''[]''::jsonb)::text', conta));
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('FIN extrato: authenticated executa registrar_extrato_bb (' || r || ')'); END IF;
  t := '[{"identificador_bb":"20261006|1|77|144|320.50|D|1","data_lancamento":"2026-10-06","valor":320.5,"sinal":"D",'
       '"codigo_historico":144,"descricao":"Pagamento","contrapartida_documento":"12345678000190","contrapartida_tipo":"J"},'
       '{"identificador_bb":"20261006|1|78|830|10.00|C|1","data_lancamento":"2026-10-06","valor":10,"sinal":"C"}]';
  r := pg_temp.fin_valor_como(NULL, 'service_role', format('SELECT public.registrar_extrato_bb(%L, %L::jsonb)::text', conta, t));
  IF r LIKE 'erro:%' OR (r::jsonb->>'inseridos')::int <> 2 OR (r::jsonb->>'conciliados')::int <> 1 THEN PERFORM pg_temp.falha('FIN extrato: gravação/casamento (' || r || ')'); END IF;
  r := pg_temp.fin_valor_como(NULL, 'service_role', format('SELECT public.registrar_extrato_bb(%L, %L::jsonb)::text', conta, t));
  IF r LIKE 'erro:%' OR (r::jsonb->>'existentes')::int <> 2 THEN PERFORM pg_temp.falha('FIN extrato: reimportação não idempotente (' || r || ')'); END IF;
  IF pg_temp.sel(u_fin, 'authenticated', 'fin_extrato_lancamentos') <> 2 OR pg_temp.sel(u_rh, 'authenticated', 'fin_extrato_lancamentos') <> 0 THEN
    PERFORM pg_temp.falha('FIN extrato: leitura fora do módulo financeiro');
  END IF;

  -- ===== baixa só pelo banco (20261011100400)
  -- PG-TESTE-6 (pag6): autorizado, empenho EMP-TESTE (liquidado 500), conta com saldo 1000
  FOR x IN SELECT * FROM (VALUES ('mod_financeiro', u_fin), ('admin', u_admin)) v(quem, uid) LOOP
    FOREACH t IN ARRAY ARRAY['status = ''pago''', 'data_efetivacao = current_date', 'status = ''pago'', data_efetivacao = current_date'] LOOP
      r := pg_temp.sql_como(x.uid, 'authenticated', format('UPDATE public.fin_pagamentos SET %s WHERE id = %L', t, pag6));
      IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha(format('FIN baixa: %s baixou pagamento pela API (%s: %s)', x.quem, t, r)); END IF;
    END LOOP;
    r := pg_temp.sql_como(x.uid, 'authenticated',
           'INSERT INTO public.fin_pagamentos (numero, exercicio, empenho_id, liquidacao_id, conta_bancaria_id, valor_bruto, forma_pagamento, status) '
           || 'SELECT ''PG-X'', 2026, empenho_id, liquidacao_id, conta_bancaria_id, 1, ''ob'', ''pago'' FROM public.fin_pagamentos WHERE numero = ''PG-TESTE-6''');
    IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha(format('FIN baixa: %s inseriu pagamento já pago (%s)', x.quem, r)); END IF;
    r := pg_temp.sql_como(x.uid, 'authenticated',
           'INSERT INTO public.fin_pagamentos (numero, exercicio, empenho_id, liquidacao_id, conta_bancaria_id, valor_bruto, forma_pagamento, status) '
           || 'SELECT ''PG-X'', 2026, empenho_id, liquidacao_id, conta_bancaria_id, 1, ''ob'', ''programado'' FROM public.fin_pagamentos WHERE numero = ''PG-TESTE-6''');
    IF r LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha(format('FIN baixa: %s não insere pagamento programado (%s)', x.quem, r)); END IF;
    r := pg_temp.sql_como(x.uid, 'authenticated', format('UPDATE public.fin_pagamentos SET status = ''cancelado'', observacoes = ''x'' WHERE id = %L', pag6));
    IF r <> 'ok:1' THEN PERFORM pg_temp.falha(format('FIN baixa: %s não muda o status para cancelado (%s)', x.quem, r)); END IF;
  END LOOP;
  -- o retorno do banco baixa: empenho, dotação e saldo andam uma vez só (reimportar não soma de novo)
  t := format(sql_cnab, '[{"tipo_lancamento":"credito_bb","identificador":"TX-EMP-1","favorecido_documento":"12345678000190","valor":200,'
       '"data_pagamento":"2026-10-08","data_efetivacao":"2026-10-09","situacao":"pago","codigo_retorno":"00"}]', par_cnab, 'false');
  r := pg_temp.fin_valor_como(u_conc, 'authenticated', t);
  r := r || '#' || pg_temp.fin_valor_como(u_conc, 'authenticated', t);
  IF r LIKE '%erro:%' OR (SELECT status::text || '|' || data_efetivacao FROM public.fin_pagamentos WHERE id = pag6) IS DISTINCT FROM 'pago|2026-10-09' THEN
    PERFORM pg_temp.falha('FIN baixa: retorno do banco não baixou o pagamento (' || left(r, 160) || ')');
  END IF;
  IF (SELECT valor_pago || '|' || status FROM public.fin_empenhos WHERE id = 'f2000000-0000-0000-0000-00000000000b') IS DISTINCT FROM '200.00|parcialmente_pago'
     OR (SELECT valor_pago FROM public.fin_dotacoes WHERE id = 'f2000000-0000-0000-0000-00000000000a') IS DISTINCT FROM 200.00
     OR (SELECT saldo_atual || '|' || data_ultimo_saldo FROM public.fin_contas_bancarias WHERE id = 'f2000000-0000-0000-0000-00000000000c') IS DISTINCT FROM '800.00|2026-10-09' THEN
    PERFORM pg_temp.falha(format('FIN baixa: empenho/dotação/saldo não acompanharam a baixa por UPDATE uma única vez (empenho %s, dotação %s, conta %s)',
      (SELECT valor_pago || '|' || status FROM public.fin_empenhos WHERE id = 'f2000000-0000-0000-0000-00000000000b'),
      (SELECT valor_pago FROM public.fin_dotacoes WHERE id = 'f2000000-0000-0000-0000-00000000000a'),
      (SELECT saldo_atual || '|' || data_ultimo_saldo FROM public.fin_contas_bancarias WHERE id = 'f2000000-0000-0000-0000-00000000000c')));
  END IF;
  -- UPDATE que repete status = 'pago' (permitido: não é transição) não soma de novo
  r := pg_temp.exec_como(u_fin, 'authenticated', format('UPDATE public.fin_pagamentos SET status = ''pago'', observacoes = ''repete'' WHERE id = %L', pag6));
  IF r <> 'ok' OR (SELECT valor_pago FROM public.fin_empenhos WHERE id = 'f2000000-0000-0000-0000-00000000000b') IS DISTINCT FROM 200.00
     OR (SELECT saldo_atual FROM public.fin_contas_bancarias WHERE id = 'f2000000-0000-0000-0000-00000000000c') IS DISTINCT FROM 800.00 THEN
    PERFORM pg_temp.falha('FIN baixa: UPDATE de pagamento já pago somou de novo no empenho/saldo (' || r || ')');
  END IF;
  -- pago: a API não muda a data de efetivação
  r := pg_temp.sql_como(u_admin, 'authenticated', format('UPDATE public.fin_pagamentos SET data_efetivacao = NULL WHERE id = %L', pag6));
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('FIN baixa: admin apagou a data de efetivação de pagamento pago (' || r || ')'); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = 'public.fin_pagamentos'::regclass AND tgname = 'trg_fin_pagamentos_proteger_baixa')
     OR has_function_privilege('authenticated', 'public.fin_pagamentos_proteger_baixa()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.fin_alteracoes_bloquear_exclusao_confirmada()', 'EXECUTE') THEN
    PERFORM pg_temp.falha('FIN baixa: trigger trg_fin_pagamentos_proteger_baixa ausente ou funções de trigger executáveis pela API');
  END IF;

  -- ===== alteração confirmada no FIPLAN não é apagada pela API (pendente é)
  FOR x IN SELECT * FROM (VALUES ('mod_financeiro', u_fin), ('admin', u_admin)) v(quem, uid) LOOP
    r := pg_temp.sql_como(x.uid, 'authenticated', format('DELETE FROM public.fin_alteracoes_orcamentarias WHERE id = %L', alt));
    IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha(format('FIN FIPLAN: %s apagou alteração confirmada (%s)', x.quem, r)); END IF;
    r := pg_temp.sql_como(x.uid, 'authenticated', 'DELETE FROM public.fin_alteracoes_orcamentarias WHERE id = ''f2000000-0000-0000-0000-00000000000e''');
    IF r <> 'ok:1' THEN PERFORM pg_temp.falha(format('FIN FIPLAN: %s não apaga alteração pendente (%s)', x.quem, r)); END IF;
  END LOOP;

  PERFORM pg_temp.nota('FIN (FIPLAN e banco): FIPLAN (confirmação e trava), importação (remessa/retorno/vazio/data de efetivação), janela de 5 dias, conciliação manual, correção de conta, reserva/confirmação/cancelamento do reenvio, retorno do reenvio, extrato do BB, baixa só pelo banco (empenho/dotação/saldo) e exclusão de alteração confirmada verificados');
END $$;

-- ---------------------------------------------------------------- Financeiro: remessa OBN600 dos pagamentos
-- Migração 20261024090000_fin_remessa_obn600.sql (spec docs/superpowers/specs/2026-10-21-financeiro-remessa-obn600-design.md):
--   * registrar_remessa_obn600: sem pagamento.conciliar = 42501; conta sem código do cliente/UG/gestão, pagamento
--     sem conta, pago, repetido ou lista vazia = 22023; o servidor monta as OBs (tipo 31 antes de 32, nº da OB =
--     exercício + sequência do pagamento, relação = exercício + nº da remessa + tipo, conta do pagamento ou do
--     fornecedor) e reserva os pagamentos; nº inicial só na primeira remessa da conta;
--   * outro usuário não reserva os mesmos pagamentos nem confirma; confirmar grava o nº da OB em
--     identificador_transacao; pagamento já enviado não entra de novo; cancelar libera os pagamentos;
--   * o retorno OBN600 casa a OB com o pagamento pelo nº da OB e dá a baixa.
SET session_replication_role = replica;
DO $$
DECLARE
  forn_pf text := 'f4000000-0000-0000-0000-000000000001';
  cb text := 'f2000000-0000-0000-0000-000000000002';
  emp text := 'f2000000-0000-0000-0000-00000000000b'; liq text := 'f2000000-0000-0000-0000-00000000000f';
BEGIN
  PERFORM pg_temp.seed_row('fornecedores', jsonb_build_object('id', forn_pf, 'tipo_pessoa', 'PF',
    'cpf_cnpj', '111.222.333-44', 'razao_social', 'Credora Fictícia', 'banco_codigo', '001', 'agencia', '0250-X',
    'conta', '208685-9', 'endereco_logradouro', 'Rua A', 'endereco_numero', '10', 'endereco_bairro', 'Centro',
    'endereco_cidade', 'Boa Vista', 'endereco_uf', 'rr', 'endereco_cep', '69300-000'));
  -- 201: conta do cadastro do fornecedor (BB); 202: conta no próprio pagamento (outro banco); 203: sem conta;
  -- 204: já pago; 205: para o cancelamento
  PERFORM pg_temp.seed_row('fin_pagamentos', jsonb_build_object('id', 'f4000000-0000-0000-0000-000000000201', 'numero', 'OP-000201',
    'exercicio', 2026, 'fornecedor_id', forn_pf, 'empenho_id', emp, 'liquidacao_id', liq, 'conta_bancaria_id', cb,
    'valor_bruto', 1000, 'valor_retencoes', 100, 'forma_pagamento', 'ob', 'status', 'programado'));
  PERFORM pg_temp.seed_row('fin_pagamentos', jsonb_build_object('id', 'f4000000-0000-0000-0000-000000000202', 'numero', 'OP-000202',
    'exercicio', 2026, 'fornecedor_id', forn_pf, 'empenho_id', emp, 'liquidacao_id', liq, 'conta_bancaria_id', cb,
    'valor_bruto', 50.25, 'valor_retencoes', 0, 'forma_pagamento', 'ob', 'status', 'autorizado',
    'banco_favorecido', '341', 'agencia_favorecido', '6953', 'conta_favorecido', '36003-6'));
  PERFORM pg_temp.seed_row('fin_pagamentos', jsonb_build_object('id', 'f4000000-0000-0000-0000-000000000203', 'numero', 'OP-000203',
    'exercicio', 2026, 'fornecedor_id', 'f2000000-0000-0000-0000-000000000001', 'empenho_id', emp, 'liquidacao_id', liq,
    'conta_bancaria_id', cb, 'valor_bruto', 10, 'valor_retencoes', 0, 'forma_pagamento', 'ob', 'status', 'programado'));
  PERFORM pg_temp.seed_row('fin_pagamentos', jsonb_build_object('id', 'f4000000-0000-0000-0000-000000000204', 'numero', 'OP-000204',
    'exercicio', 2026, 'fornecedor_id', forn_pf, 'empenho_id', emp, 'liquidacao_id', liq, 'conta_bancaria_id', cb,
    'valor_bruto', 10, 'valor_retencoes', 0, 'forma_pagamento', 'ob', 'status', 'pago', 'data_efetivacao', '2026-10-01'));
  PERFORM pg_temp.seed_row('fin_pagamentos', jsonb_build_object('id', 'f4000000-0000-0000-0000-000000000205', 'numero', 'OP-000205',
    'exercicio', 2026, 'fornecedor_id', forn_pf, 'empenho_id', emp, 'liquidacao_id', liq, 'conta_bancaria_id', cb,
    'valor_bruto', 20, 'valor_retencoes', 0, 'forma_pagamento', 'ob', 'status', 'programado'));
  PERFORM pg_temp.seed_row('contas_autarquia', jsonb_build_object('id', 'f4000000-0000-0000-0000-000000000010',
    'descricao', 'Conta OBN teste', 'agencia', '1234', 'agencia_digito', '5', 'conta', '67890', 'conta_digito', '1',
    'obn_codigo_cliente', '123456789', 'obn_unidade_gestora', '000123', 'obn_gestao', '00001'));
END $$;
SET session_replication_role = origin;
DO $$
DECLARE
  u_conc uuid := 'f1000000-0000-0000-0000-000000000001'; u_conc2 uuid := 'f1000000-0000-0000-0000-000000000004';
  u_fin uuid := (SELECT uid FROM persona WHERE nome='mod_financeiro');
  p201 uuid := 'f4000000-0000-0000-0000-000000000201'; p202 uuid := 'f4000000-0000-0000-0000-000000000202';
  p203 uuid := 'f4000000-0000-0000-0000-000000000203'; p204 uuid := 'f4000000-0000-0000-0000-000000000204';
  p205 uuid := 'f4000000-0000-0000-0000-000000000205';
  cobn text := 'f4000000-0000-0000-0000-000000000010';
  csem text := 'f2000000-0000-0000-0000-000000000005';  -- conta pagadora sem os dados do OBN600
  hoje text := current_date::text;
  t text := 'SELECT public.registrar_remessa_obn600(%L, %L::uuid[], %L::date, %s)::text';
  r text; j jsonb; x record; rem uuid; hash_ok text := repeat('e', 64);
BEGIN
  PERFORM set_config('request.jwt.claims', '', true);
  IF to_regprocedure('public.registrar_remessa_obn600(uuid,uuid[],date,integer)') IS NULL THEN
    PERFORM pg_temp.falha('FIN OBN600: registrar_remessa_obn600 não existe');
    RETURN;
  END IF;
  IF has_function_privilege('anon', 'public.registrar_remessa_obn600(uuid,uuid[],date,integer)', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'public.registrar_remessa_obn600(uuid,uuid[],date,integer)', 'EXECUTE')
     OR NOT (SELECT prosecdef AND coalesce(proconfig::text, '') ~ 'search_path' FROM pg_proc
              WHERE oid = 'public.registrar_remessa_obn600(uuid,uuid[],date,integer)'::regprocedure) THEN
    PERFORM pg_temp.falha('FIN OBN600: privilégios, SECURITY DEFINER ou search_path de registrar_remessa_obn600');
  END IF;

  r := pg_temp.valor_desfeito_como(u_fin, 'authenticated', format(t, cobn, ARRAY[p201], hoje, 'NULL'));
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('FIN OBN600: módulo sem pagamento.conciliar gera remessa (' || left(r, 100) || ')'); END IF;
  FOR x IN SELECT * FROM (VALUES
      ('conta sem código do cliente/UG/gestão', csem, ARRAY[p201]::text),
      ('pagamento sem conta', cobn, ARRAY[p203]::text),
      ('pagamento já pago', cobn, ARRAY[p204]::text),
      ('pagamento repetido', cobn, ARRAY[p201, p201]::text),
      ('lista vazia', cobn, '{}')) v(caso, conta, pags) LOOP
    r := pg_temp.valor_desfeito_como(u_conc, 'authenticated', format(t, x.conta, x.pags, hoje, 'NULL'));
    IF r NOT LIKE 'erro:22023:%' THEN PERFORM pg_temp.falha(format('FIN OBN600: %s aceito (%s)', x.caso, left(r, 100))); END IF;
  END LOOP;

  -- reserva [201 (BB), 202 (outro banco)] com nº inicial 74466: a OB de outro banco (31) vem antes
  r := pg_temp.fin_valor_como(u_conc, 'authenticated', format(t, cobn, ARRAY[p201, p202], hoje, '74466'));
  IF r LIKE 'erro:%' THEN PERFORM pg_temp.falha('FIN OBN600: reserva falhou (' || r || ')'); r := '{}'; END IF;
  j := r::jsonb; rem := (j->>'id')::uuid;
  IF j->>'layout' IS DISTINCT FROM 'obn600' OR (j->>'nsa')::int IS DISTINCT FROM 74466 OR j->>'convenio' IS DISTINCT FROM '123456789'
     OR j->'parametros' IS DISTINCT FROM '{"gestao": "00001", "unidade_gestora": "000123"}'::jsonb
     OR jsonb_array_length(COALESCE(j->'creditos', '[]')) <> 2 OR j ? 'arquivo_sha256' THEN
    PERFORM pg_temp.falha('FIN OBN600: retorno da reserva fora do formato (' || left(r, 300) || ')');
  END IF;
  IF j->'creditos'->0 @> jsonb_build_object('pagamento_id', p202, 'numero_ob', '02026000202', 'relacao', '20267446631',
                                             'banco', '341', 'agencia', '6953', 'agencia_dv', '', 'conta', '36003', 'conta_dv', '6',
                                             'valor', 50.25, 'documento', '11122233344') IS NOT TRUE
     OR j->'creditos'->1 @> jsonb_build_object('pagamento_id', p201, 'numero_ob', '02026000201', 'relacao', '20267446632',
                                             'banco', '001', 'agencia', '0250', 'agencia_dv', 'X', 'conta', '208685', 'conta_dv', '9',
                                             'valor', 900, 'nome', 'Credora Fictícia', 'endereco', 'Rua A, 10 - Centro',
                                             'municipio', 'Boa Vista', 'cep', '69300000', 'uf', 'RR') IS NOT TRUE THEN
    PERFORM pg_temp.falha('FIN OBN600: OBs não montadas pelo servidor como esperado (' || left(j->>'creditos', 400) || ')');
  END IF;
  IF (SELECT quantidade || '|' || valor_total FROM public.fin_remessas_bancarias WHERE id = rem) IS DISTINCT FROM '2|950.25'
     OR (SELECT count(*) FROM public.fin_pagamentos WHERE remessa_bancaria_id = rem) <> 2 THEN
    PERFORM pg_temp.falha('FIN OBN600: quantidade/valor não calculados no servidor ou pagamentos não reservados');
  END IF;
  -- outro usuário: não reserva os mesmos pagamentos nem confirma
  r := pg_temp.valor_desfeito_como(u_conc2, 'authenticated', format(t, cobn, ARRAY[p201], hoje, 'NULL'));
  IF r NOT LIKE 'erro:22023:%' THEN PERFORM pg_temp.falha('FIN OBN600: pagamento reservado por outro usuário entrou noutra remessa (' || left(r, 100) || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_conc2, 'authenticated', format('SELECT public.confirmar_remessa_bancaria(%L, %L)::text', rem, hash_ok));
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('FIN OBN600: outro usuário confirmou a reserva (' || r || ')'); END IF;
  -- confirmação grava o nº da OB nos pagamentos
  r := pg_temp.fin_valor_como(u_conc, 'authenticated', format('SELECT public.confirmar_remessa_bancaria(%L, %L)->>''pagamentos_marcados''', rem, hash_ok));
  IF r <> '2' OR (SELECT identificador_transacao FROM public.fin_pagamentos WHERE id = p201) IS DISTINCT FROM '02026000201'
     OR (SELECT identificador_transacao FROM public.fin_pagamentos WHERE id = p202) IS DISTINCT FROM '02026000202' THEN
    PERFORM pg_temp.falha('FIN OBN600: confirmação não gravou o nº da OB nos pagamentos (' || r || ')');
  END IF;
  r := pg_temp.valor_desfeito_como(u_conc, 'authenticated', format(t, cobn, ARRAY[p201], hoje, 'NULL'));
  IF r NOT LIKE 'erro:22023:%' THEN PERFORM pg_temp.falha('FIN OBN600: pagamento já enviado aceito de novo (' || left(r, 100) || ')'); END IF;
  -- pela API (módulo e admin): não tira da remessa nem muda valor/conta/nº da OB de pagamento enviado
  FOR x IN SELECT * FROM (VALUES ('mod_financeiro', u_fin), ('admin', (SELECT uid FROM persona WHERE nome='admin'))) v(quem, uid) LOOP
    FOREACH t IN ARRAY ARRAY['remessa_bancaria_id = NULL', 'valor_bruto = 2000', 'conta_favorecido = ''1-1''',
                             'identificador_transacao = ''X''', 'fornecedor_id = NULL'] LOOP
      r := pg_temp.sql_como(x.uid, 'authenticated', format('UPDATE public.fin_pagamentos SET %s WHERE id = %L', t, p201));
      IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha(format('FIN OBN600: %s mudou pagamento enviado pela API (%s: %s)', x.quem, t, r)); END IF;
    END LOOP;
    r := pg_temp.sql_como(x.uid, 'authenticated', format('UPDATE public.fin_pagamentos SET remessa_bancaria_id = %L WHERE id = %L', rem, p205));
    IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha(format('FIN OBN600: %s pôs pagamento numa remessa pela API (%s)', x.quem, r)); END IF;
    r := pg_temp.sql_como(x.uid, 'authenticated', format('UPDATE public.fin_pagamentos SET observacoes = ''nota'' WHERE id = %L', p201));
    IF r <> 'ok:1' THEN PERFORM pg_temp.falha(format('FIN OBN600: %s não muda observação de pagamento enviado (%s)', x.quem, r)); END IF;
  END LOOP;
  t := 'SELECT public.registrar_remessa_obn600(%L, %L::uuid[], %L::date, %s)::text';
  r := pg_temp.valor_desfeito_como(u_conc, 'authenticated', format('SELECT public.obter_remessa_bancaria(%L)->>''arquivo_sha256''', rem));
  IF r IS DISTINCT FROM hash_ok THEN PERFORM pg_temp.falha('FIN OBN600: obter_remessa_bancaria sem o hash confirmado (' || r || ')'); END IF;

  -- nº inicial ignorado depois da primeira remessa; cancelar libera os pagamentos
  r := pg_temp.fin_valor_como(u_conc, 'authenticated', format(t, cobn, ARRAY[p205], hoje, '500'));
  IF r LIKE 'erro:%' OR (r::jsonb->>'nsa')::int <> 74467 THEN PERFORM pg_temp.falha('FIN OBN600: próximo nº não é max + 1 (' || left(r, 120) || ')'); r := '{}'; END IF;
  r := pg_temp.fin_valor_como(u_conc, 'authenticated', format('SELECT public.cancelar_remessa_bancaria(%L)->>''pagamentos_liberados''', (r::jsonb->>'id')));
  IF r <> '1' OR (SELECT remessa_bancaria_id FROM public.fin_pagamentos WHERE id = p205) IS NOT NULL THEN
    PERFORM pg_temp.falha('FIN OBN600: cancelar não liberou o pagamento (' || r || ')');
  END IF;

  -- retorno OBN600: a OB 02026000201 paga casa com o pagamento 201 pelo nº da OB e dá a baixa
  r := pg_temp.fin_valor_como(u_conc, 'authenticated', format('SELECT public.importar_arquivo_bancario(%L::jsonb, %L::jsonb, %L::jsonb, false)::text',
         '[{"tipo_lancamento":"credito_bb","identificador":"02026000201","favorecido_documento":"11122233344","valor":900,'
         '"data_pagamento":"' || hoje || '","data_efetivacao":"' || hoje || '","situacao":"pago","codigo_retorno":"01"}]',
         '{"nome":"OBN600_RET_TESTE.txt","sha256":"' || repeat('f', 64) || '","tamanho":1054}',
         '{"origem":"obn600","sentido":"retorno","data_arquivo":"' || hoje || '","sequencial_arquivo":"74466"}'));
  IF r LIKE 'erro:%' OR (SELECT status::text || '|' || data_efetivacao FROM public.fin_pagamentos WHERE id = p201) IS DISTINCT FROM 'pago|' || hoje THEN
    PERFORM pg_temp.falha('FIN OBN600: retorno não deu baixa no pagamento pelo nº da OB (' || left(r, 160) || ')');
  END IF;

  PERFORM pg_temp.nota('FIN OBN600: permissão, regras de entrada, montagem das OBs no servidor, numeração, reserva/confirmação/cancelamento, trava do pagamento enviado pela API e baixa pelo retorno verificados');
END $$;

-- ---------------------------------------------------------------- Financeiro: conciliação mensal (TRIGGERS LIGADOS)
-- Migração 20261026090000_fin_conciliacao_mensal.sql (spec docs/superpowers/specs/2026-10-21-financeiro-conciliacao-mensal-design.md):
--   * RPCs só para authenticated; reabrir é SECURITY DEFINER com search_path; módulo sem pagamento.conciliar não grava;
--   * competência no dia 1; o mês nasce rascunho (INSERT direto com situacao fechada vira rascunho) e só fecha pela
--     fechar_conciliacao_mensal, que confere ajustado = conta + fundo (22023 se não bate; UPDATE direto = 42501);
--   * mês fechado não muda (salvar, itens, cabeçalho, nem o admin pela API; set_config sem ser admin não destranca);
--   * pendência anterior só de pendente do mês imediatamente anterior fechado da mesma conta, uma vez só;
--   * reabrir só pelo admin, com motivo, e não com mês posterior fechado; o motivo vai para as observações.
DO $$
DECLARE
  u_conc uuid := 'f1000000-0000-0000-0000-000000000001';
  u_fin uuid := (SELECT uid FROM persona WHERE nome='mod_financeiro');
  u_admin uuid := (SELECT uid FROM persona WHERE nome='admin');
  cb text := 'f2000000-0000-0000-0000-000000000002';
  salvar text := 'SELECT public.salvar_conciliacao_mensal(%L, %L::date, %L::jsonb, %L::jsonb)::text';
  dados_ok text := '{"saldo_razao": 1000, "saldo_conta": 1100, "saldo_fundo": 0, "rendimento_fundo": 0}';
  itens_set text := '[{"lado":"contabil","natureza":"credito","data":"2026-09-20","documento":"00001.0001.26.00090-1","tipo":"NOB","valor":100,"situacao":"pendente"},'
    '{"lado":"contabil","natureza":"credito","data":"2026-09-10","valor":50,"situacao":"casado","grupo":1,"regra":"valor_data"},'
    '{"lado":"bancario","natureza":"debito","data":"2026-09-10","valor":50,"situacao":"casado","grupo":1,"regra":"valor_data"}]';
  r text; f text; set_id uuid; out_id uuid; pend uuid; casado uuid; x record;
BEGIN
  PERFORM set_config('request.jwt.claims', '', true);
  FOR x IN SELECT unnest(ARRAY['public.salvar_conciliacao_mensal(uuid,date,jsonb,jsonb)', 'public.fechar_conciliacao_mensal(uuid)',
                               'public.reabrir_conciliacao_mensal(uuid,text)']) AS fn LOOP
    IF to_regprocedure(x.fn) IS NULL THEN PERFORM pg_temp.falha('FIN CONC: ' || x.fn || ' não existe'); RETURN; END IF;
    IF has_function_privilege('anon', x.fn, 'EXECUTE') OR NOT has_function_privilege('authenticated', x.fn, 'EXECUTE')
       OR NOT (SELECT coalesce(proconfig::text, '') ~ 'search_path' FROM pg_proc WHERE oid = x.fn::regprocedure) THEN
      PERFORM pg_temp.falha('FIN CONC: privilégios ou search_path de ' || x.fn);
    END IF;
  END LOOP;
  IF NOT (SELECT prosecdef FROM pg_proc WHERE oid = 'public.reabrir_conciliacao_mensal(uuid,text)'::regprocedure)
     OR (SELECT prosecdef FROM pg_proc WHERE oid = 'public.salvar_conciliacao_mensal(uuid,date,jsonb,jsonb)'::regprocedure) THEN
    PERFORM pg_temp.falha('FIN CONC: salvar deve ser INVOKER (RLS vale) e reabrir DEFINER');
  END IF;

  -- módulo sem a permissão não grava; competência fora do dia 1 é recusada
  r := pg_temp.valor_desfeito_como(u_fin, 'authenticated', format(salvar, cb, '2026-09-01', dados_ok, itens_set));
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('FIN CONC: módulo sem pagamento.conciliar grava (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_conc, 'authenticated', format(salvar, cb, '2026-09-15', dados_ok, itens_set));
  IF r NOT LIKE 'erro:22023:%' THEN PERFORM pg_temp.falha('FIN CONC: competência no dia 15 aceita (' || r || ')'); END IF;
  -- INSERT direto não nasce fechado
  r := pg_temp.valor_desfeito_como(u_conc, 'authenticated', format(
    'INSERT INTO public.fin_conciliacoes_mensais (conta_bancaria_id, competencia, saldo_razao, situacao, fechada_em) '
    'VALUES (%L, ''2026-12-01'', 0, ''fechada'', now()) RETURNING situacao || coalesce(fechada_em::text, '''')', cb));
  IF r <> 'rascunho' THEN PERFORM pg_temp.falha('FIN CONC: INSERT direto nasceu fechado (' || r || ')'); END IF;

  -- setembro: rascunho com o extrato errado não fecha; com o certo fecha
  r := pg_temp.fin_valor_como(u_conc, 'authenticated', format(salvar, cb, '2026-09-01',
         '{"saldo_razao": 1000, "saldo_conta": 1000, "saldo_fundo": 0}', itens_set));
  IF r LIKE 'erro:%' THEN PERFORM pg_temp.falha('FIN CONC: salvar setembro falhou (' || r || ')'); RETURN; END IF;
  set_id := r::uuid;
  r := pg_temp.sql_como(u_conc, 'authenticated', format('UPDATE public.fin_conciliacoes_mensais SET situacao = ''fechada'' WHERE id = %L', set_id));
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('FIN CONC: fechou por UPDATE direto (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_conc, 'authenticated', format('SELECT public.fechar_conciliacao_mensal(%L)::text', set_id));
  IF r NOT LIKE 'erro:22023:%' THEN PERFORM pg_temp.falha('FIN CONC: fechou com o quadro sem bater (' || r || ')'); END IF;
  r := pg_temp.fin_valor_como(u_conc, 'authenticated', format(salvar, cb, '2026-09-01', dados_ok, itens_set));
  IF r IS DISTINCT FROM set_id::text OR (SELECT count(*) FROM public.fin_conciliacao_itens WHERE conciliacao_id = set_id) <> 3 THEN
    PERFORM pg_temp.falha('FIN CONC: salvar de novo não trocou os itens do mesmo mês (' || r || ')');
  END IF;
  r := pg_temp.fin_valor_como(u_conc, 'authenticated', format('SELECT public.fechar_conciliacao_mensal(%L)::text', set_id));
  IF r LIKE 'erro:%' OR (SELECT situacao || (fechada_por = u_conc)::text FROM public.fin_conciliacoes_mensais WHERE id = set_id) <> 'fechadatrue' THEN
    PERFORM pg_temp.falha('FIN CONC: fechar setembro falhou (' || r || ')');
  END IF;

  -- fechado não muda: salvar, itens, cabeçalho (nem o admin), nem com set_config sem ser admin
  r := pg_temp.valor_desfeito_como(u_conc, 'authenticated', format(salvar, cb, '2026-09-01', dados_ok, '[]'));
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('FIN CONC: salvou mês fechado (' || r || ')'); END IF;
  FOR x IN SELECT * FROM (VALUES
      ('item', u_conc, format('UPDATE public.fin_conciliacao_itens SET justificativa = ''x'' WHERE conciliacao_id = %L', set_id)),
      ('item apagado', u_conc, format('DELETE FROM public.fin_conciliacao_itens WHERE conciliacao_id = %L', set_id)),
      ('item novo', u_conc, format('INSERT INTO public.fin_conciliacao_itens (conciliacao_id, lado, natureza, data, valor, situacao) VALUES (%L, ''bancario'', ''debito'', ''2026-09-30'', 1, ''pendente'')', set_id)),
      ('cabeçalho', u_conc, format('UPDATE public.fin_conciliacoes_mensais SET observacoes = ''x'' WHERE id = %L', set_id)),
      ('cabeçalho pelo admin', u_admin, format('UPDATE public.fin_conciliacoes_mensais SET saldo_conta = 1 WHERE id = %L', set_id)),
      ('set_config sem ser admin', u_conc, format('WITH s AS (SELECT set_config(''idjuv.reabrindo_conciliacao'', %L, true) v) '
         'UPDATE public.fin_conciliacoes_mensais SET situacao = ''rascunho'' WHERE id = %L AND EXISTS (SELECT 1 FROM s)', set_id, set_id))
    ) v(caso, uid, cmd) LOOP
    r := pg_temp.sql_como(x.uid, 'authenticated', x.cmd);
    IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha(format('FIN CONC: mês fechado mudou (%s: %s)', x.caso, r)); END IF;
  END LOOP;

  -- outubro: traz a pendência de setembro; casada, repetida ou de outro mês não
  SELECT id INTO pend FROM public.fin_conciliacao_itens WHERE conciliacao_id = set_id AND situacao = 'pendente';
  SELECT id INTO casado FROM public.fin_conciliacao_itens WHERE conciliacao_id = set_id AND situacao = 'casado' LIMIT 1;
  f := '{"lado":"contabil","natureza":"credito","data":"2026-09-20","valor":100,"situacao":"pendente","origem":"anterior","item_origem_id":"%s"}';
  FOR x IN SELECT * FROM (VALUES
      ('item casado', '2026-10-01', '[' || format(f, casado) || ']'),
      ('repetida', '2026-10-01', '[' || format(f, pend) || ',' || format(f, pend) || ']'),
      ('pulando um mês', '2026-11-01', '[' || format(f, pend) || ']')) v(caso, comp, itens) LOOP
    r := pg_temp.valor_desfeito_como(u_conc, 'authenticated', format(salvar, cb, x.comp, dados_ok, x.itens));
    IF r NOT LIKE 'erro:22023:%' THEN PERFORM pg_temp.falha(format('FIN CONC: pendência anterior aceita (%s: %s)', x.caso, r)); END IF;
  END LOOP;
  r := pg_temp.fin_valor_como(u_conc, 'authenticated', format(salvar, cb, '2026-10-01', dados_ok, '[' || format(f, pend) || ']'));
  IF r LIKE 'erro:%' THEN PERFORM pg_temp.falha('FIN CONC: pendência de setembro recusada em outubro (' || r || ')'); RETURN; END IF;
  out_id := r::uuid;
  r := pg_temp.fin_valor_como(u_conc, 'authenticated', format('SELECT public.fechar_conciliacao_mensal(%L)::text', out_id));
  IF r LIKE 'erro:%' THEN PERFORM pg_temp.falha('FIN CONC: fechar outubro falhou (' || r || ')'); END IF;

  -- reabrir: só admin, com motivo, do mais recente para trás
  r := pg_temp.valor_desfeito_como(u_conc, 'authenticated', format('SELECT public.reabrir_conciliacao_mensal(%L, ''motivo do teste'')::text', out_id));
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('FIN CONC: não admin reabriu (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_admin, 'authenticated', format('SELECT public.reabrir_conciliacao_mensal(%L, ''x'')::text', out_id));
  IF r NOT LIKE 'erro:22023:%' THEN PERFORM pg_temp.falha('FIN CONC: reabriu sem motivo (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_admin, 'authenticated', format('SELECT public.reabrir_conciliacao_mensal(%L, ''motivo do teste'')::text', set_id));
  IF r NOT LIKE 'erro:22023:%' THEN PERFORM pg_temp.falha('FIN CONC: reabriu setembro com outubro fechado (' || r || ')'); END IF;
  r := pg_temp.fin_valor_como(u_admin, 'authenticated', format('SELECT public.reabrir_conciliacao_mensal(%L, ''motivo do teste'')::text', out_id));
  IF r LIKE 'erro:%' OR (SELECT situacao FROM public.fin_conciliacoes_mensais WHERE id = out_id) <> 'rascunho'
     OR (SELECT observacoes FROM public.fin_conciliacoes_mensais WHERE id = out_id) NOT LIKE '%Reaberta em%motivo do teste' THEN
    PERFORM pg_temp.falha('FIN CONC: admin não reabriu outubro (' || r || ')');
  END IF;
  r := pg_temp.fin_valor_como(u_admin, 'authenticated', format('SELECT public.reabrir_conciliacao_mensal(%L, ''motivo do teste'')::text', set_id));
  IF r LIKE 'erro:%' THEN PERFORM pg_temp.falha('FIN CONC: admin não reabriu setembro depois de outubro (' || r || ')'); END IF;

  PERFORM pg_temp.nota('FIN CONC: permissão, competência, nascimento em rascunho, fechamento conferido no servidor, trava do mês fechado, corrente de pendências e reabertura pelo admin verificados');
END $$;

-- ---------------------------------------------------------------- Lançamento por setor (fase 1) (TRIGGERS LIGADOS)
-- Migração 20261011020000_lancamento_por_setor.sql (spec docs/superpowers/specs/2026-10-11-lancamento-por-setor-design.md):
--   * catálogo: regra_lancamento com rh = registrar e os demais desligado; rh.comissoes.gerenciar só para o papel admin;
--   * cobertura: lancamento_modulos_tabela cobre exatamente as tabelas do RH do mapa (menos as de trilha), com rh entre
--     os módulos, e cada uma tem zz_exigir_setor e zz_exigir_setor_fim ligados; funções internas fora da API; as duas
--     RPCs só para authenticated;
--   * modo desligado: grava e a trilha não leva fundamento; modo registrar: grava e a trilha leva o negado; modo exigir:
--     recusa (RHS01, nome do módulo na mensagem) sem servidor, sem login (authenticated sem uid) e fora do setor,
--     também no DELETE; modo mais restritivo entre os módulos da tabela (rh + financeiro);
--   * fundamentos: lotação (com e sem subordinadas; externa, inativa, encerrada, futura e autoconcedida não valem),
--     cessão de entrada (a de saída não vale), designação aprovada por outra pessoa, vigente e com ato (sem ato, fora do
--     período, pendente, fora do setor, sem aprovador, aprovada pelo próprio ou por quem a lançou não vale), comissão
--     não é fundamento na fase 1, autoatendimento (só o pedido ainda sem decisão), chefia (trigger real e
--     fundamento_linha), sistema; ciclo na estrutura não trava;
--   * cascata: a que descende de gravação checada leva em_cascata (comissão -> membros); a que começa fora da regra
--     (estrutura_organizacional -> lotacoes) é checada (recusa em exigir, negado na trilha em registrar);
--   * admin sem servidor: recusado no RH em exigir, mas configura o acesso; o modo exigir não entra pela API; regra sem
--     DELETE; membros de comissão sem autoconcessão;
--   * cache por transação; data_local() com fuso configurável; log_audit e registrar_evento com unidade e fundamento;
--   * meus_fundamentos_lancamento (linhas por módulo, filtro opcional) e saneamento_lancamento (fundamento_autoconcedido).
-- Banco anterior à migração: o bloco reprova sem abortar.
SET session_replication_role = replica;  -- cenário sem disparar triggers (as FKs valem: os ids abaixo existem)
DO $$
DECLARE
  sa uuid := 'b0000000-0000-0000-0000-00000000000a';
  u_admin uuid := (SELECT uid FROM persona WHERE nome='admin');
  u_ch uuid := (SELECT uid FROM persona WHERE nome='perm_rh.aprovar');
  e_rh uuid := 'f5000000-0000-0000-0000-000000000001'; e_sub uuid := 'f5000000-0000-0000-0000-000000000002';
  e_out uuid := 'f5000000-0000-0000-0000-000000000003'; e_pat uuid := 'f5000000-0000-0000-0000-000000000004';
  e_fin uuid := 'f5000000-0000-0000-0000-000000000005'; e_c1 uuid := 'f5000000-0000-0000-0000-000000000006';
  e_c2 uuid := 'f5000000-0000-0000-0000-000000000007'; e_tmp1 uuid := 'f5000000-0000-0000-0000-000000000008';
  e_tmp2 uuid := 'f5000000-0000-0000-0000-000000000009';
BEGIN
  IF to_regclass('public.regra_lancamento') IS NULL THEN RETURN; END IF;
  -- linhas das sementes genéricas (ids e unidades fictícios) saem: o cenário fica determinístico
  DELETE FROM public.comissoes_membros; DELETE FROM public.comissoes; DELETE FROM public.setores_modulo;
  INSERT INTO public.estrutura_organizacional (id, nome, tipo, superior_id) VALUES
    (e_rh, 'LS RH', 'diretoria', NULL), (e_sub, 'LS RH folha', 'divisao', e_rh),
    (e_out, 'LS Outra', 'diretoria', NULL), (e_pat, 'LS Patrimônio', 'diretoria', NULL),
    (e_fin, 'LS Financeiro', 'diretoria', NULL), (e_c1, 'LS Ciclo 1', 'divisao', NULL), (e_c2, 'LS Ciclo 2', 'divisao', e_c1),
    (e_tmp1, 'LS Temporária 1', 'setor', NULL), (e_tmp2, 'LS Temporária 2', 'setor', NULL);
  UPDATE public.estrutura_organizacional SET superior_id = e_c2 WHERE id = e_c1;   -- ciclo: c1 acima de c2 acima de c1
  INSERT INTO public.servidores (id, nome_completo, cpf, matricula, situacao, ativo, unidade_atual_id) VALUES
    ('f5000000-0000-0000-0000-000000000011', 'LS Lotado', '000.000.511-11', 'LS-11', 'ativo', true, NULL),
    ('f5000000-0000-0000-0000-000000000012', 'LS Designado', '000.000.512-12', 'LS-12', 'ativo', true, e_out),
    ('f5000000-0000-0000-0000-000000000013', 'LS Comissão', '000.000.513-13', 'LS-13', 'ativo', true, e_out),
    ('f5000000-0000-0000-0000-000000000014', 'LS Chefe', '000.000.514-14', 'LS-14', 'ativo', true, e_out),
    ('f5000000-0000-0000-0000-000000000015', 'LS Sem login', '000.000.515-15', 'LS-15', 'ativo', true, NULL),
    ('f5000000-0000-0000-0000-000000000016', 'LS Fora', '000.000.516-16', 'LS-16', 'ativo', true, e_out),
    ('f5000000-0000-0000-0000-000000000017', 'LS Exonerado', '000.000.517-17', 'LS-17', 'exonerado', true, NULL),
    ('f5000000-0000-0000-0000-000000000018', 'LS Cedido', '000.000.518-18', 'LS-18', 'ativo', true, e_rh),
    ('f5000000-0000-0000-0000-000000000019', 'LS Autolotado', '000.000.519-19', 'LS-19', 'ativo', true, e_rh),
    ('f5000000-0000-0000-0000-00000000001a', 'LS Financeiro', '000.000.51a-1a', 'LS-1A', 'ativo', true, e_fin),
    ('f5000000-0000-0000-0000-00000000001b', 'LS Ciclo', '000.000.51b-1b', 'LS-1B', 'ativo', true, e_c1),
    ('f5000000-0000-0000-0000-00000000001c', 'LS Temporário', '000.000.51c-1c', 'LS-1C', 'ativo', true, NULL);
  INSERT INTO public.lotacoes (id, servidor_id, unidade_id, data_inicio, ativo, tipo_lotacao, ato_tipo, ato_numero, ato_data, created_by_servidor_id) VALUES
    ('f5000000-0000-0000-0000-000000000021', 'f5000000-0000-0000-0000-000000000011', e_sub, current_date - 30, true, 'lotacao_interna', 'portaria', 'LS-P-1/2026', current_date - 31, NULL),
    ('f5000000-0000-0000-0000-000000000022', 'f5000000-0000-0000-0000-000000000012', e_out, current_date - 30, true, 'lotacao_interna', NULL, NULL, NULL, NULL),
    ('f5000000-0000-0000-0000-000000000023', 'f5000000-0000-0000-0000-000000000013', e_out, current_date - 30, true, 'lotacao_interna', NULL, NULL, NULL, NULL),
    ('f5000000-0000-0000-0000-000000000024', 'f5000000-0000-0000-0000-000000000014', e_out, current_date - 30, true, 'lotacao_interna', NULL, NULL, NULL, NULL),
    ('f5000000-0000-0000-0000-000000000026', 'f5000000-0000-0000-0000-000000000016', e_out, current_date - 30, true, 'lotacao_interna', NULL, NULL, NULL, NULL),
    -- lançada pelo próprio servidor (autoria E1): autoconcedida, não vale
    ('f5000000-0000-0000-0000-000000000028', 'f5000000-0000-0000-0000-000000000019', e_rh, current_date - 30, true, 'lotacao_interna', NULL, NULL, NULL, 'f5000000-0000-0000-0000-000000000019'),
    ('f5000000-0000-0000-0000-000000000029', 'f5000000-0000-0000-0000-00000000001a', e_fin, current_date - 30, true, 'lotacao_interna', NULL, NULL, NULL, NULL),
    ('f5000000-0000-0000-0000-00000000002a', 'f5000000-0000-0000-0000-00000000001b', e_c2, current_date - 30, true, 'lotacao_interna', NULL, NULL, NULL, NULL),
    ('f5000000-0000-0000-0000-00000000002b', 'f5000000-0000-0000-0000-00000000001c', e_tmp1, current_date - 30, true, 'lotacao_interna', NULL, NULL, NULL, NULL);
  -- cessão de entrada do servidor 18 com unidade no RH (premissa 4)
  INSERT INTO public.cessoes (id, servidor_id, tipo, data_inicio, ativa, unidade_idjuv_id, ato_tipo, ato_numero, ato_data) VALUES
    ('f5000000-0000-0000-0000-000000000071', 'f5000000-0000-0000-0000-000000000018', 'entrada', current_date - 20, true, e_rh, 'decreto', 'LS-CE-2/2026', current_date - 21);
  -- designação do servidor 12 para o RH: aprovada pelo admin (outra pessoa), lançada pela chefia; começa SEM ato
  INSERT INTO public.designacoes (id, servidor_id, unidade_origem_id, unidade_destino_id, data_inicio, data_fim, status, ativo, aprovado_por, data_aprovacao, created_by) VALUES
    ('f5000000-0000-0000-0000-000000000031', 'f5000000-0000-0000-0000-000000000012', e_out, e_rh, current_date - 5, current_date + 30, 'aprovada', true, u_admin, now(), u_ch);
  -- comissão `outra`, sem objeto, com o servidor 13: cadastro, não fundamento (premissa 6)
  INSERT INTO public.comissoes (id, nome, tipo, modulo, ato_tipo, ato_numero, ato_data, data_inicio, data_fim, motivo) VALUES
    ('f5000000-0000-0000-0000-000000000041', 'LS Comissão de teste', 'outra', 'rh', 'portaria', 'LS-C-7/2026', current_date - 10, current_date - 10, current_date + 30, 'teste');
  INSERT INTO public.comissoes_membros (id, comissao_id, servidor_id, papel) VALUES
    ('f5000000-0000-0000-0000-000000000042', 'f5000000-0000-0000-0000-000000000041', 'f5000000-0000-0000-0000-000000000013', 'presidente');
  -- abono pendente do servidor A (decisão da chefia) e fechamento de frequência a validar
  INSERT INTO public.solicitacoes_abono (id, servidor_id, tipo_abono_id, data_inicio, data_fim, justificativa, status) VALUES
    ('f5000000-0000-0000-0000-000000000051', sa, pg_temp.seed_row('tipos_abono', '{"exige_aprovacao_rh": true}'::jsonb)::uuid,
     current_date, current_date, 'LS teste', 'pendente');
  INSERT INTO public.frequencia_fechamento (id, servidor_id, ano, mes) VALUES ('f5000000-0000-0000-0000-000000000052', sa, 2032, 1);
END $$;
SET session_replication_role = origin;

CREATE FUNCTION pg_temp.ls_sistema() RETURNS void LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claims', '', true); SELECT set_config('request.headers', '', true);
$$;

DO $$
DECLARE
  u_admin uuid := (SELECT uid FROM persona WHERE nome='admin');
  u_rh uuid := (SELECT uid FROM persona WHERE nome='mod_rh');
  u_lanc uuid := (SELECT uid FROM persona WHERE nome='perm_rh.frequencia.lancar');                       -- o "lançador" (relinkado abaixo)
  u_ch uuid := (SELECT uid FROM persona WHERE nome='perm_rh.aprovar');              -- chefia
  u_rhp uuid := (SELECT uid FROM persona WHERE nome='perm_rh.frequencia.lancar');   -- RH da frequência
  u_cg uuid := (SELECT uid FROM persona WHERE nome='perm_rh.comissoes.gerenciar');  -- cadastra comissões
  u_a uuid := (SELECT uid FROM persona WHERE nome='srv_a');                          -- servidor A
  u_inativo uuid := (SELECT uid FROM persona WHERE nome='inativo');
  sa uuid := 'b0000000-0000-0000-0000-00000000000a';
  sb uuid := 'b0000000-0000-0000-0000-00000000000b';
  ponto_a uuid := (SELECT id_a FROM semeado WHERE tabela = 'registros_ponto')::uuid;
  e_rh uuid := 'f5000000-0000-0000-0000-000000000001'; e_sub uuid := 'f5000000-0000-0000-0000-000000000002';
  e_out uuid := 'f5000000-0000-0000-0000-000000000003'; e_pat uuid := 'f5000000-0000-0000-0000-000000000004';
  e_fin uuid := 'f5000000-0000-0000-0000-000000000005'; e_c1 uuid := 'f5000000-0000-0000-0000-000000000006';
  e_c2 uuid := 'f5000000-0000-0000-0000-000000000007'; e_tmp1 uuid := 'f5000000-0000-0000-0000-000000000008';
  e_tmp2 uuid := 'f5000000-0000-0000-0000-000000000009';
  s_lot uuid := 'f5000000-0000-0000-0000-000000000011'; s_des uuid := 'f5000000-0000-0000-0000-000000000012';
  s_com uuid := 'f5000000-0000-0000-0000-000000000013'; s_ch uuid := 'f5000000-0000-0000-0000-000000000014';
  s_sem uuid := 'f5000000-0000-0000-0000-000000000015'; s_fora uuid := 'f5000000-0000-0000-0000-000000000016';
  s_exo uuid := 'f5000000-0000-0000-0000-000000000017'; s_ces uuid := 'f5000000-0000-0000-0000-000000000018';
  s_auto uuid := 'f5000000-0000-0000-0000-000000000019'; s_fin uuid := 'f5000000-0000-0000-0000-00000000001a';
  s_cic uuid := 'f5000000-0000-0000-0000-00000000001b'; s_tmp uuid := 'f5000000-0000-0000-0000-00000000001c';
  l_lot uuid := 'f5000000-0000-0000-0000-000000000021'; l_tmp uuid := 'f5000000-0000-0000-0000-00000000002b';
  ces uuid := 'f5000000-0000-0000-0000-000000000071';
  d1 uuid := 'f5000000-0000-0000-0000-000000000031';
  c1 uuid := 'f5000000-0000-0000-0000-000000000041'; cm1 uuid := 'f5000000-0000-0000-0000-000000000042';
  ab uuid := 'f5000000-0000-0000-0000-000000000051'; ff uuid := 'f5000000-0000-0000-0000-000000000052';
  sm_rh uuid := 'f5000000-0000-0000-0000-000000000061';
  tag text := 'INSERT INTO public.servidor_tags (nome) VALUES (''LS tag'')';
  perm_antes text[];
  r text; j jsonb; n int; t text; x record; v_tabelas text[];
BEGIN
  PERFORM pg_temp.ls_sistema();
  IF to_regclass('public.regra_lancamento') IS NULL OR to_regprocedure('public.fundamento_lancamento(text[])') IS NULL
     OR to_regprocedure('public.data_local()') IS NULL THEN
    PERFORM pg_temp.falha('lançamento por setor: migração 20261011020000_lancamento_por_setor.sql ausente ou antiga (regra_lancamento/fundamento_lancamento/data_local)');
    RETURN;
  END IF;

  -- ===== catálogo
  IF (SELECT modo FROM public.regra_lancamento WHERE modulo = 'rh') IS DISTINCT FROM 'registrar'
     OR EXISTS (SELECT 1 FROM public.regra_lancamento WHERE modulo <> 'rh' AND modo <> 'desligado')
     OR (SELECT count(DISTINCT modulo) FROM public.regra_lancamento) <> (SELECT count(*) FROM unnest(enum_range(NULL::public.app_module))) THEN
    PERFORM pg_temp.falha('lançamento por setor: catálogo de regra_lancamento não é rh = registrar e os demais desligado, um por módulo');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.module_permissions_catalog WHERE permission_code = 'rh.comissoes.gerenciar') THEN
    PERFORM pg_temp.falha('lançamento por setor: rh.comissoes.gerenciar fora do catálogo de permissões');
  END IF;
  IF (SELECT array_agg(role::text ORDER BY role::text) FROM public.role_permissions WHERE permission = 'rh.comissoes.gerenciar') IS DISTINCT FROM ARRAY['admin'] THEN
    PERFORM pg_temp.falha('lançamento por setor: rh.comissoes.gerenciar deveria vir só para o papel admin');
  END IF;
  IF (SELECT column_default FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'setores_modulo' AND column_name = 'inclui_subordinadas') IS DISTINCT FROM 'false' THEN
    PERFORM pg_temp.falha('lançamento por setor: setores_modulo.inclui_subordinadas sem padrão false');
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'regra_lancamento' AND cmd IN ('DELETE', 'ALL')) THEN
    PERFORM pg_temp.falha('lançamento por setor: regra_lancamento tem policy de DELETE');
  END IF;
  IF public.rh_exige_servidor_vinculado() THEN
    PERFORM pg_temp.falha('lançamento por setor: rh_exige_servidor_vinculado() = true com o RH em modo registrar');
  END IF;

  -- ===== data_local(): fuso do banco (app.fuso_horario), padrão America/Sao_Paulo, nome inválido não derruba
  IF public.data_local() IS DISTINCT FROM (now() AT TIME ZONE 'America/Sao_Paulo')::date THEN
    PERFORM pg_temp.falha('data_local: sem app.fuso_horario não usa America/Sao_Paulo');
  END IF;
  PERFORM set_config('app.fuso_horario', 'Pacific/Kiritimati', true);
  IF public.data_local() IS DISTINCT FROM (now() AT TIME ZONE 'Pacific/Kiritimati')::date THEN
    PERFORM pg_temp.falha('data_local: não segue app.fuso_horario');
  END IF;
  PERFORM set_config('app.fuso_horario', 'Lugar/Inexistente', true);
  BEGIN
    IF public.data_local() IS DISTINCT FROM (now() AT TIME ZONE 'America/Sao_Paulo')::date THEN
      PERFORM pg_temp.falha('data_local: fuso inválido não cai no padrão');
    END IF;
  EXCEPTION WHEN OTHERS THEN PERFORM pg_temp.falha('data_local: fuso inválido derruba a chamada (' || SQLSTATE || ')');
  END;
  PERFORM set_config('app.fuso_horario', '', true);

  -- ===== cobertura: lancamento_modulos_tabela = tabelas do RH do mapa (menos trilha), todas com os dois triggers ligados
  SELECT array_agg(tabela ORDER BY tabela) INTO v_tabelas FROM mapa WHERE 'rh' = ANY (string_to_array(modulos, '|')) AND classe <> 'trilha';
  FOR x IN SELECT c.relname,
                  public.lancamento_modulos_tabela(c.relname) AS mods,
                  c.relname = ANY (v_tabelas) AS do_rh
             FROM pg_class c WHERE c.relnamespace = 'public'::regnamespace AND c.relkind IN ('r', 'p') LOOP
    IF x.do_rh AND (x.mods IS NULL OR NOT ('rh' = ANY (x.mods))) THEN
      PERFORM pg_temp.falha('lançamento por setor: ' || x.relname || ' (RH no mapa) fora de lancamento_modulos_tabela ou sem rh');
    ELSIF NOT x.do_rh AND x.mods IS NOT NULL THEN
      PERFORM pg_temp.falha('lançamento por setor: ' || x.relname || ' em lancamento_modulos_tabela sem ser do RH no mapa (fase 1)');
    END IF;
    IF x.mods IS NOT NULL AND EXISTS (SELECT 1 FROM unnest(x.mods) m WHERE m NOT IN (SELECT unnest(enum_range(NULL::public.app_module))::text)) THEN
      PERFORM pg_temp.falha('lançamento por setor: ' || x.relname || ' com módulo fora do enum em lancamento_modulos_tabela');
    END IF;
    IF x.do_rh AND NOT EXISTS (SELECT 1 FROM pg_trigger tg JOIN pg_proc p ON p.oid = tg.tgfoid
                                WHERE tg.tgrelid = ('public.' || quote_ident(x.relname))::regclass AND tg.tgname = 'zz_exigir_setor'
                                  AND p.proname = 'exigir_setor' AND tg.tgenabled = 'O'
                                  AND tg.tgtype & 1 = 1 AND tg.tgtype & 2 = 2 AND tg.tgtype & 28 = 28) THEN
      PERFORM pg_temp.falha('lançamento por setor: ' || x.relname || ' sem zz_exigir_setor (BEFORE INSERT/UPDATE/DELETE por linha, ligado)');
    END IF;
    IF x.do_rh AND NOT EXISTS (SELECT 1 FROM pg_trigger tg JOIN pg_proc p ON p.oid = tg.tgfoid
                                WHERE tg.tgrelid = ('public.' || quote_ident(x.relname))::regclass AND tg.tgname = 'zz_exigir_setor_fim'
                                  AND p.proname = 'exigir_setor_fim' AND tg.tgenabled = 'O'
                                  AND tg.tgtype & 1 = 0 AND tg.tgtype & 2 = 0 AND tg.tgtype & 28 = 28) THEN
      PERFORM pg_temp.falha('lançamento por setor: ' || x.relname || ' sem zz_exigir_setor_fim (AFTER INSERT/UPDATE/DELETE por comando, ligado)');
    END IF;
  END LOOP;

  -- ===== privilégios
  FOREACH t IN ARRAY ARRAY['public.data_local()', 'public.lotacao_vigente(uuid, date)', 'public.unidade_e_superiores(uuid)',
                           'public.lancamento_modulos_tabela(text)', 'public.fundamento_lancamento(text[])',
                           'public.fundamento_tabela(text)', 'public.fundamento_linha(text, text, jsonb, jsonb)',
                           'public.lancamento_cache_invalidar()', 'public.exigir_setor()', 'public.exigir_setor_fim()',
                           'public.regra_lancamento_proteger_exigir()', 'public.comissoes_membros_validar()',
                           'public.rh_exige_servidor_vinculado()'] LOOP
    IF has_function_privilege('authenticated', t, 'EXECUTE') OR has_function_privilege('anon', t, 'EXECUTE') THEN
      PERFORM pg_temp.falha('lançamento por setor: ' || t || ' executável pela API (função interna)');
    END IF;
  END LOOP;
  FOREACH t IN ARRAY ARRAY['public.meus_fundamentos_lancamento(public.app_module[])', 'public.saneamento_lancamento()'] LOOP
    IF NOT has_function_privilege('authenticated', t, 'EXECUTE') OR has_function_privilege('anon', t, 'EXECUTE')
       OR has_function_privilege('service_role', t, 'EXECUTE') THEN
      PERFORM pg_temp.falha('lançamento por setor: ' || t || ' deveria ser executável só por authenticated');
    END IF;
  END LOOP;
  FOREACH t IN ARRAY ARRAY['setores_modulo', 'regra_lancamento', 'comissoes', 'comissoes_membros'] LOOP
    IF has_table_privilege('anon', 'public.' || t, 'SELECT') OR has_table_privilege('authenticated', 'public.' || t, 'TRUNCATE') THEN
      PERFORM pg_temp.falha('lançamento por setor: privilégio de tabela aberto demais em ' || t);
    END IF;
  END LOOP;

  -- ===== comissões: objeto obrigatório fora de `outra`; membros sem autoconcessão
  r := pg_temp.sql_como(u_admin, 'authenticated', 'INSERT INTO public.comissoes (nome, tipo, modulo, ato_tipo, ato_numero, ato_data, data_inicio, motivo) VALUES (''x'', ''inventario'', ''patrimonio'', ''portaria'', ''1'', current_date, current_date, ''x'')');
  IF r NOT LIKE 'erro:23514%' THEN PERFORM pg_temp.falha('comissoes: comissão de inventário sem objeto aceita (' || r || ')'); END IF;
  UPDATE public.profiles SET servidor_id = NULL WHERE id IN (u_rh, u_ch, u_rhp, u_admin, u_cg);
  UPDATE public.profiles SET servidor_id = s_com WHERE id = u_cg;
  r := pg_temp.sql_como(u_cg, 'authenticated', format('INSERT INTO public.comissoes_membros (comissao_id, servidor_id) VALUES (%L, %L)', c1, s_com));
  IF r NOT LIKE 'erro:42501:Você não pode se incluir%' THEN PERFORM pg_temp.falha('comissoes_membros: quem cadastra se inclui na comissão (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_cg, 'authenticated', format('INSERT INTO public.comissoes_membros (comissao_id, servidor_id) VALUES (%L, %L)', c1, s_fora));
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('comissoes_membros: quem tem rh.comissoes.gerenciar não inclui outro servidor (' || r || ')'); END IF;
  r := pg_temp.exec_como(u_cg, 'authenticated', 'INSERT INTO public.comissoes (id, nome, tipo, modulo, ato_tipo, ato_numero, ato_data, data_inicio, motivo) VALUES (''f5000000-0000-0000-0000-000000000043'', ''LS Comissão 2'', ''outra'', ''rh'', ''portaria'', ''2'', current_date, current_date, ''x'')');
  IF r <> 'ok' THEN PERFORM pg_temp.falha('comissoes: quem tem rh.comissoes.gerenciar não cadastra comissão (' || r || ')'); END IF;
  PERFORM pg_temp.ls_sistema();
  UPDATE public.profiles SET servidor_id = NULL WHERE id = u_cg;
  UPDATE public.profiles SET servidor_id = s_ch WHERE id = u_admin;
  r := pg_temp.sql_como(u_admin, 'authenticated', format('INSERT INTO public.comissoes_membros (comissao_id, servidor_id) VALUES (%L, %L)', 'f5000000-0000-0000-0000-000000000043', s_com));
  IF r NOT LIKE 'erro:42501:Quem cadastrou a comissão%' THEN PERFORM pg_temp.falha('comissoes_membros: quem cadastrou a comissão vira membro dela (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_admin, 'authenticated', format('INSERT INTO public.comissoes_membros (comissao_id, servidor_id) VALUES (%L, %L)', c1, s_ch));
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('comissoes_membros: o papel admin não se inclui numa comissão (' || r || ')'); END IF;
  PERFORM pg_temp.ls_sistema();
  UPDATE public.profiles SET servidor_id = NULL WHERE id = u_admin;

  -- ===== modo registrar: grava e a trilha leva o negado
  r := pg_temp.insere_como(u_rh, 'authenticated', 'servidor_tags', jsonb_build_object('id', 'f5000000-0000-0000-0000-000000000101', 'nome', 'LS reg 1'));
  SELECT fundamento INTO j FROM public.audit_logs WHERE entity_id = 'f5000000-0000-0000-0000-000000000101' AND action = 'create';
  IF r <> 'ok' THEN PERFORM pg_temp.falha('lançamento por setor (registrar): login sem servidor foi recusado (' || r || ')');
  ELSIF j IS NULL OR j ->> 'via' IS DISTINCT FROM 'negado_sem_servidor' OR j ->> 'permitido' IS DISTINCT FROM 'false' OR j ->> 'modo' IS DISTINCT FROM 'registrar' THEN
    PERFORM pg_temp.falha('lançamento por setor (registrar): trilha sem o negado_sem_servidor (' || coalesce(j::text, 'nulo') || ')');
  END IF;
  PERFORM pg_temp.ls_sistema();
  UPDATE public.profiles SET servidor_id = s_fora WHERE id = u_rh;
  r := pg_temp.insere_como(u_rh, 'authenticated', 'servidor_tags', jsonb_build_object('id', 'f5000000-0000-0000-0000-000000000102', 'nome', 'LS reg 2'));
  SELECT fundamento INTO j FROM public.audit_logs WHERE entity_id = 'f5000000-0000-0000-0000-000000000102' AND action = 'create';
  IF r <> 'ok' THEN PERFORM pg_temp.falha('lançamento por setor (registrar): servidor fora do setor foi recusado (' || r || ')');
  ELSIF j IS NULL OR j ->> 'via' IS DISTINCT FROM 'negado_setor' OR (j ->> 'unidade_id')::uuid IS DISTINCT FROM e_out
        OR (j ->> 'servidor_id')::uuid IS DISTINCT FROM s_fora OR j -> 'modulos' IS DISTINCT FROM '["rh"]'::jsonb THEN
    PERFORM pg_temp.falha('lançamento por setor (registrar): trilha sem o negado_setor com unidade e servidor (' || coalesce(j::text, 'nulo') || ')');
  END IF;
  -- registrar_evento grava o fundamento do login no rh
  PERFORM pg_temp.ls_sistema();
  r := pg_temp.valor_como(u_rh, 'authenticated', 'SELECT public.registrar_evento(''view'', ''servidores'', NULL, ''LS'', ''{}''::jsonb)::text');
  SELECT fundamento INTO j FROM public.audit_logs WHERE id::text = r;
  IF j IS NULL OR j ->> 'via' IS DISTINCT FROM 'negado_setor' OR j ->> 'modo' IS DISTINCT FROM 'registrar' THEN
    PERFORM pg_temp.falha('registrar_evento: não grava o fundamento do login (' || coalesce(r, 'nulo') || ', ' || coalesce(j::text, 'nulo') || ')');
  END IF;
  -- cascata que começa fora da regra (estrutura_organizacional -> lotacoes, ON DELETE CASCADE) é checada: negado na trilha
  PERFORM pg_temp.ls_sistema();
  r := pg_temp.exec_como(u_admin, 'authenticated', format('DELETE FROM public.estrutura_organizacional WHERE id = %L', e_tmp1));
  SELECT fundamento INTO j FROM public.audit_logs WHERE entity_id = l_tmp AND action = 'delete' ORDER BY sequencia DESC LIMIT 1;
  IF r <> 'ok' THEN PERFORM pg_temp.falha('lançamento por setor (registrar): admin não apaga a unidade com lotação (' || r || ')');
  ELSIF j IS NULL OR j ->> 'via' IS DISTINCT FROM 'negado_sem_servidor' OR j ? 'em_cascata' THEN
    PERFORM pg_temp.falha('lançamento por setor: cascata vinda de estrutura_organizacional não foi checada (' || coalesce(j::text, 'nulo') || ')');
  END IF;

  -- ===== modo mais restritivo e setor de qualquer módulo da tabela (rh + financeiro, premissa 3)
  PERFORM pg_temp.ls_sistema();
  UPDATE public.regra_lancamento SET modo = 'exigir' WHERE modulo = 'financeiro';
  INSERT INTO public.setores_modulo (modulo, unidade_id) VALUES ('financeiro', e_fin);
  UPDATE public.profiles SET servidor_id = s_fin WHERE id = u_rh;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_rh, 'role', 'authenticated')::text, true);
  j := public.fundamento_tabela('tabela_inss');
  IF j ->> 'modo' IS DISTINCT FROM 'exigir' OR j ->> 'via' IS DISTINCT FROM 'lotacao' OR j ->> 'modulo' IS DISTINCT FROM 'financeiro' THEN
    PERFORM pg_temp.falha('lançamento por setor: tabela rh+financeiro não usa o modo mais restritivo ou não aceita o setor financeiro (' || coalesce(j::text, 'nulo') || ')');
  END IF;
  j := public.fundamento_tabela('servidor_tags');
  IF j ->> 'modo' IS DISTINCT FROM 'registrar' OR j ->> 'permitido' IS DISTINCT FROM 'false' THEN
    PERFORM pg_temp.falha('lançamento por setor: tabela só do rh pega o modo ou o setor do financeiro (' || coalesce(j::text, 'nulo') || ')');
  END IF;
  PERFORM pg_temp.ls_sistema();
  UPDATE public.regra_lancamento SET modo = 'desligado' WHERE modulo = 'financeiro';
  DELETE FROM public.setores_modulo WHERE modulo = 'financeiro';

  -- ===== modo desligado: a trilha não leva fundamento
  UPDATE public.regra_lancamento SET modo = 'desligado' WHERE modulo = 'rh';
  r := pg_temp.insere_como(u_rh, 'authenticated', 'servidor_tags', jsonb_build_object('id', 'f5000000-0000-0000-0000-000000000103', 'nome', 'LS des'));
  IF r <> 'ok' OR (SELECT fundamento FROM public.audit_logs WHERE entity_id = 'f5000000-0000-0000-0000-000000000103' AND action = 'create') IS NOT NULL THEN
    PERFORM pg_temp.falha('lançamento por setor (desligado): recusou ou gravou fundamento na trilha (' || r || ')');
  END IF;

  -- ===== o modo exigir não entra pela API (nem pelo admin); sair dele, sim
  r := pg_temp.sql_como(u_admin, 'authenticated', 'UPDATE public.regra_lancamento SET modo = ''exigir'' WHERE modulo = ''patrimonio''');
  IF r NOT LIKE 'erro:42501:O modo exigir%' THEN PERFORM pg_temp.falha('regra_lancamento: o admin liga o modo exigir pela API (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_admin, 'authenticated', 'DELETE FROM public.regra_lancamento WHERE modulo = ''patrimonio''');
  IF r <> 'ok:0' THEN PERFORM pg_temp.falha('regra_lancamento: o admin apaga a regra de um módulo (' || r || ')'); END IF;

  -- ===== modo exigir (ligado como migração: sem usuário na sessão)
  PERFORM pg_temp.ls_sistema();
  UPDATE public.regra_lancamento SET modo = 'exigir' WHERE modulo = 'rh';
  IF NOT public.rh_exige_servidor_vinculado() THEN PERFORM pg_temp.falha('lançamento por setor: rh_exige_servidor_vinculado() = false com o RH em modo exigir'); END IF;
  r := pg_temp.sql_como(u_admin, 'authenticated', 'UPDATE public.regra_lancamento SET modo = ''registrar'' WHERE modulo = ''rh''');
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('regra_lancamento: o admin não tira um módulo do modo exigir (saída de emergência) (' || r || ')'); END IF;
  -- fora do setor (sem setor cadastrado ainda): recusa com o nome do módulo, também no DELETE
  PERFORM pg_temp.ls_sistema();
  UPDATE public.profiles SET servidor_id = s_fora WHERE id = u_rh;
  r := pg_temp.sql_como(u_rh, 'authenticated', tag);
  IF r NOT LIKE 'erro:RHS01:Você não está lotado nem designado no setor de Recursos Humanos%' THEN PERFORM pg_temp.falha('lançamento por setor (exigir): servidor fora do setor insere, ou mensagem sem o nome do módulo (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_rh, 'authenticated', 'DELETE FROM public.servidor_tags WHERE id = ''f5000000-0000-0000-0000-000000000102''');
  IF r NOT LIKE 'erro:RHS01:%' THEN PERFORM pg_temp.falha('lançamento por setor (exigir): servidor fora do setor apaga (' || r || ')'); END IF;
  -- sem servidor vinculado: recusa com a mensagem do vínculo (também o admin); authenticated sem usuário: recusa
  PERFORM pg_temp.ls_sistema();
  UPDATE public.profiles SET servidor_id = NULL WHERE id = u_rh;
  r := pg_temp.sql_como(u_rh, 'authenticated', tag);
  IF r NOT LIKE 'erro:RHS01:Seu login não tem servidor vinculado%' THEN PERFORM pg_temp.falha('lançamento por setor (exigir): login sem servidor insere (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_admin, 'authenticated', tag);
  IF r NOT LIKE 'erro:RHS01:Seu login não tem servidor vinculado%' THEN PERFORM pg_temp.falha('lançamento por setor (exigir): admin sem servidor lança no RH (' || r || ')'); END IF;
  r := pg_temp.sql_como(NULL, 'authenticated', tag);
  IF r NOT LIKE 'erro:RHS01:Sessão sem usuário%' THEN PERFORM pg_temp.falha('lançamento por setor (exigir): authenticated sem usuário passa como anônimo (' || r || ')'); END IF;
  -- cascata que começa fora da regra é recusada em exigir
  r := pg_temp.sql_como(u_admin, 'authenticated', format('DELETE FROM public.estrutura_organizacional WHERE id = %L', e_tmp2));
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('lançamento por setor: unidade sem lotação não se apaga (' || r || ')'); END IF;
  PERFORM pg_temp.ls_sistema();
  INSERT INTO public.lotacoes (servidor_id, unidade_id, data_inicio, ativo, tipo_lotacao) VALUES (s_sem, e_tmp2, current_date - 1, false, 'lotacao_interna');
  r := pg_temp.sql_como(u_admin, 'authenticated', format('DELETE FROM public.estrutura_organizacional WHERE id = %L', e_tmp2));
  IF r NOT LIKE 'erro:RHS01:%' THEN PERFORM pg_temp.falha('lançamento por setor (exigir): cascata estrutura_organizacional -> lotacoes passa sem checagem (' || r || ')'); END IF;
  -- admin sem servidor configura o acesso (premissa 1)
  r := pg_temp.sql_como(u_admin, 'authenticated', format('INSERT INTO public.setores_modulo (modulo, unidade_id) VALUES (''patrimonio'', %L) RETURNING inclui_subordinadas', e_pat));
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('lançamento por setor: admin sem servidor não cadastra setor do módulo (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_admin, 'authenticated', format('INSERT INTO public.setores_modulo (modulo, unidade_id) VALUES (''patrimonio'', %L) RETURNING inclui_subordinadas::text', e_pat));
  IF r IS DISTINCT FROM 'false' THEN PERFORM pg_temp.falha('setores_modulo: inclui_subordinadas não nasce false (' || coalesce(r, 'nulo') || ')'); END IF;
  r := pg_temp.sql_como(u_admin, 'authenticated', 'UPDATE public.regra_lancamento SET observacao = ''LS'' WHERE modulo = ''patrimonio''');
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('lançamento por setor: admin sem servidor não altera a regra (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_rh, 'authenticated', 'UPDATE public.regra_lancamento SET modo = ''desligado'' WHERE modulo = ''rh''');
  IF r <> 'ok:0' AND r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('lançamento por setor: o módulo rh desliga a regra (' || r || ')'); END IF;
  -- sistema: service role e job passam
  r := pg_temp.sql_como(NULL, 'service_role', tag);
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('lançamento por setor (exigir): a service role foi recusada (' || r || ')'); END IF;
  PERFORM pg_temp.ls_sistema();
  BEGIN
    INSERT INTO public.servidor_tags (id, nome) VALUES ('f5000000-0000-0000-0000-000000000104', 'LS job');
  EXCEPTION WHEN OTHERS THEN PERFORM pg_temp.falha('lançamento por setor (exigir): job (origem sistema) recusado (' || SQLSTATE || ')');
  END;

  -- ===== lotação no setor: o setor é a unidade de cima, com subordinadas
  INSERT INTO public.setores_modulo (id, modulo, unidade_id, inclui_subordinadas) VALUES (sm_rh, 'rh', e_rh, true);
  UPDATE public.profiles SET servidor_id = s_lot WHERE id = u_rh;
  r := pg_temp.insere_como(u_rh, 'authenticated', 'servidor_tags', jsonb_build_object('id', 'f5000000-0000-0000-0000-000000000105', 'nome', 'LS lot'));
  SELECT fundamento, org_unit_id::text INTO j, t FROM public.audit_logs WHERE entity_id = 'f5000000-0000-0000-0000-000000000105' AND action = 'create';
  IF r <> 'ok' THEN PERFORM pg_temp.falha('lançamento por setor (exigir): lotado em subordinada do setor foi recusado (' || r || ')');
  ELSIF j ->> 'via' IS DISTINCT FROM 'lotacao' OR (j ->> 'lotacao_id')::uuid IS DISTINCT FROM l_lot OR j ->> 'permitido' IS DISTINCT FROM 'true'
        OR (j ->> 'setor_unidade_id')::uuid IS DISTINCT FROM e_rh OR j -> 'ato' ->> 'numero' IS DISTINCT FROM 'LS-P-1/2026'
        OR j -> 'ato' ->> 'tipo' IS DISTINCT FROM 'portaria' OR t IS DISTINCT FROM e_sub::text
        OR (j ->> 'data')::date IS DISTINCT FROM public.data_local() THEN
    PERFORM pg_temp.falha('lançamento por setor: trilha da lotação sem via/lotação/ato/unidade/data (' || coalesce(j::text, 'nulo') || ', unidade ' || coalesce(t, 'nula') || ')');
  END IF;
  -- log_audit grava a unidade da lotação vigente, como o resto da trilha
  PERFORM pg_temp.ls_sistema();
  r := pg_temp.valor_como(u_rh, 'authenticated', 'SELECT public.log_audit(''view''::public.audit_action, ''ls_teste'', NULL, ''admin'')::text');
  IF (SELECT org_unit_id FROM public.audit_logs WHERE id::text = r) IS DISTINCT FROM e_sub THEN
    PERFORM pg_temp.falha('log_audit: org_unit_id não é a unidade da lotação vigente (' || coalesce(r, 'nulo') || ')');
  END IF;
  FOR x IN SELECT * FROM (VALUES
      ('sem subordinadas', 'UPDATE public.setores_modulo SET inclui_subordinadas = false WHERE id = %L', sm_rh),
      ('setor inativo', 'UPDATE public.setores_modulo SET ativo = false WHERE id = %L', sm_rh),
      ('lotação externa', 'UPDATE public.lotacoes SET tipo_lotacao = ''lotacao_externa'' WHERE id = %L', l_lot),
      ('lotação inativa', 'UPDATE public.lotacoes SET ativo = false WHERE id = %L', l_lot),
      ('lotação encerrada', 'UPDATE public.lotacoes SET data_fim = public.data_local() - 1 WHERE id = %L', l_lot),
      ('lotação futura', 'UPDATE public.lotacoes SET data_inicio = public.data_local() + 1 WHERE id = %L', l_lot)) AS v(caso, cmd, alvo) LOOP
    PERFORM pg_temp.ls_sistema();
    EXECUTE format(x.cmd, x.alvo);
    r := pg_temp.sql_como(u_rh, 'authenticated', tag);
    IF r NOT LIKE 'erro:RHS01:%' THEN PERFORM pg_temp.falha('lançamento por setor: ' || x.caso || ' ainda vale (' || r || ')'); END IF;
    PERFORM pg_temp.ls_sistema();
    UPDATE public.setores_modulo SET inclui_subordinadas = true, ativo = true WHERE id = sm_rh;
    UPDATE public.lotacoes SET tipo_lotacao = 'lotacao_interna', ativo = true, data_inicio = current_date - 30, data_fim = NULL WHERE id = l_lot;
  END LOOP;

  -- cache por transação: mudar a lotação na MESMA transação muda o fundamento (valor_como não desfaz o cache)
  r := pg_temp.valor_como(u_rh, 'authenticated', 'SELECT via FROM public.meus_fundamentos_lancamento() WHERE modulo = ''rh''');
  PERFORM pg_temp.ls_sistema();
  UPDATE public.lotacoes SET unidade_id = e_out WHERE id = l_lot;
  IF r IS DISTINCT FROM 'lotacao' OR pg_temp.valor_como(u_rh, 'authenticated', 'SELECT via FROM public.meus_fundamentos_lancamento() WHERE modulo = ''rh''') IS DISTINCT FROM 'negado_setor' THEN
    PERFORM pg_temp.falha('lançamento por setor: o cache não acompanha a mudança de lotação na mesma transação (antes ' || coalesce(r, 'nulo') || ')');
  END IF;
  r := pg_temp.sql_como(u_rh, 'authenticated', tag);
  IF r NOT LIKE 'erro:RHS01:%' THEN PERFORM pg_temp.falha('lançamento por setor: o trigger usa o cache velho depois da mudança de lotação (' || r || ')'); END IF;
  PERFORM pg_temp.ls_sistema();
  UPDATE public.lotacoes SET unidade_id = e_sub WHERE id = l_lot;
  r := pg_temp.sql_como(u_rh, 'authenticated', tag);
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('lançamento por setor: lotação restaurada e o lançamento segue recusado (' || r || ')'); END IF;

  -- meus_fundamentos_lancamento: uma linha por módulo (ou os pedidos); anon e inativo não executam
  r := pg_temp.valor_desfeito_como(u_rh, 'authenticated', 'SELECT count(*)::text FROM public.meus_fundamentos_lancamento()');
  IF r IS DISTINCT FROM (SELECT count(*)::text FROM unnest(enum_range(NULL::public.app_module))) THEN
    PERFORM pg_temp.falha('meus_fundamentos_lancamento: não devolve uma linha por módulo (' || coalesce(r, 'nulo') || ')');
  END IF;
  r := pg_temp.valor_desfeito_como(u_rh, 'authenticated', 'SELECT string_agg(modulo, '','') FROM public.meus_fundamentos_lancamento(ARRAY[''patrimonio'', ''rh'']::public.app_module[])');
  IF r IS DISTINCT FROM 'rh,patrimonio' THEN PERFORM pg_temp.falha('meus_fundamentos_lancamento(p_modulos): devolve ' || coalesce(r, 'nada') || ' (esperado rh,patrimonio)'); END IF;
  r := pg_temp.valor_desfeito_como(u_rh, 'authenticated', 'SELECT concat_ws(''|'', modo, permitido, bloqueado, via, unidade_id, unidade_nome, lotacao_id, ato ->> ''numero'') FROM public.meus_fundamentos_lancamento() WHERE modulo = ''rh''');
  IF r IS DISTINCT FROM concat_ws('|', 'exigir', true, false, 'lotacao', e_sub, 'LS RH folha', l_lot, 'LS-P-1/2026') THEN
    PERFORM pg_temp.falha('meus_fundamentos_lancamento: linha do rh do lotado = ' || coalesce(r, 'nula'));
  END IF;
  r := pg_temp.valor_desfeito_como(u_rh, 'authenticated', 'SELECT concat_ws(''|'', modo, permitido, bloqueado) FROM public.meus_fundamentos_lancamento() WHERE modulo = ''patrimonio''');
  IF r IS DISTINCT FROM 'desligado|f|f' THEN PERFORM pg_temp.falha('meus_fundamentos_lancamento: linha do patrimônio = ' || coalesce(r, 'nula')); END IF;
  r := pg_temp.valor_desfeito_como(u_admin, 'authenticated', 'SELECT concat_ws(''|'', modo, permitido, bloqueado, via) FROM public.meus_fundamentos_lancamento() WHERE modulo = ''rh''');
  IF r IS DISTINCT FROM 'exigir|f|t|negado_sem_servidor' THEN PERFORM pg_temp.falha('meus_fundamentos_lancamento: admin sem servidor no rh = ' || coalesce(r, 'nula')); END IF;
  r := pg_temp.sql_como(NULL, 'anon', 'SELECT * FROM public.meus_fundamentos_lancamento()');
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('meus_fundamentos_lancamento: anon executa (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_inativo, 'authenticated', 'SELECT * FROM public.meus_fundamentos_lancamento()');
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('meus_fundamentos_lancamento: perfil inativo executa (' || r || ')'); END IF;

  -- ===== cessão de entrada com unidade no setor (premissa 4); a de saída não vale
  PERFORM pg_temp.ls_sistema();
  UPDATE public.profiles SET servidor_id = s_ces WHERE id = u_rh;
  r := pg_temp.insere_como(u_rh, 'authenticated', 'servidor_tags', jsonb_build_object('id', 'f5000000-0000-0000-0000-000000000109', 'nome', 'LS ces'));
  SELECT fundamento INTO j FROM public.audit_logs WHERE entity_id = 'f5000000-0000-0000-0000-000000000109' AND action = 'create';
  IF r <> 'ok' OR j ->> 'via' IS DISTINCT FROM 'lotacao' OR (j ->> 'cessao_id')::uuid IS DISTINCT FROM ces OR j ? 'lotacao_id'
     OR j -> 'ato' ->> 'numero' IS DISTINCT FROM 'LS-CE-2/2026' THEN
    PERFORM pg_temp.falha('lançamento por setor: cessão de entrada no setor não vale ou trilha sem cessao_id (' || r || ', ' || coalesce(j::text, 'nulo') || ')');
  END IF;
  PERFORM pg_temp.ls_sistema();
  UPDATE public.cessoes SET tipo = 'saida' WHERE id = ces;
  r := pg_temp.sql_como(u_rh, 'authenticated', tag);
  IF r NOT LIKE 'erro:RHS01:%' THEN PERFORM pg_temp.falha('lançamento por setor: cessão de saída vale como lotação (' || r || ')'); END IF;
  PERFORM pg_temp.ls_sistema();
  UPDATE public.cessoes SET tipo = 'entrada' WHERE id = ces;

  -- ===== lotação lançada pelo próprio servidor (autoconcedida) não vale
  UPDATE public.profiles SET servidor_id = s_auto WHERE id = u_rh;
  r := pg_temp.sql_como(u_rh, 'authenticated', tag);
  IF r NOT LIKE 'erro:RHS01:%' THEN PERFORM pg_temp.falha('lançamento por setor: lotação lançada pelo próprio servidor vale (' || r || ')'); END IF;

  -- ===== ciclo na estrutura (c1 acima de c2 acima de c1): termina e acha o setor
  PERFORM pg_temp.ls_sistema();
  IF NOT (public.unidade_e_superiores(e_c2) @> ARRAY[e_c1, e_c2]) THEN PERFORM pg_temp.falha('unidade_e_superiores: ciclo na estrutura sem as duas unidades'); END IF;
  INSERT INTO public.setores_modulo (modulo, unidade_id, inclui_subordinadas) VALUES ('rh', e_c1, true);
  UPDATE public.profiles SET servidor_id = s_cic WHERE id = u_rh;
  r := pg_temp.sql_como(u_rh, 'authenticated', tag);
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('lançamento por setor: ciclo na estrutura trava ou perde o setor (' || r || ')'); END IF;
  PERFORM pg_temp.ls_sistema();
  DELETE FROM public.setores_modulo WHERE unidade_id = e_c1;

  -- ===== designação: só aprovada por outra pessoa, ativa, vigente, com ato e para o setor
  UPDATE public.profiles SET servidor_id = s_des WHERE id = u_rh;
  r := pg_temp.sql_como(u_rh, 'authenticated', tag);
  IF r NOT LIKE 'erro:RHS01:%' THEN PERFORM pg_temp.falha('lançamento por setor: designação sem ato vale como fundamento (' || r || ')'); END IF;
  PERFORM pg_temp.ls_sistema();
  UPDATE public.designacoes SET ato_tipo = 'portaria', ato_numero = 'LS-D-3/2026', ato_data = current_date - 6, ato_doe_numero = '1234' WHERE id = d1;
  r := pg_temp.insere_como(u_rh, 'authenticated', 'servidor_tags', jsonb_build_object('id', 'f5000000-0000-0000-0000-000000000106', 'nome', 'LS des 1'));
  SELECT fundamento, org_unit_id::text INTO j, t FROM public.audit_logs WHERE entity_id = 'f5000000-0000-0000-0000-000000000106' AND action = 'create';
  IF r <> 'ok' THEN PERFORM pg_temp.falha('lançamento por setor: designação aprovada, vigente e com ato não vale (' || r || ')');
  ELSIF j ->> 'via' IS DISTINCT FROM 'designacao' OR (j ->> 'designacao_id')::uuid IS DISTINCT FROM d1
        OR j -> 'ato' IS DISTINCT FROM jsonb_build_object('tipo', 'portaria', 'numero', 'LS-D-3/2026', 'data', current_date - 6, 'doe_numero', '1234')
        OR t IS DISTINCT FROM e_rh::text THEN
    PERFORM pg_temp.falha('lançamento por setor: trilha da designação sem via/designação/ato/unidade de destino (' || coalesce(j::text, 'nulo') || ', unidade ' || coalesce(t, 'nula') || ')');
  END IF;
  FOR x IN SELECT * FROM (VALUES
      ('pendente', 'status = ''pendente'''),
      ('encerrada', 'status = ''encerrada'''),
      ('inativa', 'ativo = false'),
      ('vencida', 'data_fim = public.data_local() - 1'),
      ('futura', 'data_inicio = public.data_local() + 1'),
      ('sem número do ato', 'ato_numero = ''  '''),
      ('fora do setor', format('unidade_destino_id = %L', e_out)),
      ('sem aprovador', 'aprovado_por = NULL'),
      ('aprovada pelo próprio designado', format('aprovado_por = %L', u_rh)),
      ('aprovada por quem a lançou', format('aprovado_por = %L', u_ch))) AS v(caso, sets) LOOP
    PERFORM pg_temp.ls_sistema();
    EXECUTE format('UPDATE public.designacoes SET %s WHERE id = %L', x.sets, d1);
    r := pg_temp.sql_como(u_rh, 'authenticated', tag);
    IF r NOT LIKE 'erro:RHS01:%' THEN PERFORM pg_temp.falha('lançamento por setor: designação ' || x.caso || ' vale como fundamento (' || r || ')'); END IF;
    PERFORM pg_temp.ls_sistema();
    UPDATE public.designacoes SET status = 'aprovada', ativo = true, data_inicio = current_date - 5, data_fim = current_date + 30,
           ato_numero = 'LS-D-3/2026', unidade_destino_id = e_rh, aprovado_por = u_admin WHERE id = d1;
  END LOOP;

  -- ===== comissão não é fundamento na fase 1 (vale só no objeto, premissa 6: fase 2)
  UPDATE public.profiles SET servidor_id = s_com WHERE id = u_rh;
  r := pg_temp.sql_como(u_rh, 'authenticated', tag);
  IF r NOT LIKE 'erro:RHS01:%' THEN PERFORM pg_temp.falha('lançamento por setor: membro de comissão sem objeto lança no módulo inteiro (' || r || ')'); END IF;
  PERFORM pg_temp.ls_sistema();
  UPDATE public.profiles SET servidor_id = NULL WHERE id = u_rh;

  -- ===== autoatendimento: o servidor A (fora do setor) pede o próprio abono e o documento; não pede o de B
  r := pg_temp.insere_como(u_a, 'authenticated', 'solicitacoes_abono', jsonb_build_object('id', 'f5000000-0000-0000-0000-000000000108', 'servidor_id', sa,
         'tipo_abono_id', (SELECT tipo_abono_id FROM public.solicitacoes_abono WHERE id = ab), 'data_inicio', current_date, 'data_fim', current_date));
  SELECT fundamento INTO j FROM public.audit_logs WHERE entity_id = 'f5000000-0000-0000-0000-000000000108' AND action = 'create';
  IF r <> 'ok' THEN PERFORM pg_temp.falha('lançamento por setor (exigir): servidor não pede o próprio abono (' || r || ')');
  ELSIF j ->> 'via' IS DISTINCT FROM 'autoatendimento' OR j ->> 'permitido' IS DISTINCT FROM 'true' OR j ->> 'modo' IS DISTINCT FROM 'exigir' THEN
    PERFORM pg_temp.falha('lançamento por setor: trilha do autoatendimento = ' || coalesce(j::text, 'nulo'));
  END IF;
  r := pg_temp.sql_como(u_a, 'authenticated', format('INSERT INTO public.documentos_requerimento_servidor (servidor_id, tipo_documento, titulo) VALUES (%L, ''x'', ''LS'')', sa));
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('lançamento por setor (exigir): servidor não pede o próprio documento (' || r || ')'); END IF;
  -- o admin com servidor e fora do setor não grava o próprio pedido já decidido (ou o pedido entra zerado)
  PERFORM pg_temp.ls_sistema();
  UPDATE public.profiles SET servidor_id = sa WHERE id = u_admin;
  r := pg_temp.valor_desfeito_como(u_admin, 'authenticated', format('INSERT INTO public.solicitacoes_abono (servidor_id, tipo_abono_id, data_inicio, data_fim, justificativa, status, aprovado_rh_por, aprovado_rh_em) VALUES (%L, %L, current_date, current_date, ''x'', ''aprovado'', auth.uid(), now()) RETURNING status', sa, (SELECT tipo_abono_id FROM public.solicitacoes_abono WHERE id = ab)));
  IF r IS DISTINCT FROM 'pendente' AND r NOT LIKE 'erro:%' THEN
    PERFORM pg_temp.falha('lançamento por setor (exigir): o admin fora do setor grava o próprio abono já aprovado (' || coalesce(r, 'nulo') || ')');
  END IF;
  PERFORM pg_temp.ls_sistema();
  UPDATE public.profiles SET servidor_id = NULL WHERE id = u_admin;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_a, 'role', 'authenticated')::text, true);
  FOR x IN SELECT * FROM (VALUES
      ('abono próprio pendente', 'solicitacoes_abono', 'INSERT', jsonb_build_object('servidor_id', sa, 'status', 'pendente'), NULL::jsonb, 'autoatendimento'),
      ('abono próprio já aprovado', 'solicitacoes_abono', 'INSERT', jsonb_build_object('servidor_id', sa, 'status', 'aprovado'), NULL, NULL),
      ('abono próprio com aprovador', 'solicitacoes_abono', 'INSERT', jsonb_build_object('servidor_id', sa, 'status', 'pendente', 'aprovado_rh_por', u_a), NULL, NULL),
      ('abono de outro', 'solicitacoes_abono', 'INSERT', jsonb_build_object('servidor_id', sb, 'status', 'pendente'), NULL, NULL),
      ('ajuste próprio (posse do usuário)', 'solicitacoes_ajuste_ponto', 'INSERT', jsonb_build_object('servidor_id', u_a, 'status', 'pendente'), NULL, 'autoatendimento'),
      ('ajuste próprio já aprovado', 'solicitacoes_ajuste_ponto', 'INSERT', jsonb_build_object('servidor_id', u_a, 'status', 'aprovada', 'aprovador_id', u_a), NULL, NULL),
      ('ajuste com o id do servidor', 'solicitacoes_ajuste_ponto', 'INSERT', jsonb_build_object('servidor_id', sa, 'status', 'pendente'), NULL, NULL),
      ('justificativa do próprio ponto', 'justificativas_ponto', 'INSERT', jsonb_build_object('registro_ponto_id', ponto_a, 'status', 'pendente'), NULL, 'autoatendimento'),
      ('justificativa já decidida', 'justificativas_ponto', 'INSERT', jsonb_build_object('registro_ponto_id', ponto_a, 'status', 'pendente', 'data_aprovacao', now()), NULL, NULL),
      ('documento próprio pendente', 'documentos_requerimento_servidor', 'INSERT', jsonb_build_object('servidor_id', sa, 'status', 'pendente'), NULL, 'autoatendimento'),
      ('documento já assinado', 'documentos_requerimento_servidor', 'INSERT', jsonb_build_object('servidor_id', sa, 'status', 'pendente', 'arquivo_assinado_url', 'x'), NULL, NULL),
      ('documento já recebido', 'documentos_requerimento_servidor', 'INSERT', jsonb_build_object('servidor_id', sa, 'status', 'recebido'), NULL, NULL),
      ('assinatura da própria frequência', 'frequencia_fechamento', 'UPDATE', jsonb_build_object('servidor_id', sa, 'assinado_servidor', true, 'updated_at', '2'),
         jsonb_build_object('servidor_id', sa, 'assinado_servidor', false, 'updated_at', '1'), 'autoatendimento'),
      ('assinatura com outro campo', 'frequencia_fechamento', 'UPDATE', jsonb_build_object('servidor_id', sa, 'assinado_servidor', true, 'consolidado_rh', true),
         jsonb_build_object('servidor_id', sa, 'assinado_servidor', false, 'consolidado_rh', false), NULL),
      ('apagar o próprio pedido', 'solicitacoes_abono', 'DELETE', NULL, jsonb_build_object('servidor_id', sa), NULL),
      ('tabela sem autoatendimento', 'servidor_tags', 'INSERT', jsonb_build_object('nome', 'x'), NULL, NULL)
    ) AS v(caso, tabela, op, novo, velho, esperado) LOOP
    IF public.fundamento_linha(x.tabela, x.op, x.novo, x.velho) ->> 'via' IS DISTINCT FROM x.esperado THEN
      PERFORM pg_temp.falha('fundamento_linha (servidor A): ' || x.caso || ' deu ' || coalesce(public.fundamento_linha(x.tabela, x.op, x.novo, x.velho) ->> 'via', 'nada') || ' (esperado ' || coalesce(x.esperado, 'nada') || ')');
    END IF;
  END LOOP;

  -- ===== chefia: decide a etapa do subordinado fora do setor (trigger real); não lança o resto do RH
  PERFORM pg_temp.ls_sistema();
  UPDATE public.profiles SET servidor_id = s_ch WHERE id = u_ch;
  r := pg_temp.exec_como(u_ch, 'authenticated', format('UPDATE public.solicitacoes_abono SET status = ''aprovado_chefia'', aprovado_chefia_por = auth.uid(), aprovado_chefia_em = now() WHERE id = %L', ab));
  SELECT fundamento INTO j FROM public.audit_logs WHERE entity_id = ab AND action = 'update' ORDER BY sequencia DESC LIMIT 1;
  IF r <> 'ok' OR (SELECT status FROM public.solicitacoes_abono WHERE id = ab) <> 'aprovado_chefia' THEN
    PERFORM pg_temp.falha('lançamento por setor (exigir): a chefia fora do setor não aprova o abono do subordinado (' || r || ')');
  ELSIF j ->> 'via' IS DISTINCT FROM 'chefia' OR (j ->> 'servidor_id')::uuid IS DISTINCT FROM s_ch THEN
    PERFORM pg_temp.falha('lançamento por setor: trilha da chefia = ' || coalesce(j::text, 'nulo'));
  END IF;
  r := pg_temp.sql_como(u_ch, 'authenticated', format('UPDATE public.frequencia_fechamento SET validado_chefia = true, validado_chefia_por = auth.uid(), validado_chefia_em = now() WHERE id = %L', ff));
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('lançamento por setor (exigir): a chefia fora do setor não valida o fechamento do subordinado (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_ch, 'authenticated', tag);
  IF r NOT LIKE 'erro:RHS01:%' THEN PERFORM pg_temp.falha('lançamento por setor (exigir): a chefia fora do setor lança no RH (' || r || ')'); END IF;
  FOR x IN SELECT * FROM (VALUES
      ('chefia: decisão do abono', u_ch, 'solicitacoes_abono', 'UPDATE', jsonb_build_object('status', 'aprovado_chefia'), jsonb_build_object('status', 'pendente'), 'chefia'),
      ('chefia: validação da frequência', u_ch, 'frequencia_fechamento', 'UPDATE', jsonb_build_object('validado_chefia', true, 'validado_chefia_em', 'x', 'updated_at', '2'),
         jsonb_build_object('validado_chefia', false, 'validado_chefia_em', NULL, 'updated_at', '1'), 'chefia'),
      ('chefia: validação com consolidação', u_ch, 'frequencia_fechamento', 'UPDATE', jsonb_build_object('validado_chefia', true, 'consolidado_rh', true),
         jsonb_build_object('validado_chefia', false, 'consolidado_rh', false), NULL),
      ('chefia: fechamento criado já validado', u_ch, 'frequencia_fechamento', 'INSERT', jsonb_build_object('servidor_id', sb, 'validado_chefia', true), NULL, 'chefia'),
      ('chefia: fechamento criado sem validação', u_ch, 'frequencia_fechamento', 'INSERT', jsonb_build_object('servidor_id', sb, 'validado_chefia', false), NULL, NULL),
      ('chefia: apagar abono', u_ch, 'solicitacoes_abono', 'DELETE', NULL, jsonb_build_object('servidor_id', sb), NULL),
      ('chefia: tabela sem etapa (férias)', u_ch, 'ferias_servidor', 'UPDATE', jsonb_build_object('status', 'b'), jsonb_build_object('status', 'a'), NULL),
      ('RH da frequência (age como RH)', u_rhp, 'solicitacoes_abono', 'UPDATE', jsonb_build_object('status', 'aprovado_chefia'), jsonb_build_object('status', 'pendente'), NULL),
      ('admin com servidor (tem todos os códigos)', u_admin, 'solicitacoes_abono', 'UPDATE', jsonb_build_object('status', 'aprovado_chefia'), jsonb_build_object('status', 'pendente'), NULL)
    ) AS v(caso, quem, tabela, op, novo, velho, esperado) LOOP
    PERFORM pg_temp.ls_sistema();
    UPDATE public.profiles SET servidor_id = s_ch WHERE id = x.quem;
    PERFORM set_config('request.jwt.claims', json_build_object('sub', x.quem, 'role', 'authenticated')::text, true);
    IF public.fundamento_linha(x.tabela, x.op, x.novo, x.velho) ->> 'via' IS DISTINCT FROM x.esperado THEN
      PERFORM pg_temp.falha('fundamento_linha: ' || x.caso || ' deu ' || coalesce(public.fundamento_linha(x.tabela, x.op, x.novo, x.velho) ->> 'via', 'nada') || ' (esperado ' || coalesce(x.esperado, 'nada') || ')');
    END IF;
    PERFORM pg_temp.ls_sistema();
    UPDATE public.profiles SET servidor_id = NULL WHERE id = x.quem;
  END LOOP;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_ch, 'role', 'authenticated')::text, true);
  IF public.fundamento_linha('solicitacoes_abono', 'UPDATE', jsonb_build_object('status', 'aprovado_chefia'), jsonb_build_object('status', 'pendente')) IS NOT NULL THEN
    PERFORM pg_temp.falha('fundamento_linha: chefia SEM servidor vinculado ganha a via chefia');
  END IF;

  -- ===== saneamento_lancamento: admin, ou módulo rh com rh.auditoria.visualizar
  PERFORM pg_temp.ls_sistema();
  UPDATE public.profiles SET servidor_id = s_lot WHERE id = u_rh;
  r := pg_temp.valor_desfeito_como(u_admin, 'authenticated', format('SELECT concat_ws(''|'', nome, matricula, tem_login, array_to_string(problemas, '','')) FROM public.saneamento_lancamento() WHERE servidor_id = %L', s_sem));
  IF r IS DISTINCT FROM 'LS Sem login|LS-15|f|sem_login,sem_lotacao' THEN PERFORM pg_temp.falha('saneamento_lancamento: servidor sem login e sem lotação = ' || coalesce(r, 'nada')); END IF;
  r := pg_temp.valor_desfeito_como(u_admin, 'authenticated', format('SELECT concat_ws(''|'', tem_login, login_ativo, lotacao_unidade_id, lotacao_unidade_nome, array_to_string(problemas, '','')) FROM public.saneamento_lancamento() WHERE servidor_id = %L', s_lot));
  IF r IS DISTINCT FROM concat_ws('|', true, true, e_sub, 'LS RH folha', 'lotacao_divergente') THEN PERFORM pg_temp.falha('saneamento_lancamento: lotação divergente = ' || coalesce(r, 'nada')); END IF;
  r := pg_temp.valor_desfeito_como(u_admin, 'authenticated', format('SELECT array_to_string(problemas, '','') FROM public.saneamento_lancamento() WHERE servidor_id = %L', s_auto));
  IF r IS DISTINCT FROM 'sem_login,fundamento_autoconcedido' THEN PERFORM pg_temp.falha('saneamento_lancamento: lotação autoconcedida = ' || coalesce(r, 'nada')); END IF;
  PERFORM pg_temp.ls_sistema();
  UPDATE public.designacoes SET aprovado_por = u_ch WHERE id = d1;   -- u_ch lançou a designação: aprovada por quem a lançou
  r := pg_temp.valor_desfeito_como(u_admin, 'authenticated', format('SELECT array_to_string(problemas, '','') FROM public.saneamento_lancamento() WHERE servidor_id = %L', s_des));
  IF r IS DISTINCT FROM 'sem_login,fundamento_autoconcedido' THEN PERFORM pg_temp.falha('saneamento_lancamento: designação aprovada por quem a lançou = ' || coalesce(r, 'nada')); END IF;
  PERFORM pg_temp.ls_sistema();
  UPDATE public.designacoes SET aprovado_por = u_admin WHERE id = d1;
  r := pg_temp.valor_desfeito_como(u_admin, 'authenticated', format('SELECT count(*)::text FROM public.saneamento_lancamento() WHERE servidor_id IN (%L, %L)', s_exo, s_fora));
  IF r IS DISTINCT FROM '1' THEN PERFORM pg_temp.falha('saneamento_lancamento: exonerado listado ou servidor sem login com lotação certa fora (' || coalesce(r, 'nulo') || ')'); END IF;
  PERFORM pg_temp.ls_sistema();
  SELECT permissions INTO perm_antes FROM public.user_modules WHERE user_id = u_rh AND module = 'rh';
  UPDATE public.user_modules SET permissions = '{}' WHERE user_id = u_rh AND module = 'rh';
  r := pg_temp.sql_como(u_rh, 'authenticated', 'SELECT * FROM public.saneamento_lancamento()');
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('saneamento_lancamento: módulo rh sem rh.auditoria.visualizar executa (' || r || ')'); END IF;
  PERFORM pg_temp.ls_sistema();
  UPDATE public.user_modules SET permissions = ARRAY['rh.auditoria.visualizar'] WHERE user_id = u_rh AND module = 'rh';
  r := pg_temp.sql_como(u_rh, 'authenticated', 'SELECT * FROM public.saneamento_lancamento()');
  IF r NOT LIKE 'ok:%' THEN PERFORM pg_temp.falha('saneamento_lancamento: módulo rh com rh.auditoria.visualizar não executa (' || r || ')'); END IF;
  PERFORM pg_temp.ls_sistema();
  UPDATE public.user_modules SET permissions = perm_antes WHERE user_id = u_rh AND module = 'rh';
  FOR x IN SELECT * FROM (VALUES ('anon', NULL::uuid, 'anon'), ('srv_a', u_a, 'authenticated'), ('inativo', u_inativo, 'authenticated')) AS v(quem, uid, papel) LOOP
    r := pg_temp.sql_como(x.uid, x.papel, 'SELECT * FROM public.saneamento_lancamento()');
    IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('saneamento_lancamento: ' || x.quem || ' executa (' || r || ')'); END IF;
  END LOOP;

  -- ===== cascata de gravação checada: a licença ativa atualiza a situação do servidor (trigger AFTER) com em_cascata
  PERFORM pg_temp.ls_sistema();
  INSERT INTO public.licencas_afastamentos (servidor_id, tipo_afastamento, data_inicio, status)
  VALUES (s_fora, (SELECT e.enumlabel::public.tipo_afastamento FROM pg_enum e WHERE e.enumtypid = 'public.tipo_afastamento'::regtype ORDER BY e.enumsortorder LIMIT 1),
          current_date, 'ativa');
  SELECT fundamento INTO j FROM public.audit_logs WHERE entity_id = s_fora AND entity_type = 'servidores' AND action = 'update' ORDER BY sequencia DESC LIMIT 1;
  IF j IS NULL OR j ->> 'em_cascata' IS DISTINCT FROM 'true' THEN
    PERFORM pg_temp.falha('lançamento por setor: situação do servidor atualizada pela licença sem em_cascata na trilha (' || coalesce(j::text, 'nulo') || ')');
  END IF;
  -- cascata de FK (ON DELETE CASCADE): a checagem da linha filha é pulada (marca), mas a trilha dela dispara depois do
  -- comando (o Postgres enfileira os AFTER da cascata no comando de fora) e leva o fundamento calculado para a filha
  DELETE FROM public.comissoes WHERE id = c1;
  SELECT fundamento INTO j FROM public.audit_logs WHERE entity_id = cm1 AND action = 'delete' ORDER BY sequencia DESC LIMIT 1;
  IF j IS NULL OR j ->> 'permitido' IS DISTINCT FROM 'true' THEN
    PERFORM pg_temp.falha('lançamento por setor: membros apagados com a comissão sem trilha (' || coalesce(j::text, 'nulo') || ')');
  END IF;
  -- a marca da cascata não sobra para o comando seguinte da transação
  IF coalesce(current_setting('lancamento.cadeia', true), '') <> '' THEN
    PERFORM pg_temp.falha('lançamento por setor: a marca de cascata (lancamento.cadeia) sobrou depois do comando');
  END IF;

  -- cenário desfeito (este é o último bloco, mas o RH volta ao modo da migração)
  PERFORM pg_temp.ls_sistema();
  UPDATE public.profiles SET servidor_id = NULL WHERE id IN (u_rh, u_ch);
  UPDATE public.regra_lancamento SET modo = 'registrar' WHERE modulo = 'rh';
  PERFORM pg_temp.nota('Lançamento por setor (fase 1): catálogo, data_local, cobertura, privilégios, comissões, modos (desligado, registrar, exigir, o mais restritivo), exigir só por migração, lotação, cessão, autoconcessão, ciclo, designação, autoatendimento, chefia, sistema, sem login, admin sem servidor, cascatas, cache, trilha, log_audit, registrar_evento e as duas RPCs verificados');
END $$;

-- ---------------------------------------------------------------- Workflow: acompanhamento do SEI (TRIGGERS LIGADOS)
-- Migração 20261013100000_wf_modelos_fluxo.sql (spec docs/superpowers/specs/2026-10-13-tramitacao-acompanhamento-sei-design.md):
--   * fn_somar_dias_uteis pula sábado, domingo e feriados (sexta + 1 = segunda; 24/12 + 2 com 25/12 feriado = 29/12);
--   * a carga inicial traz os 7 modelos com as etapas e os itens de checklist da spec (compras 8 etapas e 8 itens,
--     patrimonio_baixa 4 etapas, etapa 2 de diarias na chefia do solicitante);
--   * as três tabelas de modelo seguem a classe permissao (workflow lê, escrita só com workflow.admin) no teste genérico;
--     fn_somar_dias_uteis não é executável por anon.
-- (as tarefas seguintes do plano acrescentam casos neste mesmo bloco)
DO $$
DECLARE
  d date; n int; fid uuid;
  -- as linhas do teste genérico (classe permissao) também ficam nas tabelas: a conferência olha só os 7 modelos da carga
  modelos text[] := ARRAY['compras', 'diarias', 'convenios', 'almoxarifado', 'pagamentos', 'patrimonio_tombamento', 'patrimonio_baixa'];
BEGIN
  SET LOCAL session_replication_role = origin;

  -- dias úteis: fim de semana. O teste genérico de catálogo grava em feriados uma linha com data = current_date:
  -- sem tirá-la, o caso falharia quando o teste rodasse justamente em 19/10/2026 (ela vira feriado na segunda).
  DELETE FROM public.feriados WHERE data BETWEEN DATE '2026-10-16' AND DATE '2026-10-20';
  d := public.fn_somar_dias_uteis(DATE '2026-10-16', 1);  -- sexta
  IF d IS DISTINCT FROM DATE '2026-10-19' THEN
    PERFORM pg_temp.falha('wf: fn_somar_dias_uteis(sexta 16/10, 1) devia dar 19/10 e deu ' || coalesce(d::text, 'nulo'));
  END IF;
  -- zero dia útil não anda; começar no sábado conta a partir da segunda
  d := public.fn_somar_dias_uteis(DATE '2026-10-16', 0);
  IF d IS DISTINCT FROM DATE '2026-10-16' THEN
    PERFORM pg_temp.falha('wf: fn_somar_dias_uteis(data, 0) devia devolver a própria data e deu ' || coalesce(d::text, 'nulo'));
  END IF;
  d := public.fn_somar_dias_uteis(DATE '2026-10-17', 1);  -- sábado
  IF d IS DISTINCT FROM DATE '2026-10-19' THEN
    PERFORM pg_temp.falha('wf: fn_somar_dias_uteis(sábado 17/10, 1) devia dar 19/10 e deu ' || coalesce(d::text, 'nulo'));
  END IF;

  -- p_dias nulo não anda: devolve a própria data
  d := public.fn_somar_dias_uteis(DATE '2026-10-16', NULL);
  IF d IS DISTINCT FROM DATE '2026-10-16' THEN
    PERFORM pg_temp.falha('wf: fn_somar_dias_uteis(data, NULL) devia devolver a própria data e deu ' || coalesce(d::text, 'nulo'));
  END IF;
  -- negativo ou acima de 3650 recusa com 22023 (o laço não roda sem fim); 3650 ainda vale
  FOREACH n IN ARRAY ARRAY[-3, 3651, 2147483647] LOOP
    BEGIN
      d := public.fn_somar_dias_uteis(DATE '2026-10-16', n);
      PERFORM pg_temp.falha(format('wf: fn_somar_dias_uteis(data, %s) devia recusar com 22023 e deu %s', n, coalesce(d::text, 'nulo')));
    EXCEPTION WHEN invalid_parameter_value THEN NULL;
    END;
  END LOOP;
  d := public.fn_somar_dias_uteis(DATE '2026-10-16', 3650);
  IF d IS NULL OR d <= DATE '2036-10-16' THEN
    PERFORM pg_temp.falha('wf: fn_somar_dias_uteis(data, 3650) devia andar 3650 dias úteis e deu ' || coalesce(d::text, 'nulo'));
  END IF;

  -- dias úteis: feriado (25/12/2026 é sexta)
  INSERT INTO public.feriados (data, nome, tipo, recorrente, ativo)
    VALUES (DATE '2026-12-25', 'Natal (teste do workflow)', 'nacional', false, true) RETURNING id INTO fid;
  d := public.fn_somar_dias_uteis(DATE '2026-12-24', 2);  -- quinta; 25 feriado, 26/27 fim de semana, 28 e 29
  IF d IS DISTINCT FROM DATE '2026-12-29' THEN
    PERFORM pg_temp.falha('wf: fn_somar_dias_uteis(24/12, 2) com 25/12 feriado devia dar 29/12 e deu ' || coalesce(d::text, 'nulo'));
  END IF;
  DELETE FROM public.feriados WHERE id = fid;
  d := public.fn_somar_dias_uteis(DATE '2026-12-24', 2);
  IF d IS DISTINCT FROM DATE '2026-12-28' THEN
    PERFORM pg_temp.falha('wf: fn_somar_dias_uteis(24/12, 2) sem feriado devia dar 28/12 e deu ' || coalesce(d::text, 'nulo'));
  END IF;

  -- carga inicial
  SELECT count(*) INTO n FROM public.processo_modelos WHERE codigo = ANY(modelos);
  IF n <> 7 THEN PERFORM pg_temp.falha('wf: a carga devia ter os 7 modelos e tem ' || n); END IF;

  SELECT count(*) INTO n FROM public.processo_modelo_etapas e JOIN public.processo_modelos m ON m.id = e.modelo_id WHERE m.codigo = 'compras';
  IF n <> 8 THEN PERFORM pg_temp.falha('wf: compras devia ter 8 etapas e tem ' || n); END IF;
  SELECT count(*) INTO n FROM public.processo_modelo_checklist c JOIN public.processo_modelos m ON m.id = c.modelo_id WHERE m.codigo = 'compras';
  IF n <> 8 THEN PERFORM pg_temp.falha('wf: compras devia ter 8 itens de checklist e tem ' || n); END IF;
  SELECT count(*) INTO n FROM public.processo_modelo_etapas e JOIN public.processo_modelos m ON m.id = e.modelo_id WHERE m.codigo = 'patrimonio_baixa';
  IF n <> 4 THEN PERFORM pg_temp.falha('wf: patrimonio_baixa devia ter 4 etapas e tem ' || n); END IF;

  SELECT count(*) INTO n FROM public.processo_modelo_etapas e JOIN public.processo_modelos m ON m.id = e.modelo_id
    WHERE m.codigo = 'diarias' AND e.ordem = 2 AND e.unidade_sigla = '@CHEFIA';
  IF n <> 1 THEN PERFORM pg_temp.falha('wf: a etapa 2 de diarias devia ter unidade_sigla @CHEFIA'); END IF;

  -- etapas por modelo (spec), sem prazo só em Fiscalização, Viagem e Execução
  SELECT count(*) INTO n FROM (
    SELECT m.codigo, count(*) q FROM public.processo_modelo_etapas e JOIN public.processo_modelos m ON m.id = e.modelo_id GROUP BY m.codigo
  ) t WHERE (codigo, q) IN (('compras', 8), ('diarias', 8), ('convenios', 6), ('almoxarifado', 6), ('pagamentos', 6),
                            ('patrimonio_tombamento', 3), ('patrimonio_baixa', 4));
  IF n <> 7 THEN PERFORM pg_temp.falha('wf: quantidade de etapas por modelo diferente da spec (' || n || ' de 7 conferem)'); END IF;
  SELECT count(*) INTO n FROM public.processo_modelo_etapas e JOIN public.processo_modelos m ON m.id = e.modelo_id
    WHERE m.codigo = ANY(modelos) AND e.prazo_dias_uteis IS NULL;
  IF n <> 3 THEN PERFORM pg_temp.falha('wf: só Fiscalização, Viagem e Execução ficam sem prazo; etapas sem prazo: ' || n); END IF;

  -- todo item de checklist aponta para uma etapa que existe no modelo
  SELECT count(*) INTO n FROM public.processo_modelo_checklist c JOIN public.processo_modelos m ON m.id = c.modelo_id
    WHERE m.codigo = ANY(modelos) AND NOT EXISTS (SELECT 1 FROM public.processo_modelo_etapas e WHERE e.modelo_id = c.modelo_id AND e.ordem = c.etapa_ordem);
  IF n <> 0 THEN PERFORM pg_temp.falha('wf: ' || n || ' item(ns) de checklist apontam para etapa inexistente'); END IF;

  -- anon não executa a função de dias úteis; authenticated executa
  IF has_function_privilege('anon', 'public.fn_somar_dias_uteis(date, integer)', 'EXECUTE') THEN
    PERFORM pg_temp.falha('wf: anon não podia executar fn_somar_dias_uteis');
  END IF;
  IF NOT has_function_privilege('authenticated', 'public.fn_somar_dias_uteis(date, integer)', 'EXECUTE') THEN
    PERFORM pg_temp.falha('wf: authenticated devia executar fn_somar_dias_uteis');
  END IF;

  PERFORM pg_temp.nota('Workflow (modelos de fluxo): dias úteis (fim de semana e feriado), carga inicial dos 7 modelos, etapas, prazos, checklist e execução da função verificados');
END $$;

-- Migração 20261013100100_wf_processo_sigilo.sql (mesma spec, seções "Sigilo e RLS" e "Limpeza"):
--   * wf_pode_ver_processo: processo público -> módulo workflow com workflow.visualizar; restrito/sigiloso -> criador,
--     credencial em acesso_processo_sigiloso ou workflow.admin (o papel admin passa). As seis tabelas do processo
--     (processos_administrativos, movimentacoes_processo, despachos, documentos_processo, prazos_processo,
--     processo_checklist_respostas) leem por ela;
--   * ninguém grava direto (nem o admin): sem policy de INSERT/UPDATE; DELETE só com workflow.admin;
--   * limpeza: um trigger de auditoria e um de updated_at por tabela, sem os de arquivamento, sem
--     fn_proximo_numero_processo; número interno com trava por ano; numero_sei único e sem espaços.
-- Personas próprias (uids fixos, perfis ativos): visualizar, tramitar, criador, credencial, workflow.admin e a
-- permissão avulsa sem módulo. TRIGGERS LIGADOS.
DO $$
DECLARE
  u_vis uuid := 'a0000000-0000-0000-0000-0000000000e1';    -- módulo workflow + workflow.visualizar
  u_tram uuid := 'a0000000-0000-0000-0000-0000000000e2';   -- módulo workflow + workflow.visualizar + workflow.tramitar
  u_cri uuid := 'a0000000-0000-0000-0000-0000000000e3';    -- módulo workflow + workflow.visualizar; criou o sigiloso
  u_cred uuid := 'a0000000-0000-0000-0000-0000000000e4';   -- módulo workflow + workflow.visualizar; credencial no sigiloso
  u_wfa uuid := 'a0000000-0000-0000-0000-0000000000e5';    -- módulo workflow + workflow.admin
  u_avu uuid := 'a0000000-0000-0000-0000-0000000000e6';    -- workflow.visualizar avulsa, sem o módulo
  u_csm uuid := 'a0000000-0000-0000-0000-0000000000e7';    -- credencial no sigiloso, SEM o módulo workflow
  u_admin uuid := (SELECT uid FROM persona WHERE nome = 'admin');
  u_nenhum uuid := (SELECT uid FROM persona WHERE nome = 'nenhum');
  u_mod uuid := (SELECT uid FROM persona WHERE nome = 'mod_workflow');   -- módulo sem workflow.visualizar
  tabs text[] := ARRAY['processos_administrativos', 'movimentacoes_processo', 'despachos', 'documentos_processo',
                       'prazos_processo', 'processo_checklist_respostas'];
  p_pub uuid; p_sig uuid; p_res uuid; mov uuid; item uuid; t text; r text; n int; x record; q text;
BEGIN
  SET LOCAL session_replication_role = origin;
  INSERT INTO auth.users (id, email) VALUES (u_vis, 'wf_vis@teste.invalid'), (u_tram, 'wf_tram@teste.invalid'),
    (u_cri, 'wf_cri@teste.invalid'), (u_cred, 'wf_cred@teste.invalid'), (u_wfa, 'wf_adm@teste.invalid'), (u_avu, 'wf_avu@teste.invalid'),
    (u_csm, 'wf_csm@teste.invalid');
  UPDATE public.profiles SET is_active = true WHERE id IN (u_vis, u_tram, u_cri, u_cred, u_wfa, u_avu, u_csm);
  INSERT INTO public.user_modules (user_id, module, permissions) VALUES
    (u_vis, 'workflow', '{workflow.visualizar}'), (u_tram, 'workflow', '{workflow.visualizar,workflow.tramitar}'),
    (u_cri, 'workflow', '{workflow.visualizar}'), (u_cred, 'workflow', '{workflow.visualizar}'), (u_wfa, 'workflow', '{workflow.admin}');
  INSERT INTO public.user_permissions (user_id, permission) VALUES (u_avu, 'workflow.visualizar');

  -- processos (o número interno vem do trigger) e uma linha de cada tabela filha em cada um
  INSERT INTO public.processos_administrativos (assunto, interessado_nome, sigilo, created_by)
    VALUES ('wf teste público', 'Interessado teste', 'publico', u_tram) RETURNING id INTO p_pub;
  INSERT INTO public.processos_administrativos (assunto, interessado_nome, sigilo, created_by)
    VALUES ('wf teste sigiloso', 'Interessado teste', 'sigiloso', u_cri) RETURNING id INTO p_sig;
  INSERT INTO public.processos_administrativos (assunto, interessado_nome, sigilo, created_by)
    VALUES ('wf teste restrito', 'Interessado teste', 'restrito', u_cri) RETURNING id INTO p_res;
  INSERT INTO public.acesso_processo_sigiloso (processo_id, usuario_id) VALUES (p_sig, u_cred), (p_sig, u_csm);
  FOREACH mov IN ARRAY ARRAY[p_pub, p_sig, p_res] LOOP
    INSERT INTO public.movimentacoes_processo (processo_id, descricao) VALUES (mov, 'wf teste');
    INSERT INTO public.despachos (processo_id, texto_despacho) VALUES (mov, 'wf teste');
    INSERT INTO public.documentos_processo (processo_id, titulo) VALUES (mov, 'wf teste');
    INSERT INTO public.prazos_processo (processo_id, descricao, prazo_dias, data_limite) VALUES (mov, 'wf teste', 5, current_date + 5);
  END LOOP;
  SELECT c.id INTO item FROM public.processo_modelo_checklist c JOIN public.processo_modelos m ON m.id = c.modelo_id
   WHERE m.codigo = 'compras' ORDER BY c.etapa_ordem, c.codigo LIMIT 1;
  IF to_regclass('public.processo_checklist_respostas') IS NULL THEN
    PERFORM pg_temp.falha('wf sigilo: tabela processo_checklist_respostas não existe');
  ELSE
    EXECUTE 'INSERT INTO public.processo_checklist_respostas (processo_id, item_id, marcado) VALUES ($1, $3, true), ($2, $3, true), ($4, $3, true)'
      USING p_pub, p_sig, item, p_res;
  END IF;

  -- leitura: quantas linhas de cada processo cada persona enxerga, em cada uma das seis tabelas
  FOR x IN SELECT * FROM (VALUES
      -- persona, processo, esperado, caso
      (u_vis,    p_pub, 1, 'visualizar lê o público'),
      (u_vis,    p_sig, 0, 'visualizar sem credencial lê o sigiloso'),
      (u_vis,    p_res, 0, 'visualizar sem credencial lê o restrito'),
      (u_tram,   p_sig, 0, 'tramitar sem credencial lê o sigiloso'),
      (u_tram,   p_res, 0, 'tramitar sem credencial lê o restrito'),
      (u_nenhum, p_pub, 0, 'sem módulo lê o público'),
      (u_mod,    p_pub, 0, 'módulo workflow sem workflow.visualizar lê o público'),
      (u_avu,    p_pub, 0, 'workflow.visualizar avulsa sem o módulo lê o público'),
      (u_cri,    p_sig, 1, 'criador lê o sigiloso'),
      (u_cri,    p_res, 1, 'criador lê o restrito'),
      (u_cred,   p_sig, 1, 'credencial lê o sigiloso'),
      (u_cred,   p_res, 0, 'credencial de outro processo lê o restrito'),
      (u_wfa,    p_sig, 1, 'workflow.admin lê o sigiloso'),
      (u_wfa,    p_res, 1, 'workflow.admin lê o restrito'),
      (u_admin,  p_sig, 1, 'papel admin lê o sigiloso'),
      (u_admin,  p_pub, 1, 'papel admin lê o público'),
      (u_admin,  p_res, 1, 'papel admin lê o restrito'),
      -- a credencial vale sem o módulo (só perfil ativo): quem a concede (workflow.admin) decide o acesso
      (u_csm,    p_sig, 1, 'credencial sem o módulo workflow lê o sigiloso'),
      (u_csm,    p_pub, 0, 'credencial sem o módulo workflow lê o público alheio')
    ) AS v(quem, proc, esperado, caso) LOOP
    FOREACH t IN ARRAY tabs LOOP
      q := format('SELECT count(*)::text FROM public.%I WHERE %I = %L', t, CASE t WHEN 'processos_administrativos' THEN 'id' ELSE 'processo_id' END, x.proc);
      r := pg_temp.valor_desfeito_como(x.quem, 'authenticated', q);
      IF r IS DISTINCT FROM x.esperado::text THEN
        PERFORM pg_temp.falha(format('wf sigilo: %s em %s: %s linha(s) (esperado %s)', x.caso, t, r, x.esperado));
      END IF;
    END LOOP;
  END LOOP;
  -- perfil bloqueado: o criador deixa de ler
  UPDATE public.profiles SET is_active = false WHERE id = u_cri;
  r := pg_temp.valor_desfeito_como(u_cri, 'authenticated', format('SELECT count(*)::text FROM public.processos_administrativos WHERE id = %L', p_sig));
  IF r IS DISTINCT FROM '0' THEN PERFORM pg_temp.falha('wf sigilo: criador com perfil bloqueado lê o sigiloso (' || r || ')'); END IF;
  UPDATE public.profiles SET is_active = true WHERE id = u_cri;

  -- trilha (audit_log_licitacoes, migração 20261015100000): a cópia das linhas do processo segue o sigilo dele.
  -- O módulo compras sozinho não lê a trilha do sigiloso (nem a do público: a tabela de origem também não mostra);
  -- o criador com compras lê; o papel admin lê. Os triggers de auditoria gravaram ao inserir as linhas acima.
  INSERT INTO public.user_modules (user_id, module) VALUES (u_cri, 'compras');
  FOR x IN SELECT * FROM (VALUES
      ((SELECT uid FROM persona WHERE nome = 'mod_compras'), p_sig, false, 'módulo compras lê a trilha do sigiloso'),
      ((SELECT uid FROM persona WHERE nome = 'mod_compras'), p_pub, false, 'módulo compras sem workflow lê a trilha do público'),
      (u_nenhum, p_sig, false, 'sem módulo lê a trilha do sigiloso'),
      (u_cri,    p_sig, true,  'criador com compras lê a trilha do sigiloso'),
      (u_admin,  p_sig, true,  'papel admin lê a trilha do sigiloso')
    ) AS v(quem, proc, ve, caso) LOOP
    q := format($q$SELECT count(*)::text FROM public.audit_log_licitacoes
                 WHERE CASE WHEN tabela_origem = 'processos_administrativos' THEN registro_id::text
                            WHEN tabela_origem IN ('despachos', 'documentos_processo', 'movimentacoes_processo', 'prazos_processo')
                              THEN coalesce(dados_novos, dados_anteriores) ->> 'processo_id' END = %L$q$, x.proc);
    r := pg_temp.valor_desfeito_como(x.quem, 'authenticated', q);
    IF x.ve AND (r IS NULL OR r::int < 5) THEN
      PERFORM pg_temp.falha(format('wf trilha: %s: %s linha(s) (esperado ao menos 5, uma por tabela)', x.caso, r));
    ELSIF NOT x.ve AND r IS DISTINCT FROM '0' THEN
      PERFORM pg_temp.falha(format('wf trilha: %s: %s linha(s) (esperado 0)', x.caso, r));
    END IF;
  END LOOP;
  DELETE FROM public.user_modules WHERE user_id = u_cri AND module = 'compras';

  -- anon: sem privilégio na tabela nova
  IF to_regclass('public.processo_checklist_respostas') IS NOT NULL AND pg_temp.sel(NULL, 'anon', 'processo_checklist_respostas') <> -1 THEN
    PERFORM pg_temp.falha('wf sigilo: anon tem SELECT em processo_checklist_respostas');
  END IF;

  -- escrita direta: ninguém insere nem altera (nem o admin); só workflow.admin (e o papel admin) apaga
  FOREACH t IN ARRAY tabs LOOP
    FOR x IN SELECT * FROM (VALUES ('tramitar', u_tram), ('workflow.admin', u_wfa), ('papel admin', u_admin)) AS v(nome, quem) LOOP
      r := pg_temp.sql_como(x.quem, 'authenticated', format('INSERT INTO public.%I (id) VALUES (gen_random_uuid())', t));
      IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha(format('wf escrita: %s insere direto em %s (%s)', x.nome, t, r)); END IF;
      r := pg_temp.sql_como(x.quem, 'authenticated', format('UPDATE public.%I SET updated_at = now()', t));
      IF r IS DISTINCT FROM 'ok:0' THEN PERFORM pg_temp.falha(format('wf escrita: %s altera direto %s (%s)', x.nome, t, r)); END IF;
    END LOOP;
    FOR x IN SELECT * FROM (VALUES ('visualizar', u_vis, false), ('tramitar', u_tram, false), ('criador', u_cri, false),
                                   ('credencial', u_cred, false), ('workflow.admin', u_wfa, true), ('papel admin', u_admin, true)) AS v(nome, quem, apaga) LOOP
      r := pg_temp.sql_como(x.quem, 'authenticated', format('DELETE FROM public.%I', t));
      IF x.apaga AND (r NOT LIKE 'ok:%' OR r = 'ok:0') THEN
        PERFORM pg_temp.falha(format('wf exclusão: %s não apaga em %s (%s)', x.nome, t, r));
      ELSIF NOT x.apaga AND r IS DISTINCT FROM 'ok:0' THEN
        PERFORM pg_temp.falha(format('wf exclusão: %s apaga em %s (%s)', x.nome, t, r));
      END IF;
    END LOOP;
  END LOOP;

  -- policies: só wf_select e wf_delete nas seis tabelas, RLS ligado
  FOREACH t IN ARRAY tabs LOOP
    SELECT string_agg(policyname || ':' || cmd, ',' ORDER BY policyname) INTO r FROM pg_policies WHERE schemaname = 'public' AND tablename = t;
    IF r IS DISTINCT FROM 'wf_delete:DELETE,wf_select:SELECT' THEN
      PERFORM pg_temp.falha(format('wf policies: %s tem %s (esperado só wf_delete e wf_select)', t, coalesce(r, 'nenhuma')));
    END IF;
    IF NOT coalesce((SELECT relrowsecurity FROM pg_class WHERE oid = to_regclass('public.' || t)), false) THEN
      PERFORM pg_temp.falha('wf policies: RLS desligado em ' || t);
    END IF;
  END LOOP;

  -- limpeza dos triggers: um de auditoria e um de updated_at por tabela; sem os de arquivamento
  FOREACH t IN ARRAY tabs[1:5] LOOP
    SELECT count(*) INTO n FROM pg_trigger WHERE NOT tgisinternal AND tgrelid = ('public.' || t)::regclass
       AND tgfoid = 'public.fn_audit_log_licitacoes()'::regprocedure;
    IF n <> 1 THEN PERFORM pg_temp.falha(format('wf limpeza: %s tem %s trigger(s) de auditoria (esperado 1)', t, n)); END IF;
    SELECT count(*) INTO n FROM pg_trigger WHERE NOT tgisinternal AND tgrelid = ('public.' || t)::regclass
       AND tgfoid = 'public.handle_updated_at()'::regprocedure;
    IF n <> 1 THEN PERFORM pg_temp.falha(format('wf limpeza: %s tem %s trigger(s) de updated_at (esperado 1)', t, n)); END IF;
  END LOOP;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = 'public.processos_administrativos'::regclass
              AND tgname IN ('tr_verificar_arquivamento', 'tr_validar_arquivamento')) THEN
    PERFORM pg_temp.falha('wf limpeza: tr_verificar_arquivamento/tr_validar_arquivamento ainda existem');
  END IF;
  IF to_regprocedure('public.fn_proximo_numero_processo(integer)') IS NOT NULL THEN
    PERFORM pg_temp.falha('wf limpeza: fn_proximo_numero_processo ainda existe');
  END IF;
  -- número interno: 5 dígitos, gerado com trava por ano
  IF (SELECT numero_processo FROM public.processos_administrativos WHERE id = p_pub) !~ '^[0-9]{5}$' THEN
    PERFORM pg_temp.falha('wf numeração: número interno fora do padrão de 5 dígitos');
  END IF;
  IF (SELECT prosrc FROM pg_proc WHERE oid = 'public.gerar_numero_processo()'::regprocedure) !~ 'pg_advisory_xact_lock' THEN
    PERFORM pg_temp.falha('wf numeração: gerar_numero_processo sem pg_advisory_xact_lock');
  END IF;

  -- wf_pode_ver_processo: DEFINER, STABLE, search_path fixo; authenticated executa, anon não
  IF to_regprocedure('public.wf_pode_ver_processo(uuid)') IS NULL THEN
    PERFORM pg_temp.falha('wf sigilo: wf_pode_ver_processo(uuid) não existe');
  ELSE
    IF NOT (SELECT prosecdef AND provolatile = 's' AND proconfig::text ~ 'search_path' FROM pg_proc WHERE oid = 'public.wf_pode_ver_processo(uuid)'::regprocedure) THEN
      PERFORM pg_temp.falha('wf sigilo: wf_pode_ver_processo devia ser SECURITY DEFINER, STABLE e com search_path fixo');
    END IF;
    IF has_function_privilege('anon', 'public.wf_pode_ver_processo(uuid)', 'EXECUTE') THEN
      PERFORM pg_temp.falha('wf sigilo: anon executa wf_pode_ver_processo');
    END IF;
    IF NOT has_function_privilege('authenticated', 'public.wf_pode_ver_processo(uuid)', 'EXECUTE') THEN
      PERFORM pg_temp.falha('wf sigilo: authenticated não executa wf_pode_ver_processo');
    END IF;
    -- processo inexistente: falso (sem vazar existência)
    r := pg_temp.valor_desfeito_como(u_wfa, 'authenticated', format('SELECT public.wf_pode_ver_processo(%L)::text', gen_random_uuid()));
    IF r IS DISTINCT FROM 'false' THEN PERFORM pg_temp.falha('wf sigilo: wf_pode_ver_processo de processo inexistente = ' || r); END IF;
  END IF;

  -- funções antigas de leitura respeitam o sigilo; fn_pode_arquivar_processo saiu
  IF to_regprocedure('public.fn_pode_arquivar_processo(uuid)') IS NOT NULL THEN
    PERFORM pg_temp.falha('wf limpeza: fn_pode_arquivar_processo ainda existe');
  END IF;
  r := pg_temp.valor_desfeito_como(u_vis, 'authenticated', format('SELECT count(*)::text FROM public.fn_calcular_sla_processo(%L)', p_sig));
  IF r IS DISTINCT FROM '0' THEN PERFORM pg_temp.falha('wf sigilo: fn_calcular_sla_processo devolve o sigiloso a quem não o vê (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_vis, 'authenticated', format('SELECT count(*)::text FROM public.fn_calcular_sla_processo(%L)', p_pub));
  IF r IS DISTINCT FROM '1' THEN PERFORM pg_temp.falha('wf sigilo: fn_calcular_sla_processo não devolve o público a quem o vê (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_cred, 'authenticated', format('SELECT count(*)::text FROM public.fn_calcular_sla_processo(%L)', p_sig));
  IF r IS DISTINCT FROM '1' THEN PERFORM pg_temp.falha('wf sigilo: fn_calcular_sla_processo não devolve o sigiloso à credencial (' || r || ')'); END IF;
  -- a contagem de u_vis é a dos processos que ele vê (sem p_sig e p_res) e fica 2 abaixo da do admin
  r := pg_temp.valor_desfeito_como(u_vis, 'authenticated',
         'SELECT (SELECT coalesce(sum(quantidade), 0) FROM public.fn_contar_processos_por_status())::text || ''|'' || (SELECT count(*) FROM public.processos_administrativos)::text');
  IF split_part(r, '|', 1) IS DISTINCT FROM split_part(r, '|', 2) THEN
    PERFORM pg_temp.falha('wf sigilo: fn_contar_processos_por_status conta o que visualizar não vê (' || r || ')');
  END IF;
  n := (pg_temp.valor_desfeito_como(u_admin, 'authenticated', 'SELECT coalesce(sum(quantidade), 0)::text FROM public.fn_contar_processos_por_status()'))::int
       - split_part(r, '|', 1)::int;
  IF n <> 2 THEN PERFORM pg_temp.falha('wf sigilo: contagem do admin menos a de visualizar devia ser 2 (sigiloso e restrito) e foi ' || n); END IF;
  IF (SELECT prosecdef FROM pg_proc WHERE oid = 'public.fn_contar_processos_por_status()'::regprocedure) THEN
    PERFORM pg_temp.falha('wf sigilo: fn_contar_processos_por_status ainda é SECURITY DEFINER');
  END IF;
  -- FORCE RLS na tabela nova, como nas outras do workflow
  IF NOT coalesce((SELECT relforcerowsecurity FROM pg_class WHERE oid = to_regclass('public.processo_checklist_respostas')), false) THEN
    PERFORM pg_temp.falha('wf sigilo: processo_checklist_respostas sem FORCE ROW LEVEL SECURITY');
  END IF;

  -- numero_sei: único quando preenchido, sem espaços
  BEGIN
    EXECUTE 'UPDATE public.processos_administrativos SET numero_sei = $1 WHERE id = $2' USING '0000.000001/2026-01', p_pub;
    BEGIN
      EXECUTE 'UPDATE public.processos_administrativos SET numero_sei = $1 WHERE id = $2' USING '0000.000001/2026-01', p_sig;
      PERFORM pg_temp.falha('wf numero_sei: aceitou número SEI repetido');
    EXCEPTION WHEN unique_violation THEN NULL;
    END;
    BEGIN
      EXECUTE 'UPDATE public.processos_administrativos SET numero_sei = $1 WHERE id = $2' USING '0000.000002 /2026-01', p_sig;
      PERFORM pg_temp.falha('wf numero_sei: aceitou número SEI com espaço');
    EXCEPTION WHEN check_violation THEN NULL;
    END;
    -- vários processos sem número SEI convivem
    EXECUTE 'SELECT count(*) FROM public.processos_administrativos WHERE numero_sei IS NULL' INTO n;
    IF n < 2 THEN PERFORM pg_temp.falha('wf numero_sei: esperava vários processos sem número SEI'); END IF;
  EXCEPTION WHEN undefined_column THEN
    PERFORM pg_temp.falha('wf numero_sei: coluna processos_administrativos.numero_sei não existe');
  END;
  -- colunas novas
  SELECT count(*) INTO n FROM information_schema.columns WHERE table_schema = 'public'
     AND (table_name, column_name) IN (('processos_administrativos', 'modelo_id'), ('processos_administrativos', 'etapa_atual_ordem'),
          ('processos_administrativos', 'unidade_atual_id'), ('processos_administrativos', 'etapa_iniciada_em'),
          ('processos_administrativos', 'etapa_prazo_limite'), ('movimentacoes_processo', 'etapa_origem_ordem'),
          ('movimentacoes_processo', 'etapa_destino_ordem'));
  IF n <> 7 THEN PERFORM pg_temp.falha('wf colunas: ' || n || ' de 7 colunas novas existem'); END IF;

  PERFORM pg_temp.nota('Workflow (sigilo e limpeza): leitura por wf_pode_ver_processo nas seis tabelas (público, restrito, sigiloso, criador, credencial com e sem módulo, workflow.admin, admin), SLA e contagem por status com sigilo, escrita direta negada, exclusão só workflow.admin, triggers únicos, numeração com trava e numero_sei único verificados');
END $$;

-- Migração 20261013100200_wf_rpcs.sql (mesma spec, seções "Banco" e "Erros e casos de borda"): as RPCs são o único
-- caminho de escrita do acompanhamento e a view v_processos_acompanhamento é a lista.
--   * wf_abrir_processo: workflow.criar; etapa 1, número interno, unidade de origem = lotação vigente (nula sem lotação);
--   * wf_marcar_item / wf_avancar_etapa / wf_devolver_etapa / wf_atualizar_numero_sei: workflow.tramitar; checklist
--     obrigatório da etapa, número SEI para sair da etapa 1, etapa esperada (40001), devolução com motivo para trás,
--     movimentação com etapa de origem e destino, prazo em dias úteis, unidade resolvida pela sigla;
--   * wf_suspender / wf_reativar / wf_concluir (workflow.concluir), wf_arquivar (workflow.arquivar): suspensão para o
--     relógio, conclusão só na última etapa com checklist completo (sem modelo conclui direto);
--   * sigilo: quem não vê o processo recebe 42501 com a mesma mensagem de processo inexistente em TODAS as RPCs;
--     credencial de leitura não altera; wf_conceder_acesso/wf_revogar_acesso só workflow.admin;
--   * fn_situacao_prazo (semáforo) e a view (security_invoker) com as colunas que o front consome.
-- Personas próprias (uids fixos ...e8 a ...ed), além de visualizar (...e1), tramitar (...e2) e workflow.admin (...e5)
-- do bloco anterior. TRIGGERS LIGADOS.
CREATE FUNCTION pg_temp.wf_confere(r text, esperado text, caso text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF r IS NULL OR r NOT LIKE esperado || '%' THEN
    PERFORM pg_temp.falha(format('wf rpc: %s (esperado %s, veio %s)', caso, esperado, coalesce(r, 'nulo')));
  END IF;
END $$;
-- mensagem COMPLETA do erro de um comando feito como a persona (sql_como corta em 90 caracteres); sempre desfaz
CREATE FUNCTION pg_temp.wf_erro_completo(p_uid uuid, p_sql text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE res text;
BEGIN
  PERFORM set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  BEGIN
    EXECUTE p_sql;
    res := 'ok';
    RAISE EXCEPTION USING ERRCODE = 'P0099', MESSAGE = 'desfazer';
  EXCEPTION
    WHEN SQLSTATE 'P0099' THEN NULL;
    WHEN OTHERS THEN res := 'erro:' || SQLSTATE || ':' || SQLERRM;
  END;
  RESET ROLE;
  RETURN res;
END $$;
-- id devolvido por valor_como (ou NULL se veio erro)
CREATE FUNCTION pg_temp.wf_uuid(r text) RETURNS uuid LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN r ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN r::uuid END
$$;

DO $$
DECLARE
  u_vis uuid := 'a0000000-0000-0000-0000-0000000000e1';    -- módulo workflow + workflow.visualizar
  u_wfa uuid := 'a0000000-0000-0000-0000-0000000000e5';    -- módulo workflow + workflow.admin
  u_op uuid := 'a0000000-0000-0000-0000-0000000000e8';     -- visualizar, criar, tramitar; lotado no setor WFORIG
  u_sl uuid := 'a0000000-0000-0000-0000-0000000000e9';     -- visualizar, criar; sem lotação
  u_conc uuid := 'a0000000-0000-0000-0000-0000000000ea';   -- visualizar, concluir
  u_arq uuid := 'a0000000-0000-0000-0000-0000000000eb';    -- visualizar, arquivar
  u_tudo uuid := 'a0000000-0000-0000-0000-0000000000ec';   -- todas as permissões menos admin; sem credencial
  u_ct uuid := 'a0000000-0000-0000-0000-0000000000ed';     -- visualizar, tramitar; recebe credencial no sigiloso
  u_avc uuid := 'a0000000-0000-0000-0000-0000000000ee';    -- workflow.criar avulsa, SEM o módulo workflow
  u_admin_papel uuid := (SELECT uid FROM persona WHERE nome = 'admin');   -- papel admin
  un_chefe uuid := 'c1000000-0000-0000-0000-0000000000e1';
  un_orig uuid := 'c1000000-0000-0000-0000-0000000000e2';
  un_nupat uuid := 'c1000000-0000-0000-0000-0000000000e3';
  un_inativa uuid := 'c1000000-0000-0000-0000-0000000000e4';
  srv uuid := 'b1000000-0000-0000-0000-0000000000e8';
  hoje date := public.data_local();
  tem_rpc boolean := to_regprocedure('public.wf_abrir_processo(text, text, text, text, text, text, public.nivel_sigilo_processo, text)') IS NOT NULL;
  fantasma uuid := gen_random_uuid();
  p1 uuid; p2 uuid; p_s uuid; p_old uuid; j jsonb; r text; r2 text; n int; x record; q text; esperado text; num text;
  abrir text := 'SELECT public.wf_abrir_processo(%L, %L, NULL, ''interno'', %L, NULL, %L, %L)::text';
BEGIN
  SET LOCAL session_replication_role = origin;
  INSERT INTO auth.users (id, email) VALUES (u_op, 'wf_op@teste.invalid'), (u_sl, 'wf_sl@teste.invalid'),
    (u_conc, 'wf_conc@teste.invalid'), (u_arq, 'wf_arq@teste.invalid'), (u_tudo, 'wf_tudo@teste.invalid'), (u_ct, 'wf_ct@teste.invalid'),
    (u_avc, 'wf_avc@teste.invalid');
  UPDATE public.profiles SET is_active = true WHERE id IN (u_op, u_sl, u_conc, u_arq, u_tudo, u_ct, u_avc);
  INSERT INTO public.user_permissions (user_id, permission) VALUES (u_avc, 'workflow.criar');
  INSERT INTO public.user_modules (user_id, module, permissions) VALUES
    (u_op, 'workflow', '{workflow.visualizar,workflow.criar,workflow.tramitar}'),
    (u_sl, 'workflow', '{workflow.visualizar,workflow.criar}'),
    (u_conc, 'workflow', '{workflow.visualizar,workflow.concluir}'),
    (u_arq, 'workflow', '{workflow.visualizar,workflow.arquivar}'),
    (u_tudo, 'workflow', '{workflow.visualizar,workflow.criar,workflow.tramitar,workflow.concluir,workflow.arquivar}'),
    (u_ct, 'workflow', '{workflow.visualizar,workflow.tramitar}');

  -- unidades: chefia > setor de origem; núcleo de patrimônio (sigla NUPAT, o modelo diz NuPat); uma inativa
  INSERT INTO public.estrutura_organizacional (id, nome, sigla, tipo, superior_id, ativo) VALUES
    (un_chefe, 'Diretoria teste wf', 'WFCHEFE', 'diretoria', NULL, true),
    (un_orig, 'Setor teste wf', 'WFORIG', 'setor', un_chefe, true),
    (un_nupat, 'Núcleo de patrimônio teste wf', 'NUPAT', 'nucleo', NULL, true),
    (un_inativa, 'Unidade inativa teste wf', 'WFINATIVA', 'setor', NULL, false);
  -- servidor e lotação de u_op (modo réplica: sem os triggers de setor/autoria do RH)
  SET LOCAL session_replication_role = replica;
  INSERT INTO public.servidores (id, nome_completo, cpf) VALUES (srv, 'Servidor teste wf', '00000000e8');
  INSERT INTO public.lotacoes (servidor_id, unidade_id, data_inicio, ativo) VALUES (srv, un_orig, hoje - 30, true);
  UPDATE public.profiles SET servidor_id = srv WHERE id = u_op;
  SET LOCAL session_replication_role = origin;

  -- ===== resolução da unidade (função interna)
  IF to_regprocedure('public.wf_resolver_unidade(text, uuid)') IS NULL THEN
    PERFORM pg_temp.falha('wf rpc: wf_resolver_unidade(text, uuid) não existe');
  ELSE
    FOR x IN SELECT * FROM (VALUES ('@ORIGEM', un_orig, un_orig), ('@CHEFIA', un_orig, un_chefe), ('nupat', NULL::uuid, un_nupat),
                                   ('NuPat', un_orig, un_nupat), ('WFINATIVA', NULL, NULL), ('SIGLA-INEXISTENTE', un_orig, NULL),
                                   ('@ORIGEM', NULL, NULL), ('@CHEFIA', NULL, NULL), ('@CHEFIA', un_chefe, NULL)) AS v(sigla, origem, esperado) LOOP
      EXECUTE 'SELECT public.wf_resolver_unidade($1, $2)::text' INTO r USING x.sigla, x.origem;
      IF r IS DISTINCT FROM x.esperado::text THEN
        PERFORM pg_temp.falha(format('wf rpc: wf_resolver_unidade(%s, %s) = %s (esperado %s)', x.sigla, coalesce(x.origem::text, 'nulo'), coalesce(r, 'nulo'), coalesce(x.esperado::text, 'nulo')));
      END IF;
    END LOOP;
  END IF;

  -- ===== abrir
  r := pg_temp.sql_como(u_vis, 'authenticated', format(abrir, 'patrimonio_tombamento', 'wf rpc', 'Interessado', 'publico', NULL));
  PERFORM pg_temp.wf_confere(r, 'erro:42501', 'sem workflow.criar abre processo');
  -- workflow.criar avulsa (a permissão vale, o módulo não): não abre, mesma recusa de quem não tem a permissão
  IF NOT public.has_permission_code(u_avc, 'workflow.criar') OR public.can_access_module(u_avc, 'workflow') THEN
    PERFORM pg_temp.falha('wf rpc: a persona avulsa devia ter workflow.criar e não ter o módulo workflow');
  END IF;
  r := pg_temp.sql_como(u_avc, 'authenticated', format(abrir, 'patrimonio_tombamento', 'wf rpc', 'Interessado', 'publico', NULL));
  PERFORM pg_temp.wf_confere(r, 'erro:42501', 'workflow.criar sem o módulo abre processo');
  r := pg_temp.sql_como(u_op, 'authenticated', format(abrir, 'modelo_que_nao_existe', 'wf rpc', 'Interessado', 'publico', NULL));
  PERFORM pg_temp.wf_confere(r, 'erro:22023', 'abre processo com modelo inexistente');
  r := pg_temp.sql_como(u_op, 'authenticated', format(abrir, 'patrimonio_tombamento', '   ', 'Interessado', 'publico', NULL));
  PERFORM pg_temp.wf_confere(r, 'erro:22023', 'abre processo sem assunto');
  r := pg_temp.sql_como(u_op, 'authenticated', format(abrir, 'patrimonio_tombamento', 'wf rpc', 'Interessado', 'publico', 'sem-digito'));
  PERFORM pg_temp.wf_confere(r, 'erro:22023', 'abre processo com número SEI sem dígitos');

  r := pg_temp.valor_como(u_op, 'authenticated', format(abrir, 'patrimonio_tombamento', 'wf rpc tombamento', 'Setor teste', 'publico', NULL));
  p1 := pg_temp.wf_uuid(r);
  IF p1 IS NULL THEN PERFORM pg_temp.falha('wf rpc: workflow.criar não abre processo (' || coalesce(r, 'nulo') || ')'); END IF;
  SELECT to_jsonb(p) INTO j FROM public.processos_administrativos p WHERE id = p1;
  esperado := concat_ws('|', '1', 'aberto', un_orig, un_orig, public.fn_somar_dias_uteis(hoje, 5), u_op,
                        (SELECT tipo_processo FROM public.processo_modelos WHERE codigo = 'patrimonio_tombamento'),
                        (SELECT id FROM public.processo_modelos WHERE codigo = 'patrimonio_tombamento'), 'sim');
  r := concat_ws('|', j->>'etapa_atual_ordem', j->>'status', j->>'unidade_origem_id', j->>'unidade_atual_id', j->>'etapa_prazo_limite',
                 j->>'created_by', j->>'tipo_processo', j->>'modelo_id', CASE WHEN j->>'numero_processo' ~ '^[0-9]{5}$' THEN 'sim' END);
  IF r IS DISTINCT FROM esperado THEN
    PERFORM pg_temp.falha(format('wf rpc: processo aberto fora do esperado (etapa|status|origem|unidade|prazo|criador|tipo|modelo|número): %s (esperado %s)', r, esperado));
  END IF;
  num := (j->>'numero_processo') || '/' || (j->>'ano');

  -- sem lotação vigente: abre com unidade de origem nula; @ORIGEM fica só com a sigla
  r := pg_temp.valor_como(u_sl, 'authenticated', format(abrir, 'patrimonio_tombamento', 'wf rpc sem lotação', 'Interessado', 'publico', NULL));
  p2 := pg_temp.wf_uuid(r);
  IF p2 IS NULL THEN PERFORM pg_temp.falha('wf rpc: usuário sem lotação não abre processo (' || coalesce(r, 'nulo') || ')'); END IF;
  SELECT to_jsonb(p) INTO j FROM public.processos_administrativos p WHERE id = p2;
  IF j IS NULL OR j->>'unidade_origem_id' IS NOT NULL OR j->>'unidade_atual_id' IS NOT NULL OR j->>'etapa_atual_ordem' IS DISTINCT FROM '1' THEN
    PERFORM pg_temp.falha('wf rpc: sem lotação, unidade de origem/atual deviam ser nulas e etapa 1: ' || coalesce(j::text, 'nulo'));
  END IF;

  -- ===== checklist
  r := pg_temp.sql_como(u_vis, 'authenticated', format('SELECT public.wf_marcar_item(%L, ''nota'', true, NULL)', p1));
  PERFORM pg_temp.wf_confere(r, 'erro:42501', 'sem workflow.tramitar marca item');
  r := pg_temp.sql_como(u_op, 'authenticated', format('SELECT public.wf_marcar_item(%L, ''plaqueta'', true, NULL)', p1));
  PERFORM pg_temp.wf_confere(r, 'erro:22023', 'marca item de etapa futura');
  r := pg_temp.sql_como(u_op, 'authenticated', format('SELECT public.wf_marcar_item(%L, ''item_inexistente'', true, NULL)', p1));
  PERFORM pg_temp.wf_confere(r, 'erro:22023', 'marca item que não existe no modelo');

  -- avançar com obrigatório pendente: 22023 com as DESCRIÇÕES dos itens (a mesma lista do checklist), não os códigos
  r := pg_temp.wf_erro_completo(u_op, format('SELECT public.wf_avancar_etapa(%L, 1, NULL)', p1));
  PERFORM pg_temp.wf_confere(r, 'erro:22023', 'avança com item obrigatório pendente');
  IF r NOT LIKE '%: Nota fiscal ou documento de aquisição; Termo de Recebimento.' THEN
    PERFORM pg_temp.falha('wf rpc: a recusa por pendência devia listar as descrições dos itens nota e termo: ' || coalesce(r, 'nulo'));
  END IF;
  PERFORM pg_temp.wf_confere(pg_temp.exec_como(u_op, 'authenticated', format('SELECT public.wf_marcar_item(%L, ''nota'', true, ''conferida'')', p1)), 'ok', 'marca nota');
  PERFORM pg_temp.wf_confere(pg_temp.exec_como(u_op, 'authenticated', format('SELECT public.wf_marcar_item(%L, ''termo'', true, NULL)', p1)), 'ok', 'marca termo');
  IF to_regclass('public.processo_checklist_respostas') IS NOT NULL THEN
    SELECT count(*) INTO n FROM public.processo_checklist_respostas WHERE processo_id = p1 AND marcado AND marcado_por = u_op AND marcado_em IS NOT NULL;
    IF n <> 2 THEN PERFORM pg_temp.falha('wf rpc: esperava 2 respostas marcadas por quem marcou, há ' || n); END IF;
  END IF;

  -- sem número SEI não sai da etapa 1
  r := pg_temp.sql_como(u_op, 'authenticated', format('SELECT public.wf_avancar_etapa(%L, 1, NULL)', p1));
  PERFORM pg_temp.wf_confere(r, 'erro:22023', 'sai da etapa 1 sem número SEI');
  IF r NOT LIKE '%SEI%' THEN PERFORM pg_temp.falha('wf rpc: a recusa devia falar do número SEI: ' || coalesce(r, 'nulo')); END IF;

  -- número SEI: tramitar, normalizado sem espaços; repetido recusa com o número interno do outro processo
  r := pg_temp.sql_como(u_vis, 'authenticated', format('SELECT public.wf_atualizar_numero_sei(%L, ''0001.000099/2026-11'')', p1));
  PERFORM pg_temp.wf_confere(r, 'erro:42501', 'sem workflow.tramitar altera número SEI');
  PERFORM pg_temp.wf_confere(pg_temp.exec_como(u_op, 'authenticated', format('SELECT public.wf_atualizar_numero_sei(%L, '' 0001.000099/2026-11 '')', p1)), 'ok', 'altera número SEI na etapa 1');
  IF (SELECT numero_sei FROM public.processos_administrativos WHERE id = p1) IS DISTINCT FROM '0001.000099/2026-11' THEN
    PERFORM pg_temp.falha('wf rpc: número SEI não foi gravado normalizado');
  END IF;
  r := pg_temp.sql_como(u_sl, 'authenticated', format(abrir, 'patrimonio_tombamento', 'wf rpc SEI repetido', 'Interessado', 'publico', '0001.000099/2026-11'));
  PERFORM pg_temp.wf_confere(r, 'erro:22023', 'abre processo com número SEI repetido');
  IF r NOT LIKE '%' || coalesce(num, '?') || '%' THEN
    PERFORM pg_temp.falha('wf rpc: recusa de SEI repetido devia citar o processo ' || coalesce(num, '?') || ' (que o usuário vê): ' || coalesce(r, 'nulo'));
  END IF;
  r := pg_temp.sql_como(u_op, 'authenticated', format('SELECT public.wf_atualizar_numero_sei(%L, ''0001.000099/2026-11'')', p2));
  PERFORM pg_temp.wf_confere(r, 'erro:22023', 'outro processo recebe o mesmo número SEI');

  -- etapa esperada diferente: 40001
  r := pg_temp.sql_como(u_op, 'authenticated', format('SELECT public.wf_avancar_etapa(%L, 2, NULL)', p1));
  PERFORM pg_temp.wf_confere(r, 'erro:40001', 'avança com etapa esperada diferente da atual');

  -- avança: etapa 2, NuPat resolvida, prazo em dias úteis, movimentação 1 -> 2
  PERFORM pg_temp.wf_confere(pg_temp.exec_como(u_op, 'authenticated', format('SELECT public.wf_avancar_etapa(%L, 1, ''segue para tombamento'')', p1)), 'ok', 'avança da etapa 1');
  SELECT to_jsonb(p) INTO j FROM public.processos_administrativos p WHERE id = p1;
  esperado := concat_ws('|', '2', 'em_tramitacao', un_nupat, public.fn_somar_dias_uteis(hoje, 5));
  r := concat_ws('|', j->>'etapa_atual_ordem', j->>'status', j->>'unidade_atual_id', j->>'etapa_prazo_limite');
  IF r IS DISTINCT FROM esperado THEN PERFORM pg_temp.falha(format('wf rpc: depois de avançar (etapa|status|unidade|prazo) = %s (esperado %s)', r, esperado)); END IF;
  SELECT to_jsonb(m) INTO j FROM public.movimentacoes_processo m WHERE processo_id = p1 ORDER BY numero_sequencial DESC LIMIT 1;
  esperado := concat_ws('|', '1', 'encaminhamento', '1', '2', un_orig, un_nupat, u_op, 'recebido', 'segue para tombamento');
  r := concat_ws('|', j->>'numero_sequencial', j->>'tipo_movimentacao', j->>'etapa_origem_ordem', j->>'etapa_destino_ordem',
                 j->>'unidade_origem_id', j->>'unidade_destino_id', j->>'created_by', j->>'status', j->>'observacoes');
  IF r IS DISTINCT FROM esperado THEN PERFORM pg_temp.falha(format('wf rpc: movimentação do avanço = %s (esperado %s)', r, esperado)); END IF;
  -- a segunda aba (que ainda via a etapa 1) recebe 40001
  r := pg_temp.sql_como(u_op, 'authenticated', format('SELECT public.wf_avancar_etapa(%L, 1, NULL)', p1));
  PERFORM pg_temp.wf_confere(r, 'erro:40001', 'segunda aba avança o processo que já mudou');
  r := pg_temp.sql_como(u_op, 'authenticated', format('SELECT public.wf_atualizar_numero_sei(%L, ''0001.000100/2026-11'')', p1));
  PERFORM pg_temp.wf_confere(r, 'erro:22023', 'altera número SEI fora da etapa 1');

  -- devolver
  r := pg_temp.sql_como(u_op, 'authenticated', format('SELECT public.wf_devolver_etapa(%L, 2, 1, ''   '')', p1));
  PERFORM pg_temp.wf_confere(r, 'erro:22023', 'devolve sem motivo');
  r := pg_temp.sql_como(u_op, 'authenticated', format('SELECT public.wf_devolver_etapa(%L, 2, 2, ''motivo'')', p1));
  PERFORM pg_temp.wf_confere(r, 'erro:22023', 'devolve para a própria etapa');
  r := pg_temp.sql_como(u_op, 'authenticated', format('SELECT public.wf_devolver_etapa(%L, 2, 3, ''motivo'')', p1));
  PERFORM pg_temp.wf_confere(r, 'erro:22023', 'devolve para etapa posterior');
  r := pg_temp.sql_como(u_op, 'authenticated', format('SELECT public.wf_devolver_etapa(%L, 1, 1, ''motivo'')', p1));
  PERFORM pg_temp.wf_confere(r, 'erro:40001', 'devolve com etapa esperada diferente da atual');
  PERFORM pg_temp.wf_confere(pg_temp.exec_como(u_op, 'authenticated', format('SELECT public.wf_devolver_etapa(%L, 2, 1, ''Faltou a nota'')', p1)), 'ok', 'devolve para a etapa 1');
  SELECT to_jsonb(m) INTO j FROM public.movimentacoes_processo m WHERE processo_id = p1 ORDER BY numero_sequencial DESC LIMIT 1;
  r := concat_ws('|', j->>'numero_sequencial', j->>'tipo_movimentacao', j->>'etapa_origem_ordem', j->>'etapa_destino_ordem', j->>'unidade_destino_id', j->>'observacoes',
                 (SELECT etapa_atual_ordem FROM public.processos_administrativos WHERE id = p1));
  esperado := concat_ws('|', '2', 'devolucao', '2', '1', un_orig, 'Faltou a nota', '1');
  IF r IS DISTINCT FROM esperado THEN PERFORM pg_temp.falha(format('wf rpc: devolução = %s (esperado %s)', r, esperado)); END IF;

  -- até a última etapa: avançar ali recusa e orienta a concluir
  PERFORM pg_temp.wf_confere(pg_temp.exec_como(u_op, 'authenticated', format('SELECT public.wf_avancar_etapa(%L, 1, NULL)', p1)), 'ok', 'avança de novo da etapa 1');
  PERFORM pg_temp.wf_confere(pg_temp.exec_como(u_op, 'authenticated', format('SELECT public.wf_marcar_item(%L, ''plaqueta'', true, NULL)', p1)), 'ok', 'marca plaqueta');
  PERFORM pg_temp.wf_confere(pg_temp.exec_como(u_op, 'authenticated', format('SELECT public.wf_avancar_etapa(%L, 2, NULL)', p1)), 'ok', 'avança para a última etapa');
  r := pg_temp.sql_como(u_op, 'authenticated', format('SELECT public.wf_avancar_etapa(%L, 3, NULL)', p1));
  PERFORM pg_temp.wf_confere(r, 'erro:22023', 'avança além da última etapa');
  IF r NOT LIKE '%conclua%' THEN PERFORM pg_temp.falha('wf rpc: recusa na última etapa devia orientar a concluir: ' || coalesce(r, 'nulo')); END IF;
  IF (SELECT unidade_atual_id FROM public.processos_administrativos WHERE id = p1) IS DISTINCT FROM un_orig THEN
    PERFORM pg_temp.falha('wf rpc: etapa 3 (@ORIGEM) devia voltar à unidade de origem');
  END IF;
  SELECT count(*) INTO n FROM public.movimentacoes_processo WHERE processo_id = p1;
  IF n <> 4 OR (SELECT string_agg(numero_sequencial::text, ',' ORDER BY numero_sequencial) FROM public.movimentacoes_processo WHERE processo_id = p1) IS DISTINCT FROM '1,2,3,4' THEN
    PERFORM pg_temp.falha('wf rpc: movimentações de p1 deviam ser 1,2,3,4 e são ' || coalesce((SELECT string_agg(numero_sequencial::text, ',' ORDER BY numero_sequencial) FROM public.movimentacoes_processo WHERE processo_id = p1), 'nenhuma'));
  END IF;

  -- ===== view
  IF to_regclass('public.v_processos_acompanhamento') IS NULL THEN
    PERFORM pg_temp.falha('wf rpc: view v_processos_acompanhamento não existe');
  ELSE
    r := pg_temp.valor_desfeito_como(u_op, 'authenticated', format(
      'SELECT concat_ws(''|'', numero_formatado, modelo_codigo, etapa_nome, etapa_total, unidade_sigla, unidade_nome, situacao_prazo, pendencias_obrigatorias, numero_sei) FROM public.v_processos_acompanhamento WHERE id = %L', p1));
    esperado := concat_ws('|', num, 'patrimonio_tombamento',
                          (SELECT e.nome FROM public.processo_modelo_etapas e JOIN public.processo_modelos m ON m.id = e.modelo_id WHERE m.codigo = 'patrimonio_tombamento' AND e.ordem = 3),
                          '3', 'WFORIG', 'Setor teste wf', 'em_dia', '1', '0001.000099/2026-11');
    IF r IS DISTINCT FROM esperado THEN PERFORM pg_temp.falha(format('wf view: p1 = %s (esperado %s)', r, esperado)); END IF;
    r := pg_temp.valor_desfeito_como(u_sl, 'authenticated', format(
      'SELECT concat_ws(''|'', unidade_sigla, coalesce(unidade_nome, ''-''), etapa_total, pendencias_obrigatorias) FROM public.v_processos_acompanhamento WHERE id = %L', p2));
    IF r IS DISTINCT FROM '@ORIGEM|-|3|2' THEN PERFORM pg_temp.falha('wf view: processo sem lotação devia mostrar a sigla @ORIGEM e 2 pendências: ' || coalesce(r, 'nulo')); END IF;
    IF NOT has_table_privilege('authenticated', 'public.v_processos_acompanhamento', 'SELECT')
       OR has_table_privilege('authenticated', 'public.v_processos_acompanhamento', 'INSERT')
       OR has_table_privilege('authenticated', 'public.v_processos_acompanhamento', 'UPDATE')
       OR has_table_privilege('authenticated', 'public.v_processos_acompanhamento', 'DELETE') THEN
      PERFORM pg_temp.falha('wf view: authenticated devia ter só SELECT em v_processos_acompanhamento');
    END IF;
  END IF;

  -- ===== concluir e arquivar
  r := pg_temp.sql_como(u_op, 'authenticated', format('SELECT public.wf_concluir(%L, NULL)', p1));
  PERFORM pg_temp.wf_confere(r, 'erro:42501', 'sem workflow.concluir conclui');
  r := pg_temp.wf_erro_completo(u_conc, format('SELECT public.wf_concluir(%L, NULL)', p1));
  PERFORM pg_temp.wf_confere(r, 'erro:22023', 'conclui com item obrigatório pendente');
  IF r NOT LIKE '%: Termo de Responsabilidade assinado.' THEN
    PERFORM pg_temp.falha('wf rpc: recusa de conclusão devia listar a descrição do item responsavel: ' || coalesce(r, 'nulo'));
  END IF;
  r := pg_temp.sql_como(u_conc, 'authenticated', format('SELECT public.wf_concluir(%L, NULL)', p2));
  PERFORM pg_temp.wf_confere(r, 'erro:22023', 'conclui fora da última etapa');
  PERFORM pg_temp.wf_confere(pg_temp.exec_como(u_op, 'authenticated', format('SELECT public.wf_marcar_item(%L, ''responsavel'', true, NULL)', p1)), 'ok', 'marca responsavel');
  PERFORM pg_temp.wf_confere(pg_temp.exec_como(u_conc, 'authenticated', format('SELECT public.wf_concluir(%L, ''Bem tombado'')', p1)), 'ok', 'conclui na última etapa');
  SELECT to_jsonb(p) INTO j FROM public.processos_administrativos p WHERE id = p1;
  IF concat_ws('|', j->>'status', j->>'data_encerramento') IS DISTINCT FROM concat_ws('|', 'concluido', hoje) THEN
    PERFORM pg_temp.falha('wf rpc: conclusão devia gravar status concluido e data de encerramento: ' || coalesce(j->>'status', 'nulo'));
  END IF;
  -- concluído não aceita etapa, checklist, suspensão nem nova conclusão
  FOR x IN SELECT * FROM (VALUES
      (u_op, 'SELECT public.wf_avancar_etapa(%L, 3, NULL)', 'avança processo concluído'),
      (u_op, 'SELECT public.wf_marcar_item(%L, ''nota'', false, NULL)', 'marca item de processo concluído'),
      (u_op, 'SELECT public.wf_devolver_etapa(%L, 3, 1, ''x'')', 'devolve processo concluído'),
      (u_conc, 'SELECT public.wf_suspender(%L, ''x'')', 'suspende processo concluído'),
      (u_conc, 'SELECT public.wf_concluir(%L, NULL)', 'conclui processo concluído')) AS v(quem, tmpl, caso) LOOP
    PERFORM pg_temp.wf_confere(pg_temp.sql_como(x.quem, 'authenticated', format(x.tmpl, p1)), 'erro:22023', x.caso);
  END LOOP;
  r := pg_temp.sql_como(u_conc, 'authenticated', format('SELECT public.wf_arquivar(%L, NULL)', p1));
  PERFORM pg_temp.wf_confere(r, 'erro:42501', 'sem workflow.arquivar arquiva');
  PERFORM pg_temp.wf_confere(pg_temp.exec_como(u_arq, 'authenticated', format('SELECT public.wf_arquivar(%L, ''Fim'')', p1)), 'ok', 'arquiva processo concluído');
  IF (SELECT status::text FROM public.processos_administrativos WHERE id = p1) IS DISTINCT FROM 'arquivado' THEN
    PERFORM pg_temp.falha('wf rpc: arquivamento não gravou o status arquivado');
  END IF;
  PERFORM pg_temp.wf_confere(pg_temp.sql_como(u_arq, 'authenticated', format('SELECT public.wf_arquivar(%L, NULL)', p1)), 'erro:22023', 'arquiva processo já arquivado');
  PERFORM pg_temp.wf_confere(pg_temp.sql_como(u_conc, 'authenticated', format('SELECT public.wf_reativar(%L, ''x'')', p1)), 'erro:22023', 'reativa processo arquivado');

  -- ===== suspender e reativar (p2, etapa 1 com prazo de 5 dias úteis)
  r := pg_temp.sql_como(u_op, 'authenticated', format('SELECT public.wf_suspender(%L, ''x'')', p2));
  PERFORM pg_temp.wf_confere(r, 'erro:42501', 'sem workflow.concluir suspende');
  r := pg_temp.sql_como(u_conc, 'authenticated', format('SELECT public.wf_suspender(%L, '' '')', p2));
  PERFORM pg_temp.wf_confere(r, 'erro:22023', 'suspende sem motivo');
  r := pg_temp.sql_como(u_conc, 'authenticated', format('SELECT public.wf_reativar(%L, ''x'')', p2));
  PERFORM pg_temp.wf_confere(r, 'erro:22023', 'reativa processo que não está suspenso');
  PERFORM pg_temp.wf_confere(pg_temp.exec_como(u_conc, 'authenticated', format('SELECT public.wf_suspender(%L, ''Aguardando documento'')', p2)), 'ok', 'suspende');
  SELECT to_jsonb(p) INTO j FROM public.processos_administrativos p WHERE id = p2;
  IF concat_ws('|', j->>'status', j->>'suspenso_desde') IS DISTINCT FROM concat_ws('|', 'suspenso', hoje) THEN
    PERFORM pg_temp.falha('wf rpc: suspensão devia gravar status suspenso e suspenso_desde = hoje: ' || coalesce(j::text, 'nulo'));
  END IF;
  PERFORM pg_temp.wf_confere(pg_temp.sql_como(u_op, 'authenticated', format('SELECT public.wf_avancar_etapa(%L, 1, NULL)', p2)), 'erro:22023', 'avança processo suspenso');
  PERFORM pg_temp.wf_confere(pg_temp.sql_como(u_op, 'authenticated', format('SELECT public.wf_marcar_item(%L, ''nota'', true, NULL)', p2)), 'erro:22023', 'marca item de processo suspenso');
  PERFORM pg_temp.wf_confere(pg_temp.sql_como(u_op, 'authenticated', format('SELECT public.wf_reativar(%L, ''x'')', p2)), 'erro:42501', 'sem workflow.concluir reativa');
  PERFORM pg_temp.wf_confere(pg_temp.sql_como(u_conc, 'authenticated', format('SELECT public.wf_reativar(%L, '''')', p2)), 'erro:22023', 'reativa sem motivo');
  -- suspenso há 10 dias com 3 dias úteis restantes: reativar dá hoje + 3 dias úteis
  IF j ? 'suspenso_desde' THEN
    EXECUTE 'UPDATE public.processos_administrativos SET suspenso_desde = $1, etapa_prazo_limite = public.fn_somar_dias_uteis($1, 3) WHERE id = $2'
      USING hoje - 10, p2;
  END IF;
  PERFORM pg_temp.wf_confere(pg_temp.exec_como(u_conc, 'authenticated', format('SELECT public.wf_reativar(%L, ''Documento chegou'')', p2)), 'ok', 'reativa');
  SELECT to_jsonb(p) INTO j FROM public.processos_administrativos p WHERE id = p2;
  esperado := concat_ws('|', 'aberto', public.fn_somar_dias_uteis(hoje, 3), 'nulo');
  r := concat_ws('|', j->>'status', j->>'etapa_prazo_limite', coalesce(j->>'suspenso_desde', 'nulo'));
  IF r IS DISTINCT FROM esperado THEN PERFORM pg_temp.falha(format('wf rpc: reativação (status|prazo|suspenso_desde) = %s (esperado %s)', r, esperado)); END IF;
  -- já vencido ao suspender (2 dias corridos de atraso): continua vencido pelos mesmos dias
  PERFORM pg_temp.wf_confere(pg_temp.exec_como(u_conc, 'authenticated', format('SELECT public.wf_suspender(%L, ''De novo'')', p2)), 'ok', 'suspende de novo');
  IF j ? 'suspenso_desde' THEN
    EXECUTE 'UPDATE public.processos_administrativos SET suspenso_desde = $1, etapa_prazo_limite = $1 - 2 WHERE id = $2' USING hoje - 10, p2;
  END IF;
  PERFORM pg_temp.wf_confere(pg_temp.exec_como(u_conc, 'authenticated', format('SELECT public.wf_reativar(%L, ''Voltou'')', p2)), 'ok', 'reativa o vencido');
  IF (SELECT etapa_prazo_limite FROM public.processos_administrativos WHERE id = p2) IS DISTINCT FROM hoje - 2 THEN
    PERFORM pg_temp.falha('wf rpc: reativar processo já vencido devia manter o atraso (hoje - 2)');
  END IF;
  IF to_regclass('public.v_processos_acompanhamento') IS NOT NULL THEN
    r := pg_temp.valor_desfeito_como(u_sl, 'authenticated', format('SELECT situacao_prazo FROM public.v_processos_acompanhamento WHERE id = %L', p2));
    IF r IS DISTINCT FROM 'vencido' THEN PERFORM pg_temp.falha('wf view: processo com prazo vencido há 2 dias devia estar vencido: ' || coalesce(r, 'nulo')); END IF;
  END IF;

  -- ===== etapa de modelo em uso (trigger wf_recusar_etapa_em_uso): p2 está na etapa 1 e p1 (arquivado) na etapa 3 do
  -- patrimonio_tombamento; a etapa 2 não tem processo. workflow.admin (que pode escrever no modelo) recebe 22023.
  -- sql_como sempre desfaz.
  FOR x IN SELECT * FROM (VALUES
      ('DELETE FROM public.processo_modelo_etapas WHERE modelo_id = %L AND ordem = 1', 'erro:22023', 'apaga etapa com processo em andamento'),
      ('DELETE FROM public.processo_modelo_etapas WHERE modelo_id = %L AND ordem = 3', 'erro:22023', 'apaga etapa com processo arquivado'),
      ('UPDATE public.processo_modelo_etapas SET ordem = 9 WHERE modelo_id = %L AND ordem = 1', 'erro:22023', 'renumera etapa com processo'),
      ('UPDATE public.processo_modelo_etapas SET ordem = ordem, nome = nome WHERE modelo_id = %L AND ordem = 1', 'ok:1', 'regrava etapa com processo sem mudar ordem nem modelo'),
      ('UPDATE public.processo_modelo_etapas SET prazo_dias_uteis = 7 WHERE modelo_id = %L AND ordem = 1', 'ok:1', 'muda o prazo de etapa com processo'),
      ('DELETE FROM public.processo_modelo_etapas WHERE modelo_id = %L AND ordem = 2', 'ok:1', 'apaga etapa sem processo')) AS v(tmpl, esperado, caso) LOOP
    r := pg_temp.sql_como(u_wfa, 'authenticated', format(x.tmpl, (SELECT id FROM public.processo_modelos WHERE codigo = 'patrimonio_tombamento')));
    IF r IS NULL OR r NOT LIKE x.esperado || '%' THEN
      PERFORM pg_temp.falha(format('wf etapa em uso: %s (esperado %s, veio %s)', x.caso, x.esperado, coalesce(r, 'nulo')));
    END IF;
  END LOOP;
  IF (SELECT count(*) FROM public.processo_modelo_etapas e JOIN public.processo_modelos m ON m.id = e.modelo_id WHERE m.codigo = 'patrimonio_tombamento') <> 3 THEN
    PERFORM pg_temp.falha('wf etapa em uso: as etapas do patrimonio_tombamento deviam continuar 3 depois dos testes');
  END IF;
  IF to_regprocedure('public.wf_recusar_etapa_em_uso()') IS NULL THEN
    PERFORM pg_temp.falha('wf etapa em uso: função wf_recusar_etapa_em_uso() não existe');
  ELSIF has_function_privilege('authenticated', 'public.wf_recusar_etapa_em_uso()', 'EXECUTE')
        OR has_function_privilege('anon', 'public.wf_recusar_etapa_em_uso()', 'EXECUTE')
        OR NOT (SELECT prosecdef AND proconfig::text ~ 'search_path' FROM pg_proc WHERE oid = 'public.wf_recusar_etapa_em_uso()'::regprocedure) THEN
    PERFORM pg_temp.falha('wf etapa em uso: wf_recusar_etapa_em_uso devia ser DEFINER com search_path fixo e fora da API');
  END IF;

  -- ===== processo antigo, sem modelo: sem etapa nem checklist; conclui e arquiva
  INSERT INTO public.processos_administrativos (assunto, interessado_nome, sigilo, created_by)
    VALUES ('wf rpc processo antigo', 'Interessado teste', 'publico', u_vis) RETURNING id INTO p_old;
  PERFORM pg_temp.wf_confere(pg_temp.sql_como(u_op, 'authenticated', format('SELECT public.wf_avancar_etapa(%L, NULL, NULL)', p_old)), 'erro:22023', 'avança processo sem modelo');
  PERFORM pg_temp.wf_confere(pg_temp.sql_como(u_op, 'authenticated', format('SELECT public.wf_marcar_item(%L, ''nota'', true, NULL)', p_old)), 'erro:22023', 'marca item em processo sem modelo');
  PERFORM pg_temp.wf_confere(pg_temp.exec_como(u_conc, 'authenticated', format('SELECT public.wf_concluir(%L, ''Encerrado'')', p_old)), 'ok', 'conclui processo sem modelo');
  PERFORM pg_temp.wf_confere(pg_temp.exec_como(u_arq, 'authenticated', format('SELECT public.wf_arquivar(%L, NULL)', p_old)), 'ok', 'arquiva processo sem modelo');
  IF (SELECT status::text FROM public.processos_administrativos WHERE id = p_old) IS DISTINCT FROM 'arquivado' THEN
    PERFORM pg_temp.falha('wf rpc: processo sem modelo devia terminar arquivado');
  END IF;

  -- ===== sigilo: quem não vê recebe 42501 com a mesma mensagem de processo inexistente, em todas as RPCs
  r := pg_temp.valor_como(u_op, 'authenticated', format(abrir, 'compras', 'wf rpc sigiloso', 'Interessado', 'sigiloso', NULL));
  p_s := pg_temp.wf_uuid(r);
  IF p_s IS NULL THEN PERFORM pg_temp.falha('wf rpc: não abre processo sigiloso (' || coalesce(r, 'nulo') || ')'); END IF;
  FOREACH q IN ARRAY ARRAY[
      'SELECT public.wf_marcar_item(%L, ''demanda'', true, NULL)',
      'SELECT public.wf_avancar_etapa(%L, 1, NULL)',
      'SELECT public.wf_devolver_etapa(%L, 1, 1, ''x'')',
      'SELECT public.wf_suspender(%L, ''x'')',
      'SELECT public.wf_reativar(%L, ''x'')',
      'SELECT public.wf_concluir(%L, ''x'')',
      'SELECT public.wf_arquivar(%L, ''x'')',
      'SELECT public.wf_atualizar_numero_sei(%L, ''123'')',
      'SELECT public.wf_conceder_acesso(%L, ''a0000000-0000-0000-0000-0000000000ec'', ''total'', ''x'')',
      'SELECT public.wf_revogar_acesso(%L, ''a0000000-0000-0000-0000-0000000000ec'')'] LOOP
    r := pg_temp.sql_como(u_tudo, 'authenticated', format(q, p_s));
    r2 := pg_temp.sql_como(u_tudo, 'authenticated', format(q, fantasma));
    PERFORM pg_temp.wf_confere(r, 'erro:42501', 'sem credencial no sigiloso: ' || split_part(q, '(', 1));
    IF r IS DISTINCT FROM r2 THEN
      PERFORM pg_temp.falha(format('wf rpc: %s distingue sigiloso (%s) de inexistente (%s)', split_part(q, '(', 1), r, r2));
    END IF;
  END LOOP;
  IF to_regclass('public.v_processos_acompanhamento') IS NOT NULL THEN
    FOR x IN SELECT * FROM (VALUES (u_tudo, '0', 'sem credencial'), (u_vis, '0', 'visualizar sem credencial'),
                                   (u_op, '1', 'criador'), (u_wfa, '1', 'workflow.admin')) AS v(quem, esperado, caso) LOOP
      r := pg_temp.valor_desfeito_como(x.quem, 'authenticated', format('SELECT count(*)::text FROM public.v_processos_acompanhamento WHERE id = %L', p_s));
      IF r IS DISTINCT FROM x.esperado THEN PERFORM pg_temp.falha(format('wf view: %s vê %s linha(s) do sigiloso (esperado %s)', x.caso, r, x.esperado)); END IF;
    END LOOP;
  END IF;
  -- o criador altera o próprio sigiloso
  PERFORM pg_temp.wf_confere(pg_temp.sql_como(u_op, 'authenticated', format('SELECT public.wf_marcar_item(%L, ''demanda'', true, NULL)', p_s)), 'ok', 'criador marca item no próprio sigiloso');

  -- ===== credenciais: só workflow.admin; leitura não altera; tramitação altera; revogar tira o acesso
  PERFORM pg_temp.wf_confere(pg_temp.sql_como(u_op, 'authenticated', format('SELECT public.wf_conceder_acesso(%L, %L, ''leitura'', NULL)', p_s, u_ct)), 'erro:42501', 'criador sem workflow.admin concede credencial');
  PERFORM pg_temp.wf_confere(pg_temp.sql_como(u_wfa, 'authenticated', format('SELECT public.wf_conceder_acesso(%L, %L, ''superpoder'', NULL)', p_s, u_ct)), 'erro:22023', 'concede nível inválido');
  PERFORM pg_temp.wf_confere(pg_temp.sql_como(u_wfa, 'authenticated', format('SELECT public.wf_conceder_acesso(%L, %L, ''leitura'', NULL)', p_s, fantasma)), 'erro:22023', 'concede a usuário inexistente');
  -- perfil bloqueado não recebe credencial (mesma mensagem do inexistente)
  UPDATE public.profiles SET is_active = false WHERE id = u_ct;
  r := pg_temp.sql_como(u_wfa, 'authenticated', format('SELECT public.wf_conceder_acesso(%L, %L, ''leitura'', NULL)', p_s, u_ct));
  PERFORM pg_temp.wf_confere(r, 'erro:22023', 'concede a usuário inativo');
  r2 := pg_temp.sql_como(u_wfa, 'authenticated', format('SELECT public.wf_conceder_acesso(%L, %L, ''leitura'', NULL)', p_s, fantasma));
  IF r IS DISTINCT FROM r2 THEN PERFORM pg_temp.falha(format('wf rpc: concessão distingue usuário inativo (%s) de inexistente (%s)', r, r2)); END IF;
  UPDATE public.profiles SET is_active = true WHERE id = u_ct;
  PERFORM pg_temp.wf_confere(pg_temp.exec_como(u_wfa, 'authenticated', format('SELECT public.wf_conceder_acesso(%L, %L, ''leitura'', ''Analisa o caso'')', p_s, u_ct)), 'ok', 'workflow.admin concede leitura');
  IF to_regclass('public.v_processos_acompanhamento') IS NOT NULL
     AND pg_temp.valor_desfeito_como(u_ct, 'authenticated', format('SELECT count(*)::text FROM public.v_processos_acompanhamento WHERE id = %L', p_s)) IS DISTINCT FROM '1' THEN
    PERFORM pg_temp.falha('wf view: credencial de leitura não vê o sigiloso');
  END IF;
  PERFORM pg_temp.wf_confere(pg_temp.sql_como(u_ct, 'authenticated', format('SELECT public.wf_marcar_item(%L, ''justificativa'', true, NULL)', p_s)), 'erro:42501', 'credencial de leitura marca item');
  PERFORM pg_temp.wf_confere(pg_temp.exec_como(u_wfa, 'authenticated', format('SELECT public.wf_conceder_acesso(%L, %L, ''tramitacao'', NULL)', p_s, u_ct)), 'ok', 'workflow.admin troca para tramitação');
  IF (SELECT nivel_acesso || '|' || concedido_por FROM public.acesso_processo_sigiloso WHERE processo_id = p_s AND usuario_id = u_ct) IS DISTINCT FROM 'tramitacao|' || u_wfa THEN
    PERFORM pg_temp.falha('wf rpc: credencial devia ficar tramitacao, concedida por workflow.admin');
  END IF;
  PERFORM pg_temp.wf_confere(pg_temp.sql_como(u_ct, 'authenticated', format('SELECT public.wf_marcar_item(%L, ''justificativa'', true, NULL)', p_s)), 'ok', 'credencial de tramitação marca item');
  -- leitura das credenciais (aba Credenciais): workflow.admin lista, com nomes do perfil; sem admin, 42501; quem não vê
  -- o sigiloso recebe a mesma mensagem de processo inexistente
  UPDATE public.profiles SET full_name = 'Credenciado teste wf' WHERE id = u_ct;
  UPDATE public.profiles SET full_name = 'Admin workflow teste wf' WHERE id = u_wfa;
  r := pg_temp.valor_desfeito_como(u_wfa, 'authenticated', format(
    'SELECT string_agg(concat_ws(''|'', usuario_id, usuario_nome, nivel_acesso, motivo, concedido_por_nome, (created_at IS NOT NULL)::text), '';'') FROM public.wf_listar_credenciais(%L)', p_s));
  -- a troca para tramitação gravou motivo nulo (o upsert substitui o motivo), que concat_ws omite
  esperado := concat_ws('|', u_ct, 'Credenciado teste wf', 'tramitacao', 'Admin workflow teste wf', 'true');
  IF r IS DISTINCT FROM esperado THEN PERFORM pg_temp.falha(format('wf rpc: wf_listar_credenciais por workflow.admin = %s (esperado %s)', r, esperado)); END IF;
  r := pg_temp.valor_desfeito_como(u_admin_papel, 'authenticated', format('SELECT count(*)::text FROM public.wf_listar_credenciais(%L)', p_s));
  IF r IS DISTINCT FROM '1' THEN PERFORM pg_temp.falha('wf rpc: papel admin não lista as credenciais: ' || coalesce(r, 'nulo')); END IF;
  r := pg_temp.sql_como(u_op, 'authenticated', format('SELECT * FROM public.wf_listar_credenciais(%L)', p_s));
  PERFORM pg_temp.wf_confere(r, 'erro:42501', 'criador sem workflow.admin lista credenciais');
  r := pg_temp.sql_como(u_vis, 'authenticated', format('SELECT * FROM public.wf_listar_credenciais(%L)', p1));
  PERFORM pg_temp.wf_confere(r, 'erro:42501', 'visualizar lista credenciais');
  r := pg_temp.sql_como(u_tudo, 'authenticated', format('SELECT * FROM public.wf_listar_credenciais(%L)', p_s));
  r2 := pg_temp.sql_como(u_tudo, 'authenticated', format('SELECT * FROM public.wf_listar_credenciais(%L)', fantasma));
  PERFORM pg_temp.wf_confere(r, 'erro:42501', 'sem acesso ao sigiloso lista credenciais');
  IF r IS DISTINCT FROM r2 THEN PERFORM pg_temp.falha(format('wf rpc: wf_listar_credenciais distingue sigiloso (%s) de inexistente (%s)', r, r2)); END IF;
  -- usuários ativos para a credencial: só workflow.admin; id e nome de todo perfil ativo (o mesmo "ativo" da concessão),
  -- por nome; inativo fica de fora
  r := pg_temp.sql_como(u_vis, 'authenticated', 'SELECT * FROM public.wf_listar_usuarios_ativos()');
  PERFORM pg_temp.wf_confere(r, 'erro:42501', 'sem workflow.admin lista usuários ativos');
  r := pg_temp.sql_como(u_op, 'authenticated', 'SELECT * FROM public.wf_listar_usuarios_ativos()');
  PERFORM pg_temp.wf_confere(r, 'erro:42501', 'criar/tramitar sem workflow.admin lista usuários ativos');
  UPDATE public.profiles SET is_active = false WHERE id = u_arq;
  esperado := (SELECT string_agg(pr.id || ':' || coalesce(pr.full_name, ''), ';' ORDER BY pr.full_name NULLS LAST, pr.id)
                 FROM public.profiles pr WHERE pr.is_active IS TRUE);
  r := pg_temp.valor_desfeito_como(u_wfa, 'authenticated',
    'SELECT string_agg(id || '':'' || coalesce(full_name, ''''), '';'' ORDER BY ord) FROM public.wf_listar_usuarios_ativos() WITH ORDINALITY AS l(id, full_name, ord)');
  IF r IS DISTINCT FROM esperado THEN
    PERFORM pg_temp.falha(format('wf rpc: wf_listar_usuarios_ativos por workflow.admin difere dos perfis ativos por nome (veio %s)', left(coalesce(r, 'nulo'), 200)));
  END IF;
  IF r NOT LIKE '%' || u_ct || ':Credenciado teste wf%' OR r LIKE '%' || u_arq || '%' THEN
    PERFORM pg_temp.falha('wf rpc: wf_listar_usuarios_ativos devia trazer o credenciado ativo e não o perfil inativo');
  END IF;
  UPDATE public.profiles SET is_active = true WHERE id = u_arq;
  IF (SELECT array_to_string(proargnames, ',') FROM pg_proc WHERE oid = to_regprocedure('public.wf_listar_usuarios_ativos()')) IS DISTINCT FROM 'id,full_name' THEN
    PERFORM pg_temp.falha('wf rpc: wf_listar_usuarios_ativos devia devolver só id e full_name');
  END IF;
  PERFORM pg_temp.wf_confere(pg_temp.exec_como(u_wfa, 'authenticated', format('SELECT public.wf_revogar_acesso(%L, %L)', p_s, u_ct)), 'ok', 'workflow.admin revoga');
  PERFORM pg_temp.wf_confere(pg_temp.sql_como(u_ct, 'authenticated', format('SELECT public.wf_marcar_item(%L, ''justificativa'', true, NULL)', p_s)), 'erro:42501', 'credencial revogada marca item');
  IF EXISTS (SELECT 1 FROM public.acesso_processo_sigiloso WHERE processo_id = p_s AND usuario_id = u_ct) THEN
    PERFORM pg_temp.falha('wf rpc: revogar não apagou a credencial');
  END IF;

  -- ===== semáforo
  IF to_regprocedure('public.fn_situacao_prazo(date)') IS NULL THEN
    PERFORM pg_temp.falha('wf rpc: fn_situacao_prazo(date) não existe');
  ELSE
    FOR x IN SELECT * FROM (VALUES (NULL::date, 'sem_prazo'), (hoje - 1, 'vencido'), (public.fn_somar_dias_uteis(hoje, 1), 'vence_logo'),
                                   (public.fn_somar_dias_uteis(hoje, 2), 'vence_logo'), (public.fn_somar_dias_uteis(hoje, 3), 'em_dia'),
                                   (public.fn_somar_dias_uteis(hoje, 5), 'em_dia')) AS v(limite, esperado) LOOP
      r := pg_temp.valor_desfeito_como(u_vis, 'authenticated', format('SELECT public.fn_situacao_prazo(%L::date)', x.limite));
      IF r IS DISTINCT FROM x.esperado THEN
        PERFORM pg_temp.falha(format('wf rpc: fn_situacao_prazo(%s) = %s (esperado %s)', coalesce(x.limite::text, 'nulo'), r, x.esperado));
      END IF;
    END LOOP;
    IF (SELECT provolatile FROM pg_proc WHERE oid = 'public.fn_situacao_prazo(date)'::regprocedure) <> 's' THEN
      PERFORM pg_temp.falha('wf rpc: fn_situacao_prazo devia ser STABLE');
    END IF;
  END IF;

  -- ===== estrutura: RPCs DEFINER com search_path fixo, travam o processo, só authenticated; internas fora da API
  FOREACH q IN ARRAY ARRAY[
      'public.wf_abrir_processo(text, text, text, text, text, text, public.nivel_sigilo_processo, text)',
      'public.wf_marcar_item(uuid, text, boolean, text)', 'public.wf_avancar_etapa(uuid, integer, text)',
      'public.wf_devolver_etapa(uuid, integer, integer, text)', 'public.wf_suspender(uuid, text)', 'public.wf_reativar(uuid, text)',
      'public.wf_concluir(uuid, text)', 'public.wf_arquivar(uuid, text)', 'public.wf_atualizar_numero_sei(uuid, text)',
      'public.wf_conceder_acesso(uuid, uuid, text, text)', 'public.wf_revogar_acesso(uuid, uuid)', 'public.wf_listar_credenciais(uuid)',
      'public.wf_listar_usuarios_ativos()', 'public.fn_situacao_prazo(date)'] LOOP
    IF to_regprocedure(q) IS NULL THEN
      PERFORM pg_temp.falha('wf rpc: ' || q || ' não existe');
      CONTINUE;
    END IF;
    IF has_function_privilege('anon', q, 'EXECUTE') OR NOT has_function_privilege('authenticated', q, 'EXECUTE') THEN
      PERFORM pg_temp.falha('wf rpc: ' || q || ' devia ser executável só por authenticated');
    END IF;
    IF NOT coalesce((SELECT proconfig::text ~ 'search_path' FROM pg_proc WHERE oid = to_regprocedure(q)), false) THEN
      PERFORM pg_temp.falha('wf rpc: ' || q || ' sem search_path fixo');
    END IF;
    IF q LIKE 'public.wf_%' THEN
      IF NOT (SELECT prosecdef FROM pg_proc WHERE oid = to_regprocedure(q)) THEN
        PERFORM pg_temp.falha('wf rpc: ' || q || ' devia ser SECURITY DEFINER');
      END IF;
      -- a listagem de credenciais só lê: sem trava, mas com o sigilo antes de tudo e STABLE
      IF q LIKE 'public.wf_listar_credenciais%' THEN
        IF (SELECT prosrc !~ 'wf_pode_ver_processo' OR provolatile <> 's' FROM pg_proc WHERE oid = to_regprocedure(q)) THEN
          PERFORM pg_temp.falha('wf rpc: ' || q || ' devia ser STABLE e checar wf_pode_ver_processo');
        END IF;
      -- a lista de usuários ativos só lê e não recebe processo: STABLE, exige workflow.admin
      ELSIF q LIKE 'public.wf_listar_usuarios_ativos%' THEN
        IF (SELECT prosrc !~ 'workflow\.admin' OR provolatile <> 's' FROM pg_proc WHERE oid = to_regprocedure(q)) THEN
          PERFORM pg_temp.falha('wf rpc: ' || q || ' devia ser STABLE e exigir workflow.admin');
        END IF;
      ELSIF q NOT LIKE 'public.wf_abrir_processo%' AND (SELECT prosrc FROM pg_proc WHERE oid = to_regprocedure(q)) !~ 'wf_travar_processo' THEN
        PERFORM pg_temp.falha('wf rpc: ' || q || ' não trava o processo por wf_travar_processo');
      END IF;
    END IF;
  END LOOP;
  IF to_regprocedure('public.wf_travar_processo(uuid, boolean)') IS NOT NULL
     AND (SELECT prosrc FROM pg_proc WHERE oid = to_regprocedure('public.wf_travar_processo(uuid, boolean)')) !~* 'FOR UPDATE' THEN
    PERFORM pg_temp.falha('wf rpc: wf_travar_processo não faz SELECT ... FOR UPDATE');
  END IF;
  FOREACH q IN ARRAY ARRAY['public.wf_resolver_unidade(text, uuid)', 'public.wf_travar_processo(uuid, boolean)',
      'public.wf_exigir_em_andamento(public.status_processo_administrativo)', 'public.wf_pendencias(uuid, uuid, integer, integer)',
      'public.wf_preparar_numero_sei(text, uuid)',
      'public.wf_registrar_movimentacao(uuid, public.tipo_movimentacao_processo, text, text, uuid, uuid, integer, integer, integer, date)'] LOOP
    IF to_regprocedure(q) IS NULL THEN
      PERFORM pg_temp.falha('wf rpc: função interna ' || q || ' não existe');
    ELSIF has_function_privilege('authenticated', q, 'EXECUTE') OR has_function_privilege('anon', q, 'EXECUTE') THEN
      PERFORM pg_temp.falha('wf rpc: função interna ' || q || ' executável pela API');
    ELSIF (SELECT prosecdef FROM pg_proc WHERE oid = to_regprocedure(q)) THEN
      PERFORM pg_temp.falha('wf rpc: função interna ' || q || ' não devia ser SECURITY DEFINER');
    END IF;
  END LOOP;

  PERFORM pg_temp.nota('Workflow (RPCs e view): abertura com lotação e sem lotação, checklist por etapa, avanço com pendência/sem SEI/etapa mudada (40001), devolução, última etapa, conclusão e arquivamento (com e sem modelo), suspensão e reativação com recálculo do prazo, sigilo igual a inexistente em todas as RPCs, credenciais de leitura e tramitação, semáforo e colunas da view verificados');
END $$;

-- ---------------------------------------------------------------- Gabinete: importação de portarias (TRIGGERS LIGADOS)
-- Migração 20261015120000_gab_importar_portarias.sql (spec docs/superpowers/specs/2026-10-15-importacao-portarias-planilha-design.md):
--   * importar_portarias_planilha: sem o módulo gabinete ou sem gabinete.portarias.importar recusa (42501); anon e PUBLIC
--     sem EXECUTE; authenticated executa;
--   * simulação não grava (documentos e importacoes iguais antes e depois) e avisa: servidor inativo, pendência
--     PENDENTE/AAAA da mesma categoria com o servidor, observações preenchidas;
--   * aplicação insere (número normalizado, título padrão, data_publicacao = DOE, servidores por matrícula) e registra
--     em importacoes sem matrícula nos detalhes; a segunda aplicação do mesmo arquivo dá sem_alteracao;
--   * portaria gravada fora do padrão (7/2025) casa com 007/2025: só preenche o vazio e SOMA servidor (nunca remove),
--     não muda a situação (aviso "avance na tela da portaria");
--   * tudo ou nada: matrícula inexistente, número repetido no arquivo, PENDENTE e erro de trigger (regra de setor em
--     modo exigir, login sem servidor) viram erro da linha e nada é gravado;
--   * LGPD: sem o módulo rh o aviso de inativo não diz a situação (exonerado) e as mudanças de servidores não mostram a
--     matrícula de quem já estava vinculado e não veio na planilha ("N servidor(es) já vinculados"); com rh, mostram;
--   * matrícula repetida no cadastro (sem a UNIQUE, desfeito no fim) é erro "ambígua", não pega um servidor qualquer;
--   * status_informado = false (situação preenchida por padrão no front) não gera o aviso de situação divergente.
-- Banco anterior à migração: o bloco reprova sem abortar.
CREATE FUNCTION pg_temp.pi_chamar(p_uid uuid, p_linhas jsonb, p_simular boolean) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE r text;
BEGIN
  r := pg_temp.valor_como(p_uid, 'authenticated', format(
    'SELECT public.importar_portarias_planilha(%L::jsonb, %L::jsonb, %L)::text', p_linhas,
    jsonb_build_object('nome', 'portarias.xlsx', 'sha256', repeat('ab', 32), 'tamanho', 2048), p_simular));
  IF r IS NULL OR left(r, 1) <> '{' THEN
    RETURN jsonb_build_object('falhou', coalesce(r, 'nulo'));
  END IF;
  RETURN r::jsonb;
END $$;
-- linha do contrato com os campos vazios preenchidos com null
CREATE FUNCTION pg_temp.pi_linha(p jsonb) RETURNS jsonb LANGUAGE sql AS $$
  SELECT jsonb_build_object('indice', 0, 'numero', NULL, 'data_documento', to_char(current_date - 30, 'YYYY-MM-DD'),
    'categoria', 'normativa', 'ementa', NULL, 'processo_sei', NULL, 'status', NULL, 'assinado_por', NULL,
    'data_assinatura', NULL, 'doe_numero', NULL, 'doe_data', NULL, 'data_vigencia_inicio', NULL,
    'data_vigencia_fim', NULL, 'matriculas', '[]'::jsonb, 'observacoes', NULL) || p
$$;

DO $$
DECLARE
  u_imp uuid := 'a0000000-0000-0000-0000-0000000006a1';   -- módulo gabinete + gabinete.portarias.importar
  u_gab uuid := 'a0000000-0000-0000-0000-0000000006a2';   -- módulo gabinete sem a permissão
  u_rhp uuid := 'a0000000-0000-0000-0000-0000000006a3';   -- a permissão no módulo rh, sem o módulo gabinete
  u_imr uuid := 'a0000000-0000-0000-0000-0000000006a4';   -- como u_imp e também com o módulo rh
  s1 uuid := 'b2000000-0000-0000-0000-0000000000f1';      -- PI-001, ativo
  s2 uuid := 'b2000000-0000-0000-0000-0000000000f2';      -- PI-002, ativo, com pendência PENDENTE de nomeação
  s3 uuid := 'b2000000-0000-0000-0000-0000000000f3';      -- PI-003, exonerado
  leg uuid := 'b2000000-0000-0000-0000-0000000000f9';     -- portaria antiga gravada como 7/2025
  fn text := 'public.importar_portarias_planilha(jsonb, jsonb, boolean)';
  d_doc text := to_char(current_date - 30, 'YYYY-MM-DD');
  d_doe text := to_char(current_date - 28, 'YYYY-MM-DD');
  modo_rh text;
  linhas jsonb; j jsonb; n_doc int; n_imp int; n int; r text; x record;
BEGIN
  IF to_regprocedure(fn) IS NULL THEN
    PERFORM pg_temp.falha('gabinete importação: ' || fn || ' não existe');
    RETURN;
  END IF;
  SET LOCAL session_replication_role = origin;
  INSERT INTO auth.users (id, email) VALUES (u_imp, 'pi_imp@teste.invalid'), (u_gab, 'pi_gab@teste.invalid'), (u_rhp, 'pi_rhp@teste.invalid'),
    (u_imr, 'pi_imr@teste.invalid');
  UPDATE public.profiles SET is_active = true WHERE id IN (u_imp, u_gab, u_rhp, u_imr);
  INSERT INTO public.user_modules (user_id, module, permissions) VALUES
    (u_imp, 'gabinete', '{gabinete.portarias.visualizar,gabinete.portarias.importar}'),
    (u_imr, 'gabinete', '{gabinete.portarias.visualizar,gabinete.portarias.importar}'),
    (u_imr, 'rh', '{rh.servidores.visualizar}'),
    (u_gab, 'gabinete', '{gabinete.portarias.visualizar,gabinete.portarias.criar,gabinete.portarias.editar}'),
    (u_rhp, 'rh', '{gabinete.portarias.importar}');
  -- regra de setor num estado conhecido (registrar não bloqueia); restaurada no fim
  SELECT modo INTO modo_rh FROM public.regra_lancamento WHERE modulo = 'rh';
  PERFORM pg_temp.ls_sistema();
  UPDATE public.regra_lancamento SET modo = 'registrar' WHERE modulo = 'rh';
  -- servidores, pendência e portaria antiga (modo réplica: sem os triggers de setor/autoria/portaria)
  SET LOCAL session_replication_role = replica;
  INSERT INTO public.servidores (id, nome_completo, cpf, matricula, situacao, ativo) VALUES
    (s1, 'PI Servidor 1', '000.000.6f1-01', 'PI-001', 'ativo', true),
    (s2, 'PI Servidor 2', '000.000.6f2-02', 'PI-002', 'ativo', true),
    (s3, 'PI Servidor 3', '000.000.6f3-03', 'PI-003', 'exonerado', false);
  INSERT INTO public.documentos (id, tipo, numero, titulo, categoria, status, data_documento, servidores_ids) VALUES
    (gen_random_uuid(), 'portaria', 'PENDENTE/2026', 'Pendência PI', 'nomeacao', 'minuta', current_date - 40, ARRAY[s2]),
    (leg, 'portaria', '7/2025', 'Portaria nº 7/2025', 'nomeacao', 'aguardando_assinatura', current_date - 300, ARRAY[s1]);
  SET LOCAL session_replication_role = origin;

  -- ===== quem chama
  IF has_function_privilege('anon', fn, 'EXECUTE') THEN PERFORM pg_temp.falha('gabinete importação: anon executa ' || fn); END IF;
  IF EXISTS (SELECT 1 FROM pg_proc p, aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
              WHERE p.oid = to_regprocedure(fn) AND a.grantee = 0 AND a.privilege_type = 'EXECUTE') THEN
    PERFORM pg_temp.falha('gabinete importação: PUBLIC executa ' || fn);
  END IF;
  IF NOT has_function_privilege('authenticated', fn, 'EXECUTE') THEN PERFORM pg_temp.falha('gabinete importação: authenticated não executa ' || fn); END IF;
  linhas := jsonb_build_array(pg_temp.pi_linha(jsonb_build_object('numero', '901/2026')));
  r := pg_temp.sql_como(u_gab, 'authenticated', format('SELECT public.importar_portarias_planilha(%L::jsonb, NULL, true)', linhas));
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('gabinete importação: módulo gabinete sem gabinete.portarias.importar não recusa (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_rhp, 'authenticated', format('SELECT public.importar_portarias_planilha(%L::jsonb, NULL, true)', linhas));
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('gabinete importação: a permissão sem o módulo gabinete não recusa (' || r || ')'); END IF;
  r := pg_temp.sql_como(NULL, 'authenticated', format('SELECT public.importar_portarias_planilha(%L::jsonb, NULL, true)', linhas));
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('gabinete importação: sessão sem usuário não recusa (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_imp, 'authenticated', 'SELECT public.importar_portarias_planilha(''[]''::jsonb, NULL, true)');
  IF r NOT LIKE 'erro:22023%' THEN PERFORM pg_temp.falha('gabinete importação: lista vazia aceita (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_imp, 'authenticated', format('SELECT public.importar_portarias_planilha(%L::jsonb, ''{"nome": "x"}''::jsonb, false)', linhas));
  IF r NOT LIKE 'erro:22023%' THEN PERFORM pg_temp.falha('gabinete importação: aplicação com dados do arquivo inválidos aceita (' || r || ')'); END IF;

  -- ===== simulação: nada gravado
  linhas := jsonb_build_array(
    pg_temp.pi_linha(jsonb_build_object('indice', 0, 'numero', '901/2026', 'categoria', 'nomeacao', 'status', 'publicado',
      'data_documento', d_doc, 'doe_numero', 'PI-DOE-1', 'doe_data', d_doe, 'matriculas', '["PI-001"]'::jsonb)),
    pg_temp.pi_linha(jsonb_build_object('indice', 1, 'numero', '2/2026', 'observacoes', 'conferir no SEI')),
    pg_temp.pi_linha(jsonb_build_object('indice', 2, 'numero', '903/2026', 'categoria', 'nomeacao', 'ementa', 'Nomeia servidores',
      'matriculas', '["PI-002", "PI-003"]'::jsonb)));
  SELECT count(*) INTO n_doc FROM public.documentos WHERE tipo = 'portaria';
  SELECT count(*) INTO n_imp FROM public.importacoes;
  j := pg_temp.pi_chamar(u_imp, linhas, true);
  IF j ? 'falhou' OR j ->> 'simulacao' <> 'true' OR j -> 'totais' <> '{"inserir": 3, "atualizar": 0, "sem_alteracao": 0}'::jsonb
     OR jsonb_array_length(j -> 'erros') <> 0 OR j ->> 'importacao_id' IS NOT NULL THEN
    PERFORM pg_temp.falha('gabinete importação: simulação com 3 inserções devolveu ' || left(j::text, 300));
  END IF;
  IF (SELECT count(*) FROM public.documentos WHERE tipo = 'portaria') <> n_doc OR (SELECT count(*) FROM public.importacoes) <> n_imp
     OR EXISTS (SELECT 1 FROM public.documentos WHERE numero IN ('901/2026', '002/2026', '903/2026')) THEN
    PERFORM pg_temp.falha('gabinete importação: a simulação gravou');
  END IF;
  r := (SELECT x2 -> 'avisos' FROM jsonb_array_elements(j -> 'linhas') x2 WHERE (x2 ->> 'indice')::int = 2)::text;
  IF coalesce(r, '') !~ 'Servidor da matrícula PI-003 não está ativo' OR r !~ 'pendência PENDENTE/2026' OR r ~ 'PI-001' THEN
    PERFORM pg_temp.falha('gabinete importação: avisos de inativo/pendência ausentes na linha 2: ' || coalesce(r, 'nada'));
  END IF;
  IF j::text ~* 'exonerad' THEN
    PERFORM pg_temp.falha('gabinete importação: usuário sem o módulo rh recebeu a situação funcional do servidor: ' || coalesce(r, 'nada'));
  END IF;
  -- com o módulo rh, o aviso diz a situação
  j := pg_temp.pi_chamar(u_imr, linhas, true);
  r := (SELECT x2 -> 'avisos' FROM jsonb_array_elements(j -> 'linhas') x2 WHERE (x2 ->> 'indice')::int = 2)::text;
  IF coalesce(r, '') !~ 'PI-003: servidor não está ativo \(situação: exonerado\)' THEN
    PERFORM pg_temp.falha('gabinete importação: com o módulo rh o aviso de inativo não traz a situação: ' || left(coalesce(j::text, 'nada'), 300));
  END IF;
  j := pg_temp.pi_chamar(u_imp, linhas, true);
  r := (SELECT x2 -> 'avisos' FROM jsonb_array_elements(j -> 'linhas') x2 WHERE (x2 ->> 'indice')::int = 1)::text;
  IF coalesce(r, '') !~ 'não coloque CPF' THEN PERFORM pg_temp.falha('gabinete importação: aviso das observações ausente: ' || coalesce(r, 'nada')); END IF;
  IF j::text ~ '\d{3}\.\d{3}\.' OR j::text ~ 'b2000000-' THEN PERFORM pg_temp.falha('gabinete importação: o retorno traz CPF ou UUID de servidor'); END IF;

  -- ===== aplicação: insere e registra
  j := pg_temp.pi_chamar(u_imp, linhas, false);
  IF j ? 'falhou' OR j ->> 'simulacao' <> 'false' OR j -> 'totais' <> '{"inserir": 3, "atualizar": 0, "sem_alteracao": 0}'::jsonb
     OR jsonb_array_length(j -> 'erros') <> 0 OR j ->> 'importacao_id' IS NULL THEN
    PERFORM pg_temp.falha('gabinete importação: aplicação com 3 inserções devolveu ' || left(j::text, 300));
  END IF;
  IF (SELECT count(*) FROM public.documentos WHERE tipo = 'portaria') <> n_doc + 3 THEN
    PERFORM pg_temp.falha('gabinete importação: a aplicação não inseriu as 3 portarias');
  END IF;
  SELECT * INTO x FROM public.documentos WHERE numero = '901/2026';
  IF x.titulo IS DISTINCT FROM 'Portaria nº 901/2026' OR x.status::text <> 'publicado' OR x.categoria::text <> 'nomeacao'
     OR x.data_publicacao IS DISTINCT FROM d_doe::date OR x.doe_numero IS DISTINCT FROM 'PI-DOE-1' OR x.servidores_ids IS DISTINCT FROM ARRAY[s1]
     OR x.created_by IS DISTINCT FROM u_imp THEN
    PERFORM pg_temp.falha('gabinete importação: portaria 901/2026 gravada errada (' || row_to_json(x)::text || ')');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.documentos WHERE numero = '002/2026' AND status::text = 'aguardando_assinatura' AND observacoes = 'conferir no SEI') THEN
    PERFORM pg_temp.falha('gabinete importação: 2/2026 não foi gravada como 002/2026 aguardando assinatura');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.documentos WHERE numero = '903/2026' AND titulo = 'Nomeia servidores' AND servidores_ids = ARRAY[s2, s3]) THEN
    PERFORM pg_temp.falha('gabinete importação: 903/2026 sem título da ementa ou sem os servidores');
  END IF;
  SELECT * INTO x FROM public.importacoes WHERE id = (j ->> 'importacao_id')::uuid;
  IF x.tipo IS DISTINCT FROM 'portarias_planilha' OR x.modulo::text IS DISTINCT FROM 'gabinete' OR x.created_by IS DISTINCT FROM u_imp
     OR x.resumo -> 'totais' ->> 'inserir' IS DISTINCT FROM '3' OR jsonb_array_length(x.detalhes) <> 3 THEN
    PERFORM pg_temp.falha('gabinete importação: log em importacoes errado (' || coalesce(row_to_json(x)::text, 'sem linha') || ')');
  END IF;
  IF x.detalhes::text ~ 'PI-00' OR x.detalhes::text ~ 'b2000000-' OR x.detalhes::text ~ 'Nomeia' THEN
    PERFORM pg_temp.falha('gabinete importação: detalhes do log com matrícula, servidor ou texto da portaria: ' || left(x.detalhes::text, 200));
  END IF;
  SELECT count(*) INTO n_imp FROM public.importacoes;

  -- ===== segunda aplicação do mesmo arquivo: nada muda
  j := pg_temp.pi_chamar(u_imp, linhas, false);
  IF j ? 'falhou' OR j -> 'totais' <> '{"inserir": 0, "atualizar": 0, "sem_alteracao": 3}'::jsonb OR jsonb_array_length(j -> 'erros') <> 0 THEN
    PERFORM pg_temp.falha('gabinete importação: segunda aplicação devia dar 3 sem_alteracao e deu ' || left(j::text, 300));
  END IF;
  IF (SELECT count(*) FROM public.documentos WHERE tipo = 'portaria') <> n_doc + 3 THEN
    PERFORM pg_temp.falha('gabinete importação: a segunda aplicação inseriu de novo');
  END IF;
  SELECT count(*) INTO n_imp FROM public.importacoes;

  -- ===== atualização: 007/2025 casa com 7/2025; preenche o vazio, soma servidor, não muda a situação
  linhas := jsonb_build_array(pg_temp.pi_linha(jsonb_build_object('numero', '007/2025', 'categoria', 'nomeacao',
    'data_documento', to_char(current_date - 300, 'YYYY-MM-DD'), 'status', 'publicado', 'doe_numero', 'PI-DOE-7',
    'doe_data', to_char(current_date - 290, 'YYYY-MM-DD'), 'processo_sei', 'PI-SEI-0007', 'matriculas', '["PI-002"]'::jsonb)));
  -- com o módulo rh (simulação), a matrícula de quem já estava vinculado aparece
  j := pg_temp.pi_chamar(u_imr, linhas, true);
  IF j -> 'linhas' -> 0 -> 'mudancas' -> 'servidores_ids' IS DISTINCT FROM '[["PI-001"], ["PI-001", "PI-002"]]'::jsonb THEN
    PERFORM pg_temp.falha('gabinete importação: com o módulo rh as mudanças de servidores não trazem as matrículas: ' || left(j::text, 400));
  END IF;
  -- situação preenchida por padrão no front (status_informado = false): sem aviso de situação divergente
  j := pg_temp.pi_chamar(u_imp, jsonb_build_array(linhas -> 0 || '{"status_informado": false}'::jsonb), true);
  IF j ? 'falhou' OR (j -> 'linhas' -> 0 -> 'avisos')::text ~ 'Situação no sistema' THEN
    PERFORM pg_temp.falha('gabinete importação: status_informado = false ainda avisa da situação divergente: ' || left(j::text, 400));
  END IF;
  j := pg_temp.pi_chamar(u_imp, linhas, false);
  IF j ? 'falhou' OR j -> 'totais' <> '{"inserir": 0, "atualizar": 1, "sem_alteracao": 0}'::jsonb OR jsonb_array_length(j -> 'erros') <> 0
     OR j -> 'linhas' -> 0 -> 'mudancas' -> 'processo_sei' <> '[null, "PI-SEI-0007"]'::jsonb
     OR j -> 'linhas' -> 0 -> 'mudancas' -> 'servidores_ids' <> '[["1 servidor(es) já vinculados"], ["1 servidor(es) já vinculados", "PI-002"]]'::jsonb
     OR j::text ~ 'PI-001'
     OR (j -> 'linhas' -> 0 -> 'avisos')::text !~ 'avance na tela da portaria' THEN
    PERFORM pg_temp.falha('gabinete importação: atualização da 7/2025 devolveu ' || left(j::text, 400));
  END IF;
  SELECT * INTO x FROM public.documentos WHERE id = leg;
  IF x.numero <> '7/2025' OR x.servidores_ids IS DISTINCT FROM ARRAY[s1, s2] OR x.processo_sei IS DISTINCT FROM 'PI-SEI-0007'
     OR x.status::text <> 'aguardando_assinatura' OR x.doe_numero IS NOT NULL OR x.categoria::text <> 'nomeacao' THEN
    PERFORM pg_temp.falha('gabinete importação: 7/2025 atualizada errada (' || row_to_json(x)::text || ')');
  END IF;
  IF EXISTS (SELECT 1 FROM public.documentos WHERE numero = '007/2025') THEN
    PERFORM pg_temp.falha('gabinete importação: 007/2025 duplicou a portaria gravada como 7/2025');
  END IF;
  -- a planilha só com PI-002 não remove PI-001
  j := pg_temp.pi_chamar(u_imp, linhas, false);
  IF j -> 'totais' ->> 'sem_alteracao' IS DISTINCT FROM '1'
     OR (SELECT servidores_ids FROM public.documentos WHERE id = leg) IS DISTINCT FROM ARRAY[s1, s2] THEN
    PERFORM pg_temp.falha('gabinete importação: reaplicar a 7/2025 só com PI-002 mudou os servidores: ' || left(j::text, 300));
  END IF;
  SELECT count(*) INTO n_imp FROM public.importacoes;

  -- ===== tudo ou nada: matrícula inexistente
  linhas := jsonb_build_array(
    pg_temp.pi_linha(jsonb_build_object('indice', 0, 'numero', '904/2026')),
    pg_temp.pi_linha(jsonb_build_object('indice', 1, 'numero', '905/2026', 'categoria', 'nomeacao', 'matriculas', '["PI-NAO-EXISTE"]'::jsonb)));
  j := pg_temp.pi_chamar(u_imp, linhas, false);
  IF j ? 'falhou' OR j ->> 'importacao_id' IS NOT NULL
     OR NOT EXISTS (SELECT 1 FROM jsonb_array_elements(j -> 'erros') e WHERE (e ->> 'indice')::int = 1 AND e ->> 'mensagem' ~ 'PI-NAO-EXISTE não encontrada') THEN
    PERFORM pg_temp.falha('gabinete importação: matrícula inexistente não virou erro da linha: ' || left(j::text, 300));
  END IF;
  IF EXISTS (SELECT 1 FROM public.documentos WHERE numero IN ('904/2026', '905/2026')) OR (SELECT count(*) FROM public.importacoes) <> n_imp THEN
    PERFORM pg_temp.falha('gabinete importação: com erro numa linha a aplicação gravou as outras (tudo ou nada)');
  END IF;

  -- ===== matrícula repetida no cadastro: erro "ambígua" (sem a UNIQUE só dentro deste bloco, desfeito no fim)
  BEGIN
    ALTER TABLE public.servidores DROP CONSTRAINT servidores_matricula_key;
    SET LOCAL session_replication_role = replica;
    INSERT INTO public.servidores (id, nome_completo, cpf, matricula, situacao, ativo) VALUES
      ('b2000000-0000-0000-0000-0000000000f4', 'PI Servidor 4', '000.000.6f4-04', 'PI-001', 'ativo', true);
    SET LOCAL session_replication_role = origin;
    j := pg_temp.pi_chamar(u_imp, jsonb_build_array(pg_temp.pi_linha(jsonb_build_object('numero', '908/2026',
      'categoria', 'nomeacao', 'matriculas', '["PI-001"]'::jsonb))), true);
    RAISE EXCEPTION USING ERRCODE = 'P0098', MESSAGE = 'desfazer';
  EXCEPTION WHEN SQLSTATE 'P0098' THEN NULL;
  END;
  SET LOCAL session_replication_role = origin;
  IF j ? 'falhou' OR NOT EXISTS (SELECT 1 FROM jsonb_array_elements(j -> 'erros') e WHERE e ->> 'mensagem' ~ 'PI-001 ambígua no cadastro')
     OR jsonb_array_length(j -> 'linhas') <> 0 THEN
    PERFORM pg_temp.falha('gabinete importação: matrícula repetida no cadastro não virou erro "ambígua": ' || left(j::text, 300));
  END IF;
  IF to_regclass('public.servidores') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'servidores_matricula_key') THEN
    PERFORM pg_temp.falha('gabinete importação: o teste de matrícula ambígua não restaurou a UNIQUE de servidores.matricula');
  END IF;

  -- ===== número repetido no arquivo e PENDENTE
  linhas := jsonb_build_array(
    pg_temp.pi_linha(jsonb_build_object('indice', 0, 'numero', '906/2026')),
    pg_temp.pi_linha(jsonb_build_object('indice', 1, 'numero', '6/2026')),
    pg_temp.pi_linha(jsonb_build_object('indice', 2, 'numero', '906/2026')),
    pg_temp.pi_linha(jsonb_build_object('indice', 3, 'numero', 'PENDENTE/2026')));
  j := pg_temp.pi_chamar(u_imp, linhas, false);
  IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(j -> 'erros') e WHERE (e ->> 'indice')::int = 2 AND e ->> 'mensagem' ~ 'repetida') THEN
    PERFORM pg_temp.falha('gabinete importação: número repetido no arquivo não virou erro: ' || left(j::text, 300));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(j -> 'erros') e WHERE (e ->> 'indice')::int = 3 AND e ->> 'mensagem' ~ 'pendência') THEN
    PERFORM pg_temp.falha('gabinete importação: PENDENTE não foi recusado: ' || left(j::text, 300));
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(j -> 'erros') e WHERE (e ->> 'indice')::int IN (0, 1)) THEN
    PERFORM pg_temp.falha('gabinete importação: 906/2026 e 6/2026 (006/2026) são números distintos e deram erro: ' || left(j::text, 300));
  END IF;
  IF EXISTS (SELECT 1 FROM public.documentos WHERE numero IN ('906/2026', '006/2026')) OR (SELECT count(*) FROM public.importacoes) <> n_imp THEN
    PERFORM pg_temp.falha('gabinete importação: arquivo com número repetido/PENDENTE gravou');
  END IF;

  -- ===== erro de trigger vira erro da linha: regra de setor em modo exigir e login sem servidor vinculado
  PERFORM pg_temp.ls_sistema();   -- o modo exigir só entra sem usuário na sessão (como migração)
  UPDATE public.regra_lancamento SET modo = 'exigir' WHERE modulo = 'rh';
  linhas := jsonb_build_array(pg_temp.pi_linha(jsonb_build_object('numero', '907/2026')));
  j := pg_temp.pi_chamar(u_imp, linhas, true);
  IF j ? 'falhou' OR NOT EXISTS (SELECT 1 FROM jsonb_array_elements(j -> 'erros') e WHERE e ->> 'mensagem' ~ 'lançamento no setor') THEN
    PERFORM pg_temp.falha('gabinete importação: a regra de setor (zz_exigir_setor) não virou erro da linha na simulação: ' || left(j::text, 300));
  END IF;
  j := pg_temp.pi_chamar(u_imp, linhas, false);
  IF j ->> 'importacao_id' IS NOT NULL OR EXISTS (SELECT 1 FROM public.documentos WHERE numero = '907/2026') THEN
    PERFORM pg_temp.falha('gabinete importação: com a regra de setor recusando, a aplicação gravou: ' || left(j::text, 300));
  END IF;
  PERFORM pg_temp.ls_sistema();
  UPDATE public.regra_lancamento SET modo = modo_rh WHERE modulo = 'rh';

  PERFORM pg_temp.nota('Gabinete (importação de portarias): permissão, simulação sem gravar, aplicação e log, reaplicação sem alteração, casamento do número antigo, soma de servidor, tudo ou nada (matrícula, repetido, PENDENTE, regra de setor), situação do servidor e matrículas antigas só com rh, matrícula ambígua e status_informado verificados');
END $$;

-- ---------------------------------------------------------------- Financeiro: tabelas do FIPLAN (classificadores)
-- Migração 20261019100000_fin_classificadores_fiplan.sql (spec docs/superpowers/specs/2026-10-19-classificadores-fiplan-design.md):
--   * fin_classificadores_fiplan: lê quem tem o módulo financeiro; ninguém grava pela API (nem com orcamento.importar);
--   * importar_classificadores_fiplan: sem o módulo financeiro, sem orcamento.importar ou sem sessão recusa (42501);
--     anon e PUBLIC sem EXECUTE; tabela desconhecida e lista vazia = 22023;
--   * simulação não grava; aplicação insere, registra em importacoes e corrige o nome da fonte (mesmos dígitos), do
--     programa do exercício e da natureza provisória do QDD; reaplicar dá sem_alteracao; código repetido ou fora do
--     padrão vira erro e a aplicação não grava nada.
-- Banco anterior à migração: o bloco reprova sem abortar.
DO $$
DECLARE
  u_fin uuid := 'a0000000-0000-0000-0000-0000000007c1';   -- módulo financeiro + orcamento.importar
  u_lei uuid := 'a0000000-0000-0000-0000-0000000007c2';   -- módulo financeiro sem a permissão
  u_rhp uuid := 'a0000000-0000-0000-0000-0000000007c3';   -- a permissão no módulo rh, sem o financeiro
  fn text := 'public.importar_classificadores_fiplan(text, integer, jsonb, jsonb, boolean)';
  arq text := jsonb_build_object('nome', 'fonte.xls', 'sha256', repeat('cd', 32), 'tamanho', 1024)::text;
  linhas jsonb; r text; j jsonb; n_imp int; x record;
BEGIN
  IF to_regprocedure(fn) IS NULL OR to_regclass('public.fin_classificadores_fiplan') IS NULL THEN
    PERFORM pg_temp.falha('FIN classificadores: ' || fn || ' ou a tabela não existe');
    RETURN;
  END IF;
  SET LOCAL session_replication_role = origin;
  INSERT INTO auth.users (id, email) VALUES (u_fin, 'cf_fin@teste.invalid'), (u_lei, 'cf_lei@teste.invalid'), (u_rhp, 'cf_rhp@teste.invalid');
  UPDATE public.profiles SET is_active = true WHERE id IN (u_fin, u_lei, u_rhp);
  INSERT INTO public.user_modules (user_id, module, permissions) VALUES
    (u_fin, 'financeiro', '{orcamento.importar}'),
    (u_lei, 'financeiro', '{}'),
    (u_rhp, 'rh', '{orcamento.importar}');
  INSERT INTO public.fin_fontes_recurso (codigo, nome) VALUES ('9.977', 'Fonte 9.977 (importada do QDD, revisar descrição)');
  INSERT INTO public.fin_programas_orcamentarios (codigo, nome, exercicio) VALUES ('977', 'Programa 977', 2031);
  INSERT INTO public.fin_naturezas_despesa (codigo, nome) VALUES ('3.3.90.97', 'Natureza 3.3.90.97 (importada do QDD, revisar descrição)');

  -- ===== quem chama
  IF has_function_privilege('anon', fn, 'EXECUTE') THEN PERFORM pg_temp.falha('FIN classificadores: anon executa ' || fn); END IF;
  IF EXISTS (SELECT 1 FROM pg_proc p, aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
              WHERE p.oid = to_regprocedure(fn) AND a.grantee = 0 AND a.privilege_type = 'EXECUTE') THEN
    PERFORM pg_temp.falha('FIN classificadores: PUBLIC executa ' || fn);
  END IF;
  linhas := '[{"codigo": "9.977", "nome": "Fonte de teste", "nome_resumido": "FT", "ativo": true, "atributos": {"vinculada": "Não"}}]';
  FOR x IN SELECT * FROM (VALUES (u_lei, 'sem orcamento.importar'), (u_rhp, 'sem o módulo financeiro'), (NULL::uuid, 'sem sessão')) v(quem, rot) LOOP
    r := pg_temp.sql_como(x.quem, 'authenticated', format('SELECT public.importar_classificadores_fiplan(''fonte'', 2031, %L::jsonb, NULL, true)', linhas));
    IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('FIN classificadores: ' || x.rot || ' não recusa (' || r || ')'); END IF;
  END LOOP;
  r := pg_temp.sql_como(u_fin, 'authenticated', format('SELECT public.importar_classificadores_fiplan(''rubrica'', 2031, %L::jsonb, NULL, true)', linhas));
  IF r NOT LIKE 'erro:22023%' THEN PERFORM pg_temp.falha('FIN classificadores: tabela desconhecida aceita (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_fin, 'authenticated', 'SELECT public.importar_classificadores_fiplan(''fonte'', 2031, ''[]''::jsonb, NULL, true)');
  IF r NOT LIKE 'erro:22023%' THEN PERFORM pg_temp.falha('FIN classificadores: lista vazia aceita (' || r || ')'); END IF;

  -- ===== simulação não grava
  SELECT count(*) INTO n_imp FROM public.importacoes;
  r := pg_temp.valor_como(u_fin, 'authenticated', format('SELECT public.importar_classificadores_fiplan(''fonte'', 2031, %L::jsonb, %L::jsonb, true)::text', linhas, arq));
  IF left(coalesce(r, ''), 1) <> '{' OR (r::jsonb -> 'totais' ->> 'inserir')::int <> 1 OR r::jsonb ->> 'importacao_id' IS NOT NULL
     OR r::jsonb -> 'linhas' -> 0 -> 'avisos' ->> 0 !~ 'nome da fonte 9.977' THEN
    PERFORM pg_temp.falha('FIN classificadores: simulação devolveu ' || left(coalesce(r, 'nulo'), 200));
  END IF;
  IF EXISTS (SELECT 1 FROM public.fin_classificadores_fiplan WHERE exercicio = 2031) OR (SELECT count(*) FROM public.importacoes) <> n_imp
     OR (SELECT nome FROM public.fin_fontes_recurso WHERE codigo = '9.977') <> 'Fonte 9.977 (importada do QDD, revisar descrição)' THEN
    PERFORM pg_temp.falha('FIN classificadores: a simulação gravou');
  END IF;

  -- ===== aplicação: grava, registra e corrige os nomes; reaplicar dá sem_alteracao
  r := pg_temp.exec_como(u_fin, 'authenticated', format('SELECT public.importar_classificadores_fiplan(''fonte'', 2031, %L::jsonb, %L::jsonb, false)', linhas, arq));
  r := pg_temp.exec_como(u_fin, 'authenticated', format('SELECT public.importar_classificadores_fiplan(''programa'', 2031, %L::jsonb, %L::jsonb, false)',
         '[{"codigo": "977", "nome": "Programa de teste", "ativo": true, "atributos": {}}]', arq));
  r := pg_temp.exec_como(u_fin, 'authenticated', format('SELECT public.importar_classificadores_fiplan(''elemento'', 2031, %L::jsonb, %L::jsonb, false)',
         '[{"codigo": "97", "nome": "ELEMENTO DE TESTE", "ativo": true, "atributos": {}}]', arq));
  IF (SELECT count(*) FROM public.fin_classificadores_fiplan WHERE exercicio = 2031) <> 3
     OR (SELECT count(*) FROM public.importacoes WHERE tipo = 'classificadores_fiplan') <> 3 THEN
    PERFORM pg_temp.falha('FIN classificadores: a aplicação não gravou as 3 tabelas e o log (' || coalesce(r, 'nulo') || ')');
  END IF;
  IF (SELECT nome FROM public.fin_fontes_recurso WHERE codigo = '9.977') <> 'Fonte de teste'
     OR (SELECT nome FROM public.fin_programas_orcamentarios WHERE codigo = '977' AND exercicio = 2031) <> 'Programa de teste'
     OR (SELECT nome FROM public.fin_naturezas_despesa WHERE codigo = '3.3.90.97') <> 'ELEMENTO DE TESTE' THEN
    PERFORM pg_temp.falha('FIN classificadores: nomes de fonte, programa ou natureza não corrigidos');
  END IF;
  r := pg_temp.valor_como(u_fin, 'authenticated', format('SELECT public.importar_classificadores_fiplan(''fonte'', 2031, %L::jsonb, %L::jsonb, true)::text', linhas, arq));
  IF left(coalesce(r, ''), 1) <> '{' OR (r::jsonb -> 'totais' ->> 'sem_alteracao')::int <> 1 THEN
    PERFORM pg_temp.falha('FIN classificadores: reimportar não deu sem_alteracao (' || left(coalesce(r, 'nulo'), 200) || ')');
  END IF;

  -- ===== classificador igual, natureza provisória criada depois (QDD novo): reimportar conta como atualização
  INSERT INTO public.fin_naturezas_despesa (codigo, nome) VALUES ('3.3.91.97', 'Natureza 3.3.91.97 (importada do QDD, revisar descrição)');
  r := pg_temp.valor_como(u_fin, 'authenticated', format('SELECT public.importar_classificadores_fiplan(''elemento'', 2031, %L::jsonb, %L::jsonb, true)::text',
         '[{"codigo": "97", "nome": "ELEMENTO DE TESTE", "ativo": true, "atributos": {}}]', arq));
  IF left(coalesce(r, ''), 1) <> '{' OR (r::jsonb -> 'totais' ->> 'atualizar')::int <> 1 THEN
    PERFORM pg_temp.falha('FIN classificadores: natureza provisória nova não liberou a reimportação (' || left(coalesce(r, 'nulo'), 200) || ')');
  END IF;
  -- fonte de um exercício anterior ao mais recente importado não mexe no nome do cadastro
  r := pg_temp.exec_como(u_fin, 'authenticated', format('SELECT public.importar_classificadores_fiplan(''fonte'', 2030, %L::jsonb, %L::jsonb, false)',
         '[{"codigo": "9.977", "nome": "Nome antigo", "ativo": false, "atributos": {}}]', arq));
  IF r <> 'ok' OR (SELECT nome FROM public.fin_fontes_recurso WHERE codigo = '9.977') <> 'Fonte de teste'
     OR NOT (SELECT ativo FROM public.fin_fontes_recurso WHERE codigo = '9.977') THEN
    PERFORM pg_temp.falha('FIN classificadores: fonte de exercício antigo mudou o cadastro (' || coalesce(r, 'nulo') || ')');
  END IF;
  -- atributos pela API direta: dado pessoal e valor que não é texto ficam de fora
  r := pg_temp.exec_como(u_fin, 'authenticated', format('SELECT public.importar_classificadores_fiplan(''funcao'', 2031, %L::jsonb, %L::jsonb, false)',
         '[{"codigo": "97", "nome": "Função de teste", "ativo": true, "atributos": {"cpf_do_responsavel": "000.000.000-00", "x": {"y": 1}, "abrangencia": "Setorial"}}]', arq));
  IF r <> 'ok' OR (SELECT atributos FROM public.fin_classificadores_fiplan WHERE tipo = 'funcao' AND exercicio = 2031 AND codigo = '97')
       IS DISTINCT FROM '{"abrangencia": "Setorial"}'::jsonb THEN
    PERFORM pg_temp.falha('FIN classificadores: atributos com dado pessoal ou não texto gravados (' || coalesce(r, 'nulo') || ')');
  END IF;

  -- ===== erro de linha: nada gravado
  SELECT count(*) INTO n_imp FROM public.importacoes;
  linhas := '[{"codigo": "9.978", "nome": "Nova", "ativo": true, "atributos": {}}, {"codigo": "9978", "nome": "Sem ponto", "ativo": true, "atributos": {}},
              {"codigo": "9.978", "nome": "Repetida", "ativo": true, "atributos": {}}]';
  r := pg_temp.valor_como(u_fin, 'authenticated', format('SELECT public.importar_classificadores_fiplan(''fonte'', 2031, %L::jsonb, %L::jsonb, true)::text', linhas, arq));
  IF left(coalesce(r, ''), 1) <> '{' OR jsonb_array_length(r::jsonb -> 'erros') <> 2 THEN
    PERFORM pg_temp.falha('FIN classificadores: código fora do padrão e repetido não viraram erro (' || left(coalesce(r, 'nulo'), 200) || ')');
  END IF;
  r := pg_temp.exec_como(u_fin, 'authenticated', format('SELECT public.importar_classificadores_fiplan(''fonte'', 2031, %L::jsonb, %L::jsonb, false)', linhas, arq));
  IF r NOT LIKE 'erro:22023%' OR EXISTS (SELECT 1 FROM public.fin_classificadores_fiplan WHERE codigo = '9.978')
     OR (SELECT count(*) FROM public.importacoes) <> n_imp THEN
    PERFORM pg_temp.falha('FIN classificadores: aplicação com erro gravou (' || coalesce(r, 'nulo') || ')');
  END IF;

  -- ===== leitura e escrita direta na tabela
  r := pg_temp.valor_como(u_lei, 'authenticated', 'SELECT count(*)::text FROM public.fin_classificadores_fiplan WHERE exercicio = 2031');
  IF r IS DISTINCT FROM '4' THEN PERFORM pg_temp.falha('FIN classificadores: quem tem o módulo financeiro não lê (' || coalesce(r, 'nulo') || ')'); END IF;
  r := pg_temp.valor_como(u_rhp, 'authenticated', 'SELECT count(*)::text FROM public.fin_classificadores_fiplan');
  IF r IS DISTINCT FROM '0' THEN PERFORM pg_temp.falha('FIN classificadores: sem o módulo financeiro lê (' || coalesce(r, 'nulo') || ')'); END IF;
  r := pg_temp.sql_como(u_fin, 'authenticated', 'INSERT INTO public.fin_classificadores_fiplan (tipo, exercicio, codigo, nome) VALUES (''funcao'', 2031, ''99'', ''x'')');
  IF r NOT LIKE 'erro:%' THEN PERFORM pg_temp.falha('FIN classificadores: INSERT direto pela API aceito (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_fin, 'authenticated', 'UPDATE public.fin_classificadores_fiplan SET nome = ''x'' WHERE exercicio = 2031');
  IF r NOT LIKE 'erro:%' AND r <> 'ok:0' THEN PERFORM pg_temp.falha('FIN classificadores: UPDATE direto pela API aceito (' || r || ')'); END IF;

  PERFORM pg_temp.nota('FIN (tabelas do FIPLAN): permissão, simulação sem gravar, aplicação e log, correção de nomes (fonte, programa, natureza; natureza provisória nova; fonte de exercício antigo não mexe), filtro de atributos, reaplicação sem alteração, tudo ou nada e escrita direta bloqueada verificados');
END $$;

-- ---------------------------------------------------------------- FOLHA: cálculo do INSS e do IRRF (migração 20261019200000)
-- Vetores conferidos contra o hrms_brasil (Lei 9.250/1995, Lei 15.270/2025) e contra o espelho do SIGRH de 09/2026.
DO $$
DECLARE
  r jsonb; cg uuid := 'f1000000-0000-0000-0000-0000000000c1'; s_rpps uuid := 'f1000000-0000-0000-0000-0000000000a1';
  s_pens uuid := 'f1000000-0000-0000-0000-0000000000a2'; s_ext uuid := 'f1000000-0000-0000-0000-0000000000a3';
  p_rpps uuid := 'f1000000-0000-0000-0000-0000000000b1'; p_pens uuid := 'f1000000-0000-0000-0000-0000000000b2';
  p_ext uuid := 'f1000000-0000-0000-0000-0000000000b3';
  tab jsonb := '{"inss": true, "irrf": true, "ded_dep": 189.59}';
  x record; v text;
BEGIN
  SET LOCAL session_replication_role = replica;   -- semeadura sem os triggers de setor/autoria
  DELETE FROM public.tabela_inss; DELETE FROM public.tabela_irrf;
  DELETE FROM public.parametros_folha WHERE tipo_parametro IN ('teto_inss', 'desconto_simplificado_irrf', 'irrf_reducao_limite_isencao',
    'irrf_reducao_maxima', 'irrf_reducao_limite', 'irrf_reducao_constante', 'irrf_reducao_coeficiente');
  INSERT INTO public.tabela_inss (vigencia_inicio, faixa_ordem, valor_minimo, valor_maximo, aliquota) VALUES
    ('2026-01-01', 1, 0, 1621.00, 0.075), ('2026-01-01', 2, 1621.00, 2902.84, 0.09),
    ('2026-01-01', 3, 2902.84, 4354.27, 0.12), ('2026-01-01', 4, 4354.27, 8475.55, 0.14);
  INSERT INTO public.tabela_irrf (vigencia_inicio, faixa_ordem, valor_minimo, valor_maximo, aliquota, parcela_deduzir) VALUES
    ('2026-01-01', 1, 0, 2428.80, 0, 0), ('2026-01-01', 2, 2428.80, 2826.65, 0.075, 182.16),
    ('2026-01-01', 3, 2826.65, 3751.05, 0.15, 394.16), ('2026-01-01', 4, 3751.05, 4664.68, 0.225, 675.49),
    ('2026-01-01', 5, 4664.68, NULL, 0.275, 908.73);
  SET LOCAL session_replication_role = origin;

  -- ===== sem os parâmetros de 2026: só a tabela, e a falta é informada
  r := public.calcular_irrf_mensal(2871.43, 234.11, '2026-09-30');
  IF (r ->> 'irrf')::numeric <> 15.64 OR (r ->> 'reducao_configurada')::boolean OR (r ->> 'simplificado_configurado')::boolean THEN
    PERFORM pg_temp.falha('FOLHA IRRF: sem parâmetros deveria cobrar só pela tabela e avisar (' || r::text || ')');
  END IF;

  SET LOCAL session_replication_role = replica;
  INSERT INTO public.parametros_folha (tipo_parametro, valor, vigencia_inicio, ativo) VALUES
    ('teto_inss', 8475.55, '2026-01-01', true), ('desconto_simplificado_irrf', 607.20, '2026-01-01', true),
    ('irrf_reducao_limite_isencao', 5000.00, '2026-01-01', true), ('irrf_reducao_maxima', 312.89, '2026-01-01', true),
    ('irrf_reducao_limite', 7350.00, '2026-01-01', true), ('irrf_reducao_constante', 978.62, '2026-01-01', true),
    ('irrf_reducao_coeficiente', 0.133145, '2026-01-01', true);
  SET LOCAL session_replication_role = origin;

  -- ===== INSS progressivo e IRRF mensal: rendimentos, deduções legais → IRRF
  IF public.calcular_inss_servidor(24829, '2026-09-30') <> 988.09 THEN
    PERFORM pg_temp.falha('FOLHA INSS: teto de 2026 deveria dar 988,09 (' || public.calcular_inss_servidor(24829, '2026-09-30') || ')');
  END IF;
  FOR x IN SELECT * FROM (VALUES
      (24829.00, 988.09, 5647.52, false),   -- subsídio com INSS: INSS sai da base
      (5742.80, 0, 289.57, true),           -- sem INSS: desconto simplificado + redução
      (5742.80, 605.51, 289.57, true),      -- simplificado vence o INSS
      (7159.13, 803.79, 813.57, false),     -- redução parcial
      (4594.25, 444.71, 0.00, true),        -- até R$ 5.000: isento
      (2871.43, 234.11, 0.00, true)) AS t(rend, ded, esperado, simpl) LOOP
    r := public.calcular_irrf_mensal(x.rend, x.ded, '2026-09-30');
    IF (r ->> 'irrf')::numeric <> x.esperado OR (r ->> 'simplificado')::boolean <> x.simpl THEN
      PERFORM pg_temp.falha(format('FOLHA IRRF: rendimentos %s e deduções %s deveriam dar %s (%s)', x.rend, x.ded, x.esperado, r));
    END IF;
  END LOOP;

  -- ===== ficha mensal: opção pelo regime próprio, pensão sobre o líquido e vínculo externo sem opção
  SET LOCAL session_replication_role = replica;
  INSERT INTO public.cargos (id, nome, sigla, categoria, natureza, vencimento_base, quantidade_vagas)
    VALUES (cg, 'Cargo Folha Teste', 'CNETS-T', 'comissionado', 'comissionado', 9571.34, 3);
  INSERT INTO public.servidores (id, nome_completo, cpf, situacao, ativo, possui_vinculo_externo, contribui_rpps_origem,
                                 rpps_origem_fundamento, rpps_origem_inicio) VALUES
    (s_rpps, 'Folha RPPS Teste', '000.000.f11-01', 'ativo', true, true, true, 'Instrução normativa de teste', '2026-01-01'),
    (s_pens, 'Folha Pensão Teste', '000.000.f12-02', 'ativo', true, false, false, NULL, NULL),
    (s_ext, 'Folha Externo Teste', '000.000.f13-03', 'ativo', true, true, false, NULL, NULL);
  INSERT INTO public.provimentos (id, servidor_id, cargo_id, data_nomeacao, status) VALUES
    (p_rpps, s_rpps, cg, '2026-01-01', 'ativo'), (p_pens, s_pens, cg, '2026-01-01', 'ativo'), (p_ext, s_ext, cg, '2026-01-01', 'ativo');
  INSERT INTO public.pensoes_alimenticias (servidor_id, beneficiario_nome, tipo_calculo, percentual, base_calculo, data_inicio, ativo)
    VALUES (s_pens, 'Beneficiária Teste', 'percentual', 30, 'liquido', '2026-01-01', true);
  SET LOCAL session_replication_role = origin;

  r := public.folha_montar_ficha(s_rpps, p_rpps, 'mensal', '2026-09-01', '2026-09-30', '[]', tab);
  IF (r ->> 'valor_inss')::numeric <> 0 OR (r ->> 'valor_irrf')::numeric <> 1556.41 OR r -> 'inconsistencias' ? 'regime_previdenciario_a_confirmar' THEN
    PERFORM pg_temp.falha('FOLHA ficha: regime próprio de origem deveria zerar o INSS e usar o desconto simplificado no IRRF (' || r::text || ')');
  END IF;
  r := public.folha_montar_ficha(s_pens, p_pens, 'mensal', '2026-09-01', '2026-09-30', '[]', tab);
  SELECT i ->> 'valor' INTO v FROM jsonb_array_elements(r -> 'itens') i WHERE i ->> 'descricao' LIKE 'Pensão alimentícia%';
  IF (r ->> 'valor_inss')::numeric <> 988.09 OR (r ->> 'valor_irrf')::numeric <> 810.40 OR v IS DISTINCT FROM '2331.86'
     OR (r ->> 'valor_liquido')::numeric <> 5440.99 THEN
    PERFORM pg_temp.falha('FOLHA ficha: pensão de 30% do líquido deveria sair da base do IRRF (pensão ' || coalesce(v, 'nula') || ', ' || r::text || ')');
  END IF;
  r := public.folha_montar_ficha(s_ext, p_ext, 'mensal', '2026-09-01', '2026-09-30', '[]', tab);
  IF (r ->> 'valor_inss')::numeric <> 988.09 OR NOT (r -> 'inconsistencias' ? 'regime_previdenciario_a_confirmar') THEN
    PERFORM pg_temp.falha('FOLHA ficha: vínculo efetivo externo sem a opção deveria descontar INSS e marcar a ficha (' || r::text || ')');
  END IF;

  -- ===== opção sem fundamento é recusada; alíquota em % é recusada
  BEGIN
    UPDATE public.servidores SET rpps_origem_fundamento = NULL WHERE id = s_rpps;
    PERFORM pg_temp.falha('FOLHA servidores: opção pelo regime próprio sem fundamento aceita');
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    SET LOCAL session_replication_role = replica;
    INSERT INTO public.tabela_inss (vigencia_inicio, faixa_ordem, valor_minimo, valor_maximo, aliquota) VALUES ('2040-01-01', 1, 0, 1, 7.5);
    PERFORM pg_temp.falha('FOLHA tabela_inss: alíquota 7,5 (em %) aceita');
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  SET LOCAL session_replication_role = origin;
  IF has_function_privilege('authenticated', 'public.calcular_irrf_mensal(numeric, numeric, date)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.calcular_irrf_mensal(numeric, numeric, date)', 'EXECUTE') THEN
    PERFORM pg_temp.falha('FOLHA calcular_irrf_mensal: executável pela API');
  END IF;

  PERFORM pg_temp.nota('FOLHA (cálculo): INSS 2026, IRRF com desconto simplificado e redução da Lei 15.270, pensão dedutível sobre o líquido, opção pelo regime próprio de origem com fundamento, vínculo externo sem opção marcado e alíquota em fração verificados');
END $$;

-- ---------------------------------------------------------------- FOLHA: atos remuneratórios (migração 20261020100000)
DO $$
DECLARE
  u_rh uuid := (SELECT uid FROM persona WHERE nome='mod_rh');
  u_cfg uuid := (SELECT uid FROM persona WHERE nome='perm_financeiro.folha.configurar');
  cg uuid := 'f2000000-0000-0000-0000-0000000000c1'; sv uuid := 'f2000000-0000-0000-0000-0000000000a1';
  pv uuid := 'f2000000-0000-0000-0000-0000000000b1'; at uuid := 'f2000000-0000-0000-0000-0000000000d1';
  at2 uuid := 'f2000000-0000-0000-0000-0000000000d2';
  tab jsonb := '{"inss": true, "irrf": true, "ded_dep": 189.59}';
  r text; j jsonb; n int; v numeric;
BEGIN
  SET LOCAL session_replication_role = replica;   -- semeadura sem os triggers de setor/autoria
  INSERT INTO public.cargos (id, nome, sigla, categoria, natureza, vencimento_base, quantidade_vagas)
    VALUES (cg, 'Cargo Reajuste Teste', 'CDS-RT', 'comissionado', 'comissionado', 1000.00, 1);
  INSERT INTO public.servidores (id, nome_completo, cpf, situacao, ativo) VALUES (sv, 'Folha Reajuste Teste', '000.000.f21-01', 'ativo', true);
  INSERT INTO public.provimentos (id, servidor_id, cargo_id, data_nomeacao, status) VALUES (pv, sv, cg, '2026-01-01', 'ativo');
  DELETE FROM public.parametros_folha WHERE tipo_parametro = 'teste_reajuste';
  INSERT INTO public.parametros_folha (tipo_parametro, valor, vigencia_inicio, ativo) VALUES ('teste_reajuste', 10, '2026-01-01', true);
  INSERT INTO public.atos_remuneratorios (id, tipo_ato, numero, data_ato, vigencia_inicio, ementa, percentual)
    VALUES (at, 'lei', '9.999/2026', '2026-09-10', '2026-09-15', 'Reajuste de teste', 6.5);
  INSERT INTO public.atos_remuneratorios_itens (ato_id, alvo, cargo_id, valor_novo) VALUES (at, 'cargo', cg, 1065);
  INSERT INTO public.atos_remuneratorios_itens (ato_id, alvo, tipo_parametro, valor_novo) VALUES (at, 'parametro', 'teste_reajuste', 12);
  SET LOCAL session_replication_role = origin;

  -- ===== quem não configura a folha não cria nem aplica
  r := pg_temp.sql_como(u_rh, 'authenticated', format(
    'INSERT INTO public.atos_remuneratorios (tipo_ato, numero, data_ato, vigencia_inicio, ementa) VALUES (%L, %L, %L, %L, %L)',
    'decreto', '1/2026', '2026-10-01', '2026-10-01', 'teste'));
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('ATOS: o módulo rh sem financeiro.folha.configurar cria ato (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_rh, 'authenticated', format('SELECT public.aplicar_ato_remuneratorio(%L)', at));
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('ATOS: o módulo rh sem financeiro.folha.configurar aplica ato (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_cfg, 'authenticated', format(
    'INSERT INTO public.atos_remuneratorios (tipo_ato, numero, data_ato, vigencia_inicio, ementa, status, aplicado_em) VALUES (%L, %L, %L, %L, %L, %L, now())',
    'decreto', '1/2026', '2026-10-01', '2026-10-01', 'teste', 'aplicado'));
  IF r NOT LIKE 'erro:RHE02:%' THEN PERFORM pg_temp.falha('ATOS: ato nasce aplicado sem a RPC (' || r || ')'); END IF;

  -- ===== aplicar (persistente, como quem configura a folha)
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_cfg, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  j := public.aplicar_ato_remuneratorio(at);
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '', true);
  IF (j ->> 'cargos')::int <> 1 OR (j ->> 'parametros')::int <> 1 THEN
    PERFORM pg_temp.falha('ATOS: aplicar deveria contar 1 cargo e 1 parâmetro (' || j::text || ')');
  END IF;
  IF public.vencimento_cargo_em(cg, '2026-09-14') <> 1000 OR public.vencimento_cargo_em(cg, '2026-09-15') <> 1065 THEN
    PERFORM pg_temp.falha(format('ATOS: vencimento pela vigência (antes %s, depois %s)',
      public.vencimento_cargo_em(cg, '2026-09-14'), public.vencimento_cargo_em(cg, '2026-09-15')));
  END IF;
  IF (SELECT vencimento_base FROM public.cargos WHERE id = cg) <> 1065 THEN
    PERFORM pg_temp.falha('ATOS: cargos.vencimento_base deveria mostrar o valor vigente hoje');
  END IF;
  IF (SELECT valor_anterior FROM public.atos_remuneratorios_itens WHERE ato_id = at AND alvo = 'cargo') <> 1000
     OR (SELECT valor_anterior FROM public.atos_remuneratorios_itens WHERE ato_id = at AND alvo = 'parametro') <> 10 THEN
    PERFORM pg_temp.falha('ATOS: valor anterior dos itens não gravado');
  END IF;
  IF public.get_parametro_vigente('teste_reajuste'::varchar, '2026-09-14') <> 10 OR public.get_parametro_vigente('teste_reajuste'::varchar, '2026-09-15') <> 12
     OR (SELECT vigencia_fim FROM public.parametros_folha WHERE tipo_parametro = 'teste_reajuste' AND valor = 10) <> '2026-09-14' THEN
    PERFORM pg_temp.falha('ATOS: parâmetro deveria fechar a vigência anterior na véspera e abrir a nova');
  END IF;
  IF (SELECT status FROM public.atos_remuneratorios WHERE id = at) <> 'aplicado'
     OR (SELECT aplicado_por FROM public.atos_remuneratorios WHERE id = at) IS DISTINCT FROM u_cfg THEN
    PERFORM pg_temp.falha('ATOS: ato aplicado sem status ou sem quem aplicou');
  END IF;

  -- ===== a folha lê a vigência e marca reajuste no meio do mês
  j := public.folha_montar_ficha(sv, pv, 'mensal', '2026-08-01', '2026-08-31', '[]', tab);
  IF (j ->> 'vencimento_base')::numeric <> 1000 OR j -> 'inconsistencias' ? 'vencimento_alterado_na_competencia' THEN
    PERFORM pg_temp.falha('ATOS: folha de agosto deveria sair com o valor antigo (' || j::text || ')');
  END IF;
  j := public.folha_montar_ficha(sv, pv, 'mensal', '2026-09-01', '2026-09-30', '[]', tab);
  IF (j ->> 'vencimento_base')::numeric <> 1065 OR NOT (j -> 'inconsistencias' ? 'vencimento_alterado_na_competencia') THEN
    PERFORM pg_temp.falha('ATOS: folha de setembro deveria sair com o valor novo e marcada (' || j::text || ')');
  END IF;

  -- ===== aplicado não muda, não sai, não reaplica; histórico imutável
  r := pg_temp.sql_como(u_cfg, 'authenticated', format('UPDATE public.atos_remuneratorios SET ementa = %L WHERE id = %L', 'outra', at));
  IF r NOT LIKE 'erro:RHE02:%' THEN PERFORM pg_temp.falha('ATOS: ato aplicado mudou (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_cfg, 'authenticated', format('DELETE FROM public.atos_remuneratorios WHERE id = %L', at));
  IF r NOT LIKE 'erro:RHE02:%' THEN PERFORM pg_temp.falha('ATOS: ato aplicado saiu (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_cfg, 'authenticated', format('UPDATE public.atos_remuneratorios_itens SET valor_novo = 1 WHERE ato_id = %L', at));
  IF r NOT LIKE 'erro:RHE02:%' THEN PERFORM pg_temp.falha('ATOS: item de ato aplicado mudou (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_cfg, 'authenticated', format('SELECT public.aplicar_ato_remuneratorio(%L)', at));
  IF r NOT LIKE 'erro:RHE02:%' THEN PERFORM pg_temp.falha('ATOS: ato reaplicado (' || r || ')'); END IF;
  BEGIN
    UPDATE public.cargo_vencimentos SET valor = 1 WHERE cargo_id = cg;
    PERFORM pg_temp.falha('ATOS: histórico do vencimento alterado');
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  r := pg_temp.sql_como(u_cfg, 'authenticated', format(
    'INSERT INTO public.cargo_vencimentos (cargo_id, valor, vigencia_inicio, origem) VALUES (%L, 1, %L, %L)', cg, '2026-01-01', 'cadastro'));
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('ATOS: cargo_vencimentos gravado pela API (' || r || ')'); END IF;

  -- ===== cargo com histórico: mudar o cadastro vale de hoje em diante
  UPDATE public.cargos SET vencimento_base = 1100 WHERE id = cg;
  SELECT count(*) INTO n FROM public.cargo_vencimentos WHERE cargo_id = cg AND origem = 'cadastro' AND valor = 1100;
  IF n <> 1 OR public.vencimento_cargo_em(cg, public.data_local()) <> 1100 OR public.vencimento_cargo_em(cg, '2026-09-30') <> 1065 THEN
    PERFORM pg_temp.falha('ATOS: mudança do cadastro do cargo deveria entrar no histórico a partir de hoje');
  END IF;

  -- ===== parâmetro com vigência posterior já gravada: recusa
  SET LOCAL session_replication_role = replica;
  INSERT INTO public.atos_remuneratorios (id, tipo_ato, numero, data_ato, vigencia_inicio, ementa)
    VALUES (at2, 'decreto', '8/2026', '2026-08-01', '2026-08-01', 'Retroativo de teste');
  INSERT INTO public.atos_remuneratorios_itens (ato_id, alvo, tipo_parametro, valor_novo) VALUES (at2, 'parametro', 'teste_reajuste', 11);
  SET LOCAL session_replication_role = origin;
  r := pg_temp.sql_como(u_cfg, 'authenticated', format('SELECT public.aplicar_ato_remuneratorio(%L)', at2));
  IF r NOT LIKE 'erro:22023:%' THEN PERFORM pg_temp.falha('ATOS: parâmetro com vigência posterior já gravada deveria recusar (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_cfg, 'authenticated', format('DELETE FROM public.atos_remuneratorios WHERE id = %L', at2));
  IF r <> 'ok:1' THEN PERFORM pg_temp.falha('ATOS: rascunho deveria sair com os itens (' || r || ')'); END IF;

  IF has_function_privilege('anon', 'public.aplicar_ato_remuneratorio(uuid)', 'EXECUTE') THEN
    PERFORM pg_temp.falha('ATOS: aplicar_ato_remuneratorio executável por anon');
  END IF;

  PERFORM pg_temp.nota('ATOS remuneratórios: permissão, aplicação tudo ou nada, vencimento e parâmetro por vigência, folha pela vigência com marca no meio do mês, imutabilidade e mudança pelo cadastro verificadas');
END $$;

-- ---------------------------------------------------------------- FOLHA: retorno do banco da remessa (migração 20261021090000)
DO $$
DECLARE
  u_rh uuid := (SELECT uid FROM persona WHERE nome='mod_rh');
  u_proc uuid := (SELECT uid FROM persona WHERE nome='perm_financeiro.folha.processar');
  fl uuid := 'f3000000-0000-0000-0000-0000000000f1'; fo uuid := 'f3000000-0000-0000-0000-0000000000f2';
  ct uuid := 'f3000000-0000-0000-0000-0000000000c1'; rm uuid := 'f3000000-0000-0000-0000-0000000000a1';
  rc uuid := 'f3000000-0000-0000-0000-0000000000a2';
  fa uuid; fb uuid; fx uuid;
  sha1 text := repeat('a', 64); sha2 text := repeat('b', 64);
  itens text; r text; j jsonb;
BEGIN
  SET LOCAL session_replication_role = replica;   -- semeadura sem os triggers de setor/autoria
  INSERT INTO public.folhas_pagamento (id, competencia_ano, competencia_mes, tipo_folha, status) VALUES
    (fl, 2033, 1, 'mensal', 'fechada'), (fo, 2033, 2, 'mensal', 'fechada');
  fa := pg_temp.seed_row('fichas_financeiras', jsonb_build_object('folha_id', fl, 'servidor_id', 'b0000000-0000-0000-0000-00000000000a',
    'valor_liquido', 1000.10, 'banco_codigo', '001', 'banco_agencia', '1234', 'banco_conta', '1111-1'))::uuid;
  fb := pg_temp.seed_row('fichas_financeiras', jsonb_build_object('folha_id', fl, 'servidor_id', 'b0000000-0000-0000-0000-00000000000b',
    'valor_liquido', 2000.20, 'banco_codigo', '001', 'banco_agencia', '4321', 'banco_conta', '2222-2'))::uuid;
  fx := pg_temp.seed_row('fichas_financeiras', jsonb_build_object('folha_id', fo, 'servidor_id', 'b0000000-0000-0000-0000-00000000000a',
    'valor_liquido', 10, 'banco_codigo', '001', 'banco_agencia', '1234', 'banco_conta', '1111-1'))::uuid;
  PERFORM pg_temp.seed_row('contas_autarquia', jsonb_build_object('id', ct));
  INSERT INTO public.remessas_bancarias (id, folha_id, conta_autarquia_id, numero_remessa, nome_arquivo, status, valor_total, quantidade_registros)
    VALUES (rm, fl, ct, 7, 'retorno-teste.rem', 'gerada', 3000.30, 2),
           (rc, fo, ct, 8, 'cancelada-teste.rem', 'cancelada', 10, 1);
  SET LOCAL session_replication_role = origin;

  itens := jsonb_build_array(
    jsonb_build_object('ficha_id', fa, 'identificador', left(fa::text, 20), 'favorecido_nome', 'A', 'valor', 1000.10,
                       'status', 'agendado', 'codigo_ocorrencia', 'BD', 'data_pagamento', '2033-02-01'),
    jsonb_build_object('ficha_id', fb, 'identificador', left(fb::text, 20), 'favorecido_nome', 'B', 'valor', 2000.20,
                       'status', 'rejeitado', 'codigo_ocorrencia', 'AT', 'descricao_ocorrencia', 'CPF inválido'))::text;

  -- ===== quem não processa a folha não registra; anon não executa
  r := pg_temp.sql_como(u_rh, 'authenticated', format('SELECT public.registrar_retorno_remessa(%L, %L, %L)',
         rm, jsonb_build_object('arquivo_sha256', sha1, 'previa', true), itens));
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('RETORNO: o módulo rh sem financeiro.folha.processar registra retorno (' || r || ')'); END IF;
  IF has_function_privilege('anon', 'public.registrar_retorno_remessa(uuid, jsonb, jsonb)', 'EXECUTE') THEN
    PERFORM pg_temp.falha('RETORNO: registrar_retorno_remessa executável por anon');
  END IF;

  -- ===== recusas: sem sha256, sem créditos, situação inválida, ficha de outra folha, remessa cancelada
  r := pg_temp.sql_como(u_proc, 'authenticated', format('SELECT public.registrar_retorno_remessa(%L, %L, %L)',
         rm, jsonb_build_object('previa', true), itens));
  IF r NOT LIKE 'erro:22023:%' THEN PERFORM pg_temp.falha('RETORNO: retorno sem sha256 aceito (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_proc, 'authenticated', format('SELECT public.registrar_retorno_remessa(%L, %L, %L)',
         rm, jsonb_build_object('arquivo_sha256', sha1), '[]'));
  IF r NOT LIKE 'erro:22023:%' THEN PERFORM pg_temp.falha('RETORNO: retorno sem créditos aceito (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_proc, 'authenticated', format('SELECT public.registrar_retorno_remessa(%L, %L, %L)',
         rm, jsonb_build_object('arquivo_sha256', sha1), jsonb_build_array(jsonb_build_object('ficha_id', fa, 'valor', 1, 'status', 'enviado'))));
  IF r NOT LIKE 'erro:22023:%' THEN PERFORM pg_temp.falha('RETORNO: situação inválida aceita (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_proc, 'authenticated', format('SELECT public.registrar_retorno_remessa(%L, %L, %L)',
         rm, jsonb_build_object('arquivo_sha256', sha1), jsonb_build_array(jsonb_build_object('ficha_id', fx, 'valor', 10, 'status', 'pago'))));
  IF r NOT LIKE 'erro:22023:%' THEN PERFORM pg_temp.falha('RETORNO: ficha de outra folha aceita (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_proc, 'authenticated', format('SELECT public.registrar_retorno_remessa(%L, %L, %L)',
         rc, jsonb_build_object('arquivo_sha256', sha1), jsonb_build_array(jsonb_build_object('ficha_id', fx, 'valor', 10, 'status', 'pago'))));
  IF r NOT LIKE 'erro:22023:%' THEN PERFORM pg_temp.falha('RETORNO: retorno em remessa cancelada aceito (' || r || ')'); END IF;

  -- ===== prévia: grava retorno e itens, remessa passa a enviada
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_proc, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  j := public.registrar_retorno_remessa(rm, jsonb_build_object('arquivo_sha256', sha1, 'arquivo_nome', 'previa.ret',
         'nsa', 21, 'data_arquivo', '2033-01-29', 'convenio', '448267', 'previa', true), itens::jsonb);
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '', true);
  IF (j ->> 'agendados')::int <> 1 OR (j ->> 'rejeitados')::int <> 1 OR j ->> 'status_remessa' <> 'enviada' THEN
    PERFORM pg_temp.falha('RETORNO: prévia deveria contar 1 agendado, 1 recusado e deixar a remessa enviada (' || j::text || ')');
  END IF;
  IF (SELECT status FROM public.remessas_bancarias WHERE id = rm) <> 'enviada'
     OR (SELECT enviado_por FROM public.remessas_bancarias WHERE id = rm) IS DISTINCT FROM u_proc THEN
    PERFORM pg_temp.falha('RETORNO: remessa sem a situação enviada ou sem quem registrou');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.retornos_bancarios WHERE remessa_id = rm AND previa AND nsa = 21
                    AND quantidade_agendados = 1 AND valor_agendado = 1000.10 AND quantidade_rejeitados = 1
                    AND valor_rejeitado = 2000.20 AND processado_por = u_proc) THEN
    PERFORM pg_temp.falha('RETORNO: retorno gravado sem os totais, a prévia ou quem processou');
  END IF;
  IF (SELECT servidor_id FROM public.itens_retorno_bancario WHERE ficha_id = fb) IS DISTINCT FROM 'b0000000-0000-0000-0000-00000000000b'::uuid
     OR (SELECT status FROM public.itens_retorno_bancario WHERE ficha_id = fa) <> 'agendado' THEN
    PERFORM pg_temp.falha('RETORNO: item sem o servidor da ficha ou sem a situação');
  END IF;

  -- ===== o mesmo arquivo não entra duas vezes
  r := pg_temp.sql_como(u_proc, 'authenticated', format('SELECT public.registrar_retorno_remessa(%L, %L, %L)',
         rm, jsonb_build_object('arquivo_sha256', sha1, 'previa', true), itens));
  IF r NOT LIKE 'erro:23505:%' THEN PERFORM pg_temp.falha('RETORNO: o mesmo arquivo entrou duas vezes (' || r || ')'); END IF;

  -- ===== retorno final sem agendado: remessa processada (crédito sem ficha fica registrado sem ficha)
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_proc, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  j := public.registrar_retorno_remessa(rm, jsonb_build_object('arquivo_sha256', sha2, 'previa', false), jsonb_build_array(
         jsonb_build_object('ficha_id', fa, 'valor', 1000.10, 'status', 'pago', 'codigo_ocorrencia', '00'),
         jsonb_build_object('identificador', 'fora', 'favorecido_nome', 'X', 'valor', 5, 'status', 'pago')));
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '', true);
  IF (j ->> 'pagos')::int <> 2 OR (j ->> 'sem_ficha')::int <> 1 THEN
    PERFORM pg_temp.falha('RETORNO: retorno final deveria contar 2 pagos e 1 sem ficha (' || j::text || ')');
  END IF;
  IF (SELECT status FROM public.remessas_bancarias WHERE id = rm) <> 'processada' THEN
    PERFORM pg_temp.falha('RETORNO: retorno final sem agendado deveria deixar a remessa processada');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.itens_retorno_bancario i JOIN public.retornos_bancarios t ON t.id = i.retorno_id
                  WHERE t.arquivo_sha256 = sha2 AND i.ficha_id IS NULL AND i.identificador = 'fora') THEN
    PERFORM pg_temp.falha('RETORNO: crédito sem ficha não registrado');
  END IF;

  PERFORM pg_temp.nota('RETORNO da remessa: permissão, recusas (sha256, créditos, situação, outra folha, cancelada), prévia enviada, arquivo único e retorno final processada verificados');
END $$;

-- ---------------------------------------------------------------- FOLHA: parte patronal e INSS por faixa (migração 20261021100000)
-- Conferido com as guias patronais de 09/2026 no FIPLAN: 20% e 2% da soma das bases, truncados no centavo.
DO $$
DECLARE
  u_proc uuid := (SELECT uid FROM persona WHERE nome='perm_financeiro.folha.processar');
  cg uuid := 'f4000000-0000-0000-0000-0000000000c1'; fl uuid := 'f4000000-0000-0000-0000-0000000000f1';
  s_geral uuid := 'f4000000-0000-0000-0000-0000000000a1'; s_rpps uuid := 'f4000000-0000-0000-0000-0000000000a2';
  r jsonb; v_base numeric; fg record; fr record; fo record; x record;
BEGIN
  -- ===== INSS truncado por faixa (vetores sigrh-* do hrms_brasil): só com o parâmetro
  IF public.calcular_inss_servidor(24829, '2034-03-31') <> 988.09 THEN
    PERFORM pg_temp.falha('ENCARGOS INSS: sem o parâmetro deveria arredondar a soma (988,09), deu ' || public.calcular_inss_servidor(24829, '2034-03-31'));
  END IF;
  SET LOCAL session_replication_role = replica;
  DELETE FROM public.parametros_folha WHERE tipo_parametro IN ('inss_truncar_por_faixa', 'inss_patronal_aliquota', 'rat_fap_aliquota');
  INSERT INTO public.parametros_folha (tipo_parametro, valor, vigencia_inicio, ativo) VALUES ('inss_truncar_por_faixa', 1, '2034-01-01', true);
  SET LOCAL session_replication_role = origin;
  FOR x IN SELECT * FROM (VALUES (24829.00, 988.07), (3578.07, 317.95), (2871.43, 234.10)) AS t(base, esperado) LOOP
    IF public.calcular_inss_servidor(x.base, '2034-03-31') <> x.esperado THEN
      PERFORM pg_temp.falha(format('ENCARGOS INSS por faixa: base %s deveria dar %s, deu %s', x.base, x.esperado,
                                   public.calcular_inss_servidor(x.base, '2034-03-31')));
    END IF;
  END LOOP;
  IF public.calcular_inss_servidor(24829, '2033-12-31') <> 988.09 THEN
    PERFORM pg_temp.falha('ENCARGOS INSS: o parâmetro por faixa vale antes da vigência');
  END IF;

  -- ===== alíquota em % e opção fora de 0/1 recusadas
  BEGIN
    INSERT INTO public.parametros_folha (tipo_parametro, valor, vigencia_inicio, ativo) VALUES ('inss_patronal_aliquota', 20, '2040-01-01', true);
    PERFORM pg_temp.falha('ENCARGOS parâmetros: alíquota patronal 20 (em %) aceita');
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    INSERT INTO public.parametros_folha (tipo_parametro, valor, vigencia_inicio, ativo) VALUES ('inss_truncar_por_faixa', 2, '2040-01-01', true);
    PERFORM pg_temp.falha('ENCARGOS parâmetros: inss_truncar_por_faixa = 2 aceito');
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  -- ===== folha sem as alíquotas: patronal zero e aviso
  SET LOCAL session_replication_role = replica;
  INSERT INTO public.cargos (id, nome, sigla, categoria, natureza, vencimento_base, quantidade_vagas)
    VALUES (cg, 'Cargo Encargos Teste', 'ENC-T', 'comissionado', 'comissionado', 24829.00, 2);
  INSERT INTO public.servidores (id, nome_completo, cpf, situacao, ativo, possui_vinculo_externo, contribui_rpps_origem,
                                 rpps_origem_fundamento, rpps_origem_inicio) VALUES
    (s_geral, 'Encargos Geral Teste', '000.000.f41-01', 'ativo', true, false, false, NULL, NULL),
    (s_rpps, 'Encargos RPPS Teste', '000.000.f42-02', 'ativo', true, true, true, 'Instrução normativa de teste', '2034-01-01');
  INSERT INTO public.provimentos (servidor_id, cargo_id, data_nomeacao, status) VALUES
    (s_geral, cg, '2034-01-01', 'ativo'), (s_rpps, cg, '2034-01-01', 'ativo');
  INSERT INTO public.folhas_pagamento (id, competencia_ano, competencia_mes, tipo_folha, status) VALUES (fl, 2034, 3, 'mensal', 'aberta');
  SET LOCAL session_replication_role = origin;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_proc, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  r := public.processar_folha_pagamento(fl);
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '', true);
  IF NOT coalesce((r ->> 'sucesso')::boolean, false) OR NOT (r -> 'avisos')::text LIKE '%inss_patronal_aliquota%'
     OR NOT (r -> 'avisos')::text LIKE '%rat_fap_aliquota%'
     OR (SELECT total_encargos_patronais FROM public.folhas_pagamento WHERE id = fl) <> 0 THEN
    PERFORM pg_temp.falha('ENCARGOS folha: sem alíquotas deveria processar com patronal zero e avisar (' || r::text || ')');
  END IF;

  -- ===== com 20% e 2%: por ficha de quem contribui para o regime geral; total truncado como a guia
  SET LOCAL session_replication_role = replica;
  INSERT INTO public.parametros_folha (tipo_parametro, valor, vigencia_inicio, ativo) VALUES
    ('inss_patronal_aliquota', 0.20, '2034-01-01', true), ('rat_fap_aliquota', 0.02, '2034-01-01', true);
  SET LOCAL session_replication_role = origin;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_proc, 'role', 'authenticated')::text, true);
  SET LOCAL ROLE authenticated;
  r := public.processar_folha_pagamento(fl);
  RESET ROLE;
  PERFORM set_config('request.jwt.claims', '', true);
  SELECT * INTO fg FROM public.fichas_financeiras WHERE folha_id = fl AND servidor_id = s_geral;
  SELECT * INTO fr FROM public.fichas_financeiras WHERE folha_id = fl AND servidor_id = s_rpps;
  SELECT * INTO fo FROM public.folhas_pagamento WHERE id = fl;
  SELECT sum(base_inss) INTO v_base FROM public.fichas_financeiras WHERE folha_id = fl AND valor_inss > 0;
  IF NOT coalesce((r ->> 'sucesso')::boolean, false) OR fg.valor_inss <> 988.07 OR fg.inss_patronal <> 4965.80 OR fg.rat <> 496.58
     OR fg.total_encargos <> 5462.38 THEN
    PERFORM pg_temp.falha(format('ENCARGOS ficha: subsídio de 24.829 deveria ter INSS 988,07, patronal 4.965,80 e RAT 496,58 (INSS %s, patronal %s, RAT %s; %s)',
                                 fg.valor_inss, fg.inss_patronal, fg.rat, r));
  END IF;
  IF fr.valor_inss <> 0 OR fr.inss_patronal <> 0 OR fr.rat <> 0 THEN
    PERFORM pg_temp.falha('ENCARGOS ficha: quem contribui para o regime próprio na origem não tem parte patronal do regime geral');
  END IF;
  IF fo.total_inss_patronal <> trunc(v_base * 0.20, 2) OR fo.total_rat <> trunc(v_base * 0.02, 2)
     OR fo.total_encargos_patronais <> trunc(v_base * 0.20, 2) + trunc(v_base * 0.02, 2) THEN
    PERFORM pg_temp.falha(format('ENCARGOS folha: totais deveriam ser a soma das bases (%s) × alíquota, truncada (patronal %s, RAT %s, total %s)',
                                 v_base, fo.total_inss_patronal, fo.total_rat, fo.total_encargos_patronais));
  END IF;

  SET LOCAL session_replication_role = replica;
  DELETE FROM public.parametros_folha WHERE tipo_parametro IN ('inss_truncar_por_faixa', 'inss_patronal_aliquota', 'rat_fap_aliquota');
  SET LOCAL session_replication_role = origin;

  PERFORM pg_temp.nota('FOLHA (encargos): INSS truncado por faixa só com o parâmetro e na vigência, alíquota em % recusada, folha sem alíquotas com aviso, INSS patronal e RAT por ficha só do regime geral e totais truncados como a guia verificados');
END $$;

-- ---------------------------------------------------------------- FOLHA: vetores comuns com o hrms_brasil (scripts/db/casos-folha.json)
-- Os mesmos casos rodam no hrms_brasil (tests/test_casos.py). testar-rls.sh passa o arquivo em -v casos_folha; INSS e
-- IRRF usam as tabelas e os parâmetros de 2026 semeados no bloco "FOLHA: cálculo do INSS e do IRRF".
\if :{?casos_folha}
SELECT set_config('teste.casos_folha', :'casos_folha', false);
\else
SELECT set_config('teste.casos_folha', '', false);
\endif
DO $$
DECLARE
  v_json text := current_setting('teste.casos_folha', true);
  c jsonb; e jsonb; r jsonb; v numeric; n_ok int := 0; outras text[] := '{}';
BEGIN
  IF coalesce(v_json, '') = '' THEN
    PERFORM pg_temp.falha('VETORES: scripts/db/casos-folha.json não chegou ao teste (rode por scripts/db/testar-rls.sh)');
    RETURN;
  END IF;
  FOR c IN SELECT jsonb_array_elements(v_json::jsonb -> 'casos') LOOP
    e := c -> 'entrada';
    IF c ->> 'regra' = 'inss' THEN
      SET LOCAL session_replication_role = replica;
      DELETE FROM public.parametros_folha WHERE tipo_parametro = 'inss_truncar_por_faixa';
      IF e ->> 'arredondamento' = 'por_faixa' THEN
        INSERT INTO public.parametros_folha (tipo_parametro, valor, vigencia_inicio, ativo) VALUES ('inss_truncar_por_faixa', 1, '2026-01-01', true);
      END IF;
      SET LOCAL session_replication_role = origin;
      v := public.calcular_inss_servidor((e ->> 'base')::numeric, '2026-09-30');
      IF v <> (c -> 'esperado' ->> 'inss')::numeric THEN
        PERFORM pg_temp.falha(format('VETORES %s: INSS %s, esperado %s', c ->> 'id', v, c -> 'esperado' ->> 'inss'));
      ELSE n_ok := n_ok + 1; END IF;
    ELSIF c ->> 'regra' = 'irrf' THEN
      r := public.calcular_irrf_mensal((e ->> 'rendimentos')::numeric,
             (e ->> 'inss')::numeric + coalesce((e ->> 'dependentes')::int, 0) * 189.59 + coalesce((e ->> 'pensao')::numeric, 0),
             '2026-09-30');
      IF (r ->> 'irrf')::numeric <> (c -> 'esperado' ->> 'irrf')::numeric THEN
        PERFORM pg_temp.falha(format('VETORES %s: IRRF %s, esperado %s (%s)', c ->> 'id', r ->> 'irrf', c -> 'esperado' ->> 'irrf', r));
      ELSE n_ok := n_ok + 1; END IF;
    ELSE
      outras := outras || (c ->> 'id');
    END IF;
  END LOOP;
  SET LOCAL session_replication_role = replica;
  DELETE FROM public.parametros_folha WHERE tipo_parametro = 'inss_truncar_por_faixa';
  SET LOCAL session_replication_role = origin;
  IF n_ok = 0 THEN PERFORM pg_temp.falha('VETORES: nenhum caso de INSS ou IRRF conferido'); END IF;

  PERFORM pg_temp.nota(format('FOLHA (vetores do hrms_brasil): %s casos de INSS e IRRF iguais; fora do porte (férias da CLT e 13º): %s',
                              n_ok, array_to_string(outras, ', ')));
END $$;

-- ---------------------------------------------------------------- FOLHA: importação da folha do SIGRH (migração 20261022090000)
--   * importar_folha_sigrh: anon e PUBLIC sem EXECUTE; quem processa a folha mas não pode fechá-la (sem rh.admin) recusa
--     (42501); competência futura, mês corrente e lista vazia recusados (22023); sem alíquotas patronais, aviso;
--   * base de INSS sem o provento cuja rubrica cadastrada não incide (ajuste da migração 20261022100000);
--   * simulação não grava (nem folha, nem fichas, nem importacoes) e avisa servidor sem provimento no mês;
--   * CPF desconhecido é erro da linha e a aplicação não grava nada;
--   * aplicação: folha mensal fechada com a justificativa da importação, uma ficha por servidor (casado pelo CPF
--     formatado no cadastro), totais, INSS/IRRF somados das rubricas, cargo do provimento e função do espelho,
--     retroativo com a competência na descrição, rubrica ligada pela descrição; log em importacoes sem CPF;
--   * competência que já tem folha mensal: recusada (23505).
CREATE FUNCTION pg_temp.fs_chamar(p_uid uuid, p_comp jsonb, p_fichas jsonb, p_simular boolean) RETURNS text
LANGUAGE sql AS $$
  SELECT pg_temp.valor_como(p_uid, 'authenticated', format(
    'SELECT public.importar_folha_sigrh(%L::jsonb, %L::jsonb, %L::jsonb, %L)::text', p_comp, p_fichas,
    jsonb_build_object('nome', 'ESPELHO_FPAG10.pdf', 'sha256', repeat('cd', 32), 'tamanho', 4096), p_simular))
$$;

DO $$
DECLARE
  u_imp uuid := 'a0000000-0000-0000-0000-0000000007a1';   -- módulo rh + financeiro.folha.processar + rh.admin
  u_proc uuid := (SELECT uid FROM persona WHERE nome='perm_financeiro.folha.processar');   -- processa, não fecha
  cg uuid := 'f5000000-0000-0000-0000-0000000000c1';
  s1 uuid := 'f5000000-0000-0000-0000-0000000000a1';      -- com provimento
  s2 uuid := 'f5000000-0000-0000-0000-0000000000a2';      -- sem provimento
  rb uuid := 'f5000000-0000-0000-0000-0000000000b1';
  fn text := 'public.importar_folha_sigrh(jsonb, jsonb, jsonb, boolean)';
  comp jsonb := '{"ano": 2019, "mes": 3}';
  fichas jsonb; r text; j jsonb; modo_rh text; fl record; f1 record; n int;
BEGIN
  IF to_regprocedure(fn) IS NULL THEN
    PERFORM pg_temp.falha('FOLHA SIGRH: ' || fn || ' não existe');
    RETURN;
  END IF;
  SET LOCAL session_replication_role = origin;
  INSERT INTO auth.users (id, email) VALUES (u_imp, 'fs_imp@teste.invalid');
  UPDATE public.profiles SET is_active = true WHERE id = u_imp;
  INSERT INTO public.user_modules (user_id, module, permissions) VALUES
    (u_imp, 'rh', '{financeiro.folha.processar,rh.admin,rh.contracheques.visualizar}');
  SELECT modo INTO modo_rh FROM public.regra_lancamento WHERE modulo = 'rh';
  PERFORM pg_temp.ls_sistema();
  UPDATE public.regra_lancamento SET modo = 'registrar' WHERE modulo = 'rh';
  SET LOCAL session_replication_role = replica;
  INSERT INTO public.cargos (id, nome, sigla, categoria, natureza, vencimento_base, quantidade_vagas)
    VALUES (cg, 'Cargo SIGRH Teste', 'SIG-T', 'comissionado', 'comissionado', 3578.08, 2);
  INSERT INTO public.servidores (id, nome_completo, cpf, situacao, ativo) VALUES
    (s1, 'SIGRH Servidor 1', '000.000.701-01', 'ativo', true),   -- casado só pelos dígitos
    (s2, 'SIGRH Servidor 2', '00000070202', 'exonerado', false);
  INSERT INTO public.provimentos (servidor_id, cargo_id, data_nomeacao, status) VALUES (s1, cg, '2019-01-01', 'ativo');
  INSERT INTO public.rubricas (id, codigo, descricao, tipo, natureza, formula_tipo, vigencia_inicio, ativo, incide_inss) VALUES
    (rb, 'SIG01', 'Vencimento SIGRH Teste', 'provento', 'remuneratorio', 'valor_fixo', '2019-01-01', true, true),
    (gen_random_uuid(), 'SIG02', 'Diaria SIGRH Teste', 'provento', 'indenizatorio', 'valor_fixo', '2019-01-01', true, false);
  SET LOCAL session_replication_role = origin;

  fichas := jsonb_build_array(
    jsonb_build_object('indice', 0, 'cpf', '00000070101', 'nome', 'SERVIDOR UM', 'funcao', 'CHEFE DE NUCLEO',
      'banco_codigo', '001', 'banco_agencia', '04263', 'banco_conta', '12345X', 'dependentes_ir', 1,
      'itens', jsonb_build_array(
        jsonb_build_object('descricao', 'VENCIMENTO SIGRH TESTE', 'tipo', 'provento', 'quantidade', '30,00', 'valor', '3578.08'),
        jsonb_build_object('descricao', 'DIF DE VENCIMENTO', 'tipo', 'provento', 'competencia', '2019-02', 'valor', '79.99'),
        jsonb_build_object('descricao', 'DIARIA SIGRH TESTE', 'tipo', 'provento', 'valor', '100.00'),
        jsonb_build_object('descricao', 'INSS', 'tipo', 'desconto', 'quantidade', '12,00', 'valor', '317.95'),
        jsonb_build_object('descricao', 'IRRF', 'tipo', 'desconto', 'valor', '10.00'))),
    jsonb_build_object('indice', 1, 'cpf', '00000070202', 'nome', 'SERVIDOR DOIS', 'funcao', 'DIRETOR',
      'itens', jsonb_build_array(jsonb_build_object('descricao', 'SUBSIDIO', 'tipo', 'provento', 'valor', '1000.00'))));

  -- ===== quem chama
  IF has_function_privilege('anon', fn, 'EXECUTE') THEN PERFORM pg_temp.falha('FOLHA SIGRH: anon executa ' || fn); END IF;
  IF EXISTS (SELECT 1 FROM pg_proc p, aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
              WHERE p.oid = to_regprocedure(fn) AND a.grantee = 0 AND a.privilege_type = 'EXECUTE') THEN
    PERFORM pg_temp.falha('FOLHA SIGRH: PUBLIC executa ' || fn);
  END IF;
  IF NOT has_function_privilege('authenticated', fn, 'EXECUTE') THEN PERFORM pg_temp.falha('FOLHA SIGRH: authenticated não executa ' || fn); END IF;
  r := pg_temp.fs_chamar(u_proc, comp, fichas, true);
  IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('FOLHA SIGRH: quem processa sem poder fechar a folha importa (' || r || ')'); END IF;
  r := pg_temp.fs_chamar(u_imp, jsonb_build_object('ano', extract(year FROM current_date + 40)::int,
                                                    'mes', extract(month FROM current_date + 40)::int), fichas, true);
  IF r NOT LIKE 'erro:22023%' THEN PERFORM pg_temp.falha('FOLHA SIGRH: competência futura aceita (' || r || ')'); END IF;
  r := pg_temp.fs_chamar(u_imp, jsonb_build_object('ano', extract(year FROM current_date)::int,
                                                    'mes', extract(month FROM current_date)::int), fichas, true);
  IF r NOT LIKE 'erro:22023%' THEN PERFORM pg_temp.falha('FOLHA SIGRH: mês corrente (ainda não pago) aceito (' || r || ')'); END IF;
  r := pg_temp.fs_chamar(u_imp, comp, '[]', true);
  IF r NOT LIKE 'erro:22023%' THEN PERFORM pg_temp.falha('FOLHA SIGRH: lista vazia aceita (' || r || ')'); END IF;

  -- ===== simulação: nada gravado, aviso de quem não tem provimento
  r := pg_temp.fs_chamar(u_imp, comp, fichas, true);
  j := CASE WHEN left(r, 1) = '{' THEN r::jsonb END;
  IF j IS NULL OR (j -> 'totais' ->> 'inserir')::int <> 2 OR jsonb_array_length(j -> 'erros') <> 0
     OR (j -> 'linhas' -> 1 -> 'avisos')::text NOT LIKE '%Sem provimento%'
     OR (j -> 'linhas' -> 0 -> 'avisos')::text NOT LIKE '%parte patronal da folha sai zero%' THEN
    PERFORM pg_temp.falha('FOLHA SIGRH: simulação deveria inserir 2 fichas e avisar o servidor sem provimento (' || r || ')');
  END IF;
  IF EXISTS (SELECT 1 FROM public.folhas_pagamento WHERE competencia_ano = 2019 AND competencia_mes = 3)
     OR EXISTS (SELECT 1 FROM public.importacoes WHERE tipo = 'folha_sigrh') THEN
    PERFORM pg_temp.falha('FOLHA SIGRH: a simulação gravou');
  END IF;

  -- ===== CPF desconhecido: erro da linha, nada gravado
  r := pg_temp.fs_chamar(u_imp, comp, fichas || jsonb_build_array(jsonb_build_object('indice', 2, 'cpf', '99999999999',
         'nome', 'NAO CADASTRADO', 'itens', jsonb_build_array(jsonb_build_object('descricao', 'SUBSIDIO', 'tipo', 'provento', 'valor', '1.00')))), false);
  j := CASE WHEN left(r, 1) = '{' THEN r::jsonb END;
  IF j IS NULL OR jsonb_array_length(j -> 'erros') <> 1 OR (j -> 'erros' -> 0 ->> 'indice')::int <> 2
     OR (j -> 'erros' -> 0 ->> 'mensagem') NOT LIKE 'NAO CADASTRADO: Servidor não cadastrado%' OR r LIKE '%99999999999%' THEN
    PERFORM pg_temp.falha('FOLHA SIGRH: CPF desconhecido deveria ser erro da linha 2, sem devolver o CPF (' || r || ')');
  END IF;
  IF EXISTS (SELECT 1 FROM public.folhas_pagamento WHERE competencia_ano = 2019 AND competencia_mes = 3) THEN
    PERFORM pg_temp.falha('FOLHA SIGRH: aplicação com erro gravou a folha');
  END IF;

  -- ===== aplicação
  r := pg_temp.fs_chamar(u_imp, comp, fichas, false);
  j := CASE WHEN left(r, 1) = '{' THEN r::jsonb END;
  SELECT * INTO fl FROM public.folhas_pagamento WHERE competencia_ano = 2019 AND competencia_mes = 3 AND tipo_folha = 'mensal';
  IF j IS NULL OR j ->> 'importacao_id' IS NULL OR fl.id IS NULL OR fl.status <> 'fechada'
     OR fl.justificativa_fechamento NOT LIKE 'Folha histórica importada do SIGRH (arquivo ESPELHO_FPAG10.pdf)%'
     OR fl.fechado_por IS DISTINCT FROM u_imp OR fl.quantidade_servidores <> 2
     OR fl.total_bruto <> 4758.07 OR fl.total_descontos <> 327.95 OR fl.total_liquido <> 4430.12
     OR fl.total_inss_servidor <> 317.95 OR fl.total_irrf <> 10.00 THEN
    PERFORM pg_temp.falha(format('FOLHA SIGRH: aplicação deveria criar a folha fechada com os totais (%s; folha %s)', r, to_jsonb(fl)));
  END IF;
  SELECT * INTO f1 FROM public.fichas_financeiras WHERE folha_id = fl.id AND servidor_id = s1;
  IF f1.id IS NULL OR f1.cargo_id IS DISTINCT FROM cg OR f1.cargo_nome <> 'CHEFE DE NUCLEO' OR f1.total_proventos <> 3758.07
     OR f1.valor_inss <> 317.95 OR f1.base_inss <> 3658.07 OR f1.valor_irrf <> 10.00 OR f1.valor_liquido <> 3430.12
     OR f1.banco_conta <> '12345X' OR f1.quantidade_dependentes <> 1 THEN
    PERFORM pg_temp.falha('FOLHA SIGRH: ficha do servidor 1 sem cargo, função, totais ou banco (' || to_jsonb(f1)::text || ')');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.itens_ficha_financeira WHERE ficha_id = f1.id AND descricao = 'DIF DE VENCIMENTO (02/2019)')
     OR (SELECT rubrica_id FROM public.itens_ficha_financeira WHERE ficha_id = f1.id AND ordem = 1) IS DISTINCT FROM rb
     OR (SELECT count(*) FROM public.itens_ficha_financeira WHERE ficha_id = f1.id AND origem = 'automatico') <> 5 THEN
    PERFORM pg_temp.falha('FOLHA SIGRH: itens sem a competência do retroativo, sem a rubrica ligada ou fora da origem automatico');
  END IF;
  IF (SELECT cargo_id FROM public.fichas_financeiras WHERE folha_id = fl.id AND servidor_id = s2) IS NOT NULL THEN
    PERFORM pg_temp.falha('FOLHA SIGRH: servidor sem provimento ganhou cargo');
  END IF;
  SELECT count(*) INTO n FROM public.importacoes
   WHERE tipo = 'folha_sigrh' AND modulo = 'rh' AND exercicio = 2019 AND (resumo ->> 'fichas')::int = 2
     AND detalhes::text NOT LIKE '%0000007%' AND resumo::text NOT LIKE '%0000007%';
  IF n <> 1 THEN PERFORM pg_temp.falha('FOLHA SIGRH: log em importacoes ausente ou com CPF'); END IF;

  -- ===== a mesma competência não entra de novo
  r := pg_temp.fs_chamar(u_imp, comp, fichas, true);
  IF r NOT LIKE 'erro:23505%' THEN PERFORM pg_temp.falha('FOLHA SIGRH: competência que já tem folha mensal aceita (' || r || ')'); END IF;

  PERFORM pg_temp.ls_sistema();
  UPDATE public.regra_lancamento SET modo = modo_rh WHERE modulo = 'rh';
  PERFORM pg_temp.nota('FOLHA SIGRH: permissão (processar e fechar), competência futura, simulação sem gravar, CPF desconhecido sem gravar nem devolver o CPF, folha fechada com fichas, itens e totais, log sem CPF e competência repetida verificados');
END $$;

-- ---------------------------------------------------------------- Financeiro: empenhos do FIPLAN (FIP 614)
-- Migração 20261027090000_fin_empenhos_fip614.sql (spec docs/superpowers/specs/2026-10-22-importacao-empenhos-fip614-design.md):
--   * importar_empenhos_fip614: sem o módulo financeiro, sem orcamento.importar ou sem sessão recusa (42501); anon e
--     PUBLIC sem EXECUTE; lista vazia = 22023;
--   * simulação não grava; aplicação cria o empenho com origem fiplan, liga a dotação única e o favorecido pelo código
--     do FIPLAN, grava o histórico e o log, e NÃO soma na dotação; dotação ambígua fica sem ligação e com aviso;
--     reaplicar dá sem_alteracao; empenho do sistema com o mesmo número vira erro e nada é gravado;
--   * o empenho feito no sistema continua somando na dotação e exigindo favorecido e dotação;
--   * fin_empenho_documentos_fiplan: lê quem tem o módulo financeiro; ninguém grava pela API.
-- Banco anterior à migração: o bloco reprova sem abortar.
DO $$
DECLARE
  u_fin uuid := 'a0000000-0000-0000-0000-0000000008e1';   -- módulo financeiro + orcamento.importar
  u_lei uuid := 'a0000000-0000-0000-0000-0000000008e2';   -- módulo financeiro sem a permissão
  u_rhp uuid := 'a0000000-0000-0000-0000-0000000008e3';   -- a permissão no módulo rh, sem o financeiro
  d_osc1 uuid := 'f3000000-0000-0000-0000-0000000000d1';
  d_osc4 uuid := 'f3000000-0000-0000-0000-0000000000d2';
  d_pas uuid := 'f3000000-0000-0000-0000-0000000000d3';
  f_cred uuid := 'f3000000-0000-0000-0000-0000000000f1';
  fn text := 'public.importar_empenhos_fip614(integer, jsonb, jsonb, date, boolean)';
  arq text := jsonb_build_object('nome', 'fip614.pdf', 'sha256', repeat('ef', 32), 'tamanho', 2048)::text;
  e1 jsonb; e2 jsonb; linhas jsonb; r text; n_imp int; x record; v_emp uuid;
BEGIN
  IF to_regprocedure(fn) IS NULL OR to_regclass('public.fin_empenho_documentos_fiplan') IS NULL THEN
    PERFORM pg_temp.falha('FIN empenhos FIPLAN: ' || fn || ' ou a tabela não existe');
    RETURN;
  END IF;
  SET LOCAL session_replication_role = origin;
  INSERT INTO auth.users (id, email) VALUES (u_fin, 'ef_fin@teste.invalid'), (u_lei, 'ef_lei@teste.invalid'), (u_rhp, 'ef_rhp@teste.invalid');
  UPDATE public.profiles SET is_active = true WHERE id IN (u_fin, u_lei, u_rhp);
  INSERT INTO public.user_modules (user_id, module, permissions) VALUES
    (u_fin, 'financeiro', '{orcamento.importar}'),
    (u_lei, 'financeiro', '{}'),
    (u_rhp, 'rh', '{orcamento.importar}');
  -- QDD de 2031: duas dotações de OSC (IDU diferente) e uma de passagens
  INSERT INTO public.fin_dotacoes (id, exercicio, codigo_dotacao, valor_inicial, valor_empenhado) VALUES
    (d_osc1, 2031, '08.244.030.2544.9900.33504100.1.500.0000.Não', 100000, 0),
    (d_osc4, 2031, '08.244.030.2544.9900.33504100.1.500.0000.ECNI', 100000, 0),
    (d_pas, 2031, '08.244.030.2544.9900.33903300.1.500.0000.Não', 1000, 1000);
  INSERT INTO public.fornecedores (id, tipo_pessoa, cpf_cnpj, razao_social, codigo_credor_fiplan)
    VALUES (f_cred, 'PJ', '00.000.000/0001-91', 'Agência de Teste', '2001.00001-1');

  -- Passagens: R$ 900,00 empenhado, R$ 100,00 estornado, R$ 500,00 liquidado e R$ 300,00 pago
  e1 := jsonb_build_object('numero', '17302.0001.31.00001-1', 'data_empenho', '2031-03-05', 'processo', '00000107/31-01',
          'processo_sei', '17302.000107/2031.01', 'convenio', null, 'ped_numero', '17302.0001.31.00008-9', 'ped_data', '2031-03-04',
          'dotacao', '17302.0001.08.244.030.2544.9900.33903300.1500.000', 'credor_codigo', '2001.00001-1', 'credor_nome', 'AGENCIA DE TESTE',
          'valor_empenhado', 900, 'valor_anulado', 100,
          'totais', jsonb_build_object('emp', 800, 'liq', 500, 'nob', 300, 'gcv', 0, 'saldo_liquidar', 300, 'a_pagar', 200),
          'documentos', jsonb_build_array(
            jsonb_build_object('tipo', 'EMP', 'numero', '17302.0001.31.00001-1', 'data', '2031-03-05', 'pc', null, 'valores', jsonb_build_object('emp', 900), 'historico', null),
            jsonb_build_object('tipo', 'LIQ', 'numero', '17302.0001.31.00100-6', 'data', '2031-07-08', 'pc', null, 'valores', jsonb_build_object('liq', 500), 'historico', 'Fatura de teste'),
            jsonb_build_object('tipo', 'NOB', 'numero', '17302.0001.31.00127-0', 'data', '2031-08-04', 'pc', 'P', 'valores', jsonb_build_object('nob', 300), 'historico', null),
            jsonb_build_object('tipo', 'EST', 'numero', '17302.0001.31.00002-3', 'data', '2031-08-09', 'pc', null, 'valores', jsonb_build_object('emp', 100), 'historico', null)));
  -- OSC: duas dotações possíveis (o FIP 614 corta antes do IDU)
  e2 := jsonb_build_object('numero', '17302.0001.31.00002-1', 'data_empenho', '2031-04-24', 'processo', '00000168/31-61',
          'processo_sei', '17302.000168/2031.61', 'convenio', 'Fomento nº 01/2031', 'ped_numero', '17302.0001.31.00016-1', 'ped_data', '2031-04-24',
          'dotacao', '17302.0001.08.244.030.2544.9900.33504100.1500.000', 'credor_codigo', '2025.00002-2', 'credor_nome', 'INSTITUTO DE TESTE',
          'valor_empenhado', 5000, 'valor_anulado', 0,
          'totais', jsonb_build_object('emp', 5000, 'liq', 0, 'nob', 0, 'gcv', 0, 'saldo_liquidar', 5000, 'a_pagar', 0),
          'documentos', jsonb_build_array(
            jsonb_build_object('tipo', 'EMP', 'numero', '17302.0001.31.00002-1', 'data', '2031-04-24', 'pc', null, 'valores', jsonb_build_object('emp', 5000), 'historico', null)));
  linhas := jsonb_build_array(e1, e2);

  -- ===== quem chama
  IF has_function_privilege('anon', fn, 'EXECUTE') THEN PERFORM pg_temp.falha('FIN empenhos FIPLAN: anon executa ' || fn); END IF;
  IF EXISTS (SELECT 1 FROM pg_proc p, aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
              WHERE p.oid = to_regprocedure(fn) AND a.grantee = 0 AND a.privilege_type = 'EXECUTE') THEN
    PERFORM pg_temp.falha('FIN empenhos FIPLAN: PUBLIC executa ' || fn);
  END IF;
  FOR x IN SELECT * FROM (VALUES (u_lei, 'sem orcamento.importar'), (u_rhp, 'sem o módulo financeiro'), (NULL::uuid, 'sem sessão')) v(quem, rot) LOOP
    r := pg_temp.sql_como(x.quem, 'authenticated', format('SELECT public.importar_empenhos_fip614(2031, %L::jsonb, NULL, NULL, true)', linhas));
    IF r NOT LIKE 'erro:42501%' THEN PERFORM pg_temp.falha('FIN empenhos FIPLAN: ' || x.rot || ' não recusa (' || r || ')'); END IF;
  END LOOP;
  r := pg_temp.sql_como(u_fin, 'authenticated', 'SELECT public.importar_empenhos_fip614(2031, ''[]''::jsonb, NULL, NULL, true)');
  IF r NOT LIKE 'erro:22023%' THEN PERFORM pg_temp.falha('FIN empenhos FIPLAN: lista vazia aceita (' || r || ')'); END IF;

  -- ===== simulação não grava
  SELECT count(*) INTO n_imp FROM public.importacoes;
  r := pg_temp.valor_como(u_fin, 'authenticated', format('SELECT public.importar_empenhos_fip614(2031, %L::jsonb, %L::jsonb, %L, true)::text', linhas, arq, '2031-09-30'));
  IF left(coalesce(r, ''), 1) <> '{' OR (r::jsonb -> 'totais' ->> 'inserir')::int <> 2 OR jsonb_array_length(r::jsonb -> 'erros') <> 0
     OR r::jsonb -> 'linhas' -> 1 -> 'avisos' ->> 0 !~ '2 dotações possíveis' THEN
    PERFORM pg_temp.falha('FIN empenhos FIPLAN: simulação devolveu ' || left(coalesce(r, 'nulo'), 200));
  END IF;
  IF EXISTS (SELECT 1 FROM public.fin_empenhos WHERE exercicio = 2031) OR (SELECT count(*) FROM public.importacoes) <> n_imp THEN
    PERFORM pg_temp.falha('FIN empenhos FIPLAN: a simulação gravou');
  END IF;

  -- ===== aplicação: grava sem somar na dotação; reaplicar dá sem_alteracao
  r := pg_temp.exec_como(u_fin, 'authenticated', format('SELECT public.importar_empenhos_fip614(2031, %L::jsonb, %L::jsonb, %L, false)', linhas, arq, '2031-09-30'));
  SELECT id INTO v_emp FROM public.fin_empenhos WHERE exercicio = 2031 AND numero = '17302.0001.31.00001-1';
  IF r <> 'ok' OR v_emp IS NULL
     OR (SELECT row(origem, dotacao_id, fornecedor_id, valor_empenhado, valor_anulado, valor_liquidado, valor_pago, saldo_liquidar, status::text, objeto, data_referencia_fiplan)
           FROM public.fin_empenhos WHERE id = v_emp)
        IS DISTINCT FROM row('fiplan'::text, d_pas, f_cred, 900.00::numeric(15,2), 100.00::numeric(15,2), 500.00::numeric(15,2), 300.00::numeric(15,2),
                             300.00::numeric(15,2), 'parcialmente_pago'::text, 'Fatura de teste'::text, '2031-09-30'::date) THEN
    PERFORM pg_temp.falha('FIN empenhos FIPLAN: empenho gravado errado (' || coalesce(r, 'nulo') || ')');
  END IF;
  IF (SELECT count(*) FROM public.fin_empenho_documentos_fiplan WHERE empenho_id = v_emp) <> 4
     OR (SELECT dotacao_id FROM public.fin_empenhos WHERE exercicio = 2031 AND numero = '17302.0001.31.00002-1') IS NOT NULL
     OR (SELECT count(*) FROM public.importacoes WHERE tipo = 'empenhos_fip614') <> 1 THEN
    PERFORM pg_temp.falha('FIN empenhos FIPLAN: histórico, dotação ambígua ou log errados');
  END IF;
  IF (SELECT valor_empenhado FROM public.fin_dotacoes WHERE id = d_pas) <> 1000
     OR (SELECT sum(valor_empenhado) FROM public.fin_dotacoes WHERE id IN (d_osc1, d_osc4)) <> 0 THEN
    PERFORM pg_temp.falha('FIN empenhos FIPLAN: empenho do FIPLAN somou na dotação');
  END IF;
  r := pg_temp.valor_como(u_fin, 'authenticated', format('SELECT public.importar_empenhos_fip614(2031, %L::jsonb, %L::jsonb, %L, true)::text', linhas, arq, '2031-09-30'));
  IF left(coalesce(r, ''), 1) <> '{' OR (r::jsonb -> 'totais' ->> 'sem_alteracao')::int <> 2 THEN
    PERFORM pg_temp.falha('FIN empenhos FIPLAN: reimportar não deu sem_alteracao (' || left(coalesce(r, 'nulo'), 300) || ')');
  END IF;
  -- dotação escolhida à mão entre as candidatas sobrevive à reimportação
  UPDATE public.fin_empenhos SET dotacao_id = d_osc4 WHERE exercicio = 2031 AND numero = '17302.0001.31.00002-1';
  r := pg_temp.exec_como(u_fin, 'authenticated', format('SELECT public.importar_empenhos_fip614(2031, %L::jsonb, %L::jsonb, %L, false)', linhas, arq, '2031-10-31'));
  IF r <> 'ok' OR (SELECT dotacao_id FROM public.fin_empenhos WHERE exercicio = 2031 AND numero = '17302.0001.31.00002-1') IS DISTINCT FROM d_osc4 THEN
    PERFORM pg_temp.falha('FIN empenhos FIPLAN: reimportar perdeu a dotação escolhida (' || coalesce(r, 'nulo') || ')');
  END IF;
  -- com o IDU em número na dotação (1 = Não), a dotação certa liga sozinha, mesmo com outra escolhida antes
  r := pg_temp.exec_como(u_fin, 'authenticated', format('SELECT public.importar_empenhos_fip614(2031, %L::jsonb, %L::jsonb, %L, false)',
         jsonb_build_array(e2 || jsonb_build_object('dotacao', '17302.0001.08.244.030.2544.9900.33504100.1500.0000.1.1')), arq, '2031-10-31'));
  IF r <> 'ok' OR (SELECT dotacao_id FROM public.fin_empenhos WHERE exercicio = 2031 AND numero = '17302.0001.31.00002-1') IS DISTINCT FROM d_osc1 THEN
    PERFORM pg_temp.falha('FIN empenhos FIPLAN: IDU da dotação não escolheu a dotação (' || coalesce(r, 'nulo') || ')');
  END IF;
  -- a origem não muda
  BEGIN
    UPDATE public.fin_empenhos SET origem = 'sistema' WHERE id = v_emp;
    PERFORM pg_temp.falha('FIN empenhos FIPLAN: origem alterada');
  EXCEPTION WHEN invalid_parameter_value OR check_violation THEN NULL;
  END;

  -- ===== empenho do sistema: continua somando na dotação e exigindo favorecido e dotação
  INSERT INTO public.fin_empenhos (numero, exercicio, dotacao_id, fornecedor_id, valor_empenhado, objeto)
    VALUES ('NE-2031-001', 2031, d_osc1, f_cred, 250, 'Empenho do sistema');
  IF (SELECT valor_empenhado FROM public.fin_dotacoes WHERE id = d_osc1) <> 250 THEN
    PERFORM pg_temp.falha('FIN empenhos FIPLAN: empenho do sistema deixou de somar na dotação');
  END IF;
  BEGIN
    INSERT INTO public.fin_empenhos (numero, exercicio, dotacao_id, valor_empenhado, objeto) VALUES ('NE-2031-002', 2031, d_osc1, 10, 'Sem favorecido');
    PERFORM pg_temp.falha('FIN empenhos FIPLAN: empenho do sistema sem favorecido aceito');
  EXCEPTION WHEN check_violation THEN NULL;
  END;

  -- ===== número de empenho do sistema não é sobrescrito: erro e nada gravado
  SELECT count(*) INTO n_imp FROM public.importacoes;
  UPDATE public.fin_empenhos SET numero = '17302.0001.31.00003-0' WHERE numero = 'NE-2031-001';
  r := pg_temp.exec_como(u_fin, 'authenticated', format('SELECT public.importar_empenhos_fip614(2031, %L::jsonb, %L::jsonb, NULL, false)',
         jsonb_build_array(e1 || jsonb_build_object('numero', '17302.0001.31.00003-0')), arq));
  IF r NOT LIKE 'erro:22023%' OR (SELECT count(*) FROM public.importacoes) <> n_imp
     OR (SELECT origem FROM public.fin_empenhos WHERE numero = '17302.0001.31.00003-0') <> 'sistema' THEN
    PERFORM pg_temp.falha('FIN empenhos FIPLAN: empenho do sistema sobrescrito (' || coalesce(r, 'nulo') || ')');
  END IF;

  -- ===== leitura e escrita direta no histórico
  r := pg_temp.valor_como(u_lei, 'authenticated', format('SELECT count(*)::text FROM public.fin_empenho_documentos_fiplan WHERE empenho_id = %L', v_emp));
  IF r IS DISTINCT FROM '4' THEN PERFORM pg_temp.falha('FIN empenhos FIPLAN: quem tem o módulo financeiro não lê o histórico (' || coalesce(r, 'nulo') || ')'); END IF;
  r := pg_temp.valor_como(u_rhp, 'authenticated', 'SELECT count(*)::text FROM public.fin_empenho_documentos_fiplan');
  IF r IS DISTINCT FROM '0' THEN PERFORM pg_temp.falha('FIN empenhos FIPLAN: sem o módulo financeiro lê o histórico (' || coalesce(r, 'nulo') || ')'); END IF;
  r := pg_temp.sql_como(u_fin, 'authenticated', format('INSERT INTO public.fin_empenho_documentos_fiplan (empenho_id, ordem, tipo, numero, data) VALUES (%L, 9, %L, %L, %L)',
         v_emp, 'LIQ', '17302.0001.31.00999-9', '2031-01-01'));
  IF r NOT LIKE 'erro:%' THEN PERFORM pg_temp.falha('FIN empenhos FIPLAN: INSERT direto no histórico aceito (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_fin, 'authenticated', format('UPDATE public.fin_empenho_documentos_fiplan SET historico = %L', 'x'));
  IF r NOT LIKE 'erro:%' AND r <> 'ok:0' THEN PERFORM pg_temp.falha('FIN empenhos FIPLAN: UPDATE direto no histórico aceito (' || r || ')'); END IF;

  PERFORM pg_temp.nota('FIN (empenhos do FIPLAN): permissão, simulação sem gravar, aplicação sem somar na dotação, favorecido pelo código, dotação ambígua e escolhida à mão, dotação pelo IDU, histórico e log, reaplicação sem alteração, origem fixa, empenho do sistema intacto e escrita direta no histórico bloqueada verificados');
END $$;

-- ---------------------------------------------------------------- Compras: PCA (migração 20261028090000) (TRIGGERS LIGADOS)
-- Migração 20261028090000_compras_pca.sql (spec docs/superpowers/specs/2026-10-23-compras-gerador-pca-design.md):
--   * o plano nasce rascunho (as transições são da entrega 4) e o mesmo exercício não entra duas vezes (23505);
--   * só compras.pca.editar grava item (visualizar = 42501); valor_total = quantidade × valor unitário;
--   * material exige PDM e não aceita serviço (23514); a trilha registra criação, inclusão, alteração e exclusão
--     com o autor; pca_carimbar e pca_registrar_historico sem EXECUTE para a API.
DO $$
DECLARE
  u_ed uuid := (SELECT uid FROM persona WHERE nome = 'perm_compras.pca.editar');
  u_vis uuid := (SELECT uid FROM persona WHERE nome = 'perm_compras.pca.visualizar');
  v_acao uuid := (SELECT id_a::uuid FROM semeado WHERE tabela = 'fin_acoes_orcamentarias');
  v_fonte uuid := (SELECT id_a::uuid FROM semeado WHERE tabela = 'fin_fontes_recurso');
  plano uuid; item uuid; r text; ins text; x text;
BEGIN
  PERFORM set_config('request.jwt.claims', '', true);
  FOREACH x IN ARRAY ARRAY['public.pca_carimbar()', 'public.pca_registrar_historico()'] LOOP
    IF has_function_privilege('authenticated', x, 'EXECUTE') OR has_function_privilege('anon', x, 'EXECUTE') THEN
      PERFORM pg_temp.falha('COMPRAS PCA: ' || x || ' executável pela API');
    END IF;
  END LOOP;
  INSERT INTO public.cat_material_pdms (codigo_pdm, nome_pdm, codigo_classe, nome_classe, codigo_grupo, nome_grupo)
  VALUES (900281, 'CARTUCHO CANETA TINTEIRO', 7520, 'ACESSÓRIOS E DISPOSITIVOS PARA ESCRITÓRIO', 75, 'UTENSÍLIOS DE ESCRITÓRIO')
  ON CONFLICT DO NOTHING;
  INSERT INTO public.cat_servicos (codigo_servico, nome_servico, codigo_secao, nome_secao)
  VALUES (907250, 'SERVIÇO DE TESTE', 9, 'SERVIÇOS DA COMUNIDADE') ON CONFLICT DO NOTHING;

  -- plano criado pelo editor, pedindo 'aprovado': nasce rascunho
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_ed, 'role', 'authenticated')::text, true);
  INSERT INTO public.pca_planos (exercicio, situacao) VALUES (2099, 'aprovado') RETURNING id INTO plano;
  IF (SELECT situacao FROM public.pca_planos WHERE id = plano) <> 'rascunho' THEN
    PERFORM pg_temp.falha('COMPRAS PCA: plano não nasce rascunho');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.pca_historico WHERE plano_id = plano AND acao = 'plano_criado' AND feito_por = u_ed) THEN
    PERFORM pg_temp.falha('COMPRAS PCA: criação do plano fora da trilha');
  END IF;
  r := pg_temp.valor_desfeito_como(u_ed, 'authenticated', 'INSERT INTO public.pca_planos (exercicio) VALUES (2099) RETURNING id::text');
  IF r NOT LIKE 'erro:23505:%' THEN PERFORM pg_temp.falha('COMPRAS PCA: exercício repetido aceito (' || r || ')'); END IF;

  ins := format('INSERT INTO public.pca_itens (plano_id, numero_sei, tipo, codigo_pdm, codigo_servico, descricao, unidade_fornecimento, '
             || 'quantidade, valor_unitario, mes_desejado, acao_id, fonte_recurso_id) VALUES (%L, ''00001.000001/2026-01'', %%L, %%s, %%s, '
             || '''Cartucho'', ''UNIDADE'', 3, 10.50, 3, %L, %L) RETURNING valor_total::text', plano, v_acao, v_fonte);
  r := pg_temp.valor_desfeito_como(u_vis, 'authenticated', format(ins, 'material', 900281, 'NULL'));
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('COMPRAS PCA: só visualizar grava item (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_ed, 'authenticated', format(ins, 'material', 900281, 'NULL'));
  IF r IS DISTINCT FROM '31.50' THEN PERFORM pg_temp.falha('COMPRAS PCA: valor_total de 3 × 10,50 (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_ed, 'authenticated', format(ins, 'material', 'NULL', 907250));
  IF r NOT LIKE 'erro:23514:%' THEN PERFORM pg_temp.falha('COMPRAS PCA: material sem PDM aceito (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_ed, 'authenticated', format(ins, 'servico', 'NULL', 907250));
  IF r IS DISTINCT FROM '31.50' THEN PERFORM pg_temp.falha('COMPRAS PCA: serviço recusado (' || r || ')'); END IF;

  -- inclusão, alteração e exclusão na trilha, com o autor
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_ed, 'role', 'authenticated')::text, true);
  EXECUTE replace(format(ins, 'material', 900281, 'NULL'), 'RETURNING valor_total::text', 'RETURNING id') INTO item;
  UPDATE public.pca_itens SET quantidade = 4 WHERE id = item;
  UPDATE public.pca_itens SET situacao = 'excluido' WHERE id = item;
  IF (SELECT array_agg(acao ORDER BY acao) FROM public.pca_historico WHERE item_id = item AND feito_por = u_ed)
     IS DISTINCT FROM ARRAY['item_alterado', 'item_excluido', 'item_incluido'] THEN
    PERFORM pg_temp.falha('COMPRAS PCA: trilha do item incompleta');
  END IF;
  IF (SELECT updated_by FROM public.pca_itens WHERE id = item) IS DISTINCT FROM u_ed THEN
    PERFORM pg_temp.falha('COMPRAS PCA: updated_by não é quem alterou');
  END IF;
  -- classificadores: visualizar lê; sem a permissão = 42501
  r := pg_temp.valor_desfeito_como(u_vis, 'authenticated', 'SELECT jsonb_typeof(public.pca_classificadores(2099)->''acoes'')');
  IF r IS DISTINCT FROM 'array' THEN PERFORM pg_temp.falha('COMPRAS PCA: visualizar não lê os classificadores (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como((SELECT uid FROM persona WHERE nome = 'mod_compras'), 'authenticated', 'SELECT public.pca_classificadores(2099)::text');
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('COMPRAS PCA: módulo sem permissão lê os classificadores (' || r || ')'); END IF;
  -- QDD: visualizar = 42501; sem QDD = 22023; com QDD troca os tetos digitados
  r := pg_temp.valor_desfeito_como(u_vis, 'authenticated', format('SELECT public.pca_usar_qdd(%L)::text', plano));
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('COMPRAS PCA: visualizar troca os tetos (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_ed, 'authenticated', format('SELECT public.pca_usar_qdd(%L)::text', plano));
  IF r NOT LIKE 'erro:22023:%' THEN PERFORM pg_temp.falha('COMPRAS PCA: troca sem QDD aceita (' || r || ')'); END IF;
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO public.pca_tetos (plano_id, acao_id, fonte_recurso_id, valor_previsto) VALUES (plano, v_acao, v_fonte, 5);
  SET LOCAL session_replication_role = replica;
  PERFORM pg_temp.seed_row('fin_dotacoes', jsonb_build_object('id', 'f5000000-0000-0000-0000-000000000001', 'exercicio', 2099,
    'acao_id', v_acao, 'fonte_recurso_id', v_fonte, 'valor_inicial', 1000, 'valor_suplementado', 200, 'valor_reduzido', 0, 'ativo', true,
    'codigo_dotacao', 'PCA-TESTE-1'));
  PERFORM pg_temp.seed_row('fin_dotacoes', jsonb_build_object('id', 'f5000000-0000-0000-0000-000000000002', 'exercicio', 2099,
    'acao_id', v_acao, 'fonte_recurso_id', v_fonte, 'valor_inicial', 300, 'valor_suplementado', 0, 'valor_reduzido', 0, 'ativo', true,
    'codigo_dotacao', 'PCA-TESTE-2'));
  SET LOCAL session_replication_role = origin;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_ed, 'role', 'authenticated')::text, true);
  r := public.pca_usar_qdd(plano)::text;
  r := r || '|' || (SELECT string_agg(valor_previsto::text || ':' || origem, ',') FROM public.pca_tetos WHERE plano_id = plano);
  IF r IS DISTINCT FROM '1|1500.00:qdd' THEN PERFORM pg_temp.falha('COMPRAS PCA: troca pelo QDD (' || r || ')'); END IF;

  PERFORM set_config('request.jwt.claims', '', true);
  PERFORM pg_temp.nota('COMPRAS PCA: classificadores, troca pelo QDD, plano nasce rascunho, exercício único, gravação só com compras.pca.editar, valor_total, item do catálogo e trilha verificados');
END $$;

-- ---------------------------------------------------------------- Compras: processos de contratação (migração 20261029090000) (TRIGGERS LIGADOS)
-- Migração 20261029090000_compras_processos_andamento.sql (spec docs/superpowers/specs/2026-10-23-compras-processos-reserva-natureza-design.md):
--   * nº SEI gravado sem espaço nas pontas; só compras.processos.editar grava andamento (visualizar = 42501);
--   * a movimentação mais recente vira etapa/setor/situação do processo e uma mais antiga não; ninguém apaga andamento;
--   * importar_processos_planilha: visualizar = 42501, simulação não grava, reimportar não duplica;
--   * processo_empenhos liga pelo nº SEI e exige a permissão de ver processos; gatilhos sem EXECUTE para a API.
DO $$
DECLARE
  u_ed uuid := (SELECT uid FROM persona WHERE nome = 'perm_compras.processos.editar');
  u_vis uuid := (SELECT uid FROM persona WHERE nome = 'perm_compras.processos.visualizar');
  u_mod uuid := (SELECT uid FROM persona WHERE nome = 'mod_compras');
  proc uuid; r text; x text; linhas jsonb;
BEGIN
  PERFORM set_config('request.jwt.claims', '', true);
  FOREACH x IN ARRAY ARRAY['public.processo_andamento_no_processo()', 'public.processo_andamento_carimbar()',
                           'public.processo_licitatorio_normalizar()'] LOOP
    IF has_function_privilege('authenticated', x, 'EXECUTE') OR has_function_privilege('anon', x, 'EXECUTE') THEN
      PERFORM pg_temp.falha('COMPRAS PROCESSOS: ' || x || ' executável pela API');
    END IF;
  END LOOP;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_ed, 'role', 'authenticated')::text, true);
  INSERT INTO public.processos_licitatorios (numero_processo, ano, objeto)
  VALUES (' 99999.000001/2099.01 ', 2099, 'Objeto de teste') RETURNING id INTO proc;
  IF (SELECT numero_processo FROM public.processos_licitatorios WHERE id = proc) <> '99999.000001/2099.01' THEN
    PERFORM pg_temp.falha('COMPRAS PROCESSOS: nº SEI gravado com espaço');
  END IF;

  r := pg_temp.valor_desfeito_como(u_vis, 'authenticated', format(
    'INSERT INTO public.processo_andamentos (processo_id, data, etapa, situacao) VALUES (%L, ''2099-03-01'', ''etp'', ''x'') RETURNING id::text', proc));
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('COMPRAS PROCESSOS: só visualizar grava andamento (' || r || ')'); END IF;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_ed, 'role', 'authenticated')::text, true);
  INSERT INTO public.processo_andamentos (processo_id, data, etapa, setor, situacao)
  VALUES (proc, '2099-03-01', 'etp', ' IDJUV/PRESI/DIRAF/EPC ', 'Elaborando o ETP');
  INSERT INTO public.processo_andamentos (processo_id, data, etapa, setor, situacao)
  VALUES (proc, '2099-02-01', 'dfd', 'IDJUV/PRESI', 'DFD recebido');
  r := (SELECT etapa || '|' || setor_atual || '|' || situacao_atual || '|' || atualizado_em::text
          FROM public.processos_licitatorios WHERE id = proc);
  IF r IS DISTINCT FROM 'etp|IDJUV/PRESI/DIRAF/EPC|Elaborando o ETP|2099-03-01' THEN
    PERFORM pg_temp.falha('COMPRAS PROCESSOS: estado atual não é a movimentação mais recente (' || COALESCE(r, 'nulo') || ')');
  END IF;
  IF (SELECT created_by FROM public.processo_andamentos WHERE processo_id = proc AND etapa = 'dfd') IS DISTINCT FROM u_ed THEN
    PERFORM pg_temp.falha('COMPRAS PROCESSOS: autoria do andamento');
  END IF;

  r := pg_temp.valor_desfeito_como(u_ed, 'authenticated', format(
    'WITH d AS (DELETE FROM public.processo_andamentos WHERE processo_id = %L RETURNING 1) SELECT count(*)::text FROM d', proc));
  IF r IS DISTINCT FROM '0' THEN PERFORM pg_temp.falha('COMPRAS PROCESSOS: andamento apagado pela API (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_mod, 'authenticated', format(
    'SELECT count(*)::text FROM public.processo_andamentos WHERE processo_id = %L', proc));
  IF r IS DISTINCT FROM '0' THEN PERFORM pg_temp.falha('COMPRAS PROCESSOS: módulo sem permissão lê andamento (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_vis, 'authenticated', format(
    'SELECT count(*)::text FROM public.processo_andamentos WHERE processo_id = %L', proc));
  IF r IS DISTINCT FROM '2' THEN PERFORM pg_temp.falha('COMPRAS PROCESSOS: visualizar não lê andamento (' || r || ')'); END IF;

  -- empenho do FIP 614 com o nº SEI com espaço casa com o processo
  PERFORM set_config('request.jwt.claims', '', true);
  SET LOCAL session_replication_role = replica;
  PERFORM pg_temp.seed_row('fin_empenhos', jsonb_build_object('id', 'f6000000-0000-0000-0000-000000000001', 'numero', '2099NE00001',
    'exercicio', 2099, 'valor_empenhado', 1000, 'objeto', 'Teste', 'processo_sei', ' 99999.000001/2099.01'));
  SET LOCAL session_replication_role = origin;
  r := pg_temp.valor_desfeito_como(u_vis, 'authenticated', format(
    'SELECT string_agg(numero || '':'' || valor_empenhado::text, '','') FROM public.processo_empenhos(%L)', proc));
  IF r IS DISTINCT FROM '2099NE00001:1000.00' THEN PERFORM pg_temp.falha('COMPRAS PROCESSOS: empenho ligado pelo nº SEI (' || COALESCE(r, 'nulo') || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_mod, 'authenticated', 'SELECT count(*)::text FROM public.processo_empenhos()');
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('COMPRAS PROCESSOS: módulo sem permissão vê empenhos (' || r || ')'); END IF;

  -- importação: visualizar recusa; simulação não grava; aplicar duas vezes não duplica
  linhas := jsonb_build_array(
    jsonb_build_object('indice', 0, 'numero_processo', '99999.000002/2099.02', 'ano', 2099, 'objeto', 'Água e esgoto',
      'objeto_resumido', 'Água', 'modalidade', 'inexigibilidade', 'etapa', 'etp', 'setor_atual', 'IDJUV/PRESI/DIRAF/EPC',
      'situacao_atual', 'Em instrução', 'atualizado_em', '2099-05-18', 'valor_estimado', 562114.42,
      'andamentos', jsonb_build_array(jsonb_build_object('data', '2099-05-18', 'etapa', 'etp', 'setor', 'IDJUV/PRESI/DIRAF/EPC', 'situacao', 'Em instrução'))),
    jsonb_build_object('indice', 1, 'numero_processo', ' 99999.000001/2099.01', 'ano', 2099, 'objeto', 'Objeto de teste',
      'valor_estimado', 100, 'andamentos', jsonb_build_array(jsonb_build_object('data', NULL, 'etapa', 'cotacao', 'setor', NULL, 'situacao', 'Cotação'))));
  r := pg_temp.valor_desfeito_como(u_vis, 'authenticated', format(
    'SELECT public.importar_processos_planilha(%L::jsonb, ''{}''::jsonb, true)::text', linhas));
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('COMPRAS PROCESSOS: visualizar importa (' || r || ')'); END IF;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_ed, 'role', 'authenticated')::text, true);
  r := public.importar_processos_planilha(linhas, '{}'::jsonb, true)->>'totais';
  IF r IS DISTINCT FROM '{"inserir": 1, "atualizar": 1, "sem_alteracao": 0}'
     OR EXISTS (SELECT 1 FROM public.processos_licitatorios WHERE numero_processo = '99999.000002/2099.02') THEN
    PERFORM pg_temp.falha('COMPRAS PROCESSOS: simulação (' || COALESCE(r, 'nulo') || ')');
  END IF;
  x := '{"nome": "processos.xlsx", "sha256": "' || repeat('a', 64) || '", "tamanho": "100"}';
  r := public.importar_processos_planilha(linhas, x::jsonb, false)->>'totais';
  r := r || '|' || (public.importar_processos_planilha(linhas, x::jsonb, false)->>'totais');
  IF r IS DISTINCT FROM '{"inserir": 1, "atualizar": 1, "sem_alteracao": 0}|{"inserir": 0, "atualizar": 0, "sem_alteracao": 2}' THEN
    PERFORM pg_temp.falha('COMPRAS PROCESSOS: aplicar duas vezes (' || COALESCE(r, 'nulo') || ')');
  END IF;
  r := (SELECT etapa || '|' || modalidade::text || '|' || valor_estimado::text || '|' || (SELECT count(*) FROM public.processo_andamentos a WHERE a.processo_id = p.id)::text
          FROM public.processos_licitatorios p WHERE numero_processo = '99999.000002/2099.02');
  IF r IS DISTINCT FROM 'etp|inexigibilidade|562114.42|1' THEN PERFORM pg_temp.falha('COMPRAS PROCESSOS: processo importado (' || COALESCE(r, 'nulo') || ')'); END IF;
  r := (SELECT p.valor_estimado::text || '|' || p.etapa || '|' || p.atualizado_em::text || '|' || count(*) FILTER (WHERE NOT a.data_informada)::text
          FROM public.processos_licitatorios p JOIN public.processo_andamentos a ON a.processo_id = p.id
         WHERE p.id = proc GROUP BY p.valor_estimado, p.etapa, p.atualizado_em);
  IF r IS DISTINCT FROM '100.00|etp|2099-03-01|1' THEN PERFORM pg_temp.falha('COMPRAS PROCESSOS: completar processo existente (' || COALESCE(r, 'nulo') || ')'); END IF;

  PERFORM set_config('request.jwt.claims', '', true);
  PERFORM pg_temp.nota('COMPRAS PROCESSOS: nº SEI sem espaço, andamento só com compras.processos.editar, estado atual pela movimentação mais recente, andamento não se apaga, empenhos pelo nº SEI e importação (simulação, aplicação e reimportação) verificados');
END $$;

-- ---------------------------------------------------------------- Contratos: passagens aéreas (migração 20261031090000) (TRIGGERS LIGADOS)
-- Migração 20261031090000_contratos_passagens.sql (spec docs/superpowers/specs/2026-10-24-contratos-passagens-aereas-design.md):
--   * só contratos.passagens.editar grava (visualizar = 42501); nº SEI e CPF únicos (23505);
--   * o banco copia o nome do solicitante e do passageiro (servidor ou beneficiário);
--   * aprovado sem documento SEI e emitido sem localizador = 23514; valor_emissao = tarifa + taxas − desconto;
--   * trecho com localizador não se apaga (42501); trilha da criação e das situações com o autor;
--   * passagem_buscar_servidores e passagem_viagens_servidor só com editar (% e _ do termo são texto);
--   * trilha lida só com a permissão de passagens; gatilhos sem EXECUTE para a API.
DO $$
DECLARE
  u_ed uuid := (SELECT uid FROM persona WHERE nome = 'perm_contratos.passagens.editar');
  u_vis uuid := (SELECT uid FROM persona WHERE nome = 'perm_contratos.passagens.visualizar');
  srv uuid := (SELECT id_a::uuid FROM semeado WHERE tabela = 'servidores');
  srv_nome text;
  benef uuid; pedido uuid; pass_b uuid; pass_s uuid; trecho uuid; r text; x text;
BEGIN
  PERFORM set_config('request.jwt.claims', '', true);
  FOREACH x IN ARRAY ARRAY['public.passagem_carimbar()', 'public.passagem_copiar_nome()',
                           'public.passagem_proteger_emitido()', 'public.passagem_registrar_historico()',
                           'public.passagem_propagar_nome_beneficiario()'] LOOP
    IF has_function_privilege('authenticated', x, 'EXECUTE') OR has_function_privilege('anon', x, 'EXECUTE') THEN
      PERFORM pg_temp.falha('PASSAGENS: ' || x || ' executável pela API');
    END IF;
  END LOOP;
  SELECT nome_completo INTO srv_nome FROM public.servidores WHERE id = srv;

  r := pg_temp.valor_desfeito_como(u_vis, 'authenticated',
    'INSERT INTO public.passagem_beneficiarios (nome, cpf) VALUES (''Atleta Teste'', ''52998224725'') RETURNING id::text');
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('PASSAGENS: só visualizar grava beneficiário (' || r || ')'); END IF;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_ed, 'role', 'authenticated')::text, true);
  INSERT INTO public.passagem_beneficiarios (nome, cpf) VALUES ('Atleta Teste', '52998224725') RETURNING id INTO benef;
  r := pg_temp.valor_desfeito_como(u_ed, 'authenticated',
    'INSERT INTO public.passagem_beneficiarios (nome, cpf) VALUES (''Outro'', ''52998224725'') RETURNING id::text');
  IF r NOT LIKE 'erro:23505:%' THEN PERFORM pg_temp.falha('PASSAGENS: CPF repetido aceito (' || r || ')'); END IF;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_ed, 'role', 'authenticated')::text, true);
  INSERT INTO public.passagem_pedidos (numero_sei, solicitante_tipo, solicitante_beneficiario_id, finalidade)
  VALUES ('00001.000099/2099-01', 'beneficiario', benef, 'Campeonato de teste') RETURNING id INTO pedido;
  IF (SELECT solicitante_nome FROM public.passagem_pedidos WHERE id = pedido) IS DISTINCT FROM 'Atleta Teste' THEN
    PERFORM pg_temp.falha('PASSAGENS: nome do solicitante não copiado');
  END IF;
  r := pg_temp.valor_desfeito_como(u_ed, 'authenticated', format(
    'INSERT INTO public.passagem_pedidos (numero_sei, solicitante_tipo, solicitante_nome, finalidade) '
    || 'VALUES (''00001.000099/2099-01'', ''instituicao'', ''Federação'', ''Outro evento'') RETURNING id::text'));
  IF r NOT LIKE 'erro:23505:%' THEN PERFORM pg_temp.falha('PASSAGENS: nº SEI repetido aceito (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_ed, 'authenticated', format(
    'UPDATE public.passagem_pedidos SET situacao = ''aprovado'' WHERE id = %L RETURNING situacao', pedido));
  IF r NOT LIKE 'erro:23514:%' THEN PERFORM pg_temp.falha('PASSAGENS: aprovado sem documento SEI aceito (' || r || ')'); END IF;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_ed, 'role', 'authenticated')::text, true);
  INSERT INTO public.passagem_passageiros (pedido_id, beneficiario_id) VALUES (pedido, benef) RETURNING id INTO pass_b;
  INSERT INTO public.passagem_passageiros (pedido_id, servidor_id) VALUES (pedido, srv) RETURNING id INTO pass_s;
  IF (SELECT nome FROM public.passagem_passageiros WHERE id = pass_s) IS DISTINCT FROM srv_nome
     OR (SELECT nome FROM public.passagem_passageiros WHERE id = pass_b) IS DISTINCT FROM 'Atleta Teste' THEN
    PERFORM pg_temp.falha('PASSAGENS: nome do passageiro não copiado');
  END IF;
  INSERT INTO public.passagem_trechos (passageiro_id, origem, destino, data_voo) VALUES (pass_b, 'BVB', 'BSB', DATE '2099-03-01')
  RETURNING id INTO trecho;
  r := pg_temp.valor_desfeito_como(u_ed, 'authenticated', format(
    'UPDATE public.passagem_trechos SET situacao = ''emitido'' WHERE id = %L RETURNING situacao', trecho));
  IF r NOT LIKE 'erro:23514:%' THEN PERFORM pg_temp.falha('PASSAGENS: emitido sem localizador aceito (' || r || ')'); END IF;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_ed, 'role', 'authenticated')::text, true);
  UPDATE public.passagem_pedidos SET situacao = 'aprovado', aprovacao_documento_sei = '12345678', aprovacao_data = DATE '2099-02-01'
   WHERE id = pedido;
  UPDATE public.passagem_trechos SET situacao = 'emitido', localizador = 'ABC123', data_emissao = DATE '2099-02-02',
         valor_tarifa = 1000, valor_taxa_embarque = 50.50, valor_taxa_servico = 20, valor_desconto = 10
   WHERE id = trecho;
  IF (SELECT valor_emissao FROM public.passagem_trechos WHERE id = trecho) IS DISTINCT FROM 1060.50 THEN
    PERFORM pg_temp.falha('PASSAGENS: valor_emissao de 1000 + 50,50 + 20 − 10');
  END IF;
  r := pg_temp.valor_desfeito_como(u_ed, 'authenticated', format(
    'DELETE FROM public.passagem_trechos WHERE id = %L RETURNING id::text', trecho));
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('PASSAGENS: trecho emitido apagado (' || r || ')'); END IF;
  IF (SELECT array_agg(acao ORDER BY acao) FROM public.passagem_historico WHERE pedido_id = pedido AND feito_por = u_ed)
     IS DISTINCT FROM ARRAY['pedido_criado', 'pedido_situacao', 'trecho_situacao', 'trecho_situacao'] THEN
    PERFORM pg_temp.falha('PASSAGENS: trilha do pedido incompleta');
  END IF;

  -- busca de servidores e viagens do RH: só quem edita; visualizar e módulo sem a permissão = 42501; curinga não lista
  r := pg_temp.valor_desfeito_como(u_ed, 'authenticated',
    format('SELECT count(*)::text FROM public.passagem_buscar_servidores(%L)', left(srv_nome, 5)));
  IF r IS NULL OR r !~ '^[1-9]' THEN PERFORM pg_temp.falha('PASSAGENS: editar não acha o servidor (' || coalesce(r, 'nulo') || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_ed, 'authenticated',
    'SELECT count(*)::text FROM public.passagem_buscar_servidores(''%%%_'')');
  IF r IS DISTINCT FROM '0' THEN PERFORM pg_temp.falha('PASSAGENS: busca com curinga listou servidores (' || coalesce(r, 'nulo') || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_ed, 'authenticated',
    format('SELECT count(*)::text FROM public.passagem_buscar_servidores(%L)', '%' || substr(srv_nome, 2, 3) || '_%'));
  IF r IS DISTINCT FROM '0' THEN PERFORM pg_temp.falha('PASSAGENS: % e _ do termo valeram como curinga (' || coalesce(r, 'nulo') || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_vis, 'authenticated',
    format('SELECT count(*)::text FROM public.passagem_buscar_servidores(%L)', left(srv_nome, 5)));
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('PASSAGENS: só visualizar busca servidores (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_vis, 'authenticated',
    format('SELECT count(*)::text FROM public.passagem_viagens_servidor(%L)', srv));
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('PASSAGENS: só visualizar lista viagens do servidor (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como((SELECT uid FROM persona WHERE nome = 'mod_contratos'), 'authenticated',
    'SELECT count(*)::text FROM public.passagem_buscar_servidores(''abc'')');
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('PASSAGENS: módulo sem permissão busca servidores (' || r || ')'); END IF;

  -- trilha: visualizar lê; o módulo sem a permissão de passagens não lê
  r := pg_temp.valor_desfeito_como(u_vis, 'authenticated',
    format('SELECT count(*)::text FROM public.passagem_historico WHERE pedido_id = %L', pedido));
  IF r IS NULL OR r !~ '^[1-9]' THEN PERFORM pg_temp.falha('PASSAGENS: visualizar não lê a trilha (' || coalesce(r, 'nulo') || ')'); END IF;
  r := pg_temp.valor_desfeito_como((SELECT uid FROM persona WHERE nome = 'mod_contratos'), 'authenticated',
    format('SELECT count(*)::text FROM public.passagem_historico WHERE pedido_id = %L', pedido));
  IF r IS DISTINCT FROM '0' THEN PERFORM pg_temp.falha('PASSAGENS: módulo sem a permissão lê a trilha (' || coalesce(r, 'nulo') || ')'); END IF;

  -- nome do beneficiário corrigido chega ao passageiro e ao solicitante
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_ed, 'role', 'authenticated')::text, true);
  UPDATE public.passagem_beneficiarios SET nome = 'Atleta Teste Corrigido' WHERE id = benef;
  IF (SELECT nome FROM public.passagem_passageiros WHERE id = pass_b) IS DISTINCT FROM 'Atleta Teste Corrigido'
     OR (SELECT solicitante_nome FROM public.passagem_pedidos WHERE id = pedido) IS DISTINCT FROM 'Atleta Teste Corrigido' THEN
    PERFORM pg_temp.falha('PASSAGENS: nome corrigido do beneficiário não chegou ao pedido');
  END IF;

  -- passageiro ou instituição inexistente: o gatilho recusa (não serve de leitura indireta por id)
  r := pg_temp.valor_desfeito_como(u_ed, 'authenticated', format(
    'INSERT INTO public.passagem_passageiros (pedido_id, servidor_id) VALUES (%L, gen_random_uuid()) RETURNING id::text', pedido));
  IF r NOT LIKE 'erro:%' THEN PERFORM pg_temp.falha('PASSAGENS: passageiro com servidor inexistente aceito (' || r || ')'); END IF;

  PERFORM set_config('request.jwt.claims', '', true);
  PERFORM pg_temp.nota('PASSAGENS: gravação só com contratos.passagens.editar, nº SEI e CPF únicos, nomes copiados, aprovação e emissão exigidas, valor da emissão, trecho emitido protegido, trilha só com a permissão, busca de servidores e viagens só para quem edita e sem curinga verificados');
END $$;

-- ---------------------------------------------------------------- Contratos: passagens, prestação de contas (migração 20261101090000) (TRIGGERS LIGADOS)
-- Migração 20261101090000_contratos_passagens_prestacao.sql (plano docs/superpowers/plans/2026-10-25-contratos-passagens-entrega2.md):
--   * pedido ou passageiro dispensado sem motivo = 23514; responsável da delegação de outro pedido = 22023;
--   * anexo: caminho fora do pedido = 23514, passageiro de outro pedido = 22023, visualizar não grava (42501) e o módulo
--     sem a permissão não lê;
--   * bucket passagens: privado; editar envia só para pedido existente; visualizar lê e não envia; módulo sem a permissão não lê;
--   * passagem_relatorio_rh só com a permissão; trilha prestacao_passageiro com o autor; gatilhos sem EXECUTE para a API.
DO $$
DECLARE
  u_ed uuid := (SELECT uid FROM persona WHERE nome = 'perm_contratos.passagens.editar');
  u_vis uuid := (SELECT uid FROM persona WHERE nome = 'perm_contratos.passagens.visualizar');
  u_mod uuid := (SELECT uid FROM persona WHERE nome = 'mod_contratos');
  u_anon uuid := '00000000-0000-0000-0000-000000000000';
  pedido uuid := (SELECT id FROM public.passagem_pedidos WHERE numero_sei = '00001.000099/2099-01');
  outro uuid; pass_b uuid; pass_outro uuid; r text; x text;
BEGIN
  PERFORM set_config('request.jwt.claims', '', true);
  FOREACH x IN ARRAY ARRAY['public.passagem_conferir_responsavel()', 'public.passagem_conferir_anexo()',
                           'public.passagem_registrar_prestacao()'] LOOP
    IF has_function_privilege('authenticated', x, 'EXECUTE') OR has_function_privilege('anon', x, 'EXECUTE') THEN
      PERFORM pg_temp.falha('PASSAGENS PRESTAÇÃO: ' || x || ' executável pela API');
    END IF;
  END LOOP;
  IF has_function_privilege('anon', 'public.passagem_relatorio_rh(uuid[])', 'EXECUTE') THEN
    PERFORM pg_temp.falha('PASSAGENS PRESTAÇÃO: passagem_relatorio_rh executável por anon');
  END IF;
  IF pedido IS NULL THEN PERFORM pg_temp.falha('PASSAGENS PRESTAÇÃO: pedido do bloco anterior ausente'); RETURN; END IF;
  SELECT id INTO pass_b FROM public.passagem_passageiros WHERE pedido_id = pedido AND beneficiario_id IS NOT NULL;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_ed, 'role', 'authenticated')::text, true);
  INSERT INTO public.passagem_pedidos (numero_sei, solicitante_tipo, solicitante_nome, finalidade)
  VALUES ('00001.000098/2099-01', 'instituicao', 'Federação Teste', 'Outro evento') RETURNING id INTO outro;
  INSERT INTO public.passagem_passageiros (pedido_id, servidor_id)
  VALUES (outro, (SELECT id_a::uuid FROM semeado WHERE tabela = 'servidores')) RETURNING id INTO pass_outro;

  -- dispensa sem motivo: o banco recusa (pedido e passageiro)
  r := pg_temp.valor_desfeito_como(u_ed, 'authenticated', format(
    'UPDATE public.passagem_pedidos SET prestacao_contas = ''dispensado'', prestacao_dispensa_motivo = '' '' WHERE id = %L RETURNING id::text', pedido));
  IF r NOT LIKE 'erro:23514:%' THEN PERFORM pg_temp.falha('PASSAGENS PRESTAÇÃO: pedido dispensado sem motivo aceito (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_ed, 'authenticated', format(
    'UPDATE public.passagem_passageiros SET prestacao_dispensada = true WHERE id = %L RETURNING id::text', pass_b));
  IF r NOT LIKE 'erro:23514:%' THEN PERFORM pg_temp.falha('PASSAGENS PRESTAÇÃO: passageiro dispensado sem motivo aceito (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_ed, 'authenticated', format(
    'UPDATE public.passagem_pedidos SET responsavel_passageiro_id = %L WHERE id = %L RETURNING id::text', pass_outro, pedido));
  IF r NOT LIKE 'erro:22023:%' THEN PERFORM pg_temp.falha('PASSAGENS PRESTAÇÃO: responsável de outro pedido aceito (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_vis, 'authenticated', format(
    'UPDATE public.passagem_passageiros SET embarque_entregue_em = DATE ''2099-03-02'' WHERE id = %L RETURNING id::text', pass_b));
  IF r NOT IN ('vazio') AND r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('PASSAGENS PRESTAÇÃO: só visualizar registra entrega (' || r || ')'); END IF;

  -- entrega registrada por quem edita: trilha prestacao_passageiro com o autor
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_ed, 'role', 'authenticated')::text, true);
  UPDATE public.passagem_passageiros SET embarque_entregue_em = DATE '2099-03-02' WHERE id = pass_b;
  IF NOT EXISTS (SELECT 1 FROM public.passagem_historico WHERE pedido_id = pedido AND acao = 'prestacao_passageiro' AND feito_por = u_ed) THEN
    PERFORM pg_temp.falha('PASSAGENS PRESTAÇÃO: entrega do cartão de embarque fora da trilha');
  END IF;
  UPDATE public.passagem_pedidos SET prestacao_contas = 'evento', responsavel_passageiro_id = pass_b WHERE id = pedido;
  IF NOT EXISTS (SELECT 1 FROM public.passagem_historico WHERE pedido_id = pedido AND acao = 'prestacao_pedido' AND feito_por = u_ed) THEN
    PERFORM pg_temp.falha('PASSAGENS PRESTAÇÃO: modo da prestação fora da trilha');
  END IF;

  -- anexos: caminho do pedido, passageiro do mesmo pedido, só editar grava, módulo sem a permissão não lê
  r := pg_temp.valor_desfeito_como(u_ed, 'authenticated', format(
    'INSERT INTO public.passagem_anexos (pedido_id, tipo, caminho, nome_arquivo) VALUES (%L, ''relatorio'', %L, ''r.pdf'') RETURNING id::text',
    pedido, outro || '/pedido/r.pdf'));
  IF r NOT LIKE 'erro:23514:%' THEN PERFORM pg_temp.falha('PASSAGENS PRESTAÇÃO: anexo com caminho de outro pedido aceito (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_ed, 'authenticated', format(
    'INSERT INTO public.passagem_anexos (pedido_id, passageiro_id, tipo, caminho, nome_arquivo) VALUES (%L, %L, ''cartao_embarque'', %L, ''c.pdf'') RETURNING id::text',
    pedido, pass_outro, pedido || '/x/c.pdf'));
  IF r NOT LIKE 'erro:22023:%' THEN PERFORM pg_temp.falha('PASSAGENS PRESTAÇÃO: anexo de passageiro de outro pedido aceito (' || r || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_vis, 'authenticated', format(
    'INSERT INTO public.passagem_anexos (pedido_id, tipo, caminho, nome_arquivo) VALUES (%L, ''relatorio'', %L, ''r.pdf'') RETURNING id::text',
    pedido, pedido || '/pedido/r.pdf'));
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('PASSAGENS PRESTAÇÃO: só visualizar grava anexo (' || r || ')'); END IF;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', u_ed, 'role', 'authenticated')::text, true);
  INSERT INTO public.passagem_anexos (pedido_id, passageiro_id, tipo, caminho, nome_arquivo)
  VALUES (pedido, pass_b, 'cartao_embarque', pedido || '/' || pass_b || '/c.pdf', 'c.pdf');
  r := pg_temp.valor_desfeito_como(u_vis, 'authenticated',
    format('SELECT count(*)::text FROM public.passagem_anexos WHERE pedido_id = %L', pedido));
  IF r IS DISTINCT FROM '1' THEN PERFORM pg_temp.falha('PASSAGENS PRESTAÇÃO: visualizar não lê o anexo (' || coalesce(r, 'nulo') || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_mod, 'authenticated',
    format('SELECT count(*)::text FROM public.passagem_anexos WHERE pedido_id = %L', pedido));
  IF r IS DISTINCT FROM '0' THEN PERFORM pg_temp.falha('PASSAGENS PRESTAÇÃO: módulo sem a permissão lê anexo (' || coalesce(r, 'nulo') || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_vis, 'authenticated', format(
    'DELETE FROM public.passagem_anexos WHERE pedido_id = %L RETURNING id::text', pedido));
  IF r IS DISTINCT FROM 'vazio' AND r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('PASSAGENS PRESTAÇÃO: só visualizar apaga anexo (' || r || ')'); END IF;

  -- bucket privado passagens
  IF (SELECT NOT public AND file_size_limit = 10485760 FROM storage.buckets WHERE id = 'passagens') IS NOT TRUE THEN
    PERFORM pg_temp.falha('PASSAGENS PRESTAÇÃO: bucket passagens ausente, público ou sem o limite de 10 MB');
  END IF;
  IF pg_temp.ins_obj(u_ed, 'authenticated', 'passagens', pedido || '/pedido/r.pdf') <> 'passou' THEN
    PERFORM pg_temp.falha('PASSAGENS PRESTAÇÃO: editar não envia arquivo do pedido');
  END IF;
  IF pg_temp.ins_obj(u_ed, 'authenticated', 'passagens', gen_random_uuid() || '/pedido/r.pdf') <> 'negado' THEN
    PERFORM pg_temp.falha('PASSAGENS PRESTAÇÃO: editar envia arquivo de pedido inexistente');
  END IF;
  IF pg_temp.ins_obj(u_ed, 'authenticated', 'passagens', 'solto.pdf') <> 'negado' THEN
    PERFORM pg_temp.falha('PASSAGENS PRESTAÇÃO: editar envia arquivo fora da pasta de um pedido');
  END IF;
  IF pg_temp.ins_obj(u_vis, 'authenticated', 'passagens', pedido || '/pedido/r.pdf') <> 'negado' THEN
    PERFORM pg_temp.falha('PASSAGENS PRESTAÇÃO: só visualizar envia arquivo');
  END IF;
  IF pg_temp.ins_obj(u_mod, 'authenticated', 'passagens', pedido || '/pedido/r.pdf') <> 'negado' THEN
    PERFORM pg_temp.falha('PASSAGENS PRESTAÇÃO: módulo sem a permissão envia arquivo');
  END IF;
  PERFORM set_config('request.jwt.claims', '', true);
  INSERT INTO storage.objects (bucket_id, name) VALUES ('passagens', pedido || '/' || pass_b || '/c.pdf');
  IF pg_temp.sel_obj(u_vis, 'authenticated', 'passagens') <> 1 THEN PERFORM pg_temp.falha('PASSAGENS PRESTAÇÃO: visualizar não lê o arquivo'); END IF;
  IF pg_temp.sel_obj(u_mod, 'authenticated', 'passagens') <> 0 THEN PERFORM pg_temp.falha('PASSAGENS PRESTAÇÃO: módulo sem a permissão lê o arquivo'); END IF;
  IF pg_temp.sel_obj(u_anon, 'anon', 'passagens') > 0 THEN PERFORM pg_temp.falha('PASSAGENS PRESTAÇÃO: anon lê o arquivo'); END IF;
  r := pg_temp.sql_como(u_vis, 'authenticated', 'DELETE FROM storage.objects WHERE bucket_id = ''passagens''');
  IF r IS DISTINCT FROM 'ok:0' THEN PERFORM pg_temp.falha('PASSAGENS PRESTAÇÃO: só visualizar apaga arquivo (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_ed, 'authenticated', 'UPDATE storage.objects SET name = name WHERE bucket_id = ''passagens''');
  IF r IS DISTINCT FROM 'ok:0' THEN PERFORM pg_temp.falha('PASSAGENS PRESTAÇÃO: arquivo alterado sem policy de UPDATE (' || r || ')'); END IF;
  r := pg_temp.sql_como(u_ed, 'authenticated', 'DELETE FROM storage.objects WHERE bucket_id = ''passagens''');
  IF r IS DISTINCT FROM 'ok:1' THEN PERFORM pg_temp.falha('PASSAGENS PRESTAÇÃO: editar não apaga o arquivo (' || r || ')'); END IF;
  DELETE FROM storage.objects WHERE bucket_id = 'passagens';

  -- situação do relatório do RH: quem lê passagens chama; módulo sem a permissão = 42501
  r := pg_temp.valor_desfeito_como(u_vis, 'authenticated',
    format('SELECT count(*)::text FROM public.passagem_relatorio_rh(ARRAY[%L]::uuid[])', pass_b));
  IF r IS NULL OR r LIKE 'erro:%' THEN PERFORM pg_temp.falha('PASSAGENS PRESTAÇÃO: visualizar não consulta o relatório do RH (' || coalesce(r, 'nulo') || ')'); END IF;
  r := pg_temp.valor_desfeito_como(u_mod, 'authenticated',
    format('SELECT count(*)::text FROM public.passagem_relatorio_rh(ARRAY[%L]::uuid[])', pass_b));
  IF r NOT LIKE 'erro:42501:%' THEN PERFORM pg_temp.falha('PASSAGENS PRESTAÇÃO: módulo sem a permissão consulta o relatório do RH (' || r || ')'); END IF;

  PERFORM set_config('request.jwt.claims', '', true);
  PERFORM pg_temp.nota('PASSAGENS PRESTAÇÃO: dispensa com motivo, responsável do mesmo pedido, trilha da prestação, anexos (caminho, passageiro, só editar grava, só a permissão lê), bucket privado passagens e relatório do RH só com a permissão verificados');
END $$;

-- ---------------------------------------------------------------- resumo
SELECT nivel, msg FROM resultado ORDER BY nivel DESC, msg;
\set QUIET off
DO $$
DECLARE f int; BEGIN
  SELECT count(*) INTO f FROM resultado WHERE nivel = 'FALHA';
  RAISE NOTICE '=== RLS: % falha(s) ===', f;
  IF f > 0 THEN RAISE EXCEPTION 'RLS reprovada: % falha(s)', f; END IF;
END $$;
