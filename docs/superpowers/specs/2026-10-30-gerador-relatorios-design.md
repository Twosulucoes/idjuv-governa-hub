# Gerador de relatórios dinâmicos — design

Data: 2026-10-30 · Módulo: `financeiro` (motor genérico, outros módulos depois) · Classificação: **architectural**
(tela nova, tabela nova com RLS, contrato de "fonte" que outros módulos vão usar).
Desenho para o dono: `/mnt/project-files/relatorios/desenho-gerador-relatorios.md` (projeto). Decidido em
30/10/2026: modelos salvos **no banco**, só do autor ou do setor.

## 1. Objetivo

O usuário monta o relatório sem programação: escolhe a **fonte**, as **colunas**, **filtra**, **agrupa** (até 2
níveis), escolhe **totais** por coluna de valor, **ordena**, vê a **prévia** e exporta em **PDF** (motor
`src/lib/documentos/`) ou **Excel**. O modelo pode ser **salvo** e reaberto.

## 2. Situação hoje

- `/financeiro/relatorios` (`RelatoriosFinanceiroPage`) é uma vitrine estática "Em preparação".
- `CentralRelatoriosDialog` (RH: servidores, portarias, cargos, folha) escolhe colunas e agrupa, só conta
  registros, sem prévia; modelos em `localStorage` (`useTemplatesRelatorio`). Fica como está nesta entrega.
- O modelo de PDF `relatorios-colunas-dinamicas` (`modelos/relatorios/colunasDinamicas.ts`) imprime colunas e
  grupos; subtotal hoje é só contagem.

## 3. Arquitetura

```
src/lib/relatoriosDinamicos/        lógica pura, testada (vitest)
  tipos.ts        FonteRelatorio, ColunaFonte, ConfigRelatorio, ResultadoRelatorio
  montar.ts       filtrar (aplicarFiltros da barra) → ordenar → agrupar (2 níveis) → totais
  formatar.ts     moeda, data, número, texto
  exportar.ts     ResultadoRelatorio → dados do modelo de PDF e linhas do Excel
src/config/relatoriosDinamicos/     catálogo de fontes (uma por arquivo) e modelos prontos
  financeiro.ts   qdd, empenhos, diarias, emendas, convenios_federais
  modelosProntos.ts
src/hooks/useRelatoriosDinamicos.ts carregar linhas da fonte (paginado) + CRUD de relatorios_modelos
src/components/relatorios-dinamicos/ etapas do montador, prévia, lista de modelos, diálogo salvar
src/pages/financeiro/RelatoriosFinanceiroPage.tsx  passa a ser o gerador (rota existente)
```

### Contrato da fonte

```ts
interface ColunaFonte<T> {
  id: string; rotulo: string;
  tipo: 'texto' | 'moeda' | 'numero' | 'data' | 'booleano';
  valor: (linha: T) => string | number | boolean | null;
  agrupavel?: boolean;          // texto/data/booleano
  filtro?: 'lista' | 'periodo' | 'faixa' | 'booleano';   // vira FiltroDef da barra de filtros
  padrao?: boolean;             // marcada ao escolher a fonte
}
interface FonteRelatorio<T> {
  id: string; modulo: string; rotulo: string; descricao: string;
  carregar: (exercicio?: number) => Promise<T[]>;   // usa supabase com RLS do usuário
  colunas: ColunaFonte<T>[];
}
```

### Configuração (o que vai para `relatorios_modelos.configuracao`)

```ts
interface ConfigRelatorio {
  versao: 1; fonte: string; titulo: string;
  colunas: string[];                                 // ordem = ordem de impressão
  filtros: EstadoFiltros;                            // JSON da barra (período pode ser relativo)
  agrupamentos: string[];                            // até 2
  totais: Record<string, 'soma' | 'media' | 'maior' | 'menor'>;
  ordenacao: { coluna: string; direcao: 'asc' | 'desc' } | null;
  orientacao: 'auto' | 'retrato' | 'paisagem';
}
```

Coluna desconhecida (catálogo mudou) é ignorada ao abrir o modelo, com aviso; nunca quebra.

### Filtros

Reusa a barra da thread "Melhorar filtros do Financeiro" (`src/components/design-system/filtros/`:
`FiltroDef`, `EstadoFiltros`, `aplicarFiltros`, `<BarraFiltros>` controlado). As `FiltroDef` são montadas em
tempo de execução a partir de `ColunaFonte.filtro`. Se a barra ainda não estiver na `main`, o gerador entra
depois dela (dependência da PR).

### PDF e Excel

- PDF: o modelo `relatorios-colunas-dinamicas` ganha `totaisPorColuna` opcional (subtotal por grupo e total
  geral com a função escolhida) e `filtrosAplicados` (linha "Filtros: …" abaixo do título). O diálogo do RH
  continua funcionando (campos opcionais). Orientação `auto`: paisagem acima de 6 colunas.
- Excel: `src/export/exportExcel.ts`; linha de filtros, cabeçalho, linhas com subtotais por grupo e total geral.
  Moeda como número com formato, não texto.

## 4. Fontes da R1

| id | Tabela(s) | Colunas principais |
|---|---|---|
| `qdd` | `fin_dotacoes` + natureza, fonte, ação, programa | natureza, fonte, PAOE, programa, origem (comum/emenda pelo IDU), inicial, atual, bloqueado, PED, empenhado, liquidado, pago, disponível (= atual − bloqueado − max(PED, empenhado + reserva), mesma regra do painel) |
| `empenhos` | `fin_empenhos` + natureza, fonte | número, data, credor, natureza, fonte, situação, origem, processo SEI/FIPLAN, empenhado, anulado, liquidado, pago, saldo a liquidar, saldo a pagar |
| `diarias` | `fin_diarias_fiplan` | credor/servidor, saída, retorno, quantidade, empenho, empenhado, liquidado, data do pagamento, prestou contas |
| `emendas` | `fin_emendas` + `fin_empenhos.emenda_id` | número, tipo (ECNI/ECI/EII pelo IDU), autor, objeto, beneficiário, valor, reservado, empenhado, livre |
| `convenios_federais` | `fin_tg_propostas` | número, órgão, situação, início/fim da vigência, repasse, contrapartida, global |

Leitura paginada de 1.000 em 1.000, teto de 20.000 linhas (acima: aviso para filtrar mais).

Modelos prontos (código, não banco): execução por natureza (QDD), empenhos por credor, saldo a pagar por credor,
diárias por servidor no mês atual, emendas por autor, convênios com vigência nos próximos 90 dias.

## 5. Banco: `relatorios_modelos`

```sql
CREATE TABLE public.relatorios_modelos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo text NOT NULL,                 -- código do módulo da fonte (ex.: 'financeiro')
  fonte text NOT NULL,                  -- id da fonte no catálogo do front
  nome text NOT NULL CHECK (length(btrim(nome)) BETWEEN 1 AND 120),
  descricao text,
  configuracao jsonb NOT NULL,          -- ConfigRelatorio; só configuração, nunca dados
  compartilhado boolean NOT NULL DEFAULT false,   -- true = do setor (quem acessa o módulo)
  criado_por uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.relatorios_modelos (modulo, fonte);
CREATE INDEX ON public.relatorios_modelos (criado_por);
```

RLS (mesma migração):

| Ação | Regra |
|---|---|
| SELECT | `criado_por = auth.uid()` **ou** (`compartilhado` **e** `can_access_module(auth.uid(), modulo)`) **ou** `is_admin_user()` |
| INSERT | `criado_por = auth.uid()` **e** `can_access_module(auth.uid(), modulo)` |
| UPDATE | USING `criado_por = auth.uid()` ou admin; WITH CHECK `criado_por = auth.uid()` (ou admin) **e** `can_access_module(auth.uid(), modulo)` |
| DELETE | `criado_por = auth.uid()` ou admin |

Trigger `updated_at` com a função padrão do baseline. Sem permissão nova no catálogo: acesso ao módulo basta,
porque o modelo não carrega dado; as linhas vêm das tabelas de origem com o RLS delas. `mapa.csv`: classe
`preservar` com nota apontando a migração. Baseline e tipos regenerados no mesmo PR.

## 6. Rota, menu e RBAC

- Rota existente `/financeiro/relatorios` (já protegida pelo módulo Financeiro em `App.tsx`); sem mudança de
  `ProtectedRoute`/`AuthContext`.
- O item "Relatórios" volta ao menu do Financeiro (saiu no menu enxuto porque era vitrine).

## 7. Testes e verificação

- vitest em `src/lib/relatoriosDinamicos/`: filtro + ordenação + agrupamento em 2 níveis + cada função de total
  + coluna desconhecida ignorada + período relativo resolvido.
- `__testes__` do motor: PDF com `totaisPorColuna` e `filtrosAplicados` (lerPdf), e o diálogo do RH sem eles.
- Teste de RLS por persona (`Banco do zero e RLS`): dono vê/edita; outro usuário do módulo vê só compartilhado
  e não edita; usuário sem o módulo não vê.
- Gate verde; prints claro, escuro e 390px; PDF e Excel de amostra.

## 8. Fora desta entrega

Fontes de outros módulos (R2), migrar o diálogo do RH para o gerador, juntar duas fontes livremente, gráficos,
envio agendado por e-mail.
