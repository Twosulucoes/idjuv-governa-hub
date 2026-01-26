
# Calendário de Competições das Federações Esportivas

## Resumo

Implementar um sistema de calendário para registrar e visualizar as competições e campeonatos organizados por cada federação esportiva. O calendário será acessível na administração das federações, permitindo cadastrar eventos com datas, locais e informações relevantes.

---

## Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────┐
│                    GestaoFederacoesPage                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Sheet de Detalhes (existente)                            │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  Nova Aba: "Calendário de Competições"              │  │  │
│  │  │  - Visualização mensal                              │  │  │
│  │  │  - Listagem de eventos                              │  │  │
│  │  │  - Botão adicionar competição                       │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Etapas de Implementação

### 1. Criação da Tabela no Banco de Dados

Nova tabela `calendario_federacao` para armazenar os eventos:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `federacao_id` | UUID | Referência à federação |
| `titulo` | TEXT | Nome da competição |
| `descricao` | TEXT | Descrição detalhada |
| `tipo` | TEXT | Tipo (Campeonato Estadual, Torneio, Copa, etc.) |
| `data_inicio` | DATE | Data de início |
| `data_fim` | DATE | Data de término |
| `local` | TEXT | Local do evento |
| `cidade` | TEXT | Cidade |
| `publico_estimado` | INTEGER | Público estimado |
| `categorias` | TEXT | Categorias participantes |
| `observacoes` | TEXT | Observações adicionais |
| `status` | TEXT | Status (planejado, confirmado, em_andamento, concluido, cancelado) |
| `created_at` | TIMESTAMP | Data de criação |
| `created_by` | UUID | Usuário que criou |

RLS configurado para permitir leitura/escrita apenas por usuários autenticados.

### 2. Componente de Calendário

Criar `src/components/federacoes/CalendarioFederacaoTab.tsx`:

- Visualização em calendário mensal (baseado no AgendaTab existente)
- Navegação entre meses
- Indicadores visuais de eventos por dia
- Lista de eventos ao clicar em um dia
- Cores diferenciadas por status

### 3. Dialog de Nova Competição

Criar `src/components/federacoes/NovaCompeticaoDialog.tsx`:

Campos do formulário:
- Título da Competição (obrigatório)
- Tipo de Competição (select)
- Data de Início e Fim (obrigatórios)
- Local e Cidade
- Categorias Participantes
- Público Estimado
- Descrição/Observações
- Status

### 4. Integração na Gestão de Federações

Modificar `src/pages/federacoes/GestaoFederacoesPage.tsx`:

- Adicionar aba/seção de calendário no Sheet de detalhes
- Ou criar botão dedicado para abrir calendário completo
- Integrar componentes de calendário e formulário

---

## Tipos de Competição Disponíveis

- Campeonato Estadual
- Campeonato Regional
- Torneio
- Copa
- Festival
- Jogos Abertos
- Seletiva
- Amistoso
- Outro

---

## Status dos Eventos

| Status | Cor | Descrição |
|--------|-----|-----------|
| Planejado | Amarelo | Evento em planejamento |
| Confirmado | Azul | Evento confirmado |
| Em Andamento | Verde | Evento acontecendo |
| Concluído | Cinza | Evento finalizado |
| Cancelado | Vermelho | Evento cancelado |

---

## Arquivos a Criar

1. `supabase/migrations/[timestamp]_calendario_federacao.sql` - Migração do banco
2. `src/components/federacoes/CalendarioFederacaoTab.tsx` - Componente de calendário
3. `src/components/federacoes/NovaCompeticaoDialog.tsx` - Dialog de cadastro

## Arquivos a Modificar

1. `src/pages/federacoes/GestaoFederacoesPage.tsx` - Integrar calendário no Sheet
2. `src/integrations/supabase/types.ts` - Será atualizado automaticamente

---

## Seção Técnica

### Migração SQL

```sql
CREATE TABLE public.calendario_federacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    federacao_id UUID NOT NULL REFERENCES public.federacoes_esportivas(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    tipo TEXT NOT NULL DEFAULT 'Campeonato',
    data_inicio DATE NOT NULL,
    data_fim DATE,
    local TEXT,
    cidade TEXT,
    publico_estimado INTEGER,
    categorias TEXT,
    observacoes TEXT,
    status TEXT NOT NULL DEFAULT 'planejado',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.calendario_federacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem visualizar calendário"
ON public.calendario_federacao FOR SELECT TO authenticated USING (true);

CREATE POLICY "Autenticados podem gerenciar calendário"
ON public.calendario_federacao FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Índice para performance
CREATE INDEX idx_calendario_federacao_id ON public.calendario_federacao(federacao_id);
CREATE INDEX idx_calendario_data ON public.calendario_federacao(data_inicio);
```

### Estrutura do Componente CalendarioFederacaoTab

```typescript
interface CalendarioFederacaoTabProps {
  federacaoId: string;
  federacaoSigla: string;
}

// Reutiliza padrões do AgendaTab existente
// - useState para mês atual e dia selecionado
// - useQuery para buscar eventos do mês
// - Calendário visual com grid de 7 colunas
// - Dialog para adicionar/editar eventos
```

### Query de Eventos

```typescript
const { data: eventos } = useQuery({
  queryKey: ['calendario-federacao', federacaoId, currentMonth],
  queryFn: async () => {
    const start = startOfMonth(currentMonth).toISOString();
    const end = endOfMonth(currentMonth).toISOString();
    
    const { data, error } = await supabase
      .from('calendario_federacao')
      .select('*')
      .eq('federacao_id', federacaoId)
      .gte('data_inicio', start)
      .lte('data_inicio', end)
      .order('data_inicio');
    
    if (error) throw error;
    return data;
  }
});
```

---

## Resultado Esperado

Ao acessar os detalhes de uma federação na administração, haverá uma seção de "Calendário de Competições" onde será possível:

1. Visualizar todos os eventos em formato de calendário mensal
2. Adicionar novas competições com todos os detalhes relevantes
3. Editar ou excluir competições existentes
4. Filtrar por status e navegar entre meses
5. Ver detalhes completos ao clicar em um evento
