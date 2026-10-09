# Governa Hub

Plataforma web de gestão e governança para órgãos públicos: RH, folha de
pagamento, financeiro, patrimônio, compras, contratos, transparência (LAI),
comunicação, programas e processos administrativos, com portal público e PWA
de inventário em campo.

**Stack:** React 18 + Vite 5 + TypeScript + Tailwind/shadcn-ui no front;
Supabase (Postgres, Auth, Storage, Edge Functions) no back; deploy do front na
Vercel.

## Rodando localmente

Requisitos: [Bun](https://bun.sh) (preferido) ou Node.js LTS.

```sh
git clone https://github.com/twosulucoes/idjuv-governa-hub.git
cd idjuv-governa-hub
cp .env.example .env   # preencha as variáveis VITE_SUPABASE_* e VITE_TENANT_SLUG
bun install            # ou: npm install
bun run dev            # http://localhost:8080
```

## Verificação

```sh
bash scripts/gate.sh   # guards + typecheck + lint + build (roda no pre-push e no CI)
```

## Documentação

- [`CLAUDE.md`](./CLAUDE.md) e [`AGENTS.md`](./AGENTS.md): resumo para quem
  (pessoa ou agente) vai mexer no código.
- [`docs/`](./docs/README.md): arquitetura, módulos, banco, RBAC, edge
  functions, white label e fluxo de desenvolvimento.
- [`CONTRIBUTING.md`](./CONTRIBUTING.md): como contribuir.
