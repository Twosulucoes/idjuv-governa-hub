/**
 * Gerador de PDFs para Relatórios de Reuniões
 * 
 * PADRONIZAÇÃO: Usa o sistema institucional (pdfInstitucional.ts)
 */
import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  criarDocumentoInstitucional,
  finalizarDocumentoInstitucional,
  adicionarSecao,
  adicionarCampoInline,
  verificarQuebraPagina,
  CORES_INSTITUCIONAIS,
  MARGENS,
  TIPOGRAFIA,
  getDimensoesPagina,
  ConfiguracaoDocumento,
} from "./pdfInstitucional";

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

/**
 * Desenha cabeçalho de tabela
 */
function desenharCabecalhoTabela(
  doc: jsPDF,
  y: number,
  colunas: { texto: string; x: number }[]
): number {
  doc.setFillColor(
    CORES_INSTITUCIONAIS.primaria.r,
    CORES_INSTITUCIONAIS.primaria.g,
    CORES_INSTITUCIONAIS.primaria.b
  );
  doc.rect(MARGENS.esquerda, y, MARGENS.larguraUtil, 7, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);

  colunas.forEach((col) => {
    doc.text(col.texto, col.x, y + 5);
  });

  doc.setTextColor(
    CORES_INSTITUCIONAIS.textoEscuro.r,
    CORES_INSTITUCIONAIS.textoEscuro.g,
    CORES_INSTITUCIONAIS.textoEscuro.b
  );

  return y + 10;
}

/**
 * Adiciona informações da reunião
 */
function adicionarInfoReuniao(doc: jsPDF, reuniao: Reuniao, y: number): number {
  const dataFormatada = format(
    new Date(reuniao.data_reuniao),
    "dd 'de' MMMM 'de' yyyy",
    { locale: ptBR }
  );

  y = adicionarCampoInline(doc, "Reunião", reuniao.titulo, MARGENS.esquerda, y);
  y = adicionarCampoInline(doc, "Data", dataFormatada, MARGENS.esquerda, y);
  y = adicionarCampoInline(
    doc,
    "Horário",
    `${reuniao.hora_inicio}${reuniao.hora_fim ? ` às ${reuniao.hora_fim}` : ""}`,
    MARGENS.esquerda,
    y
  );
  y = adicionarCampoInline(
    doc,
    "Local",
    reuniao.local || "Não informado",
    MARGENS.esquerda,
    y
  );
  y = adicionarCampoInline(
    doc,
    "Tipo",
    tipoLabels[reuniao.tipo] || reuniao.tipo,
    MARGENS.esquerda,
    y
  );

  return y + 5;
}

/**
 * Gera PDF de Lista de Convocados
 */
export async function gerarPdfListaConvocados(
  reuniao: Reuniao,
  participantes: Participante[]
): Promise<void> {
  const config: ConfiguracaoDocumento = {
    titulo: "LISTA DE CONVOCADOS",
    subtitulo: reuniao.titulo,
    variante: "escuro",
    mostrarRodape: true,
    mostrarPaginacao: true,
  };

  const { doc, yInicial } = await criarDocumentoInstitucional(config);
  let y = yInicial;

  // Informações da reunião
  y = adicionarInfoReuniao(doc, reuniao, y);
  y += 5;

  // Cabeçalho da tabela
  const colunas = [
    { texto: "Nº", x: MARGENS.esquerda + 2 },
    { texto: "Nome", x: MARGENS.esquerda + 15 },
    { texto: "Cargo/Função", x: 110 },
    { texto: "Status", x: 165 },
  ];
  y = desenharCabecalhoTabela(doc, y, colunas);

  // Dados dos participantes
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  participantes.forEach((p, index) => {
    y = verificarQuebraPagina(doc, y, 8, config);
    if (y < 50) {
      y = desenharCabecalhoTabela(doc, y, colunas);
    }

    // Fundo alternado
    if (index % 2 === 1) {
      doc.setFillColor(
        CORES_INSTITUCIONAIS.fundoClaro.r,
        CORES_INSTITUCIONAIS.fundoClaro.g,
        CORES_INSTITUCIONAIS.fundoClaro.b
      );
      doc.rect(MARGENS.esquerda, y - 3, MARGENS.larguraUtil, 6, "F");
    }

    doc.setTextColor(
      CORES_INSTITUCIONAIS.textoEscuro.r,
      CORES_INSTITUCIONAIS.textoEscuro.g,
      CORES_INSTITUCIONAIS.textoEscuro.b
    );

    const nome = p.servidor?.nome_completo || p.nome_externo || "—";
    const cargo = p.cargo_funcao || "—";
    const status = statusLabels[p.status] || p.status;

    doc.text(String(index + 1).padStart(2, "0"), MARGENS.esquerda + 2, y);
    doc.text(nome.substring(0, 40), MARGENS.esquerda + 15, y);
    doc.text(cargo.substring(0, 30), 110, y);
    doc.text(status, 165, y);

    y += 6;
  });

  // Total
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`Total de convocados: ${participantes.length}`, MARGENS.esquerda, y);

  finalizarDocumentoInstitucional(doc, config);
  doc.save(`lista-convocados-${reuniao.data_reuniao}.pdf`);
}

/**
 * Gera PDF de Lista de Presença
 */
export async function gerarPdfListaPresenca(
  reuniao: Reuniao,
  participantes: Participante[]
): Promise<void> {
  const config: ConfiguracaoDocumento = {
    titulo: "LISTA DE PRESENÇA",
    subtitulo: reuniao.titulo,
    variante: "escuro",
    mostrarRodape: true,
    mostrarPaginacao: true,
  };

  const { doc, yInicial } = await criarDocumentoInstitucional(config);
  let y = yInicial;

  // Informações da reunião
  y = adicionarInfoReuniao(doc, reuniao, y);

  // Estatísticas
  const presentes = participantes.filter((p) => p.status === "presente").length;
  const ausentes = participantes.filter((p) => p.status === "ausente").length;
  const total = participantes.length;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(
    CORES_INSTITUCIONAIS.primaria.r,
    CORES_INSTITUCIONAIS.primaria.g,
    CORES_INSTITUCIONAIS.primaria.b
  );
  doc.text(`Presentes: ${presentes}`, MARGENS.esquerda, y);
  doc.text(`Ausentes: ${ausentes}`, 80, y);
  doc.text(`Total: ${total}`, 130, y);
  y += 10;

  // Cabeçalho da tabela
  const colunas = [
    { texto: "Nº", x: MARGENS.esquerda + 2 },
    { texto: "Nome", x: MARGENS.esquerda + 15 },
    { texto: "Cargo/Função", x: 100 },
    { texto: "Presença", x: 155 },
  ];
  y = desenharCabecalhoTabela(doc, y, colunas);

  // Dados
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  participantes.forEach((p, index) => {
    y = verificarQuebraPagina(doc, y, 12, config);
    if (y < 50) {
      y = desenharCabecalhoTabela(doc, y, colunas);
    }

    if (index % 2 === 1) {
      doc.setFillColor(
        CORES_INSTITUCIONAIS.fundoClaro.r,
        CORES_INSTITUCIONAIS.fundoClaro.g,
        CORES_INSTITUCIONAIS.fundoClaro.b
      );
      doc.rect(MARGENS.esquerda, y - 3, MARGENS.larguraUtil, 6, "F");
    }

    doc.setTextColor(
      CORES_INSTITUCIONAIS.textoEscuro.r,
      CORES_INSTITUCIONAIS.textoEscuro.g,
      CORES_INSTITUCIONAIS.textoEscuro.b
    );

    const nome = p.servidor?.nome_completo || p.nome_externo || "—";
    const cargo = p.cargo_funcao || "—";
    const presenca =
      p.status === "presente"
        ? "✓ Presente"
        : p.status === "ausente"
        ? "✗ Ausente"
        : "—";

    doc.text(String(index + 1).padStart(2, "0"), MARGENS.esquerda + 2, y);
    doc.text(nome.substring(0, 35), MARGENS.esquerda + 15, y);
    doc.text(cargo.substring(0, 28), 100, y);
    doc.text(presenca, 155, y);

    if (p.status === "ausente" && p.justificativa_ausencia) {
      y += 5;
      doc.setFontSize(8);
      doc.setTextColor(
        CORES_INSTITUCIONAIS.textoClaro.r,
        CORES_INSTITUCIONAIS.textoClaro.g,
        CORES_INSTITUCIONAIS.textoClaro.b
      );
      doc.text(
        `Justificativa: ${p.justificativa_ausencia.substring(0, 60)}`,
        MARGENS.esquerda + 15,
        y
      );
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
    }

    y += 6;
  });

  // Assinatura
  y += 20;
  y = verificarQuebraPagina(doc, y, 40, config);

  doc.setFontSize(10);
  doc.setTextColor(
    CORES_INSTITUCIONAIS.textoEscuro.r,
    CORES_INSTITUCIONAIS.textoEscuro.g,
    CORES_INSTITUCIONAIS.textoEscuro.b
  );
  doc.text(
    "Boa Vista - RR, " +
      format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
    105,
    y,
    { align: "center" }
  );

  y += 25;
  doc.setDrawColor(
    CORES_INSTITUCIONAIS.bordaMedia.r,
    CORES_INSTITUCIONAIS.bordaMedia.g,
    CORES_INSTITUCIONAIS.bordaMedia.b
  );
  doc.line(50, y, 160, y);
  y += 5;
  doc.setFontSize(9);
  doc.text("Responsável pela Reunião", 105, y, { align: "center" });

  finalizarDocumentoInstitucional(doc, config);
  doc.save(`lista-presenca-${reuniao.data_reuniao}.pdf`);
}

/**
 * Gera PDF de Relatório Completo da Reunião
 */
export async function gerarPdfRelatorioReuniao(
  reuniao: Reuniao,
  participantes: Participante[]
): Promise<void> {
  const config: ConfiguracaoDocumento = {
    titulo: "RELATÓRIO DE REUNIÃO",
    variante: "escuro",
    mostrarRodape: true,
    mostrarPaginacao: true,
  };

  const { doc, yInicial } = await criarDocumentoInstitucional(config);
  let y = yInicial;

  // Seção 1: Informações Gerais
  y = adicionarSecao(doc, "Informações Gerais", y, 1);
  y = adicionarInfoReuniao(doc, reuniao, y);
  y += 5;

  // Seção 2: Participantes Presentes
  const presentes = participantes.filter((p) => p.status === "presente");
  y = verificarQuebraPagina(doc, y, 20, config);
  y = adicionarSecao(doc, `Participantes Presentes (${presentes.length})`, y, 2);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(
    CORES_INSTITUCIONAIS.textoEscuro.r,
    CORES_INSTITUCIONAIS.textoEscuro.g,
    CORES_INSTITUCIONAIS.textoEscuro.b
  );

  presentes.forEach((p) => {
    y = verificarQuebraPagina(doc, y, 6, config);
    const nome = p.servidor?.nome_completo || p.nome_externo || "—";
    const cargo = p.cargo_funcao ? ` - ${p.cargo_funcao}` : "";
    doc.text(`• ${nome}${cargo}`, MARGENS.esquerda + 5, y);
    y += 5;
  });

  y += 5;

  // Seção 3: Pauta
  if (reuniao.pauta) {
    y = verificarQuebraPagina(doc, y, 30, config);
    y = adicionarSecao(doc, "Pauta", y, 3);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const pautaLines = doc.splitTextToSize(reuniao.pauta, MARGENS.larguraUtil);
    pautaLines.forEach((line: string) => {
      y = verificarQuebraPagina(doc, y, 6, config);
      doc.text(line, MARGENS.esquerda, y);
      y += 5;
    });
    y += 5;
  }

  // Seção 4: Ata
  if (reuniao.ata_conteudo) {
    y = verificarQuebraPagina(doc, y, 30, config);
    y = adicionarSecao(doc, "Ata da Reunião", y, 4);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const ataLines = doc.splitTextToSize(reuniao.ata_conteudo, MARGENS.larguraUtil);
    ataLines.forEach((line: string) => {
      y = verificarQuebraPagina(doc, y, 6, config);
      doc.text(line, MARGENS.esquerda, y);
      y += 5;
    });
  }

  finalizarDocumentoInstitucional(doc, config);
  doc.save(`relatorio-reuniao-${reuniao.data_reuniao}.pdf`);
}
