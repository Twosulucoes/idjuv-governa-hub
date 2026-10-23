/**
 * LEITURA DE "EXCEL" EM HTML (para importadores)
 *
 * Vários sistemas do governo (o FIPLAN, por exemplo) exportam para "Excel" um arquivo .xls que é, na verdade,
 * uma página HTML com uma tabela. A biblioteca de planilhas lê esse arquivo, mas converte por conta própria
 * "03/06/2026" em 6 de março e "-20.329,08" em -20,32908. Aqui o texto de cada célula sai como está, com a
 * coluna real (o `colspan` conta), para o importador interpretar.
 *
 * Funções puras, sem DOM, para poder ser conferidas com vitest.
 */

const ENTIDADES: Record<string, string> = {
  nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", ordm: "º", ordf: "ª", deg: "°",
  ...acentuadas(),
};

/** "aacute" → "á", "Ccedil" → "Ç"... (as letras acentuadas do português, que o Excel às vezes escreve assim) */
function acentuadas(): Record<string, string> {
  const marcas: [string, string, string][] = [
    ["acute", "\u0301", "aeiouAEIOU"],
    ["grave", "\u0300", "aeiouAEIOU"],
    ["circ", "\u0302", "aeiouAEIOU"],
    ["tilde", "\u0303", "aonAON"],
    ["uml", "\u0308", "aeiouAEIOU"],
    ["cedil", "\u0327", "cC"],
  ];
  return Object.fromEntries(
    marcas.flatMap(([nome, marca, letras]) => [...letras].map((l) => [`${l}${nome}`, `${l}${marca}`.normalize("NFC")])),
  );
}

function decodificarEntidades(texto: string): string {
  return texto.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (inteira, nome: string) => {
    if (nome[0] === "#") {
      const codigo = nome[1].toLowerCase() === "x" ? parseInt(nome.slice(2), 16) : parseInt(nome.slice(1), 10);
      return Number.isFinite(codigo) ? String.fromCodePoint(codigo) : inteira;
    }
    return ENTIDADES[nome] ?? ENTIDADES[nome.toLowerCase()] ?? inteira;
  });
}

/** O arquivo parece uma tabela HTML (o "Excel" exportado por sistemas web)? */
export function pareceTabelaHtml(dados: ArrayBuffer): boolean {
  const inicio = new TextDecoder("latin1").decode(dados.slice(0, 2048)).toLowerCase();
  return inicio.includes("<html") || inicio.includes("<table");
}

/** Texto do arquivo HTML no charset que ele declara (padrão windows-1252, o usado pelo Excel). */
export function decodificarHtml(dados: ArrayBuffer): string {
  const inicio = new TextDecoder("latin1").decode(dados.slice(0, 2048));
  const charset = inicio.match(/charset\s*=\s*["']?([\w-]+)/i)?.[1] ?? "windows-1252";
  try {
    return new TextDecoder(charset).decode(dados);
  } catch {
    return new TextDecoder("windows-1252").decode(dados);
  }
}

export interface CelulaHtml {
  /** Coluna da célula, contando o `colspan` das anteriores (a primeira é 0) */
  coluna: number;
  texto: string;
}

/** Linhas da(s) tabela(s): só as células com texto, cada uma com a sua coluna. Linhas sem texto saem. */
export function linhasDaTabelaHtml(html: string): CelulaHtml[][] {
  const linhas: CelulaHtml[][] = [];
  for (const [, linha] of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const celulas: CelulaHtml[] = [];
    let coluna = 0;
    for (const [, atributos, conteudo] of linha.matchAll(/<t[dh]\b([^>]*)>([\s\S]*?)<\/t[dh]>/gi)) {
      const texto = decodificarEntidades(conteudo.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, ""))
        .replace(/\s+/g, " ")
        .trim();
      if (texto) celulas.push({ coluna, texto });
      coluna += Math.max(1, Number(atributos.match(/colspan\s*=\s*["']?(\d+)/i)?.[1] ?? 1));
    }
    if (celulas.length) linhas.push(celulas);
  }
  return linhas;
}
