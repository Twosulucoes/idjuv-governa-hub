
# Plano: Integração Unidirecional - Cedência de Espaços para Federações

## Resumo Executivo

A gestão de cedências de espaços é **exclusiva do módulo Unidades Locais (DIRAF)**. O módulo de Federações apenas **visualiza** as cedências aprovadas vinculadas a cada federação, sem poder criar ou editar.

---

## Arquitetura da Solução

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                    FLUXO DE CEDÊNCIA DE ESPAÇOS                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  UNIDADES LOCAIS (DIRAF)                    FEDERAÇÕES (Visualização)   │
│  ─────────────────────────                  ────────────────────────    │
│                                                                          │
│  1. Usuário cria reserva na Agenda          ← Não pode criar            │
│  2. Marca: "Solicitante é Federação"        ← Não pode editar           │
│  3. Seleciona federação (dropdown)          ← Somente visualiza         │
│  4. DIRAF aprova via SEI                                                 │
│  5. Termo de cessão é gerado                                             │
│                     ↓                                                    │
│            [federacao_id salvo]                                          │
│                     ↓                                                    │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  RESULTADO: Federação vê na aba "Espaços Cedidos" todas as              │
│             reservas aprovadas onde ela é solicitante                    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Alterações no Banco de Dados

### 1. Adicionar coluna `federacao_id` na tabela `agenda_unidade`

```sql
ALTER TABLE public.agenda_unidade 
ADD COLUMN federacao_id UUID REFERENCES public.federacoes_esportivas(id) ON DELETE SET NULL;
```

Isso permite identificar quando uma cedência é para uma federação específica.

### 2. Criar índice para consultas otimizadas

```sql
CREATE INDEX idx_agenda_unidade_federacao ON public.agenda_unidade(federacao_id) 
WHERE federacao_id IS NOT NULL;
```

---

## Alterações no Frontend

### Arquivo 1: `src/components/unidades/AgendaTab.tsx`

Modificar o formulário de nova reserva para:

1. Adicionar campo toggle: **"Solicitante é Federação?"**
2. Se ativado, mostrar dropdown com lista de federações ativas
3. Auto-preencher dados do solicitante com dados da federação
4. Salvar `federacao_id` junto com a reserva

**Campos a adicionar no formData:**
- `is_federacao: boolean`
- `federacao_id: string | null`

**Lógica de preenchimento automático:**
- Quando federação selecionada → preenche `solicitante_nome` com nome da federação
- Preenche `solicitante_documento` com CNPJ
- Preenche `solicitante_telefone` e `solicitante_email` com contatos

---

### Arquivo 2: `src/components/federacoes/FederacaoParceriasTab.tsx`

Modificar a query da aba "Espaços" para buscar de **duas fontes**:

**Fonte 1:** Registros manuais em `federacao_espacos_cedidos` (legado/manual)

**Fonte 2:** Reservas aprovadas em `agenda_unidade` onde `federacao_id = esta_federacao`

Exibir ambos com indicador de origem:
- Badge "Via Agenda" para cedências vindas de `agenda_unidade`
- Badge "Registro Manual" para cedências de `federacao_espacos_cedidos`

**Campos a exibir da agenda:**
- Nome da Unidade Local
- Município
- Título da reserva
- Data início/fim
- Horário
- Status
- Número do protocolo

---

### Arquivo 3: Criar Dialogs de Cadastro para Parcerias e Árbitros

Como os espaços agora vêm automaticamente da agenda, precisamos apenas dos formulários para:

| Componente | Descrição |
|------------|-----------|
| `NovaParceriaDialog.tsx` | Formulário para parcerias/projetos/convênios |
| `NovoArbitroDialog.tsx` | Formulário para árbitros |

**Campos de NovaParceriaDialog:**
- Titulo (obrigatório)
- Tipo: Parceria / Projeto / Convênio / Patrocínio
- Data Início / Data Fim
- Status: Vigente / Encerrada / Suspensa / Em Análise
- Processo SEI
- Número do Termo
- Número da Portaria
- Descrição
- Observações

**Campos de NovoArbitroDialog:**
- Nome (obrigatório)
- Telefone
- Email
- Modalidades (tags/array)
- Disponibilidade (texto)
- Ativo (checkbox)
- Observações

---

## Resumo de Arquivos

### Novos Arquivos
| Arquivo | Descrição |
|---------|-----------|
| `src/components/federacoes/NovaParceriaDialog.tsx` | Dialog para cadastrar parcerias |
| `src/components/federacoes/NovoArbitroDialog.tsx` | Dialog para cadastrar árbitros |

### Arquivos a Modificar
| Arquivo | Alteração |
|---------|-----------|
| `src/components/unidades/AgendaTab.tsx` | Adicionar seletor de federação no formulário |
| `src/components/federacoes/FederacaoParceriasTab.tsx` | Buscar espaços da agenda + botões "Novo" para parcerias/árbitros |

### Migração de Banco
| Tipo | Alteração |
|------|-----------|
| ALTER TABLE | Adicionar `federacao_id` em `agenda_unidade` |
| CREATE INDEX | Índice para buscas por federação |

---

## Fluxo de Uso Final

### Na Unidade Local (DIRAF):
1. Acessar `/unidades/{id}` → Aba "Agenda"
2. Clicar "Nova Reserva"
3. Ativar toggle "Solicitante é Federação"
4. Selecionar "Federação de Atletismo de Roraima"
5. Dados auto-preenchidos
6. Definir datas, horários, espaço
7. Salvar → Status "Solicitado"
8. DIRAF aprova → Status "Aprovado"

### Na Federação (Visualização):
1. Acessar `/federacoes` → Selecionar federação
2. Ir na aba "Vínculos e Atividades" → Sub-aba "Espaços"
3. Ver lista de todos os espaços cedidos:
   - Cedências aprovadas vindas da Agenda (automático)
   - Registros manuais legados (se houver)
4. Cada card mostra: Unidade, Período, Horário, Status, Protocolo
5. **Sem botão "Novo"** - apenas visualização

---

## Benefícios

1. **Fonte única de verdade**: Cedências gerenciadas em um só lugar (Unidades)
2. **Sincronização automática**: Federação vê cedências em tempo real
3. **Controle DIRAF**: Apenas quem gerencia a unidade pode aprovar
4. **Rastreabilidade**: Vínculo direto com processo SEI e termos
5. **Retrocompatível**: Registros manuais existentes continuam visíveis

---

## Ordem de Implementação

1. Migração do banco (adicionar `federacao_id`)
2. Modificar `AgendaTab.tsx` com seletor de federação
3. Criar `NovaParceriaDialog.tsx` e `NovoArbitroDialog.tsx`
4. Atualizar `FederacaoParceriasTab.tsx`:
   - Buscar espaços da agenda
   - Adicionar botões "+ Novo" para parcerias e árbitros
   - Remover possibilidade de criar espaços manualmente
5. Testar integração completa
