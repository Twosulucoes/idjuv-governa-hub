-- ============================================================================
-- AVISOS E DATAS IMPORTANTES — mural de avisos internos + calendário institucional
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-09-avisos-e-datas-importantes-design.md
--
--   avisos              mural interno: prioridade, destaque, validade e público-alvo
--                       (todos ou módulos). Visibilidade decidida aqui, na RLS.
--   avisos_leituras     quem já leu cada aviso (some do sino/destaque depois de lido).
--   datas_importantes   prazos, eventos e datas institucionais (feriados continuam em
--                       dias_nao_uteis; o front junta as duas fontes).
--   aniversariantes_do_mes(mes)  só nome e dia, sem ano nem dado de contato, para que
--                       qualquer usuário ativo veja os aniversariantes sem ler servidores.
--
-- Quem publica: permissão `avisos.gerenciar` (catálogo do módulo comunicacao); o papel
-- admin já passa por cima em has_permission_code.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Permissão
-- ----------------------------------------------------------------------------
INSERT INTO public.module_permissions_catalog
  (module_code, permission_code, label, category, action_type, sort_order)
VALUES
  ('comunicacao', 'avisos.gerenciar', 'Gerenciar Avisos e Datas Importantes', 'Avisos', 'gerenciar', 520)
ON CONFLICT (permission_code) DO NOTHING;

-- Gestor ativo de avisos (usado pelas policies abaixo).
CREATE OR REPLACE FUNCTION public.pode_gerenciar_avisos()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_active_user()
     AND public.has_permission_code(auth.uid(), 'avisos.gerenciar');
$$;

REVOKE ALL ON FUNCTION public.pode_gerenciar_avisos() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pode_gerenciar_avisos() TO authenticated;

-- Algum dos módulos-alvo é acessível ao usuário logado (lista vazia/nula = todos).
CREATE OR REPLACE FUNCTION public.alcanca_modulos_alvo(_modulos public.app_module[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(cardinality(_modulos), 0) = 0
      OR EXISTS (
           SELECT 1 FROM unnest(_modulos) AS m
           WHERE public.can_access_module(auth.uid(), m::text)
         );
$$;

REVOKE ALL ON FUNCTION public.alcanca_modulos_alvo(public.app_module[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.alcanca_modulos_alvo(public.app_module[]) TO authenticated;


-- ----------------------------------------------------------------------------
-- 2. avisos
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.avisos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL CHECK (char_length(btrim(titulo)) BETWEEN 3 AND 200),
  conteudo text NOT NULL CHECK (char_length(conteudo) <= 5000),
  prioridade text NOT NULL DEFAULT 'normal'
    CHECK (prioridade IN ('baixa', 'normal', 'alta', 'urgente')),
  destaque boolean NOT NULL DEFAULT false,
  publico text NOT NULL DEFAULT 'todos' CHECK (publico IN ('todos', 'modulos')),
  modulos_alvo public.app_module[] NOT NULL DEFAULT '{}',
  inicio_em timestamptz NOT NULL DEFAULT now(),
  expira_em timestamptz,
  link text CHECK (link IS NULL OR link ~ '^(/|https://)'),
  ativo boolean NOT NULL DEFAULT true,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT avisos_validade_ck CHECK (expira_em IS NULL OR expira_em > inicio_em),
  CONSTRAINT avisos_publico_ck CHECK (publico = 'todos' OR cardinality(modulos_alvo) > 0)
);

COMMENT ON TABLE public.avisos IS 'Mural de avisos internos (prioridade, destaque, validade, público por módulo).';

CREATE INDEX IF NOT EXISTS idx_avisos_vigentes
  ON public.avisos (inicio_em DESC) WHERE ativo;

ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;

-- Leitura: gestor vê tudo (inclusive rascunho/expirado); demais só o vigente e do seu público.
CREATE POLICY avisos_select ON public.avisos
  FOR SELECT TO authenticated
  USING (
    (SELECT public.pode_gerenciar_avisos())
    OR (
      (SELECT public.is_active_user())
      AND ativo
      AND inicio_em <= now()
      AND (expira_em IS NULL OR expira_em > now())
      AND (publico = 'todos' OR public.alcanca_modulos_alvo(modulos_alvo))
    )
  );

CREATE POLICY avisos_insert ON public.avisos
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.pode_gerenciar_avisos()));

CREATE POLICY avisos_update ON public.avisos
  FOR UPDATE TO authenticated
  USING ((SELECT public.pode_gerenciar_avisos()))
  WITH CHECK ((SELECT public.pode_gerenciar_avisos()));

CREATE POLICY avisos_delete ON public.avisos
  FOR DELETE TO authenticated
  USING ((SELECT public.pode_gerenciar_avisos()));

REVOKE ALL ON public.avisos FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.avisos TO authenticated;

CREATE TRIGGER trg_avisos_updated_at
  BEFORE UPDATE ON public.avisos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ----------------------------------------------------------------------------
-- 3. avisos_leituras
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.avisos_leituras (
  aviso_id uuid NOT NULL REFERENCES public.avisos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  lido_em timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (aviso_id, user_id)
);

COMMENT ON TABLE public.avisos_leituras IS 'Confirmação de leitura de avisos por usuário.';

CREATE INDEX IF NOT EXISTS idx_avisos_leituras_user ON public.avisos_leituras (user_id);

ALTER TABLE public.avisos_leituras ENABLE ROW LEVEL SECURITY;

-- Cada um vê as suas leituras; o gestor vê todas (contagem de quem leu).
CREATE POLICY avisos_leituras_select ON public.avisos_leituras
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.pode_gerenciar_avisos()));

-- Só registra leitura própria e de aviso que o usuário enxerga (a RLS de avisos vale na subconsulta).
CREATE POLICY avisos_leituras_insert ON public.avisos_leituras
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND (SELECT public.is_active_user())
    AND EXISTS (SELECT 1 FROM public.avisos a WHERE a.id = aviso_id)
  );

CREATE POLICY avisos_leituras_delete ON public.avisos_leituras
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

REVOKE ALL ON public.avisos_leituras FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.avisos_leituras TO authenticated;


-- ----------------------------------------------------------------------------
-- 4. datas_importantes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.datas_importantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL CHECK (char_length(btrim(titulo)) BETWEEN 3 AND 200),
  descricao text CHECK (descricao IS NULL OR char_length(descricao) <= 2000),
  data date NOT NULL,
  data_fim date,
  tipo text NOT NULL DEFAULT 'evento'
    CHECK (tipo IN ('prazo', 'evento', 'reuniao', 'comemorativa', 'outro')),
  recorrente_anual boolean NOT NULL DEFAULT false,
  modulos_alvo public.app_module[] NOT NULL DEFAULT '{}',
  ativo boolean NOT NULL DEFAULT true,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT datas_importantes_periodo_ck CHECK (data_fim IS NULL OR data_fim >= data)
);

COMMENT ON TABLE public.datas_importantes IS
  'Prazos, eventos e datas institucionais. Feriados ficam em dias_nao_uteis. modulos_alvo vazio = todos.';

CREATE INDEX IF NOT EXISTS idx_datas_importantes_data
  ON public.datas_importantes (data) WHERE ativo;

ALTER TABLE public.datas_importantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY datas_importantes_select ON public.datas_importantes
  FOR SELECT TO authenticated
  USING (
    (SELECT public.pode_gerenciar_avisos())
    OR (
      (SELECT public.is_active_user())
      AND ativo
      AND public.alcanca_modulos_alvo(modulos_alvo)
    )
  );

CREATE POLICY datas_importantes_insert ON public.datas_importantes
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.pode_gerenciar_avisos()));

CREATE POLICY datas_importantes_update ON public.datas_importantes
  FOR UPDATE TO authenticated
  USING ((SELECT public.pode_gerenciar_avisos()))
  WITH CHECK ((SELECT public.pode_gerenciar_avisos()));

CREATE POLICY datas_importantes_delete ON public.datas_importantes
  FOR DELETE TO authenticated
  USING ((SELECT public.pode_gerenciar_avisos()));

REVOKE ALL ON public.datas_importantes FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.datas_importantes TO authenticated;

CREATE TRIGGER trg_datas_importantes_updated_at
  BEFORE UPDATE ON public.datas_importantes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ----------------------------------------------------------------------------
-- 5. Aniversariantes do mês (mínimo necessário: nome e dia)
-- ----------------------------------------------------------------------------
-- servidores é restrita ao RH. Esta RPC devolve só nome (social, se houver) e dia do
-- aniversário de servidores ativos — sem ano, CPF, contato ou lotação (LGPD: minimização).
CREATE OR REPLACE FUNCTION public.aniversariantes_do_mes(p_mes integer)
RETURNS TABLE (nome text, dia integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(NULLIF(btrim(s.nome_social), ''), s.nome_completo)::text AS nome,
         EXTRACT(DAY FROM s.data_nascimento)::integer AS dia
  FROM public.servidores s
  WHERE public.is_active_user()
    AND p_mes BETWEEN 1 AND 12
    AND s.situacao = 'ativo'
    AND s.data_nascimento IS NOT NULL
    AND EXTRACT(MONTH FROM s.data_nascimento) = p_mes
  ORDER BY 2, 1;
$$;

REVOKE ALL ON FUNCTION public.aniversariantes_do_mes(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.aniversariantes_do_mes(integer) TO authenticated;
