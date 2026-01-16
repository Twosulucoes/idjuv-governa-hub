import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Interfaces
interface PendenciaItem {
  tipo: "elegibilidade" | "esocial" | "bancaria" | "pessoal";
  campo: string;
  descricao: string;
  obrigatorio: boolean;
}

interface ServidorCompleto {
  id: string;
  nome_completo: string;
  cpf: string;
  matricula: string | null;
  situacao: string;
  tipo_servidor: string | null;
  cargo_nome: string | null;
  unidade_nome: string | null;
}

interface ServidorComPendencias {
  servidor: ServidorCompleto;
  pendencias: PendenciaItem[];
  temPendenciaElegibilidade: boolean;
  temPendenciaEsocial: boolean;
  temPendenciaBancaria: boolean;
  temPendenciaPessoal: boolean;
}

interface StatsData {
  total: number;
  comPendenciaElegibilidade: number;
  comPendenciaEsocial: number;
  comPendenciaBancaria: number;
  comPendenciaPessoal: number;
  completos: number;
  elegiveis: number;
}

// Cores para o PDF
const CORES = {
  primaria: [0, 51, 102] as [number, number, number],
  secundaria: [0, 102, 51] as [number, number, number],
  texto: [51, 51, 51] as [number, number, number],
  cinza: [128, 128, 128] as [number, number, number],
  vermelho: [220, 53, 69] as [number, number, number],
  laranja: [255, 152, 0] as [number, number, number],
  roxo: [103, 58, 183] as [number, number, number],
  verde: [40, 167, 69] as [number, number, number],
};

function addHeader(doc: jsPDF, titulo: string): number {
  const pageWidth = doc.internal.pageSize.width;
  
  // Título do órgão
  doc.setFontSize(10);
  doc.setTextColor(...CORES.primaria);
  doc.setFont("helvetica", "bold");
  doc.text("GOVERNO DO ESTADO DE RORAIMA", pageWidth / 2, 15, { align: "center" });
  doc.text("IDJUV - Instituto de Desenvolvimento da Juventude", pageWidth / 2, 21, { align: "center" });
  
  // Linha separadora
  doc.setDrawColor(...CORES.primaria);
  doc.setLineWidth(0.5);
  doc.line(20, 26, pageWidth - 20, 26);
  
  // Título do relatório
  doc.setFontSize(14);
  doc.setTextColor(...CORES.texto);
  doc.text(titulo, pageWidth / 2, 35, { align: "center" });
  
  // Data de geração
  doc.setFontSize(8);
  doc.setTextColor(...CORES.cinza);
  const dataGeracao = format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  doc.text(`Gerado em: ${dataGeracao}`, pageWidth / 2, 42, { align: "center" });
  
  return 50;
}

function addFooter(doc: jsPDF, pageNumber: number): void {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  doc.setFontSize(8);
  doc.setTextColor(...CORES.cinza);
  doc.text(`Página ${pageNumber}`, pageWidth / 2, pageHeight - 10, { align: "center" });
  doc.text("Sistema IDJuv - Módulo RH", pageWidth - 20, pageHeight - 10, { align: "right" });
}

function checkNewPage(doc: jsPDF, currentY: number, neededSpace: number, pageNumber: { value: number }): number {
  const pageHeight = doc.internal.pageSize.height;
  
  if (currentY + neededSpace > pageHeight - 25) {
    addFooter(doc, pageNumber.value);
    doc.addPage();
    pageNumber.value++;
    return 20;
  }
  return currentY;
}

function formatCPF(cpf: string): string {
  if (!cpf) return "-";
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function gerarPdfRelatorioPendenciasServidores(
  analise: ServidorComPendencias[],
  stats: StatsData,
  filtroAtivo?: string
): void {
  const doc = new jsPDF();
  const pageNumber = { value: 1 };
  const pageWidth = doc.internal.pageSize.width;
  
  // Header
  let y = addHeader(doc, "RELATÓRIO DE PENDÊNCIAS DE SERVIDORES");
  
  // Filtro ativo
  if (filtroAtivo) {
    doc.setFontSize(9);
    doc.setTextColor(...CORES.cinza);
    doc.text(`Filtro aplicado: ${filtroAtivo}`, 20, y);
    y += 8;
  }
  
  // Resumo estatístico
  doc.setFillColor(245, 245, 245);
  doc.rect(20, y, pageWidth - 40, 35, "F");
  
  doc.setFontSize(10);
  doc.setTextColor(...CORES.texto);
  doc.setFont("helvetica", "bold");
  doc.text("RESUMO GERAL", 25, y + 8);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  
  const col1X = 25;
  const col2X = 85;
  const col3X = 145;
  
  doc.text(`Total de Servidores: ${stats.total}`, col1X, y + 17);
  doc.setTextColor(...CORES.vermelho);
  doc.text(`Pendências Elegibilidade: ${stats.comPendenciaElegibilidade}`, col1X, y + 24);
  doc.setTextColor(...CORES.vermelho);
  doc.text(`Pendências eSocial: ${stats.comPendenciaEsocial}`, col2X, y + 17);
  doc.setTextColor(...CORES.laranja);
  doc.text(`Pendências Bancárias: ${stats.comPendenciaBancaria}`, col2X, y + 24);
  doc.setTextColor(...CORES.roxo);
  doc.text(`Pendências Pessoais: ${stats.comPendenciaPessoal}`, col3X, y + 17);
  doc.setTextColor(...CORES.verde);
  doc.text(`Cadastro Completo: ${stats.completos}`, col3X, y + 24);
  doc.setTextColor(0, 102, 204);
  doc.text(`Elegíveis para Folha: ${stats.elegiveis}`, col1X, y + 31);
  
  y += 45;
  
  // Seções de pendências
  const secoes = [
    { 
      titulo: "SERVIDORES COM PENDÊNCIAS DE ELEGIBILIDADE", 
      tipo: "elegibilidade" as const,
      cor: CORES.vermelho,
      dados: analise.filter(a => a.temPendenciaElegibilidade)
    },
    { 
      titulo: "SERVIDORES COM PENDÊNCIAS eSocial", 
      tipo: "esocial" as const,
      cor: CORES.vermelho,
      dados: analise.filter(a => a.temPendenciaEsocial)
    },
    { 
      titulo: "SERVIDORES COM PENDÊNCIAS BANCÁRIAS", 
      tipo: "bancaria" as const,
      cor: CORES.laranja,
      dados: analise.filter(a => a.temPendenciaBancaria)
    },
    { 
      titulo: "SERVIDORES COM PENDÊNCIAS PESSOAIS", 
      tipo: "pessoal" as const,
      cor: CORES.roxo,
      dados: analise.filter(a => a.temPendenciaPessoal)
    },
  ];
  
  for (const secao of secoes) {
    if (secao.dados.length === 0) continue;
    
    y = checkNewPage(doc, y, 30, pageNumber);
    
    // Título da seção
    doc.setFillColor(...secao.cor);
    doc.rect(20, y, pageWidth - 40, 8, "F");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(`${secao.titulo} (${secao.dados.length})`, 25, y + 6);
    y += 12;
    
    // Cabeçalho da tabela
    doc.setFillColor(240, 240, 240);
    doc.rect(20, y, pageWidth - 40, 7, "F");
    doc.setFontSize(8);
    doc.setTextColor(...CORES.texto);
    doc.setFont("helvetica", "bold");
    doc.text("Nome", 22, y + 5);
    doc.text("Matrícula", 80, y + 5);
    doc.text("CPF", 105, y + 5);
    doc.text("Campos Pendentes", 135, y + 5);
    y += 10;
    
    doc.setFont("helvetica", "normal");
    
    for (const item of secao.dados) {
      y = checkNewPage(doc, y, 12, pageNumber);
      
      const pendenciasTipo = item.pendencias.filter(p => p.tipo === secao.tipo);
      const camposPendentes = pendenciasTipo.map(p => p.descricao).join(", ");
      
      doc.setFontSize(8);
      doc.setTextColor(...CORES.texto);
      
      // Nome (truncar se necessário)
      const nomeMax = 55;
      let nome = item.servidor.nome_completo;
      if (doc.getTextWidth(nome) > nomeMax) {
        while (doc.getTextWidth(nome + "...") > nomeMax && nome.length > 0) {
          nome = nome.slice(0, -1);
        }
        nome += "...";
      }
      doc.text(nome, 22, y);
      
      doc.text(item.servidor.matricula || "-", 80, y);
      doc.text(formatCPF(item.servidor.cpf), 105, y);
      
      // Campos pendentes (truncar se necessário)
      const camposMax = pageWidth - 140;
      let campos = camposPendentes;
      if (doc.getTextWidth(campos) > camposMax) {
        while (doc.getTextWidth(campos + "...") > camposMax && campos.length > 0) {
          campos = campos.slice(0, -1);
        }
        campos += "...";
      }
      doc.setTextColor(...secao.cor);
      doc.text(campos, 135, y);
      
      y += 6;
      
      // Linha separadora
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.1);
      doc.line(20, y - 2, pageWidth - 20, y - 2);
    }
    
    y += 10;
  }
  
  // Seção de servidores completos
  const completos = analise.filter(
    a => !a.temPendenciaElegibilidade && !a.temPendenciaEsocial && !a.temPendenciaBancaria && !a.temPendenciaPessoal
  );
  
  if (completos.length > 0) {
    y = checkNewPage(doc, y, 30, pageNumber);
    
    // Título da seção
    doc.setFillColor(...CORES.verde);
    doc.rect(20, y, pageWidth - 40, 8, "F");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(`SERVIDORES COM CADASTRO COMPLETO (${completos.length})`, 25, y + 6);
    y += 12;
    
    // Cabeçalho da tabela
    doc.setFillColor(240, 240, 240);
    doc.rect(20, y, pageWidth - 40, 7, "F");
    doc.setFontSize(8);
    doc.setTextColor(...CORES.texto);
    doc.setFont("helvetica", "bold");
    doc.text("Nome", 22, y + 5);
    doc.text("Matrícula", 80, y + 5);
    doc.text("CPF", 105, y + 5);
    doc.text("Cargo", 135, y + 5);
    y += 10;
    
    doc.setFont("helvetica", "normal");
    
    for (const item of completos) {
      y = checkNewPage(doc, y, 12, pageNumber);
      
      doc.setFontSize(8);
      doc.setTextColor(...CORES.texto);
      
      // Nome (truncar se necessário)
      const nomeMax = 55;
      let nome = item.servidor.nome_completo;
      if (doc.getTextWidth(nome) > nomeMax) {
        while (doc.getTextWidth(nome + "...") > nomeMax && nome.length > 0) {
          nome = nome.slice(0, -1);
        }
        nome += "...";
      }
      doc.text(nome, 22, y);
      
      doc.text(item.servidor.matricula || "-", 80, y);
      doc.text(formatCPF(item.servidor.cpf), 105, y);
      
      // Cargo (truncar se necessário)
      const cargoMax = pageWidth - 140;
      let cargo = item.servidor.cargo_nome || "-";
      if (doc.getTextWidth(cargo) > cargoMax) {
        while (doc.getTextWidth(cargo + "...") > cargoMax && cargo.length > 0) {
          cargo = cargo.slice(0, -1);
        }
        cargo += "...";
      }
      doc.setTextColor(...CORES.verde);
      doc.text(cargo, 135, y);
      
      y += 6;
      
      // Linha separadora
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.1);
      doc.line(20, y - 2, pageWidth - 20, y - 2);
    }
  }
  
  // Footer na última página
  addFooter(doc, pageNumber.value);
  
  // Salvar
  const dataAtual = format(new Date(), "yyyy-MM-dd_HH-mm");
  doc.save(`relatorio_pendencias_servidores_${dataAtual}.pdf`);
}
