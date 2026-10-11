/**
 * Gerador de CNAB 240 no leiaute do BB Gestão MAX (pagamentos a fornecedores/salários), usado para reenviar
 * créditos recusados. O arquivo é baixado e enviado pelo usuário no Gestão MAX; o retorno volta pelo
 * importador de arquivos bancários.
 *
 * Reproduz byte a byte os arquivos gerados pelo próprio Gestão MAX (conferido com remessas reais):
 *   header de arquivo leiaute 050 · header de lote leiaute 031 · segmentos A e B · trailers ·
 *   240 colunas · CRLF depois de cada linha, inclusive a última.
 * Um lote por forma: crédito em conta BB (forma 01) e DOC para outro banco (forma 03, câmara 700).
 *
 * Nada aqui é fixo da instituição: CNPJ, nome, endereço, convênio, agência e conta vêm do banco de dados
 * (`config_autarquia`/perfil do tenant e `contas_autarquia`). Itens deduzidos estão marcados "conferir no manual".
 */

export interface EnderecoPagadorGestaoMax {
  logradouro: string;
  numero?: string;
  complemento?: string;
  cidade: string;
  cep: string;
  uf: string;
}

export interface PagadorGestaoMax {
  cnpj: string;
  nome: string;
  /** Convênio de pagamento no BB (até 9 dígitos) */
  convenio: string;
  agencia: string;
  agenciaDigito: string;
  conta: string;
  contaDigito: string;
  endereco: EnderecoPagadorGestaoMax;
}

export interface CreditoGestaoMax {
  nome: string;
  /** CPF (11) ou CNPJ (14), com ou sem máscara */
  documento: string;
  banco: string;
  agencia: string;
  agencia_dv: string;
  conta: string;
  conta_dv: string;
  /** Em reais */
  valor: number;
  /** Data do crédito: YYYY-MM-DD */
  data: string;
  /** Identificação do crédito para a instituição (volta no retorno); até 20 posições */
  seu_numero: string;
  /** Finalidade do DOC (2 dígitos), só para outro banco. Padrão '01' (crédito em conta corrente). */
  finalidade_doc?: string;
}

export interface RemessaGestaoMax {
  pagador: PagadorGestaoMax;
  /** Número sequencial do arquivo (reservado por `registrar_remessa_bancaria`) */
  nsa: number;
  dataGeracao: Date;
  creditos: CreditoGestaoMax[];
  /** Serviço dos créditos em conta BB: '98' pagamentos diversos (padrão) ou '30' salários */
  servicoCreditoBB?: "98" | "30";
  /**
   * Posições 231-240 do header de lote. O Gestão MAX grava a versão do aplicativo ("V.PAG2002x");
   * no padrão FEBRABAN são brancos na remessa. Conferir no manual.
   */
  identificacaoAplicativo?: string;
}

export interface ArquivoGestaoMax {
  conteudo: string;
  lotes: number;
  registros: number;
  quantidade: number;
  valorTotalCentavos: number;
}

const BANCO_BB = "001";
const NOME_BANCO = "BANCO DO BRASIL S/A";
/** Código do produto "pagamentos" no convênio BB (posições 042-045). Conferir no manual. */
const PRODUTO_PAGAMENTOS = "0126";
export const IDENTIFICACAO_APLICATIVO_PADRAO = "V.PAG20029";

const digitos = (s: string) => (s ?? "").replace(/\D/g, "");
const zeros = (s: string | number, n: number) => String(s).padStart(n, "0").slice(-n);
const brancos = (n: number) => " ".repeat(n);
const texto = (s: string, n: number) => (s ?? "").padEnd(n, " ").substring(0, n);

/** Maiúsculas sem acento; mantém letras, números, espaço e . / - &; tira vírgula e o resto. */
export function textoBancario(s: string): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ./&-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function dataDDMMAAAA(d: Date): string {
  return zeros(d.getDate(), 2) + zeros(d.getMonth() + 1, 2) + zeros(d.getFullYear(), 4);
}

function horaHHMMSS(d: Date): string {
  return zeros(d.getHours(), 2) + zeros(d.getMinutes(), 2) + zeros(d.getSeconds(), 2);
}

/** YYYY-MM-DD → DDMMAAAA */
function dataIso(iso: string): string {
  const [a, m, d] = iso.split("-");
  return `${d}${m}${a}`;
}

const centavos = (v: number) => Math.round(v * 100);

/** 033-052: '000' + convênio + produto 0126 + brancos (o Gestão MAX completa o convênio com zeros à esquerda). */
function campoConvenio(convenio: string): string {
  return texto(zeros(digitos(convenio), 9) + PRODUTO_PAGAMENTOS, 20);
}

/** 053-072: agência(5) DV(1) conta(12) DV(1) DV agência/conta(1) — o Gestão MAX grava '0' no último. */
function campoContaPagadora(p: PagadorGestaoMax): string {
  return (
    zeros(digitos(p.agencia), 5) +
    texto(p.agenciaDigito.trim().toUpperCase(), 1) +
    zeros(digitos(p.conta), 12) +
    texto(p.contaDigito.trim().toUpperCase(), 1) +
    "0" // conferir no manual
  );
}

function headerArquivo(r: RemessaGestaoMax): string {
  const p = r.pagador;
  return [
    BANCO_BB, //                                   001-003 banco
    "0000", //                                     004-007 lote
    "0", //                                        008 registro header de arquivo
    brancos(9), //                                 009-017
    "2", //                                        018 tipo de inscrição (CNPJ)
    zeros(digitos(p.cnpj), 14), //                 019-032 CNPJ
    campoConvenio(p.convenio), //                  033-052 convênio + produto
    campoContaPagadora(p), //                      053-072 agência/conta
    texto(textoBancario(p.nome), 30), //           073-102 nome da empresa
    texto(NOME_BANCO, 30), //                      103-132 nome do banco
    brancos(10), //                                133-142
    "1", //                                        143 remessa
    dataDDMMAAAA(r.dataGeracao), //                144-151 data de geração
    horaHHMMSS(r.dataGeracao), //                  152-157 hora de geração
    zeros(r.nsa, 6), //                            158-163 NSA
    "050", //                                      164-166 versão do leiaute do arquivo
    "00000", //                                    167-171 densidade
    brancos(69), //                                172-240 reservado banco/empresa e brancos
  ].join("");
}

function headerLote(r: RemessaGestaoMax, numeroLote: number, servico: string, forma: string): string {
  const p = r.pagador;
  const e = p.endereco;
  const numeroEndereco = digitos(e.numero ?? "");
  const cep = zeros(digitos(e.cep), 8);
  return [
    BANCO_BB, //                                   001-003 banco
    zeros(numeroLote, 4), //                       004-007 lote
    "1", //                                        008 registro header de lote
    "C", //                                        009 operação (crédito)
    servico, //                                    010-011 serviço (98 diversos, 30 salários)
    forma, //                                      012-013 forma (01 crédito em conta, 03 DOC)
    "031", //                                      014-016 versão do leiaute do lote
    " ", //                                        017
    "2", //                                        018 tipo de inscrição
    zeros(digitos(p.cnpj), 14), //                 019-032 CNPJ
    campoConvenio(p.convenio), //                  033-052 convênio
    campoContaPagadora(p), //                      053-072 agência/conta
    texto(textoBancario(p.nome), 30), //           073-102 nome da empresa
    brancos(40), //                                103-142 mensagem
    texto(textoBancario(e.logradouro), 30), //     143-172 logradouro
    numeroEndereco ? zeros(numeroEndereco, 5) : brancos(5), // 173-177 número (em branco se não houver; conferir)
    texto(textoBancario(e.complemento ?? ""), 15), // 178-192 complemento
    texto(textoBancario(e.cidade), 20), //         193-212 cidade
    cep.slice(0, 5), //                            213-217 CEP
    cep.slice(5), //                               218-220 complemento do CEP
    texto(textoBancario(e.uf), 2), //              221-222 UF
    brancos(8), //                                 223-230
    texto(r.identificacaoAplicativo ?? IDENTIFICACAO_APLICATIVO_PADRAO, 10), // 231-240 (conferir no manual)
  ].join("");
}

/** Seu número: numérico vai com zeros à esquerda (como o Gestão MAX); texto, alinhado à esquerda. */
function campoSeuNumero(s: string): string {
  const v = (s ?? "").trim();
  return /^\d+$/.test(v) ? zeros(v, 20) : texto(textoBancario(v), 20);
}

function segmentoA(numeroLote: number, registro: number, c: CreditoGestaoMax, forma: string): string {
  const doc = forma === "03";
  const finalidade = zeros(digitos(c.finalidade_doc ?? "01") || "01", 2);
  return [
    BANCO_BB, //                                   001-003 banco
    zeros(numeroLote, 4), //                       004-007 lote
    "3", //                                        008 registro detalhe
    zeros(registro, 5), //                         009-013 nº do registro no lote
    "A", //                                        014 segmento
    "0", //                                        015 tipo de movimento (inclusão)
    "00", //                                       016-017 instrução
    doc ? "700" : "000", //                        018-020 câmara (700 DOC; 000 crédito BB)
    zeros(digitos(c.banco), 3), //                 021-023 banco do favorecido
    zeros(digitos(c.agencia), 5), //               024-028 agência
    texto(c.agencia_dv.trim().toUpperCase(), 1), // 029 DV agência (em branco se não houver)
    zeros(digitos(c.conta), 12), //                030-041 conta
    texto(c.conta_dv.trim().toUpperCase(), 1), //  042 DV conta
    " ", //                                        043 DV agência/conta
    texto(textoBancario(c.nome), 30), //           044-073 nome do favorecido
    campoSeuNumero(c.seu_numero), //               074-093 seu número
    dataIso(c.data), //                            094-101 data do pagamento
    "BRL", //                                      102-104 moeda
    zeros(0, 15), //                               105-119 quantidade de moeda
    zeros(centavos(c.valor), 15), //               120-134 valor
    brancos(20), //                                135-154 nosso número
    zeros(0, 8), //                                155-162 data real
    zeros(0, 15), //                               163-177 valor real
    doc ? finalidade : brancos(2), //              178-179 finalidade do DOC (Gestão MAX repete aqui; conferir)
    brancos(38), //                                180-217 outras informações
    doc ? finalidade : brancos(2), //              218-219 código de finalidade do DOC
    brancos(10), //                                220-229 finalidade TED / complemento
    "0", //                                        230 aviso ao favorecido (não emite)
    brancos(10), //                                231-240 ocorrências
  ].join("");
}

function segmentoB(numeroLote: number, registro: number, c: CreditoGestaoMax): string {
  const doc = digitos(c.documento);
  return [
    BANCO_BB, //                                   001-003 banco
    zeros(numeroLote, 4), //                       004-007 lote
    "3", //                                        008 registro detalhe
    zeros(registro, 5), //                         009-013 nº do registro no lote
    "B", //                                        014 segmento
    brancos(3), //                                 015-017
    doc.length > 11 ? "2" : "1", //                018 tipo de inscrição (1 CPF, 2 CNPJ)
    zeros(doc, 14), //                             019-032 CPF/CNPJ
    brancos(95), //                                033-127 endereço do favorecido (não usado)
    dataIso(c.data), //                            128-135 data de vencimento
    zeros(centavos(c.valor), 15), //               136-150 valor do documento
    brancos(90), //                                151-240
  ].join("");
}

function trailerLote(numeroLote: number, registros: number, somaCentavos: number): string {
  return [
    BANCO_BB, //                                   001-003 banco
    zeros(numeroLote, 4), //                       004-007 lote
    "5", //                                        008 trailer de lote
    brancos(9), //                                 009-017
    zeros(registros, 6), //                        018-023 quantidade de registros do lote
    zeros(somaCentavos, 18), //                    024-041 soma dos valores
    brancos(199), //                               042-240 (Gestão MAX deixa a quantidade de moeda em branco)
  ].join("");
}

function trailerArquivo(lotes: number, registros: number): string {
  return [
    BANCO_BB, //                                   001-003 banco
    "9999", //                                     004-007 lote
    "9", //                                        008 trailer de arquivo
    brancos(9), //                                 009-017
    zeros(lotes, 6), //                            018-023 quantidade de lotes
    zeros(registros, 6), //                        024-029 quantidade de registros
    brancos(211), //                               030-240
  ].join("");
}

/** O que impede gerar o arquivo (vazio = pode gerar). Mensagens sem CPF/conta: só a posição do crédito. */
export function validarRemessaGestaoMax(r: RemessaGestaoMax): string[] {
  const faltas: string[] = [];
  const p = r.pagador;
  if (digitos(p.cnpj).length !== 14) faltas.push("CNPJ do pagador");
  if (!digitos(p.convenio) || digitos(p.convenio).length > 9) faltas.push("Convênio de pagamento da conta");
  if (!digitos(p.agencia) || !digitos(p.conta)) faltas.push("Agência e conta pagadora");
  if (!p.nome.trim()) faltas.push("Nome do pagador");
  if (!Number.isInteger(r.nsa) || r.nsa < 1 || r.nsa > 999999) faltas.push("Número sequencial do arquivo (NSA)");
  if (!r.creditos.length) faltas.push("Nenhum crédito selecionado");
  r.creditos.forEach((c, i) => {
    const n = i + 1;
    if (!c.nome.trim()) faltas.push(`Crédito ${n}: nome do favorecido`);
    if (![11, 14].includes(digitos(c.documento).length)) faltas.push(`Crédito ${n}: CPF/CNPJ do favorecido`);
    if (digitos(c.banco).length === 0 || digitos(c.banco).length > 3) faltas.push(`Crédito ${n}: banco`);
    if (!digitos(c.agencia) || digitos(c.agencia).length > 5) faltas.push(`Crédito ${n}: agência`);
    if (!digitos(c.conta) || digitos(c.conta).length > 12) faltas.push(`Crédito ${n}: conta`);
    if (c.agencia_dv.trim().length > 1 || c.conta_dv.trim().length > 1) faltas.push(`Crédito ${n}: dígito com mais de 1 posição`);
    if (!(c.valor > 0)) faltas.push(`Crédito ${n}: valor`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(c.data)) faltas.push(`Crédito ${n}: data`);
  });
  return faltas;
}

/**
 * Gera o arquivo. Lotes na ordem em que cada forma aparece pela primeira vez na lista de créditos;
 * dentro do lote, na ordem da lista.
 */
export function gerarGestaoMaxCnab240(r: RemessaGestaoMax): ArquivoGestaoMax {
  const grupos = new Map<string, { servico: string; forma: string; creditos: CreditoGestaoMax[] }>();
  for (const c of r.creditos) {
    const bb = zeros(digitos(c.banco), 3) === BANCO_BB;
    const forma = bb ? "01" : "03";
    // Outro banco sai sempre como pagamentos diversos (98), como nos arquivos da folha. Conferir no manual.
    const servico = bb ? (r.servicoCreditoBB ?? "98") : "98";
    const chave = `${servico}${forma}`;
    if (!grupos.has(chave)) grupos.set(chave, { servico, forma, creditos: [] });
    grupos.get(chave)!.creditos.push(c);
  }

  const linhas: string[] = [headerArquivo(r)];
  let numeroLote = 0;
  let total = 0;
  for (const g of grupos.values()) {
    numeroLote += 1;
    linhas.push(headerLote(r, numeroLote, g.servico, g.forma));
    let registro = 0;
    let soma = 0;
    for (const c of g.creditos) {
      linhas.push(segmentoA(numeroLote, ++registro, c, g.forma));
      linhas.push(segmentoB(numeroLote, ++registro, c));
      soma += centavos(c.valor);
    }
    linhas.push(trailerLote(numeroLote, registro + 2, soma));
    total += soma;
  }
  linhas.push(trailerArquivo(numeroLote, linhas.length + 1));

  const erradas = linhas.filter((l) => l.length !== 240).length;
  if (erradas) throw new Error(`Erro interno do gerador: ${erradas} linha(s) fora de 240 posições.`);

  return {
    conteudo: linhas.map((l) => `${l}\r\n`).join(""),
    lotes: numeroLote,
    registros: linhas.length,
    quantidade: r.creditos.length,
    valorTotalCentavos: total,
  };
}

/** Nome do arquivo no padrão do Gestão MAX: PAG.<convênio>.<DDMMAAAA>.<NSA>.REM */
export function nomeArquivoGestaoMax(convenio: string, data: Date, nsa: number): string {
  return `PAG.${digitos(convenio)}.${dataDDMMAAAA(data)}.${nsa}.REM`;
}
