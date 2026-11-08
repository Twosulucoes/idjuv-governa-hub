/**
 * Exercício (ano orçamentário) compartilhado pelas telas do módulo Financeiro.
 *
 * Fonte: parâmetro `?exercicio=` da URL; sem ele, o último ano escolhido neste
 * navegador (localStorage); sem nenhum dos dois, o ano atual. Faixa válida:
 * 2024 até o ano seguinte ao atual (o QDD do ano seguinte sai antes da virada).
 *
 * O ano seguinte só vale quando vem da URL: guardado no navegador, ele fazia todas as telas abrirem num
 * exercício ainda vazio (teste do RH de 06/11/2026, item 14: Diárias pagas abriu em 2027 sem nenhuma diária).
 */

import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export const EXERCICIO_MINIMO = 2024;
const CHAVE_ARMAZENAMENTO = "financeiro:exercicio";
const PARAMETRO = "exercicio";

/** Anos disponíveis no seletor, do mais recente para o mais antigo. */
export function exerciciosDisponiveis(): number[] {
  const maximo = new Date().getFullYear() + 1;
  return Array.from({ length: maximo - EXERCICIO_MINIMO + 1 }, (_, i) => maximo - i);
}

function exercicioValido(valor: unknown): number | null {
  const ano = typeof valor === "number" ? valor : Number.parseInt(String(valor ?? ""), 10);
  if (!Number.isInteger(ano)) return null;
  return ano >= EXERCICIO_MINIMO && ano <= new Date().getFullYear() + 1 ? ano : null;
}

/** Ano padrão quando a URL não traz um: o guardado no navegador, se não for futuro; senão o ano atual. */
export function exercicioPadrao(armazenado: unknown, anoAtual = new Date().getFullYear()): number {
  const ano = exercicioValido(armazenado);
  return ano !== null && ano <= anoAtual ? ano : anoAtual;
}

function lerArmazenado(): string | null {
  try {
    return window.localStorage.getItem(CHAVE_ARMAZENAMENTO);
  } catch {
    return null;
  }
}

function gravarArmazenado(ano: number) {
  try {
    window.localStorage.setItem(CHAVE_ARMAZENAMENTO, String(ano));
  } catch {
    // Navegador sem localStorage (modo privado, cota): a URL continua valendo
  }
}

/** Acrescenta `exercicio=<ano>` a um link interno, preservando a query que já existir. */
export function linkComExercicio(href: string, exercicio: number): string {
  const [caminho, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  params.set(PARAMETRO, String(exercicio));
  return `${caminho}?${params.toString()}`;
}

export function useExercicioFinanceiro() {
  const [searchParams, setSearchParams] = useSearchParams();
  const daUrl = exercicioValido(searchParams.get(PARAMETRO));

  const exercicio = useMemo(
    () => daUrl ?? exercicioPadrao(lerArmazenado()),
    [daUrl],
  );

  // Ano vindo da URL (link compartilhado, voltar do navegador) vira o padrão deste navegador
  useEffect(() => {
    if (daUrl !== null) gravarArmazenado(daUrl);
  }, [daUrl]);

  const setExercicio = useCallback(
    (ano: number) => {
      const valido = exercicioValido(ano);
      if (valido === null) return;
      gravarArmazenado(valido);
      setSearchParams(
        (atual) => {
          const proximo = new URLSearchParams(atual);
          proximo.set(PARAMETRO, String(valido));
          return proximo;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const comExercicio = useCallback((href: string) => linkComExercicio(href, exercicio), [exercicio]);
  const exercicios = useMemo(() => exerciciosDisponiveis(), []);

  return { exercicio, setExercicio, exercicios, comExercicio };
}
