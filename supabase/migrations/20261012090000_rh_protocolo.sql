-- ============================================================================
-- RH — protocolo: todo ato do RH tem um número e um registro completo de quem fez
-- ============================================================================
-- Decisão do dono (12/10/2026): tudo que for feito no RH passa por um protocolo, com registro das alterações e de
-- quem as fez. A trilha (audit_logs, imutável desde a E1) já guarda quem, quando, antes/depois (mascarado), IP,
-- agente, papel, unidade, servidor responsável e transação. Faltava o NÚMERO que agrupa as gravações de um mesmo ato
-- e a descrição do ato. Sem tabela nova (tabela do RH exige regenerar o baseline inteiro): o protocolo vive na trilha.
--
--   audit_logs.protocolo        número RH-AAAA-NNNNNN de todas as linhas do módulo rh
--   linha de ABERTURA           action 'create', entity_type 'protocolo', metadata {abertura:true, tipo, servidor_id,
--                               ...}: quem abriu, quando, de onde e o que é o ato (descrição). Imutável como o resto.
--   rh_protocolo_atual()        abre o protocolo da transação (ou devolve o já aberto): uma transação = um protocolo
--   trigger trilha_protocolo    toda linha de RH que entra na trilha sem protocolo recebe o da transação; se não há,
--                               abre um automático (tipo pela tabela). Assim NENHUMA gravação do RH fica sem protocolo,
--                               mesmo as feitas direto pela tela, sem mudar cada tela
--   RPCs de ato (admissão, desligamento, folha, avanço por data) abrem o protocolo com tipo e descrição próprios
--   rh_protocolo_consultar / rh_protocolos_listar   consulta (SECURITY INVOKER: a RLS da trilha vale)
--
-- Numeração: uma sequência por ano (rh_protocolo_seq_AAAA, criada sob demanda), sem trava de linha — não serializa as
-- gravações do RH. Transação desfeita deixa um número sem uso (e nenhum registro): lacuna = tentativa que não valeu.
-- Tentativa recusada/revertida não deixa rastro na trilha (a trilha é gravada na mesma transação do ato).
-- Idempotente (IF NOT EXISTS / CREATE OR REPLACE / DROP IF EXISTS).
-- ============================================================================

ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS protocolo text;
COMMENT ON COLUMN public.audit_logs.protocolo IS
  'Protocolo RH-AAAA-NNNNNN do ato (módulo rh): agrupa as gravações da mesma transação; a linha de abertura descreve o ato';
CREATE INDEX IF NOT EXISTS idx_audit_logs_protocolo ON public.audit_logs USING btree (protocolo) WHERE protocolo IS NOT NULL;

-- ---------------------------------------------------------------------------
-- tipo do protocolo automático, pela tabela gravada
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rh_tipo_protocolo(p_entidade text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN p_entidade IN ('servidores', 'pre_cadastros', 'servidor_tags', 'servidor_tag_vinculos', 'dependentes_irrf',
                        'documentos_requerimento_servidor', 'adicionais_tempo_servico') THEN 'cadastro'
    WHEN p_entidade IN ('lotacoes', 'provimentos', 'vinculos_servidor', 'vinculos_funcionais', 'designacoes', 'cessoes',
                        'nomeacoes_chefe_unidade', 'memorandos_lotacao', 'historico_funcional', 'comissoes',
                        'comissoes_membros') THEN 'movimentacao'
    WHEN p_entidade = 'ferias_servidor' THEN 'ferias'
    WHEN p_entidade = 'licencas_afastamentos' THEN 'licenca'
    WHEN p_entidade = 'viagens_diarias' THEN 'viagem'
    WHEN p_entidade IN ('registros_ponto', 'frequencia_mensal', 'frequencia_fechamento', 'frequencia_arquivos',
                        'frequencia_pacotes', 'solicitacoes_abono', 'solicitacoes_ajuste_ponto', 'justificativas_ponto',
                        'banco_horas', 'lancamentos_banco_horas', 'servidor_regime') THEN 'frequencia'
    WHEN p_entidade IN ('folhas_pagamento', 'fichas_financeiras', 'itens_ficha_financeira', 'lancamentos_folha',
                        'consignacoes', 'pensoes_alimenticias', 'exportacoes_folha', 'eventos_esocial',
                        'remessas_bancarias', 'retornos_bancarios', 'itens_retorno_bancario',
                        'folha_historico_status') THEN 'folha'
    WHEN p_entidade IN ('documentos', 'portarias_servidor') THEN 'portaria'
    WHEN p_entidade = 'ocorrencias_servidor' THEN 'ocorrencia'
    WHEN p_entidade IN ('contracheque', 'relatorio_rh', 'exportacao_rh', 'arquivo_esocial', 'arquivo_cnab',
                        'trilha_auditoria') THEN 'consulta'
    WHEN p_entidade LIKE 'config\_%' OR p_entidade IN ('cargos', 'composicao_cargos', 'cargo_unidade_compatibilidade',
                        'tipos_abono', 'rubricas', 'rubricas_historico', 'parametros_folha', 'tabela_inss', 'tabela_irrf',
                        'feriados', 'dias_nao_uteis', 'regimes_trabalho', 'horarios_jornada', 'configuracao_jornada',
                        'bancos_cnab', 'contas_autarquia') THEN 'configuracao'
    ELSE 'alteracao'
  END;
$function$;

-- ---------------------------------------------------------------------------
-- abre (ou devolve) o protocolo da transação
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rh_protocolo_atual(
  p_tipo text DEFAULT NULL,
  p_descricao text DEFAULT NULL,
  p_servidor_alvo uuid DEFAULT NULL,
  p_dados jsonb DEFAULT '{}'::jsonb
) RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_tx text := txid_current()::text;
  v_cache text := current_setting('trilha.protocolo', true);
  v_ano int := EXTRACT(YEAR FROM public.data_local())::int;
  v_seq_nome text;
  v_seq bigint;
  v_num text;
  v_tipo text := coalesce(p_tipo, 'alteracao');
BEGIN
  -- chamada direta pela API: só quem tem o módulo rh abre protocolo (dentro de trigger/RPC de ato a guarda não se aplica,
  -- o ato já passou pela permissão e pela RLS da própria operação)
  IF pg_trigger_depth() = 0 AND coalesce(current_setting('role', true), 'none') IN ('anon', 'authenticated')
     AND (auth.uid() IS NULL OR NOT public.can_access_module(auth.uid(), 'rh')) THEN
    RAISE EXCEPTION 'Sem permissão para abrir protocolo do RH' USING ERRCODE = '42501';
  END IF;
  IF p_dados IS NOT NULL AND (jsonb_typeof(p_dados) <> 'object' OR length(p_dados::text) > 4000) THEN
    RAISE EXCEPTION 'Dados do protocolo devem ser um objeto JSON de até 4000 caracteres' USING ERRCODE = '22023';
  END IF;

  -- uma transação, um protocolo (a chave inclui o txid: a variável de sessão não vaza para outra transação)
  IF v_cache IS NOT NULL AND v_cache <> '' AND split_part(v_cache, '|', 1) = v_tx THEN
    RETURN split_part(v_cache, '|', 2);
  END IF;

  IF v_tipo NOT IN ('admissao', 'desligamento', 'cadastro', 'movimentacao', 'ferias', 'licenca', 'viagem', 'frequencia',
                    'folha', 'portaria', 'ocorrencia', 'configuracao', 'consulta', 'sistema', 'alteracao') THEN
    RAISE EXCEPTION 'Tipo de protocolo inválido: %', v_tipo USING ERRCODE = '22023';
  END IF;

  v_seq_nome := 'rh_protocolo_seq_' || v_ano;
  IF to_regclass('public.' || v_seq_nome) IS NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('rh_protocolo_seq'));
    EXECUTE format('CREATE SEQUENCE IF NOT EXISTS public.%I', v_seq_nome);
  END IF;
  EXECUTE format('SELECT nextval(%L)', 'public.' || v_seq_nome) INTO v_seq;
  v_num := 'RH-' || v_ano || '-' || CASE WHEN v_seq >= 1000000 THEN v_seq::text ELSE lpad(v_seq::text, 6, '0') END;

  -- linha de abertura: o contexto (servidor responsável, papel, unidade, IP, agente, transação) é completado pelo
  -- trigger trilha_completar_contexto, como em qualquer linha da trilha
  INSERT INTO public.audit_logs (action, entity_type, module_name, user_id, description, metadata, protocolo)
  VALUES ('create', 'protocolo', 'rh', auth.uid(),
          left(coalesce(p_descricao, 'Ato do RH (' || v_tipo || ')'), 500),
          coalesce(p_dados, '{}'::jsonb)
            || jsonb_build_object('abertura', true, 'tipo', v_tipo, 'numero', v_num,
                                  'servidor_id', p_servidor_alvo, 'fonte', 'protocolo'),
          v_num);

  PERFORM set_config('trilha.protocolo', v_tx || '|' || v_num, true);
  RETURN v_num;
END;
$function$;

-- ---------------------------------------------------------------------------
-- toda linha de RH na trilha recebe o protocolo da transação (abre um automático se preciso)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trilha_atribuir_protocolo()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.protocolo := public.rh_protocolo_atual(
    public.rh_tipo_protocolo(NEW.entity_type),
    CASE NEW.action::text
      WHEN 'create' THEN 'Inclusão'
      WHEN 'update' THEN 'Alteração'
      WHEN 'delete' THEN 'Exclusão'
      WHEN 'view' THEN 'Consulta'
      WHEN 'export' THEN 'Exportação'
      WHEN 'download' THEN 'Download/impressão'
      ELSE initcap(NEW.action::text)
    END || ' em ' || coalesce(NEW.entity_type, '(sem entidade)'),
    NULL, jsonb_build_object('automatico', true));
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trilha_protocolo ON public.audit_logs;
CREATE TRIGGER trilha_protocolo
  BEFORE INSERT ON public.audit_logs
  FOR EACH ROW WHEN (NEW.module_name = 'rh' AND NEW.protocolo IS NULL)
  EXECUTE FUNCTION public.trilha_atribuir_protocolo();

-- ---------------------------------------------------------------------------
-- consulta (SECURITY INVOKER: valem a policy de leitura da trilha — módulo rh + rh.auditoria.visualizar — e a máscara)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rh_protocolo_consultar(p_numero text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
  SELECT jsonb_build_object(
    'numero', p_numero,
    'abertura', (SELECT jsonb_build_object(
                          'em', a."timestamp", 'descricao', a.description, 'tipo', a.metadata ->> 'tipo',
                          'servidor_alvo_id', a.metadata ->> 'servidor_id',
                          'aberto_por_usuario', a.user_id, 'aberto_por_servidor', a.servidor_nome,
                          'matricula', a.servidor_matricula, 'papel', a.role_at_time, 'origem', a.origem,
                          'unidade_id', a.org_unit_id, 'ip', host(a.ip_address), 'transacao', a.transacao)
                   FROM public.audit_logs a
                  WHERE a.protocolo = p_numero AND a.entity_type = 'protocolo' LIMIT 1),
    'registros', coalesce((SELECT jsonb_agg(jsonb_build_object(
                          'sequencia', l.sequencia, 'em', l."timestamp", 'acao', l.action, 'entidade', l.entity_type,
                          'registro_id', l.entity_id, 'campos_alterados', l.campos_alterados, 'descricao', l.description,
                          'responsavel', l.servidor_nome, 'matricula', l.servidor_matricula, 'usuario', l.user_id)
                          ORDER BY l.sequencia)
                   FROM public.audit_logs l
                  WHERE l.protocolo = p_numero AND l.entity_type IS DISTINCT FROM 'protocolo'), '[]'::jsonb));
$function$;

CREATE OR REPLACE FUNCTION public.rh_protocolos_listar(
  p_servidor uuid DEFAULT NULL,
  p_tipo text DEFAULT NULL,
  p_desde date DEFAULT NULL,
  p_ate date DEFAULT NULL,
  p_limite int DEFAULT 100
) RETURNS TABLE (numero text, em timestamptz, tipo text, descricao text, servidor_alvo_id uuid, responsavel text,
                 matricula text, origem text)
 LANGUAGE sql
 STABLE SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
  SELECT a.protocolo, a."timestamp", a.metadata ->> 'tipo', a.description,
         nullif(a.metadata ->> 'servidor_id', '')::uuid, a.servidor_nome, a.servidor_matricula, a.origem
    FROM public.audit_logs a
   WHERE a.entity_type = 'protocolo' AND a.module_name = 'rh'
     AND (p_servidor IS NULL OR a.metadata ->> 'servidor_id' = p_servidor::text)
     AND (p_tipo IS NULL OR a.metadata ->> 'tipo' = p_tipo)
     AND (p_desde IS NULL OR a."timestamp" >= p_desde::timestamptz)
     AND (p_ate IS NULL OR a."timestamp" < (p_ate + 1)::timestamptz)
   ORDER BY a.sequencia DESC
   LIMIT least(greatest(coalesce(p_limite, 100), 1), 500);
$function$;

-- ---------------------------------------------------------------------------
-- privilégios: abrir protocolo é função de sistema (as RPCs de ato e o trigger chamam); consulta para quem lê a trilha
-- ---------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.rh_protocolo_atual(text, text, uuid, jsonb) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.rh_protocolo_atual(text, text, uuid, jsonb) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.trilha_atribuir_protocolo() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rh_tipo_protocolo(text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.rh_tipo_protocolo(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.rh_protocolo_consultar(text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.rh_protocolo_consultar(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.rh_protocolos_listar(uuid, text, date, date, int) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.rh_protocolos_listar(uuid, text, date, date, int) TO authenticated;

NOTIFY pgrst, 'reload schema';
