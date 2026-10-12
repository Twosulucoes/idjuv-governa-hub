-- ============================================================================
-- Parâmetros da folha — um só jeito de escrever o nome (minúsculas)
-- ============================================================================
-- Defeito achado em 12/10/2026: a tela de Parâmetros gravava o nome em MAIÚSCULAS (TETO_INSS, DEDUCAO_DEPENDENTE_IRRF) e
-- tudo que lê (calcular_inss_servidor, processar_folha_pagamento, fn_validar_*, afastamento_remunerado) procura em
-- minúsculas: o valor digitado na tela era ignorado, e a ficha saía marcada "dedução de dependente não configurada".
--   1. normaliza os nomes já gravados;
--   2. trigger: todo INSERT/UPDATE grava o nome em minúsculas, sem acento, sem espaço (vale para tela, API e carga);
--   3. get_parametro_vigente (as duas versões) compara sem diferença de caixa.
-- Idempotente.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.parametros_folha_normalizar_nome()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.tipo_parametro := regexp_replace(lower(btrim(translate(NEW.tipo_parametro,
      'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'))),
      '[\s-]+', '_', 'g');
  RETURN NEW;
END;
$function$;

-- 1) o que já está gravado (com a auditoria ligada: a trilha registra a mudança de nome)
UPDATE public.parametros_folha
   SET tipo_parametro = regexp_replace(lower(btrim(translate(tipo_parametro,
      'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'))), '[\s-]+', '_', 'g')
 WHERE tipo_parametro IS DISTINCT FROM regexp_replace(lower(btrim(translate(tipo_parametro,
      'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ', 'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'))), '[\s-]+', '_', 'g');

-- 2) daqui para frente
DROP TRIGGER IF EXISTS trg_parametros_folha_normalizar_nome ON public.parametros_folha;
CREATE TRIGGER trg_parametros_folha_normalizar_nome
  BEFORE INSERT OR UPDATE OF tipo_parametro ON public.parametros_folha
  FOR EACH ROW EXECUTE FUNCTION public.parametros_folha_normalizar_nome();

-- 3) leitura sem diferença de caixa (mesma lógica e mesmo retorno de antes)
CREATE OR REPLACE FUNCTION public.get_parametro_vigente(p_tipo text, p_data date DEFAULT CURRENT_DATE)
 RETURNS numeric
 LANGUAGE plpgsql
 STABLE
AS $function$
BEGIN
  RETURN COALESCE((
    SELECT valor
    FROM parametros_folha
    WHERE tipo_parametro = lower(btrim(p_tipo))
      AND ativo = true
      AND vigencia_inicio <= p_data
      AND (vigencia_fim IS NULL OR vigencia_fim >= p_data)
    ORDER BY vigencia_inicio DESC
    LIMIT 1
  ), 0);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_parametro_vigente(p_tipo character varying, p_vigencia date DEFAULT CURRENT_DATE)
 RETURNS numeric
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_valor DECIMAL;
BEGIN
  SELECT valor INTO v_valor
  FROM parametros_folha
  WHERE tipo_parametro = lower(btrim(p_tipo))
    AND vigencia_inicio <= p_vigencia
    AND (vigencia_fim IS NULL OR vigencia_fim >= p_vigencia)
    AND ativo = TRUE
  ORDER BY vigencia_inicio DESC LIMIT 1;

  RETURN v_valor;
END;
$function$;

NOTIFY pgrst, 'reload schema';
