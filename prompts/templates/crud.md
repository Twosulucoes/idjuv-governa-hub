---
descricao: Cadastro completo (listar, criar, editar, excluir) de uma entidade, do banco à tela
---
/superpowers

## Pedido
CRUD de: {{descricao}}

## Módulo
{{modulo}}

## Contexto atual do módulo (gerado do código em {{data}})
{{contexto_modulo}}

## Como executar
- É **architectural** se criar tabela: spec curta em `docs/superpowers/specs/` antes do código.
- Ordem: migração + RLS (`dev-banco-supabase`, skill `migracao-segura-idjuv`) → tipos → hook → componentes → página → rota/menu (`dev-frontend-idjuv`) → docs (`documentador-idjuv`).
- Não edite `src/integrations/supabase/types.ts` à mão; se não der para regenerar, tipe localmente em `src/types/<dominio>.ts` e registre na PR.
- Exclusão: prefira soft delete (`ativo`/`deleted_at`) quando houver histórico ou auditoria.
- Listagem com busca, paginação e estado vazio; formulário com zod e mensagens em português.
- **Não aplique a migração no Supabase remoto** sem confirmação explícita.

## Pronto quando
- `bash scripts/gate.sh` verde; revisões `revisor-codigo-idjuv` e `revisor-seguranca-idjuv` sem bloqueantes.
- `docs/BANCO_DE_DADOS.md`, `docs/MODULOS.md` e `docs/ARQUITETURA.md` atualizados; PR rascunho.
