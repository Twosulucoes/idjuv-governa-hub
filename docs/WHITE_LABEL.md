# White Label — Arquitetura e Plano de Execução

Diretrizes para transformar o Governa Hub de "sistema do IDJUV" em **produto
genérico de gestão pública**, clonável e configurável para qualquer instituto,
autarquia, secretaria ou prefeitura sem tocar no código do núcleo.

Leia antes: [INVENTARIO_HARDCODE.md](./INVENTARIO_HARDCODE.md) (o diagnóstico) e
[ARQUITETURA.md](./ARQUITETURA.md) (a arquitetura atual).

---

## 1. Objetivo e princípio

> **Princípio único:** o repositório contém **apenas o núcleo genérico**. Tudo o
> que identifica uma instituição — nome, marca, cores, dados legais, módulos
> contratados, modelos de ato — é **dado de configuração**, nunca código.

Meta operacional: provisionar um cliente novo em **menos de um dia**, executando
um checklist, sem abrir nenhum arquivo `.tsx`.

### Modelo de tenancy adotado

Mantém-se o modelo já documentado em
[MIGRACAO_SUPABASE_PROPRIO.md](./MIGRACAO_SUPABASE_PROPRIO.md) e no skill
`onboarding-cliente-idjuv`: **uma instância isolada por instituição** (projeto
Supabase próprio + deploy próprio), e não banco multi-tenant compartilhado.

Justificativa: dados de RH e folha de pagamento de órgãos públicos distintos não
devem compartilhar banco; o RLS atual foi desenhado para isolamento por unidade
dentro de **um** órgão, não por tenant. Multi-tenant real exigiria `tenant_id` em
231 tabelas e reescrita de todas as políticas de RLS — custo desproporcional.

**Consequência arquitetural:** o código não precisa resolver "qual tenant é este
request?". Precisa apenas ser **tenant-agnóstico** — ler sua identidade de
configuração em vez de tê-la embutida. Isso reduz drasticamente o escopo.

---

## 2. Arquitetura-alvo: três camadas de configuração

```
┌─ CAMADA 0 — AMBIENTE (.env, build-time) ────────────────────────────┐
│ Identidade mínima para o bundle existir: qual Supabase, qual slug   │
│ de tenant, nome do app, cor-semente. Consumida por vite.config.ts,  │
│ index.html e pelo bootstrap antes de haver rede.                    │
└──────────────────────────┬──────────────────────────────────────────┘
                           │  (build)
┌─ CAMADA 1 — PERFIL DO TENANT (arquivo versionado) ──────────────────┐
│ tenants/<slug>/tenant.config.ts + assets/                           │
│ Marca, paleta, módulos habilitados, feature flags, modelos de ato   │
│ padrão, vertical de negócio. Revisável em PR, tipado, testável.     │
└──────────────────────────┬──────────────────────────────────────────┘
                           │  (runtime, override)
┌─ CAMADA 2 — BANCO (editável pelo cliente, sem redeploy) ────────────┐
│ config_institucional (cores, logo_url, brasao_url, contato, ...)    │
│ dados_oficiais (key-value auditável: CNPJ, lei, dirigente, ...)     │
│ modelos_atos, modulos_habilitados                                   │
└─────────────────────────────────────────────────────────────────────┘
```

**Ordem de precedência (do mais forte ao mais fraco):**

```
Banco (Camada 2) → Perfil do tenant (Camada 1) → .env (Camada 0) → fallback genérico do core
```

O fallback genérico **nunca** é o IDJUV: é neutro (`"Sistema de Governança"`,
logo placeholder, paleta azul-cinza neutra). Se alguém clonar o repo sem
configurar nada, deve obter um sistema sem marca — não o IDJUV.

### Por que três camadas e não uma

| Pergunta | Camada certa | Por quê |
|---|---|---|
| Qual Supabase este deploy usa? | 0 (`.env`) | Precisa existir antes de qualquer request |
| Qual o título da aba e o manifest do PWA? | 0 + 1 | Gerados no build, não há React ainda |
| Quais módulos o cliente contratou? | 1 (com override em 2) | Afeta rotas e bundle; muda raramente |
| Qual o CNPJ / endereço / presidente? | 2 (banco) | O cliente edita sozinho, muda com eleição/posse |
| Qual a cor primária? | 2 com default em 1 | Cliente pode querer ajustar sem chamar o fornecedor |
| Qual o texto da portaria de nomeação? | 2 (tabela `modelos_atos`) | É norma jurídica, muda por lei, precisa de auditoria |

---

## 3. Camada 0 — Variáveis de ambiente

Estender o `.env` atual (hoje só Supabase):

```env
# --- Conexão (já existe) ---
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=

# --- Identidade do tenant (novo) ---
VITE_TENANT_SLUG=idjuv                  # seleciona tenants/<slug>/
VITE_APP_NAME="IDJUV - Governa Hub"     # <title>, og:title, manifest.name
VITE_APP_SHORT_NAME="IDJUV"             # manifest.short_name, apple-web-app-title
VITE_APP_DESCRIPTION="Portal de Governança e Transparência"
VITE_BRAND_PRIMARY="#1e40af"            # theme_color do PWA e splash
VITE_PUBLIC_URL=https://governa.idjuv.rr.gov.br

# --- Operação (hoje hardcoded em Edge Functions) ---
BACKUP_BUCKET=idjuv-backups             # remove literal de backup-offsite
RESEND_FROM="IDJUV <nao-responda@idjuv.rr.gov.br>"
SUPER_ADMIN_EMAIL=                      # substitui protected-users.config.ts
SUPER_ADMIN_ID=
```

Consumo no build — `vite.config.ts` deixa de ter literais:

```ts
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      react(),
      VitePWA({
        manifest: {
          name: env.VITE_APP_NAME,
          short_name: env.VITE_APP_SHORT_NAME,
          description: env.VITE_APP_DESCRIPTION,
          theme_color: env.VITE_BRAND_PRIMARY,
          // ícones resolvidos a partir de tenants/<slug>/assets/
        },
      }),
      htmlTenantPlugin(env),   // injeta title/meta/og em index.html
    ],
  };
});
```

`index.html` passa a usar placeholders (`%VITE_APP_NAME%`) resolvidos pelo
`transformIndexHtml` do plugin — mecanismo nativo do Vite, sem dependência nova.

**Manifesto e ícones do PWA** devem ser copiados de `tenants/<slug>/assets/` para
`public/` no `prebuild`, ou gerados por um plugin — hoje são arquivos fixos em
`public/`.

---

## 4. Camada 1 — Perfil do tenant (arquivo)

```
tenants/
├── _template/                  # tenant genérico: ponto de partida de cada cliente
│   ├── tenant.config.ts
│   └── assets/ (logo-light.png, logo-dark.png, favicon.png, pwa-*.png)
├── idjuv/
│   ├── tenant.config.ts
│   └── assets/                 # todas as imagens hoje em src/assets/
└── index.ts                    # resolve VITE_TENANT_SLUG → perfil
```

Contrato (tipado no core, em `src/core/tenant/types.ts`):

```ts
export interface TenantConfig {
  slug: string;

  identidade: {
    nomeOficial: string;        // "Instituto de ... do Estado de ..."
    nomeCurto: string;          // "IDJuv"
    sigla: string;              // "IDJUV"
    naturezaJuridica: string;   // "Autarquia Estadual"
    tratamentoDirigente: string;// "O PRESIDENTE DO ..." (usado nos atos)
  };

  entidadeSuperior?: {          // co-branding (Governo do Estado, Prefeitura...)
    nome: string;               // "Governo do Estado de Roraima"
    logoLight: string;
    logoDark?: string;
    exibirEmDocumentos: boolean;
  };

  marca: {
    logoLight: string;
    logoDark: string;
    favicon: string;
    proporcaoLogo: number;      // substitui LOGO_ASPECTOS.idjuv
    paleta: PaletaTokens;       // ver §5
  };

  modulos: Modulo[];            // subconjunto de MODULES_CONFIG
  verticais: ('esporte' | 'cultura' | 'educacao' | 'saude')[];

  features: {
    portalPublico: boolean;
    transparenciaLai: boolean;
    folhaPagamento: boolean;
    esocial: boolean;
    patrimonioMobile: boolean;
  };

  integracoes?: {
    diarioOficialUrl?: string;  // hoje hardcoded: diario.rr.gov.br
    portalTransparenciaUrl?: string;
    redesSociais?: Partial<Record<'instagram'|'facebook'|'youtube'|'twitter', string>>;
  };
}
```

**Regra de ouro:** nada fora de `tenants/` pode importar de `tenants/<slug>`
diretamente. Só `tenants/index.ts` resolve o slug, e o core consome pela API
única da §6.

---

## 5. Camada 2 — Banco e tema em runtime

### 5.1 Consolidar as três tabelas que já existem

Hoje há `config_institucional`, `config_autarquia` e `dados_oficiais` com campos
sobrepostos e nenhuma servindo de fonte única (ver
[INVENTARIO_HARDCODE.md §4.2](./INVENTARIO_HARDCODE.md#42-no-banco-o-que-já-existe--e-é-a-boa-notícia)).

Decisão recomendada:

| Tabela | Papel no modelo-alvo |
|---|---|
| `config_institucional` | **Fonte única de identidade e branding.** Já tem `cores` (jsonb), `logo_url`, `brasao_url`, `endereco`, `contato`, `expediente` — hoje ociosos |
| `config_autarquia` | Mantida como **extensão fiscal/contábil** (eSocial, CRC, regime tributário). Vira 1:1 com `config_institucional` via FK |
| `dados_oficiais` | Mantida como **registro auditável** de dados legais (tem `lei_referencia`, `documento_url`, `bloqueado`, histórico de alteração). É o lugar certo para CNPJ, lei de criação, dirigente |

Não duplicar: um campo mora em exatamente uma tabela. Uma view
`v_identidade_institucional` reúne tudo para leitura.

### 5.2 Tema em runtime (o mecanismo já está pronto)

`tailwind.config.ts` **já** consome `hsl(var(--token))` para 100% das cores — não
há nenhuma cor literal lá. Basta injetar as variáveis:

```ts
// src/core/tenant/aplicarTema.ts
export function aplicarTema(paleta: PaletaTokens) {
  const root = document.documentElement;
  for (const [token, valor] of Object.entries(paleta)) {
    root.style.setProperty(`--${token}`, valor);  // "210 65% 25%"
  }
}
```

Chamado pelo `TenantProvider` assim que o perfil resolve. O `src/index.css` mantém
os tokens, mas com **valores neutros** (cinza-azulado de produto), e os comentários
"da logo IDJUV" saem.

Cuidado a observar: existem **três paletas divergentes** hoje (CSS `--primary`
azul, `pdfTemplate.CORES.primaria` verde-petróleo #004444, `report.styles.ts`
verde). O white label é a oportunidade de unificar — a paleta do tenant deve ser
**uma só**, com conversão HSL→RGB para o jsPDF.

### 5.3 Logos servidos por Storage

`config_institucional.logo_url` / `brasao_url` já apontam para Storage. A
resolução de logo passa a ser em cascata:

```
URL do banco (cliente trocou pelo painel)
  → asset do perfil do tenant (build)
    → placeholder neutro do core
```

Isso permite ao cliente trocar a própria logo sem redeploy — requisito comum em
órgão público (mudança de gestão, novo brasão).

---

## 6. A API única de consumo

Todo o core passa a falar com **um** ponto:

```ts
// React
const { identidade, marca, entidadeSuperior, features, modulos } = useTenant();

// Fora do React (libs de PDF, geradores, serviços)
const tenant = getTenantSnapshot();   // síncrono, hidratado no bootstrap
```

`getTenantSnapshot()` é essencial: os **38 geradores de PDF** em `src/lib/` são
funções puras, não componentes — não podem usar hooks. O snapshot é preenchido
pelo `TenantProvider` e lido de forma síncrona pelas libs.

### Componentes genéricos que substituem os específicos

| Hoje | Alvo |
|---|---|
| `LogoIdjuv`, `LogoIdjuvSimple`, `LogoIdjuvLink` | `<Logo slot="header\|footer\|sidebar\|pdf" variant="auto\|light\|dark" />` |
| `useLogoIdjuv()` | `useMarca()` |
| `useDadosOficiais()` com `FALLBACK_DATA` do IDJUV | mesmo hook, fallback vindo do tenant |
| `LOGO_ASPECTOS = { governo, idjuv }` | `{ entidadeSuperior, orgao }` vindo do perfil |
| `obterInstituicao(codigo = 'IDJUV')` | `obterInstituicao(codigo = tenant.slug)` |

### Cabeçalho unificado de documentos

Um único helper, usado pelos 38 geradores:

```ts
// src/lib/pdfTemplate.ts
export function cabecalhoOficial(doc: jsPDF, opts?: { compacto?: boolean }) {
  const t = getTenantSnapshot();
  if (t.entidadeSuperior?.exibirEmDocumentos) {
    doc.text(t.entidadeSuperior.nome.toUpperCase(), centro, y);
  }
  doc.text(t.identidade.nomeOficial.toUpperCase(), centro, y + 5);
}

export function rodapeOficial(doc: jsPDF) {
  doc.text(`Documento gerado pelo ${t.identidade.sigla} — ${PRODUTO.nome}`, ...);
}
```

Refatorar os geradores é mecânico (substituir 2–3 linhas por chamada), mas é o
maior volume do trabalho: **364 ocorrências em 41 arquivos**.

---

## 7. Modelos de ato: de código para dado

O ponto mais delicado. Os textos das portarias em `src/types/portaria.ts` e
`portariaUnificada.ts` citam a **Lei nº 2.301/2025, art. 7º, §3º** do IDJUV. Para
outro cliente, a lei é outra, o cargo do dirigente é outro e a competência pode
estar em outro dispositivo.

**Alvo:** tabela `modelos_atos` (o sistema já tem `config_tipos_ato`, então é
extensão natural):

```sql
create table modelos_atos (
  id uuid primary key default gen_random_uuid(),
  tipo_ato text not null,              -- nomeacao, exoneracao_pedido, ...
  titulo text not null,
  preambulo text not null,             -- com placeholders
  consideranda text[],
  artigos jsonb not null,
  vigente_desde date not null default current_date,
  vigente_ate date,
  fundamento_legal text,               -- "Lei nº 2.301/2025"
  ativo boolean default true
);
```

Placeholders padronizados, resolvidos por um único renderizador:

```
{{ORGAO_NOME_OFICIAL}}  {{ORGAO_SIGLA}}  {{DIRIGENTE_TRATAMENTO}}
{{LEI_CRIACAO}}         {{FUNDAMENTO}}   {{NOME_SERVIDOR}}  {{CPF}}
{{CARGO}}               {{SIMBOLO}}      {{UNIDADE}}
```

Os modelos do IDJUV viram **seed** em `tenants/idjuv/seeds/modelos_atos.sql`.
O `_template` traz modelos genéricos com `{{FUNDAMENTO}}` a preencher.

Mesmo tratamento para as páginas `src/pages/governanca/DecretoPage.tsx`,
`LeiCriacaoPage.tsx`, `RegimentoInternoPage.tsx` e `ApresentacaoPage.tsx`: viram
páginas genéricas que renderizam conteúdo de uma tabela `normas_institucionais`
(o módulo CMS já existe em `src/components/cms/`), em vez de JSX com o texto da
norma dentro.

---

## 8. Módulos contratados e verticais

`MODULES_CONFIG` (17 módulos) continua sendo o **catálogo do produto**. O que
muda é que ele deixa de ser a lista de "o que aparece":

```ts
// src/shared/config/modules.config.ts — catálogo (core, não muda por cliente)
export const MODULES_CONFIG: ModuleConfig[] = [ ... ];

// resolução por tenant
export function modulosHabilitados(): ModuleConfig[] {
  const { modulos } = getTenantSnapshot();
  return MODULES_CONFIG.filter(m => modulos.includes(m.codigo));
}
```

Três pontos de consumo:

1. **Menu** (`menu.config.ts`, `module-menus.config.ts`) — filtra seções.
2. **Rotas** (`App.tsx`) — novo guard `<ModuloHabilitado codigo="rh">` que
   devolve 404 para módulo não contratado (hoje 239 rotas sempre registradas).
3. **Dashboards de módulo** (`src/modules/`) — só renderiza os habilitados.

### Separar o núcleo da vertical

| Camada | Módulos | Público |
|---|---|---|
| **Core ERP público** | `admin`, `rh`, `workflow`, `compras`, `contratos`, `financeiro`, `patrimonio`, `patrimonio_mobile`, `governanca`, `integridade`, `transparencia`, `comunicacao`, `gabinete` | Qualquer órgão |
| **Vertical Esporte/Juventude** | `organizacoes` (federações), `arbitros`, `gestores_escolares`, `programas`, páginas `eventos/` | Institutos de esporte |

A vertical vira pacote opcional (`tenant.verticais`), com suas rotas, menus e
enums (`tipo_unidade_local` com ginásio/estádio/piscina) carregados só quando
habilitada. É o que permite vender o mesmo repo para uma secretaria de cultura.

---

## 9. Enums do banco com o nome do cliente

`tipo_servidor`, `tipo_vinculo_funcional` (`efetivo_idjuv`, `comissionado_idjuv`)
e `origem_vinculo` (`idjuv`), além das colunas `cessoes.unidade_idjuv_id` e
`cessoes.funcao_exercida_idjuv`.

Migração em duas etapas, **sem downtime**:

```sql
-- Etapa 1: renomear valores do enum (Postgres 10+, não reescreve a tabela)
alter type tipo_servidor rename value 'efetivo_idjuv' to 'efetivo_orgao';
alter type tipo_servidor rename value 'comissionado_idjuv' to 'comissionado_orgao';
alter type tipo_vinculo_funcional rename value 'efetivo_idjuv' to 'efetivo_orgao';
alter type tipo_vinculo_funcional rename value 'comissionado_idjuv' to 'comissionado_orgao';
alter type origem_vinculo rename value 'idjuv' to 'orgao_proprio';

-- Etapa 2: renomear colunas
alter table cessoes rename column unidade_idjuv_id to unidade_orgao_id;
alter table cessoes rename column funcao_exercida_idjuv to funcao_exercida_orgao;
```

Depois: regenerar `src/integrations/supabase/types.ts` (MCP
`generate_typescript_types`) e atualizar `src/types/servidor.ts`,
`useConfigVidaFuncional.ts`, `CessaoForm.tsx`, `VinculosServidorPanel.tsx`,
`CessoesSection.tsx`, `SegundoVinculoSection.tsx`.

⚠️ **Rótulos de exibição** (`"Efetivo do IDJuv"`) devem virar
`` `Efetivo do ${tenant.identidade.sigla}` `` — o valor do enum é técnico, o
rótulo é do tenant.

⚠️ **Não reescrever migrações históricas** (147 ocorrências em 26 arquivos). O
histórico é imutável; corrige-se com migração nova. Verificar se alguma função
RPC, view ou política de RLS referencia os nomes antigos antes de aplicar.

---

## 10. Infra e Edge Functions

| Item | Correção |
|---|---|
| `backup-offsite/index.ts` — bucket `idjuv-backups` (23 ocorrências, inclusive `createBucket`) | `Deno.env.get('BACKUP_BUCKET') ?? 'governa-backups'` |
| `enviar-convite-reuniao/index.ts` — `RESEND_FROM` default e corpo do e-mail | Default neutro + template lendo `config_institucional` |
| `database-schema/index.ts:124` — mapa `'unidade_idjuv'` | Atualizar após a migração de colunas (§9) |
| `protected-users.config.ts` — UUID + `handfabiano@gmail.com` | `SUPER_ADMIN_ID`/`SUPER_ADMIN_EMAIL` por ambiente. **Manter o fallback por e-mail** — a justificativa documentada no arquivo (UUID muda ao trocar de projeto Supabase) vale ainda mais no cenário multi-instância |
| `public/documentos/*.pdf`, `public/disaster-recovery/*.sql` | ✅ **Feito na Fase 0.** `disaster-recovery/` → `supabase/disaster-recovery/` (27 arquivos deixaram de ser servidos); `documentos/` → `tenants/idjuv/assets/documentos/`. As 3 referências em código passaram a importar via `?url`, virando asset com nome hasheado. `.gitignore` passa a barrar `public/**/*.sql` e as duas pastas. **Ressalva:** isso remove o caminho previsível, não é controle de acesso — a URL hasheada segue pública. Bucket privado + URL assinada continua pendente (Fase 8) |

---

## 11. Roadmap sugerido

Ordenado por **razão valor/risco**, não por tamanho. Cada fase é entregável e
verificável isoladamente (`bun run lint && bun run build`).

| Fase | Escopo | Entregável | Risco |
|---|---|---|---|
| **0. Fundação** ✅ | `src/core/tenant/` (tipos, provider, snapshot, `aplicarTema`), `tenants/_template/`, `tenants/idjuv/` espelhando o estado atual | Sistema idêntico ao de hoje, mas lendo de config | Baixo |
| **1. Build e metadados** | `.env` estendido, `vite.config.ts` sem literais, `index.html` com placeholders, ícones por tenant | Título, manifest e favicon trocam por env | Baixo |
| **2. Marca na UI** | `<Logo>` genérico substitui `LogoIdjuv`; Header, Footer, Sidebar, PortalFooter, ReportHeader consomem `useTenant()`; tema injetado do banco | UI 100% sem marca fixa | Baixo |
| **3. Identidade institucional** | Consolidar `config_institucional`/`config_autarquia`/`dados_oficiais`; remover `FALLBACK_DATA`; e-mails, telefones, URLs e redes sociais para config | Nenhum dado do IDJUV no bundle | Médio |
| **4. Documentos** | `cabecalhoOficial`/`rodapeOficial` no `pdfTemplate.ts`; refatorar os 38 geradores + `wordPortarias` + `report.styles`; unificar as 3 paletas | Documentos com a marca do tenant | Médio (volume) |
| **5. Modelos de ato e normas** | Tabela `modelos_atos` + renderizador de placeholders; páginas de governança via CMS; seeds do IDJUV | Portarias de qualquer órgão | **Alto** (jurídico — validar com o cliente) |
| **6. Módulos e verticais** | `modulosHabilitados()`, guard `<ModuloHabilitado>`, extração da vertical esporte | Venda de core sem vertical | Médio |
| **7. Enums e schema** | Migração de `ALTER TYPE ... RENAME VALUE` e colunas; regenerar types | Schema neutro | **Alto** (banco em produção) |
| **8. Infra e guarda** | Edge Functions por env; super admin por env; regra de CI que barra "idjuv" fora de `tenants/` | Regressão impossível | Baixo |

**Fases 0–2 já entregam a demo comercial** (sistema com outra marca rodando).
As fases 5 e 7 exigem validação jurídica e janela de manutenção do banco.

### Status da execução

**Fase 0 — CONCLUÍDA.** O que foi entregue:

| Entregue | Onde |
|---|---|
| Contrato `TenantConfig` | `src/core/tenant/types.ts` |
| Resolver por `VITE_TENANT_SLUG` + fallback neutro | `src/core/tenant/resolver.ts` |
| Snapshot síncrono para libs puras | `src/core/tenant/snapshot.ts` |
| Aplicação de tema por CSS custom properties | `src/core/tenant/tema.ts` |
| Provider + hooks (`useTenant`, `useIdentidade`, `useMarca`, `useModuloHabilitado`) | `src/core/tenant/` |
| Perfil neutro de partida | `tenants/_template/` |
| Perfil do IDJUV espelhando o estado atual | `tenants/idjuv/tenant.config.ts` |
| Registro de tenants | `tenants/index.ts` |
| Alias `@tenants`, `include` do tsconfig, `VITE_TENANT_SLUG` | `vite.config.ts`, `tsconfig*.json`, `.env` |

**Cor institucional canônica decidida: azul `#164069`** (`hsl(210 65% 25%)`),
registrada em `marca.corPrimariaHex`. Resolve a divergência das três paletas.
PDFs (`pdfTemplate.CORES` = `#004444`) e `index.html` (`theme-color` = `#1e40af`)
seguem com os valores antigos — migrá-los muda o visual de documentos já
emitidos e é escopo da **Fase 4**.

**Verificações executadas** (todas passando):

- 46/46 tokens de marca (light + dark) do perfil do IDJUV conferem com `src/index.css`.
- 22/22 chaves do `FALLBACK_DATA` de `useDadosOficiais` idênticas após passarem a
  ser derivadas do perfil.
- Em browser real: `<style id="tenant-theme">` único no DOM, `--primary`
  `210 65% 25%` no light e `200 85% 55%` no dark, tenant resolvido para `idjuv`
  (não para o perfil neutro).
- Com o Supabase indisponível, o fallback derivado do perfil chega à UI.
- `tsc -b` sem erros; `bun run build` OK; ESLint sem novos problemas.

**Adiantado da Fase 1 por motivo de segurança:** os documentos institucionais
saíram de `public/` junto com os dumps (ver §10) — não fazia sentido mover uns e
deixar os outros no diretório servido sem autenticação.

**Não feito na Fase 0** (continua como planejado): assets de imagem seguem em
`src/assets/`; `index.html` e o manifest do PWA seguem com literais; a lista
`modulos` do perfil ainda é informativa (o guard é a Fase 6).

---

## 12. Critérios de aceite

O trabalho está concluído quando **todos** passam:

1. **Grep limpo** — nenhuma ocorrência do cliente fora da pasta do tenant:
   ```bash
   grep -ril "idjuv\|roraima" src/ supabase/functions/ index.html vite.config.ts \
     | grep -v '^tenants/' | wc -l    # == 0
   ```
2. **Teste do clone** — `cp -r tenants/_template tenants/novocliente`, ajustar
   `.env`, `bun run build`: o sistema sobe sem marca do IDJUV e sem erro.
3. **Sem regressão** — `bun run lint && bun run build` limpos; instância do IDJUV
   visualmente e funcionalmente idêntica à de antes.
4. **Troca a quente** — alterar `cores` e `logo_url` em `config_institucional`
   reflete na UI e nos PDFs **sem redeploy**.
5. **Módulo desligado some** — remover um módulo de `tenant.modulos` tira o item
   do menu **e** devolve 404 na rota.
6. **Guarda de CI** — regra de lint/CI que falha o build ao introduzir o nome de
   um cliente fora de `tenants/`.

### Guarda recomendada (CI)

```bash
# scripts/check-white-label.sh
VAZAMENTOS=$(grep -ril -E "idjuv|roraima" src/ supabase/functions/ index.html \
  | grep -v '^tenants/' || true)
if [ -n "$VAZAMENTOS" ]; then
  echo "❌ Marca de cliente fora de tenants/:"; echo "$VAZAMENTOS"; exit 1
fi
```

---

## 13. Riscos e pontos de atenção

| Risco | Mitigação |
|---|---|
| **Sincronização com o Lovable** — commita automaticamente e pode reintroduzir hardcode | Fazer o white label em fases curtas e mergeadas rápido; a guarda de CI (§12) detecta reintrodução |
| **`App.tsx` com 1.281 linhas e 239 rotas** — alto risco de conflito de merge | Tratar o guard de módulo como wrapper, não reorganizar o arquivo na mesma fase |
| **`types.ts` gerado (~23 mil linhas)** | Nunca editar à mão; regenerar após cada migração (§9) |
| **Templates jurídicos** | Fase 5 exige validação do jurídico do cliente — errar o fundamento legal invalida o ato administrativo |
| **Migração de enum em produção** | Aplicar em branch do Supabase primeiro; verificar funções/views/políticas de RLS que citem os valores antigos |
| **Três paletas divergentes** (CSS azul / PDF #004444 / report verde) | Unificar na fase 4; decidir **qual** é a cor institucional real antes de parametrizar |
| **Dados de cliente no repositório** (`public/documentos/`, `public/disaster-recovery/`) | Mover para Storage antes de entregar o repo a outro cliente — hoje qualquer um que clone leva documentos e dumps do IDJUV |
| **Escopo confundido com "trocar a logo"** | Os níveis N5 (jurídico), N6 (vertical) e N9 (enums) são os que realmente decidem se o produto é revendável |

---

## 14. Relação com o que já existe

O projeto **não parte do zero**. Já estão prontos ou quase:

- ✅ `tailwind.config.ts` 100% baseado em tokens CSS — tema trocável sem tocar nele.
- ✅ `config_institucional` com `cores`, `logo_url`, `brasao_url` — **ociosos**.
- ✅ `dados_oficiais` key-value auditável, com `lei_referencia` e `bloqueado`.
- ✅ `MODULES_CONFIG` como catálogo declarativo de módulos.
- ✅ `docs/MIGRACAO_SUPABASE_PROPRIO.md` + `SCHEMA_SUPABASE_PROPRIO.sql` —
  provisionamento de instância nova.
- ✅ Skill `onboarding-cliente-idjuv` — checklist de provisionamento, que já
  lista estas pendências como pré-requisito.

O que falta é **conectar** o que existe e **remover** o que está fixo. Depois das
fases 0–3, o skill de onboarding deixa de ter a seção "o que ainda falta no
código para isso ser produto".
