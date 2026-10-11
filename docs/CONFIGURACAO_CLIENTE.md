# Configuração do cliente — identidade no banco, não no código

Decisão registrada em 2026-10-11, a pedido do dono do produto. Complementa o
[WHITE_LABEL.md](./WHITE_LABEL.md) (Fase 3 — identidade institucional).

## A decisão

O sistema é um **produto** vendido a várias instituições. Por isso:

1. **Nada que identifica a instituição fica no código.** Nome oficial, nome curto, sigla, CNPJ,
   natureza jurídica, base legal, dirigente, endereço, contato, redes sociais e endereços de
   integração são **dados**, cadastrados na tela **Configuração do cliente**
   (`/admin/configuracao-cliente`, menu Administração).
2. **O nome do sistema também é dado.** O nome exibido é `<nome do produto> / <sigla do cliente>`
   (ex.: `Governa Hub / IDJUV`). Ele aparece na aba do navegador, no rodapé do menu e no rodapé dos
   documentos (PDF). O nome do produto é cadastrável na mesma tela (chave `sistema_nome`).
3. **Nome do produto provisório:** `Governa Hub` (`NOME_PRODUTO_PADRAO` em
   `src/core/tenant/produto.ts`), até a decisão comercial do nome definitivo. Trocar o padrão é uma
   linha nesse arquivo; trocar numa instalação é pela tela.

Regra para quem escreve código: **nunca** escreva nome, sigla, CNPJ ou qualquer dado de cliente em
`src/`. Leia de `useTenant()`/`useIdentidade()`/`useNomeSistema()` no React e de
`getTenantSnapshot()`/`nomeDoSistema()` fora dele (ver [`src/core/tenant/README.md`](../src/core/tenant/README.md)).

## Como funciona

```
dados_oficiais (banco, tela /admin/configuracao-cliente)     ← vale primeiro
   ↓ aplicado por cima de
tenants/<slug>/tenant.config.ts (arquivo de instalação)      ← ponto de partida e reserva
   ↓ sem perfil
tenants/_template (neutro, nunca o IDJUV)
```

- **Onde fica:** tabela `public.dados_oficiais` (chave → valor, com `categoria`, `motivo_alteracao`,
  `ultima_alteracao_por/em`). Já existia e já era lida pelo rodapé, base legal e portal; não houve
  tabela nova. As chaves e onde cada uma entra no perfil estão em `CAMPOS_CLIENTE`
  (`src/core/tenant/dadosOficiais.ts`): uma chave nova é uma linha nesse catálogo.
- **Quando vale:** o `TenantProvider` lê a tabela ao abrir o app e aplica os valores por cima do
  perfil (`src/core/tenant/identidadeBanco.ts`). O snapshot síncrono dos geradores de PDF é
  atualizado junto. Ao salvar na tela, a identidade é relida na hora, sem novo deploy.
- **Quem lê:** qualquer pessoa, inclusive sem login (portal, tela de login). É dado institucional
  público; a RPC `obter_dado_oficial` já entregava qualquer chave a quem não tinha sessão.
  Dado pessoal não entra nessa tabela.
- **Quem altera:** só o papel admin (RLS da classe `publico_admin`). Ver a tela exige
  `admin.configuracao_cliente` (o super admin passa por cima); quem vê sem ser admin só consulta.
- **Campo vazio** apaga a chave do banco e o valor volta a ser o do arquivo de instalação. Na
  primeira vez, a tela mostra os valores do arquivo e avisa quantos ainda não estão no banco: basta
  conferir e salvar.

Migração: `supabase/migrations/20261011023500_configuracao_cliente.sql` (leitura pública e
permissão da tela). Não grava valores: os dados entram pela tela.

## O que ainda está no código (próximos passos)

| Item | Onde | Por quê ficou de fora |
|---|---|---|
| Logos, favicon e ícones do PWA | `tenants/<slug>/assets/` | Precisam de upload para o Storage e de URL pública por instalação (Fase 2/3 do White Label) |
| Paleta de cores | `tenants/<slug>/tenant.config.ts` | Trocar cor muda contraste; precisa do guard de contraste rodando sobre o valor do banco |
| Título da aba antes de abrir o app, manifest do PWA | `tenants/<slug>/metadata.ts` | São gerados no build; depois de carregar, a aba já usa o nome do banco |
| Lista de módulos contratados | `tenants/<slug>/tenant.config.ts` | Afeta rotas e menu; segue como configuração de instalação (Fase 6) |
| Textos com o nome do cliente em páginas e PDFs (~60 arquivos em `src/`) | `src/pages/`, `src/lib/pdf*.ts` | Troca mecânica por `useIdentidade()`/`getTenantSnapshot()`, em lotes (Fases 2 e 4); os rodapés com o nome do sistema já foram trocados |
| Enums e colunas com o nome do cliente | banco (`efetivo_idjuv`, `cessoes.unidade_idjuv_id`) | Migração de schema em produção (Fase 7) |
