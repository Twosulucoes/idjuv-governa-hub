# Assets do IDJUV

Imagens da instituição. Migradas de `src/assets/` e `public/` na **Fase 1** do
White Label — o núcleo em `src/` não contém mais marca de cliente.

| Arquivo | Uso | Origem antes da Fase 1 |
|---|---|---|
| `logo-light.png` | Logo do órgão em fundo claro (header, PDFs) | `src/assets/logo-idjuv-oficial.png` |
| `logo-dark.png` | Logo do órgão em fundo escuro (footer, sidebar) | `src/assets/logo-idjuv-dark4.png` |
| `entidade-superior.jpg` | Co-branding Governo do Estado, fundo claro | `src/assets/logo-governo-roraima.jpg` |
| `entidade-superior-dark.png` | Co-branding, fundo escuro | `src/assets/logo-governo-roraima-dark.png` |
| `favicon.png` | Ícone da aba (512×512): atleta com a tocha e a estrela da logo, em fundo azul | redesenhado em 23/10/2026 |
| `favicon.ico` | Ícone legado servido em `/favicon.ico` (16 a 256 px) | redesenhado em 23/10/2026 |
| `apple-touch-icon.png` | Ícone iOS (180×180) | redesenhado em 23/10/2026 |
| `pwa-192x192.png`, `pwa-512x512.png` | Ícones do PWA e splash | redesenhados em 23/10/2026 |
| `favicon-alt.png` | Variante sem uso, preservada da migração | `public/favicon2.png` |
| `documentos/` | PDFs institucionais (lei, decretos, CNPJ) | `public/documentos/` |

Os ícones de 23/10/2026 substituíram o coração genérico (`favicon.ico`), o QR code (PWA)
e a logo larga espremida (`favicon.png`). Foram montados a partir da logo larga do IDJUV (o antigo `favicon.png`):
o atleta branco do "D" e a estrela amarela, sobre o azul da marca (`#005BA4`). No
`index.html`, o `?v=2` nos links força o navegador a trocar o ícone guardado em cache.

## Como são consumidos

- **Logos (runtime):** importadas em `tenant.config.ts` e expostas em
  `marca.assets`. O núcleo lê por `getMarcaAssets()` (libs puras) ou
  `useMarcaAssets()` (React) — nunca por caminho literal.
- **Ícones (build):** `vite.config.ts` copia os arquivos listados em
  `metadata.ts → icones` para `public/` com nomes canônicos. Os destinos em
  `public/` são **gerados e ignorados pelo git**; o original versionado é este.

As proporções reais das logos estão em `marca.proporcaoLogo` no `tenant.config.ts`.
