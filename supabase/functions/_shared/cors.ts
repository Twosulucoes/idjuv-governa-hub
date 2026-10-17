// CORS das Edge Functions com allowlist por ambiente, em falha fechada.
//
// Defina ALLOWED_ORIGINS (lista separada por vírgula) nas variáveis da função, ex.:
//   ALLOWED_ORIGINS=https://idjuv.online,http://localhost:8080
// Origem da lista → ecoada; origem fora da lista → devolve a primeira da lista (o navegador bloqueia).
// Sem ALLOWED_ORIGINS, nenhuma origem é liberada: a resposta sai sem Access-Control-Allow-Origin
// (antes caía em "*"). Chamadas servidor a servidor não dependem de CORS e seguem funcionando.

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const CABECALHOS_PADRAO = "authorization, x-client-info, apikey, content-type";

/** Cabeçalhos que o supabase-js recente envia (x-supabase-client-*), para as funções que os aceitam. */
export const CABECALHOS_CLIENTE_SUPABASE =
  "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

export interface OpcoesCors {
  /** Lista de Access-Control-Allow-Headers (padrão: authorization, x-client-info, apikey, content-type). */
  cabecalhos?: string;
  /** Access-Control-Allow-Methods, quando a função declara. */
  metodos?: string;
}

export function montarCors(req: Request, opcoes: OpcoesCors = {}): Record<string, string> {
  const cors: Record<string, string> = {
    "Access-Control-Allow-Headers": opcoes.cabecalhos ?? CABECALHOS_PADRAO,
    "Vary": "Origin",
  };
  if (opcoes.metodos) cors["Access-Control-Allow-Methods"] = opcoes.metodos;
  if (ALLOWED_ORIGINS.length > 0) {
    const origin = req.headers.get("Origin") ?? "";
    cors["Access-Control-Allow-Origin"] = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  }
  return cors;
}
