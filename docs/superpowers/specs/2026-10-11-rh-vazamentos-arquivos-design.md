# Onda E3 do RH — vazamentos e arquivos errados (contracheques, exportação, CNAB e eSocial)

Terceira onda do plano de [REVISAO_RH.md](../../planejamento/REVISAO_RH.md) (seção 6), depois da E1 (#82) e da
E2 (#83). O vazamento de `public/data/cargos.*` já saiu na PR #81. Esta onda fecha os outros riscos vivos da
seção 5 da revisão: salário de todos visível a quem só cadastra servidor, exportação de CPF, PIS e conta sem
permissão própria, e arquivos de banco e do eSocial gerados com dados errados, com folha aberta e apagáveis.

## Premissas

1. **Mudança em RLS e em permissão de rota existentes fica numa migração e num commit separados**, como na E1:
   o dono decide no merge (decisão 3 da revisão). Sem ela, o resto da onda funciona como hoje.
2. **Quem vê contracheque de outros:** quem tem `financeiro.folha.visualizar`; o servidor continua vendo o
   próprio. Se essa permissão vier para todo usuário pelo papel `user` (o catálogo hoje a dá ao papel `user`), a
   leitura passa a uma permissão nova `rh.contracheques.visualizar` (admin e manager), para a restrição valer.
3. **CNAB:** FEBRABAN 240 genérico (decisão 10). Pagamento de salário é tipo de serviço `30` (conferir no manual
   do banco); dados do pagador vêm de `config_autarquia` e `contas_autarquia`, nunca fixos no código.
4. **eSocial continua rascunho** até existir transmissão (onda G): o arquivo sai marcado como não enviado.
5. Nada é aplicado em banco remoto; o CI aplica no merge.

## O que muda

1. **Contracheques (migração e commit à parte):** RLS de SELECT de `fichas_financeiras` e
   `itens_ficha_financeira` (e de `folhas_pagamento`, se for o caminho do vazamento) restrita à permissão da
   premissa 2 ou ao próprio servidor; rota `/rh/contracheques` com a mesma permissão; `ROUTE_PERMISSIONS`.
2. **`/rh/exportar`:** rota com `rh.exportar` (já no catálogo); o registro já entrou na E2.
3. **CNAB:**
   - só gera com folha fechada (trigger no banco que recusa a remessa de folha aberta);
   - numeração da remessa sem corrida (sequência ou trava, com índice único por conta e número);
   - sem DELETE pela API (remessa vira cancelada, com autor e motivo);
   - gerador corrigido: tipo de serviço, nome do banco pela tabela de bancos ou pela conta, dígitos de agência e
     conta, endereço do pagador da configuração;
   - arquivo guardado em bucket privado com sha256 na remessa; baixar de novo serve o arquivo guardado.
4. **eSocial:**
   - só gera com folha fechada; índice único (folha, evento, servidor) para não duplicar ao gerar de novo; sem
     DELETE pela API (retificação fica para a G);
   - ambiente lido da configuração (não fixo em 2), data de pagamento da folha, erro de gravação mostrado;
   - eventos marcados como rascunho não transmitido.
5. **Docs:** `docs/BANCO_DE_DADOS.md`, `docs/RBAC_PERMISSOES.md`, `docs/GUIA_FRONTEND.md`,
   `docs/planejamento/REVISAO_RH.md` (situação), `FINALIZACAO.md` e `ROADMAP.md`.

## Fora

- Retorno CNAB e conciliação (onda H); eSocial de verdade, com tabelas, lote, assinatura e envio (onda G).
- Motor da folha (onda F).
- Apagar o `cargos.json` que ainda está na VPS: ação manual na VPS (o workflow de deploy já remove quando rodar).

## Riscos aceitos nesta onda

- **Conteúdo do CNAB montado no navegador.** O banco calcula `valor_total` e `quantidade_registros` pelas fichas
  e guarda o sha256, mas não confere favorecidos e valores linha a linha. Quem tem `financeiro.folha.processar`
  ainda pode, pela API, enviar um arquivo diferente das fichas. Fecha quando o arquivo for gerado no servidor.
- **Remuneração em `servidores`, `vinculos_servidor` e `pre_cadastros`:** legível por todo o módulo `rh`
  (a RLS filtra linhas, não colunas; privilégio por coluna quebraria os `select('*')`). Fica para uma onda
  que separe esses campos.
- **Dependentes do IRRF** (CPF e nascimento) seguem legíveis pelo módulo: decisão do RH.

