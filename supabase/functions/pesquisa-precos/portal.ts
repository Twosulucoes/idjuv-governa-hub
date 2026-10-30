// Fontes públicas da pesquisa de preços: o módulo de pesquisa de preços dos dados abertos do Compras.gov.br
// (preços praticados por item do CATMAT ou serviço do CATSER) e o PNCP (itens e resultados de uma compra).
// Sem import do Deno: os testes rodam no vitest (portal.test.ts). Hosts fixos: a função não chama outro endereço.
// Campos conferidos em clientes públicos dessas APIs em uso em out/2026 (o manual oficial não abre deste ambiente);
// todo campo é opcional e o que não vier sai null, sem quebrar a linha.

export const HOST_COMPRAS = "dadosabertos.compras.gov.br";
export const HOST_PNCP = "pncp.gov.br";
export const TAMANHO_PAGINA_COMPRAS = 500;

export type TipoCatalogo = "material" | "servico";
export type CampoCatalogo = "codigoItemCatalogo" | "codigoPdm";

/** Preço encontrado numa fonte pública, já no formato da amostra da pesquisa. */
export interface PrecoEncontrado {
  /** Chave da fonte: não deixa a mesma compra/item/fornecedor entrar duas vezes no mesmo item da pesquisa. */
  idExterno: string;
  parametro: 1 | 2;
  origem: "compras_gov" | "pncp";
  descricao: string | null;
  orgao: string | null;
  uasg: string | null;
  uf: string | null;
  municipio: string | null;
  /** Compra ou processo, como sai no relatório (ex.: "Pregão nº 90012/2026, UASG 925001"). */
  numeroCompra: string | null;
  idCompra: string | null;
  modalidade: string | null;
  /** AAAA-MM-DD: data do resultado (homologação) ou, sem ela, da compra. */
  dataReferencia: string | null;
  fornecedorNome: string | null;
  fornecedorNi: string | null;
  marca: string | null;
  unidade: string | null;
  quantidade: number | null;
  precoUnitario: number;
  link: string | null;
}

type Bruto = Record<string, unknown>;

const inteiro = (v: unknown): number | null => (typeof v === "number" && Number.isInteger(v) && v > 0 ? v : null);

function texto(v: unknown, max = 500): string | null {
  if (typeof v !== "string" && typeof v !== "number") return null;
  const t = String(v).replace(/\s+/g, " ").trim();
  return t === "" ? null : t.slice(0, max);
}

function numero(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v.replace(",", ".")) : NaN;
  return Number.isFinite(n) ? n : null;
}

/** Data AAAA-MM-DD do começo de um texto ISO; null se não for data. */
function dia(v: unknown): string | null {
  const t = typeof v === "string" ? v.slice(0, 10) : "";
  return /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
}

const soDigitos = (v: unknown) => (typeof v === "string" || typeof v === "number" ? String(v).replace(/\D/g, "") : "");

function uf(v: unknown): string | null {
  const t = texto(v, 2)?.toUpperCase() ?? null;
  return t && /^[A-Z]{2}$/.test(t) ? t : null;
}

const MODALIDADES_SIASG: Record<string, string> = {
  "01": "Convite", "02": "Tomada de Preços", "03": "Concorrência", "04": "Concorrência Internacional",
  "05": "Pregão", "06": "Dispensa", "07": "Inexigibilidade", "20": "Concurso",
};

/** "Pregão nº 90012/2026, UASG 925001" a partir do idCompra (UASG 6 + modalidade 2 + número 5 + ano 4). */
export function compraDoIdCompra(idCompra: string): { texto: string; modalidade: string } | null {
  const d = soDigitos(idCompra);
  if (d.length !== 17) return null;
  const modalidade = MODALIDADES_SIASG[d.slice(6, 8)] ?? `Modalidade ${d.slice(6, 8)}`;
  return { texto: `${modalidade} nº ${d.slice(8, 13)}/${d.slice(13)}, UASG ${d.slice(0, 6)}`, modalidade };
}

export interface FiltroCompras {
  tipo: TipoCatalogo;
  /** Material: item do CATMAT (codigoItemCatalogo) ou o tipo de material inteiro (codigoPdm). Serviço: só o código. */
  campo: CampoCatalogo;
  codigo: number;
  pagina: number;
  /** AAAA-MM-DD */
  dataInicio: string;
  dataFim: string;
}

/** URL da página de preços praticados (500 por página). */
export function urlPrecosCompras(f: FiltroCompras): string {
  const caminho = f.tipo === "material" ? "modulo-pesquisa-preco/1_consultarMaterial" : "modulo-pesquisa-preco/3_consultarServico";
  const busca = new URLSearchParams();
  busca.set("pagina", String(inteiro(f.pagina) ?? 1));
  busca.set("tamanhoPagina", String(TAMANHO_PAGINA_COMPRAS));
  if (f.tipo === "material") {
    // a API passou a pedir tipo + codigo no material (out/2026); o serviço segue com codigoItemCatalogo
    busca.set("tipo", f.campo);
    busca.set("codigo", String(f.codigo));
  } else {
    busca.set("codigoItemCatalogo", String(f.codigo));
  }
  busca.set("dataCompraInicio", f.dataInicio);
  busca.set("dataCompraFim", f.dataFim);
  return `https://${HOST_COMPRAS}/${caminho}?${busca.toString()}`;
}

/** Uma linha do módulo de pesquisa de preços. Null sem preço positivo ou sem identificação da compra. */
export function mapearPrecoCompras(j: Bruto, tipo: TipoCatalogo): PrecoEncontrado | null {
  const precoUnitario = numero(j.precoUnitario);
  const idCompra = texto(j.idCompra, 40);
  if (!precoUnitario || precoUnitario <= 0 || !idCompra) return null;
  const idItem = texto(j.idItemCompra, 40) ?? texto(j.numeroItemCompra, 20) ?? "0";
  const compra = compraDoIdCompra(idCompra);
  const unidade = tipo === "material"
    ? texto(j.siglaUnidadeFornecimento, 30) ?? texto(j.nomeUnidadeFornecimento, 60)
    : texto(j.siglaUnidadeMedida, 30) ?? texto(j.nomeUnidadeMedida, 60);
  const capacidade = tipo === "material" ? numero(j.capacidadeUnidadeFornecimento) : null;
  return {
    idExterno: `cg:${idCompra}:${idItem}:${soDigitos(j.niFornecedor)}`,
    parametro: 1,
    origem: "compras_gov",
    descricao: texto(j.descricaoItem, 1000),
    orgao: texto(j.nomeOrgao, 300) ?? texto(j.nomeUasg, 300),
    uasg: texto(j.codigoUasg, 20),
    uf: uf(j.estado),
    municipio: texto(j.municipio, 120),
    numeroCompra: compra?.texto ?? idCompra,
    idCompra,
    modalidade: compra?.modalidade ?? texto(j.modalidade, 60),
    dataReferencia: dia(j.dataResultado) ?? dia(j.dataCompra),
    fornecedorNome: texto(j.nomeFornecedor, 300),
    fornecedorNi: soDigitos(j.niFornecedor) || null,
    marca: texto(j.marca, 200),
    unidade: unidade ? `${unidade}${capacidade && capacidade !== 1 ? ` (${capacidade})` : ""}` : null,
    quantidade: numero(j.quantidade),
    precoUnitario,
    link: `https://cnetmobile.estaleiro.serpro.gov.br/comprasnet-web/public/landing?destino=acompanhamento-compra&compra=${encodeURIComponent(idCompra)}`,
  };
}

export interface ReferenciaPncp {
  cnpj: string;
  ano: number;
  sequencial: number;
}

export function referenciaValida(r: { cnpj?: unknown; ano?: unknown; sequencial?: unknown }): ReferenciaPncp | null {
  const cnpj = typeof r.cnpj === "string" && /^\d{14}$/.test(r.cnpj) ? r.cnpj : null;
  const ano = inteiro(r.ano);
  const sequencial = inteiro(r.sequencial);
  if (!cnpj || !ano || ano < 2021 || ano > 2100 || !sequencial || sequencial > 999999) return null;
  return { cnpj, ano, sequencial };
}

const basePncp = (r: ReferenciaPncp) => `https://${HOST_PNCP}/api/pncp/v1/orgaos/${r.cnpj}/compras/${r.ano}/${r.sequencial}`;

export const urlCompraPncp = (r: ReferenciaPncp) =>
  `https://${HOST_PNCP}/api/consulta/v1/orgaos/${r.cnpj}/compras/${r.ano}/${r.sequencial}`;
export const urlItensPncp = (r: ReferenciaPncp, pagina = 1) => `${basePncp(r)}/itens?pagina=${pagina}&tamanhoPagina=500`;
export const urlResultadosPncp = (r: ReferenciaPncp, numeroItem: number) => `${basePncp(r)}/itens/${numeroItem}/resultados`;
export const linkEditalPncp = (r: ReferenciaPncp) => `https://${HOST_PNCP}/app/editais/${r.cnpj}/${r.ano}/${r.sequencial}`;

/** Cabeçalho da compra no PNCP: o que identifica a contratação similar no relatório. */
export interface CompraPncp {
  orgao: string | null;
  unidade: string | null;
  uf: string | null;
  municipio: string | null;
  modalidade: string | null;
  numeroCompra: string | null;
  processo: string | null;
  objeto: string | null;
  numeroControle: string | null;
  dataPublicacao: string | null;
  link: string;
}

export function mapearCompraPncp(j: Bruto, r: ReferenciaPncp): CompraPncp {
  const orgao = (j.orgaoEntidade ?? {}) as Bruto;
  const unidade = (j.unidadeOrgao ?? {}) as Bruto;
  const numero = texto(j.numeroCompra, 40);
  const ano = inteiro(j.anoCompra) ?? r.ano;
  return {
    orgao: texto(orgao.razaoSocial, 300),
    unidade: texto(unidade.nomeUnidade, 300),
    uf: uf(unidade.ufSigla),
    municipio: texto(unidade.municipioNome, 120),
    modalidade: texto(j.modalidadeNome, 80),
    numeroCompra: numero ? `${numero}/${ano}` : null,
    processo: texto(j.processo, 80),
    objeto: texto(j.objetoCompra, 1000),
    numeroControle: texto(j.numeroControlePNCP, 60),
    dataPublicacao: dia(j.dataPublicacaoPncp),
    link: linkEditalPncp(r),
  };
}

export interface ItemPncp {
  numeroItem: number;
  descricao: string | null;
  unidade: string | null;
  quantidade: number | null;
  valorUnitarioEstimado: number | null;
  temResultado: boolean;
  situacao: string | null;
}

export function mapearItemPncp(j: Bruto): ItemPncp | null {
  const numeroItem = inteiro(j.numeroItem);
  if (!numeroItem) return null;
  return {
    numeroItem,
    descricao: texto(j.descricao, 1000),
    unidade: texto(j.unidadeMedida, 60),
    quantidade: numero(j.quantidade),
    valorUnitarioEstimado: numero(j.valorUnitarioEstimado),
    temResultado: j.temResultado === true,
    situacao: texto(j.situacaoCompraItemNome, 80),
  };
}

/** Resultado (preço homologado) de um item, já como amostra do inciso II. Cancelado ou sem preço = null. */
export function mapearResultadoPncp(j: Bruto, r: ReferenciaPncp, compra: CompraPncp, item: ItemPncp): PrecoEncontrado | null {
  const precoUnitario = numero(j.valorUnitarioHomologado);
  if (!precoUnitario || precoUnitario <= 0) return null;
  if (/cancel/i.test(String(j.situacaoCompraItemResultadoNome ?? ""))) return null;
  const ni = soDigitos(j.niFornecedor);
  const partes = [compra.modalidade, compra.numeroCompra ? `nº ${compra.numeroCompra}` : null].filter(Boolean).join(" ");
  return {
    idExterno: `pncp:${r.cnpj}:${r.ano}:${r.sequencial}:${item.numeroItem}:${texto(j.sequencialResultado, 10) ?? ni}`,
    parametro: 2,
    origem: "pncp",
    descricao: item.descricao,
    orgao: compra.orgao,
    uasg: compra.unidade,
    uf: compra.uf,
    municipio: compra.municipio,
    numeroCompra: [partes || null, `item ${item.numeroItem}`, compra.processo ? `processo ${compra.processo}` : null]
      .filter(Boolean).join(", "),
    idCompra: compra.numeroControle,
    modalidade: compra.modalidade,
    dataReferencia: dia(j.dataResultado) ?? dia(j.dataInclusao) ?? compra.dataPublicacao,
    fornecedorNome: texto(j.nomeRazaoSocialFornecedor, 300),
    fornecedorNi: ni || null,
    marca: texto(j.marcaFornecedor, 200),
    unidade: item.unidade,
    quantidade: numero(j.quantidadeHomologada) ?? item.quantidade,
    precoUnitario,
    link: compra.link,
  };
}

// ---------------------------------------------------------------- busca por nome no PNCP (contratações similares)

export const MAX_COMPRAS_BUSCA = 8;
export const MAX_ITENS_POR_COMPRA = 3;

/**
 * Busca pública do PNCP (a do portal): só editais encerrados (os abertos ainda não têm resultado homologado), mais
 * recentes primeiro. Sem manual oficial: parâmetros e campos de clientes públicos.
 */
export function urlBuscaPncp(termo: string, pagina = 1): string {
  const busca = new URLSearchParams();
  busca.set("q", termo);
  busca.set("tipos_documento", "edital");
  busca.set("status", "encerradas");
  busca.set("ordenacao", "-data");
  busca.set("pagina", String(inteiro(pagina) ?? 1));
  busca.set("tam_pagina", "20");
  return `https://${HOST_PNCP}/api/search/?${busca.toString()}`;
}

/** Compra de um resultado da busca: pelos campos orgao_cnpj/ano/numero_sequencial ou pelo número de controle. */
export function referenciaDaBusca(j: Bruto): ReferenciaPncp | null {
  const direta = referenciaValida({
    cnpj: soDigitos(j.orgao_cnpj) || undefined,
    ano: numero(j.ano) ?? undefined,
    sequencial: numero(j.numero_sequencial) ?? undefined,
  });
  if (direta) return direta;
  const controle = String(j.numero_controle_pncp ?? "").trim().match(/^(\d{14})-\d-(\d{1,6})\/(\d{4})$/);
  return controle ? referenciaValida({ cnpj: controle[1], ano: Number(controle[3]), sequencial: Number(controle[2]) }) : null;
}

const semAcento = (t: string | null | undefined) =>
  String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
// a mesma lista e o mesmo limite de palavrasDaBusca (src/lib/compras/pesquisaPrecos.ts)
const VAZIAS = new Set([
  "de", "da", "do", "das", "dos", "em", "na", "no", "nas", "nos", "para", "por", "com", "sem", "and", "uma", "um", "tipo",
  "aos", "que", "pela", "pelo", "conforme", "cada",
]);

/** Palavras do termo (3 letras ou mais, sem as de ligação, as 3 primeiras), como na tela. */
export const palavrasDoTermo = (termo: string) => semAcento(termo).split(" ").filter((p) => p.length >= 3 && !VAZIAS.has(p)).slice(0, 3);

/** O item da compra tem todas as palavras buscadas (começo da palavra, singular ou plural)? */
export function itemCombina(descricao: string | null, palavras: string[]): boolean {
  if (!palavras.length) return false;
  const tokens = semAcento(descricao).split(" ");
  return palavras.every((p) => {
    const r = p.length > 4 ? p.replace(/(es|s)$/, "") : p;
    return tokens.some((t) => t.startsWith(r));
  });
}

export const dentroDoPeriodo = (data: string | null, inicio: string, fim: string) => !!data && data >= inicio && data <= fim;
