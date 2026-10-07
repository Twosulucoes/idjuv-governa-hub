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

-- ---------------------------------------------------------------- utilitários
-- Insere uma linha preenchendo as colunas NOT NULL sem padrão com valores fictícios.
-- ov = valores fixos por coluna. Devolve o id (text) da linha criada ou NULL se falhou.
CREATE FUNCTION pg_temp.seed_row(t text, ov jsonb DEFAULT '{}') RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
  cols text[] := '{}'; vals text[] := '{}'; r record; v text; novo text;
BEGIN
  FOR r IN
    SELECT a.attname, a.attnotnull, a.atthasdef, a.atttypmod, ty.typname, ty.typcategory, ty.oid AS typoid
    FROM pg_attribute a JOIN pg_type ty ON ty.oid = a.atttypid
    WHERE a.attrelid = ('public.' || quote_ident(t))::regclass AND a.attnum > 0 AND NOT a.attisdropped
      AND a.attgenerated = '' AND a.attidentity = ''
    ORDER BY a.attnum
  LOOP
    IF ov ? r.attname THEN
      cols := cols || quote_ident(r.attname);
      vals := vals || coalesce(quote_literal(ov->>r.attname) || '::' || r.typname, 'NULL');
    ELSIF r.attnotnull AND NOT r.atthasdef THEN
      v := CASE
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
    IF array_length(cols, 1) IS NULL THEN
      EXECUTE format('INSERT INTO public.%I DEFAULT VALUES RETURNING to_jsonb(%I.*)->>''id''', t, t) INTO novo;
    ELSE
      EXECUTE format('INSERT INTO public.%I (%s) VALUES (%s) RETURNING to_jsonb(%I.*)->>''id''', t, array_to_string(cols, ','), array_to_string(vals, ','), t) INTO novo;
    END IF;
    RETURN coalesce(novo, 'sem-id');
  EXCEPTION WHEN OTHERS THEN
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
  ('srv_b',   'a0000000-0000-0000-0000-000000000005');
INSERT INTO persona SELECT 'mod_' || e.enumlabel, md5('mod_' || e.enumlabel)::uuid
FROM pg_enum e JOIN pg_type ty ON ty.oid = e.enumtypid WHERE ty.typname = 'app_module';

DO $$
DECLARE p record; sa text := 'b0000000-0000-0000-0000-00000000000a'; sb text := 'b0000000-0000-0000-0000-00000000000b';
BEGIN
  FOR p IN SELECT * FROM persona LOOP
    PERFORM pg_temp.seed_row('profiles', jsonb_build_object('id', p.uid, 'email', p.nome || '@teste.invalid',
      'is_active', (p.nome <> 'inativo'), 'tipo_usuario', 'servidor',
      'servidor_id', CASE p.nome WHEN 'srv_a' THEN sa WHEN 'srv_b' THEN sb ELSE NULL END));
  END LOOP;
  PERFORM pg_temp.seed_row('user_roles', jsonb_build_object('user_id', (SELECT uid FROM persona WHERE nome='admin'), 'role', 'admin'));
  FOR p IN SELECT * FROM persona WHERE nome LIKE 'mod_%' LOOP
    PERFORM pg_temp.seed_row('user_modules', jsonb_build_object('user_id', p.uid, 'module', substr(p.nome, 5)));
  END LOOP;
  PERFORM pg_temp.seed_row('user_modules', jsonb_build_object('user_id', (SELECT uid FROM persona WHERE nome='inativo'), 'module', 'rh'));
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
    ELSE
      ida := pg_temp.seed_row(m.tabela); idb := NULL;
    END IF;
    INSERT INTO semeado VALUES (m.tabela, ida IS NOT NULL AND (idb IS NOT NULL OR m.classe NOT IN ('proprio_leitura','proprio','proprio_filho')), ida, idb);
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
    IF NOT coalesce(ok_seed, false) THEN PERFORM pg_temp.nota('sem linha de teste: ' || m.tabela || ' [' || m.classe || '] (SELECT positivo não verificado)'); END IF;

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
    IF m.classe <> 'catalogo' AND m.anon <> 'select' AND coalesce(ok_seed, false) THEN
      IF pg_temp.sel(u_inativo, 'authenticated', m.tabela) > 0 AND NOT (m.classe IN ('proprio_leitura','proprio','proprio_filho') AND false) THEN
        PERFORM pg_temp.falha(m.tabela || ': usuário inativo enxerga linhas');
      END IF;
    END IF;

    IF m.classe IN ('modulo','catalogo','proprio_leitura','proprio','proprio_filho') THEN
      -- cada módulo do mapa vê e escreve
      FOREACH mm IN ARRAY mods LOOP
        u_mod := (SELECT uid FROM persona WHERE nome = 'mod_' || mm);
        IF coalesce(ok_seed, false) AND pg_temp.sel(u_mod, 'authenticated', m.tabela) < 1 THEN
          PERFORM pg_temp.falha(m.tabela || ': módulo ' || mm || ' não enxerga a linha');
        END IF;
        IF pg_temp.ins(u_mod, 'authenticated', m.tabela) = 'negado' THEN
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
    ELSIF m.classe IN ('modulo','admin') AND m.anon <> 'select' AND coalesce(ok_seed, false) THEN
      IF pg_temp.sel(u_nenhum, 'authenticated', m.tabela) > 0 THEN PERFORM pg_temp.falha(m.tabela || ': usuário sem módulo enxerga linhas'); END IF;
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

-- ---------------------------------------------------------------- asserções globais
DO $$
DECLARE n int; u_admin uuid := (SELECT uid FROM persona WHERE nome='admin'); u_nenhum uuid := (SELECT uid FROM persona WHERE nome='nenhum'); r text; x record;
BEGIN
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

RESET session_replication_role;

-- ---------------------------------------------------------------- resumo
SELECT nivel, msg FROM resultado ORDER BY nivel DESC, msg;
\set QUIET off
DO $$
DECLARE f int; BEGIN
  SELECT count(*) INTO f FROM resultado WHERE nivel = 'FALHA';
  RAISE NOTICE '=== RLS: % falha(s) ===', f;
  IF f > 0 THEN RAISE EXCEPTION 'RLS reprovada: % falha(s)', f; END IF;
END $$;
