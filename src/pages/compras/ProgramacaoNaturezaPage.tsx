/**
 * Programação por natureza: para cada combinação ação × fonte × natureza do QDD, o disponível no FIPLAN, o que os
 * processos já reservaram e ainda não viraram PED/empenho, e o saldo livre que sobra. Responde "esta natureza já tem
 * programação?" sem abrir processo por processo.
 * Spec: docs/superpowers/specs/2026-10-23-compras-processos-reserva-natureza-design.md (§10)
 */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Landmark } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { DataTable, KpiCard, PageHeader, StatusBadge, type ColunaTabela } from "@/components/design-system";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatarNatureza } from "@/lib/financeiro/painelExecucao";
import { formatCurrency } from "@/lib/formatters";
import { useProgramacaoPorNatureza, type LinhaProgramacao } from "@/hooks/useProcessosContratacao";

const TODAS = "todas";
const FILTROS = [
  { value: TODAS, label: "Todas as naturezas" },
  { value: "com_processo", label: "Com processo reservado" },
  { value: "sem_processo", label: "Sem processo reservado" },
  { value: "negativo", label: "Saldo livre negativo" },
];

const chave = (l: LinhaProgramacao) => `${l.acao_id}|${l.fonte_recurso_id}|${l.natureza_despesa_id}`;

const colunas: ColunaTabela<LinhaProgramacao>[] = [
  {
    id: "natureza",
    cabecalho: "Natureza",
    celula: (l) => (
      <span>
        <span className="font-medium">{formatarNatureza(l.natureza_codigo)}</span>
        <span className="block text-muted-foreground">{l.natureza_nome}</span>
        <span className="block whitespace-nowrap text-xs text-muted-foreground">ação {l.acao_codigo} · fonte {l.fonte_codigo}</span>
      </span>
    ),
    ordenarPor: (l) => l.natureza_codigo,
    buscarPor: (l) => `${formatarNatureza(l.natureza_codigo)} ${l.natureza_codigo} ${l.natureza_nome} ${l.acao_codigo} ${l.fonte_codigo}`,
    mobile: "titulo",
    className: "min-w-[12rem]",
  },
  {
    id: "atual",
    cabecalho: "Dotação atual",
    celula: (l) => (l.tem_qdd ? <span className="whitespace-nowrap">{formatCurrency(l.dotacao_atual)}</span> : <span className="text-muted-foreground">sem QDD</span>),
    ordenarPor: (l) => l.dotacao_atual,
    alinhamento: "direita",
  },
  {
    id: "reserva",
    cabecalho: "PED sem empenho",
    celula: (l) => <span className="whitespace-nowrap">{formatCurrency(l.reserva_fiplan)}</span>,
    ordenarPor: (l) => l.reserva_fiplan,
    alinhamento: "direita",
  },
  {
    id: "disponivel",
    cabecalho: "Disponível no FIPLAN",
    celula: (l) => <span className="whitespace-nowrap">{formatCurrency(l.saldo_fiplan)}</span>,
    ordenarPor: (l) => l.saldo_fiplan,
    alinhamento: "direita",
  },
  {
    id: "pendente",
    cabecalho: "Reservado em processos",
    celula: (l) => (l.pendente_processos > 0 ? <span className="whitespace-nowrap">{formatCurrency(l.pendente_processos)}</span> : "—"),
    ordenarPor: (l) => l.pendente_processos,
    alinhamento: "direita",
  },
  {
    id: "livre",
    cabecalho: "Saldo livre",
    celula: (l) => (
      <span className={l.saldo_livre < 0 ? "whitespace-nowrap font-semibold text-destructive" : "whitespace-nowrap font-semibold"}>{formatCurrency(l.saldo_livre)}</span>
    ),
    ordenarPor: (l) => l.saldo_livre,
    alinhamento: "direita",
  },
  {
    id: "processos",
    cabecalho: "Processos",
    celula: (l) =>
      l.processos.length === 0 ? (
        <span className="text-muted-foreground">nenhum</span>
      ) : (
        <ul className="space-y-1">
          {l.processos.map((p) => (
            <li key={p.id}>
              <Link to={`/compras/processos/${p.id}`} className="font-medium text-primary underline-offset-2 hover:underline">
                {p.numero_processo}
              </Link>
              <span className="block text-xs text-muted-foreground">
                {p.objeto} · pendente {formatCurrency(p.pendente)}
              </span>
            </li>
          ))}
        </ul>
      ),
    buscarPor: (l) => l.processos.map((p) => `${p.numero_processo} ${p.objeto}`).join(" "),
    className: "min-w-[12rem]",
  },
];

export default function ProgramacaoNaturezaPage() {
  const anoAtual = new Date().getFullYear();
  const [exercicio, setExercicio] = useState(anoAtual);
  const [filtro, setFiltro] = useState(TODAS);
  const programacao = useProgramacaoPorNatureza(exercicio);
  const linhas = useMemo(() => programacao.data ?? [], [programacao.data]);

  const filtradas = linhas.filter((l) => {
    if (filtro === "com_processo") return l.processos.length > 0;
    if (filtro === "sem_processo") return l.processos.length === 0;
    if (filtro === "negativo") return l.saldo_livre < 0;
    return true;
  });

  const soma = (campo: "saldo_fiplan" | "pendente_processos" | "saldo_livre") => linhas.reduce((s, l) => s + l[campo], 0);
  const negativas = linhas.filter((l) => l.saldo_livre < 0).length;

  return (
    <ModuleLayout module="compras">
      <div className="space-y-6">
        <PageHeader
          titulo="Programação por natureza"
          descricao="Quanto de cada natureza do QDD já está comprometido em processos de contratação"
          migalhas={[
            { rotulo: "Compras", href: "/compras" },
            { rotulo: "Processos", href: "/compras/processos" },
            { rotulo: "Programação por natureza" },
          ]}
          acoes={
            <Select value={String(exercicio)} onValueChange={(v) => setExercicio(Number(v))}>
              <SelectTrigger className="w-44" aria-label="Exercício"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[anoAtual + 1, anoAtual, anoAtual - 1].map((a) => <SelectItem key={a} value={String(a)}>Exercício {a}</SelectItem>)}
              </SelectContent>
            </Select>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard rotulo="Disponível no FIPLAN" valor={formatCurrency(soma("saldo_fiplan"))} detalhe="atual − bloqueado − PED" carregando={programacao.isLoading} />
          <KpiCard rotulo="Reservado em processos" valor={formatCurrency(soma("pendente_processos"))} detalhe="ainda sem PED ou empenho" carregando={programacao.isLoading} />
          <KpiCard rotulo="Saldo livre" valor={formatCurrency(soma("saldo_livre"))} detalhe="disponível − reservado" carregando={programacao.isLoading} />
          <KpiCard
            rotulo="Naturezas no negativo"
            valor={negativas}
            detalhe={negativas > 0 ? <StatusBadge tom="erro" icone={false}>reservaram mais que o saldo</StatusBadge> : "nenhuma"}
            carregando={programacao.isLoading}
          />
        </div>

        <DataTable
          rotulo="Programação por natureza"
          dados={filtradas}
          colunas={colunas}
          chaveLinha={chave}
          carregando={programacao.isLoading}
          erro={programacao.isError ? "Não foi possível carregar a programação." : null}
          aoTentarNovamente={() => programacao.refetch()}
          busca={{ placeholder: "Buscar por natureza, ação, fonte ou processo" }}
          filtros={
            <Select value={filtro} onValueChange={setFiltro}>
              <SelectTrigger className="w-full sm:w-56" aria-label="Filtrar naturezas"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FILTROS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
              </SelectContent>
            </Select>
          }
          vazio={{
            icone: Landmark,
            titulo: linhas.length === 0 ? `Sem QDD de ${exercicio}` : "Nenhuma natureza neste filtro",
            descricao:
              linhas.length === 0
                ? "A programação aparece quando o Financeiro importa o QDD do exercício (Financeiro → Atualizar dados)."
                : "Troque o filtro para ver as outras naturezas.",
          }}
        />
      </div>
    </ModuleLayout>
  );
}
