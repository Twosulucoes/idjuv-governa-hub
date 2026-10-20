import { describe, expect, it } from "vitest";
import { creditosPensao, PREFIXO_ITEM_PENSAO, type PensaoCadastro } from "@/lib/bancario/pensaoRemessa";

// Dados fictícios
const pensao = (p: Partial<PensaoCadastro>): PensaoCadastro => ({
  id: "p1",
  servidor_id: "s1",
  beneficiario_nome: "Ana Exemplo",
  beneficiario_cpf: "390.533.447-05",
  banco_codigo: "001",
  banco_agencia: "1234-5",
  banco_conta: "98765-X",
  banco_tipo_conta: "corrente",
  ...p,
});
const item = (id: string, nome: string, valor: number, tipo = "desconto") => ({
  id,
  descricao: PREFIXO_ITEM_PENSAO + nome,
  tipo,
  valor,
});
const credito = new Date(2026, 9, 30);

describe("creditosPensao", () => {
  it("paga cada desconto de pensão ao beneficiário com o banco do cadastro", () => {
    const r = creditosPensao(
      [{ id: "f1", servidor_id: "s1", itens: [item("i1", "Ana Exemplo", 2331.86), { id: "i2", descricao: "IRRF", tipo: "desconto", valor: 810.4 }] }],
      [pensao({})],
      credito,
    );
    expect(r.favorecidos).toEqual([
      expect.objectContaining({
        nome: "Ana Exemplo",
        banco: "001",
        agencia: "1234",
        agenciaDigito: "5",
        conta: "98765",
        contaDigito: "X",
        tipoConta: "CC",
        valor: 2331.86,
        identificador: "i1",
        dataCredito: credito,
      }),
    ]);
    expect(r.semBanco).toEqual([]);
    expect(r.semCadastro).toEqual([]);
  });

  it("deixa fora quem não tem banco ou cadastro e recusa cadastro em dobro", () => {
    const r = creditosPensao(
      [
        { id: "f1", servidor_id: "s1", itens: [item("i1", "Ana Exemplo", 100)] },
        { id: "f2", servidor_id: "s2", itens: [item("i2", "Bia Exemplo", 50), item("i3", "Caio Exemplo", 30)] },
        { id: "f3", servidor_id: "s3", itens: [item("i4", "Duda Exemplo", 20)] },
      ],
      [
        pensao({ id: "p1", banco_conta: null }),
        pensao({ id: "p2", servidor_id: "s2", beneficiario_nome: "Bia Exemplo" }),
        pensao({ id: "p3", servidor_id: "s3", beneficiario_nome: "Duda Exemplo" }),
        pensao({ id: "p4", servidor_id: "s3", beneficiario_nome: "Duda Exemplo" }),
      ],
      credito,
    );
    expect(r.favorecidos.map((f) => f.nome)).toEqual(["Bia Exemplo"]);
    expect(r.semBanco).toEqual(["Ana Exemplo"]);
    expect(r.semCadastro).toEqual(["Caio Exemplo"]);
    expect(r.duplicados).toEqual(["Duda Exemplo"]);
  });

  it("não confunde a pensão de outro servidor nem provento com o mesmo nome", () => {
    const r = creditosPensao(
      [{ id: "f1", servidor_id: "s9", itens: [item("i1", "Ana Exemplo", 100), item("i2", "Ana Exemplo", 100, "provento")] }],
      [pensao({})],
      credito,
    );
    expect(r.favorecidos).toEqual([]);
    expect(r.semCadastro).toEqual(["Ana Exemplo"]);
  });
});
