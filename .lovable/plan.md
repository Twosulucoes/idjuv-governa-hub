
# Plano: Simplificar Sistema de Acesso por Modulos

## Diagnostico do Problema

O sistema atual possui duas camadas de controle de acesso que operam de forma independente:

```text
+------------------+          +------------------+
| Sistema Modulos  |          | Sistema RBAC     |
| (usuario_modulos)|          | (usuario_perfis) |
+------------------+          +------------------+
        |                             |
        v                             v
  Filtra ROTAS              Filtra MENU e ACOES
  (ProtectedRoute)          (MenuContext/hasPermission)
```

### Problema Identificado
O usuario **Rangel**:
1. Tem `restringir_modulos = true`
2. Esta autorizado ao modulo `rh` (tabela `usuario_modulos`)
3. **Nao tem nenhum perfil associado** (tabela `usuario_perfis` vazia para ele)

### Resultado
- A rota `/rh/servidores` esta tecnicamente liberada pelo sistema de modulos
- Mas o menu de RH nao aparece porque nenhuma permissao `rh.visualizar` foi concedida via perfil
- Outros itens do menu aparecem porque nao tem `permission` definida (como Federacoes, Instituicoes)

## Solucao Proposta

Simplificar para um unico sistema: **Usar SOMENTE o RBAC (perfis e permissoes)** e remover a camada de modulos customizados.

### Opcao 1: Remover Sistema de Modulos (Recomendada)

O sistema RBAC ja cobre 100% dos casos de uso:
- Permissoes por dominio (`rh.visualizar`, `compras.criar`, etc.)
- Perfis pre-configurados que agrupam permissoes
- Filtro de menu automatico baseado nas permissoes

Beneficios:
- Uma unica fonte de verdade
- Administrador gerencia apenas perfis
- Menos confusao para usuarios e admins

### Opcao 2: Integrar Modulos com RBAC

Se preferir manter a granularidade por modulos:
- Criar **perfis por modulo** (ex: "Operador RH", "Gestor RH")
- Ao autorizar modulo, associar automaticamente o perfil correspondente
- Mostrar de forma clara na UI que modulos e perfis estao conectados

## Implementacao (Opcao 1 - Remover Modulos)

### 1. Modificar a Tab de Modulos para Orientar o Admin

Substituir a aba "Modulos" atual por uma visao simplificada que:
- Mostra quais dominios o usuario tem acesso (baseado nos perfis)
- Remove a necessidade de configurar `restringir_modulos`
- Indica claramente: "Configure os perfis para definir os acessos"

### 2. Ajustar ProtectedRoute

Remover a verificacao de `rotaAutorizada` do hook `useModulosUsuario` e confiar apenas no RBAC.

### 3. Desativar Flag `restringir_modulos`

A flag continuara no banco para migracao, mas nao sera mais usada no frontend.

### 4. Criar Perfis Especificos por Area (se necessario)

Verificar se existem perfis adequados para operadores de cada area:
- Operador RH (com `rh.visualizar`, `rh.criar`)
- Operador Compras (com `compras.visualizar`, `compras.criar`)
- etc.

## Fluxo Simplificado Pos-Implementacao

```text
+------------------+
| Usuario sem      |
| perfil associado |
+------------------+
        |
        v
  Admin associa perfil
  "Operador RH"
        |
        v
+------------------+
| Usuario com      |
| rh.visualizar    |
| rh.criar         |
+------------------+
        |
        v
  Menu RH aparece
  Rotas RH acessiveis
```

---

## Secao Tecnica

### Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/admin/UsuarioDetalhePage.tsx` | Substituir aba "Modulos" por visao de dominios acessiveis |
| `src/components/auth/ProtectedRoute.tsx` | Remover verificacao de `rotaAutorizada` de modulos |
| `src/components/admin/UsuarioModulosTab.tsx` | Refatorar para mostrar dominios ao inves de modulos |

### Migracao de Banco (Opcional)

Se quiser limpar os dados de modulos:
```sql
-- Desativar restricao de modulos para todos os usuarios
UPDATE profiles SET restringir_modulos = false;
```

### Verificacao Necessaria

Antes de implementar, precisamos verificar:
1. Criar perfis especificos para cada area se nao existirem
2. Associar permissoes corretas aos perfis existentes
3. Garantir que o perfil "Servidor" tenha pelo menos `rh.self`

### Solucao Imediata para o Usuario Rangel

Para resolver o problema agora, basta:
1. Associar um perfil ao Rangel que tenha permissoes de RH (ex: criar um perfil "Operador RH")
2. Ou associar permissoes `rh.visualizar` a um perfil existente que o Rangel possa usar

### Perfis a Criar com Permissoes

| Perfil | Permissoes |
|--------|------------|
| Operador RH | rh.visualizar, rh.criar, rh.self |
| Gestor RH | rh.visualizar, rh.criar, rh.tramitar, rh.aprovar, rh.self |
| Operador Compras | compras.visualizar, compras.criar |
| Gestor Compras | compras.visualizar, compras.criar, compras.tramitar, compras.aprovar |

