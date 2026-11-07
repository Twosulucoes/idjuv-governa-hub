/**
 * DATA DO BANCO PARA EXIBIR
 *
 * `new Date("2026-11-09")` é meia-noite em UTC, que em Boa Vista/Manaus (UTC−4) ainda é 08/11: a tela mostrava a
 * portaria de transferência com um dia a menos que o efeito digitado (teste do RH de 06/11/2026, item 20). Data sem
 * hora vira meia-noite local; data com hora (timestamp) segue como está.
 */
export function paraDataLocal(valor: string | Date): Date {
  if (valor instanceof Date) return valor;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor.trim());
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(valor);
}
