# Onda B do RH — entrega B2: férias, licenças, viagens e frequência por permissão, e autoatendimento

Spec da segunda entrega da **Onda B** (`docs/planejamento/FINALIZACAO.md`, item 8), na sequência da B1
([spec da folha](./2026-10-10-onda-b-folha-seguranca-design.md)). Levantamento pelo `arquiteto-idjuv` em
2026-10-10 sobre a branch da B1 (`supabase/baseline/`, `supabase/migrations/` e o front). Sessão autônoma:
as premissas valem até o usuário dizer o contrário; o que muda quem acessa o quê vai em card.

## Premissas (sessão autônoma)

1. **Dois estados do banco, como na B1.** A migração vale no banco montado pelo baseline (policies `rls_*`
   por módulo, overlays 10/12/18/20/40) e no banco montado só pelas migrações (policies `acesso_total_*`,
   overlays ausentes). Tudo é idempotente; no baseline a migração só aperta a escrita.
2. **Identidade antes de posse.** No estado só-migrações, `profiles`, `user_roles` e `user_modules` têm
   `acesso_total_*`: qualquer logado se dá o papel admin ou troca o próprio `profiles.servidor_id`
   (reproduzido em cópia local). Com isso `meu_servidor_id()` é forjável e abrir a leitura da própria
   linha em `servidores` exporia CPF e banco de qualquer servidor. A correção vai numa **PR separada e
   urgente (S0)**, a partir da `main`. A B2 depende dela: o merge segue a ordem S0 → B1 → B2, e a B2 traz o
   conteúdo da S0 por merge da branch para não depender da ordem.
3. **Escrita exige o módulo e a permissão que o catálogo já tem** (classe `permissao` da B1). Nenhum código
   novo de permissão. Quem já usa a tela legitimamente (admin e manager, que recebem os códigos pelo papel)
   não perde nada.
4. **O papel `user` perde a escrita em licenças e no lançamento de frequência** (card na thread; padrão
   "Só com permissão", o mesmo critério da B1). Hoje as duas telas não têm gate e o `user` grava.
5. **Ninguém decide sobre o próprio pedido.** Abono e fechamento de frequência: quem aprova ou valida não
   pode ser o dono da linha (`servidor_id IS DISTINCT FROM meu_servidor_id()`), e cada etapa exige a sua
   permissão (chefia `rh.aprovar`; RH `rh.frequencia.lancar`).
6. **Autoatendimento usa a mesma chave da RLS.** O front busca o servidor do usuário por
   `servidores.user_id`, coluna que ninguém grava; a RLS usa `profiles.servidor_id`
   (`meu_servidor_id()`). Os hooks passam a usar `user.servidorId` do `AuthContext`, que já vem de
   `profiles.servidor_id`. Não se cria sincronização de `servidores.user_id`.
7. **Telas de outras threads ficam intactas.** A thread de design system é dona do dashboard do RH, da
   lista de servidores, de `ServidorDetalhePage` e `ServidorFormPage`. O front de viagens e férias muda na
   PR #58: aqui só entra o banco, alinhado aos gates que a #58 já usa.
8. **Nada é aplicado em banco remoto.** O CI aplica no merge.

## O que muda

### 1. Gerador de RLS: extensões da classe `permissao`

`scripts/db/gerar-rls.mjs` ganha, sem mudar a saída das tabelas existentes:

- `escrita=a|b|c`: lista de códigos, qualquer um basta (OR de `has_permission_code`), sempre junto do
  módulo.
- `;excluir=<código>|admin`: DELETE com outro código, ou só o papel admin.
- `;insere_proprio`: o próprio servidor também insere a linha (pedido), como a classe `proprio`.
- `;sem_autoaprovacao`: UPDATE e DELETE por quem tem a permissão exigem que a linha não seja sua.
- `;coluna=<col>`: coluna de posse quando não é `servidor_id` (em `servidores` é `id`).
- Classe `proprio_leitura` aceita `coluna=<col>` e `excluir=<código>` para `servidores`.

`scripts/db/testar-rls.sql` cobre cada extensão: persona por código da lista, "não decide sobre o próprio",
inserção própria com campos forçados, DELETE por outro código.

### 2. Tabelas (mapa.csv → SQL gerado → bloco da migração)

| Tabela | Classe | Extra | Efeito |
|---|---|---|---|
| `ferias_servidor` | permissao | `escrita=rh.ferias.criar\|rh.ferias.editar\|rh.ferias.gerenciar;proprio;excluir=admin` | Espelha `GestaoFeriasPage`; o servidor só lê as suas |
| `licencas_afastamentos` | permissao | `escrita=rh.licencas.criar\|rh.licencas.editar\|rh.licencas.gerenciar;proprio;excluir=rh.licencas.gerenciar` | Fecha a escrita sem gate |
| `viagens_diarias` (rh\|financeiro) | permissao | `escrita=rh.viagens.criar\|rh.viagens.editar\|rh.viagens.gerenciar\|financeiro.diarias.gerenciar;proprio;excluir=admin` | Espelha os gates da #58; o financeiro segue no fluxo DIRAF |
| `registros_ponto`, `frequencia_mensal` | permissao | `escrita=rh.frequencia.lancar\|rh.frequencia.criar\|rh.frequencia.editar;proprio` | Lançamento só pelo RH; o servidor lê |
| `solicitacoes_abono` | permissao | `escrita=rh.aprovar\|rh.frequencia.lancar;proprio;insere_proprio;sem_autoaprovacao` | O servidor pede; chefia e RH decidem; ninguém aprova o próprio |
| `frequencia_fechamento` | permissao | `escrita=rh.aprovar\|rh.frequencia.lancar;proprio;sem_autoaprovacao` | Validar e consolidar por papel |
| `config_fechamento_frequencia` | permissao | `escrita=rh.frequencia.configurar` | Mesma permissão da rota de configuração |
| `solicitacoes_ajuste_ponto` | permissao | `escrita=rh.aprovar\|rh.frequencia.lancar;proprio;insere_proprio;sem_autoaprovacao` | Mesmo modelo do abono |
| `justificativas_ponto` | permissao | `escrita=rh.aprovar\|rh.frequencia.lancar;pai=registros_ponto.registro_ponto_id;insere_proprio;sem_autoaprovacao` | Posse pela tabela pai |
| `banco_horas` | permissao | `escrita=rh.frequencia.lancar;proprio` e `remover_policies` com as `rh_module_*` | As sobras `rh_module_*` anulariam a regra por OR |
| `lancamentos_banco_horas` | permissao | `escrita=rh.frequencia.lancar;pai=banco_horas.banco_horas_id` | Fecha a escrita por módulo |
| `servidores` | proprio_leitura | `coluna=id;excluir=rh.servidores.excluir` | O servidor lê a própria linha; escrita segue por módulo (telas da thread de design); DELETE só com o código |
| `vinculos_servidor`, `lotacoes` | proprio_leitura | — | Meus Dados lê os próprios vínculos e lotações |
| `cargos` | catalogo | — | Nome do cargo no autoatendimento; sem dado pessoal |

Toda tabela da lista: `acesso_total_*` removidas, `anon` sem privilégio, `authenticated` sem
TRUNCATE/TRIGGER/REFERENCES (como na B1).

### 3. Etapas do abono e do fechamento (trigger)

Trigger BEFORE UPDATE em `solicitacoes_abono` e `frequencia_fechamento`, SECURITY DEFINER com
`search_path` fixo e sem EXECUTE para `authenticated`:

- mudar `aprovado_chefia*`/`validado_chefia*` exige `rh.aprovar`;
- mudar `status` para aprovado/rejeitado na etapa do RH, `aprovado_rh*`, `consolidado_rh*`, `reaberto*` exige
  `rh.frequencia.lancar`;
- o papel admin passa; erro `42501` com mensagem que diz a etapa.

### 4. Campos iniciais isentos por permissão (overlay 20)

`forcar_campos_iniciais` hoje isenta quem tem o **módulo**: depois da B2, quem tem o módulo sem a permissão
inseriria o próprio abono já aprovado. A função passa a aceitar no primeiro argumento uma lista de
permissões (`perm:rh.aprovar|rh.frequencia.lancar`), mantendo o formato de módulo para as tabelas de outros
domínios. A migração porta a função e os triggers das tabelas de RH (no estado só-migrações eles não
existem); o overlay 20 recebe a mesma mudança.

### 5. Front

- **Gates** nas ações de escrita que hoje não têm: `GestaoLicencasPage` (criar, editar, excluir; o DELETE
  passa a usar `.select()` para não mostrar "sucesso" com 0 linhas) e `GestaoFrequenciaPage`/
  `LancarFaltaDialog` (lançar ocorrência ou falta).
- **Autoatendimento**: `useMeuServidor`, `useContracheque` e `useServidorLogado` buscam por
  `user.servidorId`; usuário sem vínculo vê a mensagem "não vinculado" como hoje.
- **Atalhos** para Meus Dados, Minha Frequência e Meu Contracheque em `/meu-perfil`, porque a seção RH do
  menu some para quem não tem o módulo. O menu do RH não muda.
- **Menu**: `/rh/frequencia/configuracao` passa a pedir `rh.frequencia.configurar`, como a rota.
- `MODULE_PERMISSIONS.rh` ganha os códigos que já existem no catálogo e faltam no front.

## Verificação

- `node scripts/db/gerar-rls.mjs --check`; diff do SQL só nas tabelas da lista.
- Migração duas vezes sem erro em cópia do baseline e em cópia do só-migrações.
- `testar-rls.sh` com 0 falhas no baseline regenerado; o teste novo reprova no estado anterior.
- `validar-migracoes.sh` com 0 falhas; `validar-baseline.sh` com `PG_REPLAY` e `EXIGIR_REPLAY=1` aprovado.
- `bash scripts/gate.sh` verde; telas de licenças, frequência e autoatendimento abertas no navegador.

## Fora de escopo

- Chefia sem o módulo RH validando a própria equipe (exige view ou RPC sem CPF); restringir `rh.aprovar` à
  equipe (hoje é só filtro na tela e restringir tiraria acesso).
- Pedido de férias ou de viagem pelo servidor (não há status nem tela de pedido).
- Subunidades na chefia (`superior_id`), assinatura do servidor na frequência (sem tela).
- Storage de frequências e documentos e a Edge Function `download-frequencia` (B3).
- `pensoes_alimenticias`, `historico_funcional`, `portarias_servidor`, `designacoes`, `provimentos`,
  `cessoes`: seguem por módulo.
- Mascaramento de CID em licenças e de CPF/banco na auditoria.

## Riscos e implantação

- **Quem perde escrita**: o papel `user` em licenças e no lançamento de frequência; quem tem o módulo sem
  a permissão em férias, viagens, abono e fechamento. Antes do merge, o administrador pode dimensionar com a
  consulta da seção de docs (`audit_logs` por tabela e usuário).
- **Viagens e a PR #58**: sem a #58, a tela de viagens não tem gate e o `user` vê o botão e recebe erro de
  permissão. A #58 resolve.
- **Conflito de docs** com as PRs abertas do RH: a B2 acrescenta subseção nova depois da da folha.
