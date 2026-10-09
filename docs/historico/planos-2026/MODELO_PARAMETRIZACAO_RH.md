# MODELO DE PARAMETRIZAÇÃO DO MÓDULO DE RH
## Instituto de Desporto, Juventude e Lazer - IDJUV
### Data: 02/02/2026 | Versão 1.0

---

> **Princípio Fundamental:** "Código é motor, banco de dados define comportamento."

---

## 1️⃣ ARQUITETURA DE PARAMETRIZAÇÃO

### 1.1 Visão Geral das Camadas

O modelo de parametrização é organizado em **4 camadas hierárquicas**, cada uma com escopo e responsabilidade bem definidos:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                    CAMADA 1: INSTITUCIONAL                            │  │
│   │  ┌────────────────────────────────────────────────────────────────┐  │  │
│   │  │ • Identidade visual (logos, brasões, cores)                    │  │  │
│   │  │ • Dados jurídicos (CNPJ, natureza, endereço)                   │  │  │
│   │  │ • Calendário oficial (feriados por esfera)                     │  │  │
│   │  │ • Políticas gerais (expediente, regras de assinatura)          │  │  │
│   │  │ • Responsáveis legais                                          │  │  │
│   │  └────────────────────────────────────────────────────────────────┘  │  │
│   │  Escopo: Toda a instituição | Vigência: Contínua                      │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
│                                      ▼                                       │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                      CAMADA 2: RECURSOS HUMANOS                       │  │
│   │  ┌────────────────────────────────────────────────────────────────┐  │  │
│   │  │ • Tipos de servidor (efetivo, comissionado, cedido)            │  │  │
│   │  │ • Tipos de vínculo e suas regras                               │  │  │
│   │  │ • Situações funcionais (ativo, licença, férias, cedido)        │  │  │
│   │  │ • Tipos de afastamento e licença                               │  │  │
│   │  │ • Motivos de desligamento                                      │  │  │
│   │  │ • Tipos de ato administrativo                                  │  │  │
│   │  │ • Naturezas de cargo                                           │  │  │
│   │  └────────────────────────────────────────────────────────────────┘  │  │
│   │  Escopo: Definições de RH | Vigência: Por período                     │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
│                                      ▼                                       │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                      CAMADA 3: FREQUÊNCIA                             │  │
│   │  ┌────────────────────────────────────────────────────────────────┐  │  │
│   │  │ • Jornadas de trabalho (6h, 8h, 12h)                           │  │  │
│   │  │ • Regimes de trabalho (presencial, híbrido, teletrabalho)      │  │  │
│   │  │ • Tipos de abono e justificativa                               │  │  │
│   │  │ • Regras de compensação e banco de horas                       │  │  │
│   │  │ • Tolerâncias de atraso                                        │  │  │
│   │  │ • Prazos de fechamento                                         │  │  │
│   │  │ • Configuração de assinaturas                                  │  │  │
│   │  └────────────────────────────────────────────────────────────────┘  │  │
│   │  Escopo: Controle de frequência | Vigência: Por competência            │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
│                                      ▼                                       │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                      CAMADA 4: FOLHA DE PAGAMENTO                     │  │
│   │  ┌────────────────────────────────────────────────────────────────┐  │  │
│   │  │ • Parâmetros fiscais (salário mínimo, teto INSS, deduções)     │  │  │
│   │  │ • Tabelas de imposto (INSS progressivo, IRRF)                  │  │  │
│   │  │ • Tipos de rubrica e regras de cálculo                         │  │  │
│   │  │ • Incidências por rubrica                                      │  │  │
│   │  │ • Margem consignável                                           │  │  │
│   │  │ • Calendário de pagamento                                      │  │  │
│   │  │ • Regras de arredondamento                                     │  │  │
│   │  └────────────────────────────────────────────────────────────────┘  │  │
│   │  Escopo: Cálculos financeiros | Vigência: Por competência              │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Relacionamento com Entidades Existentes

As camadas de parâmetros se conectam às entidades do sistema através de **chaves de contexto**:

```
                    ┌─────────────────────────────────────────┐
                    │          CAMADAS DE PARÂMETROS          │
                    │  Institucional → RH → Frequência → Folha │
                    └───────────────────┬─────────────────────┘
                                        │
            ┌───────────────────────────┼───────────────────────────┐
            │                           │                           │
            ▼                           ▼                           ▼
   ┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
   │   SERVIDORES    │        │    UNIDADES     │        │   COMPETÊNCIAS  │
   │                 │        │                 │        │                 │
   │ • tipo_servidor │◄──────►│ • estrutura_org │◄──────►│ • ano/mês       │
   │ • situacao      │        │ • unidades_locais│       │ • vigencia_*    │
   │ • jornada_id    │        │ • regras_unidade │       │ • periodo_*     │
   │ • regime_id     │        │                 │        │                 │
   └────────┬────────┘        └────────┬────────┘        └────────┬────────┘
            │                          │                          │
            └──────────────────────────┼──────────────────────────┘
                                       │
                                       ▼
                    ┌─────────────────────────────────────────┐
                    │            VÍNCULOS FUNCIONAIS          │
                    │                                          │
                    │  Provimentos │ Lotações │ Cessões │ etc  │
                    │                                          │
                    │  Cada vínculo herda parâmetros de:       │
                    │  • Servidor (individual)                  │
                    │  • Unidade (lotação)                      │
                    │  • Tipo de vínculo (regras)               │
                    │  • Instituição (padrões)                  │
                    └─────────────────────────────────────────┘
```

### 1.3 Descrição Conceitual das Camadas

#### Camada 1: Parâmetros Institucionais

**Propósito:** Definir a identidade e as políticas macro da instituição.

| Categoria | Exemplos | Comportamento |
|-----------|----------|---------------|
| **Identidade** | Nome, CNPJ, logo, brasão, cores | Estático, atualizado raramente |
| **Jurídico** | Natureza jurídica, responsável legal | Com vigência (muda com gestão) |
| **Calendário** | Feriados nacionais/estaduais/municipais/institucionais | Por esfera + ano |
| **Políticas** | Expediente padrão, regras gerais | Com vigência temporal |

**Chave de Identificação:** `instituicao_id`

**Relação com entidades:**
- Todas as tabelas do sistema DEVEM referenciar `instituicao_id` para suporte multi-institucional
- Servidores, unidades e competências herdam automaticamente os parâmetros institucionais

---

#### Camada 2: Parâmetros de RH

**Propósito:** Definir os tipos, situações e regras de gestão de pessoas.

| Categoria | Exemplos | Comportamento |
|-----------|----------|---------------|
| **Tipos de Servidor** | Efetivo, comissionado, cedido entrada/saída | Com vigência + regras associadas |
| **Situações Funcionais** | Ativo, licença, férias, afastado, cedido | Afeta frequência e folha |
| **Tipos de Vínculo** | CLT, estatutário, temporário | Regras específicas por tipo |
| **Tipos de Afastamento** | Licença médica, maternidade, capacitação | Com fundamento legal |
| **Tipos de Ato** | Portaria, decreto, resolução | Modelos de documento |

**Chave de Identificação:** `instituicao_id` + `codigo`

**Relação com entidades:**
- `servidores.tipo_servidor` → referencia `config_tipos_servidor.codigo`
- `servidores.situacao` → referencia `config_situacoes_funcionais.codigo`
- Regras de cada tipo definem comportamento automático (permite cargo? requer provimento?)

---

#### Camada 3: Parâmetros de Frequência

**Propósito:** Definir regras de jornada, abonos e controle de presença.

| Categoria | Exemplos | Comportamento |
|-----------|----------|---------------|
| **Jornadas** | 6h (360min), 8h (480min), 12h | Com horários e intervalos |
| **Regimes** | Presencial, híbrido, teletrabalho | Afeta registro de ponto |
| **Tipos de Abono** | Atestado, nojo, gala, licença | Requer documento ou não |
| **Compensação** | Limite de banco de horas, prazo para compensar | Por jornada |
| **Tolerâncias** | Minutos de atraso sem desconto | Por jornada ou unidade |
| **Fechamento** | Dia limite para lançamentos | Por competência |

**Chave de Identificação:** `instituicao_id` + `codigo` + `vigencia_inicio`

**Relação com entidades:**
- `servidores.jornada_id` → referencia jornada específica
- `servidores.regime_id` → referencia regime de trabalho
- `frequencia_mensal` → aplica regras vigentes na competência
- Calendário oficial (`config_dias_nao_uteis`) → afeta dias úteis do mês

---

#### Camada 4: Parâmetros de Folha

**Propósito:** Definir regras de cálculo, impostos e processamento financeiro.

| Categoria | Exemplos | Comportamento |
|-----------|----------|---------------|
| **Parâmetros Fiscais** | Salário mínimo, teto INSS, dedução dependente | Vigência obrigatória |
| **Tabelas INSS** | Faixas progressivas com alíquotas | Vigência anual |
| **Tabelas IRRF** | Faixas com parcela a deduzir | Vigência anual |
| **Tipos de Rubrica** | Provento, desconto, encargo, informativo | Natureza do item |
| **Incidências** | Rubrica X incide sobre INSS, IRRF, 13º? | Por rubrica + vigência |
| **Regras de Cálculo** | Fórmulas, referências, percentuais | Por rubrica |

**Chave de Identificação:** `instituicao_id` + `tipo_parametro` + `vigencia_inicio`

**Relação com entidades:**
- `parametros_folha` (já existe) → fonte de valores vigentes
- `tabela_inss` (já existe) → faixas progressivas
- `tabela_irrf` (já existe) → faixas com deduções
- `rubricas` (já existe) → tipos e incidências
- `fichas_financeiras` → aplica regras vigentes na competência

---

## 2️⃣ HIERARQUIA DOS PARÂMETROS

### 2.1 Níveis de Precedência

O sistema define **4 níveis de precedência**, do mais genérico ao mais específico:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          HIERARQUIA DE PRECEDÊNCIA                          │
│                                                                              │
│   Nível 4 (MAIS ESPECÍFICO) ────────────────────────────────► VENCE         │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  SERVIDOR INDIVIDUAL                                                 │   │
│   │  • Parâmetros definidos especificamente para um servidor             │   │
│   │  • Exemplo: jornada especial por necessidade de saúde                │   │
│   │  • Chave: servidor_id                                                │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      ▲                                       │
│                                      │                                       │
│   Nível 3 ──────────────────────────────────────────────────────────────    │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  TIPO DE SERVIDOR / VÍNCULO                                          │   │
│   │  • Regras específicas por categoria funcional                        │   │
│   │  • Exemplo: comissionados têm jornada 8h, efetivos podem ter 6h      │   │
│   │  • Chave: tipo_servidor_id ou tipo_vinculo_id                        │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      ▲                                       │
│                                      │                                       │
│   Nível 2 ──────────────────────────────────────────────────────────────    │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  UNIDADE ORGANIZACIONAL                                              │   │
│   │  • Regras específicas por lotação                                    │   │
│   │  • Exemplo: unidades externas têm tolerância maior para atraso       │   │
│   │  • Chave: unidade_id                                                 │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                      ▲                                       │
│                                      │                                       │
│   Nível 1 (MAIS GENÉRICO) ──────────────────────────────────────────────    │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  INSTITUIÇÃO (Padrão)                                                │   │
│   │  • Valores default aplicados quando não há especificação             │   │
│   │  • Exemplo: jornada padrão 6h, tolerância padrão 10min               │   │
│   │  • Chave: instituicao_id                                             │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   Nível 0 ──────────────────────────────────────────────────────────────    │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  SISTEMA (Fallback)                                                  │   │
│   │  • Valores hardcoded no código - APENAS para casos extremos          │   │
│   │  • Usado somente se nenhum parâmetro for encontrado no banco         │   │
│   │  • Exemplo: se não existir jornada, assumir 480 minutos (8h)         │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Algoritmo de Resolução de Parâmetro

Quando o sistema precisa obter um parâmetro, ele segue esta lógica:

```
FUNÇÃO obter_parametro(contexto, tipo_parametro, data_referencia):
    
    1. BUSCAR parâmetro no nível SERVIDOR
       WHERE servidor_id = contexto.servidor_id
         AND tipo = tipo_parametro
         AND data_referencia BETWEEN vigencia_inicio AND vigencia_fim
       
       SE encontrou → RETORNAR valor
    
    2. BUSCAR parâmetro no nível TIPO DE SERVIDOR
       WHERE tipo_servidor_id = contexto.tipo_servidor_id
         AND tipo = tipo_parametro
         AND data_referencia BETWEEN vigencia_inicio AND vigencia_fim
       
       SE encontrou → RETORNAR valor
    
    3. BUSCAR parâmetro no nível UNIDADE
       WHERE unidade_id = contexto.unidade_id
         AND tipo = tipo_parametro
         AND data_referencia BETWEEN vigencia_inicio AND vigencia_fim
       
       SE encontrou → RETORNAR valor
    
    4. BUSCAR parâmetro no nível INSTITUIÇÃO
       WHERE instituicao_id = contexto.instituicao_id
         AND tipo = tipo_parametro
         AND data_referencia BETWEEN vigencia_inicio AND vigencia_fim
       
       SE encontrou → RETORNAR valor
    
    5. RETORNAR valor padrão do sistema (fallback)

FIM FUNÇÃO
```

### 2.3 Exemplos Práticos de Resolução

#### Exemplo 1: Jornada de Trabalho

```
Contexto:
  - Servidor: João Silva (ID: abc123)
  - Tipo: Comissionado
  - Unidade: Gabinete da Presidência
  - Instituição: IDJUV
  - Data: 01/02/2026

Busca:
  1. Servidor abc123 tem jornada específica? NÃO
  2. Tipo 'comissionado' tem jornada definida? SIM → 8 horas
  
Resultado: Jornada de 8 horas
```

#### Exemplo 2: Tolerância de Atraso

```
Contexto:
  - Servidor: Maria Souza (ID: def456)
  - Tipo: Efetivo
  - Unidade: Centro Esportivo (externa)
  - Instituição: IDJUV
  - Data: 01/02/2026

Busca:
  1. Servidor def456 tem tolerância específica? NÃO
  2. Tipo 'efetivo' tem tolerância definida? NÃO
  3. Unidade 'Centro Esportivo' tem tolerância definida? SIM → 15 minutos
  
Resultado: Tolerância de 15 minutos
```

#### Exemplo 3: Servidor com Exceção Individual

```
Contexto:
  - Servidor: Pedro Lima (ID: ghi789) - com laudo médico
  - Tipo: Efetivo
  - Unidade: Sede
  - Instituição: IDJUV
  - Data: 01/02/2026

Busca:
  1. Servidor ghi789 tem jornada específica? SIM → 4 horas (laudo)
  
Resultado: Jornada de 4 horas (ignora níveis inferiores)
```

### 2.4 Matriz de Parâmetros por Nível

| Parâmetro | Instituição | Unidade | Tipo Servidor | Servidor |
|-----------|:-----------:|:-------:|:-------------:|:--------:|
| Jornada padrão | ✅ Default | ⚪ Opcional | ✅ Comum | ⚪ Exceção |
| Tolerância atraso | ✅ Default | ✅ Comum | ⚪ Raro | ⚪ Exceção |
| Regime trabalho | ✅ Default | ⚪ Opcional | ⚪ Raro | ✅ Comum |
| Banco de horas | ✅ Política | ⚪ Opcional | ✅ Comum | ⚪ Opcional |
| Calendário | ✅ Obrigatório | ⚪ Adicional | ❌ N/A | ❌ N/A |
| Faixas INSS | ✅ Obrigatório | ❌ N/A | ❌ N/A | ❌ N/A |
| Rubricas | ✅ Catálogo | ❌ N/A | ⚪ Filtro | ❌ N/A |

**Legenda:**
- ✅ Uso principal neste nível
- ⚪ Uso opcional/excepcional
- ❌ Não aplicável neste nível

---

## 3️⃣ TIPOS DE PARÂMETROS

### 3.1 Classificação por Estrutura de Dados

Os parâmetros são classificados em **4 tipos estruturais**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TIPOS DE PARÂMETROS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  TIPO A: PARÂMETROS SIMPLES                                          │   │
│  │                                                                       │   │
│  │  Estrutura: valor único (texto, número, boolean, data)                │   │
│  │  Armazenamento: colunas tipadas                                       │   │
│  │                                                                       │   │
│  │  Exemplos:                                                            │   │
│  │  • salario_minimo: 1412.00 (numeric)                                  │   │
│  │  • teto_inss: 7786.02 (numeric)                                       │   │
│  │  • permite_banco_horas: true (boolean)                                │   │
│  │  • dia_pagamento: 5 (integer)                                         │   │
│  │  • nome_instituicao: "IDJUV" (varchar)                                │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  TIPO B: PARÂMETROS ESTRUTURADOS (JSON)                               │   │
│  │                                                                       │   │
│  │  Estrutura: objeto complexo com múltiplos atributos                   │   │
│  │  Armazenamento: coluna JSONB                                          │   │
│  │                                                                       │   │
│  │  Exemplos:                                                            │   │
│  │  • expediente: {"inicio": "08:00", "fim": "14:00", "dias": [1,2,3,4,5]}│   │
│  │  • endereco: {"logradouro": "...", "cidade": "...", "uf": "RR"}       │   │
│  │  • regras_compensacao: {"limite_diario": 2, "prazo_dias": 30}         │   │
│  │  • layout_documento: {"margem": 10, "fonte": "Arial", "tamanho": 12}  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  TIPO C: PARÂMETROS TEMPORAIS (com vigência)                          │   │
│  │                                                                       │   │
│  │  Estrutura: valor + período de validade                               │   │
│  │  Armazenamento: colunas valor + vigencia_inicio + vigencia_fim        │   │
│  │                                                                       │   │
│  │  Exemplos:                                                            │   │
│  │  • Faixas INSS 2026: vigência 01/01/2026 a 31/12/2026                 │   │
│  │  • Salário mínimo: vigência com data de decreto                       │   │
│  │  • Jornada especial: vigência enquanto durar laudo médico             │   │
│  │  • Feriado municipal: vigência específica (pode mudar entre anos)     │   │
│  │                                                                       │   │
│  │  Regra: vigencia_fim NULL = vigente indefinidamente                   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  TIPO D: PARÂMETROS CONDICIONAIS                                      │   │
│  │                                                                       │   │
│  │  Estrutura: valor aplicável sob condições específicas                 │   │
│  │  Armazenamento: valor + condições em JSONB ou FKs                     │   │
│  │                                                                       │   │
│  │  Exemplos:                                                            │   │
│  │  • Jornada SE tipo_servidor = 'comissionado' ENTÃO 8h                 │   │
│  │  • Tolerância SE unidade.tipo = 'externa' ENTÃO 15min                 │   │
│  │  • Rubrica ATIVA SE situacao IN ('ativo', 'ferias')                   │   │
│  │  • Desconto SE NOT situacao = 'licenca_remunerada'                    │   │
│  │                                                                       │   │
│  │  Armazenamento das condições:                                         │   │
│  │  • FK simples: tipo_servidor_id, unidade_id                           │   │
│  │  • JSONB para condições complexas: {"situacoes": ["ativo", "ferias"]} │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Classificação por Domínio Funcional

Além da estrutura, os parâmetros são organizados por **domínio funcional**:

| Domínio | Código | Exemplos de Parâmetros |
|---------|--------|------------------------|
| **Institucional** | `INST` | nome, cnpj, logo, endereco, responsavel_legal |
| **Calendário** | `CAL` | feriados, recessos, pontos_facultativos |
| **Vida Funcional** | `VF` | tipos_servidor, situacoes, afastamentos |
| **Frequência** | `FREQ` | jornadas, regimes, abonos, tolerancias |
| **Folha** | `FOLHA` | salario_minimo, faixas_inss, rubricas |
| **Documentos** | `DOC` | layouts, assinaturas, modelos |

### 3.3 Tabela de Metadados de Parâmetros

Para que o sistema saiba como tratar cada parâmetro, é necessário um **catálogo de metadados**:

```
Conceito: config_parametros_meta
─────────────────────────────────────────────────────────────────
| Campo               | Tipo      | Descrição                    |
|---------------------|-----------|------------------------------|
| codigo              | varchar   | Identificador único          |
| dominio             | varchar   | INST, CAL, VF, FREQ, FOLHA   |
| tipo_dado           | varchar   | simples, json, temporal, cond|
| tipo_valor          | varchar   | text, numeric, bool, date    |
| permite_nivel       | text[]    | {instituicao, unidade, tipo_servidor, servidor} |
| requer_vigencia     | boolean   | Precisa de período?          |
| requer_aprovacao    | boolean   | Mudança precisa de aprovação?|
| editavel_producao   | boolean   | Pode mudar em produção?      |
| descricao           | text      | Explicação para usuários     |
| valor_padrao        | jsonb     | Fallback do sistema          |
```

### 3.4 Exemplos de Catálogo de Parâmetros

| Código | Domínio | Tipo Dado | Permite Nível | Vigência | Valor Padrão |
|--------|---------|-----------|---------------|----------|--------------|
| `INST.NOME` | INST | simples/text | instituicao | ❌ | "Instituição" |
| `INST.EXPEDIENTE` | INST | json | instituicao | ✅ | {"inicio":"08:00"} |
| `CAL.FERIADO` | CAL | temporal | instituicao | ✅ obrigatória | - |
| `VF.TIPO_SERVIDOR` | VF | condicional | instituicao | ✅ | - |
| `FREQ.JORNADA` | FREQ | condicional | todos | ✅ | 360 (6h) |
| `FREQ.TOLERANCIA` | FREQ | simples/int | instituicao, unidade | ✅ | 10 |
| `FOLHA.SAL_MINIMO` | FOLHA | temporal/num | instituicao | ✅ obrigatória | - |
| `FOLHA.INCIDENCIA` | FOLHA | condicional | instituicao | ✅ | - |

---

## 4️⃣ ESTRATÉGIA DE VERSIONAMENTO E VIGÊNCIA

### 4.1 Princípios de Governança Temporal

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    GOVERNANÇA TEMPORAL DE PARÂMETROS                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   PRINCÍPIO 1: IMUTABILIDADE                                                 │
│   ─────────────────────────────────────────────────────────────────────────  │
│   • Parâmetros NUNCA são deletados, apenas INATIVADOS                        │
│   • Alterações criam NOVA versão com nova vigência                           │
│   • Histórico completo é preservado para auditoria                           │
│                                                                              │
│   PRINCÍPIO 2: VIGÊNCIA OBRIGATÓRIA                                          │
│   ─────────────────────────────────────────────────────────────────────────  │
│   • Todo parâmetro temporal TEM data de início                               │
│   • Data fim NULL = vigente indefinidamente                                  │
│   • Não pode haver sobreposição de vigências para mesmo parâmetro            │
│                                                                              │
│   PRINCÍPIO 3: RETROATIVIDADE CONTROLADA                                     │
│   ─────────────────────────────────────────────────────────────────────────  │
│   • Processamentos usam parâmetros vigentes NA DATA DE REFERÊNCIA            │
│   • Reprocessamento de mês anterior usa parâmetros daquele período           │
│   • Mudança de parâmetro NÃO altera automaticamente períodos passados        │
│                                                                              │
│   PRINCÍPIO 4: AUDITORIA COMPLETA                                            │
│   ─────────────────────────────────────────────────────────────────────────  │
│   • Toda alteração gera log em audit_logs                                    │
│   • Registro inclui: usuário, data, valor anterior, valor novo               │
│   • Alterações críticas (folha) requerem aprovação                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Modelo de Versionamento

#### Estrutura Conceitual de Tabela Versionada

```
Conceito: config_jornadas (exemplo de tabela versionada)
─────────────────────────────────────────────────────────────────
| Campo                | Tipo        | Descrição                |
|----------------------|-------------|--------------------------|
| id                   | uuid        | PK imutável              |
| instituicao_id       | uuid        | FK para instituição      |
| codigo               | varchar     | Identificador lógico     |
| nome                 | varchar     | Nome legível             |
| carga_horaria_diaria | integer     | Minutos por dia          |
| vigencia_inicio      | date        | Início da validade       |
| vigencia_fim         | date        | Fim da validade (NULL=∞) |
| ativo                | boolean     | Registro ativo?          |
| created_at           | timestamptz | Criação                  |
| created_by           | uuid        | Quem criou               |
| updated_at           | timestamptz | Última alteração         |
| updated_by           | uuid        | Quem alterou             |
| versao               | integer     | Número da versão         |
| versao_anterior_id   | uuid        | FK para versão anterior  |
```

#### Fluxo de Alteração de Parâmetro

```
                    ┌─────────────────────────────────────────┐
                    │     USUÁRIO SOLICITA ALTERAÇÃO          │
                    │   (ex: mudar jornada 6h para 8h)        │
                    └───────────────────┬─────────────────────┘
                                        │
                                        ▼
                    ┌─────────────────────────────────────────┐
                    │     SISTEMA VALIDA SOLICITAÇÃO          │
                    │   • Usuário tem permissão?              │
                    │   • Data de início é futura?            │
                    │   • Não há conflito de vigência?        │
                    └───────────────────┬─────────────────────┘
                                        │
                           ┌────────────┴────────────┐
                           ▼                         ▼
              ┌─────────────────────┐   ┌─────────────────────┐
              │   REQUER APROVAÇÃO  │   │  NÃO REQUER APROVAÇÃO│
              │   (param crítico)   │   │  (param comum)       │
              └──────────┬──────────┘   └──────────┬──────────┘
                         │                         │
                         ▼                         │
              ┌─────────────────────┐              │
              │  CRIAR SOLICITAÇÃO  │              │
              │  approval_requests  │              │
              └──────────┬──────────┘              │
                         │                         │
                         ▼                         │
              ┌─────────────────────┐              │
              │  AGUARDA APROVADOR  │              │
              └──────────┬──────────┘              │
                         │                         │
                         ▼                         │
              ┌─────────────────────┐              │
              │     APROVADO?       │              │
              └──────────┬──────────┘              │
                         │                         │
                         ▼                         ▼
                    ┌─────────────────────────────────────────┐
                    │        EXECUTAR ALTERAÇÃO               │
                    │   1. Fechar vigência do registro atual  │
                    │      SET vigencia_fim = data_inicio - 1 │
                    │   2. Criar novo registro                │
                    │      INSERT com vigencia_inicio = data  │
                    │   3. Registrar auditoria                │
                    │      INSERT em audit_logs               │
                    └───────────────────┬─────────────────────┘
                                        │
                                        ▼
                    ┌─────────────────────────────────────────┐
                    │      NOTIFICAR INTERESSADOS             │
                    │   (se configurado)                      │
                    └─────────────────────────────────────────┘
```

### 4.3 Reprocessamento com Parâmetros Históricos

#### Cenário: Reprocessar Frequência de Janeiro/2026

```
Contexto:
  - Data atual: 15/02/2026
  - Competência a reprocessar: 01/2026
  - Jornada atual do servidor: 8h (desde 01/02/2026)
  - Jornada em janeiro: 6h (vigente até 31/01/2026)

Comportamento do Sistema:
  1. Identificar data de referência: 31/01/2026 (último dia da competência)
  2. Buscar jornada vigente em 31/01/2026 → 6h
  3. Reprocessar frequência usando 6h como base
  
Resultado: Frequência de janeiro usa parâmetros de janeiro, não os atuais
```

#### Função Conceitual de Busca Temporal

```
FUNÇÃO obter_parametro_vigente(
    instituicao_id uuid,
    tipo_parametro varchar,
    data_referencia date
):
    
    RETORNAR (
        SELECT valor
        FROM parametros
        WHERE instituicao_id = instituicao_id
          AND tipo = tipo_parametro
          AND ativo = true
          AND vigencia_inicio <= data_referencia
          AND (vigencia_fim IS NULL OR vigencia_fim >= data_referencia)
        ORDER BY vigencia_inicio DESC
        LIMIT 1
    )

FIM FUNÇÃO
```

### 4.4 Proteção contra Alterações Retroativas

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REGRAS DE PROTEÇÃO RETROATIVA                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   REGRA 1: Frequências fechadas são IMUTÁVEIS                                │
│   ─────────────────────────────────────────────────────────────────────────  │
│   • Competência com status 'fechada' não aceita alteração de parâmetros      │
│   • Reprocessamento requer REABERTURA formal da competência                  │
│   • Reabertura gera log e requer permissão específica                        │
│                                                                              │
│   REGRA 2: Folhas processadas exigem RETIFICAÇÃO                             │
│   ─────────────────────────────────────────────────────────────────────────  │
│   • Folha fechada não é reprocessada automaticamente                         │
│   • Mudança de parâmetro que afeta folha passada gera ALERTA                 │
│   • Retificação é processo separado com aprovação                            │
│                                                                              │
│   REGRA 3: Vigência mínima é DATA FUTURA                                     │
│   ─────────────────────────────────────────────────────────────────────────  │
│   • Parâmetros novos só podem ter vigencia_inicio >= data_atual              │
│   • Exceção: correção de erro com aprovação de super_admin                   │
│   • Sistema registra justificativa obrigatória para exceções                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5️⃣ IMPACTO NOS MÓDULOS EXISTENTES

### 5.1 Módulo: Vida Funcional do Servidor

#### O que passa a ser lido do banco:

| Regra Atual | Origem Atual | Destino Proposto |
|-------------|--------------|------------------|
| Tipos de servidor (efetivo, comissionado, cedido) | `types/servidor.ts` enum | `config_tipos_servidor` |
| Labels de tipo servidor | `TIPO_SERVIDOR_LABELS` hardcoded | `config_tipos_servidor.nome` |
| Cores de badges | `TIPO_SERVIDOR_COLORS` hardcoded | `config_tipos_servidor.cor_badge` |
| Regras por tipo (permite cargo, requer provimento) | `REGRAS_TIPO_SERVIDOR` hardcoded | Colunas em `config_tipos_servidor` |
| Situações funcionais | Valores fixos no código | `config_situacoes_funcionais` |
| Motivos de desligamento | `MOTIVOS_ENCERRAMENTO` array | `config_motivos_desligamento` |
| Tipos de ato (portaria, decreto) | `TIPOS_ATO` array | `config_tipos_ato` |
| Tipos de ônus de cessão | `TIPOS_ONUS` array | `config_tipos_onus` |

#### O que permanece como lógica técnica:

| Componente | Justificativa |
|------------|---------------|
| Validação de CPF (algoritmo) | Regra matemática universal, não varia por instituição |
| Geração de matrícula (trigger) | Lógica de sequência, não regra de negócio |
| Função `fn_atualizar_situacao_servidor()` | Motor de atualização, lê situações do banco |
| View `v_servidores_situacao` | Consulta otimizada, lê dados parametrizados |
| RLS policies | Controle de acesso técnico |

#### Pontos sensíveis:

| Ponto | Risco | Mitigação |
|-------|-------|-----------|
| Migração de enums TypeScript | Quebra de tipos em componentes | Criar hook `useConfigVidaFuncional()` que expõe types dinâmicos |
| Mudança de `tipo_servidor` para FK | Requer migração de dados existentes | Script de migração com mapeamento enum → uuid |
| Labels dinâmicos em tabelas | Performance de múltiplos SELECTs | Cache local com React Query + invalidação seletiva |
| Validação de regras por tipo | Lógica espalhada em vários componentes | Centralizar em hook único que expõe `podeNomear()`, `requerProvimento()` etc |

---

### 5.2 Módulo: Frequência

#### O que passa a ser lido do banco:

| Regra Atual | Origem Atual | Destino Proposto |
|-------------|--------------|------------------|
| Jornadas (6h, 8h) | Hardcoded em `pdfFrequenciaMensalGenerator.ts` | `config_jornadas` |
| Cálculo de turnos (1 ou 2) | `if (jornada <= 6)` hardcoded | `config_jornadas.quantidade_turnos` |
| Horários de entrada/saída | Não parametrizado | `config_jornadas.horario_*` |
| Tipos de abono | Arrays em componentes | `config_tipos_abono` |
| Regras de compensação | Hardcoded | `config_regras_compensacao` |
| Tolerância de atraso | Não existe | `config_frequencia.tolerancia_minutos` |
| Prazo de fechamento | Não existe | `config_frequencia.dia_fechamento` |
| Dias não úteis | `config_dias_nao_uteis` (já existe) | **MANTER e INTEGRAR** |

#### O que permanece como lógica técnica:

| Componente | Justificativa |
|------------|---------------|
| Cálculo de dias úteis do mês | Algoritmo que usa calendário parametrizado |
| Geração de PDF (layout) | Motor de renderização, lê parâmetros do banco |
| Estrutura de colunas da tabela | Padrão visual institucional (já parametrizado) |
| Upload e armazenamento de arquivos | Infraestrutura de storage |
| Consolidação de pacotes SEI | Lógica de agrupamento |

#### Pontos sensíveis:

| Ponto | Risco | Mitigação |
|-------|-------|-----------|
| Múltiplas jornadas ativas | Servidor pode mudar de jornada no meio do mês | Usar jornada vigente no INÍCIO do mês para consistência |
| Integração com calendário | Feriados podem ser adicionados retroativamente | Recalcular dias úteis no reprocessamento |
| PDF com dados históricos | Jornada atual vs jornada da competência | Sempre passar `data_referencia` para busca de parâmetros |
| Fechamento de competência | Alteração de parâmetro após fechamento | Bloquear alteração + exigir reabertura formal |

#### Exemplo de Fluxo Refatorado:

```
ANTES (hardcoded):
─────────────────────────────────────────────────────
const gerarFrequencia = (servidor, competencia) => {
  const jornada = servidor.carga_horaria === 480 ? 8 : 6;
  const turnos = jornada <= 6 ? 1 : 2;
  // ...renderiza PDF com valores fixos
}

DEPOIS (parametrizado):
─────────────────────────────────────────────────────
const gerarFrequencia = async (servidor, competencia) => {
  const dataRef = ultimoDia(competencia);
  
  const jornada = await obterParametro({
    servidor_id: servidor.id,
    tipo: 'FREQ.JORNADA',
    data: dataRef
  });
  
  // jornada contém: carga_horaria, turnos, horarios, etc
  // ...renderiza PDF com valores do banco
}
```

---

### 5.3 Módulo: Folha de Pagamento

#### O que passa a ser lido do banco:

| Regra Atual | Origem Atual | Destino Proposto |
|-------------|--------------|------------------|
| Salário mínimo | `parametros_folha` (já existe) | **MANTER** |
| Teto INSS | `parametros_folha` (já existe) | **MANTER** |
| Dedução por dependente | `parametros_folha` (já existe) | **MANTER** |
| Faixas INSS | `tabela_inss` (já existe) | **MANTER** |
| Faixas IRRF | `tabela_irrf` (já existe) | **MANTER** |
| Tipos de rubrica | `types/folha.ts` enum | `config_tipos_rubrica` |
| Labels de rubrica | `TIPO_RUBRICA_LABELS` | `config_tipos_rubrica.nome` |
| Tipos de cálculo | `types/folha.ts` enum | `config_tipos_calculo` |
| Incidências por rubrica | Campos boolean em `rubricas` | `config_incidencias_rubrica` (mais flexível) |
| Fórmulas de cálculo | `folhaCalculos.ts` | `config_formulas_rubrica` (parser) |
| Margem consignável | Hardcoded 35% | `parametros_folha.margem_consignavel` |
| Arredondamento | Hardcoded | `config_folha.regras_arredondamento` |

#### O que permanece como lógica técnica:

| Componente | Justificativa |
|------------|---------------|
| Algoritmo de cálculo progressivo INSS | Matemática fiscal, usa faixas parametrizadas |
| Algoritmo de cálculo IRRF | Matemática fiscal, usa faixas parametrizadas |
| Função `processar_folha_pagamento()` | Motor de processamento, lê parâmetros do banco |
| Geração de CNAB | Layout técnico bancário (pode ser semi-parametrizado) |
| Geração de XML eSocial | Especificação técnica do governo |
| RLS e acesso a `fichas_financeiras` | Segurança de dados sensíveis |

#### Pontos sensíveis:

| Ponto | Risco | Mitigação |
|-------|-------|-----------|
| Migração de fórmulas para banco | Complexidade de parser de fórmulas | Iniciar com fórmulas simples (fixo, percentual), evoluir para parser |
| Incidências retroativas | Mudança de incidência afeta cálculos passados | Incidência TEM vigência, folhas fechadas usam regras do período |
| Múltiplas instituições | Parâmetros fiscais são nacionais, mas cálculos variam | Separar parâmetros federais (compartilhados) de institucionais |
| Performance de processamento | Múltiplas consultas por servidor | Cache de parâmetros no início do processamento |

#### Estratégia para Fórmulas:

```
Nível 1 (imediato): Tipos de cálculo predefinidos
─────────────────────────────────────────────────────
• FIXO: valor = rubrica.valor_fixo
• PERCENTUAL: valor = base * rubrica.percentual
• REFERENCIA: valor = base * rubrica.referencia / 30
• MANUAL: valor = lancamento.valor

Nível 2 (futuro): Parser de fórmulas simples
─────────────────────────────────────────────────────
• formula = "VENCIMENTO * 0.05"
• formula = "(VENCIMENTO + GRATIFICACAO) * ALIQUOTA_INSS"
• Variáveis predefinidas: VENCIMENTO, GRATIFICACAO, BASE_INSS, etc

Nível 3 (avançado): Engine de regras
─────────────────────────────────────────────────────
• Condições: SE situacao = 'licenca' ENTÃO 0
• Referências cruzadas entre rubricas
• Cálculos encadeados
```

---

## 📊 RESUMO DE IMPACTO

### Matriz de Migração por Módulo

| Módulo | Regras Hardcoded Hoje | Regras → Banco | Permanece em Código | Esforço |
|--------|----------------------|----------------|---------------------|---------|
| **Vida Funcional** | 8 objetos/arrays | 8 tabelas config | Validações, triggers | 🟡 Médio |
| **Frequência** | 5 regras fixas | 4 tabelas config | Geração PDF, upload | 🟡 Médio |
| **Folha** | 6 regras/fórmulas | 3 tabelas config | Algoritmos fiscais | 🔴 Alto |

### Benefícios Esperados

| Benefício | Descrição |
|-----------|-----------|
| **Multi-institucional** | Uma base de código serve múltiplas instituições |
| **Governança sem deploy** | Mudança de jornada, abono, rubrica via interface admin |
| **Auditoria completa** | Histórico de todas as alterações de parâmetros |
| **Retroatividade segura** | Reprocessamento usa parâmetros da época correta |
| **Flexibilidade** | Novos tipos de servidor, abono, rubrica sem código |

### Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Quebra de tipos TypeScript | Alta | Médio | Migração gradual com fallback |
| Performance de consultas | Média | Médio | Cache + React Query |
| Complexidade de fórmulas | Média | Alto | Parser incremental (níveis 1→2→3) |
| Migração de dados legados | Baixa | Alto | Scripts idempotentes com rollback |

---

*Documento conceitual - Versão 1.0*
*Próxima etapa: Aprovação do modelo antes de implementação*
