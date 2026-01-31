
-- =============================================
-- CORREÇÃO RLS: Tabela registros_ponto
-- Permitir que RH (com permissão rh.frequencia.editar) lance faltas
-- =============================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Usuários podem ver próprio ponto" ON public.registros_ponto;
DROP POLICY IF EXISTS "Usuários podem inserir próprio ponto" ON public.registros_ponto;
DROP POLICY IF EXISTS "Usuários podem atualizar próprio ponto não aprovado" ON public.registros_ponto;

-- =============================================
-- NOVAS POLÍTICAS (padrão granular)
-- =============================================

-- SELECT: Servidor vê próprio ou admin/RH vê todos
CREATE POLICY "registros_ponto_select"
ON public.registros_ponto FOR SELECT TO authenticated
USING (
  -- Super admin vê tudo
  public.usuario_eh_super_admin(auth.uid())
  OR
  -- Usuário com permissão de visualizar frequência
  public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.visualizar')
  OR
  -- Usuário com permissão de editar frequência
  public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.editar')
  OR
  -- Servidor vê apenas seus próprios registros (self-access via profiles)
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.servidor_id = registros_ponto.servidor_id
  )
);

-- INSERT: RH pode inserir para qualquer servidor, servidor pode inserir próprio
CREATE POLICY "registros_ponto_insert"
ON public.registros_ponto FOR INSERT TO authenticated
WITH CHECK (
  -- Super admin pode inserir para qualquer um
  public.usuario_eh_super_admin(auth.uid())
  OR
  -- Usuário com permissão de editar frequência pode inserir para qualquer um
  public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.editar')
  OR
  -- Servidor pode inserir apenas seus próprios registros (self-access via profiles)
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.servidor_id = registros_ponto.servidor_id
  )
);

-- UPDATE: RH pode atualizar qualquer registro, servidor pode atualizar próprio (se não aprovado)
CREATE POLICY "registros_ponto_update"
ON public.registros_ponto FOR UPDATE TO authenticated
USING (
  -- Super admin pode atualizar qualquer um
  public.usuario_eh_super_admin(auth.uid())
  OR
  -- Usuário com permissão de editar frequência pode atualizar qualquer um
  public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.editar')
  OR
  -- Servidor pode atualizar próprios registros não aprovados (self-access via profiles)
  (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.servidor_id = registros_ponto.servidor_id
    )
    AND (aprovado IS NULL OR aprovado = false)
  )
);

-- DELETE: Apenas super admin ou RH com permissão
CREATE POLICY "registros_ponto_delete"
ON public.registros_ponto FOR DELETE TO authenticated
USING (
  public.usuario_eh_super_admin(auth.uid())
  OR
  public.usuario_tem_permissao(auth.uid(), 'rh.frequencia.editar')
);
