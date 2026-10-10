/**
 * UTILITÁRIOS DE TEXTO
 */

/** Remove acentos (diacríticos) e converte para minúsculas — útil para busca e comparação. */
export function semAcento(valor: string | null | undefined): string {
  return (valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}
