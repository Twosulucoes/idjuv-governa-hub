import { assinaturas, camposChaveValor, paragrafo, quebraPagina, secao, tabela, type Celula, type ColunaTabela } from '../../blocos';
import type { Bloco, DocumentoModelo } from '../../tipos';
import { plural } from './comum';

/**
 * Folha individual de presença do servidor no mês (comprovante assinado pelo servidor e conferido pela
 * chefia). Um modelo para a folha avulsa (um servidor, em branco ou preenchida) e para o lote da unidade
 * (vários servidores, capa opcional): cada servidor ocupa uma página, com 31 linhas de dia como o
 * formulário antigo. Jornada de 8h ou mais usa dois turnos (duas assinaturas por dia); a decisão vem
 * pronta em `doisTurnos` (regra do motor de frequência, fora do PDF).
 */

export const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/** Um dia do mês já resolvido (situação vinda do calendário de dias não úteis e dos registros de ponto). */
export interface DiaFolhaFrequencia {
  /** 1 a 31. */
  dia: number;
  /** 0 = domingo. */
  diaSemana: number;
  /** `util`, `domingo`, `sabado`, `feriado`, `ponto_facultativo`, `recesso`, `ferias`, `licenca`… */
  situacao: string;
  /** Nome do feriado / dia não útil. */
  rotulo?: string;
  /** Horários só na folha preenchida. */
  entrada1?: string;
  saida1?: string;
  entrada2?: string;
  saida2?: string;
}

export interface ServidorFolhaFrequencia {
  nome: string;
  matricula?: string;
  cargo?: string;
  funcao?: string;
  unidade?: string;
  cargaHorariaDiaria: number;
  cargaHorariaSemanal: number;
  /** Dois turnos (entrada/saída/assinatura/abono por turno) ou um. */
  doisTurnos: boolean;
  dias: DiaFolhaFrequencia[];
}

export interface DadosFolhaFrequencia {
  tipo: 'em_branco' | 'preenchida';
  competencia: { mes: number; ano: number };
  /** "Cidade/UF" da sede, para a linha de data; sem ela a linha sai para preencher. */
  local?: string;
  servidores: ServidorFolhaFrequencia[];
  /** Presente quando é o lote de uma unidade. */
  lote?: {
    unidade: { nome: string; sigla?: string };
    /** Primeira página com o resumo do lote. */
    capa: boolean;
    dataGeracao: string;
  };
}

const ultimoDiaDoMes = (ano: number, mes: number): number => new Date(ano, mes, 0).getDate();

/** Texto da coluna de assinatura num dia sem expediente (o servidor não assina). */
function rotuloDoDia(d: DiaFolhaFrequencia): string {
  switch (d.situacao) {
    case 'domingo': return 'DOMINGO';
    case 'sabado': return 'SÁBADO';
    case 'feriado': return d.rotulo || 'FERIADO';
    case 'ferias': return 'FÉRIAS';
    case 'licenca': return 'LICENÇA';
    case 'ponto_facultativo': return 'PTO. FACULTATIVO';
    default: return d.rotulo || d.situacao.toUpperCase();
  }
}

// Pesos em mm da largura útil em retrato (170). "—" marca o que não se preenche; vazio é para preencher.
const COLUNAS_DOIS_TURNOS: ColunaTabela[] = [
  { chave: 'dia', titulo: 'Dia', peso: 15, alinhamento: 'centro' },
  { chave: 'ent1', titulo: 'Ent. 1º', peso: 14, alinhamento: 'centro' },
  { chave: 'sai1', titulo: 'Saí. 1º', peso: 14, alinhamento: 'centro' },
  { chave: 'ass1', titulo: 'Assin. 1º', peso: 32.5, alinhamento: 'centro' },
  { chave: 'abo1', titulo: 'Abono 1º', peso: 17, alinhamento: 'centro' },
  { chave: 'ent2', titulo: 'Ent. 2º', peso: 14, alinhamento: 'centro' },
  { chave: 'sai2', titulo: 'Saí. 2º', peso: 14, alinhamento: 'centro' },
  { chave: 'ass2', titulo: 'Assin. 2º', peso: 32.5, alinhamento: 'centro' },
  { chave: 'abo2', titulo: 'Abono 2º', peso: 17, alinhamento: 'centro' },
];

const COLUNAS_UM_TURNO: ColunaTabela[] = [
  { chave: 'dia', titulo: 'Dia', peso: 15, alinhamento: 'centro' },
  { chave: 'ent1', titulo: 'Entrada', peso: 27, alinhamento: 'centro' },
  { chave: 'sai1', titulo: 'Saída', peso: 27, alinhamento: 'centro' },
  { chave: 'ass1', titulo: 'Assinatura do servidor', peso: 60, alinhamento: 'centro' },
  { chave: 'abo1', titulo: 'Abono chefia', peso: 41, alinhamento: 'centro' },
];

/** Sempre 31 linhas (o formulário tem altura fixa); dias além do fim do mês saem riscados. */
function linhasDoMes(s: ServidorFolhaFrequencia, ano: number, mes: number): Record<string, Celula>[] {
  const ultimo = ultimoDiaDoMes(ano, mes);
  const colunas = s.doisTurnos ? COLUNAS_DOIS_TURNOS : COLUNAS_UM_TURNO;
  const linhas: Record<string, Celula>[] = [];
  for (let n = 1; n <= 31; n++) {
    const dia = n <= ultimo ? s.dias.find((d) => d.dia === n) : undefined;
    if (n > ultimo) {
      linhas.push(Object.fromEntries(colunas.map((c) => [c.chave, '—'])));
      continue;
    }
    const semana = DIAS_SEMANA[dia?.diaSemana ?? new Date(ano, mes - 1, n).getDay()];
    const linha: Record<string, Celula> = { dia: `${String(n).padStart(2, '0')} ${semana}` };
    if (dia && dia.situacao !== 'util') {
      const rotulo = rotuloDoDia(dia);
      Object.assign(linha, { ent1: '—', sai1: '—', ass1: rotulo, abo1: '—' });
      if (s.doisTurnos) Object.assign(linha, { ent2: '—', sai2: '—', ass2: rotulo, abo2: '—' });
    } else if (dia) {
      Object.assign(linha, { ent1: dia.entrada1, sai1: dia.saida1 });
      if (s.doisTurnos) Object.assign(linha, { ent2: dia.entrada2, sai2: dia.saida2 });
    }
    linhas.push(linha);
  }
  return linhas;
}

/**
 * Identificação numa linha de formulário (altura fixa: a folha tem de caber numa página). Cargo e unidade
 * longos são cortados com "…", como no formulário antigo, mas com pelo menos a largura que ele dava.
 */
const COLUNAS_IDENTIFICACAO: ColunaTabela[] = [
  { chave: 'matricula', titulo: 'Matrícula', peso: 17 },
  { chave: 'cargo', titulo: 'Cargo / Função', peso: 45 },
  { chave: 'unidade', titulo: 'Unidade de lotação', peso: 60 },
  { chave: 'competencia', titulo: 'Competência', peso: 24 },
  { chave: 'jornada', titulo: 'Jornada', peso: 24 },
];

function blocosDoServidor(s: ServidorFolhaFrequencia, d: DadosFolhaFrequencia): Bloco[] {
  const { mes, ano } = d.competencia;
  const cargoFuncao = s.funcao ? `${s.cargo || ''} / ${s.funcao}` : s.cargo;
  return [
    camposChaveValor({ colunas: 1, campos: [{ rotulo: 'Servidor(a)', valor: s.nome.toUpperCase() }] }),
    tabela({
      formulario: true,
      colunas: COLUNAS_IDENTIFICACAO,
      linhas: [
        {
          matricula: s.matricula || '—',
          cargo: cargoFuncao || '—',
          unidade: s.unidade || '—',
          competencia: `${MESES[mes - 1]} / ${ano}`,
          jornada: `${s.cargaHorariaDiaria}h/dia · ${s.cargaHorariaSemanal}h/sem`,
        },
      ],
    }),
    tabela({ formulario: true, colunas: s.doisTurnos ? COLUNAS_DOIS_TURNOS : COLUNAS_UM_TURNO, linhas: linhasDoMes(s, ano, mes) }),
    paragrafo({ texto: `${d.local || '_'.repeat(24)}, _______ de ________________________ de ________.` }),
    assinaturas({ assinantes: [{ nome: 'Assinatura do(a) Servidor(a)' }, { nome: 'Visto do(a) Chefe Imediato' }] }),
  ];
}

const TITULO_FOLHA = 'Folha individual de presença';

export const folhaFrequencia: DocumentoModelo<DadosFolhaFrequencia> = {
  tipo: 'rh-folha-frequencia',
  familia: 'comprovante',
  titulo: (d) => (d.lote?.capa ? 'Folha de frequência mensal' : TITULO_FOLHA),
  subtitulo: (d) => (d.lote?.capa ? 'Lote por unidade administrativa' : undefined),
  nomeArquivo: (d) => {
    const { mes, ano } = d.competencia;
    if (d.lote) {
      const sigla = d.lote.unidade.sigla || d.lote.unidade.nome.substring(0, 10);
      return `Frequencia_Lote_${sigla}_${String(mes).padStart(2, '0')}-${ano}.pdf`;
    }
    const nome = (d.servidores[0]?.nome ?? 'servidor').replace(/\s+/g, '_');
    return `Frequencia_${nome}_${MESES[mes - 1]}_${ano}_${d.tipo}.pdf`;
  },
  blocos: (d) => {
    const blocos: Bloco[] = [];
    const capa = d.lote?.capa === true;
    if (d.lote && capa) {
      const { unidade, dataGeracao } = d.lote;
      blocos.push(
        camposChaveValor({
          colunas: 2,
          campos: [
            { rotulo: 'Unidade', valor: unidade.sigla ? `${unidade.sigla} - ${unidade.nome}` : unidade.nome },
            { rotulo: 'Competência', valor: `${MESES[d.competencia.mes - 1]} de ${d.competencia.ano}` },
            { rotulo: 'Servidores', valor: plural(d.servidores.length, 'folha de frequência', 'folhas de frequência') },
            { rotulo: 'Emissão', valor: dataGeracao },
          ],
        }),
        paragrafo({
          texto:
            'Este lote contém as folhas de frequência individuais de cada servidor da unidade.\n' +
            'Cada servidor ocupa exatamente uma página para fins de arquivo e auditoria.',
        }),
      );
    }
    if (d.servidores.length === 0) {
      if (!capa) blocos.push(paragrafo({ texto: 'Nenhum servidor selecionado.' }));
      return blocos;
    }
    d.servidores.forEach((s, i) => {
      // A 1ª folha sem capa fica sob o título do documento; as demais começam em página própria com o título na seção.
      if (capa || i > 0) blocos.push(quebraPagina(), secao({ texto: TITULO_FOLHA.toUpperCase() }));
      blocos.push(...blocosDoServidor(s, d));
    });
    return blocos;
  },
};
