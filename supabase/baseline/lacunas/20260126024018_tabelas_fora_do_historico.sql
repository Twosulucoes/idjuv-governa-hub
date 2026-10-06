-- Tabelas que as migrações USAM mas NENHUMA migração do repositório CRIA.
--
-- Descoberto em 2026-10-06 reaplicando as 249 migrações em Postgres vazio: perfis,
-- funcoes_sistema, perfil_funcoes e usuario_perfis existiram só no banco ao vivo (criadas fora
-- do histórico versionado), mas a partir de 20260126024019 as migrações dependem delas. Sem
-- elas, 70 migrações falham em cascata (inclusive a função usuario_tem_permissao e as
-- policies de RBAC).
--
-- ATENÇÃO: as quatro tabelas são TRANSITÓRIAS. A migração 20260207182933 as remove (DROP TABLE
-- ... CASCADE) na reformulação do RBAC, e nada em src/ nem em types.ts as usa. Portanto o baseline
-- final NÃO as contém; este arquivo só existe para o histórico intermediário (26/01 a 07/02)
-- ser reaplicável. Por isso a fidelidade exata ao banco ao vivo é desnecessária: basta ter as
-- colunas e restrições que as migrações desse período usam (ex.: funcoes_sistema.descricao e
-- UNIQUE(codigo), exigida por INSERT ... ON CONFLICT (codigo)).
--
-- Origem das definições: supabase/disaster-recovery/SCHEMA-TODAS-TABELAS.sql (dump antigo,
-- ~82 tabelas). NÃO foram comparadas com o banco ao vivo: antes de tratar este arquivo como
-- fiel, rode `scripts/db/comparar-schema.sh` contra um `pg_dump --schema-only` do banco real.
--
-- Fica FORA de supabase/migrations/ de propósito: uma migração retroativa (timestamp antigo)
-- quebra a ordem esperada pelo Supabase CLI e pela sincronização do Lovable no banco atual.
-- É idempotente (IF NOT EXISTS), então é seguro mesmo onde as tabelas já existem.
--
-- Usado por: scripts/db/validar-baseline.sh (intercalado na ordem das migrações).

CREATE TABLE IF NOT EXISTS public.perfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  codigo VARCHAR(50) UNIQUE,
  descricao TEXT,
  nivel VARCHAR(50),
  nivel_hierarquia INTEGER DEFAULT 0,
  perfil_pai_id UUID REFERENCES public.perfis(id),
  ativo BOOLEAN DEFAULT true,
  is_sistema BOOLEAN DEFAULT false,
  cor VARCHAR(20),
  icone VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID
);

CREATE TABLE IF NOT EXISTS public.funcoes_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(100) NOT NULL UNIQUE,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  modulo VARCHAR(100),
  submodulo VARCHAR(100),
  tipo_acao VARCHAR(50),
  ordem INTEGER DEFAULT 0,
  rota VARCHAR(255),
  icone VARCHAR(50),
  funcao_pai_id UUID REFERENCES public.funcoes_sistema(id),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.perfil_funcoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  perfil_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  funcao_id UUID NOT NULL REFERENCES public.funcoes_sistema(id) ON DELETE CASCADE,
  concedido BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  UNIQUE(perfil_id, funcao_id)
);

CREATE TABLE IF NOT EXISTS public.usuario_perfis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  perfil_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT true,
  data_inicio DATE DEFAULT CURRENT_DATE,
  data_fim DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  UNIQUE(user_id, perfil_id)
);

-- Perfis que migrações do período referenciam por código (SELECT id FROM perfis WHERE codigo = ...)
-- e que existiam no banco ao vivo. Só catálogo; nenhuma linha de usuário.
INSERT INTO public.perfis (nome, codigo, descricao, is_sistema) VALUES
  ('Super Administrador', 'super_admin', 'Perfil de sistema (transitório no histórico)', true),
  ('Administrador', 'admin', 'Perfil de sistema (transitório no histórico)', true),
  ('Gestor de Federações', 'gestor_federacoes', 'Perfil de sistema (transitório no histórico)', true)
ON CONFLICT (codigo) DO NOTHING;

-- ---------------------------------------------------------------------------------------------
-- Funções usadas desde 20260131 e criadas fora do histórico (origem:
-- supabase/disaster-recovery/03-criar-funcoes.sql). A migração 20260207184919 e as seguintes
-- redefinem usuario_tem_permissao; usuario_eh_admin é usada por 20260126024019 e 20260201224705.
-- ---------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.usuario_eh_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuario_perfis up
    JOIN public.perfis p ON up.perfil_id = p.id
    WHERE up.user_id = check_user_id
      AND up.ativo = true
      AND (up.data_fim IS NULL OR up.data_fim >= CURRENT_DATE)
      AND (p.codigo IN ('super_admin', 'admin') OR p.nome IN ('Super Administrador', 'Administrador'))
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.usuario_tem_permissao(_user_id UUID, _codigo_funcao VARCHAR)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tem_permissao BOOLEAN := false;
  _perfil RECORD;
BEGIN
  FOR _perfil IN
    SELECT up.perfil_id
    FROM usuario_perfis up
    WHERE up.user_id = _user_id
      AND up.ativo = true
      AND (up.data_fim IS NULL OR up.data_fim >= CURRENT_DATE)
  LOOP
    SELECT EXISTS (
      SELECT 1
      FROM perfil_funcoes pf
      JOIN funcoes_sistema fs ON fs.id = pf.funcao_id
      WHERE pf.perfil_id = _perfil.perfil_id
        AND fs.codigo = _codigo_funcao
        AND pf.concedido = true
        AND fs.ativo = true
    ) INTO _tem_permissao;

    IF _tem_permissao THEN
      RETURN true;
    END IF;
  END LOOP;

  RETURN false;
END;
$$;
