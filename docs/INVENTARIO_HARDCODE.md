# Inventário de Hardcode do Cliente (IDJUV)

Mapa exaustivo de **onde a identidade do IDJUV está gravada no código**, para
servir de base ao trabalho de White Label (ver [WHITE_LABEL.md](./WHITE_LABEL.md)).

> **Como este documento foi produzido:** varredura por `grep -ri` sobre `src/`,
> `supabase/`, `public/`, `index.html` e configs de build, em 2026-09-16.
> Os números são um retrato daquele momento — reexecute os comandos da
> [§8](#8-comandos-para-reauditar) para atualizar.

---

## 1. Números gerais

| Escopo | Ocorrências de `idjuv` | Arquivos |
|---|---:|---:|
| `src/lib/` (geradores PDF/Word) | **364** | 41 |
| `src/pages/` | **227** | 72 |
| `src/components/` | **121** | 27 |
| `src/types/` | **73** | 12 |
| `src/hooks/` | **43** | 11 |
| `src/modules/` | 1 | 1 |
| `src/shared/config/`, `src/config/` | 0 | 0 |
| `supabase/migrations/` | 147 | 26 |
| `supabase/functions/` | 28 | 3 |
| `public/` | 39 | 26 |
| **Total em `src/`** | **853** | **164** |
| **Total no repositório** | **~1.070** | **224** |

Referências correlatas (não contadas acima):

- `roraima` — **238** ocorrências em `src/` (co-branding do Governo do Estado).
- `Governo (do Estado) de Roraima` como texto literal — **30** ocorrências.
- Lei nº **2.301/2025** (lei de criação) — citada em **17** arquivos.

---

## 2. Classificação por natureza

O hardcode não é homogêneo. Tratá-lo como um bloco único é o principal erro a
evitar: cada nível abaixo tem um mecanismo de solução diferente.

| Nível | O que é | Onde vive | Mecanismo de solução |
|---|---|---|---|
| **N1** | Marca visual (logo, cores, favicon, título) | assets, CSS, `index.html`, `vite.config.ts` | Build-time (env + perfil) + runtime (tema) |
| **N2** | Identidade institucional (CNPJ, endereço, dirigente, lei) | `useDadosOficiais`, tabelas `config_*` | Banco de dados (já existe base) |
| **N3** | Textos de UI | headers, footers, menus, páginas públicas | Consumo do contexto de tenant |
| **N4** | Documentos gerados (PDF/Word/planilhas) | `src/lib/pdf*.ts`, `src/components/reports/` | Injeção de identidade no template |
| **N5** | Regras jurídicas e enums de domínio | `src/types/portaria*.ts`, enums do Postgres | Banco (modelos) + migração de enum |
| **N6** | Vertical de negócio (esporte/juventude) | módulos `federacoes`, `arbitros`, `gestores_escolares`, `eventos` | Pacote opcional (feature flag de módulo) |
| **N7** | Infra e operação | bucket de backup, e-mail remetente, super admin | Variáveis de ambiente |
| **N8** | Co-branding de terceiro (Governo de RR) | logos e cabeçalhos | Slot configurável de "entidade superior" |

---

## 3. N1 — Marca visual

### 3.1 Arquivos de imagem (`src/assets/`, `public/`)

| Arquivo | Uso |
|---|---|
| `src/assets/logo-idjuv-oficial.png` | Logo principal (fundo claro) — UI e PDFs |
| `src/assets/logo-idjuv-dark4.png` | Logo para fundo escuro |
| `src/assets/logo-idjuv.png`, `idjuv-color02 (1).png`, `logo-idjuv-oficial.antogapng` | Variantes/resíduos não usados |
| `src/assets/logo-governo-roraima.jpg` / `-dark.png` / `logo-gov-vaza.png` | Co-branding Governo RR (N8) |
| `src/assets/hero-4-modalidades.jpg`, `silhuetas-modalidades.png` | Arte do portal (vertical esporte) |
| `src/assets/logo-two-solucoes*.png`, `public/images/logo-two-icon.png` | Marca da **desenvolvedora** (Two Soluções) — permanece |
| `public/favicon.png`, `favicon.ico`, `favicon2.png`, `apple-touch-icon.png`, `pwa-192x192.png`, `pwa-512x512.png` | Ícones do app/PWA |
| `public/documentos/*.pdf` (8 arquivos) | Lei 2.301, Decreto 39.840-E, CNPJ, nomeações — documentos do IDJUV servidos estaticamente |

### 3.2 Código que referencia a marca visual

| Arquivo | Ocorrências | Observação |
|---|---:|---|
| `src/components/ui/LogoIdjuv.tsx` | 23 | Componente de logo com nome do cliente na API pública (`LogoIdjuv`, `LogoIdjuvSimple`, `LogoIdjuvLink`, `logoIdjuvOficial`, `logoIdjuvDark`) |
| `src/hooks/useLogoIdjuv.ts` | 8 | `import logoOficial from "@/assets/logo-idjuv-oficial.png"` — import estático, resolvido no build |
| `src/lib/pdfLogos.ts` | 9 | `LOGO_ASPECTOS = { governo: 3.69, idjuv: 1.55 }` — proporções das imagens do cliente codificadas |
| `src/lib/pdfTemplate.ts` | 29 | Imports estáticos das 3 logos + cache (`cachedLogoIDJUVOficial`, etc.) |
| `src/components/reports/ReportHeader.tsx` | 4 | Cabeçalho HTML de relatórios com as duas logos |

### 3.3 Cores institucionais

- **`src/index.css`** — bloco `:root`/`.dark` com as cores derivadas da logo do
  IDJUV, com comentários explícitos:
  - `--primary: 210 65% 25%` — "Azul escuro institucional (da logo IDJUV)"
  - `--secondary: 120 50% 38%` — "Verde vibrante institucional (da logo IDJUV)"
  - `--accent: 200 85% 50%` — "Azul claro (seta da logo)"
  - `--highlight: 48 95% 50%` — "Amarelo/dourado (bandeira brasileira na logo)"
  - `--sidebar-*`, `--ring`, `--shadow-*` derivados dos mesmos tons.
- **`src/lib/pdfTemplate.ts`** — `CORES.primaria = { r:0, g:68, b:68 }` (#004444)
  e `CORES.secundaria = #27AE60`. **Atenção:** estas cores **divergem** das do
  CSS — o PDF usa verde-petróleo, a UI usa azul. Duas paletas paralelas para a
  mesma marca.
- **`src/components/reports/report.styles.ts`** — terceira definição ("Verde
  institucional IDJuv").
- **`tailwind.config.ts`** — não tem cor literal; consome `hsl(var(--*))`.
  ✅ Já está pronto para white label.

### 3.4 Metadados do app

- **`index.html`** (6 ocorrências): `<title>`, `meta description`, `meta author`,
  `apple-mobile-web-app-title`, `og:title`, `og:description`, `twitter:site`
  (`@GovernoRoraima`), `theme-color="#1e40af"`.
  ⚠️ Note que `theme-color` (#1e40af) não corresponde a nenhuma das paletas acima.
- **`vite.config.ts`** — bloco `VitePWA.manifest`: `name`, `short_name`,
  `description`, `theme_color`, `background_color`, lista de ícones.
- **`package.json`** — `"name": "vite_react_shadcn_ts"` (genérico do template;
  sem hardcode de cliente).

---

## 4. N2 — Identidade institucional (dados)

### 4.1 No código

**`src/hooks/useDadosOficiais.ts`** — objeto `FALLBACK_DATA` com **22 chaves**
contendo dados reais do IDJUV embutidos no bundle JavaScript:

```
nome_oficial, nome_curto, natureza_juridica, cnpj (64.689.510/0001-09),
data_criacao, atividade_principal, vinculacao (SEED), endereco_* (7 campos),
email_institucional (idjuv.gab@gmail.com), telefone ((95) 9133-0044),
lei_criacao (Lei nº 2.301/2025), decreto_regulamentacao (Decreto nº 39.840-E),
presidente_nome (nome de pessoa física), presidente_cargo,
presidente_decreto_nomeacao
```

Outros pontos:

| Arquivo | Dado |
|---|---|
| `src/lib/pdfFrequenciaMensalGenerator.ts:103` | CNPJ repetido como literal |
| `src/hooks/useConfigParametros.ts` | `obterInstituicao(codigo = 'IDJUV')` — código do cliente como **valor padrão** do parâmetro |
| `src/pages/admin/DisasterRecoveryPage.tsx:474` | `ti@idjuv.rr.gov.br` |
| `src/pages/ApresentacaoPage.tsx:486`, `HomeSimplesPage.tsx:108` | `contato@idjuv.rr.gov.br` |
| `src/pages/cadastrogestores/ConsultaGestorPage.tsx:214` | `esporte@idjuv.rr.gov.br` |
| `src/pages/eventos/components/SeletivaContatosV2.tsx`, `SeletivaRegulamentoV2.tsx` | `idjuv.diesp@gmail.com` |
| `src/types/gestoresEscolares.ts:65` | Telefone `(95) 3621-3232` |
| `src/pages/TransparenciaPage.tsx`, `transparencia/LicitacoesPublicasPage.tsx` | `https://transparencia.rr.gov.br` |
| `src/components/portarias/RegistrarPublicacaoDialog.tsx:286` | `https://diario.rr.gov.br/...` (placeholder do DOE estadual) |
| `src/pages/portal/components/PortalFooter.tsx:20-24` | Redes sociais: `idjuv_rr`, `idjuvrr`, `@idjuv_rr` |
| `src/pages/eventos/*`, `src/pages/federacoes/CadastroFederacaoPage.tsx` | `instagram.com/idjuv.rr`, `instagram.com/idjuvroraima` |

### 4.2 No banco (o que já existe — e é a boa notícia)

Três tabelas já modelam identidade institucional, **mas se sobrepõem e nenhuma é
usada como fonte única**:

| Tabela | Campos relevantes | Consumo hoje |
|---|---|---|
| `config_institucional` | `codigo`, `nome`, `nome_fantasia`, `cnpj`, `endereco` (jsonb), `contato` (jsonb), **`cores` (jsonb)**, **`logo_url`**, **`brasao_url`**, `expediente`, `politicas`, `responsavel_legal` | `useConfigParametros.obterInstituicao()` |
| `config_autarquia` | `razao_social`, `nome_fantasia`, `cnpj`, `endereco_*` (7 col.), `email_institucional`, `telefone`, `site`, `natureza_juridica`, `responsavel_legal`, `esocial_ambiente`, `regime_tributario`, `responsavel_contabil`/`crc_contabil` | Folha/eSocial |
| `dados_oficiais` | `chave`/`valor`/`categoria`/`lei_referencia`/`bloqueado` (key-value auditável) | `useDadosOficiais` |

> **Achado central:** `config_institucional` já possui `cores`, `logo_url` e
> `brasao_url`. A infraestrutura de branding por banco **existe e está ociosa** —
> nenhum componente de UI lê esses campos. Ver [WHITE_LABEL.md §4](./WHITE_LABEL.md).

---

## 5. N3 e N4 — Textos de UI e documentos gerados

### 5.1 Layout e navegação

| Arquivo | O que está fixo |
|---|---|
| `src/components/layout/Header.tsx` | Logo Governo RR + `alt="Governo do Estado de Roraima"` + texto "Governo de Roraima" + `<LogoIdjuv>` |
| `src/components/layout/Footer.tsx` | Logos, "Boa Vista, Roraima - RR" (fallback), "Acesso exclusivo para servidores do IDJUV...", "Governo do Estado de Roraima" |
| `src/components/layout/ModuleHeader.tsx` | `<LogoIdjuv>` |
| `src/components/menu/MenuSidebar.tsx` | `<LogoIdjuv>`, `<span>IDJUV</span>`, "IDJUV — Sistema Administrativo" |
| `src/components/menu/MenuDrawerMobile.tsx` | Idem (mobile) |
| `src/components/cadastrogestores/HeaderPublico.tsx` | 6 ocorrências |
| `src/pages/portal/components/PortalFooter.tsx` | 8 ocorrências + redes sociais + "Sobre o IDJUV" |
| `src/components/layout/SystemCredits.tsx` | `SYSTEM_VERSION`, `DEVELOPER_NAME = "Two Soluções"`, e-mail e logo da **desenvolvedora** — é marca de produto, não do cliente; deve **permanecer**, mas ser configurável para revenda/OEM |

### 5.2 Geradores de documento (`src/lib/`) — o maior bolsão

**38 geradores `pdf*.ts`**, dos quais **41 arquivos** em `src/lib/` contêm a marca
(364 ocorrências). O padrão repetido em todos:

```ts
doc.text('GOVERNO DO ESTADO DE RORAIMA', 105, 15, { align: 'center' });
doc.text('INSTITUTO DE DESPORTO, JUVENTUDE E LAZER - IDJUV', 105, 20, { align: 'center' });
// ...
doc.text('Documento gerado pelo Sistema de Governança Digital IDJUV', 105, pageHeight - 15, { align: 'center' });
```

Maiores concentrações: `pdfGenerator.ts` (48), `pdfTemplate.ts` (29),
`pdfModelos.ts` (29), `pdfInstitucional.ts` (27), `pdfPortarias.ts` (20),
`pdfFrequenciaMensalGenerator.ts` (15).

Há também texto **normativo** embutido nos PDFs, não só cabeçalho:

- `pdfGenerator.ts:325` — "previstas na IN de Diárias do IDJUV"
- `pdfGenerator.ts:448` — termo de responsabilidade citando "IN de Patrimônio do IDJUV"
- `pdfGenerator.ts:1430/1535` — declarações de acúmulo de cargo e de bens, com
  `unidade_nome || 'IDJuv'` como fallback
- `pdfGenerator.ts:951` — frase de relatório com estatística fixa de 2025

`src/lib/wordPortarias.ts` (docx) e `src/components/reports/ReportFooter.tsx`
("Sistema IDJuv") repetem o padrão em outros formatos.

---

## 6. N5 e N6 — Regras jurídicas, enums e vertical de negócio

### 6.1 Templates de atos administrativos (o caso mais sensível)

`src/types/portaria.ts` (11 ocorrências) e `src/types/portariaUnificada.ts`
(14 ocorrências) contêm **os textos jurídicos das portarias como constantes
TypeScript**, incluindo o fundamento legal específico do IDJUV:

```
O PRESIDENTE DO INSTITUTO DE DESPORTO, JUVENTUDE E LAZER DO ESTADO DE RORAIMA – IDJuv,
no uso das atribuições legais que lhe são conferidas pela Lei nº 2.301, de 29 de
dezembro de 2025, e demais normas aplicáveis,

CONSIDERANDO o disposto no art. 7º, §3º, da Lei nº 2.301/2025, que estabelece que
a investidura nos cargos em comissão do IDJuv dar-se-á por ato do Diretor Presidente;
```

São **11 tipos de ato** (nomeação, exoneração a pedido, exoneração de ofício,
designação, férias, licença, cessão, pessoal, estruturante, normativa, delegação,
dispensa). Cada novo cliente tem outra lei de criação, outro cargo de dirigente e
outra estrutura de competências — **isto não é branding, é regra de negócio
jurídica** e precisa sair do código para dado versionado por instituição.

Páginas inteiras dedicadas a normas do IDJUV:
`src/pages/governanca/DecretoPage.tsx` (14), `LeiCriacaoPage.tsx` (10),
`RegimentoInternoPage.tsx` (9), `EstruturaOrganizacionalPage.tsx` (6),
`src/pages/ApresentacaoPage.tsx` (10).

### 6.2 Enums do Postgres com o nome do cliente

Refletidos em `src/integrations/supabase/types.ts` (arquivo gerado) e em
`src/types/servidor.ts` (23 ocorrências) / `src/types/relatorios.ts`:

| Enum | Valores com o nome do cliente |
|---|---|
| `tipo_servidor` | `efetivo_idjuv`, `comissionado_idjuv` |
| `tipo_vinculo_funcional` | `efetivo_idjuv`, `comissionado_idjuv` |
| `origem_vinculo` | `idjuv` (ao lado de `estado_rr`, `federal`, `municipal`, `outro_orgao`) |

Colunas com o nome do cliente: `cessoes.unidade_idjuv_id`,
`cessoes.funcao_exercida_idjuv` (+ FK `cessoes_unidade_idjuv_id_fkey`).
Consumidas por `src/components/rh/CessaoForm.tsx` (14), `VinculosServidorPanel.tsx`,
`CessoesSection.tsx`, `SegundoVinculoSection.tsx`, `src/hooks/useConfigVidaFuncional.ts` (12).

⚠️ Este é o item de **maior custo de migração** — é schema, não texto.

### 6.3 Vertical de negócio (esporte / juventude)

Não é "marca do IDJUV", é o **ramo de atuação** dele. Para um instituto de
cultura, saúde ou educação, estes módulos são inúteis (ou precisam de outro
recorte):

- Módulos `organizacoes` (federações desportivas), `arbitros`,
  `gestores_escolares` (integração com CBDE), `programas`.
- Páginas `src/pages/eventos/` (Seletiva Estudantil, com regulamento,
  contatos e artes próprias), `src/pages/federacoes/`, `src/pages/cadastro-arbitros/`.
- Enum `tipo_unidade_local`: `ginasio`, `estadio`, `parque_aquatico`, `piscina`,
  `complexo`, `quadra`, `outro`.
- Assets `hero-4-modalidades.jpg`, `silhuetas-modalidades.png`.

Já o **núcleo genérico** (vendável a qualquer órgão público) é: `admin`, `rh`,
`workflow`, `compras`, `contratos`, `financeiro`, `patrimonio` (+ `patrimonio_mobile`),
`governanca`, `integridade`, `transparencia`, `comunicacao`, `gabinete`.

---

## 7. N7 e N8 — Infra, operação e co-branding

| Item | Local | Problema |
|---|---|---|
| Bucket `idjuv-backups` | `supabase/functions/backup-offsite/index.ts` (23 ocorrências, inclusive `createBucket`) | Nome do bucket de destino fixo no código da Edge Function |
| Remetente de e-mail | `supabase/functions/enviar-convite-reuniao/index.ts:6` — `RESEND_FROM ?? "IDJUV <onboarding@resend.dev>"` | Default com marca; corpo do e-mail (linhas 167, 220) também traz o nome por extenso |
| Mapa de tabela legada | `supabase/functions/database-schema/index.ts:124` — `'unidade_idjuv': 'estrutura_organizacional'` | Depende do nome de coluna do cliente |
| Super admin protegido | `src/shared/config/protected-users.config.ts` | UUID **e e-mail pessoal** (`handfabiano@gmail.com`) fixos no código. Precisa virar configuração por instância |
| Migrações históricas | `supabase/migrations/` — 147 ocorrências em 26 arquivos (a maior: 74 numa única migração) | **Não reescrever.** Histórico imutável; corrigir só com migração nova |
| Backups em `public/` | `public/disaster-recovery/` — 39 ocorrências em 26 SQL | Dumps do schema do cliente servidos publicamente; revisar antes de replicar |
| Co-branding Governo RR | `Header`, `Footer`, `PortalFooter`, `ReportHeader`, todos os PDFs | Para outro cliente é "Prefeitura de X"/"Governo de Y" — precisa de **slot de entidade superior**, não de remoção |

---

## 8. Comandos para reauditar

```bash
# Total e distribuição por área
grep -ro -i "idjuv" src/ | wc -l
for d in src/types src/lib src/components src/pages src/hooks supabase/functions; do
  echo "$d: $(grep -ro -i idjuv $d | wc -l) em $(grep -ril idjuv $d | wc -l) arquivos"
done

# Ranking de arquivos
grep -ric "idjuv" src/ | grep -v ':0$' | sort -t: -k2 -rn | head -30

# Outras marcas do contexto
grep -ro -i "roraima" src/ | wc -l
grep -rn "64\.689\.510\|2\.301\|rr\.gov\.br" src/ | wc -l
```

**Critério de aceite do White Label** (ver [WHITE_LABEL.md §7](./WHITE_LABEL.md#7-critérios-de-aceite)):

```bash
grep -ril "idjuv" src/ supabase/functions/ index.html vite.config.ts \
  | grep -v '^tenants/' | wc -l    # deve retornar 0
```
