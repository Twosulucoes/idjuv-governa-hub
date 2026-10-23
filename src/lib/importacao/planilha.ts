/**
 * HELPERS DE PLANILHA (XLSX, XLS, CSV) PARA IMPORTADORES
 *
 * Mesma lógica da importação do quadro de vagas (ImportarQuadroVagasDialog, que ainda tem a sua cópia),
 * aqui para servir a qualquer importador da Central de Importações:
 *
 *   - lerPrimeiraAba      lê a primeira aba e devolve as linhas com o número da linha no Excel
 *   - lerLinhasDasAbas    todas as linhas de todas as abas como arrays (relatórios com título, ex.: FIPLAN)
 *   - lerAbas             as linhas de cada aba como arrays, pelo nome da aba
 *   - normalizarCabecalho "Nº DOE" → "n_doe" (sem acento, minúsculo, separadores viram _)
 *   - campoDoCabecalho / mapearColunas  cabeçalhos da planilha → chaves do importador, por sinônimos
 *   - paraTexto / paraDataIso  conversão de célula sem deslocar o fuso
 *   - montarModeloPlanilha / baixarModeloPlanilha  gera o .xlsx de modelo para o usuário preencher
 *
 * A leitura é `raw`: o CSV chega como texto (sem o palpite americano de número e data) e, no XLSX,
 * data vem como o número de série do Excel, que `paraDataIso` converte sem passar pelo fuso local.
 */

import * as XLSX from "xlsx";

/** Linha lida da planilha: valores por cabeçalho original e o número da linha no Excel (cabeçalho = 1). */
export interface LinhaPlanilha {
  numeroLinha?: number;
  valores: Record<string, unknown>;
}

export interface PlanilhaLida {
  aba: string;
  /** Cabeçalhos da primeira linha, na ordem da planilha */
  cabecalhos: string[];
  linhas: LinhaPlanilha[];
}

/** "Data da Portaria" → "data_da_portaria"; "Nº DOE" → "n_doe". */
export function normalizarCabecalho(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/** Data em AAAA-MM-DD a partir de ano/mês/dia, conferindo que o dia existe (31/02 não passa). */
function montarDataIso(ano: number, mes: number, dia: number): string | null {
  if (ano < 1900 || ano > 2999 || mes < 1 || mes > 12 || dia < 1) return null;
  const teste = new Date(Date.UTC(ano, mes - 1, dia));
  if (teste.getUTCFullYear() !== ano || teste.getUTCMonth() !== mes - 1 || teste.getUTCDate() !== dia) return null;
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

/** Dia zero da série de datas do Excel (sistema 1900, já com o "29/02/1900" que não existiu). */
const EPOCA_EXCEL_UTC = Date.UTC(1899, 11, 30);

/**
 * Converte o valor de uma célula de data em AAAA-MM-DD sem deslocar o fuso.
 * Aceita: número de série do Excel, Date (cellDates), "dd/mm/aaaa" (ou d/m/aaaa) e "AAAA-MM-DD".
 * Devolve `null` para célula vazia e `undefined` quando há valor mas não é uma data válida.
 */
export function paraDataIso(valor: unknown): string | null | undefined {
  if (valor == null || valor === "") return null;
  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) return undefined;
    // Date da planilha representa a meia-noite local: os campos locais são a data digitada
    return montarDataIso(valor.getFullYear(), valor.getMonth() + 1, valor.getDate()) ?? undefined;
  }
  if (typeof valor === "number") {
    if (!Number.isFinite(valor) || valor < 1) return undefined;
    const d = new Date(EPOCA_EXCEL_UTC + Math.floor(valor) * 86_400_000);
    return montarDataIso(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()) ?? undefined;
  }
  const texto = String(valor).trim();
  if (!texto) return null;
  const br = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (br) return montarDataIso(Number(br[3]), Number(br[2]), Number(br[1])) ?? undefined;
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return montarDataIso(Number(iso[1]), Number(iso[2]), Number(iso[3])) ?? undefined;
  return undefined;
}

/** Texto da célula, aparado; Date vira AAAA-MM-DD (sem fuso) e vazio vira "". */
export function paraTexto(valor: unknown): string {
  if (valor instanceof Date) return paraDataIso(valor) ?? "";
  return valor == null ? "" : String(valor).trim();
}

/**
 * Chave do importador para um cabeçalho (via `normalizarCabecalho`). Só olha as chaves próprias do mapa:
 * cabeçalho "constructor" ou "__proto__" não casa com o que vem do protótipo de Object.
 */
export function campoDoCabecalho<C extends string>(cabecalho: string, sinonimos: Record<string, C>): C | undefined {
  const chave = normalizarCabecalho(cabecalho);
  return Object.prototype.hasOwnProperty.call(sinonimos, chave) ? sinonimos[chave] : undefined;
}

/**
 * Agrupa os valores da linha pelas chaves do importador. `sinonimos` usa cabeçalhos já normalizados
 * (ver `normalizarCabecalho`). Cabeçalho desconhecido fica de fora (veja `cabecalhosIgnorados`).
 */
export function mapearColunas<C extends string>(
  valores: Record<string, unknown>,
  sinonimos: Record<string, C>,
): Partial<Record<C, unknown>> {
  const saida: Partial<Record<C, unknown>> = {};
  for (const [cabecalho, valor] of Object.entries(valores)) {
    const chave = campoDoCabecalho(cabecalho, sinonimos);
    if (!chave) continue;
    // Duas colunas para o mesmo campo: vale a primeira preenchida
    if (saida[chave] === undefined || saida[chave] === "") saida[chave] = valor;
  }
  return saida;
}

/** Cabeçalhos que não correspondem a nenhuma coluna conhecida (para avisar o usuário). */
export function cabecalhosIgnorados(cabecalhos: string[], sinonimos: Record<string, string>): string[] {
  return cabecalhos.filter((c) => c.trim() && !c.startsWith("__EMPTY") && !campoDoCabecalho(c, sinonimos));
}

/** Linha sem nenhum valor preenchido (linhas em branco no fim da planilha são comuns). */
export function linhaVazia(valores: Record<string, unknown>): boolean {
  return Object.values(valores).every((v) => paraTexto(v) === "");
}

/** XLSX (zip, "PK") ou XLS antigo (OLE); o resto é tratado como texto (CSV). */
function ehPlanilhaBinaria(dados: Uint8Array): boolean {
  const zip = dados[0] === 0x50 && dados[1] === 0x4b;
  const ole = dados[0] === 0xd0 && dados[1] === 0xcf && dados[2] === 0x11 && dados[3] === 0xe0;
  return zip || ole;
}

function decodificarTexto(dados: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(dados).replace(/^\uFEFF/, "");
  } catch {
    return new TextDecoder("windows-1252").decode(dados);
  }
}

async function lerPasta(arquivo: Blob): Promise<XLSX.WorkBook> {
  const dados = new Uint8Array(await arquivo.arrayBuffer());
  return ehPlanilhaBinaria(dados)
    ? XLSX.read(dados, { type: "array", raw: true })
    : // CSV: decodifica aqui (UTF-8 ou, se falhar, Windows-1252 do Excel) para não estragar os acentos
      XLSX.read(decodificarTexto(dados), { type: "string", raw: true });
}

/**
 * Todas as linhas de todas as abas, como arrays de células e na ordem do arquivo (sem tratar a primeira como
 * cabeçalho). Para relatórios com título e cabeçalho no meio, como as consultas exportadas do FIPLAN.
 */
export async function lerLinhasDasAbas(arquivo: Blob): Promise<unknown[][]> {
  const pasta = await lerPasta(arquivo);
  if (pasta.SheetNames.length === 0) throw new Error("A planilha não tem nenhuma aba.");
  return pasta.SheetNames.flatMap((aba) =>
    XLSX.utils.sheet_to_json<unknown[]>(pasta.Sheets[aba], { header: 1, raw: true, blankrows: false, defval: "" }),
  );
}

/**
 * Cada aba como linhas de células (arrays, sem tratar a primeira como cabeçalho), pelo nome da aba. Para
 * planilhas com título antes do cabeçalho e mais de uma aba com papel próprio (ex.: processos e andamento).
 */
export async function lerAbas(arquivo: Blob): Promise<Record<string, unknown[][]>> {
  const pasta = await lerPasta(arquivo);
  if (pasta.SheetNames.length === 0) throw new Error("A planilha não tem nenhuma aba.");
  return Object.fromEntries(
    pasta.SheetNames.map((aba) => [
      aba,
      XLSX.utils.sheet_to_json<unknown[]>(pasta.Sheets[aba], { header: 1, raw: true, blankrows: false, defval: "" }),
    ]),
  );
}

/** Lê a primeira aba do arquivo (XLSX, XLS ou CSV). */
export async function lerPrimeiraAba(arquivo: Blob): Promise<PlanilhaLida> {
  const pasta = await lerPasta(arquivo);
  const aba = pasta.SheetNames[0];
  if (!aba) throw new Error("A planilha não tem nenhuma aba.");
  const folha = pasta.Sheets[aba];
  const [primeira] = XLSX.utils.sheet_to_json<unknown[]>(folha, { header: 1, raw: true, blankrows: false });
  const cabecalhos = (primeira ?? []).map((c) => paraTexto(c));
  const brutas = XLSX.utils.sheet_to_json<Record<string, unknown>>(folha, { raw: true, defval: "" });
  const linhas = brutas.map((bruta) => {
    // __rowNum__ é a linha da planilha começando em 0 (o cabeçalho é a linha 1 do Excel)
    const indice = (bruta as { __rowNum__?: number }).__rowNum__;
    return { numeroLinha: typeof indice === "number" ? indice + 1 : undefined, valores: bruta };
  });
  return { aba, cabecalhos, linhas };
}

export interface AbaModelo {
  nome: string;
  /** Linhas da aba; a primeira é o cabeçalho */
  linhas: (string | number)[][];
  /**
   * Cabeçalhos (da primeira linha) cujas colunas saem formatadas como texto ("@") até `linhasTexto`, para o
   * Excel não transformar "3/2026" em data nem tirar o zero à esquerda de uma matrícula.
   */
  colunasTexto?: string[];
  /** Quantas linhas de dados recebem o formato de texto (padrão: 500) */
  linhasTexto?: number;
}

/** Monta a pasta do modelo (sem baixar); a primeira aba é a que o importador lê. */
export function montarModeloPlanilha(abas: AbaModelo[]): XLSX.WorkBook {
  const pasta = XLSX.utils.book_new();
  for (const aba of abas) {
    const folha = XLSX.utils.aoa_to_sheet(aba.linhas);
    const cabecalho = (aba.linhas[0] ?? []).map(String);
    const colunas = (aba.colunasTexto ?? []).map((c) => cabecalho.indexOf(c)).filter((i) => i >= 0);
    if (colunas.length > 0) {
      const ultima = Math.max(aba.linhas.length - 1, aba.linhasTexto ?? 500);
      for (const c of colunas) {
        for (let r = 1; r <= ultima; r++) {
          const endereco = XLSX.utils.encode_cell({ r, c });
          const atual = folha[endereco] as XLSX.CellObject | undefined;
          folha[endereco] = { t: "s", v: atual?.v == null ? "" : String(atual.v), z: "@" };
        }
      }
      const area = XLSX.utils.decode_range(folha["!ref"] ?? "A1");
      area.e.r = Math.max(area.e.r, ultima);
      folha["!ref"] = XLSX.utils.encode_range(area);
    }
    XLSX.utils.book_append_sheet(pasta, folha, aba.nome);
  }
  return pasta;
}

/** Gera e baixa um .xlsx de modelo; a primeira aba é a que o importador lê. */
export function baixarModeloPlanilha(nomeArquivo: string, abas: AbaModelo[]): void {
  XLSX.writeFile(montarModeloPlanilha(abas), nomeArquivo);
}
