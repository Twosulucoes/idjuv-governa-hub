/**
 * Ficha de uma proposta federal do Transferegov: dados da proposta, emendas que a pagam, o convênio (quando houver),
 * prazos, e os empenhos e desembolsos da União. Só leitura.
 * Spec docs/superpowers/specs/2026-10-29-convenios-federais-transferegov-design.md.
 */

import { Link, useParams } from "react-router-dom";
import { FileSearch, ScrollText } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { DataTable, EmptyState, PageHeader, StatusBadge, type ColunaTabela } from "@/components/design-system";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useConvenioFederal,
  useMovimentosConvenioFederal,
  type EmendaFederal,
  type MovimentoFederal,
} from "@/hooks/useConveniosFederais";
import { useExercicioFinanceiro } from "@/hooks/useExercicioFinanceiro";
import { dataBR } from "@/lib/bancario/exibicao";
import { alertasConvenio, diasAte, percentual, rotuloTipoAutor } from "@/lib/financeiro/conveniosFederais";
import { formatCurrency } from "@/lib/formatters";

const colunasEmendas: ColunaTabela<EmendaFederal>[] = [
  {
    id: "emenda",
    cabecalho: "Emenda",
    celula: (e) => (
      <span>
        <span className="font-mono">{e.numero_emenda}</span>
        {e.impositiva && <Badge variant="outline" className="ml-2">Impositiva</Badge>}
        {e.programa_emenda && <span className="block font-mono text-xs text-muted-foreground">Programa {e.programa_emenda}</span>}
      </span>
    ),
    mobile: "titulo",
  },
  {
    id: "autor",
    cabecalho: "Autor",
    celula: (e) => (
      <span>
        {e.parlamentar ?? "—"}
        {e.tipo_parlamentar && <span className="block text-xs text-muted-foreground">{rotuloTipoAutor(e.tipo_parlamentar)}</span>}
      </span>
    ),
  },
  {
    id: "valor",
    cabecalho: "Repasse da emenda",
    celula: (e) => <span className="tabular-nums">{formatCurrency(Number(e.valor_repasse_emenda ?? 0))}</span>,
    alinhamento: "direita",
  },
];

const colunasMovimentos: ColunaTabela<MovimentoFederal>[] = [
  {
    id: "documento",
    cabecalho: "Documento",
    celula: (m) => (
      <span>
        <span className="font-medium">{m.tipo === "empenho" ? "Empenho da União" : "Desembolso (recebido)"}</span>
        <span className="block font-mono text-xs text-muted-foreground">{m.numero ?? "—"}</span>
      </span>
    ),
    mobile: "titulo",
  },
  { id: "data", cabecalho: "Data", celula: (m) => dataBR(m.data), ordenarPor: (m) => m.data },
  {
    id: "valor",
    cabecalho: "Valor",
    celula: (m) => <span className="tabular-nums">{formatCurrency(Number(m.valor ?? 0))}</span>,
    ordenarPor: (m) => Number(m.valor ?? 0),
    alinhamento: "direita",
  },
  { id: "situacao", cabecalho: "Situação", celula: (m) => m.situacao ?? "—" },
  {
    id: "descricao",
    cabecalho: "Descrição",
    celula: (m) => (
      <span className="block max-w-[360px] text-xs">
        {m.descricao ?? "—"}
        {m.indicacao && <span className="block text-muted-foreground">{m.indicacao}</span>}
        {m.natureza_despesa && <span className="block font-mono text-muted-foreground">Natureza {m.natureza_despesa}</span>}
      </span>
    ),
  },
];

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-muted-foreground">{rotulo}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

function Moeda({ valor }: { valor: number | null | undefined }) {
  return <span className="tabular-nums">{formatCurrency(Number(valor ?? 0))}</span>;
}

function Prazo({ data }: { data: string | null }) {
  const dias = diasAte(data, new Date());
  return (
    <>
      {dataBR(data)}
      {dias !== null && (
        <span className="block text-xs text-muted-foreground">
          {dias < 0 ? `há ${-dias} dias` : dias === 0 ? "hoje" : `faltam ${dias} dias`}
        </span>
      )}
    </>
  );
}

export default function ConvenioFederalPage() {
  const { id } = useParams<{ id: string }>();
  const idProposta = id && /^\d+$/.test(id) ? Number(id) : undefined;
  const { comExercicio } = useExercicioFinanceiro();
  const consulta = useConvenioFederal(idProposta);
  const p = consulta.data;
  const c = p?.convenio ?? null;
  const movimentos = useMovimentosConvenioFederal(c?.numero);

  const migalhas = [
    { rotulo: "Financeiro", href: comExercicio("/financeiro") },
    { rotulo: "Convênios federais", href: "/financeiro/convenios" },
    { rotulo: p?.numero ?? "Proposta" },
  ];

  if (consulta.isLoading) {
    return (
      <ModuleLayout module="financeiro">
        <div className="space-y-6">
          <PageHeader migalhas={migalhas} titulo="Convênio federal" />
          <Skeleton className="h-48 w-full" />
        </div>
      </ModuleLayout>
    );
  }

  if (consulta.isError || !p) {
    return (
      <ModuleLayout module="financeiro">
        <div className="space-y-6">
          <PageHeader migalhas={migalhas} titulo="Convênio federal" />
          <Card>
            <EmptyState
              icone={FileSearch}
              titulo={consulta.isError ? "Não foi possível carregar a proposta" : "Proposta não encontrada"}
              descricao={consulta.isError ? "Tente de novo em instantes." : "A proposta não está no último retrato do Transferegov."}
              acao={
                <Button asChild>
                  <Link to="/financeiro/convenios">Voltar para convênios federais</Link>
                </Button>
              }
              className="py-12"
            />
          </Card>
        </div>
      </ModuleLayout>
    );
  }

  const alertas = alertasConvenio(c);
  const global = c?.valor_global ?? p.valor_global;
  const recebidoPct = percentual(c?.valor_desembolsado, c?.valor_repasse ?? p.valor_repasse);

  return (
    <ModuleLayout module="financeiro">
      <div className="space-y-6">
        <PageHeader
          migalhas={migalhas}
          titulo={p.objeto ?? `Proposta ${p.numero}`}
          descricao={p.orgao_superior ?? p.orgao ?? undefined}
          status={
            <span className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="font-mono">Proposta {p.numero}</Badge>
              {c && <Badge variant="outline" className="font-mono">Convênio {c.numero}</Badge>}
              {alertas.map((a) => (
                <StatusBadge key={a.texto} tom={a.tom}>{a.texto}</StatusBadge>
              ))}
            </span>
          }
        />

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">{c ? "Convênio" : "Proposta"}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-3">
                <Campo rotulo="Situação da proposta">{p.situacao ?? "—"}</Campo>
                {c && <Campo rotulo="Situação do convênio">{[c.situacao, c.subsituacao].filter(Boolean).join(" · ") || "—"}</Campo>}
                {c && <Campo rotulo="Assinado">{c.assinado === null ? "—" : c.assinado ? `Sim, em ${dataBR(c.data_assinatura)}` : "Ainda não"}</Campo>}
                {c && <Campo rotulo="Publicação">{c.situacao_publicacao ?? "—"}{c.data_publicacao && ` em ${dataBR(c.data_publicacao)}`}</Campo>}
                <Campo rotulo="Data da proposta">{dataBR(p.data_proposta)}</Campo>
                <Campo rotulo="Início da vigência">{dataBR(c?.inicio_vigencia ?? p.inicio_vigencia)}</Campo>
                <Campo rotulo="Fim da vigência"><Prazo data={c?.fim_vigencia ?? p.fim_vigencia} /></Campo>
                {c && <Campo rotulo="Prestação de contas até"><Prazo data={c.data_limite_prestacao_contas} /></Campo>}
                {c && <Campo rotulo="Aditivos e prorrogações">{`${c.qtd_aditivos ?? 0} aditivo(s), ${c.qtd_prorrogacoes ?? 0} prorrogação(ões)`}</Campo>}
                {c?.numero_processo && <Campo rotulo="Processo na União"><span className="font-mono text-xs">{c.numero_processo}</span></Campo>}
                <Campo rotulo="Órgão concedente">{p.orgao ?? "—"}</Campo>
                {(p.banco || p.conta) && (
                  <Campo rotulo="Conta do convênio">
                    <span className="font-mono text-xs">{[p.banco, p.agencia && `ag. ${p.agencia}`, p.conta && `c/c ${p.conta}`].filter(Boolean).join(" · ")}</span>
                  </Campo>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Valores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="grid grid-cols-2 gap-4 lg:grid-cols-1">
                <Campo rotulo="Valor global"><Moeda valor={global} /></Campo>
                <Campo rotulo="Repasse da União"><Moeda valor={c?.valor_repasse ?? p.valor_repasse} /></Campo>
                <Campo rotulo="Contrapartida"><Moeda valor={c?.valor_contrapartida ?? p.valor_contrapartida} /></Campo>
                {c && <Campo rotulo="Empenhado pela União"><Moeda valor={c.valor_empenhado} /></Campo>}
                {c && <Campo rotulo="Recebido (desembolsado)"><Moeda valor={c.valor_desembolsado} /></Campo>}
                {c && c.saldo_conta !== null && <Campo rotulo="Saldo na conta"><Moeda valor={c.saldo_conta} /></Campo>}
              </dl>
              {recebidoPct !== null && c && (
                <div className="space-y-1">
                  {recebidoPct > 0 && <Progress value={recebidoPct} aria-label="Parte do repasse já recebida" />}
                  <p className="text-xs text-muted-foreground">{recebidoPct}% do repasse já recebido</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <section className="space-y-3" aria-labelledby="emendas">
          <h2 id="emendas" className="text-lg font-semibold">Emendas</h2>
          <DataTable
            rotulo="Emendas da proposta"
            dados={p.emendas}
            colunas={colunasEmendas}
            chaveLinha={(e) => e.numero_emenda}
            vazio={{ icone: ScrollText, titulo: "Sem emenda", descricao: "A proposta não é paga por emenda parlamentar." }}
          />
        </section>

        {c && (
          <section className="space-y-3" aria-labelledby="movimentos">
            <h2 id="movimentos" className="text-lg font-semibold">Empenhos e desembolsos da União</h2>
            <DataTable
              rotulo="Empenhos e desembolsos do convênio"
              dados={movimentos.data ?? []}
              colunas={colunasMovimentos}
              chaveLinha={(m) => `${m.tipo}:${m.id_origem}`}
              carregando={movimentos.isLoading}
              erro={movimentos.isError ? "Não foi possível carregar os movimentos." : null}
              aoTentarNovamente={() => movimentos.refetch()}
              vazio={{ icone: ScrollText, titulo: "Sem movimentos", descricao: "A União ainda não empenhou nem pagou este convênio." }}
            />
          </section>
        )}
      </div>
    </ModuleLayout>
  );
}
