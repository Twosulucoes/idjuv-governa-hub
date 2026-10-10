/**
 * FILA OFFLINE DE FOTOS DE VISTORIA (IndexedDB, sem dependências)
 *
 * Guarda a foto (Blob) e os metadados até haver conexão para enviar.
 * Banco: 'inventario-campo' · store: 'fotos-pendentes' · keyPath: 'id'.
 */

import type { FotoPendente } from "@/types/inventarioCampo";

const DB_NOME = "inventario-campo";
const DB_VERSAO = 1;
const STORE = "fotos-pendentes";

function abrirBanco(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("Este navegador não permite guardar fotos offline."));
      return;
    }
    const req = indexedDB.open(DB_NOME, DB_VERSAO);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Falha ao abrir o armazenamento local."));
  });
}

/** Executa uma operação na store e resolve quando a transação termina. */
async function executar<T>(
  modo: IDBTransactionMode,
  operacao: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await abrirBanco();
  return new Promise<T>((resolve, reject) => {
    let resultado = undefined as unknown as T;
    const tx = db.transaction(STORE, modo);
    const req = operacao(tx.objectStore(STORE));
    req.onsuccess = () => {
      resultado = req.result;
    };
    tx.oncomplete = () => {
      db.close();
      resolve(resultado);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? req.error ?? new Error("Falha no armazenamento local."));
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error ?? new Error("Operação no armazenamento local cancelada."));
    };
  });
}

export async function adicionarFotoPendente(foto: FotoPendente): Promise<void> {
  await executar("readwrite", (store) => store.put(foto));
}

/** Atualiza metadados (ex.: tentativas, último erro) de uma foto já na fila. */
export async function atualizarFotoPendente(foto: FotoPendente): Promise<void> {
  await executar("readwrite", (store) => store.put(foto));
}

export async function listarFotosPendentes(): Promise<FotoPendente[]> {
  const lista = await executar<FotoPendente[]>("readonly", (store) => store.getAll() as IDBRequest<FotoPendente[]>);
  return (lista || []).sort((a, b) => a.capturada_em.localeCompare(b.capturada_em));
}

export async function removerFotoPendente(id: string): Promise<void> {
  await executar("readwrite", (store) => store.delete(id));
}

export async function contarFotosPendentes(): Promise<number> {
  return executar<number>("readonly", (store) => store.count());
}

// ========== INTEGRIDADE ==========

/** SHA-256 do conteúdo do Blob, em hexadecimal minúsculo (64 caracteres). */
export async function calcularSha256(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ========== COMPRESSÃO ==========

function carregarImagem(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Não foi possível ler a imagem capturada."));
    img.src = dataUrl;
  });
}

/**
 * Converte a imagem (dataURL) em Blob JPEG, reduzindo o maior lado para
 * `ladoMaximo` px quando necessário.
 */
export async function comprimirImagem(
  dataUrl: string,
  ladoMaximo = 2048,
  qualidade = 0.85,
): Promise<Blob> {
  const img = await carregarImagem(dataUrl);
  const largura = img.naturalWidth || img.width;
  const altura = img.naturalHeight || img.height;
  const escala = Math.min(1, ladoMaximo / Math.max(largura, altura, 1));
  const w = Math.max(1, Math.round(largura * escala));
  const h = Math.max(1, Math.round(altura * escala));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível processar a imagem.");
  ctx.drawImage(img, 0, 0, w, h);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Não foi possível comprimir a imagem."));
      },
      "image/jpeg",
      qualidade,
    );
  });
}
