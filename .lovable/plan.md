

# Ajuste Pontual no Plano RBAC — Remoção de `admin.super`

## Resumo do Ajuste

O plano de refatoração RBAC aprovado será implementado **integralmente**, com uma única correção conceitual:

| Item | Antes | Depois |
|------|-------|--------|
| Total de permissões | 48 | **47** |
| `admin.super` | Incluída como permissão | **Removida** |
| Bypass super_admin | Via função `usuario_eh_super_admin()` | **Mantido (sem alteração)** |

---

## Justificativa Técnica

```
┌─────────────────────────────────────────────────────────────────┐
│  PROBLEMA: admin.super como permissão                          │
├─────────────────────────────────────────────────────────────────┤
│  • Redundante: super_admin já tem bypass via função            │
│  • Risco: poderia ser concedida a outros perfis por engano     │
│  • Anti-pattern: bypass não deve ser permissionável            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  SOLUÇÃO: Manter bypass exclusivamente via função              │
├─────────────────────────────────────────────────────────────────┤
│  • usuario_eh_super_admin(_user_id) → único ponto de bypass    │
│  • Não existe permissão que conceda acesso total               │
│  • super_admin = perfil especial, não permissão especial       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Lista Final de Permissões (47)

### Domínio ADMIN (6 permissões, não 7)

| Código | Descrição |
|--------|-----------|
| `admin.visualizar` | Visualizar painel administrativo |
| `admin.usuarios` | Gerenciar usuários |
| `admin.perfis` | Gerenciar perfis e permissões |
| `admin.auditoria` | Visualizar logs de auditoria |
| `admin.backup` | Gerenciar backups |
| `admin.config` | Configurações do sistema |
| ~~`admin.super`~~ | ~~Bypass total~~ **REMOVIDA** |

### Demais Domínios (41 permissões — sem alteração)

| Domínio | Quantidade | Permissões |
|---------|------------|------------|
| workflow | 8 | visualizar, criar, tramitar, despachar, aprovar, arquivar, responder, admin |
| compras | 5 | visualizar, criar, tramitar, aprovar, admin |
| contratos | 5 | visualizar, criar, tramitar, aprovar, admin |
| rh | 6 | visualizar, criar, tramitar, aprovar, self, admin |
| orcamento | 4 | visualizar, criar, aprovar, admin |
| patrimonio | 4 | visualizar, criar, tramitar, admin |
| governanca | 5 | visualizar, criar, aprovar, avaliar, admin |
| transparencia | 4 | visualizar, publicar, responder, admin |

---

## Alteração no SQL de Migração

### INSERT de Permissões (Ajustado)

O bloco de INSERT na tabela `permissoes` **não incluirá** a linha:

```sql
-- ❌ ESTA LINHA NÃO SERÁ INSERIDA:
-- ('admin.super', 'Bypass total do sistema', 'admin', 'administrar', 7)
```

### Atribuição ao super_admin (Sem Alteração)

O super_admin receberá as **47 permissões** automaticamente:

```sql
INSERT INTO perfil_permissoes (perfil_id, permissao_id, concedido)
SELECT 
  (SELECT id FROM perfis WHERE codigo = 'super_admin'),
  p.id,
  true
FROM permissoes p
ON CONFLICT (perfil_id, permissao_id) DO NOTHING;
```

O bypass total continua garantido via função, não via permissão.

---

## Validação de Não-Dependência

### Nenhuma RLS depende de `admin.super`

As políticas RLS usam:
- `usuario_eh_super_admin(auth.uid())` para bypass
- `usuario_tem_permissao(auth.uid(), 'codigo.especifico')` para permissões granulares

### Nenhuma rota/menu depende de `admin.super`

O mapeamento `NAV_PERMISSAO_MAP` não referencia `admin.super`:

```typescript
// Mapeamento final para domínio admin
'usuarios': 'admin.usuarios',
'perfis': 'admin.perfis',
'parametros': 'admin.config',
'debitos-tecnicos': 'admin.config',
'auditoria': 'admin.auditoria',
'backup': 'admin.backup',
'database': 'admin.config',
// NÃO existe referência a admin.super
```

### Nenhum hook/componente depende de `admin.super`

Os componentes `PermissionGate`, `ProtectedRoute` e `DisabledWithPermission` usam:
- `isSuperAdmin` (via AuthContext) para bypass
- Códigos de permissão granulares para verificação específica

---

## Checklist de Validação Final

| Item | Status |
|------|--------|
| `admin.super` não existe em `permissoes` | Confirmado |
| `super_admin` acessa tudo via `usuario_eh_super_admin()` | Confirmado |
| Nenhuma RLS depende de `admin.super` | Confirmado |
| Nenhuma rota/menu depende de `admin.super` | Confirmado |
| Total de permissões = 47 | Confirmado |
| Restante do plano inalterado | Confirmado |

---

## Resumo Executivo

| Aspecto | Decisão |
|---------|---------|
| Tabelas | `permissoes` e `perfil_permissoes` — sem alteração |
| Funções RPC | `usuario_tem_permissao()`, `listar_permissoes_usuario()` — sem alteração |
| Bypass | Exclusivamente via `usuario_eh_super_admin()` — sem alteração |
| Permissões | 47 (removida `admin.super`) |
| Frontend | Sem alteração |
| Políticas RLS | Sem alteração |
| Navegação | Sem alteração |

O plano será executado **integralmente** com este único ajuste conceitual.

