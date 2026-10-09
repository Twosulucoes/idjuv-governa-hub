import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Download, FileX, Plus, Trash2, Users, Wallet, CalendarX } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import {
  ChartCard,
  DataTable,
  EmptyState,
  ErrorSummary,
  FormSection,
  KpiCard,
  PageHeader,
  StatusBadge,
  type ColunaTabela,
} from "@/components/design-system";

/** Dados fictícios da vitrine: nada aqui vem do banco. */
interface LinhaExemplo {
  id: string;
  matricula: string;
  nome: string;
  lotacao: string;
  valor: number;
  situacao: string;
}

const SITUACOES = ["Ativo", "Pendente", "Em análise", "Cancelado", "Inativo"];
const LOTACOES = ["Diretoria Administrativa", "Coordenação de Esportes", "Gabinete", "Assessoria Jurídica"];

const LINHAS: LinhaExemplo[] = Array.from({ length: 47 }, (_, i) => ({
  id: String(i + 1),
  matricula: String(1000 + i * 37).padStart(6, "0"),
  nome: `Servidor de exemplo ${String.fromCharCode(65 + (i % 26))}${i >= 26 ? "2" : ""}`,
  lotacao: LOTACOES[i % LOTACOES.length],
  valor: 1500 + ((i * 7919) % 14000) + (i % 100) / 100,
  situacao: SITUACOES[i % SITUACOES.length],
}));

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const COLUNAS: ColunaTabela<LinhaExemplo>[] = [
  { id: "matricula", cabecalho: "Matrícula", celula: (l) => l.matricula, ordenarPor: (l) => l.matricula, buscarPor: (l) => l.matricula },
  { id: "nome", cabecalho: "Nome", celula: (l) => l.nome, ordenarPor: (l) => l.nome, buscarPor: (l) => l.nome, mobile: "titulo" },
  { id: "lotacao", cabecalho: "Lotação", celula: (l) => l.lotacao, ordenarPor: (l) => l.lotacao, buscarPor: (l) => l.lotacao },
  { id: "valor", cabecalho: "Remuneração", celula: (l) => brl.format(l.valor), ordenarPor: (l) => l.valor, alinhamento: "direita" },
  { id: "situacao", cabecalho: "Situação", celula: (l) => <StatusBadge>{l.situacao}</StatusBadge>, ordenarPor: (l) => l.situacao },
];

const DADOS_GRAFICO = [
  { mes: "Jan", empenhado: 820, liquidado: 610 },
  { mes: "Fev", empenhado: 910, liquidado: 740 },
  { mes: "Mar", empenhado: 1050, liquidado: 880 },
  { mes: "Abr", empenhado: 990, liquidado: 930 },
  { mes: "Mai", empenhado: 1120, liquidado: 1010 },
  { mes: "Jun", empenhado: 1180, liquidado: 1090 },
];

const CONFIG_GRAFICO = {
  empenhado: { label: "Empenhado (mil R$)", color: "hsl(var(--chart-1))" },
  liquidado: { label: "Liquidado (mil R$)", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

const esquema = z.object({
  nome: z.string().min(3, "Informe o nome completo"),
  cpf: z.string().regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, "Informe um CPF válido"),
  email: z.string().email("Informe um e-mail válido"),
});

function FormularioDemo() {
  const form = useForm<z.infer<typeof esquema>>({
    resolver: zodResolver(esquema),
    defaultValues: { nome: "", cpf: "", email: "" },
    shouldFocusError: false,
  });
  const [salvando, setSalvando] = React.useState(false);

  return (
    <Form {...form}>
      <form
        noValidate
        className="space-y-6"
        onSubmit={form.handleSubmit(() => {
          setSalvando(true);
          window.setTimeout(() => setSalvando(false), 1200);
        })}
      >
        <ErrorSummary
          erros={form.formState.errors}
          envios={form.formState.submitCount}
          rotulos={{ nome: "Nome", cpf: "CPF", email: "E-mail" }}
        />
        <FormSection titulo="Dados pessoais" descricao="Exemplo de formulário: envie vazio para ver o resumo de erros.">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome completo</FormLabel>
                <FormControl>
                  <Input autoComplete="name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF</FormLabel>
                <FormControl>
                  <Input inputMode="numeric" placeholder="000.000.000-00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Limpar
          </Button>
          <Button type="submit" loading={salvando}>
            Salvar
          </Button>
        </div>
      </form>
    </Form>
  );
}

/** Demonstração dos componentes de padrão (`@/components/design-system`). */
export function ComponentesDemo() {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-h2">Cabeçalho de página e situação</CardTitle>
          <CardDescription>
            <code className="font-mono">PageHeader</code> com migalhas, situação e ações;{" "}
            <code className="font-mono">StatusBadge</code> deduz o tom pelo texto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-md border border-dashed border-border p-4">
            <PageHeader
              migalhas={[{ rotulo: "Recursos Humanos", href: "/admin/design-system" }, { rotulo: "Servidores" }]}
              titulo="Servidores"
              status={<StatusBadge>Ativo</StatusBadge>}
              descricao="Cadastro e situação funcional dos servidores."
              acoes={
                <>
                  <Button variant="outline">
                    <Download aria-hidden="true" /> Exportar
                  </Button>
                  <Button>
                    <Plus aria-hidden="true" /> Novo servidor
                  </Button>
                </>
              }
              className="pb-0"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {["Ativo", "Aprovado", "Pendente", "Aguardando", "Em análise", "Em andamento", "Cancelado", "Indeferido", "Inativo", "Urgente"].map(
              (s) => (
                <StatusBadge key={s}>{s}</StatusBadge>
              ),
            )}
          </div>
        </CardContent>
      </Card>

      <section aria-labelledby="ds-kpi" className="space-y-3">
        <h2 id="ds-kpi" className="text-h2">
          Indicadores
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard rotulo="Servidores ativos" valor="342" variacao={2.4} periodo="vs. mês anterior" icone={Users} />
          <KpiCard rotulo="Folha do mês" valor="R$ 1,28 mi" variacao={3.1} periodo="vs. mês anterior" subirEhBom={false} icone={Wallet} />
          <KpiCard rotulo="Faltas não justificadas" valor="17" variacao={-12.5} periodo="vs. mês anterior" subirEhBom={false} icone={CalendarX} />
          <KpiCard rotulo="Processos parados" valor="0" variacao={0} periodo="vs. mês anterior" carregando={false} />
        </div>
      </section>

      <ChartCard
        titulo="Execução orçamentária"
        descricao="Empenhado e liquidado por mês (dados fictícios)."
        tabela={{
          colunas: [
            { chave: "mes", rotulo: "Mês" },
            { chave: "empenhado", rotulo: "Empenhado (mil R$)", numerica: true },
            { chave: "liquidado", rotulo: "Liquidado (mil R$)", numerica: true },
          ],
          linhas: DADOS_GRAFICO,
        }}
      >
        <ChartContainer config={CONFIG_GRAFICO} className="h-64 w-full">
          <BarChart data={DADOS_GRAFICO} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="mes" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} width={40} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="empenhado" fill="var(--color-empenhado)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="liquidado" fill="var(--color-liquidado)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </ChartCard>

      <section aria-labelledby="ds-tabela" className="space-y-3">
        <h2 id="ds-tabela" className="text-h2">
          Tabela padrão
        </h2>
        <p className="text-body text-muted-foreground">
          Busca, ordenação, seleção com ações em lote, paginação e densidade. No celular vira cartões.
        </p>
        <DataTable
          rotulo="Servidores"
          dados={LINHAS}
          colunas={COLUNAS}
          chaveLinha={(l) => l.id}
          busca={{ placeholder: "Buscar por nome, matrícula ou lotação" }}
          tamanhoPagina={10}
          acoesEmLote={(selecionadas, limpar) => (
            <Button variant="outline" size="sm" onClick={limpar}>
              <Download aria-hidden="true" /> Exportar {selecionadas.length}
            </Button>
          )}
          acoesLinha={() => (
            <Button variant="ghost" size="icon" aria-label="Excluir">
              <Trash2 aria-hidden="true" />
            </Button>
          )}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <DataTable rotulo="Contratos" dados={[]} colunas={COLUNAS} chaveLinha={(l) => l.id} carregando />
          <DataTable
            rotulo="Contratos"
            dados={[]}
            colunas={COLUNAS}
            chaveLinha={(l) => l.id}
            vazio={{
              icone: FileX,
              titulo: "Nenhum contrato cadastrado",
              descricao: "Cadastre o primeiro contrato para acompanhar vigência e aditivos.",
              acao: (
                <Button size="sm">
                  <Plus aria-hidden="true" /> Novo contrato
                </Button>
              ),
            }}
          />
        </div>
        <DataTable
          rotulo="Contratos"
          dados={[]}
          colunas={COLUNAS}
          chaveLinha={(l) => l.id}
          erro="O servidor não respondeu. Verifique sua conexão."
          aoTentarNovamente={() => undefined}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-h2">Formulário</CardTitle>
          <CardDescription>
            <code className="font-mono">FormSection</code> + <code className="font-mono">ErrorSummary</code> com
            react-hook-form e zod; botão com estado carregando.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormularioDemo />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-h2">Estado vazio e botões</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <EmptyState
            titulo="Nenhuma pendência"
            descricao="Quando houver documentos aguardando sua assinatura, eles aparecem aqui."
          />
          <div className="flex flex-wrap gap-3">
            <Button>Primário</Button>
            <Button variant="secondary">Secundário</Button>
            <Button variant="outline">Contorno</Button>
            <Button variant="ghost">Fantasma</Button>
            <Button variant="destructive">Excluir</Button>
            <Button variant="link">Link</Button>
            <Button loading>Salvando</Button>
            <Button disabled>Desabilitado</Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
