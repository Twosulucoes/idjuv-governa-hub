# Assets do tenant

Placeholders neutros — um bloco cinza-azulado com glifo institucional genérico.
Existem para que um clone sem configuração suba **sem marca**, nunca com a marca
de outro cliente.

Substitua pelos arquivos da instituição, **mantendo os nomes**:

| Arquivo | Uso | Formato sugerido |
|---|---|---|
| `logo-light.png` | Fundos claros (header, PDFs) | PNG com fundo transparente |
| `logo-dark.png` | Fundos escuros (footer, sidebar) | PNG com fundo transparente |
| `entidade-superior.png` | Co-branding (opcional) | PNG horizontal |
| `entidade-superior-dark.png` | Co-branding em fundo escuro (opcional) | PNG horizontal |
| `favicon.png` | Ícone da aba | PNG 512×512 |
| `favicon.ico` | Ícone legado `/favicon.ico` | ICO multi-resolução |
| `apple-touch-icon.png` | Ícone iOS | PNG 180×180 |
| `pwa-192x192.png` | Ícone do PWA | PNG 192×192 |
| `pwa-512x512.png` | Ícone do PWA / splash | PNG 512×512 |

Trocar o arquivo basta: nenhum código muda. Se usar outra extensão, ajuste o
import em `tenant.config.ts` (logos) ou o bloco `icones` em `metadata.ts`.

Depois de trocar as logos, ajuste `marca.proporcaoLogo` no `tenant.config.ts`
para a proporção real (largura ÷ altura) — é o que impede distorção nos
documentos gerados.
