import { jsPDF } from "jspdf";

const CORES = {
  primaria: [0, 103, 71] as [number, number, number],
  texto: [33, 33, 33] as [number, number, number],
  cinza: [100, 100, 100] as [number, number, number],
};

const MARGEM = 25;
const LARGURA_UTIL = 160;

function desenharCabecalho(doc: jsPDF, titulo: string): number {
  let y = 30;

  // Título do Governo
  doc.setFontSize(11);
  doc.setTextColor(...CORES.texto);
  doc.setFont("helvetica", "bold");
  doc.text("GOVERNO DO ESTADO DE RORAIMA", 105, y, { align: "center" });

  y += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Instituto de Desporto, Juventude e Lazer - IDJUV", 105, y, { align: "center" });

  y += 15;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...CORES.primaria);
  doc.text(titulo, 105, y, { align: "center" });

  y += 5;
  doc.setDrawColor(...CORES.primaria);
  doc.setLineWidth(0.5);
  doc.line(MARGEM, y, 210 - MARGEM, y);

  return y + 15;
}

function desenharLinhaAssinatura(doc: jsPDF, y: number, label: string): number {
  doc.setDrawColor(...CORES.cinza);
  doc.setLineWidth(0.3);
  doc.line(MARGEM, y, 210 - MARGEM, y);
  y += 4;
  doc.setFontSize(8);
  doc.setTextColor(...CORES.cinza);
  doc.text(label, 105, y, { align: "center" });
  return y + 10;
}

function desenharRodape(doc: jsPDF): void {
  const y = 280;
  doc.setFontSize(7);
  doc.setTextColor(...CORES.cinza);
  doc.text("Documento gerado pelo Sistema IDJUV", 105, y, { align: "center" });
}

export function gerarDeclaracaoNaoAcumulacao(): jsPDF {
  const doc = new jsPDF();

  let y = desenharCabecalho(doc, "DECLARAÇÃO DE NÃO ACUMULAÇÃO DE CARGOS");

  doc.setFontSize(11);
  doc.setTextColor(...CORES.texto);
  doc.setFont("helvetica", "normal");

  const texto1 = `Eu, ______________________________________________________________, portador(a) do RG nº __________________, órgão expedidor __________, CPF nº ___________________________, DECLARO, para os devidos fins e sob as penas da lei, que:`;

  const linhas1 = doc.splitTextToSize(texto1, LARGURA_UTIL);
  doc.text(linhas1, MARGEM, y);
  y += linhas1.length * 6 + 10;

  // Opção 1
  doc.setFont("helvetica", "bold");
  doc.text("(    )", MARGEM, y);
  doc.setFont("helvetica", "normal");
  const opcao1 = "NÃO exerço outro cargo, emprego ou função pública em qualquer esfera de governo (Federal, Estadual ou Municipal), seja da administração direta ou indireta.";
  const linhasOpcao1 = doc.splitTextToSize(opcao1, LARGURA_UTIL - 15);
  doc.text(linhasOpcao1, MARGEM + 15, y);
  y += linhasOpcao1.length * 6 + 8;

  // Opção 2
  doc.setFont("helvetica", "bold");
  doc.text("(    )", MARGEM, y);
  doc.setFont("helvetica", "normal");
  const opcao2 = "EXERÇO outro cargo, emprego ou função pública, conforme especificado abaixo, sendo esta acumulação PERMITIDA pela Constituição Federal:";
  const linhasOpcao2 = doc.splitTextToSize(opcao2, LARGURA_UTIL - 15);
  doc.text(linhasOpcao2, MARGEM + 15, y);
  y += linhasOpcao2.length * 6 + 10;

  // Campos para preenchimento
  const campos = [
    "Órgão/Entidade: _______________________________________________________________",
    "Cargo/Função: ________________________________________________________________",
    "Carga Horária: ________________________  Horário: _____________________________",
  ];

  campos.forEach((campo) => {
    doc.text(campo, MARGEM + 10, y);
    y += 8;
  });

  y += 10;

  const texto2 = `Declaro ainda estar ciente de que a acumulação ilegal de cargos é passível de demissão, nos termos da legislação vigente, bem como de responsabilização civil e criminal.`;
  const linhas2 = doc.splitTextToSize(texto2, LARGURA_UTIL);
  doc.text(linhas2, MARGEM, y);
  y += linhas2.length * 6 + 10;

  const texto3 = `Comprometo-me a comunicar imediatamente ao setor de Recursos Humanos qualquer alteração na situação aqui declarada.`;
  const linhas3 = doc.splitTextToSize(texto3, LARGURA_UTIL);
  doc.text(linhas3, MARGEM, y);
  y += linhas3.length * 6 + 20;

  // Local e data
  doc.text("Boa Vista - RR, _______ de _________________________ de ____________.", MARGEM, y);
  y += 25;

  // Assinatura
  y = desenharLinhaAssinatura(doc, y, "Assinatura do(a) Declarante");

  desenharRodape(doc);

  return doc;
}

export function gerarDeclaracaoBensValores(): jsPDF {
  const doc = new jsPDF();

  let y = desenharCabecalho(doc, "DECLARAÇÃO DE BENS E VALORES");

  doc.setFontSize(11);
  doc.setTextColor(...CORES.texto);
  doc.setFont("helvetica", "normal");

  const texto1 = `Eu, ______________________________________________________________, portador(a) do RG nº __________________, órgão expedidor __________, CPF nº ___________________________, em atendimento ao disposto no Art. 13 da Lei nº 8.429/1992 (Lei de Improbidade Administrativa), DECLARO que possuo os seguintes bens e valores:`;

  const linhas1 = doc.splitTextToSize(texto1, LARGURA_UTIL);
  doc.text(linhas1, MARGEM, y);
  y += linhas1.length * 6 + 10;

  // Opção 1
  doc.setFont("helvetica", "bold");
  doc.text("(    )", MARGEM, y);
  doc.setFont("helvetica", "normal");
  doc.text("NÃO possuo bens ou valores a declarar.", MARGEM + 15, y);
  y += 12;

  // Opção 2
  doc.setFont("helvetica", "bold");
  doc.text("(    )", MARGEM, y);
  doc.setFont("helvetica", "normal");
  doc.text("POSSUO os seguintes bens e valores:", MARGEM + 15, y);
  y += 12;

  // Tabela de bens
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  
  // Cabeçalho da tabela
  doc.setFillColor(240, 240, 240);
  doc.rect(MARGEM, y - 4, LARGURA_UTIL, 8, "F");
  doc.text("DESCRIÇÃO DO BEM/VALOR", MARGEM + 2, y);
  doc.text("VALOR (R$)", 160, y);
  y += 6;

  // Linhas da tabela
  doc.setFont("helvetica", "normal");
  doc.setDrawColor(...CORES.cinza);
  for (let i = 0; i < 8; i++) {
    doc.line(MARGEM, y, 210 - MARGEM, y);
    y += 8;
  }
  doc.line(MARGEM, y, 210 - MARGEM, y);

  // Linha vertical separadora
  doc.line(155, y - 64, 155, y);

  y += 10;

  doc.setFontSize(11);
  const texto2 = `Declaro, sob as penas da lei, que as informações acima são verdadeiras e que me comprometo a atualizar esta declaração sempre que houver alteração patrimonial relevante e ao final do exercício do cargo.`;
  const linhas2 = doc.splitTextToSize(texto2, LARGURA_UTIL);
  doc.text(linhas2, MARGEM, y);
  y += linhas2.length * 6 + 15;

  // Local e data
  doc.text("Boa Vista - RR, _______ de _________________________ de ____________.", MARGEM, y);
  y += 25;

  // Assinatura
  y = desenharLinhaAssinatura(doc, y, "Assinatura do(a) Declarante");

  desenharRodape(doc);

  return doc;
}
