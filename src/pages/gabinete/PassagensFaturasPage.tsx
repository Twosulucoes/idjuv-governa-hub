/**
 * Faturas e saldo das passagens aéreas: notas da agência com os bilhetes de cada uma e a situação até paga (com a OB),
 * bilhetes a faturar (destaque depois de 30 dias), empenhos do contrato × emitido no ano, planilhas e o PDF do saldo.
 * Lançar e andar com a fatura e ligar empenho exigem contratos.passagens.financeiro.
 * Plano: docs/superpowers/plans/2026-10-25-contratos-passagens-entrega3.md
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlarmClock, Banknote, FileDown, FileSignature, FileSpreadsheet, Plane, Plus, Receipt, Wallet } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { DataTable, KpiCard, PageHeader, StatusBadge, type ColunaTabela } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmpenhosContratoTab } from "@/components/contratos/passagens/EmpenhosContratoTab";
import { FaturaDialog } from "@/components/contratos/passagens/FaturaDialog";
import { PlanilhaPassagensDialog } from "@/components/contratos/passagens/PlanilhaPassagensDialog";
import { SituacaoFaturaDialog } from "@/components/contratos/passagens/SituacaoFaturaDialog";
import { TOM_FATURA } from "@/components/contratos/passagens/tons";
import { useAuth } from "@/contexts/AuthContext";
import { exportarParaExcel } from "@/export/exportExcel";
import { formatCurrency, formatDateBR } from "@/lib/formatters";
import { aFaturar, conferirFatura, PRAZO_FATURAR_DIAS, saldoContratoCompleto, saldoEmpenhoPorExercicio } from "@/lib/passagens/faturas";
import { linhasPlanilhaFaturas } from "@/lib/passagens/planilhas";
import { useContratosPassagens } from "@/hooks/usePassagens";
import { useToast } from "@/hooks/use-toast";
import { useBilhetesContrato, useEmpenhosContrato, useFaturas } from "@/hooks/usePassagensFaturas";
import { rotuloSituacaoFatura, SITUACOES_FATURA, type BilheteDoContrato, type FaturaComItens } from "@/types/passagens";

const TODAS = "todas";
const hoje = () => new Date().toLocaleDateString("sv-SE");

type LinhaAFaturar = ReturnType<typeof aFaturar<BilheteDoContrato>>[number];

export default function PassagensFaturasPage() {
  const { hasPermission, user } = useAuth();
  const podeFinanceiro = hasPermission("contratos.passagens.financeiro");
  const navigate = useNavigate();
  const contratos = useContratosPassagens();
  const [contratoId, setContratoId] = useState<string | null>(null);
  const contrato = useMemo(() => {
    const todos = contratos.data ?? [];
    return todos.find((c) => c.id === contratoId) ?? todos[0] ?? null;
  }, [contratos.data, contratoId]);
  const bilhetes = useBilhetesContrato(contrato?.id);
  const faturas = useFaturas(contrato?.id);
  const empenhos = useEmpenhosContrato(contrato?.id);
  const [situacao, setSituacao] = useState(TODAS);
  const [aberta, setAberta] = useState<FaturaComItens | null | undefined>(undefined);
  const [mudando, setMudando] = useState<FaturaComItens | null>(null);
  const [planilha, setPlanilha] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const { toast } = useToast();

  const listaBilhetes = useMemo(() => bilhetes.data ?? [], [bilhetes.data]);
  const listaFaturas = useMemo(() => faturas.data ?? [], [faturas.data]);
  const faturados = useMemo(
    () => new Set(listaFaturas.filter((f) => f.situacao !== "cancelada").flatMap((f) => f.itens.map((i) => i.trecho_id))),
    [listaFaturas],
  );
  const saldo = useMemo(
    () => (contrato ? saldoContratoCompleto(contrato.valor_atual, listaBilhetes, listaFaturas) : null),
    [contrato, listaBilhetes, listaFaturas],
  );
  const pendentes = useMemo(() => aFaturar(listaBilhetes, faturados, hoje()), [listaBilhetes, faturados]);
  const atrasados = pendentes.filter((p) => p.atrasado).length;
  const filtradas = listaFaturas.filter((f) => situacao === TODAS || f.situacao === situacao);
  // na fatura aberta, "em outra" = faturados menos os desta fatura
  const emOutra = useMemo(() => {
    if (!aberta) return faturados;
    const meus = new Set(aberta.itens.map((i) => i.trecho_id));
    return new Set([...faturados].filter((t) => !meus.has(t)));
  }, [aberta, faturados]);

  const colunasFaturas: ColunaTabela<FaturaComItens>[] = [
    { id: "numero", cabecalho: "Nota", celula: (f) => <span className="font-medium">{f.numero}</span>, ordenarPor: (f) => f.numero, buscarPor: (f) => `${f.numero} ${f.ob_numero ?? ""} ${f.processo_sei_pagamento ?? ""}`, mobile: "titulo" },
    { id: "emissao", cabecalho: "Emissão", celula: (f) => formatDateBR(f.data_emissao), ordenarPor: (f) => f.data_emissao },
    { id: "bilhetes", cabecalho: "Bilhetes", celula: (f) => f.itens.length, ordenarPor: (f) => f.itens.length, alinhamento: "direita" },
    {
      id: "valor",
      cabecalho: "Valor",
      celula: (f) => {
        const c = conferirFatura(f.valor, f.itens);
        return (
          <span className="tabular-nums">
            {formatCurrency(f.valor)}
            {!c.confere && f.situacao !== "cancelada" && <span className="block text-xs text-warning">diferença {formatCurrency(c.diferenca)}</span>}
          </span>
        );
      },
      ordenarPor: (f) => Number(f.valor),
      alinhamento: "direita",
    },
    {
      id: "situacao",
      cabecalho: "Situação",
      celula: (f) => <StatusBadge tom={TOM_FATURA[f.situacao] ?? "neutro"} icone={false}>{rotuloSituacaoFatura(f.situacao)}</StatusBadge>,
      ordenarPor: (f) => SITUACOES_FATURA.findIndex((s) => s.value === f.situacao),
    },
    {
      id: "pagamento",
      cabecalho: "Pagamento",
      celula: (f) => (f.pagamento_data ? <span>{formatDateBR(f.pagamento_data)}<span className="block text-xs text-muted-foreground">OB {f.ob_numero}</span></span> : "—"),
      ordenarPor: (f) => f.pagamento_data ?? "",
    },
  ];

  const colunasAFaturar: ColunaTabela<LinhaAFaturar>[] = [
    { id: "passageiro", cabecalho: "Passageiro", celula: (l) => <span className="font-medium">{l.trecho.passageiro.nome}</span>, ordenarPor: (l) => l.trecho.passageiro.nome ?? "", buscarPor: (l) => `${l.trecho.passageiro.nome ?? ""} ${l.trecho.localizador ?? ""} ${l.trecho.passageiro.pedido.numero_sei}`, mobile: "titulo" },
    { id: "trecho", cabecalho: "Trecho", celula: (l) => <span>{l.trecho.origem} → {l.trecho.destino}<span className="block text-xs text-muted-foreground">{l.trecho.localizador} · voo {formatDateBR(l.trecho.data_voo)}</span></span> },
    { id: "pedido", cabecalho: "Pedido", celula: (l) => <span>{l.trecho.passageiro.pedido.evento ?? "—"}<span className="block text-xs text-muted-foreground">SEI {l.trecho.passageiro.pedido.numero_sei}</span></span> },
    { id: "emissao", cabecalho: "Emitido em", celula: (l) => formatDateBR(l.trecho.data_emissao), ordenarPor: (l) => l.trecho.data_emissao ?? "" },
    {
      id: "dias",
      cabecalho: "Sem nota há",
      celula: (l) => (l.atrasado
        ? <StatusBadge tom="erro">{l.dias} dias</StatusBadge>
        : <StatusBadge tom="pendente">{l.dias} {l.dias === 1 ? "dia" : "dias"}</StatusBadge>),
      ordenarPor: (l) => -l.dias,
    },
    { id: "valor", cabecalho: "Valor", celula: (l) => <span className="tabular-nums">{formatCurrency(l.valor)}</span>, ordenarPor: (l) => l.valor, alinhamento: "direita" },
  ];

  const baixarSaldoPdf = async () => {
    if (!contrato || !saldo) return;
    setGerandoPdf(true);
    try {
      const { baixarDocumento, emitirDocumento } = await import("@/lib/documentos");
      const quem = user?.fullName ?? user?.email ?? undefined;
      const doc = await emitirDocumento(
        "contratos-passagens-saldo-contrato",
        {
          contrato: `${contrato.numero_contrato}/${contrato.ano}`,
          fornecedor: contrato.fornecedor?.nome_fantasia ?? contrato.fornecedor?.razao_social ?? "—",
          vigencia: `${formatDateBR(contrato.data_inicio)} a ${formatDateBR(contrato.data_fim_atual ?? contrato.data_fim)}`,
          valor: saldo.valor,
          emitido: saldo.emitido,
          faturado: saldo.faturado,
          pago: saldo.pago,
          aFaturar: saldo.aFaturar,
          aFaturarAtrasados: atrasados,
          saldo: saldo.saldo,
          exercicios: saldoEmpenhoPorExercicio(empenhos.data ?? [], listaBilhetes),
          faturas: listaFaturas.map((f) => ({
            numero: f.numero,
            emissao: formatDateBR(f.data_emissao),
            bilhetes: f.itens.length,
            valor: Number(f.valor),
            situacao: rotuloSituacaoFatura(f.situacao),
            pagamento: f.pagamento_data ? `${formatDateBR(f.pagamento_data)} · OB ${f.ob_numero}` : undefined,
          })),
          posicaoEm: new Date().toLocaleDateString("pt-BR"),
        },
        { emitidoPor: quem },
      );
      baixarDocumento(doc);
    } catch {
      toast({ title: "Não foi possível gerar o PDF", description: "Tente de novo em instantes.", variant: "destructive" });
    } finally {
      setGerandoPdf(false);
    }
  };

  return (
    <ModuleLayout module="gabinete">
      <div className="space-y-6">
        <PageHeader
          titulo="Faturas e saldo das passagens"
          descricao="Notas da agência, bilhetes pagos, a faturar e o empenho do ano"
          migalhas={[
            { rotulo: "Gabinete", href: "/gabinete" },
            { rotulo: "Passagens aéreas", href: "/gabinete/passagens" },
            { rotulo: "Faturas e saldo" },
          ]}
          acoes={
            <>
              <Button variant="outline" onClick={() => setPlanilha(true)}>
                <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
                Planilha de passagens
              </Button>
              {contrato && podeFinanceiro && (
                <Button onClick={() => setAberta(null)}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Nova fatura
                </Button>
              )}
            </>
          }
        />

        {!contrato ? (
          !contratos.isLoading && (
            <Card>
              <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">Nenhum contrato da agência ligado às passagens. Cadastre o contrato na tela de passagens.</p>
                <Button variant="outline" onClick={() => navigate("/gabinete/passagens")}>Ir para passagens</Button>
              </CardContent>
            </Card>
          )
        ) : (
          <>
            <section aria-label="Saldo do contrato" className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold">
                  Contrato {contrato.numero_contrato}/{contrato.ano}
                  <span className="block text-sm font-normal text-muted-foreground">
                    {contrato.fornecedor?.nome_fantasia ?? contrato.fornecedor?.razao_social ?? "—"} · vigência até {formatDateBR(contrato.data_fim_atual ?? contrato.data_fim)}
                  </span>
                </h2>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  {(contratos.data?.length ?? 0) > 1 && (
                    <Select value={contrato.id} onValueChange={setContratoId}>
                      <SelectTrigger className="w-full sm:w-56" aria-label="Contrato"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {contratos.data!.map((c) => <SelectItem key={c.id} value={c.id}>Contrato {c.numero_contrato}/{c.ano}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                  <Button variant="outline" onClick={baixarSaldoPdf} disabled={gerandoPdf || bilhetes.isLoading || faturas.isLoading || empenhos.isLoading}>
                    <FileDown className="h-4 w-4" aria-hidden="true" />
                    Saldo do contrato (PDF)
                  </Button>
                </div>
              </div>
              {saldo && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <KpiCard rotulo="Valor do contrato" valor={formatCurrency(saldo.valor)} icone={FileSignature} />
                  <KpiCard rotulo="Emitido" valor={formatCurrency(saldo.emitido)} detalhe="bilhetes com localizador" icone={Plane} carregando={bilhetes.isLoading} />
                  <KpiCard rotulo="Faturado" valor={formatCurrency(saldo.faturado)} detalhe="notas não canceladas" icone={Receipt} carregando={faturas.isLoading} />
                  <KpiCard rotulo="Pago" valor={formatCurrency(saldo.pago)} detalhe="notas pagas (com OB)" icone={Banknote} carregando={faturas.isLoading} />
                  <KpiCard
                    rotulo="A faturar"
                    valor={formatCurrency(saldo.aFaturar)}
                    detalhe={atrasados ? `${atrasados} ${atrasados === 1 ? "bilhete" : "bilhetes"} sem nota há mais de ${PRAZO_FATURAR_DIAS} dias` : "bilhetes sem nota"}
                    icone={AlarmClock}
                    carregando={bilhetes.isLoading}
                  />
                  <KpiCard
                    rotulo="Saldo"
                    valor={formatCurrency(saldo.saldo)}
                    detalhe={saldo.saldo < 0 ? "faturado e a faturar passaram do contrato" : "valor menos faturado e a faturar"}
                    icone={Wallet}
                  />
                </div>
              )}
            </section>

            <Tabs defaultValue="faturas">
              <TabsList>
                <TabsTrigger value="faturas">Faturas</TabsTrigger>
                <TabsTrigger value="a-faturar">A faturar{pendentes.length ? ` (${pendentes.length})` : ""}</TabsTrigger>
                <TabsTrigger value="empenhos">Empenhos</TabsTrigger>
              </TabsList>
              <TabsContent value="faturas" className="mt-4">
                <DataTable
                  rotulo="Faturas da agência"
                  dados={filtradas}
                  colunas={colunasFaturas}
                  chaveLinha={(f) => f.id}
                  carregando={faturas.isLoading}
                  erro={faturas.isError ? "Não foi possível carregar as faturas." : null}
                  aoTentarNovamente={() => faturas.refetch()}
                  busca={{ placeholder: "Buscar por nota, OB ou processo" }}
                  filtros={
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                      <Select value={situacao} onValueChange={setSituacao}>
                        <SelectTrigger className="w-full sm:w-48" aria-label="Situação"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={TODAS}>Situação: todas</SelectItem>
                          {SITUACOES_FATURA.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        disabled={listaFaturas.length === 0}
                        onClick={() => exportarParaExcel(linhasPlanilhaFaturas(listaFaturas), `faturas-passagens-${contrato.numero_contrato.replace(/\W+/g, "-")}-${contrato.ano}`, "Faturas")}
                      >
                        <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
                        Planilha de faturas
                      </Button>
                    </div>
                  }
                  aoClicarLinha={(f) => setAberta(f)}
                  vazio={{
                    icone: Receipt,
                    titulo: "Nenhuma fatura lançada",
                    descricao: podeFinanceiro ? "Lance a nota da agência e marque os bilhetes que ela cobre." : "O financeiro ainda não lançou faturas neste contrato.",
                  }}
                />
              </TabsContent>
              <TabsContent value="a-faturar" className="mt-4">
                <DataTable
                  rotulo="Bilhetes a faturar"
                  dados={pendentes}
                  colunas={colunasAFaturar}
                  chaveLinha={(l) => l.trecho.id}
                  carregando={bilhetes.isLoading || faturas.isLoading}
                  erro={bilhetes.isError ? "Não foi possível carregar os bilhetes." : null}
                  aoTentarNovamente={() => bilhetes.refetch()}
                  busca={{ placeholder: "Buscar por passageiro, localizador ou processo" }}
                  aoClicarLinha={(l) => navigate(`/gabinete/passagens/${l.trecho.passageiro.pedido.id}`)}
                  vazio={{ icone: Receipt, titulo: "Nenhum bilhete a faturar", descricao: "Todos os bilhetes emitidos já estão em alguma nota." }}
                />
              </TabsContent>
              <TabsContent value="empenhos" className="mt-4">
                <EmpenhosContratoTab contratoId={contrato.id} bilhetes={listaBilhetes} podeEditar={podeFinanceiro} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      {contrato && (
        <FaturaDialog
          open={aberta !== undefined}
          onOpenChange={(o) => !o && setAberta(undefined)}
          contratoId={contrato.id}
          fatura={aberta ?? null}
          bilhetes={listaBilhetes}
          faturadosEmOutra={emOutra}
          podeEditar={podeFinanceiro}
          aoMudarSituacao={(f) => { setAberta(undefined); setMudando(f); }}
        />
      )}
      <SituacaoFaturaDialog open={!!mudando} onOpenChange={(o) => !o && setMudando(null)} fatura={mudando} />
      <PlanilhaPassagensDialog open={planilha} onOpenChange={setPlanilha} />
    </ModuleLayout>
  );
}
