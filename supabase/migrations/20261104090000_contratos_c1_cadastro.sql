-- ============================================================================
-- CONTRATOS — entrega C1: cadastro, lista, ficha e responsáveis
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-27-contratos-gestao-completa-design.md (§4, C1)
-- Plano: docs/superpowers/plans/2026-10-27-contratos-c1-cadastro-ficha.md
--
--   contratos                 colunas novas (processo SEI, PNCP, fundamento, tipo, prorrogação, setor que pediu,
--                             natureza); número único POR ANO; data_fim_atual preenchida com data_fim quando vazia.
--   contrato_responsaveis     gestor e fiscais designados (portaria do SEI), com início, fim e motivo da saída.
--                             Substitui contratos.gestor_id/fiscal_id, que ficam só como histórico.
--   contratos_conferir_permissao  cadastrar exige contratos.criar; alterar exige contratos.editar (marcar o contrato
--                             da agência de passagens basta criar ou editar passagens); apagar só rascunho, com editar;
--                             contrato assinado não volta a rascunho; autoria (created_by/updated_by) fixada pelo banco.
--   contrato_buscar_servidores    busca estreita no RH (nome, matrícula, cargo) para designar responsável.
--   contratos_importar_planilha   carga pela Central de Importações, com simulação; nunca sobrescreve (só completa
--                             o que está vazio).
--   localizar_processos_sei   o contrato entra como mais uma fonte.
--
-- RLS (decidido pelo dono em 27/10/2026): ler com o módulo Compras ou Contratos; gravar com contratos.criar ou
-- contratos.editar (no contrato também contratos.passagens.editar, que o gatilho limita a marcar o contrato da
-- agência); apagar com contratos.editar (o gatilho só deixa apagar rascunho). Antes, qualquer pessoa com o módulo
-- gravava e apagava.
-- Idempotente (IF NOT EXISTS, CREATE OR REPLACE, DROP/CREATE de policies, gatilhos e constraints).
-- ============================================================================

SET lock_timeout = '10s';

-- ----------------------------------------------------------------------------
-- 1. contratos: colunas novas e número único por ano
-- ----------------------------------------------------------------------------
ALTER TABLE public.contratos
  ADD COLUMN IF NOT EXISTS processo_sei text,
  ADD COLUMN IF NOT EXISTS numero_pncp text,
  ADD COLUMN IF NOT EXISTS fundamento_legal text,
  ADD COLUMN IF NOT EXISTS tipo_contrato text,
  ADD COLUMN IF NOT EXISTS prorrogavel boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS prazo_maximo_meses integer,
  ADD COLUMN IF NOT EXISTS unidade_demandante_id uuid REFERENCES public.estrutura_organizacional(id),
  ADD COLUMN IF NOT EXISTS natureza_despesa text;

-- Fim atual = fim original onde está vazio. Antes dos CHECKs (NOT VALID só poupa linha que ninguém toca) e sem os
-- gatilhos de trilha e de updated_at: é carga, não alteração de alguém.
DO $$
DECLARE
  t text;
  v_gatilhos text[] := ARRAY(SELECT tgname::text FROM pg_trigger
                              WHERE tgrelid = 'public.contratos'::regclass
                                AND tgname IN ('trg_audit_contratos', 'update_contratos_updated_at') AND tgenabled <> 'D');
BEGIN
  FOREACH t IN ARRAY v_gatilhos LOOP
    EXECUTE format('ALTER TABLE public.contratos DISABLE TRIGGER %I', t);
  END LOOP;
  UPDATE public.contratos SET data_fim_atual = data_fim WHERE data_fim_atual IS NULL;
  FOREACH t IN ARRAY v_gatilhos LOOP
    EXECUTE format('ALTER TABLE public.contratos ENABLE TRIGGER %I', t);
  END LOOP;
END $$;

ALTER TABLE public.contratos DROP CONSTRAINT IF EXISTS contratos_processo_sei_check;
ALTER TABLE public.contratos ADD CONSTRAINT contratos_processo_sei_check
  CHECK (processo_sei IS NULL OR char_length(btrim(processo_sei)) BETWEEN 1 AND 60);
ALTER TABLE public.contratos DROP CONSTRAINT IF EXISTS contratos_numero_pncp_check;
ALTER TABLE public.contratos ADD CONSTRAINT contratos_numero_pncp_check
  CHECK (numero_pncp IS NULL OR char_length(btrim(numero_pncp)) BETWEEN 1 AND 80);
ALTER TABLE public.contratos DROP CONSTRAINT IF EXISTS contratos_fundamento_legal_check;
ALTER TABLE public.contratos ADD CONSTRAINT contratos_fundamento_legal_check
  CHECK (fundamento_legal IS NULL OR char_length(fundamento_legal) <= 500);
ALTER TABLE public.contratos DROP CONSTRAINT IF EXISTS contratos_tipo_contrato_check;
ALTER TABLE public.contratos ADD CONSTRAINT contratos_tipo_contrato_check
  CHECK (tipo_contrato IS NULL OR tipo_contrato IN
         ('servico_continuo', 'servico_escopo', 'fornecimento', 'obra', 'locacao', 'outro'));
ALTER TABLE public.contratos DROP CONSTRAINT IF EXISTS contratos_prazo_maximo_meses_check;
ALTER TABLE public.contratos ADD CONSTRAINT contratos_prazo_maximo_meses_check
  CHECK (prazo_maximo_meses IS NULL OR prazo_maximo_meses BETWEEN 1 AND 600);
ALTER TABLE public.contratos DROP CONSTRAINT IF EXISTS contratos_natureza_despesa_check;
ALTER TABLE public.contratos ADD CONSTRAINT contratos_natureza_despesa_check
  CHECK (natureza_despesa IS NULL OR char_length(natureza_despesa) <= 30);
ALTER TABLE public.contratos DROP CONSTRAINT IF EXISTS contratos_valores_check;
ALTER TABLE public.contratos ADD CONSTRAINT contratos_valores_check
  CHECK (valor_inicial >= 0 AND valor_atual >= 0) NOT VALID;
ALTER TABLE public.contratos DROP CONSTRAINT IF EXISTS contratos_vigencia_check;
ALTER TABLE public.contratos ADD CONSTRAINT contratos_vigencia_check
  CHECK (data_fim >= data_inicio AND (data_fim_atual IS NULL OR data_fim_atual >= data_inicio)) NOT VALID;

CREATE INDEX IF NOT EXISTS idx_contratos_unidade_demandante_id ON public.contratos (unidade_demandante_id);
CREATE INDEX IF NOT EXISTS idx_contratos_data_fim_atual ON public.contratos (data_fim_atual);

-- O número se repete de um ano para o outro (01/2026, 01/2027): único por (número, ano).
ALTER TABLE public.contratos DROP CONSTRAINT IF EXISTS contratos_numero_contrato_key;
ALTER TABLE public.contratos DROP CONSTRAINT IF EXISTS contratos_numero_ano_key;
ALTER TABLE public.contratos ADD CONSTRAINT contratos_numero_ano_key UNIQUE (numero_contrato, ano);

COMMENT ON COLUMN public.contratos.processo_sei IS 'Processo SEI do contrato (como digitado; o localizador normaliza).';
COMMENT ON COLUMN public.contratos.numero_pncp IS 'Número de controle do contrato no PNCP.';
COMMENT ON COLUMN public.contratos.fundamento_legal IS 'Modalidade e fundamento (ex.: Pregão eletrônico 05/2025, Lei 14.133/2021).';
COMMENT ON COLUMN public.contratos.tipo_contrato IS 'servico_continuo, servico_escopo, fornecimento, obra, locacao ou outro.';
COMMENT ON COLUMN public.contratos.unidade_demandante_id IS 'Setor que pediu a contratação (estrutura organizacional).';
COMMENT ON COLUMN public.contratos.data_fim_atual IS 'Fim da vigência depois das alterações; igual a data_fim até a entrega C2 (aditivos).';
COMMENT ON COLUMN public.contratos.gestor_id IS 'Histórico: a designação vive em contrato_responsaveis desde a migração 20261104090000.';
COMMENT ON COLUMN public.contratos.fiscal_id IS 'Histórico: a designação vive em contrato_responsaveis desde a migração 20261104090000.';

-- ----------------------------------------------------------------------------
-- 2. Responsáveis (gestor e fiscais)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contrato_responsaveis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id uuid NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  servidor_id uuid NOT NULL REFERENCES public.servidores(id),
  nome text NOT NULL DEFAULT '',
  papel text NOT NULL CHECK (papel IN
    ('gestor', 'gestor_substituto', 'fiscal_tecnico', 'fiscal_administrativo', 'fiscal_substituto')),
  portaria_numero text CHECK (char_length(portaria_numero) <= 60),
  portaria_documento_sei text CHECK (char_length(portaria_documento_sei) <= 60),
  portaria_data date,
  data_inicio date NOT NULL,
  data_fim date,
  motivo_saida text CHECK (char_length(motivo_saida) <= 500),
  observacoes text CHECK (char_length(observacoes) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT contrato_responsaveis_periodo_check CHECK (data_fim IS NULL OR data_fim >= data_inicio),
  CONSTRAINT contrato_responsaveis_saida_check CHECK (data_fim IS NULL OR nullif(btrim(motivo_saida), '') IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_contrato_responsaveis_contrato ON public.contrato_responsaveis (contrato_id);
CREATE INDEX IF NOT EXISTS idx_contrato_responsaveis_servidor ON public.contrato_responsaveis (servidor_id);
-- Um gestor ativo por contrato; o mesmo servidor não fica duas vezes ativo no mesmo papel.
CREATE UNIQUE INDEX IF NOT EXISTS uq_contrato_responsaveis_gestor_ativo
  ON public.contrato_responsaveis (contrato_id) WHERE papel = 'gestor' AND data_fim IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_contrato_responsaveis_papel_ativo
  ON public.contrato_responsaveis (contrato_id, papel, servidor_id) WHERE data_fim IS NULL;
COMMENT ON TABLE public.contrato_responsaveis IS
  'Gestor e fiscais do contrato, designados por portaria no SEI (aqui ficam nº, documento e data). Sai com data_fim e motivo; o nome do servidor é copiado pelo banco.';

ALTER TABLE public.contrato_responsaveis ENABLE ROW LEVEL SECURITY;

-- Carga: quem já estava em contratos.gestor_id/fiscal_id vira responsável desde o início do contrato.
INSERT INTO public.contrato_responsaveis (contrato_id, servidor_id, nome, papel, data_inicio, created_by)
SELECT c.id, c.gestor_id, coalesce(s.nome_completo, ''), 'gestor', c.data_inicio, c.created_by
  FROM public.contratos c
  LEFT JOIN public.servidores s ON s.id = c.gestor_id
 WHERE c.gestor_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM public.contrato_responsaveis r
                    WHERE r.contrato_id = c.id AND r.papel = 'gestor' AND r.data_fim IS NULL);
INSERT INTO public.contrato_responsaveis (contrato_id, servidor_id, nome, papel, data_inicio, created_by)
SELECT c.id, c.fiscal_id, coalesce(s.nome_completo, ''), 'fiscal_tecnico', c.data_inicio, c.created_by
  FROM public.contratos c
  LEFT JOIN public.servidores s ON s.id = c.fiscal_id
 WHERE c.fiscal_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM public.contrato_responsaveis r
                    WHERE r.contrato_id = c.id AND r.papel = 'fiscal_tecnico'
                      AND r.servidor_id = c.fiscal_id AND r.data_fim IS NULL);

-- ----------------------------------------------------------------------------
-- 3. Gatilhos
-- ----------------------------------------------------------------------------
-- Autoria e nome do servidor (SECURITY DEFINER: quem tem contratos não lê a tabela servidores).
CREATE OR REPLACE FUNCTION public.contrato_resp_preparar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := coalesce(auth.uid(), NEW.created_by);
    NEW.created_at := now();
  ELSE
    NEW.created_at := OLD.created_at;
    NEW.created_by := OLD.created_by;
    IF NEW.contrato_id IS DISTINCT FROM OLD.contrato_id THEN
      RAISE EXCEPTION 'A designação não muda de contrato: encerre esta e crie outra.' USING ERRCODE = '22023';
    END IF;
  END IF;
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  -- O nome vem sempre do RH (não se digita); designar pede servidor ativo, como a busca.
  IF TG_OP = 'INSERT' OR NEW.servidor_id IS DISTINCT FROM OLD.servidor_id THEN
    NEW.nome := NULL;
    SELECT s.nome_completo INTO NEW.nome FROM public.servidores s
     WHERE s.id = NEW.servidor_id AND s.ativo IS NOT FALSE;
    IF NEW.nome IS NULL THEN
      RAISE EXCEPTION 'Servidor não encontrado entre os ativos.' USING ERRCODE = '22023';
    END IF;
  ELSE
    NEW.nome := OLD.nome;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.contrato_resp_preparar() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_contrato_responsaveis_preparar ON public.contrato_responsaveis;
CREATE TRIGGER trg_contrato_responsaveis_preparar BEFORE INSERT OR UPDATE ON public.contrato_responsaveis
  FOR EACH ROW EXECUTE FUNCTION public.contrato_resp_preparar();
DROP TRIGGER IF EXISTS trg_audit_contrato_responsaveis ON public.contrato_responsaveis;
CREATE TRIGGER trg_audit_contrato_responsaveis AFTER INSERT OR DELETE OR UPDATE ON public.contrato_responsaveis
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log_licitacoes();

-- Fim da vigência atual: igual ao fim original enquanto não houver aditivo (C2). Autoria fixada pelo banco
-- (quem cadastrou não muda; quem alterou é o usuário da sessão).
CREATE OR REPLACE FUNCTION public.contratos_preparar()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := coalesce(auth.uid(), NEW.created_by);
  ELSE
    NEW.created_by := OLD.created_by;
    NEW.updated_by := coalesce(auth.uid(), NEW.updated_by);
  END IF;
  IF NEW.data_fim_atual IS NULL THEN
    NEW.data_fim_atual := NEW.data_fim;
  END IF;
  NEW.processo_sei := nullif(btrim(NEW.processo_sei), '');
  NEW.numero_pncp := nullif(btrim(NEW.numero_pncp), '');
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.contratos_preparar() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_contratos_preparar ON public.contratos;
CREATE TRIGGER trg_contratos_preparar BEFORE INSERT OR UPDATE ON public.contratos
  FOR EACH ROW EXECUTE FUNCTION public.contratos_preparar();

-- Quem grava o quê. A RLS deixa gravar com criar OU editar; aqui cada operação pede a sua permissão.
-- Sem usuário (service role, CI, migração) não confere. O papel admin passa (has_permission_code), mas nem ele
-- volta contrato assinado a rascunho (senão o "só rascunho se apaga" cairia em dois passos). Alteração feita por
-- outro gatilho (saldo recalculado pelas medições, atualizar_saldo_contrato) não confere de novo.
CREATE OR REPLACE FUNCTION public.contratos_conferir_permissao()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_mudou text[];
BEGIN
  IF v_uid IS NULL OR pg_trigger_depth() > 1 THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NOT public.has_permission_code(v_uid, 'contratos.criar') THEN
      RAISE EXCEPTION 'Cadastrar contrato exige a permissão "Criar contratos".' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.status IS DISTINCT FROM 'rascunho' THEN
      RAISE EXCEPTION 'Contrato assinado não se apaga: marque como rescindido ou encerrado.' USING ERRCODE = '42501';
    END IF;
    IF NOT public.has_permission_code(v_uid, 'contratos.editar') THEN
      RAISE EXCEPTION 'Apagar o rascunho exige a permissão "Editar contratos".' USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
  END IF;

  IF NEW.status = 'rascunho' AND OLD.status IS DISTINCT FROM 'rascunho' THEN
    RAISE EXCEPTION 'Contrato assinado não volta a rascunho.' USING ERRCODE = '42501';
  END IF;
  IF public.has_permission_code(v_uid, 'contratos.editar') THEN
    RETURN NEW;
  END IF;
  SELECT coalesce(array_agg(n.key), '{}') INTO v_mudou
    FROM jsonb_each(to_jsonb(NEW)) n
    JOIN jsonb_each(to_jsonb(OLD)) o ON o.key = n.key
   WHERE n.value IS DISTINCT FROM o.value
     AND n.key NOT IN ('updated_at', 'updated_by');
  -- Marcar o contrato da agência em Passagens aéreas (usePassagens) não exige editar o contrato; desmarcar exige.
  IF v_mudou <@ ARRAY['controla_passagens'] AND NEW.controla_passagens
     AND (public.has_permission_code(v_uid, 'contratos.criar')
          OR public.has_permission_code(v_uid, 'contratos.passagens.editar')) THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'Alterar contrato exige a permissão "Editar contratos".' USING ERRCODE = '42501';
END;
$$;
REVOKE EXECUTE ON FUNCTION public.contratos_conferir_permissao() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_contratos_conferir_permissao ON public.contratos;
CREATE TRIGGER trg_contratos_conferir_permissao BEFORE INSERT OR UPDATE OR DELETE ON public.contratos
  FOR EACH ROW EXECUTE FUNCTION public.contratos_conferir_permissao();

-- ----------------------------------------------------------------------------
-- 4. Busca estreita no RH (designar responsável)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.contrato_pode_gravar()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos'))
     AND (public.has_permission_code(auth.uid(), 'contratos.criar')
          OR public.has_permission_code(auth.uid(), 'contratos.editar'));
$$;
REVOKE ALL ON FUNCTION public.contrato_pode_gravar() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.contrato_pode_gravar() TO authenticated;

-- Servidores ativos por nome ou matrícula: só id, nome, matrícula e cargo (nada de CPF nem ficha).
-- % e _ do termo valem como texto, não como curinga.
CREATE OR REPLACE FUNCTION public.contrato_buscar_servidores(_termo text)
RETURNS TABLE (id uuid, nome text, matricula text, cargo text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.contrato_pode_gravar() THEN
    RAISE EXCEPTION 'Requer a permissão de criar ou editar contratos.' USING ERRCODE = '42501';
  END IF;
  IF char_length(regexp_replace(coalesce(_termo, ''), '[^[:alnum:]]', '', 'g')) < 3 THEN
    RETURN;
  END IF;
  RETURN QUERY
  SELECT s.id, s.nome_completo, s.matricula, c.nome
    FROM public.servidores s
    LEFT JOIN public.cargos c ON c.id = s.cargo_atual_id
   WHERE s.ativo IS NOT FALSE
     AND (s.nome_completo ILIKE '%' || replace(replace(replace(btrim(_termo), '\', '\\'), '%', '\%'), '_', '\_') || '%'
          OR s.matricula = btrim(_termo))
   ORDER BY s.nome_completo
   LIMIT 20;
END;
$$;
REVOKE ALL ON FUNCTION public.contrato_buscar_servidores(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.contrato_buscar_servidores(text) TO authenticated;

-- ----------------------------------------------------------------------------
-- 5. Importação por planilha (Central de Importações; p_simular = true só calcula)
-- ----------------------------------------------------------------------------
-- Mesmo contrato das outras RPCs de importação (src/lib/importacao/types.ts): devolve simulacao, importacao_id,
-- totais, linhas (indice, acao, mudancas, avisos), erros e criados; aplicação é tudo ou nada e fica em importacoes.
-- Cada linha (chaves já tratadas pela tela: datas AAAA-MM-DD, números sem máscara, prorrogavel true/false):
--   indice, numero, ano, processo_sei, numero_pncp, documento, razao_social, objeto, objeto_resumido, tipo_contrato,
--   fundamento_legal, valor_inicial, valor_atual, data_assinatura, data_inicio, data_fim, situacao, setor_sigla,
--   natureza_despesa, prorrogavel, prazo_maximo_meses, gestor_matricula, fiscal_tecnico_matricula,
--   fiscal_administrativo_matricula, portaria_numero, portaria_data, data_publicacao_doe, numero_doe.
-- Contrato que já existe (número + ano) só ganha o que está vazio; nunca é sobrescrito nem apagado. SECURITY DEFINER
-- como as outras importações (lê o RH para achar a matrícula e grava o log), mas os gatilhos de contratos continuam
-- valendo: cadastrar exige contratos.criar e completar campo vazio de contrato existente exige contratos.editar (erro
-- na linha). Designar gestor e fiscais pela matrícula basta contratos.criar, como na ficha.
CREATE OR REPLACE FUNCTION public.contratos_importar_planilha(
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
  l jsonb;
  v_ind integer;
  v_numero text;
  v_ano integer;
  v_chave text;
  v_chaves text[] := '{}';
  v_doc text;
  v_digitos text;
  v_razao text;
  v_fornecedor uuid;
  v_unidade uuid;
  v_ct public.contratos%ROWTYPE;
  v_id uuid;
  v_acao text;
  v_mudancas jsonb;
  v_avisos jsonb;
  v_mat text;
  v_servidor uuid;
  v_nome text;
  v_papel text;
  v_rotulo text;
  v_difere text[];
  v_inicio_resp date;
  v_campo text;
  v_valor text;
  v_linhas_res jsonb := '[]'::jsonb;
  v_erros jsonb := '[]'::jsonb;
  v_detalhes jsonb := '[]'::jsonb;
  v_contratados text[] := '{}';
  v_designacoes text[] := '{}';
  v_ins integer := 0; v_atu integer := 0; v_igual integer := 0;
  v_totais jsonb;
  v_import_id uuid;
BEGIN
  p_simular := coalesce(p_simular, true);

  IF v_uid IS NULL
     OR NOT coalesce(public.perfil_ativo_atual()
                     AND (public.can_access_module(v_uid, 'contratos') OR public.can_access_module(v_uid, 'compras'))
                     AND public.has_permission_code(v_uid, 'contratos.criar'), false) THEN
    RAISE EXCEPTION 'Importar contratos exige a permissão "Criar contratos".' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(p_linhas) IS DISTINCT FROM 'array' OR jsonb_array_length(p_linhas) NOT BETWEEN 1 AND 1000 THEN
    RAISE EXCEPTION 'Envie de 1 a 1000 contratos.' USING ERRCODE = '22023';
  END IF;
  IF NOT p_simular AND (
       char_length(coalesce(p_arquivo->>'nome', '')) NOT BETWEEN 1 AND 255
       OR coalesce(p_arquivo->>'sha256', '') !~ '^[0-9a-f]{64}$'
       OR coalesce(p_arquivo->>'tamanho', '') !~ '^\d{1,15}$') THEN
    RAISE EXCEPTION 'Dados do arquivo inválidos.' USING ERRCODE = '22023';
  END IF;

  BEGIN
    FOR l IN SELECT value FROM jsonb_array_elements(p_linhas) LOOP
      v_ind := coalesce((l->>'indice')::integer, -1);
      BEGIN
        IF jsonb_typeof(l) <> 'object' THEN
          RAISE EXCEPTION 'Linha em formato inválido.' USING ERRCODE = '22023';
        END IF;
        v_numero := nullif(btrim(l->>'numero'), '');
        v_ano := nullif(btrim(l->>'ano'), '')::integer;
        IF v_numero IS NULL OR v_ano IS NULL THEN
          RAISE EXCEPTION 'Falta o número ou o ano do contrato.' USING ERRCODE = '22023';
        END IF;
        IF v_ano NOT BETWEEN 1990 AND 2100 THEN
          RAISE EXCEPTION 'Ano % fora do intervalo.', v_ano USING ERRCODE = '22023';
        END IF;
        -- "1" e "01" são o mesmo contrato (zeros à esquerda não contam)
        v_chave := ltrim(lower(v_numero), '0') || '/' || v_ano;
        IF v_chave = ANY (v_chaves) THEN
          RAISE EXCEPTION 'O contrato %/% aparece duas vezes na planilha.', v_numero, v_ano USING ERRCODE = '22023';
        END IF;
        v_chaves := v_chaves || v_chave;
        v_mudancas := '{}'::jsonb;
        v_avisos := '[]'::jsonb;

        -- setor que pediu (sigla da estrutura)
        v_unidade := NULL;
        IF nullif(btrim(l->>'setor_sigla'), '') IS NOT NULL THEN
          SELECT u.id INTO v_unidade FROM public.estrutura_organizacional u
           WHERE lower(u.sigla) = lower(btrim(l->>'setor_sigla')) AND u.ativo IS NOT FALSE
           ORDER BY u.nivel LIMIT 1;
          IF v_unidade IS NULL THEN
            v_avisos := v_avisos || to_jsonb(format('Setor "%s" não encontrado na estrutura: fica em branco.', btrim(l->>'setor_sigla')));
          END IF;
        END IF;

        SELECT * INTO v_ct FROM public.contratos c
         WHERE ltrim(lower(c.numero_contrato), '0') = ltrim(lower(v_numero), '0') AND c.ano = v_ano
         ORDER BY (lower(c.numero_contrato) = lower(v_numero)) DESC
         LIMIT 1
         FOR UPDATE;
        IF NOT FOUND THEN
          -- contratado: pelo documento (só dígitos); cadastra se não existir
          v_doc := nullif(btrim(l->>'documento'), '');
          v_digitos := regexp_replace(coalesce(v_doc, ''), '\D', '', 'g');
          IF char_length(v_digitos) NOT IN (11, 14) THEN
            RAISE EXCEPTION 'CPF ou CNPJ do contratado ausente ou inválido.' USING ERRCODE = '22023';
          END IF;
          SELECT f.id INTO v_fornecedor FROM public.fornecedores f
           WHERE regexp_replace(f.cpf_cnpj, '\D', '', 'g') = v_digitos
           ORDER BY f.ativo DESC NULLS LAST LIMIT 1;
          IF v_fornecedor IS NULL THEN
            v_razao := nullif(btrim(l->>'razao_social'), '');
            IF v_razao IS NULL THEN
              RAISE EXCEPTION 'Contratado % não cadastrado e sem razão social na planilha.', v_doc USING ERRCODE = '22023';
            END IF;
            INSERT INTO public.fornecedores (tipo_pessoa, cpf_cnpj, razao_social, created_by)
            VALUES (CASE WHEN char_length(v_digitos) = 14 THEN 'PJ' ELSE 'PF' END, v_doc, v_razao, v_uid)
            RETURNING id INTO v_fornecedor;
            v_contratados := v_contratados || v_razao;
          END IF;
          IF nullif(btrim(l->>'objeto'), '') IS NULL THEN
            RAISE EXCEPTION 'Falta o objeto.' USING ERRCODE = '22023';
          END IF;
          IF nullif(l->>'valor_inicial', '') IS NULL OR nullif(l->>'data_assinatura', '') IS NULL
             OR nullif(l->>'data_inicio', '') IS NULL OR nullif(l->>'data_fim', '') IS NULL THEN
            RAISE EXCEPTION 'Faltam valor inicial, assinatura, início ou fim da vigência.' USING ERRCODE = '22023';
          END IF;

          INSERT INTO public.contratos (
            numero_contrato, ano, processo_sei, numero_pncp, fornecedor_id, objeto, objeto_resumido, tipo_contrato,
            fundamento_legal, valor_inicial, valor_atual, data_assinatura, data_inicio, data_fim, status,
            unidade_demandante_id, natureza_despesa, prorrogavel, prazo_maximo_meses, data_publicacao_doe, numero_doe,
            created_by)
          VALUES (
            v_numero, v_ano, nullif(btrim(l->>'processo_sei'), ''), nullif(btrim(l->>'numero_pncp'), ''), v_fornecedor,
            btrim(l->>'objeto'), nullif(btrim(l->>'objeto_resumido'), ''), nullif(btrim(l->>'tipo_contrato'), ''),
            nullif(btrim(l->>'fundamento_legal'), ''), (l->>'valor_inicial')::numeric,
            coalesce(nullif(l->>'valor_atual', '')::numeric, (l->>'valor_inicial')::numeric),
            (l->>'data_assinatura')::date, (l->>'data_inicio')::date, (l->>'data_fim')::date,
            coalesce(nullif(btrim(l->>'situacao'), ''), 'vigente')::public.status_contrato,
            v_unidade, nullif(btrim(l->>'natureza_despesa'), ''), coalesce(nullif(l->>'prorrogavel', '')::boolean, false),
            nullif(l->>'prazo_maximo_meses', '')::integer, nullif(l->>'data_publicacao_doe', '')::date,
            nullif(btrim(l->>'numero_doe'), ''), v_uid)
          RETURNING id INTO v_id;
          v_acao := 'inserir';
        ELSE
          v_id := v_ct.id;
          -- o que a planilha traz diferente do cadastro não muda (o aditivo é da C2): só avisa
          v_difere := array_remove(ARRAY[
            CASE WHEN nullif(l->>'valor_inicial', '')::numeric IS DISTINCT FROM v_ct.valor_inicial
                  AND nullif(l->>'valor_inicial', '') IS NOT NULL THEN 'valor inicial' END,
            CASE WHEN nullif(l->>'valor_atual', '')::numeric IS DISTINCT FROM v_ct.valor_atual
                  AND nullif(l->>'valor_atual', '') IS NOT NULL THEN 'valor atual' END,
            CASE WHEN nullif(l->>'data_fim', '') IS NOT NULL
                  AND (l->>'data_fim')::date IS DISTINCT FROM v_ct.data_fim
                  AND (l->>'data_fim')::date IS DISTINCT FROM v_ct.data_fim_atual THEN 'fim da vigência' END,
            CASE WHEN nullif(regexp_replace(coalesce(l->>'documento', ''), '\D', '', 'g'), '') IS DISTINCT FROM
                      (SELECT regexp_replace(f.cpf_cnpj, '\D', '', 'g') FROM public.fornecedores f WHERE f.id = v_ct.fornecedor_id)
                  AND nullif(btrim(l->>'documento'), '') IS NOT NULL THEN 'CNPJ ou CPF do contratado' END
          ], NULL);
          IF cardinality(v_difere) > 0 THEN
            v_avisos := v_avisos || to_jsonb(format('A planilha difere do cadastro em %s: ficou o que está no sistema.',
                                                   array_to_string(v_difere, ', ')));
          END IF;
          -- só completa o que está vazio (campo → [antes, depois])
          FOR v_campo, v_valor IN
            SELECT k, v FROM (VALUES
              ('processo_sei', CASE WHEN v_ct.processo_sei IS NULL THEN nullif(btrim(l->>'processo_sei'), '') END),
              ('numero_pncp', CASE WHEN v_ct.numero_pncp IS NULL THEN nullif(btrim(l->>'numero_pncp'), '') END),
              ('objeto_resumido', CASE WHEN v_ct.objeto_resumido IS NULL THEN nullif(btrim(l->>'objeto_resumido'), '') END),
              ('tipo_contrato', CASE WHEN v_ct.tipo_contrato IS NULL THEN nullif(btrim(l->>'tipo_contrato'), '') END),
              ('fundamento_legal', CASE WHEN v_ct.fundamento_legal IS NULL THEN nullif(btrim(l->>'fundamento_legal'), '') END),
              ('natureza_despesa', CASE WHEN v_ct.natureza_despesa IS NULL THEN nullif(btrim(l->>'natureza_despesa'), '') END),
              ('prazo_maximo_meses', CASE WHEN v_ct.prazo_maximo_meses IS NULL THEN nullif(l->>'prazo_maximo_meses', '') END),
              ('data_publicacao_doe', CASE WHEN v_ct.data_publicacao_doe IS NULL THEN nullif(l->>'data_publicacao_doe', '') END),
              ('numero_doe', CASE WHEN v_ct.numero_doe IS NULL THEN nullif(btrim(l->>'numero_doe'), '') END),
              ('unidade_demandante_id', CASE WHEN v_ct.unidade_demandante_id IS NULL AND v_unidade IS NOT NULL
                                             THEN btrim(l->>'setor_sigla') END)
            ) AS x(k, v) WHERE v IS NOT NULL
          LOOP
            v_mudancas := v_mudancas || jsonb_build_object(v_campo, jsonb_build_array(NULL, v_valor));
          END LOOP;
          IF v_mudancas <> '{}'::jsonb THEN
            UPDATE public.contratos c SET
              processo_sei = coalesce(c.processo_sei, nullif(btrim(l->>'processo_sei'), '')),
              numero_pncp = coalesce(c.numero_pncp, nullif(btrim(l->>'numero_pncp'), '')),
              objeto_resumido = coalesce(c.objeto_resumido, nullif(btrim(l->>'objeto_resumido'), '')),
              tipo_contrato = coalesce(c.tipo_contrato, nullif(btrim(l->>'tipo_contrato'), '')),
              fundamento_legal = coalesce(c.fundamento_legal, nullif(btrim(l->>'fundamento_legal'), '')),
              natureza_despesa = coalesce(c.natureza_despesa, nullif(btrim(l->>'natureza_despesa'), '')),
              prazo_maximo_meses = coalesce(c.prazo_maximo_meses, nullif(l->>'prazo_maximo_meses', '')::integer),
              data_publicacao_doe = coalesce(c.data_publicacao_doe, nullif(l->>'data_publicacao_doe', '')::date),
              numero_doe = coalesce(c.numero_doe, nullif(btrim(l->>'numero_doe'), '')),
              unidade_demandante_id = coalesce(c.unidade_demandante_id, v_unidade)
             WHERE c.id = v_id;
          END IF;
          v_acao := 'sem_alteracao';
        END IF;

        -- responsáveis (matrícula); a portaria da linha vale para os três
        FOREACH v_papel IN ARRAY ARRAY['gestor', 'fiscal_tecnico', 'fiscal_administrativo'] LOOP
          v_mat := nullif(btrim(l->>(v_papel || '_matricula')), '');
          CONTINUE WHEN v_mat IS NULL;
          v_rotulo := CASE v_papel WHEN 'gestor' THEN 'gestor' WHEN 'fiscal_tecnico' THEN 'fiscal técnico'
                        ELSE 'fiscal administrativo' END;
          SELECT s.id, s.nome_completo INTO v_servidor, v_nome FROM public.servidores s
           WHERE s.matricula = v_mat AND s.ativo IS NOT FALSE
           LIMIT 1;
          IF v_servidor IS NULL THEN
            v_avisos := v_avisos || to_jsonb(format('Matrícula %s (%s) não encontrada entre os servidores ativos.',
              v_mat, v_rotulo));
            CONTINUE;
          END IF;
          -- já designado neste papel: nada a fazer
          CONTINUE WHEN EXISTS (SELECT 1 FROM public.contrato_responsaveis r
                                 WHERE r.contrato_id = v_id AND r.data_fim IS NULL
                                   AND r.servidor_id = v_servidor AND r.papel = v_papel);
          -- só um gestor em exercício: a troca é na ficha (encerra a designação antiga e designa o novo)
          IF v_papel = 'gestor' AND EXISTS (SELECT 1 FROM public.contrato_responsaveis r
                                             WHERE r.contrato_id = v_id AND r.data_fim IS NULL AND r.papel = 'gestor') THEN
            v_avisos := v_avisos || to_jsonb(format(
              'O contrato já tem gestor em exercício: a matrícula %s não foi designada (troque na ficha do contrato).', v_mat));
            CONTINUE;
          END IF;
          v_inicio_resp := coalesce(nullif(l->>'portaria_data', '')::date, nullif(l->>'data_inicio', '')::date,
                                    (SELECT c.data_inicio FROM public.contratos c WHERE c.id = v_id));
          INSERT INTO public.contrato_responsaveis (contrato_id, servidor_id, papel, portaria_numero, portaria_data, data_inicio)
          VALUES (v_id, v_servidor, v_papel, nullif(btrim(l->>'portaria_numero'), ''),
                  nullif(l->>'portaria_data', '')::date, v_inicio_resp);
          v_designacoes := v_designacoes || format('%s/%s: %s (%s)', v_numero, v_ano, v_nome, v_rotulo);
          IF v_acao <> 'inserir' THEN
            v_mudancas := v_mudancas || jsonb_build_object(v_papel, jsonb_build_array(NULL, v_nome));
          END IF;
        END LOOP;
        IF v_acao <> 'inserir' AND v_mudancas <> '{}'::jsonb THEN
          v_acao := 'atualizar';
        END IF;

        CASE v_acao WHEN 'inserir' THEN v_ins := v_ins + 1; WHEN 'atualizar' THEN v_atu := v_atu + 1; ELSE v_igual := v_igual + 1; END CASE;
        v_linhas_res := v_linhas_res || jsonb_build_object('indice', v_ind, 'acao', v_acao,
          'mudancas', CASE WHEN v_mudancas <> '{}'::jsonb THEN v_mudancas END,
          'avisos', CASE WHEN jsonb_array_length(v_avisos) > 0 THEN v_avisos END);
        v_detalhes := v_detalhes || jsonb_build_object('indice', v_ind, 'contrato', v_numero || '/' || v_ano,
          'acao', v_acao, 'contrato_id', v_id);
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
      ('contratos_planilha', 'contratos', p_arquivo->>'nome', p_arquivo->>'sha256', (p_arquivo->>'tamanho')::bigint,
       NULL, jsonb_build_object('totais', v_totais), v_detalhes, v_uid)
    RETURNING id INTO v_import_id;
  END IF;

  RETURN jsonb_build_object(
    'simulacao', p_simular,
    'importacao_id', v_import_id,
    'totais', v_totais,
    'linhas', v_linhas_res,
    'erros', v_erros,
    'criados', jsonb_strip_nulls(jsonb_build_object(
      'Contratados', CASE WHEN cardinality(v_contratados) > 0 THEN to_jsonb(v_contratados) END,
      'Designações', CASE WHEN cardinality(v_designacoes) > 0 THEN to_jsonb(v_designacoes) END)));
END;
$$;
COMMENT ON FUNCTION public.contratos_importar_planilha(jsonb, jsonb, boolean) IS
  'Importa a planilha de contratos vigentes (p_simular = true só calcula; aplicação é tudo ou nada, com log em importacoes). Nunca apaga nem sobrescreve: contrato existente só ganha o que está vazio. Exige contratos.criar (completar campo vazio de contrato existente exige também contratos.editar; designar pela matrícula basta criar). Migração 20261104090000.';
REVOKE ALL ON FUNCTION public.contratos_importar_planilha(jsonb, jsonb, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.contratos_importar_planilha(jsonb, jsonb, boolean) TO authenticated;

-- ----------------------------------------------------------------------------
-- 6. Localizador do SEI: o contrato entra como fonte
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.localizar_processos_sei(p_termo text, p_limite integer DEFAULT 50)
RETURNS TABLE (
  chave text,
  numero_sei text,
  origem text,
  registro_id uuid,
  ref text,
  titulo text,
  situacao text,
  onde text,
  atualizado_em date,
  valor numeric
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  WITH termo AS (
    SELECT btrim(coalesce(p_termo, '')) AS t
  ), busca AS (
    SELECT t,
           public.sei_normalizar(t) AS chave,
           regexp_replace(t, '\D', '', 'g') AS digitos,
           t ~ '^[0-9\s./-]+$' AS so_numero,
           '%' || replace(replace(replace(public.texto_busca(t), '\', '\\'), '%', '\%'), '_', '\_') || '%' AS padrao
      FROM termo
     WHERE char_length(t) >= 3
  ), fontes AS (
    SELECT p.numero_sei, 'workflow'::text AS origem, p.id, NULL::text AS ref, p.assunto AS titulo, p.status::text AS situacao,
           u.sigla AS onde, coalesce(p.etapa_iniciada_em, p.updated_at)::date AS atualizado_em, NULL::numeric AS valor,
           concat_ws(' ', p.numero_processo, p.assunto, p.interessado_nome, u.sigla, u.nome) AS texto
      FROM public.processos_administrativos p
      LEFT JOIN public.estrutura_organizacional u ON u.id = p.unidade_atual_id
    UNION ALL
    SELECT l.numero_processo, 'contratacao', l.id, NULL, coalesce(l.objeto_resumido, l.objeto), l.etapa, l.setor_atual,
           l.atualizado_em, l.valor_estimado,
           concat_ws(' ', l.objeto, l.objeto_resumido, l.setor_atual, l.situacao_atual)
      FROM public.processos_licitatorios l
    UNION ALL
    SELECT ct.processo_sei, 'contrato', ct.id, ct.numero_contrato || '/' || ct.ano,
           concat_ws(' · ', 'Contrato ' || ct.numero_contrato || '/' || ct.ano, coalesce(ct.objeto_resumido, ct.objeto)),
           ct.status::text, f.razao_social, coalesce(ct.updated_at, ct.created_at)::date, ct.valor_atual,
           concat_ws(' ', ct.numero_contrato, ct.objeto, ct.objeto_resumido, f.razao_social, f.nome_fantasia)
      FROM public.contratos ct
      LEFT JOIN public.fornecedores f ON f.id = ct.fornecedor_id
     WHERE nullif(btrim(ct.processo_sei), '') IS NOT NULL
    UNION ALL
    SELECT pp.numero_sei, 'passagem', pp.id, NULL, coalesce(pp.evento, pp.finalidade), pp.situacao,
           concat_ws('/', pp.destino_cidade, pp.destino_uf), pp.updated_at::date, NULL,
           concat_ws(' ', pp.finalidade, pp.evento, pp.solicitante_nome, pp.destino_cidade)
      FROM public.passagem_pedidos pp
    UNION ALL
    SELECT i.numero_sei, 'pca', i.id, pl.exercicio::text, i.descricao, i.situacao, 'PCA ' || pl.exercicio,
           i.updated_at::date, i.valor_total, i.descricao
      FROM public.pca_itens i
      JOIN public.pca_planos pl ON pl.id = i.plano_id
     WHERE i.situacao <> 'excluido'
    UNION ALL
    SELECT e.processo_sei, 'empenho', e.id, NULL, concat_ws(' · ', 'Empenho ' || e.numero, e.credor_nome), e.status::text,
           NULL, e.data_empenho, e.valor_empenhado,
           concat_ws(' ', e.numero, e.objeto, e.credor_nome, e.ped_numero)
      FROM public.fin_empenhos e
     WHERE nullif(btrim(e.processo_sei), '') IS NOT NULL
    UNION ALL
    SELECT d.processo_sei, 'documento', d.id, d.tipo::text, concat_ws(' · ', d.numero, d.titulo), d.status::text, NULL,
           coalesce(d.data_documento, d.created_at::date), NULL,
           concat_ws(' ', d.numero, d.titulo, d.ementa)
      FROM public.documentos d
     WHERE nullif(btrim(d.processo_sei), '') IS NOT NULL
    UNION ALL
    SELECT c.processo_sei, 'termo_cessao', c.id, c.unidade_local_id::text, concat_ws(' · ', 'Termo ' || c.numero_termo, c.cessionario_nome),
           c.status::text, NULL, coalesce(c.data_emissao::date, c.created_at::date), NULL,
           concat_ws(' ', c.numero_termo, c.cessionario_nome, c.finalidade)
      FROM public.termos_cessao c
     WHERE nullif(btrim(c.processo_sei), '') IS NOT NULL
    UNION ALL
    SELECT v.numero_sei_diarias, 'diaria', v.id, NULL, concat_ws(' · ', 'Diária', v.destino_cidade, v.finalidade), v.status,
           concat_ws('/', v.destino_cidade, v.destino_uf), v.data_saida, v.valor_total,
           concat_ws(' ', v.destino_cidade, v.finalidade, v.portaria_numero)
      FROM public.viagens_diarias v
     WHERE nullif(btrim(v.numero_sei_diarias), '') IS NOT NULL
  )
  SELECT public.sei_normalizar(f.numero_sei), f.numero_sei, f.origem, f.id, f.ref, f.titulo, f.situacao, f.onde,
         f.atualizado_em, f.valor
    FROM fontes f, busca b
   WHERE (b.chave IS NOT NULL AND public.sei_normalizar(f.numero_sei) = b.chave)
      OR (b.chave IS NULL AND b.so_numero AND char_length(b.digitos) >= 4
          AND regexp_replace(coalesce(f.numero_sei, ''), '\D', '', 'g') LIKE '%' || b.digitos || '%')
      OR (b.chave IS NULL AND NOT b.so_numero
          AND public.texto_busca(concat_ws(' ', f.numero_sei, f.texto)) LIKE b.padrao ESCAPE '\')
   ORDER BY f.atualizado_em DESC NULLS LAST, f.origem, f.id
   LIMIT least(greatest(coalesce(p_limite, 50), 1), 200)
$$;
COMMENT ON FUNCTION public.localizar_processos_sei(text, integer) IS
  'Localizador de processos do SEI: busca pelo nº (qualquer formato) ou por palavras em nove fontes (o contrato desde a migração 20261104090000); INVOKER (cada fonte com a RLS dela).';
REVOKE ALL ON FUNCTION public.localizar_processos_sei(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.localizar_processos_sei(text, integer) TO authenticated;

-- ----------------------------------------------------------------------------
-- 7. RLS (gerado de supabase/baseline/rls/mapa.csv por scripts/db/gerar-rls.mjs)
-- ----------------------------------------------------------------------------
-- contratos  [permissao: compras | contratos]
DROP POLICY IF EXISTS "comp_module_delete" ON public.contratos;
DROP POLICY IF EXISTS "comp_module_select" ON public.contratos;
DROP POLICY IF EXISTS "comp_module_update" ON public.contratos;
DROP POLICY IF EXISTS "comp_module_write" ON public.contratos;
DROP POLICY IF EXISTS "rls_select" ON public.contratos;
CREATE POLICY "rls_select" ON public.contratos FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_insert" ON public.contratos;
CREATE POLICY "rls_insert" ON public.contratos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')) AND (public.has_permission_code(auth.uid(), 'contratos.criar') OR public.has_permission_code(auth.uid(), 'contratos.editar') OR public.has_permission_code(auth.uid(), 'contratos.passagens.editar')));
DROP POLICY IF EXISTS "rls_update" ON public.contratos;
CREATE POLICY "rls_update" ON public.contratos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')) AND (public.has_permission_code(auth.uid(), 'contratos.criar') OR public.has_permission_code(auth.uid(), 'contratos.editar') OR public.has_permission_code(auth.uid(), 'contratos.passagens.editar')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')) AND (public.has_permission_code(auth.uid(), 'contratos.criar') OR public.has_permission_code(auth.uid(), 'contratos.editar') OR public.has_permission_code(auth.uid(), 'contratos.passagens.editar')));
DROP POLICY IF EXISTS "rls_delete" ON public.contratos;
CREATE POLICY "rls_delete" ON public.contratos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.editar'));
-- itens_contrato  [permissao: compras | contratos]
DROP POLICY IF EXISTS "rls_select" ON public.itens_contrato;
CREATE POLICY "rls_select" ON public.itens_contrato FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_insert" ON public.itens_contrato;
CREATE POLICY "rls_insert" ON public.itens_contrato FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')) AND (public.has_permission_code(auth.uid(), 'contratos.criar') OR public.has_permission_code(auth.uid(), 'contratos.editar')));
DROP POLICY IF EXISTS "rls_update" ON public.itens_contrato;
CREATE POLICY "rls_update" ON public.itens_contrato FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')) AND (public.has_permission_code(auth.uid(), 'contratos.criar') OR public.has_permission_code(auth.uid(), 'contratos.editar')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')) AND (public.has_permission_code(auth.uid(), 'contratos.criar') OR public.has_permission_code(auth.uid(), 'contratos.editar')));
DROP POLICY IF EXISTS "rls_delete" ON public.itens_contrato;
CREATE POLICY "rls_delete" ON public.itens_contrato FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.editar'));
-- contrato_responsaveis  [permissao: compras | contratos]
DROP POLICY IF EXISTS "rls_select" ON public.contrato_responsaveis;
CREATE POLICY "rls_select" ON public.contrato_responsaveis FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')));
DROP POLICY IF EXISTS "rls_insert" ON public.contrato_responsaveis;
CREATE POLICY "rls_insert" ON public.contrato_responsaveis FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')) AND (public.has_permission_code(auth.uid(), 'contratos.criar') OR public.has_permission_code(auth.uid(), 'contratos.editar')));
DROP POLICY IF EXISTS "rls_update" ON public.contrato_responsaveis;
CREATE POLICY "rls_update" ON public.contrato_responsaveis FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')) AND (public.has_permission_code(auth.uid(), 'contratos.criar') OR public.has_permission_code(auth.uid(), 'contratos.editar')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')) AND (public.has_permission_code(auth.uid(), 'contratos.criar') OR public.has_permission_code(auth.uid(), 'contratos.editar')));
DROP POLICY IF EXISTS "rls_delete" ON public.contrato_responsaveis;
CREATE POLICY "rls_delete" ON public.contrato_responsaveis FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'compras') OR public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.editar'));
