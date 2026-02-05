
# Plano: Estrutura Robusta de Relatorios para Unidades Locais

## Visao Geral

Criar um sistema completo de relatorios para o modulo de Unidades Locais, desde relatorios simples ate relatorios avancados com analises gerenciais. O sistema seguira o padrao institucional ja estabelecido (ReportLayout + pdfInstitucional.ts) e aproveitara as views existentes no banco de dados.

---

## Arquitetura Proposta

```text
ESTRUTURA DE RELATORIOS - UNIDADES LOCAIS
├── SIMPLES (Listagens e Fichas)
│   ├── Listagem de Unidades
│   ├── Ficha Cadastral Individual
│   └── Inventario de Areas
│
├── OPERACIONAIS (Gestao)
│   ├── Relatorio de Patrimonio por Unidade
│   ├── Agenda de Cedencias
│   ├── Termos de Cessao Emitidos
│   └── Chefes e Responsaveis
│
└── AVANCADOS (Gerenciais)
    ├── Dashboard Analitico
    ├── Mapa de Ocupacao
    ├── Indicadores de Desempenho
    └── Relatorio de Conformidade
```

---

## Componentes a Criar

### 1. Blocos Reutilizaveis de Relatorio (Modular)

| Arquivo | Descricao |
|---------|-----------|
| `src/lib/pdf/unidades/blocoIdentificacao.ts` | Dados basicos da unidade |
| `src/lib/pdf/unidades/blocoLocalizacao.ts` | Endereco e municipio |
| `src/lib/pdf/unidades/blocoPatrimonio.ts` | Resumo de itens patrimoniais |
| `src/lib/pdf/unidades/blocoCedencias.ts` | Resumo de agendamentos |
| `src/lib/pdf/unidades/blocoResponsavel.ts` | Chefe atual e historico |
| `src/lib/pdf/unidades/blocoEstrutura.ts` | Areas e estrutura disponivel |

### 2. Geradores de PDF Especificos

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| `src/lib/pdfFichaUnidadeLocal.ts` | Simples | Ficha completa de uma unidade |
| `src/lib/pdfListagemUnidades.ts` | Simples | Lista resumida em tabela |
| `src/lib/pdfPatrimonioUnidades.ts` | Operacional | Inventario patrimonial |
| `src/lib/pdfCedenciasUnidades.ts` | Operacional | Cedencias por periodo |
| `src/lib/pdfIndicadoresUnidades.ts` | Avancado | KPIs e metricas |
| `src/lib/pdfMapaOcupacao.ts` | Avancado | Taxa de utilizacao |

### 3. Pagina Central de Relatorios do Modulo

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/unidades/RelatoriosCentralPage.tsx` | Hub unificado de relatorios |

---

## Detalhamento dos Relatorios

### NIVEL 1: Relatorios Simples

#### 1.1 Ficha Cadastral da Unidade
- **Proposito**: Documento oficial com todos os dados de uma unidade
- **Conteudo**:
  - Identificacao (codigo, nome, tipo, status)
  - Localizacao (municipio, endereco completo)
  - Caracteristicas (capacidade, horarios, areas)
  - Responsavel atual (nome, cargo, ato de nomeacao)
  - Resumo patrimonial (quantidade, valor estimado)
  - QR Code para acesso digital
- **Formato**: Portrait A4, 1-2 paginas

#### 1.2 Listagem Geral de Unidades
- **Proposito**: Visao tabular de todas as unidades
- **Filtros**: Municipio, tipo, status, diretoria
- **Colunas**: Codigo, nome, tipo, municipio, status, chefe
- **Formato**: Landscape A4

#### 1.3 Inventario de Areas Disponiveis
- **Proposito**: Catalogo de espacos por unidade
- **Agrupamento**: Por municipio ou por tipo de area
- **Dados**: Unidade, areas disponiveis, capacidade

### NIVEL 2: Relatorios Operacionais

#### 2.1 Relatorio de Patrimonio por Unidade
- **Proposito**: Controle de bens por unidade
- **Dados fonte**: View `v_patrimonio_por_unidade`
- **Conteudo**:
  - Listagem de itens (tombo, descricao, estado)
  - Totalizadores por estado de conservacao
  - Valor estimado total
  - Itens em manutencao ou baixados
- **Formato**: Portrait A4, paginado

#### 2.2 Relatorio de Cedencias (Agenda)
- **Proposito**: Historico de uso das unidades
- **Dados fonte**: View `v_relatorio_uso_unidades`
- **Filtros**: Periodo, unidade, status, solicitante
- **Conteudo**:
  - Cedencias por unidade
  - Taxa de aprovacao
  - Publico atendido
  - Solicitantes recorrentes
- **Formato**: Portrait ou Landscape

#### 2.3 Termos de Cessao Emitidos
- **Proposito**: Controle documental
- **Conteudo**:
  - Lista de termos por periodo
  - Status (pendente, emitido, assinado)
  - Cessionarios
- **Formato**: Portrait A4

#### 2.4 Relatorio de Responsaveis (Chefes)
- **Proposito**: Controle de designacoes
- **Conteudo**:
  - Unidades com chefe designado
  - Unidades sem responsavel (alerta)
  - Historico de nomeacoes
  - Proximos vencimentos

### NIVEL 3: Relatorios Avancados (Gerenciais)

#### 3.1 Dashboard Analitico
- **Proposito**: Visao executiva consolidada
- **Conteudo**:
  - Cards de KPIs principais
  - Graficos de distribuicao (por tipo, por municipio)
  - Tendencia de uso (ultimos 12 meses)
  - Alertas de conformidade
- **Formato**: Landscape A4, visual rico

#### 3.2 Mapa de Ocupacao
- **Proposito**: Taxa de utilizacao das unidades
- **Metricas**:
  - Dias utilizados vs disponiveis
  - Taxa de ocupacao mensal
  - Ranking de unidades mais/menos usadas
  - Ociosidade por tipo
- **Periodo**: Configuravel (mes, trimestre, ano)

#### 3.3 Indicadores de Desempenho (KPIs)
- **Metricas calculadas**:
  - Taxa de aprovacao de cedencias
  - Tempo medio de resposta a solicitacoes
  - Publico total atendido
  - Valor patrimonial sob gestao
  - Unidades em conformidade (com chefe + patrimonio)
- **Comparativo**: Periodo atual vs anterior

#### 3.4 Relatorio de Conformidade
- **Proposito**: Auditoria e controle
- **Verificacoes**:
  - Unidades sem chefe designado
  - Unidades sem patrimonio registrado
  - Cedencias sem termo emitido
  - Termos vencidos nao renovados
  - Patrimonios em estado ruim/inservivel
- **Formato**: Lista de pendencias com acoes

---

## Interface do Usuario

### Pagina Central de Relatorios

```text
┌─────────────────────────────────────────────────────────────────┐
│ [Icon] RELATORIOS DE UNIDADES LOCAIS                            │
│ Gere relatorios institucionais padronizados                     │
├─────────────────────────────────────────────────────────────────┤
│ [Tab: Simples] [Tab: Operacionais] [Tab: Avancados]             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ [Icon]      │  │ [Icon]      │  │ [Icon]      │              │
│  │ Ficha       │  │ Listagem    │  │ Inventario  │              │
│  │ Cadastral   │  │ Geral       │  │ de Areas    │              │
│  │             │  │             │  │             │              │
│  │ [Gerar PDF] │  │ [Gerar PDF] │  │ [Gerar PDF] │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                 │
│  Filtros:                                                       │
│  [Municipio ▼] [Tipo ▼] [Status ▼] [Periodo ▼]                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Fluxo de Geracao

1. Usuario acessa Central de Relatorios
2. Seleciona categoria (Simples/Operacional/Avancado)
3. Escolhe tipo de relatorio
4. Aplica filtros (opciona)
5. Visualiza preview ou gera PDF diretamente
6. Download automatico com nome padronizado

---

## Views de Banco de Dados

### Existentes (Reutilizar)
- `v_relatorio_unidades_locais` - Dados consolidados
- `v_relatorio_uso_unidades` - Estatisticas de cedencia
- `v_cedencias_a_vencer` - Alertas de vencimento
- `v_patrimonio_por_unidade` - Inventario patrimonial

### Novas (Criar)
| View | Proposito |
|------|-----------|
| `v_unidades_conformidade` | Verificacao de pendencias |
| `v_ocupacao_mensal` | Taxa de uso por periodo |
| `v_kpis_unidades` | Indicadores agregados |

---

## Integracao com Sistema Existente

### Reutilizar Componentes
- `ReportLayout` - Layout React para preview
- `pdfInstitucional.ts` - Motor PDF padronizado
- `pdfTemplate.ts` - Funcoes auxiliares
- `pdfLogos.ts` - Cache de logomarcas

### Registrar na Central de Relatorios
Adicionar os novos relatorios ao catalogo em `/admin/central-relatorios`

### Permissoes RBAC
Vincular acesso aos relatorios conforme perfil:
- Basico: Ficha e Listagem
- Operacional: Patrimonio e Cedencias
- Gerencial: Dashboard e KPIs

---

## Resumo de Arquivos

### Novos Arquivos a Criar

| Caminho | Tipo |
|---------|------|
| `src/lib/pdf/unidades/index.ts` | Barrel export |
| `src/lib/pdf/unidades/blocoIdentificacao.ts` | Bloco modular |
| `src/lib/pdf/unidades/blocoLocalizacao.ts` | Bloco modular |
| `src/lib/pdf/unidades/blocoPatrimonio.ts` | Bloco modular |
| `src/lib/pdf/unidades/blocoCedencias.ts` | Bloco modular |
| `src/lib/pdf/unidades/blocoResponsavel.ts` | Bloco modular |
| `src/lib/pdf/unidades/blocoEstrutura.ts` | Bloco modular |
| `src/lib/pdfFichaUnidadeLocal.ts` | Gerador PDF |
| `src/lib/pdfListagemUnidades.ts` | Gerador PDF |
| `src/lib/pdfPatrimonioUnidades.ts` | Gerador PDF |
| `src/lib/pdfIndicadoresUnidades.ts` | Gerador PDF |
| `src/pages/unidades/RelatoriosCentralPage.tsx` | Pagina hub |
| `src/components/unidades/reports/ReportCard.tsx` | Card de relatorio |
| `src/components/unidades/reports/ReportFilters.tsx` | Filtros comuns |

### Arquivos a Modificar

| Caminho | Alteracao |
|---------|-----------|
| `src/config/menu.config.ts` | Adicionar rota da central |
| `src/App.tsx` | Registrar nova rota |

### Migrations SQL

| Descricao |
|-----------|
| Criar view `v_unidades_conformidade` |
| Criar view `v_ocupacao_mensal` |
| Criar view `v_kpis_unidades` |

---

## Ordem de Implementacao

1. **Fase 1**: Blocos modulares (base reutilizavel)
2. **Fase 2**: Relatorios simples (Ficha + Listagem)
3. **Fase 3**: Relatorios operacionais (Patrimonio + Cedencias)
4. **Fase 4**: Views SQL para KPIs
5. **Fase 5**: Relatorios avancados (Dashboard + Indicadores)
6. **Fase 6**: Pagina central unificada
7. **Fase 7**: Integracao com Central de Relatorios global
