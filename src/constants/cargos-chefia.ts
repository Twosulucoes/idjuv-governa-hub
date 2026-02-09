/**
 * Constantes para definição de cargos de chefia
 * 
 * Este arquivo define quais cargos são considerados "de chefia" no sistema.
 * Cargos de chefia têm regras especiais de lotação baseadas no tipo de unidade.
 */

// Nomes de cargos que são considerados de chefia (case-insensitive match)
export const CARGOS_CHEFIA_NOMES = [
  "presidente",
  "diretor",
  "diretor-presidente",
  "diretor geral",
  "chefe de divisão",
  "chefe de núcleo",
  "chefe de unidade local",
  "chefe de setor",
  "chefe de departamento",
  "coordenador",
  "coordenador-geral",
  "superintendente",
  "gerente",
  "supervisor",
] as const;

// Tipos de unidade compatíveis com cargos de chefia específicos
export const CHEFIA_TIPO_UNIDADE_MAP: Record<string, string[]> = {
  "presidente": ["presidencia"],
  "diretor": ["diretoria"],
  "diretor-presidente": ["presidencia"],
  "diretor geral": ["diretoria"],
  "chefe de divisão": ["divisao"],
  "chefe de núcleo": ["nucleo"],
  "chefe de unidade local": ["nucleo"],
  "chefe de setor": ["setor"],
  "chefe de departamento": ["departamento"],
  "coordenador": ["coordenacao"],
  "coordenador-geral": ["coordenacao"],
  "superintendente": ["diretoria"],
  "gerente": ["departamento", "divisao"],
  "supervisor": ["setor", "nucleo"],
};

// Caracteres mínimos para justificativa de lotação alternativa
export const MIN_JUSTIFICATIVA_LOTACAO_ALTERNATIVA = 50;

/**
 * Verifica se um nome de cargo é considerado cargo de chefia
 */
export function isCargoChefiaByName(cargoNome: string | undefined | null): boolean {
  if (!cargoNome) return false;
  
  const nomeNormalizado = cargoNome.toLowerCase().trim();
  
  return CARGOS_CHEFIA_NOMES.some(chefia => 
    nomeNormalizado.includes(chefia.toLowerCase())
  );
}

/**
 * Obtém os tipos de unidade compatíveis com um cargo de chefia
 */
export function getTiposUnidadeCompativeis(cargoNome: string | undefined | null): string[] | null {
  if (!cargoNome) return null;
  
  const nomeNormalizado = cargoNome.toLowerCase().trim();
  
  for (const [chefia, tipos] of Object.entries(CHEFIA_TIPO_UNIDADE_MAP)) {
    if (nomeNormalizado.includes(chefia.toLowerCase())) {
      return tipos;
    }
  }
  
  return null;
}

/**
 * Verifica se uma unidade é compatível com um cargo de chefia
 */
export function isUnidadeCompativelComChefia(
  cargoNome: string | undefined | null, 
  tipoUnidade: string | undefined | null
): boolean {
  if (!cargoNome || !tipoUnidade) return true;
  
  const tiposCompativeis = getTiposUnidadeCompativeis(cargoNome);
  
  // Se não é cargo de chefia mapeado, qualquer unidade é compatível
  if (!tiposCompativeis) return true;
  
  return tiposCompativeis.includes(tipoUnidade.toLowerCase());
}

/**
 * Verifica se uma lotação alternativa requer justificativa
 */
export function requerJustificativaLotacao(
  cargoNome: string | undefined | null,
  tipoUnidadeSelecionada: string | undefined | null
): boolean {
  if (!cargoNome || !tipoUnidadeSelecionada) return false;
  
  // Se é cargo de chefia e a unidade NÃO é do tipo esperado, requer justificativa
  const tiposCompativeis = getTiposUnidadeCompativeis(cargoNome);
  
  if (!tiposCompativeis) return false; // Não é cargo de chefia
  
  return !tiposCompativeis.includes(tipoUnidadeSelecionada.toLowerCase());
}
