

# Plano: Sistema de Modulos com Todos os Formularios Organizados

## Objetivo

Reorganizar 100% do codigo por modulos funcionais, mover todos os formularios avulsos para seus modulos afins, e criar um sistema de controle de acesso onde cada "pasta" (modulo) pode ser liberada ou bloqueada para usuarios.

---

## Mapeamento Completo de Formularios por Modulo

### Modulo RH (Recursos Humanos)

| Formulario | Tipo | Localizacao Atual | Nova Localizacao |
|------------|------|-------------------|------------------|
| DadosPessoaisForm.tsx | Pre-cadastro | src/components/curriculo/ | src/modules/rh/components/curriculo/ |
| DocumentosForm.tsx | Pre-cadastro | src/components/curriculo/ | src/modules/rh/components/curriculo/ |
| EnderecoForm.tsx | Pre-cadastro | src/components/curriculo/ | src/modules/rh/components/curriculo/ |
| PrevidenciaForm.tsx | Pre-cadastro | src/components/curriculo/ | src/modules/rh/components/curriculo/ |
| EscolaridadeForm.tsx | Pre-cadastro | src/components/curriculo/ | src/modules/rh/components/curriculo/ |
| AptidoesForm.tsx | Pre-cadastro | src/components/curriculo/ | src/modules/rh/components/curriculo/ |
| ChecklistForm.tsx | Pre-cadastro | src/components/curriculo/ | src/modules/rh/components/curriculo/ |
| DadosBancariosForm.tsx | Pre-cadastro | src/components/curriculo/ | src/modules/rh/components/curriculo/ |
| DependentesForm.tsx | Pre-cadastro | src/components/curriculo/ | src/modules/rh/components/curriculo/ |
| RevisaoForm.tsx | Pre-cadastro | src/components/curriculo/ | src/modules/rh/components/curriculo/ |
| ProvimentoForm.tsx | Servidor | src/components/rh/ | src/modules/rh/components/servidor/ |
| ExoneracaoForm.tsx | Servidor | src/components/rh/ | src/modules/rh/components/servidor/ |
| DesignacaoForm.tsx | Servidor | src/components/rh/ | src/modules/rh/components/servidor/ |
| CessaoForm.tsx | Servidor | src/components/rh/ | src/modules/rh/components/servidor/ |
| RetornoCessaoForm.tsx | Servidor | src/components/rh/ | src/modules/rh/components/servidor/ |
| VinculoFuncionalForm.tsx | Servidor | src/components/rh/ | src/modules/rh/components/servidor/ |
| LotacaoForm.tsx | Servidor | src/components/rh/ | src/modules/rh/components/servidor/ |
| PortariaForm.tsx | Portaria | src/components/portarias/ | src/modules/rh/components/portarias/ |
| NovaPortariaUnificada.tsx | Portaria | src/components/portarias/ | src/modules/rh/components/portarias/ |
| PortariaColetivaDialog.tsx | Portaria | src/components/portarias/ | src/modules/rh/components/portarias/ |
| EditarPortariaDialog.tsx | Portaria | src/components/portarias/ | src/modules/rh/components/portarias/ |
| RetificarPortariaDialog.tsx | Portaria | src/components/portarias/ | src/modules/rh/components/portarias/ |
| LancarFaltaDialog.tsx | Frequencia | src/components/frequencia/ | src/modules/rh/components/frequencia/ |
| ImprimirFrequenciaDialog.tsx | Frequencia | src/components/frequencia/ | src/modules/rh/components/frequencia/ |
| **OrdemMissaoPage.tsx** | Avulso | src/pages/formularios/ | src/modules/rh/pages/formularios/ |
| **RelatorioViagemPage.tsx** | Avulso | src/pages/formularios/ | src/modules/rh/pages/formularios/ |

### Modulo RH - Folha de Pagamento

| Formulario | Tipo | Localizacao Atual | Nova Localizacao |
|------------|------|-------------------|------------------|
| NovaFolhaForm.tsx | Folha | src/components/folha/ | src/modules/rh/components/folha/ |
| RubricaForm.tsx | Folha | src/components/folha/ | src/modules/rh/components/folha/ |
| TabelaINSSForm.tsx | Folha | src/components/folha/ | src/modules/rh/components/folha/ |
| TabelaIRRFForm.tsx | Folha | src/components/folha/ | src/modules/rh/components/folha/ |
| ParametroForm.tsx | Folha | src/components/folha/ | src/modules/rh/components/folha/ |
| ContaAutarquiaForm.tsx | Folha | src/components/folha/ | src/modules/rh/components/folha/ |
| FecharFolhaDialog.tsx | Folha | src/components/folha/ | src/modules/rh/components/folha/ |
| ProcessarFolhaDialog.tsx | Folha | src/components/folha/ | src/modules/rh/components/folha/ |
| ReabrirFolhaDialog.tsx | Folha | src/components/folha/ | src/modules/rh/components/folha/ |
| GerarRemessaDialog.tsx | Folha | src/components/folha/ | src/modules/rh/components/folha/ |

---

### Modulo COMPRAS (Compras e Licitacoes)

| Formulario | Tipo | Localizacao Atual | Nova Localizacao |
|------------|------|-------------------|------------------|
| **TermoDemandaPage.tsx** | Avulso | src/pages/formularios/ | src/modules/compras/pages/formularios/ |

---

### Modulo PATRIMONIO (Inventario, Almoxarifado, Unidades)

| Formulario | Tipo | Localizacao Atual | Nova Localizacao |
|------------|------|-------------------|------------------|
| **TermoResponsabilidadePage.tsx** | Avulso | src/pages/formularios/ | src/modules/patrimonio/pages/formularios/ |
| **RequisicaoMaterialPage.tsx** | Avulso | src/pages/formularios/ | src/modules/patrimonio/pages/formularios/ |
| NovaMovimentacaoDialog.tsx | Inventario | src/components/inventario/ | src/modules/patrimonio/components/inventario/ |
| NovaBaixaDialog.tsx | Inventario | src/components/inventario/ | src/modules/patrimonio/components/inventario/ |
| NovaManutencaoDialog.tsx | Inventario | src/components/inventario/ | src/modules/patrimonio/components/inventario/ |
| NovaRequisicaoDialog.tsx | Inventario | src/components/inventario/ | src/modules/patrimonio/components/inventario/ |
| NovoItemMaterialDialog.tsx | Inventario | src/components/inventario/ | src/modules/patrimonio/components/inventario/ |
| UnidadeLocalForm.tsx | Unidade | src/components/unidades/ | src/modules/patrimonio/components/unidades/ |

---

### Modulo WORKFLOW (Processos Administrativos)

| Formulario | Tipo | Localizacao Atual | Nova Localizacao |
|------------|------|-------------------|------------------|
| NovoProcessoDialog.tsx | Processo | src/components/workflow/ | src/modules/workflow/components/ |
| NovoDespachoDialog.tsx | Processo | src/components/workflow/ | src/modules/workflow/components/ |
| NovaMovimentacaoDialog.tsx | Processo | src/components/workflow/ | src/modules/workflow/components/ |

---

### Modulo GOVERNANCA (Estrutura, Organograma, Cargos)

| Formulario | Tipo | Localizacao Atual | Nova Localizacao |
|------------|------|-------------------|------------------|
| CargoForm.tsx | Cargo | src/components/cargos/ | src/modules/governanca/components/cargos/ |
| CargoDetailDialog.tsx | Cargo | src/components/cargos/ | src/modules/governanca/components/cargos/ |
| ComposicaoCargosEditor.tsx | Cargo | src/components/cargos/ | src/modules/governanca/components/cargos/ |
| MemorandoLotacaoDialog.tsx | Lotacao | src/components/lotacoes/ | src/modules/governanca/components/lotacoes/ |
| RegistroEntregaDialog.tsx | Lotacao | src/components/lotacoes/ | src/modules/governanca/components/lotacoes/ |
| ExportOrganogramaDialog.tsx | Organograma | src/components/organograma/ | src/modules/governanca/components/organograma/ |
| UnidadeNode.tsx | Organograma | src/components/organograma/ | src/modules/governanca/components/organograma/ |
| UnidadeDetailPanel.tsx | Organograma | src/components/organograma/ | src/modules/governanca/components/organograma/ |
| InstituicaoFormDialog.tsx | Instituicao | src/components/instituicoes/ | src/modules/governanca/components/instituicoes/ |
| EditarFederacaoDialog.tsx | Federacao | src/components/federacoes/ | src/modules/governanca/components/federacoes/ |
| NovaCompeticaoDialog.tsx | Federacao | src/components/federacoes/ | src/modules/governanca/components/federacoes/ |
| NovaParceriaDialog.tsx | Federacao | src/components/federacoes/ | src/modules/governanca/components/federacoes/ |
| NovoArbitroDialog.tsx | Federacao | src/components/federacoes/ | src/modules/governanca/components/federacoes/ |

---

### Modulo ADMIN (Administracao do Sistema)

| Formulario | Tipo | Localizacao Atual | Nova Localizacao |
|------------|------|-------------------|------------------|
| CriarUsuarioDialog.tsx | Usuario | src/components/admin/ | src/modules/admin/components/ |
| UsuarioModulosTab.tsx | Usuario | src/components/admin/ | src/modules/admin/components/ |
| UsuarioPerfilTab.tsx | Usuario | src/components/admin/ | src/modules/admin/components/ |
| NovaReuniaoDialog.tsx | Reuniao | src/components/reunioes/ | src/modules/admin/components/reunioes/ |
| EditarReuniaoDialog.tsx | Reuniao | src/components/reunioes/ | src/modules/admin/components/reunioes/ |
| AdicionarParticipanteDialog.tsx | Reuniao | src/components/reunioes/ | src/modules/admin/components/reunioes/ |
| EnviarConvitesDialog.tsx | Reuniao | src/components/reunioes/ | src/modules/admin/components/reunioes/ |

---

## Nova Estrutura de Pastas

```text
src/
├── modules/                          
│   ├── admin/                        
│   │   ├── components/
│   │   │   ├── CriarUsuarioDialog.tsx
│   │   │   ├── UsuarioModulosTab.tsx
│   │   │   ├── UsuarioPerfilTab.tsx
│   │   │   └── reunioes/
│   │   │       ├── NovaReuniaoDialog.tsx
│   │   │       └── ...
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── index.ts
│   │
│   ├── rh/                           
│   │   ├── components/
│   │   │   ├── curriculo/           (10 forms pre-cadastro)
│   │   │   ├── servidor/            (7 forms servidor)
│   │   │   ├── portarias/           (6 forms portarias)
│   │   │   ├── frequencia/          (3 forms frequencia)
│   │   │   └── folha/               (10 forms folha)
│   │   ├── pages/
│   │   │   ├── formularios/
│   │   │   │   ├── OrdemMissaoPage.tsx
│   │   │   │   └── RelatorioViagemPage.tsx
│   │   │   └── ...
│   │   └── index.ts
│   │
│   ├── workflow/                     
│   │   ├── components/
│   │   │   ├── NovoProcessoDialog.tsx
│   │   │   ├── NovoDespachoDialog.tsx
│   │   │   └── NovaMovimentacaoDialog.tsx
│   │   ├── pages/
│   │   └── index.ts
│   │
│   ├── compras/                      
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── formularios/
│   │   │   │   └── TermoDemandaPage.tsx
│   │   │   └── ...
│   │   └── index.ts
│   │
│   ├── contratos/                    
│   │   ├── components/
│   │   ├── pages/
│   │   └── index.ts
│   │
│   ├── financeiro/                   
│   │   ├── components/
│   │   ├── pages/
│   │   └── index.ts
│   │
│   ├── patrimonio/                   
│   │   ├── components/
│   │   │   ├── inventario/          (5 forms inventario)
│   │   │   └── unidades/            (1 form unidade)
│   │   ├── pages/
│   │   │   ├── formularios/
│   │   │   │   ├── TermoResponsabilidadePage.tsx
│   │   │   │   └── RequisicaoMaterialPage.tsx
│   │   │   └── ...
│   │   └── index.ts
│   │
│   ├── governanca/                   
│   │   ├── components/
│   │   │   ├── cargos/              (3 forms)
│   │   │   ├── lotacoes/            (2 forms)
│   │   │   ├── organograma/         (4 components)
│   │   │   ├── instituicoes/        (1 form)
│   │   │   └── federacoes/          (4 forms)
│   │   ├── pages/
│   │   └── index.ts
│   │
│   ├── transparencia/                
│   │   ├── components/
│   │   ├── pages/
│   │   └── index.ts
│   │
│   └── comunicacao/                  
│       ├── components/
│       ├── pages/
│       └── index.ts
│
├── shared/                           
│   ├── components/
│   │   ├── ui/                      (shadcn/ui - 50+ componentes)
│   │   ├── layout/                  (MainLayout, AdminLayout, etc)
│   │   ├── menu/                    (MenuSidebar, etc)
│   │   ├── navigation/              (NavLink, etc)
│   │   ├── auth/                    (ProtectedRoute, etc)
│   │   └── reports/                 (blocos de relatorio)
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── MenuContext.tsx
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   │   └── ...
│   ├── config/
│   │   ├── menu.config.ts
│   │   └── modules.config.ts        (NOVO)
│   ├── types/
│   │   └── rbac.ts
│   └── lib/
│       └── utils.ts
│
├── integrations/
│   └── supabase/                    (NAO MODIFICAR)
│
├── App.tsx
├── main.tsx
└── index.css
```

---

## Arquivo de Configuracao de Modulos

```typescript
// src/shared/config/modules.config.ts

export const MODULOS = [
  'admin',
  'rh',
  'workflow',
  'compras',
  'contratos',
  'financeiro',
  'patrimonio',
  'governanca',
  'transparencia',
  'comunicacao',
] as const;

export type Modulo = typeof MODULOS[number];

export interface ModuleConfig {
  codigo: Modulo;
  nome: string;
  descricao: string;
  icone: string;
  cor: string;
  rotas: string[];
  formularios: string[];
}

export const MODULES_CONFIG: ModuleConfig[] = [
  {
    codigo: 'admin',
    nome: 'Administracao',
    descricao: 'Usuarios, perfis, auditoria, reunioes',
    icone: 'Settings',
    cor: 'slate',
    rotas: ['/admin'],
    formularios: ['CriarUsuario', 'Reunioes'],
  },
  {
    codigo: 'rh',
    nome: 'Recursos Humanos',
    descricao: 'Servidores, frequencia, ferias, portarias, folha',
    icone: 'Users',
    cor: 'blue',
    rotas: ['/rh', '/folha'],
    formularios: [
      'Pre-cadastro (10 forms)',
      'Servidor (7 forms)',
      'Portarias (6 forms)',
      'Frequencia (3 forms)',
      'Folha (10 forms)',
      'Ordem de Missao',
      'Relatorio de Viagem',
    ],
  },
  {
    codigo: 'workflow',
    nome: 'Processos',
    descricao: 'Tramitacao de processos administrativos',
    icone: 'GitBranch',
    cor: 'purple',
    rotas: ['/workflow'],
    formularios: ['Novo Processo', 'Novo Despacho', 'Nova Movimentacao'],
  },
  {
    codigo: 'compras',
    nome: 'Compras',
    descricao: 'Licitacoes e processos de aquisicao',
    icone: 'ShoppingCart',
    cor: 'orange',
    rotas: ['/processos/compras', '/processos/diarias', '/processos/convenios'],
    formularios: ['Termo de Demanda'],
  },
  {
    codigo: 'contratos',
    nome: 'Contratos',
    descricao: 'Gestao e execucao contratual',
    icone: 'FileText',
    cor: 'amber',
    rotas: ['/contratos'],
    formularios: [],
  },
  {
    codigo: 'financeiro',
    nome: 'Financeiro',
    descricao: 'Orcamento, empenhos, pagamentos',
    icone: 'DollarSign',
    cor: 'green',
    rotas: ['/financeiro'],
    formularios: [],
  },
  {
    codigo: 'patrimonio',
    nome: 'Patrimonio',
    descricao: 'Bens, inventario, almoxarifado, unidades',
    icone: 'Package',
    cor: 'cyan',
    rotas: ['/inventario', '/unidades', '/processos/patrimonio', '/processos/almoxarifado'],
    formularios: [
      'Termo de Responsabilidade',
      'Requisicao de Material',
      'Movimentacao',
      'Baixa',
      'Manutencao',
      'Unidade Local',
    ],
  },
  {
    codigo: 'governanca',
    nome: 'Governanca',
    descricao: 'Estrutura, organograma, cargos, federacoes',
    icone: 'Building2',
    cor: 'indigo',
    rotas: ['/governanca', '/organograma', '/cargos', '/lotacoes', '/federacoes', '/instituicoes', '/programas', '/integridade'],
    formularios: ['Cargo', 'Lotacao', 'Federacao', 'Instituicao', 'Competicao'],
  },
  {
    codigo: 'transparencia',
    nome: 'Transparencia',
    descricao: 'Portal LAI e dados publicos',
    icone: 'Eye',
    cor: 'teal',
    rotas: ['/transparencia'],
    formularios: [],
  },
  {
    codigo: 'comunicacao',
    nome: 'Comunicacao',
    descricao: 'ASCOM e demandas de comunicacao',
    icone: 'Megaphone',
    cor: 'pink',
    rotas: ['/admin/ascom'],
    formularios: ['Demanda ASCOM'],
  },
];
```

---

## Resumo Quantitativo

| Modulo | Formularios/Dialogs | Paginas | Componentes |
|--------|---------------------|---------|-------------|
| RH | 36 | 20+ | 40+ |
| Patrimonio | 8 | 12 | 15+ |
| Governanca | 14 | 15+ | 20+ |
| Admin | 7 | 15+ | 10+ |
| Workflow | 3 | 2 | 5 |
| Compras | 1 | 4 | 5 |
| Comunicacao | 1 | 5 | 5 |
| Financeiro | 0 | 10+ | 10+ |
| Transparencia | 0 | 5 | 5 |
| Contratos | 0 | 0 | 0 |
| **TOTAL** | **70+** | **90+** | **115+** |

---

## Secao Tecnica

### Ordem de Execucao

1. **Criar estrutura de pastas** - src/modules/ e src/shared/
2. **Mover shared primeiro** - UI, contexts, lib, types, hooks gerais
3. **Mover modulo por modulo** (ordem sugerida):
   - shared (base)
   - admin (core)
   - rh (maior modulo - 36 forms)
   - workflow
   - patrimonio (8 forms)
   - governanca (14 forms)
   - compras (1 form)
   - comunicacao (1 form)
   - financeiro
   - transparencia
   - contratos
4. **Atualizar imports** - Usar aliases @/modules/ e @/shared/
5. **Atualizar App.tsx** - Imports dos modulos
6. **Criar modules.config.ts** - Mapeamento central
7. **Atualizar MenuContext.tsx** - Filtrar menu por modulos
8. **Testar cada modulo** - Navegacao e funcionalidades

### Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| src/shared/config/modules.config.ts | Configuracao central de modulos |
| src/modules/*/index.ts | Exports de cada modulo |
| src/shared/components/index.ts | Exports compartilhados |
| src/shared/hooks/index.ts | Exports de hooks |

### Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| src/App.tsx | Atualizar imports para @/modules/* |
| src/contexts/MenuContext.tsx | Filtrar menu baseado em modulos |
| src/contexts/AuthContext.tsx | Carregar modulos do usuario |
| src/hooks/useModulosUsuario.ts | Usar MODULES_CONFIG |
| vite.config.ts | Adicionar aliases @/modules e @/shared |
| tsconfig.json | Adicionar paths para aliases |

### Configuracao de Aliases (vite.config.ts)

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
    '@/modules': path.resolve(__dirname, './src/modules'),
    '@/shared': path.resolve(__dirname, './src/shared'),
  },
}
```

### Migracao SQL Necessaria

A migracao SQL ja foi aplicada anteriormente (usuario_modulos). Nenhuma nova migracao de banco sera necessaria para esta reorganizacao - e apenas uma reestruturacao de codigo frontend.

---

## Beneficios

| Beneficio | Descricao |
|-----------|-----------|
| Isolamento | Cada modulo e uma "pasta" independente |
| Controle de Acesso | Modulo = unidade de permissao |
| Manutencao | Codigo relacionado esta junto |
| Escalabilidade | Facil adicionar novos modulos |
| Onboarding | Novos desenvolvedores entendem rapido |
| Lazy Loading | Possibilidade futura de carregar sob demanda |

