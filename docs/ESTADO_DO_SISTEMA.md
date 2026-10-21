# Estado do sistema

> **Arquivo gerado — não edite à mão.** Sai de `scripts/estado-do-sistema.mjs`, que conta direto do
> código (sem banco). Para atualizar: `npm run estado`. O gate (`bash scripts/gate.sh`) reprova se este
> arquivo estiver desatualizado. Os outros documentos não repetem estes números: apontam para cá.

## Rotas

Cada `<Route>` conta uma vez. Protegida: usa `ProtectedRoute` (inclusive redirecionamento protegido).
Redirecionamento: só `Navigate`, sem `PublicPageGuard`. Curinga: `path="*"`. Pública: o resto.

| Arquivo | Total | Protegidas | Públicas | Redirecionamentos | Curinga |
|---|---:|---:|---:|---:|---:|
| `src/App.tsx` (sistema) | 249 | 199 | 34 | 15 | 1 |
| `src/AppSite.tsx` (site) | 32 | 0 | 29 | 2 | 1 |

## Código do front

| Item | Quantidade |
|---|---:|
| Páginas (`*Page.tsx` em `src/pages`) | 211 |
| Componentes (`.tsx` em `src/components`) | 318 |
| — dos quais shadcn/ui (`src/components/ui`) | 43 |
| — fora de `ui/` | 275 |
| Hooks (`src/hooks/use*.ts(x)`, sem testes) | 102 |
| Arquivos de teste vitest (`*.test.*` em `src` e `scripts`) | 55 |
| Linhas de `src/App.tsx` | 1369 |
| Linhas de `src/integrations/supabase/types.ts` (gerado) | 27296 |

### Páginas por pasta de `src/pages`

| Pasta | Páginas |
|---|---:|
| (raiz) | 16 |
| `admin/` | 31 |
| `ascom/` | 5 |
| `avisos/` | 1 |
| `cadastro-arbitros/` | 2 |
| `cadastrogestores/` | 6 |
| `cargos/` | 2 |
| `comunicacao/` | 6 |
| `curriculo/` | 4 |
| `eventos/` | 3 |
| `federacoes/` | 3 |
| `financeiro/` | 14 |
| `folha/` | 4 |
| `formularios/` | 5 |
| `gabinete/` | 1 |
| `governanca/` | 7 |
| `instituicoes/` | 1 |
| `integridade/` | 2 |
| `inventario/` | 20 |
| `mobile/` | 2 |
| `modulos/` | 12 |
| `organograma/` | 2 |
| `patrimonio/` | 1 |
| `processos/` | 7 |
| `programas/` | 10 |
| `public/` | 4 |
| `rh/` | 25 |
| `sistema/` | 2 |
| `transparencia/` | 6 |
| `unidades/` | 5 |
| `workflow/` | 2 |

## Banco

| Item | Quantidade |
|---|---:|
| Migrações (`supabase/migrations/*.sql`) | 306 |
| Migração mais recente | `20261023090000_registro_sei_termo_cessao_designacao.sql` |
| Tabelas do schema public (baseline) | 258 |
| Views (baseline) | 18 |
| Funções (baseline) | 311 |
| — de gatilho (`RETURNS trigger`) | 121 |
| — demais | 190 |
| Enums (baseline) | 109 |
| Policies (`CREATE POLICY` em `supabase/baseline/**/*.sql`) | 1900 |
| Linhas de `supabase/baseline/rls/mapa.csv` | 258 |
| Edge Functions (`supabase/functions`, sem `_shared`/`main`) | 9 |

Tabelas, views, funções e enums vêm de `supabase/baseline/schema/01_pre_data.sql`.

## Módulos

17 módulos em `MODULOS` (`src/shared/config/modules.config.ts`). Rotas do sistema
(`src/App.tsx`, sem redirecionamentos e curinga) contadas pelo mesmo critério de `moduloDaRota`
(prefixo mais longo).

| Código | Nome | Rotas protegidas | Rotas públicas |
|---|---|---:|---:|
| `admin` | Administração | 33 | 0 |
| `rh` | Recursos Humanos | 33 | 3 |
| `workflow` | Processos | 3 | 0 |
| `compras` | Compras | 5 | 0 |
| `contratos` | Contratos | 1 | 0 |
| `financeiro` | Financeiro | 18 | 0 |
| `patrimonio` | Patrimônio | 30 | 0 |
| `governanca` | Governança | 10 | 2 |
| `integridade` | Integridade | 5 | 1 |
| `transparencia` | Transparência | 3 | 7 |
| `comunicacao` | Comunicação | 14 | 2 |
| `programas` | Programas | 11 | 2 |
| `gestores_escolares` | Gestores Escolares | 5 | 2 |
| `organizacoes` | Organizações | 3 | 0 |
| `gabinete` | Gabinete | 7 | 0 |
| `patrimonio_mobile` | Patrimônio Mobile | 1 | 1 |
| `arbitros` | Árbitros | 1 | 1 |
| — | sem módulo (transversais e públicas gerais) | 16 | 13 |
