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
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  // =============================================
  // PÁGINA 1 - DADOS DE IDENTIFICAÇÃO, DOCUMENTAÇÃO, ESCOLARIDADE, DADOS FUNCIONAIS
  // =============================================
  doc.addImage(fichaPage1, "JPEG", 0, 0, pageWidth, pageHeight);

  // DADOS DE IDENTIFICAÇÃO
  // Nome (linha ~46mm do topo)
  doc.text(servidor.nome_completo?.toUpperCase() || "", 25, 56);
  
  // Estado Civil (~51mm)
  doc.text(getEstadoCivilLabel(servidor.estado_civil), 38, 63);
  
  // Raça/Cor
  doc.text("", 92, 63);
  
  // Sexo
  doc.text(getSexoLabel(servidor.sexo), 149, 56);
  
  // PCD - Marcar checkbox (posição aproximada)
  // Se não for PCD, marca NÃO
  doc.text("X", 189, 63); // NÃO
  
  // Nacionalidade
  doc.text(servidor.nacionalidade?.toUpperCase() || "BRASILEIRA", 45, 70);
  
  // Naturalidade
  const naturalidade = servidor.naturalidade_cidade 
    ? `${servidor.naturalidade_cidade?.toUpperCase() || ""} - ${servidor.naturalidade_uf || ""}`
    : "";
  doc.text(naturalidade, 40, 77);
  
  // Data de Nascimento
  doc.text(formatDate(servidor.data_nascimento), 52, 84);
  
  // Tipo Sanguíneo
  doc.text("", 178, 84);
  
  // Nome da Mãe
  doc.text("", 38, 91);
  
  // Nome do Pai
  doc.text("", 38, 98);

  // DOCUMENTAÇÃO
  // CPF
  doc.text(formatCPF(servidor.cpf), 25, 112);
  
  // PIS/PASEP
  doc.text(servidor.pis_pasep || "", 135, 112);
  
  // Documento de Identidade
  doc.text(servidor.rg?.toUpperCase() || "", 52, 119);
  
  // Órgão Expedidor RG
  doc.text(servidor.rg_orgao_expedidor?.toUpperCase() || "", 110, 119);
  
  // UF RG
  doc.text(servidor.rg_uf || "", 155, 119);
  
  // Data Expedição RG
  doc.text("", 185, 119);
  
  // Carteira de Reservista
  doc.text(servidor.certificado_reservista || "", 54, 126);
  
  // Título de Eleitor
  doc.text(servidor.titulo_eleitor || "", 50, 140);
  
  // Zona
  doc.text(servidor.titulo_zona || "", 108, 140);
  
  // Seção
  doc.text(servidor.titulo_secao || "", 133, 140);
  
  // Cidade de Votação
  doc.text("", 48, 147);
  
  // CTPS
  doc.text(servidor.ctps_numero || "", 54, 154);
  
  // Série CTPS
  doc.text(servidor.ctps_serie || "", 110, 154);
  
  // UF CTPS
  doc.text(servidor.ctps_uf || "", 140, 154);

  // ESCOLARIDADE
  // Grau de Instrução
  doc.text(servidor.escolaridade?.toUpperCase() || "", 53, 168);
  
  // Curso
  doc.text(servidor.formacao_academica?.toUpperCase() || "", 28, 175);
  
  // Instituição
  doc.text(servidor.instituicao_ensino?.toUpperCase() || "", 135, 175);

  // DADOS FUNCIONAIS
  // Ano início primeiro emprego
  doc.text("", 60, 189);
  
  // Ano fim primeiro emprego
  doc.text("", 122, 189);
  
  // Ocupa vaga deficiente - NÃO
  doc.text("X", 189, 189);
  
  // Lotação atual
  doc.text(unidade?.nome?.toUpperCase() || "", 43, 196);
  
  // Cargo/Função
  doc.text(cargo?.nome?.toUpperCase() || "", 135, 196);
  
  // Código Cargo
  doc.text(cargo?.sigla || "", 165, 203);
  
  // Servidor quadro efetivo - NÃO
  doc.text("X", 189, 210);
  
  // Matrícula
  doc.text(servidor.matricula || "", 115, 210);
  
  // CNH
  if (servidor.cnh_numero) {
    doc.text(servidor.cnh_numero, 32, 224);
    doc.text(formatDate(servidor.cnh_validade), 82, 224);
    doc.text(servidor.cnh_categoria || "", 185, 231);
  }

  // =============================================
  // PÁGINA 2 - ESTRANGEIROS, ENDEREÇO, DADOS BANCÁRIOS
  // =============================================
  doc.addPage();
  doc.addImage(fichaPage2, "JPEG", 0, 0, pageWidth, pageHeight);

  // ENDEREÇO E CONTATOS
  // CEP
  doc.text(formatCEP(servidor.endereco_cep || ""), 25, 56);
  
  // Logradouro
  doc.text(servidor.endereco_logradouro?.toUpperCase() || "", 58, 56);
  
  // Número
  doc.text(servidor.endereco_numero || "", 32, 63);
  
  // Bairro
  doc.text(servidor.endereco_bairro?.toUpperCase() || "", 70, 63);
  
  // Município
  doc.text(servidor.endereco_cidade?.toUpperCase() || "", 130, 63);
  
  // Complemento
  doc.text(servidor.endereco_complemento?.toUpperCase() || "", 45, 70);
  
  // Estado/UF
  doc.text(servidor.endereco_uf || "", 170, 70);
  
  // Celular
  doc.text(formatPhone(servidor.telefone_celular), 45, 77);
  
  // E-mail
  doc.text(servidor.email_pessoal?.toLowerCase() || "", 85, 77);

  // DADOS BANCÁRIOS
  // Código do Banco
  doc.text(servidor.banco_codigo || "", 48, 91);
  
  // Nome do Banco
  doc.text(servidor.banco_nome?.toUpperCase() || "", 118, 91);
  
  // Agência
  doc.text(servidor.banco_agencia || "", 32, 98);
  
  // Conta Corrente
  doc.text(servidor.banco_conta || "", 105, 98);

  // Data e Local
  const dataAtual = format(new Date(), "dd/MM/yyyy", { locale: ptBR });
  doc.text(`Boa Vista/RR, ${dataAtual}`, 20, 112);

  // =============================================
  // PÁGINA 3 - DECLARAÇÃO DE GRAU DE PARENTESCO
  // =============================================
  doc.addPage();
  doc.addImage(fichaPage3, "JPEG", 0, 0, pageWidth, pageHeight);

  // Nome
  doc.text(servidor.nome_completo?.toUpperCase() || "", 32, 28);
  
  // CPF
  doc.text(formatCPF(servidor.cpf), 160, 28);

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
  doc.text(servidor.nome_completo?.toUpperCase() || "", 32, 28);
  
  // CPF
  doc.text(formatCPF(servidor.cpf), 32, 35);
  
  // Cargo/Função
  doc.text(cargo?.nome?.toUpperCase() || "", 48, 42);

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
  doc.text(servidor.nome_completo?.toUpperCase() || "", 32, 28);
  
  // CPF
  doc.text(formatCPF(servidor.cpf), 32, 35);
  
  // Cargo/Função
  doc.text(cargo?.nome?.toUpperCase() || "", 48, 42);

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
  doc.text(servidor.nome_completo?.toUpperCase() || "", 32, 28);
  
  // CPF do Servidor
  doc.text(formatCPF(servidor.cpf), 32, 35);
  
  // Cargo/Função
  doc.text(cargo?.nome?.toUpperCase() || "", 65, 35);

  // Nome do Cônjuge - deixar em branco
  // CPF do Cônjuge - deixar em branco

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
  doc.text(servidor.nome_completo?.toUpperCase() || "", 32, 28);
  
  // CPF do Servidor
  doc.text(formatCPF(servidor.cpf), 32, 35);
  
  // Cargo/Função
  doc.text(cargo?.nome?.toUpperCase() || "", 48, 42);

  // Preencher dependentes se houver
  if (dependentes && dependentes.length > 0) {
    doc.text("X", 16, 49); // POSSUO DEPENDENTES

    const depPositions = [
      { nome: 70, cpf: 133, nasc: 70, sexo: 89, parent: 40 },
      { nome: 113, cpf: 133, nasc: 113, sexo: 132, parent: 83 },
      { nome: 156, cpf: 133, nasc: 156, sexo: 175, parent: 126 },
      { nome: 199, cpf: 133, nasc: 199, sexo: 218, parent: 169 },
    ];

    dependentes.slice(0, 4).forEach((dep, idx) => {
      const pos = depPositions[idx];
      if (!pos) return;

      // Nome do dependente
      doc.text(dep.nome?.toUpperCase() || "", 40, pos.nome - 14);
      
      // CPF do dependente
      doc.text(formatCPF(dep.cpf || ""), pos.cpf, pos.nome - 14);
      
      // Data de nascimento
      doc.text(formatDate(dep.data_nascimento), 155, pos.nome - 14);
      
      // Parentesco
      doc.text(getParentescoLabel(dep.parentesco), pos.parent, pos.nome - 7);
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
