-- ============================================================================
-- P13: remove as tabelas do backup aposentado
-- ============================================================================
-- A Edge Function `backup-offsite` (backup antigo em JSON para outro projeto Supabase) e a tela
-- `/admin/backup` foram aposentadas no P06 (2026-10-15). O backup oficial é o da VPS (docs/BACKUP.md), que
-- não usa o banco para guardar configuração nem histórico. As três tabelas abaixo ficaram sem leitor nem
-- escritor: nenhum código em src/, supabase/functions/, scripts/ ou .github/ as consulta, e nenhuma view,
-- função ou tabela de fora delas depende delas (a única FK é backup_integrity_checks -> backup_history).
-- Aprovado pelo dono no plano do P13.
--
-- Sem CASCADE: a ordem respeita a FK interna, e o DROP leva só o que pertence à própria tabela (índices,
-- PK/FKs, policies e o trigger update_backup_config_updated_at). Se algo novo passar a depender delas, a
-- migração falha em vez de apagar o dependente em silêncio.
-- Os enums backup_status e backup_type eram usados só por backup_history e saem junto (também sem CASCADE).
--
-- Idempotente: DROP TABLE IF EXISTS e DROP TYPE IF EXISTS.
-- ============================================================================

DROP TABLE IF EXISTS public.backup_integrity_checks;
DROP TABLE IF EXISTS public.backup_history;
DROP TABLE IF EXISTS public.backup_config;

DROP TYPE IF EXISTS public.backup_status;
DROP TYPE IF EXISTS public.backup_type;
