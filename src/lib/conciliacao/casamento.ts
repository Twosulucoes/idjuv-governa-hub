/**
 * Casamento da conciliação mensal: junta os lançamentos do razão (FIP630) e do extrato (OFX) do mês com as
 * pendências em aberto do mês anterior e casa o que corresponde. O que sobra vai para as quatro listas do quadro.
 *
 * Regras, em ordem (cada item casa uma vez só):
 * 1. interno/estorno: no razão, débito e crédito do mesmo valor com o mesmo documento (sub-repasse entre UGs, NLA
 *    nas duas contas) ou em que um cita o documento do outro (estorno, "para ajuste");
 * 2. re: débito "Emissão Ordem Bancária" do extrato com as NOBs da mesma RE, quando a soma bate;
 * 3. ob_cancelada: crédito "Ordem banc. cancelada" com o débito do razão que cita a NOB, de mesmo valor;
 * 4. repasse: ARR a débito no razão com a entrada "Ordem Bancária" do extrato, mesmo valor, até 5 dias;
 * 5. valor_data: lados opostos, mesmo valor, até 5 dias, só com candidato único;
 * 6. valor_data (soma): um item com vários do outro lado na mesma data cuja soma bate, até 7 dias, só se único.
 *
 * Lado oposto: o débito do razão (entrada no ativo) corresponde ao crédito do banco, e vice-versa.
 */

import type { ExtratoOfx } from "./ofxBB";
import { numeroCurto, type RazaoFip630, type RelacaoFip103 } from "./fiplan";
import {
  HISTORICO_RENDIMENTO,
  type Casamento,
  type ItemConciliacao,
  type NaturezaConciliacao,
  type QuadroConciliacao,
  type ResultadoConciliacao,
} from "./tipos";

const DIA = 86_400_000;
const dias = (a: string, b: string) => Math.abs(Date.parse(a) - Date.parse(b)) / DIA;
const digitos = (s: string) => s.replace(/\D/g, "");
const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
const oposta = (n: NaturezaConciliacao): NaturezaConciliacao => (n === "debito" ? "credito" : "debito");

/**
 * Datas compatíveis: até `limite` dias entre as duas. Com uma pendência antiga (mês anterior ou abertura) o limite
 * não vale para trás: ela pode ser de meses antes, mas não de mais de `limite` dias depois do item do mês.
 */
const perto = (a: ItemConciliacao, b: ItemConciliacao, limite: number) => {
  const aAntiga = a.origem !== "mes";
  const bAntiga = b.origem !== "mes";
  if (aAntiga && bAntiga) return true;
  if (aAntiga) return Date.parse(a.data) <= Date.parse(b.data) + limite * DIA;
  if (bAntiga) return Date.parse(b.data) <= Date.parse(a.data) + limite * DIA;
  return dias(a.data, b.data) <= limite;
};

/** Itens do mês a partir dos três arquivos. O rendimento do fundo, se houver, entra como crédito bancário. */
export function itensDoMes(
  razao: RazaoFip630,
  relacao: RelacaoFip103 | null,
  extrato: ExtratoOfx,
  rendimento?: { data: string; valorCentavos: number },
): ItemConciliacao[] {
  const reDaNob = new Map((relacao?.nobs ?? []).map((n) => [n.nob, numeroCurto(n.re)]));
  const itens: ItemConciliacao[] = razao.lancamentos.map((l, i) => ({
    id: `r${i}`,
    lado: "contabil",
    natureza: l.natureza,
    data: l.data,
    documento: l.documento,
    tipo: l.tipo,
    historico: l.historico,
    valorCentavos: l.valorCentavos,
    re: reDaNob.get(l.documento),
    origem: "mes",
  }));
  extrato.lancamentos.forEach((l, i) => {
    if (l.interno || l.valorCentavos === 0) return;
    itens.push({
      id: `b${i}`,
      lado: "bancario",
      natureza: l.valorCentavos < 0 ? "debito" : "credito",
      data: l.data,
      documento: l.checknum,
      tipo: "",
      historico: l.memo,
      valorCentavos: Math.abs(l.valorCentavos),
      re: l.re,
      nob: l.nob,
      origem: "mes",
    });
  });
  if (rendimento && rendimento.valorCentavos > 0) {
    itens.push({
      id: "rendimento",
      lado: "bancario",
      natureza: "credito",
      data: rendimento.data,
      documento: "",
      tipo: "",
      historico: HISTORICO_RENDIMENTO,
      valorCentavos: rendimento.valorCentavos,
      origem: "mes",
    });
  }
  return itens;
}

/** O histórico de `a` cita o documento de `b` (com ou sem pontuação). */
const cita = (a: ItemConciliacao, b: ItemConciliacao) =>
  !!b.documento && (a.historico.includes(b.documento) || (digitos(b.documento).length >= 10 && digitos(a.historico).includes(digitos(b.documento))));

export function conciliar(itens: ItemConciliacao[]): ResultadoConciliacao {
  const abertos = new Map(itens.map((i) => [i.id, i]));
  const casamentos: Casamento[] = [];
  const casar = (regra: Casamento["regra"], grupo: ItemConciliacao[]) => {
    for (const i of grupo) abertos.delete(i.id);
    casamentos.push({ regra, itens: grupo.map((i) => i.id) });
  };
  const lista = () => [...abertos.values()];

  // 1. Internos do razão e estornos
  for (const a of lista()) {
    if (!abertos.has(a.id) || a.lado !== "contabil") continue;
    const par = lista().find(
      (b) =>
        b.id !== a.id &&
        b.lado === "contabil" &&
        b.natureza === oposta(a.natureza) &&
        b.valorCentavos === a.valorCentavos &&
        (b.documento === a.documento || cita(a, b) || cita(b, a)),
    );
    if (par) casar(par.documento === a.documento ? "interno" : "estorno", [a, par]);
  }

  // 2. RE: débito do banco com as NOBs da RE
  for (const b of lista()) {
    if (!abertos.has(b.id) || b.lado !== "bancario" || b.natureza !== "debito" || !b.re) continue;
    const nobs = lista().filter((r) => r.lado === "contabil" && r.natureza === "credito" && r.re === b.re);
    if (nobs.length && nobs.reduce((s, r) => s + r.valorCentavos, 0) === b.valorCentavos) casar("re", [b, ...nobs]);
  }

  // 3. OB cancelada com o lançamento do razão que cita a NOB
  for (const b of lista()) {
    if (!abertos.has(b.id) || b.lado !== "bancario" || b.natureza !== "credito" || !b.nob) continue;
    const nob = b.nob;
    const par = lista().find(
      (r) =>
        r.lado === "contabil" &&
        r.natureza === "debito" &&
        r.valorCentavos === b.valorCentavos &&
        (r.historico.includes(nob) || digitos(r.historico).includes(digitos(nob))),
    );
    if (par) casar("ob_cancelada", [b, par]);
  }

  // 4. Repasse do Tesouro (ARR) com a entrada "Ordem Bancária"
  for (const r of lista()) {
    if (!abertos.has(r.id) || r.lado !== "contabil" || r.natureza !== "debito" || r.tipo !== "ARR") continue;
    const candidatos = lista().filter(
      (b) =>
        b.lado === "bancario" &&
        b.natureza === "credito" &&
        !b.nob &&
        semAcento(b.historico).startsWith("ORDEM BANCARIA") &&
        b.valorCentavos === r.valorCentavos &&
        dias(b.data, r.data) <= 5,
    );
    if (candidatos.length === 1) casar("repasse", [r, candidatos[0]]);
  }

  // 5. Valor e data, 1 para 1, candidato único dos dois lados
  const candidatos1 = (a: ItemConciliacao) =>
    lista().filter(
      (b) =>
        b.lado !== a.lado &&
        b.natureza === oposta(a.natureza) &&
        b.valorCentavos === a.valorCentavos &&
        perto(a, b, 5),
    );
  for (const a of lista()) {
    if (!abertos.has(a.id) || a.lado !== "contabil") continue;
    const c = candidatos1(a);
    if (c.length === 1 && candidatos1(c[0]).length === 1) casar("valor_data", [a, c[0]]);
  }

  // 6. Soma: um item com vários do outro lado lançados na mesma data
  for (const a of lista()) {
    if (!abertos.has(a.id)) continue;
    const doOutroLado = lista().filter(
      (b) => b.lado !== a.lado && b.natureza === oposta(a.natureza) && b.valorCentavos < a.valorCentavos && perto(a, b, 7),
    );
    const porData = new Map<string, ItemConciliacao[]>();
    for (const b of doOutroLado) porData.set(b.data, [...(porData.get(b.data) ?? []), b]);
    const achados: ItemConciliacao[][] = [];
    for (const grupo of porData.values()) {
      if (grupo.length < 2) continue;
      if (grupo.reduce((s, b) => s + b.valorCentavos, 0) === a.valorCentavos) {
        achados.push(grupo);
        continue;
      }
      if (grupo.length <= 12) achados.push(...subconjuntosComSoma(grupo, a.valorCentavos, 4));
    }
    if (achados.length === 1) casar("valor_data", [a, ...achados[0]]);
  }

  return { casamentos, pendentes: itens.filter((i) => abertos.has(i.id)) };
}

/** Subconjuntos (de 2 a `max` itens) cuja soma é `alvo`. */
function subconjuntosComSoma(itens: ItemConciliacao[], alvo: number, max: number): ItemConciliacao[][] {
  const achados: ItemConciliacao[][] = [];
  const percorrer = (inicio: number, escolhidos: ItemConciliacao[], soma: number) => {
    if (escolhidos.length >= 2 && soma === alvo) achados.push([...escolhidos]);
    if (escolhidos.length === max || soma >= alvo) return;
    for (let i = inicio; i < itens.length; i++) {
      escolhidos.push(itens[i]);
      percorrer(i + 1, escolhidos, soma + itens[i].valorCentavos);
      escolhidos.pop();
    }
  };
  percorrer(0, [], 0);
  return achados;
}

/** Quadro da SEFAZ a partir das pendências. Extrato = conta corrente + fundo no último dia do mês. */
export function montarQuadro(
  saldoRazaoCentavos: number,
  pendentes: ItemConciliacao[],
  saldoExtratoCentavos: number,
): QuadroConciliacao {
  const soma = (lado: ItemConciliacao["lado"], natureza: NaturezaConciliacao) =>
    pendentes.filter((i) => i.lado === lado && i.natureza === natureza).reduce((s, i) => s + i.valorCentavos, 0);
  const debitosContabeisCentavos = soma("contabil", "debito");
  const creditosContabeisCentavos = soma("contabil", "credito");
  const debitosBancariosCentavos = soma("bancario", "debito");
  const creditosBancariosCentavos = soma("bancario", "credito");
  const saldoAjustadoCentavos =
    saldoRazaoCentavos - debitosContabeisCentavos + creditosContabeisCentavos - debitosBancariosCentavos + creditosBancariosCentavos;
  return {
    saldoRazaoCentavos,
    debitosContabeisCentavos,
    creditosContabeisCentavos,
    debitosBancariosCentavos,
    creditosBancariosCentavos,
    saldoAjustadoCentavos,
    saldoExtratoCentavos,
    diferencaCentavos: saldoAjustadoCentavos - saldoExtratoCentavos,
  };
}
