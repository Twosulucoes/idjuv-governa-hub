/**
 * Registro dos importadores disponíveis na Central de Importações.
 * Para adicionar um importador, implemente `Importador` em `importadores/` e inclua-o aqui.
 */

import type { Importador } from "./types";
import { importadorQddFiplan } from "./importadores/qddFiplan";

// Cada importador é coerente com o próprio tipo de linha; na lista o tipo da linha não importa.
const generico = <T,>(imp: Importador<T>) => imp as unknown as Importador<unknown>;

export const IMPORTADORES: Importador<unknown>[] = [generico(importadorQddFiplan)];

export function obterImportador(id: string): Importador<unknown> | undefined {
  return IMPORTADORES.find((i) => i.id === id);
}

/** Quem tem a permissão de algum importador entra na Central de Importações. */
// Nunca vazia: ProtectedRoute com lista vazia liberaria a rota para qualquer usuário logado.
const permissoes = [...new Set(IMPORTADORES.map((i) => i.permissao).filter(Boolean))];
export const PERMISSOES_IMPORTACAO = permissoes.length ? permissoes : ["admin"];
