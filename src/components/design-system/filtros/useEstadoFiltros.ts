import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { estadoParaParams, limparEstado, paramsParaEstado, type EstadoFiltros, type FiltroDef } from "./logica";

export interface FiltrosDaTela<T> {
  definicoes: FiltroDef<T>[];
  estado: EstadoFiltros;
  aoMudar: (estado: EstadoFiltros) => void;
}

const prefixo = "ds-filtros:";

function lerSalvo(chave: string): EstadoFiltros | null {
  try {
    const bruto = window.localStorage.getItem(prefixo + chave);
    return bruto ? (JSON.parse(bruto) as EstadoFiltros) : null;
  } catch {
    return null;
  }
}

function salvar(chave: string, estado: EstadoFiltros) {
  try {
    window.localStorage.setItem(prefixo + chave, JSON.stringify(estado));
  } catch {
    /* navegação privada: só não lembra */
  }
}

/**
 * Estado dos filtros de uma tela, guardado no endereço (dá para mandar o link
 * já filtrado) e lembrado no navegador: sem filtro na URL, volta o último
 * usado nesta tela. `chave` identifica a tela (ex.: "financeiro.empenhos").
 */
export function useEstadoFiltros<T>(chave: string, definicoes: FiltroDef<T>[]): FiltrosDaTela<T> {
  const [params, setParams] = useSearchParams();
  const defsRef = React.useRef(definicoes);
  defsRef.current = definicoes;

  const daUrl = paramsParaEstado(params, definicoes);
  const [estado, setEstado] = React.useState<EstadoFiltros>(() =>
    limparEstado(definicoes, daUrl ?? lerSalvo(chave) ?? {}),
  );

  // Link com filtro aberto com a tela já montada (ex.: atalho do painel).
  const textoUrl = daUrl ? JSON.stringify(daUrl) : null;
  React.useEffect(() => {
    if (textoUrl == null) return;
    const novo = limparEstado(defsRef.current, JSON.parse(textoUrl) as EstadoFiltros);
    setEstado((atual) => (JSON.stringify(atual) === JSON.stringify(novo) ? atual : novo));
  }, [textoUrl]);

  // Filtro lembrado do navegador vai para a URL ao abrir a tela.
  const estadoInicial = React.useRef(estado);
  React.useEffect(() => {
    if (textoUrl == null && Object.keys(estadoInicial.current).length > 0) {
      setParams((p) => estadoParaParams(estadoInicial.current, defsRef.current, p), { replace: true });
    }
    // só na montagem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aoMudar = React.useCallback(
    (novo: EstadoFiltros) => {
      const limpo = limparEstado(defsRef.current, novo);
      setEstado(limpo);
      salvar(chave, limpo);
      setParams((p) => estadoParaParams(limpo, defsRef.current, p), { replace: true });
    },
    [chave, setParams],
  );

  return { definicoes, estado, aoMudar };
}
