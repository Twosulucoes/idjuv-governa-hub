# Estudo Técnico Preliminar e Termo de Referência Simplificado

## Contratação de Solução de Governança Digital — IDJUV Governa Hub

| | |
|---|---|
| **Órgão contratante** | IDJUV — Instituto de Desporto, Juventude e Lazer do Estado de Roraima |
| **Objeto resumido** | Licenciamento de uso, implantação e sustentação de plataforma web de gestão administrativa e governança pública |
| **Natureza do serviço** | Serviço técnico especializado de TIC, **continuado**, com fornecimento de software como serviço (SaaS) em instância dedicada |
| **Fundamento legal** | Lei nº 14.133/2021 (arts. 6º, XX e XXIII; 18; 40; 106) · IN SGD/ME nº 94/2022 (subsidiariamente) · LGPD (Lei nº 13.709/2018) · LAI (Lei nº 12.527/2011) |
| **Documento-base técnico** | [`DOCUMENTACAO_TECNICA.md`](./DOCUMENTACAO_TECNICA.md) e [`docs/WHITE_LABEL.md`](./docs/WHITE_LABEL.md) |
| **Data de referência** | 16/09/2026 |

> **Aviso metodológico.** Este documento descreve **o sistema que existe hoje**,
> auditado diretamente no código-fonte do repositório `twosulucoes/idjuv-governa-hub`
> em 16/09/2026. Todas as quantidades de módulos, telas, tabelas e rotas citadas
> na Seção 2 são contagens reais, não estimativas comerciais. Os **valores**
> da Seção 5 são **estimativas de referência** construídas por composição de
> custos, sujeitas à pesquisa de preços formal exigida pelo art. 23 da
> Lei nº 14.133/2021.

---

## Sumário

1. [Descrição da necessidade](#1--descrição-da-necessidade)
2. [Objeto real da contratação](#2--objeto-real-da-contratação)
3. [Stack técnica e arquitetura](#3--stack-técnica-e-arquitetura)
4. [Requisitos da contratação](#4--requisitos-da-contratação)
5. [Modelo de contratação e estimativa de valores](#5--modelo-de-contratação-e-estimativa-de-valores)
6. [Modelo de execução e gestão contratual](#6--modelo-de-execução-e-gestão-contratual)
7. [Justificativa do parcelamento e da solução escolhida](#7--justificativa-do-parcelamento-e-da-solução-escolhida)
8. [Resultados pretendidos e riscos](#8--resultados-pretendidos-e-riscos)
9. [Posicionamento conclusivo](#9--posicionamento-conclusivo)

---

# 1 — Descrição da necessidade

## 1.1 Situação atual

O IDJUV é autarquia estadual que executa, com estrutura administrativa enxuta,
o ciclo completo de uma unidade gestora: folha de pagamento própria, execução
orçamentária, gestão patrimonial de unidades esportivas distribuídas pelo
território, contratações públicas, processos administrativos, transparência
ativa e passiva, e programas finalísticos de esporte e juventude.

Essas funções são hoje operadas pela plataforma **Governa Hub**, sistema web
já implantado e em produção no Instituto. A plataforma reúne **17 módulos
funcionais**, **241 telas** e **231 tabelas** em banco de dados, com portal
público de transparência e aplicativo móvel para inventário patrimonial em campo.

A necessidade que motiva esta contratação **não é adquirir um sistema novo**: é
**formalizar, sustentar e dar continuidade** à operação de uma plataforma que já
concentra o dado administrativo do órgão. Sem instrumento contratual, o Instituto
opera hoje sem garantia de nível de serviço, sem responsável formal pelo backup e
pela recuperação de desastre, e sem obrigação contratual de atualização frente às
mudanças legais (eSocial, tabelas de INSS/IRRF, Lei nº 14.133/2021, LAI).

## 1.2 Problema a resolver

| Problema | Consequência para o Instituto |
|---|---|
| Ausência de contrato de sustentação | Indisponibilidade do sistema sem prazo de recuperação exigível; risco de paralisação de folha e pagamentos |
| Ausência de responsável formal por backup e DR | Risco de perda irreversível de base de RH, folha e patrimônio |
| Ausência de obrigação de manutenção legal | Sistema desatualizado frente a mudanças de alíquota, leiaute do eSocial ou norma de contratações |
| Ausência de SLA de suporte | Dependência informal para resolver incidentes que travam a operação |
| Infraestrutura de nuvem sem titularidade contratual definida | Dúvida sobre propriedade e portabilidade do dado público |

## 1.3 Alinhamento ao planejamento

A contratação é instrumental ao cumprimento de obrigações legais já exigíveis do
Instituto: publicidade ativa (LAI), atendimento ao e-SIC, tratamento adequado de
dados pessoais de servidores e cidadãos (LGPD), escrituração de folha e envio de
eventos ao eSocial, e registro auditável dos atos administrativos.

---

# 2 — Objeto real da contratação

## 2.1 Definição do objeto

> **Contratação de empresa especializada para o licenciamento de uso, a implantação
> e a sustentação técnica continuada da plataforma de gestão e governança pública
> "Governa Hub", em instância dedicada e isolada do IDJUV, compreendendo
> infraestrutura em nuvem, parametrização institucional, migração de dados,
> treinamento, suporte técnico, manutenção corretiva, adaptativa e evolutiva, e
> rotinas de backup e recuperação de desastre.**

O objeto **não é desenvolvimento de software sob encomenda**. A plataforma já
existe, está operacional e é produto do contratado. O que se contrata é o direito
de uso em instância própria do Instituto, acrescido dos serviços necessários para
mantê-la operando.

## 2.2 Os 17 módulos que compõem o sistema

Lista extraída de `src/shared/config/modules.config.ts` — fonte da verdade do
catálogo de módulos no código.

### Núcleo de gestão pública (13 módulos)

| # | Módulo | Código | Escopo funcional real |
|---:|---|---|---|
| 1 | **Administração** | `admin` | Gestão de usuários e perfis, controle de acesso e painel de permissões, central de aprovações, central de relatórios, gestão de módulos, gerenciador de páginas públicas, reuniões com check-in, auditoria, backup off-site, recuperação de desastre, inspeção de schema |
| 2 | **Recursos Humanos** | `rh` | Cadastro e dossiê de servidores, lotação e designações, frequência e ponto, férias, licenças e viagens, portarias (central, pendências, atribuição), contracheques, diagnóstico de pendências cadastrais, relatórios e exportação |
| — | **Folha de Pagamento** | submódulo de `rh` | Cálculo de folha com INSS e IRRF, rubricas, consignações, folha bloqueada, geração de remessa bancária **CNAB** e de eventos **eSocial** (inclusive XML) |
| 3 | **Processos / Workflow** | `workflow` | Tramitação de processos administrativos em modelo SEI: despachos, encaminhamentos, pareceres, prazos e SLA, anexação documental e controle de sigilo |
| 4 | **Compras** | `compras` | Processos licitatórios, aquisições, atas de registro de preço, cadastro de fornecedores |
| 5 | **Contratos** | `contratos` | Gestão contratual, vigências, aditivos e acompanhamento de execução |
| 6 | **Financeiro** | `financeiro` | Ciclo orçamentário completo: orçamento, QDD, alterações orçamentárias, solicitações, empenhos e subempenhos, liquidações, pagamentos, adiantamentos, restos a pagar, contas bancárias, relatórios |
| 7 | **Patrimônio** | `patrimonio` | Bens patrimoniais, movimentações, campanhas de inventário, coleta, almoxarifado e estoque, requisições de material, manutenções, baixas, unidades locais e cessão de espaços |
| 8 | **Patrimônio Mobile** | `patrimonio_mobile` | PWA instalável para coleta de inventário em campo, leitura de QR Code e **operação offline** com sincronização posterior |
| 9 | **Governança** | `governanca` | Estrutura organizacional, organograma visual, gestão de cargos, matriz RACI, riscos e controles internos, checklists, decisões administrativas, publicação de lei de criação, decreto e regimento interno |
| 10 | **Integridade** | `integridade` | Canal público de denúncias, gestão de denúncias, código de ética, conflito de interesses e política de integridade |
| 11 | **Transparência** | `transparencia` | Portal público sem login: e-SIC (LAI), cargos e remuneração, licitações, execução orçamentária e patrimônio público — servidos por **views `v_*` que excluem dado pessoal** |
| 12 | **Comunicação / ASCOM** | `comunicacao` | Demandas de comunicação com protocolo e consulta pública, CMS de conteúdos, banners e galerias, calendário de comunicação |
| 13 | **Gabinete** | `gabinete` | Painel executivo da Presidência, com visão consolidada de portarias, pré-cadastros, ordens de missão e relatórios de viagem |

### Vertical Esporte e Juventude (4 módulos)

| # | Módulo | Código | Escopo funcional real |
|---:|---|---|---|
| 14 | **Programas** | `programas` | Bolsa Atleta, Juventude Cidadã, Esporte Comunidade, Jovem Empreendedor, Jogos Escolares e Seleções Estudantis (com hot site público de seletiva) |
| 15 | **Gestores Escolares** | `gestores_escolares` | Credenciamento para os Jogos Escolares: formulário e consulta públicos, administração, importação de escolas, relatórios e auditoria de workflow |
| 16 | **Organizações** | `organizacoes` | Cadastro público e gestão de federações esportivas e instituições parceiras |
| 17 | **Árbitros** | `arbitros` | Cadastro público de árbitros e gestão administrativa do quadro |

> A separação entre núcleo e vertical é relevante contratualmente: o núcleo é o
> ERP público genérico; a vertical carrega as regras específicas de esporte e
> juventude do IDJUV. A contratação do Instituto abrange **os dois conjuntos**.

## 2.3 Formulários institucionais e portal público

Além dos módulos, o sistema entrega:

- **Formulários institucionais:** Termo de Demanda, Ordem de Missão, Relatório de
  Viagem, Requisição de Material, Termo de Responsabilidade e CPSI — este último
  com assistente de IA em função serverless dedicada.
- **Portal público:** notícias, galerias, home institucional e prévia de portal,
  além das rotas públicas de transparência, mini-currículo, ASCOM, federações,
  árbitros e gestores escolares — todas sob guarda de publicação/manutenção
  (`PublicPageGuard`), que permite ao Instituto publicar ou despublicar página
  pelo painel, sem redeploy.

## 2.4 Regras de negócio efetivamente implementadas

O que distingue esta plataforma de um CRUD administrativo genérico são as regras
de domínio já codificadas e em operação:

| Domínio | Regra implementada |
|---|---|
| **Folha** | Cálculo de INSS e IRRF por faixa, rubricas configuráveis, consignações, bloqueio de folha fechada, geração de remessa **CNAB** para o banco e de eventos **eSocial** em XML |
| **Frequência** | Apuração de jornada, banco de horas, feriados, pacotes de frequência com download em lote |
| **Orçamento** | Cadeia orçamentária completa e encadeada — orçamento → solicitação → empenho → subempenho → liquidação → pagamento — com restos a pagar e adiantamentos |
| **Atos administrativos** | **11 modelos de ato** (portarias) com fundamentação legal, numeração, atribuição e controle de pendências |
| **Controle de acesso** | RBAC hierárquico em nível de módulo, com **Row Level Security** aplicado no banco e funções de apoio `has_permission`, `has_role`, `user_has_unit_access`, `usuario_tem_acesso_modulo` |
| **Transparência** | Exposição pública por views que filtram dado pessoal na origem, não na aplicação — desenho aderente à LGPD |
| **Processos** | Tramitação com prazos, SLA, sigilo e trilha de despachos |
| **Patrimônio** | Campanha de inventário com coleta em campo offline e reconciliação |
| **Auditoria** | Trilha de auditoria e registro auditável de dados oficiais com campo `bloqueado` e referência legal |

## 2.5 Dimensão verificada do sistema

Contagens obtidas por inspeção direta do repositório em 16/09/2026:

| Métrica | Valor |
|---|---:|
| Arquivos TypeScript/TSX em `src/` | **736** |
| Linhas de código em `src/` | **~224.700** (das quais ~23.000 são tipos gerados) |
| Telas/páginas | **241** |
| Componentes de interface | **265** |
| Rotas declaradas | **239** |
| Hooks de acesso a dados | **61** |
| Geradores de documento PDF | **38** |
| Migrações SQL versionadas | **246** |
| Tabelas no Postgres | **231** |
| Views de transparência e relatório | **15** |
| Funções RPC no banco | **47** |
| Funções serverless (Edge Functions) | **8** |
| Módulos funcionais | **17** |

Esses números são a **base de dimensionamento** do esforço de sustentação
proposto na Seção 5.

---

# 3 — Stack técnica e arquitetura

## 3.1 Arquitetura adotada

```
┌───────────────────────────────────────────────────────────────┐
│                       NAVEGADOR / PWA                          │
│  React 18 (SPA) · shadcn/ui · Tailwind · React Query           │
│  react-router-dom — 239 rotas                                  │
│  Geração de PDF/Word/XLSX ocorre no cliente                    │
└──────────────┬────────────────────────────┬───────────────────┘
               │ supabase-js (HTTPS/JWT)     │ Edge Functions
               ▼                             ▼
┌───────────────────────────────────────────────────────────────┐
│                     BACKEND GERENCIADO                         │
│  Postgres — 231 tabelas · 15 views · 47 RPC                    │
│  Row Level Security = fronteira real de segurança do dado      │
│  Auth (JWT) · Storage · Edge Functions (Deno, service role)    │
└───────────────────────────────────────────────────────────────┘
```

**Característica arquitetural determinante:** não existe servidor de aplicação
próprio. O front-end comunica-se diretamente com o Postgres via PostgREST, e a
autorização é imposta pelo banco (RLS). Operações privilegiadas — criar ou
excluir usuário, redefinir senha, executar backup off-site, ler o schema —
passam obrigatoriamente por função serverless com credencial de serviço.

Consequência contratual: **não há custo de servidor de aplicação, orquestração de
contêineres ou balanceador**, o que reduz de forma relevante o custo mensal de
infraestrutura frente a um ERP tradicional de três camadas. Em contrapartida, a
**qualidade das políticas de RLS é item crítico de segurança** e precisa ser
objeto de manutenção contratada, não de esforço eventual.

## 3.2 Front-end

| Item | Tecnologia | Versão |
|---|---|---|
| Build e servidor de desenvolvimento | **Vite** + `@vitejs/plugin-react-swc` | Vite 5.4 |
| Linguagem | **TypeScript** (modo estrito) | 5.8 |
| Biblioteca de interface | **React** | 18.3 |
| Design system | **shadcn/ui** sobre **Radix UI** | Radix 1.x/2.x |
| Estilização | **Tailwind CSS** + `@tailwindcss/typography` + `tailwindcss-animate` | Tailwind 3.4 |
| Roteamento | **react-router-dom** | 6.30 |
| Estado de servidor e cache | **@tanstack/react-query** | 5.83 |
| Formulários e validação | **react-hook-form** + **zod** (`@hookform/resolvers`) | 7.61 / 3.25 |
| Animação | **framer-motion** | 12.33 |
| Gráficos | **recharts** | 2.15 |
| Diagramas (organograma, workflow) | **reactflow** | 11.11 |
| Ícones | **lucide-react** | 0.462 |
| Tema claro/escuro | **next-themes** + tokens CSS | 0.3 |
| Notificações | **sonner** + toaster do shadcn | 1.7 |
| Datas | **date-fns** | 3.6 |
| Sanitização de HTML | **dompurify** | 3.4 |
| Leitura de QR Code (mobile) | **html5-qrcode** | 2.3 |
| PWA | **vite-plugin-pwa** + `@vite-pwa/assets-generator` | 1.2 |

### Geração de documentos — executada no cliente

| Formato | Biblioteca | Versão |
|---|---|---|
| PDF | **jspdf** e **pdf-lib** | 4.2.1 / 1.17 |
| Word (.docx) | **docx** | 8.5 |
| Planilha (.xlsx) | **xlsx** | 0.18 |
| Download no navegador | **file-saver** | 2.0 |

São **38 geradores de PDF** distintos, além de geradores fiscais próprios:
`cnabGenerator.ts` (remessa bancária) e `esocialGenerator.ts` /
`esocialXmlGenerator.ts` (eventos do eSocial). Não há servidor de relatórios —
o processamento ocorre na máquina do usuário, o que elimina custo de
infraestrutura de relatórios e mantém o dado sensível fora de trânsito adicional.

## 3.3 Back-end e banco de dados

| Item | Tecnologia |
|---|---|
| Plataforma de backend | **Supabase** (gerenciado) |
| Banco de dados | **PostgreSQL** — 231 tabelas, 15 views (`v_*`), 47 funções RPC |
| Autenticação | **Supabase Auth** (JWT) |
| Autorização de dados | **Row Level Security** nativo do Postgres |
| Armazenamento de arquivos | **Supabase Storage** (documentos, logos, anexos) |
| Funções serverless | **Edge Functions** em **Deno/TypeScript** |
| Cliente de acesso | `@supabase/supabase-js` 2.89 (via PostgREST) |
| Versionamento de schema | 246 migrações SQL versionadas no repositório |
| E-mail transacional | **Resend** |

### As 8 funções serverless em produção

| Função | Responsabilidade |
|---|---|
| `admin-create-user` | Criação de usuário com credencial de serviço |
| `delete-user` | Exclusão de usuário |
| `admin-reset-password` | Redefinição administrativa de senha |
| `backup-offsite` | Backup para projeto Supabase secundário, com descoberta automática de tabelas e geração de manifesto |
| `database-schema` | Introspecção de schema para a interface administrativa |
| `download-frequencia` | Montagem de pacotes de frequência |
| `enviar-convite-reuniao` | E-mail transacional de convocação de reunião |
| `cpsi-ai-assistant` | Assistente de IA do formulário CPSI |

## 3.4 Infraestrutura, hospedagem e operação

| Camada | Provimento |
|---|---|
| Hospedagem do front-end | **Vercel** — SPA com rewrite para `/index.html` (`vercel.json`), CDN global, TLS automático e ambientes de preview por branch |
| Backend, banco, auth e storage | **Supabase** — projeto **dedicado e isolado** do IDJUV |
| Backup off-site | **Segundo projeto Supabase**, independente do principal, alimentado pela função `backup-offsite` |
| E-mail transacional | **Resend** |
| Repositório e versionamento | **Git/GitHub** — `twosulucoes/idjuv-governa-hub` |
| Ambiente de desenvolvimento assistido | **Lovable** (`lovable.dev`), com commit automático bidirecional no repositório |
| Gerenciador de pacotes | **bun** (preferencial, `bun.lockb`); `npm` suportado |
| Verificação de build | `bun run lint` + `bun run build` (a checagem de tipos ocorre no build) |

### Modelo de isolamento — instância dedicada

O modelo adotado é de **uma instância por instituição**: projeto Supabase próprio
e deploy próprio, **não** banco multi-tenant compartilhado.

Justificativa técnica registrada na documentação de arquitetura: dados de RH e
folha de pagamento de órgãos públicos distintos não devem compartilhar banco, e o
RLS existente foi desenhado para isolar por **unidade dentro de um órgão**. O
modelo compartilhado exigiria coluna `tenant_id` em 231 tabelas e a reescrita de
todas as políticas de segurança.

Para o IDJUV, esse desenho significa que **o banco de dados é exclusivo do
Instituto**, condição relevante para a titularidade do dado público e para a
portabilidade prevista na Seção 6.6.

## 3.5 Limitações técnicas declaradas

Em observância ao princípio da transparência na fase preparatória, registram-se
as fragilidades conhecidas da solução, já mapeadas na documentação técnica:

| Limitação | Situação | Tratamento previsto no contrato |
|---|---|---|
| **Ausência de suíte de testes automatizados** | A verificação é `lint` + `build` + validação manual | Item de manutenção evolutiva na Seção 5.2; recomenda-se meta de cobertura para o segundo ano |
| **`App.tsx` concentra as 239 rotas** em arquivo único de ~1.280 linhas | Risco de conflito de merge, agravado pelo commit automático do Lovable | Absorvido pela manutenção; refatoração como evolutiva |
| **Wrappers de cliente Supabase duplicados** (3 arquivos coexistentes) | Dívida técnica histórica | Consolidação como manutenção adaptativa |
| **Três paletas de cor divergentes** para a mesma identidade (`--primary` azul, PDF `#004444`, relatórios verde) | Inconsistência visual entre tela e documento gerado | Unificação prevista na parametrização de implantação (Seção 5.1, item 3) |
| **Marca do Instituto acoplada ao código** — ~1.070 ocorrências em 224 arquivos, incluindo **valores de enum do Postgres** (`efetivo_idjuv`, `comissionado_idjuv`, `origem_vinculo`) e colunas (`cessoes.unidade_idjuv_id`) | Não afeta a operação do IDJUV; afeta a revenda do produto a terceiros | **Fora do escopo desta contratação.** Registrado por transparência: o esforço de generalização é do fornecedor, não custo do Instituto |
| **Dados do Instituto versionados no repositório** (`public/documentos/*.pdf`, `public/disaster-recovery/*.sql`) | Documentos e dumps do IDJUV acompanham qualquer clone do repositório | **Correção exigida na implantação** — migração para Storage, com verificação no aceite (Seção 6.4) |

> A última linha é exigência de segurança da informação, não melhoria opcional:
> enquanto dumps de banco permanecerem versionados, o controle de acesso ao
> repositório é, na prática, controle de acesso ao dado do Instituto.

---

# 4 — Requisitos da contratação

## 4.1 Requisitos funcionais

Entrega e manutenção em operação dos 17 módulos, 241 telas e das regras de
negócio descritas na Seção 2, incluindo portal público de transparência e
aplicativo móvel de inventário.

## 4.2 Requisitos técnicos

| # | Requisito |
|---|---|
| T1 | Instância **dedicada e isolada** do Instituto — banco Postgres exclusivo, sem compartilhamento com outros contratantes |
| T2 | Autorização aplicada no banco (**RLS**) em todas as tabelas com dado pessoal ou sensível, e não apenas na interface |
| T3 | Backup automatizado com **projeto secundário independente** e manifesto de verificação de integridade |
| T4 | Transporte cifrado (TLS) em todos os pontos e autenticação por JWT |
| T5 | Portal público servido por **views sem dado pessoal**, com filtragem na origem |
| T6 | Trilha de auditoria das operações administrativas |
| T7 | Aplicativo móvel instalável (PWA) com operação offline e sincronização |
| T8 | Geração de arquivos fiscais em leiaute vigente: **CNAB** e **eSocial** |
| T9 | Migrações de schema versionadas e reaplicáveis |
| T10 | Ambiente de homologação segregado da produção |

## 4.3 Requisitos de segurança e conformidade

| # | Requisito |
|---|---|
| S1 | **LGPD** — o Instituto é **controlador**; o contratado é **operador**, vinculado a acordo de tratamento de dados |
| S2 | **LAI** — manutenção das funcionalidades de transparência ativa e do e-SIC |
| S3 | Segregação de funções por RBAC hierárquico, com bypass restrito a administrador identificado |
| S4 | Correção de vulnerabilidades e atualização de dependências com CVE, em prazo compatível com a criticidade |
| S5 | Execução periódica dos **advisors de segurança e desempenho** da plataforma de backend, com relatório ao fiscal |
| S6 | Remoção de documentos e dumps do Instituto do repositório de código (Seção 3.5) |

## 4.4 Requisitos de capacitação

Treinamento presencial ou remoto em três trilhas: **usuário final** (operação por
módulo), **multiplicador/gestor** (administração de área) e **administrador do
sistema** (usuários, permissões, backup, publicação de páginas).

---

# 5 — Modelo de contratação e estimativa de valores

## 5.1 Estrutura do modelo

A contratação divide-se em **duas parcelas de natureza distinta**, conforme
determina a boa técnica orçamentária para serviços de TIC:

| Parcela | Natureza | Forma de pagamento |
|---|---|---|
| **A — Implantação** | Despesa **não recorrente**, por entrega | Parcela única ou em marcos, **contra aceite** de cada etapa |
| **B — Manutenção e sustentação** | Despesa **continuada**, por disponibilidade | Mensal, **vinculada ao cumprimento do SLA** |

A separação é obrigatória e não formal: são fatos geradores diferentes, com
dotações orçamentárias e critérios de aceite distintos. Vincular a implantação ao
valor mensal — prática comum de diluição — impede a fiscalização de glosar
serviço continuado não prestado sem inviabilizar o licenciamento.

### Perfis profissionais e valores-hora de referência

| Perfil | Valor/hora de referência |
|---|---:|
| Gerente de Projeto | R$ 220,00 |
| Arquiteto / Desenvolvedor Sênior | R$ 180,00 |
| Analista de Dados / Migração | R$ 150,00 |
| Desenvolvedor Pleno | R$ 130,00 |
| Analista de Negócio / Instrutor | R$ 120,00 |

---

## 5.2 PARCELA A — Valor de Implantação

Compreende setup de infraestrutura, parametrização do tenant IDJUV, migração de
dados e treinamento.

### A.1 Composição detalhada

| # | Item | Escopo | Perfil / horas | Valor |
|---:|---|---|---|---:|
| 1 | **Planejamento e gestão do projeto** | Plano de implantação, cronograma, reuniões de acompanhamento, relatório de encerramento | GP — 60h | R$ 13.200,00 |
| 2 | **Setup de infraestrutura** | Provisionamento do projeto Supabase dedicado; aplicação das 246 migrações; criação de buckets de Storage; configuração de Auth e políticas de senha; deploy das 8 Edge Functions; provisionamento na Vercel; domínio, DNS e certificados TLS; e-mail transacional; **configuração do projeto secundário de backup off-site**; ambiente de homologação segregado | Arquiteto — 80h | R$ 14.400,00 |
| 3 | **Parametrização do tenant IDJUV** | Identidade institucional (nome oficial, CNPJ, endereço, contatos, expediente, dirigente); marca (logos, brasão, favicon, ícones PWA); **unificação das três paletas divergentes** e aplicação do tema; co-branding do Governo do Estado; habilitação dos 17 módulos; estrutura organizacional e cargos; perfis de acesso e matriz RBAC; configuração de folha (rubricas, alíquotas, contas), frequência e numeração de documentos | Sênior 60h + Pleno 60h | R$ 18.600,00 |
| 4 | **Parametrização jurídico-documental** | Carga dos **11 modelos de ato** com fundamentação legal vigente; cabeçalho e rodapé oficiais nos 38 geradores de PDF e nos documentos Word; publicação de lei de criação, decreto e regimento interno; configuração das páginas públicas e do portal de transparência | Sênior 40h + Pleno 40h | R$ 12.400,00 |
| 5 | **Migração de dados** | Levantamento e mapeamento das bases de origem; tratamento e higienização; carga de servidores, dependentes, cargos, lotações e designações; histórico funcional; bens patrimoniais e unidades locais; contratos e fornecedores; execução orçamentária do exercício; **histórico de folha**; conciliação e relatório de divergências | Analista de Dados — 200h | R$ 30.000,00 |
| 6 | **Homologação assistida** | Execução do plano de testes de aceite por módulo; validação fiscal de CNAB e eSocial; validação das views públicas quanto a vazamento de dado pessoal; **verificação de remoção dos documentos e dumps do repositório**; correção dos apontamentos | Sênior 50h + Pleno 50h | R$ 15.500,00 |
| 7 | **Treinamento** | Três trilhas — usuário final (por módulo), multiplicador/gestor e administrador do sistema; material didático; turmas de reforço | Instrutor — 80h | R$ 9.600,00 |
| 8 | **Documentação e transferência de conhecimento** | Manual do administrador, procedimento de backup e recuperação, runbook de incidentes, matriz de acessos | Analista — 40h | R$ 4.800,00 |
| | **TOTAL DA IMPLANTAÇÃO** | **760 horas** | | **R$ 118.500,00** |

### A.2 Cronograma de marcos e pagamento

| Marco | Entregas | Prazo (dias corridos) | % do valor | Valor |
|---|---|---:|---:|---:|
| **M1** | Itens 1 e 2 — infraestrutura provisionada, homologação disponível, backup off-site ativo | 30 | 20% | R$ 23.700,00 |
| **M2** | Itens 3 e 4 — tenant parametrizado, marca e modelos de ato aplicados | 60 | 25% | R$ 29.625,00 |
| **M3** | Item 5 — migração concluída e conciliada | 100 | 30% | R$ 35.550,00 |
| **M4** | Itens 6, 7 e 8 — aceite, treinamento e documentação | 130 | 25% | R$ 29.625,00 |
| | **Total** | **130 dias** | **100%** | **R$ 118.500,00** |

### A.3 Ajuste aplicável ao caso concreto do IDJUV

A plataforma **já se encontra implantada e em operação** no Instituto. Parte
relevante dos itens 2, 3, 4 e 5 já foi executada fora de instrumento contratual.

Recomenda-se, portanto, que a fiscalização promova **levantamento de situação**
antes da contratação, glosando da Parcela A os itens comprovadamente concluídos e
aceitos. Os itens que **permanecem devidos em qualquer hipótese** são:

- **Item 2 (parcial)** — comprovação e teste efetivo do projeto secundário de
  backup e do ambiente de homologação segregado;
- **Item 6 (integral)** — homologação formal com aceite documentado, incluindo a
  remoção dos dumps e documentos do repositório;
- **Itens 7 e 8 (integrais)** — treinamento formal e documentação operacional,
  cuja ausência é o principal risco de dependência do fornecedor.

Como referência de planejamento, o **cenário de regularização** — mantidos apenas
os itens acima e 25% da parametrização — situa-se em torno de **R$ 48.000,00**,
valor a ser confirmado pelo levantamento.

---

## 5.3 PARCELA B — Valor Mensal de Manutenção e Sustentação da Stack

Serviço continuado, remunerado por disponibilidade e nível de serviço.

### B.1 Custos diretos de infraestrutura e nuvem

Valores em dólar convertidos à referência de **US$ 1,00 = R$ 5,80** (data-base
16/09/2026) e arredondados para cima na dezena, sujeitos a repactuação cambial
anual. Os itens 1, 2 e 4 correspondem a planos de assinatura tarifados em dólar
(US$ 25,00 e US$ 20,00 mensais); os demais são estimativas de consumo.

| # | Item | Especificação | Valor mensal |
|---:|---|---|---:|
| 1 | **Backend principal** | Supabase Pro — projeto dedicado do IDJUV: Postgres com 231 tabelas, Auth, Storage, Edge Functions, backups diários gerenciados com retenção de 7 dias, sem pausa por inatividade | R$ 150,00 |
| 2 | **Backend secundário (DR)** | Supabase Pro — projeto independente de backup off-site, destino da função `backup-offsite` | R$ 150,00 |
| 3 | **Excedentes de consumo** | Provisão para banco, Storage (documentos, fotos de inventário, anexos processuais), tráfego e usuários ativos acima da franquia | R$ 250,00 |
| 4 | **Hospedagem do front-end** | Vercel Pro — CDN global, TLS automático, ambientes de preview, proteção de deploy | R$ 120,00 |
| 5 | **E-mail transacional** | Resend — convocações de reunião, notificações e comunicações do sistema | R$ 60,00 |
| 6 | **Domínio, DNS e certificados** | Rateio mensal do custo anual | R$ 20,00 |
| 7 | **Monitoramento e observabilidade** | Retenção estendida de logs, alertas de indisponibilidade e de erro | R$ 100,00 |
| | **Subtotal — Infraestrutura** | | **R$ 850,00** |

### B.2 Serviços de sustentação

| # | Item | Escopo | Perfil / horas | Valor mensal |
|---:|---|---|---|---:|
| 8 | **Suporte técnico N1 e N2** | Atendimento a chamados, diagnóstico, orientação ao usuário, apoio ao administrador, dentro do SLA da Seção 6.2 | Pleno — 24h | R$ 3.120,00 |
| 9 | **Manutenção corretiva** | Correção de defeitos em qualquer dos 17 módulos, 241 telas ou 47 funções do banco, sem custo adicional | Sênior — 16h | R$ 2.880,00 |
| 10 | **Manutenção adaptativa e evolutiva** | Adequação a mudanças legais e normativas: tabelas de INSS e IRRF, leiaute e versão do **eSocial**, leiaute **CNAB** bancário, Lei nº 14.133/2021, LAI e LGPD; ajustes em modelos de ato por alteração normativa; pequenas evoluções demandadas pelo fiscal | Sênior — 24h | R$ 4.320,00 |
| 11 | **Atualização de stack e segurança** | Atualização das dependências de front-end e das 8 Edge Functions; correção de vulnerabilidades (CVE) em React, Vite, bibliotecas de PDF e cliente Supabase; acompanhamento de versão do Postgres e do runtime Deno; execução dos **advisors de segurança e desempenho** com relatório; revisão das políticas de RLS | Sênior — 8h | R$ 1.440,00 |
| 12 | **Operação de backup e recuperação** | Verificação do backup off-site e do manifesto de integridade; **teste de restauração** com periodicidade mínima trimestral; manutenção do plano de recuperação de desastre | Analista — 6h | R$ 900,00 |
| 13 | **Gestão de acessos e auditoria** | Criação, alteração e revogação de contas; revisão periódica da matriz de permissões; extração de trilha de auditoria a pedido do fiscal | Analista — 4h | R$ 600,00 |
| 14 | **Gestão contratual e relatórios** | Relatório mensal de serviço, apuração dos indicadores da Seção 6.3, reunião de acompanhamento | GP — 4h | R$ 880,00 |
| | **Subtotal — Sustentação** | | **86 h/mês** | **R$ 14.140,00** |

### B.3 Valor mensal consolidado

| Componente | Valor mensal |
|---|---:|
| Infraestrutura, nuvem e backups (B.1) | R$ 850,00 |
| Sustentação, segurança, atualizações e suporte (B.2) | R$ 14.140,00 |
| **VALOR MENSAL TOTAL** | **R$ 14.990,00** |
| **Valor anual (12 meses)** | **R$ 179.880,00** |

O licenciamento de uso da plataforma está **compreendido no valor mensal**, sem
cobrança por usuário nomeado. A franquia de **86 horas/mês** é o dimensionamento
de referência; horas de evolutiva excedentes, quando demandadas pelo Instituto,
seguem a tabela de perfis da Seção 5.1, mediante autorização prévia do fiscal.

### B.4 Resumo orçamentário

| Parcela | Valor |
|---|---:|
| **A — Implantação** (não recorrente, cenário integral) | R$ 118.500,00 |
| **B — Manutenção mensal** | R$ 14.990,00 |
| **Primeiro ano** (A + 12 × B) | **R$ 298.380,00** |
| **Exercícios subsequentes** (12 × B) | R$ 179.880,00 |

> **Estes valores são estimativa de referência para instrução do processo.** O
> preço estimado deve ser formalizado por pesquisa nos termos do art. 23 da
> Lei nº 14.133/2021, com consulta ao Painel de Preços, a contratações similares
> de entes públicos e a fornecedores do ramo.

---

# 6 — Modelo de execução e gestão contratual

## 6.1 Vigência

Serviço de natureza continuada: vigência inicial de **12 meses**, prorrogável até
o limite do **art. 106 da Lei nº 14.133/2021** (10 anos), mediante demonstração de
vantajosidade. A Parcela A é executada uma única vez, no primeiro período.

## 6.2 Níveis de serviço (SLA)

| Severidade | Definição | Prazo de resposta | Prazo de solução |
|---|---|---|---|
| **Crítica** | Sistema indisponível; folha, pagamento ou portal público inoperantes; suspeita de vazamento de dado pessoal | 1 hora útil | 4 horas úteis |
| **Alta** | Módulo inteiro indisponível ou regra de cálculo (folha, orçamento) produzindo resultado incorreto | 4 horas úteis | 16 horas úteis |
| **Média** | Funcionalidade específica com defeito, havendo alternativa de contorno | 8 horas úteis | 5 dias úteis |
| **Baixa** | Ajuste cosmético, dúvida de uso, melhoria menor | 16 horas úteis | 15 dias úteis |

Horário de atendimento: dias úteis, das 8h às 18h. Severidade crítica com
acionamento em regime estendido.

**Disponibilidade mensal mínima: 99,0%**, apurada sobre o horário de expediente,
excluídas janelas de manutenção comunicadas com 48 horas de antecedência.

## 6.3 Indicadores e glosas

| Indicador | Meta | Glosa sobre a fatura mensal |
|---|---|---|
| Disponibilidade | ≥ 99,0% | 2% por ponto percentual abaixo, limitado a 20% |
| Chamados críticos no prazo | 100% | 3% por ocorrência fora do prazo |
| Chamados de alta/média no prazo | ≥ 95% | 1% por ponto percentual abaixo |
| Teste de restauração de backup | 1 por trimestre | 10% no mês de inadimplemento |
| Relatório mensal entregue até o 5º dia útil | 100% | 2% por mês de atraso |

## 6.4 Critérios de aceite da implantação

1. Os 17 módulos acessíveis e operantes conforme perfil de acesso.
2. Migração conciliada: divergência **zero** em quantitativo de servidores, bens
   patrimoniais e saldos orçamentários, mediante relatório assinado.
3. Geração válida de **CNAB** e de eventos **eSocial** em leiaute vigente,
   validada pelo setor responsável do Instituto.
4. Backup off-site executado com manifesto **e restauração testada com sucesso**
   no ambiente de homologação.
5. Views públicas de transparência auditadas sem exposição de dado pessoal.
6. Documentos e dumps do Instituto **removidos do repositório** e migrados para
   Storage com controle de acesso.
7. Treinamento realizado nas três trilhas, com lista de presença.
8. Documentação operacional entregue e aceita.

## 6.5 Obrigações do contratado

Manter a instância dedicada operante; executar e verificar backups; corrigir
defeitos sem custo adicional; manter a solução aderente à legislação aplicável;
comunicar incidente de segurança ao Instituto em até **24 horas** da ciência;
manter sigilo sobre os dados; não utilizar dado do Instituto para qualquer
finalidade alheia ao contrato.

## 6.6 Propriedade intelectual e portabilidade

Cláusula essencial, dada a natureza de produto da solução:

| Item | Titularidade |
|---|---|
| **Código-fonte do núcleo da plataforma** | Do **contratado**. A contratação confere ao Instituto licença de uso não exclusiva, durante a vigência |
| **Dados do Instituto** | Do **IDJUV**, integralmente e a qualquer tempo |
| **Parametrizações, modelos de ato e conteúdo institucional** | Do **IDJUV** |
| **Customizações específicas pagas pelo Instituto** | Licença perpétua e irrevogável de uso ao IDJUV |

O contratado obriga-se a, **ao término do contrato por qualquer motivo**,
entregar em até **30 dias**: dump completo do banco em formato aberto, conteúdo
integral do Storage, dicionário de dados e documentação de schema — sem cobrança
adicional e independentemente da causa da rescisão.

## 6.7 Proteção de dados

O Instituto é **controlador**; o contratado é **operador**, nos termos da LGPD.
Deve ser celebrado acordo de tratamento de dados prevendo finalidade, hipótese
legal, medidas de segurança, suboperadores autorizados (provedores de nuvem
identificados na Seção 3.4), prazo de eliminação e obrigação de auxílio ao
controlador no atendimento aos titulares e à ANPD.

## 6.8 Fiscalização

Designação de **fiscal técnico** (servidor de TI ou com conhecimento do sistema),
**fiscal administrativo** e **gestor do contrato**, com atribuições distintas de
atesto técnico e de conformidade contratual.

---

# 7 — Justificativa do parcelamento e da solução escolhida

## 7.1 Parcelamento do objeto

O objeto **não é parcelável em contratos distintos**, com fundamento no art. 40,
§3º, da Lei nº 14.133/2021: a infraestrutura, o licenciamento e a sustentação são
tecnicamente indissociáveis. Contratar a hospedagem de um fornecedor e a
manutenção de outro, sobre plataforma cuja autorização é imposta pelo banco de
dados (RLS), produziria diluição de responsabilidade em caso de incidente de
segurança ou perda de dado — exatamente o risco que a contratação pretende
eliminar.

O que se parcela é o **pagamento**, em duas parcelas de naturezas distintas
(Seção 5.1), o que preserva a fiscalização sem fracionar o objeto.

## 7.2 Alternativas consideradas

| Alternativa | Avaliação |
|---|---|
| **Desenvolvimento de sistema próprio** | 736 arquivos, ~225 mil linhas de código, 231 tabelas e regras fiscais já validadas (CNAB, eSocial). Reconstruir demandaria equipe dedicada por prazo superior a 24 meses, com custo de ordem de grandeza superior e risco de descontinuidade da operação corrente |
| **ERP público de mercado** | Atende núcleo administrativo, mas não cobre a vertical de esporte e juventude (programas, federações, árbitros, gestores escolares, seletivas), que exigiria customização de custo elevado. Nenhum oferece o inventário móvel offline já em uso |
| **Solução gratuita ou de governo** | Não há solução que cubra simultaneamente folha com eSocial, ciclo orçamentário, patrimônio móvel, transparência e a vertical finalística |
| **Manter a operação sem contrato** | Situação atual. Inviável: sem SLA exigível, sem responsável formal por backup e sem obrigação de atualização legal — risco jurídico e operacional inaceitável para base de RH e folha |
| **Contratar licença + sustentação em instância dedicada** | **Alternativa escolhida.** Preserva o investimento e a operação existentes, formaliza responsabilidades, mantém o dado em banco exclusivo do Instituto e garante portabilidade na saída |

## 7.3 Contratações correlatas

Não há contratação vigente com objeto sobreposto. Recomenda-se verificar a
existência de contrato de conectividade e de licenças de escritório, cujos
objetos são distintos e complementares.

---

# 8 — Resultados pretendidos e riscos

## 8.1 Resultados esperados

| Dimensão | Resultado |
|---|---|
| **Continuidade** | Operação de folha, orçamento e patrimônio com disponibilidade contratualmente exigível |
| **Conformidade** | Cumprimento tempestivo de LAI, LGPD, eSocial e Lei nº 14.133/2021 |
| **Segurança do dado** | Backup off-site verificado e **restauração testada trimestralmente** — hoje inexistente como obrigação |
| **Redução de dependência** | Documentação operacional e treinamento de administradores internos |
| **Transparência** | Portal público mantido e atualizado, com dado pessoal filtrado na origem |
| **Previsibilidade orçamentária** | Custo de TI conhecido e estável, substituindo despesa não formalizada |

## 8.2 Riscos e mitigações

| Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|
| Perda de dado por falha de backup | Baixa | **Crítico** | Projeto secundário independente + teste de restauração trimestral com glosa (Seção 6.3) |
| Vazamento de dado pessoal por falha de política RLS | Média | **Crítico** | Item 11 da Parcela B inclui revisão de RLS e execução de advisors; auditoria de views no aceite |
| Dependência de fornecedor único | **Alta** | Alto | Cláusula de portabilidade em 30 dias (Seção 6.6) + documentação e treinamento obrigatórios na Parcela A |
| Descontinuidade da plataforma de backend (Supabase) | Baixa | Alto | Postgres padrão, migrações versionadas e dump aberto permitem migração para outro provedor |
| Ausência de testes automatizados permitir regressão | **Alta** | Médio | Ambiente de homologação obrigatório; meta de cobertura de testes como evolutiva do segundo ano |
| Commit automático da ferramenta de desenvolvimento assistido reintroduzir erro corrigido | Média | Médio | Verificação automatizada no pipeline e revisão de alterações antes da promoção a produção |
| Mudança de leiaute fiscal (eSocial/CNAB) sem adequação tempestiva | Média | Alto | Item 10 da Parcela B dedica 24h/mês a manutenção adaptativa legal |
| Reajuste cambial da infraestrutura | **Alta** | Baixo | Componente cambial isolado na Seção B.1 (5,7% do valor mensal), com repactuação anual |

---

# 9 — Posicionamento conclusivo

A contratação é **viável e recomendada**.

A solução avaliada não é hipótese de projeto: é plataforma **em produção no
Instituto**, com 17 módulos, 241 telas, 231 tabelas e regras fiscais de folha,
eSocial e CNAB já validadas na operação real. O risco de implantação — habitual
nesta classe de contratação — encontra-se, neste caso, substancialmente reduzido.

O que hoje falta ao IDJUV não é sistema, é **instrumento contratual**. A operação
corrente carece de nível de serviço exigível, de responsável formal por backup e
recuperação, de obrigação de atualização legal e de garantia de portabilidade do
dado público. São exatamente essas lacunas que a presente contratação fecha.

Recomenda-se:

1. **Levantamento prévio** dos itens de implantação já executados, para ajuste da
   Parcela A ao cenário de regularização (Seção 5.2.3);
2. **Pesquisa de preços formal** nos termos do art. 23 da Lei nº 14.133/2021,
   tomando as estimativas da Seção 5 como referência de instrução;
3. **Inclusão inegociável** das cláusulas de portabilidade de dados (6.6), de
   proteção de dados pessoais (6.7) e de teste periódico de restauração de
   backup (6.3) — as três protegem o Instituto precisamente na hipótese em que a
   relação contratual se encerre de forma não amigável;
4. **Priorização**, na execução da Parcela A, dos itens de treinamento e
   documentação, cuja ausência constitui hoje o principal risco de dependência
   técnica do fornecedor.

---

## Anexo I — Rastreabilidade das informações técnicas

Toda afirmação técnica deste documento é verificável no repositório:

| Afirmação | Fonte |
|---|---|
| 17 módulos e seus códigos | `src/shared/config/modules.config.ts` |
| 241 telas / 239 rotas | `src/pages/**/*.tsx` · `src/App.tsx` |
| 736 arquivos, ~224.700 linhas | `src/**/*.{ts,tsx}` |
| 265 componentes · 61 hooks · 38 geradores de PDF | `src/components/` · `src/hooks/` · `src/lib/pdf*.ts` |
| 231 tabelas · 15 views · 47 RPC | `DOCUMENTACAO_TECNICA.md` §1.3 · `docs/BANCO_DE_DADOS.md` |
| 246 migrações · 8 Edge Functions | `supabase/migrations/` · `supabase/functions/` |
| Versões exatas da stack | `package.json` |
| Hospedagem e rewrite SPA | `vercel.json` · `vite.config.ts` |
| Modelo de tenancy e isolamento | `docs/WHITE_LABEL.md` §1 · `docs/MIGRACAO_SUPABASE_PROPRIO.md` |
| Detalhamento funcional dos módulos | `docs/MODULOS.md` |
| Modelo de permissões e RLS | `docs/RBAC_PERMISSOES.md` · `docs/AUDITORIA_USUARIOS.md` |
| Backup, DR e descoberta automática de tabelas | `docs/BACKUP_CONTINGENCIA.md` |
| Acoplamento de marca e limitações declaradas | `DOCUMENTACAO_TECNICA.md` Parte 2 · `docs/INVENTARIO_HARDCODE.md` |

## Anexo II — Documentos de referência

| Documento | Conteúdo |
|---|---|
| [`DOCUMENTACAO_TECNICA.md`](./DOCUMENTACAO_TECNICA.md) | Arquitetura, stack, fluxos e diagnóstico de acoplamento |
| [`docs/WHITE_LABEL.md`](./docs/WHITE_LABEL.md) | Arquitetura-alvo de produto, tenancy e roadmap |
| [`docs/ARQUITETURA.md`](./docs/ARQUITETURA.md) | Arquitetura em detalhe |
| [`docs/MODULOS.md`](./docs/MODULOS.md) | Detalhamento funcional dos 17 módulos |
| [`docs/BANCO_DE_DADOS.md`](./docs/BANCO_DE_DADOS.md) | Tabelas, views e funções |
| [`docs/RBAC_PERMISSOES.md`](./docs/RBAC_PERMISSOES.md) | Modelo de permissões |
| [`docs/EDGE_FUNCTIONS.md`](./docs/EDGE_FUNCTIONS.md) | Funções serverless |
| [`docs/BACKUP_CONTINGENCIA.md`](./docs/BACKUP_CONTINGENCIA.md) | Backup, contingência e recuperação |
| [`docs/MIGRACAO_SUPABASE_PROPRIO.md`](./docs/MIGRACAO_SUPABASE_PROPRIO.md) | Provisionamento de instância dedicada |
