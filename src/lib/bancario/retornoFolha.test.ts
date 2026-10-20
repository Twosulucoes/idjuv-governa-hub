import { describe, expect, it } from "vitest";
import { gerarFolhaBbCnab240 } from "@/lib/bancario/folhaBbCnab240";
import { lerCnab240 } from "@/lib/bancario/cnab240";
import { casarRetorno, ehRetornoPrevia, problemasRetorno, type CreditoDaRemessa } from "@/lib/bancario/retornoFolha";
import type { DadosFavorecido, RemessaCNAB } from "@/lib/cnabGenerator";

// Dados fictícios. O retorno é a remessa do gerador com o que o BB muda ao devolver (conferido num retorno real de
// 09/2026, fora do repositório porque tem dados pessoais): 143 = '2', "PREVIA" no header e as ocorrências em 231-240.
const dataCredito = new Date(2033, 0, 30);
const favorecido = (f: Partial<DadosFavorecido>): DadosFavorecido => ({
  nome: "",
  cpf: "",
  banco: "001",
  agencia: "1234",
  agenciaDigito: "5",
  conta: "",
  contaDigito: "1",
  tipoConta: "CC",
  valor: 0,
  dataCredito,
  identificador: "",
  ...f,
});
const favorecidos = [
  favorecido({ nome: "Maria Exemplo", cpf: "529.982.247-25", conta: "1203", valor: 3260.12, identificador: "aaaaaaaa-0000-0000-0" }),
  favorecido({ nome: "Joao Teste", cpf: "111.444.777-35", conta: "79750", valor: 2637.33, identificador: "bbbbbbbb-0000-0000-0" }),
  favorecido({ nome: "Ana Exemplo", cpf: "390.533.447-05", conta: "140190", valor: 486.3, identificador: "cccccccc-0000-0000-0" }),
];
const remessa: RemessaCNAB = {
  empresa: {
    cnpj: "12.345.678/0001-95",
    razaoSocial: "Instituto de Exemplo",
    banco: "001",
    nomeBanco: "Banco do Brasil",
    agencia: "1234",
    agenciaDigito: "5",
    conta: "98765",
    contaDigito: "X",
    convenio: "123456",
    endereco: { logradouro: "Rua A", cidade: "Boa Vista", cep: "69300000", uf: "RR" },
  },
  favorecidos,
  numeroRemessa: 7,
  dataGeracao: new Date(2033, 0, 28, 10, 0, 0),
};

const trocar = (l: string, inicio: number, texto: string) => l.slice(0, inicio - 1) + texto + l.slice(inicio - 1 + texto.length);

/** Remessa → retorno: ocorrências por crédito, na ordem; `semSeuNumero` apaga o 074-093 (arquivo de outro sistema). */
function retorno(ocorrencias: string[], opcoes: { previa?: boolean; semSeuNumero?: boolean } = {}): string {
  let k = 0;
  return gerarFolhaBbCnab240(remessa)
    .split("\r\n")
    .map((l) => {
      if (l[7] === "0") {
        l = trocar(l, 143, "2");
        return opcoes.previa ? trocar(l, 181, "PREVIA") : l;
      }
      if (l[7] === "3" && l[13] === "A") {
        if (opcoes.semSeuNumero) l = trocar(l, 74, " ".repeat(20));
        return trocar(l, 231, (ocorrencias[k++] ?? "").padEnd(10));
      }
      return l;
    })
    .join("\r\n");
}

const creditos: CreditoDaRemessa[] = favorecidos.map((f, i) => ({
  identificador: f.identificador,
  ficha_id: `ficha-${i}`,
  nome: f.nome,
  cpf: f.cpf,
  valor: f.valor,
}));

describe("retorno da remessa da folha", () => {
  it("casa pelo seu número e separa agendado, pago e recusado", () => {
    const texto = retorno(["BD", "00", "AT"], { previa: true });
    const lido = lerCnab240(texto);
    const casado = casarRetorno(lido, creditos);
    expect(ehRetornoPrevia(texto)).toBe(true);
    expect(casado.itens.map((i) => [i.credito?.ficha_id, i.situacao])).toEqual([
      ["ficha-0", "agendado"],
      ["ficha-1", "pago"],
      ["ficha-2", "rejeitado"],
    ]);
    expect(casado.itens[2].motivo).toMatch(/^AT: .*inscrição do favorecido/);
    expect(casado.resumo.agendado).toEqual({ quantidade: 1, valor: 3260.12 });
    expect(casado.naoRetornados).toEqual([]);
    expect(problemasRetorno(lido, casado, "000123456")).toEqual([]);
  });

  it("sem seu número, casa pelo CPF e o valor; o que sobra fica de fora", () => {
    const texto = retorno(["BD", "BD", "AN"], { semSeuNumero: true });
    const lido = lerCnab240(texto);
    const casado = casarRetorno(lido, [creditos[1], { ...creditos[0], valor: 1 }]);
    expect(ehRetornoPrevia(texto)).toBe(false);
    expect(casado.itens.map((i) => i.credito?.ficha_id ?? null)).toEqual([null, "ficha-1", null]);
    expect(casado.semCredito).toBe(2);
    expect(casado.naoRetornados.map((c) => c.ficha_id)).toEqual(["ficha-0"]);
  });

  it("recusa remessa no lugar de retorno, convênio de outra conta e retorno de outra remessa", () => {
    const daRemessa = lerCnab240(gerarFolhaBbCnab240(remessa));
    expect(problemasRetorno(daRemessa, casarRetorno(daRemessa, creditos), "123456")[0]).toMatch(/não é um retorno/);
    const lido = lerCnab240(retorno(["BD", "BD", "BD"]));
    expect(problemasRetorno(lido, casarRetorno(lido, creditos), "654321")[0]).toMatch(/convênio 123456/);
    expect(problemasRetorno(lido, casarRetorno(lido, []), "123456")[0]).toMatch(/Nenhum crédito/);
  });
});
