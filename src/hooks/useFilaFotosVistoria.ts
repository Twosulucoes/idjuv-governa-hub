/**
 * HOOK: FILA OFFLINE DE FOTOS DE VISTORIA
 *
 * Captura → comprime → calcula SHA-256 → grava no IndexedDB.
 * Envio idempotente: o id da foto (gerado no aparelho) é a chave.
 *  - Storage com upsert:false; "já existe" conta como enviado.
 *  - Insert na tabela; violação de unicidade (23505) conta como enviado.
 * Envia ao montar, quando a conexão volta ('online') e sob demanda.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  adicionarFotoPendente,
  atualizarFotoPendente,
  calcularSha256,
  comprimirImagem,
  listarFotosPendentes,
  removerFotoPendente,
} from "@/lib/filaFotosOffline";
import {
  BUCKET_EVIDENCIAS_INVENTARIO,
  caminhoFotoVistoria,
  type FotoPendente,
  type PosicaoGps,
} from "@/types/inventarioCampo";

export interface NovaFotoVistoria {
  campanhaId: string;
  unidadeLocalId: string;
  dataUrl: string;
  posicao: PosicaoGps | null;
  legenda?: string | null;
  temPessoa?: boolean;
  codigoObjeto?: string | null;
}

interface ErroComCodigo {
  message?: string;
  code?: string;
  status?: number;
  statusCode?: string | number;
}

function mensagemDe(erro: unknown): string {
  if (erro instanceof Error) return erro.message;
  const e = erro as ErroComCodigo | null;
  return e?.message || "Falha ao enviar a foto.";
}

function arquivoJaExiste(erro: unknown): boolean {
  const e = erro as ErroComCodigo | null;
  if (!e) return false;
  return (
    String(e.statusCode) === "409" ||
    e.status === 409 ||
    /already exists|duplicate/i.test(e.message || "")
  );
}

/** Só plataforma e tipo de aparelho (sem user agent completo nem identificadores). */
function infoDispositivo(): FotoPendente["dispositivo_info"] {
  if (typeof navigator === "undefined") return {};
  const ua = navigator.userAgent || "";
  const plataforma = /android/i.test(ua)
    ? "android"
    : /iphone|ipad|ipod/i.test(ua)
      ? "ios"
      : /windows/i.test(ua)
        ? "windows"
        : /mac os/i.test(ua)
          ? "macos"
          : /linux/i.test(ua)
            ? "linux"
            : "outra";
  const tipo = /ipad|tablet/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))
    ? "tablet"
    : /mobi|iphone|ipod/i.test(ua)
      ? "celular"
      : "computador";
  return { plataforma, tipo };
}

/**
 * Recursos exigidos para guardar a foto com integridade (hash e id local).
 * Retorna a mensagem de erro, ou null se o ambiente atende.
 */
export function verificarAmbienteFotos(): string | null {
  if (typeof window === "undefined") return null;
  if (!window.isSecureContext) {
    return "Para registrar fotos, abra o sistema por conexão segura (endereço iniciado por https).";
  }
  if (typeof crypto === "undefined" || !crypto.subtle || typeof crypto.randomUUID !== "function") {
    return "Este navegador não oferece os recursos de segurança necessários para as fotos. Atualize o navegador.";
  }
  if (typeof indexedDB === "undefined") {
    return "Este navegador não permite guardar fotos no aparelho. Use outro navegador.";
  }
  return null;
}

/** Foto pertence ao usuário informado? (só quem capturou pode enviá-la) */
function pertenceA(foto: FotoPendente, usuarioId: string | null): boolean {
  return !!usuarioId && foto.usuario_id === usuarioId;
}

const chaveUnidade = (campanhaId: string, unidadeLocalId: string) => `${campanhaId}:${unidadeLocalId}`;

export function useFilaFotosVistoria() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [pendentes, setPendentes] = useState(0);
  const [pendentesOutroUsuario, setPendentesOutroUsuario] = useState(0);
  const [porUnidade, setPorUnidade] = useState<Record<string, number>>({});
  const [enviando, setEnviando] = useState(false);
  const [ultimoErro, setUltimoErro] = useState<string | null>(null);
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const [erroAmbiente] = useState<string | null>(() => verificarAmbienteFotos());

  const enviandoRef = useRef(false);
  const reexecutarRef = useRef(false);
  const usuarioIdRef = useRef<string | null>(user?.id ?? null);
  usuarioIdRef.current = user?.id ?? null;

  const atualizarContagem = useCallback(async () => {
    try {
      const lista = await listarFotosPendentes();
      const minhas = lista.filter((f) => pertenceA(f, usuarioIdRef.current));
      setPendentes(minhas.length);
      setPendentesOutroUsuario(lista.length - minhas.length);
      const mapa: Record<string, number> = {};
      for (const f of minhas) {
        const k = chaveUnidade(f.campanha_id, f.unidade_local_id);
        mapa[k] = (mapa[k] || 0) + 1;
      }
      setPorUnidade(mapa);
    } catch (e) {
      setUltimoErro(mensagemDe(e));
    }
  }, []);

  const enviarUma = useCallback(async (foto: FotoPendente) => {
    const caminho = caminhoFotoVistoria(foto.campanha_id, foto.unidade_local_id, foto.id);

    const { error: erroUpload } = await supabase.storage
      .from(BUCKET_EVIDENCIAS_INVENTARIO)
      .upload(caminho, foto.blob, { contentType: foto.mime_type, upsert: false, cacheControl: "3600" });
    if (erroUpload && !arquivoJaExiste(erroUpload)) throw erroUpload;

    const registro: Record<string, unknown> = {
      id: foto.id,
      campanha_id: foto.campanha_id,
      unidade_local_id: foto.unidade_local_id,
      codigo_objeto: foto.codigo_objeto,
      legenda: foto.legenda,
      storage_path: caminho,
      hash_sha256: foto.hash_sha256,
      latitude: foto.latitude,
      longitude: foto.longitude,
      precisao_m: foto.precisao_m,
      capturada_em: foto.capturada_em,
      mime_type: foto.mime_type,
      tamanho_bytes: foto.tamanho_bytes,
      tem_pessoa: foto.tem_pessoa,
      dispositivo_info: foto.dispositivo_info,
      usuario_id: foto.usuario_id,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: erroInsert } = await (supabase as any)
      .from("fotos_vistoria_inventario")
      .insert(registro);
    if (erroInsert && (erroInsert as ErroComCodigo).code !== "23505") throw erroInsert;
  }, []);

  const enviarPendentes = useCallback(async () => {
    if (enviandoRef.current) {
      // Chamado durante um envio (foto nova, reconexão): repete o laço ao final
      reexecutarRef.current = true;
      return;
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    if (!usuarioIdRef.current) return;

    enviandoRef.current = true;
    setEnviando(true);
    let enviadas = 0;
    let erro: string | null = null;
    try {
      do {
        reexecutarRef.current = false;
        erro = null;
        const lista = (await listarFotosPendentes()).filter((f) => pertenceA(f, usuarioIdRef.current));
        for (const foto of lista) {
          try {
            await enviarUma(foto);
            await removerFotoPendente(foto.id);
            enviadas++;
          } catch (e) {
            erro = mensagemDe(e);
            await atualizarFotoPendente({ ...foto, tentativas: (foto.tentativas || 0) + 1, ultimo_erro: erro }).catch(
              () => undefined,
            );
          }
        }
      } while (reexecutarRef.current && (typeof navigator === "undefined" || navigator.onLine));
    } catch (e) {
      erro = mensagemDe(e);
    } finally {
      reexecutarRef.current = false;
      enviandoRef.current = false;
      setEnviando(false);
      setUltimoErro(erro);
      await atualizarContagem();
      if (enviadas > 0) {
        queryClient.invalidateQueries({ queryKey: ["fotos-vistoria"] });
        queryClient.invalidateQueries({ queryKey: ["contagem-fotos-campanha"] });
      }
    }
  }, [enviarUma, atualizarContagem, queryClient]);

  const adicionarFoto = useCallback(
    async (nova: NovaFotoVistoria): Promise<string> => {
      const problema = verificarAmbienteFotos();
      if (problema) throw new Error(problema);
      if (!usuarioIdRef.current) throw new Error("Sessão expirada: entre novamente para registrar fotos.");

      const blob = await comprimirImagem(nova.dataUrl);
      const hash = await calcularSha256(blob);
      const id = crypto.randomUUID();
      const foto: FotoPendente = {
        id,
        campanha_id: nova.campanhaId,
        unidade_local_id: nova.unidadeLocalId,
        codigo_objeto: nova.codigoObjeto?.trim() || null,
        legenda: nova.legenda?.trim() || null,
        hash_sha256: hash,
        latitude: nova.posicao?.lat ?? null,
        longitude: nova.posicao?.lon ?? null,
        precisao_m: nova.posicao ? Math.round(nova.posicao.precisao * 100) / 100 : null,
        capturada_em: new Date().toISOString(),
        mime_type: "image/jpeg",
        tamanho_bytes: blob.size,
        tem_pessoa: !!nova.temPessoa,
        dispositivo_info: infoDispositivo(),
        usuario_id: usuarioIdRef.current,
        blob,
        tentativas: 0,
        ultimo_erro: null,
      };
      await adicionarFotoPendente(foto);
      await atualizarContagem();
      void enviarPendentes();
      return id;
    },
    [atualizarContagem, enviarPendentes],
  );

  /** Apaga do aparelho as fotos capturadas por outro usuário (não podem ser enviadas por este). */
  const descartarFotosOutroUsuario = useCallback(async () => {
    try {
      const lista = await listarFotosPendentes();
      for (const foto of lista) {
        if (!pertenceA(foto, usuarioIdRef.current)) await removerFotoPendente(foto.id);
      }
    } catch (e) {
      setUltimoErro(mensagemDe(e));
    } finally {
      await atualizarContagem();
    }
  }, [atualizarContagem]);

  const pendentesDaUnidade = useCallback(
    (campanhaId: string, unidadeLocalId: string) => porUnidade[chaveUnidade(campanhaId, unidadeLocalId)] || 0,
    [porUnidade],
  );

  // Ao montar (e quando o usuário muda): conta e tenta enviar
  useEffect(() => {
    void atualizarContagem().then(() => enviarPendentes());
  }, [atualizarContagem, enviarPendentes, user?.id]);

  // Conexão voltou: envia; caiu: só atualiza o indicador
  useEffect(() => {
    const aoFicarOnline = () => {
      setOnline(true);
      void enviarPendentes();
    };
    const aoFicarOffline = () => setOnline(false);
    window.addEventListener("online", aoFicarOnline);
    window.addEventListener("offline", aoFicarOffline);
    return () => {
      window.removeEventListener("online", aoFicarOnline);
      window.removeEventListener("offline", aoFicarOffline);
    };
  }, [enviarPendentes]);

  return {
    pendentes,
    pendentesOutroUsuario,
    pendentesDaUnidade,
    enviando,
    ultimoErro,
    online,
    erroAmbiente,
    adicionarFoto,
    enviarPendentes,
    descartarFotosOutroUsuario,
  };
}
