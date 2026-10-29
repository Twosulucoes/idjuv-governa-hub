#!/usr/bin/env node
/**
 * Rotina diária dos convênios federais: baixa os CSV do Transferegov (antigo Siconv), guarda só o que é do CNPJ da
 * instituição e manda para a Edge Function `transferegov`, que troca o espelho no banco (fin_tg_carregar).
 * Roda no GitHub Actions (.github/workflows/transferegov.yml); nada passa pelo navegador.
 * Spec: docs/superpowers/specs/2026-10-29-convenios-federais-transferegov-design.md
 *
 * Uso:
 *   node scripts/transferegov/sincronizar.mjs                       (envia; precisa das variáveis abaixo)
 *   node scripts/transferegov/sincronizar.mjs --cnpj 00000000000000 --saida dados.json   (só lê e grava o arquivo)
 *
 * Variáveis para enviar: SUPABASE_URL, SUPABASE_ANON_KEY (a chave pública do front: o roteador das funções exige um
 * JWT) e TRANSFEREGOV_TOKEN (segredo combinado com a função). Sem --cnpj, o CNPJ vem da função (Configuração do
 * cliente), para a rotina não ter nome de cliente.
 *
 * O log do Actions é público: só contagens vão para a saída, nunca o conteúdo.
 */

import { spawn } from "node:child_process";
import { createWriteStream, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { pathToFileURL } from "node:url";
import { lerCsvComCabecalho } from "./csv.mjs";
import {
  dataHora,
  digitos,
  mapearConvenio,
  mapearDesembolso,
  mapearEmenda,
  mapearEmpenho,
  mapearProposta,
  semRepetir,
} from "./mapear.mjs";

export const BASE_DOWNLOADS = "https://api-publica.transferegov.gestao.gov.br/downloads/dadosgov/";
const TEMPO_DOWNLOAD_MS = 10 * 60_000;
const TEMPO_FUNCAO_MS = 60_000;

function argumento(nome) {
  const i = process.argv.indexOf(nome);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function baixar(arquivo, pasta) {
  const destino = join(pasta, `${arquivo}.zip`);
  const resp = await fetch(`${BASE_DOWNLOADS}${arquivo}.zip`, { signal: AbortSignal.timeout(TEMPO_DOWNLOAD_MS) });
  if (!resp.ok || !resp.body) throw new Error(`download de ${arquivo}: HTTP ${resp.status}`);
  await pipeline(Readable.fromWeb(resp.body), createWriteStream(destino));
  return destino;
}

/** Lê o CSV de dentro do zip em fluxo (unzip -p) e chama aoRegistro(objeto) para cada linha. */
async function lerZip(zip, aoRegistro) {
  const unzip = spawn("unzip", ["-p", zip], { stdio: ["ignore", "pipe", "pipe"] });
  let erro = "";
  unzip.stderr.on("data", (d) => { erro += d; });
  const terminou = new Promise((resolve, reject) => {
    unzip.on("error", reject);
    unzip.on("close", (codigo) => (codigo === 0 ? resolve() : reject(new Error(`unzip ${zip}: código ${codigo} ${erro.slice(0, 200)}`))));
  });
  const cabecalho = await lerCsvComCabecalho(unzip.stdout, aoRegistro);
  await terminou;
  return cabecalho;
}

/** Confere se o arquivo ainda tem as colunas que a rotina usa (o Transferegov pode mudar o leiaute). */
function exigirColunas(arquivo, cabecalho, colunas) {
  const faltam = colunas.filter((c) => !cabecalho.includes(c));
  if (faltam.length) throw new Error(`${arquivo}: o leiaute mudou, faltam as colunas ${faltam.join(", ")}`);
}

async function chamarFuncao(corpo) {
  const url = `${process.env.SUPABASE_URL.replace(/\/$/, "")}/functions/v1/transferegov`;
  const resp = await fetch(url, {
    method: "POST",
    signal: AbortSignal.timeout(TEMPO_FUNCAO_MS),
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      apikey: process.env.SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
      "x-transferegov-token": process.env.TRANSFEREGOV_TOKEN,
    },
    body: JSON.stringify(corpo),
  });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(`função transferegov (${corpo.acao}): HTTP ${resp.status} ${json.error ?? ""}`.trim());
  return json;
}

/** Lê os arquivos e monta o que vai para fin_tg_carregar. */
export async function montarDados(cnpj, pasta, ler = async (arquivo, aoRegistro) => lerZip(await baixar(arquivo, pasta), aoRegistro)) {
  let dataCarga = null;
  exigirColunas("data_carga_siconv", await ler("data_carga_siconv", (r) => { dataCarga = dataHora(r.data_carga); }), ["data_carga"]);

  const propostas = [];
  exigirColunas("siconv_proposta", await ler("siconv_proposta", (r) => {
    if (digitos(r.IDENTIF_PROPONENTE) === cnpj) {
      const p = mapearProposta(r);
      if (p) propostas.push(p);
    }
  }), ["ID_PROPOSTA", "IDENTIF_PROPONENTE", "NR_PROPOSTA", "SIT_PROPOSTA", "VL_GLOBAL_PROP"]);
  const ids = new Set(propostas.map((p) => p.id_proposta));

  const emendas = [];
  exigirColunas("siconv_emenda", await ler("siconv_emenda", (r) => {
    const e = ids.has(Number(r.ID_PROPOSTA)) ? mapearEmenda(r) : null;
    if (e) emendas.push(e);
  }), ["ID_PROPOSTA", "NR_EMENDA", "NOME_PARLAMENTAR", "VALOR_REPASSE_EMENDA"]);

  const convenios = [];
  exigirColunas("siconv_convenio", await ler("siconv_convenio", (r) => {
    const c = ids.has(Number(r.ID_PROPOSTA)) ? mapearConvenio(r) : null;
    if (c) convenios.push(c);
  }), ["NR_CONVENIO", "ID_PROPOSTA", "SIT_CONVENIO", "VL_EMPENHADO_CONV", "VL_DESEMBOLSADO_CONV"]);
  const numeros = new Set(convenios.map((c) => c.numero));

  const movimentos = [];
  exigirColunas("siconv_empenho", await ler("siconv_empenho", (r) => {
    const m = numeros.has(r.NR_CONVENIO?.trim()) ? mapearEmpenho(r) : null;
    if (m) movimentos.push(m);
  }), ["ID_EMPENHO", "NR_CONVENIO", "NR_EMPENHO", "VALOR_EMPENHO"]);
  exigirColunas("siconv_desembolso", await ler("siconv_desembolso", (r) => {
    const m = numeros.has(r.NR_CONVENIO?.trim()) ? mapearDesembolso(r) : null;
    if (m) movimentos.push(m);
  }), ["ID_DESEMBOLSO", "NR_CONVENIO", "VL_DESEMBOLSADO"]);

  return {
    data_carga: dataCarga,
    dados: {
      propostas: semRepetir(propostas, (p) => p.id_proposta),
      emendas: semRepetir(emendas, (e) => `${e.id_proposta}|${e.numero_emenda}`),
      convenios: semRepetir(convenios, (c) => c.numero),
      movimentos: semRepetir(movimentos, (m) => `${m.tipo}|${m.id_origem}`),
    },
  };
}

async function main() {
  const saida = argumento("--saida");
  const enviar = !saida;
  if (enviar) {
    const faltam = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "TRANSFEREGOV_TOKEN"].filter((v) => !process.env[v]);
    if (faltam.length) throw new Error(`faltam as variáveis ${faltam.join(", ")}`);
  }
  const cnpj = digitos(argumento("--cnpj") ?? (enviar ? (await chamarFuncao({ acao: "cnpj" })).cnpj : ""));
  if (!/^\d{14}$/.test(cnpj)) throw new Error("CNPJ da instituição ausente ou inválido (Configuração do cliente)");

  const pasta = mkdtempSync(join(tmpdir(), "transferegov-"));
  try {
    const { data_carga, dados } = await montarDados(cnpj, pasta);
    const contagem = Object.fromEntries(Object.entries(dados).map(([k, v]) => [k, v.length]));
    console.log(`Transferegov: carga de ${data_carga ?? "data desconhecida"}; lidos ${JSON.stringify(contagem)}`);
    if (saida) {
      writeFileSync(saida, JSON.stringify({ cnpj, data_carga, dados }, null, 2));
      console.log(`gravado em ${saida} (nada enviado)`);
      return;
    }
    const resposta = await chamarFuncao({ acao: "carregar", cnpj, data_carga, dados });
    console.log(`gravado no banco: ${JSON.stringify(resposta.gravados ?? resposta)}`);
  } finally {
    rmSync(pasta, { recursive: true, force: true });
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((e) => {
    console.error(`::error::${e.message}`);
    process.exit(1);
  });
}
