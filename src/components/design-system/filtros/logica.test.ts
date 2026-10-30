import { describe, expect, it } from "vitest";
import {
  aplicarFiltros,
  contarAtivos,
  descreverFiltro,
  estadoParaParams,
  limparEstado,
  opcoesComContagem,
  paramsParaEstado,
  resolverPeriodo,
  type FiltroDef,
} from "./logica";

interface Linha {
  id: string;
  situacao: string;
  data: string | null;
  valor: number;
  tags?: string[];
  credor: string;
}

const dados: Linha[] = [
  { id: "1", situacao: "pago", data: "2026-10-05", valor: 100, credor: "Alfa", tags: ["a", "b"] },
  { id: "2", situacao: "emitido", data: "2026-09-30T12:00:00", valor: 5000, credor: "Beta", tags: ["b"] },
  { id: "3", situacao: "pago", data: "2026-01-15", valor: 20000, credor: "Alfa" },
  { id: "4", situacao: "anulado", data: null, valor: 0, credor: "Gama, Ltda" },
];

const defs: FiltroDef<Linha>[] = [
  {
    tipo: "lista",
    id: "status",
    rotulo: "Situação",
    valor: (l) => l.situacao,
    opcoes: [
      { valor: "emitido", rotulo: "Emitido" },
      { valor: "pago", rotulo: "Pago" },
      { valor: "anulado", rotulo: "Anulado" },
    ],
  },
  { tipo: "lista", id: "credor", rotulo: "Credor", valor: (l) => l.credor },
  { tipo: "lista", id: "tag", rotulo: "Tag", valor: (l) => l.tags },
  { tipo: "periodo", id: "periodo", rotulo: "Período", valor: (l) => l.data },
  { tipo: "faixa", id: "valor", rotulo: "Valor", valor: (l) => l.valor, formato: "moeda" },
  { tipo: "booleano", id: "comValor", rotulo: "Com valor", valor: (l) => l.valor > 0 },
];

const hoje = new Date(2026, 9, 30); // 30/10/2026
const ids = (ls: Linha[]) => ls.map((l) => l.id);

describe("resolverPeriodo", () => {
  it("resolve os períodos relativos a partir de hoje", () => {
    expect(resolverPeriodo("hoje", hoje)).toEqual({ de: "2026-10-30", ate: "2026-10-30" });
    expect(resolverPeriodo("ultimos_7_dias", hoje)).toEqual({ de: "2026-10-24", ate: "2026-10-30" });
    expect(resolverPeriodo("mes_atual", hoje)).toEqual({ de: "2026-10-01", ate: "2026-10-31" });
    expect(resolverPeriodo("mes_anterior", hoje)).toEqual({ de: "2026-09-01", ate: "2026-09-30" });
    expect(resolverPeriodo("trimestre_atual", hoje)).toEqual({ de: "2026-10-01", ate: "2026-12-31" });
    expect(resolverPeriodo("ano_atual", hoje)).toEqual({ de: "2026-01-01", ate: "2026-12-31" });
  });
  it("mês passado em janeiro cai em dezembro do ano anterior", () => {
    expect(resolverPeriodo("mes_anterior", new Date(2026, 0, 10))).toEqual({ de: "2025-12-01", ate: "2025-12-31" });
  });
});

describe("aplicarFiltros", () => {
  it("sem filtro devolve tudo", () => {
    expect(aplicarFiltros(dados, defs, {}, hoje)).toBe(dados);
  });
  it("lista é OU dentro do filtro e E entre filtros", () => {
    expect(ids(aplicarFiltros(dados, defs, { status: { valores: ["pago", "emitido"] } }, hoje))).toEqual(["1", "2", "3"]);
    expect(ids(aplicarFiltros(dados, defs, { status: { valores: ["pago"] }, credor: { valores: ["Alfa"] }, valor: { min: 1000 } }, hoje))).toEqual(["3"]);
  });
  it("lista aceita vários valores por linha", () => {
    expect(ids(aplicarFiltros(dados, defs, { tag: { valores: ["b"] } }, hoje))).toEqual(["1", "2"]);
  });
  it("período relativo e fixo, ignorando linha sem data", () => {
    expect(ids(aplicarFiltros(dados, defs, { periodo: { relativo: "mes_atual" } }, hoje))).toEqual(["1"]);
    expect(ids(aplicarFiltros(dados, defs, { periodo: { de: "2026-09-01", ate: "2026-09-30" } }, hoje))).toEqual(["2"]);
    expect(ids(aplicarFiltros(dados, defs, { periodo: { ate: "2026-09-30" } }, hoje))).toEqual(["2", "3"]);
  });
  it("faixa com um ou dois limites e sim/não", () => {
    expect(ids(aplicarFiltros(dados, defs, { valor: { min: 100, max: 5000 } }, hoje))).toEqual(["1", "2"]);
    expect(ids(aplicarFiltros(dados, defs, { valor: { max: 100 } }, hoje))).toEqual(["1", "4"]);
    expect(ids(aplicarFiltros(dados, defs, { comValor: { ativo: true } }, hoje))).toEqual(["1", "2", "3"]);
  });
  it("valor vazio não filtra", () => {
    expect(aplicarFiltros(dados, defs, { status: { valores: [] }, valor: {} }, hoje)).toBe(dados);
    expect(contarAtivos(defs, { status: { valores: [] }, valor: { min: 1 } })).toBe(1);
  });
});

describe("opcoesComContagem", () => {
  it("conta pelas outras escolhas, sem o próprio filtro", () => {
    const op = opcoesComContagem(defs[0] as never, dados, defs, { status: { valores: ["pago"] }, credor: { valores: ["Alfa"] } }, hoje);
    expect(op.map((o) => [o.valor, o.quantidade])).toEqual([
      ["emitido", 0],
      ["pago", 2],
      ["anulado", 0],
    ]);
  });
  it("sem opções fixas, lista o que aparece nos dados em ordem alfabética", () => {
    const op = opcoesComContagem(defs[1] as never, dados, defs, {}, hoje);
    expect(op.map((o) => [o.rotulo, o.quantidade])).toEqual([
      ["Alfa", 2],
      ["Beta", 1],
      ["Gama, Ltda", 1],
    ]);
  });
});

describe("descreverFiltro", () => {
  it("monta o texto do chip", () => {
    expect(descreverFiltro(defs[0], { valores: ["pago", "emitido"] })).toBe("Pago, Emitido");
    expect(descreverFiltro(defs[0], { valores: ["pago", "emitido", "anulado"] })).toBe("Pago e mais 2");
    expect(descreverFiltro(defs[3], { relativo: "mes_atual" })).toBe("este mês");
    expect(descreverFiltro(defs[3], { de: "2026-01-01", ate: "2026-03-31" })).toBe("01/01/2026 a 31/03/2026");
    expect(descreverFiltro(defs[4], { min: 10000 }).replace(/\s/g, " ")).toBe("a partir de R$ 10.000,00");
  });
});

describe("URL", () => {
  it("ida e volta sem perder valores com vírgula e sem tocar em outros parâmetros", () => {
    const estado = {
      status: { valores: ["pago", "emitido"] },
      credor: { valores: ["Gama, Ltda"] },
      periodo: { relativo: "mes_atual" as const },
      valor: { min: 100 },
      comValor: { ativo: true as const },
    };
    const params = estadoParaParams(estado, defs, new URLSearchParams("exercicio=2026&status=velho"));
    expect(params.get("exercicio")).toBe("2026");
    expect(params.get("valor")).toBe("100..");
    const lido = paramsParaEstado(new URLSearchParams(params.toString()), defs);
    expect(lido).toEqual(estado);
  });
  it("nenhum filtro na URL devolve null; filtro limpo sai da URL", () => {
    expect(paramsParaEstado(new URLSearchParams("exercicio=2026"), defs)).toBeNull();
    expect(estadoParaParams({}, defs, new URLSearchParams("status=pago&x=1")).toString()).toBe("x=1");
  });
  it("aceita o link antigo ?status=emitido e descarta valor inválido", () => {
    expect(paramsParaEstado(new URLSearchParams("status=emitido&periodo=lixo&valor=abc"), defs)).toEqual({ status: { valores: ["emitido"] } });
  });
});

describe("limparEstado", () => {
  it("descarta filtro desconhecido ou vazio", () => {
    expect(limparEstado(defs, { velho: { ativo: true }, status: { valores: [] }, valor: { max: 5 } })).toEqual({ valor: { max: 5 } });
  });
});
