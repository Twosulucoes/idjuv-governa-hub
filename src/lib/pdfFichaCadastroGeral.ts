import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Servidor, Dependente } from "@/types/rh";

// Importar imagens das páginas do formulário original
import fichaPage1 from "@/assets/ficha-cadastro-page1.jpg";
import fichaPage2 from "@/assets/ficha-cadastro-page2.jpg";
import fichaPage3 from "@/assets/ficha-cadastro-page3.jpg";
import fichaPage4 from "@/assets/ficha-cadastro-page4.jpg";
import fichaPage5 from "@/assets/ficha-cadastro-page5.jpg";
import fichaPage6 from "@/assets/ficha-cadastro-page6.jpg";
import fichaPage7 from "@/assets/ficha-cadastro-page7.jpg";

interface DadosCompletos {
  servidor: Servidor;
  cargo?: { nome: string; sigla?: string };
  unidade?: { nome: string; sigla?: string };
  dependentes?: Dependente[];
}

// Função para truncar texto que excede largura máxima
function truncarTexto(doc: jsPDF, texto: string, maxWidth: number): string {
  if (!texto) return "";
  const textWidth = doc.getTextWidth(texto);
  if (textWidth <= maxWidth) return texto;
  
  let truncated = texto;
  while (doc.getTextWidth(truncated + "...") > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + "...";
}

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
    "solteiro(a)": "SOLTEIRO(A)",
    "casado(a)": "CASADO(A)", 
    "divorciado(a)": "DIVORCIADO(A)",
    "viúvo(a)": "VIÚVO(A)",
    "união estável": "UNIÃO ESTÁVEL",
    "separado(a)": "SEPARADO(A)",
    solteiro: "SOLTEIRO(A)",
    casado: "CASADO(A)",
    divorciado: "DIVORCIADO(A)",
    viuvo: "VIÚVO(A)",
    uniao_estavel: "UNIÃO ESTÁVEL",
    separado: "SEPARADO(A)",
  };
  return map[estado.toLowerCase()] || estado.toUpperCase();
}

function getParentescoLabel(parentesco: string | undefined): string {
  if (!parentesco) return "";
  const map: Record<string, string> = {
    filho: "FILHO(A)",
    conjuge: "CÔNJUGE",
    companheiro: "COMPANHEIRO(A)",
    pai: "PAI",
    mae: "MÃE",
    enteado: "ENTEADO(A)",
    irmao: "IRMÃO/IRMÃ",
    neto: "NETO(A)",
    avo: "AVÔ/AVÓ",
  };
  return map[parentesco.toLowerCase()] || parentesco.toUpperCase();
}

export function gerarFichaCadastroGeral(dados: DadosCompletos): jsPDF {
  const doc = new jsPDF("p", "mm", "a4");
  const { servidor, cargo, unidade, dependentes } = dados;

  // Dimensões da página A4
  const pageWidth = 210;
  const pageHeight = 297;

  // Configuração de fonte para preenchimento
  const fontSize = 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(fontSize);
  doc.setTextColor(0, 0, 0);

  // =============================================
  // PÁGINA 1 - DADOS DE IDENTIFICAÇÃO, DOCUMENTAÇÃO, ESCOLARIDADE, DADOS FUNCIONAIS
  // =============================================
  doc.addImage(fichaPage1, "JPEG", 0, 0, pageWidth, pageHeight);

  // ===== DADOS DE IDENTIFICAÇÃO =====
  // NOME: linha após "NOME:" - campo longo (x=22, y=56)
  const nomeCompleto = truncarTexto(doc, servidor.nome_completo?.toUpperCase() || "", 85);
  doc.text(nomeCompleto, 22, 56);
  
  // SEXO: checkboxes M e F (M=184, F=195) - marcar com X
  if (servidor.sexo === "M") {
    doc.text("X", 184, 56);
  } else if (servidor.sexo === "F") {
    doc.text("X", 195, 56);
  }
  
  // ESTADO CIVIL: campo após label (x=50, y=63)
  const estadoCivil = truncarTexto(doc, getEstadoCivilLabel(servidor.estado_civil), 35);
  doc.text(estadoCivil, 50, 63);
  
  // RAÇA/COR: campo após label (x=115, y=63)
  const racaCor = truncarTexto(doc, servidor.raca_cor?.toUpperCase() || "", 28);
  doc.text(racaCor, 115, 63);
  
  // P.C.D: checkboxes SIM (175) e NÃO (197)
  if (servidor.pcd) {
    doc.text("X", 175, 63);
  } else {
    doc.text("X", 197, 63);
  }
  
  // NACIONALIDADE: (x=50, y=70)
  const nacionalidade = truncarTexto(doc, servidor.nacionalidade?.toUpperCase() || "BRASILEIRA", 55);
  doc.text(nacionalidade, 50, 70);
  
  // TIPO: tipo de deficiência (x=160, y=70)
  if (servidor.pcd && servidor.pcd_tipo) {
    const pcdTipo = truncarTexto(doc, servidor.pcd_tipo?.toUpperCase() || "", 35);
    doc.text(pcdTipo, 160, 70);
  }
  
  // NATURALIDADE: (x=50, y=77)
  const naturalidade = servidor.naturalidade_cidade 
    ? `${servidor.naturalidade_cidade?.toUpperCase() || ""} - ${servidor.naturalidade_uf || ""}`
    : "";
  const naturalidadeTrunc = truncarTexto(doc, naturalidade, 55);
  doc.text(naturalidadeTrunc, 50, 77);
  
  // POSSUI MOLÉSTIA GRAVE?: checkboxes SIM (186) e NÃO (202)
  doc.text("X", 202, 77); // NÃO por padrão
  
  // DATA DE NASCIMENTO: (x=60, y=84)
  doc.text(formatDate(servidor.data_nascimento), 60, 84);
  
  // TIPO SANGUÍNEO/RH: (x=157, y=84)
  const tipoSanguineo = servidor.tipo_sanguineo?.toUpperCase() || "";
  doc.text(tipoSanguineo, 157, 84);
  
  // NOME DA MÃE: (x=45, y=91)
  const nomeMae = truncarTexto(doc, servidor.nome_mae?.toUpperCase() || "", 60);
  doc.text(nomeMae, 45, 91);
  
  // NOME DO PAI: (x=145, y=91)
  const nomePai = truncarTexto(doc, servidor.nome_pai?.toUpperCase() || "", 52);
  doc.text(nomePai, 145, 91);

  // ===== DOCUMENTAÇÃO =====
  // CPF: (x=22, y=112)
  doc.text(formatCPF(servidor.cpf), 22, 112);
  
  // PIS/PASEP: (x=115, y=112)
  doc.text(servidor.pis_pasep || "", 115, 112);
  
  // DOC. DE IDENTIDADE N.: (x=55, y=120)
  const rg = truncarTexto(doc, servidor.rg || "", 35);
  doc.text(rg, 55, 120);
  
  // ÓRGÃO EXPEDIDOR/UF: (x=135, y=120)
  const rgOrgaoUf = `${servidor.rg_orgao_expedidor || ""} / ${servidor.rg_uf || ""}`;
  doc.text(truncarTexto(doc, rgOrgaoUf, 25), 135, 120);
  
  // DATA DE EXPEDIÇÃO RG: (x=178, y=120)
  doc.text(formatDate(servidor.rg_data_emissao), 178, 120);
  
  // CART. DE RESERVISTA N.: (x=55, y=128)
  const reservista = truncarTexto(doc, servidor.certificado_reservista || "", 35);
  doc.text(reservista, 55, 128);
  
  // ÓRGÃO EXPEDIDOR RESERVISTA: (x=135, y=128)
  doc.text(servidor.reservista_orgao || "", 135, 128);
  
  // DATA DE EXPEDIÇÃO RESERVISTA: (x=178, y=128)
  doc.text(formatDate(servidor.reservista_data_emissao), 178, 128);
  
  // CATEGORIA DA RESERVA: (x=55, y=136)
  doc.text(servidor.reservista_categoria || "", 55, 136);
  
  // ANO DE RESERVA: (x=178, y=136)
  doc.text(servidor.reservista_ano?.toString() || "", 178, 136);
  
  // TÍTULO DE ELEITOR N.: (x=55, y=144)
  doc.text(servidor.titulo_eleitor || "", 55, 144);
  
  // SEÇÃO: (x=120, y=144)
  doc.text(servidor.titulo_secao || "", 120, 144);
  
  // ZONA: (x=150, y=144)
  doc.text(servidor.titulo_zona || "", 150, 144);
  
  // DATA DE EXPEDIÇÃO TÍTULO: (x=178, y=144)
  doc.text(formatDate(servidor.titulo_data_emissao), 178, 144);
  
  // CIDADE DE VOTAÇÃO: (x=50, y=152)
  const cidadeVotacao = truncarTexto(doc, servidor.titulo_cidade_votacao || "", 40);
  doc.text(cidadeVotacao, 50, 152);
  
  // UF VOTAÇÃO: (x=178, y=152)
  doc.text(servidor.titulo_uf_votacao || "", 178, 152);
  
  // CARTEIRA DE TRABALHO: (x=55, y=160)
  doc.text(servidor.ctps_numero || "", 55, 160);
  
  // SÉRIE DA CTPS: (x=120, y=160)
  doc.text(servidor.ctps_serie || "", 120, 160);
  
  // UF CTPS: (x=150, y=160)
  doc.text(servidor.ctps_uf || "", 150, 160);
  
  // DATA DE EXPEDIÇÃO CTPS: (x=178, y=160)
  doc.text(formatDate(servidor.ctps_data_emissao), 178, 160);

  // ===== ESCOLARIDADE =====
  // GRAU DE INSTRUÇÃO: (x=68, y=175)
  const escolaridade = truncarTexto(doc, servidor.escolaridade?.toUpperCase() || "", 50);
  doc.text(escolaridade, 68, 175);
  
  // CURSO: (x=32, y=183)
  const formacao = truncarTexto(doc, servidor.formacao_academica?.toUpperCase() || "", 65);
  doc.text(formacao, 32, 183);
  
  // ÓRGÃO/INSTITUIÇÃO: (x=130, y=183)
  const instituicao = truncarTexto(doc, servidor.instituicao_ensino?.toUpperCase() || "", 60);
  doc.text(instituicao, 130, 183);

  // ===== DADOS FUNCIONAIS =====
  // ANO INÍCIO DO PRIMEIRO EMPREGO: não temos esse campo - deixar em branco
  // ANO FIM DO PRIMEIRO EMPREGO: não temos esse campo - deixar em branco
  
  // OCUPA VAGA PARA DEFICIENTE OU REABILITAÇÃO?: checkboxes SIM (186) e NÃO (202)
  if (servidor.pcd) {
    doc.text("X", 186, 198);
  } else {
    doc.text("X", 202, 198);
  }
  
  // LOTAÇÃO ATUAL: (x=50, y=206)
  const lotacao = truncarTexto(doc, unidade?.nome?.toUpperCase() || "", 55);
  doc.text(lotacao, 50, 206);
  
  // CARGO/FUNÇÃO: (x=130, y=206)
  const cargoNome = truncarTexto(doc, cargo?.nome?.toUpperCase() || "", 55);
  doc.text(cargoNome, 130, 206);
  
  // COD. CARGO/FUNÇÃO: (x=165, y=214)
  doc.text(cargo?.sigla || "", 165, 214);
  
  // SERVIDOR DO QUADRO EFETIVO?: checkboxes SIM (55) e NÃO (55, y=222 - abaixo)
  doc.text("X", 55, 222); // NÃO por padrão
  
  // MATRÍCULA: (x=120, y=218)
  doc.text(servidor.matricula || "", 120, 218);
  
  // SERVIDOR FEDERAL?: checkboxes SIM (95) e NÃO (115)
  doc.text("X", 115, 230); // NÃO por padrão
  
  // ===== CNH =====
  // CNH nº.: (x=35, y=246)
  doc.text(servidor.cnh_numero || "", 35, 246);
  
  // DATA DE VALIDADE: (x=90, y=246)
  doc.text(formatDate(servidor.cnh_validade), 90, 246);
  
  // DATA DE EXPEDIÇÃO CNH: (x=145, y=246)
  doc.text(formatDate(servidor.cnh_data_expedicao), 145, 246);
  
  // UF CNH: (x=188, y=246)
  doc.text(servidor.cnh_uf || "", 188, 246);
  
  // DATA DA PRIMEIRA HABILITAÇÃO: (x=60, y=254)
  doc.text(formatDate(servidor.cnh_primeira_habilitacao), 60, 254);
  
  // CATEGORIA DA HABILITAÇÃO: (x=135, y=254)
  doc.text(servidor.cnh_categoria || "", 135, 254);

  // =============================================
  // PÁGINA 2 - ESTRANGEIROS, ENDEREÇO, DADOS BANCÁRIOS
  // =============================================
  doc.addPage();
  doc.addImage(fichaPage2, "JPEG", 0, 0, pageWidth, pageHeight);

  // ===== ENDEREÇO E CONTATOS =====
  // CEP: (x=22, y=78)
  doc.text(formatCEP(servidor.endereco_cep || ""), 22, 78);
  
  // LOGRADOURO: (x=68, y=78)
  const logradouro = truncarTexto(doc, servidor.endereco_logradouro?.toUpperCase() || "", 110);
  doc.text(logradouro, 68, 78);
  
  // NÚMERO: (x=36, y=86)
  doc.text(servidor.endereco_numero || "", 36, 86);
  
  // BAIRRO: (x=65, y=86)
  const bairro = truncarTexto(doc, servidor.endereco_bairro?.toUpperCase() || "", 45);
  doc.text(bairro, 65, 86);
  
  // MUNICÍPIO: (x=145, y=86)
  const cidade = truncarTexto(doc, servidor.endereco_cidade?.toUpperCase() || "", 40);
  doc.text(cidade, 145, 86);
  
  // COMPLEMENTO: (x=50, y=94)
  const complemento = truncarTexto(doc, servidor.endereco_complemento?.toUpperCase() || "", 80);
  doc.text(complemento, 50, 94);
  
  // ESTADO/UF: (x=175, y=94)
  doc.text(servidor.endereco_uf || "", 175, 94);
  
  // CELULAR (DDD): (x=50, y=102)
  doc.text(formatPhone(servidor.telefone_celular), 50, 102);
  
  // E-MAIL: (x=100, y=102)
  const email = truncarTexto(doc, servidor.email_pessoal?.toLowerCase() || "", 85);
  doc.text(email, 100, 102);

  // ===== DADOS BANCÁRIOS =====
  // CÓDIGO DO BANCO: (x=52, y=123)
  doc.text(servidor.banco_codigo || "", 52, 123);
  
  // NOME DO BANCO: (x=95, y=123)
  const bancoNome = truncarTexto(doc, servidor.banco_nome?.toUpperCase() || "", 85);
  doc.text(bancoNome, 95, 123);
  
  // AGÊNCIA: (x=36, y=131)
  doc.text(servidor.banco_agencia || "", 36, 131);
  
  // CONTA CORRENTE: (x=95, y=131)
  doc.text(servidor.banco_conta || "", 95, 131);

  // DATA E LOCAL
  const dataAtual = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  doc.text(`Boa Vista-RR, ${dataAtual}`, 28, 152);

  // =============================================
  // PÁGINA 3 - DECLARAÇÃO DE GRAU DE PARENTESCO
  // =============================================
  doc.addPage();
  doc.addImage(fichaPage3, "JPEG", 0, 0, pageWidth, pageHeight);

  // Nome do servidor (campo após "Eu,")
  const nome3 = truncarTexto(doc, servidor.nome_completo?.toUpperCase() || "", 95);
  doc.text(nome3, 20, 28);
  
  // CPF
  doc.text(formatCPF(servidor.cpf), 155, 28);

  // Checkbox NÃO para parentesco (posição aproximada)
  doc.text("X", 40, 97);

  // Data e Local
  doc.text(`Boa Vista-RR, ${dataAtual}`, 20, 190);

  // =============================================
  // PÁGINA 4 - DECLARAÇÃO DE ACUMULAÇÃO DE CARGOS
  // =============================================
  doc.addPage();
  doc.addImage(fichaPage4, "JPEG", 0, 0, pageWidth, pageHeight);

  // Nome
  const nome4 = truncarTexto(doc, servidor.nome_completo?.toUpperCase() || "", 130);
  doc.text(nome4, 20, 28);
  
  // CPF
  doc.text(formatCPF(servidor.cpf), 20, 36);
  
  // Cargo/Função
  const cargo4 = truncarTexto(doc, cargo?.nome?.toUpperCase() || "", 120);
  doc.text(cargo4, 50, 44);

  // Checkbox NÃO ACUMULA
  doc.text("X", 15, 58);

  // Data e Local
  doc.text(`Boa Vista-RR, ${dataAtual}`, 20, 185);

  // =============================================
  // PÁGINA 5 - DECLARAÇÃO DE BENS DO SERVIDOR
  // =============================================
  doc.addPage();
  doc.addImage(fichaPage5, "JPEG", 0, 0, pageWidth, pageHeight);

  // Nome
  const nome5 = truncarTexto(doc, servidor.nome_completo?.toUpperCase() || "", 130);
  doc.text(nome5, 20, 28);
  
  // CPF
  doc.text(formatCPF(servidor.cpf), 20, 36);
  
  // Cargo/Função
  const cargo5 = truncarTexto(doc, cargo?.nome?.toUpperCase() || "", 120);
  doc.text(cargo5, 50, 44);

  // Checkbox DECLARO QUE NÃO POSSUO por padrão
  doc.text("X", 70, 52);

  // Data e Local
  doc.text(`Boa Vista-RR, ${dataAtual}`, 20, 185);

  // =============================================
  // PÁGINA 6 - DECLARAÇÃO DE BENS DO CÔNJUGE
  // =============================================
  doc.addPage();
  doc.addImage(fichaPage6, "JPEG", 0, 0, pageWidth, pageHeight);

  // Nome do Servidor
  const nome6 = truncarTexto(doc, servidor.nome_completo?.toUpperCase() || "", 95);
  doc.text(nome6, 20, 28);
  
  // CPF do Servidor
  doc.text(formatCPF(servidor.cpf), 20, 36);
  
  // Cargo/Função
  const cargo6 = truncarTexto(doc, cargo?.nome?.toUpperCase() || "", 90);
  doc.text(cargo6, 65, 36);

  // Checkbox - depende do estado civil
  const estadoCivilLower = servidor.estado_civil?.toLowerCase() || "";
  if (estadoCivilLower.includes("solteiro") || !servidor.estado_civil) {
    doc.text("X", 155, 52); // NÃO POSSUO CÔNJUGE
  } else {
    doc.text("X", 90, 52); // NÃO POSSUO BENS
  }

  // Data e Local
  doc.text(`Boa Vista-RR, ${dataAtual}`, 20, 185);

  // =============================================
  // PÁGINA 7 - DECLARAÇÃO DE DEPENDENTES
  // =============================================
  doc.addPage();
  doc.addImage(fichaPage7, "JPEG", 0, 0, pageWidth, pageHeight);

  // Nome do Servidor
  const nome7 = truncarTexto(doc, servidor.nome_completo?.toUpperCase() || "", 95);
  doc.text(nome7, 20, 28);
  
  // CPF do Servidor
  doc.text(formatCPF(servidor.cpf), 20, 36);
  
  // Cargo/Função
  const cargo7 = truncarTexto(doc, cargo?.nome?.toUpperCase() || "", 120);
  doc.text(cargo7, 50, 44);

  // Preencher dependentes se houver
  if (dependentes && dependentes.length > 0) {
    doc.text("X", 15, 52); // POSSUO DEPENDENTES

    // Posições das linhas de dependentes (4 linhas disponíveis)
    const depPositions = [
      { y: 60 },
      { y: 68 },
      { y: 76 },
      { y: 84 },
    ];

    dependentes.slice(0, 4).forEach((dep, idx) => {
      const pos = depPositions[idx];
      if (!pos) return;

      // Nome do dependente
      const depNome = truncarTexto(doc, dep.nome?.toUpperCase() || "", 70);
      doc.text(depNome, 35, pos.y);
      
      // CPF do dependente
      doc.text(formatCPF(dep.cpf || ""), 125, pos.y);
      
      // Data de nascimento
      doc.text(formatDate(dep.data_nascimento), 165, pos.y);
    });
  } else {
    doc.text("X", 70, 52); // NÃO POSSUO DEPENDENTES
  }

  // Data e Local
  doc.text(`Boa Vista-RR, ${dataAtual}`, 20, 250);

  return doc;
}

export async function downloadFichaCadastroGeral(dados: DadosCompletos): Promise<void> {
  const doc = gerarFichaCadastroGeral(dados);
  const nomeArquivo = `Ficha_Cadastro_SEGAD_${dados.servidor.nome_completo?.replace(/\s+/g, "_") || "servidor"}.pdf`;
  doc.save(nomeArquivo);
}
