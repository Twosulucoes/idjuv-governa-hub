#!/usr/bin/env node
/**
 * Guard de número escrito à mão nos documentos vivos.
 *
 * Por que existe: "~241 páginas", "257 tabelas", "17 módulos" escritos numa doc ficam errados na
 * primeira PR que cria uma página ou apaga uma tabela, e ninguém percebe. Os números do sistema
 * moram em docs/ESTADO_DO_SISTEMA.md, gerado por scripts/estado-do-sistema.mjs (`npm run estado`);
 * a doc viva aponta para lá em vez de repetir a contagem.
 *
 * O que acusa: número de 2+ dígitos (com ou sem `~`) seguido de rotas, páginas, componentes,
 * hooks, migrações, tabelas, views, funções, Edge Functions, módulos ou policies.
 *
 * Exceção (fato datado de uma entrega, ex. "79 tabelas do RH na migração X"):
 *   - linha com o comentário `<!-- numero-datado -->`, ou
 *   - bloco entre `<!-- numero-datado:inicio -->` e `<!-- numero-datado:fim -->`.
 *
 * Escopo: LIVING_DOCS de scripts/check-doc-links.mjs + CLAUDE.md, AGENTS.md, README.md e
 * CONTRIBUTING.md. docs/ESTADO_DO_SISTEMA.md fica de fora (é onde os números devem estar).
 *
 * Uso: node scripts/check-numeros-docs.mjs   (npm run check:numeros)
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { LIVING_DOCS } from "./check-doc-links.mjs";

const RAIZ = resolve(import.meta.dirname, "..");

export const DOCS = [...new Set([...LIVING_DOCS, "CLAUDE.md", "AGENTS.md", "README.md", "CONTRIBUTING.md"])].filter(
  (d) => d !== "docs/ESTADO_DO_SISTEMA.md",
);

const PADRAO =
  /~?\b\d{2,}\s+(rotas|páginas|paginas|componentes|hooks|migrações|migracoes|tabelas|views|funções|funcoes|Edge Functions|módulos|modulos|policies)(?![\p{L}\p{N}_])/giu;

/** Devolve as ocorrências de um texto markdown: [{ linha, trecho }]. */
export function procurarNumeros(texto) {
  const achados = [];
  let datado = false;
  texto.split("\n").forEach((l, i) => {
    if (/<!--\s*numero-datado:inicio\s*-->/.test(l)) datado = true;
    const fecha = /<!--\s*numero-datado:fim\s*-->/.test(l);
    if (!datado && !/<!--\s*numero-datado\s*-->/.test(l)) {
      for (const m of l.matchAll(PADRAO)) achados.push({ linha: i + 1, trecho: m[0] });
    }
    if (fecha) datado = false;
  });
  return achados;
}

function main() {
  let total = 0;
  for (const doc of DOCS) {
    const abs = resolve(RAIZ, doc);
    if (!existsSync(abs)) continue; // existência das docs vivas é cobrada por check-doc-links.mjs
    for (const { linha, trecho } of procurarNumeros(readFileSync(abs, "utf8"))) {
      console.error(`  ${doc}:${linha}  →  "${trecho}"`);
      total++;
    }
  }
  if (total === 0) {
    console.log(`✅ Nenhum número escrito à mão em ${DOCS.length} documentos vivos.`);
    return;
  }
  console.error(
    `\n::error::${total} contagem(ns) escrita(s) à mão em documento vivo.` +
      "\nAponte para docs/ESTADO_DO_SISTEMA.md (gerado por `npm run estado`) em vez de repetir o número," +
      "\nou, se for fato datado de uma entrega, marque a linha com <!-- numero-datado -->" +
      " (ou o bloco com <!-- numero-datado:inicio --> … <!-- numero-datado:fim -->).",
  );
  process.exit(1);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
