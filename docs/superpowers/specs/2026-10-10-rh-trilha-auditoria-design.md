# Onda E1 do RH — servidor responsável em todo lançamento e trilha imutável

Primeira onda do plano de [REVISAO_RH.md](../../planejamento/REVISAO_RH.md) (seção 6). Pedido do dono do
produto: "todo mundo que fizer um lançamento tenha sempre o responsável, o servidor responsável pelo
lançamento; extremamente auditado". Esta onda é só de banco; a consulta na tela e o registro de PDF,
planilha, XML e CNAB ficam na E2.

## Premissas (valem até o dono dizer o contrário)

1. **Usuário sem servidor vinculado pode lançar**, e a trilha marca "sem servidor vinculado" (decisão 1 da
   revisão; card em aberto na thread). A regra fica numa função `rh_exige_servidor_vinculado()` que hoje
   devolve `false`; bloquear vira uma migração de uma linha.
2. **Quem lê a trilha do RH:** o papel admin (como hoje) e quem tem a permissão nova
   `rh.auditoria.visualizar` (decisão 2). A policy nova em `audit_logs` só entra com o "sim" do dono no
   merge, por mexer em RLS existente.
3. **Máscara LGPD:** CPF e PIS ficam parciais (`***.456.789-**`); RG, conta, agência, endereço, telefones,
   e-mail pessoal, data de nascimento e CID viram `"[protegido]"`. O nome da coluna continua na lista de
   campos alterados, então dá para saber que mudou, sem guardar o valor.
4. **Retenção:** guardar tudo; nenhum expurgo nesta onda (decisão 11).
5. **Dois estados do banco**, como em B1–B3: a migração vale no baseline e no replay, é idempotente e o
   baseline é regenerado.
6. Nada é aplicado em banco remoto; o CI aplica no merge.

## Escopo: as 79 tabelas do RH

As tabelas com `rh` em `modulos` no `supabase/baseline/rls/mapa.csv`. As duas de classe `trilha`
(`folha_historico_status`, `rubricas_historico`) recebem só a imutabilidade, não autoria nem trilha.

## O que muda

1. **Quem é o responsável.** Função `responsavel_atual()` (`STABLE SECURITY DEFINER`, `search_path` fixo):
   devolve `auth.uid()`, o `profiles.servidor_id` desse usuário naquele momento (sem exigir perfil ativo:
   é retrato, não permissão), nome e matrícula do servidor, e a origem: `usuario`, `usuario_sem_vinculo`
   ou `sistema` (sem `auth.uid()`, ou seja service role, Edge Function, job).
2. **Autoria gravada pelo banco** em toda tabela de lançamento:
   - colunas padrão, criadas onde faltam: `created_at`, `created_by`, `created_by_servidor_id`,
     `updated_at`, `updated_by`, `updated_by_servidor_id` (as de servidor são retrato, sem FK, para não
     sumirem quando o vínculo muda; as colunas `*_by` que já existem mantêm o tipo e a FK atuais);
   - trigger genérico `fixar_autoria()` `BEFORE INSERT OR UPDATE`: no INSERT grava `created_*` e
     `updated_*`; no UPDATE devolve os `created_*` antigos (ninguém troca, nem admin) e grava `updated_*`;
     com sessão `authenticated` o valor mandado pelo navegador é sempre ignorado; só a origem `sistema`
     pode informar o autor (Edge Functions agindo em nome de alguém);
   - colunas de decisão passadas como argumento do trigger (por exemplo `gerado_por`, `enviado_por`,
     `processado_por`, `aprovado_por`, `aprovador_id`, `fechado_por`, `consolidado_por`, `emitido_por`,
     `convertido_por`): quando o valor muda, o banco grava `auth.uid()` e a data, sem `COALESCE` com o que
     veio do cliente e sem isenção para admin. Inclui corrigir `registrar_transicao_folha` (hoje
     `COALESCE(NEW.x, auth.uid())`) e gravar `processado_por` em `processar_folha_pagamento`;
   - nas quatro tabelas de etapa da frequência (B2), a autoria das etapas continua no
     `validar_etapa_frequencia`, mas deixa de valer o atalho do admin para a autoria (o atalho para a regra
     de etapa continua).
3. **Trilha (`fn_audit_trigger` v2)**, mesma assinatura `fn_audit_trigger('<modulo>')`, compatível com as 15
   tabelas atuais:
   - colunas novas em `audit_logs`: `servidor_id`, `servidor_nome`, `servidor_matricula`,
     `campos_alterados text[]`, `origem`, `transacao bigint` (`txid_current()`);
   - preenche também `role_at_time`, `ip_address` e `user_agent`, tirados de
     `current_setting('request.headers', true)` (`x-forwarded-for`, primeiro item, ou `x-real-ip`;
     `user-agent`), tolerando cabeçalho ausente ou inválido;
   - UPDATE que não muda nada não gera linha;
   - máscara pela tabela-catálogo `audit_colunas_sensiveis(tabela, coluna, tratamento)` (`parcial` ou
     `omitir`), classe `catalogo_admin` no `mapa.csv`, carregada pela migração;
   - aplicada a todas as tabelas do escopo e também a `profiles` (vínculo `servidor_id` e `is_active`),
     `user_permissions` e `user_org_units`, com módulo `admin`.
4. **Trilha imutável:**
   - trigger `BEFORE UPDATE OR DELETE` em `audit_logs` que sempre recusa (inclusive `postgres` e service
     role), salvo uma rotina futura de expurgo que liga um GUC de sessão; o mesmo para
     `folha_historico_status` e `rubricas_historico`;
   - trigger de comando `BEFORE TRUNCATE` que recusa nessas tabelas;
   - `REVOKE TRUNCATE` de `anon` e `authenticated` em todas as tabelas do escopo (no baseline já é geral).
5. **Registro de ações sem gravação:** RPC `registrar_evento(acao, entidade, entidade_id, descricao,
   metadados)` com lista fechada de ação (`view`, `export`, `download`; imprimir conta como `download`) e de entidade,
   usuário, servidor, origem, IP e user agent preenchidos pelo banco; `EXECUTE` só para `authenticated`.
   A E2 liga o front a ela.
6. **Leitura da trilha do RH:** permissão `rh.auditoria.visualizar` no catálogo e policy de SELECT em
   `audit_logs` para `module_name = 'rh'` com `has_permission_code`, além do admin.
7. **Guard no gate:** script que reprova tabela com `rh` no `mapa.csv` sem `fixar_autoria` e sem
   `fn_audit_trigger` no schema do baseline, salvo exceção listada com motivo.
8. **Testes** em `scripts/db/testar-rls.sql` (ou arquivo irmão chamado pelo `validar-baseline.sh`):
   autor forjado pelo navegador é sobrescrito (inclusive admin); `created_by` não muda no UPDATE; origem
   `usuario_sem_vinculo` marcada; CPF mascarado na trilha de `servidores`; UPDATE/DELETE/TRUNCATE em
   `audit_logs` recusados como `postgres` e service role; `registrar_evento` recusa ação fora da lista;
   prova de vida no estado anterior.

## Fora desta onda

- Tela da trilha, aba de histórico na ficha e na folha, chamadas a `registrar_evento` (E2).
- Login e falha de login (E2; depende de conferir o log do GoTrue na VPS).
- Particionar `audit_logs` e retenção.
- Encadeamento por hash da trilha.
- `delete-user` passar a desativar em vez de excluir (as FKs de autoria para `auth.users` já impedem
  excluir quem lançou; fica registrado como risco).
