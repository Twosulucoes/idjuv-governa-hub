-- ============================================================
-- SCRIPT 1: ADICIONAR COLUNAS E TIPOS FALTANTES
-- Execute PRIMEIRO no SQL Editor do Supabase
-- ============================================================

-- TIPOS ENUM (ignora se já existir)
DO $$ BEGIN CREATE TYPE public.tipo_servidor AS ENUM ('comissionado_idjuv', 'efetivo_idjuv', 'cedido_entrada', 'cedido_saida', 'temporario', 'estagiario'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.tipo_usuario AS ENUM ('servidor', 'tecnico'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.natureza_cargo AS ENUM ('direcao', 'chefia', 'assessoramento', 'execucao'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.status_provimento AS ENUM ('ativo', 'encerrado', 'suspenso'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.situacao_funcional AS ENUM ('ativo', 'afastado', 'cedido', 'licenca', 'ferias', 'exonerado', 'aposentado', 'falecido', 'inativo'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.vinculo_funcional AS ENUM ('efetivo', 'comissionado', 'cedido', 'temporario', 'estagiario', 'requisitado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.categoria_cargo AS ENUM ('efetivo', 'comissionado', 'funcao_gratificada', 'temporario', 'estagiario'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.tipo_unidade AS ENUM ('presidencia', 'diretoria', 'departamento', 'setor', 'divisao', 'secao', 'coordenacao'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Adicionar colunas na profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tipo_usuario public.tipo_usuario DEFAULT 'servidor';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS servidor_id UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf VARCHAR(14);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

SELECT 'Colunas adicionadas com sucesso!' as resultado;
