# Backup do Supabase self-hosted (VPS)

> Produção roda no Supabase self-hosted da VPS (`bd.idjuv.online`). Este guia cobre o backup **fora da
> VPS**: se a máquina cair, site e banco caem juntos, e só o que estiver em outro lugar volta.
> A antiga Edge Function `backup-offsite` ([BACKUP_CONTINGENCIA.md](./BACKUP_CONTINGENCIA.md)) foi aposentada no P06:
> este é o único backup fora da VPS.

## 1. Como funciona

| Peça | Onde roda | O que faz |
|---|---|---|
| [`scripts/backup/backup-vps.sh`](../scripts/backup/backup-vps.sh) | VPS, cron diário ([`idjuv-backup.cron`](../scripts/backup/idjuv-backup.cron)) | `pg_dump` do banco + papéis + arquivos do Storage (obrigatórios), criptografados com `age` e enviados com `rclone` |
| [`.github/workflows/backup-restore-test.yml`](../.github/workflows/backup-restore-test.yml) | GitHub Actions, dia 3 de cada mês | baixa o backup mais recente, restaura num Postgres descartável (imagem `supabase/postgres`) e confere as contagens |
| [`.github/workflows/backup-vigia.yml`](../.github/workflows/backup-vigia.yml) | GitHub Actions, todo dia às 08:00 de Boa Vista | só lista o remoto: reprova se o backup mais recente tiver mais de 26 horas ou faltar algum dos quatro arquivos |
| [`scripts/backup/testar-restauracao.sh`](../scripts/backup/testar-restauracao.sh) | Action acima ou qualquer máquina | restaura num banco novo e compara com o `manifesto.tsv` |

- **Por que na VPS:** a porta do Postgres não é publicada ([NOVO_BANCO.md](./NOVO_BANCO.md) §3), então o dump
  sai do container por `docker exec`, sem senha e sem abrir porta.
- **Criptografia:** o dump é cifrado em fluxo; nada em claro fica no disco. Na VPS só existe a chave
  **pública**. A privada fica com o responsável (gerenciador de senhas) e no secret do GitHub.
- **Retenção:** 8 dias de diários, ~5 semanas de semanais (domingos) e ~13 meses de mensais (dia 1),
  apagados por idade no remoto. Na VPS ficam só os 2 últimos dias.
- **Storage obrigatório:** sem `BACKUP_STORAGE_DIR` o backup falha. Ele também falha se a pasta tiver menos
  arquivos que linhas em `storage.objects` (pasta errada). O teste mensal repete a conta com o pacote baixado.
- **Alerta:** o **Vigia do backup** (GitHub Actions, diário) fica vermelho se o backup não chegou ao remoto, e o
  GitHub manda e-mail. Opcional e complementar: [healthchecks.io](https://healthchecks.io) (gratuito), que avisa na
  hora em que o script falha na VPS. O teste mensal também reprova se o diário mais recente tiver mais de 2 dias.
- **Sem configuração, vermelho:** o teste mensal e o vigia falham (não só avisam) se faltar algum segredo do
  ambiente `backup`.

## 2. Instalação (uma vez)

**Destino.** Crie um bucket fora da VPS. Recomendado: **Cloudflare R2** (10 GB grátis, sem custo de
download) ou **Backblaze B2** (10 GB grátis). Gere uma chave de API com acesso só a esse bucket.

**No seu computador** (não na VPS), gere o par de chaves do `age`:

```bash
age-keygen -o idjuv-backup.key   # imprime a chave pública (age1...)
```

Guarde `idjuv-backup.key` no gerenciador de senhas. **Sem ela, nenhum backup pode ser lido.**

**Na VPS** (como root):

```bash
apt-get install -y age rclone        # ou o instalador oficial do rclone, se a versão do apt for antiga
rclone config                        # crie o remoto (ex.: "r2", tipo S3/Cloudflare) com a chave do bucket
install -m 700 scripts/backup/backup-vps.sh /usr/local/bin/idjuv-backup
install -m 600 scripts/backup/idjuv-backup.env.example /etc/idjuv-backup.env
nano /etc/idjuv-backup.env           # container do db, pasta do Storage, chave pública, remoto
idjuv-backup                         # primeira execução manual; confira a saída
```

Confira os nomes com `docker ps --format '{{.Names}}'` (container do Postgres) e a pasta do Storage
(`docker/volumes/storage` dentro da pasta do Supabase). O arquivo `/etc/idjuv-backup.env` tem prioridade
sobre variáveis de ambiente.

Agende pelo arquivo versionado [`scripts/backup/idjuv-backup.cron`](../scripts/backup/idjuv-backup.cron) (todo dia
03:30 no fuso da VPS; confira com `date`):

```bash
install -m 644 scripts/backup/idjuv-backup.cron /etc/cron.d/idjuv-backup
crontab -l | grep idjuv-backup     # se havia a linha antiga no crontab do root, apague-a (crontab -e)
```

Mudou o horário? Mude no arquivo do repositório e reinstale; o vigia (08:00) assume o backup das 03:30.

**No GitHub**, para o teste mensal: segredos do **ambiente `backup`** (Settings → Environments → `backup`, só a
branch `main`; ver [DESENVOLVIMENTO.md](./DESENVOLVIMENTO.md#ambientes-protegidos-do-github-segredos-de-produção)),
não do nível do repositório, que fica ao alcance de PRs:

| Secret | Valor |
|---|---|
| `BACKUP_RCLONE_CONF` | conteúdo do `~/.config/rclone/rclone.conf` (de preferência com uma chave só-leitura) |
| `BACKUP_RCLONE_REMOTE` | o mesmo `BACKUP_RCLONE_REMOTE` da VPS (ex.: `r2:idjuv-backups`) |
| `BACKUP_AGE_KEY` | conteúdo do `idjuv-backup.key` (a chave **privada**, linha `AGE-SECRET-KEY-1...`; a pública `age1...` não serve) |

Variável opcional `SUPABASE_PG_IMAGE`: a imagem do container db da VPS
(`docker inspect -f '{{.Config.Image}}' supabase-db`). Depois rode as duas Actions uma vez à mão
(Actions → *Teste de restauração do backup* e *Vigia do backup* → Run workflow). O vigia usa só
`BACKUP_RCLONE_CONF` e `BACKUP_RCLONE_REMOTE`.

## 3. Restaurar

1. Baixe a pasta do dia: `rclone copy r2:idjuv-backups/diario/AAAA-MM-DD ./bk`
2. Decifre: `for f in banco.dump papeis.sql storage.tar.gz; do age -d -i idjuv-backup.key -o bk/${f} bk/${f}.age; done`
3. **Ensaio** (sem tocar em produção): `PGHOST=... PGUSER=supabase_admin bash scripts/backup/testar-restauracao.sh bk`
   restaura num banco novo `restaurado` e confere contra o manifesto.
4. **Recuperação real** (VPS nova): suba o Supabase self-hosted com a mesma versão de imagem, pare os
   serviços que escrevem no banco e rode, dentro do container db, como `supabase_admin`:
   `psql -d postgres -f papeis.sql` e `pg_restore -d postgres --clean --if-exists banco.dump`.
   Extraia `storage.tar.gz` na pasta `volumes/storage` e suba o resto da stack.
5. Confira login, uma listagem de cada módulo e um download de anexo antes de liberar o acesso.

Faça o ensaio do passo 3 também depois de qualquer atualização de versão do Supabase na VPS.
