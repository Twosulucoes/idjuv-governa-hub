import { supabase } from "@/integrations/supabase/client";

/**
 * Utilitários para arquivos em buckets privados do Supabase Storage.
 *
 * O banco guarda o CAMINHO do arquivo dentro do bucket (ex.: `<servidor_id>/<doc_id>.pdf`), e a
 * leitura acontece por URL assinada de curta duração. Registros antigos guardavam a URL pública
 * completa; `caminhoNoBucket` converte esses valores em caminho na leitura, sem migração de dados.
 */

/** Variantes de URL do Storage que trazem um segmento antes do nome do bucket. */
const PREFIXOS_OBJETO = new Set(["public", "sign", "authenticated"]);

/** Validade padrão (segundos) da URL assinada usada para abrir o arquivo. */
const VALIDADE_PADRAO_S = 60;

/**
 * Devolve o caminho do arquivo dentro do `bucket`.
 *
 * - Valor que não começa com `http` já é caminho e volta como está (se for seguro, ver `caminhoSeguro`).
 * - URL do Storage (`/object/public/<bucket>/<path>`, `/object/sign/<bucket>/<path>?token=...`,
 *   `/object/<bucket>/<path>`) devolve o `<path>` decodificado, sem querystring.
 * - URL de outro bucket, não reconhecida, vazia ou nula devolve `null`.
 */
export function caminhoNoBucket(bucket: string, valor: string | null | undefined): string | null {
  if (!valor) return null;
  const texto = valor.trim();
  if (!texto) return null;
  if (!/^https?:\/\//i.test(texto)) return caminhoSeguro(texto);

  let url: URL;
  try {
    url = new URL(texto);
  } catch {
    return null;
  }

  // `pathname` já vem sem querystring/fragmento e ainda codificado
  const marcador = "/object/";
  const inicio = url.pathname.indexOf(marcador);
  if (inicio === -1) return null;

  const segmentos = url.pathname.slice(inicio + marcador.length).split("/");
  if (segmentos.length > 0 && PREFIXOS_OBJETO.has(segmentos[0])) segmentos.shift();

  const [bucketDaUrl, ...resto] = segmentos;
  if (!bucketDaUrl || resto.length === 0) return null;

  try {
    if (decodeURIComponent(bucketDaUrl) !== bucket) return null;
    return caminhoSeguro(decodeURIComponent(resto.join("/")));
  } catch {
    // Codificação inválida (ex.: `%` solto)
    return null;
  }
}

/**
 * Recusa caminho que o storage-js poderia resolver para outra rota da API (segmento `.`/`..`,
 * barra inicial, `\`, `%`, `?`, `#`, caractere de controle). Os caminhos gravados pelo app nunca têm esses caracteres.
 */
function caminhoSeguro(caminho: string): string | null {
  if (!caminho || caminho.startsWith("/") || /[\\%?#]/.test(caminho)) return null;
  // O parser de URL apaga tab/LF/CR: ".\t./" viraria ".." na requisição
  if ([...caminho].some((c) => c.charCodeAt(0) < 0x20 || c.charCodeAt(0) === 0x7f)) return null;
  if (caminho.split("/").some((seg) => seg === "" || seg === "." || seg === "..")) return null;
  return caminho;
}

/**
 * Abre em nova aba uma URL externa já gravada (ex.: link público antigo), aceitando só `http(s)`.
 * Evita que um valor como `javascript:...` gravado no banco rode código na origem do app.
 */
export function abrirUrlExterna(valor: string | null | undefined): void {
  if (!valor) throw new Error("Arquivo não encontrado ou link inválido.");
  let url: URL;
  try {
    url = new URL(valor.trim());
  } catch {
    throw new Error("Arquivo não encontrado ou link inválido.");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Arquivo não encontrado ou link inválido.");
  }
  window.open(url.href, "_blank", "noopener,noreferrer");
}

interface OpcoesAbrirArquivo {
  /** Validade da URL assinada, em segundos (padrão: 60). */
  validadeSegundos?: number;
}

/**
 * Abre em nova aba um arquivo de bucket privado, por URL assinada.
 *
 * A aba é aberta de forma síncrona (ainda no gesto do usuário) para não ser barrada pelo bloqueador
 * de pop-up, e só depois recebe a URL assinada. Em erro, a aba é fechada e é lançado um `Error` com
 * mensagem genérica em português (sem detalhes do servidor), pronta para exibir em toast.
 */
export async function abrirArquivoPrivado(
  bucket: string,
  valor: string | null | undefined,
  opcoes: OpcoesAbrirArquivo = {},
): Promise<void> {
  const caminho = caminhoNoBucket(bucket, valor);
  if (!caminho) {
    throw new Error("Arquivo não encontrado ou link inválido.");
  }

  const aba = window.open("", "_blank");
  if (aba) aba.opener = null;

  let urlAssinada: string;
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(caminho, opcoes.validadeSegundos ?? VALIDADE_PADRAO_S);
    if (error || !data?.signedUrl) throw new Error("falha ao assinar URL");
    urlAssinada = data.signedUrl;
  } catch {
    aba?.close();
    throw new Error("Não foi possível abrir o arquivo. Verifique sua permissão ou tente novamente.");
  }

  if (aba) {
    // Se o usuário fechou a aba enquanto a URL era gerada, não reabre
    if (!aba.closed) aba.location.href = urlAssinada;
    return;
  }

  // Aba barrada pelo bloqueador: tenta abrir direto
  const novaAba = window.open(urlAssinada, "_blank");
  if (!novaAba) {
    throw new Error("O navegador bloqueou a nova aba. Permita pop-ups para este site e tente novamente.");
  }
  novaAba.opener = null;
}
