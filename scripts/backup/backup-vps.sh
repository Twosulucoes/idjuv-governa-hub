#!/usr/bin/env bash
# Backup do Supabase self-hosted da VPS: banco (pg_dump) + arquivos do Storage, criptografados com
# `age` e enviados com `rclone` para um armazenamento FORA da VPS. Roda NA VPS, via cron.
#
# Por que na VPS e não no GitHub Actions: a porta do Postgres não é publicada (docs/NOVO_BANCO.md §3),
# então só quem está na máquina alcança o banco. O dump sai do container pelo `docker exec`, sem senha,
# e é criptografado em fluxo: nenhum dado em claro é gravado em disco (LGPD). Só a chave PÚBLICA do age
# fica na VPS; a privada (que decifra) fica com o responsável e nos secrets do GitHub (teste mensal).
#
# Gera, por execução, em <remoto>/diario/<AAAA-MM-DD>/:
#   banco.dump.age      pg_dump -Fc do banco `postgres` (public, auth, storage, ...)
#   papeis.sql.age      pg_dumpall --roles-only (papéis e grants globais, sem senhas)
#   storage.tar.gz.age  diretório de arquivos do Storage
#   manifesto.tsv       contagem de linhas por tabela (sem dado pessoal) — usado no teste de restauração
# Aos domingos copia também para semanal/ e no dia 1 para mensal/. Retenção por idade (BACKUP_RETER_*).
#
# Configuração: /etc/idjuv-backup.env (ou BACKUP_ENV=<arquivo>). Modelo em scripts/backup/idjuv-backup.env.example.
# Guia completo (instalação, cron, restauração): docs/BACKUP.md.
set -euo pipefail

ENV_FILE="${BACKUP_ENV:-/etc/idjuv-backup.env}"
# shellcheck disable=SC1090
[[ -f "$ENV_FILE" ]] && source "$ENV_FILE"

CONTAINER="${BACKUP_DB_CONTAINER:-supabase-db}"
DB_USER="${BACKUP_DB_USER:-supabase_admin}"
DB_NAME="${BACKUP_DB_NAME:-postgres}"
STORAGE_DIR="${BACKUP_STORAGE_DIR:-}"
RECIPIENT="${BACKUP_AGE_RECIPIENT:?defina BACKUP_AGE_RECIPIENT (chave pública age, começa com age1...)}"
REMOTO="${BACKUP_RCLONE_REMOTE:?defina BACKUP_RCLONE_REMOTE (ex.: r2:idjuv-backups)}"
WORKDIR="${BACKUP_WORKDIR:-/var/backups/idjuv}"
RETER_DIARIO="${BACKUP_RETER_DIARIO:-8d}"
RETER_SEMANAL="${BACKUP_RETER_SEMANAL:-36d}"
RETER_MENSAL="${BACKUP_RETER_MENSAL:-400d}"
RETER_LOCAL_DIAS="${BACKUP_RETER_LOCAL_DIAS:-2}"
TAMANHO_MINIMO="${BACKUP_TAMANHO_MINIMO_BYTES:-100000}"
HEALTHCHECK="${BACKUP_HEALTHCHECK_URL:-}"

log() { echo "[$(date -u +%FT%TZ)] $*"; }
avisar() { [[ -n "$HEALTHCHECK" ]] && curl -fsS -m 10 --retry 3 -o /dev/null "$HEALTHCHECK$1" || true; }
falhou() { log "FALHA na linha $1"; avisar /fail; }
trap 'falhou $LINENO' ERR

for ferramenta in docker age rclone flock; do
  command -v "$ferramenta" >/dev/null || { log "faltando no PATH: $ferramenta"; avisar /fail; exit 2; }
done

mkdir -p "$WORKDIR"
chmod 700 "$WORKDIR"
exec 9>"$WORKDIR/.lock"
flock -n 9 || { log "outro backup em andamento; saindo"; exit 0; }

avisar /start
DIA="$(date -u +%F)"
DESTINO="$WORKDIR/$DIA"
mkdir -p "$DESTINO"
psql_c() { docker exec -i "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -X -q -A -t -v ON_ERROR_STOP=1 "$@"; }

log "manifesto (contagem de linhas por tabela)"
psql_c -F $'\t' -c "
  select format('%I.%I', table_schema, table_name),
         (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from %I.%I', table_schema, table_name), false, true, '')))[1]::text
    from information_schema.tables
   where table_type = 'BASE TABLE' and table_schema in ('public', 'auth', 'storage')
   order by 1" > "$DESTINO/manifesto.tsv"
[[ -s "$DESTINO/manifesto.tsv" ]] || { log "manifesto vazio"; false; }

log "dump do banco $DB_NAME"
docker exec "$CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc -Z 6 \
  | age -r "$RECIPIENT" -o "$DESTINO/banco.dump.age"
tamanho=$(stat -c %s "$DESTINO/banco.dump.age")
(( tamanho >= TAMANHO_MINIMO )) || { log "dump pequeno demais ($tamanho bytes)"; false; }

log "papéis globais"
docker exec "$CONTAINER" pg_dumpall -U "$DB_USER" --roles-only --no-role-passwords \
  | age -r "$RECIPIENT" -o "$DESTINO/papeis.sql.age"

if [[ -n "$STORAGE_DIR" ]]; then
  [[ -d "$STORAGE_DIR" ]] || { log "BACKUP_STORAGE_DIR não existe: $STORAGE_DIR"; false; }
  log "arquivos do Storage ($STORAGE_DIR)"
  tar -C "$STORAGE_DIR" -czf - . | age -r "$RECIPIENT" -o "$DESTINO/storage.tar.gz.age"
else
  log "BACKUP_STORAGE_DIR vazio: arquivos do Storage NÃO entram neste backup"
fi

log "enviando para $REMOTO/diario/$DIA"
rclone copy "$DESTINO" "$REMOTO/diario/$DIA"
if [[ "$(date -u +%u)" == "7" ]]; then rclone copy "$DESTINO" "$REMOTO/semanal/$DIA"; fi
if [[ "$(date -u +%d)" == "01" ]]; then rclone copy "$DESTINO" "$REMOTO/mensal/$DIA"; fi
rclone check --one-way "$DESTINO" "$REMOTO/diario/$DIA"

log "retenção (diário $RETER_DIARIO, semanal $RETER_SEMANAL, mensal $RETER_MENSAL)"
rclone delete --min-age "$RETER_DIARIO" "$REMOTO/diario" --rmdirs
rclone delete --min-age "$RETER_SEMANAL" "$REMOTO/semanal" --rmdirs
rclone delete --min-age "$RETER_MENSAL" "$REMOTO/mensal" --rmdirs
find "$WORKDIR" -mindepth 1 -maxdepth 1 -type d -mtime +"$RETER_LOCAL_DIAS" -exec rm -rf {} +

log "ok: $(du -sh "$DESTINO" | cut -f1) em $REMOTO/diario/$DIA"
avisar ""
