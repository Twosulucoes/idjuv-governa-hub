---
descricao: Levantar o que falta num módulo e propor o plano para deixá-lo pronto para uso
descricao_padrao: Sem observações adicionais.
---
/superpowers

## Objetivo
Deixar o módulo {{modulo}} pronto para uso em produção. {{descricao}}

## Contexto atual do módulo (gerado do código em {{data}})
{{contexto_modulo}}

## Pendências detectadas automaticamente
{{pendencias}}

## Como executar
1. **Spike primeiro, sem código**: percorra cada página do módulo (código e, se houver `.env`, o app rodando) e classifique em *pronta*, *incompleta* (o que falta) ou *quebrada* (erro, dado mockado, botão sem ação).
2. Confira segurança: RLS das tabelas usadas, `ROUTE_PERMISSIONS`, rotas sem guard (lista acima).
3. Grave o resultado em `docs/planejamento/FINALIZACAO.md` (seção do módulo): tabela página → estado → o que falta → esforço (P/M/G).
4. Proponha a ordem de ataque em itens pequenos, cada um já no formato `npm run prompt -- <tipo> --modulo <codigo> "<descrição>"`, e atualize `docs/planejamento/ROADMAP.md`.
5. Pare e peça aprovação antes de implementar qualquer item.
