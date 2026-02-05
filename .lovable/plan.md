

# Plano: Visualização de Federação em Tela Cheia

## Situação Atual

Atualmente, ao clicar no ícone de "olhinho" (Eye) na listagem de federações, o sistema abre um `Sheet` (modal lateral) que desliza da direita:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Gestão de Federações                                      Sheet    │
├─────────────────────────────────────────────────────────────────────┤
│                                                    ┌───────────────┐│
│  ┌──────────────────────────────────────────┐     │  FERR         ││
│  │ Lista de Federações                      │     │  Federação de ││
│  │                                          │     │  Remo de RR   ││
│  │  FERR | Presidente | Status | 👁️        │     │               ││
│  │  FBRR | Presidente | Status | 👁️        │     │  [Dados...]   ││
│  │  ...                                     │     │               ││
│  └──────────────────────────────────────────┘     └───────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

## Nova Experiência

Ao clicar no "olhinho", o sistema navegará para uma página dedicada em tela cheia:

```
┌─────────────────────────────────────────────────────────────────────┐
│  ← Voltar   FERR - Federação de Remo de Roraima                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  [Badge: Ativa]                    Cadastro: 15/03/2024             │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Dados │ Parcerias │ Árbitros │ Calendário                    │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │                                                               │  │
│  │  Dados da Federação                                          │  │
│  │  ─────────────────                                           │  │
│  │  CNPJ: 00.000.000/0001-00                                    │  │
│  │  Criada em: 01/01/2020                                       │  │
│  │  Endereço: Rua XYZ, 123                                      │  │
│  │  Telefone: (95) 99999-9999                                   │  │
│  │  Email: contato@ferr.org.br                                  │  │
│  │                                                               │  │
│  │  Mandato Atual                                               │  │
│  │  ─────────────                                               │  │
│  │  01/01/2024 até 31/12/2027                                   │  │
│  │                                                               │  │
│  │  Presidente                                                  │  │
│  │  ──────────                                                  │  │
│  │  João da Silva                                               │  │
│  │  Nascimento: 15/05/1980                                      │  │
│  │  ...                                                         │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  [Aprovar] [Editar Dados] [🗑️]                                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/federacoes/FederacaoDetalhePage.tsx` | Nova página de detalhe em tela cheia |

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/App.tsx` | Adicionar rota `/admin/federacoes/:id` |
| `src/pages/federacoes/GestaoFederacoesPage.tsx` | Alterar `handleViewDetails` para navegar em vez de abrir Sheet |
| `src/types/auth.ts` | Adicionar permissão para a nova rota |

## Detalhamento Tecnico

### 1. Nova Pagina FederacaoDetalhePage.tsx

A nova pagina tera:

- Cabecalho com botao "Voltar" e titulo da federacao (sigla + nome)
- Badge de status e data de cadastro
- Tabs organizadas:
  - **Dados**: Informacoes da federacao, mandato, presidente e dirigentes
  - **Parcerias**: Componente `FederacaoParceriasTab` existente
  - **Calendario**: Componente `CalendarioFederacaoTab` existente
- Botoes de acao: Aprovar/Rejeitar/Inativar, Editar, Excluir
- Dialogs de confirmacao (reutilizando a logica existente)

### 2. Alteracao na Rota (App.tsx)

Adicionar nova rota:
```typescript
<Route 
  path="/admin/federacoes/:id" 
  element={<ProtectedRoute><FederacaoDetalhePage /></ProtectedRoute>} 
/>
```

### 3. Navegacao em vez de Modal

Alterar `handleViewDetails` em `GestaoFederacoesPage.tsx`:

```typescript
// Antes (abre modal):
const handleViewDetails = (federacao: Federacao) => {
  setSelectedFederacao(federacao);
  setSheetOpen(true);
};

// Depois (navega para pagina):
const handleViewDetails = (federacao: Federacao) => {
  navigate(`/admin/federacoes/${federacao.id}`);
};
```

### 4. Remocao do Sheet

Remover:
- Estado `sheetOpen` e `selectedFederacao`
- Componente `Sheet` e todo seu conteudo (linhas 478-750)
- Imports nao utilizados (Sheet, SheetContent, etc)

### 5. Estrutura da Nova Pagina

```typescript
export default function FederacaoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Query para buscar federacao
  const { data: federacao, isLoading } = useQuery({...});
  
  return (
    <AdminLayout>
      {/* Cabecalho com Voltar */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/admin/federacoes')}>
          <ArrowLeft /> Voltar
        </Button>
        <div>
          <h1>{federacao.sigla}</h1>
          <p>{federacao.nome}</p>
        </div>
      </div>
      
      {/* Status e acoes */}
      <div className="flex justify-between mb-6">
        <Badge>{status}</Badge>
        <div className="flex gap-2">
          {/* Botoes de acao baseados no status */}
        </div>
      </div>
      
      {/* Conteudo em Tabs */}
      <Tabs defaultValue="dados">
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="parcerias">Parcerias e Arbitros</TabsTrigger>
          <TabsTrigger value="calendario">Calendario</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dados">
          {/* Dados da federacao, mandato, dirigentes */}
        </TabsContent>
        
        <TabsContent value="parcerias">
          <FederacaoParceriasTab ... />
        </TabsContent>
        
        <TabsContent value="calendario">
          <CalendarioFederacaoTab ... />
        </TabsContent>
      </Tabs>
      
      {/* Dialogs de confirmacao */}
    </AdminLayout>
  );
}
```

## Beneficios

1. **Mais espaco**: Aproveitamento total da tela para exibir informacoes
2. **Melhor navegacao**: URL propria permite compartilhamento e bookmark
3. **Consistencia**: Segue o padrao das outras paginas de detalhe (Servidor, Unidade)
4. **Mobile-friendly**: Layout responsivo que se adapta melhor em dispositivos moveis

## Ordem de Implementacao

1. Criar `FederacaoDetalhePage.tsx` com toda a logica migrada do Sheet
2. Adicionar rota no `App.tsx`
3. Adicionar permissao no `src/types/auth.ts`
4. Modificar `GestaoFederacoesPage.tsx` para usar navegacao
5. Remover codigo do Sheet nao utilizado
6. Testar navegacao e funcionalidades

