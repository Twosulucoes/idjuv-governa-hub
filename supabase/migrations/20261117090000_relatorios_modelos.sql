-- ============================================================================
-- Modelos do gerador de relatórios dinâmicos
-- ============================================================================
-- O gerador (Financeiro → Relatórios, depois outros módulos) monta o relatório na tela: fonte, colunas, filtros,
-- agrupamentos, totais e ordem. O modelo salvo guarda só essa configuração (jsonb), nunca os dados: quem abre o
-- modelo vê apenas as linhas que as tabelas de origem já deixam ver (RLS delas).
--
--   relatorios_modelos   um modelo por linha; "só meu" (compartilhado = false) ou "do setor" (compartilhado =
--                        true: quem acessa o módulo do modelo vê e usa).
--
-- Leitura: o autor; os compartilhados, por quem acessa o módulo; o admin, todos.
-- Escrita: o autor cria em nome próprio no módulo a que tem acesso e só ele edita; apagar, o autor ou o admin.
-- Spec: docs/superpowers/specs/2026-10-30-gerador-relatorios-design.md
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.relatorios_modelos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo text NOT NULL CHECK (modulo ~ '^[a-z_]{2,40}$'),
  fonte text NOT NULL CHECK (fonte ~ '^[a-z0-9_]{2,60}$'),
  nome text NOT NULL CHECK (char_length(btrim(nome)) BETWEEN 1 AND 120),
  descricao text CHECK (char_length(descricao) <= 500),
  configuracao jsonb NOT NULL CHECK (jsonb_typeof(configuracao) = 'object' AND pg_column_size(configuracao) <= 65536),
  compartilhado boolean NOT NULL DEFAULT false,
  criado_por uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.relatorios_modelos ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.relatorios_modelos IS
  'Modelos do gerador de relatórios dinâmicos: só a configuração (fonte, colunas, filtros, agrupamentos, totais, ordem), nunca os dados.';
COMMENT ON COLUMN public.relatorios_modelos.fonte IS 'Id da fonte no catálogo do front (src/config/relatoriosDinamicos/).';
COMMENT ON COLUMN public.relatorios_modelos.compartilhado IS 'true = do setor: quem acessa o módulo do modelo vê e usa; só o autor edita.';

CREATE INDEX IF NOT EXISTS idx_relatorios_modelos_modulo_fonte ON public.relatorios_modelos (modulo, fonte);
CREATE INDEX IF NOT EXISTS idx_relatorios_modelos_criado_por ON public.relatorios_modelos (criado_por);

DROP TRIGGER IF EXISTS trg_relatorios_modelos_updated_at ON public.relatorios_modelos;
CREATE TRIGGER trg_relatorios_modelos_updated_at
  BEFORE UPDATE ON public.relatorios_modelos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS relatorios_modelos_select ON public.relatorios_modelos;
CREATE POLICY relatorios_modelos_select ON public.relatorios_modelos
  FOR SELECT TO authenticated
  USING (
    (SELECT public.perfil_ativo_atual())
    AND (
      criado_por = (SELECT auth.uid())
      OR (compartilhado AND public.can_access_module((SELECT auth.uid()), modulo))
      OR (SELECT public.is_admin_user())
    )
  );

DROP POLICY IF EXISTS relatorios_modelos_insert ON public.relatorios_modelos;
CREATE POLICY relatorios_modelos_insert ON public.relatorios_modelos
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.perfil_ativo_atual())
    AND criado_por = (SELECT auth.uid())
    AND public.can_access_module((SELECT auth.uid()), modulo)
  );

DROP POLICY IF EXISTS relatorios_modelos_update ON public.relatorios_modelos;
CREATE POLICY relatorios_modelos_update ON public.relatorios_modelos
  FOR UPDATE TO authenticated
  USING ((SELECT public.perfil_ativo_atual()) AND criado_por = (SELECT auth.uid()))
  WITH CHECK (
    (SELECT public.perfil_ativo_atual())
    AND criado_por = (SELECT auth.uid())
    AND public.can_access_module((SELECT auth.uid()), modulo)
  );

DROP POLICY IF EXISTS relatorios_modelos_delete ON public.relatorios_modelos;
CREATE POLICY relatorios_modelos_delete ON public.relatorios_modelos
  FOR DELETE TO authenticated
  USING (
    (SELECT public.perfil_ativo_atual())
    AND (criado_por = (SELECT auth.uid()) OR (SELECT public.is_admin_user()))
  );

REVOKE ALL ON public.relatorios_modelos FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.relatorios_modelos TO authenticated;
