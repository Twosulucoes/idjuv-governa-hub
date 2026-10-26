// Portal de dados abertos do Compras.gov.br (CATMAT/CATSER): montagem das URLs e leitura das linhas.
// Sem import do Deno: os testes rodam no vitest (portal.test.ts). Host fixo: a função não chama outro endereço.

export const HOST_PORTAL = "dadosabertos.compras.gov.br";
export const TAMANHO_PAGINA = 500;

export type AcaoPortal = "pdm" | "servico" | "itens_pdm" | "item" | "naturezas_pdm" | "naturezas_servico";

export interface LinhaPdm {
  codigo_pdm: number;
  nome_pdm: string;
  codigo_classe: number;
  nome_classe: string;
  codigo_grupo: number;
  nome_grupo: string;
  ativo: boolean;
}

export interface LinhaServico {
  codigo_servico: number;
  nome_servico: string;
  codigo_classe: number | null;
  nome_classe: string | null;
  codigo_grupo: number | null;
  nome_grupo: string | null;
  codigo_divisao: number | null;
  nome_divisao: string | null;
  codigo_secao: number;
  nome_secao: string;
  ativo: boolean;
}

/** Natureza de despesa indicada pelo catálogo para um PDM ou serviço (código federal de 8 dígitos). */
export interface LinhaNatureza {
  codigo: string;
  nome: string | null;
  ativo: boolean;
}

export interface LinhaItem {
  codigo_item: number;
  codigo_pdm: number;
  descricao: string;
  sustentavel: boolean;
  ativo: boolean;
}

/** Inteiro positivo ou null (o portal às vezes manda null; texto não vira código). */
function inteiro(v: unknown): number | null {
  return typeof v === "number" && Number.isInteger(v) && v > 0 ? v : null;
}

function textoLimpo(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.replace(/\s+/g, " ").trim();
  return t === "" ? null : t;
}

const pagina = (n: unknown) => inteiro(n) ?? 1;

export function urlPortal(
  acao: AcaoPortal,
  p: { pagina?: number; codigoPdm?: number; codigoItem?: number; codigoServico?: number },
): string {
  const caminho = {
    pdm: "modulo-material/3_consultarPdmMaterial",
    servico: "modulo-servico/6_consultarItemServico",
    itens_pdm: "modulo-material/4_consultarItemMaterial",
    item: "modulo-material/4_consultarItemMaterial",
    naturezas_pdm: "modulo-material/5_consultarMaterialNaturezaDespesa",
    naturezas_servico: "modulo-servico/8_consultarNaturezaDespesaServico",
  }[acao];
  const busca = new URLSearchParams();
  busca.set("pagina", String(pagina(p.pagina)));
  busca.set("tamanhoPagina", String(TAMANHO_PAGINA));
  if (acao === "itens_pdm") {
    busca.set("codigoPdm", String(inteiro(p.codigoPdm) ?? 0));
    busca.set("statusItem", "true");
  }
  if (acao === "item") busca.set("codigoItem", String(inteiro(p.codigoItem) ?? 0));
  if (acao === "naturezas_pdm") busca.set("codigoPdm", String(inteiro(p.codigoPdm) ?? 0));
  if (acao === "naturezas_servico") busca.set("codigoServico", String(inteiro(p.codigoServico) ?? 0));
  return `https://${HOST_PORTAL}/${caminho}?${busca.toString()}`;
}

type Bruto = Record<string, unknown>;

export function mapearPdm(j: Bruto): LinhaPdm | null {
  const codigo_pdm = inteiro(j.codigoPdm), codigo_classe = inteiro(j.codigoClasse), codigo_grupo = inteiro(j.codigoGrupo);
  const nome_pdm = textoLimpo(j.nomePdm), nome_classe = textoLimpo(j.nomeClasse), nome_grupo = textoLimpo(j.nomeGrupo);
  if (!codigo_pdm || !codigo_classe || !codigo_grupo || !nome_pdm || !nome_classe || !nome_grupo) return null;
  return { codigo_pdm, nome_pdm, codigo_classe, nome_classe, codigo_grupo, nome_grupo, ativo: j.statusPdm !== false };
}

export function mapearServico(j: Bruto): LinhaServico | null {
  const codigo_servico = inteiro(j.codigoServico), codigo_secao = inteiro(j.codigoSecao);
  const nome_servico = textoLimpo(j.nomeServico), nome_secao = textoLimpo(j.nomeSecao);
  if (!codigo_servico || !codigo_secao || !nome_servico || !nome_secao) return null;
  return {
    codigo_servico, nome_servico,
    codigo_classe: inteiro(j.codigoClasse), nome_classe: textoLimpo(j.nomeClasse),
    codigo_grupo: inteiro(j.codigoGrupo), nome_grupo: textoLimpo(j.nomeGrupo),
    codigo_divisao: inteiro(j.codigoDivisao), nome_divisao: textoLimpo(j.nomeDivisao),
    codigo_secao, nome_secao,
    ativo: j.statusServico !== false,
  };
}

export function mapearItemMaterial(j: Bruto): LinhaItem | null {
  const codigo_item = inteiro(j.codigoItem), codigo_pdm = inteiro(j.codigoPdm), descricao = textoLimpo(j.descricaoItem);
  if (!codigo_item || !codigo_pdm || !descricao) return null;
  return { codigo_item, codigo_pdm, descricao, sustentavel: j.itemSustentavel === true, ativo: j.statusItem !== false };
}

/** Natureza do portal: o status vem como booleano (serviço) ou "1"/"0" (material), às vezes null (= sem informação). */
export function mapearNatureza(j: Bruto): LinhaNatureza | null {
  const bruto = j.codigoNaturezaDespesa;
  const codigo = typeof bruto === "string" ? bruto.trim() : typeof bruto === "number" && Number.isInteger(bruto) ? String(bruto) : "";
  if (!/^\d{8}$/.test(codigo)) return null;
  const status = j.statusNaturezaDespesa;
  return { codigo, nome: textoLimpo(j.nomeNaturezaDespesa), ativo: !(status === false || status === "0" || status === 0) };
}
