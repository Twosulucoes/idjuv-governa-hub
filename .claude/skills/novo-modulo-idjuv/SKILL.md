---
name: novo-modulo-idjuv
description: Cria uma nova feature/domínio completo no IDJUV Governa Hub (tipos + hook de dados + componentes + página + rota + item de menu), seguindo exatamente os padrões do repositório. Use quando o usuário pedir para "criar um módulo novo", "adicionar uma página de X", "criar CRUD de X", ou qualquer feature nova que precise aparecer no menu e nas rotas.
---

# Novo módulo/feature — IDJUV Governa Hub

Implementa a "receita rápida" da seção 10 do `CLAUDE.md`, de forma disciplinada e
na ordem certa — a maior fonte de bugs em features novas neste repo é esquecer
uma das 6 pontas (tipo, hook, migração+RLS, componente, rota, menu).

## Antes de começar

1. Pergunte (ou infira do pedido) a que **módulo** (`src/shared/config/modules.config.ts` →
   `MODULOS`) a feature pertence. Se for um domínio realmente novo (não um dos 17
   módulos existentes), pare e confirme com o usuário — criar módulo é uma decisão
   maior que criar uma página dentro de um módulo existente.
2. Leia o hook e a página mais próximos de um domínio parecido já existente
   (ex.: para algo em RH, olhe `src/hooks/useServidores.ts` e uma page em
   `src/pages/rh/`) e siga a mesma forma, não invente um padrão novo.

## Passo a passo

### 1. Tipos — `src/types/<dominio>.ts`
Defina/estenda a interface de domínio. Se os dados vêm de uma tabela nova do
Supabase, os tipos "de banco" vêm de `src/integrations/supabase/types.ts`
(gerado — não editar à mão); crie tipos derivados/de UI aqui.

### 2. Dados — schema + hook
- Se precisar de tabela/coluna nova: **use o skill `migracao-segura-idjuv`** para
  criar a migração (ele cuida de RLS, nomenclatura e regeneração de tipos) —
  não escreva SQL solto aqui.
- Hook em `src/hooks/use<Dominio>.ts`: React Query + `supabase` de
  `@/integrations/supabase/client`. Padrão observado no repo (ex.
  `useRBAC.ts`): estado local `isLoading`/`error`, função `fetch<Coisa>`
  memoizada com `useCallback`, effect que chama no mount, e um `refetch`
  exposto. Prefira **estender um hook existente do domínio** em vez de criar
  um hook paralelo se um já cobre a mesma tabela.
- Nunca chame `supabase` direto dentro de um componente de página — sempre via
  hook.

### 3. UI — `src/components/<dominio>/`
Componha com `@/components/ui/*` (shadcn) + Tailwind. Formulários: 
`react-hook-form` + `zod` (`zodResolver`). Toasts: `useToast` de
`@/hooks/use-toast` ou `sonner`. Não escreva CSS solto — use as classes/tokens
já definidos (ex. `MODULO_COR_CLASSES` para cor do módulo).

### 4. Página — `src/pages/<dominio>/<Nome>Page.tsx`
Nome do arquivo termina em `Page.tsx`, export do componente também termina em
`Page`.

### 5. Rota — `src/App.tsx`
- Importe a page no topo do arquivo, junto com as outras do mesmo módulo.
- Registre `<Route>` **dentro do bloco de comentários do módulo correto** (o
  arquivo é organizado em blocos `{/* ===== NOME DO MÓDULO ===== */}`) — não
  jogue a rota no fim do arquivo.
- Envolva com o guard certo:
  - Rota protegida (a maioria): `<ProtectedRoute requiredModule="<modulo>" requiredPermissions={["<dominio>.<recurso>.<acao>"]}>`.
    Use o formato de permissão `{dominio}.{recurso}.{acao}` (ver
    `docs/RBAC_PERMISSOES.md`), não invente um formato novo.
  - Rota pública (portal): `<PublicPageGuard rota="/caminho">`.
- `App.tsx` tem mais de 1200 linhas — faça um diff cirúrgico, não reformate
  trechos vizinhos.

### 6. Menu — `src/config/menu.config.ts`
Se a feature deve aparecer na navegação, adicione o item no array do módulo
correspondente, com a mesma `permission` usada na rota. Confira se o ícone
(lucide-react) já está importado no topo do arquivo; se não, adicione o
import.

### 7. Verificação final
Rode, nessa ordem:
```bash
bun run lint    # ou npm run lint
bun run build   # ou npm run build
```
Não use `any` nos tipos novos — o projeto já tem ~700 erros de lint
predominantemente `no-explicit-any`; não aumente essa dívida. Se possível,
suba `bun run dev` e navegue até a rota nova para confirmar visualmente
(permissão, menu, formulário) antes de reportar como concluído.

## Não faça

- Não crie um módulo novo em `modules.config.ts` sem confirmar com o usuário —
  isso afeta RBAC, menu e (no futuro) o perfil de módulos habilitados por
  cliente no onboarding multi-instância.
- Não edite `src/integrations/supabase/client.ts` ou `types.ts` manualmente.
- Não adicione a rota fora do bloco do módulo em `App.tsx`.
