/**
 * Regras puras dos relatórios gerenciais de RH (férias, licenças, frequência e viagens).
 * Sem DOM e sem Supabase: agrupamento, somas, validação de período, montagem do filtro
 * de sobreposição e conversão das linhas para planilha. Testável em Node.
 *
 * LGPD: as linhas identificam o servidor por nome e matrícula; nenhum campo de CPF,
 * saúde (CID/CRM/médico), documento comprobatório ou dados bancários passa por aqui.
 */
import {
  AFASTAMENTO_LABELS,
  FERIAS_STATUS_LABELS,
  LICENCA_LABELS,
  VIAGEM_STATUS_LABELS,
  type TipoAfastamento,
  type TipoLicenca,
} from "@/types/rh";
import type { FrequenciaServidorResumo } from "@/hooks/useFrequencia";

// ============================================
// TIPOS
// ============================================

/** Servidor embutido nas linhas (apenas o necessário para identificar e agrupar). */
export interface ServidorRelatorio {
  id: string;
  nome_completo: string;
  matricula: string | null;
  unidade: { id: string; nome: string; sigla: string | null } | null;
  cargo: { nome: string } | null;
}

export interface LinhaFeriasRelatorio {
  id: string;
  servidor_id: string;
  periodo_aquisitivo_inicio: string;
  periodo_aquisitivo_fim: string;
  data_inicio: string;
  data_fim: string;
  dias_gozados: number;
  parcela: number | null;
  total_parcelas: number | null;
  portaria_numero: string | null;
  status: string | null;
  servidor: ServidorRelatorio | null;
}

export interface LinhaLicencaRelatorio {
  id: string;
  servidor_id: string;
  tipo_afastamento: TipoAfastamento;
  tipo_licenca: TipoLicenca | null;
  data_inicio: string;
  data_fim: string | null;
  dias_afastamento: number | null;
  status: string | null;
  portaria_numero: string | null;
  orgao_destino: string | null;
  servidor: ServidorRelatorio | null;
}

export interface LinhaViagemRelatorio {
  id: string;
  servidor_id: string;
  destino_cidade: string;
  destino_uf: string;
  destino_pais: string | null;
  data_saida: string;
  data_retorno: string;
  tipo_onus: string;
  quantidade_diarias: number | null;
  valor_diaria: number | null;
  valor_total: number | null;
  status: string | null;
  relatorio_apresentado: boolean | null;
  servidor: ServidorRelatorio | null;
}

/** Filtros comuns de férias e licenças (período obrigatório; unidade e status opcionais). */
export interface FiltroPeriodoUnidade {
  inicio: string;
  fim: string;
  unidadeId?: string;
  status?: string;
}

/** Viagens: além dos comuns, o tipo de ônus. */
export interface FiltroViagens extends FiltroPeriodoUnidade {
  tipoOnus?: string;
}

/** Filtros já descritos em texto, como saem impressos no PDF. */
export interface FiltrosImpressao {
  inicio: string;
  fim: string;
  unidadeNome?: string;
  statusLabel?: string;
  onusLabel?: string;
}

/** Grupo preservando a ordem de aparição da chave. */
export interface Grupo<T> {
  chave: string;
  itens: T[];
}

// ============================================
// LABELS LOCAIS
// ============================================

/** Rótulos de ônus da viagem (mesmos valores do CHECK da tabela). */
export const ONUS_LABELS: Record<string, string> = {
  com_onus: "Com Ônus",
  sem_onus: "Sem Ônus",
};

/** Status de licenças/afastamentos (coluna texto livre; estes são os usados pela tela). */
export const LICENCA_STATUS_LABELS: Record<string, string> = {
  ativa: "Ativa",
  encerrada: "Encerrada",
  prorrogada: "Prorrogada",
  cancelada: "Cancelada",
};

export const SEM_UNIDADE = "Sem unidade";

// ============================================
// PERÍODO
// ============================================

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Período válido: duas datas ISO (`AAAA-MM-DD`) e início não posterior ao fim. */
export function periodoValido(inicio: string | undefined, fim: string | undefined): boolean {
  if (!inicio || !fim) return false;
  if (!DATA_ISO.test(inicio) || !DATA_ISO.test(fim)) return false;
  return inicio <= fim;
}

/**
 * Filtro de sobreposição com o período: entra o registro cujo intervalo cruza
 * `[inicio, fim]`, ou seja, `colInicio <= fim` E (`colFim >= inicio` OU `colFim` nulo).
 * Devolve as partes para `.lte(colInicio, fim).or(expressaoOr)` do PostgREST.
 */
export function filtroSobreposicao(
  colInicio: string,
  colFim: string,
  inicio: string,
  fim: string,
): { colunaInicio: string; ateFim: string; expressaoOr: string } {
  return {
    colunaInicio: colInicio,
    ateFim: fim,
    expressaoOr: `${colFim}.gte.${inicio},${colFim}.is.null`,
  };
}

/** Dias corridos entre duas datas ISO, inclusive as duas pontas; 0 se faltar alguma. */
export function diasInclusivos(inicio: string | null | undefined, fim: string | null | undefined): number {
  if (!inicio || !fim) return 0;
  const a = Date.UTC(+inicio.slice(0, 4), +inicio.slice(5, 7) - 1, +inicio.slice(8, 10));
  const b = Date.UTC(+fim.slice(0, 4), +fim.slice(5, 7) - 1, +fim.slice(8, 10));
  const dias = Math.round((b - a) / 86_400_000) + 1;
  return dias > 0 ? dias : 0;
}

/** Primeiro e último dia do mês de `ref` em ISO, período padrão dos cards. */
export function periodoMesAtual(ref: Date = new Date()): { inicio: string; fim: string } {
  const ano = ref.getFullYear();
  const mes = ref.getMonth() + 1;
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const mm = String(mes).padStart(2, "0");
  return { inicio: `${ano}-${mm}-01`, fim: `${ano}-${mm}-${String(ultimoDia).padStart(2, "0")}` };
}

/** `AAAA-MM-DD` → `DD/MM/AAAA`, sem deslocamento de fuso. */
export function formatarDataISO(d: string | null | undefined): string {
  if (!d || !DATA_ISO.test(d)) return "-";
  return `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;
}

// ============================================
// AGRUPAMENTO E SOMAS
// ============================================

/** Agrupa preservando a ordem em que cada chave aparece pela primeira vez. */
export function agruparPor<T>(linhas: T[], chave: (linha: T) => string): Grupo<T>[] {
  const grupos: Grupo<T>[] = [];
  const indice = new Map<string, Grupo<T>>();
  for (const linha of linhas) {
    const k = chave(linha);
    let g = indice.get(k);
    if (!g) {
      g = { chave: k, itens: [] };
      indice.set(k, g);
      grupos.push(g);
    }
    g.itens.push(linha);
  }
  return grupos;
}

/** Soma de um seletor numérico, tratando nulo/undefined como zero. */
export function somar<T>(itens: T[], sel: (item: T) => number | null | undefined): number {
  return itens.reduce((acc, item) => acc + (Number(sel(item)) || 0), 0);
}

/** Arredonda a 2 casas (valores em reais). */
export function arredondar2(valor: number): number {
  return Math.round(valor * 100) / 100;
}

// ============================================
// DESCRIÇÕES
// ============================================

/** Rótulo "SIGLA - Nome" de uma unidade, como nos demais filtros do RH. */
export function rotuloUnidade(u: { nome: string; sigla: string | null }): string {
  return u.sigla ? `${u.sigla} - ${u.nome}` : u.nome;
}

/** "SIGLA - Nome" da unidade do servidor, ou "Sem unidade". */
export function nomeUnidade(servidor: ServidorRelatorio | null | undefined): string {
  const u = servidor?.unidade;
  if (!u) return SEM_UNIDADE;
  return rotuloUnidade(u);
}

export function nomeServidor(servidor: ServidorRelatorio | null | undefined): string {
  return servidor?.nome_completo ?? "-";
}

export function matriculaServidor(servidor: ServidorRelatorio | null | undefined): string {
  return servidor?.matricula ?? "-";
}

/** Rótulo do tipo: licença mostra o subtipo (`LICENCA_LABELS`); os demais, `AFASTAMENTO_LABELS`. */
export function rotuloTipoAfastamento(l: Pick<LinhaLicencaRelatorio, "tipo_afastamento" | "tipo_licenca">): string {
  if (l.tipo_afastamento === "licenca" && l.tipo_licenca) {
    return LICENCA_LABELS[l.tipo_licenca] ?? l.tipo_licenca;
  }
  return AFASTAMENTO_LABELS[l.tipo_afastamento] ?? l.tipo_afastamento;
}

export function rotuloStatusFerias(status: string | null): string {
  return (status && FERIAS_STATUS_LABELS[status as keyof typeof FERIAS_STATUS_LABELS]) || status || "-";
}

export function rotuloStatusLicenca(status: string | null): string {
  return (status && LICENCA_STATUS_LABELS[status]) || status || "-";
}

export function rotuloStatusViagem(status: string | null): string {
  return (status && VIAGEM_STATUS_LABELS[status as keyof typeof VIAGEM_STATUS_LABELS]) || status || "-";
}

export function rotuloOnus(tipoOnus: string | null | undefined): string {
  return (tipoOnus && ONUS_LABELS[tipoOnus]) || tipoOnus || "-";
}

/** Dias da licença: o campo gravado ou, na falta dele, os dias corridos do intervalo. */
export function diasLicenca(l: Pick<LinhaLicencaRelatorio, "dias_afastamento" | "data_inicio" | "data_fim">): number {
  if (l.dias_afastamento != null) return Number(l.dias_afastamento) || 0;
  return diasInclusivos(l.data_inicio, l.data_fim);
}

/** Valor total da viagem: o gravado ou, se nulo (legado), quantidade × valor da diária. */
export function valorTotalViagem(
  v: Pick<LinhaViagemRelatorio, "valor_total" | "quantidade_diarias" | "valor_diaria" | "tipo_onus">,
): number {
  if (v.tipo_onus === "sem_onus") return 0;
  if (v.valor_total != null) return Number(v.valor_total) || 0;
  return arredondar2((Number(v.quantidade_diarias) || 0) * (Number(v.valor_diaria) || 0));
}

/** "Cidade/UF" para destino nacional, "Cidade, País" para exterior. */
export function descreverDestino(v: Pick<LinhaViagemRelatorio, "destino_cidade" | "destino_uf" | "destino_pais">): string {
  if (v.destino_pais && v.destino_pais.trim() && v.destino_pais.trim().toUpperCase() !== "BRASIL") {
    return `${v.destino_cidade}, ${v.destino_pais}`;
  }
  return v.destino_uf ? `${v.destino_cidade}/${v.destino_uf}` : v.destino_cidade;
}

/** "Parcela 1/3" ou "-". */
export function descreverParcela(parcela: number | null, total: number | null): string {
  if (parcela == null) return "-";
  return total != null ? `${parcela}/${total}` : String(parcela);
}

/** Texto único com os filtros aplicados, para o subtítulo do PDF. */
export function descreverFiltros(f: FiltrosImpressao): string {
  const partes = [`Período: ${formatarDataISO(f.inicio)} a ${formatarDataISO(f.fim)}`];
  partes.push(`Unidade: ${f.unidadeNome ?? "Todas"}`);
  if (f.statusLabel) partes.push(`Status: ${f.statusLabel}`);
  if (f.onusLabel) partes.push(`Ônus: ${f.onusLabel}`);
  return partes.join(" | ");
}

/** Nome base do arquivo: `relatorio-<tipo>-<aaaa-mm-dd>`. */
export function nomeArquivoRelatorio(tipo: string, data: Date = new Date()): string {
  return `relatorio-${tipo}-${data.toISOString().slice(0, 10)}`;
}

// ============================================
// ORDENAÇÃO
// ============================================

/** Ordena por unidade e, dentro dela, por nome do servidor (pt-BR). */
export function ordenarPorUnidadeENome<T extends { servidor: ServidorRelatorio | null }>(linhas: T[]): T[] {
  return [...linhas].sort((a, b) => {
    const u = nomeUnidade(a.servidor).localeCompare(nomeUnidade(b.servidor), "pt-BR");
    if (u !== 0) return u;
    return nomeServidor(a.servidor).localeCompare(nomeServidor(b.servidor), "pt-BR");
  });
}

// ============================================
// LINHAS PARA PLANILHA (rótulos em português)
// ============================================

export function linhaFeriasParaPlanilha(l: LinhaFeriasRelatorio): Record<string, unknown> {
  return {
    Servidor: nomeServidor(l.servidor),
    Matrícula: matriculaServidor(l.servidor),
    Unidade: nomeUnidade(l.servidor),
    Cargo: l.servidor?.cargo?.nome ?? "-",
    "Período aquisitivo": `${formatarDataISO(l.periodo_aquisitivo_inicio)} a ${formatarDataISO(l.periodo_aquisitivo_fim)}`,
    Início: formatarDataISO(l.data_inicio),
    Fim: formatarDataISO(l.data_fim),
    Dias: Number(l.dias_gozados) || 0,
    Parcela: descreverParcela(l.parcela, l.total_parcelas),
    Status: rotuloStatusFerias(l.status),
    Portaria: l.portaria_numero ?? "-",
  };
}

export function linhaLicencaParaPlanilha(l: LinhaLicencaRelatorio): Record<string, unknown> {
  return {
    Servidor: nomeServidor(l.servidor),
    Matrícula: matriculaServidor(l.servidor),
    Unidade: nomeUnidade(l.servidor),
    Tipo: rotuloTipoAfastamento(l),
    Início: formatarDataISO(l.data_inicio),
    Fim: l.data_fim ? formatarDataISO(l.data_fim) : "Em aberto",
    Dias: diasLicenca(l),
    Status: rotuloStatusLicenca(l.status),
    Portaria: l.portaria_numero ?? "-",
    "Órgão de destino": l.orgao_destino ?? "-",
  };
}

export function linhaViagemParaPlanilha(v: LinhaViagemRelatorio): Record<string, unknown> {
  const semOnus = v.tipo_onus === "sem_onus";
  return {
    Servidor: nomeServidor(v.servidor),
    Matrícula: matriculaServidor(v.servidor),
    Unidade: nomeUnidade(v.servidor),
    Destino: descreverDestino(v),
    Saída: formatarDataISO(v.data_saida),
    Retorno: formatarDataISO(v.data_retorno),
    Ônus: rotuloOnus(v.tipo_onus),
    Diárias: semOnus ? 0 : Number(v.quantidade_diarias) || 0,
    "Valor (R$)": valorTotalViagem(v),
    Status: rotuloStatusViagem(v.status),
    "Relatório apresentado": v.relatorio_apresentado ? "Sim" : "Não",
  };
}

/** Frequência consolidada da competência; sem CPF (LGPD). */
export function linhaFrequenciaParaPlanilha(s: FrequenciaServidorResumo): Record<string, unknown> {
  return {
    Servidor: s.servidor_nome,
    Matrícula: s.servidor_matricula ?? "-",
    Unidade: s.servidor_unidade ?? SEM_UNIDADE,
    Cargo: s.servidor_cargo ?? "-",
    "Dias úteis": s.dias_uteis,
    Trabalhados: s.dias_trabalhados,
    Faltas: s.faltas,
    Atestados: s.atestados,
    Férias: s.ferias,
    Licenças: s.licencas,
    Abonos: s.abonos,
    "% Presença": Number(s.percentual_presenca.toFixed(1)),
  };
}
