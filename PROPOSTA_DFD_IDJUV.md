# Guia de Preenchimento do DFD

## Documento de Formalização da Demanda — Contratação da Plataforma Governa Hub

| | |
|---|---|
| **Órgão demandante** | IDJUV — Instituto de Desporto, Juventude e Lazer do Estado de Roraima |
| **Natureza jurídica** | Autarquia Estadual (Lei nº 2.301, de 29/12/2025; Decreto nº 39.840-E, de 23/01/2026) |
| **Objeto resumido** | Licenciamento de uso, implantação e sustentação continuada de plataforma web de gestão administrativa e governança pública |
| **Fundamento legal** | Lei nº 14.133/2021, art. 6º, XX e XXIII; art. 12, VII; art. 18; art. 23; art. 40 · IN SGD/ME nº 94/2022 (subsidiária) · LGPD (Lei nº 13.709/2018) · LAI (Lei nº 12.527/2011) |
| **Etapa do processo** | **Fase preparatória — primeiro documento.** O DFD antecede e fundamenta o ETP, o Termo de Referência e a pesquisa de preços |
| **Documento técnico de apoio** | [`PROPOSTA_CONTRATACAO_IDJUV.md`](./PROPOSTA_CONTRATACAO_IDJUV.md) (ETP/TR) e [`DOCUMENTACAO_TECNICA.md`](./DOCUMENTACAO_TECNICA.md) |
| **Data de referência** | 16/09/2026 |

---

## Como usar este documento

Este arquivo **não é o DFD**. É o roteiro para preenchê-lo.

Para cada campo obrigatório do formulário de DFD do Instituto, há abaixo:

- **▸ Texto sugerido** — bloco em citação, redigido para ser transcrito
  diretamente no campo correspondente, com ajuste apenas dos dados variáveis
  marcados como `[preencher]`;
- **▸ Orientação de preenchimento** — o que o campo precisa conter para
  sustentar as fases seguintes e o que **não** deve ser escrito nele.

> **Regra geral.** O DFD descreve **a necessidade administrativa**, não a
> solução técnica. A solução é objeto do ETP. Onde este guia cita o Governa Hub
> na seção do objeto, o faz porque a plataforma **já se encontra em operação no
> Instituto** — o que se formaliza é a continuidade de um ativo existente, não a
> escolha antecipada de fornecedor. Essa distinção deve ficar explícita no
> documento, sob pena de o DFD ser lido como direcionamento.

### Dados a levantar antes de preencher

| Dado | Onde obter | Campo do DFD |
|---|---|---|
| Número do processo administrativo (SEI/protocolo) | Protocolo do Instituto | Cabeçalho |
| Item do Plano de Contratações Anual (PCA) | Setor de Planejamento | Seção 6 |
| Dotação orçamentária e elemento de despesa | Setor Orçamentário/Contábil | Seção 4 |
| Nome, matrícula e cargo do integrante requisitante | Área demandante | Seção 7 |
| Quantitativo de usuários e unidades atendidas | RH e Patrimônio | Seções 1 e 2 |

---

# 1 — Descrição da Necessidade / Demanda

> **Campo do DFD:** *"Descrição sucinta do objeto e justificativa da
> necessidade da contratação"* (Lei nº 14.133/2021, art. 6º, XX, e art. 12, VII).

## ▸ Texto sugerido

> O IDJUV, autarquia estadual criada pela Lei nº 2.301/2025 e regulamentada pelo
> Decreto nº 39.840-E/2026, executa, com estrutura administrativa enxuta, o ciclo
> completo de uma unidade gestora autônoma: folha de pagamento própria, execução
> orçamentária e financeira, gestão patrimonial de unidades esportivas
> distribuídas pelo território estadual, contratações públicas, gestão de
> contratos, tramitação de processos administrativos, transparência ativa e
> passiva, além dos programas finalísticos de desporto, juventude e lazer.
>
> A demanda decorre da **carência de uma solução tecnológica integrada** capaz de
> gerenciar, em ambiente único e auditável, as rotinas administrativas,
> orçamentárias, de pessoal e finalísticas do Instituto. Na ausência dessa
> integração, as informações institucionais permanecem dispersas em planilhas,
> arquivos locais e controles manuais, sem trilha de auditoria, sem integridade
> referencial entre os registros e sem responsável formal pela guarda e
> recuperação dos dados.
>
> A situação é agravada pelo fato de que a operação atual já se apoia em
> plataforma web implantada no Instituto — a solução **Governa Hub** — **sem
> instrumento contratual que a ampare**. O Instituto opera, hoje, sem nível de
> serviço exigível, sem responsável contratualmente obrigado pelo backup e pela
> recuperação de desastre, e sem obrigação de atualização da solução frente às
> alterações legais que incidem sobre suas rotinas (tabelas de INSS e IRRF,
> leiaute do eSocial, leiaute CNAB bancário, Lei nº 14.133/2021, LAI e LGPD).
>
> A necessidade, portanto, é de **dupla ordem**: suprir a carência de integração
> tecnológica das rotinas do Instituto e, simultaneamente, **regularizar
> juridicamente** a sustentação de um ativo do qual a operação administrativa já
> depende.

## ▸ Consequências da não contratação — tabela para transcrição

| Lacuna atual | Consequência para o Instituto |
|---|---|
| Ausência de sistema integrado de gestão | Retrabalho, divergência entre controles de RH, folha, patrimônio e orçamento, e ausência de visão gerencial consolidada |
| Ausência de contrato de sustentação | Indisponibilidade sem prazo de recuperação exigível — risco de paralisação da folha de pagamento e da execução financeira |
| Ausência de responsável formal por backup e recuperação | Risco de perda irreversível das bases de pessoal, folha e patrimônio |
| Ausência de obrigação de manutenção legal | Descumprimento de obrigação acessória por desatualização de alíquota, leiaute fiscal ou norma de contratações |
| Ausência de SLA de suporte | Dependência informal para restabelecer rotinas críticas |
| Titularidade da infraestrutura não definida contratualmente | Insegurança quanto à propriedade e à portabilidade do dado público |

## ▸ Orientação de preenchimento

1. **Descreva a carência, não o produto.** O campo deve responder "do que o
   Instituto precisa", não "o que se pretende comprar".
2. **Quantifique.** Informe o número de servidores atendidos, de unidades locais
   sob gestão patrimonial e o volume de processos administrativos por exercício.
   Quantitativo ausente no DFD inviabiliza o dimensionamento no ETP.
3. **Vincule a obrigações legais já exigíveis** — LAI, LGPD, eSocial, escrituração
   de folha e registro auditável dos atos. A necessidade que se apoia em dever
   legal dispensa demonstração adicional de interesse público.
4. **Registre a situação de fato.** Omitir que a plataforma já opera no Instituto
   compromete a instrução: o ETP precisará justificar o levantamento de itens de
   implantação já executados (item 4.3 deste guia).
5. **Não escreva neste campo**: marca, fornecedor, arquitetura, preço ou prazo.

---

# 2 — Definição Clara do Objeto

> **Campo do DFD:** *"Objeto pretendido"* — deve permitir que a autoridade
> competente identifique com precisão o que será contratado, sem exigir leitura
> do ETP.

## ▸ Texto sugerido

> **Contratação de empresa especializada para o licenciamento de uso, a
> implantação e a sustentação técnica continuada de plataforma web de gestão e
> governança pública, em instância dedicada e isolada do IDJUV, compreendendo
> infraestrutura em nuvem, parametrização institucional, migração de dados,
> capacitação, suporte técnico, manutenção corretiva, adaptativa e evolutiva, e
> rotinas de backup e recuperação de desastre.**
>
> O objeto **não é desenvolvimento de software sob encomenda**. Trata-se de
> **solução pronta, já desenvolvida, testada e em operação real no Instituto** —
> a plataforma Governa Hub —, composta por **17 módulos funcionais** que cobrem
> integralmente as rotinas administrativas, orçamentárias, de pessoal e
> finalísticas do órgão. O que se contrata é o **direito de uso em instância
> própria do Instituto**, acrescido dos serviços necessários para mantê-la em
> operação.
>
> Essa característica **elimina o prazo e o risco de desenvolvimento a partir do
> zero**: não há ciclo de levantamento de requisitos, prototipação, codificação e
> validação a percorrer, nem incerteza quanto à aderência funcional. As regras de
> negócio críticas — cálculo de folha com INSS e IRRF, geração de remessa bancária
> em leiaute CNAB, geração de eventos do eSocial, ciclo orçamentário de empenho,
> liquidação e pagamento, e publicação de dados de transparência sem exposição de
> dado pessoal — já se encontram implementadas e validadas em operação.

## ▸ Composição do objeto — os 17 módulos

Transcreva a tabela abaixo no campo de detalhamento do objeto ou como anexo do DFD.

### Núcleo de gestão pública — 13 módulos

| # | Módulo | Abrangência funcional |
|---:|---|---|
| 1 | **Administração** | Usuários, perfis de acesso, auditoria, reuniões, backup, configurações do sistema |
| 2 | **Recursos Humanos** | Servidores, lotações, designações, frequência, férias, licenças, viagens, portarias, contracheques |
| 3 | **Folha de Pagamento** *(integrada ao módulo de RH)* | Cálculo com INSS e IRRF, rubricas, consignações, remessa CNAB e eventos do eSocial |
| 4 | **Processos** | Tramitação de processos administrativos com despachos, pareceres, prazos e controle de sigilo |
| 5 | **Compras** | Licitações e aquisições |
| 6 | **Contratos** | Gestão e execução contratual, atas de registro de preço e fornecedores |
| 7 | **Financeiro** | Orçamento, QDD, alterações orçamentárias, empenhos, liquidações, pagamentos, adiantamentos e restos a pagar |
| 8 | **Patrimônio** | Bens patrimoniais, movimentações, campanhas de inventário, almoxarifado, manutenções e baixas |
| 9 | **Patrimônio Mobile (PWA)** | Aplicativo móvel de coleta de inventário em campo, com leitura de QR Code e operação offline |
| 10 | **Governança** | Estrutura organizacional, organograma, cargos, matriz RACI, riscos e controles internos |
| 11 | **Integridade** | Canal de denúncias, código de ética, conflito de interesses e compliance |
| 12 | **Transparência** | Portal público de transparência ativa e atendimento ao e-SIC (LAI) |
| 13 | **Comunicação (ASCOM)** | Demandas de comunicação e gestão de conteúdo do portal institucional |

### Vertical Desporto, Juventude e Lazer — 4 módulos

| # | Módulo | Abrangência funcional |
|---:|---|---|
| 14 | **Programas** | Programas sociais e esportivos, incluindo Bolsa Atleta, Juventude Cidadã, Esporte na Comunidade, Jovem Empreendedor, Jogos Escolares e seletivas estudantis |
| 15 | **Gestores Escolares** | Credenciamento de gestores para os Jogos Escolares de Roraima |
| 16 | **Organizações** | Federações desportivas, instituições e entidades parceiras |
| 17 | **Árbitros** | Cadastro e gestão de árbitros desportivos |
| 18 | **Gabinete** | Painel executivo da Presidência: pré-cadastros, portarias e ordens de missão |

> *A numeração acima é de apresentação. O catálogo canônico de 17 módulos consta
> do arquivo de configuração da solução; Folha integra o módulo de RH e Gabinete
> compõe o núcleo de gestão.*

## ▸ Dimensão verificada da solução

Números apurados por inspeção direta do código-fonte em 16/09/2026. Use-os no DFD
para demonstrar que a solução é **pronta**, e não projeto a desenvolver.

| Métrica | Valor |
|---|---:|
| Módulos funcionais | **17** |
| Telas/páginas do sistema | **241** |
| Rotas de navegação declaradas | **239** |
| Tabelas no banco de dados | **231** |
| Views de transparência e relatório | **15** |
| Funções de negócio no banco (RPC) | **47** |
| Migrações de banco versionadas | **246** |
| Funções serverless em produção | **8** |
| Geradores de documento PDF | **38** |
| Arquivos de código-fonte | **736** |
| Linhas de código | **~224.700** |

## ▸ Orientação de preenchimento

1. **Use a redação em negrito do texto sugerido como enunciado literal do objeto.**
   Ela já contempla os três componentes — licenciamento, implantação e sustentação
   — que precisam constar desde o DFD para sustentar a estrutura de custos da
   Seção 4.
2. **Declare expressamente que o objeto não é desenvolvimento sob encomenda.**
   A natureza do serviço determina o regime de execução, os critérios de aceite e
   a classificação orçamentária da despesa.
3. **Registre a expressão "instância dedicada e isolada".** O modelo adotado é de
   um banco de dados exclusivo por instituição — não banco compartilhado entre
   órgãos. Essa condição é requisito de segurança e de titularidade do dado
   público, e precisa nascer no DFD para ser exigível no Termo de Referência.
4. **Não descreva a solução como exclusiva de um fornecedor.** O DFD registra o
   que o Instituto precisa e a natureza do que será contratado; a demonstração de
   que a solução atende ao interesse público e a análise de alternativas de
   mercado são matéria do ETP.

---

# 3 — Justificativa da Solução e do Interesse Público

> **Campo do DFD:** *"Justificativa da necessidade da contratação"* e
> *"resultados pretendidos"*.

## ▸ Texto sugerido

> A contratação da solução já desenvolvida, implantada e em operação no
> Instituto atende ao interesse público por quatro razões concorrentes:
>
> **a) Eficiência administrativa e economicidade.** A plataforma integra em
> ambiente único rotinas hoje dispersas, eliminando retrabalho, divergência entre
> controles e a necessidade de contratação de sistemas distintos para pessoal,
> orçamento, patrimônio, contratos e transparência. O custo de TI do Instituto
> torna-se conhecido, estável e orçamentariamente previsível, em substituição a
> despesa hoje não formalizada.
>
> **b) Aproveitamento de sistema já testado e validado em operação real.** A
> solução não é hipótese de projeto: encontra-se em produção no Instituto, com
> suas regras fiscais e orçamentárias — cálculo de folha, INSS, IRRF, CNAB,
> eSocial e ciclo de empenho, liquidação e pagamento — validadas na operação
> corrente. O risco de implantação, habitual nesta classe de contratação,
> encontra-se substancialmente reduzido, e os prazos de desenvolvimento,
> homologação funcional e curva de adoção pelos servidores são suprimidos ou
> significativamente abreviados.
>
> **c) Segurança da informação mediante instância dedicada.** O modelo contratado
> prevê projeto de banco de dados exclusivo do Instituto, sem compartilhamento
> com outros entes, com controle de acesso aplicado no próprio banco (segurança
> em nível de linha), perfis de acesso por módulo, trilha de auditoria, backup
> em ambiente secundário independente e teste periódico de restauração. A
> exclusividade do banco assegura a titularidade do dado público e viabiliza a
> portabilidade integral ao término do contrato.
>
> **d) Atendimento a exigências legais já incidentes sobre o Instituto.** A
> solução sustenta o cumprimento tempestivo da Lei de Acesso à Informação
> (transparência ativa e e-SIC), da Lei Geral de Proteção de Dados no tratamento
> de dados de servidores e cidadãos, das obrigações acessórias de folha e do
> eSocial, e do registro auditável dos atos administrativos exigido pelos órgãos
> de controle.

## ▸ Resultados pretendidos — tabela para transcrição

| Dimensão | Resultado esperado |
|---|---|
| **Continuidade** | Operação de folha, orçamento e patrimônio com disponibilidade contratualmente exigível |
| **Conformidade** | Cumprimento tempestivo de LAI, LGPD, eSocial e Lei nº 14.133/2021 |
| **Segurança do dado** | Backup em ambiente secundário independente, com restauração testada periodicamente — hoje inexistente como obrigação |
| **Eficiência** | Eliminação de controles paralelos e de retrabalho entre RH, folha, orçamento e patrimônio |
| **Redução de dependência** | Documentação operacional e capacitação de administradores internos do Instituto |
| **Transparência** | Portal público mantido e atualizado, com dado pessoal filtrado na origem |
| **Previsibilidade orçamentária** | Custo de TI conhecido e estável, substituindo despesa não formalizada |

## ▸ Orientação de preenchimento

1. **Justifique a necessidade, não o fornecedor.** A redação sugerida sustenta
   *por que esta classe de solução* atende ao interesse público. A análise
   comparativa de alternativas de mercado — desenvolvimento próprio, ERP de
   mercado, solução gratuita ou manutenção do cenário atual — e a eventual
   conclusão sobre a forma de contratação **pertencem ao ETP**, que deve
   demonstrá-las com pesquisa de mercado.
2. **Não antecipe no DFD conclusão sobre inexigibilidade ou dispensa.** O
   enquadramento da forma de contratação é decisão posterior, fundamentada no ETP
   e submetida à assessoria jurídica. DFD que já conclui pela contratação direta
   fragiliza todo o processo.
3. **Registre a vertical finalística como requisito.** Esporte, juventude,
   federações, árbitros, gestores escolares e seletivas não são cobertos por ERPs
   administrativos convencionais. Esse é um requisito funcional legítimo e deve
   constar desde o DFD para que o ETP possa avaliá-lo.
4. **Declare com transparência as limitações conhecidas.** A instrução processual
   íntegra registra também as fragilidades da solução — ausência de suíte de
   testes automatizados, dívidas técnicas mapeadas e itens de correção exigidos na
   implantação. O ETP de apoio já as documenta; o DFD deve remeter a elas, não
   ocultá-las.

---

# 4 — Estimativa de Composição da Contratação

> **Campo do DFD:** *"Estimativa preliminar do valor da contratação"* e
> *"indicação da dotação orçamentária"*.

## 4.1 Regra estruturante: duas parcelas de natureza distinta

## ▸ Texto sugerido

> A contratação deve ser estruturada, desde a formalização da demanda, em **duas
> parcelas de natureza orçamentária distinta**, que não podem ser somadas em
> valor mensal único:
>
> | Parcela | Natureza da despesa | Fato gerador | Forma de pagamento |
> |---|---|---|---|
> | **A — Implantação** | **Não recorrente**, por entrega | Execução e aceite de cada etapa de implantação | Parcela única ou em marcos, **contra aceite formal** de cada entrega |
> | **B — Manutenção e sustentação da stack tecnológica** | **Continuada**, por disponibilidade | Disponibilidade do serviço no mês de referência | Mensal, **vinculada ao cumprimento do nível de serviço (SLA)** |
>
> A separação é **material, e não formal**: os fatos geradores são distintos, os
> critérios de aceite são distintos e a classificação orçamentária pode ser
> distinta. A diluição do valor de implantação dentro da mensalidade — prática
> corrente no mercado — impede que a fiscalização glose serviço continuado não
> prestado sem, com isso, inviabilizar o licenciamento de uso da plataforma.

## 4.2 Parcela A — Implantação (valor único, não recorrente)

Itens que devem ser previstos na composição, para instrução do ETP:

| # | Item | Escopo essencial |
|---:|---|---|
| 1 | Planejamento e gestão do projeto | Plano de implantação, cronograma, acompanhamento e relatório de encerramento |
| 2 | Setup de infraestrutura | Provisionamento do ambiente dedicado, aplicação do schema de banco, configuração de autenticação e armazenamento, publicação das funções serverless, domínio, DNS e certificados, **ambiente secundário de backup** e **ambiente de homologação segregado** |
| 3 | Parametrização institucional | Identidade do Instituto, marca e tema visual, habilitação dos módulos, estrutura organizacional e cargos, perfis de acesso e matriz de permissões, configuração de folha, frequência e numeração de documentos |
| 4 | Parametrização jurídico-documental | Modelos de ato com fundamentação legal vigente, cabeçalho e rodapé oficiais nos documentos gerados, publicação de lei de criação, decreto e regimento, configuração das páginas públicas |
| 5 | Migração de dados | Mapeamento das bases de origem, higienização, carga de servidores, cargos, lotações, histórico funcional, bens patrimoniais, contratos, execução orçamentária e histórico de folha, com **relatório de conciliação e divergências** |
| 6 | Homologação assistida | Plano de testes de aceite por módulo, validação fiscal de CNAB e eSocial, verificação das publicações de transparência quanto a exposição de dado pessoal, correção dos apontamentos |
| 7 | Capacitação | Trilhas de usuário final, multiplicador/gestor e administrador, com material didático e turmas de reforço |
| 8 | Documentação e transferência de conhecimento | Manual do administrador, procedimento de backup e recuperação, runbook de incidentes e matriz de acessos |

> **Referência de planejamento (não é preço).** O ETP de apoio estima a
> implantação integral em **R$ 118.500,00** (760 horas), e o **cenário de
> regularização** — considerando que parte dos itens 2 a 5 já foi executada — em
> torno de **R$ 48.000,00**. Ambos os valores são estimativas de referência
> sujeitas à pesquisa de preços do art. 23 da Lei nº 14.133/2021.

## 4.3 Levantamento prévio obrigatório

## ▸ Texto sugerido

> Considerando que a plataforma já se encontra implantada e em operação no
> Instituto, e que parte relevante dos itens de implantação foi executada fora de
> instrumento contratual, a área demandante recomenda que a fase preparatória
> inclua **levantamento formal da situação atual**, com o objetivo de **excluir da
> Parcela A os itens comprovadamente concluídos e aceitos**.
>
> Permanecem devidos em qualquer hipótese, por não terem sido formalmente
> executados:
>
> - comprovação e teste efetivo do ambiente secundário de backup e do ambiente de
>   homologação segregado;
> - homologação formal com aceite documentado por módulo;
> - capacitação formal dos servidores e documentação operacional — cuja ausência
>   constitui, hoje, o principal risco de dependência técnica do fornecedor.

## 4.4 Parcela B — Manutenção e sustentação da stack (valor mensal contínuo)

A mensalidade deve ser composta por **dois subgrupos, discriminados separadamente**:

### B.1 — Custos diretos de infraestrutura e nuvem

| # | Item | Especificação |
|---:|---|---|
| 1 | Backend principal | Banco de dados dedicado do Instituto, autenticação, armazenamento, funções serverless e backups gerenciados, sem pausa por inatividade |
| 2 | Backend secundário (recuperação de desastre) | Ambiente independente, destino do backup off-site |
| 3 | Excedentes de consumo | Provisão para banco, armazenamento de documentos, fotos de inventário e anexos, tráfego e usuários ativos acima da franquia |
| 4 | Hospedagem do front-end | CDN, TLS automático, ambientes de pré-visualização e proteção de publicação |
| 5 | E-mail transacional | Convocações, notificações e comunicações do sistema |
| 6 | Domínio, DNS e certificados | Rateio mensal do custo anual |
| 7 | Monitoramento e observabilidade | Retenção de logs, alertas de indisponibilidade e de erro |

> **Advertência cambial.** Os planos de infraestrutura são tarifados em dólar. O
> componente cambial deve ser **isolado na planilha de custos** e submetido a
> cláusula de repactuação anual, sob pena de o reajuste da infraestrutura
> contaminar a remuneração dos serviços.

### B.2 — Serviços de sustentação

| # | Item | Escopo |
|---:|---|---|
| 8 | Suporte técnico N1 e N2 | Atendimento a chamados, diagnóstico, orientação ao usuário e apoio ao administrador, dentro do SLA |
| 9 | Manutenção corretiva | Correção de defeitos em qualquer módulo, tela ou função do banco, sem custo adicional |
| 10 | Manutenção adaptativa e evolutiva legal | Adequação a tabelas de INSS e IRRF, leiaute e versão do eSocial, leiaute CNAB, Lei nº 14.133/2021, LAI e LGPD |
| 11 | Atualização de stack e segurança | Atualização de dependências, correção de vulnerabilidades, acompanhamento de versões e revisão das políticas de acesso no banco |
| 12 | Operação de backup e recuperação | Verificação do backup off-site e **teste de restauração com periodicidade mínima trimestral** |
| 13 | Gestão de acessos e auditoria | Criação, alteração e revogação de contas, revisão da matriz de permissões e extração de trilha de auditoria |
| 14 | Gestão contratual e relatórios | Relatório mensal de serviço, apuração de indicadores e reunião de acompanhamento |

> **Referência de planejamento (não é preço).** O ETP de apoio estima a
> mensalidade em **R$ 14.990,00** — composta por R$ 850,00 de infraestrutura e
> R$ 14.140,00 de sustentação, com franquia de referência de 86 horas/mês —,
> resultando em **R$ 179.880,00** anuais. O licenciamento de uso está compreendido
> no valor mensal, **sem cobrança por usuário nomeado**.

## 4.5 Quadro-resumo para o campo de valor estimado

| Parcela | Natureza | Valor de referência |
|---|---|---:|
| **A — Implantação** (cenário integral) | Não recorrente | R$ 118.500,00 |
| **A — Implantação** (cenário de regularização, após levantamento) | Não recorrente | ~R$ 48.000,00 |
| **B — Manutenção mensal** | Continuada | R$ 14.990,00 |
| **Primeiro ano** (A integral + 12 × B) | — | **R$ 298.380,00** |
| **Exercícios subsequentes** (12 × B) | Continuada | R$ 179.880,00 |

## ▸ Orientação de preenchimento

1. **Informe os dois valores separadamente no formulário.** Se o campo de valor
   estimado for único, registre o total do primeiro ano e **detalhe a composição
   em nota**, explicitando o valor não recorrente e o valor mensal.
2. **Rotule os valores como estimativa de referência.** O preço estimado será
   formalizado por pesquisa nos termos do art. 23 da Lei nº 14.133/2021, com
   consulta ao Painel de Preços, a contratações similares de entes públicos e a
   fornecedores do ramo. O DFD **não** fixa preço.
3. **Consulte o setor contábil quanto à classificação da despesa** antes de
   indicar o elemento. Implantação e sustentação continuada podem receber
   classificações distintas, e a definição impacta a dotação a ser reservada.
4. **Dimensione a vigência plurianual.** Serviço de natureza continuada admite
   vigência de até 5 anos (art. 106 da Lei nº 14.133/2021); indique no DFD a
   vigência pretendida e a necessidade de previsão nos exercícios seguintes.
5. **Condicione a Parcela A ao levantamento da Seção 4.3.** Registre no DFD que o
   valor de implantação será ajustado após a verificação dos itens já executados —
   isso protege o Instituto contra pagamento por entrega já realizada.

---

# 5 — Demais campos do formulário

| Campo | Conteúdo sugerido |
|---|---|
| **Grau de prioridade** | **Alta.** A ausência de instrumento contratual expõe a folha de pagamento, a execução orçamentária e a base patrimonial a risco de indisponibilidade e de perda de dados, sem prazo de recuperação exigível |
| **Data pretendida para a contratação** | `[preencher]` — considerar prazo de 130 dias corridos para a implantação integral, ou prazo reduzido no cenário de regularização |
| **Vinculação ao planejamento** | Cumprimento de obrigações legais já exigíveis do Instituto: LAI, LGPD, eSocial, escrituração de folha e registro auditável dos atos administrativos |
| **Previsão no PCA** | `[preencher item do Plano de Contratações Anual]`. Não havendo previsão, instruir o pedido de inclusão/alteração antes do prosseguimento |
| **Contratações correlatas** | Não há contratação vigente com objeto sobreposto. Verificar contratos de conectividade e de licenças de escritório — objetos distintos e complementares |
| **Área requisitante** | `[preencher — unidade administrativa demandante]` |
| **Integrante requisitante indicado** | `[preencher — nome, matrícula e cargo]` (art. 7º da Lei nº 14.133/2021) |
| **Autoridade que aprova a demanda** | Presidente do IDJUV |

---

# 6 — Checklist de conferência antes da assinatura

- [ ] A necessidade está descrita como **carência administrativa**, não como pedido de produto
- [ ] Os quantitativos foram preenchidos (servidores, unidades, processos por exercício)
- [ ] O objeto está enunciado com os três componentes: **licenciamento + implantação + sustentação**
- [ ] Consta expressamente que **não se trata de desenvolvimento sob encomenda**
- [ ] Consta a exigência de **instância dedicada e isolada**
- [ ] A justificativa vincula a demanda a **obrigações legais exigíveis**
- [ ] O DFD **não** conclui sobre forma de contratação (dispensa/inexigibilidade) nem indica fornecedor
- [ ] As limitações conhecidas da solução estão referenciadas, não omitidas
- [ ] Os valores estão **separados** entre parcela única de implantação e mensalidade continuada
- [ ] Os valores estão rotulados como **estimativa de referência** sujeita ao art. 23
- [ ] Consta a recomendação de **levantamento prévio** dos itens de implantação já executados
- [ ] O item do PCA e a dotação orçamentária foram informados
- [ ] O integrante requisitante foi indicado
- [ ] O documento está assinado pela área demandante e encaminhado à autoridade competente

---

# 7 — Encaminhamento após o DFD

| Etapa | Documento | Responsável |
|---|---|---|
| 1 | **DFD** — formalização da demanda | Área demandante |
| 2 | Aprovação da demanda e designação da equipe de planejamento | Autoridade competente |
| 3 | **ETP** — Estudo Técnico Preliminar, com análise de alternativas e viabilidade | Equipe de planejamento |
| 4 | **Pesquisa de preços** (art. 23) | Setor de contratações |
| 5 | **Termo de Referência** | Equipe de planejamento |
| 6 | Análise jurídica e definição da forma de contratação | Assessoria jurídica |
| 7 | Reserva orçamentária e autorização | Ordenador de despesa |

> Os documentos das etapas 3 e 5 já possuem minuta técnica de apoio em
> [`PROPOSTA_CONTRATACAO_IDJUV.md`](./PROPOSTA_CONTRATACAO_IDJUV.md), que
> aprofunda arquitetura, requisitos, SLA, indicadores e glosas, propriedade
> intelectual, portabilidade, proteção de dados, análise de alternativas e matriz
> de riscos.

---

## Anexo — Rastreabilidade das informações técnicas

Todas as informações quantitativas deste guia foram extraídas do repositório do
sistema em 16/09/2026:

| Informação | Fonte |
|---|---|
| Catálogo de 17 módulos | `src/shared/config/modules.config.ts` · `docs/VISAO_GERAL.md` |
| Detalhamento funcional por módulo | `docs/MODULOS.md` |
| Contagens de telas, tabelas, rotas, funções e migrações | `docs/README.md` (snapshot) · `docs/ARQUITETURA.md` |
| Arquitetura, stack e modelo de hospedagem | `docs/ARQUITETURA.md` · `DOCUMENTACAO_TECNICA.md` |
| Modelo de instância dedicada por instituição | `docs/WHITE_LABEL.md` · `docs/MIGRACAO_SUPABASE_PROPRIO.md` |
| Controle de acesso, perfis e trilha de auditoria | `docs/RBAC_PERMISSOES.md` · `docs/AUDITORIA_USUARIOS.md` |
| Backup off-site e recuperação de desastre | `docs/BACKUP_CONTINGENCIA.md` |
| Funções serverless em produção | `docs/EDGE_FUNCTIONS.md` |
| Dados institucionais, legais e de contato do Instituto | `tenants/idjuv/tenant.config.ts` |
| Composição de custos e estimativas de referência | `PROPOSTA_CONTRATACAO_IDJUV.md`, Seção 5 |

> **Aviso.** Os valores monetários citados são **estimativas de referência para
> instrução processual**, construídas por composição de custos. Não constituem
> proposta comercial nem substituem a pesquisa de preços exigida pelo art. 23 da
> Lei nº 14.133/2021.
