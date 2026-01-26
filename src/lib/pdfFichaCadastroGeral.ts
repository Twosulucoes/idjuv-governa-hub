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
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);

  // =============================================
  // PÁGINA 1 - DADOS DE IDENTIFICAÇÃO, DOCUMENTAÇÃO, ESCOLARIDADE, DADOS FUNCIONAIS
  // =============================================
  doc.addImage(fichaPage1, "JPEG", 0, 0, pageWidth, pageHeight);

  // DADOS DE IDENTIFICAÇÃO
  // Nome - campo largo (até 120mm de largura)
  const nomeCompleto = truncarTexto(doc, servidor.nome_completo?.toUpperCase() || "", 100);
  doc.text(nomeCompleto, 25, 56);
  
  // Estado Civil - na mesma linha do nome, mais à direita
  const estadoCivil = truncarTexto(doc, getEstadoCivilLabel(servidor.estado_civil), 30);
  doc.text(estadoCivil, 130, 56);
  
  // Sexo - campo separado na próxima área
  doc.text(getSexoLabel(servidor.sexo), 25, 63);
  
  // Raça/Cor
  const racaCor = truncarTexto(doc, servidor.raca_cor?.toUpperCase() || "", 25);
  doc.text(racaCor, 65, 63);
  
  // PCD - Marcar checkbox SIM ou NÃO conforme valor
  if (servidor.pcd) {
    doc.text("X", 90, 63); // SIM
  } else {
    doc.text("X", 100, 63); // NÃO
  }
  
  // Nacionalidade
  const nacionalidade = truncarTexto(doc, servidor.nacionalidade?.toUpperCase() || "BRASILEIRA", 45);
  doc.text(nacionalidade, 45, 70);
  
  // Naturalidade
  const naturalidade = servidor.naturalidade_cidade 
    ? `${servidor.naturalidade_cidade?.toUpperCase() || ""} - ${servidor.naturalidade_uf || ""}`
    : "";
  const naturalidadeTrunc = truncarTexto(doc, naturalidade, 50);
  doc.text(naturalidadeTrunc, 40, 77);
  
  // Data de Nascimento
  doc.text(formatDate(servidor.data_nascimento), 52, 84);
  
  // Nome da Mãe
  const nomeMae = truncarTexto(doc, servidor.nome_mae?.toUpperCase() || "", 95);
  doc.text(nomeMae, 45, 91);
  
  // Nome do Pai
  const nomePai = truncarTexto(doc, servidor.nome_pai?.toUpperCase() || "", 95);
  doc.text(nomePai, 45, 98);

  // DOCUMENTAÇÃO
  // CPF
  doc.text(formatCPF(servidor.cpf), 25, 112);
  
  // PIS/PASEP - posição ajustada
  doc.text(servidor.pis_pasep || "", 138, 112);
  
  // Documento de Identidade (RG)
  const rg = truncarTexto(doc, servidor.rg?.toUpperCase() || "", 50);
  doc.text(rg, 52, 119);
  
  // Órgão Expedidor RG
  const rgOrgao = truncarTexto(doc, servidor.rg_orgao_expedidor?.toUpperCase() || "", 35);
  doc.text(rgOrgao, 112, 119);
  
  // UF RG
  doc.text(servidor.rg_uf || "", 158, 119);
  
  // Carteira de Reservista
  const reservista = truncarTexto(doc, servidor.certificado_reservista || "", 40);
  doc.text(reservista, 54, 126);
  
  // Título de Eleitor
  doc.text(servidor.titulo_eleitor || "", 50, 140);
  
  // Zona
  doc.text(servidor.titulo_zona || "", 110, 140);
  
  // Seção
  doc.text(servidor.titulo_secao || "", 138, 140);
  
  // CTPS
  doc.text(servidor.ctps_numero || "", 54, 154);
  
  // Série CTPS
  doc.text(servidor.ctps_serie || "", 112, 154);
  
  // UF CTPS
  doc.text(servidor.ctps_uf || "", 145, 154);

  // ESCOLARIDADE
  // Grau de Instrução
  const escolaridade = truncarTexto(doc, servidor.escolaridade?.toUpperCase() || "", 55);
  doc.text(escolaridade, 53, 168);
  
  // Curso - campo amplo
  const formacao = truncarTexto(doc, servidor.formacao_academica?.toUpperCase() || "", 95);
  doc.text(formacao, 28, 175);
  
  // Instituição - posição ajustada para não sobrepor
  const instituicao = truncarTexto(doc, servidor.instituicao_ensino?.toUpperCase() || "", 60);
  doc.text(instituicao, 138, 175);

  // DADOS FUNCIONAIS
  // Ocupa vaga deficiente - NÃO
  doc.text("X", 189, 189);
  
  // Lotação atual - campo amplo
  const lotacao = truncarTexto(doc, unidade?.nome?.toUpperCase() || "", 85);
  doc.text(lotacao, 43, 196);
  
  // Cargo/Função - posição ajustada
  const cargoNome = truncarTexto(doc, cargo?.nome?.toUpperCase() || "", 55);
  doc.text(cargoNome, 138, 196);
  
  // Código Cargo
  doc.text(cargo?.sigla || "", 168, 203);
  
  // Servidor quadro efetivo - NÃO
  doc.text("X", 189, 210);
  
  // Matrícula
  doc.text(servidor.matricula || "", 118, 210);
  
  // CNH
  if (servidor.cnh_numero) {
    doc.text(servidor.cnh_numero, 32, 224);
    doc.text(formatDate(servidor.cnh_validade), 85, 224);
    doc.text(servidor.cnh_categoria || "", 180, 224);
  }

  // =============================================
  // PÁGINA 2 - ESTRANGEIROS, ENDEREÇO, DADOS BANCÁRIOS
  // =============================================
  doc.addPage();
  doc.addImage(fichaPage2, "JPEG", 0, 0, pageWidth, pageHeight);

  // ENDEREÇO E CONTATOS
  // CEP
  doc.text(formatCEP(servidor.endereco_cep || ""), 25, 56);
  
  // Logradouro - truncar para não sobrepor
  const logradouro = truncarTexto(doc, servidor.endereco_logradouro?.toUpperCase() || "", 130);
  doc.text(logradouro, 58, 56);
  
  // Número
  doc.text(servidor.endereco_numero || "", 32, 63);
  
  // Bairro
  const bairro = truncarTexto(doc, servidor.endereco_bairro?.toUpperCase() || "", 50);
  doc.text(bairro, 72, 63);
  
  // Município
  const cidade = truncarTexto(doc, servidor.endereco_cidade?.toUpperCase() || "", 45);
  doc.text(cidade, 133, 63);
  
  // Complemento
  const complemento = truncarTexto(doc, servidor.endereco_complemento?.toUpperCase() || "", 110);
  doc.text(complemento, 48, 70);
  
  // Estado/UF
  doc.text(servidor.endereco_uf || "", 172, 70);
  
  // Celular
  doc.text(formatPhone(servidor.telefone_celular), 45, 77);
  
  // E-mail - truncar para caber
  const email = truncarTexto(doc, servidor.email_pessoal?.toLowerCase() || "", 95);
  doc.text(email, 88, 77);

  // DADOS BANCÁRIOS
  // Código do Banco
  doc.text(servidor.banco_codigo || "", 48, 91);
  
  // Nome do Banco
  const bancoNome = truncarTexto(doc, servidor.banco_nome?.toUpperCase() || "", 70);
  doc.text(bancoNome, 120, 91);
  
  // Agência
  doc.text(servidor.banco_agencia || "", 32, 98);
  
  // Conta Corrente
  doc.text(servidor.banco_conta || "", 108, 98);

  // Data e Local
  const dataAtual = format(new Date(), "dd/MM/yyyy", { locale: ptBR });
  doc.text(`Boa Vista/RR, ${dataAtual}`, 20, 115);

  // =============================================
  // PÁGINA 3 - DECLARAÇÃO DE GRAU DE PARENTESCO
  // =============================================
  doc.addPage();
  doc.addImage(fichaPage3, "JPEG", 0, 0, pageWidth, pageHeight);

  // Nome - campo com limite
  const nome3 = truncarTexto(doc, servidor.nome_completo?.toUpperCase() || "", 115);
  doc.text(nome3, 32, 28);
  
  // CPF
  doc.text(formatCPF(servidor.cpf), 162, 28);

  // Marcar checkbox NÃO para parentesco
  doc.text("X", 48, 93);

  // Data e Local
  doc.text(`Boa Vista/RR, ${dataAtual}`, 20, 187);

  // =============================================
  // PÁGINA 4 - DECLARAÇÃO DE ACUMULAÇÃO DE CARGOS
  // =============================================
  doc.addPage();
  doc.addImage(fichaPage4, "JPEG", 0, 0, pageWidth, pageHeight);

  // Nome
  const nome4 = truncarTexto(doc, servidor.nome_completo?.toUpperCase() || "", 150);
  doc.text(nome4, 32, 28);
  
  // CPF
  doc.text(formatCPF(servidor.cpf), 32, 35);
  
  // Cargo/Função
  const cargo4 = truncarTexto(doc, cargo?.nome?.toUpperCase() || "", 140);
  doc.text(cargo4, 48, 42);

  // Marcar NÃO ACUMULA
  doc.text("X", 16, 56);

  // Data e Local
  doc.text(`Boa Vista/RR, ${dataAtual}`, 20, 180);

  // =============================================
  // PÁGINA 5 - DECLARAÇÃO DE BENS DO SERVIDOR
  // =============================================
  doc.addPage();
  doc.addImage(fichaPage5, "JPEG", 0, 0, pageWidth, pageHeight);

  // Nome
  const nome5 = truncarTexto(doc, servidor.nome_completo?.toUpperCase() || "", 150);
  doc.text(nome5, 32, 28);
  
  // CPF
  doc.text(formatCPF(servidor.cpf), 32, 35);
  
  // Cargo/Função
  const cargo5 = truncarTexto(doc, cargo?.nome?.toUpperCase() || "", 140);
  doc.text(cargo5, 48, 42);

  // Marcar DECLARO QUE NÃO POSSUO por padrão
  doc.text("X", 75, 49);

  // Data e Local
  doc.text(`Boa Vista/RR, ${dataAtual}`, 20, 182);

  // =============================================
  // PÁGINA 6 - DECLARAÇÃO DE BENS DO CÔNJUGE
  // =============================================
  doc.addPage();
  doc.addImage(fichaPage6, "JPEG", 0, 0, pageWidth, pageHeight);

  // Nome do Servidor
  const nome6 = truncarTexto(doc, servidor.nome_completo?.toUpperCase() || "", 115);
  doc.text(nome6, 32, 28);
  
  // CPF do Servidor
  doc.text(formatCPF(servidor.cpf), 32, 35);
  
  // Cargo/Função
  const cargo6 = truncarTexto(doc, cargo?.nome?.toUpperCase() || "", 110);
  doc.text(cargo6, 68, 35);

  // Marcar DECLARO QUE NÃO POSSUO CÔNJUGE por padrão (se solteiro)
  if (servidor.estado_civil === "solteiro" || !servidor.estado_civil) {
    doc.text("X", 160, 49);
  } else {
    doc.text("X", 95, 49); // NÃO POSSUO BENS
  }

  // Data e Local
  doc.text(`Boa Vista/RR, ${dataAtual}`, 20, 182);

  // =============================================
  // PÁGINA 7 - DECLARAÇÃO DE DEPENDENTES
  // =============================================
  doc.addPage();
  doc.addImage(fichaPage7, "JPEG", 0, 0, pageWidth, pageHeight);

  // Nome do Servidor
  const nome7 = truncarTexto(doc, servidor.nome_completo?.toUpperCase() || "", 115);
  doc.text(nome7, 32, 28);
  
  // CPF do Servidor
  doc.text(formatCPF(servidor.cpf), 32, 35);
  
  // Cargo/Função
  const cargo7 = truncarTexto(doc, cargo?.nome?.toUpperCase() || "", 140);
  doc.text(cargo7, 48, 42);

  // Preencher dependentes se houver
  if (dependentes && dependentes.length > 0) {
    doc.text("X", 16, 49); // POSSUO DEPENDENTES

    const depPositions = [
      { y: 56, nomeX: 40, cpfX: 135, nascX: 158 },
      { y: 63, nomeX: 40, cpfX: 135, nascX: 158 },
      { y: 70, nomeX: 40, cpfX: 135, nascX: 158 },
      { y: 77, nomeX: 40, cpfX: 135, nascX: 158 },
    ];

    dependentes.slice(0, 4).forEach((dep, idx) => {
      const pos = depPositions[idx];
      if (!pos) return;

      // Nome do dependente - truncar
      const depNome = truncarTexto(doc, dep.nome?.toUpperCase() || "", 85);
      doc.text(depNome, pos.nomeX, pos.y);
      
      // CPF do dependente
      doc.text(formatCPF(dep.cpf || ""), pos.cpfX, pos.y);
      
      // Data de nascimento
      doc.text(formatDate(dep.data_nascimento), pos.nascX, pos.y);
    });
  } else {
    doc.text("X", 75, 49); // NÃO POSSUO DEPENDENTES
  }

  // Data e Local
  doc.text(`Boa Vista/RR, ${dataAtual}`, 20, 247);

  return doc;
}

export async function downloadFichaCadastroGeral(dados: DadosCompletos): Promise<void> {
  const doc = gerarFichaCadastroGeral(dados);
  const nomeArquivo = `Ficha_Cadastro_SEGAD_${dados.servidor.nome_completo?.replace(/\s+/g, "_") || "servidor"}.pdf`;
  doc.save(nomeArquivo);
}
