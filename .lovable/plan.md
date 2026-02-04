
# Plano: Relatório de Servidores por Diretoria (Hierárquico)

## Objetivo

Criar um relatório que exibe todos os servidores vinculados a uma diretoria, incluindo os lotados nas suas divisões e núcleos subordinados. O relatório será organizado hierarquicamente, mostrando a estrutura completa.

## Fluxo de Uso

1. Usuário acessa a página de relatórios RH
2. Seleciona uma Diretoria (dropdown)
3. Sistema busca automaticamente:
   - Servidores lotados diretamente na diretoria
   - Divisões subordinadas e seus servidores
   - Núcleos subordinados às divisões e seus servidores
4. Gera PDF agrupado por unidade

## Estrutura Hierárquica Atual

```text
DIRETORIA (ex: DIRAF)
├── Divisão 1 (ex: DiAGP)
│   ├── Núcleo A (ex: NuAC)
│   ├── Núcleo B (ex: NuDoc)
│   └── Núcleo C (ex: NuPat)
├── Divisão 2 (ex: DiCOF)
│   └── ...
└── Divisão 3 (ex: DRH)
    └── ...
```

## Componentes a Criar

### 1. Componente Card de Relatório

**Arquivo:** `src/components/rh/RelatorioServidoresDiretoriaCard.tsx`

Funcionalidades:
- Dropdown para seleção da Diretoria (DIRAF, DIJUV, DIESP)
- Checkbox "Incluir logos no cabeçalho"
- Preview de quantos servidores serão exportados
- Botão "Gerar Relatório PDF"

Interface visual:
- Card com ícone de estrutura organizacional
- Título: "Servidores por Diretoria"
- Descrição: "Relatório hierárquico com todas as unidades subordinadas"

### 2. Gerador de PDF

**Arquivo:** `src/lib/pdfRelatorioServidoresDiretoria.ts`

Estrutura do PDF:
- Cabeçalho institucional (Governo/IDJuv)
- Título: "Relatório de Servidores - [Nome da Diretoria]"
- Data de emissão

Conteúdo organizado em seções:

```text
┌─────────────────────────────────────────────────────┐
│ DIRAF - DIRETORIA ADMINISTRATIVA E FINANCEIRA      │
├─────────────────────────────────────────────────────┤
│ Nome                        │ Telefone  │ Cargo    │
├─────────────────────────────────────────────────────┤
│ JOHNATAH DA LUZ VELOSO      │ 99233-0041│ Diretor  │
│ MARIA GABRYELLA G. LOPES    │ 99153-4393│ Secret.  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ DiAGP - Divisão Administrativa e Gestão Patrimonial │
├─────────────────────────────────────────────────────┤
│ Nome                        │ Telefone  │ Cargo    │
├─────────────────────────────────────────────────────┤
│ (servidores da divisão...)                          │
│                                                     │
│     NuAC - Núcleo Administrativo de Contratos       │
├─────────────────────────────────────────────────────┤
│ (servidores do núcleo...)                           │
│                                                     │
│     NuDoc - Núcleo de Documentação                  │
├─────────────────────────────────────────────────────┤
│ (servidores do núcleo...)                           │
└─────────────────────────────────────────────────────┘
```

### 3. Hook para Busca Hierárquica

A lógica de busca será integrada no componente:

```
1. Buscar todas unidades onde superior_id = diretoria_id (Divisões)
2. Buscar unidades onde superior_id IN (ids das divisões) (Núcleos)
3. Combinar todos os IDs de unidades
4. Buscar lotações ativas onde unidade_id IN (todos os IDs)
5. Organizar dados hierarquicamente para o PDF
```

## Colunas do Relatório

| Coluna | Descrição |
|--------|-----------|
| Nome Completo | Nome do servidor |
| Telefone | Telefone celular |
| Cargo | Nome do cargo ocupado |

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/rh/RelatorioServidoresDiretoriaCard.tsx` | Componente UI do card de geração |
| `src/lib/pdfRelatorioServidoresDiretoria.ts` | Gerador do PDF hierárquico |

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| Página de relatórios RH | Adicionar o novo card de relatório |

## Detalhamento Técnico

### Busca Recursiva de Unidades

```typescript
// 1. Buscar divisões subordinadas à diretoria
const divisoes = await supabase
  .from('estrutura_organizacional')
  .select('id, nome, sigla, tipo')
  .eq('superior_id', diretoriaId)
  .eq('ativo', true);

// 2. Buscar núcleos subordinados às divisões
const nucleos = await supabase
  .from('estrutura_organizacional')
  .select('id, nome, sigla, tipo, superior_id')
  .in('superior_id', divisoes.map(d => d.id))
  .eq('ativo', true);

// 3. Montar array completo de IDs
const todasUnidadesIds = [
  diretoriaId,
  ...divisoes.map(d => d.id),
  ...nucleos.map(n => n.id)
];

// 4. Buscar lotações
const lotacoes = await supabase
  .from('lotacoes')
  .select(`
    unidade_id,
    servidor:servidores(nome_completo, telefone_celular),
    cargo:cargos(nome, sigla)
  `)
  .in('unidade_id', todasUnidadesIds)
  .eq('ativo', true);
```

### Estrutura de Dados para o PDF

```typescript
interface UnidadeComServidores {
  id: string;
  nome: string;
  sigla: string | null;
  tipo: 'diretoria' | 'divisao' | 'nucleo';
  nivel: number;
  servidores: {
    nome: string;
    telefone: string | null;
    cargo: string | null;
  }[];
  subordinadas: UnidadeComServidores[];
}
```

### Layout do PDF

- Orientação: Retrato (Portrait)
- Formato: A4
- Fonte: Helvetica
- Cabeçalhos de seção com fundo colorido por nível:
  - Diretoria: Azul escuro (primária)
  - Divisão: Azul médio (secundária)
  - Núcleo: Cinza escuro
- Linhas zebradas para facilitar leitura
- Rodapé com paginação e data

## Ordem de Implementação

1. Criar `pdfRelatorioServidoresDiretoria.ts` com a lógica de geração
2. Criar `RelatorioServidoresDiretoriaCard.tsx` com a interface
3. Integrar o card na página de relatórios existente
4. Testar com cada diretoria (DIRAF, DIJUV, DIESP)
