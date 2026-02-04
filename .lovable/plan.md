
# Plano: Segundo Vínculo com Controle de Ato Formal

## Objetivo

Expandir o conceito de "Segundo Vínculo Funcional" para incluir:
1. **Tipo do vínculo externo** (esfera e natureza)
2. **Forma do vínculo** - se há ou não um ato formal que regulamenta
3. **Rastreabilidade do ato** - quando houver ato formal, permitir vincular à tabela `documentos` para rastreio completo

## Cenários de Uso

| Cenário | Descrição | Ato Formal? |
|---------|-----------|-------------|
| **Servidor licenciado** | Efetivo federal que está licenciado para exercer cargo comissionado no IDJuv | Pode haver |
| **Servidor cedido formalmente** | Servidor de outro estado cedido formalmente ao IDJuv | Sim - Portaria/Termo de Cessão |
| **Comissionado com vínculo paralelo** | Servidor que exerce cargo comissionado no IDJuv e é efetivo municipal em outro local | Geralmente não |
| **Requisitado** | Servidor requisitado de outro órgão com portaria específica | Sim - Portaria de Requisição |

## Modelo de Dados Proposto

### Novos Campos na Tabela `servidores`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `possui_vinculo_externo` | BOOLEAN | Se possui vínculo efetivo em outro órgão |
| `vinculo_externo_esfera` | TEXT | Federal / Estadual (RR) / Estadual (Outro) / Municipal |
| `vinculo_externo_orgao` | TEXT | Nome do órgão (ex: "Receita Federal") |
| `vinculo_externo_cargo` | TEXT | Cargo efetivo no outro órgão |
| `vinculo_externo_matricula` | TEXT | Matrícula no órgão de origem |
| `vinculo_externo_situacao` | TEXT | Ativo / Licenciado / Cedido / Afastado |
| `vinculo_externo_forma` | TEXT | **Novo**: "informal" / "cessao" / "requisicao" / "licenca" |
| `vinculo_externo_ato_id` | UUID | **FK para `documentos`**: Referência ao ato formal (quando aplicável) |
| `vinculo_externo_observacoes` | TEXT | Observações adicionais |

### Formas de Vínculo

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ FORMA DO VÍNCULO                                                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ○ Informal (sem ato formal)                                             │
│   → Servidor declara que possui vínculo externo, mas não há             │
│     documento formal regulamentando sua presença no IDJuv               │
│                                                                         │
│ ○ Cessão Formal                                                         │
│   → Existe Termo de Cessão/Portaria de Cessão entre os órgãos          │
│   → [Vincular Documento ▼] - Seleciona da Central de Portarias          │
│                                                                         │
│ ○ Requisição                                                            │
│   → Servidor foi requisitado formalmente pelo IDJuv                    │
│   → [Vincular Documento ▼] - Seleciona da Central de Portarias          │
│                                                                         │
│ ○ Licença para Tratar de Interesses Particulares / Capacitação         │
│   → Servidor está licenciado do órgão de origem                        │
│   → [Vincular Documento ▼] (opcional - documento do órgão de origem)   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Alterações no Frontend

### 1. Formulário de Cadastro/Edição

**Arquivo:** `src/pages/rh/ServidorFormPage.tsx`

Nova seção "Segundo Vínculo Funcional" com lógica condicional:

```text
┌────────────────────────────────────────────────────────────────────────┐
│  SEGUNDO VÍNCULO FUNCIONAL (Opcional)                                  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  [✓] Possui vínculo efetivo em outro órgão                            │
│                                                                        │
│  ┌─────────────────────┐  ┌────────────────────────────────────────────│
│  │ Esfera              │  │ Órgão de Origem                            │
│  │ [Federal         ▼] │  │ [RECEITA FEDERAL DO BRASIL               ] │
│  └─────────────────────┘  └────────────────────────────────────────────│
│                                                                        │
│  ┌────────────────────────────────────┐  ┌─────────────────────────────│
│  │ Cargo Efetivo                      │  │ Matrícula no Órgão Origem   │
│  │ [AUDITOR FISCAL                   ]│  │ [123456-7                  ]│
│  └────────────────────────────────────┘  └─────────────────────────────│
│                                                                        │
│  ┌─────────────────────┐                                               │
│  │ Situação no Órgão   │                                               │
│  │ [Licenciado      ▼] │                                               │
│  └─────────────────────┘                                               │
│                                                                        │
│  ─────────────────────────────────────────────────────────────────────│
│  FORMA DO VÍNCULO NO IDJUV                                            │
│  ─────────────────────────────────────────────────────────────────────│
│                                                                        │
│  ┌─────────────────────────┐                                           │
│  │ Forma                   │                                           │
│  │ [Cessão Formal       ▼] │                                           │
│  └─────────────────────────┘                                           │
│                                                                        │
│  Se for cessão/requisição/licença:                                    │
│  ┌─────────────────────────────────────────────────────────────────────│
│  │ Documento/Ato Formal (opcional)                                     │
│  │ [Buscar na Central de Portarias...                             🔍] │
│  │                                                                     │
│  │ Documento selecionado:                                              │
│  │ ┌─────────────────────────────────────────────────────────────┐    │
│  │ │ 📄 Portaria nº 045/2024 - Cessão de Servidor               │    │
│  │ │    Data: 15/03/2024 | Status: Vigente                      │    │
│  │ │                                              [❌ Remover]   │    │
│  │ └─────────────────────────────────────────────────────────────┘    │
│  └─────────────────────────────────────────────────────────────────────│
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────────│
│  │ Observações                                                         │
│  │ [                                                                 ] │
│  └─────────────────────────────────────────────────────────────────────│
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 2. Componente de Seleção de Documento

**Novo arquivo:** `src/components/rh/SeletorDocumentoVinculo.tsx`

- Busca documentos da tabela `documentos` onde `tipo = 'portaria'`
- Filtra por categorias relevantes: 'cessao', 'nomeacao', 'pessoal'
- Permite buscar por número ou título
- Exibe preview do documento selecionado
- Botão para abrir documento em nova aba

### 3. Página de Detalhe do Servidor

**Arquivo:** `src/pages/rh/ServidorDetalhePage.tsx`

Exibir na seção "Dados Funcionais":

```text
┌─────────────────────────────────────────────────────────────────────┐
│ 🔗 Segundo Vínculo Funcional                                        │
├─────────────────────────────────────────────────────────────────────┤
│ Esfera:       Federal                                               │
│ Órgão:        Receita Federal do Brasil                             │
│ Cargo:        Auditor Fiscal                                        │
│ Matrícula:    123456-7                                              │
│ Situação:     [Badge: Licenciado]                                   │
│                                                                     │
│ Forma:        Cessão Formal                                         │
│ Ato:          📄 Portaria nº 045/2024      [Abrir ↗]                │
│               Data: 15/03/2024 | DOE: 1234                          │
└─────────────────────────────────────────────────────────────────────┘
```

## Detalhamento Técnico

### Migração SQL

```sql
-- Campos de segundo vínculo
ALTER TABLE public.servidores 
  ADD COLUMN IF NOT EXISTS possui_vinculo_externo BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS vinculo_externo_esfera TEXT,
  ADD COLUMN IF NOT EXISTS vinculo_externo_orgao TEXT,
  ADD COLUMN IF NOT EXISTS vinculo_externo_cargo TEXT,
  ADD COLUMN IF NOT EXISTS vinculo_externo_matricula TEXT,
  ADD COLUMN IF NOT EXISTS vinculo_externo_situacao TEXT,
  ADD COLUMN IF NOT EXISTS vinculo_externo_forma TEXT,
  ADD COLUMN IF NOT EXISTS vinculo_externo_ato_id UUID REFERENCES public.documentos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vinculo_externo_observacoes TEXT;

-- Comentários
COMMENT ON COLUMN public.servidores.vinculo_externo_forma IS 
  'Forma do vínculo: informal, cessao, requisicao, licenca';
COMMENT ON COLUMN public.servidores.vinculo_externo_ato_id IS 
  'Referência ao documento/ato formal na Central de Portarias';

-- Índice para busca
CREATE INDEX IF NOT EXISTS idx_servidores_vinculo_externo_ato 
  ON public.servidores(vinculo_externo_ato_id) 
  WHERE vinculo_externo_ato_id IS NOT NULL;
```

### Tipos TypeScript

**Arquivo:** `src/types/rh.ts`

```typescript
export type VinculoExternoEsfera = 
  | 'federal'
  | 'estadual_rr'
  | 'estadual_outro'
  | 'municipal';

export type VinculoExternoSituacao = 
  | 'ativo'
  | 'licenciado'
  | 'cedido'
  | 'afastado';

export type VinculoExternoForma = 
  | 'informal'
  | 'cessao'
  | 'requisicao'
  | 'licenca';

export const VINCULO_EXTERNO_ESFERA_LABELS: Record<VinculoExternoEsfera, string> = {
  federal: 'Federal (União)',
  estadual_rr: 'Estadual (Roraima)',
  estadual_outro: 'Estadual (Outro Estado)',
  municipal: 'Municipal',
};

export const VINCULO_EXTERNO_SITUACAO_LABELS: Record<VinculoExternoSituacao, string> = {
  ativo: 'Ativo no Órgão de Origem',
  licenciado: 'Licenciado',
  cedido: 'Cedido',
  afastado: 'Afastado',
};

export const VINCULO_EXTERNO_FORMA_LABELS: Record<VinculoExternoForma, string> = {
  informal: 'Informal (sem ato formal)',
  cessao: 'Cessão Formal',
  requisicao: 'Requisição',
  licenca: 'Licença para Exercício em Outro Órgão',
};
```

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/rh/SeletorDocumentoVinculo.tsx` | Componente para buscar e selecionar documento da Central de Portarias |
| `src/components/rh/SegundoVinculoSection.tsx` | Seção completa para o formulário (encapsula lógica) |

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/types/rh.ts` | Adicionar tipos e labels para vínculo externo |
| `src/pages/rh/ServidorFormPage.tsx` | Adicionar seção de segundo vínculo com controle de ato |
| `src/pages/rh/ServidorDetalhePage.tsx` | Exibir segundo vínculo com link para o documento |

## Fluxo de Rastreabilidade

```text
┌─────────────────┐    vinculo_externo_ato_id    ┌─────────────────────┐
│    SERVIDOR     │ ───────────────────────────► │     DOCUMENTO       │
│                 │                              │  (Central Portarias)│
│ José da Silva   │                              │                     │
│ Vínculo: Cedido │                              │ Portaria 045/2024   │
│                 │                              │ Tipo: Cessão        │
│                 │                              │ DOE: 1234           │
│                 │                              │ Arquivo: PDF        │
└─────────────────┘                              └─────────────────────┘
                                                          │
                                                          ▼
                                                 Auditoria completa do ato:
                                                 - Data criação
                                                 - Quem criou
                                                 - Data publicação DOE
                                                 - Arquivo assinado
```

## Diferença Entre Módulos

| Módulo | Função | Quando Usar |
|--------|--------|-------------|
| **Segundo Vínculo** (este) | Registra que servidor tem vínculo em outro órgão | Informação cadastral básica |
| **Cessões (existente)** | Gerencia cessões de entrada/saída do IDJuv | Controle detalhado de cessões |
| **Central de Portarias** | Armazena todos os atos oficiais | Repositório de documentos |

O "Segundo Vínculo" **pode referenciar** um documento da Central de Portarias para rastreabilidade, mas não duplica a gestão de cessões.

## Ordem de Implementação

1. Migração do banco de dados (9 novos campos)
2. Atualizar tipos TypeScript
3. Criar componente `SeletorDocumentoVinculo`
4. Criar componente `SegundoVinculoSection`
5. Integrar no formulário de servidor
6. Atualizar página de detalhe
7. Testar fluxo completo
