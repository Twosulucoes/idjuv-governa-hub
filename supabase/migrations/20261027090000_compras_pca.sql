-- ============================================================================
-- COMPRAS — PCA (Plano de Contratações Anual), entrega 1: catálogo, plano, tetos e itens
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-23-compras-gerador-pca-design.md
-- Plano: docs/superpowers/plans/2026-10-23-compras-pca-entrega1.md
--
--   cat_material_pdms        cópia local dos PDMs do CATMAT (grupo → classe → PDM), do portal de dados abertos
--                            do Compras.gov.br; gravada pela Edge Function catalogo-compras (service role).
--   cat_servicos             cópia local do CATSER (seção → divisão → grupo → classe → serviço).
--   cat_material_itens       itens de material já escolhidos num PCA (os 250 mil do portal não são copiados).
--   cat_sincronizacoes       data e total da última atualização de cada parte do catálogo.
--   pca_planos               um PCA por exercício, com situação, processo SEI e datas (transições: entrega 4).
--   pca_tetos                teto previsto na PLOA (ou o QDD, quando chega) por ação orçamentária × fonte.
--   pca_itens                cada demanda lançada por Compras a partir de um DFD do SEI.
--   pca_historico            trilha das inclusões e mudanças (gatilho pca_registrar_historico).
--
-- Leitura: módulo compras E compras.pca.visualizar (ou editar); escrita: compras.pca.editar. Ninguém apaga pela
-- API: o item sai do PCA por situacao = 'excluido'. Permissões novas concedidas a quem já tem compras.criar.
-- Idempotente (IF NOT EXISTS, ON CONFLICT, CREATE OR REPLACE, DROP/CREATE de policies e gatilhos).
-- ============================================================================

SET lock_timeout = '10s';

-- ----------------------------------------------------------------------------
-- 1. Catálogo CATMAT/CATSER
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cat_material_pdms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_pdm integer NOT NULL UNIQUE,
  nome_pdm text NOT NULL,
  codigo_classe integer NOT NULL,
  nome_classe text NOT NULL,
  codigo_grupo integer NOT NULL,
  nome_grupo text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cat_material_pdms_busca ON public.cat_material_pdms
  USING gin (to_tsvector('portuguese', nome_pdm || ' ' || nome_classe));
CREATE INDEX IF NOT EXISTS idx_cat_material_pdms_grupo ON public.cat_material_pdms (codigo_grupo, codigo_classe);
COMMENT ON TABLE public.cat_material_pdms IS
  'PDMs (padrões descritivos de material) do CATMAT, copiados do portal de dados abertos do Compras.gov.br pela Edge Function catalogo-compras.';

CREATE TABLE IF NOT EXISTS public.cat_servicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_servico integer NOT NULL UNIQUE,
  nome_servico text NOT NULL,
  codigo_classe integer,
  nome_classe text,
  codigo_grupo integer,
  nome_grupo text,
  codigo_divisao integer,
  nome_divisao text,
  codigo_secao integer NOT NULL,
  nome_secao text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cat_servicos_busca ON public.cat_servicos
  USING gin (to_tsvector('portuguese', nome_servico || ' ' || coalesce(nome_classe, '')));
CREATE INDEX IF NOT EXISTS idx_cat_servicos_secao ON public.cat_servicos (codigo_secao, codigo_grupo);
COMMENT ON TABLE public.cat_servicos IS
  'Serviços do CATSER, copiados do portal de dados abertos do Compras.gov.br pela Edge Function catalogo-compras.';

CREATE TABLE IF NOT EXISTS public.cat_material_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_item integer NOT NULL UNIQUE,
  codigo_pdm integer NOT NULL REFERENCES public.cat_material_pdms(codigo_pdm),
  descricao text NOT NULL,
  sustentavel boolean NOT NULL DEFAULT false,
  ativo boolean NOT NULL DEFAULT true,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cat_material_itens_pdm ON public.cat_material_itens (codigo_pdm);
COMMENT ON TABLE public.cat_material_itens IS
  'Itens de material do CATMAT já usados num PCA (gravados sob demanda pela Edge Function catalogo-compras).';

CREATE TABLE IF NOT EXISTS public.cat_sincronizacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL UNIQUE CHECK (tipo IN ('pdm', 'servico')),
  total integer NOT NULL DEFAULT 0 CHECK (total >= 0),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_por uuid
);
COMMENT ON TABLE public.cat_sincronizacoes IS 'Última atualização de cada parte do catálogo CATMAT/CATSER.';

-- ----------------------------------------------------------------------------
-- 2. PCA
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pca_planos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercicio integer NOT NULL CHECK (exercicio BETWEEN 2020 AND 2100),
  situacao text NOT NULL DEFAULT 'rascunho' CHECK (situacao IN ('rascunho', 'enviado_sei', 'aprovado', 'publicado')),
  processo_sei text CHECK (char_length(processo_sei) <= 60),
  data_aprovacao date,
  data_publicacao_pncp date,
  observacoes text CHECK (char_length(observacoes) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT pca_planos_exercicio_key UNIQUE (exercicio)
);
COMMENT ON TABLE public.pca_planos IS
  'PCA (Plano de Contratações Anual, Lei 14.133, art. 12, VII): um por exercício. A aprovação é ato do SEI; aqui ficam o número do processo e as datas.';

CREATE TABLE IF NOT EXISTS public.pca_tetos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id uuid NOT NULL REFERENCES public.pca_planos(id),
  acao_id uuid NOT NULL REFERENCES public.fin_acoes_orcamentarias(id),
  fonte_recurso_id uuid NOT NULL REFERENCES public.fin_fontes_recurso(id),
  valor_previsto numeric(15,2) NOT NULL DEFAULT 0 CHECK (valor_previsto >= 0),
  origem text NOT NULL DEFAULT 'ploa' CHECK (origem IN ('ploa', 'qdd')),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT pca_tetos_plano_acao_fonte_key UNIQUE (plano_id, acao_id, fonte_recurso_id)
);
COMMENT ON TABLE public.pca_tetos IS
  'Teto do PCA por ação orçamentária × fonte: o previsto na PLOA, digitado por Compras, ou o QDD do exercício quando chega.';

CREATE TABLE IF NOT EXISTS public.pca_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id uuid NOT NULL REFERENCES public.pca_planos(id),
  numero_sei text NOT NULL CHECK (char_length(btrim(numero_sei)) BETWEEN 1 AND 60),
  setor_id uuid REFERENCES public.estrutura_organizacional(id),
  tipo text NOT NULL CHECK (tipo IN ('material', 'servico')),
  codigo_pdm integer REFERENCES public.cat_material_pdms(codigo_pdm),
  codigo_servico integer REFERENCES public.cat_servicos(codigo_servico),
  codigo_item integer REFERENCES public.cat_material_itens(codigo_item),
  descricao text NOT NULL CHECK (char_length(btrim(descricao)) BETWEEN 1 AND 1000),
  unidade_fornecimento text NOT NULL CHECK (char_length(btrim(unidade_fornecimento)) BETWEEN 1 AND 60),
  quantidade numeric(15,3) NOT NULL CHECK (quantidade > 0),
  valor_unitario numeric(15,2) NOT NULL CHECK (valor_unitario >= 0),
  valor_total numeric(15,2) GENERATED ALWAYS AS (round(quantidade * valor_unitario, 2)) STORED,
  mes_desejado integer NOT NULL CHECK (mes_desejado BETWEEN 1 AND 12),
  prioridade text NOT NULL DEFAULT 'media' CHECK (prioridade IN ('alta', 'media', 'baixa')),
  acao_id uuid NOT NULL REFERENCES public.fin_acoes_orcamentarias(id),
  fonte_recurso_id uuid NOT NULL REFERENCES public.fin_fontes_recurso(id),
  natureza_despesa_id uuid REFERENCES public.fin_naturezas_despesa(id),
  justificativa text CHECK (char_length(justificativa) <= 2000),
  origem text NOT NULL DEFAULT 'dfd' CHECK (origem IN ('dfd', 'sugestao_aceita')),
  situacao text NOT NULL DEFAULT 'ativo' CHECK (situacao IN ('ativo', 'excluido')),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT pca_itens_catalogo_check CHECK (
    (tipo = 'material' AND codigo_pdm IS NOT NULL AND codigo_servico IS NULL)
    OR (tipo = 'servico' AND codigo_servico IS NOT NULL AND codigo_pdm IS NULL AND codigo_item IS NULL)
  )
);
CREATE INDEX IF NOT EXISTS idx_pca_itens_plano ON public.pca_itens (plano_id, situacao);
CREATE INDEX IF NOT EXISTS idx_pca_itens_orcamento ON public.pca_itens (plano_id, acao_id, fonte_recurso_id);
COMMENT ON TABLE public.pca_itens IS
  'Itens do PCA: cada demanda lançada por Compras a partir de um DFD do SEI (numero_sei), com item do CATMAT/CATSER. Sai do PCA por situacao = excluido.';

CREATE TABLE IF NOT EXISTS public.pca_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id uuid NOT NULL REFERENCES public.pca_planos(id),
  item_id uuid REFERENCES public.pca_itens(id),
  acao text NOT NULL CHECK (acao IN ('plano_criado', 'situacao', 'item_incluido', 'item_alterado', 'item_excluido')),
  antes jsonb,
  depois jsonb,
  motivo text,
  feito_por uuid DEFAULT auth.uid(),
  feito_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pca_historico_plano ON public.pca_historico (plano_id, feito_em DESC);
COMMENT ON TABLE public.pca_historico IS 'Trilha do PCA: criação, mudança de situação e inclusão/alteração/exclusão de itens (gatilho).';

ALTER TABLE public.cat_material_pdms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_material_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_sincronizacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pca_planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pca_tetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pca_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pca_historico ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 3. Autoria e trilha
-- ----------------------------------------------------------------------------
-- Antes de gravar: o plano nasce rascunho (as transições são da entrega 4); updated_at/updated_by pelo banco.
CREATE OR REPLACE FUNCTION public.pca_carimbar()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'pca_planos' THEN
      NEW.situacao := 'rascunho';
    END IF;
    NEW.created_by := COALESCE(auth.uid(), NEW.created_by);
  ELSE
    NEW.created_at := OLD.created_at;
    NEW.created_by := OLD.created_by;
  END IF;
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.pca_carimbar() FROM PUBLIC, anon, authenticated;

-- Depois de gravar: registra na trilha (SECURITY DEFINER: ninguém escreve em pca_historico pela API).
CREATE OR REPLACE FUNCTION public.pca_registrar_historico()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_TABLE_NAME = 'pca_planos' THEN
    IF TG_OP = 'INSERT' THEN
      INSERT INTO public.pca_historico (plano_id, acao, depois, feito_por)
      VALUES (NEW.id, 'plano_criado', jsonb_build_object('exercicio', NEW.exercicio), auth.uid());
    ELSIF NEW.situacao IS DISTINCT FROM OLD.situacao THEN
      INSERT INTO public.pca_historico (plano_id, acao, antes, depois, feito_por)
      VALUES (NEW.id, 'situacao', jsonb_build_object('situacao', OLD.situacao), jsonb_build_object('situacao', NEW.situacao),
              auth.uid());
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.pca_historico (plano_id, item_id, acao, depois, feito_por)
    VALUES (NEW.plano_id, NEW.id, 'item_incluido', to_jsonb(NEW), auth.uid());
  ELSIF to_jsonb(NEW) - ARRAY['updated_at', 'updated_by'] IS DISTINCT FROM to_jsonb(OLD) - ARRAY['updated_at', 'updated_by'] THEN
    INSERT INTO public.pca_historico (plano_id, item_id, acao, antes, depois, feito_por)
    VALUES (NEW.plano_id, NEW.id,
            CASE WHEN NEW.situacao = 'excluido' AND OLD.situacao = 'ativo' THEN 'item_excluido' ELSE 'item_alterado' END,
            to_jsonb(OLD), to_jsonb(NEW), auth.uid());
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.pca_registrar_historico() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_pca_planos_carimbar ON public.pca_planos;
CREATE TRIGGER trg_pca_planos_carimbar BEFORE INSERT OR UPDATE ON public.pca_planos
  FOR EACH ROW EXECUTE FUNCTION public.pca_carimbar();
DROP TRIGGER IF EXISTS trg_pca_tetos_carimbar ON public.pca_tetos;
CREATE TRIGGER trg_pca_tetos_carimbar BEFORE INSERT OR UPDATE ON public.pca_tetos
  FOR EACH ROW EXECUTE FUNCTION public.pca_carimbar();
DROP TRIGGER IF EXISTS trg_pca_itens_carimbar ON public.pca_itens;
CREATE TRIGGER trg_pca_itens_carimbar BEFORE INSERT OR UPDATE ON public.pca_itens
  FOR EACH ROW EXECUTE FUNCTION public.pca_carimbar();
DROP TRIGGER IF EXISTS trg_pca_planos_historico ON public.pca_planos;
CREATE TRIGGER trg_pca_planos_historico AFTER INSERT OR UPDATE ON public.pca_planos
  FOR EACH ROW EXECUTE FUNCTION public.pca_registrar_historico();
DROP TRIGGER IF EXISTS trg_pca_itens_historico ON public.pca_itens;
CREATE TRIGGER trg_pca_itens_historico AFTER INSERT OR UPDATE ON public.pca_itens
  FOR EACH ROW EXECUTE FUNCTION public.pca_registrar_historico();

-- ----------------------------------------------------------------------------
-- 4. Permissões compras.pca.visualizar e compras.pca.editar (catálogo) e concessão a quem tem compras.criar
-- ----------------------------------------------------------------------------
INSERT INTO public.module_permissions_catalog (module_code, permission_code, label, category, action_type, sort_order)
VALUES ('compras', 'compras.pca.visualizar', 'Ver o PCA', 'PCA', 'visualizar', 603),
       ('compras', 'compras.pca.editar', 'Editar o PCA', 'PCA', 'editar', 604)
ON CONFLICT (permission_code) DO NOTHING;

INSERT INTO public.role_permissions (role, permission)
SELECT DISTINCT rp.role, p.codigo
  FROM public.role_permissions rp
 CROSS JOIN (VALUES ('compras.pca.visualizar'), ('compras.pca.editar')) p(codigo)
 WHERE rp.permission = 'compras.criar'
ON CONFLICT (role, permission) DO NOTHING;

INSERT INTO public.user_permissions (user_id, permission, created_by)
SELECT up.user_id, p.codigo, up.created_by
  FROM public.user_permissions up
 CROSS JOIN (VALUES ('compras.pca.visualizar'), ('compras.pca.editar')) p(codigo)
 WHERE up.permission = 'compras.criar'
ON CONFLICT (user_id, permission) DO NOTHING;

UPDATE public.user_modules
   SET permissions = permissions || ARRAY(SELECT c FROM unnest(ARRAY['compras.pca.visualizar', 'compras.pca.editar']) c
                                           WHERE NOT (c = ANY (permissions)))
 WHERE 'compras.criar' = ANY (permissions)
   AND NOT (ARRAY['compras.pca.visualizar', 'compras.pca.editar'] <@ permissions);

-- ----------------------------------------------------------------------------
-- 5. RLS (gerado de supabase/baseline/rls/mapa.csv por scripts/db/gerar-rls.mjs)
-- ----------------------------------------------------------------------------
-- cat_material_itens  [permissao: compras]
DROP POLICY IF EXISTS "rls_select" ON public.cat_material_itens;
CREATE POLICY "rls_select" ON public.cat_material_itens FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras')));
DROP POLICY IF EXISTS "rls_insert" ON public.cat_material_itens;
CREATE POLICY "rls_insert" ON public.cat_material_itens FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.pca.editar'));
DROP POLICY IF EXISTS "rls_update" ON public.cat_material_itens;
CREATE POLICY "rls_update" ON public.cat_material_itens FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.pca.editar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.pca.editar'));
DROP POLICY IF EXISTS "rls_delete" ON public.cat_material_itens;

-- cat_material_pdms  [permissao: compras]
DROP POLICY IF EXISTS "rls_select" ON public.cat_material_pdms;
CREATE POLICY "rls_select" ON public.cat_material_pdms FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras')));
DROP POLICY IF EXISTS "rls_insert" ON public.cat_material_pdms;
CREATE POLICY "rls_insert" ON public.cat_material_pdms FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.pca.editar'));
DROP POLICY IF EXISTS "rls_update" ON public.cat_material_pdms;
CREATE POLICY "rls_update" ON public.cat_material_pdms FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.pca.editar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.pca.editar'));
DROP POLICY IF EXISTS "rls_delete" ON public.cat_material_pdms;

-- cat_servicos  [permissao: compras]
DROP POLICY IF EXISTS "rls_select" ON public.cat_servicos;
CREATE POLICY "rls_select" ON public.cat_servicos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras')));
DROP POLICY IF EXISTS "rls_insert" ON public.cat_servicos;
CREATE POLICY "rls_insert" ON public.cat_servicos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.pca.editar'));
DROP POLICY IF EXISTS "rls_update" ON public.cat_servicos;
CREATE POLICY "rls_update" ON public.cat_servicos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.pca.editar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.pca.editar'));
DROP POLICY IF EXISTS "rls_delete" ON public.cat_servicos;

-- cat_sincronizacoes  [permissao: compras]
DROP POLICY IF EXISTS "rls_select" ON public.cat_sincronizacoes;
CREATE POLICY "rls_select" ON public.cat_sincronizacoes FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras')));
DROP POLICY IF EXISTS "rls_insert" ON public.cat_sincronizacoes;
CREATE POLICY "rls_insert" ON public.cat_sincronizacoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.pca.editar'));
DROP POLICY IF EXISTS "rls_update" ON public.cat_sincronizacoes;
CREATE POLICY "rls_update" ON public.cat_sincronizacoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.pca.editar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.pca.editar'));
DROP POLICY IF EXISTS "rls_delete" ON public.cat_sincronizacoes;

-- pca_historico  [trilha: compras]
DROP POLICY IF EXISTS "rls_select" ON public.pca_historico;
CREATE POLICY "rls_select" ON public.pca_historico FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras')));

-- pca_itens  [permissao: compras]
DROP POLICY IF EXISTS "rls_select" ON public.pca_itens;
CREATE POLICY "rls_select" ON public.pca_itens FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'compras')) AND (public.has_permission_code(auth.uid(), 'compras.pca.visualizar') OR public.has_permission_code(auth.uid(), 'compras.pca.editar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.pca_itens;
CREATE POLICY "rls_insert" ON public.pca_itens FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.pca.editar'));
DROP POLICY IF EXISTS "rls_update" ON public.pca_itens;
CREATE POLICY "rls_update" ON public.pca_itens FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.pca.editar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.pca.editar'));
DROP POLICY IF EXISTS "rls_delete" ON public.pca_itens;

-- pca_planos  [permissao: compras]
DROP POLICY IF EXISTS "rls_select" ON public.pca_planos;
CREATE POLICY "rls_select" ON public.pca_planos FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'compras')) AND (public.has_permission_code(auth.uid(), 'compras.pca.visualizar') OR public.has_permission_code(auth.uid(), 'compras.pca.editar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.pca_planos;
CREATE POLICY "rls_insert" ON public.pca_planos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.pca.editar'));
DROP POLICY IF EXISTS "rls_update" ON public.pca_planos;
CREATE POLICY "rls_update" ON public.pca_planos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.pca.editar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.pca.editar'));
DROP POLICY IF EXISTS "rls_delete" ON public.pca_planos;

-- pca_tetos  [permissao: compras]
DROP POLICY IF EXISTS "rls_select" ON public.pca_tetos;
CREATE POLICY "rls_select" ON public.pca_tetos FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'compras')) AND (public.has_permission_code(auth.uid(), 'compras.pca.visualizar') OR public.has_permission_code(auth.uid(), 'compras.pca.editar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.pca_tetos;
CREATE POLICY "rls_insert" ON public.pca_tetos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.pca.editar'));
DROP POLICY IF EXISTS "rls_update" ON public.pca_tetos;
CREATE POLICY "rls_update" ON public.pca_tetos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.pca.editar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.pca.editar'));
DROP POLICY IF EXISTS "rls_delete" ON public.pca_tetos;

