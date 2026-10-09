#!/usr/bin/env bash
# Restaura um backup gerado por backup-vps.sh num banco NOVO e confere contra o manifesto.
#
#   uso: testar-restauracao.sh <pasta com banco.dump e manifesto.tsv (e papeis.sql, opcional)>
#
# A pasta deve conter os arquivos JÁ decifrados (age -d -i <chave> ...). Conecta como superusuário via
# variáveis PG* (PGHOST, PGPORT, PGUSER, PGPASSWORD) e cria o banco RESTORE_DB (padrão: restaurado),
# apagando-o antes se existir. Use num Postgres descartável — de preferência a mesma imagem
# supabase/postgres da VPS, que já traz os papéis e extensões do Supabase.
#
# Reprova (exit 1) se: o pg_restore não criar alguma tabela do manifesto; alguma tabela com linhas no
# manifesto voltar vazia; ou o total de linhas restauradas ficar abaixo de 99% do manifesto. Diferenças
# pequenas por tabela só geram aviso: o manifesto é contado segundos antes do dump, e o sistema pode ter
# gravado algo entre um e outro.
set -uo pipefail

PASTA="${1:?uso: $0 <pasta com banco.dump e manifesto.tsv>}"
DB="${RESTORE_DB:-restaurado}"
case "$DB" in postgres|template0|template1) echo "recusado: RESTORE_DB=$DB" >&2; exit 2 ;; esac
for f in banco.dump manifesto.tsv; do
  [[ -s "$PASTA/$f" ]] || { echo "faltando: $PASTA/$f" >&2; exit 2; }
done

psql_a() { psql -X -q -A -t -v ON_ERROR_STOP=1 "$@"; }

psql_a -d postgres -c "set client_min_messages = warning" -c "drop database if exists \"$DB\" with (force)" -c "create database \"$DB\""

if [[ -s "$PASTA/papeis.sql" ]]; then
  echo "== papéis (erros de 'já existe' são esperados)"
  psql -X -q -d postgres -f "$PASTA/papeis.sql" >/dev/null 2>"$PASTA/papeis.log" || true
fi

echo "== pg_restore em $DB"
pg_restore -d "$DB" --no-comments "$PASTA/banco.dump" 2>"$PASTA/restore.log"
status=$?
erros=$(grep -c '^pg_restore: error' "$PASTA/restore.log" || true)
echo "   pg_restore terminou com status $status e $erros erro(s) (detalhes em restore.log)"
# só a primeira linha de cada erro, sem DETAIL/valores de chave: o log do CI não pode vazar dado pessoal
grep '^pg_restore: error' "$PASTA/restore.log" | sed -E 's/(Key \(|DETAIL).*//' | cut -c1-200 | head -20

echo "== conferindo contra o manifesto"
falhas=0; total_m=0; total_r=0
while IFS=$'\t' read -r tabela esperado; do
  [[ -n "$tabela" ]] || continue
  total_m=$((total_m + esperado))
  existe=$(psql_a -d "$DB" -c "select to_regclass('$tabela') is not null")
  if [[ "$existe" != "t" ]]; then
    echo "  FALHA $tabela não foi restaurada"; falhas=$((falhas + 1)); continue
  fi
  obtido=$(psql_a -d "$DB" -c "select count(*) from $tabela")
  total_r=$((total_r + obtido))
  if (( esperado > 0 && obtido == 0 )); then
    echo "  FALHA $tabela voltou vazia (manifesto: $esperado)"; falhas=$((falhas + 1))
  elif (( obtido != esperado )); then
    echo "  aviso $tabela: $obtido linhas (manifesto: $esperado)"
  fi
done < "$PASTA/manifesto.tsv"

tabelas=$(grep -c . "$PASTA/manifesto.tsv")
echo "   $tabelas tabelas; $total_r de $total_m linhas restauradas"
if (( total_m > 0 && total_r * 100 < total_m * 99 )); then
  echo "  FALHA total restaurado abaixo de 99% do manifesto"; falhas=$((falhas + 1))
fi

if (( falhas > 0 )); then echo "REPROVADO: $falhas falha(s)"; exit 1; fi
echo "APROVADO: backup restaurável"
