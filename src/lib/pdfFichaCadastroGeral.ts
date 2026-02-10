import { PDFDocument, PDFForm } from "pdf-lib";
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
  if (clean.length === 11) return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  if (clean.length === 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
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
// HELPERS: Preenchimento seguro de campos
// =============================================

function fillText(form: PDFForm, name: string, value: string | undefined | null): void {
  if (!value) return;
  try { form.getTextField(name).setText(value); } catch { /* campo não existe */ }
}

function fillDropdown(form: PDFForm, name: string, value: string | undefined | null): void {
  if (!value) return;
  try {
    const dd = form.getDropdown(name);
    const options = dd.getOptions();
    const match = options.find(opt =>
      opt.toUpperCase() === value.toUpperCase() ||
      opt.toUpperCase().includes(value.toUpperCase()) ||
      value.toUpperCase().includes(opt.toUpperCase())
    );
    if (match) dd.select(match);
  } catch { /* campo não existe */ }
}

function fillRadio(form: PDFForm, name: string, value: string): void {
  try {
    const rg = form.getRadioGroup(name);
    const options = rg.getOptions();
    const match = options.find(opt =>
      opt.toUpperCase() === value.toUpperCase() ||
      opt.toUpperCase().includes(value.toUpperCase())
    );
    if (match) rg.select(match);
  } catch { /* campo não existe */ }
}

function fillCheckbox(form: PDFForm, name: string, checked: boolean): void {
  try {
    const cb = form.getCheckBox(name);
    if (checked) cb.check(); else cb.uncheck();
  } catch { /* campo não existe */ }
}

// =============================================
// DEBUG: Listar todos os campos do PDF
// =============================================
export async function listarCamposPdf(): Promise<void> {
  const pdfBytes = await fetch(fichaCadastroPdfUrl).then(res => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();
  
  console.log(`\n=== CAMPOS DO PDF (${fields.length} total) ===`);
  fields.forEach((field, i) => {
    const name = field.getName();
    const type = field.constructor.name;
    let extras = '';
    try {
      if (type.includes('Dropdown')) {
        extras = ` | Opções: [${form.getDropdown(name).getOptions().join(', ')}]`;
      } else if (type.includes('RadioGroup')) {
        extras = ` | Opções: [${form.getRadioGroup(name).getOptions().join(', ')}]`;
      }
    } catch { /* */ }
    console.log(`${i + 1}. ${name} (${type})${extras}`);
  });
}

// =============================================
// GERADOR PRINCIPAL
// Mapeamento completo dos 251 campos do PDF SEGAD
// =============================================

export async function gerarFichaCadastroGeral(dados: DadosCompletos): Promise<Uint8Array> {
  const { servidor, cargo, unidade, dependentes } = dados;

  const pdfBytes = await fetch(fichaCadastroPdfUrl).then(res => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const form = pdfDoc.getForm();

  const dataAtual = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const dataLocalTexto = `Boa Vista-RR, ${dataAtual}`;
  const nomeUpper = servidor.nome_completo?.toUpperCase() || "";
  const cpfFormatado = formatCPF(servidor.cpf);
  const cargoNome = cargo?.nome?.toUpperCase() || "";

  // =============================================
  // PÁGINA 1 - DADOS DE IDENTIFICAÇÃO (campos 1-50)
  // =============================================
  
  // Nome, CPF, Sexo (campos globais - no final do PDF: 248-251)
  fillText(form, "TXT_NOME_SERVIDOR_FICHA_CADASTRAL", nomeUpper);
  fillText(form, "TXT_CPF_FICHA_CADASTRAL", cpfFormatado);
  fillText(form, "TXT_DATA_ASSINATURA_FICHA_CADASTRAL", dataLocalTexto);
  fillRadio(form, "RD_SEXO_SERVIDOR_FICHA_CADASTRAL", servidor.sexo === "M" ? "M" : "F");
  
  // Nome Social
  fillText(form, "TXT_NOME_SOCIAL_FICHA_CADASTRAL", servidor.nome_social?.toUpperCase());
  
  // Dropdowns da Página 1
  fillDropdown(form, "CBX_ESTADO_CIVIL_FICHA_CADASTRAL", getSegadEstadoCivil(servidor.estado_civil));
  fillDropdown(form, "CBX_RACA_FICHA_CADASTRAL", getSegadRacaCor(servidor.raca_cor));
  fillDropdown(form, "CBX_TIPO_PCD_FICHA_CADASTRAL", getSegadTipoPcd(servidor.pcd_tipo, servidor.pcd === true));
  fillDropdown(form, "CBX_TIPO_SANGUINEO_FICHA_CADASTRAL", servidor.tipo_sanguineo);
  fillDropdown(form, "CBX_ESCOLARIDADE_FICHA_CADASTRAL", servidor.escolaridade);
  fillDropdown(form, "CBX_CATEGORIA_RESERVA_FICHA_CADASTRAL", servidor.reservista_categoria);
  fillDropdown(form, "CBX_CATEGORIA_CNH_FICHA_CADASTRAL", servidor.cnh_categoria);
  
  // Radio Groups da Página 1
  fillRadio(form, "RD_PCD_FICHA_CADASTRAL", servidor.pcd === true ? "SIM" : "NÃO");
  fillRadio(form, "RD_MOLESTIA_GRAVE_FICHA_CADASTRAL", servidor.molestia_grave === true ? "SIM" : "NÃO");
  fillRadio(form, "RD_VAGA_PCD_FICHA_CADASTRAL", servidor.pcd === true ? "SIM" : "NÃO");
  fillRadio(form, "RD_EFETIVO_FICHA_CADASTRAL", "NÃO");
  fillRadio(form, "RD_FEDERAL_FICHA_CADASTRAL", "NÃO");
  
  // Primeiro Emprego
  fillText(form, "TXT_ANO_INICIO_EMPREGO_FICHA_CADASTRAL", servidor.ano_inicio_primeiro_emprego?.toString());
  fillText(form, "TXT_ANO_FIM_EMPREGO_FICHA_CADASTRAL", servidor.ano_fim_primeiro_emprego?.toString());
  
  // Dados de Identificação
  fillText(form, "TXT_NACIONALIDADE_FICHA_CADASTRAL", servidor.nacionalidade?.toUpperCase() || "BRASILEIRA");
  const naturalidade = servidor.naturalidade_cidade 
    ? `${servidor.naturalidade_cidade} - ${servidor.naturalidade_uf || ""}` : "";
  fillText(form, "TXT_NATURALIDADE_FICHA_CADASTRAL", naturalidade.toUpperCase());
  fillText(form, "DT_NASCIMENTO_FICHA_CADASTRAL", formatDate(servidor.data_nascimento));
  fillText(form, "TXT_NOME_PAI_FICHA_CADASTRAL", servidor.nome_pai?.toUpperCase());
  fillText(form, "TXT_NOME_MAE_FICHA_CADASTRAL", servidor.nome_mae?.toUpperCase());
  
  // Documentação
  fillText(form, "TXT_PISPASEP_FICHA_CADASTRAL", servidor.pis_pasep);
  fillText(form, "TXT_IDENTIDADE_FICHA_CADASTRAL", servidor.rg);
  fillText(form, "TXT_IDENTIDADE_EXPEDIDOR_FICHA_CADASTRAL", 
    `${servidor.rg_orgao_expedidor || ""} / ${servidor.rg_uf || ""}`);
  fillText(form, "DT_EXPED_IDENTIDADE_FICHA_CADASTRAL", formatDate(servidor.rg_data_emissao));
  
  // Reservista
  fillText(form, "TXT_RESERVISTA_FICHA_CADASTRAL", servidor.certificado_reservista);
  fillText(form, "TXT_RESERVISTA_EXPEDIDOR_FICHA_CADASTRAL", servidor.reservista_orgao);
  fillText(form, "DT_EXPD_RESERVISTA_FICHA_CADASTRAL", formatDate(servidor.reservista_data_emissao));
  fillText(form, "TXT_ANO_RESERVA_FICHA_CADASTRAL", servidor.reservista_ano?.toString());
  
  // Título Eleitor
  fillText(form, "TXT_TITULO_FICHA_CADASTRAL", servidor.titulo_eleitor);
  fillText(form, "TXT_SECAO_TITULO_FICHA_CADASTRAL", servidor.titulo_secao);
  fillText(form, "TXT_ZONA_TITULO_FICHA_CADASTRAL", servidor.titulo_zona);
  fillText(form, "DT_EXPED_TITULO_FICHA_CADASTRAL", formatDate(servidor.titulo_data_emissao));
  fillText(form, "TXT_CIDADE_TITULO_FICHA_CADASTRAL", servidor.titulo_cidade_votacao);
  fillText(form, "TXT_UF_TITULO_FICHA_CADASTRAL", servidor.titulo_uf_votacao);
  
  // CTPS
  fillText(form, "TXT_CTPS_FICHA_CADASTRAL", servidor.ctps_numero);
  fillText(form, "TXT_CTPS_SERIE_FICHA_CADASTRAL", servidor.ctps_serie);
  fillText(form, "TXT_CTPS_UF_FICHA_CADASTRAL", servidor.ctps_uf);
  fillText(form, "DT_EXPED_CTPS_FICHA_CADASTRAL", formatDate(servidor.ctps_data_emissao));
  
  // Escolaridade
  fillDropdown(form, "CBX_ESCOLARIDADE_FICHA_CADASTRAL", servidor.escolaridade);
  fillText(form, "TXT_CURSO_FICHA_CADASTRAL", servidor.formacao_academica?.toUpperCase());
  fillText(form, "TXT_CURSO_ENTIDADE_FICHA_CADASTRAL", servidor.instituicao_ensino?.toUpperCase());
  fillText(form, "TXT_ANO_CONCLUSAO_FICHA_CADASTRAL", servidor.ano_conclusao?.toString());
  
  // Dados Funcionais
  fillText(form, "TXT_LOTACAO_FICHA_CADASTRAL", unidade?.nome?.toUpperCase());
  fillText(form, "TXT_CARGO_FUNCAO_FICHA_CADASTRAL", cargoNome);
  fillText(form, "TXT_COD_CARGO_FUNCAO_FICHA_CADASTRAL", cargo?.sigla);
  fillText(form, "TXT_CARGO_EFETIVO_FICHA_CADASTRAL", cargoNome);
  fillText(form, "TXT_MATRICULA_EFETIVA_FICHA_CADASTRAL", servidor.matricula);
  fillText(form, "TXT_FUNCAO_EXERCIDA_FICHA_CADASTRAL", servidor.funcao_exercida?.toUpperCase());
  fillText(form, "TXT_REGIME_JURIDICO_FICHA_CADASTRAL", servidor.regime_juridico?.toUpperCase());
  fillText(form, "TXT_CARGA_HORARIA_FICHA_CADASTRAL", servidor.carga_horaria ? `${servidor.carga_horaria}h` : undefined);
  fillText(form, "TXT_ORGAO_ORIGEM_FICHA_CADASTRAL", servidor.orgao_origem?.toUpperCase());
  
  // Datas funcionais
  fillText(form, "DT_ADMISSAO_FICHA_CADASTRAL", formatDate(servidor.data_admissao));
  fillText(form, "DT_POSSE_FICHA_CADASTRAL", formatDate(servidor.data_posse));
  fillText(form, "DT_EXERCICIO_FICHA_CADASTRAL", formatDate(servidor.data_exercicio));
  
  // Tipo Servidor / Vínculo
  fillDropdown(form, "CBX_TIPO_SERVIDOR_FICHA_CADASTRAL", servidor.tipo_servidor?.toUpperCase());
  fillDropdown(form, "CBX_VINCULO_FICHA_CADASTRAL", servidor.vinculo?.toUpperCase());
  
  // CNH
  fillText(form, "TXT_CNH_FICHA_CADASTRAL", servidor.cnh_numero);
  fillText(form, "DT_VALIDADE_CNH_FICHA_CADASTRAL", formatDate(servidor.cnh_validade));
  fillText(form, "DT_EMISSAO_CNH_FICHA_CADASTRAL", formatDate(servidor.cnh_data_expedicao));
  fillText(form, "TXT_UF_CNH_FICHA_CADASTRAL", servidor.cnh_uf);
  fillText(form, "DT_PRIMEIRA_CNH_FICHA_CADASTRAL", formatDate(servidor.cnh_primeira_habilitacao));

  // =============================================
  // PÁGINA 2 - ESTRANGEIROS, ENDEREÇO, DADOS BANCÁRIOS (campos 51-67)
  // =============================================
  
  // Estrangeiros
  fillText(form, "DT_CHEGADA_ESTRANGEIRO_FICHA_CADASTRAL", formatDate(servidor.estrangeiro_data_chegada));
  fillText(form, "DT_LIMITE_PERMANENCIA_FICHA_CADASTRAL", formatDate(servidor.estrangeiro_data_limite_permanencia));
  fillText(form, "TXT_RNE_FICHA_CADASTRAL", servidor.estrangeiro_registro_nacional);
  fillText(form, "TXT_ANO_CHEGADA_FICHA_CADASTRAL", servidor.estrangeiro_ano_chegada?.toString());
  
  // Endereço
  fillText(form, "TXT_CEP_FICHA_CADASTRAL", formatCEP(servidor.endereco_cep || ""));
  fillText(form, "TXT_LOGRADOURO_FICHA_CADASTRAL", servidor.endereco_logradouro?.toUpperCase());
  fillText(form, "TXT_NUMERO_FICHA_CADASTRAL", servidor.endereco_numero);
  fillText(form, "TXT_BAIRRO_FICHA_CADASTRAL", servidor.endereco_bairro?.toUpperCase());
  fillText(form, "TXT_MUNICIPIO_FICHA_CADASTRAL", servidor.endereco_cidade?.toUpperCase());
  fillText(form, "TXT_COMPLEMENTO_FICHA_CADASTRAL", servidor.endereco_complemento?.toUpperCase());
  fillText(form, "TXT_UF_ENDERECO_FICHA_CADASTRAL", servidor.endereco_uf);
  
  // Telefones
  fillText(form, "TXT_CELULAR_FICHA_CADASTRAL", formatPhone(servidor.telefone_celular));
  fillText(form, "TXT_TELEFONE_FIXO_FICHA_CADASTRAL", formatPhone(servidor.telefone_fixo));
  fillText(form, "TXT_TELEFONE_EMERGENCIA_FICHA_CADASTRAL", formatPhone(servidor.telefone_emergencia));
  fillText(form, "TXT_CONTATO_EMERGENCIA_NOME_FICHA_CADASTRAL", servidor.contato_emergencia_nome?.toUpperCase());
  fillText(form, "TXT_CONTATO_EMERGENCIA_PARENTESCO_FICHA_CADASTRAL", servidor.contato_emergencia_parentesco?.toUpperCase());
  
  // Emails
  fillText(form, "TXT_EMAIL_FICHA_CADASTRAL", servidor.email_pessoal?.toLowerCase());
  fillText(form, "TXT_EMAIL_INSTITUCIONAL_FICHA_CADASTRAL", servidor.email_institucional?.toLowerCase());
  
  // Dados Bancários
  fillText(form, "TXT_COD_BANCO_FICHA_CADASTRAL", servidor.banco_codigo);
  fillText(form, "TXT_BANCO_FICHA_CADASTRAL", servidor.banco_nome?.toUpperCase());
  fillText(form, "TXT_AGENCIA_FICHA_CADASTRAL", servidor.banco_agencia);
  fillText(form, "TXT_CONTA_CORRENTE_FICHA_CADASTRAL", servidor.banco_conta);
  fillDropdown(form, "CBX_TIPO_CONTA_FICHA_CADASTRAL", servidor.banco_tipo_conta?.toUpperCase());

  // =============================================
  // PÁGINA 3 - DECLARAÇÃO DE PARENTESCO (campos 68-94)
  // =============================================
  // Os dados do servidor (nome/CPF) já são globais via campos 248-251
  // Checkboxes de vínculo
  fillCheckbox(form, "CK_VINCULO_PARENTESCO", false);
  fillCheckbox(form, "CK_GRAU_PARENTESCO_GOV_PARENTESCO", false);
  fillCheckbox(form, "CK_CASADO_GOV_PARENTESCO", false);

  // =============================================
  // PÁGINA 4 - DECLARAÇÃO DE ACUMULAÇÃO (campos 95-131)
  // =============================================
  fillText(form, "TXT_CARGO_SERVIDOR_ACUMULO_CARGO", cargoNome);
  
  if (servidor.acumula_cargo === true) {
    fillCheckbox(form, "CK_ACUMULACAO_ACUMULO_CARGO", true);  // SIM acumula
    fillCheckbox(form, "CK_ACUMULACAO", false);                // NÃO acumula
    fillText(form, "TXT_DESCRICAO_ACUMULO_CARGO", servidor.acumulo_descricao?.toUpperCase());
  } else {
    fillCheckbox(form, "CK_ACUMULACAO_ACUMULO_CARGO", false);
    fillCheckbox(form, "CK_ACUMULACAO", true);  // NÃO acumula
  }

  // =============================================
  // PÁGINA 5 - DECLARAÇÃO DE BENS DO SERVIDOR (campos 132-151)
  // =============================================
  fillText(form, "TXT_CARGO_SERVIDOR_BENS_SERVIDOR", cargoNome);
  fillCheckbox(form, "CK_POSSUI_BEN_BENS_SERVIDOR", false);

  // =============================================
  // PÁGINA 6 - DECLARAÇÃO DE BENS DO CÔNJUGE (campos 164-197)
  // =============================================
  fillText(form, "TXT_CARGO_SERVIDOR_BENS_CONJUGE", cargoNome);
  fillCheckbox(form, "CK_POSSUI_BEN_BENS_CONJUGE", false);

  // =============================================
  // PÁGINA 7 - DECLARAÇÃO DE DEPENDENTES (campos 198-251)
  // =============================================
  fillText(form, "TXT_CARGO_SERVIDOR_DEPENDENTES", cargoNome);

  if (dependentes && dependentes.length > 0) {
    fillCheckbox(form, "CK_POSSUI_DEP_DEPENDENTES", true);
    
    dependentes.slice(0, 4).forEach((dep, idx) => {
      const n = idx + 1;
      fillText(form, `TXT_NOME_DEP${n}_DEPENDENTES`, dep.nome?.toUpperCase());
      if (n === 1) fillText(form, "TXT_CPF_DEP1_DEPENDENTES", dep.cpf ? formatCPF(dep.cpf) : undefined);
      else if (n === 2) fillText(form, "TXT_CPF_DEP2", dep.cpf ? formatCPF(dep.cpf) : undefined);
      else fillText(form, `TXT_CPF_DEP${n}_DEPENDENTES`, dep.cpf ? formatCPF(dep.cpf) : undefined);
      
      fillText(form, `DT_NASCIMENTO_DEP${n}_DEPENDENTES`, formatDate(dep.data_nascimento));
      fillRadio(form, `RD_SEXO_DEP${n}_DEPENDENTES`, (dep as any).sexo === "M" ? "M" : "F");
      fillText(form, `TXT_PARENTESCO_DEP${n}_DEPENDENTES`, dep.parentesco?.toUpperCase());
      fillRadio(form, `RD_IR_DEP${n}_DEPENDENTES`, (dep as any).declarar_ir ? "SIM" : "NÃO");
      fillRadio(form, `RD_PREVIDENCIA_DEP${n}_DEPENDENTES`, (dep as any).declarar_previdencia ? "SIM" : "NÃO");
      fillRadio(form, `RD_PCD_DEP${n}_DEPENDENTES`, (dep as any).pcd ? "SIM" : "NÃO");
      if ((dep as any).pcd && (dep as any).pcd_tipo) {
        fillText(form, `TXT_TIPO_PCD_DEP${n}_DEPENDENTES`, (dep as any).pcd_tipo?.toUpperCase());
      }
      fillRadio(form, `RD_UNIVERSITARIO_DEP${n}_DEPENDENTES`, (dep as any).universitario ? "SIM" : "NÃO");
      fillRadio(form, `RD_SALARIO_FAMILIA_DEP${n}_DEPENDENTES`, (dep as any).salario_familia ? "SIM" : "NÃO");
    });
  } else {
    fillCheckbox(form, "CK_POSSUI_DEP_DEPENDENTES", false);
  }

  // Flatten para fixar os dados
  form.flatten();

  return await pdfDoc.save();
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
