-- ============================================================================
-- CANAL DE DENÚNCIAS (módulo integridade) — tabela real + envio público
-- ============================================================================
-- Contexto: DenunciasPage.tsx (formulário público) e GestaoDenunciasPage.tsx
-- (painel administrativo) rodavam inteiramente sobre dados fictícios no
-- front-end — nenhuma denúncia enviada por um cidadão/servidor era
-- persistida. Esta migração cria a tabela real e a via de envio público.
--
-- Desenho de segurança:
--   - Denunciante (anônimo ou identificado) NUNCA grava direto na tabela.
--     Só pode chamar a função `registrar_denuncia_publica`, SECURITY DEFINER,
--     que valida os campos, gera o protocolo e força status='pendente' —
--     evita que alguém chamando a API diretamente (a anon key é pública)
--     grave um parecer, um responsável ou um status diferente de pendente.
--   - Leitura e tratamento (status/parecer) exigem a permissão
--     'integridade.gerenciar' (o mesmo código que já protege a rota
--     /integridade/gestao-denuncias em src/App.tsx), via
--     public.has_permission_code() — a função granular consolidada em
--     20260916120000_permissoes_granulares.sql.
--   - Não há política de SELECT para anon/authenticated genérico: nem o
--     próprio denunciante consegue listar denúncias (preserva o sigilo).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.denuncias (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo          text NOT NULL UNIQUE,
  tipo               text NOT NULL CHECK (tipo IN ('corrupcao', 'assedio', 'conflito', 'favorecimento', 'irregularidade', 'outro')),
  anonima            boolean NOT NULL DEFAULT true,
  nome_denunciante   text,
  email_denunciante  text,
  telefone_denunciante text,
  cargo_denunciante  text,
  envolvidos         text NOT NULL,
  data_ocorrencia    text NOT NULL,
  local_ocorrencia   text NOT NULL,
  descricao          text NOT NULL,
  evidencias         text,
  status             text NOT NULL DEFAULT 'pendente'
                       CHECK (status IN ('pendente', 'em_analise', 'em_investigacao', 'concluida', 'arquivada')),
  parecer            text,
  responsavel        text,
  atualizado_por     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_denuncias_status ON public.denuncias(status);
CREATE INDEX IF NOT EXISTS idx_denuncias_tipo ON public.denuncias(tipo);
CREATE INDEX IF NOT EXISTS idx_denuncias_created_at ON public.denuncias(created_at DESC);

COMMENT ON TABLE public.denuncias IS
  'Canal de denúncias do módulo integridade. Só é gravável via public.registrar_denuncia_publica(); leitura/tratamento exige integridade.gerenciar.';

DROP TRIGGER IF EXISTS update_denuncias_updated_at ON public.denuncias;
CREATE TRIGGER update_denuncias_updated_at
  BEFORE UPDATE ON public.denuncias
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.denuncias ENABLE ROW LEVEL SECURITY;

-- Leitura e tratamento restritos a quem administra o canal (mesma permissão
-- que já protege a rota /integridade/gestao-denuncias). Sem policy alguma
-- para anon/authenticated genérico — nem o denunciante lê de volta.
DROP POLICY IF EXISTS sel_denuncias_gerenciar ON public.denuncias;
CREATE POLICY sel_denuncias_gerenciar ON public.denuncias
  FOR SELECT TO authenticated
  USING (public.has_permission_code(auth.uid(), 'integridade.gerenciar'));

DROP POLICY IF EXISTS upd_denuncias_gerenciar ON public.denuncias;
CREATE POLICY upd_denuncias_gerenciar ON public.denuncias
  FOR UPDATE TO authenticated
  USING (public.has_permission_code(auth.uid(), 'integridade.gerenciar'))
  WITH CHECK (public.has_permission_code(auth.uid(), 'integridade.gerenciar'));

-- Sem policy de INSERT/DELETE para nenhuma role: todo envio passa pela RPC
-- abaixo (SECURITY DEFINER, bypassa RLS como dono da função); ninguém exclui
-- denúncia pelo client.

-- ============================================================================
-- Numeração de protocolo (DEN-<ano>-<sequencial>)
-- ============================================================================
CREATE SEQUENCE IF NOT EXISTS public.denuncias_protocolo_seq;

-- ============================================================================
-- RPC pública de envio — única via de escrita nesta tabela
-- ============================================================================
CREATE OR REPLACE FUNCTION public.registrar_denuncia_publica(
  p_anonima boolean,
  p_tipo text,
  p_envolvidos text,
  p_data_ocorrencia text,
  p_local_ocorrencia text,
  p_descricao text,
  p_evidencias text DEFAULT NULL,
  p_nome text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_telefone text DEFAULT NULL,
  p_cargo text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _protocolo text;
  _id uuid;
BEGIN
  IF p_tipo NOT IN ('corrupcao', 'assedio', 'conflito', 'favorecimento', 'irregularidade', 'outro') THEN
    RAISE EXCEPTION 'Tipo de denúncia inválido';
  END IF;

  IF coalesce(trim(p_envolvidos), '') = ''
     OR coalesce(trim(p_data_ocorrencia), '') = ''
     OR coalesce(trim(p_local_ocorrencia), '') = ''
     OR coalesce(trim(p_descricao), '') = '' THEN
    RAISE EXCEPTION 'Preencha todos os campos obrigatórios da denúncia';
  END IF;

  IF NOT p_anonima AND coalesce(trim(p_nome), '') = '' THEN
    RAISE EXCEPTION 'Informe seu nome ou selecione denúncia anônima';
  END IF;

  _protocolo := 'DEN-' || to_char(now(), 'YYYY') || '-' ||
                lpad(nextval('public.denuncias_protocolo_seq')::text, 4, '0');

  INSERT INTO public.denuncias (
    protocolo, tipo, anonima,
    nome_denunciante, email_denunciante, telefone_denunciante, cargo_denunciante,
    envolvidos, data_ocorrencia, local_ocorrencia, descricao, evidencias
  ) VALUES (
    _protocolo, p_tipo, p_anonima,
    CASE WHEN p_anonima THEN NULL ELSE nullif(trim(p_nome), '') END,
    CASE WHEN p_anonima THEN NULL ELSE nullif(trim(p_email), '') END,
    CASE WHEN p_anonima THEN NULL ELSE nullif(trim(p_telefone), '') END,
    CASE WHEN p_anonima THEN NULL ELSE nullif(trim(p_cargo), '') END,
    p_envolvidos, p_data_ocorrencia, p_local_ocorrencia, p_descricao, nullif(trim(p_evidencias), '')
  )
  RETURNING id INTO _id;

  BEGIN
    PERFORM public.log_audit(
      'create'::audit_action,
      'denuncia',
      _id,
      'integridade',
      NULL,
      NULL,
      'Nova denúncia registrada: ' || _protocolo,
      jsonb_build_object('protocolo', _protocolo, 'tipo', p_tipo, 'anonima', p_anonima)
    );
  EXCEPTION WHEN OTHERS THEN
    NULL; -- auditoria é best-effort; não pode bloquear o registro da denúncia
  END;

  RETURN _protocolo;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_denuncia_publica(boolean, text, text, text, text, text, text, text, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.registrar_denuncia_publica(boolean, text, text, text, text, text, text, text, text, text, text) TO anon, authenticated;
