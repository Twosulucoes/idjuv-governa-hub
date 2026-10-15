import { abrirArquivoPrivado, abrirUrlExterna, caminhoNoBucket } from "@/lib/storageArquivos";

/**
 * Arquivo (PDF) de portaria registrada a partir do SEI.
 *
 * O bucket `documentos` é privado: o banco guarda o caminho (`portarias/<arquivo>.pdf`) em
 * `documentos.arquivo_url`/`arquivo_assinado_url` e a leitura usa URL assinada. Registros antigos
 * guardavam a URL pública do bucket, que é convertida em caminho; link externo (ex.: DOE) abre como está.
 */

export const BUCKET_PORTARIAS = "documentos";

/** Validade da URL assinada do PDF da portaria (1 hora). */
const VALIDADE_URL_S = 3600;

export type ArquivoPortariaResolvido =
  | { tipo: "caminho"; caminho: string }
  | { tipo: "externa"; url: string };

/** Classifica o valor gravado: caminho no bucket `documentos` ou URL externa `http(s)`. */
export function resolverArquivoPortaria(
  valor: string | null | undefined,
): ArquivoPortariaResolvido | null {
  const caminho = caminhoNoBucket(BUCKET_PORTARIAS, valor);
  if (caminho) return { tipo: "caminho", caminho };
  const texto = valor?.trim() ?? "";
  if (/^https?:\/\//i.test(texto)) return { tipo: "externa", url: texto };
  return null;
}

/**
 * Abre em nova aba o arquivo da portaria. Lança `Error` com mensagem em português (pronta para toast)
 * se o arquivo não existir, o usuário não tiver permissão no bucket ou o link for inválido.
 */
export async function abrirArquivoPortaria(valor: string | null | undefined): Promise<void> {
  const resolvido = resolverArquivoPortaria(valor);
  if (!resolvido) throw new Error("Arquivo não encontrado ou link inválido.");
  if (resolvido.tipo === "externa") {
    abrirUrlExterna(resolvido.url);
    return;
  }
  try {
    await abrirArquivoPrivado(BUCKET_PORTARIAS, resolvido.caminho, { validadeSegundos: VALIDADE_URL_S });
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "";
    // Falha ao assinar costuma ser falta de permissão no bucket (política do Storage)
    if (mensagem.startsWith("Não foi possível abrir o arquivo")) {
      throw new Error("Sem permissão para abrir o arquivo da portaria, ou o arquivo não existe mais.");
    }
    throw erro;
  }
}
