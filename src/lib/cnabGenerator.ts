/**
 * Gerador de Arquivos CNAB240 para Pagamento de Folha
 * Conta pagadora no Banco do Brasil: leiaute que o BB já aceita da folha (`bancario/folhaBbCnab240.ts`, conferido byte
 * a byte com as remessas do SIGRH). Outros bancos: padrão FEBRABAN 240 genérico (decisão 10 da revisão do RH); sem
 * manual do convênio, os campos que variam por banco estão marcados "conferir no manual do banco".
 *
 * Nada aqui é fixo da instituição: dados do pagador (CNPJ, razão social, endereço) vêm de `config_autarquia` (com o
 * endereço do perfil do tenant como reserva), a conta e o banco de `contas_autarquia`/`bancos_cnab`, e os dados do
 * favorecido da ficha financeira e do cadastro do servidor. Faltou dado obrigatório: `validarRemessaCNAB` lista o que
 * falta e a tela recusa gerar.
 */

import { gerarFolhaBbCnab240, pendenciasFolhaBb } from "@/lib/bancario/folhaBbCnab240";

export interface EnderecoPagador {
  logradouro: string;
  numero?: string;
  complemento?: string;
  cidade: string;
  cep: string;
  uf: string;
}

export interface DadosEmpresa {
  cnpj: string;
  razaoSocial: string;
  banco: string;
  /** Nome do banco da conta pagadora (header do arquivo, posições 103-132). */
  nomeBanco: string;
  agencia: string;
  agenciaDigito?: string;
  conta: string;
  contaDigito?: string;
  convenio?: string;
  endereco: EnderecoPagador;
}

/** Endereço do favorecido (segmento B); opcional no crédito em conta: o que faltar sai em branco. */
export interface EnderecoFavorecido {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  cep?: string;
  uf?: string;
}

export interface DadosFavorecido {
  nome: string;
  cpf: string;
  banco: string;
  agencia: string;
  agenciaDigito?: string;
  conta: string;
  contaDigito?: string;
  tipoConta: "CC" | "CP"; // Conta Corrente ou Poupança
  valor: number;
  dataCredito: Date;
  identificador: string; // ID único do pagamento
  endereco?: EnderecoFavorecido;
}

export interface RemessaCNAB {
  empresa: DadosEmpresa;
  favorecidos: DadosFavorecido[];
  numeroRemessa: number;
  dataGeracao: Date;
}

// Funções auxiliares de formatação
function padLeft(str: string, len: number, char = "0"): string {
  return str.padStart(len, char);
}

function padRight(str: string, len: number, char = " "): string {
  return str.padEnd(len, char).substring(0, len);
}

function formatDate(date: Date, format: "DDMMYYYY" | "DDMMYY" | "HHMMSS"): string {
  const day = padLeft(date.getDate().toString(), 2);
  const month = padLeft((date.getMonth() + 1).toString(), 2);
  const year = date.getFullYear().toString();
  const hours = padLeft(date.getHours().toString(), 2);
  const minutes = padLeft(date.getMinutes().toString(), 2);
  const seconds = padLeft(date.getSeconds().toString(), 2);

  switch (format) {
    case "DDMMYYYY":
      return day + month + year;
    case "DDMMYY":
      return day + month + year.substring(2);
    case "HHMMSS":
      return hours + minutes + seconds;
  }
}

function formatValue(value: number, len: number): string {
  const cents = Math.round(value * 100);
  return padLeft(cents.toString(), len);
}

/** Valor em centavos inteiros (somas sem erro de ponto flutuante). */
function centavos(value: number): number {
  return Math.round(value * 100);
}

function formatCentavos(cents: number, len: number): string {
  return padLeft(cents.toString(), len);
}

function onlyDigits(str: string): string {
  return str.replace(/\D/g, "");
}

function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "");
}

/**
 * Separa número e dígito verificador de agência ou conta gravadas como "1234-5" / "00012345-X" (formato dos
 * formulários do sistema). Sem hífen, o valor inteiro é o número e o dígito fica vazio. Dígito com mais de um
 * caractere volta como veio: `validarRemessaCNAB` recusa (o leiaute tem 1 posição).
 */
export function separarDigito(valor: string | null | undefined): { numero: string; digito: string } {
  const texto = (valor ?? "").trim();
  const m = texto.match(/^(.*\d)\s*-\s*([0-9A-Za-z]+)$/);
  if (m) return { numero: onlyDigits(m[1]), digito: m[2].toUpperCase() };
  return { numero: onlyDigits(texto), digito: "" };
}

/** Número do endereço (campo numérico de 5 posições): "S/N" ou vazio vira zeros. */
function numeroEndereco(valor: string | undefined): string {
  return padLeft(onlyDigits(valor ?? "").slice(-5), 5);
}

// Gerar Header de Arquivo (Registro Tipo 0)
function gerarHeaderArquivo(remessa: RemessaCNAB): string {
  const { empresa, numeroRemessa, dataGeracao } = remessa;
  
  let linha = "";
  linha += padLeft(empresa.banco, 3);           // 001-003: Código do banco
  linha += "0000";                               // 004-007: Lote de serviço
  linha += "0";                                  // 008: Tipo de registro (0 = Header)
  linha += padRight("", 9);                      // 009-017: Brancos
  linha += "2";                                  // 018: Tipo de inscrição empresa (2 = CNPJ)
  linha += padLeft(onlyDigits(empresa.cnpj), 14); // 019-032: CNPJ
  linha += padRight(empresa.convenio || "", 20); // 033-052: Código do convênio
  linha += padLeft(onlyDigits(empresa.agencia), 5); // 053-057: Agência
  linha += padRight(empresa.agenciaDigito || "", 1); // 058: Dígito agência
  linha += padLeft(onlyDigits(empresa.conta), 12);   // 059-070: Conta
  linha += padRight(empresa.contaDigito || "", 1);   // 071: Dígito conta
  linha += " ";                                  // 072: Dígito verificador
  linha += padRight(normalize(empresa.razaoSocial), 30); // 073-102: Nome empresa
  linha += padRight(normalize(empresa.nomeBanco), 30); // 103-132: Nome do banco
  linha += padRight("", 10);                     // 133-142: Brancos
  linha += "1";                                  // 143: Arquivo remessa
  linha += formatDate(dataGeracao, "DDMMYYYY");  // 144-151: Data geração
  linha += formatDate(dataGeracao, "HHMMSS");    // 152-157: Hora geração
  linha += padLeft(numeroRemessa.toString(), 6); // 158-163: Número sequencial arquivo
  linha += "089";                                // 164-166: Versão layout
  linha += padLeft("0", 5);                      // 167-171: Densidade
  linha += padRight("", 20);                     // 172-191: Reservado banco
  linha += padRight("", 20);                     // 192-211: Reservado empresa
  linha += padRight("", 29);                     // 212-240: Brancos

  return linha;
}

// Gerar Header de Lote (Registro Tipo 1)
function gerarHeaderLote(remessa: RemessaCNAB, numeroLote: number, forma: FormaPagamento): string {
  const { empresa } = remessa;

  let linha = "";
  linha += padLeft(empresa.banco, 3);           // 001-003: Código do banco
  linha += padLeft(numeroLote.toString(), 4);   // 004-007: Número do lote
  linha += "1";                                  // 008: Tipo de registro (1 = Header lote)
  linha += "C";                                  // 009: Tipo de operação (C = Crédito)
  // Tipo de serviço 30 = Pagamento de Salários (FEBRABAN; conferir no manual do banco).
  linha += "30";                                 // 010-011: Tipo de serviço (30 = Pagamento de Salários)
  // Um lote por forma de pagamento (ver formaDoFavorecido; conferir no manual do banco).
  linha += forma;                                // 012-013: Forma de pagamento (01, 05 ou 41)
  linha += "045";                                // 014-016: Versão layout lote
  linha += " ";                                  // 017: Branco
  linha += "2";                                  // 018: Tipo de inscrição empresa
  linha += padLeft(onlyDigits(empresa.cnpj), 14); // 019-032: CNPJ
  linha += padRight(empresa.convenio || "", 20); // 033-052: Código do convênio
  linha += padLeft(onlyDigits(empresa.agencia), 5); // 053-057: Agência
  linha += padRight(empresa.agenciaDigito || "", 1); // 058: Dígito agência
  linha += padLeft(onlyDigits(empresa.conta), 12);   // 059-070: Conta
  linha += padRight(empresa.contaDigito || "", 1);   // 071: Dígito conta
  linha += " ";                                  // 072: Dígito verificador
  linha += padRight(normalize(empresa.razaoSocial), 30); // 073-102: Nome empresa
  const endereco = empresa.endereco;
  const cep = padLeft(onlyDigits(endereco.cep), 8);
  linha += padRight("", 40);                     // 103-142: Mensagem 1
  linha += padRight(normalize(endereco.logradouro), 30); // 143-172: Endereço
  linha += numeroEndereco(endereco.numero);      // 173-177: Número
  linha += padRight(normalize(endereco.complemento || ""), 15); // 178-192: Complemento
  linha += padRight(normalize(endereco.cidade), 20); // 193-212: Cidade
  linha += cep.substring(0, 5);                  // 213-217: CEP
  linha += cep.substring(5, 8);                  // 218-220: Sufixo CEP
  linha += padRight(normalize(endereco.uf), 2);  // 221-222: UF
  linha += "01";                                 // 223-224: Forma de pagamento do serviço (01 = débito em conta corrente)
  linha += padRight("", 6);                      // 225-230: Brancos (uso FEBRABAN)
  linha += padRight("", 10);                     // 231-240: Ocorrências (só no retorno)

  return linha;
}

// Gerar Segmento A (Dados do Pagamento) — FEBRABAN 240 v10
function gerarSegmentoA(
  empresa: DadosEmpresa,
  favorecido: DadosFavorecido,
  numeroLote: number,
  sequencial: number,
  forma: FormaPagamento
): string {
  const ted = forma === "41";
  let linha = "";
  linha += padLeft(empresa.banco, 3);           // 001-003: Código do banco
  linha += padLeft(numeroLote.toString(), 4);   // 004-007: Número do lote
  linha += "3";                                  // 008: Tipo de registro (3 = Detalhe)
  linha += padLeft(sequencial.toString(), 5);   // 009-013: Número sequencial do registro no lote
  linha += "A";                                  // 014: Código do segmento
  linha += "0";                                  // 015: Tipo de movimento (0 = Inclusão)
  linha += "00";                                 // 016-017: Código da instrução
  // Câmara: 000 no crédito no mesmo banco; 018 = TED (conferir no manual do banco)
  linha += ted ? "018" : "000";                  // 018-020: Câmara centralizadora
  linha += padLeft(favorecido.banco, 3);        // 021-023: Código banco favorecido
  linha += padLeft(onlyDigits(favorecido.agencia), 5); // 024-028: Agência
  linha += padRight(favorecido.agenciaDigito || "", 1); // 029: Dígito agência
  linha += padLeft(onlyDigits(favorecido.conta), 12);  // 030-041: Conta
  linha += padRight(favorecido.contaDigito || "", 1);  // 042: Dígito conta
  linha += " ";                                  // 043: Dígito verificador agência/conta
  linha += padRight(normalize(favorecido.nome), 30); // 044-073: Nome favorecido
  linha += padRight(favorecido.identificador, 20); // 074-093: Seu número (documento da empresa)
  linha += formatDate(favorecido.dataCredito, "DDMMYYYY"); // 094-101: Data do pagamento
  linha += "BRL";                                // 102-104: Tipo moeda
  linha += padLeft("0", 15);                     // 105-119: Quantidade moeda
  linha += formatCentavos(centavos(favorecido.valor), 15); // 120-134: Valor do pagamento
  linha += padRight("", 20);                     // 135-154: Nosso número (do banco, no retorno)
  linha += padLeft("0", 8);                      // 155-162: Data real da efetivação (zeros na remessa)
  linha += padLeft("0", 15);                     // 163-177: Valor real da efetivação (zeros na remessa)
  linha += padRight("", 40);                     // 178-217: Outras informações
  linha += padRight("", 2);                      // 218-219: Complemento tipo serviço (finalidade do DOC; sem DOC)
  // Finalidade TED 00004 = pagamento de salários (conferir no manual do banco); fora da TED, em branco
  linha += ted ? "00004" : padRight("", 5);      // 220-224: Código finalidade TED
  // Complemento de finalidade: CC conta corrente, PP poupança (conferir no manual do banco)
  linha += favorecido.tipoConta === "CP" ? "PP" : "CC"; // 225-226: Complemento finalidade pagamento
  linha += padRight("", 3);                      // 227-229: Brancos (uso FEBRABAN)
  linha += "0";                                  // 230: Aviso ao favorecido (0 = não emite)
  linha += padRight("", 10);                     // 231-240: Ocorrências (só no retorno)

  return linha;
}

// Gerar Segmento B (Dados do Favorecido)
function gerarSegmentoB(
  empresa: DadosEmpresa,
  favorecido: DadosFavorecido,
  numeroLote: number,
  sequencial: number
): string {
  let linha = "";
  linha += padLeft(empresa.banco, 3);           // 001-003: Código do banco
  linha += padLeft(numeroLote.toString(), 4);   // 004-007: Número do lote
  linha += "3";                                  // 008: Tipo de registro (3 = Detalhe)
  linha += padLeft(sequencial.toString(), 5);   // 009-013: Número sequencial registro
  linha += "B";                                  // 014: Código do segmento
  linha += padRight("", 3);                      // 015-017: Brancos
  linha += "1";                                  // 018: Tipo de inscrição (1 = CPF)
  linha += padLeft(onlyDigits(favorecido.cpf), 14); // 019-032: CPF
  // Endereço do favorecido (cadastro do servidor); o que faltar sai em branco/zeros.
  const end = favorecido.endereco ?? {};
  linha += padRight(normalize(end.logradouro || ""), 30); // 033-062: Logradouro
  linha += numeroEndereco(end.numero);           // 063-067: Número
  linha += padRight(normalize(end.complemento || ""), 15); // 068-082: Complemento
  linha += padRight(normalize(end.bairro || ""), 15); // 083-097: Bairro
  linha += padRight(normalize(end.cidade || ""), 20); // 098-117: Cidade
  linha += padLeft(onlyDigits(end.cep || "").slice(0, 8), 8); // 118-125: CEP
  linha += padRight(normalize(end.uf || ""), 2); // 126-127: UF
  linha += formatDate(favorecido.dataCredito, "DDMMYYYY"); // 128-135: Data vencimento
  linha += formatValue(favorecido.valor, 15);   // 136-150: Valor
  linha += formatValue(0, 15);                   // 151-165: Abatimento
  linha += formatValue(0, 15);                   // 166-180: Desconto
  linha += formatValue(0, 15);                   // 181-195: Mora
  linha += formatValue(0, 15);                   // 196-210: Multa
  linha += padRight(favorecido.identificador, 15); // 211-225: Código documento
  linha += padRight("", 1);                      // 226: Aviso favorecido
  linha += padRight("", 6);                      // 227-232: Reservado
  linha += padRight("", 8);                      // 233-240: Brancos

  return linha;
}

// Gerar Trailer de Lote (Registro Tipo 5)
function gerarTrailerLote(
  banco: string,
  numeroLote: number,
  quantidadeRegistros: number,
  valorTotalCentavos: number
): string {
  let linha = "";
  linha += padLeft(banco, 3);                    // 001-003: Código do banco
  linha += padLeft(numeroLote.toString(), 4);   // 004-007: Número do lote
  linha += "5";                                  // 008: Tipo de registro (5 = Trailer lote)
  linha += padRight("", 9);                      // 009-017: Brancos
  linha += padLeft(quantidadeRegistros.toString(), 6); // 018-023: Quantidade registros lote
  linha += formatCentavos(valorTotalCentavos, 18); // 024-041: Somatória dos valores (centavos)
  linha += padLeft("0", 18);                     // 042-059: Somatória quantidade moeda
  linha += padLeft("", 6);                       // 060-065: Número aviso débito
  linha += padRight("", 165);                    // 066-230: Brancos
  linha += padRight("", 10);                     // 231-240: Ocorrências (só no retorno)

  return linha;
}

// Gerar Trailer de Arquivo (Registro Tipo 9)
function gerarTrailerArquivo(
  banco: string,
  quantidadeLotes: number,
  quantidadeRegistros: number
): string {
  let linha = "";
  linha += padLeft(banco, 3);                    // 001-003: Código do banco
  linha += "9999";                               // 004-007: Lote de serviço (9999 = trailer)
  linha += "9";                                  // 008: Tipo de registro (9 = Trailer arquivo)
  linha += padRight("", 9);                      // 009-017: Brancos
  linha += padLeft(quantidadeLotes.toString(), 6); // 018-023: Quantidade de lotes
  linha += padLeft(quantidadeRegistros.toString(), 6); // 024-029: Quantidade de registros
  linha += padLeft("", 6);                       // 030-035: Quantidade contas conciliação
  linha += padRight("", 205);                    // 036-240: Brancos

  return linha;
}

/**
 * Forma de pagamento (G014) por favorecido; um lote por forma (conferir no manual do banco):
 *  - 01: crédito em conta corrente no mesmo banco da conta pagadora;
 *  - 05: crédito em poupança no mesmo banco;
 *  - 41: TED para outro banco (câmara 018, finalidade 00004 salários).
 */
export type FormaPagamento = "01" | "05" | "41";

export function formaDoFavorecido(empresa: Pick<DadosEmpresa, "banco">, favorecido: Pick<DadosFavorecido, "banco" | "tipoConta">): FormaPagamento {
  if (padLeft(onlyDigits(favorecido.banco), 3) !== padLeft(onlyDigits(empresa.banco), 3)) return "41";
  return favorecido.tipoConta === "CP" ? "05" : "01";
}

const ORDEM_FORMAS: FormaPagamento[] = ["01", "05", "41"];

/** Conta pagadora no BB usa o leiaute aceito pelo banco; as demais, o FEBRABAN genérico. */
const pagadorNoBB = (empresa: Pick<DadosEmpresa, "banco">) => padLeft(onlyDigits(empresa.banco), 3) === "001";

// Função principal para gerar arquivo CNAB240
export function gerarCNAB240(remessa: RemessaCNAB): string {
  if (pagadorNoBB(remessa.empresa)) return gerarFolhaBbCnab240(remessa);
  const linhas: string[] = [];
  const { empresa, favorecidos } = remessa;

  // Header de arquivo
  linhas.push(gerarHeaderArquivo(remessa));

  // Um lote por forma de pagamento, na ordem 01, 05, 41 (lotes vazios não entram)
  let numeroLote = 0;
  for (const forma of ORDEM_FORMAS) {
    const doLote = favorecidos.filter((f) => formaDoFavorecido(empresa, f) === forma);
    if (doLote.length === 0) continue;
    numeroLote += 1;
    linhas.push(gerarHeaderLote(remessa, numeroLote, forma));

    // Segmentos A e B: sequencial recomeça em 1 em cada lote; soma em centavos inteiros, linha a linha
    let sequencial = 1;
    let totalCentavos = 0;
    for (const favorecido of doLote) {
      linhas.push(gerarSegmentoA(empresa, favorecido, numeroLote, sequencial++, forma));
      linhas.push(gerarSegmentoB(empresa, favorecido, numeroLote, sequencial++));
      totalCentavos += centavos(favorecido.valor);
    }

    // Registros do lote = header + detalhes + trailer
    linhas.push(gerarTrailerLote(empresa.banco, numeroLote, 2 + doLote.length * 2, totalCentavos));
  }

  // Trailer de arquivo: total de registros = todas as linhas, com o próprio trailer
  linhas.push(gerarTrailerArquivo(empresa.banco, numeroLote, linhas.length + 1));

  // Campo maior que o leiaute (ex.: conta com mais de 12 dígitos) desalinha o arquivo: recusa em vez de entregar.
  linhas.forEach((linha, i) => {
    if (linha.length !== 240) {
      throw new Error(`Linha ${i + 1} do arquivo CNAB com ${linha.length} posições (esperado 240). Revise os dados bancários.`);
    }
  });

  return linhas.join("\r\n");
}

const listaCurta = (nomes: string[], max = 8) =>
  nomes.length <= max ? nomes.join(", ") : `${nomes.slice(0, max).join(", ")} e mais ${nomes.length - max}`;

/**
 * Lista o que falta no cadastro para gerar a remessa (vazia = pode gerar). Sem mensagens de CPF ou conta: só o nome
 * do servidor e o campo que falta.
 */
export function validarRemessaCNAB(empresa: DadosEmpresa, favorecidos: DadosFavorecido[]): string[] {
  const faltas: string[] = [];
  if (onlyDigits(empresa.cnpj).length !== 14) faltas.push("CNPJ da instituição (Configurações da Folha)");
  if (!empresa.razaoSocial?.trim()) faltas.push("razão social da instituição (Configurações da Folha)");
  if (onlyDigits(empresa.banco).length !== 3) faltas.push("código do banco da conta pagadora (Bancos e Contas)");
  if (!empresa.nomeBanco?.trim()) faltas.push("nome do banco da conta pagadora (Bancos e Contas)");
  if (!onlyDigits(empresa.agencia)) faltas.push("agência da conta pagadora");
  if (!onlyDigits(empresa.conta)) faltas.push("número da conta pagadora");
  if (!empresa.contaDigito?.trim()) faltas.push("dígito da conta pagadora (Bancos e Contas)");
  if ((empresa.contaDigito?.trim().length ?? 0) > 1) faltas.push("dígito da conta pagadora com mais de 1 caractere (Bancos e Contas)");
  if ((empresa.agenciaDigito?.trim().length ?? 0) > 1) faltas.push("dígito da agência pagadora com mais de 1 caractere (Bancos e Contas)");
  const end = empresa.endereco;
  if (!end.logradouro?.trim()) faltas.push("logradouro da instituição (Configurações da Folha)");
  if (!end.cidade?.trim()) faltas.push("cidade da instituição (Configurações da Folha)");
  if (onlyDigits(end.cep ?? "").length !== 8) faltas.push("CEP da instituição, 8 dígitos (Configurações da Folha)");
  if (!/^[A-Za-z]{2}$/.test(end.uf?.trim() ?? "")) faltas.push("UF da instituição (Configurações da Folha)");

  const porCampo = new Map<string, string[]>();
  const anotar = (campo: string, nome: string) => porCampo.set(campo, [...(porCampo.get(campo) ?? []), nome || "(sem nome)"]);
  let faltaNaFicha = false;
  const anotarBanco = (campo: string, nome: string) => {
    faltaNaFicha = true;
    anotar(campo, nome);
  };
  for (const f of favorecidos) {
    if (!f.nome?.trim()) anotar("nome", f.identificador);
    if (onlyDigits(f.cpf).length !== 11) anotar("CPF", f.nome);
    if (onlyDigits(f.banco).length !== 3) anotarBanco("código do banco", f.nome);
    if (!onlyDigits(f.agencia)) anotarBanco("agência", f.nome);
    if (!onlyDigits(f.conta)) anotarBanco("conta", f.nome);
    if (!f.contaDigito?.trim()) anotarBanco("dígito da conta (formato 12345-6)", f.nome);
    if ((f.contaDigito?.trim().length ?? 0) > 1) anotarBanco("dígito da conta com mais de 1 caractere", f.nome);
    if ((f.agenciaDigito?.trim().length ?? 0) > 1) anotarBanco("dígito da agência com mais de 1 caractere", f.nome);
    if (!(f.valor > 0)) anotar("valor líquido", f.nome);
  }
  porCampo.forEach((nomes, campo) => faltas.push(`${campo} de ${nomes.length} servidor(es): ${listaCurta(nomes)}`));
  if (pagadorNoBB(empresa)) faltas.push(...pendenciasFolhaBb({ favorecidos }));
  if (faltaNaFicha) {
    faltas.push(
      "Os dados bancários dos servidores vêm da ficha financeira desta folha (copiados do cadastro no processamento): " +
        "corrigir o cadastro do servidor não basta, é preciso reabrir a folha, reprocessar e fechar de novo.",
    );
  }
  return faltas;
}

/** Conteúdo do arquivo como Blob: são estes bytes que vão para o bucket, para o sha256 e para o download. */
export function arquivoCNAB(conteudo: string): Blob {
  return new Blob([conteudo], { type: "text/plain;charset=utf-8" });
}

// Função para download do arquivo (o mesmo Blob guardado no bucket, para o hash conferir)
export function downloadCNAB(conteudo: string | Blob, nomeArquivo: string): void {
  const blob = typeof conteudo === "string" ? arquivoCNAB(conteudo) : conteudo;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
