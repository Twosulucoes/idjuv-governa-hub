---
descricao: Relatório/documento (PDF, Word ou planilha) gerado pelo sistema
---
/superpowers

## Pedido
{{descricao}}

## Módulo
{{modulo}}

## Contexto atual do módulo (gerado do código em {{data}})
{{contexto_modulo}}

## Como executar
- Reaproveite a base: `src/lib/pdfTemplate.ts`/`pdfLogos.ts` (PDF), `src/lib/word*.ts` (docx), `src/export/` e `src/lib/exportar*.ts` (xlsx). Procure um gerador parecido em `src/lib/pdf*.ts` e siga o padrão.
- Identidade (nome, brasão, cabeçalho) via `getTenantSnapshot()` de `@/core/tenant` — nunca literal do cliente.
- Dados via hook/RPC já filtrados pela RLS; não exporte dado pessoal além do necessário (LGPD).

## Pronto quando
- Documento gerado de verdade com dados de exemplo e conferido; `bash scripts/gate.sh` verde; PR rascunho.
