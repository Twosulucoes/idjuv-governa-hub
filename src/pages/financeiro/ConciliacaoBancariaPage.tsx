/**
 * Conciliação bancária do Financeiro (spec docs/superpowers/specs/2026-10-11-financeiro-fiplan-banco-design.md).
 *
 * Abas:
 *  - Movimentos: pagamentos vistos nos arquivos do banco (OBN600/CNAB 240), importação e conciliação manual;
 *  - Recusados: correção de banco/agência/conta (gravada no banco), arquivo de reenvio no leiaute do BB Gestão MAX
 *    e lista dos arquivos gerados (baixar de novo conferindo o SHA-256, cancelar reserva sem arquivo);
 *  - Banco do Brasil (API): situação da conexão e importação de extrato.
 * Rota protegida por `pagamento.conciliar`; o banco confere a mesma permissão nas RPCs.
 */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertOctagon,
  Banknote,
  CheckCircle2,
  FileDown,
  FileUp,
  Link2,
  Pencil,
  Send,
  Unlink,
} from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { DataTable, KpiCard, PageHeader, StatusBadge, type ColunaTabela } from "@/components/design-system";
import { ImportacaoWizard } from "@/components/importacao";
import { SeletorExercicio } from "@/components/financeiro/SeletorExercicio";
import { BancoDoBrasilApiPainel } from "@/components/financeiro/conciliacao/BancoDoBrasilApiPainel";
import { ConciliarMovimentoDialog } from "@/components/financeiro/conciliacao/ConciliarMovimentoDialog";
import { CorrigirContaDialog } from "@/components/financeiro/conciliacao/CorrigirContaDialog";
import { GerarRemessaDialog } from "@/components/financeiro/conciliacao/GerarRemessaDialog";
import { RemessasGeradas } from "@/components/financeiro/conciliacao/RemessasGeradas";
import { SituacaoMovimentoBadge } from "@/components/financeiro/conciliacao/movimentoUi";
import {
  ROTULO_ORIGEM_ARQUIVO,
  contaFavorecido,
  dataBR,
  documentoMascarado,
  rotuloTipoLancamento,
} from "@/lib/bancario/exibicao";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useExercicioFinanceiro } from "@/hooks/useExercicioFinanceiro";
import { useMovimentosBancarios } from "@/hooks/useConciliacaoBancaria";
import { importadorArquivoBancario } from "@/lib/importacao/importadores/arquivoBancario";
import { formatCurrency } from "@/lib/formatters";
import type { FiltroSituacaoMovimento, MovimentoBancario } from "@/types/conciliacaoBancaria";

const colunasBase: ColunaTabela<MovimentoBancario>[] = [
  {
    id: "data",
    cabecalho: "Data",
    celula: (m) => <span className="whitespace-nowrap">{dataBR(m.data_pagamento ?? m.data_arquivo)}</span>,
    ordenarPor: (m) => m.data_pagamento ?? m.data_arquivo,
  },
  {
    id: "identificador",
    cabecalho: "OB / seu número",
    celula: (m) => <span className="font-mono">{m.identificador}</span>,
    buscarPor: (m) => m.identificador,
    ordenarPor: (m) => m.identificador,
  },
  {
    id: "favorecido",
    cabecalho: "Favorecido",
    celula: (m) => (
      <span className="block min-w-0">
        <span className="block truncate">{m.favorecido_nome || "—"}</span>
        <span className="block font-mono text-xs text-muted-foreground">
          {documentoMascarado(m.favorecido_documento)}
        </span>
      </span>
    ),
    buscarPor: (m) => m.favorecido_nome,
    ordenarPor: (m) => m.favorecido_nome,
    mobile: "titulo",
  },
  {
    id: "valor",
    cabecalho: "Valor",
    celula: (m) => <span className="tabular-nums">{formatCurrency(Number(m.valor))}</span>,
    ordenarPor: (m) => Number(m.valor),
    alinhamento: "direita",
  },
];

const colunaSituacao: ColunaTabela<MovimentoBancario> = {
  id: "situacao",
  cabecalho: "Situação",
  celula: (m) => <SituacaoMovimentoBadge situacao={m.situacao} />,
  ordenarPor: (m) => m.situacao,
};

const colunasMovimentos: ColunaTabela<MovimentoBancario>[] = [
  colunasBase[0],
  {
    id: "origem",
    cabecalho: "Arquivo",
    celula: (m) => (
      <span className="whitespace-nowrap text-xs">
        {ROTULO_ORIGEM_ARQUIVO[m.origem] ?? m.origem} · {m.sentido === "retorno" ? "retorno" : "remessa"}
        <span className="block text-muted-foreground">{rotuloTipoLancamento(m.tipo_lancamento)}</span>
      </span>
    ),
    ordenarPor: (m) => m.origem,
  },
  ...colunasBase.slice(1),
  colunaSituacao,
  {
    id: "pagamento",
    cabecalho: "Pagamento",
    celula: (m) =>
      m.pagamento ? (
        <Link to={`/financeiro/pagamentos/${m.pagamento.id}`} className="font-mono text-primary underline-offset-4 hover:underline">
          {m.pagamento.numero}
        </Link>
      ) : (
        <span className="text-muted-foreground">Sem pagamento</span>
      ),
    buscarPor: (m) => m.pagamento?.numero,
  },
];

const FILTROS: { valor: FiltroSituacaoMovimento; rotulo: string }[] = [
  { valor: "todos", rotulo: "Todas as situações" },
  { valor: "pago", rotulo: "Pago" },
  { valor: "recusado", rotulo: "Recusado" },
  { valor: "enviado", rotulo: "Enviado" },
  { valor: "sem_pagamento", rotulo: "Sem pagamento" },
];

/**
 * Pode entrar num arquivo de reenvio: ainda não reenviado, sem reserva pendente (remessa_id sem reenviado_em) e
 * não é fatura/guia (pagamento por código de barras não vai no leiaute de crédito em conta).
 */
const podeReenviar = (m: MovimentoBancario) => !m.reenviado_em && !m.remessa_id && m.tipo_lancamento !== "fatura";

/** Conta corrigida no formato de exibição "banco / agência-DV / conta-DV". */
function contaCorrigidaTexto(m: MovimentoBancario): string {
  const c = m.conta_corrigida!;
  return `${c.banco} / ${c.agencia}${c.agencia_dv ? `-${c.agencia_dv}` : ""} / ${c.conta}${c.conta_dv ? `-${c.conta_dv}` : ""}`;
}

function filtrar(movimentos: MovimentoBancario[], filtro: FiltroSituacaoMovimento) {
  if (filtro === "todos") return movimentos;
  if (filtro === "sem_pagamento") return movimentos.filter((m) => !m.pagamento_id);
  return movimentos.filter((m) => m.situacao === filtro);
}

export default function ConciliacaoBancariaPage() {
  const { exercicio } = useExercicioFinanceiro();
  const { data, isLoading, isError, refetch } = useMovimentosBancarios(exercicio);
  const movimentos = useMemo(() => data ?? [], [data]);

  const [aba, setAba] = useState("movimentos");
  const [filtro, setFiltro] = useState<FiltroSituacaoMovimento>("todos");
  const [importarAberto, setImportarAberto] = useState(false);
  const [importando, setImportando] = useState(false);
  const [paraConciliar, setParaConciliar] = useState<MovimentoBancario | null>(null);
  const [paraCorrigir, setParaCorrigir] = useState<MovimentoBancario | null>(null);
  const [reenvio, setReenvio] = useState<{ movimentos: MovimentoBancario[]; limpar: () => void } | null>(null);

  const recusados = useMemo(() => movimentos.filter((m) => m.situacao === "recusado"), [movimentos]);
  const contagem = useMemo(
    () => ({
      pagos: movimentos.filter((m) => m.situacao === "pago").length,
      recusados: recusados.length,
      enviados: movimentos.filter((m) => m.situacao === "enviado").length,
      semPagamento: movimentos.filter((m) => !m.pagamento_id).length,
    }),
    [movimentos, recusados],
  );

  const colunasRecusados = useMemo<ColunaTabela<MovimentoBancario>[]>(
    () => [
      ...colunasBase,
      {
        id: "conta",
        cabecalho: "Banco / agência / conta",
        celula: (m) =>
          m.conta_corrigida ? (
            <span className="block text-xs">
              <span className="whitespace-nowrap font-mono">{contaCorrigidaTexto(m)}</span>{" "}
              <StatusBadge tom="destaque">{m.conta_corrigida.validado_bb ? "corrigido · validado no BB" : "corrigido"}</StatusBadge>
              <span className="block text-muted-foreground">
                Por {m.corrigido_por_nome || "—"}
                {m.corrigido_em ? ` em ${dataBR(m.corrigido_em)}` : ""} · no arquivo:{" "}
                <span className="font-mono">{contaFavorecido(m)}</span>
              </span>
            </span>
          ) : (
            <span className="whitespace-nowrap font-mono text-xs">{contaFavorecido(m)}</span>
          ),
        buscarPor: (m) => m.corrigido_por_nome,
      },
      {
        id: "motivo",
        cabecalho: "Motivo",
        celula: (m) => (
          <span className="text-xs">
            {m.motivo_recusa || "—"}
            {m.codigo_retorno ? <span className="text-muted-foreground"> (cód. {m.codigo_retorno})</span> : null}
          </span>
        ),
        buscarPor: (m) => m.motivo_recusa,
      },
      {
        id: "reenvio",
        cabecalho: "Reenvio",
        celula: (m) =>
          m.reenviado_em ? (
            <StatusBadge tom="andamento">Reenviado em {dataBR(m.reenviado_em)}</StatusBadge>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
        ordenarPor: (m) => m.reenviado_em,
      },
    ],
    [],
  );

  const erroLista = isError ? "Não foi possível carregar os movimentos bancários." : null;

  return (
    <ModuleLayout module="financeiro">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Financeiro", href: "/financeiro" }, { rotulo: "Conciliação bancária" }]}
          titulo="Conciliação bancária"
          descricao="Remessas e retornos do banco, reenvio de recusados e extratos do Banco do Brasil."
          acoes={
            <div className="flex flex-col gap-2 sm:flex-row">
              <SeletorExercicio />
              <Button onClick={() => setImportarAberto(true)}>
                <FileUp className="h-4 w-4" aria-hidden />
                Importar arquivo do banco
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard rotulo="Pagos" valor={contagem.pagos} icone={CheckCircle2} carregando={isLoading} />
          <KpiCard rotulo="Recusados" valor={contagem.recusados} icone={AlertOctagon} carregando={isLoading} />
          <KpiCard rotulo="Enviados (sem retorno)" valor={contagem.enviados} icone={Send} carregando={isLoading} />
          <KpiCard rotulo="Sem pagamento" valor={contagem.semPagamento} icone={Unlink} carregando={isLoading} />
        </div>

        <Tabs value={aba} onValueChange={setAba} className="space-y-4">
          <TabsList className="flex h-auto flex-wrap justify-start">
            <TabsTrigger value="movimentos">Movimentos</TabsTrigger>
            <TabsTrigger value="recusados">Recusados ({contagem.recusados})</TabsTrigger>
            <TabsTrigger value="bb">Banco do Brasil (API)</TabsTrigger>
          </TabsList>

          <TabsContent value="movimentos">
            <DataTable
              rotulo="Movimentos bancários"
              dados={filtrar(movimentos, filtro)}
              colunas={colunasMovimentos}
              chaveLinha={(m) => m.id}
              carregando={isLoading}
              erro={erroLista}
              aoTentarNovamente={() => refetch()}
              busca={{ placeholder: "Buscar por favorecido, OB ou pagamento…" }}
              filtros={
                <Select value={filtro} onValueChange={(v) => setFiltro(v as FiltroSituacaoMovimento)}>
                  <SelectTrigger className="w-full sm:w-[200px]" aria-label="Filtrar por situação">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FILTROS.map((f) => (
                      <SelectItem key={f.valor} value={f.valor}>
                        {f.rotulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              }
              vazio={{
                icone: Banknote,
                titulo: "Nenhum movimento neste exercício",
                descricao: "Importe a remessa ou o retorno do banco para acompanhar os pagamentos.",
              }}
              acoesLinha={(m) => (
                <Button variant="ghost" size="sm" onClick={() => setParaConciliar(m)}>
                  {m.pagamento_id ? <Unlink className="h-4 w-4" aria-hidden /> : <Link2 className="h-4 w-4" aria-hidden />}
                  {m.pagamento_id ? "Vínculo" : "Conciliar"}
                </Button>
              )}
            />
          </TabsContent>

          <TabsContent value="recusados" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Selecione os créditos, corrija os dados bancários quando preciso e gere o arquivo para reenviar pelo
              Gestão MAX. A conta corrigida fica registrada (com quem corrigiu) e é a usada no arquivo. Ficam de fora
              do arquivo os já reenviados, os com reserva pendente e as faturas/guias.
            </p>
            <DataTable
              rotulo="Créditos recusados"
              dados={recusados}
              colunas={colunasRecusados}
              chaveLinha={(m) => m.id}
              carregando={isLoading}
              erro={erroLista}
              aoTentarNovamente={() => refetch()}
              busca={{ placeholder: "Buscar por favorecido, OB ou motivo…" }}
              vazio={{
                icone: CheckCircle2,
                titulo: "Nenhum crédito recusado",
                descricao: "Os recusados aparecem aqui depois da importação do retorno do banco.",
              }}
              acoesEmLote={(selecionadas, limpar) => {
                const elegiveis = selecionadas.filter(podeReenviar);
                const fora = selecionadas.length - elegiveis.length;
                return (
                  <>
                    <Button
                      size="sm"
                      disabled={elegiveis.length === 0}
                      onClick={() => setReenvio({ movimentos: elegiveis, limpar })}
                    >
                      <FileDown className="h-4 w-4" aria-hidden />
                      Gerar arquivo Gestão MAX ({elegiveis.length})
                    </Button>
                    {fora > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {fora} fora do arquivo (já reenviado, reserva pendente ou fatura)
                      </span>
                    )}
                  </>
                );
              }}
              acoesLinha={(m) => (
                <Button variant="ghost" size="sm" onClick={() => setParaCorrigir(m)}>
                  <Pencil className="h-4 w-4" aria-hidden />
                  Corrigir
                </Button>
              )}
            />
            <RemessasGeradas />
          </TabsContent>

          <TabsContent value="bb">
            <BancoDoBrasilApiPainel />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={importarAberto} onOpenChange={(v) => !importando && setImportarAberto(v)}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{importadorArquivoBancario.titulo}</DialogTitle>
            <DialogDescription>{importadorArquivoBancario.descricao}</DialogDescription>
          </DialogHeader>
          <ImportacaoWizard importador={importadorArquivoBancario} onOcupadoChange={setImportando} />
        </DialogContent>
      </Dialog>

      <ConciliarMovimentoDialog
        movimento={paraConciliar}
        onOpenChange={(v) => !v && setParaConciliar(null)}
      />
      <CorrigirContaDialog
        movimento={paraCorrigir}
        onOpenChange={(v) => !v && setParaCorrigir(null)}
      />
      <GerarRemessaDialog
        aberto={!!reenvio}
        onOpenChange={(v) => !v && setReenvio(null)}
        movimentos={reenvio?.movimentos ?? []}
        onGerado={() => reenvio?.limpar()}
      />
    </ModuleLayout>
  );
}
