# Gerador de prompts — IDJUV Governa Hub

Transforma um pedido curto ("tela de afastamentos no RH") num prompt completo para o Claude, com o
**contexto real do módulo lido do código** (rotas, páginas, guards, hooks usados) e as regras do
repositório já embutidas (RLS, RBAC, tenant, gate, PR rascunho). O objetivo é você escrever uma linha e o
Claude receber o que precisa para acertar de primeira.

## Como usar

| Onde você está | O que escrever |
|---|---|
| Claude Code (terminal, web ou app) | `/prompt tela --modulo rh tela de afastamentos com filtro por período` |
| Chat do projeto no Claude | o mesmo texto (`/prompt …`, `/pendencias`, `/finalizar rh`) — o `CLAUDE.md` manda o Claude seguir o comando |
| Terminal, só para ver/copiar o prompt | `npm run prompt -- tela --modulo rh "tela de afastamentos"` |

Comandos (`.claude/commands/`):

- **`/prompt <tipo> [--modulo <codigo>] <descrição>`** — gera o prompt e executa.
- **`/pendencias [--modulo <codigo>]`** — relatório do que falta: item de menu sem rota, rota sem guard,
  página placeholder/TODO/"em breve"/mock. Não altera código.
- **`/finalizar <codigo>`** — levanta o estado de cada página do módulo, grava o plano em
  `docs/planejamento/FINALIZACAO.md` e para para aprovação antes de implementar.

`npm run prompt` sem argumentos lista tipos e módulos. `--out arquivo.md` grava em vez de imprimir.

## Tipos (`prompts/templates/`)

| Tipo | Para quê | Fluxo |
|---|---|---|
| `tela` | Página nova num módulo existente | `superpowers` + `novo-modulo-idjuv` |
| `crud` | Cadastro completo, do banco à tela | `superpowers` (architectural) |
| `ajuste` | Campo, filtro, coluna, texto, layout | `superpowers` (bounded) |
| `bug` | Correção com causa raiz | `systematic-debugging` |
| `migracao` | Tabela, coluna, view, RPC com RLS | `migracao-segura-idjuv` |
| `relatorio` | PDF, Word ou planilha | `superpowers` |
| `edge-function` | Função Deno no Supabase | `supabase` |
| `finalizar-modulo` | O que falta para o módulo ficar pronto | spike → plano |
| `revisao` | Revisão de qualidade e segurança, sem código | revisores |

## Caminho sugerido para finalizar o sistema

1. `/pendencias` — visão geral do que o código já denuncia como incompleto.
2. `/finalizar <codigo>` módulo a módulo, começando pelos de maior uso (sugestão: `rh`, `financeiro`,
   `patrimonio`, `governanca`). Cada um vira uma seção em `docs/planejamento/FINALIZACAO.md`.
3. Para cada item aprovado: `/prompt <tipo> --modulo <codigo> <descrição>` — uma PR rascunho por item.

## Como estender

- **Tipo novo:** crie `prompts/templates/<tipo>.md` com frontmatter `descricao:` (e, opcional,
  `descricao_padrao:` para quando o pedido vier vazio) e o corpo. Placeholders
  disponíveis: `{{descricao}}`, `{{modulo}}`, `{{contexto_modulo}}`, `{{pendencias}}`, `{{data}}`. Aparece
  sozinho em `npm run prompt`.
- **Contexto novo:** a leitura do código fica em `scripts/prompt.mjs` (regex sobre
  `src/shared/config/modules.config.ts`, `src/App.tsx` e `src/config/menu.config.ts`, sem dependências).
  O relatório de pendências é heurístico — o Claude confirma no código antes de agir.
