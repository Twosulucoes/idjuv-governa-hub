-- ============================================
-- IDJuv - Schema de Migração
-- Arquivo 03: Funções Principais
-- ============================================
-- Execute APÓS 02_tabelas.sql
-- ============================================

-- ============================================
-- FUNÇÕES DE PERMISSÃO E ACESSO
-- ============================================

-- Verifica se usuário é admin
CREATE OR REPLACE FUNCTION public.usuario_eh_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuario_perfis up
    JOIN public.perfis p ON up.perfil_id = p.id
    WHERE up.user_id = check_user_id
      AND up.ativo = true
      AND p.codigo IN ('super_admin', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Verifica permissão específica
CREATE OR REPLACE FUNCTION public.usuario_tem_permissao(
  check_user_id UUID, 
  codigo_funcao VARCHAR
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Super admin tem todas as permissões
  IF public.usuario_eh_admin(check_user_id) THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.usuario_perfis up
    JOIN public.perfil_funcoes pf ON up.perfil_id = pf.perfil_id
    JOIN public.funcoes_sistema f ON pf.funcao_id = f.id
    WHERE up.user_id = check_user_id
      AND up.ativo = true
      AND pf.concedido = true
      AND f.codigo = codigo_funcao
      AND f.ativo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Verifica acesso a módulo
CREATE OR REPLACE FUNCTION public.can_access_module(
  check_user_id UUID,
  module_code TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Super admin tem acesso a tudo
  IF public.usuario_eh_admin(check_user_id) THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.usuario_perfis up
    JOIN public.perfil_funcoes pf ON up.perfil_id = pf.perfil_id
    JOIN public.funcoes_sistema f ON pf.funcao_id = f.id
    WHERE up.user_id = check_user_id
      AND up.ativo = true
      AND pf.concedido = true
      AND f.modulo = module_code
      AND f.ativo = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Obtém permissões do servidor
CREATE OR REPLACE FUNCTION public.get_permissions_from_servidor(servidor_uuid UUID)
RETURNS TABLE(
  user_id UUID,
  perfil_codigo TEXT,
  perfil_nome TEXT,
  funcao_codigo TEXT,
  funcao_nome TEXT,
  modulo TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    pf.codigo as perfil_codigo,
    pf.nome as perfil_nome,
    fs.codigo as funcao_codigo,
    fs.nome as funcao_nome,
    fs.modulo
  FROM public.profiles p
  JOIN public.usuario_perfis up ON p.id = up.user_id
  JOIN public.perfis pf ON up.perfil_id = pf.id
  JOIN public.perfil_funcoes pfn ON pf.id = pfn.perfil_id
  JOIN public.funcoes_sistema fs ON pfn.funcao_id = fs.id
  WHERE p.servidor_id = servidor_uuid
    AND up.ativo = true
    AND pfn.concedido = true
    AND fs.ativo = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- FUNÇÕES DE TIMESTAMP
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================
-- FUNÇÕES DE RH
-- ============================================

-- Atualiza situação do servidor
CREATE OR REPLACE FUNCTION public.fn_atualizar_situacao_servidor()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'licencas_afastamentos' THEN
    IF NEW.status = 'ativa' THEN
      UPDATE public.servidores 
      SET situacao = 
        CASE 
          WHEN NEW.tipo_afastamento = 'cessao' THEN 'cedido'::situacao_servidor
          WHEN NEW.tipo_afastamento = 'licenca' THEN 'licenca'::situacao_servidor
          ELSE 'afastado'::situacao_servidor
        END,
        updated_at = now()
      WHERE id = NEW.servidor_id;
    ELSIF NEW.status = 'encerrada' THEN
      UPDATE public.servidores 
      SET situacao = 'ativo'::situacao_servidor,
          updated_at = now()
      WHERE id = NEW.servidor_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'ferias_servidor' THEN
    IF NEW.status = 'em_gozo' THEN
      UPDATE public.servidores 
      SET situacao = 'ferias'::situacao_servidor,
          updated_at = now()
      WHERE id = NEW.servidor_id;
    ELSIF NEW.status = 'concluida' THEN
      UPDATE public.servidores 
      SET situacao = 'ativo'::situacao_servidor,
          updated_at = now()
      WHERE id = NEW.servidor_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Encerra lotação anterior
CREATE OR REPLACE FUNCTION public.fn_encerrar_lotacao_anterior()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.lotacoes
  SET data_fim = NEW.data_inicio - INTERVAL '1 day',
      ativo = false,
      updated_at = now()
  WHERE servidor_id = NEW.servidor_id
    AND id != NEW.id
    AND ativo = true
    AND data_fim IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Encerra vínculo anterior
CREATE OR REPLACE FUNCTION public.fn_encerrar_vinculo_anterior()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.vinculos_funcionais
  SET data_fim = NEW.data_inicio - INTERVAL '1 day',
      ativo = false,
      updated_at = now()
  WHERE servidor_id = NEW.servidor_id
    AND id != NEW.id
    AND ativo = true
    AND data_fim IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- FUNÇÕES FINANCEIRAS
-- ============================================

-- Calcula INSS
CREATE OR REPLACE FUNCTION public.calcular_inss_servidor(base_calculo DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
  valor_inss DECIMAL := 0;
  faixa1 DECIMAL := 1518.00;
  faixa2 DECIMAL := 2793.88;
  faixa3 DECIMAL := 4190.83;
  teto DECIMAL := 8157.41;
BEGIN
  IF base_calculo <= faixa1 THEN
    valor_inss := base_calculo * 0.075;
  ELSIF base_calculo <= faixa2 THEN
    valor_inss := (faixa1 * 0.075) + ((base_calculo - faixa1) * 0.09);
  ELSIF base_calculo <= faixa3 THEN
    valor_inss := (faixa1 * 0.075) + ((faixa2 - faixa1) * 0.09) + ((base_calculo - faixa2) * 0.12);
  ELSIF base_calculo <= teto THEN
    valor_inss := (faixa1 * 0.075) + ((faixa2 - faixa1) * 0.09) + ((faixa3 - faixa2) * 0.12) + ((base_calculo - faixa3) * 0.14);
  ELSE
    valor_inss := (faixa1 * 0.075) + ((faixa2 - faixa1) * 0.09) + ((faixa3 - faixa2) * 0.12) + ((teto - faixa3) * 0.14);
  END IF;
  
  RETURN ROUND(valor_inss, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Calcula IRRF
CREATE OR REPLACE FUNCTION public.calcular_irrf(
  base_calculo DECIMAL,
  num_dependentes INTEGER DEFAULT 0
)
RETURNS DECIMAL AS $$
DECLARE
  deducao_dependente DECIMAL := 189.59;
  base_tributavel DECIMAL;
  valor_irrf DECIMAL := 0;
  faixa1 DECIMAL := 2259.20;
  faixa2 DECIMAL := 2826.65;
  faixa3 DECIMAL := 3751.05;
  faixa4 DECIMAL := 4664.68;
BEGIN
  base_tributavel := base_calculo - (num_dependentes * deducao_dependente);
  
  IF base_tributavel <= faixa1 THEN
    valor_irrf := 0;
  ELSIF base_tributavel <= faixa2 THEN
    valor_irrf := (base_tributavel * 0.075) - 169.44;
  ELSIF base_tributavel <= faixa3 THEN
    valor_irrf := (base_tributavel * 0.15) - 381.44;
  ELSIF base_tributavel <= faixa4 THEN
    valor_irrf := (base_tributavel * 0.225) - 662.77;
  ELSE
    valor_irrf := (base_tributavel * 0.275) - 896.00;
  END IF;
  
  RETURN GREATEST(ROUND(valor_irrf, 2), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Verifica se folha está bloqueada
CREATE OR REPLACE FUNCTION public.folha_esta_bloqueada(folha_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  folha_status public.status_folha;
BEGIN
  SELECT status INTO folha_status
  FROM public.folhas_pagamento
  WHERE id = folha_uuid;
  
  RETURN folha_status IN ('fechada', 'paga');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- FUNÇÕES DE GERAÇÃO DE CÓDIGOS
-- ============================================

-- Gera número de protocolo
CREATE OR REPLACE FUNCTION public.gerar_protocolo_cedencia()
RETURNS TEXT AS $$
DECLARE
  ano INTEGER;
  sequencia INTEGER;
  protocolo TEXT;
BEGIN
  ano := EXTRACT(YEAR FROM CURRENT_DATE);
  
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART(numero_protocolo, '/', 1) AS INTEGER)
  ), 0) + 1
  INTO sequencia
  FROM public.termos_cessao
  WHERE numero_protocolo LIKE '%/' || ano::TEXT;
  
  protocolo := LPAD(sequencia::TEXT, 5, '0') || '/' || ano::TEXT;
  
  RETURN protocolo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Gera número de portaria
CREATE OR REPLACE FUNCTION public.gerar_numero_portaria(tipo_doc TEXT DEFAULT 'portaria')
RETURNS TEXT AS $$
DECLARE
  ano INTEGER;
  sequencia INTEGER;
  numero TEXT;
BEGIN
  ano := EXTRACT(YEAR FROM CURRENT_DATE);
  
  SELECT COALESCE(MAX(
    CAST(REGEXP_REPLACE(numero, '[^0-9]', '', 'g') AS INTEGER)
  ), 0) + 1
  INTO sequencia
  FROM public.documentos
  WHERE tipo::TEXT = tipo_doc
    AND EXTRACT(YEAR FROM created_at) = ano;
  
  numero := LPAD(sequencia::TEXT, 4, '0') || '/' || ano::TEXT;
  
  RETURN numero;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- FUNÇÕES DE AUDITORIA
-- ============================================

CREATE OR REPLACE FUNCTION public.audit_permission_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (
    action,
    entity_type,
    entity_id,
    before_data,
    after_data,
    user_id,
    description
  )
  VALUES (
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'create'
      WHEN TG_OP = 'UPDATE' THEN 'update'
      WHEN TG_OP = 'DELETE' THEN 'delete'
    END::audit_action,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id)::uuid,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::jsonb ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb ELSE NULL END,
    auth.uid(),
    'Alteração em ' || TG_TABLE_NAME
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- FUNÇÕES AUXILIARES
-- ============================================

-- Lista tabelas públicas (para descoberta de schema)
CREATE OR REPLACE FUNCTION public.list_public_tables()
RETURNS TABLE(table_name TEXT, row_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::TEXT,
    (xpath('/row/cnt/text()', 
      query_to_xml(format('SELECT count(*) as cnt FROM public.%I', t.tablename), false, true, '')
    ))[1]::TEXT::BIGINT as row_count
  FROM pg_tables t
  WHERE t.schemaname = 'public'
    AND t.tablename NOT LIKE '\_%'
    AND t.tablename NOT IN ('schema_migrations', 'supabase_functions_migrations')
  ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- FIM DO ARQUIVO 03_funcoes_principais.sql
-- Próximo: 04_triggers.sql
-- ============================================
