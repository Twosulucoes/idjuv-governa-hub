# `docs/superpowers/` — registro do fluxo `/superpowers`

Este diretório guarda os artefatos gerados pelo skill
[`superpowers`](../../.claude/skills/superpowers/SKILL.md) ao classificar um
pedido como **architectural**:

- `plans/AAAA-MM-DD-<feature>.md` — plano de execução gerado pelo skill
  `writing-plans` (Passo 3 do fluxo).
- `specs/AAAA-MM-DD-<tema>-design.md` — spec/desenho gerado pelo skill
  `brainstorming` quando o pedido precisa de mais do que um desenho curto no
  chat.

**Registro, não canônico.** Cada arquivo aqui vale como decisão tomada
**naquela data** — não é atualizado retroativamente para acompanhar o código.
O estado atual do sistema sempre vive nas docs canônicas listadas em
[`docs/README.md`](../README.md) e na matriz de
[`docs/GOVERNANCA-DOCUMENTACAO.md`](../GOVERNANCA-DOCUMENTACAO.md) §2. Se um
plano aqui ficou parcialmente implementado ou foi abandonado, isso se
descobre comparando com o código real — não se edita o plano para "corrigir"
a história.

As pastas existem vazias (`.gitkeep`) até o primeiro pedido architectural
passar pelo fluxo.
