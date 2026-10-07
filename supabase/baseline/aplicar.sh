#!/usr/bin/env bash
# Aplica o baseline num banco NOVO (Supabase self-hosted ou Postgres com o shim), na ordem certa.
#
#   bash supabase/baseline/aplicar.sh "postgresql://postgres:SENHA@host:5432/postgres"
#   (sem argumento: usa as variáveis PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE)
#
# Conecte como o papel `postgres` do Supabase (dono dos objetos de `public`). Tudo roda numa
# única transação: qualquer erro desfaz tudo. O script RECUSA bancos em que `public`
# já tenha tabelas: o baseline é para banco vazio, não para atualizar um banco em uso (nem para
# trazer dados do banco antigo: veja docs/NOVO_BANCO.md).
set -euo pipefail
cd "$(dirname "$0")"

ARQUIVOS=(
  schema/01_pre_data.sql          # tipos, funções, tabelas
  schema/02_dados_catalogo.sql    # catálogo/parâmetros (sem dado pessoal)
  schema/03_post_data.sql         # constraints, índices, triggers, RLS
  overlay/10_funcoes_acesso.sql   # is_admin_user & cia exigem perfil ativo; fim dos stubs "acesso total"
  overlay/12_protecao_profiles.sql # usuário não se ativa nem assume servidor_id
  overlay/15_novo_usuario.sql     # handle_new_user + trigger em auth.users
  overlay/18_funcoes_rpc.sql      # injeção de SQL, função quebrada, SECURITY DEFINER -> INVOKER
  overlay/20_campos_iniciais.sql  # formulários/pedidos não escolhem status nem aprovação
  overlay/30_remover_acesso_total.sql
  rls/35_policies_geradas.sql     # policies por módulo (gerado de rls/mapa.csv)
  overlay/40_privilegios.sql      # anon sem acesso, exceto formulários públicos
  overlay/50_storage.sql          # buckets e policies de storage
  overlay/60_realtime.sql
)

# Sem os NOTICE de "já existe/não existe, ignorando" dos DROP ... IF EXISTS idempotentes.
export PGOPTIONS="${PGOPTIONS:-} -c client_min_messages=warning"
psql_() { psql ${CONN:+"$CONN"} -X -q -v ON_ERROR_STOP=1 "$@"; }
CONN="${1:-}"

n=$(psql_ -At -c "select count(*) from pg_tables where schemaname = 'public'")
if [[ "$n" != "0" ]]; then
  echo "recusado: o schema public já tem $n tabela(s). O baseline é só para banco vazio." >&2
  exit 2
fi

# Tudo numa ÚNICA transação: se qualquer arquivo falhar, nada fica aplicado e o comando pode ser
# repetido. (Aplicar arquivo a arquivo deixaria o banco meio construído e a recusa acima impediria
# recomeçar.) Os arquivos do pg_dump trocam search_path, check_function_bodies e row_security na
# sessão; o RESET ALL devolve a sessão ao normal antes dos overlays.
args=()
for f in "${ARQUIVOS[@]}"; do
  [[ -f "$f" ]] || { echo "faltando: $f" >&2; exit 2; }
  args+=(-f "$f")
  [[ "$f" == schema/03_post_data.sql ]] && args+=(-c "RESET ALL")
done
psql_ --single-transaction "${args[@]}" >/dev/null
echo "baseline aplicado (${#ARQUIVOS[@]} arquivos, uma transação). Próximo passo: primeiro administrador (docs/NOVO_BANCO.md §5)."
