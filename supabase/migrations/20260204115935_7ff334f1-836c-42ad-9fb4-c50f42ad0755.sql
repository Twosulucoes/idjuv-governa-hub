-- ============================================
-- SISTEMA DE ACESSO MODULAR POR USUÁRIO
-- ============================================

-- 1. Tabela de Módulos do Sistema (Catálogo)
CREATE TABLE public.modulos_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  descricao TEXT,
  icone TEXT,
  cor TEXT,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  prefixos_rota TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Acesso por Usuário
CREATE TABLE public.usuario_modulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  modulo_id UUID REFERENCES public.modulos_sistema(id) ON DELETE CASCADE NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, modulo_id)
);

-- 3. Flag de Restrição no Profile
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS restringir_modulos BOOLEAN DEFAULT false;

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX idx_usuario_modulos_user_id ON public.usuario_modulos(user_id) WHERE ativo = true;
CREATE INDEX idx_usuario_modulos_modulo_id ON public.usuario_modulos(modulo_id);
CREATE INDEX idx_modulos_sistema_codigo ON public.modulos_sistema(codigo);
CREATE INDEX idx_profiles_restringir_modulos ON public.profiles(id) WHERE restringir_modulos = true;

-- ============================================
-- RLS - MODULOS_SISTEMA
-- ============================================
ALTER TABLE public.modulos_sistema ENABLE ROW LEVEL SECURITY;

-- SELECT: Todos autenticados podem ver
CREATE POLICY "modulos_sistema_select_authenticated"
ON public.modulos_sistema FOR SELECT
TO authenticated
USING (true);

-- INSERT/UPDATE/DELETE: Apenas super_admin
CREATE POLICY "modulos_sistema_manage_super_admin"
ON public.modulos_sistema FOR ALL
TO authenticated
USING (public.usuario_eh_admin(auth.uid()))
WITH CHECK (public.usuario_eh_admin(auth.uid()));

-- ============================================
-- RLS - USUARIO_MODULOS
-- ============================================
ALTER TABLE public.usuario_modulos ENABLE ROW LEVEL SECURITY;

-- SELECT: Super admin ou o próprio usuário
CREATE POLICY "usuario_modulos_select"
ON public.usuario_modulos FOR SELECT
TO authenticated
USING (
  public.usuario_eh_admin(auth.uid()) 
  OR user_id = auth.uid()
  OR public.usuario_tem_permissao(auth.uid(), 'admin.usuarios')
);

-- INSERT/UPDATE/DELETE: Super admin ou admin.usuarios
CREATE POLICY "usuario_modulos_manage"
ON public.usuario_modulos FOR ALL
TO authenticated
USING (
  public.usuario_eh_admin(auth.uid()) 
  OR public.usuario_tem_permissao(auth.uid(), 'admin.usuarios')
)
WITH CHECK (
  public.usuario_eh_admin(auth.uid()) 
  OR public.usuario_tem_permissao(auth.uid(), 'admin.usuarios')
);

-- ============================================
-- FUNÇÃO PARA VERIFICAR ACESSO A MÓDULO
-- ============================================
CREATE OR REPLACE FUNCTION public.usuario_tem_acesso_modulo(
  _user_id UUID,
  _codigo_modulo TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Super admin tem acesso total
    CASE WHEN public.usuario_eh_admin(_user_id) THEN true
    -- Usuário sem restrição tem acesso total
    WHEN NOT COALESCE((SELECT restringir_modulos FROM public.profiles WHERE id = _user_id), false) THEN true
    -- Usuário com restrição: verificar se módulo está autorizado
    ELSE EXISTS (
      SELECT 1 
      FROM public.usuario_modulos um
      JOIN public.modulos_sistema ms ON ms.id = um.modulo_id
      WHERE um.user_id = _user_id 
        AND um.ativo = true
        AND ms.codigo = _codigo_modulo
        AND ms.ativo = true
    )
    END
$$;

-- ============================================
-- FUNÇÃO PARA VERIFICAR ACESSO POR ROTA
-- ============================================
CREATE OR REPLACE FUNCTION public.usuario_tem_acesso_rota(
  _user_id UUID,
  _pathname TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Super admin tem acesso total
    CASE WHEN public.usuario_eh_admin(_user_id) THEN true
    -- Usuário sem restrição tem acesso total
    WHEN NOT COALESCE((SELECT restringir_modulos FROM public.profiles WHERE id = _user_id), false) THEN true
    -- Usuário com restrição: verificar se algum módulo autorizado cobre a rota
    ELSE EXISTS (
      SELECT 1 
      FROM public.usuario_modulos um
      JOIN public.modulos_sistema ms ON ms.id = um.modulo_id
      WHERE um.user_id = _user_id 
        AND um.ativo = true
        AND ms.ativo = true
        AND EXISTS (
          SELECT 1 FROM unnest(ms.prefixos_rota) AS prefixo
          WHERE _pathname LIKE prefixo OR _pathname LIKE prefixo || '%'
        )
    )
    END
$$;

-- ============================================
-- POPULAR CATÁLOGO DE MÓDULOS
-- ============================================
INSERT INTO public.modulos_sistema (codigo, nome, descricao, icone, cor, ordem, prefixos_rota) VALUES
  ('admin', 'Administração', 'Configurações e gestão do sistema', 'Settings', 'slate', 1, ARRAY['/admin']),
  ('workflow', 'Processos', 'Fluxos de trabalho e aprovações', 'GitBranch', 'blue', 2, ARRAY['/workflow']),
  ('compras', 'Compras', 'Licitações e aquisições', 'ShoppingCart', 'green', 3, ARRAY['/processos/compras', '/licitacoes']),
  ('contratos', 'Contratos', 'Gestão de contratos e convênios', 'FileText', 'purple', 4, ARRAY['/processos/convenios', '/contratos']),
  ('rh', 'Recursos Humanos', 'Gestão de servidores e pessoal', 'Users', 'orange', 5, ARRAY['/rh']),
  ('orcamento', 'Orçamento/Financeiro', 'Gestão orçamentária e financeira', 'DollarSign', 'emerald', 6, ARRAY['/financeiro', '/folha', '/orcamento']),
  ('patrimonio', 'Patrimônio', 'Inventário e bens patrimoniais', 'Package', 'amber', 7, ARRAY['/inventario', '/patrimonio']),
  ('governanca', 'Governança', 'Estrutura organizacional e cargos', 'Building2', 'indigo', 8, ARRAY['/governanca', '/cargos', '/lotacoes', '/estrutura']),
  ('transparencia', 'Transparência', 'Portal de transparência pública', 'Eye', 'cyan', 9, ARRAY['/transparencia']),
  ('unidades', 'Unidades Locais', 'Gestão de espaços e unidades', 'MapPin', 'rose', 10, ARRAY['/unidades-locais']),
  ('federacoes', 'Federações Esportivas', 'Gestão de federações', 'Trophy', 'yellow', 11, ARRAY['/federacoes']),
  ('ascom', 'Comunicação', 'Assessoria de comunicação', 'Megaphone', 'pink', 12, ARRAY['/admin/ascom', '/ascom']),
  ('programas', 'Programas Sociais', 'Gestão de programas e projetos', 'Heart', 'red', 13, ARRAY['/programas'])
ON CONFLICT (codigo) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  icone = EXCLUDED.icone,
  cor = EXCLUDED.cor,
  ordem = EXCLUDED.ordem,
  prefixos_rota = EXCLUDED.prefixos_rota;