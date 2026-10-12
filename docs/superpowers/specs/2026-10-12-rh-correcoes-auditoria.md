# RH — correções da auditoria dos fluxos (12/10/2026)

Origem: auditoria do ciclo de vida do servidor (cadastro → arquivamento). Migration:
`supabase/migrations/20261012100000_rh_correcoes_auditoria.sql`. Sem mudança de RLS nem de tabelas.

## O que muda

| Área | Antes | Agora |
|---|---|---|
| Admissão (cadastro manual, conversão de pré-cadastro, lotar servidor) | Cada porta gravava um subconjunto de vínculo/lotação/provimento/histórico/portaria; erros engolidos | `rh_admitir_servidor`: tudo numa transação (SECURITY INVOKER, exige `rh.servidores.criar` ou `rh.lotacoes.criar`) |
| Desligamento (tela de lotação e painel de vínculos) | Dois caminhos incompletos; ato/DOE descartados; sem `data_desligamento`; situação `inativo` | `rh_desligar_servidor`: encerra lotação, vínculos, provimento, cessões, designações, férias, licenças, viagens, chefia e comissões; histórico; minuta; situação `exonerado`/`aposentado`/`falecido`; falha por permissão parcial desfaz tudo (exige `rh.servidores.editar`) |
| Situação do servidor | Dois conjuntos de triggers em férias/licenças; o antigo devolvia `ativo` a exonerado | Triggers duplicados removidos; `fn_atualizar_situacao_servidor` preserva desligados, reconhece `prorrogada` e vínculo sem provimento e mantém `ativo` coerente |
| Cessão de saída/retorno | Lia `vinculos_funcionais` (legada, vazia): não suspendia o provimento | Lê `vinculos_servidor` |
| Ponto em competência consolidada | Bloqueio só no navegador | Trigger em `registros_ponto` (API); rotinas de sistema seguem livres |
| Matrícula / código interno / nº de portaria | Matrícula por ordenação textual no cliente; MAX+1 sem trava | Trigger com trava e ordenação numérica; índice único do nº de portaria |
| Status por data (férias, licenças, viagens) | Só à mão (não há `pg_cron`) | `rh_avancar_status_por_data()` — **precisa ser agendada fora do banco** (cron do host como `postgres`) |
| Senha temporária | `Math.random` | `crypto.getRandomValues` |

## Verificação

43 verificações SQL num banco descartável com o esquema de produção (admissão de efetivo/cedido/temporário,
férias e licença, desligamento completo, reingresso, cessão de saída e retorno, trava de ponto, nº de portaria,
rotina por data, permissões, permissão parcial); migration idempotente (aplicada duas vezes); `scripts/gate.sh` verde.

## Fora do escopo (decisões pendentes)

Folha que considere frequência/férias/rubricas; medida disciplinar; granularidade de RLS em `lotacoes`, `provimentos`,
`historico_funcional`, `designacoes`, `cessoes`; sequência obrigatória do ciclo da portaria; formulário público de
pré-cadastro (anônimo sem acesso hoje; código de acesso sequencial); prestação de contas de diárias.
