import { assinaturas, localData, manterJunto, paragrafo, tabela } from '../../blocos';
import type { Celula, ColunaTabela } from '../../blocos';
import { paraNomeArquivo } from '../../core/texto';
import type { Bloco, DocumentoModelo } from '../../tipos';
import { dataExtenso } from './textos';

export interface DadosPortariaModelo {
  /** Já montado pelos construtores: "PORTARIA Nº 12/…/2026 DE 05 DE OUTUBRO DE 2026". */
  titulo: string;
  /** ISO yyyy-mm-dd; usada na linha de local e data. */
  dataDocumento: string;
  preambulo: string;
  /** Imprime "RESOLVE:" depois do preâmbulo (as portarias simples têm; a unificada traz no preâmbulo). */
  resolve?: boolean;
  artigos: { numero: string; conteudo: string }[];
  /** Tabela impressa DEPOIS do artigo de número `depoisDoArtigo` (1 = depois do 1º). */
  tabela?: { colunas: ColunaTabela[]; linhas: Record<string, Celula>[]; depoisDoArtigo?: number };
  /** Linha "Local, data por extenso." antes da assinatura (as portarias simples não têm). */
  local?: string;
  assinatura: { nome: string; cargo: string };
  protocolo?: string;
  unidadeEmissora?: string[];
}

export const portariaModelo: DocumentoModelo<DadosPortariaModelo> = {
  tipo: 'portaria',
  familia: 'ato',
  titulo: (d) => d.titulo,
  // O título já vem na forma oficial ("…/IDJuv/PRESI/GAB/…"): a caixa da sigla não pode mudar.
  tituloComoEscrito: true,
  protocolo: (d) => d.protocolo,
  unidadeEmissora: (d) => d.unidadeEmissora ?? [],
  nomeArquivo: (d) => `${paraNomeArquivo(d.titulo.split(' DE ')[0])}.pdf`,
  blocos: (d) => {
    const corpo: { bloco: Bloco; artigo: boolean }[] = [];
    const apos = d.tabela?.depoisDoArtigo ?? 1;
    d.artigos.forEach((a, i) => {
      corpo.push({ bloco: paragrafo({ texto: `Art. ${a.numero} ${a.conteudo}`, alinhamento: 'justificado' }), artigo: true });
      if (d.tabela && i === apos - 1) corpo.push({ bloco: tabela({ colunas: d.tabela.colunas, linhas: d.tabela.linhas }), artigo: false });
    });
    if (d.tabela && d.artigos.length < apos) corpo.push({ bloco: tabela({ colunas: d.tabela.colunas, linhas: d.tabela.linhas }), artigo: false });

    // O último artigo (quando não é seguido por tabela) viaja com o local/data e a assinatura: nunca assinatura isolada.
    const ultimo = corpo[corpo.length - 1]?.artigo ? corpo.pop()!.bloco : undefined;
    const fecho: Bloco[] = [
      ...(d.local ? [localData({ local: d.local, data: dataExtenso(d.dataDocumento) })] : []),
      assinaturas({ assinantes: [{ nome: d.assinatura.nome, cargo: d.assinatura.cargo }] }),
    ];
    return [
      paragrafo({ texto: d.preambulo, alinhamento: 'justificado' }),
      ...(d.resolve ? [paragrafo({ texto: 'RESOLVE:', negrito: true })] : []),
      ...corpo.map((c) => c.bloco),
      manterJunto(...(ultimo ? [ultimo] : []), ...fecho),
    ];
  },
};
