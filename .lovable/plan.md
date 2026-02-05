

# Plano: Simplificar Sistema de Atribuição de Funções a Usuários

## Diagnóstico do Sistema Atual

O sistema atual possui **múltiplas camadas de controle de acesso** que geram complexidade:

```text
+-----------------------------+     +-----------------------------+
| Sistema Legado              |     | Sistema RBAC Novo           |
| (funcoes_sistema +          |     | (permissoes +               |
|  perfil_funcoes)            |     |  perfil_permissoes)         |
+-----------------------------+     +-----------------------------+
        |                                     |
        v                                     v
  Usado pelo login              Usado na UI de admin/perfis
  (listar_permissoes_usuario)   (PerfilPermissoesPage.tsx)
```

### Problemas Identificados

1. **Duas tabelas de permissões**: `funcoes_sistema` (legado) e `permissoes` (novo RBAC)
2. **Administração fragmentada**: 
   - Permissões de PERFIL são gerenciadas em `/admin/perfis/:id/permissoes`
   - Mas não existe forma fácil de ver/atribuir funções diretamente ao USUÁRIO
3. **Fluxo indireto**: Para dar acesso a um usuário, o admin precisa:
   - Ir na gestão de Perfis
   - Configurar permissões do perfil
   - Voltar ao usuário e associar o perfil
4. **Listagem de funções confusa**: A tabela `funcoes_sistema` tem 180+ registros com estrutura hierárquica complexa

## Solução Proposta

Criar uma **página de visão consolidada** que mostra todas as funções que um usuário tem acesso, com interface simplificada.

### Fluxo Proposto

```text
/admin/usuarios/:id
        |
        v
+---------------------------------------------------+
| [Dados] [Perfis] [Funções] (nova aba)             |
+---------------------------------------------------+
|                                                   |
| Funções de Sistema (João Silva)                   |
| ------------------------------------------------  |
| Filtro: [Todos os módulos ▼] [Buscar...]          |
| ------------------------------------------------  |
|                                                   |
| 📁 ADMIN                                          |
|   ✓ admin.dashboard.visualizar (via Gestor RH)   |
|   ✓ admin.usuarios (via Super Administrador)     |
|   ✗ admin.perfis.gerenciar                        |
|                                                   |
| 📁 RH                                             |
|   ✓ rh.servidores.visualizar (via Gestor RH)     |
|   ✓ rh.servidores.criar (via Gestor RH)          |
|   ✗ rh.servidores.excluir                         |
|                                                   |
+---------------------------------------------------+
| Nota: Para alterar funções, edite os Perfis       |
+---------------------------------------------------+
```

## Implementação

### 1. Criar componente `UsuarioFuncoesTab`

Novo componente em `src/components/admin/UsuarioFuncoesTab.tsx` que:

- Lista todas as funções do sistema agrupadas por módulo
- Mostra quais estão ativas para o usuário (com nome do perfil que concedeu)
- Permite filtrar por módulo e buscar por nome
- Exibe de forma clara o que está ativo vs inativo

### 2. Atualizar `UsuarioDetalhePage`

Adicionar a nova aba "Funções" substituindo ou complementando a aba "Módulos":

- Aba "Dados": informações básicas (já existe)
- Aba "Perfis": associar perfis (já existe)
- Aba "Funções": nova visualização consolidada de todas as funções

### 3. Buscar funções do usuário

Criar query que:
1. Busca todos os perfis do usuário
2. Busca as funções de cada perfil via `perfil_funcoes`
3. Agrupa por módulo com indicação de qual perfil concedeu

---

## Seção Técnica

### Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/admin/UsuarioFuncoesTab.tsx` | Componente de visualização de funções do usuário |

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/admin/UsuarioDetalhePage.tsx` | Adicionar aba "Funções" |

### Estrutura do Componente UsuarioFuncoesTab

```typescript
interface UsuarioFuncoesTabProps {
  userId: string;
  userName?: string;
}

// Dados carregados
interface FuncaoUsuario {
  id: string;
  codigo: string;
  nome: string;
  modulo: string;
  submodulo: string | null;
  tipo_acao: string;
  concedida: boolean;
  perfilNome: string | null; // Nome do perfil que concedeu
}
```

### Query para Buscar Funções

```sql
-- Todas as funções do sistema com status de concessão para o usuário
SELECT 
  fs.id,
  fs.codigo,
  fs.nome,
  fs.modulo,
  fs.submodulo,
  fs.tipo_acao,
  CASE WHEN pf.id IS NOT NULL THEN true ELSE false END as concedida,
  p.nome as perfil_nome
FROM funcoes_sistema fs
LEFT JOIN perfil_funcoes pf ON pf.funcao_id = fs.id 
  AND pf.concedido = true
  AND pf.perfil_id IN (
    SELECT perfil_id FROM usuario_perfis 
    WHERE user_id = :userId AND ativo = true
  )
LEFT JOIN perfis p ON p.id = pf.perfil_id
WHERE fs.ativo = true
ORDER BY fs.modulo, fs.submodulo, fs.ordem
```

### Layout da Aba Funções

```text
+--------------------------------------------------+
| Filtros                                          |
| [Módulo: Todos ▼]  [🔍 Buscar função...]         |
| [Mostrar apenas ativas ☐]                        |
+--------------------------------------------------+
| 📁 admin (12 funções, 4 ativas)                  |
|   ✓ Dashboard - Visualizar         [Gestor RH]  |
|   ✓ Usuários - Gerenciar          [Admin]       |
|   ✗ Perfis - Gerenciar                           |
|   ✗ Auditoria - Visualizar                       |
|--------------------------------------------------+
| 📁 rh (25 funções, 18 ativas)                    |
|   ✓ Servidores - Visualizar        [Gestor RH]  |
|   ✓ Servidores - Criar             [Gestor RH]  |
|   ✓ Servidores - Editar            [Gestor RH]  |
|   ✗ Servidores - Excluir                         |
+--------------------------------------------------+
```

### Cores e Ícones

- Função ativa: fundo verde claro, ícone ✓ verde
- Função inativa: fundo cinza, ícone ✗ muted
- Badge do perfil: cor do perfil que concedeu

### Validação

- Somente leitura (não permite editar funções diretamente)
- Mensagem clara direcionando para a aba "Perfis" para fazer alterações
- Contador de funções ativas por módulo

