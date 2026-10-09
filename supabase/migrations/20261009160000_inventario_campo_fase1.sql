-- ============================================================================
-- Inventário de campo — fase 1 (módulos patrimonio / patrimonio_mobile)
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-09-inventario-campo-fase1.md (seção "Banco").
--
--   1. unidades_locais ganha geometria (ponto, polígono GeoJSON, áreas, origem da geometria).
--      As policies existentes da tabela cobrem as colunas novas (não são alteradas aqui).
--   2. campanhas_inventario_unidades: situação de cada unidade numa campanha. Complementa
--      campanhas_inventario.unidades_abrangidas (não substitui nem migra).
--   3. fotos_vistoria_inventario: evidência fotográfica da vistoria. O `id` é gerado no celular
--      (chave de idempotência da fila offline). Depois de gravada, só legenda, tem_pessoa e
--      codigo_objeto mudam (trigger); editar exige ser o autor ou ter patrimonio.tramitar.
--   4. Bucket PRIVADO inventario-evidencias (10 MB, jpeg/webp), leitura por URL assinada.
--
-- RLS (mesmos nomes/expressões do baseline, supabase/baseline/rls/mapa.csv):
--   campanhas_inventario_unidades  classe `modulo` (patrimonio | patrimonio_mobile)
--   fotos_vistoria_inventario      classe `preservar`: as policies abaixo SÃO o desenho
--                                  (INSERT exige usuario_id = auth.uid(); UPDATE só do autor ou com
--                                  patrimonio.tramitar; DELETE só com patrimonio.tramitar), o gerador
--                                  não emite nada para ela.
-- Storage: policies st_inventario-evidencias_<cmd> (as mesmas de overlay/50_storage.sql).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Geometria das unidades locais
-- ---------------------------------------------------------------------------
ALTER TABLE public.unidades_locais
  ADD COLUMN IF NOT EXISTS latitude numeric(10,8)
    CONSTRAINT unidades_locais_latitude_check CHECK (latitude BETWEEN -90 AND 90),
  ADD COLUMN IF NOT EXISTS longitude numeric(11,8)
    CONSTRAINT unidades_locais_longitude_check CHECK (longitude BETWEEN -180 AND 180),
  ADD COLUMN IF NOT EXISTS poligono_geojson jsonb
    CONSTRAINT unidades_locais_poligono_geojson_check
      CHECK (poligono_geojson IS NULL OR poligono_geojson->>'type' IN ('Polygon', 'MultiPolygon')),
  ADD COLUMN IF NOT EXISTS area_terreno_m2 numeric(14,2)
    CONSTRAINT unidades_locais_area_terreno_m2_check CHECK (area_terreno_m2 >= 0),
  ADD COLUMN IF NOT EXISTS area_construida_m2 numeric(14,2)
    CONSTRAINT unidades_locais_area_construida_m2_check CHECK (area_construida_m2 >= 0),
  ADD COLUMN IF NOT EXISTS fonte_geometria text
    CONSTRAINT unidades_locais_fonte_geometria_check CHECK (fonte_geometria IN ('manual', 'gps', 'kml')),
  ADD COLUMN IF NOT EXISTS geometria_atualizada_em timestamptz,
  ADD COLUMN IF NOT EXISTS geometria_atualizada_por uuid;

-- ---------------------------------------------------------------------------
-- 2. Unidades por campanha
-- ---------------------------------------------------------------------------
CREATE TABLE public.campanhas_inventario_unidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campanha_id uuid NOT NULL REFERENCES public.campanhas_inventario(id) ON DELETE CASCADE,
  unidade_local_id uuid NOT NULL REFERENCES public.unidades_locais(id) ON DELETE RESTRICT,
  situacao text NOT NULL DEFAULT 'a_visitar'
    CONSTRAINT campanhas_inventario_unidades_situacao_check
      CHECK (situacao IN ('a_visitar', 'em_vistoria', 'concluida', 'com_pendencia', 'excluida')),
  equipe text,
  data_prevista date,
  iniciada_em timestamptz,
  concluida_em timestamptz,
  observacao text
    CONSTRAINT campanhas_inventario_unidades_observacao_check CHECK (length(observacao) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  updated_by uuid DEFAULT auth.uid(),
  CONSTRAINT campanhas_inventario_unidades_campanha_unidade_key UNIQUE (campanha_id, unidade_local_id)
);

COMMENT ON TABLE public.campanhas_inventario_unidades IS
  'Situação de cada unidade local numa campanha de inventário (complementa campanhas_inventario.unidades_abrangidas).';

-- (campanha_id, unidade_local_id) já é coberto pelo UNIQUE; o índice simples em campanha_id fica
-- explícito para as listagens por campanha e o de unidade_local_id serve à FK (ON DELETE RESTRICT).
CREATE INDEX idx_campanhas_inventario_unidades_campanha ON public.campanhas_inventario_unidades (campanha_id);
CREATE INDEX idx_campanhas_inventario_unidades_unidade ON public.campanhas_inventario_unidades (unidade_local_id);

-- Reusa a função existente que carimba updated_at = now() e updated_by = auth.uid().
CREATE TRIGGER trg_campanhas_inventario_unidades_updated_at
  BEFORE UPDATE ON public.campanhas_inventario_unidades
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_timestamp_parametros();

-- Autoria não é escolhida pelo cliente: o INSERT sobrescreve created_by/updated_by com quem grava
-- (sobrescreve em vez de recusar, para não quebrar o cliente que mande o campo).
CREATE FUNCTION public.fn_campanhas_inventario_unidades_autoria()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.created_by := auth.uid();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_campanhas_inventario_unidades_autoria() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_campanhas_inventario_unidades_autoria
  BEFORE INSERT ON public.campanhas_inventario_unidades
  FOR EACH ROW EXECUTE FUNCTION public.fn_campanhas_inventario_unidades_autoria();

-- ---------------------------------------------------------------------------
-- 3. Fotos da vistoria
-- ---------------------------------------------------------------------------
CREATE TABLE public.fotos_vistoria_inventario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),  -- normalmente gerado no celular (idempotência da fila)
  campanha_id uuid NOT NULL REFERENCES public.campanhas_inventario(id) ON DELETE CASCADE,
  unidade_local_id uuid NOT NULL REFERENCES public.unidades_locais(id) ON DELETE RESTRICT,
  bem_id uuid REFERENCES public.bens_patrimoniais(id) ON DELETE SET NULL,
  codigo_objeto text,
  legenda text
    CONSTRAINT fotos_vistoria_inventario_legenda_check CHECK (length(legenda) <= 500),
  storage_path text NOT NULL
    CONSTRAINT fotos_vistoria_inventario_storage_path_key UNIQUE,
  hash_sha256 text NOT NULL
    CONSTRAINT fotos_vistoria_inventario_hash_sha256_check CHECK (hash_sha256 ~ '^[0-9a-f]{64}$'),
  latitude numeric(10,8)
    CONSTRAINT fotos_vistoria_inventario_latitude_check CHECK (latitude BETWEEN -90 AND 90),
  longitude numeric(11,8)
    CONSTRAINT fotos_vistoria_inventario_longitude_check CHECK (longitude BETWEEN -180 AND 180),
  precisao_m numeric(8,2)
    CONSTRAINT fotos_vistoria_inventario_precisao_m_check CHECK (precisao_m >= 0),
  capturada_em timestamptz NOT NULL,
  enviada_em timestamptz NOT NULL DEFAULT now(),
  mime_type text
    CONSTRAINT fotos_vistoria_inventario_mime_type_check CHECK (mime_type IN ('image/jpeg', 'image/webp')),
  tamanho_bytes integer
    CONSTRAINT fotos_vistoria_inventario_tamanho_bytes_check CHECK (tamanho_bytes > 0 AND tamanho_bytes <= 10485760),
  tem_pessoa boolean NOT NULL DEFAULT false,
  dispositivo_info jsonb,
  usuario_id uuid NOT NULL DEFAULT auth.uid()
);

COMMENT ON TABLE public.fotos_vistoria_inventario IS
  'Evidência fotográfica da vistoria de inventário. Arquivo no bucket privado inventario-evidencias; hash, caminho, captura, coordenadas e autor são imutáveis.';

CREATE INDEX idx_fotos_vistoria_inventario_campanha_unidade ON public.fotos_vistoria_inventario (campanha_id, unidade_local_id);
CREATE INDEX idx_fotos_vistoria_inventario_capturada_em ON public.fotos_vistoria_inventario (capturada_em);
CREATE INDEX idx_fotos_vistoria_inventario_bem ON public.fotos_vistoria_inventario (bem_id) WHERE bem_id IS NOT NULL;

-- A foto é prova: depois do envio só legenda, tem_pessoa e codigo_objeto podem ser corrigidos.
-- Lista de PERMITIDOS (não de proibidos): coluna nova nasce imutável até alguém decidir o contrário.
CREATE FUNCTION public.fn_fotos_vistoria_inventario_imutavel()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (to_jsonb(NEW) - ARRAY['legenda', 'tem_pessoa', 'codigo_objeto'])
     IS DISTINCT FROM (to_jsonb(OLD) - ARRAY['legenda', 'tem_pessoa', 'codigo_objeto']) THEN
    RAISE EXCEPTION 'fotos_vistoria_inventario: só legenda, tem_pessoa e codigo_objeto podem ser alterados'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

-- Função de trigger: ninguém precisa chamá-la diretamente.
REVOKE ALL ON FUNCTION public.fn_fotos_vistoria_inventario_imutavel() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER trg_fotos_vistoria_inventario_imutavel
  BEFORE UPDATE ON public.fotos_vistoria_inventario
  FOR EACH ROW EXECUTE FUNCTION public.fn_fotos_vistoria_inventario_imutavel();

-- ---------------------------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.campanhas_inventario_unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fotos_vistoria_inventario ENABLE ROW LEVEL SECURITY;
-- FORCE como em campanhas_inventario (o dono da tabela também passa pela RLS, salvo BYPASSRLS)
ALTER TABLE public.campanhas_inventario_unidades FORCE ROW LEVEL SECURITY;
ALTER TABLE public.fotos_vistoria_inventario FORCE ROW LEVEL SECURITY;

-- campanhas_inventario_unidades  [modulo: patrimonio | patrimonio_mobile] — idêntico a rls/35_policies_geradas.sql
CREATE POLICY "rls_select" ON public.campanhas_inventario_unidades FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
CREATE POLICY "rls_insert" ON public.campanhas_inventario_unidades FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
CREATE POLICY "rls_update" ON public.campanhas_inventario_unidades FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
CREATE POLICY "rls_delete" ON public.campanhas_inventario_unidades FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));

-- fotos_vistoria_inventario  [preservar: patrimonio | patrimonio_mobile; DELETE por patrimonio.tramitar]
CREATE POLICY "rls_select" ON public.fotos_vistoria_inventario FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
CREATE POLICY "rls_insert" ON public.fotos_vistoria_inventario FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile'))
              AND usuario_id = auth.uid());
-- editar (legenda/tem_pessoa/codigo_objeto, o trigger barra o resto): o autor, ou quem tem patrimonio.tramitar
CREATE POLICY "rls_update" ON public.fotos_vistoria_inventario FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile'))
         AND (usuario_id = auth.uid() OR public.has_permission_code(auth.uid(), 'patrimonio.tramitar')))
  WITH CHECK ((public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile'))
              AND (usuario_id = auth.uid() OR public.has_permission_code(auth.uid(), 'patrimonio.tramitar')));
CREATE POLICY "rls_delete" ON public.fotos_vistoria_inventario FOR DELETE TO authenticated
  USING (public.has_permission_code(auth.uid(), 'patrimonio.tramitar'));

-- ---------------------------------------------------------------------------
-- 5. Privilégios: anon sem nada; authenticated só o que a API usa (a RLS filtra)
-- ---------------------------------------------------------------------------
REVOKE ALL ON public.campanhas_inventario_unidades, public.fotos_vistoria_inventario FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campanhas_inventario_unidades, public.fotos_vistoria_inventario TO authenticated;
REVOKE TRUNCATE, TRIGGER, REFERENCES ON public.campanhas_inventario_unidades, public.fotos_vistoria_inventario FROM authenticated;
GRANT ALL ON public.campanhas_inventario_unidades, public.fotos_vistoria_inventario TO service_role;

-- ---------------------------------------------------------------------------
-- 6. Storage: bucket privado de evidências
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inventario-evidencias',
  'inventario-evidencias',
  false,
  10485760, -- 10 MB
  ARRAY['image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Ler e enviar: módulo. Sobrescrever ou apagar a evidência quebraria o hash gravado na tabela:
-- UPDATE/DELETE só com patrimonio.tramitar (mesma regra do DELETE em fotos_vistoria_inventario).
DROP POLICY IF EXISTS "st_inventario-evidencias_select" ON storage.objects;
CREATE POLICY "st_inventario-evidencias_select" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'inventario-evidencias' AND (public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "st_inventario-evidencias_insert" ON storage.objects;
CREATE POLICY "st_inventario-evidencias_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'inventario-evidencias' AND (public.can_access_module(auth.uid(), 'patrimonio') OR public.can_access_module(auth.uid(), 'patrimonio_mobile')));
DROP POLICY IF EXISTS "st_inventario-evidencias_update" ON storage.objects;
CREATE POLICY "st_inventario-evidencias_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'inventario-evidencias' AND public.has_permission_code(auth.uid(), 'patrimonio.tramitar'))
  WITH CHECK (bucket_id = 'inventario-evidencias' AND public.has_permission_code(auth.uid(), 'patrimonio.tramitar'));
DROP POLICY IF EXISTS "st_inventario-evidencias_delete" ON storage.objects;
CREATE POLICY "st_inventario-evidencias_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'inventario-evidencias' AND public.has_permission_code(auth.uid(), 'patrimonio.tramitar'));
