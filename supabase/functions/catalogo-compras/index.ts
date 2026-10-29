import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { CABECALHOS_CLIENTE_SUPABASE, montarCors } from "../_shared/cors.ts";
import { mapearItemMaterial, mapearNatureza, mapearPdm, mapearServico, urlPortal } from "./portal.ts";

// Ponte com o catálogo CATMAT/CATSER do portal de dados abertos do Compras.gov.br, para o PCA (módulo compras).
// O navegador não chama o portal direto: ele recusa CORS e a CSP do app só libera o Supabase.
//   sincronizar  uma página (500) de PDMs ou de serviços → cat_material_pdms / cat_servicos; na última, a data em
//                cat_sincronizacoes. Exige compras.pca.editar.
//   itens_pdm    itens ativos de um PDM, só leitura (até 500). Exige compras.pca.visualizar ou editar.
//   naturezas    naturezas de despesa que o catálogo indica para um PDM ou serviço, só leitura (até 500; o front
//                filtra e casa com as naturezas do estado). Exige compras.pca.visualizar ou editar.
//   gravar_item  grava em cat_material_itens o item escolhido (e o PDM dele, se faltar). Exige compras.pca.editar.
// A escrita usa a service role; a permissão é conferida antes com o token do próprio usuário.

const TEMPO_LIMITE_MS = 20_000;
const MENSAGEM_PORTAL = "Portal de compras indisponível. Tente mais tarde.";

function respostaJson(cors: Record<string, string>, status: number, corpo: unknown) {
  return new Response(JSON.stringify(corpo), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

class ErroPortal extends Error {}

interface PaginaPortal {
  resultado: Record<string, unknown>[];
  totalPaginas: number;
}

async function lerPortal(url: string): Promise<PaginaPortal> {
  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS);
  try {
    const resp = await fetch(url, { signal: controle.signal, headers: { Accept: "application/json" }, redirect: "error" });
    if (!resp.ok) throw new ErroPortal(`status ${resp.status}`);
    const corpo = await resp.json();
    if (!corpo || !Array.isArray(corpo.resultado)) throw new ErroPortal("formato inesperado");
    return { resultado: corpo.resultado, totalPaginas: Number.isInteger(corpo.totalPaginas) ? corpo.totalPaginas : 1 };
  } catch (e) {
    throw e instanceof ErroPortal ? e : new ErroPortal(e instanceof Error ? e.name : "falha");
  } finally {
    clearTimeout(relogio);
  }
}

const inteiroPositivo = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && v > 0 ? v : null);

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
    if (!["sincronizar", "itens_pdm", "gravar_item", "naturezas"].includes(acao)) return respostaJson(cors, 400, { error: "Pedido inválido" });

    const [{ data: temModulo, error: e1 }, { data: podeEditar, error: e2 }, { data: podeVer, error: e3 }] = await Promise.all([
      supabaseUser.rpc("can_access_module", { _user_id: caller.id, _module: "compras" }),
      supabaseUser.rpc("has_permission_code", { _user_id: caller.id, _permission: "compras.pca.editar" }),
      supabaseUser.rpc("has_permission_code", { _user_id: caller.id, _permission: "compras.pca.visualizar" }),
    ]);
    if (e1 || e2 || e3) return respostaJson(cors, 500, { error: "Falha ao validar permissões" });
    const soLeitura = acao === "itens_pdm" || acao === "naturezas";
    const autorizado = temModulo && (soLeitura ? podeEditar || podeVer : podeEditar);
    if (!autorizado) return respostaJson(cors, 403, { error: "Acesso negado. Requer a permissão do PCA." });

    if (acao === "itens_pdm") {
      const codigoPdm = inteiroPositivo(pedido.codigoPdm);
      if (!codigoPdm) return respostaJson(cors, 400, { error: "Pedido inválido" });
      const pagina = await lerPortal(urlPortal("itens_pdm", { codigoPdm }));
      const itens = pagina.resultado.map(mapearItemMaterial).filter((i) => i && i.ativo)
        .map((i) => ({ codigoItem: i!.codigo_item, descricao: i!.descricao, sustentavel: i!.sustentavel }));
      return respostaJson(cors, 200, { itens });
    }

    if (acao === "naturezas") {
      const codigo = inteiroPositivo(pedido.codigo);
      if (!codigo || (pedido.tipo !== "material" && pedido.tipo !== "servico")) return respostaJson(cors, 400, { error: "Pedido inválido" });
      const url = pedido.tipo === "material"
        ? urlPortal("naturezas_pdm", { codigoPdm: codigo })
        : urlPortal("naturezas_servico", { codigoServico: codigo });
      const naturezas = (await lerPortal(url)).resultado.map(mapearNatureza).filter(Boolean);
      return respostaJson(cors, 200, { naturezas });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const agora = new Date().toISOString();

    if (acao === "gravar_item") {
      const codigoItem = inteiroPositivo(pedido.codigoItem);
      if (!codigoItem) return respostaJson(cors, 400, { error: "Pedido inválido" });
      const bruto = (await lerPortal(urlPortal("item", { codigoItem }))).resultado.find((r) => r.codigoItem === codigoItem);
      const item = bruto ? mapearItemMaterial(bruto) : null;
      const pdm = bruto ? mapearPdm(bruto) : null;
      if (!item || !pdm) return respostaJson(cors, 404, { error: "Item não encontrado no catálogo." });
      const { error: ePdm } = await admin.from("cat_material_pdms")
        .upsert({ ...pdm, atualizado_em: agora }, { onConflict: "codigo_pdm", ignoreDuplicates: true });
      const { error: eItem } = ePdm ? { error: ePdm } : await admin.from("cat_material_itens")
        .upsert({ ...item, atualizado_em: agora }, { onConflict: "codigo_item" });
      if (eItem) return respostaJson(cors, 500, { error: "Falha ao gravar o item" });
      return respostaJson(cors, 200, { ok: true });
    }

    // sincronizar
    const tipo = pedido.tipo;
    if (tipo !== "pdm" && tipo !== "servico") return respostaJson(cors, 400, { error: "Pedido inválido" });
    const numero = inteiroPositivo(pedido.pagina) ?? 1;
    const pagina = await lerPortal(urlPortal(tipo, { pagina: numero }));
    const linhas = tipo === "pdm"
      ? pagina.resultado.map(mapearPdm).filter(Boolean)
      : pagina.resultado.map(mapearServico).filter(Boolean);
    if (linhas.length > 0) {
      const { error } = await admin.from(tipo === "pdm" ? "cat_material_pdms" : "cat_servicos")
        .upsert(linhas.map((l) => ({ ...l, atualizado_em: agora })), { onConflict: tipo === "pdm" ? "codigo_pdm" : "codigo_servico" });
      if (error) return respostaJson(cors, 500, { error: "Falha ao gravar o catálogo" });
    }
    if (numero >= pagina.totalPaginas) {
      const tabela = tipo === "pdm" ? "cat_material_pdms" : "cat_servicos";
      const { count } = await admin.from(tabela).select("id", { count: "exact", head: true });
      await admin.from("cat_sincronizacoes")
        .upsert({ tipo, total: count ?? 0, atualizado_em: agora, atualizado_por: caller.id }, { onConflict: "tipo" });
    }
    console.log(JSON.stringify({ funcao: "catalogo-compras", acao, tipo, pagina: numero, gravados: linhas.length }));
    return respostaJson(cors, 200, { pagina: numero, totalPaginas: pagina.totalPaginas, gravados: linhas.length });
  } catch (e) {
    if (e instanceof ErroPortal) {
      console.error(JSON.stringify({ funcao: "catalogo-compras", erro: "portal", detalhe: e.message }));
      return respostaJson(cors, 502, { error: MENSAGEM_PORTAL });
    }
    console.error(JSON.stringify({ funcao: "catalogo-compras", erro: "interno" }));
    return respostaJson(cors, 500, { error: "Erro interno" });
  }
});
