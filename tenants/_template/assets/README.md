# Assets do tenant

Substitua por arquivos da instituição cliente, mantendo os nomes:

| Arquivo | Uso | Formato sugerido |
|---|---|---|
| `logo-light.png` | Fundos claros (header, PDFs) | PNG com fundo transparente |
| `logo-dark.png` | Fundos escuros (footer, sidebar) | PNG com fundo transparente |
| `favicon.png` | Ícone da aba | PNG 512×512 |
| `pwa-192x192.png` | Ícone do PWA | PNG 192×192 |
| `pwa-512x512.png` | Ícone do PWA / splash | PNG 512×512 |
| `entidade-superior.png` | Co-branding (opcional) | PNG horizontal |

Depois de trocar as logos, ajuste `marca.proporcaoLogo` no `tenant.config.ts`
para a proporção real (largura ÷ altura) de cada imagem — é o que impede a
distorção nos documentos gerados.

> A cópia automática destes arquivos para o build entra na **Fase 1** do
> roadmap. Na Fase 0 os assets do IDJUV continuam em `src/assets/`.
