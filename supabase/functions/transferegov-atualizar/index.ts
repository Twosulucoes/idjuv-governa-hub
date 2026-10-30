import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { CABECALHOS_CLIENTE_SUPABASE, montarCors } from "../_shared/cors.ts";
import { fetchComTempoLimite, TempoEsgotado } from "../_shared/tempoLimite.ts";
import { lerConfigGithub, podeDisparar, type UltimaRodada } from "./regras.ts";

// Botão "Atualizar agora" de Financeiro → Convênios federais: pede ao GitHub uma rodada da rotina
// .github/workflows/transferegov.yml (a mesma que roda todo dia às 9h). A carga em si continua na rotina e na
// função `transferegov`; aqui só se dispara.
// Autorização: sessão do usuário + RPC pode_atualizar_convenios_federais (perfil ativo, módulo financeiro e
// financeiro.convenios.visualizar). Uma rodada por vez e no mínimo 5 minutos entre pedidos.
// Configuração (segredos do .env das funções): GITHUB_DISPATCH_TOKEN (token do GitHub só com Actions: leitura e
// escrita neste repositório) e GITHUB_REPO (dono/repositório). Sem eles, 503.
// Spec: docs/superpowers/specs/2026-10-29-convenios-federais-transferegov-design.md

const TEMPO_LIMITE_GITHUB_MS = 15_000;

Deno.serve(async (req) => {
  const cors = montarCors(req, { cabecalhos: CABECALHOS_CLIENTE_SUPABASE });
  const responder = (corpo: unknown, status = 200) =>
    new Response(JSON.stringify(corpo), { status, headers: { ...cors, "Content-Type": "application/json" } });

  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return responder({ error: "Método não permitido" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return responder({ error: "Não autorizado" }, 401);

    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    if (!url || !anonKey) return responder({ error: "Configuração do backend ausente" }, 500);

    const usuario = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await usuario.auth.getUser();
    if (userError || !user) return responder({ error: "Sessão inválida" }, 401);

    const { data: pode, error: permError } = await usuario.rpc("pode_atualizar_convenios_federais");
    if (permError) return responder({ error: "Falha ao validar permissões" }, 500);
    if (pode !== true) return responder({ error: "Sem permissão (financeiro.convenios.visualizar no módulo financeiro)" }, 403);

    const cfg = lerConfigGithub((nome) => Deno.env.get(nome));
    if (!cfg) return responder({ error: "O botão ainda não foi configurado nesta instalação" }, 503);

    const api = `https://api.github.com/repos/${cfg.repo}/actions/workflows/${encodeURIComponent(cfg.workflow)}`;
    const cabecalhos = {
      Authorization: `Bearer ${cfg.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "governa-hub-transferegov",
    };

    const lista = await fetchComTempoLimite("GitHub", `${api}/runs?per_page=1`, { headers: cabecalhos }, TEMPO_LIMITE_GITHUB_MS);
    if (!lista.ok) {
      console.error(JSON.stringify({ funcao: "transferegov-atualizar", etapa: "listar", status: lista.status }));
      return responder({ error: "Não foi possível falar com o GitHub (confira o token)" }, 502);
    }
    const runs = ((await lista.json()) as { workflow_runs?: UltimaRodada[] }).workflow_runs ?? [];
    const decisao = podeDisparar(runs[0] ?? null, new Date());
    if (!decisao.pode) return responder({ error: decisao.motivo }, decisao.status);

    const disparo = await fetchComTempoLimite(
      "GitHub",
      `${api}/dispatches`,
      { method: "POST", headers: { ...cabecalhos, "Content-Type": "application/json" }, body: JSON.stringify({ ref: cfg.ref }) },
      TEMPO_LIMITE_GITHUB_MS,
    );
    if (disparo.status !== 204) {
      console.error(JSON.stringify({ funcao: "transferegov-atualizar", etapa: "disparar", status: disparo.status }));
      return responder({ error: "O GitHub recusou o pedido de atualização" }, 502);
    }
    console.log(JSON.stringify({ funcao: "transferegov-atualizar", disparado: true }));
    return responder({ ok: true, mensagem: "Atualização pedida. Leva cerca de 1 minuto." }, 202);
  } catch (e) {
    if (e instanceof TempoEsgotado) return responder({ error: "O GitHub não respondeu a tempo" }, 504);
    console.error(JSON.stringify({ funcao: "transferegov-atualizar", erro: e instanceof Error ? e.name : "erro" }));
    return responder({ error: "Erro interno" }, 500);
  }
});
