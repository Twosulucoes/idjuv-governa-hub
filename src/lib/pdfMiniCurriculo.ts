import jsPDF from 'jspdf';
import type { PreCadastro } from '@/types/preCadastro';
import { formatCPF } from '@/lib/formatters';
import { DOCUMENTOS_CHECKLIST } from '@/types/preCadastro';

// Cores institucionais
const CORES = {
  primaria: { r: 0, g: 82, b: 147 },
  secundaria: { r: 0, g: 128, b: 0 },
  texto: { r: 51, g: 51, b: 51 },
  cinzaClaro: { r: 245, g: 245, b: 245 },
  branco: { r: 255, g: 255, b: 255 },
  verde: { r: 34, g: 139, b: 34 },
  vermelho: { r: 220, g: 53, b: 69 },
};

const PAGINA = {
  largura: 210,
  altura: 297,
  margemEsquerda: 15,
  margemDireita: 15,
  margemTopo: 15,
  margemRodape: 20,
};

function setColor(doc: jsPDF, cor: { r: number; g: number; b: number }, type: 'text' | 'fill' | 'draw' = 'text') {
  if (type === 'text') {
    doc.setTextColor(cor.r, cor.g, cor.b);
  } else if (type === 'fill') {
    doc.setFillColor(cor.r, cor.g, cor.b);
  } else {
    doc.setDrawColor(cor.r, cor.g, cor.b);
  }
}

function desenharHeader(doc: jsPDF): number {
  const contentWidth = PAGINA.largura - PAGINA.margemEsquerda - PAGINA.margemDireita;
  let y = PAGINA.margemTopo;

  // Faixa verde-amarela no topo
  doc.setFillColor(0, 128, 0);
  doc.rect(0, 0, PAGINA.largura, 3, 'F');
  doc.setFillColor(255, 193, 7);
  doc.rect(0, 3, PAGINA.largura, 2, 'F');

  y = 12;

  // Título institucional
  setColor(doc, CORES.primaria);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('GOVERNO DO ESTADO DE RORAIMA', PAGINA.largura / 2, y, { align: 'center' });
  y += 6;

  doc.setFontSize(11);
  doc.text('INSTITUTO DE DESPORTO, JUVENTUDE E LAZER – IDJUV', PAGINA.largura / 2, y, { align: 'center' });
  y += 8;

  // Título do documento
  setColor(doc, CORES.primaria, 'fill');
  doc.rect(PAGINA.margemEsquerda, y, contentWidth, 10, 'F');
  setColor(doc, CORES.branco);
  doc.setFontSize(12);
  doc.text('FORMULÁRIO DE PRÉ-CADASTRO', PAGINA.largura / 2, y + 7, { align: 'center' });
  y += 15;

  return y;
}

function desenharSecao(doc: jsPDF, titulo: string, y: number): number {
  const contentWidth = PAGINA.largura - PAGINA.margemEsquerda - PAGINA.margemDireita;

  setColor(doc, CORES.primaria, 'fill');
  doc.rect(PAGINA.margemEsquerda, y, contentWidth, 7, 'F');
  setColor(doc, CORES.branco);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(titulo, PAGINA.margemEsquerda + 3, y + 5);

  return y + 10;
}

function desenharCampo(doc: jsPDF, label: string, valor: string | undefined, x: number, y: number, largura: number): number {
  setColor(doc, CORES.primaria);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(label, x, y);

  setColor(doc, CORES.texto);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(valor || '-', x, y + 4);

  // Linha sublinhando o valor
  setColor(doc, CORES.cinzaClaro, 'draw');
  doc.line(x, y + 5.5, x + largura - 2, y + 5.5);

  return y + 10;
}

function desenharCheckbox(doc: jsPDF, label: string, marcado: boolean, x: number, y: number): number {
  const boxSize = 3;

  // Desenhar caixa
  setColor(doc, CORES.texto, 'draw');
  doc.rect(x, y - 2.5, boxSize, boxSize, 'S');

  if (marcado) {
    setColor(doc, CORES.verde, 'fill');
    doc.rect(x + 0.5, y - 2, boxSize - 1, boxSize - 1, 'F');
  }

  // Label
  setColor(doc, CORES.texto);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(label, x + 5, y);

  return y + 5;
}

function verificarNovaPagina(doc: jsPDF, y: number, espacoNecessario: number = 30): number {
  if (y + espacoNecessario > PAGINA.altura - PAGINA.margemRodape) {
    doc.addPage();
    return PAGINA.margemTopo + 5;
  }
  return y;
}

export function gerarPdfMiniCurriculo(dados: PreCadastro): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const contentWidth = PAGINA.largura - PAGINA.margemEsquerda - PAGINA.margemDireita;
  const colWidth = contentWidth / 3;

  let y = desenharHeader(doc);

  // Badge do código de acesso
  setColor(doc, CORES.secundaria, 'fill');
  doc.roundedRect(PAGINA.largura - PAGINA.margemDireita - 40, PAGINA.margemTopo + 8, 40, 8, 2, 2, 'F');
  setColor(doc, CORES.branco);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(dados.codigo_acesso || 'PC-0000-0000', PAGINA.largura - PAGINA.margemDireita - 20, PAGINA.margemTopo + 13.5, { align: 'center' });

  // =====================
  // DADOS PESSOAIS
  // =====================
  y = desenharSecao(doc, '1. DADOS PESSOAIS', y);

  // Linha 1
  y = desenharCampo(doc, 'NOME COMPLETO', dados.nome_completo, PAGINA.margemEsquerda, y, contentWidth);
  
  // Linha 2
  const y2 = y;
  desenharCampo(doc, 'NOME SOCIAL', dados.nome_social, PAGINA.margemEsquerda, y2, colWidth);
  desenharCampo(doc, 'DATA NASCIMENTO', dados.data_nascimento, PAGINA.margemEsquerda + colWidth, y2, colWidth);
  y = desenharCampo(doc, 'SEXO', dados.sexo, PAGINA.margemEsquerda + colWidth * 2, y2, colWidth);

  // Linha 3
  const y3 = y;
  desenharCampo(doc, 'ESTADO CIVIL', dados.estado_civil, PAGINA.margemEsquerda, y3, colWidth);
  desenharCampo(doc, 'NACIONALIDADE', dados.nacionalidade, PAGINA.margemEsquerda + colWidth, y3, colWidth);
  y = desenharCampo(doc, 'NATURALIDADE', `${dados.naturalidade_cidade || '-'}/${dados.naturalidade_uf || '-'}`, PAGINA.margemEsquerda + colWidth * 2, y3, colWidth);

  y += 3;
  y = verificarNovaPagina(doc, y);

  // =====================
  // DOCUMENTOS PESSOAIS
  // =====================
  y = desenharSecao(doc, '2. DOCUMENTOS PESSOAIS', y);

  // Linha 1
  const y4 = y;
  desenharCampo(doc, 'CPF', formatCPF(dados.cpf || ''), PAGINA.margemEsquerda, y4, colWidth);
  desenharCampo(doc, 'RG', dados.rg, PAGINA.margemEsquerda + colWidth, y4, colWidth * 0.5);
  desenharCampo(doc, 'ÓRGÃO/UF', `${dados.rg_orgao_expedidor || '-'}/${dados.rg_uf || '-'}`, PAGINA.margemEsquerda + colWidth * 1.5, y4, colWidth * 0.75);
  y = desenharCampo(doc, 'EMISSÃO', dados.rg_data_emissao, PAGINA.margemEsquerda + colWidth * 2.25, y4, colWidth * 0.75);

  // Linha 2
  const y5 = y;
  desenharCampo(doc, 'TÍTULO ELEITOR', dados.titulo_eleitor, PAGINA.margemEsquerda, y5, colWidth);
  desenharCampo(doc, 'ZONA/SEÇÃO', `${dados.titulo_zona || '-'}/${dados.titulo_secao || '-'}`, PAGINA.margemEsquerda + colWidth, y5, colWidth);
  y = desenharCampo(doc, 'CERT. RESERVISTA', dados.certificado_reservista, PAGINA.margemEsquerda + colWidth * 2, y5, colWidth);

  y += 3;
  y = verificarNovaPagina(doc, y);

  // =====================
  // CONTATO E ENDEREÇO
  // =====================
  y = desenharSecao(doc, '3. CONTATO E ENDEREÇO', y);

  // Linha 1
  const y6 = y;
  desenharCampo(doc, 'E-MAIL', dados.email, PAGINA.margemEsquerda, y6, colWidth * 2);
  y = desenharCampo(doc, 'CELULAR', dados.telefone_celular, PAGINA.margemEsquerda + colWidth * 2, y6, colWidth);

  // Linha 2
  const y7 = y;
  desenharCampo(doc, 'LOGRADOURO', dados.endereco_logradouro, PAGINA.margemEsquerda, y7, colWidth * 2);
  y = desenharCampo(doc, 'Nº', dados.endereco_numero, PAGINA.margemEsquerda + colWidth * 2, y7, colWidth);

  // Linha 3
  const y8 = y;
  desenharCampo(doc, 'BAIRRO', dados.endereco_bairro, PAGINA.margemEsquerda, y8, colWidth);
  desenharCampo(doc, 'CIDADE/UF', `${dados.endereco_cidade || '-'}/${dados.endereco_uf || '-'}`, PAGINA.margemEsquerda + colWidth, y8, colWidth);
  y = desenharCampo(doc, 'CEP', dados.endereco_cep, PAGINA.margemEsquerda + colWidth * 2, y8, colWidth);

  y += 3;
  y = verificarNovaPagina(doc, y);

  // =====================
  // DOCUMENTOS PREVIDENCIÁRIOS
  // =====================
  y = desenharSecao(doc, '4. DOCUMENTOS PREVIDENCIÁRIOS', y);
  y = desenharCampo(doc, 'NIS / PIS / PASEP', dados.pis_pasep, PAGINA.margemEsquerda, y, colWidth);

  y += 3;
  y = verificarNovaPagina(doc, y);

  // =====================
  // ESCOLARIDADE / HABILITAÇÃO
  // =====================
  y = desenharSecao(doc, '5. ESCOLARIDADE / HABILITAÇÃO', y);

  // Linha 1
  const y9 = y;
  desenharCampo(doc, 'ESCOLARIDADE', dados.escolaridade, PAGINA.margemEsquerda, y9, colWidth);
  y = desenharCampo(doc, 'FORMAÇÃO', dados.formacao_academica, PAGINA.margemEsquerda + colWidth, y9, colWidth * 2);

  // Linha 2
  const y10 = y;
  desenharCampo(doc, 'INSTITUIÇÃO', dados.instituicao_ensino, PAGINA.margemEsquerda, y10, colWidth * 2);
  y = desenharCampo(doc, 'ANO CONCLUSÃO', dados.ano_conclusao?.toString(), PAGINA.margemEsquerda + colWidth * 2, y10, colWidth);

  // Linha 3
  const y11 = y;
  desenharCampo(doc, 'CONSELHO PROFISSIONAL', dados.registro_conselho, PAGINA.margemEsquerda, y11, colWidth);
  y = desenharCampo(doc, 'Nº REGISTRO', dados.conselho_numero, PAGINA.margemEsquerda + colWidth, y11, colWidth);

  // Linha 4 - CNH
  const y12 = y;
  desenharCampo(doc, 'CNH Nº', dados.cnh_numero, PAGINA.margemEsquerda, y12, colWidth);
  desenharCampo(doc, 'CATEGORIA', dados.cnh_categoria, PAGINA.margemEsquerda + colWidth, y12, colWidth);
  y = desenharCampo(doc, 'VALIDADE', dados.cnh_validade, PAGINA.margemEsquerda + colWidth * 2, y12, colWidth);

  y += 3;
  y = verificarNovaPagina(doc, y);

  // =====================
  // DADOS BANCÁRIOS
  // =====================
  y = desenharSecao(doc, '6. DADOS BANCÁRIOS', y);

  const y13 = y;
  desenharCampo(doc, 'BANCO', dados.banco_nome, PAGINA.margemEsquerda, y13, colWidth);
  desenharCampo(doc, 'AGÊNCIA', dados.banco_agencia, PAGINA.margemEsquerda + colWidth, y13, colWidth * 0.5);
  desenharCampo(doc, 'CONTA', dados.banco_conta, PAGINA.margemEsquerda + colWidth * 1.5, y13, colWidth * 0.75);
  y = desenharCampo(doc, 'TIPO', dados.banco_tipo_conta, PAGINA.margemEsquerda + colWidth * 2.25, y13, colWidth * 0.75);

  y += 3;
  y = verificarNovaPagina(doc, y, 60);

  // =====================
  // APTIDÕES E HABILIDADES
  // =====================
  y = desenharSecao(doc, '7. APTIDÕES E HABILIDADES', y);

  if (dados.habilidades && dados.habilidades.length > 0) {
    setColor(doc, CORES.texto);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const habilidadesText = dados.habilidades.join(' • ');
    const splitHabilidades = doc.splitTextToSize(habilidadesText, contentWidth);
    doc.text(splitHabilidades, PAGINA.margemEsquerda, y);
    y += splitHabilidades.length * 4 + 3;
  } else {
    y += 5;
  }

  // Idiomas
  if (dados.idiomas && dados.idiomas.length > 0) {
    setColor(doc, CORES.primaria);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('IDIOMAS:', PAGINA.margemEsquerda, y);
    setColor(doc, CORES.texto);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const idiomasText = dados.idiomas.map(i => `${i.idioma} (${i.nivel})`).join(', ');
    doc.text(idiomasText, PAGINA.margemEsquerda + 20, y);
    y += 6;
  }

  // Experiência
  if (dados.experiencia_resumo) {
    y = verificarNovaPagina(doc, y, 20);
    setColor(doc, CORES.primaria);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('RESUMO DE EXPERIÊNCIA:', PAGINA.margemEsquerda, y);
    y += 4;
    setColor(doc, CORES.texto);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const splitExp = doc.splitTextToSize(dados.experiencia_resumo, contentWidth);
    doc.text(splitExp, PAGINA.margemEsquerda, y);
    y += splitExp.length * 4 + 3;
  }

  y += 3;
  y = verificarNovaPagina(doc, y, 70);

  // =====================
  // CHECKLIST DE DOCUMENTOS
  // =====================
  y = desenharSecao(doc, '8. CHECKLIST DE DOCUMENTOS', y);

  // Documentos pessoais
  setColor(doc, CORES.primaria);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DOCUMENTOS PESSOAIS', PAGINA.margemEsquerda, y);
  y += 4;
  
  for (const item of DOCUMENTOS_CHECKLIST.pessoais) {
    y = desenharCheckbox(doc, item.label, dados[item.key as keyof PreCadastro] as boolean || false, PAGINA.margemEsquerda, y);
    y = verificarNovaPagina(doc, y);
  }

  y += 2;
  y = verificarNovaPagina(doc, y, 25);

  // Documentos de escolaridade
  setColor(doc, CORES.primaria);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('ESCOLARIDADE / HABILITAÇÃO', PAGINA.margemEsquerda, y);
  y += 4;
  
  for (const item of DOCUMENTOS_CHECKLIST.escolaridade) {
    y = desenharCheckbox(doc, item.label, dados[item.key as keyof PreCadastro] as boolean || false, PAGINA.margemEsquerda, y);
    y = verificarNovaPagina(doc, y);
  }

  y += 2;
  y = verificarNovaPagina(doc, y, 30);

  // Certidões
  setColor(doc, CORES.primaria);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('CERTIDÕES', PAGINA.margemEsquerda, y);
  y += 4;
  
  for (const item of DOCUMENTOS_CHECKLIST.certidoes) {
    y = desenharCheckbox(doc, item.label, dados[item.key as keyof PreCadastro] as boolean || false, PAGINA.margemEsquerda, y);
    y = verificarNovaPagina(doc, y);
  }

  y += 2;
  y = verificarNovaPagina(doc, y, 25);

  // Declarações
  setColor(doc, CORES.primaria);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DECLARAÇÕES', PAGINA.margemEsquerda, y);
  y += 4;
  
  for (const item of DOCUMENTOS_CHECKLIST.declaracoes) {
    y = desenharCheckbox(doc, item.label, dados[item.key as keyof PreCadastro] as boolean || false, PAGINA.margemEsquerda, y);
    y = verificarNovaPagina(doc, y);
  }

  y += 5;
  y = verificarNovaPagina(doc, y, 40);

  // =====================
  // DEPENDENTES
  // =====================
  if (dados.dependentes && dados.dependentes.length > 0) {
    y = desenharSecao(doc, '9. DEPENDENTES', y);

    for (const dep of dados.dependentes) {
      const yDep = y;
      desenharCampo(doc, 'NOME', dep.nome, PAGINA.margemEsquerda, yDep, colWidth * 1.5);
      desenharCampo(doc, 'CPF', formatCPF(dep.cpf || ''), PAGINA.margemEsquerda + colWidth * 1.5, yDep, colWidth * 0.75);
      y = desenharCampo(doc, 'PARENTESCO', dep.parentesco, PAGINA.margemEsquerda + colWidth * 2.25, yDep, colWidth * 0.75);
      y = verificarNovaPagina(doc, y);
    }
    y += 3;
  }

  // =====================
  // ASSINATURA
  // =====================
  y = verificarNovaPagina(doc, y, 50);
  y += 10;

  setColor(doc, CORES.texto);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Declaro que as informações acima prestadas são verdadeiras e assumo a responsabilidade', PAGINA.largura / 2, y, { align: 'center' });
  y += 4;
  doc.text('pela sua exatidão, sob pena de incorrer nas sanções previstas em lei.', PAGINA.largura / 2, y, { align: 'center' });

  y += 15;

  // Linha de assinatura
  setColor(doc, CORES.texto, 'draw');
  doc.line(PAGINA.margemEsquerda + 30, y, PAGINA.largura - PAGINA.margemDireita - 30, y);
  y += 5;
  doc.setFontSize(9);
  doc.text('Assinatura do(a) Candidato(a)', PAGINA.largura / 2, y, { align: 'center' });

  y += 10;

  // Data
  const dataFormatada = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`Boa Vista/RR, ${dataFormatada}`, PAGINA.largura / 2, y, { align: 'center' });

  // =====================
  // RODAPÉ
  // =====================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    setColor(doc, CORES.cinzaClaro, 'draw');
    doc.line(PAGINA.margemEsquerda, PAGINA.altura - 12, PAGINA.largura - PAGINA.margemDireita, PAGINA.altura - 12);
    
    setColor(doc, CORES.texto);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`Página ${i} de ${totalPages}`, PAGINA.largura / 2, PAGINA.altura - 8, { align: 'center' });
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, PAGINA.largura - PAGINA.margemDireita, PAGINA.altura - 8, { align: 'right' });
    doc.text(`Código: ${dados.codigo_acesso || '-'}`, PAGINA.margemEsquerda, PAGINA.altura - 8);
  }

  return doc;
}
