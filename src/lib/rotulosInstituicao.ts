/**
 * RÓTULOS COM A IDENTIDADE DA INSTITUIÇÃO
 *
 * Monta texto de tela ("Efetivo do <sigla>", "Estadual (<UF>)") a partir do cadastro da
 * instituição, sem nome de cliente no código. Sem argumento, lê o snapshot do tenant na hora
 * (código puro); em componente, passe o valor de `useIdentidade()`/`useTenant()` para
 * re-renderizar quando a identidade do banco chegar.
 *
 * Importa só o `snapshot` (não o índice de `@/core/tenant`) porque é usado por tipos e modelos
 * de documento que rodam nos testes em Node, onde o índice puxaria o cliente Supabase. Sem
 * snapshot (testes), cai no texto genérico.
 */
import { getTenantSnapshotOuNulo } from '@/core/tenant/snapshot';

/** Sigla do órgão para compor "do X", "no X", "ao X"; sem sigla cadastrada, "órgão". */
export function orgaoEmTexto(sigla: string | undefined = getTenantSnapshotOuNulo()?.identidade.sigla): string {
  return sigla?.trim() || 'órgão';
}

/** Nome oficial do órgão; vazio quando não cadastrado. */
export function nomeOficialDoOrgao(): string {
  return getTenantSnapshotOuNulo()?.identidade.nomeOficial?.trim() ?? '';
}

/** UF da sede do órgão; vazia quando não cadastrada. */
export function ufDaSede(uf: string | undefined = getTenantSnapshotOuNulo()?.endereco?.uf): string {
  return uf?.trim() ?? '';
}
