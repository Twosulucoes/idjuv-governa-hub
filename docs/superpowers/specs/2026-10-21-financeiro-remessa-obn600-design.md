# Financeiro: remessa OBN600 gerada pelo sistema

- **Data:** 2026-10-21
- **Classificação:** bounded (colunas novas, uma RPC nova, duas RPCs com versão final, uma aba nova; sem tabela nova)
- **Pedido:** thread "Remessa e retorno do Banco do Brasil". O usuário pediu um gerador de remessa para o BB e o
  recebimento do retorno para consolidar os pagamentos, mandando duas remessas OBN600 de hoje como modelo. Escolheu o
  formato OBN600 (igual ao do sistema estadual) e aprovou o desenho do banco ("pode").
- **Muda a premissa 5** da spec [`2026-10-11-financeiro-fiplan-banco-design.md`](./2026-10-11-financeiro-fiplan-banco-design.md)
  ("o OBN600 só é lido, nunca gerado"): agora o sistema também gera o OBN600 a partir dos seus pagamentos.

## O que já existia

A leitura do retorno: a importação de arquivos bancários (`importar_arquivo_bancario`, leitor
`src/lib/bancario/obn600.ts`) grava os movimentos, casa cada um com o pagamento e dá a baixa (pago ou recusado).
O que faltava era gerar a remessa.

## Leiaute (350 posições, CRLF entre as linhas, sem CRLF no fim)

O gerador `src/lib/bancario/obn600Remessa.ts` reproduz byte a byte as remessas reais de 25/09, 08/10 e 15/10/2026
(conferido fora do repositório, porque os arquivos têm dados de credores; os testes usam dados fictícios). A única
diferença aceita: espaços sobrando em nome e endereço são retirados. Posições no comentário do leitor e do gerador.

- Header `0`: data e hora, nº da remessa (048-052), `10` remessa, `B`, banco `001`, código do cliente (059-067).
- OB `2`: agência pagadora, UG, gestão, nº da relação, nº da OB, data, tipo (`32` BB, `31` outro banco), valor,
  banco/agência/conta do favorecido, nome, endereço, município, CEP (em branco se não houver), UF, tipo de inscrição
  (`01` CNPJ, `02` CPF), CPF/CNPJ, agência e conta pagadora.
- Trailer `9`: soma dos valores e soma dos sequenciais dos registros anteriores.

## Banco

Migração `20261024090000_fin_remessa_obn600.sql` (detalhe em [BANCO_DE_DADOS.md](../../BANCO_DE_DADOS.md)):

1. `contas_autarquia` ganha `obn_codigo_cliente`, `obn_unidade_gestora` e `obn_gestao` (dado do cliente fica no
   banco, nunca no código), editáveis na aba **Contas pagadoras** da Conciliação bancária (o mesmo cadastro de Configurações da Folha → Bancos:
   uma conta só, usada pela folha e pelos pagamentos do Financeiro).
2. `registrar_remessa_obn600` monta as OBs no servidor a partir dos pagamentos programados/autorizados, reserva o nº
   da remessa e os pagamentos (`fin_pagamentos.remessa_bancaria_id`).
3. `confirmar_remessa_bancaria` grava o hash e o nº da OB em `identificador_transacao`; o retorno casa por ele.
4. `cancelar_remessa_bancaria` libera os pagamentos de uma reserva sem arquivo.

Numeração (premissas, conferir com o banco):

- nº da OB = exercício + sequência do pagamento (`OP-000123` de 2026 → `02026000123`): único e rastreável;
- nº da relação = exercício + nº da remessa + tipo de OB;
- nº da remessa continua por conta; na primeira, o usuário informa de onde continua.

Permissão: a mesma `pagamento.conciliar` do reenvio pelo Gestão MAX (sem código novo). RLS das tabelas sem mudança:
as policies de `fin_remessas_bancarias` (SELECT pelo módulo, escrita só pelas RPCs) seguem; as colunas novas de
`contas_autarquia` e `fin_pagamentos` seguem as policies que essas tabelas já têm. O trigger de proteção do pagamento
(`fin_pagamentos_proteger_baixa`, versão final) impede, pela API, de pôr ou tirar um pagamento de uma remessa e, com
o pagamento numa remessa, de mudar valor, favorecido, conta e nº da OB: o que foi ao banco não muda por baixo.

## Tela

Conciliação bancária ganha a aba **Remessa OBN600**: lista os pagamentos do exercício que ainda não saíram, mostra o
que falta (CPF/CNPJ, conta), e o usuário seleciona e gera. O arquivo só é baixado depois de confirmado no banco. A
lista "Arquivos gerados" mostra as duas espécies de arquivo e baixa de novo conferindo o SHA-256.
A aba **Contas pagadoras** mostra o cadastro de contas da instituição (`contas_autarquia`) dentro do Financeiro, para
que quem gera a remessa não precise passar pela Folha; a permissão é a da própria Conciliação (`pagamento.conciliar`),
e a escrita segue as policies da tabela (módulo Financeiro ou RH).
Os favorecidos (tabela `fornecedores`) se cadastram em **Financeiro → Favorecidos** (migração `20261025090000`: o
Financeiro lê, cadastra e edita, sem apagar), com o banco escolhido na lista `bancos_cnab`, que vem preenchida; a tela
recusa agência e conta fora da regra do arquivo. Financeiro → Contas Bancárias (tesouraria) aponta para as duas telas.

## Fora desta entrega

- Fatura/guia com código de barras (tipo 38): não entra na remessa.
- Confirmar com o BB (ou com a SEFAZ) se o IDJUV pode enviar o OBN600 por fora do sistema estadual, e se a
  numeração própria de remessa e de OB não colide com a do sistema estadual. Antes do uso real, testar uma remessa.
- Manual oficial do leiaute: os significados marcados "conferir no manual" seguem deduzidos dos arquivos.
