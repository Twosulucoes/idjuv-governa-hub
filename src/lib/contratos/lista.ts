/**
 * Regras puras da lista e do painel de Contratos: o filtro de prazo (em vigor, vence em até N dias, vencidos, sem
 * gestor ou fiscal), os números do painel e as linhas da planilha exportada.
 */

import { mascararDocumento } from "@/lib/bancario/comum";
import { formatDateBR } from "@/lib/formatters";
import { descricaoVigencia, situacaoVigencia, FAIXAS_VENCIMENTO, dentroDoPrazo, type SituacaoVigencia } from "@/lib/contratos/vigencia";
import {
  nomeContratado,
  responsaveisAtivos,
  rotuloSituacaoContrato,
  rotuloTipoContrato,
  type ContratoLista,
  type ContratoResponsavel,
} from "@/types/contratos";

export type FiltroPrazo = "todos" | "em_vigor" | "30" | "60" | "90" | "120" | "vencidos" | "sem_responsavel";

export const FILTROS_PRAZO: readonly { value: FiltroPrazo; label: string }[] = [
  { value: "todos", label: "Prazo: todos" },
  { value: "em_vigor", label: "Em vigor" },
  ...FAIXAS_VENCIMENTO.map((f) => ({ value: String(f.dias) as FiltroPrazo, label: `Vencem em até ${f.dias} dias` })),
  { value: "vencidos", label: "Vencidos sem encerrar" },
  { value: "sem_responsavel", label: "Em vigor sem gestor ou fiscal" },
];

export const ehFiltroPrazo = (v: string | null): v is FiltroPrazo => FILTROS_PRAZO.some((f) => f.value === v);

type ContratoPrazo = Pick<ContratoLista, "status" | "data_fim" | "data_fim_atual"> & {
  responsaveis: Pick<ContratoResponsavel, "papel" | "data_fim">[];
};

/** Em vigor: nem rascunho, nem encerrado/rescindido, nem com a vigência vencida. Suspenso conta. */
export const emVigor = (s: SituacaoVigencia) => s.faixa !== "rascunho" && s.faixa !== "encerrado" && s.faixa !== "vencido";

export function semGestorOuFiscal(responsaveis: Pick<ContratoResponsavel, "papel" | "data_fim">[]): boolean {
  // substituto só atua na falta do titular: sozinho, o contrato continua sem fiscal (art. 117 da Lei 14.133)
  const { gestor, fiscaisTitulares } = responsaveisAtivos(responsaveis);
  return !gestor || fiscaisTitulares.length === 0;
}

export function passaNoFiltroPrazo(c: ContratoPrazo, filtro: FiltroPrazo, hoje: Date | string = new Date()): boolean {
  if (filtro === "todos") return true;
  const s = situacaoVigencia(c, hoje);
  if (filtro === "em_vigor") return emVigor(s);
  if (filtro === "vencidos") return s.faixa === "vencido";
  if (filtro === "sem_responsavel") return emVigor(s) && semGestorOuFiscal(c.responsaveis);
  return dentroDoPrazo(s, Number(filtro));
}

export interface ResumoPainel {
  emVigor: number;
  vencem90: number;
  vencidos: number;
  semResponsavel: number;
  valorEmVigor: number;
}

export function resumoPainel(lista: (ContratoPrazo & Pick<ContratoLista, "valor_atual">)[], hoje: Date | string = new Date()): ResumoPainel {
  const r: ResumoPainel = { emVigor: 0, vencem90: 0, vencidos: 0, semResponsavel: 0, valorEmVigor: 0 };
  for (const c of lista) {
    const s = situacaoVigencia(c, hoje);
    if (s.faixa === "vencido") r.vencidos += 1;
    if (!emVigor(s)) continue;
    r.emVigor += 1;
    r.valorEmVigor += Number(c.valor_atual ?? 0);
    if (dentroDoPrazo(s, 90)) r.vencem90 += 1;
    if (semGestorOuFiscal(c.responsaveis)) r.semResponsavel += 1;
  }
  r.valorEmVigor = Math.round(r.valorEmVigor * 100) / 100;
  return r;
}

/** Linhas da planilha "Contratos" exportada da lista (o que está filtrado na tela). */
export function linhasPlanilhaContratos(lista: ContratoLista[], hoje: Date | string = new Date()) {
  return lista.map((c) => {
    const { gestor, fiscais } = responsaveisAtivos(c.responsaveis);
    return {
      "Contrato": `${c.numero_contrato}/${c.ano}`,
      "Processo SEI": c.processo_sei ?? "",
      "Contratado": nomeContratado(c.fornecedor),
      // CPF de contratado pessoa física sai mascarado (LGPD); CNPJ vai inteiro
      "CNPJ ou CPF": c.fornecedor?.cpf_cnpj ? mascararDocumento(c.fornecedor.cpf_cnpj) : "",
      "Objeto": c.objeto_resumido || c.objeto,
      "Tipo": c.tipo_contrato ? rotuloTipoContrato(c.tipo_contrato) : "",
      "Setor": c.unidade?.sigla || c.unidade?.nome || "",
      "Situação": rotuloSituacaoContrato(c.status),
      "Valor inicial": Number(c.valor_inicial),
      "Valor atual": Number(c.valor_atual),
      "Início": formatDateBR(c.data_inicio),
      "Fim (atual)": formatDateBR(c.data_fim_atual || c.data_fim),
      "Prazo": descricaoVigencia(situacaoVigencia(c, hoje)),
      "Gestor": gestor?.nome ?? "",
      "Fiscais": fiscais.map((f) => f.nome).join("; "),
    };
  });
}
