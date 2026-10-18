# Backup do Supabase self-hosted (VPS)

> Produção roda no Supabase self-hosted da VPS (`bd.idjuv.online`). Este guia cobre o backup **fora da
> VPS**: se a máquina cair, site e banco caem juntos, e só o que estiver em outro lugar volta.
> A antiga Edge Function `backup-offsite` ([guia antigo](./historico/BACKUP_CONTINGENCIA.md)) foi aposentada no P06,
> e as tabelas dela no banco foram apagadas no P13: este é o único backup fora da VPS. Para quem usa o sistema, a
> tela **Admin → Disaster recovery** (`/admin/disaster-recovery`) resume a recuperação e aponta para este guia; desde
> o P13 ela é só informativa e não oferece mais o download do schema antigo.

## 1. Como funciona

| Peça | Onde roda | O que faz |
|---|---|---|
| [`scripts/backup/backup-vps.sh`](../scripts/backup/backup-vps.sh) | VPS, cron diário ([`idjuv-backup.cron`](../scripts/backup/idjuv-backup.cron)) | `pg_dump` do banco + papéis + arquivos do Storage (obrigatórios), criptografados com `age` e enviados com `rclone` |
| [`scripts/backup/backup-segredos.sh`](../scripts/backup/backup-segredos.sh) | VPS, cron semanal (domingo 03:50) | pacote **cifrado** com o que o banco não guarda: `.env` do Supabase, chave do pgsodium/Vault, rotas do Traefik. Vai para um bucket e uma credencial **separados** (seção 4) |
| [`.github/workflows/backup-restore-test.yml`](../.github/workflows/backup-restore-test.yml) | GitHub Actions, dia 3 de cada mês | baixa o backup mais recente, restaura num Postgres descartável (imagem `supabase/postgres`) e confere as contagens |
| [`.github/workflows/backup-vigia.yml`](../.github/workflows/backup-vigia.yml) | GitHub Actions, todo dia às 08:00 de Boa Vista | só lista o remoto: reprova se o backup mais recente tiver mais de 26 horas ou faltar algum dos quatro arquivos |
| [`scripts/backup/testar-restauracao.sh`](../scripts/backup/testar-restauracao.sh) | Action acima ou qualquer máquina | restaura num banco novo e compara com o `manifesto.tsv` |

- **Por que na VPS:** a porta do Postgres não é publicada ([NOVO_BANCO.md](./NOVO_BANCO.md) §3), então o dump
  sai do container por `docker exec`, sem senha e sem abrir porta.
- **Criptografia:** o dump é cifrado em fluxo; nada em claro fica no disco. Na VPS só existe a chave
  **pública**. A privada fica com o responsável (gerenciador de senhas) e no secret do GitHub.
- **Retenção:** 8 dias de diários, ~5 semanas de semanais (domingos) e ~13 meses de mensais (dia 1). Quem apaga é
  escolhido por `BACKUP_RETENCAO` em `/etc/idjuv-backup.env`: `rclone` (o script apaga por idade) ou `r2` (**modo de
  produção desde 15/10/2026**: as regras de ciclo de vida do bucket apagam e o script não apaga nada no remoto; ver
  seção 5). Na VPS ficam só os 2 últimos dias.
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

O arquivo também grava `/var/backups/idjuv/.ultimo-ok` (epoch do último sucesso), que o monitor da VPS (script stack-health, fora do repositório) lê para
alertar; em cron o `%` tem de ser `\%` (incidente de 10/10: o marcador nunca era gravado). Variáveis novas em `/etc/idjuv-backup.env`:
`BACKUP_RETENCAO` e `BACKUP_SEGREDOS_REMOTE`.

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

## 4. Pacote de segredos (o que o backup do banco não cobre)

Sem estes arquivos, restaurar o banco e o Storage não basta: trocar o `JWT_SECRET` desloga todo mundo, e sem a chave
do pgsodium o Vault não abre. O [`scripts/backup/backup-segredos.sh`](../scripts/backup/backup-segredos.sh) monta o pacote **em RAM** (`/dev/shm`, modo 700, apagado ao
sair), cifra com a **mesma chave pública** `age` do backup e envia para o remoto `r2segredos`
(bucket `idjuv-backups-segredos`), com credencial própria: ela **não enxerga** o bucket dos backups do banco
(`AccessDenied`, verificado em 15/10/2026), e o script se recusa a rodar se o remoto for o mesmo do backup do banco.

| Arquivo no pacote | Origem na VPS | Por que importa |
|---|---|---|
| `supabase/.env` | `/root/idjuv/supabase-project/.env` | `JWT_SECRET`, chaves anon/service_role, senha do Postgres, SMTP e os segredos das Edge Functions (o compose os injeta daqui; não há arquivo de segredos separado) |
| override do compose (só na VPS) | idem | endurecimento da VPS: rede, portas, `ALLOWED_ORIGINS` das functions |
| `pgsodium_root.key` | `/etc/postgresql-custom/` do container db (volume Docker `supabase_db-config`) | chave raiz do Vault/pgsodium |
| `traefik/idjuv-*.yaml` | `/data/coolify/proxy/dynamic/` | rotas e TLS do IDJUV (o arquivo de certificados do Traefik **não** entra: o Let's Encrypt reemite) |

- **Não há nginx de TLS na VPS:** quem faz TLS é o Traefik do Coolify (compartilhado com outros domínios).
- **Chave do Vault:** é o **arquivo** `pgsodium_root.key` (64 bytes), não o `VAULT_ENC_KEY` do `.env` (esse é do
  Supavisor). Armadilha: o script `pgsodium_getkey` do container db **gera uma chave nova em silêncio** se o arquivo não existir; num volume
  recriado sem o arquivo, o Vault abre "normal" com outra chave e o que foi cifrado antes fica ilegível. Em 15/10/2026
  `vault.secrets` tem 0 linhas (nada em risco hoje), mas o arquivo entra no pacote.
- **Agenda:** domingo 03:50 (`idjuv-backup.cron`). Log em `/var/log/idjuv-backup-segredos.log`. Junto do `.age`, o remoto
  recebe um LEIAME com só nomes e tamanhos.
- **Onde guardar fora da VPS:** (1) o bucket separado; (2) uma cópia do `.age` no cofre de senhas do responsável
  (**passo manual do dono, não verificável pela VPS**); a chave **privada** do age fica só no cofre e no ambiente
  `backup` do GitHub, nunca na VPS.
- **Conferir sem extrair** (no computador do responsável):
  `rclone copy r2segredos:idjuv-backups-segredos/AAAA-MM-DD ./seg && age -d -i idjuv-backup.key seg/segredos.tar.gz.age | tar -tzf -`
  deve listar os 8 nomes. Feito em 15/10/2026 pelo dono: abriu e listou os 8 arquivos.
- **Ao trocar um segredo** (JWT, senhas, chaves) rode `idjuv-backup-segredos` à mão no mesmo dia.

## 5. Retenção e trava no R2

O `rclone delete --min-age` exige que a credencial da VPS possa apagar, o que anula qualquer trava. Por isso a retenção
passou ao próprio R2 (a trava só funciona porque a credencial da VPS deixou de precisar apagar):

1. **Regras de ciclo de vida** em `idjuv-backups` (confirmadas pelo dono em 15/10/2026; **não verificáveis** pela
   credencial do rclone): `diario/` 8 dias, `semanal/` 36, `mensal/` 400.
2. **`BACKUP_RETENCAO=r2`** na VPS (ligado em 15/10/2026, depois das regras; o log mostra
   `retenção pelo R2 ... nada a apagar pelo rclone`).
3. **Trava (bucket lock)** em `idjuv-backups`: retenção de **7 dias** no bucket inteiro (prefixo vazio). O prazo tem
   de ser **menor que 8** (a regra dos diários); maior, o ciclo de vida tentaria apagar objeto ainda protegido.
   **ATIVA desde 16/10/2026** (regra `trava-7-dias`, 7 dias, sem prefixo, habilitada). Prova: com um arquivo-isca criado
   às 17:14 UTC, o `rclone deletefile` falhou nas 3 tentativas com `409 ObjectLockedByBucketPolicy` e a sobrescrita
   (`rclone rcat` no mesmo caminho) também foi recusada. Antes da regra (15 e 16/10) os mesmos testes apagavam sem erro.
   Ainda **não provado** em operação: o primeiro backup automático sob a trava é o das 03:30 de 17/10 (pasta nova de data,
   não deve conflitar); conferir o log e o Vigia depois dele.
   **Arquivo-isca de teste (pasta `teste-trava` do bucket `idjuv-backups`):** fica **fora** das regras de ciclo de vida (não está em
   `diario/`, `semanal/` nem `mensal/`) e não é apagado sozinho. Depois de **23/10/2026 17:14 UTC** (fim dos 7 dias) apague
   à mão: `rclone deletefile r2:idjuv-backups/teste-trava/isca3.txt`. Repetir o teste exige criar uma isca nova.

- O token *Object Read & Write* do R2 inclui apagar: quem impede o apagamento é a **trava**, não o escopo do token.
- **Um backup por dia:** com a trava, rodar `idjuv-backup` duas vezes no mesmo dia tenta sobrescrever objetos protegidos
  e falha. É esperado; o cron roda uma vez por dia.
- **Voltar atrás** (se algo apagar errado): trocar `BACKUP_RETENCAO=rclone` no `/etc/idjuv-backup.env` volta ao
  comportamento anterior; a trava só se remove no painel do Cloudflare.
- **Rodízio de credencial:** crie o token novo, troque na VPS com `rclone config` (sem mostrar o valor), rode
  `idjuv-backup`, e só então apague o antigo. Pendente (dono): token só-leitura próprio para o `BACKUP_RCLONE_CONF` do
  GitHub; hoje o Vigia e o teste mensal usam o token atual.
