# Arquitetura de Navegação — Sistema IDJuv

> **Documento de Referência para Desenvolvimento**  
> **Versão:** 1.0.0  
> **Data:** 2026-02-08

---

## Visão Geral

O sistema possui **duas interfaces completamente isoladas** que NÃO compartilham componentes de navegação:

```
┌─────────────────────────────────────────────────────────────────┐
│                       PORTAL PÚBLICO                              │
│  (Cidadãos, visitantes, sociedade)                                │
│                                                                   │
│  Layout: MainLayout (Header + Footer institucionais)             │
│  Rotas: /, /transparencia, /contato, /noticias, /selecoes        │
│  Acesso: Anônimo (sem autenticação)                              │
└─────────────────────────────────────────────────────────────────┘
              │
              │ /auth (login)
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SISTEMA ADMINISTRATIVO                         │
│  (Servidores, gestores, administradores)                          │
│                                                                   │
│  Layout: AdminLayout (Sidebar + TopBar)                          │
│  Rotas: /sistema, /admin/*, /rh/*, /workflow/*, etc.             │
│  Acesso: Autenticado + RBAC por módulos                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Portal Público

### Propósito
Interface voltada para cidadãos e sociedade em geral. Apresenta informações institucionais, programas, notícias e portal da transparência.

### Layout
- **Componente:** `MainLayout` (`src/components/layout/MainLayout.tsx`)
- **Header:** `Header` (`src/components/layout/Header.tsx`)
- **Footer:** `Footer` (`src/components/layout/Footer.tsx`)

### Rotas Públicas
| Rota | Descrição |
|------|-----------|
| `/` | Página inicial (Em Breve / Landing) |
| `/transparencia` | Portal da Transparência |
| `/noticias` | Notícias e comunicados |
| `/contato` | Formulário de contato |
| `/selecoes` | Hot site Seletivas Estudantis |
| `/governanca` | Documentos de governança pública |
| `/integridade` | Canal de denúncias e ética |
| `/auth` | Login (porta de entrada p/ sistema) |

### Navegação (Menu do Header)
```
Governança > Lei de Criação, Decreto, Regimento, Organograma, Portarias
Processos  > Compras, Diárias, Patrimônio, Convênios, Almoxarifado
Manuais    > Compras, Diárias, Patrimônio, Convênios
Integridade > Código de Ética, Denúncias, Conflito de Interesses
Transparência (link direto)
```

### Componentes Exclusivos do Portal
```
src/components/layout/
  ├── Header.tsx          # Header institucional público
  ├── Footer.tsx          # Footer institucional público
  └── MainLayout.tsx      # Wrapper do portal

src/pages/portal/components/  # Preview de alta fidelidade
  ├── PortalHeader.tsx
  ├── PortalHero.tsx
  ├── PortalStats.tsx
  ├── PortalPrograms.tsx
  ├── PortalNews.tsx
  ├── PortalContact.tsx
  └── PortalFooter.tsx
```

---

## 2. Sistema Administrativo

### Propósito
Interface interna para servidores do IDJuv. Acesso controlado por autenticação e RBAC baseado em módulos.

### Layout
- **Componente:** `AdminLayout` (`src/components/admin/AdminLayout.tsx`)
- **Sidebar:** `MenuSidebar` (`src/components/menu/MenuSidebar.tsx`)
- **TopBar Desktop:** `TopBarDesktop` (`src/components/navigation/TopBarDesktop.tsx`)
- **TopBar Mobile:** `TopBarMobile` (`src/components/navigation/TopBarMobile.tsx`)
- **Drawer Mobile:** `MenuDrawerMobile` (`src/components/menu/MenuDrawerMobile.tsx`)

### Rotas Protegidas
| Prefixo | Módulo | Descrição |
|---------|--------|-----------|
| `/sistema` | - | Dashboard principal |
| `/admin/*` | admin | Usuários, perfis, auditoria |
| `/rh/*` | rh | Servidores, férias, frequência |
| `/workflow/*` | workflow | Tramitação de processos |
| `/processos/compras/*` | compras | Licitações |
| `/contratos/*` | contratos | Gestão contratual |
| `/financeiro/*` | financeiro | Orçamento, pagamentos |
| `/inventario/*` | patrimonio | Bens patrimoniais |
| `/governanca/*` | governanca | Estrutura, organograma |
| `/transparencia/*` | transparencia | Gestão LAI |
| `/ascom/*` | comunicacao | Demandas ASCOM |
| `/programas/*` | programas | Programas sociais |
| `/cadastrogestores/admin/*` | gestores_escolares | Gestores JER |

### Controle de Acesso
O menu lateral é filtrado automaticamente pelo `MenuContext`:
1. Busca módulos habilitados do usuário (`user_modules`)
2. Verifica papel do usuário (`user_roles`)
3. Se `admin` → acesso total
4. Senão → exibe apenas seções dos módulos habilitados

### Componentes Exclusivos do Admin
```
src/components/admin/
  ├── AdminLayout.tsx     # Layout wrapper
  ├── AdminSearch.tsx     # Busca global (Ctrl+K)
  └── AdminBreadcrumbs.tsx

src/components/menu/
  ├── MenuSidebar.tsx     # Menu lateral desktop
  ├── MenuDrawerMobile.tsx # Drawer hamburger
  └── MenuSearch.tsx      # Busca no menu

src/components/navigation/
  ├── TopBarDesktop.tsx   # Header admin desktop
  └── TopBarMobile.tsx    # Header admin mobile
```

---

## 3. Componentes Compartilhados

Estes componentes são usados em AMBOS os sistemas:

```
src/components/ui/         # shadcn/ui primitives
src/components/auth/       # UserMenu, ProtectedRoute
src/contexts/AuthContext   # Estado de autenticação
```

---

## 4. Regras de Ouro

### ❌ NÃO FAZER
- Usar `Header` ou `Footer` dentro de páginas que usam `AdminLayout`
- Usar `MenuSidebar` ou `TopBar` em páginas públicas
- Importar componentes de `src/pages/portal/` no sistema admin
- Misturar navegação pública com navegação admin

### ✅ FAZER
- Páginas públicas: envolver com `<MainLayout>`
- Páginas admin: envolver com `<AdminLayout>`
- Páginas especiais (JER cadastro): usar `HeaderPublico` isolado
- Sempre verificar qual layout a página deve usar

---

## 5. Fluxo de Navegação

```
                    ┌──────────┐
                    │   /      │ (Público)
                    └────┬─────┘
                         │
                         ▼
                    ┌──────────┐
                    │  /auth   │ (Login)
                    └────┬─────┘
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
    ┌─────────────────┐   ┌─────────────────┐
    │    /sistema     │   │  Voltar ao      │
    │  (Dashboard)    │   │  Portal (/)     │
    └────────┬────────┘   └─────────────────┘
             │
    ┌────────┼────────┐
    │        │        │
    ▼        ▼        ▼
  /admin   /rh    /workflow  (RBAC filtra acesso)
```

---

## 6. Estrutura de Diretórios

```
src/
├── components/
│   ├── layout/           # 🌐 PORTAL PÚBLICO
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── MainLayout.tsx
│   │
│   ├── admin/            # 🔒 SISTEMA ADMIN
│   │   ├── AdminLayout.tsx
│   │   └── AdminSearch.tsx
│   │
│   ├── navigation/       # 🔒 SISTEMA ADMIN
│   │   ├── TopBarDesktop.tsx
│   │   └── TopBarMobile.tsx
│   │
│   ├── menu/             # 🔒 SISTEMA ADMIN
│   │   ├── MenuSidebar.tsx
│   │   ├── MenuDrawerMobile.tsx
│   │   └── MenuSearch.tsx
│   │
│   └── cadastrogestores/ # 📋 MÓDULO ESPECIAL (público + admin)
│       └── HeaderPublico.tsx
│
├── pages/
│   ├── portal/           # 🌐 PREVIEW PORTAL (alta fidelidade)
│   │   └── components/
│   │
│   ├── Index.tsx         # 🌐 Landing "Em Breve"
│   ├── Auth.tsx          # 🔓 Login
│   └── sistema/          # 🔒 Dashboard Admin
```

---

## 7. Validação de Uso Correto

### Página Pública
```tsx
// ✅ Correto
import { MainLayout } from "@/components/layout/MainLayout";

export default function MinhaPagePublica() {
  return (
    <MainLayout>
      <div>Conteúdo público</div>
    </MainLayout>
  );
}
```

### Página Administrativa
```tsx
// ✅ Correto
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function MinhaPageAdmin() {
  return (
    <AdminLayout title="Título da Página">
      <div>Conteúdo admin</div>
    </AdminLayout>
  );
}
```

### ❌ ERRADO - Mistura de layouts
```tsx
// ❌ NUNCA fazer isso
import { MainLayout } from "@/components/layout/MainLayout";
import { TopBarDesktop } from "@/components/navigation/TopBarDesktop";

export default function PageErrada() {
  return (
    <MainLayout>
      <TopBarDesktop /> {/* TopBar é do Admin! */}
      <div>Conteúdo</div>
    </MainLayout>
  );
}
```

---

## Changelog

- **1.0.0** (2026-02-08): Documento inicial com separação completa
