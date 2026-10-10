-- ============================================================================
-- Onda E1 do RH — servidor responsável em todo lançamento e trilha imutável
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-10-rh-trilha-auditoria-design.md
-- Levantamento: docs/planejamento/REVISAO_RH.md (seção 3)
--
-- Vale nos DOIS estados do banco (premissa 5 da spec): (a) construído do baseline (supabase/baseline/) e
-- (b) produzido só pelas migrações. Idempotente: CREATE ... IF NOT EXISTS, CREATE OR REPLACE, DROP ... IF EXISTS,
-- ON CONFLICT DO NOTHING. Os triggers são ligados num laço sobre uma LISTA EXPLÍCITA de tabelas (não derivada do
-- catálogo em tempo de execução); a tabela que não existir é pulada com NOTICE.
--
-- Blocos:
--   1. audit_logs: colunas novas (servidor, campos alterados, origem, transação)
--   2. audit_colunas_sensiveis: catálogo da máscara LGPD (classe catalogo_admin do rls/mapa.csv), carregado aqui
--   3. funções de apoio: responsavel_atual(), rh_exige_servidor_vinculado(), mascarar_parcial(), trilha_mascarar(),
--      trilha_contexto_requisicao()
--   4. audit_logs: trigger que completa o contexto (servidor, origem, papel, IP, user agent, transação) de quem
--      grava sem informar (fn_audit_trigger, log_audit, fechar_folha, Edge Functions...)
--   5. fn_audit_trigger v2 (mesma assinatura): servidor, campos alterados, máscara, UPDATE sem mudança não grava,
--      tabela sem coluna id uuid grava a chave primária em metadata
--   6. trilha imutável: audit_logs, folha_historico_status e rubricas_historico recusam UPDATE, DELETE e TRUNCATE,
--      inclusive para postgres e service role (ENABLE ALWAYS: vale também com session_replication_role = replica)
--   7. fixar_autoria(): colunas padrão de autoria e colunas de decisão gravadas pelo banco
--   8. laço sobre as 79 tabelas do RH (rls/mapa.csv): colunas, zz_fixar_autoria, audit_<tabela>, sem TRUNCATE pela API
--   9. trilha (módulo admin) em profiles (vínculo e bloqueio), user_permissions, user_org_units e no catálogo da máscara
--  10. folha: registrar_transicao_folha sem COALESCE com o valor do cliente; processar_folha_pagamento grava
--      processado_por
--  11. frequência (B2): validar_etapa_frequencia deixa de isentar o admin da AUTORIA (a regra de etapa continua)
--  12. registrar_evento(): ver, exportar e baixar (imprimir = baixar) com listas fechadas
--  13. permissão rh.auditoria.visualizar e policy de leitura da trilha do RH
--
-- Origem do lançamento (responsavel_atual): `usuario` (auth.uid() com servidor vinculado no perfil),
-- `usuario_sem_vinculo` (auth.uid() sem servidor), `sistema` (sem auth.uid() e fora dos papéis da API: service role,
-- Edge Function, job) e `anonimo` (papel anon sem usuário, ex.: RPC de formulário público). Só `sistema` informa o
-- autor; em qualquer sessão `authenticated` o valor mandado pelo navegador é ignorado (sem isenção para admin).
--
-- Volume (item 3 da spec, avaliado e não resolvido aqui): processar_folha_pagamento apaga e recria as fichas da folha a
-- cada processamento. Com a trilha em fichas_financeiras (nova) e itens_ficha_financeira (já existia), cada
-- reprocessamento grava 1 linha por ficha apagada, 1 por ficha criada e 1 por item apagado em cascata (com a linha
-- inteira, mascarada), além das linhas da folha. Para N servidores e k itens por ficha: cerca de N*(2+k) linhas por
-- processamento. Não bloqueia a folha; particionar/reter audit_logs fica fora desta onda (decisão 11: guardar tudo).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. audit_logs: colunas novas
-- ----------------------------------------------------------------------------
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS servidor_id uuid,
  ADD COLUMN IF NOT EXISTS servidor_nome text,
  ADD COLUMN IF NOT EXISTS servidor_matricula text,
  ADD COLUMN IF NOT EXISTS campos_alterados text[],
  ADD COLUMN IF NOT EXISTS origem text,
  ADD COLUMN IF NOT EXISTS transacao bigint;

COMMENT ON COLUMN public.audit_logs.servidor_id IS
  'Retrato do servidor vinculado ao perfil de quem agiu, no momento do registro (sem FK: não muda se o vínculo mudar)';
COMMENT ON COLUMN public.audit_logs.campos_alterados IS
  'Colunas que mudaram no UPDATE (o nome aparece mesmo quando o valor é mascarado)';
COMMENT ON COLUMN public.audit_logs.origem IS
  'usuario | usuario_sem_vinculo | sistema | anonimo (ver public.responsavel_atual)';
COMMENT ON COLUMN public.audit_logs.transacao IS 'txid_current() do registro: agrupa o que mudou no mesmo comando/transação';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                  WHERE conrelid = 'public.audit_logs'::regclass AND conname = 'audit_logs_origem_check') THEN
    ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_origem_check
      CHECK (origem IS NULL OR origem IN ('usuario', 'usuario_sem_vinculo', 'sistema', 'anonimo'));
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Catálogo da máscara LGPD (classe catalogo_admin em supabase/baseline/rls/mapa.csv)
-- ----------------------------------------------------------------------------
-- parcial: CPF e PIS ficam como ***.456.789-** (só os dígitos do meio); omitir: o valor vira "[protegido]".
-- O nome da coluna continua em campos_alterados: dá para saber que mudou, sem guardar o valor.
CREATE TABLE IF NOT EXISTS public.audit_colunas_sensiveis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tabela text NOT NULL,
  coluna text NOT NULL,
  tratamento text NOT NULL CHECK (tratamento IN ('parcial', 'omitir')),
  motivo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT audit_colunas_sensiveis_tabela_coluna_key UNIQUE (tabela, coluna)
);
COMMENT ON TABLE public.audit_colunas_sensiveis IS
  'Máscara LGPD da trilha (fn_audit_trigger): coluna e tratamento (parcial/omitir). Só o papel admin altera.';

ALTER TABLE public.audit_colunas_sensiveis ENABLE ROW LEVEL SECURITY;
-- (gerado por scripts/db/gerar-rls.mjs — classe catalogo_admin; cópia literal de supabase/baseline/rls/35_policies_geradas.sql)
DROP POLICY IF EXISTS "rls_select" ON public.audit_colunas_sensiveis;
CREATE POLICY "rls_select" ON public.audit_colunas_sensiveis FOR SELECT TO authenticated
  USING (public.is_active_user());
DROP POLICY IF EXISTS "rls_insert" ON public.audit_colunas_sensiveis;
CREATE POLICY "rls_insert" ON public.audit_colunas_sensiveis FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_update" ON public.audit_colunas_sensiveis;
CREATE POLICY "rls_update" ON public.audit_colunas_sensiveis FOR UPDATE TO authenticated
  USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));
DROP POLICY IF EXISTS "rls_delete" ON public.audit_colunas_sensiveis;
CREATE POLICY "rls_delete" ON public.audit_colunas_sensiveis FOR DELETE TO authenticated
  USING (public.is_admin_user(auth.uid()));
-- privilégios como no overlay/40 (anon sem nada; a API não usa TRUNCATE/TRIGGER/REFERENCES)
REVOKE ALL ON public.audit_colunas_sensiveis FROM anon;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.audit_colunas_sensiveis FROM authenticated;

-- Carga: só as colunas que existem neste banco (lista revisada em 2026-10-10 sobre o schema do baseline).
INSERT INTO public.audit_colunas_sensiveis (tabela, coluna, tratamento, motivo)
SELECT v.tabela, v.coluna, v.tratamento, v.motivo
  FROM (VALUES
    -- servidores (ficha funcional)
    ('servidores', 'cpf', 'parcial', 'CPF'),
    ('servidores', 'pis_pasep', 'parcial', 'PIS/PASEP'),
    ('servidores', 'rg', 'omitir', 'documento de identificação'),
    ('servidores', 'titulo_eleitor', 'omitir', 'documento de identificação'),
    ('servidores', 'titulo_zona', 'omitir', 'documento de identificação'),
    ('servidores', 'titulo_secao', 'omitir', 'documento de identificação'),
    ('servidores', 'ctps_numero', 'omitir', 'documento de identificação'),
    ('servidores', 'ctps_serie', 'omitir', 'documento de identificação'),
    ('servidores', 'cnh_numero', 'omitir', 'documento de identificação'),
    ('servidores', 'certificado_reservista', 'omitir', 'documento de identificação'),
    ('servidores', 'data_nascimento', 'omitir', 'data de nascimento'),
    ('servidores', 'email_pessoal', 'omitir', 'contato pessoal'),
    ('servidores', 'telefone_fixo', 'omitir', 'contato pessoal'),
    ('servidores', 'telefone_celular', 'omitir', 'contato pessoal'),
    ('servidores', 'telefone_emergencia', 'omitir', 'contato pessoal'),
    ('servidores', 'contato_emergencia_nome', 'omitir', 'contato pessoal (terceiro)'),
    ('servidores', 'endereco_logradouro', 'omitir', 'endereço'),
    ('servidores', 'endereco_numero', 'omitir', 'endereço'),
    ('servidores', 'endereco_complemento', 'omitir', 'endereço'),
    ('servidores', 'endereco_bairro', 'omitir', 'endereço'),
    ('servidores', 'endereco_cep', 'omitir', 'endereço'),
    ('servidores', 'banco_agencia', 'omitir', 'dado bancário'),
    ('servidores', 'banco_conta', 'omitir', 'dado bancário'),
    ('servidores', 'dependentes', 'omitir', 'dependentes (CPF, nome e nascimento de terceiros)'),
    ('servidores', 'nome_mae', 'omitir', 'filiação'),
    ('servidores', 'nome_pai', 'omitir', 'filiação'),
    ('servidores', 'raca_cor', 'omitir', 'dado sensível (origem racial)'),
    ('servidores', 'pcd', 'omitir', 'dado sensível (saúde)'),
    ('servidores', 'pcd_tipo', 'omitir', 'dado sensível (saúde)'),
    ('servidores', 'tipo_sanguineo', 'omitir', 'dado sensível (saúde)'),
    ('servidores', 'molestia_grave', 'omitir', 'dado sensível (saúde)'),
    ('servidores', 'indicacao', 'omitir', 'indicação (acesso restrito)'),
    -- pre_cadastros (mesmos dados, antes da conversão em servidor)
    ('pre_cadastros', 'cpf', 'parcial', 'CPF'),
    ('pre_cadastros', 'pis_pasep', 'parcial', 'PIS/PASEP'),
    ('pre_cadastros', 'codigo_acesso', 'omitir', 'código de acesso ao formulário'),
    ('pre_cadastros', 'ip_envio', 'omitir', 'endereço IP de quem enviou'),
    ('pre_cadastros', 'rg', 'omitir', 'documento de identificação'),
    ('pre_cadastros', 'titulo_eleitor', 'omitir', 'documento de identificação'),
    ('pre_cadastros', 'titulo_zona', 'omitir', 'documento de identificação'),
    ('pre_cadastros', 'titulo_secao', 'omitir', 'documento de identificação'),
    ('pre_cadastros', 'ctps_numero', 'omitir', 'documento de identificação'),
    ('pre_cadastros', 'ctps_serie', 'omitir', 'documento de identificação'),
    ('pre_cadastros', 'cnh_numero', 'omitir', 'documento de identificação'),
    ('pre_cadastros', 'certificado_reservista', 'omitir', 'documento de identificação'),
    ('pre_cadastros', 'data_nascimento', 'omitir', 'data de nascimento'),
    ('pre_cadastros', 'email', 'omitir', 'contato pessoal'),
    ('pre_cadastros', 'telefone_fixo', 'omitir', 'contato pessoal'),
    ('pre_cadastros', 'telefone_celular', 'omitir', 'contato pessoal'),
    ('pre_cadastros', 'telefone_emergencia', 'omitir', 'contato pessoal'),
    ('pre_cadastros', 'contato_emergencia_nome', 'omitir', 'contato pessoal (terceiro)'),
    ('pre_cadastros', 'endereco_logradouro', 'omitir', 'endereço'),
    ('pre_cadastros', 'endereco_numero', 'omitir', 'endereço'),
    ('pre_cadastros', 'endereco_complemento', 'omitir', 'endereço'),
    ('pre_cadastros', 'endereco_bairro', 'omitir', 'endereço'),
    ('pre_cadastros', 'endereco_cep', 'omitir', 'endereço'),
    ('pre_cadastros', 'banco_agencia', 'omitir', 'dado bancário'),
    ('pre_cadastros', 'banco_conta', 'omitir', 'dado bancário'),
    ('pre_cadastros', 'dependentes', 'omitir', 'dependentes (CPF, nome e nascimento de terceiros)'),
    ('pre_cadastros', 'nome_mae', 'omitir', 'filiação'),
    ('pre_cadastros', 'nome_pai', 'omitir', 'filiação'),
    ('pre_cadastros', 'raca_cor', 'omitir', 'dado sensível (origem racial)'),
    ('pre_cadastros', 'pcd', 'omitir', 'dado sensível (saúde)'),
    ('pre_cadastros', 'pcd_tipo', 'omitir', 'dado sensível (saúde)'),
    ('pre_cadastros', 'tipo_sanguineo', 'omitir', 'dado sensível (saúde)'),
    ('pre_cadastros', 'molestia_grave', 'omitir', 'dado sensível (saúde)'),
    ('pre_cadastros', 'indicacao', 'omitir', 'indicação (acesso restrito)'),
    -- dependentes e pensão (dados de terceiros)
    ('dependentes_irrf', 'cpf', 'parcial', 'CPF'),
    ('dependentes_irrf', 'data_nascimento', 'omitir', 'data de nascimento'),
    ('pensoes_alimenticias', 'beneficiario_cpf', 'parcial', 'CPF'),
    ('pensoes_alimenticias', 'beneficiario_data_nascimento', 'omitir', 'data de nascimento'),
    ('pensoes_alimenticias', 'banco_agencia', 'omitir', 'dado bancário'),
    ('pensoes_alimenticias', 'banco_conta', 'omitir', 'dado bancário'),
    ('pensoes_alimenticias', 'pix_chave', 'omitir', 'dado bancário'),
    -- dado bancário da folha e da autarquia
    ('fichas_financeiras', 'banco_agencia', 'omitir', 'dado bancário'),
    ('fichas_financeiras', 'banco_conta', 'omitir', 'dado bancário'),
    ('contas_autarquia', 'agencia', 'omitir', 'dado bancário'),
    ('contas_autarquia', 'agencia_digito', 'omitir', 'dado bancário'),
    ('contas_autarquia', 'conta', 'omitir', 'dado bancário'),
    ('contas_autarquia', 'conta_digito', 'omitir', 'dado bancário'),
    -- saúde
    ('licencas_afastamentos', 'cid', 'omitir', 'dado sensível (saúde)'),
    -- responsáveis da instituição
    ('config_autarquia', 'cpf_responsavel', 'parcial', 'CPF'),
    ('config_autarquia', 'cpf_contabil', 'parcial', 'CPF'),
    ('config_institucional', 'cpf_responsavel', 'parcial', 'CPF'),
    ('config_institucional', 'contato', 'omitir', 'contato pessoal do responsável legal'),
    -- ponto e pacotes
    ('registros_ponto', 'latitude', 'omitir', 'geolocalização'),
    ('registros_ponto', 'longitude', 'omitir', 'geolocalização'),
    ('registros_ponto', 'ip_address', 'omitir', 'endereço IP'),
    ('frequencia_pacotes', 'link_download', 'omitir', 'link de download (credencial)'),
    -- identidade (trilha do módulo admin)
    ('profiles', 'cpf', 'parcial', 'CPF'),
    ('profiles', 'email', 'omitir', 'contato pessoal')
  ) AS v(tabela, coluna, tratamento, motivo)
 WHERE EXISTS (SELECT 1 FROM pg_attribute a
                WHERE a.attrelid = to_regclass('public.' || v.tabela) AND a.attname = v.coluna
                  AND a.attnum > 0 AND NOT a.attisdropped)
ON CONFLICT (tabela, coluna) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. Funções de apoio
-- ----------------------------------------------------------------------------
-- Quem é o responsável agora: o usuário, o servidor vinculado ao perfil NESTE momento (retrato; não exige perfil
-- ativo: é registro, não permissão), nome e matrícula, e a origem. Sem EXECUTE para a API: quem a chama são os
-- triggers e RPCs SECURITY DEFINER desta migração.
CREATE OR REPLACE FUNCTION public.responsavel_atual()
RETURNS TABLE (user_id uuid, servidor_id uuid, servidor_nome text, servidor_matricula text, origem text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT u.uid,
         p.servidor_id,
         s.nome_completo::text,
         s.matricula::text,
         CASE
           WHEN u.uid IS NULL AND coalesce(current_setting('role', true), 'none') IN ('anon', 'authenticated') THEN 'anonimo'
           WHEN u.uid IS NULL THEN 'sistema'
           WHEN p.servidor_id IS NULL THEN 'usuario_sem_vinculo'
           ELSE 'usuario'
         END
    FROM (SELECT auth.uid() AS uid) u
    LEFT JOIN public.profiles p ON p.id = u.uid
    LEFT JOIN public.servidores s ON s.id = p.servidor_id
$$;
COMMENT ON FUNCTION public.responsavel_atual() IS
  'Responsável pelo comando atual: usuário, servidor vinculado (retrato), nome, matrícula e origem (usuario, usuario_sem_vinculo, sistema, anonimo)';

-- Decisão 1 da revisão do RH (premissa 1 da spec): usuário sem servidor vinculado PODE lançar no RH, e a trilha marca
-- "usuario_sem_vinculo". Para bloquear, troque `false` por `true` numa migração nova (fixar_autoria passa a recusar).
CREATE OR REPLACE FUNCTION public.rh_exige_servidor_vinculado()
RETURNS boolean LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT false
$$;

-- Máscara parcial (CPF/PIS): só os dígitos do meio. 11 dígitos: ***.456.789-**; outros tamanhos: os 3 primeiros e os
-- 2 últimos viram *; menos de 6 dígitos: "[protegido]".
CREATE OR REPLACE FUNCTION public.mascarar_parcial(p_valor text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
           WHEN p_valor IS NULL THEN NULL
           WHEN length(d) = 11 THEN '***.' || substr(d, 4, 3) || '.' || substr(d, 7, 3) || '-**'
           WHEN length(d) >= 6 THEN '***' || substr(d, 4, length(d) - 5) || '**'
           ELSE '[protegido]'
         END
    FROM (SELECT regexp_replace(p_valor, '\D', '', 'g') AS d) x
$$;

-- Aplica audit_colunas_sensiveis a uma linha (jsonb). Valor nulo continua nulo.
CREATE OR REPLACE FUNCTION public.trilha_mascarar(p_tabela text, p_linha jsonb)
RETURNS jsonb LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT CASE WHEN p_linha IS NULL THEN NULL ELSE
    p_linha || coalesce((
      SELECT jsonb_object_agg(s.coluna,
               CASE
                 WHEN jsonb_typeof(p_linha -> s.coluna) = 'null' THEN 'null'::jsonb
                 WHEN s.tratamento = 'parcial' THEN to_jsonb(public.mascarar_parcial(p_linha ->> s.coluna))
                 ELSE to_jsonb('[protegido]'::text)
               END)
        FROM public.audit_colunas_sensiveis s
       WHERE s.tabela = p_tabela AND p_linha ? s.coluna), '{}'::jsonb)
  END
$$;

-- IP e user agent da requisição (PostgREST grava os cabeçalhos em request.headers). x-forwarded-for: primeiro item;
-- senão x-real-ip. Cabeçalho ausente ou inválido: NULL, sem erro.
CREATE OR REPLACE FUNCTION public.trilha_contexto_requisicao(OUT ip inet, OUT agente text)
LANGUAGE plpgsql STABLE SET search_path = public AS $$
DECLARE
  bruto text := current_setting('request.headers', true);
  h jsonb;
BEGIN
  IF bruto IS NULL OR btrim(bruto) = '' THEN
    RETURN;
  END IF;
  BEGIN
    h := bruto::jsonb;
    IF jsonb_typeof(h) <> 'object' THEN
      RETURN;
    END IF;
    agente := left(h ->> 'user-agent', 500);
    ip := nullif(btrim(split_part(coalesce(nullif(h ->> 'x-forwarded-for', ''), h ->> 'x-real-ip', ''), ',', 1)), '')::inet;
  EXCEPTION WHEN OTHERS THEN
    ip := NULL;
  END;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. audit_logs: contexto completado pelo banco
-- ----------------------------------------------------------------------------
-- Quem grava em audit_logs (fn_audit_trigger, log_audit, fechar_folha, reabrir_folha, audit_permission_changes,
-- Edge Functions pela service role) passa a ter servidor, origem, papel, unidade, IP, user agent e transação
-- preenchidos quando não os informa. O servidor é o do perfil de user_id (retrato).
CREATE OR REPLACE FUNCTION public.trilha_completar_contexto()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r record;
  c record;
BEGIN
  SELECT * INTO r FROM public.responsavel_atual();
  NEW.transacao := coalesce(NEW.transacao, txid_current());
  NEW.origem := coalesce(NEW.origem, r.origem);
  IF NEW.user_id IS NOT NULL AND NEW.servidor_id IS NULL THEN
    IF NEW.user_id IS NOT DISTINCT FROM r.user_id THEN
      NEW.servidor_id := r.servidor_id;
      NEW.servidor_nome := coalesce(NEW.servidor_nome, r.servidor_nome);
      NEW.servidor_matricula := coalesce(NEW.servidor_matricula, r.servidor_matricula);
    ELSE
      SELECT p.servidor_id, s.nome_completo::text AS nome, s.matricula::text AS matricula INTO c
        FROM public.profiles p LEFT JOIN public.servidores s ON s.id = p.servidor_id
       WHERE p.id = NEW.user_id;
      NEW.servidor_id := c.servidor_id;
      NEW.servidor_nome := coalesce(NEW.servidor_nome, c.nome);
      NEW.servidor_matricula := coalesce(NEW.servidor_matricula, c.matricula);
    END IF;
  END IF;
  IF NEW.user_id IS NOT NULL AND NEW.role_at_time IS NULL THEN
    SELECT ur.role INTO NEW.role_at_time FROM public.user_roles ur
     WHERE ur.user_id = NEW.user_id ORDER BY (ur.role = 'admin') DESC LIMIT 1;
  END IF;
  IF NEW.user_id IS NOT NULL AND NEW.org_unit_id IS NULL THEN
    SELECT uo.unidade_id INTO NEW.org_unit_id FROM public.user_org_units uo
     WHERE uo.user_id = NEW.user_id AND uo.is_primary = true LIMIT 1;
  END IF;
  IF NEW.ip_address IS NULL OR NEW.user_agent IS NULL THEN
    SELECT * INTO c FROM public.trilha_contexto_requisicao();
    NEW.ip_address := coalesce(NEW.ip_address, c.ip);
    NEW.user_agent := coalesce(NEW.user_agent, c.agente);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trilha_completar_contexto ON public.audit_logs;
CREATE TRIGGER trilha_completar_contexto
  BEFORE INSERT ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.trilha_completar_contexto();

-- ----------------------------------------------------------------------------
-- 5. fn_audit_trigger v2 (mesma assinatura: fn_audit_trigger('<módulo>'), AFTER INSERT OR UPDATE OR DELETE)
-- ----------------------------------------------------------------------------
-- Compatível com as 15 tabelas que já a usavam. Muda: servidor e origem do responsável; campos_alterados no UPDATE
-- (sem as colunas updated_* que todo UPDATE mexe); UPDATE sem mudança não grava; antes/depois mascarados por
-- audit_colunas_sensiveis; tabela sem coluna `id` uuid grava entity_id NULL e a chave primária em metadata.chave.
-- Papel, unidade, IP, user agent e transação vêm do trigger trilha_completar_contexto (bloco 4).
CREATE OR REPLACE FUNCTION public.fn_audit_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_acao text;
  v_antes jsonb;
  v_depois jsonb;
  v_campos text[];
  v_id text;
  v_entidade uuid;
  v_chave jsonb;
  v_descricao text;
  r record;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_acao := 'create';
    v_depois := to_jsonb(NEW);
    v_descricao := 'Registro criado em ' || TG_TABLE_NAME;
  ELSIF TG_OP = 'UPDATE' THEN
    v_acao := 'update';
    v_antes := to_jsonb(OLD);
    v_depois := to_jsonb(NEW);
    SELECT array_agg(k ORDER BY k) INTO v_campos
      FROM jsonb_object_keys(v_depois) AS k
     WHERE (v_depois -> k) IS DISTINCT FROM (v_antes -> k)
       AND k NOT IN ('updated_at', 'updated_by', 'updated_by_servidor_id');
    IF v_campos IS NULL THEN
      RETURN NEW;   -- nada mudou além do carimbo de atualização
    END IF;
    v_descricao := 'Registro atualizado em ' || TG_TABLE_NAME;
  ELSE
    v_acao := 'delete';
    v_antes := to_jsonb(OLD);
    v_descricao := 'Registro excluído de ' || TG_TABLE_NAME;
  END IF;

  v_id := coalesce(v_depois, v_antes) ->> 'id';
  IF v_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_entidade := v_id::uuid;
  END IF;

  v_antes := public.trilha_mascarar(TG_TABLE_NAME, v_antes);
  v_depois := public.trilha_mascarar(TG_TABLE_NAME, v_depois);

  IF v_entidade IS NULL THEN
    SELECT jsonb_object_agg(a.attname, coalesce(v_depois, v_antes) -> a.attname) INTO v_chave
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY (i.indkey)
     WHERE i.indrelid = TG_RELID AND i.indisprimary;
  END IF;

  SELECT * INTO r FROM public.responsavel_atual();

  INSERT INTO public.audit_logs (
    action, entity_type, entity_id, module_name, before_data, after_data, user_id, description, metadata,
    campos_alterados, origem, servidor_id, servidor_nome, servidor_matricula
  ) VALUES (
    v_acao::public.audit_action, TG_TABLE_NAME, v_entidade, TG_ARGV[0], v_antes, v_depois, r.user_id, v_descricao,
    jsonb_build_object('trigger', true, 'operation', TG_OP, 'table', TG_TABLE_NAME)
      || CASE WHEN v_chave IS NOT NULL THEN jsonb_build_object('chave', v_chave) ELSE '{}'::jsonb END,
    v_campos, r.origem, r.servidor_id, r.servidor_nome, r.servidor_matricula
  );

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. Trilha imutável
-- ----------------------------------------------------------------------------
-- UPDATE, DELETE e TRUNCATE recusados para todos (inclusive postgres, service role e superusuário). Os triggers são
-- ENABLE ALWAYS: também valem com session_replication_role = replica.
-- Exceções:
--   * expurgo: a sessão que fizer `SET LOCAL trilha.expurgo = 'autorizado'` passa. Reservado a uma rotina futura de
--     retenção, documentada e aprovada (decisão 11: hoje nenhum expurgo). Exige acesso SQL direto: a API não define GUC.
--   * cascata do pai (argumentos <coluna_fk>, <tabela_pai>): folha_historico_status some junto com a folha e
--     rubricas_historico junto com a rubrica (FK ON DELETE CASCADE). A exclusão do pai fica na trilha (audit_logs,
--     fn_audit_trigger); só passa quando o pai já não existe.
CREATE OR REPLACE FUNCTION public.trilha_imutavel()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_pai_existe boolean;
BEGIN
  IF current_setting('trilha.expurgo', true) = 'autorizado' THEN
    RETURN CASE TG_OP WHEN 'DELETE' THEN OLD WHEN 'UPDATE' THEN NEW ELSE NULL END;
  END IF;
  IF TG_OP = 'DELETE' AND TG_NARGS = 2 THEN
    EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.%I WHERE id = $1)', TG_ARGV[1])
      INTO v_pai_existe USING (to_jsonb(OLD) ->> TG_ARGV[0])::uuid;
    IF NOT v_pai_existe THEN
      RETURN OLD;
    END IF;
  END IF;
  RAISE EXCEPTION 'Trilha de auditoria imutável: % em % recusado', TG_OP, TG_TABLE_NAME
    USING ERRCODE = '42501',
          HINT = 'Registros de auditoria não são alterados nem apagados (migração 20261011000000).';
END;
$$;

DROP TRIGGER IF EXISTS trilha_imutavel ON public.audit_logs;
CREATE TRIGGER trilha_imutavel
  BEFORE UPDATE OR DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.trilha_imutavel();
DROP TRIGGER IF EXISTS trilha_imutavel_truncate ON public.audit_logs;
CREATE TRIGGER trilha_imutavel_truncate
  BEFORE TRUNCATE ON public.audit_logs
  FOR EACH STATEMENT EXECUTE FUNCTION public.trilha_imutavel();
ALTER TABLE public.audit_logs ENABLE ALWAYS TRIGGER trilha_imutavel;
ALTER TABLE public.audit_logs ENABLE ALWAYS TRIGGER trilha_imutavel_truncate;

DO $$
DECLARE
  t record;
BEGIN
  FOR t IN SELECT * FROM (VALUES
      ('folha_historico_status', 'folha_id', 'folhas_pagamento'),
      ('rubricas_historico', 'rubrica_id', 'rubricas')
    ) AS x(tabela, fk, pai)
  LOOP
    IF to_regclass('public.' || t.tabela) IS NULL THEN
      RAISE NOTICE 'trilha imutável: tabela % não existe neste banco; pulada', t.tabela;
      CONTINUE;
    END IF;
    EXECUTE format('DROP TRIGGER IF EXISTS trilha_imutavel ON public.%I', t.tabela);
    EXECUTE format('CREATE TRIGGER trilha_imutavel BEFORE UPDATE OR DELETE ON public.%I '
                   'FOR EACH ROW EXECUTE FUNCTION public.trilha_imutavel(%L, %L)', t.tabela, t.fk, t.pai);
    EXECUTE format('DROP TRIGGER IF EXISTS trilha_imutavel_truncate ON public.%I', t.tabela);
    EXECUTE format('CREATE TRIGGER trilha_imutavel_truncate BEFORE TRUNCATE ON public.%I '
                   'FOR EACH STATEMENT EXECUTE FUNCTION public.trilha_imutavel()', t.tabela);
    EXECUTE format('ALTER TABLE public.%I ENABLE ALWAYS TRIGGER trilha_imutavel', t.tabela);
    EXECUTE format('ALTER TABLE public.%I ENABLE ALWAYS TRIGGER trilha_imutavel_truncate', t.tabela);
    EXECUTE format('REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.%I FROM anon, authenticated', t.tabela);
  END LOOP;
END $$;
-- audit_logs: só acréscimo também por privilégio (como na migração 20261006230500 e no overlay/40)
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.audit_logs FROM anon, authenticated;

-- ----------------------------------------------------------------------------
-- 7. fixar_autoria(): autoria gravada pelo banco
-- ----------------------------------------------------------------------------
-- Colunas padrão (o laço do bloco 8 as cria onde faltam): created_at, created_by, created_by_servidor_id, updated_at,
-- updated_by, updated_by_servidor_id.
--   INSERT: created_* e updated_* = responsável atual, agora.
--   UPDATE: created_* voltam aos valores antigos (ninguém troca, nem admin); updated_* = responsável atual, agora.
--   Origem `sistema` (sem auth.uid(), fora dos papéis da API): pode informar o autor (Edge Function agindo em nome de
--   alguém); o servidor é derivado do perfil informado. Sem autor informado no UPDATE, updated_by fica NULL (sistema).
-- Argumentos (colunas de decisão), um por coluna, no formato `[+]<coluna_por>[:<coluna_em>]`:
--   <coluna_por>[:<coluna_em>]   decisão: quando o par muda para um valor não nulo, vira auth.uid() e now() (o cliente
--                                não escolhe quem decidiu nem quando); quando <coluna_por> vai a NULL, a decisão foi
--                                desfeita e <coluna_em> também vai a NULL; data sem autor não muda
--   +<coluna_por>[:<coluna_em>]  criação: no INSERT é auth.uid() e now(); no UPDATE não muda
-- Sem isenção para o papel admin. Coluna inexistente no argumento é ignorada.
-- O nome do trigger começa com "zz_" para rodar por ÚLTIMO entre os BEFORE (ordem alfabética: depois de
-- set_updated_at, trg_forcar_campos_iniciais, trg_registrar_transicao_folha, trg_validar_etapa_frequencia,
-- trigger_validar_*, update_*_updated_at): a autoria final é sempre a do banco.
CREATE OR REPLACE FUNCTION public.fixar_autoria()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r record;
  v_informa boolean;
  n jsonb;
  o jsonb;
  ov jsonb := '{}'::jsonb;
  i int;
  arg text;
  v_criacao boolean;
  c_por text;
  c_em text;
BEGIN
  SELECT * INTO r FROM public.responsavel_atual();
  v_informa := r.origem = 'sistema';
  IF r.origem = 'usuario_sem_vinculo' AND public.rh_exige_servidor_vinculado() THEN
    RAISE EXCEPTION 'Lançamento no RH exige usuário com servidor vinculado ao perfil (%)', TG_TABLE_NAME
      USING ERRCODE = '42501';
  END IF;

  -- colunas padrão
  IF TG_OP = 'INSERT' THEN
    IF v_informa THEN
      NEW.created_by_servidor_id := coalesce(
        (SELECT p.servidor_id FROM public.profiles p WHERE p.id = NEW.created_by), NEW.created_by_servidor_id);
      NEW.created_at := coalesce(NEW.created_at, now());
    ELSE
      NEW.created_by := r.user_id;
      NEW.created_by_servidor_id := r.servidor_id;
      NEW.created_at := now();
    END IF;
    NEW.updated_by := NEW.created_by;
    NEW.updated_by_servidor_id := NEW.created_by_servidor_id;
    NEW.updated_at := NEW.created_at;
  ELSE
    NEW.created_by := OLD.created_by;
    NEW.created_by_servidor_id := OLD.created_by_servidor_id;
    NEW.created_at := OLD.created_at;
    IF v_informa THEN
      IF NEW.updated_by IS NOT NULL AND NEW.updated_by IS DISTINCT FROM OLD.updated_by THEN
        NEW.updated_by_servidor_id := coalesce(
          (SELECT p.servidor_id FROM public.profiles p WHERE p.id = NEW.updated_by), NEW.updated_by_servidor_id);
      ELSE
        NEW.updated_by := NULL;
        NEW.updated_by_servidor_id := NULL;
      END IF;
    ELSE
      NEW.updated_by := r.user_id;
      NEW.updated_by_servidor_id := r.servidor_id;
    END IF;
    NEW.updated_at := now();
  END IF;

  -- colunas de decisão (argumentos)
  IF TG_NARGS > 0 AND NOT v_informa THEN
    n := to_jsonb(NEW);
    o := CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE '{}'::jsonb END;
    FOR i IN 0 .. TG_NARGS - 1 LOOP
      arg := TG_ARGV[i];
      v_criacao := left(arg, 1) = '+';
      IF v_criacao THEN
        arg := substr(arg, 2);
      END IF;
      c_por := split_part(arg, ':', 1);
      c_em := nullif(split_part(arg, ':', 2), '');
      CONTINUE WHEN NOT (n ? c_por);
      IF c_em IS NOT NULL AND NOT (n ? c_em) THEN
        c_em := NULL;
      END IF;
      IF v_criacao THEN
        IF TG_OP = 'INSERT' THEN
          ov := ov || jsonb_build_object(c_por, r.user_id);
          IF c_em IS NOT NULL THEN ov := ov || jsonb_build_object(c_em, now()); END IF;
        ELSE
          ov := ov || jsonb_build_object(c_por, o -> c_por);
          IF c_em IS NOT NULL THEN ov := ov || jsonb_build_object(c_em, o -> c_em); END IF;
        END IF;
      ELSIF (n ->> c_por) IS NULL THEN
        IF c_em IS NOT NULL THEN
          IF (o ->> c_por) IS NOT NULL THEN
            ov := ov || jsonb_build_object(c_em, NULL);              -- decisão desfeita
          ELSIF (n ->> c_em) IS DISTINCT FROM (o ->> c_em) THEN
            ov := ov || jsonb_build_object(c_em, o -> c_em);         -- data sem autor não muda
          END IF;
        END IF;
      ELSIF (n ->> c_por) IS DISTINCT FROM (o ->> c_por)
            OR (c_em IS NOT NULL AND (n ->> c_em) IS DISTINCT FROM (o ->> c_em)) THEN
        ov := ov || jsonb_build_object(c_por, r.user_id);
        IF c_em IS NOT NULL THEN ov := ov || jsonb_build_object(c_em, now()); END IF;
      END IF;
    END LOOP;
    IF ov <> '{}'::jsonb THEN
      NEW := jsonb_populate_record(NEW, ov);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 8. As 79 tabelas do RH (linhas com `rh` em modulos no supabase/baseline/rls/mapa.csv)
-- ----------------------------------------------------------------------------
-- 77 recebem as colunas padrão, zz_fixar_autoria e audit_<tabela> (fn_audit_trigger('rh')); as 2 de classe trilha
-- (folha_historico_status, rubricas_historico) só a imutabilidade (bloco 6). Todas perdem TRUNCATE/TRIGGER/REFERENCES
-- pela API. As tabelas de mais de um módulo (ex.: documentos, contas_autarquia) gravam a trilha como 'rh': quem lê a
-- trilha do RH já lê essas tabelas pela RLS. As colunas *_servidor_id são retrato, sem FK; as *_by novas não têm FK
-- (as que já existiam mantêm tipo e FK). Colunas novas nascem sem DEFAULT: linhas antigas ficam NULL (não se inventa
-- data nem autor); o trigger preenche as novas.
-- Colunas de decisão (fixar_autoria): as quatro tabelas de etapa da frequência (solicitacoes_abono,
-- frequencia_fechamento, justificativas_ponto, solicitacoes_ajuste_ponto) seguem com a autoria das etapas em
-- validar_etapa_frequencia; fechado_por, reaberto_por e conferido_por da folha, em registrar_transicao_folha (bloco 10).
DO $$
DECLARE
  t record;
  col text;
  args text;
BEGIN
  FOR t IN SELECT * FROM (VALUES
      ('adicionais_tempo_servico', '{}'::text[]),
      ('agrupamento_unidade_vinculo', '{}'),
      ('banco_horas', '{}'),
      ('bancos_cnab', '{}'),
      ('cargo_unidade_compatibilidade', '{}'),
      ('cargos', '{}'),
      ('cessoes', '{}'),
      ('composicao_cargos', '{}'),
      ('config_agrupamento_unidades', '{}'),
      ('config_assinatura_frequencia', '{}'),
      ('config_autarquia', '{}'),
      ('config_compensacao', '{}'),
      ('config_fechamento_folha', '{}'),
      ('config_fechamento_frequencia', '{fechado_por:fechado_em,consolidado_por:consolidado_em}'),
      ('config_incidencias', '{}'),
      ('config_institucional', '{}'),
      ('config_jornada_padrao', '{}'),
      ('config_motivos_desligamento', '{}'),
      ('config_regras_calculo', '{}'),
      ('config_rubricas', '{}'),
      ('config_situacoes_funcionais', '{}'),
      ('config_tipos_ato', '{}'),
      ('config_tipos_onus', '{}'),
      ('config_tipos_rubrica', '{}'),
      ('config_tipos_servidor', '{}'),
      ('configuracao_jornada', '{}'),
      ('consignacoes', '{}'),
      ('contas_autarquia', '{}'),
      ('dependentes_irrf', '{}'),
      ('designacoes', '{aprovado_por:data_aprovacao}'),
      ('dias_nao_uteis', '{}'),
      ('documentos', '{}'),
      ('documentos_requerimento_servidor', '{}'),
      ('eventos_esocial', '{+gerado_por:data_geracao}'),
      ('exportacoes_folha', '{+gerado_por:gerado_em,enviado_por:enviado_em}'),
      ('feriados', '{}'),
      ('ferias_servidor', '{}'),
      ('fichas_financeiras', '{}'),
      ('folhas_pagamento', '{processado_por}'),
      ('frequencia_arquivos', '{}'),
      ('frequencia_fechamento', '{}'),
      ('frequencia_mensal', '{}'),
      ('frequencia_pacotes', '{}'),
      ('historico_funcional', '{}'),
      ('horarios_jornada', '{}'),
      ('itens_ficha_financeira', '{}'),
      ('itens_retorno_bancario', '{}'),
      ('justificativas_ponto', '{}'),
      ('lancamentos_banco_horas', '{}'),
      ('lancamentos_folha', '{}'),
      ('licencas_afastamentos', '{}'),
      ('lotacoes', '{}'),
      ('memorandos_lotacao', '{+emitido_por}'),
      ('nomeacoes_chefe_unidade', '{}'),
      ('ocorrencias_servidor', '{}'),
      ('parametros_folha', '{}'),
      ('pensoes_alimenticias', '{}'),
      ('portarias_servidor', '{}'),
      ('pre_cadastros', '{convertido_por:convertido_em}'),
      ('provimentos', '{}'),
      ('regimes_trabalho', '{}'),
      ('registros_ponto', '{aprovador_id:data_aprovacao}'),
      ('remessas_bancarias', '{+gerado_por:data_geracao,enviado_por:enviado_em}'),
      ('retornos_bancarios', '{+processado_por}'),
      ('rubricas', '{}'),
      ('servidor_regime', '{}'),
      ('servidor_tag_vinculos', '{}'),
      ('servidor_tags', '{}'),
      ('servidores', '{}'),
      ('solicitacoes_abono', '{}'),
      ('solicitacoes_ajuste_ponto', '{}'),
      ('tabela_inss', '{}'),
      ('tabela_irrf', '{}'),
      ('tipos_abono', '{}'),
      ('viagens_diarias', '{}'),
      ('vinculos_funcionais', '{}'),
      ('vinculos_servidor', '{}')
    ) AS x(tabela, decisoes)
  LOOP
    IF to_regclass('public.' || t.tabela) IS NULL THEN
      RAISE NOTICE 'autoria/trilha do RH: tabela % não existe neste banco; pulada', t.tabela;
      CONTINUE;
    END IF;

    -- colunas padrão de autoria (as que já existem mantêm tipo, DEFAULT e FK)
    EXECUTE format('ALTER TABLE public.%I '
                   'ADD COLUMN IF NOT EXISTS created_at timestamptz, '
                   'ADD COLUMN IF NOT EXISTS created_by uuid, '
                   'ADD COLUMN IF NOT EXISTS created_by_servidor_id uuid, '
                   'ADD COLUMN IF NOT EXISTS updated_at timestamptz, '
                   'ADD COLUMN IF NOT EXISTS updated_by uuid, '
                   'ADD COLUMN IF NOT EXISTS updated_by_servidor_id uuid', t.tabela);

    -- argumentos de decisão: só as colunas que existem nesta tabela
    args := '';
    FOREACH col IN ARRAY t.decisoes LOOP
      IF EXISTS (SELECT 1 FROM pg_attribute a
                  WHERE a.attrelid = ('public.' || t.tabela)::regclass AND a.attnum > 0 AND NOT a.attisdropped
                    AND a.attname = split_part(ltrim(col, '+'), ':', 1)) THEN
        args := args || CASE WHEN args = '' THEN '' ELSE ', ' END || quote_literal(col);
      ELSE
        RAISE NOTICE 'autoria do RH: %.% não existe; argumento % ignorado', t.tabela, split_part(ltrim(col, '+'), ':', 1), col;
      END IF;
    END LOOP;

    EXECUTE format('DROP TRIGGER IF EXISTS zz_fixar_autoria ON public.%I', t.tabela);
    EXECUTE format('CREATE TRIGGER zz_fixar_autoria BEFORE INSERT OR UPDATE ON public.%I '
                   'FOR EACH ROW EXECUTE FUNCTION public.fixar_autoria(%s)', t.tabela, args);

    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', 'audit_' || t.tabela, t.tabela);
    EXECUTE format('CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON public.%I '
                   'FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger(%L)', 'audit_' || t.tabela, t.tabela, 'rh');

    EXECUTE format('REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.%I FROM anon, authenticated', t.tabela);
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 9. Trilha do módulo admin: vínculo do perfil, permissões avulsas, unidades e o catálogo da máscara
-- ----------------------------------------------------------------------------
-- profiles: só as colunas de identidade e acesso (servidor_id, is_active, bloqueio, tipo, CPF, e-mail, restrição de
-- módulos); nome, avatar e troca de senha não geram linha. user_roles e user_modules já têm audit_permission_changes.
DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
    CREATE TRIGGER audit_profiles
      AFTER INSERT OR DELETE OR UPDATE OF servidor_id, is_active, blocked_at, blocked_reason, tipo_usuario, cpf, email,
        restringir_modulos ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('admin');
  END IF;
  IF to_regclass('public.user_permissions') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS audit_user_permissions ON public.user_permissions;
    CREATE TRIGGER audit_user_permissions
      AFTER INSERT OR UPDATE OR DELETE ON public.user_permissions
      FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('admin');
  END IF;
  IF to_regclass('public.user_org_units') IS NOT NULL THEN
    DROP TRIGGER IF EXISTS audit_user_org_units ON public.user_org_units;
    CREATE TRIGGER audit_user_org_units
      AFTER INSERT OR UPDATE OR DELETE ON public.user_org_units
      FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('admin');
  END IF;
END $$;
DROP TRIGGER IF EXISTS audit_audit_colunas_sensiveis ON public.audit_colunas_sensiveis;
CREATE TRIGGER audit_audit_colunas_sensiveis
  AFTER INSERT OR UPDATE OR DELETE ON public.audit_colunas_sensiveis
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('admin');

-- ----------------------------------------------------------------------------
-- 10. Folha
-- ----------------------------------------------------------------------------
-- registrar_transicao_folha: antes `COALESCE(NEW.fechado_por, auth.uid())` deixava o cliente escolher quem fechou,
-- conferiu ou reabriu. Agora, em sessão da API (ou qualquer uma com auth.uid()), o par é sempre de quem age, agora, e
-- fora da transição de status o par não muda; só a origem `sistema` (sem auth.uid(), fora dos papéis da API) informa
-- o valor (mantém o COALESCE de antes). Mesmo texto em supabase/baseline/overlay/18_funcoes_rpc.sql.
CREATE OR REPLACE FUNCTION public.registrar_transicao_folha()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_nome TEXT;
  v_uid uuid := auth.uid();
  v_informa boolean := auth.uid() IS NULL
    AND coalesce(current_setting('role', true), 'none') NOT IN ('anon', 'authenticated');
BEGIN
  SELECT full_name INTO v_user_nome FROM public.profiles WHERE id = v_uid;

  -- quem fechou, conferiu ou reabriu só muda na transição de status (abaixo)
  IF NOT v_informa THEN
    NEW.fechado_por := OLD.fechado_por;
    NEW.fechado_em := OLD.fechado_em;
    NEW.conferido_por := OLD.conferido_por;
    NEW.conferido_em := OLD.conferido_em;
    NEW.reaberto_por := OLD.reaberto_por;
    NEW.reaberto_em := OLD.reaberto_em;
  END IF;

  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.folha_historico_status (
      folha_id, status_anterior, status_novo, usuario_id, usuario_nome, justificativa
    ) VALUES (
      NEW.id, OLD.status, NEW.status, v_uid, v_user_nome,
      CASE
        WHEN NEW.status = 'fechada' THEN NEW.justificativa_fechamento
        WHEN NEW.status = 'reaberta' THEN NEW.justificativa_reabertura
        ELSE NULL
      END
    );

    IF NEW.status = 'fechada' AND OLD.status != 'fechada' THEN
      NEW.fechado_por := CASE WHEN v_informa THEN COALESCE(NEW.fechado_por, v_uid) ELSE v_uid END;
      NEW.fechado_em := CASE WHEN v_informa THEN COALESCE(NEW.fechado_em, now()) ELSE now() END;
    END IF;

    IF NEW.status = 'processando' AND OLD.status = 'aberta' THEN
      NEW.conferido_por := CASE WHEN v_informa THEN COALESCE(NEW.conferido_por, v_uid) ELSE v_uid END;
      NEW.conferido_em := CASE WHEN v_informa THEN COALESCE(NEW.conferido_em, now()) ELSE now() END;
    END IF;

    IF NEW.status = 'reaberta' THEN
      NEW.reaberto_por := CASE WHEN v_informa THEN COALESCE(NEW.reaberto_por, v_uid) ELSE v_uid END;
      NEW.reaberto_em := CASE WHEN v_informa THEN COALESCE(NEW.reaberto_em, now()) ELSE now() END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- processar_folha_pagamento: corpo da migração 20261010070000 (guarda de permissão) + processado_por = auth.uid() no
-- UPDATE final. Nada mais muda.
CREATE OR REPLACE FUNCTION public.processar_folha_pagamento(p_folha_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_folha RECORD;
  v_servidor RECORD;
  v_count INTEGER := 0;
  v_errors JSONB := '[]'::jsonb;
  v_base_inss NUMERIC;
  v_valor_inss NUMERIC;
  v_base_irrf NUMERIC;
  v_valor_irrf NUMERIC;
  v_qtd_dependentes INTEGER;
  v_deducao_dependentes NUMERIC;
  v_total_descontos NUMERIC;
  v_valor_liquido NUMERIC;
  v_vencimento NUMERIC;
  v_data_referencia DATE;
  v_total_servidores_ativos INTEGER := 0;
  v_total_com_provimento INTEGER := 0;
  v_total_sem_vencimento INTEGER := 0;
BEGIN
  -- Guarda (migração 20261010070000): só quem tem a permissão de processar a folha (ou o papel admin,
  -- via has_permission_code) executa. 42501 = insufficient_privilege, mesmo código das policies.
  IF NOT public.has_permission_code(auth.uid(), 'financeiro.folha.processar') THEN
    RAISE EXCEPTION 'Sem permissão para processar a folha' USING ERRCODE = '42501';
  END IF;

  -- Buscar folha
  SELECT * INTO v_folha FROM folhas_pagamento WHERE id = p_folha_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('sucesso', false, 'erro', 'Folha não encontrada', 'servidores_processados', 0);
  END IF;
  
  -- Verificar status - permitir previa, aberta, reaberta ou processando
  IF v_folha.status NOT IN ('aberta', 'processando', 'reaberta', 'previa') THEN
    RETURN jsonb_build_object('sucesso', false, 'erro', 'Folha não está em status que permita processamento. Status atual: ' || v_folha.status, 'servidores_processados', 0);
  END IF;
  
  -- Data de referência para cálculos (último dia do mês da competência)
  v_data_referencia := (make_date(v_folha.competencia_ano, v_folha.competencia_mes, 1) + interval '1 month - 1 day')::date;
  
  -- Atualizar status para processando
  UPDATE folhas_pagamento SET status = 'processando', updated_at = now() WHERE id = p_folha_id;
  
  -- Limpar fichas existentes desta folha (para reprocessamento)
  DELETE FROM fichas_financeiras WHERE folha_id = p_folha_id;
  
  -- Contar total de servidores ativos
  SELECT COUNT(*) INTO v_total_servidores_ativos
  FROM servidores s
  WHERE s.situacao = 'ativo' AND s.ativo = true;
  
  -- Contar servidores com provimento ativo
  SELECT COUNT(DISTINCT s.id) INTO v_total_com_provimento
  FROM servidores s
  INNER JOIN provimentos p ON p.servidor_id = s.id AND p.status = 'ativo'
  WHERE s.situacao = 'ativo' AND s.ativo = true;
  
  -- Buscar servidores ativos com provimento ativo (incluindo dados bancários)
  FOR v_servidor IN
    SELECT 
      s.id,
      s.nome_completo,
      s.cpf,
      s.matricula,
      s.pis_pasep,
      s.banco_codigo,
      s.banco_nome,
      s.banco_agencia,
      s.banco_conta,
      s.banco_tipo_conta,
      p.cargo_id,
      p.unidade_id,
      c.nome AS cargo_nome,
      COALESCE(c.vencimento_base, 0) AS vencimento_base,
      eo.nome AS unidade_nome,
      eo.sigla AS unidade_sigla
    FROM servidores s
    INNER JOIN provimentos p ON p.servidor_id = s.id AND p.status = 'ativo'
    INNER JOIN cargos c ON c.id = p.cargo_id
    LEFT JOIN estrutura_organizacional eo ON eo.id = p.unidade_id
    WHERE s.situacao = 'ativo'
      AND s.ativo = true
  LOOP
    BEGIN
      -- Vencimento base do cargo
      v_vencimento := COALESCE(v_servidor.vencimento_base, 0);
      
      -- Se não tem vencimento, registrar erro e pular
      IF v_vencimento <= 0 THEN
        v_total_sem_vencimento := v_total_sem_vencimento + 1;
        v_errors := v_errors || jsonb_build_object(
          'servidor_id', v_servidor.id,
          'nome', v_servidor.nome_completo,
          'cargo', v_servidor.cargo_nome,
          'erro', 'Cargo sem vencimento base definido'
        );
        CONTINUE;
      END IF;
      
      -- Calcular INSS
      v_base_inss := v_vencimento;
      v_valor_inss := calcular_inss_servidor(v_base_inss, v_data_referencia);
      
      -- Contar dependentes e calcular dedução
      v_qtd_dependentes := count_dependentes_irrf(v_servidor.id, v_data_referencia);
      v_deducao_dependentes := v_qtd_dependentes * COALESCE(get_parametro_vigente('deducao_dependente_irrf', v_data_referencia), 189.59);
      
      -- Calcular IRRF
      v_base_irrf := v_vencimento - v_valor_inss - v_deducao_dependentes;
      IF v_base_irrf < 0 THEN v_base_irrf := 0; END IF;
      v_valor_irrf := calcular_irrf(v_base_irrf, v_data_referencia);
      
      -- Total de descontos
      v_total_descontos := v_valor_inss + v_valor_irrf;
      
      -- Valor líquido
      v_valor_liquido := v_vencimento - v_total_descontos;
      
      -- Inserir ficha financeira COM DADOS BANCÁRIOS
      INSERT INTO fichas_financeiras (
        folha_id,
        servidor_id,
        competencia_ano,
        competencia_mes,
        tipo_folha,
        cargo_id,
        cargo_nome,
        cargo_vencimento,
        unidade_id,
        unidade_nome,
        total_proventos,
        total_descontos,
        valor_liquido,
        base_inss,
        valor_inss,
        base_irrf,
        valor_irrf,
        quantidade_dependentes,
        valor_deducao_dependentes,
        -- DADOS BANCÁRIOS COPIADOS DO SERVIDOR
        banco_codigo,
        banco_nome,
        banco_agencia,
        banco_conta,
        banco_tipo_conta,
        processado,
        data_processamento,
        created_at
      ) VALUES (
        p_folha_id,
        v_servidor.id,
        v_folha.competencia_ano,
        v_folha.competencia_mes,
        v_folha.tipo_folha,
        v_servidor.cargo_id,
        v_servidor.cargo_nome,
        v_vencimento,
        v_servidor.unidade_id,
        COALESCE(v_servidor.unidade_sigla, '') || ' - ' || COALESCE(v_servidor.unidade_nome, ''),
        v_vencimento,
        v_total_descontos,
        v_valor_liquido,
        v_base_inss,
        v_valor_inss,
        v_base_irrf,
        v_valor_irrf,
        v_qtd_dependentes,
        v_deducao_dependentes,
        -- DADOS BANCÁRIOS
        v_servidor.banco_codigo,
        v_servidor.banco_nome,
        v_servidor.banco_agencia,
        v_servidor.banco_conta,
        v_servidor.banco_tipo_conta,
        true,
        now(),
        now()
      );
      
      v_count := v_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_object(
        'servidor_id', v_servidor.id,
        'nome', v_servidor.nome_completo,
        'erro', SQLERRM
      );
    END;
  END LOOP;
  
  -- Atualizar totais da folha - manter status "aberta" para permitir ajustes
  UPDATE folhas_pagamento
  SET 
    total_bruto = COALESCE((SELECT SUM(total_proventos) FROM fichas_financeiras WHERE folha_id = p_folha_id), 0),
    total_descontos = COALESCE((SELECT SUM(total_descontos) FROM fichas_financeiras WHERE folha_id = p_folha_id), 0),
    total_liquido = COALESCE((SELECT SUM(valor_liquido) FROM fichas_financeiras WHERE folha_id = p_folha_id), 0),
    total_inss_servidor = COALESCE((SELECT SUM(valor_inss) FROM fichas_financeiras WHERE folha_id = p_folha_id), 0),
    total_irrf = COALESCE((SELECT SUM(valor_irrf) FROM fichas_financeiras WHERE folha_id = p_folha_id), 0),
    quantidade_servidores = v_count,
    status = 'aberta',
    data_processamento = now(),
    -- E1 (migração 20261011000000): quem processou, gravado pelo banco (o trigger zz_fixar_autoria confirma)
    processado_por = auth.uid(),
    updated_at = now()
  WHERE id = p_folha_id;
  
  -- Retorno em formato JSONB
  RETURN jsonb_build_object(
    'sucesso', true,
    'servidores_processados', v_count,
    'total_servidores_ativos', v_total_servidores_ativos,
    'total_com_provimento', v_total_com_provimento,
    'total_sem_vencimento', v_total_sem_vencimento,
    'erros', v_errors
  );
  
EXCEPTION
  WHEN insufficient_privilege THEN
    -- Guarda de permissão (início do corpo): propaga o 42501. Sem esta cláusula o handler abaixo engolia
    -- a exceção e, como SECURITY DEFINER, "revertia" a folha para 'aberta' — inclusive uma folha fechada —
    -- a pedido de quem NÃO tem permissão.
    RAISE;
  WHEN OTHERS THEN
  -- Em caso de erro, reverter status
  UPDATE folhas_pagamento SET status = 'aberta', updated_at = now() WHERE id = p_folha_id;
  
  RETURN jsonb_build_object(
    'sucesso', false,
    'erro', SQLERRM,
    'servidores_processados', v_count
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.processar_folha_pagamento(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.processar_folha_pagamento(uuid) TO authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 11. Frequência (B2): validar_etapa_frequencia sem o atalho do admin para a AUTORIA
-- ----------------------------------------------------------------------------
-- Corpo da migração 20261010100000 com uma mudança: o papel admin deixa de sair antes de tudo. As checagens de
-- permissão passam para ele (has_permission_code dá passagem ao admin) e as regras de etapa que não são de permissão
-- (status nulo ou legado, chave do fechamento, assinatura de outro servidor) continuam dispensadas (`NOT v_admin`);
-- a autoria (par _por/_em de cada etapa e created_by do abono) passa a valer também para o admin.
CREATE OR REPLACE FUNCTION public.validar_etapa_frequencia()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  -- E1: o papel admin continua dispensado das REGRAS de etapa (abaixo, `NOT v_admin`; as checagens de permissão
  -- passam porque has_permission_code dá passagem ao admin), mas não da AUTORIA: o par _por/_em e o created_by
  -- do abono são gravados pelo banco também para ele.
  v_admin boolean;
  v_chefia boolean;
  v_rh boolean;
  o jsonb;
  n jsonb;
  ov jsonb := '{}'::jsonb;
  st_antes text;
  st_depois text;
  mudou_status boolean;
  mudou_chefia boolean;
  mudou_rh boolean;
  pela_chefia boolean;
  dispensa_rh boolean;
  dados text[];
  col text;
  -- pares de autoria: coluna _por, coluna _em, forçar agora (a etapa acontece neste comando), etapa ativa
  -- (enquanto vale, o par não é apagado)
  p_por text[] := '{}';
  p_em text[] := '{}';
  p_forca boolean[] := '{}';
  p_ativo boolean[] := '{}';
  -- fora da etapa ativa: true = o par fica como estava (a etapa aconteceu e o pedido terminou depois, ex.: a chefia
  -- aprovou e o RH rejeitou), false = o par vai a NULL (não sugere uma aprovação que não houve)
  p_hist boolean[] := '{}';
  i int;
BEGIN
  IF coalesce(current_setting('role', true), 'none') NOT IN ('anon', 'authenticated') THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;
  v_admin := public.is_admin_user(v_uid);
  v_chefia := public.has_permission_code(v_uid, 'rh.aprovar');
  v_rh := public.has_permission_code(v_uid, 'rh.frequencia.lancar');

  IF TG_OP = 'DELETE' THEN
    IF NOT v_rh THEN
      RAISE EXCEPTION 'Etapa do RH: excluir % exige a permissão rh.frequencia.lancar',
        CASE TG_TABLE_NAME
          WHEN 'solicitacoes_abono' THEN 'a solicitação de abono'
          WHEN 'frequencia_fechamento' THEN 'o fechamento da frequência'
          WHEN 'justificativas_ponto' THEN 'a justificativa de ponto'
          ELSE 'a solicitação de ajuste de ponto' END
        USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
  END IF;

  -- comparações sempre por ->> (texto): no INSERT `o` é vazio e coluna nula em `n` também vira NULL
  n := to_jsonb(NEW);
  o := CASE WHEN TG_OP = 'INSERT' THEN '{}'::jsonb ELSE to_jsonb(OLD) END;

  IF TG_TABLE_NAME = 'solicitacoes_abono' THEN
    IF n ->> 'status' IS NULL AND NOT v_admin THEN
      RAISE EXCEPTION 'Abono: o status não pode ser nulo' USING ERRCODE = '42501';
    END IF;
    st_antes := coalesce(o ->> 'status', 'pendente');
    st_depois := n ->> 'status';
    mudou_status := st_depois IS DISTINCT FROM st_antes;
    -- status legado (CHECK do banco): nenhuma tela grava; fica fora da autoria, então ninguém transiciona para ele
    IF mudou_status AND st_depois = 'aprovado_rh' AND NOT v_admin THEN
      RAISE EXCEPTION 'Abono: o status legado aprovado_rh não é mais usado (o RH aprova com aprovado)' USING ERRCODE = '42501';
    END IF;
    -- sem RH, o pedido nasce na etapa inicial: status pendente (decidido é recusado) e campos de decisão nulos
    IF TG_OP = 'INSERT' AND NOT v_rh THEN
      IF st_depois <> 'pendente' THEN
        RAISE EXCEPTION 'Etapa do RH: só quem tem rh.frequencia.lancar registra o abono já decidido (status %); a chefia decide depois, sobre o pendente', st_depois
          USING ERRCODE = '42501';
      END IF;
      ov := ov || jsonb_build_object('motivo_rejeicao', NULL);
    END IF;
    mudou_chefia := (n ->> 'aprovado_chefia_por') IS DISTINCT FROM (o ->> 'aprovado_chefia_por')
                 OR (n ->> 'aprovado_chefia_em') IS DISTINCT FROM (o ->> 'aprovado_chefia_em');
    mudou_rh := (n ->> 'aprovado_rh_por') IS DISTINCT FROM (o ->> 'aprovado_rh_por')
             OR (n ->> 'aprovado_rh_em') IS DISTINCT FROM (o ->> 'aprovado_rh_em');

    -- autor do pedido: quem insere (mesmo isento em forcar_campos_iniciais); não muda depois
    IF TG_OP = 'INSERT' THEN
      ov := ov || jsonb_build_object('created_by', v_uid);
    ELSIF (n ->> 'created_by') IS DISTINCT FROM (o ->> 'created_by') THEN
      RAISE EXCEPTION 'Abono: o autor do pedido (created_by) não muda' USING ERRCODE = '42501';
    END IF;

    -- dados do pedido: sem RH, nada muda (a chefia decide, não edita); o motivo da rejeição só entra junto com a
    -- rejeição de um pendente; a aprovação da chefia só junto com a decisão sobre um pendente
    IF TG_OP = 'UPDATE' AND NOT v_rh THEN
      FOREACH col IN ARRAY ARRAY['servidor_id', 'tipo_abono_id', 'data_inicio', 'data_fim', 'hora_inicio', 'hora_fim',
                                 'justificativa', 'documento_url'] LOOP
        IF (n ->> col) IS DISTINCT FROM (o ->> col) THEN
          RAISE EXCEPTION 'Etapa do RH: alterar os dados do abono (%) exige a permissão rh.frequencia.lancar (a chefia decide, não edita)', col
            USING ERRCODE = '42501';
        END IF;
      END LOOP;
      IF (n ->> 'motivo_rejeicao') IS DISTINCT FROM (o ->> 'motivo_rejeicao')
         AND NOT (st_antes = 'pendente' AND st_depois = 'rejeitado') THEN
        RAISE EXCEPTION 'Etapa do RH: o motivo da rejeição só é registrado ao rejeitar um abono pendente (status %); fora disso exige a permissão rh.frequencia.lancar', st_antes
          USING ERRCODE = '42501';
      END IF;
      IF mudou_chefia AND (st_antes <> 'pendente' OR NOT mudou_status) THEN
        RAISE EXCEPTION 'Etapa do RH: a aprovação da chefia só é registrada junto com a decisão sobre um abono pendente (status %); fora disso exige a permissão rh.frequencia.lancar', st_antes
          USING ERRCODE = '42501';
      END IF;
    END IF;

    IF mudou_chefia AND NOT v_chefia THEN
      RAISE EXCEPTION 'Etapa da chefia: registrar a aprovação da chefia exige a permissão rh.aprovar' USING ERRCODE = '42501';
    END IF;
    IF mudou_rh AND NOT v_rh THEN
      RAISE EXCEPTION 'Etapa do RH: registrar a aprovação do RH exige a permissão rh.frequencia.lancar' USING ERRCODE = '42501';
    END IF;

    IF mudou_status THEN
      IF st_depois = 'aprovado_chefia' AND NOT v_chefia THEN
        RAISE EXCEPTION 'Etapa da chefia: aprovar o abono pela chefia exige a permissão rh.aprovar' USING ERRCODE = '42501';
      END IF;
      IF NOT v_rh THEN
        -- a chefia só tira o pedido de pendente
        IF st_antes <> 'pendente' THEN
          RAISE EXCEPTION 'Etapa do RH: mudar o status do abono de % para % exige a permissão rh.frequencia.lancar', st_antes, st_depois
            USING ERRCODE = '42501';
        ELSIF st_depois = 'aprovado' THEN
          -- o tipo que vale é o da linha antes do comando (no UPDATE), não o que vem nele
          SELECT ta.exige_aprovacao_rh IS FALSE INTO dispensa_rh
            FROM public.tipos_abono ta
           WHERE ta.id = (CASE WHEN TG_OP = 'UPDATE' THEN o ELSE n END ->> 'tipo_abono_id')::uuid;
          IF NOT (v_chefia AND mudou_chefia AND coalesce(dispensa_rh, false)) THEN
            RAISE EXCEPTION 'Etapa do RH: aprovar o abono exige a permissão rh.frequencia.lancar (a chefia só encerra o fluxo quando o tipo de abono dispensa o RH)'
              USING ERRCODE = '42501';
          END IF;
        ELSIF st_depois = 'rejeitado' THEN
          IF NOT v_chefia THEN
            RAISE EXCEPTION 'Etapa da chefia: rejeitar o abono exige a permissão rh.aprovar ou rh.frequencia.lancar' USING ERRCODE = '42501';
          END IF;
        ELSIF st_depois <> 'aprovado_chefia' THEN
          RAISE EXCEPTION 'Etapa do RH: mudar o status do abono de % para % exige a permissão rh.frequencia.lancar', st_antes, st_depois
            USING ERRCODE = '42501';
        END IF;
      END IF;
    END IF;
    -- ir para `aprovado` pela chefia (encerra o fluxo; quem tem as duas permissões e só registra a chefia) grava o par
    -- da chefia; pelo RH, o par do RH. A rejeição não tem coluna de autoria no abono.
    pela_chefia := NOT v_rh OR (mudou_chefia AND NOT mudou_rh);
    p_por := ARRAY['aprovado_chefia_por', 'aprovado_rh_por'];
    p_em := ARRAY['aprovado_chefia_em', 'aprovado_rh_em'];
    p_forca := ARRAY[mudou_status AND (st_depois = 'aprovado_chefia' OR (st_depois = 'aprovado' AND pela_chefia)),
                     mudou_status AND st_depois = 'aprovado' AND NOT pela_chefia];
    p_ativo := ARRAY[st_depois IN ('aprovado_chefia', 'aprovado'), st_depois = 'aprovado'];
    -- (aprovado_rh: linhas legadas mantêm o que tinham)
    p_hist := ARRAY[st_depois IN ('rejeitado', 'cancelado', 'aprovado_rh'), st_depois IN ('rejeitado', 'cancelado', 'aprovado_rh')];

  ELSIF TG_TABLE_NAME = 'frequencia_fechamento' THEN
    IF TG_OP = 'UPDATE' AND NOT v_admin
       AND ((n ->> 'servidor_id') IS DISTINCT FROM (o ->> 'servidor_id')
            OR (n ->> 'ano') IS DISTINCT FROM (o ->> 'ano')
            OR (n ->> 'mes') IS DISTINCT FROM (o ->> 'mes')) THEN
      RAISE EXCEPTION 'Fechamento da frequência: servidor, ano e mês não mudam depois de criados (só o papel admin corrige)'
        USING ERRCODE = '42501';
    END IF;
    IF TG_OP = 'UPDATE' AND NOT v_rh AND coalesce((o ->> 'consolidado_rh')::boolean, false)
       AND (n - 'updated_at') IS DISTINCT FROM (o - 'updated_at') THEN
      RAISE EXCEPTION 'Etapa do RH: alterar uma frequência já consolidada exige a permissão rh.frequencia.lancar' USING ERRCODE = '42501';
    END IF;
    IF (coalesce((n ->> 'assinado_servidor')::boolean, false) IS DISTINCT FROM coalesce((o ->> 'assinado_servidor')::boolean, false)
        OR (n ->> 'assinado_servidor_em') IS DISTINCT FROM (o ->> 'assinado_servidor_em'))
       AND (n ->> 'servidor_id')::uuid IS DISTINCT FROM public.meu_servidor_id() AND NOT v_admin THEN
      RAISE EXCEPTION 'Assinatura do servidor: só o próprio servidor assina (ou desfaz a assinatura de) a sua frequência'
        USING ERRCODE = '42501';
    END IF;
    IF coalesce((n ->> 'validado_chefia')::boolean, false) IS DISTINCT FROM coalesce((o ->> 'validado_chefia')::boolean, false)
       OR (n ->> 'validado_chefia_por') IS DISTINCT FROM (o ->> 'validado_chefia_por')
       OR (n ->> 'validado_chefia_em') IS DISTINCT FROM (o ->> 'validado_chefia_em') THEN
      IF coalesce((n ->> 'validado_chefia')::boolean, false) THEN
        IF NOT v_chefia THEN
          RAISE EXCEPTION 'Etapa da chefia: validar a frequência exige a permissão rh.aprovar' USING ERRCODE = '42501';
        END IF;
      ELSIF NOT v_rh THEN
        RAISE EXCEPTION 'Etapa do RH: desfazer a validação da chefia (reabertura) exige a permissão rh.frequencia.lancar' USING ERRCODE = '42501';
      END IF;
    END IF;
    IF (coalesce((n ->> 'consolidado_rh')::boolean, false) IS DISTINCT FROM coalesce((o ->> 'consolidado_rh')::boolean, false)
        OR (n ->> 'consolidado_rh_por') IS DISTINCT FROM (o ->> 'consolidado_rh_por')
        OR (n ->> 'consolidado_rh_em') IS DISTINCT FROM (o ->> 'consolidado_rh_em')
        OR coalesce((n ->> 'reaberto')::boolean, false) IS DISTINCT FROM coalesce((o ->> 'reaberto')::boolean, false)
        OR (n ->> 'reaberto_por') IS DISTINCT FROM (o ->> 'reaberto_por')
        OR (n ->> 'reaberto_em') IS DISTINCT FROM (o ->> 'reaberto_em')
        OR (n ->> 'justificativa_reabertura') IS DISTINCT FROM (o ->> 'justificativa_reabertura'))
       AND NOT v_rh THEN
      RAISE EXCEPTION 'Etapa do RH: consolidar ou reabrir a frequência exige a permissão rh.frequencia.lancar' USING ERRCODE = '42501';
    END IF;
    -- a flag que vira true grava o seu par; enquanto ela vale, o par não é apagado
    FOREACH col IN ARRAY ARRAY['validado_chefia', 'consolidado_rh', 'reaberto'] LOOP
      p_por := p_por || (col || '_por');
      p_em := p_em || (col || '_em');
      p_forca := p_forca || (coalesce((n ->> col)::boolean, false) AND NOT coalesce((o ->> col)::boolean, false));
      p_ativo := p_ativo || coalesce((n ->> col)::boolean, false);
      -- a reabertura que já aconteceu continua registrada depois da reconsolidação (reaberto volta a false)
      p_hist := p_hist || (col = 'reaberto');
    END LOOP;

  ELSE
    -- justificativas_ponto e solicitacoes_ajuste_ponto: uma etapa só (chefia ou RH decidem; status_solicitacao)
    IF n ->> 'status' IS NULL AND NOT v_admin THEN
      RAISE EXCEPTION 'Pedido de ponto: o status não pode ser nulo' USING ERRCODE = '42501';
    END IF;
    st_antes := coalesce(o ->> 'status', 'pendente');
    st_depois := n ->> 'status';
    mudou_status := st_depois IS DISTINCT FROM st_antes;
    -- sem RH, o pedido nasce na etapa inicial: status pendente (decidido é recusado) e campos de decisão nulos
    IF TG_OP = 'INSERT' AND NOT v_rh THEN
      IF st_depois <> 'pendente' THEN
        RAISE EXCEPTION 'Etapa do RH: só quem tem rh.frequencia.lancar registra o pedido já decidido (status %); a chefia decide depois, sobre o pendente', st_depois
          USING ERRCODE = '42501';
      END IF;
      ov := ov || jsonb_build_object('observacao_aprovador', NULL);
    END IF;
    dados := CASE TG_TABLE_NAME
      WHEN 'justificativas_ponto' THEN ARRAY['registro_ponto_id', 'tipo', 'descricao', 'arquivo_url']
      ELSE ARRAY['servidor_id', 'registro_ponto_id', 'data_ocorrido', 'tipo_ajuste', 'campo_ajuste', 'horario_atual',
                 'horario_correto', 'motivo', 'comprovante_url'] END;
    IF TG_OP = 'UPDATE' AND NOT v_rh THEN
      FOREACH col IN ARRAY dados LOOP
        IF (n ->> col) IS DISTINCT FROM (o ->> col) THEN
          RAISE EXCEPTION 'Etapa do RH: alterar o texto do pedido (%) exige a permissão rh.frequencia.lancar (a chefia decide, não edita)', col
            USING ERRCODE = '42501';
        END IF;
      END LOOP;
      IF ((n ->> 'observacao_aprovador') IS DISTINCT FROM (o ->> 'observacao_aprovador')
          OR (n ->> 'aprovador_id') IS DISTINCT FROM (o ->> 'aprovador_id')
          OR (n ->> 'data_aprovacao') IS DISTINCT FROM (o ->> 'data_aprovacao'))
         AND NOT (st_antes = 'pendente' AND mudou_status) THEN
        RAISE EXCEPTION 'Etapa do RH: a decisão só é registrada junto com a mudança de status de um pedido pendente (status %); fora disso exige a permissão rh.frequencia.lancar', st_antes
          USING ERRCODE = '42501';
      END IF;
    END IF;
    IF mudou_status AND NOT v_rh THEN
      IF NOT v_chefia OR st_antes <> 'pendente' OR st_depois NOT IN ('aprovada', 'rejeitada') THEN
        RAISE EXCEPTION 'Etapa do RH: mudar o status do pedido de % para % exige a permissão rh.frequencia.lancar (a chefia só aprova ou rejeita o pendente)', st_antes, st_depois
          USING ERRCODE = '42501';
      END IF;
    END IF;
    p_por := ARRAY['aprovador_id'];
    p_em := ARRAY['data_aprovacao'];
    p_forca := ARRAY[mudou_status AND st_depois IN ('aprovada', 'rejeitada')];
    p_ativo := ARRAY[st_depois IN ('aprovada', 'rejeitada')];
    p_hist := ARRAY[st_depois = 'cancelada'];
  END IF;

  -- autoria: o par da etapa que acontece neste comando é de quem age, agora. Enquanto a etapa vale, o par não é
  -- apagado (nem em parte) e, se mudar para um valor não nulo, também é de quem age, agora. Fora da etapa ativa, o
  -- par fica como estava (p_hist: a etapa aconteceu e o pedido terminou depois) ou vai a NULL.
  FOR i IN 1 .. coalesce(array_length(p_por, 1), 0) LOOP
    IF p_forca[i] THEN
      ov := ov || jsonb_build_object(p_por[i], v_uid, p_em[i], now());
    ELSIF p_ativo[i] THEN
      IF ((o ->> p_por[i]) IS NOT NULL AND (n ->> p_por[i]) IS NULL)
         OR ((o ->> p_em[i]) IS NOT NULL AND (n ->> p_em[i]) IS NULL) THEN
        RAISE EXCEPTION 'Autoria: o registro da etapa (%, %) não é apagado enquanto ela vale', p_por[i], p_em[i]
          USING ERRCODE = '42501';
      ELSIF ((n ->> p_por[i]) IS DISTINCT FROM (o ->> p_por[i]) OR (n ->> p_em[i]) IS DISTINCT FROM (o ->> p_em[i]))
            AND ((n ->> p_por[i]) IS NOT NULL OR (n ->> p_em[i]) IS NOT NULL) THEN
        ov := ov || jsonb_build_object(p_por[i], v_uid, p_em[i], now());
      END IF;
    ELSIF p_hist[i] THEN
      ov := ov || jsonb_build_object(p_por[i], o -> p_por[i], p_em[i], o -> p_em[i]);
    ELSE
      ov := ov || jsonb_build_object(p_por[i], NULL, p_em[i], NULL);
    END IF;
  END LOOP;
  IF ov <> '{}'::jsonb THEN
    NEW := jsonb_populate_record(NEW, n || ov);
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.validar_etapa_frequencia() FROM PUBLIC, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 12. registrar_evento(): ações sem gravação (ver, exportar, baixar/imprimir)
-- ----------------------------------------------------------------------------
-- Listas fechadas de ação e de entidade; usuário, servidor, origem, IP, user agent e transação são do banco (o
-- cliente só diz o que foi visto/exportado). Módulo 'rh'. Perfil inativo não grava. A E2 liga o front a ela.
CREATE OR REPLACE FUNCTION public.registrar_evento(
  p_acao text,
  p_entidade text,
  p_entidade_id uuid DEFAULT NULL,
  p_descricao text DEFAULT NULL,
  p_metadados jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_id uuid;
BEGIN
  IF v_uid IS NULL OR NOT public.is_active_user() THEN
    RAISE EXCEPTION 'registrar_evento: usuário não autenticado ou inativo' USING ERRCODE = '42501';
  END IF;
  IF p_acao IS NULL OR p_acao NOT IN ('view', 'export', 'download') THEN
    RAISE EXCEPTION 'registrar_evento: ação fora da lista (view, export, download; imprimir = download): %',
      left(coalesce(p_acao, '(nula)'), 40) USING ERRCODE = '22023';
  END IF;
  IF p_entidade IS NULL OR p_entidade <> ALL (ARRAY[
      -- tabelas do RH (as mesmas do bloco 8 e as duas de trilha)
      'adicionais_tempo_servico', 'agrupamento_unidade_vinculo', 'banco_horas', 'bancos_cnab',
      'cargo_unidade_compatibilidade', 'cargos', 'cessoes', 'composicao_cargos', 'config_agrupamento_unidades',
      'config_assinatura_frequencia', 'config_autarquia', 'config_compensacao', 'config_fechamento_folha',
      'config_fechamento_frequencia', 'config_incidencias', 'config_institucional', 'config_jornada_padrao',
      'config_motivos_desligamento', 'config_regras_calculo', 'config_rubricas', 'config_situacoes_funcionais',
      'config_tipos_ato', 'config_tipos_onus', 'config_tipos_rubrica', 'config_tipos_servidor', 'configuracao_jornada',
      'consignacoes', 'contas_autarquia', 'dependentes_irrf', 'designacoes', 'dias_nao_uteis', 'documentos',
      'documentos_requerimento_servidor', 'eventos_esocial', 'exportacoes_folha', 'feriados', 'ferias_servidor',
      'fichas_financeiras', 'folha_historico_status', 'folhas_pagamento', 'frequencia_arquivos',
      'frequencia_fechamento', 'frequencia_mensal', 'frequencia_pacotes', 'historico_funcional', 'horarios_jornada',
      'itens_ficha_financeira', 'itens_retorno_bancario', 'justificativas_ponto', 'lancamentos_banco_horas',
      'lancamentos_folha', 'licencas_afastamentos', 'lotacoes', 'memorandos_lotacao', 'nomeacoes_chefe_unidade',
      'ocorrencias_servidor', 'parametros_folha', 'pensoes_alimenticias', 'portarias_servidor', 'pre_cadastros',
      'provimentos', 'regimes_trabalho', 'registros_ponto', 'remessas_bancarias', 'retornos_bancarios', 'rubricas',
      'rubricas_historico', 'servidor_regime', 'servidor_tag_vinculos', 'servidor_tags', 'servidores',
      'solicitacoes_abono', 'solicitacoes_ajuste_ponto', 'tabela_inss', 'tabela_irrf', 'tipos_abono',
      'viagens_diarias', 'vinculos_funcionais', 'vinculos_servidor',
      -- documentos e consultas que não são uma tabela
      'contracheque', 'relatorio_rh', 'exportacao_rh', 'arquivo_esocial', 'arquivo_cnab', 'trilha_auditoria'
    ]) THEN
    RAISE EXCEPTION 'registrar_evento: entidade fora da lista: %', left(coalesce(p_entidade, '(nula)'), 60)
      USING ERRCODE = '22023';
  END IF;
  IF p_metadados IS NOT NULL AND (jsonb_typeof(p_metadados) <> 'object' OR length(p_metadados::text) > 4000) THEN
    RAISE EXCEPTION 'registrar_evento: metadados devem ser um objeto JSON de até 4000 caracteres' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.audit_logs (action, entity_type, entity_id, module_name, user_id, description, metadata)
  VALUES (p_acao::public.audit_action, p_entidade, p_entidade_id, 'rh', v_uid, left(p_descricao, 500),
          coalesce(p_metadados, '{}'::jsonb) || jsonb_build_object('registrar_evento', true))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
COMMENT ON FUNCTION public.registrar_evento(text, text, uuid, text, jsonb) IS
  'Registra na trilha do RH uma ação sem gravação (view, export, download; imprimir = download) sobre entidade de lista fechada';

-- ----------------------------------------------------------------------------
-- 13. Leitura da trilha do RH
-- ----------------------------------------------------------------------------
INSERT INTO public.module_permissions_catalog
  (module_code, permission_code, label, description, category, action_type, sort_order)
VALUES
  ('rh', 'rh.auditoria.visualizar', 'Visualizar Trilha de Auditoria do RH',
   'Lê a trilha (audit_logs) do módulo RH: quem lançou, alterou ou excluiu, e o antes/depois mascarado',
   'Auditoria', 'visualizar', 510)
ON CONFLICT (permission_code) DO NOTHING;

-- Além do papel admin (policy rls_select, gerada da classe admin_leitura), quem tem o módulo rh E a permissão lê as
-- linhas do módulo 'rh' (as do módulo 'admin', 'folha' e demais continuam só do admin). Policy fora do gerador, mantida
-- por esta migração (a classe admin_leitura do mapa não a remove).
DROP POLICY IF EXISTS "audit_logs_rh_auditoria_select" ON public.audit_logs;
CREATE POLICY "audit_logs_rh_auditoria_select" ON public.audit_logs FOR SELECT TO authenticated
  USING (module_name = 'rh'
         AND public.can_access_module(auth.uid(), 'rh')
         AND public.has_permission_code(auth.uid(), 'rh.auditoria.visualizar'));

-- ----------------------------------------------------------------------------
-- Privilégios das funções novas (o dump do baseline não leva GRANT/REVOKE: o overlay/40 repete estas linhas)
-- ----------------------------------------------------------------------------
-- Funções de apoio e de trigger: nenhuma é chamada pela API (os triggers e RPCs SECURITY DEFINER as chamam como dono).
REVOKE EXECUTE ON FUNCTION public.responsavel_atual() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rh_exige_servidor_vinculado() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mascarar_parcial(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trilha_mascarar(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trilha_contexto_requisicao() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trilha_completar_contexto() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trilha_imutavel() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fixar_autoria() FROM PUBLIC, anon, authenticated;
-- registrar_evento: só authenticated (a guarda no corpo exige usuário ativo)
REVOKE EXECUTE ON FUNCTION public.registrar_evento(text, text, uuid, text, jsonb) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.registrar_evento(text, text, uuid, text, jsonb) TO authenticated;
