-- Onda 2 da revisão de permissões: cota de uso por usuário para Edge Functions caras ou abusáveis
--
-- cpsi-ai-assistant (IA paga por uso) e enviar-convite-reuniao (e-mail/WhatsApp com a marca do órgão)
-- limitam chamadas por usuário por hora. Contar e registrar em duas chamadas deixava N pedidos em
-- paralelo passarem juntos; aqui a contagem e o registro acontecem na mesma transação, sob um lock
-- por (tipo, usuário). O registro fica em audit_logs (entity_type = _tipo, metadata.quantidade), que
-- já é a trilha só de acréscimo do sistema.
-- Só a service role executa (as Edge Functions); igual ao supabase/baseline/overlay/18_funcoes_rpc.sql.

CREATE OR REPLACE FUNCTION public.consumir_cota_uso(
  _usuario uuid, _tipo text, _quantidade integer, _limite integer, _modulo text, _descricao text
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  usado integer;
BEGIN
  IF _usuario IS NULL OR _tipo IS NULL OR coalesce(_quantidade, 0) < 1 OR coalesce(_limite, 0) < 1 THEN
    RETURN false;
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext('cota_uso:' || _tipo), hashtext(_usuario::text));
  SELECT coalesce(sum(coalesce((metadata ->> 'quantidade')::integer, 1)), 0) INTO usado
    FROM public.audit_logs
   WHERE user_id = _usuario AND entity_type = _tipo AND "timestamp" >= now() - interval '1 hour';
  IF usado + _quantidade > _limite THEN
    RETURN false;
  END IF;
  INSERT INTO public.audit_logs (action, entity_type, user_id, module_name, description, metadata)
  VALUES ('submit', _tipo, _usuario, _modulo, _descricao, jsonb_build_object('quantidade', _quantidade));
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.consumir_cota_uso(uuid, text, integer, integer, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consumir_cota_uso(uuid, text, integer, integer, text, text) TO service_role;
