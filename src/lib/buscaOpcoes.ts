/**
 * Filtro das listas com busca (combobox). O filtro padrão do cmdk é difuso: aceita as letras da busca espalhadas
 * pelo texto, e o valor do item levava o id (uuid), então "TESTE" trazia THAYNA e LUCAS (teste do RH de
 * 06/11/2026, item 25). Aqui cada palavra digitada precisa aparecer inteira no nome ou no detalhe, sem diferença
 * de acento ou maiúscula.
 */

function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Assinatura do `filter` do cmdk: 1 mostra o item, 0 esconde. */
export function filtrarOpcaoBusca(valor: string, busca: string, palavrasChave?: string[]): number {
  const termos = normalizar(busca).split(/\s+/).filter(Boolean);
  if (termos.length === 0) return 1;
  const alvo = normalizar((palavrasChave?.length ? palavrasChave : [valor]).join(" "));
  return termos.every((t) => alvo.includes(t)) ? 1 : 0;
}
