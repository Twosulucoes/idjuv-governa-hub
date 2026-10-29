/**
 * Converte as linhas dos CSV do Transferegov (antigo Siconv) nas linhas das tabelas fin_tg_* do sistema.
 * As chaves de saída são os nomes das colunas (a RPC fin_tg_carregar usa jsonb_populate_recordset).
 * Dicionário dos arquivos: modelo de dados em https://api-publica.transferegov.gestao.gov.br (docs/INTEGRACOES_EXTERNAS.md §4.2).
 */

/** Texto sem espaço nas pontas; vazio vira null. */
export function texto(v) {
  if (v == null) return null;
  const t = String(v).replace(/\s+/g, " ").trim();
  return t === "" ? null : t;
}

/**
 * Valor do CSV: "497053,11" (vírgula decimal, o mais comum), "653415.59" (ponto, em VL_SALDO_CONTA), "2450000" ou
 * "1.234,56" (milhar com ponto). Vazio ou ilegível vira null.
 */
export function numero(v) {
  const t = texto(v);
  if (t === null) return null;
  let s = t.replace(/\s/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Inteiro ou null. */
export function inteiro(v) {
  const n = numero(v);
  return n !== null && Number.isInteger(n) ? n : null;
}

/** "31/12/2026" → "2026-12-31"; data inválida vira null. */
export function data(v) {
  const t = texto(v);
  const m = t && /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(t);
  if (!m) return null;
  const [, d, mes, a] = m;
  const dt = new Date(Date.UTC(Number(a), Number(mes) - 1, Number(d)));
  if (dt.getUTCFullYear() !== Number(a) || dt.getUTCMonth() !== Number(mes) - 1 || dt.getUTCDate() !== Number(d)) return null;
  return `${a}-${mes}-${d}`;
}

/** "29/10/2026 06:31:32" (hora de Brasília) → "2026-10-29T06:31:32-03:00". */
export function dataHora(v) {
  const t = texto(v);
  const m = t && /^(\d{2}\/\d{2}\/\d{4})(?: (\d{2}:\d{2}:\d{2}))?$/.exec(t);
  if (!m) return null;
  const dia = data(m[1]);
  return dia ? `${dia}T${m[2] ?? "00:00:00"}-03:00` : null;
}

/** "SIM" → true, "NÃO"/"NAO" → false, outro → null. */
export function simNao(v) {
  const t = texto(v)?.toUpperCase();
  if (t === "SIM") return true;
  if (t === "NÃO" || t === "NAO") return false;
  return null;
}

/** Só os dígitos (CNPJ). */
export function digitos(v) {
  return String(v ?? "").replace(/\D/g, "");
}

export function mapearProposta(r) {
  const id = inteiro(r.ID_PROPOSTA);
  if (!id) return null;
  return {
    id_proposta: id,
    numero: texto(r.NR_PROPOSTA) ?? String(id),
    ano: inteiro(r.ANO_PROP),
    data_proposta: data(r.DIA_PROPOSTA),
    cnpj_proponente: digitos(r.IDENTIF_PROPONENTE),
    orgao_superior: texto(r.DESC_ORGAO_SUP),
    orgao: texto(r.DESC_ORGAO),
    modalidade: texto(r.MODALIDADE),
    objeto: texto(r.OBJETO_PROPOSTA),
    situacao: texto(r.SIT_PROPOSTA),
    situacao_projeto_basico: texto(r.SITUACAO_PROJETO_BASICO),
    inicio_vigencia: data(r.DIA_INIC_VIGENCIA_PROPOSTA),
    fim_vigencia: data(r.DIA_FIM_VIGENCIA_PROPOSTA),
    valor_global: numero(r.VL_GLOBAL_PROP),
    valor_repasse: numero(r.VL_REPASSE_PROP),
    valor_contrapartida: numero(r.VL_CONTRAPARTIDA_PROP),
    banco: texto(r.NM_BANCO),
    agencia: texto(r.CD_AGENCIA),
    conta: texto(r.CD_CONTA),
  };
}

export function mapearEmenda(r) {
  const id = inteiro(r.ID_PROPOSTA);
  const numeroEmenda = texto(r.NR_EMENDA);
  if (!id || !numeroEmenda) return null;
  return {
    id_proposta: id,
    numero_emenda: numeroEmenda,
    programa_emenda: texto(r.COD_PROGRAMA_EMENDA),
    parlamentar: texto(r.NOME_PARLAMENTAR),
    tipo_parlamentar: texto(r.TIPO_PARLAMENTAR),
    qualificacao_proponente: texto(r.QUALIF_PROPONENTE),
    impositiva: simNao(r.IND_IMPOSITIVO),
    cnpj_beneficiario: texto(digitos(r.BENEFICIARIO_EMENDA)),
    valor_repasse_proposta: numero(r.VALOR_REPASSE_PROPOSTA_EMENDA),
    valor_repasse_emenda: numero(r.VALOR_REPASSE_EMENDA),
  };
}

export function mapearConvenio(r) {
  const numeroConvenio = texto(r.NR_CONVENIO);
  const id = inteiro(r.ID_PROPOSTA);
  if (!numeroConvenio || !id) return null;
  return {
    numero: numeroConvenio,
    id_proposta: id,
    situacao: texto(r.SIT_CONVENIO),
    subsituacao: texto(r.SUBSITUACAO_CONV),
    situacao_publicacao: texto(r.SITUACAO_PUBLICACAO),
    instrumento_ativo: simNao(r.INSTRUMENTO_ATIVO),
    assinado: simNao(r.IND_ASSINADO),
    numero_processo: texto(r.NR_PROCESSO),
    ug_emitente: texto(r.UG_EMITENTE),
    data_assinatura: data(r.DIA_ASSIN_CONV),
    data_publicacao: data(r.DIA_PUBL_CONV),
    inicio_vigencia: data(r.DIA_INIC_VIGENC_CONV),
    fim_vigencia: data(r.DIA_FIM_VIGENC_CONV),
    fim_vigencia_original: data(r.DIA_FIM_VIGENC_ORIGINAL_CONV),
    data_limite_prestacao_contas: data(r.DIA_LIMITE_PREST_CONTAS),
    dias_prestacao_contas: inteiro(r.DIAS_PREST_CONTAS),
    qtd_aditivos: inteiro(r.QTD_TA),
    qtd_prorrogacoes: inteiro(r.QTD_PRORROGA),
    valor_global: numero(r.VL_GLOBAL_CONV),
    valor_repasse: numero(r.VL_REPASSE_CONV),
    valor_contrapartida: numero(r.VL_CONTRAPARTIDA_CONV),
    valor_empenhado: numero(r.VL_EMPENHADO_CONV),
    valor_desembolsado: numero(r.VL_DESEMBOLSADO_CONV),
    saldo_reman_tesouro: numero(r.VL_SALDO_REMAN_TESOURO),
    saldo_reman_convenente: numero(r.VL_SALDO_REMAN_CONVENENTE),
    rendimento_aplicacao: numero(r.VL_RENDIMENTO_APLICACAO),
    ingresso_contrapartida: numero(r.VL_INGRESSO_CONTRAPARTIDA),
    saldo_conta: numero(r.VL_SALDO_CONTA),
    valor_global_original: numero(r.VALOR_GLOBAL_ORIGINAL_CONV),
  };
}

export function mapearEmpenho(r) {
  const id = inteiro(r.ID_EMPENHO);
  const convenio = texto(r.NR_CONVENIO);
  if (!id || !convenio) return null;
  return {
    tipo: "empenho",
    id_origem: id,
    numero_convenio: convenio,
    numero: texto(r.NR_EMPENHO),
    data: data(r.DATA_EMISSAO),
    valor: numero(r.VALOR_EMPENHO),
    situacao: texto(r.DESC_SITUACAO_EMPENHO),
    descricao: texto(r.OBSERVACAO_EMPENHO),
    indicacao: texto(r.DESCRICAO_EMENDA_SIAFI),
    natureza_despesa: texto(r.NATUREZA_DESPESA),
    ug_emitente: texto(r.UG_EMITENTE),
  };
}

export function mapearDesembolso(r) {
  const id = inteiro(r.ID_DESEMBOLSO);
  const convenio = texto(r.NR_CONVENIO);
  if (!id || !convenio) return null;
  return {
    tipo: "desembolso",
    id_origem: id,
    numero_convenio: convenio,
    numero: texto(r.NR_SIAFI),
    data: data(r.DATA_DESEMBOLSO),
    valor: numero(r.VL_DESEMBOLSADO),
    situacao: null,
    descricao: texto(r.OBSERVACAO_DH),
    indicacao: null,
    natureza_despesa: null,
    ug_emitente: texto(r.UG_EMITENTE_DH),
  };
}

/** Mantém uma linha por chave (a última vence): a RPC grava com chave primária. */
export function semRepetir(linhas, chave) {
  const mapa = new Map();
  for (const l of linhas) mapa.set(chave(l), l);
  return [...mapa.values()];
}
