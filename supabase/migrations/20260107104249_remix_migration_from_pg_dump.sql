CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_permission; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_permission AS ENUM (
    'users.read',
    'users.create',
    'users.update',
    'users.delete',
    'content.read',
    'content.create',
    'content.update',
    'content.delete',
    'reports.view',
    'reports.export',
    'settings.view',
    'settings.edit',
    'processes.read',
    'processes.create',
    'processes.update',
    'processes.delete',
    'processes.approve'
);


--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'manager',
    'user',
    'guest'
);


--
-- Name: categoria_cargo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.categoria_cargo AS ENUM (
    'efetivo',
    'comissionado',
    'funcao_gratificada',
    'temporario',
    'estagiario'
);


--
-- Name: categoria_portaria; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.categoria_portaria AS ENUM (
    'estruturante',
    'normativa',
    'pessoal',
    'delegacao'
);


--
-- Name: estado_conservacao; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.estado_conservacao AS ENUM (
    'otimo',
    'bom',
    'regular',
    'ruim',
    'inservivel'
);


--
-- Name: situacao_funcional; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.situacao_funcional AS ENUM (
    'ativo',
    'afastado',
    'cedido',
    'licenca',
    'ferias',
    'exonerado',
    'aposentado',
    'falecido'
);


--
-- Name: situacao_patrimonio; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.situacao_patrimonio AS ENUM (
    'em_uso',
    'em_estoque',
    'cedido',
    'em_manutencao',
    'baixado'
);


--
-- Name: status_agenda; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_agenda AS ENUM (
    'solicitado',
    'aprovado',
    'rejeitado',
    'cancelado',
    'concluido'
);


--
-- Name: status_documento; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_documento AS ENUM (
    'rascunho',
    'aguardando_publicacao',
    'publicado',
    'vigente',
    'revogado'
);


--
-- Name: status_nomeacao; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_nomeacao AS ENUM (
    'ativo',
    'encerrado',
    'revogado'
);


--
-- Name: status_ponto; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_ponto AS ENUM (
    'completo',
    'incompleto',
    'pendente_justificativa',
    'justificado',
    'aprovado'
);


--
-- Name: status_solicitacao; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_solicitacao AS ENUM (
    'pendente',
    'aprovada',
    'rejeitada',
    'cancelada'
);


--
-- Name: status_termo_cessao; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_termo_cessao AS ENUM (
    'pendente',
    'emitido',
    'assinado',
    'cancelado'
);


--
-- Name: status_unidade_local; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.status_unidade_local AS ENUM (
    'ativa',
    'inativa',
    'manutencao',
    'interditada'
);


--
-- Name: tipo_afastamento; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_afastamento AS ENUM (
    'licenca',
    'suspensao',
    'cessao',
    'disposicao',
    'servico_externo',
    'missao',
    'outro'
);


--
-- Name: tipo_ato_nomeacao; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_ato_nomeacao AS ENUM (
    'portaria',
    'decreto',
    'ato',
    'outro'
);


--
-- Name: tipo_documento; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_documento AS ENUM (
    'portaria',
    'resolucao',
    'instrucao_normativa',
    'ordem_servico',
    'comunicado',
    'decreto',
    'lei',
    'outro'
);


--
-- Name: tipo_justificativa; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_justificativa AS ENUM (
    'atestado',
    'declaracao',
    'trabalho_externo',
    'esquecimento',
    'problema_sistema',
    'outro'
);


--
-- Name: tipo_lancamento_horas; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_lancamento_horas AS ENUM (
    'credito',
    'debito',
    'ajuste'
);


--
-- Name: tipo_licenca; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_licenca AS ENUM (
    'maternidade',
    'paternidade',
    'medica',
    'casamento',
    'luto',
    'interesse_particular',
    'capacitacao',
    'premio',
    'mandato_eletivo',
    'mandato_classista',
    'outra'
);


--
-- Name: tipo_movimentacao_funcional; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_movimentacao_funcional AS ENUM (
    'nomeacao',
    'exoneracao',
    'designacao',
    'dispensa',
    'promocao',
    'transferencia',
    'cessao',
    'requisicao',
    'redistribuicao',
    'remocao',
    'afastamento',
    'retorno',
    'aposentadoria',
    'vacancia'
);


--
-- Name: tipo_portaria_rh; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_portaria_rh AS ENUM (
    'nomeacao',
    'exoneracao',
    'designacao',
    'dispensa',
    'ferias',
    'viagem',
    'cessao',
    'afastamento',
    'substituicao',
    'gratificacao',
    'comissao',
    'outro'
);


--
-- Name: tipo_registro_ponto; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_registro_ponto AS ENUM (
    'normal',
    'feriado',
    'folga',
    'atestado',
    'falta',
    'ferias',
    'licenca'
);


--
-- Name: tipo_unidade; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_unidade AS ENUM (
    'presidencia',
    'diretoria',
    'departamento',
    'setor',
    'divisao',
    'secao',
    'coordenacao'
);


--
-- Name: tipo_unidade_local; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tipo_unidade_local AS ENUM (
    'ginasio',
    'estadio',
    'parque_aquatico',
    'piscina',
    'complexo',
    'quadra',
    'outro'
);


--
-- Name: vinculo_funcional; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.vinculo_funcional AS ENUM (
    'efetivo',
    'comissionado',
    'cedido',
    'temporario',
    'estagiario',
    'requisitado'
);


--
-- Name: atualizar_situacao_servidor(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_situacao_servidor() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Atualizar situação baseado no afastamento/licença
  IF TG_TABLE_NAME = 'licencas_afastamentos' THEN
    IF NEW.status = 'ativa' THEN
      UPDATE public.servidores 
      SET situacao = 
        CASE 
          WHEN NEW.tipo_afastamento = 'cessao' THEN 'cedido'::situacao_funcional
          WHEN NEW.tipo_afastamento = 'licenca' THEN 'licenca'::situacao_funcional
          ELSE 'afastado'::situacao_funcional
        END,
        updated_at = now()
      WHERE id = NEW.servidor_id;
    ELSIF NEW.status = 'encerrada' THEN
      UPDATE public.servidores 
      SET situacao = 'ativo'::situacao_funcional,
          updated_at = now()
      WHERE id = NEW.servidor_id;
    END IF;
  -- Atualizar situação baseado nas férias
  ELSIF TG_TABLE_NAME = 'ferias_servidor' THEN
    IF NEW.status = 'em_gozo' THEN
      UPDATE public.servidores 
      SET situacao = 'ferias'::situacao_funcional,
          updated_at = now()
      WHERE id = NEW.servidor_id;
    ELSIF NEW.status = 'concluida' THEN
      UPDATE public.servidores 
      SET situacao = 'ativo'::situacao_funcional,
          updated_at = now()
      WHERE id = NEW.servidor_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: calcular_horas_trabalhadas(timestamp with time zone, timestamp with time zone, timestamp with time zone, timestamp with time zone, timestamp with time zone, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calcular_horas_trabalhadas(p_entrada1 timestamp with time zone, p_saida1 timestamp with time zone, p_entrada2 timestamp with time zone, p_saida2 timestamp with time zone, p_entrada3 timestamp with time zone DEFAULT NULL::timestamp with time zone, p_saida3 timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS numeric
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  total_minutos INTEGER := 0;
BEGIN
  -- Período 1
  IF p_entrada1 IS NOT NULL AND p_saida1 IS NOT NULL THEN
    total_minutos := total_minutos + EXTRACT(EPOCH FROM (p_saida1 - p_entrada1)) / 60;
  END IF;
  
  -- Período 2
  IF p_entrada2 IS NOT NULL AND p_saida2 IS NOT NULL THEN
    total_minutos := total_minutos + EXTRACT(EPOCH FROM (p_saida2 - p_entrada2)) / 60;
  END IF;
  
  -- Período 3
  IF p_entrada3 IS NOT NULL AND p_saida3 IS NOT NULL THEN
    total_minutos := total_minutos + EXTRACT(EPOCH FROM (p_saida3 - p_entrada3)) / 60;
  END IF;
  
  RETURN ROUND(total_minutos / 60.0, 2);
END;
$$;


--
-- Name: encerrar_nomeacao_anterior(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.encerrar_nomeacao_anterior() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Encerrar nomeação ativa anterior para a mesma unidade
  IF NEW.status = 'ativo' THEN
    UPDATE public.nomeacoes_chefe_unidade
    SET 
      status = 'encerrado',
      data_fim = NEW.data_inicio - INTERVAL '1 day',
      updated_at = now()
    WHERE unidade_local_id = NEW.unidade_local_id
      AND status = 'ativo'
      AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: gerar_protocolo_cedencia(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.gerar_protocolo_cedencia(p_unidade_id uuid) RETURNS character varying
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_ano INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
  v_sequencial INTEGER;
  v_protocolo VARCHAR(50);
BEGIN
  SELECT COUNT(*) + 1 INTO v_sequencial
  FROM public.agenda_unidade
  WHERE ano_vigencia = v_ano
    AND numero_protocolo IS NOT NULL;
  
  v_protocolo := v_ano || '.' || LPAD(v_sequencial::TEXT, 5, '0');
  
  RETURN v_protocolo;
END;
$$;


--
-- Name: get_chefe_unidade_atual(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_chefe_unidade_atual(p_unidade_id uuid) RETURNS TABLE(nomeacao_id uuid, servidor_id uuid, servidor_nome text, cargo text, data_inicio date, ato_numero text)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT 
    n.id as nomeacao_id,
    n.servidor_id,
    s.nome_completo as servidor_nome,
    n.cargo,
    n.data_inicio,
    n.ato_numero
  FROM public.nomeacoes_chefe_unidade n
  JOIN public.servidores s ON s.id = n.servidor_id
  WHERE n.unidade_local_id = p_unidade_id
    AND n.status = 'ativo'
  ORDER BY n.data_inicio DESC
  LIMIT 1;
$$;


--
-- Name: get_hierarquia_unidade(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_hierarquia_unidade(p_unidade_id uuid) RETURNS TABLE(id uuid, nome text, tipo public.tipo_unidade, nivel integer)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  WITH RECURSIVE hierarquia AS (
    SELECT e.id, e.nome, e.tipo, e.nivel, e.superior_id
    FROM public.estrutura_organizacional e
    WHERE e.id = p_unidade_id
    
    UNION ALL
    
    SELECT e.id, e.nome, e.tipo, e.nivel, e.superior_id
    FROM public.estrutura_organizacional e
    INNER JOIN hierarquia h ON e.id = h.superior_id
  )
  SELECT h.id, h.nome, h.tipo, h.nivel
  FROM hierarquia h
  ORDER BY h.nivel;
$$;


--
-- Name: get_subordinados_unidade(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_subordinados_unidade(p_unidade_id uuid) RETURNS TABLE(id uuid, nome text, tipo public.tipo_unidade, nivel integer)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  WITH RECURSIVE subordinados AS (
    SELECT e.id, e.nome, e.tipo, e.nivel, e.superior_id
    FROM public.estrutura_organizacional e
    WHERE e.id = p_unidade_id
    
    UNION ALL
    
    SELECT e.id, e.nome, e.tipo, e.nivel, e.superior_id
    FROM public.estrutura_organizacional e
    INNER JOIN subordinados s ON e.superior_id = s.id
  )
  SELECT s.id, s.nome, s.tipo, s.nivel
  FROM subordinados s
  ORDER BY s.nivel, s.nome;
$$;


--
-- Name: get_user_permissions(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_permissions(_user_id uuid) RETURNS text[]
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT ARRAY_AGG(DISTINCT permission::TEXT)
  FROM (
    SELECT permission FROM public.user_permissions WHERE user_id = _user_id
    UNION
    SELECT rp.permission FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = _user_id
  ) perms
$$;


--
-- Name: get_user_role(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_user_role(_user_id uuid) RETURNS public.app_role
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email);
  
  -- Atribuir role padrão 'user'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;


--
-- Name: has_permission(uuid, public.app_permission); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_permission(_user_id uuid, _permission public.app_permission) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    -- Permissão direta do usuário
    SELECT 1 FROM public.user_permissions
    WHERE user_id = _user_id AND permission = _permission
    UNION
    -- Permissão herdada do role
    SELECT 1 FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = _user_id AND rp.permission = _permission
  )
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: registrar_historico_status(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.registrar_historico_status() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_historico JSONB;
  v_novo_registro JSONB;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    v_historico := COALESCE(NEW.historico_status, '[]'::jsonb);
    
    v_novo_registro := jsonb_build_object(
      'status_anterior', OLD.status,
      'status_novo', NEW.status,
      'data', NOW(),
      'usuario_id', auth.uid()
    );
    
    NEW.historico_status := v_historico || v_novo_registro;
  END IF;
  
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: verificar_conflito_agenda(uuid, timestamp with time zone, timestamp with time zone, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.verificar_conflito_agenda(p_unidade_id uuid, p_data_inicio timestamp with time zone, p_data_fim timestamp with time zone, p_agenda_id uuid DEFAULT NULL::uuid) RETURNS TABLE(tem_conflito boolean, agendas_conflitantes jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_conflitos JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', a.id,
      'titulo', a.titulo,
      'data_inicio', a.data_inicio,
      'data_fim', a.data_fim,
      'solicitante', a.solicitante_nome,
      'status', a.status
    )
  ) INTO v_conflitos
  FROM public.agenda_unidade a
  WHERE a.unidade_local_id = p_unidade_id
    AND a.status::text NOT IN ('cancelado', 'rejeitado')
    AND (p_agenda_id IS NULL OR a.id != p_agenda_id)
    AND (a.data_inicio <= p_data_fim AND a.data_fim >= p_data_inicio);
  
  RETURN QUERY SELECT 
    v_conflitos IS NOT NULL AND jsonb_array_length(v_conflitos) > 0,
    COALESCE(v_conflitos, '[]'::jsonb);
END;
$$;


SET default_table_access_method = heap;

--
-- Name: agenda_unidade; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agenda_unidade (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    unidade_local_id uuid NOT NULL,
    titulo text NOT NULL,
    descricao text,
    tipo_uso text NOT NULL,
    solicitante_nome text NOT NULL,
    solicitante_documento text,
    solicitante_telefone text,
    solicitante_email text,
    data_inicio timestamp with time zone NOT NULL,
    data_fim timestamp with time zone NOT NULL,
    area_utilizada text,
    publico_estimado integer,
    status public.status_agenda DEFAULT 'solicitado'::public.status_agenda NOT NULL,
    aprovador_id uuid,
    data_aprovacao timestamp with time zone,
    motivo_rejeicao text,
    observacoes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    numero_protocolo character varying(50),
    tipo_solicitante character varying(30) DEFAULT 'pessoa_fisica'::character varying,
    solicitante_razao_social character varying(200),
    solicitante_cnpj character varying(20),
    solicitante_endereco text,
    responsavel_legal character varying(200),
    responsavel_legal_documento character varying(20),
    finalidade_detalhada text,
    espaco_especifico character varying(100),
    horario_diario character varying(50),
    historico_status jsonb DEFAULT '[]'::jsonb,
    documentos_anexos jsonb DEFAULT '[]'::jsonb,
    ano_vigencia integer DEFAULT EXTRACT(year FROM CURRENT_DATE),
    encerrado_automaticamente boolean DEFAULT false
);


--
-- Name: banco_horas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.banco_horas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    mes integer NOT NULL,
    ano integer NOT NULL,
    saldo_anterior numeric(6,2) DEFAULT 0,
    horas_extras numeric(6,2) DEFAULT 0,
    horas_compensadas numeric(6,2) DEFAULT 0,
    saldo_atual numeric(6,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: cargos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cargos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    sigla text,
    cbo text,
    categoria public.categoria_cargo NOT NULL,
    nivel_hierarquico integer DEFAULT 1,
    escolaridade text,
    requisitos text[],
    conhecimentos_necessarios text[],
    experiencia_exigida text,
    vencimento_base numeric(12,2),
    atribuicoes text,
    competencias text[],
    responsabilidades text[],
    lei_criacao_numero text,
    lei_criacao_data date,
    lei_criacao_artigo text,
    lei_documento_url text,
    quantidade_vagas integer DEFAULT 1,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: composicao_cargos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.composicao_cargos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    unidade_id uuid NOT NULL,
    cargo_id uuid NOT NULL,
    quantidade_vagas integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: configuracao_jornada; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.configuracao_jornada (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    carga_horaria_semanal numeric(4,2) DEFAULT 40,
    horas_por_dia numeric(4,2) DEFAULT 8,
    dias_trabalho integer[] DEFAULT ARRAY[1, 2, 3, 4, 5],
    tolerancia_atraso integer DEFAULT 10,
    tolerancia_saida_antecipada integer DEFAULT 10,
    exige_localizacao boolean DEFAULT false,
    permite_ponto_remoto boolean DEFAULT true,
    exige_foto boolean DEFAULT false,
    permite_compensacao boolean DEFAULT true,
    limite_banco_horas numeric(6,2) DEFAULT 40,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: documentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documentos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    numero text NOT NULL,
    titulo text NOT NULL,
    ementa text,
    tipo public.tipo_documento DEFAULT 'portaria'::public.tipo_documento NOT NULL,
    status public.status_documento DEFAULT 'rascunho'::public.status_documento NOT NULL,
    data_documento date DEFAULT CURRENT_DATE NOT NULL,
    data_publicacao date,
    data_vigencia_inicio date,
    data_vigencia_fim date,
    arquivo_url text,
    observacoes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    categoria public.categoria_portaria
);


--
-- Name: documentos_cedencia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documentos_cedencia (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agenda_id uuid NOT NULL,
    tipo_documento character varying(100) NOT NULL,
    nome_arquivo character varying(255) NOT NULL,
    url_arquivo text NOT NULL,
    tamanho_bytes bigint,
    mime_type character varying(100),
    versao integer DEFAULT 1,
    documento_principal boolean DEFAULT false,
    observacoes text,
    uploaded_by uuid,
    uploaded_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: estrutura_organizacional; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.estrutura_organizacional (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nome text NOT NULL,
    sigla text,
    tipo public.tipo_unidade NOT NULL,
    nivel integer DEFAULT 1 NOT NULL,
    superior_id uuid,
    descricao text,
    competencias text[],
    atribuicoes text,
    cargo_chefe_id uuid,
    servidor_responsavel_id uuid,
    lei_criacao_numero text,
    lei_criacao_data date,
    lei_criacao_artigo text,
    lei_criacao_ementa text,
    lei_documento_url text,
    telefone text,
    ramal text,
    email text,
    localizacao text,
    ordem integer DEFAULT 0,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    data_extincao date
);


--
-- Name: feriados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feriados (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    data date NOT NULL,
    nome text NOT NULL,
    tipo text DEFAULT 'nacional'::text,
    recorrente boolean DEFAULT false,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: ferias_servidor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ferias_servidor (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    periodo_aquisitivo_inicio date NOT NULL,
    periodo_aquisitivo_fim date NOT NULL,
    data_inicio date NOT NULL,
    data_fim date NOT NULL,
    dias_gozados integer NOT NULL,
    abono_pecuniario boolean DEFAULT false,
    dias_abono integer,
    parcela integer DEFAULT 1,
    total_parcelas integer DEFAULT 1,
    portaria_numero text,
    portaria_data date,
    portaria_url text,
    status text DEFAULT 'programada'::text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT ferias_servidor_status_check CHECK ((status = ANY (ARRAY['programada'::text, 'em_gozo'::text, 'concluida'::text, 'interrompida'::text, 'cancelada'::text])))
);


--
-- Name: frequencia_mensal; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.frequencia_mensal (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    mes integer NOT NULL,
    ano integer NOT NULL,
    dias_trabalhados integer DEFAULT 0,
    dias_falta integer DEFAULT 0,
    dias_atestado integer DEFAULT 0,
    dias_folga integer DEFAULT 0,
    dias_ferias integer DEFAULT 0,
    dias_licenca integer DEFAULT 0,
    horas_trabalhadas numeric(6,2) DEFAULT 0,
    horas_extras numeric(6,2) DEFAULT 0,
    horas_devidas numeric(6,2) DEFAULT 0,
    total_atrasos integer DEFAULT 0,
    total_saidas_antecipadas integer DEFAULT 0,
    percentual_presenca numeric(5,2) DEFAULT 0,
    fechado boolean DEFAULT false,
    data_fechamento timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: historico_funcional; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historico_funcional (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    tipo public.tipo_movimentacao_funcional NOT NULL,
    data_evento date NOT NULL,
    data_vigencia_inicio date,
    data_vigencia_fim date,
    cargo_anterior_id uuid,
    cargo_novo_id uuid,
    unidade_anterior_id uuid,
    unidade_nova_id uuid,
    portaria_numero text,
    portaria_data date,
    documento_url text,
    diario_oficial_numero text,
    diario_oficial_data date,
    descricao text,
    fundamentacao_legal text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid
);


--
-- Name: horarios_jornada; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.horarios_jornada (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    configuracao_id uuid NOT NULL,
    dia_semana integer NOT NULL,
    entrada1 time without time zone,
    saida1 time without time zone,
    entrada2 time without time zone,
    saida2 time without time zone
);


--
-- Name: justificativas_ponto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.justificativas_ponto (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    registro_ponto_id uuid NOT NULL,
    tipo public.tipo_justificativa NOT NULL,
    descricao text NOT NULL,
    arquivo_url text,
    status public.status_solicitacao DEFAULT 'pendente'::public.status_solicitacao,
    aprovador_id uuid,
    data_aprovacao timestamp with time zone,
    observacao_aprovador text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: lancamentos_banco_horas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lancamentos_banco_horas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    banco_horas_id uuid NOT NULL,
    data date NOT NULL,
    tipo public.tipo_lancamento_horas NOT NULL,
    horas numeric(5,2) NOT NULL,
    motivo text,
    registro_ponto_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: licencas_afastamentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.licencas_afastamentos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    tipo_afastamento public.tipo_afastamento NOT NULL,
    tipo_licenca public.tipo_licenca,
    data_inicio date NOT NULL,
    data_fim date,
    dias_afastamento integer,
    portaria_numero text,
    portaria_data date,
    portaria_url text,
    documento_comprobatorio_url text,
    cid text,
    medico_nome text,
    crm text,
    orgao_destino text,
    onus_origem boolean DEFAULT true,
    status text DEFAULT 'ativa'::text,
    fundamentacao_legal text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT licencas_afastamentos_status_check CHECK ((status = ANY (ARRAY['ativa'::text, 'encerrada'::text, 'prorrogada'::text, 'cancelada'::text])))
);


--
-- Name: lotacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lotacoes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    unidade_id uuid NOT NULL,
    cargo_id uuid,
    data_inicio date DEFAULT CURRENT_DATE NOT NULL,
    data_fim date,
    tipo_movimentacao text,
    documento_referencia text,
    observacao text,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: nomeacoes_chefe_unidade; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nomeacoes_chefe_unidade (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    unidade_local_id uuid NOT NULL,
    servidor_id uuid NOT NULL,
    cargo text DEFAULT 'Chefe de Unidade Local'::text NOT NULL,
    ato_nomeacao_tipo public.tipo_ato_nomeacao NOT NULL,
    ato_numero text NOT NULL,
    ato_data_publicacao date NOT NULL,
    ato_doe_numero text,
    ato_doe_data date,
    data_inicio date NOT NULL,
    data_fim date,
    status public.status_nomeacao DEFAULT 'ativo'::public.status_nomeacao NOT NULL,
    documento_nomeacao_url text,
    observacoes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: ocorrencias_servidor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ocorrencias_servidor (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    tipo text NOT NULL,
    data_ocorrencia date NOT NULL,
    descricao text NOT NULL,
    documento_url text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid
);


--
-- Name: patrimonio_unidade; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.patrimonio_unidade (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    unidade_local_id uuid NOT NULL,
    item text NOT NULL,
    numero_tombo text,
    categoria text,
    quantidade integer DEFAULT 1,
    estado_conservacao public.estado_conservacao DEFAULT 'bom'::public.estado_conservacao,
    situacao public.situacao_patrimonio DEFAULT 'em_uso'::public.situacao_patrimonio,
    descricao text,
    valor_estimado numeric(12,2),
    data_aquisicao date,
    anexos text[] DEFAULT '{}'::text[],
    observacoes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: portarias_servidor; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portarias_servidor (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    numero text NOT NULL,
    ano integer NOT NULL,
    data_publicacao date NOT NULL,
    tipo public.tipo_portaria_rh NOT NULL,
    assunto text NOT NULL,
    ementa text,
    conteudo text,
    data_vigencia_inicio date,
    data_vigencia_fim date,
    documento_url text,
    diario_oficial_numero text,
    diario_oficial_data date,
    historico_id uuid,
    status text DEFAULT 'vigente'::text,
    portaria_revogadora_id uuid,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT portarias_servidor_status_check CHECK ((status = ANY (ARRAY['vigente'::text, 'revogada'::text, 'substituida'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text,
    email text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: registros_ponto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registros_ponto (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    data date NOT NULL,
    entrada1 timestamp with time zone,
    saida1 timestamp with time zone,
    entrada2 timestamp with time zone,
    saida2 timestamp with time zone,
    entrada3 timestamp with time zone,
    saida3 timestamp with time zone,
    tipo public.tipo_registro_ponto DEFAULT 'normal'::public.tipo_registro_ponto,
    status public.status_ponto DEFAULT 'incompleto'::public.status_ponto,
    horas_trabalhadas numeric(5,2) DEFAULT 0,
    horas_extras numeric(5,2) DEFAULT 0,
    atrasos integer DEFAULT 0,
    saidas_antecipadas integer DEFAULT 0,
    observacao text,
    latitude numeric(10,8),
    longitude numeric(11,8),
    ip_address text,
    dispositivo text,
    aprovado boolean DEFAULT false,
    aprovador_id uuid,
    data_aprovacao timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    role public.app_role NOT NULL,
    permission public.app_permission NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: servidores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.servidores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    nome_completo text NOT NULL,
    nome_social text,
    data_nascimento date,
    sexo text,
    estado_civil text,
    nacionalidade text DEFAULT 'Brasileira'::text,
    naturalidade_cidade text,
    naturalidade_uf text,
    cpf text NOT NULL,
    rg text,
    rg_orgao_expedidor text,
    rg_uf text,
    rg_data_emissao date,
    titulo_eleitor text,
    titulo_zona text,
    titulo_secao text,
    pis_pasep text,
    ctps_numero text,
    ctps_serie text,
    ctps_uf text,
    cnh_numero text,
    cnh_categoria text,
    cnh_validade date,
    certificado_reservista text,
    email_pessoal text,
    email_institucional text,
    telefone_fixo text,
    telefone_celular text,
    telefone_emergencia text,
    contato_emergencia_nome text,
    contato_emergencia_parentesco text,
    endereco_logradouro text,
    endereco_numero text,
    endereco_complemento text,
    endereco_bairro text,
    endereco_cidade text,
    endereco_uf text,
    endereco_cep text,
    banco_codigo text,
    banco_nome text,
    banco_agencia text,
    banco_conta text,
    banco_tipo_conta text,
    matricula text,
    vinculo public.vinculo_funcional DEFAULT 'comissionado'::public.vinculo_funcional NOT NULL,
    situacao public.situacao_funcional DEFAULT 'ativo'::public.situacao_funcional NOT NULL,
    cargo_atual_id uuid,
    unidade_atual_id uuid,
    data_admissao date,
    data_posse date,
    data_exercicio date,
    data_desligamento date,
    carga_horaria integer DEFAULT 40,
    regime_juridico text,
    remuneracao_bruta numeric(12,2),
    gratificacoes numeric(12,2),
    descontos numeric(12,2),
    escolaridade text,
    formacao_academica text,
    instituicao_ensino text,
    ano_conclusao integer,
    cursos_especializacao text[],
    dependentes jsonb DEFAULT '[]'::jsonb,
    declaracao_bens_url text,
    declaracao_bens_data date,
    declaracao_acumulacao_url text,
    declaracao_acumulacao_data date,
    acumula_cargo boolean DEFAULT false,
    acumulo_descricao text,
    observacoes text,
    foto_url text,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    CONSTRAINT servidores_sexo_check CHECK ((sexo = ANY (ARRAY['M'::text, 'F'::text, 'O'::text])))
);


--
-- Name: solicitacoes_ajuste_ponto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solicitacoes_ajuste_ponto (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    registro_ponto_id uuid,
    data_ocorrido date NOT NULL,
    tipo_ajuste text NOT NULL,
    campo_ajuste text,
    horario_atual timestamp with time zone,
    horario_correto timestamp with time zone,
    motivo text NOT NULL,
    comprovante_url text,
    status public.status_solicitacao DEFAULT 'pendente'::public.status_solicitacao,
    aprovador_id uuid,
    data_aprovacao timestamp with time zone,
    observacao_aprovador text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: termos_cessao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.termos_cessao (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    agenda_id uuid NOT NULL,
    unidade_local_id uuid NOT NULL,
    numero_termo text NOT NULL,
    ano integer NOT NULL,
    cessionario_nome text NOT NULL,
    cessionario_documento text,
    cessionario_endereco text,
    cessionario_telefone text,
    finalidade text NOT NULL,
    periodo_inicio timestamp with time zone NOT NULL,
    periodo_fim timestamp with time zone NOT NULL,
    condicoes_uso text,
    responsabilidades text,
    chefe_responsavel_id uuid,
    status public.status_termo_cessao DEFAULT 'pendente'::public.status_termo_cessao NOT NULL,
    documento_gerado_url text,
    documento_assinado_url text,
    data_emissao timestamp with time zone,
    data_assinatura date,
    observacoes text,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    tipo_termo character varying(30) DEFAULT 'autorizacao'::character varying,
    numero_protocolo character varying(50),
    cessionario_tipo character varying(30) DEFAULT 'pessoa_fisica'::character varying,
    cessionario_email character varying(150),
    autoridade_concedente character varying(200),
    autoridade_cargo character varying(100),
    restricoes_uso text,
    termo_responsabilidade_aceito boolean DEFAULT false,
    data_aceite_responsabilidade timestamp with time zone,
    historico_renovacoes jsonb DEFAULT '[]'::jsonb
);


--
-- Name: unidades_locais; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unidades_locais (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    municipio text NOT NULL,
    tipo_unidade public.tipo_unidade_local NOT NULL,
    nome_unidade text NOT NULL,
    endereco_completo text,
    status public.status_unidade_local DEFAULT 'ativa'::public.status_unidade_local NOT NULL,
    capacidade integer,
    areas_disponiveis text[] DEFAULT '{}'::text[],
    horario_funcionamento text,
    regras_de_uso text,
    observacoes text,
    fotos text[] DEFAULT '{}'::text[],
    documentos text[] DEFAULT '{}'::text[],
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    updated_at timestamp with time zone DEFAULT now(),
    codigo_unidade character varying(50),
    natureza_uso character varying(50) DEFAULT 'esportivo'::character varying,
    diretoria_vinculada character varying(100),
    unidade_administrativa character varying(100),
    autoridade_autorizadora character varying(150),
    estrutura_disponivel text,
    historico_alteracoes jsonb DEFAULT '[]'::jsonb
);


--
-- Name: user_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    permission public.app_permission NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'user'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: v_cedencias_a_vencer; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_cedencias_a_vencer WITH (security_invoker='on') AS
 SELECT a.id AS agenda_id,
    a.numero_protocolo,
    a.titulo,
    a.solicitante_nome,
    a.data_inicio,
    a.data_fim,
    a.status,
    u.id AS unidade_id,
    u.nome_unidade,
    u.municipio,
    (date_part('day'::text, (((a.data_fim)::timestamp without time zone)::timestamp with time zone - CURRENT_TIMESTAMP)))::integer AS dias_para_vencer
   FROM (public.agenda_unidade a
     JOIN public.unidades_locais u ON ((u.id = a.unidade_local_id)))
  WHERE (((a.status)::text = 'aprovado'::text) AND (a.data_fim > CURRENT_TIMESTAMP) AND (date_part('day'::text, (((a.data_fim)::timestamp without time zone)::timestamp with time zone - CURRENT_TIMESTAMP)) <= (30)::double precision))
  ORDER BY a.data_fim;


--
-- Name: v_relatorio_uso_unidades; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_relatorio_uso_unidades WITH (security_invoker='on') AS
 SELECT u.id AS unidade_id,
    u.nome_unidade,
    u.municipio,
    u.tipo_unidade,
    u.status AS status_unidade,
    count(DISTINCT a.id) AS total_solicitacoes,
    count(DISTINCT
        CASE
            WHEN ((a.status)::text = 'aprovado'::text) THEN a.id
            ELSE NULL::uuid
        END) AS total_aprovadas,
    count(DISTINCT
        CASE
            WHEN ((a.status)::text = 'cancelado'::text) THEN a.id
            ELSE NULL::uuid
        END) AS total_canceladas,
    count(DISTINCT
        CASE
            WHEN ((a.status)::text = 'rejeitado'::text) THEN a.id
            ELSE NULL::uuid
        END) AS total_rejeitadas,
    count(DISTINCT
        CASE
            WHEN ((a.status)::text = 'concluido'::text) THEN a.id
            ELSE NULL::uuid
        END) AS total_concluidas,
    count(DISTINCT t.id) AS total_termos,
    (EXTRACT(year FROM CURRENT_DATE))::integer AS ano_referencia
   FROM ((public.unidades_locais u
     LEFT JOIN public.agenda_unidade a ON ((a.unidade_local_id = u.id)))
     LEFT JOIN public.termos_cessao t ON ((t.unidade_local_id = u.id)))
  GROUP BY u.id, u.nome_unidade, u.municipio, u.tipo_unidade, u.status;


--
-- Name: viagens_diarias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.viagens_diarias (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    servidor_id uuid NOT NULL,
    data_saida date NOT NULL,
    data_retorno date NOT NULL,
    destino_cidade text NOT NULL,
    destino_uf text NOT NULL,
    destino_pais text DEFAULT 'Brasil'::text,
    finalidade text NOT NULL,
    justificativa text,
    portaria_numero text,
    portaria_data date,
    portaria_url text,
    quantidade_diarias numeric(4,1),
    valor_diaria numeric(10,2),
    valor_total numeric(12,2),
    meio_transporte text,
    veiculo_oficial boolean DEFAULT false,
    passagem_aerea boolean DEFAULT false,
    relatorio_apresentado boolean DEFAULT false,
    relatorio_data date,
    relatorio_url text,
    status text DEFAULT 'solicitada'::text,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT viagens_diarias_status_check CHECK ((status = ANY (ARRAY['solicitada'::text, 'autorizada'::text, 'em_andamento'::text, 'concluida'::text, 'cancelada'::text])))
);


--
-- Name: agenda_unidade agenda_unidade_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agenda_unidade
    ADD CONSTRAINT agenda_unidade_pkey PRIMARY KEY (id);


--
-- Name: banco_horas banco_horas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banco_horas
    ADD CONSTRAINT banco_horas_pkey PRIMARY KEY (id);


--
-- Name: banco_horas banco_horas_servidor_id_mes_ano_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banco_horas
    ADD CONSTRAINT banco_horas_servidor_id_mes_ano_key UNIQUE (servidor_id, mes, ano);


--
-- Name: cargos cargos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cargos
    ADD CONSTRAINT cargos_pkey PRIMARY KEY (id);


--
-- Name: composicao_cargos composicao_cargos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.composicao_cargos
    ADD CONSTRAINT composicao_cargos_pkey PRIMARY KEY (id);


--
-- Name: composicao_cargos composicao_cargos_unidade_id_cargo_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.composicao_cargos
    ADD CONSTRAINT composicao_cargos_unidade_id_cargo_id_key UNIQUE (unidade_id, cargo_id);


--
-- Name: configuracao_jornada configuracao_jornada_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracao_jornada
    ADD CONSTRAINT configuracao_jornada_pkey PRIMARY KEY (id);


--
-- Name: configuracao_jornada configuracao_jornada_servidor_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracao_jornada
    ADD CONSTRAINT configuracao_jornada_servidor_id_key UNIQUE (servidor_id);


--
-- Name: documentos_cedencia documentos_cedencia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos_cedencia
    ADD CONSTRAINT documentos_cedencia_pkey PRIMARY KEY (id);


--
-- Name: documentos documentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT documentos_pkey PRIMARY KEY (id);


--
-- Name: estrutura_organizacional estrutura_organizacional_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estrutura_organizacional
    ADD CONSTRAINT estrutura_organizacional_pkey PRIMARY KEY (id);


--
-- Name: feriados feriados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feriados
    ADD CONSTRAINT feriados_pkey PRIMARY KEY (id);


--
-- Name: ferias_servidor ferias_servidor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ferias_servidor
    ADD CONSTRAINT ferias_servidor_pkey PRIMARY KEY (id);


--
-- Name: frequencia_mensal frequencia_mensal_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frequencia_mensal
    ADD CONSTRAINT frequencia_mensal_pkey PRIMARY KEY (id);


--
-- Name: frequencia_mensal frequencia_mensal_servidor_id_mes_ano_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frequencia_mensal
    ADD CONSTRAINT frequencia_mensal_servidor_id_mes_ano_key UNIQUE (servidor_id, mes, ano);


--
-- Name: historico_funcional historico_funcional_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_funcional
    ADD CONSTRAINT historico_funcional_pkey PRIMARY KEY (id);


--
-- Name: horarios_jornada horarios_jornada_configuracao_id_dia_semana_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horarios_jornada
    ADD CONSTRAINT horarios_jornada_configuracao_id_dia_semana_key UNIQUE (configuracao_id, dia_semana);


--
-- Name: horarios_jornada horarios_jornada_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horarios_jornada
    ADD CONSTRAINT horarios_jornada_pkey PRIMARY KEY (id);


--
-- Name: justificativas_ponto justificativas_ponto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.justificativas_ponto
    ADD CONSTRAINT justificativas_ponto_pkey PRIMARY KEY (id);


--
-- Name: lancamentos_banco_horas lancamentos_banco_horas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lancamentos_banco_horas
    ADD CONSTRAINT lancamentos_banco_horas_pkey PRIMARY KEY (id);


--
-- Name: licencas_afastamentos licencas_afastamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licencas_afastamentos
    ADD CONSTRAINT licencas_afastamentos_pkey PRIMARY KEY (id);


--
-- Name: lotacoes lotacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lotacoes
    ADD CONSTRAINT lotacoes_pkey PRIMARY KEY (id);


--
-- Name: nomeacoes_chefe_unidade nomeacoes_chefe_unidade_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nomeacoes_chefe_unidade
    ADD CONSTRAINT nomeacoes_chefe_unidade_pkey PRIMARY KEY (id);


--
-- Name: ocorrencias_servidor ocorrencias_servidor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ocorrencias_servidor
    ADD CONSTRAINT ocorrencias_servidor_pkey PRIMARY KEY (id);


--
-- Name: patrimonio_unidade patrimonio_unidade_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patrimonio_unidade
    ADD CONSTRAINT patrimonio_unidade_pkey PRIMARY KEY (id);


--
-- Name: portarias_servidor portarias_servidor_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portarias_servidor
    ADD CONSTRAINT portarias_servidor_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: registros_ponto registros_ponto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_ponto
    ADD CONSTRAINT registros_ponto_pkey PRIMARY KEY (id);


--
-- Name: registros_ponto registros_ponto_servidor_id_data_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_ponto
    ADD CONSTRAINT registros_ponto_servidor_id_data_key UNIQUE (servidor_id, data);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_role_permission_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_permission_key UNIQUE (role, permission);


--
-- Name: servidores servidores_cpf_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servidores
    ADD CONSTRAINT servidores_cpf_key UNIQUE (cpf);


--
-- Name: servidores servidores_matricula_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servidores
    ADD CONSTRAINT servidores_matricula_key UNIQUE (matricula);


--
-- Name: servidores servidores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servidores
    ADD CONSTRAINT servidores_pkey PRIMARY KEY (id);


--
-- Name: solicitacoes_ajuste_ponto solicitacoes_ajuste_ponto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitacoes_ajuste_ponto
    ADD CONSTRAINT solicitacoes_ajuste_ponto_pkey PRIMARY KEY (id);


--
-- Name: termos_cessao termos_cessao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.termos_cessao
    ADD CONSTRAINT termos_cessao_pkey PRIMARY KEY (id);


--
-- Name: unidades_locais unidades_locais_municipio_nome_unidade_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unidades_locais
    ADD CONSTRAINT unidades_locais_municipio_nome_unidade_key UNIQUE (municipio, nome_unidade);


--
-- Name: unidades_locais unidades_locais_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unidades_locais
    ADD CONSTRAINT unidades_locais_pkey PRIMARY KEY (id);


--
-- Name: user_permissions user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_pkey PRIMARY KEY (id);


--
-- Name: user_permissions user_permissions_user_id_permission_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_user_id_permission_key UNIQUE (user_id, permission);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: viagens_diarias viagens_diarias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viagens_diarias
    ADD CONSTRAINT viagens_diarias_pkey PRIMARY KEY (id);


--
-- Name: idx_agenda_datas; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agenda_datas ON public.agenda_unidade USING btree (data_inicio, data_fim);


--
-- Name: idx_agenda_protocolo; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_agenda_protocolo ON public.agenda_unidade USING btree (numero_protocolo) WHERE (numero_protocolo IS NOT NULL);


--
-- Name: idx_agenda_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agenda_status ON public.agenda_unidade USING btree (status);


--
-- Name: idx_agenda_unidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agenda_unidade ON public.agenda_unidade USING btree (unidade_local_id);


--
-- Name: idx_banco_horas_periodo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_banco_horas_periodo ON public.banco_horas USING btree (ano, mes);


--
-- Name: idx_banco_horas_servidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_banco_horas_servidor ON public.banco_horas USING btree (servidor_id);


--
-- Name: idx_cargos_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cargos_ativo ON public.cargos USING btree (ativo);


--
-- Name: idx_cargos_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cargos_categoria ON public.cargos USING btree (categoria);


--
-- Name: idx_documentos_cedencia_agenda; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documentos_cedencia_agenda ON public.documentos_cedencia USING btree (agenda_id);


--
-- Name: idx_documentos_cedencia_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documentos_cedencia_tipo ON public.documentos_cedencia USING btree (tipo_documento);


--
-- Name: idx_documentos_numero; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documentos_numero ON public.documentos USING btree (numero);


--
-- Name: idx_documentos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documentos_status ON public.documentos USING btree (status);


--
-- Name: idx_documentos_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_documentos_tipo ON public.documentos USING btree (tipo);


--
-- Name: idx_estrutura_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_estrutura_ativo ON public.estrutura_organizacional USING btree (ativo);


--
-- Name: idx_estrutura_superior; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_estrutura_superior ON public.estrutura_organizacional USING btree (superior_id);


--
-- Name: idx_estrutura_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_estrutura_tipo ON public.estrutura_organizacional USING btree (tipo);


--
-- Name: idx_feriados_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_feriados_data ON public.feriados USING btree (data);


--
-- Name: idx_ferias_periodo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ferias_periodo ON public.ferias_servidor USING btree (periodo_aquisitivo_inicio, periodo_aquisitivo_fim);


--
-- Name: idx_ferias_servidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ferias_servidor ON public.ferias_servidor USING btree (servidor_id);


--
-- Name: idx_historico_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_historico_data ON public.historico_funcional USING btree (data_evento);


--
-- Name: idx_historico_servidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_historico_servidor ON public.historico_funcional USING btree (servidor_id);


--
-- Name: idx_historico_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_historico_tipo ON public.historico_funcional USING btree (tipo);


--
-- Name: idx_licencas_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_licencas_data ON public.licencas_afastamentos USING btree (data_inicio);


--
-- Name: idx_licencas_servidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_licencas_servidor ON public.licencas_afastamentos USING btree (servidor_id);


--
-- Name: idx_lotacoes_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotacoes_ativo ON public.lotacoes USING btree (ativo);


--
-- Name: idx_lotacoes_servidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotacoes_servidor ON public.lotacoes USING btree (servidor_id);


--
-- Name: idx_lotacoes_unidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lotacoes_unidade ON public.lotacoes USING btree (unidade_id);


--
-- Name: idx_nomeacoes_servidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nomeacoes_servidor ON public.nomeacoes_chefe_unidade USING btree (servidor_id);


--
-- Name: idx_nomeacoes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nomeacoes_status ON public.nomeacoes_chefe_unidade USING btree (status);


--
-- Name: idx_nomeacoes_unidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_nomeacoes_unidade ON public.nomeacoes_chefe_unidade USING btree (unidade_local_id);


--
-- Name: idx_patrimonio_unidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_patrimonio_unidade ON public.patrimonio_unidade USING btree (unidade_local_id);


--
-- Name: idx_ponto_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ponto_data ON public.registros_ponto USING btree (data);


--
-- Name: idx_ponto_servidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ponto_servidor ON public.registros_ponto USING btree (servidor_id);


--
-- Name: idx_ponto_servidor_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ponto_servidor_data ON public.registros_ponto USING btree (servidor_id, data);


--
-- Name: idx_ponto_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ponto_status ON public.registros_ponto USING btree (status);


--
-- Name: idx_portarias_numero; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portarias_numero ON public.portarias_servidor USING btree (numero, ano);


--
-- Name: idx_portarias_servidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portarias_servidor ON public.portarias_servidor USING btree (servidor_id);


--
-- Name: idx_portarias_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portarias_tipo ON public.portarias_servidor USING btree (tipo);


--
-- Name: idx_servidores_cargo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_servidores_cargo ON public.servidores USING btree (cargo_atual_id);


--
-- Name: idx_servidores_cpf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_servidores_cpf ON public.servidores USING btree (cpf);


--
-- Name: idx_servidores_matricula; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_servidores_matricula ON public.servidores USING btree (matricula);


--
-- Name: idx_servidores_nome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_servidores_nome ON public.servidores USING btree (nome_completo);


--
-- Name: idx_servidores_situacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_servidores_situacao ON public.servidores USING btree (situacao);


--
-- Name: idx_servidores_unidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_servidores_unidade ON public.servidores USING btree (unidade_atual_id);


--
-- Name: idx_servidores_vinculo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_servidores_vinculo ON public.servidores USING btree (vinculo);


--
-- Name: idx_solicitacoes_servidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_solicitacoes_servidor ON public.solicitacoes_ajuste_ponto USING btree (servidor_id);


--
-- Name: idx_solicitacoes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_solicitacoes_status ON public.solicitacoes_ajuste_ponto USING btree (status);


--
-- Name: idx_termos_unidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_termos_unidade ON public.termos_cessao USING btree (unidade_local_id);


--
-- Name: idx_unidades_locais_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_unidades_locais_codigo ON public.unidades_locais USING btree (codigo_unidade) WHERE (codigo_unidade IS NOT NULL);


--
-- Name: idx_unidades_locais_municipio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unidades_locais_municipio ON public.unidades_locais USING btree (municipio);


--
-- Name: idx_unidades_locais_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unidades_locais_status ON public.unidades_locais USING btree (status);


--
-- Name: idx_unidades_locais_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_unidades_locais_tipo ON public.unidades_locais USING btree (tipo_unidade);


--
-- Name: idx_viagens_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_viagens_data ON public.viagens_diarias USING btree (data_saida);


--
-- Name: idx_viagens_servidor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_viagens_servidor ON public.viagens_diarias USING btree (servidor_id);


--
-- Name: ferias_servidor trigger_atualizar_situacao_ferias; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_atualizar_situacao_ferias AFTER INSERT OR UPDATE OF status ON public.ferias_servidor FOR EACH ROW EXECUTE FUNCTION public.atualizar_situacao_servidor();


--
-- Name: licencas_afastamentos trigger_atualizar_situacao_licenca; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_atualizar_situacao_licenca AFTER INSERT OR UPDATE OF status ON public.licencas_afastamentos FOR EACH ROW EXECUTE FUNCTION public.atualizar_situacao_servidor();


--
-- Name: nomeacoes_chefe_unidade trigger_encerrar_nomeacao_anterior; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_encerrar_nomeacao_anterior AFTER INSERT OR UPDATE ON public.nomeacoes_chefe_unidade FOR EACH ROW EXECUTE FUNCTION public.encerrar_nomeacao_anterior();


--
-- Name: agenda_unidade trigger_historico_status_agenda; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_historico_status_agenda BEFORE UPDATE ON public.agenda_unidade FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_status();


--
-- Name: agenda_unidade update_agenda_unidade_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_agenda_unidade_updated_at BEFORE UPDATE ON public.agenda_unidade FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: banco_horas update_banco_horas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_banco_horas_updated_at BEFORE UPDATE ON public.banco_horas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: cargos update_cargos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_cargos_updated_at BEFORE UPDATE ON public.cargos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: configuracao_jornada update_config_jornada_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_config_jornada_updated_at BEFORE UPDATE ON public.configuracao_jornada FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: documentos_cedencia update_documentos_cedencia_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_documentos_cedencia_updated_at BEFORE UPDATE ON public.documentos_cedencia FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: documentos update_documentos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_documentos_updated_at BEFORE UPDATE ON public.documentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: estrutura_organizacional update_estrutura_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_estrutura_updated_at BEFORE UPDATE ON public.estrutura_organizacional FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: frequencia_mensal update_frequencia_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_frequencia_updated_at BEFORE UPDATE ON public.frequencia_mensal FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: justificativas_ponto update_justificativas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_justificativas_updated_at BEFORE UPDATE ON public.justificativas_ponto FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: lotacoes update_lotacoes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_lotacoes_updated_at BEFORE UPDATE ON public.lotacoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: nomeacoes_chefe_unidade update_nomeacoes_chefe_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_nomeacoes_chefe_updated_at BEFORE UPDATE ON public.nomeacoes_chefe_unidade FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: patrimonio_unidade update_patrimonio_unidade_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_patrimonio_unidade_updated_at BEFORE UPDATE ON public.patrimonio_unidade FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: registros_ponto update_registros_ponto_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_registros_ponto_updated_at BEFORE UPDATE ON public.registros_ponto FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: servidores update_servidores_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_servidores_updated_at BEFORE UPDATE ON public.servidores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: solicitacoes_ajuste_ponto update_solicitacoes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_solicitacoes_updated_at BEFORE UPDATE ON public.solicitacoes_ajuste_ponto FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: termos_cessao update_termos_cessao_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_termos_cessao_updated_at BEFORE UPDATE ON public.termos_cessao FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: unidades_locais update_unidades_locais_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_unidades_locais_updated_at BEFORE UPDATE ON public.unidades_locais FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: viagens_diarias update_viagens_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_viagens_updated_at BEFORE UPDATE ON public.viagens_diarias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: agenda_unidade agenda_unidade_aprovador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agenda_unidade
    ADD CONSTRAINT agenda_unidade_aprovador_id_fkey FOREIGN KEY (aprovador_id) REFERENCES public.servidores(id);


--
-- Name: agenda_unidade agenda_unidade_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agenda_unidade
    ADD CONSTRAINT agenda_unidade_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: agenda_unidade agenda_unidade_unidade_local_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agenda_unidade
    ADD CONSTRAINT agenda_unidade_unidade_local_id_fkey FOREIGN KEY (unidade_local_id) REFERENCES public.unidades_locais(id) ON DELETE CASCADE;


--
-- Name: agenda_unidade agenda_unidade_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agenda_unidade
    ADD CONSTRAINT agenda_unidade_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: banco_horas banco_horas_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banco_horas
    ADD CONSTRAINT banco_horas_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: composicao_cargos composicao_cargos_cargo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.composicao_cargos
    ADD CONSTRAINT composicao_cargos_cargo_id_fkey FOREIGN KEY (cargo_id) REFERENCES public.cargos(id) ON DELETE CASCADE;


--
-- Name: composicao_cargos composicao_cargos_unidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.composicao_cargos
    ADD CONSTRAINT composicao_cargos_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.estrutura_organizacional(id) ON DELETE CASCADE;


--
-- Name: configuracao_jornada configuracao_jornada_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracao_jornada
    ADD CONSTRAINT configuracao_jornada_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: documentos_cedencia documentos_cedencia_agenda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos_cedencia
    ADD CONSTRAINT documentos_cedencia_agenda_id_fkey FOREIGN KEY (agenda_id) REFERENCES public.agenda_unidade(id) ON DELETE CASCADE;


--
-- Name: documentos documentos_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documentos
    ADD CONSTRAINT documentos_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: estrutura_organizacional estrutura_organizacional_servidor_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estrutura_organizacional
    ADD CONSTRAINT estrutura_organizacional_servidor_responsavel_id_fkey FOREIGN KEY (servidor_responsavel_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: estrutura_organizacional estrutura_organizacional_superior_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estrutura_organizacional
    ADD CONSTRAINT estrutura_organizacional_superior_id_fkey FOREIGN KEY (superior_id) REFERENCES public.estrutura_organizacional(id) ON DELETE SET NULL;


--
-- Name: ferias_servidor ferias_servidor_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ferias_servidor
    ADD CONSTRAINT ferias_servidor_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: ferias_servidor ferias_servidor_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ferias_servidor
    ADD CONSTRAINT ferias_servidor_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id) ON DELETE CASCADE;


--
-- Name: estrutura_organizacional fk_cargo_chefe; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estrutura_organizacional
    ADD CONSTRAINT fk_cargo_chefe FOREIGN KEY (cargo_chefe_id) REFERENCES public.cargos(id) ON DELETE SET NULL;


--
-- Name: frequencia_mensal frequencia_mensal_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frequencia_mensal
    ADD CONSTRAINT frequencia_mensal_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: historico_funcional historico_funcional_cargo_anterior_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_funcional
    ADD CONSTRAINT historico_funcional_cargo_anterior_id_fkey FOREIGN KEY (cargo_anterior_id) REFERENCES public.cargos(id);


--
-- Name: historico_funcional historico_funcional_cargo_novo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_funcional
    ADD CONSTRAINT historico_funcional_cargo_novo_id_fkey FOREIGN KEY (cargo_novo_id) REFERENCES public.cargos(id);


--
-- Name: historico_funcional historico_funcional_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_funcional
    ADD CONSTRAINT historico_funcional_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: historico_funcional historico_funcional_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_funcional
    ADD CONSTRAINT historico_funcional_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id) ON DELETE CASCADE;


--
-- Name: historico_funcional historico_funcional_unidade_anterior_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_funcional
    ADD CONSTRAINT historico_funcional_unidade_anterior_id_fkey FOREIGN KEY (unidade_anterior_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: historico_funcional historico_funcional_unidade_nova_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_funcional
    ADD CONSTRAINT historico_funcional_unidade_nova_id_fkey FOREIGN KEY (unidade_nova_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: horarios_jornada horarios_jornada_configuracao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.horarios_jornada
    ADD CONSTRAINT horarios_jornada_configuracao_id_fkey FOREIGN KEY (configuracao_id) REFERENCES public.configuracao_jornada(id) ON DELETE CASCADE;


--
-- Name: justificativas_ponto justificativas_ponto_aprovador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.justificativas_ponto
    ADD CONSTRAINT justificativas_ponto_aprovador_id_fkey FOREIGN KEY (aprovador_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: justificativas_ponto justificativas_ponto_registro_ponto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.justificativas_ponto
    ADD CONSTRAINT justificativas_ponto_registro_ponto_id_fkey FOREIGN KEY (registro_ponto_id) REFERENCES public.registros_ponto(id) ON DELETE CASCADE;


--
-- Name: lancamentos_banco_horas lancamentos_banco_horas_banco_horas_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lancamentos_banco_horas
    ADD CONSTRAINT lancamentos_banco_horas_banco_horas_id_fkey FOREIGN KEY (banco_horas_id) REFERENCES public.banco_horas(id) ON DELETE CASCADE;


--
-- Name: lancamentos_banco_horas lancamentos_banco_horas_registro_ponto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lancamentos_banco_horas
    ADD CONSTRAINT lancamentos_banco_horas_registro_ponto_id_fkey FOREIGN KEY (registro_ponto_id) REFERENCES public.registros_ponto(id) ON DELETE SET NULL;


--
-- Name: licencas_afastamentos licencas_afastamentos_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licencas_afastamentos
    ADD CONSTRAINT licencas_afastamentos_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: licencas_afastamentos licencas_afastamentos_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licencas_afastamentos
    ADD CONSTRAINT licencas_afastamentos_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id) ON DELETE CASCADE;


--
-- Name: lotacoes lotacoes_cargo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lotacoes
    ADD CONSTRAINT lotacoes_cargo_id_fkey FOREIGN KEY (cargo_id) REFERENCES public.cargos(id) ON DELETE SET NULL;


--
-- Name: lotacoes lotacoes_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lotacoes
    ADD CONSTRAINT lotacoes_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: lotacoes lotacoes_unidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lotacoes
    ADD CONSTRAINT lotacoes_unidade_id_fkey FOREIGN KEY (unidade_id) REFERENCES public.estrutura_organizacional(id) ON DELETE CASCADE;


--
-- Name: nomeacoes_chefe_unidade nomeacoes_chefe_unidade_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nomeacoes_chefe_unidade
    ADD CONSTRAINT nomeacoes_chefe_unidade_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: nomeacoes_chefe_unidade nomeacoes_chefe_unidade_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nomeacoes_chefe_unidade
    ADD CONSTRAINT nomeacoes_chefe_unidade_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id);


--
-- Name: nomeacoes_chefe_unidade nomeacoes_chefe_unidade_unidade_local_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nomeacoes_chefe_unidade
    ADD CONSTRAINT nomeacoes_chefe_unidade_unidade_local_id_fkey FOREIGN KEY (unidade_local_id) REFERENCES public.unidades_locais(id) ON DELETE CASCADE;


--
-- Name: nomeacoes_chefe_unidade nomeacoes_chefe_unidade_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nomeacoes_chefe_unidade
    ADD CONSTRAINT nomeacoes_chefe_unidade_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: ocorrencias_servidor ocorrencias_servidor_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ocorrencias_servidor
    ADD CONSTRAINT ocorrencias_servidor_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: ocorrencias_servidor ocorrencias_servidor_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ocorrencias_servidor
    ADD CONSTRAINT ocorrencias_servidor_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id) ON DELETE CASCADE;


--
-- Name: patrimonio_unidade patrimonio_unidade_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patrimonio_unidade
    ADD CONSTRAINT patrimonio_unidade_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: patrimonio_unidade patrimonio_unidade_unidade_local_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patrimonio_unidade
    ADD CONSTRAINT patrimonio_unidade_unidade_local_id_fkey FOREIGN KEY (unidade_local_id) REFERENCES public.unidades_locais(id) ON DELETE CASCADE;


--
-- Name: patrimonio_unidade patrimonio_unidade_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.patrimonio_unidade
    ADD CONSTRAINT patrimonio_unidade_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: portarias_servidor portarias_servidor_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portarias_servidor
    ADD CONSTRAINT portarias_servidor_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: portarias_servidor portarias_servidor_historico_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portarias_servidor
    ADD CONSTRAINT portarias_servidor_historico_id_fkey FOREIGN KEY (historico_id) REFERENCES public.historico_funcional(id);


--
-- Name: portarias_servidor portarias_servidor_portaria_revogadora_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portarias_servidor
    ADD CONSTRAINT portarias_servidor_portaria_revogadora_id_fkey FOREIGN KEY (portaria_revogadora_id) REFERENCES public.portarias_servidor(id);


--
-- Name: portarias_servidor portarias_servidor_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portarias_servidor
    ADD CONSTRAINT portarias_servidor_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: registros_ponto registros_ponto_aprovador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_ponto
    ADD CONSTRAINT registros_ponto_aprovador_id_fkey FOREIGN KEY (aprovador_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: registros_ponto registros_ponto_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registros_ponto
    ADD CONSTRAINT registros_ponto_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: servidores servidores_cargo_atual_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servidores
    ADD CONSTRAINT servidores_cargo_atual_id_fkey FOREIGN KEY (cargo_atual_id) REFERENCES public.cargos(id);


--
-- Name: servidores servidores_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servidores
    ADD CONSTRAINT servidores_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: servidores servidores_unidade_atual_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servidores
    ADD CONSTRAINT servidores_unidade_atual_id_fkey FOREIGN KEY (unidade_atual_id) REFERENCES public.estrutura_organizacional(id);


--
-- Name: servidores servidores_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servidores
    ADD CONSTRAINT servidores_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: servidores servidores_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.servidores
    ADD CONSTRAINT servidores_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: solicitacoes_ajuste_ponto solicitacoes_ajuste_ponto_aprovador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitacoes_ajuste_ponto
    ADD CONSTRAINT solicitacoes_ajuste_ponto_aprovador_id_fkey FOREIGN KEY (aprovador_id) REFERENCES public.profiles(id) ON DELETE SET NULL;


--
-- Name: solicitacoes_ajuste_ponto solicitacoes_ajuste_ponto_registro_ponto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitacoes_ajuste_ponto
    ADD CONSTRAINT solicitacoes_ajuste_ponto_registro_ponto_id_fkey FOREIGN KEY (registro_ponto_id) REFERENCES public.registros_ponto(id) ON DELETE CASCADE;


--
-- Name: solicitacoes_ajuste_ponto solicitacoes_ajuste_ponto_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitacoes_ajuste_ponto
    ADD CONSTRAINT solicitacoes_ajuste_ponto_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: termos_cessao termos_cessao_agenda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.termos_cessao
    ADD CONSTRAINT termos_cessao_agenda_id_fkey FOREIGN KEY (agenda_id) REFERENCES public.agenda_unidade(id) ON DELETE CASCADE;


--
-- Name: termos_cessao termos_cessao_chefe_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.termos_cessao
    ADD CONSTRAINT termos_cessao_chefe_responsavel_id_fkey FOREIGN KEY (chefe_responsavel_id) REFERENCES public.nomeacoes_chefe_unidade(id);


--
-- Name: termos_cessao termos_cessao_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.termos_cessao
    ADD CONSTRAINT termos_cessao_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: termos_cessao termos_cessao_unidade_local_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.termos_cessao
    ADD CONSTRAINT termos_cessao_unidade_local_id_fkey FOREIGN KEY (unidade_local_id) REFERENCES public.unidades_locais(id);


--
-- Name: termos_cessao termos_cessao_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.termos_cessao
    ADD CONSTRAINT termos_cessao_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: unidades_locais unidades_locais_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unidades_locais
    ADD CONSTRAINT unidades_locais_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: unidades_locais unidades_locais_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unidades_locais
    ADD CONSTRAINT unidades_locais_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);


--
-- Name: user_permissions user_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_permissions
    ADD CONSTRAINT user_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: viagens_diarias viagens_diarias_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viagens_diarias
    ADD CONSTRAINT viagens_diarias_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: viagens_diarias viagens_diarias_servidor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.viagens_diarias
    ADD CONSTRAINT viagens_diarias_servidor_id_fkey FOREIGN KEY (servidor_id) REFERENCES public.servidores(id) ON DELETE CASCADE;


--
-- Name: user_permissions Admins can manage all permissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all permissions" ON public.user_permissions USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: role_permissions Admins can manage role permissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage role permissions" ON public.role_permissions USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can update all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: agenda_unidade Admins e managers podem gerenciar agenda; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins e managers podem gerenciar agenda" ON public.agenda_unidade USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: nomeacoes_chefe_unidade Admins e managers podem gerenciar nomeações; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins e managers podem gerenciar nomeações" ON public.nomeacoes_chefe_unidade USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: patrimonio_unidade Admins e managers podem gerenciar patrimônio; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins e managers podem gerenciar patrimônio" ON public.patrimonio_unidade USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: termos_cessao Admins e managers podem gerenciar termos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins e managers podem gerenciar termos" ON public.termos_cessao USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: unidades_locais Admins e managers podem gerenciar unidades; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins e managers podem gerenciar unidades" ON public.unidades_locais USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role))) WITH CHECK ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: banco_horas Admins podem gerenciar banco de horas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem gerenciar banco de horas" ON public.banco_horas TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: cargos Admins podem gerenciar cargos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem gerenciar cargos" ON public.cargos TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: composicao_cargos Admins podem gerenciar composição; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem gerenciar composição" ON public.composicao_cargos TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: documentos Admins podem gerenciar documentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem gerenciar documentos" ON public.documentos USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: estrutura_organizacional Admins podem gerenciar estrutura; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem gerenciar estrutura" ON public.estrutura_organizacional TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: feriados Admins podem gerenciar feriados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem gerenciar feriados" ON public.feriados TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: frequencia_mensal Admins podem gerenciar frequência; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem gerenciar frequência" ON public.frequencia_mensal TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ferias_servidor Admins podem gerenciar férias; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem gerenciar férias" ON public.ferias_servidor USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: historico_funcional Admins podem gerenciar histórico; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem gerenciar histórico" ON public.historico_funcional USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: horarios_jornada Admins podem gerenciar horários; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem gerenciar horários" ON public.horarios_jornada TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: configuracao_jornada Admins podem gerenciar jornadas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem gerenciar jornadas" ON public.configuracao_jornada TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: lancamentos_banco_horas Admins podem gerenciar lançamentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem gerenciar lançamentos" ON public.lancamentos_banco_horas TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: licencas_afastamentos Admins podem gerenciar licenças; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem gerenciar licenças" ON public.licencas_afastamentos USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: lotacoes Admins podem gerenciar lotações; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem gerenciar lotações" ON public.lotacoes TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: ocorrencias_servidor Admins podem gerenciar ocorrências; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem gerenciar ocorrências" ON public.ocorrencias_servidor USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: portarias_servidor Admins podem gerenciar portarias; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem gerenciar portarias" ON public.portarias_servidor USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: servidores Admins podem gerenciar servidores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem gerenciar servidores" ON public.servidores USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: viagens_diarias Admins podem gerenciar viagens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins podem gerenciar viagens" ON public.viagens_diarias USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: justificativas_ponto Admins/Managers podem atualizar justificativas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins/Managers podem atualizar justificativas" ON public.justificativas_ponto FOR UPDATE TO authenticated USING ((public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: role_permissions Authenticated can view role permissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated can view role permissions" ON public.role_permissions FOR SELECT TO authenticated USING (true);


--
-- Name: documentos_cedencia Documentos de cedência são visíveis para usuários autentica; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Documentos de cedência são visíveis para usuários autentica" ON public.documentos_cedencia FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: documentos_cedencia Managers e admins podem atualizar documentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers e admins podem atualizar documentos" ON public.documentos_cedencia FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['manager'::public.app_role, 'admin'::public.app_role]))))));


--
-- Name: documentos_cedencia Managers e admins podem deletar documentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers e admins podem deletar documentos" ON public.documentos_cedencia FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['manager'::public.app_role, 'admin'::public.app_role]))))));


--
-- Name: documentos_cedencia Managers e admins podem inserir documentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers e admins podem inserir documentos" ON public.documentos_cedencia FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['manager'::public.app_role, 'admin'::public.app_role]))))));


--
-- Name: documentos Managers podem atualizar documentos não publicados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers podem atualizar documentos não publicados" ON public.documentos FOR UPDATE USING ((public.has_role(auth.uid(), 'manager'::public.app_role) AND (status <> ALL (ARRAY['publicado'::public.status_documento, 'vigente'::public.status_documento]))));


--
-- Name: documentos Managers podem inserir e editar documentos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers podem inserir e editar documentos" ON public.documentos FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'manager'::public.app_role));


--
-- Name: ferias_servidor Managers podem visualizar férias; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers podem visualizar férias" ON public.ferias_servidor FOR SELECT USING (public.has_role(auth.uid(), 'manager'::public.app_role));


--
-- Name: historico_funcional Managers podem visualizar histórico; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers podem visualizar histórico" ON public.historico_funcional FOR SELECT USING (public.has_role(auth.uid(), 'manager'::public.app_role));


--
-- Name: licencas_afastamentos Managers podem visualizar licenças; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers podem visualizar licenças" ON public.licencas_afastamentos FOR SELECT USING (public.has_role(auth.uid(), 'manager'::public.app_role));


--
-- Name: ocorrencias_servidor Managers podem visualizar ocorrências; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers podem visualizar ocorrências" ON public.ocorrencias_servidor FOR SELECT USING (public.has_role(auth.uid(), 'manager'::public.app_role));


--
-- Name: portarias_servidor Managers podem visualizar portarias; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers podem visualizar portarias" ON public.portarias_servidor FOR SELECT USING (public.has_role(auth.uid(), 'manager'::public.app_role));


--
-- Name: servidores Managers podem visualizar servidores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers podem visualizar servidores" ON public.servidores FOR SELECT USING (public.has_role(auth.uid(), 'manager'::public.app_role));


--
-- Name: viagens_diarias Managers podem visualizar viagens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Managers podem visualizar viagens" ON public.viagens_diarias FOR SELECT USING (public.has_role(auth.uid(), 'manager'::public.app_role));


--
-- Name: feriados Todos podem ver feriados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Todos podem ver feriados" ON public.feriados FOR SELECT TO authenticated USING (true);


--
-- Name: agenda_unidade Todos podem visualizar agenda; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Todos podem visualizar agenda" ON public.agenda_unidade FOR SELECT USING (true);


--
-- Name: cargos Todos podem visualizar cargos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Todos podem visualizar cargos" ON public.cargos FOR SELECT TO authenticated USING (true);


--
-- Name: composicao_cargos Todos podem visualizar composição; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Todos podem visualizar composição" ON public.composicao_cargos FOR SELECT TO authenticated USING (true);


--
-- Name: documentos Todos podem visualizar documentos publicados; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Todos podem visualizar documentos publicados" ON public.documentos FOR SELECT USING (((status = ANY (ARRAY['publicado'::public.status_documento, 'vigente'::public.status_documento])) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: estrutura_organizacional Todos podem visualizar estrutura organizacional; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Todos podem visualizar estrutura organizacional" ON public.estrutura_organizacional FOR SELECT TO authenticated USING (true);


--
-- Name: nomeacoes_chefe_unidade Todos podem visualizar nomeações; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Todos podem visualizar nomeações" ON public.nomeacoes_chefe_unidade FOR SELECT USING (true);


--
-- Name: patrimonio_unidade Todos podem visualizar patrimônio; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Todos podem visualizar patrimônio" ON public.patrimonio_unidade FOR SELECT USING (true);


--
-- Name: termos_cessao Todos podem visualizar termos; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Todos podem visualizar termos" ON public.termos_cessao FOR SELECT USING (true);


--
-- Name: unidades_locais Todos podem visualizar unidades locais; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Todos podem visualizar unidades locais" ON public.unidades_locais FOR SELECT USING (true);


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: user_permissions Users can view own permissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own permissions" ON public.user_permissions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: user_roles Users can view own role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: registros_ponto Usuários podem atualizar próprio ponto não aprovado; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem atualizar próprio ponto não aprovado" ON public.registros_ponto FOR UPDATE TO authenticated USING ((((servidor_id = auth.uid()) AND (aprovado = false)) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: solicitacoes_ajuste_ponto Usuários podem atualizar solicitações pendentes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem atualizar solicitações pendentes" ON public.solicitacoes_ajuste_ponto FOR UPDATE TO authenticated USING ((((servidor_id = auth.uid()) AND (status = 'pendente'::public.status_solicitacao)) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: solicitacoes_ajuste_ponto Usuários podem criar próprias solicitações; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem criar próprias solicitações" ON public.solicitacoes_ajuste_ponto FOR INSERT TO authenticated WITH CHECK ((servidor_id = auth.uid()));


--
-- Name: justificativas_ponto Usuários podem inserir justificativas próprias; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem inserir justificativas próprias" ON public.justificativas_ponto FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.registros_ponto rp
  WHERE ((rp.id = justificativas_ponto.registro_ponto_id) AND (rp.servidor_id = auth.uid())))));


--
-- Name: registros_ponto Usuários podem inserir próprio ponto; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem inserir próprio ponto" ON public.registros_ponto FOR INSERT TO authenticated WITH CHECK ((servidor_id = auth.uid()));


--
-- Name: justificativas_ponto Usuários podem ver justificativas do próprio ponto; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver justificativas do próprio ponto" ON public.justificativas_ponto FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.registros_ponto rp
  WHERE ((rp.id = justificativas_ponto.registro_ponto_id) AND ((rp.servidor_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role))))));


--
-- Name: lancamentos_banco_horas Usuários podem ver lançamentos via banco de horas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver lançamentos via banco de horas" ON public.lancamentos_banco_horas FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.banco_horas bh
  WHERE ((bh.id = lancamentos_banco_horas.banco_horas_id) AND ((bh.servidor_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role))))));


--
-- Name: frequencia_mensal Usuários podem ver própria frequência; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver própria frequência" ON public.frequencia_mensal FOR SELECT TO authenticated USING (((servidor_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: configuracao_jornada Usuários podem ver própria jornada; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver própria jornada" ON public.configuracao_jornada FOR SELECT TO authenticated USING (((servidor_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: lotacoes Usuários podem ver própria lotação; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver própria lotação" ON public.lotacoes FOR SELECT TO authenticated USING (((servidor_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: ferias_servidor Usuários podem ver próprias férias; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver próprias férias" ON public.ferias_servidor FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.servidores s
  WHERE ((s.id = ferias_servidor.servidor_id) AND (s.user_id = auth.uid())))));


--
-- Name: licencas_afastamentos Usuários podem ver próprias licenças; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver próprias licenças" ON public.licencas_afastamentos FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.servidores s
  WHERE ((s.id = licencas_afastamentos.servidor_id) AND (s.user_id = auth.uid())))));


--
-- Name: portarias_servidor Usuários podem ver próprias portarias; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver próprias portarias" ON public.portarias_servidor FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.servidores s
  WHERE ((s.id = portarias_servidor.servidor_id) AND (s.user_id = auth.uid())))));


--
-- Name: solicitacoes_ajuste_ponto Usuários podem ver próprias solicitações; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver próprias solicitações" ON public.solicitacoes_ajuste_ponto FOR SELECT TO authenticated USING (((servidor_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: viagens_diarias Usuários podem ver próprias viagens; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver próprias viagens" ON public.viagens_diarias FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.servidores s
  WHERE ((s.id = viagens_diarias.servidor_id) AND (s.user_id = auth.uid())))));


--
-- Name: banco_horas Usuários podem ver próprio banco de horas; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver próprio banco de horas" ON public.banco_horas FOR SELECT TO authenticated USING (((servidor_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: servidores Usuários podem ver próprio cadastro; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver próprio cadastro" ON public.servidores FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: historico_funcional Usuários podem ver próprio histórico; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver próprio histórico" ON public.historico_funcional FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.servidores s
  WHERE ((s.id = historico_funcional.servidor_id) AND (s.user_id = auth.uid())))));


--
-- Name: registros_ponto Usuários podem ver próprio ponto; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver próprio ponto" ON public.registros_ponto FOR SELECT TO authenticated USING (((servidor_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role)));


--
-- Name: horarios_jornada Usuários podem ver próprios horários via jornada; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Usuários podem ver próprios horários via jornada" ON public.horarios_jornada FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.configuracao_jornada cj
  WHERE ((cj.id = horarios_jornada.configuracao_id) AND ((cj.servidor_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'manager'::public.app_role))))));


--
-- Name: agenda_unidade; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.agenda_unidade ENABLE ROW LEVEL SECURITY;

--
-- Name: banco_horas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.banco_horas ENABLE ROW LEVEL SECURITY;

--
-- Name: cargos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cargos ENABLE ROW LEVEL SECURITY;

--
-- Name: composicao_cargos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.composicao_cargos ENABLE ROW LEVEL SECURITY;

--
-- Name: configuracao_jornada; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.configuracao_jornada ENABLE ROW LEVEL SECURITY;

--
-- Name: documentos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

--
-- Name: documentos_cedencia; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.documentos_cedencia ENABLE ROW LEVEL SECURITY;

--
-- Name: estrutura_organizacional; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.estrutura_organizacional ENABLE ROW LEVEL SECURITY;

--
-- Name: feriados; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.feriados ENABLE ROW LEVEL SECURITY;

--
-- Name: ferias_servidor; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ferias_servidor ENABLE ROW LEVEL SECURITY;

--
-- Name: frequencia_mensal; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.frequencia_mensal ENABLE ROW LEVEL SECURITY;

--
-- Name: historico_funcional; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.historico_funcional ENABLE ROW LEVEL SECURITY;

--
-- Name: horarios_jornada; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.horarios_jornada ENABLE ROW LEVEL SECURITY;

--
-- Name: justificativas_ponto; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.justificativas_ponto ENABLE ROW LEVEL SECURITY;

--
-- Name: lancamentos_banco_horas; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lancamentos_banco_horas ENABLE ROW LEVEL SECURITY;

--
-- Name: licencas_afastamentos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.licencas_afastamentos ENABLE ROW LEVEL SECURITY;

--
-- Name: lotacoes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lotacoes ENABLE ROW LEVEL SECURITY;

--
-- Name: nomeacoes_chefe_unidade; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.nomeacoes_chefe_unidade ENABLE ROW LEVEL SECURITY;

--
-- Name: ocorrencias_servidor; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ocorrencias_servidor ENABLE ROW LEVEL SECURITY;

--
-- Name: patrimonio_unidade; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.patrimonio_unidade ENABLE ROW LEVEL SECURITY;

--
-- Name: portarias_servidor; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.portarias_servidor ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: registros_ponto; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.registros_ponto ENABLE ROW LEVEL SECURITY;

--
-- Name: role_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: servidores; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.servidores ENABLE ROW LEVEL SECURITY;

--
-- Name: solicitacoes_ajuste_ponto; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.solicitacoes_ajuste_ponto ENABLE ROW LEVEL SECURITY;

--
-- Name: termos_cessao; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.termos_cessao ENABLE ROW LEVEL SECURITY;

--
-- Name: unidades_locais; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.unidades_locais ENABLE ROW LEVEL SECURITY;

--
-- Name: user_permissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: viagens_diarias; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.viagens_diarias ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;