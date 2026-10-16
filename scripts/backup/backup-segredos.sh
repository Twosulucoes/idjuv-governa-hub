#!/usr/bin/env bash
# Pacote de segredos do Supabase self-hosted: o que o backup do banco NÃO cobre e que, sem isso, torna a
# restauração impossível (JWT_SECRET trocado desloga todo mundo; sem a chave do pgsodium o Vault não abre).
# Roda NA VPS, cifra com a MESMA chave pública `age` do backup e envia para um remoto SEPARADO do backup
# (outro bucket, outra credencial). Este arquivo não contém nenhum valor secreto.
#
# Conteúdo do pacote (segredos.tar.gz.age):
#   supabase/.env                      JWT_SECRET, chaves anon/service_role, POSTGRES_PASSWORD, VAULT_ENC_KEY,
#                                      SMTP, GEMINI/RESEND/BACKUP_* das Edge Functions (o compose as injeta daqui)
#   supabase/docker-compose.override.yml   endurecimento desta VPS (rede, portas, ALLOWED_ORIGINS das functions)
#   pgsodium_root.key                  chave raiz do Vault/pgsodium (volume Docker db-config do container db)
#   traefik/*.yaml                     rotas/TLS do Traefik do IDJUV (o acme.json NÃO entra: o Let's Encrypt reemite)
# Junto, no remoto, vai LEIAME.txt com só nomes e tamanhos (sem valores).
#
# Montagem em /dev/shm (RAM, modo 700, apagada ao sair): nenhum segredo em claro toca o disco.
# Configuração (em /etc/idjuv-backup.env, a mesma do backup):
#   BACKUP_SEGREDOS_REMOTE  remoto rclone DIFERENTE de BACKUP_RCLONE_REMOTE (ex.: r2segredos:idjuv-backups-segredos)
#   BACKUP_AGE_RECIPIENT    chave pública age (a privada nunca fica na VPS)
# Opcionais: BACKUP_SUPABASE_DIR, BACKUP_DB_CONTAINER, BACKUP_TRAEFIK_DIR, BACKUP_HEALTHCHECK_URL
# Guia: docs/BACKUP.md (seção "Pacote de segredos").
set -euo pipefail
umask 077

ENV_FILE="${BACKUP_ENV:-/etc/idjuv-backup.env}"
# shellcheck disable=SC1090
[[ -f "$ENV_FILE" ]] && source "$ENV_FILE"

SUPABASE_DIR="${BACKUP_SUPABASE_DIR:-/root/idjuv/supabase-project}"
CONTAINER="${BACKUP_DB_CONTAINER:-supabase-db}"
TRAEFIK_DIR="${BACKUP_TRAEFIK_DIR:-/data/coolify/proxy/dynamic}"
RECIPIENT="${BACKUP_AGE_RECIPIENT:?defina BACKUP_AGE_RECIPIENT (chave pública age, começa com age1...)}"
REMOTO="${BACKUP_SEGREDOS_REMOTE:?defina BACKUP_SEGREDOS_REMOTE (remoto rclone separado, ex.: r2segredos:idjuv-backups-segredos)}"
HEALTHCHECK="${BACKUP_HEALTHCHECK_URL:-}"
TAMANHO_MINIMO="${BACKUP_SEGREDOS_TAMANHO_MINIMO_BYTES:-2000}"

log() { echo "[$(date -u +%FT%TZ)] $*"; }
avisar() { [[ -n "$HEALTHCHECK" ]] && curl -fsS -m 10 --retry 3 -o /dev/null "$HEALTHCHECK$1" || true; }
falhou() { log "FALHA na linha $1"; avisar /fail; }
trap 'falhou $LINENO' ERR

for ferramenta in docker age rclone; do
  command -v "$ferramenta" >/dev/null || { log "faltando no PATH: $ferramenta"; avisar /fail; exit 2; }
done

# O ponto da separação é uma credencial que não alcance o bucket dos backups do banco.
[[ "${REMOTO%%:*}" != "${BACKUP_RCLONE_REMOTE%%:*}" ]] \
  || { log "BACKUP_SEGREDOS_REMOTE usa o mesmo remoto rclone do backup do banco; use credencial/bucket separados"; false; }

[[ -d /dev/shm ]] || { log "/dev/shm indisponível: não grava segredo em claro no disco"; false; }
STAGE="$(mktemp -d /dev/shm/idjuv-segredos.XXXXXX)"
trap 'rm -rf "$STAGE"' EXIT
chmod 700 "$STAGE"

DIA="$(date -u +%F)"
OUT="$(mktemp -d)"   # só texto cifrado e LEIAME (nomes); pode ficar em disco
trap 'rm -rf "$STAGE" "$OUT"' EXIT

copiar() {  # origem destino-relativo — falha se faltar: pacote incompleto é pior que nenhum
  [[ -s "$1" ]] || { log "faltando ou vazio: $1"; false; }
  mkdir -p "$STAGE/$(dirname "$2")"
  cp "$1" "$STAGE/$2"
}

log "montando pacote em RAM"
copiar "$SUPABASE_DIR/.env" supabase/.env
copiar "$SUPABASE_DIR/docker-compose.override.yml" supabase/docker-compose.override.yml
docker exec "$CONTAINER" cat /etc/postgresql-custom/pgsodium_root.key > "$STAGE/pgsodium_root.key"
[[ -s "$STAGE/pgsodium_root.key" ]] || { log "pgsodium_root.key vazia ou ausente no container $CONTAINER"; false; }
shopt -s nullglob
rotas=("$TRAEFIK_DIR"/idjuv-*.yaml)
(( ${#rotas[@]} > 0 )) || { log "nenhuma rota idjuv-*.yaml em $TRAEFIK_DIR"; false; }
for f in "${rotas[@]}"; do copiar "$f" "traefik/$(basename "$f")"; done

# Só nomes e tamanhos — vai para o remoto em claro, por isso nada de conteúdo nem hash de segredo.
( cd "$STAGE" && find . -type f -printf '%P\t%s bytes\n' | sort ) > "$OUT/LEIAME.txt"

log "cifrando"
tar -C "$STAGE" -czf - . | age -r "$RECIPIENT" -o "$OUT/segredos.tar.gz.age"
tamanho=$(stat -c %s "$OUT/segredos.tar.gz.age")
(( tamanho >= TAMANHO_MINIMO )) || { log "pacote pequeno demais ($tamanho bytes)"; false; }

avisar /start
log "enviando para $REMOTO/$DIA"
rclone copy "$OUT" "$REMOTO/$DIA"
rclone check --one-way "$OUT" "$REMOTO/$DIA"
log "ok: $tamanho bytes cifrados em $REMOTO/$DIA ($(wc -l < "$OUT/LEIAME.txt") arquivos)"
avisar ""
