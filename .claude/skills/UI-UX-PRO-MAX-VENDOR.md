# Skill vendorizado: UI/UX Pro Max

Origem: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill (MIT, © Next Level Builder — ver
`UI-UX-PRO-MAX-LICENSE`)
Versão: 2.13.0 · commit `1a2c459b35f26116fd165b0a0f30597f252749ff` · copiado em 2026-10-09

Cópia fiel de `.claude/skills/ui-ux-pro-max/` do repositório de origem, **sem** a pasta
`scripts/tests/` (fixtures de teste do próprio projeto). Os outros skills do pacote (`design`,
`brand`, `slides`, `banner-design`, `ui-styling`, `design-system`) e o CLI `uipro` não foram
trazidos: o IDJUV só usa a base de conhecimento de UI/UX. **Não edite a pasta à mão**; para
atualizar, copie de novo a pasta do commit desejado e atualize esta nota.

## Revisão de segurança (feita antes de vendorizar)

- `scripts/*.py` usam apenas a biblioteca padrão do Python (`csv`, `re`, `json`, `pathlib`,
  `argparse`, `tempfile`…). Sem rede, sem `subprocess`, sem `eval`/`exec`, sem dependências.
- Só escrevem em disco com `--persist` (cria `design-system/<projeto>/MASTER.md` no
  `--output-dir`). **Não use `--persist` neste repo**: o design system do IDJUV vive em
  `docs/` e nos tokens de `src/index.css` + perfil do tenant.
- `data/*.csv` é conhecimento de referência (paletas, fontes, guias de UX). Trate os resultados
  como recomendação: `CLAUDE.md`, `AGENTS.md` e o contrato de tenant prevalecem.

## Como rodar neste repo

O `SKILL.md` de origem cita `${CLAUDE_PLUGIN_ROOT}`, que não existe em skill de projeto. Aqui o
caminho é relativo à raiz do repositório:

```bash
python3 -B .claude/skills/ui-ux-pro-max/scripts/search.py "<consulta>" --domain ux
python3 -B .claude/skills/ui-ux-pro-max/scripts/search.py "<consulta>" --stack shadcn
python3 -B .claude/skills/ui-ux-pro-max/scripts/search.py "<consulta>" --design-system -f markdown
```

`-B` evita gerar `__pycache__` dentro de `.claude/`.

## Ressalvas de stack

As diretrizes `--stack shadcn` da origem já assumem **Tailwind v4 + OKLCH + `@theme inline`**.
O IDJUV está em **Tailwind 3 com tokens HSL** (`src/index.css`, `src/core/tenant/tema.ts`).
Siga a intenção (tokens semânticos, dark mode completo, nada de cor crua em componente), não a
sintaxe v4, até uma migração de Tailwind ser decidida à parte.
