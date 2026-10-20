/** Formatos de exibição comuns aos relatórios do RH. Vazio volta '' e a tabela/campo imprime "—". */

export function formatarCPF(cpf: string | null | undefined): string {
  if (!cpf) return '';
  return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

/** "2026-03-01" (ou timestamp ISO) → "01/03/2026". Lê só a parte da data: sem fuso, sem dia trocado. */
export function formatarData(data: string | null | undefined): string {
  if (!data) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(data);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : data;
}

/** Data de geração "dd/mm/aaaa" → trecho de nome de arquivo "dd-mm-aaaa". */
export const dataNoArquivo = (data: string): string => data.replace(/\//g, '-');
