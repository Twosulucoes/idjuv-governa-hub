import jsPDF from "jspdf";
import { formatCPF } from "@/lib/formatters";
import type { PreCadastro } from "@/types/preCadastro";

interface PendenciaItem {
  tipo: "esocial" | "bancaria" | "pessoal" | "opcional";
  campo: string;
  descricao: string;
  obrigatorio: boolean;
}

interface PreCadastroComPendencias {
  preCadastro: PreCadastro;
  pendencias: PendenciaItem[];
  temPendenciaEsocial: boolean;
  temPendenciaBancaria: boolean;
  temPendenciaPessoal: boolean;
  temPendenciaOpcional: boolean;
}

interface StatsData {
  total: number;
  comPendenciaEsocial: number;
  comPendenciaBancaria: number;
  comPendenciaPessoal: number;
  comPendenciaOpcional: number;
  completos: number;
}

const CORES = {
  primaria: [0, 73, 124] as [number, number, number],
  texto: [51, 51, 51] as [number, number, number],
  cinzaClaro: [245, 245, 245] as [number, number, number],
  vermelho: [220, 53, 69] as [number, number, number],
  laranja: [249, 115, 22] as [number, number, number],
  azul: [59, 130, 246] as [number, number, number],
  verde: [34, 197, 94] as [number, number, number],
  roxo: [147, 51, 234] as [number, number, number],
};

function addHeader(doc: jsPDF, titulo: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // Cabeçalho institucional
  doc.setFillColor(...CORES.primaria);
  doc.rect(0, 0, pageWidth, 35, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("IDJUV - Instituto de Desporto e Juventude de Roraima", pageWidth / 2, 12, { align: "center" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(titulo, pageWidth / 2, 22, { align: "center" });

  doc.setFontSize(9);
  doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`, pageWidth / 2, 30, { align: "center" });

  doc.setTextColor(...CORES.texto);
  return 45;
}

function addFooter(doc: jsPDF, pageNumber: number): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setDrawColor(200, 200, 200);
  doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);

  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text(`Página ${pageNumber}`, pageWidth / 2, pageHeight - 8, { align: "center" });
  doc.text("Documento gerado pelo Sistema IDJUV", 15, pageHeight - 8);
}

function checkNewPage(doc: jsPDF, currentY: number, neededSpace: number, pageNumber: { value: number }): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (currentY + neededSpace > pageHeight - 25) {
    addFooter(doc, pageNumber.value);
    doc.addPage();
    pageNumber.value++;
    return 20;
  }
  return currentY;
}

export function gerarPdfRelatorioPendencias(
  analise: PreCadastroComPendencias[],
  stats: StatsData,
  filtroAtivo?: string
): void {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageNumber = { value: 1 };
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  let y = addHeader(doc, "Relatório de Pendências de Pré-Cadastros");

  // Resumo estatístico
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...CORES.primaria);
  doc.text("RESUMO ESTATÍSTICO", margin, y);
  y += 8;

  // Caixa de resumo
  doc.setFillColor(...CORES.cinzaClaro);
  doc.roundedRect(margin, y, contentWidth, 28, 3, 3, "F");

  const boxY = y + 6;
  const colWidth = contentWidth / 5;

  // Total
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...CORES.texto);
  doc.text(String(stats.total), margin + colWidth * 0.5, boxY, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Total", margin + colWidth * 0.5, boxY + 6, { align: "center" });

  // eSocial
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...CORES.vermelho);
  doc.text(String(stats.comPendenciaEsocial), margin + colWidth * 1.5, boxY, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...CORES.texto);
  doc.text("eSocial", margin + colWidth * 1.5, boxY + 6, { align: "center" });

  // Bancária
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...CORES.laranja);
  doc.text(String(stats.comPendenciaBancaria), margin + colWidth * 2.5, boxY, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...CORES.texto);
  doc.text("Bancária", margin + colWidth * 2.5, boxY + 6, { align: "center" });

  // Pessoal
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...CORES.roxo);
  doc.text(String(stats.comPendenciaPessoal), margin + colWidth * 3.5, boxY, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...CORES.texto);
  doc.text("Pessoal", margin + colWidth * 3.5, boxY + 6, { align: "center" });

  // Completos
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...CORES.verde);
  doc.text(String(stats.completos), margin + colWidth * 4.5, boxY, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...CORES.texto);
  doc.text("Completos", margin + colWidth * 4.5, boxY + 6, { align: "center" });

  y += 35;

  // Filtro aplicado
  if (filtroAtivo) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(128, 128, 128);
    doc.text(`Filtro aplicado: ${filtroAtivo}`, margin, y);
    y += 8;
  }

  // Seções por tipo de pendência
  const secoes = [
    {
      titulo: "Pendências eSocial",
      cor: CORES.vermelho,
      filtro: (a: PreCadastroComPendencias) => a.temPendenciaEsocial,
      tipoPendencia: "esocial" as const,
    },
    {
      titulo: "Pendências Bancárias",
      cor: CORES.laranja,
      filtro: (a: PreCadastroComPendencias) => a.temPendenciaBancaria,
      tipoPendencia: "bancaria" as const,
    },
    {
      titulo: "Pendências Dados Pessoais",
      cor: CORES.roxo,
      filtro: (a: PreCadastroComPendencias) => a.temPendenciaPessoal,
      tipoPendencia: "pessoal" as const,
    },
  ];

  for (const secao of secoes) {
    const dadosSecao = analise.filter(secao.filtro);
    if (dadosSecao.length === 0) continue;

    y = checkNewPage(doc, y, 20, pageNumber);

    // Título da seção
    doc.setFillColor(...secao.cor);
    doc.rect(margin, y, 3, 8, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...CORES.texto);
    doc.text(`${secao.titulo} (${dadosSecao.length})`, margin + 6, y + 6);
    y += 12;

    // Cabeçalho da tabela
    y = checkNewPage(doc, y, 10, pageNumber);
    doc.setFillColor(...CORES.cinzaClaro);
    doc.rect(margin, y, contentWidth, 7, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...CORES.texto);
    doc.text("Nome", margin + 2, y + 5);
    doc.text("CPF", margin + 70, y + 5);
    doc.text("Status", margin + 100, y + 5);
    doc.text("Campos Pendentes", margin + 125, y + 5);
    y += 9;

    // Linhas da tabela
    for (const item of dadosSecao) {
      const pendenciasDoTipo = item.pendencias.filter((p) => p.tipo === secao.tipoPendencia);
      const camposPendentes = pendenciasDoTipo.map((p) => p.descricao).join(", ");
      const linhasNecessarias = Math.ceil(camposPendentes.length / 40) || 1;
      const alturaLinha = 6 + (linhasNecessarias - 1) * 4;

      y = checkNewPage(doc, y, alturaLinha + 2, pageNumber);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...CORES.texto);

      // Nome (truncado se necessário)
      const nome = item.preCadastro.nome_completo || "-";
      const nomeDisplay = nome.length > 35 ? nome.substring(0, 32) + "..." : nome;
      doc.text(nomeDisplay, margin + 2, y + 4);

      // CPF
      doc.text(formatCPF(item.preCadastro.cpf) || "-", margin + 70, y + 4);

      // Status
      const statusTexto = item.preCadastro.status === "aprovado" ? "Aprovado" : "Enviado";
      doc.text(statusTexto, margin + 100, y + 4);

      // Campos pendentes (com quebra de linha se necessário)
      const camposArray = doc.splitTextToSize(camposPendentes || "-", 55);
      doc.text(camposArray, margin + 125, y + 4);

      // Linha separadora
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y + alturaLinha, margin + contentWidth, y + alturaLinha);

      y += alturaLinha + 1;
    }

    y += 8;
  }

  // Seção de completos
  const completos = analise.filter(
    (a) => !a.temPendenciaEsocial && !a.temPendenciaBancaria && !a.temPendenciaPessoal
  );

  if (completos.length > 0) {
    y = checkNewPage(doc, y, 20, pageNumber);

    doc.setFillColor(...CORES.verde);
    doc.rect(margin, y, 3, 8, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...CORES.texto);
    doc.text(`Cadastros Completos (${completos.length})`, margin + 6, y + 6);
    y += 12;

    // Cabeçalho
    y = checkNewPage(doc, y, 10, pageNumber);
    doc.setFillColor(...CORES.cinzaClaro);
    doc.rect(margin, y, contentWidth, 7, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Nome", margin + 2, y + 5);
    doc.text("CPF", margin + 90, y + 5);
    doc.text("Status", margin + 130, y + 5);
    y += 9;

    for (const item of completos) {
      y = checkNewPage(doc, y, 8, pageNumber);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...CORES.texto);

      const nome = item.preCadastro.nome_completo || "-";
      const nomeDisplay = nome.length > 45 ? nome.substring(0, 42) + "..." : nome;
      doc.text(nomeDisplay, margin + 2, y + 4);
      doc.text(formatCPF(item.preCadastro.cpf) || "-", margin + 90, y + 4);

      doc.setTextColor(...CORES.verde);
      doc.text("✓ Completo", margin + 130, y + 4);

      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y + 6, margin + contentWidth, y + 6);
      y += 7;
    }
  }

  addFooter(doc, pageNumber.value);

  const dataFormatada = new Date().toISOString().split("T")[0];
  doc.save(`relatorio-pendencias-precadastros-${dataFormatada}.pdf`);
}
