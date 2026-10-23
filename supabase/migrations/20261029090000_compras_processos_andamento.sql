-- ============================================================================
-- COMPRAS — processos de contratação, entrega 1: etapa, setor, andamento e carga por planilha
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-23-compras-processos-reserva-natureza-design.md
-- Plano: docs/superpowers/plans/2026-10-23-compras-processos-entrega1.md
--
--   processos_licitatorios       já existia (contratos, atas e solicitações apontam para ela). Ganha etapa,
--                                setor_atual, situacao_atual, atualizado_em e valor_estimado_obs; modalidade
--                                aceita vazio ("a definir") e o tipo ganha adesao_ata. Nº SEI gravado sem espaços
--                                nas pontas. As policies dela NÃO mudam (por módulo: compras ou contratos).
--   processo_andamentos          linha do tempo do processo no SEI (data, etapa, setor, situação). A movimentação
--                                mais recente é copiada para o processo (gatilho processo_andamento_no_processo).
--   processo_empenhos            empenhos do FIP 614 ligados pelo nº SEI, para quem vê processos (fin_empenhos é
--                                do financeiro e a RLS dela não muda; a função devolve só o que a tela usa).
--   importar_processos_planilha  carga da planilha de acompanhamento (simulação e aplicação tudo ou nada).
--
-- Leitura do andamento: módulo compras E compras.processos.visualizar (ou editar); escrita: compras.processos.editar;
-- ninguém apaga pela API. Permissões novas concedidas a quem já tem compras.criar.
-- Idempotente (IF NOT EXISTS, ON CONFLICT, CREATE OR REPLACE, DROP/CREATE de policies e gatilhos).
-- ============================================================================

SET lock_timeout = '10s';

-- ----------------------------------------------------------------------------
-- 1. processos_licitatorios: colunas novas
-- ----------------------------------------------------------------------------
-- ADD VALUE dentro da transação é aceito (PG 12+) desde que o valor novo não seja usado nela; esta migração não o usa.
ALTER TYPE public.modalidade_licitacao ADD VALUE IF NOT EXISTS 'adesao_ata';

ALTER TABLE public.processos_licitatorios ALTER COLUMN modalidade DROP NOT NULL;

ALTER TABLE public.processos_licitatorios
  ADD COLUMN IF NOT EXISTS etapa text NOT NULL DEFAULT 'abertura',
  ADD COLUMN IF NOT EXISTS setor_atual text,
  ADD COLUMN IF NOT EXISTS situacao_atual text,
  ADD COLUMN IF NOT EXISTS atualizado_em date,
  ADD COLUMN IF NOT EXISTS valor_estimado_obs text;

ALTER TABLE public.processos_licitatorios DROP CONSTRAINT IF EXISTS processos_licitatorios_etapa_check;
ALTER TABLE public.processos_licitatorios ADD CONSTRAINT processos_licitatorios_etapa_check CHECK (etapa = ANY (ARRAY[
  'abertura', 'dfd', 'etp', 'tr', 'cotacao', 'levantamento_tecnico', 'instrucao_adesao', 'analise_juridica',
  'selecao', 'contrato', 'execucao', 'encerrado', 'cancelado']));

COMMENT ON COLUMN public.processos_licitatorios.etapa IS
  'Etapa atual do processo (lista da planilha de acompanhamento); copiada da movimentação mais recente em processo_andamentos.';
COMMENT ON COLUMN public.processos_licitatorios.setor_atual IS 'Setor onde o processo está no SEI (ex.: IDJUV/PRESI/DIRAF/EPC).';
COMMENT ON COLUMN public.processos_licitatorios.atualizado_em IS 'Data da última movimentação com data informada.';

CREATE INDEX IF NOT EXISTS idx_processos_licitatorios_etapa ON public.processos_licitatorios (ano, etapa);

-- Nº SEI sem espaço nas pontas (a planilha trouxe " 17302.000107/2026.01"); o empenho do FIP 614 casa por ele.
CREATE OR REPLACE FUNCTION public.processo_licitatorio_normalizar()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.numero_processo := btrim(NEW.numero_processo);
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.processo_licitatorio_normalizar() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_processos_licitatorios_normalizar ON public.processos_licitatorios;
CREATE TRIGGER trg_processos_licitatorios_normalizar BEFORE INSERT OR UPDATE OF numero_processo
  ON public.processos_licitatorios FOR EACH ROW EXECUTE FUNCTION public.processo_licitatorio_normalizar();

UPDATE public.processos_licitatorios SET numero_processo = btrim(numero_processo)
 WHERE numero_processo IS DISTINCT FROM btrim(numero_processo);

-- ----------------------------------------------------------------------------
-- 2. processo_andamentos
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.processo_andamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id uuid NOT NULL REFERENCES public.processos_licitatorios(id) ON DELETE CASCADE,
  data date NOT NULL,
  data_informada boolean NOT NULL DEFAULT true,
  etapa text NOT NULL CHECK (etapa = ANY (ARRAY[
    'abertura', 'dfd', 'etp', 'tr', 'cotacao', 'levantamento_tecnico', 'instrucao_adesao', 'analise_juridica',
    'selecao', 'contrato', 'execucao', 'encerrado', 'cancelado'])),
  setor text CHECK (setor IS NULL OR char_length(setor) <= 200),
  situacao text NOT NULL CHECK (char_length(btrim(situacao)) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid()
);
ALTER TABLE public.processo_andamentos ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.processo_andamentos IS
  'Andamento do processo de contratação no SEI (uma linha por movimentação). data_informada = false: a planilha não trazia a data e foi usada a da carga.';

CREATE INDEX IF NOT EXISTS idx_processo_andamentos_processo ON public.processo_andamentos (processo_id, data DESC, created_at DESC);

-- Depois de inserir: se for a movimentação mais recente, vira o estado atual do processo. SECURITY DEFINER para não
-- depender da policy de UPDATE do processo (quem chega aqui já passou pela de INSERT do andamento).
CREATE OR REPLACE FUNCTION public.processo_andamento_no_processo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.processo_andamentos a
                  WHERE a.processo_id = NEW.processo_id AND a.id <> NEW.id AND a.data > NEW.data) THEN
    UPDATE public.processos_licitatorios
       SET etapa = NEW.etapa,
           setor_atual = COALESCE(NEW.setor, setor_atual),
           situacao_atual = NEW.situacao,
           atualizado_em = CASE WHEN NEW.data_informada THEN NEW.data ELSE atualizado_em END,
           updated_at = now()
     WHERE id = NEW.processo_id;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.processo_andamento_no_processo() FROM PUBLIC, anon, authenticated;

-- Antes de inserir: autoria pelo banco.
CREATE OR REPLACE FUNCTION public.processo_andamento_carimbar()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.created_by := COALESCE(auth.uid(), NEW.created_by);
  NEW.created_at := now();
  NEW.setor := NULLIF(btrim(NEW.setor), '');
  NEW.situacao := btrim(NEW.situacao);
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.processo_andamento_carimbar() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_processo_andamentos_carimbar ON public.processo_andamentos;
CREATE TRIGGER trg_processo_andamentos_carimbar BEFORE INSERT ON public.processo_andamentos
  FOR EACH ROW EXECUTE FUNCTION public.processo_andamento_carimbar();
DROP TRIGGER IF EXISTS trg_processo_andamentos_no_processo ON public.processo_andamentos;
CREATE TRIGGER trg_processo_andamentos_no_processo AFTER INSERT ON public.processo_andamentos
  FOR EACH ROW EXECUTE FUNCTION public.processo_andamento_no_processo();

-- ----------------------------------------------------------------------------
-- 3. Permissões compras.processos.visualizar e compras.processos.editar e concessão a quem tem compras.criar
-- ----------------------------------------------------------------------------
INSERT INTO public.module_permissions_catalog (module_code, permission_code, label, category, action_type, sort_order)
VALUES ('compras', 'compras.processos.visualizar', 'Ver processos de contratação', 'Processos', 'visualizar', 605),
       ('compras', 'compras.processos.editar', 'Editar processos de contratação', 'Processos', 'editar', 606)
ON CONFLICT (permission_code) DO NOTHING;

INSERT INTO public.role_permissions (role, permission)
SELECT DISTINCT rp.role, p.codigo
  FROM public.role_permissions rp
 CROSS JOIN (VALUES ('compras.processos.visualizar'), ('compras.processos.editar')) p(codigo)
 WHERE rp.permission = 'compras.criar'
ON CONFLICT (role, permission) DO NOTHING;

INSERT INTO public.user_permissions (user_id, permission, created_by)
SELECT up.user_id, p.codigo, up.created_by
  FROM public.user_permissions up
 CROSS JOIN (VALUES ('compras.processos.visualizar'), ('compras.processos.editar')) p(codigo)
 WHERE up.permission = 'compras.criar'
ON CONFLICT (user_id, permission) DO NOTHING;

UPDATE public.user_modules
   SET permissions = permissions || ARRAY(SELECT c FROM unnest(ARRAY['compras.processos.visualizar', 'compras.processos.editar']) c
                                           WHERE NOT (c = ANY (permissions)))
 WHERE 'compras.criar' = ANY (permissions)
   AND NOT (ARRAY['compras.processos.visualizar', 'compras.processos.editar'] <@ permissions);

-- ----------------------------------------------------------------------------
-- 4. Empenhos ligados ao processo pelo nº SEI
-- ----------------------------------------------------------------------------
-- _processo_id NULL: todos os processos (a lista soma o empenhado por processo).
CREATE OR REPLACE FUNCTION public.processo_empenhos(_processo_id uuid DEFAULT NULL)
RETURNS TABLE (
  processo_id uuid,
  empenho_id uuid,
  numero text,
  exercicio integer,
  data_empenho date,
  natureza text,
  fonte text,
  credor text,
  valor_empenhado numeric,
  valor_anulado numeric,
  valor_liquidado numeric,
  valor_pago numeric
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT COALESCE(public.can_access_module(auth.uid(), 'compras')
                  AND (public.has_permission_code(auth.uid(), 'compras.processos.visualizar')
                       OR public.has_permission_code(auth.uid(), 'compras.processos.editar')), false) THEN
    RAISE EXCEPTION 'Requer a permissão de ver processos de contratação.' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT p.id, e.id, e.numero::text, e.exercicio, e.data_empenho,
         nd.codigo::text, fr.codigo::text, e.credor_nome,
         e.valor_empenhado, COALESCE(e.valor_anulado, 0), COALESCE(e.valor_liquidado, 0), COALESCE(e.valor_pago, 0)
    FROM public.processos_licitatorios p
    JOIN public.fin_empenhos e ON btrim(e.processo_sei) = p.numero_processo
    LEFT JOIN public.fin_naturezas_despesa nd ON nd.id = e.natureza_despesa_id
    LEFT JOIN public.fin_fontes_recurso fr ON fr.id = e.fonte_recurso_id
   WHERE _processo_id IS NULL OR p.id = _processo_id
   ORDER BY e.data_empenho DESC, e.numero;
END;
$$;
REVOKE ALL ON FUNCTION public.processo_empenhos(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.processo_empenhos(uuid) TO authenticated;

-- ----------------------------------------------------------------------------
-- 5. importar_processos_planilha
-- ----------------------------------------------------------------------------
-- p_linhas: array de {indice, numero_processo, ano, objeto, objeto_resumido, modalidade (ou null), etapa, setor_atual,
--   situacao_atual, atualizado_em (AAAA-MM-DD ou null), valor_estimado (número ou null), valor_estimado_obs,
--   andamentos [{data (ou null), etapa, setor, situacao}]} já normalizado pelo front.
-- Processo novo: inserido com os dados da linha. Processo existente (mesmo nº SEI): só os campos vazios são
-- preenchidos; nada é apagado. Movimentação: inserida se ainda não existe igual (data, etapa, setor e situação; sem
-- data, compara só etapa, setor e situação entre as sem data). Mesma técnica de importar_portarias_planilha: cada
-- linha num savepoint; simulação ou qualquer erro desfaz tudo (SQLSTATE próprio 'PRI01'); só a aplicação sem erro
-- vai para importacoes.
CREATE OR REPLACE FUNCTION public.importar_processos_planilha(
  p_linhas jsonb,
  p_arquivo jsonb,
  p_simular boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_linha jsonb;
  v_and jsonb;
  v_ind integer;
  v_num text;
  v_proc public.processos_licitatorios%ROWTYPE;
  v_id uuid;
  v_acao text;
  v_mudancas jsonb;
  v_novos integer;
  v_data date;
  v_setor text;
  v_sit text;
  v_numeros text[] := '{}';
  v_linhas_res jsonb := '[]'::jsonb;
  v_erros jsonb := '[]'::jsonb;
  v_detalhes jsonb := '[]'::jsonb;
  v_ins integer := 0; v_atu integer := 0; v_igual integer := 0;
  v_totais jsonb;
  v_import_id uuid;
BEGIN
  p_simular := COALESCE(p_simular, true);

  IF v_uid IS NULL
     OR NOT COALESCE(public.perfil_ativo_atual()
                     AND public.can_access_module(v_uid, 'compras')
                     AND public.has_permission_code(v_uid, 'compras.processos.editar'), false) THEN
    RAISE EXCEPTION 'Sem permissão para importar processos (compras.processos.editar).' USING ERRCODE = '42501';
  END IF;

  IF jsonb_typeof(p_linhas) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_linhas) NOT BETWEEN 1 AND 1000 THEN
    RAISE EXCEPTION 'Envie de 1 a 1000 processos.' USING ERRCODE = '22023';
  END IF;
  IF NOT p_simular AND (
       char_length(COALESCE(p_arquivo->>'nome', '')) NOT BETWEEN 1 AND 255
       OR COALESCE(p_arquivo->>'sha256', '') !~ '^[0-9a-f]{64}$'
       OR COALESCE(p_arquivo->>'tamanho', '') !~ '^\d{1,15}$') THEN
    RAISE EXCEPTION 'Dados do arquivo inválidos.' USING ERRCODE = '22023';
  END IF;

  BEGIN
    FOR v_linha IN SELECT value FROM jsonb_array_elements(p_linhas) LOOP
      v_ind := COALESCE((v_linha->>'indice')::integer, -1);
      v_num := btrim(COALESCE(v_linha->>'numero_processo', ''));
      BEGIN
        IF v_num = '' THEN
          RAISE EXCEPTION 'Sem número do processo SEI.' USING ERRCODE = '22023';
        END IF;
        IF NULLIF(btrim(v_linha->>'objeto'), '') IS NULL THEN
          RAISE EXCEPTION 'Processo % sem objeto.', v_num USING ERRCODE = '22023';
        END IF;
        IF v_num = ANY (v_numeros) THEN
          RAISE EXCEPTION 'Processo % repetido na planilha.', v_num USING ERRCODE = '22023';
        END IF;
        v_numeros := v_numeros || v_num;
        v_mudancas := '{}'::jsonb;

        SELECT * INTO v_proc FROM public.processos_licitatorios WHERE numero_processo = v_num FOR UPDATE;
        IF NOT FOUND THEN
          INSERT INTO public.processos_licitatorios
            (numero_processo, ano, objeto, objeto_resumido, modalidade, etapa, setor_atual, situacao_atual,
             atualizado_em, valor_estimado, valor_estimado_obs, created_by, updated_by)
          VALUES
            (v_num,
             COALESCE((v_linha->>'ano')::integer, EXTRACT(year FROM CURRENT_DATE)::integer),
             NULLIF(btrim(v_linha->>'objeto'), ''),
             left(NULLIF(btrim(v_linha->>'objeto_resumido'), ''), 500),
             NULLIF(v_linha->>'modalidade', '')::public.modalidade_licitacao,
             COALESCE(NULLIF(v_linha->>'etapa', ''), 'abertura'),
             NULLIF(btrim(v_linha->>'setor_atual'), ''),
             NULLIF(btrim(v_linha->>'situacao_atual'), ''),
             (v_linha->>'atualizado_em')::date,
             (v_linha->>'valor_estimado')::numeric(15,2),
             NULLIF(btrim(v_linha->>'valor_estimado_obs'), ''),
             v_uid, v_uid)
          RETURNING id INTO v_id;
          v_acao := 'inserir';
        ELSE
          v_id := v_proc.id;
          IF v_proc.objeto_resumido IS NULL AND NULLIF(btrim(v_linha->>'objeto_resumido'), '') IS NOT NULL THEN
            v_mudancas := v_mudancas || jsonb_build_object('objeto_resumido', jsonb_build_array(NULL, v_linha->>'objeto_resumido'));
          END IF;
          IF v_proc.modalidade IS NULL AND NULLIF(v_linha->>'modalidade', '') IS NOT NULL THEN
            v_mudancas := v_mudancas || jsonb_build_object('modalidade', jsonb_build_array(NULL, v_linha->>'modalidade'));
          END IF;
          IF v_proc.valor_estimado IS NULL AND v_linha->>'valor_estimado' IS NOT NULL THEN
            v_mudancas := v_mudancas || jsonb_build_object('valor_estimado', jsonb_build_array(NULL, (v_linha->>'valor_estimado')::numeric));
          END IF;
          IF v_proc.valor_estimado_obs IS NULL AND NULLIF(btrim(v_linha->>'valor_estimado_obs'), '') IS NOT NULL THEN
            v_mudancas := v_mudancas || jsonb_build_object('valor_estimado_obs', jsonb_build_array(NULL, v_linha->>'valor_estimado_obs'));
          END IF;
          IF v_proc.setor_atual IS NULL AND NULLIF(btrim(v_linha->>'setor_atual'), '') IS NOT NULL THEN
            v_mudancas := v_mudancas || jsonb_build_object('setor_atual', jsonb_build_array(NULL, v_linha->>'setor_atual'));
          END IF;
          IF v_mudancas <> '{}'::jsonb THEN
            UPDATE public.processos_licitatorios
               SET objeto_resumido = COALESCE(objeto_resumido, left(NULLIF(btrim(v_linha->>'objeto_resumido'), ''), 500)),
                   modalidade = COALESCE(modalidade, NULLIF(v_linha->>'modalidade', '')::public.modalidade_licitacao),
                   valor_estimado = COALESCE(valor_estimado, (v_linha->>'valor_estimado')::numeric(15,2)),
                   valor_estimado_obs = COALESCE(valor_estimado_obs, NULLIF(btrim(v_linha->>'valor_estimado_obs'), '')),
                   setor_atual = COALESCE(setor_atual, NULLIF(btrim(v_linha->>'setor_atual'), '')),
                   updated_at = now(), updated_by = v_uid
             WHERE id = v_id;
          END IF;
          v_acao := 'sem_alteracao';
        END IF;

        -- Movimentações, da mais antiga para a mais nova (as sem data por último), para o gatilho deixar no
        -- processo a mais recente.
        v_novos := 0;
        FOR v_and IN
          SELECT value FROM jsonb_array_elements(COALESCE(v_linha->'andamentos', '[]'::jsonb))
           ORDER BY (value->>'data') NULLS LAST
        LOOP
          v_data := (v_and->>'data')::date;
          v_setor := NULLIF(btrim(v_and->>'setor'), '');
          v_sit := btrim(COALESCE(v_and->>'situacao', ''));
          IF NOT EXISTS (
            SELECT 1 FROM public.processo_andamentos a
             WHERE a.processo_id = v_id
               AND a.etapa = v_and->>'etapa'
               AND a.setor IS NOT DISTINCT FROM v_setor
               AND a.situacao = v_sit
               AND (CASE WHEN v_data IS NULL THEN NOT a.data_informada ELSE a.data_informada AND a.data = v_data END)
          ) THEN
            INSERT INTO public.processo_andamentos (processo_id, data, data_informada, etapa, setor, situacao)
            VALUES (v_id, COALESCE(v_data, CURRENT_DATE), v_data IS NOT NULL, v_and->>'etapa', v_setor, v_sit);
            v_novos := v_novos + 1;
          END IF;
        END LOOP;
        IF v_novos > 0 AND v_acao <> 'inserir' THEN
          v_mudancas := v_mudancas || jsonb_build_object('andamentos', jsonb_build_array(NULL, format('%s movimentação(ões) nova(s)', v_novos)));
        END IF;
        IF v_acao <> 'inserir' AND v_mudancas <> '{}'::jsonb THEN
          v_acao := 'atualizar';
        END IF;

        CASE v_acao WHEN 'inserir' THEN v_ins := v_ins + 1; WHEN 'atualizar' THEN v_atu := v_atu + 1; ELSE v_igual := v_igual + 1; END CASE;
        v_linhas_res := v_linhas_res || jsonb_build_object('indice', v_ind, 'acao', v_acao,
          'mudancas', CASE WHEN v_mudancas <> '{}'::jsonb THEN v_mudancas END);
        v_detalhes := v_detalhes || jsonb_build_object('indice', v_ind, 'numero_processo', v_num, 'acao', v_acao,
          'processo_id', v_id, 'andamentos_novos', v_novos);
      EXCEPTION
        WHEN OTHERS THEN
          v_erros := v_erros || jsonb_build_object('indice', v_ind, 'mensagem',
            CASE WHEN left(SQLSTATE, 2) IN ('22', '23') OR SQLSTATE IN ('P0001', '42501') THEN SQLERRM
                 ELSE format('Erro inesperado ao gravar a linha (código %s).', SQLSTATE) END);
      END;
    END LOOP;

    IF p_simular OR jsonb_array_length(v_erros) > 0 THEN
      RAISE EXCEPTION 'importação desfeita' USING ERRCODE = 'PRI01';
    END IF;
  EXCEPTION
    WHEN SQLSTATE 'PRI01' THEN NULL;  -- desfaz tudo o que as linhas gravaram; as variáveis continuam valendo
  END;

  v_totais := jsonb_build_object('inserir', v_ins, 'atualizar', v_atu, 'sem_alteracao', v_igual);

  IF NOT p_simular AND jsonb_array_length(v_erros) = 0 THEN
    INSERT INTO public.importacoes
      (tipo, modulo, arquivo_nome, arquivo_sha256, arquivo_tamanho, exercicio, resumo, detalhes, created_by)
    VALUES
      ('processos_planilha', 'compras', p_arquivo->>'nome', p_arquivo->>'sha256', (p_arquivo->>'tamanho')::bigint,
       NULL, jsonb_build_object('totais', v_totais), v_detalhes, v_uid)
    RETURNING id INTO v_import_id;
  END IF;

  RETURN jsonb_build_object(
    'simulacao', p_simular,
    'importacao_id', v_import_id,
    'totais', v_totais,
    'linhas', v_linhas_res,
    'erros', v_erros
  );
END;
$$;

COMMENT ON FUNCTION public.importar_processos_planilha(jsonb, jsonb, boolean) IS
  'Importa a planilha de acompanhamento dos processos de contratação (p_simular = true só calcula; aplicação é tudo ou nada). Exige o módulo compras e compras.processos.editar.';

REVOKE ALL ON FUNCTION public.importar_processos_planilha(jsonb, jsonb, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.importar_processos_planilha(jsonb, jsonb, boolean) TO authenticated;

-- ----------------------------------------------------------------------------
-- 6. RLS (gerada de supabase/baseline/rls/mapa.csv por scripts/db/gerar-rls.mjs)
-- ----------------------------------------------------------------------------
-- processo_andamentos  [permissao: compras]
DROP POLICY IF EXISTS "rls_select" ON public.processo_andamentos;
CREATE POLICY "rls_select" ON public.processo_andamentos FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'compras')) AND (public.has_permission_code(auth.uid(), 'compras.processos.visualizar') OR public.has_permission_code(auth.uid(), 'compras.processos.editar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.processo_andamentos;
CREATE POLICY "rls_insert" ON public.processo_andamentos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.processos.editar'));
DROP POLICY IF EXISTS "rls_update" ON public.processo_andamentos;
CREATE POLICY "rls_update" ON public.processo_andamentos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.processos.editar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras')) AND public.has_permission_code(auth.uid(), 'compras.processos.editar'));
DROP POLICY IF EXISTS "rls_delete" ON public.processo_andamentos;
