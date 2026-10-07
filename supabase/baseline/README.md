# Baseline do banco (schema limpo + RLS por módulo)

Constrói um banco **novo e vazio** com o schema atual, a RLS corrigida e só o catálogo de
parâmetros — sem nenhum dado pessoal. Guia de uso para quem vai subir o banco:
[`docs/NOVO_BANCO.md`](../../docs/NOVO_BANCO.md). Este arquivo descreve o conteúdo e como mantê-lo.

## Por que existe

O histórico em `supabase/migrations/` não reconstrói o banco sozinho (tabelas e funções usadas
mas nunca criadas por migração) e termina num estado de RLS fraco: a migração de 20/02/2026
trocou todas as policies por `acesso_total_*` (`auth.uid() IS NOT NULL`) e só ~35 tabelas
voltaram a ter policy por módulo. O baseline resolve as duas coisas sem reescrever o histórico.

## Conteúdo e ordem de aplicação (`aplicar.sh`)

| # | Arquivo | O que faz | Origem |
|---|---|---|---|
| 1 | `schema/01_pre_data.sql` | tipos, funções, tabelas, views | **gerado** (`scripts/db/gerar-baseline.sh`) |
| 2 | `schema/02_dados_catalogo.sql` | 19 tabelas de catálogo/parâmetros (737 linhas) | **gerado** |
| 3 | `schema/03_post_data.sql` | constraints, índices, triggers, RLS ligado, policies do replay | **gerado** |
| 4 | `overlay/10_funcoes_acesso.sql` | `can_access_module`, `is_admin_user`, `is_active_user`, `meu_servidor_id` corrigidos; fim dos stubs “acesso total” | à mão |
| 5 | `overlay/15_novo_usuario.sql` | `handle_new_user` (antes quebrava o cadastro) + trigger em `auth.users` | à mão |
| 6 | `overlay/30_remover_acesso_total.sql` | apaga as policies `acesso_total_*` | à mão |
| 7 | `rls/35_policies_geradas.sql` | policies por módulo, **falha fechada** | **gerado** de `rls/mapa.csv` |
| 8 | `overlay/40_privilegios.sql` | `anon` sem nada, exceto formulários públicos | à mão |
| 9 | `overlay/50_storage.sql` | buckets e policies de storage por módulo | à mão |
| 10 | `overlay/60_realtime.sql` | publicação realtime (folha) | à mão |

`lacunas/` guarda a migração que cobre as tabelas usadas e nunca criadas; ela só serve ao replay
(`scripts/db/validar-migracoes.sh`) que alimenta o item 1–3. O baseline não a aplica.

Arquivos **gerados** não se editam à mão. Dados antes das constraints/triggers é proposital: o
INSERT não dispara auditoria e as FKs são validadas depois, contra os dados semeados.

## Modelo de RLS (`rls/mapa.csv`)

O mapa tabela → módulo é a **fonte da verdade** e deve ser lido por quem conhece o negócio.
Classes (detalhe no cabeçalho de `scripts/db/gerar-rls.mjs`): `modulo`, `catalogo`,
`proprio_leitura`, `proprio`, `proprio_filho`, `admin`, `preservar`, `fechada`.

- Toda tabela de `public` precisa de uma linha no mapa e de RLS ligado: o teste de RLS reprova
  tabela fora do mapa (o gerador não enxerga o banco; o teste sim). Tabela nova só passa depois
  que alguém decide o módulo dono.
- 236 tabelas: 163 `modulo`, 36 `preservar` (policies do replay são o desenho), 13 `admin`,
  12 `proprio_leitura`, 5 `catalogo`, 3 `proprio`, 3 `proprio_filho`, 1 `fechada`.
- Coluna `confianca`: `alta` (218), `media` (16), `baixa` (2). **Revise as 18 linhas não-altas**
  (`confianca != alta`), principalmente `viagens_diarias` e `documentos`, antes de usar em produção.
- Para mudar uma regra: edite `mapa.csv`, rode `node scripts/db/gerar-rls.mjs` e confirme com
  `scripts/db/validar-baseline.sh`.

## Verificação

```bash
bash scripts/db/validar-migracoes.sh                       # replay das migrações → banco de referência
PG_REFERENCIA=<banco do replay + overlays> bash scripts/db/validar-baseline.sh
```

`validar-baseline.sh` recria um banco vazio com o shim do Supabase (`scripts/db/shim-supabase.sql`),
aplica o baseline, confirma que uma segunda aplicação é recusada, que não há dado pessoal, roda
`scripts/db/testar-rls.sh` (1 a 2 linhas por tabela × 23 personas, storage, `handle_new_user`) e
compara o schema com o do replay. Último resultado: **aprovado**, 0 falhas de RLS, em PostgreSQL
**15.18, 16.15 e 17.10** (o self-hosted da Supabase costuma rodar 15; o dump é gerado por `pg_dump` 16).

**Limite da validação:** roda em Postgres puro com um *shim* de `auth`/`storage`/papéis. Não exercita
GoTrue, PostgREST, Storage API nem Realtime, e o `postgres` do shim não é o da imagem da Supabase.
Teste no Supabase de destino antes de apontar o front.

## Regenerar o schema

Depois de mudar o histórico de migrações: rode `validar-migracoes.sh`, aplique os overlays e a RLS
no banco do replay, rode `PG_DB=<banco do replay> bash scripts/db/gerar-baseline.sh` e reaplique
`validar-baseline.sh`. As sementes saem com **UUIDs e datas novos** a cada geração (snapshot do
replay); regenere só quando o catálogo mudar de fato.

## O que NÃO está aqui

- **Dados pessoais.** `servidores` e `vinculos_servidor` (74 nomes com CPF, inseridos pela migração
  `20260110184920`), `audit_logs`, `portal_diretoria` e outras tabelas operacionais ficam fora das
  sementes. As migrações antigas continuam com esses dados no histórico (ver pendências).
- Usuários, papéis e módulos: o primeiro administrador nasce com `bootstrap-admin.sql`.
- Extensões da plataforma (`pg_cron`, `pg_net`, `pg_graphql`, `supabase_vault`), configuração do
  Auth (SMTP, URLs, desativar cadastro público), Edge Functions e seus segredos.
- Parâmetros institucionais do IDJUV nas sementes (CNPJ, UG, feriados estaduais em `fin_parametros`
  e `dias_nao_uteis`). Para outro cliente, troque-os (skill `onboarding-cliente-idjuv`).

## Pendências conhecidas

- Buckets públicos continuam servindo o arquivo por URL; fechar exige bucket privado + URL assinada
  no front.
- `arbitro_cpf_cadastrado` é um oráculo de existência de CPF sem limite de taxa (exposto a `anon`).
- Os dados pessoais de servidores seguem no histórico git e na migração `20260110184920`.
- O banco ao vivo nunca foi inspecionado: o baseline foi derivado só dos arquivos do repositório.
