import { describe, expect, it } from "vitest";
import { lerItensColados } from "./itensColados";

describe("lerItensColados (tabela de itens do TR copiada do Word ou do Excel)", () => {
  it("lê pelo cabeçalho, em qualquer ordem, com número no formato brasileiro e o código do catálogo", () => {
    const texto = [
      "ITEM\tCATMAT\tESPECIFICAÇÃO\tQUANT.\tUNID.",
      "1\t447001\tBola de futebol de campo\t50\tUnidade",
      "2\t\tRede de gol oficial\t1.200\tpar",
      "3\t\tColete dupla face\t20,5\tun",
    ].join("\r\n");
    const r = lerItensColados(texto);
    expect(r.ignoradas).toEqual([]);
    expect(r.itens).toEqual([
      { numero: 1, descricao: "Bola de futebol de campo", unidade: "Unidade", quantidade: 50, codigo: 447001 },
      { numero: 2, descricao: "Rede de gol oficial", unidade: "par", quantidade: 1200, codigo: null },
      { numero: 3, descricao: "Colete dupla face", unidade: "un", quantidade: 20.5, codigo: null },
    ]);
  });

  it("sem cabeçalho, usa a ordem nº, descrição, unidade, quantidade (ou descrição, unidade, quantidade)", () => {
    expect(lerItensColados("1\tBola\tun\t10\n2\tRede\tpar\t2").itens.map((i) => [i.numero, i.descricao, i.quantidade]))
      .toEqual([[1, "Bola", 10], [2, "Rede", 2]]);
    expect(lerItensColados("Bola\tun\t10").itens).toEqual([{ numero: null, descricao: "Bola", unidade: "un", quantidade: 10, codigo: null }]);
  });

  it("aponta a linha que não dá para ler e ignora as vazias", () => {
    const r = lerItensColados("Descrição\tUnidade\tQuantidade\nBola\tun\t10\n\nRede\t\t2\nApito\tun\tmuitos");
    expect(r.itens).toHaveLength(1);
    expect(r.ignoradas).toEqual([4, 5]);
  });

  it("linha de dado cuja descrição começa por Material ou Serviço não vira cabeçalho", () => {
    expect(lerItensColados("1\tMaterial de limpeza\tun\t10\n2\tBola\tun\t5").itens.map((i) => i.descricao)).toEqual(["Material de limpeza", "Bola"]);
    expect(lerItensColados("Serviço de manutenção\tmês\t12").itens).toHaveLength(1);
  });

  it("aceita ponto e vírgula quando não há tabulação", () => {
    expect(lerItensColados("Bola;un;10").itens[0]).toMatchObject({ descricao: "Bola", quantidade: 10 });
  });
});
