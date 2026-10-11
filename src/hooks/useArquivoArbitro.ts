import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// O bucket arbitros-docs é privado (fotos e cópias de RG/CPF). As tabelas guardam o endereço no
// formato do getPublicUrl (/storage/v1/object/public/arbitros-docs/<caminho>), que serve só de
// referência: para abrir o arquivo, a equipe com o módulo arbitros pede uma URL assinada curta.
const BUCKET = "arbitros-docs";
const MARCA = `/object/public/${BUCKET}/`;
const VALIDADE_SEGUNDOS = 10 * 60;

// Só os caminhos que o formulário gera (pasta conhecida + nome simples). O endereço vem de quem
// preencheu o formulário público: sem esta checagem, "../" no caminho levaria a assinatura (feita com
// a sessão da equipe) para outro endpoint do servidor.
const CAMINHO_VALIDO = /^(fotos|documentos|modalidades)\/[^/\\?#%]+$/;

/** Caminho do arquivo dentro do bucket, a partir do endereço gravado na tabela. */
export function caminhoArquivoArbitro(url: string): string | null {
  const i = url.indexOf(MARCA);
  if (i < 0) return null;
  let caminho: string;
  try {
    caminho = decodeURIComponent(url.slice(i + MARCA.length).split("?")[0]);
  } catch {
    return null;
  }
  return CAMINHO_VALIDO.test(caminho) && !caminho.includes("..") ? caminho : null;
}

/** Referência a gravar na tabela depois do upload (mesmo formato dos registros antigos). */
export function referenciaArquivoArbitro(caminho: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl;
}

// Quem acabou de enviar a foto no formulário público não consegue ler o bucket; a prévia vem do
// próprio arquivo, guardada aqui enquanto a página estiver aberta.
const previasLocais = new Map<string, string>();

export function registrarPreviaArbitro(referencia: string, arquivo: File) {
  previasLocais.set(referencia, URL.createObjectURL(arquivo));
}

export function previaLocalArbitro(referencia: string | null | undefined): string | undefined {
  return referencia ? previasLocais.get(referencia) : undefined;
}

async function assinar(referencia: string): Promise<string> {
  const caminho = caminhoArquivoArbitro(referencia);
  if (!caminho) throw new Error("Endereço de arquivo inválido");
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(caminho, VALIDADE_SEGUNDOS);
  if (error || !data?.signedUrl) throw new Error(error?.message || "Não foi possível abrir o arquivo");
  return data.signedUrl;
}

/** URL para exibir (img) um arquivo do bucket: prévia local ou URL assinada. */
export function useArquivoArbitro(referencia: string | null | undefined) {
  const previa = previaLocalArbitro(referencia);
  return useQuery({
    queryKey: ["arquivo-arbitro", referencia],
    queryFn: () => assinar(referencia as string),
    enabled: !!referencia && !previa,
    // renova antes de a assinatura vencer
    staleTime: (VALIDADE_SEGUNDOS - 60) * 1000,
    initialData: previa,
  });
}

/** Abre o arquivo numa aba nova com URL assinada (a aba é aberta antes, para não cair no bloqueio de pop-up). */
export async function abrirArquivoArbitro(referencia: string) {
  const previa = previaLocalArbitro(referencia);
  const aba = window.open("", "_blank");
  try {
    const url = previa ?? (await assinar(referencia));
    if (aba) {
      aba.opener = null;
      aba.location.href = url;
    } else {
      window.location.assign(url);
    }
  } catch (e) {
    aba?.close();
    throw e;
  }
}
