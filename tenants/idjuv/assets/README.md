# Assets do IDJUV

Na **Fase 0** os assets do IDJUV continuam em `src/assets/` — mover as imagens
faz parte da **Fase 1** (build por tenant), junto com a geração do favicon e dos
ícones do PWA a partir desta pasta.

Arquivos que migram para cá quando a Fase 1 for executada:

| Origem em `src/assets/` | Destino |
|---|---|
| `logo-idjuv-oficial.png` | `logo-light.png` |
| `logo-idjuv-dark4.png` | `logo-dark.png` |
| `logo-governo-roraima.jpg` | `entidade-superior.png` |
| `public/favicon.png`, `pwa-192x192.png`, `pwa-512x512.png` | mesmos nomes |

As proporções reais dessas imagens já estão registradas em
`marca.proporcaoLogo` no `tenant.config.ts`.
