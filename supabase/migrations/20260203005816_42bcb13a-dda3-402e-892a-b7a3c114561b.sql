-- ============================================
-- WORKFLOW DE FECHAMENTO DA FOLHA DE PAGAMENTO
-- ============================================

-- 1. Adicionar campos de governança na tabela folhas_pagamento
ALTER TABLE public.folhas_pagamento 
  ADD COLUMN IF NOT EXISTS fechado_por UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS fechado_em TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS justificativa_fechamento TEXT,
  ADD COLUMN IF NOT EXISTS reaberto_por UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reaberto_em TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS justificativa_reabertura TEXT,
  ADD COLUMN IF NOT EXISTS conferido_por UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS conferido_em TIMESTAMP WITH TIME ZONE;

-- 2. Criar tabela de histórico de transições de status
CREATE TABLE IF NOT EXISTS public.folha_historico_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folha_id UUID NOT NULL REFERENCES public.folhas_pagamento(id) ON DELETE CASCADE,
  status_anterior TEXT,
  status_novo TEXT NOT NULL,
  usuario_id UUID REFERENCES auth.users(id),
  usuario_nome TEXT,
  justificativa TEXT,
  ip_address INET DEFAULT inet_client_addr(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index para consultas por folha
CREATE INDEX IF NOT EXISTS idx_folha_historico_status_folha_id 
  ON public.folha_historico_status(folha_id);

-- 3. Habilitar RLS na tabela de histórico
ALTER TABLE public.folha_historico_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folha_historico_status FORCE ROW LEVEL SECURITY;

-- Política de leitura: apenas RH e super_admin
CREATE POLICY "rh_visualizar_historico_folha" ON public.folha_historico_status
  FOR SELECT USING (
    public.usuario_tem_permissao(auth.uid(), 'rh.visualizar')
    OR public.usuario_eh_admin(auth.uid())
  );

-- Política de inserção: apenas sistema (trigger) ou admin
CREATE POLICY "inserir_historico_folha" ON public.folha_historico_status
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Sem update ou delete (imutável)
CREATE POLICY "nao_alterar_historico_folha" ON public.folha_historico_status
  FOR UPDATE USING (false);

CREATE POLICY "nao_excluir_historico_folha" ON public.folha_historico_status
  FOR DELETE USING (false);

-- 4. Função para registrar transição de status
CREATE OR REPLACE FUNCTION public.registrar_transicao_folha()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_nome TEXT;
BEGIN
  -- Buscar nome do usuário
  SELECT nome INTO v_user_nome FROM public.profiles WHERE id = auth.uid();
  
  -- Registrar transição apenas se status mudou
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.folha_historico_status (
      folha_id,
      status_anterior,
      status_novo,
      usuario_id,
      usuario_nome,
      justificativa
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid(),
      v_user_nome,
      CASE 
        WHEN NEW.status = 'fechada' THEN NEW.justificativa_fechamento
        WHEN NEW.status = 'reaberta' THEN NEW.justificativa_reabertura
        ELSE NULL
      END
    );
    
    -- Atualizar campos de controle
    IF NEW.status = 'fechada' AND OLD.status != 'fechada' THEN
      NEW.fechado_por := COALESCE(NEW.fechado_por, auth.uid());
      NEW.fechado_em := COALESCE(NEW.fechado_em, now());
    END IF;
    
    IF NEW.status = 'processando' AND OLD.status = 'aberta' THEN
      NEW.conferido_por := COALESCE(NEW.conferido_por, auth.uid());
      NEW.conferido_em := COALESCE(NEW.conferido_em, now());
    END IF;
    
    IF NEW.status = 'reaberta' THEN
      NEW.reaberto_por := COALESCE(NEW.reaberto_por, auth.uid());
      NEW.reaberto_em := COALESCE(NEW.reaberto_em, now());
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para registrar transições
DROP TRIGGER IF EXISTS trg_registrar_transicao_folha ON public.folhas_pagamento;
CREATE TRIGGER trg_registrar_transicao_folha
  BEFORE UPDATE ON public.folhas_pagamento
  FOR EACH ROW
  EXECUTE FUNCTION public.registrar_transicao_folha();

-- 5. Função para verificar se folha está bloqueada
CREATE OR REPLACE FUNCTION public.folha_esta_bloqueada(p_folha_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT status = 'fechada'
  FROM public.folhas_pagamento
  WHERE id = p_folha_id;
$$;

-- 6. Função para verificar se usuário pode fechar folha
CREATE OR REPLACE FUNCTION public.usuario_pode_fechar_folha(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.usuario_tem_permissao(p_user_id, 'rh.admin')
    OR public.usuario_eh_admin(p_user_id);
$$;

-- 7. Função para verificar se usuário pode reabrir folha (apenas super_admin)
CREATE OR REPLACE FUNCTION public.usuario_pode_reabrir_folha(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.usuario_eh_admin(p_user_id);
$$;

-- 8. Política de proteção para fichas_financeiras quando folha fechada
-- Bloquear UPDATE em fichas de folhas fechadas
CREATE OR REPLACE FUNCTION public.bloquear_alteracao_ficha_fechada()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se a folha está fechada
  IF public.folha_esta_bloqueada(NEW.folha_id) THEN
    -- Permitir apenas para super_admin
    IF NOT public.usuario_eh_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Folha fechada: não é possível alterar fichas financeiras';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bloquear_alteracao_ficha_fechada ON public.fichas_financeiras;
CREATE TRIGGER trg_bloquear_alteracao_ficha_fechada
  BEFORE UPDATE ON public.fichas_financeiras
  FOR EACH ROW
  EXECUTE FUNCTION public.bloquear_alteracao_ficha_fechada();

-- 9. Bloquear DELETE em fichas de folhas fechadas
CREATE OR REPLACE FUNCTION public.bloquear_exclusao_ficha_fechada()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.folha_esta_bloqueada(OLD.folha_id) THEN
    IF NOT public.usuario_eh_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Folha fechada: não é possível excluir fichas financeiras';
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_bloquear_exclusao_ficha_fechada ON public.fichas_financeiras;
CREATE TRIGGER trg_bloquear_exclusao_ficha_fechada
  BEFORE DELETE ON public.fichas_financeiras
  FOR EACH ROW
  EXECUTE FUNCTION public.bloquear_exclusao_ficha_fechada();

-- 10. Proteção para itens_ficha_financeira
CREATE OR REPLACE FUNCTION public.bloquear_alteracao_item_ficha_fechada()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_folha_id UUID;
BEGIN
  -- Buscar folha_id via ficha
  SELECT folha_id INTO v_folha_id
  FROM public.fichas_financeiras
  WHERE id = COALESCE(NEW.ficha_id, OLD.ficha_id);
  
  IF public.folha_esta_bloqueada(v_folha_id) THEN
    IF NOT public.usuario_eh_admin(auth.uid()) THEN
      RAISE EXCEPTION 'Folha fechada: não é possível alterar itens de fichas financeiras';
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_bloquear_alteracao_item_ficha_fechada ON public.itens_ficha_financeira;
CREATE TRIGGER trg_bloquear_alteracao_item_ficha_fechada
  BEFORE UPDATE OR DELETE ON public.itens_ficha_financeira
  FOR EACH ROW
  EXECUTE FUNCTION public.bloquear_alteracao_item_ficha_fechada();

-- 11. RPC para fechar folha com validações
CREATE OR REPLACE FUNCTION public.fechar_folha(
  p_folha_id UUID,
  p_justificativa TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_folha RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Verificar autenticação
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não autenticado');
  END IF;
  
  -- Verificar permissão
  IF NOT public.usuario_pode_fechar_folha(v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão para fechar folha');
  END IF;
  
  -- Buscar folha
  SELECT * INTO v_folha FROM public.folhas_pagamento WHERE id = p_folha_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Folha não encontrada');
  END IF;
  
  -- Verificar status atual
  IF v_folha.status = 'fechada' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Folha já está fechada');
  END IF;
  
  IF v_folha.status NOT IN ('processando', 'aberta') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Folha deve estar em conferência ou aberta para ser fechada');
  END IF;
  
  -- Atualizar para fechada
  UPDATE public.folhas_pagamento
  SET 
    status = 'fechada',
    fechado_por = v_user_id,
    fechado_em = now(),
    justificativa_fechamento = p_justificativa,
    data_fechamento = now()
  WHERE id = p_folha_id;
  
  -- Registrar no audit_log
  INSERT INTO public.audit_logs (
    action, entity_type, entity_id, module_name, description, user_id
  ) VALUES (
    'update', 'folhas_pagamento', p_folha_id::text, 'folha',
    format('Folha %s/%s fechada. Justificativa: %s', v_folha.competencia_mes, v_folha.competencia_ano, COALESCE(p_justificativa, 'Sem justificativa')),
    v_user_id
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'Folha fechada com sucesso');
END;
$$;

-- 12. RPC para reabrir folha (apenas super_admin)
CREATE OR REPLACE FUNCTION public.reabrir_folha(
  p_folha_id UUID,
  p_justificativa TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_folha RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Verificar autenticação
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não autenticado');
  END IF;
  
  -- Justificativa obrigatória
  IF p_justificativa IS NULL OR trim(p_justificativa) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Justificativa obrigatória para reabrir folha');
  END IF;
  
  -- Verificar permissão (apenas super_admin)
  IF NOT public.usuario_pode_reabrir_folha(v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas super administradores podem reabrir folhas');
  END IF;
  
  -- Buscar folha
  SELECT * INTO v_folha FROM public.folhas_pagamento WHERE id = p_folha_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Folha não encontrada');
  END IF;
  
  -- Verificar status atual
  IF v_folha.status != 'fechada' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Apenas folhas fechadas podem ser reabertas');
  END IF;
  
  -- Atualizar para reaberta
  UPDATE public.folhas_pagamento
  SET 
    status = 'reaberta',
    reaberto_por = v_user_id,
    reaberto_em = now(),
    justificativa_reabertura = p_justificativa
  WHERE id = p_folha_id;
  
  -- Registrar no audit_log
  INSERT INTO public.audit_logs (
    action, entity_type, entity_id, module_name, description, user_id
  ) VALUES (
    'update', 'folhas_pagamento', p_folha_id::text, 'folha',
    format('Folha %s/%s REABERTA por super_admin. Justificativa: %s', v_folha.competencia_mes, v_folha.competencia_ano, p_justificativa),
    v_user_id
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'Folha reaberta com sucesso');
END;
$$;

-- 13. RPC para enviar para conferência
CREATE OR REPLACE FUNCTION public.enviar_folha_conferencia(
  p_folha_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_folha RECORD;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não autenticado');
  END IF;
  
  IF NOT public.usuario_tem_permissao(v_user_id, 'rh.admin') AND NOT public.usuario_eh_admin(v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sem permissão para enviar para conferência');
  END IF;
  
  SELECT * INTO v_folha FROM public.folhas_pagamento WHERE id = p_folha_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Folha não encontrada');
  END IF;
  
  IF v_folha.status NOT IN ('aberta', 'reaberta') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Folha deve estar aberta ou reaberta para enviar à conferência');
  END IF;
  
  UPDATE public.folhas_pagamento
  SET 
    status = 'processando',
    conferido_por = v_user_id,
    conferido_em = now()
  WHERE id = p_folha_id;
  
  RETURN jsonb_build_object('success', true, 'message', 'Folha enviada para conferência');
END;
$$;

-- 14. Conceder permissões de execução
GRANT EXECUTE ON FUNCTION public.fechar_folha TO authenticated;
GRANT EXECUTE ON FUNCTION public.reabrir_folha TO authenticated;
GRANT EXECUTE ON FUNCTION public.enviar_folha_conferencia TO authenticated;
GRANT EXECUTE ON FUNCTION public.folha_esta_bloqueada TO authenticated;
GRANT EXECUTE ON FUNCTION public.usuario_pode_fechar_folha TO authenticated;
GRANT EXECUTE ON FUNCTION public.usuario_pode_reabrir_folha TO authenticated;