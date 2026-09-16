# Assets do IDJUV

Imagens da instituição. Migradas de `src/assets/` e `public/` na **Fase 1** do
White Label — o núcleo em `src/` não contém mais marca de cliente.

| Arquivo | Uso | Origem antes da Fase 1 |
|---|---|---|
| `logo-light.png` | Logo do órgão em fundo claro (header, PDFs) | `src/assets/logo-idjuv-oficial.png` |
| `logo-dark.png` | Logo do órgão em fundo escuro (footer, sidebar) | `src/assets/logo-idjuv-dark4.png` |
| `entidade-superior.jpg` | Co-branding Governo do Estado, fundo claro | `src/assets/logo-governo-roraima.jpg` |
| `entidade-superior-dark.png` | Co-branding, fundo escuro | `src/assets/logo-governo-roraima-dark.png` |
| `favicon.png` | Ícone da aba | `public/favicon.png` |
| `favicon.ico` | Ícone legado servido em `/favicon.ico` | `public/favicon.ico` |
| `apple-touch-icon.png` | Ícone iOS | `public/apple-touch-icon.png` |
| `pwa-192x192.png`, `pwa-512x512.png` | Ícones do PWA e splash | `public/` |
| `favicon-alt.png` | Variante sem uso, preservada da migração | `public/favicon2.png` |
| `documentos/` | PDFs institucionais (lei, decretos, CNPJ) | `public/documentos/` |

## Como são consumidos

- **Logos (runtime):** importadas em `tenant.config.ts` e expostas em
  `marca.assets`. O núcleo lê por `getMarcaAssets()` (libs puras) ou
  `useMarcaAssets()` (React) — nunca por caminho literal.
- **Ícones (build):** `vite.config.ts` copia os arquivos listados em
  `metadata.ts → icones` para `public/` com nomes canônicos. Os destinos em
  `public/` são **gerados e ignorados pelo git**; o original versionado é este.

As proporções reais das logos estão em `marca.proporcaoLogo` no `tenant.config.ts`.
