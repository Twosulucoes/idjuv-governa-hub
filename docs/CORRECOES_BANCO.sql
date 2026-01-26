-- ============================================================
-- CORREÇÕES PARA O BANCO IDJUV
-- Execute no SQL Editor do seu Supabase
-- ============================================================

-- 1. Adicionar coluna 'codigo' na tabela perfis (se não existir)
ALTER TABLE public.perfis ADD COLUMN IF NOT EXISTS codigo VARCHAR(50);

-- 2. Atualizar códigos dos perfis existentes
UPDATE public.perfis SET codigo = 'super_admin' WHERE nome = 'Super Administrador';
UPDATE public.perfis SET codigo = 'admin' WHERE nome = 'Administrador';
UPDATE public.perfis SET codigo = 'gerente' WHERE nome = 'Gerente';
UPDATE public.perfis SET codigo = 'operador' WHERE nome = 'Operador';
UPDATE public.perfis SET codigo = 'consulta' WHERE nome = 'Consulta';

-- 3. Criar índice único para codigo
CREATE UNIQUE INDEX IF NOT EXISTS perfis_codigo_unique ON public.perfis(codigo);

-- 4. Atribuir perfil Super Admin ao usuário handfabiano@gmail.com
INSERT INTO public.usuario_perfis (user_id, perfil_id, ativo, data_inicio)
SELECT 
  pr.id as user_id,
  p.id as perfil_id,
  true as ativo,
  CURRENT_DATE as data_inicio
FROM public.profiles pr
CROSS JOIN public.perfis p
WHERE pr.email = 'handfabiano@gmail.com'
  AND p.nome = 'Super Administrador'
ON CONFLICT DO NOTHING;

-- 5. Verificar se todas as funções estão associadas ao Super Admin
INSERT INTO public.perfil_funcoes (perfil_id, funcao_id, concedido)
SELECT 
  (SELECT id FROM public.perfis WHERE nome = 'Super Administrador'),
  fs.id,
  true
FROM public.funcoes_sistema fs
WHERE NOT EXISTS (
  SELECT 1 FROM public.perfil_funcoes pf 
  WHERE pf.perfil_id = (SELECT id FROM public.perfis WHERE nome = 'Super Administrador')
    AND pf.funcao_id = fs.id
);

-- 6. Atualizar função usuario_eh_admin para usar a nova coluna codigo
CREATE OR REPLACE FUNCTION public.usuario_eh_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.usuario_perfis up
    JOIN public.perfis p ON up.perfil_id = p.id
    WHERE up.user_id = check_user_id
      AND up.ativo = true
      AND (up.data_fim IS NULL OR up.data_fim >= CURRENT_DATE)
      AND (p.codigo IN ('super_admin', 'admin') OR p.nome IN ('Super Administrador', 'Administrador'))
  );
END;
$$;

-- 7. Atualizar função listar_permissoes_usuario para retornar mais campos
CREATE OR REPLACE FUNCTION public.listar_permissoes_usuario(check_user_id UUID)
RETURNS TABLE(
  funcao_id UUID,
  funcao_codigo VARCHAR,
  funcao_nome VARCHAR,
  modulo VARCHAR,
  submodulo VARCHAR,
  tipo_acao VARCHAR,
  perfil_nome VARCHAR,
  rota VARCHAR,
  icone VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    f.id,
    f.codigo,
    f.nome,
    f.modulo,
    f.submodulo,
    f.tipo_acao,
    p.nome as perfil_nome,
    f.rota,
    f.icone
  FROM public.usuario_perfis up
  JOIN public.perfis p ON up.perfil_id = p.id
  JOIN public.perfil_funcoes pf ON p.id = pf.perfil_id
  JOIN public.funcoes_sistema f ON pf.funcao_id = f.id
  WHERE up.user_id = check_user_id
    AND up.ativo = true
    AND (up.data_fim IS NULL OR up.data_fim >= CURRENT_DATE)
    AND pf.concedido = true
    AND f.ativo = true
  ORDER BY f.modulo, f.submodulo, f.ordem;
END;
$$;

-- 8. Verificar resultado
SELECT 
  pr.email,
  pr.full_name,
  p.nome as perfil,
  p.codigo as codigo_perfil
FROM public.usuario_perfis up
JOIN public.profiles pr ON pr.id = up.user_id
JOIN public.perfis p ON p.id = up.perfil_id
WHERE up.ativo = true;
