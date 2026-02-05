
# Plano: Atualizar Relatórios de RH com Informações do Segundo Vínculo

## Objetivo

Atualizar todos os relatórios de servidores existentes para incluir as informações do **Segundo Vínculo Funcional** e criar um **novo relatório especializado** para listar apenas os servidores que possuem segundo vínculo.

## Arquivos a Atualizar

### 1. Planilha Configurável (Exportação Excel/CSV)
**Arquivo:** `src/lib/exportarPlanilha.ts`

Adicionar novos campos exportáveis na categoria "Segundo Vínculo":

| Campo ID | Label no Excel |
|----------|----------------|
| `possui_vinculo_externo` | Possui Segundo Vínculo |
| `vinculo_externo_esfera` | Esfera do Vínculo |
| `vinculo_externo_orgao` | Órgão de Origem |
| `vinculo_externo_cargo` | Cargo no Órgão |
| `vinculo_externo_matricula` | Matrícula no Órgão |
| `vinculo_externo_situacao` | Situação no Órgão |
| `vinculo_externo_forma` | Forma do Vínculo |

### 2. Relatório por Vínculo
**Arquivo:** `src/lib/pdfRelatoriosRH.ts`

Adicionar coluna/indicador visual no relatório agrupado por vínculo:
- Servidores com segundo vínculo terão um ícone ou texto adicional indicando o órgão de origem

### 3. Relatório de Histórico Funcional Individual
**Arquivo:** `src/lib/pdfRelatoriosRH.ts`

Adicionar nova seção "SEGUNDO VÍNCULO FUNCIONAL" no relatório individual com:
- Esfera do Vínculo
- Órgão de Origem
- Cargo Efetivo
- Matrícula
- Situação no Órgão
- Forma do Vínculo
- Portaria/Ato Formal (com link/número)

### 4. Relatório de Contatos Estratégicos
**Arquivo:** `src/lib/pdfRelatorioContatosEstrategicos.ts`

Adicionar coluna "Órgão de Origem" para servidores que possuem segundo vínculo.

## Novo Relatório a Criar

### Relatório de Servidores com Segundo Vínculo
**Novo arquivo:** `src/lib/pdfRelatorioSegundoVinculo.ts`

Relatório especializado listando apenas servidores que possuem vínculo externo:

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                 RELATÓRIO DE SERVIDORES COM SEGUNDO VÍNCULO              │
│                        Instituto de Juventude - IDJuv                     │
├──────────────────────────────────────────────────────────────────────────┤
│ Data: 05/02/2026                           Total: 12 servidores          │
├──────────────────────────────────────────────────────────────────────────┤
│ Ord │ Servidor        │ Vínculo IDJuv │ Esfera   │ Órgão Origem  │ Forma │
├─────┼─────────────────┼───────────────┼──────────┼───────────────┼───────┤
│  1  │ JOÃO DA SILVA   │ Comissionado  │ Federal  │ RFB           │ Cessão│
│  2  │ MARIA OLIVEIRA  │ Comissionado  │ Estadual │ SEPLAN/RR     │ Licenc│
│ ... │ ...             │ ...           │ ...      │ ...           │ ...   │
└──────────────────────────────────────────────────────────────────────────┘

Agrupamento opcional por:
- Esfera (Federal, Estadual, Municipal)
- Forma do Vínculo (Cessão, Requisição, Licença, Informal)
```

### Card do Novo Relatório
**Novo arquivo:** `src/components/rh/RelatorioSegundoVinculoCard.tsx`

Card para a página de relatórios permitindo:
- Filtro por esfera (Federal/Estadual/Municipal)
- Filtro por forma de vínculo
- Opção de agrupar por esfera ou por forma
- Preview de quantidade de registros

## Integração na Página de Relatórios

**Arquivo:** `src/pages/rh/RelatoriosRHPage.tsx`

Adicionar:
- Importação do novo card
- Renderização na grid de relatórios
- Busca incluindo campos do segundo vínculo nas queries existentes

## Detalhamento Tecnico

### 1. Exportacao Excel/CSV - Novos Campos

```typescript
// src/lib/exportarPlanilha.ts

// Adicionar campos do segundo vínculo
{ id: 'possui_vinculo_externo', label: 'Possui Segundo Vínculo', categoria: 'Segundo Vínculo', 
  getValue: (s) => s.possui_vinculo_externo ? 'Sim' : 'Não' },
{ id: 'vinculo_externo_esfera', label: 'Esfera do Vínculo', categoria: 'Segundo Vínculo', 
  getValue: (s) => VINCULO_EXTERNO_ESFERA_LABELS[s.vinculo_externo_esfera] || '' },
{ id: 'vinculo_externo_orgao', label: 'Órgão de Origem', categoria: 'Segundo Vínculo', 
  getValue: (s) => s.vinculo_externo_orgao || '' },
{ id: 'vinculo_externo_cargo', label: 'Cargo no Órgão', categoria: 'Segundo Vínculo', 
  getValue: (s) => s.vinculo_externo_cargo || '' },
{ id: 'vinculo_externo_matricula', label: 'Matrícula no Órgão', categoria: 'Segundo Vínculo', 
  getValue: (s) => s.vinculo_externo_matricula || '' },
{ id: 'vinculo_externo_situacao', label: 'Situação no Órgão', categoria: 'Segundo Vínculo', 
  getValue: (s) => VINCULO_EXTERNO_SITUACAO_LABELS[s.vinculo_externo_situacao] || '' },
{ id: 'vinculo_externo_forma', label: 'Forma do Vínculo', categoria: 'Segundo Vínculo', 
  getValue: (s) => VINCULO_EXTERNO_FORMA_LABELS[s.vinculo_externo_forma] || '' },
```

### 2. Historico Funcional - Nova Secao

```typescript
// Adicionar apos secao de Licenças no generateRelatorioHistoricoFuncional

if (data.servidor.possui_vinculo_externo) {
  y = checkPageBreak(doc, y, 80);
  y = addSectionHeader(doc, 'SEGUNDO VÍNCULO FUNCIONAL', y);
  
  addField(doc, 'Esfera', VINCULO_EXTERNO_ESFERA_LABELS[data.servidor.vinculo_externo_esfera], col1, y, colWidth);
  addField(doc, 'Situação', VINCULO_EXTERNO_SITUACAO_LABELS[data.servidor.vinculo_externo_situacao], col2, y, colWidth);
  y += 10;
  
  addField(doc, 'Órgão de Origem', data.servidor.vinculo_externo_orgao, col1, y, contentWidth);
  y += 10;
  
  addField(doc, 'Cargo Efetivo', data.servidor.vinculo_externo_cargo, col1, y, colWidth);
  addField(doc, 'Matrícula', data.servidor.vinculo_externo_matricula || '-', col2, y, colWidth);
  y += 10;
  
  addField(doc, 'Forma do Vínculo', VINCULO_EXTERNO_FORMA_LABELS[data.servidor.vinculo_externo_forma], col1, y, colWidth);
  
  if (data.servidor.vinculo_externo_ato) {
    addField(doc, 'Ato Formal', `Portaria nº ${data.servidor.vinculo_externo_ato.numero}`, col2, y, colWidth);
  }
  y += 10;
}
```

### 3. Novo Relatorio PDF - Estrutura

```typescript
// src/lib/pdfRelatorioSegundoVinculo.ts

interface ServidorSegundoVinculo {
  nome: string;
  cpf: string;
  vinculo_idjuv: string;
  cargo_idjuv: string;
  unidade_idjuv: string;
  vinculo_externo_esfera: string;
  vinculo_externo_orgao: string;
  vinculo_externo_cargo: string;
  vinculo_externo_matricula: string | null;
  vinculo_externo_situacao: string;
  vinculo_externo_forma: string;
  vinculo_externo_ato_numero: string | null;
}

interface RelatorioSegundoVinculoData {
  servidores: ServidorSegundoVinculo[];
  totalServidores: number;
  dataGeracao: string;
  filtroEsfera: string | null;
  filtroForma: string | null;
  agruparPor: 'esfera' | 'forma' | null;
}

export async function gerarRelatorioSegundoVinculo(data: RelatorioSegundoVinculoData): Promise<void> {
  // Header institucional
  // Tabela com colunas: Ord | Servidor | Vínculo IDJuv | Esfera | Órgão Origem | Cargo | Forma
  // Agrupamento opcional
  // Footer institucional
}
```

### 4. Card para Pagina de Relatorios

```typescript
// src/components/rh/RelatorioSegundoVinculoCard.tsx

export function RelatorioSegundoVinculoCard() {
  const [filtroEsfera, setFiltroEsfera] = useState<string>("all");
  const [filtroForma, setFiltroForma] = useState<string>("all");
  const [agruparPor, setAgruparPor] = useState<'esfera' | 'forma' | 'nenhum'>('nenhum');
  const [isExporting, setIsExporting] = useState(false);

  // Query para contar servidores com segundo vínculo
  const { data: previewCount = 0 } = useQuery({
    queryKey: ["segundo-vinculo-preview", filtroEsfera, filtroForma],
    queryFn: async () => {
      let query = supabase
        .from("servidores")
        .select("id", { count: "exact", head: true })
        .eq("ativo", true)
        .eq("possui_vinculo_externo", true);
      
      if (filtroEsfera !== "all") {
        query = query.eq("vinculo_externo_esfera", filtroEsfera);
      }
      if (filtroForma !== "all") {
        query = query.eq("vinculo_externo_forma", filtroForma);
      }
      
      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
  });

  return (
    <Card>
      <CardHeader>...</CardHeader>
      <CardContent>
        <Select label="Esfera" ... />
        <Select label="Forma" ... />
        <RadioGroup label="Agrupar por" ... />
        <Button onClick={handleExportar}>Gerar Relatório PDF</Button>
      </CardContent>
    </Card>
  );
}
```

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/lib/exportarPlanilha.ts` | Adicionar 7 novos campos da categoria "Segundo Vínculo" |
| `src/lib/pdfRelatoriosRH.ts` | Adicionar seção de segundo vínculo no histórico funcional e indicador no relatório por vínculo |
| `src/lib/pdfRelatorioContatosEstrategicos.ts` | Adicionar coluna de órgão de origem |
| `src/pages/rh/RelatoriosRHPage.tsx` | Atualizar queries para incluir campos do segundo vínculo, adicionar novo card |
| `src/components/rh/ExportacaoServidoresCard.tsx` | Importar labels do segundo vínculo |

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/lib/pdfRelatorioSegundoVinculo.ts` | Gerador PDF do relatório especializado |
| `src/components/rh/RelatorioSegundoVinculoCard.tsx` | Card com filtros para página de relatórios |

## Resumo Visual das Alterações

```text
RELATÓRIOS EXISTENTES (Atualizar):
├── Planilha Excel/CSV ─────────────── + 7 campos do segundo vínculo
├── Histórico Funcional Individual ─── + Seção "Segundo Vínculo Funcional"
├── Servidores por Vínculo ──────────── + Indicador de vínculo externo
└── Contatos Estratégicos ──────────── + Coluna "Órgão Origem" (opcional)

NOVO RELATÓRIO:
└── Servidores com Segundo Vínculo
    ├── Filtro por esfera (Federal/Estadual/Municipal)
    ├── Filtro por forma (Cessão/Requisição/Licença/Informal)
    ├── Agrupamento opcional
    └── Link para portaria vinculada
```

## Ordem de Implementação

1. Atualizar `src/lib/exportarPlanilha.ts` com novos campos
2. Atualizar `src/lib/pdfRelatoriosRH.ts` (histórico funcional e relatório por vínculo)
3. Criar `src/lib/pdfRelatorioSegundoVinculo.ts`
4. Criar `src/components/rh/RelatorioSegundoVinculoCard.tsx`
5. Atualizar `src/pages/rh/RelatoriosRHPage.tsx` para incluir queries e novo card
6. Testar todos os relatórios
