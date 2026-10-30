/**
 * Dados da ficha do contrato em PDF (modelo contratos-ficha-contrato) a partir do que a tela já carregou: o contrato,
 * os itens e as designações. Datas em dd/mm/aaaa e textos prontos; o modelo só desenha.
 */

import type { DadosFichaContrato } from "@/lib/documentos/modelos/contratos/fichaContrato";
import { mascararDocumento } from "@/lib/bancario/comum";
import { formatCurrency, formatDateBR } from "@/lib/formatters";
import { avisosLimites, dataAlteracao, efeitosAlteracao, ordenarAlteracoes, tituloAlteracao } from "@/lib/contratos/alteracoes";
import { descricaoPortaria, ordenarPorPapel, periodoDesignacao } from "@/lib/contratos/responsaveis";
import { descricaoVigencia, situacaoVigencia } from "@/lib/contratos/vigencia";
import {
  rotuloPapel,
  rotuloSituacaoContrato,
  rotuloTipoContrato,
  type ContratoAlteracao,
  type ContratoFicha,
  type ContratoResponsavel,
  type ItemContrato,
} from "@/types/contratos";

const ou = (v: string | null | undefined) => (v && v.trim() ? v.trim() : undefined);

export function montarFichaContrato(
  c: ContratoFicha,
  itens: ItemContrato[],
  responsaveis: ContratoResponsavel[],
  alteracoes: ContratoAlteracao[],
  processoContratacao?: string,
  hoje: Date | string = new Date(),
): DadosFichaContrato {
  const mudouFim = c.data_fim_atual && c.data_fim_atual !== c.data_fim;
  const fimAtual = mudouFim
    ? `, ${c.status === "rescindido" ? "encerrada pela rescisão em" : "prorrogada até"} ${formatDateBR(c.data_fim_atual)}`
    : "";
  const garantia = c.garantia_tipo
    ? [
        c.garantia_tipo,
        c.garantia_valor !== null && c.garantia_valor !== undefined ? formatCurrency(Number(c.garantia_valor)) : null,
        c.garantia_vencimento ? `vence em ${formatDateBR(c.garantia_vencimento)}` : null,
      ].filter(Boolean).join(" · ")
    : undefined;
  const designacao = (r: ContratoResponsavel) => ({
    nome: r.nome,
    papel: rotuloPapel(r.papel),
    portaria: descricaoPortaria(r) ?? undefined,
    periodo: periodoDesignacao(r),
  });

  return {
    numero: `${c.numero_contrato}/${c.ano}`,
    situacao: rotuloSituacaoContrato(c.status),
    vigenciaSituacao: descricaoVigencia(situacaoVigencia(c, hoje)),
    contratado: c.fornecedor?.razao_social ?? "—",
    documentoContratado: c.fornecedor?.cpf_cnpj ? mascararDocumento(c.fornecedor.cpf_cnpj) : undefined,
    objeto: c.objeto,
    tipo: c.tipo_contrato ? rotuloTipoContrato(c.tipo_contrato) : undefined,
    fundamento: ou(c.fundamento_legal),
    processoSei: ou(c.processo_sei),
    processoContratacao: ou(processoContratacao),
    numeroPncp: ou(c.numero_pncp),
    setor: c.unidade ? [c.unidade.sigla, c.unidade.nome].filter(Boolean).join(" · ") : undefined,
    natureza: ou(c.natureza_despesa),
    dotacao: [c.dotacao_orcamentaria, c.fonte_recurso && `fonte ${c.fonte_recurso}`].filter(Boolean).join(" · ") || undefined,
    valorInicial: Number(c.valor_inicial),
    valorAtual: Number(c.valor_atual),
    assinatura: formatDateBR(c.data_assinatura),
    vigencia: `${formatDateBR(c.data_inicio)} a ${formatDateBR(c.data_fim)}${fimAtual}`,
    prorrogacao: c.prorrogavel
      ? `Prorrogável${c.prazo_maximo_meses ? `, até ${c.prazo_maximo_meses} meses` : ""}`
      : "Não prorrogável",
    publicacaoDoe: c.data_publicacao_doe
      ? `${formatDateBR(c.data_publicacao_doe)}${c.numero_doe ? ` (DOE nº ${c.numero_doe})` : ""}`
      : undefined,
    garantia,
    alteracoes: ordenarAlteracoes(alteracoes).map((a) => {
      const data = dataAlteracao(a);
      return {
        data: data ? formatDateBR(data) : "",
        alteracao: tituloAlteracao(a),
        efeito: efeitosAlteracao(a).join("; ") || a.descricao,
        documento: [
          a.processo_sei && `Processo ${a.processo_sei}`,
          a.documento_sei && `documento ${a.documento_sei}`,
          a.data_publicacao_doe && `DOE ${formatDateBR(a.data_publicacao_doe)}${a.numero_doe ? ` nº ${a.numero_doe}` : ""}`,
        ].filter(Boolean).join(" · "),
      };
    }),
    avisosAlteracoes: avisosLimites(c, alteracoes),
    responsaveis: ordenarPorPapel(responsaveis.filter((r) => !r.data_fim)).map(designacao),
    responsaveisAnteriores: responsaveis.filter((r) => r.data_fim).map(designacao),
    itens: itens.map((i) => ({
      numero: i.numero_item,
      descricao: i.descricao,
      unidade: i.unidade_medida,
      quantidade: Number(i.quantidade),
      valorUnitario: Number(i.valor_unitario),
      valorTotal: Number(i.valor_total ?? Number(i.quantidade) * Number(i.valor_unitario)),
    })),
    observacoes: ou(c.observacoes),
  };
}
