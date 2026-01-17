-- Atualizar RLS de reuniões para controle por perfil
-- Gestores só podem editar/deletar suas próprias reuniões
-- Presidência/Admin tem acesso total

-- Remover políticas antigas
DROP POLICY IF EXISTS "Usuários autenticados podem criar reuniões" ON public.reunioes;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar reuniões" ON public.reunioes;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar reuniões" ON public.reunioes;
DROP POLICY IF EXISTS "Usuários autenticados podem ver reuniões" ON public.reunioes;

-- Política de SELECT: todos autenticados podem ver todas reuniões
-- (presidência vê todas, gestores também veem todas para consulta)
CREATE POLICY "Usuários autenticados podem ver reuniões"
ON public.reunioes
FOR SELECT
TO authenticated
USING (true);

-- Política de INSERT: qualquer autenticado pode criar
-- (o created_by é preenchido automaticamente)
CREATE POLICY "Usuários autenticados podem criar reuniões"
ON public.reunioes
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política de UPDATE: admin/presidência pode atualizar qualquer uma
-- gestores só podem atualizar as que criaram
CREATE POLICY "Gestores podem atualizar suas reuniões ou admin todas"
ON public.reunioes
FOR UPDATE
TO authenticated
USING (
  -- Admin/presidência pode tudo
  public.is_admin_user(auth.uid())
  OR
  -- Criador pode editar sua própria reunião
  created_by = auth.uid()
);

-- Política de DELETE: admin/presidência pode deletar qualquer uma
-- gestores só podem deletar as que criaram
CREATE POLICY "Gestores podem deletar suas reuniões ou admin todas"
ON public.reunioes
FOR DELETE
TO authenticated
USING (
  -- Admin/presidência pode tudo
  public.is_admin_user(auth.uid())
  OR
  -- Criador pode deletar sua própria reunião
  created_by = auth.uid()
);

-- Adicionar coluna organizador_nome para facilitar relatórios
-- (já existe organizador_id, vamos adicionar trigger para preencher nome)

-- Trigger para preencher created_by automaticamente
CREATE OR REPLACE FUNCTION public.set_reuniao_created_by()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS tr_set_reuniao_created_by ON public.reunioes;
CREATE TRIGGER tr_set_reuniao_created_by
  BEFORE INSERT ON public.reunioes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_reuniao_created_by();

-- Atualizar RLS de participantes_reuniao
DROP POLICY IF EXISTS "Usuários autenticados podem gerenciar participantes" ON public.participantes_reuniao;
DROP POLICY IF EXISTS "Usuários autenticados podem ver participantes" ON public.participantes_reuniao;

-- SELECT: todos podem ver participantes de reuniões que podem ver
CREATE POLICY "Usuários autenticados podem ver participantes"
ON public.participantes_reuniao
FOR SELECT
TO authenticated
USING (true);

-- INSERT/UPDATE/DELETE: só quem pode editar a reunião pode gerenciar participantes
CREATE POLICY "Gerenciar participantes conforme permissão da reunião"
ON public.participantes_reuniao
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.reunioes r
    WHERE r.id = reuniao_id
    AND (
      public.is_admin_user(auth.uid())
      OR r.created_by = auth.uid()
    )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.reunioes r
    WHERE r.id = reuniao_id
    AND (
      public.is_admin_user(auth.uid())
      OR r.created_by = auth.uid()
    )
  )
);