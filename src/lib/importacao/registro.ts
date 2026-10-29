/**
 * Registro dos importadores disponíveis na Central de Importações.
 * Para adicionar um importador, implemente `Importador` em `importadores/` e inclua-o aqui.
 */

import type { Importador } from "./types";
import { importadorArquivoBancario } from "./importadores/arquivoBancario";
import { importadorClassificadoresFiplan } from "./importadores/classificadoresFiplan";
import { importadorContratosPlanilha } from "./importadores/contratosPlanilha";
import { importadorEmpenhosFip614 } from "./importadores/empenhosFip614";
import { importadorFolhaSigrh } from "./importadores/folhaSigrh";
import { importadorPedsFiplan } from "./importadores/pedsFiplan";
import { importadorPortariasPlanilha } from "./importadores/portariasPlanilha";
import { importadorProcessosPlanilha } from "./importadores/processosPlanilha";
import { importadorQddFiplan } from "./importadores/qddFiplan";

// Cada importador é coerente com o próprio tipo de linha; na lista o tipo da linha não importa.
const generico = <T,>(imp: Importador<T>) => imp as unknown as Importador<unknown>;

export const IMPORTADORES: Importador<unknown>[] = [
  generico(importadorQddFiplan),
  generico(importadorClassificadoresFiplan),
  generico(importadorEmpenhosFip614),
  generico(importadorPedsFiplan),
  generico(importadorArquivoBancario),
  generico(importadorPortariasPlanilha),
  generico(importadorFolhaSigrh),
  generico(importadorProcessosPlanilha),
  generico(importadorContratosPlanilha),
];

export function obterImportador(id: string): Importador<unknown> | undefined {
  return IMPORTADORES.find((i) => i.id === id);
}

/** Quem tem a permissão de algum importador entra na Central de Importações. */
// Nunca vazia: ProtectedRoute com lista vazia liberaria a rota para qualquer usuário logado.
const permissoes = [...new Set(IMPORTADORES.map((i) => i.permissao).filter(Boolean))];
export const PERMISSOES_IMPORTACAO = permissoes.length ? permissoes : ["admin"];
