
-- =============================================
-- TRIGGER GENÉRICO DE AUDITORIA PARA MÓDULO RH
-- Registra automaticamente INSERT/UPDATE/DELETE
-- =============================================

-- Função trigger genérica de auditoria
CREATE OR REPLACE FUNCTION public.fn_audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
  _action text;
  _before jsonb;
  _after jsonb;
  _entity_id uuid;
  _user_id uuid;
  _description text;
  _module text;
BEGIN
  -- Determinar ação
  IF TG_OP = 'INSERT' THEN
    _action := 'create';
    _before := NULL;
    _after := to_jsonb(NEW);
    _entity_id := NEW.id;
    _description := 'Registro criado em ' || TG_TABLE_NAME;
  ELSIF TG_OP = 'UPDATE' THEN
    _action := 'update';
    _before := to_jsonb(OLD);
    _after := to_jsonb(NEW);
    _entity_id := NEW.id;
    _description := 'Registro atualizado em ' || TG_TABLE_NAME;
  ELSIF TG_OP = 'DELETE' THEN
    _action := 'delete';
    _before := to_jsonb(OLD);
    _after := NULL;
    _entity_id := OLD.id;
    _description := 'Registro excluído de ' || TG_TABLE_NAME;
  END IF;

  -- Obter user_id da sessão (pode ser nulo em operações de sistema)
  _user_id := auth.uid();

  -- Obter o módulo a partir do TG_ARGV (passado como argumento do trigger)
  _module := TG_ARGV[0];

  -- Inserir log de auditoria
  INSERT INTO public.audit_logs (
    action,
    entity_type,
    entity_id,
    module_name,
    before_data,
    after_data,
    user_id,
    description,
    metadata
  ) VALUES (
    _action::audit_action,
    TG_TABLE_NAME,
    _entity_id,
    _module,
    _before,
    _after,
    _user_id,
    _description,
    jsonb_build_object('trigger', true, 'operation', TG_OP, 'table', TG_TABLE_NAME)
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================
-- APLICAR TRIGGERS NAS TABELAS DO MÓDULO RH
-- =============================================

-- 1. Servidores
CREATE TRIGGER audit_servidores
  AFTER INSERT OR UPDATE OR DELETE ON public.servidores
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('rh');

-- 2. Férias
CREATE TRIGGER audit_ferias_servidor
  AFTER INSERT OR UPDATE OR DELETE ON public.ferias_servidor
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('rh');

-- 3. Lotações
CREATE TRIGGER audit_lotacoes
  AFTER INSERT OR UPDATE OR DELETE ON public.lotacoes
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('rh');

-- 4. Provimentos
CREATE TRIGGER audit_provimentos
  AFTER INSERT OR UPDATE OR DELETE ON public.provimentos
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('rh');

-- 5. Histórico funcional
CREATE TRIGGER audit_historico_funcional
  AFTER INSERT OR UPDATE OR DELETE ON public.historico_funcional
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('rh');

-- 6. Designações
CREATE TRIGGER audit_designacoes
  AFTER INSERT OR UPDATE OR DELETE ON public.designacoes
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('rh');

-- 7. Licenças/Afastamentos
CREATE TRIGGER audit_licencas_afastamentos
  AFTER INSERT OR UPDATE OR DELETE ON public.licencas_afastamentos
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('rh');

-- 8. Viagens/Diárias
CREATE TRIGGER audit_viagens_diarias
  AFTER INSERT OR UPDATE OR DELETE ON public.viagens_diarias
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('rh');

-- 9. Frequência mensal
CREATE TRIGGER audit_frequencia_mensal
  AFTER INSERT OR UPDATE OR DELETE ON public.frequencia_mensal
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('rh');

-- 10. Nomeações chefe unidade
CREATE TRIGGER audit_nomeacoes_chefe_unidade
  AFTER INSERT OR UPDATE OR DELETE ON public.nomeacoes_chefe_unidade
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('rh');

-- 11. Registros de ponto
CREATE TRIGGER audit_registros_ponto
  AFTER INSERT OR UPDATE OR DELETE ON public.registros_ponto
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('rh');

-- 12. Banco de horas
CREATE TRIGGER audit_banco_horas
  AFTER INSERT OR UPDATE OR DELETE ON public.banco_horas
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger('rh');
