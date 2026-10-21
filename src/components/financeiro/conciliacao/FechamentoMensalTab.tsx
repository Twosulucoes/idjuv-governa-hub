/**
 * Aba "Fechamento mensal" da Conciliação: o quadro da SEFAZ de uma conta num mês.
 *
 * Lê o razão (FIP630), a relação de pagamentos por RE (FIP103, opcional) e o extrato OFX do BB, casa o que
 * corresponde (`@/lib/conciliacao`) junto com as pendências do mês anterior fechado e mostra o quadro e as quatro
 * listas. O saldo do fundo e o rendimento do mês são digitados (o OFX não traz o fundo). Casamento manual só de
 * pendências cujos débitos e créditos somam o mesmo valor, com justificativa. Fechar confere o quadro no banco;
 * reabrir é só do administrador. Spec: docs/superpowers/specs/2026-10-21-financeiro-conciliacao-mensal-design.md
 */

import { useEffect, useMemo, useState } from "react";
import { FileDown, FileUp, Link2, Loader2, Lock, LockOpen, Plus, Save, Trash2, Unlink } from "lucide-react";
import { KpiCard, StatusBadge } from "@/components/design-system";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useContasBancarias } from "@/hooks/useFinanceiro";
import {
  useMesConciliacao,
  useReabrirConciliacaoMensal,
  useSalvarConciliacaoMensal,
  type ArquivoConciliacao,
} from "@/hooks/useConciliacaoMensal";
import { conciliar, itensDoMes, montarQuadro } from "@/lib/conciliacao/casamento";
import { lerRazaoFip630, lerRelacaoFip103 } from "@/lib/conciliacao/fiplan";
import { lerExtratoOfx } from "@/lib/conciliacao/ofxBB";
import {
  casarManual,
  desfazerCasamento,
  doGravado,
  paraGravar,
  pendenciasDoMesAnterior,
  resultadoCom,
  saldoDoGrupo,
} from "@/lib/conciliacao/registro";
import {
  centavosDeTextoBR,
  formatarCentavos,
  type ItemConciliacao,
  type LadoConciliacao,
  type NaturezaConciliacao,
  type RegraConciliacao,
  type ResultadoConciliacao,
} from "@/lib/conciliacao/tipos";

const REGRAS: Record<RegraConciliacao, string> = {
  interno: "Interno do razão",
  re: "RE (pagamentos)",
  ob_cancelada: "OB cancelada",
  repasse: "Repasse do Tesouro",
  valor_data: "Valor e data",
  estorno: "Estorno",
  manual: "Manual",
};

const LISTAS: { lado: LadoConciliacao; natureza: NaturezaConciliacao; titulo: string; sinal: string }[] = [
  { lado: "contabil", natureza: "debito", titulo: "Débitos contábeis não correspondidos no banco", sinal: "(-)" },
  { lado: "contabil", natureza: "credito", titulo: "Créditos contábeis não correspondidos no banco", sinal: "(+)" },
  { lado: "bancario", natureza: "debito", titulo: "Débitos bancários não correspondidos no razão", sinal: "(-)" },
  { lado: "bancario", natureza: "credito", titulo: "Créditos bancários não correspondidos no razão", sinal: "(+)" },
];

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

/** "2026-07" (input month) do mês passado. */
function mesPassado(): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const dataBR = (iso: string) => iso.split("-").reverse().join("/");
const ultimoDia = (mes: string) => {
  const [a, m] = mes.split("-").map(Number);
  return `${mes}-${String(new Date(a, m, 0).getDate()).padStart(2, "0")}`;
};
/** Valor digitado ("1.234,56", "1234,56" ou "1234") em centavos; vazio = 0; inválido = null. */
function centavosDigitados(texto: string): number | null {
  const t = texto.trim();
  if (!t) return 0;
  return centavosDeTextoBR(t.includes(",") ? t : `${t},00`);
}
const paraTexto = (reais: number) => formatarCentavos(Math.round(reais * 100));

interface Calculo {
  itens: ItemConciliacao[];
  resultado: ResultadoConciliacao;
  saldoRazaoCentavos: number;
  arquivos: ArquivoConciliacao[];
}

async function lerTexto(arquivo: File): Promise<string> {
  const bytes = new Uint8Array(await arquivo.arrayBuffer());
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

export function FechamentoMensalTab() {
  const { user, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const { data: contas, isLoading: carregandoContas } = useContasBancarias();
  const [contaId, setContaId] = useState<string | null>(null);
  const [mes, setMes] = useState(mesPassado);
  const competencia = /^\d{4}-\d{2}$/.test(mes) ? `${mes}-01` : null;
  const { data: dadosMes, isLoading: carregandoMes } = useMesConciliacao(contaId, competencia);
  const salvar = useSalvarConciliacaoMensal();
  const reabrir = useReabrirConciliacaoMensal();

  const [fip630, setFip630] = useState<File | null>(null);
  const [fip103, setFip103] = useState<File | null>(null);
  const [ofx, setOfx] = useState<File | null>(null);
  const [saldoConta, setSaldoConta] = useState("");
  const [saldoFundo, setSaldoFundo] = useState("");
  const [rendimento, setRendimento] = useState("");
  const [lendo, setLendo] = useState(false);
  const [calculo, setCalculo] = useState<Calculo | null>(null);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [casarAberto, setCasarAberto] = useState(false);
  const [justificativa, setJustificativa] = useState("");
  const [aberturaAberta, setAberturaAberta] = useState(false);
  const [fecharAberto, setFecharAberto] = useState(false);
  const [reabrirAberto, setReabrirAberto] = useState(false);
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    if (!contaId && contas?.length === 1) setContaId(contas[0].id);
  }, [contas, contaId]);

  // Troca de conta/mês ou recarga: o que está gravado manda (o rascunho continua de onde parou)
  useEffect(() => {
    setSelecionados(new Set());
    if (!dadosMes) {
      setCalculo(null);
      return;
    }
    const m = dadosMes.mes;
    setSaldoConta(m ? paraTexto(m.saldo_conta) : "");
    setSaldoFundo(m ? paraTexto(m.saldo_fundo) : "");
    setRendimento(m && m.rendimento_fundo ? paraTexto(m.rendimento_fundo) : "");
    if (m) {
      const { itens, resultado } = doGravado(dadosMes.itens);
      setCalculo({
        itens,
        resultado,
        saldoRazaoCentavos: Math.round(m.saldo_razao * 100),
        arquivos: (m.arquivos as unknown as ArquivoConciliacao[]) ?? [],
      });
    } else {
      setCalculo(null);
    }
  }, [dadosMes]);

  const conta = contas?.find((c) => c.id === contaId);
  const fechado = dadosMes?.mes?.situacao === "fechada";
  const anterior = dadosMes?.anterior ?? null;
  const implantacao = !!dadosMes && !anterior;
  const anteriorAberto = !!anterior && anterior.situacao !== "fechada";

  const centavosConta = centavosDigitados(saldoConta);
  const centavosFundo = centavosDigitados(saldoFundo);
  const centavosRendimento = centavosDigitados(rendimento);
  const valoresOk = centavosConta !== null && centavosFundo !== null && centavosRendimento !== null && centavosRendimento >= 0;

  const quadro = useMemo(
    () =>
      calculo && valoresOk
        ? montarQuadro(calculo.saldoRazaoCentavos, calculo.resultado.pendentes, (centavosConta ?? 0) + (centavosFundo ?? 0))
        : null,
    [calculo, valoresOk, centavosConta, centavosFundo],
  );

  const porId = useMemo(() => new Map((calculo?.itens ?? []).map((i) => [i.id, i])), [calculo]);
  // Sem o FIP630 lido não há saldo do razão: só as pendências de abertura lançadas
  const temRazao = !!calculo?.arquivos.some((a) => a.tipo === "fip630");
  const grupoSelecionado = [...selecionados].map((id) => porId.get(id)).filter((i): i is ItemConciliacao => !!i);
  const saldoSelecionado = saldoDoGrupo(grupoSelecionado);

  async function lerEConciliar() {
    if (!fip630 || !ofx || !competencia || !dadosMes) return;
    if (anteriorAberto) return;
    setLendo(true);
    try {
      const { lerLinhasPdf } = await import("@/lib/importacao/pdfTexto");
      const razao = lerRazaoFip630(await lerLinhasPdf(await fip630.arrayBuffer()));
      const relacao = fip103 ? lerRelacaoFip103(await lerLinhasPdf(await fip103.arrayBuffer())) : null;
      const extrato = lerExtratoOfx(await lerTexto(ofx));

      const foraDoMes = razao.lancamentos.filter((l) => !l.data.startsWith(mes)).length;
      const extratoForaDoMes = extrato.lancamentos.filter((l) => !l.data.startsWith(mes)).length;
      const digitos = (s: string) => s.replace(/\D/g, "").replace(/^0+/, "");
      const contaDiferente = conta && extrato.conta && !digitos(extrato.conta).startsWith(digitos(conta.conta));
      const avisos = [
        foraDoMes && `${foraDoMes} lançamento(s) do razão fora do mês`,
        extratoForaDoMes && `${extratoForaDoMes} lançamento(s) do extrato fora do mês`,
        contaDiferente && `o extrato é da conta ${extrato.conta}`,
      ].filter(Boolean);
      if (avisos.length) toast({ title: "Confira os arquivos", description: `Atenção: ${avisos.join("; ")}.`, variant: "destructive" });

      const doMes = itensDoMes(razao, relacao, extrato, {
        data: ultimoDia(mes),
        valorCentavos: centavosRendimento ?? 0,
      });
      const antigos = dadosMes.anterior?.situacao === "fechada" ? pendenciasDoMesAnterior(dadosMes.itensAnterior) : [];
      // Na implantação, as pendências de abertura já lançadas continuam
      const abertura = (calculo?.itens ?? []).filter((i) => i.origem === "abertura");
      const itens = [...antigos, ...abertura, ...doMes];
      setCalculo({
        itens,
        resultado: conciliar(itens),
        saldoRazaoCentavos: razao.saldoRazaoCentavos,
        arquivos: [
          { tipo: "fip630", nome: fip630.name },
          ...(fip103 ? [{ tipo: "fip103" as const, nome: fip103.name }] : []),
          { tipo: "ofx", nome: ofx.name },
        ],
      });
      setSelecionados(new Set());
    } catch (e) {
      toast({ title: "Não foi possível ler os arquivos", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLendo(false);
    }
  }

  function alternar(id: string) {
    setSelecionados((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function confirmarCasamento() {
    if (!calculo) return;
    try {
      setCalculo({ ...calculo, resultado: casarManual(calculo.itens, calculo.resultado, [...selecionados], justificativa) });
      setSelecionados(new Set());
      setCasarAberto(false);
      setJustificativa("");
    } catch (e) {
      toast({ title: "Não foi possível casar", description: (e as Error).message, variant: "destructive" });
    }
  }

  function adicionarAbertura(item: ItemConciliacao) {
    const itens = [...(calculo?.itens ?? []), item];
    setCalculo({
      itens,
      resultado: resultadoCom(itens, calculo?.resultado.casamentos ?? []),
      saldoRazaoCentavos: calculo?.saldoRazaoCentavos ?? 0,
      arquivos: calculo?.arquivos ?? [],
    });
  }

  function removerAbertura(id: string) {
    if (!calculo) return;
    const itens = calculo.itens.filter((i) => i.id !== id);
    setCalculo({ ...calculo, itens, resultado: resultadoCom(itens, calculo.resultado.casamentos) });
  }

  function gravar(fechar: boolean) {
    if (!calculo || !contaId || !competencia || !valoresOk) return;
    salvar.mutate(
      {
        contaId,
        competencia,
        fechar,
        dados: {
          saldo_razao: calculo.saldoRazaoCentavos / 100,
          saldo_conta: (centavosConta ?? 0) / 100,
          saldo_fundo: (centavosFundo ?? 0) / 100,
          rendimento_fundo: (centavosRendimento ?? 0) / 100,
          arquivos: calculo.arquivos,
          observacoes: dadosMes?.mes?.observacoes ?? null,
        },
        itens: paraGravar(calculo.itens, calculo.resultado),
      },
      { onSettled: () => setFecharAberto(false) },
    );
  }

  async function baixarPdf() {
    if (!calculo || !quadro || !conta) return;
    const { baixarDocumento, emitirDocumento, localDaSede } = await import("@/lib/documentos");
    const lista = (lado: LadoConciliacao, natureza: NaturezaConciliacao) =>
      calculo.resultado.pendentes
        .filter((p) => p.lado === lado && p.natureza === natureza)
        .map((p) => ({ data: dataBR(p.data), documento: p.documento, historico: p.historico, valor: p.valorCentavos / 100 }));
    const [ano, m] = mes.split("-").map(Number);
    const quem = user?.fullName ?? user?.email ?? undefined;
    const doc = await emitirDocumento(
      "financeiro-conciliacao-mensal",
      {
        competencia: `${MESES[m - 1]}/${ano}`,
        banco: conta.banco_codigo,
        agencia: [conta.agencia, conta.agencia_digito].filter(Boolean).join("-"),
        conta: [conta.conta, conta.conta_digito].filter(Boolean).join("-"),
        saldoRazao: quadro.saldoRazaoCentavos / 100,
        saldoConta: (centavosConta ?? 0) / 100,
        saldoFundo: (centavosFundo ?? 0) / 100,
        saldoAjustado: quadro.saldoAjustadoCentavos / 100,
        saldoExtrato: quadro.saldoExtratoCentavos / 100,
        debitosContabeis: lista("contabil", "debito"),
        creditosContabeis: lista("contabil", "credito"),
        debitosBancarios: lista("bancario", "debito"),
        creditosBancarios: lista("bancario", "credito"),
        rascunho: !fechado,
        local: localDaSede(),
        data: new Date().toLocaleDateString("pt-BR"),
        feitoPor: quem,
      },
      { emitidoPor: quem },
    );
    baixarDocumento(doc);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conta e mês</CardTitle>
          <CardDescription>
            Escolha a conta do Financeiro e o mês. Mês já gravado abre como ficou; o mês anterior precisa estar fechado
            para as pendências dele entrarem aqui.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="conc-conta">Conta</Label>
            <Select value={contaId ?? ""} onValueChange={setContaId} disabled={carregandoContas}>
              <SelectTrigger id="conc-conta">
                <SelectValue placeholder={carregandoContas ? "Carregando…" : "Selecione a conta"} />
              </SelectTrigger>
              <SelectContent>
                {(contas ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome_conta} ({c.banco_codigo} · ag. {c.agencia} · c/c {[c.conta, c.conta_digito].filter(Boolean).join("-")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="conc-mes">Mês</Label>
            <Input id="conc-mes" type="month" value={mes} onChange={(e) => setMes(e.target.value)} />
          </div>
          <div className="pb-2">
            {dadosMes?.mes ? (
              <StatusBadge tom={fechado ? "sucesso" : "pendente"}>{fechado ? "Fechado" : "Rascunho"}</StatusBadge>
            ) : dadosMes ? (
              <StatusBadge tom="neutro">Não iniciado</StatusBadge>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {contas && contas.length === 0 && (
        <Alert>
          <AlertTitle>Nenhuma conta cadastrada</AlertTitle>
          <AlertDescription>Cadastre a conta em Financeiro → Contas Bancárias para conciliar.</AlertDescription>
        </Alert>
      )}

      {contaId && competencia && carregandoMes && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Carregando o mês…
        </p>
      )}

      {contaId && competencia && dadosMes && (
        <>
          {anteriorAberto && !fechado && (
            <Alert variant="destructive">
              <AlertTitle>Mês anterior em rascunho</AlertTitle>
              <AlertDescription>Feche o mês anterior primeiro: as pendências dele entram neste.</AlertDescription>
            </Alert>
          )}
          {implantacao && !fechado && (
            <Alert>
              <AlertTitle>Primeiro mês no sistema</AlertTitle>
              <AlertDescription>
                Lance como pendências de abertura as que estavam em aberto no último quadro feito fora do sistema
                (botão "Pendência de abertura"). Nos meses seguintes elas vêm sozinhas.
              </AlertDescription>
            </Alert>
          )}

          {!fechado && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Arquivos e saldos do mês</CardTitle>
                <CardDescription>
                  FIP630 (razão) e extrato OFX são obrigatórios; o FIP103 liga cada pagamento à sua RE. Saldos do último
                  dia do mês. O rendimento entra como crédito bancário ao conciliar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <ArquivoCampo id="conc-fip630" rotulo="FIP630 (PDF)" aceita=".pdf" arquivo={fip630} aoEscolher={setFip630} />
                  <ArquivoCampo id="conc-fip103" rotulo="FIP103 (PDF, opcional)" aceita=".pdf" arquivo={fip103} aoEscolher={setFip103} />
                  <ArquivoCampo id="conc-ofx" rotulo="Extrato OFX" aceita=".ofx" arquivo={ofx} aoEscolher={setOfx} />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <ValorCampo id="conc-saldo-conta" rotulo="Saldo da conta corrente" valor={saldoConta} aoMudar={setSaldoConta} />
                  <ValorCampo id="conc-saldo-fundo" rotulo="Saldo do fundo (aplicação)" valor={saldoFundo} aoMudar={setSaldoFundo} />
                  <ValorCampo id="conc-rendimento" rotulo="Rendimento do fundo no mês" valor={rendimento} aoMudar={setRendimento} />
                </div>
                {!valoresOk && <p className="text-sm text-destructive">Valor inválido: use o formato 1.234,56.</p>}
                <div className="flex flex-wrap gap-2">
                  <Button onClick={lerEConciliar} disabled={!fip630 || !ofx || lendo || anteriorAberto || !valoresOk}>
                    {lendo ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <FileUp className="h-4 w-4" aria-hidden />}
                    Ler e conciliar
                  </Button>
                  {implantacao && (
                    <Button variant="outline" onClick={() => setAberturaAberta(true)}>
                      <Plus className="h-4 w-4" aria-hidden /> Pendência de abertura
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {calculo && quadro && (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard rotulo="Saldo do razão" valor={formatarCentavos(quadro.saldoRazaoCentavos)} />
                <KpiCard rotulo="Saldo do razão ajustado" valor={formatarCentavos(quadro.saldoAjustadoCentavos)} />
                <KpiCard rotulo="Saldo do extrato" valor={formatarCentavos(quadro.saldoExtratoCentavos)} detalhe="Conta corrente + fundo" />
                <KpiCard
                  rotulo="Diferença"
                  valor={formatarCentavos(quadro.diferencaCentavos)}
                  detalhe={quadro.diferencaCentavos === 0 ? "Quadro fechado" : "Confira as pendências"}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {!fechado && (
                  <>
                    <Button variant="outline" onClick={() => gravar(false)} disabled={salvar.isPending || !valoresOk || !temRazao}>
                      <Save className="h-4 w-4" aria-hidden /> Salvar rascunho
                    </Button>
                    <Button
                      onClick={() => setFecharAberto(true)}
                      disabled={salvar.isPending || !temRazao || quadro.diferencaCentavos !== 0}
                    >
                      <Lock className="h-4 w-4" aria-hidden /> Fechar o mês
                    </Button>
                  </>
                )}
                {!temRazao && <span className="text-sm text-muted-foreground">Leia os arquivos do mês para salvar.</span>}
                <Button variant="outline" onClick={baixarPdf} disabled={!temRazao}>
                  <FileDown className="h-4 w-4" aria-hidden /> PDF do quadro
                </Button>
                {fechado && isSuperAdmin && (
                  <Button variant="outline" onClick={() => setReabrirAberto(true)}>
                    <LockOpen className="h-4 w-4" aria-hidden /> Reabrir
                  </Button>
                )}
                {!fechado && selecionados.size > 0 && (
                  <div className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-1.5 text-sm">
                    <span>
                      {selecionados.size} selecionada(s) · débitos − créditos: <strong>{formatarCentavos(saldoSelecionado)}</strong>
                    </span>
                    <Button size="sm" onClick={() => setCasarAberto(true)} disabled={selecionados.size < 2 || saldoSelecionado !== 0}>
                      <Link2 className="h-4 w-4" aria-hidden /> Casar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelecionados(new Set())}>
                      Limpar
                    </Button>
                  </div>
                )}
              </div>

              {LISTAS.map((l) => (
                <ListaPendencias
                  key={`${l.lado}-${l.natureza}`}
                  titulo={`${l.titulo} ${l.sinal}`}
                  itens={calculo.resultado.pendentes.filter((p) => p.lado === l.lado && p.natureza === l.natureza)}
                  selecionados={selecionados}
                  aoAlternar={fechado ? undefined : alternar}
                  aoRemover={fechado ? undefined : removerAbertura}
                />
              ))}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Casados ({calculo.resultado.casamentos.length})</CardTitle>
                  <CardDescription>O que saiu do quadro e por qual regra. Desfazer devolve os itens às listas.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {calculo.resultado.casamentos.map((c, indice) => (
                    <div key={indice} className="flex flex-wrap items-start justify-between gap-2 rounded-md border p-2 text-sm">
                      <div className="space-y-0.5">
                        <StatusBadge tom={c.regra === "manual" ? "destaque" : "neutro"} icone={false}>
                          {REGRAS[c.regra]}
                        </StatusBadge>
                        {c.itens.map((id) => {
                          const i = porId.get(id);
                          return i ? (
                            <p key={id} className="text-muted-foreground">
                              {i.lado === "contabil" ? "Razão" : "Banco"} · {i.natureza === "debito" ? "D" : "C"} · {dataBR(i.data)} ·{" "}
                              {i.documento || i.historico} · {formatarCentavos(i.valorCentavos)}
                            </p>
                          ) : null;
                        })}
                        {c.justificativa && <p className="italic">{c.justificativa}</p>}
                      </div>
                      {!fechado && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setCalculo({ ...calculo, resultado: desfazerCasamento(calculo.itens, calculo.resultado, indice) })}
                        >
                          <Unlink className="h-4 w-4" aria-hidden /> Desfazer
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      <Dialog open={casarAberto} onOpenChange={setCasarAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Casar à mão</DialogTitle>
            <DialogDescription>
              {selecionados.size} pendência(s) saem do quadro. Diga por que elas se correspondem (fica gravado).
            </DialogDescription>
          </DialogHeader>
          <Textarea value={justificativa} onChange={(e) => setJustificativa(e.target.value)} maxLength={500} rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCasarAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmarCasamento} disabled={!justificativa.trim()}>
              Casar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AberturaDialog aberto={aberturaAberta} aoMudar={setAberturaAberta} mes={mes} aoAdicionar={adicionarAbertura} />

      <AlertDialog open={fecharAberto} onOpenChange={setFecharAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fechar o mês?</AlertDialogTitle>
            <AlertDialogDescription>
              O quadro fica gravado como está e as pendências passam para o mês seguinte. Depois de fechado, só o
              administrador reabre.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => gravar(true)} disabled={salvar.isPending}>
              Fechar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={reabrirAberto} onOpenChange={setReabrirAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reabrir o mês</DialogTitle>
            <DialogDescription>O motivo fica nas observações do mês. Um mês posterior fechado precisa ser reaberto antes.</DialogDescription>
          </DialogHeader>
          <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={300} rows={3} placeholder="Motivo" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReabrirAberto(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                dadosMes?.mes &&
                reabrir.mutate(
                  { id: dadosMes.mes.id, motivo },
                  {
                    onSuccess: () => {
                      setReabrirAberto(false);
                      setMotivo("");
                    },
                  },
                )
              }
              disabled={motivo.trim().length < 5 || reabrir.isPending}
            >
              Reabrir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ArquivoCampo(p: { id: string; rotulo: string; aceita: string; arquivo: File | null; aoEscolher: (f: File | null) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={p.id}>{p.rotulo}</Label>
      <Input id={p.id} type="file" accept={p.aceita} onChange={(e) => p.aoEscolher(e.target.files?.[0] ?? null)} />
      {p.arquivo && <p className="truncate text-xs text-muted-foreground">{p.arquivo.name}</p>}
    </div>
  );
}

function ValorCampo(p: { id: string; rotulo: string; valor: string; aoMudar: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={p.id}>{p.rotulo}</Label>
      <Input id={p.id} inputMode="decimal" placeholder="0,00" value={p.valor} onChange={(e) => p.aoMudar(e.target.value)} />
    </div>
  );
}

function ListaPendencias(p: {
  titulo: string;
  itens: ItemConciliacao[];
  selecionados: Set<string>;
  aoAlternar?: (id: string) => void;
  aoRemover?: (id: string) => void;
}) {
  const total = p.itens.reduce((s, i) => s + i.valorCentavos, 0);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex flex-wrap items-baseline justify-between gap-2 text-base">
          <span>{p.titulo}</span>
          <span className="tabular-nums">{formatarCentavos(total)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {p.itens.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma pendência.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {p.aoAlternar && <TableHead className="w-8" aria-label="Selecionar" />}
                  <TableHead>Data</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Histórico</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  {p.aoRemover && <TableHead className="w-8" aria-label="Remover" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {p.itens.map((i) => (
                  <TableRow key={i.id}>
                    {p.aoAlternar && (
                      <TableCell>
                        <Checkbox
                          checked={p.selecionados.has(i.id)}
                          onCheckedChange={() => p.aoAlternar?.(i.id)}
                          aria-label={`Selecionar ${i.documento || i.historico}`}
                        />
                      </TableCell>
                    )}
                    <TableCell className="whitespace-nowrap">{dataBR(i.data)}</TableCell>
                    <TableCell className="whitespace-nowrap">{i.documento || "—"}</TableCell>
                    <TableCell>{i.historico || "—"}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {i.origem === "mes" ? "Do mês" : i.origem === "anterior" ? "Mês anterior" : "Abertura"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatarCentavos(i.valorCentavos)}</TableCell>
                    {p.aoRemover && (
                      <TableCell>
                        {i.origem === "abertura" && (
                          <Button size="icon" variant="ghost" onClick={() => p.aoRemover?.(i.id)} aria-label="Remover pendência de abertura">
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

let sequenciaAbertura = 0;

function AberturaDialog(p: { aberto: boolean; aoMudar: (v: boolean) => void; mes: string; aoAdicionar: (i: ItemConciliacao) => void }) {
  const [lista, setLista] = useState("contabil-credito");
  const [data, setData] = useState("");
  const [documento, setDocumento] = useState("");
  const [historico, setHistorico] = useState("");
  const [valor, setValor] = useState("");
  const centavos = centavosDigitados(valor);
  const valido = /^\d{4}-\d{2}-\d{2}$/.test(data) && data < `${p.mes}-01` && !!centavos && centavos > 0;

  function adicionar() {
    if (!valido || !centavos) return;
    const [lado, natureza] = lista.split("-") as [LadoConciliacao, NaturezaConciliacao];
    sequenciaAbertura += 1;
    p.aoAdicionar({
      id: `abertura:${Date.now()}-${sequenciaAbertura}`,
      lado,
      natureza,
      data,
      documento: documento.trim(),
      tipo: "",
      historico: historico.trim(),
      valorCentavos: centavos,
      origem: "abertura",
    });
    setDocumento("");
    setHistorico("");
    setValor("");
    p.aoMudar(false);
  }

  return (
    <Dialog open={p.aberto} onOpenChange={p.aoMudar}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pendência de abertura</DialogTitle>
          <DialogDescription>Uma linha do último quadro feito fora do sistema, de antes deste mês.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ab-lista">Lista do quadro</Label>
            <Select value={lista} onValueChange={setLista}>
              <SelectTrigger id="ab-lista">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LISTAS.map((l) => (
                  <SelectItem key={`${l.lado}-${l.natureza}`} value={`${l.lado}-${l.natureza}`}>
                    {l.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ab-data">Data</Label>
              <Input id="ab-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <ValorCampo id="ab-valor" rotulo="Valor" valor={valor} aoMudar={setValor} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ab-doc">Documento</Label>
            <Input id="ab-doc" value={documento} maxLength={60} onChange={(e) => setDocumento(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ab-hist">Histórico</Label>
            <Input id="ab-hist" value={historico} maxLength={300} onChange={(e) => setHistorico(e.target.value)} />
          </div>
          {data && data >= `${p.mes}-01` && <p className="text-sm text-destructive">A data tem de ser de antes do mês.</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => p.aoMudar(false)}>
            Cancelar
          </Button>
          <Button onClick={adicionar} disabled={!valido}>
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
