# Plano – inventário de campo, fase 1

Spec: `docs/superpowers/specs/2026-10-09-inventario-campo-fase1.md`.

| Nº | Tarefa | Agente | Verificação |
|---|---|---|---|
| 1 | Migração `20261009160000_inventario_campo_fase1.sql` (colunas em `unidades_locais`, 2 tabelas, trigger, bucket privado, policies) + `mapa.csv` + `gerar-rls.mjs` + `overlay/50_storage.sql` | dev-banco-supabase | `scripts/check-migrations.sh`; `node scripts/db/gerar-rls.mjs --check`; aplicar a migração num Postgres local com o shim |
| 2 | Tipos `src/types/inventarioCampo.ts`; `src/lib/filaFotosOffline.ts`; `src/lib/kml.ts`; hooks `useGeolocalizacao`, `useFilaFotosVistoria`, `useVistoriaInventario` | dev-frontend-idjuv | revisão; typecheck no CI |
| 3 | Painel com mapa (Leaflet), rota e link na campanha | dev-frontend-idjuv | build no CI |
| 4 | Vistoria no PWA | dev-frontend-idjuv | build no CI |
| 5 | Revisão de código e de segurança | revisor-codigo-idjuv, revisor-seguranca-idjuv | sem bloqueantes |
| 6 | Docs da matriz (BANCO_DE_DADOS, NOVO_BANCO, baseline README, ARQUITETURA, MODULOS, GUIA_FRONTEND, ROADMAP) | documentador-idjuv | `npm run check:docs` |

Observação: nesta sessão o registro do npm está inacessível (DNS), então `node_modules` não pode ser instalado; typecheck, lint e build rodam no CI (`quality.yml`) ao abrir a PR. A migração é validada com o Postgres local.
