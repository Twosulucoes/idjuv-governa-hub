import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { CABECALHOS_CLIENTE_SUPABASE, montarCors } from "../_shared/cors.ts";
import {
  type CampoCatalogo,
  mapearCompraPncp,
  mapearItemPncp,
  mapearPrecoCompras,
  mapearResultadoPncp,
  referenciaValida,
  type TipoCatalogo,
  urlCompraPncp,
  urlItensPncp,
  urlPrecosCompras,
  urlResultadosPncp,
} from "./portal.ts";

// Ponte da pesquisa de preços (módulo compras) com as fontes públicas. Só leitura: nada é gravado aqui; a tela grava
// as amostras escolhidas em pesquisa_precos_amostras pela RLS. O navegador não chama os portais direto (CORS e CSP).
//   precos_compras   uma página (500) de preços praticados do Compras.gov.br por item do CATMAT, tipo de material ou
//                    serviço do CATSER, no período pedido (art. 17, I, do Decreto 39.050-E/2025).
//   pncp_compra      cabeçalho e itens de uma compra do PNCP (link ou número de controle lido na tela).
//   pncp_resultados  preços homologados de um item dessa compra (contratação similar, art. 17, II).
// Exige o módulo compras e compras.pesquisa_precos.visualizar ou editar, conferidos com o token do próprio usuário.

const TEMPO_LIMITE_MS = 25_000;
const MENSAGEM_PORTAL = "O portal de compras não respondeu. Tente mais tarde.";

function respostaJson(cors: Record<string, string>, status: number, corpo: unknown) {
  return new Response(JSON.stringify(corpo), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

class ErroPortal extends Error {}
class NaoEncontrado extends Error {}

/** GET em JSON. 204/404 = null (o PNCP responde assim para compra ou item sem dados). */
async function lerJson(url: string): Promise<unknown> {
  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
  try {
    const resp = await fetch(url, { signal: controle.signal, headers: { Accept: "application/json" }, redirect: "error" });
    if (resp.status === 204 || resp.status === 404) return null;
    if (!resp.ok) throw new ErroPortal(`status ${resp.status}`);
    const corpo = await resp.text();
    return corpo.trim() === "" ? null : JSON.parse(corpo);
  } catch (e) {
    throw e instanceof ErroPortal ? e : new ErroPortal(e instanceof Error ? e.name : "falha");
  } finally {
    clearTimeout(relogio);
  }
}

const lista = (v: unknown): Record<string, unknown>[] =>
  Array.isArray(v) ? v : Array.isArray((v as { data?: unknown })?.data) ? (v as { data: Record<string, unknown>[] }).data : [];

const inteiroPositivo = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && v > 0 ? v : null);
const dataIso = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

async function compraEItens(ref: NonNullable<ReturnType<typeof referenciaValida>>) {
  const [bruto, itens] = await Promise.all([lerJson(urlCompraPncp(ref)), lerJson(urlItensPncp(ref))]);
  if (!bruto || typeof bruto !== "object") throw new NaoEncontrado();
  return {
    compra: mapearCompraPncp(bruto as Record<string, unknown>, ref),
    itens: lista(itens).map(mapearItemPncp).filter((i) => i !== null),
  };
}

serve(async (req) => {
  const cors = montarCors(req, { cabecalhos: CABECALHOS_CLIENTE_SUPABASE, metodos: "POST, OPTIONS" });
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return respostaJson(cors, 405, { error: "Método não permitido" });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return respostaJson(cors, 401, { error: "Não autorizado" });

    const supabaseUser = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: callerError } = await supabaseUser.auth.getUser();
    if (callerError || !caller) return respostaJson(cors, 401, { error: "Sessão inválida" });

    const pedido = await req.json().catch(() => null);
    const acao = pedido?.acao;
    if (!["precos_compras", "pncp_compra", "pncp_resultados"].includes(acao)) return respostaJson(cors, 400, { error: "Pedido inválido" });

    const [{ data: temModulo, error: e1 }, { data: podeVer, error: e2 }, { data: podeEditar, error: e3 }] = await Promise.all([
      supabaseUser.rpc("can_access_module", { _user_id: caller.id, _module: "compras" }),
      supabaseUser.rpc("has_permission_code", { _user_id: caller.id, _permission: "compras.pesquisa_precos.visualizar" }),
      supabaseUser.rpc("has_permission_code", { _user_id: caller.id, _permission: "compras.pesquisa_precos.editar" }),
    ]);
    if (e1 || e2 || e3) return respostaJson(cors, 500, { error: "Falha ao validar permissões" });
    if (!temModulo || !(podeVer || podeEditar)) {
      return respostaJson(cors, 403, { error: "Acesso negado. Requer a permissão da pesquisa de preços." });
    }

    if (acao === "precos_compras") {
      const tipo: TipoCatalogo | null = pedido.tipo === "material" || pedido.tipo === "servico" ? pedido.tipo : null;
      const campo: CampoCatalogo = pedido.campo === "codigoPdm" && tipo === "material" ? "codigoPdm" : "codigoItemCatalogo";
      const codigo = inteiroPositivo(pedido.codigo);
      const dataInicio = dataIso(pedido.dataInicio);
      const dataFim = dataIso(pedido.dataFim);
      const pagina = inteiroPositivo(pedido.pagina) ?? 1;
      if (!tipo || !codigo || !dataInicio || !dataFim || dataInicio > dataFim || pagina > 50) {
        return respostaJson(cors, 400, { error: "Pedido inválido" });
      }
      const corpo = (await lerJson(urlPrecosCompras({ tipo, campo, codigo, pagina, dataInicio, dataFim }))) as
        { resultado?: unknown; totalPaginas?: unknown; totalRegistros?: unknown } | null;
      const resultado = Array.isArray(corpo?.resultado) ? corpo!.resultado as Record<string, unknown>[] : [];
      const precos = resultado.map((r) => mapearPrecoCompras(r, tipo)).filter((p) => p !== null);
      console.log(JSON.stringify({ funcao: "pesquisa-precos", acao, tipo, campo, pagina, linhas: precos.length }));
      return respostaJson(cors, 200, {
        precos,
        pagina,
        totalPaginas: inteiroPositivo(corpo?.totalPaginas) ?? (resultado.length ? 1 : 0),
        totalRegistros: typeof corpo?.totalRegistros === "number" ? corpo.totalRegistros : precos.length,
      });
    }

    const ref = referenciaValida(pedido);
    if (!ref) return respostaJson(cors, 400, { error: "Referência do PNCP inválida" });

    if (acao === "pncp_compra") {
      const { compra, itens } = await compraEItens(ref);
      console.log(JSON.stringify({ funcao: "pesquisa-precos", acao, itens: itens.length }));
      return respostaJson(cors, 200, { compra, itens });
    }

    // pncp_resultados
    const numeroItem = inteiroPositivo(pedido.numeroItem);
    if (!numeroItem) return respostaJson(cors, 400, { error: "Pedido inválido" });
    const [{ compra, itens }, brutos] = await Promise.all([compraEItens(ref), lerJson(urlResultadosPncp(ref, numeroItem))]);
    const item = itens.find((i) => i.numeroItem === numeroItem);
    if (!item) return respostaJson(cors, 404, { error: "Item não encontrado nessa compra do PNCP." });
    const precos = lista(brutos).map((r) => mapearResultadoPncp(r, ref, compra, item)).filter((p) => p !== null);
    console.log(JSON.stringify({ funcao: "pesquisa-precos", acao, linhas: precos.length }));
    return respostaJson(cors, 200, { precos });
  } catch (e) {
    if (e instanceof NaoEncontrado) return respostaJson(cors, 404, { error: "Compra não encontrada no PNCP." });
    if (e instanceof ErroPortal) {
      console.error(JSON.stringify({ funcao: "pesquisa-precos", erro: "portal", detalhe: e.message }));
      return respostaJson(cors, 502, { error: MENSAGEM_PORTAL });
    }
    console.error(JSON.stringify({ funcao: "pesquisa-precos", erro: "interno" }));
    return respostaJson(cors, 500, { error: "Erro interno" });
  }
});
