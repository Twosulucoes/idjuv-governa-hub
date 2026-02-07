
# Sistema de Controle de Credenciamento de Gestores Escolares

## Visão Geral

Criar um sistema completo para gerenciar o credenciamento de aproximadamente 400 gestores escolares para os Jogos Escolares de Roraima. O sistema controlará o fluxo desde o pré-cadastro público até a confirmação de acesso no sistema CBDE.

O sistema será acessível via `/cadastrogestores/*` e seguirá os padrões já existentes no projeto (similar ao módulo de pré-cadastro de servidores e formulário público ASCOM).

---

## Fluxo do Processo

```text
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Formulário    │     │   Cadastro no   │     │    Contato      │     │   Confirmação   │
│    Público      │ ──► │     CBDE        │ ──► │   Telefônico    │ ──► │     Final       │
│                 │     │   (Manual)      │     │   (IDJuv)       │     │                 │
│ [aguardando]    │     │ [cadastrado_    │     │ [contato_       │     │ [confirmado]    │
│                 │     │  cbde]          │     │  realizado]     │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Estrutura de Arquivos

### Páginas
```
src/pages/cadastrogestores/
├── FormularioGestorPage.tsx       # Formulário público de pré-cadastro
├── ConsultaGestorPage.tsx         # Consulta pública de status por CPF
├── AdminGestoresPage.tsx          # Painel administrativo principal
└── ImportarEscolasPage.tsx        # Tela para importar lista de escolas
```

### Hooks
```
src/hooks/
├── useGestoresEscolares.ts        # CRUD de gestores (público e admin)
└── useEscolasJer.ts               # CRUD de escolas
```

### Tipos
```
src/types/
└── gestoresEscolares.ts           # Tipos e constantes do módulo
```

### Componentes
```
src/components/cadastrogestores/
├── GestorFormulario.tsx           # Formulário de cadastro
├── GestorStatusCard.tsx           # Card de status para consulta
├── GestorListaAdmin.tsx           # Lista de gestores (admin)
├── GestorDetalhesDialog.tsx       # Modal com detalhes do gestor
├── ImportarEscolasDialog.tsx      # Modal de importação CSV/Excel
└── MetricasCredenciamento.tsx     # Cards de métricas/progresso
```

---

## Banco de Dados

### Tabela: `escolas_jer`
Armazena a lista de escolas participantes dos Jogos Escolares.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | PK, gerado automaticamente |
| `nome` | text | Nome completo da escola (NOT NULL) |
| `municipio` | text | Município da escola |
| `inep` | text | Código INEP (opcional) |
| `ja_cadastrada` | boolean | Se já tem gestor cadastrado (default: false) |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Data de atualização |

### Tabela: `gestores_escolares`
Armazena os pré-cadastros de gestores.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid | PK, gerado automaticamente |
| `escola_id` | uuid | FK para escolas_jer (UNIQUE - 1 gestor por escola) |
| `nome` | text | Nome completo do gestor (NOT NULL) |
| `cpf` | text | CPF (UNIQUE, NOT NULL) |
| `rg` | text | RG |
| `data_nascimento` | date | Data de nascimento |
| `email` | text | Email (UNIQUE, NOT NULL) |
| `celular` | text | Telefone celular (NOT NULL) |
| `endereco` | text | Endereço completo |
| `status` | text | Status atual do processo |
| `responsavel_id` | uuid | FK para profiles (quem assumiu a tarefa) |
| `responsavel_nome` | text | Nome do responsável (cache) |
| `observacoes` | text | Observações internas |
| `contato_realizado` | boolean | Se ligação foi feita (default: false) |
| `acesso_testado` | boolean | Se gestor confirmou acesso (default: false) |
| `data_cadastro_cbde` | timestamptz | Quando foi cadastrado no CBDE |
| `data_contato` | timestamptz | Quando ligação foi realizada |
| `data_confirmacao` | timestamptz | Quando acesso foi confirmado |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Data de atualização |

### Enum de Status
- `aguardando`: Aguardando processamento
- `em_processamento`: Responsável assumiu a tarefa
- `cadastrado_cbde`: Cadastrado no sistema CBDE
- `confirmado`: Gestor confirmou acesso
- `problema`: Há algum problema no processo

### Políticas RLS
- **Escolas**: Leitura pública (para dropdown), escrita apenas autenticados
- **Gestores**: Leitura pública limitada (para consulta por CPF), escrita pública para criar, atualização apenas autenticados

---

## Rotas

Todas as rotas terão o prefixo `/cadastrogestores`:

| Rota | Tipo | Componente | Descrição |
|------|------|------------|-----------|
| `/cadastrogestores` | Público | FormularioGestorPage | Formulário de pré-cadastro |
| `/cadastrogestores/consulta` | Público | ConsultaGestorPage | Consulta de status por CPF |
| `/cadastrogestores/admin` | Protegido | AdminGestoresPage | Painel administrativo |
| `/cadastrogestores/admin/escolas` | Protegido | ImportarEscolasPage | Importação de escolas |

---

## Funcionalidades Detalhadas

### 1. Formulário Público (`/cadastrogestores`)
- Header institucional com logo IDJuv
- Dropdown de escolas (ordenadas por nome)
- Campos: nome, CPF, RG, data nascimento, email, celular, endereço
- Validação de CPF único e email único
- Validação de escola já cadastrada
- Após envio: exibe código de confirmação e instruções

### 2. Consulta Pública (`/cadastrogestores/consulta`)
- Campo de busca por CPF
- Exibe status atual com descrição amigável
- Exibe próximos passos esperados
- Timeline do processo (quando aplicável)

### 3. Painel Admin (`/cadastrogestores/admin`)
- Cards de métricas: Total, Aguardando, Em Processamento, Cadastrados, Confirmados
- Barra de progresso geral
- Filtros: status, responsável, busca por nome/CPF/escola
- Tabela com colunas: Escola, Gestor, CPF, Email, Status, Responsável, Ações
- Ações por registro:
  - Visualizar detalhes
  - Assumir tarefa
  - Marcar etapa (cadastrado CBDE, contato realizado, acesso testado)
  - Adicionar observação
  - Marcar problema
- Exportar relatório (Excel/CSV)

### 4. Importar Escolas (`/cadastrogestores/admin/escolas`)
- Upload de arquivo CSV ou Excel
- Preview dos dados antes de importar
- Mapeamento de colunas (nome, município, INEP)
- Opção de adicionar manualmente
- Lista de escolas cadastradas com status

---

## Componentes de Interface

### MetricasCredenciamento
Cards estatísticos mostrando progresso:
- Total de pré-cadastros
- Aguardando (quantidade e %)
- Em processamento
- Cadastrados no CBDE
- Confirmados
- Barra de progresso visual

### GestorListaAdmin
Tabela responsiva com:
- Ordenação por colunas
- Filtros inline
- Badges de status coloridos
- Botões de ação rápida

### GestorDetalhesDialog
Modal com:
- Dados completos do gestor
- Dados da escola
- Timeline do processo
- Botões de ação
- Campo de observações

---

## Validações

### Formulário Público
- CPF: formato válido, único no sistema
- Email: formato válido, único no sistema
- Escola: deve existir, não pode ter outro gestor
- Campos obrigatórios: nome, CPF, email, celular, escola
- Celular: formato brasileiro

### Área Admin
- Apenas usuários autenticados
- Ações de marcar etapas validam status anterior

---

## Tecnologias e Padrões

O sistema seguirá os padrões já estabelecidos no projeto:
- React + TypeScript
- TanStack Query para gerenciamento de estado/cache
- Zod para validação de schemas
- Componentes shadcn/ui
- AdminLayout para área administrativa
- Supabase para banco de dados e RLS
- xlsx para importação/exportação

---

## Implementação em Etapas

1. **Banco de dados**: Criar tabelas, índices e políticas RLS
2. **Tipos**: Definir interfaces e constantes
3. **Hooks**: Implementar lógica de CRUD
4. **Páginas públicas**: Formulário e consulta
5. **Área admin**: Painel, listagem e ações
6. **Importação**: Tela de importação de escolas
7. **Rotas**: Configurar rotas no App.tsx
8. **Testes**: Validar fluxo completo

