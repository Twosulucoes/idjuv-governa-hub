# Análise do módulo de RH e proposta de estruturação

Data: 2026-10-01 · Tipo: spike (análise, nenhuma alteração de código) · Autor: Claude Code

## 0. Como ler e o que NÃO foi verificado

- **Código e migrations:** lidos por agentes de exploração (somente leitura). Números de linhas e contagens são do repositório em `main`.
- **Banco real: NÃO verificado.** O projeto Supabase do IDJUV (`qvbhejhcktcaftiamksd`, do `.env`) não está conectado ao MCP desta sessão. Todo o estado de RLS abaixo é **deduzido lendo as migrations em ordem cronológica** e pode divergir da produção. Primeiro passo recomendado: rodar a seção 0 de `docs/RLS_USUARIOS_PROPOSTA.sql` (consulta `pg_policies`) e o advisor de segurança no projeto real.
- **Mercado:** pesquisa web curta (8 buscas). Fontes oficiais do setor público brasileiro (SIGEPE/SIAPE, eSocial) e artigos de fornecedores. Não avaliei produtos fechados por demonstração. O que vai além das fontes está marcado como *julgamento de engenharia*.

## 1. Resumo executivo

O RH do IDJUV é **largo, mas raso e inseguro**: cobre cadastro, lotação, designações, portarias, férias, licenças, frequência, folha, CNAB, contracheque e relatórios, porém:

1. **Segurança de dados é o problema nº 1.** Uma migration de 2026-02-20 (`20260220132907`) apagou todas as policies de `public` e recriou "acesso total" para qualquer usuário autenticado; funções `has_role`/`has_module` ficaram permissivas. Folha, fichas financeiras, CPF/dados bancários, licenças com CID/CRM e consignações ficam legíveis/graváveis por qualquer logado (*conforme as migrations*).
2. **Não há trilha de auditoria em nenhuma tabela de RH** e `servidores` não guarda histórico (cargo, unidade, remuneração são sobrescritos).
3. **A folha real roda numa RPC SQL** (`processar_folha_pagamento`, sem `search_path` fixo e sem checagem de permissão vista); ~2.100 linhas de motor TypeScript estão **mortas**, e a doc (`RELATORIO_FINAL_SISTEMA_RH.md`) descreve o contrário.
4. **Faltam os subdomínios que definem um RH público:** progressão/carreira, estágio probatório, avaliação de desempenho, estagiários, concursos, RPPS/aposentadoria, capacitação, saúde ocupacional e eSocial transmissível.
5. **Dívida estrutural no front:** 3 vocabulários de permissão, rotas de `ROUTE_PERMISSIONS` que não batem com as rotas reais, duplicações (portarias ×3, hooks de frequência ×2, menus ×2), hooks/libs mortos, regra de negócio dentro de páginas.

## 2. Estado atual (números)

| Camada | Situação |
|---|---|
| Páginas | 21 em `pages/rh` (12.800 linhas) + ~14 em folha, cargos, currículo, governança, processos, dashboard |
| Componentes | ~90 (rh 31, folha 17, frequência 12, portarias 17, cargos 3) |
| Hooks | 18 de RH, **4 mortos** (`useMotorFolha`, `useFolhaCalculos`, `useRHIntegracoes`, `useConfigVidaFuncional` — 1.418 linhas) |
| Lib | 30 arquivos (cálculo, CNAB, eSocial, PDF); `folhaCalculoService` + `folhaCalculos` + `pdfMemorandoLotacao` mortos |
| Banco | ~70 tabelas/views de RH, ~30 enums; `servidores` é a tabela central (≈80 colunas, dados bancários embutidos) |
| Testes | **Nenhum** (`*.test.*` não existe) |
| Edge Functions | Nenhuma de RH além de `download-frequencia` e `backup-offsite` |
| Docs de RH | 6 em `.lovable/`, todas de fev/2026, com planos 100% não marcados como feitos |

### O que funciona de fato (em uso)
Cadastro de servidores, vínculos múltiplos (`vinculos_servidor`), lotação com encerramento automático do anterior, designações, portarias (numeração por RPC), férias/licenças (CRUD), motor de frequência parametrizado (`frequenciaCalculoService`), fechamento de folha com máquina de estados e hash (`fechar_folha`/`reabrir_folha`), remessa CNAB240, geração de XML eSocial no front, contracheque em PDF.

## 3. Achados

### 3.1 Segurança e LGPD (prioridade máxima)

| # | Achado | Evidência |
|---|---|---|
| S1 | Policies `acesso_total_*` com `auth.uid() IS NOT NULL` em folha, fichas, consignações, pensões, dependentes IRRF, eventos eSocial, férias, licenças (CID/CRM), ponto, histórico funcional, provimentos, viagens | `20260220132907`, `20260220133436`, `20260220134040` |
| S2 | `has_role(app_role)`, `has_module(app_module)`, `usuario_eh_super_admin()`, `is_admin_user()` (versões antigas) retornam `auth.uid() IS NOT NULL` | `20260220132320`; admitido no cabeçalho de `20260916120000_permissoes_granulares.sql` |
| S3 | RLS "por módulo RH" cobre só 5 tabelas (`servidores`, `lotacoes`, `cargos`, `adicionais_tempo_servico`, `banco_horas`) e não filtra por unidade nem mascara CPF/banco/remuneração | `20260220211817` |
| S4 | `processar_folha_pagamento` é `SECURITY DEFINER` **sem `search_path`** e sem checagem de permissão vista | `20260112190917`, `20260112213305` |
| S5 | Edge Function `download-frequencia` usa service role e exige só login (sem papel RH) | `supabase/functions/download-frequencia/index.ts` |
| S6 | Storage `documentos-requerimento`: qualquer autenticado lê/grava/apaga | `20260216171714` |
| S7 | `pre_cadastros`: políticas abertas históricas; incerto se o formulário público (`anon`) funciona hoje | `20260113155351`, `20260220132907` — **confirmar no banco** |
| S8 | Sem trigger de auditoria em RH; `audit_logs` só é alimentada por triggers de licitações/contratos/orçamento; `created_by/updated_by` preenchidos pelo cliente | migrations |
| S9 | Sem soft delete; `DELETE` físico em `servidores` e `ON DELETE CASCADE` em `vinculos_servidor` | `servidores_delete`, `20260310135826` |
| S10 | Dados sensíveis em claro, sem mascaramento, sem log de leitura/exportação | CID/CRM, CPF, bancário, PIX, CPF de dependentes |
| S11 | `docs/BANCO_DE_DADOS.md:169` afirma "a RLS é a fronteira" — não se sustenta para a folha | doc vs. migrations |

### 3.2 Modelo de dados

- `servidores` mistura identidade, contato, banco, vínculo atual, cargo/unidade atuais (desnormalizados) e remuneração; **não é versionada**.
- Três modelos de vínculo coexistem: `vinculos_funcionais` (antigo), `vinculos_servidor` (novo) e `provimentos`.
- Histórico por linha (`data_inicio/data_fim/ativo`) em lotações, vínculos, provimentos e designações; `historico_funcional` é alimentado **manualmente pelo app**. Só rubricas (`rubricas_historico`) e status de folha (`folha_historico_status`) têm versionamento real.
- Dependentes: jsonb em `servidores` + `dependentes_irrf`; sem tabela geral. Banco do servidor: embutido e copiado nas fichas, sem histórico.
- Contracheque: não é entidade (é `fichas_financeiras` + PDF).
- `eventos_esocial` só armazena; **não há geração/assinatura/envio no servidor**.
- Tipo de dado usado como filtro de negócio no código (`REGRAS_TIPO_SERVIDOR`, enums e labels hardcoded em `types/servidor.ts`/`rh.ts`) ainda não migrou para as tabelas `config_*` já criadas.

### 3.3 Front-end e organização

- **Permissões:** o menu usa `rh.visualizar|tramitar|aprovar|self`; as rotas usam `rh.servidores.visualizar` etc.; a folha usa `financeiro.folha.*`; as docs citam `rh.admin` (inexistente no front). `ROUTE_PERMISSIONS` tem `/rh/servidor/:id` e `/rh/exportacao`, mas as rotas reais são `/rh/servidores/:id` e `/rh/exportar` (a regra não casa).
- Rotas só com `ProtectedRoute` sem permissão: todas as `/folha/*`, `/rh/servidores/:id/editar`, formulários de viagem.
- **Órfãos/mortos:** `AtribuicaoPortariasPage` (795), `NovaPortariaUnificada` (656), `AtosAdministrativosSection`, hooks e libs listados na seção 2; menu `Meus Dados` → rota `/rh/meus-dados` inexistente (404).
- **Duplicações:** portarias em 3 páginas e 3 formulários; `useConfigFrequencia` (576) × `useParametrizacoesFrequencia` (874) sobre as mesmas 6 tabelas; 2 motores de folha TS + RPC; `menu.config.ts` × `module-menus.config.ts`; `/lotacoes` × `/rh/gestao-lotacao`; 2 diagnósticos de pendências; 2 aniversariantes; formulários de viagem em dois lugares com conteúdo divergente.
- **Regra de negócio em página:** `RelatoriosRHPage` (1.243 linhas, 15 queries), `GestaoCargosPage`, `GestaoViagensPage` (cálculo de diárias na página), CRUD sem hook em férias/licenças/viagens/cargos; CNAB/eSocial montados dentro de diálogos.
- Arquivos > 700 linhas: 18 em RH (`ServidorFormPage` 1.601 é o maior).
- Planos em `.lovable/` (PLANO_CONSOLIDACAO_RH etc.) estão sem status; `periodos_aquisitivos`/`programacao_ferias` existem sem UI.

## 4. Referência de mercado

### 4.1 O que as fontes dizem

- **Governo federal (SIAPE/SIGEPE):** o SIAPE cobre *Cadastro, Folha, Provisão da Força de Trabalho, Legislação de Pessoal e Saúde*; o SIGEPE adiciona *Qualidade de Vida, Evolução Funcional, Compensação de RH e Seguridade Social* e cobre o ciclo completo: criação de cargos, seleção, ingresso, gestão funcional (férias, movimentação, progressão), benefícios e aposentadoria/folha. Tem módulo **Requerimento** (autoatendimento: dependentes, dados bancários, auxílios) e módulo de **Ocorrências**. ([Serpro – novo sistema](https://serpro.gov.br/menu/noticias/noticias-antigas/governo-federal-desenvolve-novo-sistema-para-gestao-de-pessoas), [Módulo Requerimento](https://serpro.gov.br/menu/noticias/noticias-2017/sigepe-lanca-o-modulo-requerimento), [Manual SIGEPE Ocorrência](https://www.gov.br/servidor/pt-br/acesso-a-informacao/gestao-de-pessoas/manual-de-procedimentos/manual-sigepe-ocorrencia-26-07.pdf))
- **eSocial para órgãos públicos:** S-2200/S-2300 (cadastro) são pré-requisito para remuneração; **S-1202** é obrigatório para servidores de RPPS e **S-1207** para benefícios do RPPS; **S-1299** fecha os eventos periódicos; desde o período 01/2025 os eventos S-1200, S-1202, S-1207, S-1210, S-2500 e S-2501 usam o leiaute **S-1.3**. ([Senior – S-1202](https://documentacao.senior.com.br/gestao-de-pessoas-hcm/esocial/leiautes/periodicos/s-1202.htm), [TCE-MT – eSocial órgãos públicos](https://www.tce.mt.gov.br/conteudo/download/esocial-para-orgaos-publicos-censo-e-qualificacao-cadastral/77843), [Convenia – folha e eSocial](https://blog.convenia.com/folha-de-pagamento-e-esocial/))
- **HRIS (padrão de mercado):** o Core HR é a *fonte única da verdade*; objetos **date-effective** permitem histórico e transações futuras (ex.: promoção com vigência em março); **position management** e múltiplas atribuições por pessoa; auditorias periódicas de dados. ([Oracle Core HR](https://unogeeks.com/oracle-fusion-hcm-core-hr-implementation-guide/), [SAP Employee Central](https://learning.sap.com/courses/sap-successfactors-employee-central-core-academy-ko/using-special-hr-transactions-for-hires-and-terminations_e8c3ec4e-0435-4920-89ce-29ded46e87bf), [Bindbee – HRIS](https://bindbee.dev/blog/hris-full-form))
- **LGPD em RH:** mapear dados pessoais; criptografia; controle de acesso por necessidade; MFA; **log de acesso** com quem/o quê/quando/de onde/ação (leitura, exportação, edição, exclusão), retenção sugerida de 6–12 meses para logs operacionais. ([Senior – LGPD no DP](https://www.senior.com.br/blog/lgpd-no-departamento-pessoal), [Confidata – acesso granular](https://confidata.com.br/blog/controles-acesso-granulares-dados))

### 4.2 Comparação com o IDJUV

| Capacidade de mercado | IDJUV hoje |
|---|---|
| Registro central único, date-effective | Parcial (por linha em vínculos/lotações; `servidores` sobrescreve) |
| Position management (quadro de vagas por cargo/unidade) | Ausente (só `cargos.quantidade_vagas`) |
| Evolução funcional (progressão/promoção, interstício, PCCS) | Ausente |
| Estágio probatório e avaliação de desempenho | Ausente |
| Autoatendimento do servidor (requerimentos, dados, contracheque) | Contracheque sim; requerimentos/dados não (`/rh/meus-dados` quebrado) |
| Folha com rubricas versionadas e fechamento imutável | **Bom** (fechamento com hash; rubricas versionadas) |
| eSocial S-2200/S-1202/S-1207/S-1299 em S-1.3 | Gerador XML no front, sem envio/assinatura/recibo no servidor; cobertura de eventos não verificada |
| Aposentadoria/seguridade (RPPS) | Ausente |
| Saúde ocupacional / qualidade de vida | Ausente |
| Trilha de auditoria + RBAC granular + LGPD | **Fraco** (ver 3.1) |

## 5. Arquitetura-alvo proposta (*julgamento de engenharia*, ancorada nas fontes acima)

### 5.1 Princípios
1. **Segurança antes de funcionalidade:** nada novo de RH entra sem RLS granular e auditoria.
2. **Uma fonte da verdade, com vigência:** identidade ≠ vínculo ≠ posição ≠ remuneração, cada um com `vigencia_inicio/fim`.
3. **Regra de negócio no domínio (hook/serviço/RPC), nunca na página.**
4. **Parametrização por tabela (`config_*`), não por enum/constante no código.**
5. **Um dono por assunto**, sem duplicatas de página/hook/menu.

### 5.2 Domínios (bounded contexts) de RH

| Domínio | Conteúdo | Estado |
|---|---|---|
| **Cadastro** | pessoa/servidor, documentos, dependentes, contas bancárias (histórico) | refatorar |
| **Estrutura e quadro** | cargos, carreiras/níveis, unidades, **quadro de vagas** (position management) | parcial |
| **Vida funcional** | provimento, vínculo, lotação, designação, cessão, portarias/atos, histórico automático | consolidar |
| **Evolução funcional** | progressão, promoção, estágio probatório, avaliação | novo |
| **Tempo e afastamentos** | frequência, férias (com períodos aquisitivos), licenças, banco de horas | UI faltando |
| **Folha e pagamentos** | rubricas, cálculo, fechamento, consignações, pensões, CNAB | manter e blindar |
| **Obrigações (eSocial/TCE)** | geração, validação, assinatura, envio, recibos, S-1299 | novo no servidor |
| **Seguridade** | RPPS, aposentadoria, pensão, tempo de contribuição | novo (se aplicável ao órgão) |
| **Autoatendimento** | meus dados, contracheque, requerimentos | ampliar |
| **Saúde e desenvolvimento** | ASO/perícia, capacitação | novo (fase final) |

### 5.3 Modelo de dados-alvo (resumo)
- `pessoas`/`servidores` só com identidade e contato; `servidor_contas_bancarias` (histórico), `servidor_dependentes`.
- Dados de vínculo/cargo/unidade atuais **derivados por view** a partir das tabelas com vigência (eliminar desnormalização `cargo_atual_id`/`unidade_atual_id`).
- Triggers que alimentam `historico_funcional` automaticamente em mudança de cargo/unidade/situação/remuneração.
- `audit_logs` ligada por trigger genérico a todas as tabelas sensíveis de RH; log de leitura/exportação para CPF, banco, CID e folha via RPC/Edge Function.
- Soft delete (`deleted_at`) + remoção do `ON DELETE CASCADE` sobre histórico.
- Tabelas novas: `carreiras`, `niveis_carreira`, `tabela_salarial_vigencia`, `progressoes`, `estagio_probatorio`, `avaliacoes_desempenho`, `quadro_vagas`, `periodos_aquisitivos` (já existe, ligar à UI), `esocial_lotes/recibos`.

### 5.4 RBAC alvo
Um único vocabulário `rh.<recurso>.<ação>` (`visualizar|criar|editar|excluir|aprovar|exportar`), checado **na policy/RPC** via `has_permission_code` e espelhado em `ROUTE_PERMISSIONS`. Escopo por **unidade** para chefias; autoacesso do servidor ao próprio registro; folha e dados sensíveis com permissões separadas (`rh.folha.*`, `rh.dados_sensiveis.visualizar`).

## 6. Roadmap proposto

| Fase | Objetivo | Entregas | Risco |
|---|---|---|---|
| **0 — Verificar (1–2 dias)** | Saber o estado real | Conectar o projeto real ao MCP ou rodar `pg_policies` + advisors; confirmar S1–S7 | baixo |
| **1 — Estancar (P0)** | Fechar o acesso aberto | Migração de RLS granular nas tabelas de RH/folha/storage; corrigir `has_role` e `processar_folha_pagamento` (`search_path` + permissão); `download-frequencia` com checagem de papel; trigger de auditoria em tabelas sensíveis. Usar skill `migracao-segura-idjuv` e `revisor-seguranca-idjuv` | **alto** (pode bloquear usuários; testar com papéis reais) |
| **2 — Higiene** | Reduzir dívida | Remover mortos (≈2.100 linhas de motor + órfãos); unificar vocabulário de permissões e corrigir `ROUTE_PERMISSIONS`; consertar `/rh/meus-dados`; unificar portarias e hooks de frequência; proteger `/folha/*` com permissão | médio |
| **3 — Fundação de dados** | Registro único com vigência | Consolidar vínculos; histórico automático; contas bancárias e dependentes em tabelas; soft delete; migrar enums/`REGRAS_TIPO_SERVIDOR` para `config_*` | alto |
| **4 — Valor ao servidor** | Autoatendimento e férias | Meus dados, requerimentos (estilo SIGEPE Requerimento), períodos aquisitivos/programação de férias | médio |
| **5 — Evolução funcional** | Carreira | Carreiras/níveis/PCCS, progressão, estágio probatório, avaliação | médio (depende do plano de cargos do IDJUV) |
| **6 — Obrigações** | eSocial/TCE no servidor | Edge Function de geração/validação/envio, S-1.3, S-1299, recibos; revisar a view `v_relatorio_tce_pessoal` | alto (certificado digital, homologação) |
| **7 — Seguridade e saúde** | Completar o ciclo | RPPS/aposentadoria (se o órgão tiver), saúde ocupacional, capacitação | médio |
| **Contínuo** | Qualidade | Introduzir testes (vitest) ao menos para folha/frequência/permissões; reduzir baseline do `scripts/gate.sh` | — |

Cada fase passa pelo fluxo `/superpowers` (spec → plano → execução com `dev-banco-supabase`/`dev-frontend-idjuv` → `revisor-seguranca-idjuv` → docs).

## 7. Decisões que dependem de vocês

1. **O IDJUV tem RPPS próprio ou os servidores estão no RGPS/ente estadual?** Define se as fases 6–7 incluem S-1202/S-1207 e aposentadoria.
2. **Existe plano de cargos e carreira (PCCS) em lei?** Sem ele, a fase 5 não tem regra a modelar.
3. **A fase 1 pode ser aplicada primeiro, mesmo exigindo ajuste de acessos?** (recomendado: sim)
4. **Conectar o projeto Supabase do IDJUV ao MCP** para verificar o estado real antes de qualquer migração.
5. **O eSocial já é transmitido por outro sistema?** Evita retrabalho na fase 6.
6. **Folha TypeScript morta: remover?** (recomendado: sim, a RPC é a fonte real; manter só se houver plano de portar o cálculo para o front/Edge.)

## 8. Limitações
- RLS e funções: deduzidas de migrations, não do banco ativo.
- Cobertura real de eventos eSocial no gerador do front: não auditada evento a evento.
- Pesquisa de mercado limitada a fontes públicas; não comparei fornecedores comerciais por funcionalidades nem preço.
- Contagens de queries por página são piso (greps `.from("x")` na mesma linha).
