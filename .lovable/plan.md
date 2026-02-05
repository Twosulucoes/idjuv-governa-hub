
# Plano: Migrar Detalhes de Usuário para Página Dedicada

## Contexto do Problema

Atualmente, ao clicar em um usuário na tela de Administração de Usuários (`/admin/usuarios`), um painel lateral (Sheet) aparece à direita da tela. Este painel tem largura limitada (`sm:max-w-lg`) e, especialmente em dispositivos móveis, não permite visualizar todas as informações necessárias para a administração completa do usuário.

## Solucao Proposta

Seguindo o mesmo padrão utilizado na pagina de detalhes de Federacoes (`/admin/federacoes/:id`), a proposta e substituir o Sheet por uma pagina de detalhes dedicada em tela cheia, acessada via rota `/admin/usuarios/:id`.

## Beneficios

1. **Melhor UX**: Utilizacao total do espaco da tela para exibir informacoes
2. **URLs compartilhaveis**: Links diretos para detalhes de usuarios especificos
3. **Consistencia**: Padrao ja utilizado em outras paginas de detalhes (Federacoes, Servidores, Unidades)
4. **Mobile-first**: Melhor experiencia em dispositivos moveis

## Implementacao

### 1. Criar nova pagina `UsuarioDetalhePage.tsx`

Nova pagina em `src/pages/admin/UsuarioDetalhePage.tsx` contendo:

- **Header** com botao "Voltar", avatar, nome e email do usuario
- **Cards de acoes rapidas** (Status, Resetar Senha)
- **Tabs organizadas**:
  - **Dados**: Informacoes basicas do usuario (email, tipo, data de criacao, status)
  - **Perfis**: Lista de perfis com checkboxes para associar/desassociar
  - **Modulos**: Componente `UsuarioModulosTab` existente

```text
+--------------------------------------------------+
| [<- Voltar]  Avatar  Nome do Usuario             |
|              email@exemplo.com                   |
|              Badge: Servidor | Badge: Ativo      |
+--------------------------------------------------+
| [Bloquear/Desbloquear]  [Resetar Senha]          |
+--------------------------------------------------+
| [Dados] [Perfis] [Modulos]                       |
+--------------------------------------------------+
|                                                  |
|  Conteudo da tab selecionada                     |
|  (tela cheia, scroll vertical)                   |
|                                                  |
+--------------------------------------------------+
```

### 2. Modificar `UsuariosAdminPage.tsx`

- Remover o componente Sheet e todo seu conteudo
- Alterar `handleOpenDetails` para usar `navigate(`/admin/usuarios/${user.id}`)`
- Manter a listagem e filtros existentes

### 3. Adicionar rota no `App.tsx`

```typescript
<Route path="/admin/usuarios/:id" element={
  <ProtectedRoute requiredPermissions="admin.usuarios">
    <UsuarioDetalhePage />
  </ProtectedRoute>
} />
```

---

## Secao Tecnica

### Arquivos a criar

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/admin/UsuarioDetalhePage.tsx` | Pagina de detalhes do usuario |

### Arquivos a modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/admin/UsuariosAdminPage.tsx` | Remover Sheet, alterar navegacao para rota |
| `src/App.tsx` | Adicionar rota `/admin/usuarios/:id` |

### Dependencias reutilizadas

- `useAdminUsuarios` - hook para operacoes de usuario
- `useAdminPerfis` - hook para listar perfis
- `UsuarioModulosTab` - componente de modulos ja existente
- Componentes UI: `AdminLayout`, `Card`, `Tabs`, `Badge`, `Button`, `Avatar`, `Alert`, `Dialog`

### Fluxo de dados

1. Usuario acessa `/admin/usuarios`
2. Clica em um card de usuario
3. Navega para `/admin/usuarios/:id`
4. Pagina carrega dados do usuario via hook `useAdminUsuarios` (filtrado por ID)
5. Exibe informacoes em tela cheia com tabs
6. Botao "Voltar" retorna para `/admin/usuarios`
