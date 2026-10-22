import { describe, expect, it } from "vitest";
import type { LinhaPdf } from "@/lib/importacao/pdfTexto";
import { lerExtratoOfx, movimentoDoFundo, referenciaDoChecknum } from "./ofxBB";
import { lerRazaoFip630, lerRelacaoFip103, numeroCurto, razaoEhDaConta } from "./fiplan";
import { conciliar, itensDoMes, montarQuadro } from "./casamento";
import { casarManual, comRendimento, desfazerCasamento, doGravado, paraGravar, pendenciasDoMesAnterior, saldoDoGrupo } from "./registro";
import { centavosDeTextoBR, centavosDeTextoPonto, type ItemConciliacao } from "./tipos";

// Dados fictícios, com a forma dos relatórios do FIPLAN e do OFX do BB.

/** Linha de PDF: [texto, x, largura]. */
const linha = (pagina: number, y: number, ...trechos: [string, number, number?][]): LinhaPdf => ({
  pagina,
  y,
  trechos: trechos.map(([texto, x, w = texto.length * 4]) => ({ texto, x, xFim: x + w, y, pagina })),
});

/** Lançamento do FIP630 nas colunas do relatório: débito termina ~410, crédito ~480, saldo ~555. */
const lanc = (y: number, data: string, doc: string, tipo: string, hist: string, debito: string, credito: string) =>
  linha(1, y, [data, 16], [doc, 45], ["27", 141], [tipo, 175], [hist, 203], [debito, 410 - debito.length * 4], [credito, 480 - credito.length * 4], ["0,00", 535], ["D", 564]);

const FIP630: LinhaPdf[] = [
  linha(1, 10, ["FIP630 - Razão Analítico por Conta/Conta Corrente", 16]),
  linha(1, 20, ["*Exercício igual a 2026", 16]),
  linha(1, 25, ["Número da Conta Corrente contém 123456", 16]),
  linha(1, 30, ["DATA", 17], ["DOCUMENTO", 64], ["GRU", 147], ["TIPO", 178], ["HISTÓRICO", 244], ["DÉBITO", 353], ["CRÉDITO", 424], ["SALDO", 502], ["D/C", 560]),
  linha(1, 40, ["UG 0001 Exemplo - UG Executora", 16]),
  linha(1, 50, ["CONTA 1.1.1.1.1.19.04.01 CTA ESPECIAL - BB", 16], ["Saldo Anterior da Conta:", 334], ["1.000,00", 511], ["D", 564]),
  linha(1, 55, ["CONTA CORRENTE 001000100000000001234560000015000000 TIPO CCC:", 16], ["Saldo Anterior da CCC:", 334], ["1.000,00", 511], ["D", 564]),
  lanc(60, "02/07", "00001.0001.26.00010-1", "NOB", "Pagamento da LIQ Nº", "0,00", "100,00"),
  lanc(70, "02/07", "00001.0001.26.00011-0", "NOB", "Pagamento da LIQ Nº", "0,00", "200,00"),
  lanc(80, "08/07", "99000.0000.26.00500-1", "ARR", "Confirmação de ARR Bancária", "5.000,00", "0,00"),
  linha(1, 85, ["Cta Única do Tesouro", 203]),
  // rodapé da página logo depois de um lançamento: não entra no histórico
  linha(1, 87, ["04/08/2026 10:17", 259], ["usuario", 438], ["Página: 1 de", 509], ["2", 561]),
  lanc(90, "10/07", "00001.0000.26.00020-1", "ARR", "Inclusão de Sub-Repasse", "0,00", "700,00"),
  lanc(100, "10/07", "00001.0000.26.00020-1", "ARR", "Inclusão de Sub-Repasse", "700,00", "0,00"),
  lanc(110, "20/07", "00001.0001.26.00012-9", "NOB", "Pagamento do EMP Nº", "0,00", "1.500,00"),
  lanc(120, "24/07", "00001.0001.26.00013-7", "NOB", "Pagamento do EMP Nº", "0,00", "800,00"),
  linha(1, 130, ["Total Geral Unidade Orçamentária 00001:", 16], ["5.700,00", 368], ["3.300,00", 441], ["3.400,00", 511], ["D", 564]),
];

const FIP103: LinhaPdf[] = [
  linha(1, 10, ["FIP103 - Relação Pagamentos BB RE", 16]),
  linha(1, 20, ["RE: 00001.0001.26.00005-0 CBO: 01799 Banco: 001", 16]),
  linha(1, 30, ["00001.0001.26.00010-1", 16], ["0000.00000-0", 138], ["Credor Fictício A", 220], ["DOC", 382], ["540,00", 801]),
  linha(1, 40, ["00001.0001.26.00011-0", 16], ["0000.00000-1", 138], ["Credor Fictício B", 220], ["DOC", 382], ["200,00", 801]),
  linha(1, 50, ["SUB TOTAL", 16], ["RE: 00001.0001.26.00005-0", 358], ["740,00", 787]),
];
// a NOB 00010-1 vale 100,00 no razão e 540,00 aqui só no teste de recusa do subtotal; a versão certa:
FIP103[2] = linha(1, 30, ["00001.0001.26.00010-1", 16], ["0000.00000-0", 138], ["Credor Fictício A", 220], ["DOC", 382], ["100,00", 801]);
FIP103[4] = linha(1, 50, ["SUB TOTAL", 16], ["RE: 00001.0001.26.00005-0", 358], ["300,00", 787]);

const trn = (data: string, valor: string, checknum: string, memo: string) =>
  `<STMTTRN>\n<TRNTYPE>X\n<DTPOSTED>${data}\n<TRNAMT>${valor}\n<FITID>${data}${checknum}\n<CHECKNUM>${checknum}\n<MEMO>${memo}\n</STMTTRN>`;

const OFX = [
  "OFXHEADER:100",
  "<OFX><BANKACCTFROM><BANKID>001<ACCTID>00000-0</BANKACCTFROM><BANKTRANLIST><DTSTART>20260701<DTEND>20260731",
  trn("20260702", "-300.00", "426000050", "EMISSÃO ORDEM BANCÁRIA"),
  trn("20260702", "300.00", "1972", "RESGATE AUTOMÁTICO - BB RF CURTO PRAZO AUTOMÁTICO"),
  trn("20260706", "100.00", "4260001010000", "ORDEM BANC CANCELADA"),
  trn("20260708", "5000.00", "202607080000001", "ORDEM BANCÁRIA - ESTADO"),
  trn("20260721", "-1000.00", "41400", "PAGAMENTOS DIVERSOS"),
  trn("20260721", "-500.00", "41401", "FOLHA DE PAGAMENTO"),
  trn("20260731", "-8.00", "874870446", "TARIFA PAGAMENTOS"),
  "</BANKTRANLIST></OFX>",
].join("\n");

describe("valores", () => {
  it("lê o formato brasileiro e o do OFX em centavos", () => {
    expect(centavosDeTextoBR("1.234.567,89")).toBe(123456789);
    expect(centavosDeTextoBR("0,00")).toBe(0);
    expect(centavosDeTextoBR("Pagamento")).toBeNull();
    expect(centavosDeTextoPonto("-1620.00")).toBe(-162000);
    expect(centavosDeTextoPonto("617.5")).toBe(61750);
  });
});

describe("OFX do BB", () => {
  it("lê os lançamentos e as referências do FIPLAN no CHECKNUM", () => {
    const e = lerExtratoOfx(OFX);
    expect(e.conta).toBe("00000-0");
    expect(e.lancamentos).toHaveLength(7);
    expect(e.lancamentos[0]).toMatchObject({ data: "2026-07-02", valorCentavos: -30000, re: "26.00005-0", interno: false });
    expect(e.lancamentos[1].interno).toBe(true);
    expect(e.lancamentos[2].nob).toBe("26.00010-1");
  });

  it("soma as aplicações e os resgates automáticos (o movimento do fundo)", () => {
    expect(movimentoDoFundo(lerExtratoOfx(OFX))).toEqual({ aplicacoesCentavos: 0, resgatesCentavos: 30000 });
    const comAplicacao = OFX.replace(
      "</BANKTRANLIST>",
      `${trn("20260708", "-5000.00", "1972", "BB-APLIC C.PRZ-APL.AUT - BB RF CURTO PRAZO AUTOMÁTICO")}\n</BANKTRANLIST>`,
    );
    expect(movimentoDoFundo(lerExtratoOfx(comAplicacao))).toEqual({ aplicacoesCentavos: 500000, resgatesCentavos: 30000 });
  });

  it("só aceita CHECKNUM no formato do BB", () => {
    expect(referenciaDoChecknum("426000151", "EMISSÃO ORDEM BANCÁRIA")).toEqual({ re: "26.00015-1" });
    expect(referenciaDoChecknum("4260008860000", "ORDEM BANC CANCELADA")).toEqual({ nob: "26.00088-6" });
    expect(referenciaDoChecknum("1972", "EMISSÃO ORDEM BANCÁRIA")).toEqual({});
  });

  it("recusa arquivo que não é OFX", () => {
    expect(() => lerExtratoOfx("data;valor")).toThrow(/OFX/);
  });
});

describe("FIP630 e FIP103", () => {
  it("lê os lançamentos pela coluna e o saldo do razão", () => {
    const r = lerRazaoFip630(FIP630);
    expect(r.exercicio).toBe(2026);
    expect(r.saldoRazaoCentavos).toBe(340000);
    expect(r.lancamentos).toHaveLength(7);
    expect(r.lancamentos[0]).toMatchObject({ data: "2026-07-02", natureza: "credito", valorCentavos: 10000, tipo: "NOB", ug: "0001" });
    expect(r.lancamentos[2]).toMatchObject({ natureza: "debito", valorCentavos: 500000, historico: "Confirmação de ARR Bancária Cta Única do Tesouro" });
  });

  it("confere se o razão é da conta escolhida", () => {
    const r = lerRazaoFip630(FIP630);
    expect(r.filtroContaCorrente).toBe("123456");
    expect(r.contasCorrentes).toEqual(["001000100000000001234560000015000000"]);
    expect(r.lancamentos[0].historico).toBe("Pagamento da LIQ Nº");
    expect(razaoEhDaConta(r, "12345-6")).toBe(true);
    expect(razaoEhDaConta(r, "99999-9")).toBe(false);
    expect(razaoEhDaConta({ ...r, filtroContaCorrente: null, contasCorrentes: [] }, "99999-9")).toBe(true);
  });

  it("recusa outro relatório", () => {
    expect(() => lerRazaoFip630([linha(1, 1, ["FIP215 - Outro", 16])])).toThrow(/FIP630/);
    expect(() => lerRelacaoFip103([linha(1, 1, ["FIP215 - Outro", 16])])).toThrow(/FIP103/);
  });

  it("liga cada NOB à sua RE e confere o subtotal", () => {
    const rel = lerRelacaoFip103(FIP103);
    expect(rel.nobs.map((n) => [n.nob, numeroCurto(n.re)])).toEqual([
      ["00001.0001.26.00010-1", "26.00005-0"],
      ["00001.0001.26.00011-0", "26.00005-0"],
    ]);
    const errado = [...FIP103];
    errado[4] = linha(1, 50, ["SUB TOTAL", 16], ["RE: 00001.0001.26.00005-0", 358], ["999,00", 787]);
    expect(() => lerRelacaoFip103(errado)).toThrow(/subtotal/);
  });
});

describe("casamento e quadro", () => {
  const razao = lerRazaoFip630(FIP630);
  const rel = lerRelacaoFip103(FIP103);
  const extrato = lerExtratoOfx(OFX);

  it("casa RE, repasse, internos e soma; sobra o que o quadro deve listar", () => {
    const itens = itensDoMes(razao, rel, extrato, { data: "2026-07-31", valorCentavos: 1234 });
    const r = conciliar(itens);
    expect(r.casamentos.map((c) => c.regra).sort()).toEqual(["interno", "re", "repasse", "valor_data"]);
    const resumo = r.pendentes.map((p) => `${p.lado}/${p.natureza}/${p.valorCentavos}`);
    expect(resumo).toEqual([
      "contabil/credito/80000", // NOB de 24/07 que ainda não saiu no banco
      "bancario/credito/10000", // OB cancelada
      "bancario/debito/800", // tarifa
      "bancario/credito/1234", // rendimento do fundo
    ]);
    const q = montarQuadro(razao.saldoRazaoCentavos, r.pendentes, 430434);
    expect(q.saldoAjustadoCentavos).toBe(340000 + 80000 - 800 + 10000 + 1234);
    expect(q.diferencaCentavos).toBe(0);
  });

  it("pendência do mês anterior casa quando aparece no mês", () => {
    const anterior: ItemConciliacao = {
      id: "p1",
      lado: "bancario",
      natureza: "debito",
      data: "2026-06-30",
      documento: "",
      tipo: "",
      historico: "FOLHA DE PAGAMENTO",
      valorCentavos: 80000,
      origem: "anterior",
    };
    const r = conciliar([...itensDoMes(razao, rel, extrato), anterior]);
    expect(r.pendentes.some((p) => p.id === "p1")).toBe(false);
    expect(r.pendentes.some((p) => p.valorCentavos === 80000)).toBe(false);
  });

  it("não casa por valor quando há dois candidatos", () => {
    const item = (id: string, lado: ItemConciliacao["lado"], natureza: ItemConciliacao["natureza"]): ItemConciliacao => ({
      id,
      lado,
      natureza,
      data: "2026-07-10",
      documento: id,
      tipo: "",
      historico: "",
      valorCentavos: 54000,
      origem: "mes",
    });
    const r = conciliar([item("a", "contabil", "credito"), item("b", "bancario", "debito"), item("c", "bancario", "debito")]);
    expect(r.casamentos).toEqual([]);
  });
});

describe("gravação e casamento manual", () => {
  const razao = lerRazaoFip630(FIP630);
  const rel = lerRelacaoFip103(FIP103);
  const extrato = lerExtratoOfx(OFX);

  it("grava e relê o mesmo resultado", () => {
    const itens = itensDoMes(razao, rel, extrato);
    const r = conciliar(itens);
    const linhas = paraGravar(itens, r).map((l, i) => ({ ...l, id: `id${i}` }));
    expect(linhas.find((l) => l.lado === "bancario" && l.valor === 300)?.re).toBe("26.00005-0");
    expect(linhas.filter((l) => l.situacao === "pendente")).toHaveLength(r.pendentes.length);
    const relido = doGravado(linhas);
    expect(relido.resultado.casamentos.map((c) => c.regra)).toEqual(r.casamentos.map((c) => c.regra));
    expect(relido.resultado.pendentes.map((p) => p.valorCentavos)).toEqual(r.pendentes.map((p) => p.valorCentavos));
    const proximo = pendenciasDoMesAnterior(linhas);
    expect(proximo.every((p) => p.origem === "anterior" && p.itemOrigemId?.startsWith("id"))).toBe(true);
    expect(paraGravar(proximo, { casamentos: [], pendentes: proximo })[0].item_origem_id).toBe(proximo[0].itemOrigemId);
  });

  it("o rendimento digitado depois da leitura troca o crédito do quadro", () => {
    const itens = itensDoMes(razao, rel, extrato, { data: "2026-07-31", valorCentavos: 1234 });
    const r = conciliar(itens);
    const valor = (x: { resultado: { pendentes: ItemConciliacao[] } }) =>
      x.resultado.pendentes.filter((p) => p.historico.startsWith("RENDIMENTOS")).map((p) => p.valorCentavos);
    const mudou = comRendimento(itens, r, { data: "2026-07-31", valorCentavos: 61751 });
    expect(valor(mudou)).toEqual([61751]);
    expect(valor(comRendimento(mudou.itens, mudou.resultado, { data: "2026-07-31", valorCentavos: 0 }))).toEqual([]);
    const semRendimento = itensDoMes(razao, rel, extrato);
    expect(valor(comRendimento(semRendimento, conciliar(semRendimento), { data: "2026-07-31", valorCentavos: 500 }))).toEqual([500]);
    const igual = comRendimento(itens, r, { data: "2026-07-31", valorCentavos: 1234 });
    expect(igual.itens).toBe(itens);
  });

  it("casa à mão só quando débitos e créditos batem, com justificativa, e desfaz", () => {
    const itens = itensDoMes(razao, rel, extrato);
    const r = conciliar(itens);
    // OB cancelada (crédito do banco, 100,00) com uma NOB a crédito no razão de 800,00: não bate
    const cancelada = r.pendentes.find((p) => p.valorCentavos === 10000)!;
    const nob = r.pendentes.find((p) => p.valorCentavos === 80000)!;
    expect(() => casarManual(itens, r, [cancelada.id, nob.id], "teste")).toThrow(/somam/);
    const tarifa = r.pendentes.find((p) => p.valorCentavos === 800)!;
    expect(saldoDoGrupo([tarifa, cancelada])).toBe(800 - 10000);
    const rend: ItemConciliacao = { ...tarifa, id: "x", natureza: "credito" };
    const comX = [...itens, rend];
    const r2 = conciliar(comX);
    expect(() => casarManual(comX, r2, [tarifa.id, "x"], " ")).toThrow(/justificativa/);
    const casado = casarManual(comX, r2, [tarifa.id, "x"], "estorno da tarifa");
    expect(casado.casamentos.at(-1)).toMatchObject({ regra: "manual", justificativa: "estorno da tarifa" });
    expect(casado.pendentes.some((p) => p.id === tarifa.id)).toBe(false);
    const desfeito = desfazerCasamento(comX, casado, casado.casamentos.length - 1);
    expect(desfeito.pendentes.some((p) => p.id === tarifa.id)).toBe(true);
  });
});
