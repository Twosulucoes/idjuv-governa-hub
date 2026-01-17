import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Participante {
  id: string;
  servidor?: { nome_completo: string } | null;
  nome_externo?: string | null;
  cargo_funcao?: string | null;
  status: string;
  assinatura_presenca?: boolean;
  justificativa_ausencia?: string | null;
}

interface Reuniao {
  titulo: string;
  data_reuniao: string;
  hora_inicio: string;
  hora_fim?: string | null;
  local?: string | null;
  tipo: string;
  status: string;
  pauta?: string | null;
  ata_conteudo?: string | null;
  observacoes?: string | null;
}

const tipoLabels: Record<string, string> = {
  ordinaria: "Ordinária",
  extraordinaria: "Extraordinária",
  audiencia: "Audiência",
  sessao_solene: "Sessão Solene",
  reuniao_trabalho: "Reunião de Trabalho",
};

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  recusado: "Recusado",
  presente: "Presente",
  ausente: "Ausente",
};

function addHeader(doc: jsPDF, titulo: string): number {
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("GOVERNO DO ESTADO DE RORAIMA", 105, 15, { align: "center" });
  doc.text("INSTITUTO DE DESPORTO, JUVENTUDE E LAZER - IDJUV", 105, 20, { align: "center" });

  doc.setLineWidth(0.5);
  doc.line(20, 25, 190, 25);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(titulo, 105, 35, { align: "center" });

  doc.setLineWidth(0.3);
  doc.line(20, 40, 190, 40);

  return 48;
}

function addFooter(doc: jsPDF, pageNum: number) {
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    20,
    pageHeight - 10
  );
  doc.text(`Página ${pageNum}`, 190, pageHeight - 10, { align: "right" });
}

export function gerarPdfListaConvocados(reuniao: Reuniao, participantes: Participante[]): void {
  const doc = new jsPDF();
  let y = addHeader(doc, "LISTA DE CONVOCADOS");

  // Info da reunião
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Reunião:", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(reuniao.titulo, 45, y);

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Data:", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(
    format(new Date(reuniao.data_reuniao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
    45,
    y
  );
  doc.text(`Horário: ${reuniao.hora_inicio}`, 120, y);

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Local:", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(reuniao.local || "Não informado", 45, y);

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Tipo:", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(tipoLabels[reuniao.tipo] || reuniao.tipo, 45, y);

  y += 10;
  doc.line(20, y, 190, y);
  y += 8;

  // Tabela de participantes
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Nº", 22, y);
  doc.text("Nome", 35, y);
  doc.text("Cargo/Função", 110, y);
  doc.text("Status", 165, y);

  y += 3;
  doc.line(20, y, 190, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  participantes.forEach((p, index) => {
    if (y > 270) {
      addFooter(doc, doc.getNumberOfPages());
      doc.addPage();
      y = 30;
    }

    const nome = p.servidor?.nome_completo || p.nome_externo || "—";
    const cargo = p.cargo_funcao || "—";
    const status = statusLabels[p.status] || p.status;

    doc.text(String(index + 1).padStart(2, "0"), 22, y);
    doc.text(nome.substring(0, 40), 35, y);
    doc.text(cargo.substring(0, 30), 110, y);
    doc.text(status, 165, y);

    y += 6;
  });

  y += 10;
  doc.setFontSize(10);
  doc.text(`Total de convocados: ${participantes.length}`, 20, y);

  addFooter(doc, doc.getNumberOfPages());
  doc.save(`lista-convocados-${reuniao.data_reuniao}.pdf`);
}

export function gerarPdfListaPresenca(reuniao: Reuniao, participantes: Participante[]): void {
  const doc = new jsPDF();
  let y = addHeader(doc, "LISTA DE PRESENÇA");

  // Info da reunião
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Reunião:", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(reuniao.titulo, 45, y);

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Data:", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(
    format(new Date(reuniao.data_reuniao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
    45,
    y
  );

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Horário:", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${reuniao.hora_inicio}${reuniao.hora_fim ? ` às ${reuniao.hora_fim}` : ""}`,
    45,
    y
  );

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Local:", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(reuniao.local || "Não informado", 45, y);

  y += 10;
  doc.line(20, y, 190, y);
  y += 8;

  // Estatísticas
  const presentes = participantes.filter((p) => p.status === "presente").length;
  const ausentes = participantes.filter((p) => p.status === "ausente").length;
  const total = participantes.length;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Presentes: ${presentes}`, 20, y);
  doc.text(`Ausentes: ${ausentes}`, 70, y);
  doc.text(`Total: ${total}`, 120, y);

  y += 10;

  // Tabela
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Nº", 22, y);
  doc.text("Nome", 35, y);
  doc.text("Cargo/Função", 100, y);
  doc.text("Presença", 155, y);

  y += 3;
  doc.line(20, y, 190, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  participantes.forEach((p, index) => {
    if (y > 260) {
      addFooter(doc, doc.getNumberOfPages());
      doc.addPage();
      y = 30;
    }

    const nome = p.servidor?.nome_completo || p.nome_externo || "—";
    const cargo = p.cargo_funcao || "—";
    const presenca = p.status === "presente" ? "✓ Presente" : p.status === "ausente" ? "✗ Ausente" : "—";

    doc.text(String(index + 1).padStart(2, "0"), 22, y);
    doc.text(nome.substring(0, 35), 35, y);
    doc.text(cargo.substring(0, 28), 100, y);
    doc.text(presenca, 155, y);

    if (p.status === "ausente" && p.justificativa_ausencia) {
      y += 5;
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(`Justificativa: ${p.justificativa_ausencia.substring(0, 60)}`, 35, y);
      doc.setTextColor(0);
      doc.setFontSize(9);
    }

    y += 6;
  });

  // Assinaturas
  y += 15;
  if (y > 250) {
    addFooter(doc, doc.getNumberOfPages());
    doc.addPage();
    y = 40;
  }

  doc.setFontSize(10);
  doc.text("Boa Vista - RR, " + format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }), 105, y, {
    align: "center",
  });

  y += 25;
  doc.line(50, y, 160, y);
  y += 5;
  doc.text("Responsável pela Reunião", 105, y, { align: "center" });

  addFooter(doc, doc.getNumberOfPages());
  doc.save(`lista-presenca-${reuniao.data_reuniao}.pdf`);
}

export function gerarPdfRelatorioReuniao(reuniao: Reuniao, participantes: Participante[]): void {
  const doc = new jsPDF();
  let y = addHeader(doc, "RELATÓRIO DE REUNIÃO");

  // Info da reunião
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Título:", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(reuniao.titulo, 45, y);

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Data:", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(
    format(new Date(reuniao.data_reuniao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
    45,
    y
  );

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Horário:", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${reuniao.hora_inicio}${reuniao.hora_fim ? ` às ${reuniao.hora_fim}` : ""}`,
    45,
    y
  );

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Local:", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(reuniao.local || "Não informado", 45, y);

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Tipo:", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(tipoLabels[reuniao.tipo] || reuniao.tipo, 45, y);

  y += 10;
  doc.line(20, y, 190, y);
  y += 8;

  // Participantes presentes
  const presentes = participantes.filter((p) => p.status === "presente");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`PARTICIPANTES PRESENTES (${presentes.length})`, 20, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  presentes.forEach((p) => {
    if (y > 265) {
      doc.addPage();
      y = 30;
    }
    const nome = p.servidor?.nome_completo || p.nome_externo || "—";
    const cargo = p.cargo_funcao ? ` - ${p.cargo_funcao}` : "";
    doc.text(`• ${nome}${cargo}`, 25, y);
    y += 5;
  });

  y += 8;

  // Pauta
  if (reuniao.pauta) {
    if (y > 230) {
      doc.addPage();
      y = 30;
    }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("PAUTA", 20, y);
    y += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const pautaLines = doc.splitTextToSize(reuniao.pauta, 170);
    pautaLines.forEach((line: string) => {
      if (y > 270) {
        doc.addPage();
        y = 30;
      }
      doc.text(line, 20, y);
      y += 5;
    });
    y += 5;
  }

  // Ata
  if (reuniao.ata_conteudo) {
    if (y > 200) {
      doc.addPage();
      y = 30;
    }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("ATA DA REUNIÃO", 20, y);
    y += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const ataLines = doc.splitTextToSize(reuniao.ata_conteudo, 170);
    ataLines.forEach((line: string) => {
      if (y > 270) {
        addFooter(doc, doc.getNumberOfPages());
        doc.addPage();
        y = 30;
      }
      doc.text(line, 20, y);
      y += 5;
    });
  }

  addFooter(doc, doc.getNumberOfPages());
  doc.save(`relatorio-reuniao-${reuniao.data_reuniao}.pdf`);
}
