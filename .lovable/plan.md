
# Plano: Correção do Agendamento - Federações e Instituições

## Problemas Identificados

### Problema 1: Federações não aparecem no agendamento
**Causa raiz**: A query no `AgendaTab.tsx` filtra por `.eq('status', 'ativa')` (feminino), mas os dados no banco estão com status `'ativo'` (masculino).

```text
CÓDIGO ATUAL (linha 86):
  .eq('status', 'ativa')  ← ERRADO

DADOS NO BANCO:
  status: 'ativo'         ← CORRETO (14 federações ativas)
```

### Problema 2: Campo CPF ainda aparece ao selecionar Instituição
**Causa raiz**: Os campos de dados do solicitante (nome, documento, telefone, email) só são desabilitados quando uma **federação** está selecionada:

```text
disabled={isFederacao && !!selectedFederacaoId}  ← Só considera federação!
```

Quando uma **instituição** é selecionada, os campos:
- Recebem os dados da instituição (nome e CNPJ)
- MAS continuam editáveis (não são desabilitados)
- E NÃO preenchem telefone e email do responsável

### Problema 3: Dados incompletos da Instituição
O `InstituicaoSelector` só passa `nome_razao_social` e `cnpj`, mas não passa os dados de contato do responsável (`responsavel_telefone`, `responsavel_email`).

---

## Solução Proposta

### Correção 1: Ajustar filtro de federações
Alterar a query para usar o status correto:
```typescript
.eq('status', 'ativo')  // Masculino, igual ao banco
```

### Correção 2: Expandir dados do InstituicaoSelector
Modificar o hook e o componente para retornar e passar os dados de contato:
- `responsavel_telefone`
- `responsavel_email`
- `responsavel_cpf` (para usar como documento quando não tem CNPJ)

### Correção 3: Desabilitar campos quando Instituição selecionada
Modificar a lógica de `disabled` dos campos para considerar ambos os casos:
```typescript
disabled={(isFederacao && !!selectedFederacaoId) || (isInstituicao && !!selectedInstituicaoId)}
```

### Correção 4: Auto-preencher dados completos da Instituição
No callback do `InstituicaoSelector`, preencher todos os campos:
- `solicitante_nome` ← nome_razao_social
- `solicitante_documento` ← cnpj OU responsavel_cpf (se informal)
- `solicitante_telefone` ← responsavel_telefone
- `solicitante_email` ← responsavel_email

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/unidades/AgendaTab.tsx` | Corrigir filtro de federações; desabilitar campos para instituição; preencher dados completos |
| `src/hooks/useInstituicoes.ts` | Incluir campos de contato no seletor |
| `src/components/instituicoes/InstituicaoSelector.tsx` | Passar dados de contato no callback |

---

## Detalhamento Técnico

### 1. AgendaTab.tsx

**Query de federações (linha 86)**:
```typescript
// DE:
.eq('status', 'ativa')

// PARA:
.eq('status', 'ativo')
```

**Callback do InstituicaoSelector (linhas 577-586)**:
```typescript
// DE:
onChange={(id, inst) => {
  setSelectedInstituicaoId(id || '');
  if (inst) {
    setFormData(prev => ({
      ...prev,
      solicitante_nome: inst.nome_razao_social,
      solicitante_documento: inst.cnpj || '',
    }));
  }
}}

// PARA:
onChange={(id, inst) => {
  setSelectedInstituicaoId(id || '');
  if (inst) {
    setFormData(prev => ({
      ...prev,
      solicitante_nome: inst.nome_razao_social,
      solicitante_documento: inst.cnpj || inst.responsavel_cpf || '',
      solicitante_telefone: inst.responsavel_telefone || '',
      solicitante_email: inst.responsavel_email || '',
    }));
  } else {
    // Limpar campos se desmarcar
    setFormData(prev => ({
      ...prev,
      solicitante_nome: '',
      solicitante_documento: '',
      solicitante_telefone: '',
      solicitante_email: '',
    }));
  }
}}
```

**Campos do formulário (linhas 600-630)**:
```typescript
// Adicionar lógica de disabled para instituição
const isSolicitantePreenchido = 
  (isFederacao && !!selectedFederacaoId) || 
  (isInstituicao && !!selectedInstituicaoId);

// Em cada Input:
disabled={isSolicitantePreenchido}
```

**Adicionar useEffect para limpar dados ao desmarcar instituição**:
```typescript
useEffect(() => {
  if (!isInstituicao) {
    setSelectedInstituicaoId('');
    // Só limpa se não for federação também
    if (!isFederacao) {
      setFormData(prev => ({
        ...prev,
        solicitante_nome: '',
        solicitante_documento: '',
        solicitante_telefone: '',
        solicitante_email: '',
      }));
    }
  }
}, [isInstituicao, isFederacao]);
```

### 2. useInstituicoes.ts

**Função `useInstituicoesSelector` (linha 184)**:
```typescript
// DE:
.select('id, codigo_instituicao, nome_razao_social, tipo_instituicao, cnpj, responsavel_nome')

// PARA:
.select('id, codigo_instituicao, nome_razao_social, tipo_instituicao, cnpj, responsavel_nome, responsavel_cpf, responsavel_telefone, responsavel_email')
```

### 3. InstituicaoSelector.tsx

**Interface do callback (linhas 32-38)**:
```typescript
// DE:
onChange: (id: string | undefined, instituicao?: {
  id: string;
  nome_razao_social: string;
  cnpj?: string;
  responsavel_nome?: string;
  tipo_instituicao: TipoInstituicao;
}) => void;

// PARA:
onChange: (id: string | undefined, instituicao?: {
  id: string;
  nome_razao_social: string;
  cnpj?: string;
  responsavel_nome?: string;
  responsavel_cpf?: string;
  responsavel_telefone?: string;
  responsavel_email?: string;
  tipo_instituicao: TipoInstituicao;
}) => void;
```

**Callback de seleção (linhas 155-161)**:
```typescript
// DE:
onChange(inst.id, {
  id: inst.id,
  nome_razao_social: inst.nome_razao_social,
  cnpj: inst.cnpj || undefined,
  responsavel_nome: inst.responsavel_nome,
  tipo_instituicao: inst.tipo_instituicao,
});

// PARA:
onChange(inst.id, {
  id: inst.id,
  nome_razao_social: inst.nome_razao_social,
  cnpj: inst.cnpj || undefined,
  responsavel_nome: inst.responsavel_nome,
  responsavel_cpf: inst.responsavel_cpf || undefined,
  responsavel_telefone: inst.responsavel_telefone || undefined,
  responsavel_email: inst.responsavel_email || undefined,
  tipo_instituicao: inst.tipo_instituicao,
});
```

---

## Comportamento Esperado Após Correção

| Cenário | Comportamento |
|---------|---------------|
| Usuário seleciona Federação | Campos preenchidos automaticamente e desabilitados |
| Usuário seleciona Instituição Formal | Campos preenchidos com CNPJ e dados do responsável, desabilitados |
| Usuário seleciona Instituição Informal | Campos preenchidos com CPF do responsável e dados de contato, desabilitados |
| Usuário desmarca toggle | Campos limpos e habilitados para preenchimento manual |
| Dropdown de federações | Mostra todas as 14 federações ativas do banco |

---

## Ordem de Implementação

1. Corrigir filtro de federações no `AgendaTab.tsx`
2. Expandir campos no `useInstituicoesSelector`
3. Atualizar interface e callback no `InstituicaoSelector.tsx`
4. Implementar lógica completa de auto-preenchimento e disabled no `AgendaTab.tsx`
5. Testar fluxo completo de agendamento
