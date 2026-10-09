# PLANO DE CONSOLIDAÇÃO DO MÓDULO DE RH
## Instituto de Desporto, Juventude e Lazer - IDJUV
### Data: 02/02/2026 | Versão 1.0

---

> **Princípio Arquitetural:** "Máxima parametrização via banco de dados, mínima regra fixa em código."

---

## 1️⃣ MAPA DE REAPROVEITAMENTO

### 1.1 Cadastro e Vida Funcional do Servidor

| Componente | Status | Decisão | Justificativa |
|------------|--------|---------|---------------|
| **Tabela `servidores`** | ✅ 82 registros | **REUTILIZAR** | Estrutura completa com ~70 campos, inclui dados pessoais, documentos, foto, contato |
| **Tabela `provimentos`** | ✅ 82 registros | **REUTILIZAR** | Vínculo servidor-cargo com datas de nomeação/posse/exercício |
| **Tabela `pre_cadastros`** | ✅ Funcional | **REUTILIZAR** | Fluxo de pré-cadastro externo com código de acesso |
| **Função `fn_atualizar_situacao_servidor()`** | ✅ Ativa | **REUTILIZAR** | Trigger que mantém situação funcional consistente |
| **View `v_servidores_situacao`** | ✅ Funcional | **REUTILIZAR** | Consulta otimizada com JOIN de provimento + lotação + cessão |
| **Geração automática de matrícula** | ✅ Funcional | **REUTILIZAR** | Trigger `fn_gerar_matricula()` |
| **Tabela `dependentes_irrf`** | ✅ Criada | **REUTILIZAR** | Estrutura para dedução de IRRF com vigência |
| **Função `count_dependentes_irrf()`** | ✅ Funcional | **REUTILIZAR** | Contagem de dependentes válidos por data |
| **Campo `tipo_servidor` em servidores** | ⚠️ Existe | **REFATORAR** | Atualmente enum fixo, migrar para FK em tabela de parâmetros |
| **Campo `situacao` em servidores** | ⚠️ Hardcoded | **REFATORAR** | Valores fixos em código, migrar para `config_situacoes_funcionais` |
| **Validações de CPF/RG** | ⚠️ Frontend | **INTEGRAR** | Centralizar em função SQL para validação server-side |
| **Histórico de alterações** | ❌ Inexiste | **COMPLEMENTAR** | Criar `historico_servidor` com trigger de auditoria |

### 1.2 Lotação, Cargos, Vínculos e Unidades

| Componente | Status | Decisão | Justificativa |
|------------|--------|---------|---------------|
| **Tabela `estrutura_organizacional`** | ✅ 43 unidades | **REUTILIZAR** | Hierarquia completa com `parent_id` |
| **Tabela `cargos`** | ✅ 16 cargos | **REUTILIZAR** | Cargos com símbolos, níveis, vencimentos |
| **Tabela `composicao_cargos`** | ✅ 50 registros | **REUTILIZAR** | Quantidade de vagas por cargo/unidade |
| **Tabela `lotacoes`** | ✅ Estrutura | **REUTILIZAR** | Histórico de lotações com data início/fim |
| **Tabela `designacoes`** | ✅ Estrutura | **REUTILIZAR** | Designações para funções gratificadas |
| **Tabela `cessoes`** | ✅ Estrutura | **REUTILIZAR** | Cessões entrada/saída com ônus |
| **Tabela `unidades_locais`** | ✅ 32 unidades | **REUTILIZAR** | Locais físicos (ginásios, centros) |
| **Enum `tipo_servidor`** | ⚠️ Hardcoded | **REFATORAR** | Migrar para tabela `config_tipos_servidor` |
| **Enum `tipo_lotacao`** | ⚠️ Hardcoded | **REFATORAR** | Migrar para tabela `config_tipos_lotacao` |
| **Labels em `src/types/servidor.ts`** | ⚠️ Hardcoded | **REFATORAR** | Migrar para banco, consumir via hook |
| **Regras de negócio `REGRAS_TIPO_SERVIDOR`** | ⚠️ Hardcoded | **REFATORAR** | Migrar para tabela `config_regras_vinculo` |
| **Histórico de lotações** | ⚠️ Parcial | **INTEGRAR** | Tabela existe, falta trigger de versionamento |
| **Quadro de vagas em tempo real** | ❌ Inexiste | **COMPLEMENTAR** | View `v_quadro_vagas` com cálculo de ocupação |

### 1.3 Frequência, Férias e Afastamentos

| Componente | Status | Decisão | Justificativa |
|------------|--------|---------|---------------|
| **Tabela `frequencia_mensal`** | ✅ 163 registros | **REUTILIZAR** | Lançamentos mensais por servidor |
| **Tabela `frequencia_lancamentos`** | ✅ Funcional | **REUTILIZAR** | Lançamentos diários detalhados |
| **Tabela `frequencia_arquivos`** | ✅ 247 arquivos | **REUTILIZAR** | PDFs gerados por competência |
| **Tabela `frequencia_pacotes`** | ✅ 3 pacotes | **REUTILIZAR** | Agrupamento para envio SEI |
| **Hook `useFrequencia.ts`** | ✅ Funcional | **REUTILIZAR** | CRUD completo de frequência |
| **Hook `useGerarFrequenciaPDF.ts`** | ✅ Funcional | **REUTILIZAR** | Geração de PDF mensal |
| **Tabela `ferias_servidor`** | ✅ Estrutura | **REUTILIZAR** | Estrutura completa com parcelamento |
| **Tabela `licencas_afastamentos`** | ✅ Estrutura | **REUTILIZAR** | Tipos de licença com documentação |
| **Tabela `banco_horas`** | ✅ Estrutura | **REUTILIZAR** | Compensação de horas |
| **Configuração de jornada** | ⚠️ Hardcoded | **REFATORAR** | Valores 6h/8h fixos em `pdfFrequenciaMensalGenerator.ts` |
| **Tipos de abono** | ⚠️ Hardcoded | **REFATORAR** | Migrar para tabela `config_tipos_abono` |
| **Calendário de feriados** | ⚠️ Parcial | **INTEGRAR** | Existe estrutura em `config_dias_nao_uteis`, conectar ao cálculo |
| **Regras de compensação** | ⚠️ Hardcoded | **REFATORAR** | Migrar para `config_regras_compensacao` |
| **Período aquisitivo de férias** | ❌ Inexiste | **COMPLEMENTAR** | Criar `periodos_aquisitivos` com cálculo automático |
| **Escala de férias** | ❌ Inexiste | **COMPLEMENTAR** | Criar `programacao_ferias` para planejamento anual |

### 1.4 Folha de Pagamento

| Componente | Status | Decisão | Justificativa |
|------------|--------|---------|---------------|
| **Tabela `folhas_pagamento`** | ✅ 4 registros | **REUTILIZAR** | Competências mensais com status |
| **Tabela `fichas_financeiras`** | ✅ 82 registros | **REUTILIZAR** | Ficha por servidor/competência |
| **Tabela `rubricas`** | ✅ 14 rubricas | **REUTILIZAR** | Proventos e descontos configurados |
| **Tabela `tabela_inss`** | ✅ Estrutura | **REUTILIZAR** | Faixas progressivas com vigência |
| **Tabela `tabela_irrf`** | ✅ 5 faixas | **REUTILIZAR** | Faixas com parcela a deduzir |
| **Tabela `parametros_folha`** | ✅ 7 parâmetros | **REUTILIZAR** | Salário mínimo, teto INSS, etc. |
| **Tabela `consignacoes`** | ✅ Estrutura | **REUTILIZAR** | Empréstimos e consignações |
| **Tabela `bancos_cnab`** | ✅ Estrutura | **REUTILIZAR** | Bancos para remessa CNAB |
| **Tabela `contas_autarquia`** | ✅ Estrutura | **REUTILIZAR** | Contas bancárias da autarquia |
| **Tabela `remessas_bancarias`** | ✅ Estrutura | **REUTILIZAR** | Histórico de remessas |
| **Tabela `eventos_esocial`** | ✅ Estrutura | **REUTILIZAR** | Eventos para transmissão |
| **Função `calcular_inss_servidor()`** | ✅ Funcional | **REUTILIZAR** | Cálculo progressivo |
| **Função `calcular_irrf()`** | ✅ Funcional | **REUTILIZAR** | Cálculo com deduções |
| **Função `processar_folha_pagamento()`** | ✅ Funcional | **REUTILIZAR** | Processamento em lote |
| **Função `get_parametro_vigente()`** | ✅ Funcional | **REUTILIZAR** | Busca parâmetros por data |
| **Hook `useFolhaPagamento.ts`** | ✅ Funcional | **REUTILIZAR** | CRUD + processamento |
| **Cálculos em `folhaCalculos.ts`** | ⚠️ Hardcoded | **REFATORAR** | Fórmulas de cálculo fixas em código |
| **Geração CNAB em `cnabGenerator.ts`** | ⚠️ Hardcoded | **REFATORAR** | Layout de remessa fixo em código |
| **Tipos de rubrica** | ⚠️ Hardcoded | **REFATORAR** | Enum em TypeScript, migrar para `config_tipos_rubrica` |
| **Regras de incidência** | ❌ Parcial | **COMPLEMENTAR** | Criar `config_incidencias_rubrica` para flexibilidade |
| **Margem consignável** | ❌ Inexiste | **COMPLEMENTAR** | Adicionar cálculo automático com parâmetro |

---

## 2️⃣ ESTRATÉGIA DE PARAMETRIZAÇÃO

### 2.1 Parâmetros Institucionais

| Parâmetro | Localização Atual | Destino Proposto | Tipo |
|-----------|-------------------|------------------|------|
| Nome da instituição | Hardcoded em PDFs | `config_institucional.nome` | texto |
| CNPJ | Hardcoded em PDFs | `config_institucional.cnpj` | texto |
| Endereço | Hardcoded em PDFs | `config_institucional.endereco` | JSON |
| Responsável legal | Hardcoded em relatórios | `config_institucional.responsavel` | texto |
| Logo institucional | Storage | `config_institucional.logo_url` | URL |
| Calendário oficial | `config_dias_nao_uteis` | **MANTER** (já existe) | tabela |
| Expediente padrão | Hardcoded | `config_institucional.expediente` | JSON |
| Política de frequência | Hardcoded | `config_institucional.politica_frequencia` | JSON |

**Tabela Proposta: `config_institucional`**
```sql
CREATE TABLE public.config_institucional (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_instituicao varchar(20) UNIQUE NOT NULL, -- 'IDJUV'
  nome varchar(255) NOT NULL,
  nome_fantasia varchar(255),
  cnpj varchar(18) UNIQUE NOT NULL,
  natureza_juridica varchar(100),
  endereco jsonb, -- {logradouro, numero, bairro, cidade, uf, cep}
  contato jsonb, -- {telefone, email, site}
  responsavel_legal varchar(255),
  cpf_responsavel varchar(14),
  cargo_responsavel varchar(100),
  logo_url text,
  brasao_url text,
  expediente jsonb, -- {inicio: "08:00", fim: "14:00", dias: [1,2,3,4,5]}
  politicas jsonb, -- Políticas gerais parametrizadas
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 2.2 Parâmetros de RH (Tipos e Situações)

| Parâmetro | Localização Atual | Destino Proposto | Tipo |
|-----------|-------------------|------------------|------|
| Tipos de servidor | `types/servidor.ts` (enum) | `config_tipos_servidor` | tabela |
| Tipos de vínculo | `types/servidor.ts` (enum) | `config_tipos_vinculo` | tabela |
| Tipos de lotação | `types/servidor.ts` (enum) | `config_tipos_lotacao` | tabela |
| Situações funcionais | Hardcoded | `config_situacoes_funcionais` | tabela |
| Tipos de afastamento | Hardcoded | `config_tipos_afastamento` | tabela |
| Tipos de licença | Hardcoded | `config_tipos_licenca` | tabela |
| Motivos de desligamento | `types/servidor.ts` | `config_motivos_desligamento` | tabela |
| Tipos de ato (portaria/decreto) | `types/servidor.ts` | `config_tipos_ato` | tabela |
| Tipos de ônus de cessão | `types/servidor.ts` | `config_tipos_onus` | tabela |

**Tabela Proposta: `config_tipos_servidor`**
```sql
CREATE TABLE public.config_tipos_servidor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id uuid REFERENCES config_institucional(id),
  codigo varchar(50) UNIQUE NOT NULL, -- 'efetivo_idjuv', 'comissionado_idjuv'
  nome varchar(100) NOT NULL,
  descricao text,
  permite_cargo boolean DEFAULT true,
  tipos_cargo_permitidos text[], -- {'efetivo', 'comissionado'}
  permite_lotacao_interna boolean DEFAULT true,
  permite_lotacao_externa boolean DEFAULT false,
  requer_provimento boolean DEFAULT true,
  requer_orgao_origem boolean DEFAULT false,
  requer_orgao_destino boolean DEFAULT false,
  cor_badge varchar(50), -- classe CSS ou hex
  icone varchar(50), -- nome do ícone
  ordem integer DEFAULT 0,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

**Tabela Proposta: `config_situacoes_funcionais`**
```sql
CREATE TABLE public.config_situacoes_funcionais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id uuid REFERENCES config_institucional(id),
  codigo varchar(50) UNIQUE NOT NULL, -- 'ativo', 'cedido', 'licenca', 'ferias'
  nome varchar(100) NOT NULL,
  descricao text,
  cor varchar(50),
  impacta_folha boolean DEFAULT true,
  impacta_frequencia boolean DEFAULT true,
  permite_designacao boolean DEFAULT true,
  ordem integer DEFAULT 0,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

### 2.3 Parâmetros de Frequência

| Parâmetro | Localização Atual | Destino Proposto | Tipo |
|-----------|-------------------|------------------|------|
| Jornada padrão (6h/8h) | `pdfFrequenciaMensalGenerator.ts` | `config_jornadas` | tabela |
| Horários de expediente | Hardcoded | `config_jornadas.horarios` | JSON |
| Tipos de abono | Hardcoded em componentes | `config_tipos_abono` | tabela |
| Regras de compensação | Hardcoded | `config_regras_compensacao` | tabela |
| Prazo de fechamento | Hardcoded | `config_frequencia.prazo_fechamento` | JSON |
| Tolerância de atraso | Hardcoded | `config_frequencia.tolerancia_minutos` | número |
| Feriados/recessos | `config_dias_nao_uteis` | **MANTER** (já existe) | tabela |
| Regimes de trabalho | `config_regimes_frequencia` | **MANTER** (já existe) | tabela |

**Tabela Proposta: `config_jornadas`**
```sql
CREATE TABLE public.config_jornadas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id uuid REFERENCES config_institucional(id),
  codigo varchar(20) UNIQUE NOT NULL, -- '6H', '8H', '12H'
  nome varchar(100) NOT NULL, -- 'Jornada 6 horas'
  carga_horaria_diaria integer NOT NULL, -- em minutos: 360, 480
  carga_horaria_semanal integer NOT NULL, -- em minutos: 1800, 2400
  horario_entrada time,
  horario_saida time,
  intervalo_minutos integer DEFAULT 0,
  permite_banco_horas boolean DEFAULT false,
  limite_banco_horas_mensal integer, -- em minutos
  descricao text,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

**Tabela Proposta: `config_tipos_abono`**
```sql
CREATE TABLE public.config_tipos_abono (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id uuid REFERENCES config_institucional(id),
  codigo varchar(50) UNIQUE NOT NULL, -- 'ATESTADO_MEDICO', 'LICENCA_NOJO'
  nome varchar(100) NOT NULL,
  descricao text,
  requer_documento boolean DEFAULT true,
  quantidade_dias_max integer,
  deduz_ferias boolean DEFAULT false,
  deduz_folha boolean DEFAULT false,
  fundamentacao_legal text,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

### 2.4 Parâmetros de Folha de Pagamento

| Parâmetro | Localização Atual | Destino Proposto | Tipo |
|-----------|-------------------|------------------|------|
| Salário mínimo | `parametros_folha` | **MANTER** (já existe) | tabela |
| Teto INSS | `parametros_folha` | **MANTER** (já existe) | tabela |
| Dedução por dependente | `parametros_folha` | **MANTER** (já existe) | tabela |
| Faixas INSS | `tabela_inss` | **MANTER** (já existe) | tabela |
| Faixas IRRF | `tabela_irrf` | **MANTER** (já existe) | tabela |
| Tipos de rubrica | `types/folha.ts` (enum) | `config_tipos_rubrica` | tabela |
| Tipos de cálculo | `types/folha.ts` (enum) | `config_tipos_calculo` | tabela |
| Incidências por rubrica | Parcial em `rubricas` | `config_incidencias_rubrica` | tabela |
| Margem consignável % | Hardcoded | `parametros_folha.margem_consignavel` | parâmetro |
| Data de pagamento | Hardcoded | `config_folha.dia_pagamento` | parâmetro |
| Regras de arredondamento | Hardcoded | `config_folha.arredondamento` | JSON |

**Tabela Proposta: `config_tipos_rubrica`**
```sql
CREATE TABLE public.config_tipos_rubrica (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instituicao_id uuid REFERENCES config_institucional(id),
  codigo varchar(20) UNIQUE NOT NULL, -- 'provento', 'desconto', 'encargo'
  nome varchar(100) NOT NULL,
  natureza varchar(20) NOT NULL, -- 'credito', 'debito', 'informativo'
  cor varchar(50),
  ordem integer DEFAULT 0,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

**Tabela Proposta: `config_incidencias_rubrica`**
```sql
CREATE TABLE public.config_incidencias_rubrica (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rubrica_id uuid REFERENCES rubricas(id),
  tipo_incidencia varchar(50) NOT NULL, -- 'inss', 'irrf', 'fgts', 'ferias', '13o'
  incide boolean DEFAULT false,
  percentual_base numeric(5,2) DEFAULT 100, -- % da rubrica que serve de base
  vigencia_inicio date NOT NULL,
  vigencia_fim date,
  created_at timestamptz DEFAULT now()
);
```

---

## 3️⃣ ROADMAP DE CONSOLIDAÇÃO

### Fase 1: Consolidação e Integração (2-3 semanas)

**Objetivo:** Estabilizar o que já existe, corrigir vulnerabilidades, integrar componentes desconectados.

| # | Tarefa | Prioridade | Estimativa | Dependência |
|---|--------|------------|------------|-------------|
| 1.1 | Corrigir policies RLS das tabelas LAI | 🔴 Alta | 1h | - |
| 1.2 | Adicionar `search_path` nas 4 funções vulneráveis | 🔴 Alta | 30min | - |
| 1.3 | Corrigir policies permissivas de federações | 🔴 Alta | 30min | - |
| 1.4 | Criar policy para `debitos_tecnicos` | 🟡 Média | 15min | - |
| 1.5 | Integrar `config_dias_nao_uteis` ao cálculo de frequência | 🟡 Média | 4h | 1.1-1.4 |
| 1.6 | Criar view `v_quadro_vagas` (vagas × ocupação) | 🟡 Média | 2h | - |
| 1.7 | Ativar triggers de versionamento em `lotacoes` | 🟡 Média | 2h | - |
| 1.8 | Conectar `designacoes` ao fluxo de portarias | 🟡 Média | 4h | - |
| 1.9 | Revisar e documentar fluxo completo de vida funcional | 🟢 Baixa | 4h | 1.5-1.8 |
| 1.10 | Criar testes de RLS por perfil (smoke tests) | 🟢 Baixa | 4h | 1.1-1.4 |

**Entregáveis da Fase 1:**
- [ ] Sistema sem vulnerabilidades de segurança conhecidas
- [ ] Frequência integrada ao calendário oficial
- [ ] View de quadro de vagas funcionando
- [ ] Documentação de fluxos atualizada

---

### Fase 2: Parametrização e Desengessamento (3-4 semanas)

**Objetivo:** Migrar regras hardcoded para o banco, permitindo configuração via interface.

| # | Tarefa | Prioridade | Estimativa | Dependência |
|---|--------|------------|------------|-------------|
| 2.1 | Criar tabela `config_institucional` | 🔴 Alta | 1h | Fase 1 |
| 2.2 | Criar tabelas `config_tipos_*` (servidor, vínculo, lotação) | 🔴 Alta | 2h | 2.1 |
| 2.3 | Criar tabela `config_situacoes_funcionais` | 🔴 Alta | 1h | 2.2 |
| 2.4 | Migrar enums de `types/servidor.ts` para banco | 🔴 Alta | 4h | 2.2-2.3 |
| 2.5 | Criar tabela `config_jornadas` | 🟡 Média | 1h | 2.1 |
| 2.6 | Criar tabela `config_tipos_abono` | 🟡 Média | 1h | 2.1 |
| 2.7 | Refatorar `pdfFrequenciaMensalGenerator.ts` para consumir jornadas do banco | 🟡 Média | 4h | 2.5 |
| 2.8 | Criar hook `useConfigRH.ts` para consumir parâmetros | 🟡 Média | 2h | 2.2-2.6 |
| 2.9 | Criar tabela `config_incidencias_rubrica` | 🟡 Média | 1h | 2.1 |
| 2.10 | Refatorar `folhaCalculos.ts` para consumir incidências do banco | 🟡 Média | 6h | 2.9 |
| 2.11 | Criar interface de configuração de RH (admin) | 🟢 Baixa | 8h | 2.2-2.6 |
| 2.12 | Popular dados iniciais nas tabelas de config (seed) | 🟢 Baixa | 2h | 2.11 |

**Entregáveis da Fase 2:**
- [ ] Zero regras de negócio hardcoded em tipos de servidor/vínculo
- [ ] Jornadas configuráveis via banco
- [ ] Interface administrativa de configuração
- [ ] Sistema pronto para multi-institucional

---

### Fase 3: Evolução UX e Automações (4-6 semanas)

**Objetivo:** Melhorar experiência do usuário, adicionar automações inteligentes, preparar para eSocial.

| # | Tarefa | Prioridade | Estimativa | Dependência |
|---|--------|------------|------------|-------------|
| 3.1 | Criar tabela `historico_servidor` com trigger de auditoria | 🔴 Alta | 4h | Fase 2 |
| 3.2 | Criar tabela `periodos_aquisitivos` (férias) | 🔴 Alta | 2h | - |
| 3.3 | Criar função `fn_calcular_periodo_aquisitivo()` | 🔴 Alta | 4h | 3.2 |
| 3.4 | Criar tabela `programacao_ferias` (escala anual) | 🟡 Média | 2h | 3.2 |
| 3.5 | Criar dashboard de RH com indicadores | 🟡 Média | 8h | Fase 2 |
| 3.6 | Implementar alertas automáticos (vencimento férias, etc) | 🟡 Média | 6h | 3.2-3.4 |
| 3.7 | Criar relatório de vida funcional do servidor | 🟡 Média | 4h | 3.1 |
| 3.8 | Integrar workflow de aprovação de férias | 🟡 Média | 6h | 3.4 + Workflow |
| 3.9 | Criar exportação para eSocial (S-2200, S-2206) | 🟢 Baixa | 16h | 3.1 |
| 3.10 | Implementar notificações push/email | 🟢 Baixa | 8h | 3.6 |
| 3.11 | Criar app mobile-first para frequência | 🟢 Baixa | 20h | Fase 2 |
| 3.12 | Implementar assinatura digital de documentos | 🟢 Baixa | 12h | - |

**Entregáveis da Fase 3:**
- [ ] Histórico completo de alterações por servidor
- [ ] Gestão automatizada de férias com períodos aquisitivos
- [ ] Dashboard executivo de RH
- [ ] Base técnica para eSocial

---

## 4️⃣ PONTOS DE ATENÇÃO

### 4.1 Riscos de Engessamento

| Risco | Severidade | Mitigação |
|-------|------------|-----------|
| **Enums TypeScript em `types/servidor.ts`** | 🔴 Alta | Migrar para tabelas de configuração na Fase 2 |
| **Regras de jornada em `pdfFrequenciaMensalGenerator.ts`** | 🔴 Alta | Criar `config_jornadas` e consumir via query |
| **Fórmulas de cálculo em `folhaCalculos.ts`** | 🔴 Alta | Criar `config_formulas_calculo` com parser |
| **Layout CNAB fixo em `cnabGenerator.ts`** | 🟡 Média | Aceitar limitação ou criar gerador dinâmico |
| **Mapeamento de menu em `menu.config.ts`** | 🟡 Média | Já é baseado em permissões; manter |
| **Labels de status em componentes** | 🟡 Média | Consumir do banco via hook após Fase 2 |

### 4.2 Pontos Críticos de Dados Sensíveis

| Dado | Tabela | Proteção Atual | Recomendação |
|------|--------|----------------|--------------|
| CPF de servidores | `servidores.cpf` | RLS + FORCE | ✅ Manter |
| Dados bancários | `servidores.banco_*` | RLS | Adicionar criptografia em repouso |
| Salários/vencimentos | `fichas_financeiras` | RLS + FORCE | ✅ Manter |
| Documentos pessoais | `servidores.rg, titulo_*` | RLS | Mascarar em logs de auditoria |
| Dependentes IRRF | `dependentes_irrf` | RLS + FORCE | ✅ Manter |
| Consignações | `consignacoes` | RLS + FORCE | ✅ Manter |
| Atestados médicos | Storage | RLS | Verificar bucket policies |

### 4.3 Dependências Entre Módulos

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPENDÊNCIAS CRÍTICAS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                                │
│  │   RBAC       │◄────────────────────────────────────┐          │
│  │  (Fase 1-2)  │                                     │          │
│  └──────┬───────┘                                     │          │
│         │                                             │          │
│         ▼                                             │          │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐   │
│  │  Estrutura   │◄────►│   Cargos     │◄────►│ Composição   │   │
│  │  Organiz.    │      │              │      │   Cargos     │   │
│  └──────┬───────┘      └──────┬───────┘      └──────────────┘   │
│         │                     │                                  │
│         ▼                     ▼                                  │
│  ┌──────────────┐      ┌──────────────┐                          │
│  │  Servidores  │◄────►│ Provimentos  │                          │
│  │   (Fase 3)   │      │              │                          │
│  └──────┬───────┘      └──────────────┘                          │
│         │                                                        │
│    ┌────┴────┬─────────────┬─────────────┐                       │
│    ▼         ▼             ▼             ▼                       │
│ ┌──────┐ ┌──────┐   ┌──────────┐   ┌──────────┐                  │
│ │Lotação│ │Cessão│   │Frequência│   │  Férias  │                  │
│ └──────┘ └──────┘   └────┬─────┘   └──────────┘                  │
│                          │                                        │
│                          ▼                                        │
│                   ┌──────────────┐                                │
│                   │    FOLHA     │ (Fase 3.5 - Bloqueada)         │
│                   │  Pagamento   │                                │
│                   └──────────────┘                                │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### 4.4 Checklist de Compatibilidade Multi-Institucional

Para que o módulo de RH seja reutilizável em outras instituições:

- [ ] Todas as tabelas de configuração têm `instituicao_id`
- [ ] Nenhum valor institucional hardcoded no código
- [ ] Logos e brasões vêm do banco (não do código)
- [ ] Políticas RLS consideram `instituicao_id` quando aplicável
- [ ] Relatórios são parametrizados pelo cabeçalho institucional
- [ ] Calendários são por instituição
- [ ] Jornadas são por instituição
- [ ] Rubricas podem ser por instituição

---

## 📋 RESUMO EXECUTIVO

| Fase | Escopo | Duração | Resultado Esperado |
|------|--------|---------|-------------------|
| **Fase 1** | Consolidação e Segurança | 2-3 semanas | Sistema seguro e integrado |
| **Fase 2** | Parametrização | 3-4 semanas | Zero hardcode de regras RH |
| **Fase 3** | Evolução UX | 4-6 semanas | Automações e dashboard |

**Total Estimado:** 9-13 semanas para consolidação completa

**Risco Principal:** Mudanças na Fase 2 impactam múltiplos arquivos TypeScript que consomem enums. Requer refatoração cuidadosa com testes.

**Benefício Principal:** Sistema pronto para atender múltiplas instituições com configuração via banco, sem necessidade de deploy para alteração de regras de negócio.

---

*Documento gerado em 02/02/2026*
*Próxima revisão: Após aprovação do plano*
