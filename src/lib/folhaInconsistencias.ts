/**
 * Inconsistências que o processamento da folha grava em `fichas_financeiras.inconsistencias` (códigos de
 * `folha_montar_ficha` e `processar_folha_pagamento`) e o texto mostrado ao usuário. As de tributo
 * (`BLOQUEANTES`, mesma lista de `public.folha_inconsistencias_bloqueantes()`) impedem o fechamento; as demais
 * fecham só com justificativa (teste do RH de 06/11/2026, item 7).
 */

export const ROTULO_INCONSISTENCIA: Record<string, string> = {
  tabela_inss_ausente: 'Tabela de INSS sem vigência: o INSS saiu zero',
  tabela_irrf_ausente: 'Tabela de IRRF sem vigência: o IRRF saiu zero',
  deducao_dependente_nao_configurada: 'Dedução por dependente do IRRF não configurada',
  desconto_simplificado_irrf_nao_configurado: 'Desconto simplificado do IRRF não configurado',
  reducao_irrf_nao_configurada: 'Redução do IRRF (Lei 15.270) não configurada',
  aliquota_patronal_ou_rat_nao_configurada: 'Alíquota do INSS patronal ou do RAT/FAP não configurada',
  sem_dados_bancarios: 'Sem banco e conta no cadastro',
  sem_frequencia_do_mes: 'Frequência do mês não lançada',
  portaria_de_nomeacao_nao_publicada: 'Portaria de nomeação sem publicação registrada',
  falta_fora_dos_dias_pagos_ignorada: 'Falta lançada fora dos dias pagos ou em feriado (não descontada)',
  regime_previdenciario_a_confirmar: 'Regime de previdência a confirmar (vínculo externo)',
  onus_da_cessao_nao_informado: 'Cessão sem o ônus informado',
  vencimento_alterado_na_competencia: 'Vencimento do cargo mudou no meio do mês',
  liquido_negativo: 'Líquido negativo',
  acima_do_teto_remuneratorio: 'Remuneração acima do teto',
  primeira_parcela_do_13_nao_localizada: '1ª parcela do 13º não localizada',
  ferias_vencidas_a_apurar: 'Férias vencidas a apurar',
  rescisao_conferir_calculo: 'Rescisão: conferir o cálculo',
};

export const INCONSISTENCIAS_BLOQUEANTES = [
  'tabela_inss_ausente',
  'tabela_irrf_ausente',
  'deducao_dependente_nao_configurada',
  'desconto_simplificado_irrf_nao_configurado',
  'reducao_irrf_nao_configurada',
  'aliquota_patronal_ou_rat_nao_configurada',
] as const;

/** Justificativa mínima para fechar com inconsistência não bloqueante (a mesma de `fechar_folha`). */
export const JUSTIFICATIVA_MINIMA_FECHAMENTO = 20;

export const rotuloInconsistencia = (codigo: string): string =>
  ROTULO_INCONSISTENCIA[codigo] ?? codigo.replace(/_/g, ' ');

/** Códigos de uma ficha (o campo é jsonb: lista de textos; qualquer outra forma vira lista vazia). */
export function codigosDaFicha(inconsistencias: unknown): string[] {
  return Array.isArray(inconsistencias) ? inconsistencias.filter((c): c is string => typeof c === 'string') : [];
}

export const ehBloqueante = (codigo: string): boolean =>
  (INCONSISTENCIAS_BLOQUEANTES as readonly string[]).includes(codigo);
