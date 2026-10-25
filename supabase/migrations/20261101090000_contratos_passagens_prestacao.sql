-- ============================================================================
-- CONTRATOS — Passagens aéreas, entrega 2: prestação de contas, anexos privados e pendências
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-24-contratos-passagens-aereas-design.md (§4)
-- Plano: docs/superpowers/plans/2026-10-25-contratos-passagens-entrega2.md
--
--   passagem_pedidos       + motivo da dispensa (obrigatório no modo "dispensado"), responsável da delegação e
--                            relatório único do evento (data e nº do documento SEI).
--   passagem_passageiros   + cartão de embarque entregue, relatório individual (data e nº SEI) e dispensa com motivo.
--   passagem_anexos        cartão de embarque, bilhete, relatório e outros; o arquivo fica no bucket privado
--                          `passagens`, em <pedido_id>/...
--   passagem_relatorio_rh  situação do relatório de viagem do RH dos passageiros servidores (só isso do RH).
--   passagem_viagens_servidor passa a trazer também a situação do relatório.
--
-- Leitura: módulo contratos E contratos.passagens.visualizar (ou editar); escrita e exclusão: contratos.passagens.editar.
-- O prazo da prestação (5 dias corridos depois do último voo) fica em module_settings (contratos), lido pelo front.
-- Idempotente (IF NOT EXISTS, CREATE OR REPLACE, DROP/CREATE de policies e gatilhos).
-- ============================================================================

SET lock_timeout = '10s';

-- ----------------------------------------------------------------------------
-- 1. Colunas da prestação de contas
-- ----------------------------------------------------------------------------
ALTER TABLE public.passagem_pedidos
  ADD COLUMN IF NOT EXISTS prestacao_dispensa_motivo text CHECK (char_length(prestacao_dispensa_motivo) <= 1000),
  ADD COLUMN IF NOT EXISTS responsavel_passageiro_id uuid REFERENCES public.passagem_passageiros(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS relatorio_evento_entregue_em date,
  ADD COLUMN IF NOT EXISTS relatorio_evento_documento_sei text CHECK (char_length(relatorio_evento_documento_sei) <= 60);
COMMENT ON COLUMN public.passagem_pedidos.prestacao_dispensa_motivo IS 'Por que o pedido não tem relatório (modo dispensado).';
COMMENT ON COLUMN public.passagem_pedidos.responsavel_passageiro_id IS 'Passageiro que entrega o relatório único do evento.';
COMMENT ON COLUMN public.passagem_pedidos.relatorio_evento_entregue_em IS 'Entrega do relatório único do evento (modo evento).';

-- Pedido dispensado antes desta migração (a entrega 1 não pedia o motivo).
UPDATE public.passagem_pedidos
   SET prestacao_dispensa_motivo = 'Não informado (registro anterior à prestação de contas)'
 WHERE prestacao_contas = 'dispensado' AND char_length(btrim(coalesce(prestacao_dispensa_motivo, ''))) < 3;

ALTER TABLE public.passagem_pedidos DROP CONSTRAINT IF EXISTS passagem_pedidos_dispensa_check;
ALTER TABLE public.passagem_pedidos ADD CONSTRAINT passagem_pedidos_dispensa_check
  CHECK (prestacao_contas <> 'dispensado' OR char_length(btrim(coalesce(prestacao_dispensa_motivo, ''))) >= 3);

ALTER TABLE public.passagem_passageiros
  ADD COLUMN IF NOT EXISTS embarque_entregue_em date,
  ADD COLUMN IF NOT EXISTS relatorio_entregue_em date,
  ADD COLUMN IF NOT EXISTS relatorio_documento_sei text CHECK (char_length(relatorio_documento_sei) <= 60),
  ADD COLUMN IF NOT EXISTS prestacao_dispensada boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS prestacao_dispensa_motivo text CHECK (char_length(prestacao_dispensa_motivo) <= 1000);
COMMENT ON COLUMN public.passagem_passageiros.embarque_entregue_em IS 'Entrega do(s) cartão(ões) de embarque.';
COMMENT ON COLUMN public.passagem_passageiros.relatorio_entregue_em IS 'Entrega do relatório individual (modo individual).';
COMMENT ON COLUMN public.passagem_passageiros.prestacao_dispensada IS 'Passageiro dispensado da prestação (ex.: não viajou).';

ALTER TABLE public.passagem_passageiros DROP CONSTRAINT IF EXISTS passagem_passageiros_dispensa_check;
ALTER TABLE public.passagem_passageiros ADD CONSTRAINT passagem_passageiros_dispensa_check
  CHECK (NOT prestacao_dispensada OR char_length(btrim(coalesce(prestacao_dispensa_motivo, ''))) >= 3);

-- O responsável da delegação é passageiro do próprio pedido.
CREATE OR REPLACE FUNCTION public.passagem_conferir_responsavel()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.responsavel_passageiro_id IS NOT NULL AND NOT EXISTS (
     SELECT 1 FROM public.passagem_passageiros p WHERE p.id = NEW.responsavel_passageiro_id AND p.pedido_id = NEW.id) THEN
    RAISE EXCEPTION 'O responsável da delegação precisa ser passageiro deste pedido.' USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.passagem_conferir_responsavel() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_passagem_pedidos_responsavel ON public.passagem_pedidos;
CREATE TRIGGER trg_passagem_pedidos_responsavel BEFORE INSERT OR UPDATE OF responsavel_passageiro_id ON public.passagem_pedidos
  FOR EACH ROW EXECUTE FUNCTION public.passagem_conferir_responsavel();

-- ----------------------------------------------------------------------------
-- 2. Anexos (a linha aqui, o arquivo no bucket privado `passagens`)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.passagem_anexos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.passagem_pedidos(id) ON DELETE CASCADE,
  passageiro_id uuid REFERENCES public.passagem_passageiros(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('cartao_embarque', 'bilhete', 'relatorio', 'outro')),
  caminho text NOT NULL UNIQUE CHECK (char_length(caminho) <= 500),
  nome_arquivo text NOT NULL CHECK (char_length(btrim(nome_arquivo)) BETWEEN 1 AND 255),
  tamanho_bytes bigint CHECK (tamanho_bytes >= 0),
  mime_type text CHECK (char_length(mime_type) <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  CONSTRAINT passagem_anexos_caminho_pedido_check CHECK (caminho LIKE pedido_id::text || '/%')
);
COMMENT ON TABLE public.passagem_anexos IS
  'Anexos das passagens (cartão de embarque, bilhete, relatório): o arquivo fica no bucket privado passagens, em <pedido_id>/...';
CREATE INDEX IF NOT EXISTS passagem_anexos_pedido_idx ON public.passagem_anexos (pedido_id);
CREATE INDEX IF NOT EXISTS passagem_anexos_passageiro_idx ON public.passagem_anexos (passageiro_id);
CREATE INDEX IF NOT EXISTS passagem_anexos_created_by_idx ON public.passagem_anexos (created_by);
CREATE INDEX IF NOT EXISTS passagem_anexos_updated_by_idx ON public.passagem_anexos (updated_by);
ALTER TABLE public.passagem_anexos ENABLE ROW LEVEL SECURITY;

-- O passageiro do anexo é do mesmo pedido; caminho e pedido não mudam depois de gravados; anexo de pedido concluído
-- não se apaga (é a prova da prestação de contas).
CREATE OR REPLACE FUNCTION public.passagem_conferir_anexo()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF EXISTS (SELECT 1 FROM public.passagem_pedidos p WHERE p.id = OLD.pedido_id AND p.situacao = 'concluido') THEN
      RAISE EXCEPTION 'Pedido concluído: o anexo da prestação de contas não se apaga.' USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' AND (NEW.caminho, NEW.pedido_id) IS DISTINCT FROM (OLD.caminho, OLD.pedido_id) THEN
    RAISE EXCEPTION 'O arquivo e o pedido do anexo não mudam: apague e anexe de novo.' USING ERRCODE = '42501';
  END IF;
  IF NEW.passageiro_id IS NOT NULL AND NOT EXISTS (
     SELECT 1 FROM public.passagem_passageiros p WHERE p.id = NEW.passageiro_id AND p.pedido_id = NEW.pedido_id) THEN
    RAISE EXCEPTION 'O passageiro do anexo não é deste pedido.' USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.passagem_conferir_anexo() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_passagem_anexos_carimbar ON public.passagem_anexos;
CREATE TRIGGER trg_passagem_anexos_carimbar BEFORE INSERT OR UPDATE ON public.passagem_anexos
  FOR EACH ROW EXECUTE FUNCTION public.passagem_carimbar();
DROP TRIGGER IF EXISTS trg_passagem_anexos_conferir ON public.passagem_anexos;
CREATE TRIGGER trg_passagem_anexos_conferir BEFORE INSERT OR UPDATE OR DELETE ON public.passagem_anexos
  FOR EACH ROW EXECUTE FUNCTION public.passagem_conferir_anexo();

-- ----------------------------------------------------------------------------
-- 3. Trilha: a prestação de contas também entra no histórico
-- ----------------------------------------------------------------------------
ALTER TABLE public.passagem_historico DROP CONSTRAINT IF EXISTS passagem_historico_acao_check;
ALTER TABLE public.passagem_historico ADD CONSTRAINT passagem_historico_acao_check
  CHECK (acao IN ('pedido_criado', 'pedido_situacao', 'trecho_situacao', 'prestacao_pedido', 'prestacao_passageiro',
                  'anexo_incluido', 'anexo_removido'));

CREATE OR REPLACE FUNCTION public.passagem_registrar_prestacao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_TABLE_NAME = 'passagem_passageiros' THEN
    IF (NEW.embarque_entregue_em, NEW.relatorio_entregue_em, NEW.relatorio_documento_sei, NEW.prestacao_dispensada,
        NEW.prestacao_dispensa_motivo)
       IS DISTINCT FROM
       (OLD.embarque_entregue_em, OLD.relatorio_entregue_em, OLD.relatorio_documento_sei, OLD.prestacao_dispensada,
        OLD.prestacao_dispensa_motivo) THEN
      INSERT INTO public.passagem_historico (pedido_id, acao, antes, depois, feito_por)
      VALUES (NEW.pedido_id, 'prestacao_passageiro',
              jsonb_build_object('embarque_entregue_em', OLD.embarque_entregue_em, 'relatorio_entregue_em', OLD.relatorio_entregue_em,
                                 'prestacao_dispensada', OLD.prestacao_dispensada),
              jsonb_build_object('passageiro', NEW.nome, 'embarque_entregue_em', NEW.embarque_entregue_em,
                                 'relatorio_entregue_em', NEW.relatorio_entregue_em, 'relatorio_documento_sei', NEW.relatorio_documento_sei,
                                 'prestacao_dispensada', NEW.prestacao_dispensada, 'prestacao_dispensa_motivo', NEW.prestacao_dispensa_motivo),
              auth.uid());
    END IF;
  ELSIF (NEW.prestacao_contas, NEW.prestacao_dispensa_motivo, NEW.responsavel_passageiro_id, NEW.relatorio_evento_entregue_em,
         NEW.relatorio_evento_documento_sei)
        IS DISTINCT FROM
        (OLD.prestacao_contas, OLD.prestacao_dispensa_motivo, OLD.responsavel_passageiro_id, OLD.relatorio_evento_entregue_em,
         OLD.relatorio_evento_documento_sei) THEN
    INSERT INTO public.passagem_historico (pedido_id, acao, antes, depois, feito_por)
    VALUES (NEW.id, 'prestacao_pedido',
            jsonb_build_object('prestacao_contas', OLD.prestacao_contas, 'relatorio_evento_entregue_em', OLD.relatorio_evento_entregue_em),
            jsonb_build_object('prestacao_contas', NEW.prestacao_contas, 'prestacao_dispensa_motivo', NEW.prestacao_dispensa_motivo,
                               'relatorio_evento_entregue_em', NEW.relatorio_evento_entregue_em,
                               'relatorio_evento_documento_sei', NEW.relatorio_evento_documento_sei),
            auth.uid());
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.passagem_registrar_prestacao() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_passagem_passageiros_prestacao ON public.passagem_passageiros;
CREATE TRIGGER trg_passagem_passageiros_prestacao AFTER UPDATE ON public.passagem_passageiros
  FOR EACH ROW EXECUTE FUNCTION public.passagem_registrar_prestacao();
DROP TRIGGER IF EXISTS trg_passagem_pedidos_prestacao ON public.passagem_pedidos;
CREATE TRIGGER trg_passagem_pedidos_prestacao AFTER UPDATE ON public.passagem_pedidos
  FOR EACH ROW EXECUTE FUNCTION public.passagem_registrar_prestacao();

-- Anexo incluído ou removido entra na trilha (tipo, passageiro e nome do arquivo; nunca o conteúdo).
CREATE OR REPLACE FUNCTION public.passagem_registrar_anexo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a public.passagem_anexos := CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
BEGIN
  IF EXISTS (SELECT 1 FROM public.passagem_pedidos p WHERE p.id = a.pedido_id) THEN
    INSERT INTO public.passagem_historico (pedido_id, acao, antes, depois, feito_por)
    VALUES (a.pedido_id, CASE WHEN TG_OP = 'DELETE' THEN 'anexo_removido' ELSE 'anexo_incluido' END, NULL,
            jsonb_build_object('tipo', a.tipo, 'nome_arquivo', a.nome_arquivo,
                               'passageiro', (SELECT nome FROM public.passagem_passageiros WHERE id = a.passageiro_id)),
            auth.uid());
  END IF;
  RETURN NULL;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.passagem_registrar_anexo() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_passagem_anexos_trilha ON public.passagem_anexos;
CREATE TRIGGER trg_passagem_anexos_trilha AFTER INSERT OR DELETE ON public.passagem_anexos
  FOR EACH ROW EXECUTE FUNCTION public.passagem_registrar_anexo();

-- Concluir só com a prestação em dia (a mesma regra de src/lib/passagens/prestacao.ts, sem olhar a data), e a
-- prestação de pedido concluído não muda mais. Cartão: todo passageiro não dispensado com bilhete ativo. Relatório:
-- individual, de cada um (vale o apresentado na viagem do RH ligada); evento, o único do pedido.
CREATE OR REPLACE FUNCTION public.passagem_prestacao_em_aberto(_pedido_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH viajam AS (
    SELECT p.* FROM public.passagem_passageiros p
     WHERE p.pedido_id = _pedido_id AND NOT p.prestacao_dispensada
       AND EXISTS (SELECT 1 FROM public.passagem_trechos t
                    WHERE t.passageiro_id = p.id AND t.localizador IS NOT NULL
                      AND t.situacao NOT IN ('cancelado', 'reembolsado'))
  )
  SELECT (SELECT count(*) FROM viajam WHERE embarque_entregue_em IS NULL)::int
       + (SELECT count(*) FROM viajam v, public.passagem_pedidos pd
           WHERE pd.id = _pedido_id AND pd.prestacao_contas = 'individual' AND v.relatorio_entregue_em IS NULL
             AND NOT EXISTS (SELECT 1 FROM public.viagens_diarias d
                              WHERE d.id = v.viagem_id AND d.servidor_id = v.servidor_id AND d.relatorio_apresentado))::int
       + (SELECT count(*) FROM public.passagem_pedidos pd
           WHERE pd.id = _pedido_id AND pd.prestacao_contas = 'evento' AND pd.relatorio_evento_entregue_em IS NULL
             AND EXISTS (SELECT 1 FROM viajam))::int;
$$;
REVOKE EXECUTE ON FUNCTION public.passagem_prestacao_em_aberto(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.passagem_conferir_conclusao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n int;
BEGIN
  IF TG_TABLE_NAME = 'passagem_passageiros' THEN
    IF (NEW.embarque_entregue_em, NEW.relatorio_entregue_em, NEW.relatorio_documento_sei, NEW.prestacao_dispensada,
        NEW.prestacao_dispensa_motivo)
       IS DISTINCT FROM
       (OLD.embarque_entregue_em, OLD.relatorio_entregue_em, OLD.relatorio_documento_sei, OLD.prestacao_dispensada,
        OLD.prestacao_dispensa_motivo)
       AND EXISTS (SELECT 1 FROM public.passagem_pedidos p WHERE p.id = NEW.pedido_id AND p.situacao = 'concluido') THEN
      RAISE EXCEPTION 'Pedido concluído: a prestação de contas não muda mais.' USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;
  IF OLD.situacao = 'concluido'
     AND (NEW.prestacao_contas, NEW.prestacao_dispensa_motivo, NEW.responsavel_passageiro_id,
          NEW.relatorio_evento_entregue_em, NEW.relatorio_evento_documento_sei)
         IS DISTINCT FROM
         (OLD.prestacao_contas, OLD.prestacao_dispensa_motivo, OLD.responsavel_passageiro_id,
          OLD.relatorio_evento_entregue_em, OLD.relatorio_evento_documento_sei) THEN
    RAISE EXCEPTION 'Pedido concluído: a prestação de contas não muda mais.' USING ERRCODE = '42501';
  END IF;
  IF NEW.situacao = 'concluido' AND OLD.situacao IS DISTINCT FROM 'concluido' THEN
    n := public.passagem_prestacao_em_aberto(NEW.id);
    IF n > 0 THEN
      RAISE EXCEPTION 'Prestação de contas em aberto (% item(ns)): registre a entrega ou a dispensa antes de concluir.', n
        USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.passagem_conferir_conclusao() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_passagem_pedidos_conclusao ON public.passagem_pedidos;
CREATE TRIGGER trg_passagem_pedidos_conclusao BEFORE UPDATE ON public.passagem_pedidos
  FOR EACH ROW EXECUTE FUNCTION public.passagem_conferir_conclusao();
DROP TRIGGER IF EXISTS trg_passagem_passageiros_conclusao ON public.passagem_passageiros;
CREATE TRIGGER trg_passagem_passageiros_conclusao BEFORE UPDATE ON public.passagem_passageiros
  FOR EACH ROW EXECUTE FUNCTION public.passagem_conferir_conclusao();

-- ----------------------------------------------------------------------------
-- 4. Relatório de viagem do RH (só a situação, para quem lê passagens)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.passagem_relatorio_rh(_passageiro_ids uuid[])
RETURNS TABLE (passageiro_id uuid, relatorio_apresentado boolean, relatorio_data date)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.can_access_module(auth.uid(), 'contratos')
          AND (public.has_permission_code(auth.uid(), 'contratos.passagens.visualizar')
               OR public.has_permission_code(auth.uid(), 'contratos.passagens.editar'))) THEN
    RAISE EXCEPTION 'Requer a permissão de ver passagens.' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT p.id, COALESCE(v.relatorio_apresentado, false), v.relatorio_data
    FROM public.passagem_passageiros p
    JOIN public.viagens_diarias v ON v.id = p.viagem_id AND v.servidor_id = p.servidor_id
   WHERE p.id = ANY (_passageiro_ids);
END;
$$;
REVOKE ALL ON FUNCTION public.passagem_relatorio_rh(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.passagem_relatorio_rh(uuid[]) TO authenticated;

-- Viagens do RH de um servidor, agora com a situação do relatório (muda o tipo de retorno: DROP e CREATE).
DROP FUNCTION IF EXISTS public.passagem_viagens_servidor(uuid);
CREATE FUNCTION public.passagem_viagens_servidor(_servidor_id uuid)
RETURNS TABLE (id uuid, destino text, data_saida date, data_retorno date, status text,
               relatorio_apresentado boolean, relatorio_data date)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.can_access_module(auth.uid(), 'contratos')
          AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar')) THEN
    RAISE EXCEPTION 'Requer a permissão de editar passagens.' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT v.id, v.destino_cidade || '/' || v.destino_uf, v.data_saida, v.data_retorno, v.status,
         COALESCE(v.relatorio_apresentado, false), v.relatorio_data
    FROM public.viagens_diarias v
   WHERE v.servidor_id = _servidor_id AND v.status <> 'cancelada'
   ORDER BY v.data_saida DESC
   LIMIT 30;
END;
$$;
REVOKE ALL ON FUNCTION public.passagem_viagens_servidor(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.passagem_viagens_servidor(uuid) TO authenticated;

-- ----------------------------------------------------------------------------
-- 5. Bucket privado `passagens` (mesmo texto de supabase/baseline/overlay/50_storage.sql)
-- ----------------------------------------------------------------------------
-- Objeto em <pedido_id>/<passageiro_id ou "pedido">/<uuid>-<nome>. Ler: módulo contratos E visualizar ou editar.
-- Enviar e apagar: módulo E editar, e o pedido tem de existir. Sem UPDATE (trocar = apagar e enviar de novo). Sem
-- leitura pública: o front baixa por URL assinada de curta duração.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('passagens', 'passagens', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "st_passagens_select" ON storage.objects;
CREATE POLICY "st_passagens_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'passagens' AND public.can_access_module(auth.uid(), 'contratos')
         AND (public.has_permission_code(auth.uid(), 'contratos.passagens.visualizar')
              OR public.has_permission_code(auth.uid(), 'contratos.passagens.editar')));
DROP POLICY IF EXISTS "st_passagens_insert" ON storage.objects;
CREATE POLICY "st_passagens_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'passagens' AND public.can_access_module(auth.uid(), 'contratos')
              AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar')
              AND name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/'
              AND EXISTS (SELECT 1 FROM public.passagem_pedidos p WHERE p.id::text = left(objects.name, 36)));
DROP POLICY IF EXISTS "st_passagens_update" ON storage.objects;
DROP POLICY IF EXISTS "st_passagens_delete" ON storage.objects;
CREATE POLICY "st_passagens_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'passagens' AND public.can_access_module(auth.uid(), 'contratos')
         AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'));

-- ----------------------------------------------------------------------------
-- 6. RLS de passagem_anexos (gerado de supabase/baseline/rls/mapa.csv por scripts/db/gerar-rls.mjs)
-- ----------------------------------------------------------------------------
-- passagem_anexos  [permissao: contratos]
DROP POLICY IF EXISTS "rls_select" ON public.passagem_anexos;
CREATE POLICY "rls_select" ON public.passagem_anexos FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'contratos')) AND (public.has_permission_code(auth.uid(), 'contratos.passagens.visualizar') OR public.has_permission_code(auth.uid(), 'contratos.passagens.editar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.passagem_anexos;
CREATE POLICY "rls_insert" ON public.passagem_anexos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'));
DROP POLICY IF EXISTS "rls_update" ON public.passagem_anexos;
CREATE POLICY "rls_update" ON public.passagem_anexos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'));
DROP POLICY IF EXISTS "rls_delete" ON public.passagem_anexos;
CREATE POLICY "rls_delete" ON public.passagem_anexos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'));

