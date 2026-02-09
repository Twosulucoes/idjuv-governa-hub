import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox } from "pdf-lib";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Servidor, Dependente } from "@/types/rh";
import { SEGAD_ESTADO_CIVIL, SEGAD_TIPO_PCD, SEGAD_RACA_COR } from "@/types/rh";

// Importar o PDF editável original
import fichaCadastroPdfUrl from "@/assets/FICHA-CADASTRO-GERAL - NOVO (2).pdf";

interface DadosCompletos {
  servidor: Servidor;
  cargo?: { nome: string; sigla?: string };
  unidade?: { nome: string; sigla?: string };
  dependentes?: Dependente[];
}

// =============================================
// FUNÇÕES AUXILIARES
// =============================================

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

// =============================================
// HELPER: Preencher campo de texto com segurança
// =============================================
function fillTextField(form: PDFForm, fieldName: string, value: string | undefined): void {
  if (!value) return;
  try {
    const field = form.getTextField(fieldName);
    field.setText(value.toUpperCase());
  } catch {
    // Campo não encontrado - ignorar silenciosamente
    console.warn(`Campo de texto não encontrado no PDF: ${fieldName}`);
  }
}

function fillCheckBox(form: PDFForm, fieldName: string, checked: boolean): void {
  try {
    const field = form.getCheckBox(fieldName);
    if (checked) {
      field.check();
    } else {
      field.uncheck();
    }
  } catch {
    console.warn(`Checkbox não encontrado no PDF: ${fieldName}`);
  }
}

// =============================================
// FUNÇÃO: Listar todos os campos do PDF (para debug/mapeamento)
// =============================================
export async function listarCamposPdf(): Promise<{ name: string; type: string }[]> {
  const pdfBytes = await fetch(fichaCadastroPdfUrl).then(res => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();
  
  return fields.map(field => ({
    name: field.getName(),
    type: field.constructor.name,
  }));
}

// =============================================
// GERADOR PRINCIPAL - Preenche o PDF editável original
// =============================================

export async function gerarFichaCadastroGeral(dados: DadosCompletos): Promise<Uint8Array> {
  const { servidor, cargo, unidade, dependentes } = dados;

  // Carregar o PDF editável original
  const pdfBytes = await fetch(fichaCadastroPdfUrl).then(res => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();

  // Listar campos disponíveis para log/debug
  const fields = form.getFields();
  console.log("Campos encontrados no PDF:", fields.map(f => `${f.getName()} (${f.constructor.name})`));

  const dataAtual = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const dataLocalTexto = `Boa Vista-RR, ${dataAtual}`;

  // =============================================
  // PÁGINA 1 - DADOS DE IDENTIFICAÇÃO
  // =============================================
  
  // Dados de Identificação
  fillTextField(form, "NOME", servidor.nome_completo);
  fillTextField(form, "Nome", servidor.nome_completo);
  fillTextField(form, "nome", servidor.nome_completo);
  
  // Sexo
  fillCheckBox(form, "SEXO_M", servidor.sexo === "M");
  fillCheckBox(form, "SEXO_F", servidor.sexo === "F");
  fillCheckBox(form, "Sexo_M", servidor.sexo === "M");
  fillCheckBox(form, "Sexo_F", servidor.sexo === "F");
  
  // Estado Civil
  fillTextField(form, "ESTADO_CIVIL", getSegadEstadoCivil(servidor.estado_civil));
  fillTextField(form, "ESTADO CIVIL", getSegadEstadoCivil(servidor.estado_civil));
  fillTextField(form, "Estado Civil", getSegadEstadoCivil(servidor.estado_civil));
  
  // Raça/Cor
  fillTextField(form, "RACA_COR", getSegadRacaCor(servidor.raca_cor));
  fillTextField(form, "RAÇA/COR", getSegadRacaCor(servidor.raca_cor));
  fillTextField(form, "Raça/Cor", getSegadRacaCor(servidor.raca_cor));
  
  // PCD
  fillCheckBox(form, "PCD_SIM", servidor.pcd === true);
  fillCheckBox(form, "PCD_NAO", servidor.pcd !== true);
  fillCheckBox(form, "PCD SIM", servidor.pcd === true);
  fillCheckBox(form, "PCD NÃO", servidor.pcd !== true);
  
  // Nacionalidade
  fillTextField(form, "NACIONALIDADE", servidor.nacionalidade || "BRASILEIRA");
  fillTextField(form, "Nacionalidade", servidor.nacionalidade || "BRASILEIRA");
  
  // Tipo PCD
  fillTextField(form, "TIPO_PCD", getSegadTipoPcd(servidor.pcd_tipo, servidor.pcd === true));
  fillTextField(form, "TIPO DE P.C.D", getSegadTipoPcd(servidor.pcd_tipo, servidor.pcd === true));
  
  // Naturalidade
  const naturalidade = servidor.naturalidade_cidade 
    ? `${servidor.naturalidade_cidade} - ${servidor.naturalidade_uf || ""}`
    : "";
  fillTextField(form, "NATURALIDADE", naturalidade);
  fillTextField(form, "Naturalidade", naturalidade);
  
  // Moléstia grave
  fillCheckBox(form, "MOLESTIA_NAO", true);
  fillCheckBox(form, "MOLÉSTIA NÃO", true);
  
  // Data nascimento
  fillTextField(form, "DATA_NASCIMENTO", formatDate(servidor.data_nascimento));
  fillTextField(form, "DATA DE NASCIMENTO", formatDate(servidor.data_nascimento));
  fillTextField(form, "Data de Nascimento", formatDate(servidor.data_nascimento));
  
  // Tipo sanguíneo
  fillTextField(form, "TIPO_SANGUINEO", servidor.tipo_sanguineo);
  fillTextField(form, "TIPO SANGUÍNEO/RH", servidor.tipo_sanguineo);
  
  // Filiação
  fillTextField(form, "NOME_MAE", servidor.nome_mae);
  fillTextField(form, "NOME DA MÃE", servidor.nome_mae);
  fillTextField(form, "NOME_PAI", servidor.nome_pai);
  fillTextField(form, "NOME DO PAI", servidor.nome_pai);

  // =============================================
  // DOCUMENTAÇÃO
  // =============================================
  fillTextField(form, "CPF", formatCPF(servidor.cpf));
  fillTextField(form, "cpf", formatCPF(servidor.cpf));
  fillTextField(form, "PIS_PASEP", servidor.pis_pasep);
  fillTextField(form, "PIS/PASEP", servidor.pis_pasep);
  fillTextField(form, "RG", servidor.rg);
  fillTextField(form, "DOC. DE IDENTIDADE N.", servidor.rg);
  
  const rgOrgaoUf = `${servidor.rg_orgao_expedidor || ""} / ${servidor.rg_uf || ""}`;
  fillTextField(form, "RG_ORGAO", rgOrgaoUf);
  fillTextField(form, "ORGÃO EXPEDIDOR", rgOrgaoUf);
  
  fillTextField(form, "RG_DATA", formatDate(servidor.rg_data_emissao));
  fillTextField(form, "DATA DE EXPEDIÇÃO", formatDate(servidor.rg_data_emissao));
  
  // Reservista
  fillTextField(form, "RESERVISTA", servidor.certificado_reservista);
  fillTextField(form, "CART. DE RESERVISTA N.", servidor.certificado_reservista);
  fillTextField(form, "RESERVISTA_ORGAO", servidor.reservista_orgao);
  fillTextField(form, "RESERVISTA_DATA", formatDate(servidor.reservista_data_emissao));
  fillTextField(form, "RESERVISTA_CATEGORIA", servidor.reservista_categoria);
  fillTextField(form, "RESERVISTA_ANO", servidor.reservista_ano?.toString());
  
  // Título eleitor
  fillTextField(form, "TITULO_ELEITOR", servidor.titulo_eleitor);
  fillTextField(form, "TÍTULO DE ELEITOR N.", servidor.titulo_eleitor);
  fillTextField(form, "TITULO_SECAO", servidor.titulo_secao);
  fillTextField(form, "SEÇÃO", servidor.titulo_secao);
  fillTextField(form, "TITULO_ZONA", servidor.titulo_zona);
  fillTextField(form, "ZONA", servidor.titulo_zona);
  fillTextField(form, "TITULO_DATA", formatDate(servidor.titulo_data_emissao));
  fillTextField(form, "TITULO_CIDADE", servidor.titulo_cidade_votacao);
  fillTextField(form, "CIDADE DE VOTAÇÃO", servidor.titulo_cidade_votacao);
  fillTextField(form, "TITULO_UF", servidor.titulo_uf_votacao);
  
  // CTPS
  fillTextField(form, "CTPS_NUMERO", servidor.ctps_numero);
  fillTextField(form, "CARTEIRA DE TRABALHO", servidor.ctps_numero);
  fillTextField(form, "CTPS_SERIE", servidor.ctps_serie);
  fillTextField(form, "SÉRIE DA CTPS", servidor.ctps_serie);
  fillTextField(form, "CTPS_UF", servidor.ctps_uf);
  fillTextField(form, "CTPS_DATA", formatDate(servidor.ctps_data_emissao));

  // =============================================
  // ESCOLARIDADE
  // =============================================
  fillTextField(form, "ESCOLARIDADE", servidor.escolaridade);
  fillTextField(form, "GRAU DE INSTRUÇÃO", servidor.escolaridade);
  fillTextField(form, "FORMACAO", servidor.formacao_academica);
  fillTextField(form, "CURSO", servidor.formacao_academica);
  fillTextField(form, "INSTITUICAO", servidor.instituicao_ensino);
  fillTextField(form, "ORGÃO/INSTITUIÇÃO", servidor.instituicao_ensino);

  // =============================================
  // DADOS FUNCIONAIS
  // =============================================
  fillCheckBox(form, "OCUPA_VAGA_PCD_SIM", servidor.pcd === true);
  fillCheckBox(form, "OCUPA_VAGA_PCD_NAO", servidor.pcd !== true);
  fillTextField(form, "LOTACAO", unidade?.nome);
  fillTextField(form, "LOTAÇÃO ATUAL", unidade?.nome);
  fillTextField(form, "CARGO", cargo?.nome);
  fillTextField(form, "CARGO/FUNÇÃO", cargo?.nome);
  fillTextField(form, "COD_CARGO", cargo?.sigla);
  fillTextField(form, "COD. CARGO/FUNÇÃO", cargo?.sigla);
  fillCheckBox(form, "QUADRO_EFETIVO_NAO", true);
  fillTextField(form, "MATRICULA", servidor.matricula);
  fillTextField(form, "MATRÍCULA", servidor.matricula);
  fillCheckBox(form, "SERVIDOR_FEDERAL_NAO", true);
  
  // CNH
  fillTextField(form, "CNH_NUMERO", servidor.cnh_numero);
  fillTextField(form, "CNH nº.", servidor.cnh_numero);
  fillTextField(form, "CNH_VALIDADE", formatDate(servidor.cnh_validade));
  fillTextField(form, "DATA DE VALIDADE", formatDate(servidor.cnh_validade));
  fillTextField(form, "CNH_EXPEDICAO", formatDate(servidor.cnh_data_expedicao));
  fillTextField(form, "CNH_UF", servidor.cnh_uf);
  fillTextField(form, "CNH_PRIMEIRA_HAB", formatDate(servidor.cnh_primeira_habilitacao));
  fillTextField(form, "DATA DA PRIMEIRA HABILITAÇÃO", formatDate(servidor.cnh_primeira_habilitacao));
  fillTextField(form, "CNH_CATEGORIA", servidor.cnh_categoria);
  fillTextField(form, "CATEGORIA DA HABILITAÇÃO", servidor.cnh_categoria);

  // =============================================
  // PÁGINA 2 - ENDEREÇO E CONTATOS
  // =============================================
  fillTextField(form, "CEP", formatCEP(servidor.endereco_cep || ""));
  fillTextField(form, "LOGRADOURO", servidor.endereco_logradouro);
  fillTextField(form, "NUMERO", servidor.endereco_numero);
  fillTextField(form, "NÚMERO", servidor.endereco_numero);
  fillTextField(form, "BAIRRO", servidor.endereco_bairro);
  fillTextField(form, "MUNICIPIO", servidor.endereco_cidade);
  fillTextField(form, "MUNICÍPIO", servidor.endereco_cidade);
  fillTextField(form, "COMPLEMENTO", servidor.endereco_complemento);
  fillTextField(form, "ESTADO_UF", servidor.endereco_uf);
  fillTextField(form, "ESTADO/UF", servidor.endereco_uf);
  fillTextField(form, "CELULAR", formatPhone(servidor.telefone_celular));
  fillTextField(form, "CELULAR (DDD)", formatPhone(servidor.telefone_celular));
  fillTextField(form, "EMAIL", servidor.email_pessoal?.toLowerCase());
  fillTextField(form, "E-MAIL", servidor.email_pessoal?.toLowerCase());
  
  // Dados Bancários
  fillTextField(form, "BANCO_CODIGO", servidor.banco_codigo);
  fillTextField(form, "CÓDIGO DO BANCO", servidor.banco_codigo);
  fillTextField(form, "BANCO_NOME", servidor.banco_nome);
  fillTextField(form, "NOME DO BANCO", servidor.banco_nome);
  fillTextField(form, "BANCO_AGENCIA", servidor.banco_agencia);
  fillTextField(form, "AGÊNCIA", servidor.banco_agencia);
  fillTextField(form, "BANCO_CONTA", servidor.banco_conta);
  fillTextField(form, "CONTA CORRENTE", servidor.banco_conta);

  // =============================================
  // PÁGINA 3 - DECLARAÇÃO DE PARENTESCO
  // =============================================
  // Tentamos vários nomes possíveis para campos repetidos em páginas diferentes
  fillCheckBox(form, "PARENTESCO_NAO", true);
  fillCheckBox(form, "NÃO", true);

  // =============================================
  // PÁGINA 4 - DECLARAÇÃO DE ACUMULAÇÃO
  // =============================================
  fillCheckBox(form, "NAO_ACUMULA", true);
  fillCheckBox(form, "NÃO ACUMULA CARGOS", true);

  // =============================================
  // PÁGINA 5 - DECLARAÇÃO DE BENS
  // =============================================
  fillCheckBox(form, "NAO_POSSUI_BENS", true);
  fillCheckBox(form, "DECLARO QUE NÃO POSSUO", true);

  // =============================================
  // PÁGINA 6 - DECLARAÇÃO DE BENS CÔNJUGE
  // =============================================
  const estadoCivilLower = servidor.estado_civil?.toLowerCase() || "";
  const isSolteiro = estadoCivilLower.includes("solteiro") || !servidor.estado_civil;
  
  if (isSolteiro) {
    fillCheckBox(form, "NAO_POSSUI_CONJUGE", true);
  } else {
    fillCheckBox(form, "NAO_POSSUI_BENS_CONJUGE", true);
  }

  // =============================================
  // PÁGINA 7 - DECLARAÇÃO DE DEPENDENTES
  // =============================================
  if (dependentes && dependentes.length > 0) {
    fillCheckBox(form, "POSSUI_DEPENDENTES", true);
    fillCheckBox(form, "POSSUO DEPENDENTE(S)", true);
    
    dependentes.slice(0, 4).forEach((dep, idx) => {
      const num = idx + 1;
      fillTextField(form, `DEP_${num}_NOME`, dep.nome);
      fillTextField(form, `DEP_${num}_CPF`, dep.cpf ? formatCPF(dep.cpf) : undefined);
      fillTextField(form, `DEP_${num}_DATA`, formatDate(dep.data_nascimento));
    });
  } else {
    fillCheckBox(form, "NAO_POSSUI_DEPENDENTES", true);
    fillCheckBox(form, "NÃO POSSUO DEPENDENTE(S)", true);
  }

  // Flatten o formulário para que os dados fiquem fixos no PDF
  form.flatten();

  // Salvar o PDF preenchido
  const filledPdfBytes = await pdfDoc.save();
  return filledPdfBytes;
}

export async function downloadFichaCadastroGeral(dados: DadosCompletos): Promise<void> {
  const pdfBytes = await gerarFichaCadastroGeral(dados);
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `Ficha_Cadastro_SEGAD_${dados.servidor.nome_completo?.replace(/\s+/g, "_") || "servidor"}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
