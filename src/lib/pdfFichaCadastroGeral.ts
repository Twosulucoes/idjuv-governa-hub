import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Servidor, Dependente } from "@/types/rh";

interface DadosCompletos {
  servidor: Servidor;
  cargo?: { nome: string; sigla?: string };
  unidade?: { nome: string; sigla?: string };
  dependentes?: Dependente[];
}

const MARGIN_LEFT = 15;
const MARGIN_RIGHT = 15;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

function formatCPF(cpf: string): string {
  if (!cpf) return "";
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return cpf;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
}

function formatCEP(cep: string): string {
  if (!cep) return "";
  const clean = cep.replace(/\D/g, "");
  if (clean.length !== 8) return cep;
  return `${clean.slice(0, 5)}-${clean.slice(5)}`;
}

function formatDate(date: string | undefined): string {
  if (!date) return "";
  try {
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return date;
  }
}

function formatPhone(phone: string | undefined): string {
  if (!phone) return "";
  const clean = phone.replace(/\D/g, "");
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  }
  if (clean.length === 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  }
  return phone;
}

function getSexoLabel(sexo: string | undefined): string {
  if (!sexo) return "";
  switch (sexo) {
    case "M": return "MASCULINO";
    case "F": return "FEMININO";
    case "O": return "OUTRO";
    default: return sexo;
  }
}

function getEstadoCivilLabel(estado: string | undefined): string {
  if (!estado) return "";
  const map: Record<string, string> = {
    solteiro: "SOLTEIRO(A)",
    casado: "CASADO(A)",
    divorciado: "DIVORCIADO(A)",
    viuvo: "VIÚVO(A)",
    uniao_estavel: "UNIÃO ESTÁVEL",
    separado: "SEPARADO(A)",
  };
  return map[estado.toLowerCase()] || estado.toUpperCase();
}

export function gerarFichaCadastroGeral(dados: DadosCompletos): jsPDF {
  const doc = new jsPDF("p", "mm", "a4");
  const { servidor, cargo, unidade, dependentes } = dados;

  let y = 15;

  // =============================================
  // CABEÇALHO
  // =============================================
  doc.setFillColor(0, 80, 120);
  doc.rect(0, 0, 210, 25, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("FICHA DE CADASTRO", 105, 12, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("INSTITUTO DE DESENVOLVIMENTO DA JUVENTUDE - IDJUV/RR", 105, 19, { align: "center" });

  y = 30;

  // =============================================
  // DOCUMENTAÇÃO NECESSÁRIA
  // =============================================
  doc.setTextColor(0, 0, 0);
  doc.setFillColor(240, 240, 240);
  doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 6, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("DOCUMENTAÇÃO NECESSÁRIA PARA EFETIVAÇÃO DO CADASTRO JUNTO À SEGAD/RR:", MARGIN_LEFT + 2, y + 4);

  y += 8;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  const docs = [
    "1. CÓPIAS DO TITULAR: DOC. IDENTIDADE, CPF, TÍTULO DE ELEITOR, PIS/PASEP, COMPROVANTE DE CONTA BANCÁRIA, COMPROVANTE DE RESIDÊNCIA,",
    "   FOTO 3X4, CERTIFICADO DE ESCOLARIDADE, CERTIDÃO DE CASAMENTO (SE CASADO), CARTEIRA DE RESERVISTA (SEXO MASCULINO),",
    "   CARTEIRA DE TRABALHO (APENAS PARA EMPREGADO PÚBLICO) E CNH (APENAS MOTORISTAS).",
    "2. DOC. IDENTIDADE OU CERTIDÃO DE NASCIMENTO E CPF PARA OS DEPENDENTES.",
    "3. COMPROVANTE DE REGULARIDADE CADASTRAL NO E-SOCIAL: http://consultacadastral.inss.gov.br/Esocial/pages/index.xhtml"
  ];
  docs.forEach((line) => {
    doc.text(line, MARGIN_LEFT + 2, y);
    y += 3;
  });

  y += 4;

  // =============================================
  // DADOS DE IDENTIFICAÇÃO
  // =============================================
  doc.setFillColor(0, 80, 120);
  doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS DE IDENTIFICAÇÃO", MARGIN_LEFT + 2, y + 4);

  y += 8;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);

  // Função auxiliar para desenhar campo
  const drawField = (label: string, value: string, x: number, width: number, currentY: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(label, x, currentY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.rect(x, currentY + 1, width, 5);
    doc.text(value || "", x + 1, currentY + 4.5);
  };

  // Nome
  drawField("NOME:", servidor.nome_completo?.toUpperCase() || "", MARGIN_LEFT, CONTENT_WIDTH, y);
  y += 9;

  // Estado Civil, Raça/Cor, Sexo, PCD
  const col1W = 45;
  const col2W = 35;
  const col3W = 45;
  const col4W = CONTENT_WIDTH - col1W - col2W - col3W;

  drawField("ESTADO CIVIL:", getEstadoCivilLabel(servidor.estado_civil), MARGIN_LEFT, col1W, y);
  drawField("RAÇA/COR:", "", MARGIN_LEFT + col1W + 2, col2W, y);
  drawField("SEXO:", getSexoLabel(servidor.sexo), MARGIN_LEFT + col1W + col2W + 4, col3W, y);
  drawField("P.C.D:", "NÃO", MARGIN_LEFT + col1W + col2W + col3W + 6, col4W - 6, y);
  y += 9;

  // Nacionalidade
  drawField("NACIONALIDADE:", servidor.nacionalidade?.toUpperCase() || "BRASILEIRA", MARGIN_LEFT, CONTENT_WIDTH / 2, y);
  y += 9;

  // Naturalidade
  const naturalidade = servidor.naturalidade_cidade 
    ? `${servidor.naturalidade_cidade?.toUpperCase() || ""} - ${servidor.naturalidade_uf || ""}`
    : "";
  drawField("NATURALIDADE:", naturalidade, MARGIN_LEFT, CONTENT_WIDTH / 2, y);
  y += 9;

  // Data de Nascimento e Tipo Sanguíneo
  drawField("DATA DE NASCIMENTO:", formatDate(servidor.data_nascimento), MARGIN_LEFT, CONTENT_WIDTH / 3, y);
  drawField("TIPO SANGUÍNEO/RH:", "", MARGIN_LEFT + CONTENT_WIDTH / 3 + 5, CONTENT_WIDTH / 3, y);
  y += 9;

  // Nome da Mãe e do Pai
  drawField("NOME DA MÃE:", "", MARGIN_LEFT, CONTENT_WIDTH, y);
  y += 9;
  drawField("NOME DO PAI:", "", MARGIN_LEFT, CONTENT_WIDTH, y);
  y += 12;

  // =============================================
  // DOCUMENTAÇÃO
  // =============================================
  doc.setFillColor(0, 80, 120);
  doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("DOCUMENTAÇÃO", MARGIN_LEFT + 2, y + 4);

  y += 8;
  doc.setTextColor(0, 0, 0);

  // CPF e PIS/PASEP
  drawField("CPF:", formatCPF(servidor.cpf), MARGIN_LEFT, CONTENT_WIDTH / 2 - 5, y);
  drawField("PIS/PASEP:", servidor.pis_pasep || "", MARGIN_LEFT + CONTENT_WIDTH / 2, CONTENT_WIDTH / 2, y);
  y += 9;

  // RG
  const rgW = CONTENT_WIDTH / 4;
  drawField("DOC. DE IDENTIDADE Nº:", servidor.rg?.toUpperCase() || "", MARGIN_LEFT, rgW + 10, y);
  drawField("ÓRGÃO EXPEDIDOR:", servidor.rg_orgao_expedidor?.toUpperCase() || "", MARGIN_LEFT + rgW + 12, rgW, y);
  drawField("UF:", servidor.rg_uf || "", MARGIN_LEFT + rgW * 2 + 14, 20, y);
  drawField("DATA DE EXPEDIÇÃO:", "", MARGIN_LEFT + rgW * 2 + 36, CONTENT_WIDTH - rgW * 2 - 36, y);
  y += 9;

  // Certificado de Reservista
  drawField("CART. DE RESERVISTA Nº:", servidor.certificado_reservista || "", MARGIN_LEFT, rgW + 10, y);
  drawField("ÓRGÃO EXPEDIDOR/UF:", "", MARGIN_LEFT + rgW + 12, rgW, y);
  drawField("DATA DE EXPEDIÇÃO:", "", MARGIN_LEFT + rgW * 2 + 14, CONTENT_WIDTH - rgW * 2 - 14, y);
  y += 9;

  // Título de Eleitor
  const titW = CONTENT_WIDTH / 5;
  drawField("TÍTULO DE ELEITOR Nº:", servidor.titulo_eleitor || "", MARGIN_LEFT, titW + 15, y);
  drawField("ZONA:", servidor.titulo_zona || "", MARGIN_LEFT + titW + 17, titW - 5, y);
  drawField("SEÇÃO:", servidor.titulo_secao || "", MARGIN_LEFT + titW * 2 + 14, titW - 5, y);
  drawField("DATA DE EXPEDIÇÃO:", "", MARGIN_LEFT + titW * 3 + 11, titW + 10, y);
  y += 9;

  // Cidade de Votação
  drawField("CIDADE DE VOTAÇÃO:", "", MARGIN_LEFT, CONTENT_WIDTH / 2, y);
  drawField("UF:", "", MARGIN_LEFT + CONTENT_WIDTH / 2 + 5, 30, y);
  y += 9;

  // CTPS
  drawField("CARTEIRA DE TRABALHO:", servidor.ctps_numero || "", MARGIN_LEFT, rgW + 10, y);
  drawField("SÉRIE DA CTPS:", servidor.ctps_serie || "", MARGIN_LEFT + rgW + 12, rgW, y);
  drawField("UF:", servidor.ctps_uf || "", MARGIN_LEFT + rgW * 2 + 14, 20, y);
  drawField("DATA DE EXPEDIÇÃO:", "", MARGIN_LEFT + rgW * 2 + 36, CONTENT_WIDTH - rgW * 2 - 36, y);
  y += 12;

  // =============================================
  // ESCOLARIDADE
  // =============================================
  doc.setFillColor(0, 80, 120);
  doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("ESCOLARIDADE", MARGIN_LEFT + 2, y + 4);

  y += 8;
  doc.setTextColor(0, 0, 0);

  drawField("GRAU DE INSTRUÇÃO:", servidor.escolaridade?.toUpperCase() || "", MARGIN_LEFT, CONTENT_WIDTH / 2, y);
  y += 9;
  drawField("CURSO:", servidor.formacao_academica?.toUpperCase() || "", MARGIN_LEFT, CONTENT_WIDTH / 2, y);
  drawField("ÓRGÃO/INSTITUIÇÃO:", servidor.instituicao_ensino?.toUpperCase() || "", MARGIN_LEFT + CONTENT_WIDTH / 2 + 5, CONTENT_WIDTH / 2 - 5, y);
  y += 12;

  // =============================================
  // DADOS FUNCIONAIS
  // =============================================
  doc.setFillColor(0, 80, 120);
  doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS FUNCIONAIS", MARGIN_LEFT + 2, y + 4);

  y += 8;
  doc.setTextColor(0, 0, 0);

  // Lotação e Cargo
  const lotacao = unidade?.nome?.toUpperCase() || "";
  const cargoNome = cargo?.nome?.toUpperCase() || "";

  drawField("LOTAÇÃO ATUAL:", lotacao, MARGIN_LEFT, CONTENT_WIDTH / 2, y);
  drawField("CARGO/FUNÇÃO:", cargoNome, MARGIN_LEFT + CONTENT_WIDTH / 2 + 5, CONTENT_WIDTH / 2 - 5, y);
  y += 9;

  // Matrícula
  drawField("MATRÍCULA:", servidor.matricula || "", MARGIN_LEFT, CONTENT_WIDTH / 3, y);
  y += 9;

  // CNH
  if (servidor.cnh_numero) {
    drawField("CNH Nº:", servidor.cnh_numero || "", MARGIN_LEFT, rgW + 5, y);
    drawField("DATA DE VALIDADE:", formatDate(servidor.cnh_validade), MARGIN_LEFT + rgW + 7, rgW, y);
    drawField("CATEGORIA:", servidor.cnh_categoria || "", MARGIN_LEFT + rgW * 2 + 9, rgW - 5, y);
    y += 9;
  }

  // =============================================
  // PÁGINA 2 - ENDEREÇO E CONTATOS
  // =============================================
  doc.addPage();
  y = 15;

  // Cabeçalho página 2
  doc.setFillColor(0, 80, 120);
  doc.rect(0, 0, 210, 15, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("FICHA DE CADASTRO - CONTINUAÇÃO", 105, 10, { align: "center" });

  y = 20;

  // ENDEREÇO E CONTATOS
  doc.setFillColor(0, 80, 120);
  doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("ENDEREÇO E CONTATOS", MARGIN_LEFT + 2, y + 4);

  y += 8;
  doc.setTextColor(0, 0, 0);

  // CEP e Logradouro
  drawField("CEP:", formatCEP(servidor.endereco_cep || ""), MARGIN_LEFT, 35, y);
  drawField("LOGRADOURO:", servidor.endereco_logradouro?.toUpperCase() || "", MARGIN_LEFT + 37, CONTENT_WIDTH - 37, y);
  y += 9;

  // Número, Bairro, Município
  const addrCol = CONTENT_WIDTH / 4;
  drawField("NÚMERO:", servidor.endereco_numero || "", MARGIN_LEFT, addrCol - 5, y);
  drawField("BAIRRO:", servidor.endereco_bairro?.toUpperCase() || "", MARGIN_LEFT + addrCol - 3, addrCol + 10, y);
  drawField("MUNICÍPIO:", servidor.endereco_cidade?.toUpperCase() || "", MARGIN_LEFT + addrCol * 2 + 9, addrCol + 10, y);
  y += 9;

  // Complemento e Estado
  drawField("COMPLEMENTO:", servidor.endereco_complemento?.toUpperCase() || "", MARGIN_LEFT, CONTENT_WIDTH / 2, y);
  drawField("ESTADO/UF:", servidor.endereco_uf || "", MARGIN_LEFT + CONTENT_WIDTH / 2 + 5, 30, y);
  y += 9;

  // Celular e E-mail
  drawField("CELULAR (DDD):", formatPhone(servidor.telefone_celular), MARGIN_LEFT, CONTENT_WIDTH / 3, y);
  drawField("E-MAIL:", servidor.email_pessoal?.toLowerCase() || "", MARGIN_LEFT + CONTENT_WIDTH / 3 + 5, CONTENT_WIDTH * 2 / 3 - 5, y);
  y += 12;

  // =============================================
  // DADOS BANCÁRIOS
  // =============================================
  doc.setFillColor(0, 80, 120);
  doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("DADOS BANCÁRIOS", MARGIN_LEFT + 2, y + 4);

  y += 8;
  doc.setTextColor(0, 0, 0);

  drawField("CÓDIGO DO BANCO:", servidor.banco_codigo || "", MARGIN_LEFT, CONTENT_WIDTH / 4, y);
  drawField("NOME DO BANCO:", servidor.banco_nome?.toUpperCase() || "", MARGIN_LEFT + CONTENT_WIDTH / 4 + 5, CONTENT_WIDTH * 3 / 4 - 5, y);
  y += 9;

  drawField("AGÊNCIA:", servidor.banco_agencia || "", MARGIN_LEFT, CONTENT_WIDTH / 3, y);
  drawField("CONTA CORRENTE:", servidor.banco_conta || "", MARGIN_LEFT + CONTENT_WIDTH / 3 + 5, CONTENT_WIDTH / 3, y);
  drawField("TIPO:", servidor.banco_tipo_conta?.toUpperCase() || "CORRENTE", MARGIN_LEFT + CONTENT_WIDTH * 2 / 3 + 10, CONTENT_WIDTH / 3 - 10, y);
  y += 15;

  // =============================================
  // DATA, LOCAL E ASSINATURA
  // =============================================
  const dataAtual = format(new Date(), "'Boa Vista/RR, 'dd' de 'MMMM' de 'yyyy", { locale: ptBR });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(dataAtual, MARGIN_LEFT, y);

  y += 20;
  doc.line(MARGIN_LEFT + 30, y, MARGIN_LEFT + CONTENT_WIDTH - 30, y);
  y += 4;
  doc.setFontSize(8);
  doc.text("ASSINATURA DO(A) SERVIDOR(A)", 105, y, { align: "center" });

  // =============================================
  // PÁGINA 3 - DECLARAÇÃO DE GRAU DE PARENTESCO
  // =============================================
  doc.addPage();
  y = 15;

  doc.setFillColor(0, 80, 120);
  doc.rect(0, 0, 210, 15, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("2. DECLARAÇÃO DE GRAU DE PARENTESCO", 105, 10, { align: "center" });

  y = 25;
  doc.setTextColor(0, 0, 0);

  drawField("NOME:", servidor.nome_completo?.toUpperCase() || "", MARGIN_LEFT, CONTENT_WIDTH / 2, y);
  drawField("CPF:", formatCPF(servidor.cpf), MARGIN_LEFT + CONTENT_WIDTH / 2 + 5, CONTENT_WIDTH / 2 - 5, y);
  y += 12;

  // Vínculo Funcional
  doc.setFillColor(240, 240, 240);
  doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 6, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("VÍNCULO FUNCIONAL DO SERVIDOR", MARGIN_LEFT + 2, y + 4);
  y += 10;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("[ ] Efetivo ocupante de função de confiança ou cargo em comissão", MARGIN_LEFT, y);
  y += 5;
  doc.text("[ ] Ocupante de função de confiança ou cargo em comissão", MARGIN_LEFT, y);
  y += 5;
  doc.text("[ ] Requisitado ou cedido (à disposição, ocupante de cargo em comissão)", MARGIN_LEFT, y);
  y += 10;

  // Pergunta sobre parentesco
  doc.setFontSize(7);
  const textoParentesco = "Possui grau de parentesco, na linha reta, colateral ou por afinidade, até o terceiro grau, com o Governador, Secretário de Estado, Diretor ou Presidente de Autarquia, ou Fundação Estadual, com Diretor de sociedade de Economia Mista ou Empresa Pública Estadual, ou Chefe de Coordenadoria Estadual ou com qualquer ocupante de cargos de provimento em comissão ou função gratificada?";
  const linhasParentesco = doc.splitTextToSize(textoParentesco, CONTENT_WIDTH);
  doc.text(linhasParentesco, MARGIN_LEFT, y);
  y += linhasParentesco.length * 3.5 + 3;

  doc.setFontSize(9);
  doc.text("[ ] SIM     [X] NÃO", MARGIN_LEFT, y);
  y += 15;

  // Tabela de parentes
  doc.setFillColor(240, 240, 240);
  doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH / 4, 6, "F");
  doc.rect(MARGIN_LEFT + CONTENT_WIDTH / 4, y, CONTENT_WIDTH / 4, 6, "F");
  doc.rect(MARGIN_LEFT + CONTENT_WIDTH / 2, y, CONTENT_WIDTH / 4, 6, "F");
  doc.rect(MARGIN_LEFT + CONTENT_WIDTH * 3 / 4, y, CONTENT_WIDTH / 4, 6, "F");

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("NOME DO PARENTE", MARGIN_LEFT + 2, y + 4);
  doc.text("CARGO", MARGIN_LEFT + CONTENT_WIDTH / 4 + 2, y + 4);
  doc.text("RELAÇÃO DE PARENTESCO", MARGIN_LEFT + CONTENT_WIDTH / 2 + 2, y + 4);
  doc.text("ÓRGÃO", MARGIN_LEFT + CONTENT_WIDTH * 3 / 4 + 2, y + 4);

  y += 6;
  // Linhas em branco para preenchimento
  for (let i = 0; i < 3; i++) {
    doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH / 4, 6);
    doc.rect(MARGIN_LEFT + CONTENT_WIDTH / 4, y, CONTENT_WIDTH / 4, 6);
    doc.rect(MARGIN_LEFT + CONTENT_WIDTH / 2, y, CONTENT_WIDTH / 4, 6);
    doc.rect(MARGIN_LEFT + CONTENT_WIDTH * 3 / 4, y, CONTENT_WIDTH / 4, 6);
    y += 6;
  }

  y += 10;

  // Observações sobre parentesco
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.text("* Parente em linha reta (bisavô(ó), avô(ó), pai, mãe, filho(a), neto(a), bisneto(a))", MARGIN_LEFT, y);
  y += 3.5;
  doc.text("** Parente em linha colateral (tio, tia, irmão, irmã, sobrinho, sobrinha)", MARGIN_LEFT, y);
  y += 3.5;
  doc.text("*** Parente por afinidade (sogro, sogra, genro, nora, cunhado, cunhada)", MARGIN_LEFT, y);

  y += 15;
  doc.setFont("helvetica", "normal");
  doc.text(dataAtual, MARGIN_LEFT, y);

  y += 20;
  doc.line(MARGIN_LEFT + 30, y, MARGIN_LEFT + CONTENT_WIDTH - 30, y);
  y += 4;
  doc.setFontSize(8);
  doc.text("ASSINATURA DO SERVIDOR", 105, y, { align: "center" });

  // =============================================
  // PÁGINA 4 - DECLARAÇÃO DE ACUMULAÇÃO DE CARGOS
  // =============================================
  doc.addPage();
  y = 15;

  doc.setFillColor(0, 80, 120);
  doc.rect(0, 0, 210, 15, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("3. DECLARAÇÃO DE ACUMULAÇÃO DE CARGOS, EMPREGOS OU FUNÇÕES PÚBLICAS", 105, 10, { align: "center" });

  y = 25;
  doc.setTextColor(0, 0, 0);

  drawField("NOME:", servidor.nome_completo?.toUpperCase() || "", MARGIN_LEFT, CONTENT_WIDTH, y);
  y += 9;
  drawField("CPF:", formatCPF(servidor.cpf), MARGIN_LEFT, CONTENT_WIDTH / 3, y);
  drawField("CARGO/FUNÇÃO:", cargo?.nome?.toUpperCase() || "", MARGIN_LEFT + CONTENT_WIDTH / 3 + 5, CONTENT_WIDTH * 2 / 3 - 5, y);
  y += 12;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("DECLARA À SECRETARIA DE ESTADO DA GESTÃO ESTRATÉGICA E ADMINISTRAÇÃO PARA FINS DE", MARGIN_LEFT, y);
  y += 4;
  doc.text("OCUPAÇÃO DE CARGO, EMPREGO OU FUNÇÃO PÚBLICA QUE:", MARGIN_LEFT, y);
  y += 10;

  const acumula = servidor.acumula_cargo;
  doc.setFontSize(9);
  doc.text(`[${acumula ? " " : "X"}] NÃO ACUMULA CARGOS, EMPREGOS OU FUNÇÕES PÚBLICAS`, MARGIN_LEFT, y);
  y += 6;
  doc.text(`[${acumula ? "X" : " "}] ACUMULA CARGOS, EMPREGOS OU FUNÇÕES PÚBLICAS`, MARGIN_LEFT, y);

  if (acumula && servidor.acumulo_descricao) {
    y += 8;
    doc.setFontSize(8);
    const descAcumulo = doc.splitTextToSize(servidor.acumulo_descricao, CONTENT_WIDTH);
    doc.text(descAcumulo, MARGIN_LEFT, y);
    y += descAcumulo.length * 4;
  }

  y += 20;
  doc.setFontSize(7);
  doc.text("DECLARO SOB AS PENALIDADES LEGAIS QUE AS INFORMAÇÕES AQUI PRESTADAS SÃO VERDADEIRAS E DE MINHA INTEIRA RESPONSABILIDADE.", MARGIN_LEFT, y);

  y += 15;
  doc.setFontSize(9);
  doc.text(dataAtual, MARGIN_LEFT, y);

  y += 20;
  doc.line(MARGIN_LEFT + 30, y, MARGIN_LEFT + CONTENT_WIDTH - 30, y);
  y += 4;
  doc.setFontSize(8);
  doc.text("ASSINATURA DO(A) SERVIDOR(A) DECLARANTE", 105, y, { align: "center" });

  // =============================================
  // PÁGINA 5 - DECLARAÇÃO DE BENS
  // =============================================
  doc.addPage();
  y = 15;

  doc.setFillColor(0, 80, 120);
  doc.rect(0, 0, 210, 15, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("4. DECLARAÇÃO DE BENS DO SERVIDOR", 105, 10, { align: "center" });

  y = 25;
  doc.setTextColor(0, 0, 0);

  drawField("NOME:", servidor.nome_completo?.toUpperCase() || "", MARGIN_LEFT, CONTENT_WIDTH, y);
  y += 9;
  drawField("CPF:", formatCPF(servidor.cpf), MARGIN_LEFT, CONTENT_WIDTH / 3, y);
  drawField("CARGO/FUNÇÃO:", cargo?.nome?.toUpperCase() || "", MARGIN_LEFT + CONTENT_WIDTH / 3 + 5, CONTENT_WIDTH * 2 / 3 - 5, y);
  y += 12;

  doc.setFontSize(9);
  doc.text("[ ] DECLARO QUE POSSUO BENS       [X] DECLARO QUE NÃO POSSUO BENS", MARGIN_LEFT, y);
  y += 10;

  // Tabela de bens
  doc.setFillColor(240, 240, 240);
  doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH * 2 / 3, 6, "F");
  doc.rect(MARGIN_LEFT + CONTENT_WIDTH * 2 / 3, y, CONTENT_WIDTH / 3, 6, "F");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("DISCRIMINAÇÃO", MARGIN_LEFT + 2, y + 4);
  doc.text("VALOR EM R$", MARGIN_LEFT + CONTENT_WIDTH * 2 / 3 + 2, y + 4);

  y += 6;
  for (let i = 0; i < 6; i++) {
    doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH * 2 / 3, 6);
    doc.rect(MARGIN_LEFT + CONTENT_WIDTH * 2 / 3, y, CONTENT_WIDTH / 3, 6);
    y += 6;
  }

  y += 10;
  doc.setFontSize(6);
  doc.setFont("helvetica", "italic");
  const textoBens = "CONFORME LEI 8429/92: ART. 13 A POSSE E O EXERCÍCIO DE AGENTE PÚBLICO FICAM CONDICIONADOS À APRESENTAÇÃO DE DECLARAÇÃO DE BENS E VALORES QUE COMPÕEM O SEU PATRIMÔNIO PRIVADO, A FIM DE SER ARQUIVADA NO SERVIÇO DE PESSOAL COMPETENTE...";
  const linhasBens = doc.splitTextToSize(textoBens, CONTENT_WIDTH);
  doc.text(linhasBens, MARGIN_LEFT, y);

  y += linhasBens.length * 2.5 + 15;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(dataAtual, MARGIN_LEFT, y);

  y += 20;
  doc.line(MARGIN_LEFT + 30, y, MARGIN_LEFT + CONTENT_WIDTH - 30, y);
  y += 4;
  doc.setFontSize(8);
  doc.text("ASSINATURA DO(A) SERVIDOR(A)", 105, y, { align: "center" });

  // =============================================
  // PÁGINA 6 - DECLARAÇÃO DE DEPENDENTES
  // =============================================
  doc.addPage();
  y = 15;

  doc.setFillColor(0, 80, 120);
  doc.rect(0, 0, 210, 15, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("6. DECLARAÇÃO DE DEPENDENTES PARA FINS DE IMPOSTO DE RENDA E PREVIDÊNCIA SOCIAL", 105, 10, { align: "center" });

  y = 25;
  doc.setTextColor(0, 0, 0);

  drawField("NOME:", servidor.nome_completo?.toUpperCase() || "", MARGIN_LEFT, CONTENT_WIDTH, y);
  y += 9;
  drawField("CPF:", formatCPF(servidor.cpf), MARGIN_LEFT, CONTENT_WIDTH / 3, y);
  drawField("CARGO/FUNÇÃO:", cargo?.nome?.toUpperCase() || "", MARGIN_LEFT + CONTENT_WIDTH / 3 + 5, CONTENT_WIDTH * 2 / 3 - 5, y);
  y += 12;

  const temDependentes = dependentes && dependentes.length > 0;
  doc.setFontSize(9);
  doc.text(`[${temDependentes ? "X" : " "}] POSSUO DEPENDENTE(S)     [${temDependentes ? " " : "X"}] NÃO POSSUO DEPENDENTE(S)`, MARGIN_LEFT, y);
  y += 10;

  // Dependentes
  const maxDependentes = 4;
  const depsParaExibir = dependentes?.slice(0, maxDependentes) || [];

  for (let i = 0; i < maxDependentes; i++) {
    const dep = depsParaExibir[i];

    doc.setFillColor(240, 240, 240);
    doc.rect(MARGIN_LEFT, y, CONTENT_WIDTH, 5, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(`${i + 1}`, MARGIN_LEFT + 2, y + 3.5);
    y += 5;

    doc.setFont("helvetica", "normal");
    const depColW = CONTENT_WIDTH / 3;

    drawField("NOME:", dep?.nome?.toUpperCase() || "", MARGIN_LEFT, depColW + 20, y);
    drawField("CPF:", formatCPF(dep?.cpf || ""), MARGIN_LEFT + depColW + 22, depColW - 10, y);
    drawField("DATA NASC.:", formatDate(dep?.data_nascimento), MARGIN_LEFT + depColW * 2 + 14, depColW - 14, y);
    y += 7;

    drawField("PARENTESCO:", dep?.parentesco?.toUpperCase() || "", MARGIN_LEFT, depColW, y);
    doc.setFontSize(7);
    doc.text("DECLARAR P/ IR: [ ] SIM [ ] NÃO", MARGIN_LEFT + depColW + 5, y + 4);
    doc.text("DECLARAR P/ PREV: [ ] SIM [ ] NÃO", MARGIN_LEFT + depColW * 2 + 5, y + 4);
    y += 10;
  }

  y += 5;
  doc.setFontSize(6);
  doc.setFont("helvetica", "italic");
  doc.text("DECLARO SOB AS PENALIDADES LEGAIS QUE AS INFORMAÇÕES AQUI PRESTADAS SÃO VERDADEIRAS E DE MINHA INTEIRA RESPONSABILIDADE,", MARGIN_LEFT, y);
  y += 3;
  doc.text("NÃO CABENDO À FONTE PAGADORA QUALQUER RESPONSABILIDADE PERANTE A FISCALIZAÇÃO.", MARGIN_LEFT, y);

  y += 15;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(dataAtual, MARGIN_LEFT, y);

  y += 20;
  doc.line(MARGIN_LEFT + 30, y, MARGIN_LEFT + CONTENT_WIDTH - 30, y);
  y += 4;
  doc.setFontSize(8);
  doc.text("ASSINATURA DO(A) SERVIDOR(A)", 105, y, { align: "center" });

  // Rodapé em todas as páginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(128, 128, 128);
    doc.text(`Página ${i} de ${totalPages}`, 105, 290, { align: "center" });
    doc.text("Documento gerado pelo Sistema IDJUV", 105, 294, { align: "center" });
  }

  return doc;
}

export function downloadFichaCadastroGeral(dados: DadosCompletos): void {
  const doc = gerarFichaCadastroGeral(dados);
  const nomeArquivo = `ficha-cadastro-${dados.servidor.nome_completo?.replace(/\s+/g, "-").toLowerCase() || "servidor"}.pdf`;
  doc.save(nomeArquivo);
}
