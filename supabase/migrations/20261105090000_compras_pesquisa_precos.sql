-- ============================================================================
-- COMPRAS — pesquisa de preços, entrega 1: pesquisa por processo SEI, itens e amostras com fonte rastreável
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-29-compras-pesquisa-precos-design.md
--
--   pesquisas_precos           uma pesquisa por processo SEI (objeto, finalidade, data de referência, responsáveis);
--                              em andamento ou concluída. Pode apontar para o item do PCA que a originou.
--   pesquisas_precos_itens     cada item cotado: material (item do CATMAT ou tipo de material) ou serviço do CATSER,
--                              unidade, quantidade e, quando não for o sugerido, o método escolhido com justificativa.
--   pesquisas_precos_amostras  cada preço coletado, com o parâmetro do art. 17 do Decreto 39.050-E/2025 (I a V), a
--                              fonte (órgão, UASG, UF, compra ou ata, data, fornecedor, link) e a data e hora da
--                              consulta. O que vem do Compras.gov.br (inciso I) e do PNCP (inciso II) entra pela Edge
--                              Function pesquisa-precos, sem repetir a mesma linha da fonte no item (id_externo).
--                              Desconsiderar à mão exige motivo; o saneamento de ±30% e o CV são calculados na tela
--                              (src/lib/compras/pesquisaPrecos.ts), não gravados.
--   pesquisa_precos_conferir   gatilho: autoria pelo banco, nº SEI sem espaço nas pontas e nada muda em itens ou
--                              amostras de pesquisa concluída (55000).
--
-- Leitura: módulo compras E compras.pesquisa_precos.visualizar (ou editar); escrita: compras.pesquisa_precos.editar.
-- A pesquisa não se apaga pela API; item e amostra apagam com editar (a amostra vai junto com o item). Permissões
-- novas concedidas a quem já tem compras.criar. Idempotente (IF NOT EXISTS, ON CONFLICT, CREATE OR REPLACE,
-- DROP/CREATE de policies e gatilhos).
-- ============================================================================

SET lock_timeout = '10s';

-- ----------------------------------------------------------------------------
-- 1. Tabelas
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pesquisas_precos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_sei text NOT NULL CHECK (char_length(btrim(numero_sei)) BETWEEN 1 AND 60),
  objeto text NOT NULL CHECK (char_length(btrim(objeto)) BETWEEN 1 AND 1000),
  finalidade text NOT NULL DEFAULT 'licitacao'
    CHECK (finalidade IN ('licitacao', 'dispensa', 'inexigibilidade', 'adesao_ata', 'prorrogacao', 'outra')),
  data_referencia date NOT NULL DEFAULT current_date,
  situacao text NOT NULL DEFAULT 'em_andamento' CHECK (situacao IN ('em_andamento', 'concluida')),
  pca_item_id uuid REFERENCES public.pca_itens(id),
  responsaveis text CHECK (char_length(responsaveis) <= 2000),
  observacoes text CHECK (char_length(observacoes) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
CREATE INDEX IF NOT EXISTS idx_pesquisas_precos_sei ON public.pesquisas_precos (numero_sei);
CREATE INDEX IF NOT EXISTS idx_pesquisas_precos_criacao ON public.pesquisas_precos (created_at DESC);
COMMENT ON TABLE public.pesquisas_precos IS
  'Pesquisa de preços (Lei 14.133, art. 23; Decreto RR 39.050-E/2025, arts. 14 a 24) de um processo SEI. data_referencia: data de que contam os prazos de 6 e 12 meses do art. 17 (a divulgação do edital prevista, ou a data da pesquisa).';

CREATE TABLE IF NOT EXISTS public.pesquisas_precos_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pesquisa_id uuid NOT NULL REFERENCES public.pesquisas_precos(id),
  numero integer NOT NULL CHECK (numero BETWEEN 1 AND 9999),
  tipo text NOT NULL CHECK (tipo IN ('material', 'servico')),
  catalogo_campo text CHECK (catalogo_campo IN ('codigoItemCatalogo', 'codigoPdm')),
  codigo_catalogo integer CHECK (codigo_catalogo > 0),
  nome_catalogo text CHECK (char_length(nome_catalogo) <= 1000),
  descricao text NOT NULL CHECK (char_length(btrim(descricao)) BETWEEN 1 AND 2000),
  unidade text NOT NULL CHECK (char_length(btrim(unidade)) BETWEEN 1 AND 60),
  quantidade numeric(15,3) NOT NULL CHECK (quantidade > 0),
  metodo text CHECK (metodo IN ('media', 'mediana', 'menor')),
  justificativa text CHECK (char_length(justificativa) <= 4000),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT pesquisas_precos_itens_catalogo_check CHECK (
    (codigo_catalogo IS NULL AND catalogo_campo IS NULL)
    OR (codigo_catalogo IS NOT NULL AND catalogo_campo = 'codigoItemCatalogo')
    OR (codigo_catalogo IS NOT NULL AND catalogo_campo = 'codigoPdm' AND tipo = 'material')
  )
);
CREATE INDEX IF NOT EXISTS idx_pesquisas_precos_itens_pesquisa ON public.pesquisas_precos_itens (pesquisa_id, numero);
COMMENT ON TABLE public.pesquisas_precos_itens IS
  'Item da pesquisa de preços. codigo_catalogo: item do CATMAT (codigoItemCatalogo), tipo de material (codigoPdm) ou serviço do CATSER. metodo nulo = o do art. 18, § 1º, VII (CV até 30%: média saneada; acima: mediana); outro método ou menos de 3 preços pedem justificativa.';

CREATE TABLE IF NOT EXISTS public.pesquisas_precos_amostras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.pesquisas_precos_itens(id) ON DELETE CASCADE,
  parametro smallint NOT NULL CHECK (parametro BETWEEN 1 AND 5),
  origem text NOT NULL CHECK (origem IN ('compras_gov', 'pncp', 'manual')),
  id_externo text CHECK (char_length(id_externo) <= 200),
  descricao text CHECK (char_length(descricao) <= 2000),
  orgao text CHECK (char_length(orgao) <= 300),
  uasg text CHECK (char_length(uasg) <= 300),
  uf text CHECK (uf ~ '^[A-Z]{2}$'),
  municipio text CHECK (char_length(municipio) <= 120),
  numero_compra text CHECK (char_length(numero_compra) <= 300),
  id_compra text CHECK (char_length(id_compra) <= 60),
  modalidade text CHECK (char_length(modalidade) <= 80),
  data_referencia date,
  fornecedor_nome text CHECK (char_length(fornecedor_nome) <= 300),
  fornecedor_ni text CHECK (fornecedor_ni ~ '^([0-9]{11}|[0-9]{14})$'),
  marca text CHECK (char_length(marca) <= 200),
  unidade text CHECK (char_length(unidade) <= 60),
  quantidade numeric(15,3) CHECK (quantidade > 0),
  preco_unitario numeric(15,4) NOT NULL CHECK (preco_unitario > 0),
  link text CHECK (char_length(link) <= 1000 AND link ~ '^https://'),
  consultado_em timestamptz NOT NULL DEFAULT now(),
  considerada boolean NOT NULL DEFAULT true,
  motivo_desconsideracao text CHECK (char_length(motivo_desconsideracao) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT pesquisas_precos_amostras_item_externo_key UNIQUE (item_id, id_externo),
  -- inciso I vem do Compras.gov.br e o II do PNCP; à mão, qualquer inciso
  CONSTRAINT pesquisas_precos_amostras_origem_parametro_check CHECK (
    (origem = 'compras_gov' AND parametro = 1) OR (origem = 'pncp' AND parametro = 2) OR origem = 'manual'
  ),
  -- art. 17, III: site ou publicação com o endereço; IV e V: fornecedor identificado (CNPJ/CPF e nome)
  CONSTRAINT pesquisas_precos_amostras_fonte_check CHECK (
    (parametro <> 3 OR link IS NOT NULL OR char_length(btrim(coalesce(orgao, ''))) > 0)
    AND (parametro NOT IN (4, 5) OR (fornecedor_ni IS NOT NULL AND char_length(btrim(coalesce(fornecedor_nome, ''))) > 0))
  ),
  CONSTRAINT pesquisas_precos_amostras_motivo_check CHECK (
    considerada OR char_length(btrim(coalesce(motivo_desconsideracao, ''))) > 0
  )
);
CREATE INDEX IF NOT EXISTS idx_pesquisas_precos_amostras_item ON public.pesquisas_precos_amostras (item_id);
COMMENT ON TABLE public.pesquisas_precos_amostras IS
  'Preço coletado na pesquisa, com a fonte rastreável e a data e hora da consulta (consultado_em). parametro = inciso do art. 17 do Decreto 39.050-E/2025. considerada = false tira o preço da série à mão (com motivo); os limites de ±30% são calculados na tela.';

ALTER TABLE public.pesquisas_precos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pesquisas_precos_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pesquisas_precos_amostras ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 2. Autoria e pesquisa concluída
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pesquisa_precos_conferir()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_pesquisa uuid;
  v_item uuid;
BEGIN
  IF TG_TABLE_NAME = 'pesquisas_precos' THEN
    IF TG_OP = 'UPDATE' AND OLD.situacao = 'concluida' AND NEW.situacao = 'concluida'
       AND to_jsonb(NEW) - ARRAY['updated_at', 'updated_by'] IS DISTINCT FROM to_jsonb(OLD) - ARRAY['updated_at', 'updated_by'] THEN
      RAISE EXCEPTION 'Pesquisa de preços concluída: reabra para alterar.' USING ERRCODE = '55000';
    END IF;
    IF TG_OP <> 'DELETE' THEN
      NEW.numero_sei := btrim(NEW.numero_sei);
    END IF;
  ELSE
    -- item ou amostra: a pesquisa (de antes e de depois, se mudou de pai) não pode estar concluída
    IF TG_TABLE_NAME = 'pesquisas_precos_itens' THEN
      FOR v_pesquisa IN SELECT DISTINCT p FROM unnest(ARRAY[
          CASE WHEN TG_OP <> 'INSERT' THEN OLD.pesquisa_id END,
          CASE WHEN TG_OP <> 'DELETE' THEN NEW.pesquisa_id END]) p WHERE p IS NOT NULL LOOP
        IF EXISTS (SELECT 1 FROM public.pesquisas_precos WHERE id = v_pesquisa AND situacao = 'concluida') THEN
          RAISE EXCEPTION 'Pesquisa de preços concluída: reabra para alterar.' USING ERRCODE = '55000';
        END IF;
      END LOOP;
    ELSE
      FOR v_item IN SELECT DISTINCT i FROM unnest(ARRAY[
          CASE WHEN TG_OP <> 'INSERT' THEN OLD.item_id END,
          CASE WHEN TG_OP <> 'DELETE' THEN NEW.item_id END]) i WHERE i IS NOT NULL LOOP
        IF EXISTS (SELECT 1 FROM public.pesquisas_precos_itens it JOIN public.pesquisas_precos p ON p.id = it.pesquisa_id
                    WHERE it.id = v_item AND p.situacao = 'concluida') THEN
          RAISE EXCEPTION 'Pesquisa de preços concluída: reabra para alterar.' USING ERRCODE = '55000';
        END IF;
      END LOOP;
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := COALESCE(auth.uid(), NEW.created_by);
    NEW.created_at := now();
  ELSE
    NEW.created_at := OLD.created_at;
    NEW.created_by := OLD.created_by;
  END IF;
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.pesquisa_precos_conferir() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_pesquisas_precos_conferir ON public.pesquisas_precos;
CREATE TRIGGER trg_pesquisas_precos_conferir BEFORE INSERT OR UPDATE ON public.pesquisas_precos
  FOR EACH ROW EXECUTE FUNCTION public.pesquisa_precos_conferir();
DROP TRIGGER IF EXISTS trg_pesquisas_precos_itens_conferir ON public.pesquisas_precos_itens;
CREATE TRIGGER trg_pesquisas_precos_itens_conferir BEFORE INSERT OR UPDATE OR DELETE ON public.pesquisas_precos_itens
  FOR EACH ROW EXECUTE FUNCTION public.pesquisa_precos_conferir();
DROP TRIGGER IF EXISTS trg_pesquisas_precos_amostras_conferir ON public.pesquisas_precos_amostras;
CREATE TRIGGER trg_pesquisas_precos_amostras_conferir BEFORE INSERT OR UPDATE OR DELETE ON public.pesquisas_precos_amostras
  FOR EACH ROW EXECUTE FUNCTION public.pesquisa_precos_conferir();

-- ----------------------------------------------------------------------------
-- 3. Permissões compras.pesquisa_precos.visualizar e .editar (catálogo) e concessão a quem tem compras.criar
-- ----------------------------------------------------------------------------
INSERT INTO public.module_permissions_catalog (module_code, permission_code, label, category, action_type, sort_order)
VALUES ('compras', 'compras.pesquisa_precos.visualizar', 'Ver as pesquisas de preços', 'Pesquisa de preços', 'visualizar', 607),
       ('compras', 'compras.pesquisa_precos.editar', 'Fazer pesquisas de preços', 'Pesquisa de preços', 'editar', 608)
ON CONFLICT (permission_code) DO NOTHING;

INSERT INTO public.role_permissions (role, permission)
SELECT DISTINCT rp.role, p.codigo
  FROM public.role_permissions rp
 CROSS JOIN (VALUES ('compras.pesquisa_precos.visualizar'), ('compras.pesquisa_precos.editar')) p(codigo)
 WHERE rp.permission = 'compras.criar'
ON CONFLICT (role, permission) DO NOTHING;

INSERT INTO public.user_permissions (user_id, permission, created_by)
SELECT up.user_id, p.codigo, up.created_by
  FROM public.user_permissions up
 CROSS JOIN (VALUES ('compras.pesquisa_precos.visualizar'), ('compras.pesquisa_precos.editar')) p(codigo)
 WHERE up.permission = 'compras.criar'
ON CONFLICT (user_id, permission) DO NOTHING;

UPDATE public.user_modules
   SET permissions = permissions || ARRAY(SELECT c FROM unnest(ARRAY['compras.pesquisa_precos.visualizar', 'compras.pesquisa_precos.editar']) c
                                           WHERE NOT (c = ANY (permissions)))
 WHERE 'compras.criar' = ANY (permissions)
   AND NOT (ARRAY['compras.pesquisa_precos.visualizar', 'compras.pesquisa_precos.editar'] <@ permissions);

-- ----------------------------------------------------------------------------
-- 4. RLS (gerado de supabase/baseline/rls/mapa.csv por scripts/db/gerar-rls.mjs)
-- ----------------------------------------------------------------------------
-- pesquisas_precos  [permissao: compras]
DROP POLICY IF EXISTS "rls_select" ON public.pesquisas_precos;
CREATE POLICY "rls_select" ON public.pesquisas_precos FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'compras')) AND (public.has_permission_code(auth.uid(), 'compras.pesquisa_precos.visualizar') OR public.has_permission_code(auth.uid(), 'compras.pesquisa_precos.editar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.pesquisas_precos;
CREATE POLICY "rls_insert" ON public.pesquisas_precos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.pesquisa_precos.editar'));
DROP POLICY IF EXISTS "rls_update" ON public.pesquisas_precos;
CREATE POLICY "rls_update" ON public.pesquisas_precos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.pesquisa_precos.editar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.pesquisa_precos.editar'));
DROP POLICY IF EXISTS "rls_delete" ON public.pesquisas_precos;

-- pesquisas_precos_amostras  [permissao: compras]
DROP POLICY IF EXISTS "rls_select" ON public.pesquisas_precos_amostras;
CREATE POLICY "rls_select" ON public.pesquisas_precos_amostras FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'compras')) AND (public.has_permission_code(auth.uid(), 'compras.pesquisa_precos.visualizar') OR public.has_permission_code(auth.uid(), 'compras.pesquisa_precos.editar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.pesquisas_precos_amostras;
CREATE POLICY "rls_insert" ON public.pesquisas_precos_amostras FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.pesquisa_precos.editar'));
DROP POLICY IF EXISTS "rls_update" ON public.pesquisas_precos_amostras;
CREATE POLICY "rls_update" ON public.pesquisas_precos_amostras FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.pesquisa_precos.editar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.pesquisa_precos.editar'));
DROP POLICY IF EXISTS "rls_delete" ON public.pesquisas_precos_amostras;
CREATE POLICY "rls_delete" ON public.pesquisas_precos_amostras FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.pesquisa_precos.editar'));

-- pesquisas_precos_itens  [permissao: compras]
DROP POLICY IF EXISTS "rls_select" ON public.pesquisas_precos_itens;
CREATE POLICY "rls_select" ON public.pesquisas_precos_itens FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'compras')) AND (public.has_permission_code(auth.uid(), 'compras.pesquisa_precos.visualizar') OR public.has_permission_code(auth.uid(), 'compras.pesquisa_precos.editar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.pesquisas_precos_itens;
CREATE POLICY "rls_insert" ON public.pesquisas_precos_itens FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.pesquisa_precos.editar'));
DROP POLICY IF EXISTS "rls_update" ON public.pesquisas_precos_itens;
CREATE POLICY "rls_update" ON public.pesquisas_precos_itens FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.pesquisa_precos.editar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.pesquisa_precos.editar'));
DROP POLICY IF EXISTS "rls_delete" ON public.pesquisas_precos_itens;
CREATE POLICY "rls_delete" ON public.pesquisas_precos_itens FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.pesquisa_precos.editar'));

