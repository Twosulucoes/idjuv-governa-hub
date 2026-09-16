# tenants/ — perfis das instituições clientes

Esta pasta é o **lado do cliente** da fronteira White Label. `src/` é o núcleo
genérico do produto; aqui mora tudo que identifica uma instituição específica.

```
tenants/
├── index.ts           # registro slug → perfil (único autorizado a importar os perfis)
├── _template/         # ponto de partida neutro para um cliente novo
│   ├── tenant.config.ts
│   └── assets/
└── idjuv/             # instância atual
    ├── tenant.config.ts
    └── assets/
```

## Regras

1. **Nada em `src/` importa `tenants/<slug>` diretamente.** O núcleo consome via
   `@/core/tenant` (`useTenant()` no React, `getTenantSnapshot()` nas libs puras).
   `tenants/index.ts` é o único ponto que conhece os perfis pelo nome.
2. **O fallback nunca é um cliente.** Slug ausente ou desconhecido cai em
   `_template` (neutro), nunca no IDJUV — um deploy mal configurado deve ficar
   sem marca, não com a marca errada.
3. **O perfil é dado, não código.** Sem lógica condicional por cliente dentro de
   `src/`; se o comportamento varia, vira campo de `TenantConfig`.

## Provisionar um cliente novo

```bash
cp -r tenants/_template tenants/<slug>
# 1. preencher tenants/<slug>/tenant.config.ts
# 2. trocar as imagens em tenants/<slug>/assets/ (ver o README de lá)
# 3. registrar o slug em tenants/index.ts
# 4. no .env do deploy: VITE_TENANT_SLUG=<slug>
```

O contrato de `TenantConfig` está em [`src/core/tenant/types.ts`](../src/core/tenant/types.ts).
O plano completo, em [`docs/WHITE_LABEL.md`](../docs/WHITE_LABEL.md).
