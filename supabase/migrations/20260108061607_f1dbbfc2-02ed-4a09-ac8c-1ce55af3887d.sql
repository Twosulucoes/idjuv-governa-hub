-- ================================================================
-- REFATORAÇÃO DO SISTEMA DE SERVIDORES: INTELIGÊNCIA LEGAL
-- ================================================================

-- 1. TABELA DE COMPATIBILIDADE CARGO/UNIDADE
CREATE TABLE IF NOT EXISTS public.cargo_unidade_compatibilidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cargo_id UUID REFERENCES public.cargos(id) ON DELETE CASCADE,
  tipo_unidade tipo_unidade NULL,
  unidade_especifica_id UUID REFERENCES public.estrutura_organizacional(id) ON DELETE CASCADE,
  quantidade_maxima INTEGER DEFAULT 1,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.cargo_unidade_compatibilidade ENABLE ROW LEVEL SECURITY;

CREATE POLICY "compat_select" ON public.cargo_unidade_compatibilidade FOR SELECT TO authenticated USING (true);
CREATE POLICY "compat_admin" ON public.cargo_unidade_compatibilidade FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_cargo_unidade_compat_cargo ON public.cargo_unidade_compatibilidade(cargo_id);

-- 2. FUNÇÃO PARA VERIFICAR REGRAS DE NOMEAÇÃO
CREATE OR REPLACE FUNCTION public.fn_validar_provimento()
RETURNS TRIGGER AS $$
DECLARE
  v_cargo RECORD;
  v_vinculo_ativo RECORD;
  v_provimento_ativo INTEGER;
  v_vagas_ocupadas INTEGER;
BEGIN
  SELECT * INTO v_cargo FROM public.cargos WHERE id = NEW.cargo_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Cargo não encontrado'; END IF;

  IF NEW.status = 'ativo' THEN
    SELECT COUNT(*) INTO v_provimento_ativo 
    FROM public.provimentos 
    WHERE servidor_id = NEW.servidor_id AND status = 'ativo' 
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
    
    IF v_provimento_ativo > 0 THEN
      RAISE EXCEPTION 'Servidor já possui provimento ativo';
    END IF;
  END IF;

  SELECT COUNT(*) INTO v_vagas_ocupadas 
  FROM public.provimentos 
  WHERE cargo_id = NEW.cargo_id AND status = 'ativo'
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  
  IF v_vagas_ocupadas >= COALESCE(v_cargo.quantidade_vagas, 1) THEN
    RAISE EXCEPTION 'Não há vagas disponíveis para o cargo %', v_cargo.nome;
  END IF;

  SELECT * INTO v_vinculo_ativo 
  FROM public.vinculos_funcionais 
  WHERE servidor_id = NEW.servidor_id AND ativo = true 
  ORDER BY data_inicio DESC LIMIT 1;
  
  IF v_vinculo_ativo.tipo_vinculo = 'cedido_entrada' THEN
    RAISE EXCEPTION 'Servidor cedido de outro órgão não pode ter nomeação no IDJuv';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_validar_provimento ON public.provimentos;
CREATE TRIGGER trg_validar_provimento BEFORE INSERT OR UPDATE ON public.provimentos
  FOR EACH ROW EXECUTE FUNCTION public.fn_validar_provimento();

-- 3. ENCERRAR VÍNCULO ANTERIOR
CREATE OR REPLACE FUNCTION public.fn_encerrar_vinculo_anterior()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ativo = true THEN
    UPDATE public.vinculos_funcionais 
    SET ativo = false, data_fim = COALESCE(data_fim, NEW.data_inicio - INTERVAL '1 day')
    WHERE servidor_id = NEW.servidor_id AND ativo = true AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_encerrar_vinculo_anterior ON public.vinculos_funcionais;
CREATE TRIGGER trg_encerrar_vinculo_anterior AFTER INSERT OR UPDATE ON public.vinculos_funcionais
  FOR EACH ROW WHEN (NEW.ativo = true) EXECUTE FUNCTION public.fn_encerrar_vinculo_anterior();

-- 4. ENCERRAR LOTAÇÃO ANTERIOR
CREATE OR REPLACE FUNCTION public.fn_encerrar_lotacao_anterior()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ativo = true THEN
    UPDATE public.lotacoes 
    SET ativo = false, data_fim = COALESCE(data_fim, NEW.data_inicio - INTERVAL '1 day')
    WHERE servidor_id = NEW.servidor_id AND ativo = true AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_encerrar_lotacao_anterior ON public.lotacoes;
CREATE TRIGGER trg_encerrar_lotacao_anterior AFTER INSERT OR UPDATE ON public.lotacoes
  FOR EACH ROW WHEN (NEW.ativo = true) EXECUTE FUNCTION public.fn_encerrar_lotacao_anterior();

-- 5. ENCERRAR PROVIMENTO EM CESSÃO DE SAÍDA
CREATE OR REPLACE FUNCTION public.fn_encerrar_provimento_comissionado_cessao()
RETURNS TRIGGER AS $$
DECLARE v_vinculo RECORD;
BEGIN
  IF NEW.tipo = 'saida' AND NEW.ativa = true THEN
    SELECT * INTO v_vinculo FROM public.vinculos_funcionais 
    WHERE servidor_id = NEW.servidor_id AND ativo = true ORDER BY data_inicio DESC LIMIT 1;
    
    IF v_vinculo.tipo_vinculo = 'comissionado_idjuv' THEN
      UPDATE public.provimentos SET status = 'encerrado', data_encerramento = NEW.data_inicio,
        motivo_encerramento = 'cessao_comissionado'
      WHERE servidor_id = NEW.servidor_id AND status = 'ativo';
    ELSIF v_vinculo.tipo_vinculo = 'efetivo_idjuv' THEN
      UPDATE public.provimentos SET status = 'suspenso'
      WHERE servidor_id = NEW.servidor_id AND status = 'ativo';
    END IF;
    
    UPDATE public.lotacoes SET ativo = false, data_fim = NEW.data_inicio
    WHERE servidor_id = NEW.servidor_id AND ativo = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_encerrar_provimento_comissionado_cessao ON public.cessoes;
CREATE TRIGGER trg_encerrar_provimento_comissionado_cessao AFTER INSERT OR UPDATE ON public.cessoes
  FOR EACH ROW EXECUTE FUNCTION public.fn_encerrar_provimento_comissionado_cessao();

-- 6. REATIVAR PROVIMENTO NO RETORNO
CREATE OR REPLACE FUNCTION public.fn_reativar_provimento_retorno_cessao()
RETURNS TRIGGER AS $$
DECLARE v_vinculo RECORD;
BEGIN
  IF OLD.ativa = true AND NEW.ativa = false AND NEW.data_retorno IS NOT NULL THEN
    SELECT * INTO v_vinculo FROM public.vinculos_funcionais 
    WHERE servidor_id = NEW.servidor_id AND ativo = true ORDER BY data_inicio DESC LIMIT 1;
    
    IF v_vinculo.tipo_vinculo = 'efetivo_idjuv' THEN
      UPDATE public.provimentos SET status = 'ativo'
      WHERE servidor_id = NEW.servidor_id AND status = 'suspenso';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_reativar_provimento_retorno_cessao ON public.cessoes;
CREATE TRIGGER trg_reativar_provimento_retorno_cessao AFTER UPDATE ON public.cessoes
  FOR EACH ROW EXECUTE FUNCTION public.fn_reativar_provimento_retorno_cessao();

-- 7. POPULAR COMPATIBILIDADE
INSERT INTO public.cargo_unidade_compatibilidade (cargo_id, tipo_unidade, observacao)
SELECT c.id, 'presidencia', 'Cargo exclusivo da Presidência'
FROM public.cargos c WHERE LOWER(c.nome) LIKE '%presidente%' 
  AND NOT EXISTS (SELECT 1 FROM public.cargo_unidade_compatibilidade WHERE cargo_id = c.id);

INSERT INTO public.cargo_unidade_compatibilidade (cargo_id, tipo_unidade, observacao)
SELECT c.id, 'diretoria', 'Cargo exclusivo de Diretorias'
FROM public.cargos c WHERE LOWER(c.nome) LIKE '%diretor%' 
  AND NOT EXISTS (SELECT 1 FROM public.cargo_unidade_compatibilidade WHERE cargo_id = c.id);

-- Comentários
COMMENT ON TABLE public.cargo_unidade_compatibilidade IS 'Compatibilidade cargo/unidade conforme lei do IDJuv';