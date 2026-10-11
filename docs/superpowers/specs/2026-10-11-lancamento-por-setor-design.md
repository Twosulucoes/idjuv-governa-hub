# Lançamento só por servidor do setor (todos os módulos)

Pedido do dono do produto (2026-10-11): todo lançamento, de qualquer módulo, é feito por um servidor; quem
lança RH é servidor do RH, quem lança patrimônio é do patrimônio, compras é do pessoal de compras. Login sem
servidor (inclusive o administrador) só consulta. A exceção é o servidor **designado pelo sistema** para
responder por outro setor ou membro de uma comissão (por exemplo, o levantamento patrimonial), com ato,
período e motivo, e a trilha mostra por qual designação ele lançou.

Classificação: **architectural** (trigger e RLS de ~200 tabelas, RBAC, trilha, Edge Functions e front).
**Desenho aprovado pelo dono em 2026-10-11** ("Sim"), com as premissas 1 a 8. A lista de setores de cada módulo
ainda não veio: a fase 1 nasce com o cadastro vazio e em modo registrar, sem bloquear ninguém.

## O que existe hoje (levantamento de 2026-10-11, só leitura)

- **Setores:** `estrutura_organizacional` (hierarquia por `superior_id`). Nada diz qual unidade é o RH, o
  patrimônio ou compras; os dados reais só existem em produção.
- **Lotação:** `lotacoes` (uma ativa por servidor, por trigger). `servidores.unidade_atual_id` é derivado e pode
  ficar defasado (criar lotação não o recalcula). Não há função "lotação vigente".
- **Designação:** `designacoes` já é "trabalhar em outra unidade sem mudar a lotação", com unidade de origem e
  destino, período, ato (opcional) e justificativa, e fluxo pendente → aprovada → encerrada com aprovador
  gravado pelo banco (E1).
- **Comissões:** não existem como cadastro. Há colunas soltas (`campanhas_inventario.equipe_coleta`,
  `baixas_patrimonio.comissao_responsavel` em texto, `contratos.gestor_id`/`fiscal_id`,
  `processos_licitatorios.pregoeiro_id`).
- **Onde a regra cabe:** a E1 já tem o ponto certo no RH, o trigger `zz_fixar_autoria`, que roda em toda
  gravação (inclusive pelas RPCs) e já checa o vínculo (`rh_exige_servidor_vinculado()`, hoje `false`). Fora do
  RH não há autoria nem trilha genérica. (Na implementação a checagem ficou num trigger próprio, `zz_exigir_setor`,
  com `zz_exigir_setor_fim` por comando; `zz_fixar_autoria` só fixa a autoria. Ver "Fase 1".)

## Desenho proposto

### Regra

Uma gravação (inserir, alterar, excluir) numa tabela do módulo M é aceita quando o login tem servidor
vinculado e há um **fundamento** vigente na data:

| Fundamento | Quando vale |
|---|---|
| `lotacao` | lotação ativa do servidor numa unidade que é setor de M |
| `designacao` | designação aprovada e vigente para uma unidade que é setor de M, com ato |
| `comissao` | o servidor é membro de comissão vigente de M (com ato), no objeto dela (fase 2) |
| `autoatendimento` | o servidor grava o que é dele (pedir férias, frequência, abono, requerimento) |
| `chefia` | o chefe da unidade decide etapa do subordinado (frequência, férias, licença) |
| `sistema` / `anonimo` | jobs, Edge Functions e formulários públicos, que têm regra própria |

Fundamento **autoconcedido não conta**: lotação, cessão ou designação lançada ou aprovada pelo próprio servidor não
é fundamento (ver "Ajustes das revisões").

Sem fundamento, o banco recusa com mensagem clara ("seu login não tem servidor vinculado" ou "você não está
lotado nem designado no setor de patrimônio"). A trilha grava o fundamento usado (lotação, designação ou
comissão, com o ato).

### Cadastros novos

1. **Setores de cada módulo** (`setores_modulo`): quais unidades da estrutura são o RH, o patrimônio, compras…,
   com ou sem as subordinadas. Mantido pelo admin; os dados vêm do órgão (nada fixo no código).
2. **Comissões** (`comissoes` + `comissoes_membros`): nome, tipo (inventário, licitação, fiscalização de
   contrato…), módulo, objeto opcional (campanha, contrato, processo), ato obrigatório, período, motivo e
   membros com papel.
3. **Designação:** reaproveita `designacoes`; para servir de fundamento, exige ato e estar aprovada e vigente.

### Onde a regra roda

- Trigger único no banco em cada tabela de lançamento, gerado a partir do `mapa.csv` (o mesmo mapa que gera a
  RLS), para pegar também as RPCs. Cache por transação, como a trilha da E1.
- Função de consulta para o front mostrar "somente consulta" e desabilitar os botões de quem não pode lançar.
- Autoria e trilha da E1 estendidas aos outros módulos, para a trilha mostrar o fundamento em todos.

### Transição sem travar o órgão

1. Saneamento: relatório de servidores sem login vinculado, sem lotação ativa ou com lotação divergente;
   cadastro dos setores de cada módulo.
2. **Modo registrar**: a regra só anota na trilha quem seria bloqueado, sem bloquear. Relatório por módulo.
3. Cadastro das designações e comissões que faltarem (por exemplo, a comissão do inventário com os coletores).
4. **Modo exigir**, módulo a módulo, cada um numa migração pequena.

## Premissas (valem até o dono dizer o contrário)

1. **Configuração de acesso continua com o admin** (usuários, papéis, permissões, setores dos módulos): a regra
   vale para lançamento de domínio. Sem isso ninguém consegue configurar o sistema.
2. **A chefia continua aprovando** frequência, férias e licenças do subordinado, mesmo fora do RH (fundamento
   `chefia`); a etapa do RH continua exigindo o RH.
3. **Folha:** as tabelas da folha são do setor de RH; o financeiro só grava o que já grava hoje
   (`financeiro.folha.*`), e o setor financeiro conta como setor da folha para pagamento.
4. **O que conta como lotação:** só `lotacoes` ativa; a cessão de entrada conta se tiver unidade no órgão.
5. **A designação soma** ao setor de origem enquanto durar (não o substitui).
6. **Comissão vale só no seu objeto** (a campanha de inventário, o contrato, o processo); a coleta offline vale
   pela data do fato, dentro do período da comissão.
7. **Vínculo do login:** `profiles.servidor_id`.
8. Primeiro módulo a exigir: RH (onde já há autoria e trilha); depois patrimônio, compras, contratos,
   financeiro e os demais, com pelo menos um ciclo em modo registrar.

## Decisões que só o órgão toma

1. Quais unidades da estrutura são o setor de cada módulo (lista que o órgão informa).
2. Quem registra e aprova designações e comissões (RH? Gabinete?).
3. Confirmar ou trocar as premissas 1 a 8.

## Fase 1 (esta entrega)

Infraestrutura da regra e o RH em **modo registrar** (nada é bloqueado):

1. **Banco** (migração `20261011020000_lancamento_por_setor.sql`, idempotente nos dois estados):
   - `setores_modulo`, `comissoes`, `comissoes_membros` e `regra_lancamento(modulo, modo)` com RLS na mesma
     migração; modo inicial `registrar` para `rh` e `desligado` para os demais;
   - `designacoes` só vale como fundamento aprovada, vigente e com ato;
   - funções `data_local`, `lotacao_vigente`, `fundamento_lancamento` (cache por transação) e
     `meus_fundamentos_lancamento`;
   - checagem no trigger próprio `zz_exigir_setor` (`BEFORE INSERT OR UPDATE OR DELETE`, por linha) das tabelas do
     RH, mais `zz_exigir_setor_fim` (`AFTER`, por comando) que fecha a marca de cascata; roda em toda gravação,
     inclusive RPC. Em modo `registrar` só anota, em `exigir` recusa;
   - `audit_logs.fundamento jsonb` gravado pela trilha; `rh_exige_servidor_vinculado()` passa a ler a regra.
2. **Front:**
   - Administração: setores de cada módulo e modo da regra por módulo;
   - RH: cadastro de comissões e membros; designação mostra se vale como fundamento;
   - relatório "quem seria bloqueado" (linhas da trilha com fundamento negado) e saneamento (servidores ativos
     sem login vinculado, sem lotação ativa ou com lotação divergente);
   - aviso "somente consulta" para quem não tem fundamento no módulo, quando o modo for `exigir`.
3. **Fora da fase 1:** os outros módulos (autoria e trilha da E1 estendidas a eles), comissão como fundamento
   (por objeto), modo `exigir` e a Edge Function `enviar-convite-reuniao`.

### Ajustes das revisões de código e segurança (fase 1)

Aplicados na mesma migração (detalhes em [`docs/BANCO_DE_DADOS.md`](../../BANCO_DE_DADOS.md), seção "Lançamento por
setor (fase 1, banco)"):

1. **Autoconcessão não conta.** Lotação e cessão de entrada lançadas pelo próprio servidor (autoria E1
   `created_by_servidor_id`; nulo = legado, conta) não são fundamento. Designação só vale com `aprovado_por`
   preenchido, e o aprovador não pode ser o próprio designado nem quem lançou a designação. O saneamento aponta
   `fundamento_autoconcedido`. Em `comissoes_membros`, quem cadastrou a comissão não pode ser membro, e ninguém se
   inclui (exceto o papel admin). `rh.comissoes.gerenciar` fica só com o admin até o órgão decidir (decisão 2).
2. **Comissão vale só no objeto (premissa 6).** `objeto_tipo` e `objeto_id` são obrigatórios quando o tipo não é
   `outra`. Como nenhuma tabela do RH é objeto de comissão, na fase 1 a comissão é **só cadastro** e não é
   fundamento; a checagem por linha nas tabelas do objeto (campanha, contrato, processo) fica para a fase 2.
3. **Autoatendimento** só no INSERT do pedido ainda sem decisão (status pendente e colunas de aprovação nulas).
4. **Cascata:** só deixa de ser checada a gravação que descende de uma gravação já checada (marca na transação);
   cascata que começa fora da regra (ex.: `estrutura_organizacional` → `lotacoes`) é checada.
5. **Sem usuário:** `anonimo` só para o papel `anon`; `authenticated` sem `auth.uid()` é negado
   (`negado_sem_login`).
6. **Modo `exigir` só por migração:** trigger recusa levar um módulo a `exigir` com usuário na sessão;
   `regra_lancamento` não tem policy de DELETE. Sair de `exigir` continua com o admin.
7. `setores_modulo.inclui_subordinadas` nasce `false` (o admin liga quando quiser a subárvore).
8. **Data local:** a regra usa `data_local()` (variável `app.fuso_horario` do banco, por instância; padrão
   `America/Sao_Paulo`), não `CURRENT_DATE`.
9. **`audit_logs.org_unit_id` muda de significado:** passa a ser a unidade onde a pessoa trabalha (a do fundamento
   ou, sem ele, a da lotação vigente), também em `log_audit`, e não mais a unidade de acesso de `user_org_units`.
   Linhas antigas não mudam.
10. **Riscos aceitos:**
    - **Storage fora da regra:** arquivos em `storage.objects` (anexos, documentos assinados) não passam pela regra
      de setor; o controle continua nas policies de Storage existentes. Aceito na fase 1: o lançamento que importa
      é a linha da tabela, que é checada. Rever quando algum módulo for a `exigir`.
    - **Cascata de FK:** na exclusão em cascata (`ON DELETE CASCADE`) a trilha da linha filha sai sem `em_cascata`
      (o Postgres a enfileira para depois do comando); a checagem da linha filha continua correta.
