-- ============================================
-- ATUALIZAÇÃO RLS PARA ACESSO PÚBLICO ASCOM
-- ============================================

-- Remover policies existentes para recriar
DROP POLICY IF EXISTS "Usuários autenticados podem criar demandas" ON public.demandas_ascom;
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar demandas" ON public.demandas_ascom;
DROP POLICY IF EXISTS "ASCOM e Admin podem atualizar demandas" ON public.demandas_ascom;

-- Policy para INSERT público (qualquer pessoa pode criar solicitação)
CREATE POLICY "Qualquer pessoa pode criar solicitação pública"
ON public.demandas_ascom
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policy para SELECT público por número de protocolo (consulta pública)
CREATE POLICY "Consulta pública por protocolo"
ON public.demandas_ascom
FOR SELECT
TO anon
USING (numero_demanda IS NOT NULL);

-- Policy para SELECT autenticado (equipe interna vê tudo)
CREATE POLICY "Usuários autenticados visualizam demandas"
ON public.demandas_ascom
FOR SELECT
TO authenticated
USING (true);

-- Policy para UPDATE (apenas equipe interna)
CREATE POLICY "Equipe interna pode atualizar demandas"
ON public.demandas_ascom
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'ascom'::app_role) OR 
  has_role(auth.uid(), 'presidencia'::app_role) OR
  auth.uid() = created_by
);

-- Adicionar campo para link do drive nos entregáveis
ALTER TABLE public.demandas_ascom_entregaveis 
ADD COLUMN IF NOT EXISTS link_drive TEXT;

-- Adicionar campo de email do solicitante para notificações (solicitações públicas)
ALTER TABLE public.demandas_ascom 
ADD COLUMN IF NOT EXISTS email_solicitante TEXT;

-- Adicionar campo de telefone do solicitante
ALTER TABLE public.demandas_ascom 
ADD COLUMN IF NOT EXISTS telefone_solicitante TEXT;

-- Policies para anexos - permitir leitura pública
DROP POLICY IF EXISTS "Anexos visíveis para todos" ON public.demandas_ascom_anexos;
CREATE POLICY "Anexos visíveis para todos"
ON public.demandas_ascom_anexos
FOR SELECT
TO anon, authenticated
USING (true);

-- Policy para inserir anexos (público pode anexar na criação)
DROP POLICY IF EXISTS "Usuários podem criar anexos" ON public.demandas_ascom_anexos;
CREATE POLICY "Qualquer pessoa pode criar anexos"
ON public.demandas_ascom_anexos
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Policies para entregáveis - leitura pública
DROP POLICY IF EXISTS "Entregáveis visíveis para equipe" ON public.demandas_ascom_entregaveis;
CREATE POLICY "Entregáveis visíveis para todos"
ON public.demandas_ascom_entregaveis
FOR SELECT
TO anon, authenticated
USING (true);

-- Policies para comentários - apenas visíveis ao solicitante
DROP POLICY IF EXISTS "Comentários visíveis para equipe" ON public.demandas_ascom_comentarios;
CREATE POLICY "Comentários públicos visíveis"
ON public.demandas_ascom_comentarios
FOR SELECT
TO anon, authenticated
USING (visivel_solicitante = true OR auth.uid() IS NOT NULL);