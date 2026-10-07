-- Teste da RLS do baseline, tabela a tabela, com personas reais (SET ROLE + claims do JWT).
-- Rodar via scripts/db/testar-rls.sh (como SUPERUSUÁRIO, num banco descartável que já recebeu
-- schema + overlay + rls). Lê supabase/baseline/rls/mapa.csv, semeia 1-2 linhas por tabela
-- (valores fictícios, FKs ignoradas com session_replication_role = replica) e verifica:
--
--   modulo           módulo do mapa vê/insere; outro módulo, sem módulo e inativo NÃO; admin vê; anon nega
--   catalogo         qualquer ativo lê; escrita só por módulo
--   admin            só o papel admin (módulo "admin" sozinho não basta)
--   proprio_*        o servidor A vê só o seu; B só o seu; sem módulo não vê o do outro; módulo vê ambos
--   fechada          ninguém lê (nem admin)
--   preservar        não testada tabela a tabela (policies existentes são o desenho)
--   global           anon só nas exceções; nenhuma policy acesso_total; funções-stub não existem
--
-- Saída: uma linha "FALHA ..." por violação e um resumo. Termina com erro se houver falha.

\set ON_ERROR_STOP on
\set QUIET on

CREATE TEMP TABLE mapa (tabela text, modulos text, classe text, confianca text, nota text, extra text, remover_policies text, anon text);
\copy mapa FROM 'supabase/baseline/rls/mapa.csv' CSV HEADER

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
-- usuários do Auth das personas (FKs de audit_logs/profiles apontam para auth.users; triggers estão desligados aqui)
INSERT INTO auth.users (id, email) SELECT uid, nome || '@teste.invalid' FROM persona;

DO $$
DECLARE p record; sa text := 'b0000000-0000-0000-0000-00000000000a'; sb text := 'b0000000-0000-0000-0000-00000000000b';
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
  -- uma permissão avulsa de alguém que não é persona (só para haver linha a UPDATE/DELETE)
  PERFORM pg_temp.seed_row('user_permissions', jsonb_build_object('user_id', 'f0000000-0000-0000-0000-000000000001'));
END $$;

-- ---------------------------------------------------------------- semeadura por tabela
DO $$
DECLARE m record; ida text; idb text; sa uuid := 'b0000000-0000-0000-0000-00000000000a'; sb uuid := 'b0000000-0000-0000-0000-00000000000b';
        pai text; fk text; pida text; pidb text; cx text[];
BEGIN
  -- pais primeiro (proprio_filho precisa de registros pai de A e de B)
  FOR m IN SELECT * FROM mapa WHERE classe = 'proprio_filho' LOOP
    cx := regexp_match(m.extra, '^pai=([a-z_]+)\.([a-z_]+)');
    pai := cx[1];
    IF NOT EXISTS (SELECT 1 FROM semeado WHERE tabela = pai) THEN
      pida := pg_temp.seed_row(pai, jsonb_build_object('servidor_id', sa));
      pidb := pg_temp.seed_row(pai, jsonb_build_object('servidor_id', sb));
      INSERT INTO semeado VALUES (pai, pida IS NOT NULL AND pidb IS NOT NULL, pida, pidb);
    END IF;
  END LOOP;
  FOR m IN SELECT * FROM mapa WHERE classe NOT IN ('preservar') AND NOT EXISTS (SELECT 1 FROM semeado s WHERE s.tabela = mapa.tabela) LOOP
    IF m.classe IN ('proprio_leitura', 'proprio') THEN
      ida := pg_temp.seed_row(m.tabela, jsonb_build_object('servidor_id', sa));
      idb := pg_temp.seed_row(m.tabela, jsonb_build_object('servidor_id', sb));
    ELSIF m.classe = 'proprio_filho' THEN
      cx := regexp_match(m.extra, '^pai=([a-z_]+)\.([a-z_]+)'); pai := cx[1]; fk := cx[2];
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
    INSERT INTO semeado VALUES (m.tabela, ida IS NOT NULL AND (idb IS NOT NULL OR m.classe NOT IN ('proprio_leitura','proprio','proprio_filho','proprio_user')), ida, idb);
  END LOOP;
END $$;

RESET session_replication_role;

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
  pai text; fk text; cx text[]; pida text; pidb text; u_mod uuid; coluna text;
  total int := 0;
BEGIN
  FOR m IN SELECT * FROM mapa WHERE classe NOT IN ('preservar') ORDER BY tabela LOOP
    total := total + 1;
    mods := string_to_array(nullif(m.modulos, ''), '|');
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
      IF pg_temp.sel(u_inativo, 'authenticated', m.tabela) > 0 AND NOT (m.classe IN ('proprio_leitura','proprio','proprio_filho') AND false) THEN
        PERFORM pg_temp.falha(m.tabela || ': usuário inativo enxerga linhas');
      END IF;
    END IF;

    IF m.classe IN ('modulo','catalogo','proprio_leitura','proprio','proprio_filho','trilha') THEN
      -- cada módulo do mapa vê e escreve
      FOREACH mm IN ARRAY mods LOOP
        u_mod := (SELECT uid FROM persona WHERE nome = 'mod_' || mm);
        IF coalesce(ok_seed, false) AND pg_temp.sel(u_mod, 'authenticated', m.tabela) < 1 THEN
          PERFORM pg_temp.falha(m.tabela || ': módulo ' || mm || ' não enxerga a linha');
        END IF;
        IF m.classe = 'trilha' THEN
          IF pg_temp.ins(u_mod, 'authenticated', m.tabela) <> 'negado' THEN
            PERFORM pg_temp.falha(m.tabela || ': módulo ' || mm || ' consegue INSERT em trilha (só leitura)');
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
    ELSIF m.classe IN ('modulo','admin','trilha','admin_leitura') AND m.anon <> 'select' AND coalesce(ok_seed, false) THEN
      IF pg_temp.sel(u_nenhum, 'authenticated', m.tabela) > 0 THEN PERFORM pg_temp.falha(m.tabela || ': usuário sem módulo enxerga linhas'); END IF;
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

    -- posse própria
    IF m.classe IN ('proprio_leitura','proprio') AND coalesce(ok_seed, false) THEN
      IF pg_temp.sel(u_a, 'authenticated', m.tabela) <> 1 THEN PERFORM pg_temp.falha(m.tabela || ': srv_a deveria ver exatamente 1 linha (a sua)'); END IF;
      IF pg_temp.sel(u_b, 'authenticated', m.tabela) <> 1 THEN PERFORM pg_temp.falha(m.tabela || ': srv_b deveria ver exatamente 1 linha (a sua)'); END IF;
      IF pg_temp.sel((SELECT uid FROM persona WHERE nome='mod_' || mods[1]), 'authenticated', m.tabela) <> 2 THEN
        PERFORM pg_temp.falha(m.tabela || ': módulo deveria ver as 2 linhas');
      END IF;
      IF m.classe = 'proprio_leitura' AND pg_temp.ins(u_a, 'authenticated', m.tabela, 'servidor_id', quote_literal(sa)) <> 'negado' THEN
        PERFORM pg_temp.falha(m.tabela || ': servidor consegue escrever em tabela só-leitura própria');
      END IF;
      IF m.classe = 'proprio' THEN
        IF pg_temp.ins(u_a, 'authenticated', m.tabela, 'servidor_id', quote_literal(sa)) = 'negado' THEN PERFORM pg_temp.falha(m.tabela || ': srv_a não consegue criar pedido para si'); END IF;
        IF pg_temp.ins(u_a, 'authenticated', m.tabela, 'servidor_id', quote_literal(sb)) <> 'negado' THEN PERFORM pg_temp.falha(m.tabela || ': srv_a consegue criar pedido em nome de OUTRO servidor'); END IF;
      END IF;
    END IF;
    IF m.classe = 'proprio_filho' AND coalesce(ok_seed, false) THEN
      cx := regexp_match(m.extra, '^pai=([a-z_]+)\.([a-z_]+)(;insere)?$'); pai := cx[1]; fk := cx[2];
      SELECT id_a, id_b INTO pida, pidb FROM semeado WHERE tabela = pai;
      IF pg_temp.sel(u_a, 'authenticated', m.tabela) <> 1 THEN PERFORM pg_temp.falha(m.tabela || ': srv_a deveria ver exatamente 1 linha (a sua)'); END IF;
      IF pg_temp.sel(u_b, 'authenticated', m.tabela) <> 1 THEN PERFORM pg_temp.falha(m.tabela || ': srv_b deveria ver exatamente 1 linha (a sua)'); END IF;
      IF cx[3] IS NOT NULL THEN
        IF pg_temp.ins(u_a, 'authenticated', m.tabela, fk, quote_literal(pida)) = 'negado' THEN PERFORM pg_temp.falha(m.tabela || ': srv_a não consegue criar registro no próprio pai'); END IF;
        IF pg_temp.ins(u_a, 'authenticated', m.tabela, fk, quote_literal(pidb)) <> 'negado' THEN PERFORM pg_temp.falha(m.tabela || ': srv_a consegue criar registro no pai de OUTRO servidor'); END IF;
      ELSIF pg_temp.ins(u_a, 'authenticated', m.tabela, fk, quote_literal(pida)) <> 'negado' THEN
        PERFORM pg_temp.falha(m.tabela || ': servidor consegue escrever em tabela só-leitura própria');
      END IF;
    END IF;
  END LOOP;
  PERFORM pg_temp.nota('tabelas verificadas (classe diferente de preservar): ' || total);
END $$;

-- ---------------------------------------------------------------- UPDATE e DELETE por tabela
-- Quem escreve: admin e o(s) módulo(s) do mapa. `trilha` ninguém; `admin`, `catalogo_admin` e
-- `proprio_user` só o papel admin. O servidor dono de uma linha (proprio_*) NÃO altera nem apaga.
DO $$
DECLARE
  m record; mods text[]; pers record; autorizado boolean; n int; op text; outro text; checagens int := 0;
BEGIN
  FOR m IN SELECT * FROM mapa WHERE classe NOT IN ('preservar', 'fechada') AND tabela IN (SELECT tabela FROM semeado WHERE ok) ORDER BY tabela LOOP
    mods := coalesce(string_to_array(nullif(m.modulos, ''), '|'), ARRAY[]::text[]);
    outro := (SELECT x FROM unnest(ARRAY['financeiro','rh','compras','patrimonio']) x WHERE x <> ALL (mods) LIMIT 1);
    FOR pers IN SELECT * FROM persona
                WHERE nome IN ('admin','admin_inativo','nenhum','inativo','srv_a','srv_inativo','mod_admin','mod_' || outro)
                   OR nome = ANY (SELECT 'mod_' || x FROM unnest(mods) x) LOOP
      autorizado := CASE
        WHEN m.classe IN ('trilha', 'admin_leitura') THEN false
        WHEN m.classe IN ('admin', 'catalogo_admin', 'proprio_user', 'publico_admin') THEN pers.nome = 'admin'
        ELSE pers.nome = 'admin' OR (pers.nome LIKE 'mod_%' AND substr(pers.nome, 5) = ANY (mods))
      END;
      FOREACH op IN ARRAY ARRAY['UPDATE', 'DELETE'] LOOP
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
  IF n <> 4 THEN PERFORM pg_temp.falha('anon executa ' || n || ' funções (esperado: 4 RPCs públicas)'); END IF;
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
  SELECT count(*) INTO n FROM pg_policies WHERE schemaname = 'public' AND roles && ARRAY['anon','public']::name[] AND cmd IN ('UPDATE','DELETE') AND NOT (qual ILIKE '%user_roles%');
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
  ('frequencias', ARRAY['rh']), ('inventario-fotos', ARRAY['patrimonio','patrimonio_mobile']),
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
    FOR p IN SELECT * FROM persona LOOP
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
  PERFORM pg_temp.nota('storage: ' || (SELECT count(*) FROM bucket_modulos) || ' buckets x ' || (SELECT count(*) FROM persona) || ' personas verificados');
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
    'arbitro_cpf_cadastrado','obter_protocolo_arbitro','obter_dado_oficial','registrar_denuncia_publica','consultar_protocolo_sic'];
  FOR f IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace AND p.prosecdef AND p.prorettype <> 'trigger'::regtype
      AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
      AND NOT (p.prosrc ~* 'auth\.uid\(\)|can_access_module|is_admin_user|is_admin_atual|usuario_tem_permissao|has_permission_code|usuario_eh_admin|usuario_eh_super_admin|is_active_user')
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
           AND p.proname IN ('processar_folha_pagamento','fn_atualizar_situacao_servidor') AND has_function_privilege('authenticated', p.oid, 'EXECUTE') LOOP
    PERFORM pg_temp.falha(f.proname || ': executável por authenticated (escreve em folha/servidores)');
  END LOOP;

  -- eSocial devolve o servidor ao RH e NADA a quem não tem módulo (a RLS de servidores vale)
  INSERT INTO public.servidores (id, nome_completo, cpf) VALUES (sa::uuid, 'Servidor Alheio Teste', '00000000000') ON CONFLICT DO NOTHING;
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
  r := pg_temp.insere_como(u_rh, 'authenticated', 'solicitacoes_abono', jsonb_build_object('id', 'd1000000-0000-0000-0000-000000000005', 'servidor_id', sa, 'tipo_abono_id', v_tipo, 'status', 'aprovado'));
  IF r <> 'ok' OR (SELECT status FROM public.solicitacoes_abono WHERE id = 'd1000000-0000-0000-0000-000000000005') <> 'aprovado' THEN
    PERFORM pg_temp.falha('solicitacoes_abono: o RH não consegue lançar abono já aprovado (' || r || ')');
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
