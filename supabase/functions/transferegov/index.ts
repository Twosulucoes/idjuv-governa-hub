import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { tokenConfere, validarCarga } from "./token.ts";

// Ponte entre a rotina diária do Transferegov (GitHub Actions, scripts/transferegov/sincronizar.mjs) e o banco.
// Não é chamada pelo navegador: não tem CORS e não aceita sessão de usuário. A rotina manda a chave anon (o roteador
// das funções exige um JWT) e o segredo TRANSFEREGOV_TOKEN no cabeçalho x-transferegov-token.
//   cnpj      devolve o CNPJ da Configuração do cliente (dados_oficiais), para a rotina não ter nome de cliente.
//   carregar  troca o espelho pela RPC fin_tg_carregar (uma transação; ela confere o CNPJ de novo).
// Sem TRANSFEREGOV_TOKEN configurado (ou com menos de 32 caracteres) a função recusa tudo.
// Spec: docs/superpowers/specs/2026-10-29-convenios-federais-transferegov-design.md

const TAMANHO_MAXIMO = 10 * 1024 * 1024;

function respostaJson(status: number, corpo: unknown) {
  return new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } });
}

serve(async (req) => {
  if (req.method !== "POST") return respostaJson(405, { error: "Método não permitido" });
  if (!(await tokenConfere(req.headers.get("x-transferegov-token"), Deno.env.get("TRANSFEREGOV_TOKEN")))) {
    return respostaJson(401, { error: "Não autorizado" });
  }
  if (Number(req.headers.get("content-length") ?? 0) > TAMANHO_MAXIMO) return respostaJson(413, { error: "Pedido grande demais" });

  try {
    const corpo = await req.json().catch(() => null);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    if (corpo?.acao === "cnpj") {
      const { data, error } = await admin.from("dados_oficiais").select("valor").eq("chave", "cnpj").maybeSingle();
      if (error) return respostaJson(500, { error: "Falha ao ler a Configuração do cliente" });
      const cnpj = String(data?.valor ?? "").replace(/\D/g, "");
      if (cnpj.length !== 14) return respostaJson(409, { error: "CNPJ não cadastrado na Configuração do cliente" });
      return respostaJson(200, { cnpj });
    }

    if (corpo?.acao !== "carregar") return respostaJson(400, { error: "Pedido inválido" });
    const validado = validarCarga(corpo);
    if ("erro" in validado) return respostaJson(400, { error: validado.erro });
    const { pedido } = validado;

    const { data, error } = await admin.rpc("fin_tg_carregar", {
      p_cnpj: pedido.cnpj,
      p_data_carga: pedido.data_carga,
      p_dados: pedido.dados,
      p_forcar: false,
    });
    if (error) {
      // 22023: recusa da própria RPC (CNPJ, proponente, carga vazia); a mensagem é nossa, sem dado
      if (error.code === "22023") return respostaJson(422, { error: error.message });
      console.error(JSON.stringify({ funcao: "transferegov", erro: "rpc", codigo: error.code }));
      return respostaJson(500, { error: "Falha ao gravar o espelho" });
    }
    console.log(JSON.stringify({ funcao: "transferegov", acao: "carregar", gravados: data }));
    return respostaJson(200, { gravados: data });
  } catch (e) {
    console.error(JSON.stringify({ funcao: "transferegov", erro: e instanceof Error ? e.name : "erro" }));
    return respostaJson(500, { error: "Erro interno" });
  }
});
