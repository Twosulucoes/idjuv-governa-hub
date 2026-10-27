# Unidades Locais: uso dos espaços do pedido ao termo

- **Data:** 2026-10-27
- **Classificação:** architectural (tabelas novas, formulário público, regra de alçada, permissões novas)
- **Situação:** planejamento. Nada começa sem o "sim" do dono, entrega por entrega.
- **Pedido:** thread "Levantar a estrutura completa do IDJUV" (27/10/2026). As Unidades Locais "precisam de toda uma
  estrutura de utilização, desde o pedido até a autorização, passando pela agenda, todos os protocolos de
  autorizações e uso, de regra a termos". Prioridade junto com Contratos, antes das outras sugestões.
- **Quem usa:** o Chefe de Unidade Local (Decreto 39.840-E/2026, art. 20: coordena a unidade, executa no local os
  programas do IDJuv, presta informações à sede), a Diretoria de Esporte (eventos e organizações esportivas), a DIRAF
  (a quem as unidades estão vinculadas no quadro de cargos) e a Presidência (cessões e casos que pedem ato no SEI).
  Quem pede: escola, federação, clube, associação, órgão público, pessoa física e o próprio IDJUV.

## 1. Regras que não mudam

1. **O ato é do SEI.** Autorização formal, termo de permissão/cessão de uso, termo de responsabilidade e regulamento
   são feitos e assinados no SEI. O sistema registra nº do processo e do documento, assinatura e DOE (como já faz em
   `termos_cessao` desde a migração `20261023090000`).
2. O sistema controla: o pedido, os documentos entregues, a agenda sem choque de horário, quem autorizou, o termo,
   o uso real, os danos e as pendências de quem usou.
3. Atividade do próprio IDJUV (programa, evento, núcleo esportivo) tem prioridade e entra na mesma agenda.

## 2. O que já existe

| Já existe | Situação | Uso aqui |
|---|---|---|
| `unidades_locais` (tipo, município, endereço, capacidade, `areas_disponiveis`, horário, `regras_de_uso` em texto livre, mapa/polígono) | em uso (Patrimônio → Unidades) | Base. Áreas viram cadastro de espaços (U1) |
| `agenda_unidade` (pedido com solicitante PF/PJ, período, área, público, modalidades, nº SEI, protocolo, anexos; status solicitado → aprovado/rejeitado/cancelado/concluído) | em uso pela aba Agenda, cadastro feito por servidor | Base do pedido. Ganha etapas e recorrência |
| Conferência de choque de horário | **só na tela** (`AgendaReservaForm`), não no banco | Passa para o banco (U1) |
| Aprovação | um clique, por quem tem `unidades.cedencias.gerenciar`, sem alçada | Vira alçada por tipo de uso (U3) |
| `termos_cessao` (termo ligado ao pedido, tipo, cessionário, condições, restrições, aceite, renovações, nº SEI, DOE) | em uso (aba Termos de Cessão) | Termo da etapa U4 |
| `federacao_espacos_cedidos` (uso semanal de federação: dias, horário, termo, portaria) | em uso na ficha da federação, **fora da agenda** | Vira pedido recorrente na agenda (U2), sem cadastro paralelo |
| `nomeacoes_chefe_unidade` (chefe de cada unidade) | em uso (RH) | Diz quem faz a triagem de cada unidade |
| Vistoria de unidade no celular, com fotos e fila offline (`VistoriaUnidade`) | em uso (inventário) | Modelo da vistoria de entrega e devolução (U5) |
| Formulário público com protocolo e consulta (ASCOM) | em uso | Modelo do pedido pelo site (U2) |
| Envio de e-mail e WhatsApp configurável | em uso | Avisar o solicitante (U3) |
| Relatórios de cedência e de unidades | em uso | Ampliados em U6 |

## 3. O fluxo completo

```
1. PEDIDO        site (público, com protocolo) · balcão da unidade · ofício/SEI
      ▼          documentos exigidos conforme o tipo de uso; aceite das regras de uso
2. TRIAGEM       chefe da unidade confere agenda e documentos ──► pré-reserva (segura o horário por N dias)
      ▼                                                        └─► pendência de documento / indeferido
3. AUTORIZAÇÃO   pela alçada do tipo de uso: chefe · Diretoria de Esporte · Presidência (no SEI)
      ▼          registro: quem, quando, nº do documento SEI
4. TERMO         autorização de uso · permissão de uso (recorrente) · cessão de uso (longa)
      ▼          feito no SEI; sistema registra nº, assinatura, DOE e condições
5. AGENDA        horário confirmado; recorrência gera as datas; bloqueios de manutenção e eventos do IDJUV
      ▼
6. USO           entrega do espaço (vistoria com foto) · presença/público · ocorrências
      ▼
7. DEVOLUÇÃO     vistoria de devolução · dano vira pendência (e processo SEI se precisar)
      ▼
8. ENCERRAMENTO  pedido concluído · solicitante com pendência não faz novo pedido até resolver
```

## 4. Entregas propostas

### U1. Espaços e regras de uso
- **Espaços de cada unidade** (tabela nova `unidade_espacos`): quadra, piscina, campo, pista, auditório, sala;
  capacidade, horário, se pode ser usado ao mesmo tempo que outro espaço (ex.: meia quadra).
- **Regulamento de uso** por unidade e por tipo de uso (tabela nova `unidade_regras_uso`): antecedência mínima,
  duração máxima, horários permitidos, documentos exigidos (ex.: estatuto e CNPJ para entidade; alvará e plano de
  segurança para evento acima de X pessoas), se cobra taxa, **quem autoriza** (alçada), e o nº da portaria do
  regulamento no SEI. Texto das regras mostrado ao solicitante.
- **Choque de horário no banco**: restrição de exclusão por espaço e intervalo (`tstzrange`), para dois pedidos
  autorizados nunca ocuparem o mesmo espaço ao mesmo tempo, mesmo vindos de telas diferentes.

### U2. Pedido
- **Formulário público no site** (`/solicitar-espaco`): escolhe a unidade e o espaço, vê a agenda livre (sem nome de
  ninguém), informa finalidade, datas ou recorrência, público, responsável e anexa os documentos pedidos pela regra.
  Recebe o **nº de protocolo** e acompanha em `/solicitar-espaco/consulta` (limite por IP, como os outros formulários).
- **Balcão e SEI**: o servidor registra o pedido que chegou pessoalmente ou por ofício, com o nº SEI.
- **Recorrência**: "terças e quintas, 19h às 21h, de março a novembro" gera as ocorrências de uma vez; o uso semanal
  das federações migra para cá.
- Anexos em bucket privado; CPF e documentos só para quem tem a permissão.

### U3. Triagem e autorização
- Fila do **chefe da unidade** (só as unidades em que ele é chefe): confere, pede documento que falta, faz a
  pré-reserva ou indefere com motivo.
- **Alçada pela regra** (proposta, a confirmar na pergunta Q2):
  - uso rotineiro sem cobrança de ingresso (treino, aula, escola): **chefe da unidade**;
  - evento esportivo com público ou de federação: **Diretoria de Esporte**;
  - uso exclusivo prolongado, cobrança de ingresso, evento de grande porte ou cessão: **Presidência**, no SEI.
- Cada decisão grava quem, quando e o nº do documento SEI, quando houver. O solicitante recebe aviso por e-mail ou
  WhatsApp a cada mudança.

### U4. Termo e agenda única
- O termo (`termos_cessao`) nasce do pedido autorizado, no tipo que a regra manda: **autorização de uso**
  (evento pontual), **permissão de uso** (recorrente) ou **cessão de uso** (longo prazo). Registro do SEI como hoje.
- **Agenda consolidada**: todas as unidades num calendário, filtro por município, unidade e espaço; cores por
  situação (pré-reserva, autorizado, em uso, manutenção, evento do IDJUV).
- **Bloqueios**: manutenção, interdição e eventos do IDJUV fecham horários; pedido que caía no bloqueio é avisado.
- Termo vencendo (recorrente e cessão) entra nos avisos.

### U5. Uso, vistoria e pendências
- No celular, o chefe faz a **entrega** e a **devolução** do espaço com fotos (mesmo componente da vistoria de
  inventário, com fila offline), marca presença/público e registra **ocorrências** (atraso, não comparecimento, dano,
  sujeira).
- Dano ou descumprimento vira **pendência do solicitante**, com prazo; quem tem pendência aberta não faz novo pedido.
- Não comparecimento repetido pode suspender a recorrência (regra configurável).

### U6. Relatórios e indicadores
- Ocupação por unidade e espaço (horas usadas ÷ horas disponíveis), público atendido, usos por tipo, modalidade e
  solicitante, pedidos negados e motivo, pendências.
- Esses números alimentam os **indicadores do IDJUV** (Lei 2.301/2025, art. 3º, IX) e o relatório mensal do chefe da
  unidade (Decreto, art. 20, IV).

## 5. Permissões

| Permissão | Quem | O que libera |
|---|---|---|
| `unidades.visualizar` (módulo) | quem acompanha | ver agenda e pedidos sem dado pessoal |
| `unidades.agenda.triar` (nova) | chefe da unidade | fila e pré-reserva **só das unidades em que é chefe** (conferido no banco por `nomeacoes_chefe_unidade`) |
| `unidades.agenda.autorizar` (nova) | Diretoria de Esporte, Presidência | decidir na alçada que a regra der |
| `unidades.cedencias.gerenciar` (existe) | gestão das unidades | regras, espaços, termos, bloqueios |
| `unidades.gerenciar` (existe) | gestão das unidades | cadastro da unidade |

Formulário público grava só por função do banco com limite por IP; nada de dado pessoal em tela pública. Mudar a
RLS atual de `agenda_unidade` e `termos_cessao` pede confirmação explícita do dono (AGENTS.md, invariante 2).

## 6. Perguntas ao dono

- **Q1.** Existe regulamento ou portaria de uso dos espaços? Se existir, ele vira a regra da U1.
- **Q2.** A alçada proposta (chefe · Diretoria de Esporte · Presidência) está certa?
- **Q3.** O IDJUV cobra taxa pelo uso de algum espaço (ingresso, evento comercial)? Se sim, entra o registro do DAE.
- **Q4.** O pedido pelo site fica aberto a qualquer pessoa, ou só a entidades cadastradas (federações, escolas)?
- **Q5.** Lista das unidades locais com os espaços de cada uma (o cadastro já tem nome e endereço; faltam os espaços).

## 7. Fora deste plano

- Redigir termo, autorização ou regulamento (é do SEI).
- Cobrança e recebimento de taxa (se houver, o sistema só registra o DAE pago).
- Manutenção predial (pedido de serviço): fica na frente "Unidades Locais completas" do roadmap.
