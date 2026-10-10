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
--   proprio_leitura  ;coluna=<col>: posse por outra coluna (servidores: id); ;excluir=<código>: DELETE só com o código
--   fechada          ninguém lê (nem admin)
--   preservar        profiles e denuncias: testes próprios no bloco "cobertura adicional"
--   UPDATE/DELETE    por tabela e persona (SET col = DEFAULT, sem WHERE: mede só a policy de UPDATE)
--   storage          SELECT/INSERT/UPDATE/DELETE por bucket e persona; upload anônimo só nas pastas do formulário
--   identidade/RPCs  auto-ativação, servidor_id alheio, injeção de SQL, SECURITY DEFINER sem checagem, privilégios
--                    padrão, campos que o autor não escolhe, links do formulário, fechamento de folha, views
--   RH (B2)          campos iniciais isentos por permissão (e nunca no próprio pedido); etapas do abono e do
--                    fechamento (trigger validar_etapa_frequencia: chefia rh.aprovar, RH rh.frequencia.lancar); casos da
--                    revisão de segurança (dados imutáveis, autoria forçada, posse por usuário, aprovador sem vínculo)
--   global           anon só nas exceções; nenhuma policy acesso_total; funções-stub não existem
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
  ('publicacoes_legais', '{"contrato_id":"c0000000-0000-0000-0000-0000000000c1"}');
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
-- ;excluir=<código>|admin (permissao e proprio_leitura); NULL se não há
CREATE FUNCTION pg_temp.excluir_de(classe text, extra text) RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN classe IN ('permissao', 'proprio_leitura') THEN (regexp_match(extra, '(^|;)excluir=([^;]+)'))[2] END
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
                                || coalesce(ARRAY[nullif(pg_temp.excluir_de(m.classe, m.extra), 'admin')], '{}'::text[])) AS c(codigo)
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
  -- dono das linhas A/B na coluna de posse (servidor; ou o perfil da persona com ;posse=usuario) e literais das
  -- linhas A/B no teste de ;sem_autoaprovacao
  dono_a text; dono_b text; lit_a text; lit_b text; pai_a text;
  total int := 0;
BEGIN
  FOR m IN SELECT * FROM mapa WHERE classe NOT IN ('preservar') ORDER BY tabela LOOP
    total := total + 1;
    mods := string_to_array(nullif(m.modulos, ''), '|');
    codigos := pg_temp.codigos_escrita(m.classe, m.extra);
    codigo := array_to_string(codigos, '|');
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
        IF coalesce(ok_seed, false) AND pg_temp.sel(u_mod, 'authenticated', m.tabela) < 1 THEN
          PERFORM pg_temp.falha(m.tabela || ': módulo ' || mm || ' não enxerga a linha');
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
      outro := (SELECT x FROM unnest(ARRAY['financeiro','rh','compras','patrimonio']) x WHERE x <> ALL (mods) LIMIT 1);
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
        IF coalesce(ok_seed, false) AND pg_temp.sel(u_perm, 'authenticated', m.tabela) < 1 THEN
          PERFORM pg_temp.falha(m.tabela || ': quem tem ' || codigo || ' não enxerga a linha');
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
      IF pg_temp.sel((SELECT uid FROM persona WHERE nome='mod_' || mods[1]), 'authenticated', m.tabela) <> 2 THEN
        PERFORM pg_temp.falha(m.tabela || ': módulo deveria ver as 2 linhas');
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
      IF pg_temp.sel((SELECT uid FROM persona WHERE nome='mod_' || mods[1]), 'authenticated', m.tabela) <> 2 THEN
        PERFORM pg_temp.falha(m.tabela || ': módulo deveria ver as 2 linhas');
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
      IF pg_temp.sel((SELECT uid FROM persona WHERE nome='mod_' || mods[1]), 'authenticated', m.tabela) <> 2 THEN
        PERFORM pg_temp.falha(m.tabela || ': módulo deveria ver as 2 linhas');
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
DO $$
DECLARE
  m record; mods text[]; pers record; autorizado boolean; n int; op text; outro text; checagens int := 0;
  perms text[]; avulsas text[]; excl text; perm_excl text; tem_mod boolean; codigo text; u_perm uuid;
  sa uuid := 'b0000000-0000-0000-0000-00000000000a';
  u_a uuid := (SELECT uid FROM persona WHERE nome = 'srv_a');
BEGIN
  FOR m IN SELECT * FROM mapa WHERE classe NOT IN ('preservar', 'fechada') AND tabela IN (SELECT tabela FROM semeado WHERE ok) ORDER BY tabela LOOP
    mods := coalesce(string_to_array(nullif(m.modulos, ''), '|'), ARRAY[]::text[]);
    outro := (SELECT x FROM unnest(ARRAY['financeiro','rh','compras','patrimonio']) x WHERE x <> ALL (mods) LIMIT 1);
    perms := coalesce((SELECT array_agg('perm_' || c) FROM unnest(pg_temp.codigos_escrita(m.classe, m.extra)) c), '{}');
    avulsas := coalesce((SELECT array_agg('perm_avulsa_' || c) FROM unnest(pg_temp.codigos_escrita(m.classe, m.extra)) c), '{}');
    excl := pg_temp.excluir_de(m.classe, m.extra);
    perm_excl := CASE WHEN excl <> 'admin' THEN 'perm_' || excl END;
    FOR pers IN SELECT * FROM persona
                WHERE nome IN ('admin','admin_inativo','nenhum','inativo','srv_a','srv_inativo','mod_admin','mod_' || outro)
                   OR nome = ANY (SELECT 'mod_' || x FROM unnest(mods) x)
                   OR nome = ANY (perms) OR nome = ANY (avulsas) OR nome = perm_excl LOOP
      -- persona com algum módulo da tabela (mod_<m> ou perm_<código> cujo módulo é da tabela)
      tem_mod := (pers.nome LIKE 'mod_%' AND substr(pers.nome, 5) = ANY (mods))
                 OR EXISTS (SELECT 1 FROM persona_perm pp WHERE pp.nome = pers.nome AND pp.modulos && mods);
      FOREACH op IN ARRAY ARRAY['UPDATE', 'DELETE'] LOOP
        autorizado := CASE
          WHEN m.classe IN ('trilha', 'admin_leitura') THEN false
          WHEN m.classe IN ('admin', 'catalogo_admin', 'proprio_user', 'publico_admin') THEN pers.nome = 'admin'
          WHEN op = 'DELETE' AND excl = 'admin' THEN pers.nome = 'admin'
          WHEN op = 'DELETE' AND excl IS NOT NULL THEN pers.nome = 'admin' OR pers.nome = perm_excl
          WHEN m.classe = 'permissao' OR cardinality(perms) > 0 THEN pers.nome = 'admin' OR pers.nome = ANY (perms)   -- módulo sozinho e permissão avulsa NÃO alteram nem apagam
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
               coalesce(CASE WHEN excl = 'admin' THEN false
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
  IF n <> 6 THEN PERFORM pg_temp.falha('anon executa ' || n || ' funções (esperado: 6 RPCs públicas)'); END IF;
  SELECT count(*) INTO n FROM pg_class c WHERE c.relnamespace = 'public'::regnamespace AND c.relkind IN ('r','p') AND (has_table_privilege('anon', c.oid, 'SELECT') OR has_table_privilege('anon', c.oid, 'INSERT') OR has_table_privilege('anon', c.oid, 'UPDATE') OR has_table_privilege('anon', c.oid, 'DELETE'));
  IF n <> (SELECT count(*) FROM mapa WHERE anon <> '') THEN PERFORM pg_temp.falha('anon tem privilégio em ' || n || ' tabelas; o mapa declara ' || (SELECT count(*) FROM mapa WHERE anon <> '')); END IF;
  FOR x IN SELECT tabela, anon FROM mapa WHERE anon <> '' LOOP
    IF x.anon = 'select' AND NOT has_table_privilege('anon', ('public.' || quote_ident(x.tabela))::regclass, 'SELECT') THEN
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

CREATE TEMP TABLE bucket_modulos (bucket text, modulos text[]);
INSERT INTO bucket_modulos VALUES
  ('arbitros-docs', ARRAY['arbitros']), ('ascom-demandas', ARRAY['comunicacao']),
  ('documentos', ARRAY['workflow','rh']), ('documentos-requerimento', ARRAY['rh']),
  ('frequencias', ARRAY['rh']), ('inventario-evidencias', ARRAY['patrimonio','patrimonio_mobile']),
  ('inventario-fotos', ARRAY['patrimonio','patrimonio_mobile']),
  ('patrimonio-docs', ARRAY['patrimonio','patrimonio_mobile']), ('patrimonio-fotos', ARRAY['patrimonio','patrimonio_mobile']),
  ('transparencia-publicacoes', ARRAY['transparencia']);

INSERT INTO storage.objects (bucket_id, name) SELECT bucket, 'semente.bin' FROM bucket_modulos;

DO $$
DECLARE b record; p record; esperado int; n int; r text; permitido boolean;
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
      esperado := CASE WHEN permitido THEN 1 ELSE 0 END;
      n := pg_temp.sel_obj(p.uid, 'authenticated', b.bucket);
      IF n <> esperado THEN PERFORM pg_temp.falha(format('storage %s: %s vê %s objeto(s), esperado %s', b.bucket, p.nome, n, esperado)); END IF;
      r := pg_temp.ins_obj(p.uid, 'authenticated', b.bucket);
      IF (r = 'passou') <> permitido THEN PERFORM pg_temp.falha(format('storage %s: %s INSERT = %s, esperado %s', b.bucket, p.nome, r, CASE WHEN permitido THEN 'passou' ELSE 'negado' END)); END IF;
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
    'fn_gerar_numero_financeiro','fn_proximo_numero_processo','gerar_numero_portaria','gerar_numero_tombamento',
    'gerar_protocolo_cedencia','gerar_protocolo_memorando_lotacao','get_proximo_numero_remessa',
    -- estrutura organizacional e processos (sem dado pessoal sensível)
    'fn_calcular_sla_processo','fn_pode_arquivar_processo','folha_esta_bloqueada','get_chefe_unidade_atual',
    'get_hierarquia_unidade','get_subordinados_unidade','user_has_unit_access','can_approve','can_view_indicacao',
    -- ajudantes de RLS/RBAC: as policies os chamam como o usuário, então precisam de EXECUTE (consultam
    -- permissões de terceiros pelo UUID; risco aceito e registrado em supabase/baseline/README.md)
    'can_access_module','has_module','has_permission','has_permission_code','is_active_user','is_admin_user','is_user_active',
    'get_user_permission_codes','get_user_permissions','get_permissions_from_servidor','listar_permissoes_usuario',
    -- RPCs públicas (formulários e portal): anon executa
    'arbitro_cpf_cadastrado','obter_protocolo_arbitro','obter_dado_oficial','registrar_denuncia_publica',
    'consultar_gestor_por_cpf','registrar_gestor_publico',
    -- só authenticated executa (anon não); incrementa o contador de bloqueio por token errado
    'consultar_protocolo_sic'];
  FOR f IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace AND p.prosecdef AND p.prorettype <> 'trigger'::regtype
      AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
      AND NOT (p.prosrc ~* 'auth\.uid\(\)|can_access_module|is_admin_user|is_admin_atual|usuario_tem_permissao|has_permission_code|usuario_eh_admin|usuario_eh_super_admin|is_active_user|perfil_ativo_atual|pode_gerenciar_avisos|pode_configurar_envios|pode_ver_envios')
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
  escola := pg_temp.seed_row('escolas_jer');
  r := pg_temp.insere_como(NULL, 'anon', 'gestores_escolares', jsonb_build_object('id', 'd1000000-0000-0000-0000-000000000006', 'escola_id', escola, 'status', 'ativo'));
  IF r <> 'ok' THEN PERFORM pg_temp.falha('gestores_escolares: anon não consegue enviar o formulário (' || r || ')');
  ELSIF NOT (SELECT ja_cadastrada FROM public.escolas_jer WHERE id = escola::uuid) THEN PERFORM pg_temp.falha('gestores_escolares: escolas_jer.ja_cadastrada não foi marcada');
  ELSIF (SELECT status FROM public.gestores_escolares WHERE id = 'd1000000-0000-0000-0000-000000000006') <> 'aguardando' THEN PERFORM pg_temp.falha('gestores_escolares: anon escolheu o status');
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
         (SELECT id FROM public.escolas_jer LIMIT 1)));
  IF r IS NULL OR r LIKE 'erro:%' THEN PERFORM pg_temp.falha('registrar_gestor_publico (anon) falha: ' || coalesce(r, 'NULL')); END IF;
  IF r ~* 'cpf|email|celular|12345678901' THEN PERFORM pg_temp.falha('registrar_gestor_publico devolve dado pessoal: ' || r); END IF;
  r := pg_temp.valor_como(NULL, 'anon', 'SELECT public.consultar_gestor_por_cpf(''123.456.789-01'')::text');
  IF r IS NULL OR r LIKE 'erro:%' OR r NOT LIKE '%FULANO%' THEN PERFORM pg_temp.falha('consultar_gestor_por_cpf (anon) não acha o gestor: ' || coalesce(r, 'NULL')); END IF;
  IF r ~* 'cpf|email|celular|12345678901' THEN PERFORM pg_temp.falha('consultar_gestor_por_cpf devolve dado pessoal: ' || r); END IF;
  IF pg_temp.valor_como(NULL, 'anon', 'SELECT public.consultar_gestor_por_cpf(''000'')::text') IS NOT NULL THEN PERFORM pg_temp.falha('consultar_gestor_por_cpf aceita CPF inválido'); END IF;
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

-- ---------------------------------------------------------------- RH: permissões e etapas (Onda B / B2) (TRIGGERS LIGADOS)
-- Migração 20261010090000_onda_b_rh_permissoes.sql (e overlay/20 no baseline):
--   * forcar_campos_iniciais com isenção por PERMISSÃO (perm:rh:rh.aprovar|rh.frequencia.lancar): quem tem o módulo
--     sem a permissão e quem tem a permissão mas é o dono do pedido gravam o pedido zerado (status pendente,
--     aprovadores nulos); quem tem módulo E permissão grava já decidido para OUTRO servidor;
--   * validar_etapa_frequencia: cada etapa do abono e do fechamento exige a sua permissão (42501 com a etapa); dados do
--     abono imutáveis fora de pendente; chave, assinatura e linha consolidada do fechamento protegidas; autoria forçada;
--   * revisão de segurança: posse por usuário (ajuste de ponto, banco de horas), ninguém grava no que é seu,
--     aprovador sem vínculo identificado pelo CPF, exclusão de justificativa só do RH.
DO $$
DECLARE
  u_admin uuid := (SELECT uid FROM persona WHERE nome='admin');
  u_rh uuid := (SELECT uid FROM persona WHERE nome='mod_rh');                      -- módulo rh, sem permissão
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
  r := pg_temp.insere_como(u_ch, 'authenticated', 'justificativas_ponto', jsonb_build_object('id', 'd2000000-0000-0000-0000-000000000032', 'registro_ponto_id', ponto_a, 'status', 'aprovada', 'aprovador_id', u_ch::text));
  IF r <> 'ok' OR (SELECT status::text FROM public.justificativas_ponto WHERE id = 'd2000000-0000-0000-0000-000000000032') <> 'aprovada' THEN
    PERFORM pg_temp.falha('justificativas_ponto: chefia não registra justificativa decidida no ponto de OUTRO servidor (' || r || ')');
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
  r := pg_temp.sql_como(u_rh, 'authenticated', format('UPDATE public.servidores SET cpf = ''00000000000'' WHERE id = %L', sb));
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

-- ---------------------------------------------------------------- resumo
SELECT nivel, msg FROM resultado ORDER BY nivel DESC, msg;
\set QUIET off
DO $$
DECLARE f int; BEGIN
  SELECT count(*) INTO f FROM resultado WHERE nivel = 'FALHA';
  RAISE NOTICE '=== RLS: % falha(s) ===', f;
  IF f > 0 THEN RAISE EXCEPTION 'RLS reprovada: % falha(s)', f; END IF;
END $$;
