# Visão Geral

## O que é

**IDJUV Governa Hub** é a plataforma web de gestão e governança do **IDJUV**
(Instituto de Desenvolvimento da Juventude), uma autarquia/órgão público
estadual voltado a juventude e esporte. O sistema unifica, num só aplicativo,
a operação administrativa interna do órgão e seus canais públicos.

É, na prática, um **ERP de governo** combinado com um **portal público** e um
**app mobile (PWA)** de campo.

## Para quem

| Perfil | Uso |
|---|---|
| Servidores e gestores do IDJUV | Operação interna: RH, folha, financeiro, patrimônio, processos, governança |
| Gabinete da Presidência | Portarias, ordens de missão, pré-cadastros, workflow |
| ASCOM (Comunicação) | Demandas de comunicação, CMS de notícias/galerias/banners |
| Cidadão / público externo | Transparência (LAI), notícias, galerias, formulários de cadastro |
| Agentes de campo | App mobile de coleta de inventário de patrimônio |

## Objetivos

- Centralizar a gestão administrativa da autarquia em um sistema único e auditável.
- Garantir conformidade legal: **LAI/transparência**, **eSocial**, **CNAB** (folha),
  **TCE** (relatórios de pessoal), integridade e governança.
- Digitalizar processos administrativos (estilo SEI) com tramitação e despachos.
- Oferecer canais públicos (portal, formulários, transparência ativa).

## Mapa de módulos

O sistema tem **17 módulos** (definidos em
`src/shared/config/modules.config.ts`):

| Módulo | Código | Função |
|---|---|---|
| Administração | `admin` | Usuários, perfis, auditoria, reuniões, backup, configurações |
| Recursos Humanos | `rh` | Servidores, frequência, férias, licenças, lotações, folha |
| Processos | `workflow` | Tramitação de processos administrativos (SEI-like) |
| Compras | `compras` | Licitações e aquisições |
| Contratos | `contratos` | Gestão e execução contratual |
| Financeiro | `financeiro` | Orçamento, empenhos, liquidações, pagamentos |
| Patrimônio | `patrimonio` | Bens, inventário, almoxarifado, unidades locais |
| Governança | `governanca` | Estrutura, organograma, cargos, riscos, controles |
| Integridade | `integridade` | Denúncias, ética, compliance |
| Transparência | `transparencia` | Portal LAI / e-SIC e dados públicos |
| Comunicação | `comunicacao` | ASCOM, demandas, CMS |
| Programas | `programas` | Programas sociais e esportivos |
| Gestores Escolares | `gestores_escolares` | Credenciamento para Jogos Escolares (JER) |
| Organizações | `organizacoes` | Federações, instituições, associações, entes |
| Gabinete | `gabinete` | Pré-cadastros, portarias, ordens de missão |
| Patrimônio Mobile | `patrimonio_mobile` | PWA de coleta de inventário em campo |
| Árbitros | `arbitros` | Cadastro e gestão de árbitros esportivos |

Veja o detalhamento de cada um em [MODULOS.md](./MODULOS.md).

## Origem e ecossistema

- Construído na plataforma **Lovable** (`lovable.dev`), com sincronização
  bidirecional com o GitHub: alterações no Lovable viram commits e vice-versa.
- Backend **Supabase** (Postgres + Auth + Storage + Edge Functions).
- Deploy do front na **Vercel** (e também publicável via Lovable).
