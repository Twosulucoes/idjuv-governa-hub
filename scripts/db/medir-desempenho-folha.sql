-- Mede processar_folha_pagamento com 2000 servidores: o primeiro processamento e o reprocessamento, e as linhas da
-- trilha. Serve para comparar o custo da trilha e da regra de setor antes e depois de uma migração.
--
-- ALTERA O BANCO (semeia servidores, cargo, provimentos e uma folha): rode só numa CÓPIA local do baseline ou do replay.
--   createdb -T <banco> copia_bench
--   psql -d copia_bench -v ON_ERROR_STOP=1 -f scripts/db/medir-desempenho-folha.sql              (regra como está)
--   psql -d copia_bench -v ON_ERROR_STOP=1 -v exigir=1 -f scripts/db/medir-desempenho-folha.sql  (rh e financeiro em
--        exigir, com o usuário lotado no setor; exige a migração 20261011020000_lancamento_por_setor.sql)
-- Como superusuário (a semeadura usa session_replication_role = replica). O usuário do teste tem o papel admin.
\set QUIET on
\if :{?exigir}
\else
\set exigir 0
\endif
SET session_replication_role = replica;   -- massa sem triggers (só a semeadura)
INSERT INTO auth.users (id, email) VALUES ('ad000000-0000-0000-0000-0000000000b1', 'bench@teste.invalid') ON CONFLICT DO NOTHING;
INSERT INTO public.profiles (id, email, full_name, is_active, tipo_usuario) VALUES ('ad000000-0000-0000-0000-0000000000b1', 'bench@teste.invalid', 'Bench', true, 'tecnico')
  ON CONFLICT (id) DO UPDATE SET is_active = true;
INSERT INTO public.user_roles (user_id, role) VALUES ('ad000000-0000-0000-0000-0000000000b1', 'admin') ON CONFLICT DO NOTHING;
INSERT INTO public.cargos (id, nome, categoria, vencimento_base)
SELECT 'ca000000-0000-0000-0000-000000000001', 'Cargo bench', e.enumlabel::public.categoria_cargo, 5000
  FROM pg_enum e WHERE e.enumtypid = 'public.categoria_cargo'::regtype ORDER BY e.enumsortorder LIMIT 1;
INSERT INTO public.servidores (id, nome_completo, cpf, situacao, ativo, banco_agencia, banco_conta)
SELECT ('5e000000-0000-0000-0000-' || lpad(g::text, 12, '0'))::uuid, 'Servidor ' || g, lpad(g::text, 11, '0'), 'ativo', true, '1234', '99999-' || g
  FROM generate_series(1, 2000) g;
INSERT INTO public.provimentos (servidor_id, cargo_id, data_nomeacao, status)
SELECT ('5e000000-0000-0000-0000-' || lpad(g::text, 12, '0'))::uuid, 'ca000000-0000-0000-0000-000000000001', '2020-01-01', 'ativo'
  FROM generate_series(1, 2000) g;
INSERT INTO public.folhas_pagamento (id, competencia_ano, competencia_mes, tipo_folha, status)
SELECT 'f0000000-0000-0000-0000-0000000000b1', 2040, 1, e.enumlabel::public.tipo_folha, 'aberta'
  FROM pg_enum e WHERE e.enumtypid = 'public.tipo_folha'::regtype ORDER BY e.enumsortorder LIMIT 1;
\if :exigir
-- cenário exigir: o usuário ganha servidor lotado numa unidade que é setor do rh e do financeiro, e os dois exigem
INSERT INTO public.estrutura_organizacional (id, nome, tipo) VALUES ('f6000000-0000-0000-0000-000000000001', 'Bench RH', 'diretoria');
INSERT INTO public.lotacoes (servidor_id, unidade_id, data_inicio, ativo, tipo_lotacao)
VALUES ('5e000000-0000-0000-0000-000000000001', 'f6000000-0000-0000-0000-000000000001', '2020-01-01', true, 'lotacao_interna');
UPDATE public.profiles SET servidor_id = '5e000000-0000-0000-0000-000000000001' WHERE id = 'ad000000-0000-0000-0000-0000000000b1';
INSERT INTO public.setores_modulo (modulo, unidade_id) VALUES ('rh', 'f6000000-0000-0000-0000-000000000001'), ('financeiro', 'f6000000-0000-0000-0000-000000000001');
UPDATE public.regra_lancamento SET modo = 'exigir' WHERE modulo IN ('rh', 'financeiro');
\endif
SET session_replication_role = origin;
ANALYZE;
SELECT count(*) AS audit_antes FROM public.audit_logs \gset

BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', '{"sub":"ad000000-0000-0000-0000-0000000000b1","role":"authenticated"}', true);
SELECT set_config('request.headers', '{"x-real-ip":"203.0.113.7","user-agent":"bench"}', true);
SELECT clock_timestamp() AS t0 \gset
SELECT public.processar_folha_pagamento('f0000000-0000-0000-0000-0000000000b1') ->> 'servidores_processados' AS proc1 \gset
SELECT clock_timestamp() AS t1 \gset
SELECT public.processar_folha_pagamento('f0000000-0000-0000-0000-0000000000b1') ->> 'servidores_processados' AS proc2 \gset
SELECT clock_timestamp() AS t2 \gset
COMMIT;
SELECT count(*) - :audit_antes AS linhas_trilha FROM public.audit_logs \gset
\set QUIET off
SELECT :'proc1' AS processados, round(extract(epoch FROM (:'t1'::timestamptz - :'t0'::timestamptz)) * 1000) AS ms_processar,
       :'proc2' AS reprocessados, round(extract(epoch FROM (:'t2'::timestamptz - :'t1'::timestamptz)) * 1000) AS ms_reprocessar,
       :linhas_trilha AS linhas_trilha;
