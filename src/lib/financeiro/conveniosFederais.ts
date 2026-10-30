/**
 * Convênios federais (espelho do Transferegov): alertas de prazo e situação que a tela mostra.
 * Os dados chegam todo dia pela rotina scripts/transferegov/sincronizar.mjs; aqui só se lê.
 * Spec: docs/superpowers/specs/2026-10-29-convenios-federais-transferegov-design.md
 */

export type TomAlerta = "erro" | "pendente" | "neutro";

export interface AlertaConvenio {
  tom: TomAlerta;
  texto: string;
}

/** Quantos dias antes do prazo o alerta aparece. */
export const DIAS_AVISO_PRAZO = 60;

/** A rotina roda todo dia; depois disso o espelho é tratado como desatualizado. */
export const DIAS_ESPELHO_DESATUALIZADO = 3;

export interface ConvenioParaAlerta {
  assinado: boolean | null;
  fim_vigencia: string | null;
  data_limite_prestacao_contas: string | null;
}

/** Dias de `hoje` até a data (AAAA-MM-DD); negativo quando já passou. */
export function diasAte(data: string | null, hoje: Date): number | null {
  if (!data) return null;
  const [a, m, d] = data.slice(0, 10).split("-").map(Number);
  if (!a || !m || !d) return null;
  const alvo = Date.UTC(a, m - 1, d);
  const base = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.round((alvo - base) / 86_400_000);
}

function prazo(rotulo: string, dias: number | null): AlertaConvenio | null {
  if (dias === null || dias > DIAS_AVISO_PRAZO) return null;
  if (dias < 0) return { tom: "erro", texto: `${rotulo} venceu há ${-dias} dia${dias === -1 ? "" : "s"}` };
  if (dias === 0) return { tom: "erro", texto: `${rotulo} vence hoje` };
  return { tom: "pendente", texto: `${rotulo} vence em ${dias} dia${dias === 1 ? "" : "s"}` };
}

/** Alertas de um convênio, do mais grave para o mais leve. Sem convênio (só proposta), não há alerta. */
export function alertasConvenio(c: ConvenioParaAlerta | null | undefined, hoje: Date = new Date()): AlertaConvenio[] {
  if (!c) return [];
  const alertas: AlertaConvenio[] = [];
  if (c.assinado === false) alertas.push({ tom: "pendente", texto: "Instrumento ainda não assinado" });
  const vigencia = prazo("Vigência", diasAte(c.fim_vigencia, hoje));
  if (vigencia) alertas.push(vigencia);
  const prestacao = prazo("Prestação de contas", diasAte(c.data_limite_prestacao_contas, hoje));
  if (prestacao) alertas.push(prestacao);
  const peso: Record<TomAlerta, number> = { erro: 0, pendente: 1, neutro: 2 };
  return alertas.sort((x, y) => peso[x.tom] - peso[y.tom]);
}

/** Se a última sincronização ficou para trás (rotina parada ou sem configuração). */
export function espelhoDesatualizado(executadaEm: string | null | undefined, agora: Date = new Date()): boolean {
  if (!executadaEm) return true;
  const quando = Date.parse(executadaEm);
  if (Number.isNaN(quando)) return true;
  return agora.getTime() - quando > DIAS_ESPELHO_DESATUALIZADO * 86_400_000;
}

/** Percentual de `parte` em `total` (0 a 100, arredondado), ou null sem total. */
export function percentual(parte: number | null | undefined, total: number | null | undefined): number | null {
  const t = Number(total ?? 0);
  if (!t) return null;
  return Math.min(100, Math.max(0, Math.round((Number(parte ?? 0) / t) * 100)));
}

const TIPOS_AUTOR: Record<string, string> = {
  COMISSAO: "Comissão",
  BANCADA: "Bancada",
  INDIVIDUAL: "Individual",
  RELATOR: "Relator-geral",
};

/** Tipo do autor da emenda como o Transferegov escreve (COMISSAO, BANCADA...) → rótulo da tela. */
export function rotuloTipoAutor(tipo: string): string {
  return TIPOS_AUTOR[tipo.toUpperCase()] ?? tipo.charAt(0).toUpperCase() + tipo.slice(1).toLowerCase();
}

// ---------------------------------------------------------------- histórico de mudanças (fin_tg_mudancas)

export type EntidadeMudanca = "proposta" | "emenda" | "convenio" | "movimento";

export interface MudancaParaDescrever {
  entidade: string;
  tipo: string;
  chave: string;
  campo: string | null;
  valor_anterior: string | null;
  valor_novo: string | null;
  dados: unknown;
}

const ROTULO_ENTIDADE: Record<EntidadeMudanca, string> = {
  proposta: "Proposta",
  emenda: "Emenda",
  convenio: "Convênio",
  movimento: "Movimento",
};

/** Nome que a tela dá a cada coluna do espelho. */
export const ROTULO_CAMPO: Record<string, string> = {
  situacao: "Situação",
  subsituacao: "Subsituação",
  situacao_publicacao: "Publicação",
  situacao_projeto_basico: "Projeto básico",
  instrumento_ativo: "Instrumento ativo",
  assinado: "Assinado",
  objeto: "Objeto",
  numero_processo: "Processo na União",
  data_assinatura: "Data da assinatura",
  data_publicacao: "Data da publicação",
  inicio_vigencia: "Início da vigência",
  fim_vigencia: "Fim da vigência",
  fim_vigencia_original: "Fim da vigência original",
  data_limite_prestacao_contas: "Prazo da prestação de contas",
  dias_prestacao_contas: "Dias para prestar contas",
  qtd_aditivos: "Aditivos",
  qtd_prorrogacoes: "Prorrogações",
  valor_global: "Valor global",
  valor_global_original: "Valor global original",
  valor_repasse: "Repasse",
  valor_contrapartida: "Contrapartida",
  valor_empenhado: "Empenhado pela União",
  valor_desembolsado: "Desembolsado",
  saldo_conta: "Saldo na conta",
  rendimento_aplicacao: "Rendimento da aplicação",
  ingresso_contrapartida: "Contrapartida depositada",
  saldo_reman_tesouro: "Saldo remanescente (Tesouro)",
  saldo_reman_convenente: "Saldo remanescente (convenente)",
  valor_repasse_emenda: "Valor da emenda",
  valor_repasse_proposta: "Repasse da emenda na proposta",
  parlamentar: "Autor da emenda",
  impositiva: "Impositiva",
  valor: "Valor",
  data: "Data",
  numero: "Número",
  descricao: "Descrição",
  indicacao: "Indicação",
  banco: "Banco",
  agencia: "Agência",
  conta: "Conta",
};

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** Valor guardado como texto (jsonb ->>) no jeito da tela: data, sim/não, dinheiro ou o texto. */
export function formatarValorMudanca(campo: string, valor: string | null): string {
  if (valor === null || valor === "") return "vazio";
  if (valor === "true") return "Sim";
  if (valor === "false") return "Não";
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor.split("-").reverse().join("/");
  if ((campo.startsWith("valor") || campo.startsWith("saldo") || campo === "rendimento_aplicacao" || campo === "ingresso_contrapartida")
      && /^-?\d+(\.\d+)?$/.test(valor)) {
    return moeda.format(Number(valor));
  }
  return valor;
}

function nomeDoItem(m: MudancaParaDescrever): string {
  const d = (m.dados ?? {}) as Record<string, unknown>;
  if (m.entidade === "movimento") {
    const tipo = String(d.tipo ?? m.chave.split(":")[0]) === "desembolso" ? "Desembolso" : "Empenho da União";
    const numero = d.numero ? ` ${d.numero}` : "";
    const valor = d.valor !== undefined && d.valor !== null ? ` de ${moeda.format(Number(d.valor))}` : "";
    return `${tipo}${numero}${valor}`;
  }
  if (m.entidade === "emenda") return `Emenda ${String(d.numero_emenda ?? m.chave.split(":")[1] ?? "")}`.trim();
  if (m.entidade === "convenio") return `Convênio ${m.chave}`;
  return `Proposta ${String(d.numero ?? m.chave)}`;
}

/** Frase curta para a lista "O que mudou". */
export function descreverMudanca(m: MudancaParaDescrever): string {
  if (m.tipo === "novo") return `${nomeDoItem(m)}: novo no Transferegov`;
  if (m.tipo === "removido") return `${nomeDoItem(m)}: saiu do Transferegov`;
  const campo = m.campo ?? "";
  const entidade = ROTULO_ENTIDADE[m.entidade as EntidadeMudanca] ?? m.entidade;
  const rotulo = ROTULO_CAMPO[campo] ?? campo.replace(/_/g, " ");
  return `${entidade} · ${rotulo}: ${formatarValorMudanca(campo, m.valor_anterior)} → ${formatarValorMudanca(campo, m.valor_novo)}`;
}
