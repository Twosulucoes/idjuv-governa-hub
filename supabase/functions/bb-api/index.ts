// ============================================================================
// bb-api — APIs de leitura do Banco do Brasil (Extratos v2 e Validação de Contas v1)
// ============================================================================
// Spec: docs/superpowers/specs/2026-10-11-financeiro-fiplan-banco-design.md (Etapa 4)
//
// Ações (body {acao, ...}):
//   status         diz quais segredos estão configurados e o ambiente (sem revelar valores) e tenta obter
//                  o token OAuth de cada API.
//   extrato        {conta_bancaria_id, data_inicio, data_fim} (YYYY-MM-DD, até 31 dias): busca o extrato da
//                  conta de fin_contas_bancarias (paginado, no máximo 50 páginas de 200 lançamentos; acima disso
//                  responde 422 sem gravar nada e pede um período menor), grava em fin_extrato_lancamentos pela RPC
//                  registrar_extrato_bb (só service role) e devolve os totais.
//   validar-conta  {movimento_id, banco?, agencia, conta}: situação da conta no BB e se o CPF/CNPJ do favorecido do
//                  movimento (fin_movimentos_bancarios, lido aqui no servidor; o corpo não aceita documento) é o
//                  titular. banco, se vier, tem de ser 001. Cada consulta vai para a trilha audit_logs (módulo
//                  financeiro, entity_type fin_movimentos_bancarios, entity_id = movimento) com o resultado e sem
//                  documento, agência ou conta; sem registro na trilha, o resultado não é devolvido. Cota de 60
//                  consultas por usuário por hora (consumir_cota_uso, entity_type bb_validar_conta; acima, 429).
//
// Toda chamada ao BB tem tempo limite de 20 s (AbortSignal.timeout): estouro vira 503 com etapa e código "timeout".
//
// Autorização: token do usuário + RPC pode_conciliar_pagamentos (perfil ativo, módulo financeiro e
// pagamento.conciliar), avaliada como o próprio usuário ANTES de criar o cliente com a service role.
//
// Segredos (por instância, `supabase secrets set`): BB_AMBIENTE (homologacao|producao), BB_CLIENT_ID,
// BB_CLIENT_SECRET, BB_APP_KEY, BB_CERT_PEM e BB_KEY_PEM (certificado do cliente para o mTLS da API de
// Extratos). Nada disso vai para o banco nem para a resposta.
//
// LGPD: o log nunca leva token, CPF/CNPJ, agência ou conta — só a ação e o código HTTP.
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { CABECALHOS_CLIENTE_SUPABASE, montarCors } from "../_shared/cors.ts";

// CORS com allowlist por ambiente (ALLOWED_ORIGINS), em falha fechada: ver ../_shared/cors.ts.
function corsHeaders(req: Request) {
  return montarCors(req, { cabecalhos: CABECALHOS_CLIENTE_SUPABASE });
}

// ---------------------------------------------------------------- configuração
type Ambiente = "homologacao" | "producao";

const SERVIDORES: Record<Ambiente, { token: string; extratos: string; validacao: string; chaveApp: string }> = {
  homologacao: {
    token: "https://oauth.hm.bb.com.br/oauth/token",
    extratos: "https://extratos.mtls.api.hm.bb.com.br/v2",
    validacao: "https://api.externo.hm.bb.com.br/validacao-contas/v1",
    // Conferir no portal do BB: homologação usa gw-dev-app-key; produção, gw-app-key.
    chaveApp: "gw-dev-app-key",
  },
  producao: {
    token: "https://oauth.bb.com.br/oauth/token",
    extratos: "https://extratos.mtls.api.bb.com.br/v2",
    validacao: "https://api.externo.bb.com.br/validacao-contas/v1",
    chaveApp: "gw-app-key",
  },
};

const ESCOPO_EXTRATO = "extrato-info";
const ESCOPO_VALIDACAO = "validacao-contas.info";

interface ConfigBB {
  ambiente: Ambiente | null;
  clientId: string;
  clientSecret: string;
  appKey: string;
  certPem: string;
  keyPem: string;
}

function lerConfig(): ConfigBB {
  const amb = (Deno.env.get("BB_AMBIENTE") ?? "homologacao").trim().toLowerCase();
  return {
    ambiente: amb === "homologacao" || amb === "producao" ? amb : null,
    clientId: Deno.env.get("BB_CLIENT_ID") ?? "",
    clientSecret: Deno.env.get("BB_CLIENT_SECRET") ?? "",
    appKey: Deno.env.get("BB_APP_KEY") ?? "",
    // Segredo em linha única costuma vir com "\n" literal no lugar da quebra.
    certPem: (Deno.env.get("BB_CERT_PEM") ?? "").replace(/\\n/g, "\n"),
    keyPem: (Deno.env.get("BB_KEY_PEM") ?? "").replace(/\\n/g, "\n"),
  };
}

class ErroBB extends Error {
  constructor(public etapa: string, public status: number, public codigo?: string) {
    super(`${etapa}: HTTP ${status}${codigo ? ` (${codigo})` : ""}`);
  }
}

// ---------------------------------------------------------------- HTTP com o BB
type ClienteHttp = { close(): void };
type DenoComMtls = {
  createHttpClient?: (opcoes: { cert: string; key: string }) => ClienteHttp;
};

let clienteMtls: ClienteHttp | null = null;
function obterClienteMtls(cfg: ConfigBB): ClienteHttp {
  if (clienteMtls) return clienteMtls;
  if (!cfg.certPem || !cfg.keyPem) throw new ErroBB("mtls", 0, "certificado_ausente");
  const criar = (Deno as unknown as DenoComMtls).createHttpClient;
  if (typeof criar !== "function") throw new ErroBB("mtls", 0, "runtime_sem_mtls");
  try {
    clienteMtls = criar({ cert: cfg.certPem, key: cfg.keyPem });
  } catch {
    throw new ErroBB("mtls", 0, "certificado_invalido");
  }
  return clienteMtls;
}

const TEMPO_LIMITE_MS = 20_000;
const MAX_PAGINAS_EXTRATO = 50;
// validar-conta: no máximo 60 consultas por usuário por hora (cada uma confirma titularidade de CPF/CNPJ no BB).
// Cota pela RPC consumir_cota_uso (conta e registra em audit_logs na mesma transação).
const MAX_VALIDACOES_POR_HORA = 60;

async function buscar(etapa: string, url: string, init: RequestInit, cliente?: ClienteHttp): Promise<Response> {
  // `client` é a extensão do Deno ao fetch para mTLS. Tempo limite em toda chamada ao BB.
  const comLimite = { ...init, signal: AbortSignal.timeout(TEMPO_LIMITE_MS) };
  try {
    return await fetch(url, (cliente ? { ...comLimite, client: cliente } : comLimite) as RequestInit);
  } catch (e) {
    const nome = e instanceof Error ? e.name : "";
    throw new ErroBB(etapa, 0, nome === "TimeoutError" || nome === "AbortError" ? "timeout" : "falha_de_rede");
  }
}

async function lerJson(resp: Response): Promise<Record<string, unknown>> {
  const texto = await resp.text();
  try {
    const v = JSON.parse(texto);
    return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

const tokens = new Map<string, { valor: string; expira: number }>();

async function obterToken(cfg: ConfigBB, escopo: string): Promise<string> {
  const amb = cfg.ambiente as Ambiente;
  const chave = `${amb}|${escopo}`;
  const guardado = tokens.get(chave);
  if (guardado && guardado.expira > Date.now() + 30_000) return guardado.valor;

  const resp = await buscar("token", SERVIDORES[amb].token, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${btoa(`${cfg.clientId}:${cfg.clientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials", scope: escopo }).toString(),
  });
  const corpo = await lerJson(resp);
  if (!resp.ok || typeof corpo.access_token !== "string") {
    throw new ErroBB("token", resp.status, typeof corpo.error === "string" ? corpo.error.slice(0, 60) : undefined);
  }
  const expiraEm = Number(corpo.expires_in) > 0 ? Number(corpo.expires_in) : 600;
  tokens.set(chave, { valor: corpo.access_token, expira: Date.now() + expiraEm * 1000 });
  return corpo.access_token;
}

// ---------------------------------------------------------------- utilidades
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATA_RE = /^\d{4}-\d{2}-\d{2}$/;
const digitos = (v: unknown) => String(v ?? "").replace(/\D/g, "");

function dataValida(v: unknown): Date | null {
  if (typeof v !== "string" || !DATA_RE.test(v)) return null;
  const d = new Date(`${v}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v ? null : d;
}

/** YYYY-MM-DD -> DDMMAAAA sem zero à esquerda (formato numérico da API de Extratos). */
function paraDataBB(v: string): string {
  const [a, m, d] = v.split("-");
  return String(Number(`${d}${m}${a}`));
}

/** Data numérica do BB (DDMMAAAA, sem zero à esquerda; 0 = vazia) -> YYYY-MM-DD. */
function deDataBB(v: unknown): string | null {
  const s = digitos(v);
  if (!s || Number(s) === 0) return null;
  const p = s.padStart(8, "0");
  const iso = `${p.slice(4, 8)}-${p.slice(2, 4)}-${p.slice(0, 2)}`;
  return dataValida(iso) ? iso : null;
}

const numeroOuNulo = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n !== 0 ? Math.trunc(n) : null;
};

// ---------------------------------------------------------------- ações
async function acaoStatus(cfg: ConfigBB) {
  const configurado = {
    BB_AMBIENTE: Boolean(Deno.env.get("BB_AMBIENTE")),
    BB_CLIENT_ID: Boolean(cfg.clientId),
    BB_CLIENT_SECRET: Boolean(cfg.clientSecret),
    BB_APP_KEY: Boolean(cfg.appKey),
    BB_CERT_PEM: Boolean(cfg.certPem),
    BB_KEY_PEM: Boolean(cfg.keyPem),
  };
  const testar = async (escopo: string) => {
    if (!cfg.ambiente || !cfg.clientId || !cfg.clientSecret) return { ok: false, erro: "credenciais_ausentes" };
    try {
      await obterToken(cfg, escopo);
      return { ok: true };
    } catch (e) {
      return { ok: false, erro: e instanceof ErroBB ? e.message : "falha_de_rede" };
    }
  };
  const [extrato, validacao] = await Promise.all([testar(ESCOPO_EXTRATO), testar(ESCOPO_VALIDACAO)]);
  return {
    ambiente: cfg.ambiente ?? "invalido",
    configurado,
    mtls_pronto: Boolean(cfg.certPem && cfg.keyPem),
    token: { extrato, validacao },
  };
}

interface LancamentoBB {
  identificador_bb: string;
  data_lancamento: string;
  data_movimento: string | null;
  valor: number;
  sinal: "C" | "D";
  codigo_historico: number | null;
  descricao: string | null;
  informacao_complementar: string | null;
  contrapartida_documento: string | null;
  contrapartida_tipo: "F" | "J" | null;
  contrapartida_banco: number | null;
  contrapartida_agencia: number | null;
  contrapartida_conta: string | null;
  numero_documento: string | null;
}

function normalizarLancamentos(lista: Record<string, unknown>[]): LancamentoBB[] {
  const vistos = new Map<string, number>();
  const saida: LancamentoBB[] = [];
  for (const l of lista) {
    const descricao = String(l.textoDescricaoHistorico ?? "").trim();
    // Linhas de saldo ("Saldo Anterior", "S A L D O") não são lançamentos.
    if (/^(saldo|s a l d o)/i.test(descricao)) continue;
    const data = deDataBB(l.dataLancamento);
    const sinal = String(l.indicadorSinalLancamento ?? "").trim().toUpperCase();
    const valor = Math.abs(Number(l.valorLancamento));
    if (!data || (sinal !== "C" && sinal !== "D") || !Number.isFinite(valor)) continue;

    const tipo = String(l.indicadorTipoPessoaContrapartida ?? "").trim().toUpperCase();
    const contrapartidaTipo = tipo === "F" || tipo === "J" ? tipo : null;
    let doc = digitos(l.numeroCpfCnpjContrapartida).replace(/^0+/, "");
    if (doc) doc = doc.padStart(contrapartidaTipo === "F" ? 11 : 14, "0").slice(-14);
    const contaCp = digitos(l.numeroContaContrapartida).replace(/^0+/, "");
    const dvCp = String(l.textoDvContaContrapartida ?? "").trim();
    const numeroDocumento = digitos(l.numeroDocumento).replace(/^0+/, "") || null;
    const lote = digitos(l.numeroLote).replace(/^0+/, "") || "0";
    const historico = numeroOuNulo(l.codigoHistorico);

    // A API não traz um id do lançamento: a chave junta os campos que o identificam e a ordem
    // entre lançamentos idênticos do mesmo dia (reimportar o mesmo período dá a mesma chave).
    const base = [data, lote, numeroDocumento ?? "0", historico ?? 0, valor.toFixed(2), sinal].join("|");
    const ordem = (vistos.get(base) ?? 0) + 1;
    vistos.set(base, ordem);

    saida.push({
      identificador_bb: `${base}|${ordem}`,
      data_lancamento: data,
      data_movimento: deDataBB(l.dataMovimento),
      valor: Number(valor.toFixed(2)),
      sinal,
      codigo_historico: historico,
      descricao: descricao.slice(0, 255) || null,
      informacao_complementar: String(l.textoInformacaoComplementar ?? "").trim().slice(0, 500) || null,
      contrapartida_documento: doc || null,
      contrapartida_tipo: contrapartidaTipo,
      contrapartida_banco: numeroOuNulo(l.codigoBancoContrapartida),
      contrapartida_agencia: numeroOuNulo(l.codigoAgenciaContrapartida),
      contrapartida_conta: contaCp ? `${contaCp}${dvCp ? `-${dvCp}` : ""}`.slice(0, 30) : null,
      numero_documento: numeroDocumento,
    });
  }
  return saida;
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req);
  const responder = (corpo: unknown, status = 200) =>
    new Response(JSON.stringify(corpo), { status, headers: { ...cors, "Content-Type": "application/json" } });

  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return responder({ error: "Método não permitido" }, 405);

  let acao = "";
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return responder({ error: "Não autorizado" }, 401);

    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!url || !anonKey || !serviceKey) return responder({ error: "Configuração do backend ausente" }, 500);

    const usuario = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userError } = await usuario.auth.getUser();
    if (userError || !user) return responder({ error: "Sessão inválida" }, 401);

    // Permissão avaliada como o próprio usuário (auth.uid() dentro da função). Erro na checagem nega.
    const { data: pode, error: permError } = await usuario.rpc("pode_conciliar_pagamentos");
    if (permError) return responder({ error: "Falha ao validar permissões" }, 500);
    if (pode !== true) return responder({ error: "Sem permissão (pagamento.conciliar no módulo financeiro)" }, 403);

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    acao = typeof body.acao === "string" ? body.acao : "";
    const cfg = lerConfig();

    if (acao === "status") return responder(await acaoStatus(cfg));

    if (acao !== "extrato" && acao !== "validar-conta") return responder({ error: "Ação inválida" }, 400);
    if (!cfg.ambiente) return responder({ error: "BB_AMBIENTE inválido (use homologacao ou producao)" }, 500);
    if (!cfg.clientId || !cfg.clientSecret || !cfg.appKey) {
      return responder({ error: "Credenciais do Banco do Brasil não configuradas nesta instância" }, 503);
    }
    const srv = SERVIDORES[cfg.ambiente];

    // Service role só depois da checagem de permissão.
    const admin = createClient(url, serviceKey);

    if (acao === "validar-conta") {
      const movimentoId = typeof body.movimento_id === "string" ? body.movimento_id : "";
      const banco = body.banco === undefined || body.banco === null || body.banco === "" ? "001" : digitos(body.banco).padStart(3, "0");
      const agencia = digitos(body.agencia).replace(/^0+/, "");
      const conta = digitos(body.conta).replace(/^0+/, "");
      if ("cpf_cnpj" in body || "documento" in body) {
        return responder({ error: "O CPF/CNPJ vem do movimento, não do pedido" }, 400);
      }
      if (!UUID_RE.test(movimentoId) || !agencia || agencia.length > 5 || !conta || conta.length > 12) {
        return responder({ error: "Movimento, agência ou conta inválidos" }, 400);
      }
      if (banco !== "001") return responder({ error: "A validação de contas só consulta contas do Banco do Brasil (001)" }, 400);

      const { data: mov, error: movErro } = await admin
        .from("fin_movimentos_bancarios")
        .select("id, favorecido_documento")
        .eq("id", movimentoId)
        .maybeSingle();
      if (movErro) return responder({ error: "Falha ao ler o movimento" }, 500);
      if (!mov) return responder({ error: "Movimento não encontrado" }, 404);
      const doc = digitos(mov.favorecido_documento);
      if (doc.length !== 11 && doc.length !== 14) return responder({ error: "O movimento não tem CPF/CNPJ do favorecido" }, 400);

      // Cota por usuário na última hora, antes de chamar o BB. Sem documento, agência nem conta na descrição.
      const { data: dentroDaCota, error: cotaError } = await admin.rpc("consumir_cota_uso", {
        _usuario: user.id,
        _tipo: "bb_validar_conta",
        _quantidade: 1,
        _limite: MAX_VALIDACOES_POR_HORA,
        _modulo: "financeiro",
        _descricao: `Validação de conta no Banco do Brasil (movimento ${movimentoId})`,
      });
      if (cotaError) {
        console.error("bb-api: validar-conta: falha ao consumir a cota", cotaError.code ?? "");
        return responder({ error: "Falha ao verificar o limite de uso" }, 500);
      }
      if (!dentroDaCota) {
        return responder({ error: `Limite de ${MAX_VALIDACOES_POR_HORA} validações de conta por hora atingido. Tente mais tarde.` }, 429);
      }

      // Trilha: quem consultou, qual movimento e o resultado (sem documento, agência nem conta).
      const registrar = async (resultado: Record<string, unknown>) => {
        const { error } = await admin.from("audit_logs").insert({
          action: "view",
          entity_type: "fin_movimentos_bancarios",
          entity_id: movimentoId,
          module_name: "financeiro",
          user_id: user.id,
          description: "Validação de conta do favorecido na API do Banco do Brasil (bb-api)",
          metadata: { fonte: "bb-api", acao: "validar-conta", ambiente: cfg.ambiente, ...resultado },
        });
        if (error) console.error("bb-api: validar-conta: falha ao registrar a trilha", error.code ?? "");
        return !error;
      };

      let corpo: Record<string, unknown>;
      try {
        const token = await obterToken(cfg, ESCOPO_VALIDACAO);
        const q = new URLSearchParams({ cpfCnpj: doc, [srv.chaveApp]: cfg.appKey });
        const resp = await buscar("validacao", `${srv.validacao}/contas/${agencia}-${conta}/situacao?${q}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        corpo = await lerJson(resp);
        if (!resp.ok) throw new ErroBB("validacao", resp.status);
      } catch (e) {
        await registrar({
          resultado: "falha",
          etapa: e instanceof ErroBB ? e.etapa : "interno",
          status_bb: e instanceof ErroBB ? e.status : null,
          codigo: e instanceof ErroBB ? e.codigo ?? null : null,
        });
        throw e;
      }
      const resultado = {
        contaAtiva: typeof corpo.contaAtiva === "boolean" ? corpo.contaAtiva : null,
        titularConta: typeof corpo.titularConta === "boolean" ? corpo.titularConta : null,
      };
      if (!(await registrar({ resultado: "ok", conta_ativa: resultado.contaAtiva, titular_conta: resultado.titularConta }))) {
        return responder({ error: "Falha ao registrar a consulta na trilha de auditoria" }, 500);
      }
      return responder(resultado);
    }

    // ---- extrato
    const contaId = typeof body.conta_bancaria_id === "string" ? body.conta_bancaria_id : "";
    const inicio = dataValida(body.data_inicio);
    const fim = dataValida(body.data_fim);
    if (!UUID_RE.test(contaId) || !inicio || !fim) return responder({ error: "Conta ou período inválido" }, 400);
    const dias = Math.round((fim.getTime() - inicio.getTime()) / 86_400_000);
    if (dias < 0 || dias > 30) return responder({ error: "O período deve ter de 1 a 31 dias" }, 400);

    const { data: contaBanco, error: contaErro } = await admin
      .from("fin_contas_bancarias")
      .select("id, banco_codigo, agencia, conta")
      .eq("id", contaId)
      .maybeSingle();
    if (contaErro) return responder({ error: "Falha ao ler a conta bancária" }, 500);
    if (!contaBanco) return responder({ error: "Conta bancária não encontrada" }, 404);
    if (digitos(contaBanco.banco_codigo).replace(/^0+/, "") !== "1") {
      return responder({ error: "A conta não é do Banco do Brasil" }, 400);
    }
    const agencia = digitos(contaBanco.agencia).replace(/^0+/, "");
    const conta = digitos(contaBanco.conta).replace(/^0+/, "");
    if (!agencia || !conta) return responder({ error: "Agência ou conta da conta bancária inválida" }, 400);

    const cliente = obterClienteMtls(cfg);
    const token = await obterToken(cfg, ESCOPO_EXTRATO);
    const brutos: Record<string, unknown>[] = [];
    let pagina = 1;
    let paginas = 0;
    while (pagina > 0) {
      if (paginas >= MAX_PAGINAS_EXTRATO) {
        return responder({
          error: `O extrato do período passa de ${MAX_PAGINAS_EXTRATO} páginas: escolha um período menor. Nada foi gravado.`,
        }, 422);
      }
      const q = new URLSearchParams({
        [srv.chaveApp]: cfg.appKey,
        numeroPaginaSolicitacao: String(pagina),
        quantidadeRegistroPaginaSolicitacao: "200",
        dataInicioSolicitacao: paraDataBB(body.data_inicio as string),
        dataFimSolicitacao: paraDataBB(body.data_fim as string),
      });
      const resp = await buscar("extrato", `${srv.extratos}/conta-corrente/agencia/${agencia}/conta/${conta}?${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      }, cliente);
      const corpo = await lerJson(resp);
      if (!resp.ok) throw new ErroBB("extrato", resp.status);
      paginas++;
      const lista = Array.isArray(corpo.listaLancamento) ? corpo.listaLancamento : [];
      for (const l of lista) if (l && typeof l === "object") brutos.push(l as Record<string, unknown>);
      const proxima = Number(corpo.numeroPaginaProximo);
      pagina = Number.isFinite(proxima) && proxima > pagina ? proxima : 0;
    }

    const lancamentos = normalizarLancamentos(brutos);
    const { data: totais, error: rpcErro } = await admin.rpc("registrar_extrato_bb", {
      p_conta_bancaria_id: contaId,
      p_lancamentos: lancamentos,
    });
    if (rpcErro) {
      console.error("bb-api: extrato: falha ao gravar", rpcErro.code ?? "");
      return responder({ error: "Falha ao gravar o extrato" }, 500);
    }
    return responder({
      periodo: { inicio: body.data_inicio, fim: body.data_fim },
      paginas,
      recebidos_do_banco: brutos.length,
      ...(totais as Record<string, unknown>),
    });
  } catch (e) {
    if (e instanceof ErroBB) {
      console.error("bb-api:", acao, e.etapa, e.status, e.codigo ?? "");
      const status = e.status === 0 ? 503 : 502;
      return responder({ error: "Falha na comunicação com o Banco do Brasil", etapa: e.etapa, status_bb: e.status, codigo: e.codigo ?? null }, status);
    }
    console.error("bb-api:", acao, e instanceof Error ? e.name : "erro");
    return responder({ error: "Erro interno" }, 500);
  }
});
