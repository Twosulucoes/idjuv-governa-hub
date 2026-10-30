-- ============================================================================
-- RH: cargo e lotação de cada servidor pela planilha de ocupantes dos cargos comissionados
-- ============================================================================
-- Antes: depois da carga dos servidores pelo arquivo da Seplan (migração 20261114090000), cargo e lotação só
-- entravam um a um, na ficha (provimento e lotação). A planilha de ocupantes que o RH mantém já diz quem ocupa
-- cada cargo hoje e onde está lotado, mas não tem CPF.
--
-- Agora: rh_importar_cargos_ocupantes(p_linhas, p_arquivo, p_simular) recebe as linhas já casadas no navegador
-- (src/lib/importacao/importadores/cargosOcupantesParser.ts: servidor pelo nome, unidade pela coluna LOCAL) e, por
-- linha:
--   - confere que o servidor e a unidade existem;
--   - acha o cargo pelo nome e símbolo do quadro de vagas (sem acento e sem diferença de maiúscula); só pelo nome
--     quando há um único cargo com ele (vira aviso). Cargo que não existe é erro: importe antes o quadro de vagas;
--   - data de nomeação: a da portaria de nomeação do servidor na Central de Portarias (documentos, categoria
--     nomeacao, não rascunho/minuta/revogada, do mesmo cargo ou sem cargo), pela vigência, publicação ou data do
--     ato; sem portaria, 1º de janeiro do ano corrente, com a observação "a conferir";
--   - cria o provimento ativo (a vaga livre do cargo é escolhida pelo gatilho trg_provimento_vaga). Quem já tem
--     provimento em vigor no mesmo cargo fica como está; em outro cargo vira aviso e a linha não muda nada;
--   - cria a lotação na unidade, se o servidor não tiver lotação ativa (com outra unidade: aviso, fica a do sistema).
-- Tudo ou nada; p_simular = true desfaz tudo no fim (mesmo esquema da importação de servidores).
--
-- Quem pode: perfil ativo, módulo rh e rh.servidores.importar (permissão da migração 20261114090000; nenhuma
-- permissão nova). As gravações passam pelos gatilhos de vaga, validação, setor (exigir_setor), autoria e trilha
-- como as da tela. Nenhuma tabela, policy ou grant de tabela muda. Idempotente.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.rh_importar_cargos_ocupantes(
  p_linhas jsonb,
  p_arquivo jsonb,
  p_simular boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c_acentos constant text := 'ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇáàâãäéèêëíìîïóòôõöúùûüç';
  c_sem constant text := 'AAAAAEEEEIIIIOOOOOUUUUCaaaaaeeeeiiiiooooouuuuc';
  v_uid uuid := auth.uid();
  v_linha jsonb;
  v_pos integer := -1;
  v_ind integer;
  v_num integer;
  v_srv_nome text;
  v_servidor uuid;
  v_unidade uuid;
  v_unidade_nome text;
  v_cargo_txt text;
  v_simbolo text;
  v_municipio text;
  v_cargo record;
  v_qtd integer;
  v_prov record;
  v_port record;
  v_data date;
  v_a_conferir boolean;
  v_novo_prov uuid;
  v_vaga uuid;
  v_vaga_cod text;
  v_lot record;
  v_mud jsonb;
  v_avisos text[];
  v_acao text;
  v_vistos uuid[] := '{}';
  v_linhas_res jsonb := '[]'::jsonb;
  v_erros jsonb := '[]'::jsonb;
  v_detalhes jsonb := '[]'::jsonb;
  v_ins integer := 0;
  v_igual integer := 0;
  v_conferir integer := 0;
  v_totais jsonb;
  v_import_id uuid;
BEGIN
  p_simular := COALESCE(p_simular, true);

  -- COALESCE: um NULL em qualquer checagem nega
  IF v_uid IS NULL
     OR NOT COALESCE(public.perfil_ativo_atual()
                     AND public.can_access_module(v_uid, 'rh')
                     AND public.has_permission_code(v_uid, 'rh.servidores.importar'), false) THEN
    RAISE EXCEPTION 'Sem permissão para importar cargo e lotação dos servidores (rh.servidores.importar).' USING ERRCODE = '42501';
  END IF;

  IF jsonb_typeof(p_linhas) IS DISTINCT FROM 'array' OR jsonb_array_length(p_linhas) NOT BETWEEN 1 AND 3000 THEN
    RAISE EXCEPTION 'Envie de 1 a 3000 ocupantes.' USING ERRCODE = '22023';
  END IF;
  IF NOT p_simular AND (
       char_length(COALESCE(p_arquivo->>'nome', '')) NOT BETWEEN 1 AND 255
       OR COALESCE(p_arquivo->>'sha256', '') !~ '^[0-9a-f]{64}$'
       OR COALESCE(p_arquivo->>'tamanho', '') !~ '^\d{1,15}$') THEN
    RAISE EXCEPTION 'Dados do arquivo inválidos.' USING ERRCODE = '22023';
  END IF;

  -- uma carga de cargos de cada vez (as vagas livres são disputadas); com outra em andamento recusa na hora
  IF NOT pg_try_advisory_xact_lock(hashtext('rh_importar_cargos_ocupantes')) THEN
    RAISE EXCEPTION 'Já há uma importação de cargos em andamento; tente de novo em instantes.' USING ERRCODE = '55P03';
  END IF;

  BEGIN
    FOR v_linha IN SELECT e FROM jsonb_array_elements(p_linhas) e LOOP
      v_pos := v_pos + 1;
      v_ind := v_pos;
      v_num := NULL;
      v_avisos := '{}';
      v_mud := '{}'::jsonb;
      v_srv_nome := NULL;
      BEGIN
        IF jsonb_typeof(v_linha) IS DISTINCT FROM 'object' THEN
          RAISE EXCEPTION 'Linha em formato inválido.' USING ERRCODE = '22023';
        END IF;
        IF COALESCE(v_linha->>'indice', '') ~ '^\d{1,6}$' THEN v_ind := (v_linha->>'indice')::integer; END IF;
        IF COALESCE(v_linha->>'linha', '') ~ '^\d{1,7}$' THEN v_num := (v_linha->>'linha')::integer; END IF;

        IF COALESCE(v_linha->>'servidor_id', '') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
          RAISE EXCEPTION 'Servidor não encontrado no cadastro.' USING ERRCODE = 'P0001';
        END IF;
        v_servidor := (v_linha->>'servidor_id')::uuid;
        SELECT s.nome_completo INTO v_srv_nome FROM public.servidores s WHERE s.id = v_servidor;
        IF NOT FOUND THEN
          RAISE EXCEPTION 'Servidor não encontrado no cadastro.' USING ERRCODE = 'P0001';
        END IF;
        IF v_servidor = ANY (v_vistos) THEN
          RAISE EXCEPTION 'O servidor aparece em mais de uma linha da planilha.' USING ERRCODE = 'P0001';
        END IF;
        v_vistos := v_vistos || v_servidor;

        v_unidade := NULL;
        v_unidade_nome := NULL;
        IF nullif(v_linha->>'unidade_id', '') IS NOT NULL THEN
          IF (v_linha->>'unidade_id') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
            RAISE EXCEPTION 'Lotação em formato inválido.' USING ERRCODE = '22023';
          END IF;
          SELECT u.id, u.nome INTO v_unidade, v_unidade_nome FROM public.estrutura_organizacional u
           WHERE u.id = (v_linha->>'unidade_id')::uuid AND u.ativo;
          IF v_unidade IS NULL THEN
            RAISE EXCEPTION 'A lotação informada não está ativa na estrutura organizacional.' USING ERRCODE = 'P0001';
          END IF;
        END IF;

        v_cargo_txt := upper(regexp_replace(translate(btrim(COALESCE(v_linha->>'cargo', '')), c_acentos, c_sem), '\s+', ' ', 'g'));
        v_simbolo := nullif(upper(regexp_replace(btrim(COALESCE(v_linha->>'simbolo', '')), '\s+', '', 'g')), '');
        v_municipio := nullif(left(btrim(COALESCE(v_linha->>'municipio', '')), 60), '');
        IF v_cargo_txt = '' THEN
          RAISE EXCEPTION 'Cargo ausente na planilha.' USING ERRCODE = '22023';
        END IF;

        -- cargo: nome e símbolo do quadro de vagas; só pelo nome quando houver um único cargo com ele
        SELECT c.id, c.nome, c.sigla, c.ativo INTO v_cargo FROM public.cargos c
         WHERE upper(regexp_replace(translate(btrim(c.nome), c_acentos, c_sem), '\s+', ' ', 'g')) = v_cargo_txt
           AND COALESCE(upper(regexp_replace(btrim(c.sigla), '\s+', '', 'g')), '') = COALESCE(v_simbolo, '')
         ORDER BY c.ativo DESC NULLS LAST, c.created_at
         LIMIT 1;
        IF v_cargo.id IS NULL THEN
          SELECT count(*) INTO v_qtd FROM public.cargos c
           WHERE upper(regexp_replace(translate(btrim(c.nome), c_acentos, c_sem), '\s+', ' ', 'g')) = v_cargo_txt;
          IF v_qtd = 1 THEN
            SELECT c.id, c.nome, c.sigla, c.ativo INTO v_cargo FROM public.cargos c
             WHERE upper(regexp_replace(translate(btrim(c.nome), c_acentos, c_sem), '\s+', ' ', 'g')) = v_cargo_txt;
            v_avisos := v_avisos || format('O cargo %s está cadastrado com o símbolo %s, e a planilha diz %s.',
                                           v_cargo.nome, COALESCE(v_cargo.sigla, '(sem símbolo)'), COALESCE(v_simbolo, '(sem símbolo)'))::text;
          ELSE
            RAISE EXCEPTION 'O cargo % (%) não está no cadastro: importe antes o Quadro de vagas (Cargos → Quadro de vagas).',
              v_linha->>'cargo', COALESCE(v_simbolo, 'sem símbolo') USING ERRCODE = 'P0001';
          END IF;
        END IF;
        IF v_cargo.ativo IS NOT TRUE THEN
          v_avisos := v_avisos || format('O cargo %s está inativo no cadastro.', v_cargo.nome)::text;
        END IF;

        -- provimento em vigor
        SELECT p.id, p.cargo_id, p.data_nomeacao, c.nome AS cargo_nome INTO v_prov
          FROM public.provimentos p JOIN public.cargos c ON c.id = p.cargo_id
         WHERE p.servidor_id = v_servidor AND p.status IN ('ativo', 'suspenso')
         ORDER BY p.data_nomeacao DESC
         LIMIT 1;

        IF v_prov.id IS NOT NULL AND v_prov.cargo_id <> v_cargo.id THEN
          v_avisos := v_avisos || format('Já está nomeado em %s no sistema; a planilha diz %s. Nada foi mudado: registre a troca de cargo na ficha.',
                                         v_prov.cargo_nome, v_cargo.nome)::text;
          v_data := NULL;
        ELSE
          IF v_prov.id IS NOT NULL THEN
            v_data := v_prov.data_nomeacao;
            v_port := NULL;
          ELSE
            -- portaria de nomeação da Central de Portarias
            SELECT d.numero,
                   COALESCE(d.data_vigencia_inicio, d.data_publicacao, d.data_documento) AS data,
                   d.data_documento
              INTO v_port
              FROM public.documentos d
             WHERE d.tipo = 'portaria' AND d.categoria = 'nomeacao'
               AND v_servidor = ANY (d.servidores_ids)
               AND d.status NOT IN ('rascunho', 'minuta', 'revogado')
               AND (d.cargo_id IS NULL OR d.cargo_id = v_cargo.id)
             ORDER BY (d.cargo_id IS NOT NULL) DESC, COALESCE(d.data_vigencia_inicio, d.data_publicacao, d.data_documento) DESC
             LIMIT 1;
            v_a_conferir := v_port.data IS NULL;
            v_data := COALESCE(v_port.data, make_date(extract(year FROM public.data_local())::integer, 1, 1));

            INSERT INTO public.provimentos (servidor_id, cargo_id, unidade_id, status, data_nomeacao, observacoes)
            VALUES (v_servidor, v_cargo.id, v_unidade, 'ativo', v_data,
                    CASE WHEN v_a_conferir
                         THEN 'Data de nomeação a conferir: sem portaria de nomeação na Central de Portarias. Importado da planilha de ocupantes.'
                         ELSE format('Portaria nº %s. Importado da planilha de ocupantes.', v_port.numero) END)
            RETURNING id, vaga_id INTO v_novo_prov, v_vaga;
            SELECT codigo INTO v_vaga_cod FROM public.vagas_cargo WHERE id = v_vaga;
            v_mud := v_mud || jsonb_build_object(
              'cargo', jsonb_build_array(NULL, v_cargo.nome || COALESCE(' – ' || v_cargo.sigla, '')),
              'data_nomeacao', jsonb_build_array(NULL, to_char(v_data, 'DD/MM/YYYY') ||
                                                 CASE WHEN v_a_conferir THEN ' (a conferir)' ELSE ' (portaria ' || v_port.numero || ')' END));
            IF v_vaga_cod IS NOT NULL THEN
              v_mud := v_mud || jsonb_build_object('vaga', jsonb_build_array(NULL, v_vaga_cod));
            END IF;
            IF v_a_conferir THEN v_conferir := v_conferir + 1; END IF;
          END IF;

          -- lotação: só quando não há lotação ativa
          IF v_unidade IS NOT NULL THEN
            SELECT l.id, l.unidade_id, u.nome AS unidade_nome INTO v_lot
              FROM public.lotacoes l LEFT JOIN public.estrutura_organizacional u ON u.id = l.unidade_id
             WHERE l.servidor_id = v_servidor AND l.ativo
             ORDER BY l.data_inicio DESC
             LIMIT 1;
            IF v_lot.id IS NULL THEN
              INSERT INTO public.lotacoes (servidor_id, unidade_id, cargo_id, data_inicio, observacao, ativo,
                                           ato_tipo, ato_numero, ato_data)
              VALUES (v_servidor, v_unidade, v_cargo.id, v_data,
                      left('Importada da planilha de ocupantes.' || COALESCE(' Município: ' || v_municipio || '.', ''), 500), true,
                      CASE WHEN v_port.numero IS NOT NULL THEN 'portaria' END, v_port.numero, v_port.data_documento);
              v_mud := v_mud || jsonb_build_object('unidade', jsonb_build_array(NULL, v_unidade_nome));
            ELSIF v_lot.unidade_id <> v_unidade THEN
              v_avisos := v_avisos || format('Já está lotado em %s no sistema; a planilha diz %s. A lotação do sistema foi mantida.',
                                             COALESCE(v_lot.unidade_nome, 'outra unidade'), v_unidade_nome)::text;
            END IF;
          END IF;
        END IF;

        IF v_mud = '{}'::jsonb THEN
          v_acao := 'sem_alteracao';
          v_igual := v_igual + 1;
        ELSE
          v_acao := 'inserir';
          v_ins := v_ins + 1;
        END IF;

        v_linhas_res := v_linhas_res || jsonb_strip_nulls(jsonb_build_object(
          'indice', v_ind, 'acao', v_acao,
          'mudancas', CASE WHEN v_mud <> '{}'::jsonb THEN v_mud END,
          'avisos', CASE WHEN cardinality(v_avisos) > 0 THEN to_jsonb(v_avisos) END));
        v_detalhes := v_detalhes || jsonb_strip_nulls(jsonb_build_object(
          'indice', v_ind, 'linha', v_num, 'acao', v_acao, 'servidor_id', v_servidor, 'provimento_id', v_novo_prov));
        v_novo_prov := NULL;
        v_port := NULL;
        v_lot := NULL;
        v_prov := NULL;
        v_cargo := NULL;
      EXCEPTION
        WHEN OTHERS THEN
          v_novo_prov := NULL;
          v_port := NULL;
          v_lot := NULL;
          v_prov := NULL;
          v_cargo := NULL;
          v_erros := v_erros || jsonb_build_object('indice', v_ind, 'mensagem',
            COALESCE(v_srv_nome || ': ', '') ||
            CASE WHEN left(SQLSTATE, 2) IN ('22', '23') OR SQLSTATE IN ('P0001', 'RHS01', '42501') THEN SQLERRM
                 ELSE format('erro inesperado ao gravar o cargo (código %s).', SQLSTATE) END);
      END;
    END LOOP;

    IF p_simular OR jsonb_array_length(v_erros) > 0 THEN
      RAISE EXCEPTION 'importação desfeita' USING ERRCODE = 'ICO01';
    END IF;
  EXCEPTION
    WHEN SQLSTATE 'ICO01' THEN
      NULL;  -- desfeito: nada do que as linhas gravaram fica; as variáveis continuam valendo
  END;

  v_totais := jsonb_build_object('inserir', v_ins, 'atualizar', 0, 'sem_alteracao', v_igual);

  IF NOT p_simular AND jsonb_array_length(v_erros) = 0 THEN
    INSERT INTO public.importacoes
      (tipo, modulo, arquivo_nome, arquivo_sha256, arquivo_tamanho, resumo, detalhes, created_by)
    VALUES
      ('cargos_ocupantes', 'rh', p_arquivo->>'nome', p_arquivo->>'sha256', (p_arquivo->>'tamanho')::bigint,
       jsonb_build_object('totais', v_totais, 'data_a_conferir', v_conferir),
       v_detalhes, v_uid)
    RETURNING id INTO v_import_id;
  END IF;

  RETURN jsonb_build_object(
    'simulacao', p_simular,
    'importacao_id', v_import_id,
    'totais', v_totais,
    'linhas', v_linhas_res,
    'erros', v_erros
  );
END;
$$;

COMMENT ON FUNCTION public.rh_importar_cargos_ocupantes(jsonb, jsonb, boolean) IS
  'Cargo e lotação dos servidores pela planilha de ocupantes: cria o provimento (cargo pelo nome e símbolo do quadro de vagas; data da portaria de nomeação ou 1º de janeiro marcada a conferir) e a lotação quando não há outra ativa. p_simular = true só calcula; tudo ou nada. Exige módulo rh e rh.servidores.importar. Migração 20261115090000.';

REVOKE ALL ON FUNCTION public.rh_importar_cargos_ocupantes(jsonb, jsonb, boolean) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.rh_importar_cargos_ocupantes(jsonb, jsonb, boolean) TO authenticated;
