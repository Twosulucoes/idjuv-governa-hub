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
  RH não há autoria nem trilha genérica.

## Desenho proposto

### Regra

Uma gravação (inserir, alterar, excluir) numa tabela do módulo M é aceita quando o login tem servidor
vinculado e há um **fundamento** vigente na data:

| Fundamento | Quando vale |
|---|---|
| `lotacao` | lotação ativa do servidor numa unidade que é setor de M |
| `designacao` | designação aprovada e vigente para uma unidade que é setor de M, com ato |
| `comissao` | o servidor é membro de comissão vigente de M (com ato), no objeto dela |
| `autoatendimento` | o servidor grava o que é dele (pedir férias, frequência, abono, requerimento) |
| `chefia` | o chefe da unidade decide etapa do subordinado (frequência, férias, licença) |
| `sistema` / `anonimo` | jobs, Edge Functions e formulários públicos, que têm regra própria |

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
   - funções `lotacao_vigente`, `fundamento_lancamento` (cache por transação) e `meus_fundamentos_lancamento`;
   - checagem no trigger `zz_fixar_autoria` das tabelas do RH (já roda em toda gravação, inclusive RPC) e
     `BEFORE DELETE` onde faltar; em modo `registrar` só anota, em `exigir` recusa;
   - `audit_logs.fundamento jsonb` gravado pela trilha; `rh_exige_servidor_vinculado()` passa a ler a regra.
2. **Front:**
   - Administração: setores de cada módulo e modo da regra por módulo;
   - RH: cadastro de comissões e membros; designação mostra se vale como fundamento;
   - relatório "quem seria bloqueado" (linhas da trilha com fundamento negado) e saneamento (servidores ativos
     sem login vinculado, sem lotação ativa ou com lotação divergente);
   - aviso "somente consulta" para quem não tem fundamento no módulo, quando o modo for `exigir`.
3. **Fora da fase 1:** os outros módulos (autoria e trilha da E1 estendidas a eles), modo `exigir` e a
   Edge Function `enviar-convite-reuniao`.
