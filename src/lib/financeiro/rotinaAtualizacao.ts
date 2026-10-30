/**
 * Rotina de atualização do Financeiro: o que baixar do FIPLAN (e do banco), de quanto em quanto tempo, onde importar
 * e se está em dia. O sistema não entra no FIPLAN; a tela /financeiro/atualizar guia quem baixa os arquivos.
 * Spec: docs/superpowers/specs/2026-10-23-rotina-atualizacao-financeiro-design.md
 */

export type FrequenciaRotina = "semanal" | "mensal" | "anual" | "sob_demanda";
export type SituacaoRotina = "em_dia" | "atrasado" | "nunca" | "sob_demanda";

export interface ItemRotina {
  /** Igual a `importacoes.tipo` quando há importador; "conciliacao" para o fechamento do mês */
  id: string;
  titulo: string;
  serve: string;
  frequencia: FrequenciaRotina;
  /** Passos no FIPLAN (ou no banco), na ordem */
  passos: string[];
  /** Id do importador, quando o arquivo entra pelo assistente de importação (aberto na própria tela) */
  importador?: string;
  /** Para onde o botão leva */
  destino: string;
  rotuloBotao: string;
}

export const ROTULOS_FREQUENCIA: Record<FrequenciaRotina, string> = {
  semanal: "Toda semana",
  mensal: "Todo mês",
  anual: "Uma vez por ano",
  sob_demanda: "Depois de cada remessa",
};

/** O assistente abre na própria tela Atualizar dados, sem sair do Financeiro */
const aqui = (importador: string) => `/financeiro/atualizar?importador=${importador}`;

export const ROTINA_FINANCEIRO: ItemRotina[] = [
  {
    id: "qdd_fiplan",
    titulo: "QDD do FIPLAN",
    serve: "Dotações: autorizado, empenhado, liquidado, pago, bloqueado e PED de cada natureza. Base do painel e do QDD.",
    frequencia: "semanal",
    passos: [
      "No FIPLAN, abra o relatório \"Quadro de Detalhamento da Despesa - QDD\".",
      "Escolha o exercício e a UO 17302.",
      "Gere o relatório e salve em PDF.",
    ],
    importador: "qdd_fiplan",
    destino: aqui("qdd_fiplan"),
    rotuloBotao: "Importar agora",
  },
  {
    id: "empenhos_fip614",
    titulo: "FIP 614 – Situação de Empenho",
    serve: "Empenhos, liquidações, pagamentos e estornos. Alimenta a fila de pagamento do painel.",
    frequencia: "semanal",
    passos: [
      "Importe o QDD antes, para os empenhos ligarem à dotação.",
      "No FIPLAN, abra Relatórios > FIP 614 - Situação de Empenho.",
      "Escolha o exercício e a UG 17302.0001.",
      "Salve em Excel (traz a dotação completa e o histórico inteiro).",
    ],
    importador: "empenhos_fip614",
    destino: aqui("empenhos_fip614"),
    rotuloBotao: "Importar agora",
  },
  {
    id: "peds_fiplan",
    titulo: "PEDs do FIPLAN",
    serve: "Pedidos de empenho com processo e situação. Liga cada PED ao processo de contratação, na fase financeira.",
    frequencia: "semanal",
    passos: [
      "Importe o QDD antes, para os PEDs ligarem à dotação.",
      "No FIPLAN, abra \"Consultar Pedido de Empenho da Despesa (PED)\".",
      "Filtre pelo exercício e pela unidade orçamentária.",
      "Exporte em Excel.",
    ],
    importador: "peds_fiplan",
    destino: aqui("peds_fiplan"),
    rotuloBotao: "Importar agora",
  },
  {
    id: "diarias_fiplan",
    titulo: "FIP 002 – Demonstrativo de Diárias",
    serve: "Diárias pagas, com o período da viagem e se o servidor prestou contas. Alimenta a tela Diárias.",
    frequencia: "semanal",
    passos: [
      "No FIPLAN, digite \"FIP 002\" na caixa Pesquise menu (fica em Relatórios > Financeiro/Contábil > Operacionais > Despesa – Diárias/SDF).",
      "Em Campo, adicione \"Exercício\" igual a o ano (ex.: 2026).",
      "Adicione \"Código da Unidade Orçamentária\" igual a 17302.0001.",
      "Em Tipo de Relatório, escolha xls e clique em Consultar.",
    ],
    importador: "diarias_fiplan",
    destino: aqui("diarias_fiplan"),
    rotuloBotao: "Importar agora",
  },
  {
    id: "arquivo_bancario",
    titulo: "Retorno do banco (OBN600 / CNAB 240)",
    serve: "Confirma no sistema os pagamentos que o banco efetivou ou recusou.",
    frequencia: "sob_demanda",
    passos: [
      "Depois de enviar uma remessa, baixe do banco o arquivo de retorno dela.",
      "Importe o arquivo do jeito que veio, sem abrir nem renomear.",
    ],
    importador: "arquivo_bancario",
    destino: aqui("arquivo_bancario"),
    rotuloBotao: "Importar agora",
  },
  {
    id: "conciliacao",
    titulo: "Conciliação do mês",
    serve: "Quadro da SEFAZ: razão do FIPLAN contra o extrato do banco e do fundo. Conta como em dia até o dia 10 do mês seguinte.",
    frequencia: "mensal",
    passos: [
      "No FIPLAN, gere o FIP 630 (Razão Analítico) da conta, do mês.",
      "No FIPLAN, em Documentos > Transmissão Eletrônica, gere o FIP 103 (Relação de Pagamentos) do mês.",
      "No banco, baixe o extrato do mês em OFX e o extrato do fundo em PDF.",
      "Na tela de Conciliação, aba Fechamento mensal, envie os quatro arquivos e feche o mês.",
    ],
    destino: "/financeiro/conciliacao",
    rotuloBotao: "Abrir a conciliação",
  },
  {
    id: "classificadores_fiplan",
    titulo: "Tabelas do FIPLAN",
    serve: "Fontes, elementos, programas e ações do exercício. Sem elas, as dotações novas ficam sem nome.",
    frequencia: "anual",
    passos: [
      "No começo do exercício, exporte do FIPLAN as consultas das tabelas de classificação da despesa.",
      "Importe uma tabela por vez, escolhendo o exercício.",
    ],
    importador: "classificadores_fiplan",
    destino: aqui("classificadores_fiplan"),
    rotuloBotao: "Importar agora",
  },
];

/** Semanal com mais de 7 dias está atrasado (o mesmo prazo do aviso do painel) */
const DIAS_SEMANAL = 7;
/** Até este dia do mês, ainda dá para fechar o mês retrasado sem atraso */
const DIA_LIMITE_CONCILIACAO = 10;
const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Em dia, atrasado, nunca importado ou sob demanda.
 * `ultima`: data e hora da última importação ou, no mensal, a competência fechada mais recente (AAAA-MM-01).
 */
export function situacaoDoItem(
  frequencia: FrequenciaRotina,
  ultima: string | null,
  hoje: Date,
  { encerrado = false }: { encerrado?: boolean } = {},
): SituacaoRotina {
  if (frequencia === "sob_demanda") return "sob_demanda";
  if (!ultima) return "nunca";
  // Exercício encerrado não envelhece mais
  if (encerrado || frequencia === "anual") return "em_dia";

  if (frequencia === "semanal") {
    const dias = Math.floor((hoje.getTime() - new Date(ultima).getTime()) / DIA_MS);
    return dias > DIAS_SEMANAL ? "atrasado" : "em_dia";
  }

  // Mensal: o mês anterior precisa estar fechado; até o dia 10 vale o retrasado
  const [ano, mes] = ultima.split("-").map(Number);
  const recuo = hoje.getDate() < DIA_LIMITE_CONCILIACAO ? 2 : 1;
  const limite = hoje.getFullYear() * 12 + hoje.getMonth() - recuo;
  return ano * 12 + (mes - 1) >= limite ? "em_dia" : "atrasado";
}

/** "2 de 4 em dia": o que é sob demanda não entra na conta */
export function resumirRotina(situacoes: SituacaoRotina[]): { emDia: number; comPrazo: number } {
  const comPrazo = situacoes.filter((s) => s !== "sob_demanda");
  return { emDia: comPrazo.filter((s) => s === "em_dia").length, comPrazo: comPrazo.length };
}
