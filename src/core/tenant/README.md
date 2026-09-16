# src/core/tenant — núcleo de White Label

Camada que torna o sistema **tenant-agnóstico**: o núcleo lê sua identidade de
configuração em vez de tê-la embutida.

| Arquivo | Papel |
|---|---|
| `types.ts` | Contrato `TenantConfig` — a forma de um perfil de instituição |
| `resolver.ts` | Resolve `VITE_TENANT_SLUG` → perfil; publica `TENANT_ATIVO` |
| `snapshot.ts` | Acesso **síncrono** para código não-React (geradores de PDF) |
| `tema.ts` | Injeta a paleta de marca como CSS custom properties |
| `context.ts` / `TenantProvider.tsx` | Contexto React + aplicação do tema |
| `useTenant.ts` | `useTenant`, `useIdentidade`, `useMarca`, `useModuloHabilitado` |
| `dadosOficiais.ts` | Fallback de `dados_oficiais` derivado do perfil |

## Como consumir

```tsx
// React
import { useTenant, useIdentidade } from '@/core/tenant';
const { sigla } = useIdentidade();

// Fora do React (src/lib/pdf*.ts, formatters, serviços)
import { getTenantSnapshot } from '@/core/tenant';
const { identidade, entidadeSuperior } = getTenantSnapshot();
```

`getTenantSnapshot()` existe porque os ~38 geradores de PDF são funções puras e
não podem chamar hooks. O snapshot é resolvido no carregamento do módulo, antes
do primeiro render.

## Tema

`aplicarTema()` injeta um `<style id="tenant-theme">` com blocos `:root` e
`.dark`. Não usa estilo inline no `<html>` de propósito: isso venceria os dois
seletores e quebraria o dark mode do `next-themes`.

Só os tokens de **marca** vivem no perfil (primary, secondary, accent, highlight,
success/warning/info, ring, sidebar-*). Neutros, raios e sombras continuam em
`src/index.css` — são design system do produto, não identidade do cliente.
