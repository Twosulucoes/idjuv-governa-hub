/**
 * DIÁRIAS PAGAS (FIPLAN)
 * Diárias do exercício lidas do FIP 002 – Demonstrativo de Diárias: quem viajou, quanto recebeu, quando foi pago e se
 * já prestou contas (prazo de 10 dias depois do retorno). Só leitura; o arquivo entra por Financeiro → Atualizar dados.
 * Spec: docs/superpowers/specs/2026-10-30-diarias-fiplan-design.md
 */

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, FileSpreadsheet, FileUp, Plane, Users, Wallet } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import {
  DataTable,
  KpiCard,
  PageHeader,
  StatusBadge,
  aplicarFiltros,
  useEstadoFiltros,
  type ColunaTabela,
  type FiltroDef,
} from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { SeletorExercicio } from "@/components/financeiro/SeletorExercicio";
import { useAuth } from "@/contexts/AuthContext";
import { useDiariasFiplan, useUltimaImportacaoDiarias, type DiariaFiplan } from "@/hooks/useDiariasFiplan";
import { useExercicioFinanceiro } from "@/hooks/useExercicioFinanceiro";
import { exportarParaExcel } from "@/export/exportExcel";
import { dataBR } from "@/lib/bancario/exibicao";
import {
  PRAZO_PRESTACAO_DIAS,
  diasDesdeRetorno,
  resumirDiarias,
  seloPrestacao,
  situacaoPrestacao,
} from "@/lib/financeiro/diariasFiplan";
import { formatCurrency } from "@/lib/formatters";

const OPCOES_PRESTACAO = [
  { valor: "no_prazo", rotulo: "Sem prestação, no prazo" },
  { valor: "atrasada", rotulo: `Atrasada (mais de ${PRAZO_PRESTACAO_DIAS} dias)` },
  { valor: "sem_retorno", rotulo: "Sem data de retorno" },
  { valor: "prestou", rotulo: "Prestou contas" },
];

const PERMISSAO_IMPORTAR = "financeiro.execucao.importar";

export default function DiariasFiplanPage() {
  const { exercicio, comExercicio } = useExercicioFinanceiro();
  const { hasPermission } = useAuth();
  const diarias = useDiariasFiplan(exercicio);
  const ultima = useUltimaImportacaoDiarias(exercicio);
  const hoje = useMemo(() => new Date(), []);
  const definicoes = useMemo<FiltroDef<DiariaFiplan>[]>(
    () => [
      {
        tipo: "lista",
        id: "prestacao",
        rotulo: "Prestação de contas",
        principal: true,
        valor: (d) => situacaoPrestacao(d, hoje),
        opcoes: OPCOES_PRESTACAO,
      },
      { tipo: "periodo", id: "saida", rotulo: "Data da saída", principal: true, valor: (d) => d.data_saida },
      { tipo: "lista", id: "servidor", rotulo: "Servidor", principal: true, valor: (d) => d.credor_nome },
      { tipo: "periodo", id: "pagamento", rotulo: "Data do pagamento", valor: (d) => d.data_pagamento },
      { tipo: "faixa", id: "valor", rotulo: "Valor", formato: "moeda", valor: (d) => Number(d.valor_empenhado) },
      { tipo: "booleano", id: "sem_cadastro", rotulo: "Servidor sem cadastro no RH", valor: (d) => !d.servidor_id },
    ],
    [hoje],
  );
  const filtros = useEstadoFiltros("financeiro.diarias", definicoes);

  const todas = useMemo(() => diarias.data ?? [], [diarias.data]);
  // Cartões e Excel acompanham os filtros; a busca por texto fica só na tabela
  const lista = useMemo(() => aplicarFiltros(todas, definicoes, filtros.estado, hoje), [todas, definicoes, filtros.estado, hoje]);
  const resumo = resumirDiarias(lista, hoje);
  const carregando = diarias.isLoading;

  const colunas: ColunaTabela<DiariaFiplan>[] = [
    {
      id: "servidor",
      cabecalho: "Servidor",
      celula: (d) => (
        <span className="block max-w-[260px]">
          <span className="font-medium">{d.credor_nome}</span>
          {!d.servidor_id ? (
            <span className="block text-xs text-muted-foreground">Nome não achado no cadastro de servidores</span>
          ) : !d.viagem_id ? (
            <span className="block text-xs text-muted-foreground">Sem viagem cadastrada no RH</span>
          ) : null}
        </span>
      ),
      ordenarPor: (d) => d.credor_nome,
      buscarPor: (d) => `${d.credor_nome} ${d.processo_fiplan ?? ""} ${d.empenho_numero}`,
      mobile: "titulo",
    },
    {
      id: "viagem",
      cabecalho: "Viagem",
      celula: (d) => (
        <span className="text-sm">
          {dataBR(d.data_saida)}
          <span className="block text-muted-foreground">a {dataBR(d.data_retorno)}</span>
        </span>
      ),
      ordenarPor: (d) => d.data_saida,
    },
    {
      id: "quantidade",
      cabecalho: "Diárias",
      celula: (d) => <span className="tabular-nums">{Number(d.quantidade).toLocaleString("pt-BR")}</span>,
      ordenarPor: (d) => Number(d.quantidade),
      alinhamento: "direita",
    },
    {
      id: "valor",
      cabecalho: "Valor",
      celula: (d) => <span className="tabular-nums">{formatCurrency(Number(d.valor_empenhado))}</span>,
      ordenarPor: (d) => Number(d.valor_empenhado),
      alinhamento: "direita",
    },
    {
      id: "pagamento",
      cabecalho: "Pago em",
      celula: (d) => dataBR(d.data_pagamento),
      ordenarPor: (d) => d.data_pagamento,
    },
    {
      id: "prestacao",
      cabecalho: "Prestação de contas",
      celula: (d) => {
        const s = seloPrestacao(d, hoje);
        return <StatusBadge tom={s.tom}>{s.texto}</StatusBadge>;
      },
      ordenarPor: (d) => (d.prestou_contas ? -1 : diasDesdeRetorno(d.data_retorno, hoje) ?? 0),
    },
  ];

  const exportar = () =>
    exportarParaExcel(
      lista.map((d) => ({
        Servidor: d.credor_nome,
        "Código do credor": d.credor_codigo ?? "",
        Saída: dataBR(d.data_saida),
        Retorno: dataBR(d.data_retorno),
        Diárias: Number(d.quantidade),
        Valor: Number(d.valor_empenhado),
        "Pago em": dataBR(d.data_pagamento),
        "Prestação de contas": seloPrestacao(d, hoje).texto,
        Processo: d.processo_fiplan ?? "",
        Empenho: d.empenho_numero,
        NOB: d.nob_numero ?? "",
        "Ordem de serviço": d.ordem_servico ?? "",
      })),
      `diarias-fiplan-${exercicio}`,
      "Diárias",
    );

  return (
    <ModuleLayout module="financeiro">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Financeiro", href: comExercicio("/financeiro") }, { rotulo: "Diárias" }]}
          titulo="Diárias pagas"
          descricao={`Diárias do exercício ${exercicio} lidas do FIPLAN (FIP 002). O servidor tem ${PRAZO_PRESTACAO_DIAS} dias depois do retorno para prestar contas.`}
          acoes={<SeletorExercicio />}
        />

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-caption text-muted-foreground">
          <span>
            {ultima.data
              ? `Última importação do FIP 002: ${dataBR(ultima.data)}.`
              : "O FIP 002 ainda não foi importado neste exercício."}
          </span>
          {hasPermission(PERMISSAO_IMPORTAR) && (
            <Button variant="outline" size="sm" asChild>
              <Link to="/financeiro/atualizar?importador=diarias_fiplan">
                <FileUp className="mr-2 h-4 w-4" aria-hidden="true" />
                Atualizar
              </Link>
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard rotulo="Total pago" valor={formatCurrency(resumo.valor)} detalhe={`${resumo.quantidade} diárias`} icone={Wallet} carregando={carregando} />
          <KpiCard rotulo="Servidores" valor={resumo.servidores} icone={Users} carregando={carregando} />
          <KpiCard
            rotulo="Sem prestação de contas"
            valor={resumo.pendentes}
            detalhe={formatCurrency(resumo.valorPendente)}
            icone={Plane}
            carregando={carregando}
          />
          <KpiCard
            rotulo="Prestação atrasada"
            valor={resumo.atrasadas}
            detalhe={`Mais de ${PRAZO_PRESTACAO_DIAS} dias depois do retorno`}
            icone={AlertTriangle}
            carregando={carregando}
          />
        </div>

        <DataTable
          rotulo="Diárias pagas"
          dados={todas}
          colunas={colunas}
          chaveLinha={(d) => d.id}
          carregando={carregando}
          erro={diarias.isError ? "Verifique sua conexão e tente novamente." : null}
          aoTentarNovamente={() => diarias.refetch()}
          busca={{ placeholder: "Buscar por servidor, processo ou empenho..." }}
          filtrosDinamicos={filtros}
          filtros={
            <Button variant="outline" size="sm" onClick={exportar} disabled={lista.length === 0}>
              <FileSpreadsheet className="mr-2 h-4 w-4" aria-hidden="true" />
              Exportar Excel
            </Button>
          }
          vazio={{
            icone: Plane,
            titulo: "Nenhuma diária importada",
            descricao: "Importe o FIP 002 em Financeiro → Atualizar dados para ver as diárias do exercício.",
          }}
        />
      </div>
    </ModuleLayout>
  );
}
