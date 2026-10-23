/**
 * Gerador da remessa OBN600 (ordens bancárias de crédito em conta) a partir dos pagamentos do sistema.
 * O leitor do mesmo leiaute (remessa e retorno) está em `./obn600.ts`; as posições vêm de lá.
 *
 * Reproduz byte a byte as remessas reais geradas hoje pelo sistema estadual de finanças (conferido com
 * remessas de 25/09, 08/10 e 15/10/2026):
 *   350 colunas · header 0 · uma linha '2' por OB · trailer 9 · CRLF entre as linhas, sem CRLF no fim.
 * Só crédito em conta: tipo 32 (favorecido no BB) e 31 (outro banco). Fatura/guia (tipo 38, código de
 * barras) fica fora.
 *
 * Nada aqui é fixo da instituição: código do cliente no banco, UG, gestão, agência e conta pagadora vêm do
 * banco de dados (`contas_autarquia`). Itens deduzidos estão marcados "conferir no manual".
 */

export interface PagadorObn600 {
  /** Código do cliente no BB (posições 059-067 do header, 9 dígitos) */
  codigoCliente: string;
  /** Unidade gestora emitente (6 dígitos) */
  unidadeGestora: string;
  /** Gestão (5 dígitos) */
  gestao: string;
  agencia: string;
  agenciaDigito: string;
  conta: string;
  contaDigito: string;
}

export interface OrdemBancariaObn600 {
  /** Nº da relação (11 dígitos): agrupa as OBs do mesmo tipo no arquivo */
  relacao: string;
  /** Nº da OB (11 dígitos): volta no retorno e liga o retorno ao pagamento */
  numeroOb: string;
  /** Data da OB: YYYY-MM-DD */
  data: string;
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
  endereco?: string;
  municipio?: string;
  cep?: string;
  uf?: string;
}

export interface RemessaObn600 {
  pagador: PagadorObn600;
  /** Nº da remessa (posições 048-052, 5 dígitos) */
  sequencial: number;
  dataGeracao: Date;
  ordens: OrdemBancariaObn600[];
}

export interface ArquivoObn600 {
  conteudo: string;
  registros: number;
  quantidade: number;
  valorTotalCentavos: number;
}

export const TAMANHO_LINHA_OBN600_REMESSA = 350;
const BANCO_BB = "001";

const digitos = (s: string) => (s ?? "").replace(/\D/g, "");
const zeros = (s: string | number, n: number) => String(s).padStart(n, "0").slice(-n);
const brancos = (n: number) => " ".repeat(n);
const texto = (s: string, n: number) => (s ?? "").padEnd(n, " ").substring(0, n);
const centavos = (v: number) => Math.round(v * 100);

/**
 * Texto livre (nome, endereço, município): sem acento e só ASCII visível. Ao contrário do CNAB, o arquivo
 * do sistema estadual mantém maiúsculas e minúsculas como no cadastro.
 */
export function textoObn600(s: string): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function dataDDMMAAAA(d: Date): string {
  return zeros(d.getDate(), 2) + zeros(d.getMonth() + 1, 2) + zeros(d.getFullYear(), 4);
}

function horaHHMM(d: Date): string {
  return zeros(d.getHours(), 2) + zeros(d.getMinutes(), 2);
}

/** YYYY-MM-DD → DDMMAAAA */
function dataIso(iso: string): string {
  const [a, m, d] = iso.split("-");
  return `${d}${m}${a}`;
}

/** Tipo de OB: 32 crédito em conta no BB, 31 crédito em outro banco. */
export function tipoOrdemObn600(banco: string): "31" | "32" {
  return zeros(digitos(banco), 3) === BANCO_BB ? "32" : "31";
}

/** 002-006 / 320-334: agência (4) + DV e, no fim do registro, conta (9) + DV. */
const agenciaPagadora = (p: PagadorObn600) => zeros(digitos(p.agencia), 4) + texto(p.agenciaDigito.trim().toUpperCase(), 1);
const contaPagadora = (p: PagadorObn600) => zeros(digitos(p.conta), 9) + texto(p.contaDigito.trim().toUpperCase(), 1);

function header(r: RemessaObn600): string {
  return [
    "0", //                                          001 header
    zeros(0, 34), //                                 002-035
    dataDDMMAAAA(r.dataGeracao), //                  036-043 data de geração
    horaHHMM(r.dataGeracao), //                      044-047 hora
    zeros(r.sequencial, 5), //                       048-052 nº da remessa
    "10", //                                         053-054 remessa (o retorno vem com '20')
    "B", //                                          055 (conferir no manual)
    BANCO_BB, //                                     056-058 banco
    zeros(digitos(r.pagador.codigoCliente), 9), //   059-067 código do cliente no banco
    brancos(276), //                                 068-343
    zeros(1, 7), //                                  344-350 sequencial do registro
  ].join("");
}

function ordem(p: PagadorObn600, o: OrdemBancariaObn600, registro: number): string {
  const doc = digitos(o.documento);
  return [
    "2", //                                          001 ordem bancária
    agenciaPagadora(p), //                           002-006 agência pagadora + DV
    zeros(digitos(p.unidadeGestora), 6), //          007-012 unidade gestora
    zeros(digitos(p.gestao), 5), //                  013-017 gestão
    zeros(digitos(o.relacao), 11), //                018-028 nº da relação
    zeros(digitos(o.numeroOb), 11), //               029-039 nº da OB
    dataIso(o.data), //                              040-047 data da OB
    brancos(4), //                                   048-051
    tipoOrdemObn600(o.banco), //                     052-053 tipo de OB
    zeros(centavos(o.valor), 27), //                 054-080 valor
    zeros(digitos(o.banco), 3), //                   081-083 banco do favorecido
    zeros(digitos(o.agencia), 4), //                 084-087 agência
    texto(o.agencia_dv.trim().toUpperCase(), 1), //  088 DV agência
    zeros(digitos(o.conta), 9), //                   089-097 conta
    texto(o.conta_dv.trim().toUpperCase(), 1), //    098 DV conta
    texto(textoObn600(o.nome), 45), //               099-143 nome do favorecido
    texto(textoObn600(o.endereco ?? ""), 65), //     144-208 endereço
    texto(textoObn600(o.municipio ?? ""), 28), //    209-236 município
    brancos(17), //                                  237-253 (zeros só em fatura)
    digitos(o.cep ?? "") ? zeros(digitos(o.cep ?? ""), 8) : brancos(8), // 254-261 CEP (em branco se não houver)
    texto(textoObn600(o.uf ?? "").toUpperCase(), 2), // 262-263 UF
    brancos(40), //                                  264-303 observação
    doc.length === 14 ? "01" : "02", //              304-305 tipo de inscrição (01 CNPJ, 02 CPF)
    texto(doc, 14), //                               306-319 CPF/CNPJ, alinhado à esquerda
    agenciaPagadora(p) + contaPagadora(p), //        320-334 agência + conta pagadora (conferir no manual)
    brancos(9), //                                   335-343 (código de retorno só no retorno)
    zeros(registro, 7), //                           344-350 sequencial do registro
  ].join("");
}

function trailer(somaCentavos: number, somaSequenciais: number): string {
  return [
    "9".repeat(35), //                               001-035
    brancos(285), //                                 036-320
    zeros(somaCentavos, 17), //                      321-337 soma dos valores
    zeros(somaSequenciais, 13), //                   338-350 soma dos sequenciais dos registros anteriores
  ].join("");
}

/** O que impede gerar o arquivo (vazio = pode gerar). Mensagens sem CPF/conta: só a posição da OB. */
export function validarRemessaObn600(r: RemessaObn600): string[] {
  const faltas: string[] = [];
  const p = r.pagador;
  if (!digitos(p.codigoCliente) || digitos(p.codigoCliente).length > 9) faltas.push("Código do cliente no banco (OBN)");
  if (!digitos(p.unidadeGestora) || digitos(p.unidadeGestora).length > 6) faltas.push("Unidade gestora (OBN)");
  if (!digitos(p.gestao) || digitos(p.gestao).length > 5) faltas.push("Gestão (OBN)");
  if (!digitos(p.agencia) || digitos(p.agencia).length > 4) faltas.push("Agência pagadora (até 4 dígitos)");
  if (!digitos(p.conta) || digitos(p.conta).length > 9) faltas.push("Conta pagadora (até 9 dígitos)");
  if (!Number.isInteger(r.sequencial) || r.sequencial < 1 || r.sequencial > 99999) faltas.push("Nº da remessa (1 a 99999)");
  if (!r.ordens.length) faltas.push("Nenhum pagamento selecionado");
  r.ordens.forEach((o, i) => {
    const n = i + 1;
    if (!textoObn600(o.nome)) faltas.push(`OB ${n}: nome do favorecido`);
    if (![11, 14].includes(digitos(o.documento).length)) faltas.push(`OB ${n}: CPF/CNPJ do favorecido`);
    if (!digitos(o.banco) || digitos(o.banco).length > 3) faltas.push(`OB ${n}: banco`);
    if (!digitos(o.agencia) || digitos(o.agencia).length > 4) faltas.push(`OB ${n}: agência (até 4 dígitos)`);
    if (!digitos(o.conta) || digitos(o.conta).length > 9) faltas.push(`OB ${n}: conta (até 9 dígitos)`);
    if (o.agencia_dv.trim().length > 1 || o.conta_dv.trim().length > 1) faltas.push(`OB ${n}: dígito com mais de 1 posição`);
    if (!digitos(o.relacao) || digitos(o.relacao).length > 11) faltas.push(`OB ${n}: nº da relação`);
    if (!digitos(o.numeroOb) || digitos(o.numeroOb).length > 11) faltas.push(`OB ${n}: nº da OB`);
    if (!(o.valor > 0)) faltas.push(`OB ${n}: valor`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(o.data)) faltas.push(`OB ${n}: data`);
  });
  return faltas;
}

/** Gera o arquivo com as OBs na ordem da lista (o servidor já entrega ordenado por relação). */
export function gerarObn600Remessa(r: RemessaObn600): ArquivoObn600 {
  const linhas: string[] = [header(r)];
  let soma = 0;
  for (const o of r.ordens) {
    linhas.push(ordem(r.pagador, o, linhas.length + 1));
    soma += centavos(o.valor);
  }
  // Soma de 1..n, onde n é o sequencial do último registro antes do trailer
  const n = linhas.length;
  linhas.push(trailer(soma, (n * (n + 1)) / 2));

  const erradas = linhas.filter((l) => l.length !== TAMANHO_LINHA_OBN600_REMESSA).length;
  if (erradas) throw new Error(`Erro interno do gerador: ${erradas} linha(s) fora de 350 posições.`);

  return {
    conteudo: linhas.join("\r\n"),
    registros: linhas.length,
    quantidade: r.ordens.length,
    valorTotalCentavos: soma,
  };
}

/** Nome do arquivo: obn600_<DDMMAAAA>_<nº da remessa>_bco001.txt */
export function nomeArquivoObn600(data: Date, sequencial: number): string {
  return `obn600_${dataDDMMAAAA(data)}_${zeros(sequencial, 5)}_bco${BANCO_BB}.txt`;
}
