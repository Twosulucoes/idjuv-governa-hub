#!/usr/bin/env bash
# Gera supabase/baseline/schema/ a partir de um banco que já recebeu TODAS as migrações
# (resultado de scripts/db/validar-migracoes.sh). Três arquivos, na ordem de aplicação:
#
#   01_pre_data.sql        tipos, funções, tabelas, views, sequências
#   02_dados_catalogo.sql  linhas de catálogo/parâmetros (lista SEMENTES abaixo; sem dado pessoal)
#   03_post_data.sql       constraints, índices, triggers, RLS ligado e policies do replay
#
# Dados vêm ANTES das constraints/triggers de propósito: o INSERT não dispara auditoria nem
# depende da ordem das FKs, e as FKs são validadas depois contra os dados semeados.
#
# Só o schema `public` é dumpado. Triggers em auth.users, storage e a publicação realtime ficam
# nos overlays (supabase/baseline/overlay/).
#
# Uso:  PG_DB=idjuv_validacao bash scripts/db/gerar-baseline.sh
# Variáveis: PGHOST (127.0.0.1) PGPORT (54329) PG_SUPERUSER (supabase_admin) PG_DB (idjuv_validacao)
# Requer pg_dump de versão >= à do servidor.
set -euo pipefail
cd "$(dirname "$0")/../.."

export PGHOST="${PGHOST:-127.0.0.1}" PGPORT="${PGPORT:-54329}"
SUPER="${PG_SUPERUSER:-supabase_admin}"
DB="${PG_DB:-idjuv_validacao}"
SAIDA=supabase/baseline/schema

# Tabelas cujas linhas (vindas das migrações) são catálogo/parâmetro. NÃO entram: servidores e
# vinculos_servidor (74 nomes de pessoas, CPF placeholder — migração 20260110184920), audit_logs, portal_diretoria,
# contatos_eventos_esportivos, debitos_tecnicos e config_paginas_historico (conteúdo operacional).
SEMENTES=(
  backup_config categorias_noticias_eventos cms_categorias config_agrupamento_unidades
  config_menu_publico config_paginas_publicas dias_nao_uteis fin_fontes_recurso
  fin_naturezas_despesa fin_parametros fin_plano_contas form_field_config
  modelos_mensagem_reuniao module_access_scopes module_permissions_catalog module_settings
  parametros_folha prazos_lai role_permissions
)

mkdir -p "$SAIDA"
COMUM=(-U "$SUPER" -d "$DB" --schema=public --no-owner --no-privileges --no-tablespaces)

# pg_dump >= 16.10 emite `\restrict <token aleatório>`: é meta-comando só do psql e muda a cada
# execução. O arquivo gerado é confiável e versionado, então as linhas são removidas. A criação do
# schema `public` também sai (ele já existe no Supabase e no Postgres).
limpar() {
  perl -0pe '
    s/^\\(un)?restrict [^\n]*\n//mg;
    s/^SET transaction_timeout[^\n]*\n//mg;
    s/--\n-- Name: public; Type: SCHEMA; Schema: -; Owner: -\n--\n\nCREATE SCHEMA public;\n\n\n//;
    s/--\n-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -\n--\n\nCOMMENT ON SCHEMA public IS [^\n]*\n\n\n//;
  '
}
cab() { printf -- '-- GERADO por scripts/db/gerar-baseline.sh (%s). NÃO edite à mão.\n-- Fonte: replay das migrações de supabase/migrations + supabase/baseline/lacunas.\n-- Ordem completa de aplicação: supabase/baseline/aplicar.sh\n\n' "$1"; }

{ cab "pré-dados"; pg_dump "${COMUM[@]}" --section=pre-data | limpar; } > "$SAIDA/01_pre_data.sql"

targs=(); for t in "${SEMENTES[@]}"; do targs+=(--table="public.$t"); done
{ cab "dados de catálogo"
  pg_dump "${COMUM[@]}" --section=data --column-inserts "${targs[@]}" | limpar
} > "$SAIDA/02_dados_catalogo.sql"

{ cab "pós-dados"; pg_dump "${COMUM[@]}" --section=post-data | limpar; } > "$SAIDA/03_post_data.sql"

# Nenhum meta-comando do psql (\...) pode sobrar nos arquivos versionados.
if grep -n -E '^\\' "$SAIDA"/*.sql; then echo "meta-comando do psql encontrado em $SAIDA (veja acima)" >&2; exit 1; fi

wc -l "$SAIDA"/*.sql
echo "linhas INSERT no catálogo: $(grep -c '^INSERT INTO' "$SAIDA/02_dados_catalogo.sql")"
