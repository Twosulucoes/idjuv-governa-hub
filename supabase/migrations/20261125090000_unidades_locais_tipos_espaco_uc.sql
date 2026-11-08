-- ============================================================================
-- UNIDADES LOCAIS — tipos de espaço cadastráveis e UC de energia (teste do Inventário de 07/11/2026, I3)
-- ============================================================================
-- Decisões do dono em 2026-11-08: os tipos de espaço ficam numa área de cadastro (não numa lista fixa) e as unidades
-- que hoje estão como "Outro" são reclassificadas pelo nome.
--
--   unidades_locais_tipos_espaco  os tipos de espaço (Ginásio, Campo de futebol, Praça...), cadastrados em
--                                 Unidades Locais → Tipos de espaço. tipo_base liga cada tipo a um valor do enum
--                                 antigo tipo_unidade_local, que continua na tabela porque códigos (GIN, EST...),
--                                 views e relatórios ainda leem dele; um tipo novo cai em 'outro'.
--   unidades_locais.tipo_espaco_id  o tipo da unidade. O gatilho mantém tipo_unidade = tipo_base do tipo escolhido e,
--                                 quando só tipo_unidade vem (app de coleta, importação KML), escolhe o tipo padrão.
--   unidades_locais.uc_energia    número da unidade consumidora na distribuidora de energia, para cruzar com a conta
--                                 de luz. Copiado das Observações administrativas quando ali houver "UC <número>"
--                                 (o texto das observações não muda).
--
-- Dados: só preenche o que está vazio (tipo_espaco_id nulo, uc_energia nulo) e reclassifica só unidades com o tipo
-- "Outro". Toda escrita tem WHERE (produção tem pg_safeupdate). Nenhuma policy existente muda. Idempotente.
-- ============================================================================

SET lock_timeout = '10s';

-- ----------------------------------------------------------------------------
-- 1. Tabela dos tipos de espaço
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.unidades_locais_tipos_espaco (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE,
  nome text NOT NULL CHECK (char_length(btrim(nome)) BETWEEN 2 AND 80),
  tipo_base public.tipo_unidade_local NOT NULL DEFAULT 'outro',
  ativo boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 500,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
ALTER TABLE public.unidades_locais_tipos_espaco ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.unidades_locais_tipos_espaco IS
  'Tipos de espaço das Unidades Locais (Ginásio, Campo de futebol, Praça...), cadastrados pelo módulo. tipo_base liga ao enum antigo tipo_unidade_local, que unidades_locais.tipo_unidade ainda guarda.';
COMMENT ON COLUMN public.unidades_locais_tipos_espaco.codigo IS
  'Código fixo dos tipos que vieram com o sistema (o mesmo do enum ou um apelido); tipos cadastrados depois ficam sem código.';
COMMENT ON COLUMN public.unidades_locais_tipos_espaco.tipo_base IS
  'Valor do enum tipo_unidade_local gravado em unidades_locais.tipo_unidade quando a unidade usa este tipo.';

CREATE UNIQUE INDEX IF NOT EXISTS uq_unidades_locais_tipos_espaco_nome
  ON public.unidades_locais_tipos_espaco (lower(btrim(nome)));

DROP TRIGGER IF EXISTS update_unidades_locais_tipos_espaco_updated_at ON public.unidades_locais_tipos_espaco;
CREATE TRIGGER update_unidades_locais_tipos_espaco_updated_at BEFORE UPDATE ON public.unidades_locais_tipos_espaco
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tipos que vêm com o sistema: os sete do enum e os cinco que faltavam no teste de 07/11.
INSERT INTO public.unidades_locais_tipos_espaco (codigo, nome, tipo_base, ordem) VALUES
  ('ginasio',          'Ginásio',            'ginasio',         10),
  ('estadio',          'Estádio',            'estadio',         20),
  ('parque_aquatico',  'Parque Aquático',    'parque_aquatico', 30),
  ('piscina',          'Piscina',            'piscina',         40),
  ('complexo',         'Complexo Esportivo', 'complexo',        50),
  ('quadra',           'Quadra',             'quadra',          60),
  ('campo_futebol',    'Campo de futebol',   'outro',           70),
  ('parque',           'Parque',             'outro',           80),
  ('praca',            'Praça',              'outro',           90),
  ('casa_apoio',       'Casa de apoio',      'outro',          100),
  ('estacionamento',   'Estacionamento',     'outro',          110),
  ('outro',            'Outro',              'outro',          999)
ON CONFLICT (codigo) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. Colunas novas em unidades_locais
-- ----------------------------------------------------------------------------
ALTER TABLE public.unidades_locais
  ADD COLUMN IF NOT EXISTS tipo_espaco_id uuid REFERENCES public.unidades_locais_tipos_espaco(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS uc_energia text;

COMMENT ON COLUMN public.unidades_locais.tipo_espaco_id IS
  'Tipo de espaço da unidade (unidades_locais_tipos_espaco). O gatilho fn_unidades_locais_tipo_espaco mantém tipo_unidade = tipo_base.';
COMMENT ON COLUMN public.unidades_locais.uc_energia IS
  'Número da unidade consumidora (UC) na distribuidora de energia, para cruzar com a conta de luz.';

CREATE INDEX IF NOT EXISTS idx_unidades_locais_tipo_espaco ON public.unidades_locais (tipo_espaco_id);

-- ----------------------------------------------------------------------------
-- 3. Gatilho: tipo_espaco_id e tipo_unidade sempre de acordo
-- ----------------------------------------------------------------------------
-- O nome começa por "a_" para rodar antes de tr_gerar_codigo_unidade_local (gatilhos BEFORE rodam pela ordem do
-- nome), que monta o código da unidade a partir de tipo_unidade.
CREATE OR REPLACE FUNCTION public.fn_unidades_locais_tipo_espaco()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_base public.tipo_unidade_local;
BEGIN
  IF NEW.tipo_espaco_id IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.tipo_espaco_id IS DISTINCT FROM OLD.tipo_espaco_id) THEN
    SELECT t.tipo_base INTO v_base FROM public.unidades_locais_tipos_espaco t WHERE t.id = NEW.tipo_espaco_id;
    IF FOUND THEN
      NEW.tipo_unidade := v_base;
    END IF;
  ELSIF NEW.tipo_espaco_id IS NULL
     OR (TG_OP = 'UPDATE' AND NEW.tipo_unidade IS DISTINCT FROM OLD.tipo_unidade) THEN
    -- Só veio tipo_unidade (app de coleta, KML, tela antiga): usa o tipo padrão daquele valor do enum.
    SELECT t.id INTO NEW.tipo_espaco_id
      FROM public.unidades_locais_tipos_espaco t
     WHERE t.codigo = NEW.tipo_unidade::text;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.fn_unidades_locais_tipo_espaco() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS a_unidades_locais_tipo_espaco ON public.unidades_locais;
CREATE TRIGGER a_unidades_locais_tipo_espaco BEFORE INSERT OR UPDATE OF tipo_espaco_id, tipo_unidade
  ON public.unidades_locais FOR EACH ROW EXECUTE FUNCTION public.fn_unidades_locais_tipo_espaco();

-- ----------------------------------------------------------------------------
-- 4. Dados: tipo de espaço das unidades existentes, reclassificação das "Outro" e UC de energia
-- ----------------------------------------------------------------------------
UPDATE public.unidades_locais u
   SET tipo_espaco_id = t.id
  FROM public.unidades_locais_tipos_espaco t
 WHERE u.tipo_espaco_id IS NULL
   AND t.codigo = u.tipo_unidade::text;

-- Unidades "Outro" ganham o tipo pelo nome, na ordem abaixo (a primeira regra que casa vale: "Estacionamento do
-- Parque..." é Estacionamento).
DO $$
DECLARE
  v_outro uuid := (SELECT id FROM public.unidades_locais_tipos_espaco WHERE codigo = 'outro');
  r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      (1, 'estacionamento', '\mestacionamento'),
      (2, 'casa_apoio',     '\mcasa\s+de\s+apoio\M'),
      (3, 'praca',          '\mpra[çc]a\M'),
      (4, 'campo_futebol',  '\mcampo\M'),
      (5, 'parque',         '\mparque\M')
    ) AS regra(ordem, codigo, padrao)
    ORDER BY ordem
  LOOP
    UPDATE public.unidades_locais u
       SET tipo_espaco_id = (SELECT id FROM public.unidades_locais_tipos_espaco WHERE codigo = r.codigo)
     WHERE u.tipo_espaco_id = v_outro
       AND u.nome_unidade ~* r.padrao;
  END LOOP;
END;
$$;

-- "UC 1234567", "UC: 123.456-7", "UC nº 1234567", "Unidade consumidora 1234567" nas observações viram a UC de energia.
UPDATE public.unidades_locais u
   SET uc_energia = substring(u.observacoes from '(?i)(?:\muc\M|unidade\s+consumidora)[^0-9]{0,12}([0-9][0-9./-]{2,}[0-9])')
 WHERE u.uc_energia IS NULL
   AND u.observacoes ~ '(?i)(?:\muc\M|unidade\s+consumidora)[^0-9]{0,12}[0-9][0-9./-]{2,}[0-9]';

-- ----------------------------------------------------------------------------
-- 5. RLS (gerado de supabase/baseline/rls/mapa.csv por scripts/db/gerar-rls.mjs)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "rls_select" ON public.unidades_locais_tipos_espaco;
CREATE POLICY "rls_select" ON public.unidades_locais_tipos_espaco FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')) OR public.can_access_module(auth.uid(), 'patrimonio_mobile'));
DROP POLICY IF EXISTS "rls_insert" ON public.unidades_locais_tipos_espaco;
CREATE POLICY "rls_insert" ON public.unidades_locais_tipos_espaco FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')) AND public.has_permission_code(auth.uid(), 'unidades.gerenciar'));
DROP POLICY IF EXISTS "rls_update" ON public.unidades_locais_tipos_espaco;
CREATE POLICY "rls_update" ON public.unidades_locais_tipos_espaco FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')) AND public.has_permission_code(auth.uid(), 'unidades.gerenciar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio')) AND public.has_permission_code(auth.uid(), 'unidades.gerenciar'));
DROP POLICY IF EXISTS "rls_delete" ON public.unidades_locais_tipos_espaco;
CREATE POLICY "rls_delete" ON public.unidades_locais_tipos_espaco FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio')) AND public.has_permission_code(auth.uid(), 'unidades.gerenciar'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.unidades_locais_tipos_espaco TO authenticated;
