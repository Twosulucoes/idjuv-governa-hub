
# Plano: Corrigir e Melhorar o Dev Mode Switcher

## Diagnóstico

O sistema de simulação de perfis (**Dev Mode**) está com os seguintes problemas:

1. **Atualização não reflete instantaneamente**: Quando você troca de role ou módulos, a sidebar não atualiza em tempo real
2. **Falta indicador visual**: Não tem como saber se o modo de teste está ativo sem abrir o painel
3. **Difícil visualizar módulos ativos**: Os módulos aparecem como códigos técnicos, não nomes amigáveis
4. **O menu não reage às mudanças**: O `MenuContext` não está reagindo ao evento de mudança do Dev Mode

---

## Solução Proposta

### 1. Corrigir a Atualização Instantânea

Fazer o `MenuContext` também escutar o evento `dev-mode-changed` para forçar re-renderização do menu lateral quando trocar permissões.

**Arquivo**: `src/contexts/MenuContext.tsx`

- Adicionar listener para `dev-mode-changed`
- Forçar recálculo das seções visíveis

### 2. Adicionar Indicador Visual Persistente

Mostrar um banner ou badge quando o Dev Mode está ativo para ficar claro que está simulando.

**Arquivo**: `src/components/dev/DevModeSwitcher.tsx`

- Adicionar badge flutuante no topo da tela quando ativo
- Mostrar role e quantidade de módulos selecionados
- Cor diferenciada (ex: amarelo/laranja de alerta)

### 3. Melhorar Interface do Painel

Substituir códigos técnicos por nomes legíveis.

**Arquivo**: `src/components/dev/DevModeSwitcher.tsx`

- Usar `MODULES_CONFIG` para mostrar nomes (ex: "Recursos Humanos" em vez de "rh")
- Agrupar módulos por categoria
- Adicionar ícones dos módulos

### 4. Forçar Atualização Sem Reload

Eliminar a necessidade de `window.location.reload()` ao ativar/desativar.

**Arquivos**: 
- `src/hooks/useModulosUsuario.ts`
- `src/contexts/MenuContext.tsx`

---

## Alterações Técnicas

### `src/contexts/MenuContext.tsx`
```text
+ Adicionar useEffect com listener para 'dev-mode-changed'
+ Criar estado forceUpdate para forçar re-render
+ O listener incrementa forceUpdate quando recebe evento
```

### `src/components/dev/DevModeSwitcher.tsx`
```text
+ Importar MODULES_CONFIG para nomes amigáveis
+ Adicionar badge flutuante quando devModeEnabled
+ Mostrar nome do módulo ao invés de código
+ Remover window.location.reload() ao ativar/desativar
+ Usar evento para atualizar componentes
```

### `src/hooks/useModulosUsuario.ts`
```text
+ Garantir que o callback fetchModulosUsuario seja chamado
  imediatamente após mudança de overrides
```

---

## Resultado Esperado

1. **Botão de engrenagem** (já existe) abre o painel
2. **Banner laranja no topo** quando Dev Mode ativo: "🔧 Simulando: Admin com 5 módulos"
3. **Troca de role** atualiza sidebar instantaneamente
4. **Toggle de módulos** mostra/esconde seções em tempo real
5. **Nomes amigáveis** no painel (ex: "Financeiro" em vez de "financeiro")

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/contexts/MenuContext.tsx` | Adicionar listener para `dev-mode-changed` |
| `src/components/dev/DevModeSwitcher.tsx` | Melhorar UI + adicionar banner + nomes amigáveis |
| `src/hooks/useModulosUsuario.ts` | Pequeno ajuste no listener |
