/**
 * Prazos da LAI exibidos no portal do e-SIC, lidos da parametrização `prazos_lai`.
 *
 * O padrão da Lei nº 12.527/2011 (resposta em 20 dias prorrogáveis por mais 10;
 * recursos em 10 dias — arts. 11, 15 e 16) só vale quando a tabela não traz o prazo:
 * vazia, sem a linha ou sem permissão de leitura para quem está na página.
 */

export interface PrazoLai {
  tipo_prazo: string;
  prazo_dias: number;
  prorrogavel: boolean | null;
  prorrogacao_dias: number | null;
  dias_uteis: boolean | null;
}

export interface PrazosLaiExibicao {
  resposta: string;
  recursoPrimeira: string;
  recursoSegunda: string;
}

/** Padrão legal (Lei nº 12.527/2011), usado só na falta da linha em `prazos_lai`. */
const PADRAO_LAI: Record<string, PrazoLai> = {
  resposta_inicial: { tipo_prazo: 'resposta_inicial', prazo_dias: 20, prorrogavel: true, prorrogacao_dias: 10, dias_uteis: true },
  recurso_primeira_instancia: { tipo_prazo: 'recurso_primeira_instancia', prazo_dias: 10, prorrogavel: false, prorrogacao_dias: 0, dias_uteis: true },
  recurso_segunda_instancia: { tipo_prazo: 'recurso_segunda_instancia', prazo_dias: 10, prorrogavel: false, prorrogacao_dias: 0, dias_uteis: true },
};

function dias(p: PrazoLai): string {
  return `${p.prazo_dias} dia${p.prazo_dias === 1 ? '' : 's'}${p.dias_uteis ? (p.prazo_dias === 1 ? ' útil' : ' úteis') : ''}`;
}

export function prazosLaiParaExibicao(linhas: PrazoLai[] | null | undefined): PrazosLaiExibicao {
  const doBanco = new Map((linhas ?? []).map((l) => [l.tipo_prazo, l]));
  const obter = (tipo: string) => doBanco.get(tipo) ?? PADRAO_LAI[tipo];

  const resposta = obter('resposta_inicial');
  const prorrogacao =
    resposta.prorrogavel && resposta.prorrogacao_dias ? ` (prorrogável por +${resposta.prorrogacao_dias})` : '';

  return {
    resposta: `${dias(resposta)}${prorrogacao}`,
    recursoPrimeira: `${dias(obter('recurso_primeira_instancia'))} após resposta`,
    recursoSegunda: `${dias(obter('recurso_segunda_instancia'))} após 1ª instância`,
  };
}
