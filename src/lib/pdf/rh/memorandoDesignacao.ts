/**
 * Memorando de Designação de Responsável por Unidade Local
 * Gera um PDF de memorando oficial informando a designação do servidor
 * como responsável pela unidade local.
 */
import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TIPO_ATO_LABELS } from "@/types/unidadesLocais";

interface DadosMemorandoDesignacao {
  servidorNome: string;
  cargo: string;
  unidadeNome: string;
  unidadeMunicipio: string;
  tipoAto: string;
  numeroAto: string;
  dataPublicacao: string;
  dataInicio: string;
}

export function generateMemorandoDesignacao(dados: DadosMemorandoDesignacao) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 25;
  const contentWidth = pageWidth - margin * 2;
  let y = 30;

  // ===== CABEÇALHO =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("GOVERNO DO ESTADO DE RORAIMA", pageWidth / 2, y, { align: "center" });
  y += 6;
  doc.setFontSize(10);
  doc.text("INSTITUTO DE DESPORTO E JUVENTUDE DE RORAIMA - IDJUV", pageWidth / 2, y, { align: "center" });
  y += 10;

  // Linha separadora
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  // ===== TÍTULO =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("MEMORANDO DE DESIGNAÇÃO", pageWidth / 2, y, { align: "center" });
  y += 6;
  doc.setFontSize(10);
  doc.text("RESPONSÁVEL POR UNIDADE LOCAL", pageWidth / 2, y, { align: "center" });
  y += 15;

  // ===== DADOS DO ATO =====
  const tipoAtoLabel = TIPO_ATO_LABELS[dados.tipoAto as keyof typeof TIPO_ATO_LABELS] || dados.tipoAto;
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  const dataPublicacaoFormatada = formatDateSafe(dados.dataPublicacao);
  const dataInicioFormatada = formatDateSafe(dados.dataInicio);

  doc.text(`Referência: ${tipoAtoLabel} nº ${dados.numeroAto}`, margin, y);
  y += 6;
  doc.text(`Data de Publicação: ${dataPublicacaoFormatada}`, margin, y);
  y += 12;

  // ===== CORPO DO MEMORANDO =====
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const corpo = [
    `Pelo presente memorando, comunicamos que, em conformidade com a ${tipoAtoLabel} nº ${dados.numeroAto}, publicada em ${dataPublicacaoFormatada}, o(a) servidor(a):`,
  ];

  for (const linha of corpo) {
    const lines = doc.splitTextToSize(linha, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 6;
  }

  y += 6;

  // Dados do servidor em destaque
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(dados.servidorNome.toUpperCase(), pageWidth / 2, y, { align: "center" });
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(dados.cargo, pageWidth / 2, y, { align: "center" });
  y += 12;

  // Continuação do texto
  const texto2 = `foi designado(a) como RESPONSÁVEL pela unidade local abaixo descrita, a partir de ${dataInicioFormatada}:`;
  const lines2 = doc.splitTextToSize(texto2, contentWidth);
  doc.text(lines2, margin, y);
  y += lines2.length * 6 + 8;

  // Dados da unidade em destaque
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(dados.unidadeNome.toUpperCase(), pageWidth / 2, y, { align: "center" });
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(`Município: ${dados.unidadeMunicipio}`, pageWidth / 2, y, { align: "center" });
  y += 14;

  // Responsabilidades
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("DAS RESPONSABILIDADES:", margin, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const responsabilidades = [
    "I - Zelar pela conservação e manutenção das instalações, equipamentos e bens patrimoniais da unidade;",
    "II - Controlar e fiscalizar o uso dos espaços e materiais sob sua responsabilidade;",
    "III - Reportar imediatamente à Diretoria competente qualquer irregularidade ou necessidade de manutenção;",
    "IV - Manter atualizado o inventário de bens patrimoniais da unidade;",
    "V - Garantir o cumprimento das normas e regras de uso do espaço;",
    "VI - Responder pelo patrimônio público sob sua guarda, nos termos da legislação vigente.",
  ];

  for (const item of responsabilidades) {
    const itemLines = doc.splitTextToSize(item, contentWidth - 5);
    doc.text(itemLines, margin + 5, y);
    y += itemLines.length * 5 + 2;
  }

  y += 10;

  // Parágrafo final
  const textoFinal = "O presente memorando formaliza a designação e as responsabilidades do servidor acima identificado, devendo o mesmo tomar ciência e assinar o termo abaixo.";
  const linesFinal = doc.splitTextToSize(textoFinal, contentWidth);
  doc.text(linesFinal, margin, y);
  y += linesFinal.length * 6 + 15;

  // Data e local
  const hoje = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  doc.text(`Boa Vista/RR, ${hoje}.`, pageWidth / 2, y, { align: "center" });
  y += 30;

  // Assinaturas
  doc.setLineWidth(0.3);
  const sigWidth = 70;
  const sig1X = margin + 5;
  const sig2X = pageWidth - margin - sigWidth - 5;

  doc.line(sig1X, y, sig1X + sigWidth, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Autoridade Concedente", sig1X + sigWidth / 2, y + 5, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text("IDJUV", sig1X + sigWidth / 2, y + 10, { align: "center" });

  doc.line(sig2X, y, sig2X + sigWidth, y);
  doc.setFont("helvetica", "bold");
  doc.text("Servidor(a) Designado(a)", sig2X + sigWidth / 2, y + 5, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const nomeAbreviado = dados.servidorNome.length > 35
    ? dados.servidorNome.substring(0, 33) + "..."
    : dados.servidorNome;
  doc.text(nomeAbreviado, sig2X + sigWidth / 2, y + 10, { align: "center" });

  // Salvar
  const nomeArquivo = `memorando_designacao_${dados.servidorNome.split(" ")[0].toLowerCase()}_${dados.unidadeNome.split(" ")[0].toLowerCase()}.pdf`;
  doc.save(nomeArquivo);
}

function formatDateSafe(dateStr: string): string {
  try {
    return format(new Date(dateStr + "T12:00:00"), "dd/MM/yyyy");
  } catch {
    return dateStr;
  }
}
