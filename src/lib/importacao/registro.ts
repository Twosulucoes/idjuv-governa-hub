/**
 * Registro dos importadores. Cada um é aberto na tela do setor dono (`local`); a Administração só mostra o histórico.
 * Para adicionar um importador, implemente `Importador` em `importadores/` e inclua-o aqui.
 */

import type { Importador } from "./types";
import { importadorArquivoBancario } from "./importadores/arquivoBancario";
import { importadorClassificadoresFiplan } from "./importadores/classificadoresFiplan";
import { importadorContratosPlanilha } from "./importadores/contratosPlanilha";
import { importadorDiariasFiplan } from "./importadores/diariasFiplan";
import { importadorEmpenhosFip614 } from "./importadores/empenhosFip614";
import { importadorFolhaSigrh } from "./importadores/folhaSigrh";
import { importadorPedsFiplan } from "./importadores/pedsFiplan";
import { importadorPortariasPlanilha } from "./importadores/portariasPlanilha";
import { importadorProcessosPlanilha } from "./importadores/processosPlanilha";
import { importadorQddFiplan } from "./importadores/qddFiplan";
import { importadorServidoresSigrh } from "./importadores/servidoresSigrh";

// Cada importador é coerente com o próprio tipo de linha; na lista o tipo da linha não importa.
const generico = <T,>(imp: Importador<T>) => imp as unknown as Importador<unknown>;

export const IMPORTADORES: Importador<unknown>[] = [
  generico(importadorQddFiplan),
  generico(importadorClassificadoresFiplan),
  generico(importadorEmpenhosFip614),
  generico(importadorPedsFiplan),
  generico(importadorDiariasFiplan),
  generico(importadorArquivoBancario),
  generico(importadorPortariasPlanilha),
  generico(importadorFolhaSigrh),
  generico(importadorServidoresSigrh),
  generico(importadorProcessosPlanilha),
  generico(importadorContratosPlanilha),
];

export function obterImportador(id: string): Importador<unknown> | undefined {
  return IMPORTADORES.find((i) => i.id === id);
}

