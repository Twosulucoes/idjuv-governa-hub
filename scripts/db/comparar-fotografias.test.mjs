import { describe, expect, it } from "vitest";
import { diferencas, lerFotografia, normalizar, secao, secaoHistorico } from "./comparar-fotografias.mjs";

const foto = (linhas) => lerFotografia(linhas.join("\n"));

describe("comparar-fotografias", () => {
  it("separa só em A, só em B e diferentes", () => {
    const a = foto(["tabela\tx\ttabela rls=true", "funcao\tf()\tdefiner corpo=1", "funcao\tg()\tinvoker corpo=2"]);
    const b = foto(["tabela\tx\ttabela rls=true", "funcao\tf()\tdefiner corpo=9", "indice\ti\tCREATE INDEX i"]);
    expect(diferencas(a, b)).toEqual({ soA: ["funcao\tg()"], soB: ["indice\ti"], diferentes: ["funcao\tf()"] });
  });

  it("ignora a reescrita de casts do pg_dump em constraint, mas não em função", () => {
    const k = "constraint\tacoes.acoes_tipo_check";
    const migracao = "CHECK (((tipo)::text = ANY ((ARRAY['a'::character varying, 'b'::character varying])::text[])))";
    const dump = "CHECK (((tipo)::text = ANY (ARRAY[('a'::character varying)::text, ('b'::character varying)::text])))";
    expect(normalizar(k, migracao)).toBe(normalizar(k, dump));
    expect(normalizar("funcao\tf()", "definer corpo=1")).toBe("definer corpo=1");
  });

  it("diz quando a produção bate com o baseline", () => {
    const prod = foto(["funcao\tfechar_folha(uuid)\tdefiner corpo=novo"]);
    const replay = foto(["funcao\tfechar_folha(uuid)\tdefiner corpo=velho"]);
    const base = foto(["funcao\tfechar_folha(uuid)\tdefiner corpo=novo"]);
    const { texto, total } = secao({ a: prod, b: replay, nomeA: "produção", nomeB: "migrações", terceiro: base, nomeTerceiro: "baseline" });
    expect(total).toBe(1);
    expect(texto).toContain("(igual ao baseline)");
    expect(texto).toContain("1 batem com o baseline");
  });

  it("sem diferença, diz que a estrutura é a mesma", () => {
    const a = foto(["tabela\tx\ttabela"]);
    expect(secao({ a, b: a, nomeA: "produção", nomeB: "migrações" }).total).toBe(0);
  });

  it("histórico aponta migração não aplicada e versão sem arquivo", () => {
    const texto = secaoHistorico(["20260101000000", "20990101000000", ""], ["20260101000000_a.sql", "20261013100300_b.sql"]);
    expect(texto).toContain("não registradas na produção: 1 (20261013100300)");
    expect(texto).toContain("sem arquivo no repositório: 1 (20990101000000)");
  });

  it("chave repetida na fotografia falha em vez de esconder diferença", () => {
    expect(() => foto(["constraint\tt.c\tPRIMARY KEY (id)", "constraint\tt.c\tFOREIGN KEY (x) REFERENCES y(id)"])).toThrow(/repetida/);
  });

  it("normalização não esconde diferença de lógica em policy", () => {
    const k = "policy\tpublic.t.p";
    const difere = (a, b) => expect(normalizar(k, a)).not.toBe(normalizar(k, b));
    difere("using=((auth.uid())::text IS NOT NULL)", "using=((auth.uid())::text IS NULL)");
    difere("using=((dono)::text = (auth.uid())::text OR is_admin())", "using=((dono)::text = (auth.uid())::text)");
    difere("using=(a AND (b OR c))", "using=((a AND b) OR c)");
    expect(normalizar(k, "using=((dono)::text = (auth.uid())::text)")).toBe("using=(dono = auth.uid())");
  });
});
