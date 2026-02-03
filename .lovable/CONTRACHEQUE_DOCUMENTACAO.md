# Sistema de Contracheques - IDJUV

## Visão Geral

O sistema de contracheques permite a geração e visualização de holerites dos servidores, consumindo os resultados do motor de cálculo da folha de pagamento.

## Funcionalidades

### 1. Geração de PDF

O arquivo `src/lib/pdfContracheque.ts` implementa:

- **`generateContracheque()`**: Gera contracheque individual de um servidor
- **`generateContrachequeEmLote()`**: Gera PDF consolidado com contracheques de múltiplos servidores

#### Elementos do Contracheque

| Seção | Conteúdo |
|-------|----------|
| Cabeçalho | Logos institucionais, título "CONTRACHEQUE", competência |
| Identificação | Nome, CPF, matrícula, cargo, lotação, PIS/PASEP |
| Proventos | Lista de rubricas de proventos com código, descrição, referência e valor |
| Descontos | Lista de rubricas de descontos com código, descrição, referência e valor |
| Totais | Total de proventos, total de descontos, valor líquido em destaque |
| Tributos | Bases de cálculo (INSS, IRRF), valores deduzidos, dependentes IRRF |
| Rodapé | Sistema gerador, data/hora de emissão, numeração de página |

### 2. Tela "Meu Contracheque" (Servidor)

**Rota:** `/rh/meu-contracheque`

**Arquivo:** `src/pages/rh/MeuContrachequePage.tsx`

**Funcionalidades:**
- Visualização dos contracheques do próprio servidor logado
- Filtro por ano
- Download individual de PDF
- Exibição de proventos, descontos e líquido

**Segurança:**
- Servidor vê apenas seus próprios contracheques
- Vínculo automático via `user_id` na tabela `servidores`

### 3. Consulta de Contracheques (RH)

**Rota:** `/rh/contracheques`

**Arquivo:** `src/pages/rh/ConsultaContrachequesPage.tsx`

**Funcionalidades:**
- Listagem de contracheques de todos os servidores
- Filtros por ano, mês e busca textual (nome, CPF, matrícula)
- Visualização detalhada em modal com abas (Resumo, Rubricas, Tributos)
- Download individual de PDF
- Geração em lote (PDF consolidado)

**Permissão:** `rh.servidores.visualizar`

## Hooks

### `useContracheque.ts`

| Hook | Descrição |
|------|-----------|
| `useMeusContracheques()` | Busca contracheques do servidor logado |
| `useContrachequesRH(filtros)` | Busca todos os contracheques (RH) |
| `useContrachequeDetalhe(fichaId)` | Busca detalhe com rubricas |
| `useLogAcessoContracheque()` | Registra log de visualização/impressão |
| `useServidorLogado()` | Verifica se usuário está vinculado a servidor |

## Rastreabilidade

Todos os acessos a contracheques são registrados na tabela `audit_logs`:

```json
{
  "action": "view",
  "entity_type": "contracheque",
  "entity_id": "<ficha_id>",
  "metadata": { "acao": "visualizar" | "imprimir" }
}
```

## Fluxo de Dados

```
┌─────────────────────┐
│ fichas_financeiras  │
│ (resultado do motor)│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ itens_ficha_        │
│ financeira (rubricas│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐      ┌─────────────────────┐
│ useContracheque.ts  │ ──── │ Telas de consulta   │
│ (hooks React Query) │      │ MeuContracheque     │
└──────────┬──────────┘      │ ConsultaContracheque│
           │                 └─────────────────────┘
           ▼
┌─────────────────────┐
│ pdfContracheque.ts  │
│ (geração PDF)       │
└─────────────────────┘
```

## Observações Importantes

1. **Não recalcula valores**: O PDF consome dados já calculados pelo motor
2. **Padrão institucional**: Segue template visual do IDJUV (fundo branco, logos oficiais)
3. **Auditoria**: Toda visualização e impressão é logada
4. **Segurança**: RLS aplicado no banco + verificação no frontend
