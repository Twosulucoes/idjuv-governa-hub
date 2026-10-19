/**
 * Remessa da folha para o Banco do Brasil (CNAB 240), no leiaute que o BB já aceita da folha da instituição:
 * reproduz byte a byte as remessas de salário e de pensão geradas pelo SIGRH, enviadas pelo Gerenciador Financeiro.
 *
 *   header de arquivo leiaute 030 · header de lote leiaute 020 · segmento A e segmento B só com o CPF · trailers ·
 *   240 colunas · CRLF depois de cada linha, inclusive a última.
 *   Lote 0001: crédito em conta no BB (serviço 30 salários, forma 01).
 *   Lote 0002: outros bancos (serviço 98 pagamentos diversos, forma 03 DOC/TED), com esse número mesmo sozinho.
 *
 * Fora do padrão FEBRABAN, mas aceito pelo banco e por isso mantido: trailers contam só os segmentos A, câmara 000
 * também para outros bancos e quantidade de créditos no campo de quantidade de moeda do trailer de lote.
 * Diferença deliberada do SIGRH: o "seu número" (074-093) leva o identificador do crédito, para o retorno casar.
 *
 * Nada aqui é fixo da instituição: CNPJ, nome, convênio, agência e conta vêm de `config_autarquia` e
 * `contas_autarquia`; os favorecidos, da ficha financeira.
 */

import type { DadosFavorecido, RemessaCNAB } from "@/lib/cnabGenerator";

const BANCO_BB = "001";
const NOME_BANCO = "BANCO DO BRASIL SA";

interface LoteFolhaBb {
  numero: number;
  servico: string;
  forma: string;
  /** Posições 218-221 do segmento A */
  finalidade: string;
}

const LOTE_BB: LoteFolhaBb = { numero: 1, servico: "30", forma: "01", finalidade: "0670" };
const LOTE_OUTROS_BANCOS: LoteFolhaBb = { numero: 2, servico: "98", forma: "03", finalidade: "0170" };

const digitos = (s: string | undefined) => (s ?? "").replace(/\D/g, "");
const zeros = (s: string | number, n: number) => String(s).padStart(n, "0").slice(-n);
const brancos = (n: number) => " ".repeat(n);
const texto = (s: string, n: number) => (s ?? "").padEnd(n, " ").substring(0, n);
const centavos = (v: number) => Math.round(v * 100);

/** Maiúsculas sem acento; mantém letras, números, espaço e , . / - & (o nome do pagador vai com vírgula). */
export function textoFolhaBb(s: string): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ,./&-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function data(d: Date): string {
  return zeros(d.getDate(), 2) + zeros(d.getMonth() + 1, 2) + zeros(d.getFullYear(), 4);
}

function hora(d: Date): string {
  return zeros(d.getHours(), 2) + zeros(d.getMinutes(), 2) + zeros(d.getSeconds(), 2);
}

/** 018-072: inscrição, convênio (20, zeros à esquerda), agência/DV, conta/DV e uma posição em branco. */
function pagador(r: RemessaCNAB): string {
  const e = r.empresa;
  return (
    "2" +
    zeros(digitos(e.cnpj), 14) +
    zeros(digitos(e.convenio), 20) +
    zeros(digitos(e.agencia), 5) +
    texto((e.agenciaDigito ?? "").trim().toUpperCase(), 1) +
    zeros(digitos(e.conta), 12) +
    texto((e.contaDigito ?? "").trim().toUpperCase(), 1) +
    " "
  );
}

function headerArquivo(r: RemessaCNAB): string {
  return [
    BANCO_BB, //                                   001-003 banco
    "0000", //                                     004-007 lote
    "0", //                                        008 header de arquivo
    brancos(9), //                                 009-017
    pagador(r), //                                 018-072 inscrição, convênio, agência e conta
    texto(textoFolhaBb(r.empresa.razaoSocial), 30), // 073-102 nome da empresa
    texto(NOME_BANCO, 30), //                      103-132 nome do banco
    brancos(10), //                                133-142
    "1", //                                        143 remessa
    data(r.dataGeracao), //                        144-151 data de geração
    hora(r.dataGeracao), //                        152-157 hora de geração
    zeros(r.numeroRemessa, 6), //                  158-163 NSA
    "030", //                                      164-166 versão do leiaute do arquivo
    "00000", //                                    167-171 densidade
    brancos(51), //                                172-222
    "CSP000", //                                   223-228 uso do banco (como nas remessas aceitas)
    brancos(12), //                                229-240
  ].join("");
}

function headerLote(r: RemessaCNAB, lote: LoteFolhaBb): string {
  return [
    BANCO_BB, //                                   001-003 banco
    zeros(lote.numero, 4), //                      004-007 lote
    "1", //                                        008 header de lote
    "C", //                                        009 operação (crédito)
    lote.servico, //                               010-011 serviço
    lote.forma, //                                 012-013 forma de lançamento
    "020", //                                      014-016 versão do leiaute do lote
    " ", //                                        017
    pagador(r), //                                 018-072 inscrição, convênio, agência e conta
    texto(textoFolhaBb(r.empresa.razaoSocial), 30), // 073-102 nome da empresa
    brancos(70), //                                103-172 mensagem e logradouro (não usados)
    zeros(0, 5), //                                173-177 número
    brancos(35), //                                178-212 complemento e cidade (não usados)
    zeros(0, 8), //                                213-220 CEP
    brancos(20), //                                221-240
  ].join("");
}

function segmentoA(lote: LoteFolhaBb, sequencial: number, f: DadosFavorecido): string {
  return [
    BANCO_BB, //                                   001-003 banco
    zeros(lote.numero, 4), //                      004-007 lote
    "3", //                                        008 detalhe
    zeros(sequencial, 5), //                       009-013 sequencial do crédito no lote
    "A", //                                        014 segmento
    "0", //                                        015 inclusão
    "00", //                                       016-017 instrução
    "000", //                                      018-020 câmara (000 também para outros bancos)
    zeros(digitos(f.banco), 3), //                 021-023 banco do favorecido
    zeros(digitos(f.agencia), 5), //               024-028 agência
    texto((f.agenciaDigito ?? "").trim().toUpperCase(), 1), // 029 DV da agência
    zeros(digitos(f.conta), 12), //                030-041 conta
    texto((f.contaDigito ?? "").trim().toUpperCase(), 1), // 042 DV da conta
    " ", //                                        043
    texto(textoFolhaBb(f.nome), 30), //            044-073 nome do favorecido
    texto(f.identificador ?? "", 20), //           074-093 seu número
    data(f.dataCredito), //                        094-101 data do pagamento
    "BRL", //                                      102-104 moeda
    zeros(0, 15), //                               105-119 quantidade de moeda
    zeros(centavos(f.valor), 15), //               120-134 valor
    brancos(28), //                                135-162 nosso número e data real
    zeros(centavos(f.valor), 15), //               163-177 valor (repetido, como nas remessas aceitas)
    "06", //                                       178-179
    brancos(38), //                                180-217
    lote.finalidade, //                            218-221 finalidade
    brancos(8), //                                 222-229
    "0", //                                        230 aviso ao favorecido
    brancos(10), //                                231-240
  ].join("");
}

function segmentoB(lote: LoteFolhaBb, sequencial: number, f: DadosFavorecido): string {
  return [
    BANCO_BB, //                                   001-003 banco
    zeros(lote.numero, 4), //                      004-007 lote
    "3", //                                        008 detalhe
    zeros(sequencial, 5), //                       009-013 o mesmo sequencial do segmento A
    "B", //                                        014 segmento
    brancos(3), //                                 015-017
    "1", //                                        018 CPF
    zeros(digitos(f.cpf), 14), //                  019-032 CPF
    brancos(208), //                               033-240 endereço não usado
  ].join("");
}

function trailerLote(lote: LoteFolhaBb, quantidade: number, somaCentavos: number): string {
  return [
    BANCO_BB, //                                   001-003 banco
    zeros(lote.numero, 4), //                      004-007 lote
    "5", //                                        008 trailer de lote
    brancos(9), //                                 009-017
    zeros(quantidade + 2, 6), //                   018-023 registros (só segmentos A, header e trailer)
    zeros(somaCentavos, 18), //                    024-041 soma dos valores
    zeros(quantidade * 100000, 18), //             042-059 quantidade de créditos, 5 casas decimais
    brancos(181), //                               060-240
  ].join("");
}

function trailerArquivo(lotes: number, registros: number): string {
  return [
    BANCO_BB, //                                   001-003 banco
    "9999", //                                     004-007 lote
    "9", //                                        008 trailer de arquivo
    brancos(9), //                                 009-017
    zeros(lotes, 6), //                            018-023 quantidade de lotes
    zeros(registros, 6), //                        024-029 registros (sem os segmentos B)
    brancos(211), //                               030-240
  ].join("");
}

const ehBB = (banco: string) => zeros(digitos(banco), 3) === BANCO_BB;

/** O que este leiaute não cobre (vazio = pode gerar). Mensagens sem CPF nem conta: só o nome do servidor. */
export function pendenciasFolhaBb(r: Pick<RemessaCNAB, "favorecidos">): string[] {
  const poupancaBb = r.favorecidos.filter((f) => ehBB(f.banco) && f.tipoConta === "CP").map((f) => f.nome || "(sem nome)");
  return poupancaBb.length
    ? [
        `conta poupança no BB de ${poupancaBb.length} servidor(es): ${poupancaBb.join(", ")}. O leiaute aceito hoje pelo ` +
          "banco só tem crédito em conta corrente; troque a conta no cadastro ou confirme a forma de poupança com o BB.",
      ]
    : [];
}

/** Gera o arquivo: lote 0001 com os créditos no BB e lote 0002 com os de outros bancos, na ordem da lista. */
export function gerarFolhaBbCnab240(r: RemessaCNAB): string {
  const pendencias = pendenciasFolhaBb(r);
  if (pendencias.length) throw new Error(pendencias.join(" "));

  const linhas: string[] = [headerArquivo(r)];
  let registros = 1;
  let lotes = 0;
  for (const lote of [LOTE_BB, LOTE_OUTROS_BANCOS]) {
    const doLote = r.favorecidos.filter((f) => ehBB(f.banco) === (lote === LOTE_BB));
    if (!doLote.length) continue;
    lotes += 1;
    linhas.push(headerLote(r, lote));
    let soma = 0;
    doLote.forEach((f, i) => {
      linhas.push(segmentoA(lote, i + 1, f), segmentoB(lote, i + 1, f));
      soma += centavos(f.valor);
    });
    linhas.push(trailerLote(lote, doLote.length, soma));
    registros += doLote.length + 2;
  }
  linhas.push(trailerArquivo(lotes, registros + 1));

  linhas.forEach((linha, i) => {
    if (linha.length !== 240) {
      throw new Error(`Linha ${i + 1} do arquivo CNAB com ${linha.length} posições (esperado 240). Revise os dados bancários.`);
    }
  });
  return linhas.map((l) => `${l}\r\n`).join("");
}
