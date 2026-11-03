import { describe, expect, it } from "vitest";
import type { LinhaPlanilha } from "../planilha";
import { interpretarEstruturaPlanilha, ordemDeEnvio, paraContrato } from "./estruturaPlanilhaParser";

const CABECALHOS = ["Sigla", "Nome da unidade", "Tipo", "Responde a (sigla)", "Lei de criação", "Data da lei"];

const linha = (numeroLinha: number, valores: Record<string, unknown>): LinhaPlanilha => ({ numeroLinha, valores });

const unidade = (n: number, sigla: string, nome: string, tipo: string, superior = "") =>
  linha(n, { Sigla: sigla, "Nome da unidade": nome, Tipo: tipo, "Responde a (sigla)": superior });

describe("interpretarEstruturaPlanilha", () => {
  it("lê as unidades na ordem da planilha e traduz o tipo pelo rótulo", () => {
    const r = interpretarEstruturaPlanilha(CABECALHOS, [
      unidade(2, "DRH", "Divisão de Recursos Humanos", "Divisão", "DIRAF"),
      unidade(3, "PRES", "Presidência", "presidência"),
      unidade(4, "DIRAF", "Diretoria Administrativa", "DIRETORIA", "pres"),
    ]);
    expect(r.problemas).toEqual([]);
    expect(r.linhas.map((l) => [l.indice, l.sigla, l.tipo])).toEqual([
      [0, "DRH", "divisao"],
      [1, "PRES", "presidencia"],
      [2, "DIRAF", "diretoria"],
    ]);
    expect(paraContrato(r.linhas[0])).not.toHaveProperty("linhaPlanilha");
  });

  it("envia o superior antes do subordinado, mantendo o índice da planilha", () => {
    const r = interpretarEstruturaPlanilha(CABECALHOS, [
      unidade(2, "NUP", "Núcleo de Pessoal", "Núcleo", "DRH"),
      unidade(3, "DRH", "Divisão de RH", "Divisão", "DIRAF"),
      unidade(4, "PRES", "Presidência", "Presidência"),
      unidade(5, "DIRAF", "Diretoria", "Diretoria", "PRES"),
      unidade(6, "CI", "Controle Interno", "Assessoria", "SEDE"),
    ]);
    expect(r.problemas).toEqual([]);
    // CI responde a uma sigla fora da planilha: vai na ordem dela, e a RPC procura o superior no cadastro
    expect(ordemDeEnvio(r.linhas).map((l) => `${l.indice}:${l.sigla}`)).toEqual([
      "2:PRES",
      "3:DIRAF",
      "1:DRH",
      "0:NUP",
      "4:CI",
    ]);
  });

  it("acusa sigla repetida, tipo desconhecido, data inválida e unidade que responde a ela mesma", () => {
    const r = interpretarEstruturaPlanilha(CABECALHOS, [
      unidade(2, "PRES", "Presidência", "Presidência"),
      unidade(3, "pres", "Outra", "Diretoria"),
      unidade(4, "X", "Setor X", "Gerência"),
      unidade(5, "Y", "Setor Y", "Setor", "Y"),
      linha(6, { Sigla: "Z", "Nome da unidade": "Z", Tipo: "Setor", "Data da lei": "31/02/2025" }),
    ]);
    const erros = r.problemas.filter((p) => p.gravidade === "erro").map((p) => p.mensagem);
    expect(erros).toEqual([
      'Linha 3: a sigla "pres" já apareceu na Linha 2.',
      'Linha 4: tipo "Gerência" desconhecido (use: Presidência, Diretoria, Departamento, Setor, Divisão, Seção, Coordenação, Assessoria, Núcleo).',
      "Linha 5: a unidade não pode responder a ela mesma.",
      'Linha 6: "Data da lei" não é uma data válida (use dd/mm/aaaa).',
    ]);
  });

  it("acusa hierarquia em ciclo nas linhas do ciclo", () => {
    const r = interpretarEstruturaPlanilha(CABECALHOS, [
      unidade(2, "A", "Unidade A", "Setor", "B"),
      unidade(3, "B", "Unidade B", "Setor", "A"),
      unidade(4, "C", "Unidade C", "Setor"),
    ]);
    const erros = r.problemas.filter((p) => p.gravidade === "erro");
    expect(erros.map((p) => p.linha).sort()).toEqual([0, 1]);
    expect(erros[0].mensagem).toContain("hierarquia em ciclo (A → B → A)");
  });

  it("exige as colunas obrigatórias e avisa as desconhecidas", () => {
    const r = interpretarEstruturaPlanilha(["Sigla", "Telefone"], [linha(2, { Sigla: "A", Telefone: "1" })]);
    expect(r.problemas.map((p) => p.mensagem)).toEqual([
      "Faltam as colunas: Nome da unidade, Tipo. Use o modelo.",
      "Colunas não reconhecidas (ficam de fora): Telefone.",
      "Linha 2: informe o nome da unidade.",
      "Linha 2: informe o tipo.",
    ]);
  });

  it("ignora linhas em branco e recusa planilha vazia", () => {
    const r = interpretarEstruturaPlanilha(CABECALHOS, [linha(2, { Sigla: "", Tipo: " " })]);
    expect(r.linhas).toEqual([]);
    expect(r.problemas.map((p) => p.mensagem)).toContain("A planilha não tem nenhuma linha preenchida.");
  });
});
