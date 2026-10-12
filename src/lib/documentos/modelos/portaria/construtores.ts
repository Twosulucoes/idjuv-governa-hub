import type { TenantConfig } from '@/core/tenant';
import type { Artigo, ConfiguracaoAssinatura, ConfiguracaoTabela } from '@/types/portariaUnificada';
import type { DadosPortariaModelo } from './modelo';
import { tabelaDeServidores, type ServidorTabela } from './tabelaServidores';
import { assinaturaDirigente, formatarCPF, localDoAto, preambulo, tituloPortaria } from './textos';

type Portaria = { numero: string; data_documento: string };
type Servidor = { nome_completo: string; cpf: string; matricula?: string };
type Cargo = { nome: string; sigla?: string; simbolo?: string };
type Unidade = { nome: string; sigla?: string };

const base = (t: TenantConfig, p: Portaria) => ({
  titulo: tituloPortaria(t, p.numero, p.data_documento),
  dataDocumento: p.data_documento,
  assinatura: assinaturaDirigente(t),
});
const ARTIGO_VIGOR = { numero: '2º', conteudo: 'Esta Portaria entra em vigor na data de sua publicação.' };

export function dadosNomeacao(t: TenantConfig, p: Portaria, s: Servidor, c: Cargo): DadosPortariaModelo {
  const simbolo = c.simbolo ? `, código ${c.simbolo}` : '';
  return {
    ...base(t, p), preambulo: preambulo(t), resolve: true,
    artigos: [
      { numero: '1º', conteudo: `NOMEAR ${s.nome_completo.toUpperCase()}, para exercer o cargo em comissão de ${c.nome.toUpperCase()}${simbolo}, integrante da estrutura organizacional do ${t.identidade.nomeOficial}.` },
      ARTIGO_VIGOR,
    ],
  };
}

export function dadosExoneracao(t: TenantConfig, p: Portaria, s: Servidor, c: Cargo, u: Unidade, motivo: 'pedido' | 'oficio' = 'pedido'): DadosPortariaModelo {
  const motivoTexto = motivo === 'pedido' ? 'a pedido' : 'de ofício';
  return {
    ...base(t, p), preambulo: preambulo(t), resolve: true,
    artigos: [
      { numero: '1º', conteudo: `EXONERAR, ${motivoTexto}, ${s.nome_completo.toUpperCase()}, inscrito(a) no CPF nº ${formatarCPF(s.cpf)}, do cargo de ${c.nome}, no(a) ${u.nome}, do ${t.identidade.nomeOficial}.` },
      ARTIGO_VIGOR,
    ],
  };
}

export function dadosDesignacao(t: TenantConfig, p: Portaria, s: Servidor, c: Cargo, origem: Unidade, destino: Unidade): DadosPortariaModelo {
  return {
    ...base(t, p), preambulo: preambulo(t), resolve: true,
    artigos: [
      { numero: '1º', conteudo: `DESIGNAR ${s.nome_completo.toUpperCase()}, inscrito(a) no CPF nº ${formatarCPF(s.cpf)}, ocupante do cargo de ${c.nome}, lotado(a) no(a) ${origem.nome}, para exercer suas atividades no(a) ${destino.nome}.` },
      ARTIGO_VIGOR,
    ],
  };
}

const COLUNAS_COLETIVA: ConfiguracaoTabela = {
  habilitada: true, colunasPersonalizadas: [],
  colunas: ['numero', 'nome_completo', 'cpf', 'cargo', 'unidade_setor', 'codigo'],
};
// Rótulos do gerador antigo (diferem de COLUNA_LABELS em "CÓD.").
const ROTULOS_COLETIVA = { numero: 'Nº', nome_completo: 'NOME COMPLETO', cpf: 'CPF', cargo: 'CARGO', unidade_setor: 'UNIDADE/SETOR', codigo: 'CÓD.' } as const;

export function dadosColetiva(t: TenantConfig, p: Portaria, cabecalho: string, servidores: ServidorTabela[], tipoAcao: 'nomeacao' | 'exoneracao' = 'nomeacao'): DadosPortariaModelo {
  const verbo = tipoAcao === 'nomeacao' ? 'NOMEAR' : 'EXONERAR';
  const { colunas, linhas } = tabelaDeServidores(COLUNAS_COLETIVA, servidores, ROTULOS_COLETIVA);
  const lei = t.legal?.leiCriacao ? `, conforme disposto no Anexo I da ${t.legal.leiCriacao}` : '';
  return {
    ...base(t, p), preambulo: cabecalho,
    artigos: [
      { numero: '1º', conteudo: `${verbo} os servidores abaixo relacionados para os respectivos cargos em comissão do ${t.identidade.nomeOficial}:` },
      { numero: '2º', conteudo: `Os nomeados farão jus à remuneração correspondente aos respectivos cargos${lei}.` },
      { numero: '3º', conteudo: 'Esta Portaria entra em vigor na data de sua publicação.' },
    ],
    tabela: { colunas, linhas, depoisDoArtigo: 1 },
    local: localDoAto(t),
  };
}

export function dadosUnificada(t: TenantConfig, p: Portaria, pre: string, artigos: Artigo[], servidores: ServidorTabela[], config: ConfiguracaoTabela, assinatura: ConfiguracaoAssinatura): DadosPortariaModelo {
  const tabela = config.habilitada && servidores.length > 0 ? { ...tabelaDeServidores(config, servidores), depoisDoArtigo: 1 } : undefined;
  return {
    titulo: tituloPortaria(t, p.numero, p.data_documento),
    dataDocumento: p.data_documento,
    preambulo: pre,
    artigos: artigos.map((a) => ({ numero: a.numero, conteudo: a.conteudo })),
    tabela,
    local: assinatura.local,
    assinatura: { nome: assinatura.nome, cargo: assinatura.cargo },
  };
}
