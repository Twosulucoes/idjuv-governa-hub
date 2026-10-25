-- ============================================================================
-- CONTRATOS — Passagens aéreas, entrega 1: beneficiários, pedidos, passageiros, trechos, cotações e emissão
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-24-contratos-passagens-aereas-design.md
-- Plano: docs/superpowers/plans/2026-10-24-contratos-passagens-entrega1.md
--
--   passagem_beneficiarios   quem viaja e não é servidor (atleta, técnico, convidado...), com CPF único.
--   passagem_pedidos         um pedido = um processo SEI; quem pediu, evento, contrato da agência e situação.
--                            A aprovação é ato do SEI: aqui ficam só a data e o nº do documento.
--   passagem_passageiros     servidor (RH) ou beneficiário; o nome é copiado pelo banco (quem tem passagens não lê o RH).
--   passagem_trechos         origem, destino, data e a emissão (localizador, bilhete e valores).
--   passagem_cotacoes        opções da agência por trecho; uma escolhida.
--   passagem_historico       trilha da criação e das mudanças de situação (gatilho).
--   contratos.controla_passagens  marca o contrato da agência (o saldo das passagens só olha esses).
--   passagem_buscar_servidores / passagem_viagens_servidor
--                            leitura estreita do RH (nome, matrícula, cargo; viagens do servidor) para quem tem passagens.
--
-- Leitura: módulo contratos E contratos.passagens.visualizar (ou editar); escrita: contratos.passagens.editar.
-- Pedido e beneficiário não se apagam pela API (cancelado / ativo = false); trecho com localizador não se apaga.
-- Permissões novas concedidas a quem já tem contratos.criar.
-- Idempotente (IF NOT EXISTS, ON CONFLICT, CREATE OR REPLACE, DROP/CREATE de policies e gatilhos).
-- ============================================================================

SET lock_timeout = '10s';

-- ----------------------------------------------------------------------------
-- 1. Tabelas
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.passagem_beneficiarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL CHECK (char_length(btrim(nome)) BETWEEN 3 AND 200),
  cpf text NOT NULL CHECK (cpf ~ '^[0-9]{11}$'),
  data_nascimento date,
  documento_tipo text CHECK (documento_tipo IN ('rg', 'cnh', 'passaporte', 'outro')),
  documento_numero text CHECK (char_length(documento_numero) <= 40),
  documento_orgao text CHECK (char_length(documento_orgao) <= 40),
  telefone text CHECK (char_length(telefone) <= 30),
  email text CHECK (char_length(email) <= 200),
  instituicao_id uuid REFERENCES public.instituicoes(id),
  instituicao_nome text CHECK (char_length(instituicao_nome) <= 200),
  observacoes text CHECK (char_length(observacoes) <= 2000),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT passagem_beneficiarios_cpf_key UNIQUE (cpf)
);
CREATE INDEX IF NOT EXISTS idx_passagem_beneficiarios_nome ON public.passagem_beneficiarios (lower(nome));
COMMENT ON TABLE public.passagem_beneficiarios IS
  'Beneficiários de passagem que não são servidores (atletas, técnicos, convidados). Dado pessoal: só o módulo contratos com a permissão de passagens lê. Sai por ativo = false.';

CREATE TABLE IF NOT EXISTS public.passagem_pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_sei text NOT NULL CHECK (char_length(btrim(numero_sei)) BETWEEN 1 AND 60),
  data_pedido date NOT NULL DEFAULT CURRENT_DATE,
  origem text NOT NULL DEFAULT 'sei' CHECK (origem IN ('sei', 'email', 'oficio', 'outro')),
  solicitante_tipo text NOT NULL CHECK (solicitante_tipo IN ('servidor', 'beneficiario', 'instituicao')),
  solicitante_servidor_id uuid REFERENCES public.servidores(id),
  solicitante_beneficiario_id uuid REFERENCES public.passagem_beneficiarios(id),
  solicitante_instituicao_id uuid REFERENCES public.instituicoes(id),
  solicitante_nome text CHECK (char_length(solicitante_nome) <= 200),
  contrato_id uuid REFERENCES public.contratos(id),
  finalidade text NOT NULL CHECK (char_length(btrim(finalidade)) BETWEEN 3 AND 2000),
  evento text CHECK (char_length(evento) <= 300),
  destino_cidade text CHECK (char_length(destino_cidade) <= 120),
  destino_uf text CHECK (destino_uf ~ '^[A-Z]{2}$'),
  data_inicio date,
  data_fim date,
  prestacao_contas text NOT NULL DEFAULT 'individual' CHECK (prestacao_contas IN ('individual', 'evento', 'dispensado')),
  situacao text NOT NULL DEFAULT 'recebido' CHECK (situacao IN (
    'recebido', 'cotacao_solicitada', 'cotacao_recebida', 'aprovado', 'emitido', 'concluido', 'cancelado')),
  aprovacao_documento_sei text CHECK (char_length(aprovacao_documento_sei) <= 60),
  aprovacao_data date,
  cancelamento_motivo text CHECK (char_length(cancelamento_motivo) <= 1000),
  observacoes text CHECK (char_length(observacoes) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT passagem_pedidos_numero_sei_key UNIQUE (numero_sei),
  CONSTRAINT passagem_pedidos_datas_check CHECK (data_fim IS NULL OR data_inicio IS NULL OR data_fim >= data_inicio),
  CONSTRAINT passagem_pedidos_solicitante_check CHECK (
    (solicitante_tipo = 'servidor' AND solicitante_servidor_id IS NOT NULL)
    OR (solicitante_tipo = 'beneficiario' AND solicitante_beneficiario_id IS NOT NULL)
    OR (solicitante_tipo = 'instituicao' AND (solicitante_instituicao_id IS NOT NULL OR solicitante_nome IS NOT NULL))
  ),
  CONSTRAINT passagem_pedidos_aprovacao_check CHECK (
    situacao NOT IN ('aprovado', 'emitido', 'concluido')
    OR (aprovacao_documento_sei IS NOT NULL AND aprovacao_data IS NOT NULL)
  ),
  CONSTRAINT passagem_pedidos_cancelamento_check CHECK (situacao <> 'cancelado' OR cancelamento_motivo IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_passagem_pedidos_situacao ON public.passagem_pedidos (situacao, data_pedido DESC);
CREATE INDEX IF NOT EXISTS idx_passagem_pedidos_contrato ON public.passagem_pedidos (contrato_id);
COMMENT ON TABLE public.passagem_pedidos IS
  'Pedido de passagem: um por processo SEI. O SEI tramita e assina; aqui ficam a situação, a data e o nº do documento da aprovação do Presidente. Sai por situacao = cancelado.';

CREATE TABLE IF NOT EXISTS public.passagem_passageiros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.passagem_pedidos(id),
  servidor_id uuid REFERENCES public.servidores(id),
  beneficiario_id uuid REFERENCES public.passagem_beneficiarios(id),
  nome text,
  viagem_id uuid REFERENCES public.viagens_diarias(id),
  observacoes text CHECK (char_length(observacoes) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT passagem_passageiros_pessoa_check CHECK ((servidor_id IS NULL) <> (beneficiario_id IS NULL)),
  CONSTRAINT passagem_passageiros_viagem_check CHECK (viagem_id IS NULL OR servidor_id IS NOT NULL),
  CONSTRAINT passagem_passageiros_servidor_key UNIQUE (pedido_id, servidor_id),
  CONSTRAINT passagem_passageiros_beneficiario_key UNIQUE (pedido_id, beneficiario_id)
);
CREATE INDEX IF NOT EXISTS idx_passagem_passageiros_beneficiario ON public.passagem_passageiros (beneficiario_id);
CREATE INDEX IF NOT EXISTS idx_passagem_passageiros_servidor ON public.passagem_passageiros (servidor_id);
COMMENT ON TABLE public.passagem_passageiros IS
  'Passageiros do pedido: servidor (RH) ou beneficiário. nome é copiado pelo gatilho passagem_copiar_nome. viagem_id liga à viagem do RH (diárias e relatório).';

CREATE TABLE IF NOT EXISTS public.passagem_trechos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passageiro_id uuid NOT NULL REFERENCES public.passagem_passageiros(id) ON DELETE CASCADE,
  ordem integer NOT NULL DEFAULT 1 CHECK (ordem BETWEEN 1 AND 20),
  origem text NOT NULL CHECK (char_length(btrim(origem)) BETWEEN 2 AND 120),
  destino text NOT NULL CHECK (char_length(btrim(destino)) BETWEEN 2 AND 120),
  data_voo date NOT NULL,
  situacao text NOT NULL DEFAULT 'a_cotar' CHECK (situacao IN (
    'a_cotar', 'cotado', 'emitido', 'remarcado', 'cancelado', 'reembolsado')),
  companhia text CHECK (char_length(companhia) <= 80),
  voo text CHECK (char_length(voo) <= 30),
  partida timestamptz,
  chegada timestamptz,
  localizador text CHECK (char_length(localizador) <= 20),
  numero_bilhete text CHECK (char_length(numero_bilhete) <= 30),
  data_emissao date,
  valor_tarifa numeric(12,2) NOT NULL DEFAULT 0 CHECK (valor_tarifa >= 0),
  valor_taxa_embarque numeric(12,2) NOT NULL DEFAULT 0 CHECK (valor_taxa_embarque >= 0),
  valor_taxa_servico numeric(12,2) NOT NULL DEFAULT 0 CHECK (valor_taxa_servico >= 0),
  valor_desconto numeric(12,2) NOT NULL DEFAULT 0 CHECK (valor_desconto >= 0),
  valor_multa numeric(12,2) NOT NULL DEFAULT 0 CHECK (valor_multa >= 0),
  valor_reembolso numeric(12,2) NOT NULL DEFAULT 0 CHECK (valor_reembolso >= 0),
  valor_emissao numeric(12,2) GENERATED ALWAYS AS (
    valor_tarifa + valor_taxa_embarque + valor_taxa_servico - valor_desconto) STORED,
  observacoes text CHECK (char_length(observacoes) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT passagem_trechos_emissao_check CHECK (
    situacao NOT IN ('emitido', 'remarcado', 'reembolsado') OR (localizador IS NOT NULL AND data_emissao IS NOT NULL)
  ),
  CONSTRAINT passagem_trechos_horario_check CHECK (chegada IS NULL OR partida IS NULL OR chegada >= partida)
);
CREATE INDEX IF NOT EXISTS idx_passagem_trechos_passageiro ON public.passagem_trechos (passageiro_id, ordem);
CREATE INDEX IF NOT EXISTS idx_passagem_trechos_emissao ON public.passagem_trechos (data_emissao) WHERE localizador IS NOT NULL;
COMMENT ON TABLE public.passagem_trechos IS
  'Trechos de cada passageiro e a emissão (localizador, bilhete, valores). Trecho com localizador não se apaga: vai para cancelado ou reembolsado.';

CREATE TABLE IF NOT EXISTS public.passagem_cotacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trecho_id uuid NOT NULL REFERENCES public.passagem_trechos(id) ON DELETE CASCADE,
  companhia text NOT NULL CHECK (char_length(btrim(companhia)) BETWEEN 1 AND 80),
  voo text CHECK (char_length(voo) <= 30),
  partida timestamptz,
  chegada timestamptz,
  valor numeric(12,2) NOT NULL CHECK (valor >= 0),
  escolhida boolean NOT NULL DEFAULT false,
  observacoes text CHECK (char_length(observacoes) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid DEFAULT auth.uid(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
CREATE INDEX IF NOT EXISTS idx_passagem_cotacoes_trecho ON public.passagem_cotacoes (trecho_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_passagem_cotacoes_escolhida ON public.passagem_cotacoes (trecho_id) WHERE escolhida;
COMMENT ON TABLE public.passagem_cotacoes IS 'Opções de voo que a agência mandou para cada trecho; no máximo uma escolhida.';

CREATE TABLE IF NOT EXISTS public.passagem_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.passagem_pedidos(id),
  trecho_id uuid,
  acao text NOT NULL CHECK (acao IN ('pedido_criado', 'pedido_situacao', 'trecho_situacao')),
  antes jsonb,
  depois jsonb,
  feito_por uuid DEFAULT auth.uid(),
  feito_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_passagem_historico_pedido ON public.passagem_historico (pedido_id, feito_em DESC);
COMMENT ON TABLE public.passagem_historico IS 'Trilha do pedido de passagem: criação e mudanças de situação do pedido e dos trechos (gatilho).';

ALTER TABLE public.passagem_beneficiarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passagem_pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passagem_passageiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passagem_trechos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passagem_cotacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passagem_historico ENABLE ROW LEVEL SECURITY;

-- Contrato da agência: só os contratos marcados entram no saldo e na escolha do pedido.
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS controla_passagens boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.contratos.controla_passagens IS
  'Contrato de agenciamento de passagens: aparece em Contratos → Passagens aéreas (saldo e escolha no pedido).';

-- ----------------------------------------------------------------------------
-- 2. Autoria, nomes copiados, proteção do trecho emitido e trilha
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.passagem_carimbar()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := COALESCE(auth.uid(), NEW.created_by);
  ELSE
    NEW.created_at := OLD.created_at;
    NEW.created_by := OLD.created_by;
  END IF;
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.passagem_carimbar() FROM PUBLIC, anon, authenticated;

-- Copia o nome do passageiro e do solicitante (SECURITY DEFINER: quem tem passagens não lê servidores nem instituições).
CREATE OR REPLACE FUNCTION public.passagem_copiar_nome()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_TABLE_NAME = 'passagem_passageiros' THEN
    IF NEW.servidor_id IS NOT NULL THEN
      SELECT s.nome_completo INTO NEW.nome FROM public.servidores s WHERE s.id = NEW.servidor_id;
    ELSE
      SELECT b.nome INTO NEW.nome FROM public.passagem_beneficiarios b WHERE b.id = NEW.beneficiario_id;
    END IF;
    IF NEW.nome IS NULL THEN
      RAISE EXCEPTION 'Passageiro não encontrado.' USING ERRCODE = '22023';
    END IF;
    IF NEW.viagem_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.viagens_diarias v WHERE v.id = NEW.viagem_id AND v.servidor_id = NEW.servidor_id) THEN
      RAISE EXCEPTION 'A viagem escolhida não é deste servidor.' USING ERRCODE = '22023';
    END IF;
  ELSE
    NEW.solicitante_nome := CASE NEW.solicitante_tipo
      WHEN 'servidor' THEN (SELECT s.nome_completo FROM public.servidores s WHERE s.id = NEW.solicitante_servidor_id)
      WHEN 'beneficiario' THEN (SELECT b.nome FROM public.passagem_beneficiarios b WHERE b.id = NEW.solicitante_beneficiario_id)
      ELSE COALESCE((SELECT i.nome_razao_social FROM public.instituicoes i WHERE i.id = NEW.solicitante_instituicao_id),
                    NEW.solicitante_nome)
    END;
    IF NEW.solicitante_nome IS NULL
       OR (NEW.solicitante_instituicao_id IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM public.instituicoes i WHERE i.id = NEW.solicitante_instituicao_id)) THEN
      RAISE EXCEPTION 'Solicitante não encontrado.' USING ERRCODE = '22023';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.passagem_copiar_nome() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.passagem_proteger_emitido()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.localizador IS NOT NULL THEN
    RAISE EXCEPTION 'Trecho já emitido não pode ser apagado: marque como cancelado ou reembolsado.' USING ERRCODE = '42501';
  END IF;
  RETURN OLD;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.passagem_proteger_emitido() FROM PUBLIC, anon, authenticated;

-- Trilha (SECURITY DEFINER: ninguém escreve em passagem_historico pela API).
CREATE OR REPLACE FUNCTION public.passagem_registrar_historico()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pedido uuid;
BEGIN
  IF TG_TABLE_NAME = 'passagem_pedidos' THEN
    IF TG_OP = 'INSERT' THEN
      INSERT INTO public.passagem_historico (pedido_id, acao, depois, feito_por)
      VALUES (NEW.id, 'pedido_criado', jsonb_build_object('situacao', NEW.situacao, 'numero_sei', NEW.numero_sei), auth.uid());
    ELSIF NEW.situacao IS DISTINCT FROM OLD.situacao THEN
      INSERT INTO public.passagem_historico (pedido_id, acao, antes, depois, feito_por)
      VALUES (NEW.id, 'pedido_situacao', jsonb_build_object('situacao', OLD.situacao),
              jsonb_build_object('situacao', NEW.situacao, 'aprovacao_documento_sei', NEW.aprovacao_documento_sei,
                                 'aprovacao_data', NEW.aprovacao_data, 'cancelamento_motivo', NEW.cancelamento_motivo),
              auth.uid());
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.situacao IS NOT DISTINCT FROM OLD.situacao THEN
    RETURN NEW;
  END IF;
  SELECT p.pedido_id INTO v_pedido FROM public.passagem_passageiros p WHERE p.id = NEW.passageiro_id;
  INSERT INTO public.passagem_historico (pedido_id, trecho_id, acao, antes, depois, feito_por)
  VALUES (v_pedido, NEW.id, 'trecho_situacao',
          CASE WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('situacao', OLD.situacao) END,
          jsonb_build_object('situacao', NEW.situacao, 'origem', NEW.origem, 'destino', NEW.destino,
                             'localizador', NEW.localizador, 'valor_emissao', NEW.valor_emissao),
          auth.uid());
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.passagem_registrar_historico() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_passagem_beneficiarios_carimbar ON public.passagem_beneficiarios;
CREATE TRIGGER trg_passagem_beneficiarios_carimbar BEFORE INSERT OR UPDATE ON public.passagem_beneficiarios
  FOR EACH ROW EXECUTE FUNCTION public.passagem_carimbar();
DROP TRIGGER IF EXISTS trg_passagem_pedidos_carimbar ON public.passagem_pedidos;
CREATE TRIGGER trg_passagem_pedidos_carimbar BEFORE INSERT OR UPDATE ON public.passagem_pedidos
  FOR EACH ROW EXECUTE FUNCTION public.passagem_carimbar();
DROP TRIGGER IF EXISTS trg_passagem_passageiros_carimbar ON public.passagem_passageiros;
CREATE TRIGGER trg_passagem_passageiros_carimbar BEFORE INSERT OR UPDATE ON public.passagem_passageiros
  FOR EACH ROW EXECUTE FUNCTION public.passagem_carimbar();
DROP TRIGGER IF EXISTS trg_passagem_trechos_carimbar ON public.passagem_trechos;
CREATE TRIGGER trg_passagem_trechos_carimbar BEFORE INSERT OR UPDATE ON public.passagem_trechos
  FOR EACH ROW EXECUTE FUNCTION public.passagem_carimbar();
DROP TRIGGER IF EXISTS trg_passagem_cotacoes_carimbar ON public.passagem_cotacoes;
CREATE TRIGGER trg_passagem_cotacoes_carimbar BEFORE INSERT OR UPDATE ON public.passagem_cotacoes
  FOR EACH ROW EXECUTE FUNCTION public.passagem_carimbar();

DROP TRIGGER IF EXISTS trg_passagem_pedidos_nome ON public.passagem_pedidos;
CREATE TRIGGER trg_passagem_pedidos_nome BEFORE INSERT OR UPDATE ON public.passagem_pedidos
  FOR EACH ROW EXECUTE FUNCTION public.passagem_copiar_nome();
DROP TRIGGER IF EXISTS trg_passagem_passageiros_nome ON public.passagem_passageiros;
CREATE TRIGGER trg_passagem_passageiros_nome BEFORE INSERT OR UPDATE ON public.passagem_passageiros
  FOR EACH ROW EXECUTE FUNCTION public.passagem_copiar_nome();

-- Nome do beneficiário corrigido: os passageiros e solicitantes ligados a ele recopiam o nome (gatilhos acima).
CREATE OR REPLACE FUNCTION public.passagem_propagar_nome_beneficiario()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.passagem_passageiros SET nome = NEW.nome WHERE beneficiario_id = NEW.id;
  UPDATE public.passagem_pedidos SET solicitante_nome = NEW.nome WHERE solicitante_beneficiario_id = NEW.id;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.passagem_propagar_nome_beneficiario() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_passagem_beneficiarios_nome ON public.passagem_beneficiarios;
CREATE TRIGGER trg_passagem_beneficiarios_nome AFTER UPDATE OF nome ON public.passagem_beneficiarios
  FOR EACH ROW WHEN (NEW.nome IS DISTINCT FROM OLD.nome) EXECUTE FUNCTION public.passagem_propagar_nome_beneficiario();

DROP TRIGGER IF EXISTS trg_passagem_trechos_proteger ON public.passagem_trechos;
CREATE TRIGGER trg_passagem_trechos_proteger BEFORE DELETE ON public.passagem_trechos
  FOR EACH ROW EXECUTE FUNCTION public.passagem_proteger_emitido();

DROP TRIGGER IF EXISTS trg_passagem_pedidos_historico ON public.passagem_pedidos;
CREATE TRIGGER trg_passagem_pedidos_historico AFTER INSERT OR UPDATE ON public.passagem_pedidos
  FOR EACH ROW EXECUTE FUNCTION public.passagem_registrar_historico();
DROP TRIGGER IF EXISTS trg_passagem_trechos_historico ON public.passagem_trechos;
CREATE TRIGGER trg_passagem_trechos_historico AFTER INSERT OR UPDATE ON public.passagem_trechos
  FOR EACH ROW EXECUTE FUNCTION public.passagem_registrar_historico();

-- ----------------------------------------------------------------------------
-- 3. Permissões contratos.passagens.visualizar e contratos.passagens.editar e concessão a quem tem contratos.criar
-- ----------------------------------------------------------------------------
INSERT INTO public.module_permissions_catalog (module_code, permission_code, label, category, action_type, sort_order)
VALUES ('contratos', 'contratos.passagens.visualizar', 'Ver passagens aéreas', 'Passagens', 'visualizar', 701),
       ('contratos', 'contratos.passagens.editar', 'Editar passagens aéreas', 'Passagens', 'editar', 702)
ON CONFLICT (permission_code) DO NOTHING;

INSERT INTO public.role_permissions (role, permission)
SELECT DISTINCT rp.role, p.codigo
  FROM public.role_permissions rp
 CROSS JOIN (VALUES ('contratos.passagens.visualizar'), ('contratos.passagens.editar')) p(codigo)
 WHERE rp.permission = 'contratos.criar'
ON CONFLICT (role, permission) DO NOTHING;

INSERT INTO public.user_permissions (user_id, permission, created_by)
SELECT up.user_id, p.codigo, up.created_by
  FROM public.user_permissions up
 CROSS JOIN (VALUES ('contratos.passagens.visualizar'), ('contratos.passagens.editar')) p(codigo)
 WHERE up.permission = 'contratos.criar'
ON CONFLICT (user_id, permission) DO NOTHING;

UPDATE public.user_modules
   SET permissions = permissions || ARRAY(SELECT c FROM unnest(ARRAY['contratos.passagens.visualizar', 'contratos.passagens.editar']) c
                                           WHERE NOT (c = ANY (permissions)))
 WHERE 'contratos.criar' = ANY (permissions)
   AND NOT (ARRAY['contratos.passagens.visualizar', 'contratos.passagens.editar'] <@ permissions);

-- ----------------------------------------------------------------------------
-- 4. Leitura estreita do RH para quem tem passagens
-- ----------------------------------------------------------------------------
-- Servidores ativos por nome ou matrícula: só id, nome, matrícula e cargo (nada de CPF nem ficha). Só para quem
-- edita passagens (é a busca do diálogo de passageiro); % e _ do termo valem como texto, não como curinga.
CREATE OR REPLACE FUNCTION public.passagem_buscar_servidores(_termo text)
RETURNS TABLE (id uuid, nome text, matricula text, cargo text)
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
  IF char_length(regexp_replace(COALESCE(_termo, ''), '[^[:alnum:]]', '', 'g')) < 3 THEN
    RETURN;
  END IF;
  RETURN QUERY
  SELECT s.id, s.nome_completo, s.matricula, c.nome
    FROM public.servidores s
    LEFT JOIN public.cargos c ON c.id = s.cargo_atual_id
   WHERE s.ativo IS NOT FALSE
     AND (s.nome_completo ILIKE '%' || replace(replace(replace(btrim(_termo), '\', '\\'), '%', '\%'), '_', '\_') || '%'
          OR s.matricula = btrim(_termo))
   ORDER BY s.nome_completo
   LIMIT 20;
END;
$$;
REVOKE ALL ON FUNCTION public.passagem_buscar_servidores(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.passagem_buscar_servidores(text) TO authenticated;

-- Viagens do RH de um servidor (para ligar o passageiro à viagem com diárias e relatório).
CREATE OR REPLACE FUNCTION public.passagem_viagens_servidor(_servidor_id uuid)
RETURNS TABLE (id uuid, destino text, data_saida date, data_retorno date, status text)
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
  SELECT v.id, v.destino_cidade || '/' || v.destino_uf, v.data_saida, v.data_retorno, v.status
    FROM public.viagens_diarias v
   WHERE v.servidor_id = _servidor_id AND v.status <> 'cancelada'
   ORDER BY v.data_saida DESC
   LIMIT 30;
END;
$$;
REVOKE ALL ON FUNCTION public.passagem_viagens_servidor(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.passagem_viagens_servidor(uuid) TO authenticated;

-- ----------------------------------------------------------------------------
-- 5. RLS (gerado de supabase/baseline/rls/mapa.csv por scripts/db/gerar-rls.mjs)
-- ----------------------------------------------------------------------------
-- passagem_beneficiarios  [permissao: contratos]
DROP POLICY IF EXISTS "rls_select" ON public.passagem_beneficiarios;
CREATE POLICY "rls_select" ON public.passagem_beneficiarios FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'contratos')) AND (public.has_permission_code(auth.uid(), 'contratos.passagens.visualizar') OR public.has_permission_code(auth.uid(), 'contratos.passagens.editar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.passagem_beneficiarios;
CREATE POLICY "rls_insert" ON public.passagem_beneficiarios FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'));
DROP POLICY IF EXISTS "rls_update" ON public.passagem_beneficiarios;
CREATE POLICY "rls_update" ON public.passagem_beneficiarios FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'));
DROP POLICY IF EXISTS "rls_delete" ON public.passagem_beneficiarios;

-- passagem_cotacoes  [permissao: contratos]
DROP POLICY IF EXISTS "rls_select" ON public.passagem_cotacoes;
CREATE POLICY "rls_select" ON public.passagem_cotacoes FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'contratos')) AND (public.has_permission_code(auth.uid(), 'contratos.passagens.visualizar') OR public.has_permission_code(auth.uid(), 'contratos.passagens.editar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.passagem_cotacoes;
CREATE POLICY "rls_insert" ON public.passagem_cotacoes FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'));
DROP POLICY IF EXISTS "rls_update" ON public.passagem_cotacoes;
CREATE POLICY "rls_update" ON public.passagem_cotacoes FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'));
DROP POLICY IF EXISTS "rls_delete" ON public.passagem_cotacoes;
CREATE POLICY "rls_delete" ON public.passagem_cotacoes FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'));

-- passagem_historico  [trilha: contratos]
DROP POLICY IF EXISTS "rls_select" ON public.passagem_historico;
CREATE POLICY "rls_select" ON public.passagem_historico FOR SELECT TO authenticated
  USING ((public.can_access_module(auth.uid(), 'contratos')) AND (public.has_permission_code(auth.uid(), 'contratos.passagens.visualizar') OR public.has_permission_code(auth.uid(), 'contratos.passagens.editar')));

-- passagem_passageiros  [permissao: contratos]
DROP POLICY IF EXISTS "rls_select" ON public.passagem_passageiros;
CREATE POLICY "rls_select" ON public.passagem_passageiros FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'contratos')) AND (public.has_permission_code(auth.uid(), 'contratos.passagens.visualizar') OR public.has_permission_code(auth.uid(), 'contratos.passagens.editar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.passagem_passageiros;
CREATE POLICY "rls_insert" ON public.passagem_passageiros FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'));
DROP POLICY IF EXISTS "rls_update" ON public.passagem_passageiros;
CREATE POLICY "rls_update" ON public.passagem_passageiros FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'));
DROP POLICY IF EXISTS "rls_delete" ON public.passagem_passageiros;
CREATE POLICY "rls_delete" ON public.passagem_passageiros FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'));

-- passagem_pedidos  [permissao: contratos]
DROP POLICY IF EXISTS "rls_select" ON public.passagem_pedidos;
CREATE POLICY "rls_select" ON public.passagem_pedidos FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'contratos')) AND (public.has_permission_code(auth.uid(), 'contratos.passagens.visualizar') OR public.has_permission_code(auth.uid(), 'contratos.passagens.editar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.passagem_pedidos;
CREATE POLICY "rls_insert" ON public.passagem_pedidos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'));
DROP POLICY IF EXISTS "rls_update" ON public.passagem_pedidos;
CREATE POLICY "rls_update" ON public.passagem_pedidos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'));
DROP POLICY IF EXISTS "rls_delete" ON public.passagem_pedidos;

-- passagem_trechos  [permissao: contratos]
DROP POLICY IF EXISTS "rls_select" ON public.passagem_trechos;
CREATE POLICY "rls_select" ON public.passagem_trechos FOR SELECT TO authenticated
  USING (((public.can_access_module(auth.uid(), 'contratos')) AND (public.has_permission_code(auth.uid(), 'contratos.passagens.visualizar') OR public.has_permission_code(auth.uid(), 'contratos.passagens.editar'))));
DROP POLICY IF EXISTS "rls_insert" ON public.passagem_trechos;
CREATE POLICY "rls_insert" ON public.passagem_trechos FOR INSERT TO authenticated
  WITH CHECK ((public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'));
DROP POLICY IF EXISTS "rls_update" ON public.passagem_trechos;
CREATE POLICY "rls_update" ON public.passagem_trechos FOR UPDATE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'))
  WITH CHECK ((public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'));
DROP POLICY IF EXISTS "rls_delete" ON public.passagem_trechos;
CREATE POLICY "rls_delete" ON public.passagem_trechos FOR DELETE TO authenticated
  USING ((public.can_access_module(auth.uid(), 'contratos')) AND public.has_permission_code(auth.uid(), 'contratos.passagens.editar'));

