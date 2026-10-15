import { describe, expect, it } from "vitest";
import { paraDataIso } from "../planilha";
import {
  CABECALHOS_MODELO,
  interpretarPortariasPlanilha,
  normalizarNumeroPortaria,
  paraContrato,
} from "./portariasPlanilhaParser";

const CABECALHOS = Object.values(CABECALHOS_MODELO);
const HOJE = "2026-10-15";

type Valores = Partial<Record<keyof typeof CABECALHOS_MODELO, unknown>>;

/** Monta as linhas como `lerPrimeiraAba` devolve (cabeçalho do modelo; linha 2 em diante). */
function ler(...linhas: Valores[]) {
  const brutas = linhas.map((v, i) => {
    const valores: Record<string, unknown> = {};
    for (const [campo, cabecalho] of Object.entries(CABECALHOS_MODELO)) {
      valores[cabecalho] = v[campo as keyof Valores] ?? "";
    }
    return { numeroLinha: i + 2, valores };
  });
  return interpretarPortariasPlanilha(CABECALHOS, brutas, { hoje: HOJE });
}

const base: Valores = {
  numero: "001/2026",
  data_documento: "10/01/2026",
  categoria: "Nomeação",
  doe_numero: "1234",
  doe_data: "12/01/2026",
  matriculas: "1001",
};

const erros = (r: ReturnType<typeof ler>) => r.problemas.filter((p) => p.gravidade === "erro").map((p) => p.mensagem);
const avisos = (r: ReturnType<typeof ler>) => r.problemas.filter((p) => p.gravidade === "aviso").map((p) => p.mensagem);

describe("normalizarNumeroPortaria", () => {
  it("completa com zeros à esquerda e aceita prefixo", () => {
    expect(normalizarNumeroPortaria("1/2026")).toBe("001/2026");
    expect(normalizarNumeroPortaria(" 12 / 2026 ")).toBe("012/2026");
    expect(normalizarNumeroPortaria("Nº 7/2025")).toBe("007/2025");
    expect(normalizarNumeroPortaria("1234/2026")).toBe("1234/2026");
  });
  it("recusa fora do formato", () => {
    expect(normalizarNumeroPortaria("2026")).toBeNull();
    expect(normalizarNumeroPortaria("1/26")).toBeNull();
    expect(normalizarNumeroPortaria("0/2026")).toBeNull();
  });
});

describe("paraDataIso", () => {
  it("converte os três formatos sem deslocar fuso", () => {
    expect(paraDataIso("05/02/2026")).toBe("2026-02-05");
    expect(paraDataIso("5/2/2026")).toBe("2026-02-05");
    expect(paraDataIso("2026-02-05")).toBe("2026-02-05");
    // número de série do Excel: 46058 = 05/02/2026
    expect(paraDataIso(46058)).toBe("2026-02-05");
    expect(paraDataIso(new Date(2026, 1, 5))).toBe("2026-02-05");
  });
  it("vazio é null e inválido é undefined", () => {
    expect(paraDataIso("")).toBeNull();
    expect(paraDataIso(null)).toBeNull();
    expect(paraDataIso("31/02/2026")).toBeUndefined();
    expect(paraDataIso("ontem")).toBeUndefined();
  });
});

describe("interpretarPortariasPlanilha", () => {
  it("linha válida vira o contrato da RPC", () => {
    const r = ler({ ...base, numero: "1/2026" });
    expect(erros(r)).toEqual([]);
    expect(paraContrato(r.linhas[0])).toEqual({
      indice: 0,
      numero: "001/2026",
      data_documento: "2026-01-10",
      categoria: "nomeacao",
      ementa: null,
      processo_sei: null,
      status: "publicado",
      assinado_por: null,
      data_assinatura: null,
      doe_numero: "1234",
      doe_data: "2026-01-12",
      data_vigencia_inicio: null,
      data_vigencia_fim: null,
      matriculas: ["1001"],
      observacoes: null,
    });
    expect(r.linhas[0].linhaPlanilha).toBe(2);
  });

  it("recusa PENDENTE", () => {
    const r = ler({ ...base, numero: "PENDENTE/2026" });
    expect(erros(r)).toHaveLength(1);
    expect(erros(r)[0]).toMatch(/Linha 2: .*pendência/);
    expect(r.problemas[0].linha).toBe(0);
  });

  it("recusa número repetido no arquivo (depois de normalizar)", () => {
    const r = ler(base, { ...base, numero: "1/2026" });
    expect(erros(r)).toEqual([expect.stringMatching(/Linha 3: .*001\/2026 aparece repetida \(já está na linha 2\)/)]);
  });

  it("recusa número que o Excel transformou em número", () => {
    expect(erros(ler({ ...base, numero: 46058 }))[0]).toMatch(/NNN\/AAAA/);
  });

  it("aceita categoria por rótulo e por código", () => {
    const r = ler(
      { ...base, numero: "1/2026", categoria: "exoneração" },
      { ...base, numero: "2/2026", categoria: "designacao" },
      { ...base, numero: "3/2026", categoria: "Pessoal (Genérica)" },
    );
    expect(erros(r)).toEqual([]);
    expect(r.linhas.map((l) => l.categoria)).toEqual(["exoneracao", "designacao", "pessoal"]);
  });

  it("recusa categoria desconhecida", () => {
    expect(erros(ler({ ...base, categoria: "Aposentadoria" }))[0]).toMatch(/categoria "Aposentadoria" desconhecida/);
  });

  it("lê datas nos três formatos", () => {
    const r = ler(
      { ...base, numero: "1/2026", data_documento: "10/01/2026" },
      { ...base, numero: "2/2026", data_documento: "2026-01-10" },
      { ...base, numero: "3/2026", data_documento: 46032 },
    );
    expect(erros(r)).toEqual([]);
    expect(r.linhas.map((l) => l.data_documento)).toEqual(["2026-01-10", "2026-01-10", "2026-01-10"]);
  });

  it("recusa data inválida, futura ou ausente", () => {
    expect(erros(ler({ ...base, data_documento: "32/01/2026" }))[0]).toMatch(/não é uma data válida/);
    expect(erros(ler({ ...base, data_documento: "16/10/2026", doe_data: "17/10/2026" }))).toContainEqual(
      expect.stringMatching(/no futuro/),
    );
    expect(erros(ler({ ...base, data_documento: "" }))[0]).toMatch(/data da portaria é obrigatória/);
  });

  it("exige Nº DOE e Data DOE juntos", () => {
    const r = ler({ ...base, doe_data: "" });
    expect(erros(r)).toContainEqual(expect.stringMatching(/Nº DOE e a Data DOE juntos/));
  });

  it("sem situação e sem DOE fica aguardando assinatura; publicada exige DOE", () => {
    const sem = ler({ ...base, doe_numero: "", doe_data: "" });
    expect(erros(sem)).toEqual([]);
    expect(sem.linhas[0].status).toBe("aguardando_assinatura");
    expect(erros(ler({ ...base, situacao: "Publicada", doe_numero: "", doe_data: "" }))[0]).toMatch(/exige o Nº DOE/);
  });

  it("recusa DOE anterior à portaria e situação revogada", () => {
    expect(erros(ler({ ...base, doe_data: "09/01/2026" }))[0]).toMatch(/anterior à data da portaria/);
    expect(erros(ler({ ...base, situacao: "Revogada" }))[0]).toMatch(/revogada não se importa/);
  });

  it("assinada exige quem assinou e a data", () => {
    const r = ler({ ...base, doe_numero: "", doe_data: "", situacao: "Assinada", assinado_por: "Fulano" });
    expect(erros(r)[0]).toMatch(/Assinada exige/);
  });

  it("vigente exige início da vigência; fim não antes do início", () => {
    expect(erros(ler({ ...base, situacao: "Vigente" }))[0]).toMatch(/Vigente exige o início/);
    const r = ler({
      ...base,
      situacao: "vigente",
      data_vigencia_inicio: "10/01/2026",
      data_vigencia_fim: "01/01/2026",
    });
    expect(erros(r)[0]).toMatch(/fim da vigência é anterior/);
  });

  it("separa matrículas por ';', apara espaços e tira repetidas", () => {
    const r = ler({ ...base, matriculas: " 1001 ;1002; ;1001 ; 1003" });
    expect(erros(r)).toEqual([]);
    expect(r.linhas[0].matriculas).toEqual(["1001", "1002", "1003"]);
    expect(ler({ ...base, matriculas: 1001 }).linhas[0].matriculas).toEqual(["1001"]);
  });

  it("recusa matrículas separadas por vírgula", () => {
    expect(erros(ler({ ...base, matriculas: "1001, 1002" }))[0]).toMatch(/separe as matrículas por ";"/);
  });

  it("avisa portaria de pessoal sem matrícula e observações preenchidas", () => {
    const r = ler({ ...base, matriculas: "", observacoes: "conferir" });
    expect(erros(r)).toEqual([]);
    expect(avisos(r)).toEqual([
      expect.stringMatching(/sem matrícula/),
      expect.stringMatching(/dado pessoal/),
    ]);
    expect(avisos(ler({ ...base, categoria: "Normativa", matriculas: "" }))).toEqual([]);
    // Mesma lista da RPC: férias e licença não avisam
    expect(avisos(ler({ ...base, categoria: "Férias", matriculas: "" }))).toEqual([]);
    expect(avisos(ler({ ...base, categoria: "licenca", matriculas: "" }))).toEqual([]);
    expect(avisos(ler({ ...base, categoria: "Cessão", matriculas: "" }))).toEqual([expect.stringMatching(/sem matrícula/)]);
  });

  it("ignora linhas em branco e reclama de colunas obrigatórias ausentes", () => {
    const r = interpretarPortariasPlanilha(["Número", "Coluna extra"], [{ numeroLinha: 2, valores: { Número: "" } }], {
      hoje: HOJE,
    });
    expect(erros(r)).toEqual([
      expect.stringMatching(/Faltam as colunas: Data da portaria, Categoria/),
      expect.stringMatching(/nenhuma linha preenchida/),
    ]);
    expect(avisos(r)[0]).toMatch(/Coluna extra/);
    expect(r.linhas).toEqual([]);
  });
});

describe("lerPrimeiraAba + parser (planilha de verdade)", () => {
  it("lê XLSX com data do Excel e CSV com dd/mm/aaaa", async () => {
    const XLSX = await import("xlsx");
    const { lerPrimeiraAba } = await import("../planilha");

    const folha = XLSX.utils.aoa_to_sheet([
      ["Número", "Data da portaria", "Categoria", "Matrículas"],
      ["1/2026", new Date(2026, 0, 10), "Nomeação", "1001;1002"],
    ]);
    const pasta = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(pasta, folha, "Portarias");
    const xlsx = XLSX.write(pasta, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
    const lidaXlsx = await lerPrimeiraAba(new Blob([xlsx]));
    const r1 = interpretarPortariasPlanilha(lidaXlsx.cabecalhos, lidaXlsx.linhas, { hoje: HOJE });
    expect(erros(r1)).toEqual([]);
    expect(r1.linhas[0]).toMatchObject({ numero: "001/2026", data_documento: "2026-01-10", linhaPlanilha: 2 });

    const csv = "Número,Data da portaria,Categoria,Matrículas\n2/2026,05/02/2026,exoneracao,1001\n";
    const lidaCsv = await lerPrimeiraAba(new Blob([csv]));
    const r2 = interpretarPortariasPlanilha(lidaCsv.cabecalhos, lidaCsv.linhas, { hoje: HOJE });
    expect(erros(r2)).toEqual([]);
    expect(r2.linhas[0]).toMatchObject({ numero: "002/2026", data_documento: "2026-02-05", categoria: "exoneracao" });

    // CSV do Excel brasileiro: separador ";" e Windows-1252 (acentos em 1 byte)
    const texto = 'Número;Data da portaria;Categoria;Matrículas\n3/2026;05/02/2026;Exoneração;"1001;1002"\n';
    const latin1 = Uint8Array.from(texto, (c) => c.charCodeAt(0));
    const lidaBr = await lerPrimeiraAba(new Blob([latin1]));
    const r3 = interpretarPortariasPlanilha(lidaBr.cabecalhos, lidaBr.linhas, { hoje: HOJE });
    expect(erros(r3)).toEqual([]);
    expect(r3.linhas[0]).toMatchObject({ numero: "003/2026", categoria: "exoneracao", matriculas: ["1001", "1002"] });
  });
});
