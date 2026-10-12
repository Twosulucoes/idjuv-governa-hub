# RH: quadro de vagas com código único e histórico (2026-10-12)

**Classificação:** architectural (tabela nova, mudança na regra de nomeação). **Pedido:** Fabiano, no projeto
"Sistema IDJUV": inserir os cargos que o instituto tem hoje (ex.: 98), tudo pelo banco; cada vaga ocupada por uma
pessoa por vez, sem sobreposição e nunca acima do número de vagas; histórico de cada vaga e da estrutura inteira.

## Premissas (sessão sem aprovação síncrona; registradas também na PR)

1. **A ocupação é o provimento.** `provimentos` já guarda nomeação e encerramento e é a tabela que a folha lê. Em vez
   de uma segunda tabela de ocupação, o provimento ganha `vaga_id`; o histórico da vaga é a lista dos seus provimentos.
2. **Período `[data_nomeacao, data_encerramento)`.** O dia da saída já pode ser o dia da entrada do sucessor
   ("exonerar fulano e nomear beltrano" no mesmo ato).
3. **Sem extensão nova.** A trava é um trigger com `FOR UPDATE` na vaga (serializa nomeações simultâneas) mais um
   índice único parcial (um ocupante em aberto por vaga). `btree_gist`/`EXCLUDE` ficou de fora para não exigir
   extensão no Supabase self-hosted nem no baseline.
4. **Transição gradual.** Cargo sem vaga cadastrada segue a regra antiga (contagem por `cargos.quantidade_vagas`).
   Ao cadastrar vagas de um cargo, a vaga passa a mandar e a importação atualiza `quantidade_vagas`.
5. **Importação nunca apaga nem sobrescreve.** Cargo existente (mesmo nome e símbolo) é reaproveitado sem alteração;
   código existente é pulado; por quantidade, só cria as vagas que faltam. Reduzir vagas é extinção por ato, na vaga.
6. **Permissão:** importar e editar vagas exige `governanca.cargos.gerenciar` (a mesma de cargos); ver o quadro,
   `governanca.cargos.visualizar`. O nome do ocupante segue a RLS de `provimentos`/`servidores` (RH).

## Desenho

| Peça | O quê |
|---|---|
| `vagas_cargo` | código único (maiúsculo), cargo, unidade opcional, data/ato de criação e de extinção. RLS `catalogo` (rh, governanca). Autoria, trilha e regra de setor como todo o RH |
| `provimentos.vaga_id` | FK `RESTRICT`; `trg_provimento_vaga` escolhe vaga livre (mesma unidade primeiro), trava a vaga, recusa sobreposição, vaga de outro cargo e ocupação além da extinção; encerrado sem data recebe hoje |
| `trg_vagas_cargo_validar` | normaliza o código; vaga com histórico não muda de cargo/código nem é apagada; não extingue com ocupante depois da data |
| `v_quadro_vagas` | situação (livre, ocupada, extinta) via `rh_vaga_situacao` (DEFINER, sem dado pessoal) e ocupante (RLS) |
| `v_vagas_historico` | vaga criada/extinta, entrada e saída de cada ocupante |
| `rh_importar_quadro_vagas(linhas, gravar)` | INVOKER; simula, depois grava tudo ou nada; liga os ocupantes atuais às vagas e avisa o excesso |
| `/cargos/vagas` | `QuadroVagasPage`: abas Vagas e Histórico, histórico por vaga, importação com modelo XLSX |

## Fora desta entrega

- Escolher a vaga na tela de nomeação (hoje o banco escolhe sozinho a primeira livre do cargo, preferindo a unidade).
- Tela para criar/extinguir uma vaga avulsa (a tabela aceita pela API com a permissão; a tela só importa).
- Ligar provimentos já encerrados às vagas (o histórico por vaga começa nos ocupantes atuais).
- `composicao_cargos` (previsão por unidade) continua como está; a vaga tem unidade própria.

## Verificação

Postgres 16 local: replay de todas as migrações (`validar-migracoes.sh`), cenário de teste (simulação, gravação,
reimportação sem duplicar, linha com erro desfaz tudo, terceira nomeação recusada, saída e entrada no mesmo dia,
sobreposição recusada, extinção de vaga ocupada recusada, trilha gravada), `validar-baseline.sh` com `PG_REPLAY`
aprovado e `scripts/gate.sh` verde.
