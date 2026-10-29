import { describe, expect, it } from "vitest";
import { interpretarPedsFiplan, paraContratoPed, paraValorBR } from "./pedsFiplanParser";

// Dados fictícios no formato do relatório "Consultar Pedido de Empenho da Despesa (PED)" do FIPLAN
const CABECALHO = [
  "Exercício", "Nº PED", "Nº PED Estorno/Estornado", "Nº EMP", "Nº SDF", "Nº NOBLIST", "Nº DOTLIST", "Nº OS", "Nº Processo",
  "Valor PED", "Situação", "UO", "Nome da Unidade Orçamentária", "UG", "Nome da Unidade Gestora", "Data Solicitação",
  "Data Criação", "Tipo Empenho", "Dotação Orçamentária", "Nº CAC", "Licitação", "Histórico", "Data Autorização", "Credor",
  "Nome do Credor", "LIB CEGEP", "Data de liberação CEGEP", "Usuário CEGEP",
];
const DOTACAO = "99999.0001.08.244.030.2544.9900.33903900.1500.0000.6.1";

function ped(over: Partial<Record<string, string>> = {}): string[] {
  const v: Record<string, string> = {
    ex: "2099", ped: "99999.0001.99.00001-1", est: "", emp: "", proc: "000885/99-92", valor: "252.800,00",
    sit: "Pedido (PED) autorizado", uo: "99999", sol: "15/09/2099", cri: "15/09/2099", tipo: "Estimativo",
    dot: DOTACAO, lic: "Pregão Eletrônico", hist: "Locação de veículos", aut: "15/09/2099", cred: "2001.00001-1",
    nome: "EMPRESA DE TESTE", ...over,
  };
  return [v.ex, v.ped, v.est, v.emp, "", "", "", "", v.proc, v.valor, v.sit, v.uo, "Instituto de teste", "0001",
    "UG de teste", v.sol, v.cri, v.tipo, v.dot, "", v.lic, v.hist, v.aut, v.cred, v.nome, "Sim", v.aut, "Usuário"];
}

const relatorio = (...linhas: string[][]) => [
  [""], ["Consultar Pedido de Empenho da Despesa (PED)"], ["Critérios utilizados na consulta:"],
  ["*Exercício igual a 2099"], ["cdUnidadeOrcamentaria igual a 99999"], [""], CABECALHO, ...linhas,
];

const erros = (r: ReturnType<typeof interpretarPedsFiplan>) => r.problemas.filter((p) => p.gravidade === "erro").map((p) => p.mensagem);

describe("paraValorBR", () => {
  it("lê o valor no formato do FIPLAN", () => {
    expect(paraValorBR("4.251.000,00")).toBe(4251000);
    expect(paraValorBR("1.099,8")).toBe(1099.8);
    expect(paraValorBR(36430)).toBe(36430);
    expect(paraValorBR("R$ 10")).toBeNaN();
  });
});

describe("interpretarPedsFiplan", () => {
  it("lê o exercício, o PED autorizado e converte o processo para o nº SEI", () => {
    const r = interpretarPedsFiplan(relatorio(ped()));
    expect(erros(r)).toEqual([]);
    expect(r.parametros.exercicio).toBe(2099);
    expect(r.linhas).toHaveLength(1);
    expect(r.linhas[0]).toMatchObject({
      numero: "99999.0001.99.00001-1",
      processo_fiplan: "000885/99-92",
      processo_sei: "99999.000885/2099.92",
      valor: 252800,
      estorno: false,
      data_autorizacao: "2099-09-15",
      dotacao: DOTACAO,
      credor_nome: "EMPRESA DE TESTE",
    });
    expect(r.cabecalho["PEDs autorizados sem empenho"]).toContain("1 (");
  });

  it("marca o documento de estorno e mantém o mesmo PED com estornos diferentes", () => {
    const r = interpretarPedsFiplan(
      relatorio(
        ped({ ped: "99999.0001.99.00019-4", est: "99999.0001.99.00066-6", emp: "99999.0001.99.00010-0", sit: "Pedido (PED) estornado (estorno parcial) - estorno do empenho" }),
        ped({ ped: "99999.0001.99.00019-4", est: "99999.0001.99.00074-7", emp: "99999.0001.99.00010-0", sit: "Pedido (PED) estornado (estorno parcial) - estorno do empenho" }),
        ped({ ped: "99999.0001.99.00066-6", est: "99999.0001.99.00019-4", sit: "Documento de Estorno", aut: "" }),
        ped({ ped: "99999.0001.99.00020-8", emp: "99999.0001.99.00011-9", sit: "Pedido (PED) empenhado" }),
      ),
    );
    expect(erros(r)).toEqual([]);
    expect(r.linhas.map((l) => l.estorno)).toEqual([false, false, true, false]);
    expect(r.linhas[2].data_autorizacao).toBeNull();
    expect(r.cabecalho["PEDs no arquivo"]).toBe("3");
    expect(r.cabecalho["PEDs autorizados sem empenho"]).toContain("0 (");
  });

  it("acusa PED fora do padrão e valor inválido, sem parar as outras linhas", () => {
    const r = interpretarPedsFiplan(relatorio(ped({ ped: "123" }), ped({ ped: "99999.0001.99.00002-1", valor: "abc" }), ped({ ped: "99999.0001.99.00003-1" })));
    expect(erros(r)).toHaveLength(2);
    expect(r.linhas.map((l) => l.numero)).toEqual(["99999.0001.99.00003-1"]);
  });

  it("recusa outro relatório e relatório sem cabeçalho", () => {
    expect(erros(interpretarPedsFiplan([["Consultar Função de Governo"], ["Código da Função"]]))[0]).toMatch(/não é o relatório/);
    expect(erros(interpretarPedsFiplan([["Consultar Pedido de Empenho da Despesa (PED)"], ["sem cabeçalho"]]))[0]).toMatch(/cabeçalho/);
  });

  it("manda para a RPC sem a linha da planilha", () => {
    const [linha] = interpretarPedsFiplan(relatorio(ped())).linhas;
    expect(paraContratoPed(linha)).not.toHaveProperty("linhaPlanilha");
    expect(paraContratoPed(linha)).toHaveProperty("indice", 0);
  });
});
