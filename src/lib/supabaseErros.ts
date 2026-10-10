/**
 * Erros e verificações compartilhados pelos hooks de dados (React Query + Supabase).
 *
 * Com RLS, um UPDATE/DELETE sem permissão não dá erro: o Postgres apenas não
 * encontra linha a afetar e devolve zero linhas. Os hooks usam `.select()` após
 * a operação e passam o resultado por `exigirLinhaAfetada` para transformar
 * esse silêncio num erro legível para o usuário.
 */

/** Erro lançado quando a operação não afeta linha alguma (ou o banco nega com 42501). */
export class SemPermissaoError extends Error {
  constructor(acao: "alterar" | "excluir") {
    super(
      acao === "excluir"
        ? "Sem permissão para excluir; cancele o registro."
        : "Sem permissão para alterar o registro.",
    );
    this.name = "SemPermissaoError";
  }
}

/** Resultado de UPDATE/DELETE: lança se houve erro ou se nenhuma linha foi afetada. */
export function exigirLinhaAfetada<T>(
  resultado: { data: T[] | null; error: { code?: string; message: string } | null },
  acao: "alterar" | "excluir",
): T {
  if (resultado.error) {
    if (resultado.error.code === "42501") throw new SemPermissaoError(acao);
    throw resultado.error;
  }
  if (!resultado.data || resultado.data.length === 0) throw new SemPermissaoError(acao);
  return resultado.data[0];
}
