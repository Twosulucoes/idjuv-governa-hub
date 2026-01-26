import jsPDF from "jspdf";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Servidor, Dependente } from "@/types/rh";
import { SEGAD_ESTADO_CIVIL, SEGAD_TIPO_PCD, SEGAD_RACA_COR } from "@/types/rh";
import { carregarConfiguracao, CampoSegad } from "@/config/segadFieldsConfig";

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

// =============================================
// FUNÇÕES AUXILIARES
// =============================================

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

// Funções de conversão para códigos SEGAD
function getSegadEstadoCivil(valor: string | undefined): string {
  if (!valor) return "";
  const key = valor.toLowerCase().trim();
  return SEGAD_ESTADO_CIVIL[key] || valor.toUpperCase();
}

function getSegadTipoPcd(valor: string | undefined, isPcd: boolean): string {
  if (!isPcd) return "99-NÃO DEFICIENTE";
  if (!valor) return "99-NÃO DEFICIENTE";
  const key = valor.toLowerCase().trim();
  return SEGAD_TIPO_PCD[key] || valor.toUpperCase();
}

function getSegadRacaCor(valor: string | undefined): string {
  if (!valor) return "";
  const key = valor.toLowerCase().trim();
  return SEGAD_RACA_COR[key] || valor.toUpperCase();
}

// Buscar campo por ID na configuração
function getCampo(campos: CampoSegad[], id: string): CampoSegad | undefined {
  return campos.find(c => c.id === id);
}

// Renderizar texto em posição específica
function renderTexto(
  doc: jsPDF,
  campos: CampoSegad[],
  id: string,
  valor: string | undefined
): void {
  const campo = getCampo(campos, id);
  if (!campo || !valor) return;
  
  const texto = campo.maxWidth 
    ? truncarTexto(doc, valor.toUpperCase(), campo.maxWidth)
    : valor.toUpperCase();
  
  doc.text(texto, campo.x, campo.y);
}

// Renderizar checkbox com X
function renderCheckbox(doc: jsPDF, campos: CampoSegad[], id: string, marcado: boolean): void {
  const campo = getCampo(campos, id);
  if (!campo || !marcado) return;
  doc.text("X", campo.x, campo.y);
}

// =============================================
// GERADOR PRINCIPAL
// =============================================

export function gerarFichaCadastroGeral(dados: DadosCompletos): jsPDF {
  const doc = new jsPDF("p", "mm", "a4");
  const { servidor, cargo, unidade, dependentes } = dados;
  const campos = carregarConfiguracao();

  // Dimensões da página A4
  const pageWidth = 210;
  const pageHeight = 297;

  // Configuração de fonte para preenchimento
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);

  // Data atual formatada
  const dataAtual = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const dataLocalTexto = `Boa Vista-RR, ${dataAtual}`;

  // =============================================
  // PÁGINA 1 - DADOS DE IDENTIFICAÇÃO, DOCUMENTAÇÃO, ESCOLARIDADE, DADOS FUNCIONAIS
  // =============================================
  doc.addImage(fichaPage1, "JPEG", 0, 0, pageWidth, pageHeight);

  // === DADOS DE IDENTIFICAÇÃO ===
  renderTexto(doc, campos, 'nome_completo', servidor.nome_completo);
  renderCheckbox(doc, campos, 'sexo_m', servidor.sexo === "M");
  renderCheckbox(doc, campos, 'sexo_f', servidor.sexo === "F");
  renderTexto(doc, campos, 'estado_civil', getSegadEstadoCivil(servidor.estado_civil));
  renderTexto(doc, campos, 'raca_cor', getSegadRacaCor(servidor.raca_cor));
  renderCheckbox(doc, campos, 'pcd_sim', servidor.pcd === true);
  renderCheckbox(doc, campos, 'pcd_nao', servidor.pcd !== true);
  renderTexto(doc, campos, 'nacionalidade', servidor.nacionalidade || "BRASILEIRA");
  renderTexto(doc, campos, 'pcd_tipo', getSegadTipoPcd(servidor.pcd_tipo, servidor.pcd === true));
  
  const naturalidade = servidor.naturalidade_cidade 
    ? `${servidor.naturalidade_cidade} - ${servidor.naturalidade_uf || ""}`
    : "";
  renderTexto(doc, campos, 'naturalidade', naturalidade);
  
  renderCheckbox(doc, campos, 'molestia_nao', true); // Por padrão, não possui moléstia
  
  const campoDataNasc = getCampo(campos, 'data_nascimento');
  if (campoDataNasc) {
    doc.text(formatDate(servidor.data_nascimento), campoDataNasc.x, campoDataNasc.y);
  }
  
  renderTexto(doc, campos, 'tipo_sanguineo', servidor.tipo_sanguineo);
  renderTexto(doc, campos, 'nome_mae', servidor.nome_mae);
  renderTexto(doc, campos, 'nome_pai', servidor.nome_pai);

  // === DOCUMENTAÇÃO ===
  const campoCpf = getCampo(campos, 'cpf');
  if (campoCpf) {
    doc.text(formatCPF(servidor.cpf), campoCpf.x, campoCpf.y);
  }
  
  renderTexto(doc, campos, 'pis_pasep', servidor.pis_pasep);
  renderTexto(doc, campos, 'rg', servidor.rg);
  
  const rgOrgaoUf = `${servidor.rg_orgao_expedidor || ""} / ${servidor.rg_uf || ""}`;
  renderTexto(doc, campos, 'rg_orgao_uf', rgOrgaoUf);
  
  const campoRgData = getCampo(campos, 'rg_data_emissao');
  if (campoRgData) {
    doc.text(formatDate(servidor.rg_data_emissao), campoRgData.x, campoRgData.y);
  }
  
  renderTexto(doc, campos, 'reservista', servidor.certificado_reservista);
  renderTexto(doc, campos, 'reservista_orgao', servidor.reservista_orgao);
  
  const campoReservistaData = getCampo(campos, 'reservista_data');
  if (campoReservistaData) {
    doc.text(formatDate(servidor.reservista_data_emissao), campoReservistaData.x, campoReservistaData.y);
  }
  
  renderTexto(doc, campos, 'reservista_categoria', servidor.reservista_categoria);
  renderTexto(doc, campos, 'reservista_ano', servidor.reservista_ano?.toString());
  renderTexto(doc, campos, 'titulo_eleitor', servidor.titulo_eleitor);
  renderTexto(doc, campos, 'titulo_secao', servidor.titulo_secao);
  renderTexto(doc, campos, 'titulo_zona', servidor.titulo_zona);
  
  const campoTituloData = getCampo(campos, 'titulo_data');
  if (campoTituloData) {
    doc.text(formatDate(servidor.titulo_data_emissao), campoTituloData.x, campoTituloData.y);
  }
  
  renderTexto(doc, campos, 'titulo_cidade', servidor.titulo_cidade_votacao);
  renderTexto(doc, campos, 'titulo_uf', servidor.titulo_uf_votacao);
  renderTexto(doc, campos, 'ctps_numero', servidor.ctps_numero);
  renderTexto(doc, campos, 'ctps_serie', servidor.ctps_serie);
  renderTexto(doc, campos, 'ctps_uf', servidor.ctps_uf);
  
  const campoCtpsData = getCampo(campos, 'ctps_data');
  if (campoCtpsData) {
    doc.text(formatDate(servidor.ctps_data_emissao), campoCtpsData.x, campoCtpsData.y);
  }

  // === ESCOLARIDADE ===
  renderTexto(doc, campos, 'escolaridade', servidor.escolaridade);
  renderTexto(doc, campos, 'formacao', servidor.formacao_academica);
  renderTexto(doc, campos, 'instituicao', servidor.instituicao_ensino);

  // === DADOS FUNCIONAIS ===
  renderCheckbox(doc, campos, 'ocupa_vaga_pcd_sim', servidor.pcd === true);
  renderCheckbox(doc, campos, 'ocupa_vaga_pcd_nao', servidor.pcd !== true);
  renderTexto(doc, campos, 'lotacao', unidade?.nome);
  renderTexto(doc, campos, 'cargo', cargo?.nome);
  renderTexto(doc, campos, 'codigo_cargo', cargo?.sigla);
  renderCheckbox(doc, campos, 'quadro_efetivo_nao', true); // Por padrão
  renderTexto(doc, campos, 'matricula', servidor.matricula);
  renderCheckbox(doc, campos, 'servidor_federal_nao', true); // Por padrão

  // === CNH ===
  renderTexto(doc, campos, 'cnh_numero', servidor.cnh_numero);
  
  const campoCnhValidade = getCampo(campos, 'cnh_validade');
  if (campoCnhValidade) {
    doc.text(formatDate(servidor.cnh_validade), campoCnhValidade.x, campoCnhValidade.y);
  }
  
  const campoCnhExpedicao = getCampo(campos, 'cnh_expedicao');
  if (campoCnhExpedicao) {
    doc.text(formatDate(servidor.cnh_data_expedicao), campoCnhExpedicao.x, campoCnhExpedicao.y);
  }
  
  renderTexto(doc, campos, 'cnh_uf', servidor.cnh_uf);
  
  const campoCnhPrimeiraHab = getCampo(campos, 'cnh_primeira_hab');
  if (campoCnhPrimeiraHab) {
    doc.text(formatDate(servidor.cnh_primeira_habilitacao), campoCnhPrimeiraHab.x, campoCnhPrimeiraHab.y);
  }
  
  renderTexto(doc, campos, 'cnh_categoria', servidor.cnh_categoria);

  // =============================================
  // PÁGINA 2 - ESTRANGEIROS, ENDEREÇO, DADOS BANCÁRIOS
  // =============================================
  doc.addPage();
  doc.addImage(fichaPage2, "JPEG", 0, 0, pageWidth, pageHeight);

  // === ENDEREÇO E CONTATOS ===
  const campoCep = getCampo(campos, 'cep');
  if (campoCep) {
    doc.text(formatCEP(servidor.endereco_cep || ""), campoCep.x, campoCep.y);
  }
  
  renderTexto(doc, campos, 'logradouro', servidor.endereco_logradouro);
  renderTexto(doc, campos, 'numero', servidor.endereco_numero);
  renderTexto(doc, campos, 'bairro', servidor.endereco_bairro);
  renderTexto(doc, campos, 'municipio', servidor.endereco_cidade);
  renderTexto(doc, campos, 'complemento', servidor.endereco_complemento);
  renderTexto(doc, campos, 'estado_uf', servidor.endereco_uf);
  
  const campoCelular = getCampo(campos, 'celular');
  if (campoCelular) {
    doc.text(formatPhone(servidor.telefone_celular), campoCelular.x, campoCelular.y);
  }
  
  // Email em lowercase
  const campoEmail = getCampo(campos, 'email');
  if (campoEmail && servidor.email_pessoal) {
    const emailTrunc = truncarTexto(doc, servidor.email_pessoal.toLowerCase(), campoEmail.maxWidth || 85);
    doc.text(emailTrunc, campoEmail.x, campoEmail.y);
  }

  // === DADOS BANCÁRIOS ===
  renderTexto(doc, campos, 'banco_codigo', servidor.banco_codigo);
  renderTexto(doc, campos, 'banco_nome', servidor.banco_nome);
  renderTexto(doc, campos, 'banco_agencia', servidor.banco_agencia);
  renderTexto(doc, campos, 'banco_conta', servidor.banco_conta);

  // DATA E LOCAL
  const campoDataP2 = getCampo(campos, 'data_local_p2');
  if (campoDataP2) {
    doc.text(dataLocalTexto, campoDataP2.x, campoDataP2.y);
  }

  // =============================================
  // PÁGINA 3 - DECLARAÇÃO DE GRAU DE PARENTESCO
  // =============================================
  doc.addPage();
  doc.addImage(fichaPage3, "JPEG", 0, 0, pageWidth, pageHeight);

  renderTexto(doc, campos, 'nome_p3', servidor.nome_completo);
  
  const campoCpfP3 = getCampo(campos, 'cpf_p3');
  if (campoCpfP3) {
    doc.text(formatCPF(servidor.cpf), campoCpfP3.x, campoCpfP3.y);
  }
  
  renderCheckbox(doc, campos, 'parentesco_nao', true); // Por padrão não possui
  
  const campoDataP3 = getCampo(campos, 'data_local_p3');
  if (campoDataP3) {
    doc.text(dataLocalTexto, campoDataP3.x, campoDataP3.y);
  }

  // =============================================
  // PÁGINA 4 - DECLARAÇÃO DE ACUMULAÇÃO DE CARGOS
  // =============================================
  doc.addPage();
  doc.addImage(fichaPage4, "JPEG", 0, 0, pageWidth, pageHeight);

  renderTexto(doc, campos, 'nome_p4', servidor.nome_completo);
  
  const campoCpfP4 = getCampo(campos, 'cpf_p4');
  if (campoCpfP4) {
    doc.text(formatCPF(servidor.cpf), campoCpfP4.x, campoCpfP4.y);
  }
  
  renderTexto(doc, campos, 'cargo_p4', cargo?.nome);
  renderCheckbox(doc, campos, 'nao_acumula', true);
  
  const campoDataP4 = getCampo(campos, 'data_local_p4');
  if (campoDataP4) {
    doc.text(dataLocalTexto, campoDataP4.x, campoDataP4.y);
  }

  // =============================================
  // PÁGINA 5 - DECLARAÇÃO DE BENS DO SERVIDOR
  // =============================================
  doc.addPage();
  doc.addImage(fichaPage5, "JPEG", 0, 0, pageWidth, pageHeight);

  renderTexto(doc, campos, 'nome_p5', servidor.nome_completo);
  
  const campoCpfP5 = getCampo(campos, 'cpf_p5');
  if (campoCpfP5) {
    doc.text(formatCPF(servidor.cpf), campoCpfP5.x, campoCpfP5.y);
  }
  
  renderTexto(doc, campos, 'cargo_p5', cargo?.nome);
  renderCheckbox(doc, campos, 'nao_possui_bens', true);
  
  const campoDataP5 = getCampo(campos, 'data_local_p5');
  if (campoDataP5) {
    doc.text(dataLocalTexto, campoDataP5.x, campoDataP5.y);
  }

  // =============================================
  // PÁGINA 6 - DECLARAÇÃO DE BENS DO CÔNJUGE
  // =============================================
  doc.addPage();
  doc.addImage(fichaPage6, "JPEG", 0, 0, pageWidth, pageHeight);

  renderTexto(doc, campos, 'nome_p6', servidor.nome_completo);
  
  const campoCpfP6 = getCampo(campos, 'cpf_p6');
  if (campoCpfP6) {
    doc.text(formatCPF(servidor.cpf), campoCpfP6.x, campoCpfP6.y);
  }
  
  renderTexto(doc, campos, 'cargo_p6', cargo?.nome);
  
  // Verifica estado civil para determinar qual checkbox marcar
  const estadoCivilLower = servidor.estado_civil?.toLowerCase() || "";
  const isSolteiro = estadoCivilLower.includes("solteiro") || !servidor.estado_civil;
  
  renderCheckbox(doc, campos, 'nao_possui_conjuge', isSolteiro);
  renderCheckbox(doc, campos, 'nao_possui_bens_conjuge', !isSolteiro);
  
  const campoDataP6 = getCampo(campos, 'data_local_p6');
  if (campoDataP6) {
    doc.text(dataLocalTexto, campoDataP6.x, campoDataP6.y);
  }

  // =============================================
  // PÁGINA 7 - DECLARAÇÃO DE DEPENDENTES
  // =============================================
  doc.addPage();
  doc.addImage(fichaPage7, "JPEG", 0, 0, pageWidth, pageHeight);

  renderTexto(doc, campos, 'nome_p7', servidor.nome_completo);
  
  const campoCpfP7 = getCampo(campos, 'cpf_p7');
  if (campoCpfP7) {
    doc.text(formatCPF(servidor.cpf), campoCpfP7.x, campoCpfP7.y);
  }
  
  renderTexto(doc, campos, 'cargo_p7', cargo?.nome);

  // Preencher dependentes se houver
  if (dependentes && dependentes.length > 0) {
    renderCheckbox(doc, campos, 'possui_dependentes', true);

    dependentes.slice(0, 4).forEach((dep, idx) => {
      const depNum = idx + 1;
      
      const campoNome = getCampo(campos, `dep_${depNum}_nome`);
      if (campoNome && dep.nome) {
        const nomeTrunc = truncarTexto(doc, dep.nome.toUpperCase(), campoNome.maxWidth || 70);
        doc.text(nomeTrunc, campoNome.x, campoNome.y);
      }
      
      const campoCpfDep = getCampo(campos, `dep_${depNum}_cpf`);
      if (campoCpfDep && dep.cpf) {
        doc.text(formatCPF(dep.cpf), campoCpfDep.x, campoCpfDep.y);
      }
      
      const campoDataDep = getCampo(campos, `dep_${depNum}_data`);
      if (campoDataDep && dep.data_nascimento) {
        doc.text(formatDate(dep.data_nascimento), campoDataDep.x, campoDataDep.y);
      }
    });
  } else {
    renderCheckbox(doc, campos, 'nao_possui_dependentes', true);
  }

  // Data e Local
  const campoDataP7 = getCampo(campos, 'data_local_p7');
  if (campoDataP7) {
    doc.text(dataLocalTexto, campoDataP7.x, campoDataP7.y);
  }

  return doc;
}

export async function downloadFichaCadastroGeral(dados: DadosCompletos): Promise<void> {
  const doc = gerarFichaCadastroGeral(dados);
  const nomeArquivo = `Ficha_Cadastro_SEGAD_${dados.servidor.nome_completo?.replace(/\s+/g, "_") || "servidor"}.pdf`;
  doc.save(nomeArquivo);
}
