-- ============================================================================
-- CAMADA BASE DE PARAMETRIZAÇÃO DO RH
-- Versão: 1.0 | Data: 02/02/2026
-- Objetivo: Criar infraestrutura para parâmetros configuráveis com hierarquia,
--           vigência e auditoria, sem impactar módulos existentes.
-- ============================================================================

-- ============================================================================
-- 1. TABELA: config_institucional
-- Armazena dados da instituição (suporte multi-institucional futuro)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.config_institucional (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo varchar(20) UNIQUE NOT NULL,
    nome varchar(255) NOT NULL,
    nome_fantasia varchar(255),
    cnpj varchar(18) UNIQUE NOT NULL,
    natureza_juridica varchar(100),
    endereco jsonb DEFAULT '{}'::jsonb,
    contato jsonb DEFAULT '{}'::jsonb,
    responsavel_legal varchar(255),
    cpf_responsavel varchar(14),
    cargo_responsavel varchar(100),
    logo_url text,
    brasao_url text,
    cores jsonb DEFAULT '{}'::jsonb,
    expediente jsonb DEFAULT '{"inicio": "08:00", "fim": "14:00", "dias": [1,2,3,4,5]}'::jsonb,
    politicas jsonb DEFAULT '{}'::jsonb,
    ativo boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_at timestamptz DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id)
);

COMMENT ON TABLE public.config_institucional IS 'Cadastro de instituições para suporte multi-institucional. Cada instituição tem seus próprios parâmetros.';
COMMENT ON COLUMN public.config_institucional.codigo IS 'Código único da instituição (ex: IDJUV)';
COMMENT ON COLUMN public.config_institucional.expediente IS 'Horário de expediente padrão: {inicio, fim, dias}';
COMMENT ON COLUMN public.config_institucional.politicas IS 'Políticas gerais configuráveis em JSON';

-- ============================================================================
-- 2. TABELA: config_parametros_meta
-- Catálogo de metadados dos parâmetros disponíveis
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.config_parametros_meta (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo varchar(100) UNIQUE NOT NULL,
    dominio varchar(20) NOT NULL CHECK (dominio IN ('INST', 'CAL', 'VF', 'FREQ', 'FOLHA', 'DOC')),
    tipo_dado varchar(20) NOT NULL CHECK (tipo_dado IN ('simples', 'json', 'temporal', 'condicional')),
    tipo_valor varchar(20) NOT NULL CHECK (tipo_valor IN ('text', 'numeric', 'boolean', 'date', 'json')),
    permite_nivel_instituicao boolean DEFAULT true,
    permite_nivel_unidade boolean DEFAULT false,
    permite_nivel_tipo_servidor boolean DEFAULT false,
    permite_nivel_servidor boolean DEFAULT false,
    requer_vigencia boolean DEFAULT false,
    requer_aprovacao boolean DEFAULT false,
    editavel_producao boolean DEFAULT true,
    nome varchar(100) NOT NULL,
    descricao text,
    valor_padrao jsonb,
    ativo boolean DEFAULT true,
    ordem integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

COMMENT ON TABLE public.config_parametros_meta IS 'Catálogo de metadados dos parâmetros. Define quais parâmetros existem, seus tipos e regras.';
COMMENT ON COLUMN public.config_parametros_meta.codigo IS 'Código único do parâmetro (ex: FREQ.JORNADA, FOLHA.SAL_MINIMO)';
COMMENT ON COLUMN public.config_parametros_meta.dominio IS 'Domínio funcional: INST=Institucional, CAL=Calendário, VF=Vida Funcional, FREQ=Frequência, FOLHA=Folha, DOC=Documentos';
COMMENT ON COLUMN public.config_parametros_meta.permite_nivel_instituicao IS 'Define se pode ser configurado no nível institucional';
COMMENT ON COLUMN public.config_parametros_meta.permite_nivel_unidade IS 'Define se pode ser configurado no nível de unidade';
COMMENT ON COLUMN public.config_parametros_meta.permite_nivel_tipo_servidor IS 'Define se pode ser configurado no nível de tipo de servidor';
COMMENT ON COLUMN public.config_parametros_meta.permite_nivel_servidor IS 'Define se pode ser configurado no nível de servidor individual';
COMMENT ON COLUMN public.config_parametros_meta.valor_padrao IS 'Valor fallback do sistema em JSON';

-- ============================================================================
-- 3. TABELA: config_parametros_valores
-- Armazena os valores dos parâmetros com hierarquia e vigência
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.config_parametros_valores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    instituicao_id uuid NOT NULL REFERENCES public.config_institucional(id),
    parametro_codigo varchar(100) NOT NULL REFERENCES public.config_parametros_meta(codigo),
    unidade_id uuid REFERENCES public.estrutura_organizacional(id),
    tipo_servidor varchar(50),
    servidor_id uuid REFERENCES public.servidores(id),
    valor jsonb NOT NULL,
    vigencia_inicio date NOT NULL DEFAULT CURRENT_DATE,
    vigencia_fim date,
    ativo boolean DEFAULT true,
    versao integer DEFAULT 1,
    versao_anterior_id uuid REFERENCES public.config_parametros_valores(id),
    justificativa text,
    created_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    updated_at timestamptz DEFAULT now(),
    updated_by uuid REFERENCES auth.users(id)
);

COMMENT ON TABLE public.config_parametros_valores IS 'Valores dos parâmetros por nível hierárquico e vigência. Suporta versionamento.';
COMMENT ON COLUMN public.config_parametros_valores.unidade_id IS 'Se preenchido, parâmetro aplica-se apenas a esta unidade';
COMMENT ON COLUMN public.config_parametros_valores.tipo_servidor IS 'Se preenchido, parâmetro aplica-se apenas a este tipo de servidor';
COMMENT ON COLUMN public.config_parametros_valores.servidor_id IS 'Se preenchido, parâmetro aplica-se apenas a este servidor';
COMMENT ON COLUMN public.config_parametros_valores.valor IS 'Valor do parâmetro em JSONB. Para simples: {"v": 123}. Para JSON: objeto completo.';
COMMENT ON COLUMN public.config_parametros_valores.versao_anterior_id IS 'Referência para a versão anterior (versionamento)';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_config_param_valores_instituicao ON public.config_parametros_valores(instituicao_id);
CREATE INDEX IF NOT EXISTS idx_config_param_valores_codigo ON public.config_parametros_valores(parametro_codigo);
CREATE INDEX IF NOT EXISTS idx_config_param_valores_vigencia ON public.config_parametros_valores(vigencia_inicio, vigencia_fim);
CREATE INDEX IF NOT EXISTS idx_config_param_valores_nivel ON public.config_parametros_valores(unidade_id, tipo_servidor, servidor_id);

-- ============================================================================
-- 4. FUNÇÃO: fn_calcular_nivel_parametro
-- Calcula o nível hierárquico de um registro de parâmetro
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_calcular_nivel_parametro(
    p_servidor_id uuid,
    p_tipo_servidor varchar,
    p_unidade_id uuid
)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_servidor_id IS NOT NULL THEN RETURN 4; END IF;
    IF p_tipo_servidor IS NOT NULL THEN RETURN 3; END IF;
    IF p_unidade_id IS NOT NULL THEN RETURN 2; END IF;
    RETURN 1;
END;
$$;

COMMENT ON FUNCTION public.fn_calcular_nivel_parametro IS 'Calcula o nível hierárquico de um parâmetro: 1=Instituição, 2=Unidade, 3=TipoServidor, 4=Servidor';

-- ============================================================================
-- 5. FUNÇÃO: obter_parametro_vigente
-- Função principal para resolver parâmetros com hierarquia e vigência
-- ============================================================================

CREATE OR REPLACE FUNCTION public.obter_parametro_vigente(
    p_instituicao_id uuid,
    p_parametro_codigo varchar,
    p_data_referencia date DEFAULT CURRENT_DATE,
    p_servidor_id uuid DEFAULT NULL,
    p_tipo_servidor varchar DEFAULT NULL,
    p_unidade_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_resultado jsonb;
    v_valor_padrao jsonb;
BEGIN
    -- Nível 4: Servidor individual
    IF p_servidor_id IS NOT NULL THEN
        SELECT valor INTO v_resultado
        FROM public.config_parametros_valores
        WHERE instituicao_id = p_instituicao_id
          AND parametro_codigo = p_parametro_codigo
          AND servidor_id = p_servidor_id
          AND ativo = true
          AND vigencia_inicio <= p_data_referencia
          AND (vigencia_fim IS NULL OR vigencia_fim >= p_data_referencia)
        ORDER BY vigencia_inicio DESC
        LIMIT 1;
        IF v_resultado IS NOT NULL THEN RETURN v_resultado; END IF;
    END IF;
    
    -- Nível 3: Tipo de servidor
    IF p_tipo_servidor IS NOT NULL THEN
        SELECT valor INTO v_resultado
        FROM public.config_parametros_valores
        WHERE instituicao_id = p_instituicao_id
          AND parametro_codigo = p_parametro_codigo
          AND tipo_servidor = p_tipo_servidor
          AND servidor_id IS NULL
          AND ativo = true
          AND vigencia_inicio <= p_data_referencia
          AND (vigencia_fim IS NULL OR vigencia_fim >= p_data_referencia)
        ORDER BY vigencia_inicio DESC
        LIMIT 1;
        IF v_resultado IS NOT NULL THEN RETURN v_resultado; END IF;
    END IF;
    
    -- Nível 2: Unidade
    IF p_unidade_id IS NOT NULL THEN
        SELECT valor INTO v_resultado
        FROM public.config_parametros_valores
        WHERE instituicao_id = p_instituicao_id
          AND parametro_codigo = p_parametro_codigo
          AND unidade_id = p_unidade_id
          AND tipo_servidor IS NULL
          AND servidor_id IS NULL
          AND ativo = true
          AND vigencia_inicio <= p_data_referencia
          AND (vigencia_fim IS NULL OR vigencia_fim >= p_data_referencia)
        ORDER BY vigencia_inicio DESC
        LIMIT 1;
        IF v_resultado IS NOT NULL THEN RETURN v_resultado; END IF;
    END IF;
    
    -- Nível 1: Instituição (padrão)
    SELECT valor INTO v_resultado
    FROM public.config_parametros_valores
    WHERE instituicao_id = p_instituicao_id
      AND parametro_codigo = p_parametro_codigo
      AND unidade_id IS NULL
      AND tipo_servidor IS NULL
      AND servidor_id IS NULL
      AND ativo = true
      AND vigencia_inicio <= p_data_referencia
      AND (vigencia_fim IS NULL OR vigencia_fim >= p_data_referencia)
    ORDER BY vigencia_inicio DESC
    LIMIT 1;
    IF v_resultado IS NOT NULL THEN RETURN v_resultado; END IF;
    
    -- Nível 0: Fallback do sistema (valor_padrao do metadado)
    SELECT valor_padrao INTO v_valor_padrao
    FROM public.config_parametros_meta
    WHERE codigo = p_parametro_codigo AND ativo = true;
    
    RETURN COALESCE(v_valor_padrao, '{}'::jsonb);
END;
$$;

COMMENT ON FUNCTION public.obter_parametro_vigente IS 'Resolve parâmetro por hierarquia (Servidor→TipoServidor→Unidade→Instituição→Fallback) considerando vigência temporal. Retorna JSONB.';

-- ============================================================================
-- 6. FUNÇÃO: obter_parametro_simples
-- Wrapper para extrair valor simples de parâmetro
-- ============================================================================

CREATE OR REPLACE FUNCTION public.obter_parametro_simples(
    p_instituicao_id uuid,
    p_parametro_codigo varchar,
    p_data_referencia date DEFAULT CURRENT_DATE,
    p_servidor_id uuid DEFAULT NULL,
    p_tipo_servidor varchar DEFAULT NULL,
    p_unidade_id uuid DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_json jsonb;
BEGIN
    v_json := public.obter_parametro_vigente(
        p_instituicao_id, p_parametro_codigo, p_data_referencia,
        p_servidor_id, p_tipo_servidor, p_unidade_id
    );
    IF v_json ? 'v' THEN RETURN v_json->>'v'; END IF;
    RETURN v_json::text;
END;
$$;

COMMENT ON FUNCTION public.obter_parametro_simples IS 'Wrapper que extrai valor simples de parâmetro. Para valores simples usa {"v": valor}.';

-- ============================================================================
-- 7. TRIGGER: Validar sobreposição de vigência
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_validar_vigencia_parametro()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_conflito boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM public.config_parametros_valores
        WHERE id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
          AND instituicao_id = NEW.instituicao_id
          AND parametro_codigo = NEW.parametro_codigo
          AND COALESCE(unidade_id::text, '') = COALESCE(NEW.unidade_id::text, '')
          AND COALESCE(tipo_servidor, '') = COALESCE(NEW.tipo_servidor, '')
          AND COALESCE(servidor_id::text, '') = COALESCE(NEW.servidor_id::text, '')
          AND ativo = true
          AND (
              (NEW.vigencia_inicio >= vigencia_inicio AND (vigencia_fim IS NULL OR NEW.vigencia_inicio <= vigencia_fim))
              OR (NEW.vigencia_fim IS NOT NULL AND NEW.vigencia_fim >= vigencia_inicio AND (vigencia_fim IS NULL OR NEW.vigencia_fim <= vigencia_fim))
              OR (NEW.vigencia_inicio <= vigencia_inicio AND (NEW.vigencia_fim IS NULL OR NEW.vigencia_fim >= COALESCE(vigencia_fim, '9999-12-31'::date)))
          )
    ) INTO v_conflito;
    
    IF v_conflito THEN
        RAISE EXCEPTION 'Conflito de vigência: já existe parâmetro ativo para este código/nível no período informado.';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_vigencia_parametro ON public.config_parametros_valores;
CREATE TRIGGER trg_validar_vigencia_parametro
    BEFORE INSERT OR UPDATE ON public.config_parametros_valores
    FOR EACH ROW EXECUTE FUNCTION public.fn_validar_vigencia_parametro();

-- ============================================================================
-- 8. TRIGGER: Impedir deleção física (apenas inativação)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_impedir_delecao_parametro()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RAISE EXCEPTION 'Deleção física não permitida. Use UPDATE SET ativo = false para inativar o parâmetro.';
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_impedir_delecao_parametro ON public.config_parametros_valores;
CREATE TRIGGER trg_impedir_delecao_parametro
    BEFORE DELETE ON public.config_parametros_valores
    FOR EACH ROW EXECUTE FUNCTION public.fn_impedir_delecao_parametro();

-- ============================================================================
-- 9. TRIGGER: Auditoria de alterações
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_audit_parametros()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.audit_logs (
        action, entity_type, entity_id, before_data, after_data,
        user_id, description, module_name
    ) VALUES (
        CASE TG_OP WHEN 'INSERT' THEN 'create'::audit_action WHEN 'UPDATE' THEN 'update'::audit_action ELSE 'delete'::audit_action END,
        'config_parametros_valores',
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        COALESCE(NEW.updated_by, NEW.created_by, OLD.updated_by, auth.uid()),
        'Alteração de parâmetro: ' || COALESCE(NEW.parametro_codigo, OLD.parametro_codigo),
        'config'
    );
    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_parametros ON public.config_parametros_valores;
CREATE TRIGGER trg_audit_parametros
    AFTER INSERT OR UPDATE ON public.config_parametros_valores
    FOR EACH ROW EXECUTE FUNCTION public.fn_audit_parametros();

-- ============================================================================
-- 10. TRIGGER: Atualizar updated_at automaticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_update_timestamp_parametros()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_timestamp_config_institucional ON public.config_institucional;
CREATE TRIGGER trg_update_timestamp_config_institucional
    BEFORE UPDATE ON public.config_institucional
    FOR EACH ROW EXECUTE FUNCTION public.fn_update_timestamp_parametros();

DROP TRIGGER IF EXISTS trg_update_timestamp_config_parametros ON public.config_parametros_valores;
CREATE TRIGGER trg_update_timestamp_config_parametros
    BEFORE UPDATE ON public.config_parametros_valores
    FOR EACH ROW EXECUTE FUNCTION public.fn_update_timestamp_parametros();

-- ============================================================================
-- 11. RLS POLICIES
-- ============================================================================

ALTER TABLE public.config_institucional ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_parametros_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_parametros_valores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "config_institucional_select" ON public.config_institucional;
CREATE POLICY "config_institucional_select" ON public.config_institucional FOR SELECT USING (true);

DROP POLICY IF EXISTS "config_institucional_all" ON public.config_institucional;
CREATE POLICY "config_institucional_all" ON public.config_institucional FOR ALL USING (public.usuario_eh_admin(auth.uid()));

DROP POLICY IF EXISTS "config_parametros_meta_select" ON public.config_parametros_meta;
CREATE POLICY "config_parametros_meta_select" ON public.config_parametros_meta FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "config_parametros_meta_all" ON public.config_parametros_meta;
CREATE POLICY "config_parametros_meta_all" ON public.config_parametros_meta FOR ALL USING (public.usuario_eh_admin(auth.uid()));

DROP POLICY IF EXISTS "config_parametros_valores_select" ON public.config_parametros_valores;
CREATE POLICY "config_parametros_valores_select" ON public.config_parametros_valores FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "config_parametros_valores_insert" ON public.config_parametros_valores;
CREATE POLICY "config_parametros_valores_insert" ON public.config_parametros_valores FOR INSERT TO authenticated 
    WITH CHECK (public.usuario_tem_permissao(auth.uid(), 'admin.config') OR public.usuario_eh_admin(auth.uid()));

DROP POLICY IF EXISTS "config_parametros_valores_update" ON public.config_parametros_valores;
CREATE POLICY "config_parametros_valores_update" ON public.config_parametros_valores FOR UPDATE TO authenticated 
    USING (public.usuario_tem_permissao(auth.uid(), 'admin.config') OR public.usuario_eh_admin(auth.uid()));