/**
 * LEITOR DO ARQUIVO DA SEPLAN (créditos bancários da folha do SIGRH) para o cadastro de servidores
 *
 * Todo mês a Seplan manda um zip "<ÓRGÃO>-CreditosBancarios<Mês><Ano> - FOLHA MENSAL" com, entre outros:
 *   - RelatoriosBancarios…/…Relatorio_MMAAAA_Fun.pdf  "Relação de Crédito Bancário — Servidores Ativos": uma linha por
 *     servidor com matrícula (0000000-0-00: matrícula, dígito e sequência do vínculo), nome, CPF, banco, agência,
 *     conta, proventos, descontos e líquido; no fim, "Total de pessoas geral" e "Total Líquido geral";
 *   - ArqBancarios…/…_ArqUnico_Fun.txt  remessa CNAB 240 do banco (segmento A: crédito; segmento B: CPF e endereço).
 * O PDF cria e atualiza o cadastro (nome completo, CPF, matrícula, conta); o TXT só completa o endereço de quem já está
 * cadastrado, porque o nome no CNAB vem cortado em 30 letras. Os arquivos "_Pen" (pensão alimentícia) são recusados.
 *
 * Sem acesso ao banco: devolve linhas e problemas; a RPC `rh_importar_servidores_sigrh` grava.
 */

import { apenasDigitos, campo, formatarAgencia, formatarConta, linhasDoArquivo } from "@/lib/bancario/comum";
import { validarCPF } from "@/lib/folhaCalculos";
import type { LinhaPdf } from "../pdfTexto";
import type { ProblemaLeitura, ResultadoLeitura } from "../types";

export type OrigemServidoresSigrh = "credito" | "banco";

export interface EnderecoServidorSigrh {
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
}

export interface LinhaServidorSigrh {
  cpf: string;
  nome: string;
  /** "0154712-7" (sem a sequência do vínculo); só no PDF */
  matricula: string | null;
  /** Sequência do vínculo no SIGRH ("04"); só no PDF */
  vinculo: string | null;
  bancoCodigo: string | null;
  bancoAgencia: string | null;
  bancoConta: string | null;
  /** Em centavos; no TXT só o líquido */
  proventos: number | null;
  descontos: number | null;
  liquido: number;
  endereco: EnderecoServidorSigrh | null;
}

type Leitura = ResultadoLeitura<LinhaServidorSigrh>;

const MESES = ["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro",
  "novembro", "dezembro"];

const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

/** "2.871,43" → 287143 */
export function centavosBR(texto: string): number | null {
  const t = texto.replace(/R\$\s*/i, "").trim();
  if (!/^\d{1,3}(\.\d{3})*,\d{2}$|^\d+,\d{2}$/.test(t)) return null;
  return Number(t.replace(/\./g, "").replace(",", ""));
}

export function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const vazia = (problema: string): Leitura => ({
  linhas: [],
  problemas: [{ gravidade: "erro", mensagem: problema }],
  cabecalho: {},
  parametros: {},
});

// Matrícula, nome, CPF, banco, agência, conta, proventos, descontos, "R$" líquido
const LINHA_CREDITO =
  /^(\d{7}-[\dX])-(\d{2})\s+(.+?)\s+(\d{3}\.\d{3}\.\d{3}-\d{2})\s+(\d{3})\s+(\d{1,5})-([\dX])\s+(\d{1,12})-([\dX])\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})\s+R\$\s*([\d.]+,\d{2})$/i;

/** PDF "Relação de Crédito Bancário" (já em linhas de texto, ver pdfTexto.ts). */
export function interpretarCreditoBancario(linhasPdf: LinhaPdf[]): Leitura {
  const textos = linhasPdf.map((l) => l.trechos.map((t) => t.texto).join(" ").replace(/\s+/g, " ").trim());
  const tudo = semAcento(textos.join("\n"));
  if (!/Relacao de Credito Bancario/i.test(tudo)) {
    return vazia(
      "PDF não reconhecido: use a \"Relação de Crédito Bancário — Servidores Ativos\" (pasta RelatoriosBancarios do zip da Seplan).",
    );
  }
  if (/Pensao Alimenticia/i.test(tudo) && !/Servidores Ativos/i.test(tudo)) {
    return vazia("Este é o relatório de pensão alimentícia. Para o cadastro de servidores use o de Servidores Ativos (final _Fun).");
  }

  const comp = tudo.match(/Competencia:\s*([a-z]+)\s*\/\s*(\d{4})/i);
  const mes = comp ? MESES.indexOf(comp[1].toLowerCase()) + 1 : 0;
  const ano = comp ? Number(comp[2]) : 0;
  const problemas: ProblemaLeitura[] = [];
  if (!mes || !ano) problemas.push({ gravidade: "erro", mensagem: "Competência não encontrada no cabeçalho do PDF." });

  const linhas: LinhaServidorSigrh[] = [];
  const vistos = new Map<string, number>();
  for (const texto of textos) {
    const m = texto.match(LINHA_CREDITO);
    if (!m) continue;
    const [, matricula, vinculo, nome, cpfTexto, banco, agNum, agDv, ccNum, ccDv, prov, desc, liq] = m;
    const cpf = apenasDigitos(cpfTexto);
    const linha: LinhaServidorSigrh = {
      cpf,
      nome: nome.trim(),
      matricula,
      vinculo,
      bancoCodigo: banco,
      bancoAgencia: formatarAgencia(agNum, agDv),
      bancoConta: formatarConta(ccNum, ccDv),
      proventos: centavosBR(prov),
      descontos: centavosBR(desc),
      liquido: centavosBR(liq) ?? 0,
      endereco: null,
    };
    const indice = linhas.length;
    if (!validarCPF(cpf)) problemas.push({ gravidade: "erro", mensagem: `${linha.nome}: CPF inválido.`, linha: indice });
    if (linha.proventos !== null && linha.descontos !== null && linha.proventos - linha.descontos !== linha.liquido) {
      problemas.push({ gravidade: "aviso", mensagem: `${linha.nome}: proventos − descontos não dá o líquido impresso.`, linha: indice });
    }
    if (vistos.has(cpf)) {
      problemas.push({ gravidade: "erro", mensagem: `${linha.nome}: aparece duas vezes no arquivo (dois vínculos).`, linha: indice });
    }
    vistos.set(cpf, indice);
    linhas.push(linha);
  }

  if (linhas.length === 0) {
    return vazia("Nenhum servidor encontrado no PDF.");
  }

  // Conferência com os totais impressos no fim do relatório
  const pessoas = tudo.match(/Total de pessoas geral:\s*(\d+)/i);
  const liquido = tudo.match(/Total Liquido geral:\s*R\$\s*([\d.]+,\d{2})/i);
  const soma = linhas.reduce((s, l) => s + l.liquido, 0);
  if (!pessoas || !liquido) {
    problemas.push({ gravidade: "aviso", mensagem: "Totais do fim do relatório não encontrados: a soma não foi conferida." });
  } else {
    if (Number(pessoas[1]) !== linhas.length) {
      problemas.push({
        gravidade: "erro",
        mensagem: `O relatório diz ${pessoas[1]} pessoas e foram lidas ${linhas.length}: confira se o PDF está inteiro.`,
      });
    }
    if (centavosBR(liquido[1]) !== soma) {
      problemas.push({
        gravidade: "erro",
        mensagem: `A soma dos líquidos (${formatarReais(soma)}) não bate com o total do relatório (R$ ${liquido[1]}).`,
      });
    }
  }

  return {
    linhas,
    problemas,
    cabecalho: {
      Arquivo: "Relação de Crédito Bancário — Servidores Ativos (SIGRH)",
      Competência: mes && ano ? `${String(mes).padStart(2, "0")}/${ano}` : "—",
      Servidores: String(linhas.length),
      "Total líquido": formatarReais(soma),
    },
    parametros: { origem: "credito" satisfies OrigemServidoresSigrh, ano, mes },
  };
}

const textoOuNulo = (s: string) => {
  const t = s.replace(/\s+/g, " ").trim();
  return t ? t : null;
};

/** Remessa CNAB 240 do banco (…_ArqUnico_Fun.txt): CPF, conta e endereço de cada crédito. */
export function interpretarArquivoBanco(texto: string, nomeArquivo: string): Leitura {
  if (/_Pen(\.txt)?$/i.test(nomeArquivo.trim())) {
    return vazia("Este é o arquivo de pensão alimentícia (_Pen). Para o endereço dos servidores use o de final _Fun.");
  }
  const registros = linhasDoArquivo(texto);
  if (registros.length < 3 || registros.some((l) => l.length !== 240) || campo(registros[0], 8, 8) !== "0") {
    return vazia("TXT não reconhecido: use o arquivo do banco em CNAB 240 (pasta ArqBancarios do zip da Seplan, final _Fun).");
  }

  const problemas: ProblemaLeitura[] = [];
  const linhas: LinhaServidorSigrh[] = [];
  let atual: LinhaServidorSigrh | null = null;
  let somaTrailer = 0;
  let dataCredito = "";
  for (const [i, l] of registros.entries()) {
    const tipo = campo(l, 8, 8);
    if (tipo === "5") somaTrailer += Number(campo(l, 24, 41)) || 0;
    if (tipo !== "3") continue;
    const segmento = campo(l, 14, 14);
    if (segmento === "A") {
      dataCredito ||= campo(l, 94, 101);
      atual = {
        cpf: "",
        nome: campo(l, 44, 73).trim(),
        matricula: null,
        vinculo: null,
        bancoCodigo: campo(l, 21, 23),
        bancoAgencia: formatarAgencia(campo(l, 24, 28), campo(l, 29, 29)),
        bancoConta: formatarConta(campo(l, 30, 41), campo(l, 42, 42)),
        proventos: null,
        descontos: null,
        liquido: Number(campo(l, 120, 134)) || 0,
        endereco: null,
      };
      continue;
    }
    if (segmento === "B") {
      if (!atual) {
        problemas.push({ gravidade: "aviso", mensagem: `Registro ${i + 1}: segmento B sem crédito antes; ignorado.` });
        continue;
      }
      atual.cpf = apenasDigitos(campo(l, 19, 32)).slice(-11);
      const numero = campo(l, 63, 67).trim().replace(/^0+/, "");
      const cep = apenasDigitos(campo(l, 118, 125));
      atual.endereco = {
        logradouro: textoOuNulo(campo(l, 33, 62)),
        numero: numero || null,
        complemento: textoOuNulo(campo(l, 68, 82)),
        bairro: textoOuNulo(campo(l, 83, 97)),
        cidade: textoOuNulo(campo(l, 98, 117)),
        uf: textoOuNulo(campo(l, 126, 127)),
        cep: cep && !/^0+$/.test(cep) ? `${cep.slice(0, 5)}-${cep.slice(5)}` : null,
      };
      const indice = linhas.length;
      if (campo(l, 18, 18) !== "1" || !validarCPF(atual.cpf)) {
        problemas.push({ gravidade: "erro", mensagem: `${atual.nome}: CPF ausente ou inválido no segmento B.`, linha: indice });
      }
      if (!atual.endereco.logradouro && !atual.endereco.cidade) {
        problemas.push({ gravidade: "aviso", mensagem: `${atual.nome}: sem endereço no arquivo; o cadastro não muda.`, linha: indice });
      }
      linhas.push(atual);
      atual = null;
    }
  }

  if (linhas.length === 0) return vazia("Nenhum crédito com CPF encontrado no arquivo.");
  const soma = linhas.reduce((s, l) => s + l.liquido, 0);
  if (somaTrailer !== soma) {
    problemas.push({
      gravidade: "erro",
      mensagem: `A soma dos créditos (${formatarReais(soma)}) não bate com o total do arquivo (${formatarReais(somaTrailer)}).`,
    });
  }
  const mes = Number(dataCredito.slice(2, 4));
  const ano = Number(dataCredito.slice(4, 8));

  return {
    linhas,
    problemas,
    cabecalho: {
      Arquivo: "Arquivo do banco (CNAB 240) — endereço dos servidores",
      "Data do crédito": /^\d{8}$/.test(dataCredito) ? `${dataCredito.slice(0, 2)}/${dataCredito.slice(2, 4)}/${ano}` : "—",
      Créditos: String(linhas.length),
      "Total líquido": formatarReais(soma),
    },
    parametros: { origem: "banco" satisfies OrigemServidoresSigrh, ano: ano || null, mes: mes || null },
  };
}

/** Formato que a RPC espera (o CPF só serve para achar o servidor; não volta na resposta). */
export function paraContratoServidorSigrh(linha: LinhaServidorSigrh, indice: number) {
  return {
    indice,
    cpf: linha.cpf,
    nome: linha.nome,
    matricula: linha.matricula,
    banco_codigo: linha.bancoCodigo,
    banco_agencia: linha.bancoAgencia,
    banco_conta: linha.bancoConta,
    proventos: linha.proventos === null ? null : (linha.proventos / 100).toFixed(2),
    endereco: linha.endereco,
  };
}
