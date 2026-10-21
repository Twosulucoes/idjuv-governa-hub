/**
 * Ponte entre o cálculo da conciliação (centavos, ids do navegador) e as linhas de `fin_conciliacao_itens`
 * (reais, grupo por casamento), mais as operações da tela: casar à mão e desfazer um casamento.
 */

import type {
  Casamento,
  ItemConciliacao,
  LadoConciliacao,
  NaturezaConciliacao,
  OrigemItemConciliacao,
  RegraConciliacao,
  ResultadoConciliacao,
} from "./tipos";

/** Linha de `fin_conciliacao_itens` como a tela lê. */
export interface ItemGravado {
  id: string;
  lado: string;
  natureza: string;
  data: string;
  documento: string;
  tipo: string;
  historico: string;
  valor: number;
  re: string | null;
  nob: string | null;
  origem: string;
  item_origem_id: string | null;
  situacao: string;
  grupo: number | null;
  regra: string | null;
  justificativa: string | null;
}

/** Item como a RPC `salvar_conciliacao_mensal` recebe. */
export interface ItemParaGravar {
  lado: LadoConciliacao;
  natureza: NaturezaConciliacao;
  data: string;
  documento: string;
  tipo: string;
  historico: string;
  valor: number;
  re: string | null;
  nob: string | null;
  origem: OrigemItemConciliacao;
  item_origem_id: string | null;
  situacao: "casado" | "pendente";
  grupo: number | null;
  regra: RegraConciliacao | null;
  justificativa: string | null;
}

const reais = (centavos: number) => centavos / 100;
const centavos = (valor: number) => Math.round(Number(valor) * 100);

/** Monta o resultado a partir dos casamentos: pendente é o item que não está em nenhum, na ordem de entrada. */
export function resultadoCom(itens: ItemConciliacao[], casamentos: Casamento[]): ResultadoConciliacao {
  const casados = new Set(casamentos.flatMap((c) => c.itens));
  return { casamentos, pendentes: itens.filter((i) => !casados.has(i.id)) };
}

export function paraGravar(itens: ItemConciliacao[], resultado: ResultadoConciliacao): ItemParaGravar[] {
  const grupoDe = new Map<string, { grupo: number; casamento: Casamento }>();
  resultado.casamentos.forEach((c, i) => c.itens.forEach((id) => grupoDe.set(id, { grupo: i + 1, casamento: c })));
  return itens.map((i) => {
    const g = grupoDe.get(i.id);
    return {
      lado: i.lado,
      natureza: i.natureza,
      data: i.data,
      documento: i.documento.slice(0, 60),
      tipo: i.tipo.slice(0, 10),
      historico: i.historico.slice(0, 300),
      valor: reais(i.valorCentavos),
      re: i.re ?? null,
      nob: i.nob ?? null,
      origem: i.origem,
      item_origem_id: i.origem === "anterior" ? (i.itemOrigemId ?? null) : null,
      situacao: g ? "casado" : "pendente",
      grupo: g?.grupo ?? null,
      regra: g?.casamento.regra ?? null,
      justificativa: g?.casamento.justificativa?.slice(0, 500) ?? null,
    };
  });
}

function item(l: ItemGravado, id: string): ItemConciliacao {
  return {
    id,
    lado: l.lado as LadoConciliacao,
    natureza: l.natureza as NaturezaConciliacao,
    data: l.data,
    documento: l.documento,
    tipo: l.tipo,
    historico: l.historico,
    valorCentavos: centavos(l.valor),
    re: l.re ?? undefined,
    nob: l.nob ?? undefined,
    origem: l.origem as OrigemItemConciliacao,
    itemOrigemId: l.item_origem_id ?? undefined,
  };
}

/** Itens e casamentos de um mês gravado (para continuar o rascunho ou ver o mês fechado). */
export function doGravado(linhas: ItemGravado[]): { itens: ItemConciliacao[]; resultado: ResultadoConciliacao } {
  const itens = linhas.map((l) => item(l, l.id));
  const grupos = new Map<number, Casamento>();
  for (const l of linhas) {
    if (l.situacao !== "casado" || l.grupo === null) continue;
    const c = grupos.get(l.grupo) ?? { regra: (l.regra ?? "manual") as RegraConciliacao, itens: [], justificativa: l.justificativa ?? undefined };
    c.itens.push(l.id);
    grupos.set(l.grupo, c);
  }
  const casamentos = [...grupos.entries()].sort((a, b) => a[0] - b[0]).map(([, c]) => c);
  return { itens, resultado: resultadoCom(itens, casamentos) };
}

/** Pendências de um mês fechado, para entrar no mês seguinte com origem `anterior`. */
export function pendenciasDoMesAnterior(linhas: ItemGravado[]): ItemConciliacao[] {
  return linhas
    .filter((l) => l.situacao === "pendente")
    .map((l) => ({ ...item(l, `anterior:${l.id}`), origem: "anterior", itemOrigemId: l.id }));
}

/**
 * Um grupo casa quando tira do quadro o mesmo tanto dos dois sentidos: soma dos débitos (razão e banco) igual à dos
 * créditos. Ex.: débito do banco com as NOBs a crédito no razão; débito e crédito do razão que se anulam.
 */
export function saldoDoGrupo(itens: ItemConciliacao[]): number {
  return itens.reduce((s, i) => s + (i.natureza === "debito" ? i.valorCentavos : -i.valorCentavos), 0);
}

export function casarManual(
  itens: ItemConciliacao[],
  resultado: ResultadoConciliacao,
  ids: string[],
  justificativa: string,
): ResultadoConciliacao {
  const pendentes = new Set(resultado.pendentes.map((p) => p.id));
  const grupo = itens.filter((i) => ids.includes(i.id));
  if (grupo.length < 2 || grupo.some((i) => !pendentes.has(i.id))) throw new Error("Escolha duas ou mais pendências.");
  if (saldoDoGrupo(grupo) !== 0) throw new Error("Os débitos e os créditos escolhidos não somam o mesmo valor.");
  if (!justificativa.trim()) throw new Error("Informe a justificativa do casamento manual.");
  return resultadoCom(itens, [...resultado.casamentos, { regra: "manual", itens: grupo.map((i) => i.id), justificativa: justificativa.trim() }]);
}

export function desfazerCasamento(itens: ItemConciliacao[], resultado: ResultadoConciliacao, indice: number): ResultadoConciliacao {
  return resultadoCom(itens, resultado.casamentos.filter((_, i) => i !== indice));
}
