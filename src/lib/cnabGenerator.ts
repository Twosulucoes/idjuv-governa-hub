/**
 * Gerador de Arquivos CNAB240 para Pagamento de Folha
 * Padrão FEBRABAN para transferência bancária
 */

export interface DadosEmpresa {
  cnpj: string;
  razaoSocial: string;
  banco: string;
  agencia: string;
  agenciaDigito?: string;
  conta: string;
  contaDigito?: string;
  convenio?: string;
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
  linha += padRight("BANCO DO BRASIL", 30);      // 103-132: Nome do banco
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
function gerarHeaderLote(remessa: RemessaCNAB, numeroLote: number): string {
  const { empresa, dataGeracao } = remessa;

  let linha = "";
  linha += padLeft(empresa.banco, 3);           // 001-003: Código do banco
  linha += padLeft(numeroLote.toString(), 4);   // 004-007: Número do lote
  linha += "1";                                  // 008: Tipo de registro (1 = Header lote)
  linha += "C";                                  // 009: Tipo de operação (C = Crédito)
  linha += "20";                                 // 010-011: Tipo de pagamento (20 = Fornecedores)
  linha += "01";                                 // 012-013: Forma de pagamento (01 = Crédito em conta)
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
  linha += padRight("", 40);                     // 103-142: Mensagem 1
  linha += padRight("", 30);                     // 143-172: Endereço
  linha += padLeft("", 5);                       // 173-177: Número
  linha += padRight("", 15);                     // 178-192: Complemento
  linha += padRight("", 20);                     // 193-212: Cidade
  linha += padLeft("", 5);                       // 213-217: CEP
  linha += padRight("", 3);                      // 218-220: Sufixo CEP
  linha += padRight("RR", 2);                    // 221-222: UF
  linha += padRight("", 8);                      // 223-230: Reservado
  linha += padRight("", 10);                     // 231-240: Brancos

  return linha;
}

// Gerar Segmento A (Dados do Pagamento)
function gerarSegmentoA(
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
  linha += "A";                                  // 014: Código do segmento
  linha += "0";                                  // 015: Tipo de movimento (0 = Inclusão)
  linha += "00";                                 // 016-017: Código da instrução
  linha += "000";                                // 018-020: Câmara centralizadora
  linha += padLeft(favorecido.banco, 3);        // 021-023: Código banco favorecido
  linha += padLeft(onlyDigits(favorecido.agencia), 5); // 024-028: Agência
  linha += padRight(favorecido.agenciaDigito || "", 1); // 029: Dígito agência
  linha += padLeft(onlyDigits(favorecido.conta), 12);  // 030-041: Conta
  linha += padRight(favorecido.contaDigito || "", 1);  // 042: Dígito conta
  linha += " ";                                  // 043: Dígito verificador
  linha += padRight(normalize(favorecido.nome), 30); // 044-073: Nome favorecido
  linha += padRight(favorecido.identificador, 20); // 074-093: Documento empresa
  linha += formatDate(favorecido.dataCredito, "DDMMYYYY"); // 094-101: Data pagamento
  linha += "BRL";                                // 102-104: Tipo moeda
  linha += padLeft("0", 15);                     // 105-119: Quantidade moeda
  linha += formatValue(favorecido.valor, 15);   // 120-134: Valor pagamento
  linha += padRight("", 20);                     // 135-154: Nosso número
  linha += formatDate(favorecido.dataCredito, "DDMMYYYY"); // 155-162: Data real efetivação
  linha += formatValue(favorecido.valor, 15);   // 163-177: Valor real efetivação
  linha += padRight("", 40);                     // 178-217: Informações complementares
  linha += padRight("", 2);                      // 218-219: Tipo de documento
  linha += padLeft("", 10);                      // 220-229: Número documento
  linha += padLeft("", 5);                       // 230-234: Número cartão
  linha += padRight("", 6);                      // 235-240: Brancos

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
  linha += padRight("", 30);                     // 033-062: Logradouro
  linha += padLeft("", 5);                       // 063-067: Número
  linha += padRight("", 15);                     // 068-082: Complemento
  linha += padRight("", 15);                     // 083-097: Bairro
  linha += padRight("BOA VISTA", 20);            // 098-117: Cidade
  linha += padLeft("69300000", 8);               // 118-125: CEP
  linha += padRight("RR", 2);                    // 126-127: UF
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
  valorTotal: number
): string {
  let linha = "";
  linha += padLeft(banco, 3);                    // 001-003: Código do banco
  linha += padLeft(numeroLote.toString(), 4);   // 004-007: Número do lote
  linha += "5";                                  // 008: Tipo de registro (5 = Trailer lote)
  linha += padRight("", 9);                      // 009-017: Brancos
  linha += padLeft(quantidadeRegistros.toString(), 6); // 018-023: Quantidade registros lote
  linha += formatValue(valorTotal, 18);          // 024-041: Somatória valores
  linha += padLeft("0", 18);                     // 042-059: Somatória quantidade moeda
  linha += padLeft("", 6);                       // 060-065: Número aviso débito
  linha += padRight("", 165);                    // 066-230: Brancos
  linha += padRight("", 10);                     // 231-240: Ocorrências

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

// Função principal para gerar arquivo CNAB240
export function gerarCNAB240(remessa: RemessaCNAB): string {
  const linhas: string[] = [];
  const { empresa, favorecidos } = remessa;

  // Header de arquivo
  linhas.push(gerarHeaderArquivo(remessa));

  // Header de lote
  const numeroLote = 1;
  linhas.push(gerarHeaderLote(remessa, numeroLote));

  // Registros de detalhe (Segmentos A e B)
  let sequencial = 1;
  let valorTotalLote = 0;

  for (const favorecido of favorecidos) {
    linhas.push(gerarSegmentoA(empresa, favorecido, numeroLote, sequencial++));
    linhas.push(gerarSegmentoB(empresa, favorecido, numeroLote, sequencial++));
    valorTotalLote += favorecido.valor;
  }

  // Quantidade de registros no lote = header + detalhes + trailer
  const qtdRegistrosLote = 2 + favorecidos.length * 2;

  // Trailer de lote
  linhas.push(
    gerarTrailerLote(empresa.banco, numeroLote, qtdRegistrosLote, valorTotalLote)
  );

  // Quantidade total de registros = header arquivo + registros do lote + trailer arquivo
  const qtdTotalRegistros = 1 + qtdRegistrosLote + 1;

  // Trailer de arquivo
  linhas.push(gerarTrailerArquivo(empresa.banco, 1, qtdTotalRegistros));

  return linhas.join("\r\n");
}

// Função para download do arquivo
export function downloadCNAB(conteudo: string, nomeArquivo: string): void {
  const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
