
-- ============================================================
-- MIGRAÇÃO: INTEGRAÇÃO PATRIMÔNIO + UNIDADES LOCAIS
-- ============================================================

-- 1. COMENTÁRIO SOBRE OBRIGATORIEDADE
COMMENT ON COLUMN bens_patrimoniais.unidade_local_id IS 'Referência obrigatória à Unidade Local onde o bem está fisicamente localizado';

-- 2. ADICIONAR CAMPOS EM movimentacoes_patrimonio
ALTER TABLE movimentacoes_patrimonio 
ADD COLUMN IF NOT EXISTS unidade_local_origem_id UUID REFERENCES unidades_locais(id),
ADD COLUMN IF NOT EXISTS unidade_local_destino_id UUID REFERENCES unidades_locais(id),
ADD COLUMN IF NOT EXISTS documento_url TEXT,
ADD COLUMN IF NOT EXISTS dados_snapshot JSONB DEFAULT '{}';

-- 3. CRIAR TABELA DE HISTÓRICO IMUTÁVEL
CREATE TABLE IF NOT EXISTS historico_patrimonio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bem_id UUID NOT NULL REFERENCES bens_patrimoniais(id),
  tipo_evento TEXT NOT NULL CHECK (tipo_evento IN (
    'cadastro', 'tombamento', 'transferencia', 'cessao', 'emprestimo',
    'recolhimento', 'manutencao_inicio', 'manutencao_fim', 
    'baixa_solicitada', 'baixa_aprovada', 'baixa_rejeitada',
    'atualizacao_dados', 'troca_responsavel'
  )),
  data_evento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unidade_local_id UUID REFERENCES unidades_locais(id),
  responsavel_id UUID REFERENCES servidores(id),
  localizacao_especifica TEXT,
  estado_conservacao TEXT,
  valor_aquisicao NUMERIC(15,2),
  movimentacao_id UUID REFERENCES movimentacoes_patrimonio(id),
  manutencao_id UUID REFERENCES manutencoes_patrimonio(id),
  baixa_id UUID REFERENCES baixas_patrimonio(id),
  justificativa TEXT,
  documento_url TEXT,
  dados_anteriores JSONB,
  dados_novos JSONB,
  usuario_id UUID,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_historico_patrimonio_bem ON historico_patrimonio(bem_id);
CREATE INDEX IF NOT EXISTS idx_historico_patrimonio_unidade ON historico_patrimonio(unidade_local_id);
CREATE INDEX IF NOT EXISTS idx_historico_patrimonio_responsavel ON historico_patrimonio(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_historico_patrimonio_data ON historico_patrimonio(data_evento DESC);
CREATE INDEX IF NOT EXISTS idx_historico_patrimonio_tipo ON historico_patrimonio(tipo_evento);

-- RLS
ALTER TABLE historico_patrimonio ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "historico_patrimonio_select" ON historico_patrimonio;
DROP POLICY IF EXISTS "historico_patrimonio_insert_system" ON historico_patrimonio;
DROP POLICY IF EXISTS "historico_patrimonio_no_update" ON historico_patrimonio;
DROP POLICY IF EXISTS "historico_patrimonio_no_delete" ON historico_patrimonio;

-- Leitura somente com roles válidos do enum
CREATE POLICY "historico_patrimonio_select"
ON historico_patrimonio FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'manager', 'diraf', 'controle_interno')
  )
);

CREATE POLICY "historico_patrimonio_insert_system"
ON historico_patrimonio FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "historico_patrimonio_no_update"
ON historico_patrimonio FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "historico_patrimonio_no_delete"
ON historico_patrimonio FOR DELETE
TO authenticated
USING (false);

-- 4. TRIGGER PARA HISTÓRICO AUTOMÁTICO DE BENS
CREATE OR REPLACE FUNCTION registrar_historico_patrimonio()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO historico_patrimonio (
      bem_id, tipo_evento, unidade_local_id, responsavel_id,
      localizacao_especifica, estado_conservacao, valor_aquisicao,
      dados_novos, usuario_id
    ) VALUES (
      NEW.id, 'cadastro', NEW.unidade_local_id, NEW.responsavel_id,
      NEW.localizacao_especifica, NEW.estado_conservacao, NEW.valor_aquisicao,
      to_jsonb(NEW), auth.uid()
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.unidade_local_id IS DISTINCT FROM NEW.unidade_local_id THEN
      INSERT INTO historico_patrimonio (
        bem_id, tipo_evento, unidade_local_id, responsavel_id,
        localizacao_especifica, estado_conservacao, valor_aquisicao,
        dados_anteriores, dados_novos, justificativa, usuario_id
      ) VALUES (
        NEW.id, 'transferencia', NEW.unidade_local_id, NEW.responsavel_id,
        NEW.localizacao_especifica, NEW.estado_conservacao, NEW.valor_aquisicao,
        jsonb_build_object('unidade_local_id', OLD.unidade_local_id),
        jsonb_build_object('unidade_local_id', NEW.unidade_local_id),
        'Transferência automática', auth.uid()
      );
    END IF;
    
    IF OLD.responsavel_id IS DISTINCT FROM NEW.responsavel_id THEN
      INSERT INTO historico_patrimonio (
        bem_id, tipo_evento, unidade_local_id, responsavel_id,
        dados_anteriores, dados_novos, justificativa, usuario_id
      ) VALUES (
        NEW.id, 'troca_responsavel', NEW.unidade_local_id, NEW.responsavel_id,
        jsonb_build_object('responsavel_id', OLD.responsavel_id),
        jsonb_build_object('responsavel_id', NEW.responsavel_id),
        'Troca de responsável', auth.uid()
      );
    END IF;
    
    IF OLD.situacao IS DISTINCT FROM NEW.situacao THEN
      INSERT INTO historico_patrimonio (
        bem_id, tipo_evento, unidade_local_id, responsavel_id,
        dados_anteriores, dados_novos, usuario_id
      ) VALUES (
        NEW.id, 'atualizacao_dados', NEW.unidade_local_id, NEW.responsavel_id,
        jsonb_build_object('situacao', OLD.situacao),
        jsonb_build_object('situacao', NEW.situacao),
        auth.uid()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_historico_patrimonio ON bens_patrimoniais;
CREATE TRIGGER tr_historico_patrimonio
AFTER INSERT OR UPDATE ON bens_patrimoniais
FOR EACH ROW
EXECUTE FUNCTION registrar_historico_patrimonio();

-- 5. TRIGGER PARA MOVIMENTAÇÕES
CREATE OR REPLACE FUNCTION registrar_historico_movimentacao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'aprovada' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'aprovada') THEN
    INSERT INTO historico_patrimonio (
      bem_id, tipo_evento, unidade_local_id, responsavel_id,
      movimentacao_id, justificativa, documento_url,
      dados_anteriores, dados_novos, usuario_id
    ) VALUES (
      NEW.bem_id, 
      NEW.tipo::TEXT,
      NEW.unidade_local_destino_id,
      NEW.responsavel_destino_id,
      NEW.id,
      NEW.motivo,
      NEW.termo_transferencia_url,
      jsonb_build_object('unidade_local_id', NEW.unidade_local_origem_id),
      jsonb_build_object('unidade_local_id', NEW.unidade_local_destino_id),
      auth.uid()
    );
    
    UPDATE bens_patrimoniais
    SET 
      unidade_local_id = NEW.unidade_local_destino_id,
      responsavel_id = COALESCE(NEW.responsavel_destino_id, responsavel_id),
      updated_at = now()
    WHERE id = NEW.bem_id;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_historico_movimentacao ON movimentacoes_patrimonio;
CREATE TRIGGER tr_historico_movimentacao
AFTER INSERT OR UPDATE ON movimentacoes_patrimonio
FOR EACH ROW
EXECUTE FUNCTION registrar_historico_movimentacao();

-- 6. TRIGGER PARA MANUTENÇÕES
CREATE OR REPLACE FUNCTION registrar_historico_manutencao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO historico_patrimonio (bem_id, tipo_evento, manutencao_id, justificativa, usuario_id)
    VALUES (NEW.bem_id, 'manutencao_inicio', NEW.id, NEW.descricao_problema, auth.uid());
    
    UPDATE bens_patrimoniais SET situacao = 'em_manutencao', updated_at = now() WHERE id = NEW.bem_id;
  END IF;
  
  IF TG_OP = 'UPDATE' AND NEW.status = 'concluida' AND (OLD.status IS DISTINCT FROM 'concluida') THEN
    INSERT INTO historico_patrimonio (bem_id, tipo_evento, manutencao_id, justificativa, usuario_id, dados_novos)
    VALUES (NEW.bem_id, 'manutencao_fim', NEW.id, NEW.observacoes, auth.uid(),
            jsonb_build_object('custo_final', NEW.custo_final, 'data_conclusao', NEW.data_conclusao));
    
    UPDATE bens_patrimoniais SET situacao = 'alocado', updated_at = now()
    WHERE id = NEW.bem_id AND situacao = 'em_manutencao';
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_historico_manutencao ON manutencoes_patrimonio;
CREATE TRIGGER tr_historico_manutencao
AFTER INSERT OR UPDATE ON manutencoes_patrimonio
FOR EACH ROW
EXECUTE FUNCTION registrar_historico_manutencao();

-- 7. VIEW POR UNIDADE LOCAL
CREATE OR REPLACE VIEW v_patrimonio_por_unidade AS
SELECT 
  ul.id AS unidade_id,
  ul.codigo_unidade,
  ul.nome_unidade,
  ul.municipio,
  ul.tipo_unidade,
  ul.status AS status_unidade,
  COUNT(bp.id) AS total_bens,
  COALESCE(SUM(bp.valor_aquisicao), 0) AS valor_total,
  SUM(CASE WHEN bp.situacao = 'alocado' THEN 1 ELSE 0 END) AS bens_alocados,
  SUM(CASE WHEN bp.situacao = 'em_manutencao' THEN 1 ELSE 0 END) AS bens_manutencao,
  SUM(CASE WHEN bp.situacao = 'baixado' THEN 1 ELSE 0 END) AS bens_baixados,
  COUNT(DISTINCT bp.responsavel_id) AS total_responsaveis
FROM unidades_locais ul
LEFT JOIN bens_patrimoniais bp ON bp.unidade_local_id = ul.id
GROUP BY ul.id, ul.codigo_unidade, ul.nome_unidade, ul.municipio, ul.tipo_unidade, ul.status;

-- 8. VIEW DE MOVIMENTAÇÕES
DROP VIEW IF EXISTS v_movimentacoes_completas;
CREATE VIEW v_movimentacoes_completas AS
SELECT 
  m.id, m.tipo, m.data_movimentacao, m.status, m.motivo, m.observacoes,
  m.termo_transferencia_url, m.documento_url, m.aceite_responsavel, m.data_aceite, m.created_at,
  bp.id AS bem_id, bp.numero_patrimonio, bp.descricao AS bem_descricao, bp.categoria_bem, bp.valor_aquisicao AS bem_valor,
  uo.id AS origem_unidade_id, uo.nome_unidade AS origem_nome, uo.codigo_unidade AS origem_codigo,
  so.nome_completo AS origem_responsavel_nome,
  ud.id AS destino_unidade_id, ud.nome_unidade AS destino_nome, ud.codigo_unidade AS destino_codigo,
  sd.nome_completo AS destino_responsavel_nome,
  sol.nome_completo AS solicitante_nome, apr.nome_completo AS aprovador_nome, m.data_aprovacao
FROM movimentacoes_patrimonio m
JOIN bens_patrimoniais bp ON bp.id = m.bem_id
LEFT JOIN unidades_locais uo ON uo.id = m.unidade_local_origem_id
LEFT JOIN unidades_locais ud ON ud.id = m.unidade_local_destino_id
LEFT JOIN servidores so ON so.id = m.responsavel_origem_id
LEFT JOIN servidores sd ON sd.id = m.responsavel_destino_id
LEFT JOIN servidores sol ON sol.id = m.solicitado_por
LEFT JOIN servidores apr ON apr.id = m.aprovado_por;

-- 9. VIEW DO HISTÓRICO
DROP VIEW IF EXISTS v_historico_bem_completo;
CREATE VIEW v_historico_bem_completo AS
SELECT 
  hp.id, hp.bem_id, hp.tipo_evento, hp.data_evento, hp.justificativa,
  hp.documento_url, hp.dados_anteriores, hp.dados_novos,
  bp.numero_patrimonio, bp.descricao AS bem_descricao,
  ul.id AS unidade_local_id, ul.nome_unidade, ul.codigo_unidade,
  s.id AS responsavel_id, s.nome_completo AS responsavel_nome
FROM historico_patrimonio hp
JOIN bens_patrimoniais bp ON bp.id = hp.bem_id
LEFT JOIN unidades_locais ul ON ul.id = hp.unidade_local_id
LEFT JOIN servidores s ON s.id = hp.responsavel_id
ORDER BY hp.data_evento DESC;

-- 10. FUNÇÃO RELATÓRIO POR RESPONSÁVEL
CREATE OR REPLACE FUNCTION gerar_relatorio_responsavel(p_responsavel_id UUID)
RETURNS TABLE (
  bem_id UUID, numero_patrimonio TEXT, descricao TEXT, categoria TEXT,
  unidade_local TEXT, localizacao TEXT, estado_conservacao TEXT,
  valor_aquisicao NUMERIC, data_atribuicao DATE
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT 
    bp.id, bp.numero_patrimonio::TEXT, bp.descricao, bp.categoria_bem::TEXT,
    ul.nome_unidade,
    COALESCE(bp.predio || ' - ', '') || COALESCE(bp.andar || ' - ', '') || COALESCE(bp.sala, ''),
    bp.estado_conservacao, bp.valor_aquisicao, bp.data_atribuicao_responsabilidade
  FROM bens_patrimoniais bp
  LEFT JOIN unidades_locais ul ON ul.id = bp.unidade_local_id
  WHERE bp.responsavel_id = p_responsavel_id
    AND bp.situacao NOT IN ('baixado', 'extraviado')
  ORDER BY ul.nome_unidade, bp.descricao;
$$;

-- 11. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_bens_unidade_local ON bens_patrimoniais(unidade_local_id);
CREATE INDEX IF NOT EXISTS idx_bens_responsavel ON bens_patrimoniais(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_unidade_origem ON movimentacoes_patrimonio(unidade_local_origem_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_unidade_destino ON movimentacoes_patrimonio(unidade_local_destino_id);
