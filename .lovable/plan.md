
# Plano: Revisão de Tipos de Evento e Seleção de Modalidades Esportivas

## Contexto e Objetivo

O sistema de agendamento das Unidades Locais precisa de duas melhorias:
1. **Revisar as opções de tipo de evento** para eliminar redundâncias
2. **Adicionar seleção de modalidades esportivas** quando o evento for esportivo, permitindo múltipla seleção

O objetivo final é gerar relatórios e dashboards com panorama geral de todas as atividades esportivas em andamento e agendadas.

---

## Análise Atual

### Tipos de Uso Existentes (TIPOS_USO)
```
"Evento Esportivo"    ← Genérico
"Treinamento"         ← Pode ser esportivo
"Competição"          ← Redundante com "Evento Esportivo"
"Evento Cultural"     ← OK
"Reunião"             ← OK
"Aula"                ← Pode ser esportiva
"Cerimônia"           ← OK
"Outro"               ← OK
```

**Problemas identificados:**
- "Evento Esportivo" e "Competição" são redundantes
- "Treinamento" e "Aula" podem ser esportivos mas não capturam a modalidade
- Não há como saber qual modalidade esportiva está sendo praticada

---

## Solução Proposta

### 1. Nova Categorização de Tipos de Evento

Reorganizar em categorias claras e não-redundantes:

| Categoria | Tipo de Evento | É Esportivo? |
|-----------|----------------|--------------|
| **Esportivo** | Competição Esportiva | Sim |
| **Esportivo** | Treinamento/Treino | Sim |
| **Esportivo** | Aula/Escolinha | Sim |
| **Esportivo** | Festival Esportivo | Sim |
| **Esportivo** | Seletiva/Peneira | Sim |
| **Esportivo** | Amistoso | Sim |
| **Cultural** | Evento Cultural | Não |
| **Cultural** | Show/Apresentação | Não |
| **Institucional** | Reunião | Não |
| **Institucional** | Cerimônia/Solenidade | Não |
| **Institucional** | Palestra/Workshop | Não |
| **Comunitário** | Ação Comunitária | Não |
| **Comunitário** | Feira/Exposição | Não |
| **Outro** | Outro | Configurável |

### 2. Lista de Modalidades Esportivas

Baseado nas federações ativas do sistema e modalidades comuns:

```
Futebol, Futsal, Vôlei, Vôlei de Praia, Basquete, Handebol,
Natação, Ciclismo, Atletismo, Boxe, Wrestling/Luta Olímpica,
Ginástica, Tênis, Beach Tennis, Xadrez, Flag Football,
Futebol Americano, Judô, Jiu-Jitsu, Karatê, Taekwondo,
Capoeira, Musculação/Fitness, Hidroginástica, Dança, Outro
```

### 3. Comportamento Dinâmico do Formulário

Quando o usuário seleciona um tipo de evento **esportivo**:
- Aparece um campo de seleção múltipla de modalidades
- O campo é obrigatório para tipos esportivos
- Permite selecionar uma ou mais modalidades

---

## Alterações no Banco de Dados

### Migração SQL

```sql
-- Adicionar coluna para armazenar modalidades esportivas (array de texto)
ALTER TABLE agenda_unidade 
ADD COLUMN IF NOT EXISTS modalidades_esportivas text[] DEFAULT '{}';

-- Criar índice GIN para buscas eficientes por modalidade
CREATE INDEX IF NOT EXISTS idx_agenda_modalidades 
ON agenda_unidade USING GIN (modalidades_esportivas);

-- Comentário para documentação
COMMENT ON COLUMN agenda_unidade.modalidades_esportivas 
IS 'Array de modalidades esportivas praticadas no evento';
```

---

## Alterações no Frontend

### Arquivo: `src/types/unidadesLocais.ts`

Adicionar constantes:

```typescript
// Categorias de tipos de evento
export const CATEGORIAS_EVENTO = {
  esportivo: 'Esportivo',
  cultural: 'Cultural',
  institucional: 'Institucional',
  comunitario: 'Comunitário',
  outro: 'Outro',
} as const;

// Tipos de evento revisados
export const TIPOS_EVENTO = [
  // Esportivos
  { value: 'competicao_esportiva', label: 'Competição Esportiva', categoria: 'esportivo' },
  { value: 'treinamento', label: 'Treinamento/Treino', categoria: 'esportivo' },
  { value: 'aula_escolinha', label: 'Aula/Escolinha', categoria: 'esportivo' },
  { value: 'festival_esportivo', label: 'Festival Esportivo', categoria: 'esportivo' },
  { value: 'seletiva', label: 'Seletiva/Peneira', categoria: 'esportivo' },
  { value: 'amistoso', label: 'Amistoso', categoria: 'esportivo' },
  // Culturais
  { value: 'evento_cultural', label: 'Evento Cultural', categoria: 'cultural' },
  { value: 'show_apresentacao', label: 'Show/Apresentação', categoria: 'cultural' },
  // Institucionais
  { value: 'reuniao', label: 'Reunião', categoria: 'institucional' },
  { value: 'cerimonia', label: 'Cerimônia/Solenidade', categoria: 'institucional' },
  { value: 'palestra_workshop', label: 'Palestra/Workshop', categoria: 'institucional' },
  // Comunitários
  { value: 'acao_comunitaria', label: 'Ação Comunitária', categoria: 'comunitario' },
  { value: 'feira_exposicao', label: 'Feira/Exposição', categoria: 'comunitario' },
  // Outro
  { value: 'outro', label: 'Outro', categoria: 'outro' },
] as const;

// Modalidades esportivas
export const MODALIDADES_ESPORTIVAS = [
  'Futebol',
  'Futsal',
  'Vôlei',
  'Vôlei de Praia',
  'Basquete',
  'Handebol',
  'Natação',
  'Ciclismo',
  'Atletismo',
  'Boxe',
  'Wrestling/Luta Olímpica',
  'Ginástica',
  'Tênis',
  'Beach Tennis',
  'Xadrez',
  'Flag Football',
  'Futebol Americano',
  'Judô',
  'Jiu-Jitsu',
  'Karatê',
  'Taekwondo',
  'Capoeira',
  'Musculação/Fitness',
  'Hidroginástica',
  'Dança Esportiva',
  'Outro',
] as const;

// Função auxiliar para verificar se tipo é esportivo
export function isTipoEsportivo(tipoUso: string): boolean {
  const tipo = TIPOS_EVENTO.find(t => t.value === tipoUso);
  return tipo?.categoria === 'esportivo';
}
```

### Arquivo: `src/components/unidades/AgendaTab.tsx`

**Mudanças principais:**

1. **Importar novos tipos**
2. **Atualizar formData** para incluir `modalidades_esportivas: string[]`
3. **Substituir Select de tipo_uso** por agrupado por categoria
4. **Adicionar componente de seleção múltipla de modalidades** (visível apenas para tipos esportivos)
5. **Validar modalidades** antes de submeter (obrigatório se esportivo)
6. **Incluir modalidades na requisição** de criação de reserva

**Estrutura do formulário atualizado:**

```
┌─────────────────────────────────────────────────────────┐
│ Tipo de Evento *                                        │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ▼ Selecione o tipo de evento                       │ │
│ │   ── Esportivo ──                                   │ │
│ │   Competição Esportiva                              │ │
│ │   Treinamento/Treino                                │ │
│ │   Aula/Escolinha                                    │ │
│ │   ...                                               │ │
│ │   ── Cultural ──                                    │ │
│ │   Evento Cultural                                   │ │
│ │   ...                                               │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Modalidades Esportivas * (aparece se tipo esportivo)    │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ☑ Futebol    ☑ Futsal    ☐ Vôlei    ☐ Basquete   │ │
│ │ ☐ Handebol   ☐ Natação   ☐ Atletismo  ...         │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Componente de Seleção de Modalidades

Criar componente reutilizável `ModalidadesSelector`:
- Exibe checkboxes em grid responsivo
- Permite múltipla seleção
- Mostra badges das modalidades selecionadas
- Valida mínimo de 1 modalidade para eventos esportivos

---

## Benefícios para Relatórios

Com esta estrutura, será possível gerar:

1. **Dashboard de Atividades por Modalidade**
   - Quantas atividades de cada modalidade estão agendadas
   - Filtro por período, unidade, status

2. **Calendário Esportivo Geral**
   - Visualização de todas as atividades esportivas
   - Agrupamento por modalidade

3. **Relatório de Ocupação por Tipo**
   - Distribuição: % Esportivo vs Cultural vs Institucional
   - Ranking de modalidades mais praticadas

4. **Panorama por Unidade**
   - Quais modalidades cada unidade mais atende
   - Identificar especialização de espaços

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/types/unidadesLocais.ts` | Adicionar constantes de tipos, categorias e modalidades |
| `src/components/unidades/AgendaTab.tsx` | Atualizar formulário com Select agrupado e seletor de modalidades |
| `src/integrations/supabase/types.ts` | (Auto-atualizado após migração) |

---

## Compatibilidade com Dados Existentes

- Os registros existentes com `tipo_uso` antigo continuarão funcionando
- O campo `modalidades_esportivas` será array vazio para registros antigos
- O Select exibirá o valor antigo se não encontrar correspondência nos novos tipos
- Migração gradual: novos agendamentos usarão os novos tipos

---

## Implementação

1. Executar migração SQL para adicionar coluna `modalidades_esportivas`
2. Atualizar tipos em `unidadesLocais.ts`
3. Criar componente `ModalidadesSelector`
4. Atualizar `AgendaTab.tsx` com nova lógica de formulário
5. Testar fluxo completo de agendamento esportivo
