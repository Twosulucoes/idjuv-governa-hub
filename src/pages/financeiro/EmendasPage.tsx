/**
 * EMENDAS PARLAMENTARES
 *
 * Cada emenda do exercício com tipo, autor, objeto, beneficiário e o saldo: valor, reservado (PED lançado à mão),
 * empenhado (soma dos empenhos ligados à emenda) e livre. Embaixo, a conferência com o QDD: quanto de cada
 * dotação de emenda ainda não tem emenda cadastrada.
 */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ModuleLayout } from "@/components/layout";
import EmendaFormDialog from "@/components/financeiro/EmendaFormDialog";
import { SeletorExercicio } from "@/components/financeiro/SeletorExercicio";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DataTable,
  KpiCard,
  PageHeader,
  aplicarFiltros,
  useEstadoFiltros,
  type ColunaTabela,
  type FiltroDef,
} from "@/components/design-system";
import { Landmark, PiggyBank, Plus, Pencil, Trash2, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import {
  ehEmenda,
  empenhadoPorEmenda,
  rotuloDotacaoEmenda,
  rotuloOrigem,
  saldoEmenda,
  semEmendaCadastrada,
  type SaldoEmenda,
} from "@/lib/financeiro/origemDotacao";
import { useDotacoes } from "@/hooks/useFinanceiro";
import { useDesativarEmenda, useEmendas, useEmpenhosDeEmendas } from "@/hooks/useEmendas";
import { useExercicioFinanceiro } from "@/hooks/useExercicioFinanceiro";
import { useAuth } from "@/contexts/AuthContext";
import type { Emenda } from "@/types/financeiro";

type LinhaEmenda = Emenda & { saldo: SaldoEmenda; dotacaoRotulo: string; empenhos: number };

const filtrosEmenda: FiltroDef<LinhaEmenda>[] = [
  { tipo: "lista", id: "autor", rotulo: "Autor", principal: true, valor: (e) => e.autor },
  { tipo: "lista", id: "tipo", rotulo: "Tipo de emenda", principal: true, valor: (e) => rotuloOrigem(e.idu) },
  { tipo: "booleano", id: "com_livre", rotulo: "Com saldo livre", principal: true, valor: (e) => e.saldo.livre > 0 },
  { tipo: "booleano", id: "sem_empenho", rotulo: "Sem empenho", valor: (e) => e.empenhos === 0 },
  { tipo: "booleano", id: "estourada", rotulo: "Saldo negativo", valor: (e) => e.saldo.livre < 0 },
  { tipo: "lista", id: "beneficiario", rotulo: "Beneficiário", valor: (e) => e.beneficiario },
  { tipo: "faixa", id: "valor", rotulo: "Valor da emenda", formato: "moeda", valor: (e) => e.saldo.valor },
];

const colunas: ColunaTabela<LinhaEmenda>[] = [
  {
    id: "numero",
    cabecalho: "Emenda",
    celula: (e) => (
      <div>
        <p className="font-medium">{e.numero}</p>
        <p className="text-caption text-muted-foreground">{rotuloOrigem(e.idu)}</p>
      </div>
    ),
    ordenarPor: (e) => e.numero,
    buscarPor: (e) => `${e.numero} ${e.idu}`,
    mobile: "titulo",
  },
  {
    id: "autor",
    cabecalho: "Autor",
    celula: (e) => e.autor,
    ordenarPor: (e) => e.autor,
    buscarPor: (e) => e.autor,
  },
  {
    id: "objeto",
    cabecalho: "Objeto e beneficiário",
    celula: (e) => (
      <div className="max-w-sm">
        <p className="line-clamp-2">{e.objeto}</p>
        {e.beneficiario && <p className="text-caption text-muted-foreground">Beneficiário: {e.beneficiario}</p>}
      </div>
    ),
    buscarPor: (e) => `${e.objeto} ${e.beneficiario ?? ""}`,
  },
  {
    id: "dotacao",
    cabecalho: "Dotação",
    celula: (e) => <span className="font-mono text-caption">{e.dotacaoRotulo}</span>,
    ordenarPor: (e) => e.dotacaoRotulo,
  },
  {
    id: "valor",
    cabecalho: "Valor",
    celula: (e) => <span className="font-mono tabular-nums">{formatCurrency(e.saldo.valor)}</span>,
    ordenarPor: (e) => e.saldo.valor,
    alinhamento: "direita",
  },
  {
    id: "reservado",
    cabecalho: "Reservado",
    celula: (e) => (
      <span className="font-mono tabular-nums">
        {e.saldo.reservado ? formatCurrency(e.saldo.reservado) : "—"}
        {e.ped_numero && <span className="block text-caption text-muted-foreground">PED {e.ped_numero}</span>}
      </span>
    ),
    ordenarPor: (e) => e.saldo.reservado,
    alinhamento: "direita",
  },
  {
    id: "empenhado",
    cabecalho: "Empenhado",
    celula: (e) => (
      <span className="font-mono tabular-nums">
        {e.saldo.empenhado ? formatCurrency(e.saldo.empenhado) : "—"}
        {e.empenhos > 0 && (
          <span className="block text-caption text-muted-foreground">
            {e.empenhos} empenho{e.empenhos > 1 ? "s" : ""}
          </span>
        )}
      </span>
    ),
    ordenarPor: (e) => e.saldo.empenhado,
    alinhamento: "direita",
  },
  {
    id: "livre",
    cabecalho: "Livre",
    celula: (e) => (
      <span className={`font-mono font-semibold tabular-nums ${e.saldo.livre < 0 ? "text-destructive" : ""}`}>
        {formatCurrency(e.saldo.livre)}
      </span>
    ),
    ordenarPor: (e) => e.saldo.livre,
    alinhamento: "direita",
  },
];

export default function EmendasPage() {
  const { exercicio, comExercicio } = useExercicioFinanceiro();
  const { hasPermission } = useAuth();
  const podeEditar = hasPermission("orcamento.criar");
  const { data: emendas, isLoading, isError, refetch } = useEmendas(exercicio);
  const { data: empenhos, isLoading: carregandoEmpenhos } = useEmpenhosDeEmendas(exercicio);
  const { data: dotacoes } = useDotacoes(exercicio);
  const desativar = useDesativarEmenda();
  const [formOpen, setFormOpen] = useState(false);
  const [emEdicao, setEmEdicao] = useState<Emenda | null>(null);

  const dotacoesEmenda = useMemo(() => (dotacoes ?? []).filter((d) => ehEmenda(d.idu)), [dotacoes]);

  const linhas = useMemo<LinhaEmenda[]>(() => {
    const empenhado = empenhadoPorEmenda(empenhos ?? []);
    return (emendas ?? []).map((e) => {
      const dotacao = dotacoesEmenda.find((d) => d.id === e.dotacao_id);
      return {
        ...e,
        saldo: saldoEmenda(e, empenhado.get(e.id) ?? 0),
        dotacaoRotulo: dotacao ? rotuloDotacaoEmenda(dotacao) : "Dotação fora do QDD atual",
        empenhos: (empenhos ?? []).filter((x) => x.emenda_id === e.id).length,
      };
    });
  }, [emendas, empenhos, dotacoesEmenda]);

  const filtros = useEstadoFiltros("financeiro.emendas", filtrosEmenda);
  // Os cartões de totais acompanham os filtros escolhidos
  const filtradas = useMemo(
    () => aplicarFiltros(linhas, filtros.definicoes, filtros.estado),
    [linhas, filtros.definicoes, filtros.estado],
  );

  const totais = filtradas.reduce(
    (t, l) => ({
      valor: t.valor + l.saldo.valor,
      reservado: t.reservado + l.saldo.reservado,
      empenhado: t.empenhado + l.saldo.empenhado,
      livre: t.livre + l.saldo.livre,
    }),
    { valor: 0, reservado: 0, empenhado: 0, livre: 0 },
  );

  const conferencia = dotacoesEmenda
    .map((d) => ({ dotacao: d, falta: semEmendaCadastrada(d, emendas ?? []) }))
    .filter((c) => c.dotacao.valor_atual > 0 || c.falta !== 0);

  const abrir = (e: Emenda | null) => {
    setEmEdicao(e);
    setFormOpen(true);
  };

  return (
    <ModuleLayout module="financeiro">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Financeiro", href: "/financeiro" }, { rotulo: "Emendas parlamentares" }]}
          titulo="Emendas parlamentares"
          descricao={`Autor, objeto, beneficiário e saldo de cada emenda de ${exercicio}. O saldo de emenda só serve ao objeto da emenda.`}
          acoes={
            <div className="flex flex-wrap gap-2">
              <SeletorExercicio />
              <Button variant="outline" asChild>
                <Link to={comExercicio("/financeiro/qdd")}>Ver no QDD</Link>
              </Button>
              {podeEditar && (
                <Button onClick={() => abrir(null)}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Nova emenda
                </Button>
              )}
            </div>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard rotulo="Valor das emendas cadastradas" valor={formatCurrency(totais.valor)} icone={Landmark} carregando={isLoading} />
          <KpiCard rotulo="Reservado (PED)" valor={formatCurrency(totais.reservado)} icone={PiggyBank} carregando={isLoading} />
          <KpiCard
            rotulo="Empenhado"
            valor={formatCurrency(totais.empenhado)}
            icone={TrendingUp}
            carregando={isLoading || carregandoEmpenhos}
          />
          <KpiCard rotulo="Livre" valor={formatCurrency(totais.livre)} icone={PiggyBank} carregando={isLoading || carregandoEmpenhos} />
        </div>

        <DataTable
          rotulo="Emendas cadastradas"
          dados={linhas}
          colunas={colunas}
          chaveLinha={(e) => e.id}
          carregando={isLoading}
          erro={isError ? "Não foi possível carregar as emendas." : null}
          aoTentarNovamente={() => refetch()}
          acoesLinha={
            podeEditar
              ? (e) => (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => abrir(e)} aria-label={`Editar emenda ${e.numero}`}>
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (window.confirm(`Remover a emenda ${e.numero} da lista? Os empenhos ligados a ela continuam ligados.`)) {
                          desativar.mutate(e.id);
                        }
                      }}
                      aria-label={`Remover emenda ${e.numero}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                )
              : undefined
          }
          busca={{ placeholder: "Buscar por número, autor, objeto ou beneficiário…" }}
          filtrosDinamicos={filtros}
          vazio={{
            icone: Landmark,
            titulo: "Nenhuma emenda cadastrada",
            descricao: "Cadastre as emendas a partir das dotações de emenda do QDD.",
          }}
        />

        {conferencia.length > 0 && (
          <section aria-labelledby="emendas-conferencia" className="space-y-2">
            <h2 id="emendas-conferencia" className="text-h3 font-semibold text-foreground">
              Conferência com o QDD
            </h2>
            <p className="text-body text-muted-foreground">
              Dotação atual de cada natureza de emenda no QDD contra a soma das emendas cadastradas nela.
            </p>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead>Dotação</TableHead>
                      <TableHead className="text-right">Atual no QDD</TableHead>
                      <TableHead className="text-right">Disponível no QDD</TableHead>
                      <TableHead className="text-right">Sem emenda cadastrada</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conferencia.map(({ dotacao, falta }) => (
                      <TableRow key={dotacao.id} className="text-xs">
                        <TableCell className="font-mono">{rotuloDotacaoEmenda(dotacao)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(dotacao.valor_atual)}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(dotacao.saldo_disponivel)}</TableCell>
                        <TableCell className={`text-right font-mono ${falta < 0 ? "text-destructive font-semibold" : ""}`}>
                          {falta === 0 ? "—" : formatCurrency(falta)}
                          {falta < 0 && <span className="block font-normal">cadastro passa da dotação</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
      <EmendaFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        exercicio={exercicio}
        dotacoes={dotacoesEmenda}
        emenda={emEdicao}
      />
    </ModuleLayout>
  );
}
