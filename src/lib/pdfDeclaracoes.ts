/**
 * Gerador de Declarações Oficiais (PDF)
 * 
 * PADRONIZAÇÃO: Usa o sistema institucional (pdfInstitucional.ts)
 * - Declaração de Não Acumulação de Cargos
 * - Declaração de Bens e Valores
 */
import { jsPDF } from "jspdf";
import {
  criarDocumentoInstitucional,
  finalizarDocumentoInstitucional,
  CORES_INSTITUCIONAIS,
  MARGENS,
  ConfiguracaoDocumento,
} from "./pdfInstitucional";

/**
 * Desenha linha para assinatura
 */
function desenharLinhaAssinatura(doc: jsPDF, y: number, label: string): number {
  doc.setDrawColor(
    CORES_INSTITUCIONAIS.bordaMedia.r,
    CORES_INSTITUCIONAIS.bordaMedia.g,
    CORES_INSTITUCIONAIS.bordaMedia.b
  );
  doc.setLineWidth(0.3);
  doc.line(MARGENS.esquerda, y, 210 - MARGENS.direita, y);
  
  y += 4;
  doc.setFontSize(8);
  doc.setTextColor(
    CORES_INSTITUCIONAIS.textoClaro.r,
    CORES_INSTITUCIONAIS.textoClaro.g,
    CORES_INSTITUCIONAIS.textoClaro.b
  );
  doc.text(label, 105, y, { align: "center" });
  
  return y + 10;
}

/**
 * Gera Declaração de Não Acumulação de Cargos
 */
export async function gerarDeclaracaoNaoAcumulacao(): Promise<jsPDF> {
  const config: ConfiguracaoDocumento = {
    titulo: "DECLARAÇÃO DE NÃO ACUMULAÇÃO DE CARGOS",
    variante: "claro",
    mostrarRodape: true,
    mostrarPaginacao: false,
  };

  const { doc, yInicial } = await criarDocumentoInstitucional(config);
  let y = yInicial + 5;

  const larguraUtil = 210 - MARGENS.esquerda - MARGENS.direita;

  doc.setFontSize(11);
  doc.setTextColor(
    CORES_INSTITUCIONAIS.textoEscuro.r,
    CORES_INSTITUCIONAIS.textoEscuro.g,
    CORES_INSTITUCIONAIS.textoEscuro.b
  );
  doc.setFont("helvetica", "normal");

  const texto1 = `Eu, ______________________________________________________________, portador(a) do RG nº __________________, órgão expedidor __________, CPF nº ___________________________, DECLARO, para os devidos fins e sob as penas da lei, que:`;

  const linhas1 = doc.splitTextToSize(texto1, larguraUtil);
  doc.text(linhas1, MARGENS.esquerda, y);
  y += linhas1.length * 6 + 10;

  // Opção 1
  doc.setFont("helvetica", "bold");
  doc.text("(    )", MARGENS.esquerda, y);
  doc.setFont("helvetica", "normal");
  const opcao1 = "NÃO exerço outro cargo, emprego ou função pública em qualquer esfera de governo (Federal, Estadual ou Municipal), seja da administração direta ou indireta.";
  const linhasOpcao1 = doc.splitTextToSize(opcao1, larguraUtil - 15);
  doc.text(linhasOpcao1, MARGENS.esquerda + 15, y);
  y += linhasOpcao1.length * 6 + 8;

  // Opção 2
  doc.setFont("helvetica", "bold");
  doc.text("(    )", MARGENS.esquerda, y);
  doc.setFont("helvetica", "normal");
  const opcao2 = "EXERÇO outro cargo, emprego ou função pública, conforme especificado abaixo, sendo esta acumulação PERMITIDA pela Constituição Federal:";
  const linhasOpcao2 = doc.splitTextToSize(opcao2, larguraUtil - 15);
  doc.text(linhasOpcao2, MARGENS.esquerda + 15, y);
  y += linhasOpcao2.length * 6 + 10;

  // Campos para preenchimento
  const campos = [
    "Órgão/Entidade: _______________________________________________________________",
    "Cargo/Função: ________________________________________________________________",
    "Carga Horária: ________________________  Horário: _____________________________",
  ];

  campos.forEach((campo) => {
    doc.text(campo, MARGENS.esquerda + 10, y);
    y += 8;
  });

  y += 10;

  const texto2 = `Declaro ainda estar ciente de que a acumulação ilegal de cargos é passível de demissão, nos termos da legislação vigente, bem como de responsabilização civil e criminal.`;
  const linhas2 = doc.splitTextToSize(texto2, larguraUtil);
  doc.text(linhas2, MARGENS.esquerda, y);
  y += linhas2.length * 6 + 10;

  const texto3 = `Comprometo-me a comunicar imediatamente ao setor de Recursos Humanos qualquer alteração na situação aqui declarada.`;
  const linhas3 = doc.splitTextToSize(texto3, larguraUtil);
  doc.text(linhas3, MARGENS.esquerda, y);
  y += linhas3.length * 6 + 20;

  // Local e data
  doc.text("Boa Vista - RR, _______ de _________________________ de ____________.", MARGENS.esquerda, y);
  y += 25;

  // Assinatura
  y = desenharLinhaAssinatura(doc, y, "Assinatura do(a) Declarante");

  finalizarDocumentoInstitucional(doc, config);

  return doc;
}

/**
 * Gera Declaração de Bens e Valores
 */
export async function gerarDeclaracaoBensValores(): Promise<jsPDF> {
  const config: ConfiguracaoDocumento = {
    titulo: "DECLARAÇÃO DE BENS E VALORES",
    variante: "claro",
    mostrarRodape: true,
    mostrarPaginacao: false,
  };

  const { doc, yInicial } = await criarDocumentoInstitucional(config);
  let y = yInicial + 5;

  const larguraUtil = 210 - MARGENS.esquerda - MARGENS.direita;

  doc.setFontSize(11);
  doc.setTextColor(
    CORES_INSTITUCIONAIS.textoEscuro.r,
    CORES_INSTITUCIONAIS.textoEscuro.g,
    CORES_INSTITUCIONAIS.textoEscuro.b
  );
  doc.setFont("helvetica", "normal");

  const texto1 = `Eu, ______________________________________________________________, portador(a) do RG nº __________________, órgão expedidor __________, CPF nº ___________________________, em atendimento ao disposto no Art. 13 da Lei nº 8.429/1992 (Lei de Improbidade Administrativa), DECLARO que possuo os seguintes bens e valores:`;

  const linhas1 = doc.splitTextToSize(texto1, larguraUtil);
  doc.text(linhas1, MARGENS.esquerda, y);
  y += linhas1.length * 6 + 10;

  // Opção 1
  doc.setFont("helvetica", "bold");
  doc.text("(    )", MARGENS.esquerda, y);
  doc.setFont("helvetica", "normal");
  doc.text("NÃO possuo bens ou valores a declarar.", MARGENS.esquerda + 15, y);
  y += 12;

  // Opção 2
  doc.setFont("helvetica", "bold");
  doc.text("(    )", MARGENS.esquerda, y);
  doc.setFont("helvetica", "normal");
  doc.text("POSSUO os seguintes bens e valores:", MARGENS.esquerda + 15, y);
  y += 12;

  // Tabela de bens
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");

  // Cabeçalho da tabela
  doc.setFillColor(
    CORES_INSTITUCIONAIS.fundoClaro.r,
    CORES_INSTITUCIONAIS.fundoClaro.g,
    CORES_INSTITUCIONAIS.fundoClaro.b
  );
  doc.rect(MARGENS.esquerda, y - 4, larguraUtil, 8, "F");
  doc.text("DESCRIÇÃO DO BEM/VALOR", MARGENS.esquerda + 2, y);
  doc.text("VALOR (R$)", 160, y);
  y += 6;

  // Linhas da tabela
  doc.setFont("helvetica", "normal");
  doc.setDrawColor(
    CORES_INSTITUCIONAIS.bordaClara.r,
    CORES_INSTITUCIONAIS.bordaClara.g,
    CORES_INSTITUCIONAIS.bordaClara.b
  );
  for (let i = 0; i < 8; i++) {
    doc.line(MARGENS.esquerda, y, 210 - MARGENS.direita, y);
    y += 8;
  }
  doc.line(MARGENS.esquerda, y, 210 - MARGENS.direita, y);

  // Linha vertical separadora
  doc.line(155, y - 64, 155, y);

  y += 10;

  doc.setFontSize(11);
  const texto2 = `Declaro, sob as penas da lei, que as informações acima são verdadeiras e que me comprometo a atualizar esta declaração sempre que houver alteração patrimonial relevante e ao final do exercício do cargo.`;
  const linhas2 = doc.splitTextToSize(texto2, larguraUtil);
  doc.text(linhas2, MARGENS.esquerda, y);
  y += linhas2.length * 6 + 15;

  // Local e data
  doc.text("Boa Vista - RR, _______ de _________________________ de ____________.", MARGENS.esquerda, y);
  y += 25;

  // Assinatura
  y = desenharLinhaAssinatura(doc, y, "Assinatura do(a) Declarante");

  finalizarDocumentoInstitucional(doc, config);

  return doc;
}
