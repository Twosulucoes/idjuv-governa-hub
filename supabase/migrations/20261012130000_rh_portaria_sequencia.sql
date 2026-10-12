-- ============================================================================
-- Portaria — sequência obrigatória do ciclo e nomeação amparada por ato publicado (item 3 da auditoria)
-- ============================================================================
-- Decisão do dono (12/10/2026): a portaria condiciona a posse e o exercício.
--   1. Trigger em documentos (tipo = 'portaria'): o status só anda na ordem
--        minuta → aguardando_assinatura → assinado → aguardando_publicacao → publicado → vigente → revogado
--      com os retornos permitidos (devolver para ajuste) e revogação a partir de qualquer etapa, exceto já revogada.
--      Cada etapa exige o que a define: assinado = quem assinou e a data; publicado = nº e data do DOE; vigente = data
--      de início da vigência. Portaria assinada, publicada, vigente ou revogada não se apaga (revoga-se).
--      Valem para qualquer tela e para a API. A criação (INSERT) segue livre para registrar ato que já nasce publicado.
--   2. rh_pendencias_nomeacao(): servidores com provimento ativo sem portaria de nomeação publicada (SECURITY INVOKER).
--      A folha marca a ficha (portaria_de_nomeacao_nao_publicada) em vez de bloquear: o ato pode ser publicado depois,
--      com efeito retroativo; o que a regra impede é esquecer a pendência.
-- Idempotente.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.documentos_portaria_validar()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_de text;
  v_para text;
  v_ok boolean;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.tipo = 'portaria' AND OLD.status::text IN ('assinado', 'aguardando_publicacao', 'publicado', 'vigente', 'revogado') THEN
      RAISE EXCEPTION 'Portaria % (%) não pode ser excluída: ato assinado ou publicado se revoga, não se apaga',
        OLD.numero, OLD.status USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
  END IF;

  IF NEW.tipo IS DISTINCT FROM 'portaria' OR NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  v_de := OLD.status::text;
  v_para := NEW.status::text;
  v_ok := CASE v_de
    WHEN 'rascunho' THEN v_para IN ('minuta', 'aguardando_assinatura', 'revogado')
    WHEN 'minuta' THEN v_para IN ('aguardando_assinatura', 'revogado')
    WHEN 'aguardando_assinatura' THEN v_para IN ('assinado', 'minuta', 'revogado')
    WHEN 'assinado' THEN v_para IN ('aguardando_publicacao', 'revogado')
    WHEN 'aguardando_publicacao' THEN v_para IN ('publicado', 'assinado', 'revogado')
    WHEN 'publicado' THEN v_para IN ('vigente', 'revogado')
    WHEN 'vigente' THEN v_para IN ('revogado')
    ELSE false
  END;
  IF NOT v_ok THEN
    RAISE EXCEPTION 'Portaria %: não passa de "%" para "%" (ordem: minuta, aguardando assinatura, assinada, aguardando publicação, publicada, vigente)',
      NEW.numero, v_de, v_para USING ERRCODE = '23514';
  END IF;

  IF v_para = 'assinado' AND (NEW.assinado_por IS NULL OR btrim(NEW.assinado_por) = '' OR NEW.data_assinatura IS NULL) THEN
    RAISE EXCEPTION 'Portaria %: registre quem assinou e a data da assinatura', NEW.numero USING ERRCODE = '23514';
  END IF;
  IF v_para = 'publicado' AND (NEW.doe_numero IS NULL OR btrim(NEW.doe_numero) = '' OR NEW.doe_data IS NULL) THEN
    RAISE EXCEPTION 'Portaria %: registre o número e a data do DOE', NEW.numero USING ERRCODE = '23514';
  END IF;
  IF v_para = 'vigente' AND NEW.data_vigencia_inicio IS NULL THEN
    RAISE EXCEPTION 'Portaria %: informe a data de início da vigência', NEW.numero USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_documentos_portaria_validar ON public.documentos;
CREATE TRIGGER trg_documentos_portaria_validar
  BEFORE UPDATE OR DELETE ON public.documentos
  FOR EACH ROW EXECUTE FUNCTION public.documentos_portaria_validar();
REVOKE EXECUTE ON FUNCTION public.documentos_portaria_validar() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- pendências: provimento ativo sem portaria de nomeação publicada
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rh_pendencias_nomeacao()
 RETURNS TABLE (servidor_id uuid, nome text, matricula text, cargo text, provimento_id uuid, data_nomeacao date,
                portaria_numero text, portaria_status text)
 LANGUAGE sql
 STABLE SECURITY INVOKER
 SET search_path TO 'public'
AS $function$
  SELECT s.id, s.nome_completo, s.matricula, c.nome, p.id, p.data_nomeacao,
         (SELECT d.numero FROM public.documentos d
           WHERE d.tipo = 'portaria' AND d.categoria = 'nomeacao'
             AND (d.provimento_id = p.id OR s.id = ANY (d.servidores_ids))
           ORDER BY d.created_at DESC LIMIT 1),
         (SELECT d.status::text FROM public.documentos d
           WHERE d.tipo = 'portaria' AND d.categoria = 'nomeacao'
             AND (d.provimento_id = p.id OR s.id = ANY (d.servidores_ids))
           ORDER BY d.created_at DESC LIMIT 1)
    FROM public.provimentos p
    JOIN public.servidores s ON s.id = p.servidor_id
    JOIN public.cargos c ON c.id = p.cargo_id
   WHERE p.status = 'ativo'
     AND NOT EXISTS (
       SELECT 1 FROM public.documentos d
        WHERE d.tipo = 'portaria' AND d.categoria = 'nomeacao' AND d.status IN ('publicado', 'vigente')
          AND (d.provimento_id = p.id OR (s.id = ANY (d.servidores_ids) AND (d.cargo_id IS NULL OR d.cargo_id = p.cargo_id))))
   ORDER BY p.data_nomeacao, s.nome_completo;
$function$;
REVOKE EXECUTE ON FUNCTION public.rh_pendencias_nomeacao() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.rh_pendencias_nomeacao() TO authenticated;

NOTIFY pgrst, 'reload schema';
