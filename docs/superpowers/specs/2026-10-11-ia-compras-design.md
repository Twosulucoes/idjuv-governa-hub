# IA para instrução de processos de compras: proposta de desenho

**Status:** aprovada em 2026-10-11; fase 1 em implementação (plano em `docs/superpowers/plans/2026-10-11-ia-compras-fase1.md`). **Versão 2**, com os ajustes do Fabiano
de 2026-10-11 (SEI como processo oficial, checagem no QDD, editor de texto e biblioteca de arquivos do
cliente).
**Data:** 2026-10-11 · **Pedido de:** Fabiano · **Classificação:** architectural.

## 1. O que o pedido quer

Hoje a IA existe só na tela CPSI (`/formularios/cpsi`): preenche e revisa DFD, ETP e TR com o
Gemini, usando uma chave fixa no servidor (`GEMINI_API_KEY`). O texto gerado não fica salvo no sistema
(só vira PDF) e a IA não sabe nada do Instituto além do que a pessoa digita.

O pedido é um **assistente de instrução de processos de compras** que:

1. **ajuda a instruir, não substitui o SEI.** O processo oficial é sempre o do SEI. O sistema prepara os
   textos alinhados ao processo SEI, e a pessoa leva o texto final para lá;
2. **confere o orçamento no QDD**, dizendo se há dotação e saldo para a despesa;
3. **sugere o texto, deixa ajustar num editor e salva** a versão final como base para copiar no SEI;
4. **busca numa biblioteca que o próprio cliente monta**: modelos de DFD, ETP e TR, estruturas básicas,
   decretos, instruções normativas e a Lei 14.133. Um agente consulta essa biblioteca para instruir da
   forma mais profissional possível;
5. tem foco na fase de planejamento (a EPC, entendida aqui como a *Equipe de Planejamento da
   Contratação* da Lei 14.133);
6. é **opcional por cliente**: cada instituição liga ou não, e usa a **própria chave de API**, de vários
   fornecedores, incluindo os genéricos "compatíveis com OpenAI" (OpenRouter, Groq, DeepSeek, Together,
   um Ollama próprio etc.).

## 2. O que já existe e será aproveitado

| Já existe | Uso na proposta |
|---|---|
| QDD importado do FIPLAN para `fin_dotacoes` (`importar_qdd_fiplan`), com `saldo_disponivel`, reservas e bloqueios | Checagem de orçamento da instrução |
| Campo `processo_sei` / `numero_processo_sei` em várias tabelas (financeiro, contratos etc.) | Mesmo padrão para vincular a instrução ao processo SEI |
| `processos_licitatorios` com `fase_atual` (planejamento → contratação) | Fases e checklist de cada etapa |
| `itens_processo_licitatorio`, `propostas_licitacao`, `itens_contrato`, `atas_registro_preco` | Histórico de itens e preços do próprio Instituto (fase 4) |
| Vault do Supabase, já usado para credenciais de e-mail/WhatsApp (`config_envio`) | Mesmo padrão para a chave de API da instituição |
| `consumir_cota_uso` (Onda 2) e `audit_logs` | Limite de uso por pessoa e auditoria |
| `TenantFeatures` no perfil do tenant e `module_settings` no banco | Liga/desliga da IA por instituição |

**Lacunas encontradas:** não existe tabela de DFD nem de PCA, e não há tela de cadastro de processo
licitatório (só o painel de contagem). A proposta não depende delas: a instrução fica amarrada ao número
do processo SEI, que é o que vale.

## 3. Desenho em quatro fases

Cada fase é entregável sozinha. A fase 1 é pré-requisito das demais; as fases 2 e 3 são o núcleo do
pedido.

### Fase 1: Base de IA da instituição (provedor, chave, limites)

- **Configuração por instituição** em uma tabela `ia_config` (uma linha), editável só por quem tem a
  permissão nova `ia.configurar`:
  - ligada/desligada (desligada por padrão);
  - provedor: `openai`, `anthropic`, `gemini` ou `compativel_openai` (com URL base);
  - modelo de texto e, à parte, provedor/modelo de *embeddings* (opcional; ver fase 2);
  - limites: chamadas por pessoa por hora e teto mensal de tokens da instituição;
  - política de dados: "pode enviar dados pessoais ao provedor?" (padrão **não**).
- **A chave fica no Vault**, gravada por uma RPC (mesmo padrão de `salvar_segredo_envio`). A tela mostra
  só "chave cadastrada em dd/mm, final ••••1234"; a chave nunca volta para o navegador.
- **Uma Edge Function única, `ia-gateway`**, substitui a `cpsi-ai-assistant`:
  - confere sessão, módulo e permissão `ia.usar`, cota e teto mensal;
  - lê config + chave pelo servidor (função só para `service_role`);
  - fala com cada provedor por adaptadores pequenos (OpenAI e compatíveis usam o mesmo; Anthropic e
    Gemini têm o seu), com streaming e chamada de ferramentas;
  - registra em auditoria quem chamou, provedor, modelo e tokens, **sem o conteúdo**.
- **URL base de provedor genérico:** só `https`, sem IP privado/local, para a função não ser usada para
  acessar a rede interna. Exceção (modelo rodando na própria VPS) exige marcação explícita do admin.
- Com a IA desligada, os botões de IA somem e o gateway responde "IA não habilitada nesta instituição".

### Fase 2: Biblioteca de referência e agente de consulta

- **O cliente sobe os arquivos** (PDF, DOCX, TXT) numa biblioteca da instituição, com categoria:
  modelo de DFD, modelo de ETP, modelo de TR, estrutura/roteiro, lei, decreto, instrução normativa,
  orientação interna. Pode marcar a vigência (ex.: decreto revogado deixa de ser usado).
- O sistema **extrai o texto, divide em trechos e indexa** com busca de texto do Postgres em português
  (funciona sem custo e sem embeddings). Se a instituição configurar um provedor de embeddings, soma a
  busca por significado com `pgvector`.
- **Agente de consulta:** ao rascunhar ou revisar, o modelo tem ferramentas para:
  - buscar na biblioteca (ex.: "art. 18 da Lei 14.133", "modelo de ETP para serviço contínuo");
  - ler o modelo de documento escolhido pela instituição;
  - consultar o saldo da dotação no QDD (fase 3);
  - ler os textos já salvos daquela instrução (o ETP lê o DFD, o TR lê o ETP).
  Se o provedor configurado não suportar ferramentas, o sistema faz a busca antes e entrega os trechos
  prontos ao modelo.
- **As respostas citam a fonte** (arquivo e trecho), para a pessoa conferir antes de usar.
- **Segurança da biblioteca:**
  - arquivos em bucket privado, só para quem tem o módulo `compras`; upload só por `ia.configurar` ou
    por uma permissão de curadoria (`ia.biblioteca`);
  - o texto dos arquivos é passado ao modelo como material de consulta, nunca como instrução, para que
    um documento com "ignore as regras anteriores" não mude o comportamento;
  - limite de tamanho e de tipos de arquivo; nada de dado pessoal na biblioteca (aviso no upload e
    mascaramento de CPF na indexação).
- Pacote inicial opcional: a Lei 14.133 e um roteiro básico de DFD/ETP/TR, para o cliente já começar com
  algo útil e completar com os seus.

### Fase 3: Instrução alinhada ao SEI, com QDD e editor

- **Instrução = um processo SEI.** A pessoa abre uma instrução informando o número do processo SEI, o
  objeto e a unidade demandante. Tudo o que for produzido fica ligado a esse número.
- **Documentos da instrução:** DFD, ETP, mapa de riscos, pesquisa de preços, TR e outros da trilha da
  Lei 14.133. Para cada um:
  1. a IA **sugere o texto** a partir do modelo da biblioteca, dos documentos anteriores e dos dados
     informados;
  2. a pessoa **ajusta num editor de texto** (negrito, listas, tabelas simples), podendo pedir à IA para
     reescrever só um trecho selecionado;
  3. a pessoa **salva a versão**; o sistema guarda o histórico de versões e marca o que veio da IA;
  4. botões **"Copiar para o SEI"** (texto formatado, pronto para colar no editor do SEI) e
     **"Baixar DOCX/PDF"**.
- **Checagem de orçamento no QDD:** a pessoa escolhe a dotação (ou a IA sugere pela natureza da
  despesa) e o sistema mostra dotação, saldo disponível, reservas e bloqueio. Avisos claros:
  "valor estimado maior que o saldo", "dotação bloqueada", "QDD do exercício não importado". A consulta
  usa uma RPC que devolve só o saldo da dotação para quem tem o módulo `compras`, sem abrir o resto do
  financeiro.
- **Instruir a partir do SEI:** como o SEI não tem integração aberta, a pessoa pode **anexar documentos
  exportados do SEI** (PDF do processo, despachos, pareceres). Eles entram como contexto daquela
  instrução (não vão para a biblioteca geral) e a IA os usa para manter coerência com o que já está
  no processo oficial.
- **Checklist por fase:** antes de cada etapa, a IA mostra o que falta (documentos, assinaturas,
  orçamento) citando o artigo da lei ou da norma da biblioteca.
- A IA **só sugere**; salvar e aprovar é ato da pessoa, e a assinatura acontece no SEI.

### Fase 4: Aprendizado com o uso e dados do Instituto

- Sem treinar modelo (caro, e prende a um fornecedor). O "aprendizado" é:
  - documentos finalizados podem ser **promovidos a modelo** da biblioteca por quem faz a curadoria;
  - histórico de itens e preços do próprio Instituto como referência na pesquisa de preços;
  - nota rápida em cada sugestão (útil / não útil / editado) para medir qualidade por tipo de documento;
  - orientações próprias da instituição (ex.: "sempre citar o PPA no DFD") editáveis pela equipe.

## 4. Segurança e permissões

- Permissões novas: `ia.usar` (usar o assistente, além do módulo `compras`), `ia.biblioteca` (curadoria
  da biblioteca) e `ia.configurar` (administração). Exigidas na rota **e** no gateway/RPC.
- Todas as tabelas novas nascem com RLS na mesma migração. A busca na biblioteca e nos documentos roda
  com a sessão da pessoa, não com acesso total.
- Chave só no Vault, lida só pelo servidor; nunca em `src/`, `.env` do front, logs ou auditoria.
- Auditoria registra uso e custo, nunca o conteúdo enviado ao provedor.
- Dados pessoais mascarados antes de ir ao provedor, salvo se a instituição liberar.
- Nada de nome de cliente no código: modelos e orientações ficam no banco, na biblioteca de cada cliente.
- Regra definida pelo Fabiano em 2026-10-11 (vale para todo o sistema): lançamento só por login vinculado a
  servidor do setor, ou designado formalmente para ele; login sem vínculo é só leitura. Aqui isso significa
  que salvar ou aprovar texto de instrução exige servidor de compras (ou designado), e o histórico
  registra quem salvou. O modelo geral (vínculo ao setor e designação) é desenhado pela thread
  "Estrutura de prompts e ambiente dev"; esta feature só consome a regra que sair de lá.

## 5. Fora de escopo nesta proposta

- Integração direta com a API do SEI (criar documento ou tramitar lá). O texto vai para o SEI por
  copiar/colar ou arquivo; a integração pode ser estudada depois, se o órgão liberar acesso.
- Treinamento/ajuste fino de modelos.
- IA em outros setores além de compras (o gateway da fase 1 já deixa isso pronto para depois).
- Assinatura eletrônica no sistema (a assinatura é no SEI).

## 6. Ordem sugerida e tamanho

| Fase | Entrega | Tamanho |
|---|---|---|
| 1 | Configuração, chave no Vault, gateway multi-provedor, CPSI migrada | médio (1 PR) |
| 2 | Biblioteca de arquivos do cliente + agente de consulta | médio/grande (2 PRs) |
| 3 | Instrução por processo SEI: editor, versões, QDD, anexos do SEI | grande (2–3 PRs) |
| 4 | Modelos promovidos, preços históricos e retorno de qualidade | pequeno (1 PR) |

Depois da aprovação deste desenho, escrevo o plano detalhado da fase 1 para nova aprovação antes de
qualquer código.

## 7. Premissas a confirmar

1. EPC = Equipe de Planejamento da Contratação (fase preparatória da Lei 14.133).
2. A IA fica desligada por padrão em toda instituição nova.
3. Dados pessoais não vão ao provedor de IA por padrão.
4. Não há integração com a API do SEI; a ligação é pelo número do processo e por documentos anexados.
