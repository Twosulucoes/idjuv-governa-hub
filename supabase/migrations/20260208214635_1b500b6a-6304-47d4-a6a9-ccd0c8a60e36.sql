-- =====================================================
-- AUDITORIA DO WORKFLOW DE GESTORES ESCOLARES
-- =====================================================

-- Remover tabela se existir (para recriação limpa)
DROP TABLE IF EXISTS public.gestores_escolares_historico CASCADE;

-- Tabela de histórico de workflow
CREATE TABLE public.gestores_escolares_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gestor_id UUID NOT NULL REFERENCES public.gestores_escolares(id) ON DELETE CASCADE,
    status_anterior TEXT,
    status_novo TEXT NOT NULL,
    usuario_id UUID,
    usuario_nome TEXT,
    usuario_email TEXT,
    acao TEXT NOT NULL,
    detalhes JSONB DEFAULT '{}',
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_gestores_historico_gestor ON public.gestores_escolares_historico(gestor_id);
CREATE INDEX idx_gestores_historico_status ON public.gestores_escolares_historico(status_novo);
CREATE INDEX idx_gestores_historico_usuario ON public.gestores_escolares_historico(usuario_id);
CREATE INDEX idx_gestores_historico_created ON public.gestores_escolares_historico(created_at DESC);

COMMENT ON TABLE public.gestores_escolares_historico IS 'Histórico completo de workflow do módulo Gestores Escolares';

ALTER TABLE public.gestores_escolares_historico ENABLE ROW LEVEL SECURITY;

-- Políticas RLS 
CREATE POLICY "Admin pode ver todo histórico"
ON public.gestores_escolares_historico
FOR SELECT
TO authenticated
USING (
    public.has_role('admin'::public.app_role) OR
    public.usuario_tem_permissao(auth.uid(), 'gestores_escolares.admin')
);

CREATE POLICY "Sistema pode inserir histórico"
ON public.gestores_escolares_historico
FOR INSERT
TO authenticated
WITH CHECK (true);

-- =====================================================
-- TRIGGER PARA REGISTRAR MUDANÇAS
-- =====================================================

CREATE OR REPLACE FUNCTION public.fn_audit_gestores_escolares()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_acao TEXT;
    v_detalhes JSONB;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_acao := 'criacao';
        v_detalhes := jsonb_build_object('escola_id', NEW.escola_id, 'nome', NEW.nome, 'email', NEW.email);
        
        INSERT INTO public.gestores_escolares_historico (
            gestor_id, status_anterior, status_novo, usuario_id, usuario_nome, acao, detalhes
        ) VALUES (NEW.id, NULL, NEW.status, NULL, 'Sistema (Pré-cadastro)', v_acao, v_detalhes);
        
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            CASE NEW.status
                WHEN 'em_processamento' THEN v_acao := 'assumir_tarefa';
                WHEN 'cadastrado_cbde' THEN v_acao := 'cadastro_cbde';
                WHEN 'contato_realizado' THEN v_acao := 'contato_realizado';
                WHEN 'confirmado' THEN v_acao := 'confirmacao';
                WHEN 'problema' THEN v_acao := 'problema';
                ELSE v_acao := 'mudanca_status';
            END CASE;
            
            v_detalhes := jsonb_build_object('status_anterior', OLD.status, 'status_novo', NEW.status);
            
            IF NEW.observacoes IS DISTINCT FROM OLD.observacoes THEN
                v_detalhes := v_detalhes || jsonb_build_object('observacoes', NEW.observacoes);
            END IF;
            
            INSERT INTO public.gestores_escolares_historico (
                gestor_id, status_anterior, status_novo, usuario_id, usuario_nome, usuario_email, acao, detalhes
            ) VALUES (NEW.id, OLD.status, NEW.status, NEW.responsavel_id, NEW.responsavel_nome, NEW.responsavel_nome, v_acao, v_detalhes);
            
        ELSIF NEW.observacoes IS DISTINCT FROM OLD.observacoes THEN
            v_acao := 'observacao';
            v_detalhes := jsonb_build_object('observacao_nova', LEFT(COALESCE(NEW.observacoes, ''), 200));
            
            INSERT INTO public.gestores_escolares_historico (
                gestor_id, status_anterior, status_novo, usuario_id, usuario_nome, acao, detalhes
            ) VALUES (NEW.id, OLD.status, NEW.status, NEW.responsavel_id, NEW.responsavel_nome, v_acao, v_detalhes);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_audit_gestores_escolares ON public.gestores_escolares;
CREATE TRIGGER tr_audit_gestores_escolares
    AFTER INSERT OR UPDATE ON public.gestores_escolares
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_audit_gestores_escolares();

-- =====================================================
-- VIEW PARA RELATÓRIO
-- =====================================================

DROP VIEW IF EXISTS public.v_gestores_workflow_auditoria;
CREATE VIEW public.v_gestores_workflow_auditoria
WITH (security_invoker = on)
AS
SELECT 
    h.id AS historico_id,
    h.gestor_id,
    g.nome AS gestor_nome,
    g.cpf AS gestor_cpf,
    g.email AS gestor_email,
    e.nome AS escola_nome,
    e.municipio AS escola_municipio,
    h.status_anterior,
    h.status_novo,
    h.acao,
    h.usuario_id,
    h.usuario_nome AS responsavel,
    h.detalhes,
    h.created_at AS data_acao,
    g.status AS status_atual,
    g.created_at AS data_criacao,
    g.updated_at AS ultima_atualizacao,
    CASE 
        WHEN g.status NOT IN ('confirmado', 'problema') 
             AND EXTRACT(EPOCH FROM (now() - g.updated_at)) / 3600 > 48 
        THEN true 
        ELSE false 
    END AS alerta_parado,
    EXTRACT(DAY FROM (now() - g.updated_at)) AS dias_no_status_atual
FROM public.gestores_escolares_historico h
JOIN public.gestores_escolares g ON g.id = h.gestor_id
LEFT JOIN public.escolas_jer e ON e.id = g.escola_id;

COMMENT ON VIEW public.v_gestores_workflow_auditoria IS 'View de auditoria do workflow de gestores escolares';