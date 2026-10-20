import type { TipoUnidade, UnidadeOrganizacional } from '@/types/organograma';

/**
 * Estrutura fictícia do organograma: 40 unidades em 4 níveis (1 + 6 + 12 + 21), com e sem sigla,
 * com responsável oficial e lotados por cargo. Nada de órgão real.
 */
type Linha = [id: string, sigla: string | undefined, nome: string, tipo: TipoUnidade, nivel: number, superior?: string];

const LINHAS: Linha[] = [
  ['pres', 'PRES', 'Presidência', 'presidencia', 1],
  ['gab', 'GAB', 'Gabinete da Presidência', 'assessoria', 2, 'pres'],
  ['asjur', 'ASJUR', 'Assessoria Jurídica', 'assessoria', 2, 'pres'],
  ['ascom', 'ASCOM', 'Assessoria de Comunicação', 'assessoria', 2, 'pres'],
  ['diraf', 'DIRAF', 'Diretoria de Administração e Finanças', 'diretoria', 2, 'pres'],
  ['diresp', 'DIRESP', 'Diretoria de Esporte', 'diretoria', 2, 'pres'],
  ['dirjuv', 'DIRJUV', 'Diretoria de Juventude e Lazer', 'diretoria', 2, 'pres'],
  ['divrh', 'DIVRH', 'Divisão de Recursos Humanos', 'divisao', 3, 'diraf'],
  ['divfin', 'DIVFIN', 'Divisão Financeira', 'divisao', 3, 'diraf'],
  ['divpat', 'DIVPAT', 'Divisão de Patrimônio', 'divisao', 3, 'diraf'],
  ['divcomp', 'DIVCOMP', 'Divisão de Compras e Contratos', 'divisao', 3, 'diraf'],
  ['divesp', 'DIVESP', 'Divisão de Esporte de Rendimento', 'divisao', 3, 'diresp'],
  ['divevt', 'DIVEVT', 'Divisão de Eventos Esportivos', 'divisao', 3, 'diresp'],
  ['divinf', 'DIVINF', 'Divisão de Infraestrutura Esportiva', 'divisao', 3, 'diresp'],
  ['divpar', 'DIVPAR', 'Divisão de Esporte Paralímpico', 'divisao', 3, 'diresp'],
  ['divjuv', 'DIVJUV', 'Divisão de Políticas para a Juventude', 'divisao', 3, 'dirjuv'],
  ['divlaz', 'DIVLAZ', 'Divisão de Lazer Comunitário', 'divisao', 3, 'dirjuv'],
  ['divpro', 'DIVPRO', 'Divisão de Programas Sociais', 'divisao', 3, 'dirjuv'],
  ['divcid', 'DIVCID', 'Divisão de Cidadania', 'divisao', 3, 'dirjuv'],
  ['nucfp', 'NUCFP', 'Núcleo de Folha de Pagamento', 'nucleo', 4, 'divrh'],
  ['nucdp', 'NUCDP', 'Núcleo de Desenvolvimento de Pessoas', 'nucleo', 4, 'divrh'],
  ['nucct', 'NUCCT', 'Núcleo de Contabilidade', 'nucleo', 4, 'divfin'],
  ['nucte', 'NUCTE', 'Núcleo de Tesouraria', 'nucleo', 4, 'divfin'],
  ['nucalm', 'NUCALM', 'Núcleo de Almoxarifado', 'nucleo', 4, 'divpat'],
  ['nucbm', 'NUCBM', 'Núcleo de Bens Móveis', 'nucleo', 4, 'divpat'],
  ['nuclic', 'NUCLIC', 'Núcleo de Licitações', 'nucleo', 4, 'divcomp'],
  ['nucconv', undefined, 'Núcleo de Acompanhamento de Convênios e Parcerias Institucionais', 'nucleo', 4, 'divcomp'],
  ['nucbase', 'NUCBASE', 'Núcleo de Esporte de Base', 'nucleo', 4, 'divesp'],
  ['nucalto', 'NUCALTO', 'Núcleo de Alto Rendimento', 'nucleo', 4, 'divesp'],
  ['nuccal', 'NUCCAL', 'Núcleo de Calendário Esportivo', 'nucleo', 4, 'divevt'],
  ['nucgin', 'NUCGIN', 'Núcleo de Ginásios', 'nucleo', 4, 'divinf'],
  ['nucest', 'NUCEST', 'Núcleo de Estádios', 'nucleo', 4, 'divinf'],
  ['nucpar', 'NUCPAR', 'Núcleo de Atletas Paralímpicos', 'nucleo', 4, 'divpar'],
  ['nucprot', 'NUCPROT', 'Núcleo de Protagonismo Juvenil', 'nucleo', 4, 'divjuv'],
  ['nucconj', 'NUCCONJ', 'Núcleo do Conselho de Juventude', 'nucleo', 4, 'divjuv'],
  ['nucpra', 'NUCPRA', 'Núcleo de Praças e Parques', 'nucleo', 4, 'divlaz'],
  ['nucbol', 'NUCBOL', 'Núcleo de Bolsas', 'nucleo', 4, 'divpro'],
  ['nucinc', 'NUCINC', 'Núcleo de Inclusão', 'nucleo', 4, 'divpro'],
  ['nucvol', 'NUCVOL', 'Núcleo de Voluntariado', 'nucleo', 4, 'divcid'],
  ['nucdir', 'NUCDIR', 'Núcleo de Direitos Humanos', 'nucleo', 4, 'divcid'],
];

const RESPONSAVEIS: Record<string, string> = {
  pres: 'Maria Fictícia da Presidência',
  diraf: 'João Exemplo de Administração',
  divrh: 'Ana Teste dos Recursos Humanos',
};

export const unidadesOrganograma: UnidadeOrganizacional[] = LINHAS.map(([id, sigla, nome, tipo, nivel, superior]) => ({
  id,
  sigla,
  nome,
  tipo,
  nivel,
  superior_id: superior ?? (null as unknown as undefined),
  ativo: true,
  servidor_responsavel: RESPONSAVEIS[id] ? { id: `r-${id}`, full_name: RESPONSAVEIS[id] } : undefined,
}));

const indice = (id: string): number => LINHAS.findIndex((l) => l[0] === id);

/** Quantidade lotada na própria unidade (0 a 12). */
export const contarServidoresOrganograma = (id: string): number => (indice(id) * 7) % 13;

/** Lotados por cargo vinculado à unidade: 0 a 6 por unidade; a presidência repete a responsável (não pode duplicar). */
export const servidoresPorCargoOrganograma = (id: string): { nome: string; cargo: string }[] => {
  const i = indice(id);
  const lista = Array.from({ length: i % 7 }, (_, k) => ({ nome: `Servidor Fictício ${i}-${k + 1}`, cargo: k === 0 ? 'Chefe da unidade' : 'Assessor técnico' }));
  if (id === 'pres') lista.unshift({ nome: 'MARIA FICTÍCIA DA PRESIDÊNCIA', cargo: 'Presidente' });
  return lista;
};
