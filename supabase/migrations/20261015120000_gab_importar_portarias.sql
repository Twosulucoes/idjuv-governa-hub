-- ============================================================================
-- GABINETE — importação de portarias por planilha
-- ============================================================================
-- Spec: docs/superpowers/specs/2026-10-15-importacao-portarias-planilha-design.md
--
--   gabinete.portarias.importar          permissão nova (catálogo do módulo gabinete); o papel admin
--                                        já passa por cima em has_permission_code.
--   importar_portarias_planilha(...)     recebe as linhas da planilha (já normalizadas pelo front, ver o
--                                        "Contrato" da spec), confere tudo de novo e insere ou completa
--                                        portarias em public.documentos. Com p_simular = true só calcula.
--
-- Como a simulação e o "tudo ou nada" funcionam: a RPC faz o INSERT/UPDATE REAL de cada linha, cada uma num
-- bloco BEGIN..EXCEPTION próprio (savepoint), para que os triggers de documentos atuem como na tela
-- (documentos_portaria_validar, índice único documentos_portaria_numero_uk, zz_exigir_setor, autoria, trilha,
-- ficha). O erro de uma linha (SQLERRM) vira erro da linha e só desfaz aquela linha. Todas as linhas rodam
-- dentro de um bloco externo; no fim, na simulação ou quando houve qualquer erro, o bloco externo termina com
-- RAISE do SQLSTATE próprio 'PTI01', capturado ali mesmo: o Postgres volta ao savepoint do bloco externo e
-- desfaz tudo o que as linhas gravaram (inclusive o que os triggers gravaram em outras tabelas), enquanto as
-- variáveis PL/pgSQL (resultado, avisos, erros) continuam valendo. Assim a simulação mostra o efeito
-- acumulado das linhas e a aplicação com erro não grava nada. Só a aplicação sem erro chega ao log em
-- importacoes.
--
-- LGPD: o servidor é identificado só pela matrícula; CPF não entra, não é lido nem devolvido. O log
-- (importacoes.detalhes) guarda só índice, número da portaria, ação e nomes dos campos alterados. Dado do RH
-- só para quem tem o módulo rh: sem ele, o aviso de servidor inativo não diz a situação funcional (exonerado,
-- aposentado...) e as mudanças de servidores de uma portaria existente não convertem em matrícula os
-- servidores já vinculados que não vieram na planilha (aparece só "N servidor(es) já vinculados").
--
-- Erros: o erro de uma linha devolve a mensagem do Postgres só para as classes esperadas (22xxx dado inválido,
-- 23xxx restrição, P0001 RAISE simples, RHS01 regra de setor, 42501 permissão); qualquer outro SQLSTATE vira
-- "Erro inesperado ao gravar a linha (código X)", sem expor o texto interno.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Permissão
-- ----------------------------------------------------------------------------
INSERT INTO public.module_permissions_catalog
  (module_code, permission_code, label, category, action_type, sort_order)
VALUES
  ('gabinete', 'gabinete.portarias.importar', 'Importar portarias (planilha)', 'Portarias', 'importar', 4)
ON CONFLICT (permission_code) DO NOTHING;


-- ----------------------------------------------------------------------------
-- 2. importar_portarias_planilha
-- ----------------------------------------------------------------------------
-- p_linhas: array de objetos {indice, numero, data_documento, categoria, ementa, processo_sei, status,
--   status_informado, assinado_por, data_assinatura, doe_numero, doe_data, data_vigencia_inicio,
--   data_vigencia_fim, matriculas[], observacoes} (datas AAAA-MM-DD; vazio = null). status_informado (boolean):
--   false quando o front preencheu a situação por padrão (coluna vazia na planilha); só com true a RPC avisa
--   que a situação da planilha difere da do sistema. Ausente/null: vale "status preenchido".
-- p_arquivo: {nome, sha256, tamanho} (conferido só na aplicação).
-- Retorno: {simulacao, importacao_id, totais {inserir, atualizar, sem_alteracao},
--   linhas [{indice, acao, mudancas {campo: [antes, depois]}, avisos []}], erros [{indice, mensagem}]}.
CREATE OR REPLACE FUNCTION public.importar_portarias_planilha(
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
  c_pessoal constant text[] := ARRAY['nomeacao', 'exoneracao', 'designacao', 'dispensa', 'cessao', 'pessoal'];
  c_status constant text[] := ARRAY['aguardando_assinatura', 'assinado', 'publicado', 'vigente'];
  c_rotulo constant jsonb := '{"rascunho": "Rascunho", "minuta": "Aguardando SEI", "aguardando_assinatura": "Aguardando assinatura",
    "assinado": "Assinada", "aguardando_publicacao": "Aguardando publicação", "publicado": "Publicada",
    "vigente": "Vigente", "revogado": "Revogada"}';
  v_uid uuid := auth.uid();
  v_rh boolean;                         -- pode ver dado funcional do servidor (módulo rh)
  v_status_inf boolean;
  v_n integer;
  v_ocultos integer;
  v_linha jsonb;
  v_pos integer := -1;
  v_ind integer;
  v_num text;
  v_numeros jsonb := '{}'::jsonb;       -- número normalizado -> índice da primeira linha
  v_legado jsonb := '{}'::jsonb;        -- número normalizado -> id da portaria gravada fora do padrão (1/2026)
  v_erros_linha text[];
  v_avisos text[];
  v_datas jsonb;
  v_campo text;
  v_txt text;
  v_d date;
  v_cat text; v_status text;
  v_ementa text; v_sei text; v_assinado_por text; v_doe_num text; v_obs text;
  v_data_doc date; v_data_ass date; v_doe_data date; v_vig_ini date; v_vig_fim date;
  v_mats text[];
  v_mat text;
  v_serv record;
  v_serv_ids uuid[];
  v_novos uuid[];
  v_pend record;
  v_doc public.documentos%ROWTYPE;
  v_achou boolean;
  v_acao text;
  v_mudancas jsonb;
  v_upd jsonb;
  v_mats_antes text[];
  v_doc_id uuid;
  v_linhas_res jsonb := '[]'::jsonb;
  v_erros jsonb := '[]'::jsonb;
  v_detalhes jsonb := '[]'::jsonb;
  v_ins integer := 0; v_atu integer := 0; v_igual integer := 0;
  v_totais jsonb;
  v_import_id uuid;
BEGIN
  p_simular := COALESCE(p_simular, true);

  -- COALESCE: um NULL em qualquer checagem nega (NOT NULL não dispararia o RAISE).
  IF v_uid IS NULL
     OR NOT COALESCE(public.perfil_ativo_atual()
                     AND public.can_access_module(v_uid, 'gabinete')
                     AND public.has_permission_code(v_uid, 'gabinete.portarias.importar'), false) THEN
    RAISE EXCEPTION 'Sem permissão para importar portarias (gabinete.portarias.importar).' USING ERRCODE = '42501';
  END IF;

  IF jsonb_typeof(p_linhas) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_linhas) NOT BETWEEN 1 AND 2000 THEN
    RAISE EXCEPTION 'Envie de 1 a 2000 portarias.' USING ERRCODE = '22023';
  END IF;
  IF NOT p_simular AND (
       char_length(COALESCE(p_arquivo->>'nome', '')) NOT BETWEEN 1 AND 255
       OR COALESCE(p_arquivo->>'sha256', '') !~ '^[0-9a-f]{64}$'
       OR COALESCE(p_arquivo->>'tamanho', '') !~ '^\d{1,15}$') THEN
    RAISE EXCEPTION 'Dados do arquivo inválidos.' USING ERRCODE = '22023';
  END IF;

  v_rh := COALESCE(public.can_access_module(v_uid, 'rh'), false);

  -- Uma importação de portarias de cada vez (a chave é o número, que não tem exercício próprio). Não espera:
  -- com outra em andamento recusa na hora, em vez de prender a conexão até a outra terminar.
  IF NOT pg_try_advisory_xact_lock(hashtext('importar_portarias_planilha'), 0) THEN
    RAISE EXCEPTION 'Já há uma importação de portarias em andamento; tente de novo em instantes.' USING ERRCODE = '55P03';
  END IF;

  -- Portarias gravadas com o número fora do padrão (ex.: 1/2026, 01/2026): reconhecidas pelo número normalizado.
  SELECT COALESCE(jsonb_object_agg(n.norm, n.id), '{}'::jsonb) INTO v_legado
    FROM (
      SELECT DISTINCT ON (x.norm) x.norm, x.id
        FROM (
          SELECT d.id, d.created_at,
                 lpad(m[1], greatest(3, char_length(m[1])), '0') || '/' || m[2] AS norm, d.numero
            FROM public.documentos d
            CROSS JOIN LATERAL regexp_match(btrim(d.numero), '^(\d{1,6})\s*/\s*(\d{4})$') AS m
           WHERE d.tipo = 'portaria' AND d.numero !~ '^PENDENTE' AND m IS NOT NULL
        ) x
       WHERE x.norm <> x.numero
       ORDER BY x.norm, x.created_at
    ) n;

  BEGIN  -- bloco externo: desfeito no fim na simulação ou se houver erro (ver o cabeçalho)
    FOR v_linha IN SELECT value FROM jsonb_array_elements(p_linhas) LOOP
      v_pos := v_pos + 1;
      v_ind := v_pos;
      v_erros_linha := '{}';
      v_avisos := '{}';
      v_num := NULL;

      BEGIN  -- bloco da linha (savepoint): o erro de um trigger desfaz só esta linha
        IF jsonb_typeof(v_linha) IS DISTINCT FROM 'object' THEN
          RAISE EXCEPTION 'Linha em formato inválido.' USING ERRCODE = '22023';
        END IF;
        IF COALESCE(v_linha->>'indice', '') ~ '^\d{1,6}$' THEN
          v_ind := (v_linha->>'indice')::integer;
        END IF;

        -- Número: NNN/AAAA (1/2026 -> 001/2026); PENDENTE recusado; repetido no arquivo é erro
        v_txt := NULLIF(btrim(COALESCE(v_linha->>'numero', '')), '');
        IF v_txt IS NULL THEN
          v_erros_linha := v_erros_linha || 'O número da portaria é obrigatório.'::text;
        ELSIF v_txt ~* 'pendente' THEN
          v_erros_linha := v_erros_linha || format('"%s" é uma pendência sem número; só se importa portaria já numerada.', left(v_txt, 40));
        ELSIF v_txt !~ '^\d{1,6}/\d{4}$' OR split_part(v_txt, '/', 1)::integer = 0 THEN
          v_erros_linha := v_erros_linha || format('Número "%s" fora do formato NNN/AAAA (ex.: 001/2026).', left(v_txt, 40));
        ELSE
          v_num := lpad(split_part(v_txt, '/', 1), greatest(3, char_length(split_part(v_txt, '/', 1))), '0')
                   || '/' || split_part(v_txt, '/', 2);
          IF v_numeros ? v_num THEN
            v_erros_linha := v_erros_linha || format('A portaria %s aparece repetida no arquivo (já está na linha de índice %s).',
                                                     v_num, v_numeros->>v_num);
          ELSE
            v_numeros := v_numeros || jsonb_build_object(v_num, v_ind);
          END IF;
        END IF;

        -- Datas (AAAA-MM-DD)
        v_datas := '{}'::jsonb;
        FOREACH v_campo IN ARRAY ARRAY['data_documento', 'data_assinatura', 'doe_data', 'data_vigencia_inicio', 'data_vigencia_fim'] LOOP
          v_txt := NULLIF(btrim(COALESCE(v_linha->>v_campo, '')), '');
          CONTINUE WHEN v_txt IS NULL;
          v_d := NULL;
          IF v_txt ~ '^\d{4}-\d{2}-\d{2}$' THEN
            BEGIN
              v_d := v_txt::date;
            EXCEPTION WHEN OTHERS THEN v_d := NULL;
            END;
          END IF;
          IF v_d IS NULL OR v_d NOT BETWEEN DATE '1900-01-01' AND DATE '2100-12-31' THEN
            v_erros_linha := v_erros_linha || format('"%s" não é uma data válida (%s).', CASE v_campo
              WHEN 'data_documento' THEN 'Data da portaria' WHEN 'data_assinatura' THEN 'Data da assinatura'
              WHEN 'doe_data' THEN 'Data DOE' WHEN 'data_vigencia_inicio' THEN 'Início da vigência'
              ELSE 'Fim da vigência' END, left(v_txt, 20));
          ELSE
            v_datas := v_datas || jsonb_build_object(v_campo, v_d);
          END IF;
        END LOOP;
        v_data_doc := (v_datas->>'data_documento')::date;
        v_data_ass := (v_datas->>'data_assinatura')::date;
        v_doe_data := (v_datas->>'doe_data')::date;
        v_vig_ini := (v_datas->>'data_vigencia_inicio')::date;
        v_vig_fim := (v_datas->>'data_vigencia_fim')::date;

        IF NULLIF(btrim(COALESCE(v_linha->>'data_documento', '')), '') IS NULL THEN
          v_erros_linha := v_erros_linha || 'A data da portaria é obrigatória.'::text;
        ELSIF v_data_doc > current_date THEN
          v_erros_linha := v_erros_linha || 'A data da portaria está no futuro.'::text;
        END IF;

        -- Categoria (código do enum categoria_portaria)
        v_cat := NULLIF(btrim(COALESCE(v_linha->>'categoria', '')), '');
        IF v_cat IS NULL THEN
          v_erros_linha := v_erros_linha || 'A categoria é obrigatória.'::text;
        ELSIF NOT EXISTS (SELECT 1 FROM pg_enum e
                           WHERE e.enumtypid = 'public.categoria_portaria'::regtype AND e.enumlabel = v_cat) THEN
          v_erros_linha := v_erros_linha || format('Categoria "%s" desconhecida.', left(v_cat, 40));
          v_cat := NULL;
        END IF;

        -- Textos livres
        v_ementa := NULLIF(btrim(COALESCE(v_linha->>'ementa', '')), '');
        v_sei := NULLIF(btrim(COALESCE(v_linha->>'processo_sei', '')), '');
        v_assinado_por := NULLIF(btrim(COALESCE(v_linha->>'assinado_por', '')), '');
        v_doe_num := NULLIF(btrim(COALESCE(v_linha->>'doe_numero', '')), '');
        v_obs := NULLIF(btrim(COALESCE(v_linha->>'observacoes', '')), '');
        IF char_length(v_ementa) > 2000 THEN v_erros_linha := v_erros_linha || 'A ementa passa de 2000 caracteres.'::text; END IF;
        IF char_length(v_sei) > 60 THEN v_erros_linha := v_erros_linha || 'O processo SEI passa de 60 caracteres.'::text; END IF;
        IF char_length(v_assinado_por) > 255 THEN v_erros_linha := v_erros_linha || '"Assinado por" passa de 255 caracteres.'::text; END IF;
        IF char_length(v_doe_num) > 60 THEN v_erros_linha := v_erros_linha || 'O Nº DOE passa de 60 caracteres.'::text; END IF;
        IF char_length(v_obs) > 2000 THEN v_erros_linha := v_erros_linha || 'As observações passam de 2000 caracteres.'::text; END IF;

        -- DOE: número e data juntos, data não anterior à da portaria
        IF (v_doe_num IS NULL) <> (NULLIF(btrim(COALESCE(v_linha->>'doe_data', '')), '') IS NULL) THEN
          v_erros_linha := v_erros_linha || 'Informe o Nº DOE e a Data DOE juntos.'::text;
        END IF;
        IF v_doe_data < v_data_doc THEN
          v_erros_linha := v_erros_linha || 'A Data DOE é anterior à data da portaria.'::text;
        END IF;

        -- Situação: vazia = publicado com DOE, senão aguardando assinatura; revogada recusada
        v_status := NULLIF(btrim(COALESCE(v_linha->>'status', '')), '');
        -- status_informado: o front preenche a situação por padrão; só a situação vinda da planilha gera aviso
        IF jsonb_typeof(v_linha->'status_informado') = 'boolean' THEN
          v_status_inf := (v_linha->>'status_informado')::boolean;
        ELSIF jsonb_typeof(v_linha->'status_informado') IS NULL OR jsonb_typeof(v_linha->'status_informado') = 'null' THEN
          v_status_inf := v_status IS NOT NULL;
        ELSE
          v_erros_linha := v_erros_linha || '"status_informado" em formato inválido.'::text;
          v_status_inf := false;
        END IF;
        IF v_status IS NULL THEN
          v_status := CASE WHEN v_doe_num IS NOT NULL AND v_doe_data IS NOT NULL THEN 'publicado' ELSE 'aguardando_assinatura' END;
        ELSIF v_status = 'revogado' THEN
          v_erros_linha := v_erros_linha || 'Portaria revogada não se importa; registre a revogação na tela da portaria.'::text;
          v_status := NULL;
        ELSIF NOT v_status = ANY (c_status) THEN
          v_erros_linha := v_erros_linha || format('Situação "%s" não se importa (use aguardando_assinatura, assinado, publicado ou vigente).', left(v_status, 40));
          v_status := NULL;
        END IF;
        IF v_status = 'assinado' AND (v_assinado_por IS NULL OR v_data_ass IS NULL) THEN
          v_erros_linha := v_erros_linha || 'Situação Assinada exige "Assinado por" e "Data da assinatura".'::text;
        END IF;
        IF v_status IN ('publicado', 'vigente') AND (v_doe_num IS NULL OR v_doe_data IS NULL) THEN
          v_erros_linha := v_erros_linha || 'Situação Publicada ou Vigente exige o Nº DOE e a Data DOE.'::text;
        END IF;
        IF v_status = 'vigente' AND v_vig_ini IS NULL THEN
          v_erros_linha := v_erros_linha || 'Situação Vigente exige o início da vigência.'::text;
        END IF;
        IF v_vig_fim < v_vig_ini THEN
          v_erros_linha := v_erros_linha || 'O fim da vigência é anterior ao início.'::text;
        END IF;

        -- Matrículas -> servidores (só matrícula; CPF nunca)
        v_mats := '{}';
        v_serv_ids := '{}';
        IF v_linha ? 'matriculas' AND jsonb_typeof(v_linha->'matriculas') NOT IN ('array', 'null') THEN
          v_erros_linha := v_erros_linha || 'Matrículas em formato inválido.'::text;
        ELSIF jsonb_typeof(v_linha->'matriculas') = 'array' THEN
          IF jsonb_array_length(v_linha->'matriculas') > 500 THEN
            v_erros_linha := v_erros_linha || 'Mais de 500 matrículas numa portaria.'::text;
          ELSE
            FOR v_mat IN SELECT btrim(value #>> '{}') FROM jsonb_array_elements(v_linha->'matriculas') LOOP
              CONTINUE WHEN v_mat IS NULL OR v_mat = '';
              IF v_mat ~ '[,;[:space:][:cntrl:]]' OR char_length(v_mat) > 30 THEN
                v_erros_linha := v_erros_linha || format('Matrícula "%s" inválida (separe as matrículas por ";").', left(v_mat, 30));
              ELSIF NOT v_mat = ANY (v_mats) THEN
                v_mats := v_mats || v_mat;
              END IF;
            END LOOP;
          END IF;
        END IF;
        FOREACH v_mat IN ARRAY v_mats LOOP
          -- conta antes: matrícula repetida no cadastro não escolhe um servidor qualquer
          SELECT count(*) INTO v_n FROM public.servidores s WHERE s.matricula = v_mat;
          IF v_n = 0 THEN
            v_erros_linha := v_erros_linha || format('Matrícula %s não encontrada.', v_mat);
          ELSIF v_n > 1 THEN
            v_erros_linha := v_erros_linha || format('Matrícula %s ambígua no cadastro (mais de um servidor); corrija no RH antes de importar.', v_mat);
          ELSE
            SELECT s.id, s.ativo, s.situacao::text AS situacao INTO STRICT v_serv
              FROM public.servidores s WHERE s.matricula = v_mat;
            v_serv_ids := v_serv_ids || v_serv.id;
            IF v_serv.ativo IS FALSE OR v_serv.situacao IN ('exonerado', 'aposentado', 'falecido', 'inativo') THEN
              -- a situação funcional é dado do RH: só com o módulo rh
              v_avisos := v_avisos || CASE WHEN v_rh
                THEN format('Matrícula %s: servidor não está ativo (situação: %s).', v_mat, v_serv.situacao)
                ELSE format('Servidor da matrícula %s não está ativo.', v_mat) END;
            END IF;
          END IF;
        END LOOP;

        IF v_cat = ANY (c_pessoal) AND cardinality(v_mats) = 0 THEN
          v_avisos := v_avisos || 'Portaria de pessoal sem matrícula: nenhum servidor será vinculado.'::text;
        END IF;
        IF v_obs IS NOT NULL THEN
          v_avisos := v_avisos || 'Observações preenchidas: não coloque CPF, endereço ou outro dado pessoal.'::text;
        END IF;

        IF cardinality(v_erros_linha) > 0 THEN
          SELECT v_erros || COALESCE(jsonb_agg(jsonb_build_object('indice', v_ind, 'mensagem', e)), '[]'::jsonb)
            INTO v_erros FROM unnest(v_erros_linha) AS e;
          CONTINUE;
        END IF;

        -- Pendência PENDENTE/AAAA da mesma categoria com o mesmo servidor (premissa 4): só aviso
        FOR v_pend IN
          SELECT d.numero, s.matricula
            FROM public.documentos d
            JOIN public.servidores s ON s.id = ANY (d.servidores_ids)
           WHERE d.tipo = 'portaria' AND d.numero ~ '^PENDENTE' AND d.categoria::text = v_cat
             AND d.status::text <> 'revogado' AND s.id = ANY (v_serv_ids)
           ORDER BY s.matricula, d.numero
        LOOP
          v_avisos := v_avisos || format('Existe a pendência %s (%s) com a matrícula %s: conclua ou cancele na tela da portaria.',
                                         v_pend.numero, v_cat, v_pend.matricula);
        END LOOP;

        -- Portaria existente: número exato; senão, o gravado fora do padrão
        SELECT * INTO v_doc FROM public.documentos d WHERE d.tipo = 'portaria' AND d.numero = v_num;
        v_achou := FOUND;
        IF NOT v_achou AND v_legado ? v_num THEN
          SELECT * INTO v_doc FROM public.documentos d WHERE d.id = (v_legado->>v_num)::uuid;
          v_achou := FOUND;
        END IF;

        v_doc_id := NULL;
        IF NOT v_achou THEN
          v_acao := 'inserir';
          v_mudancas := jsonb_strip_nulls(jsonb_build_object(
            'numero', jsonb_build_array(NULL, v_num),
            'data_documento', jsonb_build_array(NULL, v_data_doc),
            'categoria', jsonb_build_array(NULL, v_cat),
            'status', jsonb_build_array(NULL, v_status),
            'titulo', jsonb_build_array(NULL, COALESCE(v_ementa, 'Portaria nº ' || v_num)),
            'ementa', CASE WHEN v_ementa IS NOT NULL THEN jsonb_build_array(NULL, v_ementa) END,
            'processo_sei', CASE WHEN v_sei IS NOT NULL THEN jsonb_build_array(NULL, v_sei) END,
            'assinado_por', CASE WHEN v_assinado_por IS NOT NULL THEN jsonb_build_array(NULL, v_assinado_por) END,
            'data_assinatura', CASE WHEN v_data_ass IS NOT NULL THEN jsonb_build_array(NULL, v_data_ass) END,
            'doe_numero', CASE WHEN v_doe_num IS NOT NULL THEN jsonb_build_array(NULL, v_doe_num) END,
            'doe_data', CASE WHEN v_doe_data IS NOT NULL THEN jsonb_build_array(NULL, v_doe_data) END,
            'data_vigencia_inicio', CASE WHEN v_vig_ini IS NOT NULL THEN jsonb_build_array(NULL, v_vig_ini) END,
            'data_vigencia_fim', CASE WHEN v_vig_fim IS NOT NULL THEN jsonb_build_array(NULL, v_vig_fim) END,
            'servidores_ids', CASE WHEN cardinality(v_mats) > 0 THEN jsonb_build_array(NULL, to_jsonb(v_mats)) END));
          INSERT INTO public.documentos (
            tipo, numero, titulo, ementa, categoria, status, data_documento, processo_sei,
            assinado_por, data_assinatura, doe_numero, doe_data, data_publicacao,
            data_vigencia_inicio, data_vigencia_fim, servidores_ids, observacoes
          ) VALUES (
            'portaria', v_num, COALESCE(v_ementa, 'Portaria nº ' || v_num), v_ementa,
            v_cat::public.categoria_portaria, v_status::public.status_documento, v_data_doc, v_sei,
            v_assinado_por, v_data_ass, v_doe_num, v_doe_data, v_doe_data,
            v_vig_ini, v_vig_fim, v_serv_ids, v_obs
          ) RETURNING id INTO v_doc_id;
        ELSE
          -- Existente: nunca muda categoria nem status, nunca remove servidor; só preenche o vazio
          IF v_doc.status::text = 'revogado' THEN
            v_avisos := v_avisos || format('A portaria %s está revogada no sistema: nada é alterado.', v_doc.numero);
            v_upd := '{}'::jsonb;
          ELSE
            v_upd := '{}'::jsonb;
            IF v_sei IS NOT NULL AND NULLIF(btrim(COALESCE(v_doc.processo_sei, '')), '') IS NULL THEN
              v_upd := v_upd || jsonb_build_object('processo_sei', v_sei);
            END IF;
            IF v_ementa IS NOT NULL AND NULLIF(btrim(COALESCE(v_doc.ementa, '')), '') IS NULL THEN
              v_upd := v_upd || jsonb_build_object('ementa', v_ementa);
              -- o título padrão ("Portaria nº X") acompanha a ementa, como na inserção
              IF v_doc.titulo IS NULL OR btrim(v_doc.titulo) IN ('', 'Portaria nº ' || v_doc.numero, 'Portaria nº ' || v_num) THEN
                v_upd := v_upd || jsonb_build_object('titulo', v_ementa);
              END IF;
            END IF;
            IF v_doe_num IS NOT NULL AND v_doc.status::text IN ('publicado', 'vigente')
               AND NULLIF(btrim(COALESCE(v_doc.doe_numero, '')), '') IS NULL AND v_doc.doe_data IS NULL THEN
              v_upd := v_upd || jsonb_build_object('doe_numero', v_doe_num, 'doe_data', v_doe_data);
              IF v_doc.data_publicacao IS NULL THEN
                v_upd := v_upd || jsonb_build_object('data_publicacao', v_doe_data);
              END IF;
            END IF;
            IF v_vig_ini IS NOT NULL AND v_doc.data_vigencia_inicio IS NULL THEN
              v_upd := v_upd || jsonb_build_object('data_vigencia_inicio', v_vig_ini);
            END IF;
            IF v_vig_fim IS NOT NULL AND v_doc.data_vigencia_fim IS NULL THEN
              v_upd := v_upd || jsonb_build_object('data_vigencia_fim', v_vig_fim);
            END IF;
            IF COALESCE((v_upd->>'data_vigencia_fim')::date, v_doc.data_vigencia_fim)
               < COALESCE((v_upd->>'data_vigencia_inicio')::date, v_doc.data_vigencia_inicio) THEN
              RAISE EXCEPTION 'O fim da vigência fica anterior ao início da vigência registrada no sistema.' USING ERRCODE = '22023';
            END IF;
            SELECT COALESCE(array_agg(x.id ORDER BY x.o), '{}') INTO v_novos
              FROM unnest(v_serv_ids) WITH ORDINALITY AS x(id, o)
             WHERE NOT x.id = ANY (COALESCE(v_doc.servidores_ids, '{}'));
            IF cardinality(v_novos) > 0 THEN
              v_upd := v_upd || jsonb_build_object('servidores_ids', to_jsonb(COALESCE(v_doc.servidores_ids, '{}') || v_novos));
            END IF;

            IF v_status_inf AND v_status IS DISTINCT FROM v_doc.status::text THEN
              v_avisos := v_avisos || format('Situação no sistema: %s; na planilha: %s. A importação não muda a situação: avance na tela da portaria.',
                                             COALESCE(c_rotulo->>v_doc.status::text, v_doc.status::text),
                                             COALESCE(c_rotulo->>v_status, v_status));
            END IF;
            IF v_cat IS DISTINCT FROM v_doc.categoria::text THEN
              v_avisos := v_avisos || format('Categoria no sistema: %s; na planilha: %s. A importação não muda a categoria.',
                                             COALESCE(v_doc.categoria::text, '(vazia)'), v_cat);
            END IF;
            IF v_data_doc IS DISTINCT FROM v_doc.data_documento THEN
              v_avisos := v_avisos || format('Data da portaria no sistema: %s; na planilha: %s. A data não é alterada.',
                                             to_char(v_doc.data_documento, 'DD/MM/YYYY'), to_char(v_data_doc, 'DD/MM/YYYY'));
            END IF;
            IF v_doe_num IS NOT NULL AND NOT v_upd ? 'doe_numero'
               AND (v_doe_num IS DISTINCT FROM v_doc.doe_numero OR v_doe_data IS DISTINCT FROM v_doc.doe_data) THEN
              v_avisos := v_avisos || CASE WHEN v_doc.status::text IN ('publicado', 'vigente')
                THEN 'O DOE da planilha difere do registrado no sistema, que não é alterado.'
                ELSE 'O DOE só é registrado com a portaria publicada: avance na tela da portaria.' END;
            END IF;
          END IF;

          -- mudanças para exibição: servidores por matrícula (nunca UUID nem CPF). Sem o módulo rh, os já
          -- vinculados que não vieram na planilha aparecem só contados ("N servidor(es) já vinculados").
          SELECT COALESCE(jsonb_object_agg(k, jsonb_build_array(to_jsonb(v_doc) -> k, v_upd -> k)), '{}'::jsonb)
            INTO v_mudancas FROM jsonb_object_keys(v_upd) AS k WHERE k <> 'servidores_ids';
          IF v_upd ? 'servidores_ids' THEN
            SELECT COALESCE(array_agg(s.matricula ORDER BY x.o) FILTER (WHERE v_rh OR x.id = ANY (v_serv_ids)), '{}'),
                   count(*) FILTER (WHERE NOT (v_rh OR x.id = ANY (v_serv_ids)))
              INTO v_mats_antes, v_ocultos
              FROM unnest(COALESCE(v_doc.servidores_ids, '{}')) WITH ORDINALITY AS x(id, o)
              JOIN public.servidores s ON s.id = x.id;
            IF v_ocultos > 0 THEN
              v_mats_antes := ARRAY[format('%s servidor(es) já vinculados', v_ocultos)] || v_mats_antes;
            END IF;
            v_mudancas := v_mudancas || jsonb_build_object('servidores_ids', jsonb_build_array(
              to_jsonb(v_mats_antes),
              to_jsonb(v_mats_antes || ARRAY(SELECT s.matricula FROM unnest(v_novos) WITH ORDINALITY AS x(id, o)
                                               JOIN public.servidores s ON s.id = x.id ORDER BY x.o))));
          END IF;

          IF v_upd = '{}'::jsonb THEN
            v_acao := 'sem_alteracao';
          ELSE
            v_acao := 'atualizar';
            v_doc_id := v_doc.id;
            UPDATE public.documentos d SET
              processo_sei         = COALESCE(v_upd->>'processo_sei', d.processo_sei),
              ementa               = COALESCE(v_upd->>'ementa', d.ementa),
              titulo               = COALESCE(v_upd->>'titulo', d.titulo),
              doe_numero           = COALESCE(v_upd->>'doe_numero', d.doe_numero),
              doe_data             = COALESCE((v_upd->>'doe_data')::date, d.doe_data),
              data_publicacao      = COALESCE((v_upd->>'data_publicacao')::date, d.data_publicacao),
              data_vigencia_inicio = COALESCE((v_upd->>'data_vigencia_inicio')::date, d.data_vigencia_inicio),
              data_vigencia_fim    = COALESCE((v_upd->>'data_vigencia_fim')::date, d.data_vigencia_fim),
              servidores_ids       = CASE WHEN v_upd ? 'servidores_ids'
                                          THEN COALESCE(d.servidores_ids, '{}') || v_novos ELSE d.servidores_ids END
             WHERE d.id = v_doc.id;
          END IF;
        END IF;

        -- só chega aqui se a gravação da linha passou pelos triggers
        CASE v_acao
          WHEN 'inserir' THEN v_ins := v_ins + 1;
          WHEN 'atualizar' THEN v_atu := v_atu + 1;
          ELSE v_igual := v_igual + 1;
        END CASE;
        v_linhas_res := v_linhas_res || jsonb_strip_nulls(jsonb_build_object(
          'indice', v_ind, 'acao', v_acao,
          'mudancas', CASE WHEN v_mudancas <> '{}'::jsonb THEN v_mudancas END,
          'avisos', CASE WHEN cardinality(v_avisos) > 0 THEN to_jsonb(v_avisos) END));
        v_detalhes := v_detalhes || jsonb_strip_nulls(jsonb_build_object(
          'indice', v_ind, 'numero', v_num, 'acao', v_acao, 'documento_id', COALESCE(v_doc_id, v_doc.id),
          'campos', CASE WHEN v_mudancas <> '{}'::jsonb
                         THEN (SELECT jsonb_agg(k ORDER BY k) FROM jsonb_object_keys(v_mudancas) AS k) END));
      EXCEPTION
        WHEN OTHERS THEN
          -- texto do Postgres só para as classes esperadas; o resto não expõe detalhe interno
          v_erros := v_erros || jsonb_build_object('indice', v_ind, 'mensagem',
            CASE WHEN SQLSTATE = '23505' THEN format('Já existe portaria com o número %s.', COALESCE(v_num, '?'))
                 WHEN left(SQLSTATE, 2) IN ('22', '23') OR SQLSTATE IN ('P0001', 'RHS01', '42501') THEN SQLERRM
                 ELSE format('Erro inesperado ao gravar a linha (código %s).', SQLSTATE) END);
      END;
    END LOOP;

    IF p_simular OR jsonb_array_length(v_erros) > 0 THEN
      RAISE EXCEPTION 'importação desfeita' USING ERRCODE = 'PTI01';
    END IF;
  EXCEPTION
    WHEN SQLSTATE 'PTI01' THEN NULL;  -- desfaz tudo o que as linhas gravaram; as variáveis continuam valendo
  END;

  v_totais := jsonb_build_object('inserir', v_ins, 'atualizar', v_atu, 'sem_alteracao', v_igual);

  IF NOT p_simular AND jsonb_array_length(v_erros) = 0 THEN
    INSERT INTO public.importacoes
      (tipo, modulo, arquivo_nome, arquivo_sha256, arquivo_tamanho, exercicio, resumo, detalhes, created_by)
    VALUES
      ('portarias_planilha', 'gabinete', p_arquivo->>'nome', p_arquivo->>'sha256', (p_arquivo->>'tamanho')::bigint,
       NULL, jsonb_build_object('totais', v_totais), v_detalhes, v_uid)
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

COMMENT ON FUNCTION public.importar_portarias_planilha(jsonb, jsonb, boolean) IS
  'Importa portarias de planilha para documentos (p_simular = true só calcula; aplicação é tudo ou nada). Servidor só por matrícula. Exige o módulo gabinete e gabinete.portarias.importar.';

REVOKE ALL ON FUNCTION public.importar_portarias_planilha(jsonb, jsonb, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.importar_portarias_planilha(jsonb, jsonb, boolean) TO authenticated;
