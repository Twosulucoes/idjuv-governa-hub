---
descricao: Tela/página nova num módulo existente (hook + componentes + página + rota + menu)
---
/superpowers

## Pedido
{{descricao}}

## Módulo
{{modulo}}

## Contexto atual do módulo (gerado do código em {{data}})
{{contexto_modulo}}

## Como executar
- Classifique (bounded ou architectural) e siga o fluxo do skill `superpowers`; use o skill `novo-modulo-idjuv` como receita.
- Reaproveite hooks e componentes já listados acima antes de criar novos; dados sempre via hook (`src/hooks/use<Dominio>.ts`) com React Query.
- Rota em `src/App.tsx` no bloco do módulo, com `<ProtectedRoute requiredModule=...>`; permissão também em `ROUTE_PERMISSIONS` (`src/types/auth.ts`) **e** na RLS/RPC.
- Se precisar de tabela/coluna nova, a migração nasce com RLS (skill `migracao-segura-idjuv`).
- Formulários: react-hook-form + zod. UI: shadcn/ui + Tailwind. Textos em português; nada de nome de cliente em `src/` (tenant).

## Pronto quando
- `bash scripts/gate.sh` verde (saída lida).
- Tela vista rodando em 390px e desktop (se houver `.env`; senão diga que não foi possível).
- `docs/MODULOS.md` e `docs/ARQUITETURA.md` atualizados; PR rascunho com premissas.
