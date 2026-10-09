# Workflow de Fechamento da Folha de Pagamento

## Visão Geral

O workflow de fechamento da folha de pagamento implementa controle de governança com estados claros, regras de bloqueio e auditoria completa.

## Estados da Folha

| Status | Descrição | Edição Permitida |
|--------|-----------|------------------|
| `previa` | Folha em preparação inicial | ✅ Sim |
| `aberta` | Folha pronta para processamento | ✅ Sim |
| `processando` | Em conferência pelo RH | ✅ Sim |
| `fechada` | Folha oficial, bloqueada | ❌ Não |
| `reaberta` | Reaberta por super_admin | ✅ Sim |

## Fluxo de Transições

```
previa → aberta → processando → fechada
                      ↑              ↓
                      └── reaberta ←┘
```

## Regras de Fechamento

### Quem pode fechar?
- Usuários com permissão `rh.admin`
- Super administradores (`super_admin`)

### Quem pode reabrir?
- **Apenas** super administradores (`super_admin`)
- Requer justificativa obrigatória

## Proteções de Imutabilidade

Quando a folha está **fechada**:

1. **Fichas financeiras**: Bloqueadas para UPDATE e DELETE
2. **Itens de fichas**: Bloqueados para UPDATE e DELETE
3. **Contracheques**: Gerados a partir de dados imutáveis

### Triggers de Proteção

```sql
-- Bloqueia alteração em fichas de folhas fechadas
trg_bloquear_alteracao_ficha_fechada

-- Bloqueia exclusão de fichas de folhas fechadas
trg_bloquear_exclusao_ficha_fechada

-- Bloqueia alteração/exclusão de itens de fichas
trg_bloquear_alteracao_item_ficha_fechada
```

## Auditoria

### Tabela: `folha_historico_status`

Registra todas as transições de status:
- `folha_id`: ID da folha
- `status_anterior`: Status antes da transição
- `status_novo`: Novo status
- `usuario_id`: Quem realizou a ação
- `usuario_nome`: Nome do usuário
- `justificativa`: Motivo da transição
- `ip_address`: IP do cliente
- `created_at`: Data/hora da transição

### Campos de Governança na Folha

| Campo | Descrição |
|-------|-----------|
| `fechado_por` | UUID do usuário que fechou |
| `fechado_em` | Data/hora do fechamento |
| `justificativa_fechamento` | Justificativa opcional |
| `reaberto_por` | UUID do super_admin que reabriu |
| `reaberto_em` | Data/hora da reabertura |
| `justificativa_reabertura` | Justificativa obrigatória |
| `conferido_por` | UUID de quem enviou para conferência |
| `conferido_em` | Data/hora do envio para conferência |

## RPCs Disponíveis

### `fechar_folha(p_folha_id, p_justificativa)`
Fecha uma folha de pagamento.
- Requer permissão `rh.admin` ou `super_admin`
- Folha deve estar `aberta` ou `processando`

### `reabrir_folha(p_folha_id, p_justificativa)`
Reabre uma folha fechada.
- **Apenas** `super_admin`
- Justificativa obrigatória
- Folha deve estar `fechada`

### `enviar_folha_conferencia(p_folha_id)`
Envia folha para conferência.
- Requer permissão `rh.admin` ou `super_admin`
- Folha deve estar `aberta` ou `reaberta`

### `folha_esta_bloqueada(p_folha_id)`
Verifica se folha está bloqueada para edição.
- Retorna `true` se status = `fechada`

### `usuario_pode_fechar_folha(p_user_id)`
Verifica se usuário pode fechar folhas.

### `usuario_pode_reabrir_folha(p_user_id)`
Verifica se usuário pode reabrir folhas (apenas super_admin).

## Componentes Frontend

### Hook: `useFechamentoFolha`

```typescript
import { 
  usePermissoesFolha,
  useFolhaBloqueada,
  useHistoricoStatusFolha,
  useFecharFolha,
  useReabrirFolha,
  useEnviarConferencia 
} from '@/hooks/useFechamentoFolha';
```

### Dialogs

- `FecharFolhaDialog`: Confirma fechamento com justificativa opcional
- `ReabrirFolhaDialog`: Confirma reabertura com justificativa obrigatória
- `HistoricoStatusFolhaDialog`: Exibe timeline de transições

### Indicadores

- `StatusFolhaIndicator`: Badge com ícone e tooltip
- `AcoesFechamentoFolha`: Painel de ações por status

## Segurança

### RLS (Row Level Security)

A tabela `folha_historico_status`:
- SELECT: Apenas RH e super_admin
- INSERT: Apenas usuários autenticados
- UPDATE: Bloqueado (imutável)
- DELETE: Bloqueado (imutável)

### Bypass

Super administradores podem:
- Reabrir folhas fechadas (com justificativa)
- Alterar fichas de folhas fechadas (emergência)

Todas as ações de bypass são registradas no `audit_logs`.
